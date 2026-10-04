import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { DataStore } from '../core/data.store';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="hidden lg:flex flex-col items-center gap-3 w-[72px] shrink-0 my-10 ml-0 rounded-r-[40px] bg-brand py-6">
      <a routerLink="/" routerLinkActive="bg-white text-brand shadow-float" class="h-11 w-11 rounded-2xl grid place-items-center text-white/70 hover:bg-white/15 hover:text-white transition" aria-label="Dashboard">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
      </a>
      <a routerLink="/projetos" routerLinkActive="bg-white text-brand shadow-float" class="h-11 w-11 rounded-2xl grid place-items-center text-white/70 hover:bg-white/15 hover:text-white transition" aria-label="Projetos">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>
      </a>
      <a routerLink="/tarefas" routerLinkActive="bg-white text-brand shadow-float" class="h-11 w-11 rounded-2xl grid place-items-center text-white/70 hover:bg-white/15 hover:text-white transition" aria-label="Tarefas">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
      </a>
      <a routerLink="/importar" routerLinkActive="bg-white text-brand shadow-float" class="h-11 w-11 rounded-2xl grid place-items-center text-white/70 hover:bg-white/15 hover:text-white transition" aria-label="Importar">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
      </a>
      <button (click)="toggleTheme()" class="mt-auto h-11 w-11 rounded-2xl grid place-items-center text-white/70 hover:bg-white/15 hover:text-white transition" aria-label="Modo escuro">
        @if (!isDark()) {
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
        } @else {
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        }
      </button>
    </nav>

    <nav class="lg:hidden fixed bottom-4 inset-x-4 h-16 flex-row rounded-3xl bg-brand items-center justify-around z-40 px-2">
      <a routerLink="/" routerLinkActive="bg-white text-brand shadow-float" class="h-10 w-10 rounded-xl grid place-items-center text-white/70" aria-label="Dashboard">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
      </a>
      <a routerLink="/projetos" routerLinkActive="bg-white text-brand shadow-float" class="h-10 w-10 rounded-xl grid place-items-center text-white/70" aria-label="Projetos">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>
      </a>
      <a routerLink="/tarefas" routerLinkActive="bg-white text-brand shadow-float" class="h-10 w-10 rounded-xl grid place-items-center text-white/70" aria-label="Tarefas">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
      </a>
      <a routerLink="/importar" routerLinkActive="bg-white text-brand shadow-float" class="h-10 w-10 rounded-xl grid place-items-center text-white/70" aria-label="Importar">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
      </a>
      <button (click)="toggleTheme()" class="h-10 w-10 rounded-xl grid place-items-center text-white/70" aria-label="Modo escuro">
        @if (!isDark()) {
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
        } @else {
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        }
      </button>
    </nav>
  `,
})
export class SidebarComponent {
  private store = inject(DataStore);
  isDark = signal(false);

  constructor() {
    this.isDark.set(this.store.data().settings.theme === 'dark');
  }

  toggleTheme(): void {
    const next = this.isDark() ? 'light' : 'dark';
    this.isDark.set(next === 'dark');
    this.store.setTheme(next);
    if (next === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }
}
