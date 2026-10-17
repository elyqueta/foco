export type ApiUrgency = 'critical' | 'high' | 'medium' | 'low';
export type ApiProjectStatus = 'active' | 'paused' | 'done';
export type ApiTaskStatus = 'todo' | 'in_progress' | 'done' | 'postponed' | 'expired';

/** Tipos de notificação criados pelo servidor (eventos + scheduler). */
export type ApiNotificationType =
  | 'task_due_soon'
  | 'task_due_imminent'
  | 'task_expired'
  | 'task_completed'
  | 'task_estimate_exceeded'
  | 'timer_running_long'
  | 'project_due_soon'
  | 'project_overdue'
  | 'project_ready_to_complete'
  | 'task_overdue_postponed'
  | 'daily_digest';

export interface ApiNotification {
  id: string;
  type: ApiNotificationType;
  title: string;
  body: string;
  /** Assunto da notificação, quando existe. */
  data?: {
    taskId?: string;
    projectId?: string;
  };
  readAt: string | null;
  createdAt: string;
}

export interface ApiNotificationFilters {
  /** Só as não lidas. */
  unread?: boolean;
  /** Máximo de notificações devolvidas (1…100, 50 por omissão). */
  limit?: number;
  /** UUID da última notificação da página anterior (paginação para trás). */
  before?: string;
}

export type ApiActivityType =
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

export interface ApiActivityEntry {
  id: string;
  at: string;
  type: ApiActivityType;
  message: string;
}

export interface ApiProgress {
  total: number;
  done: number;
  percent: number;
}

export interface ApiProject {
  id: string;
  name: string;
  description: string;
  category: string;
  urgency: ApiUrgency;
  status: ApiProjectStatus;
  canPostpone: boolean;
  dueDate: string | null;
  nextStep: string;
  color: string;
  progress?: ApiProgress;
  createdAt: string;
  updatedAt: string;
  activity?: ApiActivityEntry[];
}

export interface ApiProjectInput {
  name?: string;
  description?: string;
  category?: string;
  urgency?: ApiUrgency;
  status?: ApiProjectStatus;
  canPostpone?: boolean;
  dueDate?: string | null;
  nextStep?: string;
  color?: string;
}

export interface ApiTaskTimer {
  state: 'idle' | 'running' | 'paused' | 'stopped';
  runningSince: string | null;
  trackedSeconds: number;
  serverNow: string;
  firstStartedAt: string | null;
}

export interface ApiTask {
  id: string;
  projectId: string | null;
  title: string;
  description: string;
  category: string;
  urgency: ApiUrgency;
  status: ApiTaskStatus;
  canPostpone: boolean;
  dueDate: string | null;
  nextStep: string;
  estimateMinutes: number | null;
  tags: string[];
  isOverdue: boolean;
  postponedCount: number;
  timer?: ApiTaskTimer;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  activity?: ApiActivityEntry[];
}

export interface ApiTaskInput {
  title?: string;
  description?: string;
  category?: string;
  urgency?: ApiUrgency;
  status?: ApiTaskStatus;
  canPostpone?: boolean;
  dueDate?: string | null;
  nextStep?: string;
  estimateMinutes?: number | null;
  tags?: string[];
  projectId?: string | null;
}

export interface ApiTaskListFilters {
  category?: string;
  urgency?: ApiUrgency;
  status?: string;
  projectId?: string;
  q?: string;
  dueFrom?: string;
  dueTo?: string;
  includeDone?: boolean;
  includeExpired?: boolean;
  sort?: 'urgency' | 'dueDate' | 'createdAt';
}

export interface ApiTaskActionResult {
  task: ApiTask;
  suggestCompleteProject?: { id: string; name: string } | null;
}

/** Resposta de start/resume do timer: a tarefa e a que foi pausada automaticamente. */
export interface ApiTimerActionResult {
  task: ApiTask;
  pausedTask?: ApiTask | null;
}

/** Resposta paginada da API (`items` + metadados). */
export interface ApiPaginated<T> {
  items: T[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  counts?: Record<string, number>;
}

export interface ApiProjectList extends ApiPaginated<ApiProject> {}

export interface ApiTaskList extends ApiPaginated<ApiTask> {}

export interface ApiCategory {
  name: string;
  isDefault: boolean;
  tasksCount: number;
  projectsCount: number;
}

export interface NotificationChannelPrefs {
  email?: boolean;
  inApp?: boolean;
}

export interface NotificationPreferences {
  emailEnabled?: boolean;
  inAppEnabled?: boolean;
  types?: Record<string, NotificationChannelPrefs>;
}

export interface ApiSettings {
  /** O servidor devolve `userName`; `name` é aceite como alternativa. */
  userName?: string;
  name?: string;
  theme?: 'light' | 'dark';
  timezone?: string;
  email?: string;
  notifications?: NotificationPreferences;
}

export interface ApiSettingsInput {
  userName?: string;
  theme?: 'light' | 'dark';
  timezone?: string;
  notifications?: NotificationPreferences;
}

export interface ApiAuthUser {
  id: number;
  name: string;
  email: string;
}

export interface ApiProjectFilters {
  category?: string;
  status?: ApiProjectStatus;
  q?: string;
}

export interface ImportRequest {
  projects?: Array<{ name: string; description?: string; category?: string; urgency?: string; status?: string; canPostpone?: boolean; dueDate?: string | null; nextStep?: string; color?: string; id?: string | null }>;
  tasks?: Array<{ title: string; description?: string; category?: string; urgency?: string; status?: string; canPostpone?: boolean; dueDate?: string | null; nextStep?: string; estimateMinutes?: number | null; tags?: string[]; projectId?: string | null }>;
}

export interface ImportResponse {
  ok: boolean;
  projectsCreated?: number;
  tasksCreated?: number;
  errors?: string[];
}

export interface SearchResult {
  projects: Array<{ id: string; name: string; category: string; status: string }>;
  tasks: Array<{ id: string; title: string; projectId: string | null; projectName?: string; status: string; category: string }>;
}
