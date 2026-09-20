import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import "../../styles/medical-theme.css";

const IconAlert = (p) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
  </svg>
);
const IconSpinner = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    style={{ animation: 'mp-spin 0.9s linear infinite' }}>
    <circle cx="12" cy="12" r="9" stroke={color} strokeOpacity="0.2" strokeWidth="2.5"/>
    <path d="M21 12a9 9 0 0 0-9-9" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

export default function PatientRegister() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);

  // ✅ FIX: deklarimi i formData që mungonte
  const [formData, setFormData] = useState({
    phone: "",
    gender: "",
    bloodType: "",
    dateOfBirth: "",
    address: "",
    password: "",
    confirmPassword: ""
  });

  useEffect(() => {
    const userId = searchParams.get('userId');
    if (userId) {
      supabase.auth.admin.getUserById(userId).then(({ data, error }) => {
        if (data?.user) setUser(data.user);
      });
    }
  }, [searchParams]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!user) throw new Error("User not found");
      if (formData.password.length < 6) throw new Error("Password too short");
      if (formData.password !== formData.confirmPassword) throw new Error("Passwords don't match");

      await supabase.auth.updateUser({ password: formData.password });

      await supabase.from('users').insert([{
        id: user.id,
        email: user.email,
        name: user.user_metadata.name,
        role: 'patient',
        is_verified: true,
        phone: formData.phone,
        blood_type: formData.bloodType,
        gender: formData.gender,
        date_of_birth: formData.dateOfBirth,
        address: formData.address,
        clinic_id: user.user_metadata.clinic_id,
        created_at: new Date().toISOString()
      }]);

      await supabase.from('patients').insert([{
        user_id: user.id,
        date_of_birth: formData.dateOfBirth,
        gender: formData.gender,
        blood_type: formData.bloodType,
        phone: formData.phone,
        address: formData.address
      }]);

      navigate('/patient/dashboard');

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center"
        style={{ background: 'var(--mp-bg-subtle)' }}>
        <div className="text-center mp-fade-in">
          <div style={{ color: 'var(--mp-primary)', marginBottom: 16 }}>
            <IconSpinner size={28} />
          </div>
          <p className="mp-body" style={{ marginBottom: 0 }}>Loading…</p>
        </div>
        <style>{`@keyframes mp-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="min-vh-100 d-flex flex-column" style={{ background: 'var(--mp-bg-subtle)' }}>
      <main className="flex-grow-1 d-flex align-items-center py-5">
        <div className="mp-container">
          <div className="row justify-content-center">
            <div className="col-lg-6 col-xl-5">
              <div className="text-center mb-4 mp-fade-in">
                <h1 className="mp-h2 mb-1">Complete your profile</h1>
                <p className="mp-body" style={{ marginBottom: 0 }}>
                  Welcome, {user.user_metadata.name}
                </p>
              </div>

              <div className="medical-card mp-scale-in" style={{ padding: 28 }}>
                <div className="medical-alert medical-alert-info mb-4">
                  <span className="medical-alert__icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
                    </svg>
                  </span>
                  <div style={{ fontSize: 13.5 }}>
                    <strong>Email:</strong> {user.email}
                  </div>
                </div>

                {error && (
                  <div className="medical-alert medical-alert-danger mb-4">
                    <span className="medical-alert__icon"><IconAlert /></span>
                    <div>{error}</div>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <p className="mp-overline" style={{ marginBottom: 14 }}>Personal details</p>

                  <div className="row g-3 mb-3">
                    <div className="col-sm-6">
                      <label className="medical-label">Phone</label>
                      <input
                        name="phone"
                        className="medical-input"
                        placeholder="+383 44 123 456"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="col-sm-6">
                      <label className="medical-label">Date of birth</label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        className="medical-input"
                        value={formData.dateOfBirth}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-sm-6">
                      <label className="medical-label">Gender</label>
                      <select
                        name="gender"
                        className="medical-input"
                        value={formData.gender}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                    <div className="col-sm-6">
                      <label className="medical-label">Blood type</label>
                      <select
                        name="bloodType"
                        className="medical-input"
                        value={formData.bloodType}
                        onChange={handleChange}
                      >
                        <option value="">Select blood type</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="medical-label">Address</label>
                    <input
                      name="address"
                      className="medical-input"
                      placeholder="Street, city"
                      value={formData.address}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <hr className="mp-divider" />

                  <p className="mp-overline" style={{ marginBottom: 14 }}>Security</p>

                  <div className="row g-3 mb-4">
                    <div className="col-sm-6">
                      <label className="medical-label">Password</label>
                      <input
                        type="password"
                        name="password"
                        className="medical-input"
                        placeholder="Minimum 6 characters"
                        value={formData.password}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="col-sm-6">
                      <label className="medical-label">Confirm password</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        className="medical-input"
                        placeholder="Repeat password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="medical-btn-primary medical-btn--lg w-100"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <IconSpinner size={16} color="#fff" />
                        Processing…
                      </>
                    ) : (
                      'Complete registration'
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style>{`@keyframes mp-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}