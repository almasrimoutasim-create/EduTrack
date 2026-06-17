import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/dbClient";
import { 
  Users, 
  FileText, 
  CreditCard, 
  ShoppingCart, 
  ChevronRight, 
  ChevronLeft, 
  ArrowLeft,
  Shield,
  Bus,
  Lock,
  X,
  AlertCircle,
  Eye,
  EyeOff,
  Bell,
  CheckCircle2,
  Calendar,
  Phone,
  UserCheck,
  DoorOpen,
  Wifi,
  HeartHandshake,
  LifeBuoy
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";

const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all border-2 border-stone-200 bg-white/50 backdrop-blur-md text-stone-800 hover:bg-stone-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const btnPrimary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed";

export default function StaffPortal() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const { user } = useAuth();
  
  const currentRole = localStorage.getItem("portal_role") || "staff";
  const currentUserStr = localStorage.getItem("portal_user");
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;

  // Dialog & Login state for specific departments
  const [selectedDept, setSelectedDept] = useState(null);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Security View state (Mock Visitor log data)
  const [visitorName, setVisitorName] = useState("");
  const [visitorReason, setVisitorReason] = useState("");
  const queryClient = useQueryClient();
  const { data: visitors = [] } = useQuery({
    queryKey: ["visitors-today"],
    queryFn: () => entities.Visitor.list("-created_at", 50),
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 30
  });

  const subPortals = [
    { 
      id: "registrar", 
      icon: FileText, 
      label: { ar: "المسجل", en: "Registrar" }, 
      color: "bg-orange-500 text-white",
      path: "/student-directory"
    },
    { 
      id: "bus_supervisor", 
      icon: Bus, 
      label: { ar: "مشرف حافلة", en: "Bus Supervisor" }, 
      color: "bg-amber-500 text-stone-900",
      path: "/bus-supervisor"
    },
    { 
      id: "store_keeper", 
      icon: ShoppingCart, 
      label: { ar: "أمين مستودع", en: "Store Keeper" }, 
      color: "bg-blue-600 text-white",
      path: "/store"
    },
    { 
      id: "security", 
      icon: Shield, 
      label: { ar: "حارس أمن", en: "Security Guard" }, 
      color: "bg-stone-800 text-white",
      path: "#security"
    },
    { 
      id: "hr", 
      icon: Users, 
      label: { ar: "الموارد البشرية", en: "Human Resources" }, 
      color: "bg-purple-600 text-white",
      path: "/staff-control"
    },
    { 
      id: "accountant", 
      icon: CreditCard, 
      label: { ar: "المحاسب", en: "Accountant" }, 
      color: "bg-rose-600 text-white",
      path: "/finance"
    },
    {
      id: "counselor",
      icon: HeartHandshake,
      label: { ar: "المرشد الطلابي", en: "Student Counselor" },
      color: "bg-emerald-600 text-white",
      path: "/counseling"
    },
    {
      id: "support",
      icon: LifeBuoy,
      label: { ar: "الدعم الفني", en: "Technical Support" },
      color: "bg-rose-500 text-white",
      path: "#support"
    }
  ];

  const handlePortalClick = (path, id) => {
    // If the user is logged in as a general staff (guest)
    // and they click a specific department, we prompt them to log in for that department.
    if (currentRole === "staff") {
      setSelectedDept(subPortals.find(p => p.id === id));
      setIdentifier("");
      setPassword("");
      setShowPassword(false);
      setErrorMsg("");
    } else {
      // If they are already logged in specifically
      if (id === "security" || id === "support") {
        // Just let them view the custom security or support screen in this component
        localStorage.setItem("portal_role", id);
        window.location.reload();
      } else {
        localStorage.setItem("portal_role", id);
        window.location.href = path;
      }
    }
  };

  const handleDeptLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      // @ts-ignore
      const apiBase = import.meta.env.VITE_BACKEND_URL || '';
      const loginUrl = apiBase ? `${apiBase.replace(/\/$/, '')}/neon-db/auth/login` : '/neon-db/auth/login';
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'staff', identifier: identifier.trim(), password })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "بيانات الدخول غير صحيحة");
      }

      // Check if the staff member role matches the clicked department
      const userRole = data.user.role ? data.user.role.toLowerCase() : "";
      data.user.role = userRole;
      
      // Map roles to make sure they align
      const targetDeptId = selectedDept.id; // e.g. registrar, bus_supervisor, store_keeper, security, hr, accountant
      
      const isMatch = 
        (targetDeptId === "registrar" && userRole === "registrar") ||
        (targetDeptId === "hr" && userRole === "hr") ||
        (targetDeptId === "accountant" && userRole === "accountant") ||
        (targetDeptId === "store_keeper" && (userRole === "store" || userRole === "store_keeper")) ||
        (targetDeptId === "bus_supervisor" && (userRole === "bus" || userRole === "bus_supervisor")) ||
        (targetDeptId === "security" && userRole === "security") ||
        (targetDeptId === "support" && userRole === "support") ||
        (targetDeptId === "counselor" && (userRole === "counselor" || userRole === "counseling"));

      if (!isMatch) {
        throw new Error(isRTL ? "عذراً، هذا الحساب غير مصرح له بالدخول لهذا القسم الإداري" : "This account is not authorized for this department");
      }

      // Login success
      toast.success(isRTL ? `مرحباً بك في قسم ${selectedDept.label.ar}` : `Welcome to ${selectedDept.label.en}`);
      
      localStorage.setItem("portal_role", userRole);
      localStorage.setItem("portal_user", JSON.stringify(data.user));
      localStorage.setItem("portal_user_id", data.user.id);
      localStorage.setItem("portal_user_name", data.user.full_name);
      localStorage.setItem("portal_is_auth", "true");
      if (data.token) {
        localStorage.setItem("portal_jwt_token", data.token);
      }

      setSelectedDept(null);
      
      if (targetDeptId === "security" || targetDeptId === "support") {
        window.location.reload();
      } else {
        window.location.href = selectedDept.path;
      }
    } catch (err) {
      setErrorMsg(err.message || (isRTL ? "خطأ في تسجيل الدخول" : "Login error"));
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    localStorage.removeItem("portal_role");
    localStorage.removeItem("portal_user");
    localStorage.removeItem("portal_user_id");
    localStorage.removeItem("portal_user_name");
    localStorage.removeItem("portal_is_auth");
    localStorage.removeItem("portal_jwt_token");
    window.location.href = "/";
  };

  const handleLogoutDept = () => {
    // Log out of specific department and return to guest staff role
    localStorage.setItem("portal_role", "staff");
    localStorage.setItem("portal_user", JSON.stringify({
      id: "staff-guest",
      full_name: "موظف زائر",
      email: "guest@edutrack.com",
      role: "staff"
    }));
    localStorage.setItem("portal_user_id", "staff-guest");
    localStorage.setItem("portal_user_name", "موظف زائر");
    window.location.href = "/staff-portal";
  };

  const handleAddVisitor = async (e) => {
    e.preventDefault();
    if (!visitorName.trim()) return;

    try {
      await entities.Visitor.create({
        visitor_name: visitorName,
        reason: visitorReason || (isRTL ? "زيارة عامة" : "General Visit"),
        status: "checked_in",
        recorded_by: currentUser?.full_name || currentUser?.id || "security"
      });

      setVisitorName("");
      setVisitorReason("");
      queryClient.invalidateQueries({ queryKey: ["visitors-today"] });
      toast.success(isRTL ? "تم تسجيل دخول الزائر" : "Visitor checked in successfully");
    } catch (err) {
      toast.error(isRTL ? "فشل تسجيل الزائر" : "Failed to check in visitor");
    }
  };

  const handleCheckOutVisitor = async (id) => {
    try {
      await entities.Visitor.update(id, {
        status: "checked_out",
        check_out_time: new Date().toISOString()
      });
      queryClient.invalidateQueries({ queryKey: ["visitors-today"] });
      toast.success(isRTL ? "تم تسجيل خروج الزائر" : "Visitor checked out successfully");
    } catch (err) {
      toast.error(isRTL ? "فشل تسجيل الخروج" : "Failed to check out visitor");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  // RENDER TECHNICAL SUPPORT PORTAL IN-PAGE
  if (currentRole === "support") {
    const savedReqs = JSON.parse(localStorage.getItem("staff_requests") || "[]");
    const supportTickets = savedReqs.filter(r => r.type === "SUPPORT");

    const totalCount = supportTickets.length;
    const pendingTickets = supportTickets.filter(t => t.status === "PENDING");
    const resolvedTickets = supportTickets.filter(t => t.status === "APPROVED" || t.status === "RESOLVED");

    const handleResolveTicket = async (ticketId, employeeName) => {
      try {
        const updated = savedReqs.map(r => {
          if (r.id === ticketId) {
            return { ...r, status: "APPROVED" };
          }
          return r;
        });
        localStorage.setItem("staff_requests", JSON.stringify(updated));

        await entities.AuditLog.create({
          timestamp: new Date().toISOString(),
          user_name: "مهندس الدعم الفني",
          action: "RESOLVE_SUPPORT_TICKET",
          entity_type: "SupportTicket",
          entity_id: ticketId,
          details: `Technical support ticket resolved for employee ${employeeName}`
        });

        window.dispatchEvent(new Event("storage"));

        toast.success(isRTL ? "تم تحديد التذكرة كمحلولة بنجاح" : "Support ticket marked as resolved");
        window.location.reload();
      } catch (err) {
        console.error(err);
        toast.error(isRTL ? "فشل تحديث حالة التذكرة" : "Failed to resolve support ticket");
      }
    };

    return (
      <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col p-4 md:p-8" dir={isRTL ? "rtl" : "ltr"}>
        <header className="max-w-6xl w-full mx-auto flex flex-col md:flex-row items-center justify-between border-b border-stone-200 pb-6 mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-lg">
              <LifeBuoy size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-black text-stone-900">
                {isRTL ? "بوابة الدعم الفني | Helpdesk" : "Technical Support Portal | Helpdesk"}
              </h1>
              <p className="text-stone-400 text-xs mt-0.5">
                {isRTL ? "متابعة ومعالجة البلاغات والمشاكل التقنية الواردة من الكوادر" : "Resolve and track tech tickets reported by staff"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-rose-50 rounded-full px-4 py-1.5 text-xs text-rose-600 font-bold border border-rose-200">
              <Wifi size={14} className="animate-pulse" />
              {isRTL ? "نظام الدعم نشط" : "Support System Online"}
            </div>
            {user?.role === "admin" ? (
              <button 
                onClick={() => {
                  localStorage.setItem("portal_role", "admin");
                  window.location.href = "/";
                }}
                className={`${btnOutline} h-10 px-4 rounded-xl text-xs`}
              >
                <ArrowLeft size={14} className={isRTL ? "" : "rotate-180"} />
                {isRTL ? "العودة للوحة الإدارة" : "Back to Admin"}
              </button>
            ) : (
              <button 
                onClick={handleLogoutDept}
                className={`${btnOutline} h-10 px-4 rounded-xl text-xs`}
              >
                <ArrowLeft size={14} className={isRTL ? "" : "rotate-180"} />
                {isRTL ? "بوابة الموظفين" : "Staff Portal"}
              </button>
            )}
          </div>
        </header>

        <main className="max-w-6xl w-full mx-auto space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: isRTL ? "إجمالي بلاغات الدعم" : "Total Support Tickets", value: totalCount, color: "text-stone-900", bg: "bg-white border-stone-200" },
              { label: isRTL ? "بلاغات معلقة" : "Pending Review", value: pendingTickets.length, color: "text-amber-600", bg: "bg-amber-50 border-amber-200/50" },
              { label: isRTL ? "بلاغات محلولة" : "Resolved Cases", value: resolvedTickets.length, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200/50" },
            ].map((stat, i) => (
              <Card key={i} className={`p-6 border shadow-sm rounded-2xl flex items-center justify-between overflow-hidden relative ${stat.bg}`}>
                <div>
                  <p className="text-stone-400 text-[10px] font-bold uppercase tracking-wider mb-1">{stat.label}</p>
                  <h4 className="text-3xl font-black num-en">{stat.value}</h4>
                </div>
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${stat.color} bg-white shadow-sm border border-stone-100`}>
                  <LifeBuoy size={22} />
                </div>
              </Card>
            ))}
          </div>

          <Card className="p-6 border-none shadow-sm rounded-[32px] bg-white">
            <h3 className="text-lg font-serif font-black text-stone-900 mb-6 flex items-center gap-2">
              <LifeBuoy className="text-rose-500" size={20} />
              {isRTL ? "تذاكر وبلاغات الدعم الواردة" : "Incoming Support Tickets"}
            </h3>

            <div className="space-y-4">
              {supportTickets.map((ticket) => {
                const isPending = ticket.status === "PENDING";
                return (
                  <div key={ticket.id} className={`p-5 rounded-2xl border-2 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all duration-300 ${
                    isPending ? "border-amber-500/25 bg-amber-50/10" : "border-emerald-500/20 bg-emerald-50/10"
                  }`}>
                    <div className="flex gap-4">
                      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${
                        isPending ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                      }`}>
                        <LifeBuoy size={22} className={isPending ? "animate-spin" : ""} style={{ animationDuration: '3s' }} />
                      </div>
                      <div>
                        <h4 className="font-bold text-stone-900 flex items-center gap-2 flex-wrap">
                          {ticket.employeeName}
                          <Badge className="bg-stone-100 text-stone-600 border-none rounded text-[9px] font-bold px-2 py-0.5">
                            {ticket.role}
                          </Badge>
                          <Badge className={`${isPending ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'} border-none rounded-lg text-[9px] font-black`}>
                            {isPending ? (isRTL ? "معلق" : "Pending") : (isRTL ? "تم الحل" : "Resolved")}
                          </Badge>
                        </h4>
                        <p className="text-sm font-semibold text-stone-600 mt-2 bg-white/50 p-3 rounded-xl border border-stone-100/50">{ticket.reason}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-stone-100">
                      <div className="text-end shrink-0">
                        <span className="text-[10px] text-stone-400 font-bold block">{isRTL ? "تاريخ التقديم" : "Submitted Date"}</span>
                        <span className="text-xs text-stone-800 font-bold num-en">{ticket.date}</span>
                      </div>
                      
                      {isPending && (
                        <button
                          onClick={() => handleResolveTicket(ticket.id, ticket.employeeName)}
                          className="h-11 px-5 rounded-xl bg-stone-900 text-white hover:bg-black font-bold text-xs gap-1.5 cursor-pointer shadow-md transition-all flex items-center"
                        >
                          <CheckCircle2 size={16} />
                          {isRTL ? "اعتماد الحل" : "Resolve Case"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {supportTickets.length === 0 && (
                <div className="py-20 text-center text-stone-400 border border-dashed border-stone-200 rounded-3xl">
                  <LifeBuoy size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="font-bold">{isRTL ? "لا توجد أي تذاكر دعم فني مسجلة" : "No technical support tickets found"}</p>
                </div>
              )}
            </div>
          </Card>
        </main>
      </div>
    );
  }

  // RENDER SECURITY PORTAL IN-PAGE
  if (currentRole === "security") {
    return (
      <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col p-4 md:p-8" dir={isRTL ? "rtl" : "ltr"}>
        {/* Header */}
        <header className="max-w-6xl w-full mx-auto flex flex-col md:flex-row items-center justify-between border-b border-stone-800 pb-6 mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-amber-500 text-stone-900 flex items-center justify-center shadow-lg">
              <Shield size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-black text-white">
                {isRTL ? "لوحة التحكم الأمنية | حارس الأمن" : "Security Dashboard | Guard Station"}
              </h1>
              <p className="text-stone-400 text-xs mt-0.5">
                {isRTL ? "إدارة بوابات الحرم المدرسي وسجل الزوار النشط" : "Manage campus gates and active visitors log"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-stone-800 rounded-full px-4 py-1.5 text-xs text-emerald-400 font-bold border border-emerald-500/20">
              <Wifi size={14} className="animate-pulse" />
              {isRTL ? "متصل بالنظام" : "System Connected"}
            </div>
            {user?.role === "admin" ? (
              <button 
                onClick={() => {
                  localStorage.setItem("portal_role", "admin");
                  window.location.href = "/";
                }}
                className={`${btnOutline} border-stone-750 bg-stone-800 text-stone-200 hover:bg-stone-700 h-10 px-4 rounded-xl text-xs`}
              >
                <ArrowLeft size={14} className={isRTL ? "" : "rotate-180"} />
                {isRTL ? "العودة للوحة الإدارة" : "Back to Admin"}
              </button>
            ) : (
              <button 
                onClick={handleLogoutDept}
                className={`${btnOutline} border-stone-700 bg-stone-800 text-stone-300 hover:bg-stone-700 h-10 px-4 rounded-xl text-xs`}
              >
                <ArrowLeft size={14} className={isRTL ? "" : "rotate-180"} />
                {isRTL ? "بوابة الموظفين" : "Staff Portal"}
              </button>
            )}
          </div>
        </header>

        <main className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Visitor Registration Form */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-6 bg-stone-850 border-stone-800 text-white rounded-3xl shadow-xl">
              <h3 className="text-lg font-serif font-black text-white mb-4 flex items-center gap-2">
                <DoorOpen className="text-amber-500" size={18} />
                {isRTL ? "تسجيل زائر جديد" : "New Visitor Registration"}
              </h3>
              <form onSubmit={handleAddVisitor} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1.5">{isRTL ? "اسم الزائر" : "Visitor Name"}</label>
                  <Input 
                    placeholder={isRTL ? "مثال: رائد محمد" : "e.g. Raed Mohammad"} 
                    value={visitorName}
                    onChange={e => setVisitorName(e.target.value)}
                    className="bg-stone-800 border-stone-750 text-white focus-visible:ring-amber-500 h-11 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1.5">{isRTL ? "سبب الزيارة" : "Reason for Visit"}</label>
                  <Input 
                    placeholder={isRTL ? "مثال: موعد مع المدير" : "e.g. Meeting with Principal"} 
                    value={visitorReason}
                    onChange={e => setVisitorReason(e.target.value)}
                    className="bg-stone-800 border-stone-750 text-white focus-visible:ring-amber-500 h-11 rounded-xl"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full h-11 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-900 font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 cursor-pointer"
                >
                  <UserCheck size={16} />
                  {isRTL ? "تسجيل دخول وتصريح" : "Issue Pass & Check In"}
                </button>
              </form>
            </Card>

            {/* Electronic Gate Control */}
            <Card className="p-6 bg-stone-850 border-stone-800 text-white rounded-3xl shadow-xl space-y-4">
              <h3 className="text-lg font-serif font-black text-white flex items-center gap-2">
                <Shield className="text-emerald-500" size={18} />
                {isRTL ? "البوابات الإلكترونية" : "Electronic Gates"}
              </h3>
              <div className="space-y-3">
                {[
                  { name: isRTL ? "بوابة السيارات الرئيسية" : "Main Gate Auto", status: "Closed", color: "text-rose-500" },
                  { name: isRTL ? "مدخل المشاة الشرقي" : "East Pedestrian", status: "Open", color: "text-emerald-500" },
                  { name: isRTL ? "بوابة الحافلات الخلفية" : "Rear Bus Gate", status: "Closed", color: "text-rose-500" }
                ].map((gate, i) => (
                  <div key={i} className="flex items-center justify-between p-3.5 bg-stone-800/60 border border-stone-750 rounded-2xl">
                    <span className="text-xs font-bold text-stone-200">{gate.name}</span>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-black uppercase ${gate.color}`}>{gate.status}</span>
                      <button 
                        onClick={() => toast.success(isRTL ? "تم إرسال إشارة التحكم" : "Control signal sent")}
                        className="h-8 px-3 rounded-lg bg-stone-700 hover:bg-stone-600 text-[10px] font-bold text-stone-100 transition-colors"
                      >
                        {isRTL ? "تبديل" : "Toggle"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Visitor Log List */}
          <div className="lg:col-span-2">
            <Card className="p-6 bg-stone-850 border-stone-800 text-white rounded-3xl shadow-xl min-h-[450px] flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-serif font-black text-white flex items-center gap-2">
                    <Bell className="text-amber-500 animate-bounce" size={18} />
                    {isRTL ? "سجل الزوار اليوم النشط" : "Active Daily Visitor Log"}
                  </h3>
                  <p className="text-[10px] text-stone-400 font-semibold">{isRTL ? "تتبع فوري لحالات الدخول والخروج" : "Real-time track of entry and exit"}</p>
                </div>
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto max-h-[350px]">
                {visitors.map((visitor) => (
                  <div key={visitor.id} className="flex items-center justify-between p-4 bg-stone-800/40 border border-stone-750 rounded-2xl hover:bg-stone-800/80 transition-colors">
                    <div className="flex items-center gap-3.5">
                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${visitor.status === 'checked_in' ? 'bg-amber-500/10 text-amber-400' : 'bg-stone-700 text-stone-400'}`}>
                        <Users size={16} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{visitor.visitor_name}</h4>
                        <p className="text-[10px] text-stone-400 font-semibold mt-0.5">{visitor.reason}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-end">
                        <p className="text-xs font-bold text-stone-300 num-en">
                          {visitor.check_in_time ? new Date(visitor.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                        </p>
                        <span className={`text-[9px] font-black uppercase ${visitor.status === 'checked_in' ? 'text-emerald-500' : 'text-stone-400'}`}>
                          {visitor.status === 'checked_in' ? (isRTL ? "موجود بالحرم" : "On Campus") : (isRTL ? "غادر" : "Departed")}
                        </span>
                      </div>

                      {visitor.status === "checked_in" && (
                        <button 
                          onClick={() => handleCheckOutVisitor(visitor.id)}
                          className="h-8 px-4 rounded-xl bg-stone-700 hover:bg-stone-600 text-[10px] font-bold text-white transition-colors"
                        >
                          {isRTL ? "تسجيل خروج" : "Check Out"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {visitors.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center py-20 text-stone-600">
                    <Users size={40} className="mb-2 opacity-10" />
                    <p className="text-xs font-bold">{isRTL ? "لا يوجد زوار مسجلين اليوم" : "No visitors logged today"}</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  // GENERAL STAFF PORTAL VIEW (WITH FREE ACCESS AS GENERAL STAFF GUEST)
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden" dir={isRTL ? "rtl" : "ltr"}>
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px]" />
      </div>

      {/* Back Button */}
      <div className="absolute top-4 start-4 z-50">
        <button 
          onClick={handleBack}
          className={`${btnOutline} h-10 px-4 font-bold text-[10px] gap-1.5 shadow-sm`}
        >
          <ArrowLeft size={14} className={isRTL ? "rotate-180" : ""} />
          {isRTL ? "الرئيسية" : "Main Menu"}
        </button>
      </div>

      <div className="max-w-6xl w-full relative z-10 mx-auto px-4">
        {/* Header */}
        <header className="text-center mb-8 space-y-2 flex flex-col items-center justify-center w-full" dir="ltr">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center justify-center h-14 w-14 rounded-xl bg-blue-600 text-white shadow-2xl mb-4"
          >
            <Users size={28} />
          </motion.div>
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-3xl md:text-4xl font-serif font-black text-stone-900 tracking-tight"
          >
            {isRTL ? "بوابة الأقسام الإدارية والمساندة" : "Staff & Support Systems Portal"}
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-stone-400 text-sm font-medium max-w-lg"
          >
            {isRTL ? "حدد القسم المطلوب لتسجيل الدخول للوحة التحكم الخاصة به" : "Select a department to access its administrative dashboard"}
          </motion.p>
        </header>

        {/* Sub-Portals Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {subPortals.map((portal) => (
            <motion.div
              key={portal.id}
              variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
              whileHover={{ y: -5 }}
              onClick={() => handlePortalClick(portal.path, portal.id)}
              className="group cursor-pointer"
            >
              <Card className="p-8 border-none shadow-sm hover:shadow-2xl transition-all duration-500 rounded-[24px] bg-white relative overflow-hidden h-full flex flex-col items-center text-center">
                <div className={`h-16 w-16 rounded-[20px] ${portal.color} flex items-center justify-center mb-4 shadow-xl group-hover:scale-110 transition-transform duration-500`}>
                  <portal.icon size={32} />
                </div>
                
                <h3 className="text-lg font-serif font-black text-stone-900 mb-1.5 group-hover:text-primary transition-colors">
                  {isRTL ? portal.label.ar : portal.label.en}
                </h3>
                <p className="text-stone-400 text-xs font-medium mb-4">
                  {isRTL ? "تسجيل الدخول للقسم" : "Access department dashboard"}
                </p>
                
                <div className="mt-auto">
                  <div className={`h-8 w-8 rounded-full border-2 border-stone-50 flex items-center justify-center text-stone-200 group-hover:border-primary group-hover:text-primary transition-all duration-500`}>
                    {isRTL ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                  </div>
                </div>

                {/* Hover Background Pattern */}
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none">
                  <portal.icon size={60} />
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <footer className="mt-12 text-center">
          <p className="text-stone-400 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">
            {isRTL ? "مدعوم من" : "Powered by"} 
            <span className="text-stone-900 font-black">EduTrack Advanced Engine</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            V 2.0.4
          </p>
        </footer>
      </div>

      {/* DEPARTMENT LOGIN DIALOG */}
      <AnimatePresence>
        {selectedDept && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
              onClick={() => setSelectedDept(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
            >
              <div 
                className="w-full max-w-md rounded-[28px] bg-white shadow-2xl border border-stone-100 overflow-hidden relative pointer-events-auto"
                onClick={e => e.stopPropagation()}
              >
                {/* Header */}
                <div className="p-6 pb-4 relative">
                  <button
                    onClick={() => setSelectedDept(null)}
                    className="absolute top-4 end-4 h-8 w-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-700 transition-all cursor-pointer"
                  >
                    <X size={16} />
                  </button>

                  <div className="flex items-center gap-4">
                    <div className={`h-14 w-14 rounded-[16px] ${selectedDept.color} flex items-center justify-center shadow-lg shrink-0`}>
                      <selectedDept.icon size={28} />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-stone-900 font-serif leading-tight">
                        {isRTL ? `تسجيل دخول | قسم ${selectedDept.label.ar}` : `Login | ${selectedDept.label.en}`}
                      </h2>
                      <p className="text-stone-400 text-xs font-semibold mt-0.5">
                        {isRTL ? "أدخل المعرف الوظيفي أو البريد مع كلمة المرور للتحقق" : "Enter employee ID/Email and password to verify"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-stone-100 mx-6" />

                {/* Form */}
                <form onSubmit={handleDeptLogin} className="p-6 space-y-5">
                  <AnimatePresence mode="wait">
                    {errorMsg && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600"
                      >
                        <AlertCircle className="shrink-0 mt-0.5" size={15} />
                        <p className="text-xs font-bold leading-relaxed">{errorMsg}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-2">
                    <label className="block text-[11px] font-black uppercase tracking-wider text-stone-500">
                      {isRTL ? "البريد الإلكتروني / الرقم الوظيفي" : "Email / Employee ID"}
                    </label>
                    <Input
                      type="text"
                      required
                      value={identifier}
                      onChange={e => setIdentifier(e.target.value)}
                      placeholder={isRTL ? "أدخل البريد الإلكتروني أو الرقم الوظيفي للموظف" : "Enter employee email or ID"}
                      className="h-12 rounded-xl border-stone-200 bg-stone-50 font-semibold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[11px] font-black uppercase tracking-wider text-stone-500">
                      {isRTL ? "كلمة المرور" : "Password"}
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-12 rounded-xl border-stone-200 bg-stone-50 font-semibold pr-12 pl-4"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={`absolute inset-y-0 flex items-center justify-center text-stone-400 hover:text-stone-600 w-10 h-10 my-auto cursor-pointer ${
                          isRTL ? "left-1" : "right-1"
                        }`}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-xl bg-primary text-white font-serif font-black text-sm tracking-wide shadow-lg shadow-primary/20 hover:bg-primary/90 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:scale-100 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        <span>{isRTL ? "جاري التحقق من الموظف..." : "Verifying..."}</span>
                      </>
                    ) : (
                      <>
                        <Lock size={15} />
                        <span>{isRTL ? "تأكيد والذهاب للقسم" : "Verify & Access Department"}</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
