import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { DataStore } from '../core/data.store';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './topbar.component.html',
})
export class TopbarComponent implements OnInit {
  private store = inject(DataStore);
  theme = signal<'light' | 'dark'>('light');
  searchInput: HTMLInputElement | null = null;

  tabs = [
    { path: '/', exact: true, label: 'Dashboard', icon: 'layout-grid' },
    { path: '/projetos', exact: false, label: 'Projetos', icon: 'folder-kanban' },
    { path: '/tarefas', exact: false, label: 'Tarefas', icon: 'check-square' },
  ];

  constructor() {
    const saved = this.store.data().settings.theme;
    this.theme.set(saved);
    if (saved === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }

  ngOnInit(): void {
    document.addEventListener('keydown', (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        if (event.key === 'Escape') {
          (target as HTMLInputElement).blur();
        }
        return;
      }
      if (event.key === 'n' || event.key === 'N') {
        this.openNewTask();
      }
      if (event.key === '/') {
        event.preventDefault();
        const search = document.getElementById('search');
        if (search) {
          (search as HTMLInputElement).focus();
        }
      }
    });
  }

  setTheme(value: 'light' | 'dark'): void {
    this.theme.set(value);
    this.store.setTheme(value);
    if (value === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }

  exportData(): void {
    const json = this.store.exportJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `foco-backup-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  openNewTask(): void {
    const modal = document.querySelector('app-modal') as HTMLElement | null;
    if (modal) {
      modal.dispatchEvent(new Event('open'));
    }
  }
}
