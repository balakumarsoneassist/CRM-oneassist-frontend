import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

interface FieldMeta {
  key: string;
  label: string;
  visible: boolean;
}

@Component({
  selector: 'app-customer-followup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customer-followup.component.html',
  styleUrls: ['./customer-followup.component.css'],
})
export class CustomerFollowupComponent implements OnInit {
  showDialog = false;
  showFollowupPopup = false;
  selectedCustomer: Record<string, any> = {};

  // Form data for followup details
  followupForm = {
    dateofvisit: '',
    nextvisit: '',
    remarks: '',
  };

  // Previous history data
  previousHistory: any[] = [];
  loadingHistory = false;

  // Convert to contact functionality
  convertingToContact = false;

  fields: FieldMeta[] = [
    { key: 'svcid', label: 'SVC ID', visible: false },
    { key: 'name', label: 'Name', visible: true },
    { key: 'mobileno', label: 'Mobile Number', visible: true },
    { key: 'location', label: 'Location', visible: true },
    { key: 'novisit', label: 'No. of Visits', visible: true },
    { key: 'lastvisit', label: 'Last Visit', visible: true },
    { key: 'appoinment_date', label: 'Appointment Date', visible: true },
    { key: 'svtid', label: 'SVT ID', visible: false },
    { key: 'remarks', label: 'Remarks', visible: true },
  ];

  customers: Record<string, any>[] = [];

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    const empId = localStorage.getItem('usernameID') || '';
    console.log(
      '[DEBUG] loadCustomers - Current empId from localStorage:',
      empId
    );

    if (!empId) {
      console.warn('[DEBUG] No empId found in localStorage (usernameID)');
      return;
    }

    // Use the specified API endpoint with employee ID
    this.http
      .get<any>(`${environment.apiUrl}/svcustomerlist/${empId}`)
      .subscribe({
        next: (response) => {
          console.log('API Response:', response);

          // Handle different response formats
          let data = response;

          // Check if response is wrapped in an object with data property
          if (
            response &&
            typeof response === 'object' &&
            !Array.isArray(response)
          ) {
            if (response.data) {
              data = response.data;
            } else if (response.result) {
              data = response.result;
            } else if (response.customers) {
              data = response.customers;
            }
          }

          // Ensure data is an array
          if (!Array.isArray(data)) {
            console.warn('API response is not an array:', data);
            data = [];
          }

          this.customers = data.map((obj: any) => {
            const normalized: Record<string, any> = {};
            Object.keys(obj || {}).forEach((k) => {
              normalized[k.toLowerCase()] = obj[k];
            });

            // Fallback for remarks if using the new aggregated field
            if (!normalized['remarks'] && normalized['all_remarks']) {
              normalized['remarks'] = normalized['all_remarks'];
            }

            // Date formatting for UI
            if (normalized['lastvisit']) {
              try {
                normalized['lastvisit'] = new Date(
                  normalized['lastvisit']
                ).toLocaleString();
              } catch (e) {
                console.warn('Date formatting error:', e);
              }
            }
            if (normalized['appoinment_date']) {
              try {
                normalized['appoinment_date'] = new Date(
                  normalized['appoinment_date']
                ).toLocaleString();
              } catch (e) {
                console.warn(
                  'Error formatting appoinment_date:',
                  normalized['appoinment_date']
                );
              }
            }
            return normalized;
          });

          console.log('Processed customers:', this.customers);

          // Apply direct DOM manipulation fix for Angular change detection issues
          setTimeout(() => {
            this.applyDirectDOMUpdate();
          }, 100);
        },
        error: (err) => {
          console.error('Failed to load customer followup data', err);
          // Fallback to sample data for development
          this.customers = this.getSampleData();

          // Apply direct DOM manipulation fix even for sample data
          setTimeout(() => {
            this.applyDirectDOMUpdate();
          }, 100);
        },
      });
  }

  private applyDirectDOMUpdate(): void {
    // Multiple change detection attempts
    this.cdr.detectChanges();

    setTimeout(() => {
      this.cdr.detectChanges();

      this.ngZone.run(() => {
        this.cdr.detectChanges();

        // Force DOM update by directly manipulating the table
        setTimeout(() => {
          this.updateTableDirectly();
        }, 50);
      });
    }, 50);
  }

  private updateTableDirectly(): void {
    const tableBody = document.querySelector(
      '.customer-followup-component tbody'
    );
    if (!tableBody) {
      console.warn('Table body not found for direct DOM update');
      return;
    }

    // Clear existing content
    tableBody.innerHTML = '';

    // Generate table rows directly
    this.customers.forEach((customer, index) => {
      const row = document.createElement('tr');

      // Add visible columns
      this.fields
        .filter((field) => field.visible)
        .forEach((field) => {
          const cell = document.createElement('td');
          cell.textContent = customer[field.key] || '';
          row.appendChild(cell);
        });

      // Add followup button column
      const actionCell = document.createElement('td');
      const followupBtn = document.createElement('button');
      followupBtn.className = 'followup-btn';
      followupBtn.innerHTML = '📞 Followup';
      followupBtn.onclick = () => this.followupCustomer(customer);
      actionCell.appendChild(followupBtn);
      row.appendChild(actionCell);

      tableBody.appendChild(row);
    });

    console.log(
      'Direct DOM update applied - table rows:',
      this.customers.length
    );
  }

  private loadSampleData(): Record<string, any>[] {
    return [
      {
        svcid: 999,
        name: 'Sample Customer',
        mobileno: '9876543210',
        location: 'Sample Location',
        novisit: '2',
        lastvisit: new Date().toLocaleString(),
        svtid: 999,
        remarks: 'Sample remarks for testing',
      },
    ];
  }

  private getSampleData(): Record<string, any>[] {
    return this.loadSampleData();
  }

  get visibleColumns(): string[] {
    return this.fields.filter((f) => f.visible).map((f) => f.key);
  }

  openDialog(): void {
    this.showDialog = true;
  }

  closeDialog(): void {
    this.showDialog = false;
  }

  followupCustomer(customer: Record<string, any>): void {
    console.log('Opening followup popup for customer:', customer);

    // Set selected customer and initialize form
    this.selectedCustomer = customer;
    this.resetFollowupForm();

    // Open the popup
    this.showFollowupPopup = true;

    // Apply direct DOM manipulation to force popup display
    setTimeout(() => {
      this.forcePopupDisplay();
    }, 50);

    // Load previous history
    this.loadPreviousHistory(customer['svcid'] || customer['id']);
  }

  private resetFollowupForm(): void {
    // Initialize form with current date/time for dateofvisit
    const now = new Date();
    const currentDateTime = now.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:mm

    this.followupForm = {
      dateofvisit: currentDateTime,
      nextvisit: '',
      remarks: '',
    };
  }

  private loadPreviousHistory(custId: any): void {
    if (!custId) {
      console.warn('Customer ID not found for loading history');
      this.previousHistory = [];
      return;
    }

    this.loadingHistory = true;
    this.previousHistory = [];

    // Trigger detection to show spinner
    this.cdr.detectChanges();

    console.log('Loading previous history for customer ID:', custId);

    this.http
      .get<any>(`${environment.apiUrl}/getsvcustlist/${custId}`)
      .subscribe({
        next: (response) => {
          console.log('Previous history API response:', response);
          try {
            // Handle different response formats
            let data = response;
            if (
              response &&
              typeof response === 'object' &&
              !Array.isArray(response)
            ) {
              if (response.data) {
                data = response.data;
              } else if (response.result) {
                data = response.result;
              } else if (response.history) {
                data = response.history;
              }
            }

            // Ensure data is an array
            if (!Array.isArray(data)) {
              console.warn('History API response is not an array:', data);
              data = [];
            }

            this.previousHistory = data.map((obj: any) => {
              const normalized: Record<string, any> = {};
              Object.keys(obj || {}).forEach((k) => {
                normalized[k.toLowerCase()] = obj[k];
              });

              // Format dates for display
              if (normalized['dateofvisit']) {
                try {
                  normalized['dateofvisit'] = new Date(
                    normalized['dateofvisit']
                  ).toLocaleString();
                } catch (e) {
                  console.warn(
                    'Error formatting dateofvisit:',
                    normalized['dateofvisit']
                  );
                }
              }
              if (normalized['nextvisit']) {
                try {
                  normalized['nextvisit'] = new Date(
                    normalized['nextvisit']
                  ).toLocaleString();
                } catch (e) {
                  console.warn(
                    'Error formatting nextvisit:',
                    normalized['nextvisit']
                  );
                }
              }

              return normalized;
            });

            console.log('Processed previous history:', this.previousHistory);
          } catch (error) {
            console.error('Error processing history data:', error);
            this.previousHistory = [];
          } finally {
            this.loadingHistory = false;
            this.cdr.detectChanges();
          }
        },
        error: (err) => {
          console.error('Failed to load previous history', err);
          this.loadingHistory = false;
          // Show sample data if API fails to ensure user sees something
          this.previousHistory = this.getSampleHistoryData();
          this.cdr.detectChanges();
        },
      });
  }

  private getSampleHistoryData(): any[] {
    return [
      {
        id: 1,
        dateofvisit: new Date('2025-01-15').toLocaleString(),
        nextvisit: new Date('2025-01-25').toLocaleString(),
        remarks: 'Initial visit - discussed loan requirements',
        visitby: 'John Employee',
      },
      {
        id: 2,
        dateofvisit: new Date('2025-01-25').toLocaleString(),
        nextvisit: new Date('2025-02-05').toLocaleString(),
        remarks: 'Follow-up visit - provided documentation',
        visitby: 'John Employee',
      },
    ];
  }

  private forcePopupDisplay(): void {
    // Multiple change detection attempts for popup display
    this.cdr.detectChanges();

    setTimeout(() => {
      this.cdr.detectChanges();

      this.ngZone.run(() => {
        this.cdr.detectChanges();

        // Direct DOM manipulation to force popup visibility
        setTimeout(() => {
          const popup = document.querySelector(
            '.followup-dialog'
          ) as HTMLElement;
          const backdrop = document.querySelector(
            '.dialog-backdrop'
          ) as HTMLElement;

          if (backdrop && popup) {
            backdrop.style.display = 'flex';
            backdrop.style.visibility = 'visible';
            backdrop.style.opacity = '1';
            popup.style.display = 'block';
            popup.style.visibility = 'visible';
            console.log('Popup forced to display via DOM manipulation');
          } else {
            console.warn('Popup elements not found for DOM manipulation');
          }
        }, 20);
      });
    }, 20);
  }

  closeFollowupPopup(): void {
    this.showFollowupPopup = false;
    this.selectedCustomer = {};
    this.previousHistory = [];
  }

  saveFollowupDetails(): void {
    // Validate form data
    if (!this.followupForm.dateofvisit) {
      alert('Please select a date of visit.');
      return;
    }

    if (!this.followupForm.remarks.trim()) {
      alert('Please enter remarks for the visit.');
      return;
    }

    const custId =
      this.selectedCustomer['svcid'] || this.selectedCustomer['id'];
    if (!custId) {
      alert('Customer ID not found. Cannot save visit details.');
      return;
    }

    // Prepare data for API call
    const saveData = {
      custid: custId,
      dateofvisit: this.followupForm.dateofvisit,
      nextvisit: this.followupForm.nextvisit || null,
      remarks: this.followupForm.remarks.trim(),
      record_type: this.selectedCustomer['record_type'] || 'customer',
      createdby: localStorage.getItem('usernameID'), // Send createdby to fix 500 error
    };

    console.log('Saving followup details:', saveData);

    // Call the save API
    this.http
      .post(`${environment.apiUrl}/savesalesvisittrack`, saveData)
      .subscribe({
        next: (response) => {
          console.log('Save response:', response);
          alert('Visit details saved successfully!');

          // Close the popup after successful save
          this.closeFollowupPopup();

          // Refresh the main customer list to reflect any updates
          this.loadCustomers();
        },
        error: (err) => {
          console.error('Failed to save visit details:', err);
          alert('Failed to save visit details. Please try again.');
        },
      });
  }

  convertToContact(): void {
    // Validate that a customer is selected
    if (!this.selectedCustomer || !this.selectedCustomer['name']) {
      alert('No customer selected for conversion.');
      return;
    }

    this.convertingToContact = true;

    // Prepare lead data according to the specified mapping
    const leadData = {
      // CSV data mapping
      firstname: this.selectedCustomer['name'] || '',
      lastname: null,
      mobilenumber: this.selectedCustomer['mobileno'] || '',
      email: null,
      presentaddress: this.selectedCustomer['location'] || '',

      // Fixed values as specified
      locationid: 5001,
      status: 1,
      organizationid: 1001,
      createdon: new Date().toISOString(),
      createdby: localStorage.getItem('usernameID') || '',
      contacttype: 'Sales Contact',
    };

    console.log('Converting customer to contact:', leadData);

    // Call the leadpersonal API to save the contact
    this.http.post(`${environment.apiUrl}/leadpersonal`, leadData).subscribe({
      next: (response) => {
        console.log('Convert to contact response:', response);

        // After successful contact creation, update the customer record
        const customerId =
          this.selectedCustomer['svcid'] || this.selectedCustomer['id'];
        if (customerId) {
          this.updateCustomerRecord(customerId);
        } else {
          // If no customer ID found, still show success and close popup
          this.convertingToContact = false;
          alert(
            `Customer "${this.selectedCustomer['name']}" has been successfully converted to a contact!`
          );
          this.closeFollowupPopup();
        }
      },
      error: (err) => {
        console.error('Failed to convert customer to contact:', err);
        this.convertingToContact = false;
        alert('Failed to convert customer to contact. Please try again.');
      },
    });
  }

  private updateCustomerRecord(customerId: string): void {
    console.log('Updating customer record with ID:', customerId);

    // Prepare update data - you can customize what fields to update
    const updateData = {
      // Add any fields you want to update in the customer record
      // For example, you might want to mark the customer as converted
      lastmodified: new Date().toISOString(),
      modifiedby: localStorage.getItem('usernameID') || '',
      // Add other fields as needed
    };

    // Call the update customer API
    this.http
      .put(`${environment.apiUrl}/updatesvcustomer/${customerId}`, updateData)
      .subscribe({
        next: (response) => {
          console.log('Customer record updated successfully:', response);

          // Force UI update with multiple change detection cycles
          this.ngZone.run(() => {
            this.convertingToContact = false;
            this.cdr.detectChanges();

            setTimeout(() => {
              this.cdr.detectChanges();
              alert(
                `Customer "${this.selectedCustomer['name']}" has been successfully converted to a contact!`
              );

              // Close the popup after successful conversion and update
              this.closeFollowupPopup();
            }, 100);
          });
        },
        error: (err) => {
          console.error('Failed to update customer record:', err);

          // Force UI update for error case too
          this.ngZone.run(() => {
            this.convertingToContact = false;
            this.cdr.detectChanges();

            setTimeout(() => {
              this.cdr.detectChanges();
              alert(
                `Customer "${this.selectedCustomer['name']}" has been converted to a contact, but failed to update customer record.`
              );
              this.closeFollowupPopup();
            }, 100);
          });
        },
      });
  }

  toggleColumn(field: FieldMeta): void {
    field.visible = !field.visible;
  }

  trackByFunc(index: number, item: any): string {
    return item.id || item.svcid || index.toString();
  }

  getLabel(key: string): string {
    const field = this.fields.find((f) => f.key === key);
    return field ? field.label : key;
  }
}
