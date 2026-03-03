import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/medical-theme.css";

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

      // Merr klinikën nga user_id
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

      // Marr departamentet
      const { data: depts, error: deptsError } = await supabase
        .from('departments')
        .select('*')
        .eq('clinic_id', clinicId);

      if (deptsError) throw deptsError;
      setDepartments(depts || []);

      // Marr doktorët
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
      <div className="text-center py-5">
        <div className="medical-spinner mx-auto"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger m-4">
        <h5>Error:</h5>
        <p>{error}</p>
        <button className="btn btn-primary mt-2" onClick={fetchAllData}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container-fluid px-4 py-4">
      <div className="medical-header mb-4">
        <h2 className="mb-2">📋 Doctors List</h2>
        <p className="mb-0">Manage all doctors in your clinic</p>
      </div>

      {doctors.length === 0 ? (
        <div className="medical-card text-center py-5">
          <div className="display-1 mb-3" style={{ color: 'var(--medical-primary)' }}>👨‍⚕️</div>
          <h5>No doctors registered yet</h5>
          <p className="text-muted">Start by inviting doctors to your clinic</p>
        </div>
      ) : (
        <div className="medical-card">
          <div className="table-responsive">
            <table className="medical-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Doctor Code</th>
                  <th>Specialization</th>
                  <th>Department</th>
                  <th>Fee</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map((doc) => (
                  <tr key={doc.id}>
                    <td>{doc.name}</td>
                    <td><code>{doc.doctor_code}</code></td>
                    <td>{doc.specialization}</td>
                    <td>
                      {editingDoctor === doc.id ? (
                        <select
                          className="form-select"
                          value={editedDepartment}
                          onChange={(e) => setEditedDepartment(e.target.value)}
                        >
                          <option value="">Select Department</option>
                          {departments.map((dep) => (
                            <option key={dep.id} value={dep.id}>{dep.name}</option>
                          ))}
                        </select>
                      ) : (
                        getDepartmentName(doc.department_id)
                      )}
                    </td>
                    <td>€{doc.consultation_fee}</td>
                    <td>
                      {editingDoctor === doc.id ? (
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => handleSave(doc.id)}
                          >
                            Save
                          </button>
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => setEditingDoctor(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleEdit(doc)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(doc.id)}
                          >
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
    </div>
  );
}