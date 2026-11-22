import { kv } from "@vercel/kv";
import { getSession } from "../lib/session.js";

const RESERVED = ["ping", "login", "run", "help"];
const NAME_RE = /^[a-z][a-z0-9_-]{0,31}$/;
const MAX_COMMANDS = 25;
const MAX_TEMPLATE = 1000;

export default async function handler(req, res) {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "Giriş gerekli." });

  const botId = await kv.get(`userbot:${session.uid}`);
  if (!botId) return res.status(404).json({ error: "Önce bir bot oluşturun." });

  const key = `cmds:${botId}`;

  if (req.method === "GET") {
    const commands = (await kv.hgetall(key)) || {};
    return res.status(200).json({ commands });
  }

  if (req.method === "POST") {
    const { name, template, description } = req.body || {};

    if (typeof name !== "string" || !NAME_RE.test(name)) {
      return res.status(400).json({
        error: "Komut adı küçük harf, rakam, - veya _ içermeli, harfle başlamalı, en fazla 32 karakter.",
      });
    }
    if (RESERVED.includes(name)) {
      return res.status(400).json({ error: "Bu ad sistem tarafından kullanılıyor." });
    }
    if (typeof template !== "string" || !template.trim() || template.length > MAX_TEMPLATE) {
      return res.status(400).json({ error: `Şablon 1-${MAX_TEMPLATE} karakter olmalı.` });
    }

    const current = (await kv.hgetall(key)) || {};
    if (!(name in current) && Object.keys(current).length >= MAX_COMMANDS) {
      return res.status(400).json({ error: `En fazla ${MAX_COMMANDS} komut tanımlayabilirsiniz.` });
    }

    await kv.hset(key, {
      [name]: {
        template: template.trim(),
        description: String(description || "").slice(0, 100),
        createdAt: Date.now(),
      },
    });
    return res.status(200).json({ ok: true });
  }

  if (req.method === "DELETE") {
    const { name } = req.body || {};
    if (typeof name !== "string") return res.status(400).json({ error: "Ad eksik." });
    await kv.hdel(key, name);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
