import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Router, RouterModule } from '@angular/router';
import { ContactFollowTrackComponent } from './contactfollowtrack.component';
import { TrackNumberService } from '../services/track-number.service';

interface FieldMeta {
  key: string;
  label: string;
  visible: boolean;
}

@Component({
  selector: 'app-trackcontacts',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ContactFollowTrackComponent],
  templateUrl: './trackcontacts.component.html',
  styleUrls: ['./trackcontacts.component.css']
})
export class TrackContactsComponent implements OnInit {
  showDialog = false;
  showTrackPopup = false;
  selectedTrackNumber: string | null = null;
  searchName = '';
  searchMobileNumber = '';
  allContacts: Record<string, any>[] = [];
  filteredContacts: Record<string, any>[] = [];

  fields: FieldMeta[] = [
    { key: 'name', label: 'Name', visible: true },
    { key: 'emailid', label: 'Email', visible: true },
    { key: 'referencename', label: 'Reference Name', visible: true },
    { key: 'location', label: 'Location', visible: true },
    { key: 'mobilenumber', label: 'Mobile Number', visible: true },
    { key: 'contacttype', label: 'Contact Source', visible: true },
    { key: 'status', label: 'Status', visible: true },
    { key: 'appointmentdate', label: 'Appointment Date', visible: true },
    { key: 'tracknumber', label: 'Track Number', visible: true }
  ];

  get contacts(): Record<string, any>[] {
    return this.filteredContacts;
  }

  constructor(private http: HttpClient, private router: Router, private trackNumberService: TrackNumberService, private cdr: ChangeDetectorRef, private ngZone: NgZone) { }

  ngOnInit(): void {
    this.loadContacts();
    this.openDialog();
  }

  private loadContacts(): void {
    const userId = localStorage.getItem('usernameID') || '';
    const orgId = localStorage.getItem('organizationid') || '';
    if (!userId || !orgId) {
      console.warn('User ID or Organization ID not found');
      return;
    }

    this.http.get<any[]>(`${environment.apiUrl}/trackcontacts/${userId}/${orgId}`).subscribe({
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

        // Apply direct DOM manipulation for reliable rendering after data loads
        setTimeout(() => {
          this.applyDirectDOMUpdate();
        }, 100);
      },
      error: (err) => console.error('Failed to load track contacts', err),
    });
  }

  get visibleColumns(): string[] {
    return this.fields.filter(f => f.visible).map(f => f.key);
  }

  openDialog(): void {
    this.showDialog = true;
  }

  closeDialog(): void {
    this.showDialog = false;
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

    // Apply direct DOM manipulation for reliable rendering (following established pattern)
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
      console.warn('Table body not found for direct DOM update');
      return;
    }

    // Clear existing rows
    tableBody.innerHTML = '';

    // Generate new rows
    this.contacts.forEach((contact, index) => {
      const row = document.createElement('tr');

      // Action column with track button
      const actionCell = document.createElement('td');
      const trackBtn = document.createElement('button');
      trackBtn.className = 'track-btn';
      trackBtn.textContent = 'Track';

      // Apply inline styles to ensure visibility
      trackBtn.style.cssText = `
        background: linear-gradient(135deg, #17a2b8 0%, #138496 100%) !important;
        color: white !important;
        border: none !important;
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s;
        box-shadow: 0 2px 8px rgba(23,162,184,0.3);
        min-width: 80px;
        text-align: center;
        display: inline-block;
      `;

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
