import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css']
})
export class ChangePasswordComponent {
  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  loading = false;
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  
  errors = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    general: ''
  };

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  togglePasswordVisibility(field: string): void {
    switch (field) {
      case 'current':
        this.showCurrentPassword = !this.showCurrentPassword;
        break;
      case 'new':
        this.showNewPassword = !this.showNewPassword;
        break;
      case 'confirm':
        this.showConfirmPassword = !this.showConfirmPassword;
        break;
    }
  }

  validateForm(): boolean {
    this.clearErrors();
    let isValid = true;

    // Validate current password
    if (!this.passwordForm.currentPassword.trim()) {
      this.errors.currentPassword = 'Current password is required';
      isValid = false;
    }

    // Validate new password
    if (!this.passwordForm.newPassword.trim()) {
      this.errors.newPassword = 'New password is required';
      isValid = false;
    } else if (this.passwordForm.newPassword.length < 6) {
      this.errors.newPassword = 'New password must be at least 6 characters long';
      isValid = false;
    } else if (this.passwordForm.newPassword === this.passwordForm.currentPassword) {
      this.errors.newPassword = 'New password must be different from current password';
      isValid = false;
    }

    // Validate confirm password
    if (!this.passwordForm.confirmPassword.trim()) {
      this.errors.confirmPassword = 'Please confirm your new password';
      isValid = false;
    } else if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      this.errors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    return isValid;
  }

  clearErrors(): void {
    this.errors = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      general: ''
    };
  }

  onSubmit(): void {
    if (!this.validateForm()) {
      return;
    }

    this.loading = true;
    this.clearErrors();

    const userId = localStorage.getItem('usernameID') || '';
    const organizationId = localStorage.getItem('organizationid') || '';

    const changePasswordData = {
      username: userId,
      currentpassword: this.passwordForm.currentPassword,
      newpassword: this.passwordForm.newPassword
    };

    // API call to change password
    this.http.post<any>(`${environment.apiUrl}/changepassword`, changePasswordData).subscribe({
      next: (response) => {
        console.log('Change password response:', response);
        
        if (response && response.message && response.message.includes('successfully')) {
          alert('Password changed successfully!');
          this.resetForm();
          this.router.navigate(['/dashboard/profile']);
        } else {
          this.errors.general = response?.message || 'Failed to change password. Please try again.';
        }
        
        this.loading = false;
      },
      error: (err) => {
        console.error('Change password error:', err);
        
        if (err.status === 401) {
          this.errors.currentPassword = 'Current password is incorrect';
        } else if (err.error && err.error.message) {
          this.errors.general = err.error.message;
        } else {
          this.errors.general = 'Failed to change password. Please try again.';
        }
        
        this.loading = false;
      }
    });
  }

  resetForm(): void {
    this.passwordForm = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
    this.clearErrors();
  }

  goBack(): void {
    this.router.navigate(['/dashboard/profile']);
  }

  generateStrongPassword(): void {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.passwordForm.newPassword = password;
    this.passwordForm.confirmPassword = password;
  }
}
