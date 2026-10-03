import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  DollarSign,
  Settings,
  BookOpen,
  GraduationCap,
  ShoppingCart,
  Calendar,
  FileText,
} from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { cn } from "@/lib/utils";

const NAVS = {
  admin: [
    { path: "/dashboard", icon: LayoutDashboard, ar: "الرئيسية", en: "Home" },
    { path: "/students", icon: Users, ar: "الطلاب", en: "Students" },
    { path: "/attendance", icon: ClipboardCheck, ar: "الحضور", en: "Attend." },
    { path: "/finance", icon: DollarSign, ar: "المالية", en: "Finance" },
    { path: "/settings", icon: Settings, ar: "الإعدادات", en: "Settings" },
  ],
  registrar: [
    { path: "/student-directory", icon: LayoutDashboard, ar: "الرئيسية", en: "Home" },
    { path: "/registrar/enrollment", icon: FileText, ar: "التسجيل", en: "Enroll" },
    { path: "/attendance", icon: ClipboardCheck, ar: "الحضور", en: "Attend." },
    { path: "/grades", icon: GraduationCap, ar: "الدرجات", en: "Grades" },
    { path: "/subjects", icon: BookOpen, ar: "الفصول", en: "Classes" },
  ],
  hr: [
    { path: "/staff-control", icon: LayoutDashboard, ar: "الرئيسية", en: "Home" },
    { path: "/staff/attendance", icon: ClipboardCheck, ar: "الحضور", en: "Attend." },
    { path: "/staff/payroll", icon: DollarSign, ar: "الرواتب", en: "Payroll" },
    { path: "/staff/leaves", icon: Calendar, ar: "الإجازات", en: "Leaves" },
    { path: "/staff/reports", icon: FileText, ar: "التقارير", en: "Reports" },
  ],
  store: [
    { path: "/store", icon: ShoppingCart, ar: "المنتجات", en: "Products" },
    { path: "/store/pos", icon: DollarSign, ar: "البيع", en: "POS" },
    { path: "/store/orders", icon: FileText, ar: "الطلبات", en: "Orders" },
    { path: "/store/inventory", icon: BookOpen, ar: "المخزون", en: "Stock" },
    { path: "/staff-portal", icon: LayoutDashboard, ar: "البوابة", en: "Hub" },
  ],
  accountant: [
    { path: "/finance", icon: LayoutDashboard, ar: "الرئيسية", en: "Home" },
    { path: "/finance?tab=tuition", icon: GraduationCap, ar: "الرسوم", en: "Fees" },
    { path: "/finance?tab=expenses", icon: DollarSign, ar: "المصروفات", en: "Expenses" },
    { path: "/finance?tab=store", icon: ShoppingCart, ar: "المتجر", en: "Store" },
    { path: "/finance?tab=reports", icon: FileText, ar: "التقارير", en: "Reports" },
  ],
  library: [
    { path: "/library", icon: BookOpen, ar: "الكتب", en: "Books" },
    { path: "/dashboard", icon: LayoutDashboard, ar: "الرئيسية", en: "Home" },
    { path: "/students", icon: Users, ar: "الطلاب", en: "Students" },
    { path: "/activity", icon: Calendar, ar: "النشاط", en: "Activity" },
    { path: "/settings", icon: Settings, ar: "الإعدادات", en: "Settings" },
  ],
};

export default function MobileBottomNav({ role = "admin" }) {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const items = NAVS[role] || NAVS.admin;

  return (
    <nav
      aria-label={isRTL ? "التنقل السريع" : "Quick navigation"}
      className="fixed bottom-0 right-0 left-0 z-40 lg:hidden no-print border-t border-stone-200/80 bg-white/95 backdrop-blur-md shadow-[0_-8px_30px_rgba(0,0,0,0.06)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid grid-cols-5 gap-1 px-2 pt-2" style={{ paddingBottom: "0.5rem" }}>
        {items.map((item) => (
          <NavLink
            key={item.path + item.ar}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center gap-1 rounded-xl py-1.5 text-[10px] font-bold transition-colors min-h-[56px]",
                isActive ? "text-primary bg-primary/10" : "text-stone-500 hover:text-stone-900 hover:bg-stone-100"
              )
            }
          >
            <item.icon className="h-5 w-5 shrink-0" />
            <span className="leading-tight truncate max-w-full px-0.5">
              {isRTL ? item.ar : item.en}
            </span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
