// Server-side client for the Asgardeo Customer Data Service (CDS) profile API.
//
// Deliberately NOT @cds-wso3app/cds-sdk: that SDK is browser-oriented
// (localStorage for the profile id, `credentials: "include"`) and expects the
// consuming app to hand it a client-credentials secret, which would put our
// M2M secret in the browser bundle. This app has a server, so the token is
// minted here and the secret never leaves it. Only ever import this from
// pages/api/* — never from a component.

const BASE_URL = process.env.CDS_BASE_URL;
const TOKEN_URL = process.env.CDS_TOKEN_URL;
const CLIENT_ID = process.env.ASGARDEO_M2M_CLIENT_ID;
const CLIENT_SECRET = process.env.ASGARDEO_M2M_CLIENT_SECRET;

// application_data namespace for this app's profile fields.
export const APP_ID = process.env.CDS_APP_ID;

// No _create: profiles are provisioned elsewhere, this app only reads/writes.
const SCOPES = "internal_cds_profile_view internal_cds_profile_update";

const REQUEST_TIMEOUT_MS = 8000;

// Module-level token cache. Next.js API routes share one process per
// container, so this is reused across requests until it nears expiry.
let cachedToken = null;
let cachedTokenExp = 0;

async function getToken() {
  if (cachedToken && Date.now() < cachedTokenExp - 30_000) return cachedToken;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      scope: SCOPES,
    }),
  });

  if (!res.ok) {
    throw new Error(`CDS token fetch failed: ${res.status}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  cachedTokenExp = Date.now() + data.expires_in * 1000;
  return cachedToken;
}

async function request(method, path, body) {
  const token = await getToken();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    // A 401 here means the cached token was rejected (rotated secret, or
    // revoked scopes) — drop it so the next call re-mints rather than
    // replaying a dead token for the rest of the container's life.
    if (res.status === 401) {
      cachedToken = null;
      cachedTokenExp = 0;
    }
    throw new Error(`CDS ${method} ${path} -> ${res.status}: ${text}`);
  }

  const contentType = res.headers.get("Content-Type") || "";
  return contentType.includes("application/json") ? res.json() : null;
}

// ---- Raw profile access ----

export async function listProfiles({ cursor, pageSize = 50, filter } = {}) {
  const params = new URLSearchParams({
    attributes: "identity_attributes.*,application_data.*",
    includeApplicationData: "true",
    page_size: String(pageSize),
  });
  if (cursor) params.set("cursor", cursor);
  if (filter) params.set("filter", filter);
  return request("GET", `/profiles?${params}`);
}

export async function getProfileById(profileId) {
  return request(
    "GET",
    `/profiles/${profileId}?attributes=identity_attributes.*,traits.*,application_data.*&includeApplicationData=true`
  );
}

export async function patchProfile(profileId, payload) {
  return request("PATCH", `/profiles/${profileId}`, payload);
}

// Patch this app's application_data namespace without the caller having to
// know the APP_ID indirection.
export async function patchAppData(profileId, fields) {
  return patchProfile(profileId, { application_data: { [APP_ID]: fields } });
}

export async function patchTraits(profileId, traits) {
  return patchProfile(profileId, { traits });
}
