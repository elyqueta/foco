import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { ConsoleApi } from './core/console-api';
import { DataRepository, LocalStorageRepository } from './core/storage.repository';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(),
    { provide: DataRepository, useClass: LocalStorageRepository },
    ConsoleApi,
  ],
};
