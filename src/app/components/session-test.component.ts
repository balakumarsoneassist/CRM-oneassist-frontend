import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-session-test',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="session-test-container">
      <h3>Session Management Test Panel</h3>
      
      <div class="test-section">
        <h4>Current Session Status</h4>
        <p><strong>Logged In:</strong> {{ isLoggedIn ? 'Yes' : 'No' }}</p>
        <p><strong>Current User:</strong> {{ currentUser?.username || 'None' }}</p>
        <p><strong>Token Present:</strong> {{ hasToken ? 'Yes' : 'No' }}</p>
        <p><strong>Session Expiring Soon:</strong> {{ isExpiringSoon ? 'Yes' : 'No' }}</p>
      </div>

      <div class="test-section">
        <h4>Local Storage Check</h4>
        <p><strong>Auth Token:</strong> {{ tokenInStorage ? 'Present' : 'Missing' }}</p>
        <p><strong>User Data:</strong> {{ userInStorage ? 'Present' : 'Missing' }}</p>
        <p><strong>Last Activity:</strong> {{ lastActivityTime }}</p>
      </div>

      <div class="test-section">
        <h4>Test Actions</h4>
        <button (click)="testApiCall()" class="test-btn">Test API Call (Check Headers)</button>
        <button (click)="refreshSession()" class="test-btn">Refresh Session</button>
        <button (click)="clearSession()" class="test-btn">Clear Session</button>
        <button (click)="checkSessionExpiry()" class="test-btn">Check Expiry Status</button>
      </div>

      <div class="test-section">
        <h4>Test Results</h4>
        <div class="test-results">
          <div *ngFor="let result of testResults" [class]="result.type">
            {{ result.message }}
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .session-test-container {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .test-section {
      background: white;
      padding: 15px;
      margin: 15px 0;
      border-radius: 6px;
      border: 1px solid #dee2e6;
    }

    .test-section h4 {
      margin-top: 0;
      color: #495057;
    }

    .test-btn {
      background: #007bff;
      color: white;
      border: none;
      padding: 8px 16px;
      margin: 5px;
      border-radius: 4px;
      cursor: pointer;
    }

    .test-btn:hover {
      background: #0056b3;
    }

    .test-results {
      max-height: 200px;
      overflow-y: auto;
      border: 1px solid #dee2e6;
      padding: 10px;
      background: #f8f9fa;
    }

    .success {
      color: #28a745;
      margin: 5px 0;
    }

    .error {
      color: #dc3545;
      margin: 5px 0;
    }

    .info {
      color: #17a2b8;
      margin: 5px 0;
    }
  `]
})
export class SessionTestComponent implements OnInit {
  isLoggedIn = false;
  currentUser: any = null;
  hasToken = false;
  isExpiringSoon = false;
  tokenInStorage = false;
  userInStorage = false;
  lastActivityTime = '';
  testResults: Array<{message: string, type: string}> = [];

  constructor(
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.updateStatus();
    
    // Subscribe to auth changes
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isLoggedIn = !!user;
      this.updateStatus();
    });

    this.authService.token$.subscribe(token => {
      this.hasToken = !!token;
      this.updateStatus();
    });
  }

  updateStatus(): void {
    // Check localStorage
    this.tokenInStorage = !!localStorage.getItem('auth_token');
    this.userInStorage = !!localStorage.getItem('current_user');
    
    const lastActivity = localStorage.getItem('last_activity');
    if (lastActivity) {
      const date = new Date(parseInt(lastActivity));
      this.lastActivityTime = date.toLocaleString();
    } else {
      this.lastActivityTime = 'Not set';
    }

    // Check session expiry
    this.isExpiringSoon = this.authService.isSessionExpiringSoon();
  }

  testApiCall(): void {
    this.addResult('Testing API call with authentication headers...', 'info');
    
    // Make a test API call to see if headers are added
    this.http.get(`${environment.apiUrl}/test-endpoint`).subscribe({
      next: (response) => {
        this.addResult('✓ API call successful - Headers should be automatically added', 'success');
        console.log('API Response:', response);
      },
      error: (error) => {
        if (error.status === 404) {
          this.addResult('✓ API call made (404 expected) - Check Network tab for Authorization header', 'success');
        } else {
          this.addResult(`✗ API call failed: ${error.message}`, 'error');
        }
        console.log('Check Network tab in DevTools for Authorization header');
      }
    });
  }

  refreshSession(): void {
    this.authService.refreshSession();
    this.updateStatus();
    this.addResult('✓ Session refreshed - Last activity updated', 'success');
  }

  clearSession(): void {
    this.authService.logout();
    this.updateStatus();
    this.addResult('✓ Session cleared - User logged out', 'success');
  }

  checkSessionExpiry(): void {
    const isExpiring = this.authService.isSessionExpiringSoon();
    const isLoggedIn = this.authService.isLoggedIn();
    
    this.addResult(`Session Status: ${isLoggedIn ? 'Active' : 'Inactive'}`, 'info');
    this.addResult(`Expiring Soon: ${isExpiring ? 'Yes' : 'No'}`, isExpiring ? 'error' : 'success');
    
    if (isLoggedIn) {
      const lastActivity = localStorage.getItem('last_activity');
      if (lastActivity) {
        const timeSinceActivity = Date.now() - parseInt(lastActivity);
        const minutesRemaining = Math.max(0, 30 - Math.floor(timeSinceActivity / 60000));
        this.addResult(`Minutes remaining: ${minutesRemaining}`, 'info');
      }
    }
  }

  private addResult(message: string, type: string): void {
    this.testResults.unshift({
      message: `${new Date().toLocaleTimeString()}: ${message}`,
      type
    });
    
    // Keep only last 20 results
    if (this.testResults.length > 20) {
      this.testResults = this.testResults.slice(0, 20);
    }
  }
}
