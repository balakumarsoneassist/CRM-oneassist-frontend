import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Router, RouterModule } from '@angular/router';
import { ContactFollowTrackComponent } from '../contacts/contactfollowtrack.component';
import { TrackNumberService } from '../services/track-number.service';

interface FieldMeta {
  key: string;
  label: string;
  visible: boolean;
}

@Component({
  selector: 'app-track-customers',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ContactFollowTrackComponent],
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
          
          <div class="search-bar">
            <div class="search-input-group">
              <i class="search-icon">🔍</i>
              <input type="text" placeholder="Search by name..." [(ngModel)]="searchName" (input)="applySearch()">
            </div>
            <div class="search-input-group">
              <i class="search-icon">📱</i>
              <input type="text" placeholder="Search by mobile..." [(ngModel)]="searchMobileNumber" (input)="applySearch()">
            </div>
            <div class="header-actions">
                <button class="clear-btn" (click)="clearSearch()" title="Clear filters">
                    <i class="icon">✕</i>
                </button>
                <div class="column-toggle-wrapper">
                    <button class="toggle-columns-btn" title="Show/Hide Columns">
                    <i class="icon">👁️</i>
                    </button>
                    <div class="column-dropdown">
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

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th class="action-header">Action</th>
              <th *ngFor="let col of visibleColumns">{{ getLabel(col) }}</th>
            </tr>
          </thead>
          <tbody>
            <!-- Rows will be injected here by direct DOM manipulation for performance -->
             <tr *ngIf="contacts.length === 0">
                <td [attr.colspan]="visibleColumns.length + 1" class="no-data">No customers found</td>
             </tr>
          </tbody>
        </table>
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
    </div>
  `,
  styles: [`
    /* Reusing styles from trackcontacts or similar reports */
    .fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    .report-container {
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.05);
      margin: 20px;
      padding: 24px;
      height: calc(100vh - 100px);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .report-header {
      margin-bottom: 24px;
      padding-bottom: 20px;
      border-bottom: 1px solid #eee;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
      flex-wrap: wrap;
    }

    .title-section { flex: 1; }
    .report-title {
      font-size: 24px;
      font-weight: 700;
      color: #1a1f36;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .icon-wrapper {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-style: normal;
    }
    .report-subtitle {
      color: #64748b;
      margin: 5px 0 0 52px;
      font-size: 14px;
    }

    .search-bar {
      display: flex;
      gap: 12px;
      align-items: center;
    }
    .search-input-group {
      position: relative;
    }
    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
      font-style: normal;
      pointer-events: none;
    }
    .search-input-group input {
      padding: 10px 16px 10px 40px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 14px;
      width: 200px;
      transition: all 0.2s;
    }
    .search-input-group input:focus {
      border-color: #6366f1;
      outline: none;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }
    .header-actions {
        display: flex;
        gap: 10px;
    }
    .clear-btn, .toggle-columns-btn {
        width: 36px;
        height: 36px;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
        background: white;
        color: #64748b;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
    }
    .clear-btn:hover, .toggle-columns-btn:hover {
        background: #f8fafc;
        color: #ef4444;
        border-color: #ef4444;
    }
    .toggle-columns-btn:hover {
        color: #6366f1;
        border-color: #6366f1;
    }

    /* Column Dropdown */
    .column-toggle-wrapper { position: relative; }
    .column-dropdown {
        position: absolute;
        top: 100%;
        right: 0;
        margin-top: 8px;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        z-index: 100;
        min-width: 200px;
        display: none;
    }
    .column-toggle-wrapper:hover .column-dropdown { display: flex; flex-direction: column; }
    .column-option {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px;
        cursor: pointer;
        border-radius: 4px;
        font-size: 14px;
        color: #475569;
    }
    .column-option:hover { background: #f1f5f9; }

    .table-container {
      flex: 1;
      overflow: auto;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      min-width: 1000px;
    }
    thead {
        position: sticky;
        top: 0;
        z-index: 10;
        background: #f8fafc;
    }
    th {
      background: #f8fafc;
      padding: 12px 16px;
      text-align: left;
      font-weight: 600;
      color: #475569;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #e2e8f0;
      white-space: nowrap;
    }
    th.action-header { width: 100px; text-align: center; }
    td {
      padding: 12px 16px;
      border-bottom: 1px solid #e2e8f0;
      color: #334155;
      font-size: 14px;
    }
    tr:hover td { background: #f8fafc; }
    .no-data { text-align: center; padding: 40px; color: #94a3b8; font-style: italic; }

    /* Overlay */
    .overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      animation: fadeIn 0.2s ease-out;
    }
    .popup-content {
      background: transparent;
      border-radius: 12px;
      position: relative;
      width: 90%;
      max-width: 1200px;
      max-height: 90vh;
      overflow-y: auto;
    }
    .close-btn {
      position: absolute;
      top: -15px;
      right: -15px;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: white;
      border: none;
      font-size: 20px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      z-index: 1100;
    }
  `]
})
export class TrackCustomersComponent implements OnInit {
  showDialog = false;
  showTrackPopup = false;
  selectedTrackNumber: string | null = null;
  searchName = '';
  searchMobileNumber = '';
  allContacts: Record<string, any>[] = [];
  filteredContacts: Record<string, any>[] = [];
  isEmployee = false;

  fields: FieldMeta[] = [
    { key: 'name', label: 'Name', visible: true },
    { key: 'location', label: 'Location', visible: true },
    { key: 'mobilenumber', label: 'Mobile Number', visible: true },
    { key: 'product', label: 'Product', visible: true },
    { key: 'loandate', label: 'Loan Date', visible: true },
    { key: 'bank', label: 'Bank', visible: true },
    { key: 'loanamount', label: 'Loan Amount', visible: true },
  ];

  get contacts(): Record<string, any>[] {
    return this.filteredContacts;
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

  private loadContacts(): void {
    const userId = localStorage.getItem('usernameID') || '';
    const orgId = localStorage.getItem('organizationid') || '';
    if (!userId || !orgId) {
      console.warn('User ID or Organization ID not found');
      return;
    }

    this.isEmployee = localStorage.getItem('isadminrights') !== 'true';

    // Using trackcustomers endpoint (to be created)
    this.http.get<any[]>(`${environment.apiUrl}/trackcustomers/${userId}/${orgId}`).subscribe({
      next: (data) => {
        this.allContacts = (data || []).map(obj => {
          const normalized: Record<string, any> = {};
          Object.keys(obj).forEach(k => {
            normalized[k.toLowerCase()] = obj[k];
          });
          return normalized;
        });

        // Initialize filtered contacts with all contacts
        this.applySearch();

        // Apply direct DOM manipulation for reliable rendering
        setTimeout(() => {
          this.applyDirectDOMUpdate();
        }, 100);
      },
      error: (err) => console.error('Failed to load track customers', err),
    });
  }

  get visibleColumns(): string[] {
    return this.fields.filter(f => f.visible).map(f => f.key);
  }

  trackContact(contact: Record<string, any>): void {
    const trackNumber = contact['tracknumber'];
    this.selectedTrackNumber = trackNumber;

    // Emit the track number via the observable service
    this.trackNumberService.setTrackNumber(trackNumber);

    // Force change detection and popup display
    this.ngZone.run(() => {
      this.showTrackPopup = true;
      this.cdr.detectChanges();

      // Additional timeout to ensure popup displays
      setTimeout(() => {
        this.cdr.detectChanges();
      }, 10);
    });
  }

  closeTrackPopup(): void {
    this.showTrackPopup = false;
    this.selectedTrackNumber = null;

    // Clear the track number from the service when closing popup
    this.trackNumberService.clearTrackNumber();
  }

  onDataSaved(): void {
    // Refresh the contacts data immediately when data is saved
    this.refreshContacts();
  }

  toggleColumn(field: FieldMeta): void {
    field.visible = !field.visible;
  }

  getLabel(key: string): string {
    return this.fields.find(f => f.key === key)?.label || key;
  }

  applySearch(): void {
    const nameFilter = this.searchName.toLowerCase().trim();
    const mobileFilter = this.searchMobileNumber.trim();

    if (!nameFilter && !mobileFilter) {
      // No search criteria, show all contacts
      this.filteredContacts = [...this.allContacts];
    } else {
      this.filteredContacts = this.allContacts.filter(contact => {
        const name = (contact['name'] || '').toLowerCase();
        const mobile = (contact['mobilenumber'] || '').toString();

        const matchesName = !nameFilter || name.includes(nameFilter);
        const matchesMobile = !mobileFilter || mobile.includes(mobileFilter);

        return matchesName && matchesMobile;
      });
    }

    // Apply direct DOM update after filtering
    setTimeout(() => {
      this.applyDirectDOMUpdate();
    }, 50);
  }

  clearSearch(): void {
    this.searchName = '';
    this.searchMobileNumber = '';
    this.applySearch();
  }

  private refreshContacts(): void {
    // Reload contacts data from server
    this.loadContacts();

    // Apply direct DOM manipulation for reliable rendering
    setTimeout(() => {
      this.applyDirectDOMUpdate();
    }, 100);
  }

  private applyDirectDOMUpdate(): void {
    // Multiple change detection attempts
    this.cdr.detectChanges();

    this.ngZone.run(() => {
      setTimeout(() => {
        this.cdr.detectChanges();

        setTimeout(() => {
          this.updateTableDirectly();
        }, 20);
      }, 10);
    });
  }

  private updateTableDirectly(): void {
    const tableBody = document.querySelector('.report-container tbody');
    if (!tableBody) {
      // It might not be in DOM yet if navigating freshly
      return;
    }

    // Clear existing rows
    // Note: This approach clears Angular's view of the rows if we strictly relied on *ngFor,
    // but here we are mixing them. We should be careful.
    // Ideally we should use *ngFor OR direct DOM, not both.
    // The original TrackContactsComponent used this hybrid approach likely for performance or some specific bug workaround.
    // I will stick to the pattern but ensure the *ngIf="false" or similar is used if we wanted to avoid duplication,
    // but the template I wrote only has the "No Data" row.
    // So I need to make sure I don't wipe the "No Data" row if I have data.

    // Actually, let's keep it simple: If I have data, I overwrite innerHTML.
    // If I don't have data, I let Angular show the "No customers found" row.

    if (this.contacts.length === 0) {
      // Let Angular handle the empty state
      return;
    }

    tableBody.innerHTML = '';

    // Generate new rows
    this.contacts.forEach((contact) => {
      const row = document.createElement('tr');

      // Action column with track button
      const actionCell = document.createElement('td');
      actionCell.style.textAlign = 'center';

      const trackBtn = document.createElement('button');
      trackBtn.textContent = 'Track';

      // Apply inline styles to ensure visibility
      trackBtn.style.cssText = `
        background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%) !important;
        color: white !important;
        border: none !important;
        padding: 6px 14px;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        box-shadow: 0 2px 4px rgba(99, 102, 241, 0.3);
      `;

      trackBtn.onmouseover = () => {
        trackBtn.style.transform = 'translateY(-1px)';
        trackBtn.style.boxShadow = '0 4px 6px rgba(99, 102, 241, 0.4)';
      };

      trackBtn.onmouseout = () => {
        trackBtn.style.transform = 'translateY(0)';
        trackBtn.style.boxShadow = '0 2px 4px rgba(99, 102, 241, 0.3)';
      };

      trackBtn.onclick = (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.trackContact(contact);
      };
      actionCell.appendChild(trackBtn);
      row.appendChild(actionCell);

      // Data columns
      this.visibleColumns.forEach(col => {
        const cell = document.createElement('td');
        cell.textContent = contact[col] || '';
        row.appendChild(cell);
      });

      tableBody.appendChild(row);
    });
  }
}
