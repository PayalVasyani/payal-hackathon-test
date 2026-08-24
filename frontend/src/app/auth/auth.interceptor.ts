import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { from, switchMap, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { UserService } from '../core/services/user.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const userService = inject(UserService);

  return from(authService.getSession()).pipe(
    switchMap(({ data: { session } }) => {
      if (session?.access_token) {
        req = req.clone({
          setHeaders: {
            Authorization: `Bearer ${session.access_token}`
          }
        });
      }
      return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === 401) {
            authService.signOut().then(() => {
              userService.clearUser();
              router.navigate(['/login'], { queryParams: { sessionExpired: true } });
            });
          }
          return throwError(() => error);
        })
      );
    })
  );
};
