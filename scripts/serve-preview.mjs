import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { buildPreview } from "./build-preview.mjs";

const root = join(process.cwd(), "_site");
const port = Number(process.env.PORT || 4321);
const host = process.env.HOST || "127.0.0.1";

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
};

await buildPreview();

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", `http://localhost:${port}`);
    const cleanPath = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "");
    const filePath = join(root, cleanPath === "/" ? "index.html" : cleanPath);
    const body = await readFile(filePath);
    response.writeHead(200, {
      "content-type": mimeTypes[extname(filePath)] ?? "application/octet-stream",
    });
    response.end(body);
  } catch {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});

server.listen(port, host, () => {
  console.log(`Preview running at http://${host}:${port}/`);
});
