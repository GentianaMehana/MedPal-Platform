// frontend/src/components/PrivateRoute.jsx
import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import "../styles/medical-theme.css";

const IconSpinner = ({ size = 28, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    style={{ animation: 'mp-spin 0.9s linear infinite' }}>
    <circle cx="12" cy="12" r="9" stroke={color} strokeOpacity="0.2" strokeWidth="2.5"/>
    <path d="M21 12a9 9 0 0 0-9-9" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

export default function PrivateRoute({ children, allowedRoles }) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const user = JSON.parse(localStorage.getItem('user'));

      console.log("PrivateRoute - User:", user);
      console.log("PrivateRoute - Allowed roles:", allowedRoles);

      if (!user) {
        console.log("No user found, redirecting to login");
        setAuthorized(false);
        setLoading(false);
        return;
      }

      if (user.role === "patient" && !user.is_verified) {
        console.log("Patient not verified, redirecting to login");

        localStorage.removeItem('user');
        await supabase.auth.signOut();

        setAuthorized(false);
        setLoading(false);
        return;
      }

      if (allowedRoles && allowedRoles.includes(user.role)) {
        console.log("User authorized with role:", user.role);
        setAuthorized(true);
      } else {
        console.log("User not authorized. Role:", user?.role);
        setAuthorized(false);
      }

      setLoading(false);
    };

    checkAuth();
  }, [allowedRoles]);

  if (loading) {
    return (
      <div
        className="min-vh-100 d-flex align-items-center justify-content-center"
        style={{ background: 'var(--mp-bg-subtle)' }}
      >
        <div className="text-center">
          <div style={{ color: 'var(--mp-primary)', marginBottom: 12 }}>
            <IconSpinner />
          </div>
          <p className="mp-body" style={{ marginBottom: 0, fontSize: 14 }}>
            Verifying authorization…
          </p>
        </div>
        <style>{`@keyframes mp-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return authorized ? children : <Navigate to="/login" />;
}