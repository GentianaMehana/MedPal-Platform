import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/medical-theme.css";

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
      // Merr të gjithë pacientët që kanë pasur appointment me këtë klinikë
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          patient_id,
          patients!inner (
            id,
            name,
            email
          )
        `)
        .eq('clinic_id', clinicId)
        .order('date', { ascending: false });

      if (error) throw error;

      // Krijo listë unike të pacientëve
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
          patients!inner (
            name
          )
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

      // Upload file nëse ka
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

      // Përgatit të dhënat e rezultatit
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

      setMessage({ text: "✅ Test results saved successfully!", type: "success" });
      
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

  return (
    <div className="container-fluid px-4 py-4">
      <div className="medical-header mb-4">
        <h2 className="mb-2">🧪 Add Test Results</h2>
        <p className="mb-0">Upload and manage patient test results</p>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type} alert-dismissible fade show mb-4`}>
          {message.text}
          <button type="button" className="btn-close" onClick={() => setMessage({ text: "", type: "" })}></button>
        </div>
      )}

      <div className="row">
        <div className="col-lg-10 mx-auto">
          <div className="medical-card">
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="medical-label">Select Patient *</label>
                  <select
                    name="patientId"
                    className="medical-input w-100"
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

                <div className="col-md-6 mb-3">
                  <label className="medical-label">Related Appointment (Optional)</label>
                  <select
                    name="appointmentId"
                    className="medical-input w-100"
                    value={form.appointmentId}
                    onChange={handleChange}
                  >
                    <option value="">No specific appointment</option>
                    {appointments
                      .filter(apt => apt.patient_id === form.patientId)
                      .map(apt => (
                        <option key={apt.id} value={apt.id}>
                          {apt.date} at {apt.time} - {apt.patients?.name}
                        </option>
                      ))
                    }
                  </select>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="medical-label">Test Name *</label>
                  <input
                    type="text"
                    name="testName"
                    className="medical-input w-100"
                    value={form.testName}
                    onChange={handleChange}
                    placeholder="e.g., Blood Test, X-Ray, MRI"
                    required
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <label className="medical-label">Test Date</label>
                  <input
                    type="date"
                    name="testDate"
                    className="medical-input w-100"
                    value={form.testDate}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="row">
                <div className="col-md-4 mb-3">
                  <label className="medical-label">Result Value</label>
                  <input
                    type="text"
                    name="resultValue"
                    className="medical-input w-100"
                    value={form.resultValue}
                    onChange={handleChange}
                    placeholder="e.g., 120"
                  />
                </div>

                <div className="col-md-4 mb-3">
                  <label className="medical-label">Unit</label>
                  <input
                    type="text"
                    name="resultUnit"
                    className="medical-input w-100"
                    value={form.resultUnit}
                    onChange={handleChange}
                    placeholder="e.g., mg/dL, %"
                  />
                </div>

                <div className="col-md-4 mb-3">
                  <label className="medical-label">Reference Range</label>
                  <input
                    type="text"
                    name="referenceRange"
                    className="medical-input w-100"
                    value={form.referenceRange}
                    onChange={handleChange}
                    placeholder="e.g., 70-110"
                  />
                </div>
              </div>

              <div className="mb-3">
                <div className="form-check">
                  <input
                    type="checkbox"
                    name="isAbnormal"
                    className="form-check-input"
                    checked={form.isAbnormal}
                    onChange={handleChange}
                    id="isAbnormal"
                  />
                  <label className="form-check-label" htmlFor="isAbnormal">
                    Mark as abnormal / requires attention
                  </label>
                </div>
              </div>

              <div className="mb-3">
                <label className="medical-label">Upload File (PDF, Image, etc.)</label>
                <input
                  type="file"
                  className="medical-input w-100"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleFileChange}
                />
                <small className="text-muted">Optional: Upload test result file</small>
              </div>

              <div className="mb-4">
                <label className="medical-label">Notes</label>
                <textarea
                  name="notes"
                  className="medical-input w-100"
                  rows="3"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Additional notes about the test results..."
                />
              </div>

              <button
                type="submit"
                className="medical-btn-primary w-100 py-3"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Saving...
                  </>
                ) : (
                  '💾 Save Test Results'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}