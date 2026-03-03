import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import "bootstrap/dist/css/bootstrap.min.css";

export default function PatientProfile() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    dateOfBirth: "",
    gender: "",
    phone: "",
    address: "",
    bloodType: "",
    medicalHistory: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('name, email')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;

      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      setForm({
        name: userData?.name || "",
        email: userData?.email || "",
        dateOfBirth: patientData?.date_of_birth || "",
        gender: patientData?.gender || "",
        phone: patientData?.phone || "",
        address: patientData?.address || "",
        bloodType: patientData?.blood_type || "",
        medicalHistory: patientData?.medical_history || "",
      });
    } catch (err) {
      console.error("Error fetching profile:", err);
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

      const { error: userError } = await supabase
        .from('users')
        .update({ name: form.name })
        .eq('id', user.id);

      if (userError) throw userError;

      const { error: patientError } = await supabase
        .from('patients')
        .upsert({
          user_id: user.id,
          date_of_birth: form.dateOfBirth || null,
          gender: form.gender || null,
          phone: form.phone || null,
          address: form.address || null,
          blood_type: form.bloodType || null,
          medical_history: form.medicalHistory || null,
        }, { onConflict: 'user_id' });

      if (patientError) throw patientError;

      const updatedUser = { ...user, name: form.name };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      setMessage({ text: "✅ Profile updated successfully!", type: "success" });
    } catch (err) {
      setMessage({ text: err.message, type: "danger" });
    } finally {
      setLoading(false);
    }
  };

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  return (
    <div className="container-fluid px-4" style={{ maxWidth: "800px" }}>
      <h2 className="medical-label mb-4">👤 My Profile</h2>

      {message.text && (
        <div className={`alert alert-${message.type} alert-dismissible fade show`}>
          {message.text}
          <button type="button" className="btn-close" onClick={() => setMessage({ text: "", type: "" })}></button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="medical-card">
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="medical-label">Full Name</label>
            <input
              type="text"
              name="name"
              className="medical-input w-100"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-md-6 mb-3">
            <label className="medical-label">Email</label>
            <input
              type="email"
              className="medical-input w-100"
              value={form.email}
              disabled
              readOnly
            />
          </div>

          <div className="col-md-6 mb-3">
            <label className="medical-label">Date of Birth</label>
            <input
              type="date"
              name="dateOfBirth"
              className="medical-input w-100"
              value={form.dateOfBirth}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-6 mb-3">
            <label className="medical-label">Gender</label>
            <select
              name="gender"
              className="medical-input w-100"
              value={form.gender}
              onChange={handleChange}
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="col-md-6 mb-3">
            <label className="medical-label">Phone</label>
            <input
              type="tel"
              name="phone"
              className="medical-input w-100"
              value={form.phone}
              onChange={handleChange}
              placeholder="+1234567890"
            />
          </div>

          <div className="col-md-6 mb-3">
            <label className="medical-label">Blood Type</label>
            <select
              name="bloodType"
              className="medical-input w-100"
              value={form.bloodType}
              onChange={handleChange}
            >
              <option value="">Select blood type</option>
              {bloodTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="col-12 mb-3">
            <label className="medical-label">Address</label>
            <textarea
              name="address"
              className="medical-input w-100"
              rows="2"
              value={form.address}
              onChange={handleChange}
              placeholder="Your address"
            />
          </div>

          <div className="col-12 mb-4">
            <label className="medical-label">Medical History</label>
            <textarea
              name="medicalHistory"
              className="medical-input w-100"
              rows="3"
              value={form.medicalHistory}
              onChange={handleChange}
              placeholder="Any allergies, chronic conditions, or past surgeries..."
            />
          </div>
        </div>

        <button
          type="submit"
          className="medical-btn-primary w-100 py-3"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2"></span>
              Saving...
            </>
          ) : (
            '💾 Save Changes'
          )}
        </button>
      </form>
    </div>
  );
}