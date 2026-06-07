import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, ClipboardCheck,
  FileText, ShoppingCart, Menu, X, Newspaper, Trophy, DollarSign, Shield, BarChart3, LogOut,
  Calendar, FileSpreadsheet, Award, History, Layers, Clock, FolderArchive, HelpCircle, Settings,
  Briefcase, CreditCard, Search, Percent, AlertTriangle, PlusCircle, UserCheck, ArrowLeft, MessageSquare,
  Megaphone
} from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/translations";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";

const BRAND_CONFIGS = {
  admin: {
    title: { ar: "إديوتراك", en: "EduTrack" },
    subtitle: { ar: "مدير النظام", en: "System Admin" },
    color: "bg-primary text-white shadow-primary/30",
    activeColor: "bg-primary text-white shadow-xl shadow-primary/20",
    iconColor: "text-stone-400 group-hover:text-primary",
    logoIcon: GraduationCap,
    activeTabLayoutId: "activeTabAdmin"
  },
  registrar: {
    title: { ar: "إديوتراك", en: "EduTrack" },
    subtitle: { ar: "بوابة المسجل", en: "Registrar Portal" },
    color: "bg-orange-600 text-white shadow-orange-600/30",
    activeColor: "bg-orange-600 text-white shadow-xl shadow-orange-600/20",
    iconColor: "text-stone-400 group-hover:text-orange-600",
    logoIcon: FileText,
    activeTabLayoutId: "activeTabRegistrar"
  },
  hr: {
    title: { ar: "إديوتراك", en: "EduTrack" },
    subtitle: { ar: "بوابة الموارد البشرية", en: "HR Portal" },
    color: "bg-purple-600 text-white shadow-purple-600/30",
    activeColor: "bg-purple-600 text-white shadow-xl shadow-purple-600/20",
    iconColor: "text-stone-400 group-hover:text-purple-600",
    logoIcon: Users,
    activeTabLayoutId: "activeTabHR"
  },
  library: {
    title: { ar: "إديوتراك", en: "EduTrack" },
    subtitle: { ar: "بوابة أمين المكتبة", en: "Library Portal" },
    color: "bg-emerald-600 text-white shadow-emerald-600/30",
    activeColor: "bg-emerald-600 text-white shadow-xl shadow-emerald-600/20",
    iconColor: "text-stone-400 group-hover:text-emerald-600",
    logoIcon: BookOpen,
    activeTabLayoutId: "activeTabLibrary"
  },
  store: {
    title: { ar: "إديوتراك", en: "EduTrack" },
    subtitle: { ar: "متجر المدرسة", en: "School Store" },
    color: "bg-blue-600 text-white shadow-blue-600/30",
    activeColor: "bg-blue-600 text-white shadow-xl shadow-blue-600/20",
    iconColor: "text-stone-400 group-hover:text-blue-600",
    logoIcon: ShoppingCart,
    activeTabLayoutId: "activeTabStore"
  },
  accountant: {
    title: { ar: "إديوتراك", en: "EduTrack" },
    subtitle: { ar: "بوابة المحاسب", en: "Accountant Portal" },
    color: "bg-rose-600 text-white shadow-rose-600/30",
    activeColor: "bg-rose-600 text-white shadow-xl shadow-rose-600/20",
    iconColor: "text-stone-400 group-hover:text-rose-600",
    logoIcon: DollarSign,
    activeTabLayoutId: "activeTabAccountant"
  }
};

export default function Sidebar() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const { language } = useLanguage();
  const { logout } = useAuth();
  const isRTL = language === "ar";

  const portalRole = localStorage.getItem("portal_role") || "admin";
  const brand = BRAND_CONFIGS[portalRole] || BRAND_CONFIGS.admin;

  const getNavGroups = () => {
    switch (portalRole) {
      case "registrar":
        return [
          {
            label: isRTL ? "الرئيسية" : "Overview",
            items: [
              { label: isRTL ? "لوحة التحكم" : "Dashboard", path: "/student-directory", icon: LayoutDashboard }
            ]
          },
          {
            label: isRTL ? "إدارة الطلاب" : "Student Management",
            items: [
              { label: isRTL ? "الطلاب" : "Students", path: "/student-directory", icon: Users },
              { label: isRTL ? "إضافة طالب" : "Add Student", path: "#", icon: PlusCircle },
              { label: isRTL ? "تسجيل الطلاب" : "Student Registration", path: "#", icon: UserCheck },
              { label: isRTL ? "الملفات الأكاديمية" : "Academic Files", path: "#", icon: FolderArchive },
              { label: isRTL ? "الحضور والغياب" : "Attendance", path: "/attendance", icon: Clock }
            ]
          },
          {
            label: isRTL ? "الإدارة الأكاديمية" : "Academic Admin",
            items: [
              { label: isRTL ? "الفصول والشعب" : "Classes", path: "/subjects", icon: BookOpen },
              { label: isRTL ? "الجداول الدراسية" : "Schedules", path: "/schedules", icon: Calendar },
              { label: isRTL ? "الامتحانات" : "Exams", path: "#", icon: FileText },
              { label: isRTL ? "الدرجات والنتائج" : "Grades & Results", path: "#", icon: Trophy }
            ]
          },
          {
            label: isRTL ? "الوثائق والطباعة" : "Documents & Print",
            items: [
              { label: isRTL ? "الشهادات والطباعة" : "Certificates & Print", path: "/card", icon: Award },
              { label: isRTL ? "الأرشيف" : "Archive", path: "#", icon: FolderArchive }
            ]
          },
          {
            label: isRTL ? "التقارير" : "Reports",
            items: [
              { label: isRTL ? "تقارير التسجيل" : "Registration Reports", path: "/attendance-summary", icon: FileSpreadsheet }
            ]
          }
        ];

      case "hr":
        return [
          {
            label: isRTL ? "الرئيسية" : "Overview",
            items: [
              { label: isRTL ? "لوحة التحكم" : "Dashboard", path: "/staff-control", icon: LayoutDashboard }
            ]
          },
          {
            label: isRTL ? "الموظفون" : "Staff Management",
            items: [
              { label: isRTL ? "قائمة الموظفين" : "Employee List", path: "/staff-control", icon: Users },
              { label: isRTL ? "إضافة موظف" : "Add Employee", path: "#", icon: PlusCircle },
              { label: isRTL ? "العقود" : "Contracts", path: "#", icon: Briefcase },
              { label: isRTL ? "الرواتب" : "Salaries & Payroll", path: "#", icon: DollarSign },
              { label: isRTL ? "الحضور والانصراف" : "Attendance", path: "#", icon: Clock }
            ]
          },
          {
            label: isRTL ? "الإدارة الوظيفية" : "Job Management",
            items: [
              { label: isRTL ? "الإجازات" : "Leaves & Vacations", path: "#", icon: Calendar },
              { label: isRTL ? "الطلبات" : "Employee Requests", path: "#", icon: FileText },
              { label: isRTL ? "التقييمات" : "Evaluations", path: "#", icon: Award }
            ]
          },
          {
            label: isRTL ? "التقارير والإعدادات" : "Reports & Settings",
            items: [
              { label: isRTL ? "تقارير الموارد البشرية" : "HR Reports", path: "#", icon: FileSpreadsheet },
              { label: isRTL ? "الأقسام الوظيفية" : "Departments", path: "#", icon: Layers },
              { label: isRTL ? "السلم الوظيفي" : "Career Ladder", path: "#", icon: Trophy }
            ]
          }
        ];

      case "library":
        return [
          {
            label: isRTL ? "الرئيسية" : "Overview",
            items: [
              { label: isRTL ? "لوحة التحكم" : "Dashboard", path: "/library", icon: LayoutDashboard }
            ]
          },
          {
            label: isRTL ? "إدارة الكتب" : "Book Management",
            items: [
              { label: isRTL ? "الكتب" : "Books Catalog", path: "/library", icon: BookOpen },
              { label: isRTL ? "إضافة كتاب" : "Add Book", path: "#", icon: PlusCircle },
              { label: isRTL ? "التصنيفات" : "Categories", path: "#", icon: Layers },
              { label: isRTL ? "البحث" : "Search Catalog", path: "#", icon: Search }
            ]
          },
          {
            label: isRTL ? "الاستعارات" : "Borrowings & Returns",
            items: [
              { label: isRTL ? "استعارة كتاب" : "Borrow Book", path: "#", icon: HelpCircle },
              { label: isRTL ? "إرجاع كتاب" : "Return Book", path: "#", icon: History },
              { label: isRTL ? "سجل الاستعارات" : "Borrowing Log", path: "#", icon: FileSpreadsheet },
              { label: isRTL ? "الغرامات" : "Library Fines", path: "#", icon: AlertTriangle }
            ]
          },
          {
            label: isRTL ? "التقارير" : "Reports",
            items: [
              { label: isRTL ? "تقارير المكتبة" : "Library Reports", path: "#", icon: FileSpreadsheet }
            ]
          }
        ];

      case "store":
        return [
          {
            label: isRTL ? "إدارة المنتجات" : "Product Management",
            items: [
              { label: isRTL ? "المنتجات" : "Products List", path: "/store", icon: ShoppingCart },
              { label: isRTL ? "إضافة منتج" : "Add Product", path: "#", icon: PlusCircle },
              { label: isRTL ? "التصنيفات" : "Categories", path: "#", icon: Layers },
              { label: isRTL ? "المخزون" : "Inventory Control", path: "#", icon: FolderArchive }
            ]
          },
          {
            label: isRTL ? "الطلبات والمبيعات" : "Orders & Sales",
            items: [
              { label: isRTL ? "الطلبات" : "Sales Orders", path: "#", icon: FileText },
              { label: isRTL ? "تفاصيل الطلب" : "Order Details", path: "#", icon: History },
              { label: isRTL ? "السلة" : "Shopping Cart", path: "#", icon: ShoppingCart },
              { label: isRTL ? "الدفع" : "Payments Cashier", path: "#", icon: DollarSign }
            ]
          },
          {
            label: isRTL ? "التقارير" : "Reports",
            items: [
              { label: isRTL ? "تقارير المبيعات" : "Sales Reports", path: "#", icon: FileSpreadsheet }
            ]
          }
        ];

      case "accountant":
        return [
          {
            label: isRTL ? "الرئيسية" : "Overview",
            items: [
              { label: isRTL ? "لوحة التحكم" : "Dashboard", path: "/finance", icon: LayoutDashboard }
            ]
          },
          {
            label: isRTL ? "الرسوم والمدفوعات" : "Fees & Payments",
            items: [
              { label: isRTL ? "الرسوم الدراسية" : "Tuition Fees", path: "/finance", icon: DollarSign },
              { label: isRTL ? "إضافة رسوم" : "Add New Fee", path: "#", icon: PlusCircle },
              { label: isRTL ? "المدفوعات" : "Payments", path: "#", icon: CreditCard },
              { label: isRTL ? "سندات القبض" : "Receipt Vouchers", path: "#", icon: FileText },
              { label: isRTL ? "الأقساط" : "Installments", path: "#", icon: Calendar }
            ]
          },
          {
            label: isRTL ? "الإدارة المالية" : "Financial Management",
            items: [
              { label: isRTL ? "الإيرادات" : "Revenues", path: "#", icon: DollarSign },
              { label: isRTL ? "المصروفات" : "Expenses", path: "#", icon: CreditCard },
              { label: isRTL ? "الخصومات" : "Discounts", path: "#", icon: Percent },
              { label: isRTL ? "الغرامات" : "Fines", path: "#", icon: AlertTriangle }
            ]
          },
          {
            label: isRTL ? "الدفع الإلكتروني" : "Electronic Payments",
            items: [
              { label: isRTL ? "بوابات الدفع" : "Payment Gateways", path: "#", icon: CreditCard },
              { label: isRTL ? "إعدادات الدفع" : "Payment Settings", path: "#", icon: Settings }
            ]
          },
          {
            label: isRTL ? "الحسابات" : "Accounts",
            items: [
              { label: isRTL ? "كشف حساب الطالب" : "Student Statement", path: "#", icon: Users },
              { label: isRTL ? "إشعارات المالية" : "Financial Alerts", path: "#", icon: FileText }
            ]
          },
          {
            label: isRTL ? "التقارير" : "Reports",
            items: [
              { label: isRTL ? "التقارير المالية" : "Financial Reports", path: "#", icon: FileSpreadsheet }
            ]
          }
        ];

      default: // admin
        return [
          {
            label: isRTL ? "نظرة عامة" : "Overview",
            items: [
              { label: t("common.dashboard", language), path: "/", icon: LayoutDashboard }
            ]
          },
          {
            label: isRTL ? "الأشخاص" : "People",
            items: [
              { label: t("common.students", language), path: "/students", icon: Users },
              { label: t("common.teachers", language), path: "/teachers", icon: GraduationCap }
            ]
          },
          {
            label: isRTL ? "الأكاديميات" : "Academics",
            items: [
              { label: t("common.subjects", language), path: "/subjects", icon: BookOpen },
              { label: t("common.attendance", language), path: "/attendance", icon: ClipboardCheck },
              { label: isRTL ? "ملخص الحضور" : "Attendance Summary", path: "/attendance-summary", icon: BarChart3 },
              { label: isRTL ? "الجداول الدراسية" : "Schedules", path: "/schedules", icon: Calendar },
              { label: t("common.materials", language), path: "/materials", icon: FileText },
              { label: t("common.activity", language), path: "/activity", icon: Newspaper },
              { label: t("common.awards", language), path: "/awards", icon: Trophy }
            ]
          },
          {
            label: isRTL ? "الأنظمة المساندة" : "Support Systems",
            items: [
              { label: t("common.library", language), path: "/library", icon: BookOpen },
              { label: t("common.store", language), path: "/store", icon: ShoppingCart },
              { label: t("common.finance", language), path: "/finance", icon: DollarSign },
              { label: t("common.staffControl", language), path: "/staff-control", icon: Shield }
            ]
          },
          {
            label: isRTL ? "التواصل" : "Communication",
            items: [
              { label: isRTL ? "مراقبة المحادثات" : "Monitor Chats", path: "/admin-chats", icon: MessageSquare },
              { label: isRTL ? "التعاميم والقرارات" : "Official Announcements", path: "/official-announcements", icon: Megaphone }
            ]
          }
        ];
    }
  };

  const navGroups = getNavGroups();

  return (
    <>

      <button
        className={cn(
          "fixed top-4 z-50 lg:hidden no-print bg-white/80 backdrop-blur-md shadow-sm rounded-xl border border-stone-100 cursor-pointer text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-lg w-10 h-10 p-0 flex items-center justify-center",
          isRTL ? "right-4" : "left-4"
        )}
        style={{ color: '#1c1917' }}
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
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => {
            if (portalRole !== "admin") {
              localStorage.setItem("portal_role", "staff");
              window.location.href = "/staff-portal";
            } else {
              window.location.href = "/";
            }
          }}>
            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300", brand.color)}>
              <brand.logoIcon size={24} />
            </div>
            <div>
              <h1 className="font-serif text-xl font-bold text-stone-900 leading-none">
                {isRTL ? brand.title.ar : brand.title.en}
              </h1>
              <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-1">
                {isRTL ? brand.subtitle.ar : brand.subtitle.en}
              </p>
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
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.label}
                      to={item.path}
                      onClick={(e) => {
                        setOpen(false);
                        if (item.path === "#") {
                          e.preventDefault();
                          toast.info(isRTL ? `قسم (${item.label}) سيتم تفعيله قريباً` : `${item.label} section will be activated soon`);
                        }
                      }}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 relative group",
                        isActive ?
                        brand.activeColor :
                        "text-stone-500 hover:bg-stone-50 hover:text-stone-900"
                      )}
                    >
                      <item.icon className={cn("h-5 w-5 shrink-0 transition-transform group-hover:scale-110", isActive ? "text-white" : brand.iconColor)} />
                      {item.label}
                      {isActive && (
                        <motion.div 
                          layoutId={brand.activeTabLayoutId}
                          className={cn(
                            "absolute w-1.5 h-6 bg-white rounded-full",
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
          <div className="rounded-[24px] bg-stone-50 p-4 border border-stone-100">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">
              {isRTL ? "العام الأكاديمي" : "Academic Year"}
            </p>
            <p className="text-sm font-black text-stone-800">2025 – 2026</p>
          </div>

          {portalRole !== "admin" && portalRole !== "store" && (
            <button
              onClick={() => {
                localStorage.setItem("portal_role", "staff");
                window.location.href = "/staff-portal";
              }}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"
            >
              <ArrowLeft className={cn("h-5 w-5", isRTL ? "rotate-180" : "")} />
              {isRTL ? "بوابة الموظفين" : "Staff Hub"}
            </button>
          )}
          
          <button
            onClick={() => logout()}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm font-bold text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
          >
            <LogOut className="h-5 w-5" />
            {t("common.logout", language)}
          </button>
        </div>
      </aside>
    </>
  );
}