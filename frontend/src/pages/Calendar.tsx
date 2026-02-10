import React, { useEffect, useMemo, useState } from "react";
import type { ApiWorkout } from "../components/insights";

type DayKind = "workout" | "rest" | "empty";

function isoDay(d: Date) {
    return d.toISOString().slice(0, 10);
}

function startOfMonth(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

// Mon to sun
function weekdayMon0(date: Date) {
    const js = date.getDay();
    return (js + 6) % 7;
}

function addDays(date: Date, n: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    return d;
}

function monthLabel(date: Date) {
    return date.toLocaleString(undefined, { month: "long", year: "numeric" });
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

export default function Calendar() {
    const [month, setMonth] = useState(() => startOfMonth(new Date()));
    const [workouts, setWorkouts] = useState<ApiWorkout[]>([]);
    const [selected, setSelected] = useState<string>(() => isoDay(new Date()));

    // Fetch all workouts for the current month
    useEffect(() => {
        (async () => {
            const mStart = startOfMonth(month);
            const mEnd = endOfMonth(month);

            const gridStart = addDays(mStart, -weekdayMon0(mStart));
            const gridEnd = addDays(mEnd, (6 - weekdayMon0(mEnd)));

            const start = isoDay(gridStart);
            const end = isoDay(gridEnd);

            const res = await fetch(`/api/workouts/range?start=${start}&end=${end}`);
            const data = await res.json();
            if (!res.ok || data?.ok === false) return;

            setWorkouts((data.workouts ?? []) as ApiWorkout[]);
        })();
    }, [month]);

    const byDate = useMemo(() => {
        const m = new Map<string, ApiWorkout[]>();
        for (const w of workouts) {
            const k = w.date;
            const arr = m.get(k) ?? [];
            arr.push(w);
            m.set(k, arr);
        }
        return m;
    }, [workouts]);

    const gridDays = useMemo(() => {
        const mStart = startOfMonth(month);
        const mEnd = endOfMonth(month);

        const gridStart = addDays(mStart, -weekdayMon0(mStart)); // monday
        const gridEnd = addDays(mEnd, (6 - weekdayMon0(mEnd))); // sunday

        const days: Date[] = [];
        for (
            let d = new Date(gridStart);
            d <= gridEnd;
            d = addDays(d, 1)
        ) {
            days.push(new Date(d));
        }
        return days;
    }, [month]);

    const selectedWorkouts = useMemo(() => {
        return byDate.get(selected) ?? [];
    }, [byDate, selected]);

    const selectedKind: DayKind = useMemo(() => {
        const arr = byDate.get(selected);
        if (!arr || arr.length === 0) return "empty";
        // if any entry is restDay, treat as rest
        if (arr.some((w) => (w as any).restDay)) return "rest";
        return "workout";
    }, [byDate, selected]);

    function dayKind(dateIso: string): DayKind {
        const arr = byDate.get(dateIso);
        if (!arr || arr.length === 0) return "empty";
        if (arr.some((w) => (w as any).restDay)) return "rest";
        return "workout";
    }

    const dow = ["M", "T", "W", "T", "F", "S", "S"];

    return (
        <div className="min-h-screen bg-[#F6F5F3] pb-24">
            <div className="px-5 pt-6">
                <TopPill title="Calendar" />

                {/* Month nav */}
                <div className="mt-5 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                        className="h-[38px] w-[38px] rounded-[14px] bg-white text-[#6366F1] shadow-[0_10px_18px_rgba(0,0,0,0.08)] active:scale-[0.99]"
                        aria-label="Previous month"
                    >
                        ‹
                    </button>

                    <div className="text-[16px] font-medium text-[#111827]">
                        {monthLabel(month)}
                    </div>

                    <button
                        type="button"
                        onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                        className="h-[38px] w-[38px] rounded-[14px] bg-white text-[#6366F1] shadow-[0_10px_18px_rgba(0,0,0,0.08)] active:scale-[0.99]"
                        aria-label="Next month"
                    >
                        ›
                    </button>
                </div>

                {/* Day of week header */}
                <div className="mt-5 grid grid-cols-7 gap-2">
                    {dow.map((d, i) => (
                        <div
                            key={i}
                            className="text-center text-[12px] font-medium text-[#6366F1]"
                        >
                            {d}
                        </div>
                    ))}
                </div>

                {/* Month grid */}
                <div className="mt-3 grid grid-cols-7 gap-2">
                    {gridDays.map((d) => {
                        const iso = isoDay(d);
                        const inMonth = d.getMonth() === month.getMonth();
                        const kind = dayKind(iso);
                        const isSelected = iso === selected;

                        const dot =
                            kind === "workout" ? "bg-[#6366F1]" : kind === "rest" ? "bg-[#9AA0A6]" : "bg-transparent";

                        return (
                            <button
                                key={iso}
                                type="button"
                                onClick={() => setSelected(iso)}
                                className={[
                                    "h-[44px] rounded-[14px] bg-white",
                                    "shadow-[0_10px_18px_rgba(0,0,0,0.08)]",
                                    "flex flex-col items-center justify-center",
                                    "active:scale-[0.99]",
                                    isSelected ? "ring-2 ring-[#6366F1]" : "ring-0",
                                    inMonth ? "" : "opacity-45",
                                ].join(" ")}
                                aria-label={`Select ${iso}`}
                            >
                                <div className="text-[13px] font-medium text-[#111827]">
                                    {d.getDate()}
                                </div>
                                <div className={`mt-1 h-1.5 w-1.5 rounded-full ${dot}`} />
                            </button>
                        );
                    })}
                </div>

                {/* Details */}
                <div className="mt-8">
                    <SectionPill title="Day Summary" />
                </div>

                <div className="mt-4 rounded-[18px] bg-white px-4 py-4 shadow-[0_10px_25px_rgba(0,0,0,0.08)]">
                    <div className="flex items-center justify-between">
                        <div className="text-[14px] font-medium text-[#111827]">
                            {selected}
                        </div>

                        <div className="text-[12px] font-medium">
                            {selectedKind === "workout" ? (
                                <span className="text-[#6366F1]">Workout</span>
                            ) : selectedKind === "rest" ? (
                                <span className="text-[#9AA0A6]">Rest day</span>
                            ) : (
                                <span className="text-[#9CA3AF]">No log</span>
                            )}
                        </div>
                    </div>

                    <div className="mt-3 space-y-2">
                        {selectedWorkouts.length === 0 ? (
                            <div className="text-[13px] text-[#9CA3AF]">
                                Nothing logged for this day.
                            </div>
                        ) : selectedWorkouts.some((w) => (w as any).restDay) ? (
                            <div className="text-[13px] text-[#9CA3AF]">
                                You logged a rest day. Recovery counts.
                            </div>
                        ) : (
                            selectedWorkouts.map((w, idx) => (
                                <div key={idx} className="space-y-2">
                                    {(w.exercises ?? []).map((ex: any, i: number) => (
                                        <div
                                            key={i}
                                            className="flex items-center justify-between text-[13px] text-[#6B7280]"
                                        >
                                            <span className="font-medium text-[#111827]/80">
                                                {ex.name}
                                            </span>
                                            <span className="tabular-nums">
                                                {(ex.sets?.length ?? 0)} sets
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="h-6" />
            </div>
        </div>
    );
}
