import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataStore } from '../../core/data.store';
import { ImportService } from '../../core/import.service';

@Component({
  selector: 'app-import',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './import.page.html',
})
export class ImportPage {
  private store = inject(DataStore);
  private importService = inject(ImportService);
  jsonText = signal('');
  errors = signal<string[]>([]);
  success = signal(false);

  exportJson(): void {
    const json = this.store.exportJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'foco-export.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  copyPrompt(): void {
    const text = 'Converte a lista de tarefas abaixo em JSON no formato do Foco (projects[] e tasks[]). category ∈ professional|personal|household. urgency ∈ critical|high|medium|low. dueDate em YYYY-MM-DD. Responde SÓ com JSON válido.';
    navigator.clipboard.writeText(text);
    alert('Prompt copiado para a área de transferência.');
  }

  importJson(): void {
    const result = this.importService.import(this.jsonText());
    if (result.ok) {
      this.errors.set([]);
      this.success.set(true);
      setTimeout(() => this.success.set(false), 3000);
    } else {
      this.errors.set(result.errors);
      this.success.set(false);
    }
  }

  clearForm(): void {
    this.jsonText.set('');
    this.errors.set([]);
    this.success.set(false);
  }
}
