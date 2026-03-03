import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/medical-theme.css";

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
      
      // Get doctor's id from doctors table using user_id
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
          patients!inner (
            name
          )
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
        doctor_id: doctorInfo.id,  // Përdor doctors.id
        patient_id: selectedAppointment.patient_id,
        appointment_id: form.appointmentId
      });

      const { error } = await supabase
        .from('visit_reports')
        .insert([{
          appointment_id: form.appointmentId,
          doctor_id: doctorInfo.id,  // Përdor doctors.id, jo user.id
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

      setMessage({ text: "Report saved successfully!", type: "success" });
      
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
      <div className="text-center py-5">
        <div className="medical-spinner mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-4 py-4">
      <div className="medical-header mb-4">
        <h2 className="mb-2">🧾 Create Visit Report</h2>
        <p className="mb-0">Document patient visits and diagnoses</p>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type} alert-dismissible fade show mb-4`} style={{ borderRadius: 'var(--border-radius-md)' }}>
          {message.text}
          <button type="button" className="btn-close" onClick={() => setMessage({ text: "", type: "" })}></button>
        </div>
      )}

      <div className="row">
        <div className="col-lg-8 mx-auto">
          <div className="medical-card">
            <form onSubmit={handleSubmit}>
              {/* Appointment Selection */}
              <div className="mb-4">
                <label className="medical-label">Select Appointment</label>
                <select
                  name="appointmentId"
                  className="medical-input w-100"
                  value={form.appointmentId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Choose an appointment</option>
                  {appointments.map((apt) => (
                    <option key={apt.id} value={apt.id}>
                      {apt.patient?.name} - {apt.date} at {apt.time}
                    </option>
                  ))}
                </select>
              </div>

              {/* Diagnosis */}
              <div className="mb-4">
                <label className="medical-label">Diagnosis</label>
                <textarea
                  name="diagnosis"
                  className="medical-input w-100"
                  rows="4"
                  value={form.diagnosis}
                  onChange={handleChange}
                  placeholder="Enter diagnosis details..."
                  required
                />
              </div>

              {/* Symptoms */}
              <div className="mb-4">
                <label className="medical-label">Symptoms</label>
                <input
                  type="text"
                  name="symptoms"
                  className="medical-input w-100"
                  value={form.symptoms}
                  onChange={handleChange}
                  placeholder="e.g., fever, cough, headache"
                />
              </div>

              {/* Vitals Row */}
              <div className="row mb-4">
                <div className="col-md-6">
                  <label className="medical-label">Temperature (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="temperature"
                    className="medical-input w-100"
                    value={form.temperature}
                    onChange={handleChange}
                    placeholder="36.6"
                  />
                </div>
                <div className="col-md-6">
                  <label className="medical-label">Blood Pressure</label>
                  <input
                    type="text"
                    name="bloodPressure"
                    className="medical-input w-100"
                    value={form.bloodPressure}
                    onChange={handleChange}
                    placeholder="120/80"
                  />
                </div>
              </div>

              {/* Recommendations */}
              <div className="mb-4">
                <label className="medical-label">Recommendations</label>
                <textarea
                  name="recommendation"
                  className="medical-input w-100"
                  rows="3"
                  value={form.recommendation}
                  onChange={handleChange}
                  placeholder="Treatment plan, medications, follow-up..."
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="medical-btn-primary w-100 py-3"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Saving Report...
                  </>
                ) : (
                  '💾 Save Report'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}