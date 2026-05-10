import { NextRequest, NextResponse } from "next/server";
import { exchangeMALCode, getMALUser } from "@/lib/auth";

/**
 * GET /api/auth/callback/mal
 *
 * MAL redirects here after the user authorizes.
 * 1. Reads the `code` from query params.
 * 2. Reads the `code_verifier` from the httpOnly cookie.
 * 3. Exchanges code + verifier for an access_token.
 * 4. Fetches the user's profile.
 * 5. Redirects to /auth/callback with user data in the URL hash
 *    (hash is never sent to the server — keeps token off server logs).
 */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const codeVerifier = req.cookies.get("mal_code_verifier")?.value;

  if (!code || !codeVerifier) {
    return NextResponse.redirect(
      new URL("/?auth_error=missing_code", req.nextUrl.origin)
    );
  }

  const origin = req.nextUrl.origin;
  const redirectUri = `${origin}/api/auth/callback/mal`;

  try {
    // Exchange auth code for access token
    const tokenData = await exchangeMALCode(code, codeVerifier, redirectUri);

    // Fetch user profile
    const malUser = await getMALUser(tokenData.access_token);

    // Build the client callback URL with data in the hash fragment.
    // Encoding each value to handle special characters in usernames/URLs.
    const params = new URLSearchParams({
      provider: "mal",
      token: tokenData.access_token,
      id: String(malUser.id),
      name: malUser.name,
      avatar: malUser.picture || "",
    });

    const callbackUrl = new URL(`/auth/callback`, origin);
    // Append as hash — never sent to server, safe from logs
    const finalUrl = `${callbackUrl.toString()}#${params.toString()}`;

    const response = NextResponse.redirect(finalUrl);

    // Clear the code_verifier cookie — no longer needed
    response.cookies.set("mal_code_verifier", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (err) {
    console.error("MAL auth callback error:", err);
    return NextResponse.redirect(
      new URL("/?auth_error=token_exchange_failed", req.nextUrl.origin)
    );
  }
}
