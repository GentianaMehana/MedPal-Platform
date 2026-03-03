import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/medical-theme.css";

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

      // Get doctor's id
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

      // Get today's appointments
      const { count: todayCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', doctor.id)
        .eq('date', today);

      // Get pending appointments
      const { count: pendingCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', doctor.id)
        .eq('status', 'pending');

      // Get unique patients count
      const { data: patients } = await supabase
        .from('appointments')
        .select('patient_id')
        .eq('doctor_id', doctor.id);

      const uniquePatients = new Set(patients?.map(p => p.patient_id)).size;

      // Get recent tests count
      const { count: testsCount } = await supabase
        .from('test_results')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', doctor.id);

      // Get recent appointments
      const { data: recent } = await supabase
        .from('appointments')
        .select(`
          id,
          date,
          time,
          status,
          patients!inner (
            name
          )
        `)
        .eq('doctor_id', doctor.id)
        .order('date', { ascending: false })
        .limit(5);

      // Get recent tests
      const { data: tests } = await supabase
        .from('test_results')
        .select(`
          id,
          test_name,
          test_date,
          is_abnormal,
          patients!inner (
            name
          )
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
    { to: "/doctor/appointments", icon: "📋", title: "View Appointments", color: "var(--medical-primary)" },
    { to: "/doctor/add-report", icon: "🧾", title: "Create Report", color: "var(--medical-primary-light)" },
    { to: "/doctor/add-test-results", icon: "🧪", title: "Add Test Results", color: "var(--medical-accent)" },
    { to: "/doctor/calendar", icon: "📅", title: "Calendar", color: "var(--medical-secondary)" },
    { to: "/doctor/working-hours", icon: "🕒", title: "Set Hours", color: "var(--medical-warning)" },
  ];

  const getStatusBadge = (status) => {
    switch(status) {
      case 'approved': return 'badge-approved';
      case 'pending': return 'badge-pending';
      case 'canceled': return 'badge-canceled';
      default: return '';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (time) => {
    return time?.substring(0, 5) || '';
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="medical-spinner mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-4 py-4">
      <div className="medical-header mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2 className="mb-2">Welcome back, Dr. {user?.name}! 👨‍⚕️</h2>
            <p className="mb-0">Here's your practice overview</p>
          </div>
          <button className="medical-btn-outline" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="row g-4 mb-5">
        <div className="col-md-3">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="stat-label">Today's Appointments</div>
                <div className="stat-value">{stats.todayAppointments}</div>
              </div>
              <div className="display-6" style={{ color: 'var(--medical-primary)' }}>📅</div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="stat-label">Pending Approvals</div>
                <div className="stat-value">{stats.pendingAppointments}</div>
              </div>
              <div className="display-6" style={{ color: 'var(--medical-primary-light)' }}>⏳</div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="stat-label">Total Patients</div>
                <div className="stat-value">{stats.totalPatients}</div>
              </div>
              <div className="display-6" style={{ color: 'var(--medical-accent)' }}>👥</div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="stat-label">Test Results</div>
                <div className="stat-value">{stats.recentTests}</div>
              </div>
              <div className="display-6" style={{ color: 'var(--medical-warning)' }}>🧪</div>
            </div>
          </div>
        </div>
      </div>

      <h4 className="medical-label mb-3">🚀 Quick Actions</h4>
      <div className="row g-4 mb-5">
        {quickActions.map((action, index) => (
          <div key={index} className="col-md-6 col-lg-3">
            <Link to={action.to} className="text-decoration-none">
              <div className="medical-card h-100">
                <div className="text-center">
                  <div style={{
                    fontSize: '3rem',
                    marginBottom: '1rem',
                    color: action.color
                  }}>
                    {action.icon}
                  </div>
                  <h5 className="fw-bold mb-0" style={{ color: action.color }}>
                    {action.title}
                  </h5>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      <div className="row">
        <div className="col-md-6">
          <h4 className="medical-label mb-3">📋 Recent Appointments</h4>
          <div className="medical-card">
            {recentAppointments.length === 0 ? (
              <p className="text-muted text-center py-3">No recent appointments</p>
            ) : (
              <div className="table-responsive">
                <table className="medical-table">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAppointments.map((apt) => (
                      <tr key={apt.id}>
                        <td>
                          <div className="fw-bold">{apt.patient?.name}</div>
                        </td>
                        <td>{formatDate(apt.date)}</td>
                        <td>{formatTime(apt.time)}</td>
                        <td>
                          <span className={`medical-badge ${getStatusBadge(apt.status)}`}>
                            {apt.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="col-md-6">
          <h4 className="medical-label mb-3">🧪 Recent Test Results</h4>
          <div className="medical-card">
            {recentTests.length === 0 ? (
              <p className="text-muted text-center py-3">No test results added</p>
            ) : (
              <div className="table-responsive">
                <table className="medical-table">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Test</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTests.map((test) => (
                      <tr key={test.id}>
                        <td>
                          <div className="fw-bold">{test.patient?.name}</div>
                        </td>
                        <td>{test.name}</td>
                        <td>{formatDate(test.date)}</td>
                        <td>
                          {test.is_abnormal ? (
                            <span className="badge bg-danger">Abnormal</span>
                          ) : (
                            <span className="badge bg-success">Normal</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}