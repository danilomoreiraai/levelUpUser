import { existsSync, readFileSync, rmSync, statSync } from "node:fs";
import { extname, resolve } from "node:path";
import { gzipSync } from "node:zlib";

const dist = resolve("dist");
const manifestPath = resolve(dist, ".vite/manifest.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const portraitBudget = 30 * 1024;
const homeBudget = 300 * 1024;
const fontAllowance = 64 * 1024;
const textExtensions = new Set([".html", ".css", ".js", ".json", ".svg"]);
const portraitFiles = Object.entries(manifest)
  .filter(([source]) => /^src\/assets\/danilo-portrait[.-]/.test(source))
  .map(([, asset]) => asset.file);

if (portraitFiles.length === 0) {
  throw new Error("Unable to find the homepage portrait assets in the Vite manifest");
}

const largestPortrait = Math.max(
  ...portraitFiles.map((file) => statSync(resolve(dist, file)).size),
);
if (largestPortrait > portraitBudget) {
  throw new Error(`Largest portrait exceeds budget: ${largestPortrait} > ${portraitBudget} bytes`);
}

const homeDocument = existsSync(resolve(dist, ".route-preloads/home.html"))
  ? ".route-preloads/home.html"
  : "index.html";
const homeFiles = new Set([homeDocument, "favicon.svg"]);
const visitedChunks = new Set();

function collectChunk(key, includeDynamicImports = false) {
  if (visitedChunks.has(key)) return;
  visitedChunks.add(key);

  const chunk = manifest[key];
  if (!chunk) throw new Error(`Unable to find home dependency ${key} in the Vite manifest`);

  for (const file of [chunk.file, ...(chunk.css ?? []), ...(chunk.assets ?? [])]) {
    homeFiles.add(file);
  }
  for (const dependency of chunk.imports ?? []) {
    collectChunk(dependency, includeDynamicImports);
  }
  if (includeDynamicImports) {
    for (const dependency of chunk.dynamicImports ?? []) {
      collectChunk(dependency, true);
    }
  }
}

collectChunk("index.html");
collectChunk("src/pages/HomePage.tsx", true);
const glassChunk = "node_modules/liquid-gl/liquidGL.js";
if (manifest[glassChunk]) collectChunk(glassChunk);

// A browser downloads one portrait candidate. Reserve the largest for all devices.
for (const portrait of portraitFiles) homeFiles.delete(portrait);

let homeBytes = largestPortrait + fontAllowance;
for (const file of homeFiles) {
  const contents = readFileSync(resolve(dist, file));
  homeBytes += textExtensions.has(extname(file))
    ? gzipSync(contents).byteLength
    : contents.byteLength;
}

console.log(`Largest portrait: ${largestPortrait} / ${portraitBudget} bytes`);
console.log(`Normalized cold home: ${homeBytes} / ${homeBudget} bytes (includes font allowance)`);
if (homeBytes > homeBudget) {
  throw new Error(`Normalized cold home exceeds budget: ${homeBytes} > ${homeBudget} bytes`);
}

rmSync(manifestPath);
