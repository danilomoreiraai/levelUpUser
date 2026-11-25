import sharp from "sharp";
import { RequestError } from "./errors.js";

const maxFile = 5 * 1024 * 1024;
const maxEncoded = 4 * Math.ceil(maxFile / 3);
const header = /^data:image\/(jpeg|png|webp);base64,/u;

export async function readImage(
  value: unknown,
  kind: "avatar" | "background",
): Promise<Buffer | null | undefined> {
  if (value === undefined || value === null) {
    return value;
  }
  const message = "Envie uma imagem JPEG, PNG ou WebP de até 5 MB.";
  if (typeof value !== "string" || value.length > maxEncoded + 32) {
    throw new RequestError(400, message);
  }
  const mime = header.exec(value);
  if (!mime) {
    throw new RequestError(400, message);
  }
  const encoded = value.slice(mime[0].length);
  const input = Buffer.from(encoded, "base64");
  if (input.length === 0 || input.length > maxFile || input.toString("base64") !== encoded) {
    throw new RequestError(400, message);
  }
  try {
    const image = sharp(input, { limitInputPixels: 50_000_000, failOn: "warning" });
    const metadata = await image.metadata();
    if (metadata.format !== mime[1] || (metadata.pages ?? 1) > 1) {
      throw new Error("Unsupported image");
    }
    const size = kind === "avatar" ? 512 : 1920;
    return await image
      .autoOrient()
      .resize({ width: size, height: size, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    throw new RequestError(400, "A imagem está inválida ou tem dimensões grandes demais.");
  }
}
