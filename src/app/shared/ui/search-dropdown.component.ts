import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AppIconComponent } from './icon.component';
import { DataStore } from '../../core/data.store';
import { SearchService } from '../../core/search.service';
import { formatDate } from '../../core/date.utils';

interface SearchItem {
  id: string;
  title: string;
  subtitle: string;
  link: string[];
  type: 'task' | 'project';
  icon: string;
  iconColor: string;
  iconBg: string;
}

interface SearchGroup {
  type: 'task' | 'project';
  label: string;
  items: SearchItem[];
}

@Component({
  selector: 'app-search-dropdown',
  standalone: true,
  imports: [CommonModule, RouterLink, AppIconComponent],
  template: `
    @if (searchQuery(); as query) {
      @if (groupedResults().length > 0) {
        <div class="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-surface-line bg-surface-card shadow-float">
          <div class="max-h-[320px] overflow-y-auto">
            @for (group of groupedResults(); track group.type) {
              <div class="border-b border-surface-line last:border-b-0">
                <div class="px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-ink-400">{{ group.label }}</div>
                @for (item of group.items; track item.id) {
                  <a [routerLink]="item.link"
                     class="flex items-center gap-3 px-4 py-2.5 transition hover:bg-surface-app"
                     (click)="clearSearch.emit()">
                    <div class="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
                         [class]="item.iconBg">
                      <app-icon [name]="item.icon" class="h-4 w-4" [strokeWidth]="1.75" [class]="item.iconColor" />
                    </div>
                    <div class="min-w-0 flex-1">
                      <p class="truncate text-[13px] font-medium text-ink">{{ item.title }}</p>
                      <p class="truncate text-[11px] text-ink-400">{{ item.subtitle }}</p>
                    </div>
                  </a>
                }
              </div>
            }
          </div>
        </div>
      }
    }
  `,
})
export class SearchDropdownComponent {
  private store = inject(DataStore);
  searchQuery = input.required<string>();
  clearSearch = output<void>();

  private buildItems(query: string): SearchItem[] {
    const items: SearchItem[] = [];
    for (const t of this.store.data().tasks) {
      const project = t.projectId ? this.store.data().projects.find((p) => p.id === t.projectId) : null;
      const haystack = `${t.title} ${t.description ?? ''} ${project?.name ?? ''} ${(t.tags ?? []).join(' ')}`.toLowerCase();
      if (haystack.includes(query)) {
        items.push({
          id: t.id,
          title: t.title,
          subtitle: `${formatDate(t.dueDate)} · ${project?.name ?? 'Sem projeto'}`,
          link: ['/tarefas', t.id],
          type: 'task',
          icon: 'square-check',
          iconColor: 'text-brand',
          iconBg: 'bg-brand-100',
        });
      }
    }
    for (const p of this.store.data().projects) {
      const haystack = `${p.name} ${p.description ?? ''}`.toLowerCase();
      if (haystack.includes(query)) {
        const count = this.store.data().tasks.filter((t) => t.projectId === p.id).length;
        items.push({
          id: p.id,
          title: p.name,
          subtitle: `${count} tarefa${count === 1 ? '' : 's'}`,
          link: ['/projetos', p.id],
          type: 'project',
          icon: 'folder-kanban',
          iconColor: 'text-brand',
          iconBg: 'bg-brand-100',
        });
      }
    }
    return items.slice(0, 10);
  }

  groupedResults(): SearchGroup[] {
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) return [];
    const items = this.buildItems(query);
    const projects = items.filter((i) => i.type === 'project');
    const tasks = items.filter((i) => i.type === 'task');
    const groups: SearchGroup[] = [];
    if (projects.length > 0) groups.push({ type: 'project', label: 'Projetos', items: projects });
    if (tasks.length > 0) groups.push({ type: 'task', label: 'Tarefas', items: tasks });
    return groups;
  }
}