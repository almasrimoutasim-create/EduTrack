import React, { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/dbClient";
import { toast } from "sonner";
import {
  LayoutDashboard, Building2, FileText, CreditCard, LifeBuoy, Settings,
  LogOut, CheckCircle2, XCircle, Bell, School as SchoolIcon, TrendingUp,
  Users, CircleDollarSign, RefreshCw, Eye, Plus, Clock, AlertTriangle,
  BarChart3, MessageCircle, Save, Download, KeyRound, PauseCircle, Timer,
  MapPin, Calendar, Phone, Mail, Crown, Zap, Shield
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
  { id: "subscriptions", label: "الاشتراكات والإيرادات", icon: CreditCard },
  { id: "support", label: "الدعم الفني", icon: LifeBuoy },
  { id: "settings", label: "إعدادات المنصة", icon: Settings },
];

const FounderDashboard = () => {
  const [section, setSection] = useState("overview");
  const queryClient = useQueryClient();

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
  const monthlyRevenue = schools.length
    ? schools.reduce((sum, s) => {
        const plan = PLANS.find((p) => p.id === (s.plan || "professional"));
        return sum + (plan ? plan.price : 99);
      }, 0)
    : 0;
  const annualRevenue = monthlyRevenue * 12;
  const starterCount = schools.filter(s => (s.plan || "professional") === "starter").length;
  const proCount = schools.filter(s => (s.plan || "professional") === "professional").length;
  const enterpriseCount = schools.filter(s => s.plan === "enterprise").length;

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

  // قبول الطلب مع إنشاء مدرسة تلقائياً
  const acceptRequest = async (r) => {
    try {
      const schoolName = r.school_name || r.full_name || "مدرسة جديدة";
      const plan = r.plan || r.role_requested || "starter";
      // خريطة role إلى plan
      const planMap = { admin: "starter", teacher: "starter", student: "starter" };
      const finalPlan = ["starter","professional","enterprise"].includes(plan) ? plan : (planMap[plan] || "starter");
      await entities.School.create({
        name: schoolName,
        director_name: r.director_name || r.full_name || "",
        email: r.email || "",
        phone: r.phone || "",
        country: r.country || "السودان",
        plan: finalPlan,
        subscription_status: "active",
      });
      await entities.RegistrationRequest.update(r.id, { status: "approved" });
      toast.success(`تم قبول الطلب وإنشاء حساب المدرسة: ${schoolName}`);
      queryClient.invalidateQueries({ queryKey: ["founder-schools"] });
      queryClient.invalidateQueries({ queryKey: ["founder-registrations"] });
    } catch (e) {
      toast.error(e.message || "فشل القبول");
    }
  };

  // ── Add school dialog state ──
  const [showAdd, setShowAdd] = useState(false);
  const [newSchool, setNewSchool] = useState({ name: "", country: "السودان", plan: "starter", email: "", phone: "", director_name: "" });
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
                      <th className="text-right p-4 font-semibold">تاريخ الانضمام</th>
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
                        <td className="p-4">
                          <select value={s.subscription_status || "trial"} onChange={(e)=>updateSchool.mutate({id:s.id, status:e.target.value})} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold">
                            <option value="active">نشط</option>
                            <option value="trial">تجريبي</option>
                            <option value="pending">معلق</option>
                            <option value="inactive">موقوف</option>
                            <option value="expired">منتهي</option>
                          </select>
                        </td>
                        <td className="p-4 flex gap-1">
                          <button onClick={()=>updateSchool.mutate({id:s.id, status:"active"})} className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100">تفعيل</button>
                          <button onClick={()=>updateSchool.mutate({id:s.id, status:"inactive"})} className="px-2 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold hover:bg-amber-100">تعليق</button>
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
                    <div className="flex justify-between"><span className="text-slate-500">الحالة</span><b>{viewSchool.subscription_status}</b></div>
                    <div className="flex justify-between"><span className="text-slate-500">تاريخ الانضمام</span><b>{viewSchool.created_at ? new Date(viewSchool.created_at).toLocaleString('ar-EG') : "-"}</b></div>
                    {viewSchool.expires_at && <div className="flex justify-between"><span className="text-slate-500">ينتهي في</span><b>{new Date(viewSchool.expires_at).toLocaleDateString('ar-EG')}</b></div>}
                  </div>
                  <button onClick={()=>setViewSchool(null)} className="mt-6 w-full h-10 rounded-xl bg-slate-900 text-white font-bold">إغلاق</button>
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
                    <div><label className="text-xs font-bold text-slate-600">البريد</label><input value={newSchool.email} onChange={e=>setNewSchool({...newSchool, email:e.target.value})} className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2 text-sm" dir="ltr"/></div>
                    <div><label className="text-xs font-bold text-slate-600">الهاتف</label><input value={newSchool.phone} onChange={e=>setNewSchool({...newSchool, phone:e.target.value})} className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2 text-sm" dir="ltr"/></div>
                    <div className="col-span-2"><label className="text-xs font-bold text-slate-600">اسم المسؤول</label><input value={newSchool.director_name} onChange={e=>setNewSchool({...newSchool, director_name:e.target.value})} className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2 text-sm"/></div>
                  </div>
                  <div className="flex gap-2 mt-6">
                    <button onClick={()=>setShowAdd(false)} className="flex-1 h-10 rounded-xl border border-slate-200 font-bold">إلغاء</button>
                    <button onClick={async()=>{ if(!newSchool.name.trim()) return toast.error("اسم المدرسة مطلوب"); await createSchool.mutateAsync({ name:newSchool.name.trim(), country:newSchool.country, plan:newSchool.plan, email:newSchool.email||null, phone:newSchool.phone||null, director_name:newSchool.director_name||null, subscription_status:"active" }); setShowAdd(false); setNewSchool({ name:"", country:"السودان", plan:"starter", email:"", phone:"", director_name:""});}} className="flex-[2] h-10 rounded-xl bg-blue-600 text-white font-bold">إنشاء المدرسة</button>
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

        {/* ───── 4️⃣ الاشتراكات والإيرادات ───── */}
        {section === "subscriptions" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PLANS.map((p) => {
                const count = p.id==="starter" ? starterCount : p.id==="professional" ? proCount : enterpriseCount;
                return (
                <div key={p.id} className={`relative rounded-2xl p-6 bg-gradient-to-br ${p.color} text-white shadow-lg`}>
                  {p.popular && <span className="absolute top-4 left-4 bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full">الأكثر رواجاً</span>}
                  <h3 className="text-lg font-bold">{p.name}</h3>
                  <p className="text-3xl font-extrabold mt-2">${p.price}<span className="text-sm font-normal opacity-80">/شهر</span></p>
                  <p className="text-xs opacity-90 mt-3">{p.desc}</p>
                  <p className="mt-3 text-sm font-bold bg-white/20 rounded-lg px-3 py-1 inline-block">{count} مدرسة</p>
                </div>
              )})}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><BarChart3 size={18} className="text-blue-500"/> رسم بياني للإيرادات الشهرية (تقديري)</h3>
                <div className="flex items-end gap-2 h-32">
                  {[0.6,0.8,0.7,0.9,1,0.85].map((v,i)=> (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full bg-gradient-to-t from-blue-500 to-violet-400 rounded-t-lg" style={{height: `${v*100}%`}}></div>
                      <span className="text-[10px] text-slate-400">{["يناير","فبراير","مارس","أبريل","مايو","يونيو"][i]}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-2 text-center">الإيراد الشهري الحالي ${monthlyRevenue} — مبني على الخطط النشطة</p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><CircleDollarSign size={18} className="text-amber-500"/> ملخص الإيرادات</h3>
                <div className="space-y-4 text-center">
                  <div className="p-3 bg-emerald-50 rounded-xl"><p className="text-2xl font-extrabold text-emerald-700">${monthlyRevenue}</p><p className="text-xs text-slate-500">الإيراد الشهري المتوقع</p></div>
                  <div className="p-3 bg-blue-50 rounded-xl"><p className="text-2xl font-extrabold text-blue-700">${annualRevenue}</p><p className="text-xs text-slate-500">الإيراد السنوي المتوقع</p></div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-slate-50 rounded-lg p-2"><p className="font-bold">{starterCount}</p><p className="text-slate-500">Starter</p></div>
                    <div className="bg-blue-50 rounded-lg p-2"><p className="font-bold">{proCount}</p><p className="text-slate-500">Pro</p></div>
                    <div className="bg-violet-50 rounded-lg p-2"><p className="font-bold">{enterpriseCount}</p><p className="text-slate-500">Enterprise</p></div>
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
