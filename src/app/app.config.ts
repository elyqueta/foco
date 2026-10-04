import { ApplicationConfig, provideBrowserGlobalErrorListeners, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { ConsoleApi } from './core/console-api';
import { DataRepository, LocalStorageRepository } from './core/storage.repository';
import { LucideAngularModule, LayoutGrid, FolderKanban, SquareCheck, CalendarDays, Upload, Settings, Search, Download } from 'lucide-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(),
    importProvidersFrom(LucideAngularModule.pick({
      'layout-grid': LayoutGrid,
      'folder-kanban': FolderKanban,
      'square-check': SquareCheck,
      'calendar-days': CalendarDays,
      'upload': Upload,
      'settings': Settings,
      'search': Search,
      'download': Download,
    })),
    { provide: DataRepository, useClass: LocalStorageRepository },
    ConsoleApi,
  ],
};
