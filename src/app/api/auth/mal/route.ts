import { NextRequest, NextResponse } from "next/server";
import { generateCodeVerifier } from "@/lib/auth";

/**
 * GET /api/auth/mal
 *
 * Initiates the MAL OAuth2 Authorization Code + PKCE flow.
 * 1. Generates a code_verifier and stores it in an httpOnly cookie.
 * 2. Redirects the user to MAL's authorization page.
 */
export async function GET(req: NextRequest) {
  const clientId = process.env.NEXT_PUBLIC_MAL_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "MAL client ID not configured" },
      { status: 500 }
    );
  }

  const codeVerifier = generateCodeVerifier();
  const origin = req.nextUrl.origin;
  const redirectUri = `${origin}/api/auth/callback/mal`;

  const authUrl = new URL("https://myanimelist.net/v1/oauth2/authorize");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("code_challenge", codeVerifier);
  authUrl.searchParams.set("code_challenge_method", "plain");
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", "mal");

  const response = NextResponse.redirect(authUrl.toString());

  // Store verifier in httpOnly cookie for the callback to read.
  // 10-minute expiry is plenty for the OAuth round-trip.
  response.cookies.set("mal_code_verifier", codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  return response;
}
