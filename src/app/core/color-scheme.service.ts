import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { DataStore } from './data.store';
import { ThemeService } from './theme.service';

export type ColorScheme = 'purple' | 'blue' | 'red' | 'gray';

const SCHEMES: Record<ColorScheme, { brand: string; brand600: string; brand400: string; strong: string; rgb: [number, number, number]; focoLogo: string }> = {
  purple: {
    brand: '108 92 231',
    brand600: '91 75 214',
    brand400: '133 119 240',
    strong: '27 24 64',
    rgb: [108, 92, 231],
    focoLogo: '#6C5CE7',
  },
  blue: {
    brand: '37 99 235',
    brand600: '29 78 216',
    brand400: '59 130 246',
    strong: '15 23 42',
    rgb: [37, 99, 235],
    focoLogo: '#2563EB',
  },
  red: {
    brand: '220 38 38',
    brand600: '185 28 28',
    brand400: '248 113 113',
    strong: '30 27 27',
    rgb: [220, 38, 38],
    focoLogo: '#DC2626',
  },
  gray: {
    brand: '75 85 99',
    brand600: '55 65 81',
    brand400: '148 163 184',
    strong: '15 23 42',
    rgb: [75, 85, 99],
    focoLogo: '#4B5563',
  },
};

const luminance = ([r, g, b]: [number, number, number]) => (0.299 * r + 0.587 * g + 0.114 * b) / 255;

@Injectable({ providedIn: 'root' })
export class ColorSchemeService {
  private readonly store = inject(DataStore);
  private readonly themeService = inject(ThemeService);
  private readonly _scheme = signal<ColorScheme>(this.read());
  readonly scheme = this._scheme.asReadonly();

  constructor() {
    effect(() => {
      const theme = this.themeService.theme();
      this.apply(this._scheme(), theme);
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

  private apply(scheme: ColorScheme, theme: 'light' | 'dark'): void {
    const colors = SCHEMES[scheme];
    const root = document.documentElement;
    root.style.setProperty('--c-brand', colors.brand);
    root.style.setProperty('--c-brand-600', colors.brand600);
    root.style.setProperty('--c-brand-400', colors.brand400);
    root.style.setProperty('--c-strong', colors.strong);
    root.style.setProperty('--c-brand-fg', theme === 'dark' ? colors.brand400 : colors.brand);
    root.style.setProperty('--primary-fg', luminance(colors.rgb) > 0.6 ? '17 24 39' : '255 255 255');
    root.style.setProperty('--foco-logo', colors.focoLogo);
    this.updateFavicon(colors.focoLogo);
    this.updateThemeColor(colors.focoLogo);
  }

  private updateFavicon(hex: string): void {
    const { focoBadgeSvg, svgToDataUri } = require('../shared/brand/foco-brand');
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.type = 'image/svg+xml';
    link.href = svgToDataUri(focoBadgeSvg(hex));
  }

  private updateThemeColor(hex: string): void {
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', hex);
  }

  private read(): ColorScheme {
    const stored = this.store.data().settings.colorScheme;
    if (stored === 'purple' || stored === 'blue' || stored === 'red' || stored === 'gray') {
      return stored;
    }
    return 'purple';
  }
}
