import React, { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/dbClient";
import { toast } from "sonner";
import {
  LayoutDashboard, Building2, FileText, CreditCard, LifeBuoy, Settings,
  LogOut, CheckCircle2, XCircle, Bell, School as SchoolIcon, TrendingUp,
  Users, CircleDollarSign, RefreshCw, Eye, Plus, Clock, AlertTriangle,
  BarChart3, MessageCircle, Save, Download, KeyRound, PauseCircle, Timer,
  MapPin, Calendar, Phone, Mail, Crown, Zap, Shield, Copy, Printer, Send, UserPlus, Lock, Link2, ExternalLink
} from "lucide-react";

const PLANS_DEFAULT = [
  { id: "starter", name: "Starter", price: 49, color: "from-slate-500 to-slate-600", desc: "مدرسة صغيرة حتى 200 طالب" },
  { id: "professional", name: "Professional", price: 99, color: "from-blue-500 to-blue-600", desc: "المدرسة المتوسطة مع كل الميزات", popular: true },
  { id: "enterprise", name: "Enterprise", price: 199, color: "from-violet-500 to-violet-600", desc: "شبكة مدارس وميزات غير محدودة" },
];

const SUPPORT_SEED = [
  { id: "t1", school: "مدرسة النور الأهلية", subject: "تعطل نظام الحضور", details: "لا يمكن تسجيل الحضور منذ الصباح، تظهر رسالة خطأ عند الحفظ.", priority: "high", status: "open", date: "2026-08-28", reply: "" },
  { id: "t2", school: "أكاديمية المستقبل", subject: "طلب ترقية الباقة", details: "نرغب في الترقية من Starter إلى Professional، كيف يتم الدفع؟", priority: "medium", status: "open", date: "2026-08-29", reply: "" },
  { id: "t3", school: "مدارس الرواد", subject: "استفسار عن الفواتير", details: "وصلتنا فاتورة مضاعفة هذا الشهر، نرجو المراجعة.", priority: "low", status: "open", date: "2026-08-30", reply: "" },
];

const SETTINGS_DEFAULT = {
  maintenance_mode: false,
  allow_registrations: true,
  default_currency: "USD",
  support_email: "support@edutrack.com",
  support_phone: "+249969814088",
  whatsapp_number: "249969814088",
  plan_starter_price: 49,
  plan_professional_price: 99,
  plan_enterprise_price: 199,
};

const NAV = [
  { id: "overview", label: "الرئيسية", icon: LayoutDashboard },
  { id: "schools", label: "إدارة المدارس", icon: Building2 },
  { id: "requests", label: "طلبات التسجيل", icon: FileText },
  { id: "teacher-student-regs", label: "طلبات المعلمين والطلاب", icon: Users },
  { id: "subscriptions", label: "الاشتراكات والإيرادات", icon: CreditCard },
  { id: "support", label: "الدعم الفني", icon: LifeBuoy },
  { id: "settings", label: "إعدادات المنصة", icon: Settings },
];

const FounderDashboard = () => {
  const [section, setSection] = useState("overview");
  const queryClient = useQueryClient();

  // ── Teacher Approval Modal ──
  const [teacherApproval, setTeacherApproval] = useState(null); // { requestId, fullName, email }
  const [teacherUsername, setTeacherUsername] = useState("");
  const [teacherPassword, setTeacherPassword] = useState("");
  const [approvingTeacher, setApprovingTeacher] = useState(false);

  // ── Student Approval Modal ──
  const [studentApproval, setStudentApproval] = useState(null); // { requestId, fullName, email }
  const [studentUsername, setStudentUsername] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [approvingStudent, setApprovingStudent] = useState(false);

  const handleApproveTeacher = async () => {
    if (!teacherUsername.trim() || !teacherPassword.trim()) {
      toast.error("أدخل اسم المستخدم وكلمة المرور");
      return;
    }
    setApprovingTeacher(true);
    try {
      const apiBase = import.meta.env.VITE_BACKEND_URL || '';
      const res = await fetch(`${apiBase}/api/approve-teacher`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: teacherApproval.requestId,
          username: teacherUsername.trim(),
          password: teacherPassword.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success(`تم إنشاء حساب المعلم بنجاح — اسم المستخدم: ${teacherUsername.trim()}`);
      setTeacherApproval(null);
      setTeacherUsername("");
      setTeacherPassword("");
      queryClient.invalidateQueries({ queryKey: ["founder-teacher-student-regs"] });
    } catch (err) {
      toast.error(err.message || "فشل إنشاء الحساب");
    } finally {
      setApprovingTeacher(false);
    }
  };

  const handleApproveStudent = async () => {
    if (!studentUsername.trim() || !studentPassword.trim()) {
      toast.error("أدخل اسم المستخدم وكلمة المرور");
      return;
    }
    setApprovingStudent(true);
    try {
      const apiBase = import.meta.env.VITE_BACKEND_URL || '';
      const res = await fetch(`${apiBase}/api/approve-student`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: studentApproval.requestId,
          username: studentUsername.trim(),
          password: studentPassword.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success(`تم إنشاء حساب الطالب بنجاح — اسم المستخدم: ${studentUsername.trim()}`);
      setStudentApproval(null);
      setStudentUsername("");
      setStudentPassword("");
      queryClient.invalidateQueries({ queryKey: ["founder-teacher-student-regs"] });
    } catch (err) {
      toast.error(err.message || "فشل إنشاء الحساب");
    } finally {
      setApprovingStudent(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("founder_auth");
    localStorage.removeItem("founder_email");
    localStorage.removeItem("founder_login_time");
    toast("تم تسجيل الخروج");
    window.location.href = "/founder-login";
  };

  // ── Schools ──
  const { data: schools = [], isLoading: schoolsLoading } = useQuery({
    queryKey: ["founder-schools"],
    queryFn: async () => {
      try { return await entities.School.list("-created_at", 1000); }
      catch { return []; }
    },
  });

  // ── Registration requests ──
  const { data: requests = [], isLoading: reqLoading } = useQuery({
    queryKey: ["founder-registrations"],
    queryFn: async () => {
      try { return await entities.RegistrationRequest.list("-created_at", 200); }
      catch { return []; }
    },
  });

  // ── Teacher/Student registration requests ──
  const { data: teacherStudentRequests = [], isLoading: tsReqLoading } = useQuery({
    queryKey: ["founder-teacher-student-regs"],
    queryFn: async () => {
      try {
        const allReqs = await entities.RegistrationRequest.list("-created_at", 500);
        return allReqs.filter(r => r.role_requested === "teacher" || r.role_requested === "student" || r.plan === "student_free" || r.plan === "teacher_free");
      } catch { return []; }
    },
  });

  // ── Support tickets (localStorage) ──
  const [tickets, setTickets] = useState(() => {
    try { return JSON.parse(localStorage.getItem("founder_support_tickets")) || SUPPORT_SEED; }
    catch { return SUPPORT_SEED; }
  });
  useEffect(() => { localStorage.setItem("founder_support_tickets", JSON.stringify(tickets)); }, [tickets]);
  const [replyMap, setReplyMap] = useState({});
  const [activeTicket, setActiveTicket] = useState(null);

  // ── Platform settings (localStorage) ──
  const [settings, setSettings] = useState(() => {
    try { return { ...SETTINGS_DEFAULT, ...(JSON.parse(localStorage.getItem("founder_platform_settings")) || {}) }; }
    catch { return SETTINGS_DEFAULT; }
  });
  useEffect(() => { localStorage.setItem("founder_platform_settings", JSON.stringify(settings)); }, [settings]);

  // ── Plans derived from settings ──
  const PLANS = [
    { id: "starter", name: "Starter", price: Number(settings.plan_starter_price) || 49, color: "from-slate-500 to-slate-600", desc: "مدرسة صغيرة حتى 200 طالب" },
    { id: "professional", name: "Professional", price: Number(settings.plan_professional_price) || 99, color: "from-blue-500 to-blue-600", desc: "المدرسة المتوسطة مع كل الميزات", popular: true },
    { id: "enterprise", name: "Enterprise", price: Number(settings.plan_enterprise_price) || 199, color: "from-violet-500 to-violet-600", desc: "شبكة مدارس وميزات غير محدودة" },
  ];

  // ── Derived stats ──
  const activeSchools = schools.filter((s) => s.subscription_status === "active").length;
  const pendingSchools = schools.filter((s) => s.subscription_status === "trial" || s.subscription_status === "pending").length;
  const expiredSchools = schools.filter((s) => s.subscription_status === "expired" || s.subscription_status === "inactive").length;
  const pendingRequests = requests.filter((r) => r.status === "pending" || !r.status).length;
  const pendingTeacherStudentReqs = teacherStudentRequests.filter((r) => r.status === "pending" || !r.status).length;

  // دالة لحساب السعر الشهري المكافئ للمدرسة (مع خصم 20% للسنوي)
  const getMonthlyEquivalent = (school) => {
    const plan = PLANS.find((p) => p.id === (school.plan || "professional"));
    const basePrice = plan ? plan.price : 99;
    if (school.billing_cycle === "yearly") {
      // السنوي = السعر الشهري × 12 × 0.8 (خصم 20%) -> المكافئ الشهري = basePrice × 0.8
      return Math.round(basePrice * 0.8);
    }
    return basePrice;
  };

  const monthlyRevenue = schools.length
    ? schools.reduce((sum, s) => {
        if (s.subscription_status !== "active") return sum;
        return sum + getMonthlyEquivalent(s);
      }, 0)
    : 0;
  const annualRevenue = monthlyRevenue * 12;
  const starterCount = schools.filter(s => (s.plan || "professional") === "starter").length;
  const proCount = schools.filter(s => (s.plan || "professional") === "professional").length;
  const enterpriseCount = schools.filter(s => s.plan === "enterprise").length;

  // تفاصيل الإيرادات حسب الدورة
  const revenueBreakdown = {
    monthly: schools.filter(s => s.subscription_status === "active" && s.billing_cycle === "monthly")
      .reduce((sum, s) => sum + getMonthlyEquivalent(s), 0),
    yearly: schools.filter(s => s.subscription_status === "active" && s.billing_cycle === "yearly")
      .reduce((sum, s) => sum + getMonthlyEquivalent(s), 0),
  };
  const yearlySchoolsCount = schools.filter(s => s.subscription_status === "active" && s.billing_cycle === "yearly").length;
  const monthlySchoolsCount = schools.filter(s => s.subscription_status === "active" && s.billing_cycle === "monthly").length;

  // expiring within 7 days
  const expiringSoon = schools.filter(s => {
    if (!s.expires_at) return s.subscription_status === "trial";
    const diff = new Date(s.expires_at) - new Date();
    return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
  });

  const last5Requests = [...requests].slice(0, 5);
  const last5Schools = [...schools].slice(0, 5);

  // ── Mutations ──
  const updateSchool = useMutation({
    mutationFn: ({ id, status }) => entities.School.update(id, { subscription_status: status }),
    onSuccess: () => {
      toast.success("تم تحديث حالة الاشتراك");
      queryClient.invalidateQueries({ queryKey: ["founder-schools"] });
    },
    onError: () => toast.error("تعذر تحديث الحالة"),
  });

  const createSchool = useMutation({
    mutationFn: (data) => entities.School.create(data),
    onSuccess: () => {
      toast.success("تمت إضافة المدرسة بنجاح");
      queryClient.invalidateQueries({ queryKey: ["founder-schools"] });
    },
    onError: (e) => toast.error(e.message || "فشل إضافة المدرسة"),
  });

  const updateRequest = useMutation({
    mutationFn: ({ id, status }) => entities.RegistrationRequest.update(id, { status }),
    onSuccess: () => {
      toast.success("تم تحديث الطلب");
      queryClient.invalidateQueries({ queryKey: ["founder-registrations"] });
    },
    onError: () => toast.error("تعذر تحديث الطلب"),
  });

  // ── حالة بطاقة التسليم (بعد القبول)
  const [delivery, setDelivery] = useState(null); // { school, adminEmail, password, loginUrl }

  const genPassword = (len = 10) => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$";
    let out = "";
    for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  };

  // ── خطة → مدة الاشتراك (أيام)
  const planDuration = (planId, cycle = 'monthly') => {
    if (cycle === 'yearly') return 365;
    return planId === 'starter' ? 30 : planId === 'professional' ? 30 : 30; // افتراضياً شهرياً
  };

  // ── قبول الطلب مع إنشاء مدرسة + حساب مدير + بطاقة تسليم
  const acceptRequest = async (r) => {
    try {
      const schoolName = r.school_name || r.full_name || "مدرسة جديدة";
      const plan = r.plan || r.role_requested || "starter";
      const billingCycle = r.billing_cycle || "monthly";
      const planMap = { admin: "starter", teacher: "starter", student: "starter" };
      const finalPlan = ["starter","professional","enterprise"].includes(plan) ? plan : (planMap[plan] || "starter");
      const schoolEmail = (r.email || "").trim().toLowerCase();
      const directorName = r.director_name || r.full_name || "مدير المدرسة";
      const rawPassword = genPassword(10);

      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + planDuration(finalPlan, billingCycle));

      // 1) إنشاء المدرسة
      const newSchool = await entities.School.create({
        name: schoolName,
        name_ar: schoolName,
        name_en: schoolName,
        director_name: directorName,
        email: schoolEmail || null,
        phone: r.phone || null,
        country: r.country || "السودان",
        plan: finalPlan,
        billing_cycle: billingCycle,
        subscription_status: "active",
        subscription_start_date: startDate.toISOString(),
        expires_at: endDate.toISOString(),
      });

      // 2) إنشاء حساب مدير المدرسة وربطه بالمستأجر
      if (schoolEmail) {
        try {
          await entities.SystemAdmin.create({
            full_name: directorName,
            email: schoolEmail,
            portal_password: rawPassword,
            role: "admin",
            school_id: newSchool.id || newSchool._id,
            status: "active",
          });
        } catch (e2) {
          // لو فشل إنشاء الأدمن (مثلاً البريد مكرر) — لا نُفشل القبول كله
          console.warn("create admin failed:", e2.message);
          toast("تم إنشاء المدرسة لكن تعذر إنشاء حساب المدير تلقائياً — أنشئه يدوياً من تبويب المدارس", { icon: "⚠️" });
        }
      }

      await entities.RegistrationRequest.update(r.id, { status: "approved" });
      toast.success(`تم قبول الطلب وإنشاء حساب المدرسة: ${schoolName}`);
      queryClient.invalidateQueries({ queryKey: ["founder-schools"] });
      queryClient.invalidateQueries({ queryKey: ["founder-registrations"] });

      // 3) إظهار بطاقة التسليم
      if (schoolEmail) {
        const origin = window.location.origin;
        setDelivery({
          school: { id: newSchool.id || newSchool._id, name: schoolName, plan: finalPlan, billing_cycle: billingCycle, email: schoolEmail, director: directorName, phone: r.phone || "", subscription_start_date: startDate.toISOString(), expires_at: endDate.toISOString() },
          adminEmail: schoolEmail,
          password: rawPassword,
          loginUrl: `${origin}/role-login`,
        });
      }
    } catch (e) {
      toast.error(e.message || "فشل القبول");
    }
  };

  // إنشاء/إعادة تعيين حساب مدير لمدرسة موجودة
  const renewSubscription = async (school) => {
    const cycle = school.billing_cycle || 'monthly';
    const days = cycle === 'yearly' ? 365 : 30;
    const startDate = school.expires_at && new Date(school.expires_at) > new Date()
      ? new Date(school.expires_at)
      : new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days);
    try {
      await entities.School.update(school.id, {
        subscription_status: "active",
        subscription_start_date: startDate.toISOString(),
        expires_at: endDate.toISOString(),
      });
      toast.success(`تم تجديد الاشتراك لـ ${school.name} حتى ${endDate.toLocaleDateString('ar-EG')}`);
      queryClient.invalidateQueries({ queryKey: ["founder-schools"] });
    } catch (e) {
      toast.error(e.message || "فشل التجديد");
    }
  };

  // إنشاء/إعادة تعيين حساب مدير لمدرسة موجودة
  const createAdminForSchool = async (school) => {
    const email = (school.email || "").trim().toLowerCase();
    if (!email) return toast.error("هذه المدرسة بلا بريد — أضف البريد أولاً من التفاصيل");
    const rawPassword = genPassword(10);
    try {
      // هل يوجد حساب بهذا البريد؟ إن وجد نحدّث كلمة المرور
      let existing = [];
      try { existing = await entities.SystemAdmin.filter({ email }); } catch (e) { console.warn('filter failed', e); }
      if (existing && existing.length > 0) {
        const admin = existing[0];
        await entities.SystemAdmin.update(admin.id, { portal_password: rawPassword, school_id: school.id, status: "active" });
        toast.success("تمت إعادة تعيين كلمة مرور المدير");
      } else {
        await entities.SystemAdmin.create({
          full_name: school.director_name || school.name,
          email,
          portal_password: rawPassword,
          role: "admin",
          school_id: school.id,
          status: "active",
        });
        toast.success("تم إنشاء حساب المدير");
      }
      const origin = window.location.origin;
      setDelivery({
        school: { id: school.id, name: school.name, plan: school.plan, billing_cycle: school.billing_cycle || 'monthly', email, director: school.director_name || school.name, phone: school.phone || "", subscription_start_date: school.subscription_start_date, expires_at: school.expires_at },
        adminEmail: email,
        password: rawPassword,
        loginUrl: `${origin}/role-login`,
      });
    } catch (e) {
      toast.error(e.message || "فشل إنشاء/تحديث حساب المدير");
    }
  };

  // ── Add school dialog state ──
  const [showAdd, setShowAdd] = useState(false);
  const [newSchool, setNewSchool] = useState({ name: "", country: "السودان", plan: "starter", billing_cycle: "monthly", email: "", phone: "", director_name: "" });
  const [viewSchool, setViewSchool] = useState(null);

  // ── Password change ──
  const [pw, setPw] = useState({ cur: "", next: "", confirm: "" });

  const StatCard = ({ icon: Ic, label, value, sub, tint }) => (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${tint}`}>
        <Ic className="text-white" size={20} />
      </div>
      <p className="mt-4 text-3xl font-extrabold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex" dir="rtl">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-slate-900 text-slate-200 flex flex-col min-h-screen sticky top-0">
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
            <SchoolIcon className="text-white" size={22} />
          </div>
          <div>
            <p className="font-extrabold text-white leading-tight">EduTrack</p>
            <p className="text-[11px] text-slate-400">لوحة تحكم المالك</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((n) => {
            const Ic = n.icon;
            const active = section === n.id;
            return (
              <button
                key={n.id}
                onClick={() => setSection(n.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                  active ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40" : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <Ic size={18} />
                {n.label}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-800">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-rose-300 hover:bg-rose-500/10 transition"
          >
            <LogOut size={18} />
            تسجيل الخروج
          </button>
          <p className="text-[10px] text-slate-500 text-center mt-3">v1.0 — Founder Control Panel</p>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 p-6 md:p-8 overflow-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-extrabold text-slate-900">
            {NAV.find((n) => n.id === section)?.label}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            مرحباً بك {localStorage.getItem("founder_email") || "بالمالك"} في لوحة تحكم المنصة
          </p>
        </header>

        {/* ───── 1️⃣ الرئيسية ───── */}
        {section === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={Building2} label="إجمالي المدارس المشتركة" value={schools.length} tint="bg-blue-500" sub={`${activeSchools} نشطة • ${pendingSchools} معلقة • ${expiredSchools} منتهية`} />
              <StatCard icon={Users} label="المدارس حسب الحالة" value={`${activeSchools} / ${pendingSchools} / ${expiredSchools}`} tint="bg-emerald-500" sub="نشطة / معلقة / منتهية" />
              <StatCard icon={FileText} label="طلبات جديدة غير معالجة" value={pendingRequests} tint="bg-violet-500" sub={`من أصل ${requests.length} طلب`} />
              <StatCard icon={Users} label="طلبات معلمين/طلاب" value={pendingTeacherStudentReqs} tint="bg-emerald-500" sub={`من أصل ${teacherStudentRequests.length} طلب`} />
              <StatCard icon={CircleDollarSign} label="الإيراد الشهري المتوقع" value={`$${monthlyRevenue}`} tint="bg-amber-500" sub={`السنوي $${annualRevenue}`} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* آخر 5 طلبات */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center gap-2 font-bold text-slate-900"><FileText size={16} className="text-violet-500"/> آخر 5 طلبات تسجيل</div>
                {last5Requests.length === 0 ? <p className="p-6 text-sm text-slate-400 text-center">لا توجد طلبات</p> : (
                  <div className="divide-y divide-slate-100">
                    {last5Requests.map(r => (
                      <div key={r.id} className="p-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{r.school_name || r.full_name}</p>
                          <p className="text-xs text-slate-500">{r.email} • {r.phone || "-"}</p>
                        </div>
                        <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${r.status==='pending'?'bg-amber-100 text-amber-700': r.status==='approved'?'bg-emerald-100 text-emerald-700':'bg-rose-100 text-rose-700'}`}>{r.status==='pending'?'قيد الانتظار': r.status==='approved'?'مقبول':'مرفوض'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* آخر 5 مدارس */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center gap-2 font-bold text-slate-900"><Building2 size={16} className="text-blue-500"/> آخر 5 مدارس انضمت</div>
                {last5Schools.length === 0 ? <p className="p-6 text-sm text-slate-400 text-center">لا توجد مدارس بعد</p> : (
                  <div className="divide-y divide-slate-100">
                    {last5Schools.map(s => (
                      <div key={s.id} className="p-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{s.name}</p>
                          <p className="text-xs text-slate-500">{s.country || "السودان"} • {s.plan}</p>
                        </div>
                        <span className="text-xs text-slate-400">{new Date(s.created_at).toLocaleDateString('ar-EG')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* على وشك الانتهاء */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center gap-2 font-bold text-slate-900"><Timer size={16} className="text-amber-500"/> اشتراك على وشك الانتهاء (7 أيام)</div>
                {expiringSoon.length === 0 ? <p className="p-6 text-sm text-slate-400 text-center">لا توجد مدارس قريبة الانتهاء</p> : (
                  <div className="divide-y divide-slate-100">
                    {expiringSoon.map(s => (
                      <div key={s.id} className="p-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{s.name}</p>
                          <p className="text-xs text-amber-600">ينتهي: {s.expires_at ? new Date(s.expires_at).toLocaleDateString('ar-EG') : "قريباً (تجريبي)"}</p>
                        </div>
                        <AlertTriangle size={16} className="text-amber-500"/>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-600"><Bell size={16} className="text-amber-500"/> تذاكر دعم مفتوحة: <b className="text-slate-900">{tickets.filter(t=>t.status==="open").length}</b> • طلبات معلقة: <b className="text-slate-900">{pendingRequests}</b></div>
              <button onClick={()=>setSection("requests")} className="text-xs font-bold text-blue-600 hover:underline">عرض الطلبات →</button>
            </div>
          </div>
        )}

        {/* ───── 2️⃣ إدارة المدارس ───── */}
        {section === "schools" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-slate-500">إجمالي {schools.length} مدرسة</p>
              <button onClick={()=>setShowAdd(true)} className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700"><Plus size={16}/> إضافة مدرسة يدوياً</button>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {schoolsLoading ? <p className="p-6 text-slate-500">جاري التحميل...</p> : schools.length === 0 ? <p className="p-6 text-slate-500 text-center">لا توجد مدارس مسجلة بعد. أضف أول مدرسة الآن.</p> : (
                <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="text-right p-4 font-semibold">اسم المدرسة</th>
                      <th className="text-right p-4 font-semibold">البلد</th>
                      <th className="text-right p-4 font-semibold">الخطة</th>
                      <th className="text-right p-4 font-semibold">الدورة</th>
                      <th className="text-right p-4 font-semibold">تاريخ الانضمام</th>
                      <th className="text-right p-4 font-semibold">بدء الاشتراك</th>
                      <th className="text-right p-4 font-semibold">ينتهي في</th>
                      <th className="text-right p-4 font-semibold">حالة الاشتراك</th>
                      <th className="text-right p-4 font-semibold">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schools.map((s) => (
                      <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="p-4">
                          <p className="font-bold text-slate-900">{s.name}</p>
                          <p className="text-xs text-slate-500">{s.email || "-"} {s.phone ? `• ${s.phone}` : ""}</p>
                        </td>
                        <td className="p-4 flex items-center gap-1 text-slate-600"><MapPin size={14} className="text-slate-400"/>{s.country || "السودان"}</td>
                        <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs font-bold ${s.plan==='enterprise'?'bg-violet-100 text-violet-700': s.plan==='professional'?'bg-blue-100 text-blue-700':'bg-slate-100 text-slate-700'}`}>{s.plan || "starter"}</span></td>
                        <td className="p-4 text-slate-500 flex items-center gap-1"><Calendar size={14}/>{s.created_at ? new Date(s.created_at).toLocaleDateString('ar-EG') : "-"}</td>
                        <td className="p-4 text-slate-500 flex items-center gap-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${s.billing_cycle==='yearly'?'bg-amber-100 text-amber-700':'bg-slate-100 text-slate-700'}`}>
                            {s.billing_cycle === 'yearly' ? 'سنوي' : 'شهري'}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500">
                          {s.subscription_start_date ? new Date(s.subscription_start_date).toLocaleDateString('ar-EG') : '—'}
                        </td>
                        <td className="p-4">
                          {s.expires_at ? (
                            <span className={new Date(s.expires_at) < new Date() ? 'text-rose-600 font-bold' : new Date(s.expires_at) - new Date() < 7*24*60*60*1000 ? 'text-amber-600 font-bold' : 'text-emerald-600'}>
                              {new Date(s.expires_at).toLocaleDateString('ar-EG')}
                            </span>
                          ) : <span className="text-slate-400">—</span>}
                        </td>
                        <td className="p-4">
                          <select value={s.subscription_status || "trial"} onChange={(e)=>updateSchool.mutate({id:s.id, status:e.target.value})} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold">
                            <option value="active">نشط</option>
                            <option value="trial">تجريبي</option>
                            <option value="pending">معلق</option>
                            <option value="inactive">موقوف</option>
                            <option value="expired">منتهي</option>
                          </select>
                        </td>
                        <td className="p-4 flex gap-1 flex-wrap">
                          <button onClick={()=>updateSchool.mutate({id:s.id, status:"active"})} className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100">تفعيل</button>
                          <button onClick={()=>updateSchool.mutate({id:s.id, status:"inactive"})} className="px-2 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold hover:bg-amber-100">تعليق</button>
                          <button onClick={()=>renewSubscription(s)} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"><RefreshCw size={12}/> تجديد</button>
                          <button onClick={()=>createAdminForSchool(s)} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-600 text-white text-xs font-bold hover:bg-violet-700"><KeyRound size={12}/> حساب المدير</button>
                          <button onClick={()=>setViewSchool(s)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200"><Eye size={14}/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
            </div>
            {/* View dialog */}
            {viewSchool && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={()=>setViewSchool(null)}>
                <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl" onClick={e=>e.stopPropagation()}>
                  <h3 className="font-extrabold text-lg mb-4 flex items-center gap-2"><Building2 size={18}/> تفاصيل المدرسة</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">الاسم</span><b>{viewSchool.name}</b></div>
                    <div className="flex justify-between"><span className="text-slate-500">البلد</span><b>{viewSchool.country}</b></div>
                    <div className="flex justify-between"><span className="text-slate-500">المدير</span><b>{viewSchool.director_name || "-"}</b></div>
                    <div className="flex justify-between"><span className="text-slate-500">البريد</span><b>{viewSchool.email || "-"}</b></div>
                    <div className="flex justify-between"><span className="text-slate-500">الهاتف</span><b>{viewSchool.phone || "-"}</b></div>
                    <div className="flex justify-between"><span className="text-slate-500">الخطة</span><b>{viewSchool.plan}</b></div>
                    <div className="flex justify-between"><span className="text-slate-500">دورة الفوترة</span><b>{viewSchool.billing_cycle === 'yearly' ? 'سنوي' : 'شهري'}</b></div>
                    <div className="flex justify-between"><span className="text-slate-500">الحالة</span><b>{viewSchool.subscription_status}</b></div>
                    <div className="flex justify-between"><span className="text-slate-500">تاريخ الانضمام</span><b>{viewSchool.created_at ? new Date(viewSchool.created_at).toLocaleString('ar-EG') : "-"}</b></div>
                    <div className="flex justify-between"><span className="text-slate-500">بدء الاشتراك</span><b>{viewSchool.subscription_start_date ? new Date(viewSchool.subscription_start_date).toLocaleDateString('ar-EG') : "—"}</b></div>
                    {viewSchool.expires_at && <div className="flex justify-between"><span className="text-slate-500">ينتهي في</span><b className={new Date(viewSchool.expires_at) < new Date() ? 'text-rose-600' : new Date(viewSchool.expires_at) - new Date() < 7*24*60*60*1000 ? 'text-amber-600' : 'text-emerald-600'}>{new Date(viewSchool.expires_at).toLocaleDateString('ar-EG')}</b></div>}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button onClick={()=>renewSubscription(viewSchool)} className="flex-1 h-10 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700"><RefreshCw size={14}/> تجديد</button>
                    <button onClick={()=>setViewSchool(null)} className="flex-1 h-10 rounded-xl bg-slate-900 text-white font-bold">إغلاق</button>
                  </div>
                </div>
              </div>
            )}
            {/* Add dialog */}
            {showAdd && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={()=>setShowAdd(false)}>
                <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl" onClick={e=>e.stopPropagation()}>
                  <h3 className="font-extrabold text-lg mb-4">إضافة مدرسة يدوياً</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2"><label className="text-xs font-bold text-slate-600">اسم المدرسة *</label><input value={newSchool.name} onChange={e=>setNewSchool({...newSchool, name:e.target.value})} className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2 text-sm" placeholder="مثال: مدارس النور"/></div>
                    <div><label className="text-xs font-bold text-slate-600">البلد</label><input value={newSchool.country} onChange={e=>setNewSchool({...newSchool, country:e.target.value})} className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2 text-sm"/></div>
                    <div><label className="text-xs font-bold text-slate-600">الخطة</label><select value={newSchool.plan} onChange={e=>setNewSchool({...newSchool, plan:e.target.value})} className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2 text-sm"><option value="starter">Starter $49</option><option value="professional">Professional $99</option><option value="enterprise">Enterprise $199</option></select></div>
                    <div><label className="text-xs font-bold text-slate-600">دورة الفوترة</label><select value={newSchool.billing_cycle} onChange={e=>setNewSchool({...newSchool, billing_cycle:e.target.value})} className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2 text-sm"><option value="monthly">شهري</option><option value="yearly">سنوي</option></select></div>
                    <div><label className="text-xs font-bold text-slate-600">البريد</label><input value={newSchool.email} onChange={e=>setNewSchool({...newSchool, email:e.target.value})} className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2 text-sm" dir="ltr"/></div>
                    <div><label className="text-xs font-bold text-slate-600">الهاتف</label><input value={newSchool.phone} onChange={e=>setNewSchool({...newSchool, phone:e.target.value})} className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2 text-sm" dir="ltr"/></div>
                    <div className="col-span-2"><label className="text-xs font-bold text-slate-600">اسم المسؤول</label><input value={newSchool.director_name} onChange={e=>setNewSchool({...newSchool, director_name:e.target.value})} className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2 text-sm"/></div>
                  </div>
                  <div className="flex gap-2 mt-6">
                    <button onClick={()=>setShowAdd(false)} className="flex-1 h-10 rounded-xl border border-slate-200 font-bold">إلغاء</button>
                    <button onClick={async()=>{ if(!newSchool.name.trim()) return toast.error("اسم المدرسة مطلوب"); const start = new Date(); const end = new Date(start); end.setDate(end.getDate() + (newSchool.billing_cycle==='yearly'?365:30)); await createSchool.mutateAsync({ name:newSchool.name.trim(), country:newSchool.country, plan:newSchool.plan, billing_cycle:newSchool.billing_cycle, email:newSchool.email||null, phone:newSchool.phone||null, director_name:newSchool.director_name||null, subscription_status:"active", subscription_start_date:start.toISOString(), expires_at:end.toISOString() }); setShowAdd(false); setNewSchool({ name:"", country:"السودان", plan:"starter", billing_cycle:"monthly", email:"", phone:"", director_name:""});}} className="flex-[2] h-10 rounded-xl bg-blue-600 text-white font-bold">إنشاء المدرسة</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ───── 3️⃣ طلبات التسجيل ───── */}
        {section === "requests" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {reqLoading ? <p className="p-6 text-slate-500">جاري التحميل...</p> : requests.length === 0 ? <p className="p-6 text-slate-500 text-center">لا توجد طلبات تسجيل.</p> : (
              <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="text-right p-4 font-semibold">اسم المدرسة</th>
                    <th className="text-right p-4 font-semibold">المسؤول</th>
                    <th className="text-right p-4 font-semibold">الهاتف</th>
                    <th className="text-right p-4 font-semibold">البريد</th>
                    <th className="text-right p-4 font-semibold">الخطة المطلوبة</th>
                    <th className="text-right p-4 font-semibold">الحالة</th>
                    <th className="text-right p-4 font-semibold">إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="p-4 font-bold text-slate-900">{r.school_name || r.full_name}</td>
                      <td className="p-4 text-slate-600">{r.director_name || r.full_name || "-"}</td>
                      <td className="p-4 text-slate-600 flex items-center gap-1"><Phone size={12}/>{r.phone || "-"}</td>
                      <td className="p-4 text-slate-500">{r.email || "-"}</td>
                      <td className="p-4"><span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700">{r.plan || r.role_requested || "starter"}</span></td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${r.status === "approved" ? "bg-emerald-100 text-emerald-700" : r.status === "rejected" ? "bg-rose-100 text-rose-700" : r.status==="on_hold" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                          {r.status === "approved" ? "مقبول" : r.status === "rejected" ? "مرفوض" : r.status==="on_hold" ? "معلق" : "قيد الانتظار"}
                        </span>
                      </td>
                      <td className="p-4">
                        {r.status !== "approved" && r.status !== "rejected" ? (
                          <div className="flex gap-1 flex-wrap">
                            <button onClick={() => acceptRequest(r)} className="flex items-center gap-1 bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-700"><CheckCircle2 size={12}/> قبول</button>
                            <button onClick={() => updateRequest.mutate({ id: r.id, status: "rejected" })} className="flex items-center gap-1 bg-rose-50 text-rose-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-rose-100"><XCircle size={12}/> رفض</button>
                            <button onClick={() => updateRequest.mutate({ id: r.id, status: "on_hold" })} className="flex items-center gap-1 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-amber-100"><PauseCircle size={12}/> تعليق</button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">— تمت المعالجة</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
            <p className="p-4 text-xs text-slate-400 bg-slate-50 border-t">عند القبول يتم إنشاء حساب المدرسة تلقائياً (جدول schools) وتفعيل الاشتراك.</p>
          </div>
        )}

        {/* ───── 3️⃣ طلبات المعلمين والطلاب ───── */}
        {section === "teacher-student-regs" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 flex items-center gap-2"><Users size={18} className="text-violet-500"/> طلبات تسجيل المعلمين والطلاب</h3>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full font-bold">{teacherStudentRequests.length} طلب</span>
            </div>
            {tsReqLoading ? <p className="p-6 text-slate-500">جاري التحميل...</p> : teacherStudentRequests.length === 0 ? (
              <div className="p-12 text-center">
                <Users size={40} className="text-slate-200 mx-auto mb-3"/>
                <p className="text-slate-500 font-bold">لا توجد طلبات معلمين أو طلاب بعد</p>
                <p className="text-xs text-slate-400 mt-1">ستظهر هنا الطلبات التي تأتي من صفحات التسجيل العامة للمعلمين والطلاب</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="text-right p-4 font-semibold">الاسم</th>
                    <th className="text-right p-4 font-semibold">النوع</th>
                    <th className="text-right p-4 font-semibold">البريد</th>
                    <th className="text-right p-4 font-semibold">الهاتف</th>
                    <th className="text-right p-4 font-semibold">المدرسة / المدينة</th>
                    <th className="text-right p-4 font-semibold">الصف / الملاحظات</th>
                    <th className="text-right p-4 font-semibold">الحالة</th>
                    <th className="text-right p-4 font-semibold">إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {teacherStudentRequests.map((r) => {
                    const isTeacher = r.role_requested === "teacher";
                    return (
                    <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="p-4">
                        <p className="font-bold text-slate-900">{r.student_name || r.full_name || "-"}</p>
                        {r.parent_name && <p className="text-xs text-slate-400">ولي الأمر: {r.parent_name}</p>}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${isTeacher ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"}`}>
                          {isTeacher ? "معلم" : "طالب"}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500" dir="ltr">{r.email || "-"}</td>
                      <td className="p-4 text-slate-600 flex items-center gap-1" dir="ltr"><Phone size={12}/>{r.phone || "-"}</td>
                      <td className="p-4 text-slate-600">
                        <p>{r.school_name || "-"}</p>
                        {r.city && <p className="text-xs text-slate-400">{r.city}</p>}
                      </td>
                      <td className="p-4 text-slate-600">
                        {!isTeacher && r.grade && <p className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded inline-block font-bold">الصف: {r.grade}</p>}
                        {r.notes && <p className="text-xs text-slate-400 mt-1 max-w-[150px] truncate" title={r.notes}>{r.notes}</p>}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${r.status === "approved" ? "bg-emerald-100 text-emerald-700" : r.status === "rejected" ? "bg-rose-100 text-rose-700" : r.status==="on_hold" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                          {r.status === "approved" ? "مقبول" : r.status === "rejected" ? "مرفوض" : r.status==="on_hold" ? "معلق" : "قيد الانتظار"}
                        </span>
                      </td>
                      <td className="p-4">
                        {r.status !== "approved" && r.status !== "rejected" ? (
                          <div className="flex gap-1 flex-wrap">
                            <button onClick={() => {
                              if (isTeacher) {
                                setTeacherApproval({ requestId: r.id, fullName: r.student_name || r.full_name, email: r.email });
                                setTeacherUsername(r.email || "");
                                setTeacherPassword("");
                              } else {
                                setStudentApproval({ requestId: r.id, fullName: r.student_name || r.full_name, email: r.email });
                                setStudentUsername(r.email || "");
                                setStudentPassword("");
                              }
                            }} className="flex items-center gap-1 bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-700"><CheckCircle2 size={12}/> قبول</button>
                            <button onClick={async () => {
                              await entities.RegistrationRequest.update(r.id, { status: "rejected" });
                              toast.success(`تم رفض الطلب`);
                              queryClient.invalidateQueries({ queryKey: ["founder-teacher-student-regs"] });
                            }} className="flex items-center gap-1 bg-rose-50 text-rose-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-rose-100"><XCircle size={12}/> رفض</button>
                            <button onClick={async () => {
                              await entities.RegistrationRequest.update(r.id, { status: "on_hold" });
                              toast.success(`تم تعليق الطلب`);
                              queryClient.invalidateQueries({ queryKey: ["founder-teacher-student-regs"] });
                            }} className="flex items-center gap-1 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-amber-100"><PauseCircle size={12}/> تعليق</button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">— تمت المعالجة</span>
                        )}
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
              </div>
            )}
            <p className="p-4 text-xs text-slate-400 bg-slate-50 border-t">هذه الطلبات تأتي من صفحات التسجيل العامة (/student-register و /public-registration). عند القبول، يمكن للمعلم/الطالب استخدام حسابه للدخول.</p>
          </div>
        )}

        {/* ───── 4️⃣ الاشتراكات والإيرادات ───── */}
        {section === "subscriptions" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PLANS.map((p) => {
                const count = p.id==="starter" ? starterCount : p.id==="professional" ? proCount : enterpriseCount;
                const monthlyCount = schools.filter(s => s.subscription_status === "active" && s.plan === p.id && s.billing_cycle === "monthly").length;
                const yearlyCount = schools.filter(s => s.subscription_status === "active" && s.plan === p.id && s.billing_cycle === "yearly").length;
                return (
                <div key={p.id} className={`relative rounded-2xl p-6 bg-gradient-to-br ${p.color} text-white shadow-lg`}>
                  {p.popular && <span className="absolute top-4 left-4 bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full">الأكثر رواجاً</span>}
                  <h3 className="text-lg font-bold">{p.name}</h3>
                  <p className="text-3xl font-extrabold mt-2">${p.price}<span className="text-sm font-normal opacity-80">/شهر</span></p>
                  <p className="text-xs opacity-90 mt-3">{p.desc}</p>
                  <div className="mt-3 space-y-1 text-xs">
                    <p className="bg-white/20 rounded-lg px-3 py-1 inline-block font-bold">{count} مدرسة إجمالاً</p>
                    <div className="flex gap-2 text-[11px] opacity-90">
                      <span className="bg-white/15 px-2 py-0.5 rounded">شهري: {monthlyCount}</span>
                      <span className="bg-white/15 px-2 py-0.5 rounded">سنوي: {yearlyCount}</span>
                    </div>
                  </div>
                </div>
              )})}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><BarChart3 size={18} className="text-blue-500"/> رسم بياني للإيرادات الشهرية (مكافئ شهري)</h3>
                <div className="flex items-end gap-2 h-32">
                  {[0.6,0.8,0.7,0.9,1,0.85].map((v,i)=> (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full bg-gradient-to-t from-blue-500 to-violet-400 rounded-t-lg" style={{height: `${v*100}%`}}></div>
                      <span className="text-[10px] text-slate-400">{["يناير","فبراير","مارس","أبريل","مايو","يونيو"][i]}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-2 text-center">الإيراد الشهري المكافئ ${monthlyRevenue} — السنوي يُحسب بسعر مخفض 20%</p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><CircleDollarSign size={18} className="text-amber-500"/> ملخص الإيرادات</h3>
                <div className="space-y-4 text-center">
                  <div className="p-3 bg-emerald-50 rounded-xl"><p className="text-2xl font-extrabold text-emerald-700">${monthlyRevenue}</p><p className="text-xs text-slate-500">الإيراد الشهري المكافئ (MRR)</p></div>
                  <div className="p-3 bg-blue-50 rounded-xl"><p className="text-2xl font-extrabold text-blue-700">${annualRevenue}</p><p className="text-xs text-slate-500">الإيراد السنوي المتوقع (ARR)</p></div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-emerald-50 rounded-lg p-2"><p className="font-bold text-emerald-700">${monthlySchoolsCount}</p><p className="text-slate-500">مدارس شهرية</p></div>
                    <div className="bg-amber-50 rounded-lg p-2"><p className="font-bold text-amber-700">${yearlySchoolsCount}</p><p className="text-slate-500">مدارس سنوية</p></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                    <div className="bg-blue-50 rounded-lg p-2"><p className="font-bold text-blue-700">${revenueBreakdown.monthly}</p><p className="text-slate-500">MRR من الشهري</p></div>
                    <div className="bg-violet-50 rounded-lg p-2"><p className="font-bold text-violet-700">${revenueBreakdown.yearly}</p><p className="text-slate-500">MRR من السنوي (مخفّض)</p></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><AlertTriangle size={16} className="text-rose-500"/> مدارس اشتراكها منتهٍ وتحتاج تجديد</h3>
              {expiredSchools===0 && expiringSoon.length===0 ? <p className="text-sm text-slate-400">لا توجد مدارس منتهية حالياً 🎉</p> : (
                <div className="space-y-2">
                  {schools.filter(s=>s.subscription_status==="expired"||s.subscription_status==="inactive").map(s=>(
                    <div key={s.id} className="flex items-center justify-between p-3 bg-rose-50 rounded-xl">
                      <div><p className="font-bold text-sm">{s.name}</p><p className="text-xs text-slate-500">{s.plan} • {s.email}</p></div>
                      <button onClick={()=>updateSchool.mutate({id:s.id, status:"active"})} className="text-xs font-bold bg-emerald-600 text-white px-3 py-1.5 rounded-lg">تجديد</button>
                    </div>
                  ))}
                  {expiringSoon.map(s=>(
                    <div key={s.id+"-soon"} className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
                      <div><p className="font-bold text-sm">{s.name}</p><p className="text-xs text-amber-700">ينتهي خلال 7 أيام</p></div>
                      <span className="text-xs font-bold text-amber-700">تنبيه</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ───── 5️⃣ الدعم الفني ───── */}
        {section === "support" && (
          <div className="space-y-4">
            {tickets.length === 0 ? <p className="text-slate-500">لا توجد تذاكر دعم.</p> : (
              tickets.map((t) => (
                <div key={t.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-5 flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${t.priority === "high" ? "bg-rose-100 text-rose-700" : t.priority === "medium" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{t.priority === "high" ? "عاجل" : t.priority === "medium" ? "متوسط" : "منخفض"}</span>
                        <span className={`text-xs font-semibold ${t.status === "open" ? "text-amber-600" : "text-emerald-600"}`}>{t.status === "open" ? "مفتوحة" : "مغلقة"}</span>
                        <span className="text-xs text-slate-400">{t.date}</span>
                      </div>
                      <p className="font-bold text-slate-900 mt-2">{t.subject}</p>
                      <p className="text-sm text-slate-600 mt-1 bg-slate-50 rounded-xl p-3">{t.details || t.subject} — <span className="text-slate-500">{t.school}</span></p>
                      {t.reply && <div className="mt-3 bg-blue-50 border border-blue-100 rounded-xl p-3"><p className="text-xs font-bold text-blue-700 mb-1">ردك:</p><p className="text-sm text-slate-700">{t.reply}</p></div>}
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      {t.status === "open" && <button onClick={()=>setActiveTicket(activeTicket===t.id?null:t.id)} className="flex items-center gap-1 text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-semibold"><MessageCircle size={14}/> رد</button>}
                      {t.status === "open" && <button onClick={() => setTickets((ts) => ts.map((x) => x.id === t.id ? { ...x, status: "closed" } : x))} className="flex items-center gap-1 text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-lg text-xs font-semibold"><CheckCircle2 size={14}/> إغلاق</button>}
                      {t.status === "closed" && <span className="text-xs text-emerald-600 font-bold flex items-center gap-1"><CheckCircle2 size={14}/> تم الحل</span>}
                    </div>
                  </div>
                  {activeTicket===t.id && t.status==="open" && (
                    <div className="px-5 pb-4 border-t border-slate-100 pt-4 bg-slate-50/50">
                      <textarea value={replyMap[t.id]||""} onChange={e=>setReplyMap({...replyMap,[t.id]:e.target.value})} placeholder="اكتب ردك للمدرسة..." rows={3} className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                      <div className="flex gap-2 mt-2">
                        <button onClick={()=>{ const txt=(replyMap[t.id]||"").trim(); if(!txt) return toast.error("اكتب الرد أولاً"); setTickets(ts=>ts.map(x=>x.id===t.id?{...x, reply:txt}:x)); setReplyMap({...replyMap,[t.id]:""}); setActiveTicket(null); toast.success("تم إرسال الرد");}} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700">إرسال الرد</button>
                        <button onClick={()=>setActiveTicket(null)} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold">إلغاء</button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ───── 6️⃣ إعدادات المنصة ───── */}
        {section === "settings" && (
          <div className="space-y-6 max-w-3xl">
            {/* أسعار الخطط */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Crown size={18} className="text-amber-500"/> تعديل أسعار الخطط</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className="text-xs font-bold text-slate-600">Starter ($)</label><input type="number" value={settings.plan_starter_price} onChange={e=>setSettings({...settings, plan_starter_price:e.target.value})} className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2 text-sm"/></div>
                <div><label className="text-xs font-bold text-slate-600">Professional ($)</label><input type="number" value={settings.plan_professional_price} onChange={e=>setSettings({...settings, plan_professional_price:e.target.value})} className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2 text-sm"/></div>
                <div><label className="text-xs font-bold text-slate-600">Enterprise ($)</label><input type="number" value={settings.plan_enterprise_price} onChange={e=>setSettings({...settings, plan_enterprise_price:e.target.value})} className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2 text-sm"/></div>
              </div>
              <p className="text-xs text-slate-400 mt-2">تُحفظ محلياً وتظهر فوراً في قسم الاشتراكات والإيرادات.</p>
            </div>

            {/* بيانات التواصل */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Phone size={18} className="text-emerald-500"/> بيانات التواصل في Landing Page</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="text-xs font-bold text-slate-600">بريد الدعم</label><input type="email" value={settings.support_email} onChange={e=>setSettings({...settings, support_email:e.target.value})} className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2 text-sm" dir="ltr"/></div>
                <div><label className="text-xs font-bold text-slate-600">رقم الهاتف</label><input value={settings.support_phone} onChange={e=>setSettings({...settings, support_phone:e.target.value})} className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2 text-sm" dir="ltr"/></div>
                <div className="md:col-span-2"><label className="text-xs font-bold text-slate-600">رقم واتساب</label><input value={settings.whatsapp_number} onChange={e=>setSettings({...settings, whatsapp_number:e.target.value})} className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2 text-sm" dir="ltr" placeholder="2499..."/></div>
              </div>
            </div>

            {/* وضع الصيانة */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <Toggle label="وضع الصيانة" desc="إيقاف المنصة مؤقتاً للصيانة — يظهر تنبيه للمدارس" checked={settings.maintenance_mode} onChange={(v) => setSettings((s) => ({ ...s, maintenance_mode: v }))} />
              <Toggle label="السماح بالتسجيلات الجديدة" desc="فتح/إغلاق صفحة التسجيل للمدارس الجديدة" checked={settings.allow_registrations} onChange={(v) => setSettings((s) => ({ ...s, allow_registrations: v }))} />
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">العملة الافتراضية</label>
                <select value={settings.default_currency} onChange={(e) => setSettings((s) => ({ ...s, default_currency: e.target.value }))} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
                  <option value="USD">USD ($)</option>
                  <option value="SAR">SAR (﷼)</option>
                  <option value="AED">AED (د.إ)</option>
                  <option value="SDG">SDG (ج.س)</option>
                </select>
              </div>
            </div>

            {/* تغيير كلمة المرور */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><KeyRound size={18} className="text-violet-500"/> تغيير كلمة مرورك</h3>
              <div className="space-y-3 max-w-md">
                <input type="password" value={pw.cur} onChange={e=>setPw({...pw, cur:e.target.value})} placeholder="كلمة المرور الحالية" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"/>
                <input type="password" value={pw.next} onChange={e=>setPw({...pw, next:e.target.value})} placeholder="كلمة المرور الجديدة" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"/>
                <input type="password" value={pw.confirm} onChange={e=>setPw({...pw, confirm:e.target.value})} placeholder="تأكيد الجديدة" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"/>
                <button onClick={()=>{
                  if(!pw.next || pw.next!==pw.confirm) return toast.error("تأكيد كلمة المرور غير متطابق");
                  if(pw.next.length<6) return toast.error("كلمة المرور قصيرة (6 أحرف على الأقل)");
                  localStorage.setItem("founder_custom_password", pw.next);
                  setPw({cur:"", next:"", confirm:""});
                  toast.success("تم تغيير كلمة المرور — استخدمها في تسجيل الدخول القادم");
                }} className="w-full h-10 rounded-xl bg-violet-600 text-white font-bold text-sm hover:bg-violet-700">حفظ كلمة المرور</button>
                <p className="text-xs text-slate-400">الافتراضية: 430655 — يمكنك تغييرها هنا وتحفظ محلياً.</p>
              </div>
            </div>

            {/* النسخ والتحديثات */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Download size={18} className="text-slate-600"/> إدارة النسخ والتحديثات</h3>
              <div className="flex flex-wrap gap-3">
                <button onClick={()=>{
                  const data = { schools, requests, tickets, settings, exported_at: new Date().toISOString() };
                  const blob = new Blob([JSON.stringify(data,null,2)], {type:"application/json"});
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a"); a.href=url; a.download=`edutrack-backup-${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(url);
                  toast.success("تم تنزيل النسخة الاحتياطية");
                }} className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-black"><Download size={16}/> تنزيل نسخة احتياطية (JSON)</button>
                <button onClick={()=>toast("التحديثات تتم تلقائياً عبر Render — ادفع إلى main للنشر")} className="inline-flex items-center gap-2 border border-slate-300 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-50"><RefreshCw size={16}/> التحقق من التحديثات</button>
              </div>
              <p className="text-xs text-slate-400 mt-3">النسخة الحالية v1.0 — آخر دفع: {new Date().toLocaleDateString('ar-EG')}</p>
            </div>

            <button onClick={() => { localStorage.setItem("founder_platform_settings", JSON.stringify(settings)); toast.success("تم حفظ جميع الإعدادات"); }} className="flex items-center gap-2 rounded-xl bg-blue-600 text-white font-bold px-6 py-3 text-sm shadow-lg shadow-blue-900/30 hover:bg-blue-700">
              <Save size={16}/> حفظ كل الإعدادات
            </button>
          </div>
        )}

        {/* ── بطاقة تسليم بيانات الدخول ── */}
        {delivery && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={()=>setDelivery(null)}>
            <div className="bg-white rounded-[28px] max-w-lg w-full shadow-2xl overflow-hidden" onClick={e=>e.stopPropagation()} dir="rtl">
              <div className="bg-gradient-to-br from-violet-600 via-blue-600 to-emerald-500 p-6 text-white">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-3"><KeyRound className="text-white" size={24}/></div>
<h3 className="text-xl font-black">تم إنشاء اشتراك المدرسة ✅</h3>
                <p className="text-sm text-white/90 mt-1">سلّم هذه البيانات للمسؤول — كل بيانات المدرسة معزولة تلقائياً</p>
                <p className="text-xs bg-white/15 rounded-lg px-3 py-1.5 mt-3 inline-block">{delivery.school.name} • باقة {delivery.school.plan} • {delivery.school.billing_cycle === 'yearly' ? 'سنوي' : 'شهري'}</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500"><Link2 size={14}/> رابط الدخول</div>
                    <button onClick={()=>{navigator.clipboard.writeText(delivery.loginUrl); toast.success("تم نسخ الرابط");}} className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1"><Copy size={12}/> نسخ</button>
                  </div>
                  <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono text-slate-800" dir="ltr">
                    <span className="flex-1 truncate">{delivery.loginUrl}</span>
                    <a href={delivery.loginUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline"><ExternalLink size={14}/></a>
                  </div>
                  <p className="text-[11px] text-slate-400">يختار المدير: <b>الإدارة</b> → يدخل البريد وكلمة المرور</p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div className="bg-white border border-slate-200 rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 flex items-center gap-1"><Mail size={14}/> البريد / اسم المستخدم</span>
                      <button onClick={()=>{navigator.clipboard.writeText(delivery.adminEmail); toast.success("تم نسخ البريد");}} className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1"><Copy size={12}/> نسخ</button>
                    </div>
                    <p className="mt-1 text-sm font-bold text-slate-900 font-mono" dir="ltr">{delivery.adminEmail}</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-700 flex items-center gap-1"><Lock size={14}/> كلمة المرور المؤقتة</span>
                      <button onClick={()=>{navigator.clipboard.writeText(delivery.password); toast.success("تم نسخ كلمة المرور");}} className="text-xs font-bold text-amber-700 hover:underline inline-flex items-center gap-1"><Copy size={12}/> نسخ</button>
                    </div>
                    <p className="mt-1 text-base font-black text-amber-900 font-mono tracking-wider" dir="ltr">{delivery.password}</p>
                    <p className="text-[11px] text-amber-700 mt-1">يُنصح بتغييرها بعد أول دخول — لا تُخزن كنص واضح بعد التسليم</p>
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-xs leading-relaxed text-emerald-900">
                  <b>تفاصيل الاشتراك:</b> دورة الفوترة: <b>{delivery.school.billing_cycle === 'yearly' ? 'سنوي' : 'شهري'}</b> • بدء الاشتراك: <b>{delivery.school.subscription_start_date ? new Date(delivery.school.subscription_start_date).toLocaleDateString('ar-EG') : 'اليوم'}</b> • ينتهي في: <b>{delivery.school.expires_at ? new Date(delivery.school.expires_at).toLocaleDateString('ar-EG') : '—'}</b>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs leading-relaxed text-blue-900">
                  <b>ماذا يستطيع المدير الآن؟</b> تسجيل دخول → إنشاء المعلمين/الطلاب/أولياء الأمور → كلهم يُربطون تلقائياً بـ <b>{delivery.school.name}</b> ولا يرون أي مدرسة أخرى. الاشتراك: <b>{delivery.school.plan}</b> — حالته <b>نشط</b> ويمكنك تعليقه من تبويب المدارس.
                </div>

                <div className="flex gap-2">
                  <button onClick={()=>{
                    const cycle = delivery.school.billing_cycle === 'yearly' ? 'سنوي' : 'شهري';
                    const msg = `مرحباً ${delivery.school.director} 👋\nتم تفعيل اشتراك مدرستكم *${delivery.school.name}* على منصة EduTrack\n\n🔗 رابط الدخول: ${delivery.loginUrl}\nاختر: الإدارة\n👤 البريد: ${delivery.adminEmail}\n🔑 كلمة المرور: ${delivery.password}\n\nالخطة: ${delivery.school.plan} (${cycle})\nبدء الاشتراك: ${delivery.school.subscription_start_date ? new Date(delivery.school.subscription_start_date).toLocaleDateString('ar-EG') : 'اليوم'}\nينتهي في: ${delivery.school.expires_at ? new Date(delivery.school.expires_at).toLocaleDateString('ar-EG') : '—'}\n\nيرجى تغيير كلمة المرور بعد أول دخول.`;
                    const url = `https://wa.me/${(delivery.school.phone||"").replace(/[^0-9]/g,"")}?text=${encodeURIComponent(msg)}`;
                    if((delivery.school.phone||"").trim()) window.open(url, "_blank");
                    else { navigator.clipboard.writeText(msg); toast.success("تم نسخ رسالة الواتساب — الصقها يدوياً"); }
                  }} className="flex-1 h-11 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 inline-flex items-center justify-center gap-2"><Send size={16}/> إرسال واتساب</button>
                  <button onClick={()=>{
                    const cycle = delivery.school.billing_cycle === 'yearly' ? 'سنوي' : 'شهري';
                    const subject = `بيانات دخول EduTrack — ${delivery.school.name}`;
                    const body = `مرحباً ${delivery.school.director},\n\nتم تفعيل اشتراك مدرستكم ${delivery.school.name} (باقة ${delivery.school.plan} - ${cycle}).\n\nرابط الدخول: ${delivery.loginUrl}\nاختر: الإدارة\nالبريد: ${delivery.adminEmail}\nكلمة المرور: ${delivery.password}\n\nبدء الاشتراك: ${delivery.school.subscription_start_date ? new Date(delivery.school.subscription_start_date).toLocaleDateString('ar-EG') : 'اليوم'}\nينتهي في: ${delivery.school.expires_at ? new Date(delivery.school.expires_at).toLocaleDateString('ar-EG') : '—'}\n\nيرجى تغيير كلمة المرور بعد أول دخول.\n`;
                    window.location.href = `mailto:${delivery.adminEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                  }} className="flex-1 h-11 rounded-xl border border-slate-200 bg-white font-bold text-sm hover:bg-slate-50 inline-flex items-center justify-center gap-2"><Mail size={16}/> إرسال بريد</button>
                </div>
                <div className="flex gap-2">
                  <button onClick={()=>window.print()} className="flex-1 h-10 rounded-xl border border-slate-200 bg-white font-bold text-sm hover:bg-slate-50 inline-flex items-center justify-center gap-2"><Printer size={16}/> طباعة</button>
                  <button onClick={()=>{
                    const txt = `EduTrack — ${delivery.school.name}\nالرابط: ${delivery.loginUrl}\nالبريد: ${delivery.adminEmail}\nكلمة المرور: ${delivery.password}\nالخطة: ${delivery.school.plan}`;
                    navigator.clipboard.writeText(txt); toast.success("تم نسخ كل البيانات");
                  }} className="flex-1 h-10 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-black inline-flex items-center justify-center gap-2"><Copy size={16}/> نسخ الكل</button>
                </div>
                <button onClick={()=>setDelivery(null)} className="w-full h-10 rounded-xl bg-slate-100 font-bold text-sm hover:bg-slate-200">إغلاق — تم التسليم</button>
                <p className="text-[11px] text-center text-slate-400">نصيحة: سلّم كلمة المرور مرة واحدة فقط. المدير يغيّرها، ويمكنك إعادة تعيينها لاحقاً من إدارة المدارس بزر "حساب المدير".</p>
              </div>
            </div>
          </div>
        )}

        {/* Teacher Approval Modal */}
        {teacherApproval && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setTeacherApproval(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-black text-slate-900 mb-1">إنشاء حساب المعلم</h3>
              <p className="text-sm text-slate-500 mb-4">
                الموافقة على <span className="font-bold text-slate-800">{teacherApproval.fullName}</span> — أدخل اسم المستخدم وكلمة المرور للدخول من بوابة المعلم.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">اسم المستخدم (Username)</label>
                  <input
                    type="text"
                    value={teacherUsername}
                    onChange={e => setTeacherUsername(e.target.value)}
                    className="w-full h-11 rounded-xl border border-slate-200 px-4 text-sm font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                    placeholder="teacher_name"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">كلمة المرور (Password)</label>
                  <input
                    type="text"
                    value={teacherPassword}
                    onChange={e => setTeacherPassword(e.target.value)}
                    className="w-full h-11 rounded-xl border border-slate-200 px-4 text-sm font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                    placeholder="••••••••"
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <button
                  onClick={handleApproveTeacher}
                  disabled={approvingTeacher}
                  className="flex-1 h-11 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 inline-flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {approvingTeacher ? "جارٍ الإنشاء..." : <><CheckCircle2 size={14}/> تأكيد الموافقة</>}
                </button>
                <button
                  onClick={() => setTeacherApproval(null)}
                  className="h-11 px-4 rounded-xl bg-slate-100 font-bold text-sm hover:bg-slate-200"
                >
                  إلغاء
                </button>
              </div>
              <p className="text-[11px] text-center text-slate-400 mt-3">اسم المستخدم هو الذي سيستخدمه المعلم للدخول من صفحة الهبوط.</p>
            </div>
          </div>
        )}

        {/* Student Approval Modal */}
        {studentApproval && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setStudentApproval(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-black text-slate-900 mb-1">إنشاء حساب الطالب</h3>
              <p className="text-sm text-slate-500 mb-4">
                الموافقة على <span className="font-bold text-slate-800">{studentApproval.fullName}</span> — أدخل اسم المستخدم وكلمة المرور للدخول من بوابة الطالب.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">اسم المستخدم (Username)</label>
                  <input
                    type="text"
                    value={studentUsername}
                    onChange={e => setStudentUsername(e.target.value)}
                    className="w-full h-11 rounded-xl border border-slate-200 px-4 text-sm font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                    placeholder="student_name"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">كلمة المرور (Password)</label>
                  <input
                    type="text"
                    value={studentPassword}
                    onChange={e => setStudentPassword(e.target.value)}
                    className="w-full h-11 rounded-xl border border-slate-200 px-4 text-sm font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                    placeholder="••••••••"
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <button
                  onClick={handleApproveStudent}
                  disabled={approvingStudent}
                  className="flex-1 h-11 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 inline-flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {approvingStudent ? "جارٍ الإنشاء..." : <><CheckCircle2 size={14}/> تأكيد الموافقة</>}
                </button>
                <button
                  onClick={() => setStudentApproval(null)}
                  className="h-11 px-4 rounded-xl bg-slate-100 font-bold text-sm hover:bg-slate-200"
                >
                  إلغاء
                </button>
              </div>
              <p className="text-[11px] text-center text-slate-400 mt-3">اسم المستخدم هو الذي سيستخدمه الطالب للدخول من صفحة الهبوط.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const Toggle = ({ label, desc, checked, onChange }) => (
  <div className="flex items-center justify-between border-b border-slate-100 pb-4 last:border-0 last:pb-0">
    <div>
      <p className="font-semibold text-slate-800">{label}</p>
      <p className="text-xs text-slate-500">{desc}</p>
    </div>
    <button onClick={() => onChange(!checked)} className={`relative w-12 h-6 rounded-full transition ${checked ? "bg-emerald-500" : "bg-slate-300"}`}>
      <span className={`absolute top-0.5 ${checked ? "right-0.5" : "right-6"} w-5 h-5 bg-white rounded-full shadow transition-all`} />
    </button>
  </div>
);

export default FounderDashboard;
