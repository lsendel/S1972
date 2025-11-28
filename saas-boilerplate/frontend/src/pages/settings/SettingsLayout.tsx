import { Outlet } from "react-router-dom";

export default function SettingsLayout() {
    return (
        <div className="mx-auto max-w-2xl space-y-16 sm:space-y-20 lg:mx-0 lg:max-w-none">
            <Outlet />
        </div>
    );
}
