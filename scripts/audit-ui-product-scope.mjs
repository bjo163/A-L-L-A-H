import { readFileSync } from "node:fs";

const files = [
  ["packages/ui/src/products/portal-globals.css", "portal"],
  ["packages/ui/src/products/portal-manga.css", "portal"],
  ["packages/ui/src/products/command-center.css", "command-center"],
  ["packages/ui/src/adapters/maplibre.css", "maplibre"],
];

function skipComment(source, index) {
  if (source[index] !== "/" || source[index + 1] !== "*") return index;
  const end = source.indexOf("*/", index + 2);
  if (end < 0) throw new Error("Unclosed CSS comment.");
  return end + 2;
}

function findBoundary(source, start) {
  let parentheses = 0;
  let brackets = 0;
  let quote = "";
  for (let index = start; index < source.length; index += 1) {
    if (source[index] === "/" && source[index + 1] === "*") {
      index = skipComment(source, index) - 1;
      continue;
    }
    const character = source[index];
    if (quote) {
      if (character === "\\") index += 1;
      else if (character === quote) quote = "";
      continue;
    }
    if (character === "\"" || character === "'") quote = character;
    else if (character === "(") parentheses += 1;
    else if (character === ")") parentheses -= 1;
    else if (character === "[") brackets += 1;
    else if (character === "]") brackets -= 1;
    else if (parentheses === 0 && brackets === 0 && "{;}".includes(character)) return { index, character };
  }
  return { index: source.length, character: "" };
}

function findBlockEnd(source, open) {
  let depth = 1;
  let quote = "";
  for (let index = open + 1; index < source.length; index += 1) {
    if (source[index] === "/" && source[index + 1] === "*") {
      index = skipComment(source, index) - 1;
      continue;
    }
    const character = source[index];
    if (quote) {
      if (character === "\\") index += 1;
      else if (character === quote) quote = "";
      continue;
    }
    if (character === "\"" || character === "'") quote = character;
    else if (character === "{") depth += 1;
    else if (character === "}" && --depth === 0) return index;
  }
  throw new Error("Unclosed CSS rule block.");
}

function splitSelectors(prelude) {
  const selectors = [];
  let start = 0;
  let parentheses = 0;
  let brackets = 0;
  let quote = "";
  for (let index = 0; index < prelude.length; index += 1) {
    const character = prelude[index];
    if (quote) {
      if (character === "\\") index += 1;
      else if (character === quote) quote = "";
    } else if (character === "\"" || character === "'") quote = character;
    else if (character === "(") parentheses += 1;
    else if (character === ")") parentheses -= 1;
    else if (character === "[") brackets += 1;
    else if (character === "]") brackets -= 1;
    else if (character === "," && parentheses === 0 && brackets === 0) {
      selectors.push(prelude.slice(start, index).trim());
      start = index + 1;
    }
  }
  selectors.push(prelude.slice(start).trim());
  return selectors.filter(Boolean);
}

function directProperties(body) {
  return new Set(body.split(";").map((part) => part.trim().match(/^([\w-]+)\s*:/)?.[1]).filter(Boolean));
}

function matchesProductScope(selector, product) {
  const roots = product === "portal" ? [".eol-public-shell"] :
    product === "command-center" ? [".eol-workspace-shell", ".eol-auth-layout"] : [".eol-map-frame"];
  const followsRoot = (value, root) => {
    if (value === root) return true;
    return [" ", ":", ">", "+", "~", "#", ".", "[", ","].some((delimiter) => value.startsWith(`${root}${delimiter}`));
  };
  const themedTarget = selector.match(/^html\[data-theme=[^\]]+\]\s+(.+)$/)?.[1];
  return roots.some((root) => {
    const whereRoot = `:where(${root})`;
    return followsRoot(selector, root) || followsRoot(selector, whereRoot) ||
      (themedTarget != null && (followsRoot(themedTarget, root) || followsRoot(themedTarget, whereRoot)));
  });
}

function auditFile(file, product) {
  const source = readFileSync(file, "utf8");
  const failures = [];
  let scoped = 0;
  let documentExceptions = 0;

  function walk(start, end, inKeyframes = false) {
    let cursor = start;
    while (cursor < end) {
      while (cursor < end && /\s/.test(source[cursor])) cursor += 1;
      if (source[cursor] === "/" && source[cursor + 1] === "*") {
        cursor = skipComment(source, cursor);
        continue;
      }
      if (source[cursor] === "}") return;
      const boundary = findBoundary(source, cursor);
      if (boundary.character === ";") {
        cursor = boundary.index + 1;
        continue;
      }
      if (boundary.character !== "{") return;

      const prelude = source.slice(cursor, boundary.index).trim();
      const close = findBlockEnd(source, boundary.index);
      const body = source.slice(boundary.index + 1, close);
      if (prelude.startsWith("@")) {
        walk(boundary.index + 1, close, inKeyframes || /keyframes/i.test(prelude));
      } else if (!inKeyframes) {
        const properties = directProperties(body);
        for (const selector of splitSelectors(prelude)) {
          const propertyList = [...properties];
          const isPortalDocumentRule = product === "portal" &&
            ((selector === "html" && propertyList.length === 1 && propertyList[0] === "scroll-behavior") ||
             (selector === ":root" && propertyList.length === 1 && propertyList[0] === "scroll-padding-top"));
          if (isPortalDocumentRule) {
            documentExceptions += 1;
          } else if (matchesProductScope(selector, product) || selector === ".eol-workspace-shell, .eol-auth-layout") {
            scoped += 1;
          } else {
            failures.push(`${file}: selector is outside its product root: ${selector}`);
          }
        }
      }
      cursor = close + 1;
    }
  }

  walk(0, source.length);
  return { failures, scoped, documentExceptions };
}

const failures = [];
let scoped = 0;
let documentExceptions = 0;
for (const [file, product] of files) {
  const result = auditFile(file, product);
  failures.push(...result.failures);
  scoped += result.scoped;
  documentExceptions += result.documentExceptions;
}

if (failures.length) {
  console.error(`Product CSS selector scope audit failed (${failures.length} selectors):\n- ${failures.join("\n- ")}`);
  process.exitCode = 1;
} else {
  console.log(`Product CSS selector scope valid: ${scoped} scoped selectors across ${files.length} stylesheets; ${documentExceptions} documented Portal document-navigation exceptions.`);
}
