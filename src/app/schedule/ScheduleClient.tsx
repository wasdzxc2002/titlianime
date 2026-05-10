"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState, useMemo } from "react";
import { format, fromUnixTime, isSameDay, startOfDay, addDays } from "date-fns";
import { CalendarDays, Clock } from "lucide-react";

interface ScheduleItem {
  id: number;
  title: string;
  image: string;
  episode: number;
  airingAt: number;
}

function getDayLabel(date: Date) {
  const today = startOfDay(new Date());
  const d = startOfDay(date);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return format(date, "EEEE");
}

export default function ScheduleClient({ initialSchedule }: { initialSchedule: ScheduleItem[] }) {
  const today = startOfDay(new Date());
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 1));
  const [selectedDay, setSelectedDay] = useState(today);

  const grouped = useMemo(() => {
    const filtered = initialSchedule.filter((s) =>
      isSameDay(fromUnixTime(s.airingAt), selectedDay)
    );
    const byHour: Record<string, ScheduleItem[]> = {};
    filtered.forEach((s) => {
      const h = format(fromUnixTime(s.airingAt), "HH:00");
      (byHour[h] ??= []).push(s);
    });
    return Object.entries(byHour).sort(([a], [b]) => a.localeCompare(b));
  }, [initialSchedule, selectedDay]);

  return (
    <div className="ml-0 md:ml-20 px-3 md:px-6 pt-18 md:pt-24 pb-12 md:pb-16">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <CalendarDays size={20} className="text-[#912678]" />
            <h1 className="text-2xl md:text-3xl font-black font-display">Airing Schedule</h1>
          </div>
          <p className="text-[#555] text-sm">All times in your local timezone</p>
        </div>

        {/* Day selector */}
        <div className="sticky top-14 md:top-16 z-20 -mx-3 md:-mx-6 px-3 md:px-6 py-3 glass-heavy border-b border-white/5 mb-6 md:mb-8">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {days.map((day) => {
              const isSelected = isSameDay(day, selectedDay);
              const label = getDayLabel(day);
              const hasItems = initialSchedule.some((s) => isSameDay(fromUnixTime(s.airingAt), day));
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDay(day)}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-semibold font-display transition-all ${
                    isSelected
                      ? "bg-[#912678] text-white"
                      : "bg-white/5 hover:bg-white/10 text-[#888]"
                  }`}
                >
                  <span>{label}</span>
                  {hasItems && !isSelected && (
                    <span className="ml-2 w-1.5 h-1.5 rounded-full bg-[#912678] inline-block align-middle" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Timeline */}
        {grouped.length === 0 ? (
          <div className="text-center py-24">
            <CalendarDays size={48} className="text-[#222] mx-auto mb-4" />
            <p className="text-[#555]">No scheduled releases for this day</p>
          </div>
        ) : (
          <div className="relative">
            {/* Glowing vertical line */}
            <div className="absolute left-[52px] md:left-[72px] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#912678]/40 to-transparent" />
            <div className="absolute left-[52px] md:left-[72px] top-0 bottom-0 w-px bg-[#912678]/10 pulse-glow" />

            <div className="space-y-10">
              {grouped.map(([hour, items], gi) => (
                <div key={hour} className="relative">
                  {/* Time label */}
                  <div className="flex items-center mb-4 md:mb-5">
                    <div className="w-[52px] md:w-[72px] flex-shrink-0 flex items-center gap-1.5 md:gap-2">
                      <Clock size={12} className="text-[#912678]" />
                      <span className="text-[11px] md:text-xs font-bold text-[#912678] font-display">{hour}</span>
                    </div>
                    {/* Timeline dot */}
                    <div className="relative z-10 w-3 h-3 rounded-full bg-[#912678] ring-4 ring-[#912678]/20 -ml-1.5 flex-shrink-0" />
                  </div>

                  {/* Cards */}
                  <div className="ml-[64px] md:ml-[84px] grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {items.map((item, ii) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, amount: 0.1 }}
                        transition={{ delay: gi * 0.05 + ii * 0.04, type: "spring", stiffness: 300, damping: 28 }}
                      >
                        <Link href={`/anime/${item.id}`}>
                          <div className="flex items-center gap-3 p-3 rounded-xl glass ring-1 ring-white/5 hover:ring-[#912678]/30 hover:bg-white/5 transition-all group cursor-pointer">
                            <div className="relative w-12 h-16 rounded overflow-hidden flex-shrink-0 bg-white/5">
                              <Image
                                src={item.image}
                                alt={item.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold leading-tight group-hover:text-[#912678] transition-colors line-clamp-2">
                                {item.title}
                              </p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-xs text-[#912678] font-bold">Ep {item.episode}</span>
                                <span className="text-xs text-[#555]">
                                  {format(fromUnixTime(item.airingAt), "h:mm a")}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
