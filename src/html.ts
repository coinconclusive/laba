
export const Q = <T extends HTMLElement>(q: string) => document.querySelector<T>(q);

export function H(f?: (e: HTMLDivElement) => void): HTMLDivElement;
export function H<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  f?: (e: HTMLElementTagNameMap[K]) => void
): HTMLElementTagNameMap[K];

export function H<K extends keyof HTMLElementTagNameMap>(
  a?: K | ((e: HTMLDivElement) => void),
  f?: (e: HTMLElementTagNameMap[K]) => void
) {
  if (!a) return document.createElement('div');
  if (typeof a === 'function') { f = a as typeof f; a = 'div' as K; }
  const e = document.createElement<K>(a);
  if (f) f(e);
  return e;
}
