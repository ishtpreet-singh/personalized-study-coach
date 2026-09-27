import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from "./store/AuthContext";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import MainLayout from "./components/layout/MainLayout";
import AuthLayout from "./components/layout/AuthLayout";

import { GoogleOAuthProvider } from "@react-oauth/google";

import Landing from "./pages/Landing";
import Help from './pages/Help';
import FAQ from './pages/help/FAQ';
import Documentation from './pages/help/Documentation';
import ContactSupport from './pages/help/ContactSupport';
import BugReport from './pages/help/BugReport';

import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/auth/VerifyEmail";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Calendar from "./pages/Calendar";
import Planner from "./pages/Planner";
import Documents from "./pages/Documents";
import Settings from "./pages/Settings";
import Chat from "./pages/Chat";
import SubjectWorkspace from "./pages/subjects/SubjectWorkspace";
import LearningProfile from "./pages/subjects/LearningProfile";
import Analytics from "./pages/subjects/Analytics";

import QuizList from "./pages/quizzes/QuizList";
import QuizConfigurator from "./pages/quizzes/QuizConfigurator";
import QuizPlayer from "./pages/quizzes/QuizPlayer";
import QuizResult from "./pages/quizzes/QuizResult";
import QuizHistory from "./pages/quizzes/QuizHistory";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "dummy-client-id.apps.googleusercontent.com";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>
        <Toaster position="top-right" />
        <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Landing Page */}
            <Route path="/" element={<Landing />} />
            <Route path="/help" element={<Help />} />
            <Route path="/help/faq" element={<FAQ />} />
            <Route path="/help/docs" element={<Documentation />} />
            <Route path="/help/contact" element={<ContactSupport />} />
            <Route path="/help/bug-report" element={<BugReport />} />

            {/* Authentication Pages */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
            </Route>

            {/* Authenticated Dashboard Pages */}
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/planner" element={<Planner />} />
                
                {/* Subject Workspace Routes */}
                <Route path="/subjects/:id" element={<SubjectWorkspace />}>
                  <Route index element={<Navigate to="tutor" replace />} />
                  <Route path="tutor" element={<Chat />} />
                  <Route path="documents" element={<Documents />} />
                  <Route path="quizzes" element={<QuizList />} />
                  <Route path="quizzes/create" element={<QuizConfigurator />} />
                  <Route path="quizzes/play/:attemptId" element={<QuizPlayer />} />
                  <Route path="quizzes/result/:attemptId" element={<QuizResult />} />
                  <Route path="profile" element={<LearningProfile />} />
                  <Route path="analytics" element={<Analytics />} />
                </Route>

                <Route path="/quizzes/history" element={<QuizHistory />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
