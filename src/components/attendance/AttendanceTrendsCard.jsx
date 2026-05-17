import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, AlertCircle, BarChart2 } from "lucide-react";
import { format, subDays } from "date-fns";
import { arSA } from "date-fns/locale";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/translations";

export default function AttendanceTrendsCard({ records }) {
  const { language } = useLanguage();
  const isRTL = language === "ar";

  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const dateObj = subDays(new Date(), 6 - i);
      const d = format(dateObj, "yyyy-MM-dd");
      const dayRecs = records.filter(r => r.date === d);
      const absences = dayRecs.filter(r => r.status === "absent").length;
      const total = dayRecs.length;
      return { 
        date: d, 
        label: format(dateObj, "EEE", { locale: isRTL ? arSA : undefined }), 
        total, 
        absences 
      };
    });
  }, [records, isRTL]);

  const maxTotal = Math.max(...last7Days.map(d => d.total), 1);

  // Students with 3+ absences in last 30 days (gate_in type only)
  const frequentAbsentees = useMemo(() => {
    const cutoff = format(subDays(new Date(), 30), "yyyy-MM-dd");
    const absenceMap = {};
    records
      .filter(r => r.date >= cutoff && r.status === "absent" && r.type === "gate_in")
      .forEach(r => {
        if (!absenceMap[r.student_name]) absenceMap[r.student_name] = { count: 0, lastDate: r.date };
        absenceMap[r.student_name].count++;
        if (r.date > absenceMap[r.student_name].lastDate) absenceMap[r.student_name].lastDate = r.date;
      });
    return Object.entries(absenceMap)
      .filter(([, v]) => v.count >= 3)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5);
  }, [records]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      {/* 7-day trend chart */}
      <Card className="p-8 border-none bg-white/50 backdrop-blur-xl shadow-sm hover:shadow-lg transition-all duration-500">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
            <BarChart2 className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-lg">{isRTL ? "الحضور اليومي (٧ أيام)" : "Daily Attendance (7 days)"}</h3>
            <p className="text-sm text-muted-foreground">{isRTL ? "إجمالي السجلات اليومية" : "Total records per day"}</p>
          </div>
        </div>
        
        <div className="flex items-end gap-3 h-40">
          {last7Days.map(d => (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-2 group">
              <div className="w-full flex flex-col justify-end gap-1" style={{ height: "120px" }}>
                {/* total bar */}
                <div
                  className="w-full bg-blue-100 rounded-lg transition-all duration-500 relative overflow-hidden group-hover:shadow-md"
                  style={{ height: `${maxTotal > 0 ? (d.total / maxTotal) * 120 : 0}px`, minHeight: d.total > 0 ? "8px" : "0" }}
                >
                  {/* absence overlay */}
                  {d.absences > 0 && (
                    <div
                      className="absolute bottom-0 w-full bg-rose-400/80 transition-all duration-500"
                      style={{ height: `${d.total > 0 ? (d.absences / d.total) * 100 : 0}%` }}
                    />
                  )}
                </div>
              </div>
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-widest">{d.label}</span>
              <span className="text-[11px] font-black text-stone-900">{d.total > 0 ? d.total : '-'}</span>
            </div>
          ))}
        </div>
        
        <div className="flex justify-center items-center gap-6 mt-6 p-4 bg-stone-50 rounded-xl border border-stone-100">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-blue-100 shadow-inner" />
            <span className="text-xs font-bold text-stone-600">{t("attendance.present", language)}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-rose-400 shadow-inner" />
            <span className="text-xs font-bold text-stone-600">{t("attendance.absent", language)}</span>
          </div>
        </div>
      </Card>

      {/* Frequent absentees */}
      <Card className="p-8 border-none bg-white/50 backdrop-blur-xl shadow-sm hover:shadow-lg transition-all duration-500">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-lg">{isRTL ? "الغياب المتكرر" : "Frequent Absences"}</h3>
            <p className="text-sm text-muted-foreground">{isRTL ? "غياب ٣ مرات أو أكثر (آخر ٣٠ يوم)" : "Students absent 3+ times in last 30 days"}</p>
          </div>
        </div>
        
        {frequentAbsentees.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-200">
            <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center mb-3">
              <TrendingDown className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-sm font-bold text-stone-600">{isRTL ? "لا يوجد غياب متكرر للطلاب" : "No students with frequent absences"}</p>
            <p className="text-xs text-stone-400 mt-1">{isRTL ? "معدل الحضور ممتاز!" : "Attendance looks good!"}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {frequentAbsentees.map(([name, info]) => (
              <div key={name} className="flex items-center justify-between p-4 rounded-2xl bg-stone-50 border border-transparent hover:border-stone-100 hover:bg-white transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center font-black text-amber-700 text-sm">
                    {name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-stone-900">{name}</p>
                    <p className="text-[11px] font-semibold text-stone-500 mt-1 uppercase tracking-widest">
                      {isRTL ? "آخر غياب: " : "Last absent: "}{info.lastDate}
                    </p>
                  </div>
                </div>
                <Badge variant={info.count >= 5 ? "destructive" : "secondary"} className="px-3 py-1 text-xs font-bold">
                  {info.count} {isRTL ? "أيام" : "days"}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}