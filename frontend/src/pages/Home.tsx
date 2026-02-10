import { useNavigate } from "react-router-dom";
import FlameIcon from "../assets/Subtract.svg?react";
import { useEffect, useState } from "react";
import { computeMood, computeTodayCoach, computeStreak, computeWeeklyHighlights, todayKey, type ApiWorkout } from "../components/insights";

// encouragement lines
const ENCOURAGEMENT_LINES = [
    "Future you is watching — and proud.",
    "One more rep of effort. Not weight.",
    "Keep the streak alive. Even if it’s light.",
    "You don’t need a big day everyday.",
    "Stay honest with the work.",
    "Nothing fancy. Just show up.",
    "You’re building something, slowly.",
    "Nobody to prove to, but yourself.",
    "This is how it's done.",
    "Keep it clean.",
    "Do the work. Log it. Move on."
];

function pickRandomLine(lines: string[]) {
    return lines[Math.floor(Math.random() * lines.length)];
}

export default function Home() {
    const nav = useNavigate();
    const [line, setLine] = useState("");
    const [streak, setStreak] = useState(0);
    const [mood, setMood] = useState("meh");
    const [weekly, setWeekly] = useState<string[]>([]);
    const [coachLine, setCoachLine] = useState("-");

    useEffect(() => {
        (async () => {
            const end = todayKey();
            const start = (() => {
                const d = new Date(end + "T00:00:00");
                d.setDate(d.getDate() - 27);
                return d.toISOString().slice(0, 10);
            })();

            const res = await fetch(`/api/workouts/range?start=${start}&end=${end}`);
            const data = await res.json();
            if (!res.ok || data?.ok === false) return;
            const workouts: ApiWorkout[] = data.workouts ?? [];
            setStreak(computeStreak(workouts, end));
            setMood(computeMood(workouts, end));
            setWeekly(computeWeeklyHighlights(workouts, end));

            const rDay = await fetch(`/api/workouts?date=${end}`);
            const jDay = await rDay.json();
            const dayWorkouts: ApiWorkout[] = jDay.workouts ?? [];
            setCoachLine(computeTodayCoach(dayWorkouts));
        })();
    }, []);
    useEffect(() => {
        setLine(pickRandomLine(ENCOURAGEMENT_LINES));
    }, []);

        async function logRestDay() {
    const date = new Date().toISOString().slice(0, 10);

    const res = await fetch("/api/workouts/rest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date }),
    });

    const text = await res.text();
    console.log("restDay status:", res.status, "body:", text);

    if (!res.ok) {
        alert(`Rest day failed (${res.status}). Check console.`);
        return;
    }

    let data: any = null;
    try { data = JSON.parse(text); } catch {}

    if (data?.ok !== true) {
        alert("Rest day failed. Check console.");
        return;
    }

    alert("Rest day logged");
    }

    return (
        <div className="px-5 pt-6">
            <TopPill title="Home" />

            <div className="mt-5 flex items-center justify-between gap-3">
                <p className="flex-1 pl-10 text-left text-[12px] text-[#6B7280] leading-snug">
                    {line}
                </p>

                <div className="flex h-10 items-center gap-2 rounded-[14px] bg-[#DFE8FF] px-4">
                    <span className="text-[20px] font-medium leading-none text-[#111827]">
                        {streak}
                    </span>
                    <FlameIcon className="h-5 w-5 text-[#5B63F6]" />
                </div>
            </div>

            <div className="mt-6 flex justify-center">
                <div className="h-[210px] w-[270px] rounded-[18px] bg-white shadow-[0_10px_25px_rgba(0,0,0,0.08)]">
                    <div className="flex h-full items-center justify-center">
                        <div className="text-[12px] text-[#9CA3AF]">(illustration)</div>
                    </div>
                </div>
            </div>

            <div className="mt-5 text-center text-[18px] text-[#9CA3AF]">
                Today, I’m feeling {mood}.
            </div>

            <div className="mt-6 flex items-center justify-between gap-4">
                <button
                    onClick={() => nav("/log")}
                    className="h-[46px] flex-1 rounded-full !text-[11px] font-medium text-white shadow-[0_10px_18px_rgba(99,102,241,0.20)] active:scale-[0.99]"
                    style={{ backgroundColor: "#6366F1" }}
                >
                    Log today’s session
                </button>

                <button
                    onClick={logRestDay}
                    className="h-[46px] flex-1 rounded-full bg-[#9AA0A6] !text-[11px] font-medium text-white shadow-[0_10px_18px_rgba(0,0,0,0.10)] active:scale-[0.99]"
                >
                    Log rest day
                </button>
            </div>

            <div className="mt-7 overflow-hidden rounded-[18px]">
                <div className="bg-[#DFE8FF] px-5 py-4">
                    <h2 className="text-[22px] font-medium text-[#111827]">
                        Highlight of the week
                    </h2>
                </div>

                <div className="px-5 py-5">
                    <div className="space-y-6">
                        <HighlightRow
                            icon={<CrownIcon className="h-6 w-6 text-[#111827]" />}
                            text={weekly[0] ?? "“Log once this week: keep it alive”"}
                        />
                        <HighlightRow
                            icon={<TrophyIcon className="h-6 w-6 text-[#111827]" />}
                            text={weekly[1] ?? "“Heaviest set: coming soon”"}
                        />
                        <HighlightRow
                            icon={<GiftIcon className="h-6 w-6 text-[#111827]" />}
                            text={weekly[2] ?? "“Most consistent lift: coming soon”"}
                        />
                    </div>
                </div>
            </div>

            <div className="h-6" />
        </div>
    );
}

function TopPill({ title }: { title: string }) {
    return (
        <div className="relative h-[56px] w-full rounded-[18px] bg-[#DFE8FF]">
            {/*Circle button (placeholder image later)*/}
            <button
                type="button"
                aria-label="Avatar"
                className="absolute left-4 top-1/2 -translate-y-1/2"
            >
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#111827] shadow-[0_4px_10px_rgba(0,0,0,0.18)] active:scale-[0.98]">
                    {/* Replace with avatar image later */}
                    {/* <img src="/assets/avatar.png" alt="avatar" className="h-full w-full object-cover" /> */}
                    <UserIcon className="h-5 w-5 text-white opacity-90" />
                </div>
            </button>

            <div className="flex h-full items-center justify-center">
                <span className="text-[22px] font-medium text-[#111827]">{title}</span>
            </div>
        </div>
    );
}

function HighlightRow({ icon, text }: { icon: React.ReactNode; text: string }) {
    return (
        <div className="flex items-start gap-4">
            <div className="mt-[2px]">{icon}</div>
            <p className="text-[13px] text-[#9CA3AF]">{text}</p>
        </div>
    );
}

/* Icons */
// Remember to replace UserIcon with an actual avatar image later
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



function CrownIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 24 24" fill="none" {...props}>
            <path
                d="M4 8l4 4 4-7 4 7 4-4v10H4V8Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
            />
            <path
                d="M6 18h12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />
        </svg>
    );
}

function TrophyIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 24 24" fill="none" {...props}>
            <path
                d="M8 4h8v4a4 4 0 0 1-8 0V4Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
            />
            <path
                d="M6 4H4v3a4 4 0 0 0 4 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />
            <path
                d="M18 4h2v3a4 4 0 0 1-4 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />
            <path
                d="M12 12v4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />
            <path
                d="M8 20h8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />
            <path
                d="M10 16h4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />
        </svg>
    );
}

function GiftIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 24 24" fill="none" {...props}>
            <path
                d="M4 10h16v10H4V10Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
            />
            <path
                d="M12 10v10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />
            <path
                d="M4 10V7h16v3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
            />
            <path
                d="M12 7c-1.2 0-3-1.2-3-2.5S10.2 2 12 4.2C13.8 2 15 3.2 15 4.5S13.2 7 12 7Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
            />
        </svg>
    );
}
