// frontend/src/components/Layouts/ClinicLayout.jsx
import React from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/medical-theme.css";

/* ---------- Icons (18px, stroke 1.75) ---------- */
const IconDashboard = (p) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="3" y="3" width="7" height="9" rx="1"/>
    <rect x="14" y="3" width="7" height="5" rx="1"/>
    <rect x="14" y="12" width="7" height="9" rx="1"/>
    <rect x="3" y="16" width="7" height="5" rx="1"/>
  </svg>
);
const IconStethoscope = (p) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M4 3v6a4 4 0 0 0 8 0V3"/><path d="M2 3h4M10 3h4"/>
    <path d="M12 13v3a5 5 0 0 0 10 0v-2"/><circle cx="22" cy="11" r="2"/>
  </svg>
);
const IconUserPlus = (p) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/><path d="M20 8v6M23 11h-6"/>
  </svg>
);
const IconCalendar = (p) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2"/>
    <path d="M3 10h18M8 3v4M16 3v4"/>
  </svg>
);
const IconBuilding = (p) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M15 21V9h3a2 2 0 0 1 2 2v10"/>
    <path d="M9 7h2M9 11h2M9 15h2"/>
  </svg>
);
const IconFileText = (p) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <path d="M14 2v6h6M9 13h6M9 17h6"/>
  </svg>
);
const IconMailPlus = (p) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2"/>
    <path d="M3 7l9 6 9-6M16 19h6M19 16v6"/>
  </svg>
);
const IconSettings = (p) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
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

export default function ClinicLayout() {
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("user");
    navigate("/login");
  };

  const menuItems = [
    { to: "/clinic",                 icon: <IconDashboard />,   label: "Dashboard" },
    { to: "/clinic/doctors",         icon: <IconStethoscope />, label: "Doctors" },
    { to: "/clinic/add-doctor",      icon: <IconUserPlus />,    label: "Add doctor" },
    { to: "/clinic/appointments",    icon: <IconCalendar />,    label: "Appointments" },
    { to: "/clinic/services",        icon: <IconBuilding />,    label: "Services" },
    { to: "/clinic/reports",         icon: <IconFileText />,    label: "Reports" },
    { to: "/clinic/invite-patient",  icon: <IconMailPlus />,    label: "Invite patient" },
    { to: "/clinic/profile",         icon: <IconSettings />,    label: "Profile" },
  ];

  return (
    <div
      className="d-flex"
      style={{
        minHeight: '100vh',
        background: 'var(--mp-bg-subtle)',
      }}
    >
      {/* Sidebar */}
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
        {/* Brand */}
        <Link
          to="/clinic"
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

        {/* User card */}
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
              {user?.name?.charAt(0)?.toUpperCase() || 'C'}
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
                {user?.name || 'Clinic'}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--mp-text-muted)' }}>
                Clinic account
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-grow-1 d-flex flex-column gap-1" style={{ overflowY: 'auto' }}>
          {menuItems.map((item, index) => {
            const active =
              location.pathname === item.to ||
              (item.to !== "/clinic" && location.pathname.startsWith(item.to));
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

        {/* Logout */}
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

      {/* Main */}
      <main style={{ flex: 1, minWidth: 0 }}>
        <Outlet />
      </main>
    </div>
  );
}