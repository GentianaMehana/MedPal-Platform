import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/medical-theme.css";

const IconBell = (p) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
    <path d="M10 21a2 2 0 0 0 4 0"/>
  </svg>
);
const IconClock = (p) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>
  </svg>
);
const IconCheckCircle = (p) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/>
  </svg>
);
const IconCheck = (p) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M4 12l5 5L20 7"/>
  </svg>
);
const IconSpinner = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    style={{ animation: 'mp-spin 0.9s linear infinite' }}>
    <circle cx="12" cy="12" r="9" stroke={color} strokeOpacity="0.2" strokeWidth="2.5"/>
    <path d="M21 12a9 9 0 0 0-9-9" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

export default function PatientNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));

      const { data: patient } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!patient) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      const today = new Date().toISOString().split('T')[0];

      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
          id,
          date,
          time,
          status,
          created_at,
          doctors (name)
        `)
        .eq('patient_id', patient.id)
        .gte('date', today)
        .in('status', ['pending', 'approved'])
        .order('date', { ascending: true });

      if (error) throw error;

      const formattedNotifications = (appointments || []).map(apt => ({
        id: apt.id,
        type: apt.status === 'approved' ? 'success' : 'info',
        title: apt.status === 'approved' ? 'Appointment approved' : 'Pending approval',
        message: `Your appointment with Dr. ${apt.doctors?.name || 'Doctor'} on ${apt.date} at ${apt.time} is ${apt.status}.`,
        date: apt.created_at,
        read: false
      }));

      setNotifications(formattedNotifications);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const approvedCount = notifications.filter(n => n.type === 'success').length;

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
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
        <div>
          <p className="mp-overline mb-1">Patient</p>
          <h1 className="mp-h2 mb-1">Notifications</h1>
          <p className="mp-body" style={{ marginBottom: 0 }}>
            Updates about your upcoming appointments.
          </p>
        </div>
        {notifications.length > 0 && (
          <button
            className="medical-btn-outline"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            <IconCheck />
            Mark all as read {unreadCount > 0 && `(${unreadCount})`}
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
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
            <IconBell />
          </div>
          <h3 className="mp-h3 mb-1">No notifications</h3>
          <p className="mp-body mb-0">
            You are all caught up. Check back later.
          </p>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <div className="medical-card" style={{ padding: 20 }}>
                <p className="mp-overline" style={{ marginBottom: 6, fontSize: 10.5 }}>
                  Total
                </p>
                <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>
                  {notifications.length}
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="medical-card" style={{ padding: 20 }}>
                <p className="mp-overline" style={{ marginBottom: 6, fontSize: 10.5 }}>
                  Approved
                </p>
                <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--mp-success)' }}>
                  {approvedCount}
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="medical-card" style={{ padding: 20 }}>
                <p className="mp-overline" style={{ marginBottom: 6, fontSize: 10.5 }}>
                  Unread
                </p>
                <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--mp-warning)' }}>
                  {unreadCount}
                </div>
              </div>
            </div>
          </div>

          {/* List */}
          <div className="d-flex flex-column gap-3">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className="medical-card"
                style={{
                  padding: 20,
                  borderLeft: notif.read ? '1px solid var(--mp-border)' : '3px solid var(--mp-primary)',
                }}
              >
                <div className="d-flex justify-content-between align-items-start gap-3">
                  <div className="d-flex gap-3 flex-grow-1">
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: notif.type === 'success' ? 'var(--mp-success-bg)' : 'var(--mp-primary-light)',
                        color: notif.type === 'success' ? 'var(--mp-success)' : 'var(--mp-primary)',
                        border: `1px solid ${notif.type === 'success' ? 'var(--mp-success-bd)' : 'var(--mp-primary-border)'}`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {notif.type === 'success' ? <IconCheckCircle /> : <IconClock />}
                    </div>

                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                        <div
                          style={{
                            fontSize: 14.5,
                            fontWeight: 600,
                            color: 'var(--mp-text)',
                            letterSpacing: '-0.005em',
                          }}
                        >
                          {notif.title}
                        </div>
                        {!notif.read && (
                          <span className="mp-badge" style={{ fontSize: 11 }}>
                            New
                          </span>
                        )}
                      </div>

                      <p className="mp-body" style={{ fontSize: 13.5, marginBottom: 8 }}>
                        {notif.message}
                      </p>

                      <div style={{ fontSize: 12, color: 'var(--mp-text-muted)' }}>
                        {new Date(notif.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>

                  {!notif.read && (
                    <button
                      className="medical-btn-outline"
                      onClick={() => markAsRead(notif.id)}
                      style={{ padding: '6px 10px', fontSize: 12.5 }}
                    >
                      <IconCheck />
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <style>{`@keyframes mp-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}