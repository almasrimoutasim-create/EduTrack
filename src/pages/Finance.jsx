import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { entities } from "@/api/dbClient";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import PageHeader from "@/components/shared/PageHeader";
import StaffPayroll from "@/pages/StaffPayroll";
import StatCard from "@/components/shared/StatCard";
import {
  LayoutDashboard, GraduationCap, Calendar, DollarSign, CreditCard,
  ShoppingBag, FileSpreadsheet, Plus, Search, Clock, CheckCircle2,
  AlertCircle, TrendingUp, TrendingDown, Wallet, Users, Package,
  Wrench, BookOpen, ShoppingCart, Heart, Layers, ArrowUpRight,
  ArrowDownRight, Printer, X, ChevronDown
} from "lucide-react";

export default function Finance() {
  const { user, appPublicSettings } = useAuth();
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "dashboard";
  const setTab = (tab) => setSearchParams({ tab });

  // ── SINGLE SOURCE OF TRUTH لكل البيانات ──────────────────────────────────

  const studentsQuery = useQuery({
    queryKey: ['students'],
    queryFn: () => entities.Student.list(),
    staleTime: 1000 * 60 * 5,
  });
  /** @type {any[]} */
  const students = studentsQuery.data || [];

  const teachersQuery = useQuery({
    queryKey: ['teachers'],
    queryFn: () => entities.Teacher.list(),
    staleTime: 1000 * 60 * 10,
  });
  /** @type {any[]} */
  const teachers = teachersQuery.data || [];

  const staffMembersQuery = useQuery({
    queryKey: ['staff-members'],
    queryFn: () => entities.StaffMember.list(),
    staleTime: 1000 * 60 * 10,
  });
  /** @type {any[]} */
  const staffMembers = staffMembersQuery.data || [];

  const feeStructuresQuery = useQuery({
    queryKey: ['fee-structures'],
    queryFn: () => entities.FeeStructure.list(),
    staleTime: 1000 * 60 * 10,
  });
  /** @type {any[]} */
  const feeStructures = feeStructuresQuery.data || [];

  const studentFeesQuery = useQuery({
    queryKey: ['student-fees-all'],
    queryFn: () => entities.StudentFee.list(),
    staleTime: 1000 * 60 * 3,
  });
  /** @type {any[]} */
  const studentFees = studentFeesQuery.data || [];

  const feePaymentsQuery = useQuery({
    queryKey: ['fee-payments-all'],
    queryFn: () => entities.FeePayment.list(),
    staleTime: 1000 * 60 * 3,
  });
  /** @type {any[]} */
  const feePayments = feePaymentsQuery.data || [];

  const activityFeesQuery = useQuery({
    queryKey: ['activity-fees'],
    queryFn: () => entities.ActivityFee.list(),
    staleTime: 1000 * 60 * 5,
  });
  /** @type {any[]} */
  const activityFees = activityFeesQuery.data || [];

  const studentActivityFeesQuery = useQuery({
    queryKey: ['student-activity-fees-all'],
    queryFn: () => entities.StudentActivityFee.list(),
    staleTime: 1000 * 60 * 3,
  });
  /** @type {any[]} */
  const studentActivityFees = studentActivityFeesQuery.data || [];

  const walletTxQuery = useQuery({
    queryKey: ['wallet-tx-all'],
    queryFn: () => entities.WalletTransaction.list(),
    staleTime: 1000 * 60 * 3,
  });
  /** @type {any[]} */
  const walletTx = walletTxQuery.data || [];

  const purchasesQuery = useQuery({
    queryKey: ['store-purchases'],
    queryFn: () => entities.Purchase.list(),
    staleTime: 1000 * 60 * 3,
  });
  /** @type {any[]} */
  const purchases = purchasesQuery.data || [];

  const hallRentalsQuery = useQuery({
    queryKey: ['hall-rentals'],
    queryFn: () => entities.HallRental.list(),
    staleTime: 1000 * 60 * 3,
  });
  /** @type {any[]} */
  const hallRentals = hallRentalsQuery.data || [];

  const donationsQuery = useQuery({
    queryKey: ['donations'],
    queryFn: () => entities.Donation.list(),
    staleTime: 1000 * 60 * 3,
  });
  /** @type {any[]} */
  const donations = donationsQuery.data || [];

  const otherRevenueQuery = useQuery({
    queryKey: ['other-revenue'],
    queryFn: () => entities.OtherRevenue.list(),
    staleTime: 1000 * 60 * 3,
  });
  /** @type {any[]} */
  const otherRevenue = otherRevenueQuery.data || [];

  const expensesQuery = useQuery({
    queryKey: ['expenses'],
    queryFn: () => entities.Expense.list(),
    staleTime: 1000 * 60 * 3,
  });
  /** @type {any[]} */
  const expenses = expensesQuery.data || [];

  const salariesQuery = useQuery({
    queryKey: ['salary-records'],
    queryFn: () => entities.SalaryRecord.list(),
    staleTime: 1000 * 60 * 3,
  });
  /** @type {any[]} */
  const salaries = salariesQuery.data || [];

  const purchaseOrdersQuery = useQuery({
    queryKey: ['purchase-orders'],
    queryFn: () => entities.PurchaseOrder.list(),
    staleTime: 1000 * 60 * 3,
  });
  /** @type {any[]} */
  const purchaseOrders = purchaseOrdersQuery.data || [];

  // ── COMPUTED VALUES ────────────────────────────────────────────────────────

  const financials = useMemo(() => {
    const tuitionRev = feePayments.reduce((s, p) => s + parseFloat(p.amount || 0), 0);
    const walletRev  = walletTx.filter(t => t.type === 'topup').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
    const storeRev   = purchases.reduce((s, p) => s + parseFloat(p.total_price || p.total_amount || 0), 0);
    const rentalRev  = hallRentals.filter(r => r.status === 'paid').reduce((s, r) => s + parseFloat(r.amount || 0), 0);
    const donRev     = donations.reduce((s, d) => s + parseFloat(d.amount || 0), 0);
    const otherRev   = otherRevenue.reduce((s, r) => s + parseFloat(r.amount || 0), 0);
    const totalRev   = tuitionRev + walletRev + storeRev + rentalRev + donRev + otherRev;

    const expTotal   = expenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
    const salTotal   = salaries.filter(s => s.status === 'paid').reduce((s, r) => s + parseFloat(r.net_salary || 0), 0);
    const totalExp   = expTotal + salTotal;

    const pending    = studentFees
      .filter(f => f.status !== 'paid' && f.status !== 'waived')
      .reduce((s, f) => s + parseFloat(f.remaining !== null && f.remaining !== undefined ? f.remaining : (f.amount - (f.amount_paid || 0))), 0);

    // BarChart: آخر 6 أشهر
    const MONTHS_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
    const now = new Date();
    const barData = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const y = d.getFullYear(), m = d.getMonth();
      const inMonth = (dateStr) => {
        if (!dateStr) return false;
        const pd = new Date(dateStr);
        return pd.getFullYear() === y && pd.getMonth() === m;
      };
      return {
        name: MONTHS_AR[m],
        'إيرادات': parseFloat((
          feePayments.filter(p => inMonth(p.created_at)).reduce((s, p) => s + parseFloat(p.amount || 0), 0) +
          walletTx.filter(t => t.type === 'topup' && inMonth(t.created_at)).reduce((s, t) => s + parseFloat(t.amount || 0), 0) +
          purchases.filter(p => inMonth(p.created_at)).reduce((s, p) => s + parseFloat(p.total_price || p.total_amount || 0), 0)
        ).toFixed(2)),
        'مصروفات': parseFloat((
          expenses.filter(e => inMonth(e.created_at)).reduce((s, e) => s + parseFloat(e.amount || 0), 0) +
          salaries.filter(s => s.status === 'paid' && inMonth(s.created_at)).reduce((s, r) => s + parseFloat(r.net_salary || 0), 0)
        ).toFixed(2)),
      };
    });

    // PieChart: توزيع الإيرادات
    const pieData = [
      { name: 'رسوم دراسية', value: tuitionRev, color: '#1c1917' },
      { name: 'متجر المدرسة', value: storeRev,   color: '#2563eb' },
      { name: 'إيجار قاعات', value: rentalRev,  color: '#059669' },
      { name: 'تبرعات',       value: donRev,      color: '#d97706' },
      { name: 'شحن محافظ',   value: walletRev,   color: '#7c3aed' },
      { name: 'أخرى',         value: otherRev,    color: '#64748b' },
    ].filter(item => item.value > 0);

    // آخر 15 معاملة مدمجة
    const allTx = [
      ...feePayments.map(p => ({ id: `fp-${p.id}`, date: p.created_at, label: 'رسوم دراسية', amount: p.amount, method: p.payment_method, type: 'income' })),
      ...walletTx.filter(t => t.type === 'topup').map(t => ({ id: `wt-${t.id}`, date: t.created_at, label: 'شحن محفظة', amount: t.amount, method: 'stripe', type: 'income' })),
      ...purchases.map(p => ({ id: `pu-${p.id}`, date: p.created_at, label: `متجر: ${p.item_name || 'شراء منتج'}`, amount: p.total_price || p.total_amount, method: p.payment_method, type: 'income' })),
      ...hallRentals.filter(r => r.status === 'paid').map(r => ({ id: `hr-${r.id}`, date: r.created_at, label: `إيجار: ${r.hall_name}`, amount: r.amount, method: r.payment_method, type: 'income' })),
      ...donations.map(d => ({ id: `dn-${d.id}`, date: d.created_at, label: `تبرع: ${d.is_anonymous ? 'مجهول' : d.donor_name}`, amount: d.amount, method: d.payment_method, type: 'income' })),
      ...expenses.map(e => ({ id: `ex-${e.id}`, date: e.created_at, label: e.description, amount: e.amount, method: e.payment_method, type: 'expense' })),
      ...salaries.filter(s => s.status === 'paid').map(s => ({ id: `sl-${s.id}`, date: s.created_at, label: `راتب: ${s.employee_name}`, amount: s.net_salary, method: s.payment_method, type: 'expense' })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 15);

    return { tuitionRev, walletRev, storeRev, rentalRev, donRev, otherRev, totalRev, totalExp, pending, netBalance: totalRev - totalExp, barData, pieData, allTx };
  }, [feePayments, walletTx, purchases, hallRentals, donations, otherRevenue, expenses, salaries, studentFees]);

  // ── دالة الطباعة الموحدة ──────────────────────────────────────────────────

  const printReport = (title, subtitle, headers, rows, totalsRow = null) => {
    const isRTL = true;
    const schoolNameAr = appPublicSettings?.public_settings?.school_name_ar || "مدارس إديوتراك النموذجية الخاصة";
    const schoolNameEn = appPublicSettings?.public_settings?.school_name_en || "EduTrack Model School";
    const schoolLogo = appPublicSettings?.public_settings?.school_logo || null;

    const w = window.open("", "_blank");
    if (!w) return toast.error("يرجى السماح بالنوافذ المنبثقة لطباعة التقارير");
    w.document.write(`<html><head><title>${title}</title><style>
      body{font-family:'Segoe UI',sans-serif;padding:40px;direction:rtl;text-align:right;color:#1c1917}
      .hdr{display:flex;justify-content:space-between;border-bottom:3px solid #1c1917;padding-bottom:16px;margin-bottom:24px}
      h1{font-family:serif;font-size:22px;margin:0}
      .meta{font-size:12px;color:#78716c;margin-top:4px}
      table{width:100%;border-collapse:collapse;margin-top:16px}
      th{background:#1c1917;color:#fff;padding:10px 14px;font-size:11px;text-transform:uppercase}
      td{padding:10px 14px;font-size:13px;border-bottom:1px solid #f5f5f4}
      tr:nth-child(even) td{background:#fafaf9}
      .tot td{background:#f5f5f4;font-weight:900;font-size:14px;border-top:2px solid #1c1917}
      .footer{margin-top:40px;font-size:11px;color:#a8a29e;text-align:center;border-top:1px solid #f5f5f4;padding-top:16px}
    </style></head><body>
      <div class="hdr">
        <div>
          ${schoolLogo ? `<img src="${schoolLogo}" alt="Logo" style="height: 50px; margin-bottom: 10px;" />` : ''}
          <h1>${title}</h1>
          <p class="meta">${subtitle}</p>
        </div>
        <div style="text-align:left"><p class="meta">تاريخ الإصدار: ${new Date().toLocaleDateString('ar-EG')}</p><p class="meta">${schoolNameAr} - القسم المالي</p></div>
      </div>
      <table>
        <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
        <tbody>
          ${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}
          ${totalsRow ? `<tr class="tot">${totalsRow.map(c => `<td>${c}</td>`).join('')}</tr>` : ''}
        </tbody>
      </table>
      <div class="footer">${schoolNameAr} © ${new Date().getFullYear()}</div>
      <script>window.onload=()=>{window.print();window.close()}</script>
    </body></html>`);
    w.document.close();
  };

  // ── Tab 2: الرسوم الدراسية States & Computations ─────────────────────────

  const [searchTerm, setSearchTerm] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [addFeeOpen, setAddFeeOpen] = useState(false);
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  const [selectedFeeId, setSelectedFeeId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentNotes, setPaymentNotes] = useState("");
  
  const [selectedStructureId, setSelectedStructureId] = useState("");
  const [manualFeeName, setManualFeeName] = useState("");
  const [manualFeeAmount, setManualFeeAmount] = useState("");
  const [feeDueDate, setFeeDueDate] = useState("");
  const [feePaymentPlan, setFeePaymentPlan] = useState("full");
  const [feeNotes, setFeeNotes] = useState("");

  const studentFinancials = useMemo(() =>
    students.map(s => {
      const fees = studentFees.filter(f => f.student_id === s.id);
      const totalAmount = fees.reduce((sum, f) => sum + parseFloat(f.amount || 0), 0);
      const totalPaid   = fees.reduce((sum, f) => sum + parseFloat(f.amount_paid || 0), 0);
      const totalRemaining = totalAmount - totalPaid;
      const status = fees.some(f => f.status === 'overdue') ? 'overdue'
                   : fees.some(f => f.status === 'partial')  ? 'partial'
                   : fees.some(f => f.status === 'pending')  ? 'pending'
                   : fees.length === 0 ? 'pending' : 'paid';
      return { ...s, totalAmount, totalPaid, totalRemaining, financeStatus: status, fees };
    }), [students, studentFees]);

  const filtered = useMemo(() =>
    studentFinancials.filter(s => {
      const q = searchTerm.toLowerCase();
      return (s.full_name?.toLowerCase().includes(q) || s.student_id?.toString().toLowerCase().includes(q))
        && (gradeFilter === 'all' || s.grade === gradeFilter)
        && (statusFilter === 'all' || s.financeStatus === statusFilter);
    }), [studentFinancials, searchTerm, gradeFilter, statusFilter]);

  // Mutations for Tuition Fees
  const createFeeMutation = useMutation({
    /** @param {any} data */
    mutationFn: async (data) => entities.StudentFee.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student-fees-all'] });
      toast.success('تمت إضافة الرسوم بنجاح');
      setAddFeeOpen(false);
      setSelectedStructureId("");
      setManualFeeName("");
      setManualFeeAmount("");
      setFeeDueDate("");
      setFeePaymentPlan("full");
      setFeeNotes("");
    },
    onError: () => toast.error('فشل في إضافة الرسوم'),
  });

  const recordPaymentMutation = useMutation({
    /** @param {any} data */
    mutationFn: async (data) => entities.FeePayment.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fee-payments-all'] });
      qc.invalidateQueries({ queryKey: ['student-fees-all'] });
      toast.success('تم تسجيل الدفعة بنجاح');
      setRecordPaymentOpen(false);
      setSelectedFeeId("");
      setPaymentAmount("");
      setPaymentNotes("");
    },
    onError: () => toast.error('فشل في تسجيل الدفعة'),
  });

  const handleAddFeeSubmit = (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    let name = manualFeeName;
    let amt = parseFloat(manualFeeAmount);
    if (selectedStructureId) {
      const st = feeStructures.find(f => String(f.id) === String(selectedStructureId));
      if (st) {
        name = st.fee_name;
        amt = parseFloat(st.amount);
      }
    }
    if (!name || isNaN(amt) || amt <= 0 || !feeDueDate) {
      return toast.error("يرجى إدخال جميع الحقول الإلزامية");
    }
    createFeeMutation.mutate({
      student_id: selectedStudent.id,
      fee_name: name,
      amount: amt,
      due_date: feeDueDate,
      payment_plan: feePaymentPlan,
      fee_structure_id: selectedStructureId ? String(selectedStructureId) : null,
      notes: feeNotes,
      created_by: user.id,
    });
  };

  const handleRecordPaymentSubmit = (e) => {
    e.preventDefault();
    if (!selectedStudent || !selectedFeeId) return;
    const amt = parseFloat(paymentAmount);
    const fee = studentFees.find(f => String(f.id) === String(selectedFeeId));
    if (!fee || isNaN(amt) || amt <= 0) return toast.error("يرجى إدخال مبلغ صحيح");
    const remainingVal = parseFloat(fee.remaining !== null && fee.remaining !== undefined ? fee.remaining : (fee.amount - (fee.amount_paid || 0)));
    if (amt > remainingVal) return toast.error("المبلغ المدخل يتجاوز المبلغ المتبقي المستحق");
    
    recordPaymentMutation.mutate({
      student_fee_id: fee.id,
      student_id: selectedStudent.id,
      amount: amt,
      payment_method: paymentMethod,
      paid_by: user.id,
      notes: paymentNotes
    });
  };

  const printStudentStatement = (student) => {
    const sFees = studentFees.filter(f => f.student_id === student.id);
    const rows = sFees.map(f => [
      f.fee_name,
      `$${parseFloat(f.amount).toFixed(2)}`,
      `$${parseFloat(f.amount_paid || 0).toFixed(2)}`,
      `$${parseFloat(f.remaining || 0).toFixed(2)}`,
      { paid: 'مسدد', partial: 'جزئي', pending: 'معلق', overdue: 'متأخر' }[f.status] || f.status,
      f.due_date
    ]);
    printReport(`كشف حساب الطالب: ${student.full_name}`, `الصف: ${student.grade || 'غير محدد'}`, ['البند', 'المبلغ الكلي', 'المدفوع', 'المتبقي', 'الحالة', 'تاريخ الاستحقاق'], rows);
  };

  // ── Tab 3: تسعيرة الصفوف ──────────────────────────────────────────────────

  const [addStructureOpen, setAddStructureOpen] = useState(false);
  const [editStructureOpen, setEditStructureOpen] = useState(false);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [selectedStructure, setSelectedStructure] = useState(null);
  const [applyDueDate, setApplyDueDate] = useState("");

  const [newStructGrade, setNewStructGrade] = useState("1");
  const [newStructName, setNewStructName] = useState("");
  const [newStructAmt, setNewStructAmt] = useState("");

  const [editStructGrade, setEditStructGrade] = useState("");
  const [editStructName, setEditStructName] = useState("");
  const [editStructAmt, setEditStructAmt] = useState("");

  const createStructureMutation = useMutation({
    /** @param {any} data */
    mutationFn: async (data) => entities.FeeStructure.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fee-structures'] });
      toast.success('تمت إضافة التسعيرة بنجاح');
      setAddStructureOpen(false);
      setNewStructName("");
      setNewStructAmt("");
    },
    onError: () => toast.error('فشل في إضافة التسعيرة'),
  });

  const editStructureMutation = useMutation({
    /** @param {any} data */
    mutationFn: async ({ id, ...data }) => entities.FeeStructure.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fee-structures'] });
      toast.success('تم تعديل التسعيرة بنجاح');
      setEditStructureOpen(false);
    },
    onError: () => toast.error('فشل في تعديل التسعيرة'),
  });

  const toggleStructureMutation = useMutation({
    /** @param {any} data */
    mutationFn: async ({ id, is_active }) => entities.FeeStructure.update(id, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fee-structures'] }),
  });

  const applyToGrade = async (struct, dueDate) => {
    if (!dueDate) return toast.error('يرجى تحديد تاريخ الاستحقاق');
    const targets = students.filter(s => struct.grade_level === 'all' || s.grade === struct.grade_level);
    let count = 0;
    for (const s of targets) {
      const exists = studentFees.find(f => f.student_id === s.id && f.fee_structure_id === struct.id);
      if (!exists) {
        await entities.StudentFee.create({
          student_id: s.id,
          fee_structure_id: struct.id,
          fee_name: struct.fee_name,
          amount: struct.amount,
          due_date: dueDate,
          payment_plan: 'full',
          created_by: user.id,
        });
        count++;
      }
    }
    qc.invalidateQueries({ queryKey: ['student-fees-all'] });
    toast.success(`تم تطبيق الرسوم على ${count} طالب`);
    setApplyDialogOpen(false);
  };

  // ── Tab 4: رسوم الأنشطة ─────────────────────────────────────────────────────

  const [addActivityOpen, setAddActivityOpen] = useState(false);
  const [autoAssign, setAutoAssign] = useState(false);
  const [actGradeLevel, setActGradeLevel] = useState("");
  const [actName, setActName] = useState("");
  const [actDesc, setActDesc] = useState("");
  const [actAmount, setActAmount] = useState("");
  const [actDueDate, setActDueDate] = useState("");

  const createActivityMutation = useMutation({
    /** @param {any} data */
    mutationFn: async (data) => {
      const { autoAssign: doAssign, ...actData } = data;
      const newAct = await entities.ActivityFee.create(actData);
      if (doAssign && actData.grade_level) {
        const targets = students.filter(s => s.grade === actData.grade_level);
        for (const s of targets) {
          await entities.StudentActivityFee.create({
            student_id: s.id,
            activity_fee_id: newAct.id,
            status: 'pending',
          });
        }
      }
      return newAct;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activity-fees'] });
      qc.invalidateQueries({ queryKey: ['student-activity-fees-all'] });
      toast.success('تم إنشاء النشاط بنجاح');
      setAddActivityOpen(false);
      setActName("");
      setActDesc("");
      setActAmount("");
      setActDueDate("");
      setActGradeLevel("");
      setAutoAssign(false);
    },
    onError: () => toast.error('فشل في إنشاء النشاط'),
  });

  const handleCreateActivity = (e) => {
    e.preventDefault();
    const amt = parseFloat(actAmount);
    if (!actName || isNaN(amt) || amt <= 0 || !actDueDate) return toast.error("يرجى تعبئة الحقول المطلوبة");
    createActivityMutation.mutate({
      activity_name: actName,
      description: actDesc,
      amount: amt,
      due_date: actDueDate,
      grade_level: actGradeLevel || 'all',
      created_by: user.id,
      autoAssign
    });
  };

  // ── Tab 5: الإيرادات الأخرى ────────────────────────────────────────────────

  const [otherSubTab, setOtherSubTab] = useState("rentals"); // "rentals" | "donations" | "other"

  // إيجار القاعات
  const [rentalDialogOpen, setRentalDialogOpen] = useState(false);
  const [rentalHallName, setRentalHallName] = useState("");
  const [rentalAmount, setRentalAmount] = useState("");
  const [rentalMethod, setRentalMethod] = useState("cash");

  const createRentalMutation = useMutation({
    /** @param {any} data */
    mutationFn: async (data) => entities.HallRental.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hall-rentals'] });
      toast.success('تم تسجيل الإيجار بنجاح');
      setRentalDialogOpen(false);
      setRentalHallName("");
      setRentalAmount("");
    },
    onError: () => toast.error('فشل في تسجيل الإيجار'),
  });

  const updateRentalMutation = useMutation({
    /** @param {any} data */
    mutationFn: async ({ id, ...data }) => entities.HallRental.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hall-rentals'] });
      toast.success('تم تحديث حالة الإيجار');
    },
  });

  // التبرعات
  const [donationDialogOpen, setDonationDialogOpen] = useState(false);
  const [donorName, setDonorName] = useState("");
  const [donationAmount, setDonationAmount] = useState("");
  const [donationMethod, setDonationMethod] = useState("cash");
  const [isAnonymous, setIsAnonymous] = useState(false);

  const createDonationMutation = useMutation({
    /** @param {any} data */
    mutationFn: async (data) => entities.Donation.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['donations'] });
      toast.success('تم تسجيل التبرع بنجاح');
      setDonationDialogOpen(false);
      setDonorName("");
      setDonationAmount("");
      setIsAnonymous(false);
    },
    onError: () => toast.error('فشل في تسجيل التبرع'),
  });

  const sendAckMutation = useMutation({
    /** @param {any} id */
    mutationFn: async (id) => entities.Donation.update(id, { acknowledgment_sent: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['donations'] });
      toast.success('تم تسجيل إرسال الشكر');
    },
  });

  // خدمات أخرى
  const [otherRevDialogOpen, setOtherRevDialogOpen] = useState(false);
  const [otherRevTitle, setOtherRevTitle] = useState("");
  const [otherRevAmount, setOtherRevAmount] = useState("");
  const [otherRevMethod, setOtherRevMethod] = useState("cash");

  const createOtherRevMutation = useMutation({
    /** @param {any} data */
    mutationFn: async (data) => entities.OtherRevenue.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['other-revenue'] });
      toast.success('تم تسجيل الإيراد بنجاح');
      setOtherRevDialogOpen(false);
      setOtherRevTitle("");
      setOtherRevAmount("");
    },
    onError: () => toast.error('فشل في التسجيل'),
  });

  // ── Tab 6: المصروفات والرواتب ─────────────────────────────────────────────

  const EXPENSE_CATS = {
    salaries:             { label: 'رواتب', color: 'blue' },
    furniture_equipment:  { label: 'أثاث ومعدات', color: 'purple' },
    uniforms:             { label: 'زي مدرسي', color: 'indigo' },
    maintenance:          { label: 'صيانة', color: 'gold' },
    office_supplies:      { label: 'مستلزمات مكتبية', color: 'green' },
    library_books:        { label: 'مشتريات مكتبة', color: 'green' },
    lab_supplies:         { label: 'مستلزمات مختبرات', color: 'red' },
  };

  const [expenseSubTab, setExpenseSubTab] = useState("general"); // "general" | "salaries"
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [salaryDialogOpen, setSalaryDialogOpen] = useState(false);
  const [expMonthFilter, setExpMonthFilter] = useState("all");
  const [expCatFilter, setExpCatFilter] = useState("all");

  // Expense states
  const [expCat, setExpCat] = useState("office_supplies");
  const [expDesc, setExpDesc] = useState("");
  const [expAmt, setExpAmt] = useState("");
  const [expVendor, setExpVendor] = useState("");
  const [expDate, setExpDate] = useState("");
  const [expMethod, setExpMethod] = useState("cash");

  // Salary states
  const [empType, setEmpType] = useState("teacher");
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [baseSal, setBaseSal] = useState("");
  const [allowances, setAllowances] = useState("0");
  const [deductions, setDeductions] = useState("0");
  const [advances, setAdvances] = useState("0");
  const [salMonth, setSalMonth] = useState("يناير");
  const [salYear, setSalYear] = useState("2026");
  const [salMethod, setSalMethod] = useState("bank");
  const [salNotes, setSalNotes] = useState("");

  const computedNetSalary = useMemo(() => {
    const base = parseFloat(baseSal || '0');
    const allow = parseFloat(allowances || '0');
    const ded = parseFloat(deductions || '0');
    const adv = parseFloat(advances || '0');
    return Math.max(0, base + allow - ded - adv);
  }, [baseSal, allowances, deductions, advances]);

  const createExpenseMutation = useMutation({
    /** @param {any} data */
    mutationFn: async (data) => entities.Expense.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('تم تسجيل المصروف بنجاح');
      setExpenseDialogOpen(false);
      setExpDesc("");
      setExpAmt("");
      setExpVendor("");
      setExpDate("");
    },
    onError: () => toast.error('فشل في تسجيل المصروف'),
  });

  const createSalaryMutation = useMutation({
    /** @param {any} data */
    mutationFn: async (data) => entities.SalaryRecord.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['salary-records'] });
      toast.success('تمت إضافة كشف الراتب بنجاح');
      setSalaryDialogOpen(false);
      setBaseSal("");
      setAllowances("0");
      setDeductions("0");
      setAdvances("0");
      setSelectedEmpId("");
      setSalNotes("");
    },
    onError: () => toast.error('فشل في إضافة الراتب'),
  });

  const paySalaryMutation = useMutation({
    /** @param {any} id */
    mutationFn: async (id) => entities.SalaryRecord.update(id, { status: 'paid', payment_date: new Date().toISOString().split('T')[0] }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['salary-records'] });
      toast.success('تم صرف الراتب بنجاح');
    },
    onError: () => toast.error('فشل في صرف الراتب'),
  });

  const handleCreateSalary = (e) => {
    e.preventDefault();
    if (!selectedEmpId) return toast.error("يرجى اختيار الموظف");
    const emp = empType === 'teacher' 
      ? teachers.find(t => String(t.id) === String(selectedEmpId)) 
      : staffMembers.find(s => String(s.id) === String(selectedEmpId));
    if (!emp) return toast.error("لم يتم العثور على الموظف");

    createSalaryMutation.mutate({
      employee_name: emp.full_name,
      employee_type: empType,
      base_salary: parseFloat(baseSal),
      allowances: parseFloat(allowances || '0'),
      deductions: parseFloat(deductions || '0'),
      advances: parseFloat(advances || '0'),
      net_salary: computedNetSalary,
      month: salMonth,
      year: parseInt(salYear),
      payment_method: salMethod,
      notes: salNotes,
      status: 'pending',
      created_by: user.id
    });
  };

  // ── Tab 7: طلبات المشتريات ────────────────────────────────────────────────

  const PO_STATUS = {
    pending:   { label: 'معلق',        badge: 'bg-amber-100 text-amber-700' },
    approved:  { label: 'موافق',       badge: 'bg-blue-100 text-blue-700' },
    purchased: { label: 'تم الشراء',   badge: 'bg-purple-100 text-purple-700' },
    received:  { label: 'تم الاستلام', badge: 'bg-emerald-100 text-emerald-700' },
    cancelled: { label: 'ملغى',        badge: 'bg-red-100 text-red-700' },
  };

  const [poDialogOpen, setPoDialogOpen] = useState(false);
  const [poStatusFilter, setPoStatusFilter] = useState("all");

  const [poCat, setPoCat] = useState("office_supplies");
  const [poDesc, setPoDesc] = useState("");
  const [poQty, setPoQty] = useState("1");
  const [poAmount, setPoAmount] = useState("");
  const [poVendor, setPoVendor] = useState("");

  const createPOMutation = useMutation({
    /** @param {any} data */
    mutationFn: async (data) => entities.PurchaseOrder.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success('تم إنشاء طلب الشراء بنجاح');
      setPoDialogOpen(false);
      setPoDesc("");
      setPoAmount("");
      setPoVendor("");
    },
    onError: () => toast.error('فشل في إنشاء الطلب'),
  });

  const approvePOMutation = useMutation({
    /** @param {any} id */
    mutationFn: async (id) => entities.PurchaseOrder.update(id, { status: 'approved', approved_by: user.id, approved_at: new Date().toISOString() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success('تمت الموافقة على الطلب');
    },
  });

  const cancelPOMutation = useMutation({
    /** @param {any} id */
    mutationFn: async (id) => entities.PurchaseOrder.update(id, { status: 'cancelled' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success('تم إلغاء الطلب');
    },
  });

  const purchaseAsMutation = useMutation({
    /** @param {any} po */
    mutationFn: async (po) => {
      const exp = await entities.Expense.create({
        category: po.category,
        description: po.item_description,
        amount: po.total_amount,
        vendor: po.vendor || '',
        expense_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash',
        academic_year: '2025-2026',
        created_by: user.id,
      });
      await entities.PurchaseOrder.update(po.id, { status: 'purchased', expense_id: exp.id });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase-orders'] });
      qc.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('تم تسجيل المشتريات كمصروف');
    },
    onError: () => toast.error('فشل في التسجيل كمصروف'),
  });

  const receivePOMutation = useMutation({
    /** @param {any} id */
    mutationFn: async (id) => entities.PurchaseOrder.update(id, { status: 'received' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success('تم تأكيد الاستلام');
    },
  });

  const handleCreatePO = (e) => {
    e.preventDefault();
    const tot = parseFloat(poAmount);
    if (!poDesc || isNaN(tot) || tot <= 0) return toast.error("يرجى تعبئة الحقول الإلزامية");
    createPOMutation.mutate({
      category: poCat,
      item_description: poDesc,
      quantity: parseInt(poQty || '1'),
      total_amount: tot,
      vendor: poVendor,
      status: 'pending',
      created_by: user.id
    });
  };

  // ── Tab 8: التقارير ────────────────────────────────────────────────────────

  const [reportStudentId, setReportStudentId] = useState("");
  const [reportMonth, setReportMonth] = useState(new Date().getMonth());
  const [studentReportOpen, setStudentReportOpen] = useState(false);
  const [salaryReportOpen, setSalaryReportOpen] = useState(false);

  const printRevenueSummary = () => {
    const rows = [
      ['رسوم دراسية', feePayments.length, `$${financials.tuitionRev.toFixed(2)}`],
      ['متجر المدرسة', purchases.length, `$${financials.storeRev.toFixed(2)}`],
      ['شحن محافظ', walletTx.filter(t => t.type === 'topup').length, `$${financials.walletRev.toFixed(2)}`],
      ['إيجار قاعات', hallRentals.filter(r => r.status === 'paid').length, `$${financials.rentalRev.toFixed(2)}`],
      ['تبرعات', donations.length, `$${financials.donRev.toFixed(2)}`],
      ['خدمات أخرى', otherRevenue.length, `$${financials.otherRev.toFixed(2)}`],
    ];
    printReport('ملخص الإيرادات السنوي', `السنة الأكاديمية 2025-2026`, ['المصدر', 'عدد المعاملات', 'الإجمالي'], rows, ['الإجمالي الكلي', '', `$${financials.totalRev.toFixed(2)}`]);
  };

  const printExpenseSummary = () => {
    const cats = Object.entries(EXPENSE_CATS).map(([key, val]) => {
      const total = expenses.filter(e => e.category === key).reduce((s, e) => s + parseFloat(e.amount || 0), 0);
      return [val.label, expenses.filter(e => e.category === key).length, `$${total.toFixed(2)}`];
    });
    const salTotal = salaries.filter(s => s.status === 'paid').reduce((s, r) => s + parseFloat(r.net_salary || 0), 0);
    cats.push(['رواتب (مصروفة)', salaries.filter(s => s.status === 'paid').length, `$${salTotal.toFixed(2)}`]);
    printReport('ملخص المصروفات السنوي', 'السنة الأكاديمية 2025-2026', ['الفئة', 'عدد البنود', 'الإجمالي'], cats, ['الإجمالي الكلي', '', `$${financials.totalExp.toFixed(2)}`]);
  };

  const printStudentStatementSubmit = () => {
    if (!reportStudentId) return toast.error("يرجى اختيار الطالب");
    const s = students.find(st => String(st.id) === String(reportStudentId));
    if (!s) return;
    const sFees = studentFees.filter(f => f.student_id === s.id);
    const rows = sFees.map(f => [f.fee_name, `$${parseFloat(f.amount).toFixed(2)}`, `$${parseFloat(f.amount_paid || 0).toFixed(2)}`, `$${parseFloat(f.remaining || 0).toFixed(2)}`, { paid: 'مسدد', partial: 'جزئي', pending: 'معلق', overdue: 'متأخر' }[f.status] || f.status, f.due_date]);
    printReport(`كشف حساب: ${s.full_name}`, `الصف: ${s.grade}`, ['البند', 'الإجمالي', 'المدفوع', 'المتبقي', 'الحالة', 'تاريخ الاستحقاق'], rows);
    setStudentReportOpen(false);
  };

  const printOverdue = () => {
    const today = new Date();
    const rows = studentFees
      .filter(f => f.status !== 'paid' && f.status !== 'waived' && new Date(f.due_date) < today)
      .map(f => {
        const s = students.find(st => st.id === f.student_id);
        const days = Math.floor((today.getTime() - new Date(f.due_date).getTime()) / 86400000);
        return [s?.full_name || '—', s?.grade || '—', f.fee_name, `$${parseFloat(f.remaining || 0).toFixed(2)}`, f.due_date, `${days} يوم`];
      })
      .sort((a, b) => parseFloat(b[3].replace('$', '')) - parseFloat(a[3].replace('$', '')));
    printReport('الطلاب المتأخرون في السداد', `إجمالي المتأخرات: ${rows.length} معاملة`, ['الطالب', 'الصف', 'البند', 'المتبقي', 'تاريخ الاستحقاق', 'أيام التأخر'], rows);
  };

  const printSalariesSubmit = () => {
    const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const filtered = salaries.filter(s => s.month === MONTHS_AR[reportMonth] && s.year === 2026);
    const rows = filtered.map(s => [s.employee_name, s.employee_type === 'teacher' ? 'معلم' : 'موظف', `$${parseFloat(s.base_salary).toFixed(2)}`, `$${parseFloat(s.allowances || 0).toFixed(2)}`, `$${parseFloat(s.deductions || 0).toFixed(2)}`, `$${parseFloat(s.net_salary).toFixed(2)}`, { paid: 'مصروف', pending: 'معلق', hold: 'موقوف' }[s.status] || s.status]);
    const total = filtered.filter(s => s.status === 'paid').reduce((sum, s) => sum + parseFloat(s.net_salary || 0), 0);
    printReport(`كشف رواتب: ${MONTHS_AR[reportMonth]} 2026`, `إجمالي الرواتب المصروفة: $${total.toFixed(2)}`, ['الموظف', 'النوع', 'الأساسي', 'البدلات', 'الخصومات', 'الصافي', 'الحالة'], rows, ['الإجمالي الكلي المالي', '', '', '', '', `$${total.toFixed(2)}`, '']);
    setSalaryReportOpen(false);
  };

  const printStoreRevenue = () => {
    const grouped = {};
    purchases.forEach(p => {
      const key = p.item_name || 'منتج غير محدد';
      if (!grouped[key]) grouped[key] = { qty: 0, total: 0 };
      grouped[key].qty += parseInt(p.quantity || 1);
      grouped[key].total += parseFloat(p.total_price || p.total_amount || 0);
    });
    const rows = Object.entries(grouped).sort((a, b) => b[1].total - a[1].total).map(([name, v]) => [name, v.qty, `$${v.total.toFixed(2)}`]);
    printReport('تقرير إيرادات المتجر والمقصف', '', ['المنتج', 'الكمية المباعة', 'إجمالي المبيعات'], rows, ['إجمالي مبيعات المتجر الكلية', purchases.reduce((s, p) => s + parseInt(p.quantity || 1), 0), `$${financials.storeRev.toFixed(2)}`]);
  };

  const printPurchaseOrders = () => {
    const rows = purchaseOrders.map(po => [
      EXPENSE_CATS[po.category]?.label || po.category,
      po.item_description,
      po.quantity,
      `$${parseFloat(po.total_amount || 0).toFixed(2)}`,
      po.vendor || '—',
      PO_STATUS[po.status]?.label || po.status,
    ]);
    const total = purchaseOrders.reduce((s, po) => s + parseFloat(po.total_amount || 0), 0);
    printReport('تقرير طلبات الشراء والمشتريات', '', ['الفئة', 'الوصف', 'الكمية', 'الإجمالي', 'المورد', 'الحالة'], rows, ['الإجمالي الإجمالي المعتمد', '', '', `$${total.toFixed(2)}`, '', '']);
  };

  const printAnnualBalance = () => {
    const revRows = [
      ['رسوم دراسية', `$${financials.tuitionRev.toFixed(2)}`],
      ['متجر المدرسة', `$${financials.storeRev.toFixed(2)}`],
      ['شحن محافظ', `$${financials.walletRev.toFixed(2)}`],
      ['إيجار قاعات', `$${financials.rentalRev.toFixed(2)}`],
      ['تبرعات', `$${financials.donRev.toFixed(2)}`],
      ['خدمات أخرى', `$${financials.otherRev.toFixed(2)}`],
      ['── إجمالي الإيرادات الكلية ──', `$${financials.totalRev.toFixed(2)}`],
      ['', ''],
      ...Object.entries(EXPENSE_CATS).map(([k, v]) => {
        const t = expenses.filter(e => e.category === k).reduce((s, e) => s + parseFloat(e.amount || 0), 0);
        return [v.label, `$${t.toFixed(2)}`];
      }),
      ['رواتب', `$${salaries.filter(s => s.status === 'paid').reduce((s, r) => s + parseFloat(r.net_salary || 0), 0).toFixed(2)}`],
      ['── إجمالي المصروفات الكلية ──', `$${financials.totalExp.toFixed(2)}`],
    ];
    printReport('الميزان المالي السنوي العام 2025-2026', '', ['البند أو الفئة المالية', 'المبلغ المالي المعتمد'], revRows, ['صافي الميزان المالي النهائي', `$${financials.netBalance.toFixed(2)}`]);
  };

  return (
    <div className="space-y-6 pb-20 text-right" dir="rtl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-stone-100 pb-4">
        <PageHeader 
          title="النظام المحاسبي والمالي الشامل" 
          subtitle="تسيير الرسوم، والأنشطة، والمصروفات العامة والرواتب للعام الأكاديمي الحالي"
        />
      </div>

      {/* Tabs list */}
      <div className="flex flex-wrap border border-stone-200 bg-stone-100/80 p-1.5 rounded-2xl gap-2 w-fit">
        {[
          { id: "dashboard", label: "لوحة التحكم" },
          { id: "tuition", label: "الرسوم الدراسية" },
          { id: "structures", label: "تسعيرة الصفوف" },
          { id: "activities", label: "رسوم الأنشطة" },
          { id: "other-revenue", label: "إيرادات أخرى" },
          { id: "expenses", label: "المصروفات العامة" },
          { id: "purchase-orders", label: "طلبات المشتريات" },
          { id: "store", label: "مبيعات المتجر" },
          { id: "reports", label: "التقارير المالية" },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === t.id ? "bg-white text-stone-900 shadow-sm font-extrabold" : "text-stone-500 hover:text-stone-900"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ────────────────── Tab 1: Dashboard ────────────────── */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard title="إجمالي الإيرادات" value={`$${financials.totalRev.toFixed(2)}`} icon={TrendingUp} sub="+12.4%" className="bg-emerald-50/50" />
            <StatCard title="إجمالي المصروفات" value={`$${financials.totalExp.toFixed(2)}`} icon={TrendingDown} sub="+5.1%" className="bg-rose-50/50" />
            <StatCard 
              title="صافي الميزان" 
              value={`$${financials.netBalance.toFixed(2)}`} 
              icon={Wallet} 
              className={financials.netBalance >= 0 ? "bg-blue-50/50 text-blue-700" : "bg-red-50/50 text-red-700"}
            />
            <StatCard title="الرسوم المعلقة" value={`$${financials.pending.toFixed(2)}`} icon={Clock} className="bg-amber-50/50" />
            <StatCard title="إيرادات المتجر" value={`$${financials.storeRev.toFixed(2)}`} icon={ShoppingBag} className="bg-purple-50/50" />
            <StatCard title="التبرعات المحصلة" value={`$${financials.donRev.toFixed(2)}`} icon={Heart} className="bg-indigo-50/50" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border border-stone-200/80 shadow-sm rounded-3xl p-6 bg-white">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-lg font-serif">حركة التدفق المالي (آخر 6 أشهر)</CardTitle>
                <CardDescription>مقارنة الإيرادات المحصلة مقابل المصروفات والرواتب المدفوعة</CardDescription>
              </CardHeader>
              <CardContent className="h-[320px] p-0" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={financials.barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#78716c', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#78716c', fontSize: 12 }} />
                    <Tooltip formatter={(value) => `$${value}`} />
                    <Legend />
                    <Bar dataKey="إيرادات" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="مصروفات" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border border-stone-200/80 shadow-sm rounded-3xl p-6 bg-white">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-lg font-serif">توزيع الإيرادات</CardTitle>
                <CardDescription>النسب المئوية لمصادر الدخل المختلفة</CardDescription>
              </CardHeader>
              <CardContent className="h-[320px] flex items-center justify-center" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={financials.pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {financials.pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${value}`} />
                    <Legend layout="vertical" verticalAlign="bottom" align="center" />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="border border-stone-200/80 shadow-sm rounded-3xl p-6 bg-white">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-lg font-serif">آخر المعاملات المالية المدمجة</CardTitle>
              <CardDescription>قائمة تجمع آخر 15 عملية من إيرادات ومصاريف</CardDescription>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="border-b border-stone-100 text-stone-400 text-xs font-bold">
                    <th className="pb-3 pt-1">البند / التفاصيل</th>
                    <th className="pb-3 pt-1">التاريخ</th>
                    <th className="pb-3 pt-1">المبلغ</th>
                    <th className="pb-3 pt-1">طريقة الدفع</th>
                    <th className="pb-3 pt-1">النوع</th>
                  </tr>
                </thead>
                <tbody>
                  {financials.allTx.map((tx) => (
                    <tr key={tx.id} className="border-b border-stone-50 text-sm hover:bg-stone-50/50">
                      <td className="py-4 font-bold text-stone-800">{tx.label}</td>
                      <td className="py-4 text-stone-500">{new Date(tx.date).toLocaleDateString('ar-EG')}</td>
                      <td className={`py-4 font-black ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {tx.type === 'income' ? '+' : '-'}${parseFloat(tx.amount || 0).toFixed(2)}
                      </td>
                      <td className="py-4 text-stone-500 font-medium">{tx.method || 'نقدًا'}</td>
                      <td className="py-4">
                        <Badge className={tx.type === 'income' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}>
                          {tx.type === 'income' ? 'إيراد' : 'مصروف'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ────────────────── Tab 2: Tuition Fees ────────────────── */}
      {activeTab === "tuition" && (
        <Card className="border border-stone-200/80 shadow-sm rounded-3xl p-6 bg-white space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-3 flex-1 w-full">
              <div className="relative max-w-xs flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                <Input 
                  placeholder="بحث باسم الطالب..." 
                  className="pr-10 h-11 rounded-xl bg-stone-50/50 border-stone-200"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                value={gradeFilter}
                onChange={e => setGradeFilter(e.target.value)}
                className="bg-stone-50 border border-stone-200 rounded-xl h-11 px-4 text-xs font-semibold focus:outline-none"
              >
                <option value="all">كل الصفوف</option>
                {Array.from(new Set(students.map(s => s.grade).filter(Boolean))).map(g => (
                  <option key={g} value={g}>الصف {g}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-stone-50 border border-stone-200 rounded-xl h-11 px-4 text-xs font-semibold focus:outline-none"
              >
                <option value="all">كل الحالات</option>
                <option value="paid">مسدد بالكامل</option>
                <option value="partial">مسدد جزئياً</option>
                <option value="pending">معلق</option>
                <option value="overdue">متأخر</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-stone-100 text-stone-400 text-xs font-bold">
                  <th className="pb-3">الطالب</th>
                  <th className="pb-3">الصف</th>
                  <th className="pb-3">إجمالي الرسوم</th>
                  <th className="pb-3">المدفوع</th>
                  <th className="pb-3">المتبقي</th>
                  <th className="pb-3">الحالة المادية</th>
                  <th className="pb-3 text-left">العمليات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id} className="border-b border-stone-50 text-sm hover:bg-stone-50/30">
                    <td className="py-4 font-bold text-stone-900">{s.full_name}</td>
                    <td className="py-4 text-stone-500 font-semibold">الصف {s.grade}</td>
                    <td className="py-4 num-en font-black">${s.totalAmount.toFixed(2)}</td>
                    <td className="py-4 num-en text-emerald-600 font-bold">${s.totalPaid.toFixed(2)}</td>
                    <td className="py-4 num-en text-stone-600 font-black">${s.totalRemaining.toFixed(2)}</td>
                    <td className="py-4">
                      <Badge className={
                        s.financeStatus === 'paid' ? 'bg-emerald-50 text-emerald-700' :
                        s.financeStatus === 'partial' ? 'bg-blue-50 text-blue-700' :
                        s.financeStatus === 'overdue' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                      }>
                        {{ paid: 'مسدد', partial: 'جزئي', overdue: 'متأخر', pending: 'معلق' }[s.financeStatus]}
                      </Badge>
                    </td>
                    <td className="py-4 text-left space-x-2 space-x-reverse">
                      <button 
                        onClick={() => { setSelectedStudent(s); setAddFeeOpen(true); }}
                        className="text-xs bg-stone-900 text-white font-bold px-3 py-1.5 rounded-lg hover:bg-black transition-all cursor-pointer"
                      >
                        إضافة رسوم
                      </button>
                      {s.totalRemaining > 0 && (
                        <button 
                          onClick={() => { setSelectedStudent(s); setRecordPaymentOpen(true); }}
                          className="text-xs bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition-all cursor-pointer"
                        >
                          تسجيل دفعة
                        </button>
                      )}
                      <button 
                        onClick={() => printStudentStatement(s)}
                        className="text-xs border border-stone-300 font-bold px-3 py-1.5 rounded-lg text-stone-700 hover:bg-stone-50 transition-all cursor-pointer"
                      >
                        كشف حساب
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Dialog: إضافة رسوم لطالب */}
          <Dialog open={addFeeOpen} onOpenChange={setAddFeeOpen}>
            <DialogContent className="max-w-md text-right">
              <DialogHeader>
                <DialogTitle className="font-serif text-lg">إضافة التزام مالي جديد</DialogTitle>
                <DialogDescription>
                  تعيين رسوم دراسية للطالب: <strong className="text-stone-900">{selectedStudent?.full_name}</strong>
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddFeeSubmit} className="space-y-4 pt-3">
                <div className="space-y-1.5">
                  <Label>اختر هيكل تسعيرة جاهزة (اختياري)</Label>
                  <select
                    value={selectedStructureId}
                    onChange={e => setSelectedStructureId(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl h-11 px-3 focus:outline-none"
                  >
                    <option value="">رسوم يدوية (غير مدرجة بالهياكل)</option>
                    {feeStructures.filter(f => f.is_active).map(st => (
                      <option key={st.id} value={st.id}>{st.fee_name} (${st.amount})</option>
                    ))}
                  </select>
                </div>

                {!selectedStructureId && (
                  <>
                    <div className="space-y-1.5">
                      <Label>اسم الرسوم</Label>
                      <Input value={manualFeeName} onChange={e => setManualFeeName(e.target.value)} placeholder="مثال: رسوم الفصل الثاني" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>المبلغ الكلي</Label>
                      <Input type="number" value={manualFeeAmount} onChange={e => setManualFeeAmount(e.target.value)} placeholder="مثال: 1500" />
                    </div>
                  </>
                )}

                <div className="space-y-1.5">
                  <Label>تاريخ الاستحقاق</Label>
                  <Input type="date" value={feeDueDate} onChange={e => setFeeDueDate(e.target.value)} />
                </div>

                <div className="space-y-1.5">
                  <Label>خطة الدفع</Label>
                  <select
                    value={feePaymentPlan}
                    onChange={e => setFeePaymentPlan(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl h-11 px-3 focus:outline-none"
                  >
                    <option value="full">دفعة واحدة كاملة</option>
                    <option value="installments">أقساط شهرية</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label>ملاحظات إضافية</Label>
                  <Input value={feeNotes} onChange={e => setFeeNotes(e.target.value)} placeholder="اختياري" />
                </div>

                <div className="flex gap-3 pt-3 justify-end">
                  <button type="submit" className="bg-stone-900 text-white font-bold px-5 h-11 rounded-xl hover:bg-black transition-all cursor-pointer">
                    حفظ وتأكيد
                  </button>
                  <button type="button" onClick={() => setAddFeeOpen(false)} className="border border-stone-200 font-bold px-5 h-11 rounded-xl hover:bg-stone-50 cursor-pointer">
                    إلغاء
                  </button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Dialog: تسجيل دفعة */}
          <Dialog open={recordPaymentOpen} onOpenChange={setRecordPaymentOpen}>
            <DialogContent className="max-w-md text-right">
              <DialogHeader>
                <DialogTitle className="font-serif text-lg">تسجيل دفعة رسوم</DialogTitle>
                <DialogDescription>
                  دفع لصالح الطالب: <strong className="text-stone-900">{selectedStudent?.full_name}</strong>
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleRecordPaymentSubmit} className="space-y-4 pt-3">
                <div className="space-y-1.5">
                  <Label>الرسوم المستهدفة</Label>
                  <select
                    value={selectedFeeId}
                    onChange={e => setSelectedFeeId(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl h-11 px-3 focus:outline-none"
                  >
                    <option value="">اختر الفاتورة المستحقة...</option>
                    {selectedStudent?.fees.filter(f => f.status !== 'paid').map(f => (
                      <option key={f.id} value={f.id}>{f.fee_name} (المتبقي: ${f.remaining})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label>مبلغ الدفع</Label>
                  <Input type="number" step="0.01" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} placeholder="أدخل القيمة" />
                </div>

                <div className="space-y-1.5">
                  <Label>طريقة الدفع</Label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl h-11 px-3 focus:outline-none"
                  >
                    <option value="cash">نقداً (كاش)</option>
                    <option value="bank">تحويل بنكي</option>
                    <option value="stripe">بطاقة ائتمانية (بوابة إلكترونية)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label>ملاحظات وسند المقبوضات</Label>
                  <Input value={paymentNotes} onChange={e => setPaymentNotes(e.target.value)} placeholder="تفاصيل الإيداع أو رقم التحويل" />
                </div>

                <div className="flex gap-3 pt-3 justify-end">
                  <button type="submit" className="bg-emerald-600 text-white font-bold px-5 h-11 rounded-xl hover:bg-emerald-700 transition-all cursor-pointer">
                    تسجيل القبض
                  </button>
                  <button type="button" onClick={() => setRecordPaymentOpen(false)} className="border border-stone-200 font-bold px-5 h-11 rounded-xl hover:bg-stone-50 cursor-pointer">
                    إلغاء
                  </button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </Card>
      )}

      {/* ────────────────── Tab 3: Fee Structures ────────────────── */}
      {activeTab === "structures" && (
        <Card className="border border-stone-200/80 shadow-sm rounded-3xl p-6 bg-white space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg font-serif">هياكل تسعير الرسوم الدراسية</CardTitle>
              <CardDescription>إنشاء قوالب الرسوم وتطبيقها الجماعي على صفوف معينة</CardDescription>
            </div>
            <button
              onClick={() => setAddStructureOpen(true)}
              className="bg-stone-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-black transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus size={15} />
              تسعيرة جديدة
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-stone-100 text-stone-400 text-xs font-bold">
                  <th className="pb-3">الاسم والوصف</th>
                  <th className="pb-3">الصف المستهدف</th>
                  <th className="pb-3">المبلغ الكلي</th>
                  <th className="pb-3">نوع الدفع</th>
                  <th className="pb-3">حالة القالب</th>
                  <th className="pb-3 text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {feeStructures.map(st => (
                  <tr key={st.id} className="border-b border-stone-50 text-sm hover:bg-stone-50/30">
                    <td className="py-4 font-bold text-stone-900">{st.fee_name}</td>
                    <td className="py-4 text-stone-500 font-semibold">الصف {st.grade_level}</td>
                    <td className="py-4 num-en font-black">${parseFloat(st.amount).toFixed(2)}</td>
                    <td className="py-4 text-stone-500 font-medium">سنوي</td>
                    <td className="py-4">
                      <Badge className={st.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-500'}>
                        {st.is_active ? 'نشط' : 'معطل'}
                      </Badge>
                    </td>
                    <td className="py-4 text-left space-x-2 space-x-reverse">
                      <button
                        onClick={() => {
                          setSelectedStructure(st);
                          setEditStructGrade(st.grade_level);
                          setEditStructName(st.fee_name);
                          setEditStructAmt(st.amount.toString());
                          setEditStructureOpen(true);
                        }}
                        className="text-xs bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg cursor-pointer font-bold"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => toggleStructureMutation.mutate({ id: st.id, is_active: !st.is_active })}
                        className="text-xs border border-stone-300 px-3 py-1.5 rounded-lg hover:bg-stone-50 cursor-pointer font-semibold"
                      >
                        {st.is_active ? 'تعطيل القالب' : 'تفعيل'}
                      </button>
                      <button
                        onClick={() => { setSelectedStructure(st); setApplyDueDate(""); setApplyDialogOpen(true); }}
                        className="text-xs bg-stone-900 text-white px-3 py-1.5 rounded-lg hover:bg-black cursor-pointer font-bold"
                      >
                        تطبيق على الصف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Dialog: إضافة تسعيرة */}
          <Dialog open={addStructureOpen} onOpenChange={setAddStructureOpen}>
            <DialogContent className="max-w-md text-right">
              <DialogHeader>
                <DialogTitle className="font-serif text-lg">قالب تسعيرة جديد</DialogTitle>
                <DialogDescription>إنشاء هيكل مالي لتطبيقه لاحقاً</DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                createStructureMutation.mutate({
                  grade_level: newStructGrade,
                  fee_name: newStructName,
                  amount: parseFloat(newStructAmt),
                  is_active: true,
                  created_by: user.id
                });
              }} className="space-y-4 pt-3">
                <div className="space-y-1.5">
                  <Label>الصف المستهدف</Label>
                  <select value={newStructGrade} onChange={e => setNewStructGrade(e.target.value)} className="w-full bg-stone-50 border border-stone-200 rounded-xl h-11 px-3 focus:outline-none">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
                      <option key={n} value={n.toString()}>الصف {n}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>اسم الرسوم</Label>
                  <Input value={newStructName} onChange={e => setNewStructName(e.target.value)} placeholder="مثال: القسط الدراسي الأول" required />
                </div>
                <div className="space-y-1.5">
                  <Label>المبلغ</Label>
                  <Input value={newStructAmt} onChange={e => setNewStructAmt(e.target.value)} type="number" placeholder="مثال: 1200" required />
                </div>
                <div className="flex gap-3 justify-end pt-3">
                  <button type="submit" className="bg-stone-900 text-white font-bold px-5 h-11 rounded-xl hover:bg-black cursor-pointer">
                    حفظ
                  </button>
                  <button type="button" onClick={() => setAddStructureOpen(false)} className="border border-stone-200 font-bold px-5 h-11 rounded-xl hover:bg-stone-50 cursor-pointer">
                    إلغاء
                  </button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Dialog: تعديل تسعيرة */}
          <Dialog open={editStructureOpen} onOpenChange={setEditStructureOpen}>
            <DialogContent className="max-w-md text-right">
              <DialogHeader>
                <DialogTitle className="font-serif text-lg">تعديل قالب التسعيرة</DialogTitle>
                <DialogDescription>تحديث بيانات الهيكل المالي الحالي</DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (!selectedStructure) return;
                editStructureMutation.mutate({
                  id: selectedStructure.id,
                  grade_level: editStructGrade,
                  fee_name: editStructName,
                  amount: parseFloat(editStructAmt),
                });
              }} className="space-y-4 pt-3">
                <div className="space-y-1.5">
                  <Label>الصف المستهدف</Label>
                  <select value={editStructGrade} onChange={e => setEditStructGrade(e.target.value)} className="w-full bg-stone-50 border border-stone-200 rounded-xl h-11 px-3 focus:outline-none">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
                      <option key={n} value={n.toString()}>الصف {n}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>اسم الرسوم</Label>
                  <Input value={editStructName} onChange={e => setEditStructName(e.target.value)} placeholder="مثال: القسط الدراسي الأول" required />
                </div>
                <div className="space-y-1.5">
                  <Label>المبلغ</Label>
                  <Input value={editStructAmt} onChange={e => setEditStructAmt(e.target.value)} type="number" placeholder="مثال: 1200" required />
                </div>
                <div className="flex gap-3 justify-end pt-3">
                  <button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-5 h-11 rounded-xl cursor-pointer">
                    تعديل وحفظ
                  </button>
                  <button type="button" onClick={() => setEditStructureOpen(false)} className="border border-stone-200 font-bold px-5 h-11 rounded-xl hover:bg-stone-50 cursor-pointer">
                    إلغاء
                  </button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Dialog: تأكيد التطبيق الجماعي */}
          <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
            <DialogContent className="max-w-md text-right">
              <DialogHeader>
                <DialogTitle className="font-serif text-lg">تطبيق الرسوم على طلاب الصف</DialogTitle>
                <DialogDescription>
                  سيتم إنشاء فاتورة رسوم بقيمة <strong className="text-stone-900">${selectedStructure?.amount}</strong> لجميع طلاب الصف <strong className="text-stone-900">{selectedStructure?.grade_level}</strong> الذين ليس لديهم هذا البند.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-3">
                <div className="space-y-1.5">
                  <Label>تاريخ استحقاق الرسوم</Label>
                  <Input type="date" value={applyDueDate} onChange={e => setApplyDueDate(e.target.value)} />
                </div>
                <div className="flex gap-3 justify-end">
                  <button onClick={() => applyToGrade(selectedStructure, applyDueDate)} className="bg-stone-900 text-white font-bold px-5 h-11 rounded-xl hover:bg-black cursor-pointer">
                    تأكيد وتطبيق
                  </button>
                  <button onClick={() => setApplyDialogOpen(false)} className="border border-stone-200 font-bold px-5 h-11 rounded-xl hover:bg-stone-50 cursor-pointer">
                    إلغاء
                  </button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </Card>
      )}

      {/* ────────────────── Tab 4: رسوم الأنشطة ────────────────── */}
      {activeTab === "activities" && (
        <Card className="border border-stone-200/80 shadow-sm rounded-3xl p-6 bg-white space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg font-serif">رسوم الأنشطة المدرسية والرحلات</CardTitle>
              <CardDescription>تحديد تكلفة الأنشطة الاختيارية والإلزامية وتعيينها للطلاب</CardDescription>
            </div>
            <button
              onClick={() => setAddActivityOpen(true)}
              className="bg-stone-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-black transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus size={15} />
              نشاط جديد
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-stone-100 text-stone-400 text-xs font-bold">
                  <th className="pb-3">النشاط</th>
                  <th className="pb-3">الصف</th>
                  <th className="pb-3">المبلغ</th>
                  <th className="pb-3">تاريخ الاستحقاق</th>
                  <th className="pb-3">نوع الالتحاق</th>
                  <th className="pb-3">عدد المسجلين</th>
                </tr>
              </thead>
              <tbody>
                {activityFees.map(act => {
                  const enrolled = studentActivityFees.filter(sa => sa.activity_fee_id === act.id).length;
                  return (
                    <tr key={act.id} className="border-b border-stone-50 text-sm hover:bg-stone-50/30">
                      <td className="py-4">
                        <p className="font-bold text-stone-900">{act.activity_name}</p>
                        <p className="text-xs text-stone-400 font-semibold">{act.description}</p>
                      </td>
                      <td className="py-4 text-stone-500 font-semibold">الصف {act.grade_level || 'الكل'}</td>
                      <td className="py-4 num-en font-black">${parseFloat(act.amount).toFixed(2)}</td>
                      <td className="py-4 text-stone-500 font-semibold">{act.due_date}</td>
                      <td className="py-4">
                        <Badge className={act.is_mandatory ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-700'}>
                          {act.is_mandatory ? 'إلزامي' : 'اختياري'}
                        </Badge>
                      </td>
                      <td className="py-4 num-en font-bold text-stone-700">{enrolled} طالب</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Dialog: إنشاء نشاط */}
          <Dialog open={addActivityOpen} onOpenChange={setAddActivityOpen}>
            <DialogContent className="max-w-md text-right">
              <DialogHeader>
                <DialogTitle className="font-serif text-lg">إنشاء رسوم نشاط/رحلة</DialogTitle>
                <DialogDescription>إدراج نشاط وتحديد شروطه المالية للطلبة</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateActivity} className="space-y-4 pt-3">
                <div className="space-y-1.5">
                  <Label>اسم النشاط</Label>
                  <Input value={actName} onChange={e => setActName(e.target.value)} placeholder="مثال: رحلة معرض العلوم السنوي" required />
                </div>
                <div className="space-y-1.5">
                  <Label>الوصف</Label>
                  <Input value={actDesc} onChange={e => setActDesc(e.target.value)} placeholder="تفاصيل إضافية عن النشاط" />
                </div>
                <div className="space-y-1.5">
                  <Label>تكلفة الاشتراك</Label>
                  <Input type="number" value={actAmount} onChange={e => setActAmount(e.target.value)} placeholder="مثال: 50" required />
                </div>
                <div className="space-y-1.5">
                  <Label>تاريخ آخر موعد للسداد</Label>
                  <Input type="date" value={actDueDate} onChange={e => setActDueDate(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>الصف المستهدف</Label>
                  <select
                    value={actGradeLevel}
                    onChange={e => setActGradeLevel(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl h-11 px-3 focus:outline-none"
                  >
                    <option value="">كل الصفوف</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
                      <option key={n} value={n.toString()}>الصف {n}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="autoAssign"
                    checked={autoAssign}
                    onChange={e => setAutoAssign(e.target.checked)}
                    className="h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900 cursor-pointer"
                  />
                  <Label htmlFor="autoAssign" className="cursor-pointer">تخصيص تلقائي لجميع طلاب الصف المحدد</Label>
                </div>

                <div className="flex gap-3 justify-end pt-3">
                  <button type="submit" className="bg-stone-900 text-white font-bold px-5 h-11 rounded-xl hover:bg-black cursor-pointer">
                    إنشاء ونشر
                  </button>
                  <button type="button" onClick={() => setAddActivityOpen(false)} className="border border-stone-200 font-bold px-5 h-11 rounded-xl hover:bg-stone-50 cursor-pointer">
                    إلغاء
                  </button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </Card>
      )}

      {/* ────────────────── Tab 5: الإيرادات الأخرى ────────────────── */}
      {activeTab === "other-revenue" && (
        <Card className="border border-stone-200/80 shadow-sm rounded-3xl p-6 bg-white space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-lg font-serif">سجل الإيرادات الجانبية والتشغيلية</CardTitle>
              <CardDescription>إدارة إيجار مرافق المدرسة، التبرعات المستلمة، والخدمات الإضافية</CardDescription>
            </div>
            
            {/* Sub-tabs buttons */}
            <div className="flex border border-stone-200 bg-stone-50 p-1 rounded-xl gap-1.5 text-xs font-bold">
              <button onClick={() => setOtherSubTab("rentals")} className={`px-4 py-2 rounded-lg cursor-pointer ${otherSubTab === "rentals" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"}`}>إيجار القاعات</button>
              <button onClick={() => setOtherSubTab("donations")} className={`px-4 py-2 rounded-lg cursor-pointer ${otherSubTab === "donations" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"}`}>التبرعات</button>
              <button onClick={() => setOtherSubTab("other")} className={`px-4 py-2 rounded-lg cursor-pointer ${otherSubTab === "other" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"}`}>خدمات متنوعة</button>
            </div>
          </div>

          {/* Sub-tab 1: Rentals */}
          {otherSubTab === "rentals" && (
            <div className="space-y-6">
              <div className="flex justify-end">
                <button onClick={() => setRentalDialogOpen(true)} className="bg-stone-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-black cursor-pointer flex items-center gap-1">
                  <Plus size={14} /> تسجيل عقد إيجار
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="border-b border-stone-100 text-stone-400 text-xs font-bold">
                      <th className="pb-3">القاعة / المرفق</th>
                      <th className="pb-3">قيمة الإيجار</th>
                      <th className="pb-3">طريقة الدفع</th>
                      <th className="pb-3">تاريخ المعاملة</th>
                      <th className="pb-3">حالة الدفع</th>
                      <th className="pb-3 text-left">تحديث الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hallRentals.map(r => (
                      <tr key={r.id} className="border-b border-stone-50 text-sm hover:bg-stone-50/30">
                        <td className="py-4 font-bold text-stone-900">{r.hall_name}</td>
                        <td className="py-4 num-en font-black">${parseFloat(r.amount).toFixed(2)}</td>
                        <td className="py-4 text-stone-500 font-medium">{r.payment_method}</td>
                        <td className="py-4 text-stone-500">{new Date(r.created_at).toLocaleDateString('ar-EG')}</td>
                        <td className="py-4">
                          <Badge className={
                            r.status === 'paid' ? 'bg-emerald-50 text-emerald-700' :
                            r.status === 'cancelled' ? 'bg-rose-50 text-rose-700' :
                            r.status === 'confirmed' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                          }>
                            {{ pending: 'معلق', confirmed: 'مؤكد', paid: 'مدفوع', cancelled: 'ملغى' }[r.status] || r.status}
                          </Badge>
                        </td>
                        <td className="py-4 text-left">
                          <select
                            value={r.status}
                            onChange={(e) => updateRentalMutation.mutate({ id: r.id, status: e.target.value })}
                            className="bg-stone-50 border border-stone-200 text-xs rounded-lg px-2 py-1 font-bold focus:outline-none"
                          >
                            <option value="pending">معلق</option>
                            <option value="confirmed">مؤكد</option>
                            <option value="paid">مدفوع</option>
                            <option value="cancelled">ملغى</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub-tab 2: Donations */}
          {otherSubTab === "donations" && (
            <div className="space-y-6">
              <div className="flex justify-end">
                <button onClick={() => setDonationDialogOpen(true)} className="bg-stone-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-black cursor-pointer flex items-center gap-1">
                  <Plus size={14} /> تسجيل تبرع وارد
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="border-b border-stone-100 text-stone-400 text-xs font-bold">
                      <th className="pb-3">المتبرع</th>
                      <th className="pb-3">القيمة</th>
                      <th className="pb-3">طريقة الدفع</th>
                      <th className="pb-3">التاريخ</th>
                      <th className="pb-3">خطاب الشكر</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donations.map(d => (
                      <tr key={d.id} className="border-b border-stone-50 text-sm hover:bg-stone-50/30">
                        <td className="py-4 font-bold text-stone-900">{d.is_anonymous ? 'مجهول الهوية' : d.donor_name}</td>
                        <td className="py-4 num-en font-black">${parseFloat(d.amount).toFixed(2)}</td>
                        <td className="py-4 text-stone-500 font-semibold">{d.payment_method || 'نقداً'}</td>
                        <td className="py-4 text-stone-400 font-semibold">{new Date(d.created_at).toLocaleDateString('ar-EG')}</td>
                        <td className="py-4">
                          {d.acknowledgment_sent ? (
                            <Badge className="bg-emerald-50 text-emerald-700">تم إرسال الشكر</Badge>
                          ) : (
                            <button
                              onClick={() => sendAckMutation.mutate(d.id)}
                              className="text-xs bg-stone-900 text-white font-bold px-3 py-1 rounded hover:bg-black cursor-pointer"
                            >
                              تسجيل إرسال شكر
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub-tab 3: Other revenues */}
          {otherSubTab === "other" && (
            <div className="space-y-6">
              <div className="flex justify-end">
                <button onClick={() => setOtherRevDialogOpen(true)} className="bg-stone-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-black cursor-pointer flex items-center gap-1">
                  <Plus size={14} /> تسجيل إيراد متنوع
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="border-b border-stone-100 text-stone-400 text-xs font-bold">
                      <th className="pb-3">بيان الإيراد</th>
                      <th className="pb-3">المبلغ الكلي</th>
                      <th className="pb-3">طريقة الدفع</th>
                      <th className="pb-3">تاريخ تسجيل الإيراد</th>
                    </tr>
                  </thead>
                  <tbody>
                    {otherRevenue.map(or => (
                      <tr key={or.id} className="border-b border-stone-50 text-sm hover:bg-stone-50/30">
                        <td className="py-4 font-bold text-stone-900">{or.title}</td>
                        <td className="py-4 num-en font-black">${parseFloat(or.amount).toFixed(2)}</td>
                        <td className="py-4 text-stone-500 font-medium">{or.payment_method}</td>
                        <td className="py-4 text-stone-450">{new Date(or.created_at).toLocaleDateString('ar-EG')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Rental Dialog */}
          <Dialog open={rentalDialogOpen} onOpenChange={setRentalDialogOpen}>
            <DialogContent className="max-w-md text-right">
              <DialogHeader>
                <DialogTitle className="font-serif text-lg">تسجيل عقد إيجار قاعة</DialogTitle>
                <DialogDescription>إدراج بيانات إيجار مرافق المؤسسة</DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                createRentalMutation.mutate({
                  hall_name: rentalHallName,
                  amount: parseFloat(rentalAmount),
                  payment_method: rentalMethod,
                  status: 'confirmed',
                  created_by: user.id
                });
              }} className="space-y-4 pt-3">
                <div className="space-y-1.5">
                  <Label>اسم القاعة أو المرفق</Label>
                  <Input value={rentalHallName} onChange={e => setRentalHallName(e.target.value)} placeholder="مثال: المسرح المدرسي الكبير" required />
                </div>
                <div className="space-y-1.5">
                  <Label>المبلغ المالي</Label>
                  <Input type="number" value={rentalAmount} onChange={e => setRentalAmount(e.target.value)} placeholder="مثال: 500" required />
                </div>
                <div className="space-y-1.5">
                  <Label>طريقة الدفع</Label>
                  <select value={rentalMethod} onChange={e => setRentalMethod(e.target.value)} className="w-full bg-stone-50 border border-stone-200 rounded-xl h-11 px-3 focus:outline-none">
                    <option value="cash">نقداً (كاش)</option>
                    <option value="bank">تحويل بنكي</option>
                  </select>
                </div>
                <div className="flex gap-3 justify-end pt-3">
                  <button type="submit" className="bg-stone-900 text-white font-bold px-5 h-11 rounded-xl hover:bg-black cursor-pointer">حفظ العقد</button>
                  <button type="button" onClick={() => setRentalDialogOpen(false)} className="border border-stone-200 font-bold px-5 h-11 rounded-xl hover:bg-stone-50 cursor-pointer">إلغاء</button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Donation Dialog */}
          <Dialog open={donationDialogOpen} onOpenChange={setDonationDialogOpen}>
            <DialogContent className="max-w-md text-right">
              <DialogHeader>
                <DialogTitle className="font-serif text-lg">تسجيل تبرع وارد</DialogTitle>
                <DialogDescription>توثيق المبالغ الخيرية الواردة للمؤسسة</DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                createDonationMutation.mutate({
                  donor_name: isAnonymous ? 'مجهول' : donorName,
                  amount: parseFloat(donationAmount),
                  payment_method: donationMethod,
                  is_anonymous: isAnonymous,
                  acknowledgment_sent: false,
                  created_by: user.id
                });
              }} className="space-y-4 pt-3">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="isAnonymous"
                    checked={isAnonymous}
                    onChange={e => setIsAnonymous(e.target.checked)}
                    className="h-4 w-4 rounded border-stone-300 text-stone-900 cursor-pointer"
                  />
                  <Label htmlFor="isAnonymous" className="cursor-pointer">تبرع من فاعل خير (مجهول الهوية)</Label>
                </div>
                {!isAnonymous && (
                  <div className="space-y-1.5">
                    <Label>اسم المتبرع</Label>
                    <Input value={donorName} onChange={e => setDonorName(e.target.value)} placeholder="مثال: مؤسسة الخير للتعليم" required />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label>المبلغ الكلي</Label>
                  <Input type="number" value={donationAmount} onChange={e => setDonationAmount(e.target.value)} placeholder="مثال: 2000" required />
                </div>
                <div className="space-y-1.5">
                  <Label>طريقة الدفع</Label>
                  <select value={donationMethod} onChange={e => setDonationMethod(e.target.value)} className="w-full bg-stone-50 border border-stone-200 rounded-xl h-11 px-3 focus:outline-none">
                    <option value="cash">نقداً (كاش)</option>
                    <option value="bank">تحويل بنكي</option>
                  </select>
                </div>
                <div className="flex gap-3 justify-end pt-3">
                  <button type="submit" className="bg-stone-900 text-white font-bold px-5 h-11 rounded-xl hover:bg-black cursor-pointer">تسجيل التبرع</button>
                  <button type="button" onClick={() => setDonationDialogOpen(false)} className="border border-stone-200 font-bold px-5 h-11 rounded-xl hover:bg-stone-50 cursor-pointer">إلغاء</button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Other Revenue Dialog */}
          <Dialog open={otherRevDialogOpen} onOpenChange={setOtherRevDialogOpen}>
            <DialogContent className="max-w-md text-right">
              <DialogHeader>
                <DialogTitle className="font-serif text-lg">تسجيل إيراد متنوع</DialogTitle>
                <DialogDescription>توثيق مصادر الدخل التشغيلية الأخرى</DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                createOtherRevMutation.mutate({
                  title: otherRevTitle,
                  amount: parseFloat(otherRevAmount),
                  payment_method: otherRevMethod,
                  created_by: user.id
                });
              }} className="space-y-4 pt-3">
                <div className="space-y-1.5">
                  <Label>بيان الإيراد / الخدمة</Label>
                  <Input value={otherRevTitle} onChange={e => setOtherRevTitle(e.target.value)} placeholder="مثال: مبيعات الكتب اللامنهجية" required />
                </div>
                <div className="space-y-1.5">
                  <Label>المبلغ المحصل</Label>
                  <Input type="number" value={otherRevAmount} onChange={e => setOtherRevAmount(e.target.value)} placeholder="مثال: 350" required />
                </div>
                <div className="space-y-1.5">
                  <Label>طريقة الدفع</Label>
                  <select value={otherRevMethod} onChange={e => setOtherRevMethod(e.target.value)} className="w-full bg-stone-50 border border-stone-200 rounded-xl h-11 px-3 focus:outline-none">
                    <option value="cash">نقداً (كاش)</option>
                    <option value="bank">تحويل بنكي</option>
                  </select>
                </div>
                <div className="flex gap-3 justify-end pt-3">
                  <button type="submit" className="bg-stone-900 text-white font-bold px-5 h-11 rounded-xl hover:bg-black cursor-pointer">تأكيد الإيراد</button>
                  <button type="button" onClick={() => setOtherRevDialogOpen(false)} className="border border-stone-200 font-bold px-5 h-11 rounded-xl hover:bg-stone-50 cursor-pointer">إلغاء</button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </Card>
      )}

      {/* ────────────────── Tab 6: المصروفات والرواتب ────────────────── */}
      {activeTab === "expenses" && (
        <Card className="border border-stone-200/80 shadow-sm rounded-3xl p-6 bg-white space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-lg font-serif">دفتر المصروفات والرواتب</CardTitle>
              <CardDescription>إدارة قيود المصروفات التشغيلية والمكتبية وصرف أجور الكوادر التعليمية والإدارية</CardDescription>
            </div>
            
            {/* Sub-tabs */}
            <div className="flex border border-stone-200 bg-stone-50 p-1 rounded-xl gap-1.5 text-xs font-bold">
              <button onClick={() => setExpenseSubTab("general")} className={`px-4 py-2 rounded-lg cursor-pointer ${expenseSubTab === "general" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"}`}>المصروفات العامة</button>
              <button onClick={() => setExpenseSubTab("payroll")} className={`px-4 py-2 rounded-lg cursor-pointer ${expenseSubTab === "payroll" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"}`}>مسير الرواتب (HR)</button>
              <button onClick={() => setExpenseSubTab("salaries")} className={`px-4 py-2 rounded-lg cursor-pointer ${expenseSubTab === "salaries" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"}`}>سجلات الصرف المعتمدة</button>
            </div>
          </div>

          {expenseSubTab === "general" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <select
                    value={expCatFilter}
                    onChange={e => setExpCatFilter(e.target.value)}
                    className="bg-stone-50 border border-stone-200 rounded-xl h-11 px-3 text-xs font-semibold focus:outline-none"
                  >
                    <option value="all">كل الفئات</option>
                    {Object.entries(EXPENSE_CATS).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => setExpenseDialogOpen(true)}
                  className="bg-stone-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-black cursor-pointer flex items-center gap-1"
                >
                  <Plus size={14} /> تسجيل مصروف
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="border-b border-stone-100 text-stone-400 text-xs font-bold">
                      <th className="pb-3">البيان</th>
                      <th className="pb-3">الفئة</th>
                      <th className="pb-3">المبلغ</th>
                      <th className="pb-3">المورد</th>
                      <th className="pb-3">التاريخ</th>
                      <th className="pb-3">طريقة الدفع</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.filter(e => expCatFilter === 'all' || e.category === expCatFilter).map(e => (
                      <tr key={e.id} className="border-b border-stone-50 text-sm hover:bg-stone-50/30">
                        <td className="py-4 font-bold text-stone-900">{e.description}</td>
                        <td className="py-4">
                          <Badge className="bg-stone-100 text-stone-700">
                            {EXPENSE_CATS[e.category]?.label || e.category}
                          </Badge>
                        </td>
                        <td className="py-4 num-en font-black text-rose-600">${parseFloat(e.amount).toFixed(2)}</td>
                        <td className="py-4 text-stone-500 font-semibold">{e.vendor || '—'}</td>
                        <td className="py-4 text-stone-550">{e.expense_date}</td>
                        <td className="py-4 text-stone-500 font-medium">{e.payment_method}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {expenseSubTab === "payroll" && (
            <div className="bg-white rounded-3xl border border-stone-200/80 p-6 shadow-sm mb-6">
              <StaffPayroll isEmbedded={true} />
            </div>
          )}

          {expenseSubTab === "salaries" && (
            <div className="space-y-6">
              <div className="flex justify-end">
                <button
                  onClick={() => setSalaryDialogOpen(true)}
                  className="bg-stone-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-black cursor-pointer flex items-center gap-1"
                >
                  <Plus size={14} /> مسير راتب جديد
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="border-b border-stone-100 text-stone-400 text-xs font-bold">
                      <th className="pb-3">الموظف</th>
                      <th className="pb-3">النوع</th>
                      <th className="pb-3">الشهر/السنة</th>
                      <th className="pb-3">الأساسي</th>
                      <th className="pb-3">البدلات (+)</th>
                      <th className="pb-3">استقطاع (-)</th>
                      <th className="pb-3">سلفية (-)</th>
                      <th className="pb-3">صافي الراتب</th>
                      <th className="pb-3">حالة الصرف</th>
                      <th className="pb-3 text-left">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salaries.map(s => (
                      <tr key={s.id} className="border-b border-stone-50 text-sm hover:bg-stone-50/30">
                        <td className="py-4 font-bold text-stone-900">{s.employee_name}</td>
                        <td className="py-4 text-stone-500 font-semibold">{s.employee_type === 'teacher' ? 'معلم' : 'إداري'}</td>
                        <td className="py-4 text-stone-600 font-medium">{s.month} {s.year}</td>
                        <td className="py-4 num-en">${parseFloat(s.base_salary).toFixed(2)}</td>
                        <td className="py-4 num-en text-emerald-600">${parseFloat(s.allowances || 0).toFixed(2)}</td>
                        <td className="py-4 num-en text-rose-600">${parseFloat(s.deductions || 0).toFixed(2)}</td>
                        <td className="py-4 num-en text-amber-600">${parseFloat(s.advances || 0).toFixed(2)}</td>
                        <td className="py-4 num-en font-black text-stone-900">${parseFloat(s.net_salary).toFixed(2)}</td>
                        <td className="py-4">
                          <Badge className={s.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}>
                            {s.status === 'paid' ? 'مصروف' : 'معلق'}
                          </Badge>
                        </td>
                        <td className="py-4 text-left">
                          {s.status !== 'paid' && (
                            <button
                              onClick={() => paySalaryMutation.mutate(s.id)}
                              className="text-xs bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-lg hover:bg-emerald-700 cursor-pointer"
                            >
                              صرف الآن
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Dialog: إضافة مصروف */}
          <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
            <DialogContent className="max-w-md text-right">
              <DialogHeader>
                <DialogTitle className="font-serif text-lg">تسجيل قيد مصروف جديد</DialogTitle>
                <DialogDescription>توثيق خروج نقدية من الميزانية العامة</DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                createExpenseMutation.mutate({
                  category: expCat,
                  description: expDesc,
                  amount: parseFloat(expAmt),
                  vendor: expVendor,
                  expense_date: expDate,
                  payment_method: expMethod,
                  academic_year: '2025-2026',
                  created_by: user.id
                });
              }} className="space-y-4 pt-3">
                <div className="space-y-1.5">
                  <Label>الفئة المالية</Label>
                  <select value={expCat} onChange={e => setExpCat(e.target.value)} className="w-full bg-stone-50 border border-stone-200 rounded-xl h-11 px-3 focus:outline-none">
                    {Object.entries(EXPENSE_CATS).filter(([k]) => k !== 'salaries').map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>بيان المصروف</Label>
                  <Input value={expDesc} onChange={e => setExpDesc(e.target.value)} placeholder="مثال: فاتورة كهرباء وتكييف" required />
                </div>
                <div className="space-y-1.5">
                  <Label>المبلغ المالي</Label>
                  <Input type="number" value={expAmt} onChange={e => setExpAmt(e.target.value)} placeholder="المبلغ" required />
                </div>
                <div className="space-y-1.5">
                  <Label>المورد / الجهة المستلمة</Label>
                  <Input value={expVendor} onChange={e => setExpVendor(e.target.value)} placeholder="اختياري" />
                </div>
                <div className="space-y-1.5">
                  <Label>تاريخ الصرف</Label>
                  <Input type="date" value={expDate} onChange={e => setExpDate(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>طريقة الدفع</Label>
                  <select value={expMethod} onChange={e => setExpMethod(e.target.value)} className="w-full bg-stone-50 border border-stone-200 rounded-xl h-11 px-3 focus:outline-none">
                    <option value="cash">نقداً (كاش)</option>
                    <option value="bank">تحويل بنكي</option>
                  </select>
                </div>
                <div className="flex gap-3 justify-end pt-3">
                  <button type="submit" className="bg-stone-900 text-white font-bold px-5 h-11 rounded-xl hover:bg-black cursor-pointer">تسجيل القيد</button>
                  <button type="button" onClick={() => setExpenseDialogOpen(false)} className="border border-stone-200 font-bold px-5 h-11 rounded-xl hover:bg-stone-50 cursor-pointer">إلغاء</button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Dialog: إضافة كشف راتب */}
          <Dialog open={salaryDialogOpen} onOpenChange={setSalaryDialogOpen}>
            <DialogContent className="max-w-md text-right">
              <DialogHeader>
                <DialogTitle className="font-serif text-lg">مسير راتب موظف</DialogTitle>
                <DialogDescription>إنشاء قيد راتب للمستحقات الشهرية</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateSalary} className="space-y-4 pt-3">
                <div className="space-y-1.5">
                  <Label>فئة الوظيفية</Label>
                  <select value={empType} onChange={e => { setEmpType(e.target.value); setSelectedEmpId(""); }} className="w-full bg-stone-50 border border-stone-200 rounded-xl h-11 px-3 focus:outline-none">
                    <option value="teacher">معلم / كادر أكاديمي</option>
                    <option value="staff">موظف / كادر إداري</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label>اسم الموظف</Label>
                  <select value={selectedEmpId} onChange={e => setSelectedEmpId(e.target.value)} className="w-full bg-stone-50 border border-stone-200 rounded-xl h-11 px-3 focus:outline-none" required>
                    <option value="">اختر الموظف...</option>
                    {empType === 'teacher' ? (
                      teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)
                    ) : (
                      staffMembers.map(sm => <option key={sm.id} value={sm.id}>{sm.full_name}</option>)
                    )}
                  </select>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div className="space-y-1.5">
                    <Label>الأساسي</Label>
                    <Input type="number" value={baseSal} onChange={e => setBaseSal(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>البدلات (+)</Label>
                    <Input type="number" value={allowances} onChange={e => setAllowances(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>خصومات (-)</Label>
                    <Input type="number" value={deductions} onChange={e => setDeductions(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>سلف مستردة (-)</Label>
                    <Input type="number" value={advances} onChange={e => setAdvances(e.target.value)} />
                  </div>
                </div>

                <div className="p-3 bg-stone-50 rounded-2xl flex justify-between items-center text-sm">
                  <span className="font-bold text-stone-500">صافي المستحق:</span>
                  <span className="font-black text-lg text-emerald-600">${computedNetSalary.toFixed(2)}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>الشهر</Label>
                    <select value={salMonth} onChange={e => setSalMonth(e.target.value)} className="w-full bg-stone-50 border border-stone-200 rounded-xl h-11 px-3 focus:outline-none">
                      {['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>السنة</Label>
                    <select value={salYear} onChange={e => setSalYear(e.target.value)} className="w-full bg-stone-50 border border-stone-200 rounded-xl h-11 px-3 focus:outline-none">
                      <option value="2025">2025</option>
                      <option value="2026">2026</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>طريقة الصرف</Label>
                  <select value={salMethod} onChange={e => setSalMethod(e.target.value)} className="w-full bg-stone-50 border border-stone-200 rounded-xl h-11 px-3 focus:outline-none">
                    <option value="bank">تحويل بنكي</option>
                    <option value="cash">صرف نقدي</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label>ملاحظات</Label>
                  <Input value={salNotes} onChange={e => setSalNotes(e.target.value)} placeholder="مثال: مكافأة الأداء الفصلي" />
                </div>

                <div className="flex gap-3 justify-end pt-3">
                  <button type="submit" className="bg-stone-900 text-white font-bold px-5 h-11 rounded-xl hover:bg-black cursor-pointer">حفظ الفاتورة</button>
                  <button type="button" onClick={() => setSalaryDialogOpen(false)} className="border border-stone-200 font-bold px-5 h-11 rounded-xl hover:bg-stone-50 cursor-pointer">إلغاء</button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </Card>
      )}

      {/* ────────────────── Tab 7: Purchase Orders ────────────────── */}
      {activeTab === "purchase-orders" && (
        <Card className="border border-stone-200/80 shadow-sm rounded-3xl p-6 bg-white space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg font-serif">إدارة طلبات الشراء والمشتريات</CardTitle>
              <CardDescription>متابعة التجهيزات والطلبيات الواردة من الأقسام وإدراجها بالمصروفات تلقائياً</CardDescription>
            </div>
            <button
              onClick={() => setPoDialogOpen(true)}
              className="bg-stone-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-black transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus size={15} />
              طلب شراء
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 border shadow-sm rounded-2xl bg-amber-50/20 text-amber-700">
              <p className="text-stone-400 text-xs font-bold">طلبات معلقة</p>
              <h4 className="text-xl font-black">{purchaseOrders.filter(p => p.status === 'pending').length} طلب</h4>
            </Card>
            <Card className="p-4 border shadow-sm rounded-2xl bg-blue-50/20 text-blue-700">
              <p className="text-stone-400 text-xs font-bold">طلبات معتمدة</p>
              <h4 className="text-xl font-black">{purchaseOrders.filter(p => p.status === 'approved').length} طلب</h4>
            </Card>
            <Card className="p-4 border shadow-sm rounded-2xl bg-purple-50/20 text-purple-700">
              <p className="text-stone-400 text-xs font-bold">تم شراؤها</p>
              <h4 className="text-xl font-black">{purchaseOrders.filter(p => p.status === 'purchased').length} طلب</h4>
            </Card>
            <Card className="p-4 border shadow-sm rounded-2xl bg-emerald-50/20 text-emerald-700">
              <p className="text-stone-400 text-xs font-bold">إجمالي مشتريات الشهر</p>
              <h4 className="text-xl font-black">${purchaseOrders.filter(p => p.status === 'received' || p.status === 'purchased').reduce((s, p) => s + parseFloat(p.total_amount || 0), 0).toFixed(2)}</h4>
            </Card>
          </div>

          <div className="flex justify-start items-center gap-2">
            <Label className="text-stone-500 font-bold">فلتر الحالة:</Label>
            <select
              value={poStatusFilter}
              onChange={e => setPoStatusFilter(e.target.value)}
              className="bg-stone-50 border border-stone-200 text-xs rounded-xl h-9 px-3 focus:outline-none font-bold"
            >
              <option value="all">كل الطلبات</option>
              <option value="pending">معلق</option>
              <option value="approved">موافق عليه</option>
              <option value="purchased">تم الشراء</option>
              <option value="received">تم الاستلام</option>
              <option value="cancelled">ملغى</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-stone-100 text-stone-400 text-xs font-bold">
                  <th className="pb-3">بيان السلعة</th>
                  <th className="pb-3">الفئة المالية</th>
                  <th className="pb-3">الكمية</th>
                  <th className="pb-3">القيمة الإجمالية</th>
                  <th className="pb-3">المورد المقترح</th>
                  <th className="pb-3">الحالة</th>
                  <th className="pb-3 text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrders.filter(po => poStatusFilter === 'all' || po.status === poStatusFilter).map(po => (
                  <tr key={po.id} className="border-b border-stone-50 text-sm hover:bg-stone-50/30">
                    <td className="py-4 font-bold text-stone-900">{po.item_description}</td>
                    <td className="py-4 text-stone-500 font-medium">{EXPENSE_CATS[po.category]?.label || po.category}</td>
                    <td className="py-4 num-en font-semibold">{po.quantity}</td>
                    <td className="py-4 num-en font-black">${parseFloat(po.total_amount).toFixed(2)}</td>
                    <td className="py-4 text-stone-500">{po.vendor || '—'}</td>
                    <td className="py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${PO_STATUS[po.status]?.badge || 'bg-stone-100 text-stone-850'}`}>
                        {PO_STATUS[po.status]?.label || po.status}
                      </span>
                    </td>
                    <td className="py-4 text-left space-x-2 space-x-reverse">
                      {po.status === 'pending' && (
                        <>
                          <button
                            onClick={() => approvePOMutation.mutate(po.id)}
                            className="text-xs bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-lg hover:bg-emerald-700 cursor-pointer"
                          >
                            موافقة
                          </button>
                          <button
                            onClick={() => cancelPOMutation.mutate(po.id)}
                            className="text-xs bg-rose-50 text-rose-700 font-bold px-3 py-1.5 rounded-lg hover:bg-rose-100 cursor-pointer"
                          >
                            إلغاء
                          </button>
                        </>
                      )}
                      {po.status === 'approved' && (
                        <>
                          <button
                            onClick={() => purchaseAsMutation.mutate(po)}
                            className="text-xs bg-purple-600 text-white font-bold px-3 py-1.5 rounded-lg hover:bg-purple-700 cursor-pointer"
                          >
                            تسجيل كمصروف
                          </button>
                          <button
                            onClick={() => cancelPOMutation.mutate(po.id)}
                            className="text-xs bg-stone-100 text-stone-600 font-semibold px-3 py-1.5 rounded-lg hover:bg-stone-200 cursor-pointer"
                          >
                            إلغاء
                          </button>
                        </>
                      )}
                      {po.status === 'purchased' && (
                        <button
                          onClick={() => receivePOMutation.mutate(po.id)}
                          className="text-xs bg-stone-900 text-white font-bold px-3 py-1.5 rounded-lg hover:bg-black cursor-pointer"
                        >
                          تأكيد الاستلام
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Dialog: إنشاء PO */}
          <Dialog open={poDialogOpen} onOpenChange={setPoDialogOpen}>
            <DialogContent className="max-w-md text-right">
              <DialogHeader>
                <DialogTitle className="font-serif text-lg">طلب شراء جديد</DialogTitle>
                <DialogDescription>إدراج طلب مشتريات لأقسام المدرسة</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreatePO} className="space-y-4 pt-3">
                <div className="space-y-1.5">
                  <Label>الفئة المالية</Label>
                  <select value={poCat} onChange={e => setPoCat(e.target.value)} className="w-full bg-stone-50 border border-stone-200 rounded-xl h-11 px-3 focus:outline-none">
                    {Object.entries(EXPENSE_CATS).filter(([k]) => k !== 'salaries').map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>تفاصيل ووصف السلعة</Label>
                  <Input value={poDesc} onChange={e => setPoDesc(e.target.value)} placeholder="مثال: 50 كرسي مجمع للمختبرات" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>الكمية</Label>
                    <Input type="number" value={poQty} onChange={e => setPoQty(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>إجمالي القيمة المقدرة</Label>
                    <Input type="number" value={poAmount} onChange={e => setPoAmount(e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>المورد المقترح</Label>
                  <Input value={poVendor} onChange={e => setPoVendor(e.target.value)} placeholder="المورد المقترح" />
                </div>

                <div className="flex gap-3 justify-end pt-3">
                  <button type="submit" className="bg-stone-900 text-white font-bold px-5 h-11 rounded-xl hover:bg-black cursor-pointer">تأكيد الطلب</button>
                  <button type="button" onClick={() => setPoDialogOpen(false)} className="border border-stone-200 font-bold px-5 h-11 rounded-xl hover:bg-stone-50 cursor-pointer">إلغاء</button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </Card>
      )}

      {/* ────────────────── Tab 8: مبيعات المتجر ────────────────── */}
      {activeTab === "store" && (
        <Card className="border border-stone-200/80 shadow-sm rounded-3xl p-6 bg-white space-y-6">
          <div>
            <CardTitle className="text-lg font-serif">سجل مبيعات المتجر والمحفظة</CardTitle>
            <CardDescription>العمليات المالية الخاصة بشراء المستلزمات، الزي، وشحن رصيد الطلاب</CardDescription>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-stone-100 text-stone-400 text-xs font-bold">
                  <th className="pb-3">المنتج / العملية</th>
                  <th className="pb-3">القيمة الكلية</th>
                  <th className="pb-3">طريقة الدفع</th>
                  <th className="pb-3">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map(p => (
                  <tr key={p.id} className="border-b border-stone-50 text-sm hover:bg-stone-50/30">
                    <td className="py-4 font-bold text-stone-900">
                      متجر: {p.item_name}
                      {p.quantity && <span className="text-xs text-stone-400 mr-2">({p.quantity} وحدة)</span>}
                    </td>
                    <td className="py-4 num-en font-black text-emerald-600">${parseFloat(p.total_price || p.total_amount).toFixed(2)}</td>
                    <td className="py-4 text-stone-500 font-semibold">{p.payment_method || 'عبر المحفظة'}</td>
                    <td className="py-4 text-stone-450">{new Date(p.created_at).toLocaleDateString('ar-EG')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ────────────────── Tab 9: التقارير ────────────────── */}
      {activeTab === "reports" && (
        <div className="space-y-6">
          <Card className="border border-stone-200/80 shadow-sm rounded-3xl p-6 bg-white">
            <div className="mb-6">
              <CardTitle className="text-lg font-serif">مركز التقارير المالية والتحليلات</CardTitle>
              <CardDescription>إصدار وطباعة كشوف الحسابات والموازنات السنوية المعتمدة</CardDescription>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-5 border rounded-2xl hover:bg-stone-50/50 cursor-pointer transition-all flex flex-col justify-between" onClick={printRevenueSummary}>
                <div>
                  <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                    <TrendingUp size={18} />
                  </div>
                  <h4 className="font-bold text-stone-850 text-sm">ملخص الإيرادات السنوي</h4>
                  <p className="text-xs text-stone-400 mt-1 font-semibold">كشف مصادر الدخل الكلية</p>
                </div>
                <div className="mt-4 flex justify-between items-center text-xs font-bold text-stone-900">
                  <span>طباعة التقرير</span>
                  <Printer size={13} />
                </div>
              </Card>

              <Card className="p-5 border rounded-2xl hover:bg-stone-50/50 cursor-pointer transition-all flex flex-col justify-between" onClick={printExpenseSummary}>
                <div>
                  <div className="h-9 w-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
                    <TrendingDown size={18} />
                  </div>
                  <h4 className="font-bold text-stone-850 text-sm">ملخص المصروفات</h4>
                  <p className="text-xs text-stone-400 mt-1 font-semibold">توزيع المصاريف التشغيلية والأجور</p>
                </div>
                <div className="mt-4 flex justify-between items-center text-xs font-bold text-stone-900">
                  <span>طباعة التقرير</span>
                  <Printer size={13} />
                </div>
              </Card>

              <Card className="p-5 border rounded-2xl hover:bg-stone-50/50 cursor-pointer transition-all flex flex-col justify-between" onClick={() => setStudentReportOpen(true)}>
                <div>
                  <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                    <Users size={18} />
                  </div>
                  <h4 className="font-bold text-stone-850 text-sm">كشف حساب طالب</h4>
                  <p className="text-xs text-stone-400 mt-1 font-semibold">تفاصيل معاملات وفواتير طالب محدد</p>
                </div>
                <div className="mt-4 flex justify-between items-center text-xs font-bold text-stone-900">
                  <span>تحديد الطالب والطباعة</span>
                  <Printer size={13} />
                </div>
              </Card>

              <Card className="p-5 border rounded-2xl hover:bg-stone-50/50 cursor-pointer transition-all flex flex-col justify-between" onClick={printOverdue}>
                <div>
                  <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                    <Clock size={18} />
                  </div>
                  <h4 className="font-bold text-stone-850 text-sm">الطلاب المتأخرون</h4>
                  <p className="text-xs text-stone-400 mt-1 font-semibold">تقرير بالمتأخرات والمبالغ غير المحصلة</p>
                </div>
                <div className="mt-4 flex justify-between items-center text-xs font-bold text-stone-900">
                  <span>طباعة التقرير</span>
                  <Printer size={13} />
                </div>
              </Card>

              <Card className="p-5 border rounded-2xl hover:bg-stone-50/50 cursor-pointer transition-all flex flex-col justify-between" onClick={() => setSalaryReportOpen(true)}>
                <div>
                  <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                    <Calendar size={18} />
                  </div>
                  <h4 className="font-bold text-stone-850 text-sm">كشف رواتب شهري</h4>
                  <p className="text-xs text-stone-400 mt-1 font-semibold">صرف أجور المدرسين والموظفين لشهر معين</p>
                </div>
                <div className="mt-4 flex justify-between items-center text-xs font-bold text-stone-900">
                  <span>تحديد الشهر والطباعة</span>
                  <Printer size={13} />
                </div>
              </Card>

              <Card className="p-5 border rounded-2xl hover:bg-stone-50/50 cursor-pointer transition-all flex flex-col justify-between" onClick={printStoreRevenue}>
                <div>
                  <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                    <ShoppingBag size={18} />
                  </div>
                  <h4 className="font-bold text-stone-850 text-sm">تقرير مبيعات المقصف</h4>
                  <p className="text-xs text-stone-400 mt-1 font-semibold">السلع الأكثر مبيعاً وعائداتها الكلية</p>
                </div>
                <div className="mt-4 flex justify-between items-center text-xs font-bold text-stone-900">
                  <span>طباعة التقرير</span>
                  <Printer size={13} />
                </div>
              </Card>

              <Card className="p-5 border rounded-2xl hover:bg-stone-50/50 cursor-pointer transition-all flex flex-col justify-between" onClick={printPurchaseOrders}>
                <div>
                  <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                    <ShoppingCart size={18} />
                  </div>
                  <h4 className="font-bold text-stone-850 text-sm">طلبات الشراء والمشتريات</h4>
                  <p className="text-xs text-stone-400 mt-1 font-semibold">الطلبيات الجارية والمستلمة وتكلفتها</p>
                </div>
                <div className="mt-4 flex justify-between items-center text-xs font-bold text-stone-900">
                  <span>طباعة التقرير</span>
                  <Printer size={13} />
                </div>
              </Card>

              <Card className="p-5 border rounded-2xl hover:bg-stone-50/50 cursor-pointer transition-all flex flex-col justify-between" onClick={printAnnualBalance}>
                <div>
                  <div className="h-9 w-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-3">
                    <FileSpreadsheet size={18} />
                  </div>
                  <h4 className="font-bold text-stone-850 text-sm">الميزان المالي السنوي</h4>
                  <p className="text-xs text-stone-400 mt-1 font-semibold">الميزانية العمومية الشاملة للمؤسسة</p>
                </div>
                <div className="mt-4 flex justify-between items-center text-xs font-bold text-stone-900">
                  <span>طباعة التقرير</span>
                  <Printer size={13} />
                </div>
              </Card>
            </div>
          </Card>

          {/* Dialog: كشف حساب طالب */}
          <Dialog open={studentReportOpen} onOpenChange={setStudentReportOpen}>
            <DialogContent className="max-w-md text-right">
              <DialogHeader>
                <DialogTitle className="font-serif text-lg">كشف حساب طالب محدد</DialogTitle>
                <DialogDescription>اختر الطالب لإعداد وطباعة التقرير المالي التفصيلي</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-3">
                <div className="space-y-1.5">
                  <Label>اسم الطالب</Label>
                  <select
                    value={reportStudentId}
                    onChange={e => setReportStudentId(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl h-11 px-3 focus:outline-none"
                  >
                    <option value="">اختر الطالب...</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.full_name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 justify-end pt-3">
                  <button onClick={printStudentStatementSubmit} className="bg-stone-900 text-white font-bold px-5 h-11 rounded-xl hover:bg-black cursor-pointer">تصدير وطباعة</button>
                  <button onClick={() => setStudentReportOpen(false)} className="border border-stone-200 font-bold px-5 h-11 rounded-xl hover:bg-stone-50 cursor-pointer">إلغاء</button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Dialog: كشف رواتب شهري */}
          <Dialog open={salaryReportOpen} onOpenChange={setSalaryReportOpen}>
            <DialogContent className="max-w-md text-right">
              <DialogHeader>
                <DialogTitle className="font-serif text-lg">كشف رواتب شهري</DialogTitle>
                <DialogDescription>حدد الشهر المطلوب لطباعة كشف رواتب الكادر الوظيفي للعام الحالي</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-3">
                <div className="space-y-1.5">
                  <Label>الشهر</Label>
                  <select
                    value={reportMonth}
                    onChange={e => setReportMonth(parseInt(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl h-11 px-3 focus:outline-none"
                  >
                    {['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'].map((m, idx) => (
                      <option key={m} value={idx}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 justify-end pt-3">
                  <button onClick={printSalariesSubmit} className="bg-stone-900 text-white font-bold px-5 h-11 rounded-xl hover:bg-black cursor-pointer">تصدير وطباعة</button>
                  <button onClick={() => setSalaryReportOpen(false)} className="border border-stone-200 font-bold px-5 h-11 rounded-xl hover:bg-stone-50 cursor-pointer">إلغاء</button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
