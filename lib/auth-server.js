import { jwtVerify, createRemoteJWKSet } from "jose";
import { ALLOWED_EMAIL_DOMAIN, ASGARDEO_GROUP_TO_ROLE } from "./config";

// Asgardeo issuer, e.g. https://api.asgardeo.io/t/<org>/oauth2/token
const ISSUER = process.env.ASGARDEO_ISSUER;
const JWKS = createRemoteJWKSet(new URL(`${ISSUER}/oauth2/jwks`));

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

  const rawGroups = payload.groups
    ? (Array.isArray(payload.groups) ? payload.groups : [payload.groups])
    : [];
  const roles = rawGroups.map((g) => ASGARDEO_GROUP_TO_ROLE[g]).filter(Boolean);

  return {
    email,
    name: payload.name || payload.given_name || email,
    roles,
  };
}
