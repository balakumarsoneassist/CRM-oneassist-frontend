import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { TrackNumberService } from '../services/track-number.service';
import { Subscription } from 'rxjs';
import { StatusCodeDataModel, StatusCode } from '../models/statuscode';
import { ContactComponent } from './contact.component';

@Component({
  selector: 'app-contactfollowupdetails',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ContactComponent],
  templateUrl: './contactfollowupdetails.component.html',
  styleUrls: ['./contactfollowupdetails.component.css']
})
export class ContactFollowupDetailsComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  saving = false;
  currentTrackNumber: string | null = null;
  private trackNumberSubscription?: Subscription;
  model: any = {}; // Model to store the loaded lead track details
  StatusCode: StatusCode[] = []; // Array to hold status options
  originalData: any = {}; // Store original data to compare changes

  // Lead personal details for display at top
  leadPersonalDetails: any = {};
  isLoadingLeadPersonal = false;
  verifying = false;
  verificationSent = false;
  isWhatsAppVerified = false;
  isNotOnWhatsApp = false;

  // Contact edit modal
  showContactEditModal = false;

  // Convert to customer functionality
  convertingToCustomer = false;

  @Input() leadId: number | null = null;
  @Input() isEmployee: boolean = false;
  @Output() closePopup = new EventEmitter<void>(); // Event to notify parent to close popup
  @Output() dataSaved = new EventEmitter<void>();

  // Loan types list for dropdown (alphabetically sorted)
  loanTypes: string[] = [
    'Auto Loan-New',
    'Auto Loan-Used',
    'Business Loan',
    'Commercial Vehicle Loan-New',
    'Home Loan Bank Transfer',
    'Home Loan Bank Transfer + Top-up',
    'Home Loan-Builder Purchase',
    'Home Loan-Resale',
    'Home Loan-Self Construction',
    'Jewel Loan',
    'LAP',
    'LAP Bank Transfer',
    'LAP Bank Transfer + Top-up',
    'Land Loan',
    'Land Loan + Construction',
    'NRP',
    'Personal Loan',
    'Personal Loan Bank Transfer',
    'Personal Loan Bank Transfer + Top-up'
  ];

  // income type options for dropdown
  incomeTypes: string[] = ['Bank', 'Cash', 'Cheque'];

  // Occupation types for dropdown
  occupationTypes: string[] = ['Salaried', 'Self Employed'];

  // Company category options
  compCategories: string[] = ['A', 'B', 'C', 'D'];

  // Customer segment options
  custSegments: string[] = ['Open', 'Royal', 'Premium', 'Gold'];

  // Data strength options
  dataStrengthOptions: string[] = ['Useful > 60%', 'Hold 20% - 60%', 'Remove'];

  // Bank names for Preferred Bank dropdown (populated from /bankmaster)
  bankNames: string[] = [];

  // Personal Details Modal Properties
  showPersonalDetailsModal = false;
  personalDetailsForm!: FormGroup;
  personalDetailsData: any = {};
  isLoadingPersonalDetails = false;
  isSavingPersonalDetails = false;

  // Occupational Details Modal Properties
  showOccupationalDetailsModal = false;
  occupationalDetailsForm!: FormGroup;
  occupationalDetailsData: any = {};
  isLoadingOccupationalDetails = false;
  isSavingOccupationalDetails = false;

  // Bank Details Modal Properties
  showBankDetailsModal = false;
  bankDetailsData: any[] = [];
  isLoadingBankDetails = false;
  isSavingBankDetails = false;

  // Loan History Modal Properties
  showLoanHistoryModal = false;
  loanHistoryData: any[] = [];
  isLoadingLoanHistory = false;
  isSavingLoanHistory = false;

  private statusPollingInterval: any;

  constructor(private fb: FormBuilder, private http: HttpClient, private trackNumberService: TrackNumberService, private cdr: ChangeDetectorRef, private ngZone: NgZone) { }

  ngOnInit(): void {
    this.loadBanks();

    // Subscribe to track number changes
    this.trackNumberSubscription = this.trackNumberService.trackNumber$.subscribe(trackNumber => {
      console.log('Received trackNumber in subscription:', trackNumber);
      this.currentTrackNumber = trackNumber;

      if (trackNumber) {
        // Split trackNumber by "***" - first part is tracknumber, second part is leadid
        const parts = trackNumber.split('***');
        const actualTrackNumber = parts[0];
        const leadId = parts[1];

        console.log('Split trackNumber:', actualTrackNumber, 'leadId:', leadId);
        console.log('Parts array:', parts);

        // Store the leadId in model for later use
        if (leadId) {
          this.model.leadid = leadId;
          console.log('Calling loadLeadPersonalDetailsForDisplay with leadId:', leadId);
          // Load lead personal details for display at top
          this.loadLeadPersonalDetailsForDisplay(leadId);
        } else {
          console.log('No leadId found in trackNumber, parts:', parts);
        }

        this.loadLeadTrackDetails(actualTrackNumber);
      } else {
        console.log('No trackNumber received, checking for existing data...');
        // Check if we have existing leadId in model (after login scenario)
        this.checkForExistingLeadData();
      }
    });

    // Additional fallback checks for post-login scenarios
    setTimeout(() => {
      console.log('Timeout fallback check - model.leadid:', this.model?.leadid, 'hasPersonalDetails:', this.hasPersonalDetails());
      if (this.model && this.model.leadid && !this.hasPersonalDetails()) {
        console.log('Fallback: Loading personal details with existing leadid:', this.model.leadid);
        this.loadLeadPersonalDetailsForDisplay(this.model.leadid);
      }
    }, 1000);

    // Extended fallback for slower network/login scenarios
    setTimeout(() => {
      console.log('Extended fallback check - currentTrackNumber:', this.currentTrackNumber);
      if (!this.currentTrackNumber) {
        // Try to get current value from service directly
        const currentTrackNumber = this.trackNumberService.getCurrentTrackNumber();
        console.log('Direct service call result:', currentTrackNumber);
        if (currentTrackNumber) {
          this.currentTrackNumber = currentTrackNumber;
          // Process the track number
          const parts = currentTrackNumber.split('***');
          const leadId = parts[1];
          if (leadId && !this.hasPersonalDetails()) {
            this.model.leadid = leadId;
            this.loadLeadPersonalDetailsForDisplay(leadId);
          }
        }
      }
    }, 2000);

    this.form = this.fb.group({
      // Follow Up
      appoinmentdate: ['', Validators.required], // Expect ISO string from datetime-local input
      status: [null, Validators.required],
      notes: [''],
      isdirectmeet: [false],

      // Basic Details
      occupationtype: [''],
      loantype: [''],
      desireloanamount: [null],
      tenure: [null],
      preferedbank: [''],
      cibilscore: [null],
      incometype: [''],
      incomeamount: [null],
      datastrength: [''],
      compname: [''],
      compcat: [''],
      custsegment: [''],

      // Document Details (status >= 12)
      isidproof: [false],
      isageproof: [false],
      isaddessproof: [false],
      iscreditcardstatement: [false],
      isexistingloantrack: [false],
      iscurrentaccountstatement: [false],
      isstabilityproof: [false],
      isbankstatement: [false],
      ispayslip: [false],

      // File Login Details (status >= 13)
      bankname: [''],
      applicationnumber: [''],
      logindate: [''],
      loginvalue: [null],

      // Sanction Details (status >= 15)
      sanctionroi: [null],
      sanctiontenure: [null],
      sanctionvalue: [null],
      sanctiondate: [''],

      // Disbursement Details (status >= 17)
      disbursementamount: [null],
      islegal: [false],
      istechnical: [false]
    });

    // Initialize Personal Details Form
    this.personalDetailsForm = this.fb.group({
      firstname: ['', Validators.required],
      lastname: ['', Validators.required],
      mobilenumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      email: ['', [Validators.required, Validators.email]],
      pannumber: [''],
      aadharnumber: ['', Validators.pattern(/^[0-9]{12}$/)],
      presentaddress: [''],
      pincode: ['', Validators.pattern(/^[0-9]{6}$/)],
      remarks: ['']
    });

    // Initialize Occupational Details Form
    this.occupationalDetailsForm = this.fb.group({
      leadpersonal: [{ value: '', disabled: true }], // Auto-populated, read-only
      occupation: ['', Validators.required],
      incometype: ['', Validators.required],
      companyname: ['', Validators.required],
      companyaddress: [''],
      designation: [''],
      joiningdate: [''],
      officetelephonenumber: ['', Validators.pattern(/^[0-9]{10,15}$/)],
      companygstinnumber: ['', Validators.pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)],
      incomeamount: ['', [Validators.required, Validators.min(0)]]
    });

    // Expose component instance to DOM for raw HTML callbacks in forceContactInfoDisplay
    (this as any).component = this;
    const el = document.querySelector('app-contactfollowupdetails') as any;
    if (el) el.component = this;
  }

  ngOnDestroy(): void {
    // Unsubscribe and clear polling to prevent memory leaks
    if (this.trackNumberSubscription) {
      this.trackNumberSubscription.unsubscribe();
    }
    this.stopStatusPolling();
  }


  SetStatus(): void {
    // Set status options based on the model's Status value
    console.log('Model Status:', this.model.status);
    if ((this.model.status < 4) || (this.model.status == 22)) {
      this.StatusCode = StatusCodeDataModel.ContactStatusDataModel;
    }
    else if (this.model.status == 4) {
      this.StatusCode = StatusCodeDataModel.ApproveStatusDataModel;
    }
    else if (this.model.status == 11) {
      this.model.status = 12;
      this.StatusCode = StatusCodeDataModel.DocumentCollectStatusDataModel;
    }
    else if (this.model.status == 12) {
      this.StatusCode = StatusCodeDataModel.DocumentCollectStatusDataModel;
    }
    else if (this.model.status == 13) {
      this.StatusCode = StatusCodeDataModel.FileLoginDataModel;
    }
    else if (this.model.status == 14) {
      this.StatusCode = StatusCodeDataModel.FileLoginDataModel;
    }
    else if (this.model.status == 15) {
      this.StatusCode = StatusCodeDataModel.SanctionDataModel;
    }
    else if (this.model.status == 16) {
      this.StatusCode = StatusCodeDataModel.SanctionDataModel;

    }
    else if (this.model.status == 17) {
      this.StatusCode = StatusCodeDataModel.NewDisbursementDataModel;
    }
    else {
      // You can add additional logic here for other status ranges
      // For now, default to ContactStatusDataModel
      this.StatusCode = StatusCodeDataModel.ContactStatusDataModel;
    }

    console.log('Status options set:', this.StatusCode);
    console.log('Model Status:', this.model.status);
  }

  loadLeadTrackDetails(trackNumber: string): void {
    // Load existing lead details based on track number
    this.http.get<any>(`${environment.apiUrl}/getleadtrackdetails/${trackNumber}`).subscribe({
      next: (data) => {
        if (data) {
          // Store the model data
          this.model = data;

          // Truncate appointmentdate to desired format (remove milliseconds/timezone)
          if (this.model.appoinmentdate) {
            const originalDate = new Date(this.model.appoinmentdate);
            // Offset the date to match local time for toISOString() to produce a local-like string
            const tzOffset = originalDate.getTimezoneOffset() * 60000;
            this.model.appoinmentdate = new Date(originalDate.getTime() - tzOffset).toISOString().slice(0, 19);
          }

          console.log('Model-pv:', this.model);
          console.log('Lead ID from model:', this.model.leadid);
          // Calculate requested docs summary for visibility
          const docs = [];
          if (data.isidproof) docs.push('Aadhar');
          if (data.isageproof) docs.push('PAN');
          if (data.isaddessproof) docs.push('Address Proof');
          if (data.isbankstatement) docs.push('Bank Passbook');
          if (data.ispayslip) docs.push('Payslip');
          this.model.requestedDocs = docs.join(', ');

          this.originalData = {
            status: data.status,
            appoinmentdate: data.appoinmentdate
          };

          // Set status options based on the loaded model
          this.SetStatus();

          // Populate form with existing data
          this.form.patchValue(data);
        }
      },
      error: (err) => {
        console.warn('No existing lead details found for track number:', trackNumber, err);
        // This is not necessarily an error - could be a new lead
        // Set default status options for new leads
        this.model = { status: 0 }; // Default status
        this.originalData = { status: null, appoinmentdate: null };
        this.SetStatus();
      }
    });
  }

  submit(): void {
    // Validate only status and appoinmentdate are required
    const status = this.form.get('status')?.value;
    const appoinmentdate = this.form.get('appoinmentdate')?.value;

    if (!status) {
      alert('Please select a status.');
      return;
    }

    // If status is 12, validate that at least 3 document fields are selected
    if (status == 12) {
      const documentFields = [
        'isidproof', 'isageproof', 'isaddessproof', 'iscreditcardstatement',
        'isexistingloantrack', 'iscurrentaccountstatement', 'isstabilityproof',
        'isbankstatement', 'ispayslip'
      ];

      // Debug: Check form values
      console.log('Checking document fields validation...');
      const selectedDocuments = documentFields.filter(field => {
        const value = this.form.get(field)?.value;
        console.log(`Field ${field}: ${value}`);
        return value === true;
      });

      console.log('Selected documents:', selectedDocuments);
      console.log('Selected count:', selectedDocuments.length);

      if (selectedDocuments.length < 3) {
        alert('Please select at least 3 document details fields.');
        return;
      }
    }

    // If status is 13, validate that File Login Details fields have values
    if (status == 13) {
      const bankname = this.form.get('bankname')?.value;
      const applicationnumber = this.form.get('applicationnumber')?.value;
      const logindate = this.form.get('logindate')?.value;
      const loginvalue = this.form.get('loginvalue')?.value;

      if (!bankname) {
        alert('Please select a bank name when status is 13.');
        return;
      }

      if (!applicationnumber) {
        alert('Please enter an application number when status is 13.');
        return;
      }

      if (!logindate) {
        alert('Please select a login date when status is 13.');
        return;
      }

      if (!loginvalue || loginvalue <= 0) {
        alert('Please enter a valid login value when status is 13.');
        return;
      }
    }

    // If status is 15, validate that Sanction Details fields have values
    if (status == 15) {
      const sanctionroi = this.form.get('sanctionroi')?.value;
      const sanctiontenure = this.form.get('sanctiontenure')?.value;
      const sanctionvalue = this.form.get('sanctionvalue')?.value;
      const sanctiondate = this.form.get('sanctiondate')?.value;

      if (!sanctionroi || sanctionroi <= 0) {
        alert('Please enter a valid sanction ROI when status is 15.');
        return;
      }

      if (!sanctiontenure || sanctiontenure <= 0) {
        alert('Please enter a valid sanction tenure when status is 15.');
        return;
      }

      if (!sanctionvalue || sanctionvalue <= 0) {
        alert('Please enter a valid sanction value when status is 15.');
        return;
      }

      if (!sanctiondate) {
        alert('Please select a sanction date when status is 15.');
        return;
      }
    }

    // If status is 17, validate that Disbursement Details fields have values
    if (status == 17) {
      const disbursementamount = this.form.get('disbursementamount')?.value;
      const islegal = this.form.get('islegal')?.value;
      const istechnical = this.form.get('istechnical')?.value;

      if (!disbursementamount || disbursementamount <= 0) {
        alert('Please enter a valid disbursement amount when status is 17.');
        return;
      }

      if (!islegal && !istechnical) {
        alert('Please select at least one option (Legal or Technical) when status is 17.');
        return;
      }
    }

    if (!appoinmentdate) {
      alert('Please select an appointment date.');
      return;
    }

    // Check if status or appoinmentdate has changed
    const hasStatusChanged = status !== this.originalData.status;
    const hasappoinmentdateChanged = appoinmentdate !== this.originalData.appoinmentdate;

    if (!hasStatusChanged && !hasappoinmentdateChanged) {
      alert('No changes detected in status or appointment date.');
      return;
    }

    console.log('Status changed:', hasStatusChanged, 'from', this.originalData.status, 'to', status);
    console.log('Appointment date changed:', hasappoinmentdateChanged, 'from', this.originalData.appoinmentdate, 'to', appoinmentdate);

    this.saving = true;

    // Prepare data for lead track details update - include all original data with form updates
    const updateData = {
      ...this.model, // Include all data from getleadtrackdetails
      // Override with form values
      status: status,
      appoinmentdate: appoinmentdate,
      notes: this.form.get('notes')?.value || '',
      isdirectmeet: this.form.get('isdirectmeet')?.value || false,
      // Include any other form fields that might have been updated
      occupationtype: this.form.get('occupationtype')?.value || '',
      loantype: this.form.get('loantype')?.value || '',
      desireloanamount: this.form.get('desireloanamount')?.value || null,
      tenure: this.form.get('tenure')?.value || null,
      preferedbank: this.form.get('preferedbank')?.value || '',
      cibilscore: this.form.get('cibilscore')?.value || null,
      incometype: this.form.get('incometype')?.value || '',
      incomeamount: this.form.get('incomeamount')?.value || null,
      datastrength: this.form.get('datastrength')?.value || '',
      compname: this.form.get('compname')?.value || '',
      compcat: this.form.get('compcat')?.value || '',
      custsegment: this.form.get('custsegment')?.value || '',

      // Document Details (status >= 12)
      isidproof: this.form.get('isidproof')?.value || false,
      isageproof: this.form.get('isageproof')?.value || false,
      isaddessproof: this.form.get('isaddessproof')?.value || false,
      iscreditcardstatement: this.form.get('iscreditcardstatement')?.value || false,
      isexistingloantrack: this.form.get('isexistingloantrack')?.value || false,
      iscurrentaccountstatement: this.form.get('iscurrentaccountstatement')?.value || false,
      isstabilityproof: this.form.get('isstabilityproof')?.value || false,
      isbankstatement: this.form.get('isbankstatement')?.value || false,
      ispayslip: this.form.get('ispayslip')?.value || false,

      // File Login Details (status >= 13)
      bankname: this.form.get('bankname')?.value || '',
      applicationnumber: this.form.get('applicationnumber')?.value || '',
      logindate: this.form.get('logindate')?.value || null,
      loginvalue: this.form.get('loginvalue')?.value || null,

      // Sanction Details (status >= 15)
      sanctionroi: this.form.get('sanctionroi')?.value || null,
      sanctiontenure: this.form.get('sanctiontenure')?.value || null,
      sanctionvalue: this.form.get('sanctionvalue')?.value || null,
      sanctiondate: this.form.get('sanctiondate')?.value || null,

      // Disbursement Details (status >= 17)
      disbursementamount: this.form.get('disbursementamount')?.value || null,
      islegal: this.form.get('islegal')?.value || false,
      istechnical: this.form.get('istechnical')?.value || false
    };

    // Use the current track number for the API call
    if (!this.currentTrackNumber) {
      alert('Unable to identify track number for update.');
      this.saving = false;
      return;
    }

    console.log('Updating lead track details for track number:', this.currentTrackNumber);
    console.log('Update data:', updateData);

    // Split track number to get only the track number part (before ***)
    const actualTrackNumber = this.currentTrackNumber?.includes('***') ? this.currentTrackNumber.split('***')[0] : this.currentTrackNumber;

    this.http.post(`${environment.apiUrl}/saveleadtrackdetails/${actualTrackNumber}`, updateData).subscribe({
      next: () => {
        alert('Lead track details updated successfully.');

        // Update original data to reflect the new saved state
        this.originalData = {
          status: status,
          appoinmentdate: appoinmentdate
        };

        this.saving = false;

        // Emit data saved event first, then close popup
        this.dataSaved.emit();

        // Close the popup after successful save
        setTimeout(() => {
          this.closePopup.emit();
        }, 1000); // Small delay to let user see the success message
      },
      error: (err) => {
        console.error('Failed to update lead track details', err);
        alert('Failed to update lead track details. Please try again.');
        this.saving = false;
      }
    });
  }

  private loadBanks(): void {
    this.http.get<any>(`${environment.apiUrl}/bankmaster`).subscribe({
      next: raw => {
        const arr = Array.isArray(raw) ? raw : Object.values(raw ?? {});
        this.bankNames = arr.map((b: any) => b.bankname ?? b.name ?? b);
      },
      error: err => console.error('Failed to load bank names', err)
    });
  }

  loadLeadPersonalDetailsForDisplay(leadId: string): void {
    this.isLoadingLeadPersonal = true;
    console.log('Loading lead personal details for leadId:', leadId);
    console.log('API URL:', `${environment.apiUrl}/leadpersonal/${leadId}`);

    this.http.get<any>(`${environment.apiUrl}/leadpersonaldetails/${leadId}`).subscribe({
      next: (response) => {
        this.isLoadingLeadPersonal = false;
        let data = null;
        if (Array.isArray(response) && response.length > 0) {
          data = response[0];
        } else if (response && response.data) {
          data = Array.isArray(response.data) ? response.data[0] : response.data;
        } else if (response && response.id) {
          data = response;
        }

        if (data) {
          this.leadPersonalDetails = data;
          this.checkVerificationStatus(this.leadPersonalDetails);
          this.refreshStatus(true); // Sync with global status table
        }
      },
      error: (err) => {
        this.isLoadingLeadPersonal = false;
        console.error('❌ Failed to load lead personal details:', err);
      }
    });
  }


  noop(): void { }

  hasPersonalDetails(): boolean {
    return this.leadPersonalDetails && (
      this.leadPersonalDetails.name ||
      this.leadPersonalDetails.firstname ||
      this.leadPersonalDetails.mobilenumber ||
      this.leadPersonalDetails.id
    );
  }

  checkForExistingLeadData(): void {
    console.log('Checking for existing lead data in model:', this.model);
    // Check if model already has leadid from previous session/navigation
    if (this.model && this.model.leadid && !this.hasPersonalDetails()) {
      console.log('Found existing leadid in model, loading personal details:', this.model.leadid);
      this.loadLeadPersonalDetailsForDisplay(this.model.leadid);
    }
  }

  // Method to manually refresh personal details (for debugging)
  refreshPersonalDetails(): void {
    console.log('Manual refresh triggered');
    const leadId = this.model?.leadid;
    if (leadId) {
      console.log('Refreshing personal details for leadId:', leadId);
      this.loadLeadPersonalDetailsForDisplay(leadId);
    } else {
      console.log('No leadId available for refresh');
      // Try to get from current track number
      const trackNumber = this.trackNumberService.getCurrentTrackNumber();
      if (trackNumber) {
        const parts = trackNumber.split('***');
        const extractedLeadId = parts[1];
        if (extractedLeadId) {
          console.log('Found leadId from trackNumber:', extractedLeadId);
          this.model.leadid = extractedLeadId;
          this.loadLeadPersonalDetailsForDisplay(extractedLeadId);
        }
      }
    }

    // Force re-render of contact info display
    this.cdr.detectChanges();
  }

  // Navigation button click handlers for additional details sections
  onPersonalDetailsClick(): void {
    console.log('Personal Details clicked for track:', this.currentTrackNumber);
    console.log('Lead ID:', this.model.leadid);

    if (!this.model.leadid) {
      alert('Lead ID not found. Please ensure the lead data is loaded properly.');
      return;
    }

    // Open contact edit modal
    this.showContactEditModal = true;
  }

  verifyWhatsApp(): void {
    // Prioritize whatsappnumber, fall back to mobilenumber
    const mobile = this.leadPersonalDetails?.whatsappnumber || this.leadPersonalDetails?.mobilenumber;

    if (!mobile) {
      alert('Number not found for verification.');
      return;
    }

    // Guard: Prevent sending if already verifying or verification is sent
    if (this.verifying) return;
    if (this.verificationSent) {
      this.refreshStatus();
      return;
    }

    if (!confirm(`Send WhatsApp verification message to ${mobile}?`)) return;

    this.verifying = true;
    this.cdr.detectChanges();

    this.http.post(`${environment.apiUrl}/api/whatsapp/send-verification`, { mobilenumber: mobile }).subscribe({
      next: (res: any) => {
        this.verifying = false;
        this.verificationSent = true;
        this.cdr.detectChanges();

        console.log('Verification Result:', res);

        // After sending, start polling for status
        this.startStatusPolling();
      },
      error: (err: any) => {
        this.verifying = false;
        console.error('WhatsApp Verification Error:', err);
        const errMsg = err.error?.details?.error?.message || err.error?.error || err.message || 'Unknown error';
        alert('Failed to send WhatsApp verification: ' + errMsg);
      }
    });
  }

  startStatusPolling(): void {
    // Stop any existing polling
    this.stopStatusPolling();

    console.log('🚀 Starting WhatsApp status polling...');
    // Poll every 5 seconds
    this.statusPollingInterval = setInterval(() => {
      this.refreshStatus(true); // Call refreshStatus in silent mode
    }, 5000);

    // Also do one immediate check after a short delay
    setTimeout(() => this.refreshStatus(true), 3000);
  }

  stopStatusPolling(): void {
    if (this.statusPollingInterval) {
      console.log('🛑 Stopping WhatsApp status polling.');
      clearInterval(this.statusPollingInterval);
      this.statusPollingInterval = null;
    }
  }

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
      this.isWhatsAppVerified = false;
      this.isNotOnWhatsApp = false;
      this.verificationSent = false;
    }

    // Toggle form state based on verification and trigger change detection
    this.toggleFormState();
    this.cdr.detectChanges();
  }

  toggleFormState(): void {
    // Logic REMOVED - Form is always enabled regardless of verification status
    this.form.enable();
    this.personalDetailsForm.enable();
  }

  refreshStatus(silent: boolean = false): void {
    // Prioritize whatsappnumber, fall back to mobilenumber
    const mobile = this.leadPersonalDetails?.whatsappnumber || this.leadPersonalDetails?.mobilenumber;
    if (!mobile) return;

    if (!silent) {
      this.verifying = true;
      this.cdr.detectChanges();
    }

    console.log(`🔄 Followup ${silent ? 'Auto' : 'Direct'} Refresh. Mobile:`, mobile);

    const checkUrl = `${environment.apiUrl}/api/whatsapp/status/${mobile}`;

    this.http.get<any>(checkUrl).subscribe({
      next: (response) => {
        if (!silent) this.verifying = false;
        console.log('📥 Followup Status Response:', response);

        const statusData = response.data;
        if (statusData) {
          if (statusData.status === 'Verified') {
            this.isWhatsAppVerified = true;
            this.isNotOnWhatsApp = false;
            this.verificationSent = false;
            this.toggleFormState();
            this.stopStatusPolling();
          } else if (statusData.status === 'Not on WhatsApp') {
            this.isWhatsAppVerified = false;
            this.isNotOnWhatsApp = true;
            this.verificationSent = false;
            this.toggleFormState();
            this.stopStatusPolling();
          } else if (statusData.status === 'Requested' || statusData.status === 'Pending') {
            this.isWhatsAppVerified = false;
            this.isNotOnWhatsApp = false;
            this.verificationSent = true;
            this.toggleFormState();
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

  onContactSaved(): void {
    console.log('Contact saved, refreshing personal details');
    // Refresh the personal details after contact is saved
    if (this.model.leadid) {
      this.loadLeadPersonalDetailsForDisplay(this.model.leadid);
    }
    this.showContactEditModal = false;
  }

  onContactModalClose(): void {
    this.showContactEditModal = false;
  }

  loadPersonalDetails(leadId: string): void {
    this.isLoadingPersonalDetails = true;
    console.log('📥 loadPersonalDetails called for modal. leadId:', leadId);
    this.http.get<any>(`${environment.apiUrl}/leadpersonaldetails/${leadId}`).subscribe({
      next: (response) => {
        this.isLoadingPersonalDetails = false;
        console.log('📥 loadPersonalDetails Response:', response);

        let data = null;
        if (Array.isArray(response) && response.length > 0) {
          data = response[0];
        } else if (response && response.data) {
          data = Array.isArray(response.data) ? response.data[0] : response.data;
        } else if (response && response.id) {
          data = response;
        }

        if (data) {
          this.personalDetailsData = data;
          this.personalDetailsForm.patchValue(data);
          this.showPersonalDetailsModal = true;
          this.checkVerificationStatus(data);
        } else {
          console.warn('⚠️ No personal details found for modal leadId:', leadId);
          alert('No details found for this lead.');
        }

        // Force change detection to ensure modal shows immediately
        this.cdr.detectChanges();

        // Additional timeout to ensure DOM updates
        setTimeout(() => {
          this.showPersonalDetailsModal = true;
          this.cdr.detectChanges();
        }, 0);
      },
      error: (err) => {
        this.isLoadingPersonalDetails = false;
        console.error('❌ Failed to load personal details for modal', err);
        alert('Failed to load personal details. Please try again.');
      }
    });
  }

  savePersonalDetails(): void {
    if (this.personalDetailsForm.invalid) {
      alert('Please fill in all required fields correctly.');
      return;
    }

    this.isSavingPersonalDetails = true;
    const personalDetails = this.personalDetailsForm.value;
    this.http.put(`${environment.apiUrl}/leadpersonaldetails/${this.model.leadid}`, personalDetails).subscribe({
      next: () => {
        this.isSavingPersonalDetails = false;
        this.cdr.detectChanges(); // Force change detection before alert
        alert('Personal details saved successfully.');
        this.showPersonalDetailsModal = false;
        this.cdr.detectChanges(); // Force change detection after modal close
      },
      error: (err) => {
        this.isSavingPersonalDetails = false;
        this.cdr.detectChanges(); // Force change detection on error
        console.error('Failed to save personal details', err);
        alert('Failed to save personal details. Please try again.');
      }
    });
  }

  closePersonalDetailsModal(): void {
    this.showPersonalDetailsModal = false;
    this.personalDetailsForm.reset();
  }

  onOccupationalDetailsClick(): void {
    console.log('Occupational Details clicked for track:', this.currentTrackNumber);
    console.log('Lead ID:', this.model.leadid);

    if (!this.model.leadid) {
      alert('Lead ID not found. Please ensure the lead data is loaded properly.');
      return;
    }

    this.loadOccupationalDetails(this.model.leadid);
  }

  loadOccupationalDetails(leadId: string): void {
    console.log('loadOccupationalDetails called with leadId:', leadId);
    console.log('API URL:', `${environment.apiUrl}/leadoccupationdetails/${leadId}`);
    this.isLoadingOccupationalDetails = true;
    this.http.get<any>(`${environment.apiUrl}/leadoccupationdetails/${leadId}`).subscribe({
      next: (response) => {
        console.log('API SUCCESS: Occupational details loaded:', response);
        this.isLoadingOccupationalDetails = false;

        // Check if there are existing records in the data array
        if (response.data && response.data.length > 0) {
          // Existing record found - use the first record
          this.occupationalDetailsData = response.data[0];
          const formData = { ...response.data[0], leadpersonal: leadId };
          this.occupationalDetailsForm.patchValue(formData);
          console.log('Existing occupational record found:', response.data[0]);
        } else {
          // No existing record - show empty form for new record creation
          console.log('No existing occupational record found, showing empty form');
          this.occupationalDetailsData = {};
          this.occupationalDetailsForm.patchValue({ leadpersonal: leadId });
        }

        this.showOccupationalDetailsModal = true;

        // Force change detection to ensure modal shows immediately
        this.cdr.detectChanges();

        // Additional timeout to ensure DOM updates
        setTimeout(() => {
          this.showOccupationalDetailsModal = true;
          this.cdr.detectChanges();
        }, 0);
      },
      error: (err) => {
        console.log('API ERROR: Occupational details error:', err);
        console.log('Error status:', err.status);
        console.log('Error message:', err.message);
        this.isLoadingOccupationalDetails = false;

        // If record not found (404), show empty form for new record creation
        if (err.status === 404) {
          console.log('No existing occupational details found, creating new record');
          this.occupationalDetailsData = {};
          // Initialize form with leadpersonal field
          this.occupationalDetailsForm.patchValue({ leadpersonal: leadId });
          this.showOccupationalDetailsModal = true;

          // Force change detection to ensure modal shows immediately
          this.cdr.detectChanges();

          setTimeout(() => {
            this.showOccupationalDetailsModal = true;
            this.cdr.detectChanges();
          }, 0);
        } else {
          console.error('Failed to load occupational details', err);
          alert('Failed to load occupational details. Please try again.');
        }
      }
    });
  }

  saveOccupationalDetails(): void {
    if (this.occupationalDetailsForm.invalid) {
      alert('Please fill in all required fields correctly.');
      return;
    }

    this.isSavingOccupationalDetails = true;
    const occupationalDetails = this.occupationalDetailsForm.value;
    // Include the leadpersonal field even though it's disabled
    occupationalDetails.leadpersonal = this.model.leadid;

    // Determine if this is a new record or update based on whether we have existing data
    const isNewRecord = !this.occupationalDetailsData || Object.keys(this.occupationalDetailsData).length === 0;

    if (isNewRecord) {
      // Create new record using POST
      this.http.post(`${environment.apiUrl}/leadoccupationdetails`, occupationalDetails).subscribe({
        next: () => {
          this.isSavingOccupationalDetails = false;
          this.cdr.detectChanges(); // Force change detection before alert
          alert('Occupational details created successfully.');
          this.showOccupationalDetailsModal = false;
          this.cdr.detectChanges(); // Force change detection after modal close
        },
        error: (err) => {
          this.isSavingOccupationalDetails = false;
          this.cdr.detectChanges(); // Force change detection on error
          console.error('Failed to create occupational details', err);
          alert('Failed to create occupational details. Please try again.');
        }
      });
    } else {
      // Update existing record using PUT
      this.http.put(`${environment.apiUrl}/leadoccupationdetails/${this.model.leadid}`, occupationalDetails).subscribe({
        next: () => {
          this.isSavingOccupationalDetails = false;
          this.cdr.detectChanges(); // Force change detection before alert
          alert('Occupational details updated successfully.');
          this.showOccupationalDetailsModal = false;
          this.cdr.detectChanges(); // Force change detection after modal close
        },
        error: (err) => {
          this.isSavingOccupationalDetails = false;
          this.cdr.detectChanges(); // Force change detection on error
          console.error('Failed to update occupational details', err);
          alert('Failed to update occupational details. Please try again.');
        }
      });
    }
  }

  closeOccupationalDetailsModal(): void {
    this.showOccupationalDetailsModal = false;
    this.occupationalDetailsForm.reset();
  }

  onBankDetailsClick(): void {
    console.log('Bank Details clicked for track:', this.currentTrackNumber);
    console.log('Lead ID:', this.model.leadid);

    if (!this.model.leadid) {
      alert('Lead ID not found. Please ensure the lead data is loaded properly.');
      return;
    }

    this.openBankDetails();
  }

  openBankDetails(): void {
    const leadId = this.model?.leadid?.toString() || '';
    if (leadId) {
      this.loadBankDetails(leadId);
    } else {
      alert('Lead ID not found. Please ensure the lead data is loaded properly.');
    }
  }

  loadBankDetails(leadId: string): void {
    console.log('loadBankDetails called with leadId:', leadId);
    console.log('API URL:', `${environment.apiUrl}/leadbankdetails/${leadId}`);
    this.isLoadingBankDetails = true;
    this.http.get<any>(`${environment.apiUrl}/leadbankdetails/${leadId}`).subscribe({
      next: (response) => {
        console.log('API SUCCESS: Bank details loaded:', response);
        this.isLoadingBankDetails = false;

        // Check if there are existing records in the data array
        if (response.data && response.data.length > 0) {
          // Existing records found
          this.bankDetailsData = response.data.map((record: any) => ({
            ...record,
            isEditing: false,
            isNew: false
          }));
          console.log('Existing bank records found:', response.data);
        } else {
          // No existing records - start with empty array
          console.log('No existing bank records found, starting with empty grid');
          this.bankDetailsData = [];
        }

        this.showBankDetailsModal = true;

        // Force change detection to ensure modal shows immediately
        this.cdr.detectChanges();

        // Additional timeout to ensure DOM updates with direct DOM manipulation
        setTimeout(() => {
          this.showBankDetailsModal = true;
          this.cdr.detectChanges();

          // Complete DOM generation approach (same as Status Report success pattern)
          setTimeout(() => {
            console.log('Creating Bank Details modal via complete DOM generation');
            this.createBankDetailsModalDirectly();
          }, 100);
        }, 50);
      },
      error: (err) => {
        console.log('API ERROR: Bank details error:', err);
        console.log('Error status:', err.status);
        this.isLoadingBankDetails = false;

        // If record not found (404), show empty grid for new record creation
        if (err.status === 404) {
          console.log('No existing bank details found, showing empty grid');
          this.bankDetailsData = [];
          this.showBankDetailsModal = true;

          // Force change detection to ensure modal shows immediately
          this.cdr.detectChanges();

          setTimeout(() => {
            this.showBankDetailsModal = true;
            this.cdr.detectChanges();

            // Direct DOM manipulation to force modal display
            setTimeout(() => {
              const modalElements = document.querySelectorAll('.modal-overlay');
              const bankModalElement = Array.from(modalElements).find(el =>
                el.querySelector('h3')?.textContent?.includes('Bank Details')
              ) as HTMLElement;
              if (bankModalElement) {
                bankModalElement.style.display = 'flex';
                bankModalElement.style.visibility = 'visible';
                bankModalElement.style.opacity = '1';
                console.log('Bank Details modal forced to display via DOM manipulation (404 case)');
              } else {
                console.log('Bank Details modal element not found for DOM manipulation (404 case)');
              }
            }, 50);
          }, 0);
        } else {
          console.error('Failed to load bank details', err);
          alert('Failed to load bank details. Please try again.');
        }
      }
    });
  }

  addBankRow(): void {
    const newRow = {
      id: null,
      leadpersonal: this.model.leadid,
      bankname: '',
      branch: '',
      ifsccode: '',
      accountnumber: '',
      isEditing: true,
      isNew: true
    };
    this.bankDetailsData.push(newRow);
    this.cdr.detectChanges();
  }

  editBankRow(index: number): void {
    this.bankDetailsData[index].isEditing = true;
    this.cdr.detectChanges();
  }

  saveBankRow(index: number): void {
    const row = this.bankDetailsData[index];

    // Validate required fields
    if (!row.bankname || !row.branch || !row.ifsccode || !row.accountnumber) {
      alert('Please fill in all bank details fields.');
      return;
    }

    this.isSavingBankDetails = true;
    const bankDetails = {
      leadpersonal: this.model.leadid,
      bankname: row.bankname,
      branch: row.branch,
      ifsccode: row.ifsccode,
      accountnumber: row.accountnumber
    };

    if (row.isNew) {
      // Create new record using POST
      this.http.post(`${environment.apiUrl}/leadbankdetails`, bankDetails).subscribe({
        next: (response: any) => {
          this.isSavingBankDetails = false;
          row.id = response.id || response.data?.id; // Get the new ID from response
          row.isEditing = false;
          row.isNew = false;
          this.cdr.detectChanges();
          alert('Bank details created successfully.');
        },
        error: (err) => {
          this.isSavingBankDetails = false;
          this.cdr.detectChanges();
          console.error('Failed to create bank details', err);
          alert('Failed to create bank details. Please try again.');
        }
      });
    } else {
      // Update existing record using PUT
      this.http.put(`${environment.apiUrl}/leadbankdetails/${row.id}`, bankDetails).subscribe({
        next: () => {
          this.isSavingBankDetails = false;
          row.isEditing = false;
          this.cdr.detectChanges();
          alert('Bank details updated successfully.');
        },
        error: (err) => {
          this.isSavingBankDetails = false;
          this.cdr.detectChanges();
          console.error('Failed to update bank details', err);
          alert('Failed to update bank details. Please try again.');
        }
      });
    }
  }

  cancelBankRowEdit(index: number): void {
    const row = this.bankDetailsData[index];
    if (row.isNew) {
      // Remove new unsaved row
      this.bankDetailsData.splice(index, 1);
    } else {
      // Reset to original values and exit edit mode
      row.isEditing = false;
      // Note: In a real app, you'd restore original values here
    }
    this.cdr.detectChanges();
  }

  deleteBankRow(index: number): void {
    const row = this.bankDetailsData[index];

    if (row.isNew) {
      // Just remove from array if it's a new unsaved row
      this.bankDetailsData.splice(index, 1);
      this.cdr.detectChanges();
    } else {
      // Confirm deletion for existing records
      if (confirm('Are you sure you want to delete this bank record?')) {
        this.http.delete(`${environment.apiUrl}/leadbankdetails/${row.id}`).subscribe({
          next: () => {
            this.bankDetailsData.splice(index, 1);
            this.cdr.detectChanges();
            alert('Bank record deleted successfully.');
          },
          error: (err) => {
            console.error('Failed to delete bank record', err);
            alert('Failed to delete bank record. Please try again.');
          }
        });
      }
    }
  }

  closeBankDetailsModal(): void {
    this.showBankDetailsModal = false;
    this.bankDetailsData = [];
  }

  openLoanDetails(): void {
    console.log('Opening Loan History for track number:', this.currentTrackNumber);
    console.log('Lead ID:', this.model.leadid);

    if (!this.model.leadid) {
      alert('Lead ID not found. Please ensure the lead data is loaded properly.');
      return;
    }

    this.openLoanHistory();
  }

  openLoanHistory(): void {
    const leadId = this.model?.leadid?.toString() || '';
    if (leadId) {
      this.loadLoanHistory(leadId);
    } else {
      alert('Lead ID not found. Please ensure the lead data is loaded properly.');
    }
  }

  loadLoanHistory(leadId: string): void {
    console.log('loadLoanHistory called with leadId:', leadId);
    console.log('API URL:', `${environment.apiUrl}/leadloanhistorydetails/${leadId}`);
    this.isLoadingLoanHistory = true;
    this.http.get<any>(`${environment.apiUrl}/leadloanhistorydetails/${leadId}`).subscribe({
      next: (response) => {
        console.log('API SUCCESS: Loan history loaded:', response);
        this.isLoadingLoanHistory = false;

        // Check if there are existing records in the data array
        if (response.data && response.data.length > 0) {
          // Existing records found
          this.loanHistoryData = response.data.map((record: any) => ({
            ...record,
            isEditing: false,
            isNew: false
          }));
          console.log('Existing loan history records found:', response.data);
        } else {
          // No existing records - start with empty array
          console.log('No existing loan history records found, starting with empty grid');
          this.loanHistoryData = [];
        }

        this.showLoanHistoryModal = true;

        // Force change detection to ensure modal shows immediately
        this.cdr.detectChanges();

        // Complete DOM generation approach (same as Bank Details success pattern)
        setTimeout(() => {
          this.showLoanHistoryModal = true;
          this.cdr.detectChanges();

          setTimeout(() => {
            console.log('Creating Loan History modal via complete DOM generation');
            this.createLoanHistoryModalDirectly();
          }, 100);
        }, 50);
      },
      error: (err) => {
        console.log('API ERROR: Loan history error:', err);
        console.log('Error status:', err.status);
        this.isLoadingLoanHistory = false;

        // If record not found (404), show empty grid for new record creation
        if (err.status === 404) {
          console.log('No existing loan history found, showing empty grid');
          this.loanHistoryData = [];
          this.showLoanHistoryModal = true;

          // Force change detection to ensure modal shows immediately
          this.cdr.detectChanges();

          setTimeout(() => {
            this.showLoanHistoryModal = true;
            this.cdr.detectChanges();

            setTimeout(() => {
              console.log('Creating Loan History modal via complete DOM generation (404 case)');
              this.createLoanHistoryModalDirectly();
            }, 100);
          }, 50);
        } else {
          console.error('Failed to load loan history', err);
          alert('Failed to load loan history. Please try again.');
        }
      }
    });
  }

  // Direct DOM manipulation methods for Bank Details Modal
  createBankDetailsModalDirectly(): void {
    // Remove any existing bank details modal
    const existingModal = document.getElementById('bank-details-modal-direct');
    if (existingModal) {
      existingModal.remove();
    }

    // Create modal HTML directly
    const modalHTML = `
      <div id="bank-details-modal-direct" class="modal-overlay" style="display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; align-items: center; justify-content: center;">
        <div class="modal-container" style="background: white; border-radius: 8px; max-width: 1000px; width: 90%; max-height: 90vh; overflow-y: auto; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
          <div class="modal-header" style="padding: 20px; border-bottom: 1px solid #ddd; display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0; color: #333;">Bank Details</h3>
            <button type="button" class="close-btn" onclick="document.getElementById('bank-details-modal-direct').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">
              ×
            </button>
          </div>
          
          <div class="modal-body" style="padding: 20px;">
            <div class="bank-details-container">
              <div class="grid-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h4 style="margin: 0; color: #333;">Bank Account Information</h4>
                <button type="button" class="btn btn-primary btn-sm" onclick="window.contactFollowupComponent.addBankRowDirect()" style="background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                  <i class="fas fa-plus"></i> Add Bank Account
                </button>
              </div>
              
              <div id="bank-grid-container">
                ${this.bankDetailsData.length === 0 ?
        '<div style="text-align: center; padding: 40px; color: #666; background: #f8f9fa; border-radius: 4px; border: 1px dashed #ddd;">No Bank Details Found. Click "Add Bank Account" to create the first record.</div>' :
        this.generateBankGridHTML()
      }
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add modal to DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Store reference to component for button callbacks
    (window as any).contactFollowupComponent = this;

    console.log('Bank Details modal created directly in DOM');
  }

  generateBankGridHTML(): string {
    let gridHTML = `
      <div class="bank-grid" style="border: 1px solid #ddd; border-radius: 4px; overflow: hidden;">
        <div class="grid-header-row" style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr 200px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-weight: bold;">
          <div style="padding: 12px; border-right: 1px solid rgba(255,255,255,0.2);">Bank Name</div>
          <div style="padding: 12px; border-right: 1px solid rgba(255,255,255,0.2);">Branch</div>
          <div style="padding: 12px; border-right: 1px solid rgba(255,255,255,0.2);">IFSC Code</div>
          <div style="padding: 12px; border-right: 1px solid rgba(255,255,255,0.2);">Account Number</div>
          <div style="padding: 12px; text-align: center;">Actions</div>
        </div>
    `;

    this.bankDetailsData.forEach((row, index) => {
      gridHTML += `
        <div class="grid-row" style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr 200px; border-bottom: 1px solid #eee; background: ${index % 2 === 0 ? '#fff' : '#f8f9fa'};">
          <div style="padding: 12px; border-right: 1px solid #eee;">
            ${row.isEditing ?
          `<input type="text" value="${row.bankname || ''}" onchange="window.contactFollowupComponent.updateBankField(${index}, 'bankname', this.value)" style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 2px;">` :
          (row.bankname || '')
        }
          </div>
          <div style="padding: 12px; border-right: 1px solid #eee;">
            ${row.isEditing ?
          `<input type="text" value="${row.branch || ''}" onchange="window.contactFollowupComponent.updateBankField(${index}, 'branch', this.value)" style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 2px;">` :
          (row.branch || '')
        }
          </div>
          <div style="padding: 12px; border-right: 1px solid #eee;">
            ${row.isEditing ?
          `<input type="text" value="${row.ifsccode || ''}" onchange="window.contactFollowupComponent.updateBankField(${index}, 'ifsccode', this.value.toUpperCase())" style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 2px; text-transform: uppercase;">` :
          (row.ifsccode || '')
        }
          </div>
          <div style="padding: 12px; border-right: 1px solid #eee;">
            ${row.isEditing ?
          `<input type="text" value="${row.accountnumber || ''}" onchange="window.contactFollowupComponent.updateBankField(${index}, 'accountnumber', this.value)" style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 2px;">` :
          (row.accountnumber || '')
        }
          </div>
          <div style="padding: 12px; text-align: center;">
            ${row.isEditing ?
          `<button onclick="window.contactFollowupComponent.saveBankRowDirect(${index})" style="background: #28a745; color: white; border: none; padding: 4px 8px; margin: 2px; border-radius: 2px; cursor: pointer;">Save</button>
               <button onclick="window.contactFollowupComponent.cancelBankRowDirect(${index})" style="background: #6c757d; color: white; border: none; padding: 4px 8px; margin: 2px; border-radius: 2px; cursor: pointer;">Cancel</button>` :
          `<button onclick="window.contactFollowupComponent.editBankRowDirect(${index})" style="background: #007bff; color: white; border: none; padding: 4px 8px; margin: 2px; border-radius: 2px; cursor: pointer;">Edit</button>
               <button onclick="window.contactFollowupComponent.deleteBankRowDirect(${index})" style="background: #dc3545; color: white; border: none; padding: 4px 8px; margin: 2px; border-radius: 2px; cursor: pointer;">Delete</button>`
        }
          </div>
        </div>
      `;
    });

    gridHTML += '</div>';
    return gridHTML;
  }

  // Direct DOM manipulation CRUD methods
  addBankRowDirect(): void {
    const newRow = {
      bankname: '',
      branch: '',
      ifsccode: '',
      accountnumber: '',
      leadpersonal: this.model?.leadid || '',
      isEditing: true,
      isNew: true
    };
    this.bankDetailsData.push(newRow);
    this.refreshBankGridDirect();
  }

  editBankRowDirect(index: number): void {
    this.bankDetailsData[index].isEditing = true;
    this.refreshBankGridDirect();
  }

  saveBankRowDirect(index: number): void {
    const row = this.bankDetailsData[index];

    // Validate required fields
    if (!row.bankname || !row.branch || !row.ifsccode || !row.accountnumber) {
      alert('Please fill in all required fields.');
      return;
    }

    if (row.isNew) {
      // Create new record
      this.http.post(`${environment.apiUrl}/leadbankdetails`, {
        bankname: row.bankname,
        branch: row.branch,
        ifsccode: row.ifsccode,
        accountnumber: row.accountnumber,
        leadpersonal: row.leadpersonal
      }).subscribe({
        next: (response: any) => {
          row.id = response.id || response.data?.id;
          row.isEditing = false;
          row.isNew = false;
          this.refreshBankGridDirect();
          console.log('Bank record created successfully');
        },
        error: (err) => {
          console.error('Failed to create bank record', err);
          alert('Failed to save bank record. Please try again.');
        }
      });
    } else {
      // Update existing record
      this.http.put(`${environment.apiUrl}/leadbankdetails/${row.id}`, {
        bankname: row.bankname,
        branch: row.branch,
        ifsccode: row.ifsccode,
        accountnumber: row.accountnumber,
        leadpersonal: row.leadpersonal
      }).subscribe({
        next: () => {
          row.isEditing = false;
          this.refreshBankGridDirect();
          console.log('Bank record updated successfully');
        },
        error: (err) => {
          console.error('Failed to update bank record', err);
          alert('Failed to update bank record. Please try again.');
        }
      });
    }
  }

  cancelBankRowDirect(index: number): void {
    const row = this.bankDetailsData[index];
    if (row.isNew) {
      this.bankDetailsData.splice(index, 1);
    } else {
      row.isEditing = false;
    }
    this.refreshBankGridDirect();
  }

  deleteBankRowDirect(index: number): void {
    const row = this.bankDetailsData[index];

    if (row.isNew) {
      this.bankDetailsData.splice(index, 1);
      this.refreshBankGridDirect();
    } else {
      if (confirm('Are you sure you want to delete this bank record?')) {
        this.http.delete(`${environment.apiUrl}/leadbankdetails/${row.id}`).subscribe({
          next: () => {
            this.bankDetailsData.splice(index, 1);
            this.refreshBankGridDirect();
            console.log('Bank record deleted successfully');
          },
          error: (err) => {
            console.error('Failed to delete bank record', err);
            alert('Failed to delete bank record. Please try again.');
          }
        });
      }
    }
  }

  updateBankField(index: number, field: string, value: string): void {
    this.bankDetailsData[index][field] = value;
  }

  refreshBankGridDirect(): void {
    const gridContainer = document.getElementById('bank-grid-container');
    if (gridContainer) {
      gridContainer.innerHTML = this.bankDetailsData.length === 0 ?
        '<div style="text-align: center; padding: 40px; color: #666; background: #f8f9fa; border-radius: 4px; border: 1px dashed #ddd;">No Bank Details Found. Click "Add Bank Account" to create the first record.</div>' :
        this.generateBankGridHTML();
    }
  }

  // Direct DOM manipulation methods for Loan History Modal
  createLoanHistoryModalDirectly(): void {
    // Remove any existing loan history modal
    const existingModal = document.getElementById('loan-history-modal-direct');
    if (existingModal) {
      existingModal.remove();
    }

    // Create modal HTML directly
    const modalHTML = `
      <div id="loan-history-modal-direct" class="modal-overlay" style="display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; align-items: center; justify-content: center;">
        <div class="modal-container" style="background: white; border-radius: 8px; max-width: 1200px; width: 95%; max-height: 90vh; overflow-y: auto; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
          <div class="modal-header" style="padding: 20px; border-bottom: 1px solid #ddd; display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0; color: #333;">Loan History</h3>
            <button type="button" class="close-btn" onclick="document.getElementById('loan-history-modal-direct').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">
              ×
            </button>
          </div>
          
          <div class="modal-body" style="padding: 20px;">
            <div class="loan-history-container">
              <div class="grid-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h4 style="margin: 0; color: #333;">Loan History Information</h4>
                <button type="button" class="btn btn-primary btn-sm" onclick="window.contactFollowupComponent.addLoanRowDirect()" style="background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                  <i class="fas fa-plus"></i> Add Loan Record
                </button>
              </div>
              
              <div id="loan-grid-container">
                ${this.loanHistoryData.length === 0 ?
        '<div style="text-align: center; padding: 40px; color: #666; background: #f8f9fa; border-radius: 4px; border: 1px dashed #ddd;">No Loan History Found. Click "Add Loan Record" to create the first record.</div>' :
        this.generateLoanGridHTML()
      }
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add modal to DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Store reference to component for button callbacks
    (window as any).contactFollowupComponent = this;

    console.log('Loan History modal created directly in DOM');
  }

  generateLoanGridHTML(): string {
    let gridHTML = `
      <div class="loan-grid" style="border: 1px solid #ddd; border-radius: 4px; overflow: hidden;">
        <div class="grid-header-row" style="display: grid; grid-template-columns: 140px 100px 140px 170px 170px 160px 100px 200px; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; font-weight: bold; font-size: 12px;">
          <div style="padding: 12px; border-right: 1px solid rgba(255,255,255,0.2);">Loan Type</div>
          <div style="padding: 12px; border-right: 1px solid rgba(255,255,255,0.2);">ROI (%)</div>
          <div style="padding: 12px; border-right: 1px solid rgba(255,255,255,0.2);">Loan Amount</div>
          <div style="padding: 12px; border-right: 1px solid rgba(255,255,255,0.2);">Bank Name</div>
          <div style="padding: 12px; border-right: 1px solid rgba(255,255,255,0.2);">Branch Name</div>
          <div style="padding: 12px; border-right: 1px solid rgba(255,255,255,0.2);">Disbursement Date</div>
          <div style="padding: 12px; border-right: 1px solid rgba(255,255,255,0.2);">Tenure</div>
          <div style="padding: 12px; text-align: center;">Actions</div>
        </div>
    `;

    this.loanHistoryData.forEach((row, index) => {
      const disbursementDate = row.disbursementdate ? new Date(row.disbursementdate).toISOString().split('T')[0] : '';
      gridHTML += `
        <div class="grid-row" style="display: grid; grid-template-columns: 140px 100px 140px 170px 170px 160px 100px 200px; border-bottom: 1px solid #eee; background: ${index % 2 === 0 ? '#fff' : '#f8f9fa'}; font-size: 12px;">
          <div style="padding: 8px; border-right: 1px solid #eee;">
            ${row.isEditing ?
          `<input type="text" value="${row.loantype || ''}" onchange="window.contactFollowupComponent.updateLoanField(${index}, 'loantype', this.value)" style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 2px; font-size: 11px;">` :
          (row.loantype || '')
        }
          </div>
          <div style="padding: 8px; border-right: 1px solid #eee;">
            ${row.isEditing ?
          `<input type="number" step="0.01" value="${row.roi || ''}" onchange="window.contactFollowupComponent.updateLoanField(${index}, 'roi', this.value)" style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 2px; font-size: 11px;">` :
          (row.roi || '')
        }
          </div>
          <div style="padding: 8px; border-right: 1px solid #eee;">
            ${row.isEditing ?
          `<input type="number" value="${row.loanamount || ''}" onchange="window.contactFollowupComponent.updateLoanField(${index}, 'loanamount', this.value)" style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 2px; font-size: 11px;">` :
          (row.loanamount || '')
        }
          </div>
          <div style="padding: 8px; border-right: 1px solid #eee;">
            ${row.isEditing ?
          `<input type="text" value="${row.bankname || ''}" onchange="window.contactFollowupComponent.updateLoanField(${index}, 'bankname', this.value)" style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 2px; font-size: 11px;">` :
          (row.bankname || '')
        }
          </div>
          <div style="padding: 8px; border-right: 1px solid #eee;">
            ${row.isEditing ?
          `<input type="text" value="${row.branchname || ''}" onchange="window.contactFollowupComponent.updateLoanField(${index}, 'branchname', this.value)" style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 2px; font-size: 11px;">` :
          (row.branchname || '')
        }
          </div>
          <div style="padding: 8px; border-right: 1px solid #eee;">
            ${row.isEditing ?
          `<input type="date" value="${disbursementDate}" onchange="window.contactFollowupComponent.updateLoanField(${index}, 'disbursementdate', this.value)" style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 2px; font-size: 11px;">` :
          (disbursementDate || '')
        }
          </div>
          <div style="padding: 8px; border-right: 1px solid #eee;">
            ${row.isEditing ?
          `<input type="number" value="${row.tenure || ''}" onchange="window.contactFollowupComponent.updateLoanField(${index}, 'tenure', this.value)" style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 2px; font-size: 11px;">` :
          (row.tenure || '')
        }
          </div>
          <div style="padding: 8px; text-align: center;">
            ${row.isEditing ?
          `<button onclick="window.contactFollowupComponent.saveLoanRowDirect(${index})" style="background: #28a745; color: white; border: none; padding: 4px 6px; margin: 1px; border-radius: 2px; cursor: pointer; font-size: 10px;">Save</button>
               <button onclick="window.contactFollowupComponent.cancelLoanRowDirect(${index})" style="background: #6c757d; color: white; border: none; padding: 4px 6px; margin: 1px; border-radius: 2px; cursor: pointer; font-size: 10px;">Cancel</button>` :
          `<button onclick="window.contactFollowupComponent.editLoanRowDirect(${index})" style="background: #007bff; color: white; border: none; padding: 4px 6px; margin: 1px; border-radius: 2px; cursor: pointer; font-size: 10px;">Edit</button>
               <button onclick="window.contactFollowupComponent.deleteLoanRowDirect(${index})" style="background: #dc3545; color: white; border: none; padding: 4px 6px; margin: 1px; border-radius: 2px; cursor: pointer; font-size: 10px;">Delete</button>`
        }
          </div>
        </div>
      `;
    });

    gridHTML += '</div>';
    return gridHTML;
  }

  // Direct DOM manipulation CRUD methods for Loan History
  addLoanRowDirect(): void {
    const newRow = {
      loantype: '',
      roi: '',
      loanamount: '',
      bankname: '',
      branchname: '',
      disbursementdate: '',
      tenure: '',
      leadpersonal: this.model?.leadid || '',
      isEditing: true,
      isNew: true
    };
    this.loanHistoryData.push(newRow);
    this.refreshLoanGridDirect();
  }

  editLoanRowDirect(index: number): void {
    this.loanHistoryData[index].isEditing = true;
    this.refreshLoanGridDirect();
  }

  saveLoanRowDirect(index: number): void {
    const row = this.loanHistoryData[index];

    // Validate required fields
    if (!row.loantype || !row.loanamount || !row.bankname) {
      alert('Please fill in all required fields (Loan Type, Loan Amount, Bank Name).');
      return;
    }

    const payload = {
      loantype: row.loantype,
      roi: parseFloat(row.roi) || 0,
      loanamount: parseFloat(row.loanamount) || 0,
      bankname: row.bankname,
      branchname: row.branchname || '',
      disbursementdate: row.disbursementdate || null,
      tenure: parseInt(row.tenure) || 0,
      leadpersonal: row.leadpersonal
    };

    if (row.isNew) {
      // Create new record
      this.http.post(`${environment.apiUrl}/leadloanhistorydetails`, payload).subscribe({
        next: (response: any) => {
          row.id = response.id || response.data?.id;
          row.isEditing = false;
          row.isNew = false;
          this.refreshLoanGridDirect();
          console.log('Loan history record created successfully');
        },
        error: (err) => {
          console.error('Failed to create loan history record', err);
          alert('Failed to save loan history record. Please try again.');
        }
      });
    } else {
      // Update existing record
      this.http.put(`${environment.apiUrl}/leadloanhistorydetails/${row.id}`, payload).subscribe({
        next: () => {
          row.isEditing = false;
          this.refreshLoanGridDirect();
          console.log('Loan history record updated successfully');
        },
        error: (err) => {
          console.error('Failed to update loan history record', err);
          alert('Failed to update loan history record. Please try again.');
        }
      });
    }
  }

  cancelLoanRowDirect(index: number): void {
    const row = this.loanHistoryData[index];
    if (row.isNew) {
      this.loanHistoryData.splice(index, 1);
    } else {
      row.isEditing = false;
    }
    this.refreshLoanGridDirect();
  }

  deleteLoanRowDirect(index: number): void {
    const row = this.loanHistoryData[index];

    if (row.isNew) {
      this.loanHistoryData.splice(index, 1);
      this.refreshLoanGridDirect();
    } else {
      if (confirm('Are you sure you want to delete this loan history record?')) {
        this.http.delete(`${environment.apiUrl}/leadloanhistorydetails/${row.id}`).subscribe({
          next: () => {
            this.loanHistoryData.splice(index, 1);
            this.refreshLoanGridDirect();
            console.log('Loan history record deleted successfully');
          },
          error: (err) => {
            console.error('Failed to delete loan history record', err);
            alert('Failed to delete loan history record. Please try again.');
          }
        });
      }
    }
  }

  updateLoanField(index: number, field: string, value: string): void {
    this.loanHistoryData[index][field] = value;
  }

  refreshLoanGridDirect(): void {
    const gridContainer = document.getElementById('loan-grid-container');
    if (gridContainer) {
      gridContainer.innerHTML = this.loanHistoryData.length === 0 ?
        '<div style="text-align: center; padding: 40px; color: #666; background: #f8f9fa; border-radius: 4px; border: 1px dashed #ddd;">No Loan History Found. Click "Add Loan Record" to create the first record.</div>' :
        this.generateLoanGridHTML();
    }
  }

  convertToCustomer(): void {
    // Validate that the status is 17
    if (this.form.get('status')?.value !== 17) {
      alert('Convert to Customer is only available when status is 17.');
      return;
    }

    // Validate that we have the necessary data
    if (!this.model || !this.model.leadid) {
      alert('Lead information not found. Cannot convert to customer.');
      return;
    }

    this.convertingToCustomer = true;

    // Prepare customer data according to the specified fields
    const customerData = {
      name: this.form.get('customername')?.value || '',
      loandate: this.form.get('logindate')?.value || '',
      location: this.form.get('presentaddress')?.value || '',
      mobilenumber: this.form.get('mobilenumber')?.value || '',
      product: this.form.get('loantype')?.value || '',
      email: this.form.get('emailid')?.value || '',
      status: this.form.get('status')?.value?.toString() || '',
      bank: this.form.get('bankname')?.value || '',
      disbursedvalue: this.form.get('disbursementamount')?.value?.toString() || '',
      profile: this.form.get('occupationtype')?.value || '',
      remarks: this.form.get('notes')?.value || '',
      notes: this.form.get('remarks')?.value || '',
      newstatus: 'Converted',
      leadid: this.model.leadid,
      leadfollowedby: parseInt(localStorage.getItem('usernameID') || '0')
    };

    console.log('Converting to customer:', customerData);

    // Call the customers API to create the customer record
    this.http.post(`${environment.apiUrl}/customers`, customerData).subscribe({
      next: (response) => {
        console.log('Convert to customer response:', response);

        // Force UI update with multiple change detection cycles (following established pattern)
        this.ngZone.run(() => {
          this.convertingToCustomer = false;
          this.cdr.detectChanges();

          setTimeout(() => {
            this.cdr.detectChanges();
            alert(`Lead has been successfully converted to a customer!`);

            // Refresh the base report lead tracks after successful conversion
            this.dataSaved.emit();

            // Optionally close the popup or refresh data
            // this.closePopup.emit();
          }, 100);
        });
      },
      error: (err) => {
        console.error('Failed to convert to customer:', err);

        // Force UI update for error case too (following established pattern)
        this.ngZone.run(() => {
          this.convertingToCustomer = false;
          this.cdr.detectChanges();

          setTimeout(() => {
            this.cdr.detectChanges();
            alert('Failed to convert to customer. Please try again.');
          }, 100);
        });
      }
    });
  }
}
