import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar, BookOpen, ClipboardList } from "lucide-react";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, isSameDay, isToday, addMonths, subMonths
} from "date-fns";
import { arSA } from "date-fns/locale";
import { useLanguage } from "@/lib/LanguageContext";

const AR_DAY_NAMES = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const EN_DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const DOT_COLORS = {
  class: "bg-blue-500",
  task: "bg-amber-500",
  exam: "bg-rose-500",
};

export default function DashboardCalendar() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const DAY_NAMES = isRTL ? AR_DAY_NAMES : EN_DAY_NAMES;

  const [current, setCurrent] = useState(new Date());
  const [selected, setSelected] = useState(new Date());

  const { data: schedules = [] } = useQuery({
    queryKey: ["all-schedules-cal"],
    queryFn: () => base44.entities.ClassSchedule.list(),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["all-tasks-cal"],
    queryFn: () => base44.entities.TeacherTask.list(),
  });

  const monthStart = startOfMonth(current);
  const monthEnd = endOfMonth(current);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart);

  // Build events map: date string -> list of events
  const eventsMap = useMemo(() => {
    const map = {};
    const addEvent = (dateStr, event) => {
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(event);
    };

    // Class schedules — map recurring weekly
    days.forEach(day => {
      const dayName = format(day, "EEEE");
      schedules
        .filter(s => s.day_of_week === dayName)
        .forEach(s => {
          addEvent(format(day, "yyyy-MM-dd"), {
            type: "class",
            label: s.subject_name,
            sub: `${s.start_time} · ${isRTL ? "الصف" : "Grade"} ${s.grade}${s.section ? s.section : ""}`,
            color: "blue",
          });
        });
    });

    // Tasks / deadlines
    tasks.forEach(t => {
      if (!t.due_date) return;
      const dateStr = t.due_date.slice(0, 10);
      const isExam = /exam|test|quiz|اختبار/i.test(t.title);
      addEvent(dateStr, {
        type: isExam ? "exam" : "task",
        label: t.title,
        sub: `${isRTL ? "الصف" : "Grade"} ${t.grade} · ${t.subject_name}`,
        color: isExam ? "red" : "amber",
      });
    });

    return map;
  }, [schedules, tasks, current, isRTL, days]);

  const selectedKey = format(selected, "yyyy-MM-dd");
  const selectedEvents = eventsMap[selectedKey] || [];

  const colorClasses = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    red: "bg-rose-50 text-rose-700 border-rose-100",
  };

  const handlePrevMonth = () => setCurrent(subMonths(current, 1));
  const handleNextMonth = () => setCurrent(addMonths(current, 1));

  return (
    <Card className="p-8 border-none bg-white/50 backdrop-blur-xl shadow-sm hover:shadow-lg transition-all duration-500">
      <div className="flex flex-col gap-5 mb-8">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg">{isRTL ? "التقويم الدراسي" : "School Calendar"}</h3>
            <p className="text-sm text-muted-foreground">{isRTL ? "الحصص، المواعيد النهائية والاختبارات" : "Classes, deadlines & exams"}</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between bg-stone-50 p-2 rounded-xl border border-stone-100">
          <button onClick={handlePrevMonth} className="p-2 rounded-lg hover:bg-white hover:shadow-sm text-stone-500 hover:text-stone-900 transition-all">
            <ChevronLeft className="h-5 w-5 rtl:rotate-180" />
          </button>
          <span className="text-sm font-black w-32 text-center text-stone-700 uppercase tracking-widest">{format(current, "MMMM yyyy", { locale: isRTL ? arSA : undefined })}</span>
          <button onClick={handleNextMonth} className="p-2 rounded-lg hover:bg-white hover:shadow-sm text-stone-500 hover:text-stone-900 transition-all">
            <ChevronRight className="h-5 w-5 rtl:rotate-180" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 mb-6 p-4 rounded-xl bg-stone-50/50 border border-stone-100">
        <span className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-blue-500 shadow-inner" /><span className="text-xs font-bold text-stone-600">{isRTL ? "حصص" : "Classes"}</span></span>
        <span className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-amber-500 shadow-inner" /><span className="text-xs font-bold text-stone-600">{isRTL ? "مواعيد تسليم" : "Deadlines"}</span></span>
        <span className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-rose-500 shadow-inner" /><span className="text-xs font-bold text-stone-600">{isRTL ? "اختبارات" : "Exams"}</span></span>
      </div>

      {/* Grid header */}
      <div className="grid grid-cols-7 mb-2">
        {DAY_NAMES.map(d => (
          <div key={d} className="text-center text-[11px] font-bold text-stone-400 py-2 uppercase tracking-wider">{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} className="min-h-[48px]" />)}
        {days.map(day => {
          const key = format(day, "yyyy-MM-dd");
          const events = eventsMap[key] || [];
          const types = [...new Set(events.map(e => e.type))];
          const isSel = isSameDay(day, selected);
          const isT = isToday(day);

          return (
            <button
              key={key}
              onClick={() => setSelected(day)}
              className={`relative flex flex-col items-center justify-start pt-2 pb-2 rounded-xl min-h-[48px] transition-all duration-300
                ${isSel ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-105 z-10" : isT ? "bg-primary/10 text-primary font-black border border-primary/20" : "hover:bg-stone-100 text-stone-700 font-bold border border-transparent"}`}
            >
              <span className="text-sm leading-none mb-1.5">{format(day, "d")}</span>
              <div className="flex gap-1 flex-wrap justify-center px-1">
                {types.slice(0, 3).map(type => (
                  <span key={type} className={`h-1.5 w-1.5 rounded-full shadow-inner ${isSel ? "bg-primary-foreground/90" : DOT_COLORS[type]}`} />
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected day events */}
      <div className="mt-8 space-y-3">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-[1px] flex-1 bg-stone-100" />
          <p className="text-xs font-black text-stone-400 uppercase tracking-widest px-2">
            {format(selected, "EEEE, MMMM d", { locale: isRTL ? arSA : undefined })}
          </p>
          <div className="h-[1px] flex-1 bg-stone-100" />
        </div>
        
        {selectedEvents.length === 0 ? (
          <div className="text-sm font-bold text-stone-500 text-center py-6 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
            {isRTL ? "لا يوجد أحداث مجدولة" : "No events scheduled"}
          </div>
        ) : (
          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {selectedEvents.map((ev, i) => (
              <div key={i} className={`flex items-start gap-3 p-4 rounded-2xl border text-sm transition-all hover:scale-[1.02] ${colorClasses[ev.color]}`}>
                <div className="mt-0.5 bg-white/50 p-2 rounded-xl shrink-0">
                  {ev.type === "class" ? <BookOpen className="h-4 w-4" /> : <ClipboardList className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold truncate">{ev.label}</p>
                  <p className="opacity-80 text-xs font-semibold mt-1 uppercase tracking-widest">{ev.sub}</p>
                </div>
                {ev.type === "exam" && <Badge className="ms-auto shrink-0 text-[10px] font-bold px-2 py-0.5 bg-rose-100 text-rose-700 border-0">{isRTL ? "اختبار" : "Exam"}</Badge>}
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}