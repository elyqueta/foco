import { Injectable } from '@angular/core';
import {
  ProductivityReportResponse,
  ReportPeriodType,
} from './relatorio.models';
import { RELATORIO_THEME } from './relatorio-pdf.theme';
import { RELATORIO_LABELS } from './relatorio-pdf.labels';

type TFont = 'regular' | 'medium' | 'semibold' | 'bold';

/**
 * Serviço de geração do PDF do Relatório de Produtividade.
 * Carrega o pdfmake e as fontes Roboto via import() dinâmico apenas quando solicitado.
 * Não usa imagens (evita problemas de formato no pdfmake); usa canvas, texto e badges de tabela.
 */
@Injectable({ providedIn: 'root' })
export class RelatorioPdfService {
  private pdfMake: any = null;
  private loaded = false;

  /** Nome do ficheiro gerado. */
  fileName(period: ReportPeriodType): string {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD, sem fuso
    return `relatorio-produtividade-${period}-${today}.pdf`;
  }

  /** Carrega pdfmake uma única vez e registra as fontes Roboto via vfs. */
  private async ensureLoaded(): Promise<void> {
    if (this.loaded) return;
    const pdfMakeModule: any = await import('pdfmake/build/pdfmake');
    const vfsModule: any = await import('pdfmake/build/vfs_fonts');

    this.pdfMake = pdfMakeModule.default ?? pdfMakeModule;
    const vfs =
      vfsModule.default?.pdfMake?.vfs ??
      vfsModule.pdfMake?.vfs ??
      vfsModule.default ??
      vfsModule;

    if (typeof this.pdfMake.addVirtualFileSystem === 'function') {
      this.pdfMake.addVirtualFileSystem(vfs);
    } else {
      this.pdfMake.vfs = vfs;
    }

    const fonts = {
      Roboto: {
        normal: 'Roboto-Regular.ttf',
        bold: 'Roboto-Medium.ttf',
        italics: 'Roboto-Italic.ttf',
        bolditalics: 'Roboto-MediumItalic.ttf',
      },
    };
    if (typeof this.pdfMake.addFonts === 'function') {
      this.pdfMake.addFonts(fonts);
    } else {
      this.pdfMake.fonts = fonts;
    }

    this.loaded = true;
  }

  /** Nome da fonte padrão do pdfmake (Roboto, registada via addFonts). */
  private font(): string {
    return 'Roboto';
  }

  /** Formata uma string YYYY-MM-DD para "DD mes. YYYY" (pt-PT, sem dependência de fuso). */
  private formatDatePt(dateStr: string | null): string {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const mesPt = ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'];
    const mesIdx = parseInt(parts[1], 10) - 1;
    return `${parts[2]} ${mesPt[mesIdx] ?? parts[1]} ${parts[0]}`;
  }

  /** Formata ISO 8601 para "DD/MM/YYYY HH:mm" (sem dependência de fuso). */
  private formatDateTimePt(iso: string): string {
    const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
    if (!m) return iso;
    const mesPt = ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'];
    const mesIdx = parseInt(m[2], 10) - 1;
    return `${m[3]} ${mesPt[mesIdx] ?? m[2]} ${m[1]} ${m[4]}:${m[5]}`;
  }

  /** Traduz um enum usando o ficheiro de labels. */
  private label(map: Record<string, string>, value: string | null | undefined): string {
    if (!value) return '';
    return map[value] ?? value;
  }

  /** Badge (etiqueta) como tabela de célula única com preenchimento colorido. */
  private badge(text: string, bg: string, fg: string): any {
    return {
      width: 'auto',
      table: {
        body: [[{ text, fontSize: 9, bold: true, color: fg, fillColor: bg, alignment: 'center', margin: [6, 1.5, 6, 1.5] }]],
      },
      layout: 'noBorders',
      margin: [0, 0, 4, 0],
    };
  }

  /** Barra de progresso (canvas): fundo + preenchimento. */
  private progressBar(progress: number): any[] {
    const theme = RELATORIO_THEME;
    const width = 150;
    const height = 6;
    return [
      { type: 'rect', x: 0, y: 0, w: width, h: height, r: 3, color: theme.surfaceLine },
      { type: 'rect', x: 0, y: 0, w: width * (progress / 100), h: height, r: 3, color: theme.brand },
    ];
  }

  /** Caractere Unicode simples para usar como ícone (sem imagens). */
  private iconChar(tipo: 'project' | 'task' | 'date' | 'time' | 'progress' | 'check' | 'folder'): string {
    switch (tipo) {
      case 'project': return '■';
      case 'task': return '●';
      case 'date': return '◐';
      case 'time': return '↻';
      case 'progress': return '▬';
      case 'check': return '✓';
      case 'folder': return '▭';
      default: return '•';
    }
  }

  // ========================================================================
  // Blocos de construção do documento
  // ========================================================================

  /** Cabeçalho completo (página 1 e repetido nas páginas seguintes). */
  private headerBlock(report: ProductivityReportResponse['data']): any {
    const { report: meta, user } = report;
    const theme = RELATORIO_THEME;
    const labels = RELATORIO_LABELS;

    return [
      {
        columns: [
          {
            width: '55%',
            stack: [
              {
                text: 'Foco',
                fontSize: 24,
                bold: true,
                color: theme.brand,
                margin: [0, 0, 0, 6],
              },
              {
                text: labels.title,
                fontSize: theme.fontSize.h1,
                bold: true,
                color: theme.ink,
                margin: [0, 0, 0, 4],
              },
              {
                text: labels.subtitle,
                fontSize: theme.fontSize.body,
                color: theme.ink500,
                margin: [0, 0, 0, 8],
              },
              {
                stack: [
                  { text: `${labels.userLabel}: ${user.name}`, fontSize: theme.fontSize.body, color: theme.ink },
                  { text: `${labels.generatedAtLabel}: ${this.formatDateTimePt(meta.generated_at)}`, fontSize: theme.fontSize.body, color: theme.ink },
                  { text: `${labels.periodLabel}: ${meta.period.label}`, fontSize: theme.fontSize.body, color: theme.ink },
                ],
                margin: [0, 0, 0, 10],
              },
            ],
          },
          {
            width: '45%',
            stack: [
              {
                canvas: [
                  { type: 'rect', x: 0, y: 0, w: 180, h: 80, r: 8, color: theme.brandLight },
                  { type: 'rect', x: 120, y: 20, w: 40, h: 40, r: 20, color: '#FFFFFF', opacity: 0.6 },
                ],
                margin: [0, 0, 0, 0],
              },
              {
                text: 'Grandes resultados nascem de pequenos passos consistentes.',
                fontSize: 9,
                color: theme.ink700,
                margin: [0, 10, 0, 0],
                alignment: 'center',
              },
            ],
          },
        ],
        margin: [0, 0, 0, 16],
      },
      {
        canvas: [
          { type: 'rect', x: 0, y: 0, w: theme.contentWidth, h: 1, color: theme.surfaceLine },
        ],
        margin: [0, 0, 0, 12],
      },
    ];
  }

  /** Faixa de 7 indicadores com caracteres simples como ícones. */
  private indicatorsBlock(summary: ProductivityReportResponse['data']['summary']): any {
    const labels = RELATORIO_LABELS;
    const theme = RELATORIO_THEME;

    const indicators = [
      { icon: this.iconChar('project'), value: summary.projects_total, label: labels.indicatorProjects },
      { icon: this.iconChar('project'), value: summary.projects_active, label: labels.indicatorProjectsActive },
      { icon: this.iconChar('task'), value: summary.tasks_total, label: labels.indicatorTasks },
      { icon: this.iconChar('task'), value: summary.tasks_completed, label: labels.indicatorTasksCompleted },
      { icon: this.iconChar('task'), value: summary.tasks_pending, label: labels.indicatorTasksPending },
      { icon: this.iconChar('task'), value: summary.tasks_overdue, label: labels.indicatorTasksOverdue },
      { icon: this.iconChar('date'), value: summary.tasks_due_today, label: labels.indicatorTasksDueToday },
    ];

    return {
      columns: indicators.map((ind) => ({
        width: '14.28%', // 7 colunas
        stack: [
          {
            text: ind.icon,
            fontSize: 16,
            color: theme.brand,
            alignment: 'center',
            margin: [0, 0, 0, 6],
          },
          {
            text: String(ind.value),
            fontSize: theme.fontSize.indicatorNumber,
            bold: true,
            color: theme.brand,
            alignment: 'center',
            margin: [0, 0, 0, 2],
          },
          {
            text: ind.label,
            fontSize: theme.fontSize.indicatorLabel,
            color: theme.ink500,
            alignment: 'center',
          },
        ],
      })),
      margin: [0, 0, 0, theme.spacing.sectionGap],
    };
  }

  /** Cabeçalho de secção com caractere simples como ícone. */
  private sectionHeader(title: string, subtitle: string, count: number, tipoIcone: 'project' | 'task'): any {
    const theme = RELATORIO_THEME;
    return {
      columns: [
        {
          stack: [
            {
              text: this.iconChar(tipoIcone),
              fontSize: 16,
              color: theme.brand,
              margin: [0, 0, 0, 6],
            },
            {
              text: title,
              fontSize: theme.fontSize.h2,
              bold: true,
              color: theme.ink,
              margin: [0, 0, 0, 2],
            },
            {
              text: `${subtitle} (${count})`,
              fontSize: theme.fontSize.small,
              color: theme.ink500,
            },
          ],
        },
      ],
      margin: [0, 0, 0, theme.spacing.cardGap],
    };
  }

  /** Cartão de projeto (unbreakable: não parte entre páginas). */
  private projectCard(project: ProductivityReportResponse['data']['projects'][0]): any {
    const theme = RELATORIO_THEME;
    const labels = RELATORIO_LABELS;
    const deadline = project.deadline ? this.formatDatePt(project.deadline) : '';
    const urgencyLabel = this.label(labels.urgency, project.urgency);
    const statusLabel = this.label(labels.projectStatus, project.status);
    const nextStep = project.next_step || '';

    return {
      unbreakable: true,
      margin: [0, 0, 0, theme.spacing.cardGap],
      stack: [
        {
          columns: [
            {
              width: 56,
              stack: [
                {
                  text: this.iconChar('project'),
                  fontSize: 24,
                  color: theme.brand,
                  alignment: 'center',
                  margin: [0, 0, 0, 4],
                },
              ],
            },
            {
              width: '*',
              stack: [
                {
                  columns: [
                    {
                      width: '*',
                      text: project.name,
                      fontSize: theme.fontSize.h3,
                      bold: true,
                      color: theme.ink,
                    },
                    {
                      width: 'auto',
                      stack: [
                        this.badge(statusLabel, projectStatusColor(project.status), projectStatusFg(project.status)),
                      ],
                    },
                  ],
                },
                {
                  text: project.description,
                  fontSize: theme.fontSize.small,
                  color: theme.ink500,
                  margin: [0, 4, 0, 8],
                },
                {
                  columns: [
                    {
                      width: '25%',
                      stack: [
                        { text: labels.projectDeadline, fontSize: theme.fontSize.tiny, color: theme.ink500, bold: true },
                        { text: deadline || '—', fontSize: theme.fontSize.body, color: theme.ink, margin: [0, 1, 0, 6] },
                      ],
                    },
                    {
                      width: '25%',
                      stack: [
                        { text: labels.projectUrgency, fontSize: theme.fontSize.tiny, color: theme.ink500, bold: true },
                        this.badge(urgencyLabel, urgencyColor(project.urgency), urgencyFg(project.urgency)),
                      ],
                    },
                    {
                      width: '25%',
                      stack: [
                        { text: labels.projectProgress, fontSize: theme.fontSize.tiny, color: theme.ink500, bold: true },
                        { text: `${project.progress}%`, fontSize: theme.fontSize.body, bold: true, color: theme.brand, margin: [0, 1, 0, 6] },
                        { stack: [{ canvas: this.progressBar(project.progress) }], margin: [0, 0, 0, 6] },
                      ],
                    },
                    {
                      width: '25%',
                      stack: [
                        { text: labels.projectNextStep, fontSize: theme.fontSize.tiny, color: theme.ink500, bold: true },
                        { text: nextStep || '—', fontSize: theme.fontSize.body, color: theme.ink, margin: [0, 1, 0, 0] },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          canvas: [{ type: 'rect', x: 0, y: 0, w: theme.contentWidth, h: 1, color: theme.surfaceLine }],
          margin: [0, 4, 0, 0],
        },
      ],
    };
  }

  /** Linha de tarefa (unbreakable: não parte entre páginas). */
  private taskRow(task: ProductivityReportResponse['data']['tasks'][0]): any {
    const theme = RELATORIO_THEME;
    const labels = RELATORIO_LABELS;
    const dueDate = task.due_date ? this.formatDatePt(task.due_date) : '';
    const isDueToday = task.due_label === 'today';
    const priorityLabel = this.label(labels.taskPriority, task.priority);
    const statusLabel = this.label(labels.taskStatus, task.status);
    const categoryLabel = this.label(labels.category, task.category);
    const est = task.estimated_minutes != null ? `${task.estimated_minutes} ${labels.taskMinutes}` : '—';

    return {
      unbreakable: true,
      margin: [0, 0, 0, theme.spacing.cardGap / 2],
      stack: [
        {
          columns: [
            {
              width: 40,
              stack: [
                {
                  text: this.iconChar('task'),
                  fontSize: 16,
                  color: theme.brand,
                  alignment: 'center',
                  margin: [0, 0, 0, 2],
                },
              ],
            },
            {
              width: '*',
              stack: [
                {
                  columns: [
                    {
                      width: '*',
                      text: task.title,
                      fontSize: theme.fontSize.body,
                      bold: true,
                      color: theme.ink,
                    },
                    {
                      width: 'auto',
                      stack: [
                        this.badge(statusLabel, taskStatusColor(task.status), taskStatusFg(task.status)),
                      ],
                    },
                  ],
                },
                {
                  columns: [
                    {
                      width: '20%',
                      stack: [
                        { text: categoryLabel, fontSize: theme.fontSize.tiny, color: theme.ink500, bold: true },
                      ],
                    },
                    {
                      width: '20%',
                      stack: [
                        { text: priorityLabel, fontSize: theme.fontSize.tiny, color: theme.ink500, bold: true },
                        this.badge(priorityLabel, urgencyColor(task.priority), urgencyFg(task.priority)),
                      ],
                    },
                    {
                      width: '20%',
                      stack: [
                        {
                          text: task.due_date ? (isDueToday ? labels.taskDueToday : dueDate) : labels.taskNoDeadline,
                          fontSize: theme.fontSize.tiny,
                          color: isDueToday ? theme.warn : theme.ink500,
                          bold: isDueToday,
                        },
                        { text: est, fontSize: theme.fontSize.tiny, color: theme.ink500 },
                      ],
                    },
                    {
                      width: '20%',
                      stack: [
                        {
                          text: this.iconChar('time'),
                          fontSize: 10,
                          color: theme.ink500,
                          alignment: 'center',
                          margin: [0, 0, 0, 0],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          canvas: [{ type: 'rect', x: 0, y: 0, w: theme.contentWidth, h: 0.5, color: theme.surfaceLine }],
          margin: [0, 3, 0, 0],
        },
      ],
    };
  }

  /** Estado vazio para uma secção. */
  private emptyBlock(message: string, tipoIcone: 'project' | 'task'): any {
    const theme = RELATORIO_THEME;
    return {
      columns: [
        {
          stack: [
            {
              text: this.iconChar(tipoIcone),
              fontSize: 24,
              color: theme.brand,
              alignment: 'center',
              margin: [0, 0, 0, 8],
            },
            {
              text: message,
              fontSize: theme.fontSize.body,
              color: theme.ink500,
              alignment: 'center',
            },
          ],
        },
      ],
      margin: [0, 0, 0, theme.spacing.sectionGap],
    };
  }

  /** Secção de projetos (com cabeçalho repetível e estados vazios). */
  private projectsBlock(projects: ProductivityReportResponse['data']['projects']): any[] {
    const blocks: any[] = [];
    if (projects.length === 0) {
      blocks.push(this.emptyBlock(RELATORIO_LABELS.emptyProjects, 'project'));
      return blocks;
    }
    blocks.push(this.sectionHeader(RELATORIO_LABELS.sectionProjects, RELATORIO_LABELS.sectionProjectsSubtitle, projects.length, 'project'));
    for (const p of projects) {
      blocks.push(this.projectCard(p));
    }
    return blocks;
  }

  /** Secção de tarefas (com cabeçalho repetível e estados vazios). */
  private tasksBlock(tasks: ProductivityReportResponse['data']['tasks']): any[] {
    const blocks: any[] = [];
    if (tasks.length === 0) {
      blocks.push(this.emptyBlock(RELATORIO_LABELS.emptyTasks, 'task'));
      return blocks;
    }
    blocks.push(this.sectionHeader(RELATORIO_LABELS.sectionTasks, RELATORIO_LABELS.sectionTasksSubtitle, tasks.length, 'task'));
    for (const t of tasks) {
      blocks.push(this.taskRow(t));
    }
    return blocks;
  }

  // ========================================================================
  // Montagem do documento
  // ========================================================================

  async buildDocument(report: ProductivityReportResponse): Promise<any> {
    await this.ensureLoaded();
    const data = report.data;
    const theme = RELATORIO_THEME;

    const docDefinition: any = {
      pageSize: 'A4',
      pageMargins: [theme.spacing.pageMargin, 40, theme.spacing.pageMargin, 60],
      header: (currentPage: number) => {
        if (currentPage === 1) return null;
        return this.headerBlock(data);
      },
      footer: (currentPage: number, pageCount: number) => {
        if (currentPage === 1) return null;

        return {
          columns: [
            {
              width: '60%',
              stack: [
                {
                  text: 'Foco',
                  fontSize: 14,
                  bold: true,
                  color: theme.brand,
                  margin: [0, 2, 0, 4],
                },
                {
                  text: `${RELATORIO_LABELS.generatedBy} · ${this.formatDateTimePt(data.report.generated_at)}`,
                  fontSize: theme.fontSize.tiny,
                  color: theme.ink400,
                },
              ],
            },
            {
              width: '40%',
              text: RELATORIO_LABELS.pageXofY.replace('{0}', String(currentPage)).replace('{1}', String(pageCount)),
              fontSize: theme.fontSize.tiny,
              color: theme.ink400,
              alignment: 'right',
              margin: [0, 14, 0, 0],
            },
          ],
          margin: [0, 10, 0, 0],
        };
      },
      content: [
        ...this.headerBlock(data),
        this.indicatorsBlock(data.summary),
        ...this.projectsBlock(data.projects),
        ...this.tasksBlock(data.tasks),
      ],
      styles: {},
      defaultStyle: {
        font: this.font(),
        fontSize: theme.fontSize.body,
        color: theme.ink,
      },
    };

    return docDefinition;
  }

  /** Gera o PDF e dispara o download no navegador. */
  async exportPdf(report: ProductivityReportResponse): Promise<void> {
    await this.ensureLoaded();
    const docDefinition = await this.buildDocument(report);
    const pdfDoc = this.pdfMake.createPdf(docDefinition);
    const fileName = this.fileName(report.data.report.period.type);
    pdfDoc.download(fileName);
  }
}

function urgencyColor(value: string): string {
  switch (value) {
    case 'critical': return RELATORIO_THEME.danger;
    case 'high': return RELATORIO_THEME.warn;
    case 'medium': return RELATORIO_THEME.brand;
    case 'low': return RELATORIO_THEME.success;
    default: return RELATORIO_THEME.ink500;
  }
}

function urgencyFg(value: string): string {
  switch (value) {
    case 'critical': return '#FFFFFF';
    case 'high': return '#FFFFFF';
    case 'medium': return '#FFFFFF';
    case 'low': return '#FFFFFF';
    default: return RELATORIO_THEME.ink500;
  }
}

function projectStatusColor(value: string): string {
  switch (value) {
    case 'active': return RELATORIO_THEME.successSoft;
    case 'paused': return RELATORIO_THEME.warnSoft;
    case 'done': return RELATORIO_THEME.ink300;
    default: return RELATORIO_THEME.surfaceLine;
  }
}

function projectStatusFg(value: string): string {
  switch (value) {
    case 'active': return RELATORIO_THEME.success;
    case 'paused': return RELATORIO_THEME.warn;
    case 'done': return RELATORIO_THEME.ink700;
    default: return RELATORIO_THEME.ink500;
  }
}

function taskStatusColor(value: string): string {
  switch (value) {
    case 'done': return RELATORIO_THEME.successSoft;
    case 'in_progress': return RELATORIO_THEME.brandLight;
    case 'postponed': return RELATORIO_THEME.warnSoft;
    case 'expired': return RELATORIO_THEME.dangerSoft;
    default: return RELATORIO_THEME.surfaceLine;
  }
}

function taskStatusFg(value: string): string {
  switch (value) {
    case 'done': return RELATORIO_THEME.success;
    case 'in_progress': return RELATORIO_THEME.brandDark;
    case 'postponed': return RELATORIO_THEME.warn;
    case 'expired': return RELATORIO_THEME.danger;
    default: return RELATORIO_THEME.ink500;
  }
}
