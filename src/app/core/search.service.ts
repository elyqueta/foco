import { Injectable, inject, signal } from '@angular/core';
import { DataStore } from './data.store';
import { ApiService } from './api.service';
import { SearchResult } from './api.models';

@Injectable({ providedIn: 'root' })
export class SearchService {
  private store = inject(DataStore);
  private api = inject(ApiService);

  query = signal('');
  results = signal<SearchResult | null>(null);
  searching = signal(false);

  async search(): Promise<void> {
    const q = this.query().trim();
    if (!q) {
      this.results.set(null);
      return;
    }
    if (this.store.useApi) {
      this.searching.set(true);
      try {
        this.results.set(await this.api.search(q));
      } catch {
        this.results.set(null);
      } finally {
        this.searching.set(false);
      }
    } else {
      this.results.set(this.searchLocal(q));
    }
  }

  private searchLocal(q: string): SearchResult {
    const term = q.toLowerCase();
    const data = this.store.data();
    const projects = data.projects
      .filter((p) => `${p.name} ${p.description ?? ''}`.toLowerCase().includes(term))
      .map((p) => ({ id: p.id, name: p.name, category: p.category, status: p.status }));
    const tasks = data.tasks
      .filter((t) => {
        const project = t.projectId ? data.projects.find((p) => p.id === t.projectId) : null;
        const haystack = `${t.title} ${t.description ?? ''} ${project?.name ?? ''} ${(t.tags ?? []).join(' ')}`.toLowerCase();
        return haystack.includes(term);
      })
      .map((t) => {
        const project = t.projectId ? data.projects.find((p) => p.id === t.projectId) : null;
        return { id: t.id, title: t.title, projectId: t.projectId ?? null, projectName: project?.name, status: t.status, category: t.category };
      });
    return { projects: projects.slice(0, 10), tasks: tasks.slice(0, 10) };
  }
}
