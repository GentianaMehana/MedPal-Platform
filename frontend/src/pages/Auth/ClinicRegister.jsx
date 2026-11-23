import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import "bootstrap/dist/css/bootstrap.min.css";
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
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 8v4M12 16h.01"/>
  </svg>
);

const IconCheckCircle = (p) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <path d="M22 4L12 14.01l-3-3"/>
  </svg>
);

export default function ClinicRegister() {
  const [formData, setFormData] = useState({
    clinic_name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (formData.password.length < 6) throw new Error("Password too short");
      if (formData.password !== formData.confirmPassword) throw new Error("Passwords don't match");

      const userId = uuidv4();
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(formData.password, saltRounds);

      const { error: userError } = await supabase
        .from('users')
        .insert([{
          id: userId,
          email: formData.email,
          name: formData.clinic_name,
          role: 'clinic',
          is_verified: true,
          phone: formData.phone || null,
          address: formData.address || null,
          password: hashedPassword,
          created_at: new Date().toISOString()
        }]);

      if (userError) throw userError;

      const clinicCode = `CLINIC-${userId.slice(0, 8)}`;

      const { error: clinicError } = await supabase
        .from('clinics')
        .insert([{
          user_id: userId,
          name: formData.clinic_name,
          clinic_code: clinicCode,
          email: formData.email,
          phone: formData.phone || null,
          address: formData.address || null,
          is_verified: true,
          created_at: new Date().toISOString()
        }]);

      if (clinicError) throw clinicError;

      setMessage("Clinic registered successfully. Redirecting to sign in…");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-vh-100 d-flex flex-column"
      style={{ background: 'var(--mp-bg-subtle)' }}
    >
      {/* Minimal header */}
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
            New clinic registration
          </span>
        </div>
      </header>

      {/* Content */}
      <main className="flex-grow-1 d-flex align-items-center py-5">
        <div className="mp-container">
          <div className="row justify-content-center">
            <div className="col-lg-7 col-xl-6">
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
                <h1 className="mp-h2 mb-2">Register your clinic</h1>
                <p className="mp-body" style={{ marginBottom: 0 }}>
                  Create a MedPal account for your medical facility.
                </p>
              </div>

              <div className="medical-card mp-scale-in" style={{ padding: 32 }}>
                {message && (
                  <div className="medical-alert medical-alert-success mb-4">
                    <span className="medical-alert__icon">
                      <IconCheckCircle />
                    </span>
                    <div>{message}</div>
                  </div>
                )}

                {error && (
                  <div className="medical-alert medical-alert-danger mb-4">
                    <span className="medical-alert__icon">
                      <IconAlert />
                    </span>
                    <div>{error}</div>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  {/* Section: Facility */}
                  <p className="mp-overline" style={{ marginBottom: 14 }}>
                    Facility details
                  </p>

                  <div className="mb-3">
                    <label className="medical-label">
                      Clinic name <span className="required">*</span>
                    </label>
                    <input
                      name="clinic_name"
                      type="text"
                      className="medical-input"
                      placeholder="e.g. Riverside Medical Center"
                      value={formData.clinic_name}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-sm-6">
                      <label className="medical-label">Phone</label>
                      <input
                        name="phone"
                        type="tel"
                        className="medical-input"
                        placeholder="+383 …"
                        value={formData.phone}
                        onChange={handleChange}
                        disabled={loading}
                      />
                    </div>
                    <div className="col-sm-6">
                      <label className="medical-label">Address</label>
                      <input
                        name="address"
                        type="text"
                        className="medical-input"
                        placeholder="Street, city"
                        value={formData.address}
                        onChange={handleChange}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <hr className="mp-divider" />

                  {/* Section: Account */}
                  <p className="mp-overline" style={{ marginBottom: 14 }}>
                    Account & security
                  </p>

                  <div className="mb-3">
                    <label className="medical-label">
                      Email address <span className="required">*</span>
                    </label>
                    <input
                      name="email"
                      type="email"
                      className="medical-input"
                      placeholder="admin@yourclinic.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                    <span className="medical-hint">
                      This will be used to sign in to your clinic account.
                    </span>
                  </div>

                  <div className="row g-3 mb-4">
                    <div className="col-sm-6">
                      <label className="medical-label">
                        Password <span className="required">*</span>
                      </label>
                      <input
                        name="password"
                        type="password"
                        className="medical-input"
                        placeholder="At least 6 characters"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        minLength="6"
                        disabled={loading}
                      />
                    </div>
                    <div className="col-sm-6">
                      <label className="medical-label">
                        Confirm password <span className="required">*</span>
                      </label>
                      <input
                        name="confirmPassword"
                        type="password"
                        className="medical-input"
                        placeholder="Repeat password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="medical-btn-primary medical-btn--lg w-100 mb-3"
                    disabled={loading}
                  >
                    {loading ? 'Creating account…' : 'Create clinic account'}
                  </button>

                  <p className="mp-caption text-center" style={{ marginBottom: 0 }}>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => navigate("/login")}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        color: 'var(--mp-primary)',
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: 'pointer',
                      }}
                    >
                      Sign in
                    </button>
                  </p>
                </form>
              </div>

              <p
                className="text-center mt-4 mp-caption"
                style={{ fontSize: 12.5, color: 'var(--mp-text-faint)' }}
              >
                By registering you agree to MedPal's Terms of Service and Privacy Policy.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}