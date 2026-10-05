import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataStore } from '../../core/data.store';
import { ConfirmService } from '../../core/confirm.service';
import { AppButtonComponent } from '../../shared/ui/button.component';

@Component({
  selector: 'app-categories-page',
  standalone: true,
  imports: [CommonModule, FormsModule, AppButtonComponent],
  template: `
    <div class="mt-8 max-w-[720px]">
      <h1 class="text-[28px] font-extrabold text-ink mb-2">Categorias</h1>
      <p class="text-[13px] text-ink-500 mb-6">Gere as categorias disponíveis para projetos e tarefas.</p>

      <div class="rounded-card bg-surface-card p-5 shadow-card mb-5">
        <h3 class="text-[16px] font-bold text-ink mb-4">Nova categoria</h3>
        <div class="flex gap-3">
          <input type="text" [(ngModel)]="newName" name="newCategory" class="min-w-0 flex-1 rounded-xl border border-surface-line bg-surface-card px-4 py-2.5 text-[13px] text-ink placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand/30" placeholder="Nome da categoria" (keydown.enter)="add()" />
          <app-button icon="plus" label="Adicionar" [disabled]="!canAdd()" buttonClass="shrink-0" (click)="add()"></app-button>
        </div>
        @if (error()) {
          <p class="mt-1.5 text-[11px] text-danger">{{ error() }}</p>
        }
      </div>

      <div class="rounded-card bg-surface-card p-5 shadow-card">
        <h3 class="text-[16px] font-bold text-ink mb-4">Categorias existentes</h3>
        <div class="flex flex-col gap-2">
          @for (cat of store.categories(); track cat) {
            <div class="flex items-center justify-between rounded-xl border border-surface-line px-4 py-3">
              <span class="text-[13px] font-semibold text-ink">{{ cat }}</span>
              @if (cat !== 'professional' && cat !== 'personal' && cat !== 'household') {
                <app-button variant="danger" size="sm" icon="trash-2" label="Remover" (click)="remove(cat)"></app-button>
              } @else {
                <span class="text-[11px] text-ink-400">Padrão</span>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class CategoriesPage {
  private store = inject(DataStore);
  private confirm = inject(ConfirmService);
  newName = signal('');
  error = signal('');

  canAdd(): boolean {
    const name = this.newName().trim();
    const cats = this.store.categories();
    return name.length >= 2 && !cats.includes(name);
  }

  add(): void {
    const name = this.newName().trim();
    if (!this.canAdd()) {
      this.error.set('Dá um nome com pelo menos 2 caracteres e que ainda não exista.');
      return;
    }
    this.store.addCategory(name);
    this.newName.set('');
    this.error.set('');
  }

  async remove(name: string): Promise<void> {
    const ok = await this.confirm.confirm({
      type: 'danger',
      title: 'Remover categoria?',
      message: `Isto remove a categoria "${name}". As tarefas e projetos que a usam voltam para "professional".`,
      confirmLabel: 'Remover',
    });
    if (!ok) return;
    this.store.removeCategory(name);
  }
}
