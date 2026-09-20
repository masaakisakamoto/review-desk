import http from "node:http";
import { readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = await realpath(
  path.join(path.dirname(fileURLToPath(import.meta.url)), ".."),
);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".png": "image/png",
};
const server = http.createServer(async (req, res) => {
  try {
    const requestPath = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    const file = await realpath(
      path.join(root, requestPath === "/" ? "demo/index.html" : requestPath),
    );
    if (
      !["demo", "extension", "examples"].some((dir) =>
        file.startsWith(path.join(root, dir) + path.sep),
      )
    )
      throw Error("Not found");
    const data = await readFile(file);
    res.writeHead(200, {
      "Content-Type": types[path.extname(file)] || "application/octet-stream",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
});
server.listen(8765, "127.0.0.1", () =>
  console.log(
    "Fictional website: http://127.0.0.1:8765/\nPractice (simulated capture): http://127.0.0.1:8765/extension/demo.html\nCtrl+C to stop.",
  ),
);
