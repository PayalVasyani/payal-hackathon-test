import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private _appUser = new BehaviorSubject<any>(null);

  constructor(private http: HttpClient, private authService: AuthService) {
    this.authService.session.subscribe(session => {
      if (!session) {
        this._appUser.next(null);
      }
    });
  }

  ensureProfileLoaded(): Observable<boolean> {
    if (this.currentUserValue) {
      return of(true);
    }
    return this.fetchProfile().pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  get appUser$(): Observable<any> {
    return this._appUser.asObservable();
  }

  get currentUserValue(): any {
    return this._appUser.value;
  }

  fetchProfile(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/users/me`).pipe(
      tap(user => this._appUser.next(user))
    );
  }

  hasPermission(permissionCode: string): boolean {
    const user = this.currentUserValue;
    if (!user || !user.roles) return false;

    for (const role of user.roles) {
      if (role.role?.permissions) {
        for (const p of role.role.permissions) {
          if (p.permission?.code === permissionCode) {
            return true;
          }
        }
      }
    }
    return false;
  }

  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(p => this.hasPermission(p));
  }

  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(p => this.hasPermission(p));
  }

  clearUser(): void {
    this._appUser.next(null);
  }
}
