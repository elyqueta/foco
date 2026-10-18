import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RelatorioPdfService } from './relatorio-pdf.service';
import { ProductivityReportResponse } from './relatorio.models';

// Mock do pdfmake (carregado dinamicamente)
const mockCreatePdf = vi.fn(() => ({
  download: vi.fn(),
}));
const mockFontMap = {};
const mockVfs = { pdfMake: { vfs: {} } };

vi.mock('pdfmake/build/pdfmake', () => ({
  default: { fontMap: mockFontMap, createPdf: mockCreatePdf },
}));
vi.mock('pdfmake/build/vfs_fonts', () => ({
  default: mockVfs,
}));

function makeReport(overrides: Partial<ProductivityReportResponse['data']> = {}): ProductivityReportResponse {
  const base: ProductivityReportResponse['data'] = {
    report: {
      title: 'Relatório de Produtividade',
      period: { type: 'this_month', label: 'Este mês', start_date: '2026-10-01', end_date: '2026-10-31' },
      generated_at: '2026-10-17T19:51:00Z',
      timezone: 'Africa/Luanda',
    },
    user: { name: 'Cláudio Sassapa' },
    summary: {
      projects_total: 2,
      projects_active: 2,
      tasks_total: 4,
      tasks_completed: 0,
      tasks_pending: 4,
      tasks_overdue: 0,
      tasks_due_today: 0,
      completion_rate: 0,
    },
    projects: [
      {
        id: 'p1',
        name: 'Loja Nerd',
        description: 'Marca de acessórios tech para geeks e gamers.',
        category: 'personal',
        status: 'active',
        deadline: '2026-10-17',
        urgency: 'high',
        progress: 50,
        next_step: 'Definir catálogo inicial de 10 produtos',
      },
      {
        id: 'p2',
        name: 'destino-mussulo',
        description: 'Plataforma de reservas para o Mussulo.',
        category: 'professional',
        status: 'active',
        deadline: '2026-10-17',
        urgency: 'critical',
        progress: 50,
        next_step: 'Integrar API real no backend',
      },
    ],
    tasks: [
      {
        id: 't1',
        title: 'Compras do supermercado',
        category: 'household',
        priority: 'medium',
        status: 'todo',
        due_date: '2026-10-17',
        due_label: 'today',
        estimated_minutes: 30,
        project_id: null,
      },
      {
        id: 't2',
        title: 'Definir catálogo inicial',
        category: 'personal',
        priority: 'high',
        status: 'in_progress',
        due_date: '2026-10-17',
        due_label: 'today',
        estimated_minutes: 60,
        project_id: 'p1',
      },
      {
        id: 't3',
        title: 'Ligar para a mãe',
        category: 'personal',
        priority: 'low',
        status: 'todo',
        due_date: null,
        due_label: 'none',
        estimated_minutes: 15,
        project_id: null,
      },
      {
        id: 't4',
        title: 'Integrar API real no destino-mussulo',
        category: 'professional',
        priority: 'critical',
        status: 'todo',
        due_date: '2026-10-17',
        due_label: 'today',
        estimated_minutes: 90,
        project_id: 'p2',
      },
    ],
    ...overrides,
  };
  return { data: base };
}

describe('RelatorioPdfService', () => {
  let service: RelatorioPdfService;

  beforeEach(async () => {
    service = new RelatorioPdfService();
    await (service as any).ensureLoaded();
  });

  it('deve construir documento com capa, indicadores, projetos e tarefas', async () => {
    const report = makeReport();
    const doc = await service.buildDocument(report);

    expect(doc.pageSize).toBe('A4');
    expect(Array.isArray(doc.content)).toBe(true);
    expect(doc.content.length).toBeGreaterThan(0);

    // Capa tem pageBreak
    const cover = doc.content[0];
    expect(cover.pageBreak).toBe('after');

    // Indicadores existem
    const indicators = doc.content.find((c: any) => c.columns);
    expect(indicators).toBeDefined();

    // Projetos e tarefas existem no content
    const contentJson = JSON.stringify(doc.content);
    expect(contentJson).toContain('Loja Nerd');
    expect(contentJson).toContain('destino-mussulo');
    expect(contentJson).toContain('Compras do supermercado');
    expect(contentJson).toContain('Integrar API real no destino-mussulo');
  });

  it('deve lidar com relatório sem projetos', async () => {
    const report = makeReport({ projects: [] });
    const doc = await service.buildDocument(report);

    const contentJson = JSON.stringify(doc.content);
    expect(contentJson).toContain('Sem projetos neste período.');
    expect(contentJson).not.toContain('Loja Nerd');
  });

  it('deve lidar com relatório sem tarefas', async () => {
    const report = makeReport({ tasks: [] });
    const doc = await service.buildDocument(report);

    const contentJson = JSON.stringify(doc.content);
    expect(contentJson).toContain('Sem tarefas neste período.');
    expect(contentJson).not.toContain('Compras do supermercado');
  });

  it('deve lidar com nomes muito longos sem quebrar o documento', async () => {
    const longName = 'A'.repeat(200);
    const longDesc = 'B'.repeat(500);
    const report = makeReport({
      projects: [{ id: 'p1', name: longName, description: longDesc, category: 'personal', status: 'active', deadline: null, urgency: 'medium', progress: 0, next_step: '' }],
      tasks: [{ id: 't1', title: 'C'.repeat(200), category: 'personal', priority: 'medium', status: 'todo', due_date: null, due_label: 'none', estimated_minutes: null, project_id: null }],
    });
    const doc = await service.buildDocument(report);

    const contentJson = JSON.stringify(doc.content);
    expect(contentJson).toContain(longName);
    expect(doc.content.length).toBeGreaterThan(0);
  });

  it('deve gerar documento com muitas tarefas (várias páginas)', async () => {
    const manyTasks = Array.from({ length: 50 }, (_, i) => ({
      id: `t${i}`,
      title: `Tarefa ${i + 1}`,
      category: 'personal',
      priority: 'medium',
      status: 'todo',
      due_date: null,
      due_label: 'none',
      estimated_minutes: 30,
      project_id: null,
    }));
    const report = makeReport({ projects: [], tasks: manyTasks });
    const doc = await service.buildDocument(report);

    const contentJson = JSON.stringify(doc.content);
    expect(contentJson).toContain('Tarefa 1');
    expect(contentJson).toContain('Tarefa 50');
    // Cabeçalho de secção deve aparecer
    expect(contentJson).toContain('Tarefas para manter o foco');
  });

  it('deve gerar nome de ficheiro correto', () => {
    expect(service.fileName('this_month')).toMatch(/^relatorio-produtividade-this_month-\d{4}-\d{2}-\d{2}\.pdf$/);
    expect(service.fileName('custom')).toMatch(/^relatorio-produtividade-custom-\d{4}-\d{2}-\d{2}\.pdf$/);
  });

  it('deve formatar data curta sem fuso horário', async () => {
    // Acede ao método privado via any para testar a formatação
    const formatted = (service as any).formatDatePt('2026-10-17');
    expect(formatted).toBe('17/10. 2026');

    const formattedNull = (service as any).formatDatePt(null);
    expect(formattedNull).toBe('');
  });

  it('deve chamar pdfMake.createPdf e download no exportPdf', async () => {
    const report = makeReport();
    await service.exportPdf(report);

    expect(mockCreatePdf).toHaveBeenCalled();
    const downloadMock = mockCreatePdf.mock.results[0]?.value.download;
    expect(downloadMock).toHaveBeenCalledWith(
      expect.stringMatching(/^relatorio-produtividade-this_month-\d{4}-\d{2}-\d{2}\.pdf$/)
    );
  });
});
