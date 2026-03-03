import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import "bootstrap/dist/css/bootstrap.min.css";

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
          departments (
            name
          ),
          doctor_services (
            service_id,
            services (
              name,
              price
            )
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
    <div className="container-fluid py-5" style={{ 
      background: 'linear-gradient(135deg, #f5f9ff 0%, #ffffff 100%)',
      minHeight: '100vh'
    }}>
      <div className="container" style={{ maxWidth: "1200px" }}>
        <div className="card border-0 shadow-lg" style={{ borderRadius: '32px' }}>
          <div className="card-header bg-white border-0 p-5 pb-0">
            <h1 className="display-6 fw-bold text-center mb-2" style={{ color: '#2b6c9e' }}>
              <i className="bi bi-search-heart me-3"></i>
              Find a Doctor
            </h1>
            <p className="text-center text-muted mb-0">Search our specialist doctors by name or department</p>
          </div>
          
          <div className="card-body p-5">
            {/* Search Filters */}
            <div className="card border-0 shadow-sm mb-5" style={{ borderRadius: '20px', background: '#f8faff' }}>
              <div className="card-body p-4">
                <form onSubmit={handleSearch}>
                  <div className="row g-4">
                    <div className="col-md-5">
                      <label className="form-label fw-bold mb-2" style={{ color: '#2b6c9e' }}>
                        <i className="bi bi-person me-2"></i>
                        Doctor Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        className="form-control form-control-lg"
                        style={{ 
                          borderRadius: '14px', 
                          border: '2px solid #e9eef3',
                          padding: '0.8rem 1.2rem'
                        }}
                        placeholder="Search by name..."
                        value={filters.name}
                        onChange={handleFilterChange}
                      />
                    </div>
                    
                    <div className="col-md-5">
                      <label className="form-label fw-bold mb-2" style={{ color: '#2b6c9e' }}>
                        <i className="bi bi-building me-2"></i>
                        Department
                      </label>
                      <select
                        name="departmentId"
                        className="form-control form-control-lg"
                        style={{ 
                          borderRadius: '14px', 
                          border: '2px solid #e9eef3',
                          padding: '0.8rem 1.2rem'
                        }}
                        value={filters.departmentId}
                        onChange={handleFilterChange}
                      >
                        <option value="">All Departments</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="col-md-2 d-flex align-items-end">
                      <button 
                        type="submit" 
                        className="btn w-100 py-3"
                        style={{
                          background: 'linear-gradient(135deg, #2b6c9e 0%, #1e4a6b 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '14px',
                          fontWeight: '600'
                        }}
                      >
                        <i className="bi bi-search me-2"></i>
                        Search
                      </button>
                    </div>
                    
                    <div className="col-12 text-end">
                      <button 
                        type="button" 
                        className="btn btn-link"
                        onClick={clearFilters}
                        style={{ color: '#2b6c9e' }}
                      >
                        Clear filters
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {/* Results */}
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : doctors.length === 0 ? (
              <div className="text-center py-5">
                <div className="display-1 mb-3" style={{ color: '#2b6c9e', opacity: '0.5' }}>🔍</div>
                <h3>No doctors found</h3>
                <p className="text-muted">Try adjusting your search filters</p>
              </div>
            ) : (
              <>
                <h4 className="mb-4" style={{ color: '#2b6c9e' }}>
                  <i className="bi bi-people me-2"></i>
                  {doctors.length} Doctors Available
                </h4>
                <div className="row g-4">
                  {doctors.map((doc) => (
                    <div key={doc.id} className="col-lg-6">
                      <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '24px', overflow: 'hidden' }}>
                        <div className="card-body p-4">
                          <div className="d-flex align-items-center mb-3">
                            <div style={{
                              width: '80px',
                              height: '80px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '2.5rem',
                              marginRight: '1.5rem',
                              color: '#2b6c9e',
                              boxShadow: '0 4px 10px rgba(43, 108, 158, 0.2)'
                            }}>
                              👨‍⚕️
                            </div>
                            <div>
                              <h4 className="fw-bold mb-1" style={{ color: '#2b6c9e' }}>{doc.name}</h4>
                              <p className="mb-2">
                                <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 me-2">
                                  {doc.specialization}
                                </span>
                                <span className="badge bg-info bg-opacity-10 text-info px-3 py-2">
                                  {doc.department}
                                </span>
                              </p>
                            </div>
                          </div>
                          
                          <div className="row g-3 mt-2">
                            <div className="col-md-6">
                              <div className="d-flex align-items-center p-3 bg-light rounded-4">
                                <div style={{ fontSize: '2rem', marginRight: '1rem' }}>💰</div>
                                <div>
                                  <small className="text-muted">Consultation Fee</small>
                                  <div className="fw-bold text-success">€{doc.fee}</div>
                                </div>
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="d-flex align-items-center p-3 bg-light rounded-4">
                                <div style={{ fontSize: '2rem', marginRight: '1rem' }}>💊</div>
                                <div>
                                  <small className="text-muted">Services</small>
                                  <div className="fw-bold">{doc.services.length} available</div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {doc.services.length > 0 && (
                            <div className="mt-3">
                              <small className="text-muted d-block mb-2">Services offered:</small>
                              <div className="d-flex flex-wrap gap-2">
                                {doc.services.slice(0, 3).map((service, idx) => (
                                  <span key={idx} className="badge bg-light text-dark px-3 py-2">
                                    {service}
                                  </span>
                                ))}
                                {doc.services.length > 3 && (
                                  <span className="badge bg-light text-dark px-3 py-2">
                                    +{doc.services.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                          
                          <Link
                            to={`/patient/book-appointment?doctorId=${doc.id}`}
                            className="btn w-100 mt-4 py-3"
                            style={{
                              background: 'linear-gradient(135deg, #2b6c9e 0%, #1e4a6b 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '16px',
                              fontWeight: '600'
                            }}
                          >
                            <i className="bi bi-calendar-plus me-2"></i>
                            Book Appointment
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}