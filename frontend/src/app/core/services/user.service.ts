import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private _appUser = new BehaviorSubject<any>(null);

  constructor(private http: HttpClient, private authService: AuthService) {
    this.authService.session.subscribe(session => {
      if (session) {
        this.fetchProfile().subscribe();
      } else {
        this._appUser.next(null);
      }
    });
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
}
