import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { 
  Book, 
  Trophy, 
  Zap, 
  Star, 
  Clock, 
  Gamepad2, 
  Rocket, 
  Award,
  TrendingUp,
  Brain,
  Coffee
} from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all border-2 border-stone-200 bg-white text-stone-800 hover:bg-stone-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const btnPrimary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer shadow-xl shadow-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed";

export default function StudentDashboard() {
  const { language } = useLanguage();
  const isRTL = language === "ar";

  const { data: assignments = [] } = useQuery({ 
    queryKey: ["student-assignments"], 
    queryFn: () => base44.entities.Subject.list() 
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  return (
    <div className="space-y-10 pb-24" dir={isRTL ? "rtl" : "ltr"}>
      <header className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="h-24 w-24 rounded-[32px] bg-indigo-600 flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-indigo-200">
              A
            </div>
            <div className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full bg-amber-400 border-4 border-white flex items-center justify-center shadow-lg">
              <Star size={16} className="text-white fill-white" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-serif font-black text-stone-900">{isRTL ? "أهلاً، أحمد!" : "Hey, Ahmed!"}</h1>
              <Badge className="bg-stone-900 text-white border-none rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                LVL 12
              </Badge>
            </div>
            <p className="text-stone-400 font-medium">{isRTL ? "أنت في المركز الثالث على مستوى الفصل هذا الأسبوع!" : "You're 3rd in your class leaderboard this week!"}</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button className={`${btnOutline} h-14 px-8`}>
            <Gamepad2 size={20} />
            {isRTL ? "الألعاب التعليمية" : "Learning Games"}
          </button>
          <button className={`${btnPrimary} h-14 px-8`}>
            <Rocket size={20} />
            {isRTL ? "ابدأ المذاكرة" : "Start Learning"}
          </button>
        </div>
      </header>

      {/* Experience & Level Progress */}
      <Card className="p-10 bg-gradient-to-br from-indigo-900 to-indigo-800 text-white rounded-[50px] shadow-2xl relative overflow-hidden border-none">
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-12 items-center">
          <div className="md:col-span-2 space-y-8">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-indigo-300 text-xs font-black uppercase tracking-widest mb-2">{isRTL ? "مستوى الخبرة" : "Experience Level"}</p>
                <h3 className="text-4xl font-serif font-black"> 850 / ١٠٠٠ <span className="text-indigo-400 text-xl">XP</span></h3>
              </div>
              <p className="text-indigo-300 text-sm font-bold">{isRTL ? "١٥٠ نقطة حتى المستوى التالي" : "150 XP to Next Level"}</p>
            </div>
            <Progress value={85} className="h-4 bg-white/10 rounded-full" />
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center"><Zap size={16} className="text-amber-400" /></div>
                <span className="text-xs font-bold">{isRTL ? "سلسلة تفوق: ٥ أيام" : "5 Day Streak"}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center"><Award size={16} className="text-emerald-400" /></div>
                <span className="text-xs font-bold">{isRTL ? "١٢ وساماً" : "12 Badges"}</span>
              </div>
            </div>
          </div>
          <div className="flex justify-center md:justify-end">
            <div className="h-40 w-40 rounded-full border-8 border-white/5 flex items-center justify-center relative">
              <Trophy size={80} className="text-amber-400" />
              <div className="absolute inset-0 border-8 border-indigo-400 rounded-full border-t-transparent animate-spin-slow" />
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 p-20 opacity-5 pointer-events-none">
          <Brain size={200} />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Homework & Quizzes */}
        <section className="lg:col-span-8 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-serif font-bold text-stone-900">{isRTL ? "المهام الدراسية" : "Learning Tasks"}</h3>
            <div className="flex gap-2">
              {['الكل', 'الواجبات', 'الاختبارات'].map((tab, i) => (
                <Badge key={i} className={`cursor-pointer px-4 py-1.5 rounded-full border-none font-bold text-[10px] uppercase tracking-widest ${i === 0 ? 'bg-stone-900 text-white' : 'bg-white text-stone-400 hover:bg-stone-50 shadow-sm'}`}>
                  {isRTL ? tab : (i === 0 ? 'All' : tab)}
                </Badge>
              ))}
            </div>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {[
              { title: "حل تمارين التكامل والاشتقاق", subject: "الرياضيات", due: "اليوم، ٠٨:٠٠ م", type: "Homework", color: "text-blue-500", bg: "bg-blue-50" },
              { title: "كتابة مقال عن الأدب الأندلسي", subject: "اللغة العربية", due: "غداً، ١٢:٠٠ م", type: "Essay", color: "text-amber-500", bg: "bg-amber-50" },
              { title: "اختبار تجريبي: كيمياء العناصر", subject: "الكيمياء", due: "١٥ مايو", type: "Quiz", color: "text-rose-500", bg: "bg-rose-50" },
            ].map((task, i) => (
              <motion.div
                key={i}
                variants={{ hidden: { x: isRTL ? 20 : -20, opacity: 0 }, visible: { x: 0, opacity: 1 } }}
                className="group"
              >
                <Card className="p-6 border-none shadow-sm hover:shadow-xl transition-all duration-500 rounded-[32px] bg-white flex items-center justify-between group cursor-pointer overflow-hidden relative">
                  <div className="flex items-center gap-6 relative z-10">
                    <div className={`h-14 w-14 rounded-2xl ${task.bg} ${task.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <Book size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-stone-800 group-hover:text-indigo-600 transition-colors leading-tight">{task.title}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{task.subject}</span>
                        <span className="h-1 w-1 rounded-full bg-stone-200" />
                        <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest flex items-center gap-1">
                          <Clock size={10} /> {task.due}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button className="rounded-xl h-10 px-6 font-bold bg-stone-50 text-stone-900 hover:bg-stone-900 hover:text-white transition-all border-none relative z-10 cursor-pointer">
                    {isRTL ? "ابدأ الآن" : "Start Task"}
                  </button>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Schedule & Mentors */}
        <aside className="lg:col-span-4 space-y-10">
          <Card className="p-8 border-none shadow-sm bg-white rounded-[48px]">
            <h4 className="font-bold text-stone-900 mb-8">{isRTL ? "الحصة القادمة" : "Next Up"}</h4>
            <div className="relative p-6 bg-stone-50 rounded-[32px] border border-stone-100 group cursor-pointer hover:bg-stone-900 hover:text-white transition-all">
              <div className="flex justify-between items-start mb-6">
                <Badge className="bg-indigo-600 text-white border-none rounded-lg text-[8px] font-black px-2 py-1 uppercase tracking-widest">
                  {isRTL ? "الآن" : "Ongoing"}
                </Badge>
                <span className="text-xs font-bold opacity-60"> 09:٣٠ - ١٠:١٥</span>
              </div>
              <h5 className="text-xl font-black mb-2">{isRTL ? "اللغة الإنجليزية" : "English Literature"}</h5>
              <p className="text-xs font-bold opacity-60 uppercase tracking-widest mb-6">{isRTL ? "قاعة ٢٠٤ · أ. سارة" : "Room 204 · Ms. Sarah"}</p>
              <button className="w-full bg-white text-stone-900 rounded-xl h-10 font-bold group-hover:bg-indigo-600 group-hover:text-white cursor-pointer">
                {isRTL ? "عرض الخطة" : "View Lesson"}
              </button>
            </div>
          </Card>

          <Card className="p-8 border-none shadow-sm bg-white rounded-[48px]">
            <h4 className="font-bold text-stone-900 mb-8">{isRTL ? "أدوات مساعدة" : "Learning Tools"}</h4>
            <div className="grid grid-cols-2 gap-4">
              {[
                { name: isRTL ? "المكتبة" : "Library", icon: Book, color: "text-blue-500", bg: "bg-blue-50" },
                { name: isRTL ? "المذكرات" : "Flashcards", icon: Brain, color: "text-purple-500", bg: "bg-purple-50" },
                { name: isRTL ? "الاستراحة" : "Break Timer", icon: Coffee, color: "text-amber-500", bg: "bg-amber-50" },
                { name: isRTL ? "الإحصائيات" : "Stats", icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50" },
              ].map((tool, i) => (
                <div key={i} className="flex flex-col items-center justify-center p-4 rounded-[28px] border border-stone-50 hover:bg-stone-50 cursor-pointer transition-all gap-3 group">
                  <div className={`h-12 w-12 rounded-2xl ${tool.bg} ${tool.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <tool.icon size={24} />
                  </div>
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{tool.name}</span>
                </div>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}