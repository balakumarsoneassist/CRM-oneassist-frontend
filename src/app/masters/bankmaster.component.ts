import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

interface Bank {
  id: number;
  bankname: string;
}

@Component({
  selector: 'app-bankmaster',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './bankmaster.component.html',
  styleUrls: ['./bankmaster.component.css']
})
export class BankmasterComponent implements OnInit {
  banks: Bank[] = [];
  showPopup = false;
  form!: FormGroup;
  editingBankId: number | null = null;
  loading = true;
  showContent = false;
  lastUpdate = Date.now();
  private bankMap = new Map<string, Bank>();

  constructor(private http: HttpClient, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.loadBanks();
    this.initForm();
    this.setupGlobalEditHandler();
  }

  private initForm(): void {
    this.form = this.fb.group({
      bankname: ['', Validators.required]
    });
  }

  private loadBanks(): void {
    this.loading = true;
    this.showContent = false;
    
    this.http.get<any>(`${environment.apiUrl}/bankmaster`).subscribe({
      next: raw => {
        this.banks = Array.isArray(raw) ? raw : Object.values(raw ?? {});
        
        // Ensure proper display after data loads
        setTimeout(() => {
          this.loading = false;
          this.showContent = true;
          this.lastUpdate = Date.now();
          
          // Force Angular change detection by triggering multiple property updates
          this.banks = [...this.banks]; // Create new array reference
          
          // Force multiple change detection cycles
          setTimeout(() => {
            this.loading = false; // Reassign to trigger change detection
            setTimeout(() => {
              this.showContent = true; // Reassign again
              setTimeout(() => {
                // Check if Angular template rendered
                const angularRows = document.querySelectorAll('.bankmaster table tbody tr');
                if (angularRows.length === 0) {
                  console.log('Angular template not rendered, using DOM fallback');
                  this.updateDOMDirectly();
                } else {
                  console.log('Angular template rendered successfully with', angularRows.length, 'rows');
                }
              }, 50);
            }, 50);
          }, 50);
        }, 100);
      },
      error: err => {
        console.error('Failed to load banks:', err);
        this.loading = false;
        this.showContent = true;
        this.banks = [];
        alert('Failed to load banks. Please try again.');
      }
    });
  }

  openAdd(): void {
    this.editingBankId = null;
    this.form.reset();
    this.showPopup = true;
  }

  openEdit(bank: Bank): void {
    this.editingBankId = bank.id;
    this.form.patchValue({ bankname: bank.bankname });
    this.showPopup = true;
  }

  close(): void {
    this.showPopup = false;
  }

  // TrackBy function for better performance
  trackByBankId(index: number, bank: Bank): number {
    return bank.id;
  }

  // Force modal to display using DOM manipulation when Angular fails
  private forceModalDisplay(bank: Bank): void {
    console.log('Forcing modal display for bank:', bank);
    
    // Check if Angular modal exists
    const existingModal = document.querySelector('.modal');
    if (existingModal) {
      console.log('Angular modal found, making it visible');
      (existingModal as HTMLElement).style.display = 'flex';
      return;
    }
    
    // Create modal using DOM manipulation
    console.log('Creating modal via DOM manipulation');
    const modalHtml = `
      <div class="modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
        <div class="modal-content" style="background: #fff; padding: 1.5rem; max-width: 400px; width: 90%; border-radius: 4px;">
          <h3>${this.editingBankId === null ? 'Add Bank' : 'Edit Bank'}</h3>
          <form id="bank-form">
            <label style="display: flex; flex-direction: column; margin-bottom: 0.75rem;">
              Bank Name
              <input type="text" id="bank-name-input" value="${bank.bankname}" style="padding: 0.5rem; border: 1px solid #ccc; border-radius: 3px;" />
            </label>
            <div class="buttons" style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1rem;">
              <button type="button" id="save-btn" style="background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Save</button>
              <button type="button" id="cancel-btn" class="secondary" style="background: #eee; color: black; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    `;
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Add event listeners
    const saveBtn = document.getElementById('save-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const nameInput = document.getElementById('bank-name-input') as HTMLInputElement;
    
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        const newName = nameInput.value;
        console.log('Saving bank with name:', newName);
        // Update the bank name and close modal
        this.updateBankName(bank.id, newName);
        this.closeModal();
      });
    }
    
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        console.log('Canceling edit');
        this.closeModal();
      });
    }
  }
  
  // Close modal (both Angular and DOM versions)
  private closeModal(): void {
    this.showPopup = false;
    
    // Remove DOM-created modal
    const domModal = document.querySelector('.modal');
    if (domModal && !domModal.hasAttribute('ng-reflect-ng-if')) {
      domModal.remove();
    }
  }
  
  // Update bank name via API
  private updateBankName(bankId: number, newName: string): void {
    const body = { bankname: newName };
    this.http.put(`${environment.apiUrl}/bankmaster/${bankId}`, body).subscribe({
      next: () => {
        alert('Bank updated successfully');
        this.loadBanks(); // Reload the data
      },
      error: err => {
        console.error('Failed to update bank', err);
        alert('Failed to update bank. Please try again.');
      }
    });
  }

  // Global edit handler for DOM-manipulated buttons
  private setupGlobalEditHandler(): void {
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      
      // Handle edit buttons
      if (target && target.classList.contains('dom-edit-btn')) {
        console.log('DOM Edit button clicked');
        e.preventDefault();
        e.stopPropagation();
        
        const bankId = target.getAttribute('data-bank-id');
        console.log('Bank ID from edit button:', bankId);
        
        if (bankId && this.bankMap.has(bankId)) {
          const bank = this.bankMap.get(bankId)!;
          console.log('Opening edit popup for bank:', bank);
          // Force Angular to detect changes by using setTimeout
          setTimeout(() => {
            this.openEdit(bank);
            // Force update by reassigning showPopup
            this.showPopup = true;
            console.log('Popup should be visible now:', this.showPopup);
            // Force modal to show using DOM manipulation
            this.forceModalDisplay(bank);
          }, 0);
        } else {
          console.log('Bank not found in map for ID:', bankId);
        }
      }
      

    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const body = this.form.value;
    if (this.editingBankId == null) {
      // Add new bank
      this.http.post(`${environment.apiUrl}/bankmaster`, body).subscribe({
        next: () => {
          alert('Bank added successfully');
          this.closeModal();
          this.form.reset();
          this.loadBanks();
        },
        error: err => {
          console.error('Failed to add bank', err);
          alert('Failed to add bank. Please try again.');
        }
      });
    } else {
      // Update existing bank
      this.http.put(`${environment.apiUrl}/bankmaster/${this.editingBankId}`, body).subscribe({
        next: () => {
          alert('Bank updated successfully');
          this.closeModal();
          this.form.reset();
          this.editingBankId = null;
          this.loadBanks();
        },
        error: err => {
          console.error('Failed to update bank', err);
          alert('Failed to update bank. Please try again.');
        }
      });
    }
  }



  // Direct DOM manipulation to ensure data displays properly
  private updateDOMDirectly(): void {
    const tableBody = document.querySelector('.bankmaster tbody');
    const loadingIndicator = document.getElementById('loading-indicator');
    const table = document.querySelector('.bankmaster table');
    
    // Hide loading indicator
    if (loadingIndicator) {
      loadingIndicator.style.display = 'none';
    }
    
    // Show table if hidden
    if (table) {
      (table as HTMLElement).style.display = 'table';
    }
    
    if (tableBody && this.banks.length > 0) {
      // Clear existing content
      tableBody.innerHTML = '';
      
      // Generate table rows directly with proper styling
      this.banks.forEach((bank, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td style="border: 1px solid #ccc; padding: 0.5rem; text-align: left;">${bank.bankname || 'Unknown Bank'}</td>
          <td style="border: 1px solid #ccc; padding: 0.5rem; text-align: left;">
            <button class="edit-btn dom-edit-btn" data-bank-id="${`bank_${index}_${Date.now()}`}" style="background: #007bff; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Edit</button>
          </td>
        `;
        
        // Store bank in map and set data attribute
        const bankId = `bank_${index}_${Date.now()}`;
        this.bankMap.set(bankId, bank);
        
        // Add data attribute to button for global handler
        const editBtn = row.querySelector('button');
        if (editBtn) {
          editBtn.setAttribute('data-bank-id', bankId);
          editBtn.classList.add('dom-edit-btn');
        }
        
        tableBody.appendChild(row);
      });
    } else {
      // Fallback: create the entire table structure
      const container = document.querySelector('.bankmaster');
      if (container && this.banks.length > 0) {
        // Remove existing table if any
        const existingTable = container.querySelector('table');
        if (existingTable) {
          existingTable.remove();
        }
        
        // Create new table with proper styling
        const newTable = document.createElement('table');
        newTable.style.width = '100%';
        newTable.style.borderCollapse = 'collapse';
        newTable.innerHTML = `
          <thead>
            <tr>
              <th style="border: 1px solid #ccc; padding: 0.5rem; text-align: left; background-color: #f5f5f5;">Bank Name</th>
              <th style="border: 1px solid #ccc; padding: 0.5rem; text-align: left; background-color: #f5f5f5;">Actions</th>
            </tr>
          </thead>
          <tbody></tbody>
        `;
        
        const tbody = newTable.querySelector('tbody');
        if (tbody) {
          this.banks.forEach((bank, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
              <td style="border: 1px solid #ccc; padding: 0.5rem; text-align: left;">${bank.bankname || 'Unknown Bank'}</td>
              <td style="border: 1px solid #ccc; padding: 0.5rem; text-align: left;">
                <button class="edit-btn dom-edit-btn" data-bank-id="${`bank_${index}_${Date.now()}`}" style="background: #007bff; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Edit</button>
              </td>
            `;
            
            // Store bank in map and set data attribute
            const bankId = `bank_${index}_${Date.now()}`;
            this.bankMap.set(bankId, bank);
            
            // Add data attribute to button for global handler
            const editBtn = row.querySelector('button');
            if (editBtn) {
              editBtn.setAttribute('data-bank-id', bankId);
              editBtn.classList.add('dom-edit-btn');
            }
            
            tbody.appendChild(row);
          });
        }
        
        container.appendChild(newTable);
      }
    }
  }
}
