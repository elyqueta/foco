import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConsoleApi } from './core/console-api';
import { ColorSchemeService } from './core/color-scheme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class App {
  private consoleApi = inject(ConsoleApi);
  private colorScheme = inject(ColorSchemeService);

  constructor() {
    this.consoleApi.init();
  }
}
