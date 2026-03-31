import { BrowserRouter, Route, Routes } from "react-router-dom";
import AppLayout from "./layouts/AppLayout.jsx";
import HomePage from "./pages/HomePage.jsx";
import FormPage from "./pages/FormPage.jsx";
import AdminDashboardPage from "./pages/AdminDashboardPage.jsx";
import AuthCallback from "./components/AuthCallback.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import { GlobalProvider, useGlobalContext } from "./context/GlobalContext.jsx";
import Toaster from "./components/Toaster.jsx";

// Wrapper che legge session dal GlobalContext (già gestito lì via onAuthStateChanged)
function AppRoutes() {
    const { session } = useGlobalContext();

    return (
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
    );
}

function App() {
    return (
        <GlobalProvider>
            <AppRoutes />
            <Toaster />
        </GlobalProvider>
    );
};

export default App;
