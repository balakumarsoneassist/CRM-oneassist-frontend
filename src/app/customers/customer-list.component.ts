import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { TrackNumberService } from '../services/track-number.service';
import { Subscription } from 'rxjs';

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
  activeTab: 'new' | 'existing' = 'new';

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
    { key: 'following', label: 'Following' },
    { key: 'actions', label: 'Actions' },
  ];

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private authService: AuthService,
    private router: Router,
    private trackNumberService: TrackNumberService
  ) { }

  ngOnInit(): void {
    const isAdminRights = localStorage.getItem('isadminrights');
    this.isAdmin = isAdminRights === 'true';

    // If admin, keep all columns including actions
    // If not admin, remove the action column
    if (!this.isAdmin) {
      this.displayColumns = this.displayColumns.filter(
        (col) => col.key !== 'following'
      );
    } else {
      // If admin, remove actions column as requested
      this.displayColumns = this.displayColumns.filter(
        (col) => col.key !== 'actions'
      );
    }

    this.loadCustomers();
  }

  page = 1;
  limit = 25;
  hasMore = true;
  totalCustomers = 0;
  productOptions = ['HL', 'PL', 'BL', 'LAP', 'AL', 'WC', 'OD', 'CC'];
  selectedProducts: string[] = [];

  // ... (existing imports)

  requestSubscription: Subscription | null = null;
  selectedProduct: string = '';

  // ... (existing imports)

  setActiveTab(tab: 'new' | 'existing'): void {
    if (this.activeTab === tab) return;
    if (this.requestSubscription) {
      this.requestSubscription.unsubscribe();
    }
    this.activeTab = tab;
    this.page = 1; // Reset to first page on tab switch
    this.selectedProducts = []; // Reset filters
    this.selectedProduct = ''; // Reset UI
    this.loadCustomers();
  }

  onProductSelect(event: any): void {
    const selectedValue = event.target.value;
    this.selectedProduct = selectedValue;
    if (selectedValue) {
      this.selectedProducts = [selectedValue];
    } else {
      this.selectedProducts = [];
    }
    this.page = 1;
    this.loadCustomers();
  }

  loadCustomers(): void {
    if (this.requestSubscription) {
      this.requestSubscription.unsubscribe();
    }

    this.loading = true;
    this.error = null;

    this.ngZone.run(() => {
      this.cdr.detectChanges();
    });

    let url = `${environment.apiUrl}/getcustomerlist?type=${this.activeTab}&page=${this.page}&limit=${this.limit}`;
    if (this.selectedProducts.length > 0) {
      const productsParam = encodeURIComponent(this.selectedProducts.join(','));
      url += `&products=${productsParam}`;
    }

    this.requestSubscription = this.http.get<any>(url).subscribe({
      next: (response) => {
        console.log('Customer list data:', response);

        if (response && response.data && Array.isArray(response.data)) {
          let loadedCustomers = response.data;

          // Frontend Safety Filter: If not admin, strictly enforce ownership
          if (!this.isAdmin) {
            const loggedInUserId = localStorage.getItem('usernameID'); // Ensure this matches backend ID type (string/int)
            if (loggedInUserId) {
              loadedCustomers = loadedCustomers.filter((c: any) =>
                // Check if customer is assigned to logged in user
                // Use loose equality (==) to handle string vs number differences
                c.leadfollowedby == loggedInUserId
              );
            }
          }

          this.customers = loadedCustomers;
          this.hasMore = response.data.length === this.limit;
          this.totalCustomers = this.isAdmin ? (response.count !== undefined ? response.count : this.customers.length) : this.customers.length;
        } else if (Array.isArray(response)) {
          this.customers = response;
          this.hasMore = response.length === this.limit;
          this.totalCustomers = response.length;
        } else {
          this.customers = [];
          this.hasMore = false;
          this.totalCustomers = 0;
        }

        console.log('Processed customers:', this.customers);

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

  onLimitChange(): void {
    this.page = 1;
    this.loadCustomers();
  }

  nextPage(): void {
    this.page++;
    this.loadCustomers();
  }

  prevPage(): void {
    if (this.page > 1) {
      this.page--;
      this.loadCustomers();
    }
  }

  refreshData(): void {
    this.loadCustomers();
  }

  trackByCustomerId(index: number, customer: Customer): number {
    return customer.id;
  }

  getColumnValue(customer: any, key: string): any {
    return customer[key];
  }

  followUp(customer: Customer): void {
    const userId = localStorage.getItem('usernameID');
    const orgId = localStorage.getItem('organizationid');

    if (!userId || !orgId) {
      alert('User session invalid. Please login again.');
      return;
    }

    this.loading = true;
    this.http.post(`${environment.apiUrl}/start-tracking`, {
      customerId: customer.id,
      userId: userId,
      orgId: orgId
    }).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.success) {
          // Navigate to Track Customers page
          this.router.navigate(['/dashboard/trackcustomers']);
        } else {
          alert('Failed to start tracking.');
        }
      },
      error: (err) => {
        this.loading = false;
        console.error('Error starting tracking:', err);
        alert('An error occurred while trying to follow up.');
      }
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
  openFollowUpPopup(event: Event) {
    event.stopPropagation();
    alert('The customer has been reconnected to discuss newly available services and provide updated assistance.');
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
