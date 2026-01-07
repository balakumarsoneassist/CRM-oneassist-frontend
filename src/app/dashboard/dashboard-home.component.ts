import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../environments/environment';

interface TodayAppointment {
  firstname: string;
  mobilenumber: string;
  tracknumber: string;
  appoinmentdate: string;
}

interface DashboardStats {
  todaytotal: string;
  monthtotal: string;
  status_label: string;
}

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-home-container">
      <div class="dashboard-header">
        <h1>📊 Dashboard Overview</h1>
        <p class="dashboard-subtitle">Welcome back! Here's what's happening today</p>
      </div>
      
      <!-- Today's Appointments Section -->
      <div class="section-card appointments-section">
        <div class="section-header">
          <div class="section-icon">📅</div>
          <div class="section-title">
            <h3>Today's Appointments</h3>
            <p>Your scheduled meetings for today</p>
          </div>
        </div>
        <div id="appointments-loading" class="loading-card">
          <div class="loading-spinner"></div>
          <p>Loading today's appointments...</p>
        </div>
        <div id="appointments-content" class="appointments-content" style="display: none;">
          <div id="appointments-list" class="appointments-list">
            <!-- Appointments will be populated here -->
          </div>
        </div>
      </div>

      <!-- Dashboard Statistics Section -->
      <div class="section-card stats-section">
        <div class="section-header">
          <div class="section-icon">📈</div>
          <div class="section-title">
            <h3>Performance Statistics</h3>
            <p>Today vs Monthly overview</p>
          </div>
        </div>
        <div id="stats-loading" class="loading-card">
          <div class="loading-spinner"></div>
          <p>Loading dashboard statistics...</p>
        </div>
        <div id="stats-content" class="stats-content" style="display: none;">
          <div id="stats-cards" class="stats-cards">
            <!-- Statistics will be populated here -->
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-home-container {
      padding: 20px;
      max-width: 1400px;
      margin: 0 auto;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      min-height: 100vh;
    }

    .dashboard-header {
      text-align: center;
      margin-bottom: 4px;
      padding: 5px 0;
    }

    .dashboard-header h1 {
      color: var(--primary-color, #007bff);
      font-size: 2.2rem;
      font-weight: 700;
      margin-bottom: 10px;
      text-shadow: 0 2px 4px rgba(0, 123, 255, 0.1);
    }

    .dashboard-subtitle {
      color: #6c757d;
      font-size: 1.2rem;
      font-weight: 400;
      margin: 0;
    }

    .section-card {
      background: white;
      border-radius: 20px;
      padding: 0;
      margin-bottom: 30px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(0, 0, 0, 0.05);
      overflow: hidden;
      transition: all 0.3s ease;
    }

    .section-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    }

    .section-header {
      background: linear-gradient(135deg, var(--primary-color, #007bff), #0056b3);
      color: white;
      padding: 25px 30px;
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .section-icon {
      font-size: 2.5rem;
      background: rgba(255, 255, 255, 0.2);
      padding: 15px;
      border-radius: 15px;
      backdrop-filter: blur(10px);
    }

    .section-title h3 {
      margin: 0 0 5px 0;
      font-size: 1.2rem;
      font-weight: 600;
    }

    .section-title p {
      margin: 0;
      opacity: 0.9;
      font-size: 1rem;
    }

    .appointments-section .section-header {
      background: linear-gradient(135deg, #28a745, #20c997);
    }

    .stats-section .section-header {
      background: linear-gradient(135deg, #007bff, #6f42c1);
    }

    .loading-card {
      padding: 40px;
      text-align: center;
      color: #6c757d;
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid var(--primary-color, #007bff);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 15px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .appointments-content, .stats-content {
      padding: 30px;
    }

    .appointments-list {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 15px;
      overflow-x: auto;
    }

    .appointment-card {
      background: linear-gradient(135deg, #f8f9fa, #ffffff);
      border: 1px solid #e0e0e0;
      border-radius: 12px;
      padding: 15px;
      transition: all 0.3s ease;
      position: relative;
      min-width: 200px;
      text-align: center;
    }

    .appointment-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
      border-color: var(--primary-color, #007bff);
    }

    .appointment-header {
      margin-bottom: 12px;
    }

    .appointment-name {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--primary-color, #007bff);
      margin-bottom: 8px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .appointment-track {
      background: var(--primary-color, #007bff);
      color: white;
      padding: 4px 10px;
      border-radius: 15px;
      font-size: 0.8rem;
      font-weight: 500;
      display: inline-block;
    }

    .appointment-details {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 12px;
    }

    .appointment-detail {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      color: #6c757d;
      font-size: 0.85rem;
    }

    .appointment-detail strong {
      color: #495057;
    }

    .more-appointments {
      text-align: center;
      margin-top: 20px;
      padding: 15px;
      background: linear-gradient(135deg, var(--primary-color, #007bff), #0056b3);
      color: white;
      border-radius: 8px;
      font-weight: 500;
    }

    .stats-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 25px;
    }

    .stat-card {
      background: white;
      border-radius: 20px;
      padding: 0;
      transition: all 0.4s ease;
      position: relative;
      overflow: hidden;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(0, 0, 0, 0.05);
    }

    .stat-card:hover {
      transform: translateY(-8px) scale(1.02);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    }

    .stat-card-header {
      background: linear-gradient(135deg, var(--card-color, #007bff), var(--card-color-dark, #0056b3));
      color: white;
      padding: 20px 25px;
      text-align: center;
      position: relative;
    }

    .stat-card-header::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
      animation: shimmer 3s ease-in-out infinite;
    }

    @keyframes shimmer {
      0%, 100% { transform: rotate(0deg); }
      50% { transform: rotate(180deg); }
    }

    .stat-label {
      font-size: 1.3rem;
      font-weight: 800;
      margin: 0;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      position: relative;
      z-index: 1;
      color: white;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .stat-card-body {
      padding: 25px 20px;
    }

    .stat-table {
      margin-bottom: 20px;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .data-table thead {
      background: linear-gradient(135deg, #f8f9fa, #e9ecef);
    }

    .data-table th {
      padding: 15px;
      text-align: center;
      font-weight: 700;
      color: #495057;
      font-size: 1rem;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      border-bottom: 2px solid #dee2e6;
    }

    .today-header {
      background: linear-gradient(135deg, rgba(40, 167, 69, 0.2), rgba(32, 201, 151, 0.2));
      color: #28a745 !important;
    }

    .month-header {
      background: linear-gradient(135deg, rgba(0, 123, 255, 0.2), rgba(111, 66, 193, 0.2));
      color: #007bff !important;
    }

    .data-table td {
      padding: 20px 15px;
      border-bottom: 1px solid #f1f3f4;
      vertical-align: middle;
      text-align: center;
    }

    .data-table tbody tr:hover {
      background: rgba(0, 123, 255, 0.05);
    }

    .count-row {
      background: linear-gradient(135deg, rgba(248, 249, 250, 0.8), rgba(233, 236, 239, 0.8));
    }

    .today-cell {
      background: linear-gradient(135deg, rgba(40, 167, 69, 0.1), rgba(32, 201, 151, 0.1));
      border-right: 1px solid #dee2e6;
    }

    .month-cell {
      background: linear-gradient(135deg, rgba(0, 123, 255, 0.1), rgba(111, 66, 193, 0.1));
    }

    .count-value {
      font-size: 1.8rem;
      font-weight: 700;
      color: var(--card-color, #007bff);
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .mini-progress {
      width: 60px;
      height: 8px;
      background: #f1f3f4;
      border-radius: 4px;
      overflow: hidden;
      position: relative;
    }

    .mini-progress-bar {
      height: 100%;
      border-radius: 4px;
      transition: width 0.8s ease;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    }

    .percentage-text {
      font-weight: 600;
      color: var(--card-color, #007bff);
      font-size: 1rem;
    }

    .stat-numbers {
      display: flex;
      justify-content: space-between;
      margin-bottom: 25px;
      gap: 20px;
    }

    .stat-number {
      flex: 1;
      text-align: center;
      position: relative;
    }

    .stat-number::after {
      content: '';
      position: absolute;
      right: -10px;
      top: 50%;
      transform: translateY(-50%);
      width: 1px;
      height: 60px;
      background: linear-gradient(to bottom, transparent, #e0e0e0, transparent);
    }

    .stat-number:last-child::after {
      display: none;
    }

    .stat-number .value {
      font-size: 2.8rem;
      font-weight: 800;
      color: var(--card-color, #007bff);
      display: block;
      margin-bottom: 8px;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      background: linear-gradient(135deg, var(--card-color, #007bff), var(--card-color-dark, #0056b3));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .stat-number .label {
      font-size: 1rem;
      color: #6c757d;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      position: relative;
    }

    .stat-number .label::before {
      content: '';
      position: absolute;
      bottom: -5px;
      left: 50%;
      transform: translateX(-50%);
      width: 30px;
      height: 2px;
      background: var(--card-color, #007bff);
      border-radius: 1px;
    }

    .stat-progress {
      height: 12px;
      background: #f1f3f4;
      border-radius: 10px;
      overflow: hidden;
      margin: 20px 0;
      position: relative;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .stat-progress-bar {
      height: 100%;
      background: linear-gradient(90deg, var(--card-color, #007bff), var(--card-color-dark, #0056b3));
      border-radius: 10px;
      transition: width 1.2s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .stat-progress-bar::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
      animation: progress-shine 2s ease-in-out infinite;
    }

    @keyframes progress-shine {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }

    .stat-percentage {
      text-align: center;
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--card-color, #007bff);
      margin-top: 15px;
    }

    .stat-trend {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      font-size: 0.9rem;
      color: #6c757d;
      margin-top: 10px;
    }

    @media (max-width: 768px) {
      .dashboard-home-container {
        padding: 15px;
      }
      
      .appointments-list {
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
      }
      
      .appointment-card {
        min-width: 150px;
        padding: 12px;
      }
      
      .stats-cards {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 480px) {
      .appointments-list {
        grid-template-columns: 1fr;
      }
      
      .appointment-card {
        min-width: auto;
      }
    }

    @media (min-width: 1200px) {
      .appointments-list {
        grid-template-columns: repeat(5, 1fr);
      }
    }
  `]
})
export class DashboardHomeComponent implements OnInit {
  //private baseUrl = 'http://localhost:3000';
  private baseUrl = environment.apiUrl;
  
  appointments: TodayAppointment[] = [];
  dashboardStats: DashboardStats[] = [];
  loading = true;
  empId: string = '';
  isAdminUser = false;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    this.empId = localStorage.getItem('usernameID') || '';
    this.isAdminUser = localStorage.getItem('isadminrights') === 'true';
    
    this.loadDashboardData();
  }

  private loadDashboardData() {
    // Load appointments and stats in parallel
    Promise.all([
      this.loadTodayAppointments(),
      this.loadDashboardStats()
    ]).then(() => {
      this.loading = false;
      this.updateDashboardDisplay();
    }).catch(error => {
      console.error('Error loading dashboard data:', error);
      this.loading = false;
      this.showErrorState();
    });
  }

  private loadTodayAppointments(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.empId) {
        console.error('Employee ID not found in localStorage');
        resolve();
        return;
      }

      this.http.get<any>(`${this.baseUrl}/gettodayappoinment/${this.empId}`).subscribe({
        next: (response) => {
          console.log('Appointments API response:', response);
          
          // Handle different response formats
          if (response && Array.isArray(response)) {
            this.appointments = response;
          } else if (response && response.data && Array.isArray(response.data)) {
            this.appointments = response.data;
          } else if (response && response.result && Array.isArray(response.result)) {
            this.appointments = response.result;
          } else {
            this.appointments = [];
          }
          
          resolve();
        },
        error: (error) => {
          console.error('Error loading appointments:', error);
          this.appointments = [];
          resolve(); // Don't reject, continue with empty data
        }
      });
    });
  }

  private loadDashboardStats(): Promise<void> {
    return new Promise((resolve, reject) => {
      const apiUrl = this.isAdminUser 
        ? `${this.baseUrl}/getdashboardadmin`
        : `${this.baseUrl}/getdashboarduser/${this.empId}`;

      this.http.get<any>(apiUrl).subscribe({
        next: (response) => {
          console.log('Dashboard stats API response:', response);
          
          // Handle different response formats
          if (response && Array.isArray(response)) {
            this.dashboardStats = response;
          } else if (response && response.data && Array.isArray(response.data)) {
            this.dashboardStats = response.data;
          } else if (response && response.result && Array.isArray(response.result)) {
            this.dashboardStats = response.result;
          } else {
            this.dashboardStats = [];
          }
          
          resolve();
        },
        error: (error) => {
          console.error('Error loading dashboard stats:', error);
          this.dashboardStats = [];
          resolve(); // Don't reject, continue with empty data
        }
      });
    });
  }

  private updateDashboardDisplay() {
    // Use multiple change detection attempts followed by direct DOM manipulation
    setTimeout(() => {
      this.cdr.detectChanges();
      
      setTimeout(() => {
        this.ngZone.run(() => {
          this.cdr.detectChanges();
          
          setTimeout(() => {
            this.updateAppointmentsDOM();
            this.updateStatsDOM();
          }, 50);
        });
      }, 20);
    }, 10);
  }

  private updateAppointmentsDOM() {
    const loadingElement = document.getElementById('appointments-loading');
    const contentElement = document.getElementById('appointments-content');
    const listElement = document.getElementById('appointments-list');

    if (loadingElement) {
      loadingElement.style.display = 'none';
    }

    if (contentElement) {
      contentElement.style.display = 'block';
    }

    if (listElement) {
      if (this.appointments.length === 0) {
        listElement.innerHTML = `
          <div class="appointment-card" style="text-align: center; color: #6c757d;">
            <p>No appointments scheduled for today</p>
          </div>
        `;
        return;
      }

      // Display up to 5 appointments
      const displayAppointments = this.appointments.slice(0, 5);
      let appointmentsHTML = '';

      displayAppointments.forEach(appointment => {
        appointmentsHTML += `
          <div style="
            background: #f8f9fa;
            border-left: 4px solid #007bff;
            border-radius: 8px;
            padding: 20px;
            transition: all 0.3s ease;
            position: relative;
            min-width: 200px;
            text-align: center;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            border: 1px solid #e0e0e0;
          ">
            <div style="margin-bottom: 12px;">
              <div style="
                font-size: 1.1rem;
                font-weight: 700;
                color: #007bff;
                margin-bottom: 8px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                background: linear-gradient(135deg, #e3f2fd, #bbdefb);
                padding: 8px 12px;
                border-radius: 6px;
                border: 1px solid #2196f3;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
              " title="${appointment.firstname || 'N/A'}">${appointment.firstname || 'N/A'}</div>
              <div style="
                background: #007bff;
                color: white;
                padding: 4px 10px;
                border-radius: 15px;
                font-size: 0.8rem;
                font-weight: 500;
                display: inline-block;
              ">Track: ${appointment.tracknumber || 'N/A'}</div>
            </div>
            <div style="
              display: flex;
              flex-direction: column;
              gap: 8px;
              margin-top: 12px;
            ">
              <div style="
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                color: #6c757d;
                font-size: 0.85rem;
              ">
                <span>📱</span>
                <span><strong>Mobile:</strong></span>
              </div>
              <div style="font-size: 0.8rem; color: #6c757d; margin-bottom: 8px;">${appointment.mobilenumber || 'N/A'}</div>
              <div style="
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                color: #6c757d;
                font-size: 0.85rem;
              ">
                <span>🕒</span>
                <span><strong>Date:</strong></span>
              </div>
              <div style="font-size: 0.8rem; color: #6c757d; text-align: center;">${this.formatDate(appointment.appoinmentdate)}</div>
            </div>
          </div>
        `;
      });

      // Add "more appointments" indicator if there are more than 5
      if (this.appointments.length > 5) {
        appointmentsHTML += `
          <div class="more-appointments">
            <strong>+ ${this.appointments.length - 5} more appointments</strong>
            <div style="margin-top: 5px; font-size: 0.9rem; opacity: 0.9;">
              Total appointments today: ${this.appointments.length}
            </div>
          </div>
        `;
      }

      listElement.innerHTML = appointmentsHTML;
    }
  }

  private updateStatsDOM() {
    const loadingElement = document.getElementById('stats-loading');
    const contentElement = document.getElementById('stats-content');
    const cardsElement = document.getElementById('stats-cards');

    if (loadingElement) {
      loadingElement.style.display = 'none';
    }

    if (contentElement) {
      contentElement.style.display = 'block';
    }

    if (cardsElement) {
      if (this.dashboardStats.length === 0) {
        cardsElement.innerHTML = `
          <div class="stat-card" style="text-align: center; color: #6c757d;">
            <p>No dashboard statistics available</p>
          </div>
        `;
        return;
      }

      let statsHTML = '';
      const statusColors = {
        'Total Calls': { primary: '#007bff', secondary: '#0056b3', bg: 'linear-gradient(135deg, #007bff, #0056b3)' },
        'Total Assigned': { primary: '#28a745', secondary: '#1e7e34', bg: 'linear-gradient(135deg, #28a745, #1e7e34)' },
        'Lead': { primary: '#17a2b8', secondary: '#117a8b', bg: 'linear-gradient(135deg, #17a2b8, #117a8b)' },
        'No response': { primary: '#ffc107', secondary: '#e0a800', bg: 'linear-gradient(135deg, #ffc107, #e0a800)' },
        'Reject Calls': { primary: '#dc3545', secondary: '#c82333', bg: 'linear-gradient(135deg, #dc3545, #c82333)' }
      };

      this.dashboardStats.forEach(stat => {
        if (stat.status_label && stat.status_label !== 'NULL') {
          const colorConfig = statusColors[stat.status_label as keyof typeof statusColors] || 
            { primary: '#6c757d', secondary: '#545b62', bg: 'linear-gradient(135deg, #6c757d, #545b62)' };
          
          const todayNum = parseInt(stat.todaytotal) || 0;
          const monthNum = parseInt(stat.monthtotal) || 0;
          const percentage = monthNum > 0 ? Math.round((todayNum / monthNum) * 100) : 0;
          
          // Determine trend
          const trendIcon = todayNum > (monthNum / 30) ? '📈' : todayNum < (monthNum / 30) ? '📉' : '➡️';
          const trendText = todayNum > (monthNum / 30) ? 'Above Average' : todayNum < (monthNum / 30) ? 'Below Average' : 'On Track';

          statsHTML += `
            <div style="
              background: white;
              border-radius: 20px;
              padding: 0;
              transition: all 0.4s ease;
              position: relative;
              overflow: hidden;
              box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
              border: 1px solid rgba(0, 0, 0, 0.05);
              margin-bottom: 25px;
            ">
              <div style="
                background: ${colorConfig.bg};
                color: white;
                padding: 20px 25px;
                text-align: center;
                position: relative;
              ">
                <div style="
                  font-size: 1.3rem;
                  font-weight: 800;
                  margin: 0;
                  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                  position: relative;
                  z-index: 1;
                  color: white;
                  text-transform: uppercase;
                  letter-spacing: 1px;
                ">${stat.status_label}</div>
              </div>
              <div style="padding: 25px 20px;">
                <div style="margin-bottom: 20px;">
                  <table style="
                    width: 100%;
                    border-collapse: collapse;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                  ">
                    <thead style="background: linear-gradient(135deg, #f8f9fa, #e9ecef);">
                      <tr>
                        <th style="
                          padding: 15px;
                          text-align: center;
                          font-weight: 700;
                          color: #28a745;
                          font-size: 1rem;
                          text-transform: uppercase;
                          letter-spacing: 0.8px;
                          border-bottom: 2px solid #dee2e6;
                          background: linear-gradient(135deg, rgba(40, 167, 69, 0.2), rgba(32, 201, 151, 0.2));
                        ">Today</th>
                        <th style="
                          padding: 15px;
                          text-align: center;
                          font-weight: 700;
                          color: #007bff;
                          font-size: 1rem;
                          text-transform: uppercase;
                          letter-spacing: 0.8px;
                          border-bottom: 2px solid #dee2e6;
                          background: linear-gradient(135deg, rgba(0, 123, 255, 0.2), rgba(111, 66, 193, 0.2));
                        ">Month</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style="background: linear-gradient(135deg, rgba(248, 249, 250, 0.8), rgba(233, 236, 239, 0.8));">
                        <td style="
                          padding: 20px 15px;
                          border-bottom: 1px solid #f1f3f4;
                          vertical-align: middle;
                          text-align: center;
                          background: linear-gradient(135deg, rgba(40, 167, 69, 0.1), rgba(32, 201, 151, 0.1));
                          border-right: 1px solid #dee2e6;
                        ">
                          <span style="
                            font-size: 1.8rem;
                            font-weight: 700;
                            color: ${colorConfig.primary};
                            text-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                          ">${todayNum}</span>
                          <div style="
                            width: 60px;
                            height: 8px;
                            background: #f1f3f4;
                            border-radius: 4px;
                            overflow: hidden;
                            position: relative;
                            margin: 10px auto;
                          ">
                            <div style="
                              height: 100%;
                              border-radius: 4px;
                              transition: width 0.8s ease;
                              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
                              width: ${percentage}%;
                              background: ${colorConfig.primary};
                            "></div>
                          </div>
                        </td>
                        <td style="
                          padding: 20px 15px;
                          border-bottom: 1px solid #f1f3f4;
                          vertical-align: middle;
                          text-align: center;
                          background: linear-gradient(135deg, rgba(0, 123, 255, 0.1), rgba(111, 66, 193, 0.1));
                        ">
                          <span style="
                            font-size: 1.8rem;
                            font-weight: 700;
                            color: ${colorConfig.primary};
                            text-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                          ">${monthNum}</span>
                          <div style="
                            font-weight: 600;
                            color: ${colorConfig.primary};
                            font-size: 1rem;
                            margin-top: 5px;
                          ">${percentage}% target</div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div style="
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  gap: 5px;
                  font-size: 0.9rem;
                  color: #6c757d;
                  margin-top: 10px;
                ">
                  <span>${trendIcon}</span>
                  <span>${trendText}</span>
                </div>
              </div>
            </div>
          `;
        }
      });

      cardsElement.innerHTML = statsHTML;
    }
  }

  private formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  }

  private getDarkerColor(color: string): string {
    // Convert hex color to darker shade
    const colorMap: { [key: string]: string } = {
      '#007bff': '#0056b3',
      '#28a745': '#1e7e34',
      '#17a2b8': '#117a8b',
      '#ffc107': '#e0a800',
      '#dc3545': '#c82333',
      '#6c757d': '#545b62'
    };
    
    return colorMap[color] || color;
  }

  private showErrorState() {
    const appointmentsLoading = document.getElementById('appointments-loading');
    const statsLoading = document.getElementById('stats-loading');

    if (appointmentsLoading) {
      appointmentsLoading.innerHTML = 'Error loading appointments';
      appointmentsLoading.style.background = '#f8d7da';
      appointmentsLoading.style.color = '#721c24';
    }

    if (statsLoading) {
      statsLoading.innerHTML = 'Error loading dashboard statistics';
      statsLoading.style.background = '#f8d7da';
      statsLoading.style.color = '#721c24';
    }
  }
}
