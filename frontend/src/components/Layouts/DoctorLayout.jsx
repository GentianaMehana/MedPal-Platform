import React from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import "bootstrap/dist/css/bootstrap.min.css";

export default function DoctorLayout() {
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("user");
    navigate("/login");
  };

  const menuItems = [
    { to: "/doctor", icon: "📊", label: "Dashboard" },
    { to: "/doctor/appointments", icon: "📋", label: "Appointments" },
    { to: "/doctor/calendar", icon: "📅", label: "Calendar" },
    { to: "/doctor/add-report", icon: "🧾", label: "Visit Report" },
    { to: "/doctor/add-test-results", icon: "🧪", label: "Test Results" }, // E RE
    { to: "/doctor/reports", icon: "📑", label: "My Reports" },
    { to: "/doctor/profile", icon: "👤", label: "Profile" },
    { to: "/doctor/working-hours", icon: "🕒", label: "Working Hours" },
  ];

  return (
    <div className="container-fluid p-0">
      <div className="row g-0">
        {/* Sidebar */}
        <div className="col-md-3 col-lg-2" style={{
          background: 'linear-gradient(180deg, #1e4a6b 0%, #0d3e5c 100%)',
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
                background: '#47b5ff',
                margin: '0 auto 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                color: 'white',
                boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
              }}>
                👨‍⚕️
              </div>
              <h5 className="text-white mb-0">Dr. {user?.name}</h5>
              <p className="text-white-50 small">Doctor</p>
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
                    background: window.location.pathname === item.to ? 'rgba(71, 181, 255, 0.3)' : 'transparent'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(71, 181, 255, 0.2)'}
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
                background: 'rgba(71, 181, 255, 0.2)',
                color: 'white',
                border: '2px solid rgba(71, 181, 255, 0.3)',
                borderRadius: '10px',
                padding: '12px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(71, 181, 255, 0.3)';
                e.currentTarget.style.borderColor = 'rgba(71, 181, 255, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(71, 181, 255, 0.2)';
                e.currentTarget.style.borderColor = 'rgba(71, 181, 255, 0.3)';
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