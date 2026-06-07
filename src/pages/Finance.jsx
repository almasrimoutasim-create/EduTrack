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
  Info,
  Download,
  BookOpen,
  Wallet,
  Receipt,
  FileSpreadsheet,
  FileText,
  Trash,
  Scale,
  Coffee,
  X
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

// Import Shared Finance Dialogs
import FinanceReportDialog from "@/components/shared/FinanceReportDialog";
import FinancialRecordFormDialog from "@/components/shared/FinancialRecordFormDialog";

const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all border-2 border-stone-300 bg-white text-stone-850 hover:bg-stone-50 hover:border-stone-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const btnPrimary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-stone-900 text-white hover:bg-black cursor-pointer shadow-lg shadow-stone-200 disabled:opacity-50 disabled:cursor-not-allowed";

export default function Finance() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isRTL = true; // Forcing RTL Arabic styling as requested

  const [activeTab, setActiveTab] = useState("revenue"); // "revenue" | "tuition" | "wallets" | "store_purchases" | "fines" | "structures" | "activities" | "general_records"
  const [searchTerm, setSearchTerm] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Dialog states
  const [reportOpen, setReportOpen] = useState(false);
  const [recordFormOpen, setRecordFormOpen] = useState(false);
  const [selectedRecordForEdit, setSelectedRecordForEdit] = useState(null);

  const [addFeeOpen, setAddFeeOpen] = useState(false);
  const [selectedStudentForFee, setSelectedStudentForFee] = useState(null);

  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
  const [selectedStudentForPayment, setSelectedStudentForPayment] = useState(null);

  const [addStructureOpen, setAddStructureOpen] = useState(false);
  const [addActivityOpen, setAddActivityOpen] = useState(false);

  // New Wallet Topup states
  const [topupOpen, setTopupOpen] = useState(false);
  const [selectedStudentForTopup, setSelectedStudentForTopup] = useState(null);
  const [topupAmount, setTopupAmount] = useState("");
  const [topupMethod, setTopupMethod] = useState("cash");
  const [topupNotes, setTopupNotes] = useState("");

  // New Fine states
  const [addFineOpen, setAddFineOpen] = useState(false);
  const [selectedStudentForFine, setSelectedStudentForFine] = useState(null);
  const [fineCategory, setFineCategory] = useState("library");
  const [fineReason, setFineReason] = useState("");
  const [fineAmount, setFineAmount] = useState("");
  const [fineNotes, setFineNotes] = useState("");

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
    queryFn: () => base44.entities.Student.list(null, 500),
    staleTime: 1000 * 60 * 5
  });

  const { data: studentFees = [], isLoading: loadingStudentFees } = useQuery({
    queryKey: ["student-fees-all"],
    queryFn: () => base44.entities.StudentFee.list(null, 500),
    staleTime: 1000 * 60 * 3
  });

  const { data: feePayments = [] } = useQuery({
    queryKey: ["fee-payments-all"],
    queryFn: () => base44.entities.FeePayment.list(null, 500),
    staleTime: 1000 * 60 * 3
  });

  const { data: walletTransactions = [] } = useQuery({
    queryKey: ["wallet-transactions-all"],
    queryFn: () => base44.entities.WalletTransaction.list(null, 500),
    staleTime: 1000 * 60 * 3
  });

  const { data: feeStructures = [] } = useQuery({
    queryKey: ["fee-structures"],
    queryFn: () => base44.entities.FeeStructure.list(null, 100),
    staleTime: 1000 * 60 * 10
  });

  const { data: activityFees = [] } = useQuery({
    queryKey: ["activity-fees"],
    queryFn: () => base44.entities.ActivityFee.list(null, 100),
    staleTime: 1000 * 60 * 5
  });

  const { data: wallets = [] } = useQuery({
    queryKey: ["student-wallets"],
    queryFn: () => base44.entities.StudentWallet.list(null, 500),
    staleTime: 1000 * 60 * 5
  });

  const { data: storePurchases = [] } = useQuery({
    queryKey: ["store-purchases-all"],
    queryFn: () => base44.entities.Purchase.list(null, 500),
    staleTime: 1000 * 60 * 3
  });

  const { data: fines = [] } = useQuery({
    queryKey: ["student-fines"],
    queryFn: () => base44.entities.Fine.list(null, 500),
    staleTime: 1000 * 60 * 3
  });

  const { data: financialRecords = [] } = useQuery({
    queryKey: ["financial-records"],
    queryFn: () => base44.entities.FinancialRecord.list(null, 500),
    staleTime: 1000 * 60 * 3
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
      const res = await base44.entities.FeePayment.create(data);
      const student = students.find(s => s.id === data.student_id);
      const fee = studentFees.find(f => f.id === data.student_fee_id);
      await base44.entities.FinancialRecord.create({
        record_type: "tuition",
        recipient_type: "student",
        recipient_name: student?.full_name || "طالب",
        recipient_id: data.student_id,
        amount: data.amount,
        description: `سداد رسوم دراسية: ${fee?.fee_name || ""}`,
        payment_date: new Date().toISOString().split("T")[0],
        status: "paid",
        payment_method: data.payment_method,
        type: "income",
        notes: data.notes
      });
      return res;
    },
    onSuccess: () => {
      toast.success("تم تسجيل الدفعة بنجاح وتحديث الالتزام تلقائياً");
      qc.invalidateQueries({ queryKey: ["student-fees-all"] });
      qc.invalidateQueries({ queryKey: ["fee-payments-all"] });
      qc.invalidateQueries({ queryKey: ["financial-records"] });
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
    /** @param {any} data */
    mutationFn: async (data) => {
      return base44.entities.FeeStructure.update(data.id, { is_active: !data.isActive });
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
        created_by: user?.id || 1
      });

      if (data.autoAssign && data.grade_level) {
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

  const topupWalletMutation = useMutation({
    /** @param {any} data */
    mutationFn: async (data) => {
      const wallet = wallets.find(w => w.student_id === data.studentId);
      const currentBalance = wallet ? parseFloat(wallet.balance || 0) : 0;
      const newBalance = currentBalance + data.amount;

      if (wallet) {
        await base44.entities.StudentWallet.update(wallet.id, { balance: newBalance });
      } else {
        await base44.entities.StudentWallet.create({
          student_id: data.studentId,
          balance: newBalance
        });
      }

      await base44.entities.WalletTransaction.create({
        student_id: data.studentId,
        type: "topup",
        amount: data.amount,
        balance_after: newBalance,
        description: data.notes || "شحن رصيد يدوياً من الإدارة المالية",
        payment_method: data.method,
        created_by: user?.id || 1
      });

      await base44.entities.FinancialRecord.create({
        record_type: "income",
        recipient_type: "student",
        recipient_name: students.find(s => s.id === data.studentId)?.full_name || "طالب",
        recipient_id: data.studentId,
        amount: data.amount,
        description: `شحن محفظة الطالب: ${data.notes || "شحن يدوي كاش"}`,
        payment_date: new Date().toISOString().split("T")[0],
        status: "paid",
        payment_method: data.method,
        type: "income"
      });
    },
    onSuccess: () => {
      toast.success("تم شحن المحفظة وتسجيل القيد بنجاح");
      qc.invalidateQueries({ queryKey: ["student-wallets"] });
      qc.invalidateQueries({ queryKey: ["wallet-transactions-all"] });
      qc.invalidateQueries({ queryKey: ["financial-records"] });
      setTopupOpen(false);
      setTopupAmount("");
      setTopupNotes("");
    },
    onError: (err) => {
      console.error(err);
      toast.error("فشل عملية شحن المحفظة");
    }
  });

  const createFineMutation = useMutation({
    /** @param {any} data */
    mutationFn: async (data) => {
      return base44.entities.Fine.create({
        student_id: data.student_id,
        category: data.category,
        reason: data.reason,
        amount: parseFloat(data.amount),
        issued_by: data.issued_by || "المحاسب المالي",
        date: new Date().toISOString().split("T")[0],
        status: "pending",
        notes: data.notes
      });
    },
    onSuccess: () => {
      toast.success("تم فرض الغرامة بنجاح");
      qc.invalidateQueries({ queryKey: ["student-fines"] });
      setAddFineOpen(false);
      setFineReason("");
      setFineAmount("");
      setFineNotes("");
    },
    onError: (err) => {
      console.error(err);
      toast.error("فشل فرض الغرامة");
    }
  });

  const payFineMutation = useMutation({
    /** @param {any} data */
    mutationFn: async (data) => {
      if (data.action === "pay") {
        await base44.entities.Fine.update(data.fineId, { status: "paid" });
        const fine = fines.find(f => f.id === data.fineId);
        const student = students.find(s => s.id === fine?.student_id);
        await base44.entities.FinancialRecord.create({
          record_type: "fine_payment",
          recipient_type: "student",
          recipient_name: student?.full_name || "طالب",
          recipient_id: fine?.student_id || "",
          amount: parseFloat(fine?.amount || 0),
          description: `سداد غرامة: ${fine?.reason || ""}`,
          payment_date: new Date().toISOString().split("T")[0],
          status: "paid",
          payment_method: "cash",
          type: "income"
        });
      } else {
        await base44.entities.Fine.update(data.fineId, { status: "waived" });
      }
    },
    onSuccess: () => {
      toast.success("تم تحديث حالة الغرامة بنجاح");
      qc.invalidateQueries({ queryKey: ["student-fines"] });
      qc.invalidateQueries({ queryKey: ["financial-records"] });
    },
    onError: (err) => {
      console.error(err);
      toast.error("فشل تحديث الغرامة");
    }
  });

  const deleteRecordMutation = useMutation({
    /** @param {string} id */
    mutationFn: async (id) => base44.entities.FinancialRecord.delete(id),
    onSuccess: () => {
      toast.success("تم حذف القيد المالي بنجاح");
      qc.invalidateQueries({ queryKey: ["financial-records"] });
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

  // REAL INTEGRATED FINANCIAL CALCULATIONS FOR ACCOUNTANT DASHBOARD
  const totalTuitionFeesCollected = feePayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  const totalWalletTopups = walletTransactions
    .filter(t => t.type === "topup")
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
  const totalStoreSales = storePurchases.reduce((sum, p) => sum + parseFloat(p.total_price || p.total_amount || 0), 0);
  
  // Expenses sum from general ledger records (excluding cancellations)
  const totalExpenses = financialRecords
    .filter(r => r.type === "expense" && r.status !== "cancelled")
    .reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);

  // General administrative incomes (excluding tuition payments & topups to avoid double-counting)
  const otherGeneralIncomes = financialRecords
    .filter(r => r.type === "income" && r.status !== "cancelled" && r.record_type !== "tuition" && r.record_type !== "fine_payment" && !r.description?.includes("شحن محفظة"))
    .reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);

  // Total Inflows = Tuition Collected + Wallet Topups + General Incomes
  const totalCollected = totalTuitionFeesCollected + totalWalletTopups + otherGeneralIncomes;
  
  // Net cash flow
  const netProfit = totalCollected - totalExpenses;

  // Pending fees
  const totalPending = studentFees
    .filter(f => f.status === "pending" || f.status === "partial")
    .reduce((sum, f) => sum + parseFloat(f.remaining || 0), 0);

  // Overdue unique students count
  const overdueCount = studentFees.filter(f => f.status === "overdue").length;

  // Real Inflows vs Outflows Recharts BarChart Data formatting (last 6 months)
  const monthlyData = React.useMemo(() => {
    const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    const now = new Date();
    const result = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mIndex = d.getMonth();
      const mName = months[mIndex];

      // Sum Tuition Inflows in this month
      const tuitionSum = feePayments
        .filter(p => {
          const pd = new Date(p.created_at || p.payment_date);
          return pd.getFullYear() === d.getFullYear() && pd.getMonth() === d.getMonth();
        })
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

      // Sum Wallet Topups Inflows in this month
      const walletSum = walletTransactions
        .filter(t => {
          const td = new Date(t.created_at);
          return t.type === "topup" && td.getFullYear() === d.getFullYear() && td.getMonth() === d.getMonth();
        })
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

      // Sum General Inflows
      const generalInflow = financialRecords
        .filter(r => {
          const rd = new Date(r.payment_date || r.created_at);
          return r.type === "income" && r.status !== "cancelled" && r.record_type !== "tuition" && !r.description?.includes("شحن محفظة") && rd.getFullYear() === d.getFullYear() && rd.getMonth() === d.getMonth();
        })
        .reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);

      // Sum Outflows/Expenses in this month
      const outflowSum = financialRecords
        .filter(r => {
          const rd = new Date(r.payment_date || r.created_at);
          return r.type === "expense" && r.status !== "cancelled" && rd.getFullYear() === d.getFullYear() && rd.getMonth() === d.getMonth();
        })
        .reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);

      result.push({
        name: mName,
        "إيرادات وتدفقات داخلة": tuitionSum + walletSum + generalInflow,
        "مصروفات وتدفقات خارجة": outflowSum,
      });
    }
    return result;
  }, [feePayments, walletTransactions, financialRecords]);

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
      created_by: user?.id || 1
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
      paid_by: user?.id || 1,
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
    return students.map((/** @type {any} */ student) => {
      const fees = studentFees.filter(f => f.student_id === student.id);
      const totalAmount = fees.reduce((sum, f) => sum + parseFloat(f.amount || 0), 0);
      const totalPaidForStudent = fees.reduce((sum, f) => sum + parseFloat(f.amount_paid || 0), 0);
      const totalRemaining = totalAmount - totalPaidForStudent;

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
    const matchesSearch = s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || s.student_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = gradeFilter === "all" || s.grade === gradeFilter;
    const matchesStatus = statusFilter === "all" || s.financeStatus === statusFilter;
    return matchesSearch && matchesGrade && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-20 text-right" dir="rtl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-stone-100 pb-4">
        <PageHeader 
          title="بوابة الشؤون المالية والحسابات" 
          subtitle="تسيير الرسوم، شحن المحافظ الذكية، وإدارة المصاريف والغرامات"
        />
        <button
          onClick={() => setReportOpen(true)}
          className={`${btnPrimary} h-11 px-5 flex items-center gap-2`}
        >
          <Download size={16} />
          <span>تصدير تقرير مالي شامل</span>
        </button>
      </div>

      {/* Tabs navigation */}
      <div className="flex flex-wrap border border-stone-200 bg-stone-100/80 p-1.5 rounded-2xl gap-2 w-fit">
        {[
          { id: "revenue", label: "لوحة الإيرادات" },
          { id: "tuition", label: "الرسوم الدراسية" },
          { id: "wallets", label: "محافظ الطلاب" },
          { id: "store_purchases", label: "مبيعات المقصف" },
          { id: "fines", label: "الغرامات" },
          { id: "general_records", label: "المصاريف والرواتب" },
          { id: "structures", label: "تسعيرة الصفوف" },
          { id: "activities", label: "رسوم الأنشطة" },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => { setActiveTab(t.id); setSearchTerm(""); }}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === t.id ? "bg-white text-stone-900 shadow-sm font-extrabold" : "text-stone-500 hover:text-stone-900"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: REVENUE DASHBOARD */}
      {activeTab === "revenue" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: "إجمالي الإيرادات المحصلة", value: `$${totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "إجمالي المصروفات", value: `$${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: ArrowDownRight, color: "text-rose-600", bg: "bg-rose-50" },
              { label: "صافي التدفق المالي", value: `$${netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: TrendingUp, color: netProfit >= 0 ? "text-teal-600" : "text-rose-600", bg: netProfit >= 0 ? "bg-teal-50" : "bg-rose-50" },
              { label: "الرسوم المعلقة", value: `$${totalPending.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
              { label: "مبيعات المتجر", value: `$${totalStoreSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "الطلاب المتأخرون", value: overdueCount, icon: AlertCircle, color: "text-rose-650", bg: "bg-rose-50/70" },
            ].map((stat, i) => (
              <Card key={i} className="p-4 border shadow-sm rounded-2xl bg-white relative overflow-hidden flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2">
                  <div className={`h-9 w-9 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
                    <stat.icon size={18} />
                  </div>
                </div>
                <div>
                  <p className="text-stone-400 text-[10px] font-bold mb-0.5 leading-relaxed">{stat.label}</p>
                  <h4 className="text-lg font-black text-stone-900 num-en truncate">{stat.value}</h4>
                </div>
              </Card>
            ))}
          </div>

          <Card className="p-6 border shadow-sm bg-white rounded-3xl">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="font-serif font-black text-lg text-stone-900">حركة التدفق المالي الشهري (Inflows vs Outflows)</CardTitle>
              <CardDescription>مقارنة إجمالي المقبوضات (الرسوم ومحفظة الطالب والإيرادات) مقابل المصروفات التشغيلية والرواتب</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px] p-0" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#78716c" }} />
                  <YAxis tick={{ fontSize: 12, fill: "#78716c" }} />
                  <Tooltip formatter={(value) => `$${value}`} />
                  <Legend />
                  <Bar dataKey="إيرادات وتدفقات داخلة" fill="#059669" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="مصروفات وتدفقات خارجة" fill="#e11d48" radius={[4, 4, 0, 0]} />
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
                {Array.from(new Set(students.map((/** @type {any} */ s) => s.grade))).filter(Boolean).map(g => (
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

      {/* TAB 3: STUDENT WALLETS */}
      {activeTab === "wallets" && (
        <Card className="p-6 border shadow-sm bg-white rounded-3xl space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
              <Input 
                placeholder="بحث باسم الطالب..." 
                className="pr-10 h-11 rounded-xl bg-stone-50 border-stone-200"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-stone-100 rounded-2xl">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-xs font-bold text-stone-500">
                  <th className="px-5 py-4">الطالب</th>
                  <th className="px-5 py-4">الصف</th>
                  <th className="px-5 py-4">الرقم التعريفي</th>
                  <th className="px-5 py-4">الرصيد المتاح</th>
                  <th className="px-5 py-4">آخر حركة مالية</th>
                  <th className="px-5 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-sm">
                {students
                  .filter(st => st.full_name?.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(st => {
                    const wallet = wallets.find(w => w.student_id === st.id);
                    const bal = wallet ? parseFloat(wallet.balance || 0) : 0;
                    const studentTxs = walletTransactions.filter(t => t.student_id === st.id);
                    const lastTx = studentTxs[studentTxs.length - 1];

                    return (
                      <tr key={st.id} className="hover:bg-stone-50/50 transition-colors">
                        <td className="px-5 py-4 font-bold text-stone-900">{st.full_name}</td>
                        <td className="px-5 py-4 text-stone-600">الصف {st.grade || "—"}</td>
                        <td className="px-5 py-4 num-en text-stone-500">#{st.student_id}</td>
                        <td className="px-5 py-4 font-black text-emerald-600 num-en">${bal.toFixed(2)}</td>
                        <td className="px-5 py-4 text-xs text-stone-455">
                          {lastTx ? (
                            <span>
                              {lastTx.type === "topup" ? "شحن" : "شراء"}: ${parseFloat(lastTx.amount).toFixed(2)}
                            </span>
                          ) : "لا يوجد حركات"}
                        </td>
                        <td className="px-5 py-4 text-left">
                          <button
                            onClick={() => { setSelectedStudentForTopup(st); setTopupOpen(true); }}
                            className="px-3 py-1.5 text-xs bg-stone-900 hover:bg-black text-white rounded-lg font-bold"
                          >
                            شحن المحفظة
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 4: CANTEEN & STORE SALES */}
      {activeTab === "store_purchases" && (
        <Card className="p-6 border shadow-sm bg-white rounded-3xl space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <h3 className="font-serif font-black text-lg text-stone-900">سجل مبيعات المتجر والمقصف المدرسي</h3>
            <div className="relative w-full sm:w-64">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
              <Input 
                placeholder="بحث باسم الطالب أو السلعة..." 
                className="pr-10 h-11 rounded-xl bg-stone-50 border-stone-200"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-stone-100 rounded-2xl">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-xs font-bold text-stone-500">
                  <th className="px-5 py-4">اسم الطالب</th>
                  <th className="px-5 py-4">اسم السلعة</th>
                  <th className="px-5 py-4">الكمية</th>
                  <th className="px-5 py-4">القيمة الإجمالية</th>
                  <th className="px-5 py-4">طريقة الدفع</th>
                  <th className="px-5 py-4">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-sm">
                {storePurchases
                  .filter(p => p.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.item_name?.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(p => (
                    <tr key={p.id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="px-5 py-4 font-bold text-stone-900">{p.student_name}</td>
                      <td className="px-5 py-4 text-stone-700">{p.item_name}</td>
                      <td className="px-5 py-4 num-en">{p.quantity}</td>
                      <td className="px-5 py-4 font-black num-en">${parseFloat(p.total_price || 0).toFixed(2)}</td>
                      <td className="px-5 py-4">
                        <Badge className="bg-stone-100 text-stone-600 border-none rounded-lg text-xs font-semibold px-2 py-0.5">
                          {p.payment_method === "card" ? "المحفظة الذكية" : "بطاقة ائتمان"}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-stone-500 num-en text-xs">
                        {p.created_at ? new Date(p.created_at).toLocaleString("ar-EG") : "—"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 5: STUDENT FINES */}
      {activeTab === "fines" && (
        <Card className="p-6 border shadow-sm bg-white rounded-3xl space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-b border-stone-50 pb-4">
            <div>
              <h3 className="font-serif font-black text-lg text-stone-900">إدارة الغرامات والمستحقات المدرسية</h3>
              <p className="text-stone-400 text-xs mt-1">غرامات الكتب المتأخرة، السلوك، والنقل المدرسي</p>
            </div>
            <div className="flex gap-2">
              <select
                onChange={e => {
                  const student = students.find(s => s.id === e.target.value);
                  if (student) {
                    setSelectedStudentForFine(student);
                    setAddFineOpen(true);
                  }
                }}
                className="bg-stone-900 text-white rounded-xl h-11 px-4 text-xs font-bold focus:outline-none cursor-pointer"
                value=""
              >
                <option value="" disabled>+ فرض غرامة جديدة لطالب</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.full_name} (الصف {s.grade})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto border border-stone-100 rounded-2xl">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-xs font-bold text-stone-500">
                  <th className="px-5 py-4">الطالب</th>
                  <th className="px-5 py-4">فئة الغرامة</th>
                  <th className="px-5 py-4">السبب / البيان</th>
                  <th className="px-5 py-4">المبلغ</th>
                  <th className="px-5 py-4">التاريخ</th>
                  <th className="px-5 py-4 text-center">الحالة</th>
                  <th className="px-5 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-sm">
                {fines.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-stone-400 font-semibold">
                      لا يوجد غرامات مسجلة حالياً.
                    </td>
                  </tr>
                ) : fines.map(f => {
                  const student = students.find(s => s.id === f.student_id);
                  const isPending = f.status === "pending";

                  return (
                    <tr key={f.id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <span className="font-bold text-stone-900">{student?.full_name || "طالب"}</span>
                        <p className="text-[10px] text-stone-400 num-en">ID: {f.student_id}</p>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant="outline" className="text-xs font-semibold rounded-lg">
                          {{
                            library: "المكتبة",
                            discipline: "انضباط وسلوك",
                            transport: "النقل المدرسي",
                            general: "عام"
                          }[f.category] || f.category}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-stone-700">{f.reason}</td>
                      <td className="px-5 py-4 font-black num-en">${parseFloat(f.amount || 0).toFixed(2)}</td>
                      <td className="px-5 py-4 text-stone-500 num-en text-xs">{f.date}</td>
                      <td className="px-5 py-4 text-center">
                        <Badge className={`${
                          f.status === "paid" ? "bg-emerald-500/10 text-emerald-600" :
                          f.status === "waived" ? "bg-blue-500/10 text-blue-600" : "bg-rose-500/10 text-rose-600 animate-pulse"
                        } border-none rounded-lg text-xs font-bold px-2 py-0.5`}>
                          {f.status === "paid" ? "مدفوعة" : f.status === "waived" ? "تم الإسقاط" : "مستحقة"}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-left">
                        {isPending && (
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => payFineMutation.mutate({ fineId: f.id, action: "pay" })}
                              className="px-2 py-1 text-xs bg-emerald-600 text-white rounded font-bold hover:bg-emerald-700"
                            >
                              تسجيل سداد
                            </button>
                            <button
                              onClick={() => payFineMutation.mutate({ fineId: f.id, action: "waive" })}
                              className="px-2 py-1 text-xs bg-stone-100 text-stone-700 border rounded font-bold hover:bg-stone-200"
                            >
                              إسقاط
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 6: GENERAL FINANCIAL RECORDS (EXPENSES & SALARIES) */}
      {activeTab === "general_records" && (
        <Card className="p-6 border shadow-sm bg-white rounded-3xl space-y-6">
          <div className="flex items-center justify-between border-b border-stone-50 pb-4">
            <div>
              <h3 className="font-serif font-black text-lg text-stone-900">الحسابات العامة والمصاريف والرواتب</h3>
              <p className="text-stone-400 text-xs mt-1">كشف كامل بالمصروفات التشغيلية، الإيرادات العامة، والرواتب</p>
            </div>
            <button
              onClick={() => { setSelectedRecordForEdit(null); setRecordFormOpen(true); }}
              className={`${btnPrimary} h-10 px-4 text-xs`}
            >
              <Plus size={14} />
              <span>إضافة قيد مالي جديد</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-stone-100 rounded-2xl">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-xs font-bold text-stone-500">
                  <th className="px-5 py-4">نوع البند</th>
                  <th className="px-5 py-4">الطرف / المستفيد</th>
                  <th className="px-5 py-4">البيان والتفاصيل</th>
                  <th className="px-5 py-4">المبلغ</th>
                  <th className="px-5 py-4">طريقة الدفع</th>
                  <th className="px-5 py-4">تاريخ المعاملة</th>
                  <th className="px-5 py-4 text-center">الحالة</th>
                  <th className="px-5 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-sm">
                {financialRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-stone-400 font-semibold">
                      لا يوجد قيود مالية عامة مسجلة.
                    </td>
                  </tr>
                ) : financialRecords.map(r => (
                  <tr key={r.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <Badge variant="secondary" className="text-xs font-bold">
                        {{
                          salary: "راتب موظف",
                          fine_payment: "سداد غرامة",
                          bus_driver_payment: "سائق حافلة",
                          supervisor_payment: "مشرف حافلة",
                          expense: "مصاريف تشغيلية",
                          income: "إيرادات عامة",
                          refund: "مسترجع",
                          tuition: "رسوم دراسية"
                        }[r.record_type] || r.record_type}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 font-bold text-stone-900">{r.recipient_name}</td>
                    <td className="px-5 py-4 text-stone-600 max-w-xs truncate">{r.description || "—"}</td>
                    <td className={`px-5 py-4 font-black num-en ${r.type === "expense" ? "text-rose-600" : "text-emerald-600"}`}>
                      {r.type === "expense" ? "-" : "+"}${parseFloat(r.amount || 0).toFixed(2)}
                    </td>
                    <td className="px-5 py-4 text-xs font-semibold text-stone-500">
                      {{
                        bank_transfer: "تحويل بنكي",
                        cash: "نقداً كاش",
                        check: "شيك بانكي",
                        card: "بطاقة دفع"
                      }[r.payment_method] || r.payment_method}
                    </td>
                    <td className="px-5 py-4 text-xs text-stone-500 num-en">{r.payment_date}</td>
                    <td className="px-5 py-4 text-center">
                      <Badge className={`${
                        r.status === "paid" || r.status === "completed" ? "bg-emerald-500/10 text-emerald-600" :
                        r.status === "cancelled" ? "bg-stone-300 text-stone-500" : "bg-amber-500/10 text-amber-600"
                      } border-none rounded-lg text-xs font-bold px-2 py-0.5`}>
                        {r.status === "paid" || r.status === "completed" ? "مكتمل" : r.status === "cancelled" ? "ملغي" : "معلق"}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => { setSelectedRecordForEdit(r); setRecordFormOpen(true); }}
                          className="text-xs text-blue-600 hover:underline font-bold"
                        >
                          تعديل
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("هل أنت متأكد من حذف هذا القيد؟")) {
                              deleteRecordMutation.mutate(r.id);
                            }
                          }}
                          className="text-xs text-rose-600 hover:underline font-bold"
                        >
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 7: FEE STRUCTURES */}
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

      {/* TAB 8: ACTIVITY FEES */}
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

          <form onSubmit={handleAddFeeSubmit} className="space-y-4 mt-4 text-right">
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

          <form onSubmit={handleRecordPaymentSubmit} className="space-y-4 mt-4 text-right">
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

          <form onSubmit={handleAddStructureSubmit} className="space-y-4 mt-4 text-right">
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

          <form onSubmit={handleAddActivitySubmit} className="space-y-4 mt-4 text-right">
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
                  تخصيص الرسوم تلقائياً لجميع طلاب الصف ({students.filter((/** @type {any} */ s) => s.grade === actGradeLevel).length} طالب)
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

      {/* DIALOG: WALLET TOPUP */}
      <Dialog open={topupOpen} onOpenChange={setTopupOpen}>
        <DialogContent className="max-w-md p-6 text-right rounded-3xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-serif font-black text-xl text-stone-900 text-right">شحن رصيد محفظة الطالب</DialogTitle>
            <DialogDescription className="text-right">شحن رصيد الطالب ({selectedStudentForTopup?.full_name}) يدوياً كاش أو شيك</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4 text-right">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-stone-500">المبلغ المراد شحنه ($) *</Label>
              <Input
                type="number"
                value={topupAmount}
                onChange={e => setTopupAmount(e.target.value)}
                placeholder="50"
                className="h-11 rounded-xl num-en"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-stone-500">طريقة الدفع *</Label>
              <select
                value={topupMethod}
                onChange={e => setTopupMethod(e.target.value)}
                className="w-full h-11 px-3 border border-stone-200 rounded-xl text-sm font-semibold focus:outline-none bg-white"
              >
                <option value="cash">نقداً كاش</option>
                <option value="check">شيك بنكي</option>
                <option value="bank_transfer">تحويل بنكي</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-stone-500">ملاحظات المعاملة</Label>
              <textarea
                value={topupNotes}
                onChange={e => setTopupNotes(e.target.value)}
                className="w-full p-3 border border-stone-200 rounded-xl text-sm font-semibold focus:outline-none"
                placeholder="رقم التحويل أو الشيك..."
                rows={2}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTopupOpen(false)}
                className="flex-1 h-11 rounded-xl border-2 border-stone-200 bg-white text-stone-850 text-sm font-semibold hover:bg-stone-50"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  const amt = parseFloat(topupAmount);
                  if (isNaN(amt) || amt <= 0) {
                    toast.error("يرجى إدخال مبلغ صحيح");
                    return;
                  }
                  topupWalletMutation.mutate({
                    studentId: selectedStudentForTopup.id,
                    amount: amt,
                    method: topupMethod,
                    notes: topupNotes
                  });
                }}
                disabled={topupWalletMutation.isPending}
                className="flex-1 h-11 rounded-xl bg-stone-900 text-white text-sm font-semibold hover:bg-black shadow-md disabled:opacity-50"
              >
                {topupWalletMutation.isPending ? "جاري الشحن..." : "تأكيد الشحن"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG: IMPOSE FINE */}
      <Dialog open={addFineOpen} onOpenChange={setAddFineOpen}>
        <DialogContent className="max-w-md p-6 text-right rounded-3xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-serif font-black text-xl text-stone-900 text-right">فرض غرامة جديدة</DialogTitle>
            <DialogDescription className="text-right">تسجيل غرامة مستحقة على الطالب ({selectedStudentForFine?.full_name})</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4 text-right">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-stone-500">فئة الغرامة *</Label>
              <select
                value={fineCategory}
                onChange={e => setFineCategory(e.target.value)}
                className="w-full h-11 px-3 border border-stone-200 rounded-xl text-sm font-semibold focus:outline-none bg-white"
              >
                <option value="library">تأخر كتب المكتبة</option>
                <option value="discipline">انضباط سلوكي أو تلفيات</option>
                <option value="transport">النقل والحافلة</option>
                <option value="general">أخرى / عامة</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-stone-500">سبب الغرامة والبيان *</Label>
              <Input
                value={fineReason}
                onChange={e => setFineReason(e.target.value)}
                placeholder="مثال: تأخر تسليم كتاب العلوم 10 أيام"
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-stone-500">المبلغ ($) *</Label>
              <Input
                type="number"
                value={fineAmount}
                onChange={e => setFineAmount(e.target.value)}
                placeholder="15"
                className="h-11 rounded-xl num-en"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-stone-500">ملاحظات إضافية</Label>
              <textarea
                value={fineNotes}
                onChange={e => setFineNotes(e.target.value)}
                className="w-full p-3 border border-stone-200 rounded-xl text-sm font-semibold focus:outline-none"
                placeholder="تفاصيل إضافية..."
                rows={2}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAddFineOpen(false)}
                className="flex-1 h-11 rounded-xl border-2 border-stone-200 bg-white text-stone-850 text-sm font-semibold hover:bg-stone-50"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  if (!fineReason || !fineAmount) {
                    toast.error("يرجى ملء الحقول الإلزامية");
                    return;
                  }
                  createFineMutation.mutate({
                    student_id: selectedStudentForFine.id,
                    category: fineCategory,
                    reason: fineReason,
                    amount: fineAmount,
                    notes: fineNotes
                  });
                }}
                disabled={createFineMutation.isPending}
                className="flex-1 h-11 rounded-xl bg-stone-900 text-white text-sm font-semibold hover:bg-black shadow-md disabled:opacity-50"
              >
                {createFineMutation.isPending ? "جاري الفرض..." : "تأكيد فرض الغرامة"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* FINANCE REPORT EXPORT MODAL */}
      <FinanceReportDialog
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        purchases={storePurchases}
        financialRecords={financialRecords}
        isRTL={isRTL}
      />

      {/* GENERAL RECORD DIALOG */}
      <FinancialRecordFormDialog
        open={recordFormOpen}
        onClose={() => { setRecordFormOpen(false); setSelectedRecordForEdit(null); }}
        record={selectedRecordForEdit}
        prefill={null}
        onSuccess={() => {
          qc.invalidateQueries({ queryKey: ["financial-records"] });
        }}
      />
    </div>
  );
}
