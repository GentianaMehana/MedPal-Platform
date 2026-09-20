import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/medical-theme.css";

const IconBuilding = (p) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M15 21V9h3a2 2 0 0 1 2 2v10"/>
    <path d="M9 7h2M9 11h2M9 15h2"/>
  </svg>
);
const IconPlus = (p) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M12 5v14M5 12h14"/>
  </svg>
);
const IconTrash = (p) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
  </svg>
);
const IconAlert = (p) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
  </svg>
);
const IconCheck = (p) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/>
  </svg>
);
const IconSpinner = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    style={{ animation: 'mp-spin 0.9s linear infinite' }}>
    <circle cx="12" cy="12" r="9" stroke={color} strokeOpacity="0.25" strokeWidth="2.5"/>
    <path d="M21 12a9 9 0 0 0-9-9" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

export default function ClinicAddDepartment() {
  const [name, setName] = useState("");
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const clinicUser = JSON.parse(localStorage.getItem("user"));

      const { data: clinicData, error: clinicError } = await supabase
        .from('clinics')
        .select('id')
        .eq('user_id', clinicUser.id)
        .maybeSingle();

      if (clinicError) throw clinicError;
      if (!clinicData) return;

      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('clinic_id', clinicData.id)
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

    if (!name.trim()) {
      setMessage({ text: "Please enter department name", type: "warning" });
      setLoading(false);
      return;
    }

    try {
      const clinicUser = JSON.parse(localStorage.getItem("user"));

      const { data: clinicData, error: clinicError } = await supabase
        .from('clinics')
        .select('id')
        .eq('user_id', clinicUser.id)
        .maybeSingle();

      if (clinicError) throw clinicError;
      if (!clinicData) throw new Error("Clinic not found");

      const { error } = await supabase
        .from('departments')
        .insert([{
          name: name.trim(),
          clinic_id: clinicData.id,
        }]);

      if (error) throw error;

      setMessage({ text: "Department added successfully.", type: "success" });
      setName("");
      fetchDepartments();
    } catch (err) {
      setMessage({ text: err.message, type: "danger" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this department?")) return;

    try {
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMessage({ text: "Department deleted.", type: "success" });
      fetchDepartments();
    } catch (err) {
      setMessage({ text: err.message, type: "danger" });
    }
  };

  const alertClass =
    message.type === 'success' ? 'medical-alert-success' :
    message.type === 'warning' ? 'medical-alert-warning' :
    message.type === 'danger'  ? 'medical-alert-danger'  : '';

  const alertIcon =
    message.type === 'success' ? <IconCheck /> :
    message.type === 'warning' ? <IconAlert /> :
    message.type === 'danger'  ? <IconAlert /> : null;

  return (
    <div className="container-fluid px-4 py-4">
      {/* Page header */}
      <div className="mb-4">
        <p className="mp-overline mb-1">Clinic setup</p>
        <h1 className="mp-h2 mb-1">Departments</h1>
        <p className="mp-body" style={{ marginBottom: 0 }}>
          Create and manage departments for your clinic.
        </p>
      </div>

      {message.text && (
        <div className={`medical-alert ${alertClass} mb-4`}>
          {alertIcon && <span className="medical-alert__icon">{alertIcon}</span>}
          <div>{message.text}</div>
        </div>
      )}

      <div className="row g-4">
        {/* Add form */}
        <div className="col-lg-5">
          <div className="medical-card" style={{ padding: 26 }}>
            <p className="mp-overline mb-3">New department</p>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="medical-label">
                  Department name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="medical-input"
                  placeholder="e.g. Cardiology"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                />
                <span className="medical-hint">
                  Choose a clear name that matches your service offering.
                </span>
              </div>

              <button
                type="submit"
                className="medical-btn-primary w-100"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <IconSpinner size={16} color="#fff" />
                    Adding…
                  </>
                ) : (
                  <>
                    <IconPlus />
                    Add department
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Existing list */}
        <div className="col-lg-7">
          <div className="medical-card" style={{ padding: 26 }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <p className="mp-overline" style={{ marginBottom: 0 }}>
                Existing departments
              </p>
              <span className="mp-badge mp-badge--neutral">
                {departments.length}
              </span>
            </div>

            {departments.length === 0 ? (
              <div
                className="text-center py-4"
                style={{ color: 'var(--mp-text-muted)' }}
              >
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: 'var(--mp-bg-muted)',
                    color: 'var(--mp-text-muted)',
                    marginBottom: 12,
                  }}
                >
                  <IconBuilding />
                </div>
                <p className="mp-body mb-0" style={{ fontSize: 14 }}>
                  No departments yet.
                </p>
              </div>
            ) : (
              <ul className="list-unstyled mb-0">
                {departments.map((dep, i) => (
                  <li
                    key={dep.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      padding: '12px 0',
                      borderTop: i === 0 ? 'none' : '1px solid var(--mp-border)',
                    }}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: 'var(--mp-primary-light)',
                          color: 'var(--mp-primary)',
                          border: '1px solid var(--mp-primary-border)',
                          flexShrink: 0,
                        }}
                      >
                        <IconBuilding />
                      </div>
                      <span
                        style={{
                          fontSize: 14.5,
                          fontWeight: 500,
                          color: 'var(--mp-text)',
                        }}
                      >
                        {dep.name}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="medical-btn-ghost"
                      onClick={() => handleDelete(dep.id)}
                      style={{ color: 'var(--mp-danger)', padding: '6px 10px' }}
                    >
                      <IconTrash />
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <style>{`@keyframes mp-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}