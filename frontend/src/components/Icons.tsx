import { NavLink } from "react-router-dom";
import LogIcon from "../assets/notebook_fill-1.svg?react";
import CalendarIcon from "../assets/Date_fill.svg?react";
import HomeIcon from "../assets/home.svg?react";
import StatsIcon from "../assets/Line_up.svg?react";
import ProfileIcon from "../assets/User_box_fill.svg?react";

export default function Icons() {
    const itemBase = "flex items-center justify-center w-11 h-11";
    const iconBase = "w-[26px] h-[26px]";

    const color = (active: boolean) =>
        active ? "text-[#6366F1]" : "text-[#9CA3AF]";

    return (
        <div className="fixed bottom-0 left-0 right-0 border-t border-[#E5E7EB] bg-[#F6F5F3]">
            <div className="mx-auto max-w-[430px] h-16 px-8 flex items-center justify-between">
                <NavLink to="/log" className={({ isActive }) => `${itemBase} ${color(isActive)}`}>
                    <LogIcon className={iconBase} />
                </NavLink>

                <NavLink to="/calendar" className={({ isActive }) => `${itemBase} ${color(isActive)}`}>
                    <CalendarIcon className={iconBase} />
                </NavLink>

                <NavLink to="/" end className={({ isActive }) => `${itemBase} ${color(isActive)}`}>
                    <HomeIcon className={iconBase} />
                </NavLink>

                <NavLink to="/stats" className={({ isActive }) => `${itemBase} ${color(isActive)}`}>
                    <StatsIcon className={iconBase} />
                </NavLink>

                <NavLink to="/profile" className={({ isActive }) => `${itemBase} ${color(isActive)}`}>
                    <ProfileIcon className={iconBase} />
                </NavLink>
            </div>
        </div>
    );
}
