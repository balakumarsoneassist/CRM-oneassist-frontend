import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
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
  selector: 'app-status-report-summary',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="status-report-container">
      <h2>Status Report Summary</h2>
      
      <div *ngIf="loading" class="loading">
        Loading status data...
      </div>
      
      <div *ngIf="error" class="error">
        {{ error }}
        <button (click)="loadData()" class="retry-btn">Retry</button>
      </div>
      
      <div *ngIf="!loading && !error && statusItems.length > 0" class="content">
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
        <div *ngIf="selectedItem" class="drilldown-section">
          <h3>Details for {{ selectedItem.status | titlecase }} {{ selectedItem.type | titlecase }}</h3>
          <div class="detail-card">
            <div class="detail-row">
              <span class="label">Status Code:</span>
              <span class="value">{{ selectedItem.statuscode }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Status:</span>
              <span class="value">{{ selectedItem.status | titlecase }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Type:</span>
              <span class="value">{{ selectedItem.type | titlecase }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Total Count:</span>
              <span class="value">{{ selectedItem.count }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Percentage:</span>
              <span class="value">{{ selectedItem.percentage }}%</span>
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
export class StatusReportSummaryComponent implements OnInit {
  statusItems: StatusItem[] = [];
  loading = true;
  error: string | null = null;
  selectedItem: StatusItem | null = null;
  orgId = localStorage.getItem('organizationid') || '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
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
          }, 0);
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
    console.log('Navigating to details for status code:', item.statuscode);
    // Use window.location for navigation to avoid Router dependency issues
    window.location.href = `/dashboard/statusfollowedall/${item.statuscode}`;
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
}
