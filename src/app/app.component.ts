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
    { field: 'name', headerName: 'Name' },
    { field: 'email', headerName: 'Email' },
    { field: 'role', headerName: 'Role' },
    { field: 'status', headerName: 'Status' },
    { field: 'age', headerName: 'Age' },
    { 
      field: 'salary', 
      headerName: 'Salary', 
      valueFormatter: params => params.value ? `$${params.value.toLocaleString()}` : ''
    }
  ];

  usersData = [
    { name: 'John Doe', age: 30, city: 'New York', country: 'USA' },
    { name: 'Jane Smith', age: 25, city: 'London', country: 'UK' },
    { name: 'Bob Johnson', age: 35, city: 'Paris', country: 'France' },
    { name: 'Alice Brown', age: 28, city: 'Tokyo', country: 'Japan' },
    { name: 'Charlie Wilson', age: 32, city: 'Sydney', country: 'Australia' }
  ];

  productsColumnDefs: ColDef[] = [
    { field: 'name', headerName: 'Name' },
    { field: 'category', headerName: 'Category' },
    { 
      field: 'price', 
      headerName: 'Price', 
      valueFormatter: params => params.value ? `$${params.value.toLocaleString()}` : ''
    },
    { field: 'stock', headerName: 'Stock' },
    { 
      field: 'rating', 
      headerName: 'Rating', 
      valueFormatter: params => params.value ? `${params.value} ★` : ''
    }
  ];

  ordersColumnDefs: ColDef[] = [
    { field: 'orderNumber', headerName: 'Order #' },
    { field: 'customer', headerName: 'Customer' },
    { field: 'amount', headerName: 'Amount ($)' },
    { field: 'status', headerName: 'Status' }
  ];

  ordersData = [
    { orderNumber: 'ORD001', customer: 'John Doe', amount: 1500, status: 'Completed' },
    { orderNumber: 'ORD002', customer: 'Jane Smith', amount: 2300, status: 'Pending' },
    { orderNumber: 'ORD003', customer: 'Bob Johnson', amount: 950, status: 'Processing' },
    { orderNumber: 'ORD004', customer: 'Alice Brown', amount: 3200, status: 'Completed' },
    { orderNumber: 'ORD005', customer: 'Charlie Wilson', amount: 1800, status: 'Pending' }
  ];
}
