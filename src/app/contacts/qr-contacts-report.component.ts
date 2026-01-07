import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

interface QRContactRecord {
  concern: string;
  city: string;
  firstname: string;
  mobile: string;
  productname: string;
}

interface GroupedContact {
  concern: string;
  city: string;
  contacts: QRContactRecord[];
  totalContacts: number;
}

@Component({
  selector: 'app-qr-contacts-report',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './qr-contacts-report.component.html',
  styleUrls: ['./qr-contacts-report.component.css']
})
export class QRContactsReportComponent implements OnInit {
  contacts: QRContactRecord[] = [];
  groupedContacts: GroupedContact[] = [];
  loading = false;
  error: string | null = null;

  // Summary statistics
  totalContacts = 0;
  totalConcerns = 0;

  // Display columns for individual contacts
  displayColumns = [
    { key: 'firstname', label: 'First Name' },
    { key: 'mobile', label: 'Mobile' },
    { key: 'productname', label: 'Product Name' },
    { key: 'concern', label: 'Concern' },
    { key: 'city', label: 'City' }
  ];

  // View mode toggle
  showGroupedView = true;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef, private ngZone: NgZone) {}

  ngOnInit(): void {
    this.loadQRContacts();
  }

  loadQRContacts(): void {
    this.loading = true;
    this.error = null;

    // Force UI update for loading state
    this.ngZone.run(() => {
      this.cdr.detectChanges();
    });

    this.http.get<any>(`${environment.apiUrl}/getqrresponselist`).subscribe({
      next: (response) => {
        console.log('QR contacts data:', response);
        
        // Handle wrapped response format or direct array
        if (response && response.data && Array.isArray(response.data)) {
          this.contacts = response.data;
        } else if (Array.isArray(response)) {
          this.contacts = response;
        } else {
          this.contacts = [];
        }
        
        // Group contacts and calculate summary statistics
        this.groupContactsByConcernAndCity();
        this.calculateSummaryStats();
        
        console.log('Processed contacts:', this.contacts);
        console.log('Grouped contacts:', this.groupedContacts);
        console.log('Summary - Total Contacts:', this.totalContacts, 'Total Concerns:', this.totalConcerns);
        
        // Apply comprehensive change detection fix (following established pattern)
        this.ngZone.run(() => {
          this.loading = false;
          this.cdr.detectChanges();
          
          setTimeout(() => {
            this.cdr.detectChanges();
            
            // Force DOM update directly as fallback
            setTimeout(() => {
              this.updateDOMDirectly();
            }, 50);
          }, 100);
        });
      },
      error: (err) => {
        console.error('Failed to load QR contacts:', err);
        
        // Force UI update for error state too
        this.ngZone.run(() => {
          this.error = 'Failed to load QR contacts data. Please try again.';
          this.loading = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  groupContactsByConcernAndCity(): void {
    const grouped = new Map<string, GroupedContact>();
    
    this.contacts.forEach(contact => {
      const key = `${contact.concern}_${contact.city}`;
      
      if (grouped.has(key)) {
        const existing = grouped.get(key)!;
        existing.contacts.push(contact);
        existing.totalContacts++;
      } else {
        grouped.set(key, {
          concern: contact.concern,
          city: contact.city,
          contacts: [contact],
          totalContacts: 1
        });
      }
    });
    
    this.groupedContacts = Array.from(grouped.values()).sort((a, b) => {
      // Sort by concern first, then by city
      if (a.concern !== b.concern) {
        return a.concern.localeCompare(b.concern);
      }
      return a.city.localeCompare(b.city);
    });
  }

  calculateSummaryStats(): void {
    this.totalContacts = this.contacts.length;
    this.totalConcerns = new Set(this.contacts.map(c => c.concern)).size;
  }

  // Direct DOM manipulation method (following established pattern from other components)
  updateDOMDirectly(): void {
    const loadingContainer = document.querySelector('.loading-container') as HTMLElement;
    const contentWrapper = document.querySelector('.content-wrapper') as HTMLElement;
    const errorContainer = document.querySelector('.error-container') as HTMLElement;
    
    console.log('Direct DOM update - loading:', this.loading, 'contacts:', this.contacts.length, 'error:', this.error);
    
    // Hide loading state
    if (loadingContainer) {
      loadingContainer.style.display = this.loading ? 'flex' : 'none';
    }
    
    // Show/hide error state
    if (errorContainer) {
      errorContainer.style.display = (this.error && !this.loading) ? 'block' : 'none';
    }
    
    // Show/hide content
    if (contentWrapper) {
      contentWrapper.style.display = (!this.loading && !this.error) ? 'block' : 'none';
    }
    
    // Update summary statistics directly
    const totalContactsEl = document.querySelector('.total-contacts-value') as HTMLElement;
    const totalConcernsEl = document.querySelector('.total-concerns-value') as HTMLElement;
    
    if (totalContactsEl && !this.loading && !this.error) {
      totalContactsEl.textContent = this.totalContacts.toLocaleString();
    }
    
    if (totalConcernsEl && !this.loading && !this.error) {
      totalConcernsEl.textContent = this.totalConcerns.toLocaleString();
    }

    // Update grouped view table if in grouped mode
    if (this.showGroupedView) {
      this.updateGroupedTableDirectly();
    } else {
      this.updateContactsTableDirectly();
    }
  }

  updateGroupedTableDirectly(): void {
    const tableBody = document.querySelector('.grouped-table tbody') as HTMLElement;
    if (!tableBody || this.loading || this.error) return;

    let html = '';
    this.groupedContacts.forEach(group => {
      html += `
        <tr class="group-row">
          <td class="concern-cell"><strong>${group.concern}</strong></td>
          <td class="city-cell"><strong>${group.city}</strong></td>
          <td class="count-cell"><span class="contact-count">${group.totalContacts}</span></td>
        </tr>
      `;
      
      // Add individual contacts for this group
      group.contacts.forEach(contact => {
        html += `
          <tr class="contact-detail-row" id="details_${group.concern}_${group.city}" style="display: none;">
            <td class="indent">&nbsp;&nbsp;→ ${contact.firstname}</td>
            <td>${contact.mobile}</td>
            <td colspan="2">${contact.productname}</td>
          </tr>
        `;
      });
    });
    
    tableBody.innerHTML = html;
  }

  updateContactsTableDirectly(): void {
    const tableBody = document.querySelector('.contacts-table tbody') as HTMLElement;
    if (!tableBody || this.loading || this.error) return;

    let html = '';
    this.contacts.forEach(contact => {
      html += `
        <tr class="contact-row">
          <td>${contact.firstname || '-'}</td>
          <td>${contact.mobile || '-'}</td>
          <td>${contact.productname || '-'}</td>
          <td>${contact.concern || '-'}</td>
          <td>${contact.city || '-'}</td>
        </tr>
      `;
    });
    
    tableBody.innerHTML = html;
  }

  toggleView(): void {
    this.showGroupedView = !this.showGroupedView;
    
    // Force update after view toggle
    setTimeout(() => {
      this.updateDOMDirectly();
    }, 10);
  }

  refreshData(): void {
    this.loadQRContacts();
  }

  getColumnValue(contact: QRContactRecord, columnKey: string): any {
    const value = contact[columnKey as keyof QRContactRecord];
    return value || '-';
  }

  trackByContactMobile(index: number, contact: QRContactRecord): string {
    return contact.mobile || index.toString();
  }

  trackByGroupKey(index: number, group: GroupedContact): string {
    return `${group.concern}_${group.city}`;
  }
}
