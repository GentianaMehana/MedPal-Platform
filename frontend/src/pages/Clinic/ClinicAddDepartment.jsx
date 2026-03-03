import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/medical-theme.css";

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

      setMessage({ text: "✅ Department added successfully!", type: "success" });
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

      setMessage({ text: "✅ Department deleted", type: "success" });
      fetchDepartments();
    } catch (err) {
      setMessage({ text: err.message, type: "danger" });
    }
  };

  return (
    <div className="container-fluid px-4 py-4">
      <div className="medical-header mb-4">
        <h2 className="mb-2">➕ Add Department</h2>
        <p className="mb-0">Create new departments for your clinic</p>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type} alert-dismissible fade show mb-4`}>
          {message.text}
          <button type="button" className="btn-close" onClick={() => setMessage({ text: "", type: "" })}></button>
        </div>
      )}

      <div className="row">
        <div className="col-lg-8 mx-auto">
          <div className="medical-card mb-4">
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="medical-label">Department Name</label>
                <input
                  type="text"
                  className="medical-input w-100"
                  placeholder="Enter department name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                className="medical-btn-primary w-100 py-3"
                disabled={loading}
              >
                {loading ? "Adding..." : "Add Department"}
              </button>
            </form>
          </div>

          {departments.length > 0 && (
            <div className="medical-card">
              <h5 className="medical-label mb-3">📋 Existing Departments</h5>
              <div className="list-group list-group-flush">
                {departments.map((dep) => (
                  <div key={dep.id} className="list-group-item d-flex justify-content-between align-items-center px-0">
                    <span className="fw-bold">{dep.name}</span>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDelete(dep.id)}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}