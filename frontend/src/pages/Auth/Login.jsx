import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/medical-theme.css";
import bcrypt from 'bcryptjs';

/* ---------- Icons ---------- */
const IconArrowLeft = (p) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
);
const IconUser = (p) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconStethoscope = (p) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M4 3v6a4 4 0 0 0 8 0V3"/><path d="M2 3h4M10 3h4"/>
    <path d="M12 13v3a5 5 0 0 0 10 0v-2"/><circle cx="22" cy="11" r="2"/>
  </svg>
);
const IconBuilding = (p) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M15 21V9h3a2 2 0 0 1 2 2v10"/>
    <path d="M9 7h2M9 11h2M9 15h2"/>
  </svg>
);
const IconArrowRight = (p) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M5 12h14M13 5l7 7-7 7"/>
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
const IconSpinner = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    style={{ animation: 'mp-spin 0.9s linear infinite' }}>
    <circle cx="12" cy="12" r="9" stroke={color} strokeOpacity="0.25" strokeWidth="2.5"/>
    <path d="M21 12a9 9 0 0 0-9-9" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

/* ---------- Role data ---------- */
const ROLES = [
  {
    id: 'patient',
    label: 'Patient',
    description: 'Access appointments and medical records',
    icon: <IconUser />,
  },
  {
    id: 'doctor',
    label: 'Doctor',
    description: 'Manage schedule and patient reports',
    icon: <IconStethoscope />,
  },
  {
    id: 'clinic',
    label: 'Clinic',
    description: 'Operate your medical facility',
    icon: <IconBuilding />,
  },
];

export default function Login() {
  const location = useLocation();
  const [step, setStep] = useState("select");
  const [role, setRole] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    doctorCode: "",
  });
  const [resetData, setResetData] = useState({
    email: "",
    newPassword: "",
    confirmPassword: "",
    token: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(location.state?.message || "");
  const [resetStep, setResetStep] = useState("request");

  const navigate = useNavigate();

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setStep("login");
    setError("");
    setMessage("");
    setFormData({ email: "", password: "", doctorCode: "" });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleResetChange = (e) => {
    setResetData({ ...resetData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let userData;

      if (role === "doctor") {
        console.log("🔍 Looking for doctor with code:", formData.doctorCode);

        const { data: doctor, error: doctorError } = await supabase
          .from('doctors')
          .select(`
            user_id,
            name,
            doctor_code,
            specialization,
            consultation_fee,
            phone,
            users!inner (
              email,
              role,
              is_verified,
              password
            )
          `)
          .eq('doctor_code', formData.doctorCode)
          .maybeSingle();

        if (doctorError) {
          console.error("Doctor lookup error:", doctorError);
          throw new Error("Error looking up doctor code");
        }

        if (!doctor) {
          console.log("Doctor code not found:", formData.doctorCode);
          throw new Error("Doctor code not found");
        }

        console.log("✅ Doctor found:", doctor);

        const isValidPassword = await bcrypt.compare(formData.password, doctor.users.password);

        if (!isValidPassword) {
          throw new Error("Incorrect password");
        }

        userData = {
          id: doctor.user_id,
          email: doctor.users.email,
          name: doctor.name,
          role: 'doctor',
          is_verified: doctor.users.is_verified || true,
          doctor_code: doctor.doctor_code,
          specialization: doctor.specialization,
          phone: doctor.phone
        };
      }
      else if (role === "clinic") {
        console.log("🔍 Looking for clinic with email:", formData.email);

        const { data: users, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('email', formData.email)
          .eq('role', 'clinic');

        if (userError) {
          console.error("Clinic lookup error:", userError);
          throw userError;
        }

        if (!users || users.length === 0) {
          console.log("Clinic not found with email:", formData.email);
          throw new Error("Invalid email or password");
        }

        const user = users[0];
        console.log("✅ Clinic found:", user);

        const isValidPassword = await bcrypt.compare(formData.password, user.password);

        if (!isValidPassword) {
          console.log("Password mismatch");
          throw new Error("Invalid email or password");
        }

        userData = user;
      }
      else {
        console.log("🔍 Looking for patient with email:", formData.email);

        const { data: users, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('email', formData.email)
          .eq('role', 'patient');

        if (userError) {
          console.error("Patient lookup error:", userError);
          throw userError;
        }

        if (!users || users.length === 0) {
          console.log("Patient not found with email:", formData.email);
          throw new Error("Invalid email or password");
        }

        const user = users[0];
        console.log("✅ Patient found:", user);

        const isValidPassword = await bcrypt.compare(formData.password, user.password);

        if (!isValidPassword) {
          console.log("Password mismatch");
          throw new Error("Invalid email or password");
        }

        const { data: patient } = await supabase
          .from('patients')
          .select('phone, date_of_birth, gender, blood_type, address')
          .eq('user_id', user.id)
          .maybeSingle();

        userData = { ...user, ...patient };
      }

      if (userData.role !== role) {
        throw new Error(`This account is registered as ${userData.role}, not as ${role}`);
      }

      if (role === "patient" && !userData.is_verified) {
        throw new Error("Please verify your email before logging in.");
      }

      const { password, ...userWithoutPassword } = userData;

      localStorage.setItem('user', JSON.stringify(userWithoutPassword));
      console.log("✅ Login successful, redirecting to:", `/${userData.role}`);
      navigate(`/${userData.role}`);

    } catch (err) {
      console.error("Login error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, email, name')
        .eq('email', resetData.email);

      if (userError) throw userError;

      if (!users || users.length === 0) {
        throw new Error("Email not found");
      }

      const user = users[0];

      const token = Math.random().toString(36).substring(2, 15) +
                    Math.random().toString(36).substring(2, 15);

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      const { error: tokenError } = await supabase
        .from('password_resets')
        .insert([{
          user_id: user.id,
          email: user.email,
          token: token,
          expires_at: expiresAt.toISOString(),
          used: false
        }]);

      if (tokenError) throw tokenError;

      const resetLink = `http://localhost:5173/reset-password?token=${token}`;

      const { error: emailError } = await supabase.functions.invoke('send-reset-password', {
        body: {
          to_email: user.email,
          to_name: user.name,
          reset_link: resetLink
        }
      });

      if (emailError) {
        console.error("Email error:", emailError);
        setMessage("Password reset link generated but email failed. Contact support.");
        setResetData({ ...resetData, token: token });
        setResetStep("verify");
      } else {
        setMessage("Password reset email sent. Check your inbox.");
        setResetStep("verify");
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyToken = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data: reset, error: resetError } = await supabase
        .from('password_resets')
        .select('*')
        .eq('token', resetData.token)
        .eq('used', false)
        .maybeSingle();

      if (resetError) throw resetError;

      if (!reset) {
        throw new Error("Invalid or expired reset token");
      }

      if (new Date(reset.expires_at) < new Date()) {
        throw new Error("Reset token has expired");
      }

      setResetData(prev => ({ ...prev, email: reset.email }));
      setResetStep("reset");
      setMessage("Token verified. Enter your new password.");

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (resetData.newPassword.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      if (resetData.newPassword !== resetData.confirmPassword) {
        throw new Error("Passwords do not match");
      }

      const { data: reset, error: resetError } = await supabase
        .from('password_resets')
        .select('*')
        .eq('token', resetData.token)
        .eq('used', false)
        .maybeSingle();

      if (resetError) throw resetError;
      if (!reset) throw new Error("Invalid reset token");

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(resetData.newPassword, saltRounds);

      const { error: updateError } = await supabase
        .from('users')
        .update({ password: hashedPassword })
        .eq('id', reset.user_id);

      if (updateError) throw updateError;

      await supabase
        .from('password_resets')
        .update({ used: true })
        .eq('id', reset.id);

      setMessage("Password reset successfully. You can now login.");
      setTimeout(() => {
        setStep("login");
        setResetStep("request");
        setResetData({ email: "", newPassword: "", confirmPassword: "", token: "" });
      }, 3000);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep("select");
    setError("");
    setMessage("");
    setFormData({ email: "", password: "", doctorCode: "" });
    setResetStep("request");
    setResetData({ email: "", newPassword: "", confirmPassword: "", token: "" });
  };

  const handleBackToRequest = () => {
    setResetStep("request");
    setError("");
    setMessage("");
  };

  /* ============ RENDER ============ */
  return (
    <div className="min-vh-100 d-flex flex-column" style={{ background: 'var(--mp-bg-subtle)' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid var(--mp-border)', background: 'var(--mp-bg)' }}>
        <div className="mp-container d-flex align-items-center justify-content-between py-3">
          <button
            onClick={() => navigate("/")}
            className="medical-btn-ghost"
            style={{ paddingLeft: 8, paddingRight: 12 }}
          >
            <IconArrowLeft />
            Back
          </button>
          <span
            style={{
              fontSize: 13,
              color: 'var(--mp-text-muted)',
              fontWeight: 500,
              letterSpacing: '-0.005em',
            }}
          >
            {step === "select" && "Sign in"}
            {step === "login" && `Sign in as ${role}`}
            {step === "forgot" && "Reset password"}
          </span>
        </div>
      </header>

      {/* Content */}
      <main className="flex-grow-1 d-flex align-items-center py-5">
        <div className="mp-container">
          <div className="row justify-content-center">
            <div className="col-lg-5 col-xl-4">
              {/* Brand */}
              <div className="text-center mb-4 mp-fade-in">
                <div
                  className="d-inline-flex align-items-center justify-content-center mb-3"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: 'var(--mp-primary)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 20,
                    letterSpacing: '-0.02em',
                    boxShadow: '0 1px 2px rgba(10,15,26,0.15)',
                  }}
                >
                  M
                </div>
                <h1 className="mp-h2 mb-1">Welcome back</h1>
                <p className="mp-body" style={{ marginBottom: 0 }}>
                  Sign in to continue to MedPal.
                </p>
              </div>

              {/* Global messages */}
              {message && step === "login" && (
                <div className="medical-alert medical-alert-success mb-3">
                  <span className="medical-alert__icon"><IconCheckCircle /></span>
                  <div>{message}</div>
                </div>
              )}

              <div className="medical-card mp-scale-in" style={{ padding: 28 }}>
                {/* ========== STEP: SELECT ROLE ========== */}
                {step === "select" && (
                  <>
                    <p className="mp-overline" style={{ marginBottom: 14 }}>
                      Select account type
                    </p>

                    <div className="d-flex flex-column gap-2">
                      {ROLES.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => handleRoleSelect(r.id)}
                          disabled={loading}
                          className="medical-btn-outline"
                          style={{
                            padding: '14px 16px',
                            justifyContent: 'space-between',
                            textAlign: 'left',
                            width: '100%',
                            fontWeight: 500,
                          }}
                        >
                          <span className="d-flex align-items-center gap-3">
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 40,
                                height: 40,
                                borderRadius: 10,
                                background: 'var(--mp-primary-light)',
                                color: 'var(--mp-primary)',
                                border: '1px solid var(--mp-primary-border)',
                                flexShrink: 0,
                              }}
                            >
                              {r.icon}
                            </span>
                            <span className="d-flex flex-column" style={{ textAlign: 'left' }}>
                              <span
                                style={{
                                  fontWeight: 600,
                                  fontSize: 14.5,
                                  color: 'var(--mp-text)',
                                  letterSpacing: '-0.005em',
                                }}
                              >
                                {r.label}
                              </span>
                              <span
                                style={{
                                  fontSize: 12.5,
                                  color: 'var(--mp-text-muted)',
                                  fontWeight: 400,
                                  marginTop: 2,
                                }}
                              >
                                {r.description}
                              </span>
                            </span>
                          </span>
                          <span style={{ color: 'var(--mp-text-faint)' }}>
                            <IconArrowRight />
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {/* ========== STEP: LOGIN ========== */}
                {step === "login" && (
                  <>
                    {error && (
                      <div className="medical-alert medical-alert-danger mb-3">
                        <span className="medical-alert__icon"><IconAlert /></span>
                        <div>{error}</div>
                      </div>
                    )}

                    <form onSubmit={handleLogin}>
                      {role === "doctor" ? (
                        <div className="mb-3">
                          <label className="medical-label">
                            Doctor code <span className="required">*</span>
                          </label>
                          <input
                            name="doctorCode"
                            className="medical-input"
                            placeholder="DR-XXXXX"
                            value={formData.doctorCode}
                            onChange={handleChange}
                            required
                            disabled={loading}
                          />
                        </div>
                      ) : (
                        <div className="mb-3">
                          <label className="medical-label">
                            Email address <span className="required">*</span>
                          </label>
                          <input
                            name="email"
                            type="email"
                            className="medical-input"
                            placeholder="you@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            disabled={loading}
                          />
                        </div>
                      )}

                      <div className="mb-3">
                        <div className="d-flex align-items-center justify-content-between mb-1">
                          <label className="medical-label" style={{ marginBottom: 0 }}>
                            Password <span className="required">*</span>
                          </label>
                          {role !== "doctor" && (
                            <button
                              type="button"
                              onClick={() => setStep("forgot")}
                              disabled={loading}
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                color: 'var(--mp-primary)',
                                fontWeight: 500,
                                fontSize: 12.5,
                                cursor: 'pointer',
                              }}
                            >
                              Forgot password?
                            </button>
                          )}
                        </div>
                        <input
                          name="password"
                          type="password"
                          className="medical-input"
                          placeholder="Enter your password"
                          value={formData.password}
                          onChange={handleChange}
                          required
                          disabled={loading}
                        />
                      </div>

                      <button
                        type="submit"
                        className="medical-btn-primary medical-btn--lg w-100 mb-3"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <IconSpinner size={16} color="#fff" />
                            Signing in…
                          </>
                        ) : (
                          <>
                            Sign in
                            <IconArrowRight />
                          </>
                        )}
                      </button>
                    </form>

                    <button
                      type="button"
                      className="medical-btn-ghost w-100"
                      onClick={handleBack}
                      disabled={loading}
                    >
                      <IconArrowLeft />
                      Choose a different account type
                    </button>
                  </>
                )}

                {/* ========== STEP: FORGOT PASSWORD ========== */}
                {step === "forgot" && (
                  <>
                    {resetStep === "request" && (
                      <>
                        <h2 className="mp-h3 mb-2">Reset your password</h2>
                        <p className="mp-caption mb-4">
                          Enter your email and we'll send you a reset link.
                        </p>

                        {error && (
                          <div className="medical-alert medical-alert-danger mb-3">
                            <span className="medical-alert__icon"><IconAlert /></span>
                            <div>{error}</div>
                          </div>
                        )}

                        <form onSubmit={handleForgotRequest}>
                          <div className="mb-3">
                            <label className="medical-label">
                              Email address <span className="required">*</span>
                            </label>
                            <input
                              name="email"
                              type="email"
                              className="medical-input"
                              placeholder="you@example.com"
                              value={resetData.email}
                              onChange={handleResetChange}
                              required
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
                                Sending…
                              </>
                            ) : (
                              'Send reset link'
                            )}
                          </button>
                        </form>
                      </>
                    )}

                    {resetStep === "verify" && (
                      <>
                        <h2 className="mp-h3 mb-2">Enter reset token</h2>
                        <p className="mp-caption mb-4">
                          Paste the token from the email we sent you.
                        </p>

                        {message && (
                          <div className="medical-alert medical-alert-success mb-3">
                            <span className="medical-alert__icon"><IconCheckCircle /></span>
                            <div>{message}</div>
                          </div>
                        )}

                        {error && (
                          <div className="medical-alert medical-alert-danger mb-3">
                            <span className="medical-alert__icon"><IconAlert /></span>
                            <div>{error}</div>
                          </div>
                        )}

                        <form onSubmit={handleVerifyToken}>
                          <div className="mb-3">
                            <label className="medical-label">
                              Reset token <span className="required">*</span>
                            </label>
                            <input
                              name="token"
                              type="text"
                              className="medical-input"
                              placeholder="Paste token"
                              value={resetData.token}
                              onChange={handleResetChange}
                              required
                              disabled={loading}
                              style={{ fontFamily: 'var(--mp-font-mono)', fontSize: 13 }}
                            />
                          </div>

                          <button
                            type="submit"
                            className="medical-btn-primary medical-btn--lg w-100 mb-2"
                            disabled={loading}
                          >
                            {loading ? (
                              <>
                                <IconSpinner size={16} color="#fff" />
                                Verifying…
                              </>
                            ) : (
                              'Verify token'
                            )}
                          </button>

                          <button
                            type="button"
                            className="medical-btn-ghost w-100"
                            onClick={handleBackToRequest}
                          >
                            <IconArrowLeft />
                            Back
                          </button>
                        </form>
                      </>
                    )}

                    {resetStep === "reset" && (
                      <>
                        <h2 className="mp-h3 mb-2">Set new password</h2>
                        <p className="mp-caption mb-4">
                          Choose a strong password you haven't used before.
                        </p>

                        {error && (
                          <div className="medical-alert medical-alert-danger mb-3">
                            <span className="medical-alert__icon"><IconAlert /></span>
                            <div>{error}</div>
                          </div>
                        )}

                        <form onSubmit={handleResetPassword}>
                          <div className="mb-3">
                            <label className="medical-label">
                              New password <span className="required">*</span>
                            </label>
                            <input
                              name="newPassword"
                              type="password"
                              className="medical-input"
                              placeholder="Minimum 6 characters"
                              value={resetData.newPassword}
                              onChange={handleResetChange}
                              required
                              minLength="6"
                              disabled={loading}
                            />
                          </div>

                          <div className="mb-4">
                            <label className="medical-label">
                              Confirm password <span className="required">*</span>
                            </label>
                            <input
                              name="confirmPassword"
                              type="password"
                              className="medical-input"
                              placeholder="Repeat password"
                              value={resetData.confirmPassword}
                              onChange={handleResetChange}
                              required
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
                      </>
                    )}

                    <hr className="mp-divider" />

                    <button
                      type="button"
                      className="medical-btn-ghost w-100"
                      onClick={() => {
                        setStep("login");
                        setResetStep("request");
                        setError("");
                        setMessage("");
                      }}
                      disabled={loading}
                    >
                      <IconArrowLeft />
                      Back to sign in
                    </button>
                  </>
                )}
              </div>

              <p
                className="text-center mt-4 mp-caption"
                style={{ fontSize: 12.5, color: 'var(--mp-text-faint)' }}
              >
                Protected by industry-standard encryption.
              </p>
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