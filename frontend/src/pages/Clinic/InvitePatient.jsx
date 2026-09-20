import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import "../../styles/medical-theme.css";

const IconSend = (p) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
  </svg>
);
const IconCopy = (p) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="9" y="9" width="13" height="13" rx="2"/>
    <path d="M5 15V5a2 2 0 0 1 2-2h10"/>
  </svg>
);
const IconAlert = (p) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
  </svg>
);
const IconCheck = (p) => (
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

export default function InvitePatient() {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: ""
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [clinicData, setClinicData] = useState(null);
  const [showLink, setShowLink] = useState(null);

  useEffect(() => {
    getClinicData();
  }, []);

  const getClinicData = async () => {
    try {
      const clinicUser = JSON.parse(localStorage.getItem("user"));
      if (!clinicUser?.id) return;

      const { data, error } = await supabase
        .from('clinics')
        .select('id, name')
        .eq('user_id', clinicUser.id)
        .single();

      if (!error && data) {
        console.log('Clinic found:', data);
        setClinicData(data);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const generateToken = () => {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Link copied to clipboard!');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setShowLink(null);

    try {
      if (!clinicData) throw new Error("Clinic not found");

      const token = generateToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { error: dbError } = await supabase
        .from('invitations')
        .insert([{
          email: formData.email,
          role: 'patient',
          clinic_id: clinicData.id,
          token: token,
          status: 'pending',
          expires_at: expiresAt.toISOString()
        }]);

      if (dbError) throw dbError;

      const registerLink = `http://localhost:5173/complete-registration/patient?token=${token}`;
      const patientName = `${formData.first_name} ${formData.last_name}`.trim();

      const { error: emailError } = await supabase.functions.invoke('send-invitation-smtp', {
        body: {
          to_email: formData.email,
          to_name: patientName,
          inviter_name: clinicData.name,
          token: token
        }
      });

      if (emailError) {
        console.error('Email error:', emailError);
        setMessage(`Invitation saved but email delivery failed. Share this link manually.`);
        setShowLink(registerLink);
      } else {
        setMessage(`Invitation sent to ${formData.email}.`);
        setShowLink(registerLink);
        setFormData({ first_name: "", last_name: "", email: "" });
      }

    } catch (err) {
      console.error("Error:", err);
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const messageType =
    message.startsWith("Invitation sent") ? "success" :
    message.startsWith("Invitation saved") ? "warning" : "danger";

  const alertClass =
    messageType === "success" ? "medical-alert-success" :
    messageType === "warning" ? "medical-alert-warning" : "medical-alert-danger";

  const alertIcon =
    messageType === "success" ? <IconCheck /> : <IconAlert />;

  return (
    <div className="container-fluid px-4 py-4" style={{ maxWidth: 720 }}>
      {/* Page header */}
      <div className="mb-4">
        <p className="mp-overline mb-1">Clinic</p>
        <h1 className="mp-h2 mb-1">Invite a patient</h1>
        <p className="mp-body" style={{ marginBottom: 0 }}>
          Send a registration link to onboard a new patient.
        </p>
      </div>

      {message && (
        <div className={`medical-alert ${alertClass} mb-4`}>
          <span className="medical-alert__icon">{alertIcon}</span>
          <div>{message}</div>
        </div>
      )}

      {showLink && messageType === "warning" && (
        <div className="medical-card mb-4" style={{ padding: 20 }}>
          <p className="mp-overline mb-2">Manual invitation link</p>
          <div className="d-flex gap-2 flex-wrap">
            <input
              type="text"
              className="medical-input flex-grow-1"
              value={showLink}
              readOnly
              style={{ fontFamily: 'var(--mp-font-mono)', fontSize: 13 }}
            />
            <button
              type="button"
              className="medical-btn-outline"
              onClick={() => copyToClipboard(showLink)}
            >
              <IconCopy />
              Copy
            </button>
          </div>
          <p className="mp-caption mt-2 mb-0">This link expires in 7 days.</p>
        </div>
      )}

      {!clinicData && !loading && (
        <div className="medical-alert medical-alert-info mb-4">
          <span className="medical-alert__icon">
            <IconSpinner size={16} />
          </span>
          <div>Loading clinic data…</div>
        </div>
      )}

      <div className="medical-card" style={{ padding: 26 }}>
        <p className="mp-overline mb-3">Patient details</p>

        <form onSubmit={handleSubmit}>
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="medical-label">
                First name <span className="required">*</span>
              </label>
              <input
                type="text"
                className="medical-input"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder="First name"
              />
            </div>
            <div className="col-md-6">
              <label className="medical-label">
                Last name <span className="required">*</span>
              </label>
              <input
                type="text"
                className="medical-input"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder="Last name"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="medical-label">
              Email address <span className="required">*</span>
            </label>
            <input
              type="email"
              className="medical-input"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="patient@example.com"
            />
            <span className="medical-hint">
              The patient will receive a registration link at this address.
            </span>
          </div>

          <button
            type="submit"
            className="medical-btn-primary medical-btn--lg w-100"
            disabled={loading || !clinicData}
          >
            {loading ? (
              <>
                <IconSpinner size={16} color="#fff" />
                Sending invitation…
              </>
            ) : (
              <>
                <IconSend />
                Send invitation
              </>
            )}
          </button>
        </form>
      </div>

      <style>{`@keyframes mp-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}