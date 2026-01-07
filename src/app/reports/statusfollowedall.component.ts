import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../environments/environment';

interface FollowStatusItem {
  [key: string]: any; // Flexible interface since we don't know the exact API response structure
}

interface FollowStatusResponse {
  success?: boolean;
  data?: FollowStatusItem[];
  [key: string]: any; // Allow for other response properties
}

@Component({
  selector: 'app-statusfollowedall',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="statusfollowedall-container">
      <div class="header">
        <h2 id="report-heading">Status Follow Report</h2>
        <button (click)="goBack()" class="back-btn">← Back to Summary</button>
      </div>
      
      <div id="loading-box" style="text-align: center; padding: 40px; font-size: 16px; display: block;">
        <div style="display: inline-block; width: 20px; height: 20px; border: 3px solid #f3f3f3; border-top: 3px solid #007bff; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 10px;"></div>
        Loading follow status data...
      </div>
      
      <div id="error-box" style="text-align: center; padding: 40px; font-size: 16px; color: #dc3545; display: none;">
        <span id="error-message">Error message will appear here</span>
        <button (click)="loadData()" class="retry-btn" style="margin-left: 10px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Retry</button>
      </div>
      
      <div id="content-container" style="display: none;">
        <!-- Report Info -->
        <div class="report-info">
          <div class="info-card">
            <span class="label">Organization ID:</span>
            <span class="value" id="org-id-value">Loading...</span>
          </div>
          <div class="info-card">
            <span class="label">Status Code:</span>
            <span class="value" id="status-code-value">Loading...</span>
          </div>
          <div class="info-card">
            <span class="label">Total Records:</span>
            <span class="value" id="total-records-value">Loading...</span>
          </div>
        </div>
        
        <!-- Data Table -->
        <div id="data-table-container" class="data-table-container">
          <div id="table-content">Table will be populated here...</div>
        </div>
        
        <!-- No Data Message -->
        <div id="no-data-message" class="no-data" style="display: none;">
          <div class="no-data-icon">📋</div>
          <h3>No Records Found</h3>
          <p>No follow status records found for the selected criteria.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .statusfollowedall-container {
      padding: 20px;
      max-width: 1400px;
      margin: 0 auto;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 2px solid #e9ecef;
    }
    
    .header h2 {
      color: #333;
      margin: 0;
    }
    
    .back-btn {
      padding: 10px 20px;
      background: #6c757d;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.3s ease;
    }
    
    .back-btn:hover {
      background: #5a6268;
    }
    
    .loading, .error {
      text-align: center;
      padding: 40px;
      font-size: 16px;
    }
    
    .error {
      color: #dc3545;
    }
    
    .retry-btn {
      margin-left: 10px;
      padding: 8px 16px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    
    .retry-btn:hover {
      background: #0056b3;
    }
    
    .report-info {
      display: flex;
      gap: 20px;
      margin-bottom: 30px;
      flex-wrap: wrap;
    }
    
    .info-card {
      background: #f8f9fa;
      padding: 15px 20px;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      gap: 5px;
      min-width: 150px;
    }
    
    .info-card .label {
      font-size: 12px;
      color: #666;
      font-weight: bold;
      text-transform: uppercase;
    }
    
    .info-card .value {
      font-size: 18px;
      color: #333;
      font-weight: bold;
    }
    
    .data-table-container {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    
    .data-table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .table-header {
      background: #007bff;
      color: white;
      padding: 15px 12px;
      text-align: left;
      font-weight: bold;
      font-size: 14px;
      border-bottom: 2px solid #0056b3;
    }
    
    .table-row:nth-child(even) {
      background: #f8f9fa;
    }
    
    .table-row:hover {
      background: #e3f2fd;
    }
    
    .table-cell {
      padding: 12px;
      border-bottom: 1px solid #dee2e6;
      font-size: 14px;
      color: #333;
    }
    
    .no-data {
      text-align: center;
      padding: 60px 20px;
      color: #666;
    }
    
    .no-data-icon {
      font-size: 48px;
      margin-bottom: 20px;
    }
    
    .no-data h3 {
      margin: 0 0 10px 0;
      color: #333;
    }
    
    .no-data p {
      margin: 0;
      font-size: 16px;
    }
    
    @media (max-width: 768px) {
      .statusfollowedall-container {
        padding: 10px;
      }
      
      .header {
        flex-direction: column;
        gap: 15px;
        align-items: flex-start;
      }
      
      .report-info {
        flex-direction: column;
      }
      
      .data-table-container {
        overflow-x: auto;
      }
      
      .table-header,
      .table-cell {
        padding: 8px;
        font-size: 12px;
      }
    }
  `]
})
export class StatusFollowedAllComponent implements OnInit {
  followItems: FollowStatusItem[] = [];
  loading = true;
  error: string | null = null;
  orgId = localStorage.getItem('organizationid') || '';
  statusCode: string = '';
  statusLabel: string = '';
  reportType: string = '';

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Get statuscode from route parameters and label from query parameters
    this.route.params.subscribe(params => {
      this.statusCode = params['statuscode'] || '';
    });
    
    this.route.queryParams.subscribe(queryParams => {
      this.statusLabel = queryParams['label'] || `Status ${this.statusCode}`;
      // Extract report type (Contact or Lead) from statusLabel
      if (this.statusLabel.toLowerCase().includes('contact')) {
        this.reportType = 'Contact';
      } else if (this.statusLabel.toLowerCase().includes('lead')) {
        this.reportType = 'Lead';
      } else {
        this.reportType = 'Status';
      }
      this.loadData();
    });
  }

  loadData(): void {
    if (!this.orgId) {
      this.error = 'No organization ID found. Please log in again.';
      return;
    }

    if (!this.statusCode) {
      this.error = 'No status code provided.';
      return;
    }

    this.loading = true;
    this.error = null;

    console.log('Loading follow status data for org:', this.orgId, 'statuscode:', this.statusCode);

    const params = {
      orgid: this.orgId,
      statuscode: this.statusCode
    };

    // Determine which API endpoint to call based on statuscode
    const statusCodeNum = parseInt(this.statusCode);
    let apiEndpoint: string;
    
    if ((statusCodeNum < 11) || (statusCodeNum == 22)) {
      apiEndpoint = `/ContactFollowallStatusRportSummaryList`;
    } else {
      apiEndpoint = `/LeadFollowallStatusRportSummaryList`;
    }
    
    console.log('Using API endpoint:', apiEndpoint, 'for statuscode:', statusCodeNum);
    
    this.http.get<FollowStatusResponse>(`${environment.apiUrl}${apiEndpoint}`, { params }).subscribe({
      next: (response) => {
        console.log('Follow status response:', response);
        
        // Handle different response formats
        if (response && Array.isArray(response)) {
          // Direct array response
          this.followItems = response;
        } else if (response && response.success && Array.isArray(response.data)) {
          // Wrapped response with success flag
          this.followItems = response.data;
        } else if (response && response.data && Array.isArray(response.data)) {
          // Wrapped response without success flag
          this.followItems = response.data;
        } else if (response && typeof response === 'object') {
          // Single object response, convert to array
          this.followItems = [response];
        } else {
          this.followItems = [];
        }
        
        // Use setTimeout to ensure change detection fires (proven solution)
        setTimeout(() => {
          this.loading = false;
          console.log('Follow status data loaded:', this.followItems.length, 'items');
          
          // Direct DOM manipulation to bypass Angular's change detection issues
          setTimeout(() => {
            this.updateDOMDirectly();
            console.log('Direct DOM manipulation executed for follow status data');
          }, 20);
        }, 0);
      },
      error: (err) => {
        console.error('Failed to load follow status data:', err);
        this.error = `Failed to load data: ${err.status} ${err.statusText}`;
        setTimeout(() => {
          this.loading = false;
        }, 0);
      }
    });
  }

  getTableHeaders(): string[] {
    if (this.followItems.length === 0) return [];
    
    // Get all unique keys from the first few items to determine table headers
    const headers = new Set<string>();
    const itemsToCheck = this.followItems.slice(0, Math.min(5, this.followItems.length));
    
    itemsToCheck.forEach(item => {
      Object.keys(item).forEach(key => headers.add(key));
    });
    
    // Filter out contactfollowedby and leadfollowedby columns
    const filteredHeaders = Array.from(headers).filter(header => 
      !header.toLowerCase().includes('contactfollowedby') && 
      !header.toLowerCase().includes('leadfollowedby')
    );
    
    return filteredHeaders.sort();
  }

  getDisplayValue(value: any): string {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  goBack(): void {
    this.router.navigate(['/dashboard/status-report-summary']);
  }

  viewItemDetails(item: FollowStatusItem, index: number): void {
    console.log('View details clicked for item:', item, 'at index:', index);
    
    // Extract empid from contactfollowedby or leadfollowedby field
    let empId = '';
    if (item['contactfollowedby']) {
      empId = item['contactfollowedby'];
    } else if (item['leadfollowedby']) {
      empId = item['leadfollowedby'];
    } else {
      // Look for any field that might contain employee ID
      const possibleEmpFields = Object.keys(item).filter(key => 
        key.toLowerCase().includes('emp') || 
        key.toLowerCase().includes('follow')
      );
      if (possibleEmpFields.length > 0) {
        empId = item[possibleEmpFields[0]];
      }
    }
    
    // Extract employee name from name field
    const empName = item['name'] || item['employeename'] || item['emp_name'] || '';
    
    if (empId && this.statusCode) {
      console.log('Navigating to empwisefollowedlist with empid:', empId, 'statuscode:', this.statusCode, 'name:', empName);
      this.router.navigate(['/dashboard/empwisefollowedlist', empId, this.statusCode], {
        queryParams: { name: empName }
      });
    } else {
      console.error('Missing empid or statuscode for navigation:', { empId, statusCode: this.statusCode });
      alert(`Cannot navigate: Missing employee ID or status code.\nEmployee ID: ${empId}\nStatus Code: ${this.statusCode}`);
    }
  }

  updateDOMDirectly(): void {
    // Direct DOM manipulation to bypass Angular's change detection issues
    const loadingBox = document.getElementById('loading-box');
    const errorBox = document.getElementById('error-box');
    const contentContainer = document.getElementById('content-container');
    const reportHeading = document.getElementById('report-heading');
    const orgIdValue = document.getElementById('org-id-value');
    const statusCodeValue = document.getElementById('status-code-value');
    const totalRecordsValue = document.getElementById('total-records-value');
    const tableContent = document.getElementById('table-content');
    const noDataMessage = document.getElementById('no-data-message');
    
    // Hide loading box
    if (loadingBox) {
      loadingBox.style.display = 'none';
    }
    
    // Hide error box
    if (errorBox) {
      errorBox.style.display = 'none';
    }
    
    // Show content container
    if (contentContainer) {
      contentContainer.style.display = 'block';
    }
    
    // Update report heading with type
    if (reportHeading) {
      reportHeading.textContent = `Status Follow Report - ${this.reportType}`;
    }
    
    // Update info values
    if (orgIdValue) {
      orgIdValue.textContent = this.orgId;
    }
    if (statusCodeValue) {
      statusCodeValue.textContent = this.statusLabel;
    }
    if (totalRecordsValue) {
      totalRecordsValue.textContent = this.followItems.length.toString();
    }
    
    // Generate and display table or no data message
    if (this.followItems.length > 0) {
      if (tableContent) {
        const headers = this.getTableHeaders();
        
        // Create 3-column layout with proper spacing
        let tableHTML = `
          <table class="data-table" style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
              <tr>
                <th class="table-header" style="width: 35%; padding: 12px; text-align: left; background: #f8f9fa; border: 1px solid #dee2e6;">${headers[0] ? this.titleCase(headers[0]) : 'Column 1'}</th>
                <th class="table-header" style="width: 35%; padding: 12px; text-align: left; background: #f8f9fa; border: 1px solid #dee2e6;">${headers[1] ? this.titleCase(headers[1]) : 'Column 2'}</th>
                <th class="table-header" style="width: 30%; padding: 12px; text-align: center; background: #f8f9fa; border: 1px solid #dee2e6;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${this.followItems.map((item, index) => `
                <tr class="table-row" style="border-bottom: 1px solid #dee2e6;">
                  <td class="table-cell" style="width: 35%; padding: 12px; border: 1px solid #dee2e6; vertical-align: middle;">${headers[0] ? this.getDisplayValue(item[headers[0]]) : '-'}</td>
                  <td class="table-cell" style="width: 35%; padding: 12px; border: 1px solid #dee2e6; vertical-align: middle;">${headers[1] ? this.getDisplayValue(item[headers[1]]) : '-'}</td>
                  <td class="table-cell" style="width: 30%; padding: 12px; border: 1px solid #dee2e6; text-align: center; vertical-align: middle;">
                    <button id="detail-btn-${index}" class="detail-btn" style="background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 14px; transition: background-color 0.2s;">View Details</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
        tableContent.innerHTML = tableHTML;
        
        // Add event listeners for View Details buttons
        this.followItems.forEach((item, index) => {
          const button = document.getElementById(`detail-btn-${index}`);
          if (button) {
            button.addEventListener('click', () => {
              this.viewItemDetails(item, index);
            });
            
            // Add hover effects
            button.addEventListener('mouseenter', () => {
              button.style.backgroundColor = '#0056b3';
            });
            button.addEventListener('mouseleave', () => {
              button.style.backgroundColor = '#007bff';
            });
          }
        });
      }
      
      if (noDataMessage) {
        noDataMessage.style.display = 'none';
      }
    } else {
      if (tableContent) {
        tableContent.innerHTML = '';
      }
      
      if (noDataMessage) {
        noDataMessage.style.display = 'block';
      }
    }
    
    console.log('DOM elements updated directly:', {
      loadingBox: !!loadingBox,
      errorBox: !!errorBox,
      contentContainer: !!contentContainer,
      itemsLength: this.followItems.length
    });
  }
  
  private titleCase(str: string): string {
    return str.replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  }
}
