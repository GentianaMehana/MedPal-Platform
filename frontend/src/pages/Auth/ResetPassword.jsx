import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import bcrypt from 'bcryptjs';
import "../../styles/medical-theme.css";

const IconArrowLeft = (p) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
);
const IconAlert = (p) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
  </svg>
);
const IconCheckCircle = (p) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/>
  </svg>
);
const IconSpinner = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    style={{ animation: 'mp-spin 0.9s linear infinite' }}>
    <circle cx="12" cy="12" r="9" stroke={color} strokeOpacity="0.2" strokeWidth="2.5"/>
    <path d="M21 12a9 9 0 0 0-9-9" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

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

      setMessage("Password reset successfully. Redirecting to sign in…");
      setTimeout(() => navigate("/login"), 2000);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* Loading state */
  if (!validToken && !error) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center"
        style={{ background: 'var(--mp-bg-subtle)' }}>
        <div className="text-center mp-fade-in">
          <div style={{ color: 'var(--mp-primary)', marginBottom: 16 }}>
            <IconSpinner size={32} />
          </div>
          <p className="mp-body" style={{ marginBottom: 0 }}>Verifying reset link…</p>
        </div>
        <style>{`@keyframes mp-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="min-vh-100 d-flex flex-column" style={{ background: 'var(--mp-bg-subtle)' }}>
      <header style={{ borderBottom: '1px solid var(--mp-border)', background: 'var(--mp-bg)' }}>
        <div className="mp-container d-flex align-items-center justify-content-between py-3">
          <button
            onClick={() => navigate("/login")}
            className="medical-btn-ghost"
            style={{ paddingLeft: 8, paddingRight: 12 }}
          >
            <IconArrowLeft />
            Back
          </button>
          <span style={{ fontSize: 13, color: 'var(--mp-text-muted)', fontWeight: 500 }}>
            Password reset
          </span>
        </div>
      </header>

      <main className="flex-grow-1 d-flex align-items-center py-5">
        <div className="mp-container">
          <div className="row justify-content-center">
            <div className="col-lg-5 col-xl-4">
              <div className="text-center mb-4 mp-fade-in">
                <h1 className="mp-h2 mb-1">Set a new password</h1>
                <p className="mp-body" style={{ marginBottom: 0 }}>
                  Choose a strong password for your account.
                </p>
              </div>

              <div className="medical-card mp-scale-in" style={{ padding: 28 }}>
                {error && (
                  <>
                    <div className="medical-alert medical-alert-danger mb-3">
                      <span className="medical-alert__icon"><IconAlert /></span>
                      <div>{error}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate("/login")}
                      className="medical-btn-outline w-100"
                    >
                      Go to sign in
                    </button>
                  </>
                )}

                {message && (
                  <div className="medical-alert medical-alert-success">
                    <span className="medical-alert__icon"><IconCheckCircle /></span>
                    <div>{message}</div>
                  </div>
                )}

                {validToken && !error && !message && (
                  <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                      <label className="medical-label">
                        New password <span className="required">*</span>
                      </label>
                      <input
                        type="password"
                        className="medical-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength="6"
                        placeholder="Minimum 6 characters"
                        disabled={loading}
                      />
                    </div>

                    <div className="mb-4">
                      <label className="medical-label">
                        Confirm password <span className="required">*</span>
                      </label>
                      <input
                        type="password"
                        className="medical-input"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        placeholder="Repeat password"
                        disabled={loading}
                      />
                    </div>

                    <button
                      type="submit"
                      className="medical-btn-primary medical-btn--lg w-100"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <IconSpinner size={16} color="#fff" />
                          Resetting…
                        </>
                      ) : (
                        'Reset password'
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes mp-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}