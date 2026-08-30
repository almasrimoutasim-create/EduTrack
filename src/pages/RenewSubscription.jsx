import React, { useState, useEffect } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { useAuth } from "@/lib/AuthContext";
import { entities } from "@/api/dbClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { CreditCard, Calendar, AlertCircle, CheckCircle, Loader2, Shield, Zap, Crown, ArrowLeft, RefreshCw, ExternalLink } from "lucide-react";

const PLAN_INFO = {
  starter: { name: "Starter", price: 49, icon: Shield, color: "border-slate-300", descAr: "مدرسة صغيرة حتى 200 طالب", descEn: "Small school up to 200 students" },
  professional: { name: "Professional", price: 99, icon: Zap, color: "border-blue-300", descAr: "الأكثر طلباً — كل الميزات", descEn: "Most popular — all features", popular: true },
  enterprise: { name: "Enterprise", price: 199, icon: Crown, color: "border-violet-300", descAr: "شبكة مدارس بلا حدود", descEn: "Unlimited network" },
};

export default function RenewSubscription() {
  const { language } = useLanguage();
  const { user, logout } = useAuth();
  const isRTL = language === "ar";
  const schoolId = user?.school_id;

  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("professional");
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!schoolId) { window.location.href = "/role-login"; return; }
    loadSchool();
  }, [schoolId]);

  const loadSchool = async () => {
    try {
      const data = await entities.School.get(schoolId);
      setSchool(data);
      setSelectedPlan(data.plan || "professional");
      setBillingCycle(data.billing_cycle || "monthly");
    } catch (e) {
      toast.error("فشل تحميل بيانات المدرسة");
    } finally {
      setLoading(false);
    }
  };

  const getExpiryInfo = () => {
    if (!school?.expires_at) return { status: "unknown", text: isRTL ? "غير محدد" : "Unknown", className: "text-slate-500" };
    const now = new Date();
    const exp = new Date(school.expires_at);
    const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { status: "expired", text: isRTL ? `منتهي منذ ${Math.abs(diffDays)} يوم` : `Expired ${Math.abs(diffDays)} days ago`, className: "text-rose-600 font-bold" };
    if (diffDays <= 1) return { status: "critical", text: isRTL ? "ينتهي اليوم!" : "Expires today!", className: "text-rose-600 font-bold" };
    if (diffDays <= 3) return { status: "warning", text: isRTL ? `ينتهي خلال ${diffDays} أيام` : `Expires in ${diffDays} days`, className: "text-amber-600 font-bold" };
    if (diffDays <= 7) return { status: "soon", text: isRTL ? `ينتهي خلال ${diffDays} أيام` : `Expires in ${diffDays} days`, className: "text-amber-600" };
    return { status: "active", text: isRTL ? `ساري حتى ${exp.toLocaleDateString('ar-EG')}` : `Active until ${exp.toLocaleDateString('en-US')}`, className: "text-emerald-600" };
  };

  const calcPrice = (plan, cycle) => {
    const base = PLAN_INFO[plan]?.price || 99;
    if (cycle === "yearly") return Math.round(base * 12 * 0.8); // 20% discount
    return base;
  };

  const handleStripeCheckout = async () => {
    if (!school) return;
    setPaymentLoading(true);
    try {
      // إنشاء جلسة Stripe عبر الباكإند (يتطلب endpoint /api/create-checkout-session)
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("portal_jwt_token") || localStorage.getItem("jwt_token")}` },
        body: JSON.stringify({
          school_id: school.id,
          plan: selectedPlan,
          billing_cycle: billingCycle,
          success_url: `${window.location.origin}/renew-subscription?success=true`,
          cancel_url: `${window.location.origin}/renew-subscription?canceled=true`,
        }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else throw new Error(data.error || "Failed to create checkout session");
    } catch (e) {
      toast.error(e.message || "فشل إنشاء جلسة الدفع");
      setPaymentLoading(false);
    }
  };

  const handlePaymobCheckout = async () => {
    // مشابه لـ Stripe لكن يستخدم PayMob
    toast("PayMob integration coming soon — استخدم Stripe حالياً", { icon: "🚧" });
  };

  const handleManualRenew = async () => {
    // للتجديد اليدوي (كاش/تحويل بنكي) - يرسل webhook للمؤسس
    setPaymentLoading(true);
    try {
      await entities.SystemAdmin.update(user.id, { /* placeholder */ });
      // في الواقع نرسل طلب تجديد يدوي عبر webhook
      await fetch("/webhook/subscription/renew", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("portal_jwt_token") || localStorage.getItem("jwt_token")}` },
        body: JSON.stringify({
          provider: "manual",
          billing_cycle: billingCycle,
          plan: selectedPlan,
        }),
      });
      toast.success(isRTL ? "تم إرسال طلب التجديد اليدوي — سيتم تفعيل الاشتراك بعد التحقق" : "Manual renewal request sent");
      setShowSuccess(true);
      setTimeout(loadSchool, 1500);
    } catch (e) {
      toast.error(e.message || "فشل طلب التجديد");
    } finally {
      setPaymentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center" dir={isRTL ? "rtl" : "ltr"}>
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!school) return null;

  const expiry = getExpiryInfo();
  const price = calcPrice(selectedPlan, billingCycle);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4" dir={isRTL ? "rtl" : "ltr"}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => window.location.href = school.subscription_status === "expired" ? "/admin-dashboard" : "/admin-dashboard"} className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
            <ArrowLeft size={20} className={isRTL ? "rotate-180" : ""} />
            <span className="font-bold">{isRTL ? "العودة للوحة التحكم" : "Back to Dashboard"}</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">{user?.full_name || user?.email}</span>
            <Button variant="ghost" size="sm" onClick={logout}><LogOut size={16} /></Button>
          </div>
        </div>

        {/* Current Subscription Status */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <Card className={`p-6 rounded-2xl border-2 ${expiry.status === "expired" ? "border-rose-200 bg-rose-50" : expiry.status === "critical" || expiry.status === "warning" ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/80 flex items-center justify-center shadow-sm">
                  <AlertCircle size={24} className={expiry.status === "expired" ? "text-rose-500" : expiry.className.includes("amber") ? "text-amber-500" : "text-emerald-500"} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">{isRTL ? "حالة الاشتراك الحالي" : "Current Subscription"}</h2>
                  <p className={expiry.className} style={{ fontSize: "1.1rem" }}>{expiry.text}</p>
                  <p className="text-sm text-slate-500 mt-1">
                    {isRTL ? "الباقة: " : "Plan: "}<b>{PLAN_INFO[school.plan]?.name || school.plan}</b>
                    {school.billing_cycle && ` • ${isRTL ? (school.billing_cycle === "yearly" ? "سنوي" : "شهري") : school.billing_cycle}`}
                    {school.subscription_start_date && ` • ${isRTL ? "بدء: " : "Started: "}${new Date(school.subscription_start_date).toLocaleDateString(isRTL ? "ar-EG" : "en-US")}`}
                  </p>
                </div>
              </div>
              {expiry.status !== "active" && (
                <span className={`px-4 py-2 rounded-xl text-sm font-bold ${expiry.status === "expired" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}>
                  {expiry.status === "expired" ? (isRTL ? "منتهي" : "Expired") : (isRTL ? "تنبيه" : "Expiring Soon")}
                </span>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Renewal Options */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-6">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <RefreshCw size={20} className="text-blue-600" />
            {isRTL ? "اختر الباقة ودورة الفوترة" : "Choose Plan & Billing Cycle"}
          </h3>

          {/* Plan Selection */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-700">{isRTL ? "الباقة" : "Plan"}</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Object.entries(PLAN_INFO).map(([key, p]) => {
                const active = selectedPlan === key;
                return (
                  <button key={key} type="button" onClick={() => setSelectedPlan(key)}
                    className={`relative p-4 rounded-2xl border-2 text-center transition-all ${active ? "border-slate-900 bg-slate-900 text-white shadow-lg" : "border-stone-200 bg-stone-50 hover:bg-white text-stone-700"} ${p.popular && !active ? p.color : ""}`}>
                    {p.popular && <span className={`absolute -top-2 ${isRTL ? "left-3" : "right-3"} bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full`}>{isRTL ? "الأكثر طلباً" : "Popular"}</span>}
                    <p.icon size={20} className={`mx-auto mb-1.5 ${active ? "text-white" : "text-stone-600"}`} />
                    <div className="text-sm font-black">{p.name}</div>
                    <div className="text-lg font-extrabold">${p.price}<span className="text-xs font-normal opacity-70">/شهر</span></div>
                    <div className={`text-[11px] mt-1 ${active ? "text-white/70" : "text-stone-400"}`}>{isRTL ? p.descAr : p.descEn}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Billing Cycle Selection */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-700">{isRTL ? "دورة الفوترة" : "Billing Cycle"}</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { id: "monthly", nameAr: "شهري", nameEn: "Monthly", descAr: "دفع شهري", descEn: "Pay monthly", price: PLAN_INFO[selectedPlan]?.price || 99 },
                { id: "yearly", nameAr: "سنوي (توفير 20%)", nameEn: "Yearly (Save 20%)", descAr: "دفع سنوي مع خصم", descEn: "Annual payment with discount", price: calcPrice(selectedPlan, "yearly") },
              ].map(opt => {
                const active = billingCycle === opt.id;
                return (
                  <button key={opt.id} type="button" onClick={() => setBillingCycle(opt.id)}
                    className={`relative p-4 rounded-2xl border-2 text-center transition-all ${active ? "border-slate-900 bg-slate-900 text-white shadow-lg" : "border-stone-200 bg-stone-50 hover:bg-white text-stone-700"}`}>
                    <div className="text-sm font-black">{isRTL ? opt.nameAr : opt.nameEn}</div>
                    <div className="text-2xl font-extrabold mt-1">${opt.price}<span className="text-xs font-normal opacity-70"> {isRTL ? (opt.id === "yearly" ? "/سنة" : "/شهر") : (opt.id === "yearly" ? "/yr" : "/mo")}</span></div>
                    <div className={`text-[11px] mt-1 ${active ? "text-white/70" : "text-stone-400"}`}>{isRTL ? opt.descAr : opt.descEn}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price Summary */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">{isRTL ? "المبلغ المستحق" : "Amount Due"}</p>
                <p className="text-3xl font-extrabold">${price}<span className="text-sm font-normal opacity-70"> {billingCycle === "yearly" ? (isRTL ? "/سنة" : "/yr") : (isRTL ? "/شهر" : "/mo")}</span></p>
                {billingCycle === "yearly" && <p className="text-xs text-emerald-300 mt-1">{isRTL ? "توفير 20% مقارنة بالدفع الشهري" : "20% savings vs monthly"}</p>}
              </div>
              <div className="text-right">
                <p className="text-xs opacity-60">{isRTL ? "الباقة" : "Plan"}</p>
                <p className="font-bold capitalize">{selectedPlan}</p>
                <p className="text-xs opacity-60">{isRTL ? (billingCycle === "yearly" ? "سنوي" : "شهري") : billingCycle}</p>
              </div>
            </div>
          </div>

          {/* Payment Buttons */}
          <div className="space-y-3">
            <Button onClick={handleStripeCheckout} disabled={paymentLoading} className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white font-bold text-base hover:from-violet-700 hover:to-blue-700 disabled:opacity-60 flex items-center justify-center gap-2">
              <CreditCard size={20} />
              {paymentLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {isRTL ? "جاري التوجيه..." : "Redirecting..."}
                </>
              ) : (
                <>
                  {isRTL ? "الدفع بالبطاقة (Stripe)" : "Pay with Card (Stripe)"}
                  <ExternalLink size={16} />
                </>
              )}
            </Button>
            
            <Button onClick={handlePaymobCheckout} variant="outline" className="w-full h-11 rounded-xl border-slate-300 text-slate-700 font-bold hover:bg-slate-50">
              {isRTL ? "الدفع عبر PayMob (قريباً)" : "Pay via PayMob (Coming Soon)"}
            </Button>

            <Button onClick={handleManualRenew} variant="outline" className="w-full h-11 rounded-xl border-amber-300 text-amber-700 font-bold hover:bg-amber-50">
              {isRTL ? "تجديد يدوي (تحويل بنكي/كاش)" : "Manual Renewal (Bank Transfer/Cash)"}
            </Button>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800 space-y-2">
            <div className="flex items-center gap-2"><Shield size={16} className="shrink-0" /><span>{isRTL ? "بعد الدفع الناجح، يُحدّث الاشتراك تلقائياً عبر Webhook" : "On successful payment, subscription auto-updates via Webhook"}</span></div>
            <div className="flex items-center gap-2"><Calendar size={16} className="shrink-0" /><span>{isRTL ? `الاشتراك يُمدد من ${school.expires_at && new Date(school.expires_at) > new Date() ? "تاريخ الانتهاء الحالي" : "اليوم"} + ${billingCycle === "yearly" ? "سنة" : "شهر"}` : `Subscription extends from ${school.expires_at && new Date(school.expires_at) > new Date() ? "current expiry" : "today"} + ${billingCycle === "yearly" ? "1 year" : "1 month"}`}</span></div>
            <div className="flex items-center gap-2"><AlertCircle size={16} className="shrink-0 text-amber-500" /><span>{isRTL ? "للدفع اليدوي: سيتواصل المؤسس للتحقق ثم يفعّل الاشتراك" : "Manual: Founder verifies then activates"}</span></div>
          </div>
        </motion.div>

        {/* Success State */}
        {showSuccess && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowSuccess(false)}>
            <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4"><CheckCircle size={32} /></div>
              <h3 className="text-xl font-black text-slate-900 mb-2">{isRTL ? "تم طلب التجديد بنجاح" : "Renewal Requested"}</h3>
              <p className="text-slate-600 mb-6">{isRTL ? "سيتم تفعيل اشتراكك بعد التحقق من الدفع (للتجديد اليدوي) أو فوراً (للدفع الإلكتروني)." : "Subscription will activate after payment verification (manual) or instantly (online)."}</p>
              <Button onClick={() => { setShowSuccess(false); loadSchool(); }} className="w-full h-11 rounded-xl bg-slate-900 text-white font-bold">{isRTL ? "حسناً" : "OK"}</Button>
            </div>
          </motion.div>
        )}

        {/* URL Params Success/Cancel */}
        {new URLSearchParams(window.location.search).get("success") && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="fixed bottom-4 right-4 z-50" onClick={() => window.history.replaceState({}, "", "/renew-subscription")}>
            <div className="bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2">
              <CheckCircle size={20} />
              <span>{isRTL ? "تم الدفع بنجاح! جاري تفعيل الاشتراك..." : "Payment successful! Activating subscription..."}</span>
            </div>
          </motion.div>
        )}
        {new URLSearchParams(window.location.search).get("canceled") && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="fixed bottom-4 right-4 z-50" onClick={() => window.history.replaceState({}, "", "/renew-subscription")}>
            <div className="bg-rose-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2">
              <AlertCircle size={20} />
              <span>{isRTL ? "تم إلغاء الدفع. يمكنك المحاولة مرة أخرى." : "Payment canceled. You can try again."}</span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}