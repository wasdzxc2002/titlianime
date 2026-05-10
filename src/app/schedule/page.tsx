import ScheduleClient from "./ScheduleClient";
import { getAiringSchedule } from "@/lib/anilist";

export const metadata = { title: "Schedule" };

export default async function SchedulePage() {
  let schedule: Awaited<ReturnType<typeof getAiringSchedule>> = [];
  try {
    schedule = await getAiringSchedule(1, 100);
  } catch { /* empty */ }

  return <ScheduleClient initialSchedule={schedule} />;
}
