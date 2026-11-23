import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/medical-theme.css";

const IconCheck = (p) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/>
  </svg>
);
const IconAlert = (p) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
  </svg>
);
const IconSave = (p) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <path d="M17 21v-8H7v8M7 3v5h8"/>
  </svg>
);
const IconSpinner = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    style={{ animation: 'mp-spin 0.9s linear infinite' }}>
    <circle cx="12" cy="12" r="9" stroke={color} strokeOpacity="0.25" strokeWidth="2.5"/>
    <path d="M21 12a9 9 0 0 0-9-9" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

export default function ClinicProfileUpdate() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    currentPassword: "",
    newPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      setForm((prev) => ({ ...prev, name: user.name, email: user.email }));
    }
    fetchClinicDetails();
  }, []);

  const fetchClinicDetails = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));

      const { data, error } = await supabase
        .from('clinics')
        .select('phone, address')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setForm(prev => ({
          ...prev,
          phone: data.phone || "",
          address: data.address || ""
        }));
      }
    } catch (err) {
      console.error("Error fetching clinic details:", err);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const updates = {};

      if (form.name !== user.name) {
        const { error: nameError } = await supabase
          .from('users')
          .update({ name: form.name })
          .eq('id', user.id);

        if (nameError) throw nameError;
        updates.name = form.name;
      }

      if (form.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: form.email,
        });
        if (emailError) throw emailError;
        updates.email = form.email;
      }

      const { error: clinicError } = await supabase
        .from('clinics')
        .update({
          phone: form.phone || null,
          address: form.address || null,
        })
        .eq('user_id', user.id);

      if (clinicError) throw clinicError;

      if (form.newPassword) {
        if (!form.currentPassword) {
          throw new Error("Current password is required");
        }

        const { error: passwordError } = await supabase.auth.updateUser({
          password: form.newPassword,
        });
        if (passwordError) throw passwordError;
      }

      const updatedUser = { ...user, ...updates };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      setMessage({ text: "Profile updated successfully.", type: "success" });

      setForm(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
      }));

    } catch (err) {
      setMessage({ text: err.message, type: "danger" });
    } finally {
      setLoading(false);
    }
  };

  const alertClass =
    message.type === 'success' ? 'medical-alert-success' :
    message.type === 'danger'  ? 'medical-alert-danger'  : '';

  return (
    <div className="container-fluid px-4 py-4" style={{ maxWidth: 720 }}>
      {/* Page header */}
      <div className="mb-4">
        <p className="mp-overline mb-1">Clinic</p>
        <h1 className="mp-h2 mb-1">Profile settings</h1>
        <p className="mp-body" style={{ marginBottom: 0 }}>
          Update your clinic information and account password.
        </p>
      </div>

      {message.text && (
        <div className={`medical-alert ${alertClass} mb-4`}>
          <span className="medical-alert__icon">
            {message.type === 'success' ? <IconCheck /> : <IconAlert />}
          </span>
          <div>{message.text}</div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Section: clinic info */}
        <div className="medical-card mb-4" style={{ padding: 28 }}>
          <p className="mp-overline mb-3">Clinic information</p>

          <div className="row g-3">
            <div className="col-md-6">
              <label className="medical-label">
                Clinic name <span className="required">*</span>
              </label>
              <input
                name="name"
                type="text"
                className="medical-input"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-6">
              <label className="medical-label">
                Email <span className="required">*</span>
              </label>
              <input
                name="email"
                type="email"
                className="medical-input"
                value={form.email}
                onChange={handleChange}
                required
              />
              <span className="medical-hint">
                Changing email requires confirmation.
              </span>
            </div>
            <div className="col-md-6">
              <label className="medical-label">Phone</label>
              <input
                name="phone"
                type="text"
                className="medical-input"
                value={form.phone}
                onChange={handleChange}
                placeholder="+383 44 123 456"
              />
            </div>
            <div className="col-md-6">
              <label className="medical-label">Address</label>
              <input
                name="address"
                type="text"
                className="medical-input"
                value={form.address}
                onChange={handleChange}
                placeholder="Street, city"
              />
            </div>
          </div>
        </div>

        {/* Section: security */}
        <div className="medical-card mb-4" style={{ padding: 28 }}>
          <p className="mp-overline mb-3">Change password</p>

          <div className="row g-3">
            <div className="col-md-6">
              <label className="medical-label">Current password</label>
              <input
                name="currentPassword"
                type="password"
                className="medical-input"
                value={form.currentPassword}
                onChange={handleChange}
                autoComplete="current-password"
              />
            </div>
            <div className="col-md-6">
              <label className="medical-label">New password</label>
              <input
                name="newPassword"
                type="password"
                className="medical-input"
                value={form.newPassword}
                onChange={handleChange}
                minLength={6}
                autoComplete="new-password"
              />
              <span className="medical-hint">
                Minimum 6 characters. Leave empty to keep current password.
              </span>
            </div>
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
              Saving changes…
            </>
          ) : (
            <>
              <IconSave />
              Save changes
            </>
          )}
        </button>
      </form>

      <style>{`@keyframes mp-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}