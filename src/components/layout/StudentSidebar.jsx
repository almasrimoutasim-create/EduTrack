import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, BookOpen, ClipboardCheck,
  FileText, Menu, X, Calendar, Star, Trophy, Rocket, LogOut, ShoppingBag, Video, Bell
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { entities } from "@/api/dbClient";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/lib/LanguageContext";
import { useAuth } from "@/lib/AuthContext";

export default function StudentSidebar() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const { logout, appPublicSettings } = useAuth();
  const s = appPublicSettings?.public_settings || {};
  const shortName = s.sidebar_short_name?.trim();
  const schoolName = shortName || (isRTL ? (s.school_name_ar || "إديوتراك") : (s.school_name_en || "EduTrack"));
  const getLogoUrl = (url) => {
    const trimmed = String(url || '').trim();
    if (!trimmed) return "";
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) return trimmed;
    const apiBase = import.meta.env.VITE_BACKEND_URL || '';
    return `${apiBase.replace(/\/$/, '')}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
  };
  const sidebarLogoUrl = getLogoUrl(s.sidebar_logo || s.school_logo);
  const [sidebarLogoError, setSidebarLogoError] = useState(false);
  useEffect(() => { setSidebarLogoError(false); }, [sidebarLogoUrl, JSON.stringify(s)]);

  const { data: officialAnnouncements = [] } = useQuery({
    queryKey: ["official-announcements-sidebar-student"],
    queryFn: () => entities.OfficialAnnouncement.list("-created_at")
  });
  
  const studentAnnouncements = officialAnnouncements.filter(
    a => a.target_audience === "students" || a.target_audience === "all"
  );
  
  const readAnnouncements = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("read_announcements") || "[]");
    } catch {
      return [];
    }
  }, [officialAnnouncements]);
  
  const unreadAnnouncementsCount = studentAnnouncements.filter(
    a => !readAnnouncements.includes(a.id)
  ).length;

  const handleLogout = () => {
    localStorage.removeItem("portal_role");
    localStorage.removeItem("portal_user_id");
    localStorage.removeItem("portal_user_name");
    logout(false);
    window.location.href = "/gateway";
  };

  const navGroups = [
    {
      label: isRTL ? "الرئيسية" : "Overview",
      items: [
        { label: isRTL ? "لوحة التحكم" : "Dashboard", path: "/student-portal", icon: LayoutDashboard },
        { label: isRTL ? "الجدول الدراسي" : "Schedule", path: "/student-portal?view=schedule", icon: Calendar },
        { label: isRTL ? "الإشعارات" : "Notifications", path: "/student-portal?view=notifications", icon: Bell },
        { label: isRTL ? "متجر المدرسة" : "School Store", path: "/store", icon: ShoppingBag }
      ]
    },
    {
      label: isRTL ? "الدراسة" : "Study",
      items: [
        { label: isRTL ? "الواجبات" : "Homework", path: "/student-portal?view=homework", icon: FileText },
        { label: isRTL ? "المواد الدراسية" : "Materials", path: "/student-portal?view=materials", icon: BookOpen },
        { label: isRTL ? "الفصل الافتراضي" : "Virtual Classroom", path: "/virtual-classroom/demo", icon: Video },
        { label: isRTL ? "الدرجات" : "Grades", path: "/student-portal?view=grades", icon: Star },
        { label: isRTL ? "سجل الحضور" : "Attendance", path: "/student-portal?view=attendance", icon: ClipboardCheck }
      ]
    },
    {
      label: isRTL ? "الإنجازات" : "Achievements",
      items: [
        { label: isRTL ? "الأوسمة" : "Badges", path: "/student-portal?view=badges", icon: Trophy },
        { label: isRTL ? "النقاط والمستويات" : "Levels & XP", path: "/student-portal?view=levels", icon: Rocket }
      ]
    }
  ];

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
        {/* Logo Section — يطابق الإعدادات */}
        <div className="p-8 pb-6">
          <div className={cn("group cursor-pointer", shortName ? "flex flex-col items-center gap-2 text-center" : "flex items-center gap-3")} onClick={() => { const slug = localStorage.getItem("portal_school_slug"); window.location.href = slug ? `/gateway/${slug}` : "/gateway"; }}>
            {sidebarLogoUrl && !sidebarLogoError ? (
              <img key={sidebarLogoUrl} src={sidebarLogoUrl} alt={schoolName} className={cn("rounded-xl object-contain bg-white border border-stone-100 shadow-sm", "h-24 w-24 p-2")} onError={()=>setSidebarLogoError(true)} />
            ) : (
              <div className={cn("rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300", "bg-teal-600 shadow-teal-600/30", "h-24 w-24")}>
                <Rocket size={40} />
              </div>
            )}
            <div className={cn(shortName ? "text-center" : "flex flex-col items-start")}>
              <h1 className={cn("font-serif font-black text-stone-900 leading-none tracking-tight", shortName ? "text-xl" : "text-lg")}>{schoolName}</h1>
              {!shortName && <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-1">{isRTL ? "بوابة الطالب" : "Student Portal"}</p>}
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
                  const currentPath = location.pathname + location.search;
                  const isActive = currentPath === item.path ||
                                   (item.path === "/student-portal" && !location.search);
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
                      <span className="flex-1">{item.label}</span>
                      {item.label === (isRTL ? "الإشعارات" : "Notifications") && unreadAnnouncementsCount > 0 && (
                        <span className="bg-rose-500 text-white text-[10px] font-black h-5 px-1.5 rounded-full flex items-center justify-center shrink-0">
                          {unreadAnnouncementsCount}
                        </span>
                      )}
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
