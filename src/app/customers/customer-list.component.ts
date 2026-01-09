import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

interface Customer {
  id: number;
  name: string;
  mobilenumber: string;
  product: string;
  loandate: string;
  bank: string;
  loanamount: string;
  converter: string;
  isdirectmeet?: boolean;
  appoinmentdate?: string;
}

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customer-list.component.html',
  styleUrls: ['./customer-list.component.css']
})
export class CustomerListComponent implements OnInit {
  customers: Customer[] = [];
  loading = false;
  error: string | null = null;

  // Define visible columns (excluding id)
  displayColumns = [
    { key: 'name', label: 'Customer Name' },
    { key: 'mobilenumber', label: 'Mobile Number' },
    { key: 'product', label: 'Product' },
    { key: 'loandate', label: 'Loan Date' },
    { key: 'bank', label: 'Bank' },
    { key: 'loanamount', label: 'Loan Amount' },
    { key: 'converter', label: 'Converter' },
    { key: 'isdirectmeet', label: 'Direct Meet' },
    { key: 'appoinmentdate', label: 'Appt. Date' }
  ];

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef, private ngZone: NgZone) { }

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.loading = true;
    this.error = null;

    // Force UI update for loading state
    this.ngZone.run(() => {
      this.cdr.detectChanges();
    });

    this.http.get<any>(`${environment.apiUrl}/getcustomerlist`).subscribe({
      next: (response) => {
        console.log('Customer list data:', response);

        // Handle wrapped response format {success: true, data: [...], count: 2}
        if (response && response.data && Array.isArray(response.data)) {
          this.customers = response.data;
        } else if (Array.isArray(response)) {
          // Handle direct array response
          this.customers = response;
        } else {
          this.customers = [];
        }

        console.log('Processed customers:', this.customers);

        // Apply comprehensive change detection fix (following established pattern)
        this.ngZone.run(() => {
          this.loading = false;
          this.cdr.detectChanges();

          setTimeout(() => {
            this.cdr.detectChanges();

            // Force DOM update directly as fallback
            setTimeout(() => {
              this.updateDOMDirectly();
            }, 50);
          }, 100);
        });
      },
      error: (err) => {
        console.error('Failed to load customer list:', err);

        // Force UI update for error state too
        this.ngZone.run(() => {
          this.error = 'Failed to load customer data. Please try again.';
          this.loading = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  // Direct DOM manipulation method (following established pattern from other components)
  updateDOMDirectly(): void {
    const loadingContainer = document.querySelector('.loading-container') as HTMLElement;
    const tableWrapper = document.querySelector('.table-wrapper') as HTMLElement;
    const errorContainer = document.querySelector('.error-container') as HTMLElement;

    console.log('Direct DOM update - loading:', this.loading, 'customers:', this.customers.length, 'error:', this.error);

    // Hide loading state
    if (loadingContainer) {
      loadingContainer.style.display = this.loading ? 'flex' : 'none';
    }

    // Show/hide error state
    if (errorContainer) {
      errorContainer.style.display = (this.error && !this.loading) ? 'block' : 'none';
    }

    // Show/hide table
    if (tableWrapper) {
      tableWrapper.style.display = (!this.loading && !this.error) ? 'block' : 'none';
    }

    // Update record count if table is visible
    const recordCount = document.querySelector('.record-count') as HTMLElement;
    if (recordCount && !this.loading && !this.error) {
      recordCount.textContent = `Total Customers: ${this.customers.length}`;
    }
  }

  refreshData(): void {
    this.loadCustomers();
  }

  getColumnValue(customer: Customer, columnKey: string): any {
    const value = customer[columnKey as keyof Customer];

    if (columnKey === 'isdirectmeet') {
      return value === true ? 'Yes' : 'No';
    }

    if (columnKey === 'appoinmentdate' && value) {
      if (typeof value === 'string') {
        const date = new Date(value);
        return isNaN(date.getTime()) ? value : date.toLocaleString();
      }
    }

    return value;
  }

  trackByCustomerId(index: number, customer: Customer): number {
    return customer.id;
  }
}
