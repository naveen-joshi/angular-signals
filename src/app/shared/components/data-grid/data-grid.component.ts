import { Component, Input } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, Module, ClientSideRowModelModule, GridApi, GridReadyEvent } from 'ag-grid-community';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CommonModule } from '@angular/common';

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
        [rowData]="rowData"
        [modules]="modules"
        [pagination]="true"
        [paginationAutoPageSize]="true"
        (gridReady)="onGridReady($event)"
        class="h-full w-full"
      >
      </ag-grid-angular>
    </div>
  `
})
export class DataGridComponent {
  @Input() title: string = 'Data Grid';
  @Input() height: string = '500px';
  @Input() columnDefs: ColDef[] = [];
  @Input() rowData: any[] = [];
  @Input() showActions: boolean = false;
  @Input() showExcelExport: boolean = false;
  @Input() showPdfExport: boolean = false;
  @Input() showPrint: boolean = false;

  private gridApi!: GridApi;
  public modules: Module[] = [ClientSideRowModelModule];

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
  }

  exportToExcel() {
    // Get all grid data
    const data = this.rowData.map(row => {
      const rowData: any = {};
      this.columnDefs.forEach(col => {
        if (col.field) {
          rowData[col.headerName || col.field] = row[col.field];
        }
      });
      return rowData;
    });

    // Create worksheet
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    
    // Create workbook
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    
    // Generate Excel file
    const fileName = `${this.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  exportToPdf() {
    // Create PDF document
    const doc = new jsPDF();
    
    // Add title
    doc.text(this.title, 14, 15);
    
    // Prepare data for autoTable
    const tableData = this.rowData.map(row => 
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
  }

  printReport() {
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
    this.rowData.forEach(row => {
      const tr = document.createElement('tr');
      this.columnDefs.forEach(col => {
        const td = document.createElement('td');
        td.textContent = col.field ? row[col.field].toString() : '';
        td.style.border = '1px solid #ddd';
        td.style.padding = '8px';
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    printContent.appendChild(table);

    // Add date
    const dateDiv = document.createElement('div');
    dateDiv.style.marginTop = '20px';
    dateDiv.style.textAlign = 'right';
    dateDiv.textContent = `Generated on: ${new Date().toLocaleDateString()}`;
    printContent.appendChild(dateDiv);

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
  }
}
