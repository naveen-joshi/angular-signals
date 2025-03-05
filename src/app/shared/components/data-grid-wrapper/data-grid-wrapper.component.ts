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

export type SelectionMode = 'none' | 'single' | 'multiRow';

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
      [rowSelection]="selectionMode() === 'single' ? 'single' : 'multiple'"
      [suppressRowClickSelection]="selectionMode() === 'multiRow'"
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
  uniqueId = input<string>();
  selectionMode = input<SelectionMode>('multiRow', { alias: 'selection-mode' });

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
  readonly #clickedRowId = signal<string | null>(null);
  readonly defaultColDef: ColDef = { 
    suppressMovable: true,
    sortable: true,
    filter: true
  };

  readonly transformColDefs$ = toObservable(this.#gridApi).pipe(
    combineLatestWith(toObservable(this.columnDefinitions), toObservable(this.selectionMode)),
    filter(
      ([api, columnDefinitions, mode]) =>
        columnDefinitions !== undefined && api !== undefined
    ),
    map(([api, columnDefinitions, mode]) => {
      const columns: ColDef[] = this.datagridUtility.transformColumnDefinitions(columnDefinitions);
      
      if (mode === 'multiRow') {
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
        columns.unshift(checkboxCol);
      }
      
      return {
        api: api,
        colDef: columns,
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
    const selectedIds = this.#selectedRowIds();
    
    // Clicked row styling - only show if no selections
    if (rowId === this.#clickedRowId() && selectedIds.size === 0) {
      classes.push('clicked-row');
    }
    
    // Selected row styling
    if (params.node.isSelected()) {
      classes.push('selected-row');
      this.#selectedRowIds.update(ids => {
        const newIds = new Set(ids);
        newIds.add(rowId);
        return newIds;
      });
    }
    
    // Disabled row styling for all rows when there are selections
    if (selectedIds.size > 0 && !selectedIds.has(rowId)) {
      classes.push('disabled-row');
    }
    
    return classes.join(' ');
  };

  onRowClicked(event: RowClickedEvent<TData>) {
    const rowId = event.data[this.uniqueId()].toString();
    const selectedIds = this.#selectedRowIds();
    
    // Only allow clicking and update clicked row if no selections
    if (selectedIds.size === 0) {
      this.#clickedRowId.set(rowId);
      this.rowClicked.emit(event.data);
      
      // Force refresh row styles
      this.#gridApi()?.refreshCells({
        force: true,
        rowNodes: [event.node],
        columns: ['checkboxSelection']
      });
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
