import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cssRoot = join(repoRoot, "packages/ui/src");
const ignoredDirectories = new Set(["node_modules", ".next", "dist", ".turbo"]);
const findings = [];

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
    if (/\s/.test(source[index])) {
      index += 1;
      continue;
    }
    if (source[index] === "/" && source[index + 1] === "*") {
      const end = source.indexOf("*/", index + 2);
      return end < 0 ? source.length : skipTrivia(source, end + 2);
    }
    break;
  }
  return index;
}

function findRuleBoundary(source, start) {
  let quote = "";
  let parentheses = 0;
  let brackets = 0;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (char === "\\") index += 1;
      else if (char === quote) quote = "";
      continue;
    }
    if (char === "/" && source[index + 1] === "*") {
      const end = source.indexOf("*/", index + 2);
      if (end < 0) return { index: source.length, char: "" };
      index = end + 1;
      continue;
    }
    if (char === "\"" || char === "'") quote = char;
    else if (char === "(") parentheses += 1;
    else if (char === ")") parentheses = Math.max(0, parentheses - 1);
    else if (char === "[") brackets += 1;
    else if (char === "]") brackets = Math.max(0, brackets - 1);
    else if (parentheses === 0 && brackets === 0 && (char === "{" || char === ";" || char === "}")) {
      return { index, char };
    }
  }
  return { index: source.length, char: "" };
}

function findBlockEnd(source, openBrace) {
  let depth = 1;
  let quote = "";
  for (let index = openBrace + 1; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (char === "\\") index += 1;
      else if (char === quote) quote = "";
      continue;
    }
    if (char === "/" && source[index + 1] === "*") {
      const end = source.indexOf("*/", index + 2);
      if (end < 0) return source.length;
      index = end + 1;
      continue;
    }
    if (char === "\"" || char === "'") quote = char;
    else if (char === "{") depth += 1;
    else if (char === "}" && --depth === 0) return index;
  }
  return source.length;
}

function splitTopLevel(source, separator) {
  const values = [];
  let start = 0;
  let quote = "";
  let parentheses = 0;
  let brackets = 0;
  let braces = 0;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (char === "\\") index += 1;
      else if (char === quote) quote = "";
      continue;
    }
    if (char === "/" && source[index + 1] === "*") {
      const end = source.indexOf("*/", index + 2);
      if (end < 0) break;
      index = end + 1;
      continue;
    }
    if (char === "\"" || char === "'") quote = char;
    else if (char === "(") parentheses += 1;
    else if (char === ")") parentheses = Math.max(0, parentheses - 1);
    else if (char === "[") brackets += 1;
    else if (char === "]") brackets = Math.max(0, brackets - 1);
    else if (char === "{") braces += 1;
    else if (char === "}") braces = Math.max(0, braces - 1);
    else if (char === separator && parentheses === 0 && brackets === 0 && braces === 0) {
      values.push({ value: source.slice(start, index), start });
      start = index + 1;
    }
  }
  values.push({ value: source.slice(start), start });
  return values;
}

function lineAt(source, offset) {
  let line = 1;
  for (let index = 0; index < offset; index += 1) if (source[index] === "\n") line += 1;
  return line;
}

function normalizedContext(context) {
  return context.join(" > ") || "(global)";
}

function recordDeclarations(file, source, selector, body, bodyOffset, context, seen) {
  const selectors = splitTopLevel(selector, ",").map(({ value }) => value.trim()).filter(Boolean);
  const cssContext = normalizedContext(context);
  for (const part of splitTopLevel(body, ";")) {
    const declaration = part.value.replace(/\/\*[\s\S]*?\*\//g, " ").trim();
    if (!declaration || declaration.startsWith("@")) continue;
    const colon = declaration.indexOf(":");
    if (colon <= 0) continue;
    const property = declaration.slice(0, colon).trim().toLowerCase();
    if (!/^--[\w-]+$|^-?[a-z][\w-]*$/i.test(property)) continue;
    const line = lineAt(source, bodyOffset + part.start);
    for (const itemSelector of selectors) {
      const key = `${cssContext}\n${itemSelector}`;
      const byProperty = seen.get(key) ?? new Map();
      const previous = byProperty.get(property);
      if (previous) findings.push({ file, line, selector: itemSelector, context: cssContext, property, previousLine: previous.line });
      else byProperty.set(property, { line });
      seen.set(key, byProperty);
    }
  }
}

function inspectRules(file, source, start, end, context, seen) {
  let cursor = start;
  while (cursor < end) {
    cursor = skipTrivia(source, cursor);
    if (cursor >= end || source[cursor] === "}") return;
    const boundary = findRuleBoundary(source, cursor);
    if (boundary.char === ";" || boundary.char === "}") {
      cursor = boundary.index + 1;
      continue;
    }
    if (boundary.char !== "{") return;
    const prelude = source.slice(cursor, boundary.index).trim();
    const blockEnd = findBlockEnd(source, boundary.index);
    const atRule = prelude.startsWith("@");
    if (atRule) {
      const groupRule = /^@(media|supports|container|layer|scope|document|starting-style|keyframes|-webkit-keyframes)\b/i.test(prelude);
      if (groupRule) inspectRules(file, source, boundary.index + 1, blockEnd, [...context, prelude.replace(/\s+/g, " ")], seen);
      else recordDeclarations(file, source, prelude, source.slice(boundary.index + 1, blockEnd), boundary.index + 1, [...context, prelude.replace(/\s+/g, " ")], seen);
    } else {
      recordDeclarations(file, source, prelude, source.slice(boundary.index + 1, blockEnd), boundary.index + 1, context, seen);
    }
    cursor = blockEnd + 1;
  }
}

const files = collectCssFiles(cssRoot);
for (const absolutePath of files) {
  const source = readFileSync(absolutePath, "utf8");
  const relativePath = relative(repoRoot, absolutePath).replaceAll("\\", "/");
  inspectRules(relativePath, source, 0, source.length, [], new Map());
}

if (findings.length) {
  console.error(`Found ${findings.length} repeated CSS declaration(s) in the same selector/context:`);
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line} ${finding.selector} [${finding.context}] repeats ${finding.property} from line ${finding.previousLine}`);
  }
  process.exitCode = 1;
} else {
  console.log(`UI CSS duplicate audit passed: ${files.length} stylesheets, no repeated declarations in matching selector/context pairs.`);
}
