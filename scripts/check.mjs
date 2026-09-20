import { readFile, readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
const dirs = ["extension", "demo", "scripts", "tests"];
let checked = 0;
async function walk(dir) {
  for (const item of await readdir(dir, { withFileTypes: true })) {
    if (
      item.name === "vendor" ||
      item.name === "fixtures" ||
      item.name === "__pycache__"
    )
      continue;
    const file = dir + "/" + item.name;
    if (item.isDirectory()) await walk(file);
    else if (/\.(js|cjs|mjs)$/.test(file)) {
      const result = spawnSync(process.execPath, ["--check", file], {
        encoding: "utf8",
      });
      if (result.status !== 0) throw Error(result.stderr);
      checked++;
    }
  }
}
for (const dir of dirs) await walk(dir);
const manifest = JSON.parse(await readFile("extension/manifest.json", "utf8"));
if (
  JSON.stringify(manifest.permissions) !==
    JSON.stringify(["activeTab", "scripting"]) ||
  manifest.host_permissions ||
  manifest.externally_connectable
)
  throw Error("Permission boundary changed");
if (
  !manifest.content_security_policy.extension_pages.includes(
    "connect-src 'none'",
  )
)
  throw Error("Network CSP changed");
for (const file of [
  "background.js",
  "content.js",
  "desk.js",
  "core.js",
  "db.js",
  "client.js",
  "export.js",
]) {
  const content = await readFile("extension/" + file, "utf8");
  if (/\b(fetch|XMLHttpRequest|WebSocket|sendBeacon)\s*\(/.test(content))
    throw Error("Unexpected network API: " + file);
}
const lock = JSON.parse(await readFile("package-lock.json", "utf8")),
  pkg = JSON.parse(await readFile("package.json", "utf8"));
if (
  lock.packages[""].version !== pkg.version ||
  lock.packages[""].name !== pkg.name
)
  throw Error("Package lock root differs");
console.log(
  `Syntax: ${checked} JavaScript files PASS. Manifest, local-network boundary, package lock: PASS.`,
);
