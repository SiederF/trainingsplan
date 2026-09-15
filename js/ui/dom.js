/**
 * dom.js — winzige Helfer für Elementerzeugung und Textformatierung.
 * Bewusst kein Framework: die App ist klein genug, dass eine Bibliothek
 * mehr Wartungslast als Nutzen brächte.
 */

export const $ = sel => document.querySelector(sel);

/**
 * el('div.klasse', { attribute }, ...kinder)
 * Kinder dürfen Strings, Knoten oder verschachtelte Arrays sein.
 */
export function el(spec, props = {}, ...children) {
  const [tag, ...classes] = spec.split('.');
  const node = document.createElement(tag || 'div');
  if (classes.length) node.className = classes.join(' ');

  for (const [k, v] of Object.entries(props || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'text') node.textContent = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
    else node.setAttribute(k, v === true ? '' : String(v));
  }

  children.flat(Infinity).forEach(c => {
    if (c === null || c === undefined || c === false) return;
    node.appendChild(typeof c === 'string' || typeof c === 'number'
      ? document.createTextNode(String(c)) : c);
  });
  return node;
}

export function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

/** Zahl ohne unnötige Nachkommastelle: 7.5 → "7,5", 5 → "5" */
export const num = n => String(Math.round(n * 10) / 10).replace('.', ',');

/** Vorgabe als lesbarer Text, z. B. "4 × 3 · +5 kg" oder "5 × 10 s". */
export function formatPrescription(item) {
  const last = item.load ? ' · +' + num(item.load) + ' kg' : '';
  const seite = item.perSide ? ' je Seite' : '';

  if (item.type === 'reps')
    return `${item.sets} × ${item.reps}${seite}${last}`;
  if (item.type === 'hold')
    return `${item.sets} × ${num(item.hold)} s${seite}${last}`;
  if (item.type === 'interval')
    return `${item.sets} × (${item.work} s an / ${item.pause} s ab × ${item.rounds})${last}`;
  return 'Freies Training';
}

export function formatRest(seconds) {
  if (!seconds) return null;
  return seconds >= 60 ? `Pause ${num(seconds / 60)} min` : `Pause ${seconds} s`;
}

export const DAY_LABEL = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
