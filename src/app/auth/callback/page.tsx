"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store";
import { getAniListViewer } from "@/lib/auth";

/**
 * /auth/callback
 *
 * Client-side callback page for both MAL and AniList OAuth.
 *
 * MAL:     Server callback redirects here with user data in the URL hash.
 * AniList: Implicit grant redirects here with access_token in the URL hash.
 *
 * Reads the hash, calls setUser(), and redirects to home.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const setUser = useAppStore((s) => s.setUser);
  const setAuthModalOpen = useAppStore((s) => s.setAuthModalOpen);
  const [status, setStatus] = useState("Signing you in...");

  useEffect(() => {
    async function processCallback() {
      try {
        const hash = window.location.hash.slice(1); // remove the leading #
        if (!hash) {
          setStatus("No auth data received.");
          setTimeout(() => router.replace("/"), 2000);
          return;
        }

        const params = new URLSearchParams(hash);

        // Check if this is a MAL callback (server already fetched user data)
        const provider = params.get("provider");

        if (provider === "mal") {
          const token = params.get("token");
          const id = params.get("id");
          const name = params.get("name");
          const avatar = params.get("avatar");

          if (!token || !id || !name) {
            throw new Error("Incomplete MAL auth data");
          }

          setUser({
            id,
            name,
            avatar: avatar || "/placeholder.jpg",
            provider: "mal",
            accessToken: token,
          });

          setStatus(`Welcome, ${name}!`);
          setAuthModalOpen(false);
          setTimeout(() => router.replace("/"), 800);
          return;
        }

        // AniList implicit grant: hash contains access_token directly
        const accessToken = params.get("access_token");
        if (accessToken) {
          setStatus("Fetching your AniList profile...");

          const viewer = await getAniListViewer(accessToken);

          setUser({
            id: String(viewer.id),
            name: viewer.name,
            avatar: viewer.avatar?.large || viewer.avatar?.medium || "/placeholder.jpg",
            provider: "anilist",
            accessToken,
          });

          setStatus(`Welcome, ${viewer.name}!`);
          setAuthModalOpen(false);
          setTimeout(() => router.replace("/"), 800);
          return;
        }

        // Unknown callback format
        setStatus("Unrecognized auth response.");
        setTimeout(() => router.replace("/"), 2000);
      } catch (err) {
        console.error("Auth callback error:", err);
        setStatus("Sign in failed. Redirecting...");
        setTimeout(() => router.replace("/"), 2000);
      }
    }

    processCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-dvh flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#912678] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white/70 text-sm font-display">{status}</p>
      </div>
    </div>
  );
}
