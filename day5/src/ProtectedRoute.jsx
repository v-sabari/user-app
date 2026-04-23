import { Navigate } from "react-router-dom";

function isTokenExpired(token) {
  if (!token) {
    return true;
  }

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const exp = payload.exp;

    if (!exp) {
      return true;
    }

    return Date.now() >= exp * 1000;
  } catch (error) {
    return true;
  }
}

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  if (!token || isTokenExpired(token)) {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("role");
    return <Navigate to="/login" />;
  }

  return children;
}

export default ProtectedRoute;