import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/medical-theme.css";

/* ---------- Icons ---------- */
const IconCalendar = (p) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2"/>
    <path d="M3 10h18M8 3v4M16 3v4"/>
  </svg>
);
const IconCheckCircle = (p) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <path d="M22 4L12 14.01l-3-3"/>
  </svg>
);
const IconClock = (p) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>
  </svg>
);
const IconUser = (p) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconFileText = (p) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <path d="M14 2v6h6M9 13h6M9 17h6"/>
  </svg>
);
const IconHistory = (p) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M3 12a9 9 0 1 0 3-6.7M3 4v4h4"/>
    <path d="M12 7v5l3 2"/>
  </svg>
);
const IconLogout = (p) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <path d="M16 17l5-5-5-5M21 12H9"/>
  </svg>
);
const IconArrowRight = (p) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M5 12h14M13 5l7 7-7 7"/>
  </svg>
);
const IconSpinner = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    style={{ animation: 'mp-spin 0.9s linear infinite' }}>
    <circle cx="12" cy="12" r="9" stroke={color} strokeOpacity="0.2" strokeWidth="2.5"/>
    <path d="M21 12a9 9 0 0 0-9-9" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

export default function PatientDashboard() {
  const [user, setUser] = useState(null);
  const [patientId, setPatientId] = useState(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [stats, setStats] = useState({
    totalAppointments: 0,
    completedAppointments: 0,
    pendingAppointments: 0
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const localUser = JSON.parse(localStorage.getItem("user"));
      if (!localUser) {
        navigate("/login");
        return;
      }
      setUser(localUser);

      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', localUser.id)
        .maybeSingle();

      if (patientError) throw patientError;
      if (!patient) {
        setLoading(false);
        return;
      }

      setPatientId(patient.id);

      const today = new Date().toISOString().split('T')[0];

      const { data: upcoming, error: upcomingError } = await supabase
        .from('appointments')
        .select(`
          id,
          date,
          time,
          status,
          doctor_id,
          doctors (name)
        `)
        .eq('patient_id', patient.id)
        .gte('date', today)
        .in('status', ['pending', 'approved'])
        .order('date', { ascending: true })
        .limit(3);

      if (upcomingError) throw upcomingError;
      setUpcomingAppointments(upcoming || []);

      const { data: allAppointments, error: allError } = await supabase
        .from('appointments')
        .select('status')
        .eq('patient_id', patient.id);

      if (allError) throw allError;

      const total = allAppointments?.length || 0;
      const completed = allAppointments?.filter(a => a.status === 'completed').length || 0;
      const pending = allAppointments?.filter(a => a.status === 'pending').length || 0;

      setStats({
        totalAppointments: total,
        completedAppointments: completed,
        pendingAppointments: pending
      });

    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const quickActions = [
    { to: "/patient/book-appointment", icon: <IconCalendar />,    title: "Book appointment", desc: "Schedule a visit with your doctor" },
    { to: "/patient/profile",          icon: <IconUser />,        title: "My profile",       desc: "Update your personal information" },
    { to: "/patient/history",          icon: <IconHistory />,     title: "Medical history",  desc: "View your past appointments" },
    { to: "/patient/reports",          icon: <IconFileText />,    title: "Reports",          desc: "Access your medical reports" },
  ];

  const statCards = [
    { label: "Total appointments", value: stats.totalAppointments,     icon: <IconCalendar /> },
    { label: "Completed",          value: stats.completedAppointments, icon: <IconCheckCircle /> },
    { label: "Pending",            value: stats.pendingAppointments,   icon: <IconClock /> },
  ];

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeStr) => timeStr.substring(0, 5);

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
      {/* Header */}
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
        <div>
          <p className="mp-overline mb-1">Patient workspace</p>
          <h1 className="mp-h2 mb-1">Welcome back, {user?.name}</h1>
          <p className="mp-body" style={{ marginBottom: 0 }}>
            Here is your health overview.
          </p>
        </div>
        <button className="medical-btn-outline" onClick={handleLogout}>
          <IconLogout />
          Sign out
        </button>
      </div>

      {/* Stats */}
      <div className="row g-3 mb-4">
        {statCards.map((s, i) => (
          <div className="col-md-4" key={i}>
            <div className="medical-card" style={{ padding: 22 }}>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <p className="mp-overline" style={{ marginBottom: 8, fontSize: 10.5 }}>
                    {s.label}
                  </p>
                  <div
                    style={{
                      fontSize: 28,
                      fontWeight: 700,
                      letterSpacing: '-0.03em',
                      color: 'var(--mp-text)',
                      lineHeight: 1.1,
                    }}
                  >
                    {s.value}
                  </div>
                </div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: 'var(--mp-primary-light)',
                    color: 'var(--mp-primary)',
                    border: '1px solid var(--mp-primary-border)',
                    flexShrink: 0,
                  }}
                >
                  {s.icon}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upcoming */}
      {upcomingAppointments.length > 0 ? (
        <div className="mb-4">
          <div className="mb-3">
            <p className="mp-overline mb-2">Upcoming</p>
            <h2 className="mp-h3">Next appointments</h2>
          </div>

          <div className="row g-3">
            {upcomingAppointments.map((apt) => (
              <div key={apt.id} className="col-md-4">
                <div className="medical-card" style={{ padding: 22 }}>
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: 'var(--mp-primary-light)',
                        color: 'var(--mp-primary)',
                        border: '1px solid var(--mp-primary-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <IconUser />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontSize: 14.5,
                          fontWeight: 600,
                          color: 'var(--mp-text)',
                          letterSpacing: '-0.005em',
                          marginBottom: 2,
                        }}
                      >
                        Dr. {apt.doctors?.name || 'Doctor'}
                      </div>
                      <div style={{ fontSize: 12.5, color: 'var(--mp-text-muted)' }}>
                        {formatDate(apt.date)} at {formatTime(apt.time)}
                      </div>
                    </div>
                  </div>
                  <StatusPill status={apt.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="medical-alert medical-alert-info mb-4">
          <span className="medical-alert__icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
            </svg>
          </span>
          <div>
            No upcoming appointments.{' '}
            <Link to="/patient/book-appointment" style={{ fontWeight: 500 }}>
              Book one now
            </Link>
            .
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="mb-3">
        <p className="mp-overline mb-2">Quick actions</p>
        <h2 className="mp-h3">What would you like to do?</h2>
      </div>

      <div className="row g-3">
        {quickActions.map((action, i) => (
          <div key={i} className="col-md-6 col-lg-3">
            <Link to={action.to} className="text-decoration-none" style={{ color: 'inherit' }}>
              <div
                className="medical-card h-100"
                style={{
                  padding: 22,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                }}
              >
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: 'var(--mp-primary-light)',
                    color: 'var(--mp-primary)',
                    border: '1px solid var(--mp-primary-border)',
                  }}
                >
                  {action.icon}
                </div>
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      marginBottom: 4,
                    }}
                  >
                    <h3
                      style={{
                        fontSize: 14.5,
                        fontWeight: 600,
                        letterSpacing: '-0.01em',
                        color: 'var(--mp-text)',
                        marginBottom: 0,
                      }}
                    >
                      {action.title}
                    </h3>
                    <span style={{ color: 'var(--mp-text-faint)' }}>
                      <IconArrowRight />
                    </span>
                  </div>
                  <p className="mp-caption" style={{ marginBottom: 0, fontSize: 12.5 }}>
                    {action.desc}
                  </p>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      <style>{`@keyframes mp-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}