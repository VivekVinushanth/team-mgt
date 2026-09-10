import { jwtVerify, createRemoteJWKSet } from "jose";
import { ALLOWED_EMAIL_DOMAIN, rolesFromClaims } from "./config";

// Asgardeo issuer, e.g. https://api.asgardeo.io/t/<org>/oauth2/token
// This exact value is what Asgardeo puts in the token's `iss` claim.
const ISSUER = process.env.ASGARDEO_ISSUER;

// JWKS hangs off the org base, NOT off the issuer — the issuer already ends
// in /oauth2/token, so appending to it would double the path segment.
const JWKS = createRemoteJWKSet(
  new URL(`${ISSUER.replace(/\/oauth2\/token\/?$/, "")}/oauth2/jwks`)
);

/**
 * Verifies the ID token the client sends on every API call (Authorization:
 * Bearer <id_token>). We use the ID token rather than the access token
 * because it reliably carries the email + groups claims from Asgardeo.
 *
 * Throws on any failure — expired/invalid signature, wrong issuer, or an
 * email outside the allowed domain. Callers should catch and respond 401/403.
 */
export async function verifyRequest(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    const err = new Error("Missing bearer token");
    err.status = 401;
    throw err;
  }

  const { payload } = await jwtVerify(token, JWKS, { issuer: ISSUER });

  const email = payload.email || payload.username || "";
  if (!email.toLowerCase().endsWith(`@${ALLOWED_EMAIL_DOMAIN}`)) {
    const err = new Error(`Access restricted to @${ALLOWED_EMAIL_DOMAIN} accounts`);
    err.status = 403;
    throw err;
  }

  return {
    email,
    name: payload.name || payload.given_name || email,
    roles: rolesFromClaims(payload),
  };
}
