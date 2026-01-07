import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-customer-entry',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './customer-entry.component.html',
  styleUrls: ['./customer-entry.component.css']
})
export class CustomerEntryComponent implements OnInit {
  form!: FormGroup;

  constructor(private http: HttpClient, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.form = this.fb.group({
      // Basic customer information
      name: ['', Validators.required],
      mobileno: ['', Validators.required],
      profession: [''],
      designation: [''],
      location: [''],
      distance: ['', [Validators.min(0)]],
      notes: [''],
      
      // Visit Details section
      dateofvisit: [''],
      nextvisit: [''],
      remarks: ['']
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Prepare data for API call
    const formData = this.form.value;
    const userId = localStorage.getItem('usernameID');
    
    const salesVisitData = {
      ...formData,
      createdby: userId ? parseInt(userId) : null,
      modifiedby: new Date().toISOString(),
      contactflag: false
    };

    console.log('Saving sales visit data:', salesVisitData);

    // Call the API
    this.http.post(`${environment.apiUrl}/savesalesvisit`, salesVisitData).subscribe({
      next: (response) => {
        console.log('Sales visit saved successfully:', response);
        alert('Customer entry saved successfully!');
        this.form.reset();
      },
      error: (error) => {
        console.error('Error saving sales visit:', error);
        alert('Error saving customer entry. Please try again.');
      }
    });
  }
}
