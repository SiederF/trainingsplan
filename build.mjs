/**
 * build.mjs — erzeugt aus dem Projekt eine einzelne HTML-Datei.
 *
 * Zweck: schnelles Testen ohne Webserver, etwa in einer Vorschau oder
 * per Doppelklick. Die gebündelte Datei ist ein Ergebnis, keine Quelle —
 * gepflegt wird immer das Projekt, danach dieses Skript neu laufen lassen.
 *
 * Wichtig: Das Gerüst wird aus index.html GELESEN, nicht hier nochmal
 * hingeschrieben. Eine zweite Kopie würde bei jeder Strukturänderung
 * auseinanderlaufen — genau das ist schon einmal passiert.
 *
 * Aufruf: node build.mjs → dist/trainingsplan-standalone.html
 *
 * Unterschiede zur installierten Fassung:
 *   – kein Service Worker, also kein Offline-Cache und keine Updatemeldung
 *   – keine Installation als App über das Manifest
 * Die Trainingslogik ist identisch, weil derselbe Quellcode gebündelt wird.
 */

import { build } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';

const CSS_FILES = ['tokens', 'base', 'layout', 'components'];

const css = (await Promise.all(
  CSS_FILES.map(n => readFile(`css/${n}.css`, 'utf8'))
)).join('\n');

const bundle = await build({
  entryPoints: ['js/app.js'],
  bundle: true,
  format: 'iife',
  target: 'es2022',
  write: false,
  legalComments: 'none'
});
const js = bundle.outputFiles[0].text;

let html = await readFile('index.html', 'utf8');

// Verweise ersetzen, die es in der Einzeldatei nicht gibt
html = html
  .replace(/\n\s*<link rel="manifest"[^>]*>/g, '')
  .replace(/\n\s*<link rel="icon"[^>]*>/g, '')
  .replace(/\n\s*<link rel="apple-touch-icon"[^>]*>/g, '')
  .replace(/\n\s*<link rel="stylesheet" href="\.\/css\/[^"]+">/g, '')
  .replace(/<title>[^<]*<\/title>/, '<title>Trainingsplan — Bouldern (Vorschau)</title>')
  .replace('</head>', `<style>\n${css}\n</style>\n</head>`)
  .replace(/\n\s*<script type="module" src="\.\/js\/app\.js"><\/script>/,
           `\n<script>\n${js}\n</script>`);

// Sicherstellen, dass nichts übrig blieb, das ins Leere zeigt
const reste = [...html.matchAll(/(?:href|src)="\.\/(?!assets)[^"]+"/g)].map(m => m[0]);
if (reste.length) {
  console.error('Nicht ersetzte Verweise gefunden:', reste);
  process.exit(1);
}
if (!html.includes('<style>') || !html.includes('(() => {')) {
  console.error('CSS oder JavaScript wurde nicht eingebettet.');
  process.exit(1);
}

await mkdir('dist', { recursive: true });
await writeFile('dist/trainingsplan-standalone.html', html, 'utf8');

const kb = n => (n / 1024).toFixed(1) + ' kB';
console.log('dist/trainingsplan-standalone.html geschrieben');
console.log('  CSS    ' + kb(css.length));
console.log('  JS     ' + kb(js.length));
console.log('  gesamt ' + kb(html.length));
