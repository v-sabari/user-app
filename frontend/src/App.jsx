import { Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import Login from "./Login";
import Register from "./Register";
import Dashboard from "./Dashboard";
import ProtectedRoute from "./ProtectedRoute";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";
import AuditLogs from "./AuditLogs";
import Analytics from "./Analytics";
import Profile from "./Profile";
import Users from "./Users";
import SecurityDashboard from "./SecurityDashboard";
import MyActivity from "./MyActivity";
import ActiveSessions from "./ActiveSessions";
import SecurityAudit from "./SecurityAudit";
import RiskAssessment from "./RiskAssessment";
import SecurityAlerts from "./SecurityAlerts";
import AdminAlerts from "./AdminAlerts";
import CriticalAlerts from "./CriticalAlerts";
import AlertHistory from "./AlertHistory";
// ✅ Day 81 — Import 2FA setup component
import TwoFactorSetup from "./TwoFactorSetup";
import LoginHistory from "./LoginHistory";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/audit-logs"
        element={
          <ProtectedRoute>
            <AuditLogs />
          </ProtectedRoute>
        }
      />

      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <Users />
          </ProtectedRoute>
        }
      />

      <Route
        path="/security-dashboard"
        element={
          <ProtectedRoute>
            <SecurityDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/my-activity"
        element={
          <ProtectedRoute>
            <MyActivity />
          </ProtectedRoute>
        }
      />

      <Route
        path="/active-sessions"
        element={
          <ProtectedRoute>
            <ActiveSessions />
          </ProtectedRoute>
        }
      />

      <Route
        path="/security-audit"
        element={
          <ProtectedRoute>
            <SecurityAudit />
          </ProtectedRoute>
        }
      />

      <Route
        path="/risk-assessment"
        element={
          <ProtectedRoute>
            <RiskAssessment />
          </ProtectedRoute>
        }
      />

      <Route
        path="/security-alerts"
        element={
          <ProtectedRoute>
            <SecurityAlerts />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/alerts"
        element={
          <ProtectedRoute>
            <AdminAlerts />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/alerts/critical"
        element={
          <ProtectedRoute>
            <CriticalAlerts />
          </ProtectedRoute>
        }
      />

      <Route
        path="/security-alerts/history"
        element={
          <ProtectedRoute>
            <AlertHistory />
          </ProtectedRoute>
        }
      />

      {/* ✅ Day 81 — Two-Factor Authentication Setup */}
      <Route
        path="/2fa-setup"
        element={
          <ProtectedRoute>
            <TwoFactorSetup />
          </ProtectedRoute>
        }
      />
      <Route
        path="/login-history"
        element={
          <ProtectedRoute>
            <LoginHistory />
          </ProtectedRoute>
        }
      />
    </Routes>
    
  );
}

export default App;