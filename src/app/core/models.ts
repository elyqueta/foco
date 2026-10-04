export type Category = 'professional' | 'personal' | 'household';
export type Urgency = 'critical' | 'high' | 'medium' | 'low';
export type Status = 'todo' | 'in_progress' | 'done' | 'postponed';

export interface ActivityEntry {
  id: string;
  at: string;
  type: 'created' | 'status_changed' | 'note' | 'postponed' | 'edited' | 'next_step_changed';
  message: string;
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
}

export interface AppData {
  schemaVersion: 1;
  projects: Project[];
  tasks: Task[];
  settings: { theme: 'light' | 'dark'; userName: string };
}
