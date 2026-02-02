import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Router, RouterModule } from '@angular/router';

interface FieldMeta {
  key: string;
  label: string;
  visible: boolean;
}

@Component({
  selector: 'app-unassignedleads',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './unassignedleads.component.html',
  styleUrls: ['./unassignedleads.component.css']
})
export class UnassignedLeadsComponent implements OnInit {
  showDialog = false;
  fields: FieldMeta[] = [
    { key: 'name', label: 'Name', visible: true },
    { key: 'mobilenumber', label: 'Mobile Number', visible: true },
    { key: 'location', label: 'Location', visible: true },
    { key: 'contacttype', label: 'Contact Source', visible: true },
    { key: 'modifyon', label: 'Modify On', visible: true },
    { key: 'referencename', label: 'Reference Name', visible: true },
    { key: 'tracknumber', label: 'Track Number', visible: true }
  ];

  // Search properties
  searchName = '';
  searchMobileNumber = '';

  // Separate arrays for all data and filtered data
  allLeads: Record<string, any>[] = [];
  filteredLeads: Record<string, any>[] = [];

  // Getter for contacts to maintain compatibility
  get contacts(): Record<string, any>[] {
    return this.filteredLeads;
  }

  constructor(private http: HttpClient, private router: Router, private cdr: ChangeDetectorRef, private ngZone: NgZone) { }

  ngOnInit(): void {
    this.loadContacts();
    this.openDialog();
  }

  private loadContacts(): void {
    const orgId = localStorage.getItem('organizationid') || '';
    if (!orgId) {
      console.warn('Organization ID not found');
      return;
    }
    this.http.get<any[]>(`${environment.apiUrl}/unassignedleads/${orgId}`).subscribe({
      next: (data) => {
        this.allLeads = (data || []).map(obj => {
          const normalized: Record<string, any> = {};
          Object.keys(obj).forEach(k => {
            normalized[k.toLowerCase()] = obj[k];
          });
          return normalized;
        });

        // Initialize filtered leads with all leads
        this.filteredLeads = [...this.allLeads];

        // Force change detection after data loads
        setTimeout(() => {
          this.cdr.detectChanges();
        }, 100);
      },
      error: (err) => console.error('Failed to load unassigned leads', err),
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

  /**
   * Converts various truthy/falsy representations returned from backend into boolean.
   */
  private toBoolean(value: any): boolean {
    return value === true || value === 'true' || value === 1 || value === '1';
  }

  assignToMe(contact: Record<string, any>): void {
    const username = localStorage.getItem('username') || '';
    const tracknumber = contact['tracknumber'] || '';

    const payload = {
      // Use all values from contact record
      ...contact,

      // Override specific values as requested
      status: 11,
      contactfollowedby: 0,
      leadfollowedby: Number(localStorage.getItem('usernameID') || 0),

      // Update assignment info
      assignedto: username,
      remarks: `Lead Assigned to ${username}`,
      assignedon: new Date().toISOString(),
      modifyon: new Date().toISOString(),
      notes: `Lead Assigned to ${username}`
    } as any;

    this.http.post(`${environment.apiUrl}/saveleadtrackdetails/${tracknumber}`, payload).subscribe({
      next: () => {
        alert(`Lead ${contact['name']} Assigned to you.`);
        // Force refresh with multiple change detection cycles
        this.ngZone.run(() => {
          this.loadContacts();
          setTimeout(() => {
            this.cdr.detectChanges();
          }, 200);
        });
      },
      error: (err) => {
        console.error('Failed to save lead track details', err);
        alert('Failed to assign lead. Please try again.');
      },
    });
  }

  toggleColumn(field: FieldMeta): void {
    field.visible = !field.visible;
  }

  getLabel(key: string): string {
    return this.fields.find(f => f.key === key)?.label || key;
  }

  // Search functionality
  applySearch(): void {
    this.filteredLeads = this.allLeads.filter(lead => {
      const nameMatch = !this.searchName ||
        (lead['name'] && lead['name'].toString().toLowerCase().includes(this.searchName.toLowerCase()));

      const mobileMatch = !this.searchMobileNumber ||
        (lead['mobilenumber'] && lead['mobilenumber'].toString().includes(this.searchMobileNumber));

      return nameMatch && mobileMatch;
    });
  }

  clearSearch(): void {
    this.searchName = '';
    this.searchMobileNumber = '';
    this.filteredLeads = [...this.allLeads];
  }

}
