import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConsoleApi } from './core/console-api';
import { ColorSchemeService } from './core/color-scheme.service';
import { AuthService } from './core/auth/auth.service';
import { DataStore } from './core/data.store';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class App {
  private consoleApi = inject(ConsoleApi);
  private colorScheme = inject(ColorSchemeService);
  private auth = inject(AuthService);
  private store = inject(DataStore);

  constructor() {
    this.consoleApi.init();
    void this.auth.ensureValidated().then(() => {
      if (this.auth.isAuthenticated()) {
        this.store.init();
      }
    });
  }
}
