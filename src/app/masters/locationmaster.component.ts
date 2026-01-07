import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

interface LocationMaster {
  id: number;
  location: string;
  state: string;
}

@Component({
  selector: 'app-locationmaster',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './locationmaster.component.html',
  styleUrls: ['./locationmaster.component.css'],
})
export class LocationmasterComponent implements OnInit {
  locations: LocationMaster[] = [];
  showPopup = false;
  form!: FormGroup;
  editingLocationId: number | null = null;
  // Predefined list of Indian states to choose from
  states: string[] = ['Andhra', 'Kerela', 'Karnataka', 'Pondy', 'Tamilnadu', 'Others'];
  loading = false;
  showContent = false;
  lastUpdate = Date.now();
  locationMap = new Map<string, LocationMaster>();

  constructor(private http: HttpClient, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.loadLocations();
    this.initForm();
    this.setupGlobalEventHandlers();
  }

  private initForm(): void {
    this.form = this.fb.group({
      location: ['', Validators.required],
      state: ['Tamilnadu', Validators.required],
    });
  }

  private loadLocations(): void {
    this.loading = true;
    this.showContent = false;
    this.lastUpdate = Date.now();
    
    this.http.get<LocationMaster[]>(`${environment.apiUrl}/locationmaster`).subscribe({
      next: (data) => {
        this.locations = data;
        console.log('Locations loaded:', data.length);
        
        // Populate location map for DOM event handling
        this.locationMap.clear();
        
        // Multiple change detection attempts
        setTimeout(() => {
          this.loading = false;
          this.locations = [...this.locations];
          this.showContent = true;
          this.lastUpdate = Date.now();
          
          setTimeout(() => {
            this.showContent = false;
            setTimeout(() => {
              this.showContent = true;
              this.lastUpdate = Date.now();
              
              // Final DOM fallback
              setTimeout(() => {
                this.updateDOMDirectly();
              }, 20);
            }, 10);
          }, 10);
        }, 100);
      },
      error: (err) => {
        console.error('Failed to load locations', err);
        this.loading = false;
      },
    });
  }

  openAdd(): void {
    this.editingLocationId = null;
    this.form.reset({ state: 'Tamilnadu' });
    this.showPopup = true;
  }

  openEdit(location: LocationMaster): void {
    this.editingLocationId = location.id;
    this.form.patchValue({
      location: location.location,
      state: location.state,
    });
    this.showPopup = true;
  }

  close(): void {
    this.showPopup = false;
  }

  closeModal(): void {
    this.showPopup = false;
    // Also remove any DOM-created modals
    const domModal = document.getElementById('dom-modal-location');
    if (domModal) {
      domModal.remove();
    }
  }

  setupGlobalEventHandlers(): void {
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      
      // Handle DOM edit buttons
      if (target && target.classList.contains('dom-edit-btn')) {
        console.log('DOM Edit button clicked');
        e.preventDefault();
        e.stopPropagation();
        
        const locationId = target.getAttribute('data-location-id');
        console.log('Location ID from edit button:', locationId);
        
        if (locationId && this.locationMap.has(locationId)) {
          const location = this.locationMap.get(locationId)!;
          console.log('Opening edit popup for location:', location);
          
          setTimeout(() => {
            this.openEdit(location);
            this.showPopup = true;
            console.log('Popup should be visible now:', this.showPopup);
            
            // Force modal display using DOM manipulation
            this.forceModalDisplay(location);
          }, 0);
        } else {
          console.log('Location not found in map for ID:', locationId);
        }
      }
    });
  }

  forceModalDisplay(location: LocationMaster): void {
    console.log('Forcing modal display for location:', location);
    
    // Check if Angular modal is visible
    setTimeout(() => {
      const angularModal = document.querySelector('.modal');
      if (!angularModal || angularModal.getAttribute('style')?.includes('display: none') || 
          getComputedStyle(angularModal).display === 'none') {
        console.log('Creating modal via DOM manipulation');
        this.createDOMModal(location);
      }
    }, 100);
  }

  createDOMModal(location: LocationMaster): void {
    // Remove any existing DOM modal
    const existingModal = document.getElementById('dom-modal-location');
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'dom-modal-location';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: white;
      padding: 20px;
      border-radius: 8px;
      width: 400px;
      max-width: 90%;
    `;

    const stateOptions = this.states.map(state => 
      `<option value="${state}" ${state === location.state ? 'selected' : ''}>${state}</option>`
    ).join('');

    modalContent.innerHTML = `
      <h3>Edit Location</h3>
      <form id="dom-location-form">
        <label style="display: block; margin-bottom: 10px;">
          Location
          <input type="text" id="dom-location-name" value="${location.location}" style="width: 100%; padding: 8px; margin-top: 5px; border: 1px solid #ccc; border-radius: 4px;" />
        </label>
        <label style="display: block; margin-bottom: 15px;">
          State
          <select id="dom-location-state" style="width: 100%; padding: 8px; margin-top: 5px; border: 1px solid #ccc; border-radius: 4px;">
            ${stateOptions}
          </select>
        </label>
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
          <button type="button" id="dom-save-location" style="background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Save</button>
          <button type="button" id="dom-cancel-location" style="background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Cancel</button>
        </div>
      </form>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Add event handlers
    const saveBtn = document.getElementById('dom-save-location');
    const cancelBtn = document.getElementById('dom-cancel-location');
    const nameInput = document.getElementById('dom-location-name') as HTMLInputElement;
    const stateSelect = document.getElementById('dom-location-state') as HTMLSelectElement;

    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        const updatedLocation = {
          location: nameInput.value,
          state: stateSelect.value
        };
        
        this.http.put(`${environment.apiUrl}/locationmaster/${location.id}`, updatedLocation).subscribe({
          next: () => {
            alert('Location updated successfully');
            modal.remove();
            this.loadLocations();
          },
          error: (err) => {
            console.error('Failed to update location', err);
            alert('Failed to update location. Please try again.');
          }
        });
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        console.log('Canceling edit');
        modal.remove();
      });
    }
  }

  updateDOMDirectly(): void {
    console.log('Angular template not rendered, using DOM fallback');
    
    const tableBody = document.querySelector('.locationmaster tbody');
    if (tableBody && this.locations.length > 0) {
      // Clear existing content
      tableBody.innerHTML = '';
      
      // Create table rows with proper styling
      this.locations.forEach((location, index) => {
        const locationId = `location_${index}_${Date.now()}`;
        this.locationMap.set(locationId, location);
        
        const row = document.createElement('tr');
        row.innerHTML = `
          <td style="border: 1px solid #ccc; padding: 0.5rem; text-align: left;">${location.location || 'Unknown Location'}</td>
          <td style="border: 1px solid #ccc; padding: 0.5rem; text-align: left;">${location.state || ''}</td>
          <td style="border: 1px solid #ccc; padding: 0.5rem; text-align: left;">
            <button class="edit-btn dom-edit-btn" data-location-id="${locationId}" style="background: #007bff; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Edit</button>
          </td>
        `;
        
        tableBody.appendChild(row);
      });
      
      console.log(`DOM fallback: Created ${this.locations.length} location rows`);
    } else {
      console.log('No table body found or no locations to display');
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const body = this.form.value;
    if (this.editingLocationId == null) {
      // Add new location
      this.http.post(`${environment.apiUrl}/locationmaster`, body).subscribe({
        next: () => {
          alert('Location added successfully');
          this.closeModal();
          this.loadLocations();
        },
        error: (err) => {
          console.error('Failed to add location', err);
          alert('Failed to add location. Please try again.');
        },
      });
    } else {
      // Update existing location
      this.http
        .put(`${environment.apiUrl}/locationmaster/${this.editingLocationId}`, body)
        .subscribe({
          next: () => {
            alert('Location updated successfully');
            this.closeModal();
            this.loadLocations();
          },
          error: (err) => {
            console.error('Failed to update location', err);
            alert('Failed to update location. Please try again.');
          },
        });
    }
  }
}
