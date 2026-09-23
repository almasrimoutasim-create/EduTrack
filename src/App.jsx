import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { LanguageProvider } from '@/lib/LanguageContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { Toaster as SonnerToaster } from "sonner";

import { lazy, Suspense } from 'react';
import AppLayout from './components/layout/AppLayout';
import RoleGate from './components/RoleGate';
import FounderGuard from './components/founder/FounderGuard';
import PlanAccessGuard from './components/PlanAccessGuard';
import RoleLogin from './pages/RoleLogin';
import Gateway from './pages/Gateway';
import { BranchProvider } from './lib/BranchContext';
import FounderLogin from './pages/FounderLogin';
import FounderDashboard from './pages/FounderDashboard';

const PageLoader = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background">
    <div className="text-center">
      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-sm text-muted-foreground">جاري التحميل...</p>
    </div>
  </div>
);

// ── Lazy pages: كل صفحة حزمة منفصلة لتقليل الحجم الأولي ──
const PortalAccessAdmin = lazy(() => import('./pages/PortalAccessAdmin'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Students = lazy(() => import('./pages/Students'));
const Teachers = lazy(() => import('./pages/Teachers'));
const Subjects = lazy(() => import('./pages/Subjects'));
const Attendance = lazy(() => import('./pages/Attendance'));
const AttendanceSummary = lazy(() => import('./pages/AttendanceSummary'));
const WeeklyAttendanceSummary = lazy(() => import('./pages/WeeklyAttendanceSummary'));
const Materials = lazy(() => import('./pages/Materials'));
const Schedules = lazy(() => import('./pages/Schedules'));
const Store = lazy(() => import('./pages/Store'));
const StudentCard = lazy(() => import('./pages/StudentCard'));
const StudyRooms = lazy(() => import('./pages/StudyRooms'));

const TeacherPortal = lazy(() => import('./pages/TeacherPortal'));
const ParentPortal = lazy(() => import('./pages/ParentPortal'));
const BusSupervisorPortal = lazy(() => import('./pages/BusSupervisorPortal'));
const BusRouteManagement = lazy(() => import('./pages/BusRouteManagement'));
const RoomView = lazy(() => import('./pages/RoomView'));
const ActivityFeed = lazy(() => import('./pages/ActivityFeed'));
const Awards = lazy(() => import('./pages/Awards'));
const Finance = lazy(() => import('./pages/Finance'));
const StaffControl = lazy(() => import('./pages/StaffControl'));
const StaffAttendance = lazy(() => import('./pages/StaffAttendance'));
const StaffPayroll = lazy(() => import('./pages/StaffPayroll'));
const StaffRequests = lazy(() => import('./pages/StaffRequests'));
const StaffPersonalRequests = lazy(() => import('./pages/StaffPersonalRequests'));
const StaffPortal = lazy(() => import('./pages/StaffPortal'));
const StudentDirectory = lazy(() => import('./pages/StudentDirectory'));
const AuditLog = lazy(() => import('./pages/AuditLog'));
const Library = lazy(() => import('./pages/Library'));
const ArabicShowcase = lazy(() => import('./pages/ArabicShowcase'));
const VirtualClassroom = lazy(() => import('./pages/VirtualClassroom'));
const AdminVirtualClassrooms = lazy(() => import('./pages/AdminVirtualClassrooms'));
const AdminChats = lazy(() => import('./pages/AdminChats'));
const OfficialAnnouncements = lazy(() => import('./pages/OfficialAnnouncements'));
const Grades = lazy(() => import('./pages/Grades'));
const CounselingDashboard = lazy(() => import('./pages/CounselingDashboard'));
const CounselingCases = lazy(() => import('./pages/CounselingCases'));
const CounselingCaseDetail = lazy(() => import('./pages/CounselingCaseDetail'));
const StaffContracts = lazy(() => import('./pages/StaffContracts'));
const StaffLeaves = lazy(() => import('./pages/StaffLeaves'));
const StaffEvaluations = lazy(() => import('./pages/StaffEvaluations'));
const HRReports = lazy(() => import('./pages/HRReports'));
const Departments = lazy(() => import('./pages/Departments'));
const CareerLadder = lazy(() => import('./pages/CareerLadder'));
const Settings = lazy(() => import('./pages/Settings'));
const StoreInventory = lazy(() => import('./pages/StoreInventory'));
const StoreCategories = lazy(() => import('./pages/StoreCategories'));
const StorePOS = lazy(() => import('./pages/StorePOS'));
const SalesOrders = lazy(() => import('./pages/SalesOrders'));
const SalesReports = lazy(() => import('./pages/SalesReports'));
const StudentEnrollment = lazy(() => import('./pages/StudentEnrollment'));
const AcademicFiles = lazy(() => import('./pages/AcademicFiles'));
const StudentArchive = lazy(() => import('./pages/StudentArchive'));
const PrintResults = lazy(() => import('./pages/PrintResults'));
const PublicRegistration = lazy(() => import('./pages/PublicRegistration'));
const PublicStudentRegister = lazy(() => import('./pages/PublicStudentRegister'));
const PublicTeacherRegister = lazy(() => import('./pages/PublicTeacherRegister'));
const PublicStaffRegister = lazy(() => import('./pages/PublicStaffRegister'));
const RenewSubscription = lazy(() => import('./pages/RenewSubscription'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const BranchManagement = lazy(() => import('./pages/BranchManagement'));

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
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/gateway" element={<Gateway />} />
        <Route path="/gateway/:schoolSlug" element={<Gateway />} />
        <Route path="/login" element={<RoleLogin />} />
        <Route path="/register" element={<PublicRegistration />} />
        <Route path="/register/student/:slug" element={<PublicStudentRegister />} />
        <Route path="/register/teacher/:slug" element={<PublicTeacherRegister />} />
        <Route path="/register/staff/:slug" element={<PublicStaffRegister />} />
        <Route path="/school-register" element={<PublicRegistration />} />

        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin-dashboard" element={<Dashboard />} />
          <Route path="/branches" element={<BranchManagement />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/portal-access" element={<PortalAccessAdmin />} />
          <Route path="/students" element={<Students />} />
          <Route path="/teachers" element={<Teachers />} />
          <Route path="/subjects" element={<Subjects />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/attendance-summary" element={<AttendanceSummary />} />
          <Route path="/weekly-attendance" element={<WeeklyAttendanceSummary />} />
          <Route path="/materials" element={<Materials />} />
          <Route path="/schedules" element={<Schedules />} />
          <Route path="/store" element={<Store />} />
          <Route path="/store/inventory" element={<StoreInventory />} />
          <Route path="/store/categories" element={<StoreCategories />} />
          <Route path="/store/pos" element={<StorePOS />} />
          <Route path="/store/orders" element={<SalesOrders />} />
          <Route path="/store/reports" element={<SalesReports />} />

          {/* Registrar Routes */}
          <Route path="/registrar/enrollment" element={<StudentEnrollment />} />
          <Route path="/registrar/files" element={<AcademicFiles />} />
          <Route path="/registrar/archive" element={<StudentArchive />} />

          <Route path="/card" element={<StudentCard />} />
          <Route path="/study-rooms" element={<StudyRooms />} />
          <Route path="/room-view" element={<RoomView />} />
          <Route path="/activity" element={<ActivityFeed />} />
          <Route path="/awards" element={<Awards />} />
           <Route path="/finance" element={<PlanAccessGuard><Finance /></PlanAccessGuard>} />
           <Route path="/staff-control" element={<PlanAccessGuard><StaffControl /></PlanAccessGuard>} />
           <Route path="/staff/contracts" element={<PlanAccessGuard><StaffContracts /></PlanAccessGuard>} />
           <Route path="/staff/payroll" element={<PlanAccessGuard><StaffPayroll /></PlanAccessGuard>} />
           <Route path="/staff/leaves" element={<PlanAccessGuard><StaffLeaves /></PlanAccessGuard>} />
           <Route path="/staff/evaluations" element={<PlanAccessGuard><StaffEvaluations /></PlanAccessGuard>} />
           <Route path="/staff/reports" element={<PlanAccessGuard><HRReports /></PlanAccessGuard>} />
           <Route path="/staff/departments" element={<PlanAccessGuard><Departments /></PlanAccessGuard>} />
           <Route path="/staff/career" element={<PlanAccessGuard><CareerLadder /></PlanAccessGuard>} />
           <Route path="/student-directory" element={<StudentDirectory />} />
           <Route path="/grades" element={<Grades />} />
           <Route path="/print-results" element={<PlanAccessGuard><PrintResults /></PlanAccessGuard>} />
           <Route path="/audit-log" element={<PlanAccessGuard><AuditLog /></PlanAccessGuard>} />
           <Route path="/library" element={<PlanAccessGuard><Library /></PlanAccessGuard>} />
           <Route path="/virtual-classroom/:id" element={<VirtualClassroom />} />
           <Route path="/admin-virtual-classrooms" element={<PlanAccessGuard><AdminVirtualClassrooms /></PlanAccessGuard>} />
           <Route path="/admin-chats" element={<PlanAccessGuard><AdminChats /></PlanAccessGuard>} />
           <Route path="/official-announcements" element={<PlanAccessGuard><OfficialAnnouncements /></PlanAccessGuard>} />
           <Route path="/bus-routes" element={<PlanAccessGuard><BusRouteManagement /></PlanAccessGuard>} />
           <Route path="/store" element={<PlanAccessGuard><Store /></PlanAccessGuard>} />
           <Route path="/store/inventory" element={<PlanAccessGuard><StoreInventory /></PlanAccessGuard>} />
           <Route path="/store/categories" element={<PlanAccessGuard><StoreCategories /></PlanAccessGuard>} />
           <Route path="/store/pos" element={<PlanAccessGuard><StorePOS /></PlanAccessGuard>} />
           <Route path="/store/orders" element={<PlanAccessGuard><SalesOrders /></PlanAccessGuard>} />
           <Route path="/store/reports" element={<PlanAccessGuard><SalesReports /></PlanAccessGuard>} />
           <Route path="/counseling" element={<PlanAccessGuard><CounselingDashboard /></PlanAccessGuard>} />
           <Route path="/counseling/cases" element={<PlanAccessGuard><CounselingCases /></PlanAccessGuard>} />
           <Route path="/counseling/:id" element={<PlanAccessGuard><CounselingCaseDetail /></PlanAccessGuard>} />
           <Route path="/renew-subscription" element={<RenewSubscription />} />
        </Route>
        
        <Route path="/teacher-portal" element={<TeacherPortal />} />
        <Route path="/parent-portal" element={<ParentPortal />} />
        <Route path="/bus-supervisor" element={<BusSupervisorPortal />} />
        <Route path="/staff-portal" element={<StaffPortal />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <LanguageProvider>
      <Router>
        <QueryClientProvider client={queryClientInstance}>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/founder-login" element={<FounderLogin />} />
              <Route
                path="/founder-dashboard"
                element={
                  <FounderGuard>
                    <FounderDashboard />
                  </FounderGuard>
                }
              />
              <Route
                path="/*"
                element={
                  <AuthProvider>
                    <BranchProvider>
                      <RoleGate>
                      <AuthenticatedApp />
                    </RoleGate>
                  </BranchProvider>
                  </AuthProvider>
                }
              />
            </Routes>
          </Suspense>
          <Toaster />
          <SonnerToaster richColors position="top-right" />
        </QueryClientProvider>
      </Router>
    </LanguageProvider>
  );
}

export default App;

