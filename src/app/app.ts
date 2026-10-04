import { Component, inject } from '@angular/core';
import { ShellComponent } from './layout/shell.component';
import { ConsoleApi } from './core/console-api';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ShellComponent],
  template: `<app-shell />`,
})
export class App {
  private consoleApi = inject(ConsoleApi);

  constructor() {
    this.consoleApi.init();
  }
}
