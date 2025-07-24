import { NavLink } from "react-router-dom";
import styles from "./Navbar.module.css";

function Navbar() {

    const navLinks = [
        {
            path: "/",
            title: "Home"
        },
        {
            path: "/login",
            title: "Accedi"
        }
    ];

    return (
        <nav className={styles.navbar}>
            {navLinks.map((link, index) => (
                <NavLink key={index} to={link.path}>{link.title}</NavLink>
            ))}
        </nav>
    );
};

export default Navbar;