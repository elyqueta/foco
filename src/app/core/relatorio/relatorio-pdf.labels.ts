/**
 * Traduções pt-PT do Relatório de Produtividade.
 * Todo texto visível ao utilizador passa por aqui.
 */

export const RELATORIO_LABELS = {
  // Título e subtítulo
  title: 'Relatório de Produtividade',
  subtitle: 'Visão geral dos teus projetos e tarefas',
  generatedBy: 'Gerado pela API Foco',
  backupPersonal: 'Backup pessoal do utilizador',

  // Utilizador e data
  userLabel: 'Utilizador',
  generatedAtLabel: 'Gerado em',
  timezoneLabel: 'Fuso horário',

  // Período
  periodLabel: 'Período',

  // Indicadores (faixa de 7)
  indicatorProjects: 'Projetos',
  indicatorProjectsActive: 'Projetos ativos',
  indicatorTasks: 'Tarefas',
  indicatorTasksCompleted: 'Concluídas',
  indicatorTasksPending: 'Pendentes',
  indicatorTasksOverdue: 'Atrasadas',
  indicatorTasksDueToday: 'Para hoje',

  // Secções
  sectionProjects: 'Projetos',
  sectionTasks: 'Tarefas',
  sectionProjectsSubtitle: 'Projetos ativos no teu momento',
  sectionTasksSubtitle: 'Tarefas para manter o foco',

  // Campos de projeto
  projectDeadline: 'Prazo',
  projectUrgency: 'Urgência',
  projectProgress: 'Progresso',
  projectNextStep: 'Próximo passo',

  // Campos de tarefa
  taskDueToday: 'Prazo hoje',
  taskNoDeadline: 'Sem prazo',
  taskMinutes: 'min',

  // Estados vazios
  emptyProjects: 'Sem projetos neste período.',
  emptyTasks: 'Sem tarefas neste período.',

  // Rodapé
  pageXofY: 'Página {0} de {1}',

  // Enums - estados de projeto
  projectStatus: {
    active: 'Ativo',
    paused: 'Pausado',
    done: 'Concluído',
  },

  // Enums - urgência
  urgency: {
    critical: 'Crítica',
    high: 'Alta',
    medium: 'Média',
    low: 'Baixa',
  },

  // Enums - estado de tarefa
  taskStatus: {
    todo: 'Por fazer',
    in_progress: 'Em curso',
    done: 'Concluída',
    postponed: 'Adiada',
    expired: 'Expirada',
  },

  // Enums - prioridade de tarefa
  taskPriority: {
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta',
    critical: 'Crítica',
  },

  // Enums - categoria
  category: {
    professional: 'Profissional',
    personal: 'Pessoal',
    household: 'Doméstico',
  },
} as const;

export type LabelKey = keyof typeof RELATORIO_LABELS;
