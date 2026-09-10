import { getToken, invalidateToken } from "./asgardeo-token";

// Server-side client for the Asgardeo Customer Data Service (CDS) profile API.
//
// Deliberately NOT @cds-wso3app/cds-sdk: that SDK is browser-oriented
// (localStorage for the profile id, `credentials: "include"`) and expects the
// consuming app to hand it a client-credentials secret, which would put our
// M2M secret in the browser bundle. This app has a server, so the token is
// minted here and the secret never leaves it. Only ever import this from
// pages/api/* — never from a component.

const BASE_URL = process.env.CDS_BASE_URL;

// application_data namespace for this app's profile fields.
export const APP_ID = process.env.CDS_APP_ID;

// No _create: profiles are provisioned elsewhere, this app only reads/writes.
const SCOPES = "internal_cds_profile_view internal_cds_profile_update";

const REQUEST_TIMEOUT_MS = 8000;

async function request(method, path, body) {
  const token = await getToken(SCOPES);
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
    if (res.status === 401) invalidateToken(SCOPES);
    const text = await res.text().catch(() => "");
    throw new Error(`CDS ${method} ${path} -> ${res.status}: ${text}`);
  }

  const contentType = res.headers.get("Content-Type") || "";
  return contentType.includes("application/json") ? res.json() : null;
}

// ---- Raw profile access ----

// Response envelope is { pagination: { count, page_size, ... }, profiles: [] }.
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
