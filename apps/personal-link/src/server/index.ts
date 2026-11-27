import { fileURLToPath } from "node:url";
import { createApp } from "./app.js";
import { Database } from "./database.js";
import { createInstagramAvatarLookup } from "./instagram.js";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

const origin = new URL(required("APP_ORIGIN"));
if (
  !["https:", "http:"].includes(origin.protocol) ||
  origin.href !== `${origin.origin}/` ||
  (process.env.NODE_ENV === "production" && origin.protocol !== "https:")
) {
  throw new Error("APP_ORIGIN must be the canonical HTTP(S) origin, using HTTPS in production.");
}
const passwordHash = required("ADMIN_PASSWORD_HASH");
const port = Number(process.env.PORT ?? "3000");
if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error("PORT must be an integer from 1 to 65535.");
}

const database = new Database(required("DATABASE_URL"));
let app: Awaited<ReturnType<typeof createApp>> | undefined;
try {
  await database.migrate();
  app = await createApp({
    database,
    origin: origin.origin,
    passwordHash,
    release: process.env.APP_RELEASE ?? "development",
    clientDirectory: fileURLToPath(new URL("../client", import.meta.url)),
    logger: process.env.NODE_ENV !== "test",
    instagramAvatar: createInstagramAvatarLookup(process.env),
    trustedProxies: (process.env.TRUSTED_PROXIES ?? "")
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean),
  });
  await app.listen({ port, host: process.env.HOST ?? "0.0.0.0" });
} catch {
  console.error("Falha ao iniciar o editor. Confira a configuração e a conexão com o banco.");
  await (app ? app.close() : database.close()).catch(() => {});
  process.exitCode = 1;
}

if (app) {
  const running = app;
  for (const signal of ["SIGTERM", "SIGINT"] as const) {
    process.once(signal, () => {
      void running.close().catch(() => {
        process.exitCode = 1;
      });
    });
  }
}
