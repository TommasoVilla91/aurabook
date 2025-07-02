import { BrowserRouter, Route, Routes } from "react-router-dom";
import AppLayout from "./layouts/AppLayout.jsx";
import HomePage from "./pages/HomePage.jsx";
import FormPage from "./pages/FormPage.jsx";

function App() {

    return (
        <BrowserRouter>
            <Routes>
                <Route element={<AppLayout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/form/:date" element={<FormPage />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
};

export default App;