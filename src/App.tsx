import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import ChatPage from "./pages/ChatPage";
import RegisterPage from "./pages/RegisterPage";
import StatsPage from "./pages/StatsPage";
import SettingsPage from "./pages/SettingsPage";
import PlanSelection from "./pages/PlanSelection";
import HomePage from "./pages/HomePage";
import ABAPage from "./pages/ABAPage";
import LearningMode from "./pages/LearningMode";
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";
import LanguageSwitcher from "./components/LanguageSwitcher";

import { LanguageProvider } from "./context/LanguageContext";
import { AuthProvider, useAuth } from "./context/AuthContext";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              
              <Route path="/" element={
                <ProtectedRoute>
                  <>
                    <LanguageSwitcher />
                    <HomePage />
                  </>
                </ProtectedRoute>
              } />

              <Route path="/plans" element={
                <ProtectedRoute>
                  <>
                    <LanguageSwitcher />
                    <PlanSelection />
                  </>
                </ProtectedRoute>
              } />

              <Route element={
                <ProtectedRoute>
                  <>
                    <LanguageSwitcher />
                    <AppLayout />
                  </>
                </ProtectedRoute>
              }>
                <Route path="/dashboard/:planId" element={<Dashboard />} />
                <Route path="/register/:planId" element={<RegisterPage />} />
                <Route path="/stats" element={<StatsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/aba" element={<ABAPage />} />
                <Route path="/learning" element={<LearningMode />} />
              </Route>
              
              <Route path="/chat" element={
                <ProtectedRoute>
                  <>
                    <LanguageSwitcher />
                    <ChatPage />
                  </>
                </ProtectedRoute>
              } />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
