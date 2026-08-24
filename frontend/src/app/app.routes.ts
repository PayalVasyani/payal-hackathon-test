import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';
import { LoginComponent } from './login/login.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'loads',
    canActivate: [authGuard],
    loadComponent: () => import('./loads/components/load-list/load-list.component').then(m => m.LoadListComponent)
  },
  {
    path: 'loads/create',
    canActivate: [authGuard],
    loadComponent: () => import('./loads/components/load-create/load-create.component').then(m => m.LoadCreateComponent)
  },
  {
    path: 'loads/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./loads/components/load-details/load-details.component').then(m => m.LoadDetailsComponent)
  },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' }
];
