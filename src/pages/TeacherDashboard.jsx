import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { 
  Users, 
  Calendar, 
  BookOpen, 
  AlertCircle, 
  TrendingUp, 
  MessageSquare,
  ClipboardList,
  Edit3,
  FileText,
  Plus,
  GraduationCap,
  Star,
  Zap
} from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import PageHeader from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all border-2 border-stone-200 bg-white text-stone-800 hover:bg-stone-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const btnPrimary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all bg-stone-900 text-white hover:bg-black cursor-pointer shadow-lg shadow-stone-200 disabled:opacity-50 disabled:cursor-not-allowed";

export default function TeacherDashboard() {
  const { language } = useLanguage();
  const isRTL = language === "ar";

  const { data: students = [] } = useQuery({ 
    queryKey: ["teacher-students"], 
    queryFn: () => base44.entities.Student.list() 
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  return (
    <div className="space-y-10 pb-24" dir={isRTL ? "rtl" : "ltr"}>
      <PageHeader 
        title={isRTL ? "لوحة تحكم المعلم" : "Teacher Dashboard"} 
        subtitle={isRTL ? "أهلاً بك، إليك ملخص لأداء طلابك ومهامك التدريسية اليوم." : "Welcome back. Here's a summary of student performance and your teaching tasks."}
      >
        <div className="flex gap-3">
          <button className={`${btnOutline} rounded-full h-12 px-6`}>
            <Calendar size={18} />
            {isRTL ? "الجدول الكامل" : "Full Schedule"}
          </button>
          <button className={`${btnPrimary} rounded-full h-12 px-6`}>
            <Plus size={18} />
            {isRTL ? "إضافة محتوى" : "Add Content"}
          </button>
        </div>
      </PageHeader>

      {/* Teacher Impact Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: isRTL ? "إجمالي الطلاب" : "Total Students", value: "١٢٨", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { label: isRTL ? "حصص اليوم" : "Today's Lessons", value: "٤", icon: BookOpen, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: isRTL ? "مهام للتصحيح" : "Pending Grading", value: "١٥", icon: ClipboardList, color: "text-rose-600", bg: "bg-rose-50" },
          { label: isRTL ? "متوسط الأداء" : "Avg Class Perf", value: "٨٨٪", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map((stat, i) => (
          <Card key={i} className="p-6 border-none shadow-sm bg-white rounded-[32px] flex items-center gap-4 group cursor-pointer hover:shadow-md transition-all">
            <div className={`h-12 w-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest">{stat.label}</p>
              <h4 className="text-xl font-black text-stone-900">{stat.value}</h4>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Academic Overview Section */}
        <section className="lg:col-span-8 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-serif font-bold text-stone-900">{isRTL ? "الحصص الدراسية" : "Class Schedule"}</h3>
            <Badge className="bg-emerald-50 text-emerald-600 border-none rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest">
              {isRTL ? "مباشر الآن" : "Live Now"}
            </Badge>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {[
              { name: isRTL ? "١٠-أ (رياضيات متقدمة)" : "10-A (Adv Math)", time: "٠٨:٠٠ - ٠٨:٤٥", status: "finished", students: "٣٢/٣٢" },
              { name: isRTL ? "١٢-ج (فيزياء)" : "12-C (Physics)", time: "٠٩:٠٠ - ٠٩:٤٥", status: "active", students: "٢٨/٣٠" },
              { name: isRTL ? "١١-ب (رياضيات)" : "11-B (Math)", time: "١٠:٣٠ - ١١:١٥", status: "upcoming", students: "٣٠/٣٠" },
            ].map((cls, i) => (
              <motion.div
                key={i}
                variants={{ hidden: { y: 10, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
              >
                <Card className={`p-6 border-none shadow-sm rounded-[32px] flex items-center justify-between group cursor-pointer transition-all ${cls.status === 'active' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-white hover:bg-stone-50'}`}>
                  <div className="flex items-center gap-6">
                    <div className={`h-14 w-14 rounded-2xl flex items-center justify-center ${cls.status === 'active' ? 'bg-white/10 text-white' : 'bg-stone-50 text-stone-400 group-hover:bg-white'}`}>
                      <GraduationCap size={28} />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg leading-tight">{cls.name}</h4>
                      <div className="flex items-center gap-3 mt-1 opacity-60">
                        <span className="text-[10px] font-black uppercase tracking-widest">{cls.time}</span>
                        <span className="h-1 w-1 rounded-full bg-current" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{cls.students} {isRTL ? "طالباً" : "Students"}</span>
                      </div>
                    </div>
                  </div>
                  <button className={`rounded-xl h-10 px-6 font-bold transition-all border-none cursor-pointer ${cls.status === 'active' ? 'bg-white text-indigo-600 hover:bg-white/90' : 'bg-stone-50 text-stone-900 group-hover:bg-stone-900 group-hover:text-white'}`}>
                    {cls.status === 'active' ? (isRTL ? "دخول الفصل" : "Enter Class") : (isRTL ? "التفاصيل" : "Details")}
                  </button>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <div className="pt-8 border-t border-stone-100">
            <h3 className="text-2xl font-serif font-bold text-stone-900 mb-6">{isRTL ? "الطلاب الأكثر تفاعلاً" : "Star Students"}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {students.slice(0, 4).map((student, i) => (
                <div key={i} className="flex flex-col items-center p-6 bg-white rounded-[32px] shadow-sm hover:shadow-md transition-all group cursor-pointer">
                  <div className="h-16 w-16 rounded-2xl bg-stone-50 flex items-center justify-center font-black text-stone-400 group-hover:bg-primary group-hover:text-white transition-all mb-4">
                    {(student.full_name || student.name)?.[0]}
                  </div>
                  <span className="text-sm font-bold text-stone-800 text-center leading-tight mb-1">{student.full_name || student.name}</span>
                  <Badge className="bg-amber-50 text-amber-600 border-none text-[8px] font-black px-2 py-0.5 gap-1">
                    <Star size={8} fill="currentColor" />
                    +١٢
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Sidebar - Quick Actions & Analytics */}
        <aside className="lg:col-span-4 space-y-10">
          <Card className="p-8 border-none shadow-sm bg-stone-900 text-white rounded-[48px] relative overflow-hidden">
            <div className="relative z-10">
              <h4 className="text-xl font-serif font-bold mb-8">{isRTL ? "أدوات المعلم" : "Teacher Tools"}</h4>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: isRTL ? "رصد الغياب" : "Attendance", icon: ClipboardList, color: "text-blue-400" },
                  { label: isRTL ? "وضع الدرجات" : "Grading", icon: Edit3, color: "text-amber-400" },
                  { label: isRTL ? "رسالة جماعية" : "Broadcast", icon: MessageSquare, color: "text-emerald-400" },
                  { label: isRTL ? "خطة الدرس" : "Lesson Plan", icon: FileText, color: "text-purple-400" },
                ].map((tool, i) => (
                  <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 cursor-pointer transition-all flex flex-col items-center gap-3">
                    <tool.icon size={20} className={tool.color} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 text-center">{tool.label}</span>
                  </div>
                ))}
              </div>
              <button className="w-full mt-8 bg-white text-stone-900 hover:bg-stone-100 rounded-2xl h-12 font-bold shadow-xl cursor-pointer">
                {isRTL ? "فتح بنك الأسئلة" : "Open Question Bank"}
              </button>
            </div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
          </Card>

          <Card className="p-8 border-none shadow-sm bg-white rounded-[48px]">
            <h4 className="font-bold text-stone-900 mb-8">{isRTL ? "تنبيهات الأداء" : "Performance Alerts"}</h4>
            <div className="space-y-6">
              {[
                { title: isRTL ? "انخفاض معدل حضور ١٠-أ" : "Attendance Drop 10-A", icon: AlertCircle, color: "text-rose-500" },
                { title: isRTL ? "٣ طلاب يحتاجون دعماً" : "3 Students need help", icon: Zap, color: "text-amber-500" },
              ].map((alert, i) => (
                <div key={i} className="flex items-center gap-4 group cursor-pointer">
                  <div className={`h-10 w-10 rounded-xl bg-stone-50 flex items-center justify-center ${alert.color} group-hover:scale-110 transition-transform`}>
                    <alert.icon size={20} />
                  </div>
                  <span className="text-sm font-bold text-stone-700 leading-tight group-hover:text-primary transition-colors">{alert.title}</span>
                </div>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}