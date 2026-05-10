"use client";
import { Home, Compass, CalendarDays, History, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/explore", icon: Compass, label: "Explore" },
  { href: "/schedule", icon: CalendarDays, label: "Schedule" },
  { href: "/history", icon: History, label: "History" },
];

export default function FloatingSidebar() {
  const pathname = usePathname();
  const [hovered, setHovered] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [mobileOpen]);

  if (pathname.startsWith("/watch")) return null;

  return (
    <>
      {/* Mobile hamburger button — vertically centered in the h-14 header */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-3.5 left-3 z-50 p-1.5 md:hidden"
        aria-label="Open menu"
      >
        <Menu size={20} className="text-white/70" />
      </button>

      {/* Mobile overlay + drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div
            className="absolute inset-0 bg-black/70 fade-in"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-56 glass-heavy border-r border-white/8 fade-in flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
              <span className="text-sm font-bold font-display text-white/80">Menu</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-[#555] hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
                const active = pathname === href || (href !== "/" && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                      active ? "text-white bg-[var(--color-accent-dim)]" : "text-[#888] hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon
                      size={18}
                      className={active ? "text-[#912678]" : ""}
                      strokeWidth={active ? 2.5 : 1.75}
                    />
                    <span className="text-sm font-medium font-display">{label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Desktop floating sidebar */}
      <nav
        className="fixed left-4 top-1/2 z-50 -translate-y-1/2 hidden md:block"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div
          className="glass-heavy rounded-xl flex flex-col gap-1 p-2 overflow-hidden transition-[width] duration-200 ease-out"
          style={{ width: hovered ? 140 : 48 }}
        >
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                className={`flex items-center gap-3 rounded-lg py-2.5 cursor-pointer transition-colors relative overflow-hidden ${
                  active ? "text-white bg-[var(--color-accent-dim)]" : "text-[#555] hover:text-white"
                }`}
              >
                <div className="w-8 flex items-center justify-center flex-shrink-0">
                  <Icon
                    size={18}
                    className={active ? "text-[#912678]" : ""}
                    strokeWidth={active ? 2.5 : 1.75}
                  />
                </div>
                {hovered && (
                  <span className="text-xs font-medium whitespace-nowrap font-display">
                    {label}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
