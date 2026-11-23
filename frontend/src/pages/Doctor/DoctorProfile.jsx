import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/medical-theme.css";

const IconSpinner = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    style={{ animation: 'mp-spin 0.9s linear infinite' }}>
    <circle cx="12" cy="12" r="9" stroke={color} strokeOpacity="0.2" strokeWidth="2.5"/>
    <path d="M21 12a9 9 0 0 0-9-9" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

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

      const { data: doctorData, error: doctorError } = await supabase
        .from('doctors')
        .select('*')
        .eq('user_id', userData.id)
        .maybeSingle();

      if (doctorError) throw doctorError;

      setDoctorDetails(doctorData);

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
    if (!time) return '—';
    return time;
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

  const DetailBox = ({ label, value, accent }) => (
    <div
      style={{
        padding: 18,
        background: 'var(--mp-bg-subtle)',
        border: '1px solid var(--mp-border)',
        borderRadius: 'var(--mp-radius)',
      }}
    >
      <div className="mp-overline" style={{ fontSize: 10.5, marginBottom: 6 }}>
        {label}
      </div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 500,
          color: accent || 'var(--mp-text)',
          letterSpacing: '-0.01em',
          lineHeight: 1.35,
        }}
      >
        {value}
      </div>
    </div>
  );

  return (
    <div className="container-fluid px-4 py-4" style={{ maxWidth: 900 }}>
      {/* Page header */}
      <div className="mb-4">
        <p className="mp-overline mb-1">Doctor</p>
        <h1 className="mp-h2 mb-1">My profile</h1>
        <p className="mp-body" style={{ marginBottom: 0 }}>
          Your professional information as seen by your clinic.
        </p>
      </div>

      <div className="medical-card mb-4" style={{ padding: 32 }}>
        {/* Avatar + identity */}
        <div className="text-center mb-4">
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: 20,
              background: 'var(--mp-primary)',
              color: '#fff',
              margin: '0 auto 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              fontWeight: 700,
              letterSpacing: '-0.03em',
              boxShadow: '0 1px 3px rgba(10,15,26,0.12)',
            }}
          >
            {user?.name?.charAt(0)?.toUpperCase() || 'D'}
          </div>
          <h2 className="mp-h2 mb-1" style={{ fontSize: 22 }}>
            Dr. {user?.name}
          </h2>
          <p className="mp-caption mb-3">{user?.email}</p>
          {doctorDetails?.doctor_code && (
            <span
              className="mp-badge"
              style={{
                fontFamily: 'var(--mp-font-mono)',
                fontSize: 12,
                padding: '5px 12px',
              }}
            >
              {doctorDetails.doctor_code}
            </span>
          )}
        </div>

        <hr className="mp-divider" />

        {/* Detail grid */}
        <div className="row g-3">
          <div className="col-md-6">
            <DetailBox
              label="Department"
              value={department?.name || 'Not assigned'}
            />
          </div>
          <div className="col-md-6">
            <DetailBox
              label="Specialization"
              value={doctorDetails?.specialization || 'General practitioner'}
            />
          </div>
          <div className="col-md-6">
            <DetailBox
              label="Consultation fee"
              value={`€${doctorDetails?.consultation_fee || 50}`}
              accent="var(--mp-success)"
            />
          </div>
          <div className="col-md-6">
            <DetailBox
              label="Phone"
              value={doctorDetails?.phone || user?.phone || 'Not provided'}
            />
          </div>
        </div>

        {/* Languages */}
        {doctorDetails?.languages_spoken && doctorDetails.languages_spoken.length > 0 && (
          <>
            <hr className="mp-divider" />
            <div>
              <p className="mp-overline mb-3">Languages spoken</p>
              <div className="d-flex flex-wrap gap-2">
                {doctorDetails.languages_spoken.map((lang, index) => (
                  <span key={index} className="mp-badge">{lang}</span>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Education */}
        {doctorDetails?.education && doctorDetails.education.length > 0 && (
          <>
            <hr className="mp-divider" />
            <div>
              <p className="mp-overline mb-3">Education</p>
              <div className="d-flex flex-wrap gap-2">
                {doctorDetails.education.map((edu, index) => (
                  <span key={index} className="mp-badge mp-badge--neutral">{edu}</span>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Working hours */}
        {doctorDetails?.working_hours && (
          <>
            <hr className="mp-divider" />
            <div>
              <p className="mp-overline mb-3">Working hours</p>
              <div className="row g-2">
                {Object.entries(doctorDetails.working_hours).map(([day, hours]) => (
                  <div className="col-6 col-md-4" key={day}>
                    <div
                      style={{
                        padding: '10px 14px',
                        background: 'var(--mp-bg-subtle)',
                        border: '1px solid var(--mp-border)',
                        borderRadius: 'var(--mp-radius-sm)',
                      }}
                    >
                      <div
                        className="mp-overline"
                        style={{ fontSize: 10.5, marginBottom: 4, textTransform: 'capitalize' }}
                      >
                        {day}
                      </div>
                      <div style={{ fontSize: 13.5, color: 'var(--mp-text)' }}>
                        {formatTime(hours.start)} – {formatTime(hours.end)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`@keyframes mp-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}