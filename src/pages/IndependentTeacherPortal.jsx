import YouTubePlayerModal, { extractYouTubeId } from "@/components/video/YouTubePlayerModal";
import YouTubeVideoCard from "@/components/video/YouTubeVideoCard";
import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Plus, Search, LogOut, ChevronRight, ChevronDown,
  CheckCircle2, AlertCircle, Clock, Eye, EyeOff, Trash2, Edit,
  PlayCircle, FileText, Award, Star, Play,
   GraduationCap, Copy, X,
   UserCheck, User, RefreshCw, Check, Loader2, CreditCard, Settings, Image as ImageIcon
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const btnPrimary = "inline-flex items-center justify-center text-center gap-2 rounded-xl text-sm font-bold transition-all bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer shadow-lg w-full disabled:opacity-50";
const btnOutline = "inline-flex items-center justify-center text-center gap-2 rounded-xl text-sm font-bold transition-all border-2 border-stone-200 bg-white text-stone-700 hover:bg-stone-50 hover:border-stone-300 cursor-pointer w-full disabled:opacity-50";
const btnDanger = "inline-flex items-center justify-center text-center gap-2 rounded-xl text-sm font-bold transition-all bg-red-500 text-white hover:bg-red-600 cursor-pointer w-full disabled:opacity-50";

const SIDEBAR_ITEMS = [
  { id: "dashboard", icon: BarChart3, label: "لوحة التحكم", labelEn: "Dashboard" },
  { id: "students", icon: Users, label: "طلابي", labelEn: "My Students" },
  { id: "assignments", icon: ClipboardCheck, label: "الواجبات", labelEn: "Assignments" },
  { id: "exams", icon: FileText, label: "الامتحانات", labelEn: "Exams" },
  { id: "live", icon: Video, label: "الحصص المباشرة", labelEn: "Live Classes" },
  { id: "videos", icon: PlayCircle, label: "الحصص المسجلة (يوتيوب)", labelEn: "Recorded Classes" },
  { id: "subscriptions", icon: Star, label: "طلبات الاشتراك", labelEn: "Subscriptions" },
  { id: "bonds", icon: UserCheck, label: "ربط الطلاب", labelEn: "Student Bonds" },
  { id: "settings", icon: Settings, label: "الإعدادات العامة", labelEn: "Settings" },
];

export default function IndependentTeacherPortal() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const { logout, login, user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "dashboard";

  const teacherId = localStorage.getItem("portal_user_id");
  const teacherName = localStorage.getItem("portal_user_name") || "";

  // Login state for unauthenticated users
  const [loginMode, setLoginMode] = useState(!teacherId);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [credentialsDialog, setCredentialsDialog] = useState(null);

  const handleTeacherLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    try {
      await login("teacher", loginEmail.trim(), loginPassword);
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

   const [bankAccount, setBankAccount] = useState("");

   const { data: teacherProfile, isLoading: loadingProfile } = useQuery({
     queryKey: ["teacher-profile", teacherId],
     queryFn: () => fetch(`/api/teacher-profile?teacherId=${teacherId}`, {
       headers: { "Authorization": `Bearer ${localStorage.getItem("portal_jwt_token") || localStorage.getItem("token") || ""}` },
     }).then(r => r.json()).catch(() => null),
     enabled: !!teacherId,
   });

   useEffect(() => { if (teacherProfile?.bank_account) setBankAccount(teacherProfile.bank_account); }, [teacherProfile]);

   // Queries
   const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ["teacher-own-students", teacherId],
    queryFn: () => entities.TeacherOwnStudent.list("-created_at", { teacher_id: teacherId }),
    enabled: !!teacherId,
  });

  const { data: assignments = [], isLoading: loadingAssignments } = useQuery({
    queryKey: ["teacher-assignments", teacherId],
    queryFn: () => entities.TeacherAssignment.list("-created_at", { teacher_id: teacherId }),
    enabled: !!teacherId,
  });

  const { data: exams = [], isLoading: loadingExams } = useQuery({
    queryKey: ["teacher-exams", teacherId],
    queryFn: () => entities.TeacherExam.list("-created_at", { teacher_id: teacherId }),
    enabled: !!teacherId,
  });

  const { data: liveClasses = [], isLoading: loadingLive } = useQuery({
    queryKey: ["teacher-live-classes", teacherId],
    queryFn: () => entities.TeacherLiveClass.list("-scheduled_at", { teacher_id: teacherId }),
    enabled: !!teacherId,
  });

  const { data: videos = [], isLoading: loadingVideos } = useQuery({
    queryKey: ["teacher-youtube-videos", teacherId],
    queryFn: () => entities.TeacherYoutubeVideo.list("-created_at", { teacher_id: teacherId }),
    enabled: !!teacherId,
  });

  const { data: subscriptions = [], isLoading: loadingSubs } = useQuery({
    queryKey: ["teacher-subscriptions", teacherId],
    queryFn: () => entities.TeacherSubscription.list("-created_at", { teacher_id: teacherId }),
    enabled: !!teacherId,
  });

  const { data: submissions = [], isLoading: loadingSubmissions } = useQuery({
    queryKey: ["teacher-submissions", teacherId],
    queryFn: () => entities.TeacherSubmission.list("-submitted_at", { teacher_id: teacherId }),
    enabled: !!teacherId,
  });

  const { data: bonds = [], isLoading: loadingBonds } = useQuery({
    queryKey: ["teacher-bonds", teacherId],
    queryFn: () => fetch(`/api/teacher-bonds?teacherId=${teacherId}`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("portal_jwt_token") || localStorage.getItem("token") || ""}` },
      })
      .then(r => r.json())
      .then(d => Array.isArray(d) ? d : (d?.bonds || []))
      .catch(() => []),
    enabled: !!teacherId,
  });

   const approveBondMutation = useMutation({
     mutationFn: ({ bondId, studentName }) => {
       const username = "std_" + (studentName || "user").replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toLowerCase() + "_" + Math.random().toString(36).slice(2, 6);
       const password = Math.random().toString(36).slice(-8) + Math.random().toString(10).slice(-4);
       return fetch("/api/teacher-bond-approve", {
         method: "POST",
         headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("portal_jwt_token") || localStorage.getItem("token") || ""}` },
         body: JSON.stringify({ bondId, portalUsername: username, portalPassword: password }),
       }).then(async r => { const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error || "غير مصرح"); return { ...d, username, password }; })
     },
     onSuccess: (data) => {
       toast.success(isRTL ? "تم قبول ربط الطالب - انتظر الدفع" : "Bond approved - await payment");
       setCredentialsDialog(data);
       queryClient.invalidateQueries({ queryKey: ["teacher-bonds"] });
     },
     onError: (err) => toast.error(err.message),
   });

   const confirmPaymentMutation = useMutation({
     mutationFn: (bondId) => fetch("/api/bond-confirm-payment", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("portal_jwt_token") || localStorage.getItem("token") || ""}` }, body: JSON.stringify({ bondId }) }).then(async r => { const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error || "Failed"); return d; }),
     onSuccess: () => { toast.success(isRTL ? "تم تأكيد الدفع" : "Payment confirmed"); queryClient.invalidateQueries({ queryKey: ["teacher-bonds"] }); },
     onError: (err) => toast.error(err.message),
   });

  const rejectBondMutation = useMutation({
    mutationFn: (bondId) => fetch("/api/teacher-bond-reject", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("portal_jwt_token") || localStorage.getItem("token") || ""}` }, body: JSON.stringify({ bondId }) }).then(async r => { const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error || "غير مصرح"); return d; }),
    onSuccess: () => { toast.success(isRTL ? "تم رفض ربط الطالب" : "Student bond rejected"); queryClient.invalidateQueries({ queryKey: ["teacher-bonds"] }); },
    onError: (err) => toast.error(err.message),
  });

  const stats = useMemo(() => ({
    students: students?.length || 0,
    assignments: assignments?.length || 0,
    exams: exams?.length || 0,
    liveClasses: liveClasses?.length || 0,
    videos: videos?.length || 0,
    pendingSubs: subscriptions?.filter(s => s.status === "pending")?.length || 0,
    submissions: submissions?.length || 0,
    pendingGrading: submissions?.filter(s => s.status === "submitted")?.length || 0,
    pendingBonds: bonds?.filter(b => b.status === "pending")?.length || 0,
  }), [students, assignments, exams, liveClasses, videos, subscriptions, submissions, bonds]);

  // Login screen for unauthenticated users
  if (loginMode || !teacherId) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4" dir={isRTL ? "rtl" : "ltr"}>
        <div className="w-full max-w-md">
          <div className="bg-white rounded-[28px] shadow-xl p-8 border border-stone-200">
            <div className="text-center mb-8">
              <div className="h-16 w-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4">
                <GraduationCap size={32} />
              </div>
              <h1 className="text-2xl font-black text-stone-900">
                {isRTL ? "بوابة المعلم" : "Teacher Portal"}
              </h1>
              <p className="text-sm text-stone-500 mt-2">
                {isRTL ? "سجّل الدخول لإدارة فصلك" : "Sign in to manage your class"}
              </p>
            </div>

            <form onSubmit={handleTeacherLogin} className="space-y-4">
              {loginError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-bold flex items-center gap-2">
                  <AlertCircle size={16} />
                  {loginError}
                </div>
              )}

              <div>
                <label htmlFor="field-independentteacherportal-input-13" className="block text-sm font-bold text-stone-700 mb-1.5">
                  {isRTL ? "البريد الإلكتروني أو رقم الهوية " : "Email or Employee ID"}
                </label>
                <input id="field-independentteacherportal-input-13" name="input_13" aria-label="input 13"
                  type="text"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder={isRTL ? "أدخل البريد الإلكتروني أو رقم الهوية " : "Enter email or employee ID"}
                  className="w-full h-12 rounded-xl border-2 border-stone-200 bg-white px-4 text-sm font-bold focus:border-emerald-500 focus:ring-0 outline-none"
                  required
                />
              </div>

              <div>
                <label htmlFor="field-independentteacherportal-input-12" className="block text-sm font-bold text-stone-700 mb-1.5">
                  {isRTL ? "كلمة المرور" : "Password"}
                </label>
                <div className="relative">
                  <input id="field-independentteacherportal-input-12" name="input_12" aria-label="input 12"
                    type={showLoginPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder={isRTL ? "أدخل كلمة المرور" : "Enter password"}
                    className="w-full h-12 rounded-xl border-2 border-stone-200 bg-white px-4 pr-12 text-sm font-bold focus:border-emerald-500 focus:ring-0 outline-none"
                    required
                  />
                  <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                    {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loginLoading || !loginEmail || !loginPassword}
                className="w-full h-12 rounded-xl bg-emerald-600 text-white font-black text-sm hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-lg inline-flex items-center justify-center gap-2">
                {loginLoading ? (isRTL ? "جاري الدخول..." : "Signing in...") : (isRTL ? "تسجيل الدخول" : "Sign In")}
              </button>
            </form>

            <div className="mt-6 text-center space-y-3">
              <Link to="/teacher-register" className="text-sm font-bold text-emerald-600 hover:text-emerald-700 block">
                {isRTL ? "ليس لديك حساب؟ سجّل كمعلم جديد" : "No account? Register as a teacher"}
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
    <div className="min-h-screen bg-stone-50 flex" dir={isRTL ? "rtl" : "ltr"}>
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-l border-stone-200 flex-col fixed inset-y-0 right-0 z-30">
         <div className="p-4 border-b border-stone-100">
           <div className="flex items-center gap-3">
             {teacherProfile?.avatar_url ? (
               <img src={teacherProfile.avatar_url} alt="avatar" className="h-10 w-10 rounded-xl object-cover border border-stone-200" />
             ) : (
               <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                 <GraduationCap size={20} />
               </div>
             )}
             <div>
               <div className="font-black text-sm text-stone-900">بوابة المعلم</div>
               <div className="text-xs text-stone-500 truncate max-w-[150px]">{teacherName}</div>
             </div>
           </div>
         </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {SIDEBAR_ITEMS.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-start gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all text-right ${activeTab === item.id ? "bg-emerald-50 text-emerald-700" : "text-stone-600 hover:bg-stone-50"}`}>
              <item.icon size={18} className="shrink-0" />
              <span className="flex-1 text-right">{isRTL ? item.label : item.labelEn}</span>
              {item.id === "subscriptions" && stats.pendingSubs > 0 && (
                <span className="mr-auto bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{stats.pendingSubs}</span>
              )}
              {item.id === "bonds" && stats.pendingBonds > 0 && (
                <span className="mr-auto bg-indigo-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{stats.pendingBonds}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-stone-100">
          <button onClick={handleLogout} className="w-full flex items-center justify-start gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-all text-right">
            <LogOut size={18} /> خروج
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-stone-200 h-14 flex items-center px-4 gap-3">
        <GraduationCap size={20} className="text-emerald-600" />
        <span className="font-black text-sm">{teacherName}</span>
        <div className="mr-auto flex items-center gap-2">
          {stats.pendingSubs > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{stats.pendingSubs} طلب</span>
          )}
          <button onClick={handleLogout} className="text-red-600"><LogOut size={18} /></button>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-stone-200 h-16 flex items-center justify-around px-2">
        {SIDEBAR_ITEMS.slice(0, 5).map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg text-center ${activeTab === item.id ? "text-emerald-600" : "text-stone-400"}`}>
            <item.icon size={20} />
            <span className="text-[10px] font-bold">{isRTL ? item.label.split(" ").pop() : item.labelEn.split(" ").pop()}</span>
          </button>
        ))}
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:mr-64 pt-14 lg:pt-0 pb-20 lg:pb-0">
        <div className="max-w-6xl mx-auto p-4 md:p-6">
          {loadingStudents ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
              <p className="text-sm font-bold text-stone-500">{isRTL ? "جاري التحميل..." : "Loading..."}</p>
            </div>
          ) : (
          <AnimatePresence mode="wait">
            {activeTab === "dashboard" && <DashboardTab key="dashboard" stats={stats} isRTL={isRTL} students={students} />}
            {activeTab === "students" && <StudentsTab key="students" teacherId={teacherId} students={students} submissions={submissions} isRTL={isRTL} queryClient={queryClient} />}
            {activeTab === "assignments" && <AssignmentsTab key="assignments" teacherId={teacherId} assignments={assignments} isRTL={isRTL} queryClient={queryClient} />}
            {activeTab === "exams" && <ExamsTab key="exams" teacherId={teacherId} exams={exams} isRTL={isRTL} queryClient={queryClient} />}
            {activeTab === "live" && <LiveClassesTab key="live" teacherId={teacherId} liveClasses={liveClasses} isRTL={isRTL} queryClient={queryClient} />}
            {activeTab === "videos" && <VideosTab key="videos" teacherId={teacherId} videos={videos} students={students} isRTL={isRTL} queryClient={queryClient} />}
            {activeTab === "subscriptions" && <SubscriptionsTab key="subs" teacherId={teacherId} subscriptions={subscriptions} isRTL={isRTL} queryClient={queryClient} />}
             {activeTab === "bonds" && <BondsTab key="bonds" bonds={bonds} isRTL={isRTL} approveBond={(bondId) => approveBondMutation.mutate({ bondId, studentName: bonds.find(b => b.id === bondId)?.student_name })} rejectBond={rejectBondMutation.mutate} confirmPayment={(bondId) => confirmPaymentMutation.mutate(bondId)} approveLoading={approveBondMutation.isPending} rejectLoading={rejectBondMutation.isPending} confirmLoading={confirmPaymentMutation.isPending} />}
            {activeTab === "settings" && <SettingsTab key="settings" teacherId={teacherId} teacherProfile={teacherProfile} isRTL={isRTL} queryClient={queryClient} />}
          </AnimatePresence>
          )}
        </div>
      </main>

      {/* Credentials Dialog */}
      {credentialsDialog && (
        <Dialog open={!!credentialsDialog} onOpenChange={() => setCredentialsDialog(null)}>
          <DialogContent className="max-w-sm rounded-[24px]" dir={isRTL ? "rtl" : "ltr"}>
            <DialogHeader><DialogTitle className="font-black">{isRTL ? "حساب الطالب" : "Student Credentials"}</DialogTitle></DialogHeader>
            <div className="space-y-3 p-1">
              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <CheckCircle2 size={32} className="text-emerald-600 mx-auto mb-2" />
                <div className="text-sm font-bold text-stone-900">{isRTL ? "تم إنشاء الحساب بنجاح" : "Account created successfully"}</div>
              </div>
              <div className="bg-stone-50 rounded-xl p-3 space-y-2">
                <div className="text-xs text-stone-500">{isRTL ? "اسم المستخدم" : "Username"}</div>
                <div className="font-mono font-bold text-stone-900 bg-white rounded-lg p-2 text-center border border-stone-200" dir="ltr">{credentialsDialog.username}</div>
                <div className="text-xs text-stone-500 mt-2">{isRTL ? "كلمة المرور" : "Password"}</div>
                <div className="font-mono font-bold text-stone-900 bg-white rounded-lg p-2 text-center border border-stone-200" dir="ltr">{credentialsDialog.password}</div>
              </div>
              <p className="text-[10px] text-stone-400 text-center">{isRTL ? "شارك هذه البيانات مع الطالب" : "Share these credentials with the student"}</p>
            </div>
            <DialogFooter>
              <button onClick={() => setCredentialsDialog(null)} className={btnPrimary}>OK</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ─── Dashboard Tab ───
function DashboardTab({ stats, isRTL, students }) {
  const cards = [
    { label: isRTL ? "الطلاب" : "Students", value: stats.students, icon: Users, color: "bg-blue-50 text-blue-600" },
    { label: isRTL ? "الواجبات" : "Assignments", value: stats.assignments, icon: ClipboardCheck, color: "bg-amber-50 text-amber-600" },
    { label: isRTL ? "الامتحانات" : "Exams", value: stats.exams, icon: FileText, color: "bg-purple-50 text-purple-600" },
    { label: isRTL ? "الحصص المباشرة" : "Live Classes", value: stats.liveClasses, icon: Video, color: "bg-emerald-50 text-emerald-600" },
    { label: isRTL ? "فيديوهات يوتيوب" : "YouTube Videos", value: stats.videos, icon: PlayCircle, color: "bg-red-50 text-red-600" },
    { label: isRTL ? "طلبات اشتراك" : "Pending Subs", value: stats.pendingSubs, icon: Star, color: "bg-orange-50 text-orange-600" },
    { label: isRTL ? "واجبات قيد التصحيح" : "Pending Grading", value: stats.pendingGrading, icon: Award, color: "bg-cyan-50 text-cyan-600" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <h1 className="text-xl font-black text-stone-900 mb-4">{isRTL ? "لوحة التحكم" : "Dashboard"}</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {cards.map((c, i) => (
          <Card key={i} className="p-4 rounded-2xl border-stone-100 flex flex-col items-center justify-center text-center">
            <div className={`h-10 w-10 rounded-xl ${c.color} flex items-center justify-center mb-3`}>
              <c.icon size={18} />
            </div>
            <div className="text-2xl font-black text-stone-900">{c.value}</div>
            <div className="text-xs text-stone-500 font-bold">{c.label}</div>
          </Card>
        ))}
      </div>
      {students?.length > 0 && (
        <Card className="mt-4 p-4 rounded-2xl border-stone-100">
          <h3 className="font-black text-sm mb-3">{isRTL ? "آخر الطلاب المسجلين" : "Recent Students"}</h3>
          <div className="space-y-2">
            {students.slice(0, 5).map(s => (
              <div key={s.id} className="flex items-center gap-3 p-2 rounded-xl bg-stone-50">
                <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-black">
                  {(s.student_name || "").charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-stone-900 truncate">{s.student_name}</div>
                  <div className="text-xs text-stone-500">{s.grade ? `الصف ${s.grade}` : ""}</div>
                </div>
                <Badge variant={s.status === "active" ? "default" : "secondary"} className="text-[10px]">{s.status === "active" ? "نشط" : s.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </motion.div>
  );
}

const EMPTY_STUDENT_FORM = { student_name: "", student_email: "", student_phone: "", grade: "", parent_name: "", parent_phone: "", parent_email: "" };

// ─── Students Tab ───
function StudentsTab({ teacherId, students, submissions, isRTL, queryClient }) {
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(null);
  const [form, setForm] = useState(EMPTY_STUDENT_FORM);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedStudent, setExpandedStudent] = useState(null);

  const filtered = students?.filter(s => !search || s.student_name?.toLowerCase().includes(search.toLowerCase())) || [];

  const getStudentSubmissions = (studentId) => {
    return submissions?.filter(s => s.student_id === studentId) || [];
  };

  const handleAdd = async () => {
    if (!form.student_name.trim()) { toast.error(isRTL ? "أدخل اسم الطالب" : "Enter student name"); return; }
    setLoading(true);
    try {
      await entities.TeacherOwnStudent.create({ ...form, teacher_id: teacherId, status: "active" });
      queryClient.invalidateQueries({ queryKey: ["teacher-own-students"] });
      setShowAdd(false);
      setForm({ student_name: "", student_email: "", student_phone: "", grade: "", parent_name: "", parent_phone: "", parent_email: "" });
      toast.success(isRTL ? "تم إضافة الطالب" : "Student added");
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  };

  const handleEdit = async () => {
    if (!form.student_name.trim()) { toast.error(isRTL ? "أدخل اسم الطالب" : "Enter student name"); return; }
    setLoading(true);
    try {
      await entities.TeacherOwnStudent.update(showEdit.id, form);
      queryClient.invalidateQueries({ queryKey: ["teacher-own-students"] });
      setShowEdit(null);
      setForm({ student_name: "", student_email: "", student_phone: "", grade: "", parent_name: "", parent_phone: "", parent_email: "" });
      toast.success(isRTL ? "تم تحديث بيانات الطالب" : "Student updated");
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm(isRTL ? "هل أنت متأكد من حذف هذا الطالب؟" : "Are you sure you want to delete this student?")) return;
    try {
      await entities.TeacherOwnStudent.delete(id);
      queryClient.invalidateQueries({ queryKey: ["teacher-own-students"] });
      toast.success(isRTL ? "تم الحذف" : "Deleted");
    } catch (e) { toast.error(e.message); }
  };

  const handleToggleStatus = async (student) => {
    const newStatus = student.status === "active" ? "inactive" : "active";
    try {
      await entities.TeacherOwnStudent.update(student.id, { status: newStatus });
      queryClient.invalidateQueries({ queryKey: ["teacher-own-students"] });
      toast.success(isRTL ? `تم ${newStatus === "active" ? "تفعيل" : "إيقاف"} الطالب` : `Student ${newStatus === "active" ? "activated" : "deactivated"}`);
    } catch (e) { toast.error(e.message); }
  };

  const openEditDialog = (student) => {
    setForm({ student_name: student.student_name || "", student_email: student.student_email || "", student_phone: student.student_phone || "", grade: student.grade || "", parent_name: student.parent_name || "", parent_phone: student.parent_phone || "", parent_email: student.parent_email || "" });
    setShowEdit(student);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-black">{isRTL ? "طلابي" : "My Students"}</h1>
        <button onClick={() => setShowAdd(true)} className={btnPrimary}><Plus size={16} />{isRTL ? "إضافة طالب" : "Add Student"}</button>
      </div>
      <div className="mb-4"><Input placeholder={isRTL ? "بحث بالاسم..." : "Search by name..."} value={search} onChange={e => setSearch(e.target.value)} className="h-10 rounded-xl" prefix={<Search size={14} />} /></div>
      <div className="grid gap-3">
        {filtered.map(s => {
          const isExpanded = expandedStudent === s.id;
          const studentSubs = getStudentSubmissions(s.id);
          return (
            <Card key={s.id} className="rounded-2xl border-stone-100 overflow-hidden">
              <div className="p-4 flex items-center gap-4 cursor-pointer hover:bg-stone-50 transition-colors" onClick={() => setExpandedStudent(isExpanded ? null : s.id)}>
                <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-sm shrink-0">
                  {(s.student_name || "").charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-stone-900">{s.student_name}</div>
                  <div className="text-xs text-stone-500">{s.student_email || ""} {s.grade ? `• الصف ${s.grade}` : ""}</div>
                  <div className="text-xs text-stone-400">{s.parent_name ? `ولي: ${s.parent_name}` : ""} {s.parent_phone ? `• ${s.parent_phone}` : ""}</div>
                </div>
                <Badge variant={s.status === "active" ? "default" : "secondary"} className="text-[10px] shrink-0">{s.status === "active" ? "نشط" : s.status === "inactive" ? "متوقف" : s.status}</Badge>
                {isExpanded ? <ChevronDown size={16} className="rotate-180 transition-transform" /> : <ChevronRight size={16} className="transition-transform" />}
              </div>

              {isExpanded && (
                <div className="border-t border-stone-100 p-4 bg-stone-50/50 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div><span className="text-stone-400">{isRTL ? "الهاتف" : "Phone"}:</span> <span className="font-bold">{s.student_phone || "—"}</span></div>
                    <div><span className="text-stone-400">{isRTL ? "البريد" : "Email"}:</span> <span className="font-bold">{s.student_email || "—"}</span></div>
                    <div><span className="text-stone-400">{isRTL ? "ولي الأمر" : "Parent"}:</span> <span className="font-bold">{s.parent_name || "—"}</span></div>
                    <div><span className="text-stone-400">{isRTL ? "هاتف ولي الأمر" : "Parent Phone"}:</span> <span className="font-bold">{s.parent_phone || "—"}</span></div>
                    <div><span className="text-stone-400">{isRTL ? "تاريخ الإضافة" : "Added"}:</span> <span className="font-bold">{s.created_at ? new Date(s.created_at).toLocaleDateString(isRTL ? "ar" : "en") : "—"}</span></div>
                    <div><span className="text-stone-400">{isRTL ? "اسم المستخدم" : "Username"}:</span> <span className="font-bold">{s.username || "—"}</span></div>
                  </div>

                  {studentSubs.length > 0 && (
                    <div className="bg-white rounded-xl p-3">
                      <div className="text-xs font-bold text-stone-600 mb-2">{isRTL ? `التقديمات (${studentSubs.length})` : `Submissions (${studentSubs.length})`}</div>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {studentSubs.slice(0, 5).map(sub => (
                          <div key={sub.id} className="flex items-center justify-between text-[11px] bg-stone-50 rounded-lg px-2 py-1">
                            <span className="font-medium truncate">{sub.assignment_title || sub.title || (isRTL ? "واجب" : "Assignment")}</span>
                            <span className={`font-bold ${sub.score != null ? (sub.score >= 70 ? "text-emerald-600" : "text-amber-600") : "text-stone-400"}`}>{sub.score != null ? `${sub.score}%` : isRTL ? "لم يُقيّم" : "Ungraded"}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    <button onClick={(e) => { e.stopPropagation(); openEditDialog(s); }} className="h-8 px-3 rounded-lg bg-blue-100 text-blue-700 text-xs font-bold hover:bg-blue-200 inline-flex items-center justify-center gap-1"><Edit size={12} /> {isRTL ? "تعديل" : "Edit"}</button>
                    <button onClick={(e) => { e.stopPropagation(); handleToggleStatus(s); }} className={`h-8 px-3 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1 ${s.status === "active" ? "bg-amber-100 text-amber-700 hover:bg-amber-200" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"}`}>
                      {s.status === "active" ? <><X size={12} /> {isRTL ? "إيقاف" : "Deactivate"}</> : <><Check size={12} /> {isRTL ? "تفعيل" : "Activate"}</>}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }} className="h-8 px-3 rounded-lg bg-red-100 text-red-700 text-xs font-bold hover:bg-red-200 inline-flex items-center justify-center gap-1"><Trash2 size={12} /> {isRTL ? "حذف" : "Delete"}</button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
        {filtered.length === 0 && <div className="text-center py-12 text-stone-400 text-sm">{isRTL ? "لا يوجد طلاب بعد" : "No students yet"}</div>}
      </div>

      <Dialog open={showAdd} onOpenChange={(o) => { if (!o) setForm(EMPTY_STUDENT_FORM); setShowAdd(o); }}>
        <DialogContent className="max-w-md rounded-[24px]" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader><DialogTitle className="font-black">{isRTL ? "إضافة طالب جديد" : "Add New Student"}</DialogTitle></DialogHeader>
          <div className="space-y-3 p-1">
            <Input placeholder={isRTL ? "اسم الطالب *" : "Student name *"} value={form.student_name} onChange={e => setForm({ ...form, student_name: e.target.value })} className="h-10 rounded-xl" />
            <Input placeholder={isRTL ? "البريد الإلكتروني" : "Email"} value={form.student_email} onChange={e => setForm({ ...form, student_email: e.target.value })} className="h-10 rounded-xl" dir="ltr" />
            <Input placeholder={isRTL ? "الهاتف" : "Phone"} value={form.student_phone} onChange={e => setForm({ ...form, student_phone: e.target.value })} className="h-10 rounded-xl" dir="ltr" />
            <select name="grade" aria-label="grade" value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })} className="h-10 rounded-xl border border-stone-200 bg-white px-3 text-sm w-full">
              <option value="">{isRTL ? "الصف الدراسي" : "Grade"}</option>
              {["1","2","3","4","5","6","7","8","9","10","11","12"].map(g => <option key={g} value={g}>{isRTL ? `الصف ${g}` : `Grade ${g}`}</option>)}
            </select>
            <div className="text-xs font-bold text-stone-500 pt-2">{isRTL ? "بيانات ولي الأمر" : "Parent Info"}</div>
            <Input placeholder={isRTL ? "اسم ولي الأمر" : "Parent name"} value={form.parent_name} onChange={e => setForm({ ...form, parent_name: e.target.value })} className="h-10 rounded-xl" />
            <Input placeholder={isRTL ? "هاتف ولي الأمر" : "Parent phone"} value={form.parent_phone} onChange={e => setForm({ ...form, parent_phone: e.target.value })} className="h-10 rounded-xl" dir="ltr" />
          </div>
          <DialogFooter className="gap-2">
            <button onClick={() => setShowAdd(false)} className={btnOutline}>{isRTL ? "إلغاء" : "Cancel"}</button>
            <button onClick={handleAdd} disabled={loading} className={btnPrimary}>{loading ? "..." : isRTL ? "إضافة" : "Add"}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Student Dialog */}
      <Dialog open={!!showEdit} onOpenChange={(o) => { if (!o) setForm(EMPTY_STUDENT_FORM); setShowEdit(null); }}>
        <DialogContent className="max-w-md rounded-[24px]" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader><DialogTitle className="font-black">{isRTL ? "تعديل بيانات الطالب" : "Edit Student"}</DialogTitle></DialogHeader>
          <div className="space-y-3 p-1">
            <Input placeholder={isRTL ? "اسم الطالب *" : "Student name *"} value={form.student_name} onChange={e => setForm({ ...form, student_name: e.target.value })} className="h-10 rounded-xl" />
            <Input placeholder={isRTL ? "البريد الإلكتروني" : "Email"} value={form.student_email} onChange={e => setForm({ ...form, student_email: e.target.value })} className="h-10 rounded-xl" dir="ltr" />
            <Input placeholder={isRTL ? "الهاتف" : "Phone"} value={form.student_phone} onChange={e => setForm({ ...form, student_phone: e.target.value })} className="h-10 rounded-xl" dir="ltr" />
            <select name="grade" aria-label="grade" value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })} className="h-10 rounded-xl border border-stone-200 bg-white px-3 text-sm w-full">
              <option value="">{isRTL ? "الصف الدراسي" : "Grade"}</option>
              {["1","2","3","4","5","6","7","8","9","10","11","12"].map(g => <option key={g} value={g}>{isRTL ? `الصف ${g}` : `Grade ${g}`}</option>)}
            </select>
            <div className="text-xs font-bold text-stone-500 pt-2">{isRTL ? "بيانات ولي الأمر" : "Parent Info"}</div>
            <Input placeholder={isRTL ? "اسم ولي الأمر" : "Parent name"} value={form.parent_name} onChange={e => setForm({ ...form, parent_name: e.target.value })} className="h-10 rounded-xl" />
            <Input placeholder={isRTL ? "هاتف ولي الأمر" : "Parent phone"} value={form.parent_phone} onChange={e => setForm({ ...form, parent_phone: e.target.value })} className="h-10 rounded-xl" dir="ltr" />
          </div>
          <DialogFooter className="gap-2">
            <button onClick={() => setShowEdit(null)} className={btnOutline}>{isRTL ? "إلغاء" : "Cancel"}</button>
            <button onClick={handleEdit} disabled={loading} className={btnPrimary}>{loading ? "..." : isRTL ? "حفظ التعديلات" : "Save Changes"}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

// ─── Assignments Tab ───
function AssignmentsTab({ teacherId, assignments, isRTL, queryClient }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", subject: "", grade: "", due_date: "", total_points: "100" });
  const [loading, setLoading] = useState(false);
  const EMPTY_ASSIGNMENT_FORM = { title: "", description: "", subject: "", grade: "", due_date: "", total_points: "100" };

  const handleAdd = async () => {
    if (!form.title.trim()) { toast.error(isRTL ? "أدخل عنوان الواجب" : "Enter assignment title"); return; }
    setLoading(true);
    try {
      await entities.TeacherAssignment.create({ ...form, teacher_id: teacherId, total_points: parseInt(form.total_points) || 100, status: "active" });
      queryClient.invalidateQueries({ queryKey: ["teacher-assignments"] });
      setShowAdd(false);
      setForm({ title: "", description: "", subject: "", grade: "", due_date: "", total_points: "100" });
      toast.success(isRTL ? "تم إضافة الواجب" : "Assignment added");
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm(isRTL ? "هل أنت متأكد؟" : "Are you sure?")) return;
    try { await entities.TeacherAssignment.delete(id); queryClient.invalidateQueries({ queryKey: ["teacher-assignments"] }); toast.success(isRTL ? "تم الحذف" : "Deleted"); } catch (e) { toast.error(e.message); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-black">{isRTL ? "الواجبات" : "Assignments"}</h1>
        <button onClick={() => setShowAdd(true)} className={btnPrimary}><Plus size={16} />{isRTL ? "واجب جديد" : "New Assignment"}</button>
      </div>
      <div className="grid gap-3">
        {assignments?.map(a => (
          <Card key={a.id} className="p-4 rounded-2xl border-stone-100">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-black text-stone-900">{a.title}</div>
                <div className="text-xs text-stone-500 mt-1">{a.description || ""}</div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {a.subject && <Badge className="text-[10px] bg-blue-50 text-blue-700">{a.subject}</Badge>}
                  {a.grade && <Badge className="text-[10px] bg-purple-50 text-purple-700">{isRTL ? `صف ${a.grade}` : `Grade ${a.grade}`}</Badge>}
                  {a.due_date && <Badge className="text-[10px] bg-amber-50 text-amber-700">{isRTL ? "التسليم" : "Due"}: {new Date(a.due_date).toLocaleDateString(isRTL ? "ar" : "en")}</Badge>}
                  <Badge className="text-[10px] bg-stone-100 text-stone-600">{a.total_points} {isRTL ? "نقطة" : "pts"}</Badge>
                </div>
              </div>
              <button onClick={() => handleDelete(a.id)} className="h-8 w-8 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 inline-flex items-center justify-center"><Trash2 size={16} /></button>
            </div>
          </Card>
        ))}
        {(!assignments || assignments.length === 0) && <div className="text-center py-12 text-stone-400 text-sm">{isRTL ? "لا يوجد واجبات" : "No assignments yet"}</div>}
      </div>

      <Dialog open={showAdd} onOpenChange={(o) => { if (!o) setForm(EMPTY_ASSIGNMENT_FORM); setShowAdd(o); }}>
        <DialogContent className="max-w-md rounded-[24px]" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader><DialogTitle className="font-black">{isRTL ? "واجب جديد" : "New Assignment"}</DialogTitle></DialogHeader>
          <div className="space-y-3 p-1">
            <Input placeholder={isRTL ? "عنوان الواجب *" : "Title *"} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="h-10 rounded-xl" />
            <textarea name="description" aria-label="description" placeholder={isRTL ? "الوصف" : "Description"} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full h-20 rounded-xl border border-stone-200 p-3 text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder={isRTL ? "المادة" : "Subject"} value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="h-10 rounded-xl" />
              <select name="grade" aria-label="grade" value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })} className="h-10 rounded-xl border border-stone-200 bg-white px-3 text-sm">
                <option value="">{isRTL ? "الصف" : "Grade"}</option>
                {["1","2","3","4","5","6","7","8","9","10","11","12"].map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input type="datetime-local" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} className="h-10 rounded-xl" />
              <Input type="number" placeholder={isRTL ? "النقاط" : "Points"} value={form.total_points} onChange={e => setForm({ ...form, total_points: e.target.value })} className="h-10 rounded-xl" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <button onClick={() => setShowAdd(false)} className={btnOutline}>{isRTL ? "إلغاء" : "Cancel"}</button>
            <button onClick={handleAdd} disabled={loading} className={btnPrimary}>{loading ? "..." : isRTL ? "إضافة" : "Add"}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

// ─── Exams Tab ───
function ExamsTab({ teacherId, exams, isRTL, queryClient }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", subject: "", grade: "", duration_minutes: "60", total_points: "100", questions: "[]" });
  const [loading, setLoading] = useState(false);
  const EMPTY_EXAM_FORM = { title: "", description: "", subject: "", grade: "", duration_minutes: "60", total_points: "100", questions: "[]" };

  const handleAdd = async () => {
    if (!form.title.trim()) { toast.error(isRTL ? "أدخل عنوان الامتحان" : "Enter exam title"); return; }
    setLoading(true);
    try {
      let questions = [];
      try { questions = JSON.parse(form.questions); } catch { questions = []; }
      await entities.TeacherExam.create({
        ...form, teacher_id: teacherId,
        duration_minutes: parseInt(form.duration_minutes) || 60,
        total_points: parseInt(form.total_points) || 100,
        questions, status: "active"
      });
      queryClient.invalidateQueries({ queryKey: ["teacher-exams"] });
      setShowAdd(false);
      toast.success(isRTL ? "تم إضافة الامتحان" : "Exam added");
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm(isRTL ? "هل أنت متأكد؟" : "Are you sure?")) return;
    try { await entities.TeacherExam.delete(id); queryClient.invalidateQueries({ queryKey: ["teacher-exams"] }); toast.success(isRTL ? "تم الحذف" : "Deleted"); } catch (e) { toast.error(e.message); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-black">{isRTL ? "الامتحانات" : "Exams"}</h1>
        <button onClick={() => setShowAdd(true)} className={btnPrimary}><Plus size={16} />{isRTL ? "امتحان جديد" : "New Exam"}</button>
      </div>
      <div className="grid gap-3">
        {exams?.map(e => (
          <Card key={e.id} className="p-4 rounded-2xl border-stone-100">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-black text-stone-900">{e.title}</div>
                <div className="text-xs text-stone-500 mt-1">{e.description || ""}</div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {e.subject && <Badge className="text-[10px] bg-blue-50 text-blue-700">{e.subject}</Badge>}
                  {e.grade && <Badge className="text-[10px] bg-purple-50 text-purple-700">{isRTL ? `صف ${e.grade}` : `Grade ${e.grade}`}</Badge>}
                  <Badge className="text-[10px] bg-amber-50 text-amber-700">{e.duration_minutes} {isRTL ? "دقيقة" : "min"}</Badge>
                  <Badge className="text-[10px] bg-stone-100 text-stone-600">{e.total_points} {isRTL ? "نقطة" : "pts"}</Badge>
                  {Array.isArray(e.questions) && <Badge className="text-[10px] bg-cyan-50 text-cyan-700">{e.questions.length} {isRTL ? "سؤال" : "Q"}</Badge>}
                </div>
              </div>
              <button onClick={() => handleDelete(e.id)} className="h-8 w-8 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 inline-flex items-center justify-center"><Trash2 size={16} /></button>
            </div>
          </Card>
        ))}
        {(!exams || exams.length === 0) && <div className="text-center py-12 text-stone-400 text-sm">{isRTL ? "لا يوجد امتحانات" : "No exams yet"}</div>}
      </div>

      <Dialog open={showAdd} onOpenChange={(o) => { if (!o) setForm(EMPTY_EXAM_FORM); setShowAdd(o); }}>
        <DialogContent className="max-w-md rounded-[24px]" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader><DialogTitle className="font-black">{isRTL ? "امتحان جديد" : "New Exam"}</DialogTitle></DialogHeader>
          <div className="space-y-3 p-1">
            <Input placeholder={isRTL ? "عنوان الامتحان *" : "Title *"} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="h-10 rounded-xl" />
            <textarea name="description" aria-label="description" placeholder={isRTL ? "الوصف" : "Description"} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full h-16 rounded-xl border border-stone-200 p-3 text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder={isRTL ? "المادة" : "Subject"} value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="h-10 rounded-xl" />
              <select name="grade" aria-label="grade" value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })} className="h-10 rounded-xl border border-stone-200 bg-white px-3 text-sm">
                <option value="">{isRTL ? "الصف" : "Grade"}</option>
                {["1","2","3","4","5","6","7","8","9","10","11","12"].map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" placeholder={isRTL ? "المدة (دقيقة)" : "Duration (min)"} value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: e.target.value })} className="h-10 rounded-xl" />
              <Input type="number" placeholder={isRTL ? "النقاط" : "Points"} value={form.total_points} onChange={e => setForm({ ...form, total_points: e.target.value })} className="h-10 rounded-xl" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <button onClick={() => setShowAdd(false)} className={btnOutline}>{isRTL ? "إلغاء" : "Cancel"}</button>
            <button onClick={handleAdd} disabled={loading} className={btnPrimary}>{loading ? "..." : isRTL ? "إضافة" : "Add"}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

// ─── Live Classes Tab ───
function LiveClassesTab({ teacherId, liveClasses, isRTL, queryClient }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", subject: "", grade: "", scheduled_at: "", duration_minutes: "60", max_students: "30" });
  const [loading, setLoading] = useState(false);
  const EMPTY_LIVE_CLASS_FORM = { title: "", description: "", subject: "", grade: "", scheduled_at: "", duration_minutes: "60", max_students: "30" };

  const handleAdd = async () => {
    if (!form.title.trim()) { toast.error(isRTL ? "أدخل عنوان الحصة" : "Enter class title"); return; }
    setLoading(true);
    try {
      const roomToken = Math.random().toString(36).substring(2, 15);
      await entities.TeacherLiveClass.create({
        ...form, teacher_id: teacherId,
        duration_minutes: parseInt(form.duration_minutes) || 60,
        max_students: parseInt(form.max_students) || 30,
        room_token: roomToken,
        room_url: `/live/${roomToken}`,
        status: "scheduled"
      });
      queryClient.invalidateQueries({ queryKey: ["teacher-live-classes"] });
      setShowAdd(false);
      toast.success(isRTL ? "تم إضافة الحصة" : "Class added");
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm(isRTL ? "هل أنت متأكد؟" : "Are you sure?")) return;
    try { await entities.TeacherLiveClass.delete(id); queryClient.invalidateQueries({ queryKey: ["teacher-live-classes"] }); toast.success(isRTL ? "تم الحذف" : "Deleted"); } catch (e) { toast.error(e.message); }
  };

  const handleToggleStatus = async (cls) => {
    const nextStatus = cls.status === "scheduled" ? "live" : cls.status === "live" ? "ended" : "scheduled";
    try {
      await entities.TeacherLiveClass.update(cls.id, { status: nextStatus });
      queryClient.invalidateQueries({ queryKey: ["teacher-live-classes"] });
      const msg = nextStatus === "live" ? (isRTL ? "تم بدء البث المباشر" : "Session started") : nextStatus === "ended" ? (isRTL ? "تم إنهاء البث" : "Session ended") : (isRTL ? "تمت إعادة الجدولة" : "Session rescheduled");
      toast.success(msg);
    } catch (e) { toast.error(e.message); }
  };

  const getStatusBadge = (status) => {
    const map = { scheduled: { label: isRTL ? "مجدول" : "Scheduled", cls: "bg-blue-50 text-blue-700" }, live: { label: isRTL ? "مباشر" : "Live", cls: "bg-red-50 text-red-700 animate-pulse" }, ended: { label: isRTL ? "منتهي" : "Ended", cls: "bg-stone-100 text-stone-500" } };
    const s = map[status] || map.scheduled;
    return <Badge className={`text-[10px] ${s.cls}`}>{s.label}</Badge>;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-black">{isRTL ? "الحصص المباشرة" : "Live Classes"}</h1>
        <button onClick={() => setShowAdd(true)} className={btnPrimary}><Plus size={16} />{isRTL ? "حصة جديدة" : "New Class"}</button>
      </div>
      <div className="grid gap-3">
        {liveClasses?.map(c => (
          <Card key={c.id} className="p-4 rounded-2xl border-stone-100">
            <div className="flex items-start justify-between">
              <div className="flex-1">
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
                {c.room_token && (
                  <div className="mt-2 flex items-center gap-2">
                    <code className="text-[10px] bg-stone-100 px-2 py-1 rounded-lg font-mono">{c.room_token}</code>
                    <button onClick={() => { navigator.clipboard.writeText(c.room_token); toast.success(isRTL ? "تم النسخ" : "Copied"); }} className="h-7 w-7 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 inline-flex items-center justify-center"><Copy size={12} /></button>
                    <a href={c.room_url || `/live/${c.room_token}`} target="_blank" rel="noopener noreferrer" className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded-lg font-bold hover:bg-blue-200 inline-flex items-center justify-center gap-1"><Video size={10} /> {isRTL ? "فتح الغرفة" : "Open Room"}</a>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {c.status !== "ended" && (
                  <button onClick={() => handleToggleStatus(c)} className={`h-8 px-3 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1 ${c.status === "scheduled" ? "bg-red-500 text-white hover:bg-red-600" : "bg-stone-500 text-white hover:bg-stone-600"}`}>
                    {c.status === "scheduled" ? <><Video size={12} /> {isRTL ? "بدء البث" : "Start"}</> : <><X size={12} /> {isRTL ? "إنهاء" : "End"}</>}
                  </button>
                )}
                <button onClick={() => handleDelete(c.id)} className="h-8 w-8 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 inline-flex items-center justify-center"><Trash2 size={16} /></button>
              </div>
            </div>
          </Card>
        ))}
        {(!liveClasses || liveClasses.length === 0) && <div className="text-center py-12 text-stone-400 text-sm">{isRTL ? "لا يوجد حصص" : "No classes yet"}</div>}
      </div>

      <Dialog open={showAdd} onOpenChange={(o) => { if (!o) setForm(EMPTY_LIVE_CLASS_FORM); setShowAdd(o); }}>
        <DialogContent className="max-w-md rounded-[24px]" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader><DialogTitle className="font-black">{isRTL ? "حصة مباشرة جديدة" : "New Live Class"}</DialogTitle></DialogHeader>
          <div className="space-y-3 p-1">
            <Input placeholder={isRTL ? "عنوان الحصة *" : "Title *"} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="h-10 rounded-xl" />
            <textarea name="description" aria-label="description" placeholder={isRTL ? "الوصف" : "Description"} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full h-16 rounded-xl border border-stone-200 p-3 text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder={isRTL ? "المادة" : "Subject"} value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="h-10 rounded-xl" />
              <select name="grade" aria-label="grade" value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })} className="h-10 rounded-xl border border-stone-200 bg-white px-3 text-sm">
                <option value="">{isRTL ? "الصف" : "Grade"}</option>
                {["1","2","3","4","5","6","7","8","9","10","11","12"].map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <Input type="datetime-local" value={form.scheduled_at} onChange={e => setForm({ ...form, scheduled_at: e.target.value })} className="h-10 rounded-xl" />
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" placeholder={isRTL ? "المدة" : "Duration"} value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: e.target.value })} className="h-10 rounded-xl" />
              <Input type="number" placeholder={isRTL ? "أقصى طلاب" : "Max students"} value={form.max_students} onChange={e => setForm({ ...form, max_students: e.target.value })} className="h-10 rounded-xl" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <button onClick={() => setShowAdd(false)} className={btnOutline}>{isRTL ? "إلغاء" : "Cancel"}</button>
            <button onClick={handleAdd} disabled={loading} className={btnPrimary}>{loading ? "..." : isRTL ? "إضافة" : "Add"}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

// ─── YouTube Videos Tab ───
function VideosTab({ teacherId, videos, students = [], isRTL, queryClient }) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [activePlayerVideo, setActivePlayerVideo] = useState(null);
  const [search, setSearch] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [filterStudent, setFilterStudent] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [loading, setLoading] = useState(false);

  const INITIAL_FORM = {
    title: "",
    description: "",
    youtube_url: "",
    subject: "",
    grade: "",
    video_duration: "",
    target_type: "all",
    target_student_id: "",
    target_student_name: "",
    is_hidden: false,
  };

  const [form, setForm] = useState(INITIAL_FORM);

  const openAdd = () => {
    setEditingVideo(null);
    setForm(INITIAL_FORM);
    setShowDialog(true);
  };

  const openEdit = (v) => {
    setEditingVideo(v);
    setForm({
      title: v.title || "",
      description: v.description || "",
      youtube_url: v.youtube_url || "",
      subject: v.subject || "",
      grade: v.grade || "",
      video_duration: v.video_duration || "",
      target_type: v.target_type || (v.target_student_id ? "specific" : "all"),
      target_student_id: v.target_student_id || "",
      target_student_name: v.target_student_name || "",
      is_hidden: !!v.is_hidden,
    });
    setShowDialog(true);
  };

  const detectedVideoId = extractYouTubeId(form.youtube_url);
  const detectedThumbnail = detectedVideoId ? `https://img.youtube.com/vi/${detectedVideoId}/hqdefault.jpg` : null;

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!form.title.trim()) {
      toast.error(isRTL ? "يرجى إدخال عنوان الحصة" : "Enter lesson title");
      return;
    }
    if (!form.youtube_url.trim() || !detectedVideoId) {
      toast.error(isRTL ? "يرجى إدخال رابط يوتيوب صالح (غير مدرج)" : "Enter a valid YouTube URL");
      return;
    }

    setLoading(true);
    try {
      const selectedStudent = students.find(s => s.id === form.target_student_id);
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        youtube_url: form.youtube_url.trim(),
        thumbnail_url: detectedThumbnail,
        subject: form.subject.trim(),
        grade: form.grade,
        video_duration: form.video_duration.trim(),
        target_type: form.target_type,
        target_student_id: form.target_type === "specific" ? form.target_student_id || null : null,
        target_student_name: form.target_type === "specific" ? (selectedStudent?.student_name || form.target_student_name || "") : null,
        is_hidden: form.is_hidden,
      };

      if (editingVideo) {
        await entities.TeacherYoutubeVideo.update(editingVideo.id, payload);
        toast.success(isRTL ? "تم تحديث بيانات الحصة بنجاح" : "Lesson updated successfully");
      } else {
        await entities.TeacherYoutubeVideo.create({
          ...payload,
          teacher_id: teacherId,
          order_index: videos?.length || 0,
        });
        toast.success(isRTL ? "تم إضافة الحصة المسجلة وحفظها لطلابك المشتركين" : "Lesson added and linked to students");
      }

      queryClient.invalidateQueries({ queryKey: ["teacher-youtube-videos"] });
      setShowDialog(false);
      setEditingVideo(null);
      setForm(INITIAL_FORM);
    } catch (err) {
      toast.error(err.message || (isRTL ? "حدث خطأ أثناء الحفظ" : "Error saving video"));
    } finally {
      setLoading(false);
    }
  };

  const toggleHidden = async (id, current) => {
    try {
      await entities.TeacherYoutubeVideo.update(id, { is_hidden: !current });
      queryClient.invalidateQueries({ queryKey: ["teacher-youtube-videos"] });
      toast.success(current ? (isRTL ? "تم إظهار الحصة للطلاب" : "Lesson is now visible") : (isRTL ? "تم إخفاء الحصة عن الطلاب" : "Lesson is now hidden"));
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(isRTL ? "هل أنت متأكد من حذف هذه الحصة المسجلة؟" : "Are you sure you want to delete this recorded lesson?")) return;
    try {
      await entities.TeacherYoutubeVideo.delete(id);
      queryClient.invalidateQueries({ queryKey: ["teacher-youtube-videos"] });
      toast.success(isRTL ? "تم حذف الحصة" : "Lesson deleted");
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleCopyLink = (v) => {
    if (!v.youtube_url) return;
    navigator.clipboard.writeText(v.youtube_url);
    setCopiedId(v.id);
    toast.success(isRTL ? "تم نسخ رابط الفيديو غير المدرج" : "Unlisted link copied");
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Filtered videos
  const subjectsList = Array.from(new Set((videos || []).map(v => v.subject).filter(Boolean)));
  const filteredVideos = (videos || []).filter(v => {
    const matchSearch = !search || 
      v.title?.toLowerCase().includes(search.toLowerCase()) || 
      v.description?.toLowerCase().includes(search.toLowerCase());
    const matchSubject = !filterSubject || v.subject === filterSubject;
    const matchGrade = !filterGrade || v.grade === filterGrade;
    const matchStudent = !filterStudent || (filterStudent === "all" ? !v.target_student_id : v.target_student_id === filterStudent);
    return matchSearch && matchSubject && matchGrade && matchStudent;
  });

  const visibleCount = (videos || []).filter(v => !v.is_hidden).length;
  const hiddenCount = (videos || []).filter(v => v.is_hidden).length;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
      {/* Top Banner / Header */}
      <div className="bg-gradient-to-r from-stone-900 to-stone-800 text-white p-6 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-xl bg-red-600 flex items-center justify-center text-white">
              <PlayCircle size={18} />
            </div>
            <h1 className="text-xl font-black">
              {isRTL ? "الحصص المسجلة (فيديوهات يوتيوب غير مدرجة)" : "Recorded Classes (Unlisted YouTube)"}
            </h1>
          </div>
          <p className="text-xs text-stone-300 max-w-xl leading-relaxed">
            {isRTL
              ? "أضف روابط فيديوهات حصصك غير المدرجة (Unlisted) على يوتيوب، وسيتم تشغيلها بسلاسة داخل المنصة للطلاب المفعلين فقط المشتركين معك."
              : "Add unlisted YouTube links for your lessons. Subscribed and approved students can watch them smoothly inside the platform player."}
          </p>
        </div>

        <button
          onClick={openAdd}
          className="h-11 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
        >
          <Plus size={18} />
          <span>{isRTL ? "إضافة حصة مسجلة جديدة" : "New Recorded Lesson"}</span>
        </button>
      </div>

      {/* Stats summary bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-stone-500 font-bold">{isRTL ? "إجمالي الحصص" : "Total Lessons"}</div>
            <div className="text-2xl font-black text-stone-900 mt-0.5">{videos?.length || 0}</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Video size={20} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-stone-500 font-bold">{isRTL ? "متاحة للطلاب" : "Visible to Students"}</div>
            <div className="text-2xl font-black text-emerald-600 mt-0.5">{visibleCount}</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Eye size={20} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-stone-500 font-bold">{isRTL ? "مسودات / مخفية" : "Hidden / Drafts"}</div>
            <div className="text-2xl font-black text-amber-600 mt-0.5">{hiddenCount}</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <EyeOff size={20} />
          </div>
        </div>
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

        {subjectsList.length > 0 && (
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="h-10 px-3 rounded-xl border border-stone-200 bg-white text-xs font-bold text-stone-700 outline-none"
          >
            <option value="">{isRTL ? "جميع المواد" : "All Subjects"}</option>
            {subjectsList.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}

        <select
          value={filterGrade}
          onChange={(e) => setFilterGrade(e.target.value)}
          className="h-10 px-3 rounded-xl border border-stone-200 bg-white text-xs font-bold text-stone-700 outline-none"
        >
          <option value="">{isRTL ? "جميع الصفوف" : "All Grades"}</option>
          {["1","2","3","4","5","6","7","8","9","10","11","12"].map(g => (
            <option key={g} value={g}>{isRTL ? `الصف ${g}` : `Grade ${g}`}</option>
          ))}
        </select>

        {students.length > 0 && (
          <select
            value={filterStudent}
            onChange={(e) => setFilterStudent(e.target.value)}
            className="h-10 px-3 rounded-xl border border-stone-200 bg-white text-xs font-bold text-stone-700 outline-none"
          >
            <option value="">{isRTL ? "الارتباط بالطلاب (الكل)" : "Student Link (All)"}</option>
            <option value="all">{isRTL ? "متاح لكل المشتركين" : "All Subscribed"}</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.student_name}</option>)}
          </select>
        )}
      </div>

      {/* Videos Grid */}
      {filteredVideos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVideos.map(v => (
            <YouTubeVideoCard
              key={v.id}
              video={v}
              isRTL={isRTL}
              isTeacher={true}
              onPlay={(vid) => setActivePlayerVideo(vid)}
              onEdit={(vid) => openEdit(vid)}
              onToggleHidden={toggleHidden}
              onDelete={handleDelete}
              onCopyLink={handleCopyLink}
              copiedId={copiedId}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-3xl border border-stone-200/80 text-center space-y-3">
          <div className="h-16 w-16 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-2">
            <PlayCircle size={36} />
          </div>
          <h3 className="text-base font-black text-stone-800">
            {videos?.length === 0
              ? (isRTL ? "لا توجد حصص مسجلة حتى الآن" : "No recorded lessons yet")
              : (isRTL ? "لا توجد حصص تطابق معايير البحث" : "No lessons match your filters")}
          </h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
            {videos?.length === 0
              ? (isRTL ? "ابدأ بإضافة أول حصة مسجلة باستخدام رابط يوتيوب غير المدرج، لتظهر لطلابك في بوابتهم الخاصة." : "Start by adding your first unlisted YouTube lesson.")
              : (isRTL ? "جرب مسح فلاتر البحث أو تغيير الكلمات المفتاحية." : "Try clearing your filters.")}
          </p>
          {videos?.length === 0 && (
            <button
              onClick={openAdd}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all shadow-sm"
            >
              <Plus size={16} /> {isRTL ? "إضافة حصة الآن" : "Add Lesson Now"}
            </button>
          )}
        </div>
      )}

      {/* Add / Edit Video Dialog */}
      <Dialog open={showDialog} onOpenChange={(o) => { if (!o) { setEditingVideo(null); setForm(INITIAL_FORM); } setShowDialog(o); }}>
        <DialogContent className="max-w-lg rounded-[28px] p-6 max-h-[90vh] overflow-y-auto" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader className="pb-2 border-b border-stone-100">
            <DialogTitle className="text-lg font-black flex items-center gap-2 text-stone-900">
              <PlayCircle size={20} className="text-red-600" />
              {editingVideo 
                ? (isRTL ? "تعديل بيانات الحصة المسجلة" : "Edit Recorded Lesson")
                : (isRTL ? "إضافة حصة مسجلة جديدة (يوتيوب غير مدرج)" : "New Recorded Lesson (Unlisted YouTube)")}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            {/* Title */}
            <div>
              <label className="block text-xs font-black text-stone-700 mb-1.5">
                {isRTL ? "عنوان الحصة / الدرس *" : "Lesson Title *"}
              </label>
              <Input
                placeholder={isRTL ? "مثال: مراجعة شاملة للوحدة الأولى - التفاضل والتكامل" : "e.g. Unit 1 Comprehensive Review"}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="h-11 rounded-xl font-semibold text-sm border-stone-200"
                required
              />
            </div>

            {/* YouTube URL with Live Preview */}
            <div>
              <label className="block text-xs font-black text-stone-700 mb-1.5">
                {isRTL ? "رابط فيديو يوتيوب غير المدرج (Unlisted URL) *" : "Unlisted YouTube URL *"}
              </label>
              <Input
                placeholder="https://www.youtube.com/watch?v=... أو https://youtu.be/..."
                value={form.youtube_url}
                onChange={(e) => setForm({ ...form, youtube_url: e.target.value })}
                className="h-11 rounded-xl font-mono text-xs border-stone-200"
                dir="ltr"
                required
              />

              {/* URL detection feedback */}
              {form.youtube_url.trim() && (
                <div className="mt-2 p-2.5 rounded-xl border bg-stone-50 flex items-center justify-between gap-3 text-xs">
                  {detectedVideoId ? (
                    <>
                      <div className="flex items-center gap-2 text-emerald-700 font-bold min-w-0">
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                        <span className="truncate">
                          {isRTL ? `تم التعرف على معرف الفيديو: ${detectedVideoId}` : `Valid Video ID: ${detectedVideoId}`}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActivePlayerVideo({ title: form.title || "معاينة الفيديو", youtube_url: form.youtube_url })}
                        className="h-7 px-3 rounded-lg bg-red-600 text-white text-[11px] font-bold hover:bg-red-700 shrink-0 cursor-pointer flex items-center gap-1"
                      >
                        <Play size={10} fill="currentColor" /> {isRTL ? "معاينة المشغل" : "Test Player"}
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-amber-700 font-bold">
                      <AlertCircle size={16} className="text-amber-600 shrink-0" />
                      <span>{isRTL ? "الرابط المدخل غير مكتمل أو غير صالح" : "Invalid YouTube link"}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-black text-stone-700 mb-1.5">
                {isRTL ? "وصف الحصة والملاحظات للطلاب" : "Description & Lesson Notes"}
              </label>
              <textarea
                rows={3}
                placeholder={isRTL ? "أضف تفاصيل الحصة، الواجبات المرتبطة، أو الملاحظات الهامة..." : "Enter lesson description, homework, or notes..."}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full p-3 rounded-xl border border-stone-200 bg-white text-xs leading-relaxed focus:border-emerald-600 focus:ring-0 outline-none"
              />
            </div>

            {/* Subject, Grade, Duration */}
            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] font-black text-stone-700 mb-1">
                  {isRTL ? "المادة" : "Subject"}
                </label>
                <Input
                  placeholder={isRTL ? "مثال: الرياضيات" : "e.g. Math"}
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="h-10 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-stone-700 mb-1">
                  {isRTL ? "الصف" : "Grade"}
                </label>
                <select
                  value={form.grade}
                  onChange={(e) => setForm({ ...form, grade: e.target.value })}
                  className="w-full h-10 px-2.5 rounded-xl border border-stone-200 bg-white text-xs font-semibold"
                >
                  <option value="">{isRTL ? "اختر الصف" : "Select"}</option>
                  {["1","2","3","4","5","6","7","8","9","10","11","12"].map(g => (
                    <option key={g} value={g}>{isRTL ? `الصف ${g}` : `Grade ${g}`}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black text-stone-700 mb-1">
                  {isRTL ? "مدة الحصة" : "Duration"}
                </label>
                <Input
                  placeholder={isRTL ? "مثال: 45 دقيقة" : "e.g. 45 min"}
                  value={form.video_duration}
                  onChange={(e) => setForm({ ...form, video_duration: e.target.value })}
                  className="h-10 rounded-xl text-xs font-semibold"
                />
              </div>
            </div>

            {/* Student linkage / Target Audience */}
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2.5">
              <label className="block text-xs font-black text-stone-800">
                {isRTL ? "ربط الحصة بالطلاب المشتركين:" : "Link Lesson to Subscribed Students:"}
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, target_type: "all", target_student_id: "", target_student_name: "" })}
                  className={`h-10 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    form.target_type === "all"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-white border border-stone-200 text-stone-700 hover:bg-stone-100"
                  }`}
                >
                  <Users size={14} />
                  <span>{isRTL ? "جميع طلابي المشتركين" : "All Subscribed"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setForm({ ...form, target_type: "specific" })}
                  className={`h-10 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    form.target_type === "specific"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-white border border-stone-200 text-stone-700 hover:bg-stone-100"
                  }`}
                >
                  <User size={14} />
                  <span>{isRTL ? "طالب محدد فقط" : "Specific Student"}</span>
                </button>
              </div>

              {form.target_type === "specific" && (
                <div className="pt-1">
                  <select
                    value={form.target_student_id}
                    onChange={(e) => {
                      const sel = students.find(s => s.id === e.target.value);
                      setForm({
                        ...form,
                        target_student_id: e.target.value,
                        target_student_name: sel?.student_name || ""
                      });
                    }}
                    className="w-full h-10 px-3 rounded-xl border border-stone-200 bg-white text-xs font-bold text-stone-800"
                  >
                    <option value="">{isRTL ? "اختر الطالب المشترك..." : "Select subscribed student..."}</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.student_name} {s.grade ? `(الصف ${s.grade})` : ""}
                      </option>
                    ))}
                  </select>
                  {students.length === 0 && (
                    <p className="text-[10px] text-amber-700 mt-1">
                      {isRTL ? "لا يوجد طلاب مسجلون بعد. يمكنك إتاحتها لجميع المشتركين حالياً." : "No registered students found yet."}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Visibility checkbox */}
            <label className="flex items-center gap-2.5 p-3 rounded-xl border border-stone-200 bg-white cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.is_hidden}
                onChange={(e) => setForm({ ...form, is_hidden: e.target.checked })}
                className="h-4 w-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <div className="flex-1">
                <span className="text-xs font-bold text-stone-900 block">
                  {isRTL ? "إخفاء مؤقت عن الطلاب (مسودة للمعلم فقط)" : "Keep hidden from students (Draft)"}
                </span>
                <span className="text-[10px] text-stone-500">
                  {isRTL ? "لن يتمكن الطلاب من مشاهدة الحصة حتى تقوم بإلغاء الإخفاء" : "Students will not be able to watch until unhidden"}
                </span>
              </div>
            </label>

            <DialogFooter className="gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setShowDialog(false)}
                className="h-11 px-5 rounded-xl border-2 border-stone-200 bg-white text-stone-700 hover:bg-stone-50 text-xs font-bold cursor-pointer"
              >
                {isRTL ? "إلغاء" : "Cancel"}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer flex-1"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                <span>
                  {editingVideo 
                    ? (isRTL ? "حفظ التعديلات" : "Save Changes") 
                    : (isRTL ? "إضافة الحصة المسجلة" : "Add Lesson")}
                </span>
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Built-in Video Player Modal */}
      {activePlayerVideo && (
        <YouTubePlayerModal
          video={activePlayerVideo}
          isOpen={!!activePlayerVideo}
          onClose={() => setActivePlayerVideo(null)}
          isRTL={isRTL}
          canManage={true}
        />
      )}
    </motion.div>
  );
}
// ─── Subscriptions Tab ───
function SubscriptionsTab({ teacherId, subscriptions, isRTL, queryClient }) {
  const [filter, setFilter] = useState("all");
  const [showPlanDialog, setShowPlanDialog] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState("monthly");

  const handleStatus = async (id, status, plan) => {
    try {
      const now = new Date().toISOString();
      const update = { status };
      if (status === "approved") {
        update.started_at = now;
        const days = plan === "yearly" ? 365 : 30;
        update.expires_at = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
      }
      await entities.TeacherSubscription.update(id, update);
      queryClient.invalidateQueries({ queryKey: ["teacher-subscriptions"] });
      toast.success(status === "approved" ? (isRTL ? "تم قبول الاشتراك" : "Subscription approved") : (isRTL ? "تم رفض الاشتراك" : "Subscription rejected"));
    } catch (e) { toast.error(e.message); }
  };

  const getDaysUntilExpiry = (expiresAt) => {
    if (!expiresAt) return null;
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const filtered = subscriptions?.filter(s => {
    if (filter === "all") return true;
    if (filter === "active") return s.status === "approved";
    if (filter === "pending") return s.status === "pending";
    if (filter === "expired") return s.status === "rejected" || (s.expires_at && new Date(s.expires_at) < new Date());
    return true;
  }) || [];

  const pendingCount = subscriptions?.filter(s => s.status === "pending").length || 0;
  const activeCount = subscriptions?.filter(s => s.status === "approved").length || 0;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-black">{isRTL ? "طلبات الاشتراك" : "Subscription Requests"}</h1>
        {pendingCount > 0 && <Badge className="bg-amber-500 text-white text-xs px-2">{pendingCount} {isRTL ? "جديد" : "new"}</Badge>}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[{ key: "all", label: isRTL ? "الكل" : "All", count: subscriptions?.length || 0 }, { key: "pending", label: isRTL ? "قيد المراجعة" : "Pending", count: pendingCount }, { key: "active", label: isRTL ? "نشط" : "Active", count: activeCount }, { key: "expired", label: isRTL ? "منتهي" : "Expired", count: subscriptions?.filter(s => s.status === "rejected" || (s.expires_at && new Date(s.expires_at) < new Date())).length || 0 }].map(tab => (
          <button key={tab.key} onClick={() => setFilter(tab.key)} className={`h-8 px-3 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1 ${filter === tab.key ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"}`}>
            {tab.label} <span className="bg-white/20 px-1 rounded">{tab.count}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-3">
        {filtered.map(s => {
          const daysLeft = getDaysUntilExpiry(s.expires_at);
          const isExpiringSoon = daysLeft !== null && daysLeft <= 7 && daysLeft > 0;
          const isExpired = daysLeft !== null && daysLeft <= 0;
          return (
            <Card key={s.id} className={`p-4 rounded-2xl border-stone-100 ${isExpired ? "border-red-200 bg-red-50/30" : isExpiringSoon ? "border-amber-200 bg-amber-50/30" : ""}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-black text-stone-900">{s.student_name || "طالب"}</div>
                  <div className="text-xs text-stone-500">{s.student_email || ""}</div>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <Badge className={`text-[10px] ${s.status === "approved" ? "bg-emerald-50 text-emerald-700" : s.status === "rejected" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                      {s.status === "approved" ? (isRTL ? "مقبول" : "Approved") : s.status === "rejected" ? (isRTL ? "مرفوض" : "Rejected") : (isRTL ? "قيد المراجعة" : "Pending")}
                    </Badge>
                    {s.plan && <Badge className="text-[10px] bg-blue-50 text-blue-700">{s.plan === "yearly" ? (isRTL ? "سنوي" : "Yearly") : (isRTL ? "شهري" : "Monthly")}</Badge>}
                    {s.amount > 0 && <Badge className="text-[10px] bg-purple-50 text-purple-700">{s.amount} EGP</Badge>}
                    {s.expires_at && s.status === "approved" && (
                      <Badge className={`text-[10px] ${isExpired ? "bg-red-100 text-red-700" : isExpiringSoon ? "bg-amber-100 text-amber-700" : "bg-stone-100 text-stone-600"}`}>
                        {isExpired ? (isRTL ? "منتهي" : "Expired") : isExpiringSoon ? (isRTL ? `متبقي ${daysLeft} يوم` : `${daysLeft}d left`) : (isRTL ? `صالح حتى ${new Date(s.expires_at).toLocaleDateString("ar")}` : `Valid until ${new Date(s.expires_at).toLocaleDateString()}`)}
                      </Badge>
                    )}
                  </div>
                </div>
                {s.status === "pending" && (
                  <div className="flex gap-2">
                    <button onClick={() => setShowPlanDialog(s)} className="h-8 px-3 rounded-lg bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 inline-flex items-center justify-center gap-1"><CheckCircle2 size={12} /> {isRTL ? "قبول" : "Approve"}</button>
                    <button onClick={() => handleStatus(s.id, "rejected")} className="h-8 px-3 rounded-lg bg-red-500 text-white text-xs font-bold hover:bg-red-600 inline-flex items-center justify-center gap-1"><X size={12} /> {isRTL ? "رفض" : "Reject"}</button>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && <div className="text-center py-12 text-stone-400 text-sm">{filter === "all" ? (isRTL ? "لا يوجد طلبات اشتراك" : "No subscription requests yet") : isRTL ? "لا توجد نتائج" : "No results"}</div>}
      </div>

      {/* Plan Picker Dialog */}
      <Dialog open={!!showPlanDialog} onOpenChange={() => setShowPlanDialog(null)}>
        <DialogContent className="max-w-sm rounded-[24px]" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader><DialogTitle className="font-black">{isRTL ? "اختيار خطة الاشتراك" : "Choose Subscription Plan"}</DialogTitle></DialogHeader>
          <div className="p-4 space-y-3">
            <div className="text-xs text-stone-500">{isRTL ? `للطالب: ${showPlanDialog?.student_name}` : `For: ${showPlanDialog?.student_name}`}</div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setSelectedPlan("monthly")} className={`p-4 rounded-2xl border-2 text-center transition-all inline-flex flex-col items-center justify-center gap-1 ${selectedPlan === "monthly" ? "border-emerald-500 bg-emerald-50" : "border-stone-200 hover:border-stone-300"}`}>
                <div className="text-lg font-black text-stone-900">{isRTL ? "شهري" : "Monthly"}</div>
                <div className="text-xs text-stone-500">{isRTL ? "30 يوم" : "30 days"}</div>
              </button>
              <button onClick={() => setSelectedPlan("yearly")} className={`p-4 rounded-2xl border-2 text-center transition-all inline-flex flex-col items-center justify-center gap-1 ${selectedPlan === "yearly" ? "border-emerald-500 bg-emerald-50" : "border-stone-200 hover:border-stone-300"}`}>
                <div className="text-lg font-black text-stone-900">{isRTL ? "سنوي" : "Yearly"}</div>
                <div className="text-xs text-stone-500">{isRTL ? "365 يوم" : "365 days"}</div>
              </button>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <button onClick={() => setShowPlanDialog(null)} className={btnOutline}>{isRTL ? "إلغاء" : "Cancel"}</button>
            <button onClick={() => { handleStatus(showPlanDialog.id, "approved", selectedPlan); setShowPlanDialog(null); }} className={btnPrimary}>{isRTL ? "تأكيد القبول" : "Confirm Approval"}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

// ─── Student Bonds Tab ───
 function BondsTab({ bonds, isRTL, approveBond, rejectBond, confirmPayment, approveLoading, rejectLoading, confirmLoading }) {
   const pendingBonds = bonds?.filter(b => b.status === "pending") || [];
   const paymentBonds = bonds?.filter(b => b.status === "approved" && (b.payment_status === "pending_payment" || b.payment_status === "receipt_uploaded")) || [];
   const processedBonds = bonds?.filter(b => b.status === "approved" && b.payment_status === "confirmed") || [];
   const rejectedBonds = bonds?.filter(b => b.status === "rejected") || [];

   return (
     <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
       <h1 className="text-xl font-black text-stone-900 mb-4 flex items-center gap-2">
         <UserCheck size={22} className="text-indigo-600" /> {isRTL ? "ربط الطلاب" : "Student Bonds"}
       </h1>

       {/* Pending Requests */}
       <div className="mb-6">
         <h2 className="text-sm font-bold text-stone-700 mb-3 flex items-center gap-2">
           <Clock size={14} className="text-orange-500" />
           {isRTL ? "طلبات معلقة" : "Pending Requests"} ({pendingBonds.length})
         </h2>
         {pendingBonds.length === 0 ? (
           <Card className="p-6 rounded-2xl border-stone-100 text-center flex flex-col items-center justify-center">
             <CheckCircle2 size={36} className="text-stone-300 mb-2" />
             <div className="text-sm font-bold text-stone-500">{isRTL ? "لا توجد طلبات معلقة" : "No pending requests"}</div>
           </Card>
         ) : (
           <div className="space-y-3">
              {pendingBonds.map(bond => (
                <Card key={bond.id} className="p-4 rounded-2xl border-stone-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-sm shrink-0">
                        {(bond.student_name || "م").charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-stone-900">{bond.student_name || (isRTL ? "طالب" : "Student")}</div>
                        <div className="text-xs text-stone-500">{bond.student_email || bond.student_id}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => approveBond(bond.id)} disabled={approveLoading}
                        className="h-8 px-3 rounded-lg bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 inline-flex items-center justify-center gap-1 disabled:opacity-50">
                        <Check size={12} /> {isRTL ? "قبول" : "Approve"}
                      </button>
                      <button onClick={() => rejectBond(bond.id)} disabled={rejectLoading}
                        className="h-8 px-3 rounded-lg bg-red-500 text-white text-xs font-bold hover:bg-red-600 inline-flex items-center justify-center gap-1 disabled:opacity-50">
                        <X size={12} /> {isRTL ? "رفض" : "Reject"}
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
           </div>
         )}
       </div>

       {/* Payment Required */}
       {paymentBonds.length > 0 && (
         <div className="mb-6">
           <h2 className="text-sm font-bold text-stone-700 mb-3 flex items-center gap-2">
             <CreditCard size={14} className="text-emerald-500" />
             {isRTL ? "بانتظار الدفع" : "Awaiting Payment"} ({paymentBonds.length})
           </h2>
           <div className="space-y-3">
             {paymentBonds.map(bond => (
               <Card key={bond.id} className="p-4 rounded-2xl border-stone-100">
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-sm shrink-0">
                       {(bond.student_name || "م").charAt(0)}
                     </div>
                     <div>
                       <div className="font-bold text-sm text-stone-900">{bond.student_name || (isRTL ? "طالب" : "Student")}</div>
                       <div className="text-xs text-stone-500">{bond.student_email || bond.student_id}</div>
                       <div className="text-xs font-bold text-emerald-600 mt-1">
                         {isRTL ? "رقم الحساب" : "Account"}: {bond.teacher_bank_account || "غير محدد"}
                       </div>
                       <div className={`text-[10px] font-bold mt-1 ${bond.payment_status === "receipt_uploaded" ? "text-emerald-600" : "text-amber-600"}`}>
                         {bond.payment_status === "receipt_uploaded"
                           ? (isRTL ? "تم رفع الإيصال، راجعه قبل التأكيد" : "Receipt uploaded, review before confirming")
                           : (isRTL ? "بانتظار رفع إيصال الدفع" : "Waiting for payment receipt")}
                       </div>
                     </div>
                   </div>
                   <button onClick={() => confirmPayment(bond.id)} disabled={confirmLoading || bond.payment_status !== "receipt_uploaded"}
                     className="h-8 px-3 rounded-lg bg-blue-500 text-white text-xs font-bold hover:bg-blue-600 inline-flex items-center justify-center gap-1 disabled:opacity-50">
                     <CheckCircle2 size={12} /> {isRTL ? "تأكيد الدفع" : "Confirm Payment"}
                   </button>
                 </div>
               </Card>
             ))}
           </div>
         </div>
       )}

       {/* Processed Bonds */}
       <div>
         <h2 className="text-sm font-bold text-stone-700 mb-3 flex items-center gap-2">
           <RefreshCw size={14} className="text-blue-500" />
           {isRTL ? "طلبات معالجة" : "Processed Requests"} ({processedBonds.length})
         </h2>
         <div className="space-y-2">
           {processedBonds.map(bond => (
             <Card key={bond.id} className="p-4 rounded-2xl border-stone-100 flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-emerald-100 text-emerald-600">
                   <CheckCircle2 size={14} />
                 </div>
                 <div>
                   <div className="font-bold text-sm text-stone-900">{bond.student_name || (isRTL ? "طالب" : "Student")}</div>
                   <div className="text-xs text-stone-500">{bond.student_email}</div>
                 </div>
               </div>
               <Badge className="text-[10px] bg-emerald-50 text-emerald-700">{isRTL ? "مكتمل" : "Completed"}</Badge>
             </Card>
           ))}
           {processedBonds.length === 0 && (
             <div className="text-center py-6 text-stone-400 text-sm">{isRTL ? "لا توجد طلبات معالجة بعد" : "No processed requests yet"}</div>
           )}
         </div>
       </div>

       {/* Rejected Bonds */}
       {rejectedBonds.length > 0 && (
          <div className="mt-6">
            <h2 className="text-sm font-bold text-stone-700 mb-3">{isRTL ? "الطلبات المرفوضة" : "Rejected"} ({rejectedBonds.length})</h2>
            <div className="space-y-2">
              {rejectedBonds.map(bond => (
                <Card key={bond.id} className="p-4 rounded-2xl border-stone-100 flex items-center justify-between opacity-60">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-red-100 text-red-600">
                      <X size={14} />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-stone-900">{bond.student_name || (isRTL ? "طالب" : "Student")}</div>
                      <div className="text-xs text-stone-500">{bond.student_email}</div>
                    </div>
                  </div>
                  <Badge className="text-[10px] bg-red-50 text-red-700">{isRTL ? "مرفوض" : "Rejected"}</Badge>
                </Card>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    );
  }

 // ─── Settings Tab (General) ───
 function SettingsTab({ teacherId, teacherProfile, isRTL, queryClient }) {
   const [bankAccount, setBankAccount] = useState(teacherProfile?.bank_account || "");
   const [saving, setSaving] = useState(false);
   const [avatarPreview, setAvatarPreview] = useState(teacherProfile?.avatar_url || "");
   const [avatarFileB64, setAvatarFileB64] = useState(null);
   const [avatarName, setAvatarName] = useState("");

   useEffect(() => {
     if (teacherProfile?.bank_account) setBankAccount(teacherProfile.bank_account);
     if (teacherProfile?.avatar_url) setAvatarPreview(teacherProfile.avatar_url);
   }, [teacherProfile]);

   const handleAvatarChange = (e) => {
     const file = e.target.files?.[0];
     if (!file) return;
     setAvatarName(file.name);
     const reader = new FileReader();
     reader.onload = () => {
       const b64 = reader.result.split(",")[1];
       setAvatarFileB64(b64);
       setAvatarPreview(reader.result);
     };
     reader.readAsDataURL(file);
   };

   const handleSave = async () => {
     setSaving(true);
     try {
       const payload = { bank_account: bankAccount };
       if (avatarFileB64) { payload.avatarFile = avatarFileB64; payload.avatarName = avatarName; }
       const res = await fetch(`/api/teacher-profile?teacherId=${teacherId}`, {
         method: "PATCH",
         headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("portal_jwt_token") || localStorage.getItem("token") || ""}` },
         body: JSON.stringify(payload),
       });
       const d = await res.json().catch(() => ({}));
       if (!res.ok) throw new Error(d.error || "Failed");
       if (d.avatar_url) setAvatarPreview(d.avatar_url);
       queryClient.invalidateQueries({ queryKey: ["teacher-profile"] });
       // also refresh independent-teachers cache for student view
       queryClient.invalidateQueries({ queryKey: ["independent-teachers"] });
       toast.success(isRTL ? "تم حفظ الإعدادات" : "Settings saved");
       setAvatarFileB64(null);
     } catch (e) { toast.error(e.message); }
     setSaving(false);
   };

   return (
     <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
       <h1 className="text-xl font-black text-stone-900 flex items-center gap-2"><Settings size={22} className="text-emerald-600" /> {isRTL ? "الإعدادات العامة" : "General Settings"}</h1>

       <Card className="p-5 rounded-2xl border-stone-100 space-y-4">
         <div>
           <h3 className="text-sm font-black text-stone-900 flex items-center gap-2"><ImageIcon size={16} className="text-stone-500" /> {isRTL ? "صورة المعلم" : "Profile Photo"}</h3>
           <p className="text-xs text-stone-500 mt-1">{isRTL ? "ستظهر في القائمة الجانبية وفي كرت المعلم لدى الطالب." : "Shown in sidebar and on student teacher card."}</p>
           <div className="mt-3 flex items-center gap-4">
             <div className="h-20 w-20 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0">
               {avatarPreview ? <img src={avatarPreview} alt="avatar" className="h-full w-full object-cover" /> : <GraduationCap size={28} className="text-stone-400" />}
             </div>
             <label className="h-10 px-4 rounded-xl bg-white border border-stone-200 text-sm font-bold text-stone-700 hover:bg-stone-50 cursor-pointer inline-flex items-center justify-center gap-2">
               <ImageIcon size={16} /> {isRTL ? "رفع صورة" : "Upload Image"}
               <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
             </label>
           </div>
         </div>

         <div className="pt-4 border-t border-stone-100">
           <label className="block text-xs font-black text-stone-700 mb-1.5">{isRTL ? "رقم الحساب البنكي" : "Bank Account Number"}</label>
           <Input value={bankAccount} onChange={e => setBankAccount(e.target.value)} placeholder={isRTL ? "مثال: SA1234..." : "e.g. SA1234..."} className="h-11 rounded-xl font-mono" dir="ltr" />
           <p className="text-[11px] text-stone-400 mt-1">{isRTL ? "يُرسل للطالب بعد الموافقة لاستكمال الدفع." : "Sent to student after approval to complete payment."}</p>
         </div>

         <button onClick={handleSave} disabled={saving} className="w-full h-11 rounded-xl bg-emerald-600 text-white font-black text-sm hover:bg-emerald-700 disabled:opacity-50 inline-flex items-center justify-center gap-2">
           {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} {isRTL ? "حفظ الإعدادات" : "Save Settings"}
         </button>
       </Card>
     </motion.div>
   );
 }