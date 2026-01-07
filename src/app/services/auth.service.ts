import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, timer, Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

export interface User {
  id: string;
  username: string;
  email?: string;
  role?: string;
}

export interface ApiUser {
  id: number;
  name: string;
  qualification: string;
  dateofbirth: string;
  joindate: string;
  presentaddress: string;
  permanentaddress: string;
  emailid: string;
  designation: string;
  mobilenumber: string;
  contactperson: string;
  contactnumber: string;
  logintime: string | null;
  oldpassword: string | null;
  resetpasswordexpiry: string | null;
  resetpasswordkey: string | null;
  isactive: boolean;
  isadminrights: boolean;
  isleadrights: boolean;
  iscontactrights: boolean;
  iscibilrights: boolean;
  isicicirights: boolean;
  organizationid: number;
  dept: string;
  issplrights: boolean;
  isreassignrights: boolean;
  image_data: string | null;
}

export interface LoginResponse {
  token?: string;
  user?: {
    id: number;
    name: string;
    isadminrights: string;
    organizationid: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private tokenSubject = new BehaviorSubject<string | null>(null);
  private sessionTimeoutSubscription?: Subscription;
  
  // Session timeout duration (30 minutes in milliseconds)
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000;
  private readonly TOKEN_KEY = 'token';
  private readonly USER_KEY = 'current_user';
  private readonly LAST_ACTIVITY_KEY = 'last_activity';
  
  // Additional keys from old auth service
  private readonly LOGGED_IN_KEY = 'loggedIn';
  private readonly USERNAME_KEY = 'username';
  private readonly USERNAME_ID_KEY = 'usernameID';
  private readonly IS_ADMIN_RIGHTS_KEY = 'isadminrights';
  private readonly ORGANIZATION_ID_KEY = 'organizationid';

  public currentUser$ = this.currentUserSubject.asObservable();
  public token$ = this.tokenSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.initializeSession();
  }

  private initializeSession(): void {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const userStr = localStorage.getItem(this.USER_KEY);
    const lastActivity = localStorage.getItem(this.LAST_ACTIVITY_KEY);

    if (token && userStr && lastActivity) {
      const lastActivityTime = parseInt(lastActivity);
      const now = Date.now();
      
      // Check if session has expired
      if (now - lastActivityTime > this.SESSION_TIMEOUT) {
        this.clearSession();
        return;
      }

      try {
        const user = JSON.parse(userStr);
        this.tokenSubject.next(token);
        this.currentUserSubject.next(user);
        this.updateLastActivity();
        this.startSessionTimeout();
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        this.clearSession();
      }
    }
  }

  login(username: string, password: string): Observable<LoginResponse> {
    return new Observable(observer => {
      this.http.post<LoginResponse>(`${environment.apiUrl}/login`, {
        username,
        password
      }).subscribe({
        next: (response) => {
          console.log('🔍 Full login response:', response);
          console.log('🔍 Response token:', response.token);
          console.log('🔍 Response user:', response.user);
          
          if (response.token && response.user) {
            console.log('✅ Login conditions met, setting session...');
            
            // Set additional localStorage items from old auth service
            localStorage.setItem(this.LOGGED_IN_KEY, 'true');
            localStorage.setItem(this.USERNAME_KEY, response.user.name);
            localStorage.setItem(this.USERNAME_ID_KEY, response.user.id.toString());
            localStorage.setItem(this.IS_ADMIN_RIGHTS_KEY, response.user.isadminrights.toString());
            localStorage.setItem(this.ORGANIZATION_ID_KEY, response.user.organizationid.toString());
            console.log("isadminrights:" + response.user.isadminrights);
            
            // Map the user data to our User interface
            const user: User = {
              id: response.user.id.toString(),
              username: response.user.name,
              email: '', // Not provided in this API response
              role: response.user.isadminrights === 'true' ? 'admin' : 'user'
            };
            this.setSession(response.token, user);
            console.log('✅ Session set successfully');
          } else {
            console.log('❌ Login conditions not met:', {
              hasToken: !!response.token,
              hasUser: !!response.user
            });
          }
          observer.next(response);
          observer.complete();
        },
        error: (error) => {
          observer.error(error);
        }
      });
    });
  }

  private setSession(token: string, user: User): void {
    // Store in localStorage
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.updateLastActivity();

    // Update subjects
    this.tokenSubject.next(token);
    this.currentUserSubject.next(user);

    // Start session timeout monitoring
    this.startSessionTimeout();

    console.log('Session established for user:', user.username);
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  private clearSession(): void {
    // Clear localStorage - including all items from old auth service
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.LAST_ACTIVITY_KEY);
    localStorage.removeItem(this.LOGGED_IN_KEY);
    localStorage.removeItem(this.USERNAME_KEY);
    localStorage.removeItem(this.USERNAME_ID_KEY);
    localStorage.removeItem(this.IS_ADMIN_RIGHTS_KEY);
    localStorage.removeItem(this.ORGANIZATION_ID_KEY);

    // Clear subjects
    this.tokenSubject.next(null);
    this.currentUserSubject.next(null);

    // Clear timeout subscription
    if (this.sessionTimeoutSubscription) {
      this.sessionTimeoutSubscription.unsubscribe();
    }

    console.log('Session cleared');
  }

  updateLastActivity(): void {
    localStorage.setItem(this.LAST_ACTIVITY_KEY, Date.now().toString());
  }

  private startSessionTimeout(): void {
    // Clear existing timeout
    if (this.sessionTimeoutSubscription) {
      this.sessionTimeoutSubscription.unsubscribe();
    }

    // Start new timeout
    this.sessionTimeoutSubscription = timer(this.SESSION_TIMEOUT).subscribe(() => {
      console.log('Session expired due to inactivity');
      alert('Your session has expired due to inactivity. Please login again.');
      this.logout();
    });
  }

  refreshSession(): void {
    if (this.isLoggedIn()) {
      this.updateLastActivity();
      this.startSessionTimeout();
    }
  }

  isLoggedIn(): boolean {
    const token = this.tokenSubject.value;
    const user = this.currentUserSubject.value;
    return !!(token && user);
  }

  getToken(): string | null {
    return this.tokenSubject.value;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // Check if session is about to expire (5 minutes warning)
  isSessionExpiringSoon(): boolean {
    const lastActivity = localStorage.getItem(this.LAST_ACTIVITY_KEY);
    if (!lastActivity) return false;

    const lastActivityTime = parseInt(lastActivity);
    const now = Date.now();
    const timeUntilExpiry = this.SESSION_TIMEOUT - (now - lastActivityTime);
    
    return timeUntilExpiry <= 5 * 60 * 1000; // 5 minutes
  }

  extendSession(): void {
    if (this.isLoggedIn()) {
      this.refreshSession();
      console.log('Session extended');
    }
  }
}
