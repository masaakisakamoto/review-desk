import { createHash } from "node:crypto";
import { readdir, readFile, writeFile, mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import JSZip from "jszip";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "dist");
const { version } = JSON.parse(
  await readFile(path.join(root, "package.json"), "utf8"),
);
if (!/^\d+\.\d+\.\d+(?:-[a-z0-9.]+)?$/.test(version))
  throw Error("Invalid release version");
await mkdir(output, { recursive: true });
const directories = [
  "extension",
  "demo",
  "docs",
  "examples",
  "scripts",
  "tests",
  "reports",
  ".github",
];
const rootFiles = [
  "CHANGELOG.md",
  "README.md",
  "README_JA.md",
  "LICENSE",
  "PRIVACY.md",
  "CONTRIBUTING.md",
  "SECURITY.md",
  "START_HERE.html",
  "UPDATE_FROM_MAC.command",
  "REVIEW_DESK_WORK_RETURN.md",
  "package.json",
  "package-lock.json",
  ".gitignore",
  ".prettierignore",
];
async function walk(directory) {
  const result = [];
  for (const entry of await readdir(path.join(root, directory), {
    withFileTypes: true,
  })) {
    if (entry.isSymbolicLink()) throw Error("Symlink in release");
    if (
      entry.name === "__pycache__" ||
      entry.name === "test-export.zip" ||
      entry.name.endsWith(".pyc")
    )
      continue;
    const name = directory + "/" + entry.name;
    if (entry.isDirectory()) result.push(...(await walk(name)));
    else result.push(name);
  }
  return result;
}
const files = [
  ...rootFiles,
  ...(await Promise.all(directories.map(walk))).flat(),
].sort();
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const extensionFiles = files.filter((file) => file.startsWith("extension/"));
await writeFile(
  path.join(root, "EXTENSION_SHA256.txt"),
  (
    await Promise.all(
      extensionFiles.map(
        async (file) =>
          `${digest(await readFile(path.join(root, file)))}  ${file.slice(10)}\n`,
      ),
    )
  ).join(""),
);
files.push("EXTENSION_SHA256.txt");
files.sort();
const packageHashes = (
  await Promise.all(
    files.map(
      async (file) =>
        `${digest(await readFile(path.join(root, file)))}  ${file}\n`,
    ),
  )
).join("");
await writeFile(path.join(root, "PACKAGE_SHA256.txt"), packageHashes);
files.push("PACKAGE_SHA256.txt");
files.sort();
const fixedDate = new Date("2026-09-19T00:00:00Z");
async function archive(name, selected, prefix) {
  const zip = new JSZip();
  for (const file of selected) {
    const item = await stat(path.join(root, file));
    zip.file(
      prefix ? prefix + file : file.slice(10),
      await readFile(path.join(root, file)),
      {
        date: fixedDate,
        createFolders: false,
        unixPermissions: file.endsWith(".command") ? 0o100755 : 0o100644,
      },
    );
  }
  const bytes = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
    platform: "UNIX",
  });
  await writeFile(path.join(output, name), bytes);
  return { file: name, bytes: bytes.length, sha256: digest(bytes) };
}
const releases = [];
releases.push(
  await archive(
    `ReviewDesk_${version}_OSS_candidate.zip`,
    files,
    `ReviewDesk_${version}/`,
  ),
);
releases.push(
  await archive(
    `ReviewDesk_${version}_Chrome_candidate.zip`,
    extensionFiles,
    "",
  ),
);
await writeFile(
  path.join(output, "SHA256SUMS.txt"),
  releases.map((release) => `${release.sha256}  ${release.file}\n`).join(""),
);
await writeFile(
  path.join(output, "RELEASE_FILES.json"),
  JSON.stringify(releases, null, 2) + "\n",
);
console.log(JSON.stringify(releases, null, 2));
