import { gzipSync } from "node:zlib";

export const homeBudgetBytes = 300 * 1024;
export const fontAllowanceBytes = 64 * 1024;

/**
 * @param {Uint8Array} contents
 * @param {boolean} compressible
 */
export function normalizedBodyBytes(contents, compressible) {
  return compressible ? gzipSync(contents).byteLength : contents.byteLength;
}
