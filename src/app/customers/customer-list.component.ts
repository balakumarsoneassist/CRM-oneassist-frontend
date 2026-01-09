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
  isdirectmeet?: boolean;
  appoinmentdate?: string;
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

  // Reassignment properties
  isReassignModalOpen = false;
  isReasonModalOpen = false;
  isEmployeeModalOpen = false;
  selectedReassignCustomer: Customer | null = null;
  reassignReason = '';
  reassignCustomerList: Customer[] = [];
  employees: any[] = [];

  // Timeline properties
  isTimelineModalOpen = false;
  timelineData: any[] = [];
  selectedTimelineCustomer: Customer | null = null;

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
    { key: 'appoinmentdate', label: 'Appt. Date' },
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

    // If admin, keep all columns including actions
    // If not admin, remove the action column
    if (!this.isAdmin) {
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
        });
      },
      error: (err) => {
        console.error('Error loading customers:', err);
        this.error = 'Failed to load customers';
        this.ngZone.run(() => {
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
    });
  }

  convertToContact(customer: Customer): void {
    if (!confirm(`Convert ${customer.name} to contact?`)) return;

    this.loading = true;
    this.http
      .post<any>(`${environment.apiUrl}/api/customers/convert-to-contact`, {
        customerId: customer.id,
      })
      .subscribe({
        next: (response) => {
          alert('Customer converted to contact successfully');
          this.loading = false;
          this.loadCustomers();
        },
        error: (err) => {
          console.error('Error converting customer to contact:', err);
          const errorMessage =
            err.error?.details || err.error?.error || 'Internal server error';

          if (errorMessage.toLowerCase().includes('unique')) {
            alert('the customer has been following up');
          } else {
            alert(`Failed to convert to contact: ${errorMessage}`);
          }
          this.loading = false;
        },
      });
  }

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
