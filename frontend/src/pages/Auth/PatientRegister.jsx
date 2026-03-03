import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";

export default function PatientRegister() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    const userId = searchParams.get('userId');
    if (userId) {
      // Merr të dhënat e përdoruesit
      supabase.auth.admin.getUserById(userId).then(({ data, error }) => {
        if (data?.user) setUser(data.user);
      });
    }
  }, [searchParams]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!user) throw new Error("User not found");
      if (formData.password.length < 6) throw new Error("Password too short");
      if (formData.password !== formData.confirmPassword) throw new Error("Passwords don't match");

      // Update password
      await supabase.auth.updateUser({ password: formData.password });

      // Add to users table
      await supabase.from('users').insert([{
        id: user.id,
        email: user.email,
        name: user.user_metadata.name,
        role: 'patient',
        is_verified: true,
        phone: formData.phone,
        blood_type: formData.bloodType,
        gender: formData.gender,
        date_of_birth: formData.dateOfBirth,
        address: formData.address,
        clinic_id: user.user_metadata.clinic_id,
        created_at: new Date().toISOString()
      }]);

      // Add to patients table
      await supabase.from('patients').insert([{
        user_id: user.id,
        date_of_birth: formData.dateOfBirth,
        gender: formData.gender,
        blood_type: formData.bloodType,
        phone: formData.phone,
        address: formData.address
      }]);

      navigate('/patient/dashboard');

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5" style={{ maxWidth: "500px" }}>
      <h2 className="mb-4">Complete Patient Registration</h2>
      <div className="alert alert-info">
        <p>Welcome {user.user_metadata.name}</p>
        <p>Email: {user.email}</p>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        <input
          name="phone"
          placeholder="Phone"
          className="form-control mb-2"
          value={formData.phone}
          onChange={handleChange}
          required
        />
        <select
          name="gender"
          className="form-control mb-2"
          value={formData.gender}
          onChange={handleChange}
          required
        >
          <option value="">Select Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
        <select
          name="bloodType"
          className="form-control mb-2"
          value={formData.bloodType}
          onChange={handleChange}
        >
          <option value="">Blood Type</option>
          <option value="A+">A+</option>
          <option value="A-">A-</option>
        </select>
        <input
          type="date"
          name="dateOfBirth"
          className="form-control mb-2"
          value={formData.dateOfBirth}
          onChange={handleChange}
          required
        />
        <input
          name="address"
          placeholder="Address"
          className="form-control mb-2"
          value={formData.address}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          className="form-control mb-2"
          value={formData.password}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          className="form-control mb-2"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
        />
        <button type="submit" className="btn btn-primary w-100" disabled={loading}>
          {loading ? "Processing..." : "Complete Registration"}
        </button>
      </form>
    </div>
  );
}