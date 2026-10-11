import type { ApiNotificationType } from './api.models';

export type Category = string;
export type Urgency = 'critical' | 'high' | 'medium' | 'low';
export type Status = 'todo' | 'in_progress' | 'done' | 'postponed' | 'expired';

export interface ActivityEntry {
  id: string;
  at: string;
  type:
    | 'created'
    | 'status_changed'
    | 'note'
    | 'postponed'
    | 'edited'
    | 'next_step_changed'
    | 'expired'
    | 'timer_started'
    | 'timer_paused'
    | 'timer_resumed'
    | 'timer_stopped';
  message: string;
}

export interface TaskTimer {
  state: 'idle' | 'running' | 'paused' | 'stopped';
  runningSince: string | null;
  trackedSeconds: number;
  serverNow: string;
  firstStartedAt: string | null;
}

export interface Task {
  id: string;
  projectId: string | null;
  title: string;
  description: string;
  category: Category;
  urgency: Urgency;
  status: Status;
  canPostpone: boolean;
  dueDate: string | null;
  nextStep: string;
  estimateMinutes: number | null;
  tags: string[];
  activity: ActivityEntry[];
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  /** Preenchidos apenas quando a tarefa vem da API (modo API). */
  isOverdue?: boolean;
  postponedCount?: number;
  timer?: TaskTimer;
}

export interface ProjectProgress {
  total: number;
  done: number;
  percent: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  category: Category;
  urgency: Urgency;
  status: 'active' | 'paused' | 'done';
  canPostpone: boolean;
  dueDate: string | null;
  nextStep: string;
  color: string;
  activity: ActivityEntry[];
  createdAt: string;
  updatedAt: string;
  /** Preenchido apenas quando o projeto vem da API (modo API). */
  progress?: ProjectProgress;
}

export type ColorScheme = 'purple' | 'blue' | 'red' | 'gray';

export interface AppData {
  schemaVersion: 1;
  projects: Project[];
  tasks: Task[];
  settings: { theme: 'light' | 'dark'; userName: string; colorScheme: ColorScheme };
  categories: string[];
  /** Nomes das categorias padrão (protegidas); no modo API vem do servidor. */
  categoryDefaults?: string[];
}

export type NotificationType = 'focus' | 'success' | 'warning' | 'info' | 'error';

export interface Notification {
  title: string;
  message: string;
  type: NotificationType;
}

export interface AppNotification {
  id: string;
  title: string;
  /** Corpo da notificação (`body` na API). */
  message: string;
  /** Tipo do evento da API; no modo local, os tipos de exemplo. */
  type: ApiNotificationType | NotificationType;
  read: boolean;
  createdAt: string;
  /** Assunto da notificação, quando existe. */
  taskId?: string | null;
  projectId?: string | null;
}
