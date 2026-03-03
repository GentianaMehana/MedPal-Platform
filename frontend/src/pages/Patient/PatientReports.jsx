import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/medical-theme.css";

export default function PatientReports() {
  const [reports, setReports] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("reports"); // reports, tests

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      
      // Get patient id
      const { data: patient } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!patient) {
        setLoading(false);
        return;
      }

      // Fetch visit reports
      const { data: reportsData, error: reportsError } = await supabase
        .from('visit_reports')
        .select(`
          id,
          diagnosis,
          recommendation,
          temperature,
          blood_pressure,
          symptoms,
          created_at,
          doctor_id,
          appointment_id,
          doctors (
            name
          ),
          appointments (
            date,
            time
          )
        `)
        .eq('patient_id', patient.id)
        .order('created_at', { ascending: false });

      if (reportsError) throw reportsError;
      setReports(reportsData || []);

      // Fetch test results
      const { data: testsData, error: testsError } = await supabase
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
          doctors (
            name
          )
        `)
        .eq('patient_id', patient.id)
        .order('test_date', { ascending: false });

      if (testsError) throw testsError;
      setTestResults(testsData || []);

    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
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
        <h2 className="mb-2">📋 My Medical Records</h2>
        <p className="mb-0">View all your medical reports and test results</p>
      </div>

      {/* Tabs */}
      <div className="medical-card mb-4">
        <div className="d-flex gap-2">
          <button
            className={`medical-btn-${activeTab === 'reports' ? 'primary' : 'outline'} flex-grow-1`}
            onClick={() => setActiveTab('reports')}
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

      {activeTab === 'reports' && (
        <>
          {reports.length === 0 ? (
            <div className="medical-card text-center py-5">
              <div className="display-1 mb-3" style={{ color: 'var(--medical-primary)' }}>📋</div>
              <h5>No medical reports yet</h5>
              <p className="text-muted">Your reports will appear here after your appointments</p>
            </div>
          ) : (
            <div className="row g-4">
              {reports.map((report) => (
                <div key={report.id} className="col-md-6">
                  <div className="medical-card">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <h6 className="fw-bold mb-1">Dr. {report.doctors?.name}</h6>
                        <small className="text-muted">
                          {report.appointments?.date} at {formatTime(report.appointments?.time)}
                        </small>
                      </div>
                      <span className="medical-badge" style={{ background: 'var(--medical-primary-soft)', color: 'var(--medical-primary)' }}>
                        {formatDate(report.created_at)}
                      </span>
                    </div>

                    <div className="mb-3">
                      <p className="mb-2">
                        <strong>Diagnosis:</strong> {report.diagnosis}
                      </p>
                      {report.symptoms && (
                        <p className="mb-2">
                          <strong>Symptoms:</strong> {report.symptoms}
                        </p>
                      )}
                      {report.recommendation && (
                        <p className="mb-2">
                          <strong>Recommendation:</strong> {report.recommendation}
                        </p>
                      )}
                    </div>

                    {(report.temperature || report.blood_pressure) && (
                      <div className="d-flex gap-3 mt-3 pt-2 border-top" style={{ borderColor: 'var(--medical-primary-soft)' }}>
                        {report.temperature && (
                          <span>🌡️ <strong>{report.temperature}°C</strong></span>
                        )}
                        {report.blood_pressure && (
                          <span>🩺 <strong>{report.blood_pressure}</strong></span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'tests' && (
        <>
          {testResults.length === 0 ? (
            <div className="medical-card text-center py-5">
              <div className="display-1 mb-3" style={{ color: 'var(--medical-primary)' }}>🧪</div>
              <h5>No test results yet</h5>
              <p className="text-muted">Your test results will appear here</p>
            </div>
          ) : (
            <div className="row g-4">
              {testResults.map((test) => (
                <div key={test.id} className="col-md-6">
                  <div className={`medical-card ${test.is_abnormal ? 'border-danger' : ''}`}>
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <h6 className="fw-bold mb-1">{test.test_name}</h6>
                        <small className="text-muted">Dr. {test.doctors?.name}</small>
                      </div>
                      <span className={`medical-badge ${test.is_abnormal ? 'badge-canceled' : 'badge-approved'}`}>
                        {formatDate(test.test_date)}
                      </span>
                    </div>

                    {test.result_data && (
                      <div className="mb-3 p-3 bg-light rounded-4">
                        <div className="row">
                          {test.result_data.value && (
                            <div className="col-6">
                              <small className="text-muted d-block">Result</small>
                              <span className="fw-bold fs-5">{test.result_data.value}</span>
                              {test.result_data.unit && (
                                <span className="text-muted ms-1">{test.result_data.unit}</span>
                              )}
                            </div>
                          )}
                          {test.result_data.reference_range && (
                            <div className="col-6">
                              <small className="text-muted d-block">Reference Range</small>
                              <span>{test.result_data.reference_range}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {test.notes && (
                      <p className="mb-3">
                        <small className="text-muted">
                          <strong>Notes:</strong> {test.notes}
                        </small>
                      </p>
                    )}

                    {test.file_url && (
                      <div className="d-flex gap-2 mt-3">
                        <a
                          href={test.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="medical-btn-outline btn-sm flex-grow-1"
                        >
                          👁️ View File
                        </a>
                        <button
                          className="medical-btn-primary btn-sm"
                          onClick={() => downloadFile(test.file_url, test.file_name)}
                        >
                          ⬇️ Download
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}