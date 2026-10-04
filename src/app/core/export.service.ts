import { Injectable, inject } from '@angular/core';
import { DataStore } from './data.store';
import { AppData, Project, Task } from './models';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({ providedIn: 'root' })
export class ExportService {
  private readonly store = inject(DataStore);

  exportJson(): void {
    const data = this.store.exportJson();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = this.dateStamp();
    a.href = url;
    a.download = `foco-backup-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  exportPdf(): void {
    const data = this.store.data();
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 48;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    const title = (text: string, size = 16) => {
      doc.setFontSize(size);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 30, 40);
      doc.text(text, margin, y);
      y += size * 0.8;
    };

    const section = (text: string) => {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(99, 102, 241);
      doc.text(text.toUpperCase(), margin, y);
      y += 14;
    };

    const paragraph = (text: string) => {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 70);
      const lines = doc.splitTextToSize(text, contentWidth);
      doc.text(lines, margin, y);
      y += lines.length * 12;
    };

    title('Foco - Exportação de dados');
    paragraph(`Exportado em ${new Date().toLocaleString('pt-PT')}.`);
    paragraph(`Utilizador: ${data.settings.userName}`);
    y += 10;

    section('Projetos');
    if (data.projects.length === 0) {
      paragraph('Sem projetos.');
    } else {
      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [['Nome', 'Categoria', 'Urgência', 'Estado', 'Prazo', 'Passo seguinte']],
        body: data.projects.map((p: Project) => [
          p.name,
          p.category,
          p.urgency,
          p.status,
          p.dueDate ?? '-',
          p.nextStep ?? '-',
        ]),
        styles: {
          fontSize: 9,
          cellPadding: 6,
          fillColor: [255, 255, 255],
          textColor: [30, 30, 40],
        },
        headStyles: {
          fillColor: [99, 102, 241],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [245, 245, 250],
        },
      });
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 18;
    }

    section('Tarefas');
    if (data.tasks.length === 0) {
      paragraph('Sem tarefas.');
    } else {
      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [['Título', 'Categoria', 'Urgência', 'Estado', 'Prazo', 'Estimativa']],
        body: data.tasks.map((t: Task) => [
          t.title,
          t.category,
          t.urgency,
          t.status,
          t.dueDate ?? '-',
          t.estimateMinutes != null ? `${t.estimateMinutes} min` : '-',
        ]),
        styles: {
          fontSize: 9,
          cellPadding: 6,
          fillColor: [255, 255, 255],
          textColor: [30, 30, 40],
        },
        headStyles: {
          fillColor: [99, 102, 241],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [245, 245, 250],
        },
      });
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 18;
    }

    doc.save(`foco-export-${this.dateStamp()}.pdf`);
  }

  private dateStamp(): string {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  }
}
