import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { map, take, filter, switchMap, of } from 'rxjs';
import { UserService } from '../core/services/user.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const userService = inject(UserService);

  return authService.initialized$.pipe(
    filter(initialized => initialized === true),
    switchMap(() => authService.session),
    take(1),
    switchMap(session => {
      if (!session) {
        return of(router.createUrlTree(['/login'], {
          queryParams: { returnUrl: state.url }
        }));
      }
      
      return userService.ensureProfileLoaded().pipe(
        map(loaded => loaded ? true : router.createUrlTree(['/login']))
      );
    })
  );
};
