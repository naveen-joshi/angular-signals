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
      [rowSelection]="'single'"
      [suppressRowClickSelection]="false"
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
  readonly #selectedRowId: WritableSignal<string | null> = signal(null);
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
      return {
        api: api,
        colDef:
          this.datagridUtility.transformColumnDefinitions(columnDefinitions),
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
      this.#selectedRowId.set(rowId);
    }
    
    // Disabled row styling
    const selectedId = this.#selectedRowId();
    if (selectedId && selectedId !== rowId && !params.node.isSelected()) {
      classes.push('disabled-row');
    }
    
    return classes.join(' ');
  };

  onRowClicked(event: RowClickedEvent<TData>) {
    const rowId = event.data[this.uniqueId()].toString();
    if (this.#selectedRowId() && this.#selectedRowId() !== rowId) {
      return; // Prevent clicking disabled rows
    }
    
    if (!event.node.isSelected()) {
      this.rowClicked.emit(event.data);
    }
  }

  onRowSelected(event: RowSelectedEvent<TData>) {
    if (event.node.isSelected()) {
      this.rowSelected.emit(event.data);
    } else {
      this.#selectedRowId.set(null);
    }
  }

  onSelectionChanged(event: SelectionChangedEvent<TData>) {
    const selectedNodes = event.api.getSelectedNodes();
    const selectedData = selectedNodes.map(node => node.data);
    this.selectionChanged.emit(selectedData);
  }

  // Public methods for external control
  selectAll() {
    this.#gridApi()?.selectAll();
  }

  deselectAll() {
    this.#gridApi()?.deselectAll();
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
