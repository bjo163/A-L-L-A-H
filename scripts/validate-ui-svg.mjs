import { readdir, readFile } from "node:fs/promises";
import { relative, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = resolve(root, "packages/ui/src");
const errors = [];
const files = [];

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (entry.isFile() && /\.tsx$/.test(entry.name)) files.push(path);
  }
}

function attribute(opening, name) {
  return opening.attributes.properties.find((property) =>
    ts.isJsxAttribute(property) && ts.isIdentifier(property.name) && property.name.text === name
  );
}

await walk(sourceRoot);
let svgCount = 0;
for (const path of files) {
  const source = await readFile(path, "utf8");
  const sourceFile = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const relativePath = relative(root, path);

  function isSvgTag(tagName) {
    return ts.isIdentifier(tagName) && tagName.text.toLowerCase() === "svg";
  }

  function inspectSvgAttributes(opening, currentSvgPath, isRoot = false) {
    const tag = ts.isIdentifier(opening.tagName) ? opening.tagName.text.toLowerCase() : "";
    if (!isRoot && ["script", "use", "image", "feimage", "foreignobject", "iframe", "object", "embed"].includes(tag)) errors.push(`${currentSvgPath}: disallowed SVG element <${tag}>`);
    if (isRoot) {
      if (!attribute(opening, "viewBox")) errors.push(`${currentSvgPath}: SVG requires a viewBox`);
      if (!attribute(opening, "aria-hidden") && !attribute(opening, "role")) errors.push(`${currentSvgPath}: SVG must be decorative or expose an accessible role`);
      if (!attribute(opening, "focusable")) errors.push(`${currentSvgPath}: SVG must define focusable=false`);
    }
    for (const property of opening.attributes.properties) {
        if (!ts.isJsxAttribute(property) || !ts.isIdentifier(property.name)) continue;
        const name = property.name.text.toLowerCase();
        if (["href", "xlinkhref", "dangerouslysetinnerhtml"].includes(name)) errors.push(`${currentSvgPath}: disallowed SVG attribute ${property.name.text}`);
        if (/^on[a-z]/i.test(name)) errors.push(`${currentSvgPath}: inline SVG event handler ${property.name.text} is not allowed`);
        if (name === "style" && property.initializer) {
          const text = property.initializer.getText(sourceFile);
          if (/url\s*\(\s*["']?(?!#)/i.test(text)) errors.push(`${currentSvgPath}: SVG style contains a non-fragment URL reference`);
        }
    }
  }

  function visit(node, inSvg = false, currentSvgPath = "") {
    if (ts.isJsxElement(node)) {
      const isRoot = isSvgTag(node.openingElement.tagName);
      if (isRoot) {
        svgCount += 1;
        currentSvgPath = `${relativePath}:${sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1}`;
      }
      const svgContext = inSvg || isRoot;
      if (svgContext) inspectSvgAttributes(node.openingElement, currentSvgPath, isRoot);
      node.children.forEach((child) => visit(child, svgContext, currentSvgPath));
      return;
    }
    if (ts.isJsxSelfClosingElement(node)) {
      const isRoot = isSvgTag(node.tagName);
      if (isRoot) {
        svgCount += 1;
        currentSvgPath = `${relativePath}:${sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1}`;
      }
      if (inSvg || isRoot) inspectSvgAttributes(node, currentSvgPath, isRoot);
      return;
    }
    ts.forEachChild(node, (child) => visit(child, inSvg, currentSvgPath));
  }

  visit(sourceFile);
}

if (svgCount === 0) errors.push("No inline SVG sources found; verify the package asset ownership scan.");
if (errors.length) {
  console.error(`UI SVG validation failed (${errors.length}):\n- ${errors.join("\n- ")}`);
  process.exitCode = 1;
} else {
  console.log(`UI SVG validation passed: ${svgCount} inline SVG roots have viewBox and accessibility attributes; no external or embedded references found.`);
}
