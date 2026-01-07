import { Component, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

interface ConnectorData {
  name: string;
  mobilenumber: string;
  emailid: string;
  isactive: boolean;
  location: string;
  createdby?: string;
}

@Component({
  selector: 'app-connector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './connector.component.html',
  styleUrls: ['./connector.component.css']
})
export class ConnectorComponent {
  connectorForm: ConnectorData = {
    name: '',
    mobilenumber: '',
    emailid: '',
    isactive: true,
    location: ''
  };

  isSubmitting = false;
  showSuccessMessage = false;
  showErrorMessage = false;
  errorMessage = '';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  onSubmit(): void {
    if (this.isSubmitting) return;

    // Basic validation
    if (!this.connectorForm.name.trim() || !this.connectorForm.mobilenumber.trim()) {
      this.showError('Name and Mobile Number are required fields.');
      return;
    }

    this.isSubmitting = true;
    this.showSuccessMessage = false;
    this.showErrorMessage = false;

    // Set createdby from localStorage before API call
    const connectorData = {
      ...this.connectorForm,
      createdby: localStorage.getItem('usernameID') || null
    };

    // Call the /connector API endpoint
    this.http.post(`${environment.apiUrl}/connector`, connectorData).subscribe({
      next: (response: any) => {
        console.log('Connector saved successfully:', response);
        this.showSuccess();
        this.resetForm();
      },
      error: (error) => {
        console.error('Error saving connector:', error);
        this.showError('Failed to save connector. Please try again.');
      },
      complete: () => {
        this.isSubmitting = false;
        this.updateDOMDirectly();
      }
    });
  }

  resetForm(): void {
    this.connectorForm = {
      name: '',
      mobilenumber: '',
      emailid: '',
      isactive: true,
      location: ''
    };
  }

  showSuccess(): void {
    this.showSuccessMessage = true;
    this.showErrorMessage = false;
    
    // Force immediate DOM update for success message
    this.updateDOMDirectly();
    
    // Hide success message after 3 seconds
    setTimeout(() => {
      this.showSuccessMessage = false;
      this.updateDOMDirectly();
    }, 3000);
  }

  showError(message: string): void {
    this.errorMessage = message;
    this.showErrorMessage = true;
    this.showSuccessMessage = false;
    
    // Hide error message after 5 seconds
    setTimeout(() => {
      this.showErrorMessage = false;
      this.updateDOMDirectly();
    }, 5000);
  }

  // Direct DOM manipulation for reliable updates (following established pattern)
  updateDOMDirectly(): void {
    // Multiple change detection attempts
    this.cdr.detectChanges();
    
    this.ngZone.run(() => {
      this.cdr.detectChanges();
      
      setTimeout(() => {
        // Force update of form state
        const submitBtn = document.querySelector('.submit-btn') as HTMLButtonElement;
        if (submitBtn) {
          submitBtn.disabled = this.isSubmitting;
          submitBtn.textContent = this.isSubmitting ? 'Saving...' : 'Save Connector';
        }

        // Update message displays with direct DOM manipulation
        const successMsg = document.querySelector('.success-message') as HTMLElement;
        const errorMsg = document.querySelector('.error-message') as HTMLElement;
        
        if (successMsg) {
          successMsg.style.display = this.showSuccessMessage ? 'block' : 'none';
          if (this.showSuccessMessage) {
            successMsg.innerHTML = '<i class="fas fa-check-circle"></i> Connector saved successfully!';
          }
        }
        
        if (errorMsg) {
          errorMsg.style.display = this.showErrorMessage ? 'block' : 'none';
          if (this.showErrorMessage) {
            errorMsg.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${this.errorMessage}`;
          }
        }
        
        // Force another change detection cycle
        this.cdr.detectChanges();
      }, 10);
    });
  }
}
