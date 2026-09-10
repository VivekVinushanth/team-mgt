import fs from "fs";
import path from "path";
import crypto from "crypto";

// NOTE on all stores below: file-based JSON is fine for local dev / a pilot.
// On Choreo, container storage is ephemeral across redeploys/restarts —
// for anything beyond a demo, swap these for Choreo's managed Postgres
// (a few lines: replace read/write with SQL queries, keep the same function
// signatures so callers don't change).

function readJSON(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch {
    return fallback;
  }
}
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ---- Manual GitHub-issue status overrides ----
const OVERRIDES_FILE = path.join(process.cwd(), "data", "overrides.json");

export function getOverride(issueId) {
  return readJSON(OVERRIDES_FILE, {})[issueId] || null;
}

// fields: { status, comment, startDate, targetDate } — any subset; only
// startDate/targetDate matter for the timeline view.
export function setOverride(issueId, fields) {
  const all = readJSON(OVERRIDES_FILE, {});
  all[issueId] = { ...all[issueId], ...fields, updatedAt: new Date().toISOString() };
  writeJSON(OVERRIDES_FILE, all);
  return all[issueId];
}

export function getAllOverrides() {
  return readJSON(OVERRIDES_FILE, {});
}

// ---- Cached GitHub issues ----
// Shape: { [issueId]: { ...issue fields, cached_at } }
// Separate from CDS on purpose: an issue isn't owned by one person's profile
// (unassigned/reassigned/multi-collaborator), so it doesn't fit the
// per-user_id profile model. This stays a simple keyed cache.
const ISSUES_CACHE_FILE = path.join(process.cwd(), "data", "issues-cache.json");

export function getCachedIssues() {
  return readJSON(ISSUES_CACHE_FILE, {});
}

// Upserts each issue by id, overwriting the previous cached copy.
// Issues that no longer come back from GitHub (closed/deleted/renamed repo)
// are left in place until a caller explicitly prunes them — see pruneCachedIssues.
export function upsertCachedIssues(issues) {
  const all = readJSON(ISSUES_CACHE_FILE, {});
  const now = new Date().toISOString();
  for (const issue of issues) {
    all[issue.id] = { ...issue, cached_at: now };
  }
  writeJSON(ISSUES_CACHE_FILE, all);
  return all;
}

// Removes cached issues not present in the latest pull's id list — call this
// after a successful pull if you want the cache to mirror GitHub exactly
// rather than accumulate stale closed issues forever.
export function pruneCachedIssues(currentIds) {
  const all = readJSON(ISSUES_CACHE_FILE, {});
  const idSet = new Set(currentIds);
  for (const id of Object.keys(all)) {
    if (!idSet.has(id)) delete all[id];
  }
  writeJSON(ISSUES_CACHE_FILE, all);
  return all;
}

// ---- Weekly allocation planner ----
// Shape: { [isoWeek]: { [personName]: { category, subCommitment, updatedBy, updatedAt } } }
const ALLOC_FILE = path.join(process.cwd(), "data", "allocations.json");

export function getAllocationsForWeek(isoWeek) {
  return readJSON(ALLOC_FILE, {})[isoWeek] || {};
}

export function setAllocation(isoWeek, name, { category, subCommitment, updatedBy }) {
  const all = readJSON(ALLOC_FILE, {});
  all[isoWeek] = all[isoWeek] || {};
  all[isoWeek][name] = {
    category: category || null,
    subCommitment: subCommitment || "",
    updatedBy,
    updatedAt: new Date().toISOString(),
  };
  writeJSON(ALLOC_FILE, all);
  return all[isoWeek][name];
}

// ---- Leave tracking (annual / sabbatical) ----
// Shape: [{ id, name, type, startDate, endDate, notes, updatedBy, updatedAt }]
const LEAVE_FILE = path.join(process.cwd(), "data", "leave.json");

export function getAllLeave() {
  return readJSON(LEAVE_FILE, []);
}

export function addLeave({ name, type, startDate, endDate, notes, updatedBy }) {
  const all = readJSON(LEAVE_FILE, []);
  const record = {
    id: crypto.randomUUID(),
    name,
    type,
    startDate,
    endDate,
    notes: notes || "",
    updatedBy,
    updatedAt: new Date().toISOString(),
  };
  all.push(record);
  writeJSON(LEAVE_FILE, all);
  return record;
}

export function deleteLeave(id) {
  writeJSON(LEAVE_FILE, readJSON(LEAVE_FILE, []).filter((r) => r.id !== id));
}
