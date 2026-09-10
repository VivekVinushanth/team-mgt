// Shared client-credentials token minting for the M2M app.
//
// Both the CDS profile API and SCIM2 are called with the same application's
// credentials but different scope sets, and Asgardeo issues a token scoped to
// exactly what you ask for — so tokens are cached per scope string rather
// than globally. Server-side only: the secret must never reach the browser.

const TOKEN_URL = process.env.CDS_TOKEN_URL;
const CLIENT_ID = process.env.ASGARDEO_M2M_CLIENT_ID;
const CLIENT_SECRET = process.env.ASGARDEO_M2M_CLIENT_SECRET;

const cache = new Map(); // scopes -> { token, exp }

export async function getToken(scopes) {
  const hit = cache.get(scopes);
  if (hit && Date.now() < hit.exp - 30_000) return hit.token;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      scope: scopes,
    }),
  });

  if (!res.ok) throw new Error(`Token fetch failed: ${res.status}`);

  const data = await res.json();

  // Asgardeo returns 200 with a token even when it granted none of the
  // scopes you asked for — the downstream API then 403s with a message that
  // says nothing about scopes. Fail here instead, where the cause is obvious.
  const granted = (data.scope || "").split(" ").filter(Boolean);
  const missing = scopes.split(" ").filter((s) => !granted.includes(s));
  if (missing.length) {
    throw new Error(
      `M2M app is not authorized for: ${missing.join(", ")} — ` +
        `authorize these on the application in the Asgardeo console`
    );
  }

  cache.set(scopes, { token: data.access_token, exp: Date.now() + data.expires_in * 1000 });
  return data.access_token;
}

// Called when an API rejects a token we believed was valid (rotated secret,
// revoked scope) so the next call re-mints instead of replaying a dead token.
export function invalidateToken(scopes) {
  cache.delete(scopes);
}
