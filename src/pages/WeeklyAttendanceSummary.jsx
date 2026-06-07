import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { 
  BarChart3,
  ArrowUpRight,
  Download,
  Filter
} from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import PageHeader from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all border-2 border-stone-200 bg-white text-stone-800 hover:bg-stone-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const btnPrimary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all bg-stone-900 text-white hover:bg-black cursor-pointer shadow-lg shadow-stone-200 disabled:opacity-50 disabled:cursor-not-allowed";

export default function WeeklyAttendanceSummary() {
  const { language } = useLanguage();
  const isRTL = language === "ar";

  const { data: attendanceData = [] } = useQuery({ 
    queryKey: ["weekly-attendance"], 
    // @ts-ignore
    queryFn: () => base44.entities.Attendance.list("-created_at", {}, 50),
    staleTime: 1000 * 60 * 5
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  // Mock weekly breakdown
  const weeklyBreakdown = [
    { day: isRTL ? "الأحد" : "Sun", rate: 98, status: "excellent" },
    { day: isRTL ? "الاثنين" : "Mon", rate: 95, status: "excellent" },
    { day: isRTL ? "الثلاثاء" : "Tue", rate: 88, status: "good" },
    { day: isRTL ? "الأربعاء" : "Wed", rate: 92, status: "excellent" },
    { day: isRTL ? "الخميس" : "Thu", rate: 75, status: "review" },
  ];

  return (
    <div className="space-y-10 pb-24" dir={isRTL ? "rtl" : "ltr"}>
      <PageHeader 
        title={isRTL ? "ملخص الحضور الأسبوعي" : "Weekly Attendance Summary"} 
        subtitle={isRTL ? "تحليل شامل لمعدلات الحضور والغياب خلال الأسبوع الحالي" : "Comprehensive analysis of attendance and absence rates during the current week"}
      >
        <div className="flex gap-3">
          <button className={`${btnOutline} rounded-full h-12 px-6`}>
            <Download size={18} />
            {isRTL ? "تحميل التقرير" : "Download PDF"}
          </button>
          <button className={`${btnPrimary} rounded-full h-12 px-6`}>
            <Filter size={18} />
            {isRTL ? "تصفية الفصول" : "Filter Classes"}
          </button>
        </div>
      </PageHeader>

      {/* High-Level Intelligence Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <Card className="lg:col-span-8 p-10 bg-white border-none shadow-sm rounded-[48px] relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h3 className="text-2xl font-serif font-black text-stone-900">{isRTL ? "معدل الحضور العام" : "Overall Attendance Rate"}</h3>
                <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mt-1">May 5 - May 11, 2024</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "مقارنة بالأسبوع الماضي" : "Vs Last Week"}</p>
                  <p className="text-emerald-500 font-black flex items-center gap-1 justify-end">
                    <ArrowUpRight size={14} /> +٢.٤٪
                  </p>
                </div>
                <div className="h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <BarChart3 size={28} />
                </div>
              </div>
            </div>

            <div className="flex items-end justify-between h-64 gap-4">
              {weeklyBreakdown.map((item, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                  <div className="w-full relative flex flex-col justify-end h-full">
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${item.rate}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className={`w-full rounded-t-2xl relative ${item.rate > 90 ? 'bg-emerald-500' : item.rate > 80 ? 'bg-amber-500' : 'bg-rose-500'} shadow-lg group-hover:scale-105 transition-transform`}
                    >
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-[10px] font-black px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.rate}٪
                      </div>
                    </motion.div>
                  </div>
                  <span className="text-xs font-black text-stone-400 uppercase tracking-widest">{item.day}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <aside className="lg:col-span-4 space-y-8">
          <Card className="p-8 bg-stone-900 text-white rounded-[48px] relative overflow-hidden">
            <div className="relative z-10">
              <h4 className="text-xl font-serif font-bold mb-8">{isRTL ? "توزيع الغياب" : "Absence Distribution"}</h4>
              <div className="space-y-6">
                {[
                  { label: isRTL ? "غياب مبرر" : "Excused", value: 65, color: "bg-blue-500" },
                  { label: isRTL ? "بدون عذر" : "Unexcused", value: 25, color: "bg-rose-500" },
                  { label: isRTL ? "تأخر صباحي" : "Late Arrival", value: 10, color: "bg-amber-500" },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-2 text-[10px] font-bold uppercase tracking-widest opacity-60">
                      <span>{item.label}</span>
                      <span>{item.value}٪</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${item.value}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className={`h-full ${item.color} rounded-full`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
          </Card>

          <Card className="p-8 bg-white border-none shadow-sm rounded-[48px]">
            <h4 className="font-bold text-stone-900 mb-6">{isRTL ? "الفصول الأكثر التزاماً" : "Top Performing Classes"}</h4>
            <div className="space-y-6">
              {[
                { name: "١٠-أ (علوم)", rate: "٩٩٪", trend: "up" },
                { name: "١٢-ج (رياضيات)", rate: "٩٨٪", trend: "up" },
                { name: "٠٩-ب (لغة عربية)", rate: "٩٧٪", trend: "stable" },
              ].map((cls, i) => (
                <div key={i} className="flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-stone-50 flex items-center justify-center font-black text-stone-400 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                      {i + 1}
                    </div>
                    <span className="text-sm font-bold text-stone-800">{cls.name}</span>
                  </div>
                  <span className="text-sm font-black text-emerald-600">{cls.rate}</span>
                </div>
              ))}
            </div>
          </Card>
        </aside>
      </div>

      {/* Detailed Table View */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-serif font-bold text-stone-900">{isRTL ? "سجل الحضور اليومي" : "Daily Attendance Log"}</h3>
          <button className="text-stone-400 font-bold text-xs hover:text-stone-900 cursor-pointer">
            {isRTL ? "عرض السجل الكامل" : "View Full Log"}
          </button>
        </div>

        <Card className="border-none shadow-sm rounded-[40px] bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right" dir={isRTL ? "rtl" : "ltr"}>
              <thead>
                <tr className="bg-stone-50/50 border-b border-stone-100">
                  <th className="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-widest">{isRTL ? "اليوم" : "Day"}</th>
                  <th className="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-widest">{isRTL ? "الحاضرون" : "Present"}</th>
                  <th className="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-widest">{isRTL ? "الغائبون" : "Absent"}</th>
                  <th className="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-widest">{isRTL ? "المعدل" : "Rate"}</th>
                  <th className="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-widest">{isRTL ? "الحالة" : "Status"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {weeklyBreakdown.map((day, i) => (
                  <tr key={i} className="hover:bg-stone-50/30 transition-colors group">
                    <td className="px-8 py-5 text-sm font-bold text-stone-900">{day.day}</td>
                    <td className="px-8 py-5 text-sm font-bold text-emerald-600"> 442</td>
                    <td className="px-8 py-5 text-sm font-bold text-rose-500"> 8</td>
                    <td className="px-8 py-5 text-sm font-black text-stone-900">{day.rate}٪</td>
                    <td className="px-8 py-5">
                      <Badge className={`${day.status === 'excellent' ? 'bg-emerald-500' : 'bg-amber-500'} text-white border-none rounded-lg text-[8px] font-black px-2 py-0.5 uppercase`}>
                        {day.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </div>
  );
}