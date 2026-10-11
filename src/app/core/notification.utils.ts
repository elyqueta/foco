import { ApiNotification, ApiNotificationType } from './api.models';
import { AppNotification } from './models';

/** Tons visuais de uma notificação (cor do ícone). */
export type NotificationTone = 'success' | 'warning' | 'danger' | 'info';

interface NotificationAppearance {
  tone: NotificationTone;
  icon: string;
}

const TONE_CLASSES: Record<NotificationTone, string> = {
  success: 'bg-success',
  warning: 'bg-warn',
  danger: 'bg-danger',
  info: 'bg-brand',
};

/** Aparência de cada tipo de notificação criado pelo servidor. */
const APPEARANCES: Record<ApiNotificationType, NotificationAppearance> = {
  task_due_soon: { tone: 'warning', icon: 'clock' },
  task_due_imminent: { tone: 'danger', icon: 'triangle-alert' },
  task_expired: { tone: 'danger', icon: 'triangle-alert' },
  task_completed: { tone: 'success', icon: 'circle-check' },
  task_estimate_exceeded: { tone: 'warning', icon: 'timer' },
  timer_running_long: { tone: 'info', icon: 'timer' },
  project_due_soon: { tone: 'warning', icon: 'calendar' },
  project_overdue: { tone: 'danger', icon: 'triangle-alert' },
  project_ready_to_complete: { tone: 'success', icon: 'circle-check' },
  task_overdue_postponed: { tone: 'warning', icon: 'alarm-clock-plus' },
  daily_digest: { tone: 'info', icon: 'sparkles' },
};

/** Aparência dos tipos de exemplo do modo local. */
const LOCAL_APPEARANCES: Record<string, NotificationAppearance> = {
  focus: { tone: 'info', icon: 'target' },
  success: { tone: 'success', icon: 'circle-check' },
  warning: { tone: 'warning', icon: 'triangle-alert' },
  error: { tone: 'danger', icon: 'triangle-alert' },
  info: { tone: 'info', icon: 'info' },
};

/** Converte a notificação da API no modelo da app. */
export function mapNotification(api: ApiNotification): AppNotification {
  return {
    id: api.id,
    title: api.title,
    message: api.body ?? '',
    type: api.type,
    read: !!api.readAt,
    createdAt: api.createdAt,
    taskId: api.data?.taskId ?? null,
    projectId: api.data?.projectId ?? null,
  };
}

/** Ícone e tom de uma notificação (tipo da API ou de exemplo). */
export function notificationAppearance(type: string): { icon: string; toneClass: string } {
  const appearance = APPEARANCES[type as ApiNotificationType] ?? LOCAL_APPEARANCES[type] ?? LOCAL_APPEARANCES['info'];
  return { icon: appearance.icon, toneClass: TONE_CLASSES[appearance.tone] };
}

/** Rótulo legível do tipo de notificação. */
export function notificationTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    task_due_soon: 'Prazo próximo',
    task_due_imminent: 'Prazo iminente',
    task_expired: 'Prazo vencido',
    task_completed: 'Tarefa concluída',
    task_estimate_exceeded: 'Estimativa excedida',
    timer_running_long: 'Temporizador longo',
    project_due_soon: 'Projeto a vencer',
    project_overdue: 'Projeto atrasado',
    project_ready_to_complete: 'Projeto pronto a concluir',
    task_overdue_postponed: 'Tarefa adiada vencida',
    daily_digest: 'Resumo diário',
    // Tipos de exemplo do modo local.
    focus: 'Modo foco',
    success: 'Sucesso',
    warning: 'Aviso',
    error: 'Erro',
    info: 'Informação',
  };
  return labels[type] ?? type;
}
