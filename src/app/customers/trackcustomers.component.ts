import { Component, OnInit, ChangeDetectorRef, NgZone, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Router, RouterModule } from '@angular/router';
import { ContactFollowTrackComponent } from '../contacts/contactfollowtrack.component';
import { CallTrackHistoryComponent } from '../contacts/calltrackhistory.component';
import { TrackNumberService } from '../services/track-number.service';

interface FieldMeta {
  key: string;
  label: string;
  visible: boolean;
  align?: 'left' | 'center' | 'right';
}

@Component({
  selector: 'app-track-customers',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ContactFollowTrackComponent, CallTrackHistoryComponent],
  template: `
    <div class="report-container fade-in">
      <div class="report-header">
        <div class="header-content">
          <div class="title-section">
            <h2 class="report-title">
              <span class="icon-wrapper">
                <i class="icon">👥</i>
              </span>
              Track Customers
            </h2>
            <p class="report-subtitle">Manage and track customer interactions</p>
          </div>
          
          <div class="search-section">
            <!-- TABS -->
            <div class="tabs-container" style="display:flex; gap:10px; margin-right: 20px;">
                <button class="tab-btn" [class.active]="activeTab === 'new'" (click)="setActiveTab('new')">
                  New Track
                </button>
                <button class="tab-btn" [class.active]="activeTab === 'existing'" (click)="setActiveTab('existing')">
                  Existing Track
                </button>
            </div>

            <div class="search-bar">
                <!-- Main Search (Name) -->
                <div class="search-input-group main-search">
                <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input type="text" placeholder="Search by customer name..." [(ngModel)]="searchName" (input)="applySearch()">
                </div>

                <!-- Clear Button -->
                <button class="action-btn clear-btn" (click)="clearSearch()" title="Clear content">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <!-- Filter Toggle -->
                <div class="filter-container">
                    <button class="action-btn filter-btn" [class.active]="showFilterMenu" (click)="toggleFilterMenu($event)">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                        </svg>
                        <span>Filters</span>
                    </button>

                    <!-- Filter Dropdown Menu -->
                    <div class="filter-dropdown" *ngIf="showFilterMenu" (click)="$event.stopPropagation()">
                        
                        <div class="dropdown-section">
                            <label class="section-label">Advanced Search</label>
                            <div class="search-input-group mobile-search">
                                <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                                    <line x1="12" y1="18" x2="12.01" y2="18"></line>
                                </svg>
                                <input type="text" placeholder="Search by mobile number..." [(ngModel)]="searchMobileNumber" (input)="applySearch()">
                            </div>
                        </div>

                        <div class="dropdown-divider"></div>

                        <div class="dropdown-section">
                            <label class="section-label">Columns</label>
                            <div class="columns-list">
                                <label *ngFor="let field of fields" class="column-option">
                                    <input type="checkbox" [checked]="field.visible" (change)="toggleColumn(field)">
                                    {{ field.label }}
                                </label>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>

      <div class="table-frame">
        <div class="table-container">
          <table class="enterprise-table">
            <thead>
              <tr>
                <th class="th-action">Action</th>
                <th *ngFor="let col of visibleFields" [class]="'th-' + (col.align || 'left')">
                  {{ col.label }}
                </th>
              </tr>
            </thead>
            <tbody>
              <!-- Rows injected via direct DOM -->
               <tr *ngIf="contacts.length === 0">
                  <td [attr.colspan]="visibleColumns.length + 1" class="no-data">No customers found</td>
               </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Track Popup Overlay -->
       <div class="overlay" *ngIf="showTrackPopup" (click)="closeTrackPopup()">
        <div class="popup-content" (click)="$event.stopPropagation()">
          <button class="close-btn" (click)="closeTrackPopup()">×</button>
          <app-contactfollowtrack 
            *ngIf="selectedTrackNumber" 
            [tracknumber]="selectedTrackNumber"
            [isEmployee]="isEmployee"
            (closePopup)="closeTrackPopup()"
            (dataSaved)="onDataSaved()">
          </app-contactfollowtrack>
        </div>
      </div>

       <!-- History Popup Overlay -->
       <div class="overlay" *ngIf="showHistoryPopup" (click)="closeHistoryPopup()">
        <div class="popup-content history-popup" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Interaction History</h3>
            <button class="close-btn" (click)="closeHistoryPopup()">×</button>
          </div>
          <div class="modal-body">
             <app-calltrackhistory [tracknumber]="selectedHistoryTrackNumber"></app-calltrackhistory>
          </div>
        </div>
      </div>

    </div>


  `,
  styles: [`
    /* Modern Enterprise UI Design */
    :host {
      display: block;
      padding: 24px;
      background-color: #f1f5f9; /* Slate 100 */
      min-height: 100vh;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    .report-container {
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
      display: flex;
      flex-direction: column;
      height: calc(100vh - 48px);
      overflow: hidden;
      border: 1px solid #e2e8f0;
    }

    .report-header {
      padding: 24px 32px;
      border-bottom: 1px solid #e2e8f0;
      background: #fff;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 24px;
      flex-wrap: wrap;
    }

    .title-section { flex: 1; }
    
    .report-title {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a; /* Slate 900 */
      margin: 0;
      display: flex;
      align-items: center;
      gap: 12px;
      letter-spacing: -0.01em;
    }

    .icon-wrapper {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 18px;
    }

    .report-subtitle {
     color: #64748b;
     margin: 4px 0 0 52px;
     font-size: 13px;
     font-weight: 500;
    }

    /* --- Search & Filter Redesign --- */
    .search-section { display: flex; align-items: center; }
    .search-bar { display: flex; gap: 12px; align-items: center; position: relative; }
    
    .search-input-group { position: relative; }
    
    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      width: 16px; height: 16px;
      color: #64748b;
      pointer-events: none;
    }

    .search-input-group input {
      padding: 0 16px 0 40px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 14px;
      background: #fff;
      color: #1e293b;
      transition: all 0.2s;
    }
    
    .search-input-group input:focus {
      border-color: #6366f1;
      outline: none;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }
    
    /* Main Search Specifics */
    .main-search input {
        width: 300px; /* Wider main search */
        height: 40px;
    }

    /* Buttons */
    .action-btn {
        height: 40px;
        border-radius: 8px;
        border: 1px solid #cbd5e1;
        background: white;
        color: #475569;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        font-size: 14px;
        font-weight: 500;
    }
    
    .action-btn:hover { background: #f8fafc; border-color: #94a3b8; color: #1e293b; }
    .clear-btn { width: 40px; color: #94a3b8; }
    .clear-btn:hover { background: #fef2f2; color: #ef4444; border-color: #fca5a5; }
    
    .filter-btn {
        padding: 0 16px;
        gap: 8px;
    }
    .filter-btn.active {
        background: #eef2ff;
        border-color: #6366f1;
        color: #4f46e5;
    }

    /* --- Filter Dropdown Menu --- */
    .filter-container { position: relative; }
    
    .filter-dropdown {
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 16px;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        z-index: 100;
        width: 320px;
        animation: fadeIn 0.1s ease-out;
    }

    .section-label {
        display: block;
        font-size: 12px;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        margin-bottom: 8px;
        letter-spacing: 0.05em;
    }

    .mobile-search input {
        width: 100%; /* Full width in dropdown */
        height: 38px;
    }
    
    .dropdown-divider {
        height: 1px;
        background: #f1f5f9;
        margin: 16px 0;
    }

    .columns-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-height: 200px;
        overflow-y: auto;
    }

    .column-option {
        display: flex; align-items: center; gap: 10px;
        cursor: pointer; font-size: 14px; color: #334155;
        padding: 4px 0;
    }
    .column-option:hover { color: #0f172a; }
    .column-option input { accent-color: #4f46e5; width: 16px; height: 16px; cursor: pointer; }

    /* -------------------------------- */

    /* Table Structure */
    .table-frame {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .table-container {
      flex: 1;
      overflow: auto;
    }

    /* Enterprise Table Styles - Using ::ng-deep to affect dynamic rows */
    ::ng-deep .enterprise-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      min-width: 1000px;
    }
    
    ::ng-deep .enterprise-table thead {
      position: sticky;
      top: 0;
      z-index: 20;
      background: #f8fafc;
      box-shadow: 0 1px 0 #e2e8f0; 
    }

    ::ng-deep .enterprise-table th {
      background: #f8fafc;
      padding: 12px 16px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      border-bottom: 2px solid #e2e8f0;
      white-space: nowrap;
    }

    /* Alignment Classes */
    ::ng-deep .enterprise-table .th-center, ::ng-deep .enterprise-table .td-center { text-align: center; }
    ::ng-deep .enterprise-table .th-right, ::ng-deep .enterprise-table .td-right { text-align: right; }
    ::ng-deep .enterprise-table .th-left, ::ng-deep .enterprise-table .td-left { text-align: left; }
    ::ng-deep .enterprise-table .th-action { text-align: center; width: 170px; } /* Widened for two buttons */

    /* Rows & Cells */
    ::ng-deep .enterprise-table tbody tr {
      background: white;
      transition: background 0.1s;
    }

    /* Zebra Striping */
    ::ng-deep .enterprise-table tbody tr:nth-child(even) {
      background-color: #f8fafc;
    }

    ::ng-deep .enterprise-table tbody tr:hover {
      background-color: #eef2ff !important; /* Indigo 50 on hover */
    }

    ::ng-deep .enterprise-table td {
      padding: 10px 16px;
      font-size: 13px;
      color: #334155;
      border-bottom: 1px solid #f1f5f9;
      height: 48px;
    }
    
    .action-wrapper {
        display: flex;
        gap: 8px;
        justify-content: center;
        align-items: center;
    }

    /* Track Button - Soft Style */
    ::ng-deep .btn-track {
      background: #e0e7ff; 
      color: #4338ca;
      border: none;
      padding: 6px 16px; /* Slightly wider */
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      letter-spacing: 0.02em;
    }
    ::ng-deep .btn-track:hover {
      background: #4f46e5;
      color: white;
      box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2);
    }
    
    .no-data { text-align: center; padding: 60px; color: #94a3b8; font-style: italic; background: white; }

    /* Overlay */
    .overlay {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(4px);
      display: flex; justify-content: center; align-items: center; z-index: 1000;
      animation: fadeIn 0.2s ease-out;
    }
    .popup-content {
      background: transparent; border-radius: 12px; position: relative;
      width: 90%; max-width: 1200px; max-height: 90vh; overflow-y: auto;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }
    .close-btn {
      position: absolute; top: -16px; right: -16px; width: 32px; height: 32px;
      border-radius: 50%; background: white; border: none; font-size: 20px;
      color: #64748b; cursor: pointer; display: flex; align-items: center;
      justify-content: center; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      z-index: 1100; transition: all 0.2s;
    }
    .close-btn:hover { transform: scale(1.1); color: #ef4444; }

    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

    /* History Popup Styles */
    .history-popup { padding: 0; overflow: hidden; display: flex; flex-direction: column; }
    .modal-header { padding: 16px 24px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; background: #fff; }
    .modal-header h3 { margin: 0; font-size: 18px; color: #1e293b; }
    .modal-body { padding: 24px; overflow-y: auto; max-height: 60vh; background: #f8fafc; }
    
    .history-table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .history-table th { background: #f1f5f9; padding: 12px; text-align: left; color: #475569; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; }
    .history-table td { padding: 12px; border-bottom: 1px solid #f1f5f9; color: #334155; font-size: 13px; }
    .history-table tr:last-child td { border-bottom: none; }
    
    .badge-meet { background: #dcfce7; color: #166534; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .badge-call { background: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    
    .loading-state, .empty-history { text-align: center; padding: 40px; color: #94a3b8; font-style: italic; }

    ::ng-deep .btn-history {
        background: #f0fdf4;
        color: #16a34a;
        border: none; /* No border for cleaner look */
        padding: 6px 16px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
    }
    ::ng-deep .btn-history:hover {
        background: #16a34a;
        color: white;
        box-shadow: 0 2px 4px rgba(22, 163, 74, 0.2);
    }
    
    .tab-btn {
        padding: 8px 16px;
        border: 1px solid #e2e8f0;
        background: white;
        color: #64748b;
        border-radius: 8px;
        font-weight: 600;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s;
    }
    .tab-btn.active {
        background: #4f46e5;
        color: white;
        border-color: #4f46e5;
        box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2);
    }
  `]
})
export class TrackCustomersComponent implements OnInit {
  showDialog = false;
  showTrackPopup = false;
  showFilterMenu = false;
  selectedTrackNumber: string | null = null;
  searchName = '';
  searchMobileNumber = '';
  allContacts: Record<string, any>[] = [];
  filteredContacts: Record<string, any>[] = [];
  isEmployee = false;
  activeTab: 'new' | 'existing' = 'new';

  // History Popup
  showHistoryPopup = false;
  selectedHistoryTrackNumber: string | null = null;

  // Define fields with alignment strategy
  fields: FieldMeta[] = [
    { key: 'name', label: 'Name', visible: true, align: 'left' },
    { key: 'mobilenumber', label: 'Mobile Number', visible: true, align: 'left' },
    { key: 'location', label: 'Location', visible: true, align: 'left' },
    { key: 'product', label: 'Product', visible: true, align: 'center' },
    { key: 'loandate', label: 'Loan Date', visible: true, align: 'right' },
    { key: 'bank', label: 'Bank', visible: true, align: 'left' },
    { key: 'loanamount', label: 'Loan Amount', visible: true, align: 'right' },
  ];

  get contacts(): Record<string, any>[] {
    return this.filteredContacts;
  }

  get visibleFields(): FieldMeta[] {
    return this.fields.filter(f => f.visible);
  }

  get visibleColumns(): string[] {
    return this.visibleFields.map(f => f.key);
  }

  constructor(
    private http: HttpClient,
    private router: Router,
    private trackNumberService: TrackNumberService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) { }

  ngOnInit(): void {
    this.loadContacts();
  }

  // Close filter menu when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    // If click is not inside filter container
    if (!target.closest('.filter-container')) {
      this.showFilterMenu = false;
    }
  }

  toggleFilterMenu(event: Event) {
    event.stopPropagation();
    this.showFilterMenu = !this.showFilterMenu;
  }

  setActiveTab(tab: 'new' | 'existing'): void {
    if (this.activeTab === tab) return;
    this.activeTab = tab;
    this.loadContacts(tab);
  }

  private loadContacts(tabOverride?: 'new' | 'existing'): void {
    const userId = localStorage.getItem('usernameID') || '';
    const orgId = localStorage.getItem('organizationid') || '';
    if (!userId || !orgId) {
      console.warn('User ID or Organization ID not found');
      return;
    }

    this.isEmployee = localStorage.getItem('isadminrights') !== 'true';

    // Safety: Use override if present, else activeTab, else default 'new'
    const currentTab = tabOverride || this.activeTab || 'new';

    // Clear current data to prevent ghosting
    this.allContacts = [];
    this.filteredContacts = [];
    this.applyDirectDOMUpdate(); // Clear UI immediately

    this.http.get<any[]>(`${environment.apiUrl}/trackcustomers/${userId}/${orgId}?type=${currentTab}`).subscribe({
      next: (data) => {
        // Store raw data normalized
        this.allContacts = (data || []).map(obj => {
          const normalized: Record<string, any> = {};
          Object.keys(obj).forEach(k => {
            normalized[k.toLowerCase()] = obj[k];
          });
          return normalized;
        });

        this.applySearch();
        setTimeout(() => { this.applyDirectDOMUpdate(); }, 100);
      },
      error: (err) => console.error('Failed to load track customers', err),
    });
  }

  trackContact(contact: Record<string, any>): void {
    const trackNumber = contact['tracknumber'];
    this.selectedTrackNumber = trackNumber;
    this.trackNumberService.setTrackNumber(trackNumber);

    this.ngZone.run(() => {
      this.showTrackPopup = true;
      this.cdr.detectChanges();
      setTimeout(() => { this.cdr.detectChanges(); }, 10);
    });
  }

  closeTrackPopup(): void {
    this.showTrackPopup = false;
    this.selectedTrackNumber = null;
    this.trackNumberService.clearTrackNumber();
  }

  openHistory(contact: Record<string, any>): void {
    this.trackNumberService.clearTrackNumber(); // Clear previous state first
    const trackNumber = contact['tracknumber'];
    console.log('Opening history for tracknumber:', trackNumber);

    this.selectedHistoryTrackNumber = trackNumber;
    this.showHistoryPopup = true;
    this.cdr.detectChanges(); // Force showing the popup

    // Update service explicitly
    if (trackNumber) {
      this.trackNumberService.setTrackNumber(trackNumber);
    }
  }

  closeHistoryPopup(): void {
    this.showHistoryPopup = false;
    this.selectedHistoryTrackNumber = null;
    this.trackNumberService.clearTrackNumber();
  }

  onDataSaved(): void {
    this.refreshContacts();
  }

  toggleColumn(field: FieldMeta): void {
    field.visible = !field.visible;
    setTimeout(() => {
      this.applyDirectDOMUpdate();
    }, 50);
  }

  applySearch(): void {
    const nameFilter = this.searchName.toLowerCase().trim();
    const mobileFilter = this.searchMobileNumber.trim();

    // API already returns filtered list based on Tab
    let candidates = this.allContacts;

    if (!nameFilter && !mobileFilter) {
      this.filteredContacts = candidates;
    } else {
      this.filteredContacts = candidates.filter(contact => {
        const name = (contact['name'] || '').toLowerCase();
        const mobile = (contact['mobilenumber'] || '').toString();
        const matchesName = !nameFilter || name.includes(nameFilter);
        const matchesMobile = !mobileFilter || mobile.includes(mobileFilter);
        return matchesName && matchesMobile;
      });
    }
    setTimeout(() => { this.applyDirectDOMUpdate(); }, 50);
  }

  clearSearch(): void {
    this.searchName = '';
    this.searchMobileNumber = '';
    this.applySearch();
  }

  private refreshContacts(): void {
    this.loadContacts();
    setTimeout(() => { this.applyDirectDOMUpdate(); }, 100);
  }

  private applyDirectDOMUpdate(): void {
    this.cdr.detectChanges();
    this.ngZone.run(() => {
      setTimeout(() => {
        this.cdr.detectChanges();
        setTimeout(() => { this.updateTableDirectly(); }, 20);
      }, 10);
    });
  }

  // Simplified and Robust DOM update with classes
  private updateTableDirectly(): void {
    const tableBody = document.querySelector('.report-container tbody');
    if (!tableBody) return;

    // ALWAYS Clear previous content first
    tableBody.innerHTML = '';

    if (this.contacts.length === 0) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      // cell.colSpan = this.visibleColumns.length + 1; // logical colspan
      cell.colSpan = 10; // Safe default or calculated
      cell.className = 'no-data';
      cell.textContent = 'No customers found';
      cell.style.textAlign = 'center';
      cell.style.padding = '20px';
      cell.style.color = '#64748b';

      row.appendChild(cell);
      tableBody.appendChild(row);
      return;
    }

    this.contacts.forEach((contact) => {
      const row = document.createElement('tr');

      // 1. Action Column
      const actionCell = document.createElement('td');
      actionCell.className = 'td-center'; // Center alignment

      const actionWrapper = document.createElement('div');
      actionWrapper.className = 'action-wrapper';

      const trackBtn = document.createElement('button');
      trackBtn.textContent = 'Track';
      trackBtn.className = 'btn-track'; // Use CSS class for styling

      trackBtn.onclick = (event) => {
        event.preventDefault(); event.stopPropagation();
        this.trackContact(contact);
      };

      // Add History Button for Employees
      if (this.isEmployee) {
        const historyBtn = document.createElement('button');
        historyBtn.textContent = 'History';
        historyBtn.className = 'btn-history';

        historyBtn.onclick = (event) => {
          event.preventDefault(); event.stopPropagation();
          this.ngZone.run(() => {
            this.openHistory(contact);
          });
        };

        actionWrapper.appendChild(historyBtn);
      }

      actionWrapper.appendChild(trackBtn);
      actionCell.appendChild(actionWrapper);
      row.appendChild(actionCell);

      // 2. Data Columns
      this.visibleFields.forEach(col => {
        const cell = document.createElement('td');

        let value = contact[col.key];
        if (value === null || value === undefined) value = '';

        // Format dates if needed (simple check)
        if (col.key === 'loandate' && value) {
          // Optional: Format date if raw string is ugly, but assuming backend sends display format
        }

        cell.textContent = value;

        // Apply alignment class
        cell.className = `td-${col.align || 'left'}`;

        row.appendChild(cell);
      });

      tableBody.appendChild(row);
    });
  }
}
