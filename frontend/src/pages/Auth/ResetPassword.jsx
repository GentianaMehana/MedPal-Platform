import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import bcrypt from 'bcryptjs';
import "../../styles/medical-theme.css";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [validToken, setValidToken] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    verifyToken();
  }, []);

  const verifyToken = async () => {
    const token = searchParams.get('token');
    if (!token) {
      setError("Invalid reset link");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('password_resets')
        .select('*')
        .eq('token', token)
        .eq('used', false)
        .maybeSingle();

      if (error || !data) {
        setError("Invalid or expired reset link");
        return;
      }

      if (new Date(data.expires_at) < new Date()) {
        setError("Reset link has expired");
        return;
      }

      setValidToken(true);
    } catch (err) {
      setError("Error verifying token");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }
      if (password !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      const token = searchParams.get('token');
      
      const { data: reset } = await supabase
        .from('password_resets')
        .select('*')
        .eq('token', token)
        .single();

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      await supabase
        .from('users')
        .update({ password: hashedPassword })
        .eq('id', reset.user_id);

      await supabase
        .from('password_resets')
        .update({ used: true })
        .eq('id', reset.id);

      setMessage("✅ Password reset successfully!");
      setTimeout(() => navigate("/login"), 2000);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!validToken && !error) {
    return (
      <div className="container-fluid py-5">
        <div className="row">
          <div className="col-lg-6 mx-auto text-center">
            <div className="medical-spinner mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-5">
      <div className="row">
        <div className="col-lg-6 mx-auto">
          <div className="medical-card">
            <h2 className="text-center mb-4" style={{ color: 'var(--medical-primary)' }}>
              Reset Password
            </h2>

            {error && (
              <div className="alert alert-danger mb-4">
                {error}
                <button 
                  className="btn btn-link" 
                  onClick={() => navigate("/login")}
                >
                  Go to Login
                </button>
              </div>
            )}

            {message && (
              <div className="alert alert-success mb-4">
                {message}
              </div>
            )}

            {validToken && !error && (
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="medical-label">New Password</label>
                  <input
                    type="password"
                    className="medical-input w-100"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength="6"
                    placeholder="Minimum 6 characters"
                    disabled={loading}
                  />
                </div>

                <div className="mb-4">
                  <label className="medical-label">Confirm Password</label>
                  <input
                    type="password"
                    className="medical-input w-100"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Confirm your password"
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  className="medical-btn-primary w-100 py-3"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}