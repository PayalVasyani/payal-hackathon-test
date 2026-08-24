import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LoadingService } from './core/services/loading.service';
import { AuthService } from './auth/auth.service';
import { LoaderComponent } from './shared/components/loader/loader.component';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, LoaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'frontend';
  isLoading$: Observable<boolean>;
  authInitialized$: Observable<boolean>;

  constructor(
    private loadingService: LoadingService,
    private authService: AuthService
  ) {
    this.isLoading$ = this.loadingService.isLoading$;
    this.authInitialized$ = this.authService.initialized$;
  }

  ngOnInit() {}
}
