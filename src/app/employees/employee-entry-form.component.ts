import { Component } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

interface Branch { id: number; location: string; }

@Component({
  selector: 'app-employee-entry-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './employee-entry-form.component.html',
  styleUrls: ['./employee-entry-form.component.css']
})

export class EmployeeEntryFormComponent {
  form!: FormGroup;
  branches: Branch[] = [];

  constructor(private fb: FormBuilder, private http: HttpClient) {
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
      //password: ['', Validators.required],
      //resetpasswordexpiry: [''],
      //resetpasswordkey: [''],
      isactive: [false],
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
    this.loadBranches();
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
    } as any;

    this.http.post(`${environment.apiUrl}/employees`, payload).subscribe({
      next: () => {
        alert('Employee added successfully!');
        this.form.reset();
      },
      error: (err) => {
        console.error('Failed to add employee', err);
        alert('Failed to add employee. Please try again.');
      },
    });
  }

  private loadBranches(): void {
    this.http.get<Branch[]>(`${environment.apiUrl}/branchmaster`).subscribe({
      next: (data) => (this.branches = data),
      error: (err) => console.error('Failed to load branches', err),
    });
  }
}
