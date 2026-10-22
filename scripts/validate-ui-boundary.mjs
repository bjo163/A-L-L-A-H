import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const appRoots = ["apps/portal", "apps/command-center"];
const forbidden = [/packages\/ui\/src/, /@empire\/ui\/src/];
const files = [];
function walk(path) {
  if (!existsSync(path)) return;
  for (const entry of readdirSync(path)) {
    if (["node_modules", ".next", "dist", ".turbo"].includes(entry)) continue;
    const full = join(path, entry);
    if (statSync(full).isDirectory()) walk(full);
    else if (/\.(tsx?|jsx?|css|scss)$/.test(entry)) files.push(full);
  }
}
for (const app of appRoots) walk(join(root, app));
const appStyles = files.filter((file) => /\.(css|scss)$/.test(file));
if (appStyles.length) throw new Error(`Consumer stylesheet found: ${appStyles.map((file) => relative(root, file)).join(", ")}`);
for (const file of files) {
  const source = readFileSync(file, "utf8");
  if (forbidden.some((pattern) => pattern.test(source))) throw new Error(`Forbidden UI boundary import in ${relative(root, file)}`);
}
console.log(`UI boundary valid: ${files.length} consumer source files; product CSS owned by packages/ui.`);
