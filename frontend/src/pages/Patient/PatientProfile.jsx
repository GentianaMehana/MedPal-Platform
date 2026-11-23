import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/medical-theme.css";

const IconSave = (p) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <path d="M17 21v-8H7v8M7 3v5h8"/>
  </svg>
);
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
const IconSpinner = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    style={{ animation: 'mp-spin 0.9s linear infinite' }}>
    <circle cx="12" cy="12" r="9" stroke={color} strokeOpacity="0.25" strokeWidth="2.5"/>
    <path d="M21 12a9 9 0 0 0-9-9" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

export default function PatientProfile() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    dateOfBirth: "",
    gender: "",
    phone: "",
    address: "",
    bloodType: "",
    medicalHistory: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('name, email')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;

      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      setForm({
        name: userData?.name || "",
        email: userData?.email || "",
        dateOfBirth: patientData?.date_of_birth || "",
        gender: patientData?.gender || "",
        phone: patientData?.phone || "",
        address: patientData?.address || "",
        bloodType: patientData?.blood_type || "",
        medicalHistory: patientData?.medical_history || "",
      });
    } catch (err) {
      console.error("Error fetching profile:", err);
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

      const { error: userError } = await supabase
        .from('users')
        .update({ name: form.name })
        .eq('id', user.id);

      if (userError) throw userError;

      const { error: patientError } = await supabase
        .from('patients')
        .upsert({
          user_id: user.id,
          date_of_birth: form.dateOfBirth || null,
          gender: form.gender || null,
          phone: form.phone || null,
          address: form.address || null,
          blood_type: form.bloodType || null,
          medical_history: form.medicalHistory || null,
        }, { onConflict: 'user_id' });

      if (patientError) throw patientError;

      const updatedUser = { ...user, name: form.name };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      setMessage({ text: "Profile updated successfully.", type: "success" });
    } catch (err) {
      setMessage({ text: err.message, type: "danger" });
    } finally {
      setLoading(false);
    }
  };

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const alertClass = message.type === 'success' ? 'medical-alert-success' : 'medical-alert-danger';

  return (
    <div className="container-fluid px-4 py-4" style={{ maxWidth: 860 }}>
      {/* Page header */}
      <div className="mb-4">
        <p className="mp-overline mb-1">Patient</p>
        <h1 className="mp-h2 mb-1">My profile</h1>
        <p className="mp-body" style={{ marginBottom: 0 }}>
          Keep your personal and medical information up to date.
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
        {/* Personal */}
        <div className="medical-card mb-4" style={{ padding: 26 }}>
          <p className="mp-overline mb-3">Personal information</p>

          <div className="row g-3">
            <div className="col-md-6">
              <label className="medical-label">Full name <span className="required">*</span></label>
              <input
                type="text"
                name="name"
                className="medical-input"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-6">
              <label className="medical-label">Email</label>
              <input
                type="email"
                className="medical-input"
                value={form.email}
                disabled
                readOnly
              />
              <span className="medical-hint">Contact your clinic to change your email.</span>
            </div>
            <div className="col-md-6">
              <label className="medical-label">Date of birth</label>
              <input
                type="date"
                name="dateOfBirth"
                className="medical-input"
                value={form.dateOfBirth}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-6">
              <label className="medical-label">Gender</label>
              <select
                name="gender"
                className="medical-input"
                value={form.gender}
                onChange={handleChange}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="medical-label">Phone</label>
              <input
                type="tel"
                name="phone"
                className="medical-input"
                value={form.phone}
                onChange={handleChange}
                placeholder="+383 44 123 456"
              />
            </div>
            <div className="col-md-6">
              <label className="medical-label">Blood type</label>
              <select
                name="bloodType"
                className="medical-input"
                value={form.bloodType}
                onChange={handleChange}
              >
                <option value="">Select blood type</option>
                {bloodTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="col-12">
              <label className="medical-label">Address</label>
              <textarea
                name="address"
                className="medical-input"
                rows="2"
                value={form.address}
                onChange={handleChange}
                placeholder="Street, city"
              />
            </div>
          </div>
        </div>

        {/* Medical */}
        <div className="medical-card mb-4" style={{ padding: 26 }}>
          <p className="mp-overline mb-3">Medical information</p>

          <label className="medical-label">Medical history</label>
          <textarea
            name="medicalHistory"
            className="medical-input"
            rows="4"
            value={form.medicalHistory}
            onChange={handleChange}
            placeholder="Any allergies, chronic conditions, or past surgeries…"
          />
          <span className="medical-hint">
            This information is shared with the doctors you book appointments with.
          </span>
        </div>

        <button
          type="submit"
          className="medical-btn-primary medical-btn--lg w-100"
          disabled={loading}
        >
          {loading ? (
            <>
              <IconSpinner size={16} color="#fff" />
              Saving…
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