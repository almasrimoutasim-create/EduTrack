import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { entities } from "@/api/dbClient";
import {
  Users,
  GraduationCap,
  BookOpen,
  ClipboardCheck,
  Calendar as CalendarIcon,
  Award,
  Sparkles,
  ArrowUpRight,
  UserPlus,
  UserCheck,
  ClipboardPlus,
  UserCog,
  Clock,
  Send,
  LayoutDashboard,
  HeartPulse,
  Wallet,
  BookMarked,
  TrendingUp,
  Megaphone
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/lib/LanguageContext";
import { useAuth } from "@/lib/AuthContext";
import { t } from "@/lib/translations";
import StatCard from "@/components/shared/StatCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import AttendanceTrendsCard from "@/components/attendance/AttendanceTrendsCard";
import AttendanceReportCard from "@/components/attendance/AttendanceReportCard";
import DashboardCalendar from "@/components/dashboard/DashboardCalendar";
import LeaderboardWidget from "@/components/dashboard/LeaderboardWidget";
import GradeDistributionChart from "@/components/dashboard/GradeDistributionChart";
import MedicalAlertsWidget from "@/components/dashboard/MedicalAlertsWidget";
import FinancialOverviewCard from "@/components/dashboard/FinancialOverviewCard";
import AnnouncementsWidget from "@/components/dashboard/AnnouncementsWidget";

export default function Dashboard() {
  const { language } = useLanguage();
  const { appPublicSettings } = useAuth();
  const isRTL = language === "ar";
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  /* ── Queries ── */
  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: () => entities.Student.list("-created_at", 500),
    staleTime: 1000 * 60 * 10
  });
  const { data: teachers = [] } = useQuery({
    queryKey: ["teachers"],
    queryFn: () => entities.Teacher.list("-created_at", 100),
    staleTime: 1000 * 60 * 10
  });
  const { data: staff = [] } = useQuery({
    queryKey: ["staff"],
    queryFn: () => entities.StaffMember.list("-created_at", 100),
    staleTime: 1000 * 60 * 10
  });
  const { data: attendance = [] } = useQuery({
    queryKey: ["attendance-recent"],
    queryFn: () => entities.Attendance.list("-created_date", 8),
    staleTime: 1000 * 60 * 2
  });
  const { data: allAttendance = [] } = useQuery({
    queryKey: ["attendance-trends"],
    queryFn: () => entities.Attendance.list("-date", 200),
    staleTime: 1000 * 60 * 2
  });
  const { data: materials = [] } = useQuery({
    queryKey: ["materials"],
    queryFn: () => entities.StudyMaterial.list("-created_date", 100),
    staleTime: 1000 * 60 * 10
  });
  const { data: awards = [] } = useQuery({
    queryKey: ["awards-dashboard"],
    queryFn: () => entities.StudentAward.list("-date", 100),
    staleTime: 1000 * 60 * 10
  });
  const { data: registrationRequests = [] } = useQuery({
    queryKey: ["registration-requests"],
    queryFn: () => entities.RegistrationRequest.list("-created_at", 50),
    staleTime: 1000 * 60 * 2
  });
  const { data: studentFees = [] } = useQuery({
    queryKey: ["student-fees-dashboard"],
    queryFn: () => entities.StudentFee.list("-created_at", 500),
    staleTime: 1000 * 60 * 5
  });
  const { data: feePayments = [] } = useQuery({
    queryKey: ["fee-payments-dashboard"],
    queryFn: () => entities.FeePayment.list("-created_at", 200),
    staleTime: 1000 * 60 * 5
  });
  const { data: announcements = [] } = useQuery({
    queryKey: ["announcements-dashboard"],
    queryFn: () => entities.OfficialAnnouncement.list("-created_at", 10),
    staleTime: 1000 * 60 * 5
  });

  /* ── Derived stats ── */
  const activeStudents = students.filter(s => s.status === "active").length;
  const activeTeachers = teachers.filter(t => t.status === "active").length;
  const activeStaff = staff.filter(s => s.status === "active" || !s.status).length;
  const pendingRequests = registrationRequests.filter(r => r.status === "pending");
  const todayDate = format(new Date(), "yyyy-MM-dd");
  const todayAttendance = attendance.filter(a => a.date === todayDate).length;

  // Attendance rate for today (based on allAttendance)
  const todayAll = allAttendance.filter(a => a.date === todayDate);
  const todayPresent = todayAll.filter(a => a.status === "present").length;
  const todayRate = todayAll.length > 0 ? Math.round((todayPresent / todayAll.length) * 100) : null;

  const containerVariants = {
    variants: [],
  };
  const itemVariants = {};

  /* ── TAB LABELS ── */
  const tabLabels = {
    overview: { ar: "نظرة عامة", en: "Overview", icon: LayoutDashboard },
    academic: { ar: "الأكاديمي والحضور", en: "Academic & Attendance", icon: GraduationCap },
    finance: { ar: "المالية والصحة", en: "Financial & Medical", icon: HeartPulse }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-8"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* ══════════════════════════════════════
          WELCOME BANNER
      ══════════════════════════════════════ */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-indigo-600 p-8 text-white shadow-xl"
      >
        {/* Decorative circles */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-white/3 rounded-full -translate-x-1/2 -translate-y-1/2" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Text side */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 animate-pulse text-yellow-300" />
              <span className="text-xs font-bold uppercase tracking-widest text-white/70">
                {appPublicSettings?.public_settings?.school_name_ar || (isRTL ? "مدارس إيديوتراك العالمية" : "EduTrack International Schools")}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black mb-1">
              {isRTL ? "أهلاً بك في لوحة التحكم 👋" : "Welcome to Dashboard 👋"}
            </h1>
            <p className="text-white/70 text-sm">
              {format(new Date(), "EEEE, MMMM d, yyyy", { locale: isRTL ? arSA : undefined })}
            </p>
          </div>

          {/* Quick stats row inside banner */}
          <div className="flex gap-3 flex-wrap">
            <div className="bg-white/10 backdrop-blur rounded-2xl px-4 py-3 text-center min-w-[80px]">
              <p className="text-2xl font-black">{activeStudents}</p>
              <p className="text-[11px] text-white/70 font-semibold">{isRTL ? "طالب" : "Students"}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-2xl px-4 py-3 text-center min-w-[80px]">
              <p className="text-2xl font-black">{activeTeachers}</p>
              <p className="text-[11px] text-white/70 font-semibold">{isRTL ? "معلم" : "Teachers"}</p>
            </div>
            {todayRate !== null && (
              <div className="bg-white/10 backdrop-blur rounded-2xl px-4 py-3 text-center min-w-[80px]">
                <p className="text-2xl font-black">{todayRate}%</p>
                <p className="text-[11px] text-white/70 font-semibold">{isRTL ? "حضور اليوم" : "Today"}</p>
              </div>
            )}
            {pendingRequests.length > 0 && (
              <div className="bg-amber-400/80 backdrop-blur rounded-2xl px-4 py-3 text-center min-w-[80px] cursor-pointer" onClick={() => navigate("/settings")}>
                <p className="text-2xl font-black">{pendingRequests.length}</p>
                <p className="text-[11px] text-white/90 font-semibold">{isRTL ? "طلبات معلقة" : "Pending"}</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ══════════════════════════════════════
          STAT CARDS ROW
      ══════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <motion.div variants={itemVariants} className="group">
          <StatCard
            title={t("dashboard.activeStudents", language)}
            value={activeStudents}
            icon={Users}
            color="blue"
            sub={`${students.length} ${t("dashboard.totalStudents", language)}`}
            className="border-none shadow-sm hover:shadow-xl hover:bg-blue-50/50 transition-all duration-500"
          />
        </motion.div>
        <motion.div variants={itemVariants} className="group">
          <StatCard
            title={t("dashboard.teachers", language)}
            value={activeTeachers}
            icon={GraduationCap}
            color="indigo"
            sub={`${teachers.length} ${isRTL ? "إجمالي" : "total"}`}
            className="border-none shadow-sm hover:shadow-xl hover:bg-indigo-50/50 transition-all duration-500"
          />
        </motion.div>
        <motion.div variants={itemVariants} className="group">
          <StatCard
            title={isRTL ? "الموظفين" : "Staff"}
            value={activeStaff}
            icon={UserCog}
            color="purple"
            sub={`${staff.length} ${isRTL ? "إجمالي" : "total"}`}
            className="border-none shadow-sm hover:shadow-xl hover:bg-purple-50/50 transition-all duration-500"
          />
        </motion.div>
        <motion.div variants={itemVariants} className="group">
          <StatCard
            title={t("dashboard.materials", language)}
            value={materials.length}
            icon={BookOpen}
            color="green"
            className="border-none shadow-sm hover:shadow-xl hover:bg-green-50/50 transition-all duration-500"
          />
        </motion.div>
        <motion.div variants={itemVariants} className="group">
          <StatCard
            title={t("common.awards", language)}
            value={awards.length}
            icon={Award}
            color="gold"
            sub={awards.length === 0 ? (isRTL ? "لا جوائز بعد" : "No awards yet") : undefined}
            className="border-none shadow-sm hover:shadow-xl hover:bg-amber-50/50 transition-all duration-500"
          />
        </motion.div>
      </div>

      {/* ══════════════════════════════════════
          TABS
      ══════════════════════════════════════ */}
      <motion.div variants={itemVariants}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Tab Nav */}
          <TabsList className="w-full bg-white/60 backdrop-blur-xl border border-stone-100 shadow-sm rounded-2xl h-auto p-1.5 gap-1 flex-wrap sm:flex-nowrap">
            {Object.entries(tabLabels).map(([key, val]) => {
              const Icon = val.icon;
              return (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md text-stone-500"
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{isRTL ? val.ar : val.en}</span>
                  <span className="sm:hidden">{isRTL ? val.ar.split(" ")[0] : val.en.split(" ")[0]}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              TAB 1: OVERVIEW
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          <TabsContent value="overview" className="mt-6 space-y-6 outline-none">

            {/* Quick Actions */}
            <Card className="p-5 border-none shadow-sm bg-white/50 backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Send className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-bold text-sm">{isRTL ? "إجراءات سريعة" : "Quick Actions"}</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label_ar: "إضافة طالب", label_en: "Add Student", icon: UserPlus, color: "text-blue-600", bg: "hover:bg-blue-50/80", path: "/students?new=1" },
                  { label_ar: "إضافة معلم", label_en: "Add Teacher", icon: GraduationCap, color: "text-indigo-600", bg: "hover:bg-indigo-50/80", path: "/teachers?new=1" },
                  { label_ar: "تسجيل الحضور", label_en: "Take Attendance", icon: ClipboardPlus, color: "text-emerald-600", bg: "hover:bg-emerald-50/80", path: "/attendance" },
                  { label_ar: "إدارة الموظفين", label_en: "Manage Staff", icon: UserCog, color: "text-purple-600", bg: "hover:bg-purple-50/80", path: "/settings", badge: pendingRequests.length }
                ].map((action, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    className={`h-auto py-4 flex flex-col items-center gap-2 border-dashed hover:border-primary transition-all relative ${action.bg}`}
                    onClick={() => navigate(action.path)}
                  >
                    <action.icon className={`h-5 w-5 ${action.color}`} />
                    <span className="text-xs font-bold">{isRTL ? action.label_ar : action.label_en}</span>
                    {action.badge > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                        {action.badge}
                      </span>
                    )}
                  </Button>
                ))}
              </div>
            </Card>

            {/* Pending Registration Requests */}
            {pendingRequests.length > 0 && (
              <Card className="p-5 border-none shadow-sm bg-amber-50/50 backdrop-blur-xl border border-amber-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">{isRTL ? "طلبات تسجيل معلقة" : "Pending Registration Requests"}</h3>
                      <p className="text-xs text-muted-foreground">{pendingRequests.length} {isRTL ? "طلب ينتظر الموافقة" : "requests awaiting approval"}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs font-bold" onClick={() => navigate("/settings")}>
                    {isRTL ? "عرض الكل" : "View All"} <ArrowUpRight size={12} />
                  </Button>
                </div>
                <div className="space-y-2">
                  {pendingRequests.slice(0, 3).map(req => (
                    <div key={req.id} className="flex items-center justify-between p-3 rounded-xl bg-white/80 hover:bg-white transition-all border border-amber-100">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center font-bold text-amber-700 text-xs">
                          {req.student_name?.[0] || "?"}
                        </div>
                        <div>
                          <p className="text-sm font-bold">{req.student_name}</p>
                          <p className="text-[10px] text-muted-foreground">{req.level || req.grade || "—"}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-[10px] font-bold">
                        {isRTL ? "معلق" : "Pending"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Overview 2-col: Attendance summary + Announcements */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AttendanceReportCard records={allAttendance} />
              <AnnouncementsWidget announcements={announcements} />
            </div>

            {/* Overview bottom: Financial + Recent Attendance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FinancialOverviewCard studentFees={studentFees} feePayments={feePayments} />

              {/* Recent Attendance mini */}
              <Card className="p-6 border-none shadow-sm hover:shadow-lg transition-all duration-500 bg-white/50 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                      <ClipboardCheck className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base">{t("dashboard.recentAttendance", language)}</h3>
                      <p className="text-xs text-muted-foreground">{todayAttendance} {t("dashboard.attendanceToday", language)}</p>
                    </div>
                  </div>
                  <button className="text-blue-600 text-xs font-semibold hover:underline flex items-center gap-1" onClick={() => navigate("/attendance")}>
                    {t("common.view", language)} <ArrowUpRight size={12} />
                  </button>
                </div>
                {attendance.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                    <ClipboardCheck size={40} className="opacity-10 mb-3" />
                    <p className="text-sm">{t("common.noRecords", language)}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {attendance.map(a => (
                      <div key={a.id} className="flex items-center justify-between p-3 rounded-2xl bg-stone-50/50 hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-stone-100">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-stone-200 flex items-center justify-center font-bold text-stone-500 text-sm">
                            {a.student_name?.[0]}
                          </div>
                          <div>
                            <p className="text-sm font-bold">{a.student_name}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {a.type?.replace("_", " ")} {a.time && `· ${a.time}`}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={a.status === "present" ? "default" : a.status === "late" ? "secondary" : "destructive"}
                          className="px-3 py-1 rounded-lg text-xs capitalize font-bold"
                        >
                          {isRTL
                            ? (a.status === "present" ? "حاضر" : a.status === "late" ? "متأخر" : "غائب")
                            : a.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              TAB 2: ACADEMIC & ATTENDANCE
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          <TabsContent value="academic" className="mt-6 space-y-6 outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2/3 */}
              <div className="lg:col-span-2 space-y-6">
                <AttendanceTrendsCard records={allAttendance} />
                <GradeDistributionChart students={students} />
              </div>
              {/* Right 1/3 */}
              <div className="space-y-6">
                <Card className="p-4 overflow-hidden relative border-none shadow-sm hover:shadow-md transition-all">
                  <div className="absolute top-0 right-0 p-2 opacity-10">
                    <CalendarIcon size={60} />
                  </div>
                  <DashboardCalendar />
                </Card>
                <LeaderboardWidget />
              </div>
            </div>

            {/* Full-width attendance list */}
            <Card className="p-6 border-none shadow-sm hover:shadow-lg transition-all bg-white/50 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                    <ClipboardCheck className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">{t("dashboard.recentAttendance", language)}</h3>
                    <p className="text-xs text-muted-foreground">{todayAttendance} {t("dashboard.attendanceToday", language)}</p>
                  </div>
                </div>
                <button className="text-blue-600 text-xs font-semibold hover:underline flex items-center gap-1" onClick={() => navigate("/attendance")}>
                  {t("common.view", language)} <ArrowUpRight size={12} />
                </button>
              </div>
              {attendance.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <ClipboardCheck size={48} className="opacity-10 mb-4" />
                  <p>{t("common.noRecords", language)}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {attendance.map(a => (
                    <div key={a.id} className="flex items-center justify-between p-4 rounded-2xl bg-stone-50/50 hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-stone-100">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-stone-200 flex items-center justify-center font-bold text-stone-500">
                          {a.student_name?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold">{a.student_name}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {a.type?.replace("_", " ")} {a.time && `· ${a.time}`}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={a.status === "present" ? "default" : a.status === "late" ? "secondary" : "destructive"}
                        className="px-3 py-1 rounded-lg text-xs capitalize font-bold"
                      >
                        {isRTL
                          ? (a.status === "present" ? "حاضر" : a.status === "late" ? "متأخر" : "غائب")
                          : a.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              TAB 3: FINANCIAL & MEDICAL
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          <TabsContent value="finance" className="mt-6 space-y-6 outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FinancialOverviewCard studentFees={studentFees} feePayments={feePayments} />
              <MedicalAlertsWidget students={students} />
            </div>

            {/* Bottom: Announcements wide */}
            <AnnouncementsWidget announcements={announcements} />
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}