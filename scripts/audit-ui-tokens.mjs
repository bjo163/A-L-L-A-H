import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const roots = ["packages/ui/src", "apps/portal", "apps/command-center"];
const ignored = new Set(["node_modules", ".next", "dist", ".turbo"]);
const stylesheets = [];
const sourceFiles = [];
const definitions = new Map();
const dependencies = new Map();
const rootReferences = new Set();
const allReferences = new Set();

function walk(path) {
  for (const entry of readdirSync(path)) {
    if (ignored.has(entry)) continue;
    const fullPath = join(path, entry);
    if (statSync(fullPath).isDirectory()) walk(fullPath);
    else if (/\.(css|scss)$/i.test(entry)) stylesheets.push(fullPath);
    else if (/\.(tsx?|jsx?|html)$/i.test(entry)) sourceFiles.push(fullPath);
  }
}
for (const root of roots) walk(root);

function findBoundary(source, start, end) {
  let quote = "";
  let parentheses = 0;
  let brackets = 0;
  for (let index = start; index < end; index += 1) {
    const character = source[index];
    if (quote) {
      if (character === "\\") index += 1;
      else if (character === quote) quote = "";
      continue;
    }
    if (character === '"' || character === "'") quote = character;
    else if (character === "(") parentheses += 1;
    else if (character === ")") parentheses = Math.max(0, parentheses - 1);
    else if (character === "[") brackets += 1;
    else if (character === "]") brackets = Math.max(0, brackets - 1);
    else if (parentheses === 0 && brackets === 0 && (character === "{" || character === ";" || character === "}")) return { index, character };
  }
  return { index: end, character: "" };
}

function findBlockEnd(source, open, end) {
  let depth = 1;
  let quote = "";
  for (let index = open + 1; index < end; index += 1) {
    const character = source[index];
    if (quote) {
      if (character === "\\") index += 1;
      else if (character === quote) quote = "";
      continue;
    }
    if (character === '"' || character === "'") quote = character;
    else if (character === "{") depth += 1;
    else if (character === "}" && --depth === 0) return index;
  }
  return end;
}

function splitDeclarations(source) {
  const parts = [];
  let start = 0;
  let quote = "";
  let parentheses = 0;
  let brackets = 0;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quote) {
      if (character === "\\") index += 1;
      else if (character === quote) quote = "";
      continue;
    }
    if (character === '"' || character === "'") quote = character;
    else if (character === "(") parentheses += 1;
    else if (character === ")") parentheses = Math.max(0, parentheses - 1);
    else if (character === "[") brackets += 1;
    else if (character === "]") brackets = Math.max(0, brackets - 1);
    else if (character === ";" && parentheses === 0 && brackets === 0) {
      parts.push({ value: source.slice(start, index), start });
      start = index + 1;
    }
  }
  parts.push({ value: source.slice(start), start });
  return parts;
}

function recordDeclarations(file, source, bodyStart, bodyEnd) {
  const body = source.slice(bodyStart, bodyEnd);
  for (const part of splitDeclarations(body)) {
    const colon = part.value.indexOf(":");
    if (colon < 1) continue;
    const property = part.value.slice(0, colon).trim().toLowerCase();
    if (!/^--[\w-]+$|^-?[a-z][\w-]*$/i.test(property)) continue;
    const value = part.value.slice(colon + 1);
    const references = [...value.matchAll(/var\(\s*(--[\w-]+)/g)].map((match) => match[1]);
    if (property.startsWith("--")) {
      for (const reference of references) {
        allReferences.add(reference);
        const targets = dependencies.get(property) ?? new Set();
        targets.add(reference);
        dependencies.set(property, targets);
      }
      if (property.startsWith("--eol-")) {
        const locations = definitions.get(property) ?? [];
        const line = source.slice(0, bodyStart + part.start).split("\n").length;
        locations.push(`${relative(process.cwd(), file).replaceAll("\\", "/")}:${line}`);
        definitions.set(property, locations);
      }
    } else {
      for (const reference of references) {
        allReferences.add(reference);
        rootReferences.add(reference);
      }
    }
  }
}

function inspectRules(file, source, start, end) {
  let cursor = start;
  while (cursor < end) {
    while (cursor < end && /\s/.test(source[cursor])) cursor += 1;
    if (cursor >= end || source[cursor] === "}") return;
    const boundary = findBoundary(source, cursor, end);
    if (boundary.character === ";" || boundary.character === "}") {
      cursor = boundary.index + 1;
      continue;
    }
    if (boundary.character !== "{") return;
    const prelude = source.slice(cursor, boundary.index).trim();
    const close = findBlockEnd(source, boundary.index, end);
    const blockStart = boundary.index + 1;
    if (prelude.startsWith("@")) {
      if (/^@(media|supports|container|layer|scope|document|starting-style|keyframes|-webkit-keyframes)\b/i.test(prelude)) {
        inspectRules(file, source, blockStart, close);
      } else {
        recordDeclarations(file, source, blockStart, close);
      }
    } else {
      recordDeclarations(file, source, blockStart, close);
    }
    cursor = close + 1;
  }
}

for (const file of stylesheets) {
  const source = readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, " "));
  inspectRules(file, source, 0, source.length);
}
for (const file of sourceFiles) {
  const source = readFileSync(file, "utf8");
  for (const match of source.matchAll(/(--eol-[\w-]+)/g)) {
    allReferences.add(match[1]);
    rootReferences.add(match[1]);
  }
}

const reachable = new Set();
const pending = [...rootReferences];
while (pending.length) {
  const token = pending.pop();
  if (reachable.has(token)) continue;
  reachable.add(token);
  for (const dependency of dependencies.get(token) ?? []) pending.push(dependency);
}
const undefinedReferences = [...allReferences].filter((token) => token.startsWith("--eol-") && !definitions.has(token)).sort();
const unusedDefinitions = [...definitions]
  .filter(([token]) => !reachable.has(token))
  .sort(([left], [right]) => left.localeCompare(right));

console.log(`UI token audit: ${stylesheets.length} stylesheets, ${definitions.size} package tokens, ${reachable.size} reachable custom properties.`);
if (undefinedReferences.length) console.error(`Undefined token references:\n- ${undefinedReferences.join("\n- ")}`);
if (unusedDefinitions.length) {
  console.error(`Unused package tokens:\n${unusedDefinitions.map(([token, locations]) => `- ${token}: ${locations.join(", ")}`).join("\n")}`);
}
if (undefinedReferences.length || unusedDefinitions.length) process.exitCode = 1;