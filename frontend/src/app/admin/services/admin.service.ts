import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  constructor(private http: HttpClient) { }

  getRoles(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/roles`);
  }

  getPermissions(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/roles/permissions`);
  }

  createRole(data: { name: string, permissionIds: string[] }): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/roles`, data);
  }

  getStaff(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/staff`);
  }

  inviteStaff(data: { email: string, name: string, password: string, roleId: string }): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/staff/invite`, data);
  }
}
