import { Component, Input, OnInit } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import { 
  ColDef, 
  Module,
  GridApi, 
  GridReadyEvent,
  IGetRowsParams,
  IDatasource,
  RowModelType,
  InfiniteRowModelModule
} from 'ag-grid-community';
import { CommonModule } from '@angular/common';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-data-grid',
  standalone: true,
  imports: [AgGridAngular, CommonModule],
  template: `
    <div class="flex justify-between mb-4">
      <h2 class="text-xl font-semibold">{{ title }}</h2>
      <div class="space-x-2" *ngIf="showActions">
        <div class="flex items-center space-x-4">
          <div class="flex-grow">
            <span class="text-sm text-gray-600" *ngIf="getSelectedRowCount() > 0">
              {{ getSelectedRowCount() }} rows selected
            </span>
          </div>
          <div class="space-x-2">
            <div class="inline-block" *ngIf="showExcelExport">
              <button 
                (click)="exportToExcel(false)"
                class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                <span class="flex items-center">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export All
                </span>
              </button>
              <button 
                *ngIf="getSelectedRowCount() > 0"
                (click)="exportToExcel(true)"
                class="ml-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                <span class="flex items-center">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export Selected
                </span>
              </button>
            </div>
            <div class="inline-block" *ngIf="showPdfExport">
              <button 
                (click)="exportToPdf(false)"
                class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                <span class="flex items-center">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export All
                </span>
              </button>
              <button 
                *ngIf="getSelectedRowCount() > 0"
                (click)="exportToPdf(true)"
                class="ml-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                <span class="flex items-center">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export Selected
                </span>
              </button>
            </div>
            <div class="inline-block" *ngIf="showPrint">
              <button 
                (click)="printReport(false)"
                class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
                <span class="flex items-center">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print All
                </span>
              </button>
              <button 
                *ngIf="getSelectedRowCount() > 0"
                (click)="printReport(true)"
                class="ml-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
                <span class="flex items-center">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print Selected
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="ag-theme-alpine" [style.height]="height">
      <ag-grid-angular
        #agGrid
        [columnDefs]="columnDefs"
        [modules]="modules"
        [rowModelType]="rowModelType"
        [datasource]="dataSource"
        [defaultColDef]="defaultColDef"
        [cacheBlockSize]="cacheBlockSize"
        [maxConcurrentDatasourceRequests]="2"
        [infiniteInitialRowCount]="infiniteInitialRowCount"
        [maxBlocksInCache]="maxBlocksInCache"
        [cacheOverflowSize]="cacheOverflowSize"
        [pagination]="false"
        [suppressPaginationPanel]="true"
        [rowSelection]="rowSelection"
        (gridReady)="onGridReady($event)"
        (modelUpdated)="onModelUpdated($event)"
        (selectionChanged)="onSelectionChanged($event)"
        class="h-full w-full"
      >
      </ag-grid-angular>
    </div>
  `
})
export class DataGridComponent implements OnInit {
  @Input() title: string = 'Data Grid';
  @Input() height: string = '500px';
  @Input() columnDefs: ColDef[] = [];
  @Input() endpoint: string = '';
  @Input() showActions: boolean = false;
  @Input() showExcelExport: boolean = false;
  @Input() showPdfExport: boolean = false;
  @Input() showPrint: boolean = false;

  private gridApi!: GridApi;
  public loadedData: Map<number, any> = new Map(); // Store loaded rows by index
  private totalRows: number = 0;
  
  public modules: Module[] = [InfiniteRowModelModule];
  public rowModelType: RowModelType = 'infinite';
  public dataSource!: IDatasource;
  
  // Configuration for infinite scrolling
  public cacheBlockSize = 50;
  public maxBlocksInCache = 10;
  public infiniteInitialRowCount = 50;
  public cacheOverflowSize = 1;
  public rowSelection: 'single' | 'multiple' = 'multiple';
  
  public defaultColDef: ColDef = {
    minWidth: 100,
    resizable: true
  };

  constructor(private dataService: DataService) {}

  ngOnInit() {
    if (!this.endpoint) {
      console.error('Endpoint is required for virtual scrolling');
      return;
    }

    // Add checkbox column at the start
    this.columnDefs = [
      {
        headerName: '',
        field: 'checkboxSelection',
        headerCheckboxSelection: true,
        checkboxSelection: true,
        width: 40,
        pinned: 'left'
      },
      ...this.columnDefs
    ];
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
    this.setupDataSource();
  }

  onModelUpdated(event: any) {
    const totalLoaded = this.loadedData.size;
    console.log(`Grid model updated. Total loaded rows: ${totalLoaded}, Total rows: ${this.totalRows}`);
  }

  private setupDataSource() {
    if (!this.endpoint) {
      console.error('Endpoint is required for virtual scrolling');
      return;
    }

    this.dataSource = {
      getRows: (params: IGetRowsParams) => {
        const startRow = params.startRow;
        const endRow = params.endRow;
        
        console.log(`Fetching rows ${startRow} to ${endRow}`);

        this.dataService.getData(
          this.endpoint,
          startRow,
          endRow
        ).subscribe({
          next: (response) => {
            // Store the total count
            this.totalRows = response.total;
            
            // Store each row in our Map
            response.items.forEach((item: any, index: number) => {
              this.loadedData.set(startRow + index, item);
            });
            
            const rowsThisBlock = response.items.length;
            const lastRow = response.total;
            
            console.log(`Loaded ${rowsThisBlock} rows. Total in cache: ${this.loadedData.size}/${lastRow}`);
            
            params.successCallback(response.items, lastRow);
          },
          error: (error) => {
            console.error('Error fetching data:', error);
            params.failCallback();
          }
        });
      }
    };

    // Initial load
    this.gridApi.setDatasource(this.dataSource);
  }

  private getLoadedRowData(selectedOnly: boolean = false): any[] {
    if (selectedOnly && this.gridApi) {
      const selectedNodes = this.gridApi.getSelectedRows();
      if (!selectedNodes || selectedNodes.length === 0) {
        return [];
      }
      return selectedNodes;
    }

    // Convert Map to array, maintaining order
    const rowData = Array.from(this.loadedData.entries())
      .sort(([a], [b]) => a - b) // Sort by row index
      .map(([_, data]) => data); // Get just the data

    console.log('Loaded rows for export:', rowData.length);
    return rowData;
  }

  getSelectedRowCount(): number {
    if (!this.gridApi) {
      return 0;
    }
    const selectedRows = this.gridApi.getSelectedRows();
    return selectedRows ? selectedRows.length : 0;
  }

  onSelectionChanged(event: any) {
    const count = this.getSelectedRowCount();
    console.log('Selection changed:', count, 'rows selected');
  }

  async exportToExcel(selectedOnly: boolean = false) {
    try {
      const data = this.getLoadedRowData(selectedOnly);
      if (data.length === 0) {
        console.warn('No data to export');
        return;
      }
      
      console.log(`Exporting to Excel: ${data.length} ${selectedOnly ? 'selected' : 'loaded'} rows`);
      
      // Create worksheet
      const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
      
      // Create workbook
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      
      // Generate Excel file
      const prefix = selectedOnly ? 'Selected' : 'All';
      const fileName = `${prefix}_${this.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
    }
  }

  async exportToPdf(selectedOnly: boolean = false) {
    try {
      const data = this.getLoadedRowData(selectedOnly);
      if (data.length === 0) {
        console.warn('No data to export');
        return;
      }
      
      console.log(`Exporting to PDF: ${data.length} ${selectedOnly ? 'selected' : 'loaded'} rows`);
      
      // Create PDF document
      const doc = new jsPDF();
      
      // Add title
      const prefix = selectedOnly ? 'Selected' : 'All';
      doc.text(`${this.title} - ${prefix} Rows`, 14, 15);
      
      // Prepare data for autoTable
      const tableData = data.map(row => 
        this.columnDefs.slice(1).map(col => col.field ? row[col.field] : '') // Skip checkbox column
      );
      
      // Prepare headers for autoTable
      const headers = this.columnDefs.slice(1).map(col => col.headerName || col.field || ''); // Skip checkbox column
      
      // Add table to PDF
      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: 20,
        margin: { top: 15 },
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 }
      });
      
      // Save PDF
      const fileName = `${prefix}_${this.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
    }
  }

  async printReport(selectedOnly: boolean = false) {
    try {
      const data = this.getLoadedRowData(selectedOnly);
      if (data.length === 0) {
        console.warn('No data to print');
        return;
      }
      
      console.log(`Printing: ${data.length} ${selectedOnly ? 'selected' : 'loaded'} rows`);
      
      const printContent = document.createElement('div');
      printContent.classList.add('print-content');

      // Add title
      const title = document.createElement('h2');
      const prefix = selectedOnly ? 'Selected' : 'All';
      title.textContent = `${this.title} - ${prefix} Rows`;
      title.style.textAlign = 'center';
      title.style.margin = '20px 0';
      printContent.appendChild(title);

      // Create table
      const table = document.createElement('table');
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';

      // Add headers
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      this.columnDefs.slice(1).forEach(col => { // Skip checkbox column
        const th = document.createElement('th');
        th.textContent = col.headerName || col.field || '';
        th.style.border = '1px solid #ddd';
        th.style.padding = '8px';
        th.style.backgroundColor = '#f4f4f4';
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
      table.appendChild(thead);

      // Add data rows
      const tbody = document.createElement('tbody');
      data.forEach(row => {
        const tr = document.createElement('tr');
        this.columnDefs.slice(1).forEach(col => { // Skip checkbox column
          const td = document.createElement('td');
          td.textContent = col.field && row[col.field] != null ? row[col.field].toString() : '';
          td.style.border = '1px solid #ddd';
          td.style.padding = '8px';
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      printContent.appendChild(table);

      // Add date and row count info
      const infoDiv = document.createElement('div');
      infoDiv.style.marginTop = '20px';
      infoDiv.style.textAlign = 'right';
      infoDiv.innerHTML = `
        Generated on: ${new Date().toLocaleDateString()}<br>
        ${selectedOnly ? 'Selected' : 'Loaded'} rows: ${data.length} of ${this.totalRows} total rows
      `;
      printContent.appendChild(infoDiv);

      // Create print window
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>${this.title} - Print</title>
              <style>
                @media print {
                  body { padding: 20px; }
                  table { border-collapse: collapse; width: 100%; }
                  th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                  th { background-color: #f4f4f4; }
                }
              </style>
            </head>
            <body>
              ${printContent.outerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      }
    } catch (error) {
      console.error('Error printing report:', error);
    }
  }
}
