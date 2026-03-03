import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

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
  
  // Input fields për array-t
  const [educationInput, setEducationInput] = useState("");
  const [languageInput, setLanguageInput] = useState("");

  // Merr të dhënat e klinikës dhe departamentet
  useEffect(() => {
    getClinicData();
  }, []);

  const getClinicData = async () => {
    try {
      const clinicUser = JSON.parse(localStorage.getItem("user"));
      if (!clinicUser?.id) return;
      
      // Merr të dhënat e klinikës
      const { data: clinic, error: clinicError } = await supabase
        .from('clinics')
        .select('id, name')
        .eq('user_id', clinicUser.id)
        .single();

      if (clinicError) throw clinicError;
      
      console.log('Clinic found:', clinic);
      setClinicData(clinic);

      // Merr departamentet e klinikës
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

  // Funksionet për Education
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

  // Funksionet për Languages
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

      // Ruaj ftesën në Supabase me metadata
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

      // Thirr Edge Function për të dërguar email
      // Thirr Edge Function për të dërguar email - me role
const { error: emailError } = await supabase.functions.invoke('send-invitation-smtp', {
  body: {
    to_email: formData.email,
    to_name: formData.name,
    inviter_name: clinicData.name,
    token: token,
    role: 'doctor'  // Shto këtë!
  }
});

      if (emailError) {
        console.error('Email error:', emailError);
        setMessage(`⚠️ Invitation saved but email failed. Share this link manually.`);
      } else {
        setMessage(`✅ Invitation sent to ${formData.email}!`);
        
        // Reset form
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
      setMessage(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4" style={{ maxWidth: "700px" }}>
      <div className="card shadow">
        <div className="card-header bg-primary text-white">
          <h4 className="mb-0">
            <i className="bi bi-envelope-plus me-2"></i>
            Invite New Doctor
          </h4>
        </div>
        <div className="card-body">
          {/* Mesazhet */}
          {message && (
            <div className={`alert ${message.includes('✅') ? 'alert-success' : message.includes('⚠️') ? 'alert-warning' : 'alert-danger'} mb-4`}>
              {message}
            </div>
          )}

          {/* Linku manual kur deshton email-i */}
          {showLink && message.includes('⚠️') && (
            <div className="card bg-light mb-4">
              <div className="card-body">
                <h6 className="card-title text-warning mb-3">
                  <i className="bi bi-link-45deg me-2"></i>
                  Share this link with the doctor:
                </h6>
                <div className="input-group">
                  <input 
                    type="text" 
                    className="form-control" 
                    value={showLink} 
                    readOnly 
                  />
                  <button 
                    className="btn btn-outline-primary" 
                    type="button"
                    onClick={() => copyToClipboard(showLink)}
                  >
                    <i className="bi bi-clipboard me-2"></i>
                    Copy
                  </button>
                </div>
                <small className="text-muted d-block mt-2">
                  This link will expire in 7 days.
                </small>
              </div>
            </div>
          )}

          {!clinicData && !loading && (
            <div className="alert alert-info">
              <div className="d-flex align-items-center">
                <div className="spinner-border spinner-border-sm me-2" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <span>Loading clinic data...</span>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            {/* Basic Information */}
            <h5 className="medical-label mb-3">Basic Information</h5>
            
            <div className="mb-3">
              <label className="form-label fw-bold">Full Name *</label>
              <input
                name="name"
                type="text"
                className="form-control"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold">Email *</label>
              <input
                name="email"
                type="email"
                className="form-control"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold">Department *</label>
                <select
                  name="departmentId"
                  className="form-control"
                  value={formData.departmentId}
                  onChange={handleChange}
                  required
                  disabled={loading}
                >
                  <option value="">Select Department</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold">Phone</label>
                <input
                  name="phone"
                  type="tel"
                  className="form-control"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Professional Information */}
            <h5 className="medical-label mb-3 mt-4">Professional Information</h5>
            
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold">Specialization</label>
                <input
                  name="specialization"
                  type="text"
                  className="form-control"
                  value={formData.specialization}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold">Consultation Fee (€)</label>
                <input
                  name="consultationFee"
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-control"
                  value={formData.consultationFee}
                  onChange={handleNumberChange}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold">Years of Experience</label>
                <input
                  name="yearsOfExperience"
                  type="number"
                  min="0"
                  className="form-control"
                  value={formData.yearsOfExperience}
                  onChange={handleNumberChange}
                  disabled={loading}
                />
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold">License Number</label>
                <input
                  name="licenseNumber"
                  type="text"
                  className="form-control"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Education */}
            <div className="mb-3">
              <label className="form-label fw-bold">Education</label>
              <div className="input-group mb-2">
                <input
                  type="text"
                  className="form-control"
                  value={educationInput}
                  onChange={(e) => setEducationInput(e.target.value)}
                  placeholder="e.g., MD, University of Medicine"
                  disabled={loading}
                />
                <button 
                  type="button" 
                  className="btn btn-outline-primary"
                  onClick={addEducation}
                  disabled={loading}
                >
                  Add
                </button>
              </div>
              <div>
                {formData.education.map((edu, index) => (
                  <span key={index} className="badge bg-secondary me-1 mb-1 p-2">
                    {edu}
                    <button
                      type="button"
                      className="btn-close btn-close-white ms-2"
                      onClick={() => removeEducation(index)}
                      style={{ fontSize: '0.5rem' }}
                    ></button>
                  </span>
                ))}
              </div>
            </div>

            {/* Languages */}
            <div className="mb-3">
              <label className="form-label fw-bold">Languages Spoken</label>
              <div className="input-group mb-2">
                <input
                  type="text"
                  className="form-control"
                  value={languageInput}
                  onChange={(e) => setLanguageInput(e.target.value)}
                  placeholder="e.g., English, Albanian"
                  disabled={loading}
                />
                <button 
                  type="button" 
                  className="btn btn-outline-primary"
                  onClick={addLanguage}
                  disabled={loading}
                >
                  Add
                </button>
              </div>
              <div>
                {formData.languages.map((lang, index) => (
                  <span key={index} className="badge bg-secondary me-1 mb-1 p-2">
                    {lang}
                    <button
                      type="button"
                      className="btn-close btn-close-white ms-2"
                      onClick={() => removeLanguage(index)}
                      style={{ fontSize: '0.5rem' }}
                    ></button>
                  </span>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              className="btn btn-primary w-100 mt-3" 
              disabled={loading || !clinicData}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Sending Invitation...
                </>
              ) : (
                '📨 Send Invitation'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}