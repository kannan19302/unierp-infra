"use client";

import { UniErpAuthProvider, type TokenSet } from "@kannan19302/shared/auth-client/react";
import { ThemeProvider } from "@kannan19302/ui/theme";
import { oidcConfig } from "@/lib/oidc-config";
import "./globals.css";

/**
 * Applies the persisted theme before the first paint.
 *
 * ThemeProvider can only read localStorage from an effect, which is one painted
 * frame too late: a dark-theme user would get a white flash on every load. This
 * runs synchronously in <body>, sets the same attribute from the same storage
 * keys, and ThemeProvider then takes over without changing anything.
 */
const NO_FLASH_SCRIPT = `(function(){try{
var s=localStorage.getItem('unerp.theme');
var t=(!s||s==='system')?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):s;
document.documentElement.setAttribute('data-theme',t);
var d=localStorage.getItem('unerp.density');
if(d)document.documentElement.setAttribute('data-density',d);
}catch(e){}})()`;

/**
 * `restoreSession` recovers a session on mount without a full-page redirect:
 * it calls the wizard's own Route Handler, which holds the refresh token in
 * an httpOnly cookie this component never sees, and gets back only a fresh
 * access token. A page reload therefore re-authenticates silently rather than
 * either losing the session (no persistence at all) or re-exposing a
 * long-lived credential to JavaScript (the localStorage pattern this whole
 * stack was built to retire).
 */
async function restoreSession(): Promise<TokenSet | null> {
  const res = await fetch("/api/session", { credentials: "include" });
  if (!res.ok) return null;
  const body = await res.json();
  return {
    accessToken: body.accessToken,
    idToken: body.idToken,
    expiresAt: body.expiresAt,
    scope: body.scope,
    // Deliberately no refreshToken here — it never leaves the server. The
    // provider's scheduled refresh calls this same restoreSession function
    // again rather than calling client.refresh() with a token it doesn't have.
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: the script below deliberately mutates
    // data-theme before React hydrates, so the server's attribute differs.
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_SCRIPT }} />
        {/* "system" rather than "light": the wizard is the first screen of every
            session, so following the OS preference on a cold visit is the least
            surprising default. The toggle persists an explicit override. */}
        <ThemeProvider defaultSetting="system">
          <UniErpAuthProvider
            config={oidcConfig}
            restoreSession={restoreSession}
            defaultPostLogoutRedirectUri="http://localhost:4000/"
          >
            {children}
          </UniErpAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
