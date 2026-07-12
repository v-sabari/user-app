import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { apiRequest } from "./apiClient";

function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const verify = async () => {
      try {
        await apiRequest("/auth/me", { method: "GET" });
        setAllowed(true);
      } catch {
        setAllowed(false);
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, []);

  if (loading) return <div>Checking session...</div>;
  if (!allowed) return <Navigate to="/login" />;

  return children;
}

export default ProtectedRoute;