import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { DataStore } from './data.store';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private store = inject(DataStore);
  theme = computed(() => this.store.data().settings.theme);

  constructor() {
    effect(() => {
      document.documentElement.setAttribute('data-theme', this.theme());
    });
  }

  set(theme: 'light' | 'dark'): void {
    this.store.setTheme(theme);
  }
}