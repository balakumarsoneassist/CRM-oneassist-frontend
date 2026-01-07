import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-employee-customer-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './employee-customer-details.component.html',
  styleUrls: ['./employee-customer-details.component.css']
})
export class EmployeeCustomerDetailsComponent implements OnInit {
  employee: Record<string, any> = {};
  customers: Record<string, any>[] = [];
  loading = false;
  employeeId: string = '';

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.employeeId = params['empid'];
      this.employee = {
        id: params['empid'],
        name: params['name'] || 'Unknown Employee',
        customers: params['customers'] || '0'
      };
      this.loadCustomers();
    });
  }

  loadCustomers(): void {
    this.loading = true;
    this.customers = [];

    this.http.get<any>(`${environment.apiUrl}/svcustomersbyemp/${this.employeeId}`).subscribe({
      next: (response) => {
        console.log('Employee customers response:', response);
        
        // Handle different response formats
        let data = [];
        if (response && response.success && response.data) {
          data = response.data;
        } else if (response && Array.isArray(response)) {
          data = response;
        } else if (response && response.customers) {
          data = response.customers;
        } else if (response && response.result) {
          data = response.result;
        }
        
        this.customers = (data || []).map((obj: any) => {
          const normalized: Record<string, any> = {};
          Object.keys(obj || {}).forEach(k => {
            normalized[k.toLowerCase()] = obj[k];
          });
          return normalized;
        });
        
        this.loading = false;
        
        // Apply direct DOM manipulation for reliable display
        setTimeout(() => {
          this.applyDirectDOMUpdate();
        }, 100);
      },
      error: (err) => {
        console.error('Failed to load employee customers:', err);
        this.loading = false;
        
        // Show sample data for development
        this.customers = this.getSampleCustomerData();
        
        setTimeout(() => {
          this.applyDirectDOMUpdate();
        }, 100);
      }
    });
  }

  private getSampleCustomerData(): Record<string, any>[] {
    return [
      {
        id: 1,
        name: 'Sample Customer 1',
        mobileno: '9876543210',
        location: 'Chennai'
      },
      {
        id: 2,
        name: 'Sample Customer 2', 
        mobileno: '9876543211',
        location: 'Bangalore'
      },
      {
        id: 3,
        name: 'Sample Customer 3',
        mobileno: '9876543212',
        location: 'Mumbai'
      }
    ];
  }

  private applyDirectDOMUpdate(): void {
    // Multiple change detection attempts
    this.cdr.detectChanges();
    
    setTimeout(() => {
      this.cdr.detectChanges();
      
      this.ngZone.run(() => {
        this.cdr.detectChanges();
        
        // Force table display with direct DOM manipulation
        setTimeout(() => {
          this.updateTableDirectly();
        }, 50);
      });
    }, 50);
  }

  private updateTableDirectly(): void {
    const tableBody = document.querySelector('.employee-customer-details-component tbody');
    if (!tableBody) {
      console.warn('Table body not found for direct DOM update');
      return;
    }

    // Clear existing content
    tableBody.innerHTML = '';

    // Generate table rows directly
    this.customers.forEach((customer) => {
      const row = document.createElement('tr');
      
      // ID column
      const idCell = document.createElement('td');
      idCell.textContent = customer['id'] || '';
      row.appendChild(idCell);
      
      // Name column
      const nameCell = document.createElement('td');
      nameCell.textContent = customer['name'] || '';
      row.appendChild(nameCell);
      
      // Mobile column
      const mobileCell = document.createElement('td');
      mobileCell.textContent = customer['mobileno'] || '';
      row.appendChild(mobileCell);
      
      // Location column
      const locationCell = document.createElement('td');
      locationCell.textContent = customer['location'] || '';
      row.appendChild(locationCell);

      tableBody.appendChild(row);
    });

    console.log('Customer table updated via direct DOM manipulation');
  }

  goBack(): void {
    this.router.navigate(['/dashboard/overall-report']);
  }

  refreshData(): void {
    this.loadCustomers();
  }
}
