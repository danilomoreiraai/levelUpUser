import { createReadStream, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";

const distDirectory = resolve(process.cwd(), "dist");
const fallbackFile = resolve(distDirectory, "index.html");
const releaseFile = resolve(distDirectory, "release.json");
const port = Number(process.env.PORT ?? "3000");

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function getRelease() {
  try {
    const metadata = JSON.parse(readFileSync(releaseFile, "utf8"));
    return typeof metadata.release === "string" ? metadata.release : "unknown";
  } catch {
    return "unknown";
  }
}

function getCacheControl(pathname, extension) {
  if (pathname === "/release.json") {
    return "no-store";
  }

  if (extension === ".html") {
    return "public, max-age=0, must-revalidate";
  }

  if (pathname.startsWith("/assets/")) {
    return "public, max-age=31536000, immutable";
  }

  return "public, max-age=14400, stale-if-error=86400";
}

function getRequestedFile(requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl, "http://localhost").pathname);
  const requestedFile = resolve(distDirectory, `.${pathname}`);
  const isInsideDist =
    requestedFile === distDirectory || requestedFile.startsWith(`${distDirectory}${sep}`);

  if (!isInsideDist) {
    return null;
  }

  try {
    const stats = statSync(requestedFile);
    if (stats.isFile()) return { file: requestedFile, pathname, stats };
  } catch {
    // SPA routes fall through to index.html below.
  }

  if (pathname.startsWith("/assets/") || extname(pathname)) {
    return undefined;
  }

  const stats = statSync(fallbackFile);
  return { file: fallbackFile, pathname, stats };
}

function sendResponse(request, response) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end();
    return;
  }

  let requested;

  try {
    requested = getRequestedFile(request.url ?? "/");
  } catch {
    response.writeHead(404);
    response.end();
    return;
  }

  if (requested === null) {
    response.writeHead(400);
    response.end();
    return;
  }

  if (!requested) {
    response.writeHead(404, { "Cache-Control": "no-store" });
    response.end();
    return;
  }

  const extension = extname(requested.file).toLowerCase();
  const etag = `W/"${requested.stats.size}-${requested.stats.mtimeMs}"`;
  const headers = {
    "Cache-Control": getCacheControl(requested.pathname, extension),
    "Content-Length": requested.stats.size,
    "Content-Type": contentTypes[extension] ?? "application/octet-stream",
    ETag: etag,
    "Last-Modified": requested.stats.mtime.toUTCString(),
    "X-App-Release": getRelease(),
    "X-Content-Type-Options": "nosniff",
  };

  if (request.headers["if-none-match"] === etag) {
    response.writeHead(304, headers);
    response.end();
    return;
  }

  response.writeHead(200, headers);

  if (request.method === "HEAD") {
    response.end();
    return;
  }

  createReadStream(requested.file).pipe(response);
}

if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error("PORT must be an integer between 1 and 65535");
}

createServer(sendResponse).listen(port, "0.0.0.0", () => {
  console.log(`Static app listening on port ${port}`);
});
