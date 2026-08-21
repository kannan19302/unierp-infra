/** @type {import('next').NextConfig} */
// UniERP Global Platform Wizard — P0, the SSO landing page every platform
// sends a logged-out user to and every session ends back at. Real relying
// party on the OIDC provider in idp; it makes no authentication decisions
// itself, only renders what idp's /auth/platforms says this session may enter.
// NEXT_PUBLIC_OIDC_ISSUER must be a URL the user's BROWSER can reach, which in
// Docker compose is the host port mapping (localhost:3005), never the
// container-internal service name (idp:3005) that OIDC_ISSUER/IDP_URL resolve
// to for server-to-server calls. Deriving one from the other would bake the
// container-internal address into the client bundle at build time.

const nextConfig = {
  reactStrictMode: true,

  experimental: {
    optimizePackageImports: ['lucide-react'],
  },

  webpack: (config, { dev }) => {
    // pnpm-linked local packages (@kannan19302/shared, @kannan19302/ui in
    // dev) resolve through a symlink whose REAL path sits outside
    // node_modules entirely. Webpack's default loader exclusion
    // (`exclude: /node_modules/`) matches against that resolved real path, so
    // a linked package's compiled CommonJS output gets run through Next's
    // dev-mode react-refresh transform meant for first-party app source —
    // which then fails to parse ("Cannot use 'import.meta' outside a
    // module") because it's plain CJS, not something the refresh transform
    // was ever meant to touch. Disabling symlink resolution makes webpack
    // treat a linked package exactly like an npm-installed one for this
    // purpose. Harmless in production, where these are real npm installs
    // with no symlink involved at all.
    config.resolve.symlinks = false;

    if (dev) {
      config.watchOptions = {
        ...(config.watchOptions || {}),
        poll: 1000,
        aggregateTimeout: 300,
        ignored: /node_modules/,
      };
    }
    return config;
  },

  env: {
    NEXT_PUBLIC_OIDC_ISSUER:
      process.env.NEXT_PUBLIC_OIDC_ISSUER || 'http://localhost:3005',
  },
};

module.exports = nextConfig;
