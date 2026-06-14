import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { 
  FileText, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Coffee,
  Fingerprint,
  DollarSign,
  Plus,
  ChevronDown,
  LifeBuoy
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import PageHeader from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all border-2 border-stone-200 bg-white text-stone-800 hover:bg-stone-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const btnPrimary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed";

export default function StaffRequests() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);

  // حالة الطلبات - يتم تحميلها وحفظها في localStorage لضمان استمرار الحالات
  const [requests, setRequests] = useState(() => {
    const saved = localStorage.getItem("staff_requests");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return [
      {
        id: "req-1",
        employeeName: "سليمان القحطاني",
        role: "Registrar",
        type: "LEAVE",
        date: "2026-06-12",
        duration: isRTL ? "٣ أيام" : "3 Days",
        reason: isRTL ? "إجازة عائلية طارئة" : "Emergency family leave",
        status: "PENDING",
        createdAt: "2026-06-10"
      },
      {
        id: "req-2",
        employeeName: "منى الرويلي",
        role: "HR",
        type: "PERMISSION",
        date: "2026-06-11",
        duration: isRTL ? "ساعتان (صباحي)" : "2 Hours (Morning)",
        reason: isRTL ? "مراجعة طبية للمستشفى" : "Hospital checkup appointment",
        status: "PENDING",
        createdAt: "2026-06-09"
      },
      {
        id: "req-3",
        employeeName: "خالد الحربي",
        role: "Accountant",
        type: "PUNCH_CORRECTION",
        date: "2026-06-08",
        duration: isRTL ? "دخول (٠٨:٠٥ ص)" : "Punch In (08:05 AM)",
        reason: isRTL ? "خلل تقني في جهاز البصمة الرئيسي" : "Fingerprint device technical error",
        status: "APPROVED",
        createdAt: "2026-06-08"
      },
      {
        id: "req-4",
        employeeName: "أحمد العتيبي",
        role: "HR",
        type: "LOAN",
        date: "2026-06-10",
        duration: isRTL ? "سلفة بقيمة 1,500 ر.س" : "Loan of 1,500 SAR",
        reason: isRTL ? "طلب سلفة سكن طارئة لتسديد دفعة الإيجار" : "Urgent housing loan for rent payment",
        loanAmount: 1500,
        status: "PENDING",
        createdAt: "2026-06-10"
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem("staff_requests", JSON.stringify(requests));
  }, [requests]);

  // حقول الطلب الجديد
  const [newReqName, setNewReqName] = useState("");
  const [newReqRole, setNewReqRole] = useState("Registrar");
  const [newReqType, setNewReqType] = useState("LEAVE");
  const [newReqReason, setNewReqReason] = useState("");
  const [newReqAmount, setNewReqAmount] = useState("");
  const [newReqDuration, setNewReqDuration] = useState("");

  // إحصائيات سريعة للطلبات
  const stats = useMemo(() => {
    const pending = requests.filter(r => r.status === "PENDING").length;
    const approved = requests.filter(r => r.status === "APPROVED").length;
    const rejected = requests.filter(r => r.status === "REJECTED").length;
    return { pending, approved, rejected, total: requests.length };
  }, [requests]);

  // تحديث حالة الطلب
  const handleStatusChange = (id, newStatus, employeeName) => {
    setRequests(prev => prev.map(r => {
      if (r.id === id) {
        // إذا كان الطلب المعتمد سلفة، نقوم بحفظه في جدول السلف المعتمدة
        if (newStatus === "APPROVED" && r.type === "LOAN") {
          const approvedLoans = JSON.parse(localStorage.getItem("staff_approved_loans") || "[]");
          // منع تكرار نفس السلفة
          if (!approvedLoans.some(l => l.requestId === id)) {
            approvedLoans.push({
              requestId: id,
              employeeName: r.employeeName,
              amount: Number(r.loanAmount || 0),
              date: r.date
            });
            localStorage.setItem("staff_approved_loans", JSON.stringify(approvedLoans));
          }
        }
        return { ...r, status: newStatus };
      }
      return r;
    }));
    
    if (newStatus === "APPROVED") {
      toast.success(
        isRTL 
          ? `تم قبول طلب الموظف ${employeeName} واعتماده.` 
          : `Request from ${employeeName} has been approved.`
      );
    } else {
      toast.error(
        isRTL 
          ? `تم رفض طلب الموظف ${employeeName}.` 
          : `Request from ${employeeName} has been rejected.`
      );
    }
  };

  // إضافة طلب جديد محاكى
  const handleCreateRequest = (e) => {
    e.preventDefault();
    if (!newReqName || !newReqReason) {
      toast.error(isRTL ? "يرجى تعبئة الحقول الأساسية" : "Please fill in the required fields");
      return;
    }

    const id = "req-" + Date.now();
    const durationText = newReqType === "LOAN" 
      ? (isRTL ? `سلفة بقيمة ${Number(newReqAmount).toLocaleString()} ر.س` : `Loan of ${Number(newReqAmount).toLocaleString()} SAR`)
      : newReqDuration;

    const newRequest = {
      id,
      employeeName: newReqName,
      role: newReqRole,
      type: newReqType,
      date: format(new Date(), "yyyy-MM-dd"),
      duration: durationText || (isRTL ? "يوم واحد" : "1 Day"),
      reason: newReqReason,
      loanAmount: newReqType === "LOAN" ? Number(newReqAmount || 0) : undefined,
      status: "PENDING",
      createdAt: format(new Date(), "yyyy-MM-dd")
    };

    setRequests(prev => [newRequest, ...prev]);
    setIsNewRequestOpen(false);
    toast.success(isRTL ? "تم إرسال الطلب بنجاح" : "Request submitted successfully");

    // إعادة ضبط الحقول
    setNewReqName("");
    setNewReqReason("");
    setNewReqAmount("");
    setNewReqDuration("");
  };

  // فلترة الطلبات
  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      const matchSearch = r.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.reason.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = typeFilter === "all" || r.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [requests, searchTerm, typeFilter]);

  const getStatusBadge = (status) => {
    const map = {
      'PENDING': { bg: 'bg-amber-50 text-amber-700 border-amber-200/50', label: isRTL ? 'قيد الانتظار' : 'Pending', icon: Clock },
      'APPROVED': { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/50', label: isRTL ? 'معتمد' : 'Approved', icon: CheckCircle2 },
      'REJECTED': { bg: 'bg-rose-50 text-rose-700 border-rose-200/50', label: isRTL ? 'مرفوض' : 'Rejected', icon: XCircle },
    };
    const current = map[status] || map['PENDING'];
    return (
      <Badge className={`${current.bg} border rounded-lg font-bold text-xs px-2.5 py-1 flex items-center gap-1.5 shadow-none`}>
        <current.icon size={13} />
        <span>{current.label}</span>
      </Badge>
    );
  };

  const getRequestTypeDisplay = (type) => {
    const map = {
      'LEAVE': { label: isRTL ? 'طلب إجازة' : 'Leave Request', color: 'text-blue-600 bg-blue-50', icon: Coffee },
      'PERMISSION': { label: isRTL ? 'طلب استئذان' : 'Permission', color: 'text-amber-600 bg-amber-50', icon: Clock },
      'PUNCH_CORRECTION': { label: isRTL ? 'تصحيح بصمة' : 'Punch Correction', color: 'text-violet-600 bg-violet-50', icon: Fingerprint },
      'LOAN': { label: isRTL ? 'طلب سلفة' : 'Loan Request', color: 'text-emerald-600 bg-emerald-50', icon: DollarSign },
      'SUPPORT': { label: isRTL ? 'دعم فني' : 'Technical Support', color: 'text-rose-600 bg-rose-50', icon: LifeBuoy }
    };
    return map[type] || { label: type, color: 'text-stone-600 bg-stone-50', icon: FileText };
  };

  return (
    <div className="space-y-6 pb-20" dir={isRTL ? "rtl" : "ltr"}>
      <PageHeader 
        title={isRTL ? "طلبات وإجازات الموظفين" : "Employee Requests"} 
        subtitle={isRTL ? "مراجعة وإجراء الموافقات على طلبات الإجازات والاستئذانات وتصحيح البصمة والسلف" : "Review and approve leave requests, permissions, punch corrections and loans"}
      >
        <button onClick={() => setIsNewRequestOpen(true)} className={`${btnPrimary} h-11 px-5`}>
          <Plus size={18} />
          <span>{isRTL ? "تقديم طلب جديد" : "Create Request"}</span>
        </button>
      </PageHeader>

      {/* بطاقات المجموع الكلي */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: isRTL ? "إجمالي الطلبات" : "Total Requests", value: stats.total, color: "text-stone-900", bg: "bg-stone-50" },
          { label: isRTL ? "بانتظار المراجعة" : "Pending Review", value: stats.pending, color: "text-amber-600", bg: "bg-amber-50" },
          { label: isRTL ? "الطلبات المعتمدة" : "Approved", value: stats.approved, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: isRTL ? "الطلبات المرفوضة" : "Rejected", value: stats.rejected, color: "text-rose-600", bg: "bg-rose-50" },
        ].map((stat, i) => (
          <Card key={i} className="p-5 border shadow-sm bg-white rounded-2xl flex items-center justify-between group overflow-hidden relative">
            <div>
              <p className="text-stone-400 text-[10px] font-bold uppercase tracking-wider mb-1">{stat.label}</p>
              <h4 className={`text-2xl font-black ${stat.color} num-en`}>{stat.value}</h4>
            </div>
            <div className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
              <FileText size={20} />
            </div>
          </Card>
        ))}
      </div>

      {/* شريط البحث وتصفية النوع */}
      <div className="flex flex-col md:flex-row items-center gap-4 justify-between">
        <Card className="p-2 border shadow-sm bg-white rounded-xl w-full md:w-96">
          <div className="relative">
            <Search className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-stone-400`} size={18} />
            <Input 
              placeholder={isRTL ? "ابحث بالاسم أو سبب الطلب..." : "Search request..."} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`h-10 ${isRTL ? 'pr-12' : 'pl-12'} border-none bg-transparent text-sm font-medium focus-visible:ring-0`}
              dir={isRTL ? "rtl" : "ltr"}
            />
          </div>
        </Card>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-stone-500">{isRTL ? "نوع الطلب:" : "Type:"}</span>
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setTypeFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                typeFilter === "all" ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {isRTL ? "الكل" : "All"}
            </button>
            {["LEAVE", "PERMISSION", "PUNCH_CORRECTION", "LOAN", "SUPPORT"].map(type => {
              const display = getRequestTypeDisplay(type);
              return (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    typeFilter === type ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  {display.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* قائمة الطلبات المستلمة */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center text-stone-400 border-2 border-dashed border-stone-100 rounded-2xl">
            {isRTL ? "لا توجد طلبات معلقة تطابق خيارات البحث." : "No requests found."}
          </div>
        ) : (
          <AnimatePresence>
            {filteredRequests.map((req) => {
              const typeDisplay = getRequestTypeDisplay(req.type);
              return (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="group"
                >
                  <Card className="p-5 border shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl bg-white flex flex-col md:flex-row md:items-center justify-between gap-5">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      {/* أيقونة نوع الطلب */}
                      <div className={`h-11 w-11 rounded-xl ${typeDisplay.color} flex items-center justify-center shrink-0`}>
                        <typeDisplay.icon size={22} />
                      </div>
                      
                      {/* تفاصيل الموظف ومحتوى الطلب */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="font-bold text-stone-900 text-base">{req.employeeName}</h5>
                          <span className="text-[10px] text-stone-400 font-bold bg-stone-50 px-2 py-0.5 rounded">
                            {isRTL ? `كادر: ${req.role}` : `Role: ${req.role}`}
                          </span>
                        </div>
                        <p className="text-stone-700 text-sm font-semibold">{req.reason}</p>
                        <p className="text-xs text-stone-400 flex items-center gap-1.5 font-medium flex-wrap">
                          <span>{typeDisplay.label}</span>
                          <span>·</span>
                          <span className="num-en">{req.date}</span>
                          <span>·</span>
                          <span>{isRTL ? "التفاصيل:" : "Details:"} <span className="text-stone-600 font-bold">{req.duration}</span></span>
                        </p>
                      </div>
                    </div>

                    {/* الحالة والأزرار */}
                    <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
                      {getStatusBadge(req.status)}
                      
                      {req.status === "PENDING" && (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleStatusChange(req.id, "APPROVED", req.employeeName)}
                            className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border-none flex items-center justify-center cursor-pointer transition-all shadow-sm"
                            title={isRTL ? "موافقة واعتماد" : "Approve"}
                          >
                            <ThumbsUp size={15} />
                          </button>
                          <button
                            onClick={() => handleStatusChange(req.id, "REJECTED", req.employeeName)}
                            className="h-9 w-9 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border-none flex items-center justify-center cursor-pointer transition-all shadow-sm"
                            title={isRTL ? "رفض الطلب" : "Reject"}
                          >
                            <ThumbsDown size={15} />
                          </button>
                        </div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* حوار تقديم طلب جديد */}
      <Dialog open={isNewRequestOpen} onOpenChange={setIsNewRequestOpen}>
        <DialogContent className="max-w-md rounded-3xl" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="text-lg font-serif font-black">{isRTL ? "تقديم طلب جديد للموظف" : "Submit New Request"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateRequest} className="space-y-4 mt-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-500">{isRTL ? "اسم الموظف" : "Employee Name"}</label>
              <Input 
                value={newReqName} 
                onChange={(e) => setNewReqName(e.target.value)} 
                placeholder={isRTL ? "أدخل اسم الموظف كاملاً..." : "Full name"} 
                className="rounded-xl border-stone-200"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-500">{isRTL ? "كادر الموظف" : "Employee Role"}</label>
                <select 
                  value={newReqRole} 
                  onChange={(e) => setNewReqRole(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-xl h-10 px-3 text-xs font-bold text-stone-700 outline-none"
                >
                  <option value="Registrar">{isRTL ? "مسجل" : "Registrar"}</option>
                  <option value="HR">{isRTL ? "موارد بشرية" : "HR"}</option>
                  <option value="Accountant">{isRTL ? "محاسب" : "Accountant"}</option>
                  <option value="security">{isRTL ? "حارس أمن" : "Security"}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-500">{isRTL ? "نوع الطلب" : "Request Type"}</label>
                <select 
                  value={newReqType} 
                  onChange={(e) => setNewReqType(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-xl h-10 px-3 text-xs font-bold text-stone-700 outline-none"
                >
                  <option value="LEAVE">{isRTL ? "طلب إجازة" : "Leave"}</option>
                  <option value="PERMISSION">{isRTL ? "طلب استئذان" : "Permission"}</option>
                  <option value="PUNCH_CORRECTION">{isRTL ? "تصحيح بصمة" : "Punch Correction"}</option>
                  <option value="LOAN">{isRTL ? "طلب سلفة مالية" : "Financial Loan"}</option>
                </select>
              </div>
            </div>

            {newReqType === "LOAN" ? (
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-500">{isRTL ? "مبلغ السلفة (بالريال السعودي)" : "Loan Amount (SAR)"}</label>
                <Input 
                  type="number" 
                  value={newReqAmount} 
                  onChange={(e) => setNewReqAmount(e.target.value)} 
                  placeholder="1500" 
                  className="rounded-xl border-stone-200"
                  required
                />
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-500">{isRTL ? "المدة أو التفاصيل" : "Duration / Detail"}</label>
                <Input 
                  value={newReqDuration} 
                  onChange={(e) => setNewReqDuration(e.target.value)} 
                  placeholder={isRTL ? "مثال: ٣ أيام أو ساعتان" : "e.g. 3 days or 2 hours"} 
                  className="rounded-xl border-stone-200"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-500">{isRTL ? "السبب / الملاحظات" : "Reason / Note"}</label>
              <Input 
                value={newReqReason} 
                onChange={(e) => setNewReqReason(e.target.value)} 
                placeholder={isRTL ? "أدخل تفاصيل ومبررات الطلب..." : "Describe the reason"} 
                className="rounded-xl border-stone-200"
                required
              />
            </div>

            <DialogFooter className="pt-2 flex gap-2">
              <button 
                type="button" 
                onClick={() => setIsNewRequestOpen(false)} 
                className={`${btnOutline} rounded-xl h-10 px-4`}
              >
                {isRTL ? "إلغاء" : "Cancel"}
              </button>
              <button 
                type="submit" 
                className={`${btnPrimary} h-10 px-4`}
              >
                {isRTL ? "تقديم الطلب" : "Submit"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
