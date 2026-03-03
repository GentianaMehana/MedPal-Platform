import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/medical-theme.css";

export default function DoctorAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [doctorId, setDoctorId] = useState(null);

  useEffect(() => {
    getDoctorId();
  }, []);

  const getDoctorId = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      console.log("Current doctor user:", user);
      
      // Get doctor's id from doctors table using user_id
      const { data: doctor, error: doctorError } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (doctorError) throw doctorError;
      
      if (doctor) {
        console.log("Doctor found with id:", doctor.id);
        setDoctorId(doctor.id);
        fetchAppointments(doctor.id);
      } else {
        console.log("Doctor not found for user_id:", user.id);
        setLoading(false);
      }
    } catch (err) {
      console.error("Error getting doctor id:", err);
      setLoading(false);
    }
  };

  const fetchAppointments = async (docId) => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          date,
          time,
          status,
          is_present,
          patient_id,
          patients (
            name,
            email,
            phone
          )
        `)
        .eq('doctor_id', docId)  // Përdor doctor.id
        .neq('status', 'canceled')
        .order('date', { ascending: true });

      if (error) throw error;
      
      console.log("Appointments found:", data);
      
      const formattedAppointments = data?.map(apt => ({
        id: apt.id,
        date: apt.date,
        time: apt.time,
        status: apt.status,
        is_present: apt.is_present || false,
        patient: apt.patients || { name: 'Unknown', email: '', phone: null }
      })) || [];
      
      setAppointments(formattedAppointments);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      if (doctorId) fetchAppointments(doctorId);
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const updatePresence = async (id, isPresent) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ is_present: isPresent })
        .eq('id', id);

      if (error) throw error;
      if (doctorId) fetchAppointments(doctorId);
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (time) => {
    return time.substring(0, 5);
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending': return 'badge-pending';
      case 'approved': return 'badge-approved';
      case 'completed': return 'badge-approved';
      case 'canceled': return 'badge-canceled';
      default: return '';
    }
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
        <h2 className="mb-2">📋 My Appointments</h2>
        <p className="mb-0">Manage your scheduled appointments</p>
      </div>

      {appointments.length === 0 ? (
        <div className="medical-card text-center py-5">
          <div className="display-1 mb-3" style={{ color: 'var(--medical-primary)' }}>📅</div>
          <h5>No appointments scheduled</h5>
          <p className="text-muted">Your appointments will appear here</p>
        </div>
      ) : (
        <div className="row g-4">
          {appointments.map((apt) => (
            <div key={apt.id} className="col-md-6 col-lg-4">
              <div className="medical-card h-100">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <h5 className="fw-bold mb-1">{apt.patient?.name}</h5>
                    <small className="text-muted">{apt.patient?.email}</small>
                    {apt.patient?.phone && (
                      <div><small className="text-muted">{apt.patient.phone}</small></div>
                    )}
                  </div>
                  <span className={`medical-badge ${getStatusBadge(apt.status)}`}>
                    {apt.status}
                  </span>
                </div>

                <div className="mb-3">
                  <p className="mb-1">
                    <strong>Date:</strong> {formatDate(apt.date)} at {formatTime(apt.time)}
                  </p>
                </div>

                <div className="d-flex gap-2">
                  <button
                    className={`btn btn-sm flex-grow-1 ${
                      apt.is_present ? 'btn-success' : 'btn-outline-secondary'
                    }`}
                    onClick={() => updatePresence(apt.id, !apt.is_present)}
                    style={{
                      borderRadius: 'var(--border-radius-md)',
                      padding: '0.5rem'
                    }}
                  >
                    {apt.is_present ? '✅ Present' : '⭕ Mark Present'}
                  </button>

                  {apt.status === 'pending' && (
                    <>
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => updateStatus(apt.id, 'approved')}
                        style={{ borderRadius: 'var(--border-radius-md)', padding: '0.5rem 1rem' }}
                      >
                        ✓
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => updateStatus(apt.id, 'canceled')}
                        style={{ borderRadius: 'var(--border-radius-md)', padding: '0.5rem 1rem' }}
                      >
                        ✗
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}