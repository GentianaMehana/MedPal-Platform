import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/medical-theme.css';

export default function WelcomePage() {
  return (
    <div className="min-vh-100" style={{
      background: 'linear-gradient(135deg, #f5f9ff 0%, #ffffff 100%)'
    }}>
      {/* Header */}
      <header className="text-center py-5" style={{
        background: 'linear-gradient(135deg, #2b6c9e 0%, #4a8fc1 100%)',
        color: 'white',
        borderBottomLeftRadius: '50px',
        borderBottomRightRadius: '50px',
        boxShadow: '0 10px 30px rgba(43, 108, 158, 0.3)'
      }}>
        <div className="container py-5">
          <h1 className="display-1 fw-bold mb-3" style={{
            animation: 'fadeInDown 1s ease',
            textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
          }}>
            Med<span style={{ color: '#ffd700' }}>Pal</span>
          </h1>
          <p className="fs-4 mb-0" style={{
            animation: 'fadeInUp 1s ease 0.3s both',
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            Your Digital Healthcare Companion
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-5">
        {/* Features */}
        <div className="row g-4 mb-5">
          <div className="col-md-4">
            <div className="medical-card text-center h-100">
              <div className="display-1 mb-3">🏥</div>
              <h3 className="medical-label">For Clinics</h3>
              <p className="text-muted">
                Register your clinic, manage doctors, appointments, and services in one place.
                Streamline your clinic operations.
              </p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="medical-card text-center h-100">
              <div className="display-1 mb-3">👨‍⚕️</div>
              <h3 className="medical-label">For Doctors</h3>
              <p className="text-muted">
                View your schedule, patient history, and create medical reports.
                Stay organized and efficient. (Access via clinic invitation)
              </p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="medical-card text-center h-100">
              <div className="display-1 mb-3">🧑‍🤝‍🧑</div>
              <h3 className="medical-label">For Patients</h3>
              <p className="text-muted">
                Book appointments, access your medical records, and communicate
                with your healthcare providers. (Access via clinic invitation)
              </p>
            </div>
          </div>
        </div>

        {/* Info Alert */}
        <div className="alert alert-info text-center mb-4 mx-auto" style={{ maxWidth: '600px' }}>
          <i className="bi bi-info-circle me-2"></i>
          <strong>Note:</strong> Patients and doctors can only register through invitation links sent by clinics.
        </div>

        {/* CTA Buttons */}
        <div className="text-center">
          <div className="d-flex justify-content-center gap-3 flex-wrap">
            <Link to="/login" className="medical-btn-primary px-5 py-3 fs-5">
              Login to MedPal
            </Link>
            <Link to="/register/clinic" className="medical-btn-outline px-5 py-3 fs-5">
              Register Your Clinic
            </Link>
          </div>
          
        </div>
      </main>

      {/* Footer */}
      <footer className="medical-footer">
        <div className="container">
          <p className="mb-0">
            © {new Date().getFullYear()} MedPal. All rights reserved.
            Made with ❤️ for better healthcare.
          </p>
        </div>
      </footer>
    </div>
  );
}