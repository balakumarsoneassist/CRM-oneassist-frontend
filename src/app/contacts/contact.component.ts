import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { WhatsAppService } from '../services/whatsapp.service';


interface LocationMaster { id: number; location: string; state: string; }

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css']
})


export class ContactComponent implements OnInit {
  @Input() editMode: boolean = false;
  @Input() leadId: string | null = null;
  @Output() contactSaved = new EventEmitter<void>();
  @Output() closeModal = new EventEmitter<void>();

  form!: FormGroup;
  locations: LocationMaster[] = [];
  saving = false;
  verifying = false;
  verificationSent = false;
  isWhatsAppVerified = false;
  isNotOnWhatsApp = false;
  private statusPollingInterval: any;

  constructor(private fb: FormBuilder, private http: HttpClient, private whatsappService: WhatsAppService, private cdr: ChangeDetectorRef) {

    this.form = this.fb.group({
      firstname: ['', Validators.required],
      lastname: [''],
      mobilenumber: ['', Validators.pattern('^[0-9]{10,15}$')],
      locationid: [null, Validators.required],
      email: ['', [Validators.email]],
      dateofbirth: [''],
      pannumber: [''],
      aadharnumber: [''],
      presentaddress: [''],
      pincode: [''],
      permanentaddress: [''],
      gender: [''],
      materialstatus: [''],
      noofdependent: [null],
      educationalqualification: [''],
      referencename: [''],
      productname: [''],
      status: ['1'],
      organizationid: [''],
      createdby: [''],
      createdon: [''],
      remarks: [''],
      contacttype: [''],
    });

    // Auto-fill hidden auditing fields
    this.form.patchValue({
      createdby: this.getUsername(),
      organizationid: this.getOrganizationID(),
      createdon: new Date().toISOString(),
      contacttype: 'Normal Contact',
    });
  }

  ngOnInit(): void {
    // load locations list for dropdown
    this.http.get<LocationMaster[]>(`${environment.apiUrl}/locationmaster`).subscribe({
      next: (data) => (this.locations = data),
      error: (err) => console.error('Failed to load locations', err),
    });

    // If in edit mode, load existing contact data
    if (this.editMode && this.leadId) {
      this.loadContactData();
    }
  }

  ngOnDestroy(): void {
    this.stopStatusPolling();
  }

  loadContactData(): void {
    if (!this.leadId) return;

    this.http.get<any>(`${environment.apiUrl}/leadpersonal/${this.leadId}`).subscribe({
      next: (response) => {
        console.log('Loading contact data for edit:', response);

        let data = response;
        // Robust unwrapping similar to followup details
        if (Array.isArray(response) && response.length > 0) {
          data = response[0];
        } else if (response && response.data) {
          data = response.data;
        }

        // Patch the form with existing data
        this.form.patchValue(data);
        this.checkVerificationStatus(data);
        this.refreshStatus(true); // Sync with global status table
      },
      error: (err) => {
        console.error('Failed to load contact data', err);
        // alert('Failed to load contact data for editing.');
      }
    });
  }

  submit(): void {
    if (this.form.invalid) {
      //this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    const apiUrl = this.editMode && this.leadId
      ? `${environment.apiUrl}/leadpersonal/${this.leadId}`
      : `${environment.apiUrl}/leadpersonal`;

    const httpMethod = this.editMode ? this.http.put(apiUrl, this.form.value) : this.http.post(apiUrl, this.form.value);

    httpMethod.subscribe({
      next: () => {
        this.saving = false;
        const message = this.editMode ? 'Contact Updated Successfully.' : 'Contact Added Successfully.';
        alert(message);

        // Emit event to notify parent component
        this.contactSaved.emit();

        if (!this.editMode) {
          this.form.reset();
        } else {
          // Close modal in edit mode
          this.closeModal.emit();
        }
      },
      error: (err) => {
        this.saving = false;
        console.error('Failed to save contact', err);

        let detailMessage = '';
        if (err.error && err.error.details) {
          detailMessage = `\n\nDetail: ${err.error.details}`;
        }

        const message = this.editMode
          ? `Failed to update contact. ${detailMessage || 'Please try again.'}`
          : `Failed to add contact. ${detailMessage || 'Please try again.'}`;

        alert(message);
      },
    });
  }

  cancel(): void {
    if (this.editMode) {
      this.closeModal.emit();
    } else {
      // For non-edit mode, you might want to navigate back or reset form
      this.form.reset();
    }
  }

  getUsername(): string {
    return localStorage.getItem('username') || '';
  }




  getOrganizationID(): string {
    return localStorage.getItem('organizationid') || '';
  }

  verifyWhatsApp(): void {
    const mobile = this.form.get('mobilenumber')?.value;
    if (!mobile) {
      alert('Please enter a mobile number first');
      return;
    }

    // Guard: Prevent sending if already verifying or verification is sent
    if (this.verifying) return;
    if (this.verificationSent) {
      this.refreshStatus();
      return;
    }

    this.verifying = true;
    this.whatsappService.sendVerification(mobile).subscribe({
      next: (res) => {
        this.verifying = false;
        this.verificationSent = true;

        this.startStatusPolling();
      },
      error: (err) => {
        this.verifying = false;
        console.error('WhatsApp Verification Error:', err);
        alert('Failed to send verification. Please check backend logs.');
      }
    });
  }

  startStatusPolling(): void {
    this.stopStatusPolling();
    console.log('🚀 Starting Contact WhatsApp status polling...');
    this.statusPollingInterval = setInterval(() => {
      this.refreshStatus(true);
    }, 5000);
    setTimeout(() => this.refreshStatus(true), 3000);
  }

  stopStatusPolling(): void {
    if (this.statusPollingInterval) {
      console.log('🛑 Stopping Contact WhatsApp status polling.');
      clearInterval(this.statusPollingInterval);
      this.statusPollingInterval = null;
    }
  }

  noop(): void { }

  checkVerificationStatus(data: any): void {
    const remarks = data?.remarks || '';
    const waStatus = data?.whatsapp_status || '';

    if (remarks.includes('[WhatsApp Verified]') || waStatus === 'Verified') {
      this.isWhatsAppVerified = true;
      this.isNotOnWhatsApp = false;
      this.verificationSent = false;
    } else if (remarks.includes('[Not on WhatsApp]') || waStatus === 'Not on WhatsApp') {
      this.isWhatsAppVerified = false;
      this.isNotOnWhatsApp = true;
      this.verificationSent = false;
    } else if (remarks.includes('[WhatsApp Requested]') || waStatus === 'Requested') {
      this.isWhatsAppVerified = false;
      this.isNotOnWhatsApp = false;
      this.verificationSent = true;
    } else {
      // Default state for any other status or no status
      this.isWhatsAppVerified = false;
      this.isNotOnWhatsApp = false;
      this.verificationSent = false;
    }
    this.toggleFormState();
    this.cdr.detectChanges();
  }

  toggleFormState(): void {
    if (this.isWhatsAppVerified) {
      this.form.enable();
    } else {
      this.form.disable();
      // ALWAYS keep mobilenumber enabled so verification can be triggered
      this.form.get('mobilenumber')?.enable();
    }
  }

  refreshStatus(silent: boolean = false): void {
    const mobile = this.form.get('mobilenumber')?.value;
    if (!mobile) return;

    if (!silent) {
      this.verifying = true;
      this.cdr.detectChanges();
    }

    console.log(`🔄 Contact ${silent ? 'Auto' : 'Direct'} Refresh. Mobile:`, mobile);
    const checkUrl = `${environment.apiUrl}/api/whatsapp/status/${mobile}`;

    this.http.get<any>(checkUrl).subscribe({
      next: (response) => {
        if (!silent) this.verifying = false;
        const statusData = response.data;
        if (statusData) {
          if (statusData.status === 'Verified') {
            this.isWhatsAppVerified = true;
            this.isNotOnWhatsApp = false;
            this.verificationSent = false;
            this.stopStatusPolling();
          } else if (statusData.status === 'Not on WhatsApp') {
            this.isWhatsAppVerified = false;
            this.isNotOnWhatsApp = true;
            this.verificationSent = false;
            this.stopStatusPolling();
          } else if (statusData.status === 'Requested' || statusData.status === 'Pending') {
            this.isWhatsAppVerified = false;
            this.isNotOnWhatsApp = false;
            this.verificationSent = true;
          } else {
            this.verificationSent = false;
            this.stopStatusPolling();
          }
        } else {
          this.verificationSent = false;
          this.stopStatusPolling();
        }
        this.toggleFormState();
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (!silent) {
          this.verifying = false;
          console.error('Failed to refresh status', err);
          this.cdr.detectChanges();
        }
      }
    });
  }
}
