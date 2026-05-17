import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, ClipboardCheck,
  FileText, ShoppingCart, Menu, X, Newspaper, Trophy, DollarSign, Shield, BarChart3, LogOut } from
"lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/translations";

const handleLogout = () => {
  localStorage.removeItem("portal_role");
  localStorage.removeItem("portal_user_id");
  localStorage.removeItem("portal_user_name");
  window.location.href = "/";
};

export default function Sidebar() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const { language } = useLanguage();
  const isRTL = language === "ar";

  const navGroups = [
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

      <button
        className={cn(
          "fixed top-4 z-50 lg:hidden no-print bg-white/80 backdrop-blur-md shadow-sm rounded-xl border-2 border-stone-300 cursor-pointer text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-lg w-10 h-10 p-0 flex items-center justify-center",
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
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform">
              <GraduationCap size={24} />
            </div>
            <div>
              <h1 className="font-serif text-xl font-bold text-stone-900 leading-none">إديوتراك</h1>
              <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-1">EduTrack CMS</p>
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
                      key={item.path}
                      to={item.path}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 relative group",
                        isActive ?
                        "bg-primary text-white shadow-xl shadow-primary/20" :
                        "text-stone-500 hover:bg-stone-50 hover:text-stone-900"
                      )}
                    >
                      <item.icon className={cn("h-5 w-5 shrink-0 transition-transform group-hover:scale-110", isActive ? "text-white" : "text-stone-400 group-hover:text-primary")} />
                      {item.label}
                      {isActive && (
                        <motion.div 
                          layoutId="activeTab"
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
          
          <button
            onClick={handleLogout}
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