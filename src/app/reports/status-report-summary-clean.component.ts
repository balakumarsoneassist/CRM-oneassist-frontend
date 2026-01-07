import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

interface StatusItem {
  total: string;
  statuscode: number;
  status: string;
  type: string;
  count?: number;
  percentage?: number;
}

interface StatusResponse {
  success: boolean;
  data: StatusItem[];
  orgid: number;
}

@Component({
  selector: 'app-status-report-summary-clean',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="status-report-container">
      <h2>Status Report Summary</h2>
      
      <div id="loading-box" style="padding: 20px; text-align: center; color: #666; display: block;">
        <div style="display: inline-block; width: 20px; height: 20px; border: 3px solid #f3f3f3; border-top: 3px solid #007bff; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 10px;"></div>
        Loading status data...
      </div>
      
      <div id="status-items-container" style="padding: 20px; margin: 10px 0; display: none;">
        <div id="status-items-list">Items will be populated here...</div>
      </div>
      
      <div *ngIf="showContent" class="content">
        <!-- Summary Stats -->
        <div class="summary-stats">
          <div class="stat-card">
            <h3>Total Records</h3>
            <div class="stat-value">{{ getTotalCount() }}</div>
          </div>
          <div class="stat-card">
            <h3>Categories</h3>
            <div class="stat-value">{{ statusItems.length }}</div>
          </div>
        </div>
        
        <!-- Status Cards Grid -->
        <div class="status-grid">
          <div *ngFor="let item of statusItems" 
               class="status-card" 
               [class.selected]="selectedItem === item"
               (click)="selectStatus(item)">
            <div class="card-header">
              <h4>{{ item.status | titlecase }} {{ item.type | titlecase }}</h4>
              <span class="count">{{ item.count }}</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" 
                   [style.width.%]="item.percentage"
                   [style.background-color]="getStatusColor(item)">
              </div>
            </div>
            <div class="card-footer">
              <div class="percentage">{{ item.percentage }}%</div>
              <button (click)="viewDetails(item)" class="details-btn">View Details</button>
            </div>
          </div>
        </div>
        
        <!-- Drilldown Details -->
        <div [style.display]="selectedItem ? 'block' : 'none'" class="drilldown-section">
          <h3>Details for {{ selectedItem?.status | titlecase }} {{ selectedItem?.type | titlecase }}</h3>
          <div class="detail-card">
            <div class="detail-row">
              <span class="label">Status Code:</span>
              <span class="value">{{ selectedItem?.statuscode }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Status:</span>
              <span class="value">{{ selectedItem?.status | titlecase }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Type:</span>
              <span class="value">{{ selectedItem?.type | titlecase }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Total Count:</span>
              <span class="value">{{ selectedItem?.count }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Percentage:</span>
              <span class="value">{{ selectedItem?.percentage }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .status-report-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    h2 {
      color: #333;
      margin-bottom: 20px;
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
    
    .summary-stats {
      display: flex;
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .stat-card {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      flex: 1;
    }
    
    .stat-card h3 {
      margin: 0 0 10px 0;
      color: #666;
      font-size: 14px;
      font-weight: normal;
    }
    
    .stat-value {
      font-size: 32px;
      font-weight: bold;
      color: #007bff;
    }
    
    .status-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .status-card {
      background: white;
      border: 2px solid #e9ecef;
      border-radius: 8px;
      padding: 20px;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .status-card:hover {
      border-color: #007bff;
      box-shadow: 0 4px 8px rgba(0,123,255,0.1);
    }
    
    .status-card.selected {
      border-color: #007bff;
      background: #f8f9ff;
    }
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }
    
    .card-header h4 {
      margin: 0;
      color: #333;
      font-size: 16px;
    }
    
    .count {
      background: #007bff;
      color: white;
      padding: 4px 8px;
      border-radius: 12px;
      font-weight: bold;
      font-size: 14px;
    }
    
    .progress-bar {
      background: #e9ecef;
      height: 8px;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 10px;
    }
    
    .progress-fill {
      height: 100%;
      transition: width 0.3s ease;
    }
    
    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 10px;
    }
    
    .percentage {
      font-weight: bold;
      color: #666;
    }
    
    .details-btn {
      padding: 6px 12px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      transition: background 0.3s ease;
    }
    
    .details-btn:hover {
      background: #0056b3;
    }
    
    .drilldown-section {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
    }
    
    .drilldown-section h3 {
      margin: 0 0 20px 0;
      color: #333;
    }
    
    .detail-card {
      background: white;
      border-radius: 6px;
      padding: 20px;
    }
    
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e9ecef;
    }
    
    .detail-row:last-child {
      border-bottom: none;
    }
    
    .label {
      font-weight: bold;
      color: #666;
    }
    
    .value {
      color: #333;
    }
    
    @media (max-width: 768px) {
      .status-report-container {
        padding: 10px;
      }
      
      .summary-stats {
        flex-direction: column;
      }
      
      .status-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class StatusReportSummaryCleanComponent implements OnInit {
  statusItems: StatusItem[] = [];
  loading = true;
  error: string | null = null;
  selectedItem: StatusItem | null = null;
  orgId = localStorage.getItem('organizationid') || '';
  showContent = false;
  lastUpdate = Date.now();
  private router = inject(Router);

  get shouldShowContent(): boolean {
    const result = !this.loading && !this.error && this.statusItems.length > 0;
    console.log(`[${new Date().toLocaleTimeString()}] shouldShowContent getter called:`, result, 'loading:', this.loading, 'error:', this.error, 'items:', this.statusItems.length);
    return result;
  }

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    console.log('Component initialized - resetting state');
    // Reset all state variables when component initializes
    this.statusItems = [];
    this.loading = true;
    this.error = null;
    this.selectedItem = null;
    this.showContent = false;
    
    this.loadData();
  }

  loadData(): void {
    if (!this.orgId) {
      this.error = 'No organization ID found. Please log in again.';
      return;
    }

    this.loading = true;
    this.error = null;
    this.selectedItem = null;

    console.log('Loading status report summary for org:', this.orgId);

    this.http.get<StatusResponse>(`${environment.apiUrl}/getoverallstatus/${this.orgId}`).subscribe({
      next: (response) => {
        console.log('Status report summary response:', response);
        
        if (response && response.success && Array.isArray(response.data)) {
          this.statusItems = response.data.map(item => ({
            ...item,
            count: parseInt(item.total, 10) || 0,
            percentage: 0 // Will be calculated
          }));
          
          this.calculatePercentages();
          
          // Use setTimeout to ensure change detection fires (proven solution)
          setTimeout(() => {
            this.loading = false;
            console.log('Status report summary loaded:', this.statusItems.length, 'items');
            console.log('Debug - loading:', this.loading, 'error:', this.error, 'statusItems.length:', this.statusItems.length);
            console.log('Debug - should show content:', !this.loading && !this.error && this.statusItems.length > 0);
            // Force template re-evaluation by triggering a property change
            this.statusItems = [...this.statusItems]; // Create new array reference
            console.log('Forced array reference update');
            
            // Set the simple flag to show content
            this.showContent = true;
            console.log('showContent flag set to true - content should now display');
            
            // Force immediate DOM update by toggling the flag multiple times
            setTimeout(() => {
              this.showContent = false;
              console.log('showContent set to false');
              setTimeout(() => {
                this.showContent = true;
                console.log('showContent flag toggled - forcing DOM update');
                
                // Direct DOM manipulation to bypass Angular's change detection issues
                setTimeout(() => {
                  this.updateDOMDirectly();
                  console.log('Direct DOM manipulation executed');
                }, 20);
              }, 10);
            }, 10);
            
            // Also try window resize as backup
            setTimeout(() => {
              window.dispatchEvent(new Event('resize'));
              console.log('Window resize event dispatched to force re-render');
            }, 100);
          }, 100);
        } else {
          this.error = 'Invalid response format';
          setTimeout(() => {
            this.loading = false;
          }, 0);
        }
      },
      error: (err) => {
        console.error('Failed to load status report summary:', err);
        this.error = `Failed to load data: ${err.status} ${err.statusText}`;
        setTimeout(() => {
          this.loading = false;
        }, 0);
      }
    });
  }

  private calculatePercentages(): void {
    const total = this.getTotalCount();
    if (total > 0) {
      this.statusItems.forEach(item => {
        item.percentage = Math.round((item.count! / total) * 100);
      });
    }
  }

  getTotalCount(): number {
    return this.statusItems.reduce((sum, item) => sum + (item.count || 0), 0);
  }

  selectStatus(item: StatusItem): void {
    this.selectedItem = this.selectedItem === item ? null : item;
    console.log('Selected status item:', this.selectedItem);
  }

  viewDetails(item: StatusItem): void {
    const statusLabel = `${item.status} ${item.type}`;
    console.log('Navigating to report page with statuscode:', item.statuscode, 'label:', statusLabel);
    // Use Angular Router for proper client-side navigation - pass both statuscode and label
    this.router.navigate(['/dashboard/statusfollowedall', item.statuscode], {
      queryParams: { label: statusLabel }
    });
  }

  getStatusColor(item: StatusItem): string {
    // Color coding based on status and type
    if (item.type === 'contact') {
      switch (item.status) {
        case 'unassigned': return '#6c757d'; // Gray
        case 'assigned': return '#28a745';   // Green
        case 'follow': return '#ffc107';     // Yellow
        default: return '#007bff';           // Blue
      }
    } else if (item.type === 'lead') {
      switch (item.status) {
        case 'assigned': return '#28a745';      // Green
        case 'disbursement': return '#17a2b8'; // Teal
        default: return '#6f42c1';              // Purple
      }
    }
    return '#007bff'; // Default blue
  }

  updateDOMDirectly(): void {
    // Direct DOM manipulation to bypass Angular's change detection issues
    const loadingBox = document.getElementById('loading-box');
    const statusContainer = document.getElementById('status-items-container');
    const statusList = document.getElementById('status-items-list');
    
    if (loadingBox) {
      loadingBox.style.display = 'none';
    }
    
    // Display the actual status items
    if (statusContainer && statusList) {
      statusContainer.style.display = 'block';
      
      let itemsHTML = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">';
      
      this.statusItems.forEach((item, index) => {
        const color = this.getStatusColor(item);
        itemsHTML += `
          <div style="background: white; border: 2px solid ${color}; border-radius: 8px; padding: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h4 style="margin: 0 0 10px 0; color: ${color}; text-transform: capitalize;">
              ${item.status} ${item.type}
            </h4>
            <div style="margin: 5px 0;"><strong>Count:</strong> ${item.count}</div>
            <div style="margin: 5px 0;"><strong>Percentage:</strong> ${item.percentage}%</div>
            <div style="margin: 5px 0;"><strong>Status Code:</strong> ${item.statuscode}</div>
            <div style="background: ${color}; height: 8px; border-radius: 4px; margin: 10px 0;"></div>
            <button id="btn-${index}" style="background: ${color}; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
              View Details
            </button>
          </div>
        `;
      });
      
      itemsHTML += '</div>';
      
      // Add summary stats
      const totalCount = this.getTotalCount();
      const summaryHTML = `
        <div style="display: flex; gap: 20px; margin-bottom: 20px; flex-wrap: wrap;">
          <div style="background: #007bff; color: white; padding: 15px; border-radius: 8px; text-align: center; min-width: 150px;">
            <h3 style="margin: 0; font-size: 24px;">${totalCount}</h3>
            <div>Total Records</div>
          </div>
          <div style="background: #28a745; color: white; padding: 15px; border-radius: 8px; text-align: center; min-width: 150px;">
            <h3 style="margin: 0; font-size: 24px;">${this.statusItems.length}</h3>
            <div>Categories</div>
          </div>
        </div>
      `;
      
      statusList.innerHTML = summaryHTML + itemsHTML;
      
      // Add event listeners for the View Details buttons
      const router = this.router; // Capture router reference in closure
      this.statusItems.forEach((item, index) => {
        const button = document.getElementById(`btn-${index}`);
        if (button) {
          button.addEventListener('click', () => {
            const statusLabel = `${item.status} ${item.type}`;
            console.log('Button clicked, navigating to report page with statuscode:', item.statuscode, 'label:', statusLabel);
            // Use Angular Router for proper client-side navigation - pass both statuscode and label
            router.navigate(['/dashboard/statusfollowedall', item.statuscode], {
              queryParams: { label: statusLabel }
            });
          });
        }
      });
    }
    
    console.log('DOM elements updated directly:', {
      loadingBox: !!loadingBox,
      statusContainer: !!statusContainer,
      statusList: !!statusList,
      showContent: this.showContent,
      itemsLength: this.statusItems.length
    });
  }
}
