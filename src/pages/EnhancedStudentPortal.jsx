import YouTubePlayerModal from "@/components/video/YouTubePlayerModal";
import YouTubeVideoCard from "@/components/video/YouTubeVideoCard";
import React, { useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/dbClient";
import { useLanguage } from "@/lib/LanguageContext";
import { useAuth } from "@/lib/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, ClipboardCheck, Video, BarChart3,
  Search, LogOut, Clock, Eye, EyeOff, PlayCircle, FileText,
  Play, GraduationCap, Send, BookMarked, Download,
  CheckCircle2, AlertCircle, MessageCircle,
  UserCheck, Loader2, Megaphone, Award, Sparkles,
  ArrowUpRight, ChevronLeft, MapPin, Calendar, Fingerprint, CreditCard
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import StudentIDCard from "@/components/student-dashboard/StudentIDCard";
import VisualSchedule from "@/components/schedule/VisualSchedule";
import StudentLevelsXP from "@/components/student-dashboard/StudentLevelsXP";
import PortalGrades from "@/components/portal/PortalGrades";

const btnPrimary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold transition-all bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer shadow-lg disabled:opacity-50";
const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold transition-all border-2 border-stone-200 bg-white text-stone-700 hover:bg-stone-50 hover:border-stone-300 cursor-pointer";

const SIDEBAR_ITEMS = [
  { id: "dashboard", icon: BarChart3, label: "لوحة التحكم", labelEn: "Dashboard" },
  { id: "my-teacher", icon: UserCheck, label: "معلمي", labelEn: "My Teacher" },
  { id: "teachers", icon: Users, label: "معلمون", labelEn: "Teachers" },
  { id: "attendance", icon: Fingerprint, label: "الحضور والgate", labelEn: "Attendance" },
  { id: "grades", icon: Award, label: "الدرجات", labelEn: "Grades" },
  { id: "schedule", icon: Calendar, label: "الجدول", labelEn: "Schedule" },
  { id: "assignments", icon: ClipboardCheck, label: "الواجبات", labelEn: "Assignments" },
  { id: "exams", icon: FileText, label: "الامتحانات", labelEn: "Exams" },
  { id: "live", icon: Video, label: "الحصص المباشرة", labelEn: "Live Classes" },
  { id: "videos", icon: PlayCircle, label: "فيديوهات يوتيوب", labelEn: "YouTube" },
  { id: "levels", icon: Sparkles, label: "المستويات", labelEn: "Levels & XP" },
  { id: "announcements", icon: Megaphone, label: "الإعلانات", labelEn: "Announcements" },
  { id: "curriculum", icon: BookMarked, label: "الكتب الدراسية", labelEn: "Curriculum" },
];

export default function StudentPortal() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const { logout, login, user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "dashboard";

  const studentId = localStorage.getItem("portal_user_id");
  const studentName = localStorage.getItem("portal_user_name") || "";

  // Login state for unauthenticated users
  const [loginMode, setLoginMode] = useState(!studentId);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const handleStudentLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    try {
      await login("student", loginEmail.trim(), loginPassword);
      setLoginMode(false);
      window.location.reload();
    } catch (err) {
      setLoginError(err.message || (isRTL ? "فشل تسجيل الدخول" : "Login failed"));
    } finally {
      setLoginLoading(false);
    }
  };

  const setActiveTab = (tab) => setSearchParams({ tab });

  const handleLogout = () => {
    localStorage.removeItem("portal_role");
    localStorage.removeItem("portal_user_id");
    localStorage.removeItem("portal_user_name");
    logout(false);
    window.location.href = "/";
  };

  // Queries
  const { data: subscriptions = [], isLoading: loadingSubscriptions } = useQuery({
    queryKey: ["student-subscriptions", studentId],
    queryFn: () => entities.TeacherSubscription.list("-created_at", { student_id: studentId }),
    enabled: !!studentId,
  });

  const approvedTeachers = subscriptions?.filter(s => s.status === "approved") || [];
  const pendingSubs = subscriptions?.filter(s => s.status === "pending") || [];

  const teacherIds = approvedTeachers.map(s => s.teacher_id).filter(Boolean);

  const { data: allAssignments = [], isLoading: loadingAssignments } = useQuery({
    queryKey: ["student-assignments", teacherIds],
    queryFn: () => Promise.all(teacherIds.map(tid => entities.TeacherAssignment.list("-due_date", { teacher_id: tid }))).then(r => r.flat()),
    enabled: teacherIds.length > 0,
  });

  const { data: allExams = [], isLoading: loadingExams } = useQuery({
    queryKey: ["student-exams", teacherIds],
    queryFn: () => Promise.all(teacherIds.map(tid => entities.TeacherExam.list("-created_at", { teacher_id: tid }))).then(r => r.flat()),
    enabled: teacherIds.length > 0,
  });

  const { data: allLiveClasses = [], isLoading: loadingLiveClasses } = useQuery({
    queryKey: ["student-live-classes", teacherIds],
    queryFn: () => Promise.all(teacherIds.map(tid => entities.TeacherLiveClass.list("-scheduled_at", { teacher_id: tid }))).then(r => r.flat()),
    enabled: teacherIds.length > 0,
  });

  const { data: allVideos = [], isLoading: loadingVideos } = useQuery({
    queryKey: ["student-videos", teacherIds],
    queryFn: () => Promise.all(teacherIds.map(tid => entities.TeacherYoutubeVideo.list("-created_at", { teacher_id: tid }))).then(r => r.flat().filter(v => !v.is_hidden)),
    enabled: teacherIds.length > 0,
  });

  const { data: curriculumBooks = [], isLoading: loadingBooks } = useQuery({
    queryKey: ["curriculum-books"],
    queryFn: () => entities.CurriculumBook.list("-grade", {}),
  });

  const { data: bonds = [] } = useQuery({
    queryKey: ["student-bonds", studentId],
    queryFn: () => fetch(`/api/teacher-bonds?studentId=${studentId}`, {
      headers: { "Authorization": `Bearer ${localStorage.getItem("portal_jwt_token") || localStorage.getItem("token") || ""}` },
    }).then(r => r.json()).then(d => Array.isArray(d) ? d : []).catch(() => []),
    enabled: !!studentId,
  });

  const { data: mySubmissions = [], isLoading: loadingSubmissions } = useQuery({
    queryKey: ["student-submissions", studentId],
    queryFn: () => entities.TeacherSubmission.list("-submitted_at", { student_id: studentId }),
    enabled: !!studentId,
  });

  const studentGrade = useMemo(() => {
    try {
      const raw = localStorage.getItem("portal_student_grade");
      if (raw) return raw;
      const user = JSON.parse(localStorage.getItem("portal_user") || "{}");
      return user?.grade || "";
    } catch { return ""; }
  }, []);

  const { data: studentSchedules = [], isLoading: loadingSchedules } = useQuery({
    queryKey: ["student-schedules", studentGrade],
    queryFn: () => entities.ClassSchedule.list("-day_of_week", studentGrade ? { grade: studentGrade } : {}),
  });

  const { data: studentTasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ["student-tasks", studentGrade],
    queryFn: () => entities.TeacherTask.list("-due_date", studentGrade ? { grade: studentGrade } : {}),
  });

  const { data: studentAwards = [], isLoading: loadingAwards } = useQuery({
    queryKey: ["student-awards", studentId],
    queryFn: () => entities.StudentAward.list("-created_at", { student_id: studentId }),
    enabled: !!studentId,
  });

  const { data: officialAnnouncements = [], isLoading: loadingAnnouncements } = useQuery({
    queryKey: ["student-announcements"],
    queryFn: () => entities.OfficialAnnouncement.list("-created_at", 50),
  });

  const studentAnnouncements = useMemo(() =>
    (officialAnnouncements || []).filter(a =>
      a.target_audience === "students" || a.target_audience === "all" || !a.target_audience
    ), [officialAnnouncements]);

  const { data: attendanceLogs = [], isLoading: loadingAttendance } = useQuery({
    queryKey: ["student-attendance", studentId],
    queryFn: () => entities.Attendance.list("-created_at", { student_id: studentId }),
    enabled: !!studentId,
  });

  const stats = useMemo(() => {
    const awardsXP = (studentAwards || []).reduce((sum, a) => sum + (a.xp || a.points || 0), 0);
    const homeworkXP = (mySubmissions || []).reduce((sum, s) => sum + (s.grade || 0) * 2, 0);
    const presentDays = (attendanceLogs || []).filter(a => a.status === "present" || a.status === "gate_passed").length;
    const attendanceXP = presentDays * 50;
    const baseXP = 500;
    const totalXP = baseXP + awardsXP + homeworkXP + attendanceXP;
    const studentLevel = Math.floor(totalXP / 200);
    return {
      teachers: approvedTeachers.length,
      pendingSubs: pendingSubs.length,
      assignments: allAssignments?.length || 0,
      exams: allExams?.length || 0,
      liveClasses: allLiveClasses?.filter(c => c.status === "scheduled" || c.status === "live")?.length || 0,
      videos: allVideos?.length || 0,
      books: curriculumBooks?.length || 0,
      submissions: mySubmissions?.length || 0,
      graded: mySubmissions?.filter(s => s.status === "graded")?.length || 0,
      awards: studentAwards?.length || 0,
      attendance: attendanceLogs?.length || 0,
      announcements: studentAnnouncements?.length || 0,
      xp: totalXP,
      level: studentLevel,
      todaySchedules: (studentSchedules || []).filter(s => {
        const dayNames = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
        const today = dayNames[new Date().getDay()];
        return s.day_of_week === today;
      }),
    };
  }, [approvedTeachers, pendingSubs, allAssignments, allExams, allLiveClasses, allVideos, curriculumBooks, mySubmissions, studentAwards, attendanceLogs, studentAnnouncements, studentSchedules]);

  // Login screen for unauthenticated users
  if (loginMode || !studentId) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4" dir={isRTL ? "rtl" : "ltr"}>
        <div className="w-full max-w-md">
          <div className="bg-white rounded-[28px] shadow-xl p-8 border border-stone-200">
            <div className="text-center mb-8">
              <div className="h-16 w-16 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto mb-4">
                <GraduationCap size={32} />
              </div>
              <h1 className="text-2xl font-black text-stone-900">
                {isRTL ? "بوابة الطالب" : "Student Portal"}
              </h1>
              <p className="text-sm text-stone-500 mt-2">
                {isRTL ? "سجّل الدخول لمتابعة دروسك" : "Sign in to track your classes"}
              </p>
            </div>

            <form onSubmit={handleStudentLogin} className="space-y-4">
              {loginError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-bold flex items-center gap-2">
                  <AlertCircle size={16} />
                  {loginError}
                </div>
              )}

              <div>
                <label htmlFor="field-enhancedstudentportal-input-6" className="block text-sm font-bold text-stone-700 mb-1.5">
                  {isRTL ? "البريد الإلكتروني أو الرقم الأكاديمي" : "Email or Student ID"}
                </label>
                <input id="field-enhancedstudentportal-input-6" name="input_6" aria-label="input 6"
                  type="text"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder={isRTL ? "أدخل البريد الإلكتروني أو الرقم الأكاديمي" : "Enter email or student ID"}
                  className="w-full h-12 rounded-xl border-2 border-stone-200 bg-white px-4 text-sm font-bold focus:border-blue-500 focus:ring-0 outline-none"
                  required
                />
              </div>

              <div>
                <label htmlFor="field-enhancedstudentportal-input-5" className="block text-sm font-bold text-stone-700 mb-1.5">
                  {isRTL ? "كلمة المرور" : "Password"}
                </label>
                <div className="relative">
                  <input id="field-enhancedstudentportal-input-5" name="input_5" aria-label="input 5"
                    type={showLoginPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder={isRTL ? "أدخل كلمة المرور" : "Enter password"}
                    className="w-full h-12 rounded-xl border-2 border-stone-200 bg-white px-4 pr-12 text-sm font-bold focus:border-blue-500 focus:ring-0 outline-none"
                    required
                  />
                  <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                    {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loginLoading || !loginEmail || !loginPassword}
                className="w-full h-12 rounded-xl bg-blue-600 text-white font-black text-sm hover:bg-blue-700 transition-all disabled:opacity-50 shadow-lg">
                {loginLoading ? (isRTL ? "جاري الدخول..." : "Signing in...") : (isRTL ? "تسجيل الدخول" : "Sign In")}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link to="/student-register" className="text-sm font-bold text-blue-600 hover:text-blue-700 block">
                {isRTL ? "ليس لديك حساب؟ سجّل كطالب جديد" : "No account? Register as a student"}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isInitialLoading = loadingSubscriptions && !subscriptions.length;

  return (
    <div className="min-h-screen bg-stone-50 flex" dir={isRTL ? "rtl" : "ltr"}>
      {/* Initial loading overlay */}
      {isInitialLoading && (
        <div className="fixed inset-0 z-50 bg-stone-50/80 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={32} className="animate-spin text-blue-600" />
            <p className="text-sm font-bold text-stone-600">{isRTL ? "جاري التحميل..." : "Loading..."}</p>
          </div>
        </div>
      )}
      {/* Sidebar */}
      <aside className={`hidden lg:flex w-64 bg-white ${isRTL ? 'border-l' : 'border-r'} border-stone-200 flex-col fixed inset-y-0 ${isRTL ? 'right-0' : 'left-0'} z-30`}>
        <div className="p-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <GraduationCap size={20} />
            </div>
            <div>
              <div className="font-black text-sm text-stone-900">{isRTL ? "بوابة الطالب" : "Student Portal"}</div>
              <div className="text-xs text-stone-500 truncate max-w-[150px]">{studentName}</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {SIDEBAR_ITEMS.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === item.id ? "bg-blue-50 text-blue-700" : "text-stone-600 hover:bg-stone-50"}`}>
              <item.icon size={18} />
              <span>{isRTL ? item.label : item.labelEn}</span>
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-stone-100">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-all">
            <LogOut size={18} /> {isRTL ? "خروج" : "Logout"}
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-stone-200 h-14 flex items-center px-4 gap-3">
        <GraduationCap size={20} className="text-blue-600" />
        <span className="font-black text-sm">{studentName}</span>
        <button onClick={handleLogout} className={`${isRTL ? 'mr-auto' : 'ml-auto'} text-red-600`}><LogOut size={18} /></button>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-stone-200 h-16 flex items-center justify-around px-2">
        {SIDEBAR_ITEMS.slice(0, 5).map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg ${activeTab === item.id ? "text-blue-600" : "text-stone-400"}`}>
            <item.icon size={20} />
            <span className="text-[10px] font-bold">{isRTL ? item.label.split(" ").pop() : item.labelEn.split(" ").pop()}</span>
          </button>
        ))}
      </div>

      {/* Main Content */}
      <main className={`flex-1 ${isRTL ? 'lg:mr-64' : 'lg:ml-64'} pt-14 lg:pt-0 pb-20 lg:pb-0`}>
        <div className="max-w-6xl mx-auto p-4 md:p-6">
          <AnimatePresence mode="wait">
            {activeTab === "dashboard" && <DashboardTab key="dashboard" stats={stats} studentId={studentId} studentName={studentName} isRTL={isRTL} setActiveTab={setActiveTab} studentAnnouncements={studentAnnouncements} />}
            {activeTab === "my-teacher" && <MyTeacherTab key="my-teacher" approvedTeachers={approvedTeachers} pendingSubs={pendingSubs} studentId={studentId} isRTL={isRTL} queryClient={queryClient} />}
            {activeTab === "teachers" && <TeachersTab key="teachers" studentId={studentId} subscriptions={subscriptions} approvedTeachers={approvedTeachers} pendingSubs={pendingSubs} bonds={bonds} isRTL={isRTL} queryClient={queryClient} />}
            {activeTab === "attendance" && <AttendanceTab key="attendance" attendanceLogs={attendanceLogs} stats={stats} studentId={studentId} isRTL={isRTL} />}
            {activeTab === "grades" && <GradesTab key="grades" studentId={studentId} studentGrade={studentGrade} isRTL={isRTL} />}
            {activeTab === "schedule" && <ScheduleTab key="schedule" schedules={studentSchedules} tasks={studentTasks} isRTL={isRTL} />}
            {activeTab === "assignments" && <AssignmentsTab key="assignments" assignments={allAssignments} mySubmissions={mySubmissions} studentId={studentId} isRTL={isRTL} queryClient={queryClient} />}
            {activeTab === "exams" && <ExamsTab key="exams" exams={allExams} mySubmissions={mySubmissions} studentId={studentId} isRTL={isRTL} queryClient={queryClient} />}
            {activeTab === "live" && <LiveClassesTab key="live" liveClasses={allLiveClasses} isRTL={isRTL} />}
            {activeTab === "videos" && <VideosTab key="videos" videos={allVideos} isRTL={isRTL} />}
            {activeTab === "levels" && <LevelsTab key="levels" student={{ id: studentId, name: studentName, grade: studentGrade }} studentAwards={studentAwards} assignments={allAssignments} submissions={mySubmissions} attendanceLogs={attendanceLogs} isRTL={isRTL} />}
            {activeTab === "announcements" && <AnnouncementsTab key="announcements" announcements={studentAnnouncements} isRTL={isRTL} />}
            {activeTab === "curriculum" && <CurriculumTab key="curriculum" books={curriculumBooks} isRTL={isRTL} />}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// ─── Dashboard Tab ───
function DashboardTab({ stats, studentId, studentName, isRTL, setActiveTab, studentAnnouncements }) {
  const dayNames = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
  const todayIdx = new Date().getDay();
  const todayEn = dayNames[todayIdx];
  const todayAr = ["الأحد","الإثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"][todayIdx];

  const quickStats = [
    { label: isRTL ? "واجبات" : "Assignments", value: stats.assignments, icon: ClipboardCheck, color: "bg-amber-50 text-amber-600", tab: "assignments" },
    { label: isRTL ? "امتحانات" : "Exams", value: stats.exams, icon: FileText, color: "bg-purple-50 text-purple-600", tab: "exams" },
    { label: isRTL ? "حصص مباشرة" : "Live", value: stats.liveClasses, icon: Video, color: "bg-emerald-50 text-emerald-600", tab: "live" },
    { label: isRTL ? "فيديوهات" : "Videos", value: stats.videos, icon: PlayCircle, color: "bg-red-50 text-red-600", tab: "videos" },
    { label: isRTL ? "شهادات" : "Awards", value: stats.awards, icon: Award, color: "bg-orange-50 text-orange-600", tab: "levels" },
    { label: isRTL ? "حضور" : "Attendance", value: stats.attendance, icon: Fingerprint, color: "bg-blue-50 text-blue-600", tab: "attendance" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
      <h1 className="text-xl font-black text-stone-900">{isRTL ? "لوحة التحكم" : "Dashboard"}</h1>

      {/* Student ID Card + XP Level Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StudentIDCard studentId={studentId} studentName={studentName} size="md" />
        <Card className="p-5 rounded-2xl border-stone-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
              <Sparkles size={16} className="text-amber-500" /> {isRTL ? "المستوى والخبرة" : "Level & XP"}
            </h3>
            <Badge className="text-[10px] bg-blue-50 text-blue-700">Lvl {stats.level}</Badge>
          </div>
          <div className="text-3xl font-black text-stone-900 mb-1">{stats.xp.toLocaleString()} <span className="text-sm text-stone-400">XP</span></div>
          <Progress value={((stats.xp % 200) / 200) * 100} className="h-2 bg-stone-100" />
          <div className="text-xs text-stone-400 mt-1">{200 - (stats.xp % 200)} {isRTL ? "XP للمستوى التالي" : "XP to next level"}</div>
          <button onClick={() => setActiveTab("levels")} className="mt-3 text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
            {isRTL ? "التفاصيل" : "Details"} <ArrowUpRight size={12} />
          </button>
        </Card>
      </div>

      {/* Today's Schedule */}
      {stats.todaySchedules?.length > 0 && (
        <Card className="p-4 rounded-2xl border-stone-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
              <Calendar size={16} className="text-blue-500" /> {isRTL ? `جدول اليوم (${todayAr})` : `Today's Schedule (${todayEn})`}
            </h3>
            <button onClick={() => setActiveTab("schedule")} className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              {isRTL ? "عرض الكل" : "View All"} <ArrowUpRight size={12} />
            </button>
          </div>
          <div className="space-y-2">
            {stats.todaySchedules.map((s, i) => (
              <div key={s.id || i} className="flex items-center gap-3 p-2 rounded-xl bg-stone-50">
                <div className="text-xs font-bold text-blue-600 w-16">{s.start_time || ""}</div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-stone-900">{s.subject || s.title || ""}</div>
                  <div className="text-xs text-stone-500">{s.teacher_name || ""} {s.classroom ? `- ${s.classroom}` : ""}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Announcements */}
      {stats.announcements > 0 && (
        <Card className="p-4 rounded-2xl border-stone-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
              <Megaphone size={16} className="text-emerald-500" /> {isRTL ? "آخر الإعلانات" : "Recent Announcements"}
            </h3>
            <button onClick={() => setActiveTab("announcements")} className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              {isRTL ? "عرض الكل" : "View All"} <ArrowUpRight size={12} />
            </button>
          </div>
          <div className="space-y-2">
            {(studentAnnouncements || []).slice(0, 3).map(a => (
              <div key={a.id} className="p-2 rounded-xl bg-stone-50">
                <div className="text-sm font-bold text-stone-900">{a.title}</div>
                <div className="text-xs text-stone-500 line-clamp-1">{a.body || a.content || ""}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {quickStats.map((c, i) => (
          <button key={i} onClick={() => setActiveTab(c.tab)} className={`p-3 rounded-2xl border border-stone-100 bg-white hover:bg-stone-50 transition-all text-left`}>
            <div className={`h-8 w-8 rounded-lg ${c.color} flex items-center justify-center mb-2`}>
              <c.icon size={16} />
            </div>
            <div className="text-lg font-black text-stone-900">{c.value}</div>
            <div className="text-[10px] text-stone-500 font-bold leading-tight">{c.label}</div>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Teachers Tab (Subscribe/Unsubscribe) ───
function TeachersTab({ studentId, subscriptions, approvedTeachers, pendingSubs, bonds, isRTL, queryClient }) {
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [teacherCode, setTeacherCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscribingTo, setSubscribingTo] = useState(null);

  // Fetch all independent teachers
  const { data: independentTeachers = [], isLoading: loadingTeachers } = useQuery({
    queryKey: ["independent-teachers"],
    queryFn: () => fetch("/api/independent-teachers").then(r => r.json()).catch(() => []),
  });

  // IDs of teachers we already have a bond with
  const bondedTeacherIds = new Set([
    ...bonds.map(b => b.teacher_id),
    ...approvedTeachers.map(s => s.teacher_id),
    ...pendingSubs.map(s => s.teacher_id),
  ]);

   const handleSubscribe = async (targetTeacherId, targetTeacherName) => {
     const useId = targetTeacherId || teacherCode.trim();
     if (!useId) { toast.error(isRTL ? "أدخل كود المعلم" : "Enter teacher code"); return; }
     setLoading(true);
     try {
       const payload = {
         studentId,
         studentName: localStorage.getItem("portal_user_name") || "",
         studentEmail: localStorage.getItem("portal_user_email") || "",
         teacherId: useId,
         teacherName: targetTeacherName || "",
         requestMessage: isRTL ? "طلب اشتراك من الطالب" : "Subscription request from student",
       };
       await fetch("/api/student-bond-request", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(payload),
       }).then(async r => { const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error || "Failed"); return d; });
       queryClient.invalidateQueries({ queryKey: ["teacher-bonds"] });
       setShowSubscribe(false);
       setTeacherCode("");
       setSubscribingTo(null);
       toast.success(isRTL ? "تم إرسال طلب الاشتراك" : "Subscription request sent");
     } catch (e) { toast.error(e.message); }
     setLoading(false);
   };

  const handleUnsubscribe = async (id) => {
    if (!confirm(isRTL ? "هل تريد إلغاء الاشتراك؟" : "Unsubscribe from this teacher?")) return;
    try {
      await entities.TeacherSubscription.delete(id);
      queryClient.invalidateQueries({ queryKey: ["student-subscriptions"] });
      toast.success(isRTL ? "تم الإلغاء" : "Unsubscribed");
    } catch (e) { toast.error(e.message); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-black">{isRTL ? "المعلمون" : "Teachers"}</h1>
        <button onClick={() => setShowSubscribe(true)} className={btnPrimary}><Users size={16} />{isRTL ? "اشترك مع معلم" : "Subscribe to Teacher"}</button>
      </div>

      {/* Enrolled Teachers */}
      {approvedTeachers.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-black text-stone-700 mb-3">{isRTL ? "المعلمون المسجلون" : "Enrolled Teachers"}</h3>
          <div className="grid gap-3">
            {approvedTeachers.map(s => (
              <Card key={s.id} className="p-4 rounded-2xl border-stone-100 flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-sm shrink-0">
                  {(s.teacher_name || s.teacher_id || "م").charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-stone-900">{s.teacher_name || (isRTL ? "معلم" : "Teacher")}</div>
                  <div className="text-xs text-stone-500">{s.plan === "student_free" ? (isRTL ? "اشتراك مجاني" : "Free subscription") : `${s.plan} - $${s.amount}`}</div>
                  {s.expires_at && <div className="text-xs text-stone-400">{isRTL ? "ينتهي" : "Expires"}: {new Date(s.expires_at).toLocaleDateString(isRTL ? "ar" : "en")}</div>}
                </div>
                <button onClick={() => handleUnsubscribe(s.id)} className="text-red-500 hover:text-red-700 text-xs font-bold">{isRTL ? "إلغاء" : "Unsubscribe"}</button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Pending Requests */}
      {pendingSubs.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-black text-stone-700 mb-3">{isRTL ? "طلبات معلقة" : "Pending Requests"}</h3>
          <div className="grid gap-3">
            {pendingSubs.map(s => (
              <Card key={s.id} className="p-4 rounded-2xl border-stone-100 flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Clock size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-stone-900">{isRTL ? "طلب اشتراك" : "Subscription Request"}</div>
                  <div className="text-xs text-stone-500">{isRTL ? "في انتظار موافقة المعلم" : "Awaiting teacher approval"}</div>
                </div>
                <Badge className="text-[10px] bg-amber-50 text-amber-700">{isRTL ? "معلق" : "Pending"}</Badge>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Pending Bond Requests */}
      {bonds.filter(b => b.status === "pending").length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-black text-stone-700 mb-3">{isRTL ? "طلبات ربط معلقة" : "Pending Bond Requests"}</h3>
          <div className="grid gap-3">
            {bonds.filter(b => b.status === "pending").map(b => (
              <Card key={b.id} className="p-4 rounded-2xl border-stone-100 flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                  <UserCheck size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-stone-900">{b.teacher_name || (isRTL ? "معلم" : "Teacher")}</div>
                  <div className="text-xs text-stone-500">{isRTL ? "في انتظار موافقة المعلم" : "Awaiting teacher approval"}</div>
                  {b.receipt_url && <div className="text-[10px] text-emerald-600 font-bold mt-1">{isRTL ? "تم رفع الإيصال" : "Receipt uploaded"} ✓</div>}
                </div>
                <Badge className="text-[10px] bg-amber-50 text-amber-700">{isRTL ? "معلق" : "Pending"}</Badge>
              </Card>
            ))}
          </div>
        </div>
      )}

       {/* Payment Pending Bonds (Approved but awaiting payment) */}
       {bonds.filter(b => b.status === "approved" && b.payment_status === "pending_payment").length > 0 && (
         <div className="mb-6">
           <h3 className="text-sm font-black text-amber-700 mb-3">{isRTL ? "بانتظار الدفع" : "Awaiting Payment"}</h3>
           <div className="grid gap-3">
             {bonds.filter(b => b.status === "approved" && b.payment_status === "pending_payment").map(b => (
               <Card key={b.id} className="p-4 rounded-2xl border-amber-200 bg-amber-50/30">
                 <div className="flex items-center gap-4">
                   <div className="h-10 w-10 rounded-full bg-amber-200 text-amber-700 flex items-center justify-center shrink-0">
                     <Clock size={18} />
                   </div>
                   <div className="flex-1 min-w-0">
                     <div className="text-sm font-bold text-stone-900">{b.teacher_name || (isRTL ? "معلم" : "Teacher")}</div>
                     <div className="text-xs text-stone-600 font-bold mt-1">{isRTL ? "رقم الحساب" : "Bank Account"}: {b.teacher_bank_account}</div>
                     {b.payment_receipt_url && <div className="text-[10px] text-emerald-600 font-bold mt-1">{isRTL ? "تم رفع الإيصال ✓" : "Receipt uploaded ✓"}</div>}
                   </div>
                   <Badge className="text-[10px] bg-amber-500 text-white">{isRTL ? "بانتظار الدفع" : "Payment Pending"}</Badge>
                 </div>
               </Card>
             ))}
           </div>
         </div>
       )}

       {/* Approved Bonds */}
       {bonds.filter(b => b.status === "approved" && b.payment_status === "confirmed").length > 0 && (
         <div className="mb-6">
           <h3 className="text-sm font-black text-stone-700 mb-3">{isRTL ? "روابط مقبولة" : "Approved Bonds"}</h3>
           <div className="grid gap-3">
             {bonds.filter(b => b.status === "approved" && b.payment_status === "confirmed").map(b => (
               <Card key={b.id} className="p-4 rounded-2xl border-stone-100 flex items-center gap-4">
                 <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                   <CheckCircle2 size={18} />
                 </div>
                 <div className="flex-1 min-w-0">
                   <div className="text-sm font-bold text-stone-900">{b.teacher_name || (isRTL ? "معلم" : "Teacher")}</div>
                   {b.portal_username && <div className="text-xs text-stone-500">{isRTL ? "اسم المستخدم" : "Username"}: <span className="font-mono font-bold text-stone-700">{b.portal_username}</span></div>}
                 </div>
                 <Badge className="text-[10px] bg-emerald-50 text-emerald-700">{isRTL ? "مقبول ✓" : "Approved ✓"}</Badge>
               </Card>
             ))}
           </div>
         </div>
       )}

      {/* Browse Independent Teachers */}
      <div className="mb-6">
        <h3 className="text-sm font-black text-stone-700 mb-3 flex items-center gap-2">
          <GraduationCap size={16} className="text-indigo-600" />
          {isRTL ? "المعلمون المستقلون" : "Independent Teachers"}
          <span className="text-xs font-normal text-stone-400">({independentTeachers.length})</span>
        </h3>
        {loadingTeachers ? (
          <div className="flex items-center justify-center py-8"><Loader2 size={24} className="animate-spin text-stone-400" /></div>
        ) : independentTeachers.length > 0 ? (
          <div className="grid gap-3">
 {independentTeachers.map(t => {
                const isBonded = bondedTeacherIds.has(t.id);
                const isSubscribing = subscribingTo === t.id;
                const bond = bonds.find(b => b.teacher_id === t.id);
                const isPaymentPending = bond && bond.status === "approved" && bond.payment_status === "pending_payment";
                const isConfirmed = bond && bond.status === "approved" && bond.payment_status === "confirmed";
                return (
                  <Card key={t.id} className="p-4 rounded-2xl border-stone-100 flex flex-col items-center text-center">
                    <div className="h-16 w-16 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xl shrink-0 mb-3">
                      {(t.full_name || "م").charAt(0)}
                    </div>
                    <div className="font-bold text-stone-900 text-sm">{t.full_name || (isRTL ? "معلم" : "Teacher")}</div>
                    {t.subjects && <div className="text-xs text-stone-500 mb-1">{t.subjects}</div>}
                     {isConfirmed ? (
                       <Badge className="text-[10px] bg-emerald-50 text-emerald-700 flex items-center gap-1 mt-1"><CheckCircle2 size={10}/>{isRTL ? "مسجل ✓" : "Joined ✓"}</Badge>
                     ) : isPaymentPending ? (
                       <div className="space-y-2 w-full mt-2">
                         <div className="text-xs font-bold text-amber-600">{isRTL ? "رقم الحساب" : "Bank Account"}: {bond.teacher_bank_account}</div>
                         <div className="space-y-1.5">
                           <input type="file" accept="image/*" onChange={e => {
                             const file = e.target.files[0];
                             if (!file) return;
                             const reader = new FileReader();
                             reader.onload = async () => {
                               const base64 = reader.result.split(",")[1];
                               await fetch("/api/bond-upload-receipt", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("portal_jwt_token") || localStorage.getItem("token") || ""}` }, body: JSON.stringify({ bondId: bond.id, receiptFile: base64, receiptName: file.name }) }).then(r => r.json()).catch(() => {});
                               queryClient.invalidateQueries({ queryKey: ["teacher-bonds"] });
                               queryClient.invalidateQueries({ queryKey: ["independent-teachers"] });
                               toast.success(isRTL ? "تم رفع الإيصال" : "Receipt uploaded");
                             };
                             reader.readAsDataURL(file);
                           }}
                             className="w-full rounded-lg border border-amber-200 bg-white p-2 text-[10px] file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-amber-600 file:text-white file:text-[10px] file:font-bold file:cursor-pointer" />
                           <button onClick={() => setSubscribingTo(null)} className="flex-1 text-[10px] font-bold py-1.5 rounded-lg border border-stone-200 text-stone-600">{isRTL ? "إلغاء" : "Cancel"}</button>
                         </div>
                       </div>
                     ) : isSubscribing ? (
                       <div className="space-y-2 w-full mt-2">
                         <div className="flex items-center justify-center gap-2 text-amber-600">
                           <Loader2 size={14} className="animate-spin" />
                           <span className="text-xs font-bold">{isRTL ? "في انتظار الموافقة" : "Awaiting approval"}</span>
                         </div>
                         <div className="flex gap-1">
                           <button onClick={() => setSubscribingTo(null)} className="flex-1 text-[10px] font-bold py-1.5 rounded-lg border border-stone-200 text-stone-600">{isRTL ? "إلغاء" : "Cancel"}</button>
                         </div>
                       </div>
                     ) : (
                       <button onClick={() => setSubscribingTo(t.id)} className="mt-2 w-full text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 py-2 rounded-xl">
                         {isRTL ? "طلب اشتراك في درس خصوصي" : "Request Private Lesson"}
                       </button>
                     )}
                  </Card>
                );
             })}
          </div>
        ) : (
          <Card className="p-6 rounded-2xl border-stone-100 text-center">
            <GraduationCap size={32} className="text-stone-300 mx-auto mb-2" />
            <div className="text-xs font-bold text-stone-500">{isRTL ? "لا يوجد معلمون مستقلون بعد" : "No independent teachers yet"}</div>
          </Card>
        )}
      </div>

      {approvedTeachers.length === 0 && pendingSubs.length === 0 && bonds.length === 0 && independentTeachers.length === 0 && (
        <Card className="p-8 rounded-2xl border-stone-100 text-center">
          <Users size={40} className="text-stone-300 mx-auto mb-3" />
          <div className="text-sm font-bold text-stone-500 mb-2">{isRTL ? "لم تسجل مع أي معلم بعد" : "You haven't subscribed to any teacher yet"}</div>
          <div className="text-xs text-stone-400 mb-4">{isRTL ? "اسأل معلمك عن كود الاشتراك" : "Ask your teacher for their subscription code"}</div>
          <button onClick={() => setShowSubscribe(true)} className={btnPrimary}><Users size={16} />{isRTL ? "اشترك الآن" : "Subscribe Now"}</button>
        </Card>
      )}

      <Dialog open={showSubscribe} onOpenChange={setShowSubscribe}>
        <DialogContent className="max-w-sm rounded-[24px]" dir={isRTL ? "rtl" : "ltr"}>
           <DialogHeader><DialogTitle className="font-black">{isRTL ? "اشتراك مع معلم" : "Subscribe to Teacher"}</DialogTitle></DialogHeader>
           <div className="space-y-3 p-1">
             <div className="text-xs text-stone-500">{isRTL ? "أدخل كود المعلم الذي تحصله منه على الدروس" : "Enter the teacher code you received from your teacher"}</div>
             <Input placeholder={isRTL ? "كود المعلم" : "Teacher code"} value={teacherCode} onChange={e => setTeacherCode(e.target.value)} className="h-10 rounded-xl font-mono text-center text-lg tracking-wider" dir="ltr" />
           </div>
           <DialogFooter className="gap-2">
             <button onClick={() => setShowSubscribe(false)} className={btnOutline}>{isRTL ? "إلغاء" : "Cancel"}</button>
             <button onClick={() => handleSubscribe(null, null)} disabled={loading} className={btnPrimary}>{loading ? "..." : isRTL ? "إرسال" : "Send"}</button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

// ─── Assignments Tab ───
function AssignmentsTab({ assignments, mySubmissions, studentId, isRTL, queryClient }) {
  const [showSubmit, setShowSubmit] = useState(null);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const submittedIds = new Set(mySubmissions?.map(s => s.assignment_id) || []);

  const handleSubmit = async () => {
    if (!answer.trim()) { toast.error(isRTL ? "أدخل إجابتك" : "Enter your answer"); return; }
    setLoading(true);
    try {
      const assignment = assignments.find(a => a.id === showSubmit);
      await entities.TeacherSubmission.create({
        assignment_id: showSubmit,
        student_id: studentId,
        student_name: localStorage.getItem("portal_user_name") || "",
        teacher_id: assignment?.teacher_id,
        answer_text: answer,
        status: "submitted",
      });
      queryClient.invalidateQueries({ queryKey: ["student-submissions"] });
      setShowSubmit(null);
      setAnswer("");
      toast.success(isRTL ? "تم تسليم الواجب" : "Assignment submitted");
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <h1 className="text-xl font-black mb-4">{isRTL ? "الواجبات" : "Assignments"}</h1>
      <div className="grid gap-3">
        {assignments?.map(a => {
          const submitted = submittedIds.has(a.id);
          const sub = mySubmissions?.find(s => s.assignment_id === a.id);
          return (
            <Card key={a.id} className="p-4 rounded-2xl border-stone-100">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-black text-stone-900">{a.title}</div>
                    {submitted && <Badge className="text-[10px] bg-emerald-50 text-emerald-700">{isRTL ? "تم التسليم" : "Submitted"}</Badge>}
                    {sub?.status === "graded" && <Badge className="text-[10px] bg-blue-50 text-blue-700">{sub.grade}/{a.total_points}</Badge>}
                  </div>
                  <div className="text-xs text-stone-500 mt-1">{a.description || ""}</div>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {a.subject && <Badge className="text-[10px] bg-blue-50 text-blue-700">{a.subject}</Badge>}
                    {a.grade && <Badge className="text-[10px] bg-purple-50 text-purple-700">{isRTL ? `صف ${a.grade}` : `Grade ${a.grade}`}</Badge>}
                    {a.due_date && <Badge className="text-[10px] bg-amber-50 text-amber-700"><Clock size={10} className="ml-1" />{new Date(a.due_date).toLocaleDateString(isRTL ? "ar" : "en")}</Badge>}
                    <Badge className="text-[10px] bg-stone-100 text-stone-600">{a.total_points} {isRTL ? "نقطة" : "pts"}</Badge>
                  </div>
                </div>
                {!submitted && (
                  <button onClick={() => setShowSubmit(a.id)} className="h-8 px-3 rounded-lg bg-blue-500 text-white text-xs font-bold hover:bg-blue-600 shrink-0">
                    {isRTL ? "تسليم" : "Submit"}
                  </button>
                )}
              </div>
            </Card>
          );
        })}
        {(!assignments || assignments.length === 0) && (
          <Card className="p-8 rounded-2xl border-stone-100 text-center">
            <ClipboardCheck size={40} className="text-stone-300 mx-auto mb-3" />
            <div className="text-sm font-bold text-stone-500">{isRTL ? "لا يوجد واجبات حالياً" : "No assignments yet"}</div>
            <div className="text-xs text-stone-400">{isRTL ? "اشترك مع معلم لرؤية الواجبات" : "Subscribe to a teacher to see assignments"}</div>
          </Card>
        )}
      </div>

      <Dialog open={!!showSubmit} onOpenChange={() => setShowSubmit(null)}>
        <DialogContent className="max-w-md rounded-[24px]" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader><DialogTitle className="font-black">{isRTL ? "تسليم الواجب" : "Submit Assignment"}</DialogTitle></DialogHeader>
          <div className="space-y-3 p-1">
            <textarea id="field-enhancedstudentportal-write-your-answer-here" name="write_your_answer_here" aria-label="write your answer here" placeholder={isRTL ? "اكتب إجابتك هنا..." : "Write your answer here..."} value={answer} onChange={e => setAnswer(e.target.value)}
              className="w-full h-32 rounded-xl border border-stone-200 p-3 text-sm" />
          </div>
          <DialogFooter className="gap-2">
            <button onClick={() => setShowSubmit(null)} className={btnOutline}>{isRTL ? "إلغاء" : "Cancel"}</button>
            <button onClick={handleSubmit} disabled={loading} className={btnPrimary}>{loading ? "..." : isRTL ? "تسليم" : "Submit"}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

// ─── Exams Tab ───
function ExamsTab({ exams, mySubmissions, studentId, isRTL, queryClient }) {
  const [showExam, setShowExam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);

  const submittedExamIds = new Set(mySubmissions?.filter(s => s.exam_id)?.map(s => s.exam_id) || []);

  const handleSubmitExam = async () => {
    setLoading(true);
    try {
      const exam = exams.find(e => e.id === showExam);
      await entities.TeacherSubmission.create({
        exam_id: showExam,
        student_id: studentId,
        student_name: localStorage.getItem("portal_user_name") || "",
        teacher_id: exam?.teacher_id,
        answers,
        status: "submitted",
      });
      queryClient.invalidateQueries({ queryKey: ["student-submissions"] });
      setShowExam(null);
      setAnswers({});
      toast.success(isRTL ? "تم تسليم الامتحان" : "Exam submitted");
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <h1 className="text-xl font-black mb-4">{isRTL ? "الامتحانات" : "Exams"}</h1>
      <div className="grid gap-3">
        {exams?.map(e => {
          const submitted = submittedExamIds.has(e.id);
          return (
            <Card key={e.id} className="p-4 rounded-2xl border-stone-100">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-black text-stone-900">{e.title}</div>
                    {submitted && <Badge className="text-[10px] bg-emerald-50 text-emerald-700">{isRTL ? "تم التسليم" : "Submitted"}</Badge>}
                  </div>
                  <div className="text-xs text-stone-500 mt-1">{e.description || ""}</div>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {e.subject && <Badge className="text-[10px] bg-blue-50 text-blue-700">{e.subject}</Badge>}
                    {e.grade && <Badge className="text-[10px] bg-purple-50 text-purple-700">{isRTL ? `صف ${e.grade}` : `Grade ${e.grade}`}</Badge>}
                    <Badge className="text-[10px] bg-amber-50 text-amber-700"><Clock size={10} className="ml-1" />{e.duration_minutes} {isRTL ? "دقيقة" : "min"}</Badge>
                    <Badge className="text-[10px] bg-stone-100 text-stone-600">{e.total_points} {isRTL ? "نقطة" : "pts"}</Badge>
                    {Array.isArray(e.questions) && <Badge className="text-[10px] bg-cyan-50 text-cyan-700">{e.questions.length} {isRTL ? "سؤال" : "Q"}</Badge>}
                  </div>
                </div>
                {!submitted && (
                  <button onClick={() => { setShowExam(e.id); setAnswers({}); }} className="h-8 px-3 rounded-lg bg-purple-500 text-white text-xs font-bold hover:bg-purple-600 shrink-0">
                    {isRTL ? "ابدأ" : "Start"}
                  </button>
                )}
              </div>
            </Card>
          );
        })}
        {(!exams || exams.length === 0) && (
          <Card className="p-8 rounded-2xl border-stone-100 text-center">
            <FileText size={40} className="text-stone-300 mx-auto mb-3" />
            <div className="text-sm font-bold text-stone-500">{isRTL ? "لا يوجد امتحانات حالياً" : "No exams yet"}</div>
          </Card>
        )}
      </div>

      <Dialog open={!!showExam} onOpenChange={() => setShowExam(null)}>
        <DialogContent className="max-w-lg rounded-[24px] max-h-[80vh] overflow-y-auto" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader><DialogTitle className="font-black">{isRTL ? "امتحان" : "Exam"}</DialogTitle></DialogHeader>
          <div className="space-y-4 p-1">
            {exams?.find(e => e.id === showExam)?.questions?.map((q, i) => (
              <div key={q.id || i} className="p-3 bg-stone-50 rounded-xl">
                <div className="text-sm font-bold text-stone-900 mb-2">{i + 1}. {q.question}</div>
                {q.type === "multiple_choice" && q.options?.map((opt, j) => (
                  <label htmlFor={`${q.id}-opt-${j}`} key={j} className="flex items-center gap-2 p-2 rounded-lg hover:bg-stone-100 cursor-pointer text-sm">
                    <input id={`${q.id}-opt-${j}`} aria-label={`${q.id}-opt-${j}`} type="radio" name={q.id} checked={answers[q.id] === opt} onChange={() => setAnswers({ ...answers, [q.id]: opt })} className="text-blue-600" />
                    <span className="text-stone-700">{opt}</span>
                  </label>
                ))}
                {(q.type === "text" || !q.options) && (
                  <textarea id={`${q.id}-text`} aria-label={`${q.id}-text`} placeholder={isRTL ? "إجابتك..." : "Your answer..."} value={answers[q.id] || ""} onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })}
                    className="w-full h-20 rounded-xl border border-stone-200 p-2 text-sm mt-2" />
                )}
              </div>
            ))}
            {(!exams?.find(e => e.id === showExam)?.questions || exams.find(e => e.id === showExam)?.questions?.length === 0) && (
              <div className="text-center py-6 text-stone-400 text-sm">{isRTL ? "لا يوجد أسئلة" : "No questions"}</div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <button onClick={() => setShowExam(null)} className={btnOutline}>{isRTL ? "إلغاء" : "Cancel"}</button>
            <button onClick={handleSubmitExam} disabled={loading} className={btnPrimary}>{loading ? "..." : isRTL ? "تسليم" : "Submit"}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

// ─── Live Classes Tab ───
function LiveClassesTab({ liveClasses, isRTL }) {
  const getStatusBadge = (status) => {
    const map = { scheduled: { label: isRTL ? "مجدول" : "Scheduled", cls: "bg-blue-50 text-blue-700" }, live: { label: isRTL ? "مباشر الآن" : "Live Now", cls: "bg-red-50 text-red-700 animate-pulse" }, ended: { label: isRTL ? "منتهي" : "Ended", cls: "bg-stone-100 text-stone-500" } };
    const s = map[status] || map.scheduled;
    return <Badge className={`text-[10px] ${s.cls}`}>{s.label}</Badge>;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <h1 className="text-xl font-black mb-4">{isRTL ? "الحصص المباشرة" : "Live Classes"}</h1>
      <div className="grid gap-3">
        {liveClasses?.map(c => (
          <Card key={c.id} className="p-4 rounded-2xl border-stone-100">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="text-sm font-black text-stone-900">{c.title}</div>
                  {getStatusBadge(c.status)}
                </div>
                <div className="text-xs text-stone-500 mt-1">{c.description || ""}</div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {c.subject && <Badge className="text-[10px] bg-blue-50 text-blue-700">{c.subject}</Badge>}
                  {c.grade && <Badge className="text-[10px] bg-purple-50 text-purple-700">{isRTL ? `صف ${c.grade}` : `Grade ${c.grade}`}</Badge>}
                  {c.scheduled_at && <Badge className="text-[10px] bg-amber-50 text-amber-700"><Clock size={10} className="ml-1" />{new Date(c.scheduled_at).toLocaleString(isRTL ? "ar" : "en")}</Badge>}
                  <Badge className="text-[10px] bg-stone-100 text-stone-600">{c.duration_minutes} {isRTL ? "دقيقة" : "min"}</Badge>
                </div>
              </div>
              {c.status === "live" && c.room_url && (
                <a href={c.room_url} target="_blank" rel="noopener noreferrer"
                  className="h-8 px-3 rounded-lg bg-red-500 text-white text-xs font-bold hover:bg-red-600 flex items-center gap-1 shrink-0 animate-pulse">
                  <Play size={12} /> {isRTL ? "انضم" : "Join"}
                </a>
              )}
            </div>
          </Card>
        ))}
        {(!liveClasses || liveClasses.length === 0) && (
          <Card className="p-8 rounded-2xl border-stone-100 text-center">
            <Video size={40} className="text-stone-300 mx-auto mb-3" />
            <div className="text-sm font-bold text-stone-500">{isRTL ? "لا يوجد حصص مباشرة" : "No live classes yet"}</div>
          </Card>
        )}
      </div>
    </motion.div>
  );
}

// ─── YouTube Videos Tab ───
function VideosTab({ videos, isRTL, studentId, teacherIds = [] }) {
  const [activeVideo, setActiveVideo] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");

  const handleCopyLink = (v) => {
    if (!v.youtube_url) return;
    navigator.clipboard.writeText(v.youtube_url);
    setCopiedId(v.id);
    toast.success(isRTL ? "تم نسخ رابط الحصة" : "Lesson link copied");
    setTimeout(() => setCopiedId(null), 2500);
  };

  const subjects = Array.from(new Set((videos || []).map(v => v.subject).filter(Boolean)));
  const filtered = (videos || []).filter(v => {
    const matchSearch = !search || 
      v.title?.toLowerCase().includes(search.toLowerCase()) || 
      v.description?.toLowerCase().includes(search.toLowerCase());
    const matchSubject = !selectedSubject || v.subject === selectedSubject;
    return matchSearch && matchSubject;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 to-stone-800 text-white p-6 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="h-8 w-8 rounded-xl bg-red-600 flex items-center justify-center text-white">
              <PlayCircle size={18} />
            </div>
            <h1 className="text-xl font-black">{isRTL ? "فيديوهات الحصص المسجلة" : "Recorded Class Videos"}</h1>
          </div>
          <p className="text-xs text-stone-300 max-w-xl leading-relaxed">
            {isRTL
              ? "استعرض وشاهد الحصص المسجلة التي أضافها معلمك مباشرة داخل المنصة بجودة عالية وبشكل آمن."
              : "Watch lessons recorded by your teacher smoothly and securely inside the platform."}
          </p>
        </div>

        <Badge className="bg-red-600/90 text-white border-0 text-xs font-bold px-3 py-1.5 shrink-0 self-start md:self-auto">
          {filtered.length} {isRTL ? "حصة متاحة" : "Lessons available"}
        </Badge>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <Input
            placeholder={isRTL ? "بحث في عنوان أو وصف الحصة..." : "Search lesson title or description..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 pr-9 pl-3 rounded-xl border-stone-200 text-sm font-semibold"
          />
        </div>

        {subjects.length > 0 && (
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="h-10 px-3 rounded-xl border border-stone-200 bg-white text-xs font-bold text-stone-700 outline-none"
          >
            <option value="">{isRTL ? "جميع المواد" : "All Subjects"}</option>
            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
      </div>

      {/* Videos Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(v => (
            <YouTubeVideoCard
              key={v.id}
              video={v}
              isRTL={isRTL}
              isTeacher={false}
              onPlay={(vid) => setActiveVideo(vid)}
              onCopyLink={handleCopyLink}
              copiedId={copiedId}
            />
          ))}
        </div>
      ) : (
        <Card className="p-12 rounded-3xl border-stone-200/80 text-center space-y-3 bg-white">
          <div className="h-16 w-16 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-2">
            <PlayCircle size={36} />
          </div>
          <h3 className="text-base font-black text-stone-800">
            {isRTL ? "لا توجد حصص مسجلة متاحة حالياً" : "No recorded lessons available right now"}
          </h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
            {isRTL
              ? "عندما يقوم معلمك المشترك معه برفع حصص مسجلة جديدة، ستظهر هنا تلقائياً لتتمكن من مشاهدتها."
              : "When your enrolled teacher adds recorded lessons, they will appear here automatically."}
          </p>
        </Card>
      )}

      {/* Embedded Player Modal */}
      {activeVideo && (
        <YouTubePlayerModal
          video={activeVideo}
          isOpen={!!activeVideo}
          onClose={() => setActiveVideo(null)}
          isRTL={isRTL}
          canManage={false}
        />
      )}
    </motion.div>
  );
}
// ─── Curriculum Books Tab ───
function CurriculumTab({ books, isRTL }) {
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");

  const filtered = books?.filter(b => {
    const matchSearch = !search || b.title?.toLowerCase().includes(search.toLowerCase()) || b.subject?.toLowerCase().includes(search.toLowerCase());
    const matchGrade = !gradeFilter || b.grade === gradeFilter;
    return matchSearch && matchGrade;
  }) || [];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <h1 className="text-xl font-black mb-4">{isRTL ? "الكتب الدراسية" : "Curriculum Books"}</h1>
      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <Input placeholder={isRTL ? "بحث بالاسم أو المادة..." : "Search by title or subject..."} value={search} onChange={e => setSearch(e.target.value)} className="h-10 rounded-xl" prefix={<Search size={14} />} />
        </div>
        <select id="field-enhancedstudentportal-select-1" name="select_1" aria-label="select 1" value={gradeFilter} onChange={e => setGradeFilter(e.target.value)} className="h-10 rounded-xl border border-stone-200 bg-white px-3 text-sm">
          <option value="">{isRTL ? "جميع الصفوف" : "All Grades"}</option>
          {["1","2","3","4","5","6","7","8","9","10","11","12"].map(g => <option key={g} value={g}>{isRTL ? `صف ${g}` : `Grade ${g}`}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(b => (
          <Card key={b.id} className="p-4 rounded-2xl border-stone-100">
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0">
                <BookMarked size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-black text-stone-900">{b.title}</div>
                <div className="text-xs text-stone-500">{b.author || ""}</div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {b.subject && <Badge className="text-[10px] bg-blue-50 text-blue-700">{b.subject}</Badge>}
                  {b.grade && <Badge className="text-[10px] bg-purple-50 text-purple-700">{isRTL ? `صف ${b.grade}` : `Grade ${b.grade}`}</Badge>}
                  {b.semester && <Badge className="text-[10px] bg-amber-50 text-amber-700">{b.semester}</Badge>}
                </div>
                {b.description && <div className="text-xs text-stone-400 mt-1 line-clamp-2">{b.description}</div>}
                {b.pdf_url && (
                  <a href={b.pdf_url} target="_blank" rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800">
                    <Download size={12} /> {isRTL ? "تحميل الكتاب" : "Download Book"}
                  </a>
                )}
              </div>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card className="p-8 rounded-2xl border-stone-100 text-center col-span-full">
            <BookMarked size={40} className="text-stone-300 mx-auto mb-3" />
            <div className="text-sm font-bold text-stone-500">{isRTL ? "لا يوجد كتب" : "No books found"}</div>
            <div className="text-xs text-stone-400">{isRTL ? "لم يتم إضافة كتب الدراسة بعد" : "No curriculum books added yet"}</div>
          </Card>
        )}
      </div>
    </motion.div>
  );
}

// ─── My Teacher Tab ───
function MyTeacherTab({ approvedTeachers, pendingSubs, studentId, isRTL, queryClient }) {
  const [activeVideo, setActiveVideo] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [videoSearch, setVideoSearch] = useState("");
  const [videoSubjectFilter, setVideoSubjectFilter] = useState("");

  const { data: myBonds = [], isLoading: loadingBonds } = useQuery({
    queryKey: ["student-bonds", studentId],
    queryFn: () => fetch(`/api/teacher-bonds?studentId=${studentId}`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("portal_jwt_token") || localStorage.getItem("token") || ""}` },
      })
      .then(r => r.json())
      .then(d => Array.isArray(d) ? d : (d?.bonds || []))
      .catch(() => []),
    enabled: !!studentId,
  });

  const approvedBondTeachers = myBonds?.filter(b => b.status === "approved") || [];
  const pendingBondRequests = myBonds?.filter(b => b.status === "pending") || [];
  const hasApprovedTeacher = approvedTeachers?.length > 0 || approvedBondTeachers.length > 0;

  // Secure query for teacher recorded class videos
  const { data: teacherVideos = [], isLoading: loadingVideos } = useQuery({
    queryKey: ["student-portal-teacher-videos", studentId],
    queryFn: async () => {
      try {
        const token = localStorage.getItem("portal_jwt_token") || localStorage.getItem("token") || "";
        const res = await fetch(`/api/student/teacher-videos?studentId=${studentId}`, {
          headers: token ? { "Authorization": `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.videos)) return json.videos;
        }
      } catch (err) {
        console.warn("Secure videos endpoint fallback:", err);
      }
      // Fallback
      const allTeacherIds = [
        ...(approvedTeachers || []).map(t => t.teacher_id),
        ...(approvedBondTeachers || []).map(b => b.teacher_id)
      ].filter(Boolean);

      if (allTeacherIds.length > 0) {
        const r = await Promise.all(
          allTeacherIds.map(tid => entities.TeacherYoutubeVideo.list("-created_at", { teacher_id: tid }))
        );
        return r.flat().filter(v => !v.is_hidden);
      }
      return [];
    },
    enabled: !!studentId && hasApprovedTeacher,
  });

  const handleCopyLink = (v) => {
    if (!v.youtube_url) return;
    navigator.clipboard.writeText(v.youtube_url);
    setCopiedId(v.id);
    toast.success(isRTL ? "تم نسخ رابط الحصة" : "Lesson link copied");
    setTimeout(() => setCopiedId(null), 2500);
  };

  const videoSubjects = Array.from(new Set(teacherVideos.map(v => v.subject).filter(Boolean)));
  const filteredTeacherVideos = teacherVideos.filter(v => {
    const matchSearch = !videoSearch || 
      v.title?.toLowerCase().includes(videoSearch.toLowerCase()) || 
      v.description?.toLowerCase().includes(videoSearch.toLowerCase());
    const matchSubject = !videoSubjectFilter || v.subject === videoSubjectFilter;
    return matchSearch && matchSubject;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-stone-900 flex items-center gap-2">
          <UserCheck size={22} className="text-indigo-600" /> {isRTL ? "معلمي الخاص والتفاعل الأكاديمي" : "My Teacher"}
        </h1>
      </div>

      {/* No teacher assigned state */}
      {!hasApprovedTeacher && (
        <Card className="p-8 rounded-3xl border-stone-200/80 text-center bg-white shadow-sm">
          <div className="h-16 w-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <UserCheck size={32} />
          </div>
          <h2 className="text-lg font-black text-stone-900 mb-2">{isRTL ? "لم يتم تفعيل اشتراكك مع معلم بعد" : "No teacher assigned yet"}</h2>
          <p className="text-xs text-stone-500 mb-4 max-w-md mx-auto leading-relaxed">
            {isRTL 
              ? "للوصول إلى الحصص المسجلة والواجبات والامتحانات، انتقل إلى قسم المعلمين وأرسل طلب اشتراك لمعلمك."
              : "To access recorded classes and assignments, visit the Teachers section and send a subscription request."}
          </p>
        </Card>
      )}

      {/* Approved Teachers Section */}
      {hasApprovedTeacher && (
        <div>
          <h2 className="text-sm font-bold text-stone-700 mb-3 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-500" />
            {isRTL ? "المعلمون المعتمدون" : "Enrolled Teachers"} ({approvedTeachers.length + approvedBondTeachers.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {approvedTeachers.map(sub => (
              <Card key={sub.id} className="p-4 rounded-2xl border-stone-200/80 bg-white shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <GraduationCap size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-stone-900 truncate">{sub.teacher_name || (isRTL ? "معلم" : "Teacher")}</div>
                    <div className="text-xs text-stone-500">{sub.subject || (isRTL ? "غير محدد" : "Not specified")}</div>
                    <Badge className="mt-1 text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">{isRTL ? "اشتراك معتمد ✓" : "Approved ✓"}</Badge>
                  </div>
                  {sub.teacher_phone && (
                    <a href={`tel:${sub.teacher_phone}`} className="h-8 px-3 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 flex items-center gap-1 shrink-0">
                      <MessageCircle size={12} /> {isRTL ? "تواصل" : "Contact"}
                    </a>
                  )}
                </div>
              </Card>
            ))}
            {approvedBondTeachers.map(bond => (
              <Card key={bond.id} className="p-4 rounded-2xl border-stone-200/80 bg-white shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                    <GraduationCap size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-stone-900 truncate">{bond.teacher_name || (isRTL ? "معلم" : "Teacher")}</div>
                    <div className="text-xs text-stone-500 truncate">{bond.teacher_email}</div>
                    <Badge className="mt-1 text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200">{isRTL ? "ربط مباشر معتمد ✓" : "Bonded ✓"}</Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ─── قسم فيديوهات الحصص (Class Videos Section) ─── */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-red-600 text-white flex items-center justify-center">
              <PlayCircle size={16} />
            </div>
            <h2 className="text-base font-black text-stone-900">
              {isRTL ? "فيديوهات الحصص المسجلة" : "Class Video Lessons"}
            </h2>
            {hasApprovedTeacher && (
              <Badge className="bg-stone-100 text-stone-700 text-xs font-bold px-2 py-0.5">
                {filteredTeacherVideos.length} {isRTL ? "حصة" : "lessons"}
              </Badge>
            )}
          </div>
        </div>

        {/* If student has approved teachers: show search and videos grid */}
        {hasApprovedTeacher ? (
          <div className="space-y-4">
            {/* Filter toolbar */}
            <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-sm flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <Input
                  placeholder={isRTL ? "بحث في حصص المعلم المسجلة..." : "Search teacher lessons..."}
                  value={videoSearch}
                  onChange={(e) => setVideoSearch(e.target.value)}
                  className="h-9 pr-9 pl-3 rounded-xl border-stone-200 text-xs font-semibold"
                />
              </div>

              {videoSubjects.length > 0 && (
                <select
                  value={videoSubjectFilter}
                  onChange={(e) => setVideoSubjectFilter(e.target.value)}
                  className="h-9 px-3 rounded-xl border border-stone-200 bg-white text-xs font-bold text-stone-700 outline-none"
                >
                  <option value="">{isRTL ? "جميع المواد" : "All Subjects"}</option>
                  {videoSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              )}
            </div>

            {/* Video Cards */}
            {loadingVideos ? (
              <div className="py-12 text-center text-stone-400 text-xs flex flex-col items-center justify-center gap-2">
                <Loader2 size={24} className="animate-spin text-emerald-600" />
                <span>{isRTL ? "جاري تحميل حصص المعلم المسجلة..." : "Loading lesson videos..."}</span>
              </div>
            ) : filteredTeacherVideos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTeacherVideos.map(v => (
                  <YouTubeVideoCard
                    key={v.id}
                    video={v}
                    isRTL={isRTL}
                    isTeacher={false}
                    onPlay={(vid) => setActiveVideo(vid)}
                    onCopyLink={handleCopyLink}
                    copiedId={copiedId}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-8 rounded-2xl border-stone-200/80 text-center bg-white">
                <PlayCircle size={36} className="text-stone-300 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-stone-700">
                  {isRTL ? "لا توجد حصص مسجلة من المعلم حالياً" : "No recorded lessons from teacher yet"}
                </h4>
                <p className="text-xs text-stone-400 mt-1">
                  {isRTL ? "سيتم إشعارك فور قيام المعلم بنشر حصص فيديو جديدة." : "You will be notified when the teacher posts new videos."}
                </p>
              </Card>
            )}
          </div>
        ) : (
          /* Locked State if no approved teacher */
          <Card className="p-6 rounded-2xl border-stone-200 bg-stone-50 text-center space-y-2">
            <div className="h-12 w-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <Lock size={20} />
            </div>
            <h4 className="text-sm font-black text-stone-800">
              {isRTL ? "فيديوهات الحصص مغلقة" : "Class Videos Locked"}
            </h4>
            <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
              {isRTL
                ? "هذا القسم مؤمن ومخصص حصرياً للطلاب الذين تمت الموافقة على اشتراكهم مع المعلم. يرجى الاشتراك مع معلم لتفعيل المشاهدة."
                : "This section is exclusive to students approved by their teacher. Please subscribe to a teacher to unlock."}
            </p>
          </Card>
        )}
      </div>

      {/* Pending Bond Requests */}
      {pendingBondRequests.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-stone-700 mb-3 flex items-center gap-2">
            <Clock size={14} className="text-orange-500" />
            {isRTL ? "طلبات انتظار الموافقة" : "Pending Approval"} ({pendingBondRequests.length})
          </h2>
          <div className="space-y-2">
            {pendingBondRequests.map(bond => (
              <Card key={bond.id} className="p-4 rounded-2xl border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                    <Clock size={14} />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-stone-900">{bond.teacher_name || (isRTL ? "معلم" : "Teacher")}</div>
                    <div className="text-xs text-stone-500">{bond.teacher_email}</div>
                  </div>
                </div>
                <Badge className="text-[10px] bg-orange-50 text-orange-700">{isRTL ? "بانتظار الموافقة" : "Awaiting Approval"}</Badge>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Embedded Video Player Modal */}
      {activeVideo && (
        <YouTubePlayerModal
          video={activeVideo}
          isOpen={!!activeVideo}
          onClose={() => setActiveVideo(null)}
          isRTL={isRTL}
          canManage={false}
        />
      )}
    </motion.div>
  );
}
// ─── Attendance / Gate Tab ───
function AttendanceTab({ attendanceLogs, stats, studentId, isRTL }) {
  const [swipeLoading, setSwipeLoading] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const todayLogs = (attendanceLogs || []).filter(a => {
    const d = (a.created_at || a.date || "").slice(0, 10);
    return d === today;
  });
  const alreadySwiped = todayLogs.some(a => a.status === "present" || a.status === "gate_passed");
  const presentDays = (attendanceLogs || []).filter(a => a.status === "present" || a.status === "gate_passed").length;
  const absentDays = (attendanceLogs || []).filter(a => a.status === "absent").length;

  const handleGateSwipe = async (type) => {
    setSwipeLoading(true);
    try {
      await entities.Attendance.create({
        student_id: studentId,
        student_name: localStorage.getItem("portal_user_name") || "",
        status: "gate_passed",
        gate_type: type,
        date: today,
        timestamp: new Date().toISOString(),
      });
      toast.success(type === "entry" ? (isRTL ? "تم تسجيل الدخول" : "Entry recorded") : (isRTL ? "تم تسجيل الخروج" : "Exit recorded"));
    } catch (e) { toast.error(e.message); }
    setSwipeLoading(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
      <h1 className="text-xl font-black text-stone-900 flex items-center gap-2">
        <Fingerprint size={22} className="text-blue-600" /> {isRTL ? "الحضور والبوابة" : "Attendance & Gate"}
      </h1>

      {/* Gate Swipe Buttons */}
      <Card className="p-5 rounded-2xl border-stone-100">
        <h3 className="text-sm font-black text-stone-700 mb-4">{isRTL ? "بوابة اليوم" : "Today's Gate"}</h3>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleGateSwipe("entry")}
            disabled={swipeLoading || alreadySwiped}
            className={`h-20 rounded-2xl font-black text-sm flex flex-col items-center justify-center gap-2 transition-all ${
              alreadySwiped ? "bg-stone-100 text-stone-400" : "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg"
            }`}
          >
            <ArrowUpRight size={24} className={isRTL ? "rotate-[225deg]" : ""} />
            {isRTL ? "دخول" : "Entry"}
          </button>
          <button
            onClick={() => handleGateSwipe("exit")}
            disabled={swipeLoading || !alreadySwiped}
            className={`h-20 rounded-2xl font-black text-sm flex flex-col items-center justify-center gap-2 transition-all ${
              !alreadySwiped ? "bg-stone-100 text-stone-400" : "bg-red-500 text-white hover:bg-red-600 shadow-lg"
            }`}
          >
            <ChevronLeft size={24} className={isRTL ? "rotate-180" : ""} />
            {isRTL ? "خروج" : "Exit"}
          </button>
        </div>
        {todayLogs.length > 0 && (
          <div className="mt-3 text-xs text-stone-500 text-center">
            {isRTL ? "تم التسجيل اليوم" : "Recorded today"}: {todayLogs.length}
          </div>
        )}
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 rounded-2xl border-stone-100 text-center">
          <div className="text-2xl font-black text-emerald-600">{presentDays}</div>
          <div className="text-xs text-stone-500 font-bold">{isRTL ? "ايام حضور" : "Present"}</div>
        </Card>
        <Card className="p-4 rounded-2xl border-stone-100 text-center">
          <div className="text-2xl font-black text-red-600">{absentDays}</div>
          <div className="text-xs text-stone-500 font-bold">{isRTL ? "ايام غياب" : "Absent"}</div>
        </Card>
        <Card className="p-4 rounded-2xl border-stone-100 text-center">
          <div className="text-2xl font-black text-blue-600">{attendanceLogs?.length || 0}</div>
          <div className="text-xs text-stone-500 font-bold">{isRTL ? "الكل" : "Total"}</div>
        </Card>
      </div>

      {/* Attendance Log */}
      <Card className="p-4 rounded-2xl border-stone-100">
        <h3 className="text-sm font-black text-stone-700 mb-3">{isRTL ? "سجل الحضور" : "Attendance Log"}</h3>
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {(attendanceLogs || []).slice(0, 50).map((a, i) => (
            <div key={a.id || i} className="flex items-center justify-between p-2 rounded-xl bg-stone-50">
              <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                  a.status === "present" || a.status === "gate_passed" ? "bg-emerald-100 text-emerald-600"
                    : a.status === "absent" ? "bg-red-100 text-red-600" : "bg-stone-100 text-stone-500"
                }`}>
                  <Fingerprint size={14} />
                </div>
                <div>
                  <div className="text-xs font-bold text-stone-900">{a.gate_type || a.status || ""}</div>
                  <div className="text-[10px] text-stone-500">{a.date || (a.created_at || "").slice(0, 10)}</div>
                </div>
              </div>
              <div className="text-[10px] text-stone-400">{a.timestamp ? new Date(a.timestamp).toLocaleTimeString(isRTL ? "ar" : "en", { hour: "2-digit", minute: "2-digit" }) : ""}</div>
            </div>
          ))}
          {(!attendanceLogs || attendanceLogs.length === 0) && (
            <div className="text-center py-6 text-stone-400 text-sm">
              {isRTL ? "لا يوجد سجلات حضور" : "No attendance records yet"}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

// ─── Grades Tab ───
function GradesTab({ studentId, studentGrade, isRTL }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <h1 className="text-xl font-black text-stone-900 mb-4 flex items-center gap-2">
        <Award size={22} className="text-purple-600" /> {isRTL ? "الدرجات" : "Grades"}
      </h1>
      <PortalGrades studentId={studentId} studentGrade={studentGrade} />
    </motion.div>
  );
}

// ─── Schedule Tab ───
function ScheduleTab({ schedules, tasks, isRTL }) {
  const dayNames = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
  const dayNamesAr = ["الأحد","الإثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];
  const todayIdx = new Date().getDay();

  const classes = (schedules || []).map(s => ({
    id: s.id,
    title: s.subject || s.title || "",
    day: dayNames.indexOf(s.day_of_week),
    startTime: s.start_time || "08:00",
    endTime: s.end_time || "09:00",
    classroom: s.classroom || "",
    teacher: s.teacher_name || "",
  }));

  const taskItems = (tasks || []).map(t => ({
    id: t.id,
    title: t.title || t.description || "",
    dueDate: t.due_date || t.created_at || "",
    subject: t.subject || "",
  }));

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
      <h1 className="text-xl font-black text-stone-900 flex items-center gap-2">
        <Calendar size={22} className="text-blue-600" /> {isRTL ? "الجدول الأسبوعي" : "Weekly Schedule"}
      </h1>

      {/* Day Tabs */}
      <div className="grid grid-cols-7 gap-1">
        {dayNames.map((d, i) => (
          <div key={d} className={`text-center p-2 rounded-xl text-xs font-bold ${i === todayIdx ? "bg-blue-500 text-white" : "bg-stone-100 text-stone-600"}`}>
            {isRTL ? dayNamesAr[i] : d.slice(0, 3)}
          </div>
        ))}
      </div>

      {/* Today's Schedule */}
      <Card className="p-4 rounded-2xl border-stone-100">
        <h3 className="text-sm font-black text-stone-700 mb-3">
          {isRTL ? `اليوم (${dayNamesAr[todayIdx]})` : `Today (${dayNames[todayIdx]})`}
        </h3>
        <div className="space-y-2">
          {classes.filter(c => c.day === todayIdx).length > 0 ? (
            classes.filter(c => c.day === todayIdx).sort((a, b) => a.startTime.localeCompare(b.startTime)).map((c, i) => (
              <div key={c.id || i} className="flex items-center gap-3 p-3 rounded-xl bg-stone-50">
                <div className="text-xs font-mono text-blue-600 w-14">{c.startTime}</div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-stone-900">{c.title}</div>
                  <div className="text-xs text-stone-500">{c.teacher} {c.classroom ? `- ${c.classroom}` : ""}</div>
                </div>
                <div className="text-xs text-stone-400">{c.endTime}</div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-stone-400 text-sm">{isRTL ? "لا حصص اليوم" : "No classes today"}</div>
          )}
        </div>
      </Card>

      {/* All Classes */}
      {classes.length > 0 && (
        <Card className="p-4 rounded-2xl border-stone-100">
          <h3 className="text-sm font-black text-stone-700 mb-3">{isRTL ? "جميع الحصص" : "All Classes"}</h3>
          <VisualSchedule classes={classes} tasks={taskItems} />
        </Card>
      )}

      {classes.length === 0 && (
        <Card className="p-8 rounded-2xl border-stone-100 text-center">
          <Calendar size={40} className="text-stone-300 mx-auto mb-3" />
          <div className="text-sm font-bold text-stone-500">{isRTL ? "لا يوجد جدول بعد" : "No schedule yet"}</div>
        </Card>
      )}
    </motion.div>
  );
}

// ─── Levels & XP Tab ───
function LevelsTab({ student, studentAwards, assignments, submissions, attendanceLogs, isRTL }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <h1 className="text-xl font-black text-stone-900 mb-4 flex items-center gap-2">
        <Sparkles size={22} className="text-amber-500" /> {isRTL ? "المستويات والخبرة" : "Levels & XP"}
      </h1>
      <StudentLevelsXP
        student={student}
        studentAwards={studentAwards}
        assignments={assignments}
        submissions={submissions}
        attendanceLogs={attendanceLogs}
      />
    </motion.div>
  );
}

// ─── Announcements Tab ───
function AnnouncementsTab({ announcements, isRTL }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
      <h1 className="text-xl font-black text-stone-900 flex items-center gap-2">
        <Megaphone size={22} className="text-emerald-600" /> {isRTL ? "الإعلانات" : "Announcements"}
      </h1>

      <div className="grid gap-3">
        {(announcements || []).map(a => (
          <Card key={a.id} className="p-4 rounded-2xl border-stone-100">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Megaphone size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-black text-stone-900">{a.title}</div>
                <div className="text-xs text-stone-500 mt-1">{a.body || a.content || ""}</div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {a.priority && <Badge className={`text-[10px] ${a.priority === "high" ? "bg-red-50 text-red-700" : a.priority === "medium" ? "bg-amber-50 text-amber-700" : "bg-stone-100 text-stone-600"}`}>{a.priority}</Badge>}
                  {a.target_audience && <Badge className="text-[10px] bg-blue-50 text-blue-700">{a.target_audience}</Badge>}
                  <span className="text-[10px] text-stone-400">{a.created_at ? new Date(a.created_at).toLocaleDateString(isRTL ? "ar" : "en") : ""}</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
        {(!announcements || announcements.length === 0) && (
          <Card className="p-8 rounded-2xl border-stone-100 text-center">
            <Megaphone size={40} className="text-stone-300 mx-auto mb-3" />
            <div className="text-sm font-bold text-stone-500">{isRTL ? "لا يوجد إعلانات" : "No announcements"}</div>
          </Card>
        )}
      </div>
    </motion.div>
  );
}