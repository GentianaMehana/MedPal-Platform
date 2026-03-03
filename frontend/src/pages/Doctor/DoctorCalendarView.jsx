import { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { supabase } from "../../lib/supabase";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/medical-theme.css";

export default function DoctorCalendarView() {
  const [date, setDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [doctorId, setDoctorId] = useState(null);

  useEffect(() => {
    getDoctorId();
  }, []);

  const getDoctorId = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      
      const { data: doctor, error: doctorError } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (doctorError) throw doctorError;
      
      if (doctor) {
        setDoctorId(doctor.id);
        fetchAppointments(doctor.id);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error("Error getting doctor id:", err);
      setLoading(false);
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
          status,
          patients!inner (
            name
          )
        `)
        .eq('doctor_id', docId)
        .neq('status', 'canceled');

      if (error) throw error;
      
      const formattedAppointments = data?.map(apt => ({
        id: apt.id,
        date: apt.date,
        time: apt.time,
        status: apt.status,
        patient: apt.patients || { name: 'Unknown' }
      })) || [];
      
      setAppointments(formattedAppointments);
    } catch (err) {
      console.error("Error fetching appointments:", err);
    } finally {
      setLoading(false);
    }
  };

  const selectedDateStr = date.toISOString().split("T")[0];
  const filteredAppointments = appointments.filter(apt => apt.date === selectedDateStr);

  const tileContent = ({ date, view }) => {
    if (view === "month") {
      const formatted = date.toISOString().split("T")[0];
      const hasAppointment = appointments.some(apt => apt.date === formatted);
      if (hasAppointment) {
        return (
          <div
            style={{
              backgroundColor: "var(--medical-primary)",
              borderRadius: "50%",
              width: "6px",
              height: "6px",
              margin: "auto",
              marginTop: "2px",
            }}
          />
        );
      }
    }
    return null;
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'approved': return 'badge-approved';
      case 'pending': return 'badge-pending';
      case 'canceled': return 'badge-canceled';
      default: return '';
    }
  };

  const formatTime = (time) => {
    return time.substring(0, 5);
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="medical-spinner mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-4 py-4">
      <div className="medical-header mb-4">
        <h2 className="mb-2">📅 My Calendar</h2>
        <p className="mb-0">View your appointments by date</p>
      </div>

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
                        <strong>{formatTime(apt.time)}</strong>
                        <p className="mb-0 text-muted small">{apt.patient?.name}</p>
                      </div>
                      <span className={`medical-badge ${getStatusBadge(apt.status)}`}>
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