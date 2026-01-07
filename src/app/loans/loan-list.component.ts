import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

interface LoanRecord {
  totalcustomers: number;
  product: string;
  amount: number;
}

@Component({
  selector: 'app-loan-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loan-list.component.html',
  styleUrls: ['./loan-list.component.css']
})
export class LoanListComponent implements OnInit {
  loans: LoanRecord[] = [];
  loading = false;
  error: string | null = null;

  // Summary statistics
  totalCustomers = 0;
  totalLoanAmount = 0;

  // Display columns
  displayColumns = [
    { key: 'product', label: 'Product' },
    { key: 'totalcustomers', label: 'Total Customers' },
    { key: 'amount', label: 'Loan Amount' }
  ];

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef, private ngZone: NgZone) {}

  ngOnInit(): void {
    this.loadLoans();
  }

  loadLoans(): void {
    this.loading = true;
    this.error = null;

    // Force UI update for loading state
    this.ngZone.run(() => {
      this.cdr.detectChanges();
    });

    this.http.get<any>(`${environment.apiUrl}/getloanlist`).subscribe({
      next: (response) => {
        console.log('Loan list data:', response);
        
        // Handle wrapped response format or direct array
        if (response && response.data && Array.isArray(response.data)) {
          this.loans = response.data;
        } else if (Array.isArray(response)) {
          this.loans = response;
        } else {
          this.loans = [];
        }
        
        // Calculate summary statistics
        this.calculateSummaryStats();
        
        console.log('Processed loans:', this.loans);
        console.log('Summary - Total Customers:', this.totalCustomers, 'Total Amount:', this.totalLoanAmount);
        
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
        console.error('Failed to load loan list:', err);
        
        // Force UI update for error state too
        this.ngZone.run(() => {
          this.error = 'Failed to load loan data. Please try again.';
          this.loading = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  calculateSummaryStats(): void {
    this.totalCustomers = this.loans.reduce((sum, loan) => sum + (Number(loan.totalcustomers) || 0), 0);
    this.totalLoanAmount = this.loans.reduce((sum, loan) => sum + (Number(loan.amount) || 0), 0);
  }

  // Direct DOM manipulation method (following established pattern from other components)
  updateDOMDirectly(): void {
    const loadingContainer = document.querySelector('.loading-container') as HTMLElement;
    const contentWrapper = document.querySelector('.content-wrapper') as HTMLElement;
    const errorContainer = document.querySelector('.error-container') as HTMLElement;
    
    console.log('Direct DOM update - loading:', this.loading, 'loans:', this.loans.length, 'error:', this.error);
    
    // Hide loading state
    if (loadingContainer) {
      loadingContainer.style.display = this.loading ? 'flex' : 'none';
    }
    
    // Show/hide error state
    if (errorContainer) {
      errorContainer.style.display = (this.error && !this.loading) ? 'block' : 'none';
    }
    
    // Show/hide content
    if (contentWrapper) {
      contentWrapper.style.display = (!this.loading && !this.error) ? 'block' : 'none';
    }
    
    // Update summary statistics directly
    const totalCustomersEl = document.querySelector('.total-customers-value') as HTMLElement;
    const totalAmountEl = document.querySelector('.total-amount-value') as HTMLElement;
    const recordCountEl = document.querySelector('.record-count') as HTMLElement;
    
    if (totalCustomersEl && !this.loading && !this.error) {
      totalCustomersEl.textContent = this.totalCustomers.toLocaleString();
    }
    
    if (totalAmountEl && !this.loading && !this.error) {
      totalAmountEl.textContent = `₹${this.totalLoanAmount.toLocaleString()}`;
    }
    
    if (recordCountEl && !this.loading && !this.error) {
      recordCountEl.textContent = `Total Products: ${this.loans.length}`;
    }
  }

  refreshData(): void {
    this.loadLoans();
  }

  getColumnValue(loan: LoanRecord, columnKey: string): any {
    const value = loan[columnKey as keyof LoanRecord];
    
    // Format amount with currency
    if (columnKey === 'amount' && typeof value === 'number') {
      return `₹${value.toLocaleString()}`;
    }
    
    // Format customer count
    if (columnKey === 'totalcustomers' && typeof value === 'number') {
      return value.toLocaleString();
    }
    
    return value || '-';
  }

  trackByLoanProduct(index: number, loan: LoanRecord): string {
    return loan.product || index.toString();
  }
}
