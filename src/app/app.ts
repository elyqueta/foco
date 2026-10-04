import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConsoleApi } from './core/console-api';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class App {
  private consoleApi = inject(ConsoleApi);

  constructor() {
    this.consoleApi.init();
  }
}
