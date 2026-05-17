import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { LanguageProvider } from '@/lib/LanguageContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { Toaster as SonnerToaster } from "sonner";

import AppLayout from './components/layout/AppLayout';
import RoleGate from './components/RoleGate';
import PortalAccessAdmin from './pages/PortalAccessAdmin';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Teachers from './pages/Teachers';
import Subjects from './pages/Subjects';
import Attendance from './pages/Attendance';
import AttendanceSummary from './pages/AttendanceSummary';
import WeeklyAttendanceSummary from './pages/WeeklyAttendanceSummary';
import Materials from './pages/Materials';

import Store from './pages/Store';
import StudentCard from './pages/StudentCard';
import StudyRooms from './pages/StudyRooms';
import StudentPortal from './pages/StudentPortal';
import TeacherPortal from './pages/TeacherPortal';
import ParentPortal from './pages/ParentPortal';
import BusSupervisorPortal from './pages/BusSupervisorPortal';
import RoomView from './pages/RoomView';
import ActivityFeed from './pages/ActivityFeed';
import Awards from './pages/Awards';
import Finance from './pages/Finance';
import StaffControl from './pages/StaffControl';
import StaffPortal from './pages/StaffPortal';
import StudentDirectory from './pages/StudentDirectory';
import AuditLog from './pages/AuditLog';
import Library from './pages/Library';
import ArabicShowcase from './pages/ArabicShowcase';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading EduTrack...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    if (authError.type === 'auth_required') { navigateToLogin(); return null; }
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/portal-access" element={<PortalAccessAdmin />} />
        <Route path="/students" element={<Students />} />
        <Route path="/teachers" element={<Teachers />} />
        <Route path="/subjects" element={<Subjects />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/attendance-summary" element={<AttendanceSummary />} />
        <Route path="/weekly-attendance" element={<WeeklyAttendanceSummary />} />
        <Route path="/materials" element={<Materials />} />

        <Route path="/store" element={<Store />} />
        <Route path="/card" element={<StudentCard />} />
        <Route path="/study-rooms" element={<StudyRooms />} />
        <Route path="/room-view" element={<RoomView />} />
        <Route path="/activity" element={<ActivityFeed />} />
        <Route path="/awards" element={<Awards />} />
        <Route path="/finance" element={<Finance />} />
        <Route path="/staff-control" element={<StaffControl />} />
        <Route path="/student-directory" element={<StudentDirectory />} />
        <Route path="/audit-log" element={<AuditLog />} />
        <Route path="/library" element={<Library />} />
        <Route path="/arabic-showcase" element={<ArabicShowcase />} />
      </Route>
      <Route path="/student-portal" element={<StudentPortal />} />
      <Route path="/teacher-portal" element={<TeacherPortal />} />
      <Route path="/parent-portal" element={<ParentPortal />} />
      <Route path="/bus-supervisor" element={<BusSupervisorPortal />} />
      <Route path="/staff-portal" element={<StaffPortal />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <LanguageProvider>
      <Router>
        <RoleGate>
          <AuthProvider>
            <QueryClientProvider client={queryClientInstance}>
              <AuthenticatedApp />
              <Toaster />
              <SonnerToaster richColors position="top-right" />
            </QueryClientProvider>
          </AuthProvider>
        </RoleGate>
      </Router>
    </LanguageProvider>
  );
}

export default App;