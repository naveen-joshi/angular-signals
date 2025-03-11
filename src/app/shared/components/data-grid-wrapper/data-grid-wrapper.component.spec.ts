import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DataGridWrapperComponent } from './data-grid-wrapper.component';
import { 
  RowClickedEvent, 
  RowSelectedEvent, 
  SelectionChangedEvent,
  ModuleRegistry,
  RowSelectionModule,
  GridApi,
  IRowNode
} from 'ag-grid-community';
import { DataGridUtility } from './utility/data-grid-utility';
import { AgGridModule } from 'ag-grid-angular';
import { signal } from '@angular/core';

ModuleRegistry.registerModules([RowSelectionModule]);

describe('DataGridWrapperComponent', () => {
  let component: DataGridWrapperComponent<any>;
  let fixture: ComponentFixture<DataGridWrapperComponent<any>>;
  let mockGridApi: jest.Mocked<GridApi>;

  beforeEach(async () => {
    mockGridApi = {
      redrawRows: jest.fn(),
      getSelectedNodes: jest.fn(),
      setGridOption: jest.fn()
    } as unknown as jest.Mocked<GridApi>;

    await TestBed.configureTestingModule({
      imports: [AgGridModule, DataGridWrapperComponent],
      providers: [DataGridUtility]
    }).compileComponents();
    
    fixture = TestBed.createComponent(DataGridWrapperComponent<any>);
    component = fixture.componentInstance;
    
    // Initialize signals
    (component as any)['#gridApi'] = signal(mockGridApi);
    (component as any)['#selectedRowIds'] = signal(new Set<string>());
    (component as any)['#clickedRowId'] = signal<string | null>(null);
    
    // Set input values
    fixture.componentRef.setInput('columnDefinitions', []);
    fixture.componentRef.setInput('rowData', []);
    fixture.componentRef.setInput('uniqueId', 'id');
    fixture.componentRef.setInput('selectionMode', { mode: 'multiRow' });
    
    fixture.detectChanges();
  });

  describe('onRowClicked', () => {
    it('should not emit events when row is not selected and other selections exist', () => {
      // Arrange
      const mockNode = {
        data: { id: '456' },
        isSelected: () => true
      } as unknown as IRowNode<any>;
      const event: RowSelectedEvent<any> = { 
        data: mockNode.data, 
        node: mockNode,
        type: 'rowSelected',
        rowIndex: 0,
        rowPinned: null,
        api: mockGridApi,
        context: null,
        source: null
      };
      component.onRowSelected(event);  // Set up initial selection

      const clickedMockNode = {
        data: { id: '123' },
        isSelected: () => false
      } as unknown as IRowNode<any>;
      const clickEvent: RowClickedEvent<any> = { 
        data: clickedMockNode.data, 
        node: clickedMockNode,
        type: 'rowClicked',
        rowIndex: 0,
        rowPinned: null,
        api: mockGridApi,
        context: null
      };

      // Act
      const emitEventsSpy = jest.spyOn(component, 'emitEvents');
      component.onRowClicked(clickEvent);

      // Assert
      expect(emitEventsSpy).not.toHaveBeenCalled();
    });

    it('should not emit events when clicked row is already active', () => {
      // Arrange
      const mockNode = {
        data: { id: '123' },
        isSelected: () => false
      } as unknown as IRowNode<any>;
      const clickEvent: RowClickedEvent<any> = { 
        data: mockNode.data, 
        node: mockNode,
        type: 'rowClicked',
        rowIndex: 0,
        rowPinned: null,
        api: mockGridApi,
        context: null
      };

      // First click to set the initial state
      component.onRowClicked(clickEvent);
      expect((component as any)['#clickedRowId']()).toBe('123'); // Verify initial state
      
      // Clear spy history after initial setup
      jest.clearAllMocks();

      // Act - Click the same row again
      const emitEventsSpy = jest.spyOn(component, 'emitEvents');
      component.onRowClicked(clickEvent);

      // Assert
      expect(emitEventsSpy).not.toHaveBeenCalled();
      expect((component as any)['#clickedRowId']()).toBe('123');
    });

    it('should emit events and update clicked row ID', () => {
      // Arrange
      const mockNode = {
        data: { id: '123' },
        isSelected: () => false
      } as unknown as IRowNode<any>;
      const event: RowClickedEvent<any> = { 
        data: mockNode.data, 
        node: mockNode,
        type: 'rowClicked',
        rowIndex: 0,
        rowPinned: null,
        api: mockGridApi,
        context: null
      };

      // Act
      const emitEventsSpy = jest.spyOn(component, 'emitEvents');
      const selectionChangedSpy = jest.spyOn(component.selectionChanged, 'emit');
      component.onRowClicked(event);

      // Assert
      expect(emitEventsSpy).toHaveBeenCalledWith(event);
      expect(selectionChangedSpy).toHaveBeenCalledWith([event.data]);
      expect(mockGridApi.redrawRows).toHaveBeenCalledTimes(1);
      expect((component as any)['#clickedRowId']()).toBe('123');
    });
  });

  describe('onRowSelected', () => {
    it('should add row ID to selected IDs when row is selected', () => {
      // Arrange
      const mockNode = {
        data: { id: '123' },
        isSelected: () => true
      } as unknown as IRowNode<any>;
      const event: RowSelectedEvent<any> = { 
        data: mockNode.data, 
        node: mockNode,
        type: 'rowSelected',
        rowIndex: 0,
        rowPinned: null,
        api: mockGridApi,
        context: null,
        source: null
      };

      // Act
      component.onRowSelected(event);

      // Assert
      expect((component as any)['#selectedRowIds']().has('123')).toBe(true);
      expect(mockGridApi.redrawRows).toHaveBeenCalledTimes(1);
    });

    it('should remove row ID from selected IDs when row is deselected', () => {
      // Arrange
      (component as any)['#selectedRowIds'].set(new Set(['123']));
      const mockNode = {
        data: { id: '123' },
        isSelected: () => false
      } as unknown as IRowNode<any>;
      const event: RowSelectedEvent<any> = { 
        data: mockNode.data, 
        node: mockNode,
        type: 'rowSelected',
        rowIndex: 0,
        rowPinned: null,
        api: mockGridApi,
        context: null,
        source: null
      };

      // Act
      component.onRowSelected(event);

      // Assert
      expect((component as any)['#selectedRowIds']().has('123')).toBe(false);
    });
  });

  describe('onSelectionChanged', () => {
    it('should not update when selected IDs are the same', () => {
      // Arrange
      const selectedIds = new Set(['123']);
      (component as any)['#selectedRowIds'].set(selectedIds);
      
      const mockNode = {
        data: { id: '123' },
        isSelected: () => true
      } as unknown as IRowNode<any>;
      mockGridApi.getSelectedNodes.mockReturnValue([mockNode]);

      const event: SelectionChangedEvent<any> = { 
        api: mockGridApi,
        type: 'selectionChanged',
        source: null,
        context: null
      };

      // Act
      const selectionChangedSpy = jest.spyOn(component.selectionChanged, 'emit');
      component.onSelectionChanged(event);

      // Assert
      expect(selectionChangedSpy).not.toHaveBeenCalled();
      expect((component as any)['#selectedRowIds']()).toEqual(selectedIds);
    });

    it('should update selected IDs and emit selection changed event', () => {
      // Arrange
      const mockNodes = [
        { data: { id: '123' }, isSelected: () => true },
        { data: { id: '456' }, isSelected: () => true }
      ] as unknown as IRowNode<any>[];
      mockGridApi.getSelectedNodes.mockReturnValue(mockNodes);

      const event: SelectionChangedEvent<any> = { 
        api: mockGridApi,
        type: 'selectionChanged',
        source: null,
        context: null
      };

      // Act
      const selectionChangedSpy = jest.spyOn(component.selectionChanged, 'emit');
      component.onSelectionChanged(event);

      // Assert
      const selectedIds = (component as any)['#selectedRowIds']();
      expect(selectedIds.has('123')).toBe(true);
      expect(selectedIds.has('456')).toBe(true);
      expect(selectionChangedSpy).toHaveBeenCalledWith(mockNodes.map(node => node.data));
      expect((component as any)['#clickedRowId']()).toBeNull();
      expect(mockGridApi.redrawRows).toHaveBeenCalledWith({ rowNodes: mockNodes });
    });
  });

  describe('emitEvents', () => {
    it('should emit row clicked and row selected events', () => {
      // Arrange
      const mockNode = {
        data: { id: '123' },
        isSelected: () => true
      } as unknown as IRowNode<any>;
      const event: RowClickedEvent<any> = { 
        data: mockNode.data, 
        node: mockNode,
        type: 'rowClicked',
        rowIndex: 0,
        rowPinned: null,
        api: mockGridApi,
        context: null
      };

      // Act
      const rowClickedSpy = jest.spyOn(component.rowClicked, 'emit');
      const rowSelectedSpy = jest.spyOn(component.rowSelected, 'emit');
      component.emitEvents(event);

      // Assert
      expect(rowClickedSpy).toHaveBeenCalledWith(event.data);
      expect(rowSelectedSpy).toHaveBeenCalledWith({
        isSelected: true,
        data: event.data
      });
    });
  });
});