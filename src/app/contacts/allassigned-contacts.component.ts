import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Router, RouterModule } from '@angular/router';
import { ContactFollowTrackComponent } from './contactfollowtrack.component';
import { TrackNumberService } from '../services/track-number.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';


interface FieldMeta {
    key: string;
    label: string;
    visible: boolean;
}

@Component({
    selector: 'app-allassigned-contacts',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, ContactFollowTrackComponent],
    templateUrl: './allassigned-contacts.component.html',
    styleUrls: ['./allassigned-contacts.component.css']
})
export class AllassignedContactsComponent implements OnInit {
    showDialog = false;
    showTrackPopup = false;
    selectedTrackNumber: string | null = null;
    searchName = '';
    searchMobileNumber = '';
    allContacts: Record<string, any>[] = [];
    filteredContacts: Record<string, any>[] = [];
    showReassignPopup = false;
    selectedContact: Record<string, any> | null = null;
    employees: any[] = [];
    selectedEmployeeId: number | null = null;
    employeeSearch = ''
    employeeSearch$ = new Subject<string>();
    showSuggestions = false;
    filteredEmployees: any[] = [];

    fields: FieldMeta[] = [
        { key: 'name', label: 'Name', visible: true },
        { key: 'mobilenumber', label: 'Mobile Number', visible: true },
        { key: 'emailid', label: 'Email', visible: true },
        { key: 'location', label: 'Location', visible: true },
        { key: 'contacttype', label: 'Contact Source', visible: true },
        { key: 'referencename', label: 'Reference Name', visible: true },
        { key: 'status', label: 'Status', visible: true },
        { key: 'tracknumber', label: 'Track Number', visible: true },
        { key: 'followedbyname', label: 'Follower', visible: true },

    ];

    get contacts(): Record<string, any>[] {
        return this.filteredContacts;
    }

    constructor(private http: HttpClient, private router: Router, private trackNumberService: TrackNumberService, private cdr: ChangeDetectorRef, private ngZone: NgZone) { }

    ngOnInit(): void {
        this.loadContacts();
        this.openDialog();
        this.loadEmployees();
        this.employeeSearch$.pipe(
            debounceTime(300),
            distinctUntilChanged()
        ).subscribe(() => {
            this.showSuggestions = true;
            this.filteredEmployees = this.employees.filter(emp => emp.name.toLowerCase().includes(this.employeeSearch.toLowerCase()));
        });
    }


    private loadContacts(): void {
        const orgId = localStorage.getItem('organizationid') || '';
        if (!orgId) {
            console.warn('Organization ID not found');
            return;
        }

        this.http.get<any[]>(`${environment.apiUrl}/allassignedcontacts/${orgId}`).subscribe({
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
            error: (err) => console.error('Failed to load assigned contacts', err),
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
    private loadEmployees(): void {
        const orgId = localStorage.getItem('organizationid');
        this.http
            .get<any[]>(`${environment.apiUrl}/employees`)
            .subscribe({
                next: (data) => {
                    this.employees = data.filter(emp => emp.isactive !== false);
                    this.cdr.detectChanges()
                },
                error: (err) => console.error('Failed to load employees', err)
            });
    }

    reassignContact(contact: Record<string, any>): void {
        this.ngZone.run(() => {
            this.selectedContact = contact;
            this.selectedEmployeeId = null;
            this.showReassignPopup = true;
            this.loadEmployees();
            this.cdr.detectChanges();
        });
    }

    filterEmployees(value: string) {
        const search = value.toLowerCase().trim();

        if (!search) {
            this.filteredEmployees = [];
            return;
        }

        this.filteredEmployees = this.employees.filter((emp: any) =>
            emp.name.toLowerCase().includes(search)
        );
    }

    selectEmployee(emp: any): void {
        this.selectedEmployeeId = emp.id;
        this.employeeSearch = emp.name;
        this.showSuggestions = false;
    }


    confirmReassign(): void {
        if (!this.selectedEmployeeId || !this.selectedContact) {
            alert('Please select an employee');
            return;
        }

        const payload = {
            leadid: this.selectedContact['id'],
            newEmployeeId: this.selectedEmployeeId,
            orgid: localStorage.getItem('organizationid')
        };

        this.ngZone.run(() => {
            this.http.post(`${environment.apiUrl}/reassignassignedcontacts`, payload)
                .subscribe({
                    next: () => {
                        alert('Contact reassigned successfully');

                        // Close popup & refresh
                        this.employeeSearch = '';
                        this.filteredEmployees = [];
                        this.showReassignPopup = false;
                        this.selectedEmployeeId = null;
                        this.selectedContact = null;

                        this.cdr.detectChanges();

                        // Reload assigned contacts
                        setTimeout(() => {
                            this.loadContacts();
                            this.cdr.detectChanges();
                        }, 50);
                    },
                    error: (err) => {
                        console.error('Reassign failed', err);
                        alert('Failed to reassign contact');

                        this.cdr.detectChanges();
                    }
                });
        });
    }

    closeReassignPopup(): void {
        this.showReassignPopup = false;
        this.selectedContact = null;
        this.selectedEmployeeId = null;
        this.employeeSearch = '';
        this.filteredEmployees = [];
        this.showSuggestions = false;
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
            trackBtn.textContent = 'Update';

            // Apply inline styles to ensure visibility
            trackBtn.style.cssText = `
        background: linear-gradient(135deg, #007bff 0%, #0056b3 100%) !important;
        color: white !important;
        border: none !important;
        padding: 4px 8px;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s;
        box-shadow: 0 2px 8px rgba(0,123,255,0.3);
        min-width: 80px;
        text-align: center;
        display: inline-block;
        margin-left: 8px; 
      `;

            trackBtn.onclick = (event) => {
                event.preventDefault();
                event.stopPropagation();
                this.trackContact(contact);
            };

            const reassignBtn = document.createElement('button');
            reassignBtn.className = 'reassign-btn';
            reassignBtn.textContent = 'Reassign';
            reassignBtn.style.cssText = `
            background: linear-gradient(135deg, #28a745 0%, #1e7e34 100%) !important;
            color: white !important;
            border: none !important;
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 2px 8px rgba(40,167,69,0.3);
            min-width: 80px;
            text-align: center;
            display: inline-block;
`;
            reassignBtn.onclick = (event) => {
                event.preventDefault();
                event.stopPropagation();
                this.reassignContact(contact);
            };
            actionCell.appendChild(reassignBtn);
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
