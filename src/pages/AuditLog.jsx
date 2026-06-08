import React, { useState, useMemo } from "react";
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
  ArrowUpRight,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2
} from "lucide-react";
import { format } from "date-fns";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/translations";
import PageHeader from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all border-2 border-stone-200 bg-white text-stone-800 hover:bg-stone-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const btnPrimary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all bg-stone-900 text-white hover:bg-black cursor-pointer shadow-lg shadow-stone-200 disabled:opacity-50 disabled:cursor-not-allowed";

const ROWS_PER_PAGE = 15;

// استخراج حرف أول من اسم المستخدم
function getInitial(name) {
  if (!name) return "?";
  return name.trim()[0].toUpperCase();
}

export default function AuditLog() {
  const { language } = useLanguage();
  const isRTL = language === "ar";

  const [searchTerm, setSearchTerm]       = useState("");
  const [actionFilter, setActionFilter]   = useState("all"); // all | CREATE | UPDATE | DELETE | other
  const [filterOpen, setFilterOpen]       = useState(false);
  const [selectedLog, setSelectedLog]     = useState(null);
  const [currentPage, setCurrentPage]     = useState(1);

  const { data: logs = [], isLoading, refetch, isFetching } = useQuery({ 
    queryKey: ["audit-logs"], 
    queryFn: () => base44.entities.AuditLog.list("-timestamp", 500),
    staleTime: 1000 * 30
  });

  // ---- إحصائيات محسوبة من البيانات الحقيقية ----
  const stats = useMemo(() => {
    const deletes  = logs.filter(l => l.action?.toUpperCase().includes("DELETE")).length;
    const updates  = logs.filter(l => l.action?.toUpperCase().includes("UPDATE")).length;
    const creates  = logs.filter(l => l.action?.toUpperCase().includes("CREATE")).length;
    return { total: logs.length, deletes, updates, creates };
  }, [logs]);

  // ---- فلترة ----
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchSearch =
        log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entity_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchAction =
        actionFilter === "all" ||
        (actionFilter === "other"
          ? !["CREATE","UPDATE","DELETE"].some(a => log.action?.toUpperCase().includes(a))
          : log.action?.toUpperCase().includes(actionFilter));
      return matchSearch && matchAction;
    });
  }, [logs, searchTerm, actionFilter]);

  // ---- ترقيم الصفحات ----
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / ROWS_PER_PAGE));
  const pageLogs = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    return filteredLogs.slice(start, start + ROWS_PER_PAGE);
  }, [filteredLogs, currentPage]);

  // عند تغيير الفلتر → العودة لأول صفحة
  const handleFilterChange = (val) => {
    setActionFilter(val);
    setCurrentPage(1);
  };
  const handleSearch = (val) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  // ---- تصدير CSV ----
  const handleExport = () => {
    const header = isRTL
      ? "الطابع الزمني,المستخدم,العملية,نوع الكيان,التفاصيل"
      : "Timestamp,User,Action,Entity Type,Details";
    const rows = filteredLogs.map(l =>
      [
        l.timestamp ? new Date(l.timestamp).toLocaleString() : "",
        l.user_name || "System",
        l.action || "",
        l.entity_type || "",
        (l.details || "").replace(/,/g, " ")
      ].join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href     = url;
    link.download = `audit_log_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(isRTL ? "تم تصدير السجلات بنجاح" : "Logs exported successfully");
  };

  const getActionColor = (action = "") => {
    const a = action.toUpperCase();
    if (a.includes("CREATE")) return "text-emerald-600 bg-emerald-50";
    if (a.includes("DELETE")) return "text-rose-600 bg-rose-50";
    if (a.includes("UPDATE")) return "text-blue-600 bg-blue-50";
    return "text-stone-500 bg-stone-100";
  };

  const formatTS = (ts) => {
    if (!ts) return "—";
    try { return format(new Date(ts), "HH:mm:ss · MMM d, yyyy"); } catch { return ts; }
  };

  return (
    <div className="space-y-8 pb-24" dir={isRTL ? "rtl" : "ltr"}>
      <PageHeader 
        title={t("common.auditLog", language)} 
        subtitle={isRTL ? "تتبع جميع الأنشطة والعمليات الحساسة داخل النظام" : "Track all sensitive activities and operations within the system"}
      >
        <div className="flex gap-3">
          {/* زر تحديث */}
          <button
            onClick={() => { refetch(); toast.info(isRTL ? "جارٍ تحديث السجلات..." : "Refreshing logs..."); }}
            disabled={isFetching}
            className={`${btnOutline} rounded-full h-12 px-4`}
            title={isRTL ? "تحديث" : "Refresh"}
          >
            <RefreshCw size={18} className={isFetching ? "animate-spin" : ""} />
          </button>
          {/* تصدير */}
          <button onClick={handleExport} className={`${btnOutline} rounded-full h-12 px-6`}>
            <Download size={18} />
            {isRTL ? "تصدير السجلات" : "Export Logs"}
          </button>
          {/* تنبيهات أمنية */}
          <button
            onClick={() => toast.info(isRTL ? "لا توجد تنبيهات أمنية نشطة حالياً" : "No active security alerts at this time")}
            className={`${btnPrimary} rounded-full h-12 px-6`}
          >
            <ShieldAlert size={18} />
            {isRTL ? "تنبيهات أمنية" : "Security Alerts"}
          </button>
        </div>
      </PageHeader>

      {/* Security Overview — بيانات حقيقية */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* كارت الحالة الأمنية الكبير */}
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
                  {isLoading
                    ? <span className="w-12 h-10 bg-white/10 animate-pulse rounded-lg inline-block" />
                    : <span className="text-4xl font-black">{stats.total}</span>
                  }
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2">{isRTL ? "عمليات الإنشاء" : "Created Records"}</p>
                <div className="flex items-end gap-2">
                  {isLoading
                    ? <span className="w-12 h-10 bg-white/10 animate-pulse rounded-lg inline-block" />
                    : <span className="text-4xl font-black text-emerald-400">{stats.creates}</span>
                  }
                </div>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
            <Activity size={180} />
          </div>
        </Card>

        {/* كارت عمليات الحذف */}
        <Card className="p-8 border-none shadow-sm bg-white rounded-[40px] flex flex-col justify-between">
          <div className="h-14 w-14 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500">
            <Trash2 size={28} />
          </div>
          <div>
            <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest mb-1">{isRTL ? "عمليات الحذف" : "Deletions"}</p>
            <h4 className="text-3xl font-black text-stone-900 num-en">
              {isLoading ? <span className="inline-block w-12 h-8 bg-stone-100 animate-pulse rounded-lg" /> : stats.deletes}
            </h4>
          </div>
        </Card>

        {/* كارت تحديثات البيانات */}
        <Card className="p-8 border-none shadow-sm bg-white rounded-[40px] flex flex-col justify-between">
          <div className="h-14 w-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500">
            <RefreshCw size={28} />
          </div>
          <div>
            <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest mb-1">{isRTL ? "تحديثات البيانات" : "Data Updates"}</p>
            <h4 className="text-3xl font-black text-stone-900 num-en">
              {isLoading ? <span className="inline-block w-12 h-8 bg-stone-100 animate-pulse rounded-lg" /> : stats.updates}
            </h4>
          </div>
        </Card>
      </div>

      {/* جدول السجلات */}
      <section className="space-y-4">
        {/* شريط البحث والفلاتر */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Card className="p-2 border-none shadow-sm bg-white rounded-[24px] flex-1 md:w-80">
              <div className="relative">
                <Search className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-stone-300`} size={18} />
                <Input 
                  placeholder={isRTL ? "ابحث في السجلات..." : "Search logs..."} 
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className={`h-10 ${isRTL ? 'pr-12' : 'pl-12'} border-none bg-transparent text-sm font-medium focus-visible:ring-0`}
                />
              </div>
            </Card>

            {/* فلتر نوع العملية */}
            <div className="flex gap-1.5 flex-wrap">
              {[
                { val: "all",    label: isRTL ? "الكل"      : "All" },
                { val: "CREATE", label: isRTL ? "إنشاء"     : "Create" },
                { val: "UPDATE", label: isRTL ? "تحديث"     : "Update" },
                { val: "DELETE", label: isRTL ? "حذف"       : "Delete" },
              ].map(f => (
                <button
                  key={f.val}
                  onClick={() => handleFilterChange(f.val)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    actionFilter === f.val
                      ? "bg-stone-900 text-white"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  {f.label}
                  {f.val !== "all" && (
                    <span className="mr-1 opacity-60">
                      ({logs.filter(l => l.action?.toUpperCase().includes(f.val)).length})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <p className="text-stone-400 text-xs font-bold uppercase tracking-widest">
            {isRTL ? `يعرض ${filteredLogs.length} سجل` : `Showing ${filteredLogs.length} logs`}
          </p>
        </div>

        {/* الجدول */}
        <Card className="border-none shadow-sm rounded-[40px] bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" dir={isRTL ? "rtl" : "ltr"}>
              <thead>
                <tr className="bg-stone-50/50 border-b border-stone-100">
                  <th className="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-widest text-start">{isRTL ? "الطابع الزمني" : "Timestamp"}</th>
                  <th className="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-widest text-start">{isRTL ? "المستخدم" : "User"}</th>
                  <th className="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-widest text-start">{isRTL ? "العملية" : "Action"}</th>
                  <th className="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-widest text-start">{isRTL ? "نوع الكيان" : "Entity Type"}</th>
                  <th className="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-widest text-start">{isRTL ? "التفاصيل" : "Details"}</th>
                  <th className="px-8 py-5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {isLoading ? (
                  [1,2,3,4,5].map(i => (
                    <tr key={i} className="animate-pulse">
                      {[1,2,3,4,5,6].map(j => (
                        <td key={j} className="px-8 py-5">
                          <div className="h-4 bg-stone-100 rounded-lg w-3/4" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : pageLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-stone-300">
                        <Database size={48} className="opacity-30" />
                        <p className="font-bold text-stone-400">
                          {isRTL ? "لا توجد سجلات تطابق البحث" : "No logs match your search"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : pageLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-stone-50/30 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 text-xs font-bold text-stone-500 num-en">
                        <Clock size={14} className="text-stone-300 shrink-0" />
                        {formatTS(log.timestamp)}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-stone-100 flex items-center justify-center font-bold text-[11px] text-stone-500 group-hover:bg-stone-900 group-hover:text-white transition-all shrink-0 select-none">
                          {getInitial(log.user_name)}
                        </div>
                        <span className="text-sm font-bold text-stone-900">{log.user_name || "System"}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <Badge className={`${getActionColor(log.action)} border-none rounded-lg text-[9px] font-black px-2 py-0.5 uppercase tracking-wider`}>
                        {log.action || "—"}
                      </Badge>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 text-xs font-bold text-stone-600">
                        <Database size={13} className="text-stone-300 shrink-0" />
                        {log.entity_type || "—"}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-xs text-stone-400 max-w-[200px] truncate font-mono" title={log.details}>
                        {log.details || "—"}
                      </p>
                    </td>
                    <td className="px-8 py-5">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className={`${btnOutline} rounded-xl gap-1 text-xs h-8 px-3`}
                      >
                        <Eye size={13} />
                        {isRTL ? "عرض" : "View"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* الترقيم */}
          <div className="p-5 bg-stone-50/50 border-t border-stone-100 flex items-center justify-between">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
              {isRTL
                ? `صفحة ${currentPage} من ${totalPages} — ${filteredLogs.length} سجل`
                : `Page ${currentPage} of ${totalPages} — ${filteredLogs.length} records`}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`${btnOutline} rounded-xl h-10 px-4`}
              >
                {isRTL ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                {isRTL ? "السابق" : "Previous"}
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={`${btnOutline} rounded-xl h-10 px-4`}
              >
                {isRTL ? "التالي" : "Next"}
                {isRTL ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
              </button>
            </div>
          </div>
        </Card>
      </section>

      {/* Dialog عرض تفاصيل السجل */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-lg rounded-3xl" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold flex items-center gap-2">
              <Database size={20} className="text-primary" />
              {isRTL ? "تفاصيل السجل" : "Log Details"}
            </DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="mt-4 space-y-3">
              {[
                { label: isRTL ? "الطابع الزمني" : "Timestamp",   value: formatTS(selectedLog.timestamp) },
                { label: isRTL ? "المستخدم"      : "User",        value: selectedLog.user_name || "System" },
                { label: isRTL ? "العملية"       : "Action",      value: selectedLog.action || "—" },
                { label: isRTL ? "نوع الكيان"    : "Entity Type", value: selectedLog.entity_type || "—" },
                { label: isRTL ? "معرّف الكيان"  : "Entity ID",   value: selectedLog.entity_id || "—" },
              ].map(row => (
                <div key={row.label} className="flex items-start gap-3 p-3 bg-stone-50 rounded-xl">
                  <span className="text-xs font-black text-stone-400 uppercase tracking-wide w-28 shrink-0 pt-0.5">{row.label}</span>
                  <span className="text-sm font-semibold text-stone-900 break-all num-en">{row.value}</span>
                </div>
              ))}
              {selectedLog.details && (
                <div className="p-3 bg-stone-50 rounded-xl">
                  <span className="text-xs font-black text-stone-400 uppercase tracking-wide block mb-2">
                    {isRTL ? "التفاصيل" : "Details"}
                  </span>
                  <pre className="text-xs text-stone-700 font-mono whitespace-pre-wrap break-all bg-white rounded-lg p-3 border border-stone-100">
                    {(() => {
                      try { return JSON.stringify(JSON.parse(selectedLog.details), null, 2); }
                      catch { return selectedLog.details; }
                    })()}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}