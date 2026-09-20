import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/medical-theme.css";

const IconPlus = (p) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M12 5v14M5 12h14"/>
  </svg>
);
const IconTrash = (p) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
  </svg>
);
const IconEdit = (p) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IconBuilding = (p) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M15 21V9h3a2 2 0 0 1 2 2v10"/>
  </svg>
);
const IconBriefcase = (p) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="2" y="7" width="20" height="14" rx="2"/>
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
  </svg>
);
const IconCheck = (p) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/>
  </svg>
);
const IconAlert = (p) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
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

      const { data: depts } = await supabase
        .from('departments')
        .select('*')
        .eq('clinic_id', clinicData.id)
        .order('name');

      setDepartments(depts || []);

      if (depts?.length > 0) {
        const departmentIds = depts.map(d => d.id);

        const { data: servs } = await supabase
          .from('services')
          .select('*')
          .in('department_id', departmentIds)
          .order('name');

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

      setMessage({ text: "Department added.", type: "success" });
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
      setMessage({ text: "Department deleted.", type: "success" });
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
        setMessage({ text: "Service updated.", type: "success" });
      } else {
        await supabase
          .from('services')
          .insert([{ name, price: parseFloat(price), department_id: departmentId }]);
        setMessage({ text: "Service added.", type: "success" });
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
      setMessage({ text: "Service deleted.", type: "success" });
      fetchData();
    } catch (err) {
      setMessage({ text: err.message, type: "danger" });
    }
  };

  const alertClass =
    message.type === 'success' ? 'medical-alert-success' :
    message.type === 'warning' ? 'medical-alert-warning' :
    message.type === 'danger'  ? 'medical-alert-danger'  : '';

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
      <div className="mb-4">
        <p className="mp-overline mb-1">Clinic</p>
        <h1 className="mp-h2 mb-1">Departments & services</h1>
        <p className="mp-body" style={{ marginBottom: 0 }}>
          Organize your clinic's departments and offered services.
        </p>
      </div>

      {message.text && (
        <div className={`medical-alert ${alertClass} mb-4`}>
          <span className="medical-alert__icon">
            {message.type === 'success' ? <IconCheck /> : <IconAlert />}
          </span>
          <div>{message.text}</div>
        </div>
      )}

      <div className="row g-4">
        {/* Departments column */}
        <div className="col-lg-5">
          <div className="medical-card mb-4" style={{ padding: 22 }}>
            <p className="mp-overline mb-3">New department</p>
            <form onSubmit={handleAddDepartment} className="d-flex gap-2">
              <input
                type="text"
                className="medical-input flex-grow-1"
                placeholder="Department name"
                value={departmentName}
                onChange={(e) => setDepartmentName(e.target.value)}
              />
              <button type="submit" className="medical-btn-primary">
                <IconPlus />
                Add
              </button>
            </form>
          </div>

          <div className="medical-card" style={{ padding: 22 }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <p className="mp-overline" style={{ marginBottom: 0 }}>Departments</p>
              <span className="mp-badge mp-badge--neutral">{departments.length}</span>
            </div>

            {departments.length === 0 ? (
              <p className="mp-caption text-center py-3 mb-0">
                No departments yet.
              </p>
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
                      padding: '10px 0',
                      borderTop: i === 0 ? 'none' : '1px solid var(--mp-border)',
                    }}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 28,
                          height: 28,
                          borderRadius: 7,
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
                          fontSize: 14,
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
                      onClick={() => handleDeleteDepartment(dep.id)}
                      style={{ color: 'var(--mp-danger)', padding: '6px 8px' }}
                      title="Delete department"
                    >
                      <IconTrash />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Services column */}
        <div className="col-lg-7">
          <div className="medical-card mb-4" style={{ padding: 22 }}>
            <p className="mp-overline mb-3">
              {editingService ? "Edit service" : "New service"}
            </p>
            <form onSubmit={handleAddOrUpdateService}>
              <div className="row g-2">
                <div className="col-md-5">
                  <label className="medical-label">Name</label>
                  <input
                    type="text"
                    name="name"
                    className="medical-input"
                    placeholder="Service name"
                    value={serviceForm.name}
                    onChange={handleServiceChange}
                    required
                  />
                </div>
                <div className="col-md-3">
                  <label className="medical-label">Price (€)</label>
                  <input
                    type="number"
                    name="price"
                    className="medical-input"
                    placeholder="0.00"
                    value={serviceForm.price}
                    onChange={handleServiceChange}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="medical-label">Department</label>
                  <select
                    name="departmentId"
                    className="medical-input"
                    value={serviceForm.departmentId}
                    onChange={handleServiceChange}
                    required
                  >
                    <option value="">Select</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="d-flex gap-2 mt-3">
                <button className="medical-btn-primary flex-grow-1" type="submit">
                  {editingService ? "Update service" : "Add service"}
                </button>
                {editingService && (
                  <button
                    className="medical-btn-outline"
                    type="button"
                    onClick={() => {
                      setEditingService(null);
                      setServiceForm({ name: "", price: "", departmentId: "" });
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="medical-card" style={{ padding: 22 }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <p className="mp-overline" style={{ marginBottom: 0 }}>Services</p>
              <span className="mp-badge mp-badge--neutral">{services.length}</span>
            </div>

            {services.length === 0 ? (
              <p className="mp-caption text-center py-3 mb-0">No services yet.</p>
            ) : (
              <ul className="list-unstyled mb-0">
                {services.map((s, i) => (
                  <li
                    key={s.id}
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
                          background: 'var(--mp-bg-muted)',
                          color: 'var(--mp-text-secondary)',
                          flexShrink: 0,
                        }}
                      >
                        <IconBriefcase />
                      </div>
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'baseline',
                            gap: 8,
                          }}
                        >
                          <span style={{ fontSize: 14.5, fontWeight: 500, color: 'var(--mp-text)' }}>
                            {s.name}
                          </span>
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: 'var(--mp-success)',
                            }}
                          >
                            €{s.price}
                          </span>
                        </div>
                        <div style={{ fontSize: 12.5, color: 'var(--mp-text-muted)' }}>
                          {s.department_name}
                        </div>
                      </div>
                    </div>
                    <div className="d-flex gap-1">
                      <button
                        type="button"
                        className="medical-btn-ghost"
                        onClick={() => handleEditService(s)}
                        style={{ padding: '6px 8px' }}
                        title="Edit"
                      >
                        <IconEdit />
                      </button>
                      <button
                        type="button"
                        className="medical-btn-ghost"
                        onClick={() => handleDeleteService(s.id)}
                        style={{ color: 'var(--mp-danger)', padding: '6px 8px' }}
                        title="Delete"
                      >
                        <IconTrash />
                      </button>
                    </div>
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