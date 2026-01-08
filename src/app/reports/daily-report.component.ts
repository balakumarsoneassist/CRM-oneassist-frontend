import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

interface Employee {
  id: number;
  name: string;
  emailid: string;
  isactive: boolean;
}

interface ReportData {
  id: number;
  name: string;
  mobilenumber: string;
  emailid: string;
  appoinmentdate: string | null;
  notes: string;
  location: string;
  referencename: string;
  tracknumber: string;
  assigneename: string;
  status: string;
}

@Component({
  selector: 'app-daily-report',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './daily-report.component.html',
  styleUrls: ['./daily-report.component.css']
})
export class DailyReportComponent implements OnInit {
  reportForm!: FormGroup;
  employees: Employee[] = [];
  reportData: ReportData[] = [];
  isLoading = false;
  hasReportData = false;
  isAdmin = false;
  currentUserId: string | null = null;
  currentUserName: string | null = null;

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) { }

  ngOnInit(): void {
    this.checkAdminStatus();
    this.initForm();
    this.loadEmployees();
  }

  private checkAdminStatus(): void {
    this.isAdmin = localStorage.getItem('isadminrights') === 'true';
    this.currentUserId = localStorage.getItem('usernameID');
    this.currentUserName = localStorage.getItem('username');
  }

  private initForm(): void {
    this.reportForm = this.fb.group({
      assignee: [{ value: this.isAdmin ? '' : this.currentUserId, disabled: !this.isAdmin }, Validators.required],
      startdate: ['', Validators.required],
      enddate: ['', Validators.required]
    });
  }

  private loadEmployees(): void {
    // Try multiple API endpoints for employees
    const endpoints = [
      `${environment.apiUrl}/employeesassignee`,
      `${environment.apiUrl}/employees`,
      `${environment.apiUrl}/getemployees`
    ];

    this.tryLoadEmployees(endpoints, 0);
  }

  private tryLoadEmployees(endpoints: string[], index: number): void {
    if (index >= endpoints.length) {
      console.error('All employee endpoints failed');
      return;
    }

    this.http.get<Employee[]>(endpoints[index]).subscribe({
      next: (data) => {
        console.log('Employee data loaded from:', endpoints[index], data);
        this.employees = data.filter(emp => emp.isactive !== false); // Only active employees

        // Comprehensive change detection for employee dropdown
        this.forceEmployeeDropdownUpdate();
      },
      error: (err) => {
        console.log(`Failed to load from ${endpoints[index]}, trying next...`, err);
        this.tryLoadEmployees(endpoints, index + 1);
      },
    });
  }

  private forceEmployeeDropdownUpdate(): void {
    // Multiple approaches to ensure dropdown populates
    setTimeout(() => {
      this.employees = [...this.employees];
      this.forceChangeDetection();

      // Additional fallbacks
      setTimeout(() => {
        this.employees = [...this.employees];
        this.cdr.detectChanges();

        // Direct DOM manipulation if needed
        const selectElement = document.querySelector('select[formControlName="assignee"]') as HTMLSelectElement;
        if (selectElement && this.employees.length > 0) {
          // Force re-render of options
          const currentValue = selectElement.value;
          selectElement.innerHTML = '<option value="">Select Assignee</option>' +
            this.employees.map(emp => `<option value="${emp.id}">${emp.name}</option>`).join('');
          selectElement.value = currentValue;
        }
      }, 100);
    }, 50);
  }

  generateReport(): void {
    if (this.reportForm.invalid) {
      this.reportForm.markAllAsTouched();
      return;
    }

    // Use getRawValue() because the 'assignee' field might be disabled for non-admins
    const formValues = this.reportForm.getRawValue();

    // Validate date range
    if (new Date(formValues.startdate) > new Date(formValues.enddate)) {
      alert('Start date cannot be later than end date');
      return;
    }

    this.isLoading = true;
    this.hasReportData = false;

    const params = {
      assignee: formValues.assignee,
      startdate: formValues.startdate,
      enddate: formValues.enddate
    };

    console.log('Making API call with params:', params);
    console.log('API URL:', `${environment.apiUrl}/getuserreport`);

    this.http.get<{ success: boolean, data: ReportData[] }>(`${environment.apiUrl}/getuserreport`, { params }).subscribe({
      next: (response) => {
        console.log('API Response received:', response);
        console.log('Response type:', typeof response);
        console.log('Is Array?', Array.isArray(response));
        console.log('Response keys:', response ? Object.keys(response) : 'null/undefined');

        // Handle wrapped response format {success: true, data: [...]}  
        if (response && response.success && Array.isArray(response.data)) {
          console.log('Response has success=true and data array with', response.data.length, 'items');
          this.reportData = response.data;
        } else if (response && response.data) {
          console.log('Response has data property:', response.data);
          this.reportData = Array.isArray(response.data) ? response.data : [];
        } else if (Array.isArray(response)) {
          console.log('Response is a direct array with', response.length, 'items');
          this.reportData = response as any;
        } else {
          console.log('Unexpected response format:', response);
          this.reportData = [];
        }

        console.log('Final reportData:', this.reportData);
        console.log('Final reportData length:', this.reportData.length);
        console.log('Final reportData type:', typeof this.reportData);

        // Update state and ensure UI updates with Promise.resolve
        this.hasReportData = this.reportData.length > 0;
        this.isLoading = false;

        // FINAL SOLUTION: Direct DOM manipulation bypassing Angular's template system
        setTimeout(() => {
          this.reportData = [...this.reportData];
          this.hasReportData = true;

          // Multiple change detection attempts
          setTimeout(() => {
            this.hasReportData = false;
            setTimeout(() => {
              this.hasReportData = true;

              // FINAL SOLUTION: Direct DOM manipulation
              setTimeout(() => {
                this.updateDOMDirectly();

                // Comprehensive button state reset
                this.resetButtonState();
              }, 20);
            }, 10);
          }, 10);
        }, 100);
      },
      error: (err) => {
        console.error('API call failed:', err);
        console.error('Error details:', {
          status: err.status,
          statusText: err.statusText,
          message: err.message,
          error: err.error
        });
        alert(`Failed to generate report: ${err.status} ${err.statusText}`);
        this.isLoading = false;
      },
    });
  }

  get assigneeName(): string {
    // If we have report data, use the assigneename from the first row
    if (this.reportData && this.reportData.length > 0) {
      return this.reportData[0].assigneename || 'N/A';
    }

    // Fallback: lookup from employees list if no report data yet
    const assigneeId = this.reportForm?.value?.assignee;

    // If not admin and we have current user name, use it directly
    if (!this.isAdmin && this.currentUserName) {
      return this.currentUserName;
    }

    if (!assigneeId) return 'N/A';

    const employee = this.employees.find(emp => emp.id === assigneeId);
    return employee?.name || 'N/A';
  }

  get shouldShowResults(): boolean {
    const result = this.hasReportData && !this.isLoading && this.reportData.length > 0;
    console.log('shouldShowResults computed:', {
      hasReportData: this.hasReportData,
      isLoading: this.isLoading,
      reportDataLength: this.reportData.length,
      result: result
    });
    return result;
  }

  resetForm(): void {
    this.reportForm.reset();
    this.reportData = [];
    this.hasReportData = false;
  }

  // Direct DOM manipulation method to bypass Angular change detection issues
  private forceChangeDetection(): void {
    // Multiple approaches to force Angular change detection
    this.cdr.detectChanges();
    this.ngZone.run(() => {
      this.cdr.markForCheck();
      setTimeout(() => {
        this.cdr.detectChanges();
      }, 10);
    });
  }

  private resetButtonState(): void {
    // Comprehensive approach to reset button state
    this.isLoading = false;

    // Force multiple change detection cycles
    this.forceChangeDetection();

    // Additional approaches to ensure button updates
    setTimeout(() => {
      this.isLoading = false;
      this.cdr.detectChanges();

      // Direct DOM manipulation for button if needed
      const generateBtn = document.querySelector('button[type="submit"]') as HTMLButtonElement;
      if (generateBtn) {
        generateBtn.disabled = false;
        generateBtn.textContent = 'Generate Report';
      }
    }, 50);

    // Final fallback
    setTimeout(() => {
      this.isLoading = false;
      this.forceChangeDetection();
    }, 200);
  }

  updateDOMDirectly(): void {
    const loadingBox = document.getElementById('loading-box');
    const reportContainer = document.getElementById('report-results-container');
    const reportContent = document.getElementById('report-content');

    // Hide loading, show content
    if (loadingBox) loadingBox.style.display = 'none';

    // Display actual report data with full styling
    if (reportContainer && reportContent) {
      reportContainer.style.display = 'block';

      if (this.reportData.length > 0) {
        // Generate report header HTML
        const headerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
            <h3 style="margin: 0; color: #2c3e50;">Report Results</h3>
            <button onclick="window.exportReport && window.exportReport()" style="background: #28a745; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
              Export to CSV
            </button>
          </div>
        `;

        // Generate summary HTML
        const summaryHTML = `
          <div style="display: flex; gap: 20px; margin-bottom: 20px; flex-wrap: wrap;">
            <div style="background: #007bff; color: white; padding: 15px; border-radius: 8px; text-align: center;">
              <div style="font-size: 1.2rem; font-weight: bold;">${this.assigneeName || 'N/A'}</div>
              <div style="font-size: 0.9rem;">Assignee</div>
            </div>
            <div style="background: #28a745; color: white; padding: 15px; border-radius: 8px; text-align: center;">
              <div style="font-size: 1.2rem; font-weight: bold;">${this.reportData.length}</div>
              <div style="font-size: 0.9rem;">Total Records</div>
            </div>
            <div style="background: #17a2b8; color: white; padding: 15px; border-radius: 8px; text-align: center;">
              <div style="font-size: 1.2rem; font-weight: bold;">${this.reportForm.value.startdate} to ${this.reportForm.value.enddate}</div>
              <div style="font-size: 0.9rem;">Period</div>
            </div>
          </div>
        `;

        // Generate table HTML
        let tableHTML = `
          <div style="background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); color: white;">
                  <th style="padding: 12px; text-align: left; font-weight: 600;">Track Number</th>
                  <th style="padding: 12px; text-align: left; font-weight: 600;">Name</th>
                  <th style="padding: 12px; text-align: left; font-weight: 600;">Mobile</th>
                  <th style="padding: 12px; text-align: left; font-weight: 600;">Email</th>
                  <th style="padding: 12px; text-align: left; font-weight: 600;">Location</th>
                  <th style="padding: 12px; text-align: left; font-weight: 600;">Assignee</th>
                  <th style="padding: 12px; text-align: left; font-weight: 600;">Status</th>
                  <th style="padding: 12px; text-align: left; font-weight: 600;">Appointment</th>
                  <th style="padding: 12px; text-align: left; font-weight: 600;">Reference</th>
                  <th style="padding: 12px; text-align: left; font-weight: 600;">Notes</th>
                </tr>
              </thead>
              <tbody>
        `;

        this.reportData.forEach((row, index) => {
          const bgColor = index % 2 === 0 ? '#f8f9fa' : 'white';
          tableHTML += `
            <tr style="background: ${bgColor}; transition: background 0.2s;" onmouseover="this.style.background='#e3f2fd'" onmouseout="this.style.background='${bgColor}'">
              <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">${row.tracknumber || 'N/A'}</td>
              <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">${row.name || 'N/A'}</td>
              <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">${row.mobilenumber || 'N/A'}</td>
              <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">${row.emailid || 'N/A'}</td>
              <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">${row.location || 'N/A'}</td>
              <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">${row.assigneename || 'N/A'}</td>
              <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">
                <span style="background: #007bff; color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.8rem;">
                  ${(row.status || 'Unknown').toUpperCase()}
                </span>
              </td>
              <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">${row.appoinmentdate ? new Date(row.appoinmentdate).toLocaleDateString() : 'N/A'}</td>
              <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">${row.referencename || 'N/A'}</td>
              <td style="padding: 12px; border-bottom: 1px solid #dee2e6; max-width: 200px; word-wrap: break-word;">${row.notes || 'N/A'}</td>
            </tr>
          `;
        });

        tableHTML += `
              </tbody>
            </table>
          </div>
        `;

        reportContent.innerHTML = headerHTML + summaryHTML + tableHTML;
      } else {
        reportContent.innerHTML = `
          <div style="text-align: center; padding: 40px; background: white; border-radius: 8px; border: 2px dashed #dee2e6;">
            <div style="font-size: 2rem; margin-bottom: 10px; opacity: 0.5;">📊</div>
            <p style="margin: 0; font-size: 1.1rem; color: #6c757d;">No data found for the selected criteria.</p>
          </div>
        `;
      }
    }
  }

  exportReport(): void {
    if (!this.hasReportData) {
      return;
    }

    // Convert report data to CSV format
    const csvContent = this.convertToCSV(this.reportData);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `daily_report_${this.reportForm.value.startdate}_${this.reportForm.value.enddate}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  private convertToCSV(data: any[]): string {
    if (!data || data.length === 0) {
      return '';
    }

    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');

    const csvRows = data.map(row =>
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in CSV
        return typeof value === 'string' && (value.includes(',') || value.includes('"'))
          ? `"${value.replace(/"/g, '""')}"`
          : value;
      }).join(',')
    );

    return [csvHeaders, ...csvRows].join('\n');
  }
}
