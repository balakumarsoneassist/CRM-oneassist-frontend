import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { LeadService } from './customer-segregation.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-customer-segregation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customer-segregation.component.html',
  styleUrls: ['./customer-segregation.component.css']
})
export class CustomerSegregationComponent implements OnInit {
  data: any[] = [];
  filteredData: any[] = [];
  loading = false;
  error: string | null = null;
  filterOptionsLoaded: boolean = false;

  // Pagination and Filter
  searchText: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalRecords: number = 0;

  // Filters
  showFilterModal: boolean = false;
  activeFilterCategory: string = 'Customer Segment';

  // Active filters (applied)
  selectedSegments: string[] = [];
  selectedCategories: string[] = [];
  selectedBanks: string[] = [];
  selectedLoanTypes: string[] = [];
  minLoanAmount: number | null = null;
  maxLoanAmount: number | null = null;

  // Temp filters (inside modal, before apply)
  tempSelectedSegments: string[] = [];
  tempSelectedCategories: string[] = [];
  tempSelectedBanks: string[] = [];
  tempSelectedLoanTypes: string[] = [];
  tempMinLoanAmount: number | null = null;
  tempMaxLoanAmount: number | null = null;

  segmentOptions: string[] = [];
  categoryOptions: string[] = [];
  bankOptions: string[] = [];
  loanTypeOptions: string[] = [];

  get totalPages(): number {
    return Math.ceil(this.totalRecords / this.itemsPerPage) || 1;
  }

  // Define visible columns
  displayColumns = [
    { key: 'name', label: 'Name' },
    { key: 'bankname', label: 'Bank Name' },
    { key: 'loantype', label: 'Loan Type' },
    { key: 'loanamount', label: 'Loan Amount' },
    { key: 'companycategory', label: 'Company Category' },
    { key: 'customersegment', label: 'Customer Segment' },
  ];

  constructor(
    private leadService: LeadService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) { }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.error = null;
    this.cdr.detectChanges();

    const filters = {
      search: this.searchText,
      segments: this.selectedSegments,
      categories: this.selectedCategories,
      banks: this.selectedBanks,
      loanTypes: this.selectedLoanTypes,
      minAmount: this.minLoanAmount,
      maxAmount: this.maxLoanAmount,
      page: this.currentPage,
      limit: this.itemsPerPage
    };

    this.leadService.getAllCustomers(filters).subscribe({
      next: (res: any) => {
        // Handle new response structure with pagination
        if (res && res.success) {
          this.data = res.data || [];
          this.filteredData = this.data; // Server returns paginated data
          this.totalRecords = res.totalCount || 0;

          // Update filter options from server response if available
          if (res.filterOptions) {
            this.segmentOptions = res.filterOptions.segments || [];
            this.categoryOptions = res.filterOptions.categories || [];
            this.bankOptions = res.filterOptions.banks || [];
            this.loanTypeOptions = res.filterOptions.loanTypes || [];
            this.filterOptionsLoaded = true;
          } else if (!this.filterOptionsLoaded) {
            // Fallback if extracting locally (only works for first page though)
            this.extractFilterOptions();
            this.filterOptionsLoaded = true;
          }
        } else {
          // Fallback for legacy response format (safe check)
          if (Array.isArray(res)) {
            this.data = res;
            this.filteredData = res;
            this.totalRecords = res.length;
          } else {
            this.data = [];
            this.filteredData = [];
            this.totalRecords = 0;
          }
        }

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('API ERROR:', err);
        this.error = 'Failed to load customer data. Please try again.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  extractFilterOptions() {
    // Extract unique values for dropdowns
    // Initialize with forced options as per requirements
    const segments = new Set<string>(['Premium', 'Gold']);
    const categories = new Set<string>(['A', 'B', 'C', 'D']);
    const banks = new Set<string>();
    const loanTypes = new Set<string>();

    this.data.forEach(item => {
      if (item.customersegment) segments.add(item.customersegment);
      if (item.companycategory) categories.add(item.companycategory);
      if (item.bankname) banks.add(item.bankname);
      if (item.loantype) loanTypes.add(item.loantype);
    });

    this.segmentOptions = Array.from(segments).sort();
    this.categoryOptions = Array.from(categories).sort();
    this.bankOptions = Array.from(banks).sort();
    this.loanTypeOptions = Array.from(loanTypes).sort();
  }


  // -----------------------
  // FILTERING
  // -----------------------
  applyFilter(): void {
    // With server-side filtering, applyFilter just reloads data
    // Debounce can be added here for search text if needed
    this.loadData();
  }

  // -----------------------
  // PAGINATION
  // -----------------------
  get paginatedData(): any[] {
    // With server-side pagination, 'filteredData' is already the current page
    return this.filteredData;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadData();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadData();
    }
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.loadData();
  }

  onPageChange(): void {
    // Validate page number
    if (this.currentPage < 1) {
      this.currentPage = 1;
    } else if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
    this.loadData();
  }

  refreshData(): void {
    this.loadData();
    // Optional: Reset selections on refresh?
  }

  // -----------------------
  // MODAL LOGIC
  // -----------------------
  openFilterModal() {
    // Copy active state to temp state
    this.tempSelectedSegments = [...this.selectedSegments];
    this.tempSelectedCategories = [...this.selectedCategories];
    this.tempSelectedBanks = [...this.selectedBanks];
    this.tempSelectedLoanTypes = [...this.selectedLoanTypes];
    this.tempMinLoanAmount = this.minLoanAmount;
    this.tempMaxLoanAmount = this.maxLoanAmount;

    this.showFilterModal = true;
  }

  closeFilterModal() {
    this.showFilterModal = false;
  }

  applyModalFilters() {
    // Commit temp state to active state
    this.selectedSegments = [...this.tempSelectedSegments];
    this.selectedCategories = [...this.tempSelectedCategories];
    this.selectedBanks = [...this.tempSelectedBanks];
    this.selectedLoanTypes = [...this.tempSelectedLoanTypes];
    this.minLoanAmount = this.tempMinLoanAmount;
    this.maxLoanAmount = this.tempMaxLoanAmount;

    this.showFilterModal = false;
    this.currentPage = 1; // Reset to first page when filtering changes
    this.loadData(); // Trigger server load
  }

  clearAllFilters() {
    this.tempSelectedSegments = [];
    this.tempSelectedCategories = [];
    this.tempSelectedBanks = [];
    this.tempSelectedLoanTypes = [];
    this.tempMinLoanAmount = null;
    this.tempMaxLoanAmount = null;
    // Don't close, just clear UI
  }

  // Helper for checkboxes
  toggleSelection(list: string[], item: string) {
    const idx = list.indexOf(item);
    if (idx > -1) {
      list.splice(idx, 1);
    } else {
      list.push(item);
    }
  }

  isSelected(list: string[], item: string): boolean {
    return list.includes(item);
  }

  setActiveCategory(cat: string) {
    this.activeFilterCategory = cat;
  }

  getColumnValue(row: any, columnKey: string): any {
    return row[columnKey];
  }

  trackById(index: number, item: any): any {
    return item.id || index;
  }
}
