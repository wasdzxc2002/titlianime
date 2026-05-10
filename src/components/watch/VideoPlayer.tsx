"use client";

declare const ManagedMediaSource: typeof MediaSource | undefined;

import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";

// Mobile browsers' MSE implementations reject codecs that the device can
// decode natively. Common offenders: mp4a.40.1 (AAC Main), mp4a.40.5
// (HE-AAC/SBR), mp4a.40.29 (HE-AACv2/PS). Rewriting all of these to
// mp4a.40.2 (AAC-LC) at the MSE boundary is the standard workaround —
// the decoded audio bytes are fine, only the advertised codec string is
// wrong.
let mediaSourcePatched = false;
function patchMediaSourceCodecs() {
  if (mediaSourcePatched) return;
  const MSE =
    typeof MediaSource !== "undefined"
      ? MediaSource
      : typeof ManagedMediaSource !== "undefined"
        ? ManagedMediaSource
        : null;
  if (!MSE) return;
  const orig = MSE.prototype.addSourceBuffer;
  MSE.prototype.addSourceBuffer = function (type: string) {
    if (typeof type === "string" && /mp4a\.40\.(?:1|5|29)\b/.test(type)) {
      const rewritten = type.replace(/mp4a\.40\.(?:1|5|29)\b/g, "mp4a.40.2");
      // eslint-disable-next-line no-console
      console.info("[mse-patch] rewriting codec:", type, "→", rewritten);
      type = rewritten;
    }
    return orig.call(this, type);
  };
  mediaSourcePatched = true;
}
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  SkipBack, SkipForward, Settings, Loader2
} from "lucide-react";
import { formatTime } from "@/lib/utils";

interface Source {
  url: string;
  quality: string;
  isM3U8: boolean;
}

interface Subtitle {
  url: string;
  lang: string;
}

interface VideoPlayerProps {
  sources: Source[];
  subtitles?: Subtitle[];
  title: string;
  episodeNum: number;
  onProgress?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
  autoPlay?: boolean;
}

export default function VideoPlayer({
  sources,
  subtitles = [],
  title,
  episodeNum,
  onProgress,
  onEnded,
  autoPlay = true,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const progressCallbackRef = useRef(onProgress);
  progressCallbackRef.current = onProgress;

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [loading, setLoading] = useState(true);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [quality, setQuality] = useState<string>("auto");
  const [showQuality, setShowQuality] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const bestSource = sources.find((s) => s.isM3U8) || sources[0];
  const sourceUrl = bestSource?.url;
  const sourceIsM3U8 = bestSource?.isM3U8 ?? false;

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (playing) setShowControls(false);
    }, 3000);
  }, [playing]);

  // Init HLS
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !sourceUrl) return;

    setLoading(true);
    setPlayerError(null);

    const dev = process.env.NODE_ENV !== "production";

    if (sourceIsM3U8 && video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native HLS — preferred over hls.js because it bypasses MSE entirely.
      // The device's native decoder handles all codecs it supports, avoiding
      // bufferAddCodecError from MSE's stricter codec allowlist (especially
      // on mobile). Works on Safari (all platforms) and some Android browsers.
      video.src = sourceUrl;
      const onMeta = () => {
        setLoading(false);
        if (autoPlay) video.play().catch(() => setLoading(false));
      };
      video.addEventListener("loadedmetadata", onMeta);
      const onError = () => {
        setLoading(false);
        setPlayerError("Native HLS playback failed — check console");
      };
      video.addEventListener("error", onError);
      return () => {
        video.removeEventListener("loadedmetadata", onMeta);
        video.removeEventListener("error", onError);
      };
    } else if (sourceIsM3U8 && Hls.isSupported()) {
      patchMediaSourceCodecs();
      const hls = new Hls({
        maxBufferLength: 10,
        maxMaxBufferLength: 30,
        debug: dev,
        xhrSetup: (xhr) => {
          xhr.withCredentials = false;
        },
        enableWebVTT: false,
        enableIMSC1: false,
        enableCEA708Captions: false,
        renderTextTracksNatively: false,
      });
      hlsRef.current = hls;

      hls.attachMedia(video);
      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        hls.loadSource(sourceUrl);
      });

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);
        if (autoPlay) video.play().catch(() => setLoading(false));
      });

      let codecRetries = 0;

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (dev) {
          const dump: Record<string, unknown> = {};
          for (const k of Object.keys(data) as Array<keyof typeof data>) {
            dump[k as string] = data[k];
          }
          if (data.error) dump.errorMessage = (data.error as Error).message;
          console.warn("[hls.js error]", dump);
        }
        if (!data.fatal) return;
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            if (dev) console.warn("[hls.js] fatal NETWORK error, restarting load");
            hls.startLoad();
            return;
          case Hls.ErrorTypes.MEDIA_ERROR: {
            const codecRelated =
              data.details === Hls.ErrorDetails.BUFFER_ADD_CODEC_ERROR ||
              data.details === Hls.ErrorDetails.BUFFER_INCOMPATIBLE_CODECS_ERROR;
            if (codecRelated || codecRetries >= 1) {
              setLoading(false);
              setPlayerError(
                `${data.details}${data.error ? ` — ${(data.error as Error).message}` : ""}`
              );
              return;
            }
            codecRetries += 1;
            if (dev) console.warn("[hls.js] fatal MEDIA error, recoverMediaError");
            hls.recoverMediaError();
            return;
          }
          default:
            setLoading(false);
            setPlayerError(
              `${data.details || data.type}${data.response ? ` (HTTP ${data.response.code})` : ""}`
            );
            return;
        }
      });

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    } else {
      // Plain MP4 fallback
      video.src = sourceUrl;
      setLoading(false);
      if (autoPlay) video.play().catch(() => setLoading(false));
    }
  }, [sourceUrl, sourceIsM3U8, autoPlay]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1));
      }
      progressCallbackRef.current?.(video.currentTime, video.duration);
    };
    const onDurationChange = () => setDuration(video.duration);
    const onWaiting = () => setLoading(true);
    const onPlaying = () => setLoading(false);
    const onEnded = () => { setPlaying(false); onEnded?.(); };
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("durationchange", onDurationChange);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("ended", onEnded);
    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("durationchange", onDurationChange);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("ended", onEnded);
    };
  }, [onEnded]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  };

  const seek = (t: number) => {
    if (videoRef.current) videoRef.current.currentTime = t;
  };

  const skip = (s: number) => {
    if (videoRef.current) videoRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + s));
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !muted;
    setMuted(!muted);
  };

  const changeVolume = (v: number) => {
    if (!videoRef.current) return;
    videoRef.current.volume = v;
    setVolume(v);
    setMuted(v === 0);
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
      setFullscreen(true);
    } else {
      await document.exitFullscreen();
      setFullscreen(false);
    }
  };

  // Document-level keyboard shortcuts. Work even before the user clicks
  // the player, but skip when typing in inputs (search, comments, etc.).
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          return;
        case "ArrowLeft":
          e.preventDefault();
          skip(-5);
          return;
        case "ArrowRight":
          e.preventDefault();
          skip(5);
          return;
        case "m":
          e.preventDefault();
          toggleMute();
          return;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          return;
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
    // togglePlay/skip/toggleMute/toggleFullscreen close over current state
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [muted, currentTime, duration]);

  // Dedupe quality list — sources can advertise multiple URLs at the same
  // quality (different CDN mirrors) which produces duplicate React keys.
  const qualityOptions = ["auto", ...Array.from(new Set(sources.map((s) => s.quality)))];

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufPct = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-black aspect-video overflow-hidden group"
      onMouseMove={resetControlsTimer}
      onMouseLeave={() => playing && setShowControls(false)}
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        className="w-full h-full"
        playsInline
        preload="metadata"
        crossOrigin="anonymous"
      >
        {subtitles.map((s, i) => (
          <track
            key={s.url}
            kind="subtitles"
            src={s.url}
            srcLang={s.lang.slice(0, 2).toLowerCase()}
            label={s.lang}
            default={i === 0}
          />
        ))}
      </video>

      {/* Loading spinner */}
      {loading && !playerError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
          <Loader2 size={40} className="text-[#912678] animate-spin" />
        </div>
      )}

      {/* Player error overlay — surfaces hls.js fatal errors instead of silent black */}
      {playerError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 pointer-events-none px-6">
          <div className="text-center">
            <p className="text-red-400 text-sm font-mono mb-2">{playerError}</p>
            <p className="text-white/40 text-xs">Open DevTools console for the full hls.js error.</p>
          </div>
        </div>
      )}

      {/* Controls overlay — pointer-events-none so the empty middle area
          lets clicks fall through to the container's togglePlay handler.
          Individual control surfaces below re-enable pointer events. */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 pointer-events-none ${showControls ? "opacity-100" : "opacity-0"}`}
      >
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 px-4 pt-4 pb-12 bg-gradient-to-b from-black/80 to-transparent pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-sm font-semibold text-white/90 font-display">
            {title} <span className="text-[#912678]">· Ep {episodeNum}</span>
          </p>
        </div>

        {/* Center play/pause indicator — never eats clicks */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {!playing && !loading && (
            <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center">
              <Play size={24} fill="white" className="ml-1 text-white" />
            </div>
          )}
        </div>

        {/* Bottom controls */}
        <div
          className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-12 bg-gradient-to-t from-black/90 to-transparent pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Progress bar */}
          <div className="relative h-1 bg-white/20 rounded-full mb-3 cursor-pointer group/progress"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              seek(((e.clientX - rect.left) / rect.width) * duration);
            }}
          >
            {/* Buffered */}
            <div className="absolute h-full bg-white/30 rounded-full" style={{ width: `${bufPct}%` }} />
            {/* Played */}
            <div className="absolute h-full bg-[#912678] rounded-full" style={{ width: `${pct}%` }} />
            {/* Thumb */}
            <div
              className="absolute w-3 h-3 bg-white rounded-full -top-1 opacity-0 group-hover/progress:opacity-100 transition-opacity"
              style={{ left: `${pct}%`, transform: "translateX(-50%)" }}
            />
          </div>

          {/* Controls row */}
          <div className="flex items-center gap-3">
            <button onClick={togglePlay} className="text-white hover:text-[#912678] transition-colors">
              {playing ? <Pause size={20} /> : <Play size={20} fill="currentColor" />}
            </button>
            <button onClick={() => skip(-10)} className="text-white/70 hover:text-white transition-colors">
              <SkipBack size={18} />
            </button>
            <button onClick={() => skip(10)} className="text-white/70 hover:text-white transition-colors">
              <SkipForward size={18} />
            </button>

            {/* Volume */}
            <div className="flex items-center gap-2">
              <button onClick={toggleMute} className="text-white/70 hover:text-white transition-colors">
                {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : volume}
                onChange={(e) => changeVolume(parseFloat(e.target.value))}
                className="w-20"
              />
            </div>

            {/* Time */}
            <span className="text-xs text-white/70 font-display tabular-nums ml-1">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <div className="flex-1" />

            {/* Quality selector */}
            <div className="relative">
              <button
                onClick={() => setShowQuality(!showQuality)}
                className="flex items-center gap-1 text-xs text-white/70 hover:text-white transition-colors font-display"
              >
                <Settings size={16} />
                {quality}
              </button>
              {showQuality && (
                <div className="absolute bottom-8 right-0 glass-heavy rounded-lg p-2 min-w-[120px] space-y-0.5">
                  {qualityOptions.map((q) => (
                    <button
                      key={q}
                      onClick={() => { setQuality(q); setShowQuality(false); }}
                      className={`block w-full text-left px-3 py-1.5 text-xs rounded hover:bg-white/10 transition-colors ${quality === q ? "text-[#912678]" : "text-white/70"}`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button onClick={toggleFullscreen} className="text-white/70 hover:text-white transition-colors">
              {fullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
