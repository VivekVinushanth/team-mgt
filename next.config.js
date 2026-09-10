const path = require("path");

module.exports = {
  reactStrictMode: true,

  // Next externalizes node_modules in the server build, requiring them
  // straight from disk — which bypasses resolve.alias. Transpiling this one
  // brings it into the bundle so the server-side alias below can replace it.
  transpilePackages: ["@asgardeo/auth-react"],

  webpack: (config, { isServer }) => {
    // @asgardeo/auth-react touches browser globals at import time, which
    // breaks `next build` when Next imports each page in Node. Swap it for a
    // stub in the server build; the client bundle keeps the real SDK.
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "@asgardeo/auth-react": path.resolve(__dirname, "lib/asgardeo-ssr-stub.js"),
      };
    }
    return config;
  },
};
