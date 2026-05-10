"use client";
import { X, LogIn } from "lucide-react";
import { useEffect } from "react";
import { useAppStore } from "@/store";

/**
 * AuthModal — Sign-in modal with MAL and AniList OAuth buttons.
 *
 * MAL:     Navigates to /api/auth/mal which handles PKCE + redirect to MAL.
 * AniList: Navigates directly to AniList implicit grant URL.
 *
 * Both flows redirect back to /auth/callback after authorization.
 */
export default function AuthModal() {
  const open = useAppStore((s) => s.authModalOpen);
  const setOpen = useAppStore((s) => s.setAuthModalOpen);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  if (!open) return null;

  // AniList OAuth URL — needs NEXT_PUBLIC_ANILIST_CLIENT_ID in .env.local
  const anilistClientId = process.env.NEXT_PUBLIC_ANILIST_CLIENT_ID || "";
  const anilistRedirect = typeof window !== "undefined"
    ? `${window.location.origin}/auth/callback`
    : "";
  const anilistUrl = anilistClientId
    ? `https://anilist.co/api/v2/oauth/authorize?client_id=${anilistClientId}&response_type=token`
    : "";

  return (
    <>
      <div
        onClick={() => setOpen(false)}
        className="fixed inset-0 z-[100] bg-black/70 fade-in"
      />
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
        <div className="glass-heavy rounded-xl w-full max-w-sm p-6 pointer-events-auto border border-white/10 fade-in">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold font-display">Sign In</h2>
              <p className="text-sm text-[#888] mt-0.5">Sync your progress &amp; list</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-[#555] hover:text-white"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          <div className="space-y-3">
            {/* MAL — navigates to our server route which handles PKCE */}
            <a
              href="/api/auth/mal"
              className="flex items-center gap-4 p-4 rounded-lg border border-white/10 hover:border-[#2e51a2]/60 hover:bg-[#2e51a2]/10 transition-all group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg bg-[#2e51a2] flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm font-display">MAL</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">MyAnimeList</div>
                <div className="text-xs text-[#888]">Connect your MAL account</div>
              </div>
              <LogIn size={14} className="text-[#555] group-hover:text-[#2e51a2]" />
            </a>

            {/* AniList — implicit grant, redirects directly to AniList */}
            {anilistUrl ? (
              <a
                href={anilistUrl}
                className="flex items-center gap-4 p-4 rounded-lg border border-white/10 hover:border-[#02a9ff]/60 hover:bg-[#02a9ff]/10 transition-all group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#02a9ff] to-[#0047ff] flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm font-display">AL</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">AniList</div>
                  <div className="text-xs text-[#888]">Connect your AniList account</div>
                </div>
                <LogIn size={14} className="text-[#555] group-hover:text-[#02a9ff]" />
              </a>
            ) : (
              <div className="flex items-center gap-4 p-4 rounded-lg border border-white/10 opacity-50 cursor-not-allowed">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#02a9ff] to-[#0047ff] flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm font-display">AL</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">AniList</div>
                  <div className="text-xs text-[#888]">Coming soon</div>
                </div>
              </div>
            )}
          </div>

          <p className="text-xs text-[#555] text-center mt-5">
            Your watch history is saved locally even without signing in.
          </p>
        </div>
      </div>
    </>
  );
}
