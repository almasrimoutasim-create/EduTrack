import React from "react";
import { useNavigate } from "react-router-dom";
import { 
  User, 
  GraduationCap, 
  Users, 
  Bus, 
  ShieldCheck, 
  Settings, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  Lock
} from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { Card } from "@/components/ui/card";

const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all border-2 border-stone-200 bg-white/50 backdrop-blur-md text-stone-800 hover:bg-stone-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

export default function RoleLogin({ onLogin }) {
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const isRTL = language === "ar";

  const roles = [
    { id: "admin", icon: Settings, label: { ar: "مدير النظام", en: "System Admin" }, color: "bg-stone-900 text-white", path: "/admin-dashboard" },
    { id: "teacher", icon: GraduationCap, label: { ar: "بوابة المعلم", en: "Teacher Portal" }, color: "bg-indigo-600 text-white", path: "/teacher-portal" },
    { id: "student", icon: User, label: { ar: "بوابة الطالب", en: "Student Portal" }, color: "bg-teal-600 text-white", path: "/student-portal" },
    { id: "parent", icon: Users, label: { ar: "بوابة ولي الأمر", en: "Parent Portal" }, color: "bg-rose-600 text-white", path: "/parent-portal" },
    { id: "bus", icon: Bus, label: { ar: "مشرف الحافلة", en: "Bus Supervisor" }, color: "bg-amber-500 text-stone-900", path: "/bus-supervisor" },
    { id: "staff", icon: ShieldCheck, label: { ar: "بوابة الموظف", en: "Staff Portal" }, color: "bg-blue-600 text-white", path: "/staff-portal" }
  ];

  const toggleLanguage = () => {
    setLanguage(language === "ar" ? "en" : "ar");
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden" dir={isRTL ? "rtl" : "ltr"}>
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px]" />
      </div>

      {/* Language Switcher */}
      <div className="absolute top-4 end-4 z-50">
        <button 
          onClick={toggleLanguage}
          className={`${btnOutline} h-10 px-4 font-bold text-[10px] gap-1.5 shadow-sm`}
        >
          {language === "ar" ? "English" : "العربية"}
          <Sparkles size={14} className="text-primary" />
        </button>
      </div>

      <div className="max-w-6xl w-full relative z-10 mx-auto px-4">
        {/* Header - Always LTR for proper centering */}
        <header className="text-center mb-8 space-y-2 flex flex-col items-center justify-center w-full" dir="ltr">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center justify-center h-14 w-14 rounded-xl bg-stone-900 text-white shadow-2xl mb-4"
          >
            <Lock size={28} />
          </motion.div>
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-3xl md:text-4xl font-serif font-black text-stone-900 tracking-tight"
          >
            Edu<span className="text-primary">Track</span>
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-stone-400 text-sm font-medium max-w-lg"
          >
            {isRTL ? "نظام إدارة التعليم الذكي. اختر بوابتك للمتابعة." : "Smart Education Management System. Choose your portal to continue."}
          </motion.p>
        </header>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.1 } }
          }}
        >
          {roles.map((role) => (
            <motion.div
              key={role.id}
              variants={{
                hidden: { y: 20, opacity: 0 },
                visible: { y: 0, opacity: 1 }
              }}
              whileHover={{ y: -5 }}
              onClick={() => {
                localStorage.setItem("portal_role", role.id);
                if (onLogin) {
                  onLogin(role.id);
                } else {
                  navigate(role.path);
                }
              }}
              className="group cursor-pointer"
            >
              <Card className="p-6 border-none shadow-sm hover:shadow-2xl transition-all duration-500 rounded-[24px] bg-white relative overflow-hidden h-full flex flex-col items-center text-center">
                <div className={`h-16 w-16 rounded-[20px] ${role.color} flex items-center justify-center mb-4 shadow-xl group-hover:scale-110 transition-transform duration-500`}>
                  <role.icon size={32} />
                </div>
                
                <h3 className="text-lg font-serif font-black text-stone-900 mb-1.5 group-hover:text-primary transition-colors">
                  {isRTL ? role.label.ar : role.label.en}
                </h3>
                <p className="text-stone-400 text-xs font-medium mb-4">
                  {isRTL ? "تسجيل الدخول إلى حسابك الخاص." : "Secure login to your personal account."}
                </p>
                
                <div className="mt-auto">
                  <div className={`h-8 w-8 rounded-full border-2 border-stone-50 flex items-center justify-center text-stone-200 group-hover:border-primary group-hover:text-primary transition-all duration-500`}>
                    {isRTL ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                  </div>
                </div>

                {/* Hover Background Pattern */}
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none">
                  <role.icon size={60} />
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
    </div>
  );
}
