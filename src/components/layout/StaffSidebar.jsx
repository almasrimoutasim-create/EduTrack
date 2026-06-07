import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, Calendar, CreditCard, ShieldCheck, MessageSquare, LogOut, Settings, DollarSign, Menu, X, FileText,
  GraduationCap, Layers, ShoppingCart, ShoppingBag, FileSpreadsheet
} from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/lib/LanguageContext";
import { useAuth } from "@/lib/AuthContext";

export default function StaffSidebar() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const { logout } = useAuth();

  const portalRole = localStorage.getItem("portal_role") || "staff";

  const handleLogout = () => {
    localStorage.removeItem("portal_role");
    localStorage.removeItem("portal_user_id");
    localStorage.removeItem("portal_user_name");
    localStorage.removeItem("portal_user");
    logout(false);
    window.location.href = "/";
  };

  const navGroups = [];

  if (portalRole === "staff" || portalRole === "security") {
    navGroups.push({
      label: isRTL ? "الرئيسية" : "Overview",
      items: [
        { label: isRTL ? "بوابة الأقسام" : "Departments Portal", path: "/staff-portal", icon: LayoutDashboard }
      ]
    });
  }

  if (portalRole === "registrar") {
    navGroups.push({
      label: isRTL ? "قسم المسجل" : "Registrar Department",
      items: [
        { label: isRTL ? "دليل الطلاب" : "Student Directory", path: "/student-directory", icon: Users },
        { label: isRTL ? "حضور الطلاب" : "Student Attendance", path: "/attendance", icon: Calendar }
      ]
    });
  } else if (portalRole === "hr") {
    navGroups.push({
      label: isRTL ? "الموارد البشرية" : "HR Department",
      items: [
        { label: isRTL ? "التحكم بالموظفين" : "Staff Control", path: "/staff-control", icon: ShieldCheck },
        { label: isRTL ? "سجل النظام" : "Audit Log", path: "/audit-log", icon: FileText }
      ]
    });
  } else if (portalRole === "accountant") {
    navGroups.push(
      {
        label: isRTL ? "نظرة عامة" : "Overview",
        items: [
          { label: isRTL ? "لوحة التحكم المالية" : "Dashboard", path: "/finance", icon: LayoutDashboard },
        ]
      },
      {
        label: isRTL ? "الإيرادات" : "Revenue",
        items: [
          { label: isRTL ? "الرسوم الدراسية" : "Tuition Fees",    path: "/finance?tab=tuition",       icon: GraduationCap },
          { label: isRTL ? "تسعيرة الصفوف" : "Fee Structures",    path: "/finance?tab=structures",     icon: Layers },
          { label: isRTL ? "رسوم الأنشطة" : "Activity Fees",      path: "/finance?tab=activities",     icon: Calendar },
          { label: isRTL ? "إيرادات أخرى" : "Other Revenue",      path: "/finance?tab=other-revenue",  icon: DollarSign },
        ]
      },
      {
        label: isRTL ? "المصروفات" : "Expenses",
        items: [
          { label: isRTL ? "المصروفات العامة" : "Expenses",        path: "/finance?tab=expenses",        icon: CreditCard },
          { label: isRTL ? "طلبات المشتريات" : "Purchase Orders",  path: "/finance?tab=purchase-orders", icon: ShoppingCart },
        ]
      },
      {
        label: isRTL ? "المتجر والمحافظ" : "Store",
        items: [
          { label: isRTL ? "مبيعات المتجر والمحافظ" : "Store & Wallets", path: "/finance?tab=store", icon: ShoppingBag },
        ]
      },
      {
        label: isRTL ? "التقارير" : "Reports",
        items: [
          { label: isRTL ? "التقارير المالية" : "Reports", path: "/finance?tab=reports", icon: FileSpreadsheet },
        ]
      }
    );
  }

  return (
    <>


      <button
        className={cn(
          "fixed top-4 z-50 lg:hidden no-print bg-white/80 backdrop-blur-md shadow-sm rounded-xl border border-stone-100 cursor-pointer text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-lg w-10 h-10 p-0 flex items-center justify-center",
          isRTL ? "right-4" : "left-4"
        )}
        onClick={() => setOpen(!open)}>
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <div className="fixed inset-0 bg-stone-900/20 backdrop-blur-sm z-30 lg:hidden" onClick={() => setOpen(false)} />
      )}

      <aside className={cn(
        "fixed top-0 h-full w-64 bg-white z-40 flex flex-col transition-all duration-500 no-print border-stone-100 shadow-2xl lg:shadow-none",
        isRTL ? "right-0 border-l" : "left-0 border-r",
        "lg:translate-x-0",
        open ? "translate-x-0" : (isRTL ? "translate-x-full" : "-translate-x-full")
      )}>
        {/* Logo Section */}
        <div className="p-8 pb-6">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30 group-hover:scale-110 transition-transform">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="font-serif text-xl font-bold text-stone-900 leading-none">إديوتراك</h1>
              <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-1">{isRTL ? "بوابة الموظف" : "Staff Portal"}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 overflow-y-auto space-y-8 scrollbar-hide">
          {navGroups.map((group) => (
            <div key={group.label} className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-300 px-4">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = item.path.includes("?") 
                    ? (location.pathname + location.search) === item.path
                    : location.pathname === item.path;
                  return (
                    <Link
                      key={item.label}
                      to={item.path}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 relative group",
                        isActive ?
                        "bg-blue-600 text-white shadow-xl shadow-blue-600/20" :
                        "text-stone-500 hover:bg-stone-50 hover:text-stone-900"
                      )}
                    >
                      <item.icon className={cn("h-5 w-5 shrink-0 transition-transform group-hover:scale-110", isActive ? "text-white" : "text-stone-400 group-hover:text-blue-600")} />
                      {item.label}
                      {isActive && (
                        <motion.div 
                          layoutId="activeTabStaff"
                          className={cn(
                            "absolute w-1.5 h-6 bg-yellow-400 rounded-full",
                            isRTL ? "left-2" : "right-2"
                          )}
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-6 border-t border-stone-50 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-50">
            <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">
              {isRTL ? "اللغة" : "Language"}
            </span>
            <LanguageSwitcher />
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm font-bold text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
          >
            <LogOut className="h-5 w-5" />
            {isRTL ? "تسجيل الخروج" : "Log out"}
          </button>
        </div>
      </aside>
    </>
  );
}