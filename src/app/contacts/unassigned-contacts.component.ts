import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectorRef,
  Component,
  NgZone,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { environment } from '../../environments/environment';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

interface FieldMeta {
  key: string;
  label: string;
  visible: boolean;
}

@Component({
  selector: 'app-unassigned-contacts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './unassigned-contacts.component.html',
  styleUrls: ['./unassigned-contacts.component.css']
})
export class UnassignedContactsComponent implements OnInit {
  showDialog = false;
  searchFirstName = '';
  searchMobileNumber = '';
  allContacts: Record<string, any>[] = [];
  filteredContacts: Record<string, any>[] = [];
  isAdmin = false;
  showReassignPopup = false;
  selectedContact: Record<string, any> | null = null;
  employees: any[] = [];
  selectedEmployeeId: number | null = null;
  employeeSearch = ''
  employeeSearch$ = new Subject<string>();
  showSuggestions = false;
  filteredEmployees: any[] = [];
  selectedEmployee: any | null = null;
  selectedEmployeeName: string = '';


  fields: FieldMeta[] = [
    { key: 'firstname', label: 'First Name', visible: true },
    { key: 'lastname', label: 'Last Name', visible: true },
    { key: 'mobilenumber', label: 'Mobile Number', visible: true },
    { key: 'location', label: 'Location', visible: true },
    { key: 'emailid', label: 'Email', visible: true },
    { key: 'createddt', label: 'Created Date', visible: true },
    { key: 'contactsource', label: 'Contact Source', visible: true },
    { key: 'referencename', label: 'Reference Name', visible: true }
  ];

  get contacts(): Record<string, any>[] {
    return this.filteredContacts;
  }

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef, private ngZone: NgZone) { }

  ngOnInit(): void {
    const isAdminRights = localStorage.getItem('isadminrights');
    this.isAdmin = isAdminRights === 'true';
    this.loadContacts();
    this.openDialog();
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
    this.http.get<any[]>(`${environment.apiUrl}/unassignedcontacts/${orgId}`).subscribe({
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
      error: (err) => console.error('Failed to load unassigned contacts', err),
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

  private loadEmployees(): void {
    this.http.get<any[]>(`${environment.apiUrl}/employees`).subscribe({
      next: (data) => {
        this.employees = data;
        this.filteredEmployees = [...data]; // 👈 show all initially
      },
      error: (err) => console.error('Failed to load employees', err)
    });
  }

  filterEmployees(value: string) {
    const search = value.toLowerCase().trim();

    this.filteredEmployees = !search
      ? [...this.employees]
      : this.employees.filter(emp =>
        emp.name.toLowerCase().includes(search)
      );

    this.showSuggestions = true;
  }

  confirmAssign(): void {
    console.log('Confirm clicked, selectedEmployeeId:', this.selectedEmployeeId);

    if (!this.selectedEmployeeId || !this.selectedContact) {
      alert('Please select an employee');
      return;
    }

    this.assignToEmployee(this.selectedContact);
  }

  reassignContact(contact: any): void {
    this.ngZone.run(() => {
      this.selectedContact = contact;
      this.employeeSearch = '';
      this.selectedEmployeeId = null;
      this.showSuggestions = false;
      this.showReassignPopup = true;
      this.loadEmployees();
      this.cdr.detectChanges();
    });
  }

  selectEmployee(emp: any): void {
    console.log('Selected employee:', emp);
    this.selectedEmployeeName = emp.name;
    this.selectedEmployeeId = emp.id;
    this.employeeSearch = emp.name;
    this.showSuggestions = false;
  }
  assignToEmployee(contact: Record<string, any>): void {
    const username = this.selectedEmployeeName;
    const userId = Number(this.selectedEmployeeId);
    const payload = this.buildPayload(contact, username, userId);

    this.http.post(`${environment.apiUrl}/saveleadtrackdetails`, payload).subscribe({
      next: () => {
        alert(`Assigned to ${username}`);
        this.closeReassignPopup();
        this.loadContacts();
      },
      error: () => alert('Assignment failed')
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

  // assignToMe(contact: Record<string, any>): void {
  //   const username = localStorage.getItem('username') || '';
  //   const payload = {
  //     // Required / basic info
  //     leadid: Number(contact['id'] ?? contact['leadid'] ?? 0),
  //     assignedto: username,
  //     remarks: `Assigned to ${username}`,
  //     assignedon: new Date().toISOString(),

  //     // Lead tracking details as requested by backend
  //     appointmentdate: null,
  //     status: 2,
  //     notes: `Assigned to ${username}`,
  //     isdirectmeet: false,
  //     occupationtype: '',
  //     loantype: '',
  //     desireloanamount: 0,
  //     tenure: 0,
  //     preferedbank: '',
  //     cibilscore: 0,
  //     incometype: '',
  //     incomeamount: 0,

  //     // Document flags
  //     isidproof: false,
  //     isageproof: false,
  //     isaddessproof: false,
  //     iscreditcardstatement: false,
  //     isexistingloantrack: false,
  //     iscurrentaccountstatement: false,
  //     isstabilityproof: false,
  //     isbankstatement: false,
  //     ispayslip: false,
  //     isform16: false,
  //     isbusinessproof: false,
  //     isitr: false,
  //     isgststatement: false,
  //     isencumbrancecertificate: false,
  //     istitledeed: false,
  //     isparentdeed: false,
  //     islayoutplan: false,
  //     isregulationorder: false,
  //     isbuildingpermit: false,
  //     ispropertytax: false,
  //     ispatta: false,
  //     isconstructionagreement: false,
  //     issaleagreement: false,
  //     isapf: false,
  //     isudsregistration: false,
  //     isrcbook: false,

  //     // Banking / sanction details
  //     bankname: '',
  //     applicationnumber: '',
  //     logindate: null,
  //     loginvalue: 0,
  //     sanctionroi: 0,
  //     sanctiontenure: 0,
  //     sanctionletter: '',
  //     sanctionvalue: 0,
  //     sanctiondate: null,
  //     psdcondition: '',

  //     // Verification flags and reports
  //     islegal: false,
  //     istechnical: false,
  //     legalreport: '',
  //     technicalreport: '',
  //     ispsdconditionverified: false,

  //     // Follow-up and modification
  //     modifyon: new Date().toISOString(),
  //     contactfollowedby: Number(localStorage.getItem('usernameID') || 0),
  //     leadfollowedby: 0,
  //     isnoresponse: false,

  //     // Org / payout
  //     organizationid: Number(localStorage.getItem('organizationid') || 0),
  //     payoutpercent: 0,
  //     ispaid: false,
  //     connectorcontactid: 0,
  //     disbursementamount: 0,

  //     // Misc meta
  //     customername: `${contact['firstname'] ?? ''} ${contact['lastname'] ?? ''}`.trim(),
  //     datastrength: '',
  //     compname: '',
  //     compcat: '',
  //     custsegment: ''
  //   } as any;

  //   this.http.post(`${environment.apiUrl}/saveleadtrackdetails`, payload).subscribe({
  //     next: () => {
  //       alert(`Assigned ${contact['firstname']} ${contact['lastname']} to you.`);
  //       // Refresh the report to get updated data from server
  //       this.loadContacts();
  //     },
  //     error: (err) => {
  //       console.error('Failed to save lead track details', err);
  //       alert('Failed to assign contact. Please try again.');
  //     },
  //   });
  // }

  assignToMe(contact: Record<string, any>): void {
    const username = localStorage.getItem('username') || '';
    const userId = Number(localStorage.getItem('usernameID') || 0);

    const payload = this.buildPayload(contact, username, userId);

    this.http.post(`${environment.apiUrl}/saveleadtrackdetails`, payload).subscribe({
      next: () => {
        alert(`Assigned to you`);
        this.loadContacts();
      },
      error: () => alert('Assignment failed')
    });
  }


  private buildPayload(contact: any, username: string, userId: number): any {
    return {
      leadid: Number(contact['id'] ?? contact['leadid'] ?? 0),
      assignedto: username,
      remarks: `Assigned to ${username}`,
      assignedon: new Date().toISOString(),

      // Lead tracking details as requested by backend
      appointmentdate: null,
      status: 2,
      notes: `Assigned to ${username}`,
      isdirectmeet: false,
      occupationtype: '',
      loantype: '',
      desireloanamount: 0,
      tenure: 0,
      preferedbank: '',
      cibilscore: 0,
      incometype: '',
      incomeamount: 0,

      // Document flags
      isidproof: false,
      isageproof: false,
      isaddessproof: false,
      iscreditcardstatement: false,
      isexistingloantrack: false,
      iscurrentaccountstatement: false,
      isstabilityproof: false,
      isbankstatement: false,
      ispayslip: false,
      isform16: false,
      isbusinessproof: false,
      isitr: false,
      isgststatement: false,
      isencumbrancecertificate: false,
      istitledeed: false,
      isparentdeed: false,
      islayoutplan: false,
      isregulationorder: false,
      isbuildingpermit: false,
      ispropertytax: false,
      ispatta: false,
      isconstructionagreement: false,
      issaleagreement: false,
      isapf: false,
      isudsregistration: false,
      isrcbook: false,

      // Banking / sanction details
      bankname: '',
      applicationnumber: '',
      logindate: null,
      loginvalue: 0,
      sanctionroi: 0,
      sanctiontenure: 0,
      sanctionletter: '',
      sanctionvalue: 0,
      sanctiondate: null,
      psdcondition: '',

      // Verification flags and reports
      islegal: false,
      istechnical: false,
      legalreport: '',
      technicalreport: '',
      ispsdconditionverified: false,

      // Follow-up and modification
      modifyon: new Date().toISOString(),
      contactfollowedby: userId,
      leadfollowedby: 0,
      isnoresponse: false,

      // Org / payout
      organizationid: Number(localStorage.getItem('organizationid') || 0),
      payoutpercent: 0,
      ispaid: false,
      connectorcontactid: 0,
      disbursementamount: 0,

      // Misc meta
      customername: `${contact['firstname'] ?? ''} ${contact['lastname'] ?? ''}`.trim(),
      datastrength: '',
      compname: '',
      compcat: '',
      custsegment: ''
    } as any;

  }


  toggleColumn(field: FieldMeta): void {
    field.visible = !field.visible;
  }

  getLabel(key: string): string {
    return this.fields.find(f => f.key === key)?.label || key;
  }

  applySearch(): void {
    const firstNameFilter = this.searchFirstName.toLowerCase().trim();
    const mobileFilter = this.searchMobileNumber.trim();

    if (!firstNameFilter && !mobileFilter) {
      // No search criteria, show all contacts
      this.filteredContacts = [...this.allContacts];
    } else {
      this.filteredContacts = this.allContacts.filter(contact => {
        const firstName = (contact['firstname'] || '').toLowerCase();
        const mobile = (contact['mobilenumber'] || '').toString();

        const matchesFirstName = !firstNameFilter || firstName.includes(firstNameFilter);
        const matchesMobile = !mobileFilter || mobile.includes(mobileFilter);

        return matchesFirstName && matchesMobile;
      });
    }

    // Apply direct DOM update after filtering
    setTimeout(() => {
      this.applyDirectDOMUpdate();
    }, 50);
  }

  clearSearch(): void {
    this.searchFirstName = '';
    this.searchMobileNumber = '';
    this.applySearch();
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

      // Action column with assign button
      const actionCell = document.createElement('td');
      const assignBtn = document.createElement('button');
      assignBtn.className = 'assign-btn';
      assignBtn.textContent = this.isAdmin ? "Assign" : "Assign to Me";
      assignBtn.setAttribute('aria-label', 'Assign to Me');

      // Apply inline styles to ensure visibility
      assignBtn.style.cssText = `
        background: linear-gradient(135deg, #28a745 0%, #20c997 100%) !important;
        color: white !important;
        border: none !important;
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s;
        box-shadow: 0 2px 8px rgba(40,167,69,0.3);
        min-width: 100px;
        text-align: center;
        display: inline-block;
      `;

      assignBtn.onclick = () => { this.isAdmin ? this.reassignContact(contact) : this.assignToMe(contact) };
      actionCell.appendChild(assignBtn);
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
