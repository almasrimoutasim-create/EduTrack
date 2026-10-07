import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Home, Video, Calendar, BookOpen, LogOut, Menu, Bell,
  ShoppingBag, Star, ClipboardCheck, Trophy, Rocket, LifeBuoy,
  LogIn, LogOut as LogOutIcon, Wallet, RefreshCw, PlayCircle,
  Clock, MapPin, GraduationCap, X, FileText, Award,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { entities } from "@/api/dbClient";
import SupportWidget from "@/components/shared/SupportWidget";
import { useStudentDashboard, studentApiFetch } from "@/hooks/useStudentDashboard";

/* ---------- small UI helpers ---------- */
function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-stone-200/70 rounded-xl ${className}`} />;
}

function ErrorBox({ message, onRetry }) {
  return (
    <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-4 text-sm flex items-center justify-between gap-3">
      <span className="font-semibold">{message || "تعذر تحميل البيانات"}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 bg-white border border-rose-200 rounded-xl px-3 py-1.5 text-xs font-bold hover:bg-rose-100 transition cursor-pointer"
        >
          <RefreshCw size={13} /> إعادة المحاولة
        </button>
      )}
    </div>
  );
}

function Modal({ open, onClose, title, children, wide = false }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-stone-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-3xl shadow-2xl w-full ${wide ? "max-w-4xl" : "max-w-lg"} max-h-[90vh] overflow-hidden flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <h3 className="font-black text-stone-900">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-stone-100 text-stone-500 cursor-pointer" aria-label="إغلاق">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}

/* ---------- exam runner (science exam CTA + homework) ---------- */
function ExamRunner({ item, kind, studentName, studentId, onDone, onClose }) {
  const questions = useMemo(() => {
    const q = item?.questions;
    if (Array.isArray(q)) return q;
    if (typeof q === "string") { try { const p = JSON.parse(q); return Array.isArray(p) ? p : []; } catch { return []; } }
    return [];
  }, [item]);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);

  if (!item) return null;

  const setAns = (qid, val) => setAnswers((p) => ({ ...p, [qid]: val }));
  const toggleCheck = (qid, opt) => setAnswers((p) => {
    const cur = p[qid] || [];
    return { ...p, [qid]: cur.includes(opt) ? cur.filter((o) => o !== opt) : [...cur, opt] };
  });

  const handleSubmit = async () => {
    if (questions.length === 0) { toast.error("لا توجد أسئلة في هذا الاختبار"); return; }
    const unanswered = questions.filter((q) => {
      const a = answers[q.id];
      return a === undefined || a === "" || (Array.isArray(a) && a.length === 0);
    });
    if (unanswered.length > 0 && !confirm(`لم تجب عن ${unanswered.length} سؤال — إرسال على أي حال؟`)) return;
    setSubmitting(true);
    try {
      let autoScore = 0;
      const grades = {};
      questions.forEach((q) => {
        const ans = answers[q.id];
        if (q.type === "mcq") {
          const ok = ans === q.correctAnswer;
          grades[q.id] = ok ? Number(q.points || 1) : 0;
          autoScore += grades[q.id];
        } else if (q.type === "checkbox") {
          const correct = q.correctAnswer || [];
          const a = ans || [];
          const ok = correct.length === a.length && correct.every((v) => a.includes(v));
          grades[q.id] = ok ? Number(q.points || 1) : 0;
          autoScore += grades[q.id];
        } else {
          grades[q.id] = null; // needs manual grading
        }
      });
      const needsManual = questions.some((q) => q.type === "short" || q.type === "paragraph");
      await entities.TeacherSubmission.create({
        teacher_id: item.teacher_id,
        assignment_id: kind === "assignment" ? item.id : null,
        exam_id: kind === "exam" ? item.id : null,
        student_id: studentId,
        student_name: studentName,
        answers,
        score: autoScore,
        status: needsManual ? "submitted" : "graded",
      });
      toast.success(needsManual ? "تم تسليم الإجابات — بانتظار تصحيح المعلم" : `تم التصحيح التلقائي: درجتك ${autoScore}`);
      onDone?.(autoScore);
    } catch (e) {
      toast.error(e.message || "فشل إرسال الإجابات");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-stone-900 text-white rounded-2xl p-5">
        <h4 className="font-black">{item.title}</h4>
        <p className="text-xs text-stone-300 mt-1">{item.subject} • الدرجة الكلية: <span className="num-en">{item.total_points}</span></p>
        {item.description && <p className="text-xs text-stone-300 mt-2">{item.description}</p>}
      </div>
      {questions.length === 0 && <p className="text-sm text-stone-500">لا توجد أسئلة مسجلة لهذا العنصر بعد.</p>}
      {questions.map((q, idx) => (
        <div key={q.id || idx} className="border border-stone-200 rounded-2xl p-4 space-y-3">
          <p className="text-sm font-bold text-stone-900">{idx + 1}. {q.text || q.question} <span className="text-[11px] text-stone-400 num-en">({q.points || 1})</span></p>
          {(q.type === "mcq") && (q.options || []).map((opt) => (
            <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer bg-stone-50 rounded-xl px-3 py-2 hover:bg-stone-100">
              <input type="radio" name={`q-${q.id}`} checked={answers[q.id] === opt} onChange={() => setAns(q.id, opt)} />
              <span>{opt}</span>
            </label>
          ))}
          {(q.type === "checkbox") && (q.options || []).map((opt) => (
            <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer bg-stone-50 rounded-xl px-3 py-2 hover:bg-stone-100">
              <input type="checkbox" checked={(answers[q.id] || []).includes(opt)} onChange={(e) => toggleCheck(q.id, opt, e.target.checked)} />
              <span>{opt}</span>
            </label>
          ))}
          {(!q.type || q.type === "short" || q.type === "paragraph") && (
            <textarea
              value={answers[q.id] || ""}
              onChange={(e) => setAns(q.id, e.target.value)}
              rows={q.type === "paragraph" ? 4 : 2}
              placeholder="اكتب إجابتك هنا..."
              className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-teal-500"
            />
          )}
        </div>
      ))}
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="flex-1 bg-stone-900 text-white rounded-2xl py-3 text-sm font-black hover:bg-black disabled:opacity-50 cursor-pointer"
        >
          {submitting ? "جارٍ الإرسال والتصحيح..." : "تسليم الإجابات"}
        </button>
        <button onClick={onClose} className="px-5 rounded-2xl border border-stone-200 text-sm font-bold hover:bg-stone-50 cursor-pointer">
          إلغاء
        </button>
      </div>
    </div>
  );
}

/* ================= MAIN DASHBOARD ================= */
export default function StudentDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [weekOpen, setWeekOpen] = useState(false);
  const [runner, setRunner] = useState(null); // { item, kind }

  const { profile, wallet, today, homework, lastScan, weekCache, fetchWeek, scanState, scan, refetchAll } =
    useStudentDashboard();

  const student = profile.data?.profile || {};
  const awards = profile.data?.awards || [];
  const xp = Number(student.xp) || 0;
  const level = Number(student.level) || 1;
  const xpProgress = Math.min(100, Math.round(((xp % 500) / 500) * 100));

  const todayClasses = today.data?.classes || [];
  const assignments = homework.data?.assignments || [];
  const exams = homework.data?.exams || [];
  const summary = homework.data?.summary || {};
  const last = lastScan.data?.last_scan || null;
  const location = lastScan.data?.assumed_location || "—";

  const scienceExam = useMemo(() => {
    const isScience = (s) => /علوم|science|فيزياء|كيمياء|أحياء/i.test(String(s || ""));
    return exams.find((e) => isScience(e.subject)) || exams[0] || null;
  }, [exams]);

  /* secondary tabs (JWT-secured via entities client) */
  const studentUuid = student.id || "";
  const studentCode = student.student_id || "";
  const grade = student.grade || "";

  const { data: announcements = [], isLoading: loadingAnn, error: errAnn, refetch: refetchAnn } = useQuery({
    queryKey: ["dash-announcements"],
    queryFn: () => entities.OfficialAnnouncement.list("-created_at", 50),
    enabled: activeTab === "notifications",
  });
  const myAnnouncements = announcements.filter((a) => ["students", "all"].includes(a.target_audience));

  const { data: gradesList = [], isLoading: loadingGrades, error: errGrades, refetch: refetchGrades } = useQuery({
    queryKey: ["dash-grades", studentCode],
    queryFn: () => entities.StudentGrade.filter({ student_id: studentCode }),
    enabled: activeTab === "grades" && !!studentCode,
  });
  const { data: attendanceList = [], isLoading: loadingAtt, error: errAtt, refetch: refetchAtt } = useQuery({
    queryKey: ["dash-attendance", studentUuid],
    queryFn: () => entities.Attendance.filter({ student_id: studentUuid }, "-date"),
    enabled: activeTab === "attendance" && !!studentUuid,
  });
  const { data: subjectsList = [], isLoading: loadingSubj, error: errSubj, refetch: refetchSubj } = useQuery({
    queryKey: ["dash-subjects", grade],
    queryFn: () => entities.Subject.filter({ grade }),
    enabled: activeTab === "materials" && !!grade,
  });
  const { data: sessionsList = [], isLoading: loadingSess, error: errSess, refetch: refetchSess } = useQuery({
    queryKey: ["dash-sessions"],
    queryFn: () => entities.VirtualSession.list("-created_at", 20),
    enabled: activeTab === "classroom",
  });
  const videosQuery = useQuery({
    queryKey: ["dash-videos"],
    queryFn: () => studentApiFetch("/api/student/teacher-videos"),
    enabled: activeTab === "videos",
    retry: false,
  });

  const menuGroups = [
    {
      label: "الرئيسية",
      items: [
        { id: "overview", label: "الرئيسية", icon: Home },
        { id: "schedule", label: "الجدول الدراسي", icon: Calendar },
        { id: "notifications", label: "الإشعارات", icon: Bell },
        { id: "__store", label: "متجر المدرسة", icon: ShoppingBag, route: "/store" },
      ],
    },
    {
      label: "الدراسة",
      items: [
        { id: "homework", label: "الواجبات", icon: FileText },
        { id: "materials", label: "المواد الدراسية", icon: BookOpen },
        { id: "classroom", label: "الفصل الافتراضي", icon: Video },
        { id: "videos", label: "الفيديوهات المسجلة", icon: PlayCircle },
        { id: "grades", label: "الدرجات", icon: Star },
        { id: "attendance", label: "سجل الحضور", icon: ClipboardCheck },
      ],
    },
    {
      label: "الإنجازات",
      items: [
        { id: "badges", label: "الأوسمة", icon: Trophy },
        { id: "levels", label: "النقاط والمستويات", icon: Rocket },
      ],
    },
    {
      label: "المساعدة",
      items: [{ id: "support", label: "الدعم الفني", icon: LifeBuoy }],
    },
  ];

  const goItem = (item) => {
    if (item.route) navigate(item.route);
    else setActiveTab(item.id);
  };

  const handleLogout = () => {
    logout(false);
    ["portal_jwt_token", "jwt_token", "auth_token", "token", "portal_user", "portal_user_id", "portal_user_name", "portal_role", "portal_is_auth"].forEach((k) => {
      try { localStorage.removeItem(k); } catch { /* ignore */ }
    });
    navigate("/login");
  };

  const handleScan = async (direction) => {
    try {
      const res = await scan(direction);
      toast.success(direction === "IN" ? `تم تسجيل الدخول (${res.last_scan?.time || ""}) — ${res.assumed_location}` : `تم تسجيل الخروج (${res.last_scan?.time || ""}) — ${res.assumed_location}`);
      profile.refetch().catch(() => {});
    } catch (e) {
      toast.error(e.message || "فشل تسجيل المسح");
    }
  };

  const openWeek = () => {
    setWeekOpen(true);
    if (!weekCache.data && !weekCache.loading) fetchWeek().catch(() => toast.error("تعذر تحميل الجدول الأسبوعي"));
  };

  const startRunner = (item, kind) => {
    if (item.is_submitted) {
      toast.info(`تم تسليم هذا ${kind === "exam" ? "الاختبار" : "الواجب"} مسبقاً — الدرجة: ${item.submission?.score ?? "بانتظار التصحيح"}`);
      return;
    }
    if (!item.teacher_id) { toast.error("تعذر فتح الاختبار: بيانات المعلم غير متوفرة"); return; }
    setRunner({ item, kind });
  };

  const DAYS_AR = { Saturday: "السبت", Sunday: "الأحد", Monday: "الاثنين", Tuesday: "الثلاثاء", Wednesday: "الأربعاء", Thursday: "الخميس", Friday: "الجمعة" };

  return (
    <div className="flex h-screen bg-stone-50 text-stone-900 text-right" dir="rtl">
      <SupportWidget />

      {/* ===== Sidebar ===== */}
      <aside className={`bg-slate-900 text-white w-64 py-7 px-4 absolute inset-y-0 right-0 transform ${sidebarOpen ? "translate-x-0" : "translate-x-full"} md:relative md:translate-x-0 transition duration-200 ease-in-out z-20 shadow-lg flex flex-col overflow-y-auto`}>
        <div className="flex items-center justify-between px-2">
          <h2 className="text-lg font-black text-teal-300">مدارس عباد الرحمن</h2>
        </div>
        <p className="px-2 text-[11px] text-slate-400">بوابة الطالب</p>

        <nav className="mt-6 space-y-6 flex-1">
          {menuGroups.map((g) => (
            <div key={g.label}>
              <p className="px-4 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{g.label}</p>
              <div className="space-y-1">
                {g.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => goItem(item)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors text-sm font-semibold cursor-pointer ${isActive ? "bg-teal-600 text-white shadow-md" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="pt-4 border-t border-slate-800 mt-4">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-rose-400 hover:bg-slate-800 transition-colors text-sm font-semibold cursor-pointer">
            <LogOut className="w-5 h-5" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* ===== Main ===== */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header: real profile */}
        <header className="bg-white shadow-sm min-h-16 flex items-center justify-between px-6 py-2 z-10 gap-4 flex-wrap">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden text-stone-600 cursor-pointer" aria-label="القائمة">
            <Menu className="w-6 h-6" />
          </button>
          {profile.loading ? (
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 !rounded-full" />
              <div className="space-y-1"><Skeleton className="w-32 h-4" /><Skeleton className="w-20 h-3" /></div>
            </div>
          ) : profile.error ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-rose-600 font-bold">تعذر تحميل الملف الشخصي</span>
              <button onClick={() => profile.refetch()} className="text-teal-700 font-bold underline cursor-pointer">إعادة المحاولة</button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {student.avatar ? (
                <img src={student.avatar} alt={student.full_name} className="w-10 h-10 rounded-full object-cover border" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-black">
                  {String(student.full_name || "ط").trim().charAt(0)}
                </div>
              )}
              <div>
                <p className="font-black text-stone-900 text-sm leading-tight">مرحباً، {student.full_name || "طالبنا العزيز"}</p>
                <p className="text-[11px] text-stone-500 num-en">ID: {student.student_id || "—"} • الصف {student.grade || "—"}{student.section ? ` • ${student.section}` : ""} • المستوى <span className="num-en">{level}</span> • <span className="num-en">{xp}</span> XP</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            {wallet.loading ? <Skeleton className="w-24 h-8" /> : wallet.error ? (
              <button onClick={() => wallet.refetch()} className="text-xs font-bold text-rose-600 underline cursor-pointer">تعذر تحميل المحفظة — إعادة</button>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-black rounded-xl px-3 py-1.5">
                <Wallet size={14} /> <span className="num-en">{Number(wallet.data?.wallet?.balance || 0).toLocaleString()} {wallet.data?.wallet?.currency || "SDG"}</span>
              </span>
            )}
            <button onClick={refetchAll} className="p-2 rounded-xl hover:bg-stone-100 text-stone-500 cursor-pointer" title="تحديث البيانات" aria-label="تحديث البيانات">
              <RefreshCw size={16} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          {/* ===== OVERVIEW ===== */}
          {activeTab === "overview" && (
            <div className="space-y-6 max-w-6xl mx-auto">
              <h1 className="text-2xl font-black">لوحة تحكم الطالب</h1>

              {/* Wallet + NFC */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white rounded-3xl border border-stone-100 shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Wallet className="text-emerald-600" size={20} />
                    <h3 className="font-black">المحفظة الرقمية (EduWallet)</h3>
                  </div>
                  {wallet.loading ? (<><Skeleton className="h-8 w-40 mb-2" /><Skeleton className="h-4 w-56" /></>) : wallet.error ? (
                    <ErrorBox message={wallet.error} onRetry={() => wallet.refetch()} />
                  ) : (
                    <div>
                      <p className="text-3xl font-black num-en">{Number(wallet.data?.wallet?.balance || 0).toLocaleString()} <span className="text-sm font-bold text-stone-500">{wallet.data?.wallet?.currency}</span></p>
                      <p className="text-xs text-stone-500 mt-1">حالة البطاقة الذكية: <span className="font-bold text-emerald-600">{wallet.data?.wallet?.card_status === "active" ? "نشطة" : wallet.data?.wallet?.card_status || "—"}</span></p>
                      {(wallet.data?.transactions || []).length > 0 && (
                        <ul className="mt-3 space-y-1 text-xs text-stone-600">
                          {wallet.data.transactions.slice(0, 3).map((t) => (
                            <li key={t.id} className="flex justify-between bg-stone-50 rounded-lg px-3 py-1.5">
                              <span>{t.type}</span><span className="num-en font-bold">{t.amount}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-slate-900 text-white rounded-3xl shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-teal-500/20 text-teal-300 text-[10px] font-black px-2 py-0.5 rounded-lg">NFC Smart Card Simulator</span>
                  </div>
                  <h3 className="font-black mb-3">محاكي بوابات الحضور والانصراف</h3>
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => handleScan("IN")}
                      disabled={scanState.loading}
                      className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 rounded-2xl py-3 text-sm font-black transition cursor-pointer"
                    >
                      <LogIn size={16} /> {scanState.loading && scanState.direction === "IN" ? "جارٍ تسجيل الدخول..." : "مسح دخول (IN)"}
                    </button>
                    <button
                      onClick={() => handleScan("OUT")}
                      disabled={scanState.loading}
                      className="flex-1 inline-flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 rounded-2xl py-3 text-sm font-black transition cursor-pointer"
                    >
                      <LogOutIcon size={16} /> {scanState.loading && scanState.direction === "OUT" ? "جارٍ تسجيل الخروج..." : "مسح خروج (OUT)"}
                    </button>
                  </div>
                  {scanState.error && <p className="text-rose-300 text-xs mb-2">{scanState.error}</p>}
                  {lastScan.loading ? <Skeleton className="h-4 w-48 !bg-slate-700" /> : lastScan.error ? (
                    <p className="text-xs text-slate-400">تعذر تحميل آخر مسح — <button className="underline cursor-pointer" onClick={() => lastScan.refetch()}>إعادة</button></p>
                  ) : (
                    <div className="text-xs text-slate-300 space-y-1">
                      <p className="flex items-center gap-1.5"><Clock size={13} /> آخر مسح مسجل: <span className="font-bold text-white num-en">{last ? `${String(last.date).slice(0, 10)} • ${last.time} (${last.type})` : "لا يوجد بعد"}</span></p>
                      <p className="flex items-center gap-1.5"><MapPin size={13} /> الموقع الحالي المفترض: <span className="font-bold text-teal-300">{location}</span></p>
                    </div>
                  )}
                </div>
              </div>

              {/* Today schedule preview */}
              <div className="bg-white rounded-3xl border border-stone-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black flex items-center gap-2"><Calendar size={18} className="text-teal-600" /> حصص اليوم ({today.data?.day ? DAYS_AR[today.data.day] || today.data.day : "—"})</h3>
                  <div className="flex gap-2">
                    <button onClick={() => today.refetch()} className="text-xs font-bold text-stone-500 hover:text-stone-800 underline cursor-pointer">تحديث</button>
                    <button onClick={openWeek} className="text-xs font-black bg-stone-900 text-white rounded-xl px-4 py-2 hover:bg-black cursor-pointer">الجدول الأسبوعي الكامل</button>
                  </div>
                </div>
                {today.loading ? (<div className="space-y-2"><Skeleton className="h-12" /><Skeleton className="h-12" /><Skeleton className="h-12" /></div>)
                  : today.error ? <ErrorBox message={today.error} onRetry={() => today.refetch()} />
                  : todayClasses.length === 0 ? <p className="text-sm text-stone-500">لا توجد حصص مجدولة لهذا اليوم.</p>
                  : (
                    <div className="grid md:grid-cols-2 gap-3">
                      {todayClasses.map((c) => (
                        <div key={c.id} className="border border-stone-100 rounded-2xl p-4 flex items-center justify-between bg-stone-50/50">
                          <div>
                            <p className="font-black text-sm">{c.subject_name}</p>
                            <p className="text-xs text-stone-500 mt-0.5">{c.teacher_name || "—"}{c.room ? ` • قاعة ${c.room}` : ""}</p>
                          </div>
                          <span className="text-xs font-black text-teal-700 bg-teal-50 rounded-lg px-2.5 py-1 num-en">{c.start_time} - {c.end_time}</span>
                        </div>
                      ))}
                    </div>
                  )}
              </div>

              {/* Homework summary + science exam CTA */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white rounded-3xl border border-stone-100 shadow-sm p-6">
                  <h3 className="font-black mb-1 flex items-center gap-2"><FileText size={18} className="text-orange-500" /> الواجبات المنزلية</h3>
                  {homework.loading ? (<div className="space-y-2 mt-3"><Skeleton className="h-10" /><Skeleton className="h-10" /></div>)
                    : homework.error ? <ErrorBox message={homework.error} onRetry={() => homework.refetch()} />
                    : (
                      <div className="mt-2">
                        <p className="text-xs text-stone-500 mb-3">الإجمالي <span className="num-en font-black">{summary.total_assignments || 0}</span> • معلق <span className="num-en font-black text-orange-600">{summary.pending || 0}</span> • مُسلَّم <span className="num-en font-black text-emerald-600">{summary.submitted || 0}</span></p>
                        <div className="space-y-2">
                          {assignments.slice(0, 3).map((a) => (
                            <div key={a.id} className="flex items-center justify-between bg-stone-50 rounded-xl px-3 py-2 text-sm">
                              <span className="font-bold truncate">{a.title} <span className="text-[11px] text-stone-400">({a.subject})</span></span>
                              {a.is_submitted
                                ? <span className="text-[11px] font-black text-emerald-600">تم التسليم • <span className="num-en">{a.submission?.score ?? "—"}</span></span>
                                : <button onClick={() => startRunner(a, "assignment")} className="text-[11px] font-black text-teal-700 underline cursor-pointer">حل الواجب</button>}
                            </div>
                          ))}
                          {assignments.length === 0 && <p className="text-xs text-stone-500">لا توجد واجبات حالياً.</p>}
                        </div>
                        <button onClick={() => setActiveTab("homework")} className="mt-3 text-xs font-black text-stone-900 underline cursor-pointer">عرض كل الواجبات والاختبارات</button>
                      </div>
                    )}
                </div>

                <div className="bg-gradient-to-br from-teal-600 to-emerald-700 text-white rounded-3xl shadow-sm p-6">
                  <h3 className="font-black mb-1 flex items-center gap-2"><Award size={18} /> اختبار مادة العلوم</h3>
                  {homework.loading ? <Skeleton className="h-6 w-48 !bg-white/20 mt-2" /> : scienceExam ? (
                    <div className="mt-1">
                      <p className="text-sm font-bold">{scienceExam.title}</p>
                      <p className="text-xs text-teal-100 mt-0.5">الدرجة الكلية <span className="num-en">{scienceExam.total_points}</span>{scienceExam.is_submitted ? ` • تم التسليم (${scienceExam.submission?.score ?? "بانتظار التصحيح"})` : " • لم يتم الحل بعد"}</p>
                      <button
                        onClick={() => startRunner(scienceExam, "exam")}
                        className="mt-3 bg-white text-teal-800 rounded-2xl px-5 py-2.5 text-sm font-black hover:bg-teal-50 transition cursor-pointer"
                      >
                        {scienceExam.is_submitted ? "عرض حالة الاختبار" : "ابدأ الآن"}
                      </button>
                      <p className="text-[11px] text-teal-100 mt-2">تُرحَّل الدرجة والنقاط تلقائياً إلى بروفايل الطالب عند التسليم.</p>
                    </div>
                  ) : (
                    <p className="text-xs text-teal-100 mt-2">لا يوجد اختبار علوم متاح حالياً.</p>
                  )}
                </div>
              </div>

              {/* Awards strip */}
              <div className="bg-white rounded-3xl border border-stone-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-black flex items-center gap-2"><Trophy size={18} className="text-amber-500" /> الأوسمة (XP: <span className="num-en">{xp}</span> • المستوى <span className="num-en">{level}</span>)</h3>
                  <button onClick={() => setActiveTab("badges")} className="text-xs font-bold underline cursor-pointer">عرض الكل</button>
                </div>
                {profile.loading ? <div className="flex gap-2"><Skeleton className="h-16 w-32" /><Skeleton className="h-16 w-32" /></div>
                  : awards.length === 0 ? <p className="text-xs text-stone-500">لا توجد أوسمة بعد — أكمل الواجبات والحضور لكسب النقاط.</p>
                  : (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {awards.slice(0, 8).map((a) => (
                        <div key={a.id} className="shrink-0 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-2.5 text-center">
                          <p className="text-lg">{a.badge || "🏅"}</p>
                          <p className="text-[11px] font-black">{a.title}</p>
                          <p className="text-[10px] text-amber-700 num-en">+{a.points} XP</p>
                        </div>
                      ))}
                    </div>
                  )}
                <div className="mt-3 h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-l from-teal-500 to-emerald-500 rounded-full" style={{ width: `${xpProgress}%` }} />
                </div>
                <p className="text-[11px] text-stone-500 mt-1 num-en">{xpProgress}% نحو المستوى {level + 1}</p>
              </div>
            </div>
          )}

          {/* ===== SCHEDULE TAB ===== */}
          {activeTab === "schedule" && (
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-black">الجدول الدراسي</h1>
                <button onClick={openWeek} className="bg-stone-900 text-white rounded-xl px-4 py-2 text-xs font-black hover:bg-black cursor-pointer">الجدول الأسبوعي الكامل</button>
              </div>
              {today.loading ? (<div className="space-y-2"><Skeleton className="h-14" /><Skeleton className="h-14" /></div>)
                : today.error ? <ErrorBox message={today.error} onRetry={() => today.refetch()} />
                : todayClasses.length === 0 ? <p className="text-sm text-stone-500 bg-white rounded-2xl p-6">لا توجد حصص اليوم ({today.data?.day ? DAYS_AR[today.data.day] || today.data.day : ""}).</p>
                : todayClasses.map((c) => (
                  <div key={c.id} className="bg-white rounded-2xl border border-stone-100 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center"><BookOpen size={20} /></div>
                      <div>
                        <p className="font-black text-sm">{c.subject_name}</p>
                        <p className="text-xs text-stone-500">{c.teacher_name}{c.room ? ` • قاعة ${c.room}` : ""}{c.section ? ` • ${c.section}` : ""}</p>
                      </div>
                    </div>
                    <span className="text-xs font-black num-en bg-stone-100 rounded-lg px-3 py-1.5">{c.start_time} - {c.end_time}</span>
                  </div>
                ))}
            </div>
          )}

          {/* ===== HOMEWORK TAB ===== */}
          {activeTab === "homework" && (
            <div className="max-w-4xl mx-auto space-y-6">
              <h1 className="text-2xl font-black">الواجبات والاختبارات</h1>
              {homework.loading ? (<div className="space-y-2"><Skeleton className="h-16" /><Skeleton className="h-16" /></div>)
                : homework.error ? <ErrorBox message={homework.error} onRetry={() => homework.refetch()} />
                : (
                  <>
                    <section>
                      <h3 className="font-black mb-2 text-sm text-stone-500">الواجبات المعلقة والمرسلة ({assignments.length})</h3>
                      <div className="space-y-2">
                        {assignments.map((a) => (
                          <div key={a.id} className="bg-white rounded-2xl border border-stone-100 p-4 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-black text-sm">{a.title}</p>
                              <p className="text-xs text-stone-500 truncate">{a.subject} • التسليم: <span className="num-en">{a.due_date ? new Date(a.due_date).toLocaleDateString("ar") : "—"}</span> • <span className="num-en">{a.total_points}</span> درجة</p>
                            </div>
                            {a.is_submitted
                              ? <span className="text-xs font-black text-emerald-600 shrink-0">تم التسليم • <span className="num-en">{a.submission?.score ?? "بانتظار التصحيح"}</span></span>
                              : <button onClick={() => startRunner(a, "assignment")} className="shrink-0 bg-stone-900 text-white text-xs font-black rounded-xl px-4 py-2 hover:bg-black cursor-pointer">حل الواجب</button>}
                          </div>
                        ))}
                        {assignments.length === 0 && <p className="text-sm text-stone-500">لا توجد واجبات.</p>}
                      </div>
                    </section>
                    <section>
                      <h3 className="font-black mb-2 text-sm text-stone-500">الاختبارات ({exams.length})</h3>
                      <div className="space-y-2">
                        {exams.map((e) => (
                          <div key={e.id} className="bg-white rounded-2xl border border-stone-100 p-4 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-black text-sm">{e.title}</p>
                              <p className="text-xs text-stone-500">{e.subject} • <span className="num-en">{e.duration_minutes || 60}</span> دقيقة • <span className="num-en">{e.total_points}</span> درجة</p>
                            </div>
                            {e.is_submitted
                              ? <span className="text-xs font-black text-emerald-600 shrink-0">تم التسليم • <span className="num-en">{e.submission?.score ?? "بانتظار التصحيح"}</span></span>
                              : <button onClick={() => startRunner(e, "exam")} className="shrink-0 bg-teal-600 text-white text-xs font-black rounded-xl px-4 py-2 hover:bg-teal-700 cursor-pointer">ابدأ الآن</button>}
                          </div>
                        ))}
                        {exams.length === 0 && <p className="text-sm text-stone-500">لا توجد اختبارات.</p>}
                      </div>
                    </section>
                  </>
                )}
            </div>
          )}

          {/* ===== NOTIFICATIONS ===== */}
          {activeTab === "notifications" && (
            <div className="max-w-3xl mx-auto space-y-3">
              <h1 className="text-2xl font-black">الإشعارات والتعميمات</h1>
              {loadingAnn ? (<><Skeleton className="h-20" /><Skeleton className="h-20" /></>)
                : errAnn ? <ErrorBox message="تعذر تحميل الإشعارات" onRetry={() => refetchAnn()} />
                : myAnnouncements.length === 0 ? <p className="text-sm text-stone-500 bg-white rounded-2xl p-6">لا توجد إشعارات موجهة إليك حالياً.</p>
                : myAnnouncements.map((a) => (
                  <div key={a.id} className="bg-white rounded-2xl border border-stone-100 p-4">
                    <p className="font-black text-sm">{a.title}</p>
                    <p className="text-xs text-stone-600 mt-1 whitespace-pre-line">{a.content}</p>
                    <p className="text-[10px] text-stone-400 mt-2 num-en">{a.created_at ? new Date(a.created_at).toLocaleDateString("ar") : ""}</p>
                  </div>
                ))}
            </div>
          )}

          {/* ===== MATERIALS ===== */}
          {activeTab === "materials" && (
            <div className="max-w-4xl mx-auto space-y-3">
              <h1 className="text-2xl font-black">المواد الدراسية — الصف {grade || "—"}</h1>
              {loadingSubj ? (<><Skeleton className="h-14" /><Skeleton className="h-14" /></>)
                : errSubj ? <ErrorBox message="تعذر تحميل المواد" onRetry={() => refetchSubj()} />
                : subjectsList.length === 0 ? <p className="text-sm text-stone-500 bg-white rounded-2xl p-6">لا توجد مواد مسجلة لصفك بعد.</p>
                : subjectsList.map((s) => (
                  <div key={s.id} className="bg-white rounded-2xl border border-stone-100 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center"><GraduationCap size={20} /></div>
                      <div><p className="font-black text-sm">{s.name}</p><p className="text-xs text-stone-500">{s.teacher_name || "لم يُحدد المعلم"}</p></div>
                    </div>
                    <button onClick={() => navigate(`/student-portal?view=materials&subjectId=${encodeURIComponent(s.id)}`)} className="text-xs font-black underline cursor-pointer">فتح المادة</button>
                  </div>
                ))}
            </div>
          )}

          {/* ===== CLASSROOM ===== */}
          {activeTab === "classroom" && (
            <div className="max-w-4xl mx-auto space-y-3">
              <h1 className="text-2xl font-black">الفصل الافتراضي</h1>
              {loadingSess ? (<><Skeleton className="h-14" /><Skeleton className="h-14" /></>)
                : errSess ? <ErrorBox message="تعذر تحميل الجلسات" onRetry={() => refetchSess()} />
                : sessionsList.length === 0 ? <p className="text-sm text-stone-500 bg-white rounded-2xl p-6">لا توجد فصول افتراضية مجدولة حالياً.</p>
                : sessionsList.map((s) => (
                  <div key={s.id} className="bg-white rounded-2xl border border-stone-100 p-4 flex items-center justify-between">
                    <div><p className="font-black text-sm">{s.title}</p><p className="text-xs text-stone-500">{s.teacher_name || ""} • {s.status}</p></div>
                    <button onClick={() => navigate(`/virtual-classroom/${s.room_name || s.id}`)} className="bg-stone-900 text-white text-xs font-black rounded-xl px-4 py-2 hover:bg-black cursor-pointer">انضمام</button>
                  </div>
                ))}
            </div>
          )}

          {/* ===== VIDEOS ===== */}
          {activeTab === "videos" && (
            <div className="max-w-4xl mx-auto space-y-3">
              <h1 className="text-2xl font-black">الفيديوهات المسجلة</h1>
              {videosQuery.isLoading ? (<><Skeleton className="h-14" /><Skeleton className="h-14" /></>)
                : videosQuery.error ? <ErrorBox message={videosQuery.error.message} onRetry={() => videosQuery.refetch()} />
                : (videosQuery.data?.videos || []).length === 0 ? <p className="text-sm text-stone-500 bg-white rounded-2xl p-6">لا توجد فيديوهات متاحة لك حالياً.</p>
                : (videosQuery.data.videos || []).map((v) => (
                  <div key={v.id} className="bg-white rounded-2xl border border-stone-100 p-4 flex items-center justify-between">
                    <div><p className="font-black text-sm">{v.title}</p><p className="text-xs text-stone-500">{v.teacher_name || ""}</p></div>
                    <a href={v.youtube_url} target="_blank" rel="noreferrer" className="text-xs font-black underline">مشاهدة</a>
                  </div>
                ))}
            </div>
          )}

          {/* ===== GRADES ===== */}
          {activeTab === "grades" && (
            <div className="max-w-4xl mx-auto space-y-3">
              <h1 className="text-2xl font-black">الدرجات</h1>
              {loadingGrades ? (<><Skeleton className="h-14" /><Skeleton className="h-14" /></>)
                : errGrades ? <ErrorBox message="تعذر تحميل الدرجات" onRetry={() => refetchGrades()} />
                : gradesList.length === 0 ? <p className="text-sm text-stone-500 bg-white rounded-2xl p-6">لا توجد درجات مرصودة بعد.</p>
                : gradesList.map((g) => (
                  <div key={g.id} className="bg-white rounded-2xl border border-stone-100 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-black text-sm">{g.subject_name} <span className="text-[11px] text-stone-400">({g.term})</span></p>
                      <span className="font-black text-sm num-en">{g.score} / {g.max_score || 100}</span>
                    </div>
                    <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-500 rounded-full" style={{ width: `${Math.min(100, Math.round((g.score / (g.max_score || 100)) * 100))}%` }} />
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* ===== ATTENDANCE ===== */}
          {activeTab === "attendance" && (
            <div className="max-w-4xl mx-auto space-y-3">
              <h1 className="text-2xl font-black">سجل الحضور</h1>
              {loadingAtt ? (<><Skeleton className="h-14" /><Skeleton className="h-14" /></>)
                : errAtt ? <ErrorBox message="تعذر تحميل سجل الحضور" onRetry={() => refetchAtt()} />
                : attendanceList.length === 0 ? <p className="text-sm text-stone-500 bg-white rounded-2xl p-6">لا توجد سجلات حضور بعد.</p>
                : attendanceList.slice(0, 30).map((l) => (
                  <div key={l.id} className="bg-white rounded-2xl border border-stone-100 px-4 py-3 flex items-center justify-between text-sm">
                    <span className="font-bold num-en">{l.date} • {l.time || ""}</span>
                    <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${String(l.type).toUpperCase() === "OUT" ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}>{l.type} • {l.status}</span>
                  </div>
                ))}
            </div>
          )}

          {/* ===== BADGES ===== */}
          {activeTab === "badges" && (
            <div className="max-w-4xl mx-auto space-y-3">
              <h1 className="text-2xl font-black">الأوسمة</h1>
              {profile.loading ? <Skeleton className="h-24" /> : profile.error ? <ErrorBox message={profile.error} onRetry={() => profile.refetch()} />
                : awards.length === 0 ? <p className="text-sm text-stone-500 bg-white rounded-2xl p-6">لا توجد أوسمة بعد.</p>
                : <div className="grid sm:grid-cols-2 gap-3">{awards.map((a) => (
                  <div key={a.id} className="bg-white rounded-2xl border border-stone-100 p-4 flex items-center gap-3">
                    <span className="text-3xl">{a.badge || "🏅"}</span>
                    <div><p className="font-black text-sm">{a.title}</p><p className="text-xs text-amber-700 num-en">+{a.points} XP • {a.date ? new Date(a.date).toLocaleDateString("ar") : ""}</p></div>
                  </div>
                ))}</div>}
            </div>
          )}

          {/* ===== LEVELS ===== */}
          {activeTab === "levels" && (
            <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-stone-100 p-8 text-center">
              <Rocket className="mx-auto text-teal-600 mb-2" size={36} />
              <h1 className="text-2xl font-black">النقاط والمستويات</h1>
              {profile.loading ? <Skeleton className="h-10 w-40 mx-auto mt-4" /> : profile.error ? <div className="mt-4"><ErrorBox message={profile.error} onRetry={() => profile.refetch()} /></div> : (
                <div className="mt-4">
                  <p className="text-5xl font-black num-en">{xp} <span className="text-base text-stone-400">XP</span></p>
                  <p className="font-black mt-1">المستوى <span className="num-en">{level}</span></p>
                  <div className="mt-4 h-3 bg-stone-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-l from-teal-500 to-emerald-500" style={{ width: `${xpProgress}%` }} />
                  </div>
                  <p className="text-xs text-stone-500 mt-2">اكسب 500 نقطة خبرة للانتقال للمستوى التالي (الحضور +50 / يوم، الأوسمة، درجات الواجبات).</p>
                </div>
              )}
            </div>
          )}

          {/* ===== SUPPORT ===== */}
          {activeTab === "support" && <SupportTab student={student} />}
        </main>
      </div>

      {/* Week modal */}
      <Modal open={weekOpen} onClose={() => setWeekOpen(false)} title="الجدول الأسبوعي الكامل" wide>
        {weekCache.loading ? (<div className="space-y-2"><Skeleton className="h-12" /><Skeleton className="h-12" /><Skeleton className="h-12" /></div>)
          : weekCache.error ? <ErrorBox message={weekCache.error} onRetry={() => fetchWeek().catch(() => {})} />
          : weekCache.data ? (
            <div className="grid md:grid-cols-2 gap-4">
              {Object.entries(weekCache.data.week || {}).map(([day, classes]) => (
                <div key={day} className="border border-stone-100 rounded-2xl p-4">
                  <p className="font-black text-sm mb-2">{DAYS_AR[day] || day} <span className="text-[11px] text-stone-400 num-en">({classes.length})</span></p>
                  <div className="space-y-1.5">
                    {classes.map((c) => (
                      <div key={c.id} className="bg-stone-50 rounded-xl px-3 py-2 text-xs flex justify-between gap-2">
                        <span className="font-bold">{c.subject_name}</span>
                        <span className="num-en text-stone-500 shrink-0">{c.start_time}-{c.end_time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {Object.keys(weekCache.data.week || {}).length === 0 && <p className="text-sm text-stone-500">لا يوجد جدول أسبوعي مسجل لصفك.</p>}
            </div>
          ) : <p className="text-sm text-stone-500">جارٍ التحميل...</p>}
      </Modal>

      {/* Exam runner modal */}
      <Modal open={!!runner} onClose={() => setRunner(null)} title={runner ? (runner.kind === "exam" ? "أداء الاختبار" : "حل الواجب") : ""} wide>
        {runner && (
          <ExamRunner
            item={runner.item}
            kind={runner.kind}
            studentName={student.full_name || ""}
            studentId={studentUuid}
            onClose={() => setRunner(null)}
            onDone={() => {
              setRunner(null);
              homework.refetch().catch(() => {});
              profile.refetch().catch(() => {});
            }}
          />
        )}
      </Modal>
    </div>
  );
}

/* ---------- support tab: JWT-secured tickets ---------- */
function SupportTab({ student }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [mine, setMine] = useState([]);
  const [loadingMine, setLoadingMine] = useState(true);
  const [errMine, setErrMine] = useState(null);

  const loadMine = async () => {
    setLoadingMine(true);
    setErrMine(null);
    try {
      const qs = new URLSearchParams();
      if (student.id) qs.set("user_id", student.id);
      const data = await studentApiFetch(`/api/support-tickets/mine?${qs.toString()}`);
      setMine(Array.isArray(data.tickets) ? data.tickets : []);
    } catch (e) {
      setErrMine(e.message);
    } finally {
      setLoadingMine(false);
    }
  };

  React.useEffect(() => { loadMine();
  }, [student.id]);

  const submit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) { toast.error("يرجى تعبئة الموضوع والتفاصيل"); return; }
    setSending(true);
    try {
      await studentApiFetch("/api/support-tickets", {
        method: "POST",
        body: JSON.stringify({
          subject: subject.trim(), category: "technical", message: message.trim(),
          user_id: student.id, user_name: student.full_name, user_email: student.email,
          user_type: "student", school_id: student.school_id,
        }),
      });
      toast.success("تم إرسال تذكرتك بنجاح");
      setSubject(""); setMessage("");
      loadMine();
    } catch (e) {
      toast.error(e.message || "تعذر إرسال التذكرة");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-black">الدعم الفني</h1>
      <form onSubmit={submit} className="bg-white rounded-3xl border border-stone-100 p-6 space-y-3">
        <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="عنوان المشكلة" maxLength={200} className="w-full border border-stone-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-teal-500" />
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="اشرح المشكلة بالتفصيل..." rows={4} maxLength={5000} className="w-full border border-stone-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-teal-500" />
        <button disabled={sending} className="bg-rose-600 text-white rounded-2xl px-6 py-3 text-sm font-black hover:bg-rose-700 disabled:opacity-50 cursor-pointer">
          {sending ? "جارٍ الإرسال..." : "إرسال التذكرة"}
        </button>
      </form>
      <h3 className="font-black text-sm text-stone-500">تذاكري السابقة</h3>
      {loadingMine ? (<><Skeleton className="h-16" /><Skeleton className="h-16" /></>)
        : errMine ? <ErrorBox message={errMine} onRetry={loadMine} />
        : mine.length === 0 ? <p className="text-sm text-stone-500 bg-white rounded-2xl p-6">لا توجد تذاكر سابقة.</p>
        : mine.map((t) => (
          <div key={t.id} className="bg-white rounded-2xl border border-stone-100 p-4">
            <p className="font-black text-sm">{t.subject} <span className="text-[10px] font-bold text-stone-400">({t.status})</span></p>
            <p className="text-xs text-stone-600 mt-1">{t.message}</p>
            {t.founder_reply && <p className="text-xs mt-2 bg-stone-50 rounded-xl p-2.5"><span className="font-black">رد الدعم: </span>{t.founder_reply}</p>}
          </div>
        ))}
    </div>
  );
}
