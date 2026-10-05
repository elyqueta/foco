import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { DataStore } from './data.store';
import { DOCUMENT } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly store = inject(DataStore);
  private readonly doc = inject(DOCUMENT);
  theme = computed(() => this.store.data().settings.theme);

  constructor() {
    effect(() => {
      this.doc.documentElement.setAttribute('data-theme', this.theme());
    });
    this.init();
  }

  init(): void {
    const stored = this.store.data().settings.theme;
    this.doc.documentElement.setAttribute('data-theme', stored);
  }

  set(theme: 'light' | 'dark'): void {
    this.store.setTheme(theme);
  }
}
