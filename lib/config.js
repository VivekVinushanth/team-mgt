// ---- Things you'll actually want to edit ----

// GitHub repos to pull issues/status from.
export const TRACKED_REPOS = [
  // "wso2/product-is",
  // "wso2/thunder",
  // "wso2/asgardeo-app",
];

// Only users with this email domain can sign in / use the API.
// Enforced server-side in lib/auth-server.js, not just in the UI.
export const ALLOWED_EMAIL_DOMAIN = "wso2.com";

// The four roles this app understands.
export const APP_ROLES = ["EM", "PM", "Lead", "Dev"];

// Requested at sign-in. `roles` is what releases the roles claim in the ID
// token — without it the token carries no authorisation information at all
// and every user ends up read-only.
export const OIDC_SCOPES = ["openid", "email", "profile", "roles"];

// Map Asgardeo role (or group) names on the left to app roles on the right.
// Only needed when the names differ; a value that is already an app role is
// passed through untouched by rolesFromClaims below.
export const ASGARDEO_GROUP_TO_ROLE = {
  "engineering-managers": "EM",
  "product-managers": "PM",
  "tech-leads": "Lead",
  "associate-tech-leads": "Lead",
  "software-engineers": "Dev",
};

// Single place that turns ID-token claims into app roles, shared by the
// browser (components/useAppAuth.js) and the API routes
// (lib/auth-server.js) so the two can never disagree about who someone is.
//
// Asgardeo releases `roles` for the roles scope; some setups release `groups`
// instead. Accept either, and accept a value that is already an app role so a
// tenant naming its roles EM/PM/Lead/Dev needs no mapping at all.
export function rolesFromClaims(payload = {}) {
  const raw = payload.roles ?? payload.groups ?? [];
  const values = Array.isArray(raw) ? raw : [raw];
  const mapped = values.map((v) =>
    APP_ROLES.includes(v) ? v : ASGARDEO_GROUP_TO_ROLE[v]
  );
  return [...new Set(mapped.filter(Boolean))];
}

// Roles allowed to add/edit a manual issue-status override + comment.
export const STATUS_EDIT_ROLES = ["EM", "PM", "Lead"];

// Roles allowed to edit the weekly allocation planner.
export const ALLOCATION_EDIT_ROLES = ["EM", "PM", "Lead"];

// "Leads and above" can log/edit leave.
export const LEAVE_EDIT_ROLES = ["EM", "PM", "Lead"];

// Leave types tracked, and how they map onto an allocation category
// (used to suggest — not force — a weekly allocation when someone's on leave).
export const LEAVE_TYPES = ["Annual", "Sabbatical"];
export const LEAVE_TYPE_TO_ALLOCATION_CATEGORY = {
  Annual: "Leave",
  Sabbatical: "Long-term Leave",
};

// Weekly allocation categories — ported from the team's existing allocation
// sheet ("Weekly Overview" tab column headers). Edit to match if these change.
export const ALLOCATION_CATEGORIES = [
  "R&D - IS",
  "R&D - SaaS",
  "R&D - ThunderID",
  "R&D Common",
  "Maintenance - SaaS",
  "Maintenance - OnPrem",
  "CS Cmt.",
  "SA Cmt.",
  "DevRel Cmt.",
  "Other Cmt.",
  "Leave",
  "Long-term Leave",
];

// Sub-teams people can be assigned to. Used to group the allocation
// planner and leave views.
export const TEAMS = [
  "Leads",
  "User Mgt & Authentication",
  "OAuth & OIDC",
  "B2B",
  "IS Core",
  "IAM SaaS",
  "Thunder",
  "Thunder Core",
  "Dev Rel",
];

// The roster itself is NOT configured here — it comes from CDS profiles
// (application_data.<APP_ID>.team / .subteam). See lib/roster.js.

export function canEditStatus(roles = []) {
  return roles.some((r) => STATUS_EDIT_ROLES.includes(r));
}

export function canEditAllocation(roles = []) {
  return roles.some((r) => ALLOCATION_EDIT_ROLES.includes(r));
}

export function canEditLeave(roles = []) {
  return roles.some((r) => LEAVE_EDIT_ROLES.includes(r));
}
