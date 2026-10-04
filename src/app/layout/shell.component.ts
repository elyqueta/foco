import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar.component';
import { TopbarComponent } from './topbar.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TopbarComponent],
  template: `
    <div class="relative mx-auto flex min-h-[calc(100vh-48px)] max-w-[1440px] overflow-hidden rounded-shell bg-surface-app shadow-card">
      <app-sidebar />
      <div class="flex-1 px-8 py-6 md:px-10 overflow-y-auto">
        <app-topbar />
        <main>
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class ShellComponent {}
