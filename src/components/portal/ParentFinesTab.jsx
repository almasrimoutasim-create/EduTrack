import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/dbClient";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertCircle, CreditCard, Wallet, Lock } from "lucide-react";
import { toast } from "sonner";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import StripePaymentForm from "./StripePaymentForm";
import { useLanguage } from "@/lib/LanguageContext";

// @ts-ignore
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const translateText = (text, isRTL) => {
  if (!text || !isRTL) return text;
  
  const textStr = String(text).trim();
  
  const map = {
    "sports": "أنشطة رياضية",
    "Sports": "أنشطة رياضية",
    "discipline": "انضباط سلوكي",
    "Discipline": "انضباط سلوكي",
    "library": "المكتبة المدرسية",
    "Library": "المكتبة المدرسية",
    "general": "رسوم عامة",
    "General": "رسوم عامة",
    "Lost sports equipment (Basketball)": "فقدان معدات رياضية (كرة السلة)",
    "Mock Fine: Lost sports equipment (Basketball)": "فقدان معدات رياضية (كرة السلة)",
    "Damaged science lab equipment": "تلف وتخريب أدوات مختبر العلوم",
    "Mock Fine: Damaged science lab equipment": "تلف وتخريب أدوات مختبر العلوم",
    "Late library return for book \"Introduction to Algorithms\"": "تأخير إرجاع كتاب \"مقدمة في الخوارزميات\" للمكتبة",
    "Mock Fine: Late library return for book \"Introduction to Algorithms\"": "تأخير إرجاع كتاب \"مقدمة في الخوارزميات\" للمكتبة",
    "Mock Fine: Late library return for book \"Introduction to Algorithms": "تأخير إرجاع كتاب \"مقدمة في الخوارزميات\" للمكتبة",
    "Damaged beaker during chemistry class": "كسر وتلف أنبوب اختبار زجاجي أثناء حصة الكيمياء العملي.",
    "Book was overdue by 5 days": "تأخر في إرجاع الكتاب المستعار عن الموعد المحدد بـ 5 أيام.",
    "Paid on 2026-05-12": "تم السداد بنجاح بتاريخ: 2026-05-12"
  };

  if (map[textStr]) return map[textStr];

  if (textStr.includes("Lost sports equipment (Basketball)")) {
    return "فقدان معدات رياضية (كرة السلة)";
  }
  if (textStr.includes("Damaged science lab equipment")) {
    return "تلف وتخريب أدوات مختبر العلوم";
  }
  if (textStr.includes("Late library return") || textStr.includes("Introduction to Algorithms")) {
    return "تأخير إرجاع كتاب \"مقدمة في الخوارزميات\" للمكتبة";
  }
  if (textStr.includes("Damaged beaker")) {
    return "كسر وتلف أنبوب اختبار زجاجي أثناء حصة الكيمياء العملي.";
  }
  if (textStr.includes("Book was overdue")) {
    return "تأخر في إرجاع الكتاب المستعار عن الموعد المحدد بـ 5 أيام.";
  }
  if (textStr.includes("Paid on")) {
    return textStr.replace("Paid on", "تم السداد بتاريخ:");
  }

  return text;
};

export default function ParentFinesTab({ student, privacyMode }) {
  const qc = useQueryClient();
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const [paying, setPaying] = useState(null);
  const [paymentDialog, setPaymentDialog] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("wallet");

  const { data: fines = [] } = useQuery({
    queryKey: ["parent-fines", student?.id],
    enabled: !!student?.id,
    queryFn: () => entities.Fine.filter({ student_id: student.id }, "-created_date"),
  });

  const pending = fines.filter(f => f.status === "pending");
  const totalPending = pending.reduce((s, f) => s + (parseFloat(f.amount) || 0), 0);

  const handlePayFine = (fine) => {
    setPaymentDialog(fine);
    setPaymentMethod("wallet");
  };

  const confirmPayment = async (fine) => {
    if (paymentMethod === "wallet") {
      const studentBalance = parseFloat(student?.card_balance) || 0;
      const fineAmount = parseFloat(fine.amount) || 0;
      if (studentBalance < fineAmount) {
        toast.error(`Insufficient balance. Required: $${fineAmount.toFixed(2)}, Available: $${studentBalance.toFixed(2)}`);
        return;
      }

      setPaying(fine.id);
      await entities.Fine.update(fine.id, { status: "paid" });
      await entities.Student.update(student.id, { card_balance: studentBalance - fineAmount });
      
      // Track payment in financial records
      await entities.FinancialRecord.create({
        type: "income",
        record_type: "fine_payment",
        recipient_type: "student",
        recipient_name: student.full_name,
        recipient_id: student.id,
        amount: fineAmount,
        description: `Fine Payment: ${fine.reason}`,
        payment_date: new Date().toISOString().split('T')[0],
        status: "paid",
        payment_method: "digital_wallet"
      });

      qc.invalidateQueries({ queryKey: ["parent-fines", student.id] });
      setPaying(null);
      setPaymentDialog(null);
      toast.success(`Fine of $${fineAmount.toFixed(2)} paid successfully from digital wallet`);
    }
  };

  const handleStripeSuccess = async (paymentIntent) => {
    setPaying(paymentDialog.id);
    const fineAmount = parseFloat(paymentDialog.amount) || 0;
    try {
      await entities.Fine.update(paymentDialog.id, { status: "paid" });
      
      // Track payment in financial records
      await entities.FinancialRecord.create({
        type: "income",
        record_type: "fine_payment",
        recipient_type: "student",
        recipient_name: student.full_name,
        recipient_id: student.id,
        amount: fineAmount,
        description: `Fine Payment (Stripe): ${paymentDialog.reason}`,
        payment_date: new Date().toISOString().split('T')[0],
        status: "paid",
        payment_method: "credit_card"
      });

      qc.invalidateQueries({ queryKey: ["parent-fines", student.id] });
      qc.invalidateQueries({ queryKey: ["parent-fine-history", student.id] });
      qc.invalidateQueries({ queryKey: ["student-detail", student.id] });
      qc.invalidateQueries({ queryKey: ["parent-children"] });
      
      setPaymentDialog(null);
    } catch (err) {
      console.error(err);
      toast.error(isRTL ? "فشل تحديث سجل الغرامة في قاعدة البيانات" : "Failed to update fine record in database");
    } finally {
      setPaying(null);
    }
  };

  if (!student?.id || fines.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="h-10 w-10 text-emerald-500 mx-auto mb-3">✓</div>
        <p className="font-semibold text-sm">{isRTL ? "لا توجد رسوم أو مدفوعات مسجلة" : "No payments or fees on record"}</p>
        <p className="text-xs text-muted-foreground">{isRTL ? "لا توجد أي فواتير أو رسوم مستحقة على طفلك حالياً." : "Your child has no outstanding or paid fees."}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">{isRTL ? "المستحقات المعلقة" : "Pending Payments"}</p>
          <p className="text-2xl font-bold text-destructive">{pending.length}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">{isRTL ? "إجمالي المطلوب" : "Total Owed"}</p>
          <p className="text-2xl font-bold text-destructive">{privacyMode ? "••••" : `$${totalPending.toFixed(2)}`}</p>
        </Card>
      </div>

      {pending.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex gap-2">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold text-red-900">{isRTL ? "مدفوعات ورسوم مستحقة معلقة" : "Outstanding Payments & Fees"}</p>
            <p className="text-red-700 text-xs mt-1">{isRTL ? "سدد بأمان باستخدام رصيد المحفظة الرقمية لطفلك أدناه." : "Pay securely using your child's digital wallet balance below."}</p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {fines.map(fine => (
          <Card key={fine.id} className={`p-4 ${fine.status === "pending" ? "border-red-200 bg-red-50/30" : ""}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-sm">{translateText(fine.reason, isRTL)}</p>
                  <Badge variant={fine.status === "pending" ? "destructive" : fine.status === "paid" ? "default" : "secondary"} className="text-xs capitalize">
                    {fine.status === "pending" ? (isRTL ? "معلق" : "Pending") : (fine.status === "paid" ? (isRTL ? "مقبول/مدفوع" : "Paid") : fine.status)}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {fine.date} {fine.issued_by && `• ${isRTL ? "بواسطة" : "Issued by"} ${fine.issued_by}`}
                </p>
                {fine.category && (
                  <Badge variant="outline" className="text-xs capitalize">
                    {translateText(fine.category, isRTL)}
                  </Badge>
                )}
                {fine.notes && <p className="text-xs text-muted-foreground italic mt-2">{translateText(fine.notes, isRTL)}</p>}
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-bold text-destructive">${parseFloat(fine.amount || 0).toFixed(2)}</p>
                {fine.status === "pending" && (
                  <button
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed mt-2 h-8 px-3 bg-rose-500 hover:bg-rose-600"
                    onClick={() => handlePayFine(fine)}
                    disabled={paying === fine.id}
                  >
                    {paying === fine.id ? (isRTL ? "جاري الدفع..." : "Paying...") : (isRTL ? "سدد الآن" : "Pay Now")}
                  </button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {fines.some(f => f.status === "paid") && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{isRTL ? "سجل المدفوعات السابقة" : "Payment History"}</p>
          {fines
            .filter(f => f.status === "paid")
            .map(fine => (
              <Card key={fine.id} className="p-3 bg-emerald-50/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">{translateText(fine.reason, isRTL)}</p>
                    <p className="text-xs text-muted-foreground">{fine.date}</p>
                  </div>
                  <p className="text-sm font-semibold text-emerald-600">{isRTL ? "✓ تم سداد" : "✓ Paid"} ${parseFloat(fine.amount || 0).toFixed(2)}</p>
                </div>
              </Card>
            ))}
        </div>
      )}

      {/* Payment Dialog */}
      <Dialog open={!!paymentDialog} onOpenChange={(open) => !open && setPaymentDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader className="">
            <DialogTitle>{isRTL ? "سداد آمن للرسوم والمستحقات" : "Secure Fee & Invoice Payment"}</DialogTitle>
          </DialogHeader>

          {paymentDialog && (
            <div className="space-y-4 py-4">
              {/* Fine Summary */}
              <div className="bg-slate-50 rounded-lg p-4 border">
                <p className="text-sm text-muted-foreground mb-1">{isRTL ? "المبلغ المستحق للدفع" : "Amount Due"}</p>
                <p className="text-3xl font-bold text-destructive">${parseFloat(paymentDialog.amount || 0).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-2">{translateText(paymentDialog.reason, isRTL)}</p>
              </div>

              {/* Wallet Balance */}
              <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-emerald-700 font-semibold">{isRTL ? "رصيد المحفظة الرقمية للطالب" : "Digital Wallet Balance"}</p>
                    <p className="text-2xl font-bold text-emerald-600">${(parseFloat(student?.card_balance) || 0).toFixed(2)}</p>
                  </div>
                  <Wallet className="h-8 w-8 text-emerald-600 opacity-50" />
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-stone-500 uppercase tracking-wider">
                  {isRTL ? "طريقة الدفع" : "Payment Method"}
                </p>
                <div className="grid gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("wallet")}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      paymentMethod === "wallet"
                        ? "border-primary bg-primary/5"
                        : "border-stone-200 hover:border-stone-400"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Wallet className={`h-5 w-5 ${paymentMethod === "wallet" ? "text-primary" : "text-stone-400"}`} />
                      <div>
                        <p className="font-semibold text-sm">{isRTL ? "المحفظة الرقمية للطالب" : "Digital Wallet"}</p>
                        <p className="text-xs text-stone-500">{isRTL ? "الدفع من رصيد بطاقة الطالب" : "Pay from student card balance"}</p>
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      paymentMethod === "card"
                        ? "border-primary bg-primary/5"
                        : "border-stone-200 hover:border-stone-400"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <CreditCard className={`h-5 w-5 ${paymentMethod === "card" ? "text-primary" : "text-stone-400"}`} />
                      <div>
                        <p className="font-semibold text-sm">{isRTL ? "بطاقة الائتمان (Stripe)" : "Credit/Debit Card"}</p>
                        <p className="text-xs text-stone-500">{isRTL ? "دفع رقمي آمن عبر Stripe" : "Secure digital payment via Stripe"}</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Stripe Payment Form */}
              {paymentMethod === "card" && (
                <div className="pt-4 border-t border-stone-100">
                  <Elements stripe={stripePromise}>
                    <StripePaymentForm
                      amount={parseFloat(paymentDialog.amount || 0)}
                      onSuccess={handleStripeSuccess}
                      onCancel={() => setPaymentDialog(null)}
                      language={language}
                    />
                  </Elements>
                </div>
              )}

              {/* Security Notice */}
              {paymentMethod === "wallet" && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 flex gap-2">
                  <Lock className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700">{isRTL ? "جميع المعاملات مشفرة وتتم بأمان تام." : "All payments are encrypted and securely processed through our payment system."}</p>
                </div>
              )}

              {/* Balance Check */}
              {paymentMethod === "wallet" && (parseFloat(student?.card_balance) || 0) < parseFloat(paymentDialog.amount || 0) && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-red-700">{isRTL ? "رصيد غير كافٍ" : "Insufficient Balance"}</p>
                    <p className="text-xs text-red-600">
                      {isRTL 
                        ? `تحتاج إلى شحن $${(parseFloat(paymentDialog.amount || 0) - (parseFloat(student?.card_balance) || 0)).toFixed(2)} إضافية للسداد.`
                        : `You need $${(parseFloat(paymentDialog.amount || 0) - (parseFloat(student?.card_balance) || 0)).toFixed(2)} more to pay this invoice.`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="">
            {paymentMethod === "wallet" && (
              <>
                <button 
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all border-2 border-stone-200 bg-white text-stone-800 hover:bg-stone-50 cursor-pointer h-11 px-4" 
                  onClick={() => setPaymentDialog(null)}
                >
                  {isRTL ? "إلغاء" : "Cancel"}
                </button>
                <button
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-stone-900 text-white hover:bg-black cursor-pointer shadow-lg shadow-stone-200 disabled:opacity-50 disabled:cursor-not-allowed h-11 px-4"
                  onClick={() => confirmPayment(paymentDialog)}
                  disabled={
                    paying ||
                    (parseFloat(student?.card_balance) || 0) < parseFloat(paymentDialog?.amount || 0)
                  }
                >
                  {paying ? (isRTL ? "جاري الدفع..." : "Paying...") : (isRTL ? `ادفع $${parseFloat(paymentDialog?.amount || 0).toFixed(2)}` : `Pay $${parseFloat(paymentDialog?.amount || 0).toFixed(2)}`)}
                </button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}