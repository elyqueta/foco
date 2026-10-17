import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { DataStore } from './data.store';
import { AuthService } from './auth/auth.service';

export interface OnboardingStep {
  id: string;
  target: string;
  title: string;
  description: string;
  placement: 'top' | 'bottom' | 'left' | 'right';
}

export interface OnboardingState {
  completed: boolean;
  currentStep: number;
}

const STORAGE_KEY = 'foco:onboarding:v1';

const STEPS: OnboardingStep[] = [
  {
    id: 'nav',
    target: '[data-onboarding="nav"]',
    title: 'Navegação principal',
    description: 'Use a barra lateral para aceder ao dashboard, projetos, tarefas, calendário, categorias e definições.',
    placement: 'right',
  },
  {
    id: 'new-task',
    target: '[data-onboarding="new-task"]',
    title: 'Criar uma tarefa',
    description: 'Toque em "Nova tarefa" para adicionar uma tarefa com título, categoria, urgência e prazo.',
    placement: 'bottom',
  },
  {
    id: 'task-list',
    target: '[data-onboarding="task-list"]',
    title: 'Gerir as suas tarefas',
    description: 'Toque numa tarefa para ver os detalhes ou marque-a como concluída no círculo à esquerda.',
    placement: 'top',
  },
  {
    id: 'focus',
    target: '[data-onboarding="focus"]',
    title: 'Modo foco',
    description: 'Inicie o temporizador para focar numa tarefa e acompanhe o tempo gasto.',
    placement: 'left',
  },
  {
    id: 'notifications',
    target: '[data-onboarding="notifications"]',
    title: 'Notificações',
    description: 'O sino mostra as suas notificações não lidas. As preferências podem ser ajustadas nas Definições.',
    placement: 'left',
  },
];

function readState(userId: string | null): OnboardingState {
  try {
    const key = userId ? `${STORAGE_KEY}:${userId}` : STORAGE_KEY;
    const raw = localStorage.getItem(key);
    if (!raw) return { completed: false, currentStep: 0 };
    const parsed = JSON.parse(raw) as OnboardingState;
    if (typeof parsed.completed !== 'boolean' || typeof parsed.currentStep !== 'number') {
      return { completed: false, currentStep: 0 };
    }
    return parsed;
  } catch {
    return { completed: false, currentStep: 0 };
  }
}

function writeState(userId: string | null, state: OnboardingState): void {
  try {
    const key = userId ? `${STORAGE_KEY}:${userId}` : STORAGE_KEY;
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private auth = inject(AuthService);
  private store = inject(DataStore);

  readonly steps = STEPS;
  readonly stepCount = STEPS.length;

  private readonly _open = signal(false);
  private readonly _currentStep = signal(0);
  private readonly _completed = signal(false);

  readonly open = this._open.asReadonly();
  readonly currentStep = this._currentStep.asReadonly();
  readonly completed = this._completed.asReadonly();
  readonly current = computed(() => this.steps[this._currentStep()] ?? null);
  readonly progress = computed(() =>
    this._completed() ? 100 : Math.round(((this._currentStep() + 1) / this.stepCount) * 100)
  );

  constructor() {
    effect(() => {
      const userId = this.auth.user()?.id;
      const state = readState(userId ? String(userId) : null);
      this._completed.set(state.completed);
      this._currentStep.set(state.currentStep);

      // Auto-launch on first visit (not completed and not already open)
      if (!state.completed && !this._open()) {
        this._open.set(true);
      }
    });
  }

  isCompleted(): boolean {
    return this._completed();
  }

  start(): void {
    this._open.set(true);
    this._currentStep.set(0);
  }

  next(): void {
    const next = this._currentStep() + 1;
    if (next >= this.stepCount) {
      this.finish();
    } else {
      this._currentStep.set(next);
      this.persist();
    }
  }

  prev(): void {
    if (this._currentStep() > 0) {
      this._currentStep.set(this._currentStep() - 1);
      this.persist();
    }
  }

  skip(): void {
    this.finish();
  }

  finish(): void {
    this._completed.set(true);
    this._open.set(false);
    this.persist();
  }

  close(): void {
    this._open.set(false);
    this.persist();
  }

  private persist(): void {
    const userId = this.auth.user()?.id;
    writeState(userId ? String(userId) : null, {
      completed: this._completed(),
      currentStep: this._currentStep(),
    });
  }
}
