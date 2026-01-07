import {
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

import {
  catchError,
  tap,
  throwError,
} from 'rxjs';

import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Debug logging
  console.log('🔍 Interceptor triggered for:', req.url);
  
  // Update last activity on every API call
  authService.updateLastActivity();

  // Get the auth token
  const token = authService.getToken();
  console.log('🔑 Token from service:', token ? 'Present' : 'Missing');
  
  // Also check localStorage directly
  const tokenFromStorage = localStorage.getItem('token');
  console.log('💾 Token from localStorage:', tokenFromStorage ? 'Present' : 'Missing');
  
  // Clone the request and add authorization header if token exists
  let authReq = req;
  if (token) {
    console.log('✅ Adding Authorization header');
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  } else {
    console.log('❌ No token available, skipping Authorization header');
  }

  // Handle the request and catch errors
  return next(authReq).pipe(
    tap(() => {
      // Refresh session on successful API calls
      authService.refreshSession();
    }),
    catchError((error: HttpErrorResponse) => {
      // Handle authentication errors
      if (error.status === 401 || error.status === 403) {
        console.log('Authentication error detected, logging out...');
        authService.logout();
        router.navigate(['/login']);
      }
      
      return throwError(() => error);
    })
  );
};
