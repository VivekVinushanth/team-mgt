import { verifyRequest } from "../../../lib/auth-server";
import { getAllLeave, addLeave } from "../../../lib/storage";
import { canEditLeave, TEAM_ROSTER, LEAVE_TYPES } from "../../../lib/config";

export default async function handler(req, res) {
  let user;
  try {
    user = await verifyRequest(req);
  } catch (err) {
    return res.status(err.status || 401).json({ error: err.message });
  }

  if (req.method === "GET") {
    return res.status(200).json({
      leave: getAllLeave(),
      roster: TEAM_ROSTER,
      leaveTypes: LEAVE_TYPES,
    });
  }

  if (req.method === "POST") {
    if (!canEditLeave(user.roles)) {
      return res.status(403).json({ error: "Your role can't log leave" });
    }
    const { name, type, startDate, endDate, notes } = req.body;
    if (!name || !type || !startDate || !endDate) {
      return res.status(400).json({ error: "name, type, startDate, endDate are required" });
    }
    if (!LEAVE_TYPES.includes(type)) {
      return res.status(400).json({ error: `type must be one of ${LEAVE_TYPES.join(", ")}` });
    }
    const record = addLeave({ name, type, startDate, endDate, notes, updatedBy: user.email });
    return res.status(200).json(record);
  }

  res.status(405).end();
}
