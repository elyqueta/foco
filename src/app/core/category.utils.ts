import { Category } from './models';

const LABELS: Record<string, string> = {
  professional: 'Profissional',
  personal: 'Pessoal',
  household: 'Doméstica',
};

/** Rótulo legível de uma categoria (as três padrão em PT, as restantes capitalizadas). */
export function categoryLabel(name: Category): string {
  const known = LABELS[name];
  if (known) return known;
  if (!name) return name;
  return name.charAt(0).toUpperCase() + name.slice(1);
}
