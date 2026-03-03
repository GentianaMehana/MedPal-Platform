// frontend/src/pages/Clinic/ClinicProfileUpdate.jsx
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import "bootstrap/dist/css/bootstrap.min.css";

export default function ClinicProfileUpdate() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    currentPassword: "",
    newPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      setForm((prev) => ({ ...prev, name: user.name, email: user.email }));
    }
    fetchClinicDetails();
  }, []);

  const fetchClinicDetails = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      
      const { data, error } = await supabase
        .from('clinics')
        .select('phone, address')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setForm(prev => ({
          ...prev,
          phone: data.phone || "",
          address: data.address || ""
        }));
      }
    } catch (err) {
      console.error("Error fetching clinic details:", err);
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
      const updates = {};

      // Update name in users table
      if (form.name !== user.name) {
        const { error: nameError } = await supabase
          .from('users')
          .update({ name: form.name })
          .eq('id', user.id);

        if (nameError) throw nameError;
        updates.name = form.name;
      }

      // Update email in auth
      if (form.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: form.email,
        });
        if (emailError) throw emailError;
        updates.email = form.email;
      }

      // Update clinic details
      const { error: clinicError } = await supabase
        .from('clinics')
        .update({
          phone: form.phone || null,
          address: form.address || null,
        })
        .eq('user_id', user.id);

      if (clinicError) throw clinicError;

      // Update password if provided
      if (form.newPassword) {
        if (!form.currentPassword) {
          throw new Error("Current password is required");
        }
        
        const { error: passwordError } = await supabase.auth.updateUser({
          password: form.newPassword,
        });
        if (passwordError) throw passwordError;
      }

      // Update localStorage
      const updatedUser = { ...user, ...updates };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      setMessage({ text: "✅ Profile updated successfully!", type: "success" });
      
      setForm(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
      }));

    } catch (err) {
      setMessage({ text: err.message, type: "danger" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid px-4" style={{ maxWidth: "600px" }}>
      <h2 className="medical-label mb-4">⚙️ Update Clinic Profile</h2>

      {message.text && (
        <div className={`alert alert-${message.type} alert-dismissible fade show`}>
          {message.text}
          <button type="button" className="btn-close" onClick={() => setMessage({ text: "", type: "" })}></button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="medical-card">
        <div className="mb-3">
          <label className="medical-label">Clinic Name</label>
          <input
            name="name"
            type="text"
            className="medical-input w-100"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label className="medical-label">Email</label>
          <input
            name="email"
            type="email"
            className="medical-input w-100"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label className="medical-label">Phone</label>
          <input
            name="phone"
            type="text"
            className="medical-input w-100"
            value={form.phone}
            onChange={handleChange}
            placeholder="+38344123456"
          />
        </div>

        <div className="mb-3">
          <label className="medical-label">Address</label>
          <input
            name="address"
            type="text"
            className="medical-input w-100"
            value={form.address}
            onChange={handleChange}
            placeholder="Clinic address"
          />
        </div>

        <hr className="my-4" style={{ borderColor: '#e3f2fd' }} />
        <h5 className="medical-label mb-3">Change Password</h5>

        <div className="mb-3">
          <label className="medical-label">Current Password</label>
          <input
            name="currentPassword"
            type="password"
            className="medical-input w-100"
            value={form.currentPassword}
            onChange={handleChange}
          />
        </div>

        <div className="mb-4">
          <label className="medical-label">New Password</label>
          <input
            name="newPassword"
            type="password"
            className="medical-input w-100"
            value={form.newPassword}
            onChange={handleChange}
            minLength={6}
          />
          <small className="text-muted">Minimum 6 characters. Leave empty to keep current password.</small>
        </div>

        <button
          type="submit"
          className="medical-btn-primary w-100 py-3"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2"></span>
              Updating...
            </>
          ) : (
            '💾 Update Profile'
          )}
        </button>
      </form>
    </div>
  );
}