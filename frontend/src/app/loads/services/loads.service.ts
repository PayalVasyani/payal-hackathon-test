import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LoadsService {
  private apiUrl = `${environment.apiUrl}/loads`;
  private cachedLoads: any[] = [];

  constructor(private http: HttpClient) {}

  getLoads(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      tap(loads => this.cachedLoads = loads)
    );
  }

  getLoad(id: string, forceRefresh = false): Observable<any> {
    if (!forceRefresh) {
      const cached = this.cachedLoads.find(l => l.id === id);
      if (cached) return of(cached);
    }
    
    // Fallback: fetch all and find
    return this.getLoads().pipe(
      map(loads => loads.find(l => l.id === id))
    );
  }

  createLoad(data: { shipperId: string }): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  assignCarrier(id: string, carrierOrganizationId: string, overrideCompliance?: boolean): Observable<any> {
    const payload: any = { carrierOrganizationId };
    if (overrideCompliance) {
      payload.overrideCompliance = true;
    }
    return this.http.patch<any>(`${this.apiUrl}/${id}/assign-carrier`, payload);
  }

  createRate(id: string, data: { baseRate: number; accessorials: number }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/rates`, data);
  }

  confirmRate(id: string, version: number): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/rates/${version}/confirm`, {});
  }
}
