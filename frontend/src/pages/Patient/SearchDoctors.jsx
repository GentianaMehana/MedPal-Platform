import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/medical-theme.css";

const IconSearch = (p) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/>
  </svg>
);
const IconUser = (p) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconBuilding = (p) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M15 21V9h3a2 2 0 0 1 2 2v10"/>
    <path d="M9 7h2M9 11h2M9 15h2"/>
  </svg>
);
const IconCalendar = (p) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2"/>
    <path d="M3 10h18M8 3v4M16 3v4"/>
  </svg>
);
const IconSpinner = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    style={{ animation: 'mp-spin 0.9s linear infinite' }}>
    <circle cx="12" cy="12" r="9" stroke={color} strokeOpacity="0.2" strokeWidth="2.5"/>
    <path d="M21 12a9 9 0 0 0-9-9" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

export default function SearchDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    name: "",
    departmentId: "",
  });

  useEffect(() => {
    fetchFilters();
    searchDoctors();
  }, []);

  const fetchFilters = async () => {
    try {
      const { data: depts } = await supabase
        .from('departments')
        .select('id, name');
      setDepartments(depts || []);
    } catch (err) {
      console.error("Error fetching filters:", err);
    }
  };

  const searchDoctors = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('doctors')
        .select(`
          id,
          name,
          specialization,
          consultation_fee,
          working_hours,
          department_id,
          departments (name),
          doctor_services (
            service_id,
            services (name, price)
          )
        `)
        .eq('is_available', true);

      if (filters.name) {
        query = query.ilike('name', `%${filters.name}%`);
      }

      if (filters.departmentId) {
        query = query.eq('department_id', filters.departmentId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedDoctors = data.map(d => ({
        id: d.id,
        name: d.name,
        specialization: d.specialization || 'General Practitioner',
        fee: d.consultation_fee || 50,
        department: d.departments?.name || 'General',
        services: d.doctor_services?.map(ds => ds.services?.name).filter(Boolean) || []
      }));

      setDoctors(formattedDoctors);
    } catch (err) {
      console.error("Error searching doctors:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    searchDoctors();
  };

  const clearFilters = () => {
    setFilters({ name: "", departmentId: "" });
    setTimeout(searchDoctors, 100);
  };

  return (
    <div className="container-fluid px-4 py-4">
      {/* Page header */}
      <div className="mb-4">
        <p className="mp-overline mb-1">Patient</p>
        <h1 className="mp-h2 mb-1">Find a doctor</h1>
        <p className="mp-body" style={{ marginBottom: 0 }}>
          Search our specialists by name or department.
        </p>
      </div>

      {/* Filters */}
      <div className="medical-card mb-4" style={{ padding: 20 }}>
        <form onSubmit={handleSearch}>
          <div className="row g-3 align-items-end">
            <div className="col-md-5">
              <label className="medical-label">Doctor name</label>
              <input
                type="text"
                name="name"
                className="medical-input"
                placeholder="Search by name…"
                value={filters.name}
                onChange={handleFilterChange}
              />
            </div>
            <div className="col-md-4">
              <label className="medical-label">Department</label>
              <select
                name="departmentId"
                className="medical-input"
                value={filters.departmentId}
                onChange={handleFilterChange}
              >
                <option value="">All departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <div className="d-flex gap-2">
                <button type="submit" className="medical-btn-primary flex-grow-1">
                  <IconSearch />
                  Search
                </button>
                <button
                  type="button"
                  className="medical-btn-outline"
                  onClick={clearFilters}
                  style={{ padding: '9px 12px' }}
                  title="Clear filters"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Results */}
      {loading ? (
        <div className="d-flex justify-content-center py-5">
          <div style={{ color: 'var(--mp-primary)' }}>
            <IconSpinner />
          </div>
        </div>
      ) : doctors.length === 0 ? (
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
            <IconSearch width={28} height={28} />
          </div>
          <h3 className="mp-h3 mb-1">No doctors found</h3>
          <p className="mp-body mb-0">Try adjusting your search filters.</p>
        </div>
      ) : (
        <>
          <div className="mb-3">
            <p className="mp-caption" style={{ marginBottom: 0 }}>
              {doctors.length} doctor{doctors.length !== 1 ? 's' : ''} available
            </p>
          </div>

          <div className="row g-3">
            {doctors.map((doc) => (
              <div key={doc.id} className="col-lg-6">
                <div className="medical-card h-100" style={{ padding: 22 }}>
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: 'var(--mp-primary-light)',
                        color: 'var(--mp-primary)',
                        border: '1px solid var(--mp-primary-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <IconUser />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: 'var(--mp-text)',
                          letterSpacing: '-0.01em',
                          marginBottom: 4,
                        }}
                      >
                        {doc.name}
                      </div>
                      <div className="d-flex flex-wrap gap-1">
                        <span className="mp-badge" style={{ fontSize: 11 }}>
                          {doc.specialization}
                        </span>
                        <span className="mp-badge mp-badge--neutral" style={{ fontSize: 11 }}>
                          {doc.department}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    className="row g-2 mb-3"
                    style={{
                      paddingTop: 14,
                      borderTop: '1px solid var(--mp-border)',
                    }}
                  >
                    <div className="col-6">
                      <div className="mp-overline" style={{ fontSize: 10.5, marginBottom: 4 }}>
                        Consultation fee
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--mp-success)' }}>
                        €{doc.fee}
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="mp-overline" style={{ fontSize: 10.5, marginBottom: 4 }}>
                        Services
                      </div>
                      <div style={{ fontSize: 13.5, color: 'var(--mp-text-secondary)' }}>
                        {doc.services.length} available
                      </div>
                    </div>
                  </div>

                  {doc.services.length > 0 && (
                    <div className="mb-3">
                      <div className="d-flex flex-wrap gap-1">
                        {doc.services.slice(0, 3).map((service, idx) => (
                          <span
                            key={idx}
                            className="mp-badge mp-badge--neutral"
                            style={{ fontSize: 11 }}
                          >
                            {service}
                          </span>
                        ))}
                        {doc.services.length > 3 && (
                          <span className="mp-badge mp-badge--neutral" style={{ fontSize: 11 }}>
                            +{doc.services.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <Link
                    to={`/patient/book-appointment?doctorId=${doc.id}`}
                    className="medical-btn-primary w-100"
                  >
                    <IconCalendar />
                    Book appointment
                  </Link>
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