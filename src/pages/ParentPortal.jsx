import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { 
  GraduationCap,
  ClipboardCheck, 
  Users, 
  Calendar, 
  CreditCard, 
  Bell, 
  MessageCircle, 
  Award,
  ShieldCheck,
  ArrowUpRight,
  Wallet,
  DollarSign,
  RefreshCw,
  ShoppingBag
} from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import PageHeader from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import ParentSidebar from "@/components/layout/ParentSidebar";
import { useSearchParams } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import StripePaymentForm from "@/components/portal/StripePaymentForm";
import ParentFinesTab from "@/components/portal/ParentFinesTab";
import FineTransactionHistory from "@/components/portal/FineTransactionHistory";
import { toast } from "sonner";

// @ts-ignore
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all border-2 border-stone-300 bg-white text-stone-800 hover:bg-stone-50 hover:border-stone-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const btnPrimary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all bg-stone-900 text-white hover:bg-black cursor-pointer shadow-lg shadow-stone-200 disabled:opacity-50 disabled:cursor-not-allowed";

export default function ParentPortal() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";
  
  const [topUpAmount, setTopUpAmount] = React.useState(0);
  const [customTopUp, setCustomTopUp] = React.useState("");

  // Mock parent data - in a real app this would come from auth context
  const parentId = localStorage.getItem("portal_user_id") || "P-101";
  
  const { data: children = [] } = useQuery({ 
    queryKey: ["parent-children", parentId], 
    // @ts-ignore
    queryFn: () => base44.entities.Student.list("-created_at", { parent_id: parentId }) 
  });

  const [selectedStudentId, setSelectedStudentId] = React.useState(null);

  React.useEffect(() => {
    if (children.length > 0 && !selectedStudentId) {
      setSelectedStudentId(children[0].id);
    }
  }, [children, selectedStudentId]);

  const currentStudent = children.find(c => c.id === selectedStudentId) || children[0];

  const handleTopUpSuccess = async (paymentIntent) => {
    if (!currentStudent) return;
    try {
      const currentBalance = parseFloat(currentStudent.card_balance) || 0;
      const newBalance = currentBalance + topUpAmount;
      
      // 1. Update Student's card balance in database
      await base44.entities.Student.update(currentStudent.id, { card_balance: newBalance });
      
      // 2. Create CardTopUp record in database
      await base44.entities.CardTopUp.create({
        student_id: currentStudent.id,
        amount: topUpAmount,
        method: "card",
        created_date: new Date().toISOString()
      });

      // 3. Create FinancialRecord in database
      await base44.entities.FinancialRecord.create({
        type: "income",
        record_type: "tuition",
        recipient_type: "student",
        recipient_name: currentStudent.full_name,
        recipient_id: currentStudent.id,
        amount: topUpAmount,
        description: `Smart Card Top-up (Stripe)`,
        payment_date: new Date().toISOString().split('T')[0],
        status: "paid",
        payment_method: "credit_card"
      });

      // Invalidate queries to refresh data in real-time
      qc.invalidateQueries({ queryKey: ["parent-children", parentId] });
      qc.invalidateQueries({ queryKey: ["student-detail", currentStudent.id] });
      qc.invalidateQueries({ queryKey: ["parent-fines", currentStudent.id] });
      qc.invalidateQueries({ queryKey: ["topups", currentStudent.id] });
      qc.invalidateQueries({ queryKey: ["financial-records"] });

      toast.success(isRTL ? `تم شحن المحفظة بقيمة $${topUpAmount.toFixed(2)} بنجاح!` : `Wallet topped up by $${topUpAmount.toFixed(2)} successfully!`);
      setTopUpAmount(0);
      setCustomTopUp("");
    } catch (err) {
      console.error(err);
      toast.error(isRTL ? "فشل شحن رصيد المحفظة في قاعدة البيانات" : "Failed to record wallet top-up in database");
    }
  };

  const { data: recentActivity = [] } = useQuery({
    queryKey: ["parent-activity"],
    // @ts-ignore
    queryFn: () => base44.entities.ActivityPost.list("-created_at", {}, 5) 
  });

  const { data: storePurchases = [] } = useQuery({
    queryKey: ["store-purchases", selectedStudentId],
    enabled: !!selectedStudentId,
    // @ts-ignore
    queryFn: () => base44.entities.Purchase.list("-date", { student_id: selectedStudentId })
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  return (
    <div className={`min-h-screen bg-stone-50 text-stone-900 ${isRTL ? 'font-cairo' : 'font-sans'}`} dir={isRTL ? "rtl" : "ltr"}>
      <ParentSidebar />
      <main className={`transition-all duration-300 min-h-screen pt-16 lg:pt-0 ${isRTL ? "lg:mr-64" : "lg:ml-64"}`}>
        <div className="space-y-10 pb-24 p-6 md:p-10 lg:p-12 max-w-7xl mx-auto">
          <PageHeader 
        title={isRTL ? "بوابة ولي الأمر" : "Parent Portal"} 
        subtitle={isRTL ? "مرحباً بك مجدداً. تابع تقدم أبنائك وتواصل مع المدرسة." : "Welcome back. Track your children's progress and stay connected."}
      >
        <div className="flex gap-3">
          <button className={`${btnOutline} rounded-full h-12 px-6`}>
            <MessageCircle size={18} />
            {isRTL ? "تواصل مع المعلمين" : "Contact Teachers"}
          </button>
          <button className={`${btnPrimary.split(' ').filter(c => !c.includes('shadow')).join(' ')} bg-rose-500 hover:bg-rose-600 text-white rounded-full h-12 px-6 shadow-lg shadow-rose-100`}>
            <Bell size={18} />
            {isRTL ? "الإشعارات" : "Notifications"}
            <span className="bg-white text-rose-500 text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center"> 3</span>
          </button>
        </div>
      </PageHeader>

      {activeTab === "payments" ? (
        <div className="space-y-8 animate-fadeIn">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-serif text-3xl font-bold text-stone-900">{isRTL ? "إدارة المدفوعات والبطاقة الرقمية" : "Payments & Digital Wallet"}</h3>
              <p className="text-stone-400 text-sm font-medium">{isRTL ? "اشحن بطاقة طفلك الذكية، وسدد الغرامات والفواتير بأمان." : "Top up your child's smart card, and pay outstanding fines securely."}</p>
            </div>
            {/* Student selector */}
            {children.length > 1 && (
              <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-stone-100 shadow-sm">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-widest">{isRTL ? "الابن النشط:" : "Active Child:"}</span>
                <select 
                  value={selectedStudentId || ""} 
                  onChange={e => setSelectedStudentId(e.target.value)}
                  className="bg-transparent border-none text-sm font-bold focus:outline-none cursor-pointer text-stone-850"
                >
                  {children.map(c => (
                    <option key={c.id} value={c.id}>{c.full_name || c.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {currentStudent ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Wallet & Topup */}
              <div className="lg:col-span-5 space-y-8">
                {/* Visual Smart Card */}
                <Card className="relative w-full aspect-[1.6/1] bg-gradient-to-br from-stone-900 via-stone-850 to-indigo-950 text-white rounded-[40px] shadow-2xl overflow-hidden group border-none">
                  <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                  <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px]" />
                  <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-rose-500/10 rounded-full blur-[80px]" />
                  
                  <div className="relative z-10 h-full p-8 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
                          <Wallet size={20} className="text-indigo-300" />
                        </div>
                        <div>
                          <h4 className="font-serif font-black tracking-tight text-base">Edu<span className="text-rose-500">Wallet</span></h4>
                          <p className="text-[8px] font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "محفظة الطالب الرقمية" : "Digital Wallet"}</p>
                        </div>
                      </div>
                      <Badge className="bg-white/10 backdrop-blur-md text-white border border-white/10 rounded-lg text-[8px] font-black px-2 py-1">
                        SMART CARD
                      </Badge>
                    </div>

                    <div className="my-auto">
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">{isRTL ? "الرصيد المتاح" : "Available Balance"}</p>
                      <p className="text-4xl font-black text-emerald-400 num-en">${parseFloat(currentStudent.card_balance || 0).toFixed(2)}</p>
                    </div>

                    <div className="flex justify-between items-end">
                      <div>
                        <h5 className="text-sm font-bold">{currentStudent.full_name || currentStudent.name}</h5>
                        <p className="text-stone-400 text-[9px] font-bold uppercase tracking-widest mt-1">{currentStudent.id}</p>
                      </div>
                      <div className="h-12 w-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10">
                        <Wallet className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Top-up Form */}
                <Card className="p-8 border-none shadow-sm bg-white rounded-[40px] space-y-6">
                  <div>
                    <h4 className="font-serif text-xl font-bold text-stone-900">{isRTL ? "شحن رصيد المحفظة" : "Top Up Wallet"}</h4>
                    <p className="text-stone-400 text-xs mt-1">{isRTL ? "اشحن رصيد بطاقة الطالب لاستخدامها في المتجر والمقصف المدرسي." : "Load funds to student card for store purchases and school meals."}</p>
                  </div>

                  {/* Preset Amounts */}
                  <div className="grid grid-cols-4 gap-2">
                    {[10, 25, 50, 100].map(amt => (
                      <button
                        key={amt}
                        onClick={() => { setTopUpAmount(amt); setCustomTopUp(""); }}
                        className={`h-11 rounded-xl text-sm font-bold border transition-all cursor-pointer ${
                          topUpAmount === amt && !customTopUp
                            ? "bg-stone-900 text-white border-stone-900 shadow-md"
                            : "bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100"
                        }`}
                      >
                        ${amt}
                      </button>
                    ))}
                  </div>

                  {/* Custom Amount */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">{isRTL ? "مبلغ مخصص" : "Or Custom Amount"}</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 h-4 w-4" />
                      <input
                        type="number"
                        min="1"
                        placeholder="Enter amount"
                        value={customTopUp}
                        onChange={e => {
                          setCustomTopUp(e.target.value);
                          setTopUpAmount(parseFloat(e.target.value) || 0);
                        }}
                        className="w-full h-11 pl-9 pr-3 rounded-xl border border-stone-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  {/* Stripe Payment Integration for Top-up */}
                  {topUpAmount > 0 ? (
                    <div className="pt-6 border-t border-stone-100 space-y-4">
                      <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "الدفع الآمن ببطاقة الائتمان" : "Secure Card Payment"}</p>
                      <Elements stripe={stripePromise}>
                        <StripePaymentForm
                          amount={topUpAmount}
                          onSuccess={handleTopUpSuccess}
                          onCancel={() => { setTopUpAmount(0); setCustomTopUp(""); }}
                          language={language}
                        />
                      </Elements>
                    </div>
                  ) : (
                    <div className="p-4 bg-stone-50 border border-stone-100 rounded-2xl flex items-center justify-center gap-2 text-stone-400 text-xs font-semibold">
                      <CreditCard className="h-4 w-4" />
                      <span>{isRTL ? "يرجى تحديد مبلغ للشحن" : "Select or enter an amount to proceed with checkout"}</span>
                    </div>
                  )}
                </Card>
              </div>

              {/* Right Column: Fines list & History */}
              <div className="lg:col-span-7 space-y-8">
                {/* Active Fines */}
                <Card className="p-8 border-none shadow-sm bg-white rounded-[40px] space-y-6">
                  <h4 className="font-serif text-2xl font-bold text-stone-900">{isRTL ? "الغرامات والرسوم المستحقة" : "Outstanding Fines & Fees"}</h4>
                  <ParentFinesTab student={currentStudent} privacyMode={false} />
                </Card>

                {/* History */}
                <Card className="p-8 border-none shadow-sm bg-white rounded-[40px] space-y-6">
                  <h4 className="font-serif text-2xl font-bold text-stone-900">{isRTL ? "سجل السداد والغرامات السابقة" : "Payment Ledger & History"}</h4>
                  <FineTransactionHistory student={currentStudent} privacyMode={false} />
                </Card>

                {/* Canteen & Store Purchases */}
                <Card className="p-8 border-none shadow-sm bg-white rounded-[40px] space-y-6">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                    <div>
                      <h4 className="font-serif text-2xl font-bold text-stone-900">{isRTL ? "مشتريات المقصف والمتجر" : "Canteen & Store Purchases"}</h4>
                      <p className="text-stone-400 text-xs mt-1">
                        {isRTL ? "السجل الكامل لمشتريات الطالب باستخدام البطاقة الذكية." : "Complete ledger of student purchases using the smart card."}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-indigo-650 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-xl num-en animate-pulse">
                      {storePurchases.length} {isRTL ? "عمليات" : "Txns"}
                    </span>
                  </div>

                  <div className="space-y-4">
                    {storePurchases.length === 0 ? (
                      <div className="text-center py-8 text-stone-400 text-sm font-semibold border-dashed border border-stone-200 rounded-3xl">
                        {isRTL ? "لا توجد عمليات شراء مسجلة." : "No recorded purchases found."}
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-right md:text-left">
                          <thead>
                            <tr className="text-[10px] font-bold text-stone-400 uppercase tracking-widest border-b border-stone-150">
                              <th className={`pb-3 ${isRTL ? "text-right" : "text-left"}`}>{isRTL ? "المنتج" : "Item"}</th>
                              <th className={`pb-3 ${isRTL ? "text-right" : "text-left"}`}>{isRTL ? "التاريخ" : "Date"}</th>
                              <th className="pb-3 text-center">{isRTL ? "الكمية" : "Qty"}</th>
                              <th className={`pb-3 ${isRTL ? "text-left" : "text-right"}`}>{isRTL ? "الإجمالي" : "Total"}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-50">
                            {storePurchases.map((p, i) => (
                              <tr key={p.id || i} className="group hover:bg-stone-50/50 transition-colors">
                                <td className="py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                                      <ShoppingBag size={16} />
                                    </div>
                                    <span className="font-bold text-sm text-stone-800">{p.item_name}</span>
                                  </div>
                                </td>
                                <td className="py-4 text-xs font-bold text-stone-400 num-en">
                                  {p.date}
                                </td>
                                <td className="py-4 text-center font-bold text-stone-600 num-en">
                                  {p.quantity}
                                </td>
                                <td className={`py-4 font-extrabold text-sm text-rose-500 num-en ${isRTL ? "text-left" : "text-right"}`}>
                                  -${(p.total_amount || (p.unit_price * p.quantity) || 0).toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          ) : (
            <Card className="p-12 text-center border-dashed border-2 border-stone-200 bg-stone-50/50 text-stone-400 rounded-[40px]">
              <Wallet size={48} className="mb-4 opacity-20 mx-auto" />
              <p className="font-bold text-lg">{isRTL ? "يرجى اختيار طالب لعرض تفاصيل المدفوعات" : "Select a child to view payment details"}</p>
            </Card>
          )}
        </div>
      ) : (
        <>
          {/* Children Overview */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-serif text-2xl font-bold text-stone-900">{isRTL ? "أبنائي" : "My Children"}</h3>
              <p className="text-stone-400 text-sm font-medium">{children.length} {isRTL ? "طلاب مسجلون" : "Students Registered"}</p>
            </div>

            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              {children.length === 0 ? (
                <Card className="col-span-full p-12 border-dashed border-2 border-stone-200 bg-stone-50/50 flex flex-col items-center justify-center text-stone-400 rounded-[40px]">
                  <Users size={48} className="mb-4 opacity-20" />
                  <p className="font-bold text-lg">{isRTL ? "لم يتم العثور على طلاب مرتبطبن" : "No linked students found"}</p>
                  <button className="text-rose-500 mt-2 font-bold cursor-pointer hover:underline">ربط حساب طالب جديد</button>
                </Card>
              ) : (
                children.map((child, i) => (
                  <motion.div
                    key={child.id}
                    variants={{ hidden: { opacity: 0, x: isRTL ? 20 : -20 }, visible: { opacity: 1, x: 0 } }}
                    whileHover={{ y: -5 }}
                    className="group"
                  >
                    <Card className="p-8 border-none shadow-sm hover:shadow-2xl transition-all duration-500 rounded-[48px] bg-white relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 opacity-5">
                        <GraduationCap size={120} />
                      </div>
                      
                      <div className="flex items-start gap-6 mb-8">
                        <div className="h-24 w-24 rounded-[32px] bg-stone-100 flex items-center justify-center text-stone-400 group-hover:bg-rose-50 group-hover:text-rose-500 transition-all duration-500 shadow-inner">
                          <Users size={48} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-3xl font-serif font-black text-stone-900 group-hover:text-rose-600 transition-colors">
                              {child.full_name || child.name}
                            </h4>
                            <Badge className="bg-emerald-500 text-white border-none rounded-lg font-bold px-2 py-0.5 text-[10px]">
                              {isRTL ? "منتظم" : "Active"}
                            </Badge>
                          </div>
                          <p className="text-stone-400 font-bold tracking-widest text-sm uppercase">
                            {isRTL ? "الصف" : "Grade"} {child.grade} · {child.section || 'أ'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-8">
                        {[
                          { label: isRTL ? "الحضور" : "Attendance", value: "٩٨٪", color: "text-emerald-600", bg: "bg-emerald-50" },
                          { label: isRTL ? "المعدل" : "GPA", value: "٣.٨", color: "text-indigo-600", bg: "bg-indigo-50" },
                          { label: isRTL ? "النقاط" : "Points", value: "٤٥٠", color: "text-amber-600", bg: "bg-amber-50" },
                        ].map((stat, idx) => (
                          <div key={idx} className={`${stat.bg} p-4 rounded-3xl text-center border border-white/50 shadow-sm`}>
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-6 pt-8 border-t border-stone-50">
                        <div>
                          <div className="flex justify-between items-end mb-2">
                            <span className="text-xs font-black text-stone-800 uppercase tracking-wide">{isRTL ? "التقدم الدراسي" : "Academic Progress"}</span>
                            <span className="text-sm font-black text-rose-500"> 85٪</span>
                          </div>
                          <Progress value={85} className="h-2 bg-stone-100" />
                        </div>
                        
                        <div className="flex gap-3">
                          <button className={`flex-1 ${btnPrimary} rounded-2xl h-12`}>
                            {isRTL ? "عرض التقرير المفصل" : "View Detailed Report"}
                          </button>
                          <button className={`${btnOutline} h-12 w-12 rounded-2xl border-stone-100 text-stone-400 hover:text-rose-500 hover:bg-rose-50 transition-all`}>
                            <ArrowUpRight size={20} />
                          </button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))
              )}
            </motion.div>
          </section>

          {/* Finance & Fees Quick Action */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 p-10 bg-gradient-to-br from-indigo-900 to-indigo-800 text-white rounded-[48px] shadow-2xl relative overflow-hidden border-none">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="max-w-md">
                  <div className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-6 border border-white/10">
                    <CreditCard size={32} className="text-indigo-300" />
                  </div>
                  <h4 className="text-3xl font-serif font-bold mb-3">{isRTL ? "الرسوم الدراسية" : "Tuition Fees"}</h4>
                  <p className="text-indigo-100/60 leading-relaxed mb-8">
                    {isRTL ? "بإمكانك دفع الرسوم الدراسية، متابعة الفواتير السابقة، وإدارة خطط الدفع الميسرة بكل سهولة." : "You can pay tuition fees, track past invoices, and manage easy payment plans effortlessly."}
                  </p>
                  <div className="flex items-center gap-4">
                    <button className="bg-white text-indigo-900 hover:bg-indigo-50 rounded-2xl px-8 h-12 font-bold shadow-xl cursor-pointer">
                      {isRTL ? "ادفع الآن" : "Pay Now"}
                    </button>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">{isRTL ? "المبلغ المستحق" : "Balance Due"}</span>
                      <span className="text-xl font-black">$١,٢٠٠.٠٠</span>
                    </div>
                  </div>
                </div>
                
                <div className="hidden md:block w-48 h-48 rounded-[40px] bg-white/5 backdrop-blur-md border border-white/10 flex flex-col items-center justify-center gap-2 p-6 text-center">
                  <ShieldCheck size={48} className="text-emerald-400 mb-2" />
                  <p className="text-xs font-bold text-white/80 uppercase tracking-widest">{isRTL ? "دفع آمن ١٠٠٪" : "100% Secure"}</p>
                </div>
              </div>
              
              {/* Decorative Pattern */}
              <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-[100px]" />
              <div className="absolute -top-20 -right-20 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px]" />
            </Card>

            {/* Recent Notifications */}
            <Card className="p-8 border-none shadow-sm bg-white rounded-[48px] flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <h4 className="font-bold text-stone-900">{isRTL ? "آخر التنبيهات" : "Latest Alerts"}</h4>
                <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
              </div>
              
              <div className="space-y-6 flex-1">
                {[
                  { title: "موعد اجتماع أولياء الأمور", date: "١٥ مايو", icon: Calendar, color: "text-blue-500", bg: "bg-blue-50" },
                  { title: "تقرير الحضور الأسبوعي متاح", date: "١٢ مايو", icon: ClipboardCheck, color: "text-emerald-500", bg: "bg-emerald-50" },
                  { title: "تم تسجيل فوز في مسابقة الرسم", date: "١٠ مايو", icon: Award, color: "text-amber-500", bg: "bg-amber-50" },
                ].map((alert, i) => (
                  <div key={i} className="flex gap-4 group cursor-pointer">
                    <div className={`h-12 w-12 rounded-2xl ${alert.bg} flex items-center justify-center ${alert.color} group-hover:scale-110 transition-transform`}>
                      <alert.icon size={20} />
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-stone-800 group-hover:text-rose-500 transition-colors leading-tight mb-1">{alert.title}</h5>
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{alert.date}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <button className="w-full mt-8 rounded-2xl font-bold text-stone-400 hover:text-rose-500 hover:bg-rose-50 cursor-pointer">
                {isRTL ? "عرض جميع الإشعارات" : "View All Notifications"}
              </button>
            </Card>
          </section>
        </>
      )}
      </div>
      </main>
    </div>
  );
}