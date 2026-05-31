const API_BASE_URL = "http://localhost:8080";

// ================= JWT PARSER =================
const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
};

// ================= TOKEN EXPIRY =================
const isExpired = (token) => {
  if (!token) return true;

  const decoded = parseJwt(token);
  if (!decoded || !decoded.exp) return true;

  return Date.now() >= decoded.exp * 1000;
};

// ================= LOGOUT =================
export const logout = () => {
  localStorage.clear();
};

export const logoutUser = logout;

// ================= RESPONSE PARSER =================
const parseResponse = async (res) => {
  const text = await res.text();

  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Invalid server response");
  }
};

// ================= PUBLIC REQUEST =================
// Used for: login, register, forgot-password, reset-password
export const publicRequest = async (url, options = {}) => {
  const res = await fetch(`${API_BASE_URL}${url}`, options);
  const data = await parseResponse(res);

  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Request failed");
  }

  return data;
};

// ================= REFRESH ACCESS TOKEN =================
const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem("refreshToken");

  if (!refreshToken) {
    throw new Error("Session expired");
  }

  try {
    const data = await publicRequest("/auth/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    const newAccessToken =
      data.data.accessToken || data.data.token;

    const newRefreshToken =
      data.data.refreshToken || refreshToken;

    const role = data.data.role;

    if (!newAccessToken) {
      throw new Error("Invalid refresh response");
    }

    localStorage.setItem("token", newAccessToken);
    localStorage.setItem("refreshToken", newRefreshToken);

    if (role) {
      localStorage.setItem("role", role);
    }

    const decoded = parseJwt(newAccessToken);
    if (decoded?.sub) {
      localStorage.setItem("userEmail", decoded.sub);
    }

    return newAccessToken;
  } catch (error) {
    logout();
    throw new Error("Session expired");
  }
};

// ================= AUTH REQUEST =================
// Used for all protected endpoints — auto-refreshes token if expired
export const apiRequest = async (url, options = {}, retry = false) => {
  let token = localStorage.getItem("token");

  // Check if access token is expired — refresh if needed
  if (!token || isExpired(token)) {
    try {
      token = await refreshAccessToken();
    } catch {
      throw new Error("Session expired");
    }
  }

  const res = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  // Retry once on 401 — token may have just expired
  if (res.status === 401 && !retry) {
    try {
      const newToken = await refreshAccessToken();

      return apiRequest(
        url,
        {
          ...options,
          headers: {
            ...(options.headers || {}),
            Authorization: `Bearer ${newToken}`,
          },
        },
        true
      );
    } catch {
      logout();
      throw new Error("Session expired");
    }
  }

  if (res.status === 403) {
    throw new Error("Access denied");
  }

  const data = await parseResponse(res);

  if (!res.ok || data.success === false) {
    throw new Error(data.message || "API error");
  }

  return data;
};