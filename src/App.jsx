import { BrowserRouter, Route, Routes } from "react-router-dom";
import AppLayout from "./layouts/AppLayout.jsx";
import HomePage from "./pages/HomePage.jsx";
import FormPage from "./pages/FormPage.jsx";
import AdminDashboardPage from "./pages/AdminDashboardPage.jsx";
import AuthCallback from "./components/AuthCallback.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import { auth } from "./firebaseClient.js";
import { onAuthStateChanged } from "firebase/auth";
import { GlobalProvider } from "./context/GlobalContext.jsx";
import Toaster from "./components/Toaster.jsx";
import { useEffect, useState } from "react";

function App() {

    const [session, setSession] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setSession(user);
        });
        return () => unsubscribe();
    }, []);

    return (
        <GlobalProvider>
            <BrowserRouter>
                <Routes>
                    <Route element={<AppLayout />}>

                        <Route path="/login" element={<AuthPage />} />
                        <Route path="/auth/callback" element={<AuthCallback />} />

                        <Route
                            path="/admin-dashboard"
                            element={session ? <AdminDashboardPage /> : <AuthPage />}
                        />

                        <Route path="/" element={<HomePage />} />
                        <Route path="/form/:date" element={<FormPage />} />

                    </Route>
                </Routes>
            </BrowserRouter>
            <Toaster />
        </GlobalProvider>
    );
};

export default App;
