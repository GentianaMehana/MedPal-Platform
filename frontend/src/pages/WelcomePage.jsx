import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/medical-theme.css';

/* ---------- Icons (24px, stroke 1.5) ---------- */
const IconBuilding = (p) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M15 21V9h3a2 2 0 0 1 2 2v10"/>
    <path d="M9 7h2M9 11h2M9 15h2"/>
  </svg>
);

const IconStethoscope = (p) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M4 3v6a4 4 0 0 0 8 0V3"/>
    <path d="M2 3h4M10 3h4"/>
    <path d="M12 13v3a5 5 0 0 0 10 0v-2"/>
    <circle cx="22" cy="11" r="2"/>
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

const IconShield = (p) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <path d="M9 12l2 2 4-4"/>
  </svg>
);

const IconArrowRight = (p) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M5 12h14M13 5l7 7-7 7"/>
  </svg>
);

const IconCheck = (p) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M4 12l5 5L20 7"/>
  </svg>
);

/* ---------- Data ---------- */
const features = [
  {
    icon: <IconBuilding />,
    eyebrow: 'For Clinics',
    title: 'Operational control',
    description:
      'Manage doctors, appointments, and services from a single dashboard. Role-based access with full audit trails.',
  },
  {
    icon: <IconStethoscope />,
    eyebrow: 'For Doctors',
    title: 'Clinical workflows',
    description:
      'Review schedules, access patient history, and issue structured medical reports — all in one workspace.',
  },
  {
    icon: <IconUsers />,
    eyebrow: 'For Patients',
    title: 'Patient access',
    description:
      'Book appointments, view medical records, and communicate securely with your care team.',
  },
];

const trustPoints = [
  'Role-based access control',
  'Structured medical records',
  'Clinic-issued invitations only',
];

export default function WelcomePage() {
  return (
    <div className="min-vh-100 d-flex flex-column" style={{ background: 'var(--mp-bg-subtle)' }}>
      {/* ============ Header ============ */}
      <header
        style={{
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'saturate(180%) blur(12px)',
          WebkitBackdropFilter: 'saturate(180%) blur(12px)',
          borderBottom: '1px solid var(--mp-border)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div className="mp-container d-flex align-items-center justify-content-between py-3">
          <Link
            to="/"
            className="d-flex align-items-center gap-2 text-decoration-none"
            style={{ color: 'var(--mp-text)' }}
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
            <span style={{ fontWeight: 600, fontSize: 16.5, letterSpacing: '-0.02em' }}>
              MedPal
            </span>
          </Link>

          <nav className="d-none d-md-flex align-items-center gap-1">
            <a href="#features" className="medical-btn-ghost" style={{ fontSize: 14 }}>Platform</a>
            <a href="#security" className="medical-btn-ghost" style={{ fontSize: 14 }}>Security</a>
          </nav>

          <div className="d-flex align-items-center gap-2">
            <Link
              to="/login"
              className="medical-btn-ghost d-none d-sm-inline-flex"
              style={{ fontSize: 14 }}
            >
              Sign in
            </Link>
            <Link to="/register/clinic" className="medical-btn-primary" style={{ fontSize: 14 }}>
              Register clinic
            </Link>
          </div>
        </div>
      </header>

      {/* ============ Hero ============ */}
      <main className="flex-grow-1">
        <section
          className="mp-radial-fade"
          style={{
            borderBottom: '1px solid var(--mp-border)',
            background: 'var(--mp-bg)',
          }}
        >
          <div className="mp-container py-5" style={{ paddingTop: 80, paddingBottom: 80 }}>
            <div className="row justify-content-center">
              <div className="col-lg-10 text-center mp-fade-in">
                <div className="d-inline-flex align-items-center gap-2 mb-4">
                  <span className="mp-badge">
                    <span className="mp-badge__dot" />
                    Healthcare operations platform
                  </span>
                </div>

                <h1 className="mp-display mb-4" style={{ maxWidth: 900, margin: '0 auto 24px' }}>
                  Clinical operations,
                  <br />
                  <span style={{ color: 'var(--mp-primary)' }}>unified.</span>
                </h1>

                <p className="mp-lead" style={{ maxWidth: 620, margin: '0 auto 40px' }}>
                  MedPal connects clinics, doctors, and patients through a secure,
                  coordinated platform built for modern medical practice.
                </p>

                <div className="d-flex justify-content-center gap-3 flex-wrap mb-5">
                  <Link to="/register/clinic" className="medical-btn-primary medical-btn--lg">
                    Register your clinic
                    <IconArrowRight />
                  </Link>
                  <Link to="/login" className="medical-btn-outline medical-btn--lg">
                    Sign in
                  </Link>
                </div>

                {/* Trust row */}
                <div
                  className="d-flex justify-content-center align-items-center flex-wrap"
                  style={{ gap: '12px 28px' }}
                >
                  {trustPoints.map((point) => (
                    <span
                      key={point}
                      className="d-inline-flex align-items-center gap-2"
                      style={{
                        fontSize: 13.5,
                        color: 'var(--mp-text-muted)',
                        fontWeight: 500,
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 18,
                          height: 18,
                          borderRadius: 999,
                          background: 'var(--mp-success-bg)',
                          color: 'var(--mp-success)',
                        }}
                      >
                        <IconCheck />
                      </span>
                      {point}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ Features ============ */}
        <section id="features" className="mp-container" style={{ padding: '80px 24px' }}>
          <div className="text-center mb-5">
            <p className="mp-overline mb-3">Built for every role</p>
            <h2 className="mp-h1" style={{ maxWidth: 640, margin: '0 auto' }}>
              One platform. Three coordinated experiences.
            </h2>
          </div>

          <div className="row g-4">
            {features.map((f, i) => (
              <div className="col-md-4" key={i}>
                <div className="medical-card h-100 d-flex flex-column" style={{ padding: 32 }}>
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
                      marginBottom: 24,
                    }}
                  >
                    {f.icon}
                  </div>

                  <p
                    className="mp-overline"
                    style={{ color: 'var(--mp-primary)', marginBottom: 8 }}
                  >
                    {f.eyebrow}
                  </p>

                  <h3 className="mp-h3 mb-3" style={{ letterSpacing: '-0.015em' }}>
                    {f.title}
                  </h3>

                  <p className="mp-body" style={{ marginBottom: 0 }}>
                    {f.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ============ Security note ============ */}
        <section id="security" className="mp-container" style={{ paddingBottom: 80 }}>
          <div className="row justify-content-center">
            <div className="col-lg-9">
              <div
                className="medical-card"
                style={{
                  padding: 28,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 16,
                  background: 'var(--mp-primary-lighter)',
                  borderColor: 'var(--mp-primary-border)',
                }}
              >
                <div
                  style={{
                    flexShrink: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: '#fff',
                    color: 'var(--mp-primary)',
                    border: '1px solid var(--mp-primary-border)',
                  }}
                >
                  <IconShield />
                </div>
                <div>
                  <h4 className="mp-h3 mb-1" style={{ fontSize: 16 }}>
                    Invitation-based access
                  </h4>
                  <p className="mp-body" style={{ marginBottom: 0, fontSize: 14.5 }}>
                    Patients and doctors join MedPal exclusively through verified
                    invitation links issued by their clinic — ensuring every
                    account is authenticated and tied to a real care relationship.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ============ Footer ============ */}
      <footer className="medical-footer">
        <div className="mp-container d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div className="d-flex align-items-center gap-2">
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 22,
                height: 22,
                borderRadius: 6,
                background: 'var(--mp-primary)',
                color: '#fff',
                fontWeight: 700,
                fontSize: 11,
              }}
            >
              M
            </span>
            <span style={{ color: 'var(--mp-text-secondary)', fontWeight: 500 }}>
              © {new Date().getFullYear()} MedPal
            </span>
          </div>
          <div className="d-flex align-items-center gap-4">
            <span style={{ color: 'var(--mp-text-muted)' }}>Secure healthcare infrastructure</span>
          </div>
        </div>
      </footer>
    </div>
  );
}