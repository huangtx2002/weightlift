import React, { useEffect, useMemo, useState } from "react";
import type { ApiWorkout } from "../components/insights";

type SetRow = { weight: string; reps: string };
type LoggedExercise = { id: string; name: string; sets: SetRow[] };

const EXERCISE_LIBRARY = [
    "Bench Press",
    "Incline Bench Press",
    "Overhead Press",
    "Lat Pulldown",
    "Barbell Row",
    "Squat",
    "Deadlift",
    "Romanian Deadlift",
    "Leg Press",
    "Calf Raise",
];

const STORAGE_KEY = "lifting:logwout:draft:v1";

type DraftState = {
    currentExercise: string;
    sets: SetRow[];
    log: LoggedExercise[];
    savedAt: string; // saves the date, refreshes every day
};

function todayKey() {
    return new Date().toISOString().slice(0, 10);
}

// load the same draft from localStorage if it's from today
function loadDraft(): DraftState | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as DraftState;

        if (parsed.savedAt !== todayKey()) return null;
        return parsed;
    } catch {
        return null;
    }
}

function saveDraft(d: DraftState) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
    } catch {
    }
}

export default function LogWout() {
    const draft = loadDraft();

    const [currentExercise, setCurrentExercise] = useState<string>(draft?.currentExercise ?? "");
    const [sets, setSets] = useState<SetRow[]>(draft?.sets ?? [{ weight: "", reps: "" }]);
    const [log, setLog] = useState<LoggedExercise[]>(draft?.log ?? []);

    const [history14, setHistory14] = useState<ApiWorkout[]>([]);

useEffect(() => {
  (async () => {
    const end = todayKey();
    const start = (() => {
      const d = new Date(end + "T00:00:00");
      d.setDate(d.getDate() - 13); // 14 days including today
      return d.toISOString().slice(0, 10);
    })();

    const res = await fetch(`/api/workouts/range?start=${start}&end=${end}`);
    const data = await res.json();
    if (!res.ok || data?.ok === false) return;

    setHistory14((data.workouts ?? []) as ApiWorkout[]);
  })();
}, []);


    useEffect(() => {
        saveDraft({
            currentExercise,
            sets,
            log,
            savedAt: todayKey(),
        });
    }, [currentExercise, sets, log]);

    const [toast, setToast] = useState(false);
    const [saving, setSaving] = useState(false);

    function showSavedToast() {
        setToast(true);
        window.setTimeout(() => setToast(false), 1800);
    }

    const currentVolume = useMemo(() => {
        let v = 0;
        for (const s of sets) {
            const w = Number(s.weight);
            const r = Number(s.reps);
            if (Number.isFinite(w) && Number.isFinite(r) && w > 0 && r > 0) v += w * r;
        }
        return Math.round(v);
    }, [sets]);

    const highlightOfDay = useMemo(() => {
        if (log.length === 0 && currentVolume === 0) return "";
        if (log.length === 0 && currentVolume > 0) return "Highlight of the day: you started. Keep it clean.";

        let top: { ex: string; weight: number } | null = null;

        for (const ex of log) {
            for (const s of ex.sets) {
            const w = Number(s.weight);
            const r = Number(s.reps);
            if (Number.isFinite(w) && Number.isFinite(r) && w > 0 && r > 0) {
                if (!top || w > top.weight) top = { ex: ex.name, weight: w };
            }
            }
        }

        if (top) return `Highlight of the day: strong ${top.ex}.`;
        return "Highlight of the day: solid work.";
    }, [log, currentVolume]);

    const coachLine = useMemo(() => {
        const classify = (name: string) => {
            const n = name.toLowerCase();
            if (n.includes("bench") || n.includes("press")) return "push";
            if (n.includes("row") || n.includes("pulldown")) return "pull";
            if (n.includes("squat") || n.includes("leg press") || n.includes("calf")) return "legs";
            if (n.includes("deadlift") || n.includes("romanian")) return "hinge";
            return "general";
        };

        const cueFor = (exName: string) => {
            const c = classify(exName);
            if (c === "push") return "Shoulders back. Controlled touch. Drive straight up.";
            if (c === "pull") return "Elbows down/back. Pause the squeeze. Don’t swing.";
            if (c === "legs") return "Brace hard. Knees track. Controlled depth.";
            if (c === "hinge") return "Brace first. Lats tight. No yanking.";
            return "Smooth reps. Full range. No ego.";
        };

        const startedExercise = currentExercise.trim().length > 0;
        const hasDraftInputs = sets.some((s) => s.weight.trim() !== "" || s.reps.trim() !== "");

        // ---- early guidance (no randomness) ----
        if (log.length === 0 && currentVolume === 0 && !startedExercise && !hasDraftInputs) {
            return "Pick one lift. One clean set. Then decide if you want more.";
        }

        if (log.length === 0 && (startedExercise || hasDraftInputs || currentVolume > 0)) {
            const hasWeight = sets.some((s) => s.weight.trim() !== "");
            const hasReps = sets.some((s) => s.reps.trim() !== "");
            if (hasWeight && !hasReps) return "Add reps, then add the exercise to the log.";
            if (!hasWeight && hasReps) return "Add weight, then add the exercise to the log.";
            return "Finish this exercise, then add it to the log.";
        }

        // ---- baseline from last 14 days (per exercise best weight) ----
        const baseline = new Map<string, number>();
        for (const w of history14) {
            if (w.restDay) continue;
            for (const ex of w.exercises) {
            for (const s of ex.sets) {
                const wt = s.weight ?? 0;
                if (wt <= 0) continue;
                const prev = baseline.get(ex.name) ?? 0;
                if (wt > prev) baseline.set(ex.name, wt);
            }
            }
        }

        // ---- analyze today draft log ----
        let totalSets = 0;
        let repsSum = 0;
        const todayTop = new Map<string, { w: number; r: number }>();

        for (const ex of log) {
            for (const s of ex.sets) {
            const w = Number(s.weight);
            const r = Number(s.reps);
            if (Number.isFinite(w) && Number.isFinite(r) && w > 0 && r > 0) {
                totalSets++;
                repsSum += r;
                const prev = todayTop.get(ex.name);
                if (!prev || w > prev.w) todayTop.set(ex.name, { w, r });
            }
            }
        }

        if (totalSets === 0) return "Add one clean working set, then save.";

        const avgReps = repsSum / totalSets;

        // main lift = heaviest top set today
        let mainEx: string | null = null;
        let mainW = -1;
        for (const [name, top] of todayTop.entries()) {
            if (top.w > mainW) {
            mainW = top.w;
            mainEx = name;
            }
        }
        if (!mainEx) return "Good work. Save it clean and recover.";

        const mainTop = todayTop.get(mainEx)!;
        const baseTop = baseline.get(mainEx) ?? 0;

        const hasBaseline = baseTop > 0;
        const ratio = hasBaseline ? mainTop.w / baseTop : 0;

        // ---- deterministic ladder ----
        if (hasBaseline && ratio >= 0.9) {
            return `Relative heavy day on ${mainEx}. ${cueFor(mainEx)}`;
        }

        if (avgReps >= 8) {
            return `Higher-rep day. Control the lowering. ${cueFor(mainEx)}`;
        }

        if (avgReps <= 5) {
            return `Low-rep day. Full rest. Crisp reps. ${cueFor(mainEx)}`;
        }

        if (totalSets <= 3) return "Short session is still a win. Save it clean.";
        if (totalSets <= 8) return "Good pace. Don’t rush reps. Stay structured.";
        return "That’s plenty. End on a clean set and recover.";
    }, [log, currentVolume, currentExercise, sets, history14]);

    function addSet() {
        setSets((prev) => [...prev, { weight: "", reps: "" }]);
    }

    function removeSetAt(idx: number) {
        setSets((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));
    }

    function updateSet(idx: number, patch: Partial<SetRow>) {
        setSets((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
    }

    function addExerciseToLog() {
        const name = currentExercise.trim();

        const cleanedSets = sets
            .map((s) => ({ weight: s.weight.trim(), reps: s.reps.trim() }))
            .filter((s) => s.weight !== "" || s.reps !== "");

        if (!name) {
            alert("Choose an exercise first.");
            return;
        }
        if (cleanedSets.length === 0) {
            alert("Add at least one set.");
            return;
        }

        setLog((prev) => [{ id: uid(), name, sets: cleanedSets }, ...prev]);

        // reset for next exercise
        setCurrentExercise("");
        setSets([{ weight: "", reps: "" }]);
    }

    function removeLoggedExercise(id: string) {
        setLog((prev) => prev.filter((ex) => ex.id !== id));
    }

    async function saveWorkout() {
        if (saving) return;

        if (log.length === 0) {
            alert("No exercises to save.");
            return;
        }

        setSaving(true);

        try {
            const date = todayKey();
            const exercises = [...log].reverse().map((ex) => ({
            name: ex.name,
            sets: ex.sets.map((s) => ({
                weight: s.weight.trim() === "" ? null : Number(s.weight),
                reps: s.reps.trim() === "" ? null : Number(s.reps),
            })),
            }));

            const res = await fetch("/api/workouts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ date, exercises }),
            });

            const text = await res.text();
            console.log("saveWorkout:", res.status, text);

            if (!res.ok) {
            alert("Save failed. Check console.");
            return;
            }

            localStorage.removeItem(STORAGE_KEY);
            setLog([]);
            setCurrentExercise("");
            setSets([{ weight: "", reps: "" }]);

            showSavedToast();
        } finally {
            setSaving(false);
        }
    }


    return (
        <div className="min-h-screen bg-[#F6F5F3] pb-24">
            {toast && (
                <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2">
                    <div className="rounded-full bg-[#6366F1] px-5 py-3 text-[13px] font-medium text-white shadow-[0_10px_18px_rgba(0,0,0,0.12)]">
                        Saved workout
                    </div>
                </div>
            )}

            <div className="px-5 pt-6">
                <TopPill title="Workout Log" />

                {/* Avatar name pill */}
                <div className="mt-3">
                    <div className="inline-flex items-center gap-3 rounded-full bg-[#6366F1] px-5 py-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-black/25">
                            <UserIcon className="h-4 w-4 text-white" />
                        </div>
                        <div className="text-[13px] font-medium text-white">Avatar name</div>
                    </div>

                    {/* two lines under avatar */}
                    <div className="mt-2 space-y-1 pl-3">
                        <div className="text-[12px] text-[#9CA3AF]">{highlightOfDay}</div>
                        <div className="text-[12px] text-[#9CA3AF]">{coachLine}</div>
                    </div>
                </div>
            </div>

            {/* Light-blue section band: Current Exercise + Add exercise */}
            <div className="mt-3 bg-[#E0E7FF]">
                <div className="px-5 py-4">
                    <div className="flex items-center justify-between">
                        <div className="inline-flex rounded-full bg-[#6366F1] px-5 py-2 text-[13px] font-medium text-white">
                            Current Exercise
                        </div>

                        <button
                            type="button"
                            onClick={addExerciseToLog}
                            className="text-[13px] font-medium text-[#6366F1] hover:underline"
                        >
                            + Add exercise
                        </button>
                    </div>
                </div>
            </div>

            {/* Main input area */}
            <div className="px-5 pt-2">
                {/* Choose exercise */}
                <div className="text-center">
                    <div className="text-[13px] font-medium text-[#6366F1] underline">Choose exercise</div>

                    <div className="mt-3 flex justify-center">
                        <select
                            value={currentExercise}
                            onChange={(e) => setCurrentExercise(e.target.value)}
                            className="w-[220px] rounded-[14px] border border-[#E5E7EB] bg-white px-4 py-3 text-[13px] text-[#111827] outline-none focus:border-[#6366F1]"
                        >
                            <option value="" disabled>
                                Select…
                            </option>
                            {EXERCISE_LIBRARY.map((name) => (
                                <option key={name} value={name}>
                                    {name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Column headers */}
                <div className="mt-7 grid grid-cols-[44px_1fr_1fr_44px] items-center gap-3 text-center text-[13px] font-medium text-[#6366F1]">
                    <div>Sets</div>
                    <div>Weight</div>
                    <div>Reps</div>
                    <div></div>
                </div>

                {/* Set rows */}
                <div className="mt-4 space-y-3">
                    {sets.map((s, idx) => (
                        <div key={idx} className="grid grid-cols-[44px_1fr_1fr_44px] items-center gap-3">
                            <div className="text-center text-[13px] font-medium text-[#6366F1]">
                                {idx + 1}
                            </div>

                            <input
                                inputMode="decimal"
                                value={s.weight}
                                onChange={(e) => updateSet(idx, { weight: e.target.value })}
                                className="h-[44px] w-full rounded-[14px] border border-[#E5E7EB] bg-white px-4 text-[13px] text-[#111827] outline-none focus:border-[#6366F1] tabular-nums"
                            />

                            <input
                                inputMode="numeric"
                                value={s.reps}
                                onChange={(e) => updateSet(idx, { reps: e.target.value })}
                                className="h-[44px] w-full rounded-[14px] border border-[#E5E7EB] bg-white px-4 text-[13px] text-[#111827] outline-none focus:border-[#6366F1] tabular-nums"
                            />

                            <button
                                type="button"
                                onClick={() => removeSetAt(idx)}
                                disabled={sets.length <= 1}
                                className={[
                                    "h-[44px] w-[44px] rounded-[14px] text-[16px] leading-none font-medium flex items-center justify-center",
                                    sets.length <= 1
                                        ? "bg-[#F3F4F6] text-[#D1D5DB] cursor-not-allowed"
                                        : "bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]",
                                ].join(" ")}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>

                {/* Add set */}
                <div className="mt-7 flex items-center justify-center">
                    <button type="button" onClick={addSet} className="text-[13px] font-medium text-[#6366F1]">
                        + Add set
                    </button>
                </div>

                {/* Current volume display */}
                <div className="mt-3 text-center text-[12px] text-[#9CA3AF] tabular-nums">
                    {currentVolume > 0 ? `Current volume: ${currentVolume}` : "\u00A0"}
                </div>
            </div>

            {/* Light-blue band: Exercise Log */}
            <div className="mt-10 bg-[#E0E7FF]">
                <div className="px-5 py-4">
                    <div className="inline-flex rounded-full bg-[#6366F1] px-6 py-2 text-[13px] font-medium text-white">
                        Exercise Log
                    </div>
                </div>
            </div>

            {/* Logged exercises list */}
            <div className="px-5 pt-5">
                {log.length === 0 ? (
                    <div className="rounded-[18px] border border-[#E5E7EB] bg-white px-4 py-4 text-[13px] text-[#9CA3AF]">
                        No exercises yet.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {log.map((ex) => (
                            <div key={ex.id} className="rounded-[18px] border border-[#E5E7EB] bg-white px-4 py-3">
                                <div className="flex items-center justify-between">
                                    <div className="text-[14px] font-medium text-[#111827]">{ex.name}</div>
                                    <div className="text-[12px] text-[#9CA3AF] tabular-nums">{ex.sets.length} sets</div>
                                </div>

                                <div className="mt-2 space-y-1">
                                    {ex.sets.map((s, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center justify-between text-[12px] text-[#6B7280] tabular-nums"
                                        >
                                            <span>Set {i + 1}</span>
                                            <span>
                                                {s.weight || "—"} × {s.reps || "—"}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Remove exercise */}
                                <div className="mt-3 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => removeLoggedExercise(ex.id)}
                                        className="text-[12px] font-medium text-[#9CA3AF] hover:text-[#6366F1]"
                                    >
                                        Remove exercise
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Bottom Save Workout button */}
            <div className="mt-10 px-5">
                <div className="flex justify-center">
                    <button
                        onClick={saveWorkout}
                        className="h-[50px] w-[220px] rounded-full bg-[#6366F1] text-[14px] font-medium text-white shadow-[0_10px_18px_rgba(99,102,241,0.20)] active:scale-[0.99]"
                    >
                        Save Workout
                    </button>
                </div>
            </div>

            <div className="h-12" />
        </div>
    );
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

function uid() {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
    return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function UserIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 24 24" fill="none" {...props}>
            <path
                d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />
            <path
                d="M4.5 20c1.7-3.5 13.3-3.5 15 0"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />
        </svg>
    );
}
