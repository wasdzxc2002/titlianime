"use client";
import { useEffect, useRef } from "react";
import { LogIn } from "lucide-react";
import type { WalineInstance } from "@waline/client";
import "@waline/client/style";
import { useAppStore } from "@/store";

interface WalineProps {
  path: string;
}

const WALINE_SERVER =
  process.env.NEXT_PUBLIC_WALINE_SERVER_URL ||
  "https://waline-anime.netlify.app/.netlify/functions/comment";

export default function WalineComments({ path }: WalineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<WalineInstance | null>(null);
  const user = useAppStore((s) => s.user);
  const setAuthModalOpen = useAppStore((s) => s.setAuthModalOpen);

  useEffect(() => {
    if (!containerRef.current || !user) return;

    const nick = user.name.length < 3 ? user.name.padEnd(3, "_") : user.name;
    const mail = `${user.id}@${user.provider}.titlianime.app`;

    try {
      localStorage.setItem("WALINE_NICK", nick);
      localStorage.setItem("WALINE_MAIL", mail);
      localStorage.setItem("WALINE_LINK", "");
    } catch { /* localStorage blocked */ }

    let cancelled = false;

    import("@waline/client").then(({ init }) => {
      if (cancelled || !containerRef.current) return;
      instanceRef.current?.destroy();
      instanceRef.current = init({
        el: containerRef.current,
        serverURL: WALINE_SERVER,
        path,
        dark: true,
        lang: "en",
        emoji: ["//unpkg.com/@waline/emojis@1.2.0/weibo"],
        imageUploader: false,
        login: "disable",
        locale: {
          placeholder: "Share your thoughts...",
        },
        meta: ["nick", "mail"],
        requiredMeta: ["nick"],
      });

      const fillInputs = () => {
        if (cancelled || !containerRef.current) return;
        const inputs = containerRef.current.querySelectorAll<HTMLInputElement>(".wl-header input");
        inputs.forEach((input) => {
          const key = input.name || input.getAttribute("data-key") || "";
          if (key === "nick" || input.placeholder?.toLowerCase().includes("nick")) {
            input.value = nick;
            input.dispatchEvent(new Event("input", { bubbles: true }));
          } else if (key === "mail" || input.placeholder?.toLowerCase().includes("mail")) {
            input.value = mail;
            input.dispatchEvent(new Event("input", { bubbles: true }));
          }
        });
      };
      setTimeout(fillInputs, 500);
      setTimeout(fillInputs, 1500);

      // Replace Gravatar avatars with the user's real avatar on their comments
      if (user.avatar) {
        const swapAvatars = () => {
          if (cancelled || !containerRef.current) return;
          containerRef.current.querySelectorAll<HTMLElement>(".wl-card-item, .wl-comment").forEach((card) => {
            const nickEl = card.querySelector(".wl-nick");
            if (!nickEl || nickEl.textContent?.trim() !== nick) return;
            const img = card.querySelector<HTMLImageElement>(".wl-user-avatar, .wl-avatar img");
            if (img && img.src !== user.avatar) img.src = user.avatar!;
          });
        };

        const observer = new MutationObserver(swapAvatars);
        observer.observe(containerRef.current, { childList: true, subtree: true });
        setTimeout(swapAvatars, 1000);
        setTimeout(swapAvatars, 3000);

        (containerRef.current as unknown as Record<string, MutationObserver>).__walineObserver = observer;
      }
    });

    return () => {
      cancelled = true;
      instanceRef.current?.destroy();
      instanceRef.current = null;
      const obs = (containerRef.current as unknown as Record<string, MutationObserver>)?.__walineObserver;
      if (obs) obs.disconnect();
    };
  }, [path, user]);

  if (!user) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <p className="text-sm text-[#888]">Sign in to join the discussion</p>
        <button
          onClick={() => setAuthModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#912678] hover:bg-[#a33089] transition-colors text-white text-sm font-semibold font-display"
        >
          <LogIn size={14} />
          Sign In to Comment
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/[0.06]">
        {user.avatar && (
          <img
            src={user.avatar}
            alt={user.name}
            className="w-7 h-7 rounded-full ring-1 ring-white/10"
          />
        )}
        <span className="text-xs text-[#888]">
          Commenting as <span className="text-white font-semibold">{user.name}</span>
        </span>
      </div>
      <div ref={containerRef} className="waline-container" />
    </div>
  );
}
