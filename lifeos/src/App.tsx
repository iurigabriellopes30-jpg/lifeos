import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./shared/AuthContext";
import LandingPage from "./features/auth/LandingPage";
import LoginPage from "./features/auth/LoginPage";
import SignupPage from "./features/auth/SignupPage";
import OnboardingPage from "./features/auth/OnboardingPage";
import WelcomePage from "./features/auth/WelcomePage";
import LifeOSLayout from "./layouts/LifeOSLayout";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

  function AppRoutes() {
    const { isAuthenticated, loading, onboardingCompleted, consultationStarted } = useAuth();

    // Show loading screen while checking authentication
    if (loading) {
      return (
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "#1a1a1a",
          color: "#e0e0e0",
          flexDirection: "column",
          gap: "20px",
        }}>
          <h1>LifeOS</h1>
          <p>Carregando...</p>
        </div>
      );
    }

    // Se não autenticado, renderizar apenas rotas de auth
    if (!isAuthenticated) {
      return (
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      );
    }

    // Se autenticado mas não completou onboarding, redirecionar para onboarding
    if (!onboardingCompleted) {
      return (
        <Routes>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="*" element={<Navigate to="/onboarding" replace />} />
        </Routes>
      );
    }

    // Se completou onboarding mas não viu a tela de boas-vindas, mostrar welcome e permitir chat
    if (!consultationStarted) {
      return (
        <Routes>
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/*" element={<LifeOSLayout />} />
        </Routes>
      );
    }

    // Se autenticado, completou onboarding E viu boas-vindas, renderizar layout completo
    return (
      <Routes>
        <Route path="/*" element={<LifeOSLayout />} />
      </Routes>
    );
  }
