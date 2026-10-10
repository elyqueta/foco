import { ActivityEntry } from './models';

const LABELS: Record<ActivityEntry['type'], string> = {
  created: 'Criado',
  status_changed: 'Estado alterado',
  note: 'Nota',
  postponed: 'Adiada',
  edited: 'Editado',
  next_step_changed: 'Próximo passo atualizado',
  expired: 'Expirada',
  timer_started: 'Temporizador iniciado',
  timer_paused: 'Temporizador pausado',
  timer_resumed: 'Temporizador retomado',
  timer_stopped: 'Temporizador parado',
};

/** Rótulo legível de um tipo de entrada de atividade. */
export function activityLabel(type: ActivityEntry['type']): string {
  return LABELS[type] ?? type;
}
