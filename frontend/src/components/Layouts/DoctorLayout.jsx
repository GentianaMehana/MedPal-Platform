import React from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/medical-theme.css";

const IconDashboard = (p) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="3" y="3" width="7" height="9" rx="1"/>
    <rect x="14" y="3" width="7" height="5" rx="1"/>
    <rect x="14" y="12" width="7" height="9" rx="1"/>
    <rect x="3" y="16" width="7" height="5" rx="1"/>
  </svg>
);
const IconList = (p) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
  </svg>
);
const IconCalendar = (p) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2"/>
    <path d="M3 10h18M8 3v4M16 3v4"/>
  </svg>
);
const IconFileText = (p) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <path d="M14 2v6h6M9 13h6M9 17h6"/>
  </svg>
);
const IconFlask = (p) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M9 3h6v6l5 9a2 2 0 0 1-1.8 3H5.8A2 2 0 0 1 4 18l5-9V3z"/>
    <path d="M9 3v6M15 3v6M7 15h10"/>
  </svg>
);
const IconUser = (p) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconClock = (p) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>
  </svg>
);
const IconLogout = (p) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <path d="M16 17l5-5-5-5M21 12H9"/>
  </svg>
);

export default function DoctorLayout() {
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("user");
    navigate("/login");
  };

  const menuItems = [
    { to: "/doctor",                  icon: <IconDashboard />, label: "Dashboard" },
    { to: "/doctor/appointments",     icon: <IconList />,      label: "Appointments" },
    { to: "/doctor/calendar",         icon: <IconCalendar />,  label: "Calendar" },
    { to: "/doctor/add-report",       icon: <IconFileText />,  label: "Visit report" },
    { to: "/doctor/add-test-results", icon: <IconFlask />,     label: "Test results" },
    { to: "/doctor/reports",          icon: <IconFileText />,  label: "My reports" },
    { to: "/doctor/profile",          icon: <IconUser />,      label: "Profile" },
    { to: "/doctor/working-hours",    icon: <IconClock />,     label: "Working hours" },
  ];

  return (
    <div
      className="d-flex"
      style={{
        minHeight: '100vh',
        background: 'var(--mp-bg-subtle)',
      }}
    >
      <aside
        className="d-flex flex-column"
        style={{
          width: 260,
          background: 'var(--mp-bg)',
          borderRight: '1px solid var(--mp-border)',
          padding: '20px 16px',
          position: 'sticky',
          top: 0,
          height: '100vh',
          flexShrink: 0,
        }}
      >
        <Link
          to="/doctor"
          className="d-flex align-items-center gap-2 text-decoration-none"
          style={{ color: 'var(--mp-text)', padding: '4px 8px', marginBottom: 24 }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 30,
              height: 30,
              borderRadius: 8,
              background: 'var(--mp-primary)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 14,
              letterSpacing: '-0.02em',
              boxShadow: '0 1px 2px rgba(10,15,26,0.15)',
            }}
          >
            M
          </span>
          <span style={{ fontWeight: 600, fontSize: 16, letterSpacing: '-0.02em' }}>
            MedPal
          </span>
        </Link>

        <div
          style={{
            padding: 14,
            background: 'var(--mp-bg-subtle)',
            border: '1px solid var(--mp-border)',
            borderRadius: 'var(--mp-radius)',
            marginBottom: 20,
          }}
        >
          <div className="d-flex align-items-center gap-3">
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 9,
                background: 'var(--mp-primary)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: 14,
                flexShrink: 0,
              }}
            >
              {user?.name?.charAt(0)?.toUpperCase() || 'D'}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: 'var(--mp-text)',
                  letterSpacing: '-0.005em',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                Dr. {user?.name || 'Doctor'}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--mp-text-muted)' }}>
                Doctor account
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-grow-1 d-flex flex-column gap-1" style={{ overflowY: 'auto' }}>
          {menuItems.map((item, index) => {
            const active =
              location.pathname === item.to ||
              (item.to !== "/doctor" && location.pathname.startsWith(item.to));
            return (
              <Link
                key={index}
                to={item.to}
                className="d-flex align-items-center gap-3 text-decoration-none"
                style={{
                  padding: '9px 12px',
                  fontSize: 13.5,
                  fontWeight: 500,
                  letterSpacing: '-0.005em',
                  color: active ? 'var(--mp-primary-active)' : 'var(--mp-text-secondary)',
                  background: active ? 'var(--mp-primary-light)' : 'transparent',
                  border: active ? '1px solid var(--mp-primary-border)' : '1px solid transparent',
                  borderRadius: 'var(--mp-radius-sm)',
                  transition: 'background 120ms ease, color 120ms ease',
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = 'var(--mp-bg-muted)';
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = 'transparent';
                }}
              >
                <span style={{ display: 'inline-flex', flexShrink: 0 }}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={handleLogout}
          className="d-flex align-items-center gap-3"
          style={{
            marginTop: 16,
            padding: '9px 12px',
            fontSize: 13.5,
            fontWeight: 500,
            letterSpacing: '-0.005em',
            color: 'var(--mp-text-secondary)',
            background: 'transparent',
            border: '1px solid var(--mp-border)',
            borderRadius: 'var(--mp-radius-sm)',
            cursor: 'pointer',
            transition: 'background 120ms ease, color 120ms ease, border-color 120ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--mp-danger-bg)';
            e.currentTarget.style.color = 'var(--mp-danger)';
            e.currentTarget.style.borderColor = 'var(--mp-danger-bd)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--mp-text-secondary)';
            e.currentTarget.style.borderColor = 'var(--mp-border)';
          }}
        >
          <IconLogout />
          Sign out
        </button>
      </aside>

      <main style={{ flex: 1, minWidth: 0 }}>
        <Outlet />
      </main>
    </div>
  );
}