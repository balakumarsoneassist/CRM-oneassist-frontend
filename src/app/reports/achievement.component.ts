import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TargetAchievementService } from './target-achievement.service';
import { AuthService } from '../services/auth.service';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-achievement',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './achievement.component.html',
  styleUrls: ['./achievement.component.css'],
})
export class AchievementComponent implements OnInit, OnDestroy {
  loading = false;
  error: string | null = null;
  isAdmin: boolean = false;


  // Pagination & Filtering
  paginatedMetrics: any[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalRecords: number = 0;
  itemsPerPageOptions: number[] = [10, 20, 25];

  searchQuery: string = '';
  designationFilter: string = '';
  sortBy: string = 'name';
  sortOrder: 'asc' | 'desc' = 'asc';

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

  // Search Debouncing
  private searchSubject = new Subject<string>();
  private searchSubscription: Subscription | undefined;

  constructor(
    private service: TargetAchievementService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.checkUserRole();

    // Setup debounce for search
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(() => {
      this.currentPage = 1;
      this.fetchAllMetrics();
    });

    if (this.isAdmin) {
      this.fetchAllMetrics();
    } else {
      this.fetchMetrics();
    }
  }

  ngOnDestroy() {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  checkUserRole() {
    const isAdminRights = localStorage.getItem('isadminrights');
    this.isAdmin = isAdminRights === 'true' || isAdminRights === '1';
  }

  // Refresh Button Handler
  refreshData() {
    if (this.isAdmin) {
      this.selectedEmployee = null;
      this.fetchAllMetrics();
    } else {
      this.fetchMetrics();
    }
  }

  fetchAllMetrics() {
    this.loading = true;

    const params = {
      page: this.currentPage,
      limit: this.itemsPerPage,
      search: this.searchQuery,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder
    };

    this.service.getAllAchievementMetrics(params.page, params.limit, params.search, undefined, params.sortBy, params.sortOrder).subscribe({
      next: (data: any) => {
        console.log('✅ Network Data Received (Achievement Page):', data);
        if (data.success) {
          this.allMetrics = data.data || [];
          this.paginatedMetrics = this.allMetrics;
          this.totalRecords = data.totalCount || 0;

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
        this.cdr.detectChanges();
      },
    });
  }

  onSearchChange() {
    this.searchSubject.next(this.searchQuery);
  }

  onSort(column: string) {
    if (this.sortBy === column) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortOrder = 'asc';
    }
    this.fetchAllMetrics();
  }

  onPageSizeChange(event: any) {
    this.itemsPerPage = Number(event.target.value);
    this.currentPage = 1;
    this.fetchAllMetrics();
  }

  // Pagination Logic
  get totalPages(): number {
    return Math.ceil(this.totalRecords / this.itemsPerPage) || 1;
  }

  updatePagination() {
    // Deprecated
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
