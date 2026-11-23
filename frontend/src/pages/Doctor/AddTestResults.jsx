import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/medical-theme.css";

/* ---------- Icons ---------- */
const IconFlask = (p) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M9 3h6v6l5 9a2 2 0 0 1-1.8 3H5.8A2 2 0 0 1 4 18l5-9V3z"/>
    <path d="M9 3v6M15 3v6M7 15h10"/>
  </svg>
);
const IconSave = (p) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <path d="M17 21v-8H7v8M7 3v5h8"/>
  </svg>
);
const IconUpload = (p) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
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
const IconSpinner = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    style={{ animation: 'mp-spin 0.9s linear infinite' }}>
    <circle cx="12" cy="12" r="9" stroke={color} strokeOpacity="0.25" strokeWidth="2.5"/>
    <path d="M21 12a9 9 0 0 0-9-9" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

export default function AddTestResults() {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState({
    patientId: "",
    appointmentId: "",
    testName: "",
    testDate: new Date().toISOString().split('T')[0],
    resultValue: "",
    resultUnit: "",
    referenceRange: "",
    isAbnormal: false,
    notes: "",
  });
  const [file, setFile] = useState(null);
  const [doctorInfo, setDoctorInfo] = useState({ id: null, user_id: null });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const navigate = useNavigate();

  useEffect(() => {
    getDoctorInfo();
  }, []);

  const getDoctorInfo = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));

      const { data: doctor, error: doctorError } = await supabase
        .from('doctors')
        .select('id, user_id, clinic_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (doctorError) throw doctorError;

      if (doctor) {
        setDoctorInfo(doctor);
        fetchPatients(doctor.clinic_id);
        fetchAppointments(doctor.id);
      }
    } catch (err) {
      console.error("Error getting doctor info:", err);
    }
  };

  const fetchPatients = async (clinicId) => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          patient_id,
          patients!inner (id, name, email)
        `)
        .eq('clinic_id', clinicId)
        .order('date', { ascending: false });

      if (error) throw error;

      const uniquePatients = [];
      const seen = new Set();

      data?.forEach(item => {
        if (!seen.has(item.patient_id)) {
          seen.add(item.patient_id);
          uniquePatients.push({
            id: item.patients.id,
            name: item.patients.name,
            email: item.patients.email
          });
        }
      });

      setPatients(uniquePatients);
    } catch (err) {
      console.error("Error fetching patients:", err);
    }
  };

  const fetchAppointments = async (docId) => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          date,
          time,
          patient_id,
          patients!inner (name)
        `)
        .eq('doctor_id', docId)
        .in('status', ['approved', 'completed'])
        .order('date', { ascending: false });

      if (error) throw error;

      setAppointments(data || []);
    } catch (err) {
      console.error("Error fetching appointments:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      if (!doctorInfo.id) throw new Error("Doctor information not found");
      if (!form.patientId) throw new Error("Please select a patient");
      if (!form.testName) throw new Error("Test name is required");

      let fileUrl = null;
      let fileName = null;

      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName_ = `${form.patientId}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('test-results')
          .upload(fileName_, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('test-results')
          .getPublicUrl(fileName_);

        fileUrl = publicUrl;
        fileName = file.name;
      }

      const resultData = {
        test_name: form.testName,
        test_date: form.testDate,
        value: form.resultValue,
        unit: form.resultUnit,
        reference_range: form.referenceRange,
        is_abnormal: form.isAbnormal
      };

      const { error } = await supabase
        .from('test_results')
        .insert([{
          patient_id: form.patientId,
          doctor_id: doctorInfo.id,
          appointment_id: form.appointmentId || null,
          test_name: form.testName,
          test_date: form.testDate,
          result_data: resultData,
          file_url: fileUrl,
          file_name: fileName,
          notes: form.notes,
          is_abnormal: form.isAbnormal
        }]);

      if (error) throw error;

      setMessage({ text: "Test results saved successfully.", type: "success" });

      setForm({
        patientId: "",
        appointmentId: "",
        testName: "",
        testDate: new Date().toISOString().split('T')[0],
        resultValue: "",
        resultUnit: "",
        referenceRange: "",
        isAbnormal: false,
        notes: "",
      });
      setFile(null);

      setTimeout(() => navigate("/doctor"), 2000);
    } catch (err) {
      console.error("Error saving test results:", err);
      setMessage({ text: err.message, type: "danger" });
    } finally {
      setLoading(false);
    }
  };

  const alertClass = message.type === 'success' ? 'medical-alert-success' : 'medical-alert-danger';

  return (
    <div className="container-fluid px-4 py-4" style={{ maxWidth: 1000 }}>
      {/* Page header */}
      <div className="mb-4">
        <p className="mp-overline mb-1">Doctor</p>
        <h1 className="mp-h2 mb-1">Add test results</h1>
        <p className="mp-body" style={{ marginBottom: 0 }}>
          Upload and record patient test results.
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

      <form onSubmit={handleSubmit}>
        {/* Section 1: Link to patient */}
        <div className="medical-card mb-4" style={{ padding: 26 }}>
          <p className="mp-overline mb-3">Patient & appointment</p>

          <div className="row g-3">
            <div className="col-md-6">
              <label className="medical-label">
                Patient <span className="required">*</span>
              </label>
              <select
                name="patientId"
                className="medical-input"
                value={form.patientId}
                onChange={handleChange}
                required
              >
                <option value="">Choose a patient</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.email})</option>
                ))}
              </select>
            </div>

            <div className="col-md-6">
              <label className="medical-label">Related appointment</label>
              <select
                name="appointmentId"
                className="medical-input"
                value={form.appointmentId}
                onChange={handleChange}
              >
                <option value="">No specific appointment</option>
                {appointments
                  .filter(apt => apt.patient_id === form.patientId)
                  .map(apt => (
                    <option key={apt.id} value={apt.id}>
                      {apt.date} at {apt.time} — {apt.patients?.name}
                    </option>
                  ))
                }
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Test details */}
        <div className="medical-card mb-4" style={{ padding: 26 }}>
          <p className="mp-overline mb-3">Test details</p>

          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="medical-label">
                Test name <span className="required">*</span>
              </label>
              <input
                type="text"
                name="testName"
                className="medical-input"
                value={form.testName}
                onChange={handleChange}
                placeholder="e.g. Blood test, X-Ray, MRI"
                required
              />
            </div>

            <div className="col-md-6">
              <label className="medical-label">Test date</label>
              <input
                type="date"
                name="testDate"
                className="medical-input"
                value={form.testDate}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="row g-3">
            <div className="col-md-4">
              <label className="medical-label">Result value</label>
              <input
                type="text"
                name="resultValue"
                className="medical-input"
                value={form.resultValue}
                onChange={handleChange}
                placeholder="e.g. 120"
              />
            </div>

            <div className="col-md-4">
              <label className="medical-label">Unit</label>
              <input
                type="text"
                name="resultUnit"
                className="medical-input"
                value={form.resultUnit}
                onChange={handleChange}
                placeholder="e.g. mg/dL, %"
              />
            </div>

            <div className="col-md-4">
              <label className="medical-label">Reference range</label>
              <input
                type="text"
                name="referenceRange"
                className="medical-input"
                value={form.referenceRange}
                onChange={handleChange}
                placeholder="e.g. 70–110"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Attachment & notes */}
        <div className="medical-card mb-4" style={{ padding: 26 }}>
          <p className="mp-overline mb-3">Attachment & notes</p>

          {/* Abnormal toggle */}
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 20,
              cursor: 'pointer',
              fontSize: 14,
              color: 'var(--mp-text)',
            }}
          >
            <input
              type="checkbox"
              name="isAbnormal"
              checked={form.isAbnormal}
              onChange={handleChange}
              style={{ accentColor: 'var(--mp-primary)', width: 16, height: 16 }}
            />
            Mark as abnormal / requires attention
          </label>

          <div className="mb-3">
            <label className="medical-label">Upload file</label>
            <input
              type="file"
              className="medical-input"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={handleFileChange}
            />
            <span className="medical-hint">
              Optional — attach a PDF or image of the test result.
            </span>
          </div>

          <div>
            <label className="medical-label">Notes</label>
            <textarea
              name="notes"
              className="medical-input"
              rows="3"
              value={form.notes}
              onChange={handleChange}
              placeholder="Additional context about the results…"
            />
          </div>
        </div>

        <button
          type="submit"
          className="medical-btn-primary medical-btn--lg w-100"
          disabled={loading}
        >
          {loading ? (
            <>
              <IconSpinner size={16} color="#fff" />
              Saving…
            </>
          ) : (
            <>
              <IconSave />
              Save test results
            </>
          )}
        </button>
      </form>

      <style>{`@keyframes mp-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}