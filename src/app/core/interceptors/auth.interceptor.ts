import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();
  const isBackendRequest = [
    environment.gameServiceUrl,
    environment.cardServiceUrl,
    environment.realtimeServiceUrl
  ].some((url) => request.url.startsWith(url));

  if (!token || !isBackendRequest || request.url.includes('/api/auth/')) {
    return next(request);
  }

  return next(request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  }));
};

