import { AuthProvider } from "@asgardeo/auth-react";
import { OIDC_SCOPES } from "../lib/config";

const authConfig = {
  signInRedirectURL: process.env.NEXT_PUBLIC_ASGARDEO_SIGN_IN_REDIRECT_URL,
  signOutRedirectURL: process.env.NEXT_PUBLIC_ASGARDEO_SIGN_OUT_REDIRECT_URL,
  clientID: process.env.NEXT_PUBLIC_ASGARDEO_CLIENT_ID,
  baseUrl: process.env.NEXT_PUBLIC_ASGARDEO_BASE_URL, // e.g. https://api.asgardeo.io/t/<org>
  scope: OIDC_SCOPES,
};

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider config={authConfig}>
      <Component {...pageProps} />
    </AuthProvider>
  );
}
