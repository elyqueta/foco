import { Injectable, signal, effect } from '@angular/core';

type ConfirmConfig = {
  title: string;
  message: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  confirmLabel?: string;
  cancelLabel?: string;
};

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private _open = signal(false);
  private _config = signal<ConfirmConfig>({
    title: '',
    message: '',
    type: 'info',
    confirmLabel: 'Confirmar',
    cancelLabel: 'Cancelar',
  });
  private _resolver: ((value: boolean) => void) | null = null;

  open = this._open.asReadonly();
  config = this._config.asReadonly();

  constructor() {
    effect(() => {
      if (!this._open()) {
        this._resolver?.(false);
        this._resolver = null;
      }
    });
  }

  confirm(config: ConfirmConfig): Promise<boolean> {
    this._config.set({
      title: config.title,
      message: config.message,
      type: config.type ?? 'info',
      confirmLabel: config.confirmLabel ?? 'Confirmar',
      cancelLabel: config.cancelLabel ?? 'Cancelar',
    });
    this._open.set(true);

    return new Promise((resolve) => {
      this._resolver = resolve;
    });
  }

  onConfirm(): void {
    this._open.set(false);
    this._resolver?.(true);
    this._resolver = null;
  }

  onCancel(): void {
    this._open.set(false);
    this._resolver?.(false);
    this._resolver = null;
  }
}