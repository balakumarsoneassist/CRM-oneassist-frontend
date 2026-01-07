import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LeadService {

  private api = `${environment.apiUrl}/api/customers/all`;

  constructor(private http: HttpClient) { }

  getAllCustomers(filters: any = {}): Observable<any[]> {
    let params = new HttpParams();

    if (filters.search) params = params.set('search', filters.search);

    // Handle arrays (Angular HttpParams handles array values by repeating keys if passed as array, 
    // or we can join them. Let's send as comma-separated strings for easier parsing on simple Node backend,
    // or rely on Node parsing repeated keys. Let's use comma-separated for safety with simple splitting.)
    if (filters.segments && filters.segments.length) params = params.set('segments', filters.segments.join(','));
    if (filters.categories && filters.categories.length) params = params.set('categories', filters.categories.join(','));
    if (filters.banks && filters.banks.length) params = params.set('banks', filters.banks.join(','));
    if (filters.loanTypes && filters.loanTypes.length) params = params.set('loanTypes', filters.loanTypes.join(','));

    if (filters.minAmount !== null && filters.minAmount !== undefined) params = params.set('minAmount', filters.minAmount.toString());
    if (filters.maxAmount !== null && filters.maxAmount !== undefined) params = params.set('maxAmount', filters.maxAmount.toString());

    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());

    return this.http.get<any[]>(this.api, { params });
  }

  getLeads(filters: any = {}): Observable<any> {
    let params = new HttpParams();

    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params = params.set(key, filters[key]);
      }
    });

    return this.http.get(this.api, { params });
  }
}
