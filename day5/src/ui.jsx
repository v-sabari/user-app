import "./ui.css";
import { getPasswordStrength } from "./passwordStrength";

/* ================================================================
   Shared, purely presentational building blocks.
   These wrap existing markup/behavior — no page logic, no API
   calls, no state shape changes. Every prop a page already passes
   (onClick, type, disabled, value, onChange, etc.) is forwarded
   through unchanged.
   ================================================================ */

// ================= BUTTON =================
export function Button({
  variant = "primary",
  block = false,
  className = "",
  children,
  ...rest
}) {
  const cls = [
    "btn",
    `btn-${variant}`,
    block ? "btn-block" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}

// ================= BANNER =================
// tone: "success" | "danger" | "warning" | "info"
export function Banner({ tone = "info", children, className = "", ...rest }) {
  return (
    <div className={`banner banner-${tone} ${className}`} {...rest}>
      <div>{children}</div>
    </div>
  );
}

// ================= PASSWORD STRENGTH =================

export function PasswordStrengthMeter({ password }) {
  if (!password) return null;
  const strength = getPasswordStrength(password);

  return (
    <div className="pw-strength">
      <div className="pw-strength-track">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className="pw-strength-bar"
            style={{
              background: strength.score >= level ? strength.color : undefined,
            }}
          />
        ))}
      </div>
      <p className="pw-strength-label" style={{ color: strength.color }}>
        {strength.label} password
      </p>
    </div>
  );
}

// ================= MATCH HINT (confirm-password indicator) =================
export function MatchHint({ matches, matchText = "Passwords match", mismatchText = "Passwords do not match" }) {
  return (
    <p className={`field-hint ${matches ? "is-good" : "is-bad"}`}>
      {matches ? `✅ ${matchText}` : `❌ ${mismatchText}`}
    </p>
  );
}

// ================= AUTH BRAND MARK =================
export function AuthMark({ label = "SecureAuth" }) {
  return (
    <div className="auth-mark">
      <div className="auth-mark-badge">◆</div>
      <span className="auth-mark-name">{label}</span>
    </div>
  );
}
