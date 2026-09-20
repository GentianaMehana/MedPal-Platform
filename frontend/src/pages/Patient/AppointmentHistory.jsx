import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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

export default function AppointmentHistory() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));

      const { data: patient } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!patient) {
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
          created_at,
          doctors (name, specialization),
          services (name, price)
        `)
        .eq('patient_id', patient.id)
        .order('date', { ascending: false });

      if (error) throw error;

      const formattedAppointments = data?.map(apt => ({
        id: apt.id,
        date: apt.date,
        time: apt.time,
        status: apt.status,
        doctor: apt.doctors || { name: 'Unknown', specialization: 'General' },
        service: apt.services || { name: 'Consultation', price: 50 }
      })) || [];

      setAppointments(formattedAppointments);
    } catch (err) {
      console.error("Error in fetchAppointments:", err);
    } finally {
      setLoading(false);
    }
  };

  const statusStyles = {
    pending:   { bg: 'var(--mp-warning-bg)', color: 'var(--mp-warning)', border: 'var(--mp-warning-bd)' },
    approved:  { bg: 'var(--mp-success-bg)', color: 'var(--mp-success)', border: 'var(--mp-success-bd)' },
    completed: { bg: 'var(--mp-info-bg)',    color: 'var(--mp-info)',    border: 'var(--mp-info-bd)' },
    canceled:  { bg: 'var(--mp-danger-bg)',  color: 'var(--mp-danger)',  border: 'var(--mp-danger-bd)' },
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

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
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

  const completedCount = appointments.filter(a => a.status === 'completed').length;
  const totalSpent = appointments.reduce((sum, apt) => sum + (apt.service?.price || 0), 0);

  return (
    <div className="container-fluid px-4 py-4">
      {/* Page header */}
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
        <div>
          <p className="mp-overline mb-1">Patient</p>
          <h1 className="mp-h2 mb-1">Appointment history</h1>
          <p className="mp-body" style={{ marginBottom: 0 }}>
            A record of all your visits and services.
          </p>
        </div>
        <span className="mp-badge">Total: {appointments.length}</span>
      </div>

      {appointments.length === 0 ? (
        <div className="medical-card text-center py-5">
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              borderRadius: 14,
              background: 'var(--mp-bg-muted)',
              color: 'var(--mp-text-muted)',
              marginBottom: 16,
            }}
          >
            <IconCalendar />
          </div>
          <h3 className="mp-h3 mb-1">No appointments yet</h3>
          <p className="mp-body mb-4">
            Book your first appointment to get started.
          </p>
          <Link to="/patient/book-appointment" className="medical-btn-primary">
            Book appointment
          </Link>
        </div>
      ) : (
        <>
          <div className="medical-card mb-4" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-responsive">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: 'var(--mp-bg-subtle)' }}>
                    {['Date', 'Time', 'Doctor', 'Service', 'Price', 'Status'].map(h => (
                      <th
                        key={h}
                        style={{
                          textAlign: 'left',
                          padding: '12px 20px',
                          fontSize: 12,
                          fontWeight: 600,
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                          color: 'var(--mp-text-muted)',
                          borderBottom: '1px solid var(--mp-border)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((apt) => (
                    <tr key={apt.id} style={{ borderBottom: '1px solid var(--mp-border)' }}>
                      <td style={{ padding: '14px 20px', verticalAlign: 'middle' }}>
                        <span style={{ fontWeight: 500, color: 'var(--mp-text)' }}>
                          {formatDate(apt.date)}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', verticalAlign: 'middle' }}>
                        <span
                          style={{
                            fontSize: 12.5,
                            color: 'var(--mp-text-secondary)',
                            background: 'var(--mp-bg-muted)',
                            padding: '3px 10px',
                            borderRadius: 6,
                          }}
                        >
                          {formatTime(apt.time)}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: 500, color: 'var(--mp-text)' }}>
                          Dr. {apt.doctor?.name}
                        </div>
                        <div style={{ fontSize: 12.5, color: 'var(--mp-text-muted)' }}>
                          {apt.doctor?.specialization}
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px', verticalAlign: 'middle', color: 'var(--mp-text-secondary)' }}>
                        {apt.service?.name}
                      </td>
                      <td style={{ padding: '14px 20px', verticalAlign: 'middle' }}>
                        <span style={{ fontWeight: 600, color: 'var(--mp-success)' }}>
                          €{apt.service?.price}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', verticalAlign: 'middle' }}>
                        <StatusPill status={apt.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary */}
          <div className="row g-3">
            <div className="col-md-4">
              <div className="medical-card" style={{ padding: 20 }}>
                <p className="mp-overline" style={{ marginBottom: 6, fontSize: 10.5 }}>
                  Total appointments
                </p>
                <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--mp-text)' }}>
                  {appointments.length}
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="medical-card" style={{ padding: 20 }}>
                <p className="mp-overline" style={{ marginBottom: 6, fontSize: 10.5 }}>
                  Completed
                </p>
                <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--mp-success)' }}>
                  {completedCount}
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="medical-card" style={{ padding: 20 }}>
                <p className="mp-overline" style={{ marginBottom: 6, fontSize: 10.5 }}>
                  Total spent
                </p>
                <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--mp-text)' }}>
                  €{totalSpent}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`@keyframes mp-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}