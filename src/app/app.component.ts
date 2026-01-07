import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { SessionMonitorService } from './services/session-monitor.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <div class="app-container">
      <!-- Session Status Bar -->
      <div class="session-status" *ngIf="isLoggedIn">
        <div class="session-info">
          <span class="user-info">Welcome, {{ currentUser?.username }}</span>
          <span class="session-timer" [class.warning]="isSessionExpiringSoon">
            Session expires in {{ getTimeRemaining() }}
          </span>
          <button class="extend-btn" (click)="extendSession()" *ngIf="isSessionExpiringSoon">
            Extend Session
          </button>
          <button class="logout-btn" (click)="logout()">
            Logout
          </button>
        </div>
      </div>

      <!-- Main Content -->
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
    }

    .session-status {
      background: #f8f9fa;
      border-bottom: 1px solid #dee2e6;
      padding: 0.5rem 1rem;
      position: sticky;
      top: 0;
      z-index: 1000;
    }

    .session-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 1200px;
      margin: 0 auto;
    }

    .user-info {
      font-weight: 500;
      color: #495057;
    }

    .session-timer {
      font-size: 0.875rem;
      color: #6c757d;
      transition: color 0.3s ease;
    }

    .session-timer.warning {
      color: #dc3545;
      font-weight: 500;
    }

    .extend-btn, .logout-btn {
      padding: 0.25rem 0.75rem;
      border: none;
      border-radius: 4px;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .extend-btn {
      background: #28a745;
      color: white;
      margin-right: 0.5rem;
    }

    .extend-btn:hover {
      background: #218838;
    }

    .logout-btn {
      background: #6c757d;
      color: white;
    }

    .logout-btn:hover {
      background: #545b62;
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  isLoggedIn = false;
  currentUser: any = null;
  isSessionExpiringSoon = false;
  private intervalId?: number;

  constructor(
    private authService: AuthService,
    private sessionMonitor: SessionMonitorService
  ) {}

  ngOnInit(): void {
    // Subscribe to authentication state
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isLoggedIn = !!user;
      
      if (this.isLoggedIn) {
        this.sessionMonitor.startMonitoring();
        this.startSessionTimer();
      } else {
        this.sessionMonitor.stopMonitoring();
        this.stopSessionTimer();
      }
    });
  }

  ngOnDestroy(): void {
    this.stopSessionTimer();
  }

  private startSessionTimer(): void {
    this.intervalId = window.setInterval(() => {
      this.isSessionExpiringSoon = this.authService.isSessionExpiringSoon();
    }, 30000); // Check every 30 seconds
  }

  private stopSessionTimer(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  getTimeRemaining(): string {
    const lastActivity = localStorage.getItem('last_activity');
    if (!lastActivity) return '';

    const lastActivityTime = parseInt(lastActivity);
    const now = Date.now();
    const sessionTimeout = 30 * 60 * 1000; // 30 minutes
    const timeRemaining = sessionTimeout - (now - lastActivityTime);

    if (timeRemaining <= 0) return 'Expired';

    const minutes = Math.floor(timeRemaining / 60000);
    const seconds = Math.floor((timeRemaining % 60000) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  extendSession(): void {
    this.authService.extendSession();
  }

  logout(): void {
    this.authService.logout();
  }
}
