// The roster is no longer a hardcoded list — it's derived from CDS profiles.
// Each person is one profile; their org-chart placement lives in this app's
// application_data namespace (APP_ID), keyed `team` / `subteam`.

import { listProfiles, APP_ID } from "./cds";

// Listing every profile on each request would be a lot of round-trips for
// data that changes rarely, so hold it briefly in memory. Short enough that
// a subteam edit shows up on the next page load.
const ROSTER_TTL_MS = 60_000;
let cachedRoster = null;
let cachedAt = 0;

// The list endpoint's envelope isn't stable across CDS versions — accept the
// shapes we've seen rather than hard-failing on the wrong key.
function unwrap(page) {
  if (Array.isArray(page)) return { profiles: page, cursor: null };
  return {
    profiles: page?.profiles || page?.items || page?.data || [],
    cursor: page?.next_cursor || page?.cursor || null,
  };
}

function displayName(identity, appData) {
  if (appData.name) return appData.name;
  if (identity.username) return identity.username;
  const given = identity.givenname || identity.given_name;
  const last = identity.lastname || identity.family_name;
  if (given || last) return [given, last].filter(Boolean).join(" ");
  const email = identity.emailaddress || "";
  return email.split("@")[0] || null;
}

function toMember(profile) {
  const identity = profile.identity_attributes || {};
  const appData = profile.application_data?.[APP_ID] || {};
  return {
    profileId: profile.profile_id,
    name: displayName(identity, appData),
    email: identity.emailaddress || null,
    team: appData.team || null,
    subteam: appData.subteam || null,
  };
}

export async function getRoster({ force = false } = {}) {
  if (!force && cachedRoster && Date.now() - cachedAt < ROSTER_TTL_MS) {
    return cachedRoster;
  }

  const members = [];
  let cursor;
  // Bound the walk: a runaway cursor shouldn't hang the request.
  for (let page = 0; page < 20; page++) {
    const { profiles, cursor: next } = unwrap(await listProfiles({ cursor }));
    members.push(...profiles.map(toMember));
    if (!next || profiles.length === 0) break;
    cursor = next;
  }

  // Drop profiles that aren't people on this team — a CDS org can hold
  // profiles this app knows nothing about.
  cachedRoster = members
    .filter((m) => m.name && m.team)
    .sort((a, b) => a.team.localeCompare(b.team) || a.name.localeCompare(b.name));
  cachedAt = Date.now();
  return cachedRoster;
}

export async function findByName(name) {
  return (await getRoster()).find((m) => m.name === name) || null;
}

export function invalidateRoster() {
  cachedRoster = null;
  cachedAt = 0;
}
