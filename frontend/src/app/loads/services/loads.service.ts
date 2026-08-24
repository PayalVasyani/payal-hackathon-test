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

  constructor(private http: HttpClient) { }

  getLoads(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      tap(loads => this.cachedLoads = loads)
    );
  }

  getShippers(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/users/shippers`);
  }

  getCarrierOrgs(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/users/organizations/carriers`);
  }

  getLoad(id: string, forceRefresh = false): Observable<any> {
    if (!forceRefresh) {
      const cached = this.cachedLoads.find(l => l.id === id);
      if (cached && cached.podDocuments) return of(cached); // Ensure we have details like podDocuments
    }

    // Fetch directly to get all relations (rates, podDocuments)
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  uploadPod(id: string, data: { fileName: string; fileType: string; fileData: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/pod`, data);
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

  confirmRate(loadId: string, version: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${loadId}/rates/${version}/confirm`, {});
  }

  updateStatus(loadId: string, status: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${loadId}/status`, { status });
  }

  getRouteAdvisor(origin: string, destination: string): Observable<{ advisorText: string }> {
    return this.http.post<{ advisorText: string }>(`${this.apiUrl}/ai/advisor`, { origin, destination });
  }
}
