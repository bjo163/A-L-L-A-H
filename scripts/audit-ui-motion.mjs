import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const uiRoot = join(repoRoot, "packages/ui/src");
const ignoredDirectories = new Set(["node_modules", ".next", "dist", ".turbo"]);

function collectCssFiles(path) {
  const files = [];
  for (const entry of readdirSync(path)) {
    if (ignoredDirectories.has(entry)) continue;
    const fullPath = join(path, entry);
    if (statSync(fullPath).isDirectory()) files.push(...collectCssFiles(fullPath));
    else if (/\.css$/i.test(entry)) files.push(fullPath);
  }
  return files;
}

function skipTrivia(source, start) {
  let index = start;
  while (index < source.length) {
    if (/\s/.test(source[index])) index += 1;
    else if (source[index] === "/" && source[index + 1] === "*") {
      const end = source.indexOf("*/", index + 2);
      index = end < 0 ? source.length : end + 2;
    } else break;
  }
  return index;
}

function findBoundary(source, start, end) {
  let quote = "";
  let parentheses = 0;
  let brackets = 0;
  for (let index = start; index < end; index += 1) {
    const char = source[index];
    if (quote) {
      if (char === "\\") index += 1;
      else if (char === quote) quote = "";
      continue;
    }
    if (char === "/" && source[index + 1] === "*") {
      const commentEnd = source.indexOf("*/", index + 2);
      if (commentEnd < 0) return { index: end, char: "" };
      index = commentEnd + 1;
    } else if (char === "\"" || char === "'") quote = char;
    else if (char === "(") parentheses += 1;
    else if (char === ")") parentheses = Math.max(0, parentheses - 1);
    else if (char === "[") brackets += 1;
    else if (char === "]") brackets = Math.max(0, brackets - 1);
    else if (!parentheses && !brackets && (char === "{" || char === ";" || char === "}")) return { index, char };
  }
  return { index: end, char: "" };
}

function findBlockEnd(source, openBrace, end) {
  let depth = 1;
  let quote = "";
  for (let index = openBrace + 1; index < end; index += 1) {
    const char = source[index];
    if (quote) {
      if (char === "\\") index += 1;
      else if (char === quote) quote = "";
      continue;
    }
    if (char === "/" && source[index + 1] === "*") {
      const commentEnd = source.indexOf("*/", index + 2);
      if (commentEnd < 0) return end;
      index = commentEnd + 1;
    } else if (char === "\"" || char === "'") quote = char;
    else if (char === "{") depth += 1;
    else if (char === "}" && --depth === 0) return index;
  }
  return end;
}

function splitTopLevel(source, separator) {
  const parts = [];
  let start = 0;
  let quote = "";
  let parentheses = 0;
  let brackets = 0;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (char === "\\") index += 1;
      else if (char === quote) quote = "";
      continue;
    }
    if (char === "\"" || char === "'") quote = char;
    else if (char === "(") parentheses += 1;
    else if (char === ")") parentheses = Math.max(0, parentheses - 1);
    else if (char === "[") brackets += 1;
    else if (char === "]") brackets = Math.max(0, brackets - 1);
    else if (char === separator && !parentheses && !brackets) {
      parts.push(source.slice(start, index));
      start = index + 1;
    }
  }
  parts.push(source.slice(start));
  return parts;
}

function parseDeclarations(body) {
  const declarations = new Map();
  for (const declaration of splitTopLevel(body, ";")) {
    const clean = declaration.replace(/\/\*[\s\S]*?\*\//g, " ").trim();
    const colon = clean.indexOf(":");
    if (colon < 1) continue;
    declarations.set(clean.slice(0, colon).trim().toLowerCase(), clean.slice(colon + 1).trim());
  }
  return declarations;
}

function parseRules(source, file, start = 0, end = source.length, contexts = [], rules = []) {
  let cursor = start;
  while (cursor < end) {
    cursor = skipTrivia(source, cursor);
    if (cursor >= end || source[cursor] === "}") return rules;
    const boundary = findBoundary(source, cursor, end);
    if (boundary.char === ";" || boundary.char === "}") {
      cursor = boundary.index + 1;
      continue;
    }
    if (boundary.char !== "{") return rules;
    const prelude = source.slice(cursor, boundary.index).trim();
    const blockEnd = findBlockEnd(source, boundary.index, end);
    if (prelude.startsWith("@")) {
      if (/^@(media|supports|container|layer|scope)\b/i.test(prelude)) {
        parseRules(source, file, boundary.index + 1, blockEnd, [...contexts, prelude.replace(/\s+/g, " ")], rules);
      }
    } else {
      rules.push({ file, selector: prelude, contexts, declarations: parseDeclarations(source.slice(boundary.index + 1, blockEnd)) });
    }
    cursor = blockEnd + 1;
  }
  return rules;
}

const files = collectCssFiles(uiRoot);
const rules = files.flatMap((file) => parseRules(readFileSync(file, "utf8"), relative(repoRoot, file).replaceAll("\\", "/")));
const animatedRules = rules.flatMap((rule) => {
  const shorthand = rule.declarations.get("animation") ?? "";
  const iterationCount = rule.declarations.get("animation-iteration-count") ?? "";
  if (!/\binfinite\b/i.test(shorthand) && !/\binfinite\b/i.test(iterationCount)) return [];
  return splitTopLevel(rule.selector, ",").map((selector) => ({ ...rule, selector: selector.trim() }));
});

const pauseSelectors = rules
  .filter((rule) => rule.file === "packages/ui/src/motion-visibility.css" && rule.selector.includes("data-eol-motion-paused"))
  .flatMap((rule) => splitTopLevel(rule.selector, ",").map((selector) => selector.trim()));

const failures = [];
const motionOwners = new Map([
  ["eol-manga-loading__orbit", "packages/ui/src/patterns/MangaLoadingState.tsx"],
  ["eol-manga-loading__lines", "packages/ui/src/patterns/MangaLoadingState.tsx"],
  ["eol-state__indicator", "packages/ui/src/primitives/LoadingState.tsx"],
  ["eol-skeleton", "packages/ui/src/primitives/Skeleton.tsx"],
  ["eol-map-marker__pulse", "packages/ui/src/patterns/MapPatterns.tsx"],
  ["eol-button__spinner", "packages/ui/src/primitives/Button.tsx"],
  ["sentinel-spinner", "packages/ui/src/patterns/MotionRegion.tsx"],
]);
for (const rule of animatedRules) {
  const classes = [...rule.selector.matchAll(/\.([\w-]+)/g)].map((match) => match[1]);
  const targetClass = classes.at(-1);
  const paused = targetClass && pauseSelectors.some((selector) => selector.includes(`.${targetClass}`));
  if (!paused) failures.push(`${rule.file}: ${rule.selector} has infinite animation without a visibility-pause selector`);
  const owner = motionOwners.get(targetClass);
  if (!owner) failures.push(`${rule.file}: ${rule.selector} has no registered MotionRegion/useMotionVisibility owner`);
  else if (!readFileSync(join(repoRoot, owner), "utf8").includes("useMotionVisibility")) {
    failures.push(`${owner} does not use the visibility hook required by ${rule.selector}`);
  }
}

const reducedMotionRule = rules.find((rule) =>
  rule.file === "packages/ui/src/styles.css"
  && rule.contexts.some((context) => /^@media\s*\(prefers-reduced-motion:\s*reduce\)/i.test(context))
  && rule.selector.split(",").some((selector) => selector.trim() === "*")
  && rule.declarations.has("animation-duration")
  && rule.declarations.has("animation-iteration-count"));
if (!reducedMotionRule) failures.push("Shared styles are missing the global prefers-reduced-motion animation-duration/iteration-count fallback");

const visibilityHook = readFileSync(join(uiRoot, "primitives/useMotionVisibility.ts"), "utf8");
for (const [label, pattern] of [
  ["IntersectionObserver", /new IntersectionObserver\(/],
  ["document visibility listener", /addEventListener\("visibilitychange"/],
  ["viewport buffer", /rootMargin:\s*"120px 0px"/],
  ["pause marker", /data-eol-motion-paused/],
  ["observer cleanup", /observer\?\.disconnect\(\)/],
]) if (!pattern.test(visibilityHook)) failures.push(`useMotionVisibility is missing ${label}`);
if (/\buseState\b/.test(visibilityHook)) failures.push("useMotionVisibility must update the pause marker without React state renders");

assert.ok(animatedRules.length > 0, "Expected to audit at least one continuous animation");
if (failures.length) {
  console.error(`UI motion audit failed (${failures.length} issue(s)):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`UI motion audit passed: ${animatedRules.length} continuous animation selectors have visibility-pause coverage; shared reduced-motion fallback and hook lifecycle are present.`);
}
