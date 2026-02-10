export type ApiWorkout = {
  id: string;
  date: string;
  createdAt: string;
  restDay?: boolean;
  exercises: { name: string; sets: { weight: number | null; reps: number | null }[] }[];
};

export type MoodLabel =
  | "locked in"
  | "steady"
  | "sore"
  | "drained";

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function startOfIsoWeek(d: Date) {
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function toKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function workoutVolume(w: ApiWorkout) {
  if (w.restDay) return 0;
  let v = 0;
  for (const ex of w.exercises) {
    for (const s of ex.sets) {
      const wt = s.weight ?? 0;
      const rp = s.reps ?? 0;
      if (wt > 0 && rp > 0) v += wt * rp;
    }
  }
  return Math.round(v);
}

export function computeStreak(workouts: ApiWorkout[], today: string) {
  const days = new Set(workouts.map((w) => w.date));
  let streak = 0;
  let cur = new Date(today + "T00:00:00");
  while (true) {
    const k = toKey(cur);
    if (!days.has(k)) break;
    streak++;
    cur.setDate(cur.getDate() - 1);
  }
  return streak;
}

export function computeMood(workouts: ApiWorkout[], today: string): MoodLabel {
  const todayDt = new Date(today + "T00:00:00");

  const inLastNDays = (n: number) => {
    const start = new Date(todayDt);
    start.setDate(start.getDate() - (n - 1));
    const startKey = toKey(start);
    return workouts.filter((w) => w.date >= startKey && w.date <= today);
  };

  const last7 = inLastNDays(7);
  const last28 = inLastNDays(28);

  // consistency
  const loggedRatio7 = last7.length / 7;

  // volume trend (7d vs 28d)
  const w7 = last7.filter((w) => !w.restDay);
  const avgVol7 = w7.length ? w7.reduce((s, w) => s + workoutVolume(w), 0) / w7.length : 0;

  const w28 = last28.filter((w) => !w.restDay);
  const avgVol28 = w28.length ? w28.reduce((s, w) => s + workoutVolume(w), 0) / w28.length : 0;

  const trend = avgVol28 > 0 ? (avgVol7 - avgVol28) / avgVol28 : 0; // negative = doing less volume lately
  const streak = computeStreak(workouts, today);

  // Locked in: frequent logging + not collapsing in volume
  if (loggedRatio7 >= 0.7 && (trend > -0.25 || streak >= 4)) return "locked in";

  // Sore: still consistent, but volume has dipped (fatigue/recovery vibe)
  if (loggedRatio7 >= 0.5 && trend < -0.25) return "sore";

  // Steady: some consistency, not amazing, not terrible
  if (loggedRatio7 >= 0.35) return "steady";

  // Drained: barely logging
  return "drained";
}

export function computeWeeklyHighlights(workouts: ApiWorkout[], today: string) {
  const monday = startOfIsoWeek(new Date(today + "T00:00:00"));
  const startKey = toKey(monday);
  const week = workouts.filter((w) => w.date >= startKey && w.date <= today);

  const fmtDay = (k: string) =>
    new Date(k + "T00:00:00").toLocaleDateString(undefined, { weekday: "short" });

  // greatest volume day
  let best: { date: string; vol: number } | null = null;
  for (const w of week) {
    const vol = workoutVolume(w);
    if (vol <= 0) continue;
    if (!best || vol > best.vol) best = { date: w.date, vol };
  }

  // heaviest set
  let heavy: { ex: string; w: number } | null = null;
  for (const w of week) {
    if (w.restDay) continue;
    for (const ex of w.exercises) {
      for (const s of ex.sets) {
        const wt = s.weight ?? 0;
        if (wt <= 0) continue;
        if (!heavy || wt > heavy.w) heavy = { ex: ex.name, w: wt };
      }
    }
  }

  // most consistent exercise
  const counts = new Map<string, number>();
  for (const w of week) {
    if (w.restDay) continue;
    const seen = new Set<string>();
    for (const ex of w.exercises) {
      if (seen.has(ex.name)) continue;
      seen.add(ex.name);
      counts.set(ex.name, (counts.get(ex.name) ?? 0) + 1);
    }
  }
  let most: { ex: string; n: number } | null = null;
  for (const [ex, n] of counts.entries()) {
    if (!most || n > most.n) most = { ex, n };
  }

    return [
        best
            ? `Your best day was ${fmtDay(best.date)}. You moved ${best.vol.toLocaleString()} total volume. That’s real work.`
            : `No big numbers needed. Log one session this week and you’re back on track.`,

        heavy
            ? `Heaviest moment: ${heavy.ex} at ${heavy.w}. Keep that strength, even one top set counts.`
            : `Heaviest moment is waiting. One solid top set this week and you’ll set the tone.`,

        most
            ? `Most consistent lift: ${most.ex} (${most.n}× this week).`
            : `Pick one “anchor lift” and repeat it 2–3× this week. That’s how progress shows up.`
    ];
}

export function computeTodayCoach(workoutsForDay: ApiWorkout[]) {
  const all = workoutsForDay.filter((w) => !w.restDay);
  const rest = workoutsForDay.some((w) => w.restDay);

  if (rest && all.length === 0) {
    return "Rest day logged. Recovery counts and you’re still on track.";
  }
  if (all.length === 0) {
    return "No log yet. One exercise is enough. Start small.";
  }

  let totalSets = 0;
  let totalReps = 0;
  let top: { ex: string; weight: number } | null = null;

  for (const w of all) {
    for (const ex of w.exercises) {
      for (const s of ex.sets) {
        const wt = s.weight ?? 0;
        const rp = s.reps ?? 0;
        if (wt > 0 && rp > 0) {
          totalSets += 1;
          totalReps += rp;
          if (!top || wt > top.weight) top = { ex: ex.name, weight: wt };
        }
      }
    }
  }

  if (totalSets === 0) {
    return "Logged a session. Add one clean set and you’re done.";
  }

  if (top) {
    return `Today: ${totalSets} sets, ${totalReps} reps. Best moment: ${top.ex} @ ${top.weight}.`;
  }
  return `Today: ${totalSets} sets, ${totalReps} reps. Clean work.`;
}
