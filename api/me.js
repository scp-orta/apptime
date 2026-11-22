import { getSession } from "../lib/session.js";

export default async function handler(req, res) {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: "unauthorized" });
  return res.status(200).json({ uid: session.uid });
}
