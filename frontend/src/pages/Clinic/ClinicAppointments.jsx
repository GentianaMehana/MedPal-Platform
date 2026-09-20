import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/medical-theme.css";

const IconSearch = (p) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/>
  </svg>
);
const IconCheck = (p) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M4 12l5 5L20 7"/>
  </svg>
);
const IconX = (p) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M18 6L6 18M6 6l12 12"/>
  </svg>
);
const IconCalendar = (p) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2"/>
    <path d="M3 10h18M8 3v4M16 3v4"/>
  </svg>
);
const IconSpinner = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    style={{ animation: 'mp-spin 0.9s linear infinite' }}>
    <circle cx="12" cy="12" r="9" stroke={color} strokeOpacity="0.2" strokeWidth="2.5"/>
    <path d="M21 12a9 9 0 0 0-9-9" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

export default function ClinicAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [clinicId, setClinicId] = useState(null);
  const [filter, setFilter] = useState("all");

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

  /* Status pill — using theme tokens */
  const statusStyles = {
    pending:   { bg: 'var(--mp-warning-bg)',  color: 'var(--mp-warning)',  border: 'var(--mp-warning-bd)' },
    approved:  { bg: 'var(--mp-success-bg)',  color: 'var(--mp-success)',  border: 'var(--mp-success-bd)' },
    completed: { bg: 'var(--mp-success-bg)',  color: 'var(--mp-success)',  border: 'var(--mp-success-bd)' },
    canceled:  { bg: 'var(--mp-danger-bg)',   color: 'var(--mp-danger)',   border: 'var(--mp-danger-bd)' },
  };

  const StatusPill = ({ status }) => {
    const s = statusStyles[status] || statusStyles.pending;
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '3px 10px',
          fontSize: 12,
          fontWeight: 500,
          textTransform: 'capitalize',
          letterSpacing: '-0.005em',
          borderRadius: 999,
          background: s.bg,
          color: s.color,
          border: `1px solid ${s.border}`,
        }}
      >
        {status}
      </span>
    );
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

  const FILTERS = [
    { id: 'all',   label: 'All' },
    { id: 'today', label: 'Today' },
    { id: 'week',  label: 'This week' },
    { id: 'month', label: 'This month' },
  ];

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div style={{ color: 'var(--mp-primary)' }}>
          <IconSpinner />
        </div>
        <style>{`@keyframes mp-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="container-fluid px-4 py-4">
      {/* Page header */}
      <div className="mb-4">
        <p className="mp-overline mb-1">Clinic</p>
        <h1 className="mp-h2 mb-1">Appointments</h1>
        <p className="mp-body" style={{ marginBottom: 0 }}>
          Manage all appointments across your clinic.
        </p>
      </div>

      {/* Toolbar */}
      <div className="row g-3 mb-4">
        <div className="col-md-5">
          <div
            className="d-flex align-items-center gap-2"
            style={{
              background: 'var(--mp-bg)',
              border: '1px solid var(--mp-border-strong)',
              borderRadius: 'var(--mp-radius)',
              padding: '9px 12px',
            }}
          >
            <span style={{ color: 'var(--mp-text-muted)', display: 'inline-flex' }}>
              <IconSearch />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by patient, doctor, or date…"
              style={{
                border: 'none',
                outline: 'none',
                flex: 1,
                fontSize: 14.5,
                background: 'transparent',
                color: 'var(--mp-text)',
              }}
            />
          </div>
        </div>

        <div className="col-md-7">
          <div className="d-flex gap-2 flex-wrap">
            {FILTERS.map((f) => {
              const active = filter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  className={active ? 'medical-btn-primary' : 'medical-btn-outline'}
                  onClick={() => {
                    setFilter(f.id);
                    if (clinicId) {
                      // Refetch with new filter
                      setTimeout(() => fetchAppointments(clinicId), 0);
                    }
                  }}
                  style={{ padding: '8px 14px', fontSize: 13.5 }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Table / Empty */}
      {filteredAppointments.length === 0 ? (
        <div className="medical-card text-center py-5">
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              borderRadius: 14,
              background: 'var(--mp-bg-muted)',
              color: 'var(--mp-text-muted)',
              marginBottom: 16,
            }}
          >
            <IconCalendar />
          </div>
          <h3 className="mp-h3 mb-1">No appointments found</h3>
          <p className="mp-body mb-0">
            Adjust the filters or check back later.
          </p>
        </div>
      ) : (
        <div className="medical-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: 'var(--mp-bg-subtle)' }}>
                  {['Patient', 'Doctor', 'Date & time', 'Status', 'Attendance', 'Actions'].map(h => (
                    <th
                      key={h}
                      style={{
                        textAlign: 'left',
                        padding: '12px 20px',
                        fontSize: 12,
                        fontWeight: 600,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        color: 'var(--mp-text-muted)',
                        borderBottom: '1px solid var(--mp-border)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((a) => (
                  <tr key={a.id} style={{ borderBottom: '1px solid var(--mp-border)' }}>
                    <td style={{ padding: '14px 20px', verticalAlign: 'top' }}>
                      <div style={{ fontWeight: 600, color: 'var(--mp-text)' }}>
                        {a.patients?.name}
                      </div>
                      <div style={{ fontSize: 12.5, color: 'var(--mp-text-muted)' }}>
                        {a.patients?.email}
                      </div>
                      {a.patients?.phone && (
                        <div style={{ fontSize: 12.5, color: 'var(--mp-text-muted)' }}>
                          {a.patients.phone}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '14px 20px', verticalAlign: 'top' }}>
                      <span style={{ color: 'var(--mp-text-secondary)' }}>
                        Dr. {a.doctors?.name}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', verticalAlign: 'top' }}>
                      <div style={{ color: 'var(--mp-text)' }}>{formatDate(a.date)}</div>
                      <div style={{ fontSize: 12.5, color: 'var(--mp-text-muted)' }}>
                        {formatTime(a.time)}
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px', verticalAlign: 'top' }}>
                      <StatusPill status={a.status} />
                    </td>
                    <td style={{ padding: '14px 20px', verticalAlign: 'top' }}>
                      {a.is_present ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: 13,
                            color: 'var(--mp-success)',
                            fontWeight: 500,
                          }}
                        >
                          <IconCheck />
                          Present
                        </span>
                      ) : (
                        <span style={{ fontSize: 13, color: 'var(--mp-text-muted)' }}>
                          Not marked
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px 20px', verticalAlign: 'top' }}>
                      {a.status === 'pending' && (
                        <div className="d-flex gap-2">
                          <button
                            type="button"
                            className="medical-btn-primary"
                            onClick={() => updateStatus(a.id, 'approved')}
                            style={{ padding: '6px 10px', fontSize: 12.5 }}
                            title="Approve"
                          >
                            <IconCheck />
                            Approve
                          </button>
                          <button
                            type="button"
                            className="medical-btn-outline"
                            onClick={() => updateStatus(a.id, 'canceled')}
                            style={{ padding: '6px 10px', fontSize: 12.5, color: 'var(--mp-danger)' }}
                            title="Cancel"
                          >
                            <IconX />
                          </button>
                        </div>
                      )}
                      {a.status === 'approved' && !a.is_present && (
                        <button
                          type="button"
                          className="medical-btn-outline"
                          onClick={() => updatePresence(a.id, true)}
                          style={{ padding: '6px 10px', fontSize: 12.5 }}
                        >
                          Mark present
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

      <style>{`@keyframes mp-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}