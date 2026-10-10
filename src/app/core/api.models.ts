export type ApiUrgency = 'critical' | 'high' | 'medium' | 'low';
export type ApiProjectStatus = 'active' | 'paused' | 'done';
export type ApiTaskStatus = 'todo' | 'in_progress' | 'done' | 'postponed' | 'expired';

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

export interface ApiSettings {
  /** O servidor devolve `userName`; `name` é aceite como alternativa. */
  userName?: string;
  name?: string;
  theme?: 'light' | 'dark';
  timezone?: string;
  email?: string;
  notifications?: Record<string, unknown>;
}

export interface ApiSettingsInput {
  userName?: string;
  theme?: 'light' | 'dark';
  timezone?: string;
  notifications?: Record<string, unknown>;
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
