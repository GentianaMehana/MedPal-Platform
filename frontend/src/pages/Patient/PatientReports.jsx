import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/medical-theme.css";

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
const IconThermometer = (p) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>
  </svg>
);
const IconActivity = (p) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
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

export default function PatientReports() {
  const [reports, setReports] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("reports");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));

      const { data: patient } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!patient) {
        setLoading(false);
        return;
      }

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
          doctors (name),
          appointments (date, time)
        `)
        .eq('patient_id', patient.id)
        .order('created_at', { ascending: false });

      if (reportsError) throw reportsError;
      setReports(reportsData || []);

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
          doctors (name)
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
      <div className="d-flex justify-content-center py-5">
        <div style={{ color: 'var(--mp-primary)' }}>
          <IconSpinner />
        </div>
        <style>{`@keyframes mp-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const allItems = activeTab === 'reports' ? reports : testResults;

  return (
    <div className="container-fluid px-4 py-4">
      {/* Page header */}
      <div className="mb-4">
        <p className="mp-overline mb-1">Patient</p>
        <h1 className="mp-h2 mb-1">Medical records</h1>
        <p className="mp-body" style={{ marginBottom: 0 }}>
          View your medical reports and test results.
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
          { id: 'reports', label: `Visit reports (${reports.length})` },
          { id: 'tests',   label: `Test results (${testResults.length})` },
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
            {activeTab === 'reports' ? <IconFileText /> : <IconFlask />}
          </div>
          <h3 className="mp-h3 mb-1">
            No {activeTab === 'reports' ? 'medical reports' : 'test results'} yet
          </h3>
          <p className="mp-body mb-0">
            They will appear here after your appointments.
          </p>
        </div>
      ) : activeTab === 'reports' ? (
        <div className="row g-3">
          {reports.map((report) => (
            <div key={report.id} className="col-md-6">
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
                      Dr. {report.doctors?.name}
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--mp-text-muted)' }}>
                      {report.appointments?.date} at {formatTime(report.appointments?.time)}
                    </div>
                  </div>
                  <span className="mp-caption" style={{ fontSize: 12.5 }}>
                    {formatDate(report.created_at)}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <div className="mp-overline" style={{ fontSize: 10.5, marginBottom: 4 }}>
                      Diagnosis
                    </div>
                    <div style={{ fontSize: 13.5, color: 'var(--mp-text)' }}>
                      {report.diagnosis}
                    </div>
                  </div>

                  {report.symptoms && (
                    <div>
                      <div className="mp-overline" style={{ fontSize: 10.5, marginBottom: 4 }}>
                        Symptoms
                      </div>
                      <div style={{ fontSize: 13.5, color: 'var(--mp-text-secondary)' }}>
                        {report.symptoms}
                      </div>
                    </div>
                  )}

                  {report.recommendation && (
                    <div>
                      <div className="mp-overline" style={{ fontSize: 10.5, marginBottom: 4 }}>
                        Recommendation
                      </div>
                      <div style={{ fontSize: 13.5, color: 'var(--mp-text-secondary)' }}>
                        {report.recommendation}
                      </div>
                    </div>
                  )}
                </div>

                {(report.temperature || report.blood_pressure) && (
                  <div
                    className="d-flex gap-4"
                    style={{
                      paddingTop: 14,
                      marginTop: 14,
                      borderTop: '1px solid var(--mp-border)',
                    }}
                  >
                    {report.temperature && (
                      <div className="d-flex align-items-center gap-2">
                        <span style={{ color: 'var(--mp-text-muted)', display: 'inline-flex' }}>
                          <IconThermometer />
                        </span>
                        <span style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--mp-text)' }}>
                          {report.temperature}°C
                        </span>
                      </div>
                    )}
                    {report.blood_pressure && (
                      <div className="d-flex align-items-center gap-2">
                        <span style={{ color: 'var(--mp-text-muted)', display: 'inline-flex' }}>
                          <IconActivity />
                        </span>
                        <span style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--mp-text)' }}>
                          {report.blood_pressure}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="row g-3">
          {testResults.map((test) => (
            <div key={test.id} className="col-md-6">
              <div
                className="medical-card h-100"
                style={{
                  padding: 22,
                  borderColor: test.is_abnormal ? 'var(--mp-danger-bd)' : undefined,
                }}
              >
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
                      {test.test_name}
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--mp-text-muted)' }}>
                      Dr. {test.doctors?.name}
                    </div>
                  </div>
                  <span className="mp-caption" style={{ fontSize: 12.5 }}>
                    {formatDate(test.test_date)}
                  </span>
                </div>

                {test.result_data && (
                  <div
                    style={{
                      padding: 12,
                      background: 'var(--mp-bg-muted)',
                      borderRadius: 'var(--mp-radius)',
                      marginBottom: 12,
                    }}
                  >
                    <div className="row g-2">
                      {test.result_data.value && (
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
                            {test.result_data.value}
                            {test.result_data.unit && (
                              <span
                                style={{
                                  fontSize: 12,
                                  fontWeight: 400,
                                  color: 'var(--mp-text-muted)',
                                  marginLeft: 4,
                                }}
                              >
                                {test.result_data.unit}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      {test.result_data.reference_range && (
                        <div className="col-6">
                          <div className="mp-overline" style={{ fontSize: 10.5 }}>Reference</div>
                          <div style={{ fontSize: 13.5, color: 'var(--mp-text-secondary)' }}>
                            {test.result_data.reference_range}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {test.notes && (
                  <div style={{ marginBottom: 12 }}>
                    <div className="mp-overline" style={{ fontSize: 10.5, marginBottom: 4 }}>
                      Notes
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--mp-text-secondary)' }}>
                      {test.notes}
                    </div>
                  </div>
                )}

                {test.file_url && (
                  <div className="d-flex gap-2 mb-2">
                    <a
                      href={test.file_url}
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
                      onClick={() => downloadFile(test.file_url, test.file_name)}
                      style={{ fontSize: 13, padding: '7px 12px' }}
                    >
                      <IconDownload />
                      Download
                    </button>
                  </div>
                )}

                {test.is_abnormal && (
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
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes mp-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}