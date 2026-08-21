import { OidcClient, type OidcClientConfig } from "@kannan19302/shared/auth-client";

/**
 * This platform's own OIDC client registration — client id
 * "unierp-platform-wizard", seeded by data/prisma/seed-oidc-clients.ts as a
 * PUBLIC client (no secret; PKCE-only, like every browser client in this
 * system).
 */
export const oidcConfig: OidcClientConfig = {
  issuer: process.env.NEXT_PUBLIC_OIDC_ISSUER || "http://localhost:3005",
  clientId: "unierp-platform-wizard",
  redirectUri:
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:4000") +
    "/auth/callback",
  scope: ["openid", "profile", "email", "tenant", "offline_access"],
};

export function createWizardOidcClient(): OidcClient {
  return new OidcClient(oidcConfig);
}
