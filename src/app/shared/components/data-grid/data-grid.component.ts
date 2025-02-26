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
        <button 
          *ngIf="showExcelExport"
          (click)="exportToExcel()"
          class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
          <span class="flex items-center">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export to Excel
          </span>
        </button>
        <button 
          *ngIf="showPdfExport"
          (click)="exportToPdf()"
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          <span class="flex items-center">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export to PDF
          </span>
        </button>
        <button 
          *ngIf="showPrint"
          (click)="printReport()"
          class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
          <span class="flex items-center">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Report
          </span>
        </button>
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
        [debug]="true"
        (gridReady)="onGridReady($event)"
        (modelUpdated)="onModelUpdated($event)"
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
  private loadedData: Map<number, any> = new Map(); // Store loaded rows by index
  private totalRows: number = 0;
  
  public modules: Module[] = [InfiniteRowModelModule];
  public rowModelType: RowModelType = 'infinite';
  public dataSource!: IDatasource;
  
  // Configuration for infinite scrolling
  public cacheBlockSize = 50; // Load 50 rows at a time
  public maxBlocksInCache = 10; // Keep up to 10 blocks in cache (500 rows total)
  public infiniteInitialRowCount = 50; // Start with 50 rows
  public cacheOverflowSize = 1; // Keep 1 extra block
  
  public defaultColDef: ColDef = {
    minWidth: 100,
    resizable: true
  };

  constructor(private dataService: DataService) {}

  ngOnInit() {
    if (!this.endpoint) {
      console.error('Endpoint is required for virtual scrolling');
    }
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
    this.setupDataSource();
  }

  onModelUpdated(event: any) {
    console.log('Grid model updated event, loaded data size:', this.loadedData.size);
  }

  private setupDataSource() {
    if (!this.endpoint) {
      console.error('Endpoint is required for virtual scrolling');
      return;
    }

    this.dataSource = {
      getRows: (params: IGetRowsParams) => {
        console.log('AG Grid requesting rows:', params);
        
        const startRow = params.startRow;
        const endRow = params.endRow;

        this.dataService.getData(
          this.endpoint,
          startRow,
          endRow
        ).subscribe({
          next: (response) => {
            console.log('Data received:', response);
            // Store the total count
            this.totalRows = response.total;
            
            // Store the new data
            response.items.forEach((item, index) => {
              this.loadedData.set(startRow + index, item);
            });
            
            console.log('Total loaded rows:', this.loadedData.size);
            params.successCallback(response.items, response.total);
          },
          error: (error) => {
            console.error('Error fetching data:', error);
            params.failCallback();
          }
        });
      }
    };
  }

  private getLoadedRowData(): any[] {
    // Convert Map to array, maintaining order
    const rowData = Array.from(this.loadedData.entries())
      .sort(([a], [b]) => a - b) // Sort by row index
      .map(([_, data]) => ({...data})); // Get just the data, create copy

    console.log('Loaded rows for export:', rowData.length);
    return rowData;
  }

  async exportToExcel() {
    try {
      const data = this.getLoadedRowData();
      if (data.length === 0) {
        console.warn('No data loaded to export');
        return;
      }
      
      console.log('Exporting to Excel:', data.length, 'loaded rows');
      
      // Create worksheet
      const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
      
      // Create workbook
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      
      // Generate Excel file
      const fileName = `${this.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
    }
  }

  async exportToPdf() {
    try {
      const data = this.getLoadedRowData();
      if (data.length === 0) {
        console.warn('No data loaded to export');
        return;
      }
      
      console.log('Exporting to PDF:', data.length, 'loaded rows');
      
      // Create PDF document
      const doc = new jsPDF();
      
      // Add title
      doc.text(this.title, 14, 15);
      
      // Prepare data for autoTable
      const tableData = data.map(row => 
        this.columnDefs.map(col => col.field ? row[col.field] : '')
      );
      
      // Prepare headers for autoTable
      const headers = this.columnDefs.map(col => col.headerName || col.field || '');
      
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
      const fileName = `${this.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
    }
  }

  async printReport() {
    try {
      const data = this.getLoadedRowData();
      if (data.length === 0) {
        console.warn('No data loaded to print');
        return;
      }
      
      console.log('Printing:', data.length, 'loaded rows');
      
      const printContent = document.createElement('div');
      printContent.classList.add('print-content');

      // Add title
      const title = document.createElement('h2');
      title.textContent = this.title;
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
      this.columnDefs.forEach(col => {
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
        this.columnDefs.forEach(col => {
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

      // Add date and loaded rows count
      const infoDiv = document.createElement('div');
      infoDiv.style.marginTop = '20px';
      infoDiv.style.textAlign = 'right';
      infoDiv.innerHTML = `
        Generated on: ${new Date().toLocaleDateString()}<br>
        Loaded rows: ${data.length} of ${this.totalRows} total rows
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
