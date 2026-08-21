"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createWizardOidcClient } from "@/lib/oidc-config";
import { PageErrorState, PageLoadingState } from "@kannan19302/ui/shell";

/**
 * The OIDC callback. Completes the code exchange, hands the refresh token to
 * the server-side session route (never keeping it in this component's own
 * state), and resumes the request that started the flow — a deep link into
 * :4003/finance/invoices survives the whole login round trip because the
 * OidcClient stashed it before redirecting to the IdP.
 */
export default function CallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  // StrictMode double-invokes effects in dev; the authorization code is
  // single-use, so a second exchange attempt would legitimately fail and be
  // mistaken for a real error. Guard against running this twice.
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      try {
        const client = createWizardOidcClient();
        const { tokens, returnTo } = await client.handleCallback(window.location.href);

        if (tokens.refreshToken) {
          await fetch("/api/session", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ refreshToken: tokens.refreshToken }),
            credentials: "include",
          });
        }

        // A full navigation, not router.replace: the root layout's
        // <UniErpAuthProvider> needs to remount and call restoreSession
        // against the cookie that request above just set, which a client-side
        // route transition would skip since the provider is already mounted
        // with no session.
        window.location.assign(returnTo || "/");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Sign-in failed");
      }
    })();
  }, [router]);

  if (error) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <PageErrorState
          title="Sign-in failed"
          description={error}
          onRetry={() => window.location.assign("/")}
        />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <PageLoadingState message="Completing sign-in…" />
    </div>
  );
}
