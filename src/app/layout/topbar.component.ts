import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { DataStore } from '../core/data.store';
import { ThemeService } from '../core/theme.service';
import { SearchService } from '../core/search.service';
import { SearchDropdownComponent } from '../shared/ui/search-dropdown.component';
import { toISODate } from '../core/date.utils';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LucideAngularModule, SearchDropdownComponent],
  templateUrl: './topbar.component.html',
})
export class TopbarComponent implements OnInit {
  private store = inject(DataStore);
  private themeService = inject(ThemeService);
  private search = inject(SearchService);
  private router = inject(Router);
  theme = this.themeService.theme;
  searchQuery = this.search.query;

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

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.search.query.set(input.value);
  }

  onSearchEnter(): void {
    const query = this.search.query().trim();
    if (!query) return;
    this.router.navigate(['/tarefas'], { queryParams: { q: query } });
  }

  clearSearch(): void {
    this.search.query.set('');
    const input = document.getElementById('search') as HTMLInputElement | null;
    if (input) {
      input.value = '';
    }
    this.router.navigate(['/tarefas']);
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