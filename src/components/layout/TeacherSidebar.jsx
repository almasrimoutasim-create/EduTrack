import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, BookOpen, ClipboardCheck,
  FileText, Menu, X, Calendar, MessageCircle, Star, LogOut, Video, Bell, Award
} from "lucide-react";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { entities } from "@/api/dbClient";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/lib/LanguageContext";
import { useAuth } from "@/lib/AuthContext";

export default function TeacherSidebar() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const { logout } = useAuth();

  const teacherId = localStorage.getItem("portal_user_id") || "T-202";

  const { data: allMessages = [] } = useQuery({
    queryKey: ["private-messages-sidebar-teacher", teacherId],
    queryFn: () => entities.PrivateMessage.list(),
    refetchInterval: 5000
  });

  const unreadCount = allMessages.filter(m => m.receiver_id === teacherId && !m.is_read).length;

  const { data: officialAnnouncements = [] } = useQuery({
    queryKey: ["official-announcements-sidebar-teacher"],
    queryFn: () => entities.OfficialAnnouncement.list("-created_at")
  });
  
  const teacherAnnouncements = officialAnnouncements.filter(
    a => a.target_audience === "teachers" || a.target_audience === "all"
  );
  
  const readAnnouncements = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("read_announcements") || "[]");
    } catch {
      return [];
    }
  }, [officialAnnouncements]);
  
  const unreadAnnouncementsCount = teacherAnnouncements.filter(
    a => !readAnnouncements.includes(a.id)
  ).length;

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
        { label: isRTL ? "لوحة التحكم" : "Dashboard", path: "/teacher-portal", icon: LayoutDashboard },
        { label: isRTL ? "الجدول الأسبوعي" : "Schedule", path: "/teacher-portal?view=schedule", icon: Calendar }
      ]
    },
    {
      label: isRTL ? "الأكاديميات" : "Academics",
      items: [
        { label: isRTL ? "فصولي" : "My Classes", path: "/teacher-portal?tab=classes", icon: BookOpen },
        { label: isRTL ? "الفصول الافتراضية" : "Virtual Classroom", path: "/virtual-classroom/demo", icon: Video },
        { label: isRTL ? "طلابي" : "My Students", path: "/teacher-portal?tab=students", icon: Users },
        { label: isRTL ? "الحضور" : "Attendance", path: "/teacher-portal?tab=attendance", icon: ClipboardCheck },
        { label: isRTL ? "الواجبات والتصحيح" : "Assignments & Grading", path: "/teacher-portal?tab=grading", icon: FileText },
        { label: isRTL ? "الدرجات والنتائج" : "Grades & Results", path: "/teacher-portal?tab=grades", icon: Award },
        { label: isRTL ? "الإرشاد الطلابي" : "Counseling", path: "/counseling/cases", icon: ClipboardCheck },
        { label: isRTL ? "طلباتي" : "My Requests", path: "/teacher-portal?tab=requests", icon: FileText }
      ]
    },
    {
      label: isRTL ? "التواصل والأنشطة" : "Communication",
      items: [
        { label: isRTL ? "الرسائل" : "Messages", path: "/teacher-portal?tab=messages", icon: MessageCircle },
        { label: isRTL ? "الإشعارات" : "Notifications", path: "/teacher-portal?tab=notifications", icon: Bell },
        { label: isRTL ? "الأوسمة" : "Badges", path: "/teacher-portal?tab=badges", icon: Star }
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
        {/* Logo Section */}
        <div className="p-8 pb-6">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="h-10 w-10 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform">
              <BookOpen size={24} />
            </div>
            <div>
              <h1 className="font-serif text-xl font-bold text-stone-900 leading-none">إديوتراك</h1>
              <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-1">Teacher Portal</p>
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
                                   (item.path === "/teacher-portal" && (currentPath === "/teacher-portal?tab=classes" || !location.search));
                  return (
                    <Link
                      key={item.label}
                      to={item.path}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 relative group",
                        isActive ?
                        "bg-stone-900 text-white shadow-xl shadow-stone-900/20" :
                        "text-stone-500 hover:bg-stone-50 hover:text-stone-900"
                      )}
                    >
                      <item.icon className={cn("h-5 w-5 shrink-0 transition-transform group-hover:scale-110", isActive ? "text-white" : "text-stone-400 group-hover:text-stone-900")} />
                      <span className="flex-1">{item.label}</span>
                      {item.label === (isRTL ? "الرسائل" : "Messages") && unreadCount > 0 && (
                        <span className="bg-rose-500 text-white text-[10px] font-black h-5 px-1.5 rounded-full flex items-center justify-center shrink-0">
                          {unreadCount}
                        </span>
                      )}
                      {item.label === (isRTL ? "الإشعارات" : "Notifications") && unreadAnnouncementsCount > 0 && (
                        <span className="bg-rose-500 text-white text-[10px] font-black h-5 px-1.5 rounded-full flex items-center justify-center shrink-0">
                          {unreadAnnouncementsCount}
                        </span>
                      )}
                      {isActive && (
                        <motion.div 
                          layoutId="activeTabTeacher"
                          className={cn(
                            "absolute w-1.5 h-6 bg-amber-500 rounded-full",
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
