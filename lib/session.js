import { webcrypto } from "crypto";

const subtle = webcrypto.subtle;
const enc = new TextEncoder();
const SECRET = process.env.SESSION_SECRET;

const hex = (buf) =>
  Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");

async function sign(data) {
  const key = await subtle.importKey(
    "raw", enc.encode(SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  return hex(await subtle.sign("HMAC", key, enc.encode(data)));
}

export async function createSessionToken(uid) {
  const payload = Buffer.from(
    JSON.stringify({ uid, exp: Date.now() + 7 * 24 * 3600 * 1000 })
  ).toString("base64url");
  return `${payload}.${await sign(payload)}`;
}

export async function getSession(req) {
  const m = (req.headers.cookie || "").match(/(?:^|;\s*)session=([^;]+)/);
  if (!m) return null;

  const [payload, sig] = m[1].split(".");
  if (!payload || !sig) return null;
  if (sig !== (await sign(payload))) return null;

  const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  if (Date.now() > data.exp) return null;
  return data;
}
