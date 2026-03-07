import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import FintechMainPage from "./components/FintechMainPage";
import LandingPage from "./components/LandingPage";
import LoginPage from "./components/LoginPage";

export default function App() {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route path="/" element={<LandingPage onLoginSuccess={() => navigate("/app")} />} />
      <Route path="/app" element={<FintechMainPage />} />
      <Route path="/login" element={<LoginPage onAuthSuccess={() => navigate("/app")} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
