import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { DataStore } from '../core/data.store';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './topbar.component.html',
})
export class TopbarComponent {
  private store = inject(DataStore);
  isDark = signal(false);
  openTaskModal = signal(false);

  constructor() {
    this.isDark.set(this.store.data().settings.theme === 'dark');
  }

  setTheme(theme: 'light' | 'dark'): void {
    this.isDark.set(theme === 'dark');
    this.store.setTheme(theme);
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    console.log('search:', value);
  }

  openModal(): void {
    this.openTaskModal.set(true);
  }
}
