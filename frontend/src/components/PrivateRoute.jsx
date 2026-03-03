// frontend/src/components/PrivateRoute.jsx
import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function PrivateRoute({ children, allowedRoles }) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      // Merr user-in nga localStorage
      const user = JSON.parse(localStorage.getItem('user'));
      
      console.log("PrivateRoute - User:", user);
      console.log("PrivateRoute - Allowed roles:", allowedRoles);
      
      if (!user) {
        console.log("No user found, redirecting to login");
        setAuthorized(false);
        setLoading(false);
        return;
      }

      // 🔥 KONTROLLO NËSE PACIENTI ËSHTË I VERIFIKUAR
      if (user.role === "patient" && !user.is_verified) {
        console.log("❌ Patient not verified, redirecting to login");
        
        // Fshi user-in nga localStorage
        localStorage.removeItem('user');
        
        // Dil nga Supabase
        await supabase.auth.signOut();
        
        setAuthorized(false);
        setLoading(false);
        return;
      }

      if (allowedRoles && allowedRoles.includes(user.role)) {
        console.log("✅ User authorized with role:", user.role);
        setAuthorized(true);
      } else {
        console.log("❌ User not authorized. Role:", user?.role);
        setAuthorized(false);
      }
      
      setLoading(false);
    };

    checkAuth();
  }, [allowedRoles]);

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Duke kontrolluar autorizimin...</p>
        </div>
      </div>
    );
  }

  return authorized ? children : <Navigate to="/login" />;
}