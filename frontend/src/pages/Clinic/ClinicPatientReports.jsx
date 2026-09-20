import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/medical-theme.css";

/* ---------- Icons ---------- */
const IconSearch = (p) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/>
  </svg>
);
const IconX = (p) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M18 6L6 18M6 6l12 12"/>
  </svg>
);
const IconDownload = (p) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
  </svg>
);
const IconEye = (p) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);
const IconFileText = (p) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <path d="M14 2v6h6M9 13h6M9 17h6"/>
  </svg>
);
const IconFlask = (p) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M9 3h6v6l5 9a2 2 0 0 1-1.8 3H5.8A2 2 0 0 1 4 18l5-9V3z"/>
    <path d="M9 3v6M15 3v6M7 15h10"/>
  </svg>
);
const IconAlert = (p) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <path d="M12 9v4M12 17h.01"/>
  </svg>
);
const IconSpinner = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    style={{ animation: 'mp-spin 0.9s linear infinite' }}>
    <circle cx="12" cy="12" r="9" stroke={color} strokeOpacity="0.2" strokeWidth="2.5"/>
    <path d="M21 12a9 9 0 0 0-9-9" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

export default function ClinicPatientReports() {
  const [reports, setReports] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("visits");
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    doctorId: "",
    patientName: "",
  });

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (activeTab === "visits") {
      fetchReports();
    } else {
      fetchTestResults();
    }
  }, [activeTab, filters]);

  const fetchDoctors = async () => {
    try {
      const clinicUser = JSON.parse(localStorage.getItem("user"));

      const { data: clinicData } = await supabase
        .from('clinics')
        .select('id')
        .eq('user_id', clinicUser.id)
        .maybeSingle();

      if (!clinicData) return;

      const { data, error } = await supabase
        .from('doctors')
        .select(`id, user_id, name`)
        .eq('clinic_id', clinicData.id);

      if (error) throw error;

      setDoctors(data || []);
    } catch (err) {
      console.error("Error fetching doctors:", err);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const clinicUser = JSON.parse(localStorage.getItem("user"));

      const { data: clinicData } = await supabase
        .from('clinics')
        .select('id')
        .eq('user_id', clinicUser.id)
        .maybeSingle();

      if (!clinicData) {
        setLoading(false);
        return;
      }

      const { data: doctorsData } = await supabase
        .from('doctors')
        .select('id')
        .eq('clinic_id', clinicData.id);

      const doctorIds = doctorsData?.map(d => d.id) || [];

      if (doctorIds.length === 0) {
        setReports([]);
        setLoading(false);
        return;
      }

      let query = supabase
        .from('visit_reports')
        .select(`
          id,
          diagnosis,
          recommendation,
          created_at,
          doctors!inner (id, name),
          patients!inner (id, name, email),
          appointments (date, time)
        `)
        .in('doctor_id', doctorIds);

      if (filters.doctorId) query = query.eq('doctor_id', filters.doctorId);
      if (filters.patientName) query = query.ilike('patients.name', `%${filters.patientName}%`);
      if (filters.from) query = query.gte('created_at', filters.from);
      if (filters.to) query = query.lte('created_at', filters.to);

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      const formattedReports = data?.map(report => ({
        id: report.id,
        type: 'visit',
        diagnosis: report.diagnosis,
        recommendation: report.recommendation,
        date: report.created_at,
        doctor: report.doctors || { name: 'Unknown' },
        patient: report.patients || { name: 'Unknown', email: '' },
        appointment: report.appointments || { date: '', time: '' }
      })) || [];

      setReports(formattedReports);
    } catch (err) {
      console.error("Error fetching reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTestResults = async () => {
    setLoading(true);
    try {
      const clinicUser = JSON.parse(localStorage.getItem("user"));

      const { data: clinicData } = await supabase
        .from('clinics')
        .select('id')
        .eq('user_id', clinicUser.id)
        .maybeSingle();

      if (!clinicData) {
        setLoading(false);
        return;
      }

      const { data: doctorsData } = await supabase
        .from('doctors')
        .select('id')
        .eq('clinic_id', clinicData.id);

      const doctorIds = doctorsData?.map(d => d.id) || [];

      if (doctorIds.length === 0) {
        setTestResults([]);
        setLoading(false);
        return;
      }

      let query = supabase
        .from('test_results')
        .select(`
          id,
          test_name,
          test_date,
          result_data,
          file_url,
          file_name,
          notes,
          is_abnormal,
          created_at,
          doctors!inner (id, name),
          patients!inner (id, name, email)
        `)
        .in('doctor_id', doctorIds);

      if (filters.doctorId) query = query.eq('doctor_id', filters.doctorId);
      if (filters.patientName) query = query.ilike('patients.name', `%${filters.patientName}%`);
      if (filters.from) query = query.gte('test_date', filters.from);
      if (filters.to) query = query.lte('test_date', filters.to);

      const { data, error } = await query.order('test_date', { ascending: false });

      if (error) throw error;

      const formattedTests = data?.map(test => ({
        id: test.id,
        type: 'test',
        name: test.test_name,
        date: test.test_date || test.created_at,
        result_data: test.result_data,
        file_url: test.file_url,
        file_name: test.file_name,
        notes: test.notes,
        is_abnormal: test.is_abnormal,
        doctor: test.doctors || { name: 'Unknown' },
        patient: test.patients || { name: 'Unknown', email: '' }
      })) || [];

      setTestResults(formattedTests);
    } catch (err) {
      console.error("Error fetching test results:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    if (activeTab === "visits") {
      fetchReports();
    } else {
      fetchTestResults();
    }
  };

  const clearFilters = () => {
    setFilters({
      from: "",
      to: "",
      doctorId: "",
      patientName: "",
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (time) => {
    if (!time) return '';
    return time.substring(0, 5);
  };

  const downloadFile = (url, filename) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'download';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loading && reports.length === 0 && testResults.length === 0) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div style={{ color: 'var(--mp-primary)' }}>
          <IconSpinner />
        </div>
        <style>{`@keyframes mp-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const allItems = activeTab === "visits" ? reports : testResults;

  return (
    <div className="container-fluid px-4 py-4">
      {/* Page header */}
      <div className="mb-4">
        <p className="mp-overline mb-1">Clinic</p>
        <h1 className="mp-h2 mb-1">Patient medical records</h1>
        <p className="mp-body" style={{ marginBottom: 0 }}>
          View all patient reports and test results issued by your clinic.
        </p>
      </div>

      {/* Tabs */}
      <div
        className="d-inline-flex gap-1 mb-4"
        style={{
          background: 'var(--mp-bg-muted)',
          padding: 4,
          borderRadius: 'var(--mp-radius)',
        }}
      >
        {[
          { id: 'visits', label: `Visit reports (${reports.length})` },
          { id: 'tests',  label: `Test results (${testResults.length})` },
        ].map(t => {
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: '8px 16px',
                fontSize: 13.5,
                fontWeight: 500,
                letterSpacing: '-0.005em',
                border: 'none',
                borderRadius: 'var(--mp-radius-sm)',
                cursor: 'pointer',
                background: active ? 'var(--mp-bg)' : 'transparent',
                color: active ? 'var(--mp-text)' : 'var(--mp-text-secondary)',
                boxShadow: active ? 'var(--mp-shadow-xs)' : 'none',
                transition: 'background 120ms ease, color 120ms ease',
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="medical-card mb-4" style={{ padding: 20 }}>
        <form onSubmit={handleFilterSubmit}>
          <div className="row g-3 align-items-end">
            <div className="col-md-3">
              <label className="medical-label">Patient name</label>
              <input
                type="text"
                name="patientName"
                className="medical-input"
                placeholder="Search patient"
                value={filters.patientName}
                onChange={handleFilterChange}
              />
            </div>
            <div className="col-md-2">
              <label className="medical-label">From</label>
              <input
                type="date"
                name="from"
                className="medical-input"
                value={filters.from}
                onChange={handleFilterChange}
              />
            </div>
            <div className="col-md-2">
              <label className="medical-label">To</label>
              <input
                type="date"
                name="to"
                className="medical-input"
                value={filters.to}
                onChange={handleFilterChange}
              />
            </div>
            <div className="col-md-3">
              <label className="medical-label">Doctor</label>
              <select
                name="doctorId"
                className="medical-input"
                value={filters.doctorId}
                onChange={handleFilterChange}
              >
                <option value="">All doctors</option>
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>{doc.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <div className="d-flex gap-2">
                <button type="submit" className="medical-btn-primary flex-grow-1">
                  Filter
                </button>
                <button
                  type="button"
                  className="medical-btn-outline"
                  onClick={clearFilters}
                  title="Clear filters"
                  style={{ padding: '9px 12px' }}
                >
                  <IconX />
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Results */}
      {allItems.length === 0 ? (
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
            {activeTab === 'visits' ? <IconFileText /> : <IconFlask />}
          </div>
          <h3 className="mp-h3 mb-1">
            No {activeTab === 'visits' ? 'reports' : 'test results'} found
          </h3>
          <p className="mp-body mb-0">
            Adjust your filters or check back later.
          </p>
        </div>
      ) : (
        <div className="row g-3">
          {allItems.map((item) => (
            <div key={item.id} className="col-md-6">
              <div className="medical-card h-100" style={{ padding: 22 }}>
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <div
                      style={{
                        fontSize: 14.5,
                        fontWeight: 600,
                        color: 'var(--mp-text)',
                        letterSpacing: '-0.005em',
                        marginBottom: 2,
                      }}
                    >
                      {item.type === 'visit' ? `Dr. ${item.doctor?.name}` : item.doctor?.name}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--mp-text-muted)' }}>
                      {item.patient?.name}
                    </div>
                  </div>
                  <span className="mp-caption" style={{ fontSize: 12.5 }}>
                    {formatDate(item.date)}
                  </span>
                </div>

                {item.type === 'visit' ? (
                  <>
                    <div style={{ marginBottom: 10 }}>
                      <span className="mp-overline" style={{ fontSize: 11 }}>Diagnosis</span>
                      <div className="mp-body" style={{ fontSize: 14, color: 'var(--mp-text)' }}>
                        {item.diagnosis}
                      </div>
                    </div>

                    {item.recommendation && (
                      <div style={{ marginBottom: 10 }}>
                        <span className="mp-overline" style={{ fontSize: 11 }}>Recommendation</span>
                        <div className="mp-body" style={{ fontSize: 14, color: 'var(--mp-text)' }}>
                          {item.recommendation}
                        </div>
                      </div>
                    )}

                    {item.appointment?.date && (
                      <div className="mp-caption" style={{ fontSize: 12.5 }}>
                        Appointment on {item.appointment.date} at {formatTime(item.appointment.time)}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: 'var(--mp-text)',
                        marginBottom: 10,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {item.name}
                    </div>

                    {item.result_data && (
                      <div
                        style={{
                          padding: 12,
                          background: 'var(--mp-bg-muted)',
                          borderRadius: 'var(--mp-radius)',
                          marginBottom: 12,
                        }}
                      >
                        <div className="row g-2">
                          {item.result_data.value && (
                            <div className="col-6">
                              <div className="mp-overline" style={{ fontSize: 10.5 }}>Result</div>
                              <div
                                style={{
                                  fontSize: 15,
                                  fontWeight: 600,
                                  color: 'var(--mp-text)',
                                  letterSpacing: '-0.01em',
                                }}
                              >
                                {item.result_data.value}
                                {item.result_data.unit && (
                                  <span
                                    style={{
                                      fontSize: 12,
                                      fontWeight: 400,
                                      color: 'var(--mp-text-muted)',
                                      marginLeft: 4,
                                    }}
                                  >
                                    {item.result_data.unit}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                          {item.result_data.reference_range && (
                            <div className="col-6">
                              <div className="mp-overline" style={{ fontSize: 10.5 }}>Reference</div>
                              <div style={{ fontSize: 13.5, color: 'var(--mp-text-secondary)' }}>
                                {item.result_data.reference_range}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {item.notes && (
                      <div style={{ marginBottom: 10 }}>
                        <span className="mp-overline" style={{ fontSize: 11 }}>Notes</span>
                        <div className="mp-body" style={{ fontSize: 13, color: 'var(--mp-text-secondary)' }}>
                          {item.notes}
                        </div>
                      </div>
                    )}

                    {item.file_url && (
                      <div className="d-flex gap-2 mb-2">
                        <a
                          href={item.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="medical-btn-outline"
                          style={{ flex: 1, fontSize: 13, padding: '7px 12px' }}
                        >
                          <IconEye />
                          View file
                        </a>
                        <button
                          className="medical-btn-primary"
                          onClick={() => downloadFile(item.file_url, item.file_name)}
                          style={{ fontSize: 13, padding: '7px 12px' }}
                        >
                          <IconDownload />
                          Download
                        </button>
                      </div>
                    )}

                    {item.is_abnormal && (
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '3px 10px',
                          fontSize: 12,
                          fontWeight: 500,
                          borderRadius: 999,
                          background: 'var(--mp-danger-bg)',
                          color: 'var(--mp-danger)',
                          border: '1px solid var(--mp-danger-bd)',
                          marginTop: 4,
                        }}
                      >
                        <IconAlert />
                        Abnormal
                      </div>
                    )}
                  </>
                )}

                <div
                  className="d-flex justify-content-between align-items-center mt-3 pt-3"
                  style={{ borderTop: '1px solid var(--mp-border)' }}
                >
                  <span className="mp-caption" style={{ fontSize: 12.5 }}>
                    {item.patient?.email}
                  </span>
                  <span className="mp-badge mp-badge--neutral" style={{ fontSize: 11.5 }}>
                    {item.type === 'visit' ? 'Visit' : 'Test'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes mp-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}