import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/medical-theme.css";

export default function ClinicPatientReports() {
  const [reports, setReports] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("visits"); // visits, tests
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
        .select(`
          id,
          user_id,
          name
        `)
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
          doctors!inner (
            id,
            name
          ),
          patients!inner (
            id,
            name,
            email
          ),
          appointments (
            date,
            time
          )
        `)
        .in('doctor_id', doctorIds);

      if (filters.doctorId) {
        query = query.eq('doctor_id', filters.doctorId);
      }

      if (filters.patientName) {
        query = query.ilike('patients.name', `%${filters.patientName}%`);
      }

      if (filters.from) {
        query = query.gte('created_at', filters.from);
      }

      if (filters.to) {
        query = query.lte('created_at', filters.to);
      }

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
          doctors!inner (
            id,
            name
          ),
          patients!inner (
            id,
            name,
            email
          )
        `)
        .in('doctor_id', doctorIds);

      if (filters.doctorId) {
        query = query.eq('doctor_id', filters.doctorId);
      }

      if (filters.patientName) {
        query = query.ilike('patients.name', `%${filters.patientName}%`);
      }

      if (filters.from) {
        query = query.gte('test_date', filters.from);
      }

      if (filters.to) {
        query = query.lte('test_date', filters.to);
      }

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
      <div className="text-center py-5">
        <div className="medical-spinner mx-auto"></div>
      </div>
    );
  }

  const allItems = activeTab === "visits" ? reports : testResults;

  return (
    <div className="container-fluid px-4 py-4">
      <div className="medical-header mb-4">
        <h2 className="mb-2">📊 Patient Medical Records</h2>
        <p className="mb-0">View all patient reports and test results from your clinic</p>
      </div>

      {/* Tabs */}
      <div className="medical-card mb-4">
        <div className="d-flex gap-2">
          <button
            className={`medical-btn-${activeTab === 'visits' ? 'primary' : 'outline'} flex-grow-1`}
            onClick={() => setActiveTab('visits')}
          >
            Visit Reports ({reports.length})
          </button>
          <button
            className={`medical-btn-${activeTab === 'tests' ? 'primary' : 'outline'} flex-grow-1`}
            onClick={() => setActiveTab('tests')}
          >
            Test Results ({testResults.length})
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="medical-card mb-4">
        <form onSubmit={handleFilterSubmit}>
          <div className="row g-3">
            <div className="col-md-3">
              <label className="medical-label">Patient Name</label>
              <input
                type="text"
                name="patientName"
                className="medical-input w-100"
                placeholder="Search by patient..."
                value={filters.patientName}
                onChange={handleFilterChange}
              />
            </div>
            <div className="col-md-2">
              <label className="medical-label">From Date</label>
              <input
                type="date"
                name="from"
                className="medical-input w-100"
                value={filters.from}
                onChange={handleFilterChange}
              />
            </div>
            <div className="col-md-2">
              <label className="medical-label">To Date</label>
              <input
                type="date"
                name="to"
                className="medical-input w-100"
                value={filters.to}
                onChange={handleFilterChange}
              />
            </div>
            <div className="col-md-3">
              <label className="medical-label">Doctor</label>
              <select
                name="doctorId"
                className="medical-input w-100"
                value={filters.doctorId}
                onChange={handleFilterChange}
              >
                <option value="">All Doctors</option>
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>{doc.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2 d-flex align-items-end gap-2">
              <button type="submit" className="medical-btn-primary flex-grow-1">
                Filter
              </button>
              <button 
                type="button" 
                className="medical-btn-outline"
                onClick={clearFilters}
                title="Clear filters"
              >
                ✕
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Results */}
      {allItems.length === 0 ? (
        <div className="medical-card text-center py-5">
          <div className="display-1 mb-3" style={{ color: 'var(--medical-primary)' }}>
            {activeTab === 'visits' ? '📑' : '🧪'}
          </div>
          <h5>No {activeTab === 'visits' ? 'reports' : 'test results'} found</h5>
        </div>
      ) : (
        <div className="row g-4">
          {allItems.map((item) => (
            <div key={item.id} className="col-md-6">
              <div className="medical-card">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <h6 className="fw-bold mb-1">
                      {item.type === 'visit' ? 'Dr. ' + item.doctor?.name : item.doctor?.name}
                    </h6>
                    <small className="text-muted">{item.patient?.name}</small>
                  </div>
                  <small className="text-muted">
                    {formatDate(item.date)}
                  </small>
                </div>

                {item.type === 'visit' ? (
                  // Visit Report
                  <>
                    <p className="mb-2">
                      <strong>Diagnosis:</strong> {item.diagnosis}
                    </p>
                    {item.recommendation && (
                      <p className="mb-2">
                        <strong>Recommendation:</strong> {item.recommendation}
                      </p>
                    )}
                    {item.appointment?.date && (
                      <p className="mb-2 small text-muted">
                        <strong>Appointment:</strong> {item.appointment.date} at {formatTime(item.appointment.time)}
                      </p>
                    )}
                  </>
                ) : (
                  // Test Result
                  <>
                    <h5 className="mb-2" style={{ color: 'var(--medical-primary)' }}>
                      {item.name}
                    </h5>
                    
                    {item.result_data && (
                      <div className="mb-3 p-3 bg-light rounded-4">
                        <div className="row">
                          {item.result_data.value && (
                            <div className="col-6">
                              <small className="text-muted d-block">Result</small>
                              <span className="fw-bold fs-5">{item.result_data.value}</span>
                              {item.result_data.unit && (
                                <span className="text-muted ms-1">{item.result_data.unit}</span>
                              )}
                            </div>
                          )}
                          {item.result_data.reference_range && (
                            <div className="col-6">
                              <small className="text-muted d-block">Reference Range</small>
                              <span>{item.result_data.reference_range}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {item.notes && (
                      <p className="mb-2">
                        <small className="text-muted">
                          <strong>Notes:</strong> {item.notes}
                        </small>
                      </p>
                    )}

                    {item.file_url && (
                      <div className="d-flex gap-2 mt-2">
                        <a
                          href={item.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="medical-btn-outline btn-sm flex-grow-1"
                        >
                          👁️ View File
                        </a>
                        <button
                          className="medical-btn-primary btn-sm"
                          onClick={() => downloadFile(item.file_url, item.file_name)}
                        >
                          ⬇️ Download
                        </button>
                      </div>
                    )}

                    {item.is_abnormal && (
                      <div className="mt-2">
                        <span className="badge bg-danger">⚠️ Abnormal</span>
                      </div>
                    )}
                  </>
                )}

                <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
                  <small className="text-muted">
                    {item.patient?.email}
                  </small>
                  <span className="medical-badge" style={{ background: 'var(--medical-primary-soft)', color: 'var(--medical-primary)' }}>
                    {item.type === 'visit' ? 'Visit' : 'Test'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}