import { Injectable } from '@angular/core';
import { AppData } from './models';

const STORAGE_KEY = 'foco:data:v1';

export abstract class DataRepository {
  abstract load(): AppData;
  abstract save(data: AppData): void;
}

export function emptyAppData(): AppData {
  return {
    schemaVersion: 1,
    projects: [],
    tasks: [],
    settings: { theme: 'light', userName: 'Zua' },
  };
}

@Injectable({ providedIn: 'root' })
export class LocalStorageRepository extends DataRepository {
  load(): AppData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return emptyAppData();
      const parsed = JSON.parse(raw) as AppData;
      if (parsed.schemaVersion !== 1) return emptyAppData();
      return parsed;
    } catch {
      return emptyAppData();
    }
  }

  save(data: AppData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore storage errors
    }
  }
}
