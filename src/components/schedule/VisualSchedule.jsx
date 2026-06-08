import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Laptop, 
  Compass, 
  Sparkles, 
  Activity, 
  ShieldAlert, 
  BookMarked,
  Calculator,
  Atom,
  Clock,
  Pin
} from "lucide-react";

const DAYS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAYS_AR = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

const DAY_COLORS = {
  "Sunday": { bg: "bg-[#0e74b0] border-[#0c6294]", nameAr: "الأحد" },
  "Monday": { bg: "bg-[#e05424] border-[#be471e]", nameAr: "الإثنين" },
  "Tuesday": { bg: "bg-[#a66a38] border-[#8e5a2f]", nameAr: "الثلاثاء" },
  "Wednesday": { bg: "bg-[#3b873e] border-[#327235]", nameAr: "الأربعاء" },
  "Thursday": { bg: "bg-[#d6543b] border-[#b84732]", nameAr: "الخميس" },
  "Notes": { bg: "bg-[#dca038] border-[#bd892f]", nameAr: "المهام والأنشطة" }
};

function getSubjectIcon(subjectName) {
  const name = subjectName || "";
  if (name.includes("رياضيات")) return <Calculator className="h-3.5 w-3.5 inline mr-1 ml-1" />;
  if (name.includes("عربي") || name.includes("العربية")) return <BookMarked className="h-3.5 w-3.5 inline mr-1 ml-1" />;
  if (name.includes("إنجليزي") || name.includes("الإنجليزية")) return <BookOpen className="h-3.5 w-3.5 inline mr-1 ml-1" />;
  if (name.includes("علوم") || name.includes("فيزياء") || name.includes("كيمياء") || name.includes("أحياء")) return <Atom className="h-3.5 w-3.5 inline mr-1 ml-1" />;
  if (name.includes("تكنولوجيا") || name.includes("حاسوب") || name.includes("هندسية")) return <Laptop className="h-3.5 w-3.5 inline mr-1 ml-1" />;
  if (name.includes("تاريخ") || name.includes("جغرافيا")) return <Compass className="h-3.5 w-3.5 inline mr-1 ml-1" />;
  if (name.includes("نشاط")) return <Activity className="h-3.5 w-3.5 inline mr-1 ml-1" />;
  if (name.includes("إشراف")) return <ShieldAlert className="h-3.5 w-3.5 inline mr-1 ml-1" />;
  return <Sparkles className="h-3.5 w-3.5 inline mr-1 ml-1" />;
}

function getSubjectBadgeStyle(subjectName) {
  const name = subjectName || "";
  if (name.includes("رياضيات")) return "bg-blue-50 text-blue-800 border-blue-200/60";
  if (name.includes("عربي") || name.includes("العربية")) return "bg-orange-50 text-orange-800 border-orange-200/60";
  if (name.includes("إنجليزي") || name.includes("الإنجليزية")) return "bg-purple-50 text-purple-800 border-purple-200/60";
  if (name.includes("علوم") || name.includes("فيزياء") || name.includes("كيمياء") || name.includes("أحياء")) return "bg-emerald-50 text-emerald-800 border-emerald-200/60";
  if (name.includes("تكنولوجيا") || name.includes("حاسوب") || name.includes("هندسية")) return "bg-cyan-50 text-cyan-800 border-cyan-200/60";
  if (name.includes("تاريخ") || name.includes("جغرافيا")) return "bg-amber-50 text-amber-800 border-amber-200/60";
  if (name.includes("إسلامية") || name.includes("التربية الاسلامية")) return "bg-rose-50 text-rose-800 border-rose-200/60";
  if (name.includes("نشاط")) return "bg-teal-50 text-teal-800 border-teal-200/60";
  if (name.includes("إشراف")) return "bg-stone-100 text-stone-700 border-stone-200";
  return "bg-stone-50 text-stone-700 border-stone-200";
}

export default function VisualSchedule({ classes = [], tasks = [] }) {
  const isRTL = typeof document !== 'undefined' && (document.documentElement.dir === 'rtl' || document.documentElement.lang === 'ar');
  const today = new Date().toISOString().split("T")[0];

  // Group schedules by day
  const byDay = useMemo(() => DAYS_EN.reduce((acc, d) => {
    acc[d] = classes
      .filter(c => c.day_of_week === d)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
    return acc;
  }, {}), [classes]);

  // Homework and deadlines for the Notes card
  const upcomingTasks = useMemo(() => {
    return tasks
      .filter(t => t.due_date && t.due_date >= today)
      .sort((a, b) => a.due_date.localeCompare(b.due_date))
      .slice(0, 5);
  }, [tasks, today]);

  // Define layout of cards (5 workdays + 1 notes card)
  const scheduleCards = [
    { type: "day", key: "Sunday", ...DAY_COLORS["Sunday"] },
    { type: "day", key: "Monday", ...DAY_COLORS["Monday"] },
    { type: "day", key: "Tuesday", ...DAY_COLORS["Tuesday"] },
    { type: "day", key: "Wednesday", ...DAY_COLORS["Wednesday"] },
    { type: "day", key: "Thursday", ...DAY_COLORS["Thursday"] },
    { type: "notes", key: "Notes", ...DAY_COLORS["Notes"] }
  ];

  return (
    <div className="space-y-6 select-none" dir={isRTL ? "rtl" : "ltr"}>
      {/* School Board Wrapper Container */}
      <div 
        className="relative rounded-[40px] p-6 md:p-10 overflow-hidden bg-[#575993] text-stone-900 shadow-2xl border-[10px] border-[#383a69]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.04) 2px, transparent 2px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.04) 2px, transparent 2px)
          `,
          backgroundSize: '24px 24px'
        }}
      >
        {/* Ribbon Header Banner */}
        <div className="relative bg-[#6c6fa5] text-white px-8 py-3 rounded-lg text-lg md:text-2xl font-serif font-black tracking-wider shadow-lg max-w-sm mx-auto text-center mb-10 border-b-4 border-[#4d4e78]">
          <div className="absolute top-1/2 -left-3.5 w-6 h-6 bg-[#43456b] rotate-45 -translate-y-1/2 -z-10 rounded" />
          <div className="absolute top-1/2 -right-3.5 w-6 h-6 bg-[#43456b] rotate-45 -translate-y-1/2 -z-10 rounded" />
          <span className="flex items-center justify-center gap-2">
            <BookMarked className="h-5 w-5" />
            {isRTL ? "جدول الحصص الأسبوعي" : "Weekly Schedule"}
          </span>
        </div>

        {/* 3x2 Grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
          {scheduleCards.map((card) => {
            const dayClasses = byDay[card.key] || [];

            return (
              <div key={card.key} className="flex flex-col group transition-transform duration-300 hover:scale-[1.02]">
                {/* 3D Header Tab */}
                <div className={`text-white text-xs font-black uppercase tracking-wider py-2.5 px-4 rounded-t-2xl shadow-md border-b-4 ${card.bg} flex items-center justify-between`}>
                  <span>{isRTL ? card.nameAr : card.key}</span>
                  {card.type === "day" && (
                    <Badge className="bg-white/20 text-white font-bold border-none text-[9px] px-1.5 py-0.5 rounded">
                      {dayClasses.length} {isRTL ? "حصص" : "cls"}
                    </Badge>
                  )}
                </div>

                {/* Notepad lined sheet */}
                <div 
                  className="bg-[#eef1f6] border-2 border-t-0 border-stone-250 shadow-lg rounded-b-3xl p-5 flex-1 min-h-[250px] relative overflow-hidden"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(transparent, transparent 33px, #d4dae6 33px, #d4dae6 34px)',
                    lineHeight: '34px'
                  }}
                >
                  {/* Decorative Pin */}
                  <div className="absolute top-1.5 left-1/2 -translate-x-1/2 opacity-25">
                    <Pin className="h-4.5 w-4.5 rotate-45 text-stone-500 fill-stone-500" />
                  </div>

                  <div className="pt-2 text-xs font-bold text-stone-600 space-y-[0px]">
                    {card.type === "day" ? (
                      dayClasses.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-center text-[10px] text-stone-400 py-12">
                          {isRTL ? "لا توجد حصص اليوم" : "No classes scheduled"}
                        </div>
                      ) : (
                        dayClasses.map((cls, idx) => (
                          <div key={cls.id || idx} className="truncate border-b border-dashed border-stone-305 flex items-center justify-between hover:text-stone-900 transition-colors h-[34px] px-1">
                            <span className="truncate flex items-center gap-1.5">
                              <span className="text-[10px] text-stone-450 font-black">{idx + 1}.</span>
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[11px] font-black leading-none shadow-sm ${getSubjectBadgeStyle(cls.subject_name)}`}>
                                {getSubjectIcon(cls.subject_name)}
                                <span>{cls.subject_name}</span>
                              </span>
                            </span>
                            <span className="num-en text-[11px] font-extrabold text-stone-600 tracking-tight shrink-0 bg-stone-200/50 px-1.5 py-0.5 rounded-md leading-none">
                              {cls.start_time} - {cls.end_time}
                            </span>
                          </div>
                        ))
                      )
                    ) : (
                      // Notes / Homework card
                      upcomingTasks.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-center text-[10px] text-stone-400 py-12">
                          {isRTL ? "لا توجد واجبات حالية" : "No homework set"}
                        </div>
                      ) : (
                        upcomingTasks.map((t, idx) => (
                          <div key={t.id || idx} className="truncate border-b border-dashed border-stone-305 flex items-center justify-between hover:text-stone-900 transition-colors h-[34px] px-1">
                            <span className="truncate flex items-center gap-1.5">
                              <span className="text-[10px] text-[#bd892f] font-black">★</span>
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[11px] font-black leading-none shadow-sm ${getSubjectBadgeStyle(t.subject_name)}`}>
                                {getSubjectIcon(t.subject_name)}
                                <span>{t.title}</span>
                              </span>
                            </span>
                            <span className="num-en text-[10px] font-extrabold text-[#bd892f] shrink-0 bg-amber-100/60 px-1.5 py-0.5 rounded-md leading-none">
                              {t.due_date.slice(5)}
                            </span>
                          </div>
                        ))
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* School items vector illustration style overlay */}
        <div className="absolute -bottom-8 -left-8 text-white/5 rotate-12 pointer-events-none z-0">
          <BookOpen size={160} />
        </div>
        <div className="absolute -bottom-10 -right-10 text-white/5 -rotate-12 pointer-events-none z-0">
          <Laptop size={180} />
        </div>
      </div>
    </div>
  );
}