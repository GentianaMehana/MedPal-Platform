// frontend/src/components/Layouts/PatientLayout.jsx
import React from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/medical-theme.css";

export default function PatientLayout() {
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("user");
    navigate("/login");
  };

  const menuItems = [
    { to: "/patient", icon: "📊", label: "Dashboard" },
    { to: "/patient/book-appointment", icon: "📅", label: "Book Appointment" },
    { to: "/patient/profile", icon: "👤", label: "My Profile" },
    { to: "/patient/history", icon: "📖", label: "History" },
    { to: "/patient/notifications", icon: "🔔", label: "Notifications" },
    { to: "/patient/reports", icon: "📋", label: "Reports" },
    { to: "/patient/documents", icon: "📁", label: "Documents" },
  ];

  return (
    <div className="container-fluid p-0">
      <div className="row g-0">
        {/* Sidebar */}
        <div className="col-md-3 col-lg-2" style={{
          background: 'linear-gradient(180deg, #2b6c9e 0%, #1e4a6b 100%)',
          minHeight: '100vh',
          boxShadow: '2px 0 10px rgba(43, 108, 158, 0.2)'
        }}>
          <div className="p-4">
            {/* User Profile */}
            <div className="text-center mb-4">
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: '#ffd700',
                margin: '0 auto 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                color: '#2b6c9e',
                boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
              }}>
                {user?.name?.charAt(0)}
              </div>
              <h5 className="text-white mb-0">{user?.name}</h5>
              <p className="text-white-50 small">Patient</p>
            </div>

            {/* Navigation */}
            <nav className="nav flex-column">
              {menuItems.map((item, index) => (
                <Link
                  key={index}
                  to={item.to}
                  className="nav-link text-white mb-2"
                  style={{
                    borderRadius: '10px',
                    padding: '12px 15px',
                    transition: 'all 0.3s ease',
                    background: window.location.pathname === item.to ? 'rgba(255,255,255,0.2)' : 'transparent'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                  onMouseLeave={(e) => {
                    if (window.location.pathname !== item.to) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <span className="me-3">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="btn w-100 mt-4"
              style={{
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                border: '2px solid rgba(255,255,255,0.2)',
                borderRadius: '10px',
                padding: '12px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
              }}
            >
              🚪 Logout
            </button>
          </div>
        </div>

        {/* Main Content */}
        <main className="col-md-9 col-lg-10 p-4" style={{
          background: 'linear-gradient(135deg, #f5f9ff 0%, #ffffff 100%)',
          minHeight: '100vh'
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}