import { createServer } from "node:http";
import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";

const root = path.resolve("public");
const port = Number(process.env.PORT || 4173);

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".task": "application/octet-stream",
  ".wasm": "application/wasm",
  ".webmanifest": "application/manifest+json; charset=utf-8",
};

function sendFile(filePath, response) {
  const extension = path.extname(filePath);
  response.writeHead(200, {
    "Content-Type": contentTypes[extension] || "application/octet-stream",
    "Cache-Control": "no-store, max-age=0, must-revalidate",
  });
  createReadStream(filePath).pipe(response);
}

createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url || "/", `http://${request.headers.host}`);
    let relativePath = decodeURIComponent(requestUrl.pathname);
    if (relativePath === "/") {
      relativePath = "/index.html";
    }

    const normalized = path.normalize(relativePath).replace(/^(\.\.[/\\])+/, "");
    const targetPath = path.join(root, normalized);

    if (!targetPath.startsWith(root)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    if (!existsSync(targetPath)) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    const targetStat = await stat(targetPath);
    if (targetStat.isDirectory()) {
      sendFile(path.join(targetPath, "index.html"), response);
      return;
    }

    sendFile(targetPath, response);
  } catch (error) {
    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end(`Server error: ${error instanceof Error ? error.message : "unknown error"}`);
  }
}).listen(port, () => {
  console.log(`kenshin-dekitayo dev server running at http://localhost:${port}`);
});
