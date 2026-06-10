import React, { useState, useMemo, useEffect } from "react";
import { 
  FileText, 
  Search, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Coffee, 
  Fingerprint, 
  DollarSign 
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

export default function StaffPersonalRequests() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);

  // جلب اسم الموظف المسجل حالياً من الجلسة
  const myName = useMemo(() => {
    const userStr = localStorage.getItem("portal_user");
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        return u.full_name || u.name || "موظف إديوتراك";
      } catch (e) { }
    }
    return localStorage.getItem("portal_user_name") || "موظف إديوتراك";
  }, []);

  const myRole = useMemo(() => {
    return localStorage.getItem("portal_role") || "staff";
  }, []);

  // تحميل وقراءة الطلبات الكلية
  const [requests, setRequests] = useState(() => {
    const saved = localStorage.getItem("staff_requests");
    return saved ? JSON.parse(saved) : [];
  });

  // مزامنة حالة الطلبات
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem("staff_requests");
      if (saved) setRequests(JSON.parse(saved));
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // تصفية الطلبات لعرض طلبات هذا الموظف فقط
  const myRequests = useMemo(() => {
    return requests.filter(r => r.employeeName === myName);
  }, [requests, myName]);

  // حقول طلب جديد
  const [newReqType, setNewReqType] = useState("LEAVE");
  const [newReqReason, setNewReqReason] = useState("");
  const [newReqAmount, setNewReqAmount] = useState("");
  const [newReqDuration, setNewReqDuration] = useState("");

  const handleCreateRequest = (e) => {
    e.preventDefault();
    if (!newReqReason) {
      toast.error(isRTL ? "يرجى كتابة سبب الطلب" : "Please enter the request reason");
      return;
    }

    const id = "req-" + Date.now();
    const durationText = newReqType === "LOAN" 
      ? (isRTL ? `سلفة بقيمة ${Number(newReqAmount).toLocaleString()} ر.س` : `Loan of ${Number(newReqAmount).toLocaleString()} SAR`)
      : newReqDuration;

    const newRequest = {
      id,
      employeeName: myName,
      role: myRole,
      type: newReqType,
      date: new Date().toISOString().split('T')[0],
      duration: durationText || (isRTL ? "يوم واحد" : "1 Day"),
      reason: newReqReason,
      loanAmount: newReqType === "LOAN" ? Number(newReqAmount || 0) : undefined,
      status: "PENDING",
      createdAt: new Date().toISOString().split('T')[0]
    };

    const updated = [newRequest, ...requests];
    setRequests(updated);
    localStorage.setItem("staff_requests", JSON.stringify(updated));
    setIsNewRequestOpen(false);
    toast.success(isRTL ? "تم إرسال طلبك بنجاح للمراجعة والاعتماد" : "Request submitted for approval successfully");

    setNewReqReason("");
    setNewReqAmount("");
    setNewReqDuration("");
  };

  const getStatusBadge = (status) => {
    const map = {
      'PENDING': { bg: 'bg-amber-50 text-amber-700 border-amber-200/50', label: isRTL ? 'قيد الانتظار' : 'Pending', icon: Clock },
      'APPROVED': { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/50', label: isRTL ? 'معتمد' : 'Approved', icon: CheckCircle2 },
      'REJECTED': { bg: 'bg-rose-50 text-rose-700 border-rose-200/50', label: isRTL ? 'مرفوض' : 'Rejected', icon: XCircle },
    };
    const current = map[status] || map['PENDING'];
    return (
      <Badge className={`${current.bg} border rounded-lg font-bold text-xs px-2.5 py-1 flex items-center gap-1`}>
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
    };
    return map[type] || { label: type, color: 'text-stone-600 bg-stone-50', icon: FileText };
  };

  const filteredRequests = useMemo(() => {
    return myRequests.filter(r => {
      const matchSearch = r.reason.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = typeFilter === "all" || r.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [myRequests, searchTerm, typeFilter]);

  return (
    <div className="space-y-6 pb-20" dir={isRTL ? "rtl" : "ltr"}>
      <PageHeader 
        title={isRTL ? "طلباتي الشخصية" : "My Requests Portal"} 
        subtitle={isRTL ? "تقديم ومتابعة طلبات الإجازات والاستئذانات والسلف والرواتب الخاصة بك" : "Submit and monitor your personal leaves, permissions, loans and payroll corrections"}
      >
        <button onClick={() => setIsNewRequestOpen(true)} className={`${btnPrimary} h-11 px-5`}>
          <Plus size={18} />
          <span>{isRTL ? "تقديم طلب جديد" : "Create Request"}</span>
        </button>
      </PageHeader>

      {/* المجموع الإحصائي لطلبات الموظف */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: isRTL ? "إجمالي طلباتي" : "Total Requests", value: myRequests.length, color: "text-stone-900", bg: "bg-stone-50" },
          { label: isRTL ? "طلبات قيد الانتظار" : "Pending Approval", value: myRequests.filter(r => r.status === "PENDING").length, color: "text-amber-600", bg: "bg-amber-50" },
          { label: isRTL ? "الطلبات المعتمدة" : "Approved", value: myRequests.filter(r => r.status === "APPROVED").length, color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map((stat, i) => (
          <Card key={i} className="p-5 border shadow-sm bg-white rounded-2xl flex items-center justify-between group overflow-hidden relative">
            <div>
              <p className="text-stone-400 text-[10px] font-bold uppercase tracking-wider mb-1">{stat.label}</p>
              <h4 className="text-2xl font-black text-stone-900 num-en">{stat.value}</h4>
            </div>
            <div className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
              <FileText size={18} />
            </div>
          </Card>
        ))}
      </div>

      {/* تصفية وبحث */}
      <div className="flex flex-col md:flex-row items-center gap-4 justify-between">
        <Card className="p-2 border shadow-sm bg-white rounded-xl w-full md:w-96">
          <div className="relative">
            <Search className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-stone-400`} size={18} />
            <Input 
              placeholder={isRTL ? "ابحث في تفاصيل طلباتك..." : "Search requests..."} 
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
            {["LEAVE", "PERMISSION", "PUNCH_CORRECTION", "LOAN"].map(type => {
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

      {/* قائمة الطلبات الشخصية */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center text-stone-400 border-2 border-dashed border-stone-100 rounded-2xl">
            {isRTL ? "لا توجد طلبات مسجلة حالياً." : "No requests submitted yet."}
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
                      <div className={`h-11 w-11 rounded-xl ${typeDisplay.color} flex items-center justify-center shrink-0`}>
                        <typeDisplay.icon size={22} />
                      </div>
                      
                      <div className="space-y-1">
                        <h5 className="font-bold text-stone-900 text-base">{req.reason}</h5>
                        <p className="text-xs text-stone-400 flex items-center gap-1.5 font-medium flex-wrap">
                          <span className="font-bold">{typeDisplay.label}</span>
                          <span>·</span>
                          <span className="num-en">{req.date}</span>
                          <span>·</span>
                          <span>{isRTL ? "التفاصيل:" : "Details:"} <span className="text-stone-600 font-bold">{req.duration}</span></span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
                      {getStatusBadge(req.status)}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* حوار طلب جديد */}
      <Dialog open={isNewRequestOpen} onOpenChange={setIsNewRequestOpen}>
        <DialogContent className="max-w-md rounded-3xl" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="text-lg font-serif font-black">{isRTL ? "تقديم طلب جديد" : "New Request"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateRequest} className="space-y-4 mt-2">
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
