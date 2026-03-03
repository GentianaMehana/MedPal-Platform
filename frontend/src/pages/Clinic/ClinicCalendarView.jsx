import { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { supabase } from "../../lib/supabase";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/medical-theme.css";

export default function ClinicCalendarView() {
  const [date, setDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const clinicUser = JSON.parse(localStorage.getItem("user"));
      
      const { data: clinicData, error: clinicError } = await supabase
        .from('clinics')
        .select('id')
        .eq('user_id', clinicUser.id)
        .maybeSingle();

      if (clinicError) throw clinicError;
      if (!clinicData) {
        setLoading(false);
        return;
      }

      const { data: doctors, error: doctorsError } = await supabase
        .from('doctors')
        .select('user_id')
        .eq('clinic_id', clinicData.id);

      if (doctorsError) throw doctorsError;

      const doctorIds = doctors?.map(d => d.user_id) || [];

      if (doctorIds.length === 0) {
        setAppointments([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          date,
          time,
          status,
          doctors (
            name
          ),
          patients (
            name
          )
        `)
        .in('doctor_id', doctorIds);

      if (error) throw error;
      
      const formattedAppointments = data?.map(apt => ({
        id: apt.id,
        date: apt.date,
        time: apt.time,
        status: apt.status,
        doctor: apt.doctors || { name: 'Unknown' },
        patient: apt.patients || { name: 'Unknown' }
      })) || [];
      
      setAppointments(formattedAppointments);
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
              backgroundColor: "var(--medical-primary)",
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

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending': return 'badge-pending';
      case 'approved': return 'badge-approved';
      case 'completed': return 'badge-approved';
      case 'canceled': return 'badge-canceled';
      default: return '';
    }
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
        <h2 className="mb-2">📅 Clinic Calendar</h2>
        <p className="mb-0">View all appointments by date</p>
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
                        <strong>{apt.time.substring(0, 5)}</strong>
                        <div className="small">Dr. {apt.doctor?.name}</div>
                        <div className="small text-muted">{apt.patient?.name}</div>
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