import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/medical-theme.css";

export default function ClinicServicesAndDepartments() {
  const [departmentName, setDepartmentName] = useState("");
  const [departments, setDepartments] = useState([]);
  const [services, setServices] = useState([]);
  const [editingService, setEditingService] = useState(null);
  const [serviceForm, setServiceForm] = useState({
    name: "",
    price: "",
    departmentId: "",
  });

  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const clinicUser = JSON.parse(localStorage.getItem("user"));
      
      const { data: clinicData } = await supabase
        .from('clinics')
        .select('id')
        .eq('user_id', clinicUser.id)
        .maybeSingle();

      if (!clinicData) {
        setLoading(false);
        return;
      }

      // Fetch departments
      const { data: depts } = await supabase
        .from('departments')
        .select('*')
        .eq('clinic_id', clinicData.id)
        .order('name');

      setDepartments(depts || []);

      // Fetch services
      if (depts?.length > 0) {
        const departmentIds = depts.map(d => d.id);
        
        const { data: servs } = await supabase
          .from('services')
          .select('*')
          .in('department_id', departmentIds)
          .order('name');

        // Map department names
        const deptMap = {};
        depts.forEach(dept => { deptMap[dept.id] = dept.name; });
        
        const servicesWithDept = servs?.map(service => ({
          ...service,
          department_name: deptMap[service.department_id] || 'Unknown'
        })) || [];
        
        setServices(servicesWithDept);
      } else {
        setServices([]);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddDepartment = async (e) => {
    e.preventDefault();
    if (!departmentName.trim()) {
      setMessage({ text: "Please enter department name", type: "warning" });
      return;
    }

    try {
      const clinicUser = JSON.parse(localStorage.getItem("user"));
      
      const { data: clinicData } = await supabase
        .from('clinics')
        .select('id')
        .eq('user_id', clinicUser.id)
        .maybeSingle();

      if (!clinicData) throw new Error("Clinic not found");

      await supabase
        .from('departments')
        .insert([{ name: departmentName, clinic_id: clinicData.id }]);

      setMessage({ text: "✅ Department added!", type: "success" });
      setDepartmentName("");
      fetchData();
    } catch (err) {
      setMessage({ text: err.message, type: "danger" });
    }
  };

  const handleDeleteDepartment = async (id) => {
    if (!window.confirm("Delete this department?")) return;
    try {
      await supabase.from('departments').delete().eq('id', id);
      setMessage({ text: "✅ Department deleted", type: "success" });
      fetchData();
    } catch (err) {
      setMessage({ text: err.message, type: "danger" });
    }
  };

  const handleServiceChange = (e) => {
    setServiceForm({ ...serviceForm, [e.target.name]: e.target.value });
  };

  const handleAddOrUpdateService = async (e) => {
    e.preventDefault();
    const { name, price, departmentId } = serviceForm;

    if (!name || !price || !departmentId) {
      setMessage({ text: "All fields required", type: "warning" });
      return;
    }

    try {
      if (editingService) {
        await supabase
          .from('services')
          .update({ name, price: parseFloat(price), department_id: departmentId })
          .eq('id', editingService);
        setMessage({ text: "✅ Service updated", type: "success" });
      } else {
        await supabase
          .from('services')
          .insert([{ name, price: parseFloat(price), department_id: departmentId }]);
        setMessage({ text: "✅ Service added", type: "success" });
      }

      setServiceForm({ name: "", price: "", departmentId: "" });
      setEditingService(null);
      fetchData();
    } catch (err) {
      setMessage({ text: err.message, type: "danger" });
    }
  };

  const handleEditService = (service) => {
    setEditingService(service.id);
    setServiceForm({
      name: service.name,
      price: service.price,
      departmentId: service.department_id,
    });
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm("Delete this service?")) return;
    try {
      await supabase.from('services').delete().eq('id', id);
      setMessage({ text: "✅ Service deleted", type: "success" });
      fetchData();
    } catch (err) {
      setMessage({ text: err.message, type: "danger" });
    }
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
        <h2 className="mb-2">🏥 Departments & Services</h2>
        <p className="mb-0">Manage your clinic's departments and services</p>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type} alert-dismissible fade show mb-4`}>
          {message.text}
          <button type="button" className="btn-close" onClick={() => setMessage({ text: "", type: "" })}></button>
        </div>
      )}

      <div className="row">
        {/* Left Column - Departments */}
        <div className="col-md-5">
          <div className="medical-card mb-4">
            <h5 className="medical-label mb-3">➕ Add Department</h5>
            <form onSubmit={handleAddDepartment} className="d-flex gap-2">
              <input
                type="text"
                className="medical-input flex-grow-1"
                placeholder="Department name"
                value={departmentName}
                onChange={(e) => setDepartmentName(e.target.value)}
              />
              <button type="submit" className="medical-btn-primary px-4">Add</button>
            </form>
          </div>

          <div className="medical-card" style={{ maxHeight: "400px", overflowY: "auto" }}>
            <h5 className="medical-label mb-3">📋 Departments</h5>
            {departments.length === 0 ? (
              <p className="text-muted">No departments yet</p>
            ) : (
              <div className="list-group list-group-flush">
                {departments.map((dep) => (
                  <div key={dep.id} className="list-group-item d-flex justify-content-between align-items-center px-0">
                    <span className="fw-bold">{dep.name}</span>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDeleteDepartment(dep.id)}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Services */}
        <div className="col-md-7">
          <div className="medical-card mb-4">
            <h5 className="medical-label mb-3">
              {editingService ? "✏️ Edit Service" : "➕ Add Service"}
            </h5>
            <form onSubmit={handleAddOrUpdateService}>
              <div className="row g-2">
                <div className="col-md-4">
                  <input
                    type="text"
                    name="name"
                    className="medical-input w-100"
                    placeholder="Service name"
                    value={serviceForm.name}
                    onChange={handleServiceChange}
                    required
                  />
                </div>
                <div className="col-md-3">
                  <input
                    type="number"
                    name="price"
                    className="medical-input w-100"
                    placeholder="Price (€)"
                    value={serviceForm.price}
                    onChange={handleServiceChange}
                    required
                  />
                </div>
                <div className="col-md-3">
                  <select
                    name="departmentId"
                    className="medical-input w-100"
                    value={serviceForm.departmentId}
                    onChange={handleServiceChange}
                    required
                  >
                    <option value="">Select Dept</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2">
                  <button className="medical-btn-primary w-100" type="submit">
                    {editingService ? "Update" : "Add"}
                  </button>
                </div>
              </div>
              {editingService && (
                <div className="mt-2 text-end">
                  <button
                    className="medical-btn-outline btn-sm"
                    type="button"
                    onClick={() => {
                      setEditingService(null);
                      setServiceForm({ name: "", price: "", departmentId: "" });
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </form>
          </div>

          <div className="medical-card" style={{ maxHeight: "400px", overflowY: "auto" }}>
            <h5 className="medical-label mb-3">📄 Services</h5>
            {services.length === 0 ? (
              <p className="text-muted">No services yet</p>
            ) : (
              <div className="list-group list-group-flush">
                {services.map((s) => (
                  <div key={s.id} className="list-group-item px-0 py-2">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <span className="fw-bold">{s.name}</span>
                        <span className="text-success ms-2">€{s.price}</span>
                        <br />
                        <small className="text-muted">{s.department_name}</small>
                      </div>
                      <div>
                        <button
                          className="btn btn-sm btn-outline-primary me-1"
                          onClick={() => handleEditService(s)}
                        >
                          ✏️
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDeleteService(s.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}