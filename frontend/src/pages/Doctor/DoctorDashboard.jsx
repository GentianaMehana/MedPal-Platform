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
const IconClock = (p) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>
  </svg>
);
const IconUsers = (p) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IconFlask = (p) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M9 3h6v6l5 9a2 2 0 0 1-1.8 3H5.8A2 2 0 0 1 4 18l5-9V3z"/>
    <path d="M9 3v6M15 3v6M7 15h10"/>
  </svg>
);
const IconFileText = (p) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <path d="M14 2v6h6M9 13h6M9 17h6"/>
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

export default function DoctorDashboard() {
  const [user, setUser] = useState(null);
  const [doctorId, setDoctorId] = useState(null);
  const [stats, setStats] = useState({
    todayAppointments: 0,
    pendingAppointments: 0,
    totalPatients: 0,
    recentTests: 0
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [recentTests, setRecentTests] = useState([]);
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

      const { data: doctor, error: doctorError } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', localUser.id)
        .maybeSingle();

      if (doctorError) throw doctorError;
      if (!doctor) {
        setLoading(false);
        return;
      }

      setDoctorId(doctor.id);
      const today = new Date().toISOString().split('T')[0];

      const { count: todayCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', doctor.id)
        .eq('date', today);

      const { count: pendingCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', doctor.id)
        .eq('status', 'pending');

      const { data: patients } = await supabase
        .from('appointments')
        .select('patient_id')
        .eq('doctor_id', doctor.id);

      const uniquePatients = new Set(patients?.map(p => p.patient_id)).size;

      const { count: testsCount } = await supabase
        .from('test_results')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', doctor.id);

      const { data: recent } = await supabase
        .from('appointments')
        .select(`
          id,
          date,
          time,
          status,
          patients!inner (name)
        `)
        .eq('doctor_id', doctor.id)
        .order('date', { ascending: false })
        .limit(5);

      const { data: tests } = await supabase
        .from('test_results')
        .select(`
          id,
          test_name,
          test_date,
          is_abnormal,
          patients!inner (name)
        `)
        .eq('doctor_id', doctor.id)
        .order('test_date', { ascending: false })
        .limit(5);

      setStats({
        todayAppointments: todayCount || 0,
        pendingAppointments: pendingCount || 0,
        totalPatients: uniquePatients || 0,
        recentTests: testsCount || 0
      });

      const formattedRecent = recent?.map(apt => ({
        id: apt.id,
        date: apt.date,
        time: apt.time,
        status: apt.status,
        patient: apt.patients || { name: 'Unknown' }
      })) || [];

      const formattedTests = tests?.map(test => ({
        id: test.id,
        name: test.test_name,
        date: test.test_date,
        is_abnormal: test.is_abnormal,
        patient: test.patients || { name: 'Unknown' }
      })) || [];

      setRecentAppointments(formattedRecent);
      setRecentTests(formattedTests);
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
    { to: "/doctor/appointments",     icon: <IconCalendar />,   title: "View appointments",   desc: "Upcoming and pending" },
    { to: "/doctor/add-report",       icon: <IconFileText />,   title: "Create report",       desc: "Document a visit" },
    { to: "/doctor/add-test-results", icon: <IconFlask />,      title: "Add test results",    desc: "Record new tests" },
    { to: "/doctor/calendar",         icon: <IconCalendar />,   title: "Calendar",            desc: "By date overview" },
    { to: "/doctor/working-hours",    icon: <IconClock />,      title: "Set hours",           desc: "Weekly availability" },
  ];

  const statCards = [
    { label: "Today's appointments", value: stats.todayAppointments, icon: <IconCalendar /> },
    { label: "Pending approvals",    value: stats.pendingAppointments, icon: <IconClock /> },
    { label: "Total patients",       value: stats.totalPatients, icon: <IconUsers /> },
    { label: "Test results",         value: stats.recentTests, icon: <IconFlask /> },
  ];

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
          fontSize: 11.5,
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

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (time) => time?.substring(0, 5) || '';

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
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
        <div>
          <p className="mp-overline mb-1">Doctor workspace</p>
          <h1 className="mp-h2 mb-1">Welcome back, Dr. {user?.name}</h1>
          <p className="mp-body" style={{ marginBottom: 0 }}>
            Here is your practice overview.
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
          <div className="col-md-6 col-lg-3" key={i}>
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

      {/* Quick actions */}
      <div className="mb-3">
        <p className="mp-overline mb-2">Quick actions</p>
        <h2 className="mp-h3">Common tasks</h2>
      </div>

      <div className="row g-3 mb-5">
        {quickActions.map((action, i) => (
          <div key={i} className="col-md-6 col-lg-4">
            <Link to={action.to} className="text-decoration-none" style={{ color: 'inherit' }}>
              <div
                className="medical-card h-100"
                style={{
                  padding: 20,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
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
                    flexShrink: 0,
                  }}
                >
                  {action.icon}
                </div>
                <div className="flex-grow-1">
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                    }}
                  >
                    <h3
                      style={{
                        fontSize: 14.5,
                        fontWeight: 600,
                        letterSpacing: '-0.01em',
                        color: 'var(--mp-text)',
                        marginBottom: 2,
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

      {/* Two columns: recent appointments / tests */}
      <div className="row g-4">
        <div className="col-lg-6">
          <div className="medical-card" style={{ padding: 22 }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <p className="mp-overline" style={{ marginBottom: 0 }}>Recent appointments</p>
              <span className="mp-badge mp-badge--neutral">{recentAppointments.length}</span>
            </div>

            {recentAppointments.length === 0 ? (
              <p className="mp-caption text-center py-3 mb-0">
                No recent appointments.
              </p>
            ) : (
              <ul className="list-unstyled mb-0">
                {recentAppointments.map((apt, i) => (
                  <li
                    key={apt.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      padding: '11px 0',
                      borderTop: i === 0 ? 'none' : '1px solid var(--mp-border)',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--mp-text)' }}>
                        {apt.patient?.name}
                      </div>
                      <div style={{ fontSize: 12.5, color: 'var(--mp-text-muted)' }}>
                        {formatDate(apt.date)} · {formatTime(apt.time)}
                      </div>
                    </div>
                    <StatusPill status={apt.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="col-lg-6">
          <div className="medical-card" style={{ padding: 22 }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <p className="mp-overline" style={{ marginBottom: 0 }}>Recent test results</p>
              <span className="mp-badge mp-badge--neutral">{recentTests.length}</span>
            </div>

            {recentTests.length === 0 ? (
              <p className="mp-caption text-center py-3 mb-0">
                No test results yet.
              </p>
            ) : (
              <ul className="list-unstyled mb-0">
                {recentTests.map((test, i) => (
                  <li
                    key={test.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      padding: '11px 0',
                      borderTop: i === 0 ? 'none' : '1px solid var(--mp-border)',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--mp-text)' }}>
                        {test.patient?.name}
                      </div>
                      <div style={{ fontSize: 12.5, color: 'var(--mp-text-muted)' }}>
                        {test.name} · {formatDate(test.date)}
                      </div>
                    </div>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '3px 10px',
                        fontSize: 11.5,
                        fontWeight: 500,
                        borderRadius: 999,
                        background: test.is_abnormal ? 'var(--mp-danger-bg)' : 'var(--mp-success-bg)',
                        color: test.is_abnormal ? 'var(--mp-danger)' : 'var(--mp-success)',
                        border: `1px solid ${test.is_abnormal ? 'var(--mp-danger-bd)' : 'var(--mp-success-bd)'}`,
                      }}
                    >
                      {test.is_abnormal ? 'Abnormal' : 'Normal'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <style>{`@keyframes mp-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}