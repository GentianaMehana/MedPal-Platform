import { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { supabase } from "../../lib/supabase";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/medical-theme.css";

const IconCalendar = (p) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2"/>
    <path d="M3 10h18M8 3v4M16 3v4"/>
  </svg>
);
const IconSpinner = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    style={{ animation: 'mp-spin 0.9s linear infinite' }}>
    <circle cx="12" cy="12" r="9" stroke={color} strokeOpacity="0.2" strokeWidth="2.5"/>
    <path d="M21 12a9 9 0 0 0-9-9" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

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
              backgroundColor: "var(--mp-primary)",
              borderRadius: "50%",
              width: "6px",
              height: "6px",
              margin: "auto",
              marginTop: "3px",
            }}
          />
        );
      }
    }
    return null;
  };

  const statusStyles = {
    pending:   { bg: 'var(--mp-warning-bg)',  color: 'var(--mp-warning)',  border: 'var(--mp-warning-bd)' },
    approved:  { bg: 'var(--mp-success-bg)',  color: 'var(--mp-success)',  border: 'var(--mp-success-bd)' },
    completed: { bg: 'var(--mp-success-bg)',  color: 'var(--mp-success)',  border: 'var(--mp-success-bd)' },
    canceled:  { bg: 'var(--mp-danger-bg)',   color: 'var(--mp-danger)',   border: 'var(--mp-danger-bd)' },
  };

  const StatusPill = ({ status }) => {
    const s = statusStyles[status] || statusStyles.pending;
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '3px 10px',
          fontSize: 12,
          fontWeight: 500,
          textTransform: 'capitalize',
          letterSpacing: '-0.005em',
          borderRadius: 999,
          background: s.bg,
          color: s.color,
          border: `1px solid ${s.border}`,
        }}
      >
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div style={{ color: 'var(--mp-primary)' }}>
          <IconSpinner />
        </div>
        <style>{`@keyframes mp-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="container-fluid px-4 py-4">
      {/* Page header */}
      <div className="mb-4">
        <p className="mp-overline mb-1">Clinic</p>
        <h1 className="mp-h2 mb-1">Calendar</h1>
        <p className="mp-body" style={{ marginBottom: 0 }}>
          View all appointments by date.
        </p>
      </div>

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="medical-card" style={{ padding: 24 }}>
            {/* Override react-calendar base styles to match theme */}
            <style>{`
              .react-calendar {
                width: 100% !important;
                border: none !important;
                font-family: var(--mp-font) !important;
                background: transparent !important;
              }
              .react-calendar__navigation button {
                color: var(--mp-text) !important;
                font-weight: 500 !important;
                border-radius: var(--mp-radius-sm) !important;
                font-size: 14px !important;
                min-width: 40px;
              }
              .react-calendar__navigation button:hover {
                background: var(--mp-bg-muted) !important;
              }
              .react-calendar__month-view__weekdays {
                text-transform: uppercase;
                font-size: 11.5px;
                letter-spacing: 0.05em;
                font-weight: 600;
                color: var(--mp-text-muted);
              }
              .react-calendar__month-view__weekdays abbr {
                text-decoration: none;
              }
              .react-calendar__tile {
                padding: 10px 6px !important;
                background: none !important;
                border-radius: var(--mp-radius-sm) !important;
                color: var(--mp-text) !important;
                font-size: 14px !important;
                position: relative;
              }
              .react-calendar__tile:hover {
                background: var(--mp-bg-muted) !important;
              }
              .react-calendar__tile--now {
                background: var(--mp-primary-light) !important;
                color: var(--mp-primary-active) !important;
                font-weight: 600 !important;
              }
              .react-calendar__tile--active,
              .react-calendar__tile--active:enabled:hover {
                background: var(--mp-primary) !important;
                color: #fff !important;
              }
              .react-calendar__month-view__days__day--neighboringMonth {
                color: var(--mp-text-faint) !important;
              }
            `}</style>
            <Calendar
              value={date}
              onChange={setDate}
              tileContent={tileContent}
            />
          </div>
        </div>

        <div className="col-lg-5">
          <div className="medical-card h-100" style={{ padding: 24 }}>
            <p className="mp-overline mb-1">Appointments</p>
            <h3 className="mp-h3 mb-4" style={{ fontSize: 16 }}>
              {date.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
              })}
            </h3>

            {filteredAppointments.length === 0 ? (
              <div className="text-center py-4">
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: 'var(--mp-bg-muted)',
                    color: 'var(--mp-text-muted)',
                    marginBottom: 12,
                  }}
                >
                  <IconCalendar />
                </div>
                <p className="mp-body mb-0" style={{ fontSize: 14 }}>
                  No appointments scheduled
                </p>
              </div>
            ) : (
              <ul className="list-unstyled mb-0">
                {filteredAppointments.map((apt, i) => (
                  <li
                    key={apt.id}
                    style={{
                      padding: '14px 0',
                      borderTop: i === 0 ? 'none' : '1px solid var(--mp-border)',
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-start gap-3">
                      <div>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: 'var(--mp-text)',
                            marginBottom: 4,
                          }}
                        >
                          {apt.time.substring(0, 5)}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--mp-text-secondary)' }}>
                          Dr. {apt.doctor?.name}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--mp-text-muted)' }}>
                          {apt.patient?.name}
                        </div>
                      </div>
                      <StatusPill status={apt.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}