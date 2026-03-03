import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import "bootstrap/dist/css/bootstrap.min.css";

export default function BookAppointment() {
  const [form, setForm] = useState({
    doctorId: "",
    serviceId: "",
    date: "",
    time: "",
  });

  const [doctors, setDoctors] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [workingHours, setWorkingHours] = useState(null);
  const [takenTimes, setTakenTimes] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [step, setStep] = useState(1);

  const navigate = useNavigate();

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      console.log("Fetching doctors...");
      
      const { data: doctorsData, error: doctorsError } = await supabase
        .from('doctors')
        .select(`
          id,
          user_id,
          name,
          consultation_fee,
          working_hours,
          specialization,
          department_id,
          email
        `)
        .eq('is_available', true);

      if (doctorsError) throw doctorsError;

      const departmentIds = doctorsData.map(d => d.department_id).filter(Boolean);
      let departmentMap = {};
      
      if (departmentIds.length > 0) {
        const { data: departmentsData } = await supabase
          .from('departments')
          .select('id, name')
          .in('id', departmentIds);
          
        (departmentsData || []).forEach(dept => {
          departmentMap[dept.id] = dept.name;
        });
      }

      const doctorsWithServices = await Promise.all(
        doctorsData.map(async (doctor) => {
          const { data: doctorServicesData } = await supabase
            .from('doctor_services')
            .select(`
              service_id,
              price_override,
              services (
                id,
                name,
                price
              )
            `)
            .eq('doctor_id', doctor.id);

          const departmentName = departmentMap[doctor.department_id] || 'General';
          
          const doctorServices = doctorServicesData?.map(ds => ({
            id: ds.service_id,
            name: ds.services?.name,
            price: ds.price_override || ds.services?.price || doctor.consultation_fee
          })) || [];
          
          return {
            id: doctor.id,
            user_id: doctor.user_id,
            name: doctor.name,
            email: doctor.email || '',
            fee: doctor.consultation_fee || 50,
            specialization: doctor.specialization || 'General Practitioner',
            department: departmentName,
            department_id: doctor.department_id,
            working_hours: doctor.working_hours,
            services: doctorServices
          };
        })
      );
      
      setDoctors(doctorsWithServices);
    } catch (err) {
      console.error("Error fetching doctors:", err);
      setMessage({ text: "Failed to load doctors: " + err.message, type: "danger" });
    }
  };

  const fetchTakenTimes = async (doctorId, date) => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('time')
        .eq('doctor_id', doctorId)
        .eq('date', date)
        .neq('status', 'canceled');

      if (error) throw error;
      setTakenTimes(data?.map(a => a.time) || []);
    } catch (err) {
      console.error("Error fetching taken times:", err);
      setTakenTimes([]);
    }
  };

  const generateAvailableDates = (workingHours) => {
    if (!workingHours) return [];
    
    const dates = [];
    const today = new Date();
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 30);
    
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    for (let d = new Date(today); d <= maxDate; d.setDate(d.getDate() + 1)) {
      const dayName = daysOfWeek[d.getDay()].toLowerCase();
      const daySchedule = workingHours[dayName];
      
      if (daySchedule && daySchedule.start && daySchedule.end) {
        dates.push({
          date: new Date(d),
          dateStr: d.toISOString().split('T')[0],
          dayName: dayName,
          start: daySchedule.start,
          end: daySchedule.end
        });
      }
    }
    
    return dates;
  };

  const handleDoctorSelect = (doctor) => {
    setSelectedDoctor(doctor);
    setForm(prev => ({ ...prev, doctorId: doctor.id, serviceId: "", date: "", time: "" }));
    setWorkingHours(doctor.working_hours);
    setServices(doctor.services || []);
    
    const dates = generateAvailableDates(doctor.working_hours);
    setAvailableDates(dates);
    
    setStep(2);
  };

  const handleServiceSelect = (serviceId) => {
    setForm(prev => ({ ...prev, serviceId, date: "", time: "" }));
    setStep(3);
  };

  const handleDateSelect = async (date) => {
    setForm(prev => ({ ...prev, date, time: "" }));
    setTakenTimes([]);
    
    if (form.doctorId && date) {
      await fetchTakenTimes(form.doctorId, date);
    }
    setStep(4);
  };

  const handleTimeSelect = (time) => {
    setForm(prev => ({ ...prev, time }));
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.doctorId || !form.serviceId || !form.date || !form.time) {
      setMessage({ text: "Please complete all steps", type: "warning" });
      return;
    }

    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (patientError) throw patientError;
      if (!patient) throw new Error("Patient record not found");

      const { error } = await supabase
        .from('appointments')
        .insert([{
          patient_id: patient.id,
          doctor_id: form.doctorId,
          service_id: form.serviceId,
          date: form.date,
          time: form.time,
          status: 'pending',
        }]);

      if (error) throw error;

      setMessage({ text: "✅ Appointment booked successfully!", type: "success" });
      setTimeout(() => navigate("/patient"), 2000);
    } catch (err) {
      console.error("Booking error:", err);
      setMessage({ text: err.message, type: "danger" });
    } finally {
      setLoading(false);
    }
  };

  const getSelectedDateInfo = () => {
    return availableDates.find(d => d.dateStr === form.date);
  };

  const generateTimeSlots = () => {
    const dateInfo = getSelectedDateInfo();
    if (!dateInfo) return [];

    const [startH, startM] = dateInfo.start.split(":").map(Number);
    const [endH, endM] = dateInfo.end.split(":").map(Number);

    const slots = [];
    let current = new Date(0, 0, 0, startH, startM);
    const end = new Date(0, 0, 0, endH, endM);

    while (current < end) {
      const timeStr = current.toTimeString().slice(0, 5);
      const isAvailable = !takenTimes.includes(timeStr);
      
      slots.push({
        time: timeStr,
        available: isAvailable,
        display: current.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      });
      
      current.setMinutes(current.getMinutes() + 30);
    }

    return slots;
  };

  const getSelectedService = () => {
    return services.find(s => s.id === form.serviceId);
  };

  const formatDateForDisplay = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <div className="step-container">
            <h4 className="medical-label mb-4" style={{ fontSize: '1.2rem', color: '#2b6c9e' }}>
              <span style={{ background: '#2b6c9e', color: 'white', borderRadius: '50%', width: '28px', height: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginRight: '10px', fontSize: '0.9rem' }}>1</span>
              Select a Doctor
            </h4>
            {doctors.length === 0 ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3 text-muted">Loading available doctors...</p>
              </div>
            ) : (
              <div className="row g-4">
                {doctors.map((doc) => (
                  <div key={doc.id} className="col-lg-6">
                    <div 
                      className={`card h-100 border-0 shadow-sm ${selectedDoctor?.id === doc.id ? 'border-primary' : ''}`}
                      style={{ 
                        cursor: 'pointer', 
                        borderLeft: selectedDoctor?.id === doc.id ? '4px solid #2b6c9e' : '4px solid transparent',
                        transition: 'all 0.3s ease',
                        borderRadius: '16px',
                        overflow: 'hidden'
                      }}
                      onClick={() => handleDoctorSelect(doc)}
                    >
                      <div className="card-body p-4">
                        <div className="d-flex align-items-center mb-3">
                          <div style={{
                            width: '70px',
                            height: '70px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '2.2rem',
                            marginRight: '1rem',
                            color: '#2b6c9e',
                            boxShadow: '0 4px 10px rgba(43, 108, 158, 0.2)'
                          }}>
                            👨‍⚕️
                          </div>
                          <div>
                            <h5 className="fw-bold mb-1" style={{ color: '#2b6c9e' }}>{doc.name}</h5>
                            <p className="mb-0 text-muted small">
                              <span className="badge bg-light text-dark me-2">{doc.specialization}</span>
                              <span><i className="bi bi-building me-1"></i>{doc.department}</span>
                            </p>
                          </div>
                        </div>
                        
                        <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
                          <div>
                            <small className="text-muted d-block">Consultation fee</small>
                            <span className="fw-bold text-success fs-5">€{doc.fee}</span>
                          </div>
                          <div>
                            <small className="text-muted d-block">Services</small>
                            <span className="fw-bold">{doc.services?.length || 0} available</span>
                          </div>
                        </div>
                        
                        <button className="btn w-100 mt-3 py-2" style={{
                          background: selectedDoctor?.id === doc.id ? '#2b6c9e' : '#f8f9fa',
                          color: selectedDoctor?.id === doc.id ? 'white' : '#2b6c9e',
                          border: '1px solid #2b6c9e',
                          borderRadius: '12px',
                          fontWeight: '500'
                        }}>
                          {selectedDoctor?.id === doc.id ? '✓ Selected' : 'Select Doctor'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="step-container">
            <div className="d-flex align-items-center mb-4">
              <button className="btn btn-outline-secondary btn-sm me-3 px-3" onClick={handleBack} style={{ borderRadius: '30px' }}>
                <i className="bi bi-arrow-left me-1"></i> Back
              </button>
              <h4 className="medical-label mb-0" style={{ fontSize: '1.2rem', color: '#2b6c9e' }}>
                <span style={{ background: '#2b6c9e', color: 'white', borderRadius: '50%', width: '28px', height: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginRight: '10px', fontSize: '0.9rem' }}>2</span>
                Select Service
              </h4>
            </div>
            
            <div className="alert alert-info bg-light border-0 mb-4" style={{ borderRadius: '16px', padding: '1rem 1.5rem' }}>
              <div className="d-flex align-items-center">
                <div style={{ fontSize: '2rem', marginRight: '1rem' }}>👨‍⚕️</div>
                <div>
                  <strong>Dr. {selectedDoctor?.name}</strong>
                  <p className="mb-0 text-muted small">{selectedDoctor?.specialization} • {selectedDoctor?.department}</p>
                </div>
              </div>
            </div>
            
            {services.length === 0 ? (
              <div className="text-center py-5">
                <div className="display-4 mb-3" style={{ color: '#2b6c9e', opacity: '0.5' }}>💊</div>
                <h5>No services available</h5>
                <p className="text-muted">This doctor doesn't have any services yet.</p>
              </div>
            ) : (
              <div className="row g-3">
                {services.map((service) => (
                  <div key={service.id} className="col-md-6">
                    <div 
                      className={`card border-0 shadow-sm h-100 ${form.serviceId === service.id ? 'border-primary' : ''}`}
                      style={{ 
                        cursor: 'pointer',
                        borderLeft: form.serviceId === service.id ? '4px solid #2b6c9e' : '4px solid transparent',
                        borderRadius: '16px',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => handleServiceSelect(service.id)}
                    >
                      <div className="card-body p-4">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h6 className="fw-bold mb-2" style={{ color: '#2b6c9e' }}>{service.name}</h6>
                            <div className="d-flex align-items-center">
                              <span className="badge bg-success bg-opacity-10 text-success px-3 py-2 rounded-pill">
                                €{service.price}
                              </span>
                            </div>
                          </div>
                          <div style={{ fontSize: '2rem', color: '#2b6c9e', opacity: '0.7' }}>💊</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="step-container">
            <div className="d-flex align-items-center mb-4">
              <button className="btn btn-outline-secondary btn-sm me-3 px-3" onClick={handleBack} style={{ borderRadius: '30px' }}>
                <i className="bi bi-arrow-left me-1"></i> Back
              </button>
              <h4 className="medical-label mb-0" style={{ fontSize: '1.2rem', color: '#2b6c9e' }}>
                <span style={{ background: '#2b6c9e', color: 'white', borderRadius: '50%', width: '28px', height: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginRight: '10px', fontSize: '0.9rem' }}>3</span>
                Select Date
              </h4>
            </div>
            
            <div className="alert alert-info bg-light border-0 mb-4" style={{ borderRadius: '16px', padding: '1rem 1.5rem' }}>
              <div className="d-flex align-items-center">
                <div style={{ fontSize: '2rem', marginRight: '1rem' }}>💊</div>
                <div>
                  <strong>{services.find(s => s.id === form.serviceId)?.name}</strong>
                  <p className="mb-0 text-muted small">Service selected</p>
                </div>
              </div>
            </div>
            
            <div className="row">
              <div className="col-12">
                <div className="card border-0 shadow-sm p-4" style={{ borderRadius: '20px' }}>
                  <label className="form-label fw-bold mb-3" style={{ color: '#2b6c9e' }}>
                    <i className="bi bi-calendar3 me-2"></i>
                    Available dates for Dr. {selectedDoctor?.name}
                  </label>
                  
                  <div className="row g-3">
                    {availableDates.length === 0 ? (
                      <p className="text-muted">No available dates in the next 30 days</p>
                    ) : (
                      availableDates.map((dateInfo) => (
                        <div key={dateInfo.dateStr} className="col-md-4 col-lg-3">
                          <button
                            className={`btn w-100 py-3 ${form.date === dateInfo.dateStr ? 'btn-primary' : 'btn-outline-primary'}`}
                            style={{ 
                              borderRadius: '12px',
                              fontWeight: '500'
                            }}
                            onClick={() => handleDateSelect(dateInfo.dateStr)}
                          >
                            <div className="fw-bold">{dateInfo.dateStr}</div>
                            <small>{dateInfo.dayName}</small>
                            <div className="small text-muted">{dateInfo.start} - {dateInfo.end}</div>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        const timeSlots = generateTimeSlots();
        const selectedDateInfo = getSelectedDateInfo();
        const selectedSvc = services.find(s => s.id === form.serviceId);
        
        return (
          <div className="step-container">
            <div className="d-flex align-items-center mb-4">
              <button className="btn btn-outline-secondary btn-sm me-3 px-3" onClick={handleBack} style={{ borderRadius: '30px' }}>
                <i className="bi bi-arrow-left me-1"></i> Back
              </button>
              <h4 className="medical-label mb-0" style={{ fontSize: '1.2rem', color: '#2b6c9e' }}>
                <span style={{ background: '#2b6c9e', color: 'white', borderRadius: '50%', width: '28px', height: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginRight: '10px', fontSize: '0.9rem' }}>4</span>
                Select Time
              </h4>
            </div>
            
            <div className="alert alert-info border-0 mb-4" style={{ borderRadius: '16px', background: '#e3f2fd' }}>
              <div className="d-flex align-items-center">
                <i className="bi bi-calendar-check fs-3 me-3" style={{ color: '#2b6c9e' }}></i>
                <div>
                  <strong>{formatDateForDisplay(form.date)}</strong>
                </div>
              </div>
            </div>
            
            {timeSlots.length === 0 ? (
              <p className="text-muted text-center py-4">No available time slots for this date</p>
            ) : (
              <div className="row g-3">
                {timeSlots.map((slot) => (
                  <div key={slot.time} className="col-4 col-md-3 col-lg-2">
                    <button
                      type="button"
                      className={`btn w-100 py-3 ${slot.available ? 'btn-outline-primary' : 'btn-outline-secondary disabled'}`}
                      style={{ 
                        borderRadius: '14px',
                        background: form.time === slot.time ? '#2b6c9e' : '',
                        color: form.time === slot.time ? 'white' : '',
                        borderWidth: '2px',
                        fontWeight: '500'
                      }}
                      onClick={() => handleTimeSelect(slot.time)}
                      disabled={!slot.available}
                    >
                      {slot.display}
                      {!slot.available && <small className="d-block text-muted">Booked</small>}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {form.time && (
              <div className="mt-5">
                <div className="card border-0 shadow" style={{ borderRadius: '24px', overflow: 'hidden' }}>
                  <div className="card-header bg-white border-0 p-4">
                    <h5 className="fw-bold mb-0" style={{ color: '#2b6c9e' }}>
                      <i className="bi bi-check2-circle me-2"></i>
                      Appointment Summary
                    </h5>
                  </div>
                  <div className="card-body p-4 pt-0">
                    <div className="row g-4">
                      <div className="col-md-6">
                        <div className="d-flex align-items-center p-3 bg-light rounded-4">
                          <div style={{ fontSize: '2rem', marginRight: '1rem' }}>👨‍⚕️</div>
                          <div>
                            <small className="text-muted">Doctor</small>
                            <div className="fw-bold">Dr. {selectedDoctor?.name}</div>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="d-flex align-items-center p-3 bg-light rounded-4">
                          <div style={{ fontSize: '2rem', marginRight: '1rem' }}>💊</div>
                          <div>
                            <small className="text-muted">Service</small>
                            <div className="fw-bold">{selectedSvc?.name}</div>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="d-flex align-items-center p-3 bg-light rounded-4">
                          <div style={{ fontSize: '2rem', marginRight: '1rem' }}>📅</div>
                          <div>
                            <small className="text-muted">Date & Time</small>
                            <div className="fw-bold">{form.date} at {form.time}</div>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="d-flex align-items-center p-3 bg-success bg-opacity-10 rounded-4">
                          <div style={{ fontSize: '2rem', marginRight: '1rem' }}>💰</div>
                          <div>
                            <small className="text-muted">Total</small>
                            <div className="fw-bold text-success fs-4">€{selectedSvc?.price || selectedDoctor?.fee}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={handleSubmit}
                      className="btn w-100 py-3 mt-4"
                      style={{
                        background: 'linear-gradient(135deg, #2b6c9e 0%, #1e4a6b 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '16px',
                        fontWeight: '600',
                        fontSize: '1.1rem'
                      }}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Booking...
                        </>
                      ) : (
                        '✅ Confirm Appointment'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container-fluid py-5" style={{ 
      background: 'linear-gradient(135deg, #f5f9ff 0%, #ffffff 100%)',
      minHeight: '100vh'
    }}>
      <div className="container" style={{ maxWidth: "1200px" }}>
        <div className="card border-0 shadow-lg" style={{ borderRadius: '32px', overflow: 'hidden' }}>
          <div className="card-header bg-white border-0 p-5 pb-0">
            <h1 className="display-6 fw-bold text-center mb-2" style={{ color: '#2b6c9e' }}>
              <i className="bi bi-calendar-plus me-3"></i>
              Book an Appointment
            </h1>
            <p className="text-center text-muted mb-0">Schedule your visit with our specialist doctors</p>
          </div>
          
          <div className="card-body p-5">
            {/* Progress Steps */}
            <div className="d-flex justify-content-between mb-5 px-3 position-relative">
              <div className="position-absolute top-50 start-0 end-0" style={{ height: '2px', background: '#e9eef3', zIndex: 0, transform: 'translateY(-50%)' }}></div>
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="text-center position-relative" style={{ zIndex: 1, background: 'white', padding: '0 15px' }}>
                  <div 
                    className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-2 shadow-sm"
                    style={{
                      width: '50px',
                      height: '50px',
                      background: step >= s ? 'linear-gradient(135deg, #2b6c9e 0%, #1e4a6b 100%)' : 'white',
                      color: step >= s ? 'white' : '#2b6c9e',
                      fontWeight: 'bold',
                      fontSize: '1.2rem',
                      border: step >= s ? 'none' : '2px solid #2b6c9e',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {s}
                  </div>
                  <small className={step >= s ? 'fw-bold' : 'text-muted'} style={{ color: step >= s ? '#2b6c9e' : '' }}>
                    {s === 1 ? 'Doctor' : s === 2 ? 'Service' : s === 3 ? 'Date' : 'Time'}
                  </small>
                </div>
              ))}
            </div>

            {message.text && (
              <div className={`alert alert-${message.type} alert-dismissible fade show mb-4`} style={{ borderRadius: '16px' }}>
                <i className={`bi bi-${message.type === 'success' ? 'check-circle' : 'exclamation-triangle'} me-2`}></i>
                {message.text}
                <button type="button" className="btn-close" onClick={() => setMessage({ text: "", type: "" })}></button>
              </div>
            )}

            {renderStep()}
          </div>
        </div>
      </div>
    </div>
  );
}