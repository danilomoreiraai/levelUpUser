import { stdin, stdout } from "node:process";
import { hashPassword } from "./auth.js";

let password = "";
stdin.setEncoding("utf8");
for await (const chunk of stdin) {
  password += chunk;
  if (Buffer.byteLength(password) > 514) {
    throw new Error("Use uma senha de até 512 bytes.");
  }
}
stdout.write(`${await hashPassword(password.replace(/\r?\n$/, ""))}\n`);
