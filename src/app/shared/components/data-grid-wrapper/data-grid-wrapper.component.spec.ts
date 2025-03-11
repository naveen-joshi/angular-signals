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
  let component: DataGridWrapperComponent<{ id: string }>;
  let fixture: ComponentFixture<DataGridWrapperComponent<{ id: string }>>;
  let mockGridApi: jest.Mocked<GridApi>;

  beforeEach(() => {
    mockGridApi = {
      redrawRows: jest.fn(),
      getSelectedNodes: jest.fn(),
      setGridOption: jest.fn()
    } as unknown as jest.Mocked<GridApi>;

    TestBed.configureTestingModule({
      imports: [DataGridWrapperComponent],
      providers: [DataGridUtility]
    });

    fixture = TestBed.createComponent(DataGridWrapperComponent<{ id: string }>);
    component = fixture.componentInstance;
    
    // Set input values
    fixture.componentRef.setInput('uniqueId', 'id');
    fixture.componentRef.setInput('columnDefinitions', []);
    fixture.componentRef.setInput('rowData', []);
    fixture.componentRef.setInput('selectionMode', { mode: 'multiRow' });
    
    // Initialize component through onGridReady
    component.onGridReady({ api: mockGridApi });
    fixture.detectChanges();
  });

  describe('onRowClicked', () => {
    it('should not emit events when row is not selected and other selections exist', () => {
      // Arrange
      const mockNode = {
        data: { id: '456' },
        isSelected: () => true
      } as unknown as IRowNode<{ id: string }>;
      const event: RowSelectedEvent<{ id: string }> = { 
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
      } as unknown as IRowNode<{ id: string }>;
      const clickEvent: RowClickedEvent<{ id: string }> = { 
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
      const rowData = { id: '123' };
      const mockNode = {
        data: rowData,
        isSelected: () => false
      } as unknown as IRowNode<{ id: string }>;
      const clickEvent: RowClickedEvent<{ id: string }> = { 
        data: mockNode.data, 
        node: mockNode,
        type: 'rowClicked',
        rowIndex: 0,
        rowPinned: null,
        api: mockGridApi,
        context: null
      };

      // First click to set the initial state
      const emitEventsSpy = jest.spyOn(component, 'emitEvents');
      const rowClickedSpy = jest.spyOn(component.rowClicked, 'emit');
      const selectionChangedSpy = jest.spyOn(component.selectionChanged, 'emit');
      
      component.onRowClicked(clickEvent);
      
      // Verify initial click behavior
      expect(emitEventsSpy).toHaveBeenCalledWith(clickEvent);
      expect(rowClickedSpy).toHaveBeenCalledWith(rowData);
      expect(selectionChangedSpy).toHaveBeenCalledWith([rowData]);
      expect(mockGridApi.redrawRows).toHaveBeenCalled();
      
      // Clear spy history after initial setup
      jest.clearAllMocks();

      // Act - Click the same row again
      component.onRowClicked(clickEvent);

      // Assert - No events should be emitted for the second click
      expect(emitEventsSpy).not.toHaveBeenCalled();
      expect(rowClickedSpy).not.toHaveBeenCalled();
      expect(selectionChangedSpy).not.toHaveBeenCalled();
      expect(mockGridApi.redrawRows).not.toHaveBeenCalled();
    });

    it('should emit events and update clicked row ID', () => {
      // Arrange
      const mockNode = {
        data: { id: '123' },
        isSelected: () => false
      } as unknown as IRowNode<{ id: string }>;
      const event: RowClickedEvent<{ id: string }> = { 
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
      expect(component.getClickedRowId()).toBe('123');
    });
  });

  describe('onRowSelected', () => {
    it('should add row ID to selected IDs when row is selected', () => {
      // Arrange
      const mockNode = {
        data: { id: '123' },
        isSelected: () => true
      } as unknown as IRowNode<{ id: string }>;
      const event: RowSelectedEvent<{ id: string }> = { 
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
      expect(component.getSelectedRowIds().has('123')).toBe(true);
      expect(mockGridApi.redrawRows).toHaveBeenCalledTimes(1);
    });

    it('should remove row ID from selected IDs when row is deselected', () => {
      // Arrange
      component.setSelectedRowIds(new Set(['123']));
      const mockNode = {
        data: { id: '123' },
        isSelected: () => false
      } as unknown as IRowNode<{ id: string }>;
      const event: RowSelectedEvent<{ id: string }> = { 
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
      expect(component.getSelectedRowIds().has('123')).toBe(false);
    });
  });

  describe('onSelectionChanged', () => {
    it('should not update when selected IDs are the same', () => {
      // Arrange
      const selectedIds = new Set(['123']);
      component.setSelectedRowIds(selectedIds);
      
      const mockNode = {
        data: { id: '123' },
        isSelected: () => true
      } as unknown as IRowNode<{ id: string }>;
      mockGridApi.getSelectedNodes.mockReturnValue([mockNode]);

      const event: SelectionChangedEvent<{ id: string }> = { 
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
      expect(component.getSelectedRowIds()).toEqual(selectedIds);
    });

    it('should update selected IDs and emit selection changed event', () => {
      // Arrange
      const mockNodes = [
        { data: { id: '123' }, isSelected: () => true },
        { data: { id: '456' }, isSelected: () => true }
      ] as unknown as IRowNode<{ id: string }>[];
      mockGridApi.getSelectedNodes.mockReturnValue(mockNodes);

      const event: SelectionChangedEvent<{ id: string }> = { 
        api: mockGridApi,
        type: 'selectionChanged',
        source: null,
        context: null
      };

      // Act
      const selectionChangedSpy = jest.spyOn(component.selectionChanged, 'emit');
      component.onSelectionChanged(event);

      // Assert
      const selectedIds = component.getSelectedRowIds();
      expect(selectedIds.has('123')).toBe(true);
      expect(selectedIds.has('456')).toBe(true);
      expect(selectionChangedSpy).toHaveBeenCalledWith(mockNodes.map(node => node.data));
      expect(component.getClickedRowId()).toBeNull();
    });
  });

  describe('emitEvents', () => {
    it('should emit row clicked and row selected events', () => {
      // Arrange
      const mockNode = {
        data: { id: '123' },
        isSelected: () => true
      } as unknown as IRowNode<{ id: string }>;
      const event: RowClickedEvent<{ id: string }> = { 
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