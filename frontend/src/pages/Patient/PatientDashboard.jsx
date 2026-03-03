import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import "bootstrap/dist/css/bootstrap.min.css";

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

      // Get patient id
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
      
      // Get upcoming appointments
      const { data: upcoming, error: upcomingError } = await supabase
        .from('appointments')
        .select(`
          id,
          date,
          time,
          status,
          doctor_id,
          doctors (
            name
          )
        `)
        .eq('patient_id', patient.id)
        .gte('date', today)
        .in('status', ['pending', 'approved'])
        .order('date', { ascending: true })
        .limit(3);

      if (upcomingError) throw upcomingError;
      setUpcomingAppointments(upcoming || []);

      // Get appointment stats
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
    { to: "/patient/book-appointment", icon: "📅", title: "Book Appointment", desc: "Schedule a visit with your doctor", color: "#2b6c9e" },
    { to: "/patient/profile", icon: "👤", title: "My Profile", desc: "Update your personal information", color: "#4a8fc1" },
    { to: "/patient/history", icon: "📖", title: "Medical History", desc: "View your past appointments", color: "#00a8cc" },
    { to: "/patient/reports", icon: "📋", title: "Reports", desc: "Access your medical reports", color: "#47b5ff" },
  ];

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeStr) => {
    return timeStr.substring(0, 5);
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-success" role="status"></div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-4">
      <div className="medical-header mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2 className="mb-2">Welcome back, {user?.name}! 👋</h2>
            <p className="mb-0">Here's your health overview</p>
          </div>
          <button className="medical-btn-outline" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="row g-4 mb-5">
        <div className="col-md-4">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="stat-label">Total Appointments</div>
                <div className="stat-value">{stats.totalAppointments}</div>
              </div>
              <div className="display-6" style={{ color: '#2b6c9e' }}>📊</div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="stat-label">Completed</div>
                <div className="stat-value">{stats.completedAppointments}</div>
              </div>
              <div className="display-6" style={{ color: '#28a745' }}>✅</div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="stat-label">Pending</div>
                <div className="stat-value">{stats.pendingAppointments}</div>
              </div>
              <div className="display-6" style={{ color: '#ffc107' }}>⏳</div>
            </div>
          </div>
        </div>
      </div>

      {upcomingAppointments.length > 0 ? (
        <div className="mb-5">
          <h4 className="medical-label mb-3">📅 Upcoming Appointments</h4>
          <div className="row g-4">
            {upcomingAppointments.map((apt) => (
              <div key={apt.id} className="col-md-4">
                <div className="medical-card">
                  <div className="d-flex align-items-center mb-3">
                    <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      background: '#e3f2fd',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      marginRight: '1rem',
                      color: '#2b6c9e'
                    }}>
                      👨‍⚕️
                    </div>
                    <div>
                      <h6 className="mb-0">Dr. {apt.doctors?.name || 'Doctor'}</h6>
                      <small className="text-muted">
                        {formatDate(apt.date)} at {formatTime(apt.time)}
                      </small>
                    </div>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className={`badge px-3 py-2 ${
                      apt.status === 'approved' ? 'bg-success' : 
                      apt.status === 'pending' ? 'bg-warning text-dark' : 
                      'bg-secondary'
                    }`}>
                      {apt.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="alert alert-info mb-5">
          <i className="bi bi-info-circle me-2"></i>
          No upcoming appointments. <Link to="/patient/book-appointment">Book one now!</Link>
        </div>
      )}

      <h4 className="medical-label mb-3">🚀 Quick Actions</h4>
      <div className="row g-4">
        {quickActions.map((action, index) => (
          <div key={index} className="col-md-6 col-lg-3">
            <Link to={action.to} className="text-decoration-none">
              <div className="medical-card h-100">
                <div className="text-center">
                  <div style={{ fontSize: '3rem', marginBottom: '1rem', color: action.color }}>
                    {action.icon}
                  </div>
                  <h5 className="fw-bold mb-2" style={{ color: action.color }}>
                    {action.title}
                  </h5>
                  <p className="text-muted small mb-0">{action.desc}</p>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}