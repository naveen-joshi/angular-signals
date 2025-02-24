import { Component, Input } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, Module, ClientSideRowModelModule, GridApi, GridReadyEvent } from 'ag-grid-community';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-data-grid',
  standalone: true,
  imports: [AgGridAngular],
  template: `
    <div class="flex justify-between mb-4">
      <h2 class="text-xl font-semibold">{{ title }}</h2>
      <div class="space-x-2">
        <button 
          (click)="exportToExcel()"
          class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
          Export to Excel
        </button>
        <button 
          (click)="exportToPdf()"
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Export to PDF
        </button>
      </div>
    </div>
    <div class="ag-theme-alpine" [style.height]="height">
      <ag-grid-angular
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
}
