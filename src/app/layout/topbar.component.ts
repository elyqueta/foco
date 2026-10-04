import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { DataStore } from '../core/data.store';
import { ThemeService } from '../core/theme.service';
import { toISODate } from '../core/date.utils';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './topbar.component.html',
})
export class TopbarComponent implements OnInit {
  private store = inject(DataStore);
  private themeService = inject(ThemeService);
  theme = this.themeService.theme;
  searchInput: HTMLInputElement | null = null;

  tabs = [
    { path: '/', exact: true, label: 'Dashboard', icon: 'layout-grid' },
    { path: '/projetos', exact: false, label: 'Projetos', icon: 'folder-kanban' },
    { path: '/tarefas', exact: false, label: 'Tarefas', icon: 'square-check' },
  ];

  constructor() {}

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
    this.themeService.set(value);
  }

  exportData(): void {
    const json = this.store.exportJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = toISODate(new Date());
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