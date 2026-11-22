const COMMANDS = [
  {
    name: "ping",
    description: "Botun çalışıp çalışmadığını test eder",
    type: 1,
  },
    {
    name: "run",
    description: "Kendi tanımladığın komutu çalıştır",
    type: 1,
    options: [
      { name: "name", description: "Komut adı", type: 3, required: true },
      { name: "args", description: "Değer (isteğe bağlı)", type: 3, required: false },
    ],
  },
  {
    name: "login",
    description: "Botunu secret key ve web key ile hesabına bağla",
    type: 1,
    options: [
      { name: "web_key", description: "Web key", type: 3, required: true },
      { name: "secret_key", description: "Secret key", type: 3, required: true },
    ],
  },
];

export default async function handler(req, res) {
  if (req.query.key !== process.env.ADMIN_KEY) {
    return res.status(401).send("unauthorized");
  }

  const r = await fetch(
    `https://discord.com/api/v10/applications/${process.env.DISCORD_APP_ID}/commands`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(COMMANDS),
    }
  );

  const data = await r.json();
  return res.status(r.ok ? 200 : 500).json(data);
}
