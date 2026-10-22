import { readFileSync } from 'node:fs';

const tokensText = readFileSync(new URL('../packages/ui/src/tokens.css', import.meta.url), 'utf8');
const themesText = readFileSync(new URL('../packages/ui/src/themes.css', import.meta.url), 'utf8');
const declarations = (text) => new Map([...text.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(([, name, value]) => [name, value.trim()]));
const tokens = declarations(tokensText);
const blocks = [...themesText.matchAll(/:root(?:\[data-theme="(light|dark)"\])?[^\{]*\{([\s\S]*?)\}/g)];
const themeRules = { dark: [], light: [] };
for (const [, theme, body] of blocks) themeRules[theme ?? 'dark'].push(body);

function resolve(name, vars, stack = []) {
  if (stack.includes(name)) throw new Error(`Token alias cycle: ${[...stack, name].join(' -> ')}`);
  const value = vars.get(name);
  if (!value) throw new Error(`Missing token ${name}`);
  const match = /^var\((--[\w-]+)\)$/.exec(value);
  return match ? resolve(match[1], vars, [...stack, name]) : value;
}
function color(value) {
  const match = /^#([\da-f]{3}|[\da-f]{6})$/i.exec(value);
  if (!match) return null;
  const hex = match[1].length === 3 ? [...match[1]].map((v) => v + v).join('') : match[1];
  return [0, 2, 4].map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255);
}
function luminance(value) {
  const rgb = color(value);
  if (!rgb) return null;
  const linear = rgb.map((c) => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}
function ratio(a, b) {
  const la = luminance(a), lb = luminance(b);
  if (la === null || lb === null) return null;
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
const rolePairs = [
  ['text', 'background', 4.5], ['text-subtle', 'background', 4.5], ['text-muted', 'background', 4.5],
  ['text', 'surface', 4.5], ['text-subtle', 'surface', 4.5], ['text-muted', 'surface', 4.5],
  ['text', 'surface-raised', 4.5], ['text-muted', 'surface-raised', 4.5],
  ['text-inverse', 'danger', 4.5],
  ['text', 'surface-inset', 4.5], ['text-muted', 'surface-inset', 4.5],
  ['text', 'surface-action', 4.5], ['text-muted', 'surface-action', 4.5],
  ['link', 'background', 4.5], ['link', 'surface', 4.5], ['accent-strong', 'background', 4.5],
  ['accent-strong', 'surface', 4.5], ['on-accent', 'action-primary', 4.5],
  ['focus', 'background', 3], ['focus', 'surface', 3],
  ['border-strong', 'surface', 3], ['accent-border', 'surface', 3],
];
let failed = false;
for (const theme of ['dark', 'light']) {
  const vars = new Map(tokens);
  for (const body of themeRules[theme]) for (const [key, value] of declarations(body)) vars.set(key, value);
  console.log(`\n${theme.toUpperCase()} theme`);
  for (const [fgRole, bgRole, min] of rolePairs) {
    const fg = resolve(`--eol-color-${fgRole}`, vars);
    const bg = resolve(`--eol-color-${bgRole}`, vars);
    const value = ratio(fg, bg);
    if (value === null) { console.log(`SKIP ${fgRole}/${bgRole}: non-opaque or unsupported color (${fg} / ${bg})`); continue; }
    const pass = value >= min;
    console.log(`${pass ? 'PASS' : 'FAIL'} ${fgRole}/${bgRole}: ${value.toFixed(2)}:1 (min ${min}:1; ${fg} / ${bg})`);
    if (!pass) failed = true;
  }
  for (const status of ['neutral', 'info', 'success', 'warning', 'danger']) {
    const fg = resolve(`--eol-status-${status}-foreground`, vars);
    const bg = resolve(`--eol-status-${status}-surface`, vars);
    const value = ratio(fg, bg);
    if (value === null) { console.log(`SKIP status-${status}: unsupported color`); continue; }
    const pass = value >= 4.5;
    console.log(`${pass ? 'PASS' : 'FAIL'} status-${status}: ${value.toFixed(2)}:1 (min 4.5:1; ${fg} / ${bg})`);
    if (!pass) failed = true;
  }
}
if (failed) process.exitCode = 1;
