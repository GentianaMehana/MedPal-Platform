import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/medical-theme.css";

/* ---------- Icons ---------- */
const IconArrowLeft = (p) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
);
const IconUser = (p) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconBriefcase = (p) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="2" y="7" width="20" height="14" rx="2"/>
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
  </svg>
);
const IconCalendar = (p) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2"/>
    <path d="M3 10h18M8 3v4M16 3v4"/>
  </svg>
);
const IconClock = (p) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>
  </svg>
);
const IconCheck = (p) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M4 12l5 5L20 7"/>
  </svg>
);
const IconAlert = (p) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
  </svg>
);
const IconSpinner = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    style={{ animation: 'mp-spin 0.9s linear infinite' }}>
    <circle cx="12" cy="12" r="9" stroke={color} strokeOpacity="0.25" strokeWidth="2.5"/>
    <path d="M21 12a9 9 0 0 0-9-9" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

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
              services (id, name, price)
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

      setMessage({ text: "Appointment booked successfully.", type: "success" });
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

  const formatDateForDisplay = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const StepHeading = ({ num, title }) => (
    <div className="d-flex align-items-center gap-3 mb-4">
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 999,
          background: 'var(--mp-primary)',
          color: '#fff',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 600,
          fontSize: 14,
          letterSpacing: '-0.01em',
          flexShrink: 0,
        }}
      >
        {num}
      </div>
      <h2 className="mp-h3" style={{ marginBottom: 0 }}>{title}</h2>
    </div>
  );

  const BackButton = () => (
    <button
      type="button"
      className="medical-btn-outline"
      onClick={handleBack}
      style={{ padding: '7px 12px', fontSize: 13 }}
    >
      <IconArrowLeft />
      Back
    </button>
  );

  const InfoAlert = ({ icon, title, subtitle }) => (
    <div
      style={{
        padding: 16,
        background: 'var(--mp-primary-lighter)',
        border: '1px solid var(--mp-primary-border)',
        borderRadius: 'var(--mp-radius)',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: '#fff',
          color: 'var(--mp-primary)',
          border: '1px solid var(--mp-primary-border)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--mp-text)' }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 12.5, color: 'var(--mp-text-secondary)', marginTop: 2 }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <StepHeading num={1} title="Select a doctor" />
            {doctors.length === 0 ? (
              <div className="d-flex justify-content-center py-5">
                <div style={{ color: 'var(--mp-primary)' }}>
                  <IconSpinner size={28} />
                </div>
              </div>
            ) : (
              <div className="row g-3">
                {doctors.map((doc) => {
                  const isSelected = selectedDoctor?.id === doc.id;
                  return (
                    <div key={doc.id} className="col-lg-6">
                      <div
                        className="medical-card"
                        style={{
                          padding: 22,
                          cursor: 'pointer',
                          borderColor: isSelected ? 'var(--mp-primary)' : 'var(--mp-border)',
                          boxShadow: isSelected ? 'var(--mp-shadow-md)' : undefined,
                        }}
                        onClick={() => handleDoctorSelect(doc)}
                      >
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
                          <div style={{ minWidth: 0 }}>
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
                            <div style={{ fontSize: 12.5, color: 'var(--mp-text-muted)' }}>
                              {doc.specialization} · {doc.department}
                            </div>
                          </div>
                        </div>

                        <div
                          className="d-flex justify-content-between align-items-center"
                          style={{
                            paddingTop: 14,
                            borderTop: '1px solid var(--mp-border)',
                          }}
                        >
                          <div>
                            <div className="mp-overline" style={{ fontSize: 10.5 }}>Fee</div>
                            <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--mp-success)' }}>
                              €{doc.fee}
                            </div>
                          </div>
                          <div>
                            <div className="mp-overline" style={{ fontSize: 10.5 }}>Services</div>
                            <div style={{ fontSize: 13.5, color: 'var(--mp-text-secondary)' }}>
                              {doc.services?.length || 0}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        );

      case 2:
        return (
          <>
            <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
              <StepHeading num={2} title="Select a service" />
              <BackButton />
            </div>

            <InfoAlert
              icon={<IconUser />}
              title={`Dr. ${selectedDoctor?.name}`}
              subtitle={`${selectedDoctor?.specialization} · ${selectedDoctor?.department}`}
            />

            {services.length === 0 ? (
              <div className="medical-card text-center py-5">
                <h3 className="mp-h3 mb-1">No services available</h3>
                <p className="mp-body mb-0">This doctor does not offer services yet.</p>
              </div>
            ) : (
              <div className="row g-3">
                {services.map((service) => {
                  const isSelected = form.serviceId === service.id;
                  return (
                    <div key={service.id} className="col-md-6">
                      <div
                        className="medical-card"
                        style={{
                          padding: 22,
                          cursor: 'pointer',
                          borderColor: isSelected ? 'var(--mp-primary)' : 'var(--mp-border)',
                          boxShadow: isSelected ? 'var(--mp-shadow-md)' : undefined,
                        }}
                        onClick={() => handleServiceSelect(service.id)}
                      >
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <div
                              style={{
                                fontSize: 14.5,
                                fontWeight: 600,
                                color: 'var(--mp-text)',
                                marginBottom: 8,
                                letterSpacing: '-0.005em',
                              }}
                            >
                              {service.name}
                            </div>
                            <span className="mp-badge" style={{ background: 'var(--mp-success-bg)', color: 'var(--mp-success)', borderColor: 'var(--mp-success-bd)' }}>
                              €{service.price}
                            </span>
                          </div>
                          <div style={{ color: 'var(--mp-primary)', opacity: 0.7 }}>
                            <IconBriefcase />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        );

      case 3:
        return (
          <>
            <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
              <StepHeading num={3} title="Select a date" />
              <BackButton />
            </div>

            <InfoAlert
              icon={<IconBriefcase />}
              title={services.find(s => s.id === form.serviceId)?.name}
              subtitle="Service selected"
            />

            <div className="medical-card" style={{ padding: 24 }}>
              <p className="mp-overline mb-3">Available dates for Dr. {selectedDoctor?.name}</p>

              {availableDates.length === 0 ? (
                <p className="mp-caption mb-0">No available dates in the next 30 days.</p>
              ) : (
                <div className="row g-2">
                  {availableDates.map((dateInfo) => {
                    const isSelected = form.date === dateInfo.dateStr;
                    return (
                      <div key={dateInfo.dateStr} className="col-md-4 col-lg-3">
                        <button
                          type="button"
                          className={isSelected ? 'medical-btn-primary' : 'medical-btn-outline'}
                          style={{
                            width: '100%',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            padding: '12px 14px',
                            textAlign: 'left',
                          }}
                          onClick={() => handleDateSelect(dateInfo.dateStr)}
                        >
                          <div style={{ fontSize: 13.5, fontWeight: 600 }}>
                            {dateInfo.dateStr}
                          </div>
                          <div style={{ fontSize: 12, opacity: 0.85, textTransform: 'capitalize' }}>
                            {dateInfo.dayName}
                          </div>
                          <div style={{ fontSize: 11.5, opacity: 0.75, marginTop: 2 }}>
                            {dateInfo.start} – {dateInfo.end}
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        );

      case 4: {
        const timeSlots = generateTimeSlots();
        const selectedSvc = services.find(s => s.id === form.serviceId);

        return (
          <>
            <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
              <StepHeading num={4} title="Select a time" />
              <BackButton />
            </div>

            <InfoAlert
              icon={<IconCalendar />}
              title={formatDateForDisplay(form.date)}
            />

            {timeSlots.length === 0 ? (
              <p className="mp-caption text-center py-4">No available time slots for this date.</p>
            ) : (
              <div className="row g-2 mb-4">
                {timeSlots.map((slot) => {
                  const isSelected = form.time === slot.time;
                  return (
                    <div key={slot.time} className="col-4 col-md-3 col-lg-2">
                      <button
                        type="button"
                        disabled={!slot.available}
                        className={isSelected ? 'medical-btn-primary' : 'medical-btn-outline'}
                        style={{
                          width: '100%',
                          padding: '10px 6px',
                          fontSize: 13,
                          opacity: slot.available ? 1 : 0.4,
                        }}
                        onClick={() => handleTimeSelect(slot.time)}
                      >
                        <div>{slot.display}</div>
                        {!slot.available && (
                          <div style={{ fontSize: 10.5, opacity: 0.7 }}>Booked</div>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {form.time && (
              <div className="medical-card" style={{ padding: 24 }}>
                <p className="mp-overline mb-3">Appointment summary</p>

                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <div
                      style={{
                        padding: 14,
                        background: 'var(--mp-bg-subtle)',
                        border: '1px solid var(--mp-border)',
                        borderRadius: 'var(--mp-radius)',
                      }}
                    >
                      <div className="mp-overline" style={{ fontSize: 10.5, marginBottom: 4 }}>
                        Doctor
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--mp-text)' }}>
                        Dr. {selectedDoctor?.name}
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div
                      style={{
                        padding: 14,
                        background: 'var(--mp-bg-subtle)',
                        border: '1px solid var(--mp-border)',
                        borderRadius: 'var(--mp-radius)',
                      }}
                    >
                      <div className="mp-overline" style={{ fontSize: 10.5, marginBottom: 4 }}>
                        Service
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--mp-text)' }}>
                        {selectedSvc?.name}
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div
                      style={{
                        padding: 14,
                        background: 'var(--mp-bg-subtle)',
                        border: '1px solid var(--mp-border)',
                        borderRadius: 'var(--mp-radius)',
                      }}
                    >
                      <div className="mp-overline" style={{ fontSize: 10.5, marginBottom: 4 }}>
                        Date & time
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--mp-text)' }}>
                        {form.date} at {form.time}
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div
                      style={{
                        padding: 14,
                        background: 'var(--mp-success-bg)',
                        border: '1px solid var(--mp-success-bd)',
                        borderRadius: 'var(--mp-radius)',
                      }}
                    >
                      <div className="mp-overline" style={{ fontSize: 10.5, marginBottom: 4 }}>
                        Total
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--mp-success)', letterSpacing: '-0.01em' }}>
                        €{selectedSvc?.price || selectedDoctor?.fee}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  className="medical-btn-primary medical-btn--lg w-100"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <IconSpinner size={16} color="#fff" />
                      Booking…
                    </>
                  ) : (
                    <>
                      <IconCheck />
                      Confirm appointment
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="container-fluid px-4 py-4" style={{ maxWidth: 960 }}>
      {/* Page header */}
      <div className="mb-4">
        <p className="mp-overline mb-1">Patient</p>
        <h1 className="mp-h2 mb-1">Book an appointment</h1>
        <p className="mp-body" style={{ marginBottom: 0 }}>
          Schedule your visit in four simple steps.
        </p>
      </div>

      {/* Progress */}
      <div className="medical-card mb-4" style={{ padding: 20 }}>
        <div className="d-flex justify-content-between align-items-center gap-2">
          {[1, 2, 3, 4].map((s) => {
            const active = step >= s;
            const labels = ['Doctor', 'Service', 'Date', 'Time'];
            return (
              <div key={s} className="d-flex align-items-center gap-2 flex-grow-1">
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 999,
                    background: active ? 'var(--mp-primary)' : 'var(--mp-bg-muted)',
                    color: active ? '#fff' : 'var(--mp-text-muted)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                    fontSize: 13,
                    flexShrink: 0,
                    border: active ? 'none' : '1px solid var(--mp-border)',
                  }}
                >
                  {s}
                </div>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: active ? 600 : 400,
                    color: active ? 'var(--mp-text)' : 'var(--mp-text-muted)',
                    letterSpacing: '-0.005em',
                    display: window.innerWidth < 576 ? 'none' : 'inline',
                  }}
                >
                  {labels[s - 1]}
                </span>
                {s < 4 && (
                  <div
                    style={{
                      flex: 1,
                      height: 1,
                      background: step > s ? 'var(--mp-primary)' : 'var(--mp-border)',
                      marginLeft: 8,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {message.text && (
        <div
          className={`medical-alert ${
            message.type === 'success' ? 'medical-alert-success' :
            message.type === 'warning' ? 'medical-alert-warning' :
            'medical-alert-danger'
          } mb-4`}
        >
          <span className="medical-alert__icon">
            {message.type === 'success' ? <IconCheck /> : <IconAlert />}
          </span>
          <div>{message.text}</div>
        </div>
      )}

      {renderStep()}

      <style>{`@keyframes mp-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}