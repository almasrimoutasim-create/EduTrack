import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { 
  Users, 
  BookOpen, 
  ClipboardCheck, 
  MessageCircle, 
  Calendar, 
  TrendingUp,
  Plus,
  ChevronRight,
  Clock,
  LayoutGrid,
  CheckCircle2,
  AlertCircle,
  FileText,
  Star,
  LogOut
} from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/lib/AuthContext";
import TeacherSidebar from "@/components/layout/TeacherSidebar";

const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all border-2 border-stone-300 bg-white text-stone-800 hover:bg-stone-50 hover:border-stone-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const btnPrimary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all bg-stone-900 text-white hover:bg-black cursor-pointer shadow-lg shadow-stone-200 disabled:opacity-50 disabled:cursor-not-allowed";

export default function TeacherPortal() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState("classes");

  const handleLogout = () => {
    localStorage.removeItem("portal_role");
    localStorage.removeItem("portal_user_id");
    localStorage.removeItem("portal_user_name");
    logout(false);
    window.location.href = "/";
  };

  const { data: classes = [] } = useQuery({ 
    queryKey: ["teacher-classes"], 
    queryFn: () => base44.entities.Subject.list("-created_at", { teacher_id: "T-202" }) 
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  return (
    <div className={`min-h-screen bg-stone-50 text-stone-900 ${isRTL ? 'font-cairo' : 'font-sans'}`} dir={isRTL ? "rtl" : "ltr"}>
      <TeacherSidebar />
      <main className={`transition-all duration-300 min-h-screen pt-16 lg:pt-0 ${isRTL ? "lg:mr-64" : "lg:ml-64"}`}>
        <div className="p-6 md:p-10 lg:p-12 max-w-7xl mx-auto space-y-10 pb-24">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-serif font-black text-stone-900">{isRTL ? "بوابة المعلم" : "Teacher Portal"}</h1>
            <Badge className="bg-amber-500/10 text-amber-600 border-none rounded-lg text-[10px] font-black px-2 py-1 uppercase tracking-widest">
              {isRTL ? "أكاديمي" : "Academic"}
            </Badge>
          </div>
          <p className="text-stone-400 font-medium">{isRTL ? "أهلاً بك يا أستاذ! لديك ٣ حصص اليوم و١٢ واجباً بانتظار التصحيح." : "Welcome back! You have 3 classes today and 12 assignments to grade."}</p>
        </div>
        
        <div className="flex gap-3">
          <button className={`${btnOutline} rounded-full h-12 px-6`}>
            <Calendar size={18} />
            {isRTL ? "الجدول الأسبوعي" : "Weekly Schedule"}
          </button>
          <button className={`${btnPrimary} rounded-full h-12 px-6 hidden sm:flex`}>
            <Plus size={18} />
            {isRTL ? "إضافة محتوى" : "Add Content"}
          </button>
          <button onClick={handleLogout} className={`${btnOutline} rounded-full h-12 px-6 border-rose-100 text-rose-600 bg-rose-50 hover:bg-rose-100 hover:text-rose-700`}>
            <LogOut size={18} />
            <span className="hidden sm:inline">{isRTL ? "تسجيل الخروج" : "Log out"}</span>
          </button>
        </div>
      </header>

      {/* Main Teacher Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Main Content Area */}
        <section className="lg:col-span-8 space-y-10">
          <Tabs defaultValue="classes" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="bg-transparent h-14 p-1 gap-2 mb-8 flex justify-start">
              {[
                { value: "classes", label: isRTL ? "فصولي" : "My Classes", icon: LayoutGrid },
                { value: "students", label: isRTL ? "طلابي" : "My Students", icon: Users },
                { value: "grading", label: isRTL ? "التصحيح" : "Grading", icon: ClipboardCheck },
                { value: "materials", label: isRTL ? "المواد" : "Materials", icon: BookOpen }
              ].map(tab => (
                <TabsTrigger 
                  key={tab.value}
                  value={tab.value} 
                  className={`rounded-2xl px-6 h-12 gap-2 font-black text-xs transition-all data-[state=active]:bg-stone-900 data-[state=active]:text-white data-[state=inactive]:text-stone-400 data-[state=inactive]:hover:bg-stone-100`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="classes" className="m-0 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {classes.map((cls, i) => (
                  <motion.div
                    key={cls.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Card className="p-8 border-none shadow-sm hover:shadow-2xl transition-all duration-500 rounded-[48px] bg-white group cursor-pointer overflow-hidden relative">
                      <div className={`absolute top-0 right-0 w-2 h-full ${i % 2 === 0 ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
                      
                      <div className="flex justify-between items-start mb-8">
                        <div className={`h-14 w-14 rounded-2xl ${i % 2 === 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          <BookOpen size={28} />
                        </div>
                        <Badge className="bg-stone-50 text-stone-400 border-none rounded-lg text-[8px] font-black px-2 py-0.5">
                          {cls.grade_level}
                        </Badge>
                      </div>

                      <h4 className="text-2xl font-serif font-black text-stone-900 mb-2 group-hover:text-primary transition-colors">{cls.name}</h4>
                      <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-8">{isRTL ? "القسم" : "Section"} {cls.section || 'A'}</p>

                      <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-stone-50 p-4 rounded-3xl text-center">
                          <p className="text-[10px] font-bold text-stone-400 uppercase mb-1">{isRTL ? "الطلاب" : "Students"}</p>
                          <p className="text-xl font-black text-stone-900"> 24</p>
                        </div>
                        <div className="bg-stone-50 p-4 rounded-3xl text-center">
                          <p className="text-[10px] font-bold text-stone-400 uppercase mb-1">{isRTL ? "الحضور" : "Attendance"}</p>
                          <p className="text-xl font-black text-emerald-600"> 95٪</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button className={`flex-1 ${btnPrimary} rounded-2xl h-12`}>
                          {isRTL ? "إدارة الفصل" : "Manage Class"}
                        </button>
                        <button className={`${btnOutline} h-12 w-12 rounded-2xl`}>
                          <ChevronRight size={20} className={isRTL ? "rotate-180" : ""} />
                        </button>
                      </div>
                    </Card>
                  </motion.div>
                ))}
                
                {/* Add New Class Shortcut */}
                <Card className="p-8 border-dashed border-2 border-stone-100 bg-stone-50/30 flex flex-col items-center justify-center text-center rounded-[48px] hover:border-primary/30 transition-all group cursor-pointer">
                  <div className="h-14 w-14 rounded-full bg-white flex items-center justify-center text-stone-300 group-hover:bg-primary group-hover:text-white transition-all mb-4 shadow-sm">
                    <Plus size={28} />
                  </div>
                  <h4 className="font-bold text-stone-400 group-hover:text-primary transition-colors">{isRTL ? "إضافة فصل جديد" : "Add New Class"}</h4>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: isRTL ? "متوسط المعدل" : "Average GPA", value: "٣.٤٥", icon: Star, color: "text-amber-500", bg: "bg-amber-50" },
              { label: isRTL ? "الواجبات المكتملة" : "Assignments Done", value: "١٢٨", icon: FileText, color: "text-blue-500", bg: "bg-blue-50" },
              { label: isRTL ? "ساعات التدريس" : "Teaching Hours", value: "٤٢", icon: Clock, color: "text-purple-500", bg: "bg-purple-50" },
            ].map((stat, i) => (
              <Card key={i} className="p-6 border-none shadow-sm bg-white rounded-[32px] flex items-center gap-4">
                <div className={`h-12 w-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                  <stat.icon size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{stat.label}</p>
                  <p className="text-xl font-black text-stone-900">{stat.value}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Sidebar - Notifications & Recent Activity */}
        <aside className="lg:col-span-4 space-y-10">
          <Card className="p-8 border-none shadow-sm bg-stone-900 text-white rounded-[48px] relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <h4 className="font-bold">{isRTL ? "أداء الطلاب" : "Student Performance"}</h4>
                <TrendingUp size={20} className="text-emerald-400" />
              </div>
              
              <div className="space-y-6">
                {[
                  { label: isRTL ? "فوق المتوسط" : "Above Average", value: 70, color: "bg-emerald-500" },
                  { label: isRTL ? "متوسط" : "Average", value: 20, color: "bg-amber-500" },
                  { label: isRTL ? "يحتاج تحسين" : "Needs Review", value: 10, color: "bg-rose-500" },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-2 text-[10px] font-bold uppercase tracking-widest opacity-60">
                      <span>{item.label}</span>
                      <span>{item.value}٪</span>
                    </div>
                    <Progress value={item.value} className={`h-1.5 bg-white/10 ${item.color}`} />
                  </div>
                ))}
              </div>
              
              <button className="w-full mt-10 bg-white/10 hover:bg-white/20 text-white rounded-2xl h-12 font-bold border border-white/10 transition-all cursor-pointer">
                {isRTL ? "عرض التقرير السنوي" : "View Annual Report"}
              </button>
            </div>
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-primary/20 rounded-full blur-[100px]" />
          </Card>

          <Card className="p-8 border-none shadow-sm bg-white rounded-[48px]">
            <div className="flex items-center justify-between mb-8">
              <h4 className="font-bold text-stone-900">{isRTL ? "التنبيهات العاجلة" : "Urgent Alerts"}</h4>
              <Badge className="bg-rose-500 text-white border-none rounded-full h-5 w-5 flex items-center justify-center p-0 text-[10px] font-black"> 3</Badge>
            </div>
            
            <div className="space-y-6">
              {[
                { title: "غياب متكرر - طالب ٤٠٥", time: "١٠:١٥ ص", icon: AlertCircle, color: "text-rose-500", bg: "bg-rose-50" },
                { title: "طلب مراجعة درجة - سارة", time: "٠٩:٣٠ ص", icon: MessageCircle, color: "text-blue-500", bg: "bg-blue-50" },
                { title: "تم تحديث خطة المنهج", time: "٠٨:٠٠ ص", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" },
              ].map((alert, i) => (
                <div key={i} className="flex gap-4 group cursor-pointer">
                  <div className={`h-12 w-12 rounded-2xl ${alert.bg} ${alert.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <alert.icon size={20} />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-stone-800 leading-tight group-hover:text-primary transition-colors">{alert.title}</h5>
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">{alert.time}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <button className="w-full mt-8 rounded-2xl font-bold text-stone-400 hover:text-primary hover:bg-primary/5 cursor-pointer">
              {isRTL ? "عرض جميع التنبيهات" : "View All Alerts"}
            </button>
          </Card>
        </aside>
      </div>
        </div>
      </main>
    </div>
  );
}