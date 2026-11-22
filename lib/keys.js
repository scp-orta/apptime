import crypto from "crypto";
import { kv } from "@vercel/kv";

const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");

// Secret key ve web key'in ikisi de geçerliyse bot kaydını döner, değilse null
export async function findBotByKeys(secretKey, webKey) {
  if (typeof secretKey !== "string" || typeof webKey !== "string") return null;

  const botFromSecret = await kv.get(`secret:${sha256(secretKey)}`);
  const botFromWeb = await kv.get(`web:${sha256(webKey)}`);

  if (!botFromSecret || botFromSecret !== botFromWeb) return null;
  return await kv.get(`bot:${botFromSecret}`);
}
