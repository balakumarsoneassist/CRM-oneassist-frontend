import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadBranches();
    this.initForm();
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
        this.loading = false;
        this.showContent = true;
        this.cdr.detectChanges();
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
          this.close();
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
            this.close();
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
