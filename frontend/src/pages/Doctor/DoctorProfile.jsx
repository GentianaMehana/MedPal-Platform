import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/medical-theme.css";

export default function DoctorProfile() {
  const [user, setUser] = useState(null);
  const [doctorDetails, setDoctorDetails] = useState(null);
  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      if (!userData) return;
      
      setUser(userData);

      // Get doctor details
      const { data: doctorData, error: doctorError } = await supabase
        .from('doctors')
        .select('*')
        .eq('user_id', userData.id)
        .maybeSingle();

      if (doctorError) throw doctorError;
      
      setDoctorDetails(doctorData);

      // Get department if exists
      if (doctorData?.department_id) {
        const { data: deptData } = await supabase
          .from('departments')
          .select('name')
          .eq('id', doctorData.department_id)
          .maybeSingle();
        
        setDepartment(deptData);
      }

    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time) => {
    if (!time) return '-';
    return time;
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
        <h2 className="mb-2">👤 My Profile</h2>
        <p className="mb-0">View your professional information</p>
      </div>

      <div className="row">
        <div className="col-lg-8 mx-auto">
          <div className="medical-card">
            <div className="text-center mb-4">
              <div style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--medical-primary) 0%, var(--medical-primary-light) 100%)',
                margin: '0 auto 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.5rem',
                color: 'white',
                boxShadow: 'var(--shadow-md)'
              }}>
                👨‍⚕️
              </div>
              <h3 className="fw-bold mb-1">Dr. {user?.name}</h3>
              <p className="text-muted mb-2">{user?.email}</p>
              {doctorDetails?.doctor_code && (
                <span className="medical-badge" style={{
                  background: 'var(--medical-primary-soft)',
                  color: 'var(--medical-primary)'
                }}>
                  {doctorDetails.doctor_code}
                </span>
              )}
            </div>

            <hr style={{ borderColor: 'var(--medical-primary-soft)' }} />

            <div className="row g-4">
              <div className="col-md-6">
                <div className="p-3" style={{ background: 'var(--medical-light)', borderRadius: 'var(--border-radius-md)' }}>
                  <h6 className="medical-label mb-2">Department</h6>
                  <p className="mb-0 fs-5">{department?.name || 'Not assigned'}</p>
                </div>
              </div>

              <div className="col-md-6">
                <div className="p-3" style={{ background: 'var(--medical-light)', borderRadius: 'var(--border-radius-md)' }}>
                  <h6 className="medical-label mb-2">Specialization</h6>
                  <p className="mb-0 fs-5">{doctorDetails?.specialization || 'General Practitioner'}</p>
                </div>
              </div>

              <div className="col-md-6">
                <div className="p-3" style={{ background: 'var(--medical-light)', borderRadius: 'var(--border-radius-md)' }}>
                  <h6 className="medical-label mb-2">Consultation Fee</h6>
                  <p className="mb-0 fs-5 text-success">€{doctorDetails?.consultation_fee || 50}</p>
                </div>
              </div>

              <div className="col-md-6">
                <div className="p-3" style={{ background: 'var(--medical-light)', borderRadius: 'var(--border-radius-md)' }}>
                  <h6 className="medical-label mb-2">Phone</h6>
                  <p className="mb-0 fs-5">{doctorDetails?.phone || user?.phone || 'Not provided'}</p>
                </div>
              </div>
            </div>

            {doctorDetails?.languages_spoken && doctorDetails.languages_spoken.length > 0 && (
              <>
                <hr style={{ borderColor: 'var(--medical-primary-soft)' }} />
                <div className="mb-4">
                  <h6 className="medical-label mb-3">Languages Spoken</h6>
                  <div className="d-flex flex-wrap gap-2">
                    {doctorDetails.languages_spoken.map((lang, index) => (
                      <span key={index} className="badge" style={{
                        background: 'var(--medical-primary-soft)',
                        color: 'var(--medical-primary)',
                        padding: '0.5rem 1rem',
                        borderRadius: '50px'
                      }}>
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}

            {doctorDetails?.education && doctorDetails.education.length > 0 && (
              <>
                <hr style={{ borderColor: 'var(--medical-primary-soft)' }} />
                <div className="mb-4">
                  <h6 className="medical-label mb-3">Education</h6>
                  <div className="d-flex flex-wrap gap-2">
                    {doctorDetails.education.map((edu, index) => (
                      <span key={index} className="badge" style={{
                        background: 'var(--medical-primary-soft)',
                        color: 'var(--medical-primary)',
                        padding: '0.5rem 1rem',
                        borderRadius: '50px'
                      }}>
                        {edu}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}

            {doctorDetails?.working_hours && (
              <>
                <hr style={{ borderColor: 'var(--medical-primary-soft)' }} />
                <div>
                  <h6 className="medical-label mb-3">Working Hours</h6>
                  <div className="table-responsive">
                    <table className="table table-sm">
                      <thead style={{ background: 'var(--medical-primary-soft)' }}>
                        <tr>
                          <th className="p-2">Day</th>
                          <th className="p-2">Start</th>
                          <th className="p-2">End</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(doctorDetails.working_hours).map(([day, hours]) => (
                          <tr key={day}>
                            <td className="p-2 text-capitalize fw-bold">{day}</td>
                            <td className="p-2">{formatTime(hours.start)}</td>
                            <td className="p-2">{formatTime(hours.end)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}