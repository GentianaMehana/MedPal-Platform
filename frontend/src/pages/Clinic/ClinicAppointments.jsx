import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/medical-theme.css";

export default function ClinicAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [clinicId, setClinicId] = useState(null);
  const [filter, setFilter] = useState("all"); // all, today, week, month

  useEffect(() => {
    getClinicId();
  }, []);

  const getClinicId = async () => {
    try {
      const clinicUser = JSON.parse(localStorage.getItem("user"));
      
      const { data: clinicData, error: clinicError } = await supabase
        .from('clinics')
        .select('id')
        .eq('user_id', clinicUser.id)
        .maybeSingle();

      if (clinicError) throw clinicError;
      if (clinicData) {
        setClinicId(clinicData.id);
        fetchAppointments(clinicData.id);
      }
    } catch (err) {
      console.error("Error:", err);
      setLoading(false);
    }
  };

  const fetchAppointments = async (cId) => {
    try {
      let query = supabase
        .from('appointments')
        .select(`
          id,
          date,
          time,
          status,
          is_present,
          doctor_id,
          patient_id,
          doctors (
            id,
            name,
            user_id
          ),
          patients (
            id,
            name,
            email,
            phone
          )
        `)
        .eq('clinic_id', cId)
        .order('date', { ascending: false });

      // Aplikoni filter nëse ka
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextWeekStr = nextWeek.toISOString().split('T')[0];
      
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const nextMonthStr = nextMonth.toISOString().split('T')[0];

      if (filter === 'today') {
        query = query.eq('date', today);
      } else if (filter === 'week') {
        query = query.gte('date', today).lte('date', nextWeekStr);
      } else if (filter === 'month') {
        query = query.gte('date', today).lte('date', nextMonthStr);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      setAppointments(data || []);
    } catch (err) {
      console.error("Error fetching appointments:", err);
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
      if (clinicId) fetchAppointments(clinicId);
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
      if (clinicId) fetchAppointments(clinicId);
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const filteredAppointments = appointments.filter((a) => {
    const query = searchTerm.toLowerCase();
    return (
      a.patients?.name?.toLowerCase().includes(query) ||
      a.patients?.email?.toLowerCase().includes(query) ||
      a.doctors?.name?.toLowerCase().includes(query) ||
      a.date?.includes(query)
    );
  });

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending': return 'badge-pending';
      case 'approved': return 'badge-approved';
      case 'completed': return 'badge-approved';
      case 'canceled': return 'badge-canceled';
      default: return '';
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
        <h2 className="mb-2">📅 Clinic Appointments</h2>
        <p className="mb-0">Manage all appointments across your clinic</p>
      </div>

      <div className="row mb-4">
        <div className="col-md-6">
          <div className="medical-card">
            <input
              type="text"
              className="medical-input w-100"
              placeholder="🔍 Search by patient, doctor, date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="col-md-6">
          <div className="medical-card">
            <div className="d-flex gap-2">
              <button 
                className={`medical-btn-${filter === 'all' ? 'primary' : 'outline'} flex-grow-1`}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button 
                className={`medical-btn-${filter === 'today' ? 'primary' : 'outline'} flex-grow-1`}
                onClick={() => setFilter('today')}
              >
                Today
              </button>
              <button 
                className={`medical-btn-${filter === 'week' ? 'primary' : 'outline'} flex-grow-1`}
                onClick={() => setFilter('week')}
              >
                This Week
              </button>
              <button 
                className={`medical-btn-${filter === 'month' ? 'primary' : 'outline'} flex-grow-1`}
                onClick={() => setFilter('month')}
              >
                This Month
              </button>
            </div>
          </div>
        </div>
      </div>

      {filteredAppointments.length === 0 ? (
        <div className="medical-card text-center py-5">
          <div className="display-1 mb-3" style={{ color: 'var(--medical-primary)' }}>📅</div>
          <h5>No appointments found</h5>
        </div>
      ) : (
        <div className="medical-card">
          <div className="table-responsive">
            <table className="medical-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                  <th>Present</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <div className="fw-bold">{a.patients?.name}</div>
                      <small className="text-muted">{a.patients?.email}</small>
                      {a.patients?.phone && (
                        <div><small className="text-muted">{a.patients.phone}</small></div>
                      )}
                    </td>
                    <td>Dr. {a.doctors?.name}</td>
                    <td>
                      <div>{formatDate(a.date)}</div>
                      <small className="text-muted">{formatTime(a.time)}</small>
                    </td>
                    <td>
                      <span className={`medical-badge ${getStatusBadge(a.status)}`}>
                        {a.status}
                      </span>
                    </td>
                    <td>
                      {a.is_present ? (
                        <span className="badge bg-success">✅ Present</span>
                      ) : (
                        <span className="badge bg-secondary">❌ Not present</span>
                      )}
                    </td>
                    <td>
                      {a.status === 'pending' && (
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => updateStatus(a.id, 'approved')}
                            title="Approve"
                          >
                            ✓
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => updateStatus(a.id, 'canceled')}
                            title="Cancel"
                          >
                            ✗
                          </button>
                        </div>
                      )}
                      {a.status === 'approved' && !a.is_present && (
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => updatePresence(a.id, true)}
                        >
                          Mark Present
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}