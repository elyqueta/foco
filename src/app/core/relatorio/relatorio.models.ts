/** Tipo de período solicitado ao back-end. */
export type ReportPeriodType =
  | 'today'
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month'
  | 'custom';

/** Parâmetros de consulta do endpoint de relatório. */
export interface ReportRequestParams {
  period: ReportPeriodType;
  start_date?: string; // YYYY-MM-DD, obrigatório quando period === 'custom'
  end_date?: string;   // YYYY-MM-DD, obrigatório quando period === 'custom'
  month?: string;      // YYYY-MM, opcional
}

/** Definição do período devolvida pelo back-end. */
export interface ReportPeriod {
  type: ReportPeriodType;
  label: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
}

/** Bloco de metadados do relatório. */
export interface ReportMeta {
  title: string;
  period: ReportPeriod;
  generated_at: string; // ISO 8601
  timezone: string;
}

/** Dados do utilizador. */
export interface ReportUser {
  name: string;
}

/** Indicadores resumidos. */
export interface ReportSummary {
  projects_total: number;
  projects_active: number;
  tasks_total: number;
  tasks_completed: number;
  tasks_pending: number;
  tasks_overdue: number;
  tasks_due_today: number;
  completion_rate: number; // percentagem (0-100)
}

/** Item de projeto devolvido pelo back-end. */
export interface ReportProject {
  id: string;
  name: string;
  description: string;
  category: string;
  status: string;
  deadline: string | null; // YYYY-MM-DD
  urgency: string;
  progress: number; // 0-100
  next_step: string;
}

/** Item de tarefa devolvido pelo back-end. */
export interface ReportTask {
  id: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  due_date: string | null; // YYYY-MM-DD
  due_label: string;
  estimated_minutes: number | null;
  project_id: string | null;
}

/** Resposta completa do endpoint (dentro de `data`). */
export interface ProductivityReportResponse {
  data: {
    report: ReportMeta;
    user: ReportUser;
    summary: ReportSummary;
    projects: ReportProject[];
    tasks: ReportTask[];
  };
}

/** Períodos disponíveis para o seletor de UI. */
export interface ReportPeriodOption {
  value: ReportPeriodType;
  label: string;
  needsDates: boolean; // true quando 'custom'
  needsMonth: boolean; // true quando 'this_month' / 'last_month' (usa `month` param)
}
