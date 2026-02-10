export type Units = "kg" | "lb";
export type Experience = "beginner" | "intermediate" | "advanced";
export type Goal = "strength" | "hypertrophy" | "general" | "cut" | "bulk";

export type Profile = {
    name: string; // person's name
    goal: Goal;

    units: Units;
    targetDaysPerWeek: number; // 1..7
    experience: Experience; // beginner/intermediate/advanced

    syncEnabled: boolean; // false = local-only, true = sync

    updatedAt: string; // ISO
};

export const DEFAULT_PROFILE: Profile = {
    name: "",
    goal: "general",

    units: "lb",
    targetDaysPerWeek: 3,
    experience: "beginner",

    syncEnabled: false,

    updatedAt: new Date().toISOString(),
};
