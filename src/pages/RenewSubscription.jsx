import React, { useState, useEffect } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { useAuth } from "@/lib/AuthContext";
import { entities } from "@/api/dbClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Upload, Calendar, AlertCircle, CheckCircle, Loader2, Shield, Zap, Crown, ArrowLeft, RefreshCw, Building2, Copy, Check, X } from "lucide-react";

const PLAN_INFO = {
  starter: { name: "Starter", price: 49, icon: Shield, color: "border-slate-300", descAr: "مدرسة صغيرة حتى 200 طالب", descEn: "Small school up to 200 students" },
  professional: { name: "Professional", price: 99, icon: Zap, color: "border-blue-300", descAr: "الأكثر طلباً — كل الميزات", descEn: "Most popular — all features", popular: true },
  enterprise: { name: "Enterprise", price: 199, icon: Crown, color: "border-violet-300", descAr: "شبكة مدارس بلا حدود", descEn: "Unlimited network" },
};

const BANK_ACCOUNTS = {
  bank_name: "Banque Misr",
  account_holder: "EduTrack Solutions",
  account_number: "1234567890123456",
  iban: "EG1234567890123456789012345",
  swift_code: "BOMEGEEG",
};

export default function RenewSubscription() {
  const { language } = useLanguage();
  const { user, logout } = useAuth();
  const isRTL = language === "ar";
  const schoolId = user?.school_id;

  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState("professional");
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [showSuccess, setShowSuccess] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [tierFeatures, setTierFeatures] = useState([]);
  const [showFeatureComparison, setShowFeatureComparison] = useState(false);

  // Receipt upload state
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [senderName, setSenderName] = useState("");
  const [transferRef, setTransferRef] = useState("");
  const [bankName, setBankName] = useState("");

  useEffect(() => {
    if (!schoolId) { window.location.href = "/role-login"; return; }
    loadSchool();
    fetchTierFeatures();
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

  const fetchTierFeatures = async () => {
    try {
      const token = localStorage.getItem("portal_jwt_token") || localStorage.getItem("jwt_token");
      const res = await fetch("/api/tier-features", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTierFeatures(data);
    } catch (e) {
      console.error("Failed to load tier features", e);
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
    if (cycle === "yearly") return Math.round(base * 12 * 0.8);
    return base;
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      toast.success(isRTL ? "تم النسخ" : "Copied!");
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error(isRTL ? "الحجم الأقصى 5 ميجا" : "Max file size 5MB");
      return;
    }
    setReceiptFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setReceiptPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleUploadReceipt = async () => {
    if (!receiptFile || !school) return;
    if (!senderName.trim()) {
      toast.error(isRTL ? "أدخل اسم المرسل" : "Enter sender name");
      return;
    }
    setUploading(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(receiptFile);
      });

      const res = await fetch("/neon-db/upload-receipt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("portal_jwt_token") || localStorage.getItem("jwt_token")}`,
        },
        body: JSON.stringify({
          amount: calcPrice(selectedPlan, billingCycle),
          plan: selectedPlan,
          billing_cycle: billingCycle,
          receipt_image: base64,
          bank_name: bankName || BANK_ACCOUNTS.bank_name,
          account_holder: BANK_ACCOUNTS.account_holder,
          transfer_reference: transferRef,
          sender_name: senderName,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(isRTL ? "تم رفع الإيصال — سيتم مراجعته من المؤسس" : "Receipt uploaded — pending founder review");
      setShowSuccess(true);
      setReceiptFile(null);
      setReceiptPreview(null);
      setSenderName("");
      setTransferRef("");
      setBankName("");
      setTimeout(loadSchool, 2000);
    } catch (e) {
      toast.error(e.message || "فشل رفع الإيصال");
    } finally {
      setUploading(false);
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
          <button onClick={() => window.location.href = "/admin-dashboard"} className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
            <ArrowLeft size={20} className={isRTL ? "rotate-180" : ""} />
            <span className="font-bold">{isRTL ? "العودة للوحة التحكم" : "Back to Dashboard"}</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">{user?.full_name || user?.email}</span>
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

        {/* Plan & Billing Selection */}
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

          {/* Billing Cycle */}
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

          {/* Feature Comparison Table */}
          {tierFeatures.length > 0 && (
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowFeatureComparison(!showFeatureComparison)}
                className="w-full flex items-center justify-between p-4 hover:bg-stone-50 transition-colors"
              >
                <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Zap size={16} className="text-blue-600" />
                  {isRTL ? "مقارنة ميزات كل باقة" : "Compare Plan Features"}
                </span>
                <span className={`text-xs text-slate-400 transition-transform ${showFeatureComparison ? "rotate-180" : ""}`}>▼</span>
              </button>
              {showFeatureComparison && (
                <div className="border-t border-stone-200">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-stone-50">
                          <th className="text-right p-3 font-bold text-slate-700 min-w-[200px]">{isRTL ? "الميزة" : "Feature"}</th>
                          {["starter", "professional", "enterprise"].map(tier => (
                            <th key={tier} className={`p-3 text-center font-bold ${selectedPlan === tier ? "bg-slate-900 text-white" : "text-slate-600"}`}>
                              <div className="flex flex-col items-center gap-0.5">
                                {tier === "starter" && <Shield size={14} />}
                                {tier === "professional" && <Zap size={14} />}
                                {tier === "enterprise" && <Crown size={14} />}
                                <span className="capitalize text-xs">{tier}</span>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {[...new Set(tierFeatures.map(f => f.category))].map(cat => (
                          <React.Fragment key={cat}>
                            <tr className="bg-stone-50/50">
                              <td colSpan={4} className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wide">{cat}</td>
                            </tr>
                            {tierFeatures.filter(f => f.category === cat).map(feature => (
                              <tr key={feature.feature_key} className="hover:bg-stone-50/30">
                                <td className="p-3 text-right">
                                  <span className="font-bold text-slate-800">{isRTL ? feature.name_ar : feature.name_en}</span>
                                </td>
                                {["starter", "professional", "enterprise"].map(tier => {
                                  const enabled = feature.tiers?.[tier];
                                  const isSelected = selectedPlan === tier;
                                  return (
                                    <td key={tier} className={`p-3 text-center ${isSelected ? "bg-slate-900/5" : ""}`}>
                                      {enabled ? (
                                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${isSelected ? "bg-emerald-500 text-white" : "bg-emerald-100 text-emerald-600"}`}>
                                          <Check size={12} />
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-50 text-rose-400">
                                          <X size={12} />
                                        </span>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

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
              </div>
            </div>
          </div>

          {/* Bank Transfer Details */}
          <Card className="p-6 rounded-2xl border-2 border-blue-200 bg-blue-50">
            <h4 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
              <Building2 size={20} />
              {isRTL ? "تفاصيل التحويل البنكي" : "Bank Transfer Details"}
            </h4>
            <div className="space-y-3">
              {[
                { label: isRTL ? "البنك" : "Bank", value: BANK_ACCOUNTS.bank_name, field: "bank_name" },
                { label: isRTL ? "اسم صاحب الحساب" : "Account Holder", value: BANK_ACCOUNTS.account_holder, field: "account_holder" },
                { label: isRTL ? "رقم الحساب" : "Account Number", value: BANK_ACCOUNTS.account_number, field: "account_number" },
                { label: "IBAN", value: BANK_ACCOUNTS.iban, field: "iban" },
                { label: "SWIFT", value: BANK_ACCOUNTS.swift_code, field: "swift_code" },
              ].map((item) => (
                <div key={item.field} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-blue-100">
                  <div>
                    <p className="text-xs text-blue-600 font-bold">{item.label}</p>
                    <p className="text-sm font-mono font-bold text-slate-900">{item.value}</p>
                  </div>
                  <button onClick={() => copyToClipboard(item.value, item.field)} className="text-blue-500 hover:text-blue-700 p-1">
                    {copiedField === item.field ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              ))}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
                {isRTL ? `التحويل للمبلغ $${price}` : `Transfer amount: $${price}`}
                {billingCycle === "yearly" && (isRTL ? " (سنوي)" : " (yearly)")}
              </div>
            </div>
          </Card>

          {/* Receipt Upload */}
          <Card className="p-6 rounded-2xl border-2 border-emerald-200 bg-emerald-50">
            <h4 className="font-bold text-emerald-900 mb-4 flex items-center gap-2">
              <Upload size={20} />
              {isRTL ? "رفع إيصال التحويل" : "Upload Payment Receipt"}
            </h4>

            <div className="space-y-4">
              {/* Sender Name */}
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-1">{isRTL ? "اسم المرسل *" : "Sender Name *"}</label>
                <input type="text" value={senderName} onChange={(e) => setSenderName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder={isRTL ? "الاسم كما في الإيصال" : "Name as on receipt"} />
              </div>

              {/* Transfer Reference */}
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-1">{isRTL ? "رقم المرجع (اختياري)" : "Transfer Reference (optional)"}</label>
                <input type="text" value={transferRef} onChange={(e) => setTransferRef(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder={isRTL ? "رقم العملية أو المرجع" : "Transaction or reference number"} />
              </div>

              {/* Bank Name */}
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-1">{isRTL ? "اسم البنك المرسل" : "Sender Bank"}</label>
                <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder={isRTL ? "البنك الذي أرسلت منه" : "Bank you transferred from"} />
              </div>

              {/* File Upload */}
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-1">{isRTL ? "صورة الإيصال *" : "Receipt Image *"}</label>
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-emerald-300 rounded-xl bg-white cursor-pointer hover:bg-emerald-50 transition">
                  {receiptPreview ? (
                    <img src={receiptPreview} alt="receipt" className="max-h-36 rounded-lg object-contain" />
                  ) : (
                    <div className="text-center">
                      <Upload size={32} className="mx-auto text-emerald-400 mb-2" />
                      <p className="text-sm text-slate-500">{isRTL ? "اضغط لاختيار صورة" : "Click to select image"}</p>
                      <p className="text-xs text-slate-400">JPG, PNG — {isRTL ? "حد أقصى 5 ميجا" : "Max 5MB"}</p>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
              </div>

              {/* Upload Button */}
              <Button onClick={handleUploadReceipt} disabled={uploading || !receiptFile || !senderName.trim()}
                className="w-full h-12 rounded-xl bg-emerald-600 text-white font-bold text-base hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {uploading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {isRTL ? "جاري الرفع..." : "Uploading..."}
                  </>
                ) : (
                  <>
                    <Upload size={20} />
                    {isRTL ? "رفع الإيصال" : "Upload Receipt"}
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800 space-y-2">
            <div className="flex items-center gap-2"><Shield size={16} className="shrink-0" /><span>{isRTL ? "سيتم تفعيل الاشتراك بعد مراجعة الإيصال من المؤسس" : "Subscription activates after founder reviews receipt"}</span></div>
            <div className="flex items-center gap-2"><Calendar size={16} className="shrink-0" /><span>{isRTL ? `الاشتراك يُمدد + ${billingCycle === "yearly" ? "سنة" : "شهر"}` : `Subscription extends + ${billingCycle === "yearly" ? "1 year" : "1 month"}`}</span></div>
          </div>
        </motion.div>

        {/* Success Modal */}
        {showSuccess && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowSuccess(false)}>
            <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4"><CheckCircle size={32} /></div>
              <h3 className="text-xl font-black text-slate-900 mb-2">{isRTL ? "تم رفع الإيصال" : "Receipt Uploaded"}</h3>
              <p className="text-slate-600 mb-6">{isRTL ? "سيتم مراجعة الإيصال من قبل المؤسس وتفعيل الاشتراك." : "The receipt will be reviewed by the founder and subscription will be activated."}</p>
              <Button onClick={() => { setShowSuccess(false); loadSchool(); }} className="w-full h-11 rounded-xl bg-slate-900 text-white font-bold">{isRTL ? "حسناً" : "OK"}</Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
