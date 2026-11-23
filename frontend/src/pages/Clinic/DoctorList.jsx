import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/medical-theme.css";

const IconStethoscope = (p) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M4 3v6a4 4 0 0 0 8 0V3"/><path d="M2 3h4M10 3h4"/>
    <path d="M12 13v3a5 5 0 0 0 10 0v-2"/><circle cx="22" cy="11" r="2"/>
  </svg>
);
const IconEdit = (p) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IconTrash = (p) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
  </svg>
);
const IconCheck = (p) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M4 12l5 5L20 7"/>
  </svg>
);
const IconX = (p) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M18 6L6 18M6 6l12 12"/>
  </svg>
);
const IconAlert = (p) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
  </svg>
);
const IconSpinner = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    style={{ animation: 'mp-spin 0.9s linear infinite' }}>
    <circle cx="12" cy="12" r="9" stroke={color} strokeOpacity="0.2" strokeWidth="2.5"/>
    <path d="M21 12a9 9 0 0 0-9-9" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

export default function DoctorList() {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [editedDepartment, setEditedDepartment] = useState("");

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setError(null);
      const clinicUser = JSON.parse(localStorage.getItem("user"));
      console.log("Clinic user from localStorage:", clinicUser);

      if (!clinicUser || !clinicUser.id) {
        setError("No clinic user found");
        setLoading(false);
        return;
      }

      const { data: clinicData, error: clinicError } = await supabase
        .from('clinics')
        .select('id')
        .eq('user_id', clinicUser.id)
        .maybeSingle();

      if (clinicError) throw clinicError;
      if (!clinicData) {
        setError("Clinic not found");
        setLoading(false);
        return;
      }

      const clinicId = clinicData.id;
      console.log("Using clinic_id:", clinicId);

      const { data: depts, error: deptsError } = await supabase
        .from('departments')
        .select('*')
        .eq('clinic_id', clinicId);

      if (deptsError) throw deptsError;
      setDepartments(depts || []);

      const { data: docs, error: docsError } = await supabase
        .from('doctors')
        .select('*')
        .eq('clinic_id', clinicId);

      if (docsError) throw docsError;

      setDoctors(docs || []);

    } catch (err) {
      console.error("Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (doctorId) => {
    if (!window.confirm("Are you sure you want to delete this doctor?")) return;

    try {
      const { error } = await supabase
        .from('doctors')
        .delete()
        .eq('id', doctorId);

      if (error) throw error;

      fetchAllData();
    } catch (err) {
      console.error("Error deleting doctor:", err);
      alert("Error deleting doctor: " + err.message);
    }
  };

  const handleEdit = (doctor) => {
    setEditingDoctor(doctor.id);
    setEditedDepartment(doctor.department_id || "");
  };

  const handleSave = async (doctorId) => {
    try {
      const { error: deptError } = await supabase
        .from('doctors')
        .update({ department_id: editedDepartment || null })
        .eq('id', doctorId);

      if (deptError) throw deptError;

      setEditingDoctor(null);
      fetchAllData();
    } catch (err) {
      console.error("Error updating doctor:", err);
      alert("Error updating doctor: " + err.message);
    }
  };

  const getDepartmentName = (deptId) => {
    const dept = departments.find(d => d.id === deptId);
    return dept ? dept.name : "—";
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

  if (error) {
    return (
      <div className="container-fluid px-4 py-4">
        <div className="medical-alert medical-alert-danger mb-4">
          <span className="medical-alert__icon"><IconAlert /></span>
          <div>
            <strong>Error:</strong> {error}
          </div>
        </div>
        <button className="medical-btn-primary" onClick={fetchAllData}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container-fluid px-4 py-4">
      {/* Page header */}
      <div className="mb-4">
        <p className="mp-overline mb-1">Clinic</p>
        <h1 className="mp-h2 mb-1">Doctors</h1>
        <p className="mp-body" style={{ marginBottom: 0 }}>
          Manage all doctors in your clinic.
        </p>
      </div>

      {doctors.length === 0 ? (
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
            <IconStethoscope />
          </div>
          <h3 className="mp-h3 mb-1">No doctors yet</h3>
          <p className="mp-body mb-0">
            Invite doctors to your clinic to get started.
          </p>
        </div>
      ) : (
        <div className="medical-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: 'var(--mp-bg-subtle)' }}>
                  {['Name', 'Doctor code', 'Specialization', 'Department', 'Fee', 'Actions'].map(h => (
                    <th
                      key={h}
                      style={{
                        textAlign: 'left',
                        padding: '12px 20px',
                        fontSize: 12,
                        fontWeight: 600,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        color: 'var(--mp-text-muted)',
                        borderBottom: '1px solid var(--mp-border)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {doctors.map((doc) => (
                  <tr key={doc.id} style={{ borderBottom: '1px solid var(--mp-border)' }}>
                    <td style={{ padding: '14px 20px', verticalAlign: 'middle' }}>
                      <span style={{ fontWeight: 500, color: 'var(--mp-text)' }}>
                        {doc.name}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', verticalAlign: 'middle' }}>
                      <span
                        style={{
                          fontFamily: 'var(--mp-font-mono)',
                          fontSize: 12.5,
                          color: 'var(--mp-text-secondary)',
                          background: 'var(--mp-bg-muted)',
                          padding: '2px 8px',
                          borderRadius: 4,
                        }}
                      >
                        {doc.doctor_code}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', verticalAlign: 'middle', color: 'var(--mp-text-secondary)' }}>
                      {doc.specialization}
                    </td>
                    <td style={{ padding: '14px 20px', verticalAlign: 'middle' }}>
                      {editingDoctor === doc.id ? (
                        <select
                          className="medical-input"
                          value={editedDepartment}
                          onChange={(e) => setEditedDepartment(e.target.value)}
                          style={{ padding: '6px 10px', fontSize: 13 }}
                        >
                          <option value="">Select department</option>
                          {departments.map((dep) => (
                            <option key={dep.id} value={dep.id}>{dep.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span style={{ color: 'var(--mp-text-secondary)' }}>
                          {getDepartmentName(doc.department_id)}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px 20px', verticalAlign: 'middle', color: 'var(--mp-text)' }}>
                      €{doc.consultation_fee}
                    </td>
                    <td style={{ padding: '14px 20px', verticalAlign: 'middle' }}>
                      {editingDoctor === doc.id ? (
                        <div className="d-flex gap-2">
                          <button
                            type="button"
                            className="medical-btn-primary"
                            onClick={() => handleSave(doc.id)}
                            style={{ padding: '6px 10px', fontSize: 12.5 }}
                          >
                            <IconCheck />
                            Save
                          </button>
                          <button
                            type="button"
                            className="medical-btn-outline"
                            onClick={() => setEditingDoctor(null)}
                            style={{ padding: '6px 10px', fontSize: 12.5 }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="d-flex gap-2">
                          <button
                            type="button"
                            className="medical-btn-outline"
                            onClick={() => handleEdit(doc)}
                            style={{ padding: '6px 10px', fontSize: 12.5 }}
                          >
                            <IconEdit />
                            Edit
                          </button>
                          <button
                            type="button"
                            className="medical-btn-outline"
                            onClick={() => handleDelete(doc.id)}
                            style={{ padding: '6px 10px', fontSize: 12.5, color: 'var(--mp-danger)' }}
                          >
                            <IconTrash />
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style>{`@keyframes mp-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}