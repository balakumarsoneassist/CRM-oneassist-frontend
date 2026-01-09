import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';

interface Customer {
  id: number;
  name: string;
  mobilenumber: string;
  product: string;
  loandate: string;
  bank: string;
  loanamount: string;
  converter: string;
  leadid?: number;
}

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customer-list.component.html',
  styleUrls: ['./customer-list.component.css'],
})
export class CustomerListComponent implements OnInit {
  customers: Customer[] = [];
  loading = false;
  error: string | null = null;
  isAdmin = false;

  // Define visible columns (excluding id)
  displayColumns = [
    { key: 'name', label: 'Customer Name' },
    { key: 'mobilenumber', label: 'Mobile Number' },
    { key: 'product', label: 'Product' },
    { key: 'loandate', label: 'Loan Date' },
    { key: 'bank', label: 'Bank' },
    { key: 'loanamount', label: 'Loan Amount' },
    { key: 'converter', label: 'Converter' },
    { key: 'actions', label: 'Actions' },
  ];

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const isAdminRights = localStorage.getItem('isadminrights');
    this.isAdmin = isAdminRights === 'true';

    // If admin, remove the action column since it is empty
    if (this.isAdmin) {
      this.displayColumns = this.displayColumns.filter(
        (col) => col.key !== 'actions'
      );
    }

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
      },
    });
  }

  // Direct DOM manipulation method (following established pattern from other components)
  updateDOMDirectly(): void {
    const loadingContainer = document.querySelector(
      '.loading-container'
    ) as HTMLElement;
    const tableWrapper = document.querySelector(
      '.table-wrapper'
    ) as HTMLElement;
    const errorContainer = document.querySelector(
      '.error-container'
    ) as HTMLElement;

    console.log(
      'Direct DOM update - loading:',
      this.loading,
      'customers:',
      this.customers.length,
      'error:',
      this.error
    );

    // Hide loading state
    if (loadingContainer) {
      loadingContainer.style.display = this.loading ? 'flex' : 'none';
    }

    // Show/hide error state
    if (errorContainer) {
      errorContainer.style.display =
        this.error && !this.loading ? 'block' : 'none';
    }

    // Show/hide table
    if (tableWrapper) {
      tableWrapper.style.display =
        !this.loading && !this.error ? 'block' : 'none';
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
    return customer[columnKey as keyof Customer];
  }

  trackByCustomerId(index: number, customer: Customer): number {
    return customer.id;
  }

  followUp(customer: Customer): void {
    if (!customer) return;

    const userId = localStorage.getItem('usernameID');
    const salesVisitData = {
      name: customer.name,
      mobileno: customer.mobilenumber,
      createdby: userId ? parseInt(userId) : null,
      notes: `Generated from Customer List - Product: ${customer.product}, Bank: ${customer.bank}`,
      dateofvisit: new Date().toISOString().slice(0, 16), // Current time for initial track
      remarks: 'Started follow up from customer list',
      contactflag: false,
    };

    this.http
      .post(`${environment.apiUrl}/savesalesvisit`, salesVisitData)
      .subscribe({
        next: (response) => {
          console.log(
            'Successfully reflected in sales visit module:',
            response
          );
          alert('the customer has been following up');
        },
        error: (err) => {
          console.error(
            'Error reflecting customer in sales visit module:',
            err
          );
          const errorMessage =
            err.error?.details || err.error?.error || 'Internal server error';

          if (errorMessage.toLowerCase().includes('unique')) {
            alert('the customer has been following up');
          } else {
            alert(`Failed to process follow up: ${errorMessage}`);
          }
        },
      });
  }
  // Reassignment Logic State
  isReassignModalOpen = false;
  isEmployeeModalOpen = false;
  isReasonModalOpen = false;

  selectedReassignCustomer: Customer | null = null;
  reassignReason: string = '';

  employees: any[] = [];
  reassignCustomerList: Customer[] = []; // List for the modal

  openReassignFlow(): void {
    if (!this.isAdmin) return;
    this.isReassignModalOpen = true;
    this.reassignCustomerList = [...this.customers]; // Initial copy
    this.fetchEmployees();
  }

  closeReassignModal(): void {
    this.isReassignModalOpen = false;
  }

  openReasonModal(customer: Customer): void {
    this.selectedReassignCustomer = customer;
    this.reassignReason = ''; // Reset reason
    this.isReasonModalOpen = true;
  }

  closeReasonModal(): void {
    this.isReasonModalOpen = false;
    this.reassignReason = '';
  }

  submitReason(): void {
    if (!this.reassignReason || this.reassignReason.trim() === '') {
      alert('Please enter a reason for reassignment.');
      return;
    }
    this.isReasonModalOpen = false;
    this.isEmployeeModalOpen = true; // Proceed to employee selection
  }

  closeEmployeeModal(): void {
    this.isEmployeeModalOpen = false;
    this.selectedReassignCustomer = null;
  }

  fetchEmployees(): void {
    if (this.employees.length > 0) return; // Cached
    this.http
      .get<any>(`${environment.apiUrl}/api/target-assignment-status`)
      .subscribe({
        next: (res) => {
          const assigned = res.assigned || [];
          const unassigned = res.unassigned || [];
          this.employees = [...assigned, ...unassigned];
          this.employees = this.employees.filter(
            (emp, index, self) =>
              index === self.findIndex((t) => t.id === emp.id)
          );
        },
        error: (err) => console.error('Failed to fetch employees', err),
      });
  }

  confirmReassign(employee: any): void {
    if (!this.selectedReassignCustomer || !employee) return;

    // Optional: Include reason in confirmation message
    if (
      !confirm(
        `Reassigning ${this.selectedReassignCustomer.name} to ${employee.name}.\nReason: ${this.reassignReason}\n\nProceed?`
      )
    )
      return;

    this.loading = true;
    const payload = {
      customerId: this.selectedReassignCustomer.id,
      empid: employee.id,
      orgid: localStorage.getItem('organizationid'),
      reason: this.reassignReason, // Sending reason to backend if needed
    };

    this.http
      .post<any>(
        `${environment.apiUrl}/api/customers/reassign-to-employee`,
        payload
      )
      .subscribe({
        next: (res) => {
          alert(`Successfully reassigned to ${employee.name}`);
          this.loading = false;
          this.closeEmployeeModal();
          this.loadCustomers();
        },
        error: (err) => {
          console.error('Reassignment failed', err);
          alert('Failed to reassign customer.');
          this.loading = false;
        },
      });
  }

  // Timeline Logic
  isTimelineModalOpen = false;
  timelineData: any[] = [];
  selectedTimelineCustomer: Customer | null = null;

  openTimeline(customer: Customer): void {
    if (!this.isAdmin) return;
    this.selectedTimelineCustomer = customer;
    this.isTimelineModalOpen = true;
    this.timelineData = []; // Clear previous

    this.http
      .get<any>(`${environment.apiUrl}/api/customers/${customer.id}/timeline`)
      .subscribe({
        next: (res) => {
          console.log('Timeline API Response:', res);
          if (res.success) {
            this.ngZone.run(() => {
              this.timelineData = res.data;
              this.cdr.detectChanges();
            });
          }
        },
        error: (err) => console.error('Failed to fetch timeline', err),
      });
  }

  closeTimelineModal(): void {
    this.isTimelineModalOpen = false;
    this.selectedTimelineCustomer = null;
  }
}
