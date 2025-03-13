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
  ValidationModule,
  RenderApiModule,
  RowStyleModule,
  RowSelectionOptions,
} from 'ag-grid-community';
import { combineLatestWith, map, filter } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { DataGridUtility } from './utility/data-grid-utility';

ModuleRegistry.registerModules([
  CellStyleModule,
  ColumnApiModule,
  ClientSideRowModelModule,
  RenderApiModule,
  RowStyleModule
]);

enum RowSelectionMode {
  Single = 'singleRow',
  Multiple = 'multiRow'
}

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
      [rowSelection]="selectionMode"
      [getRowClass]="getRowClass"
      (gridReady)="onGridReady($event)"
      (rowClicked)="onRowClicked($event)"
      (rowSelected)="onRowSelected($event)"
      [modules]="modules"
      (selectionChanged)="onSelectionChanged($event)"
    ></ag-grid-angular>
  `,
  imports: [CommonModule, AgGridAngular],
  providers: [DataGridUtility],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./data-grid-wrapper.component.scss']
})
export class DataGridWrapperComponent<TData> {
  modules = [ClientSideRowModelModule, ValidationModule];
  columnDefinitions = input.required<Array<DataGridColumnDefinitions<TData>>>();
  rowData = input.required<Array<TData>>();
  uniqueId = input<string>();
  rowSelection = input<RowSelectionMode>(RowSelectionMode.Multiple);
  get selectionMode() {
    return {mode: this.rowSelection()}
  }

  // Output events
  rowClicked = output<any>();
  rowSelected = output<any>();
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
    combineLatestWith(toObservable(this.columnDefinitions), toObservable(this.rowSelection)),
    filter(
      ([api, columnDefinitions, mode]) =>
        columnDefinitions !== undefined && api !== undefined
    ),
    map(([api, columnDefinitions, mode]) => {
      const columns: ColDef[] = this.datagridUtility.transformColumnDefinitions(columnDefinitions);
      
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
    const rowId = params.data[this.uniqueId()].toString();
    const selectedIds = this.#selectedRowIds();

    if (selectedIds.size > 0 && !selectedIds.has(rowId)) {
      return 'ag-row-disabled';
    }
    
    if (rowId === this.#clickedRowId() && selectedIds.size === 0) {
      return 'ag-row-clicked';
    }
    
    if (selectedIds.has(rowId)) {
      return 'ag-row-selected';
    }
    
    return '';
  };

  onRowClicked(event: RowClickedEvent<TData>) {
    const rowId = event.data[this.uniqueId()].toString();
    const selectedIds = this.#selectedRowIds();
    
    if(selectedIds.size !== 0 && !selectedIds.has(rowId)) {
      return;
    }

    if(this.#clickedRowId() === rowId) {
      return;
    }

    this.#clickedRowId.set(rowId);
    this.emitEvents(event);
    this.selectionChanged.emit([event.data]);
    this.#gridApi()?.redrawRows();
  }

  onRowSelected(event: RowSelectedEvent<TData>) {
    const rowId = event.data[this.uniqueId()].toString();
    
    this.#selectedRowIds.update((ids) => {
      const newIds = new Set(ids);
      if (event.node.isSelected()) {
        this.emitEvents(event);
        newIds.add(rowId);
      } else {
        this.emitEvents(event);
        newIds.delete(rowId);
      }
      return newIds;
    });

    this.#gridApi()?.redrawRows();
  }

  onSelectionChanged(event: SelectionChangedEvent<TData>) {
    const selectedNodes = event.api.getSelectedNodes();
    const selectedData = selectedNodes.map(node => node.data);
    
    // Update selected row IDs
    const newSelectedIds = new Set(
      selectedNodes.map(node => node.data[this.uniqueId()].toString())
    );

    const currentSelectedIds = this.#selectedRowIds();
    if(currentSelectedIds.size === newSelectedIds.size && 
       Array.from(currentSelectedIds).every(id => newSelectedIds.has(id))) {
      return;
    }

    this.#selectedRowIds.set(newSelectedIds);
    this.#clickedRowId.set(null);

    // Emit events for each selected node
    selectedNodes.forEach(node => {
      this.emitEvents({ 
        type: 'rowSelected',
        node,
        data: node.data,
        api: event.api,
        context: event.context,
        rowIndex: 0,
        rowPinned: null,
        source: event.source
      });
    });

    this.selectionChanged.emit(selectedData);
  }

  emitEvents(event: RowClickedEvent<TData> | RowSelectedEvent<TData>) {
    this.rowClicked.emit(event.data);
    this.rowSelected.emit({
      isSelected: event.node.isSelected(),
      data: event.data
    });
  }
}
