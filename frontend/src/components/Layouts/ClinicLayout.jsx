// frontend/src/components/Layouts/ClinicLayout.jsx
import React from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import "bootstrap/dist/css/bootstrap.min.css";

export default function ClinicLayout() {
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("user");
    navigate("/login");
  };

  const menuItems = [
    { to: "/clinic", icon: "📊", label: "Dashboard" },
    { to: "/clinic/doctors", icon: "👨‍⚕️", label: "Doctors" },
    { to: "/clinic/add-doctor", icon: "➕", label: "Add Doctor" },
    { to: "/clinic/appointments", icon: "📅", label: "Appointments" },
    { to: "/clinic/services", icon: "🏥", label: "Services" },
    { to: "/clinic/reports", icon: "📑", label: "Reports" },
    { to: "/clinic/invite-patient", icon: "📧", label: "Invite Patient" },
    { to: "/clinic/profile", icon: "⚙️", label: "Profile" },
  ];

  return (
    <div className="container-fluid p-0">
      <div className="row g-0">
        {/* Sidebar */}
        <div className="col-md-3 col-lg-2" style={{
          background: 'linear-gradient(180deg, #0d3e5c 0%, #062a3f 100%)',
          minHeight: '100vh',
          boxShadow: '2px 0 10px rgba(0,0,0,0.1)'
        }}>
          <div className="p-4">
            {/* User Profile */}
            <div className="text-center mb-4">
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: '#00a8cc',
                margin: '0 auto 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                color: 'white',
                boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
              }}>
                🏥
              </div>
              <h5 className="text-white mb-0">{user?.name}</h5>
              <p className="text-white-50 small">Clinic</p>
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
                    background: window.location.pathname === item.to ? 'rgba(0, 168, 204, 0.3)' : 'transparent'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 168, 204, 0.2)'}
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
                background: 'rgba(0, 168, 204, 0.2)',
                color: 'white',
                border: '2px solid rgba(0, 168, 204, 0.3)',
                borderRadius: '10px',
                padding: '12px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 168, 204, 0.3)';
                e.currentTarget.style.borderColor = 'rgba(0, 168, 204, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0, 168, 204, 0.2)';
                e.currentTarget.style.borderColor = 'rgba(0, 168, 204, 0.3)';
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