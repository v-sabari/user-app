import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, logoutUser } from "./apiClient";
import { Button, Banner, StatCard, PasswordStrengthMeter, MatchHint } from "./ui";

function Profile() {
  const navigate = useNavigate();

  // ================= STATE =================
  const [profile, setProfile] = useState(null);
  const [editName, setEditName] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Email update state
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "", newPassword: "", confirmPassword: "",
  });

  const [securitySummary, setSecuritySummary] = useState(null);

  // ✅ Day 73 — Login stats state
  const [loginStats, setLoginStats] = useState(null);
  const [loginStatsLoading, setLoginStatsLoading] = useState(true);

  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Delete account state
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // ================= LOGOUT =================
  const handleLogout = () => { logoutUser(); navigate("/login"); };

  // ================= FETCH PROFILE =================
  const fetchProfile = async () => {
    try {
      const data = await apiRequest("/profile", { method: "GET" });
      setProfile(data.data);
      setEditName(data.data.name);
    } catch (err) {
      if (err.message === "Session expired") { logoutUser(); navigate("/login"); }
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

  // ✅ Day 73 — FETCH LOGIN STATS =================
  const fetchLoginStats = async () => {
    setLoginStatsLoading(true);
    try {
      const data = await apiRequest("/profile/login-stats", { method: "GET" });
      setLoginStats(data.data);
    } catch (err) {
      console.error("Login stats error:", err.message);
    } finally {
      setLoginStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchSecuritySummary();
    fetchLoginStats();
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
      setProfileMessage("Name updated successfully");
    } catch (err) {
      setProfileError(err.message || "Failed to update profile");
    }
  };

  // ================= UPDATE EMAIL =================
  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    setEmailMessage(""); setEmailError("");
    if (!newEmail.trim() || !newEmail.includes("@")) { setEmailError("Please enter a valid email address"); return; }
    if (newEmail.trim().toLowerCase() === profile.email.toLowerCase()) { setEmailError("New email is the same as your current email"); return; }
    if (!emailPassword) { setEmailError("Please enter your current password to confirm"); return; }
    setEmailLoading(true);
    try {
      await apiRequest("/profile/email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail: newEmail.trim().toLowerCase(), confirmPassword: emailPassword }),
      });
      setEmailMessage("Email updated successfully. Redirecting to login...");
      setTimeout(() => { logoutUser(); navigate("/login"); }, 2000);
    } catch (err) {
      setEmailError(err.message || "Failed to update email");
    } finally {
      setEmailLoading(false);
    }
  };

  // ================= CHANGE PASSWORD =================
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage(""); setPasswordError("");
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New password and confirm password do not match"); return;
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

  // ================= DELETE ACCOUNT =================
  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setDeleteError("");
    if (!deleteConfirmPassword) { setDeleteError("Please enter your password to confirm deletion"); return; }
    setDeleteLoading(true);
    try {
      await apiRequest("/profile/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmPassword: deleteConfirmPassword }),
      });
      logoutUser(); navigate("/register");
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

  // ✅ Day 73 — Health status helpers
  const getHealthColor = (status) => {
    if (status === "AT_RISK") return "#dc2626";
    if (status === "CAUTION") return "#d97706";
    return "#16a34a";
  };

  const getHealthBg = (status) => {
    if (status === "AT_RISK") return "#fee2e2";
    if (status === "CAUTION") return "#fef3c7";
    return "#dcfce7";
  };

  const getHealthIcon = (status) => {
    if (status === "AT_RISK") return "🚨";
    if (status === "CAUTION") return "⚠️";
    return "✅";
  };

  // ================= DATE FORMATTER =================
  const formatDateTime = (val) => {
    if (!val) return "Never";
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
            <Button variant="secondary" onClick={() => navigate("/dashboard")}>Dashboard</Button>
            <Button variant="secondary" onClick={() => navigate("/my-activity")}>My activity</Button>
            <Button variant="secondary" onClick={handleLogout}>Logout</Button>
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
                  <span className={profile.status === "ACTIVE" ? "status-badge status-active" : profile.status === "LOCKED" ? "status-badge status-locked" : "status-badge status-inactive"}>
                    {profile.status}
                  </span>
                </p>
              </div>
              <div style={{ marginTop: "16px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <Button variant="secondary"
                  onClick={() => { setIsEditing(true); setProfileMessage(""); setProfileError(""); }}>
                  Edit name
                </Button>
                <Button variant="secondary" style={{ background: "var(--info)", color: "#fff" }}
                  onClick={() => { setIsEditingEmail(true); setNewEmail(""); setEmailPassword(""); setEmailMessage(""); setEmailError(""); }}>
                  Edit email
                </Button>
                {/* ✅ Day 81 — 2FA Setup Button */}
                <Button variant="secondary" style={{ background: "#7c3aed", color: "#fff" }}
                  onClick={() => navigate("/2fa-setup")}>
                  🔐 Setup 2FA
                </Button>
              </div>
            </>
          )}

          {isEditing && (
            <form onSubmit={handleUpdateProfile}>
              <input type="text" placeholder="Enter new name" value={editName}
                onChange={(e) => setEditName(e.target.value)} minLength={2} maxLength={50} required />
              <div className="inline-actions" style={{ marginTop: "10px" }}>
                <Button type="submit" variant="primary">Save name</Button>
                <Button type="button" variant="secondary" onClick={() => { setIsEditing(false); setEditName(profile.name); setProfileError(""); }}>Cancel</Button>
              </div>
            </form>
          )}
        </div>

        {/* ===== UPDATE EMAIL SECTION ===== */}
        {isEditingEmail && (
          <div className="info-panel">
            <h3 style={{ margin: "0 0 8px", color: "#0369a1" }}>✉️ Update email address</h3>
            <p style={{ color: "#0c4a6e", fontSize: "13px", marginBottom: "16px", lineHeight: "1.6" }}>
              After updating your email, all sessions will be invalidated. Use your <strong>new email</strong> to sign back in.
            </p>
            {emailMessage && <Banner tone="success" style={{ marginBottom: "14px" }}>✅ {emailMessage}</Banner>}
            {emailError && <Banner tone="danger" style={{ marginBottom: "14px" }}>❌ {emailError}</Banner>}
            <form onSubmit={handleUpdateEmail}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "5px" }}>Current email</label>
              <input type="email" value={profile?.email || ""} disabled style={{ background: "#f3f4f6", color: "#6b7280", cursor: "not-allowed" }} />
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "5px", marginTop: "4px" }}>New email address</label>
              <input type="email" placeholder="Enter new email address" value={newEmail}
                onChange={(e) => { setNewEmail(e.target.value); setEmailError(""); }} required autoFocus />
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "5px", marginTop: "4px" }}>Confirm with password</label>
              <input type="password" placeholder="Enter current password to confirm"
                value={emailPassword} onChange={(e) => { setEmailPassword(e.target.value); setEmailError(""); }} required />
              <div className="inline-actions" style={{ marginTop: "10px" }}>
                <Button type="submit" variant="secondary" style={{ background: "var(--info)", color: "#fff" }} disabled={emailLoading}>
                  {emailLoading ? "Updating…" : "Update email"}
                </Button>
                <Button type="button" variant="secondary" onClick={() => { setIsEditingEmail(false); setEmailError(""); setEmailMessage(""); }}>Cancel</Button>
              </div>
            </form>
          </div>
        )}

        {/* ===== DAY 73 — LOGIN STATISTICS SECTION ===== */}
        <div className="dashboard-section">
          <h3>🔐 Login statistics</h3>
          <p className="welcome-text" style={{ marginBottom: "16px" }}>
            Your personal account security metrics.
          </p>

          {loginStatsLoading ? (
            <p style={{ color: "var(--faint)", fontSize: "13px" }}>Loading login statistics...</p>
          ) : !loginStats ? (
            <p style={{ color: "var(--faint)", fontSize: "13px" }}>Could not load stats.</p>
          ) : (
            <>
              {/* ✅ Health status banner */}
              <div style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "12px 16px", borderRadius: "10px",
                background: getHealthBg(loginStats.healthStatus),
                border: `1px solid ${getHealthColor(loginStats.healthStatus)}30`,
                marginBottom: "16px",
              }}>
                <span style={{ fontSize: "20px" }}>{getHealthIcon(loginStats.healthStatus)}</span>
                <div>
                  <p style={{ margin: 0, fontWeight: "700", color: getHealthColor(loginStats.healthStatus), fontSize: "14px" }}>
                    Account security: {loginStats.healthStatus === "AT_RISK" ? "At risk" : loginStats.healthStatus === "CAUTION" ? "Needs attention" : "Healthy"}
                  </p>
                  <p style={{ margin: 0, fontSize: "12px", color: "var(--muted)" }}>
                    {loginStats.healthStatus === "AT_RISK"
                      ? "High number of failed logins detected. Consider changing your password."
                      : loginStats.healthStatus === "CAUTION"
                      ? "Some failed login attempts detected in the last 7 days."
                      : "No suspicious activity detected on your account."}
                  </p>
                </div>
              </div>

              {/* ✅ 4 stat cards */}
              <div className="stat-grid">

                <StatCard
                  label="Total logins"
                  value={loginStats.totalLogins ?? 0}
                  sub="successful all time"
                  accent="var(--primary)"
                  valueColor="var(--primary)"
                />

                <StatCard
                  label="Failed (7 days)"
                  value={loginStats.recentFailedLogins ?? 0}
                  sub={loginStats.recentFailedLogins === 0 ? "✅ none detected" : "failed attempts"}
                  accent={loginStats.recentFailedLogins > 0 ? "var(--danger)" : "var(--success)"}
                  valueColor={loginStats.recentFailedLogins > 0 ? "var(--danger)" : "var(--success)"}
                />

                <StatCard
                  label="Total actions"
                  value={loginStats.totalActions ?? 0}
                  sub="audit log entries"
                  accent="#7c3aed"
                  valueColor="#7c3aed"
                />

                <StatCard
                  label="Last login"
                  value={loginStats.lastLoginAt ? formatDateTime(loginStats.lastLoginAt) : "Never"}
                  accent="var(--info)"
                  valueColor="var(--info)"
                />

              </div>
            </>
          )}
        </div>

        {/* ===== CHANGE PASSWORD SECTION ===== */}
        <div className="dashboard-section">
          <h3>Change password</h3>
          <p className="welcome-text" style={{ marginBottom: "12px" }}>
            After changing your password, all sessions will be invalidated and you will be redirected to login.
          </p>
          {passwordMessage && <p className="message">{passwordMessage}</p>}
          {passwordError && <p className="error-message">{passwordError}</p>}
          <form onSubmit={handleChangePassword}>
            <input type="password" placeholder="Current password" value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} required />
            <input type="password" placeholder="New password (min 6 characters)" value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} required minLength={6} />
            <PasswordStrengthMeter password={passwordForm.newPassword} />
            <input type="password" placeholder="Confirm new password" value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} required minLength={6} />
            {passwordForm.confirmPassword.length > 0 && (
              <MatchHint matches={passwordForm.newPassword === passwordForm.confirmPassword} />
            )}
            <Button type="submit" variant="primary">Change password</Button>
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
                <div className="analytics-card"><p>Total Sessions</p><h3>{securitySummary.totalSessions}</h3></div>
                <div className="analytics-card"><p>Active Sessions</p><h3>{securitySummary.activeSessions}</h3></div>
                <div className="analytics-card">
                  <p>Suspicious Sessions</p>
                  <h3 style={{ color: securitySummary.suspiciousSessions > 0 ? "#dc2626" : "#111827" }}>{securitySummary.suspiciousSessions}</h3>
                </div>
                <div className="analytics-card">
                  <p>Risk Level</p>
                  <h3>
                    <span style={{ display: "inline-block", padding: "4px 14px", borderRadius: "999px", fontSize: "16px", fontWeight: "700", background: getRiskBg(securitySummary.riskLevel), color: getRiskColor(securitySummary.riskLevel) }}>
                      {securitySummary.riskLevel}
                    </span>
                  </h3>
                </div>
              </div>
              <div className="user-list">
                <div className="user-card">
                  <p><strong>Devices Used</strong></p>
                  {securitySummary.devicesUsed?.length > 0
                    ? securitySummary.devicesUsed.map((device, i) => <p key={i} style={{ color: "#4b5563" }}>{device}</p>)
                    : <p style={{ color: "#9ca3af" }}>No device data</p>}
                </div>
                <div className="user-card">
                  <p><strong>Last Login</strong></p>
                  <p style={{ color: "#4b5563" }}>{formatDateTime(securitySummary.lastLoginTime)}</p>
                </div>
                <div className="user-card">
                  <p><strong>Recent Actions</strong></p>
                  {securitySummary.recentActions?.length > 0
                    ? securitySummary.recentActions.map((action, i) => <p key={i} style={{ color: "#4b5563" }}>{action}</p>)
                    : <p style={{ color: "#9ca3af" }}>No recent actions</p>}
                </div>
              </div>
            </>
          )}
        </div>

        {/* ===== DANGER ZONE ===== */}
        <div className="danger-zone" style={{ marginTop: "8px" }}>
          <h3 style={{ color: "var(--danger)", margin: "0 0 8px" }}>⚠️ Danger zone</h3>
          <p style={{ color: "var(--muted)", fontSize: "14px", marginBottom: "16px", lineHeight: "1.6" }}>
            Permanently delete your account and all associated data. This action <strong>cannot be undone</strong>.
          </p>
          {!showDeleteConfirm ? (
            <Button type="button" variant="secondary"
              onClick={() => { setShowDeleteConfirm(true); setDeleteError(""); setDeleteConfirmPassword(""); }}
              style={{ background: "transparent", color: "var(--danger)", border: "2px solid var(--danger)" }}>
              Delete my account
            </Button>
          ) : (
            <form onSubmit={handleDeleteAccount}>
              <p style={{ fontSize: "14px", fontWeight: "600", color: "var(--ink-soft)", marginBottom: "8px" }}>Enter your current password to confirm:</p>
              <input type="password" placeholder="Enter your password to confirm"
                value={deleteConfirmPassword}
                onChange={(e) => { setDeleteConfirmPassword(e.target.value); setDeleteError(""); }}
                required autoFocus />
              {deleteError && <p style={{ margin: "-8px 0 12px", fontSize: "13px", color: "var(--danger)", fontWeight: "600" }}>❌ {deleteError}</p>}
              <div className="inline-actions" style={{ marginTop: "4px" }}>
                <Button type="submit" variant="danger" disabled={deleteLoading}>
                  {deleteLoading ? "Deleting…" : "Confirm delete account"}
                </Button>
                <Button type="button" variant="secondary"
                  onClick={() => { setShowDeleteConfirm(false); setDeleteError(""); setDeleteConfirmPassword(""); }}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}

export default Profile;