import React from "react";
import { useNavigate } from "react-router-dom";
import { 
  GraduationCap,
  Users,
  FileText,
  CreditCard,
  ShoppingCart,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  Lock
} from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { Card } from "@/components/ui/card";

const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all border-2 border-stone-200 bg-white/50 backdrop-blur-md text-stone-800 hover:bg-stone-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

export default function StaffPortal() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRTL = language === "ar";

  const subPortals = [
    { 
      id: "academic", 
      icon: GraduationCap, 
      label: { ar: "الإدارة الأكاديمية", en: "Academic Admin" }, 
      color: "bg-indigo-600 text-white",
      path: "/"
    },
    { 
      id: "hr", 
      icon: Users, 
      label: { ar: "الموارد البشرية", en: "Human Resources" }, 
      color: "bg-purple-600 text-white",
      path: "/staff-control"
    },
    { 
      id: "registrar", 
      icon: FileText, 
      label: { ar: "المسجل", en: "Registrar" }, 
      color: "bg-orange-600 text-white",
      path: "/student-directory"
    },
    { 
      id: "accountant", 
      icon: CreditCard, 
      label: { ar: "المحاسب", en: "Accountant" }, 
      color: "bg-rose-600 text-white",
      path: "/finance"
    },
    { 
      id: "store", 
      icon: ShoppingCart, 
      label: { ar: "متجر المدرسة", en: "School Store" }, 
      color: "bg-blue-600 text-white",
      path: "/store"
    },
    { 
      id: "library", 
      icon: BookOpen, 
      label: { ar: "أمين المكتبة", en: "Library Admin" }, 
      color: "bg-emerald-600 text-white",
      path: "/library"
    },
  ];

  const handlePortalClick = (path, id) => {
    if (id === "academic") {
      localStorage.setItem("portal_role", "admin");
      window.location.href = "/admin-dashboard";
    } else {
      localStorage.setItem("portal_role", id);
      window.location.href = path;
    }
  };

  const handleBack = () => {
    localStorage.removeItem("portal_role");
    localStorage.removeItem("portal_user_id");
    localStorage.removeItem("portal_user_name");
    window.location.href = "/";
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

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
            {isRTL ? "بوابة الموظفين" : "Staff Portal"}
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-stone-400 text-sm font-medium max-w-lg"
          >
            {isRTL ? "اختر القسم الإداري للمتابعة" : "Select administrative department to continue"}
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
                  {isRTL ? "تسجيل الدخول إلى القسم" : "Access department dashboard"}
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
    </div>
  );
}
