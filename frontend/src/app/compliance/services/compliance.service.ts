import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ComplianceService {
  private apiUrl = `${environment.apiUrl}/compliance/me`;

  constructor(private http: HttpClient) { }

  getMyCompliance(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  updateMyCompliance(data: any): Observable<any> {
    return this.http.put<any>(this.apiUrl, data);
  }
}
