import { createSessionToken } from "../../lib/session.js";

const BASE = "https://createapp-three.vercel.app";

function readCookie(req, name) {
  const m = (req.headers.cookie || "").match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return m ? m[1] : null;
}

function fail(res, status, msg) {
  res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(msg);
}

export default async function handler(req, res) {
  const url = new URL(req.url, BASE);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  // CSRF koruması: state çerezi ile eşleşmeli
  if (!code || !state || state !== readCookie(req, "oauth_state")) {
    return fail(res, 400, "Geçersiz istek.");
  }

  const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.DISCORD_APP_ID,
      client_secret: process.env.DISCORD_CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: `${BASE}/api/auth/callback`,
    }),
  });
  if (!tokenRes.ok) return fail(res, 401, "Discord girişi başarısız.");

  const { access_token } = await tokenRes.json();
  const userRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (!userRes.ok) return fail(res, 401, "Kullanıcı bilgisi alınamadı.");

  const user = await userRes.json();
  const token = await createSessionToken(user.id);

  res.setHeader("Set-Cookie", [
    `session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`,
    `oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`,
  ]);
  res.writeHead(302, { Location: "/" });
  res.end();
}
