import crypto from "crypto";
import { kv } from "@vercel/kv";
import { getSession } from "../lib/session.js";

const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");
const makeKey = (prefix) => prefix + crypto.randomBytes(24).toString("hex");

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Önce Discord ile giriş yapın." });

  const existing = await kv.get(`userbot:${session.uid}`);
  if (existing) return res.status(409).json({ error: "Bu hesabın zaten bir botu var." });

  const { name } = req.body || {};
  if (typeof name !== "string" || !name.trim() || name.length > 50) {
    return res.status(400).json({ error: "Geçersiz bot adı (1-50 karakter)." });
  }

  const botId = crypto.randomUUID();
  const secretKey = makeKey("sk_");
  const webKey = makeKey("wk_");

  await kv.set(`bot:${botId}`, {
    botId,
    name: name.trim(),
    owner: session.uid,
    createdAt: Date.now(),
  });
  await kv.set(`secret:${sha256(secretKey)}`, botId);
  await kv.set(`web:${sha256(webKey)}`, botId);
  await kv.set(`userbot:${session.uid}`, botId);

  return res.status(200).json({
    botId,
    secretKey,
    webKey,
    note: "Bu anahtarları şimdi kaydet. Tekrar gösterilmeyecek.",
  });
}
