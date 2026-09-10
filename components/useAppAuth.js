import { useAuthContext } from "@asgardeo/auth-react";
import { useEffect, useState } from "react";
import { rolesFromClaims, ALLOWED_EMAIL_DOMAIN } from "../lib/config";

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
      setClaims({
        email,
        name: payload.name || email,
        roles: rolesFromClaims(payload),
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
