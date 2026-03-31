import { NavLink, useNavigate } from "react-router-dom";
import styles from "./Navbar.module.css";
import { useGlobalContext } from "../context/GlobalContext";

function Navbar() {
    const { session, logout } = useGlobalContext();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    return (
        <nav className={styles.navbar}>
            <NavLink to="/">Home</NavLink>
            {session ? (
                <>
                    <NavLink to="/admin-dashboard">Dashboard</NavLink>
                    <button className={styles.logoutBtn} onClick={handleLogout}>Esci</button>
                </>
            ) : (
                <NavLink to="/login">Accedi</NavLink>
            )}
        </nav>
    );
};

export default Navbar;