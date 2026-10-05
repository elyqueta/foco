import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { DataStore } from './data.store';

export type ColorScheme = 'purple' | 'blue' | 'red' | 'gray';

const SCHEMES: Record<ColorScheme, { brand: string; brand600: string; brand400: string; brand100: string; brand50: string; brandFg: string; strong: string; rgb: [number, number, number]; primary: string; primaryDark: string; primaryFg: string; focoLogo: string }> = {
  purple: {
    brand: '108 92 231',
    brand600: '91 75 214',
    brand400: '133 119 240',
    brand100: '236 234 253',
    brand50: '244 243 254',
    brandFg: '108 92 231',
    strong: '27 24 64',
    rgb: [108, 92, 231],
    primary: '108 92 231',
    primaryDark: '86 75 186',
    primaryFg: '255 255 255',
    focoLogo: '#6C5CE7',
  },
  blue: {
    brand: '37 99 235',
    brand600: '29 78 216',
    brand400: '59 130 246',
    brand100: '219 234 254',
    brand50: '239 246 255',
    brandFg: '37 99 235',
    strong: '15 23 42',
    rgb: [37, 99, 235],
    primary: '37 99 235',
    primaryDark: '29 78 216',
    primaryFg: '255 255 255',
    focoLogo: '#2563EB',
  },
  red: {
    brand: '220 38 38',
    brand600: '185 28 28',
    brand400: '248 113 113',
    brand100: '254 226 226',
    brand50: '255 242 242',
    brandFg: '220 38 38',
    strong: '30 27 27',
    rgb: [220, 38, 38],
    primary: '220 38 38',
    primaryDark: '175 30 30',
    primaryFg: '255 255 255',
    focoLogo: '#DC2626',
  },
  gray: {
    brand: '75 85 99',
    brand600: '55 65 81',
    brand400: '148 163 184',
    brand100: '241 245 249',
    brand50: '248 250 252',
    brandFg: '75 85 99',
    strong: '15 23 42',
    rgb: [75, 85, 99],
    primary: '75 85 99',
    primaryDark: '55 65 81',
    primaryFg: '255 255 255',
    focoLogo: '#4B5563',
  },
};

@Injectable({ providedIn: 'root' })
export class ColorSchemeService {
  private readonly store = inject(DataStore);
  private readonly _scheme = signal<ColorScheme>(this.read());
  readonly scheme = this._scheme.asReadonly();

  constructor() {
    effect(() => {
      this.apply(this._scheme());
    });
  }

  set(scheme: ColorScheme): void {
    this._scheme.set(scheme);
    this.store.setColorScheme(scheme);
  }

  colors(): Record<string, string> {
    const scheme = SCHEMES[this._scheme()];
    const { rgb: _, ...rest } = scheme;
    return rest;
  }

  rgb(): [number, number, number] {
    return SCHEMES[this._scheme()].rgb;
  }

  private apply(scheme: ColorScheme): void {
    const colors = SCHEMES[scheme];
    const root = document.documentElement;
    root.style.setProperty('--c-brand', colors.brand);
    root.style.setProperty('--c-brand-600', colors.brand600);
    root.style.setProperty('--c-brand-400', colors.brand400);
    root.style.setProperty('--c-brand-100', colors.brand100);
    root.style.setProperty('--c-brand-50', colors.brand50);
    root.style.setProperty('--c-brand-fg', colors.brandFg);
    root.style.setProperty('--c-strong', colors.strong);
    root.style.setProperty('--primary', colors.primary);
    root.style.setProperty('--primary-dark', colors.primaryDark);
    root.style.setProperty('--primary-fg', colors.primaryFg);
    root.style.setProperty('--foco-logo', colors.focoLogo);
  }

  private read(): ColorScheme {
    const stored = this.store.data().settings.colorScheme;
    if (stored === 'purple' || stored === 'blue' || stored === 'red' || stored === 'gray') {
      return stored;
    }
    return 'purple';
  }
}
