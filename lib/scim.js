// SCIM2 user directory access. The roster is the set of users in the
// Asgardeo org — CDS holds what we know *about* each person, but not who
// exists, so membership comes from here and is joined to CDS on email.

import { getToken, invalidateToken } from "./asgardeo-token";

const SCIM_BASE_URL = process.env.SCIM_BASE_URL;
const SCOPES = "internal_user_mgt_list internal_user_mgt_view";
const REQUEST_TIMEOUT_MS = 8000;
const PAGE_SIZE = 100;

async function request(path) {
  const token = await getToken(SCOPES);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res;
  try {
    res = await fetch(`${SCIM_BASE_URL}${path}`, {
      method: "GET",
      signal: controller.signal,
      headers: { Accept: "application/scim+json", Authorization: `Bearer ${token}` },
    });
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    if (res.status === 401) invalidateToken(SCOPES);
    const text = await res.text().catch(() => "");
    throw new Error(`SCIM2 GET ${path} -> ${res.status}: ${text}`);
  }
  return res.json();
}

// SCIM2 puts the primary address in an `emails` array that may hold bare
// strings or {value, primary} objects depending on the user store.
function primaryEmail(user) {
  const emails = user.emails || [];
  for (const entry of emails) {
    if (typeof entry === "string") return entry;
    if (entry?.primary && entry.value) return entry.value;
  }
  const first = emails[0];
  if (typeof first === "string") return first;
  if (first?.value) return first.value;
  // Asgardeo usernames are commonly the email address itself.
  return user.userName?.includes("@") ? user.userName : null;
}

function displayName(user) {
  const given = user.name?.givenName;
  const family = user.name?.familyName;
  if (given || family) return [given, family].filter(Boolean).join(" ");
  if (user.displayName) return user.displayName;
  const email = primaryEmail(user);
  return email ? email.split("@")[0] : user.userName;
}

export async function listUsers() {
  const users = [];
  let startIndex = 1;

  // SCIM2 pages are 1-indexed via startIndex. Bounded so a server that
  // ignores startIndex can't spin us forever.
  for (let page = 0; page < 20; page++) {
    const params = new URLSearchParams({
      count: String(PAGE_SIZE),
      startIndex: String(startIndex),
      attributes: "userName,emails,name,displayName",
    });
    const data = await request(`/Users?${params}`);
    const resources = data.Resources || [];

    for (const user of resources) {
      users.push({
        userId: user.id,
        userName: user.userName,
        email: primaryEmail(user),
        name: displayName(user),
      });
    }

    startIndex += resources.length;
    const total = data.totalResults ?? users.length;
    if (resources.length === 0 || users.length >= total) break;
  }

  return users;
}
