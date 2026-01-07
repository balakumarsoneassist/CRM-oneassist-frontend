import { Component, OnInit } from '@angular/core';
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
  selector: 'app-assignedleads',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ContactFollowTrackComponent],
  templateUrl: './assignedleads.component.html',
  styleUrls: ['./assignedleads.component.css']
})
export class AssignedLeadsComponent implements OnInit {
  showDialog = false;
  showTrackPopup = false;
  selectedTrackNumber: string | null = null;
  fields: FieldMeta[] = [
    { key: 'name', label: 'Name', visible: true },
    { key: 'emailid', label: 'Email', visible: true },
    { key: 'referencename', label: 'Reference Name', visible: true },
    { key: 'location', label: 'Location', visible: true },
    { key: 'mobilenumber', label: 'Mobile Number', visible: true },
    { key: 'notes', label: 'Notes', visible: true },
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

  constructor(private http: HttpClient, private router: Router, private trackNumberService: TrackNumberService) {}

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

    this.http.get<any[]>(`${environment.apiUrl}/assignedleads/${userId}/${orgId}`).subscribe({
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
      },
      error: (err) => console.error('Failed to load assigned leads', err),
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
    const trackNumber = contact['tracknumber']+"***"+contact['id'];
    this.selectedTrackNumber = trackNumber;
    
    // Emit the track number via the observable service
    this.trackNumberService.setTrackNumber(trackNumber);
    
    this.showTrackPopup = true;
    /* If you prefer navigation instead:
       this.router.navigate(['dashboard','contactfollowtrack', contact['tracknumber']]);
    */
    // Placeholder for future tracking functionality
    // alert(`Tracking lead ${contact['name']} ${contact['lastname']}.`);
    // popup opened above
  }

  closeTrackPopup(): void {
    this.showTrackPopup = false;
    this.selectedTrackNumber = null;
    
    // Clear the track number from the service when closing popup
    this.trackNumberService.clearTrackNumber();
  }

  onDataSaved(): void {
    // Refresh the leads data immediately when data is saved
    this.loadContacts();
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
