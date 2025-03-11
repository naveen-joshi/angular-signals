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

ModuleRegistry.registerModules([RowSelectionModule]);

describe('DataGridWrapperComponent', () => {
  let component: DataGridWrapperComponent<TestData>;
  let fixture: ComponentFixture<DataGridWrapperComponent<TestData>>;
  let mockGridApi: jest.Mocked<GridApi>;
  let emitEventsSpy: jest.SpyInstance;
  let rowClickedSpy: jest.SpyInstance;
  let rowSelectedSpy: jest.SpyInstance;
  let selectionChangedSpy: jest.SpyInstance;

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

    fixture = TestBed.createComponent(DataGridWrapperComponent<TestData>);
    component = fixture.componentInstance;
    
    // Set input values
    fixture.componentRef.setInput('uniqueId', 'id');
    fixture.componentRef.setInput('columnDefinitions', []);
    fixture.componentRef.setInput('rowData', []);
    fixture.componentRef.setInput('selectionMode', { mode: 'multiRow' });
    
    // Initialize component through onGridReady
    component.onGridReady({ api: mockGridApi });

    // Initialize spies
    emitEventsSpy = jest.spyOn(component, 'emitEvents');
    rowClickedSpy = jest.spyOn(component.rowClicked, 'emit');
    rowSelectedSpy = jest.spyOn(component.rowSelected, 'emit');
    selectionChangedSpy = jest.spyOn(component.selectionChanged, 'emit');
    
    fixture.detectChanges();
  });

  describe('onRowClicked', () => {
    it('should not emit events when row is not selected and other selections exist', () => {
      // Arrange
      const mockNode = {
        data: { id: 456, test: 'test2' },
        isSelected: () => true
      } as unknown as IRowNode<TestData>;
      const event: RowSelectedEvent<TestData> = { 
        data: mockNode.data, 
        node: mockNode,
        type: 'rowSelected',
        rowIndex: 0,
        rowPinned: null,
        api: mockGridApi,
        context: null,
        source: 'api'
      };

      component.onRowSelected(event);  // Set up initial selection
      jest.clearAllMocks(); // Clear spy history after initial setup

      const clickedMockNode = {
        data: { id: 123, test: 'test1' },
        isSelected: () => false
      } as unknown as IRowNode<TestData>;
      const clickEvent: RowClickedEvent<TestData> = { 
        data: clickedMockNode.data, 
        node: clickedMockNode,
        type: 'rowClicked',
        rowIndex: 0,
        rowPinned: null,
        api: mockGridApi,
        context: null
      };

      // Act
      component.onRowClicked(clickEvent);

      // Assert
      expect(emitEventsSpy).not.toHaveBeenCalled();
      expect(rowClickedSpy).not.toHaveBeenCalled();
      expect(selectionChangedSpy).not.toHaveBeenCalled();
      expect(mockGridApi.redrawRows).not.toHaveBeenCalled();
      expect(component.getRowClass({ data: clickedMockNode.data })).toBe('ag-row-disabled');
    });

    it('should not emit events when clicked row is already active', () => {
      // Arrange
      const rowData = { id: 123, test: 'test1' };
      const mockNode = {
        data: rowData,
        isSelected: () => false
      } as unknown as IRowNode<TestData>;
      const clickEvent: RowClickedEvent<TestData> = { 
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
      
      // Verify initial click behavior
      expect(emitEventsSpy).toHaveBeenCalledWith(clickEvent);
      expect(rowClickedSpy).toHaveBeenCalledWith(rowData);
      expect(selectionChangedSpy).toHaveBeenCalledWith([rowData]);
      expect(mockGridApi.redrawRows).toHaveBeenCalled();
      expect(component.getRowClass({ data: rowData })).toBe('ag-row-clicked');
      
      // Clear spy history after initial setup
      jest.clearAllMocks();

      // Act - Click the same row again
      component.onRowClicked(clickEvent);

      // Assert - No events should be emitted for the second click
      expect(emitEventsSpy).not.toHaveBeenCalled();
      expect(rowClickedSpy).not.toHaveBeenCalled();
      expect(selectionChangedSpy).not.toHaveBeenCalled();
      expect(mockGridApi.redrawRows).not.toHaveBeenCalled();
      expect(component.getRowClass({ data: rowData })).toBe('ag-row-clicked');
    });

    it('should emit events and update clicked row state', () => {
      // Arrange
      const mockNode = {
        data: { id: 123, test: 'test1' },
        isSelected: () => false
      } as unknown as IRowNode<TestData>;
      const event: RowClickedEvent<TestData> = { 
        data: mockNode.data, 
        node: mockNode,
        type: 'rowClicked',
        rowIndex: 0,
        rowPinned: null,
        api: mockGridApi,
        context: null
      };

      // Act
      component.onRowClicked(event);

      // Assert
      expect(emitEventsSpy).toHaveBeenCalledWith(event);
      expect(selectionChangedSpy).toHaveBeenCalledWith([event.data]);
      expect(mockGridApi.redrawRows).toHaveBeenCalledTimes(1);
      expect(component.getRowClass({ data: mockNode.data })).toBe('ag-row-clicked');
    });
  });

  describe('onRowSelected', () => {
    it('should add row class when row is selected', () => {
      // Arrange
      const mockNode = {
        data: { id: 123, test: 'test1' },
        isSelected: () => true
      } as unknown as IRowNode<TestData>;
      const event: RowSelectedEvent<TestData> = { 
        data: mockNode.data, 
        node: mockNode,
        type: 'rowSelected',
        rowIndex: 0,
        rowPinned: null,
        api: mockGridApi,
        context: null,
        source: 'api'
      };

      // Act
      component.onRowSelected(event);

      // Assert
      expect(component.getRowClass({ data: mockNode.data })).toBe('ag-row-selected');
      expect(mockGridApi.redrawRows).toHaveBeenCalledTimes(1);
    });

    it('should remove row class when row is deselected', () => {
      // Arrange
      const mockNode = {
        data: { id: 123, test: 'test1' },
        isSelected: () => false
      } as unknown as IRowNode<TestData>;
      const event: RowSelectedEvent<TestData> = { 
        data: mockNode.data, 
        node: mockNode,
        type: 'rowSelected',
        rowIndex: 0,
        rowPinned: null,
        api: mockGridApi,
        context: null,
        source: 'api'
      };

      // First select the row
      const selectedNode = { ...mockNode, isSelected: () => true };
      component.onRowSelected({ ...event, node: selectedNode });

      // Then deselect it
      component.onRowSelected(event);

      // Assert
      expect(component.getRowClass({ data: mockNode.data })).toBe('');
      expect(mockGridApi.redrawRows).toHaveBeenCalledTimes(2);
    });
  });

  describe('onSelectionChanged', () => {
    it('should not update when selected nodes are the same', () => {
      // Arrange
      const mockNode = {
        data: { id: 123, test: 'test1' },
        isSelected: () => true
      } as unknown as IRowNode<TestData>;

      mockGridApi.getSelectedNodes.mockReturnValue([mockNode]);

      // First selection
      const event: SelectionChangedEvent<TestData> = { 
        api: mockGridApi,
        type: 'selectionChanged',
        source: 'api',
        context: null
      };
      component.onSelectionChanged(event);

      // Clear spy history
      jest.clearAllMocks();

      // Act - Same selection again
      component.onSelectionChanged(event);

      // Assert
      expect(selectionChangedSpy).not.toHaveBeenCalled();
      expect(component.getRowClass({ data: mockNode.data })).toBe('ag-row-selected');
    });

    it('should update selected state and emit selection changed event', () => {
      // Arrange
      const mockNodes = [
        { data: { id: 123, test: 'test1' }, isSelected: () => true },
        { data: { id: 456, test: 'test2' }, isSelected: () => true }
      ] as unknown as IRowNode<TestData>[];
      mockGridApi.getSelectedNodes.mockReturnValue(mockNodes);

      const event: SelectionChangedEvent<TestData> = { 
        api: mockGridApi,
        type: 'selectionChanged',
        source: 'api',
        context: null
      };

      // Act
      component.onSelectionChanged(event);

      // Assert
      expect(component.getRowClass({ data: mockNodes[0].data })).toBe('ag-row-selected');
      expect(component.getRowClass({ data: mockNodes[1].data })).toBe('ag-row-selected');
      expect(selectionChangedSpy).toHaveBeenCalledWith(mockNodes.map(node => node.data));
    });
  });

  describe('emitEvents', () => {
    it('should emit row clicked and row selected events', () => {
      // Arrange
      const mockNode = {
        data: { id: 123, test: 'test1' },
        isSelected: () => true
      } as unknown as IRowNode<TestData>;
      const event: RowClickedEvent<TestData> = { 
        data: mockNode.data, 
        node: mockNode,
        type: 'rowClicked',
        rowIndex: 0,
        rowPinned: null,
        api: mockGridApi,
        context: null
      };

      // Act
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

interface TestData {
  id: number;
  test: string;
}