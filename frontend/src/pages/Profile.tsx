import React from "react";
import { useProfile } from "../hooks/useProfile";
import type { Experience, Goal, Units } from "../profile";

export default function ProfilePage() {
    const { profile, setProfile, resetProfile } = useProfile();

    const exportData = () => {
        const payload: Record<string, unknown> = {};
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (!k) continue;
            if (!k.startsWith("lifting:")) continue;
            payload[k] = localStorage.getItem(k);
        }
        const blob = new Blob([JSON.stringify(payload, null, 2)], {
            type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "lifting-tracker-export.json";
        a.click();
        URL.revokeObjectURL(url);
    };

    const resetAllData = () => {
        const ok = window.confirm(
            "Reset all local Lifting Tracker data? This will clear drafts, profile, and any saved local data."
        );
        if (!ok) return;

        const keys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith("lifting:")) keys.push(k);
        }
        keys.forEach((k) => localStorage.removeItem(k));
        resetProfile();
    };

    // --- Toggles / cyclers ---
    const toggleUnits = () => {
        setProfile((p) => ({ ...p, units: p.units === "lb" ? "kg" : "lb" }));
    };

    const cycleDays = () => {
        setProfile((p) => ({
            ...p,
            targetDaysPerWeek: p.targetDaysPerWeek >= 7 ? 1 : p.targetDaysPerWeek + 1,
        }));
    };

    const cycleIntensity = () => {
        const order: Experience[] = ["beginner", "intermediate", "advanced"];
        const idx = Math.max(0, order.indexOf(profile.experience));
        const next = order[(idx + 1) % order.length];
        setProfile((p) => ({ ...p, experience: next }));
    };

    const toggleSyncMode = () => {
        setProfile((p) => ({ ...p, syncEnabled: !p.syncEnabled }));
    };

    const cycleGoal = () => {
        const order: Goal[] = ["general", "strength", "hypertrophy", "cut", "bulk"];
        const idx = Math.max(0, order.indexOf(profile.goal));
        const next = order[(idx + 1) % order.length];
        setProfile((p) => ({ ...p, goal: next }));
    };

    const editName = () => {
        const v = window.prompt("Your name", profile.name ?? "");
        if (v === null) return;
        setProfile((p) => ({ ...p, name: v.trim() }));
    };

    return (
        <div className="min-h-screen bg-[#F6F5F3] pb-24">
            <div className="px-5 pt-6">
                <TopPill title="Profile" />

                {/* Name + Goal row*/}
                <div className="mt-6 flex items-center gap-5">
                    <button
                        type="button"
                        aria-label="User"
                        className="active:scale-[0.98]"
                        onClick={editName}
                    >
                        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[#111827] shadow-[0_4px_10px_rgba(0,0,0,0.18)]">
                            <UserIcon className="h-6 w-6 text-white opacity-90" />
                        </div>
                    </button>

                    <div className="flex-1">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="text-[13px] text-[#111827]/70">Name</div>
                            <div className="text-[13px] text-[#111827]/70">Goal</div>
                        </div>

                        {/* Values underneath*/}
                        <div className="mt-2 grid grid-cols-2 gap-6">
                            <button
                                type="button"
                                onClick={editName}
                                className="text-left text-[14px] text-[#111827]/45 hover:underline"
                            >
                                {profile.name || "Tap to set"}
                            </button>

                            <button
                                type="button"
                                onClick={cycleGoal}
                                className="text-left text-[14px] text-[#111827]/45 hover:underline"
                            >
                                {prettyGoal(profile.goal)}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Training */}
                <div className="mt-7">
                    <SectionPill title="Training" />
                </div>

                <div className="mt-4 grid grid-cols-3 gap-4 text-center text-[13px] font-medium text-[#6366F1]">
                    <div>Units</div>
                    <div className="leading-snug">
                        Targeted Days/
                        <br />
                        week
                    </div>
                    <div>Intensity</div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-4">
                    {/* Units toggle */}
                    <TileButton onClick={toggleUnits} label={prettyUnits(profile.units)} />

                    {/* Days toggle 1..7 */}
                    <TileButton
                        onClick={cycleDays}
                        label={`${profile.targetDaysPerWeek} day${profile.targetDaysPerWeek === 1 ? "" : "s"}`}
                    />

                    {/* Intensity toggle */}
                    <TileButton onClick={cycleIntensity} label={prettyIntensity(profile.experience)} />
                </div>

                {/* Privacy & Data */}
                <div className="mt-10">
                    <SectionPill title="Privacy and Data" />
                </div>

                <div className="mt-5 grid grid-cols-3 gap-4">
                    {/* Local-only vs Sync toggle */}
                    <TileButton
                        onClick={toggleSyncMode}
                        label={profile.syncEnabled ? "Sync" : "Local-only"}
                        accent
                    />
                    <TileButton onClick={exportData} label="Export data" accent />
                    <TileButton onClick={resetAllData} label="Reset data" accent />
                </div>

                <div className="h-8" />
            </div>
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

function SectionPill({ title }: { title: string }) {
    return (
        <div className="inline-flex items-center rounded-full bg-[#6366F1] px-10 py-2 shadow-[0_10px_18px_rgba(99,102,241,0.18)]">
            <div className="text-[13px] font-medium text-white">{title}</div>
        </div>
    );
}

function TileButton({
    label,
    onClick,
    accent,
}: {
    label: string;
    onClick: () => void;
    accent?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={[
                "h-[74px] rounded-[18px] bg-white",
                "shadow-[0_14px_26px_rgba(0,0,0,0.10)]",
                "active:scale-[0.99]",
                "flex items-center justify-center text-center",
                accent
                    ? "text-[16px] font-medium text-[#6366F1]"
                    : "text-[16px] font-medium text-[#6B7280]",
            ].join(" ")}
        >
            {label}
        </button>
    );
}


function prettyUnits(u: Units) {
    return u === "lb" ? "lbs" : "kg";
}

function prettyIntensity(e: Experience) {
    if (e === "beginner") return "Beginner";
    if (e === "intermediate") return "Intermediate";
    return "Advanced";
}

function prettyGoal(g: Goal) {
    if (g === "general") return "General";
    if (g === "strength") return "Strength";
    if (g === "hypertrophy") return "Hypertrophy";
    if (g === "cut") return "Cut";
    return "Bulk";
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
