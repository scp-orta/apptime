import crypto from "crypto";
import { kv } from "@vercel/kv";
import { findBotByKeys } from "../lib/keys.js";

export const config = { api: { bodyParser: false } };

const PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY;

async function readRaw(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

function verifyDiscordRequest(rawBody, signature, timestamp) {
  try {
    const keyDer = Buffer.from("302a300506032b6570032100" + PUBLIC_KEY, "hex");
    const publicKey = crypto.createPublicKey({ key: keyDer, format: "der", type: "spki" });
    return crypto.verify(null, Buffer.from(timestamp + rawBody), publicKey, Buffer.from(signature, "hex"));
  } catch {
    return false;
  }
}

// Sadece komutu yazan kişiye görünen cevap (flags 64 = ephemeral)
const ephemeral = (content) => ({ type: 4, data: { content, flags: 64 } });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  const rawBody = await readRaw(req);
  const signature = req.headers["x-signature-ed25519"];
  const timestamp = req.headers["x-signature-timestamp"];

  if (!signature || !timestamp || !verifyDiscordRequest(rawBody, signature, timestamp)) {
    return res.status(401).send("invalid request signature");
  }

  const interaction = JSON.parse(rawBody);

  // Discord URL kontrolü
  if (interaction.type === 1) {
    return res.status(200).json({ type: 1 });
  }

  // Slash komutu
  if (interaction.type === 2) {
    const name = interaction.data?.name;

    if (name === "ping") {
      return res.status(200).json(ephemeral("Pong! Bot çalışıyor."));
    }

    if (name === "login") {
      // Değerleri loglamıyoruz
      const opts = Object.fromEntries(
        (interaction.data.options || []).map((o) => [o.name, o.value])
      );

      const bot = await findBotByKeys(opts.secret_key?.trim(), opts.web_key?.trim());
      if (!bot) {
        return res.status(200).json(ephemeral("Geçersiz anahtar. Secret key ve web key'i kontrol edin."));
      }

      const userId = interaction.member?.user?.id || interaction.user?.id;
      await kv.set(`link:${userId}`, {
        botId: bot.botId,
        botName: bot.name,
        linkedAt: Date.now(),
      });

      return res.status(200).json(ephemeral(`Doğrulandı. "${bot.name}" botu hesabınıza bağlandı.`));
    }

    return res.status(200).json(ephemeral("Bu komut henüz tanımlanmadı."));
  }

  return res.status(400).send("unknown interaction type");
}
