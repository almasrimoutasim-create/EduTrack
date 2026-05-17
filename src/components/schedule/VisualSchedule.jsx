import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, BookOpen, CalendarDays } from "lucide-react";

const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const TODAY = DAYS[new Date().getDay()];

const SUBJECT_COLORS = [
  "bg-blue-500", "bg-violet-500", "bg-emerald-500", "bg-amber-500",
  "bg-rose-500", "bg-cyan-500", "bg-orange-500", "bg-teal-500",
];

function timeToMinutes(t) {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function nowMinutes() {
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes();
}

function UpcomingAlerts({ classes, tasks }) {
  const now = nowMinutes();
  const todayClasses = classes.filter(c => c.day_of_week === TODAY);

  const upcoming = todayClasses
    .filter(c => timeToMinutes(c.start_time) > now)
    .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time))
    .slice(0, 2);

  const current = todayClasses.find(c =>
    timeToMinutes(c.start_time) <= now && timeToMinutes(c.end_time) >= now
  );

  const today = new Date().toISOString().split("T")[0];
  const overdueTasks = tasks.filter(t => t.due_date && t.due_date < today);
  const dueSoon = tasks.filter(t => {
    if (!t.due_date || t.due_date < today) return false;
    const diff = (new Date(t.due_date) - new Date(today)) / (1000 * 60 * 60 * 24);
    return diff <= 2;
  });

  if (!current && upcoming.length === 0 && overdueTasks.length === 0 && dueSoon.length === 0) return null;

  return (
    <div className="space-y-2 mb-5">
      {current && (
        <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-xl px-4 py-3">
          <span className="h-2 w-2 bg-primary rounded-full animate-pulse shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-primary">Now in class</p>
            <p className="text-xs text-muted-foreground">{current.subject_name} · ends {current.end_time}{current.room ? ` · Room ${current.room}` : ""}</p>
          </div>
          <Badge className="text-[10px]">Live</Badge>
        </div>
      )}

      {upcoming.map((c, i) => {
        const minsLeft = timeToMinutes(c.start_time) - now;
        const label = minsLeft < 60 ? `in ${minsLeft} min` : `at ${c.start_time}`;
        return (
          <div key={i} className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <Clock className="h-4 w-4 text-amber-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800">Upcoming: {c.subject_name}</p>
              <p className="text-xs text-amber-600">Starts {label}{c.room ? ` · Room ${c.room}` : ""}</p>
            </div>
          </div>
        );
      })}

      {overdueTasks.map((t, i) => (
        <div key={i} className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-700">Overdue: {t.title}</p>
            <p className="text-xs text-red-500">{t.subject_name} · was due {t.due_date}</p>
          </div>
        </div>
      ))}

      {dueSoon.map((t, i) => (
        <div key={i} className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
          <BookOpen className="h-4 w-4 text-orange-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-orange-700">Due soon: {t.title}</p>
            <p className="text-xs text-orange-500">{t.subject_name} · due {t.due_date}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function DayTimeline({ classes, colorMap }) {
  const sorted = [...classes].sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));
  const now = nowMinutes();

  if (sorted.length === 0) return (
    <div className="py-8 text-center text-sm text-muted-foreground">No classes scheduled.</div>
  );

  const startHour = Math.max(0, Math.floor(timeToMinutes(sorted[0].start_time) / 60) - 0);
  const endHour = Math.ceil(timeToMinutes(sorted[sorted.length - 1].end_time) / 60);
  const totalMins = (endHour - startHour) * 60;
  const offsetMins = startHour * 60;
  const PX_PER_MIN = 1.4;
  const totalHeight = totalMins * PX_PER_MIN;

  return (
    <div className="relative" style={{ height: `${Math.max(totalHeight, 200)}px` }}>
      {/* Hour lines */}
      {Array.from({ length: endHour - startHour + 1 }).map((_, i) => {
        const h = startHour + i;
        const top = (h * 60 - offsetMins) * PX_PER_MIN;
        return (
          <div key={h} className="absolute left-0 right-0 flex items-center pointer-events-none" style={{ top }}>
            <span className="text-[10px] text-muted-foreground w-10 shrink-0 -mt-2 text-right pr-2">{String(h).padStart(2,"0")}:00</span>
            <div className="flex-1 h-px bg-border" />
          </div>
        );
      })}

      {/* Now line */}
      {now >= offsetMins && now <= offsetMins + totalMins && (
        <div className="absolute left-0 right-0 flex items-center z-20 pointer-events-none"
          style={{ top: (now - offsetMins) * PX_PER_MIN }}>
          <div className="w-10 flex justify-end pr-1"><div className="w-2 h-2 rounded-full bg-red-500" /></div>
          <div className="flex-1 h-0.5 bg-red-400" />
        </div>
      )}

      {/* Class blocks */}
      {sorted.map((c, i) => {
        const top = (timeToMinutes(c.start_time) - offsetMins) * PX_PER_MIN;
        const height = Math.max((timeToMinutes(c.end_time) - timeToMinutes(c.start_time)) * PX_PER_MIN, 32);
        const isNow = timeToMinutes(c.start_time) <= now && timeToMinutes(c.end_time) >= now;
        const color = colorMap[c.subject_name] || SUBJECT_COLORS[0];
        return (
          <div key={c.id || i}
            className={`absolute left-12 right-0 rounded-lg px-3 py-1.5 text-white shadow-sm ${color} ${isNow ? "ring-2 ring-white ring-offset-2 z-10" : "opacity-90 hover:opacity-100"}`}
            style={{ top, height }}>
            <p className="text-xs font-semibold truncate leading-tight">{c.subject_name}</p>
            <p className="text-[10px] opacity-80 truncate">{c.start_time}–{c.end_time}{c.room ? ` · Rm ${c.room}` : ""}{c.grade ? ` · Gr ${c.grade}` : ""}</p>
          </div>
        );
      })}
    </div>
  );
}

export default function VisualSchedule({ classes = [], tasks = [] }) {
  const [selectedDay, setSelectedDay] = useState(TODAY);

  const colorMap = useMemo(() => {
    const subjects = [...new Set(classes.map(c => c.subject_name))];
    return Object.fromEntries(subjects.map((s, i) => [s, SUBJECT_COLORS[i % SUBJECT_COLORS.length]]));
  }, [classes]);

  const byDay = useMemo(() => DAYS.reduce((acc, d) => {
    acc[d] = classes.filter(c => c.day_of_week === d);
    return acc;
  }, {}), [classes]);

  const displayDays = DAYS.filter(d => byDay[d].length > 0 || d === TODAY);
  const daysToShow = displayDays.length > 0 ? displayDays : DAYS.slice(0, 5);

  const today = new Date().toISOString().split("T")[0];
  const upcomingTasks = tasks.filter(t => t.due_date && t.due_date >= today).sort((a, b) => a.due_date.localeCompare(b.due_date));

  return (
    <div className="space-y-4">
      <UpcomingAlerts classes={classes} tasks={tasks} />

      {/* Day picker */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {daysToShow.map(day => (
          <button key={day} onClick={() => setSelectedDay(day)}
            className={`shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              selectedDay === day ? "bg-primary text-primary-foreground shadow" : "bg-card border hover:bg-muted"
            } ${day === TODAY && selectedDay !== day ? "border-primary/40" : ""}`}>
            <span className="block">{day.slice(0, 3)}</span>
            {day === TODAY && <span className={`block text-[9px] mt-0.5 ${selectedDay === day ? "opacity-70" : "text-primary font-semibold"}`}>Today</span>}
            {byDay[day].length > 0 && <span className={`block text-[9px] ${selectedDay === day ? "opacity-60" : "text-muted-foreground"}`}>{byDay[day].length} cls</span>}
          </button>
        ))}
      </div>

      {/* Timeline card */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold text-sm">{selectedDay}{selectedDay === TODAY ? " — Today" : ""}</span>
          <Badge variant="outline" className="text-xs ml-auto">{byDay[selectedDay]?.length || 0} classes</Badge>
        </div>
        <DayTimeline classes={byDay[selectedDay] || []} colorMap={colorMap} />
      </Card>

      {/* Subject legend */}
      {Object.keys(colorMap).length > 0 && (
        <div className="flex flex-wrap gap-2 px-1">
          {Object.entries(colorMap).map(([subject, color]) => (
            <div key={subject} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
              {subject}
            </div>
          ))}
        </div>
      )}

      {/* Homework & deadlines */}
      {upcomingTasks.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5" /> Homework & Deadlines
          </p>
          {upcomingTasks.slice(0, 6).map(t => {
            const daysLeft = Math.ceil((new Date(t.due_date) - new Date(today)) / (1000 * 60 * 60 * 24));
            const isDueSoon = daysLeft <= 2;
            return (
              <div key={t.id} className={`flex items-center gap-3 rounded-xl px-4 py-3 border ${isDueSoon ? "bg-amber-50 border-amber-200" : "bg-card"}`}>
                <BookOpen className={`h-4 w-4 shrink-0 ${isDueSoon ? "text-amber-500" : "text-muted-foreground"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{t.title}</p>
                  <p className="text-xs text-muted-foreground">{t.subject_name}{t.grade ? ` · Grade ${t.grade}` : ""}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-xs font-semibold ${isDueSoon ? "text-amber-600" : "text-muted-foreground"}`}>
                    {daysLeft === 0 ? "Due today!" : `${daysLeft}d left`}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{t.due_date}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}