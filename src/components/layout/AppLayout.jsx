import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import StudentSidebar from "./StudentSidebar";
import ParentSidebar from "./ParentSidebar";
import TeacherSidebar from "./TeacherSidebar";
import BusSupervisorSidebar from "./BusSupervisorSidebar";
import StaffSidebar from "./StaffSidebar";
import { useLanguage } from "@/lib/LanguageContext";
import { useAuth } from "@/lib/AuthContext";
import { cn } from "@/lib/utils";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { User, ArrowLeft } from "lucide-react";

export default function AppLayout() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRTL = language === "ar";

  const portalRole = localStorage.getItem("portal_role") || user?.role || "admin";

  const PORTAL_HOMES = {
    admin: "/", teacher: "/teacher-portal", student: "/student-portal", parent: "/parent-portal",
    bus: "/staff-portal", bus_supervisor: "/staff-portal", staff: "/staff-portal", registrar: "/staff-portal",
    hr: "/staff-portal", accountant: "/staff-portal", store: "/staff-portal", store_keeper: "/staff-portal", library: "/library",
    security: "/staff-portal", counselor: "/staff-portal", counseling: "/staff-portal", support: "/staff-portal",
  };
  // لوحات التحكم الفعلية لكل قسم إداري (للتمييز بين لوحة التحكم ومحور الأقسام)
  const STAFF_DASHBOARDS = {
    registrar: "/student-directory", bus: "/bus-supervisor", bus_supervisor: "/bus-supervisor",
    store: "/store", store_keeper: "/store", hr: "/staff-control", accountant: "/finance",
    counselor: "/counseling", counseling: "/counseling", security: "/staff-portal", staff: "/staff-portal", support: "/staff-portal",
  };
  const portalHome = PORTAL_HOMES[portalRole] || "/";
  const currentPath = typeof window !== "undefined" ? window.location.pathname : "/";
  const isStaffHubRole = ["registrar","bus","bus_supervisor","store","store_keeper","hr","accountant","counselor","counseling","security","staff","support"].includes(portalRole);
  const staffDashboard = STAFF_DASHBOARDS[portalRole];
  // يظهر في كل الصفحات بما فيها لوحة التحكم
  const showBack = !currentPath.startsWith("/register");

  const handleBackToPortal = () => {
    // للأقسام الإدارية: من لوحة التحكم الخاصة بهم يرجع لمحور الأقسام /staff-portal
    if (isStaffHubRole && staffDashboard && currentPath === staffDashboard) {
      window.location.href = "/staff-portal";
      return;
    }
    // من محور الأقسام نفسه أو من بوابة رئيسية أخرى يرجع لاختيار البوابات
    if (currentPath === portalHome) {
      window.location.href = "/gateway";
    } else {
      window.location.href = portalHome;
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8]" dir={isRTL ? "rtl" : "ltr"}>
      {portalRole === "student" ? (
        <StudentSidebar />
      ) : portalRole === "parent" ? (
        <ParentSidebar />
      ) : portalRole === "teacher" ? (
        <TeacherSidebar />
      ) : portalRole === "bus" ? (
        <BusSupervisorSidebar />
      ) : ["staff", "registrar", "hr", "accountant", "security"].includes(portalRole) ? (
        <StaffSidebar />
      ) : (
        <Sidebar />
      )}
      <main className={cn(
        "min-h-screen transition-all duration-300 flex flex-col",
        isRTL ? "lg:mr-64" : "lg:ml-64"
      )}>
        {/* الشريط العلوي الثابت (Fixed Header) */}
        <header className={cn(
          "h-16 border-b border-stone-100 bg-white/80 backdrop-blur-md fixed top-0 right-0 left-0 z-30 flex items-center justify-between px-6 transition-all duration-300 no-print",
          isRTL ? "lg:mr-64" : "lg:ml-64"
        )}>
          {/* الجانب الأيمن (RTL) / الأيسر (LTR) - معلومات المستخدم */}
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 shadow-inner">
              <User size={16} />
            </div>
            <span className="text-stone-500 text-xs font-bold hidden md:inline-block">
              {isRTL ? `مرحباً، ` : `Welcome, `}
              <span className="text-stone-900 font-extrabold">{user?.full_name || (isRTL ? 'مستخدم إديوتراك' : 'EduTrack User')}</span>
            </span>
          </div>

          {/* الجانب الأيسر (RTL) / الأيمن (LTR) - زر رجوع في اليسار + اللغة */}
          <div className="flex items-center gap-3">
            {showBack && (
              <button onClick={handleBackToPortal} className="h-9 px-4 rounded-xl bg-stone-900 text-white text-xs font-black flex items-center gap-1.5 hover:bg-black transition-colors shadow-md">
                <ArrowLeft size={14} className={isRTL ? "" : "rotate-180"} />
                {isRTL ? "رجوع" : "Back"}
              </button>
            )}
            <div className="flex items-center gap-2">
              <span className="text-stone-400 text-[11px] font-black uppercase tracking-wider hidden sm:inline-block">
                {isRTL ? "اللغة الحالية:" : "Active Language:"}
              </span>
              <LanguageSwitcher />
            </div>
          </div>
        </header>

        {/* محتوى الصفحة الرئيسي مع حساب مسافة الشريط العلوي */}
        <div className="p-5 pt-24 lg:p-8 lg:pt-24 max-w-[1600px] w-full mx-auto flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
}