import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { 
  GraduationCap,
  Users,
  FileText,
  CreditCard,
  ShoppingCart,
  BookOpen,
  LogOut,
  Settings,
  ShieldCheck,
  Mail,
  ChevronRight,
  ChevronLeft,
  ArrowLeft
} from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StaffSidebar from "@/components/layout/StaffSidebar";

const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all border-2 border-stone-300 bg-white text-stone-800 hover:bg-stone-50 hover:border-stone-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const btnPrimary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all bg-stone-900 text-white hover:bg-black cursor-pointer shadow-lg shadow-stone-200 disabled:opacity-50 disabled:cursor-not-allowed";

export default function StaffPortal() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const [selectedPortal, setSelectedPortal] = useState(null);

  const { data: staffList = [] } = useQuery({ 
    queryKey: ["staff-portal-data"], 
    queryFn: () => base44.entities.StaffMember.list() 
  });

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

  const handlePortalClick = (portal) => {
    setSelectedPortal(portal);
    if (portal.path) {
      navigate(portal.path);
    }
  };

  const handleBack = () => {
    setSelectedPortal(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("portal_role");
    localStorage.removeItem("portal_user_id");
    localStorage.removeItem("portal_user_name");
    navigate("/");
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  return (
    <div className={`min-h-screen bg-stone-50 text-stone-900 ${isRTL ? 'font-cairo' : 'font-sans'}`} dir={isRTL ? "rtl" : "ltr"}>
      <StaffSidebar />
      <main className={`transition-all duration-300 min-h-screen pt-16 lg:pt-0 ${isRTL ? "lg:mr-64" : "lg:ml-64"}`}>
        <div className="p-6 md:p-10 lg:p-12 max-w-7xl mx-auto space-y-10 pb-24">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {selectedPortal && (
                <button onClick={handleBack} className={`${btnOutline} h-11 w-11 p-0`}>
                  <ArrowLeft size={18} className={isRTL ? "rotate-180" : ""} />
                </button>
              )}
              <div>
                <h1 className="text-3xl font-serif font-black text-stone-900">
                  {selectedPortal 
                    ? (isRTL ? selectedPortal.label.ar : selectedPortal.label.en)
                    : (isRTL ? "بوابة الموظفين" : "Staff Portal")
                  }
                </h1>
                <p className="text-stone-400 font-medium">
                  {selectedPortal
                    ? (isRTL ? "إدارة قسم " + selectedPortal.label.ar : `Managing ${selectedPortal.label.en}`)
                    : (isRTL ? "منصتك المتكاملة لإدارة مهامك المهنية" : "Your integrated platform for professional tasks")
                  }
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button className={`${btnOutline} rounded-full h-12 px-6`}>
                <Mail size={18} />
                {isRTL ? "البريد" : "Inbox"}
              </button>
              <button onClick={handleLogout} className={`${btnOutline} rounded-full h-12 px-6 border-rose-100 text-rose-600 bg-rose-50 hover:bg-rose-100`}>
                <LogOut size={18} />
                <span className="hidden sm:inline">{isRTL ? "خروج" : "Logout"}</span>
              </button>
            </div>
          </div>

          {/* Sub-Portals Grid */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {subPortals.map((portal) => (
              <motion.div
                key={portal.id}
                variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
                whileHover={{ y: -5 }}
                onClick={() => handlePortalClick(portal)}
                className="group cursor-pointer"
              >
                <Card className="p-8 border-none shadow-sm hover:shadow-2xl transition-all duration-500 rounded-[32px] bg-white relative overflow-hidden h-full flex flex-col items-center text-center">
                  <div className={`h-20 w-20 rounded-[24px] ${portal.color} flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform duration-500`}>
                    <portal.icon size={36} />
                  </div>
                  
                  <h3 className="text-xl font-serif font-black text-stone-900 mb-2 group-hover:text-primary transition-colors">
                    {isRTL ? portal.label.ar : portal.label.en}
                  </h3>
                  <p className="text-stone-400 text-xs font-medium mb-6">
                    {isRTL ? "انقر للدخول إلى لوحة التحكم" : "Click to access dashboard"}
                  </p>
                  
                  <div className="mt-auto">
                    <div className={`h-10 w-10 rounded-full border-2 border-stone-50 flex items-center justify-center text-stone-200 group-hover:border-primary group-hover:text-primary transition-all duration-500`}>
                      {isRTL ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                    </div>
                  </div>

                  {/* Hover Background Pattern */}
                  <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none">
                    <portal.icon size={80} />
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Staff Profile Card */}
          <Card className="p-8 border-none shadow-sm bg-gradient-to-br from-stone-900 to-stone-800 text-white rounded-[40px] relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                <div className="h-20 w-20 rounded-[28px] bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center font-black text-3xl">
                  {(staffList[0]?.full_name || staffList[0]?.name)?.[0] || 'M'}
                </div>
                <div>
                  <h4 className="text-2xl font-black">{staffList[0]?.full_name || staffList[0]?.name || (isRTL ? "محمد علي" : "Mohamed Ali")}</h4>
                  <p className="text-stone-400 text-sm font-bold uppercase tracking-widest mt-1">
                    {staffList[0]?.role || (isRTL ? "مدير إداري" : "Admin Manager")}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <button className={`${btnOutline} h-12 px-6 border-white/10 text-white hover:bg-white/10`}>
                  <Settings size={18} />
                  {isRTL ? "الإعدادات" : "Settings"}
                </button>
                <button className={`${btnOutline} h-12 px-6 border-white/10 text-white hover:bg-white/10`}>
                  <ShieldCheck size={18} />
                  {isRTL ? "الأمان" : "Security"}
                </button>
              </div>
            </div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
          </Card>

        </div>
      </main>
    </div>
  );
}
