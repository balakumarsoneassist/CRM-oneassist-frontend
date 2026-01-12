import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadBanks();
    this.initForm();
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
        this.loading = false;
        this.showContent = true;
        this.cdr.detectChanges();
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
          this.close();
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
          this.close();
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




}
