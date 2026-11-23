import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import "../../styles/medical-theme.css";

const IconUserPlus = (p) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/><path d="M20 8v6M23 11h-6"/>
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
const IconX = (p) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M18 6L6 18M6 6l12 12"/>
  </svg>
);
const IconPlus = (p) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M12 5v14M5 12h14"/>
  </svg>
);
const IconSend = (p) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
  </svg>
);
const IconSpinner = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    style={{ animation: 'mp-spin 0.9s linear infinite' }}>
    <circle cx="12" cy="12" r="9" stroke={color} strokeOpacity="0.25" strokeWidth="2.5"/>
    <path d="M21 12a9 9 0 0 0-9-9" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

export default function ClinicAddDoctor() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    departmentId: "",
    specialization: "",
    consultationFee: 50,
    phone: "",
    education: [],
    languages: [],
    yearsOfExperience: "",
    licenseNumber: "",
    certifications: []
  });

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [clinicData, setClinicData] = useState(null);
  const [showLink, setShowLink] = useState(null);

  const [educationInput, setEducationInput] = useState("");
  const [languageInput, setLanguageInput] = useState("");

  useEffect(() => {
    getClinicData();
  }, []);

  const getClinicData = async () => {
    try {
      const clinicUser = JSON.parse(localStorage.getItem("user"));
      if (!clinicUser?.id) return;

      const { data: clinic, error: clinicError } = await supabase
        .from('clinics')
        .select('id, name')
        .eq('user_id', clinicUser.id)
        .single();

      if (clinicError) throw clinicError;

      console.log('Clinic found:', clinic);
      setClinicData(clinic);

      const { data: depts, error: deptsError } = await supabase
        .from('departments')
        .select('id, name')
        .eq('clinic_id', clinic.id);

      if (deptsError) throw deptsError;

      setDepartments(depts || []);

    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNumberChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value ? parseFloat(e.target.value) : "" });
  };

  const addEducation = () => {
    if (educationInput.trim()) {
      setFormData({
        ...formData,
        education: [...formData.education, educationInput.trim()]
      });
      setEducationInput("");
    }
  };

  const removeEducation = (index) => {
    const newEducation = [...formData.education];
    newEducation.splice(index, 1);
    setFormData({ ...formData, education: newEducation });
  };

  const addLanguage = () => {
    if (languageInput.trim()) {
      setFormData({
        ...formData,
        languages: [...formData.languages, languageInput.trim()]
      });
      setLanguageInput("");
    }
  };

  const removeLanguage = (index) => {
    const newLanguages = [...formData.languages];
    newLanguages.splice(index, 1);
    setFormData({ ...formData, languages: newLanguages });
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
          role: 'doctor',
          clinic_id: clinicData.id,
          token: token,
          status: 'pending',
          expires_at: expiresAt.toISOString(),
          metadata: {
            name: formData.name,
            departmentId: formData.departmentId,
            specialization: formData.specialization,
            consultationFee: formData.consultationFee,
            phone: formData.phone,
            education: formData.education,
            languages: formData.languages,
            yearsOfExperience: formData.yearsOfExperience,
            licenseNumber: formData.licenseNumber,
            certifications: formData.certifications
          }
        }]);

      if (dbError) throw dbError;

      const registerLink = `http://localhost:5173/complete-registration/doctor?token=${token}`;
      setShowLink(registerLink);

      const { error: emailError } = await supabase.functions.invoke('send-invitation-smtp', {
        body: {
          to_email: formData.email,
          to_name: formData.name,
          inviter_name: clinicData.name,
          token: token,
          role: 'doctor'
        }
      });

      if (emailError) {
        console.error('Email error:', emailError);
        setMessage(`Invitation saved but email delivery failed. Share this link manually.`);
      } else {
        setMessage(`Invitation sent to ${formData.email}.`);

        setFormData({
          name: "",
          email: "",
          departmentId: "",
          specialization: "",
          consultationFee: 50,
          phone: "",
          education: [],
          languages: [],
          yearsOfExperience: "",
          licenseNumber: "",
          certifications: []
        });
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
    messageType === "success" ? <IconCheck /> :
    messageType === "warning" ? <IconAlert /> : <IconAlert />;

  return (
    <div className="container-fluid px-4 py-4" style={{ maxWidth: 960 }}>
      {/* Page header */}
      <div className="mb-4">
        <p className="mp-overline mb-1">Clinic setup</p>
        <h1 className="mp-h2 mb-1">Invite a doctor</h1>
        <p className="mp-body" style={{ marginBottom: 0 }}>
          Send an invitation link to onboard a new doctor to your clinic.
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

      <form onSubmit={handleSubmit}>
        {/* Basic info */}
        <div className="medical-card mb-4" style={{ padding: 26 }}>
          <p className="mp-overline mb-3">Basic information</p>

          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="medical-label">
                Full name <span className="required">*</span>
              </label>
              <input
                name="name"
                type="text"
                className="medical-input"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder="Dr. Jane Doe"
              />
            </div>
            <div className="col-md-6">
              <label className="medical-label">
                Email address <span className="required">*</span>
              </label>
              <input
                name="email"
                type="email"
                className="medical-input"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder="jane.doe@clinic.com"
              />
            </div>
          </div>

          <div className="row g-3">
            <div className="col-md-6">
              <label className="medical-label">
                Department <span className="required">*</span>
              </label>
              <select
                name="departmentId"
                className="medical-input"
                value={formData.departmentId}
                onChange={handleChange}
                required
                disabled={loading}
              >
                <option value="">Select department</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <label className="medical-label">Phone</label>
              <input
                name="phone"
                type="tel"
                className="medical-input"
                value={formData.phone}
                onChange={handleChange}
                disabled={loading}
                placeholder="+383 44 123 456"
              />
            </div>
          </div>
        </div>

        {/* Professional info */}
        <div className="medical-card mb-4" style={{ padding: 26 }}>
          <p className="mp-overline mb-3">Professional information</p>

          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="medical-label">Specialization</label>
              <input
                name="specialization"
                type="text"
                className="medical-input"
                value={formData.specialization}
                onChange={handleChange}
                disabled={loading}
                placeholder="e.g. Cardiologist"
              />
            </div>
            <div className="col-md-6">
              <label className="medical-label">Consultation fee (€)</label>
              <input
                name="consultationFee"
                type="number"
                step="0.01"
                min="0"
                className="medical-input"
                value={formData.consultationFee}
                onChange={handleNumberChange}
                disabled={loading}
              />
            </div>
          </div>

          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="medical-label">Years of experience</label>
              <input
                name="yearsOfExperience"
                type="number"
                min="0"
                className="medical-input"
                value={formData.yearsOfExperience}
                onChange={handleNumberChange}
                disabled={loading}
              />
            </div>
            <div className="col-md-6">
              <label className="medical-label">License number</label>
              <input
                name="licenseNumber"
                type="text"
                className="medical-input"
                value={formData.licenseNumber}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          {/* Education */}
          <div className="mb-3">
            <label className="medical-label">Education</label>
            <div className="d-flex gap-2 mb-2">
              <input
                type="text"
                className="medical-input flex-grow-1"
                value={educationInput}
                onChange={(e) => setEducationInput(e.target.value)}
                placeholder="e.g. MD, University of Medicine"
                disabled={loading}
              />
              <button
                type="button"
                className="medical-btn-outline"
                onClick={addEducation}
                disabled={loading}
              >
                <IconPlus />
                Add
              </button>
            </div>
            {formData.education.length > 0 && (
              <div className="d-flex flex-wrap gap-2 mt-2">
                {formData.education.map((edu, index) => (
                  <span
                    key={index}
                    className="mp-badge mp-badge--neutral"
                    style={{ paddingRight: 6 }}
                  >
                    {edu}
                    <button
                      type="button"
                      onClick={() => removeEducation(index)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        marginLeft: 6,
                        cursor: 'pointer',
                        color: 'var(--mp-text-muted)',
                        display: 'inline-flex',
                      }}
                    >
                      <IconX />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Languages */}
          <div>
            <label className="medical-label">Languages spoken</label>
            <div className="d-flex gap-2 mb-2">
              <input
                type="text"
                className="medical-input flex-grow-1"
                value={languageInput}
                onChange={(e) => setLanguageInput(e.target.value)}
                placeholder="e.g. English, Albanian"
                disabled={loading}
              />
              <button
                type="button"
                className="medical-btn-outline"
                onClick={addLanguage}
                disabled={loading}
              >
                <IconPlus />
                Add
              </button>
            </div>
            {formData.languages.length > 0 && (
              <div className="d-flex flex-wrap gap-2 mt-2">
                {formData.languages.map((lang, index) => (
                  <span
                    key={index}
                    className="mp-badge mp-badge--neutral"
                    style={{ paddingRight: 6 }}
                  >
                    {lang}
                    <button
                      type="button"
                      onClick={() => removeLanguage(index)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        marginLeft: 6,
                        cursor: 'pointer',
                        color: 'var(--mp-text-muted)',
                        display: 'inline-flex',
                      }}
                    >
                      <IconX />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Submit */}
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

      <style>{`@keyframes mp-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}