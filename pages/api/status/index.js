import { verifyRequest } from "../../../lib/auth-server";
import { getAllOverrides } from "../../../lib/storage";

export default async function handler(req, res) {
  try {
    await verifyRequest(req);
  } catch (err) {
    return res.status(err.status || 401).json({ error: err.message });
  }

  if (req.method === "GET") {
    return res.status(200).json(getAllOverrides());
  }

  res.status(405).end();
}
