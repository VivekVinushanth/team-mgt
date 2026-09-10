import { verifyRequest } from "../../../lib/auth-server";
import { deleteLeave } from "../../../lib/storage";
import { canEditLeave } from "../../../lib/config";

export default async function handler(req, res) {
  let user;
  try {
    user = await verifyRequest(req);
  } catch (err) {
    return res.status(err.status || 401).json({ error: err.message });
  }

  if (req.method === "DELETE") {
    if (!canEditLeave(user.roles)) {
      return res.status(403).json({ error: "Your role can't edit leave" });
    }
    deleteLeave(req.query.id);
    return res.status(200).json({ ok: true });
  }

  res.status(405).end();
}
