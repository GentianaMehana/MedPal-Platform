import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/medical-theme.css";

export default function DoctorWorkingHours() {
  const [workingHours, setWorkingHours] = useState({
    monday: { start: "09:00", end: "17:00" },
    tuesday: { start: "09:00", end: "17:00" },
    wednesday: { start: "09:00", end: "17:00" },
    thursday: { start: "09:00", end: "17:00" },
    friday: { start: "09:00", end: "17:00" },
    saturday: { start: "", end: "" },
    sunday: { start: "", end: "" },
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [doctorId, setDoctorId] = useState(null);

  useEffect(() => {
    getDoctorId();
  }, []);

  const getDoctorId = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      
      const { data: doctor, error: doctorError } = await supabase
        .from('doctors')
        .select('id, working_hours')
        .eq('user_id', user.id)
        .maybeSingle();

      if (doctorError) throw doctorError;
      
      if (doctor) {
        setDoctorId(doctor.id);
        if (doctor.working_hours) {
          setWorkingHours(doctor.working_hours);
        }
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const handleChange = (day, field, value) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const { error } = await supabase
        .from('doctors')
        .update({ working_hours: workingHours })
        .eq('id', doctorId);

      if (error) throw error;

      setMessage({ text: "Working hours saved successfully!", type: "success" });
    } catch (err) {
      setMessage({ text: err.message, type: "danger" });
    } finally {
      setLoading(false);
    }
  };

  const dayLabels = {
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday",
  };

  return (
    <div className="container-fluid px-4 py-4">
      <div className="medical-header mb-4">
        <h2 className="mb-2">🕒 Working Hours</h2>
        <p className="mb-0">Set your availability for patient appointments</p>
      </div>

      <div className="row">
        <div className="col-lg-8 mx-auto">
          {message.text && (
            <div className={`alert alert-${message.type} alert-dismissible fade show mb-4`} style={{ borderRadius: 'var(--border-radius-md)' }}>
              {message.text}
              <button type="button" className="btn-close" onClick={() => setMessage({ text: "", type: "" })}></button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="medical-card">
            {Object.entries(workingHours).map(([day, hours]) => (
              <div key={day} className="mb-4">
                <label className="medical-label">{dayLabels[day]}</label>
                <div className="row g-2">
                  <div className="col-5">
                    <input
                      type="time"
                      className="medical-input w-100"
                      value={hours.start}
                      onChange={(e) => handleChange(day, "start", e.target.value)}
                    />
                  </div>
                  <div className="col-2 text-center pt-2">to</div>
                  <div className="col-5">
                    <input
                      type="time"
                      className="medical-input w-100"
                      value={hours.end}
                      onChange={(e) => handleChange(day, "end", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="submit"
              className="medical-btn-primary w-100 py-3 mt-3"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Saving...
                </>
              ) : (
                '💾 Save Working Hours'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}