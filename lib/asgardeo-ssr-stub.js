// Server-side stand-in for @asgardeo/auth-react.
//
// The real SDK is browser-only: it reads the bare global `origin` at module
// load, which does not exist in Node, so importing it while Next collects
// page data kills the production build. next.config.js aliases the package to
// this file in the server build only; the browser bundle still gets the real
// SDK.
//
// Prerendered HTML therefore shows the signed-out state, which is what these
// pages render before hydration anyway — the client takes over and the real
// provider supplies the actual auth state.

export function AuthProvider({ children }) {
  return children;
}

export function useAuthContext() {
  return {
    state: { isAuthenticated: false, isLoading: true },
    signIn: () => {},
    signOut: () => {},
    getIDToken: async () => null,
  };
}
