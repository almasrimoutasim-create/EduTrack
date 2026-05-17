import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  Clock, 
  Activity, 
  Database, 
  Lock,
  Download,
  Eye,
  Trash2,
  RefreshCw,
  ArrowUpRight
} from "lucide-react";
import { format } from "date-fns";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/translations";
import PageHeader from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all border-2 border-stone-200 bg-white text-stone-800 hover:bg-stone-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const btnPrimary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all bg-stone-900 text-white hover:bg-black cursor-pointer shadow-lg shadow-stone-200 disabled:opacity-50 disabled:cursor-not-allowed";

export default function AuditLog() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const [searchTerm, setSearchTerm] = useState("");

  const { data: logs = [], isLoading } = useQuery({ 
    queryKey: ["audit-logs"], 
    queryFn: () => base44.entities.AuditLog.list("-timestamp", 100) 
  });

  const filteredLogs = logs.filter(log => 
    log.action?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.entity_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const getActionColor = (action) => {
    if (action?.includes("CREATE")) return "text-emerald-500 bg-emerald-50";
    if (action?.includes("DELETE")) return "text-rose-500 bg-rose-50";
    if (action?.includes("UPDATE")) return "text-blue-500 bg-blue-50";
    return "text-stone-500 bg-stone-50";
  };

  return (
    <div className="space-y-10 pb-24" dir={isRTL ? "rtl" : "ltr"}>
      <PageHeader 
        title={t("common.auditLog", language)} 
        subtitle={isRTL ? "تتبع جميع الأنشطة والعمليات الحساسة داخل النظام" : "Track all sensitive activities and operations within the system"}
      >
        <div className="flex gap-3">
          <button className={`${btnOutline} rounded-full h-12 px-6`}>
            <Download size={18} />
            {isRTL ? "تصدير السجلات" : "Export Logs"}
          </button>
          <button className={`${btnPrimary} rounded-full h-12 px-6`}>
            <ShieldAlert size={18} />
            {isRTL ? "تنبيهات أمنية" : "Security Alerts"}
          </button>
        </div>
      </PageHeader>

      {/* Security Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-2 p-8 bg-gradient-to-br from-stone-900 to-stone-800 text-white rounded-[40px] shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
                <Lock size={32} className="text-rose-400" />
              </div>
              <div>
                <h4 className="text-2xl font-serif font-bold">{isRTL ? "الحالة الأمنية" : "Security Status"}</h4>
                <p className="text-stone-400 text-xs uppercase tracking-widest font-black">{isRTL ? "محمي ومراقب" : "Protected & Monitored"}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2">{isRTL ? "إجمالي العمليات" : "Total Operations"}</p>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-black">{logs.length}</span>
                  <span className="text-emerald-400 text-xs font-bold mb-1 flex items-center gap-1"><ArrowUpRight size={12} /> +٥٪</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2">{isRTL ? "عمليات مشبوهة" : "Suspicious Acts"}</p>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-black text-rose-500"> 0</span>
                  <span className="text-stone-500 text-xs font-bold mb-1">{isRTL ? "آمن" : "Safe"}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 p-10 opacity-5">
            <Activity size={180} />
          </div>
        </Card>

        {[
          { label: isRTL ? "عمليات الحذف" : "Deletions", value: "١٢", icon: Trash2, color: "text-rose-500", bg: "bg-rose-50" },
          { label: isRTL ? "تحديثات البيانات" : "Data Updates", value: "٨٤", icon: RefreshCw, color: "text-blue-500", bg: "bg-blue-50" },
        ].map((stat, i) => (
          <Card key={i} className="p-8 border-none shadow-sm bg-white rounded-[40px] flex flex-col justify-between">
            <div className={`h-14 w-14 rounded-2xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
              <stat.icon size={28} />
            </div>
            <div>
              <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest mb-1">{stat.label}</p>
              <h4 className="text-3xl font-black text-stone-900">{stat.value}</h4>
            </div>
          </Card>
        ))}
      </div>

      {/* Logs Table */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <Card className="p-2 border-none shadow-sm bg-white rounded-[24px] flex-1 md:w-96">
              <div className="relative">
                <Search className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-stone-300`} size={18} />
                <Input 
                  placeholder={isRTL ? "ابحث في السجلات..." : "Search logs..."} 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`h-10 ${isRTL ? 'pr-12' : 'pl-12'} border-none bg-transparent text-sm font-medium focus-visible:ring-0`}
                />
              </div>
            </Card>
            <button className={`${btnOutline} h-14 px-6 rounded-2xl`}>
              <Filter size={18} />
              {isRTL ? "تصفية متقدمة" : "Advanced Filter"}
            </button>
          </div>
          <p className="text-stone-400 text-xs font-bold uppercase tracking-widest">{isRTL ? `يعرض ${filteredLogs.length} سجل` : `Showing ${filteredLogs.length} logs`}</p>
        </div>

        <Card className="border-none shadow-sm rounded-[40px] bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right" dir={isRTL ? "rtl" : "ltr"}>
              <thead>
                <tr className="bg-stone-50/50 border-b border-stone-100">
                  <th className="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-widest">{isRTL ? "الطابع الزمني" : "Timestamp"}</th>
                  <th className="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-widest">{isRTL ? "المستخدم" : "User"}</th>
                  <th className="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-widest">{isRTL ? "العملية" : "Action"}</th>
                  <th className="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-widest">{isRTL ? "نوع الكيان" : "Entity Type"}</th>
                  <th className="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-widest">{isRTL ? "التفاصيل" : "Details"}</th>
                  <th className="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-widest"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {isLoading ? (
                  [1,2,3,4,5].map(i => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="px-8 py-6 h-16 bg-stone-50/50" />
                    </tr>
                  ))
                ) : filteredLogs.map((log, i) => (
                  <tr key={log.id} className="hover:bg-stone-50/30 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 text-xs font-bold text-stone-500">
                        <Clock size={14} className="text-stone-300" />
                        {log.timestamp ? format(new Date(log.timestamp), "HH:mm:ss · MMM d") : "12:45:10 · May 12"}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-stone-100 flex items-center justify-center font-bold text-[10px] text-stone-400 group-hover:bg-stone-900 group-hover:text-white transition-all">
                          {log.user_name?.[0] || 'U'}
                        </div>
                        <span className="text-sm font-bold text-stone-900">{log.user_name || 'System'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <Badge className={`${getActionColor(log.action)} border-none rounded-lg text-[9px] font-black px-2 py-0.5 uppercase tracking-wider`}>
                        {log.action}
                      </Badge>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 text-xs font-bold text-stone-600">
                        <Database size={14} className="text-stone-300" />
                        {log.entity_type}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-xs text-stone-400 max-w-xs truncate font-mono">{log.details || 'No additional data available'}</p>
                    </td>
                    <td className="px-8 py-5 text-left">
                      <button className={`${btnOutline} rounded-xl gap-1 text-xs h-8 px-3`}>
                        <Eye size={14} />
                        {t("common.view", language)}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-6 bg-stone-50/50 border-t border-stone-100 flex items-center justify-between">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "النظام يعمل بكفاءة كاملة" : "System operating at full efficiency"}</p>
            <div className="flex gap-2">
              <button className={`${btnOutline} rounded-xl h-10 px-4`}>
                {isRTL ? "السابق" : "Previous"}
              </button>
              <button className={`${btnOutline} rounded-xl h-10 px-4`}>
                {isRTL ? "التالي" : "Next"}
              </button>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}