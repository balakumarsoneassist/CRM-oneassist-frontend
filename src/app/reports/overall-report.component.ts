import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../environments/environment';

interface FieldMeta {
  key: string;
  label: string;
  visible: boolean;
}

@Component({
  selector: 'app-overall-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './overall-report.component.html',
  styleUrls: ['./overall-report.component.css']
})
export class OverallReportComponent implements OnInit {
  showDialog = false;
  
  fields: FieldMeta[] = [
    { key: 'id', label: 'Employee ID', visible: false },
    { key: 'name', label: 'Name', visible: true },
    { key: 'customers', label: 'No. of Customers', visible: true }
  ];

  customers: Record<string, any>[] = [];
  loading = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.loadOverallReport();
  }

  private loadOverallReport(): void {
    this.loading = true;
    this.customers = [];
    
    console.log('Loading overall report from /svallcustomers');
    
    this.http.get<any>(`${environment.apiUrl}/svallcustomers`).subscribe({
      next: (response) => {
        console.log('Overall report API response:', response);
        
        // Handle different response formats
        let data = response;
        if (response && typeof response === 'object' && !Array.isArray(response)) {
          if (response.data) {
            data = response.data;
          } else if (response.result) {
            data = response.result;
          } else if (response.customers) {
            data = response.customers;
          }
        }
        
        // Ensure data is an array
        if (!Array.isArray(data)) {
          console.warn('Overall report API response is not an array:', data);
          data = [];
        }
        
        this.customers = data.map((obj: any) => {
          const normalized: Record<string, any> = {};
          Object.keys(obj || {}).forEach(k => {
            normalized[k.toLowerCase()] = obj[k];
          });
          
          return normalized;
        });
        
        this.loading = false;
        console.log('Processed overall report data:', this.customers);
        
        // Apply direct DOM manipulation fix for Angular change detection issues
        setTimeout(() => {
          this.applyDirectDOMUpdate();
        }, 100);
      },
      error: (err) => {
        console.error('Failed to load overall report', err);
        this.loading = false;
        // Show sample data for development
        this.customers = this.getSampleData();
        
        // Apply direct DOM manipulation fix even for sample data
        setTimeout(() => {
          this.applyDirectDOMUpdate();
        }, 100);
      }
    });
  }

  private applyDirectDOMUpdate(): void {
    // Multiple change detection attempts
    this.cdr.detectChanges();
    
    setTimeout(() => {
      this.cdr.detectChanges();
      
      this.ngZone.run(() => {
        this.cdr.detectChanges();
        
        // Force DOM update by directly manipulating the table
        setTimeout(() => {
          this.updateTableDirectly();
        }, 50);
      });
    }, 50);
  }

  private updateTableDirectly(): void {
    const tableBody = document.querySelector('.overall-report-component tbody');
    if (!tableBody) {
      console.warn('Table body not found for direct DOM update');
      return;
    }

    // Clear existing content
    tableBody.innerHTML = '';

    // Generate table rows directly
    this.customers.forEach((customer, index) => {
      const row = document.createElement('tr');
      
      // Add visible columns
      this.fields.filter(field => field.visible).forEach(field => {
        const cell = document.createElement('td');
        cell.textContent = customer[field.key] || '';
        row.appendChild(cell);
      });
      
      // Add Actions column with drilldown button
      const actionsCell = document.createElement('td');
      const button = document.createElement('button');
      button.className = 'drilldown-btn';
      button.innerHTML = '🔍 View Details';
      button.addEventListener('click', () => {
        this.drilldownEmployee(customer);
      });
      actionsCell.appendChild(button);
      row.appendChild(actionsCell);

      tableBody.appendChild(row);
    });

    console.log('Direct DOM update applied - table rows:', this.customers.length);
  }

  private getSampleData(): Record<string, any>[] {
    return [
      {
        id: 6033,
        name: 'Sample Employee 1',
        customers: '5'
      },
      {
        id: 4058,
        name: 'Sample Employee 2',
        customers: '12'
      },
      {
        id: 3,
        name: 'Sample Employee 3',
        customers: '8'
      }
    ];
  }
  
  drilldownEmployee(employee: Record<string, any>): void {
    // Navigate to employee customer details component
    this.router.navigate(['/dashboard/employee-customer-details', {
      empid: employee['id'],
      name: employee['name'],
      customers: employee['customers']
    }]);
  }

  get visibleColumns(): string[] {
    return this.fields.filter(f => f.visible).map(f => f.key);
  }

  get totalEmployees(): number {
    return this.customers.length;
  }

  get totalCustomers(): number {
    return this.customers.reduce((sum, emp) => {
      const customerCount = parseInt(emp['customers']) || 0;
      return sum + customerCount;
    }, 0);
  }

  get averageCustomersPerEmployee(): number {
    if (this.customers.length === 0) return 0;
    return Math.round(this.totalCustomers / this.customers.length);
  }

  openDialog(): void {
    this.showDialog = true;
  }

  closeDialog(): void {
    this.showDialog = false;
  }

  refreshReport(): void {
    this.loadOverallReport();
  }

  exportReport(): void {
    // TODO: Implement export functionality if needed
    console.log('Export report functionality can be implemented here');
    alert('Export functionality can be added if needed.');
  }

  toggleColumn(field: FieldMeta): void {
    field.visible = !field.visible;
  }

  getLabel(key: string): string {
    return this.fields.find(f => f.key === key)?.label || key;
  }
}
