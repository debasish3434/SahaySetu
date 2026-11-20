import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import GuestRoute from './components/auth/GuestRoute.jsx';
import DashboardLayout from './components/layout/DashboardLayout.jsx';

// Auth Pages
const Login = lazy(() => import('./pages/Login.jsx'));
const FirstLoginPasswordChange = lazy(() => import('./pages/FirstLoginPasswordChange.jsx'));
const Register = lazy(() => import('./pages/Register.jsx'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword.jsx'));
const ResetPassword = lazy(() => import('./pages/ResetPassword.jsx'));

// Core Pages
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));
const ReportIncident = lazy(() => import('./pages/ReportIncident.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));
const AccountSettings = lazy(() => import('./pages/AccountSettings.jsx'));
const NearbyIncidents = lazy(() => import('./pages/NearbyIncidents.jsx'));
const IncidentDetail = lazy(() => import('./pages/IncidentDetail.jsx'));
const VolunteerApply = lazy(() => import('./pages/VolunteerApply.jsx'));
const VolunteerVerification = lazy(() => import('./pages/VolunteerVerification.jsx'));
const MyTasks = lazy(() => import('./pages/MyTasks.jsx'));

// SS-45, SS-49 – Shelter pages (all roles)
const ShelterList = lazy(() => import('./pages/ShelterList.jsx'));
const NearbyShelters = lazy(() => import('./pages/NearbyShelters.jsx'));

// Citizen Pages
const MyReports = lazy(() => import('./pages/citizen/MyReports.jsx'));
const CitizenIncidentDetail = lazy(() => import('./pages/citizen/CitizenIncidentDetail.jsx'));
const EmergencyRequest = lazy(() => import('./pages/citizen/EmergencyRequest.jsx')); // SS-38
const MyRequests = lazy(() => import('./pages/citizen/MyRequests.jsx')); // SS-39

// Volunteer Pages
const AvailableIncidents = lazy(() => import('./pages/volunteer/AvailableIncidents.jsx'));
const VolunteerIncidentDetail = lazy(() => import('./pages/volunteer/VolunteerIncidentDetail.jsx'));
const VolunteerHistory = lazy(() => import('./pages/volunteer/VolunteerHistory.jsx')); // SS-37


// Coordinator Pages
const CoordinatorIncidents = lazy(() => import('./pages/coordinator/CoordinatorIncidents.jsx'));
const CoordinatorIncidentDetail = lazy(() => import('./pages/coordinator/CoordinatorIncidentDetail.jsx'));
const EmergencyRequests = lazy(() => import('./pages/coordinator/EmergencyRequests.jsx')); // SS-39/41/42/43/44
const RegisterShelter = lazy(() => import('./pages/coordinator/RegisterShelter.jsx')); // SS-46
const ManageShelters = lazy(() => import('./pages/coordinator/ManageShelters.jsx')); // SS-48
const ManageResources = lazy(() => import('./pages/coordinator/ManageResources.jsx')); // SS-47

// Admin Pages
const AdminIncidents = lazy(() => import('./pages/admin/AdminIncidents.jsx'));
const AdminIncidentDetail = lazy(() => import('./pages/admin/AdminIncidentDetail.jsx'));
const AdminVolunteers = lazy(() => import('./pages/admin/AdminVolunteers.jsx')); // SS-56
const SystemSettings = lazy(() => import('./pages/admin/SystemSettings.jsx')); // SS-59
const SendAnnouncement = lazy(() => import('./pages/admin/SendAnnouncement.jsx')); // SS-54
const SuperAdminConsole = lazy(() => import('./pages/admin/SuperAdminConsole.jsx'));
const ApplicationStatus = lazy(() => import('./pages/ApplicationStatus.jsx'));

// Sprint 4 – Notifications (SS-50 to SS-54)
const Notifications = lazy(() => import('./pages/Notifications.jsx'));

// Sprint 4 – Analytics & Reports (SS-60 to SS-64)
const AnalyticsDashboard = lazy(() => import('./pages/analytics/AnalyticsDashboard.jsx'));
const IncidentReport = lazy(() => import('./pages/analytics/IncidentReport.jsx'));
const VolunteerReport = lazy(() => import('./pages/analytics/VolunteerReport.jsx'));
const ResourceReport = lazy(() => import('./pages/analytics/ResourceReport.jsx'));

function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { fontSize: '14px', fontFamily: 'Inter, sans-serif' },
          success: { iconTheme: { primary: '#16A34A', secondary: '#fff' } },
          error: { iconTheme: { primary: '#DC2626', secondary: '#fff' } },
        }}
      />
      <Suspense fallback={<div className="p-8 text-center text-ink-500">Loading page…</div>}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/application-status" element={<ApplicationStatus />} />

        {/* Guest-only routes */}
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
        </Route>

        {/* Protected routes (any authenticated user) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/first-login-password" element={<FirstLoginPasswordChange />} />
          <Route element={<DashboardLayout />}>
          {/* ── Shared: all authenticated roles ── */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<AccountSettings />} />
            <Route path="/incidents/nearby" element={<NearbyIncidents />} />
            <Route path="/incidents/:id" element={<IncidentDetail />} />
            <Route path="/volunteer/apply" element={<VolunteerApply />} />
            <Route path="/shelters" element={<ShelterList />} />
            <Route path="/shelters/nearby" element={<NearbyShelters />} />

            {/* ── Citizen ── */}
            <Route path="/incidents/report" element={<ReportIncident />} />
            <Route path="/my-reports" element={<MyReports />} />
            <Route path="/my-reports/:id" element={<CitizenIncidentDetail />} />
            <Route path="/emergency-request" element={<EmergencyRequest />} />
            <Route path="/my-requests" element={<MyRequests />} />

            {/* ── Volunteer ── */}
            <Route path="/available-incidents" element={<AvailableIncidents />} />
            <Route path="/available-incidents/:id" element={<VolunteerIncidentDetail />} />
            <Route path="/volunteer/my-tasks" element={<MyTasks />} />
            <Route path="/volunteer/history" element={<VolunteerHistory />} />

            {/* ── Coordinator & Admin ── */}
            <Route path="/volunteer/verify" element={<VolunteerVerification />} />
            <Route path="/emergency-requests" element={<EmergencyRequests />} />
            <Route path="/shelters/register" element={<RegisterShelter />} />
            <Route path="/shelters/manage" element={<ManageShelters />} />
            <Route path="/resources" element={<ManageResources />} />
            <Route path="/incident-management" element={<CoordinatorIncidents />} />
            <Route path="/incident-management/:id" element={<CoordinatorIncidentDetail />} />

            {/* ── Sprint 4 – Notifications (all roles) ── */}
            <Route path="/notifications" element={<Notifications />} />

            {/* ── Sprint 4 – Analytics (coordinator + admin) ── */}
            <Route path="/analytics" element={<AnalyticsDashboard />} />
            <Route path="/analytics/incidents" element={<IncidentReport />} />
            <Route path="/analytics/volunteers" element={<VolunteerReport />} />
            <Route path="/analytics/resources" element={<ResourceReport />} />

            {/* ── Admin only ── */}
            <Route path="/admin/incidents" element={<AdminIncidents />} />
            <Route path="/admin/incidents/:id" element={<AdminIncidentDetail />} />
            <Route path="/admin/volunteers" element={<AdminVolunteers />} />  {/* SS-56 */}
            <Route path="/admin/settings" element={<SystemSettings />} />     {/* SS-59 */}
            <Route path="/admin/announcements" element={<SendAnnouncement />} /> {/* SS-54 */}
            <Route path="/admin/super-admin" element={<SuperAdminConsole />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
    </AuthProvider>
  );
}

export default App;
