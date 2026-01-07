import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { SessionMonitorService } from '../services/session-monitor.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <h2>CRM Login</h2>
          <p>Please sign in to your account</p>
        </div>
        
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
          <div class="form-group">
            <label for="username">Username</label>
            <input 
              type="text" 
              id="username"
              formControlName="username"
              class="form-control"
              [class.error]="loginForm.get('username')?.invalid && loginForm.get('username')?.touched"
              placeholder="Enter your username">
            <div class="error-message" *ngIf="loginForm.get('username')?.invalid && loginForm.get('username')?.touched">
              Username is required
            </div>
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input 
              type="password" 
              id="password"
              formControlName="password"
              class="form-control"
              [class.error]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched"
              placeholder="Enter your password">
            <div class="error-message" *ngIf="loginForm.get('password')?.invalid && loginForm.get('password')?.touched">
              Password is required
            </div>
          </div>

          <div class="form-actions">
            <button 
              type="submit" 
              class="btn btn-primary"
              [disabled]="loginForm.invalid || isLoading">
              <span *ngIf="isLoading">Signing in...</span>
              <span *ngIf="!isLoading">Sign In</span>
            </button>
          </div>

          <div class="error-message" *ngIf="errorMessage">
            {{ errorMessage }}
          </div>
        </form>

        <div class="session-info">
          <small>Session will automatically expire after 30 minutes of inactivity</small>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .login-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
      padding: 2rem;
      width: 100%;
      max-width: 400px;
    }

    .login-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .login-header h2 {
      color: #333;
      margin-bottom: 0.5rem;
      font-size: 1.8rem;
    }

    .login-header p {
      color: #666;
      margin: 0;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      color: #333;
      font-weight: 500;
    }

    .form-control {
      width: 100%;
      padding: 12px;
      border: 2px solid #e1e5e9;
      border-radius: 6px;
      font-size: 16px;
      transition: border-color 0.3s ease;
      box-sizing: border-box;
    }

    .form-control:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
    }

    .form-control.error {
      border-color: #dc3545;
    }

    .error-message {
      color: #dc3545;
      font-size: 0.875rem;
      margin-top: 0.5rem;
    }

    .form-actions {
      margin-top: 2rem;
    }

    .btn {
      width: 100%;
      padding: 12px;
      border: none;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-primary {
      background: #007bff;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #0056b3;
      transform: translateY(-1px);
    }

    .btn:disabled {
      background: #6c757d;
      cursor: not-allowed;
      transform: none;
    }

    .session-info {
      text-align: center;
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid #e1e5e9;
    }

    .session-info small {
      color: #666;
    }
  `]
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  returnUrl = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private sessionMonitor: SessionMonitorService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Get return url from route parameters or default to dashboard
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';

    // Redirect if already logged in
    if (this.authService.isLoggedIn()) {
      this.router.navigate([this.returnUrl]);
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { username, password } = this.loginForm.value;

    this.authService.login(username, password).subscribe({
      next: (response) => {
        this.isLoading = false;
        
        if (response.token && response.user) {
          // Start session monitoring after successful login
          this.sessionMonitor.startMonitoring();
          
          // Navigate to return URL or dashboard
          this.router.navigate([this.returnUrl]);
        } else {
          this.errorMessage = 'Login failed. Please check your credentials and try again.';
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Login error:', error);
        this.errorMessage = 'Login failed. Please check your credentials and try again.';
      }
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }
}
