import { verifyRequest } from "../../../lib/auth-server";
import { setOverride, getOverride } from "../../../lib/storage";
import { canEditStatus } from "../../../lib/config";

export default async function handler(req, res) {
  let user;
  try {
    user = await verifyRequest(req);
  } catch (err) {
    return res.status(err.status || 401).json({ error: err.message });
  }

  const { id } = req.query; // e.g. "wso2/product-is#1234"

  if (req.method === "GET") {
    return res.status(200).json(getOverride(decodeURIComponent(id)));
  }

  if (req.method === "POST") {
    if (!canEditStatus(user.roles)) {
      return res.status(403).json({ error: "Your role can't edit status" });
    }
    const { status, comment, startDate, targetDate } = req.body;
    const saved = setOverride(decodeURIComponent(id), {
      status,
      comment,
      startDate: startDate || null,
      targetDate: targetDate || null,
      updatedBy: user.email,
    });
    return res.status(200).json(saved);
  }

  res.status(405).end();
}
