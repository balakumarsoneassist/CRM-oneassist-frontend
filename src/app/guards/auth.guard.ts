import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    
    return this.authService.currentUser$.pipe(
      take(1),
      map(user => {
        if (user && this.authService.isLoggedIn()) {
          // Check if session is expiring soon and warn user
          if (this.authService.isSessionExpiringSoon()) {
            const extendSession = confirm(
              'Your session will expire in 5 minutes. Would you like to extend it?'
            );
            if (extendSession) {
              this.authService.extendSession();
            }
          }
          return true;
        } else {
          // Redirect to login if not authenticated
          this.router.navigate(['/login'], { 
            queryParams: { returnUrl: state.url } 
          });
          return false;
        }
      })
    );
  }
}
