import { ApplicationConfig, provideBrowserGlobalErrorListeners, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { ConsoleApi } from './core/console-api';
import { DataRepository, LocalStorageRepository } from './core/storage.repository';
import { LucideAngularModule } from 'lucide-angular';
import { APP_ICONS } from './core/icons';
import { AuthRepository } from './core/auth/auth.repository';
import { MockAuthRepository } from './core/auth/mock-auth.repository';
import { ApiAuthRepository } from './core/auth/api-auth.repository';
import { authInterceptor } from './core/auth/auth.interceptor';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(),
    provideHttpClient(withInterceptors([authInterceptor])),
    importProvidersFrom(LucideAngularModule.pick(APP_ICONS)),
    { provide: DataRepository, useClass: LocalStorageRepository },
    { provide: AuthRepository, useClass: environment.useMockAuth ? MockAuthRepository : ApiAuthRepository },
    ConsoleApi,
  ],
};
