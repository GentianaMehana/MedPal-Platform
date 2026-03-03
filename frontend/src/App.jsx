import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

// Welcome Page
import WelcomePage from "./pages/WelcomePage";

// Auth Pages
import Login from "./pages/Auth/Login";
import ClinicRegister from "./pages/Auth/ClinicRegister";
import CompleteRegistration from "./pages/Auth/CompleteRegistration";

import ResetPassword from "./pages/Auth/ResetPassword";
// Layouts
import PatientLayout from "./components/Layouts/PatientLayout";
import DoctorLayout from "./components/Layouts/DoctorLayout";
import ClinicLayout from "./components/Layouts/ClinicLayout";

// Components
import PrivateRoute from "./components/PrivateRoute";


// Patient Pages
import PatientDashboard from "./pages/Patient/PatientDashboard";
import BookAppointment from "./pages/Patient/BookAppointment";
import PatientProfile from "./pages/Patient/PatientProfile";
import AppointmentHistory from "./pages/Patient/AppointmentHistory";
import PatientNotifications from "./pages/Patient/PatientNotifications";
import PatientReports from "./pages/Patient/PatientReports";
import SearchDoctors from "./pages/Patient/SearchDoctors";
import UploadDocuments from "./pages/Patient/UploadDocuments";

// Doctor Pages
import DoctorDashboard from "./pages/Doctor/DoctorDashboard";
import DoctorAppointments from "./pages/Doctor/DoctorAppointments";
import DoctorCalendarView from "./pages/Doctor/DoctorCalendarView";
import AddVisitReport from "./pages/Doctor/AddVisitReport";
import AddTestResults from "./pages/Doctor/AddTestResults"; // <- E RE
import DoctorReports from "./pages/Doctor/DoctorReports";
import DoctorProfile from "./pages/Doctor/DoctorProfile";
import DoctorWorkingHours from "./pages/Doctor/DoctorWorkingHours";

// Clinic Pages
import ClinicDashboard from "./pages/Clinic/ClinicDashboard";
import DoctorList from "./pages/Clinic/DoctorList";
import ClinicAddDoctor from "./pages/Clinic/ClinicAddDoctor";
import ClinicCalendarView from "./pages/Clinic/ClinicCalendarView";
import ClinicAppointments from "./pages/Clinic/ClinicAppointments";
import ClinicServicesAndDepartments from "./pages/Clinic/ClinicServicesAndDepartments";
import ClinicSetDoctorHours from "./pages/Clinic/ClinicSetDoctorHours";
import ClinicPatientReports from "./pages/Clinic/ClinicPatientReports";
import ClinicProfileUpdate from "./pages/Clinic/ClinicProfileUpdate";
import InvitePatient from "./pages/Clinic/InvitePatient";
import ClinicAddDepartment from "./pages/Clinic/ClinicAddDepartment";

// Admin Pages


// Common Pages
import CalendarView from "./pages/Common/CalendarView";

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* 👋 WELCOME PAGE */}
        <Route path="/" element={<WelcomePage />} />

        {/* 🔐 AUTH PAGES */}
        <Route path="/login" element={<Login />} />
        <Route path="/register/clinic" element={<ClinicRegister />} />
        <Route path="/complete-registration/:role" element={<CompleteRegistration />} />

        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* 🧑‍⚕️ PATIENT ROUTES */}
        <Route path="/patient" element={
          <PrivateRoute allowedRoles={["patient"]}>
            <PatientLayout />
          </PrivateRoute>
        }>
          <Route index element={<PatientDashboard />} />
          <Route path="book-appointment" element={<BookAppointment />} />
          <Route path="profile" element={<PatientProfile />} />
          <Route path="history" element={<AppointmentHistory />} />
          <Route path="notifications" element={<PatientNotifications />} />
          <Route path="reports" element={<PatientReports />} />
          <Route path="documents" element={<UploadDocuments />} />
          <Route path="search-doctors" element={<SearchDoctors />} />
          <Route path="calendar" element={<CalendarView />} />
        </Route>

        {/* 👨‍⚕️ DOCTOR ROUTES */}
        <Route path="/doctor" element={
          <PrivateRoute allowedRoles={["doctor"]}>
            <DoctorLayout />
          </PrivateRoute>
        }>
          <Route index element={<DoctorDashboard />} />
          <Route path="appointments" element={<DoctorAppointments />} />
          <Route path="calendar" element={<DoctorCalendarView />} />
          <Route path="add-report" element={<AddVisitReport />} />
          <Route path="add-test-results" element={<AddTestResults />} /> {/* <- E RE */}
          <Route path="reports" element={<DoctorReports />} />
          <Route path="profile" element={<DoctorProfile />} />
          <Route path="working-hours" element={<DoctorWorkingHours />} />
        </Route>

        {/* 🏥 CLINIC ROUTES */}
        <Route path="/clinic" element={
          <PrivateRoute allowedRoles={["clinic"]}>
            <ClinicLayout />
          </PrivateRoute>
        }>
          <Route index element={<ClinicDashboard />} />
          <Route path="doctors" element={<DoctorList />} />
          <Route path="add-doctor" element={<ClinicAddDoctor />} />
          <Route path="add-department" element={<ClinicAddDepartment />} />
          <Route path="calendar" element={<ClinicCalendarView />} />
          <Route path="appointments" element={<ClinicAppointments />} />
          <Route path="services" element={<ClinicServicesAndDepartments />} />
          <Route path="set-working-hours" element={<ClinicSetDoctorHours />} />
          <Route path="reports" element={<ClinicPatientReports />} />
          <Route path="profile" element={<ClinicProfileUpdate />} />
          <Route path="invite-patient" element={<InvitePatient />} />
        </Route>

        {/* 404 - Not Found */}
        <Route path="*" element={
          <div className="container text-center mt-5">
            <h1 className="display-1">404</h1>
            <p className="lead">Page not found</p>
            <a href="/" className="btn btn-primary btn-lg mt-3">Go Home</a>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;