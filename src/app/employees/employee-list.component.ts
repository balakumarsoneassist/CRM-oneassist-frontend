import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

interface Employee {
  id: number;
  name: string;
  emailid: string;
  mobilenumber: string;
  dept: string;
  designation: string;
  isactive: boolean;
}

interface Branch {
  id: number;
  location: string;
}

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './employee-list.component.html',
  styleUrls: ['./employee-list.component.css']
})
export class EmployeeListComponent implements OnInit {
  employees: Employee[] = [];
  branches: Branch[] = [];
  showPopup = false;
  form!: FormGroup;
  editingEmployeeId: number | null = null;
  loading = true;
  showContent = false;
  lastUpdate = Date.now();
  editEmployeeHandler!: (employeeId: number) => void;

  constructor(
    private http: HttpClient, 
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.loadEmployees();
    this.loadBranches();
    this.initForm();
    this.setupEditHandler();
  }

  private initForm(): void {
    this.form = this.fb.group({
      name: ['', Validators.required],
      qualification: [''],
      dateofbirth: ['', Validators.required],
      joindate: [''],
      presentaddress: [''],
      permanentaddress: [''],
      emailid: ['', [Validators.required, Validators.email]],
      designation: [''],
      mobilenumber: [''],
      contactperson: [''],
      contactnumber: [''],
      logintime: [null],
      oldpassword: [''],
      isactive: [true],
      isadminrights: [false],
      isleadrights: [false],
      iscontactrights: [false],
      iscibilrights: [false],
      isicicirights: [false],
      organizationid: [null],
      dept: [''],
      issplrights: [false],
      isreassignrights: [false]
    });
  }

  private formatDateToYYYYMMDD(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
  }

  private loadEmployees(): void {
    this.loading = true;
    this.http.get<Employee[]>(`${environment.apiUrl}/employees`).subscribe({
      next: (data) => {
        this.employees = data;
        // Apply direct DOM manipulation fix for Angular change detection issues
        setTimeout(() => {
          this.loading = false;
          this.employees = [...this.employees];
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
        console.error('Failed to load employees', err);
        this.loading = false;
      },
    });
  }

  private loadBranches(): void {
    this.http.get<Branch[]>(`${environment.apiUrl}/branchmaster`).subscribe({
      next: (data) => (this.branches = data),
      error: (err) => console.error('Failed to load branches', err),
    });
  }

  openAdd(): void {
    this.editingEmployeeId = null;
    this.form.reset();
    this.form.patchValue({ isactive: true });
    this.showPopup = true;
  }

  openEdit(employee: Employee): void {
    this.editingEmployeeId = employee.id;
    // Load full employee data for editing
    this.http.get<any>(`${environment.apiUrl}/employees/${employee.id}`).subscribe({
      next: (data) => {
     
        this.form.patchValue({
          name: data.name || '',
          qualification: data.qualification || '',
          dateofbirth: data.dateofbirth ? this.formatDateToYYYYMMDD(data.dateofbirth) : '',
          joindate: data.joindate ? this.formatDateToYYYYMMDD(data.joindate) : '',
          presentaddress: data.presentaddress || '',
          permanentaddress: data.permanentaddress || '',
          emailid: data.emailid || '',
          designation: data.designation || '',
          mobilenumber: data.mobilenumber || '',
          contactperson: data.contactperson || '',
          contactnumber: data.contactnumber || '',
          logintime: data.logintime,
          oldpassword: data.oldpassword || '',
          isactive: data.isactive || false,
          isadminrights: data.isadminrights || false,
          isleadrights: data.isleadrights || false,
          iscontactrights: data.iscontactrights || false,
          iscibilrights: data.iscibilrights || false,
          isicicirights: data.isicicirights || false,
          organizationid: data.organizationid,
          dept: data.dept || '',
          issplrights: data.issplrights || false,
          isreassignrights: data.isreassignrights || false
        });
        this.showPopup = true;
      },
      error: (err) => {
        console.error('Failed to load employee details', err);
        alert('Failed to load employee details.');
      }
    });
  }

  close(): void {
    this.showPopup = false;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = {
      ...this.form.value,
      dateofbirth: this.form.value.dateofbirth ? this.form.value.dateofbirth + " 00:00:00" : null,
      joindate: this.form.value.joindate ? this.form.value.joindate + " 00:00:00" : null,
    };

    if (this.editingEmployeeId == null) {
      // Add new employee
      this.http.post(`${environment.apiUrl}/employees`, payload).subscribe({
        next: () => {
          alert('Employee added successfully');
          this.close();
          this.loadEmployees();
        },
        error: (err) => {
          console.error('Failed to add employee', err);
          alert('Failed to add employee. Please try again.');
        },
      });
    } else {
      // Update existing employee
      this.http
        .put(`${environment.apiUrl}/employees/${this.editingEmployeeId}`, payload)
        .subscribe({
          next: () => {
            alert('Employee updated successfully');
            this.close();
            this.loadEmployees();
          },
          error: (err) => {
            console.error('Failed to update employee', err);
            alert('Failed to update employee. Please try again.');
          },
        });
    }
  }

  private setupEditHandler(): void {
    // This method sets up the global edit handler function
    // The actual implementation is done in updateDOMDirectly() method
    // This is just a placeholder to satisfy the ngOnInit call
  }

  // Direct DOM manipulation method to bypass Angular change detection issues
  updateDOMDirectly(): void {
    const loadingBox = document.getElementById('loading-box');
    const employeeContainer = document.getElementById('employee-container');
    const employeeTable = document.getElementById('employee-table');
    
    // Hide loading, show content
    if (loadingBox) loadingBox.style.display = 'none';
    
    // Display actual employee table with full styling
    if (employeeContainer && employeeTable) {
      employeeContainer.style.display = 'block';
      
      // Generate employee table HTML
      let tableHTML = `
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <thead>
            <tr style="background: var(--primary-color, #007bff); color: white;">
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Name</th>
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Email</th>
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Phone</th>
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Department</th>
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Position</th>
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Status</th>
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Actions</th>
            </tr>
          </thead>
          <tbody>
      `;
      
      this.employees.forEach((employee, index) => {
        const rowColor = index % 2 === 0 ? '#f8f9fa' : 'white';
        const statusColor = employee.isactive ? '#28a745' : '#dc3545';
        const statusText = employee.isactive ? 'Active' : 'Inactive';
        
        tableHTML += `
          <tr style="background: ${rowColor}; transition: background-color 0.2s;" 
              onmouseover="this.style.background='#e3f2fd'" 
              onmouseout="this.style.background='${rowColor}'">
            <td style="padding: 12px; border-bottom: 1px solid #ddd;">
              <strong>${employee.name || 'N/A'}</strong>
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #ddd;">${employee.emailid || 'N/A'}</td>
            <td style="padding: 12px; border-bottom: 1px solid #ddd;">${employee.mobilenumber || 'N/A'}</td>
            <td style="padding: 12px; border-bottom: 1px solid #ddd;">${employee.dept || 'N/A'}</td>
            <td style="padding: 12px; border-bottom: 1px solid #ddd;">${employee.designation || 'N/A'}</td>
            <td style="padding: 12px; border-bottom: 1px solid #ddd;">
              <span style="background: ${statusColor}; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px;">
                ${statusText}
              </span>
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #ddd;">
              <button onclick="window.editEmployee(${employee.id}); return false;" 
                      onmousedown="window.editEmployee(${employee.id}); return false;"
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
      
      employeeTable.innerHTML = tableHTML;
      
      // Set up global edit function with immediate binding and proper context
      const self = this;
      
      // Clear any existing function first
      delete (window as any).editEmployee;
      
      // Set up the global function with immediate execution capability
      (window as any).editEmployee = function(employeeId: number) {
        try {
          const employee = self.employees.find(emp => emp.id === employeeId);
          if (employee) {
            self.openEditWithDirectDOM(employee);
          }
        } catch (error) {
          console.error('Error in editEmployee:', error);
        }
        return false;
      };
      
      // Also bind to component instance for backup
      this.editEmployeeHandler = (employeeId: number) => {
        const employee = this.employees.find(emp => emp.id === employeeId);
        if (employee) {
          this.openEdit(employee);
        }
      };
    }
  }

  // Direct DOM manipulation method for opening edit modal
  openEditWithDirectDOM(employee: Employee): void {
    // Set the editing state
    this.editingEmployeeId = employee.id;
    
    // Load full employee data first
    this.http.get<any>(`${environment.apiUrl}/employees/${employee.id}`).subscribe({
      next: (data) => {
        
        // Populate the form
        this.form.patchValue({
          name: data.name || '',
          qualification: data.qualification || '',
          dateofbirth: data.dateofbirth ? this.formatDateToYYYYMMDD(data.dateofbirth) : '',
          joindate: data.joindate ? this.formatDateToYYYYMMDD(data.joindate) : '',
          presentaddress: data.presentaddress || '',
          permanentaddress: data.permanentaddress || '',
          emailid: data.emailid || '',
          designation: data.designation || '',
          mobilenumber: data.mobilenumber || '',
          contactperson: data.contactperson || '',
          contactnumber: data.contactnumber || '',
          logintime: data.logintime,
          oldpassword: data.oldpassword || '',
          isactive: data.isactive || false,
          isadminrights: data.isadminrights || false,
          isleadrights: data.isleadrights || false,
          iscontactrights: data.iscontactrights || false,
          iscibilrights: data.iscibilrights || false,
          isicicirights: data.isicicirights || false,
          organizationid: data.organizationid,
          dept: data.dept || '',
          issplrights: data.issplrights || false,
          isreassignrights: data.isreassignrights || false
        });
        
        // Show modal using direct DOM manipulation
        this.showModalDirectly();
      },
      error: (err) => {
        console.error('Failed to load employee details', err);
        alert('Failed to load employee details.');
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
}
