export default async function handler(req, res) {
  if (req.query.key !== process.env.ADMIN_KEY) {
    return res.status(401).send("unauthorized");
  }

  const appId = process.env.DISCORD_APP_ID || "";
  const secret = process.env.DISCORD_CLIENT_SECRET || "";

  const report = {
    app_id_set: appId.length > 0,
    app_id_length: appId.length,
    app_id_has_spaces: appId !== appId.trim(),
    app_id_is_numeric: /^\d+$/.test(appId.trim()),
    secret_set: secret.length > 0,
    secret_length: secret.length,
    secret_has_spaces: secret !== secret.trim(),
    secret_has_quotes: /^["']|["']$/.test(secret),
  };

  // Discord'a client_credentials isteği: sadece client_id ve secret doğruysa 200 döner
  const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      scope: "identify",
      client_id: appId.trim(),
      client_secret: secret.trim(),
    }),
  });

  report.discord_status = tokenRes.status;
  report.discord_accepts_credentials = tokenRes.ok;
  if (!tokenRes.ok) report.discord_error = await tokenRes.text();

  return res.status(200).json(report);
}
