import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, relative } from "node:path";
import ts from "typescript";

const root = process.cwd();
const appRoots = ["apps/portal", "apps/command-center"];
const forbidden = [/packages\/ui\/src/, /@empire\/ui\/src/];
const requiredStylesheetEntries = new Map([
  ["apps/portal", new Set(["@empire/ui/ui.css"])],
  ["apps/command-center", new Set(["@empire/ui/ui.css"])],
]);
const catalogEntry = readFileSync(join(root, "packages/ui/catalog/main.tsx"), "utf8");
if ((catalogEntry.match(/\.\.\/src\/ui\.css/g) ?? []).length !== 1) {
  throw new Error("UI catalog must load the single shared UI stylesheet entry");
}
const files = [];
const packageStyles = [];
const appVectorAssets = [];
function walk(path) {
  if (!existsSync(path)) return;
  for (const entry of readdirSync(path)) {
    if (["node_modules", ".next", "dist", ".turbo"].includes(entry)) continue;
    const full = join(path, entry);
    if (statSync(full).isDirectory()) walk(full);
    else if (/\.svg$/i.test(entry)) appVectorAssets.push(full);
    else if (/\.(tsx?|jsx?|css|scss|html)$/.test(entry)) files.push(full);
  }
}
for (const app of appRoots) walk(join(root, app));
const appStyles = files.filter((file) => /\.(css|scss)$/.test(file));
if (appStyles.length) throw new Error(`Consumer stylesheet found: ${appStyles.map((file) => relative(root, file)).join(", ")}`);
if (appVectorAssets.length) throw new Error(`Consumer SVG asset master found: ${appVectorAssets.map((file) => relative(root, file)).join(", ")}`);
const parallelVisualSources = [];
const inlineSvgPattern = /<\s*svg\b/i;
const embeddedStylePattern = /<\s*style\b/i;
const literalColorPattern = /#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})\b|\b(?:rgb|rgba|hsl|hsla)\s*\(|(?:linear|radial|conic)-gradient\s*\(/i;
const stylesheetImports = new Map([...requiredStylesheetEntries.keys()].map((app) => [app, new Map()]));
const nonCanonicalStylesheetImports = [];
const sharedEntryPath = join(root, "packages/ui/src/ui.css");
const sharedEntrySource = readFileSync(sharedEntryPath, "utf8");
const requiredProductStyles = [
  "./products/portal-globals.css",
  "./products/portal-manga.css",
  "./products/command-center.css",
];
const sharedImportErrors = [];
const sharedImportCounts = new Map();
for (const match of sharedEntrySource.matchAll(/^\\s*@import\\s+(?:url\\()?["']([^"']+)["']\\)?\\s*;/gm)) {
  const specifier = match[1];
  if (requiredProductStyles.includes(specifier)) {
    sharedImportCounts.set(specifier, (sharedImportCounts.get(specifier) ?? 0) + 1);
  }
}
for (const specifier of requiredProductStyles) {
  const count = sharedImportCounts.get(specifier) ?? 0;
  if (count !== 1) sharedImportErrors.push(`packages/ui/src/ui.css must import ${specifier} exactly once (found ${count})`);
}
const sharedProductOrder = requiredProductStyles.map((specifier) => sharedEntrySource.indexOf(`"${specifier}"`));
if (sharedProductOrder.some((position) => position < 0) || sharedProductOrder.some((position, index) => index > 0 && position < sharedProductOrder[index - 1])) {
  sharedImportErrors.push("packages/ui/src/ui.css must preserve product cascade order: portal globals → Portal profile → Command Center profile");
}
for (const file of files) {
  const source = readFileSync(file, "utf8");
  if (forbidden.some((pattern) => pattern.test(source))) throw new Error(`Forbidden UI boundary import in ${relative(root, file)}`);
  const consumer = relative(root, file).replaceAll("\\", "/");
  if (inlineSvgPattern.test(source)) parallelVisualSources.push(`${consumer}: inline SVG source`);
  if (embeddedStylePattern.test(source)) parallelVisualSources.push(`${consumer}: embedded style block`);
  if (literalColorPattern.test(source)) parallelVisualSources.push(`${consumer}: literal palette/gradient value`);
  const app = [...requiredStylesheetEntries.keys()].find((candidate) => consumer.startsWith(`${candidate}/`));
  if (!app) continue;
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
    const specifier = statement.moduleSpecifier.text;
    if (/\\.css(?:\\?.*)?$/i.test(specifier) && specifier !== "@empire/ui/ui.css") {
      nonCanonicalStylesheetImports.push(`${consumer} imports non-canonical stylesheet ${specifier}; import @empire/ui/ui.css only from the root layout`);
    }
    if (!/^@empire\/ui\/ui\.css$/.test(specifier)) continue;
    const imports = stylesheetImports.get(app);
    imports.set(specifier, (imports.get(specifier) ?? 0) + 1);
  }
}
if (parallelVisualSources.length) throw new Error(`Consumer visual source must stay in @empire/ui:\n- ${parallelVisualSources.join("\n- ")}`);
const stylesheetErrors = [...sharedImportErrors, ...nonCanonicalStylesheetImports];
for (const [app, required] of requiredStylesheetEntries) {
  const imports = stylesheetImports.get(app);
  for (const entry of required) {
    if (imports.get(entry) !== 1) stylesheetErrors.push(`${app} must import ${entry} exactly once (found ${imports.get(entry) ?? 0})`);
  }
  for (const entry of imports.keys()) {
    if (!required.has(entry)) stylesheetErrors.push(`${app} imports an unapproved or duplicate UI stylesheet entry: ${entry}`);
  }
}
if (stylesheetErrors.length) throw new Error(`UI stylesheet entry contract failed:\n- ${stylesheetErrors.join("\n- ")}`);

function walkPackageStyles(path) {
  for (const entry of readdirSync(path)) {
    if (["node_modules", ".next", "dist", ".turbo"].includes(entry)) continue;
    const full = join(path, entry);
    if (statSync(full).isDirectory()) walkPackageStyles(full);
    else if (/\.css$/.test(entry)) packageStyles.push({ path: relative(root, full).replaceAll("\\", "/"), source: readFileSync(full, "utf8") });
  }
}
walkPackageStyles(join(root, "packages/ui/src"));
const allowlistPath = join(root, "packages/ui/consumer-classname-allowlist.json");
const allowlist = JSON.parse(readFileSync(allowlistPath, "utf8"));
const allowedHooks = new Map(allowlist.entries.map((entry) => [
  [entry.consumer, entry.component, entry.prop].join("|"),
  entry,
]));
const observedHooks = new Map();
const hookErrors = [];

function addClassTokens(target, value) {
  for (const token of value.split(/\s+/).filter(Boolean)) target.add(token);
}

function cssOwnsClass(className, owner) {
  return packageStyles.some(({ path, source }) => path.includes(`/products/${owner}`) && source.includes(`.${className}`));
}

function inspectConsumerJsx(file) {
  if (!/\.[jt]sx$/.test(file)) return;
  const source = readFileSync(file, "utf8");
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.JSX);
  const importedUiComponents = new Set();
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
    if (!/^@empire\/ui(?:\/client)?$/.test(statement.moduleSpecifier.text)) continue;
    const bindings = statement.importClause?.namedBindings;
    if (bindings && ts.isNamedImports(bindings)) {
      for (const element of bindings.elements) if (!element.isTypeOnly) importedUiComponents.add(element.name.text);
    }
  }

  function visit(node) {
    if (ts.isJsxAttribute(node)) {
      const prop = node.name.getText(sourceFile);
      if (prop === "style") {
        hookErrors.push(`Inline style prop in consumer JSX: ${relative(root, file).replaceAll("\\", "/")}`);
      }
    }

    if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && ts.isIdentifier(node.tagName) && importedUiComponents.has(node.tagName.text)) {
      for (const attribute of node.attributes.properties) {
        if (!ts.isJsxAttribute(attribute)) continue;
        const prop = attribute.name.getText(sourceFile);
        if (prop !== "className" && !prop.endsWith("ClassName")) continue;

        const consumer = relative(root, file).replaceAll("\\", "/");
        const component = node.tagName.text;
        const key = [consumer, component, prop].join("|");
        const entry = allowedHooks.get(key);
        if (!entry) {
          hookErrors.push(`Unapproved UI class hook ${component}.${prop} in ${consumer}`);
          continue;
        }
        let observed = observedHooks.get(key);
        if (!observed) {
          observed = { classes: new Set(), dynamic: false };
          observedHooks.set(key, observed);
        }
        const initializer = attribute.initializer;
        if (!initializer) continue;
        if (ts.isStringLiteral(initializer) || ts.isNoSubstitutionTemplateLiteral(initializer)) {
          addClassTokens(observed.classes, initializer.text);
          continue;
        }
        if (!ts.isJsxExpression(initializer) || !initializer.expression) {
          hookErrors.push(`Unsupported UI class hook expression for ${component}.${prop} in ${consumer}`);
          continue;
        }
        const expression = initializer.expression;
        function collectClassExpression(value) {
          if (ts.isStringLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value)) addClassTokens(observed.classes, value.text);
          else if (ts.isTemplateExpression(value)) {
            addClassTokens(observed.classes, value.head.text);
            for (const span of value.templateSpans) {
              collectClassExpression(span.expression);
              addClassTokens(observed.classes, span.literal.text);
            }
          } else if (ts.isConditionalExpression(value)) {
            collectClassExpression(value.whenTrue);
            collectClassExpression(value.whenFalse);
          } else if (ts.isBinaryExpression(value)) {
            collectClassExpression(value.left);
            collectClassExpression(value.right);
          } else if (ts.isIdentifier(value)) observed.dynamic = true;
          else if (ts.isCallExpression(value)) {
            observed.dynamic = true;
            for (const argument of value.arguments) collectClassExpression(argument);
          }
          else ts.forEachChild(value, collectClassExpression);
        }
        collectClassExpression(expression);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
}

for (const file of files) inspectConsumerJsx(file);
for (const [key, entry] of allowedHooks) {
  if (!entry.owner || !entry.reason?.trim()) {
    hookErrors.push("Missing product owner or review reason for UI class hook: " + key);
  }
  const observed = observedHooks.get(key);
  if (!observed) {
    hookErrors.push(`Unused class compatibility entry: ${entry.consumer} ${entry.component}.${entry.prop}`);
    continue;
  }
  const expected = new Set(entry.classes ?? []);
  const runtimeClasses = entry.runtimeClasses ?? [];
  for (const runtimeClass of runtimeClasses) expected.add(runtimeClass);
  for (const className of observed.classes) {
    if (!expected.has(className)) hookErrors.push(`Class hook ".${className}" is not allowlisted for ${entry.consumer} ${entry.component}.${entry.prop}`);
  }
  for (const className of expected) {
    if (!observed.classes.has(className) && !runtimeClasses.includes(className)) hookErrors.push(`Allowlisted class hook ".${className}" is not used by ${entry.consumer} ${entry.component}.${entry.prop}`);
    if (!entry.owner || !["portal", "command-center"].includes(entry.owner)) hookErrors.push(`Missing or invalid product stylesheet owner for ".${className}" (${entry.consumer} ${entry.component}.${entry.prop})`);
    else if (!cssOwnsClass(className, entry.owner)) hookErrors.push(`No packages/ui/src/products/${entry.owner}-*.css selector owns ".${className}" (${entry.consumer} ${entry.component}.${entry.prop})`);
  }
  if (observed.dynamic && runtimeClasses.length === 0) hookErrors.push(`Dynamic class hook requires runtimeClasses allowlist: ${entry.consumer} ${entry.component}.${entry.prop}`);
}

if (hookErrors.length) throw new Error(`UI class/style contract failed:\n- ${hookErrors.join("\n- ")}`);
console.log(`UI boundary valid: ${files.length} consumer source files; no inline style props; ${observedHooks.size} UI class hooks are package-owned and allowlisted.`);
execFileSync(process.execPath, [join(root, "scripts/audit-ui-product-scope.mjs")], { stdio: "inherit" });
