import { useAuthContext } from "@asgardeo/auth-react";
import { useEffect, useState } from "react";
import { ASGARDEO_GROUP_TO_ROLE, ALLOWED_EMAIL_DOMAIN } from "../lib/config";

export function useAppAuth() {
  const { state, signIn, signOut, getIDToken } = useAuthContext();
  const [claims, setClaims] = useState(null);
  const [idToken, setIdToken] = useState(null);

  useEffect(() => {
    if (!state.isAuthenticated) {
      setClaims(null);
      setIdToken(null);
      return;
    }
    getIDToken().then((token) => {
      setIdToken(token);
      // Decode payload for display purposes only — this is NOT a security
      // check. The real enforcement happens server-side in lib/auth-server.js,
      // which re-verifies the token's signature on every API call.
      const payload = JSON.parse(atob(token.split(".")[1]));
      const email = payload.email || payload.username || "";
      const rawGroups = payload.groups
        ? Array.isArray(payload.groups) ? payload.groups : [payload.groups]
        : [];
      setClaims({
        email,
        name: payload.name || email,
        roles: rawGroups.map((g) => ASGARDEO_GROUP_TO_ROLE[g]).filter(Boolean),
        allowedDomain: email.toLowerCase().endsWith(`@${ALLOWED_EMAIL_DOMAIN}`),
      });
    });
  }, [state.isAuthenticated]);

  async function authFetch(url, options = {}) {
    const token = idToken || (await getIDToken());
    return fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return {
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    claims,
    signIn,
    signOut,
    authFetch,
  };
}
