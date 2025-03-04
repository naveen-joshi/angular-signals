import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
  WritableSignal,
} from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import { DataGridColumnDefinitions } from '../data-grid-wrapper/models/data-grid-column-definitions.model';
import {
  CellStyleModule,
  ClientSideRowModelModule,
  ColDef,
  ColumnApiModule,
  GetRowIdParams,
  GridApi,
  ModuleRegistry,
  themeQuartz,
  RowSelectedEvent,
  RowClickedEvent,
  SelectionChangedEvent,
} from 'ag-grid-community';
import { combineLatestWith, map, filter } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { DataGridUtility } from './utility/data-grid-utility';

ModuleRegistry.registerModules([
  CellStyleModule,
  ColumnApiModule,
  ClientSideRowModelModule,
]);

@Component({
  selector: 'app-data-grid-wrapper',
  template: `
    @let cmpObj = {transformColDefs: transformColDefs$ | async, rowData: rowData(), getRowId: getRowId()};
    <ag-grid-angular 
      style="height: 100%;" 
      #agGrid 
      [rowData]="cmpObj.rowData" 
      [theme]="theme" 
      [getRowId]="cmpObj.getRowId" 
      [defaultColDef]="defaultColDef"
      [rowSelection]="'multiple'"
      [suppressRowClickSelection]="true"
      [getRowClass]="getRowClass"
      (gridReady)="onGridReady($event)"
      (rowClicked)="onRowClicked($event)"
      (rowSelected)="onRowSelected($event)"
      (selectionChanged)="onSelectionChanged($event)"
    ></ag-grid-angular>
  `,
  imports: [CommonModule, AgGridAngular],
  providers: [DataGridUtility],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./data-grid-wrapper.component.scss']
})
export class DataGridWrapperComponent<TData> {
  columnDefinitions = input.required<Array<DataGridColumnDefinitions<TData>>>();
  rowData = input.required<Array<TData>>();
  uniqueId = input.required<string>();

  // Output events
  rowClicked = output<TData>();
  rowSelected = output<TData>();
  selectionChanged = output<TData[]>();

  datagridUtility = inject(DataGridUtility<TData>);

  getRowId = computed(
    () => (params: GetRowIdParams<TData>) =>
      params.data[this.uniqueId()].toString()
  );
  readonly theme = themeQuartz;
  readonly #gridApi: WritableSignal<GridApi> = signal(undefined);
  readonly #selectedRowIds = signal<Set<string>>(new Set());
  readonly defaultColDef: ColDef = { 
    suppressMovable: true,
    sortable: true,
    filter: true
  };

  readonly transformColDefs$ = toObservable(this.#gridApi).pipe(
    combineLatestWith(toObservable(this.columnDefinitions)),
    filter(
      ([api, columnDefinitions]) =>
        columnDefinitions !== undefined && api !== undefined
    ),
    map(([api, columnDefinitions]) => {
      const checkboxCol: ColDef = {
        headerName: '',
        field: 'checkboxSelection',
        width: 50,
        pinned: 'left',
        checkboxSelection: true,
        headerCheckboxSelection: true,
        headerCheckboxSelectionFilteredOnly: true,
        cellClass: 'checkbox-cell'
      };
      
      return {
        api: api,
        colDef: [
          checkboxCol,
          ...this.datagridUtility.transformColumnDefinitions(columnDefinitions)
        ],
      };
    }),
    map(({ api, colDef }) => api.setGridOption('columnDefs', colDef))
  );

  onGridReady(params: {api: GridApi}) {
    this.#gridApi.set(params.api);
  }

  getRowClass = (params: any) => {
    const classes: string[] = [];
    const rowId = params.data[this.uniqueId()].toString();
    
    // Base row styling (even/odd)
    classes.push(params.node.rowIndex % 2 === 0 ? 'even-row' : 'odd-row');
    
    // Selected row styling
    if (params.node.isSelected()) {
      classes.push('selected-row');
      this.#selectedRowIds.update(ids => {
        const newIds = new Set(ids);
        newIds.add(rowId);
        return newIds;
      });
    }
    
    // Disabled row styling for non-selected rows when there are selections
    const selectedIds = this.#selectedRowIds();
    if (selectedIds.size > 0 && !selectedIds.has(rowId) && !params.node.isSelected()) {
      classes.push('disabled-row');
    }
    
    return classes.join(' ');
  };

  onRowClicked(event: RowClickedEvent<TData>) {
    const rowId = event.data[this.uniqueId()].toString();
    const selectedIds = this.#selectedRowIds();
    
    // Allow clicking if no rows are selected or if the row is already selected
    if (selectedIds.size === 0 || selectedIds.has(rowId)) {
      this.rowClicked.emit(event.data);
      event.node.setSelected(!event.node.isSelected());
    }
  }

  onRowSelected(event: RowSelectedEvent<TData>) {
    const rowId = event.data[this.uniqueId()].toString();
    
    if (event.node.isSelected()) {
      this.rowSelected.emit(event.data);
      this.#selectedRowIds.update(ids => {
        const newIds = new Set(ids);
        newIds.add(rowId);
        return newIds;
      });
    } else {
      this.#selectedRowIds.update(ids => {
        const newIds = new Set(ids);
        newIds.delete(rowId);
        return newIds;
      });
    }
  }

  onSelectionChanged(event: SelectionChangedEvent<TData>) {
    const selectedNodes = event.api.getSelectedNodes();
    const selectedData = selectedNodes.map(node => node.data);
    
    // Update selected row IDs
    const newSelectedIds = new Set(
      selectedNodes.map(node => node.data[this.uniqueId()].toString())
    );
    this.#selectedRowIds.set(newSelectedIds);
    
    this.selectionChanged.emit(selectedData);
  }

  // Public methods for external control
  selectAll() {
    this.#gridApi()?.selectAll();
  }

  deselectAll() {
    this.#gridApi()?.deselectAll();
    this.#selectedRowIds.set(new Set());
  }

  toggleSelection() {
    const selectedNodes = this.#gridApi()?.getSelectedNodes() || [];
    if (selectedNodes.length > 0) {
      this.deselectAll();
    } else {
      this.selectAll();
    }
  }
}
