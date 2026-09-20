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
const IconSpinner = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    style={{ animation: 'mp-spin 0.9s linear infinite' }}>
    <circle cx="12" cy="12" r="9" stroke={color} strokeOpacity="0.2" strokeWidth="2.5"/>
    <path d="M21 12a9 9 0 0 0-9-9" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

export default function DoctorReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [doctorId, setDoctorId] = useState(null);

  useEffect(() => {
    getDoctorId();
  }, []);

  const getDoctorId = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));

      const { data: doctor, error: doctorError } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (doctorError) throw doctorError;

      if (doctor) {
        setDoctorId(doctor.id);
        fetchReports(doctor.id);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error("Error getting doctor id:", err);
      setLoading(false);
    }
  };

  const fetchReports = async (docId) => {
    try {
      const { data, error } = await supabase
        .from('visit_reports')
        .select(`
          id,
          diagnosis,
          recommendation,
          temperature,
          blood_pressure,
          symptoms,
          created_at,
          patients (name, email),
          appointments (date, time)
        `)
        .eq('doctor_id', docId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedReports = data?.map(report => ({
        id: report.id,
        diagnosis: report.diagnosis,
        recommendation: report.recommendation,
        temperature: report.temperature,
        blood_pressure: report.blood_pressure,
        symptoms: report.symptoms,
        created_at: report.created_at,
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
        <p className="mp-overline mb-1">Doctor</p>
        <h1 className="mp-h2 mb-1">My reports</h1>
        <p className="mp-body" style={{ marginBottom: 0 }}>
          All medical reports you have created.
        </p>
      </div>

      {reports.length === 0 ? (
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
            <IconFileText />
          </div>
          <h3 className="mp-h3 mb-1">No reports yet</h3>
          <p className="mp-body mb-0">
            Reports you create will appear here.
          </p>
        </div>
      ) : (
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
                        letterSpacing: '-0.01em',
                        marginBottom: 2,
                      }}
                    >
                      {report.patient?.name}
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--mp-text-muted)' }}>
                      {report.patient?.email}
                    </div>
                  </div>
                  <span className="mp-caption" style={{ fontSize: 12.5 }}>
                    {formatDate(report.created_at)}
                  </span>
                </div>

                {report.appointment?.date && (
                  <div
                    style={{
                      fontSize: 12.5,
                      color: 'var(--mp-text-muted)',
                      marginBottom: 14,
                    }}
                  >
                    Appointment · {report.appointment.date} at {formatTime(report.appointment.time)}
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    marginBottom: 14,
                  }}
                >
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
                      paddingTop: 12,
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
      )}

      <style>{`@keyframes mp-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}