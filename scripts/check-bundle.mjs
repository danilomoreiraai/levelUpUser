import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { gzipSync } from "node:zlib";

const defaultBudgetBytes = 120 * 1024;
const budgetBytes = Number(process.env.MAX_ENTRY_GZIP_BYTES ?? defaultBudgetBytes);
const indexHtml = readFileSync(resolve("dist/index.html"), "utf8");
const entryMatch = indexHtml.match(/<script[^>]+src="\/(assets\/index-[^"]+\.js)"/);

if (!entryMatch) {
  throw new Error("Unable to find the production entry script in dist/index.html");
}

const entryPath = resolve("dist", entryMatch[1]);
const rawBytes = statSync(entryPath).size;
const gzipBytes = gzipSync(readFileSync(entryPath)).byteLength;

console.log(`Entry bundle: ${rawBytes} bytes raw, ${gzipBytes} bytes gzip`);

if (gzipBytes > budgetBytes) {
  throw new Error(`Entry bundle exceeds gzip budget: ${gzipBytes} > ${budgetBytes} bytes`);
}
