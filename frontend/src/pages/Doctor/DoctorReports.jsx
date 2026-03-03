import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/medical-theme.css";

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
          patients (
            name,
            email
          ),
          appointments (
            date,
            time
          )
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
      <div className="text-center py-5">
        <div className="medical-spinner mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-4 py-4">
      <div className="medical-header mb-4">
        <h2 className="mb-2">📑 My Created Reports</h2>
        <p className="mb-0">View all medical reports you've created</p>
      </div>

      {reports.length === 0 ? (
        <div className="medical-card text-center py-5">
          <div className="display-1 mb-3" style={{ color: 'var(--medical-primary)' }}>📑</div>
          <h5>No reports yet</h5>
          <p className="text-muted">You haven't created any medical reports</p>
        </div>
      ) : (
        <div className="row g-4">
          {reports.map((report) => (
            <div key={report.id} className="col-md-6">
              <div className="medical-card">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <h6 className="fw-bold mb-1">{report.patient?.name}</h6>
                    <small className="text-muted">{report.patient?.email}</small>
                  </div>
                  <small className="text-muted">
                    {formatDate(report.created_at)}
                  </small>
                </div>

                {report.appointment?.date && (
                  <p className="mb-2 small text-muted">
                    <strong>Appointment:</strong> {report.appointment.date} at {formatTime(report.appointment.time)}
                  </p>
                )}

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
    </div>
  );
}