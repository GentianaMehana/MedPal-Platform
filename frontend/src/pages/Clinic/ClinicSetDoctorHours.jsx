// frontend/src/pages/Clinic/ClinicSetDoctorHours.jsx
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import "bootstrap/dist/css/bootstrap.min.css";

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
      
      // Get clinic_id
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
          users!user_id (
            name
          )
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
        // Reset to default
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

      setMessage({ text: "✅ Working hours saved!", type: "success" });
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

  return (
    <div className="container-fluid px-4" style={{ maxWidth: "700px" }}>
      <h2 className="medical-label mb-4">🕐 Set Doctor Working Hours</h2>

      {message.text && (
        <div className={`alert alert-${message.type} alert-dismissible fade show`}>
          {message.text}
          <button type="button" className="btn-close" onClick={() => setMessage({ text: "", type: "" })}></button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="medical-card">
        <div className="mb-4">
          <label className="medical-label">Select Doctor</label>
          <select
            value={selectedDoctor}
            onChange={handleDoctorChange}
            className="medical-input w-100"
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

            <button type="submit" className="medical-btn-primary w-100 py-3 mt-3">
              💾 Save Working Hours
            </button>
          </>
        )}
      </form>
    </div>
  );
}