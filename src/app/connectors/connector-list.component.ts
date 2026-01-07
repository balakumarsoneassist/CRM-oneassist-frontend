import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

interface Connector {
  id?: number;
  name: string;
  mobilenumber: string;
  location: string;
  isactive: boolean;
  createdby: string;
}

@Component({
  selector: 'app-connector-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './connector-list.component.html',
  styleUrls: ['./connector-list.component.css']
})
export class ConnectorListComponent implements OnInit {
  connectors: Connector[] = [];
  showPopup = false;
  loading = true;
  showContent = false;
  lastUpdate = Date.now();
  editConnectorHandler!: (connectorId: number) => void;
  editingConnectorId: number | null = null;

  // Form data for editing
  connectorForm: Connector = {
    name: '',
    mobilenumber: '',
    location: '',
    isactive: true,
    createdby: ''
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

  ngOnInit(): void {
    this.loadConnectors();
  }

  private loadConnectors(): void {
    this.loading = true;
    this.http.get<any>(`${environment.apiUrl}/getconnectorlist`).subscribe({
      next: (response) => {
        // Handle API response structure: {success: true, count: 4, data: [...]}
        console.log('API Response:', response);
        this.connectors = response.data || response || [];
        console.log('Connectors loaded:', this.connectors.length);
        // Apply direct DOM manipulation fix for Angular change detection issues
        setTimeout(() => {
          this.loading = false;
          this.connectors = [...this.connectors];
          this.showContent = true;
          
          // Multiple change detection attempts
          setTimeout(() => {
            this.showContent = false;
            setTimeout(() => {
              this.showContent = true;
              
              // FINAL SOLUTION: Direct DOM manipulation
              setTimeout(() => {
                this.updateDOMDirectly();
              }, 20);
            }, 10);
          }, 10);
        }, 100);
      },
      error: (err) => {
        console.error('Failed to load connectors', err);
        this.loading = false;
      },
    });
  }

  openEdit(connector: Connector): void {
    this.editingConnectorId = connector.id || null;
    
    // Load full connector data using GET /connector/:id API
    this.http.get<any>(`${environment.apiUrl}/connector/${connector.id}`).subscribe({
      next: (response) => {
        // Handle API response structure: {success: true, data: {...}}
        console.log('GET Connector API Response:', response);
        const data = response.data || response;
        
        // Populate the form with API response data
        this.connectorForm = {
          name: data.name || '',
          mobilenumber: data.mobilenumber || '',
          location: data.location || '',
          isactive: data.isactive || false,
          createdby: data.createdby || ''
        };
        
        this.showPopup = true;
        this.showModalDirectly();
        
        // Force form field updates with direct DOM manipulation
        setTimeout(() => {
          this.updateFormDOMDirectly();
        }, 100);
      },
      error: (err) => {
        console.error('Failed to load connector details', err);
        this.showError('Failed to load connector details. Please try again.');
      }
    });
  }

  close(): void {
    this.showPopup = false;
    this.resetForm();
  }

  resetForm(): void {
    this.connectorForm = {
      name: '',
      mobilenumber: '',
      location: '',
      isactive: true,
      createdby: ''
    };
    this.editingConnectorId = null;
    this.showSuccessMessage = false;
    this.showErrorMessage = false;
  }

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

    // Set modifiedby from localStorage before API call
    const connectorData = {
      ...this.connectorForm,
      modifiedby: localStorage.getItem('usernameID') || null
    };

    if (this.editingConnectorId !== null) {
      // Update existing connector using PUT /connector/:id API
      this.http
        .put(`${environment.apiUrl}/connector/${this.editingConnectorId}`, connectorData)
        .subscribe({
          next: (response: any) => {
            console.log('Connector updated successfully:', response);
            this.showSuccess('Connector updated successfully!');
          },
          error: (error) => {
            console.error('Error updating connector:', error);
            this.showError('Failed to update connector. Please try again.');
          },
          complete: () => {
            this.isSubmitting = false;
            this.updateFormDOMDirectly();
          }
        });
    }
  }

  showSuccess(message: string): void {
    this.showSuccessMessage = true;
    this.showErrorMessage = false;
    
    // Force immediate DOM update for success message
    this.updateFormDOMDirectly();
    
    // Auto-close popup after success message
    setTimeout(() => {
      this.close();
      this.loadConnectors(); // Refresh the list
    }, 1500);
  }

  showError(message: string): void {
    this.errorMessage = message;
    this.showErrorMessage = true;
    this.showSuccessMessage = false;
    
    // Hide error message after 5 seconds
    setTimeout(() => {
      this.showErrorMessage = false;
      this.updateFormDOMDirectly();
    }, 5000);
  }

  // Direct DOM manipulation method to bypass Angular change detection issues
  updateDOMDirectly(): void {
    const loadingBox = document.getElementById('loading-box');
    const connectorContainer = document.getElementById('connector-container');
    const connectorTable = document.getElementById('connector-table');
    
    // Hide loading, show content
    if (loadingBox) loadingBox.style.display = 'none';
    
    // Display actual connector table with full styling
    if (connectorContainer && connectorTable) {
      connectorContainer.style.display = 'block';
      
      // Generate connector table HTML
      let tableHTML = `
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <thead>
            <tr style="background: var(--primary-color, #007bff); color: white;">
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Name</th>
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Mobile Number</th>
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Location</th>
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Status</th>
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Created By</th>
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Actions</th>
            </tr>
          </thead>
          <tbody>
      `;
      
      this.connectors.forEach((connector, index) => {
        const rowColor = index % 2 === 0 ? '#f8f9fa' : 'white';
        const statusColor = connector.isactive ? '#28a745' : '#dc3545';
        const statusText = connector.isactive ? 'Active' : 'Inactive';
        
        tableHTML += `
          <tr style="background: ${rowColor}; transition: background-color 0.2s;" 
              onmouseover="this.style.background='#e3f2fd'" 
              onmouseout="this.style.background='${rowColor}'">
            <td style="padding: 12px; border-bottom: 1px solid #ddd;">
              <strong>${connector.name || 'N/A'}</strong>
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #ddd;">${connector.mobilenumber || 'N/A'}</td>
            <td style="padding: 12px; border-bottom: 1px solid #ddd;">${connector.location || 'N/A'}</td>
            <td style="padding: 12px; border-bottom: 1px solid #ddd;">
              <span style="background: ${statusColor}; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px;">
                ${statusText}
              </span>
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #ddd;">${connector.createdby || 'N/A'}</td>
            <td style="padding: 12px; border-bottom: 1px solid #ddd;">
              <button onclick="window.editConnector(${connector.id}); return false;" 
                      onmousedown="window.editConnector(${connector.id}); return false;"
                      style="background: var(--primary-color, #007bff); color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                Edit
              </button>
            </td>
          </tr>
        `;
      });
      
      tableHTML += `
          </tbody>
        </table>
      `;
      
      connectorTable.innerHTML = tableHTML;
      
      // Set up global edit function with immediate binding and proper context
      const self = this;
      
      // Clear any existing function first
      delete (window as any).editConnector;
      
      // Set up the global function with immediate execution capability
      (window as any).editConnector = function(connectorId: number) {
        try {
          const connector = self.connectors.find(conn => conn.id === connectorId);
          if (connector) {
            self.openEditWithDirectDOM(connector);
          }
        } catch (error) {
          console.error('Error in editConnector:', error);
        }
        return false;
      };
      
      // Also bind to component instance for backup
      this.editConnectorHandler = (connectorId: number) => {
        const connector = this.connectors.find(conn => conn.id === connectorId);
        if (connector) {
          this.openEdit(connector);
        }
      };
    }
  }

  // Direct DOM manipulation method for opening edit modal
  openEditWithDirectDOM(connector: Connector): void {
    // Set the editing state
    this.editingConnectorId = connector.id || null;
    
    // Load full connector data using GET /connector/:id API
    this.http.get<any>(`${environment.apiUrl}/connector/${connector.id}`).subscribe({
      next: (response) => {
        // Handle API response structure: {success: true, data: {...}}
        console.log('GET Connector API Response (DirectDOM):', response);
        const data = response.data || response;
        
        // Populate the form with API response data
        this.connectorForm = {
          name: data.name || '',
          mobilenumber: data.mobilenumber || '',
          location: data.location || '',
          isactive: data.isactive || false,
          createdby: data.createdby || ''
        };
        
        // Show modal using direct DOM manipulation
        this.showModalDirectly();
        
        // Force form field updates with direct DOM manipulation
        setTimeout(() => {
          this.updateFormDOMDirectly();
        }, 100);
      },
      error: (err) => {
        console.error('Failed to load connector details', err);
        this.showError('Failed to load connector details. Please try again.');
      }
    });
  }

  // Direct DOM manipulation to show modal
  showModalDirectly(): void {
    // Set the showPopup flag
    this.showPopup = true;
    
    // Find the modal element and force it to display
    setTimeout(() => {
      const modalElement = document.querySelector('.modal') as HTMLElement;
      if (modalElement) {
        modalElement.style.display = 'flex';
        modalElement.style.position = 'fixed';
        modalElement.style.top = '0';
        modalElement.style.left = '0';
        modalElement.style.width = '100%';
        modalElement.style.height = '100%';
        modalElement.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        modalElement.style.justifyContent = 'center';
        modalElement.style.alignItems = 'center';
        modalElement.style.zIndex = '1000';
      } else {
        // Fallback: try to trigger Angular change detection
        try {
          if (this.cdr) {
            this.cdr.detectChanges();
          }
        } catch (error) {
          console.error('Error in change detection fallback:', error);
        }
      }
    }, 50);
  }

  // Direct DOM manipulation for form updates (following established pattern)
  updateFormDOMDirectly(): void {
    // Multiple change detection attempts
    this.cdr.detectChanges();
    
    this.ngZone.run(() => {
      this.cdr.detectChanges();
      
      setTimeout(() => {
        // Force update form field values directly in DOM
        const nameInput = document.querySelector('input[name="name"]') as HTMLInputElement;
        const mobileInput = document.querySelector('input[name="mobilenumber"]') as HTMLInputElement;
        const locationInput = document.querySelector('input[name="location"]') as HTMLInputElement;
        const activeCheckbox = document.querySelector('input[name="isactive"]') as HTMLInputElement;
        
        if (nameInput) nameInput.value = this.connectorForm.name;
        if (mobileInput) mobileInput.value = this.connectorForm.mobilenumber;
        if (locationInput) locationInput.value = this.connectorForm.location;
        if (activeCheckbox) activeCheckbox.checked = this.connectorForm.isactive;
        
        // Force update of form state
        const submitBtn = document.querySelector('.submit-btn') as HTMLButtonElement;
        if (submitBtn) {
          submitBtn.disabled = this.isSubmitting;
          submitBtn.textContent = this.isSubmitting ? 'Updating...' : 'Update Connector';
        }

        // Update message displays with direct DOM manipulation
        const successMsg = document.querySelector('.success-message') as HTMLElement;
        const errorMsg = document.querySelector('.error-message') as HTMLElement;
        
        if (successMsg) {
          successMsg.style.display = this.showSuccessMessage ? 'block' : 'none';
          if (this.showSuccessMessage) {
            successMsg.innerHTML = '<i class="fas fa-check-circle"></i> Connector updated successfully!';
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
