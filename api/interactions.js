import crypto from "crypto";

const PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY;

// Discord'un Ed25519 imzasını doğrular
function verifyDiscordRequest(rawBody, signature, timestamp) {
  try {
    const keyDer = Buffer.from("302a300506032b6570032100" + PUBLIC_KEY, "hex");
    const publicKey = crypto.createPublicKey({ key: keyDer, format: "der", type: "spki" });
    return crypto.verify(
      null,
      Buffer.from(timestamp + rawBody),
      publicKey,
      Buffer.from(signature, "hex")
    );
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const signature = req.headers["x-signature-ed25519"];
  const timestamp = req.headers["x-signature-timestamp"];
  const rawBody = typeof req.body === "string" ? req.body : JSON.stringify(req.body);

  if (!signature || !timestamp || !verifyDiscordRequest(rawBody, signature, timestamp)) {
    return res.status(401).send("invalid request signature");
  }

  const interaction = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

  // Discord'un URL kontrolü (PING)
  if (interaction.type === 1) {
    return res.status(200).json({ type: 1 });
  }

  // Slash komutu (type 2)
  if (interaction.type === 2) {
    const name = interaction.data?.name;

    if (name === "ping") {
      return res.status(200).json({
        type: 4,
        data: { content: "Pong! Bot çalışıyor." },
      });
    }

    return res.status(200).json({
      type: 4,
      data: { content: "Bu komut henüz tanımlanmadı." },
    });
  }

  return res.status(400).send("unknown interaction type");
}
