import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import "bootstrap/dist/css/bootstrap.min.css";
import bcrypt from 'bcryptjs';

export default function Login() {
  const location = useLocation();
  const [step, setStep] = useState("select");
  const [role, setRole] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    doctorCode: "",
  });
  const [resetData, setResetData] = useState({
    email: "",
    newPassword: "",
    confirmPassword: "",
    token: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(location.state?.message || "");
  const [resetStep, setResetStep] = useState("request"); // request, verify, reset
  
  const navigate = useNavigate();

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setStep("login");
    setError("");
    setMessage("");
    setFormData({ email: "", password: "", doctorCode: "" });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleResetChange = (e) => {
    setResetData({ ...resetData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let userData;

      if (role === "doctor") {
        // 🔍 Kërko doktorin me doctor code
        console.log("🔍 Looking for doctor with code:", formData.doctorCode);
        
        const { data: doctor, error: doctorError } = await supabase
          .from('doctors')
          .select(`
            user_id,
            name,
            doctor_code,
            specialization,
            consultation_fee,
            phone,
            users!inner (
              email,
              role,
              is_verified,
              password
            )
          `)
          .eq('doctor_code', formData.doctorCode)
          .maybeSingle();

        if (doctorError) {
          console.error("Doctor lookup error:", doctorError);
          throw new Error("Error looking up doctor code");
        }

        if (!doctor) {
          console.log("Doctor code not found:", formData.doctorCode);
          throw new Error("Doctor code not found");
        }

        console.log("✅ Doctor found:", doctor);

        // 🔐 VERIFIKO PASSWORD-IN ME BCRYPT
        const isValidPassword = await bcrypt.compare(formData.password, doctor.users.password);
        
        if (!isValidPassword) {
          throw new Error("Incorrect password");
        }
        
        userData = {
          id: doctor.user_id,
          email: doctor.users.email,
          name: doctor.name,
          role: 'doctor',
          is_verified: doctor.users.is_verified || true,
          doctor_code: doctor.doctor_code,
          specialization: doctor.specialization,
          phone: doctor.phone
        };
      } 
      else if (role === "clinic") {
        // 🏥 Kërko klinikën në users
        console.log("🔍 Looking for clinic with email:", formData.email);
        
        const { data: users, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('email', formData.email)
          .eq('role', 'clinic');

        if (userError) {
          console.error("Clinic lookup error:", userError);
          throw userError;
        }
        
        if (!users || users.length === 0) {
          console.log("Clinic not found with email:", formData.email);
          throw new Error("Invalid email or password");
        }

        const user = users[0];
        console.log("✅ Clinic found:", user);

        // 🔐 VERIFIKO PASSWORD-IN ME BCRYPT
        const isValidPassword = await bcrypt.compare(formData.password, user.password);
        
        if (!isValidPassword) {
          console.log("Password mismatch");
          throw new Error("Invalid email or password");
        }

        userData = user;
      }
      else {
        // 🧑‍⚕️ Kërko pacientin në users
        console.log("🔍 Looking for patient with email:", formData.email);
        
        const { data: users, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('email', formData.email)
          .eq('role', 'patient');

        if (userError) {
          console.error("Patient lookup error:", userError);
          throw userError;
        }
        
        if (!users || users.length === 0) {
          console.log("Patient not found with email:", formData.email);
          throw new Error("Invalid email or password");
        }

        const user = users[0];
        console.log("✅ Patient found:", user);

        // 🔐 VERIFIKO PASSWORD-IN ME BCRYPT
        const isValidPassword = await bcrypt.compare(formData.password, user.password);
        
        if (!isValidPassword) {
          console.log("Password mismatch");
          throw new Error("Invalid email or password");
        }

        // Merr të dhëna shtesë për pacientin
        const { data: patient } = await supabase
          .from('patients')
          .select('phone, date_of_birth, gender, blood_type, address')
          .eq('user_id', user.id)
          .maybeSingle();
        
        userData = { ...user, ...patient };
      }

      // Verifiko që roli përputhet
      if (userData.role !== role) {
        throw new Error(`This account is registered as ${userData.role}, not as ${role}`);
      }

      // 🔥 Kontrollo nëse pacienti është i verifikuar
      if (role === "patient" && !userData.is_verified) {
        throw new Error("📧 Please verify your email before logging in.");
      }

      // Hiq password-in para se ta ruash në localStorage
      const { password, ...userWithoutPassword } = userData;
      
      // Ruaj të dhënat dhe ridrejto
      localStorage.setItem('user', JSON.stringify(userWithoutPassword));
      console.log("✅ Login successful, redirecting to:", `/${userData.role}`);
      navigate(`/${userData.role}`);

    } catch (err) {
      console.error("Login error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      // Kërko user-in në users
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, email, name')
        .eq('email', resetData.email);

      if (userError) throw userError;

      if (!users || users.length === 0) {
        throw new Error("Email not found");
      }

      const user = users[0];
      
      // Gjenero token për reset password
      const token = Math.random().toString(36).substring(2, 15) + 
                    Math.random().toString(36).substring(2, 15);
      
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // Token skadon pas 1 ore

      // Ruaj token-in në tabelën password_resets (krijoje nëse nuk ekziston)
      const { error: tokenError } = await supabase
        .from('password_resets')
        .insert([{
          user_id: user.id,
          email: user.email,
          token: token,
          expires_at: expiresAt.toISOString(),
          used: false
        }]);

      if (tokenError) throw tokenError;

      // Dërgo email përmes Edge Function
      const resetLink = `http://localhost:5173/reset-password?token=${token}`;
      
      const { error: emailError } = await supabase.functions.invoke('send-reset-password', {
        body: {
          to_email: user.email,
          to_name: user.name,
          reset_link: resetLink
        }
      });

      if (emailError) {
        console.error("Email error:", emailError);
        setMessage("⚠️ Password reset link generated but email failed. Contact support.");
        setResetData({ ...resetData, token: token });
        setResetStep("verify");
      } else {
        setMessage("✅ Password reset email sent! Check your inbox.");
        setResetStep("verify");
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyToken = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data: reset, error: resetError } = await supabase
        .from('password_resets')
        .select('*')
        .eq('token', resetData.token)
        .eq('used', false)
        .maybeSingle();

      if (resetError) throw resetError;

      if (!reset) {
        throw new Error("Invalid or expired reset token");
      }

      if (new Date(reset.expires_at) < new Date()) {
        throw new Error("Reset token has expired");
      }

      setResetData(prev => ({ ...prev, email: reset.email }));
      setResetStep("reset");
      setMessage("✅ Token verified. Enter your new password.");

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (resetData.newPassword.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      if (resetData.newPassword !== resetData.confirmPassword) {
        throw new Error("Passwords do not match");
      }

      // Verifiko token-in përsëri
      const { data: reset, error: resetError } = await supabase
        .from('password_resets')
        .select('*')
        .eq('token', resetData.token)
        .eq('used', false)
        .maybeSingle();

      if (resetError) throw resetError;
      if (!reset) throw new Error("Invalid reset token");

      // Hash password-in e ri
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(resetData.newPassword, saltRounds);

      // Përditëso password-in në users
      const { error: updateError } = await supabase
        .from('users')
        .update({ password: hashedPassword })
        .eq('id', reset.user_id);

      if (updateError) throw updateError;

      // Shëno token-in si të përdorur
      await supabase
        .from('password_resets')
        .update({ used: true })
        .eq('id', reset.id);

      setMessage("✅ Password reset successfully! You can now login.");
      setTimeout(() => {
        setStep("login");
        setResetStep("request");
        setResetData({ email: "", newPassword: "", confirmPassword: "", token: "" });
      }, 3000);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep("select");
    setError("");
    setMessage("");
    setFormData({ email: "", password: "", doctorCode: "" });
    setResetStep("request");
    setResetData({ email: "", newPassword: "", confirmPassword: "", token: "" });
  };

  const handleBackToRequest = () => {
    setResetStep("request");
    setError("");
    setMessage("");
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center p-4" style={{
      background: 'linear-gradient(135deg, #f5f9ff 0%, #ffffff 100%)'
    }}>
      <div className="medical-card" style={{ maxWidth: "450px", width: "100%" }}>
        {/* Logo */}
        <div className="text-center mb-4">
          <h1 className="display-4 fw-bold" style={{ color: '#2b6c9e' }}>
            Med<span style={{ color: '#47b5ff' }}>Pal</span>
          </h1>
          <p className="text-muted">Your Digital Healthcare Companion</p>
        </div>

        {/* Mesazhi i suksesit */}
        {message && (
          <div className="alert alert-success alert-dismissible fade show mb-4">
            {message}
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setMessage("")}
            ></button>
          </div>
        )}

        {step === "select" && (
          <>
            <h2 className="text-center mb-4">Choose Login Method</h2>
            <div className="d-grid gap-3">
              <button
                className="btn d-flex align-items-center justify-content-center gap-3 p-3"
                style={{
                  background: 'linear-gradient(135deg, #2b6c9e 0%, #4a8fc1 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '1.1rem',
                  fontWeight: '600'
                }}
                onClick={() => handleRoleSelect("patient")}
                disabled={loading}
              >
                <span>🧑‍⚕️</span> Continue as Patient
              </button>
              <button
                className="btn d-flex align-items-center justify-content-center gap-3 p-3"
                style={{
                  background: 'linear-gradient(135deg, #1e4a6b 0%, #2b6c9e 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '1.1rem',
                  fontWeight: '600'
                }}
                onClick={() => handleRoleSelect("doctor")}
                disabled={loading}
              >
                <span>👨‍⚕️</span> Continue as Doctor
              </button>
              <button
                className="btn d-flex align-items-center justify-content-center gap-3 p-3"
                style={{
                  background: 'linear-gradient(135deg, #0d3e5c 0%, #1e4a6b 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '1.1rem',
                  fontWeight: '600'
                }}
                onClick={() => handleRoleSelect("clinic")}
                disabled={loading}
              >
                <span>🏥</span> Continue as Clinic
              </button>
            </div>
          </>
        )}

        {step === "login" && (
          <>
            <h2 className="text-center mb-4">
              Login as {role === "doctor" ? "Doctor" : role === "clinic" ? "Clinic" : "Patient"}
            </h2>
            
            {error && <div className="alert alert-danger">{error}</div>}
            
            <form onSubmit={handleLogin}>
              {role === "doctor" ? (
                <div className="mb-3">
                  <label className="medical-label">Doctor Code</label>
                  <input
                    name="doctorCode"
                    className="medical-input w-100"
                    placeholder="Enter your doctor code"
                    value={formData.doctorCode}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>
              ) : (
                <div className="mb-3">
                  <label className="medical-label">Email</label>
                  <input
                    name="email"
                    type="email"
                    className="medical-input w-100"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>
              )}
              
              <div className="mb-3">
                <label className="medical-label">Password</label>
                <input
                  name="password"
                  type="password"
                  className="medical-input w-100"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              {role !== "doctor" && (
                <div className="text-end mb-3">
                  <button
                    type="button"
                    className="btn btn-link p-0"
                    onClick={() => setStep("forgot")}
                    disabled={loading}
                    style={{ color: '#2b6c9e' }}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                className="medical-btn-primary w-100 py-3 mb-3"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            <button
              className="btn btn-link w-100"
              onClick={handleBack}
              disabled={loading}
              style={{ color: '#2b6c9e' }}
            >
              ← Back to role selection
            </button>
          </>
        )}

        {step === "forgot" && (
          <>
            {resetStep === "request" && (
              <>
                <h2 className="text-center mb-4">Reset Password</h2>
                {error && <div className="alert alert-danger">{error}</div>}
                <form onSubmit={handleForgotRequest}>
                  <div className="mb-3">
                    <label className="medical-label">Email</label>
                    <input
                      name="email"
                      type="email"
                      className="medical-input w-100"
                      placeholder="Enter your email"
                      value={resetData.email}
                      onChange={handleResetChange}
                      required
                      disabled={loading}
                    />
                  </div>
                  <button
                    type="submit"
                    className="medical-btn-primary w-100 py-3 mb-3"
                    disabled={loading}
                  >
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </form>
              </>
            )}

            {resetStep === "verify" && (
              <>
                <h2 className="text-center mb-4">Enter Reset Token</h2>
                {error && <div className="alert alert-danger">{error}</div>}
                {message && <div className="alert alert-success">{message}</div>}
                <form onSubmit={handleVerifyToken}>
                  <div className="mb-3">
                    <label className="medical-label">Reset Token</label>
                    <input
                      name="token"
                      type="text"
                      className="medical-input w-100"
                      placeholder="Enter token from email"
                      value={resetData.token}
                      onChange={handleResetChange}
                      required
                      disabled={loading}
                    />
                  </div>
                  <button
                    type="submit"
                    className="medical-btn-primary w-100 py-3 mb-3"
                    disabled={loading}
                  >
                    {loading ? 'Verifying...' : 'Verify Token'}
                  </button>
                  <button
                    type="button"
                    className="medical-btn-outline w-100"
                    onClick={handleBackToRequest}
                  >
                    ← Back
                  </button>
                </form>
              </>
            )}

            {resetStep === "reset" && (
              <>
                <h2 className="text-center mb-4">Set New Password</h2>
                {error && <div className="alert alert-danger">{error}</div>}
                <form onSubmit={handleResetPassword}>
                  <div className="mb-3">
                    <label className="medical-label">New Password</label>
                    <input
                      name="newPassword"
                      type="password"
                      className="medical-input w-100"
                      placeholder="Minimum 6 characters"
                      value={resetData.newPassword}
                      onChange={handleResetChange}
                      required
                      minLength="6"
                      disabled={loading}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="medical-label">Confirm Password</label>
                    <input
                      name="confirmPassword"
                      type="password"
                      className="medical-input w-100"
                      placeholder="Confirm your password"
                      value={resetData.confirmPassword}
                      onChange={handleResetChange}
                      required
                      disabled={loading}
                    />
                  </div>
                  <button
                    type="submit"
                    className="medical-btn-primary w-100 py-3 mb-3"
                    disabled={loading}
                  >
                    {loading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </form>
              </>
            )}

            <button
              className="btn btn-link w-100 mt-3"
              onClick={() => {
                setStep("login");
                setResetStep("request");
                setError("");
                setMessage("");
              }}
              disabled={loading}
              style={{ color: '#2b6c9e' }}
            >
              ← Back to login
            </button>
          </>
        )}
      </div>
    </div>
  );
}