import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { 
  CreditCard, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  Filter, 
  Plus, 
  DollarSign, 
  Clock, 
  Users, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Settings, 
  Activity, 
  ShoppingBag,
  Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";

import { useAuth } from "@/lib/AuthContext";
import PageHeader from "@/components/shared/PageHeader";

const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all border-2 border-stone-300 bg-white text-stone-800 hover:bg-stone-50 hover:border-stone-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const btnPrimary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-stone-900 text-white hover:bg-black cursor-pointer shadow-lg shadow-stone-200 disabled:opacity-50 disabled:cursor-not-allowed";

export default function Finance() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isRTL = true; // Forcing RTL Arabic styling as requested

  const [activeTab, setActiveTab] = useState("revenue"); // "revenue" | "tuition" | "structures" | "activities"
  const [searchTerm, setSearchTerm] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Dialog states
  const [addFeeOpen, setAddFeeOpen] = useState(false);
  const [selectedStudentForFee, setSelectedStudentForFee] = useState(null);

  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
  const [selectedStudentForPayment, setSelectedStudentForPayment] = useState(null);

  const [addStructureOpen, setAddStructureOpen] = useState(false);
  const [addActivityOpen, setAddActivityOpen] = useState(false);

  // Form states - Add Fee
  const [selectedStructureId, setSelectedStructureId] = useState("");
  const [manualFeeName, setManualFeeName] = useState("");
  const [manualFeeAmount, setManualFeeAmount] = useState("");
  const [feeDueDate, setFeeDueDate] = useState("");
  const [feePaymentPlan, setFeePaymentPlan] = useState("full");
  const [feeNotes, setFeeNotes] = useState("");

  // Form states - Record Payment
  const [selectedStudentFeeId, setSelectedStudentFeeId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentNotes, setPaymentNotes] = useState("");

  // Form states - Add Structure
  const [structGradeLevel, setStructGradeLevel] = useState("");
  const [structFeeName, setStructFeeName] = useState("");
  const [structAmount, setStructAmount] = useState("");
  const [structPaymentType, setStructPaymentType] = useState("yearly");

  // Form states - Add Activity
  const [actName, setActName] = useState("");
  const [actDescription, setActDescription] = useState("");
  const [actAmount, setActAmount] = useState("");
  const [actDueDate, setActDueDate] = useState("");
  const [actGradeLevel, setActGradeLevel] = useState("");
  const [actIsMandatory, setActIsMandatory] = useState(false);
  const [autoAssignActivity, setAutoAssignActivity] = useState(false);

  // Queries
  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ["students-finance"],
    queryFn: () => base44.entities.Student.list(),
    staleTime: 1000 * 60 * 5
  });

  const { data: studentFees = [], isLoading: loadingStudentFees } = useQuery({
    queryKey: ["student-fees-all"],
    queryFn: () => base44.entities.StudentFee.list(),
    staleTime: 1000 * 60 * 3
  });

  const { data: feePayments = [] } = useQuery({
    queryKey: ["fee-payments-all"],
    queryFn: () => base44.entities.FeePayment.list(),
    staleTime: 1000 * 60 * 3
  });

  const { data: walletTransactions = [] } = useQuery({
    queryKey: ["wallet-transactions-all"],
    queryFn: () => base44.entities.WalletTransaction.list(),
    staleTime: 1000 * 60 * 3
  });

  const { data: feeStructures = [] } = useQuery({
    queryKey: ["fee-structures"],
    queryFn: () => base44.entities.FeeStructure.list(),
    staleTime: 1000 * 60 * 10
  });

  const { data: activityFees = [] } = useQuery({
    queryKey: ["activity-fees"],
    queryFn: () => base44.entities.ActivityFee.list(),
    staleTime: 1000 * 60 * 5
  });

  // Mutations
  const createFeeMutation = useMutation({
    /** @param {any} data */
    mutationFn: async (data) => {
      return base44.entities.StudentFee.create(data);
    },
    onSuccess: () => {
      toast.success("تم إضافة الالتزام المالي للطالب بنجاح");
      qc.invalidateQueries({ queryKey: ["student-fees-all"] });
      setAddFeeOpen(false);
      resetFeeForm();
    },
    onError: (err) => {
      console.error(err);
      toast.error("فشل إضافة الالتزام المالي");
    }
  });

  const recordPaymentMutation = useMutation({
    /** @param {any} data */
    mutationFn: async (data) => {
      return base44.entities.FeePayment.create(data);
    },
    onSuccess: () => {
      toast.success("تم تسجيل الدفعة بنجاح وتحديث الالتزام تلقائياً");
      qc.invalidateQueries({ queryKey: ["student-fees-all"] });
      qc.invalidateQueries({ queryKey: ["fee-payments-all"] });
      setRecordPaymentOpen(false);
      resetPaymentForm();
    },
    onError: (err) => {
      console.error(err);
      toast.error("فشل تسجيل الدفعة");
    }
  });

  const createStructureMutation = useMutation({
    /** @param {any} data */
    mutationFn: async (data) => {
      return base44.entities.FeeStructure.create(data);
    },
    onSuccess: () => {
      toast.success("تم إضافة تسعيرة جديدة للصف بنجاح");
      qc.invalidateQueries({ queryKey: ["fee-structures"] });
      setAddStructureOpen(false);
      resetStructureForm();
    },
    onError: (err) => {
      console.error(err);
      toast.error("فشل إضافة التسعيرة");
    }
  });

  const toggleStructureStatus = useMutation({
    /** @param {{ id: any, isActive: any }} data */
    mutationFn: async ({ id, isActive }) => {
      return base44.entities.FeeStructure.update(id, { is_active: !isActive });
    },
    onSuccess: () => {
      toast.success("تم تعديل حالة التسعيرة بنجاح");
      qc.invalidateQueries({ queryKey: ["fee-structures"] });
    },
    onError: (err) => {
      console.error(err);
      toast.error("فشل تعديل الحالة");
    }
  });

  const createActivityMutation = useMutation({
    /** @param {any} data */
    mutationFn: async (data) => {
      const act = await base44.entities.ActivityFee.create({
        activity_name: data.activity_name,
        description: data.description,
        amount: data.amount,
        due_date: data.due_date,
        grade_level: data.grade_level,
        is_mandatory: data.is_mandatory,
        created_by: user?.id || 1 // Assuming admin ID
      });

      if (data.autoAssign && data.grade_level) {
        // Query students in this grade
        const targetStudents = students.filter(s => s.grade === data.grade_level);
        for (const student of targetStudents) {
          await base44.entities.StudentActivityFee.create({
            student_id: student.id,
            activity_fee_id: act.id,
            status: "pending"
          });
        }
      }
      return act;
    },
    onSuccess: (act) => {
      toast.success(
        autoAssignActivity 
          ? `تم إنشاء النشاط وتعيينه لـ ${students.filter(s => s.grade === actGradeLevel).length} طالب تلقائياً`
          : "تم إنشاء النشاط بنجاح"
      );
      qc.invalidateQueries({ queryKey: ["activity-fees"] });
      setAddActivityOpen(false);
      resetActivityForm();
    },
    onError: (err) => {
      console.error(err);
      toast.error("فشل إنشاء رسوم النشاط");
    }
  });

  // Resets
  const resetFeeForm = () => {
    setSelectedStructureId("");
    setManualFeeName("");
    setManualFeeAmount("");
    setFeeDueDate("");
    setFeePaymentPlan("full");
    setFeeNotes("");
    setSelectedStudentForFee(null);
  };

  const resetPaymentForm = () => {
    setSelectedStudentFeeId("");
    setPaymentAmount("");
    setPaymentNotes("");
    setSelectedStudentForPayment(null);
  };

  const resetStructureForm = () => {
    setStructGradeLevel("");
    setStructFeeName("");
    setStructAmount("");
    setStructPaymentType("yearly");
  };

  const resetActivityForm = () => {
    setActName("");
    setActDescription("");
    setActAmount("");
    setActDueDate("");
    setActGradeLevel("");
    setActIsMandatory(false);
    setAutoAssignActivity(false);
  };

  // Calculations for Dashboard
  const totalPaid = feePayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  const totalPending = studentFees
    .filter(f => f.status === "pending" || f.status === "partial")
    .reduce((sum, f) => sum + parseFloat(f.remaining || 0), 0);
  const overdueCount = studentFees.filter(f => f.status === "overdue").length;
  const walletTopups = walletTransactions
    .filter(t => t.type === "topup")
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  // BarChart Data formatting (last 6 months)
  const monthlyData = React.useMemo(() => {
    const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    const now = new Date();
    const result = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mIndex = d.getMonth();
      const mName = months[mIndex];

      // Sum fee_payments
      const feeSum = feePayments
        .filter(p => {
          const pd = new Date(p.created_at);
          return pd.getFullYear() === d.getFullYear() && pd.getMonth() === d.getMonth();
        })
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

      // Sum topups
      const walletSum = walletTransactions
        .filter(t => {
          const td = new Date(t.created_at);
          return t.type === "topup" && td.getFullYear() === d.getFullYear() && td.getMonth() === d.getMonth();
        })
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

      result.push({
        name: mName,
        "رسوم دراسية": feeSum,
        "شحن محفظة": walletSum,
      });
    }
    return result;
  }, [feePayments, walletTransactions]);

  // Handle Add Fee Submit
  const handleAddFeeSubmit = (e) => {
    e.preventDefault();
    if (!selectedStudentForFee) return;

    let finalName = manualFeeName;
    let finalAmount = parseFloat(manualFeeAmount);

    if (selectedStructureId) {
      const struct = feeStructures.find(s => s.id === parseInt(selectedStructureId));
      if (struct) {
        finalName = struct.fee_name;
        finalAmount = parseFloat(struct.amount);
      }
    }

    if (!finalName || isNaN(finalAmount) || finalAmount <= 0 || !feeDueDate) {
      toast.error("يرجى ملء جميع الحقول المطلوبة وقيمة صحيحة");
      return;
    }

    createFeeMutation.mutate({
      student_id: selectedStudentForFee.id,
      fee_structure_id: selectedStructureId ? parseInt(selectedStructureId) : null,
      fee_name: finalName,
      amount: finalAmount,
      due_date: feeDueDate,
      payment_plan: feePaymentPlan,
      notes: feeNotes,
      created_by: user?.id || 1 // Admin ID
    });
  };

  // Handle Record Payment Submit
  const handleRecordPaymentSubmit = (e) => {
    e.preventDefault();
    if (!selectedStudentForPayment) return;

    const amt = parseFloat(paymentAmount);
    if (!selectedStudentFeeId || isNaN(amt) || amt <= 0) {
      toast.error("يرجى ملء جميع البيانات بطريقة صحيحة");
      return;
    }

    const fee = studentFees.find(f => f.id === parseInt(selectedStudentFeeId));
    if (fee && amt > parseFloat(fee.remaining)) {
      toast.error(`القيمة المدخلة أكبر من المبلغ المتبقي المستحق وهو $${parseFloat(fee.remaining).toFixed(2)}`);
      return;
    }

    recordPaymentMutation.mutate({
      student_fee_id: parseInt(selectedStudentFeeId),
      student_id: selectedStudentForPayment.id,
      amount: amt,
      payment_method: paymentMethod,
      paid_by: user?.id || 1, // Admin ID
      notes: paymentNotes
    });
  };

  // Handle Add Structure Submit
  const handleAddStructureSubmit = (e) => {
    e.preventDefault();
    const amt = parseFloat(structAmount);
    if (!structGradeLevel || !structFeeName || isNaN(amt) || amt <= 0) {
      toast.error("يرجى ملء كافة البيانات بطريقة صحيحة");
      return;
    }

    createStructureMutation.mutate({
      grade_level: structGradeLevel,
      fee_name: structFeeName,
      amount: amt,
      payment_type: structPaymentType,
      created_by: user?.id || 1,
      is_active: true
    });
  };

  // Handle Add Activity Submit
  const handleAddActivitySubmit = (e) => {
    e.preventDefault();
    const amt = parseFloat(actAmount);
    if (!actName || isNaN(amt) || amt <= 0 || !actDueDate) {
      toast.error("يرجى إكمال الحقول الإلزامية");
      return;
    }

    createActivityMutation.mutate({
      activity_name: actName,
      description: actDescription,
      amount: amt,
      due_date: actDueDate,
      grade_level: actGradeLevel || null,
      is_mandatory: actIsMandatory,
      autoAssign: autoAssignActivity
    });
  };

  // Filter students for the tuition tab
  /** @type {any[]} */
  const studentFinancialSummaries = React.useMemo(() => {
    return students.map(student => {
      const fees = studentFees.filter(f => f.student_id === student.id);
      const totalAmount = fees.reduce((sum, f) => sum + parseFloat(f.amount || 0), 0);
      const totalPaidForStudent = fees.reduce((sum, f) => sum + parseFloat(f.amount_paid || 0), 0);
      const totalRemaining = totalAmount - totalPaidForStudent;

      // Status priority: overdue > partial > pending > paid
      let status = "paid";
      if (fees.some(f => f.status === "overdue")) {
        status = "overdue";
      } else if (fees.some(f => f.status === "partial")) {
        status = "partial";
      } else if (fees.some(f => f.status === "pending")) {
        status = "pending";
      } else if (fees.length === 0) {
        status = "pending";
      }

      return {
        ...student,
        totalAmount,
        totalPaid: totalPaidForStudent,
        totalRemaining,
        financeStatus: status,
        fees
      };
    });
  }, [students, studentFees]);

  const filteredStudentSummaries = studentFinancialSummaries.filter(s => {
    const matchesSearch = s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || s.student_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = gradeFilter === "all" || s.grade === gradeFilter;
    const matchesStatus = statusFilter === "all" || s.financeStatus === statusFilter;
    return matchesSearch && matchesGrade && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-20 text-right" dir="rtl">
      <PageHeader 
        title="إدارة النظام المالي" 
        subtitle="متابعة الرسوم الدراسية، الأنشطة، وهيكل المدفوعات"
      />

      {/* Tabs navigation */}
      <div className="flex border border-stone-200 bg-stone-100/80 p-1.5 rounded-2xl gap-2 w-fit">
        <button
          onClick={() => setActiveTab("revenue")}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "revenue" ? "bg-white text-stone-900 shadow-sm font-extrabold" : "text-stone-500 hover:text-stone-900"
          }`}
        >
          لوحة الإيرادات
        </button>
        <button
          onClick={() => setActiveTab("tuition")}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "tuition" ? "bg-white text-stone-900 shadow-sm font-extrabold" : "text-stone-500 hover:text-stone-900"
          }`}
        >
          الرسوم الدراسية
        </button>
        <button
          onClick={() => setActiveTab("structures")}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "structures" ? "bg-white text-stone-900 shadow-sm font-extrabold" : "text-stone-500 hover:text-stone-900"
          }`}
        >
          تسعيرة الصفوف
        </button>
        <button
          onClick={() => setActiveTab("activities")}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "activities" ? "bg-white text-stone-900 shadow-sm font-extrabold" : "text-stone-500 hover:text-stone-900"
          }`}
        >
          رسوم الأنشطة
        </button>
      </div>

      {/* TAB 1: REVENUE DASHBOARD */}
      {activeTab === "revenue" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: "إجمالي المحصّل", value: `$${totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "الرسوم المعلقة", value: `$${totalPending.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
              { label: "الطلاب المتأخرون", value: overdueCount, icon: AlertCircle, color: "text-rose-600", bg: "bg-rose-50" },
              { label: "إيرادات المتجر", value: `$${walletTopups.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-50" },
            ].map((stat, i) => (
              <Card key={i} className="p-5 border shadow-sm rounded-2xl bg-white relative overflow-hidden">
                <div className="flex justify-between items-start mb-3">
                  <div className={`h-11 w-11 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
                    <stat.icon size={22} />
                  </div>
                </div>
                <p className="text-stone-400 text-xs font-semibold mb-1">{stat.label}</p>
                <h4 className="text-2xl font-black text-stone-900 num-en">{stat.value}</h4>
              </Card>
            ))}
          </div>

          <Card className="p-6 border shadow-sm bg-white rounded-3xl">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="font-serif font-black text-lg text-stone-900">الإيرادات الشهرية المتوقعة والمنجزة</CardTitle>
              <CardDescription>المقارنة والمتابعة خلال الـ 6 أشهر الماضية (الرسوم وشحن المحفظة)</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px] p-0" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#78716c" }} />
                  <YAxis tick={{ fontSize: 12, fill: "#78716c" }} />
                  <Tooltip formatter={(value) => `$${value}`} />
                  <Legend />
                  <Bar dataKey="رسوم دراسية" fill="#1c1917" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="شحن محفظة" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: TUITION FEES */}
      {activeTab === "tuition" && (
        <Card className="p-6 border shadow-sm bg-white rounded-3xl space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-2 flex-1 w-full sm:w-auto">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                <Input 
                  placeholder="بحث باسم الطالب أو رقمه..." 
                  className="pr-10 h-11 rounded-xl bg-stone-50 border-stone-200"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>

              <select
                value={gradeFilter}
                onChange={e => setGradeFilter(e.target.value)}
                className="bg-stone-50 border border-stone-200 rounded-xl h-11 px-3 text-xs font-semibold focus:outline-none"
              >
                <option value="all">كل الصفوف</option>
                {Array.from(new Set(students.map(s => s.grade))).filter(Boolean).map(g => (
                  <option key={g} value={g}>الصف {g}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-stone-50 border border-stone-200 rounded-xl h-11 px-3 text-xs font-semibold focus:outline-none"
              >
                <option value="all">كل الحالات</option>
                <option value="paid">مسدد</option>
                <option value="partial">مسدد جزئياً</option>
                <option value="pending">مستحق</option>
                <option value="overdue">متأخر</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto border border-stone-100 rounded-2xl">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-xs font-bold text-stone-500">
                  <th className="px-5 py-4">الطالب</th>
                  <th className="px-5 py-4">الصف</th>
                  <th className="px-5 py-4">إجمالي الرسوم</th>
                  <th className="px-5 py-4">المدفوع</th>
                  <th className="px-5 py-4">المتبقي</th>
                  <th className="px-5 py-4 text-center">الحالة</th>
                  <th className="px-5 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-sm">
                {filteredStudentSummaries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-stone-400 font-semibold">
                      لا يوجد طلاب يطابقون خيارات البحث.
                    </td>
                  </tr>
                ) : filteredStudentSummaries.map((s) => {
                  const statusLabel = 
                    s.financeStatus === "paid" ? "مسدد" : 
                    s.financeStatus === "partial" ? "جزئي" : 
                    s.financeStatus === "overdue" ? "متأخر" : "مستحق";
                  
                  const statusBadge = 
                    s.financeStatus === "paid" ? "bg-emerald-500/10 text-emerald-600" : 
                    s.financeStatus === "partial" ? "bg-blue-500/10 text-blue-600" : 
                    s.financeStatus === "overdue" ? "bg-rose-500/10 text-rose-600 animate-pulse" : "bg-amber-500/10 text-amber-600";

                  return (
                    <tr key={s.id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <span className="font-bold text-stone-900">{s.full_name}</span>
                        <p className="text-xs text-stone-400 num-en">#{s.student_id}</p>
                      </td>
                      <td className="px-5 py-4 text-stone-600 font-medium">الصف {s.grade}</td>
                      <td className="px-5 py-4 font-black num-en">${s.totalAmount.toFixed(2)}</td>
                      <td className="px-5 py-4 font-bold text-emerald-600 num-en">${s.totalPaid.toFixed(2)}</td>
                      <td className="px-5 py-4 font-bold text-stone-900 num-en">${s.totalRemaining.toFixed(2)}</td>
                      <td className="px-5 py-4 text-center">
                        <Badge className={`${statusBadge} border-none rounded-lg text-xs font-bold px-2 py-0.5`}>
                          {statusLabel}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => { setSelectedStudentForFee(s); setAddFeeOpen(true); }}
                            className="px-3 py-1.5 text-xs bg-stone-900 text-white rounded-lg font-bold hover:bg-black"
                          >
                            + إضافة رسوم
                          </button>
                          {s.totalRemaining > 0 && (
                            <button
                              onClick={() => { setSelectedStudentForPayment(s); setRecordPaymentOpen(true); }}
                              className="px-3 py-1.5 text-xs border border-stone-200 rounded-lg font-bold hover:bg-stone-50"
                            >
                              تسجيل دفعة
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 3: FEE STRUCTURES */}
      {activeTab === "structures" && (
        <Card className="p-6 border shadow-sm bg-white rounded-3xl space-y-6">
          <div className="flex items-center justify-between border-b border-stone-50 pb-4">
            <h3 className="font-serif font-black text-lg text-stone-900">تسعيرة الرسوم للصفوف والمراحل</h3>
            <button onClick={() => setAddStructureOpen(true)} className={`${btnPrimary} h-10 px-4 text-xs`}>
              <Plus size={14} />
              <span>إضافة تسعيرة جديدة</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-stone-100 rounded-2xl">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-xs font-bold text-stone-500">
                  <th className="px-5 py-4">الصف الدراسي</th>
                  <th className="px-5 py-4">اسم الرسوم</th>
                  <th className="px-5 py-4">المبلغ</th>
                  <th className="px-5 py-4">نوع السداد</th>
                  <th className="px-5 py-4 text-center">الحالة</th>
                  <th className="px-5 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-sm">
                {feeStructures.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-stone-400 font-semibold">
                      لا يوجد تسعيرات مضافة حالياً.
                    </td>
                  </tr>
                ) : feeStructures.map((struct) => (
                  <tr key={struct.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-5 py-4 font-bold text-stone-900">الصف {struct.grade_level}</td>
                    <td className="px-5 py-4 text-stone-700 font-semibold">{struct.fee_name}</td>
                    <td className="px-5 py-4 font-black num-en">${parseFloat(struct.amount).toFixed(2)}</td>
                    <td className="px-5 py-4 text-stone-500 font-bold">
                      {{
                        yearly: "سنوي",
                        termly: "فصلي",
                        monthly: "شهري",
                        custom: "مخصص"
                      }[struct.payment_type] || struct.payment_type}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <Badge className={`${struct.is_active ? "bg-emerald-500/10 text-emerald-600" : "bg-stone-500/10 text-stone-500"} border-none rounded-lg text-xs font-bold px-2 py-0.5`}>
                        {struct.is_active ? "نشط" : "معطل"}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-left">
                      <button
                        onClick={() => toggleStructureStatus.mutate({ id: struct.id, isActive: struct.is_active })}
                        className={`text-xs font-bold hover:underline ${struct.is_active ? "text-rose-600" : "text-emerald-600"}`}
                      >
                        {struct.is_active ? "تعطيل" : "تفعيل"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 4: ACTIVITY FEES */}
      {activeTab === "activities" && (
        <Card className="p-6 border shadow-sm bg-white rounded-3xl space-y-6">
          <div className="flex items-center justify-between border-b border-stone-50 pb-4">
            <h3 className="font-serif font-black text-lg text-stone-900">رسوم الأنشطة الإضافية</h3>
            <button onClick={() => setAddActivityOpen(true)} className={`${btnPrimary} h-10 px-4 text-xs`}>
              <Plus size={14} />
              <span>إنشاء رسوم نشاط</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-stone-100 rounded-2xl">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-xs font-bold text-stone-500">
                  <th className="px-5 py-4">اسم النشاط</th>
                  <th className="px-5 py-4">الوصف</th>
                  <th className="px-5 py-4">الصف المستهدف</th>
                  <th className="px-5 py-4">المبلغ</th>
                  <th className="px-5 py-4">تاريخ الاستحقاق</th>
                  <th className="px-5 py-4 text-center">نوع الالتحاق</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-sm">
                {activityFees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-stone-400 font-semibold">
                      لا يوجد أنشطة معلنة حالياً.
                    </td>
                  </tr>
                ) : activityFees.map((act) => (
                  <tr key={act.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-5 py-4 font-bold text-stone-900">{act.activity_name}</td>
                    <td className="px-5 py-4 text-stone-600 max-w-xs truncate">{act.description || "—"}</td>
                    <td className="px-5 py-4 text-stone-500 font-bold">{act.grade_level ? `الصف ${act.grade_level}` : "كل الصفوف"}</td>
                    <td className="px-5 py-4 font-black num-en">${parseFloat(act.amount).toFixed(2)}</td>
                    <td className="px-5 py-4 text-stone-500 font-bold num-en">{act.due_date}</td>
                    <td className="px-5 py-4 text-center">
                      <Badge className={`${act.is_mandatory ? "bg-rose-500/10 text-rose-600" : "bg-blue-500/10 text-blue-600"} border-none rounded-lg text-xs font-bold px-2 py-0.5`}>
                        {act.is_mandatory ? "إلزامي" : "اختياري"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* DIALOG: ADD FEE */}
      <Dialog open={addFeeOpen} onOpenChange={setAddFeeOpen}>
        <DialogContent className="max-w-md p-6 text-right rounded-3xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-serif font-black text-xl text-stone-900 text-right">إضافة التزام مالي جديد</DialogTitle>
            <DialogDescription className="text-right">قم بتخصيص رسوم دراسية للطالب ({selectedStudentForFee?.full_name})</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddFeeSubmit} className="space-y-4 mt-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-stone-500">اختر تسعيرة الصف جاهزة</Label>
              <select
                value={selectedStructureId}
                onChange={e => {
                  setSelectedStructureId(e.target.value);
                  if (e.target.value) {
                    const struct = feeStructures.find(s => s.id === parseInt(e.target.value));
                    if (struct) {
                      setManualFeeName(struct.fee_name);
                      setManualFeeAmount(struct.amount.toString());
                    }
                  } else {
                    setManualFeeName("");
                    setManualFeeAmount("");
                  }
                }}
                className="w-full h-11 px-3 border border-stone-200 rounded-xl text-sm font-semibold focus:outline-none bg-white"
              >
                <option value="">-- إدخال يدوي مخصص --</option>
                {feeStructures.filter(s => s.is_active && (s.grade_level === selectedStudentForFee?.grade || s.grade_level === "all")).map(s => (
                  <option key={s.id} value={s.id}>{s.fee_name} (${parseFloat(s.amount).toFixed(2)})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-stone-500">اسم الرسوم *</Label>
              <Input
                value={manualFeeName}
                onChange={e => setManualFeeName(e.target.value)}
                placeholder="مثال: رسوم الفصل الأول"
                required
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-stone-500">المبلغ المستحق ($) *</Label>
              <Input
                type="number"
                value={manualFeeAmount}
                onChange={e => setManualFeeAmount(e.target.value)}
                placeholder="1000"
                required
                className="h-11 rounded-xl num-en"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-stone-500">تاريخ الاستحقاق *</Label>
              <Input
                type="date"
                value={feeDueDate}
                onChange={e => setFeeDueDate(e.target.value)}
                required
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-stone-500">خطة السداد</Label>
              <select
                value={feePaymentPlan}
                onChange={e => setFeePaymentPlan(e.target.value)}
                className="w-full h-11 px-3 border border-stone-200 rounded-xl text-sm font-semibold focus:outline-none bg-white"
              >
                <option value="full">دفعة كاملة</option>
                <option value="installment">أقساط</option>
                <option value="custom">مخصص</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-stone-500">ملاحظات</Label>
              <textarea
                value={feeNotes}
                onChange={e => setFeeNotes(e.target.value)}
                className="w-full p-3 border border-stone-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="ملاحظات توضيحية حول القسط أو الخطة..."
                rows={2}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAddFeeOpen(false)}
                className="flex-1 h-11 rounded-xl border-2 border-stone-200 bg-white text-stone-850 text-sm font-semibold hover:bg-stone-50"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={createFeeMutation.isPending}
                className="flex-1 h-11 rounded-xl bg-stone-900 text-white text-sm font-semibold hover:bg-black shadow-md disabled:opacity-50"
              >
                {createFeeMutation.isPending ? "جاري الإضافة..." : "تأكيد الإضافة"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: RECORD MANUAL PAYMENT */}
      <Dialog open={recordPaymentOpen} onOpenChange={setRecordPaymentOpen}>
        <DialogContent className="max-w-md p-6 text-right rounded-3xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-serif font-black text-xl text-stone-900 text-right">تسجيل دفعة يدوية</DialogTitle>
            <DialogDescription className="text-right">تسجيل استلام مبلغ كاش أو تحويل بنكي للطالب ({selectedStudentForPayment?.full_name})</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRecordPaymentSubmit} className="space-y-4 mt-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-stone-500">اختر الرسوم/الالتزام المراد سداده *</Label>
              <select
                value={selectedStudentFeeId}
                onChange={e => {
                  setSelectedStudentFeeId(e.target.value);
                  const fee = studentFees.find(f => f.id === parseInt(e.target.value));
                  if (fee) {
                    setPaymentAmount(fee.remaining.toString());
                  } else {
                    setPaymentAmount("");
                  }
                }}
                required
                className="w-full h-11 px-3 border border-stone-200 rounded-xl text-sm font-semibold focus:outline-none bg-white"
              >
                <option value="">-- حدد قسط مستحق --</option>
                {studentFees.filter(f => f.student_id === selectedStudentForPayment?.id && (f.status === "pending" || f.status === "partial")).map(f => (
                  <option key={f.id} value={f.id}>{f.fee_name} (المتبقي: ${parseFloat(f.remaining).toFixed(2)})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-stone-500">المبلغ المحصّل ($) *</Label>
              <Input
                type="number"
                value={paymentAmount}
                onChange={e => setPaymentAmount(e.target.value)}
                placeholder="500"
                required
                className="h-11 rounded-xl num-en"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-stone-500">طريقة التحصيل *</Label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                className="w-full h-11 px-3 border border-stone-200 rounded-xl text-sm font-semibold focus:outline-none bg-white"
              >
                <option value="cash">نقداً (كاش)</option>
                <option value="bank_transfer">تحويل بنكي</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-stone-500">ملاحظات وتفاصيل المعاملة</Label>
              <textarea
                value={paymentNotes}
                onChange={e => setPaymentNotes(e.target.value)}
                className="w-full p-3 border border-stone-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="رقم التحويل، أو اسم مودع المبلغ..."
                rows={2}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRecordPaymentOpen(false)}
                className="flex-1 h-11 rounded-xl border-2 border-stone-200 bg-white text-stone-850 text-sm font-semibold hover:bg-stone-50"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={recordPaymentMutation.isPending}
                className="flex-1 h-11 rounded-xl bg-stone-900 text-white text-sm font-semibold hover:bg-black shadow-md disabled:opacity-50"
              >
                {recordPaymentMutation.isPending ? "جاري التسجيل..." : "تسجيل الدفعة"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: ADD STRUCTURE */}
      <Dialog open={addStructureOpen} onOpenChange={setAddStructureOpen}>
        <DialogContent className="max-w-md p-6 text-right rounded-3xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-serif font-black text-xl text-stone-900 text-right">إضافة تسعيرة جديدة</DialogTitle>
            <DialogDescription className="text-right">تحديد قيم الرسوم لصفوف دراسية محددة</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddStructureSubmit} className="space-y-4 mt-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-stone-500">الصف المستهدف *</Label>
              <select
                value={structGradeLevel}
                onChange={e => setStructGradeLevel(e.target.value)}
                required
                className="w-full h-11 px-3 border border-stone-200 rounded-xl text-sm font-semibold focus:outline-none bg-white"
              >
                <option value="">-- اختر الصف --</option>
                <option value="all">كل الصفوف</option>
                <option value="1">الصف الأول</option>
                <option value="2">الصف الثاني</option>
                <option value="3">الصف الثالث</option>
                <option value="4">الصف الرابع</option>
                <option value="5">الصف الخامس</option>
                <option value="6">الصف السادس</option>
                <option value="7">الصف السابع</option>
                <option value="8">الصف الثامن</option>
                <option value="9">الصف التاسع</option>
                <option value="10">الصف العاشر</option>
                <option value="11">الصف الحادي عشر</option>
                <option value="12">الصف الثاني عشر</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-stone-500">اسم الرسوم *</Label>
              <Input
                value={structFeeName}
                onChange={e => setStructFeeName(e.target.value)}
                placeholder="مثال: رسوم الدراسة السنوية"
                required
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-stone-500">القيمة ($) *</Label>
              <Input
                type="number"
                value={structAmount}
                onChange={e => setStructAmount(e.target.value)}
                placeholder="3000"
                required
                className="h-11 rounded-xl num-en"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-stone-500">دورية السداد *</Label>
              <select
                value={structPaymentType}
                onChange={e => setStructPaymentType(e.target.value)}
                className="w-full h-11 px-3 border border-stone-200 rounded-xl text-sm font-semibold focus:outline-none bg-white"
              >
                <option value="yearly">دفعة سنوية</option>
                <option value="termly">دفعة فصيلة</option>
                <option value="monthly">قسط شهري</option>
                <option value="custom">مخصص</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAddStructureOpen(false)}
                className="flex-1 h-11 rounded-xl border-2 border-stone-200 bg-white text-stone-850 text-sm font-semibold hover:bg-stone-50"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={createStructureMutation.isPending}
                className="flex-1 h-11 rounded-xl bg-stone-900 text-white text-sm font-semibold hover:bg-black shadow-md disabled:opacity-50"
              >
                {createStructureMutation.isPending ? "جاري الإضافة..." : "حفظ التسعيرة"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: ADD ACTIVITY */}
      <Dialog open={addActivityOpen} onOpenChange={setAddActivityOpen}>
        <DialogContent className="max-w-md p-6 text-right rounded-3xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-serif font-black text-xl text-stone-900 text-right">إنشاء رسوم نشاط جديد</DialogTitle>
            <DialogDescription className="text-right">إضافة نشاط مثل الرحلات، الأندية المدرسية، والمخيمات الصيفية</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddActivitySubmit} className="space-y-4 mt-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-stone-500">اسم النشاط *</Label>
              <Input
                value={actName}
                onChange={e => setActName(e.target.value)}
                placeholder="مثال: الرحلة الميدانية العلمية"
                required
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-stone-500">الوصف</Label>
              <textarea
                value={actDescription}
                onChange={e => setActDescription(e.target.value)}
                className="w-full p-3 border border-stone-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="تفاصيل حول موعد ومكان النشاط والخدمات المشمولة..."
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-stone-500">المبلغ ($) *</Label>
              <Input
                type="number"
                value={actAmount}
                onChange={e => setActAmount(e.target.value)}
                placeholder="50"
                required
                className="h-11 rounded-xl num-en"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-stone-500">تاريخ الاستحقاق *</Label>
              <Input
                type="date"
                value={actDueDate}
                onChange={e => setActDueDate(e.target.value)}
                required
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-stone-500">الصف المستهدف (اختياري)</Label>
              <select
                value={actGradeLevel}
                onChange={e => setActGradeLevel(e.target.value)}
                className="w-full h-11 px-3 border border-stone-200 rounded-xl text-sm font-semibold focus:outline-none bg-white"
              >
                <option value="">كل المدرسة</option>
                <option value="1">الصف الأول</option>
                <option value="2">الصف الثاني</option>
                <option value="3">الصف الثالث</option>
                <option value="4">الصف الرابع</option>
                <option value="5">الصف الخامس</option>
                <option value="6">الصف السادس</option>
                <option value="7">الصف السابع</option>
                <option value="8">الصف الثامن</option>
                <option value="9">الصف التاسع</option>
                <option value="10">الصف العاشر</option>
                <option value="11">الصف الحادي عشر</option>
                <option value="12">الصف الثاني عشر</option>
              </select>
            </div>

            <div className="flex items-center gap-2 py-1 select-none">
              <input
                type="checkbox"
                id="isMandatory"
                checked={actIsMandatory}
                onChange={e => setActIsMandatory(e.target.checked)}
                className="h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900"
              />
              <Label htmlFor="isMandatory" className="text-xs font-bold text-stone-700 cursor-pointer">نشاط إلزامي لجميع طلاب الصف</Label>
            </div>

            {actGradeLevel && (
              <div className="flex items-center gap-2 py-1 select-none border-t border-stone-100 pt-3">
                <input
                  type="checkbox"
                  id="autoAssign"
                  checked={autoAssignActivity}
                  onChange={e => setAutoAssignActivity(e.target.checked)}
                  className="h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                />
                <Label htmlFor="autoAssign" className="text-xs font-bold text-stone-700 cursor-pointer">
                  تخصيص الرسوم تلقائياً لجميع طلاب الصف ({students.filter(s => s.grade === actGradeLevel).length} طالب)
                </Label>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAddActivityOpen(false)}
                className="flex-1 h-11 rounded-xl border-2 border-stone-200 bg-white text-stone-850 text-sm font-semibold hover:bg-stone-50"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={createActivityMutation.isPending}
                className="flex-1 h-11 rounded-xl bg-stone-900 text-white text-sm font-semibold hover:bg-black shadow-md disabled:opacity-50"
              >
                {createActivityMutation.isPending ? "جاري الإنشاء..." : "إنشاء النشاط"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
