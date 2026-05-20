import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { 
  CreditCard, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  Filter, 
  Download,
  Plus,
  PieChart,
  ShieldCheck,
  MoreVertical,
  Clock,
  Edit2,
  Trash2
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/translations";
import PageHeader from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import FinancialRecordFormDialog from "@/components/shared/FinancialRecordFormDialog";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all border-2 border-stone-300 bg-white text-stone-800 hover:bg-stone-50 hover:border-stone-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const btnPrimary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed";

export default function Finance() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const handleDelete = async (recordId) => {
    try {
      await base44.entities.FinancialRecord.delete(recordId);
      toast.success(isRTL ? "تم حذف المعاملة" : "Transaction deleted");
    } catch (err) {
      toast.error(isRTL ? "فشل حذف المعاملة" : "Failed to delete");
    }
  };

  const { data: purchases = [], isLoading } = useQuery({ 
    queryKey: ["finance-purchases"], 
    queryFn: () => base44.entities.Purchase.list("-created_date", 50) 
  });

  const { data: financialRecords = [] } = useQuery({ 
    queryKey: ["financial-records"], 
    queryFn: () => base44.entities.FinancialRecord.list("-payment_date", 50) 
  });

  const totalRevenue = purchases.reduce((sum, p) => sum + (p.total_amount || 0), 0);
  const totalExpenses = financialRecords
    .filter(r => r.record_type === "expense" || r.record_type === "salary")
    .reduce((sum, r) => sum + (r.amount || 0), 0);
  const pendingPayments = financialRecords
    .filter(r => r.status === "pending")
    .reduce((sum, r) => sum + (r.amount || 0), 0);
  const netProfit = totalRevenue - totalExpenses;

  const allTransactions = [
    ...purchases.map(p => ({ ...p, _type: "purchase" })),
    ...financialRecords.map(r => ({ ...r, _type: "record" }))
  ].sort((a, b) => {
    const da = a.created_date || a.payment_date || "";
    const db = b.created_date || b.payment_date || "";
    return db.localeCompare(da);
  }).slice(0, 15);

  const handleAdd = () => {
    setSelectedRecord(null);
    setDialogOpen(true);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  return (
    <div className="space-y-6 pb-20" dir={isRTL ? "rtl" : "ltr"}>
      <PageHeader 
        title={t("common.finance", language)} 
        subtitle={isRTL ? "إدارة الإيرادات، المدفوعات، والتقارير المالية" : "Revenue management, payments, and financial reports"}
      >
        <div className="flex gap-3">
          <button className={`${btnOutline} h-11 px-5`}>
            <Download size={18} />
            <span>{isRTL ? "تصدير تقرير" : "Export Report"}</span>
          </button>
          <button onClick={handleAdd} className={`${btnPrimary} h-11 px-5`}>
            <Plus size={18} />
            <span>{isRTL ? "إضافة معاملة" : "New Transaction"}</span>
          </button>
        </div>
      </PageHeader>

      {/* Finance Overview Stats */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          { label: isRTL ? "إجمالي الإيرادات" : "Total Revenue", value: `$${totalRevenue.toLocaleString()}`, change: "+12.5%", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50", trend: "up" },
          { label: isRTL ? "المدفوعات المعلقة" : "Pending Payments", value: `$${pendingPayments.toLocaleString()}`, change: pendingPayments > 0 ? "Needs attention" : "All clear", icon: Clock, color: pendingPayments > 0 ? "text-amber-600" : "text-emerald-600", bg: pendingPayments > 0 ? "bg-amber-50" : "bg-emerald-50", trend: pendingPayments > 0 ? "down" : "up" },
          { label: isRTL ? "إجمالي المصاريف" : "Total Expenses", value: `$${totalExpenses.toLocaleString()}`, change: totalExpenses > 0 ? `${((totalExpenses / (totalRevenue || 1)) * 100).toFixed(0)}% of revenue` : "No expenses", icon: ArrowUpRight, color: "text-blue-600", bg: "bg-blue-50", trend: totalExpenses > totalRevenue ? "down" : "up" },
          { label: isRTL ? "صافي الربح" : "Net Profit", value: `$${netProfit.toLocaleString()}`, change: netProfit >= 0 ? "Positive" : "Negative", icon: ShieldCheck, color: netProfit >= 0 ? "text-indigo-600" : "text-rose-600", bg: netProfit >= 0 ? "bg-indigo-50" : "bg-rose-50", trend: netProfit >= 0 ? "up" : "down" },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
            whileHover={{ y: -2 }}
          >
            <Card className="p-5 border shadow-sm hover:shadow-md transition-all duration-300 rounded-xl bg-white relative overflow-hidden group">
              <div className="flex justify-between items-start mb-3">
                <div className={`h-11 w-11 rounded-lg ${stat.bg} flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform`}>
                  <stat.icon size={22} />
                </div>
                <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${stat.trend === 'up' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  {stat.trend === 'up' ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                  <span className="num-en">{stat.change}</span>
                </div>
              </div>
              <p className="text-stone-400 text-xs font-semibold mb-1">{stat.label}</p>
              <h4 className="text-xl font-bold text-stone-900 num-en">{stat.value}</h4>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Transactions List */}
        <section className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-stone-900">{isRTL ? "سجل المعاملات" : "Transaction History"}</h3>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-stone-400`} size={16} />
                <Input 
                  placeholder={t("common.search", language)} 
                  className={`h-10 ${isRTL ? 'pr-10' : 'pl-10'} rounded-xl border-stone-200 bg-white w-48 lg:w-64`}
                  dir={isRTL ? "rtl" : "ltr"}
                />
              </div>
              <button className={`${btnOutline} h-10 w-10 p-0`}><Filter size={18} /></button>
            </div>
          </div>

          <Card className="border shadow-sm rounded-xl bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full" dir={isRTL ? "rtl" : "ltr"}>
                <thead>
                  <tr className="bg-stone-50/50 border-b border-stone-100">
                    <th className="px-5 py-4 text-xs font-bold text-stone-400 uppercase tracking-wide">{isRTL ? "التاريخ" : "Date"}</th>
                    <th className="px-5 py-4 text-xs font-bold text-stone-400 uppercase tracking-wide">{isRTL ? "الطالب" : "Student"}</th>
                    <th className="px-5 py-4 text-xs font-bold text-stone-400 uppercase tracking-wide">{isRTL ? "المادة/البند" : "Item"}</th>
                    <th className="px-5 py-4 text-xs font-bold text-stone-400 uppercase tracking-wide">{isRTL ? "المبلغ" : "Amount"}</th>
                    <th className="px-5 py-4 text-xs font-bold text-stone-400 uppercase tracking-wide text-center">{isRTL ? "الحالة" : "Status"}</th>
                    <th className="px-5 py-4 text-xs font-bold text-stone-400 uppercase tracking-wide"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {isLoading ? (
                    [1,2,3,4,5].map(i => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={6} className="px-5 py-5 h-14 bg-stone-50/50" />
                      </tr>
                    ))
                  ) : allTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-stone-400">
                        {isRTL ? "لا توجد معاملات بعد" : "No transactions yet"}
                      </td>
                    </tr>
                  ) : allTransactions.map((t) => {
                    const date = t.created_date || t.payment_date;
                    const name = t.student_name || t.recipient_name;
                    const item = t.item_name || t.record_type;
                    const amount = t.total_amount || t.amount || 0;
                    const status = t.status || "paid";
                    const statusLabel = status === "paid" || status === "completed"
                      ? (isRTL ? "مكتمل" : "Completed")
                      : status === "pending"
                        ? (isRTL ? "معلق" : "Pending")
                        : (isRTL ? "ملغي" : "Cancelled");
                    const statusColor = status === "paid" || status === "completed"
                      ? "bg-emerald-500/10 text-emerald-600"
                      : status === "pending"
                        ? "bg-amber-500/10 text-amber-600"
                        : "bg-rose-500/10 text-rose-600";
                    return (
                      <tr key={t.id} className="hover:bg-stone-50/50 transition-colors group">
                        <td className="px-5 py-4">
                          <span className="text-xs font-semibold text-stone-500 num-en">{date ? format(new Date(date), "MMM d, yyyy") : "—"}</span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-stone-100 flex items-center justify-center font-bold text-[10px] text-stone-400 group-hover:bg-primary group-hover:text-white transition-colors">
                              {name?.[0]}
                            </div>
                            <span className="text-sm font-semibold text-stone-900">{name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm font-medium text-stone-600">{item}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm font-bold text-stone-900 num-en">${amount?.toLocaleString()}</span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <Badge className={`${statusColor} border-none rounded-lg text-[10px] font-bold px-2 py-0.5`}>
                            {statusLabel}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 text-left">
                          {t._type === "record" ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className={`${btnOutline} h-9 px-3 text-xs cursor-pointer`}>
                                  <MoreVertical size={14} />
                                  {isRTL ? "خيارات" : "Actions"}
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align={isRTL ? "start" : "end"} className="w-36">
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setSelectedRecord(t);
                                    setDialogOpen(true);
                                  }} 
                                  className="flex items-center gap-2 cursor-pointer text-stone-700"
                                >
                                  <Edit2 size={12} />
                                  <span className="text-xs">{isRTL ? "تعديل" : "Edit"}</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => {
                                    if (confirm(isRTL ? "هل أنت متأكد من حذف هذه المعاملة؟" : "Are you sure you want to delete this transaction?")) {
                                      handleDelete(t.id);
                                    }
                                  }} 
                                  className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                                >
                                  <Trash2 size={12} />
                                  <span className="text-xs">{isRTL ? "حذف" : "Delete"}</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <Badge className="bg-stone-100 text-stone-400 border-none rounded-lg text-[10px] font-bold px-2 py-0.5">
                              {isRTL ? "شراء تلقائي" : "Auto Purchase"}
                            </Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-stone-50/30 border-t border-stone-100 text-center">
              <button className="text-stone-400 font-semibold text-xs hover:text-primary">
                {isRTL ? "عرض جميع المعاملات" : "View Full History"}
              </button>
            </div>
          </Card>
        </section>

        {/* Financial Insights - Sidebar */}
        <aside className="lg:col-span-4 space-y-6">
          <Card className="p-6 border shadow-sm bg-primary text-white rounded-xl relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="h-11 w-11 rounded-lg bg-white/10 flex items-center justify-center">
                  <PieChart size={22} className="text-secondary" />
                </div>
                <button className="text-white/50 hover:text-white hover:bg-white/10 rounded-lg h-8 px-3 text-[10px] font-bold uppercase">
                  {isRTL ? "التفاصيل" : "Details"}
                </button>
              </div>
              
              <h4 className="text-lg font-bold mb-5">{isRTL ? "توزيع الإيرادات" : "Revenue Split"}</h4>
              
              <div className="space-y-5">
                {[
                  { label: isRTL ? "الرسوم الدراسية" : "Tuition", value: 75, color: "bg-secondary" },
                  { label: isRTL ? "الأنشطة" : "Activities", value: 15, color: "bg-emerald-500" },
                  { label: isRTL ? "المتجر" : "Store", value: 10, color: "bg-amber-500" },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-semibold text-white/60">{item.label}</span>
                      <span className="text-xs font-bold num-en">{item.value}%</span>
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

              <div className="mt-8 p-5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-secondary/20 flex items-center justify-center text-secondary">
                  <ShieldCheck size={18} />
                </div>
                <p className="text-[10px] font-medium leading-relaxed opacity-60">
                  {isRTL ? "يتم تأمين جميع المعاملات المالية وتشفيرها بنظام AES-256 لضمان أعلى مستويات الحماية." : "All financial transactions are secured and encrypted with AES-256 for maximum protection."}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border shadow-sm bg-white rounded-xl">
            <h4 className="font-bold text-stone-900 mb-6">{isRTL ? "بطاقات الدفع" : "Payment Cards"}</h4>
            <div className="space-y-3">
              {[
                { name: "Visa **** 4422", type: "Personal", expiry: "08/25", primary: true },
                { name: "MasterCard **** 1100", type: "Business", expiry: "12/24", primary: false },
              ].map((card, i) => (
                <div key={i} className={`p-4 rounded-xl border-2 transition-all cursor-pointer group ${card.primary ? 'border-primary bg-primary/5' : 'border-stone-100 hover:border-stone-200'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${card.primary ? 'bg-primary text-white' : 'bg-stone-100 text-stone-400'}`}>
                      <CreditCard size={18} />
                    </div>
                    {card.primary && <Badge className="bg-primary text-white rounded-lg text-[8px] font-bold">{isRTL ? "أساسية" : "Primary"}</Badge>}
                  </div>
                  <h5 className="font-bold text-stone-900 text-sm mb-0.5 num-en">{card.name}</h5>
                  <p className="text-[10px] font-semibold text-stone-400 uppercase">{card.type} · Exp <span className="num-en">{card.expiry}</span></p>
                </div>
              ))}
              <button className={`${btnOutline} w-full h-12 border-dashed border-2 text-stone-400 hover:text-primary hover:border-primary/50`}>
                <Plus size={18} />
                <span>{isRTL ? "إضافة بطاقة" : "Add Card"}</span>
              </button>
            </div>
          </Card>
        </aside>
      </div>
      <FinancialRecordFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} record={selectedRecord} />
    </div>
  );
}
