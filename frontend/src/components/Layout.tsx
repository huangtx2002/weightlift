import { Outlet } from "react-router-dom";
import Icons from "./Icons";

export default function Layout() {
    return (
        <div className="min-h-screen bg-[#F6F5F3] text-[#1F2933]">
            <div className="mx-auto max-w-[430px] min-h-screen pb-20">
                <Outlet />
            </div>
            <Icons />
        </div>
    );
}
