"use client";
import { Search, Dice5, Bell, User, X, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useCallback, useEffect } from "react";
import { useAppStore } from "@/store";
import Image from "next/image";

interface SearchResult {
  id: number;
  title: string;
  image: string;
  score?: number;
  format?: string;
  year?: number;
}

export default function Header() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const setAuthModalOpen = useAppStore((s) => s.setAuthModalOpen);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [rolling, setRolling] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleSearch = useCallback((q: string) => {
    setQuery(q);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    timeoutRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/explore?q=${encodeURIComponent(q)}&page=1`);
        const data = await res.json();
        setResults((data.results || []).slice(0, 8));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
  }, []);

  const handleRandom = useCallback(async () => {
    if (rolling) return;
    setRolling(true);
    try {
      const res = await fetch("/api/explore?page=1");
      const data = await res.json();
      const list = data.results || [];
      if (list.length > 0) {
        const pick = list[Math.floor(Math.random() * list.length)];
        router.push(`/anime/${pick.id}`);
      }
    } catch {
      /* silently fail */
    } finally {
      setRolling(false);
    }
  }, [rolling, router]);

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-40 h-14 md:h-16 bg-[#080808]/95 border-b border-white/[0.06]"
      >
        <div className="relative h-full flex items-center justify-between px-3 md:px-6 ml-0 md:ml-14">
          {/* Logo — offset for hamburger on mobile */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0 ml-9 md:ml-0">
            <Image
              src="/titlianime-logo.png"
              alt="TitliAnime"
              width={120}
              height={32}
              className="h-7 md:h-8 w-auto"
              priority
            />
          </Link>

          {/* Desktop search bar */}
          <div className="hidden md:flex items-center gap-2 flex-1 mx-6 max-w-xl">
            <div className="relative flex-1">
              <div
                className={`flex items-center gap-2 rounded-full px-4 py-2 transition-colors cursor-text ${
                  searchOpen
                    ? "bg-white/10 ring-1 ring-[#912678]/50"
                    : "bg-white/5 hover:bg-white/8"
                }`}
                onClick={() => {
                  setSearchOpen(true);
                  setTimeout(() => inputRef.current?.focus(), 50);
                }}
              >
                <Search size={15} className="text-[#555] flex-shrink-0" />
                {searchOpen ? (
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        setSearchOpen(false);
                        setQuery("");
                        setResults([]);
                      }
                      if (e.key === "Enter" && query)
                        router.push(`/explore?q=${encodeURIComponent(query)}`);
                    }}
                    placeholder="Search anime..."
                    className="bg-transparent text-sm outline-none flex-1 placeholder:text-[#555]"
                  />
                ) : (
                  <span className="text-sm text-[#555]">Search anime...</span>
                )}
                {searchOpen && query && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setQuery("");
                      setResults([]);
                      inputRef.current?.focus();
                    }}
                    className="text-[#555] hover:text-white"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {searchOpen && (results.length > 0 || searching) && (
                <div className="absolute top-full left-0 right-0 mt-2 glass-heavy rounded-xl border border-white/10 overflow-hidden z-50 fade-in">
                  {searching && (
                    <div className="px-4 py-3 text-xs text-[#555]">Searching...</div>
                  )}
                  {results.map((anime) => (
                    <Link
                      key={anime.id}
                      href={`/anime/${anime.id}`}
                      onClick={() => {
                        setSearchOpen(false);
                        setQuery("");
                        setResults([]);
                      }}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors"
                    >
                      <div className="w-8 h-10 rounded overflow-hidden flex-shrink-0 bg-white/5">
                        {anime.image && (
                          <Image
                            src={anime.image}
                            alt={anime.title}
                            width={32}
                            height={40}
                            className="w-full h-full object-cover"
                            quality={55}
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{anime.title}</div>
                        <div className="text-xs text-[#555]">
                          {anime.format?.toUpperCase()} · {anime.year}
                        </div>
                      </div>
                      {anime.score && (
                        <span className="text-xs text-[#912678] font-bold">
                          {anime.score.toFixed(1)}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleRandom}
              disabled={rolling}
              className={`p-2.5 rounded-full hover:bg-white/10 transition-colors text-[#555] hover:text-[#912678] flex-shrink-0 ${
                rolling ? "animate-spin" : ""
              }`}
              title="Random anime"
              aria-label="Random anime"
            >
              <Dice5 size={18} />
            </button>
          </div>

          {/* Right side icons */}
          <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
            {/* Mobile search icon */}
            <button
              onClick={() => {
                setSearchOpen(true);
                setTimeout(() => mobileInputRef.current?.focus(), 50);
              }}
              className="p-2 rounded-full hover:bg-white/10 transition-colors text-[#555] hover:text-white md:hidden"
              aria-label="Search"
            >
              <Search size={18} />
            </button>

            {/* Mobile random */}
            <button
              onClick={handleRandom}
              disabled={rolling}
              className={`p-2 rounded-full hover:bg-white/10 transition-colors text-[#555] hover:text-[#912678] flex-shrink-0 md:hidden ${
                rolling ? "animate-spin" : ""
              }`}
              title="Random anime"
              aria-label="Random anime"
            >
              <Dice5 size={18} />
            </button>

            <button
              className="p-2 md:p-2.5 rounded-full hover:bg-white/10 transition-colors text-[#555] hover:text-white relative"
              aria-label="Notifications"
            >
              <Bell size={18} />
              <span className="absolute top-1 right-1 md:top-1.5 md:right-1.5 w-2 h-2 rounded-full bg-[#912678]" />
            </button>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="w-7 h-7 md:w-8 md:h-8 rounded-full overflow-hidden ring-2 ring-[#912678]/50 cursor-pointer"
                  aria-label="User menu"
                >
                  <Image
                    src={user.avatar}
                    alt={user.name}
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                  />
                </button>
                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-48 glass-heavy rounded-xl border border-white/10 overflow-hidden z-50 fade-in">
                      <div className="px-4 py-3 border-b border-white/[0.06]">
                        <div className="text-sm font-semibold truncate">{user.name}</div>
                        <div className="text-xs text-[#555] capitalize">{user.provider}</div>
                      </div>
                      <button
                        onClick={() => {
                          setUser(null);
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-white/70 hover:bg-white/5 hover:text-red-400 transition-colors"
                      >
                        <LogOut size={14} />
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="p-2 md:hidden rounded-full hover:bg-white/10 transition-colors text-[#555] hover:text-white"
                aria-label="Sign In"
              >
                <User size={18} />
              </button>
            )}
            {/* Desktop sign in button */}
            {!user && (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#912678] hover:bg-[#a33089] transition-colors text-white text-sm font-semibold font-display"
              >
                <User size={14} />
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile fullscreen search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-[55] bg-[#080808]/98 md:hidden fade-in">
          <div className="p-4 pt-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 flex items-center gap-2 rounded-full px-4 py-2.5 bg-white/10 ring-1 ring-[#912678]/50">
                <Search size={16} className="text-[#555] flex-shrink-0" />
                <input
                  ref={mobileInputRef}
                  value={query}
                  onChange={(e) => handleSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setSearchOpen(false);
                      setQuery("");
                      setResults([]);
                    }
                    if (e.key === "Enter" && query)
                      router.push(`/explore?q=${encodeURIComponent(query)}`);
                  }}
                  placeholder="Search anime..."
                  className="bg-transparent text-sm outline-none flex-1 placeholder:text-[#555]"
                  autoFocus
                />
                {query && (
                  <button
                    onClick={() => { setQuery(""); setResults([]); mobileInputRef.current?.focus(); }}
                    className="text-[#555] hover:text-white"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <button
                onClick={() => { setSearchOpen(false); setQuery(""); setResults([]); }}
                className="text-sm text-[#888] hover:text-white"
              >
                Cancel
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(100dvh-80px)]">
              {searching && <div className="px-2 py-3 text-xs text-[#555]">Searching...</div>}
              {results.map((anime) => (
                <Link
                  key={anime.id}
                  href={`/anime/${anime.id}`}
                  onClick={() => { setSearchOpen(false); setQuery(""); setResults([]); }}
                  className="flex items-center gap-3 px-2 py-3 hover:bg-white/5 transition-colors rounded-lg"
                >
                  <div className="w-10 h-14 rounded overflow-hidden flex-shrink-0 bg-white/5">
                    {anime.image && (
                      <Image
                        src={anime.image}
                        alt={anime.title}
                        width={40}
                        height={56}
                        className="w-full h-full object-cover"
                        quality={55}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{anime.title}</div>
                    <div className="text-xs text-[#555]">
                      {anime.format?.toUpperCase()} · {anime.year}
                    </div>
                  </div>
                  {anime.score && (
                    <span className="text-xs text-[#912678] font-bold">{anime.score.toFixed(1)}</span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {searchOpen && (
        <div
          onClick={() => {
            setSearchOpen(false);
            setQuery("");
            setResults([]);
          }}
          className="fixed inset-0 z-30 hidden md:block"
        />
      )}
    </>
  );
}
