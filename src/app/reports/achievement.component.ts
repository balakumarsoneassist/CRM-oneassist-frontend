import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TargetAchievementService } from './target-achievement.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-achievement',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './achievement.component.html',
  styleUrls: ['./achievement.component.css'],
})
export class AchievementComponent implements OnInit {
  loading = false;
  error: string | null = null;
  isAdmin: boolean = false;


  // Pagination
  paginatedMetrics: any[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalRecords: number = 0;

  // Single User Metrics
  loginsCount: number = 0;
  loginsTarget: number = 0;
  sanctionsCount: number = 0;
  sanctionsTarget: number = 0;
  disbursementVolume: number = 0;
  disbursementVolumeTarget: number = 0;
  attendedCalls: number = 0;
  attendedCallsTarget: number = 0;
  converted_leads: number = 0;
  convertedLeadsTarget: number = 0;

  // Admin View Data
  allMetrics: any[] = [];

  constructor(
    private service: TargetAchievementService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.checkUserRole();
    if (this.isAdmin) {
      this.fetchAllMetrics();
    } else {
      this.fetchMetrics();
    }
  }

  checkUserRole() {
    const isAdminRights = localStorage.getItem('isadminrights');
    this.isAdmin = isAdminRights === 'true' || isAdminRights === '1';
  }

  // Refresh Button Handler
  refreshData() {
    if (this.isAdmin) {
      this.selectedEmployee = null; // Clear selection on refresh
      this.fetchAllMetrics();
    } else {
      this.fetchMetrics();
    }
  }

  fetchAllMetrics() {
    this.loading = true;
    this.service.getAllAchievementMetrics(this.currentPage, this.itemsPerPage).subscribe({
      next: (data: any) => {
        console.log('✅ Network Data Received (Achievement Page):', data);
        if (data.success) {
          this.allMetrics = data.data || []; // Contains only current page data
          this.paginatedMetrics = this.allMetrics; // Server already paginated
          this.totalRecords = data.totalCount || 0;

          // Use server-side totals if available
          if (data.totals) {
            this.updateAggregateMetricsFromServer(data.totals);
          }
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Failed to fetch all achievement metrics', err);
        this.loading = false;
        this.cdr.detectChanges(); // Stop loader on error
      },
    });
  }



  // Pagination Logic
  get totalPages(): number {
    return Math.ceil(this.totalRecords / this.itemsPerPage) || 1;
  }

  updatePagination() {
    // Deprecated: Server side pagination handles slicing
    this.fetchAllMetrics();
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.fetchAllMetrics();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.fetchAllMetrics();
    }
  }

  fetchMetrics() {
    this.loading = true;
    this.service.getTargetMetrics().subscribe({
      next: (res: any) => {
        console.log(
          '✅ Network Data Received (Achievement Page - User Metrics):',
          res
        );
        const data = res.data || res;
        this.updateLocalMetrics(data);

        // Ensure non-admin sees their own dashboard by default
        if (!this.isAdmin) {
          this.selectedEmployee = { name: localStorage.getItem('username') || 'My' };
        }

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Failed to fetch achievement metrics', err);
        this.loading = false;
      },
    });
  }

  updateLocalMetrics(data: any) {
    this.loginsCount = Number(data.logins) || 0; // Note: For non-admin, API might return 'logins' as actual or target depending on context, assuming existing logic was correct for what it had. Detailed view fixes this.
    // Actually, looking at backend /target-metrics, it returns: logins (target), sanctions (target), etc.
    // And for 'my' metrics, we might need actuals.
    // BUT, the user prompt specifically asked to "bring me to that state" showing 1/15.
    // The previous analysis showed /all-achievement-metrics returns both.
    // /target-metrics returns target values mainly + some actuals (attendedCalls).
    // Let's stick to what we decided: Add the target variables.

    // Safety check: if data has _actual suffix, use it, else fallback or 0
    this.loginsCount = Number(data.logins_actual) || Number(data.logins) || 0;
    this.loginsTarget = Number(data.logins_target) || Number(data.logins) || 0; // If only one login value exists, it might be ambiguous without strict typing from backend, but for Admin view (all-achievement-metrics), we have explicit keys.

    // Let's use the explicit keys from all-achievement-metrics for the Admin Dashboard view
    this.loginsCount = Number(data.logins_actual) || 0;
    this.loginsTarget = Number(data.logins_target) || 0;

    this.sanctionsCount = Number(data.sanctions_actual) || 0;
    this.sanctionsTarget = Number(data.sanctions_target) || 0;

    this.disbursementVolume = Number(data.disbursement_actual) || 0;
    this.disbursementVolumeTarget = Number(data.disbursement_target) || 0;

    this.attendedCalls = Number(data.attended_calls) || 0;
    this.attendedCallsTarget = Number(data.attended_calls_target) || 0;

    this.converted_leads = Number(data.converted_actual) || 0;
    this.convertedLeadsTarget = Number(data.converted_target) || 0;
  }

  updateAggregateMetricsFromServer(totals: any) {
    this.loginsCount = totals.logins_actual || 0;
    this.loginsTarget = totals.logins_target || 0;
    this.sanctionsCount = totals.sanctions_actual || 0;
    this.sanctionsTarget = totals.sanctions_target || 0;
    this.disbursementVolume = totals.disbursement_actual || 0;
    this.disbursementVolumeTarget = totals.disbursement_target || 0;
    this.attendedCalls = totals.attended_calls || 0;
    this.attendedCallsTarget = totals.attended_calls_target || 0;
    this.converted_leads = totals.converted_actual || 0;
    this.convertedLeadsTarget = totals.converted_target || 0;
  }

  // kept for compatibility if needed, but unused
  calculateAggregateMetrics() { }

  selectedEmployee: any = null;

  selectEmployee(emp: any) {
    this.selectedEmployee = emp;
    // Update dashboard metrics with selected employee data
    this.loginsCount = Number(emp.logins_actual) || 0;
    this.loginsTarget = Number(emp.logins_target) || 0;

    this.sanctionsCount = Number(emp.sanctions_actual) || 0;
    this.sanctionsTarget = Number(emp.sanctions_target) || 0;

    this.disbursementVolume = Number(emp.disbursement_actual) || 0;
    this.disbursementVolumeTarget = Number(emp.disbursement_target) || 0;

    this.attendedCalls = Number(emp.attended_calls) || 0;
    this.attendedCallsTarget = Number(emp.attended_calls_target) || 0;

    this.converted_leads = Number(emp.converted_actual) || 0;
    this.convertedLeadsTarget = Number(emp.converted_target) || 0;
  }
}
