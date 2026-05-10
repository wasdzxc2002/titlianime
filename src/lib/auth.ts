/**
 * Auth utilities for MAL and AniList OAuth flows.
 *
 * MAL  → Authorization Code + PKCE (plain method)
 * AniList → Implicit Grant (token in URL hash)
 */

/* ---------- PKCE helpers (server-side) ---------- */

/**
 * Generate a PKCE code_verifier (43-128 URL-safe chars).
 * MAL supports `code_challenge_method=plain`, so the challenge === verifier.
 */
export function generateCodeVerifier(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const bytes = new Uint8Array(128);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

/* ---------- MAL token exchange ---------- */

interface MALTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
}

export async function exchangeMALCode(
  code: string,
  codeVerifier: string,
  redirectUri: string
): Promise<MALTokenResponse> {
  const clientId = process.env.NEXT_PUBLIC_MAL_CLIENT_ID || "";
  const clientSecret = process.env.MAL_CLIENT_SECRET || "";

  const params: Record<string, string> = {
    client_id: clientId,
    grant_type: "authorization_code",
    code,
    code_verifier: codeVerifier,
    redirect_uri: redirectUri,
  };

  // MAL "web" app types require a client_secret for token exchange
  if (clientSecret) {
    params.client_secret = clientSecret;
  }

  const body = new URLSearchParams(params);

  const res = await fetch("https://myanimelist.net/v1/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`MAL token exchange failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<MALTokenResponse>;
}

/* ---------- MAL user profile ---------- */

interface MALUser {
  id: number;
  name: string;
  picture?: string;
}

export async function getMALUser(accessToken: string): Promise<MALUser> {
  const res = await fetch(
    "https://api.myanimelist.net/v2/users/@me?fields=id,name,picture",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) {
    throw new Error(`MAL user fetch failed (${res.status})`);
  }

  return res.json() as Promise<MALUser>;
}

/* ---------- AniList user profile (called from client) ---------- */

interface AniListViewer {
  id: number;
  name: string;
  avatar: { large?: string; medium?: string };
}

export async function getAniListViewer(
  accessToken: string
): Promise<AniListViewer> {
  const res = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      query: `query { Viewer { id name avatar { large medium } } }`,
    }),
  });

  if (!res.ok) {
    throw new Error(`AniList viewer fetch failed (${res.status})`);
  }

  const json = (await res.json()) as {
    data?: { Viewer: AniListViewer };
    errors?: unknown[];
  };
  if (json.errors || !json.data?.Viewer) {
    throw new Error("AniList viewer query error");
  }

  return json.data.Viewer;
}
