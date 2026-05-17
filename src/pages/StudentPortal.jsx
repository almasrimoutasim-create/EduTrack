import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { 
  Sparkles, 
  Trophy, 
  Clock, 
  Star, 
  Zap, 
  Rocket,
  ChevronLeft,
  PlayCircle,
  FileText,
  Award,
  ArrowUpRight,
  LogOut
} from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/AuthContext";
import StudentSidebar from "@/components/layout/StudentSidebar";

const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all border-2 border-stone-300 bg-white text-stone-800 hover:bg-stone-50 hover:border-stone-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const btnPrimary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all bg-stone-900 text-white hover:bg-black cursor-pointer shadow-lg shadow-stone-200 disabled:opacity-50 disabled:cursor-not-allowed";

export default function StudentPortal() {
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

  // Mock student data
  const studentId = localStorage.getItem("portal_user_id") || "S-505";
  
  const { data: student = {} } = useQuery({ 
    queryKey: ["student-profile", studentId], 
    queryFn: () => base44.entities.Student.get(studentId) 
  });

  const { data: materials = [] } = useQuery({
    queryKey: ["student-materials"],
    queryFn: () => base44.entities.StudyMaterial.list("-created_date", 4)
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  return (
    <div className={`min-h-screen bg-stone-50 text-stone-900 ${isRTL ? 'font-cairo' : 'font-sans'}`} dir={isRTL ? "rtl" : "ltr"}>
      <StudentSidebar />
      <main className={`transition-all duration-300 min-h-screen pt-16 lg:pt-0 ${isRTL ? "lg:mr-64" : "lg:ml-64"}`}>
        <div className="p-6 md:p-10 lg:p-12 max-w-7xl mx-auto space-y-10 pb-24">
          <header className="relative py-12 px-10 bg-gradient-to-br from-teal-600 to-emerald-700 text-white rounded-[48px] shadow-2xl overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-400/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
          <div className="h-32 w-32 rounded-[40px] bg-white p-2 shadow-2xl shadow-black/20 group cursor-pointer overflow-hidden">
            <div className="h-full w-full rounded-[32px] bg-stone-100 flex items-center justify-center text-teal-600 group-hover:scale-110 transition-transform duration-500">
              <Rocket size={64} />
            </div>
          </div>
          
          <div className="flex-1 text-center md:text-right">
            <div className="flex flex-col md:flex-row items-center gap-4 mb-2 justify-center md:justify-start">
              <h2 className="text-4xl md:text-5xl font-serif font-black">{isRTL ? `أهلاً، ${student.full_name || student.name || 'بطل'}` : `Hi, ${student.full_name || student.name || 'Hero'}`}</h2>
              <Badge className="bg-yellow-400 text-teal-900 border-none font-black text-xs px-3 py-1 rounded-full flex items-center gap-1 shadow-lg shadow-yellow-400/30">
                <Star size={12} fill="currentColor" /> {isRTL ? "المستوى ٥" : "Level 5"}
              </Badge>
            </div>
            <p className="text-teal-50 text-lg font-medium opacity-80 mb-8 max-w-xl">
              {isRTL ? "يوم رائع بانتظارك! لديك ٣ حصص اليوم وواجب منزلي واحد." : "An amazing day awaits you! You have 3 classes today and 1 homework."}
            </p>
            
            <div className="flex flex-wrap items-center gap-6 justify-center md:justify-start">
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10">
                <Zap size={24} className="text-yellow-400" />
                <div className="text-right">
                  <p className="text-[10px] font-bold text-teal-100 uppercase tracking-widest">{isRTL ? "نقاط الخبرة" : "XP Points"}</p>
                  <p className="text-lg font-black leading-none"> 2,٤٥٠</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10">
                <Trophy size={24} className="text-amber-300" />
                <div className="text-right">
                  <p className="text-[10px] font-bold text-teal-100 uppercase tracking-widest">{isRTL ? "الأوسمة" : "Badges"}</p>
                  <p className="text-lg font-black leading-none"> 12</p>
                </div>
              </div>
                <button onClick={handleLogout} className={`${btnOutline} h-[52px] px-6 border-rose-500/20 text-rose-100 bg-rose-500/10 hover:bg-rose-500/20`}>
                  <LogOut size={18} />
                  <span className="hidden sm:inline">{isRTL ? "تسجيل الخروج" : "Log out"}</span>
                </button>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Daily Schedule - Left Side */}
        <section className="lg:col-span-8 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-serif font-bold text-stone-900">{isRTL ? "الجدول الدراسي اليوم" : "Today's Schedule"}</h3>
            <p className="text-stone-400 text-sm font-bold uppercase tracking-widest">May 12, 2024</p>
          </div>

          <div className="space-y-4">
            {[
              { subject: "الرياضيات", time: "٠٨:٠٠ - ٠٩:٠٠", teacher: "أ. محمد", active: true, color: "bg-blue-500", light: "bg-blue-50" },
              { subject: "اللغة العربية", time: "٠٩:١٥ - ١٠:١٥", teacher: "أ. فاطمة", active: false, color: "bg-rose-500", light: "bg-rose-50" },
              { subject: "العلوم", time: "١٠:٣٠ - ١١:٣٠", teacher: "أ. خالد", active: false, color: "bg-emerald-500", light: "bg-emerald-50" }
            ].map((session, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + (i * 0.1) }}
                className="group"
              >
                <Card className={`p-6 border-none shadow-sm hover:shadow-xl transition-all duration-500 rounded-[32px] flex items-center justify-between ${session.active ? 'ring-4 ring-teal-500/10' : ''}`}>
                  <div className="flex items-center gap-6">
                    <div className={`h-14 w-14 rounded-2xl ${session.active ? 'bg-teal-600 shadow-lg shadow-teal-200' : 'bg-stone-50'} flex flex-col items-center justify-center ${session.active ? 'text-white' : 'text-stone-400'}`}>
                      <Clock size={24} />
                    </div>
                    <div>
                      <h4 className={`text-xl font-black ${session.active ? 'text-teal-600' : 'text-stone-800'}`}>{session.subject}</h4>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs font-bold text-stone-400 flex items-center gap-1"><Clock size={12} /> {session.time}</span>
                        <span className="text-xs font-bold text-stone-400 flex items-center gap-1"><Zap size={12} /> {session.teacher}</span>
                      </div>
                    </div>
                  </div>
                  
                  {session.active ? (
                    <button className={`${btnPrimary.split(' ').filter(c => !c.includes('shadow')).join(' ')} bg-teal-600 hover:bg-teal-700 text-white rounded-2xl px-6 h-12`}>
                      <PlayCircle size={18} />
                      {isRTL ? "انضم للحصة" : "Join Class"}
                    </button>
                  ) : (
                    <div className="h-12 w-12 rounded-full border-2 border-stone-100 flex items-center justify-center text-stone-200 group-hover:border-stone-200 group-hover:text-stone-300 transition-colors">
                      <ChevronLeft size={24} className={isRTL ? "" : "rotate-180"} />
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Quick Learning Path */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
            <Card className="p-8 border-none shadow-sm bg-gradient-to-br from-rose-500 to-rose-600 text-white rounded-[40px] relative overflow-hidden group cursor-pointer">
              <div className="relative z-10">
                <FileText className="mb-4 text-rose-200" size={32} />
                <h4 className="text-2xl font-serif font-bold mb-2">{isRTL ? "الواجبات المنزلية" : "Homework"}</h4>
                <p className="text-rose-100/70 text-sm mb-6">{isRTL ? "لديك واجب واحد في مادة الرياضيات يستحق التسليم غداً." : "You have 1 math homework due tomorrow."}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-rose-200">{isRTL ? "انقر للمتابعة" : "Click to continue"}</span>
                  <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-125 transition-transform">
                    <ArrowUpRight size={20} />
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
            </Card>

            <Card className="p-8 border-none shadow-sm bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-[40px] relative overflow-hidden group cursor-pointer">
              <div className="relative z-10">
                <Award className="mb-4 text-amber-200" size={32} />
                <h4 className="text-2xl font-serif font-bold mb-2">{isRTL ? "الإنجازات القادمة" : "Upcoming Badges"}</h4>
                <p className="text-amber-100/70 text-sm mb-6">{isRTL ? "أكمل ٣ دروس أخرى للحصول على وسام 'الباحث العلمي'." : "Complete 3 more lessons to get 'Scientific Researcher' badge."}</p>
                <div className="flex items-center justify-between">
                  <Progress value={75} className="h-2 w-32 bg-white/20" />
                  <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-125 transition-transform">
                    <Sparkles size={20} />
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
            </Card>
          </div>
        </section>

        {/* Sidebar - Materials & Activity */}
        <aside className="lg:col-span-4 space-y-8">
          <Card className="p-8 border-none shadow-sm bg-white rounded-[40px]">
            <div className="flex items-center justify-between mb-8">
              <h4 className="font-bold text-stone-900">{isRTL ? "المواد الدراسية" : "Study Materials"}</h4>
              <button className="text-teal-600 hover:text-teal-700 hover:bg-teal-50 font-bold px-3 rounded-xl cursor-pointer">
                {isRTL ? "عرض الكل" : "View All"}
              </button>
            </div>

            <div className="space-y-6">
              {materials.map((m, i) => (
                <div key={i} className="flex gap-4 group cursor-pointer">
                  <div className="h-12 w-12 rounded-2xl bg-stone-50 flex items-center justify-center text-stone-400 group-hover:bg-teal-50 group-hover:text-teal-600 transition-all duration-300">
                    <FileText size={24} />
                  </div>
                  <div className="flex-1">
                    <h5 className="text-sm font-bold text-stone-800 group-hover:text-teal-700 transition-colors truncate">{m.title}</h5>
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{m.subject_name}</p>
                  </div>
                  <button className={`${btnOutline} rounded-full gap-1 text-xs`}>
                    <ChevronLeft size={14} className={isRTL ? "" : "rotate-180"} />
                    {t("common.open", language) || "فتح"}
                  </button>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-8 border-none shadow-sm bg-stone-900 text-white rounded-[40px] relative overflow-hidden">
            <div className="relative z-10 text-center">
              <div className="h-20 w-20 rounded-full bg-white/10 mx-auto flex items-center justify-center mb-6">
                <Trophy size={40} className="text-yellow-400" />
              </div>
              <h4 className="text-xl font-serif font-bold mb-2">{isRTL ? "هل أنت جاهز للاختبار؟" : "Ready for the Quiz?"}</h4>
              <p className="text-stone-400 text-xs mb-8">{isRTL ? "اختبر معلوماتك اليوم في مادة العلوم واربح نقاط إضافية!" : "Test your knowledge today in Science and win extra points!"}</p>
              <button className="w-full bg-white text-stone-900 hover:bg-stone-100 rounded-2xl h-12 font-bold shadow-xl cursor-pointer">
                {isRTL ? "ابدأ الآن" : "Start Now"}
              </button>
            </div>
            {/* Decorative pattern */}
            <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
          </Card>
        </aside>
      </div>
        </div>
      </main>
    </div>
  );
}