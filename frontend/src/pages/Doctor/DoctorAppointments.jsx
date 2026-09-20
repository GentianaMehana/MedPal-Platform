import { useEffect, useState } from "react";
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
const IconCheck = (p) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M4 12l5 5L20 7"/>
  </svg>
);
const IconX = (p) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M18 6L6 18M6 6l12 12"/>
  </svg>
);
const IconUser = (p) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconSpinner = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    style={{ animation: 'mp-spin 0.9s linear infinite' }}>
    <circle cx="12" cy="12" r="9" stroke={color} strokeOpacity="0.2" strokeWidth="2.5"/>
    <path d="M21 12a9 9 0 0 0-9-9" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

export default function DoctorAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [doctorId, setDoctorId] = useState(null);

  useEffect(() => {
    getDoctorId();
  }, []);

  const getDoctorId = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      console.log("Current doctor user:", user);

      const { data: doctor, error: doctorError } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (doctorError) throw doctorError;

      if (doctor) {
        console.log("Doctor found with id:", doctor.id);
        setDoctorId(doctor.id);
        fetchAppointments(doctor.id);
      } else {
        console.log("Doctor not found for user_id:", user.id);
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
          is_present,
          patient_id,
          patients (name, email, phone)
        `)
        .eq('doctor_id', docId)
        .neq('status', 'canceled')
        .order('date', { ascending: true });

      if (error) throw error;

      console.log("Appointments found:", data);

      const formattedAppointments = data?.map(apt => ({
        id: apt.id,
        date: apt.date,
        time: apt.time,
        status: apt.status,
        is_present: apt.is_present || false,
        patient: apt.patients || { name: 'Unknown', email: '', phone: null }
      })) || [];

      setAppointments(formattedAppointments);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      if (doctorId) fetchAppointments(doctorId);
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const updatePresence = async (id, isPresent) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ is_present: isPresent })
        .eq('id', id);

      if (error) throw error;
      if (doctorId) fetchAppointments(doctorId);
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (time) => {
    return time.substring(0, 5);
  };

  const statusStyles = {
    pending:   { bg: 'var(--mp-warning-bg)', color: 'var(--mp-warning)', border: 'var(--mp-warning-bd)' },
    approved:  { bg: 'var(--mp-success-bg)', color: 'var(--mp-success)', border: 'var(--mp-success-bd)' },
    completed: { bg: 'var(--mp-success-bg)', color: 'var(--mp-success)', border: 'var(--mp-success-bd)' },
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
        <p className="mp-overline mb-1">Doctor</p>
        <h1 className="mp-h2 mb-1">My appointments</h1>
        <p className="mp-body" style={{ marginBottom: 0 }}>
          Manage your scheduled appointments.
        </p>
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
          <h3 className="mp-h3 mb-1">No appointments scheduled</h3>
          <p className="mp-body mb-0">Your appointments will appear here.</p>
        </div>
      ) : (
        <div className="row g-3">
          {appointments.map((apt) => (
            <div key={apt.id} className="col-md-6 col-lg-4">
              <div className="medical-card h-100" style={{ padding: 22 }}>
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: 'var(--mp-text)',
                        letterSpacing: '-0.01em',
                        marginBottom: 2,
                      }}
                    >
                      {apt.patient?.name}
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--mp-text-muted)' }}>
                      {apt.patient?.email}
                    </div>
                    {apt.patient?.phone && (
                      <div style={{ fontSize: 12.5, color: 'var(--mp-text-muted)' }}>
                        {apt.patient.phone}
                      </div>
                    )}
                  </div>
                  <StatusPill status={apt.status} />
                </div>

                <div
                  style={{
                    padding: '10px 0',
                    borderTop: '1px solid var(--mp-border)',
                    borderBottom: '1px solid var(--mp-border)',
                    marginBottom: 14,
                  }}
                >
                  <div className="mp-overline" style={{ fontSize: 10.5, marginBottom: 4 }}>
                    Schedule
                  </div>
                  <div style={{ fontSize: 13.5, color: 'var(--mp-text)' }}>
                    {formatDate(apt.date)}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--mp-text-secondary)' }}>
                    at {formatTime(apt.time)}
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <button
                    className={apt.is_present ? 'medical-btn-primary' : 'medical-btn-outline'}
                    onClick={() => updatePresence(apt.id, !apt.is_present)}
                    style={{ flex: 1, padding: '8px 12px', fontSize: 13 }}
                  >
                    {apt.is_present ? (
                      <>
                        <IconCheck />
                        Present
                      </>
                    ) : (
                      <>
                        <IconUser />
                        Mark present
                      </>
                    )}
                  </button>

                  {apt.status === 'pending' && (
                    <>
                      <button
                        type="button"
                        className="medical-btn-primary"
                        onClick={() => updateStatus(apt.id, 'approved')}
                        title="Approve"
                        style={{ padding: '8px 10px' }}
                      >
                        <IconCheck />
                      </button>
                      <button
                        type="button"
                        className="medical-btn-outline"
                        onClick={() => updateStatus(apt.id, 'canceled')}
                        title="Cancel"
                        style={{ padding: '8px 10px', color: 'var(--mp-danger)' }}
                      >
                        <IconX />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes mp-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}