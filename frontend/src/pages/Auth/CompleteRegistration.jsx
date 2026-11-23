import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import "../../styles/medical-theme.css";

/* ---------- Icons ---------- */
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
const IconCheck = (p) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/>
  </svg>
);
const IconSpinner = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    style={{ animation: 'mp-spin 0.9s linear infinite' }}>
    <circle cx="12" cy="12" r="9" stroke={color} strokeOpacity="0.15" strokeWidth="2.5"/>
    <path d="M21 12a9 9 0 0 0-9-9" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

export default function CompleteRegistration() {
  const { role } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [invitation, setInvitation] = useState(null);
  const [verifying, setVerifying] = useState(true);
  const [doctorCode, setDoctorCode] = useState("");
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });

  useEffect(() => {
    const token = searchParams.get('token');
    console.log("🔍 Token from URL:", token);
    console.log("🔍 Role from URL:", role);

    if (!token) {
      setError("Invalid invitation link - no token found");
      setVerifying(false);
      return;
    }

    const verifyInvitation = async () => {
      try {
        console.log("🔍 Verifying invitation with token:", token);

        const { data, error } = await supabase
          .from('invitations')
          .select('*')
          .eq('token', token)
          .eq('status', 'pending')
          .maybeSingle();

        console.log("📦 Invitation data:", data);
        console.log("❌ Error:", error);

        if (error) {
          console.error("Database error:", error);
          setError("Error verifying invitation");
          setVerifying(false);
          return;
        }

        if (!data) {
          console.log("❌ No invitation found with token:", token);
          setError("Invitation not found or already used");
          setVerifying(false);
          return;
        }

        const expiresAt = new Date(data.expires_at);
        const now = new Date();

        if (expiresAt < now) {
          console.log("❌ Invitation expired:", { expiresAt, now });
          setError("Invitation has expired");
          setVerifying(false);
          return;
        }

        if (data.role !== role) {
          setError(`This invitation is for a ${data.role}, not a ${role}`);
          setVerifying(false);
          return;
        }

        console.log("✅ Invitation verified successfully");
        console.log("📦 Metadata:", data.metadata);

        setInvitation(data);
        setVerifying(false);

        if (role === 'doctor' && data.metadata?.name) {
          const nameParts = data.metadata.name.split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';

          setFormData(prev => ({
            ...prev,
            first_name: firstName,
            last_name: lastName,
            phone: data.metadata.phone || ''
          }));

          if (data.metadata.doctor_code) {
            setDoctorCode(data.metadata.doctor_code);
          }
        }

      } catch (err) {
        console.error("💥 Verification error:", err);
        setError("Error verifying invitation");
        setVerifying(false);
      }
    };

    verifyInvitation();
  }, [role, searchParams]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!invitation) {
        console.error("❌ No invitation found in state");
        throw new Error("No invitation found");
      }

      if (formData.password.length < 6) throw new Error("Password too short");
      if (formData.password !== formData.confirmPassword) throw new Error("Passwords don't match");

      const fullName = `${formData.first_name} ${formData.last_name}`;
      const userId = uuidv4();

      console.log("📝 Creating user with ID:", userId);
      console.log("📝 Invitation data:", invitation);

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(formData.password, saltRounds);

      // 1. Insert into users table
      const { error: userError } = await supabase
        .from('users')
        .insert([{
          id: userId,
          email: invitation.email,
          name: fullName,
          role: role,
          is_verified: true,
          phone: formData.phone || null,
          password: hashedPassword,
          created_at: new Date().toISOString()
        }]);

      if (userError) {
        console.error("❌ Users insert error:", userError);
        throw userError;
      }
      console.log("✅ User inserted successfully");

      // 2. Insert into role-specific table
      if (role === 'patient') {
        const { error: patientError } = await supabase
          .from('patients')
          .insert([{
            user_id: userId,
            name: fullName,
            email: invitation.email,
            phone: formData.phone || null
          }]);

        if (patientError) {
          console.error("❌ Patients insert error:", patientError);
        } else {
          console.log("✅ Patient inserted successfully with email");
        }
      }

      else if (role === 'doctor') {
        const metadata = invitation.metadata || {};
        console.log("📦 Doctor metadata:", metadata);

        const finalDoctorCode = doctorCode || metadata.doctor_code || `DR-${userId.slice(0, 8).toUpperCase()}`;

        const doctorData = {
          user_id: userId,
          name: fullName,
          doctor_code: finalDoctorCode,
          clinic_id: invitation.clinic_id,
          department_id: metadata.departmentId || null,
          specialization: metadata.specialization || 'General Practitioner',
          consultation_fee: metadata.consultationFee || 50,
          phone: formData.phone || metadata.phone || null,
          email: invitation.email,
          is_available: true,
          created_at: new Date().toISOString()
        };

        if (metadata.education && metadata.education.length > 0) {
          doctorData.education = metadata.education;
        }

        if (metadata.languages && metadata.languages.length > 0) {
          doctorData.languages_spoken = metadata.languages;
        }

        if (metadata.yearsOfExperience) {
          doctorData.years_of_experience = metadata.yearsOfExperience;
        }

        if (metadata.licenseNumber) {
          doctorData.license_number = metadata.licenseNumber;
        }

        console.log("📝 Inserting doctor with data:", doctorData);

        const { error: doctorError } = await supabase
          .from('doctors')
          .insert([doctorData]);

        if (doctorError) {
          console.error("❌ Doctors insert error:", doctorError);
          throw doctorError;
        }
        console.log("✅ Doctor inserted successfully");
      }

      // 3. Update invitation status
      const { error: updateError } = await supabase
        .from('invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          user_id: userId
        })
        .eq('id', invitation.id);

      if (updateError) {
        console.error("❌ Invitation update error:", updateError);
      } else {
        console.log("✅ Invitation updated successfully");
      }

      console.log("🎉 Registration complete, redirecting to login");
      navigate('/login', {
        state: {
          message: 'Registration successful! You can now login with your credentials.'
        }
      });

    } catch (err) {
      console.error('💥 Registration error:', err);
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  /* ============ LOADING STATE ============ */
  if (verifying) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center"
        style={{ background: 'var(--mp-bg-subtle)' }}>
        <div className="text-center mp-fade-in">
          <div style={{ color: 'var(--mp-primary)', marginBottom: 16 }}>
            <IconSpinner size={32} />
          </div>
          <p className="mp-body" style={{ marginBottom: 0 }}>
            Verifying your invitation…
          </p>
        </div>
      </div>
    );
  }

  /* ============ ERROR STATE ============ */
  if (error && !invitation) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center"
        style={{ background: 'var(--mp-bg-subtle)', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 460 }}>
          <div className="medical-card text-center mp-scale-in" style={{ padding: 32 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 56,
                height: 56,
                borderRadius: 14,
                background: 'var(--mp-danger-bg)',
                color: 'var(--mp-danger)',
                border: '1px solid var(--mp-danger-bd)',
                marginBottom: 20,
              }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
              </svg>
            </div>

            <h2 className="mp-h3 mb-2">Invalid invitation</h2>
            <p className="mp-body mb-4">{error}</p>

            <hr className="mp-divider" />

            <p className="mp-caption mb-4">
              Please contact the clinic that sent you this invitation.
            </p>

            <button
              className="medical-btn-primary w-100"
              onClick={() => navigate("/")}
            >
              <IconArrowLeft />
              Go to homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ============ MAIN FORM ============ */
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
            Account setup
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
                <h1 className="mp-h2 mb-2">
                  Complete {role === 'doctor' ? 'doctor' : 'patient'} registration
                </h1>
                <p className="mp-body" style={{ marginBottom: 0 }}>
                  Set your credentials to activate your MedPal account.
                </p>
              </div>

              <div className="medical-card mp-scale-in" style={{ padding: 32 }}>
                {/* Invitation info */}
                <div className="medical-alert medical-alert-info mb-4">
                  <span className="medical-alert__icon">
                    <IconAlert />
                  </span>
                  <div style={{ fontSize: 13.5 }}>
                    <div className="mb-1">
                      <strong>Email:</strong> {invitation?.email}
                    </div>
                    {role === 'doctor' && invitation?.metadata?.specialization && (
                      <div className="mb-1">
                        <strong>Specialization:</strong> {invitation.metadata.specialization}
                      </div>
                    )}
                    <div style={{ opacity: 0.85 }}>
                      After registration, you'll be redirected to sign in.
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="medical-alert medical-alert-danger mb-4">
                    <span className="medical-alert__icon">
                      <IconAlert />
                    </span>
                    <div>{error}</div>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <p className="mp-overline" style={{ marginBottom: 14 }}>
                    Personal information
                  </p>

                  <div className="row g-3 mb-3">
                    <div className="col-sm-6">
                      <label className="medical-label">
                        First name <span className="required">*</span>
                      </label>
                      <input
                        name="first_name"
                        type="text"
                        className="medical-input"
                        value={formData.first_name}
                        onChange={handleChange}
                        required
                        placeholder="Enter first name"
                      />
                    </div>
                    <div className="col-sm-6">
                      <label className="medical-label">
                        Last name <span className="required">*</span>
                      </label>
                      <input
                        name="last_name"
                        type="text"
                        className="medical-input"
                        value={formData.last_name}
                        onChange={handleChange}
                        required
                        placeholder="Enter last name"
                      />
                    </div>
                  </div>

                  {role === 'doctor' && (
                    <div className="mb-3">
                      <label className="medical-label">Doctor code</label>
                      <input
                        type="text"
                        placeholder="DR-XXXXX"
                        className="medical-input"
                        value={doctorCode}
                        onChange={(e) => setDoctorCode(e.target.value.toUpperCase())}
                      />
                      <span className="medical-hint">
                        If left empty, one will be auto-generated
                      </span>
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="medical-label">Phone number</label>
                    <input
                      name="phone"
                      type="tel"
                      className="medical-input"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+383 44 123 456"
                    />
                  </div>

                  <hr className="mp-divider" />

                  <p className="mp-overline" style={{ marginBottom: 14 }}>
                    Security
                  </p>

                  <div className="row g-3 mb-4">
                    <div className="col-sm-6">
                      <label className="medical-label">
                        Password <span className="required">*</span>
                      </label>
                      <input
                        type="password"
                        name="password"
                        className="medical-input"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        minLength="6"
                        placeholder="Minimum 6 characters"
                      />
                    </div>
                    <div className="col-sm-6">
                      <label className="medical-label">
                        Confirm password <span className="required">*</span>
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        className="medical-input"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        placeholder="Repeat password"
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
                      <>
                        <IconCheck />
                        Complete registration
                      </>
                    )}
                  </button>
                </form>
              </div>

              <p
                className="text-center mt-4 mp-caption"
                style={{ fontSize: 12.5, color: 'var(--mp-text-faint)' }}
              >
                Your information is encrypted and securely stored.
              </p>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes mp-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}