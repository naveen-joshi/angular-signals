import { Component, OnInit } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';
import { CommonModule } from '@angular/common';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DataGridWrapperComponent } from "../data-grid-wrapper/data-grid-wrapper.component";
import { DataGridColumnDefinitions } from "../data-grid-wrapper/models/data-grid-column-definitions.model";

@Component({
  selector: 'app-data-grid',
  standalone: true,
  imports: [CommonModule, DataGridWrapperComponent],
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
      <app-data-grid-wrapper
        [columnDefinitions]="transformedColumnDefs"
        [rowData]="users"
        [uniqueId]="'id'"
        [selection-mode]="'multiRow'"
        (rowClicked)="onRowClicked($event)"
        (rowSelected)="onRowSelected($event)"
        (selectionChanged)="onSelectionChanged($event)"
        class="h-full w-full"
      >
      </app-data-grid-wrapper>
    </div>
  `
})
export class DataGridComponent implements OnInit {
  title = 'Users List';
  height = '500px';
  showActions = true;
  showExcelExport = true;
  showPdfExport = true;
  showPrint = true;

  columnDefs: ColDef[] = [
    { 
      headerName: 'Name',
      field: 'name',
      sortable: true,
      width: 150
    },
    { 
      headerName: 'Email',
      field: 'email',
      sortable: true,
      width: 200
    },
    { 
      headerName: 'Role',
      field: 'role',
      sortable: true,
      width: 120
    },
    { 
      headerName: 'Status',
      field: 'status',
      sortable: true,
      width: 120,
      cellClass: params => {
        switch (params.value) {
          case 'Active': return 'text-green-600';
          case 'Inactive': return 'text-red-600';
          case 'Pending': return 'text-yellow-600';
          default: return '';
        }
      }
    },
    { 
      headerName: 'Age',
      field: 'age',
      sortable: true,
      width: 100
    },
    { 
      headerName: 'Join Date',
      field: 'joinDate',
      sortable: true,
      width: 150
    },
    { 
      headerName: 'Salary',
      field: 'salary',
      sortable: true,
      width: 120,
      valueFormatter: params => {
        return params.value ? `$${params.value.toLocaleString()}` : '';
      }
    }
  ];

  private gridApi!: GridApi;
  users = [
    {
      "id": 1,
      "name": "User 1",
      "email": "user1@example.com",
      "role": "User",
      "status": "Inactive",
      "age": 35,
      "joinDate": "2024-11-17",
      "salary": 72242
    },
    {
      "id": 2,
      "name": "User 2",
      "email": "user2@example.com",
      "role": "User",
      "status": "Active",
      "age": 22,
      "joinDate": "2024-10-23",
      "salary": 37081
    },
    {
      "id": 3,
      "name": "User 3",
      "email": "user3@example.com",
      "role": "Manager",
      "status": "Inactive",
      "age": 29,
      "joinDate": "2024-04-17",
      "salary": 55093
    },
    {
      "id": 4,
      "name": "User 4",
      "email": "user4@example.com",
      "role": "User",
      "status": "Pending",
      "age": 47,
      "joinDate": "2025-02-25",
      "salary": 77160
    },
    {
      "id": 5,
      "name": "User 5",
      "email": "user5@example.com",
      "role": "Analyst",
      "status": "Inactive",
      "age": 53,
      "joinDate": "2024-06-24",
      "salary": 68823
    },
    {
      "id": 6,
      "name": "User 6",
      "email": "user6@example.com",
      "role": "Admin",
      "status": "Active",
      "age": 52,
      "joinDate": "2024-10-12",
      "salary": 73626
    },
    {
      "id": 7,
      "name": "User 7",
      "email": "user7@example.com",
      "role": "Analyst",
      "status": "Pending",
      "age": 20,
      "joinDate": "2024-11-26",
      "salary": 73520
    },
    {
      "id": 8,
      "name": "User 8",
      "email": "user8@example.com",
      "role": "Analyst",
      "status": "Active",
      "age": 28,
      "joinDate": "2024-09-11",
      "salary": 75040
    },
    {
      "id": 9,
      "name": "User 9",
      "email": "user9@example.com",
      "role": "Admin",
      "status": "Inactive",
      "age": 31,
      "joinDate": "2025-01-22",
      "salary": 61151
    },
    {
      "id": 10,
      "name": "User 10",
      "email": "user10@example.com",
      "role": "Developer",
      "status": "Pending",
      "age": 28,
      "joinDate": "2024-12-31",
      "salary": 75629
    }
  ];
  private selectedRows: any[] = [];
  public transformedColumnDefs: DataGridColumnDefinitions<any>[] = [];

  constructor() {}

  ngOnInit() {
    this.transformColumnDefs();
  }

  private transformColumnDefs() {
    this.transformedColumnDefs = this.columnDefs.map(col => ({
      headerName: col.headerName || col.field || '',
      field: col.field || '',
      isVisible: !col.hide,
      width: col.width,
      sortable: col.sortable ?? false,
      editable: typeof col.editable === 'boolean' ? col.editable : false,
      resizable: col.resizable ?? false,
      cellClass: col.cellClass as string | string[],
      columnIdentifier: col.colId
    }));
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
  }

  onRowClicked(data: any) {
    console.log('Row clicked:', data);
  }

  onRowSelected(data: any) {
    console.log('Row selected:', data);
  }

  onSelectionChanged(selectedData: any[]) {
    this.selectedRows = selectedData;
    console.log(selectedData)
  }

  getSelectedRowCount(): number {
    return this.selectedRows.length;
  }

  exportToExcel(selectedOnly: boolean) {
    const data = selectedOnly ? this.selectedRows : this.users;
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    XLSX.writeFile(wb, 'export.xlsx');
  }

  exportToPdf(selectedOnly: boolean) {
    const data = selectedOnly ? this.selectedRows : this.users;
    const doc = new jsPDF();
    
    const columns = this.transformedColumnDefs.map(col => ({
      header: col.headerName,
      dataKey: col.field
    }));

    autoTable(doc, {
      columns: columns,
      body: data
    });

    doc.save('export.pdf');
  }

  printReport(selectedOnly: boolean) {
    const data = selectedOnly ? this.selectedRows : this.users;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = this.generatePrintHtml(data);
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  }

  private generatePrintHtml(data: any[]): string {
    const headers = this.transformedColumnDefs.map(col => col.headerName);
    const rows = data.map(item => 
      this.transformedColumnDefs.map(col => item[col.field])
    );

    return `
      <html>
        <head>
          <title>Print Report</title>
          <style>
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid black; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>${this.title}</h1>
          <table>
            <thead>
              <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${rows.map(row => `
                <tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
  }
}
