import { Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";

import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import RegisterStatusPage from "@/pages/RegisterStatusPage";
import AdminLoginPage from "@/pages/AdminLoginPage";
import AdminDashboardPage from "@/pages/AdminDashboardPage";
import AdminApplicationsPage from "@/pages/AdminApplicationsPage";
import AdminCliniciansPage from "@/pages/AdminCliniciansPage";
import ClinicianDashboardPage from "@/pages/ClinicianDashboardPage";
import PatientListPage from "@/pages/PatientListPage";
import PatientDetailPage from "@/pages/PatientDetailPage";
import AlertsCentrePage from "@/pages/AlertsCentrePage";
import AssignmentsPage from "@/pages/AssignmentsPage";
import ProfilePage from "@/pages/ProfilePage";
import NotFoundPage from "@/pages/NotFoundPage";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/register/status" element={<RegisterStatusPage />} />

        {/* Admin routes */}
        <Route path="/admin" element={<AdminLoginPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin/applications" element={<AdminApplicationsPage />} />
        <Route path="/admin/clinicians" element={<AdminCliniciansPage />} />

        {/* Clinician routes */}
        <Route path="/dashboard" element={<ClinicianDashboardPage />} />
        <Route path="/patients" element={<PatientListPage />} />
        <Route path="/patients/:id" element={<PatientDetailPage />} />
        <Route path="/alerts" element={<AlertsCentrePage />} />
        <Route path="/assignments" element={<AssignmentsPage />} />
        <Route path="/profile" element={<ProfilePage />} />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: "var(--radius-xl)",
            border: "1px solid var(--border)",
            background: "var(--card)",
            color: "var(--foreground)",
          },
        }}
      />
    </AuthProvider>
  );
}
