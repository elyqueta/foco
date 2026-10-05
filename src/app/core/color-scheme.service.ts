import { DOCUMENT } from '@angular/common';
import { effect, inject, Injectable, computed } from '@angular/core';
import { DataStore } from './data.store';
import { ThemeService } from './theme.service';
import { focoBadgeSvg, svgToDataUri } from '../shared/brand/foco-brand';

export type ColorScheme = 'purple' | 'blue' | 'red' | 'gray';

interface SchemeColors {
  brand: string;
  brand600: string;
  brand400: string;
  strong: string;
  rgb: [number, number, number];
  logo: string;
}

const SCHEMES: Record<ColorScheme, SchemeColors> = {
  purple: { brand: '108 92 231', brand600: '91 75 214', brand400: '133 119 240', strong: '27 24 64', rgb: [108, 92, 231], logo: '#6C5CE7' },
  blue: { brand: '37 99 235', brand600: '29 78 216', brand400: '59 130 246', strong: '15 23 42', rgb: [37, 99, 235], logo: '#2563EB' },
  red: { brand: '220 38 38', brand600: '185 28 28', brand400: '248 113 113', strong: '30 27 27', rgb: [220, 38, 38], logo: '#DC2626' },
  gray: { brand: '75 85 99', brand600: '55 65 81', brand400: '148 163 184', strong: '15 23 42', rgb: [75, 85, 99], logo: '#4B5563' },
};

const mixWithBrand = (base: [number, number, number], brand: [number, number, number], amount: number): string =>
  base.map((channel, index) => Math.round(channel + (brand[index] - channel) * amount)).join(' ');

@Injectable({ providedIn: 'root' })
export class ColorSchemeService {
  private readonly store = inject(DataStore);
  private readonly theme = inject(ThemeService);
  private readonly document = inject(DOCUMENT);

  readonly scheme = computed<ColorScheme>(() => {
    const current = this.store.data().settings.colorScheme;
    return current === 'purple' || current === 'blue' || current === 'red' || current === 'gray'
      ? current
      : 'purple';
  });

  constructor() {
    effect(() => this.apply(this.scheme(), this.theme.theme()));
  }

  set(scheme: ColorScheme): void {
    this.store.setColorScheme(scheme);
  }

  colors(): Record<string, string> {
    const { rgb: _rgb, ...colors } = SCHEMES[this.scheme()];
    return colors;
  }

  rgb(): [number, number, number] {
    return SCHEMES[this.scheme()].rgb;
  }

  private apply(scheme: ColorScheme, theme: 'light' | 'dark'): void {
    const colors = SCHEMES[scheme];
    const root = this.document.documentElement;
    const foreground = theme === 'dark' ? colors.brand400 : colors.brand;
    const luminance = (channel: number): number => {
      const normalized = channel / 255;
      return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
    };
    const brandLuminance = 0.2126 * luminance(colors.rgb[0]) + 0.7152 * luminance(colors.rgb[1]) + 0.0722 * luminance(colors.rgb[2]);
    const darkTextLuminance = 0.2126 * luminance(27) + 0.7152 * luminance(24) + 0.0722 * luminance(64);
    const lightContrast = 1.05 / (brandLuminance + 0.05);
    const darkContrast = (brandLuminance + 0.05) / (darkTextLuminance + 0.05);
    const primaryForeground = darkContrast > lightContrast ? '27 24 64' : '255 255 255';

    root.style.setProperty('--c-brand', colors.brand);
    root.style.setProperty('--c-brand-600', colors.brand600);
    root.style.setProperty('--c-brand-400', colors.brand400);
    root.style.setProperty('--c-brand-fg', foreground);
    root.style.setProperty('--c-strong', theme === 'dark'
      ? mixWithBrand([36, 35, 46], colors.rgb, 0.25)
      : colors.strong);
    root.style.setProperty('--primary-fg', primaryForeground);
    root.style.setProperty('--foco-logo', colors.logo);

    const darkSurfaceTokens = ['--c-page', '--c-app', '--c-card', '--c-line'];
    if (theme === 'dark') {
      root.style.setProperty('--c-page', mixWithBrand([10, 11, 16], colors.rgb, 0.08));
      root.style.setProperty('--c-app', mixWithBrand([16, 17, 24], colors.rgb, 0.1));
      root.style.setProperty('--c-card', mixWithBrand([23, 24, 33], colors.rgb, 0.11));
      root.style.setProperty('--c-line', mixWithBrand([47, 47, 62], colors.rgb, 0.1));
    } else {
      darkSurfaceTokens.forEach((token) => root.style.removeProperty(token));
    }

    let favicon = this.document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!favicon) {
      favicon = this.document.createElement('link');
      favicon.rel = 'icon';
      this.document.head.appendChild(favicon);
    }
    favicon.type = 'image/svg+xml';
    favicon.href = svgToDataUri(focoBadgeSvg(colors.logo));
    this.document.querySelector('meta[name="theme-color"]')?.setAttribute('content', colors.logo);
  }
}
