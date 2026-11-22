import crypto from "crypto";

const BASE = "https://createapp-three.vercel.app";

export default function handler(req, res) {
  const state = crypto.randomBytes(16).toString("hex");

  const url = new URL("https://discord.com/oauth2/authorize");
  url.searchParams.set("client_id", process.env.DISCORD_APP_ID);
  url.searchParams.set("redirect_uri", `${BASE}/api/auth/callback`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "identify");
  url.searchParams.set("state", state);

  res.setHeader(
    "Set-Cookie",
    `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`
  );
  res.writeHead(302, { Location: url.toString() });
  res.end();
}
