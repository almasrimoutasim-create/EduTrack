import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from "recharts";
import { Card } from "@/components/ui/card";
import { TrendingUp, Users } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/translations";

const COLORS = [
  "#3b82f6","#6366f1","#8b5cf6","#a855f7",
  "#d946ef","#ec4899","#f43f5e","#f97316",
  "#eab308","#10b981","#06b6d4","#0ea5e9"
];

export default function GradeDistributionChart({ students = [] }) {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const totalActive = students.filter(s => s.status === "active" || !s.status).length;

  const gradeData = Array.from({ length: 12 }, (_, i) => {
    const g = String(i + 1);
    const count = students.filter(s => String(s.grade) === g && (s.status === "active" || !s.status)).length;
    return {
      grade: g,
      label: isRTL ? `الصف ${g}` : `Grade ${g}`,
      count,
      pct: totalActive > 0 ? ((count / totalActive) * 100).toFixed(0) : 0
    };
  });

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-white border border-stone-200 px-3 py-2 rounded-xl shadow-xl text-xs space-y-1" dir={isRTL ? "rtl" : "ltr"}>
          <p className="font-bold text-stone-800">{d.label}</p>
          <p className="text-primary font-semibold flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            {d.count} {isRTL ? "طالب" : "students"} ({d.pct}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-6 border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white/70 backdrop-blur-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
          <TrendingUp className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h3 className="font-bold text-base text-stone-900">
            {isRTL ? "توزيع الطلاب على الصفوف" : "Grade Distribution"}
          </h3>
          <p className="text-xs text-muted-foreground">
            {isRTL ? `إجمالي الطلاب النشطين: ${totalActive}` : `Total active students: ${totalActive}`}
          </p>
        </div>
      </div>

      {totalActive === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <TrendingUp className="h-12 w-12 opacity-20 mb-3" />
          <p className="text-sm font-medium">{isRTL ? "لا توجد بيانات" : "No data available"}</p>
        </div>
      ) : (
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={gradeData} margin={{ top: 10, right: 8, left: -24, bottom: 4 }}>
              <XAxis
                dataKey="grade"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#78716c" }}
                tickFormatter={(v) => isRTL ? `ص${v}` : `G${v}`}
              />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#78716c" }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} animationDuration={800}>
                {gradeData.map((entry, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} opacity={entry.count > 0 ? 0.9 : 0.18} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
