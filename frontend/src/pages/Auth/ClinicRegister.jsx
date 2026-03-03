import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import "bootstrap/dist/css/bootstrap.min.css";

export default function ClinicRegister() {
  const [formData, setFormData] = useState({
    clinic_name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (formData.password.length < 6) throw new Error("Password too short");
      if (formData.password !== formData.confirmPassword) throw new Error("Passwords don't match");

      const userId = uuidv4();
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(formData.password, saltRounds);

      // 1. Insert into users table
      const { error: userError } = await supabase
        .from('users')
        .insert([{
          id: userId,
          email: formData.email,
          name: formData.clinic_name,
          role: 'clinic',
          is_verified: true,
          phone: formData.phone || null,
          address: formData.address || null,
          password: hashedPassword,
          created_at: new Date().toISOString()
        }]);

      if (userError) throw userError;

      // 2. Insert into clinics table
      const clinicCode = `CLINIC-${userId.slice(0, 8)}`;
      
      const { error: clinicError } = await supabase
        .from('clinics')
        .insert([{
          user_id: userId,
          name: formData.clinic_name,
          clinic_code: clinicCode,
          email: formData.email,
          phone: formData.phone || null,
          address: formData.address || null,
          is_verified: true,
          created_at: new Date().toISOString()
        }]);

      if (clinicError) throw clinicError;

      setMessage("✅ Clinic registered successfully! You can now login.");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center p-4" style={{
      background: 'linear-gradient(135deg, #f5f9ff 0%, #ffffff 100%)'
    }}>
      <div className="medical-card" style={{ maxWidth: "500px", width: "100%" }}>
        <div className="text-center mb-4">
          <h1 className="display-4 fw-bold" style={{ color: '#2b6c9e' }}>
            Med<span style={{ color: '#47b5ff' }}>Pal</span>
          </h1>
          <p className="text-muted">Register your clinic</p>
        </div>

        {message && (
          <div className="alert alert-success alert-dismissible fade show mb-4">
            {message}
            <button type="button" className="btn-close" onClick={() => setMessage("")}></button>
          </div>
        )}

        {error && (
          <div className="alert alert-danger mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="medical-label">Clinic Name *</label>
            <input
              name="clinic_name"
              type="text"
              className="medical-input w-100"
              value={formData.clinic_name}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="mb-3">
            <label className="medical-label">Email *</label>
            <input
              name="email"
              type="email"
              className="medical-input w-100"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="mb-3">
            <label className="medical-label">Phone</label>
            <input
              name="phone"
              type="tel"
              className="medical-input w-100"
              value={formData.phone}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="mb-3">
            <label className="medical-label">Address</label>
            <input
              name="address"
              type="text"
              className="medical-input w-100"
              value={formData.address}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="mb-3">
            <label className="medical-label">Password *</label>
            <input
              name="password"
              type="password"
              className="medical-input w-100"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
              disabled={loading}
            />
          </div>

          <div className="mb-4">
            <label className="medical-label">Confirm Password *</label>
            <input
              name="confirmPassword"
              type="password"
              className="medical-input w-100"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="medical-btn-primary w-100 py-3 mb-3"
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register Clinic'}
          </button>

          <div className="text-center">
            <span className="text-muted">Already have an account? </span>
            <button
              type="button"
              className="btn btn-link p-0"
              onClick={() => navigate("/login")}
              style={{ color: '#2b6c9e' }}
            >
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}