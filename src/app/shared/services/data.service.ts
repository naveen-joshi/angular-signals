import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface DataResponse<T> {
  items: T[];
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  getData<T>(
    endpoint: string,
    startRow: number,
    endRow: number
  ): Observable<DataResponse<T>> {
    const params = new HttpParams()
      .set('_start', startRow.toString())
      .set('_limit', (endRow - startRow).toString());

    return new Observable<DataResponse<T>>(observer => {
      // First get the total count
      this.http.get<T[]>(`${this.apiUrl}/${endpoint}`).subscribe({
        next: (allData) => {
          // Get the total count
          const total = allData.length;

          // Then get the paginated data
          this.http.get<T[]>(`${this.apiUrl}/${endpoint}`, { params }).subscribe({
            next: (items) => {
              observer.next({
                items,
                total
              });
              observer.complete();
            },
            error: (error) => observer.error(error)
          });
        },
        error: (error) => observer.error(error)
      });
    });
  }
}
