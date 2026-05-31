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

      {/* ✅ Day 46 — Profile Management */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* ✅ Day 47 — Admin User Management */}
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <Users />
          </ProtectedRoute>
        }
      />

      {/* ✅ Day 48 — Admin Security Dashboard */}
      <Route
        path="/security-dashboard"
        element={
          <ProtectedRoute>
            <SecurityDashboard />
          </ProtectedRoute>
        }
      />

      {/* ✅ Day 49 — Personal Activity Log */}
      <Route
        path="/my-activity"
        element={
          <ProtectedRoute>
            <MyActivity />
          </ProtectedRoute>
        }
      />

      {/* ✅ Day 55 — Admin Active Sessions Manager */}
      <Route
        path="/active-sessions"
        element={
          <ProtectedRoute>
            <ActiveSessions />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;