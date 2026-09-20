import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/medical-theme.css";

const IconClock = (p) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>
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

      setMessage({ text: "Working hours saved successfully.", type: "success" });
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

  const alertClass = message.type === 'success' ? 'medical-alert-success' : 'medical-alert-danger';

  return (
    <div className="container-fluid px-4 py-4" style={{ maxWidth: 720 }}>
      {/* Page header */}
      <div className="mb-4">
        <p className="mp-overline mb-1">Doctor</p>
        <h1 className="mp-h2 mb-1">Working hours</h1>
        <p className="mp-body" style={{ marginBottom: 0 }}>
          Set your weekly availability for patient appointments.
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
        <div className="medical-card mb-4" style={{ padding: 26 }}>
          <div className="d-flex align-items-center gap-2 mb-3">
            <span style={{ color: 'var(--mp-primary)', display: 'inline-flex' }}>
              <IconClock />
            </span>
            <p className="mp-overline" style={{ marginBottom: 0 }}>Weekly availability</p>
          </div>

          <ul className="list-unstyled mb-0">
            {Object.entries(workingHours).map(([day, hours], i) => (
              <li
                key={day}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 0',
                  borderTop: i === 0 ? 'none' : '1px solid var(--mp-border)',
                }}
              >
                <div
                  style={{
                    width: 110,
                    fontSize: 13.5,
                    fontWeight: 500,
                    color: 'var(--mp-text)',
                    letterSpacing: '-0.005em',
                    flexShrink: 0,
                  }}
                >
                  {dayLabels[day]}
                </div>

                <input
                  type="time"
                  className="medical-input"
                  value={hours.start}
                  onChange={(e) => handleChange(day, "start", e.target.value)}
                  style={{ flex: 1 }}
                />

                <span
                  style={{
                    color: 'var(--mp-text-muted)',
                    fontSize: 13,
                    flexShrink: 0,
                  }}
                >
                  to
                </span>

                <input
                  type="time"
                  className="medical-input"
                  value={hours.end}
                  onChange={(e) => handleChange(day, "end", e.target.value)}
                  style={{ flex: 1 }}
                />
              </li>
            ))}
          </ul>
        </div>

        <button
          type="submit"
          className="medical-btn-primary medical-btn--lg w-100"
          disabled={loading}
        >
          {loading ? (
            <>
              <IconSpinner size={16} color="#fff" />
              Saving…
            </>
          ) : (
            <>
              <IconSave />
              Save working hours
            </>
          )}
        </button>
      </form>

      <style>{`@keyframes mp-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}