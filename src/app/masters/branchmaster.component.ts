import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

interface Branch {
  id: number;
  name: string;
  location: string;
  isactive: boolean;
}

@Component({
  selector: 'app-branchmaster',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './branchmaster.component.html',
  styleUrls: ['./branchmaster.component.css']
})
export class BranchmasterComponent implements OnInit {
  branches: Branch[] = [];
  showPopup = false;
  form!: FormGroup;
  editingBranchId: number | null = null;
  loading = false;
  showContent = false;
  lastUpdate = Date.now();
  branchMap = new Map<string, Branch>();

  constructor(private http: HttpClient, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.loadBranches();
    this.initForm();
    this.setupGlobalEventHandlers();
  }

  private initForm(): void {
    this.form = this.fb.group({
      name: ['', Validators.required],
      location: [''],
      isactive: [false]
    });
  }

  private loadBranches(): void {
    this.loading = true;
    this.showContent = false;
    this.lastUpdate = Date.now();
    
    this.http.get<Branch[]>(`${environment.apiUrl}/branchmaster`).subscribe({
      next: (data) => {
        this.branches = data;
        console.log('Branches loaded:', data.length);
        
        // Populate branch map for DOM event handling
        this.branchMap.clear();
        
        // Multiple change detection attempts
        setTimeout(() => {
          this.loading = false;
          this.branches = [...this.branches];
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
        console.error('Failed to load branches', err);
        this.loading = false;
      },
    });
  }

  openAdd(): void {
    this.editingBranchId = null;
    this.form.reset();
    this.showPopup = true;
  }

  openEdit(branch: Branch): void {
    this.editingBranchId = branch.id;
    this.form.patchValue({
      name: branch.name,
      location: branch.location,
      isactive: branch.isactive,
    });
    this.showPopup = true;
  }

  close(): void {
    this.showPopup = false;
  }

  closeModal(): void {
    this.showPopup = false;
    // Also remove any DOM-created modals
    const domModal = document.getElementById('dom-modal-branch');
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
        
        const branchId = target.getAttribute('data-branch-id');
        console.log('Branch ID from edit button:', branchId);
        
        if (branchId && this.branchMap.has(branchId)) {
          const branch = this.branchMap.get(branchId)!;
          console.log('Opening edit popup for branch:', branch);
          
          setTimeout(() => {
            this.openEdit(branch);
            this.showPopup = true;
            console.log('Popup should be visible now:', this.showPopup);
            
            // Force modal display using DOM manipulation
            this.forceModalDisplay(branch);
          }, 0);
        } else {
          console.log('Branch not found in map for ID:', branchId);
        }
      }
    });
  }

  forceModalDisplay(branch: Branch): void {
    console.log('Forcing modal display for branch:', branch);
    
    // Check if Angular modal is visible
    setTimeout(() => {
      const angularModal = document.querySelector('.modal');
      if (!angularModal || angularModal.getAttribute('style')?.includes('display: none') || 
          getComputedStyle(angularModal).display === 'none') {
        console.log('Creating modal via DOM manipulation');
        this.createDOMModal(branch);
      }
    }, 100);
  }

  createDOMModal(branch: Branch): void {
    // Remove any existing DOM modal
    const existingModal = document.getElementById('dom-modal-branch');
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'dom-modal-branch';
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

    modalContent.innerHTML = `
      <h3>Edit Branch</h3>
      <form id="dom-branch-form">
        <label style="display: block; margin-bottom: 10px;">
          Name
          <input type="text" id="dom-branch-name" value="${branch.name}" style="width: 100%; padding: 8px; margin-top: 5px; border: 1px solid #ccc; border-radius: 4px;" />
        </label>
        <label style="display: block; margin-bottom: 10px;">
          Location
          <input type="text" id="dom-branch-location" value="${branch.location}" style="width: 100%; padding: 8px; margin-top: 5px; border: 1px solid #ccc; border-radius: 4px;" />
        </label>
        <label style="display: block; margin-bottom: 15px;">
          <input type="checkbox" id="dom-branch-isactive" ${branch.isactive ? 'checked' : ''}> Is Active
        </label>
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
          <button type="button" id="dom-save-branch" style="background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Save</button>
          <button type="button" id="dom-cancel-branch" style="background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Cancel</button>
        </div>
      </form>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Add event handlers
    const saveBtn = document.getElementById('dom-save-branch');
    const cancelBtn = document.getElementById('dom-cancel-branch');
    const nameInput = document.getElementById('dom-branch-name') as HTMLInputElement;
    const locationInput = document.getElementById('dom-branch-location') as HTMLInputElement;
    const isActiveInput = document.getElementById('dom-branch-isactive') as HTMLInputElement;

    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        const updatedBranch = {
          name: nameInput.value,
          location: locationInput.value,
          isactive: isActiveInput.checked
        };
        
        this.http.put(`${environment.apiUrl}/branchmaster/${branch.id}`, updatedBranch).subscribe({
          next: () => {
            alert('Branch updated successfully');
            modal.remove();
            this.loadBranches();
          },
          error: (err) => {
            console.error('Failed to update branch', err);
            alert('Failed to update branch. Please try again.');
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
    
    const tableBody = document.querySelector('.branchmaster tbody');
    if (tableBody && this.branches.length > 0) {
      // Clear existing content
      tableBody.innerHTML = '';
      
      // Create table rows with proper styling
      this.branches.forEach((branch, index) => {
        const branchId = `branch_${index}_${Date.now()}`;
        this.branchMap.set(branchId, branch);
        
        const row = document.createElement('tr');
        row.innerHTML = `
          <td style="border: 1px solid #ccc; padding: 0.5rem; text-align: left;">${branch.name || 'Unknown Branch'}</td>
          <td style="border: 1px solid #ccc; padding: 0.5rem; text-align: left;">${branch.location || ''}</td>
          <td style="border: 1px solid #ccc; padding: 0.5rem; text-align: left;">${branch.isactive ? 'Yes' : 'No'}</td>
          <td style="border: 1px solid #ccc; padding: 0.5rem; text-align: left;">
            <button class="edit-btn dom-edit-btn" data-branch-id="${branchId}" style="background: #007bff; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Edit</button>
          </td>
        `;
        
        tableBody.appendChild(row);
      });
      
      console.log(`DOM fallback: Created ${this.branches.length} branch rows`);
    } else {
      console.log('No table body found or no branches to display');
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const body = this.form.value;
    if (this.editingBranchId == null) {
      // Add new branch
      this.http.post(`${environment.apiUrl}/branchmaster`, body).subscribe({
        next: () => {
          alert('Branch added successfully');
          this.closeModal();
          this.loadBranches();
        },
        error: (err) => {
          console.error('Failed to add branch', err);
          alert('Failed to add branch. Please try again.');
        },
      });
    } else {
      // Update existing branch
      this.http
        .put(`${environment.apiUrl}/branchmaster/${this.editingBranchId}`, body)
        .subscribe({
          next: () => {
            alert('Branch updated successfully');
            this.closeModal();
            this.loadBranches();
          },
          error: (err) => {
            console.error('Failed to update branch', err);
            alert('Failed to update branch. Please try again.');
          },
        });
    }
  }
}
