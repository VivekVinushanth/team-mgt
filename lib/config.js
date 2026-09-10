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

// Roles pulled from Asgardeo's "groups" claim.
// Map your actual Asgardeo group names (left) to app roles (right).
export const ASGARDEO_GROUP_TO_ROLE = {
  "engineering-managers": "EM",
  "product-managers": "PM",
  "tech-leads": "Lead",
  "associate-tech-leads": "Lead",
  "software-engineers": "Dev",
};

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

// Team roster. Intentionally empty — add people here as needed:
//   { name: "Jane", team: "IS Core" }
// "name" is the key used across allocation + leave. Add an "email" per
// person only if/when you want to link a roster row to a specific
// Asgardeo login. "team" must be one of TEAMS above.
export const TEAM_ROSTER = [];

export function canEditStatus(roles = []) {
  return roles.some((r) => STATUS_EDIT_ROLES.includes(r));
}

export function canEditAllocation(roles = []) {
  return roles.some((r) => ALLOCATION_EDIT_ROLES.includes(r));
}

export function canEditLeave(roles = []) {
  return roles.some((r) => LEAVE_EDIT_ROLES.includes(r));
}
