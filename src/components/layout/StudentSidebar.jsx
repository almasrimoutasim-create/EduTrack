import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, BookOpen, ClipboardCheck,
  FileText, Menu, X, Calendar, Star, Trophy, Rocket, LogOut
} from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/lib/LanguageContext";
import { useAuth } from "@/lib/AuthContext";

export default function StudentSidebar() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const { logout } = useAuth();

  const handleLogout = () => {
    localStorage.removeItem("portal_role");
    localStorage.removeItem("portal_user_id");
    localStorage.removeItem("portal_user_name");
    logout(false);
    window.location.href = "/";
  };

  const navGroups = [
    {
      label: isRTL ? "الرئيسية" : "Overview",
      items: [
        { label: isRTL ? "لوحة التحكم" : "Dashboard", path: "/student-portal", icon: LayoutDashboard },
        { label: isRTL ? "الجدول الدراسي" : "Schedule", path: "#", icon: Calendar }
      ]
    },
    {
      label: isRTL ? "الدراسة" : "Study",
      items: [
        { label: isRTL ? "الواجبات" : "Homework", path: "#", icon: FileText },
        { label: isRTL ? "المواد الدراسية" : "Materials", path: "#", icon: BookOpen },
        { label: isRTL ? "الدرجات" : "Grades", path: "#", icon: Star },
        { label: isRTL ? "سجل الحضور" : "Attendance", path: "#", icon: ClipboardCheck }
      ]
    },
    {
      label: isRTL ? "الإنجازات" : "Achievements",
      items: [
        { label: isRTL ? "الأوسمة" : "Badges", path: "#", icon: Trophy },
        { label: isRTL ? "النقاط والمستويات" : "Levels & XP", path: "#", icon: Rocket }
      ]
    }
  ];

  return (
    <>
      <div className={cn(
        "fixed top-4 z-50 no-print transition-all duration-300",
        isRTL ? "left-4" : "right-4"
      )}>
        <LanguageSwitcher />
      </div>

      <Button
        variant="ghost" size="icon"
        className={cn(
          "fixed top-4 z-50 lg:hidden no-print bg-white/80 backdrop-blur-md shadow-sm rounded-xl border border-stone-100",
          isRTL ? "right-4" : "left-4"
        )}
        onClick={() => setOpen(!open)}>
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

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
            <div className="h-10 w-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-600/30 group-hover:scale-110 transition-transform">
              <Rocket size={24} />
            </div>
            <div>
              <h1 className="font-serif text-xl font-bold text-stone-900 leading-none">إديوتراك</h1>
              <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-1">Student Portal</p>
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
                  const isActive = location.pathname === item.path || (item.path !== "#" && location.pathname.startsWith(item.path) && item.path !== "/");
                  return (
                    <Link
                      key={item.label}
                      to={item.path}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 relative group",
                        isActive ?
                        "bg-teal-600 text-white shadow-xl shadow-teal-600/20" :
                        "text-stone-500 hover:bg-stone-50 hover:text-stone-900"
                      )}
                    >
                      <item.icon className={cn("h-5 w-5 shrink-0 transition-transform group-hover:scale-110", isActive ? "text-white" : "text-stone-400 group-hover:text-teal-600")} />
                      {item.label}
                      {isActive && (
                        <motion.div 
                          layoutId="activeTabStudent"
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
