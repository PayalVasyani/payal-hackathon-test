import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase: SupabaseClient;
  private _currentUser = new BehaviorSubject<User | null>(null);
  private _session = new BehaviorSubject<Session | null>(null);
  private _initialized = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient) {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    
    this.supabase.auth.getSession().then(({ data: { session } }) => {
      this._session.next(session);
      this._currentUser.next(session?.user ?? null);
      this._initialized.next(true);
    });

    this.supabase.auth.onAuthStateChange((_event, session) => {
      this._session.next(session);
      this._currentUser.next(session?.user ?? null);
      this._initialized.next(true);
    });
  }

  get initialized$(): Observable<boolean> {
    return this._initialized.asObservable();
  }

  get currentUser(): Observable<User | null> {
    return this._currentUser.asObservable();
  }

  get session(): Observable<Session | null> {
    return this._session.asObservable();
  }

  get sessionValue(): Session | null {
    return this._session.value;
  }

  async getSession() {
    return this.supabase.auth.getSession();
  }

  async signIn(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({ email, password });
  }

  async signUp(email: string, password: string) {
    return this.supabase.auth.signUp({ email, password });
  }

  register(data: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/register`, data);
  }

  async signOut() {
    return this.supabase.auth.signOut();
  }
}
