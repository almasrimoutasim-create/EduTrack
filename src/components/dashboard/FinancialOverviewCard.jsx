import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, ArrowUpRight, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/lib/LanguageContext";

function formatAmount(val, isRTL) {
  const num = parseFloat(val || 0);
  if (isRTL) return `${num.toLocaleString("ar-EG")} ج.س`;
  return `SDG ${num.toLocaleString()}`;
}

export default function FinancialOverviewCard({ studentFees = [], feePayments = [] }) {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const totalCharged = studentFees.reduce((s, f) => s + parseFloat(f.amount || 0), 0);
    const totalPaid = feePayments.reduce((s, p) => s + parseFloat(p.amount || 0), 0);
    const pending = studentFees
      .filter(f => f.status !== "paid" && f.status !== "waived")
      .reduce((s, f) => {
        const remaining = f.remaining !== null && f.remaining !== undefined
          ? parseFloat(f.remaining)
          : parseFloat(f.amount || 0) - parseFloat(f.amount_paid || 0);
        return s + Math.max(0, remaining);
      }, 0);
    const collectionRate = totalCharged > 0 ? Math.round((totalPaid / totalCharged) * 100) : 0;
    const paidCount = studentFees.filter(f => f.status === "paid").length;
    const pendingCount = studentFees.filter(f => f.status === "pending" || f.status === "partial").length;
    const overdueCount = studentFees.filter(f => f.status === "overdue").length;

    // Recent payments
    const recentPayments = [...feePayments]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 3);

    return { totalCharged, totalPaid, pending, collectionRate, paidCount, pendingCount, overdueCount, recentPayments };
  }, [studentFees, feePayments]);

  const { totalCharged, totalPaid, pending, collectionRate, paidCount, pendingCount, overdueCount, recentPayments } = stats;
  const rateColor = collectionRate >= 80 ? "text-emerald-600" : collectionRate >= 50 ? "text-amber-600" : "text-red-600";
  const rateBg = collectionRate >= 80 ? "bg-emerald-50" : collectionRate >= 50 ? "bg-amber-50" : "bg-red-50";
  const rateBarColor = collectionRate >= 80 ? "bg-emerald-500" : collectionRate >= 50 ? "bg-amber-500" : "bg-red-500";

  return (
    <Card className="p-6 border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white/70 backdrop-blur-xl overflow-hidden relative">
      {/* Background accent */}
      <div className="absolute bottom-0 left-0 w-36 h-36 bg-emerald-500/5 rounded-full -translate-x-10 translate-y-10 pointer-events-none" />

      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
            <DollarSign className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-bold text-base text-stone-900">
              {isRTL ? "النظرة المالية" : "Financial Overview"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isRTL ? `${studentFees.length} رسم مدرسي` : `${studentFees.length} fee records`}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
          onClick={() => navigate("/finance")}
        >
          {isRTL ? "المالية" : "Finance"} <ArrowUpRight size={12} className="ms-1" />
        </Button>
      </div>

      {studentFees.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <DollarSign className="h-12 w-12 opacity-20 mb-2" />
          <p className="text-sm font-medium">{isRTL ? "لا توجد رسوم مسجلة" : "No fee records found"}</p>
        </div>
      ) : (
        <>
          {/* Collection Rate */}
          <div className={`rounded-2xl p-4 mb-5 ${rateBg} border border-opacity-20`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-widest">
                {isRTL ? "نسبة التحصيل" : "Collection Rate"}
              </span>
              <span className={`text-2xl font-black ${rateColor}`}>{collectionRate}%</span>
            </div>
            <div className="h-2.5 bg-stone-200/60 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${collectionRate}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className={`h-full rounded-full ${rateBarColor}`}
              />
            </div>
            <div className="flex justify-between text-[10px] text-stone-500 mt-2 font-semibold">
              <span>{isRTL ? "محصَّل:" : "Collected:"} {formatAmount(totalPaid, isRTL)}</span>
              <span>{isRTL ? "إجمالي:" : "Total:"} {formatAmount(totalCharged, isRTL)}</span>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto mb-0.5" />
              <p className="text-lg font-black text-emerald-700">{paidCount}</p>
              <p className="text-[10px] font-semibold text-emerald-500">{isRTL ? "مدفوع" : "Paid"}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100 text-center">
              <Clock className="h-4 w-4 text-amber-500 mx-auto mb-0.5" />
              <p className="text-lg font-black text-amber-700">{pendingCount}</p>
              <p className="text-[10px] font-semibold text-amber-500">{isRTL ? "معلق" : "Pending"}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-100 text-center">
              <AlertCircle className="h-4 w-4 text-red-500 mx-auto mb-0.5" />
              <p className="text-lg font-black text-red-700">{overdueCount}</p>
              <p className="text-[10px] font-semibold text-red-500">{isRTL ? "متأخر" : "Overdue"}</p>
            </div>
          </div>

          {/* Pending amount */}
          {pending > 0 && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100 mb-4">
              <span className="text-xs font-bold text-stone-600">
                {isRTL ? "المبالغ المتبقية" : "Outstanding Amount"}
              </span>
              <span className="text-sm font-black text-red-600">{formatAmount(pending, isRTL)}</span>
            </div>
          )}

          {/* Recent payments */}
          {recentPayments.length > 0 && (
            <div>
              <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-3">
                {isRTL ? "آخر الدفعات" : "Recent Payments"}
              </p>
              <div className="space-y-2">
                {recentPayments.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100 hover:bg-emerald-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span className="text-xs font-bold text-stone-700 truncate max-w-[120px]">
                        {p.student_name || (isRTL ? "طالب" : "Student")}
                      </span>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700 text-[10px] font-bold border-0">
                      {formatAmount(p.amount, isRTL)}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
