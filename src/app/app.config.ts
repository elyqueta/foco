import { ApplicationConfig, provideBrowserGlobalErrorListeners, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { ConsoleApi } from './core/console-api';
import { DataRepository, LocalStorageRepository } from './core/storage.repository';
import { LucideAngularModule } from 'lucide-angular';
import { APP_ICONS } from './core/icons';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(),
    importProvidersFrom(LucideAngularModule.pick(APP_ICONS)),
    { provide: DataRepository, useClass: LocalStorageRepository },
    ConsoleApi,
  ],
};