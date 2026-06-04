import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, logoutUser } from "./apiClient";

// ================= PASSWORD STRENGTH =================
const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return { score: 1, label: "Weak", color: "#dc2626" };
  if (score === 2) return { score: 2, label: "Fair", color: "#d97706" };
  if (score === 3) return { score: 3, label: "Good", color: "#2563eb" };
  return { score: 4, label: "Strong", color: "#16a34a" };
};

function Profile() {
  const navigate = useNavigate();

  // ================= STATE =================
  const [profile, setProfile] = useState(null);
  const [editName, setEditName] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [securitySummary, setSecuritySummary] = useState(null);

  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // ✅ Day 64 — Delete account state
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const newPasswordStrength = getPasswordStrength(passwordForm.newPassword);

  // ================= LOGOUT =================
  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  // ================= FETCH PROFILE =================
  const fetchProfile = async () => {
    try {
      const data = await apiRequest("/profile", { method: "GET" });
      setProfile(data.data);
      setEditName(data.data.name);
    } catch (err) {
      if (err.message === "Session expired") {
        logoutUser();
        navigate("/login");
      }
    }
  };

  // ================= FETCH SECURITY SUMMARY =================
  const fetchSecuritySummary = async () => {
    try {
      const data = await apiRequest("/profile/security-summary", { method: "GET" });
      setSecuritySummary(data.data);
    } catch (err) {
      console.error("Security summary error:", err.message);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchSecuritySummary();
  }, []);

  // ================= UPDATE PROFILE =================
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMessage(""); setProfileError("");

    try {
      const data = await apiRequest("/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, email: profile.email }),
      });
      setProfile(data.data);
      setEditName(data.data.name);
      setIsEditing(false);
      setProfileMessage("Profile updated successfully");
    } catch (err) {
      setProfileError(err.message || "Failed to update profile");
    }
  };

  // ================= CHANGE PASSWORD =================
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage(""); setPasswordError("");

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New password and confirm password do not match");
      return;
    }

    try {
      await apiRequest("/profile/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordForm),
      });

      setPasswordMessage("Password changed successfully. Redirecting to login...");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });

      setTimeout(() => { logoutUser(); navigate("/login"); }, 2000);

    } catch (err) {
      setPasswordError(err.message || "Failed to change password");
    }
  };

  // ================= DAY 64 — DELETE ACCOUNT =================
  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setDeleteError("");

    if (!deleteConfirmPassword) {
      setDeleteError("Please enter your password to confirm deletion");
      return;
    }

    setDeleteLoading(true);

    try {
      await apiRequest("/profile/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmPassword: deleteConfirmPassword }),
      });

      // ✅ Clear all local storage and redirect to register
      logoutUser();
      navigate("/register");

    } catch (err) {
      setDeleteError(err.message || "Failed to delete account");
    } finally {
      setDeleteLoading(false);
    }
  };

  // ================= RISK COLOR =================
  const getRiskColor = (level) => {
    if (level === "HIGH") return "#dc2626";
    if (level === "MEDIUM") return "#d97706";
    return "#16a34a";
  };

  const getRiskBg = (level) => {
    if (level === "HIGH") return "#fee2e2";
    if (level === "MEDIUM") return "#fef3c7";
    return "#dcfce7";
  };

  // ================= DATE FORMATTER =================
  const formatDateTime = (val) => {
    if (!val) return "N/A";
    if (Array.isArray(val)) {
      const [y, mo, d, h, min] = val;
      return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")} ${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
    }
    return new Date(val).toLocaleString();
  };

  // ================= RENDER =================
  return (
    <div className="container">
      <div className="card">

        {/* ===== HEADER ===== */}
        <div className="top-bar">
          <div>
            <h2>My Profile</h2>
            <p className="welcome-text">Manage your account settings and security overview.</p>
          </div>

          <div className="inline-actions">
            <button type="button" onClick={() => navigate("/dashboard")}>Dashboard</button>
            <button type="button" onClick={() => navigate("/my-activity")}>My Activity</button>
            <button type="button" className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>

        {/* ===== PROFILE INFO SECTION ===== */}
        <div className="dashboard-section">
          <h3>Profile Information</h3>

          {profileMessage && <p className="message">{profileMessage}</p>}
          {profileError && <p className="error-message">{profileError}</p>}

          {profile && !isEditing && (
            <>
              <div className="dashboard-meta">
                <p><strong>Name:</strong> {profile.name}</p>
                <p><strong>Email:</strong> {profile.email}</p>
                <p><strong>Role:</strong> {profile.role}</p>
                <p>
                  <strong>Status:</strong>{" "}
                  <span className={
                    profile.status === "ACTIVE" ? "status-badge status-active"
                    : profile.status === "LOCKED" ? "status-badge status-locked"
                    : "status-badge status-inactive"
                  }>
                    {profile.status}
                  </span>
                </p>
              </div>

              <div style={{ marginTop: "16px" }}>
                <button type="button" style={{ width: "auto", minWidth: "140px" }}
                  onClick={() => { setIsEditing(true); setProfileMessage(""); setProfileError(""); }}>
                  Edit Name
                </button>
              </div>
            </>
          )}

          {isEditing && (
            <form onSubmit={handleUpdateProfile}>
              <input type="text" placeholder="Enter new name" value={editName}
                onChange={(e) => setEditName(e.target.value)} minLength={2} maxLength={50} required />
              <div className="inline-actions" style={{ marginTop: "10px" }}>
                <button type="submit">Save Changes</button>
                <button type="button" onClick={() => { setIsEditing(false); setEditName(profile.name); setProfileError(""); }}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* ===== CHANGE PASSWORD SECTION ===== */}
        <div className="dashboard-section">
          <h3>Change Password</h3>

          <p className="welcome-text" style={{ marginBottom: "12px" }}>
            After changing your password, all sessions will be invalidated and you will be redirected to login.
          </p>

          {passwordMessage && <p className="message">{passwordMessage}</p>}
          {passwordError && <p className="error-message">{passwordError}</p>}

          <form onSubmit={handleChangePassword}>
            <input type="password" placeholder="Current password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              required />

            <input type="password" placeholder="New password (min 6 characters)"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              required minLength={6} />

            {/* ===== PASSWORD STRENGTH INDICATOR ===== */}
            {passwordForm.newPassword.length > 0 && (
              <div style={{ marginTop: "-8px", marginBottom: "12px" }}>
                <div style={{ display: "flex", gap: "4px", marginBottom: "5px" }}>
                  {[1, 2, 3, 4].map((level) => (
                    <div key={level} style={{
                      flex: 1, height: "4px", borderRadius: "999px",
                      background: newPasswordStrength.score >= level ? newPasswordStrength.color : "#e5e7eb",
                      transition: "background 0.3s ease",
                    }} />
                  ))}
                </div>
                <p style={{ margin: 0, fontSize: "12px", fontWeight: "600", color: newPasswordStrength.color }}>
                  {newPasswordStrength.label} password
                </p>
              </div>
            )}

            <input type="password" placeholder="Confirm new password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              required minLength={6} />

            {passwordForm.confirmPassword.length > 0 && (
              <p style={{ margin: "-8px 0 12px", fontSize: "12px", fontWeight: "600",
                color: passwordForm.newPassword === passwordForm.confirmPassword ? "#16a34a" : "#dc2626" }}>
                {passwordForm.newPassword === passwordForm.confirmPassword ? "✅ Passwords match" : "❌ Passwords do not match"}
              </p>
            )}

            <button type="submit">Change Password</button>
          </form>
        </div>

        {/* ===== SECURITY SUMMARY SECTION ===== */}
        <div className="dashboard-section">
          <h3>Security Summary</h3>

          {!securitySummary ? (
            <p>Loading security summary...</p>
          ) : (
            <>
              <div className="analytics-grid">
                <div className="analytics-card">
                  <p>Total Sessions</p>
                  <h3>{securitySummary.totalSessions}</h3>
                </div>
                <div className="analytics-card">
                  <p>Active Sessions</p>
                  <h3>{securitySummary.activeSessions}</h3>
                </div>
                <div className="analytics-card">
                  <p>Suspicious Sessions</p>
                  <h3 style={{ color: securitySummary.suspiciousSessions > 0 ? "#dc2626" : "#111827" }}>
                    {securitySummary.suspiciousSessions}
                  </h3>
                </div>
                <div className="analytics-card">
                  <p>Risk Level</p>
                  <h3>
                    <span style={{
                      display: "inline-block", padding: "4px 14px", borderRadius: "999px",
                      fontSize: "16px", fontWeight: "700",
                      background: getRiskBg(securitySummary.riskLevel),
                      color: getRiskColor(securitySummary.riskLevel),
                    }}>
                      {securitySummary.riskLevel}
                    </span>
                  </h3>
                </div>
              </div>

              <div className="user-list">
                <div className="user-card">
                  <p><strong>Devices Used</strong></p>
                  {securitySummary.devicesUsed && securitySummary.devicesUsed.length > 0 ? (
                    securitySummary.devicesUsed.map((device, i) => (
                      <p key={i} style={{ color: "#4b5563" }}>{device}</p>
                    ))
                  ) : (
                    <p style={{ color: "#9ca3af" }}>No device data</p>
                  )}
                </div>
                <div className="user-card">
                  <p><strong>Last Login</strong></p>
                  <p style={{ color: "#4b5563" }}>{formatDateTime(securitySummary.lastLoginTime)}</p>
                </div>
                <div className="user-card">
                  <p><strong>Recent Actions</strong></p>
                  {securitySummary.recentActions && securitySummary.recentActions.length > 0 ? (
                    securitySummary.recentActions.map((action, i) => (
                      <p key={i} style={{ color: "#4b5563" }}>{action}</p>
                    ))
                  ) : (
                    <p style={{ color: "#9ca3af" }}>No recent actions</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* ===== DAY 64 — DELETE ACCOUNT DANGER ZONE ===== */}
        <div
          className="dashboard-section"
          style={{
            border: "1px solid #fecaca",
            borderRadius: "12px",
            background: "#fff1f2",
            padding: "20px",
            marginTop: "8px",
          }}
        >
          <h3 style={{ color: "#dc2626", margin: "0 0 8px" }}>⚠️ Danger Zone</h3>

          <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "16px", lineHeight: "1.6" }}>
            Permanently delete your account and all associated data. This action
            <strong> cannot be undone</strong>. All your active sessions will be
            immediately terminated.
          </p>

          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => { setShowDeleteConfirm(true); setDeleteError(""); setDeleteConfirmPassword(""); }}
              style={{
                width: "auto",
                minWidth: "180px",
                background: "transparent",
                color: "#dc2626",
                border: "2px solid #dc2626",
                borderRadius: "8px",
                padding: "8px 16px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px",
              }}
            >
              Delete My Account
            </button>
          ) : (
            <form onSubmit={handleDeleteAccount}>
              <p style={{ fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "8px" }}>
                Enter your current password to confirm:
              </p>

              <input
                type="password"
                placeholder="Enter your password to confirm"
                value={deleteConfirmPassword}
                onChange={(e) => {
                  setDeleteConfirmPassword(e.target.value);
                  setDeleteError("");
                }}
                required
                autoFocus
                style={{ borderColor: deleteError ? "#dc2626" : undefined }}
              />

              {deleteError && (
                <p style={{ margin: "-8px 0 12px", fontSize: "13px", color: "#dc2626", fontWeight: "600" }}>
                  ❌ {deleteError}
                </p>
              )}

              <div className="inline-actions" style={{ marginTop: "4px" }}>
                <button
                  type="submit"
                  disabled={deleteLoading}
                  style={{
                    width: "auto",
                    minWidth: "180px",
                    marginTop: 0,
                    background: deleteLoading ? "#9ca3af" : "#dc2626",
                  }}
                >
                  {deleteLoading ? "Deleting..." : "Confirm Delete Account"}
                </button>

                <button
                  type="button"
                  onClick={() => { setShowDeleteConfirm(false); setDeleteError(""); setDeleteConfirmPassword(""); }}
                  style={{ width: "auto", marginTop: 0, background: "#6b7280" }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}

export default Profile;