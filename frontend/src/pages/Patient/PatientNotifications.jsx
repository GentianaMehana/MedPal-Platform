import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/medical-theme.css";

export default function PatientNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      
      // Get patient id
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
          doctors (
            name
          )
        `)
        .eq('patient_id', patient.id)
        .gte('date', today)
        .in('status', ['pending', 'approved'])
        .order('date', { ascending: true });

      if (error) throw error;

      const formattedNotifications = (appointments || []).map(apt => ({
        id: apt.id,
        type: apt.status === 'approved' ? 'success' : 'info',
        title: apt.status === 'approved' ? 'Appointment Approved' : 'Pending Approval',
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

  const getIcon = (type, isRead) => {
    if (isRead) {
      switch(type) {
        case 'success': return '✓';
        case 'info': return '⏳';
        default: return '📋';
      }
    } else {
      switch(type) {
        case 'success': return '✅';
        case 'info': return '⏳';
        default: return '📋';
      }
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="medical-spinner mx-auto"></div>
        <p className="medical-label mt-3">Loading notifications...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid px-4 py-4">
      <div className="medical-header mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2 className="mb-2">🔔 Notifications</h2>
            <p className="mb-0">Stay updated with your appointments</p>
          </div>
          {notifications.length > 0 && (
            <button 
              className="medical-btn-outline"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
            >
              Mark all as read {unreadCount > 0 && `(${unreadCount})`}
            </button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="medical-card text-center py-5">
          <div className="display-1 mb-3" style={{ color: 'var(--primary)' }}>🔔</div>
          <h5 className="fw-bold mb-2">No notifications</h5>
          <p className="text-muted">You're all caught up! Check back later for updates.</p>
        </div>
      ) : (
        <div className="row g-4">
          {notifications.map((notif) => (
            <div key={notif.id} className="col-12">
              <div 
                className={`medical-card ${!notif.read ? 'border-primary' : ''}`}
                style={{ 
                  borderLeft: !notif.read ? '4px solid var(--primary)' : '4px solid transparent',
                  transition: 'all 0.3s ease'
                }}
              >
                <div className="d-flex justify-content-between align-items-start">
                  <div className="d-flex gap-3">
                    <div 
                      className="rounded-circle d-flex align-items-center justify-content-center"
                      style={{
                        width: '50px',
                        height: '50px',
                        background: notif.type === 'success' ? '#d4edda' : 'var(--primary-soft)',
                        color: notif.type === 'success' ? '#155724' : 'var(--primary)',
                        fontSize: '1.5rem'
                      }}
                    >
                      {getIcon(notif.type, notif.read)}
                    </div>
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <h6 className="fw-bold mb-0" style={{ color: 'var(--primary)' }}>
                          {notif.title}
                        </h6>
                        {!notif.read && (
                          <span className="medical-badge" style={{ background: 'var(--primary)', color: 'white' }}>
                            New
                          </span>
                        )}
                      </div>
                      <p className="mb-2">{notif.message}</p>
                      <div className="d-flex align-items-center gap-3">
                        <small className="text-muted">
                          <i className="bi bi-clock me-1"></i>
                          {new Date(notif.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </small>
                        <small className={`medical-badge badge-${notif.type === 'success' ? 'approved' : 'pending'}`}>
                          {notif.type === 'success' ? 'Approved' : 'Pending'}
                        </small>
                      </div>
                    </div>
                  </div>
                  {!notif.read && (
                    <button
                      className="medical-btn-outline btn-sm"
                      onClick={() => markAsRead(notif.id)}
                      style={{ padding: '0.5rem 1rem' }}
                    >
                      ✓ Mark read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Summary Card */}
          <div className="col-12">
            <div className="medical-card bg-light">
              <div className="row g-4">
                <div className="col-md-4">
                  <div className="text-center">
                    <div className="stat-value" style={{ color: 'var(--primary)' }}>
                      {notifications.length}
                    </div>
                    <div className="stat-label">Total</div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="text-center">
                    <div className="stat-value" style={{ color: 'var(--success)' }}>
                      {notifications.filter(n => n.type === 'success').length}
                    </div>
                    <div className="stat-label">Approved</div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="text-center">
                    <div className="stat-value" style={{ color: 'var(--warning)' }}>
                      {unreadCount}
                    </div>
                    <div className="stat-label">Unread</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}