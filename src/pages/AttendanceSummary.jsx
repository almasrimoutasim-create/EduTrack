import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { 
  Calendar, 
  XCircle, 
  AlertCircle,
  Download,
  Filter,
  Search,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import PageHeader from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";

const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all border-2 border-stone-200 bg-white text-stone-800 hover:bg-stone-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const btnPrimary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all bg-stone-900 text-white hover:bg-black cursor-pointer shadow-lg shadow-stone-200 disabled:opacity-50 disabled:cursor-not-allowed";

export default function AttendanceSummary() {
  const { language } = useLanguage();
  const isRTL = language === "ar";

  const { data: records = [] } = useQuery({ 
    queryKey: ["attendance-summary-data"], 
    queryFn: () => base44.entities.Attendance.list() 
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  return (
    <div className="space-y-10 pb-24" dir={isRTL ? "rtl" : "ltr"}>
      <PageHeader 
        title={isRTL ? "تحليلات الحضور والغياب" : "Attendance Analytics"} 
        subtitle={isRTL ? "نظرة شمولية على معدلات الالتزام المدرسي والتوجهات الإحصائية" : "A holistic view of school commitment rates and statistical trends"}
      >
        <div className="flex gap-3">
          <button className={`${btnOutline} rounded-full h-12 px-6`}>
            <Download size={18} />
            {isRTL ? "تصدير التقرير" : "Export Report"}
          </button>
          <button className={`${btnPrimary} rounded-full h-12 px-6`}>
            <Calendar size={18} />
            {isRTL ? "تغيير الفترة" : "Change Period"}
          </button>
        </div>
      </PageHeader>

      {/* Intelligence Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="p-8 bg-stone-900 text-white rounded-[48px] shadow-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10">
            <h4 className="text-xl font-serif font-bold mb-8">{isRTL ? "معدل الحضور السنوي" : "Annual Attendance"}</h4>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-5xl font-black"> 94.٨٪</span>
              <span className="text-emerald-400 text-xs font-bold mb-2 uppercase tracking-widest flex items-center gap-1">
                <ArrowUpRight size={14} /> +١.٢٪
              </span>
            </div>
            <p className="text-stone-400 text-xs leading-relaxed">
              {isRTL ? "معدل الحضور في تحسن مستمر مقارنة بالعام الدراسي الماضي." : "Attendance rate is steadily improving compared to last academic year."}
            </p>
          </div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
        </Card>

        {[
          { label: isRTL ? "الغياب غير المبرر" : "Unexcused Absence", value: "٤.٢٪", icon: AlertCircle, color: "text-rose-500", bg: "bg-rose-50" },
          { label: isRTL ? "إجمالي أيام الغياب" : "Total Absent Days", value: "١,٢٤٠", icon: XCircle, color: "text-amber-500", bg: "bg-amber-50" },
        ].map((stat, i) => (
          <Card key={i} className="p-8 border-none shadow-sm bg-white rounded-[48px] flex flex-col justify-between group cursor-pointer hover:shadow-md transition-all">
            <div className={`h-14 w-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center group-hover:rotate-12 transition-transform`}>
              <stat.icon size={28} />
            </div>
            <div>
              <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest mb-1">{stat.label}</p>
              <h4 className="text-3xl font-black text-stone-900">{stat.value}</h4>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Department Breakdown */}
        <section className="lg:col-span-8 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-serif font-bold text-stone-900">{isRTL ? "توزيع الحضور حسب الفصول" : "Attendance by Grade"}</h3>
            <div className="flex gap-2">
              <button className={`${btnOutline} rounded-full gap-1 text-xs h-8 px-3`}>
                <Filter size={14} />
                {t("common.filter", language)}
              </button>
              <button className={`${btnOutline} rounded-full gap-1 text-xs h-8 px-3`}>
                <Search size={14} />
                {t("common.search", language)}
              </button>
            </div>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {[
              { grade: isRTL ? "الصف العاشر" : "Grade 10", rate: 98, count: "٢٤٠/٢٤٥" },
              { grade: isRTL ? "الصف الحادي عشر" : "Grade 11", rate: 92, count: "٢١٥/٢٣٤" },
              { grade: isRTL ? "الصف الثاني عشر" : "Grade 12", rate: 85, count: "١٩٥/٢٢٩" },
              { grade: isRTL ? "الصف التاسع" : "Grade 9", rate: 96, count: "٢٥٠/٢٦٠" },
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={{ hidden: { y: 10, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest">
                    <span className="text-stone-900">{item.grade}</span>
                    <div className="flex gap-4">
                      <span className="text-stone-400">{item.count}</span>
                      <span className={item.rate > 90 ? 'text-emerald-500' : 'text-amber-500'}>{item.rate}٪</span>
                    </div>
                  </div>
                  <div className="h-2 bg-stone-50 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${item.rate}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className={`h-full ${item.rate > 90 ? 'bg-emerald-500' : 'bg-amber-500'} rounded-full`}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Alerts & Critical Info */}
        <aside className="lg:col-span-4 space-y-10">
          <Card className="p-8 border-none shadow-sm bg-white rounded-[48px]">
            <h4 className="font-bold text-stone-900 mb-8">{isRTL ? "طلاب تجاوزوا حد الغياب" : "Critical Absence Alerts"}</h4>
            <div className="space-y-6">
              {[
                { name: "أحمد يوسف", days: 8, status: "warning" },
                { name: "ليلى حسن", days: 5, status: "notice" },
                { name: "خالد فهد", days: 12, status: "critical" },
              ].map((alert, i) => (
                <div key={i} className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-black ${alert.status === 'critical' ? 'bg-rose-50 text-rose-500' : alert.status === 'warning' ? 'bg-amber-50 text-amber-500' : 'bg-blue-50 text-blue-500'}`}>
                      {alert.days}
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-stone-800 leading-tight group-hover:text-primary transition-colors">{alert.name}</h5>
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">{isRTL ? "يوم غياب" : "Days Absent"}</p>
                    </div>
                  </div>
                  <button className="rounded-xl cursor-pointer flex items-center justify-center text-stone-400 hover:text-stone-900 w-10 h-10">
                    <ChevronRight size={18} className={isRTL ? "rotate-180" : ""} />
                  </button>
                </div>
              ))}
            </div>
            <button className="w-full mt-8 bg-stone-50 hover:bg-stone-100 text-stone-900 rounded-2xl h-12 font-bold transition-all border-none cursor-pointer">
              {isRTL ? "عرض قائمة المخالفات" : "View Violation List"}
            </button>
          </Card>

          <Card className="p-8 border-none shadow-sm bg-indigo-900 text-white rounded-[48px] relative overflow-hidden">
            <div className="relative z-10 text-center">
              <ShieldCheck size={48} className="text-emerald-400 mx-auto mb-6" />
              <h4 className="text-xl font-serif font-bold mb-2">{isRTL ? "نظام الحضور الذكي" : "Smart Attendance"}</h4>
              <p className="text-indigo-100/60 text-xs mb-8">{isRTL ? "جميع البيانات يتم رصدها آلياً عبر أنظمة التعرف الذكية." : "All data is automatically tracked via smart recognition systems."}</p>
              <button className="w-full bg-white text-stone-900 hover:bg-stone-100 rounded-2xl h-12 font-bold shadow-xl cursor-pointer">
                {isRTL ? "إدارة الأجهزة" : "Manage Devices"}
              </button>
            </div>
            <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
          </Card>
        </aside>
      </div>
    </div>
  );
}