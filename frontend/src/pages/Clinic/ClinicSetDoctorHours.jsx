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

export default function ClinicSetDoctorHours() {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [workingHours, setWorkingHours] = useState({
    monday: { start: "09:00", end: "17:00" },
    tuesday: { start: "09:00", end: "17:00" },
    wednesday: { start: "09:00", end: "17:00" },
    thursday: { start: "09:00", end: "17:00" },
    friday: { start: "09:00", end: "17:00" },
    saturday: { start: "", end: "" },
    sunday: { start: "", end: "" },
  });
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const clinicUser = JSON.parse(localStorage.getItem("user"));

      const { data: clinicData } = await supabase
        .from('clinics')
        .select('id')
        .eq('user_id', clinicUser.id)
        .maybeSingle();

      if (!clinicData) return;

      const { data, error } = await supabase
        .from('doctors')
        .select(`
          id,
          user_id,
          users!user_id (name)
        `)
        .eq('clinic_id', clinicData.id);

      if (error) throw error;

      const formattedDoctors = data.map(d => ({
        id: d.user_id,
        name: d.users?.name || 'Unknown'
      }));

      setDoctors(formattedDoctors || []);
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const fetchDoctorHours = async (doctorUserId) => {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('working_hours')
        .eq('user_id', doctorUserId)
        .maybeSingle();

      if (error) throw error;

      if (data?.working_hours) {
        setWorkingHours(data.working_hours);
      } else {
        setWorkingHours({
          monday: { start: "09:00", end: "17:00" },
          tuesday: { start: "09:00", end: "17:00" },
          wednesday: { start: "09:00", end: "17:00" },
          thursday: { start: "09:00", end: "17:00" },
          friday: { start: "09:00", end: "17:00" },
          saturday: { start: "", end: "" },
          sunday: { start: "", end: "" },
        });
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const handleDoctorChange = (e) => {
    const doctorUserId = e.target.value;
    setSelectedDoctor(doctorUserId);
    if (doctorUserId) {
      fetchDoctorHours(doctorUserId);
    }
  };

  const handleChange = (day, field, value) => {
    setWorkingHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    try {
      const { error } = await supabase
        .from('doctors')
        .update({ working_hours: workingHours })
        .eq('user_id', selectedDoctor);

      if (error) throw error;

      setMessage({ text: "Working hours saved.", type: "success" });
    } catch (err) {
      setMessage({ text: err.message, type: "danger" });
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

  const alertClass =
    message.type === 'success' ? 'medical-alert-success' : 'medical-alert-danger';

  return (
    <div className="container-fluid px-4 py-4" style={{ maxWidth: 720 }}>
      {/* Page header */}
      <div className="mb-4">
        <p className="mp-overline mb-1">Clinic</p>
        <h1 className="mp-h2 mb-1">Set doctor working hours</h1>
        <p className="mp-body" style={{ marginBottom: 0 }}>
          Define weekly availability for each doctor.
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
          <p className="mp-overline mb-3">Doctor</p>
          <select
            value={selectedDoctor}
            onChange={handleDoctorChange}
            className="medical-input"
            required
          >
            <option value="">Choose a doctor</option>
            {doctors.map((doc) => (
              <option key={doc.id} value={doc.id}>{doc.name}</option>
            ))}
          </select>
        </div>

        {selectedDoctor && (
          <>
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
            >
              <IconSave />
              Save working hours
            </button>
          </>
        )}
      </form>
    </div>
  );
}