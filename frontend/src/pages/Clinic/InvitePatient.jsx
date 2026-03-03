import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import "../../styles/medical-theme.css";

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

  // Merr të dhënat e klinikës
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

      // Ruaj ftesën në Supabase
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

      // Thirr Edge Function për të dërguar email
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
        setMessage(`⚠️ Invitation saved but email failed. Share this link manually.`);
        setShowLink(registerLink);
      } else {
        setMessage(`✅ Invitation sent to ${formData.email}!`);
        setShowLink(registerLink);
        setFormData({ first_name: "", last_name: "", email: "" });
      }

    } catch (err) {
      console.error("Error:", err);
      setMessage(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid px-4 py-4">
      <div className="medical-header mb-4">
        <h2 className="mb-2">
          <i className="bi bi-envelope-plus me-2"></i>
          Invite New Patient
        </h2>
        <p className="mb-0">Send an invitation to a new patient</p>
      </div>

      <div className="row">
        <div className="col-lg-8 mx-auto">
          {/* Mesazhet */}
          {message && (
            <div className={`alert ${message.includes('✅') ? 'alert-success' : message.includes('⚠️') ? 'alert-warning' : 'alert-danger'} alert-dismissible fade show mb-4`}>
              {message}
              <button type="button" className="btn-close" onClick={() => setMessage("")}></button>
            </div>
          )}

          {/* Linku manual kur deshton email-i */}
          {showLink && message.includes('⚠️') && (
            <div className="medical-card bg-light mb-4">
              <div className="card-body">
                <h6 className="text-warning mb-3">
                  <i className="bi bi-link-45deg me-2"></i>
                  Share this link with the patient:
                </h6>
                <div className="input-group">
                  <input 
                    type="text" 
                    className="medical-input flex-grow-1" 
                    value={showLink} 
                    readOnly 
                  />
                  <button 
                    className="medical-btn-outline" 
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
          
          {/* Forma kryesore */}
          <div className="medical-card">
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6 mb-4">
                  <label className="medical-label">First Name *</label>
                  <input
                    type="text"
                    className="medical-input w-100"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    placeholder="Enter first name"
                  />
                </div>
                <div className="col-md-6 mb-4">
                  <label className="medical-label">Last Name *</label>
                  <input
                    type="text"
                    className="medical-input w-100"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="medical-label">Email Address *</label>
                <input
                  type="email"
                  className="medical-input w-100"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="patient@example.com"
                />
              </div>

              {!clinicData && !loading && (
                <div className="alert alert-info mb-4">
                  <div className="d-flex align-items-center">
                    <div className="spinner-border spinner-border-sm me-2" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <span>Loading clinic data...</span>
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                className="medical-btn-primary w-100 py-3" 
                disabled={loading || !clinicData}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Sending Invitation...
                  </>
                ) : (
                  <>
                    <i className="bi bi-send me-2"></i>
                    Send Invitation
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}