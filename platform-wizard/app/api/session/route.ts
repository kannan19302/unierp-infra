import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * Server-side session persistence.
 *
 * The refresh token NEVER reaches browser JavaScript — not in memory, not in
 * a variable, not passed through React state. It is written to an httpOnly
 * cookie exactly once, from this Route Handler, and every renewal happens
 * server-side. The browser only ever holds the short-lived access token,
 * which `<UniErpAuthProvider>` keeps in memory and nowhere else.
 *
 * This is a stricter posture than the shared auth-client's `TokenSet` type
 * technically requires (it allows an app to keep `refreshToken` in memory) —
 * the wizard opts into the stronger pattern because it is the first app built
 * on this stack and the one every other platform in W6 will copy.
 */

const REFRESH_COOKIE = "wizard_rt";
const ISSUER = process.env.OIDC_ISSUER || "http://localhost:3005";
const CLIENT_ID = "unierp-platform-wizard";

/** Called by the callback page once, right after the code exchange. */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = (await req.json()) as { refreshToken?: string };
  if (!body.refreshToken) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const res = NextResponse.json({ ok: true });
  setRefreshCookie(res, body.refreshToken);
  return res;
}

/**
 * Called on mount by `restoreSession`: exchanges the httpOnly refresh cookie
 * for a fresh access token, rotates the cookie to the new refresh token (the
 * IdP rotates on every use — reusing the old one after this would fail as
 * replay), and returns ONLY the access token to the browser.
 */
export async function GET(): Promise<NextResponse> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) {
    return NextResponse.json({ error: "no_session" }, { status: 401 });
  }

  const tokenRes = await fetch(new URL("/oidc/token", ISSUER), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: CLIENT_ID,
    }),
  });
  const body = await tokenRes.json();

  if (body.error) {
    const res = NextResponse.json({ error: body.error }, { status: 401 });
    clearRefreshCookie(res);
    return res;
  }

  const res = NextResponse.json({
    accessToken: body.access_token,
    idToken: body.id_token,
    expiresAt: Date.now() + body.expires_in * 1000,
    scope: body.scope,
  });
  if (body.refresh_token) setRefreshCookie(res, body.refresh_token);
  return res;
}

/** Sign-out: revokes the refresh token at the IdP and clears the cookie. */
export async function DELETE(): Promise<NextResponse> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;

  if (refreshToken) {
    await fetch(new URL("/oidc/revoke", ISSUER), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: refreshToken }),
    }).catch(() => {
      // Best-effort: the cookie is cleared regardless, and the underlying
      // session is also ended via RP-initiated logout, which the client
      // triggers separately by navigating to /oidc/end_session.
    });
  }

  const res = NextResponse.json({ ok: true });
  clearRefreshCookie(res);
  return res;
}

function setRefreshCookie(res: NextResponse, token: string): void {
  res.cookies.set(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/session",
    maxAge: 30 * 24 * 60 * 60,
  });
}

function clearRefreshCookie(res: NextResponse): void {
  res.cookies.set(REFRESH_COOKIE, "", { path: "/api/session", maxAge: 0 });
}
