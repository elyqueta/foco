/**
 * Tema único do PDF do Relatório de Produtividade.
 * Cores planas, sem gradientes nem sombras (não confiáveis no pdfmake).
 * Todas as medidas em pontos (pt).
 */

export const RELATORIO_THEME = {
  // Cores da marca (espelho do design system Tailwind)
  brand: '#6C5CE7',
  brandDark: '#5B4BC6',
  brandLight: '#E9E6FF',
  brandFg: '#FFFFFF',

  ink: '#1B1840',
  ink700: '#2E2B55',
  ink500: '#6B6A8A',
  ink400: '#9A9AB5',
  ink300: '#C9C9DA',

  surfacePage: '#F2F3F8',
  surfaceApp: '#F6F7FB',
  surfaceCard: '#FFFFFF',
  surfaceLine: '#ECECF4',

  success: '#3FBF9A',
  successSoft: '#DDF4EC',
  danger: '#F0506E',
  dangerSoft: '#FFE3E9',
  warn: '#F5A524',
  warnSoft: '#FFF1D6',

  // Tipografia
  fontSize: {
    title: 26,
    h1: 22,
    h2: 16,
    h3: 13,
    body: 12,
    small: 11,
    tiny: 10,
    indicatorNumber: 24,
    indicatorLabel: 9,
  },

  // Espaçamentos
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    pageMargin: 40,
    sectionGap: 20,
    cardPadding: 16,
    cardGap: 10,
  },

  // Raio de cantos (usado em retângulos de canvas)
  radius: {
    sm: 6,
    md: 10,
    lg: 16,
    xl: 24,
  },

  // Largura útil da página A4 (210mm - 2*40pt margens ≈ 531pt)
  contentWidth: 531,

  // Altura da linha de tarefa
  taskRowHeight: 70,
  projectCardHeight: 130,
} as const;
