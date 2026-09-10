// The roster is the Asgardeo user directory (SCIM2), enriched with whatever
// this app has stored about each person in CDS.
//
// Two sources on purpose: SCIM2 answers "who is on the team" — a person
// exists whether or not anyone has ever set their subteam — while CDS holds
// this app's own data under application_data[APP_ID]. Joined on email, which
// is the only identifier both sides carry.

import { listProfiles, APP_ID } from "./cds";
import { listUsers } from "./scim";

// Listing the directory on every request is a lot of round-trips for data
// that changes rarely. Short enough that a subteam edit shows up promptly.
const ROSTER_TTL_MS = 60_000;
let cachedRoster = null;
let cachedAt = 0;

function normalizeEmail(email) {
  return email ? email.trim().toLowerCase() : null;
}

// Map email -> this app's application_data for that person.
async function loadProfileData() {
  const byEmail = new Map();
  let cursor;

  for (let page = 0; page < 20; page++) {
    const data = await listProfiles({ cursor });
    const profiles = data?.profiles || [];

    for (const profile of profiles) {
      const email = normalizeEmail(profile.identity_attributes?.emailaddress);
      if (!email) continue;
      byEmail.set(email, {
        profileId: profile.profile_id,
        appData: profile.application_data?.[APP_ID] || {},
      });
    }

    cursor = data?.pagination?.next_cursor || data?.pagination?.cursor;
    if (!cursor || profiles.length === 0) break;
  }

  return byEmail;
}

export async function getRoster({ force = false } = {}) {
  if (!force && cachedRoster && Date.now() - cachedAt < ROSTER_TTL_MS) {
    return cachedRoster;
  }

  const users = await listUsers();

  // CDS is enrichment, not membership — if it's unreachable or empty we
  // still want the directory to render, just without team/subteam.
  let profileData = new Map();
  try {
    profileData = await loadProfileData();
  } catch (err) {
    console.warn("[roster] CDS enrichment failed, serving directory only:", err.message);
  }

  cachedRoster = users
    .map((user) => {
      const match = profileData.get(normalizeEmail(user.email)) || {};
      const appData = match.appData || {};
      return {
        userId: user.userId,
        profileId: match.profileId || null,
        name: user.name,
        email: user.email,
        team: appData.team || null,
        subteam: appData.subteam || null,
      };
    })
    .sort(
      (a, b) =>
        (a.team || "￿").localeCompare(b.team || "￿") ||
        (a.name || "").localeCompare(b.name || "")
    );

  cachedAt = Date.now();
  return cachedRoster;
}

export async function findByEmail(email) {
  const target = normalizeEmail(email);
  return (await getRoster()).find((m) => normalizeEmail(m.email) === target) || null;
}

export async function findByName(name) {
  return (await getRoster()).find((m) => m.name === name) || null;
}

export function invalidateRoster() {
  cachedRoster = null;
  cachedAt = 0;
}
