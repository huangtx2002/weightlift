import React, { useEffect, useMemo, useState } from "react";
import type { ApiWorkout } from "../components/insights";
import { useProfile } from "../hooks/useProfile";

type SetLike = { weight?: number | null; reps?: number | null };
type ExerciseLike = { name: string; sets: SetLike[] };
type WorkoutLike = {
    date: string;
    restDay?: boolean;
    exercises: ExerciseLike[];
};

type Point = { x: string; y: number };

function isoDay(d: Date) {
    return d.toISOString().slice(0, 10);
}
function todayKeyLocal() {
    return isoDay(new Date());
}
function addDaysIso(iso: string, delta: number) {
    const d = new Date(iso + "T00:00:00");
    d.setDate(d.getDate() + delta);
    return isoDay(d);
}
function startOfWeekISO(todayIso: string) {
    const d = new Date(todayIso + "T00:00:00");
    const js = d.getDay(); // Sun=0..Sat=6
    const mon0 = (js + 6) % 7; // Mon=0
    d.setDate(d.getDate() - mon0);
    return isoDay(d);
}
function fmtInt(n: number) {
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n);
}
function fmtDateShort(iso: string) {
    if (!iso) return "—";
    const d = new Date(iso + "T00:00:00");
    return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(d);
}
function fmtWeight(n: number, unitLabel: "lbs" | "kg") {
    return `${fmtInt(n)} ${unitLabel}`;
}
function fmtVolume(n: number, unitLabel: "lbs" | "kg") {
    return `${fmtInt(n)} ${unitLabel}`;
}

function epley1RM(weight: number, reps: number) {
    return weight * (1 + reps / 30);
}

function volumeOfSet(s: SetLike) {
    const w = Number(s.weight ?? 0);
    const r = Number(s.reps ?? 0);
    if (!Number.isFinite(w) || !Number.isFinite(r) || w <= 0 || r <= 0) return 0;
    return w * r;
}

function parseWorkout(w: ApiWorkout): WorkoutLike {
    return w as unknown as WorkoutLike;
}

function totalVolumeWorkout(w: WorkoutLike) {
    if (w.restDay) return 0;
    let v = 0;
    for (const ex of w.exercises ?? []) {
        for (const s of ex.sets ?? []) v += volumeOfSet(s);
    }
    return v;
}

function totalVolumeExerciseInWorkout(w: WorkoutLike, exName: string) {
    if (w.restDay) return 0;
    let v = 0;
    for (const ex of w.exercises ?? []) {
        if (ex.name !== exName) continue;
        for (const s of ex.sets ?? []) v += volumeOfSet(s);
    }
    return v;
}

function groupByDate(workouts: WorkoutLike[]) {
    const m = new Map<string, WorkoutLike[]>();
    for (const w of workouts) {
        const arr = m.get(w.date) ?? [];
        arr.push(w);
        m.set(w.date, arr);
    }
    return m;
}

function uniqueExercises(workouts: WorkoutLike[]) {
    const set = new Set<string>();
    for (const w of workouts) {
        if (w.restDay) continue;
        for (const ex of w.exercises ?? []) set.add(ex.name);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
}

function buildDailySeries(
    workoutsByDate: Map<string, WorkoutLike[]>,
    startIso: string,
    endIso: string,
    exercise?: string
) {
    const pts: Point[] = [];
    let cur = startIso;
    while (cur <= endIso) {
        const days = workoutsByDate.get(cur) ?? [];
        let v = 0;
        for (const w of days) {
            v += exercise ? totalVolumeExerciseInWorkout(w, exercise) : totalVolumeWorkout(w);
        }
        pts.push({ x: cur, y: Math.round(v) });
        cur = addDaysIso(cur, 1);
    }
    return pts;
}

function buildWeeklyVolumeSeries(workouts: WorkoutLike[], weeksBack: number, exercise?: string) {
    const today = todayKeyLocal();
    const thisMon = startOfWeekISO(today);
    const pts: Point[] = [];

    for (let i = weeksBack - 1; i >= 0; i--) {
        const wkStart = addDaysIso(thisMon, -7 * i);
        const wkEnd = addDaysIso(wkStart, 6);

        let v = 0;
        for (const w of workouts) {
            if (w.date < wkStart || w.date > wkEnd) continue;
            v += exercise ? totalVolumeExerciseInWorkout(w, exercise) : totalVolumeWorkout(w);
        }
        pts.push({ x: wkStart, y: Math.round(v) });
    }

    return pts;
}

function buildWeekly1RMSeries(workouts: WorkoutLike[], weeksBack: number, exercise: string) {
    const today = todayKeyLocal();
    const thisMon = startOfWeekISO(today);
    const pts: Point[] = [];

    for (let i = weeksBack - 1; i >= 0; i--) {
        const wkStart = addDaysIso(thisMon, -7 * i);
        const wkEnd = addDaysIso(wkStart, 6);

        let top = 0;
        for (const w of workouts) {
            if (w.restDay) continue;
            if (w.date < wkStart || w.date > wkEnd) continue;

            for (const ex of w.exercises ?? []) {
                if (ex.name !== exercise) continue;
                for (const s of ex.sets ?? []) {
                    const wt = Number(s.weight ?? 0);
                    const rp = Number(s.reps ?? 0);
                    if (!Number.isFinite(wt) || !Number.isFinite(rp) || wt <= 0 || rp <= 0) continue;
                    top = Math.max(top, epley1RM(wt, rp));
                }
            }
        }

        pts.push({ x: wkStart, y: Math.round(top) });
    }

    return pts;
}

function TopPill({ title }: { title: string }) {
    return (
        <div className="relative h-[56px] w-full rounded-[18px] bg-[#DFE8FF]">
            <div className="flex h-full items-center justify-center">
                <span className="text-[22px] font-medium text-[#111827]">{title}</span>
            </div>
        </div>
    );
}

function SectionPill({ title }: { title: string }) {
    return (
        <div className="inline-flex items-center rounded-full bg-[#6366F1] px-10 py-2 shadow-[0_10px_18px_rgba(99,102,241,0.18)]">
            <div className="text-[13px] font-medium text-white">{title}</div>
        </div>
    );
}

function StatCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-[18px] bg-white px-4 py-4 shadow-[0_10px_25px_rgba(0,0,0,0.08)]">
            <div className="text-[12px] font-medium text-[#6366F1]">{label}</div>
            <div className="mt-2 text-[16px] font-medium leading-snug text-[#111827] tabular-nums">{value}</div>
        </div>
    );
}

function ChartCard({
    title,
    subtitle,
    children,
}: {
    title: string;
    subtitle: string;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-[18px] bg-white px-4 py-4 shadow-[0_10px_25px_rgba(0,0,0,0.08)]">
            <div className="text-[12px] font-medium text-[#6366F1]">{title}</div>
            <div className="mt-1 text-[11px] text-[#9CA3AF]">{subtitle}</div>
            <div className="mt-3">{children}</div>
        </div>
    );
}

function Sparkline({ points }: { points: Point[] }) {
    const w = 160;
    const h = 60;
    const pad = 4;

    const ys = points.map((p) => p.y);
    const minY = Math.min(...ys, 0);
    const maxY = Math.max(...ys, 1);

    const toX = (i: number) => (points.length <= 1 ? pad : pad + (i * (w - 2 * pad)) / (points.length - 1));
    const toY = (y: number) => {
        const t = (y - minY) / (maxY - minY || 1);
        return h - pad - t * (h - 2 * pad);
    };

    const d = points
        .map((p, i) => `${i === 0 ? "M" : "L"} ${toX(i).toFixed(2)} ${toY(p.y).toFixed(2)}`)
        .join(" ");

    return (
        <svg width="100%" viewBox={`0 0 ${w} ${h}`} className="block">
            <path d={d} fill="none" stroke="currentColor" strokeWidth="2" className="text-[#6366F1]" />
            <circle cx={toX(points.length - 1)} cy={toY(points[points.length - 1]?.y ?? 0)} r="2.6" className="fill-[#6366F1]" />
        </svg>
    );
}

function MiniBars({ points }: { points: Point[] }) {
    const w = 160;
    const h = 60;
    const pad = 4;
    const maxY = Math.max(...points.map((p) => p.y), 1);
    const bw = (w - 2 * pad) / Math.max(points.length, 1);

    return (
        <svg width="100%" viewBox={`0 0 ${w} ${h}`} className="block">
            {points.map((p, i) => {
                const bh = ((p.y / maxY) * (h - 2 * pad)) || 0;
                const x = pad + i * bw + bw * 0.15;
                const y = h - pad - bh;
                const ww = bw * 0.7;
                return <rect key={p.x} x={x} y={y} width={ww} height={bh} rx="2" className="fill-[#6366F1]" opacity={0.85} />;
            })}
        </svg>
    );
}

type HighlightRow = { left: string; mid: string; right: string };

function Highlights({ rows }: { rows: HighlightRow[] }) {
    return (
        <div className="mt-4 rounded-[18px] bg-white px-4 py-4 shadow-[0_10px_25px_rgba(0,0,0,0.08)]">
            {rows.length === 0 ? (
                <div className="text-[13px] text-[#9CA3AF]">No highlights yet.</div>
            ) : (
                <div className="space-y-3">
                    {rows.slice(0, 3).map((r, i) => (
                        <div key={i} className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="truncate text-[13px] font-medium text-[#111827]">{r.left}</div>
                                <div className="mt-1 text-[12px] text-[#6B7280]">{r.mid}</div>
                            </div>
                            <div className="shrink-0 text-[12px] text-[#9CA3AF] tabular-nums">{r.right}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function StatsPage() {
    const { profile } = useProfile();
    const unitLabel: "lbs" | "kg" = profile.units === "kg" ? "kg" : "lbs";

    const [all, setAll] = useState<WorkoutLike[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedExercise, setSelectedExercise] = useState<string>("");

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const end = todayKeyLocal();
                const start = "2000-01-01";
                const res = await fetch(`/api/workouts/range?start=${start}&end=${end}`);
                const data = await res.json();
                if (!res.ok || data?.ok === false) return;

                const workouts = ((data.workouts ?? []) as ApiWorkout[]).map(parseWorkout);
                workouts.sort((a, b) => a.date.localeCompare(b.date));
                setAll(workouts);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const exercises = useMemo(() => uniqueExercises(all), [all]);
    const byDate = useMemo(() => groupByDate(all), [all]);

    const allTime = useMemo(() => {
        let totalVol = 0;
        const liftedDays = new Set<string>();

        for (const w of all) {
            if (w.restDay) continue;
            const v = totalVolumeWorkout(w);
            if (v > 0) {
                totalVol += v;
                liftedDays.add(w.date);
            }
        }

        return {
            totalVol: Math.round(totalVol),
            daysLifted: liftedDays.size,
        };
    }, [all]);

    // PR and estimated max one rep max
    const exerciseFocus = useMemo(() => {
        if (!selectedExercise) return null;

        let pr = { w: 0, date: "" };
        let best1 = { v: 0, date: "" };

        for (const w of all) {
            if (w.restDay) continue;
            for (const ex of w.exercises ?? []) {
                if (ex.name !== selectedExercise) continue;

                for (const s of ex.sets ?? []) {
                    const wt = Number(s.weight ?? 0);
                    const rp = Number(s.reps ?? 0);

                    if (Number.isFinite(wt) && wt > pr.w) pr = { w: wt, date: w.date };

                    if (Number.isFinite(wt) && Number.isFinite(rp) && wt > 0 && rp > 0) {
                        const est = epley1RM(wt, rp);
                        if (est > best1.v) best1 = { v: est, date: w.date };
                    }
                }
            }
        }

        return {
            pr: { w: Math.round(pr.w), date: pr.date },
            best1: { v: Math.round(best1.v), date: best1.date },
        };
    }, [all, selectedExercise]);

    // Graphs
    const daily28 = useMemo(() => {
        const end = todayKeyLocal();
        const start = addDaysIso(end, -27);
        return buildDailySeries(byDate, start, end, selectedExercise || undefined);
    }, [byDate, selectedExercise]);

    const weekly12 = useMemo(() => {
        if (selectedExercise) return buildWeekly1RMSeries(all, 12, selectedExercise);
        return buildWeeklyVolumeSeries(all, 12);
    }, [all, selectedExercise]);

    // Highlights
    const highlights = useMemo<HighlightRow[]>(() => {
        const rows: HighlightRow[] = [];

        // max volume day
        let bestVol = { v: 0, date: "" };
        for (const w of all) {
            const v = selectedExercise ? totalVolumeExerciseInWorkout(w, selectedExercise) : totalVolumeWorkout(w);
            if (v > bestVol.v) bestVol = { v: Math.round(v), date: w.date };
        }

        if (selectedExercise && exerciseFocus) {
            rows.push({
                left: `${selectedExercise} PR`,
                mid: `Heaviest weight: ${fmtWeight(exerciseFocus.pr.w, unitLabel)}`,
                right: fmtDateShort(exerciseFocus.pr.date),
            });
            rows.push({
                left: `${selectedExercise} Estimated 1RM`,
                mid: `Best est 1RM: ${fmtWeight(exerciseFocus.best1.v, unitLabel)}`,
                right: fmtDateShort(exerciseFocus.best1.date),
            });
            rows.push({
                left: `${selectedExercise} Max volume day`,
                mid: `Volume: ${fmtVolume(bestVol.v, unitLabel)}`,
                right: fmtDateShort(bestVol.date),
            });
            return rows;
        }

        // global highlights if no exercise selected
        let bestW = { w: 0, date: "", ex: "" };
        for (const w of all) {
            if (w.restDay) continue;
            for (const ex of w.exercises ?? []) {
                for (const s of ex.sets ?? []) {
                    const wt = Number(s.weight ?? 0);
                    if (Number.isFinite(wt) && wt > bestW.w) bestW = { w: wt, date: w.date, ex: ex.name };
                }
            }
        }

        rows.push({
            left: `All-time PR`,
            mid: `${bestW.ex || "Lift"}: ${fmtWeight(Math.round(bestW.w), unitLabel)}`,
            right: fmtDateShort(bestW.date),
        });

        rows.push({
            left: `Max volume day`,
            mid: `Volume: ${fmtVolume(bestVol.v, unitLabel)}`,
            right: fmtDateShort(bestVol.date),
        });

        const bestWeek = weekly12.reduce((a, b) => (b.y > a.y ? b : a), weekly12[0] ?? { x: "", y: 0 });
        rows.push({
            left: selectedExercise ? `Best week (est 1RM)` : `Best week (volume)`,
            mid: selectedExercise
                ? `${fmtWeight(bestWeek.y, unitLabel)}`
                : `${fmtVolume(bestWeek.y, unitLabel)}`,
            right: fmtDateShort(bestWeek.x),
        });

        return rows;
    }, [all, selectedExercise, exerciseFocus, weekly12, unitLabel]);

    const dailyBest = useMemo(() => {
        const best = daily28.reduce((a, b) => (b.y > a.y ? b : a), daily28[0] ?? { x: "", y: 0 });
        const last = daily28[daily28.length - 1] ?? { x: "", y: 0 };
        return { best, last };
    }, [daily28]);

    const weeklyBest = useMemo(() => {
        const best = weekly12.reduce((a, b) => (b.y > a.y ? b : a), weekly12[0] ?? { x: "", y: 0 });
        const last = weekly12[weekly12.length - 1] ?? { x: "", y: 0 };
        return { best, last };
    }, [weekly12]);

    return (
        <div className="min-h-screen bg-[#F6F5F3] pb-24">
            <div className="px-5 pt-6">
                <TopPill title="Stats" />

                {loading ? (
                    <div className="mt-6 text-[13px] text-[#9CA3AF]">Loading stats…</div>
                ) : (
                    <>
                        {/* All-time (2 cards) */}
                        <div className="mt-6 grid grid-cols-2 gap-4">
                            <StatCard label="Total Volume (all-time)" value={fmtVolume(allTime.totalVol, unitLabel)} />
                            <StatCard label="Days Lifted (all-time)" value={fmtInt(allTime.daysLifted)} />
                        </div>

                        {/* Exercise Focus */}
                        <div className="mt-8">
                            <SectionPill title="Exercise Focus" />
                        </div>

                        <div className="mt-4 rounded-[18px] bg-white px-4 py-4 shadow-[0_10px_25px_rgba(0,0,0,0.08)]">
                            <div className="text-[12px] font-medium text-[#6366F1]">Select exercise</div>

                            <div className="mt-3">
                                <select
                                    value={selectedExercise}
                                    onChange={(e) => setSelectedExercise(e.target.value)}
                                    className="h-[46px] w-full rounded-[14px] border border-[#E5E7EB] bg-white px-4 text-[13px] text-[#111827] outline-none focus:border-[#6366F1]"
                                >
                                    <option value="">All exercises</option>
                                    {exercises.map((n) => (
                                        <option key={n} value={n}>
                                            {n}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedExercise && exerciseFocus ? (
                                <div className="mt-4 grid grid-cols-2 gap-4">
                                    <StatCard
                                        label="PR (all-time)"
                                        value={`${fmtWeight(exerciseFocus.pr.w, unitLabel)} • ${fmtDateShort(exerciseFocus.pr.date)}`}
                                    />
                                    <StatCard
                                        label="Estimated 1RM (all-time)"
                                        value={`${fmtWeight(exerciseFocus.best1.v, unitLabel)} • ${fmtDateShort(exerciseFocus.best1.date)}`}
                                    />
                                </div>
                            ) : (
                                <div className="mt-4 text-[12px] text-[#9CA3AF]">
                                    Pick an exercise to see your PR and best estimated 1RM.
                                </div>
                            )}
                        </div>

                        {/* Trends */}
                        <div className="mt-10">
                            <SectionPill title="Trends" />
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-4">
                            <ChartCard
                                title="Daily Volume (28d)"
                                subtitle={`best: ${fmtDateShort(dailyBest.best.x)} • ${fmtVolume(
                                    dailyBest.best.y,
                                    unitLabel
                                )} | today: ${fmtVolume(dailyBest.last.y, unitLabel)}`}
                            >
                                <Sparkline points={daily28} />
                            </ChartCard>

                            <ChartCard
                                title={selectedExercise ? "Weekly Estimated 1RM (12w)" : "Weekly Volume (12w)"}
                                subtitle={
                                    selectedExercise
                                        ? `best: ${fmtDateShort(weeklyBest.best.x)} • ${fmtWeight(
                                            weeklyBest.best.y,
                                            unitLabel
                                        )} | this week: ${fmtWeight(weeklyBest.last.y, unitLabel)}`
                                        : `best: ${fmtDateShort(weeklyBest.best.x)} • ${fmtVolume(
                                            weeklyBest.best.y,
                                            unitLabel
                                        )} | this week: ${fmtVolume(weeklyBest.last.y, unitLabel)}`
                                }
                            >
                                <MiniBars points={weekly12} />
                            </ChartCard>
                        </div>

                        {/* Highlights */}
                        <div className="mt-10">
                            <SectionPill title="Highlights" />
                        </div>
                        <Highlights rows={highlights} />

                        <div className="h-6" />
                    </>
                )}
            </div>
        </div>
    );
}
