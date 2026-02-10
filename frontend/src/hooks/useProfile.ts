import { useEffect, useMemo, useState } from "react";
import { DEFAULT_PROFILE, type Profile } from "../profile";

const STORAGE_KEY = "lifting:profile:v1";

function safeParse(json: string | null): Profile | null {
    if (!json) return null;
    try {
        return JSON.parse(json) as Profile;
    } catch {
        return null;
    }
}

export function useProfile() {
    const [profile, setProfile] = useState<Profile>(() => {
        const stored = safeParse(localStorage.getItem(STORAGE_KEY));
        return stored ?? DEFAULT_PROFILE;
    });

    useEffect(() => {
        const next: Profile = { ...profile, updatedAt: new Date().toISOString() };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(profile)]);

    const api = useMemo(() => {
        return {
            profile,
            setProfile,
            resetProfile: () => setProfile(DEFAULT_PROFILE),
        };
    }, [profile]);

    return api;
}
