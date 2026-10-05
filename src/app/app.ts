import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConsoleApi } from './core/console-api';
import { ThemeService } from './core/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class App {
  private consoleApi = inject(ConsoleApi);
  private theme = inject(ThemeService);

  constructor() {
    this.consoleApi.init();
    this.theme.init();
  }
}
