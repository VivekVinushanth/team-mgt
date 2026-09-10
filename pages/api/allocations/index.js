import { verifyRequest } from "../../../lib/auth-server";
import { getAllocationsForWeek, setAllocation, getAllLeave } from "../../../lib/storage";
import {
  canEditAllocation,
  ALLOCATION_CATEGORIES,
  LEAVE_TYPE_TO_ALLOCATION_CATEGORY,
} from "../../../lib/config";
import { getRoster } from "../../../lib/roster";
import { currentISOWeek, weekOverlapsRange } from "../../../lib/weeks";

export default async function handler(req, res) {
  let user;
  try {
    user = await verifyRequest(req);
  } catch (err) {
    return res.status(err.status || 401).json({ error: err.message });
  }

  if (req.method === "GET") {
    const week = req.query.week || currentISOWeek();
    const allocations = getAllocationsForWeek(week);

    let roster;
    try {
      roster = await getRoster();
    } catch (err) {
      return res.status(502).json({ error: `Could not load roster from CDS: ${err.message}` });
    }

    // Suggest (don't force) a category for anyone with active leave this
    // week who has no allocation entered yet — Leads can still override.
    const leave = getAllLeave();
    const suggestions = {};
    for (const record of leave) {
      if (weekOverlapsRange(week, record.startDate, record.endDate) && !allocations[record.name]) {
        suggestions[record.name] = LEAVE_TYPE_TO_ALLOCATION_CATEGORY[record.type] || "Leave";
      }
    }

    return res.status(200).json({
      week,
      roster,
      categories: ALLOCATION_CATEGORIES,
      allocations,
      suggestions,
    });
  }

  if (req.method === "POST") {
    if (!canEditAllocation(user.roles)) {
      return res.status(403).json({ error: "Your role can't edit allocations" });
    }
    const { week, name, category, subCommitment } = req.body;
    if (!week || !name) {
      return res.status(400).json({ error: "week and name are required" });
    }
    const saved = setAllocation(week, name, { category, subCommitment, updatedBy: user.email });
    return res.status(200).json(saved);
  }

  res.status(405).end();
}
