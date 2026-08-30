import React, { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/dbClient";
import { toast } from "sonner";
import {
  LayoutDashboard, Building2, FileText, CreditCard, LifeBuoy, Settings,
  LogOut, CheckCircle2, XCircle, Bell, School as SchoolIcon, TrendingUp,
  Users, CircleDollarSign, RefreshCw
} from "lucide-react";

const PLANS = [
  { id: "starter", name: "Starter", price: 49, color: "from-slate-500 to-slate-600", desc: "مدرسة صغيرة حتى 200 طالب" },
  { id: "professional", name: "Professional", price: 99, color: "from-blue-500 to-blue-600", desc: "المدرسة المتوسطة مع كل الميزات", popular: true },
  { id: "enterprise", name: "Enterprise", price: 199, color: "from-violet-500 to-violet-600", desc: "شبكة مدارس وميزات غير محدودة" },
];

const SUPPORT_SEED = [
  { id: "t1", school: "مدرسة النور الأهلية", subject: "تعطل نظام الحضور", priority: "high", status: "open", date: "2026-08-28" },
  { id: "t2", school: "أكاديمية المستقبل", subject: "طلب ترقية الباقة", priority: "medium", status: "open", date: "2026-08-29" },
  { id: "t3", school: "مدارس الرواد", subject: "استفسار عن الفواتير", priority: "low", status: "open", date: "2026-08-30" },
];

const SETTINGS_DEFAULT = {
  maintenance_mode: false,
  allow_registrations: true,
  default_currency: "USD",
  support_email: "support@edutrack.com",
};

const NAV = [
  { id: "overview", label: "الرئيسية", icon: LayoutDashboard },
  { id: "schools", label: "المدارس", icon: Building2 },
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

  // Schools (resilient: if School entity not deployed server-side, treat as empty)
  const { data: schools = [], isLoading: schoolsLoading } = useQuery({
    queryKey: ["founder-schools"],
    queryFn: async () => {
      try { return await entities.School.list("-created_at", 1000); }
      catch (e) { return []; }
    },
  });

  // Registration requests
  const { data: requests = [], isLoading: reqLoading } = useQuery({
    queryKey: ["founder-registrations"],
    queryFn: async () => {
      try { return await entities.RegistrationRequest.list("-created_at", 200); }
      catch (e) { return []; }
    },
  });

  // Support tickets (localStorage)
  const [tickets, setTickets] = useState(() => {
    try { return JSON.parse(localStorage.getItem("founder_support_tickets")) || SUPPORT_SEED; }
    catch { return SUPPORT_SEED; }
  });
  useEffect(() => { localStorage.setItem("founder_support_tickets", JSON.stringify(tickets)); }, [tickets]);

  // Platform settings (localStorage)
  const [settings, setSettings] = useState(() => {
    try { return { ...SETTINGS_DEFAULT, ...(JSON.parse(localStorage.getItem("founder_platform_settings")) || {}) }; }
    catch { return SETTINGS_DEFAULT; }
  });
  useEffect(() => { localStorage.setItem("founder_platform_settings", JSON.stringify(settings)); }, [settings]);

  const updateSchool = useMutation({
    mutationFn: ({ id, status }) => entities.School.update(id, { subscription_status: status }),
    onSuccess: () => {
      toast.success("تم تحديث حالة الاشتراك");
      queryClient.invalidateQueries({ queryKey: ["founder-schools"] });
    },
    onError: () => toast.error("تعذر تحديث الحالة (الجدول غير مفعل بعد)"),
  });

  const updateRequest = useMutation({
    mutationFn: ({ id, status }) => entities.RegistrationRequest.update(id, { status }),
    onSuccess: () => {
      toast.success("تم تحديث الطلب");
      queryClient.invalidateQueries({ queryKey: ["founder-registrations"] });
    },
    onError: () => toast.error("تعذر تحديث الطلب"),
  });

  const activeSchools = schools.filter((s) => s.subscription_status === "active").length;
  const trialSchools = schools.filter((s) => s.subscription_status === "trial").length;
  const openTickets = tickets.filter((t) => t.status === "open").length;
  const monthlyRevenue = schools.length
    ? schools.reduce((sum, s) => {
        const plan = PLANS.find((p) => p.id === (s.plan || "professional"));
        return sum + (plan ? plan.price : 99);
      }, 0)
    : 0;

  const StatCard = ({ icon: Ic, label, value, tint }) => (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${tint}`}>
        <Ic className="text-white" size={20} />
      </div>
      <p className="mt-4 text-3xl font-extrabold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
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
      <main className="flex-1 p-8 overflow-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-extrabold text-slate-900">
            {NAV.find((n) => n.id === section)?.label}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            مرحباً بك {localStorage.getItem("founder_email") || "بالمالك"} في لوحة تحكم المنصة
          </p>
        </header>

        {section === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={Building2} label="إجمالي المدارس" value={schools.length} tint="bg-blue-500" />
              <StatCard icon={CheckCircle2} label="اشتراكات نشطة" value={activeSchools} tint="bg-emerald-500" />
              <StatCard icon={FileText} label="طلبات التسجيل" value={requests.length} tint="bg-violet-500" />
              <StatCard icon={CircleDollarSign} label="الإيراد الشهري ($)" value={monthlyRevenue} tint="bg-amber-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm lg:col-span-2">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <TrendingUp size={18} className="text-blue-500" /> نظرة عامة
                </h3>
                <div className="space-y-3 text-sm text-slate-600">
                  <div className="flex justify-between"><span>مدارس في فترة تجريبية</span><span className="font-bold text-slate-900">{trialSchools}</span></div>
                  <div className="flex justify-between"><span>تذاكر دعم مفتوحة</span><span className="font-bold text-slate-900">{openTickets}</span></div>
                  <div className="flex justify-between"><span>طلبات قيد الانتظار</span><span className="font-bold text-slate-900">{requests.filter((r) => r.status === "pending" || !r.status).length}</span></div>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Bell size={18} className="text-amber-500" /> تنبيهات سريعة
                </h3>
                {openTickets > 0 ? (
                  <p className="text-sm text-slate-600">لديك {openTickets} تذكرة دعم تحتاج متابعة.</p>
                ) : (
                  <p className="text-sm text-slate-600">لا توجد تنبيهات عاجلة.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {section === "schools" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {schoolsLoading ? (
              <p className="p-6 text-slate-500">جاري التحميل...</p>
            ) : schools.length === 0 ? (
              <p className="p-6 text-slate-500">لا توجد مدارس مسجلة بعد.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="text-right p-4 font-semibold">اسم المدرسة</th>
                    <th className="text-right p-4 font-semibold">البريد</th>
                    <th className="text-right p-4 font-semibold">الباقة</th>
                    <th className="text-right p-4 font-semibold">حالة الاشتراك</th>
                  </tr>
                </thead>
                <tbody>
                  {schools.map((s) => (
                    <tr key={s.id} className="border-t border-slate-100">
                      <td className="p-4 text-slate-900 font-semibold">{s.name}</td>
                      <td className="p-4 text-slate-500">{s.email || "-"}</td>
                      <td className="p-4 text-slate-600">{s.plan || "professional"}</td>
                      <td className="p-4">
                        <select
                          value={s.subscription_status || "trial"}
                          onChange={(e) => updateSchool.mutate({ id: s.id, status: e.target.value })}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="active">نشط</option>
                          <option value="trial">تجريبي</option>
                          <option value="inactive">متوقف</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {section === "requests" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {reqLoading ? (
              <p className="p-6 text-slate-500">جاري التحميل...</p>
            ) : requests.length === 0 ? (
              <p className="p-6 text-slate-500">لا توجد طلبات تسجيل.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="text-right p-4 font-semibold">اسم المدرسة</th>
                    <th className="text-right p-4 font-semibold">المدير</th>
                    <th className="text-right p-4 font-semibold">البريد</th>
                    <th className="text-right p-4 font-semibold">الحالة</th>
                    <th className="text-right p-4 font-semibold">إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r.id} className="border-t border-slate-100">
                      <td className="p-4 text-slate-900 font-semibold">{r.school_name || r.name}</td>
                      <td className="p-4 text-slate-600">{r.director_name || "-"}</td>
                      <td className="p-4 text-slate-500">{r.email || "-"}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          r.status === "approved" ? "bg-emerald-100 text-emerald-700"
                          : r.status === "rejected" ? "bg-rose-100 text-rose-700"
                          : "bg-amber-100 text-amber-700"
                        }`}>
                          {r.status === "approved" ? "مقبول" : r.status === "rejected" ? "مرفوض" : "قيد الانتظار"}
                        </span>
                      </td>
                      <td className="p-4 flex gap-2">
                        <button
                          onClick={() => updateRequest.mutate({ id: r.id, status: "approved" })}
                          className="flex items-center gap-1 text-emerald-600 hover:bg-emerald-50 px-2 py-1 rounded-lg text-xs font-semibold"
                        >
                          <CheckCircle2 size={15} /> قبول
                        </button>
                        <button
                          onClick={() => updateRequest.mutate({ id: r.id, status: "rejected" })}
                          className="flex items-center gap-1 text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-lg text-xs font-semibold"
                        >
                          <XCircle size={15} /> رفض
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {section === "subscriptions" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PLANS.map((p) => (
                <div key={p.id} className={`relative rounded-2xl p-6 bg-gradient-to-br ${p.color} text-white shadow-lg`}>
                  {p.popular && (
                    <span className="absolute top-4 left-4 bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full">الأكثر رواجاً</span>
                  )}
                  <h3 className="text-lg font-bold">{p.name}</h3>
                  <p className="text-3xl font-extrabold mt-2">${p.price}<span className="text-sm font-normal opacity-80">/شهر</span></p>
                  <p className="text-xs opacity-90 mt-3">{p.desc}</p>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <CircleDollarSign size={18} className="text-amber-500" /> ملخص الإيرادات
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div><p className="text-2xl font-extrabold text-slate-900">${monthlyRevenue}</p><p className="text-xs text-slate-500">الإيراد الشهري التقديري</p></div>
                <div><p className="text-2xl font-extrabold text-slate-900">${monthlyRevenue * 12}</p><p className="text-xs text-slate-500">الإيراد السنوي التقديري</p></div>
                <div><p className="text-2xl font-extrabold text-slate-900">{activeSchools}</p><p className="text-xs text-slate-500">اشتراكات مدفوعة</p></div>
              </div>
            </div>
          </div>
        )}

        {section === "support" && (
          <div className="space-y-3">
            {tickets.length === 0 ? (
              <p className="text-slate-500">لا توجد تذاكر دعم.</p>
            ) : (
              tickets.map((t) => (
                <div key={t.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        t.priority === "high" ? "bg-rose-100 text-rose-700"
                        : t.priority === "medium" ? "bg-amber-100 text-amber-700"
                        : "bg-slate-100 text-slate-600"
                      }`}>{t.priority === "high" ? "عاجل" : t.priority === "medium" ? "متوسط" : "منخفض"}</span>
                      <p className="font-bold text-slate-900">{t.subject}</p>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">{t.school} — {t.date}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold ${t.status === "open" ? "text-amber-600" : "text-emerald-600"}`}>
                      {t.status === "open" ? "مفتوحة" : "تم الحل"}
                    </span>
                    {t.status === "open" && (
                      <button
                        onClick={() => setTickets((ts) => ts.map((x) => x.id === t.id ? { ...x, status: "resolved" } : x))}
                        className="flex items-center gap-1 text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-lg text-xs font-semibold"
                      >
                        <CheckCircle2 size={15} /> تم الحل
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {section === "settings" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5 max-w-2xl">
            <Toggle label="وضع الصيانة" desc="إيقاف المنصة مؤقتاً للصيانة" checked={settings.maintenance_mode}
              onChange={(v) => setSettings((s) => ({ ...s, maintenance_mode: v }))} />
            <Toggle label="السماح بالتسجيلات الجديدة" desc="فتح صفحة التسجيل للمدارس" checked={settings.allow_registrations}
              onChange={(v) => setSettings((s) => ({ ...s, allow_registrations: v }))} />
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">العملة الافتراضية</label>
              <select
                value={settings.default_currency}
                onChange={(e) => setSettings((s) => ({ ...s, default_currency: e.target.value }))}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="USD">USD ($)</option>
                <option value="SAR">SAR (﷼)</option>
                <option value="AED">AED (د.إ)</option>
                <option value="SDG">SDG (ج.س)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">بريد الدعم</label>
              <input
                type="email"
                value={settings.support_email}
                onChange={(e) => setSettings((s) => ({ ...s, support_email: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => { localStorage.setItem("founder_platform_settings", JSON.stringify(settings)); toast.success("تم حفظ الإعدادات"); }}
              className="flex items-center gap-2 rounded-xl bg-blue-600 text-white font-bold px-5 py-2.5 text-sm shadow-lg shadow-blue-900/30 hover:bg-blue-700"
            >
              <RefreshCw size={16} /> حفظ الإعدادات
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

const Toggle = ({ label, desc, checked, onChange }) => (
  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
    <div>
      <p className="font-semibold text-slate-800">{label}</p>
      <p className="text-xs text-slate-500">{desc}</p>
    </div>
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-6 rounded-full transition ${checked ? "bg-emerald-500" : "bg-slate-300"}`}
    >
      <span className={`absolute top-0.5 ${checked ? "right-0.5" : "right-6"} w-5 h-5 bg-white rounded-full shadow transition-all`} />
    </button>
  </div>
);

export default FounderDashboard;
