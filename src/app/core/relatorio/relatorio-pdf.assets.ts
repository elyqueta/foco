/**
 * Logótipo e ícones SVG como strings para uso no pdfmake (vfs / imagens embutidas).
 * Substitua os placeholders pelos ficheiros reais quando estiverem disponíveis.
 * Cada string SVG deve ser um SVG válido (sem declaração XML obrigatória, mas recomendada).
 */

/** Placeholder do logótipo Foco. Substituir pelo SVG real do logótipo. */
export const RELATORIO_LOGO_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="56" viewBox="0 0 200 56">
  <rect width="200" height="56" fill="#F2F3F8" rx="12"/>
  <text x="50%" y="50%" font-family="sans-serif" font-size="20" font-weight="bold" fill="#6C5CE7" text-anchor="middle" dominant-baseline="middle">Foco</text>
</svg>
`;

/** Placeholder do ícone de projeto. */
export const ICON_PROJECT_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6C5CE7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3 2 3 2-3 2 3h5a2 2 0 0 1 2 2z"/>
</svg>
`;

/** Placeholder do ícone de tarefa. */
export const ICON_TASK_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6C5CE7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M9 11l3 3L22 4"/>
  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
</svg>
`;

/** Placeholder do ícone de calendário / prazo. */
export const ICON_DATE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9A9AB5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
  <line x1="16" y1="2" x2="16" y2="6"/>
  <line x1="8" y1="2" x2="8" y2="6"/>
  <line x1="3" y1="10" x2="21" y2="10"/>
</svg>
`;

/** Placeholder do ícone de relógio / duração. */
export const ICON_TIME_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9A9AB5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="10"/>
  <polyline points="12 6 12 12 16 14"/>
</svg>
`;

/** Placeholder do ícone de progresso / barra. */
export const ICON_PROGRESS_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9A9AB5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M4 7V4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3"/>
  <polyline points="10 13 16 13 16 7 16 21"/>
</svg>
`;

/** Placeholder do cartão decorativo da capa (imagem pré-feita). Substituir pelo PNG/SVG real. */
export const DECORATIVE_CARD_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="220" viewBox="0 0 400 220">
  <rect width="400" height="220" fill="#E9E6FF" rx="20"/>
  <path d="M300 60 Q350 120 320 200 L300 200 Z" fill="#FFFFFF" opacity="0.6"/>
  <text x="60" y="120" font-family="sans-serif" font-size="16" fill="#6C5CE7">Grandes resultados</text>
  <text x="60" y="145" font-family="sans-serif" font-size="14" fill="#2E2B55">nascem de pequenos passos consistentes.</text>
</svg>
`;

/** Ícone pequeno do rodapé (logótipo reduzido). */
export const FOOTER_LOGO_SVG = RELATORIO_LOGO_SVG.replace('width="200"', 'width="60"').replace('height="56"', 'height="17"');
