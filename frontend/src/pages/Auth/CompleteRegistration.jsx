import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import "../../styles/medical-theme.css";

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
          message: '✅ Registration successful! You can now login with your credentials.' 
        } 
      });

    } catch (err) {
      console.error('💥 Registration error:', err);
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="container-fluid py-5">
        <div className="row">
          <div className="col-lg-6 mx-auto text-center">
            <div className="medical-spinner mx-auto"></div>
            <p className="medical-label mt-3">Verifying your invitation...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="container-fluid py-5">
        <div className="row">
          <div className="col-lg-6 mx-auto">
            <div className="medical-card text-center">
              <div className="display-1 mb-3" style={{ color: 'var(--medical-danger)' }}>❌</div>
              <h3 className="fw-bold mb-3">Invalid Invitation</h3>
              <p className="text-muted mb-4">{error}</p>
              <hr />
              <p className="mb-4">
                Please contact the clinic that sent you this invitation.
              </p>
              <button 
                className="medical-btn-primary px-5 py-3"
                onClick={() => navigate("/")}
              >
                Go to Homepage
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-5">
      <div className="row">
        <div className="col-lg-6 mx-auto">
          <div className="medical-card">
            <h2 className="text-center mb-4" style={{ color: 'var(--medical-primary)' }}>
              Complete {role === 'doctor' ? 'Doctor' : 'Patient'} Registration
            </h2>
            
            <div className="alert alert-info mb-4">
              <p className="mb-1"><strong>Email:</strong> {invitation?.email}</p>
              {role === 'doctor' && invitation?.metadata?.specialization && (
                <p className="mb-1"><strong>Specialization:</strong> {invitation.metadata.specialization}</p>
              )}
              <p className="mb-0 small">After registration, you'll be redirected to login.</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6 mb-4">
                  <label className="medical-label">First Name *</label>
                  <input
                    name="first_name"
                    type="text"
                    className="medical-input w-100"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                    placeholder="Enter first name"
                  />
                </div>
                <div className="col-md-6 mb-4">
                  <label className="medical-label">Last Name *</label>
                  <input
                    name="last_name"
                    type="text"
                    className="medical-input w-100"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              {role === 'doctor' && (
                <div className="mb-4">
                  <label className="medical-label">Doctor Code</label>
                  <input
                    type="text"
                    placeholder="DR-XXXXX"
                    className="medical-input w-100"
                    value={doctorCode}
                    onChange={(e) => setDoctorCode(e.target.value.toUpperCase())}
                  />
                  <small className="text-muted d-block mt-1">
                    If left empty, one will be auto-generated
                  </small>
                </div>
              )}

              <div className="mb-4">
                <label className="medical-label">Phone Number</label>
                <input
                  name="phone"
                  type="tel"
                  className="medical-input w-100"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+383 44 123 456"
                />
              </div>

              <div className="mb-4">
                <label className="medical-label">Password *</label>
                <input
                  type="password"
                  name="password"
                  className="medical-input w-100"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength="6"
                  placeholder="Minimum 6 characters"
                />
              </div>

              <div className="mb-4">
                <label className="medical-label">Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  className="medical-input w-100"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="Confirm your password"
                />
              </div>

              {error && (
                <div className="alert alert-danger mb-4">
                  {error}
                </div>
              )}

              <button 
                type="submit" 
                className="medical-btn-primary w-100 py-3" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Processing...
                  </>
                ) : (
                  'Complete Registration'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}