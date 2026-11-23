import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/medical-theme.css";

const IconFileText = (p) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <path d="M14 2v6h6M9 13h6M9 17h6"/>
  </svg>
);
const IconSave = (p) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <path d="M17 21v-8H7v8M7 3v5h8"/>
  </svg>
);
const IconCheck = (p) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/>
  </svg>
);
const IconAlert = (p) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
  </svg>
);
const IconSpinner = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    style={{ animation: 'mp-spin 0.9s linear infinite' }}>
    <circle cx="12" cy="12" r="9" stroke={color} strokeOpacity="0.25" strokeWidth="2.5"/>
    <path d="M21 12a9 9 0 0 0-9-9" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

export default function AddVisitReport() {
  const [appointments, setAppointments] = useState([]);
  const [form, setForm] = useState({
    appointmentId: "",
    diagnosis: "",
    recommendation: "",
    temperature: "",
    bloodPressure: "",
    symptoms: "",
  });
  const [doctorInfo, setDoctorInfo] = useState({ id: null, user_id: null });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const navigate = useNavigate();

  useEffect(() => {
    getDoctorInfo();
  }, []);

  const getDoctorInfo = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      console.log("User from localStorage:", user);

      const { data: doctor, error: doctorError } = await supabase
        .from('doctors')
        .select('id, user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (doctorError) throw doctorError;

      if (doctor) {
        console.log("Doctor found:", doctor);
        setDoctorInfo({ id: doctor.id, user_id: doctor.user_id });
        fetchAppointments(doctor.id);
      } else {
        console.log("Doctor not found for user_id:", user.id);
      }
    } catch (err) {
      console.error("Error getting doctor info:", err);
    }
  };

  const fetchAppointments = async (docId) => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          date,
          time,
          patient_id,
          patients!inner (name)
        `)
        .eq('doctor_id', docId)
        .eq('status', 'approved')
        .order('date', { ascending: false });

      if (error) throw error;

      const formattedAppointments = data?.map(apt => ({
        id: apt.id,
        date: apt.date,
        time: apt.time,
        patient_id: apt.patient_id,
        patient: apt.patients || { name: 'Unknown' }
      })) || [];

      setAppointments(formattedAppointments);
    } catch (err) {
      console.error("Error fetching appointments:", err);
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
      if (!doctorInfo.id) {
        throw new Error("Doctor information not found");
      }

      const selectedAppointment = appointments.find(
        a => a.id === form.appointmentId
      );

      if (!selectedAppointment) {
        throw new Error("Please select a valid appointment");
      }

      console.log("Submitting report with:", {
        doctor_id: doctorInfo.id,
        patient_id: selectedAppointment.patient_id,
        appointment_id: form.appointmentId
      });

      const { error } = await supabase
        .from('visit_reports')
        .insert([{
          appointment_id: form.appointmentId,
          doctor_id: doctorInfo.id,
          patient_id: selectedAppointment.patient_id,
          diagnosis: form.diagnosis,
          recommendation: form.recommendation || null,
          temperature: form.temperature || null,
          blood_pressure: form.bloodPressure || null,
          symptoms: form.symptoms || null,
          created_at: new Date().toISOString()
        }]);

      if (error) {
        console.error("Insert error:", error);
        throw error;
      }

      setMessage({ text: "Report saved successfully.", type: "success" });

      setForm({
        appointmentId: "",
        diagnosis: "",
        recommendation: "",
        temperature: "",
        bloodPressure: "",
        symptoms: "",
      });

      setTimeout(() => navigate("/doctor"), 2000);
    } catch (err) {
      console.error("Error saving report:", err);
      setMessage({ text: err.message, type: "danger" });
    } finally {
      setLoading(false);
    }
  };

  if (loading && appointments.length === 0) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div style={{ color: 'var(--mp-primary)' }}>
          <IconSpinner size={24} />
        </div>
        <style>{`@keyframes mp-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const alertClass = message.type === 'success' ? 'medical-alert-success' : 'medical-alert-danger';

  return (
    <div className="container-fluid px-4 py-4" style={{ maxWidth: 860 }}>
      {/* Page header */}
      <div className="mb-4">
        <p className="mp-overline mb-1">Doctor</p>
        <h1 className="mp-h2 mb-1">Create visit report</h1>
        <p className="mp-body" style={{ marginBottom: 0 }}>
          Document patient visits and clinical findings.
        </p>
      </div>

      {message.text && (
        <div className={`medical-alert ${alertClass} mb-4`}>
          <span className="medical-alert__icon">
            {message.type === 'success' ? <IconCheck /> : <IconAlert />}
          </span>
          <div>{message.text}</div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Appointment */}
        <div className="medical-card mb-4" style={{ padding: 26 }}>
          <p className="mp-overline mb-3">Appointment</p>

          <label className="medical-label">
            Select appointment <span className="required">*</span>
          </label>
          <select
            name="appointmentId"
            className="medical-input"
            value={form.appointmentId}
            onChange={handleChange}
            required
          >
            <option value="">Choose an appointment</option>
            {appointments.map((apt) => (
              <option key={apt.id} value={apt.id}>
                {apt.patient?.name} — {apt.date} at {apt.time}
              </option>
            ))}
          </select>
        </div>

        {/* Clinical findings */}
        <div className="medical-card mb-4" style={{ padding: 26 }}>
          <p className="mp-overline mb-3">Clinical findings</p>

          <div className="mb-3">
            <label className="medical-label">
              Diagnosis <span className="required">*</span>
            </label>
            <textarea
              name="diagnosis"
              className="medical-input"
              rows="4"
              value={form.diagnosis}
              onChange={handleChange}
              placeholder="Enter diagnosis details…"
              required
            />
          </div>

          <div className="mb-3">
            <label className="medical-label">Symptoms</label>
            <input
              type="text"
              name="symptoms"
              className="medical-input"
              value={form.symptoms}
              onChange={handleChange}
              placeholder="e.g. fever, cough, headache"
            />
          </div>

          <div className="row g-3">
            <div className="col-md-6">
              <label className="medical-label">Temperature (°C)</label>
              <input
                type="number"
                step="0.1"
                name="temperature"
                className="medical-input"
                value={form.temperature}
                onChange={handleChange}
                placeholder="36.6"
              />
            </div>
            <div className="col-md-6">
              <label className="medical-label">Blood pressure</label>
              <input
                type="text"
                name="bloodPressure"
                className="medical-input"
                value={form.bloodPressure}
                onChange={handleChange}
                placeholder="120/80"
              />
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="medical-card mb-4" style={{ padding: 26 }}>
          <p className="mp-overline mb-3">Recommendations</p>

          <textarea
            name="recommendation"
            className="medical-input"
            rows="3"
            value={form.recommendation}
            onChange={handleChange}
            placeholder="Treatment plan, medications, follow-up…"
          />
        </div>

        <button
          type="submit"
          className="medical-btn-primary medical-btn--lg w-100"
          disabled={loading}
        >
          {loading ? (
            <>
              <IconSpinner size={16} color="#fff" />
              Saving report…
            </>
          ) : (
            <>
              <IconSave />
              Save report
            </>
          )}
        </button>
      </form>

      <style>{`@keyframes mp-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}