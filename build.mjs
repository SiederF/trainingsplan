/**
 * build.mjs — erzeugt aus dem Projekt eine einzelne HTML-Datei.
 *
 * Zweck: schnelles Testen ohne Webserver, etwa in einer Vorschau oder
 * per Doppelklick. Die gebündelte Datei ist ein Ergebnis, keine Quelle —
 * gepflegt wird immer das Projekt, danach dieses Skript neu laufen lassen.
 *
 * Aufruf: node build.mjs
 * Ergebnis: dist/trainingsplan-standalone.html
 *
 * Unterschiede zur installierten Version:
 *   – kein Service Worker, also kein Offline-Cache
 *   – keine Installation als App über das Manifest
 *   – Schriftart wird bei Bedarf aus dem Netz geladen, sonst Systemschrift
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

const html = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#1b2126">
<title>Trainingsplan — Bouldern (Vorschau)</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&display=swap">
<style>
${css}
</style>
</head>
<body>

<div class="shell">
  <aside class="sidebar" id="sidebar" role="tablist" aria-label="Bereiche">
    <div class="sidebar__brand">
      <strong>Trainingsplan</strong>
      <span>14 Wochen · Bouldern</span>
    </div>
  </aside>

  <header class="topbar">
    <div class="topbar__row">
      <div>
        <div class="topbar__title" id="week-label">Woche 1</div>
        <div class="topbar__sub" id="block-label"></div>
      </div>
    </div>
    <div class="chiprow" id="weekchips" role="group" aria-label="Woche wählen"></div>
    <div class="daystrip" id="daystrip" role="group" aria-label="Tag wählen"></div>
  </header>

  <main class="content" id="view" role="main"></main>
  <nav class="tabbar" id="tabbar" role="tablist" aria-label="Bereiche"></nav>
</div>

<script>
${js}
</script>
</body>
</html>
`;

await mkdir('dist', { recursive: true });
await writeFile('dist/trainingsplan-standalone.html', html, 'utf8');

const kb = n => (n / 1024).toFixed(1) + ' kB';
console.log('dist/trainingsplan-standalone.html geschrieben');
console.log('  CSS    ' + kb(css.length));
console.log('  JS     ' + kb(js.length));
console.log('  gesamt ' + kb(html.length));
