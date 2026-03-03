// frontend/src/pages/Common/CalendarView.jsx
import { useState, useEffect } from "react";
import Calendar from "react-calendar";
import 'react-calendar/dist/Calendar.css';
import { supabase } from "../../lib/supabase";
import "bootstrap/dist/css/bootstrap.min.css";

export default function CalendarView() {
  const [date, setDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      
      if (!user) return;

      let query = supabase
        .from('appointments')
        .select(`
          *,
          doctor:users!doctor_id(name),
          service:services(name)
        `);

      if (user.role === 'patient') {
        query = query.eq('patient_id', user.id);
      } else if (user.role === 'doctor') {
        query = query.eq('doctor_id', user.id);
      } else if (user.role === 'clinic') {
        const { data: doctors } = await supabase
          .from('users')
          .select('id')
          .eq('role', 'doctor')
          .eq('clinic_id', user.id);
        
        const doctorIds = doctors?.map(d => d.id) || [];
        query = query.in('doctor_id', doctorIds);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAppointments(data || []);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const selectedDateStr = date.toISOString().split("T")[0];
  const filteredAppointments = appointments.filter(app => app.date === selectedDateStr);

  const tileContent = ({ date, view }) => {
    if (view === "month") {
      const formatted = date.toISOString().split("T")[0];
      const hasAppointment = appointments.some(a => a.date === formatted);
      if (hasAppointment) {
        return (
          <div
            style={{
              backgroundColor: "#2b6c9e",
              borderRadius: "50%",
              width: "8px",
              height: "8px",
              margin: "auto",
              marginTop: "2px",
            }}
          />
        );
      }
    }
    return null;
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="medical-spinner mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-4" style={{ maxWidth: "900px" }}>
      <h2 className="medical-label mb-4">📅 Appointment Calendar</h2>

      <div className="row">
        <div className="col-md-7">
          <div className="medical-card">
            <Calendar
              value={date}
              onChange={setDate}
              tileContent={tileContent}
              className="w-100 border-0"
            />
          </div>
        </div>

        <div className="col-md-5">
          <div className="medical-card h-100">
            <h5 className="medical-label mb-3">
              Appointments for {date.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h5>
            
            {filteredAppointments.length === 0 ? (
              <p className="text-muted text-center py-4">No appointments scheduled</p>
            ) : (
              <div className="list-group list-group-flush">
                {filteredAppointments.map((apt) => (
                  <div key={apt.id} className="list-group-item px-0">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{apt.time}</strong>
                        <div className="small">{apt.doctor?.name}</div>
                        <div className="small text-muted">{apt.service?.name}</div>
                      </div>
                      <span className={`medical-badge badge-${apt.status}`}>
                        {apt.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}