import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, ClientSideRowModelModule, Module } from 'ag-grid-community';
import { DataGridComponent } from "./shared/components/data-grid/data-grid.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AgGridAngular, DataGridComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  public modules: Module[] = [ClientSideRowModelModule];

  usersColumnDefs: ColDef[] = [
    { field: 'name', headerName: 'Name', sortable: true, filter: true },
    { field: 'age', headerName: 'Age', sortable: true, filter: true },
    { field: 'city', headerName: 'City', sortable: true, filter: true },
    { field: 'country', headerName: 'Country', sortable: true, filter: true }
  ];

  usersData = [
    { name: 'John Doe', age: 30, city: 'New York', country: 'USA' },
    { name: 'Jane Smith', age: 25, city: 'London', country: 'UK' },
    { name: 'Bob Johnson', age: 35, city: 'Paris', country: 'France' },
    { name: 'Alice Brown', age: 28, city: 'Tokyo', country: 'Japan' },
    { name: 'Charlie Wilson', age: 32, city: 'Sydney', country: 'Australia' }
  ];

  ordersColumnDefs: ColDef[] = [
    { field: 'orderNumber', headerName: 'Order #', sortable: true, filter: true },
    { field: 'customer', headerName: 'Customer', sortable: true, filter: true },
    { field: 'amount', headerName: 'Amount ($)', sortable: true, filter: true },
    { field: 'status', headerName: 'Status', sortable: true, filter: true }
  ];

  ordersData = [
    { orderNumber: 'ORD001', customer: 'John Doe', amount: 1500, status: 'Completed' },
    { orderNumber: 'ORD002', customer: 'Jane Smith', amount: 2300, status: 'Pending' },
    { orderNumber: 'ORD003', customer: 'Bob Johnson', amount: 950, status: 'Processing' },
    { orderNumber: 'ORD004', customer: 'Alice Brown', amount: 3200, status: 'Completed' },
    { orderNumber: 'ORD005', customer: 'Charlie Wilson', amount: 1800, status: 'Pending' }
  ];
}
