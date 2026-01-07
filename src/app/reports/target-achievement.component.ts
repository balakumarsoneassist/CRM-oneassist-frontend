import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TargetAchievementService } from './target-achievement.service';
import { AuthService } from '../services/auth.service';

@Component({
    selector: 'app-target-achievement',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './target-achievement.component.html',
    styleUrls: ['./target-achievement.component.css']
})
export class TargetAchievementComponent implements OnInit {
    data: any[] = [];
    filteredData: any[] = [];
    loading = false;
    error: string | null = null;
    searchText: string = '';

    // Pagination support
    currentPage: number = 1;
    itemsPerPage: number = 10;

    displayColumns = [
        { key: 'name', label: 'Name' },
        { key: 'target', label: 'Target' },
        { key: 'achievement', label: 'Achievement' },
        { key: 'segment', label: 'Segment' },
        { key: 'month', label: 'Month' },
        { key: 'year', label: 'Year' },
        { key: 'status', label: 'Status' }
    ];

    // Summary properties
    totalTarget: number = 0;
    totalAchievement: number = 0;
    achievementPercentage: number = 0;

    constructor(
        private service: TargetAchievementService,
        private cdr: ChangeDetectorRef,
        private authService: AuthService
    ) { }

    // 5 Specific Metrics for Dashboard
    loginsActual: number = 0;
    loginsTarget: number = 0;

    sanctionsActual: number = 0;
    sanctionsTarget: number = 0;
    sanctionsCount: number = 0;

    disbursementActual: number = 0;
    disbursementTarget: number = 0;
    disbursementVolume: number = 0;
    attendedCalls: number = 0;
    attendedCallsTarget: number = 0;

    convertedActual: number = 0;
    convertedTarget: number = 0;

    // Legacy / Compat
    loginsCount: number = 0;
    converted_leads: number = 0;
    unassigned_leads: number = 0; // Keeping default 0 but not using in UI anymore

    // Admin Assignment Logic
    isAssignModalOpen: boolean = false;
    searchEmployeeId: string = '';
    searchedEmployee: any = null;
    assignmentMessage: string | null = null;
    isSearching: boolean = false;

    isEditing: boolean = false;
    editModel: any = {};
    isAdmin: boolean = false;
    userRole: string = 'employee';

    // Admin properties
    assignedEmployees: any[] = [];
    unassignedEmployees: any[] = [];

    checkUserRole() {
        const isAdminRights = localStorage.getItem('isadminrights');
        this.isAdmin = isAdminRights === 'true' || isAdminRights === '1';
        this.userRole = this.isAdmin ? 'admin' : 'employee';
    }

    ngOnInit() {
        this.checkUserRole();
        if (this.isAdmin) {
            this.fetchAssignmentStatus();
        } else {
            // Employee view: just fetch own metrics
            this.fetchMetrics();
        }
        // Legacy mock kept for table only
        this.filteredData = [];
    }

    fetchMetrics() {
        this.loading = true;
        this.service.getTargetMetrics().subscribe({
            next: (data: any) => {
                const targetValues = data.data || data;
                this.updateLocalMetrics(targetValues);
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error("Failed to fetch metrics", err);
                this.loading = false;
            }
        });
    }

    fetchAssignmentStatus() {
        this.loading = true;
        this.service.getTargetAssignmentStatus().subscribe({
            next: (res: any) => {
                this.assignedEmployees = res.assigned || [];
                this.unassignedEmployees = res.unassigned || [];
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error("Failed to fetch assignment status", err);
                this.loading = false;
            }
        });
    }

    updateLocalMetrics(data: any) {
        // New Split Metrics
        this.loginsActual = Number(data.logins_actual) || 0;
        this.loginsTarget = Number(data.logins_target) || 0;

        this.sanctionsActual = Number(data.sanctions_actual) || 0;
        this.sanctionsTarget = Number(data.sanctions_target) || 0;

        this.disbursementActual = Number(data.disbursement_actual) || 0;
        this.disbursementTarget = Number(data.disbursement_target) || 0;

        this.convertedActual = Number(data.converted_actual) || 0;
        this.convertedTarget = Number(data.converted_target) || 0;

        // Existing
        this.disbursementVolume = Number(data.disbursement_volume) || 0; // Legacy
        this.attendedCalls = Number(data.attended_calls) || 0;
        this.attendedCallsTarget = Number(data.attended_calls_target) || 0;

        // Legacy compat (if view uses them)
        this.loginsCount = this.loginsTarget;
        this.sanctionsCount = this.sanctionsActual;
        this.converted_leads = this.convertedActual;
        this.unassigned_leads = Number(data.unassigned_leads) || 0;
    }

    /* ------- Admin Assignment Methods ------- */
    openAssignTargetModal() {
        this.isAssignModalOpen = true;
        this.searchEmployeeId = '';
        this.searchedEmployee = null;
        this.editModel = {};
        this.assignmentMessage = null;
    }

    closeAssignModal() {
        this.isAssignModalOpen = false;
        this.searchedEmployee = null;
        this.searchEmployeeId = '';
    }

    searchEmployee() {
        if (!this.searchEmployeeId) return;

        this.isSearching = true;
        this.assignmentMessage = null;
        this.searchedEmployee = null;

        // Step 1: Get Employee Details
        this.service.getEmployeeById(this.searchEmployeeId).subscribe({
            next: (empData: any) => {
                this.searchedEmployee = empData;

                // Step 2: Get Existing Targets for this employee
                this.service.getTargetMetrics(this.searchEmployeeId).subscribe({
                    next: (res: any) => {
                        const targetData = res.data || {};
                        this.editModel = {
                            employeeId: this.searchEmployeeId, // Important for update
                            logins: targetData.logins || 0,
                            sanctions: targetData.sanctions || 0,
                            disbursement_volume: targetData.disbursement_volume || 0,
                            attended_calls: targetData.attended_calls || 0,
                            attended_calls_target: targetData.attended_calls_target || 0,
                            converted_leads: targetData.converted_leads || 0
                        };
                        this.isSearching = false;
                        this.cdr.detectChanges();
                    },
                    error: (err) => {
                        console.error("Failed to fetch targets for employee", err);
                        // If fail, just initialize with 0
                        this.editModel = {
                            employeeId: this.searchEmployeeId,
                            logins: 0, sanctions: 0, disbursement_volume: 0,
                            attended_calls: 0, attended_calls_target: 0, converted_leads: 0
                        };
                        this.isSearching = false;
                    }
                });

            },
            error: (err) => {
                this.assignmentMessage = "Employee not found";
                this.isSearching = false;
                this.cdr.detectChanges();
            }
        });
    }

    saveAssignedTargets() {
        this.isSearching = true; // Use searching flag for loading state
        this.service.updateTargetMetrics(this.editModel).subscribe({
            next: (res) => {
                const empName = this.searchedEmployee.name;
                this.closeAssignModal();
                this.isSearching = false;
                this.fetchAssignmentStatus(); // Refresh the lists
                setTimeout(() => {
                    alert(`Target has been assigned to ${empName} successfully.`);
                }, 100);
            },
            error: (err) => {
                alert("Failed to assign targets");
                this.isSearching = false;
            }
        });
    }

    editTargetForEmployee(empId: string) {
        this.openAssignTargetModal();
        this.searchEmployeeId = empId;
        this.searchEmployee();
    }

    selectEmployeeForAssignment(emp: any) {
        this.searchEmployeeId = emp.id;
        this.searchEmployee();
    }

    // ----------------------------

    openEditModal() {
        if (this.isAdmin) {
            this.openAssignTargetModal();
            return;
        }
        alert('Access restricted.');
    }

    closeEditModal() {
        this.isEditing = false;
    }

    saveMetrics() {
        // This is the old/self edit method
        this.loading = true;
        this.service.updateTargetMetrics(this.editModel).subscribe({
            next: (res) => {
                this.fetchMetrics();
                this.isEditing = false;
                this.loading = false;
                alert("Targets updated successfully!");
            },
            error: (err) => {
                console.error("Failed to update metrics", err);
                this.loading = false;
                alert("Failed to update targets.");
            }
        });
    }

    loadData() {
        this.loading = true;
        this.service.getData({ search: this.searchText }).subscribe({
            next: (res: any) => {
                // console.log('API Response:', res);
                if (res && res.data) {
                    this.data = res.data;
                    this.filteredData = res.data;
                    this.calculateSummaries();
                }
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('API Error:', err);
                this.error = 'Failed to load data';
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }

    // Chart Data
    monthlyStats: any[] = [];

    // New Properties for Advanced UI
    gap: number = 0;
    salesCount: number = 0;
    salesTarget: number = 100; // Mock annual sales count target
    salesPercentage: number = 0;

    // Donut Chart Property
    currentMonthPercentage: number = 0;
    calculateSummaries() {
        this.totalTarget = this.filteredData.reduce((sum, item) => sum + (Number(item.target) || 0), 0);
        this.totalAchievement = this.filteredData.reduce((sum, item) => sum + (Number(item.achievement) || 0), 0);
        this.achievementPercentage = this.totalTarget > 0 ? (this.totalAchievement / this.totalTarget) * 100 : 0;
    }

    getAchievementColorClass(percentage: number): string {
        if (percentage > 80) return 'text-green';
        if (percentage >= 50) return 'text-yellow';
        return 'text-red';
    }

    applyFilter() {
        this.loadData();
    }

    refreshData() {
        // Real data refresh
        this.loading = true;

        // Call the API to get fresh metrics
        this.fetchMetrics();

        // Also refresh assignment status if admin
        if (this.isAdmin) {
            this.fetchAssignmentStatus();
        }
    }

    // Pagination Logic
    get paginatedData() {
        const start = (this.currentPage - 1) * this.itemsPerPage;
        return this.filteredData.slice(start, start + this.itemsPerPage);
    }

    get totalPages() {
        return Math.ceil(this.filteredData.length / this.itemsPerPage);
    }

    nextPage() {
        if (this.currentPage < this.totalPages) this.currentPage++;
    }

    prevPage() {
        if (this.currentPage > 1) this.currentPage--;
    }

    onPageSizeChange() {
        this.currentPage = 1;
    }

    onPageChange() {
        if (this.currentPage < 1) this.currentPage = 1;
        if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
    }

    getColumnValue(row: any, key: string) {
        return row[key];
    }
}
