// frontend/src/pages/Clinic/ClinicDashboard.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import "bootstrap/dist/css/bootstrap.min.css";

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

      // Get clinic_id from clinics table
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

      // Get doctors count
      const { count: doctorsCount } = await supabase
        .from('doctors')
        .select('*', { count: 'exact', head: true })
        .eq('clinic_id', clinicId);

      // Get patients count (patients registered by this clinic)
      const { count: patientsCount } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .eq('registered_by_clinic_id', clinicUser.id);

      // Get appointments count
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

  const cards = [
    { to: "/clinic/doctors", icon: "👨‍⚕️", title: "Doctors List", desc: "View all clinic doctors" },
    { to: "/clinic/add-doctor", icon: "➕", title: "Add Doctor", desc: "Register a new doctor" },
    { to: "/clinic/calendar", icon: "📅", title: "Calendar", desc: "View clinic appointments" },
    { to: "/clinic/appointments", icon: "📆", title: "Appointments", desc: "Manage all appointments" },
    { to: "/clinic/services", icon: "🏥", title: "Services", desc: "Manage departments & services" },
    { to: "/clinic/set-working-hours", icon: "🕒", title: "Working Hours", desc: "Set doctor schedules" },
    { to: "/clinic/reports", icon: "📑", title: "Reports", desc: "View patient reports" },
    { to: "/clinic/invite-patient", icon: "📧", title: "Invite Patient", desc: "Send invitation to patient" },
    { to: "/clinic/profile", icon: "⚙️", title: "Profile", desc: "Update clinic information" },
  ];

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
            <h2 className="mb-2">Welcome, {user?.name} Clinic! 🏥</h2>
            <p className="mb-0">Manage your clinic operations</p>
          </div>
          <button className="medical-btn-outline" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="row g-4 mb-5">
        <div className="col-md-4">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="stat-label">Doctors</div>
                <div className="stat-value">{stats.doctors}</div>
              </div>
              <div className="display-6" style={{ color: '#2b6c9e' }}>👨‍⚕️</div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="stat-label">Patients</div>
                <div className="stat-value">{stats.patients}</div>
              </div>
              <div className="display-6" style={{ color: '#4a8fc1' }}>🧑‍🤝‍🧑</div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="stat-card">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="stat-label">Appointments</div>
                <div className="stat-value">{stats.appointments}</div>
              </div>
              <div className="display-6" style={{ color: '#00a8cc' }}>📅</div>
            </div>
          </div>
        </div>
      </div>

      <h4 className="medical-label mb-3">🚀 Quick Actions</h4>
      <div className="row g-4">
        {cards.map((card, index) => (
          <div key={index} className="col-md-6 col-lg-4">
            <Link to={card.to} className="text-decoration-none">
              <div className="medical-card h-100">
                <div className="text-center">
                  <div style={{ fontSize: '3rem', marginBottom: '1rem', color: '#2b6c9e' }}>
                    {card.icon}
                  </div>
                  <h5 className="fw-bold mb-2" style={{ color: '#2b6c9e' }}>{card.title}</h5>
                  <p className="text-muted small mb-0">{card.desc}</p>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}