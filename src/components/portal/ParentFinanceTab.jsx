import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import StripePaymentForm from "@/components/portal/StripePaymentForm";
import { toast } from "sonner";
import { 
  CreditCard, Wallet, BookOpen, Clock, Activity, Printer, Download, Plus, ArrowRight, ShieldCheck, ShoppingBag
} from "lucide-react";

// @ts-ignore
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all border-2 border-stone-300 bg-white text-stone-800 hover:bg-stone-50 hover:border-stone-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const btnPrimary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-stone-900 text-white hover:bg-black cursor-pointer shadow-lg shadow-stone-200 disabled:opacity-50 disabled:cursor-not-allowed";

export default function ParentFinanceTab({ student, user, language }) {
  const qc = useQueryClient();
  const isRTL = language === "ar";

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  
  const [topupDialogOpen, setTopupDialogOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState("");
  const [topupPreset, setTopupPreset] = useState(null);

  const [paymentType, setPaymentType] = useState("fee"); // "fee" | "activity" | "topup"
  const [selectedActivity, setSelectedActivity] = useState(null);

  // Queries
  const { data: studentFees = [], isLoading: loadingFees } = useQuery({
    queryKey: ['student-fees-parent', student.id],
    queryFn: () => base44.entities.StudentFee.filter({ student_id: student.id }),
    staleTime: 1000 * 60 * 3,
    enabled: !!student.id
  });

  const { data: activityFees = [], isLoading: loadingActivities } = useQuery({
    queryKey: ['student-activity-fees', student.id],
    queryFn: () => base44.entities.StudentActivityFee.filter({ 
      student_id: student.id, 
      status: 'pending' 
    }),
    staleTime: 1000 * 60 * 3,
    enabled: !!student.id
  });

  const { data: activityList = [] } = useQuery({
    queryKey: ["activity-list-all"],
    queryFn: () => base44.entities.ActivityFee.list("-created_at", 200),
    staleTime: 1000 * 60 * 5,
    enabled: !!student.id
  });

  const { data: walletArr = [], isLoading: loadingWallet } = useQuery({
    queryKey: ['student-wallet', student.id],
    queryFn: () => base44.entities.StudentWallet.filter({ student_id: student.id }),
    staleTime: 1000 * 60 * 2,
    enabled: !!student.id
  });

  const { data: feePayments = [] } = useQuery({
    queryKey: ['fee-payments-parent', student.id],
    queryFn: () => base44.entities.FeePayment.filter({ student_id: student.id }),
    staleTime: 1000 * 60 * 3,
    enabled: !!student.id
  });

  const { data: walletTx = [] } = useQuery({
    queryKey: ['wallet-transactions', student.id],
    queryFn: () => base44.entities.WalletTransaction.filter({ student_id: student.id }),
    staleTime: 1000 * 60 * 2,
    enabled: !!student.id
  });

  // Calculations
  const walletBalance = walletArr[0] ? parseFloat(walletArr[0].balance) : 0;
  
  const totalRemainingTuition = studentFees
    .filter(f => f.status !== "paid" && f.status !== "waived")
    .reduce((sum, f) => sum + parseFloat(f.remaining || 0), 0);

  // Map activities to their structures
  const mappedActivities = React.useMemo(() => {
    return activityFees.map(sa => {
      const details = activityList.find(a => a.id === sa.activity_fee_id);
      return {
        ...sa,
        details
      };
    });
  }, [activityFees, activityList]);

  const activityTotal = mappedActivities
    .filter(a => a["status"] === "pending")
    .reduce((sum, a) => sum + parseFloat(a.details?.amount || 0), 0);

  // Merged Transactions
  const mergedTransactions = React.useMemo(() => {
    const list = [
      ...feePayments.map(p => ({
        ...p,
        _type: "fee_payment",
        label: isRTL ? `سداد: ${studentFees.find(f => f.id === p.student_fee_id)?.fee_name || "رسوم دراسية"}` : `Payment: ${studentFees.find(f => f.id === p.student_fee_id)?.fee_name || "Tuition Fee"}`
      })),
      ...walletTx.map(t => ({
        ...t,
        _type: "wallet",
        label: t.type === "topup" 
          ? (isRTL ? "شحن محفظة الطالب" : "Wallet Top-up")
          : (isRTL ? "مشتريات المتجر" : "Store Purchase")
      }))
    ];
    return list.sort((a, b) => new Date(b["created_at"]).getTime() - new Date(a["created_at"]).getTime());
  }, [feePayments, walletTx, studentFees, isRTL]);

  // Mutations
  const handlePaymentSuccess = async (paymentIntent) => {
    try {
      if (paymentType === "fee" && selectedFee) {
        await base44.entities.FeePayment.create({
          student_fee_id: selectedFee.id,
          student_id: student.id,
          amount: parseFloat(selectedFee.remaining),
          payment_method: "stripe",
          stripe_payment_intent_id: paymentIntent.id,
          stripe_receipt_url: paymentIntent.charges?.data?.[0]?.receipt_url || "",
          paid_by: user.id,
          notes: "دفع آمن عبر بوابة Stripe"
        });

        toast.success(isRTL ? "تم سداد الرسوم الدراسية بنجاح" : "Tuition paid successfully");
      } 
      
      else if (paymentType === "activity" && selectedActivity) {
        // Update student activity fee status
        await base44.entities.StudentActivityFee.update(selectedActivity.id, {
          status: "paid",
          paid_at: new Date().toISOString(),
          stripe_payment_intent_id: paymentIntent.id
        });

        toast.success(isRTL ? "تم سداد رسوم النشاط بنجاح" : "Activity fee paid successfully");
      } 
      
      else if (paymentType === "topup") {
        const topupVal = parseFloat(topupPreset || topupAmount);
        await base44.entities.WalletTransaction.create({
          student_id: student.id,
          type: "topup",
          amount: topupVal,
          balance_after: walletBalance + topupVal,
          description: "شحن رصيد المحفظة من ولي الأمر",
          stripe_payment_intent_id: paymentIntent.id,
          created_by: user.id
        });

        toast.success(isRTL ? "تم شحن المحفظة بنجاح" : "Wallet topped up successfully");
      }

      // Unified query key invalidation
      qc.invalidateQueries({ queryKey: ['student-fees-parent', student.id] });
      qc.invalidateQueries({ queryKey: ['student-activity-fees', student.id] });
      qc.invalidateQueries({ queryKey: ['student-wallet', student.id] });
      qc.invalidateQueries({ queryKey: ['wallet-transactions', student.id] });
      qc.invalidateQueries({ queryKey: ['fee-payments-parent', student.id] });

      setPaymentDialogOpen(false);
      setTopupDialogOpen(false);
      setSelectedFee(null);
      setSelectedActivity(null);
      setTopupPreset(null);
      setTopupAmount("");
    } catch (err) {
      console.error(err);
      toast.error(isRTL ? "فشل تحديث سجلات الدفع في قاعدة البيانات" : "Failed to record payment details");
    }
  };

  const handlePrintReceipt = (tx) => {
    const printWindow = window.open("", "_blank");
    const title = isRTL ? "إيصال سداد إلكتروني" : "Electronic Payment Receipt";
    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1c1917; direction: ${isRTL ? 'rtl' : 'ltr'}; text-align: ${isRTL ? 'right' : 'left'}; }
            .receipt-box { max-width: 600px; margin: auto; border: 2px solid #e7e5e4; padding: 30px; rounded-2xl; }
            h1 { font-family: serif; color: #1c1917; margin-bottom: 20px; border-b: 2px solid #f5f5f4; padding-bottom: 10px; }
            p { font-size: 14px; line-height: 2; margin: 10px 0; }
            .bold { font-weight: bold; }
            .amount { font-size: 24px; font-weight: 900; color: #059669; }
            .footer { margin-top: 40px; font-size: 11px; color: #a8a29e; text-align: center; }
          </style>
        </head>
        <body>
          <div class="receipt-box">
            <h1>${title}</h1>
            <p><span class="bold">${isRTL ? "اسم الطالب:" : "Student Name:"}</span> ${student.full_name}</p>
            <p><span class="bold">${isRTL ? "نوع المعاملة:" : "Transaction:"}</span> ${tx.label}</p>
            <p><span class="bold">${isRTL ? "تاريخ المعاملة:" : "Date:"}</span> ${new Date(tx.created_at).toLocaleString(isRTL ? "ar-EG" : "en-US")}</p>
            <p><span class="bold">${isRTL ? "طريقة الدفع:" : "Method:"}</span> ${tx.payment_method || "Stripe (بطاقة ائتمان)"}</p>
            <p><span class="bold">${isRTL ? "رقم مرجع الدفع:" : "Reference ID:"}</span> ${tx.stripe_payment_intent_id || "—"}</p>
            <p class="amount">$${parseFloat(tx.amount).toFixed(2)}</p>
            <div class="footer">نظام EduTrack المالي الآمن © ${new Date().getFullYear()}</div>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-8 animate-fadeIn text-right" dir="rtl">
      
      {/* 1. Account Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tuition Fees Card */}
        <Card className="relative p-6 border-none shadow-md bg-white rounded-3xl overflow-hidden hover:shadow-lg transition-shadow">
          <div className="flex justify-between items-start">
            <span className="text-xs font-black text-stone-450 uppercase tracking-wider">الرسوم المستحقة المتبقية</span>
            <div className="h-9 w-9 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600">
              <CreditCard size={16} />
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-3xl font-black text-stone-900 num-en">${totalRemainingTuition.toFixed(2)}</p>
              <p className="text-[10px] text-stone-400 font-bold mt-1">الرسوم الدراسية المعلقة</p>
            </div>
          </div>
        </Card>

        {/* Activity Fees Card */}
        <Card className="relative p-6 border-none shadow-md bg-white rounded-3xl overflow-hidden hover:shadow-lg transition-shadow">
          <div className="flex justify-between items-start">
            <span className="text-xs font-black text-stone-450 uppercase tracking-wider">رسوم الأنشطة المعلقة</span>
            <div className="h-9 w-9 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600">
              <Activity size={16} />
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-3xl font-black text-stone-900 num-en">${activityTotal.toFixed(2)}</p>
              <p className="text-[10px] text-stone-400 font-bold mt-1">رحلات وأنشطة مدرسية</p>
            </div>
          </div>
        </Card>

        {/* Wallet Balance Card */}
        <Card className="relative p-6 border-none shadow-md bg-stone-900 text-white rounded-3xl overflow-hidden hover:shadow-lg transition-all">
          <div className="flex justify-between items-start">
            <span className="text-xs font-black text-stone-400 uppercase tracking-wider">رصيد بطاقة المتجر</span>
            <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center text-indigo-300 border border-white/10">
              <Wallet size={16} />
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-3xl font-black text-emerald-400 num-en">${walletBalance.toFixed(2)}</p>
              <p className="text-[10px] text-stone-400 font-bold mt-1">متاح للشراء في المقصف</p>
            </div>
            <button
              onClick={() => { setPaymentType("topup"); setTopupDialogOpen(true); }}
              className="h-9 px-4 rounded-xl bg-white text-stone-900 hover:bg-stone-100 text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>شحن البطاقة</span>
            </button>
          </div>
        </Card>
      </div>

      {/* 2. Outstanding Tuition Details */}
      <Card className="p-6 border shadow-sm bg-white rounded-3xl space-y-4">
        <h4 className="font-serif text-lg font-bold text-stone-900 border-b border-stone-100 pb-3">تفاصيل الرسوم الدراسية الملتزم بها</h4>
        {loadingFees ? (
          <div className="py-6 text-center text-stone-400">جاري التحميل...</div>
        ) : studentFees.length === 0 ? (
          <div className="py-8 text-center text-stone-400 bg-stone-50 rounded-2xl">لا يوجد أقساط أو التزامات مالية حالياً.</div>
        ) : (
          <div className="space-y-4">
            {studentFees.map(fee => {
              const paidVal = parseFloat(fee.amount_paid);
              const totalVal = parseFloat(fee.amount);
              const pct = Math.min(100, Math.round((paidVal / totalVal) * 100)) || 0;

              return (
                <div key={fee.id} className="p-4 rounded-2xl border border-stone-100 bg-stone-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-850 text-sm">{fee.fee_name}</span>
                      <Badge className={`border-none rounded-lg text-[10px] font-bold ${
                        fee.status === "paid" ? "bg-emerald-500/10 text-emerald-600" :
                        fee.status === "partial" ? "bg-blue-500/10 text-blue-600" : "bg-amber-500/10 text-amber-600"
                      }`}>
                        {fee.status === "paid" ? "مسدد بالكامل" : fee.status === "partial" ? "مسدد جزئياً" : "مستحق السداد"}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-stone-500">
                      <span>إجمالي القيمة: <strong className="text-stone-900 num-en">${totalVal.toFixed(2)}</strong></span>
                      <span>المدفوع: <strong className="text-emerald-600 num-en">${paidVal.toFixed(2)}</strong></span>
                      <span>تاريخ الاستحقاق: <strong className="text-stone-900 num-en">{fee.due_date}</strong></span>
                    </div>

                    <div className="flex items-center gap-2 max-w-md">
                      <Progress value={pct} className="h-1.5 bg-stone-100 flex-1" />
                      <span className="text-[10px] font-bold text-stone-400 num-en">{pct}%</span>
                    </div>
                  </div>

                  {parseFloat(fee.remaining) > 0 && (
                    <button
                      onClick={() => { setSelectedFee(fee); setPaymentType("fee"); setPaymentDialogOpen(true); }}
                      className="h-10 px-5 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold shadow-md cursor-pointer transition-all self-end md:self-center shrink-0"
                    >
                      دفع المتبقي (${parseFloat(fee.remaining).toFixed(2)})
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* 3. Activity Fees Section */}
      <Card className="p-6 border shadow-sm bg-white rounded-3xl space-y-4">
        <h4 className="font-serif text-lg font-bold text-stone-900 border-b border-stone-100 pb-3">رسوم الأنشطة المدرسية والرحلات</h4>
        {loadingActivities ? (
          <div className="py-6 text-center text-stone-400">جاري التحميل...</div>
        ) : mappedActivities.length === 0 ? (
          <div className="py-8 text-center text-stone-400 bg-stone-50 rounded-2xl">لا يوجد أنشطة مسجل بها الطالب.</div>
        ) : (
          <div className="space-y-4">
            {mappedActivities.map(act => (
              <div key={act["id"]} className="p-4 rounded-2xl border border-stone-100 bg-stone-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h5 className="font-bold text-stone-850 text-sm">{act.details?.activity_name || "نشاط مدرسي"}</h5>
                  <p className="text-xs text-stone-500 mt-1">{act.details?.description || "—"}</p>
                  <div className="flex items-center gap-4 text-xs text-stone-450 mt-2">
                    <span>القيمة: <strong className="text-stone-900 num-en">${parseFloat(act.details?.amount || 0).toFixed(2)}</strong></span>
                    <span>آخر موعد للسداد: <strong className="text-stone-900 num-en">{act.details?.due_date}</strong></span>
                  </div>
                </div>

                <div>
                  {act["status"] === "paid" ? (
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-none rounded-lg text-xs font-bold px-3 py-1">
                      تم السداد والاشتراك
                    </Badge>
                  ) : (
                    <button
                      onClick={() => { setSelectedActivity(act); setPaymentType("activity"); setPaymentDialogOpen(true); }}
                      className="h-10 px-5 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold shadow-md cursor-pointer transition-all shrink-0"
                    >
                      سداد الاشتراك (${parseFloat(act.details?.amount || 0).toFixed(2)})
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 4. Transactions Ledger */}
      <Card className="p-6 border shadow-sm bg-white rounded-3xl space-y-4">
        <h4 className="font-serif text-lg font-bold text-stone-900 border-b border-stone-100 pb-3">كشف المدفوعات والعمليات المالية</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-stone-200 text-xs font-bold text-stone-400">
                <th className="pb-3 text-right">العملية / البند</th>
                <th className="pb-3 text-right">التاريخ والوقت</th>
                <th className="pb-3 text-right">المبلغ</th>
                <th className="pb-3 text-center">بوابة الدفع</th>
                <th className="pb-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50 text-sm">
              {mergedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-stone-400 font-semibold">لا يوجد حركات مالية مسجلة بعد.</td>
                </tr>
              ) : mergedTransactions.map((tx, idx) => (
                <tr key={idx} className="hover:bg-stone-50/30 transition-colors">
                  <td className="py-3.5">
                    <span className="font-bold text-stone-850 text-xs">{tx.label}</span>
                  </td>
                  <td className="py-3.5 text-xs text-stone-500 num-en">
                    {new Date(tx["created_at"]).toLocaleString("ar-EG")}
                  </td>
                  <td className="py-3.5">
                    <span className={`font-black text-xs num-en ${
                      tx["type"] === "purchase" ? "text-rose-500" : "text-emerald-600"
                    }`}>
                      {tx["type"] === "purchase" ? "-" : "+"}${parseFloat(tx["amount"]).toFixed(2)}
                    </span>
                  </td>
                  <td className="py-3.5 text-center">
                    <Badge className="bg-stone-100 text-stone-600 border-none rounded-lg text-[10px] font-bold px-2 py-0.5">
                      {{
                        stripe: "Stripe",
                        cash: "كاش",
                        bank_transfer: "تحويل بنكي"
                      }[tx["payment_method"]]}
                    </Badge>
                  </td>
                  <td className="py-3.5 text-left">
                    {tx["type"] !== "purchase" && (
                      <button
                        onClick={() => handlePrintReceipt(tx)}
                        className="p-1 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
                        title="طباعة إيصال"
                      >
                        <Printer size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* STRIPE PAYMENT DIALOG */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="max-w-md bg-white rounded-3xl p-8 border-none" dir="rtl">
          <DialogHeader className="mb-6">
            <DialogTitle className="font-serif text-2xl font-bold text-stone-900 text-right">الدفع الآمن بالبطاقة</DialogTitle>
            <DialogDescription className="text-right text-xs mt-1">
              {paymentType === "fee" && selectedFee && `أنت بصدد سداد مبلغ الرسوم الدراسية المستحقة بقيمة $${parseFloat(selectedFee.remaining).toFixed(2)}`}
              {paymentType === "activity" && selectedActivity && `أنت بصدد سداد رسوم الاشتراك بالنشاط بقيمة $${parseFloat(selectedActivity.details?.amount || 0).toFixed(2)}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Elements stripe={stripePromise}>
              <StripePaymentForm
                amount={
                  paymentType === "fee" ? parseFloat(selectedFee?.remaining || 0) :
                  paymentType === "activity" ? parseFloat(selectedActivity?.details?.amount || 0) : 0
                }
                onSuccess={handlePaymentSuccess}
                onCancel={() => setPaymentDialogOpen(false)}
                language={language}
              />
            </Elements>
          </div>
        </DialogContent>
      </Dialog>

      {/* TOPUP WALLET DIALOG */}
      <Dialog open={topupDialogOpen} onOpenChange={setTopupDialogOpen}>
        <DialogContent className="max-w-md bg-white rounded-3xl p-8 border-none" dir="rtl">
          <DialogHeader className="mb-6">
            <DialogTitle className="font-serif text-2xl font-bold text-stone-900 text-right">شحن رصيد بطاقة المتجر</DialogTitle>
            <DialogDescription className="text-right text-xs mt-1">
              حدد أو أدخل القيمة المراد شحنها بالمحفظة الإلكترونية للطالب
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Preset amounts */}
            <div className="grid grid-cols-4 gap-2">
              {[10, 20, 50, 100].map(amt => (
                <button
                  key={amt}
                  onClick={() => { setTopupPreset(amt); setTopupAmount(""); }}
                  className={`h-11 rounded-xl text-sm font-bold border transition-all cursor-pointer ${
                    topupPreset === amt && !topupAmount
                      ? "bg-stone-900 text-white border-stone-900 shadow-md"
                      : "bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100"
                  }`}
                >
                  ${amt}
                </button>
              ))}
            </div>

            {/* Custom input */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-stone-500 uppercase tracking-widest block">أو أدخل مبلغاً مخصصاً *</Label>
              <Input
                type="number"
                min="5"
                value={topupAmount}
                onChange={e => {
                  setTopupAmount(e.target.value);
                  setTopupPreset(null);
                }}
                placeholder="أدخل قيمة الشحن (أقل قيمة $5)"
                className="h-12 rounded-xl border border-stone-200 num-en"
              />
            </div>

            {/* Elements wrap */}
            {(topupPreset || (parseFloat(topupAmount) >= 5)) ? (
              <div className="pt-4 border-t border-stone-100">
                <Elements stripe={stripePromise}>
                  <StripePaymentForm
                    amount={topupPreset || parseFloat(topupAmount)}
                    onSuccess={handlePaymentSuccess}
                    onCancel={() => setTopupDialogOpen(false)}
                    language={language}
                  />
                </Elements>
              </div>
            ) : (
              <div className="p-4 bg-stone-50 border border-stone-100 rounded-2xl flex items-center justify-center gap-2 text-stone-400 text-xs font-semibold">
                <CreditCard className="h-4 w-4" />
                <span>يرجى تحديد أو إدخال قيمة صحيحة للشحن</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
