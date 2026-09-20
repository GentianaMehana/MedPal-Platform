import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/medical-theme.css";

/* ---------- Icons ---------- */
const IconUsers = (p) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IconStethoscope = (p) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M4 3v6a4 4 0 0 0 8 0V3"/><path d="M2 3h4M10 3h4"/>
    <path d="M12 13v3a5 5 0 0 0 10 0v-2"/><circle cx="22" cy="11" r="2"/>
  </svg>
);
const IconCalendar = (p) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2"/>
    <path d="M3 10h18M8 3v4M16 3v4"/>
  </svg>
);
const IconCalendarPlus = (p) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2"/>
    <path d="M3 10h18M8 3v4M16 3v4M12 14v4M10 16h4"/>
  </svg>
);
const IconUserPlus = (p) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/><path d="M20 8v6M23 11h-6"/>
  </svg>
);
const IconBuilding = (p) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M15 21V9h3a2 2 0 0 1 2 2v10"/>
    <path d="M9 7h2M9 11h2M9 15h2"/>
  </svg>
);
const IconClock = (p) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>
  </svg>
);
const IconFileText = (p) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <path d="M14 2v6h6M9 13h6M9 17h6"/>
  </svg>
);
const IconMailPlus = (p) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2"/>
    <path d="M3 7l9 6 9-6"/><path d="M19 14h4M21 12v4" transform="translate(-3,0)"/>
  </svg>
);
const IconSettings = (p) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);
const IconLogout = (p) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <path d="M16 17l5-5-5-5M21 12H9"/>
  </svg>
);
const IconSpinner = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    style={{ animation: 'mp-spin 0.9s linear infinite' }}>
    <circle cx="12" cy="12" r="9" stroke={color} strokeOpacity="0.2" strokeWidth="2.5"/>
    <path d="M21 12a9 9 0 0 0-9-9" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

export default function ClinicDashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ doctors: 0, patients: 0, appointments: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const clinicUser = JSON.parse(localStorage.getItem("user"));
      if (!clinicUser) {
        navigate("/login");
        return;
      }
      setUser(clinicUser);

      const { data: clinicData } = await supabase
        .from('clinics')
        .select('id')
        .eq('user_id', clinicUser.id)
        .maybeSingle();

      const clinicId = clinicData?.id;

      if (!clinicId) {
        setLoading(false);
        return;
      }

      const { count: doctorsCount } = await supabase
        .from('doctors')
        .select('*', { count: 'exact', head: true })
        .eq('clinic_id', clinicId);

      const { count: patientsCount } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .eq('registered_by_clinic_id', clinicUser.id);

      const { data: doctors } = await supabase
        .from('doctors')
        .select('id')
        .eq('clinic_id', clinicId);

      const doctorIds = doctors?.map(d => d.id) || [];

      let appointmentsCount = 0;
      if (doctorIds.length > 0) {
        const { count } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .in('doctor_id', doctorIds);
        appointmentsCount = count || 0;
      }

      setStats({
        doctors: doctorsCount || 0,
        patients: patientsCount || 0,
        appointments: appointmentsCount || 0
      });
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("user");
    navigate("/login");
  };

  const quickActions = [
    { to: "/clinic/doctors",           icon: <IconStethoscope />,  title: "Doctors",          desc: "View all clinic doctors" },
    { to: "/clinic/add-doctor",        icon: <IconUserPlus />,     title: "Add doctor",       desc: "Invite a new doctor" },
    { to: "/clinic/calendar",          icon: <IconCalendar />,     title: "Calendar",         desc: "Appointments by date" },
    { to: "/clinic/appointments",      icon: <IconCalendarPlus />, title: "Appointments",     desc: "Manage all appointments" },
    { to: "/clinic/services",          icon: <IconBuilding />,     title: "Services",         desc: "Departments and services" },
    { to: "/clinic/set-working-hours", icon: <IconClock />,        title: "Working hours",    desc: "Set doctor schedules" },
    { to: "/clinic/reports",           icon: <IconFileText />,     title: "Reports",          desc: "Patient medical reports" },
    { to: "/clinic/invite-patient",    icon: <IconMailPlus />,     title: "Invite patient",   desc: "Send a patient invitation" },
    { to: "/clinic/profile",           icon: <IconSettings />,     title: "Profile",          desc: "Update clinic information" },
  ];

  const statCards = [
    { label: 'Doctors',      value: stats.doctors,      icon: <IconStethoscope /> },
    { label: 'Patients',     value: stats.patients,     icon: <IconUsers /> },
    { label: 'Appointments', value: stats.appointments, icon: <IconCalendar /> },
  ];

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div style={{ color: 'var(--mp-primary)' }}>
          <IconSpinner size={28} />
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
          <p className="mp-overline mb-1">Clinic workspace</p>
          <h1 className="mp-h2 mb-1">{user?.name || 'Clinic'}</h1>
          <p className="mp-body" style={{ marginBottom: 0 }}>
            Manage doctors, appointments, and services.
          </p>
        </div>
        <button className="medical-btn-outline" onClick={handleLogout}>
          <IconLogout />
          Sign out
        </button>
      </div>

      {/* Stat cards */}
      <div className="row g-3 mb-4">
        {statCards.map((s, i) => (
          <div className="col-md-4" key={i}>
            <div className="medical-card" style={{ padding: 24 }}>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <p className="mp-overline" style={{ marginBottom: 8 }}>{s.label}</p>
                  <div
                    style={{
                      fontSize: 32,
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
                    width: 44,
                    height: 44,
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

      <div className="row g-3">
        {quickActions.map((card, index) => (
          <div key={index} className="col-md-6 col-lg-4">
            <Link to={card.to} className="text-decoration-none" style={{ color: 'inherit' }}>
              <div
                className="medical-card h-100"
                style={{
                  padding: 22,
                  display: 'flex',
                  alignItems: 'flex-start',
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
                    flexShrink: 0,
                  }}
                >
                  {card.icon}
                </div>
                <div className="flex-grow-1">
                  <h3
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      letterSpacing: '-0.01em',
                      color: 'var(--mp-text)',
                      marginBottom: 4,
                    }}
                  >
                    {card.title}
                  </h3>
                  <p
                    className="mp-caption"
                    style={{ marginBottom: 0, fontSize: 13 }}
                  >
                    {card.desc}
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