import crypto from "crypto";
import { kv } from "@vercel/kv";

const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { secretKey, webKey } = req.body || {};
  if (typeof secretKey !== "string" || typeof webKey !== "string") {
    return res.status(400).json({ valid: false, error: "Anahtarlar eksik." });
  }

  const botFromSecret = await kv.get(`secret:${sha256(secretKey)}`);
  const botFromWeb = await kv.get(`web:${sha256(webKey)}`);

  // İki anahtar da var olmalı ve aynı bota ait olmalı
  if (!botFromSecret || botFromSecret !== botFromWeb) {
    return res.status(401).json({ valid: false });
  }

  const bot = await kv.get(`bot:${botFromSecret}`);
  return res.status(200).json({ valid: true, botId: bot.botId, name: bot.name });
}
