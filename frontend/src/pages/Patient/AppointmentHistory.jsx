import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import "bootstrap/dist/css/bootstrap.min.css";

export default function AppointmentHistory() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      
      const { data: patient } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!patient) {
        setAppointments([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          date,
          time,
          status,
          created_at,
          doctors (
            name,
            specialization
          ),
          services (
            name,
            price
          )
        `)
        .eq('patient_id', patient.id)
        .order('date', { ascending: false });

      if (error) throw error;

      const formattedAppointments = data?.map(apt => ({
        id: apt.id,
        date: apt.date,
        time: apt.time,
        status: apt.status,
        doctor: apt.doctors || { name: 'Unknown', specialization: 'General' },
        service: apt.services || { name: 'Consultation', price: 50 }
      })) || [];

      setAppointments(formattedAppointments);
    } catch (err) {
      console.error("Error in fetchAppointments:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'canceled': return 'danger';
      case 'completed': return 'info';
      default: return 'secondary';
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 style={{ color: '#2b6c9e' }}>📖 Appointment History</h2>
        <span className="badge bg-primary rounded-pill px-3 py-2">
          Total: {appointments.length}
        </span>
      </div>

      {appointments.length === 0 ? (
        <div className="card text-center py-5 border-0 shadow-sm">
          <div className="card-body">
            <div className="display-1 mb-3" style={{ color: '#2b6c9e' }}>📅</div>
            <h5 className="mb-3">No appointments yet</h5>
            <p className="text-muted mb-4">Book your first appointment to get started</p>
            <a href="/patient/book-appointment" className="btn btn-primary px-4 py-2">
              Book Now
            </a>
          </div>
        </div>
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="py-3">Time</th>
                    <th className="py-3">Doctor</th>
                    <th className="py-3">Service</th>
                    <th className="py-3">Price</th>
                    <th className="py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((apt) => (
                    <tr key={apt.id}>
                      <td className="px-4 py-3">
                        <div className="fw-bold">{formatDate(apt.date)}</div>
                      </td>
                      <td className="py-3">
                        <span className="badge bg-light text-dark">
                          {formatTime(apt.time)}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="d-flex align-items-center">
                          <span className="me-2 fs-5">👨‍⚕️</span>
                          <div>
                            <div className="fw-bold">Dr. {apt.doctor?.name}</div>
                            <small className="text-muted">{apt.doctor?.specialization}</small>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="fw-bold">{apt.service?.name}</div>
                      </td>
                      <td className="py-3">
                        <span className="fw-bold text-success">€{apt.service?.price}</span>
                      </td>
                      <td className="py-3">
                        <span className={`badge bg-${getStatusBadge(apt.status)} px-3 py-2`}>
                          {apt.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="bg-light p-4 border-top">
              <div className="row">
                <div className="col-md-4">
                  <small className="text-muted d-block">Total Appointments</small>
                  <h3 className="fw-bold mb-0">{appointments.length}</h3>
                </div>
                <div className="col-md-4">
                  <small className="text-muted d-block">Completed</small>
                  <h3 className="fw-bold text-success mb-0">
                    {appointments.filter(a => a.status === 'completed').length}
                  </h3>
                </div>
                <div className="col-md-4">
                  <small className="text-muted d-block">Total Spent</small>
                  <h3 className="fw-bold text-success mb-0">
                    €{appointments.reduce((sum, apt) => sum + (apt.service?.price || 0), 0)}
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}