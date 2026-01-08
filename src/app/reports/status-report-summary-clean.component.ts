import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

export interface StatusItem {
  total: string;
  statuscode: number;
  status: string;
  type: string;
  count?: number;
  percentage?: number;
}

export interface StatusResponse {
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
      
      <!-- Loading State -->
      <div *ngIf="loading" class="loading-container">
        <div class="spinner"></div>
        <div>Loading status data...</div>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="error-container">
        <div class="error-msg">⚠️ {{ error }}</div>
        <button (click)="loadData()" class="retry-btn">Retry</button>
      </div>
      
      <!-- Empty State -->
      <div *ngIf="!loading && !error && statusItems.length === 0" class="empty-container">
        <div class="empty-icon">📊</div>
        <p>No status data available.</p>
      </div>

      <!-- Content -->
      <div *ngIf="!loading && !error && statusItems.length > 0" class="content">
        <!-- Summary Stats -->
        <div class="summary-stats">
          <div class="stat-card blue-card">
            <h3>Total Records</h3>
            <div class="stat-value">{{ getTotalCount() }}</div>
          </div>
          <div class="stat-card green-card">
            <h3>Categories</h3>
            <div class="stat-value">{{ statusItems.length }}</div>
          </div>
        </div>
        
        <!-- Status Cards Grid -->
        <div class="status-grid">
          <div *ngFor="let item of statusItems" 
               class="status-card" 
               [style.border-color]="getStatusColor(item)">
            
            <div class="card-header">
              <h4 [style.color]="getStatusColor(item)">
                {{ item.status | titlecase }} {{ item.type | titlecase }}
              </h4>
              <span class="badge" [style.background-color]="getStatusColor(item)">{{ item.count }}</span>
            </div>

            <div class="progress-bar">
              <div class="progress-fill" 
                   [style.width.%]="item.percentage"
                   [style.background-color]="getStatusColor(item)">
              </div>
            </div>

            <div class="card-footer">
              <span class="percentage">{{ item.percentage }}%</span>
              <button (click)="viewDetails(item)" 
                      class="view-btn"
                      [style.background-color]="getStatusColor(item)">
                View Details
              </button>
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
      font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    
    h2 {
      color: #2c3e50;
      margin-bottom: 25px;
      font-weight: 700;
    }

    /* Loading */
    .loading-container {
      text-align: center;
      padding: 60px;
      color: #666;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #007bff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 15px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Error */
    .error-container {
      text-align: center;
      padding: 30px;
      background: #fff5f5;
      border: 1px solid #ffc9c9;
      border-radius: 8px;
      color: #c92a2a;
      margin-top: 20px;
    }
    .retry-btn {
      padding: 8px 20px;
      background: #c92a2a;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
      margin-top: 10px;
    }

    /* Stats Cards */
    .summary-stats {
      display: flex;
      gap: 20px;
      margin-bottom: 30px;
    }
    .stat-card {
      flex: 1;
      padding: 25px;
      border-radius: 12px;
      text-align: center;
      color: white;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }
    .blue-card { background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); }
    .green-card { background: linear-gradient(135deg, #28a745 0%, #218838 100%); }
    
    .stat-card h3 { 
      margin: 0 0 5px 0; 
      font-size: 1rem; 
      opacity: 0.9;
      font-weight: normal; 
    }
    .stat-value { 
      font-size: 3rem; 
      font-weight: 700; 
    }

    /* Status Grid */
    .status-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 25px;
    }
    .status-card {
      background: white;
      border: 2px solid #e9ecef;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.05);
      transition: transform 0.2s, box-shadow 0.2s;
      display: flex;
      flex-direction: column;
    }
    .status-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 20px rgba(0,0,0,0.1);
    }
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .card-header h4 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 600;
    }
    .badge {
      color: white;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 0.85rem;
    }

    .progress-bar {
      height: 8px;
      background: #e9ecef;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 25px;
    }
    .progress-fill { height: 100%; border-radius: 4px; }

    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: auto;
    }
    .percentage { font-weight: 600; font-size: 1.1rem; color: #495057; }

    .view-btn {
      padding: 8px 16px;
      color: white;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      font-size: 0.85rem;
      transition: opacity 0.2s;
    }
    .view-btn:hover { opacity: 0.9; }

    /* Mobile Responsive */
    @media (max-width: 768px) {
      .summary-stats { flex-direction: column; }
      .status-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class StatusReportSummaryCleanComponent implements OnInit {
  statusItems: StatusItem[] = [];
  loading = true;
  error: string | null = null;
  orgId = localStorage.getItem('organizationid') || '';

  private router = inject(Router);

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    if (!this.orgId) {
      this.error = 'No organization ID found. Please log in again.';
      this.loading = false;
      return;
    }

    this.loading = true;
    this.error = null;

    const empid = localStorage.getItem('isadminrights') === 'true' ? null : localStorage.getItem('usernameID');
    const timestamp = new Date().getTime();
    const url = empid
      ? `${environment.apiUrl}/getoverallstatus/${this.orgId}?empid=${empid}&_t=${timestamp}`
      : `${environment.apiUrl}/getoverallstatus/${this.orgId}?_t=${timestamp}`;

    this.http.get<StatusResponse>(url).subscribe({
      next: (response) => {
        if (response && response.success && Array.isArray(response.data)) {
          this.statusItems = response.data.map(item => ({
            ...item,
            count: parseInt(item.total, 10) || 0,
            percentage: 0
          }));
          this.calculatePercentages();
        } else {
          this.statusItems = [];
        }

        // Use setTimeout to ensure UI updates on the next tick (fixes "click to see data" issue)
        setTimeout(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }, 100);
      },
      error: (err) => {
        console.error('Failed to load status report summary:', err);
        if (err.status === 404) {
          this.statusItems = [];
        } else {
          this.error = `Failed to load data. Server returned ${err.status} ${err.statusText}`;
        }
        setTimeout(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }, 100);
      }
    });
  }

  calculatePercentages(): void {
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

  viewDetails(item: StatusItem): void {
    const statusLabel = `${item.status} ${item.type}`;
    this.router.navigate(['/dashboard/statusfollowedall', item.statuscode], {
      queryParams: { label: statusLabel }
    });
  }

  getStatusColor(item: StatusItem): string {
    const status = (item.status || '').toLowerCase();

    // Grey (Unassigned)
    if (status.includes('unassigned')) return '#6c757d';

    // Green (Assigned, Approved)
    if (status.includes('assigned')) return '#28a745';
    if (status.includes('approved')) return '#28a745';

    // Yellow (Follow)
    if (status.includes('follow')) return '#ffc107';

    // Teal (Disbursement)
    if (status.includes('disbursement')) return '#17a2b8';

    // Purple (Document, File, DC Reject)
    if (status.includes('document')) return '#6f42c1';
    if (status.includes('file')) return '#6f42c1';
    if (status.includes('reject') && status.includes('dc')) return '#6f42c1';

    // Blue (Reject Contact, No Response, Default)
    // Note: Image shows "Reject Contact" as Blue

    return '#007bff';
  }
}
