import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";

function AppLayout() {
    const { pathname, hash } = useLocation();

    useEffect(() => {
        if (!hash) window.scrollTo(0, 0);
    }, [pathname, hash]);

    return (
        <>
            <Navbar />
            <div key={pathname} className="page-enter">
                <Outlet />
            </div>
        </>
    );
};

export default AppLayout;
