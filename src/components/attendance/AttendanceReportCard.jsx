import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, subDays, parseISO } from "date-fns";
import { arSA } from "date-fns/locale";
import { ClipboardList, AlertTriangle, UserX, CheckCircle2, Clock } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/translations";

export default function AttendanceReportCard({ records = [] }) {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const today = format(new Date(), "yyyy-MM-dd");

  // Daily summary for today
  const todayRecords = useMemo(() =>
    records.filter(r => r.date === today && r.type === "gate_in"), [records, today]);

  const dailySummary = useMemo(() => {
    const present = todayRecords.filter(r => r.status === "present").length;
    const absent  = todayRecords.filter(r => r.status === "absent").length;
    const late    = todayRecords.filter(r => r.status === "late").length;
    const excused = todayRecords.filter(r => r.status === "excused").length;
    return { present, absent, late, excused, total: todayRecords.length };
  }, [todayRecords]);

  // Flag students with 3+ absences in last 30 days (gate_in only)
  const flagged = useMemo(() => {
    const cutoff = format(subDays(new Date(), 30), "yyyy-MM-dd");
    const absences = {};
    records.forEach(r => {
      if (r.type !== "gate_in" || r.status !== "absent") return;
      if (r.date < cutoff) return;
      if (!absences[r.student_id]) {
        absences[r.student_id] = { student_name: r.student_name, count: 0, lastDate: r.date };
      }
      absences[r.student_id].count++;
      if (r.date > absences[r.student_id].lastDate) absences[r.student_id].lastDate = r.date;
    });
    return Object.values(absences)
      .filter(s => s.count >= 3)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [records]);

  const attendanceRate = dailySummary.total > 0
    ? Math.round((dailySummary.present / dailySummary.total) * 100)
    : null;

  return (
    <Card className="p-6 border-none bg-white/50 backdrop-blur-xl shadow-sm hover:shadow-lg transition-all duration-500 mb-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
          <ClipboardList className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <h3 className="font-bold text-base">{isRTL ? "تقرير الحضور اليومي" : "Daily Attendance Report"}</h3>
          <p className="text-xs text-muted-foreground">{format(new Date(), "EEEE, MMMM d, yyyy", { locale: isRTL ? arSA : undefined })}</p>
        </div>
        {attendanceRate !== null && (
          <div className={`ms-auto text-xs font-black px-3 py-1 rounded-full shadow-sm ${attendanceRate >= 80 ? "bg-emerald-100 text-emerald-700" : attendanceRate >= 60 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
            {attendanceRate}% {isRTL ? "نسبة الحضور" : "rate"}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: t("attendance.present", language),  value: dailySummary.present,  icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", hover: "hover:bg-emerald-100 border-emerald-100" },
          { label: t("attendance.absent", language),   value: dailySummary.absent,   icon: UserX,        color: "text-rose-600",     bg: "bg-rose-50", hover: "hover:bg-rose-100 border-rose-100" },
          { label: t("attendance.late", language),     value: dailySummary.late,     icon: Clock,        color: "text-amber-600",   bg: "bg-amber-50", hover: "hover:bg-amber-100 border-amber-100" },
          { label: t("attendance.excused", language),  value: dailySummary.excused,  icon: ClipboardList,color: "text-blue-600",    bg: "bg-blue-50", hover: "hover:bg-blue-100 border-blue-100" },
        ].map(({ label, value, icon: Icon, color, bg, hover }) => (
          <div key={label} className={`rounded-2xl p-3 border border-transparent transition-all duration-300 ${bg} ${hover} group`}>
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`h-4 w-4 ${color} shrink-0 group-hover:scale-110 transition-transform`} />
              <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">{label}</p>
            </div>
            <p className="text-2xl font-black text-stone-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Flagged Students */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <p className="text-xs font-bold text-stone-700">{isRTL ? "غياب متكرر (آخر ٣٠ يوم)" : "Frequent Absences (last 30 days)"}</p>
          {flagged.length > 0 && (
            <Badge variant="secondary" className="text-[10px] font-bold px-1.5 py-0 rounded-full">{flagged.length} {isRTL ? "طلاب" : "students"}</Badge>
          )}
        </div>
        {flagged.length === 0 ? (
          <div className="text-xs font-bold text-stone-500 text-center py-4 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
            {isRTL ? "! لا يوجد طلاب مع غياب متكرر - معدل الحضور ممتاز" : "No students flagged — attendance looks good!"}
          </div>
        ) : (
          <div className="space-y-2">
            {flagged.map((s, i) => (
              <div key={i} className="flex items-center justify-between py-2 px-3 bg-amber-50 rounded-2xl border border-amber-100 hover:bg-white hover:shadow-sm transition-all group">
                <div>
                  <p className="text-xs font-bold text-stone-900">{s.student_name}</p>
                  <p className="text-[10px] font-semibold text-stone-500 mt-0.5 uppercase tracking-widest">{isRTL ? "آخر غياب: " : "Last absent: "}{format(parseISO(s.lastDate), "MMM d", { locale: isRTL ? arSA : undefined })}</p>
                </div>
                <Badge className={`text-[10px] font-bold px-2 py-0.5 border-0 shadow-sm ${s.count >= 7 ? "bg-rose-100 text-rose-700 hover:bg-rose-200" : "bg-amber-100 text-amber-700 hover:bg-amber-200"}`}>
                  {s.count} {isRTL ? "أيام غياب" : "absences"}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}