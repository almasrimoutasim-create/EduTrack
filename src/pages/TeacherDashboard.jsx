import React, { useEffect, useState } from "react";
import {
  Users,
  Calendar,
  BookOpen,
  AlertCircle,
  TrendingUp,
  MessageSquare,
  ClipboardList,
  Edit3,
  FileText,
  Plus,
  GraduationCap,
  Star,
  Zap,
  RefreshCw
} from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import PageHeader from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all border-2 border-stone-200 bg-white text-stone-800 hover:bg-stone-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const btnPrimary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all bg-stone-900 text-white hover:bg-black cursor-pointer shadow-lg shadow-stone-200 disabled:opacity-50 disabled:cursor-not-allowed";

const BACKEND = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");

function getAuthHeaders() {
  const token =
    localStorage.getItem('portal_jwt_token') ||
    localStorage.getItem('jwt_token') ||
    localStorage.getItem('auth_token') ||
    localStorage.getItem('token');
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

const EMPTY_STATS = {
  totalStudents: 0,
  todayLessons: 0,
  pendingGrading: 0,
  avgPerformance: 0,
  completedAssignments: 0,
  totalAssignments: 0,
  teachingHours: 0,
};

const EMPTY_DISTRIBUTION = { excellent: 0, good: 0, needsHelp: 0 };

const ALERT_STYLES = {
  grading: { icon: ClipboardList, color: "text-rose-500" },
  support: { icon: Zap, color: "text-amber-500" },
  attendance: { icon: AlertCircle, color: "text-rose-500" },
  info: { icon: AlertCircle, color: "text-stone-400" },
};

export default function TeacherDashboard() {
  const { language } = useLanguage();
  const isRTL = language === "ar";

  const [stats, setStats] = useState(EMPTY_STATS);
  const [distribution, setDistribution] = useState(EMPTY_DISTRIBUTION);
  const [lessons, setLessons] = useState([]);
  const [starStudents, setStarStudents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND}/api/teacher/dashboard-stats`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${res.status})`);
      }
      const data = await res.json();
      setStats({ ...EMPTY_STATS, ...(data.stats || {}) });
      setDistribution({ ...EMPTY_DISTRIBUTION, ...(data.performanceDistribution || {}) });
      setLessons(Array.isArray(data.todayLessons) ? data.todayLessons : []);
      setStarStudents(Array.isArray(data.starStudents) ? data.starStudents : []);
      setAlerts(Array.isArray(data.alerts) ? data.alerts : []);
    } catch (e) {
      setError(e.message || (isRTL ? "تعذر تحميل البيانات" : "Failed to load data"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fmtNum = (v) => Number(v || 0).toLocaleString(isRTL ? "ar-EG" : "en-US");

  const statCards = [
    { label: isRTL ? "إجمالي الطلاب" : "Total Students", value: fmtNum(stats.totalStudents), icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: isRTL ? "حصص اليوم" : "Today's Lessons", value: fmtNum(lessons.length), icon: BookOpen, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: isRTL ? "مهام للتصحيح" : "Pending Grading", value: fmtNum(stats.pendingGrading), icon: ClipboardList, color: "text-rose-500", bg: "bg-rose-50" },
    { label: isRTL ? "متوسط الأداء" : "Avg Class Perf", value: `${fmtNum(stats.avgPerformance)}٪`.replace("٪", isRTL ? "٪" : "%"), icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
  ];

  const distTotal = (distribution.excellent || 0) + (distribution.good || 0) + (distribution.needsHelp || 0);
  const distRows = [
    { key: "excellent", label: isRTL ? "ممتاز (85+)" : "Excellent (85+)", count: distribution.excellent || 0, bar: "bg-emerald-500" },
    { key: "good", label: isRTL ? "جيد (60-84)" : "Good (60-84)", count: distribution.good || 0, bar: "bg-indigo-500" },
    { key: "needsHelp", label: isRTL ? "يحتاج دعماً (أقل من 60)" : "Needs help (<60)", count: distribution.needsHelp || 0, bar: "bg-rose-500" },
  ];

  return (
    <div className="space-y-10 pb-24" dir={isRTL ? "rtl" : "ltr"}>
      <PageHeader
        title={isRTL ? "لوحة تحكم المعلم" : "Teacher Dashboard"}
        subtitle={isRTL ? "أهلاً بك، إليك ملخص لأداء طلابك ومهامك التدريسية اليوم." : "Welcome back. Here's a summary of student performance and your teaching tasks."}
      >
        <div className="flex gap-3">
          <button className={`${btnOutline} rounded-full h-12 px-6`}>
            <Calendar size={18} />
            {isRTL ? "الجدول الكامل" : "Full Schedule"}
          </button>
          <button className={`${btnPrimary} rounded-full h-12 px-6`}>
            <Plus size={18} />
            {isRTL ? "إضافة محتوى" : "Add Content"}
          </button>
        </div>
      </PageHeader>

      {error && (
        <Card className="p-6 border-none shadow-sm bg-rose-50 rounded-[32px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle size={22} className="text-rose-500 shrink-0" />
            <p className="text-sm font-bold text-rose-700">
              {isRTL ? "تعذر تحميل بيانات اللوحة" : "Failed to load dashboard data"}: {error}
            </p>
          </div>
          <button onClick={fetchDashboard} className={`${btnOutline} rounded-xl h-10 px-5 shrink-0`}>
            <RefreshCw size={16} />
            {isRTL ? "إعادة المحاولة" : "Retry"}
          </button>
        </Card>
      )}

      {/* Teacher Impact Stats — real values from /api/teacher/dashboard-stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <Card key={`skeleton-${i}`} className="p-6 border-none shadow-sm bg-white rounded-[32px] flex items-center gap-4 animate-pulse" aria-busy="true">
              <div className="h-12 w-12 rounded-2xl bg-stone-200" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-2/3 rounded bg-stone-200" />
                <div className="h-5 w-1/3 rounded bg-stone-200" />
              </div>
            </Card>
          ))
        ) : (
          statCards.map((stat) => (
            <Card key={stat.label} className="p-6 border-none shadow-sm bg-white rounded-[32px] flex items-center gap-4 hover:shadow-md transition-all">
              <div className={`h-12 w-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest">{stat.label}</p>
                <h4 className="text-xl font-black text-stone-900">{stat.value}</h4>
              </div>
            </Card>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Academic Overview Section */}
        <section className="lg:col-span-8 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-serif font-bold text-stone-900">{isRTL ? "الحصص الدراسية" : "Class Schedule"}</h3>
            {lessons.some((l) => l.status === 'active') && (
              <Badge className="bg-emerald-50 text-emerald-600 border-none rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                {isRTL ? "مباشر الآن" : "Live Now"}
              </Badge>
            )}
          </div>

          {loading ? (
            <div className="space-y-4" aria-busy="true">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="p-6 border-none shadow-sm rounded-[32px] bg-white animate-pulse">
                  <div className="h-5 w-1/2 rounded bg-stone-200 mb-2" />
                  <div className="h-3 w-1/4 rounded bg-stone-200" />
                </Card>
              ))}
            </div>
          ) : lessons.length === 0 ? (
            <Card className="p-10 border-none shadow-sm rounded-[32px] bg-white text-center">
              <GraduationCap size={32} className="mx-auto mb-3 text-stone-300" />
              <p className="font-bold text-stone-500">
                {isRTL ? "لا توجد حصص مجدولة اليوم" : "No lessons scheduled today"}
              </p>
            </Card>
          ) : (
            <motion.div className="space-y-4">
              {lessons.map((cls) => (
                <motion.div
                  key={`${cls.kind}-${cls.id}`}
                  variants={{ hidden: { y: 10, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
                >
                  <Card className={`p-6 border-none shadow-sm rounded-[32px] flex items-center justify-between group cursor-pointer transition-all ${cls.status === 'active' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-white hover:bg-stone-50'}`}>
                    <div className="flex items-center gap-6">
                      <div className={`h-14 w-14 rounded-2xl flex items-center justify-center ${cls.status === 'active' ? 'bg-white/10 text-white' : 'bg-stone-50 text-stone-400 group-hover:bg-white'}`}>
                        <GraduationCap size={28} />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg leading-tight">{cls.name}</h4>
                        <div className="flex items-center gap-3 mt-1 opacity-60">
                          {cls.time && (
                            <span className="text-[10px] font-black uppercase tracking-widest">{cls.time}</span>
                          )}
                          {cls.kind === 'schedule' && (
                            <>
                              <span className="h-1 w-1 rounded-full bg-current" />
                              <span className="text-[10px] font-black uppercase tracking-widest">
                                {fmtNum(cls.enrolled)} {isRTL ? "طالباً" : "Students"}
                              </span>
                            </>
                          )}
                          {cls.room && (
                            <>
                              <span className="h-1 w-1 rounded-full bg-current" />
                              <span className="text-[10px] font-black uppercase tracking-widest">{cls.room}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <button className={`rounded-xl h-10 px-6 font-bold transition-all border-none cursor-pointer ${cls.status === 'active' ? 'bg-white text-indigo-600 hover:bg-white/90' : 'bg-stone-50 text-stone-900 group-hover:bg-stone-900 group-hover:text-white'}`}>
                      {cls.status === 'active' ? (isRTL ? "دخول الفصل" : "Enter Class") : (isRTL ? "التفاصيل" : "Details")}
                    </button>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Performance distribution — computed from recorded grades */}
          <div className="pt-8 border-t border-stone-100">
            <h3 className="text-2xl font-serif font-bold text-stone-900 mb-6">
              {isRTL ? "توزيع أداء الطلاب" : "Student Performance"}
            </h3>
            {loading ? (
              <Card className="p-6 border-none shadow-sm rounded-[32px] bg-white animate-pulse" aria-busy="true">
                <div className="h-4 rounded bg-stone-200 mb-3" />
                <div className="h-4 rounded bg-stone-200 w-2/3" />
              </Card>
            ) : distTotal === 0 ? (
              <Card className="p-10 border-none shadow-sm rounded-[32px] bg-white text-center">
                <TrendingUp size={32} className="mx-auto mb-3 text-stone-300" />
                <p className="font-bold text-stone-500">
                  {isRTL ? "لا توجد درجات مسجلة بعد" : "No grades recorded yet"}
                </p>
              </Card>
            ) : (
              <Card className="p-6 border-none shadow-sm rounded-[32px] bg-white space-y-4">
                {distRows.map((row) => {
                  const pct = Math.round((row.count / distTotal) * 100);
                  return (
                    <div key={row.key}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-bold text-stone-700">{row.label}</span>
                        <span className="text-sm font-black text-stone-900">
                          {fmtNum(row.count)} ({fmtNum(pct)}{isRTL ? "٪" : "%"})
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full bg-stone-100 overflow-hidden">
                        <div className={`h-full rounded-full ${row.bar}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </Card>
            )}
          </div>

          <div className="pt-8 border-t border-stone-100">
            <h3 className="text-2xl font-serif font-bold text-stone-900 mb-6">{isRTL ? "الطلاب الأكثر تفاعلاً" : "Star Students"}</h3>
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6" aria-busy="true">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex flex-col items-center p-6 bg-white rounded-[32px] shadow-sm animate-pulse">
                    <div className="h-16 w-16 rounded-2xl bg-stone-200 mb-4" />
                    <div className="h-3 w-2/3 rounded bg-stone-200" />
                  </div>
                ))}
              </div>
            ) : starStudents.length === 0 ? (
              <Card className="p-10 border-none shadow-sm rounded-[32px] bg-white text-center">
                <Star size={32} className="mx-auto mb-3 text-stone-300" />
                <p className="font-bold text-stone-500">
                  {isRTL ? "لا يوجد طلاب مسجلون بعد" : "No students enrolled yet"}
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {starStudents.map((student) => (
                  <div key={student.id} className="flex flex-col items-center p-6 bg-white rounded-[32px] shadow-sm hover:shadow-md transition-all group cursor-pointer">
                    <div className="h-16 w-16 rounded-2xl bg-stone-50 flex items-center justify-center font-black text-stone-400 group-hover:bg-indigo-600 group-hover:text-white transition-all mb-4">
                      {(student.name)?.[0] || "؟"}
                    </div>
                    <span className="text-sm font-bold text-stone-800 text-center leading-tight mb-1">{student.name}</span>
                    <Badge className="bg-amber-50 text-amber-600 border-none text-[8px] font-black px-2 py-0.5 gap-1">
                      <Star size={8} fill="currentColor" />
                      {fmtNum(student.avgScore)}{isRTL ? "٪" : "%"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Sidebar - Quick Actions & Analytics */}
        <aside className="lg:col-span-4 space-y-10">
          <Card className="p-8 border-none shadow-sm bg-stone-900 text-white rounded-[48px] relative overflow-hidden">
            <div className="relative z-10">
              <h4 className="text-xl font-serif font-bold mb-8">{isRTL ? "أدوات المعلم" : "Teacher Tools"}</h4>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: isRTL ? "رصد الغياب" : "Attendance", icon: ClipboardList, color: "text-blue-400", path: "/attendance" },
                  { label: isRTL ? "وضع الدرجات" : "Grading", icon: Edit3, color: "text-amber-400", path: "/grading" },
                  { label: isRTL ? "رسالة جماعية" : "Broadcast", icon: MessageSquare, color: "text-emerald-400", path: "/broadcast" },
                  { label: isRTL ? "خطة الدرس" : "Lesson Plan", icon: FileText, color: "text-purple-400", path: "/lesson-plan" },
                ].map((tool) => (
                  <div
                    key={tool.label}
                    className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 cursor-pointer transition-all flex flex-col items-center gap-3"
                    onClick={() => window.location.href = tool.path}
                    role="button"
                    tabIndex={0}
                  >
                    <tool.icon size={20} className={tool.color} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 text-center">{tool.label}</span>
                  </div>
                ))}
              </div>
              <button className="w-full mt-8 bg-white text-stone-900 hover:bg-stone-100 rounded-2xl h-12 font-bold shadow-xl cursor-pointer" onClick={() => window.location.href = '/'}>
                {isRTL ? "فتح بنك الأسئلة" : "Open Question Bank"}
              </button>
            </div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
          </Card>

          <Card className="p-8 border-none shadow-sm bg-white rounded-[48px]">
            <h4 className="font-bold text-stone-900 mb-8">{isRTL ? "تنبيهات الأداء" : "Performance Alerts"}</h4>
            {loading ? (
              <div className="space-y-6 animate-pulse" aria-busy="true">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-stone-200" />
                    <div className="h-3 flex-1 rounded bg-stone-200" />
                  </div>
                ))}
              </div>
            ) : alerts.length === 0 ? (
              <p className="text-sm font-bold text-stone-400 text-center py-4">
                {isRTL ? "لا توجد تنبيهات حالياً" : "No alerts at the moment"}
              </p>
            ) : (
              <div className="space-y-6">
                {alerts.map((alert) => {
                  const style = ALERT_STYLES[alert.type] || ALERT_STYLES.info;
                  const Icon = style.icon;
                  return (
                    <div key={alert.id} className="flex items-start gap-4 group cursor-pointer">
                      <div className={`h-10 w-10 shrink-0 rounded-xl bg-stone-50 flex items-center justify-center ${style.color} group-hover:scale-110 transition-transform`}>
                        <Icon size={20} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-stone-700 leading-tight group-hover:text-primary transition-colors">{alert.title}</p>
                        {alert.message && alert.message !== alert.title && (
                          <p className="text-xs text-stone-400 mt-1 leading-relaxed">{alert.message}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}
