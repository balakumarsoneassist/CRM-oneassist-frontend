import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, map, of, catchError, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private http: HttpClient) {}

  private readonly loggedInKey = 'logged_in';
  private readonly tokenKey = 'token';
  private readonly usernameKey = 'username';
  private readonly usernameID = 'usernameID';
  private readonly organizationid = 'organizationid';
  private readonly isadminrights = 'isadminrights';


  /**
   * Perform a very basic authentication check.
   * In a real application you would call an API.
   */
  login(username: string, password: string): Observable<boolean> {
    return this.http
      .post<{ token?: string; user?: { id: number; name: string; isadminrights: string; organizationid: string; } }>(`${environment.apiUrl}/login`, {
        username,
        password,
      })
      .pipe(
        tap((res: { token?: string; user?: { id: number; name: string; isadminrights: string; organizationid: string; } }) => {
          if (res.token) {
            localStorage.setItem(this.tokenKey, res.token);
            localStorage.setItem(this.loggedInKey, 'true');
          }
         // console.log(res.user);
          if (res.user?.name) {
            localStorage.setItem(this.usernameKey, res.user.name);
            //console.log(res.user.name);
            localStorage.setItem(this.usernameID, res.user.id.toString());
            //console.log(res.user.id);
            localStorage.setItem(this.isadminrights, res.user.isadminrights.toString());
            console.log("isadminrights:"+res.user.isadminrights);
            localStorage.setItem(this.organizationid, res.user.organizationid.toString());
            //console.log(res.user.organizationid);
          }
        }),
        map((res: { token?: string }) => !!res.token),
        catchError(() => of(false))
      );
  }

  logout(): void {
    localStorage.removeItem(this.loggedInKey);
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.usernameKey);
    localStorage.removeItem(this.usernameID);
    localStorage.removeItem(this.isadminrights);
    localStorage.removeItem(this.organizationid);
      }

  isLoggedIn(): boolean {
    return localStorage.getItem(this.loggedInKey) === 'true';
  }

  getUsername(): string {
    return localStorage.getItem(this.usernameKey) || '';
    }

    getUsernameID():  number {
      return parseInt(localStorage.getItem(this.usernameID) || '0');
      }

      getIsAdminRights(): boolean {
        return localStorage.getItem(this.isadminrights) === 'true';
      }

      getOrganizationID(): string {
        return localStorage.getItem(this.organizationid) || '';
        }
      }
