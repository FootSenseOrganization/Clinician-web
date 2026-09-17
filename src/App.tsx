import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PublicOnlyRoute } from "@/components/auth/PublicOnlyRoute";

import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import RegisterStatusPage from "@/pages/RegisterStatusPage";
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
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/register/status" element={<RegisterStatusPage />} />

        {/* Admin routes */}
        <Route
          path="/admin"
          element={
            <PublicOnlyRoute>
              <Navigate to="/login" replace />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/applications"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminApplicationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/clinicians"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminCliniciansPage />
            </ProtectedRoute>
          }
        />

        {/* Clinician routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRole="clinician">
              <ClinicianDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patients"
          element={
            <ProtectedRoute allowedRole="clinician">
              <PatientListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patients/:id"
          element={
            <ProtectedRoute allowedRole="clinician">
              <PatientDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/alerts"
          element={
            <ProtectedRoute allowedRole="clinician">
              <AlertsCentrePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/assignments"
          element={
            <ProtectedRoute allowedRole="clinician">
              <AssignmentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRole="clinician">
              <ProfilePage />
            </ProtectedRoute>
          }
        />

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
