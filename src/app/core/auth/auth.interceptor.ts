import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpHeaders } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, Observable, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (req.url.startsWith(environment.apiBaseUrl)) {
    const token = auth.token();
    const headers = new HttpHeaders({ Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) });
    req = req.clone({ headers });
  }

  return next(req).pipe(
    catchError((error: unknown) => {
      const status = error && typeof error === 'object' && 'status' in error ? (error as { status: number }).status : 0;
      if (status === 401 && !req.url.endsWith('/auth/login')) {
        auth.clearLocal();
        router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
      }
      return throwError(() => error);
    }),
  );
};
