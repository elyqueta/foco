import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Router } from '@angular/router';
import { HostListener } from '@angular/core';
import { DataStore } from '../core/data.store';
import { SearchService } from '../core/search.service';
import { AuthService } from '../core/auth/auth.service';
import { TaskModalService } from '../core/task-modal.service';
import { SearchDropdownComponent } from '../shared/ui/search-dropdown.component';
import { NotificationService } from '../core/notification.service';
import { ExportService } from '../core/export.service';
import { ExportDialogComponent } from '../shared/ui/export-dialog.component';
import { LogoutDialogComponent } from '../shared/ui/logout-dialog.component';
import { AppIconComponent } from '../shared/ui/icon.component';
import { AppThemeToggleComponent } from '../shared/ui/theme-toggle.component';
import { AppButtonComponent } from '../shared/ui/button.component';
import { toISODate } from '../core/date.utils';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, AppIconComponent, AppThemeToggleComponent, AppButtonComponent, SearchDropdownComponent, ExportDialogComponent, LogoutDialogComponent],
  templateUrl: './topbar.component.html',
})
export class TopbarComponent implements OnInit {
  private store = inject(DataStore);
  private search = inject(SearchService);
  private router = inject(Router);
  private auth = inject(AuthService);
  private modal = inject(TaskModalService);
  private notifications = inject(NotificationService);
  private exportService = inject(ExportService);
  searchQuery = this.search.query;

  tabs = [
    { path: '/', exact: true, label: 'Dashboard', icon: 'layout-grid' },
    { path: '/projetos', exact: false, label: 'Projetos', icon: 'folder-kanban' },
    { path: '/tarefas', exact: false, label: 'Tarefas', icon: 'square-check' },
  ];

  menuOpen = signal(false);
  showExportDialog = signal(false);
  showLogoutDialog = signal(false);
  readonly unreadNotifications = this.notifications.unreadCount;

  constructor() {}

  ngOnInit(): void {
    document.addEventListener('keydown', (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        if (event.key === 'Escape') {
          (target as HTMLInputElement).blur();
          this.menuOpen.set(false);
          this.showExportDialog.set(false);
          this.showLogoutDialog.set(false);
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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const button = target.closest('[data-user-menu]');
    if (!button) {
      this.menuOpen.set(false);
    }
  }

  get userName(): string {
    return this.auth.user()?.name ?? this.store.data().settings.userName;
  }

  initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0]?.slice(0, 2).toUpperCase() ?? 'U';
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.search.query.set(input.value);
    void this.search.search();
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
  }

  openLogoutDialog(): void {
    this.menuOpen.set(false);
    this.showLogoutDialog.set(true);
  }

  closeLogoutDialog(): void {
    this.showLogoutDialog.set(false);
  }

  async logout(): Promise<void> {
    this.showLogoutDialog.set(false);
    await this.auth.logout();
  }

  async logoutAll(): Promise<void> {
    this.showLogoutDialog.set(false);
    await this.auth.logoutAll();
  }

  openNewTask(): void {
    this.modal.show();
  }

  async exportJson(): Promise<void> {
    await this.exportService.exportJson();
  }

  exportPdf(): void {
    // PDF export logic moved to ExportService
  }
}
