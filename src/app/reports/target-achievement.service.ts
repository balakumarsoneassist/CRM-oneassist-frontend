import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TargetAchievementService {
  private apiUrl = environment.apiUrl; // Base API URL

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  getData(filters: any = {}): Observable<any> {
    let params = new HttpParams();

    if (filters.search) params = params.set('search', filters.search);

    // Setup other filters as needed
    if (filters.month) params = params.set('month', filters.month);
    if (filters.year) params = params.set('year', filters.year);

    const headers = this.getAuthHeaders();
    // Uses the updated endpoint
    return this.http.get(`${this.apiUrl}/api/target-achievement`, {
      headers,
      params,
    });
  }

  getTargetMetrics(employeeId?: string): Observable<any> {
    const headers = this.getAuthHeaders();
    let params = new HttpParams();
    if (employeeId) {
      params = params.set('employeeId', employeeId);
    }
    // Add timestamp to force new network request
    const timestamp = new Date().getTime();
    params = params.set('t', timestamp.toString());
    return this.http.get(`${this.apiUrl}/api/target-metrics`, { headers, params });
  }

  updateTargetMetrics(data: any): Observable<any> {
    const headers = this.getAuthHeaders();
    // If employeeId is separate or part of data, handle it.
    // Backend expects PUT /target-metrics/:employeeId
    const id = data.employeeId;
    console.log(`[Frontend Service] Updating targets for ID: ${id}`, data);
    if (!id) {
      console.error('[Frontend Service] Missing employee ID in update request');
      throw new Error('Employee ID is required for update');
    }
    const url = `${this.apiUrl}/api/target-metrics/${id}`;
    console.log(`[Frontend Service] PUT URL: ${url}`);
    return this.http.put(url, data, { headers });
  }



  getEmployeeById(id: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/employees/${id}`, { headers });
  }

  getTargetAssignmentStatus(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/api/target-assignment-status`, {
      headers,
    });
  }

  getAllAchievementMetrics(page: number = 1, limit: number = 10): Observable<any> {
    const headers = this.getAuthHeaders();
    // Add timestamp to force new network request
    const timestamp = new Date().getTime();
    return this.http.get(
      `${this.apiUrl}/api/all-achievement-metrics?t=${timestamp}&page=${page}&limit=${limit}`,
      { headers }
    );
  }
}
