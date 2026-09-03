import React, { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/dbClient";
import { toast } from "sonner";
import {
  LayoutDashboard, Building2, FileText, CreditCard, LifeBuoy, Settings,
  LogOut, CheckCircle2, XCircle, Bell, School as SchoolIcon, TrendingUp,
  Users, CircleDollarSign, RefreshCw, Eye, Plus, Clock, AlertTriangle,
  BarChart3, MessageCircle, Save, Download, KeyRound, PauseCircle, Timer,
  MapPin, Calendar, Phone, Mail, Crown, Zap, Shield, Copy, Printer, Send, UserPlus, Lock, Link2, ExternalLink, GraduationCap, Trash2
} from "lucide-react";

const PLANS_DEFAULT = [
  { id: "starter", name: "Starter", price: 49, color: "from-slate-500 to-slate-600", desc: "مدرسة صغيرة حتى 200 طالب" },
  { id: "professional", name: "Professional", price: 99, color: "from-blue-500 to-blue-600", desc: "المدرسة المتوسطة مع كل الميزات", popular: true },
  { id: "enterprise", name: "Enterprise", price: 199, color: "from-violet-500 to-violet-600", desc: "شبكة مدارس وميزات غير محدودة" },
];

const SUPPORT_SEED = [];

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
  { id: "teachers", label: "إدارة المعلمين", icon: GraduationCap },
  { id: "students", label: "إدارة الطلاب", icon: Users },
  { id: "subscriptions", label: "الاشتراكات والإيرادات", icon: CreditCard },
  { id: "teacher-pricing", label: "أسعار المعلمين", icon: Crown },
  { id: "teacher-sub-requests", label: "طلبات اشتراكات المعلمين", icon: Timer },
  { id: "support", label: "الدعم الفني", icon: LifeBuoy },
  { id: "settings", label: "إعدادات المنصة", icon: Settings },
];

const FounderDashboard = () => {
  const [section, setSection] = useState("overview");
  const [reqFilter, setReqFilter] = useState("all"); // "all" | "schools" | "students" | "teachers"
  // ── Filter states (declared early: used by pre-computed .filter() blocks below ── TDZ safety) ──
  const [teacherSearch, setTeacherSearch] = useState("");
  const [teacherStatusFilter, setTeacherStatusFilter] = useState("all");
  const [studentSearch, setStudentSearch] = useState("");
  const [studentStatusFilter, setStudentStatusFilter] = useState("all");
  const [teacherSubFilter, setTeacherSubFilter] = useState("all"); // all, pending, trial_active, active, rejected
  const [viewRequestDetail, setViewRequestDetail] = useState(null);
  const queryClient = useQueryClient();

  // ── Teacher Approval Modal ──
  const [teacherApproval, setTeacherApproval] = useState(null); // { requestId, fullName, email, data }
  const [teacherUsername, setTeacherUsername] = useState("");
  const [teacherPassword, setTeacherPassword] = useState("");
  const [approvingTeacher, setApprovingTeacher] = useState(false);

  // ── Student Approval Modal ──
  const [studentApproval, setStudentApproval] = useState(null); // { requestId, fullName, email, data }
  const [studentUsername, setStudentUsername] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [approvingStudent, setApprovingStudent] = useState(false);

  // ── School Approval Modal ──
  const [schoolApproval, setSchoolApproval] = useState(null);
  const [schoolUsername, setSchoolUsername] = useState("");
  const [schoolPassword, setSchoolPassword] = useState("");
  const [approvingSchool, setApprovingSchool] = useState(false);

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
        headers: { "Content-Type": "application/json", "X-Founder-Auth": "true" },
        body: JSON.stringify({
          requestId: teacherApproval.requestId,
          username: teacherUsername.trim(),
          password: teacherPassword.trim(),
          school_id: teacherApproval.school_id || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success(`تم إنشاء حساب المعلم بنجاح — اسم المستخدم: ${teacherUsername.trim()}`);
      setTeacherApproval(null);
      setTeacherUsername("");
      setTeacherPassword("");
      queryClient.invalidateQueries({ queryKey: ["founder-registrations"] });
      queryClient.invalidateQueries({ queryKey: ["founder-teachers"] });


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
        headers: { "Content-Type": "application/json", "X-Founder-Auth": "true" },
        body: JSON.stringify({
          requestId: studentApproval.requestId,
          username: studentUsername.trim(),
          password: studentPassword.trim(),
          school_id: studentApproval.school_id || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success(`تم إنشاء حساب الطالب بنجاح — اسم المستخدم: ${studentUsername.trim()}`);
      setStudentApproval(null);
      setStudentUsername("");
      setStudentPassword("");
      queryClient.invalidateQueries({ queryKey: ["founder-registrations"] });
      queryClient.invalidateQueries({ queryKey: ["founder-students"] });


    } catch (err) {
      toast.error(err.message || "فشل إنشاء الحساب");
    } finally {
      setApprovingStudent(false);
    }
  };

  // ── Teacher subscription approval handler ──
  const handleApproveTeacherSub = async (requestId, isTrial = false) => {
    setProcessingTeacherSub(requestId);
    try {
      const apiBase = import.meta.env.VITE_BACKEND_URL || '';
      const res = await fetch(`${apiBase}/api/teacher-subscription-requests/${requestId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Founder-Auth": "true" },
        body: JSON.stringify({
          trial_days: approveTrialDays,
          founder_notes: approveFounderNotes,
          is_trial: isTrial
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success(isTrial ? "تم تفعيل الفترة التجريبية بنجاح" : "تم تفعيل الاشتراك بنجاح");
      setViewTeacherSubDetail(null);
      setApproveFounderNotes("");
      setApproveTrialDays(30);
      refetchTeacherSub();
    } catch (err) {
      toast.error(err.message || "فشل تفعيل الاشتراك");
    } finally {
      setProcessingTeacherSub(null);
    }
  };

  // ── Teacher subscription rejection handler ──
  const handleRejectTeacherSub = async (requestId) => {
    setProcessingTeacherSub(requestId);
    try {
      const apiBase = import.meta.env.VITE_BACKEND_URL || '';
      const res = await fetch(`${apiBase}/api/teacher-subscription-requests/${requestId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Founder-Auth": "true" },
        body: JSON.stringify({ founder_notes: approveFounderNotes || "مرفوض من المؤسس" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success("تم رفض الطلب");
      setViewTeacherSubDetail(null);
      setApproveFounderNotes("");
      refetchTeacherSub();
    } catch (err) {
      toast.error(err.message || "فشل رفض الطلب");
    } finally {
      setProcessingTeacherSub(null);
    }
  };

  // ── Pricing plan save handler ──
  const handleSavePricingPlan = async () => {
    if (!newPlan.plan_name.trim()) {
      toast.error("أدخل اسم الخطة");
      return;
    }
    setPricingLoading(true);
    try {
      const apiBase = import.meta.env.VITE_BACKEND_URL || '';
      const payload = { ...newPlan };
      if (editingPlan) payload.id = editingPlan.id;
      const res = await fetch(`${apiBase}/api/subscription-pricing`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Founder-Auth": "true" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success(editingPlan ? "تم تحديث الخطة" : "تم إنشاء الخطة");
      setShowAddPlan(false);
      setEditingPlan(null);
      setNewPlan({ plan_name: "", plan_name_ar: "", plan_type: "teacher", price_monthly: 0, price_yearly: 0, currency: "EGP", trial_days: 30, features: [] });
      // Refetch pricing
      const freshRes = await fetch(`${apiBase}/api/subscription-pricing`);
      const freshData = await freshRes.json();
      setPricingPlans(freshData);
    } catch (err) {
      toast.error(err.message || "فشل حفظ الخطة");
    } finally {
      setPricingLoading(false);
    }
  };

  // ── Pricing plan delete handler ──
  const handleDeletePricingPlan = async (planId) => {
    try {
      const apiBase = import.meta.env.VITE_BACKEND_URL || '';
      const res = await fetch(`${apiBase}/api/subscription-pricing/${planId}`, {
        method: "DELETE",
        headers: { "X-Founder-Auth": "true" },
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("تم حذف الخطة");
      const freshRes = await fetch(`${apiBase}/api/subscription-pricing`);
      const freshData = await freshRes.json();
      setPricingPlans(freshData);
    } catch (err) {
      toast.error(err.message || "فشل حذف الخطة");
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
      catch (err) { console.error("[FounderDashboard] School.list failed:", err); return []; }
    },
  });

  // ── Registration requests ──
  const { data: requests = [], isLoading: reqLoading } = useQuery({
    queryKey: ["founder-registrations"],
    queryFn: async () => {
      try { return await entities.RegistrationRequest.list("-created_at", 200); }
      catch (err) { console.error("[FounderDashboard] RegistrationRequest.list failed:", err); return []; }
    },
  });

  // ── All approved teachers (from teachers table) ──
  const { data: allTeachers = [], isLoading: teachersLoading } = useQuery({
    queryKey: ["founder-teachers"],
    queryFn: async () => {
      try { return await entities.Teacher.list("-created_at", 1000); }
      catch (err) { console.error("[FounderDashboard] Teacher.list failed:", err); return []; }
    },
  });

  // ── All approved students (from students table) ──
  const { data: allStudents = [], isLoading: studentsLoading } = useQuery({
    queryKey: ["founder-students"],
    queryFn: async () => {
      try { return await entities.Student.list("-created_at", 1000); }
      catch (err) { console.error("[FounderDashboard] Student.list failed:", err); return []; }
    },
  });

  // ── Teacher/Student registration requests (from registration_requests table) ──
  const { data: teacherStudentRequests = [], isLoading: tsReqLoading } = useQuery({
    queryKey: ["founder-teacher-student-regs"],
    queryFn: async () => {
      try {
        const allReqs = await entities.RegistrationRequest.list("-created_at", 500);
        return allReqs.filter(r => r.role_requested === "teacher" || r.role_requested === "student" || r.plan === "student_free" || r.plan === "teacher_free");
      } catch (err) { console.error("[FounderDashboard] teacherStudentRequests failed:", err); return []; }
    },
  });

  // ── Subscription pricing plans ──
  const { data: subscriptionPricing = [], isLoading: pricingFetching } = useQuery({
    queryKey: ["founder-subscription-pricing"],
    queryFn: async () => {
      try {
        const apiBase = import.meta.env.VITE_BACKEND_URL || '';
        const res = await fetch(`${apiBase}/api/subscription-pricing`);
        if (!res.ok) throw new Error('Failed to fetch pricing');
        return await res.json();
      } catch (err) { console.error("[FounderDashboard] pricing fetch failed:", err); return []; }
    },
  });

  // ── Teacher subscription requests ──
  const { data: teacherSubscriptionRequests = [], isLoading: teacherSubFetching, refetch: refetchTeacherSub } = useQuery({
    queryKey: ["founder-teacher-sub-requests"],
    queryFn: async () => {
      try {
        const apiBase = import.meta.env.VITE_BACKEND_URL || '';
        const res = await fetch(`${apiBase}/api/teacher-subscription-requests`);
        if (!res.ok) throw new Error('Failed to fetch teacher subscription requests');
        const json = await res.json();
        return json.requests || json;
      } catch (err) { console.error("[FounderDashboard] teacherSubRequests fetch failed:", err); return []; }
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
    const diff = new Date(s.expires_at).getTime() - Date.now();
    return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
  });

  const last5Requests = [...requests].slice(0, 5);
  const last5Schools = [...schools].slice(0, 5);

  // ── Teacher/Student filtered lists ──
  const filteredTeachers = allTeachers.filter(t => {
    const matchSearch = !teacherSearch || t.full_name?.toLowerCase().includes(teacherSearch.toLowerCase()) || t.email?.toLowerCase().includes(teacherSearch.toLowerCase()) || t.employee_id?.toLowerCase().includes(teacherSearch.toLowerCase());
    const matchStatus = teacherStatusFilter === "all" || t.status === teacherStatusFilter;
    return matchSearch && matchStatus;
  });
  const activeTeachers = allTeachers.filter(t => t.status === "active").length;

  const filteredStudents = allStudents.filter(s => {
    const matchSearch = !studentSearch || s.full_name?.toLowerCase().includes(studentSearch.toLowerCase()) || s.user_email?.toLowerCase().includes(studentSearch.toLowerCase()) || s.student_id?.toLowerCase().includes(studentSearch.toLowerCase()) || s.phone?.includes(studentSearch);
    const matchStatus = studentStatusFilter === "all" || s.status === studentStatusFilter;
    return matchSearch && matchStatus;
  });
  const activeStudents = allStudents.filter(s => s.status === "active").length;

  // ── Pre-computed IIFE replacements (TDZ safety) ──
  const filteredReqs = requests.filter(r => {
    const isStudent = r.role_requested === 'student' || r.plan === 'student_free';
    const isTeacher = r.role_requested === 'teacher' || r.plan === 'teacher_free';
    const isSchool = !isStudent && !isTeacher;
    if (reqFilter === "schools") return isSchool;
    if (reqFilter === "students") return isStudent;
    if (reqFilter === "teachers") return isTeacher;
    return true;
  });

  const chartNow = new Date();
  const chartMonths = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(chartNow.getFullYear(), chartNow.getMonth() - i, 1);
    chartMonths.push({ label: d.toLocaleDateString('ar-EG', { month: 'short' }), key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` });
  }
  const chartMonthlyData = chartMonths.map(m => {
    const activeInMonth = schools.filter(s => {
      if (s.subscription_status !== 'active') return false;
      const start = s.subscription_start_date || s.created_at;
      if (!start) return false;
      const sDate = new Date(start);
      const monthKey = `${sDate.getFullYear()}-${String(sDate.getMonth() + 1).padStart(2, '0')}`;
      return monthKey <= m.key;
    });
    return activeInMonth.reduce((sum, s) => sum + getMonthlyEquivalent(s), 0);
  });
  const chartMaxVal = Math.max(...chartMonthlyData, 1);

  const filteredTeacherSubRequests = teacherSubscriptionRequests.filter(r => {
    if (teacherSubFilter === "all") return true;
    return r.status === teacherSubFilter;
  });

  const detailIsStudent = viewRequestDetail?.role_requested === "student" || viewRequestDetail?.plan === "student_free";
  const detailIsTeacher = viewRequestDetail?.role_requested === "teacher" || viewRequestDetail?.plan === "teacher_free";
  const detailIsSchool = viewRequestDetail && !detailIsStudent && !detailIsTeacher;
  const detailIsOpen = viewRequestDetail && viewRequestDetail.status !== "approved" && viewRequestDetail.status !== "rejected";

  // ── Mutations ──
  const updateSchool = useMutation({
    mutationFn: async ({ id, status }) => entities.School.update(id, { subscription_status: status }),
    onSuccess: () => {
      toast.success("تم تحديث حالة الاشتراك");
      queryClient.invalidateQueries({ queryKey: ["founder-schools"] });
    },
    onError: () => toast.error("تعذر تحديث الحالة"),
  });

  const createSchool = useMutation({
    mutationFn: async (data) => entities.School.create(data),
    onSuccess: () => {
      toast.success("تمت إضافة المدرسة بنجاح");
      queryClient.invalidateQueries({ queryKey: ["founder-schools"] });
    },
    onError: (e) => toast.error(e.message || "فشل إضافة المدرسة"),
  });

  const updateRequest = useMutation({
    mutationFn: async ({ id, status }) => entities.RegistrationRequest.update(id, { status }),
    onSuccess: () => {
      toast.success("تم تحديث الطلب");
      queryClient.invalidateQueries({ queryKey: ["founder-registrations"] });


    },
    onError: () => toast.error("تعذر تحديث الطلب"),
  });

  const deleteRequest = useMutation({
    mutationFn: async (id) => entities.RegistrationRequest.delete(id),
    onSuccess: () => {
      toast.success("تم حذف الطلب");
      setViewRequestDetail(null);
      queryClient.invalidateQueries({ queryKey: ["founder-registrations"] });


    },
    onError: () => toast.error("تعذر حذف الطلب"),
  });

  const deleteSchool = useMutation({
    mutationFn: async (id) => entities.School.delete(id),
    onSuccess: () => {
      toast.success("تم حذف المدرسة بنجاح");
      queryClient.invalidateQueries({ queryKey: ["founder-schools"] });
    },
    onError: (e) => toast.error(e.message || "فشل حذف المدرسة"),
  });

  // ── Teacher management mutations ──
  const updateTeacher = useMutation({
    mutationFn: async ({ id, status }) => entities.Teacher.update(id, { status }),
    onSuccess: () => {
      toast.success("تم تحديث حالة المعلم");
      queryClient.invalidateQueries({ queryKey: ["founder-teachers"] });
    },
    onError: () => toast.error("تعذر تحديث الحالة"),
  });

  const deleteTeacher = useMutation({
    mutationFn: async (id) => entities.Teacher.delete(id),
    onSuccess: () => {
      toast.success("تم حذف المعلم بنجاح");
      queryClient.invalidateQueries({ queryKey: ["founder-teachers"] });
    },
    onError: (e) => toast.error(e.message || "فشل حذف المعلم"),
  });

  // ── Student management mutations ──
  const updateStudent = useMutation({
    mutationFn: async ({ id, status }) => entities.Student.update(id, { status }),
    onSuccess: () => {
      toast.success("تم تحديث حالة الطالب");
      queryClient.invalidateQueries({ queryKey: ["founder-students"] });
    },
    onError: () => toast.error("تعذر تحديث الحالة"),
  });

  const deleteStudent = useMutation({
    mutationFn: async (id) => entities.Student.delete(id),
    onSuccess: () => {
      toast.success("تم حذف الطالب بنجاح");
      queryClient.invalidateQueries({ queryKey: ["founder-students"] });
    },
    onError: (e) => toast.error(e.message || "فشل حذف الطالب"),
  });

  // state للتحقق من حذف مدرسة
  const [confirmDeleteSchool, setConfirmDeleteSchool] = useState(null); // school object
  // state لبيانات حساب المدير المحملة للمدرسة المفتوحة
  const [schoolAdminData, setSchoolAdminData] = useState(null); // { email, password } or null
  const [schoolAdminLoading, setSchoolAdminLoading] = useState(false);

  // جلب بيانات مدير المدرسة عند فتح المودال
  const loadSchoolAdminData = async (school) => {
    setSchoolAdminLoading(true);
    setSchoolAdminData(null);
    try {
      const admins = await entities.SystemAdmin.filter({ school_id: school.id });
      if (admins && admins.length > 0) {
        setSchoolAdminData({ email: admins[0].email, password: admins[0].portal_password || '***مخفية***' });
      } else {
        setSchoolAdminData({ email: school.email || '—', password: 'لم يتم إنشاء حساب بعد' });
      }
    } catch (e) {
      setSchoolAdminData({ email: school.email || '—', password: 'تعذّر جلب البيانات' });
    } finally {
      setSchoolAdminLoading(false);
    }
  };
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

  const generateSchoolSlug = (name) => {
    if (!name) return `school-${Date.now().toString().slice(-4)}`;
    const clean = name
      .toLowerCase()
      .replace(/[^\u0621-\u064Aa-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    return clean || `school-${Date.now().toString().slice(-4)}`;
  };

  // ── قبول الطلب مع إنشاء مدرسة + حساب مدير + بطاقة تسليم
  const acceptRequest = async (r, credentials = {}) => {
    try {
      const schoolName = r.school_name || r.full_name || "مدرسة جديدة";
      const plan = r.plan || r.role_requested || "starter";
      const billingCycle = r.billing_cycle || "monthly";
      const planMap = { admin: "starter", teacher: "starter", student: "starter" };
      const finalPlan = ["starter","professional","enterprise"].includes(plan) ? plan : (planMap[plan] || "starter");
      const schoolEmail = (r.email || "").trim().toLowerCase();
      const adminUsername = (credentials.username || schoolEmail).trim().toLowerCase();
      const directorName = r.director_name || r.full_name || "مدير المدرسة";
      const rawPassword = credentials.password || genPassword(10);
      const schoolSlug = generateSchoolSlug(schoolName);

      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + planDuration(finalPlan, billingCycle));

      // 1) إنشاء المدرسة
      const newSchool = await entities.School.create({
        name: schoolName,
        name_ar: schoolName,
        name_en: schoolName,
        slug: schoolSlug,
        domain_subdomain: schoolSlug,
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
      if (adminUsername) {
        try {
          await entities.SystemAdmin.create({
            full_name: directorName,
            email: adminUsername,
            username: adminUsername,
            password: rawPassword,
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
      if (adminUsername) {
        const origin = window.location.origin;
        const targetSlug = newSchool.slug || schoolSlug || newSchool.id;
        setDelivery({
          school: { id: newSchool.id || newSchool._id, name: schoolName, plan: finalPlan, billing_cycle: billingCycle, email: schoolEmail, director: directorName, phone: r.phone || "", subscription_start_date: startDate.toISOString(), expires_at: endDate.toISOString(), slug: targetSlug },
          adminEmail: adminUsername,
          password: rawPassword,
          loginUrl: `${origin}/gateway/${targetSlug}`,
        });
      }
    } catch (e) {
      toast.error(e.message || "فشل القبول");
    }
  };

  const openSchoolApproval = (request) => {
    setSchoolApproval(request);
    setSchoolUsername((request.email || "").trim().toLowerCase());
    setSchoolPassword(genPassword(10));
  };

  const handleApproveSchool = async () => {
    if (!schoolApproval) return;
    if (!schoolUsername.trim() || !schoolPassword.trim()) {
      toast.error("أدخل اسم المستخدم وكلمة المرور");
      return;
    }
    setApprovingSchool(true);
    try {
      await acceptRequest(schoolApproval, {
        username: schoolUsername.trim(),
        password: schoolPassword.trim(),
      });
      setSchoolApproval(null);
      setSchoolUsername("");
      setSchoolPassword("");
      setViewRequestDetail(null);
    } finally {
      setApprovingSchool(false);
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
        await entities.SystemAdmin.update(admin.id, { password: rawPassword, portal_password: rawPassword, school_id: school.id, status: "active" });
        toast.success("تمت إعادة تعيين كلمة مرور المدير");
      } else {
        await entities.SystemAdmin.create({
          full_name: school.director_name || school.name,
          email,
          username: email,
          password: rawPassword,
          portal_password: rawPassword,
          role: "admin",
          school_id: school.id,
          status: "active",
        });
        toast.success("تم إنشاء حساب المدير");
      }
      const origin = window.location.origin;
      const targetSlug = school.slug || school.domain_subdomain || school.id;
      setDelivery({
        school: { id: school.id, name: school.name, plan: school.plan, billing_cycle: school.billing_cycle || 'monthly', email, director: school.director_name || school.name, phone: school.phone || "", subscription_start_date: school.subscription_start_date, expires_at: school.expires_at, slug: targetSlug },
        adminEmail: email,
        password: rawPassword,
        loginUrl: `${origin}/gateway/${targetSlug}`,
      });
    } catch (e) {
      toast.error(e.message || "فشل إنشاء/تحديث حساب المدير");
    }
  };

  // ── جلب بيانات حساب المعلم ──
  const loadTeacherAccountData = async (teacher) => {
    setTeacherAccountLoading(true);
    setTeacherAccountData(null);
    try {
      setTeacherAccountData({
        email: teacher.email || '—',
        password: teacher.portal_password_plain || '***مخفية***',
        employee_id: teacher.employee_id || '—',
        status: teacher.status || 'active',
      });
    } catch (e) {
      setTeacherAccountData({ email: teacher.email || '—', password: 'تعذّر جلب البيانات' });
    } finally {
      setTeacherAccountLoading(false);
    }
  };

  // ── جلب بيانات حساب الطالب ──
  const loadStudentAccountData = async (student) => {
    setStudentAccountLoading(true);
    setStudentAccountData(null);
    try {
      setStudentAccountData({
        email: student.user_email || '—',
        password: student.portal_password_plain || '***مخفية***',
        student_id: student.student_id || '—',
        status: student.status || 'active',
      });
    } catch (e) {
      setStudentAccountData({ email: student.user_email || '—', password: 'تعذّر جلب البيانات' });
    } finally {
      setStudentAccountLoading(false);
    }
  };

  // ── استخراج بيانات الدخول لطلب مقبول مسبقاً ──
  const showDeliveryForRequest = async (r) => {
    try {
      const schoolEmail = (r.email || '').trim().toLowerCase();
      // ابحث عن المدرسة المقابلة للطلب
      const matchedSchool = schools.find(
        (s) =>
          (schoolEmail && s.email && s.email.toLowerCase() === schoolEmail) ||
          (r.school_name && s.name && s.name.trim() === r.school_name.trim())
      );
      if (!matchedSchool) {
        toast.error('لم يتم العثور على مدرسة مرتبطة بهذا الطلب — تأكد من أن الطلب تم قبوله وإنشاء المدرسة');
        return;
      }
      // جلب بيانات المدير الحالية من قاعدة البيانات
      const apiBase = import.meta.env.VITE_BACKEND_URL || '';
      let existingPassword = '***مخفية***';
      try {
        const admins = await entities.SystemAdmin.filter({ school_id: matchedSchool.id });
        if (admins && admins.length > 0) {
          // كلمة المرور محجوبة بعد التخزين — نعطي خياراً لإعادة التعيين
          existingPassword = admins[0].portal_password || '***';
        }
      } catch (e) {
        console.warn('fetch admin failed', e);
      }
      const origin = window.location.origin;
      const targetSlug = matchedSchool.slug || matchedSchool.domain_subdomain || matchedSchool.id;
      setDelivery({
        school: {
          id: matchedSchool.id,
          name: matchedSchool.name,
          plan: matchedSchool.plan,
          billing_cycle: matchedSchool.billing_cycle || 'monthly',
          email: schoolEmail || matchedSchool.email || '',
          director: matchedSchool.director_name || r.director_name || r.full_name || '',
          phone: matchedSchool.phone || r.phone || '',
          subscription_start_date: matchedSchool.subscription_start_date,
          expires_at: matchedSchool.expires_at,
          slug: targetSlug,
        },
        adminEmail: schoolEmail || matchedSchool.email || '',
        password: existingPassword,
        loginUrl: `${origin}/gateway/${targetSlug}`,
        isRetrieved: true, // علامة: هذه بيانات مسترجعة لا منشأة حديثاً
      });
    } catch (e) {
      toast.error(e.message || 'فشل استرجاع بيانات التسليم');
    }
  };

  // ── Add school dialog state ──
  const [showAdd, setShowAdd] = useState(false);
  const [newSchool, setNewSchool] = useState({ name: "", country: "السودان", plan: "starter", billing_cycle: "monthly", email: "", phone: "", director_name: "" });
  const [viewSchool, setViewSchool] = useState(null);

  // ── Teacher management states ──
  const [viewTeacher, setViewTeacher] = useState(null);
  const [teacherAccountData, setTeacherAccountData] = useState(null);
  const [teacherAccountLoading, setTeacherAccountLoading] = useState(false);
  const [confirmDeleteTeacher, setConfirmDeleteTeacher] = useState(null);

  // ── Student management states ──
  const [viewStudent, setViewStudent] = useState(null);
  const [studentAccountData, setStudentAccountData] = useState(null);
  const [studentAccountLoading, setStudentAccountLoading] = useState(false);
  const [confirmDeleteStudent, setConfirmDeleteStudent] = useState(null);

  // ── Password change ──
  const [pw, setPw] = useState({ cur: "", next: "", confirm: "" });

  // ── Teacher pricing management states ──
  const [pricingPlans, setPricingPlans] = useState([]);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [newPlan, setNewPlan] = useState({
    plan_name: "", plan_name_ar: "", plan_type: "teacher",
    price_monthly: 0, price_yearly: 0, currency: "EGP", trial_days: 30, features: []
  });

  // ── Teacher subscription requests states ──
  const [teacherSubRequests, setTeacherSubRequests] = useState([]);
  const [teacherSubLoading, setTeacherSubLoading] = useState(false);
  const [viewTeacherSubDetail, setViewTeacherSubDetail] = useState(null);
  const [approveTrialDays, setApproveTrialDays] = useState(30);
  const [approveFounderNotes, setApproveFounderNotes] = useState("");
  const [processingTeacherSub, setProcessingTeacherSub] = useState(null);

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
                            <span className={new Date(s.expires_at).getTime() < Date.now() ? 'text-rose-600 font-bold' : new Date(s.expires_at).getTime() - Date.now() < 7*24*60*60*1000 ? 'text-amber-600 font-bold' : 'text-emerald-600'}>
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
                          <a href={`/gateway/${s.slug || s.domain_subdomain || s.id}`} target="_blank" rel="noreferrer" title="فتح بوابة المدرسة" className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-black"><ExternalLink size={12}/> البوابة</a>
                          <button onClick={()=>updateSchool.mutate({id:s.id, status:"active"})} className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100">تفعيل</button>
                          <button onClick={()=>updateSchool.mutate({id:s.id, status:"inactive"})} className="px-2 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold hover:bg-amber-100">تعليق</button>
                          <button onClick={()=>renewSubscription(s)} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"><RefreshCw size={12}/> تجديد</button>
                          <button onClick={()=>createAdminForSchool(s)} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-600 text-white text-xs font-bold hover:bg-violet-700"><KeyRound size={12}/> حساب المدير</button>
                          <button onClick={()=>{ setViewSchool(s); loadSchoolAdminData(s); }} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-blue-700 text-xs font-bold" title="تفاصيل المدرسة"><Eye size={13}/> التفاصيل</button>
                          <button onClick={()=>setConfirmDeleteSchool(s)} className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600" title="حذف المدرسة"><Trash2 size={14}/></button>
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
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={()=>{ setViewSchool(null); setSchoolAdminData(null); }}>
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e=>e.stopPropagation()} dir="rtl">
                  {/* هيدر المودال */}
                  <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-5 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
                        <Building2 size={20} className="text-white"/>
                      </div>
                      <div>
                        <h3 className="font-extrabold text-base">{viewSchool.name}</h3>
                        <p className="text-xs text-slate-300">{viewSchool.country || '—'} • {viewSchool.plan || 'starter'} • {viewSchool.subscription_status}</p>
                      </div>
                    </div>
                    <button onClick={()=>{ setViewSchool(null); setSchoolAdminData(null); }} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10">✕</button>
                  </div>

                  <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                    {/* بيانات البوابة */}
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-700 flex items-center gap-1"><Link2 size={13}/> رابط البوابة الخاص بالمدرسة</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={()=>{ const url=`${window.location.origin}/gateway/${viewSchool.slug||viewSchool.domain_subdomain||viewSchool.id}`; navigator.clipboard.writeText(url); toast.success('تم نسخ رابط البوابة'); }}
                            className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1"
                          ><Copy size={12}/> نسخ</button>
                          <a href={`/gateway/${viewSchool.slug||viewSchool.domain_subdomain||viewSchool.id}`} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1"><ExternalLink size={12}/> فتح</a>
                        </div>
                      </div>
                      <div className="bg-white border border-blue-200 rounded-xl px-3 py-2 font-mono text-sm text-blue-900 font-bold break-all" dir="ltr">
                        {`${window.location.origin}/gateway/${viewSchool.slug||viewSchool.domain_subdomain||viewSchool.id}`}
                      </div>
                    </div>

                    {/* بيانات حساب المدير */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1"><KeyRound size={13}/> بيانات حساب مدير المدرسة</span>
                        {schoolAdminLoading && <span className="text-xs text-slate-400">جاري التحميل...</span>}
                      </div>

                      {schoolAdminData ? (
                        <div className="space-y-2">
                          {/* اسم المستخدم */}
                          <div className="bg-white border border-slate-200 rounded-xl p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-slate-500 flex items-center gap-1"><Mail size={12}/> اسم المستخدم / البريد</span>
                              <button onClick={()=>{ navigator.clipboard.writeText(schoolAdminData.email); toast.success('تم نسخ اسم المستخدم'); }} className="text-xs font-bold text-slate-500 hover:underline inline-flex items-center gap-1"><Copy size={11}/> نسخ</button>
                            </div>
                            <p className="text-sm font-bold font-mono text-slate-900" dir="ltr">{schoolAdminData.email}</p>
                          </div>
                          {/* كلمة المرور */}
                          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-amber-700 flex items-center gap-1"><Lock size={12}/> كلمة المرور</span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={async () => {
                                    const newPw = genPassword(10);
                                    try {
                                      const admins = await entities.SystemAdmin.filter({ school_id: viewSchool.id });
                                      if (admins && admins.length > 0) {
                                        await entities.SystemAdmin.update(admins[0].id, { portal_password: newPw });
                                        setSchoolAdminData(prev => ({ ...prev, password: newPw }));
                                        toast.success('تم إعادة تعيين كلمة المرور — انسخها');
                                      } else {
                                        toast.error('لا يوجد حساب مدير لهذه المدرسة');
                                      }
                                    } catch(e) { toast.error('فشل إعادة التعيين'); }
                                  }}
                                  className="text-xs font-bold text-violet-700 hover:underline inline-flex items-center gap-1"
                                ><RefreshCw size={11}/> إعادة تعيين</button>
                                <button onClick={()=>{ navigator.clipboard.writeText(schoolAdminData.password); toast.success('تم نسخ كلمة المرور'); }} className="text-xs font-bold text-amber-700 hover:underline inline-flex items-center gap-1"><Copy size={11}/> نسخ</button>
                              </div>
                            </div>
                            <p className="text-base font-black font-mono tracking-wider text-amber-900" dir="ltr">{schoolAdminData.password}</p>
                          </div>
                        </div>
                      ) : !schoolAdminLoading ? (
                        <div className="text-center py-3">
                          <p className="text-sm text-slate-400">لا يوجد حساب مدير منشأ لهذه المدرسة</p>
                          <button onClick={()=>createAdminForSchool(viewSchool)} className="mt-2 text-xs font-bold text-violet-600 hover:underline inline-flex items-center gap-1"><KeyRound size={12}/> إنشاء حساب المدير</button>
                        </div>
                      ) : null}
                    </div>

                    {/* بيانات الاشتراك */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 text-sm space-y-2">
                      <p className="text-xs font-bold text-slate-600 mb-2">تفاصيل الاشتراك</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-slate-50 rounded-lg p-2"><p className="text-slate-400">المدير</p><p className="font-bold text-slate-800">{viewSchool.director_name || '—'}</p></div>
                        <div className="bg-slate-50 rounded-lg p-2"><p className="text-slate-400">الهاتف</p><p className="font-bold text-slate-800">{viewSchool.phone || '—'}</p></div>
                        <div className="bg-slate-50 rounded-lg p-2"><p className="text-slate-400">بدء الاشتراك</p><p className="font-bold text-slate-800">{viewSchool.subscription_start_date ? new Date(viewSchool.subscription_start_date).toLocaleDateString('ar-EG') : '—'}</p></div>
                        <div className="bg-slate-50 rounded-lg p-2"><p className="text-slate-400">انتهاء الاشتراك</p><p className={`font-bold ${viewSchool.expires_at && new Date(viewSchool.expires_at).getTime() < Date.now() ? 'text-rose-600' : 'text-emerald-700'}`}>{viewSchool.expires_at ? new Date(viewSchool.expires_at).toLocaleDateString('ar-EG') : '—'}</p></div>
                        <div className="bg-slate-50 rounded-lg p-2"><p className="text-slate-400">الدورة</p><p className="font-bold text-slate-800">{viewSchool.billing_cycle === 'yearly' ? 'سنوي' : 'شهري'}</p></div>
                        <div className="bg-slate-50 rounded-lg p-2"><p className="text-slate-400">الخطة</p><p className="font-bold text-slate-800">{viewSchool.plan || 'starter'}</p></div>
                      </div>
                    </div>
                  </div>

                  {/* أزرار المودال */}
                  <div className="p-4 border-t border-slate-100 flex gap-2">
                    <button
                      onClick={() => renewSubscription(viewSchool)}
                      className="flex-1 h-10 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 inline-flex items-center justify-center gap-1.5"
                    ><RefreshCw size={13}/> تجديد</button>
                    <button
                      onClick={() => { setConfirmDeleteSchool(viewSchool); setViewSchool(null); setSchoolAdminData(null); }}
                      className="h-10 px-4 rounded-xl bg-rose-50 text-rose-700 font-bold text-sm hover:bg-rose-100 inline-flex items-center justify-center gap-1.5"
                    ><Trash2 size={13}/> حذف</button>
                    <button
                      onClick={() => { setViewSchool(null); setSchoolAdminData(null); }}
                      className="flex-1 h-10 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-black"
                    >إغلاق</button>
                  </div>
                </div>
              </div>
            )}
            {/* تأكيد حذف المدرسة */}
            {confirmDeleteSchool && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[55] p-4" onClick={()=>setConfirmDeleteSchool(null)}>
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e=>e.stopPropagation()} dir="rtl">
                  <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center mx-auto mb-4">
                    <Trash2 size={22} className="text-rose-600"/>
                  </div>
                  <h3 className="text-center font-extrabold text-lg text-slate-900">تأكيد حذف المدرسة</h3>
                  <p className="text-center text-sm text-slate-500 mt-1 mb-4">
                    سيتم حذف مدرسة <b className="text-slate-900">{confirmDeleteSchool.name}</b> بشكل نهائي. هذا الإجراء لا يمكن التراجع عنه.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        await deleteSchool.mutateAsync(confirmDeleteSchool.id);
                        setConfirmDeleteSchool(null);
                      }}
                      disabled={deleteSchool.isPending}
                      className="flex-1 h-11 rounded-xl bg-rose-600 text-white font-bold text-sm hover:bg-rose-700 disabled:opacity-50 inline-flex items-center justify-center gap-2"
                    >
                      {deleteSchool.isPending ? 'جاري الحذف...' : <><Trash2 size={14}/> تأكيد الحذف</>}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteSchool(null)}
                      className="flex-1 h-11 rounded-xl bg-slate-100 font-bold text-sm hover:bg-slate-200"
                    >إلغاء</button>
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
          <div className="space-y-4">
            {/* Filter Sub-Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setReqFilter("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${reqFilter === "all" ? "bg-slate-900 text-white shadow" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                >
                  جميع الطلبات ({requests.length})
                </button>
                <button
                  onClick={() => setReqFilter("schools")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${reqFilter === "schools" ? "bg-blue-600 text-white shadow" : "bg-blue-50 text-blue-700 hover:bg-blue-100"}`}
                >
                  <Building2 size={13}/> طلبات المدارس ({requests.filter(r => r.role_requested !== 'student' && r.role_requested !== 'teacher' && r.plan !== 'student_free' && r.plan !== 'teacher_free').length})
                </button>
                <button
                  onClick={() => setReqFilter("students")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${reqFilter === "students" ? "bg-emerald-600 text-white shadow" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}`}
                >
                  <Users size={13}/> طلبات الطلاب ({requests.filter(r => r.role_requested === 'student' || r.plan === 'student_free').length})
                </button>
                <button
                  onClick={() => setReqFilter("teachers")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${reqFilter === "teachers" ? "bg-indigo-600 text-white shadow" : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"}`}
                >
                  <GraduationCap size={13}/> طلبات المعلمين ({requests.filter(r => r.role_requested === 'teacher' || r.plan === 'teacher_free').length})
                </button>
              </div>
              <button
                onClick={() => {
                  queryClient.invalidateQueries({ queryKey: ["founder-registrations"] });
            

                  toast.success("تم تحديث قائمة الطلبات");
                }}
                className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
              >
                <RefreshCw size={12}/> تحديث
              </button>
            </div>

            {/* Requests Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {reqLoading ? (
                <p className="p-8 text-slate-500 text-center">جاري التحميل...</p>
              ) : filteredReqs.length === 0 ? (
                <div className="p-12 text-center">
                  <FileText size={40} className="text-slate-200 mx-auto mb-3"/>
                  <p className="text-slate-600 font-bold">لا توجد طلبات في هذا القسم حالياً</p>
                  <p className="text-xs text-slate-400 mt-1">تظهر هنا الطلبات فور إرسالها من صفحة الهبوط أو صفحات التسجيل</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-slate-500">
                        <tr>
                          <th className="text-right p-4 font-semibold">مقدم الطلب</th>
                          <th className="text-right p-4 font-semibold">النوع / الخطة</th>
                          <th className="text-right p-4 font-semibold">البريد / الهاتف</th>
                          <th className="text-right p-4 font-semibold">المدينة / المدرسة</th>
                          <th className="text-right p-4 font-semibold">التاريخ</th>
                          <th className="text-right p-4 font-semibold">الحالة</th>
                          <th className="text-right p-4 font-semibold">إجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredReqs.map((r) => {
                          const isStudent = r.role_requested === "student" || r.plan === "student_free";
                          const isTeacher = r.role_requested === "teacher" || r.plan === "teacher_free";
                          const isSchool = !isStudent && !isTeacher;

                          return (
                            <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                              <td className="p-4">
                                <p className="font-bold text-slate-900">{r.full_name || r.school_name || r.student_name || "-"}</p>
                                {isStudent && r.director_name && <p className="text-xs text-slate-500">ولي الأمر: {r.director_name}</p>}
                                {isSchool && r.director_name && <p className="text-xs text-slate-500">المسؤول: {r.director_name}</p>}
                                {r.grade && <span className="inline-block mt-1 text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded">الصف: {r.grade}</span>}
                              </td>
                              <td className="p-4">
                                {isStudent && <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">طالب مستقل</span>}
                                {isTeacher && <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">معلم مستقل</span>}
                                {isSchool && <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">مدرسة ({r.plan || "starter"})</span>}
                              </td>
                              <td className="p-4 text-slate-600">
                                <p className="text-xs font-mono" dir="ltr">{r.email || "-"}</p>
                                <p className="text-xs font-mono text-slate-500 mt-0.5 flex items-center gap-1" dir="ltr"><Phone size={11}/>{r.phone || "-"}</p>
                              </td>
                              <td className="p-4 text-slate-600">
                                <p className="text-xs font-medium">{r.school_name || "-"}</p>
                                <p className="text-[11px] text-slate-400">{r.country || "السودان"}</p>
                              </td>
                              <td className="p-4 text-xs text-slate-400">
                                {r.created_at ? new Date(r.created_at).toLocaleDateString('ar-EG') : "-"}
                              </td>
                              <td className="p-4">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${r.status === "approved" ? "bg-emerald-100 text-emerald-700" : r.status === "rejected" ? "bg-rose-100 text-rose-700" : r.status==="on_hold" ? "bg-amber-100 text-amber-700" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                                  {r.status === "approved" ? "مقبول ✓" : r.status === "rejected" ? "مرفوض ✕" : r.status==="on_hold" ? "معلق ⏸" : "قيد الانتظار ⏳"}
                                </span>
                              </td>
                              <td className="p-4">
                                <div className="flex gap-1.5 flex-wrap items-center">
                                  <button
                                    onClick={() => setViewRequestDetail(r)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                                    title="عرض كل التفاصيل"
                                  >
                                    <Eye size={13}/> التفاصيل
                                  </button>

                                  {r.status !== "approved" && r.status !== "rejected" ? (
                                    <>
                                      <button
                                        onClick={() => {
                                          if (isStudent) {
                                            setStudentApproval({ requestId: r.id, fullName: r.full_name || r.student_name, email: r.email, data: r });
                                            setStudentUsername(r.email ? r.email.split('@')[0] : `student_${Date.now().toString().slice(-4)}`);
                                            setStudentPassword(genPassword(8));
                                          } else if (isTeacher) {
                                            setTeacherApproval({ requestId: r.id, fullName: r.full_name, email: r.email, data: r });
                                            setTeacherUsername(r.email ? r.email.split('@')[0] : `teacher_${Date.now().toString().slice(-4)}`);
                                            setTeacherPassword(genPassword(8));
                                          } else {
                                            openSchoolApproval(r);
                                          }
                                        }}
                                        className="flex items-center gap-1 bg-emerald-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-700 shadow-sm"
                                      >
                                        <CheckCircle2 size={13}/> قبول
                                      </button>
                                      <button
                                        onClick={async () => {
                                          await entities.RegistrationRequest.update(r.id, { status: "rejected" });
                                          toast.success("تم رفض الطلب");
                                          queryClient.invalidateQueries({ queryKey: ["founder-registrations"] });
                                    

                                        }}
                                        className="flex items-center gap-1 bg-rose-50 text-rose-700 px-2 py-1.5 rounded-lg text-xs font-bold hover:bg-rose-100"
                                      >
                                        <XCircle size={13}/> رفض
                                      </button>
                                      <button
                                        onClick={async () => {
                                          await entities.RegistrationRequest.update(r.id, { status: "on_hold" });
                                          toast.success("تم تعليق الطلب");
                                          queryClient.invalidateQueries({ queryKey: ["founder-registrations"] });
                                    

                                        }}
                                        className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1.5 rounded-lg text-xs font-bold hover:bg-amber-100"
                                      >
                                        <PauseCircle size={13}/> تعليق
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      {/* زر استخراج بيانات الدخول للطلبات المقبولة */}
                                      {r.status === 'approved' && (
                                        <button
                                          onClick={() => {
                                            if (isStudent || isTeacher) {
                                              const name = r.full_name || r.student_name || '—';
                                              const generatedUsername = r.username_generated || r.email || '—';
                                              const portalUrl = isTeacher
                                                ? `${window.location.origin}/independent-teacher-login`
                                                : `${window.location.origin}/student-login`;
                                              const modalHtml = `
                                                <div style="direction:rtl;text-align:right;font-family:sans-serif;padding:20px;">
                                                  <h3 style="margin:0 0 12px;color:#7c3aed;">بيانات دخول ${isTeacher ? 'المعلم' : 'الطالب'}</h3>
                                                  <p style="margin:0 0 6px;"><b>الاسم:</b> ${name}</p>
                                                  <p style="margin:0 0 6px;"><b>اسم المستخدم:</b> <code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;">${generatedUsername}</code></p>
                                                  <p style="margin:0 0 6px;"><b>كلمة المرور:</b> <code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;direction:ltr;display:inline-block;">${r.password_generated || 'تم تعيينها أثناء الموافقة'}</code></p>
                                                  <p style="margin:12px 0 0;"><b>رابط الدخول:</b> <a href="${portalUrl}" target="_blank" style="color:#7c3aed;">${portalUrl}</a></p>
                                                </div>`;
                                              const w = window.open('', '_blank', 'width=500,height=350');
                                              w.document.write(`<html><head><title>بيانات الدخول</title></head><body>${modalHtml}</body></html>`);
                                              w.document.close();
                                            } else {
                                              showDeliveryForRequest(r);
                                            }
                                          }}
                                          className="flex items-center gap-1 bg-violet-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold hover:bg-violet-700 shadow-sm"
                                          title="استخراج بيانات الدخول"
                                        >
                                          <KeyRound size={13}/> بيانات الدخول
                                        </button>
                                      )}
                                      {(r.status === 'rejected' || r.status === 'on_hold') && (
                                        <span className="text-xs text-slate-400 font-medium">تمت المعالجة</span>
                                      )}
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
              )}
              <div className="p-3 text-xs text-slate-500 bg-slate-50 border-t flex items-center justify-between">
                <span>يتم تحديث الطلبات تلقائياً فور تسجيل الطالب أو المعلم أو المدرسة من صفحات التسجيل العامة.</span>
              </div>
            </div>
          </div>
        )}

        {/* ───── 4️⃣ إدارة المعلمين ───── */}
        {section === "teachers" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-3">
                <p className="text-sm text-slate-500">إجمالي {allTeachers.length} معلم — <span className="font-bold text-emerald-600">{activeTeachers} نشط</span></p>
                <select value={teacherStatusFilter} onChange={(e)=>setTeacherStatusFilter(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold">
                  <option value="all">الكل</option>
                  <option value="active">نشط</option>
                  <option value="suspended">معلق</option>
                  <option value="expired">منتهي</option>
                </select>
              </div>
              <input value={teacherSearch} onChange={(e)=>setTeacherSearch(e.target.value)} placeholder="بحث بالاسم أو البريد أو الرقم الوظيفي..." className="w-full sm:w-64 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"/>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {teachersLoading ? <p className="p-6 text-slate-500">جاري التحميل...</p> : filteredTeachers.length === 0 ? (
                <div className="p-12 text-center">
                  <GraduationCap size={40} className="text-slate-200 mx-auto mb-3"/>
                  <p className="text-slate-500 font-bold">{allTeachers.length === 0 ? "لا يوجد معلمين مسجلين بعد" : "لا توجد نتائج مطابقة للبحث"}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="text-right p-4 font-semibold">اسم المعلم</th>
                      <th className="text-right p-4 font-semibold">الرقم الوظيفي</th>
                      <th className="text-right p-4 font-semibold">البريد</th>
                      <th className="text-right p-4 font-semibold">الهاتف</th>
                      <th className="text-right p-4 font-semibold">المواد</th>
                      <th className="text-right p-4 font-semibold">الخبرة</th>
                      <th className="text-right p-4 font-semibold">تاريخ الانضمام</th>
                      <th className="text-right p-4 font-semibold">الحالة</th>
                      <th className="text-right p-4 font-semibold">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTeachers.map((t) => (
                      <tr key={t.id} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="p-4">
                          <p className="font-bold text-slate-900">{t.full_name || "-"}</p>
                          {t.bio && <p className="text-xs text-slate-400 max-w-[180px] truncate" title={t.bio}>{t.bio}</p>}
                        </td>
                        <td className="p-4 text-slate-500">{t.employee_id || "—"}</td>
                        <td className="p-4 text-slate-500" dir="ltr">{t.email || "—"}</td>
                        <td className="p-4 text-slate-600" dir="ltr">{t.phone || "—"}</td>
                        <td className="p-4 text-slate-600">{t.subjects || "—"}</td>
                        <td className="p-4 text-slate-500">{t.experience_years ? `${t.experience_years} سنة` : "—"}</td>
                        <td className="p-4 text-slate-500">{t.created_at ? new Date(t.created_at).toLocaleDateString('ar-EG') : "—"}</td>
                        <td className="p-4">
                          <select value={t.status || "active"} onChange={(e)=>updateTeacher.mutate({id:t.id, status:e.target.value})} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold">
                            <option value="active">نشط</option>
                            <option value="suspended">معلق</option>
                            <option value="expired">منتهي</option>
                          </select>
                        </td>
                        <td className="p-4 flex gap-1 flex-wrap">
                          <button onClick={()=>{ setViewTeacher(t); loadTeacherAccountData(t); }} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-600 text-white text-xs font-bold hover:bg-violet-700"><KeyRound size={12}/> حساب المعلم</button>
                          <button onClick={()=>updateTeacher.mutate({id:t.id, status:"active"})} className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100">تفعيل</button>
                          <button onClick={()=>updateTeacher.mutate({id:t.id, status:"suspended"})} className="px-2 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold hover:bg-amber-100">تعليق</button>
                          <button onClick={()=>setViewTeacher(t)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-blue-700 text-xs font-bold" title="تفاصيل المعلم"><Eye size={13}/> التفاصيل</button>
                          <button onClick={()=>setConfirmDeleteTeacher(t)} className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600" title="حذف المعلم"><Trash2 size={14}/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
            </div>

            {/* Teacher account modal */}
            {viewTeacher && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={()=>{ setViewTeacher(null); setTeacherAccountData(null); }}>
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e=>e.stopPropagation()} dir="rtl">
                  <div className="bg-gradient-to-br from-violet-600 to-indigo-700 p-5 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center"><GraduationCap size={20}/></div>
                      <div>
                        <h3 className="font-extrabold text-base">{viewTeacher.full_name}</h3>
                        <p className="text-xs text-violet-200">{viewTeacher.employee_id || "—"} • {viewTeacher.email || "—"}</p>
                      </div>
                    </div>
                    <button onClick={()=>{ setViewTeacher(null); setTeacherAccountData(null); }} className="text-violet-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10">✕</button>
                  </div>
                  <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1"><KeyRound size={13}/> بيانات حساب المعلم</span>
                        {teacherAccountLoading && <span className="text-xs text-slate-400">جاري التحميل...</span>}
                      </div>
                      {teacherAccountData && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-3 py-2">
                            <span className="text-xs text-slate-500">البريد / اسم المستخدم</span>
                            <span className="font-bold text-sm text-slate-900" dir="ltr">{teacherAccountData.email}</span>
                          </div>
                          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-3 py-2">
                            <span className="text-xs text-slate-500">كلمة المرور</span>
                            <span className="font-mono font-bold text-sm text-slate-900">{teacherAccountData.password}</span>
                          </div>
                          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-3 py-2">
                            <span className="text-xs text-slate-500">الحالة</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${viewTeacher.status==='active'?'bg-emerald-100 text-emerald-700':viewTeacher.status==='suspended'?'bg-amber-100 text-amber-700':'bg-rose-100 text-rose-700'}`}>{viewTeacher.status==='active'?'نشط':viewTeacher.status==='suspended'?'معلق':'منتهي'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 space-y-2">
                      <span className="text-xs font-bold text-blue-700 flex items-center gap-1"><UserPlus size={13}/> بيانات شخصية</span>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-white rounded-xl px-3 py-2"><span className="text-slate-400">المواد:</span> <span className="font-bold">{viewTeacher.subjects || "—"}</span></div>
                        <div className="bg-white rounded-xl px-3 py-2"><span className="text-slate-400">الخبرة:</span> <span className="font-bold">{viewTeacher.experience_years ? `${viewTeacher.experience_years} سنة` : "—"}</span></div>
                        <div className="bg-white rounded-xl px-3 py-2"><span className="text-slate-400">الهاتف:</span> <span className="font-bold" dir="ltr">{viewTeacher.phone || "—"}</span></div>
                        <div className="bg-white rounded-xl px-3 py-2"><span className="text-slate-400">تاريخ الانضمام:</span> <span className="font-bold">{viewTeacher.created_at ? new Date(viewTeacher.created_at).toLocaleDateString('ar-EG') : "—"}</span></div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={()=>updateTeacher.mutate({id:viewTeacher.id, status:viewTeacher.status==='active'?'suspended':'active'})} className={`flex-1 h-11 rounded-xl font-bold text-sm ${viewTeacher.status==='active'?'bg-amber-50 text-amber-700 hover:bg-amber-100':'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>{viewTeacher.status==='active'?'تعليق':'تفعيل'}</button>
                      <button onClick={()=>{ setConfirmDeleteTeacher(viewTeacher); setViewTeacher(null); }} className="flex-1 h-11 rounded-xl bg-rose-50 text-rose-700 font-bold text-sm hover:bg-rose-100">حذف المعلم</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Delete teacher confirmation */}
            {confirmDeleteTeacher && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={()=>setConfirmDeleteTeacher(null)}>
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 text-center" onClick={e=>e.stopPropagation()} dir="rtl">
                  <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4"><Trash2 size={24} className="text-rose-600"/></div>
                  <h3 className="font-extrabold text-lg text-slate-900 mb-2">تأكيد حذف المعلم</h3>
                  <p className="text-sm text-slate-500 mb-5">هل أنت متأكد من حذف <strong>{confirmDeleteTeacher.full_name}</strong>؟ لا يمكن التراجع عن هذا الإجراء.</p>
                  <div className="flex gap-2">
                    <button onClick={()=>setConfirmDeleteTeacher(null)} className="flex-1 h-11 rounded-xl bg-slate-100 font-bold text-sm hover:bg-slate-200">إلغاء</button>
                    <button onClick={()=>{ deleteTeacher.mutate(confirmDeleteTeacher.id); setConfirmDeleteTeacher(null); }} className="flex-1 h-11 rounded-xl bg-rose-600 text-white font-bold text-sm hover:bg-rose-700">حذف</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ───── 5️⃣ إدارة الطلاب ───── */}
        {section === "students" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-3">
                <p className="text-sm text-slate-500">إجمالي {allStudents.length} طالب — <span className="font-bold text-emerald-600">{activeStudents} نشط</span></p>
                <select value={studentStatusFilter} onChange={(e)=>setStudentStatusFilter(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold">
                  <option value="all">الكل</option>
                  <option value="active">نشط</option>
                  <option value="suspended">معلق</option>
                  <option value="expired">منتهي</option>
                </select>
              </div>
              <input value={studentSearch} onChange={(e)=>setStudentSearch(e.target.value)} placeholder="بحث بالاسم أو البريد أو الرقم أو الهاتف..." className="w-full sm:w-64 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"/>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {studentsLoading ? <p className="p-6 text-slate-500">جاري التحميل...</p> : filteredStudents.length === 0 ? (
                <div className="p-12 text-center">
                  <Users size={40} className="text-slate-200 mx-auto mb-3"/>
                  <p className="text-slate-500 font-bold">{allStudents.length === 0 ? "لا يوجد طلاب مسجلين بعد" : "لا توجد نتائج مطابقة للبحث"}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="text-right p-4 font-semibold">اسم الطالب</th>
                      <th className="text-right p-4 font-semibold">الرقم الطلابي</th>
                      <th className="text-right p-4 font-semibold">البريد</th>
                      <th className="text-right p-4 font-semibold">الهاتف</th>
                      <th className="text-right p-4 font-semibold">الصف</th>
                      <th className="text-right p-4 font-semibold">ولي الأمر</th>
                      <th className="text-right p-4 font-semibold">المدرسة / المدينة</th>
                      <th className="text-right p-4 font-semibold">تاريخ الانضمام</th>
                      <th className="text-right p-4 font-semibold">الحالة</th>
                      <th className="text-right p-4 font-semibold">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((s) => (
                      <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="p-4">
                          <p className="font-bold text-slate-900">{s.full_name || "-"}</p>
                        </td>
                        <td className="p-4 text-slate-500">{s.student_id || "—"}</td>
                        <td className="p-4 text-slate-500" dir="ltr">{s.user_email || "—"}</td>
                        <td className="p-4 text-slate-600" dir="ltr">{s.phone || "—"}</td>
                        <td className="p-4"><span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">{s.grade || "—"}</span></td>
                        <td className="p-4 text-slate-600">
                          <p>{s.parent_name || "—"}</p>
                          {s.parent_phone && <p className="text-xs text-slate-400" dir="ltr">{s.parent_phone}</p>}
                        </td>
                        <td className="p-4 text-slate-600">
                          <p>{s.school_name || "—"}</p>
                          {s.city && <p className="text-xs text-slate-400">{s.city}</p>}
                        </td>
                        <td className="p-4 text-slate-500">{s.created_at ? new Date(s.created_at).toLocaleDateString('ar-EG') : "—"}</td>
                        <td className="p-4">
                          <select value={s.status || "active"} onChange={(e)=>updateStudent.mutate({id:s.id, status:e.target.value})} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold">
                            <option value="active">نشط</option>
                            <option value="suspended">معلق</option>
                            <option value="expired">منتهي</option>
                          </select>
                        </td>
                        <td className="p-4 flex gap-1 flex-wrap">
                          <button onClick={()=>{ setViewStudent(s); loadStudentAccountData(s); }} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-600 text-white text-xs font-bold hover:bg-violet-700"><KeyRound size={12}/> حساب الطالب</button>
                          <button onClick={()=>updateStudent.mutate({id:s.id, status:"active"})} className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100">تفعيل</button>
                          <button onClick={()=>updateStudent.mutate({id:s.id, status:"suspended"})} className="px-2 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold hover:bg-amber-100">تعليق</button>
                          <button onClick={()=>setViewStudent(s)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-blue-700 text-xs font-bold" title="تفاصيل الطالب"><Eye size={13}/> التفاصيل</button>
                          <button onClick={()=>setConfirmDeleteStudent(s)} className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600" title="حذف الطالب"><Trash2 size={14}/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
            </div>

            {/* Student account modal */}
            {viewStudent && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={()=>{ setViewStudent(null); setStudentAccountData(null); }}>
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e=>e.stopPropagation()} dir="rtl">
                  <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-5 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center"><Users size={20}/></div>
                      <div>
                        <h3 className="font-extrabold text-base">{viewStudent.full_name}</h3>
                        <p className="text-xs text-emerald-200">{viewStudent.student_id || "—"} • {viewStudent.user_email || "—"}</p>
                      </div>
                    </div>
                    <button onClick={()=>{ setViewStudent(null); setStudentAccountData(null); }} className="text-emerald-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10">✕</button>
                  </div>
                  <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1"><KeyRound size={13}/> بيانات حساب الطالب</span>
                        {studentAccountLoading && <span className="text-xs text-slate-400">جاري التحميل...</span>}
                      </div>
                      {studentAccountData && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-3 py-2">
                            <span className="text-xs text-slate-500">البريد / اسم المستخدم</span>
                            <span className="font-bold text-sm text-slate-900" dir="ltr">{studentAccountData.email}</span>
                          </div>
                          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-3 py-2">
                            <span className="text-xs text-slate-500">كلمة المرور</span>
                            <span className="font-mono font-bold text-sm text-slate-900">{studentAccountData.password}</span>
                          </div>
                          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-3 py-2">
                            <span className="text-xs text-slate-500">الحالة</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${viewStudent.status==='active'?'bg-emerald-100 text-emerald-700':viewStudent.status==='suspended'?'bg-amber-100 text-amber-700':'bg-rose-100 text-rose-700'}`}>{viewStudent.status==='active'?'نشط':viewStudent.status==='suspended'?'معلق':'منتهي'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 space-y-2">
                      <span className="text-xs font-bold text-blue-700 flex items-center gap-1"><GraduationCap size={13}/> بيانات الطالب</span>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-white rounded-xl px-3 py-2"><span className="text-slate-400">الصف:</span> <span className="font-bold">{viewStudent.grade || "—"}</span></div>
                        <div className="bg-white rounded-xl px-3 py-2"><span className="text-slate-400">الهاتف:</span> <span className="font-bold" dir="ltr">{viewStudent.phone || "—"}</span></div>
                        <div className="bg-white rounded-xl px-3 py-2"><span className="text-slate-400">المدرسة:</span> <span className="font-bold">{viewStudent.school_name || "—"}</span></div>
                        <div className="bg-white rounded-xl px-3 py-2"><span className="text-slate-400">المدينة:</span> <span className="font-bold">{viewStudent.city || "—"}</span></div>
                        <div className="bg-white rounded-xl px-3 py-2"><span className="text-slate-400">ولي الأمر:</span> <span className="font-bold">{viewStudent.parent_name || "—"}</span></div>
                        <div className="bg-white rounded-xl px-3 py-2"><span className="text-slate-400">هاتف ولي الأمر:</span> <span className="font-bold" dir="ltr">{viewStudent.parent_phone || "—"}</span></div>
                        <div className="bg-white rounded-xl px-3 py-2"><span className="text-slate-400">تاريخ الانضمام:</span> <span className="font-bold">{viewStudent.created_at ? new Date(viewStudent.created_at).toLocaleDateString('ar-EG') : "—"}</span></div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={()=>updateStudent.mutate({id:viewStudent.id, status:viewStudent.status==='active'?'suspended':'active'})} className={`flex-1 h-11 rounded-xl font-bold text-sm ${viewStudent.status==='active'?'bg-amber-50 text-amber-700 hover:bg-amber-100':'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>{viewStudent.status==='active'?'تعليق':'تفعيل'}</button>
                      <button onClick={()=>{ setConfirmDeleteStudent(viewStudent); setViewStudent(null); }} className="flex-1 h-11 rounded-xl bg-rose-50 text-rose-700 font-bold text-sm hover:bg-rose-100">حذف الطالب</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Delete student confirmation */}
            {confirmDeleteStudent && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={()=>setConfirmDeleteStudent(null)}>
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 text-center" onClick={e=>e.stopPropagation()} dir="rtl">
                  <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4"><Trash2 size={24} className="text-rose-600"/></div>
                  <h3 className="font-extrabold text-lg text-slate-900 mb-2">تأكيد حذف الطالب</h3>
                  <p className="text-sm text-slate-500 mb-5">هل أنت متأكد من حذف <strong>{confirmDeleteStudent.full_name}</strong>؟ لا يمكن التراجع عن هذا الإجراء.</p>
                  <div className="flex gap-2">
                    <button onClick={()=>setConfirmDeleteStudent(null)} className="flex-1 h-11 rounded-xl bg-slate-100 font-bold text-sm hover:bg-slate-200">إلغاء</button>
                    <button onClick={()=>{ deleteStudent.mutate(confirmDeleteStudent.id); setConfirmDeleteStudent(null); }} className="flex-1 h-11 rounded-xl bg-rose-600 text-white font-bold text-sm hover:bg-rose-700">حذف</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ───── 6️⃣ الاشتراكات والإيرادات ───── */}
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
                  {chartMonthlyData.map((v, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full bg-gradient-to-t from-blue-500 to-violet-400 rounded-t-lg" style={{ height: `${(v / chartMaxVal) * 100}%` }}></div>
                      <span className="text-[10px] text-slate-400">{chartMonths[i].label}</span>
                      {v > 0 && <span className="text-[9px] font-bold text-slate-600">${v}</span>}
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

        {/* ───── 6.1️⃣ أسعار المعلمين ───── */}
        {section === "teacher-pricing" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-900">إدارة أسعار اشتراكات المعلمين</h3>
              <button onClick={() => { setShowAddPlan(true); setEditingPlan(null); setNewPlan({ plan_name: "", plan_name_ar: "", plan_type: "teacher", price_monthly: 0, price_yearly: 0, currency: "EGP", trial_days: 30, features: [] }); }} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition-all">
                <Plus size={16} /> إضافة خطة جديدة
              </button>
            </div>

            {/* Pricing Plans Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-right p-4 text-sm font-bold text-slate-700">الخطة</th>
                    <th className="text-center p-4 text-sm font-bold text-slate-700">النوع</th>
                    <th className="text-center p-4 text-sm font-bold text-slate-700">السعر الشهري (EGP)</th>
                    <th className="text-center p-4 text-sm font-bold text-slate-700">السعر السنوي (EGP)</th>
                    <th className="text-center p-4 text-sm font-bold text-slate-700">أيام التجربة</th>
                    <th className="text-center p-4 text-sm font-bold text-slate-700">الحالة</th>
                    <th className="text-center p-4 text-sm font-bold text-slate-700">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptionPricing.length === 0 ? (
                    <tr><td colSpan="7" className="p-8 text-center text-slate-400">لا توجد خطط أسعار بعد</td></tr>
                  ) : subscriptionPricing.map(plan => (
                    <tr key={plan.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-4">
                        <div className="font-bold text-sm text-slate-900">{plan.plan_name_ar || plan.plan_name}</div>
                        <div className="text-xs text-slate-400">{plan.plan_name}</div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">{plan.plan_type === 'teacher' ? 'معلم' : 'طالب'}</span>
                      </td>
                      <td className="p-4 text-center font-bold text-slate-900">{plan.price_monthly ? Number(plan.price_monthly).toLocaleString('ar-EG') : "—"}</td>
                      <td className="p-4 text-center font-bold text-slate-900">{plan.price_yearly ? Number(plan.price_yearly).toLocaleString('ar-EG') : "—"}</td>
                      <td className="p-4 text-center text-sm text-slate-600">{plan.trial_days || 30} يوم</td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${plan.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {plan.is_active ? 'نشطة' : 'غير نشطة'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => { setEditingPlan(plan); setNewPlan({ plan_name: plan.plan_name, plan_name_ar: plan.plan_name_ar || "", plan_type: plan.plan_type || "teacher", price_monthly: plan.price_monthly || 0, price_yearly: plan.price_yearly || 0, currency: plan.currency || "EGP", trial_days: plan.trial_days || 30, features: plan.features || [] }); setShowAddPlan(true); }} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg" title="تعديل">
                            <KeyRound size={14} />
                          </button>
                          <button onClick={() => { if(window.confirm("هل أنت متأكد من حذف هذه الخطة؟")) handleDeletePricingPlan(plan.id); }} className="text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg" title="حذف">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Default plans quick view */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center gap-2 mb-3"><Calendar size={20} /><h4 className="font-bold text-lg">الخطة الشهرية</h4></div>
                <p className="text-3xl font-extrabold mb-2">49,000 <span className="text-sm font-normal opacity-80">EGP/شهر</span></p>
                <p className="text-xs opacity-90">اشتراك شهري لمعلم واحد مع 30 يوم تجربة مجانية</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg relative">
                <span className="absolute top-4 left-4 bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full">خصم 41%</span>
                <div className="flex items-center gap-2 mb-3"><Crown size={20} /><h4 className="font-bold text-lg">الخطة السنوية</h4></div>
                <p className="text-3xl font-extrabold mb-2">350,000 <span className="text-sm font-normal opacity-80">EGP/سنة</span></p>
                <p className="text-xs opacity-90">اشتراك سنوي مع 30 يوم تجربة مجانية وخصم كبير</p>
              </div>
            </div>
          </div>
        )}

        {/* ───── 6.2️⃣ طلبات اشتراكات المعلمين ───── */}
        {section === "teacher-sub-requests" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-900">طلبات اشتراكات المعلمين</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => refetchTeacherSub()} className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-slate-200 transition-all">
                  <RefreshCw size={13} /> تحديث
                </button>
              </div>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { id: "all", label: "الكل", count: teacherSubscriptionRequests.length },
                { id: "pending", label: "قيد المراجعة", count: teacherSubscriptionRequests.filter(r => r.status === "pending").length },
                { id: "trial_active", label: "تجربة نشطة", count: teacherSubscriptionRequests.filter(r => r.status === "trial_active").length },
                { id: "active", label: "اشتراك نشط", count: teacherSubscriptionRequests.filter(r => r.status === "active").length },
                { id: "rejected", label: "مرفوض", count: teacherSubscriptionRequests.filter(r => r.status === "rejected").length },
              ].map(f => (
                <button key={f.id} onClick={() => setTeacherSubFilter(f.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${teacherSubFilter === f.id ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                  {f.label} ({f.count})
                </button>
              ))}
            </div>

            {/* Requests table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {teacherSubFetching ? (
                <div className="p-8 text-center"><RefreshCw className="animate-spin mx-auto text-blue-500" size={24} /><p className="text-sm text-slate-500 mt-2">جاري التحميل...</p></div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-right p-4 text-sm font-bold text-slate-700">المعلم</th>
                      <th className="text-center p-4 text-sm font-bold text-slate-700">الهاتف</th>
                      <th className="text-center p-4 text-sm font-bold text-slate-700">الخطة</th>
                      <th className="text-center p-4 text-sm font-bold text-slate-700">المبلغ</th>
                      <th className="text-center p-4 text-sm font-bold text-slate-700">الحالة</th>
                      <th className="text-center p-4 text-sm font-bold text-slate-700">التاريخ</th>
                      <th className="text-center p-4 text-sm font-bold text-slate-700">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTeacherSubRequests.length === 0 ? (
                      <tr><td colSpan="7" className="p-8 text-center text-slate-400">لا توجد طلبات</td></tr>
                    ) : filteredTeacherSubRequests.map(req => (
                      <tr key={req.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="p-4">
                          <div className="font-bold text-sm text-slate-900">{req.teacher_name}</div>
                          <div className="text-xs text-slate-400">{req.teacher_email}</div>
                        </td>
                        <td className="p-4 text-center text-sm text-slate-600">{req.teacher_phone || "—"}</td>
                        <td className="p-4 text-center">
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                            {req.plan_type === 'monthly' ? 'شهري' : req.plan_type === 'yearly' ? 'سنوي' : req.plan_type}
                          </span>
                        </td>
                        <td className="p-4 text-center font-bold text-slate-900">{req.amount ? Number(req.amount).toLocaleString('ar-EG') : "مجاني"}</td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            req.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                            req.status === 'trial_active' ? 'bg-blue-100 text-blue-700' :
                            req.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                            req.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                            'bg-slate-100 text-slate-500'
                          }`}>
                            {req.status === 'pending' ? 'قيد المراجعة' :
                             req.status === 'trial_active' ? 'تجربة نشطة' :
                             req.status === 'active' ? 'اشتراك نشط' :
                             req.status === 'rejected' ? 'مرفوض' :
                             req.status === 'expired' ? 'منتهي' : req.status}
                          </span>
                        </td>
                        <td className="p-4 text-center text-xs text-slate-500">{req.created_at ? new Date(req.created_at).toLocaleDateString('ar-EG') : "—"}</td>
                        <td className="p-4 text-center">
                          <button onClick={() => setViewTeacherSubDetail(req)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg" title="عرض التفاصيل">
                            <Eye size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ───── 7️⃣ الدعم الفني ───── */}
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

        {/* ───── 8️⃣ إعدادات المنصة ───── */}
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
              <div className={`bg-gradient-to-br ${delivery.isRetrieved ? 'from-violet-700 via-indigo-600 to-blue-500' : 'from-violet-600 via-blue-600 to-emerald-500'} p-6 text-white`}>
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-3"><KeyRound className="text-white" size={24}/></div>
                <h3 className="text-xl font-black">{delivery.isRetrieved ? 'بيانات دخول المدرسة 🔑' : 'تم إنشاء اشتراك المدرسة ✅'}</h3>
                <p className="text-sm text-white/90 mt-1">{delivery.isRetrieved ? 'بيانات الدخول الخاصة بالمدرسة — يمكنك إرسالها في أي وقت' : 'سلّم هذه البيانات للمسؤول — كل بيانات المدرسة معزولة تلقائياً'}</p>
                <p className="text-xs bg-white/15 rounded-lg px-3 py-1.5 mt-3 inline-block">{delivery.school.name} • باقة {delivery.school.plan} • {delivery.school.billing_cycle === 'yearly' ? 'سنوي' : 'شهري'}</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                      <Link2 size={14} className="text-emerald-600"/> 
                      <span>رابط بوابة المدرسة المخصصة (Gateway URL)</span>
                    </div>
                    <button onClick={()=>{navigator.clipboard.writeText(delivery.loginUrl); toast.success("تم نسخ رابط البوابة بنجاح");}} className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1"><Copy size={12}/> نسخ الرابط</button>
                  </div>
                  <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono text-slate-800" dir="ltr">
                    <span className="flex-1 truncate font-bold text-emerald-800">{delivery.loginUrl}</span>
                    <a href={delivery.loginUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline"><ExternalLink size={14}/></a>
                  </div>
                  <p className="text-[11px] text-slate-500">هذا الرابط خاص بمدرستكم ويعرض شعارها واسمها تلقائياً، ويدخل المدير مباشرة عبره إلى لوحة التحكم.</p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div className="bg-white border border-slate-200 rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 flex items-center gap-1"><Mail size={14}/> اسم المستخدم / البريد</span>
                      <button onClick={()=>{navigator.clipboard.writeText(delivery.adminEmail); toast.success("تم نسخ اسم المستخدم");}} className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1"><Copy size={12}/> نسخ</button>
                    </div>
                    <p className="mt-1 text-sm font-bold text-slate-900 font-mono" dir="ltr">{delivery.adminEmail}</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-700 flex items-center gap-1"><Lock size={14}/> كلمة المرور {delivery.isRetrieved ? '' : 'المؤقتة'}</span>
                      <div className="flex items-center gap-2">
                        {delivery.isRetrieved && (
                          <button
                            onClick={async () => {
                              const newPw = genPassword(10);
                              try {
                                const admins = await entities.SystemAdmin.filter({ school_id: delivery.school.id });
                                if (admins && admins.length > 0) {
                                  await entities.SystemAdmin.update(admins[0].id, { portal_password: newPw });
                                  setDelivery(prev => ({ ...prev, password: newPw, isRetrieved: false }));
                                  toast.success('تم إعادة تعيين كلمة المرور — انسخها الآن');
                                } else {
                                  toast.error('لم يتم العثور على حساب المدير');
                                }
                              } catch(e) { toast.error('فشل إعادة التعيين'); }
                            }}
                            className="text-xs font-bold text-violet-700 hover:underline inline-flex items-center gap-1"
                          >
                            <RefreshCw size={11}/> إعادة تعيين
                          </button>
                        )}
                        <button onClick={()=>{navigator.clipboard.writeText(delivery.password); toast.success('تم نسخ كلمة المرور');}} className="text-xs font-bold text-amber-700 hover:underline inline-flex items-center gap-1"><Copy size={12}/> نسخ</button>
                      </div>
                    </div>
                    <p className="mt-1 text-base font-black text-amber-900 font-mono tracking-wider" dir="ltr">{delivery.password}</p>
                    {delivery.isRetrieved ? (
                      <p className="text-[11px] text-amber-700 mt-1">كلمة المرور الحالية — إذا غيّرها المدير لن تُعرض هنا. استخدم زر «إعادة تعيين» لتوليد كلمة مرور جديدة وإرسالها.</p>
                    ) : (
                      <p className="text-[11px] text-amber-700 mt-1">يُنصح بتغييرها بعد أول دخول — لا تُخزن كنص واضح بعد التسليم</p>
                    )}
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-xs leading-relaxed text-emerald-900">
                  <b>تفاصيل الاشتراك:</b> دورة الفوترة: <b>{delivery.school.billing_cycle === 'yearly' ? 'سنوي' : 'شهري'}</b> • بدء الاشتراك: <b>{delivery.school.subscription_start_date ? new Date(delivery.school.subscription_start_date).toLocaleDateString('ar-EG') : 'اليوم'}</b> • ينتهي في: <b>{delivery.school.expires_at ? new Date(delivery.school.expires_at).toLocaleDateString('ar-EG') : '—'}</b>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs leading-relaxed text-blue-900">
                  <b>ماذا يستطيع المدير الآن؟</b> الدخول عبر الرابط المخصص للمدرسة أعلاه → إدارة الطلاب والمعلمين والشؤون المالية والمناهج الخاصة بمدرسته بكل أمان وعزل كامل.
                </div>

                <div className="flex gap-2">
                  <button onClick={()=>{
                    const cycle = delivery.school.billing_cycle === 'yearly' ? 'سنوي' : 'شهري';
                    const msg = `مرحباً ${delivery.school.director} 👋\nتم تفعيل اشتراك مدرستكم *${delivery.school.name}* على منصة EduTrack بنجاح! 🏫\n\n🔗 رابط بوابة الدخول الخاصة بمدرستكم:\n${delivery.loginUrl}\n\n👤 اسم المستخدم: ${delivery.adminEmail}\n🔑 كلمة المرور: ${delivery.password}\n\nالخطة: ${delivery.school.plan} (${cycle})\nينتهي الاشتراك في: ${delivery.school.expires_at ? new Date(delivery.school.expires_at).toLocaleDateString('ar-EG') : '—'}\n\nيرجى الدخول عبر الرابط المخصص لمدرستكم وتغيير كلمة المرور بعد أول دخول.`;
                    const url = `https://wa.me/${(delivery.school.phone||"").replace(/[^0-9]/g,"")}?text=${encodeURIComponent(msg)}`;
                    if((delivery.school.phone||"").trim()) window.open(url, "_blank");
                    else { navigator.clipboard.writeText(msg); toast.success("تم نسخ رسالة الواتساب — الصقها يدوياً"); }
                  }} className="flex-1 h-11 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 inline-flex items-center justify-center gap-2 shadow-sm"><Send size={16}/> إرسال عبر واتساب</button>
                  <button onClick={()=>{
                    const cycle = delivery.school.billing_cycle === 'yearly' ? 'سنوي' : 'شهري';
                    const subject = `بيانات الدخول ورابط البوابة — ${delivery.school.name} (EduTrack)`;
                    const body = `مرحباً ${delivery.school.director},\n\nتم تفعيل اشتراك مدرستكم ${delivery.school.name} على منصة EduTrack (باقة ${delivery.school.plan} - ${cycle}).\n\n🔗 رابط بوابة الدخول الخاصة بمدرستكم:\n${delivery.loginUrl}\n\n👤 اسم المستخدم: ${delivery.adminEmail}\n🔑 كلمة المرور: ${delivery.password}\n\nينتهي الاشتراك في: ${delivery.school.expires_at ? new Date(delivery.school.expires_at).toLocaleDateString('ar-EG') : '—'}\n\nيرجى الدخول وتغيير كلمة المرور بعد أول تسجيل دخول.\n`;
                    window.location.href = `mailto:${delivery.adminEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                  }} className="flex-1 h-11 rounded-xl border border-slate-200 bg-white font-bold text-sm hover:bg-slate-50 inline-flex items-center justify-center gap-2"><Mail size={16}/> إرسال عبر بريد</button>
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

        {/* Details View Modal */}
        {viewRequestDetail && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setViewRequestDetail(null)}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
                    <FileText size={20}/>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">
                      {detailIsStudent ? "تفاصيل طلب الطالب" : detailIsTeacher ? "تفاصيل طلب المعلم" : "تفاصيل طلب المدرسة"}
                    </h3>
                    <p className="text-xs text-slate-500">معرف الطلب: <span className="font-mono">{viewRequestDetail.id}</span></p>
                  </div>
                </div>
                <button onClick={() => setViewRequestDetail(null)} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100">
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl">
                  <div>
                    <span className="text-xs text-slate-400 block font-semibold">نوع الطلب</span>
                    <span className="font-bold text-slate-800">
                      {viewRequestDetail.role_requested === "student" || viewRequestDetail.plan === "student_free" ? "طالب مستقل 🎓" :
                       viewRequestDetail.role_requested === "teacher" || viewRequestDetail.plan === "teacher_free" ? "معلم مستقل 👨‍🏫" :
                       `مدرسة (${viewRequestDetail.plan || "starter"}) 🏫`}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-semibold">حالة الطلب</span>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${viewRequestDetail.status === "approved" ? "bg-emerald-100 text-emerald-700" : viewRequestDetail.status === "rejected" ? "bg-rose-100 text-rose-700" : viewRequestDetail.status === "on_hold" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>
                      {viewRequestDetail.status === "approved" ? "مقبول" : viewRequestDetail.status === "rejected" ? "مرفوض" : viewRequestDetail.status === "on_hold" ? "معلق" : "قيد الانتظار"}
                    </span>
                  </div>
                </div>

                {detailIsSchool && (
                      <div className="space-y-2 p-1">
                        <div className="flex justify-between py-1.5 border-b border-slate-100"><span className="text-slate-500 font-medium">اسم المدرسة</span><b className="text-slate-900">{viewRequestDetail.school_name || viewRequestDetail.full_name || "-"}</b></div>
                        {viewRequestDetail.director_name && <div className="flex justify-between py-1.5 border-b border-slate-100"><span className="text-slate-500 font-medium">مدير المدرسة</span><b className="text-slate-900">{viewRequestDetail.director_name}</b></div>}
                        <div className="flex justify-between py-1.5 border-b border-slate-100"><span className="text-slate-500 font-medium">البريد الإلكتروني</span><b className="text-slate-900 font-mono text-xs" dir="ltr">{viewRequestDetail.email || "-"}</b></div>
                        <div className="flex justify-between py-1.5 border-b border-slate-100"><span className="text-slate-500 font-medium">رقم الهاتف</span><b className="text-slate-900 font-mono text-xs" dir="ltr">{viewRequestDetail.phone || "-"}</b></div>
                        {viewRequestDetail.plan && <div className="flex justify-between py-1.5 border-b border-slate-100"><span className="text-slate-500 font-medium">الباقة المطلوبة</span><b className="text-violet-700 font-bold">{viewRequestDetail.plan === "starter" ? " starters 🟢" : viewRequestDetail.plan === "professional" ? "Professional 🟡" : viewRequestDetail.plan === "enterprise" ? "Enterprise 🔴" : viewRequestDetail.plan}</b></div>}
                        {viewRequestDetail.billing_cycle && <div className="flex justify-between py-1.5 border-b border-slate-100"><span className="text-slate-500 font-medium">نوع الفوترة</span><b className="text-slate-900">{viewRequestDetail.billing_cycle === "monthly" ? "شهري" : viewRequestDetail.billing_cycle === "yearly" ? "سنوي" : viewRequestDetail.billing_cycle}</b></div>}
                        <div className="flex justify-between py-1.5 border-b border-slate-100"><span className="text-slate-500 font-medium">الدولة</span><b className="text-slate-900">{viewRequestDetail.country || "السودان"}</b></div>
                        {viewRequestDetail.created_at && <div className="flex justify-between py-1.5 border-b border-slate-100"><span className="text-slate-500 font-medium">تاريخ تقديم الطلب</span><b className="text-slate-700">{new Date(viewRequestDetail.created_at).toLocaleString('ar-EG')}</b></div>}
                      </div>
                )}

                {detailIsStudent && (
                      <div className="space-y-2 p-1">
                        <div className="flex justify-between py-1.5 border-b border-slate-100"><span className="text-slate-500 font-medium">اسم الطالب</span><b className="text-slate-900">{viewRequestDetail.full_name || "-"}</b></div>
                        {viewRequestDetail.director_name && <div className="flex justify-between py-1.5 border-b border-slate-100"><span className="text-slate-500 font-medium">ولي الأمر</span><b className="text-slate-900">{viewRequestDetail.director_name}</b></div>}
                        <div className="flex justify-between py-1.5 border-b border-slate-100"><span className="text-slate-500 font-medium">البريد الإلكتروني (ولي الأمر)</span><b className="text-slate-900 font-mono text-xs" dir="ltr">{viewRequestDetail.email || "-"}</b></div>
                        <div className="flex justify-between py-1.5 border-b border-slate-100"><span className="text-slate-500 font-medium">رقم هاتف ولي الأمر</span><b className="text-slate-900 font-mono text-xs" dir="ltr">{viewRequestDetail.phone || "-"}</b></div>
                        {viewRequestDetail.grade && <div className="flex justify-between py-1.5 border-b border-slate-100"><span className="text-slate-500 font-medium">الصف الدراسي</span><b className="text-emerald-700 font-bold">{viewRequestDetail.grade}</b></div>}
                        {viewRequestDetail.school_name && <div className="flex justify-between py-1.5 border-b border-slate-100"><span className="text-slate-500 font-medium">المدرسة</span><b className="text-slate-900">{viewRequestDetail.school_name}</b></div>}
                        <div className="flex justify-between py-1.5 border-b border-slate-100"><span className="text-slate-500 font-medium">المدينة</span><b className="text-slate-900">{viewRequestDetail.country || "السودان"}</b></div>
                        {viewRequestDetail.created_at && <div className="flex justify-between py-1.5 border-b border-slate-100"><span className="text-slate-500 font-medium">تاريخ تقديم الطلب</span><b className="text-slate-700">{new Date(viewRequestDetail.created_at).toLocaleString('ar-EG')}</b></div>}
                      </div>
                )}

                {detailIsTeacher && (
                      <div className="space-y-2 p-1">
                        <div className="flex justify-between py-1.5 border-b border-slate-100"><span className="text-slate-500 font-medium">اسم المعلم</span><b className="text-slate-900">{viewRequestDetail.full_name || "-"}</b></div>
                        <div className="flex justify-between py-1.5 border-b border-slate-100"><span className="text-slate-500 font-medium">البريد الإلكتروني</span><b className="text-slate-900 font-mono text-xs" dir="ltr">{viewRequestDetail.email || "-"}</b></div>
                        <div className="flex justify-between py-1.5 border-b border-slate-100"><span className="text-slate-500 font-medium">رقم الهاتف</span><b className="text-slate-900 font-mono text-xs" dir="ltr">{viewRequestDetail.phone || "-"}</b></div>
                        {viewRequestDetail.school_name && <div className="flex justify-between py-1.5 border-b border-slate-100"><span className="text-slate-500 font-medium">المدرسة</span><b className="text-slate-900">{viewRequestDetail.school_name}</b></div>}
                        {viewRequestDetail.subjects && <div className="flex justify-between py-1.5 border-b border-slate-100"><span className="text-slate-500 font-medium">المواد الدراسية</span><b className="text-slate-900">{viewRequestDetail.subjects}</b></div>}
                        {viewRequestDetail.experience_years && <div className="flex justify-between py-1.5 border-b border-slate-100"><span className="text-slate-500 font-medium">سنوات الخبرة</span><b className="text-slate-900">{viewRequestDetail.experience_years} سنوات</b></div>}
                        {viewRequestDetail.bio && <div className="flex justify-between py-1.5 border-b border-slate-100"><span className="text-slate-500 font-medium">نبذة شخصية</span><b className="text-slate-900">{viewRequestDetail.bio}</b></div>}
                        <div className="flex justify-between py-1.5 border-b border-slate-100"><span className="text-slate-500 font-medium">المدينة</span><b className="text-slate-900">{viewRequestDetail.country || "السودان"}</b></div>
                        {viewRequestDetail.created_at && <div className="flex justify-between py-1.5 border-b border-slate-100"><span className="text-slate-500 font-medium">تاريخ تقديم الطلب</span><b className="text-slate-700">{new Date(viewRequestDetail.created_at).toLocaleString('ar-EG')}</b></div>}
                      </div>
                )}

                {viewRequestDetail.notes && (
                  <div className="bg-amber-50/70 border border-amber-100 p-3.5 rounded-2xl mt-2">
                    <span className="text-xs font-bold text-amber-900 block mb-1">ملاحظات مقدم الطلب:</span>
                    <p className="text-xs text-amber-800 leading-relaxed whitespace-pre-wrap">{viewRequestDetail.notes}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-6 flex-wrap">
                {detailIsOpen && (
                  <button
                    onClick={() => {
                      if (detailIsStudent) {
                        setStudentApproval({ requestId: viewRequestDetail.id, fullName: viewRequestDetail.full_name || viewRequestDetail.student_name, email: viewRequestDetail.email, data: viewRequestDetail });
                        setStudentUsername(viewRequestDetail.email ? viewRequestDetail.email.split('@')[0] : `student_${Date.now().toString().slice(-4)}`);
                        setStudentPassword(genPassword(8));
                      } else if (detailIsTeacher) {
                        setTeacherApproval({ requestId: viewRequestDetail.id, fullName: viewRequestDetail.full_name, email: viewRequestDetail.email, data: viewRequestDetail });
                        setTeacherUsername(viewRequestDetail.email ? viewRequestDetail.email.split('@')[0] : `teacher_${Date.now().toString().slice(-4)}`);
                        setTeacherPassword(genPassword(8));
                      } else {
                        openSchoolApproval(viewRequestDetail);
                      }
                    }}
                    className="flex-1 min-w-[140px] h-11 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 inline-flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={16}/> قبول
                  </button>
                )}
                {detailIsOpen && (
                  <button
                    onClick={() => updateRequest.mutate({ id: viewRequestDetail.id, status: "rejected" })}
                    className="flex-1 min-w-[120px] h-11 rounded-xl bg-rose-50 text-rose-700 font-bold text-sm hover:bg-rose-100 inline-flex items-center justify-center gap-2"
                  >
                    <XCircle size={16}/> رفض
                  </button>
                )}
                {viewRequestDetail.status === 'approved' && detailIsSchool && (
                  <button
                    onClick={() => { showDeliveryForRequest(viewRequestDetail); setViewRequestDetail(null); }}
                    className="flex-1 min-w-[180px] h-11 rounded-xl bg-violet-600 text-white font-bold text-sm hover:bg-violet-700 inline-flex items-center justify-center gap-2"
                  >
                    <KeyRound size={16}/> استخراج بيانات الدخول والرابط
                  </button>
                )}
                <button
                  onClick={() => deleteRequest.mutate(viewRequestDetail.id)}
                  disabled={deleteRequest.isPending}
                  className="h-11 px-4 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 disabled:opacity-50 inline-flex items-center justify-center gap-2"
                >
                  <Trash2 size={16}/> {deleteRequest.isPending ? "جاري الحذف..." : "حذف الطلب"}
                </button>
                <button
                  onClick={() => setViewRequestDetail(null)}
                  className="flex-1 min-w-[110px] h-11 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-black"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ───── Add/Edit Pricing Plan Modal ───── */}
        {showAddPlan && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => { setShowAddPlan(false); setEditingPlan(null); }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()} dir="rtl">
              <h3 className="text-lg font-black text-slate-900 mb-1">{editingPlan ? "تعديل الخطة" : "إضافة خطة جديدة"}</h3>
              <p className="text-sm text-slate-500 mb-4">{editingPlan ? "تحديث بيانات الخطة" : "إنشاء خطة اشتراك جديدة للمعلمين"}</p>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">اسم الخطة (إنجليزي)</label>
                    <input type="text" value={newPlan.plan_name} onChange={e => setNewPlan({...newPlan, plan_name: e.target.value})} className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm font-bold focus:border-blue-500 outline-none" placeholder="e.g. teacher_monthly" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">اسم الخطة (عربي)</label>
                    <input type="text" value={newPlan.plan_name_ar} onChange={e => setNewPlan({...newPlan, plan_name_ar: e.target.value})} className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm font-bold focus:border-blue-500 outline-none" placeholder="مثال: خطة المعلم الشهرية" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">النوع</label>
                    <select value={newPlan.plan_type} onChange={e => setNewPlan({...newPlan, plan_type: e.target.value})} className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm font-bold focus:border-blue-500 outline-none">
                      <option value="teacher">معلم</option>
                      <option value="student">طالب</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">العملة</label>
                    <select value={newPlan.currency} onChange={e => setNewPlan({...newPlan, currency: e.target.value})} className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm font-bold focus:border-blue-500 outline-none">
                      <option value="EGP">جنيه مصري</option>
                      <option value="USD">دولار أمريكي</option>
                      <option value="SUD">جنيه سوداني</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">أيام التجربة</label>
                    <input type="number" value={newPlan.trial_days} onChange={e => setNewPlan({...newPlan, trial_days: parseInt(e.target.value) || 0})} className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm font-bold focus:border-blue-500 outline-none" min="0" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">السعر الشهري</label>
                    <input type="number" value={newPlan.price_monthly} onChange={e => setNewPlan({...newPlan, price_monthly: parseFloat(e.target.value) || 0})} className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm font-bold focus:border-blue-500 outline-none" min="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">السعر السنوي</label>
                    <input type="number" value={newPlan.price_yearly} onChange={e => setNewPlan({...newPlan, price_yearly: parseFloat(e.target.value) || 0})} className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm font-bold focus:border-blue-500 outline-none" min="0" />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={handleSavePricingPlan} disabled={pricingLoading} className="flex-1 h-11 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 inline-flex items-center justify-center gap-2 disabled:opacity-50">
                  {pricingLoading ? "جاري الحفظ..." : <><CheckCircle2 size={14}/> {editingPlan ? "تحديث الخطة" : "إنشاء الخطة"}</>}
                </button>
                <button onClick={() => { setShowAddPlan(false); setEditingPlan(null); }} className="h-11 px-4 rounded-xl bg-slate-100 font-bold text-sm hover:bg-slate-200">إلغاء</button>
              </div>
            </div>
          </div>
        )}

        {/* ───── Teacher Subscription Request Detail Modal ───── */}
        {viewTeacherSubDetail && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setViewTeacherSubDetail(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()} dir="rtl">
              <h3 className="text-lg font-black text-slate-900 mb-1">تفاصيل طلب الاشتراك</h3>
              <p className="text-sm text-slate-500 mb-4">مراجعة طلب اشتراك المعلم والموافقة عليه أو رفضه</p>
              
              <div className="space-y-3 bg-slate-50 rounded-xl p-4 mb-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="text-xs text-slate-500">المعلم:</span><p className="font-bold text-sm">{viewTeacherSubDetail.teacher_name}</p></div>
                  <div><span className="text-xs text-slate-500">البريد الإلكتروني:</span><p className="font-bold text-sm" dir="ltr">{viewTeacherSubDetail.teacher_email}</p></div>
                  <div><span className="text-xs text-slate-500">الهاتف:</span><p className="font-bold text-sm">{viewTeacherSubDetail.teacher_phone || "—"}</p></div>
                  <div><span className="text-xs text-slate-500">الخطة:</span><p className="font-bold text-sm">{viewTeacherSubDetail.plan_type === 'monthly' ? 'شهري' : viewTeacherSubDetail.plan_type === 'yearly' ? 'سنوي' : viewTeacherSubDetail.plan_type}</p></div>
                  <div><span className="text-xs text-slate-500">المبلغ:</span><p className="font-bold text-sm">{viewTeacherSubDetail.amount ? Number(viewTeacherSubDetail.amount).toLocaleString('ar-EG') + " EGP" : "مجاني"}</p></div>
                  <div><span className="text-xs text-slate-500">الحالة:</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      viewTeacherSubDetail.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      viewTeacherSubDetail.status === 'trial_active' ? 'bg-blue-100 text-blue-700' :
                      viewTeacherSubDetail.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                      viewTeacherSubDetail.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {viewTeacherSubDetail.status === 'pending' ? 'قيد المراجعة' :
                       viewTeacherSubDetail.status === 'trial_active' ? 'تجربة نشطة' :
                       viewTeacherSubDetail.status === 'active' ? 'اشتراك نشط' :
                       viewTeacherSubDetail.status === 'rejected' ? 'مرفوض' : viewTeacherSubDetail.status}
                    </span>
                  </div>
                  <div><span className="text-xs text-slate-500">تاريخ الطلب:</span><p className="font-bold text-sm">{viewTeacherSubDetail.created_at ? new Date(viewTeacherSubDetail.created_at).toLocaleDateString('ar-EG') : "—"}</p></div>
                </div>
                {viewTeacherSubDetail.founder_notes && (
                  <div><span className="text-xs text-slate-500">ملاحظات المؤسس:</span><p className="text-sm bg-white rounded-lg p-2 mt-1">{viewTeacherSubDetail.founder_notes}</p></div>
                )}
                {viewTeacherSubDetail.status === 'trial_active' && viewTeacherSubDetail.trial_end_date && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-bold text-blue-700">الفترة التجريبية تنتهي: {new Date(viewTeacherSubDetail.trial_end_date).toLocaleDateString('ar-EG')}</p>
                  </div>
                )}
                {viewTeacherSubDetail.status === 'active' && viewTeacherSubDetail.expires_at && (
                  <div className="bg-emerald-50 rounded-lg p-3">
                    <p className="text-xs font-bold text-emerald-700">الاشتراك ينتهي: {new Date(viewTeacherSubDetail.expires_at).toLocaleDateString('ar-EG')}</p>
                  </div>
                )}
              </div>

              {/* Approval controls (only for pending requests) */}
              {viewTeacherSubDetail.status === 'pending' && (
                <div className="space-y-3 bg-amber-50 rounded-xl p-4 mb-4 border border-amber-100">
                  <p className="text-xs font-bold text-amber-700 mb-2">التحكم في الطلب:</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">أيام الفترة التجريبية</label>
                      <input type="number" value={approveTrialDays} onChange={e => setApproveTrialDays(parseInt(e.target.value) || 30)} className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm font-bold focus:border-blue-500 outline-none" min="0" max="90" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">ملاحظات (اختياري)</label>
                      <input type="text" value={approveFounderNotes} onChange={e => setApproveFounderNotes(e.target.value)} className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm font-bold focus:border-blue-500 outline-none" placeholder="ملاحظات داخلية..." />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                {viewTeacherSubDetail.status === 'pending' && (
                  <>
                    <button onClick={() => handleApproveTeacherSub(viewTeacherSubDetail.id, true)} disabled={processingTeacherSub === viewTeacherSubDetail.id} className="flex-1 h-11 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 inline-flex items-center justify-center gap-2 disabled:opacity-50">
                      {processingTeacherSub === viewTeacherSubDetail.id ? "جاري..." : <><Timer size={14}/> تفعيل فترة تجريبية</>}
                    </button>
                    <button onClick={() => handleApproveTeacherSub(viewTeacherSubDetail.id, false)} disabled={processingTeacherSub === viewTeacherSubDetail.id} className="flex-1 h-11 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 inline-flex items-center justify-center gap-2 disabled:opacity-50">
                      {processingTeacherSub === viewTeacherSubDetail.id ? "جاري..." : <><CheckCircle2 size={14}/> تفعيل اشتراك مدفوع</>}
                    </button>
                    <button onClick={() => handleRejectTeacherSub(viewTeacherSubDetail.id)} disabled={processingTeacherSub === viewTeacherSubDetail.id} className="h-11 px-4 rounded-xl bg-rose-100 text-rose-700 font-bold text-sm hover:bg-rose-200 inline-flex items-center justify-center gap-2 disabled:opacity-50">
                      <XCircle size={14}/> رفض
                    </button>
                  </>
                )}
                <button onClick={() => setViewTeacherSubDetail(null)} className="h-11 px-4 rounded-xl bg-slate-100 font-bold text-sm hover:bg-slate-200">إغلاق</button>
              </div>
            </div>
          </div>
        )}

        {/* School Approval Modal */}
        {schoolApproval && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setSchoolApproval(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()} dir="rtl">
              <h3 className="text-lg font-black text-slate-900 mb-1">إنشاء حساب المدرسة</h3>
              <p className="text-sm text-slate-500 mb-4">
                الموافقة على <span className="font-bold text-slate-800">{schoolApproval.school_name || schoolApproval.full_name || "طلب مدرسة"}</span> — أدخل اسم المستخدم وكلمة المرور التي سترسل للمدير مع رابط البوابة.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">اسم المستخدم</label>
                  <input
                    type="text"
                    value={schoolUsername}
                    onChange={e => setSchoolUsername(e.target.value)}
                    className="w-full h-11 rounded-xl border border-slate-200 px-4 text-sm font-bold focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
                    placeholder="admin@school.com"
                    dir="ltr"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-600">كلمة المرور</label>
                    <button
                      type="button"
                      onClick={() => setSchoolPassword(genPassword(10))}
                      className="text-xs text-emerald-600 hover:underline font-bold flex items-center gap-1"
                    >
                      <RefreshCw size={11}/> توليد عشوائي
                    </button>
                  </div>
                  <input
                    type="text"
                    value={schoolPassword}
                    onChange={e => setSchoolPassword(e.target.value)}
                    className="w-full h-11 rounded-xl border border-slate-200 px-4 text-sm font-bold focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none font-mono"
                    placeholder="••••••••••"
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <button
                  onClick={handleApproveSchool}
                  disabled={approvingSchool}
                  className="flex-1 h-11 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 inline-flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {approvingSchool ? "جارٍ الإنشاء..." : <><CheckCircle2 size={14}/> تأكيد وإنشاء الرابط</>}
                </button>
                <button
                  onClick={() => setSchoolApproval(null)}
                  className="h-11 px-4 rounded-xl bg-slate-100 font-bold text-sm hover:bg-slate-200"
                >
                  إلغاء
                </button>
              </div>
              <p className="text-[11px] text-center text-slate-400 mt-3">بعد التأكيد ستظهر بطاقة تحتوي رابط البوابة واسم المستخدم وكلمة المرور مع زر الإرسال عبر البريد الإلكتروني.</p>
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-600">كلمة المرور (Password)</label>
                    <button
                      type="button"
                      onClick={() => setTeacherPassword(genPassword(8))}
                      className="text-xs text-indigo-600 hover:underline font-bold flex items-center gap-1"
                    >
                      <RefreshCw size={11}/> توليد عشوائي
                    </button>
                  </div>
                  <input
                    type="text"
                    value={teacherPassword}
                    onChange={e => setTeacherPassword(e.target.value)}
                    className="w-full h-11 rounded-xl border border-slate-200 px-4 text-sm font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none font-mono"
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-600">كلمة المرور (Password)</label>
                    <button
                      type="button"
                      onClick={() => setStudentPassword(genPassword(8))}
                      className="text-xs text-emerald-600 hover:underline font-bold flex items-center gap-1"
                    >
                      <RefreshCw size={11}/> توليد عشوائي
                    </button>
                  </div>
                  <input
                    type="text"
                    value={studentPassword}
                    onChange={e => setStudentPassword(e.target.value)}
                    className="w-full h-11 rounded-xl border border-slate-200 px-4 text-sm font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none font-mono"
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


