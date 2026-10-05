import { Injectable, computed, effect, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { DataStore } from './data.store';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly store = inject(DataStore);
  private readonly document = inject(DOCUMENT);
  theme = computed(() => this.store.data().settings.theme);

  constructor() {
    effect(() => {
      this.document.documentElement.setAttribute('data-theme', this.theme());
    });
  }

  set(theme: 'light' | 'dark'): void {
    this.store.setTheme(theme);
  }
}