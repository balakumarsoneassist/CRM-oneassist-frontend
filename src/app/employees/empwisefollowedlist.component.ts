import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { environment } from '../../environments/environment';
import { TrackNumberService } from '../services/track-number.service';
import { ContactFollowTrackComponent } from '../contacts/contactfollowtrack.component';

interface EmpFollowItem {
  [key: string]: any;
}

interface EmpFollowResponse {
  success?: boolean;
  data?: EmpFollowItem[];
}

@Component({
  selector: 'app-empwisefollowedlist',
  standalone: true,
  imports: [CommonModule, ContactFollowTrackComponent],
  template: `
    <div class="empwisefollowedlist-container">
      <div class="header">
        <h2 id="report-heading">Employee Wise Follow Report</h2>
        <button (click)="goBack()" class="back-btn">← Back to Previous</button>
      </div>
      
      <div id="loading-box" style="text-align: center; padding: 40px; font-size: 16px; display: block;">
        <div style="display: inline-block; width: 20px; height: 20px; border: 3px solid #f3f3f3; border-top: 3px solid #007bff; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 10px;"></div>
        Loading employee follow data...
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
            <span class="label">Employee Name:</span>
            <span class="value" id="emp-name-value">Loading...</span>
          </div>
          <div class="info-card">
            <span class="label">Status:</span>
            <span class="value" id="status-label-value">Loading...</span>
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
        <div id="no-data-message" style="text-align: center; padding: 40px; font-size: 16px; color: #6c757d; display: none;">
          No employee follow data found for the specified criteria.
        </div>
      </div>
      
      <!-- Track Popup -->
      <div id="track-popup-overlay" class="popup-overlay" style="display: none;">
        <div class="popup-content" id="track-popup-content">
          <div class="popup-header">
            <h3>Contact Follow Track</h3>
            <button class="close-btn" id="track-popup-close">&times;</button>
          </div>
          <div class="popup-body">
            <app-contactfollowtrack></app-contactfollowtrack>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .empwisefollowedlist-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 2px solid #007bff;
    }
    
    .header h2 {
      color: #007bff;
      margin: 0;
      font-size: 24px;
    }
    
    .back-btn {
      background: #6c757d;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 5px;
      cursor: pointer;
      font-size: 14px;
      transition: background-color 0.2s;
    }
    
    .back-btn:hover {
      background: #5a6268;
    }
    
    .report-info {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 20px;
    }
    
    .info-card {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #007bff;
    }
    
    .info-card .label {
      font-weight: bold;
      color: #495057;
      display: block;
      margin-bottom: 5px;
    }
    
    .info-card .value {
      color: #007bff;
      font-size: 16px;
      font-weight: 600;
    }
    
    .data-table-container {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      overflow-x: auto;
    }
    
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    
    .table-header {
      background: #007bff;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      border: 1px solid #0056b3;
    }
    
    .table-cell {
      padding: 12px;
      border: 1px solid #dee2e6;
      vertical-align: middle;
    }
    
    .table-row:nth-child(even) {
      background-color: #f8f9fa;
    }
    
    .table-row:hover {
      background-color: #e3f2fd;
    }
    
    .detail-btn {
      background: #28a745;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      transition: background-color 0.2s;
    }
    
    .detail-btn:hover {
      background: #218838;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .retry-btn:hover {
      background: #0056b3;
    }
    
    .popup-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
    
    .popup-content {
      background: white;
      border-radius: 8px;
      width: 90%;
      max-width: 1200px;
      max-height: 90%;
      overflow: auto;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }
    
    .popup-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #dee2e6;
      background: #f8f9fa;
      border-radius: 8px 8px 0 0;
    }
    
    .popup-header h3 {
      margin: 0;
      color: #007bff;
      font-size: 18px;
    }
    
    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #6c757d;
      padding: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .close-btn:hover {
      color: #dc3545;
    }
    
    .popup-body {
      padding: 20px;
    }
  `]
})
export class EmpWiseFollowedListComponent implements OnInit {
  followItems: EmpFollowItem[] = [];
  loading = true;
  error: string | null = null;
  orgId = localStorage.getItem('organizationid') || '';
  empId: string = '';
  statusCode: string = '';
  statusLabel: string = '';
  empName: string = '';
  showTrackPopup = false;
  selectedTrackNumber: string | null = null;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private trackNumberService: TrackNumberService
  ) { }

  ngOnInit(): void {
    // Get parameters from route
    this.route.params.subscribe(params => {
      this.empId = params['empid'] || '';
      this.statusCode = params['statuscode'] || '';
    });

    // Get employee name from query parameters
    this.route.queryParams.subscribe(queryParams => {
      this.empName = queryParams['name'] || `Employee ${this.empId}`;
      this.loadData();
    });
  }

  loadData(): void {
    if (!this.empId || !this.statusCode) {
      this.error = 'Missing required parameters: empid and statuscode.';
      return;
    }

    this.loading = true;
    this.error = null;

    console.log('Loading employee follow data for org:', this.orgId, 'empid:', this.empId, 'statuscode:', this.statusCode);

    const params = {
      orgid: this.orgId,
      empid: this.empId,
      statuscode: this.statusCode
    };

    this.http.get<EmpFollowResponse>(`${environment.apiUrl}/LCFollowEmpStatusRportSummaryList`, { params }).subscribe({
      next: (response) => {
        console.log('Employee follow response:', response);

        // Handle different response formats
        if (response && Array.isArray(response)) {
          this.followItems = response;
        } else if (response && response.success && Array.isArray(response.data)) {
          this.followItems = response.data;
        } else if (response && response.data) {
          this.followItems = Array.isArray(response.data) ? response.data : [response.data];
        } else {
          this.followItems = [];
        }

        // Extract and combine status and statustype to create statusLabel
        if (this.followItems.length > 0) {
          const firstItem = this.followItems[0];
          const status = firstItem['status'] || '';
          const statustype = firstItem['statustype'] || '';

          if (status && statustype) {
            this.statusLabel = `${status} - ${statustype}`;
          } else if (status) {
            this.statusLabel = status;
          } else if (statustype) {
            this.statusLabel = statustype;
          } else {
            this.statusLabel = `Status ${this.statusCode}`;
          }
        } else {
          this.statusLabel = `Status ${this.statusCode}`;
        }

        setTimeout(() => {
          this.loading = false;
          // Use direct DOM manipulation for reliable rendering
          setTimeout(() => {
            this.updateDOMDirectly();
            console.log('Direct DOM manipulation executed for employee follow data');
          }, 20);
        }, 0);
      },
      error: (err) => {
        console.error('Failed to load employee follow data:', err);
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

    // Filter out unwanted columns
    const filteredHeaders = Array.from(headers).filter(header =>
      !header.toLowerCase().includes('contactfollowedby') &&
      !header.toLowerCase().includes('leadfollowedby') &&
      !header.toLowerCase().includes('contactfolloedby') &&
      !header.toLowerCase().includes('status') &&
      !header.toLowerCase().includes('statustype')
    );

    return filteredHeaders.sort();
  }

  getDisplayValue(value: any, key: string = ''): string {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';

    if (key.toLowerCase().includes('date') || key.toLowerCase().includes('time') || key === 'createdon') {
      if (typeof value === 'string' || value instanceof Date) {
        try {
          const date = new Date(value);
          return isNaN(date.getTime()) ? String(value) : date.toLocaleString();
        } catch (e) {
          return String(value);
        }
      }
    }

    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  titleCase(str: string): string {
    return str.replace(/\w\S*/g, (txt) =>
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  }

  goBack(): void {
    // Navigate back to the previous component (statusfollowedall)
    window.history.back();
  }

  trackItem(item: EmpFollowItem, index: number): void {
    console.log('Track clicked for employee item:', item, 'at index:', index);

    // Extract TrackNumber from the item data
    const trackNumber = item['tracknumber'] || item['TrackNumber'] || item['track_number'] || item['trackno'] || '';

    if (trackNumber) {
      console.log('Opening track popup with tracknumber:', trackNumber);
      this.selectedTrackNumber = trackNumber;

      // Emit the track number via the observable service
      this.trackNumberService.setTrackNumber(trackNumber);

      // Show popup using direct DOM manipulation
      this.showTrackPopupDOM();
    } else {
      console.error('TrackNumber not found in item data:', item);
      alert(`Cannot track: TrackNumber not found in the data.\nAvailable fields: ${Object.keys(item).join(', ')}`);
    }
  }

  showTrackPopupDOM(): void {
    const popupOverlay = document.getElementById('track-popup-overlay');
    if (popupOverlay) {
      popupOverlay.style.display = 'flex';

      // Add event listeners for closing the popup
      const closeBtn = document.getElementById('track-popup-close');
      const popupContent = document.getElementById('track-popup-content');

      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          this.closeTrackPopupDOM();
        });
      }

      // Close popup when clicking on overlay (outside content)
      popupOverlay.addEventListener('click', (event) => {
        if (event.target === popupOverlay) {
          this.closeTrackPopupDOM();
        }
      });

      // Prevent closing when clicking inside popup content
      if (popupContent) {
        popupContent.addEventListener('click', (event) => {
          event.stopPropagation();
        });
      }
    }
  }

  closeTrackPopupDOM(): void {
    const popupOverlay = document.getElementById('track-popup-overlay');
    if (popupOverlay) {
      popupOverlay.style.display = 'none';
    }
    this.showTrackPopup = false;
    this.selectedTrackNumber = null;
  }

  closeTrackPopup(): void {
    this.closeTrackPopupDOM();
  }

  viewItemDetails(item: EmpFollowItem, index: number): void {
    console.log('View details clicked for employee item:', item, 'at index:', index);
    // TODO: Implement further drilldown functionality if needed
    alert(`Employee Details for item ${index + 1}:\n${JSON.stringify(item, null, 2)}`);
  }

  updateDOMDirectly(): void {
    // Direct DOM manipulation to bypass Angular's change detection issues
    const loadingBox = document.getElementById('loading-box');
    const errorBox = document.getElementById('error-box');
    const contentContainer = document.getElementById('content-container');
    const reportHeading = document.getElementById('report-heading');
    const orgIdValue = document.getElementById('org-id-value');
    const empNameValue = document.getElementById('emp-name-value');
    const statusLabelValue = document.getElementById('status-label-value');
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

    // Update report heading
    if (reportHeading) {
      reportHeading.textContent = `Employee Wise Follow Report`;
    }

    // Update info values
    if (orgIdValue) {
      orgIdValue.textContent = this.orgId;
    }
    if (empNameValue) {
      empNameValue.textContent = this.empName;
    }
    if (statusLabelValue) {
      statusLabelValue.textContent = this.statusLabel;
    }
    if (totalRecordsValue) {
      totalRecordsValue.textContent = this.followItems.length.toString();
    }

    // Generate and display table or no data message
    if (this.followItems.length > 0) {
      if (tableContent) {
        const headers = this.getTableHeaders();

        let tableHTML = `
          <table class="data-table" style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
              <tr>
                ${headers.map(header => `<th class="table-header" style="padding: 12px; text-align: left; background: #007bff; color: white; border: 1px solid #0056b3;">${this.titleCase(header)}</th>`).join('')}
                <th class="table-header" style="padding: 12px; text-align: center; background: #007bff; color: white; border: 1px solid #0056b3;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${this.followItems.map((item, index) => `
                <tr class="table-row" style="border-bottom: 1px solid #dee2e6;">
                  ${headers.map(header => `<td class="table-cell" style="padding: 12px; border: 1px solid #dee2e6; vertical-align: middle;">${this.getDisplayValue(item[header], header)}</td>`).join('')}
                  <td class="table-cell" style="padding: 12px; border: 1px solid #dee2e6; text-align: center; vertical-align: middle;">
                    <button id="track-btn-${index}" class="track-btn" style="background: #17a2b8; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; margin-right: 5px;">Track</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
        tableContent.innerHTML = tableHTML;

        // Add event listeners for Track buttons
        this.followItems.forEach((item, index) => {
          const button = document.getElementById(`track-btn-${index}`);
          if (button) {
            button.addEventListener('click', () => {
              this.trackItem(item, index);
            });

            // Add hover effects
            button.addEventListener('mouseenter', () => {
              button.style.backgroundColor = '#138496';
            });
            button.addEventListener('mouseleave', () => {
              button.style.backgroundColor = '#17a2b8';
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

    console.log('DOM elements updated directly for employee follow data:', {
      loadingBox: !!loadingBox,
      errorBox: !!errorBox,
      contentContainer: !!contentContainer,
      itemsLength: this.followItems.length
    });
  }
}
