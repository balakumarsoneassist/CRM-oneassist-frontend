import { Injectable, NgZone } from '@angular/core';
import { AuthService } from './auth.service';
import { fromEvent, merge, Subscription } from 'rxjs';
import { throttleTime } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SessionMonitorService {
  private activitySubscription?: Subscription;
  private warningShown = false;

  constructor(
    private authService: AuthService,
    private ngZone: NgZone
  ) {}

  startMonitoring(): void {
    if (this.activitySubscription) {
      return; // Already monitoring
    }

    // Monitor user activity events
    const events = [
      'mousedown',
      'mousemove', 
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    // Create observables for all activity events
    const activityEvents = events.map(event => 
      fromEvent(document, event)
    );

    // Merge all activity events and throttle to avoid excessive updates
    this.activitySubscription = merge(...activityEvents)
      .pipe(throttleTime(30000)) // Update every 30 seconds max
      .subscribe(() => {
        this.ngZone.run(() => {
          if (this.authService.isLoggedIn()) {
            this.authService.updateLastActivity();
            this.warningShown = false; // Reset warning flag on activity
          }
        });
      });

    // Check for session expiration every minute
    setInterval(() => {
      this.checkSessionStatus();
    }, 60000);

    console.log('Session monitoring started');
  }

  stopMonitoring(): void {
    if (this.activitySubscription) {
      this.activitySubscription.unsubscribe();
      this.activitySubscription = undefined;
    }
    console.log('Session monitoring stopped');
  }

  private checkSessionStatus(): void {
    if (!this.authService.isLoggedIn()) {
      return;
    }

    if (this.authService.isSessionExpiringSoon() && !this.warningShown) {
      this.warningShown = true;
      this.showExpirationWarning();
    }
  }

  private showExpirationWarning(): void {
    const extendSession = confirm(
      'Your session will expire in 5 minutes due to inactivity. ' +
      'Click OK to extend your session, or Cancel to logout now.'
    );

    if (extendSession) {
      this.authService.extendSession();
      this.warningShown = false;
    } else {
      this.authService.logout();
    }
  }
}
