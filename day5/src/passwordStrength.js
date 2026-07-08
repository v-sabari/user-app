// Centralized password-strength scoring.
// Identical logic previously duplicated in Register.jsx, ResetPassword.jsx
// and Profile.jsx — same thresholds, same output shape, just one copy.
export const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: "", color: "" };

  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: "Weak", color: "var(--danger)" };
  if (score === 2) return { score: 2, label: "Fair", color: "var(--warning)" };
  if (score === 3) return { score: 3, label: "Good", color: "var(--primary)" };
  return { score: 4, label: "Strong", color: "var(--success)" };
};
