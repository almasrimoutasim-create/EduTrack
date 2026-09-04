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
  Users, BookOpen, ClipboardCheck, Video, Calendar, BarChart3,
  Search, LogOut, ChevronRight, Clock, Eye, EyeOff, PlayCircle, FileText,
  Award, Star, Play, GraduationCap, Send, BookMarked, Download,
  CheckCircle2, AlertCircle, MessageCircle, X, ExternalLink, Copy, Check,
  UserCheck
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const btnPrimary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold transition-all bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer shadow-lg disabled:opacity-50";
const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold transition-all border-2 border-stone-200 bg-white text-stone-700 hover:bg-stone-50 hover:border-stone-300 cursor-pointer";

const SIDEBAR_ITEMS = [
  { id: "dashboard", icon: BarChart3, label: "لوحة التحكم", labelEn: "Dashboard" },
  { id: "my-teacher", icon: UserCheck, label: "معلمي", labelEn: "My Teacher" },
  { id: "teachers", icon: Users, label: "معلمون", labelEn: "Teachers" },
  { id: "assignments", icon: ClipboardCheck, label: "الواجبات", labelEn: "Assignments" },
  { id: "exams", icon: FileText, label: "الامتحانات", labelEn: "Exams" },
  { id: "live", icon: Video, label: "الحصص المباشرة", labelEn: "Live Classes" },
  { id: "videos", icon: PlayCircle, label: "فيديوهات يوتيوب", labelEn: "YouTube" },
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
    window.location.href = "/gateway";
  };

  // Queries
  const { data: subscriptions = [] } = useQuery({
    queryKey: ["student-subscriptions", studentId],
    queryFn: () => entities.TeacherSubscription.list("-created_at", { student_id: studentId }),
    enabled: !!studentId,
  });

  const approvedTeachers = subscriptions?.filter(s => s.status === "approved") || [];
  const pendingSubs = subscriptions?.filter(s => s.status === "pending") || [];

  const teacherIds = approvedTeachers.map(s => s.teacher_id).filter(Boolean);

  const { data: allAssignments = [] } = useQuery({
    queryKey: ["student-assignments", teacherIds],
    queryFn: () => Promise.all(teacherIds.map(tid => entities.TeacherAssignment.list("-due_date", { teacher_id: tid }))).then(r => r.flat()),
    enabled: teacherIds.length > 0,
  });

  const { data: allExams = [] } = useQuery({
    queryKey: ["student-exams", teacherIds],
    queryFn: () => Promise.all(teacherIds.map(tid => entities.TeacherExam.list("-created_at", { teacher_id: tid }))).then(r => r.flat()),
    enabled: teacherIds.length > 0,
  });

  const { data: allLiveClasses = [] } = useQuery({
    queryKey: ["student-live-classes", teacherIds],
    queryFn: () => Promise.all(teacherIds.map(tid => entities.TeacherLiveClass.list("-scheduled_at", { teacher_id: tid }))).then(r => r.flat()),
    enabled: teacherIds.length > 0,
  });

  const { data: allVideos = [] } = useQuery({
    queryKey: ["student-videos", teacherIds],
    queryFn: () => Promise.all(teacherIds.map(tid => entities.TeacherYoutubeVideo.list("-created_at", { teacher_id: tid }))).then(r => r.flat().filter(v => !v.is_hidden)),
    enabled: teacherIds.length > 0,
  });

  const { data: curriculumBooks = [] } = useQuery({
    queryKey: ["curriculum-books"],
    queryFn: () => entities.CurriculumBook.list("-grade", {}),
  });

  const { data: mySubmissions = [] } = useQuery({
    queryKey: ["student-submissions", studentId],
    queryFn: () => entities.TeacherSubmission.list("-submitted_at", { student_id: studentId }),
    enabled: !!studentId,
  });

  const stats = useMemo(() => ({
    teachers: approvedTeachers.length,
    pendingSubs: pendingSubs.length,
    assignments: allAssignments?.length || 0,
    exams: allExams?.length || 0,
    liveClasses: allLiveClasses?.filter(c => c.status === "scheduled" || c.status === "live")?.length || 0,
    videos: allVideos?.length || 0,
    books: curriculumBooks?.length || 0,
    submissions: mySubmissions?.length || 0,
    graded: mySubmissions?.filter(s => s.status === "graded")?.length || 0,
  }), [approvedTeachers, pendingSubs, allAssignments, allExams, allLiveClasses, allVideos, curriculumBooks, mySubmissions]);

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
                <label className="block text-sm font-bold text-stone-700 mb-1.5">
                  {isRTL ? "البريد الإلكتروني أو الرقم الأكاديمي" : "Email or Student ID"}
                </label>
                <input
                  type="text"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder={isRTL ? "أدخل البريد الإلكتروني أو الرقم الأكاديمي" : "Enter email or student ID"}
                  className="w-full h-12 rounded-xl border-2 border-stone-200 bg-white px-4 text-sm font-bold focus:border-blue-500 focus:ring-0 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1.5">
                  {isRTL ? "كلمة المرور" : "Password"}
                </label>
                <div className="relative">
                  <input
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

            <div className="mt-6 text-center space-y-3">
              <Link to="/student-register" className="text-sm font-bold text-blue-600 hover:text-blue-700 block">
                {isRTL ? "ليس لديك حساب؟ سجّل كطالب جديد" : "No account? Register as a student"}
              </Link>
              <Link to="/gateway" className="text-sm font-bold text-stone-500 hover:text-stone-700 block">
                {isRTL ? "العودة للبوابات" : "Back to portals"}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex" dir="rtl">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-l border-stone-200 flex-col fixed inset-y-0 right-0 z-30">
        <div className="p-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <GraduationCap size={20} />
            </div>
            <div>
              <div className="font-black text-sm text-stone-900">بوابة الطالب</div>
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
            <LogOut size={18} /> خروج
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-stone-200 h-14 flex items-center px-4 gap-3">
        <GraduationCap size={20} className="text-blue-600" />
        <span className="font-black text-sm">{studentName}</span>
        <button onClick={handleLogout} className="mr-auto text-red-600"><LogOut size={18} /></button>
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
      <main className="flex-1 lg:mr-64 pt-14 lg:pt-0 pb-20 lg:pb-0">
        <div className="max-w-6xl mx-auto p-4 md:p-6">
          <AnimatePresence mode="wait">
            {activeTab === "dashboard" && <DashboardTab key="dashboard" stats={stats} isRTL={isRTL} />}
            {activeTab === "my-teacher" && <MyTeacherTab key="my-teacher" approvedTeachers={approvedTeachers} pendingSubs={pendingSubs} studentId={studentId} isRTL={isRTL} queryClient={queryClient} />}
            {activeTab === "teachers" && <TeachersTab key="teachers" studentId={studentId} subscriptions={subscriptions} approvedTeachers={approvedTeachers} pendingSubs={pendingSubs} isRTL={isRTL} queryClient={queryClient} />}
            {activeTab === "assignments" && <AssignmentsTab key="assignments" assignments={allAssignments} mySubmissions={mySubmissions} studentId={studentId} isRTL={isRTL} queryClient={queryClient} />}
            {activeTab === "exams" && <ExamsTab key="exams" exams={allExams} mySubmissions={mySubmissions} studentId={studentId} isRTL={isRTL} queryClient={queryClient} />}
            {activeTab === "live" && <LiveClassesTab key="live" liveClasses={allLiveClasses} isRTL={isRTL} />}
            {activeTab === "videos" && <VideosTab key="videos" videos={allVideos} isRTL={isRTL} />}
            {activeTab === "curriculum" && <CurriculumTab key="curriculum" books={curriculumBooks} isRTL={isRTL} />}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// ─── Dashboard Tab ───
function DashboardTab({ stats, isRTL }) {
  const cards = [
    { label: isRTL ? "معلمون مسجلون" : "Enrolled Teachers", value: stats.teachers, icon: Users, color: "bg-blue-50 text-blue-600" },
    { label: isRTL ? "واجبات" : "Assignments", value: stats.assignments, icon: ClipboardCheck, color: "bg-amber-50 text-amber-600" },
    { label: isRTL ? "امتحانات" : "Exams", value: stats.exams, icon: FileText, color: "bg-purple-50 text-purple-600" },
    { label: isRTL ? "حصص مباشرة" : "Live Classes", value: stats.liveClasses, icon: Video, color: "bg-emerald-50 text-emerald-600" },
    { label: isRTL ? "فيديوهات" : "Videos", value: stats.videos, icon: PlayCircle, color: "bg-red-50 text-red-600" },
    { label: isRTL ? "كتب دراسية" : "Books", value: stats.books, icon: BookMarked, color: "bg-cyan-50 text-cyan-600" },
    { label: isRTL ? "واجبات مقدمة" : "Submissions", value: stats.submissions, icon: Award, color: "bg-orange-50 text-orange-600" },
    { label: isRTL ? "تم التصحيح" : "Graded", value: stats.graded, icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <h1 className="text-xl font-black text-stone-900 mb-4">{isRTL ? "لوحة التحكم" : "Dashboard"}</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {cards.map((c, i) => (
          <Card key={i} className="p-4 rounded-2xl border-stone-100">
            <div className={`h-10 w-10 rounded-xl ${c.color} flex items-center justify-center mb-3`}>
              <c.icon size={18} />
            </div>
            <div className="text-2xl font-black text-stone-900">{c.value}</div>
            <div className="text-xs text-stone-500 font-bold">{c.label}</div>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Teachers Tab (Subscribe/Unsubscribe) ───
function TeachersTab({ studentId, subscriptions, approvedTeachers, pendingSubs, isRTL, queryClient }) {
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [teacherCode, setTeacherCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!teacherCode.trim()) { toast.error(isRTL ? "أدخل كود المعلم" : "Enter teacher code"); return; }
    setLoading(true);
    try {
      await entities.TeacherSubscription.create({
        student_id: studentId,
        student_name: localStorage.getItem("portal_user_name") || "",
        teacher_id: teacherCode.trim(),
        status: "pending",
        plan: "student_free",
        amount: 0,
      });
      queryClient.invalidateQueries({ queryKey: ["student-subscriptions"] });
      setShowSubscribe(false);
      setTeacherCode("");
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

      {pendingSubs.length > 0 && (
        <div>
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

      {approvedTeachers.length === 0 && pendingSubs.length === 0 && (
        <Card className="p-8 rounded-2xl border-stone-100 text-center">
          <Users size={40} className="text-stone-300 mx-auto mb-3" />
          <div className="text-sm font-bold text-stone-500 mb-2">{isRTL ? "لم تسجل مع أي معلم بعد" : "You haven't subscribed to any teacher yet"}</div>
          <div className="text-xs text-stone-400 mb-4">{isRTL ? "اسأل معلمك عن كود الاشتراك" : "Ask your teacher for their subscription code"}</div>
          <button onClick={() => setShowSubscribe(true)} className={btnPrimary}><Users size={16} />{isRTL ? "اشترك الآن" : "Subscribe Now"}</button>
        </Card>
      )}

      <Dialog open={showSubscribe} onOpenChange={setShowSubscribe}>
        <DialogContent className="max-w-sm rounded-[24px]" dir="rtl">
          <DialogHeader><DialogTitle className="font-black">{isRTL ? "اشتراك مع معلم" : "Subscribe to Teacher"}</DialogTitle></DialogHeader>
          <div className="space-y-3 p-1">
            <div className="text-xs text-stone-500">{isRTL ? "أدخل كود المعلم الذي تحصله منه على الدروس" : "Enter the teacher code you received from your teacher"}</div>
            <Input placeholder={isRTL ? "كود المعلم" : "Teacher code"} value={teacherCode} onChange={e => setTeacherCode(e.target.value)} className="h-10 rounded-xl font-mono text-center text-lg tracking-wider" dir="ltr" />
          </div>
          <DialogFooter className="gap-2">
            <button onClick={() => setShowSubscribe(false)} className={btnOutline}>{isRTL ? "إلغاء" : "Cancel"}</button>
            <button onClick={handleSubscribe} disabled={loading} className={btnPrimary}>{loading ? "..." : isRTL ? "إرسال" : "Send"}</button>
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
        <DialogContent className="max-w-md rounded-[24px]" dir="rtl">
          <DialogHeader><DialogTitle className="font-black">{isRTL ? "تسليم الواجب" : "Submit Assignment"}</DialogTitle></DialogHeader>
          <div className="space-y-3 p-1">
            <textarea placeholder={isRTL ? "اكتب إجابتك هنا..." : "Write your answer here..."} value={answer} onChange={e => setAnswer(e.target.value)}
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
        <DialogContent className="max-w-lg rounded-[24px] max-h-[80vh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle className="font-black">{isRTL ? "امتحان" : "Exam"}</DialogTitle></DialogHeader>
          <div className="space-y-4 p-1">
            {exams?.find(e => e.id === showExam)?.questions?.map((q, i) => (
              <div key={i} className="p-3 bg-stone-50 rounded-xl">
                <div className="text-sm font-bold text-stone-900 mb-2">{i + 1}. {q.question}</div>
                {q.type === "multiple_choice" && q.options?.map((opt, j) => (
                  <label key={j} className="flex items-center gap-2 p-2 rounded-lg hover:bg-stone-100 cursor-pointer text-sm">
                    <input type="radio" name={`q${i}`} checked={answers[i] === j} onChange={() => setAnswers({ ...answers, [i]: j })} className="text-blue-600" />
                    <span className="text-stone-700">{opt}</span>
                  </label>
                ))}
                {(q.type === "text" || !q.options) && (
                  <textarea placeholder={isRTL ? "إجابتك..." : "Your answer..."} value={answers[i] || ""} onChange={e => setAnswers({ ...answers, [i]: e.target.value })}
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
function VideosTab({ videos, isRTL }) {
  const extractThumbnail = (url) => {
    try {
      const u = new URL(url.replace("youtu.be/", "youtube.com/watch?v="));
      const vid = u.searchParams.get("v");
      return vid ? `https://img.youtube.com/vi/${vid}/mqdefault.jpg` : null;
    } catch { return null; }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <h1 className="text-xl font-black mb-4">{isRTL ? "فيديوهات يوتيوب" : "YouTube Videos"}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {videos?.map(v => (
          <Card key={v.id} className="rounded-2xl border-stone-100 overflow-hidden">
            <a href={v.youtube_url} target="_blank" rel="noopener noreferrer">
              {extractThumbnail(v.youtube_url) ? (
                <div className="relative">
                  <img src={extractThumbnail(v.youtube_url)} alt={v.title} className="w-full h-40 object-cover" />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <div className="h-12 w-12 rounded-full bg-red-600 text-white flex items-center justify-center"><Play size={20} /></div>
                  </div>
                </div>
              ) : (
                <div className="w-full h-40 bg-stone-200 flex items-center justify-center"><PlayCircle size={40} className="text-stone-400" /></div>
              )}
            </a>
            <div className="p-3">
              <div className="text-sm font-black text-stone-900">{v.title}</div>
              <div className="text-xs text-stone-500 mt-1 line-clamp-2">{v.description || ""}</div>
              <div className="flex gap-2 mt-2 flex-wrap">
                {v.subject && <Badge className="text-[10px] bg-blue-50 text-blue-700">{v.subject}</Badge>}
                {v.grade && <Badge className="text-[10px] bg-purple-50 text-purple-700">{isRTL ? `صف ${v.grade}` : `Grade ${v.grade}`}</Badge>}
              </div>
            </div>
          </Card>
        ))}
        {(!videos || videos.length === 0) && (
          <Card className="p-8 rounded-2xl border-stone-100 text-center col-span-full">
            <PlayCircle size={40} className="text-stone-300 mx-auto mb-3" />
            <div className="text-sm font-bold text-stone-500">{isRTL ? "لا يوجد فيديوهات" : "No videos yet"}</div>
          </Card>
        )}
      </div>
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
        <select value={gradeFilter} onChange={e => setGradeFilter(e.target.value)} className="h-10 rounded-xl border border-stone-200 bg-white px-3 text-sm">
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
  const { data: myBonds = [] } = useQuery({
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

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <h1 className="text-xl font-black text-stone-900 mb-4 flex items-center gap-2">
        <UserCheck size={22} className="text-indigo-600" /> {isRTL ? "معلمي" : "My Teacher"}
      </h1>

      {/* No teacher assigned state */}
      {!hasApprovedTeacher && (
        <Card className="p-8 rounded-2xl border-stone-100 text-center mb-6">
          <div className="h-16 w-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <UserCheck size={32} />
          </div>
          <h2 className="text-lg font-black text-stone-900 mb-2">{isRTL ? "لم يتم تعيين معلم لك بعد" : "No teacher assigned yet"}</h2>
          <p className="text-sm text-stone-500 mb-4 max-w-md mx-auto">
            {isRTL ? "يمكنك ربط حسابك بمعلم عن طريق الذهاب إلى قسم المعلمين وإرسال طلب اشتراك" : "You can connect with a teacher by going to the Teachers section and sending a subscription request"}
          </p>
        </Card>
      )}

      {/* Approved Teachers */}
      {hasApprovedTeacher && (
        <div className="mb-6">
          <h2 className="text-sm font-bold text-stone-700 mb-3 flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-500" />
            {isRTL ? "معلمون مسجلون" : "Enrolled Teachers"} ({approvedTeachers.length + approvedBondTeachers.length})
          </h2>
          <div className="space-y-3">
            {approvedTeachers.map(sub => (
              <Card key={sub.id} className="p-4 rounded-2xl border-stone-100">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <GraduationCap size={22} />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm text-stone-900">{sub.teacher_name || isRTL ? "معلم" : "Teacher"}</div>
                    <div className="text-xs text-stone-500">{sub.subject || isRTL ? "غير محدد" : "Not specified"}</div>
                    <Badge className="mt-1 text-[10px] bg-emerald-50 text-emerald-700">{isRTL ? "مقبول ✓" : "Approved ✓"}</Badge>
                  </div>
                  <div className="flex gap-2">
                    {sub.teacher_id && (
                      <>
                        <a href={`tel:${sub.teacher_phone || ""}`} className="h-8 px-3 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 flex items-center gap-1">
                          <MessageCircle size={12} /> {isRTL ? "تواصل" : "Contact"}
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            ))}
            {approvedBondTeachers.map(bond => (
              <Card key={bond.id} className="p-4 rounded-2xl border-stone-100">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <GraduationCap size={22} />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm text-stone-900">{bond.teacher_name || isRTL ? "معلم" : "Teacher"}</div>
                    <div className="text-xs text-stone-500">{bond.teacher_email}</div>
                    <Badge className="mt-1 text-[10px] bg-indigo-50 text-indigo-700">{isRTL ? "ربط مباشر ✓" : "Bonded ✓"}</Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

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
                    <div className="font-bold text-sm text-stone-900">{bond.teacher_name || isRTL ? "معلم" : "Teacher"}</div>
                    <div className="text-xs text-stone-500">{bond.teacher_email}</div>
                  </div>
                </div>
                <Badge className="text-[10px] bg-orange-50 text-orange-700">{isRTL ? "بانتظار الموافقة" : "Awaiting Approval"}</Badge>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Blocked features teaser */}
      {!hasApprovedTeacher && (
        <div className="mt-6">
          <h3 className="text-sm font-bold text-stone-700 mb-3">{isRTL ? "الميزات المتاحة بعد التعيين" : "Features Available After Assignment"}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {[
              { icon: ClipboardCheck, label: isRTL ? "الواجبات" : "Assignments", locked: true },
              { icon: FileText, label: isRTL ? "الامتحانات" : "Exams", locked: true },
              { icon: Video, label: isRTL ? "الحصص المباشرة" : "Live Classes", locked: true },
              { icon: PlayCircle, label: isRTL ? "فيديوهات يوتيوب" : "YouTube Videos", locked: true },
              { icon: BookMarked, label: isRTL ? "الكتب الدراسية" : "Curriculum", locked: false },
            ].map((f, i) => (
              <div key={i} className={`p-3 rounded-xl border ${f.locked ? "border-stone-200 bg-stone-50 opacity-60" : "border-stone-100 bg-white"}`}>
                <div className="flex items-center gap-2">
                  <f.icon size={14} className={f.locked ? "text-stone-400" : "text-blue-600"} />
                  <span className={`text-xs font-bold ${f.locked ? "text-stone-400" : "text-stone-700"}`}>{f.label}</span>
                </div>
                {f.locked && <div className="text-[9px] text-stone-400 mt-1">🔒 {isRTL ? "يتطلب تعيين معلم" : "Requires teacher assignment"}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}