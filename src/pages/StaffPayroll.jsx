import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/dbClient";
import { 
  DollarSign, 
  Search, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  Percent,
  Plus,
  ArrowUpRight,
  TrendingDown,
  Edit2,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import PageHeader from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all border-2 border-stone-200 bg-white text-stone-800 hover:bg-stone-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const btnPrimary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed";

export default function StaffPayroll({ isEmbedded = false }) {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

  // حوار التعديل اليدوي
  const [editingMember, setEditingMember] = useState(null);
  const [editBasic, setEditBasic] = useState("");
  const [editAllowances, setEditAllowances] = useState("");
  const [editDeductions, setEditDeductions] = useState("");

  // جلب قائمة الموظفين
  const { data: staffMembers = [], isLoading: isLoadingStaff } = useQuery({ 
    queryKey: ["staff-members"], 
    queryFn: () => entities.StaffMember.list("-created_at", 200),
    staleTime: 1000 * 60 * 5
  });

  // جلب قائمة المعلمين
  const { data: teachers = [], isLoading: isLoadingTeachers } = useQuery({ 
    queryKey: ["teachers"], 
    queryFn: () => entities.Teacher.list("-created_at", 200),
    staleTime: 1000 * 60 * 5
  });

  // جلب رواتب الشهر المحددة للمزامنة
  const { data: salaryRecords = [] } = useQuery({ 
    queryKey: ["salary-records"], 
    queryFn: () => entities.SalaryRecord.list("-created_at", 1000),
  });

  const isLoading = isLoadingStaff || isLoadingTeachers;

  const combinedList = useMemo(() => {
    const formattedStaff = staffMembers.map(member => ({
      ...member,
      isTeacher: false
    }));
    const formattedTeachers = teachers.map(teacher => ({
      ...teacher,
      isTeacher: true,
      role: teacher.role || "Teacher"
    }));
    return [...formattedStaff, ...formattedTeachers];
  }, [staffMembers, teachers]);

  // التعديلات اليدوية المحفوظة
  const [customPayrollData, setCustomPayrollData] = useState(() => {
    const saved = localStorage.getItem("staff_customized_payroll");
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem("staff_customized_payroll", JSON.stringify(customPayrollData));
  }, [customPayrollData]);

  // استرجاع السلف المعتمدة من صفحة الطلبات
  const approvedLoans = useMemo(() => {
    const saved = localStorage.getItem("staff_approved_loans");
    return saved ? JSON.parse(saved) : [];
  }, [requestsTriggered => localStorage.getItem("staff_approved_loans")]);

  // احتساب مسير الرواتب ودمج السلف والتعديلات اليدوية
  const payrollList = useMemo(() => {
    return combinedList.map(member => {
      // 1. حساب القيم الأساسية الافتراضية
      let basic = 4000;
      if (member.salary !== undefined && member.salary !== null) {
        basic = Number(member.salary);
      } else if (member.isTeacher) {
        basic = 8000; // الراتب الافتراضي للمعلم في حال لم يتم تعيينه بقاعدة البيانات
      } else if (member.role === "Admin") {
        basic = 9000;
      } else if (member.role === "HR") {
        basic = 6500;
      } else if (member.role === "Accountant") {
        basic = 7000;
      } else if (member.role === "Registrar") {
        basic = 5500;
      }

      let allowances = Math.round(basic * 0.15); // 15% بدلات افتراضية
      
      // 2. حساب استقطاع السلفة إذا كانت معتمدة
      const memberLoans = approvedLoans.filter(l => l.employeeName === (member.full_name || member.name));
      const loanDeduction = memberLoans.reduce((sum, loan) => sum + loan.amount, 0);
      
      let deductions = (member.status === "on_leave" ? Math.round(basic * 0.05) : 0) + loanDeduction;

      // 3. تطبيق التعديلات اليدوية إن وجدت
      const customData = customPayrollData[member.id];
      if (customData) {
        if (customData.basic !== undefined) basic = Number(customData.basic);
        if (customData.allowances !== undefined) allowances = Number(customData.allowances);
        if (customData.deductions !== undefined) deductions = Number(customData.deductions);
      }

      const net = basic + allowances - deductions;

      const monthStr = MONTHS_AR[selectedMonth - 1];
      const existingRecord = salaryRecords.find(r => 
        r.employee_name === (member.full_name || member.name) && 
        r.month === monthStr && 
        r.year === new Date().getFullYear()
      );

      return {
        ...member,
        basic,
        allowances,
        deductions,
        loanDeduction,
        net,
        isPaid: !!existingRecord,
        existingRecord
      };
    });
  }, [combinedList, customPayrollData, approvedLoans, salaryRecords, selectedMonth]);

  // إحصائيات الرواتب
  const stats = useMemo(() => {
    const total = payrollList.reduce((acc, curr) => acc + curr.net, 0);
    const avg = payrollList.length ? Math.round(total / payrollList.length) : 0;
    const allowances = payrollList.reduce((acc, curr) => acc + curr.allowances, 0);
    const deductions = payrollList.reduce((acc, curr) => acc + curr.deductions, 0);

    return { total, avg, allowances, deductions };
  }, [payrollList]);

  // فلترة القائمة
  const filteredPayroll = useMemo(() => {
    return payrollList.filter(member => 
      (member.full_name || member.name)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [payrollList, searchTerm]);

  // بدء التعديل اليدوي
  const handleStartEdit = (member) => {
    setEditingMember(member);
    setEditBasic(member.basic.toString());
    setEditAllowances(member.allowances.toString());
    setEditDeductions(member.deductions.toString());
  };

  // حفظ التعديل اليدوي
  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingMember) return;

    setCustomPayrollData(prev => ({
      ...prev,
      [editingMember.id]: {
        basic: Number(editBasic),
        allowances: Number(editAllowances),
        deductions: Number(editDeductions)
      }
    }));

    toast.success(
      isRTL 
        ? `تم تعديل تفاصيل مسير راتب الموظف ${editingMember.full_name || editingMember.name} يدوياً.` 
        : `Payroll details for ${editingMember.full_name || editingMember.name} updated manually.`
    );
    setEditingMember(null);
  };

  const createSalaryMutation = useMutation({
    mutationFn: (data) => entities.SalaryRecord.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["salary-records"]);
    }
  });

  const handleApprovePayroll = (member) => {
    if (member.isPaid) return;
    const employeeName = member.full_name || member.name;
    const payload = {
      employee_name: employeeName,
      employee_type: member.isTeacher ? 'teacher' : 'staff',
      base_salary: member.basic,
      allowances: member.allowances,
      deductions: member.deductions - member.loanDeduction, // pure deductions
      advances: member.loanDeduction,
      net_salary: member.net,
      month: MONTHS_AR[selectedMonth - 1],
      year: new Date().getFullYear(),
      payment_method: 'bank_transfer',
      status: 'pending' // Let accountant review and pay
    };

    createSalaryMutation.mutate(payload, {
      onSuccess: () => {
        toast.success(
          isRTL 
            ? `تم اعتماد مسير الراتب للموظف ${employeeName} للشهر الحالي بنجاح.` 
            : `Payroll for ${employeeName} approved for this month successfully.`
        );
      }
    });
  };

  const handleApproveAll = async () => {
    const unapproved = payrollList.filter(m => !m.isPaid);
    if (unapproved.length === 0) {
      toast.info(isRTL ? "تم صرف رواتب جميع الموظفين مسبقاً." : "All payrolls are already paid.");
      return;
    }
    
    // Create sequentially to avoid database connection pool overload
    let successCount = 0;
    toast.info(isRTL ? "جاري اعتماد الرواتب، يرجى الانتظار..." : "Approving payrolls, please wait...");
    
    for (const member of unapproved) {
      try {
        await entities.SalaryRecord.create({
          employee_name: member.full_name || member.name,
          employee_type: member.isTeacher ? 'teacher' : 'staff',
          base_salary: member.basic,
          allowances: member.allowances,
          deductions: member.deductions - member.loanDeduction,
          advances: member.loanDeduction,
          net_salary: member.net,
          month: MONTHS_AR[selectedMonth - 1],
          year: new Date().getFullYear(),
          payment_method: 'bank_transfer',
          status: 'pending' // Let accountant review and pay
        });
        successCount++;
      } catch (err) {
        console.error("Failed to create salary for", member.full_name || member.name, err);
      }
    }

    queryClient.invalidateQueries(["salary-records"]);
    
    if (successCount > 0) {
      toast.success(
        isRTL 
          ? `تم إرسال مسيرات الرواتب لكافة الموظفين (${successCount}) بنجاح لتظهر عند المحاسب.` 
          : `Sent payroll sheets for ${successCount} employees to Finance successfully.`
      );
    }
  };

  const getRoleDisplay = (role) => {
    const map = {
      'Admin': { label: isRTL ? 'مدير نظام' : 'Admin' },
      'HR': { label: isRTL ? 'موارد بشرية' : 'HR' },
      'Accountant': { label: isRTL ? 'محاسب' : 'Accountant' },
      'Registrar': { label: isRTL ? 'مسجل' : 'Registrar' },
      'bus_supervisor': { label: isRTL ? 'مشرف حافلة' : 'Bus Supervisor' },
      'store_keeper': { label: isRTL ? 'أمين مستودع' : 'Store Keeper' },
      'security': { label: isRTL ? 'حارس أمن' : 'Security' },
      'Teacher': { label: isRTL ? 'معلم' : 'Teacher' },
      'teacher': { label: isRTL ? 'معلم' : 'Teacher' },
    };
    return map[role] || { label: role };
  };

  return (
    <div className={`space-y-6 ${isEmbedded ? '' : 'pb-20'}`} dir={isRTL ? "rtl" : "ltr"}>
      {!isEmbedded && (
        <PageHeader 
          title={isRTL ? "مسير الرواتب والكشوفات" : "Staff Payroll Sheets"} 
          subtitle={isRTL ? "توزيع واحتساب الرواتب الشهرية والبدلات والاستقطاعات التفاعلية مع دعم السلف المعتمدة" : "Manage staff monthly salaries, allowances, deductions and approved loans"}
        >
          <button onClick={handleApproveAll} className={`${btnPrimary} h-11 px-5`}>
            <CheckCircle2 size={18} />
            <span>{isRTL ? "اعتماد مسير الجميع" : "Approve All Sheets"}</span>
          </button>
        </PageHeader>
      )}

      {isEmbedded && (
        <div className="flex justify-end mb-4">
          <button onClick={handleApproveAll} className={`${btnPrimary} h-11 px-5`}>
            <CheckCircle2 size={18} />
            <span>{isRTL ? "اعتماد مسير الجميع" : "Approve All Sheets"}</span>
          </button>
        </div>
      )}

      {/* بطاقات الإحصائيات المالية للرواتب */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            label: isRTL ? "إجمالي كشف الرواتب" : "Total Payroll Cost",
            value: `${stats.total.toLocaleString()} ر.س`,
            icon: DollarSign,
            color: "text-emerald-600",
            bg: "bg-emerald-50"
          },
          {
            label: isRTL ? "متوسط الرواتب" : "Average Salary",
            value: `${stats.avg.toLocaleString()} ر.س`,
            icon: TrendingUp,
            color: "text-primary",
            bg: "bg-primary/5"
          },
          {
            label: isRTL ? "إجمالي البدلات" : "Total Allowances",
            value: `${stats.allowances.toLocaleString()} ر.س`,
            icon: ArrowUpRight,
            color: "text-blue-600",
            bg: "bg-blue-50"
          },
          {
            label: isRTL ? "إجمالي الاستقطاعات" : "Total Deductions",
            value: `${stats.deductions.toLocaleString()} ر.س`,
            icon: TrendingDown,
            color: "text-rose-600",
            bg: "bg-rose-50"
          },
        ].map((stat, i) => (
          <Card key={i} className="p-5 border shadow-sm bg-white rounded-2xl flex items-center justify-between group overflow-hidden relative">
            <div>
              <p className="text-stone-400 text-[10px] font-bold uppercase tracking-wider mb-1">{stat.label}</p>
              <h4 className="text-xl font-black text-stone-900 num-en">{isLoading ? "..." : stat.value}</h4>
            </div>
            <div className={`h-11 w-11 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color} group-hover:scale-105 transition-transform`}>
              <stat.icon size={22} />
            </div>
          </Card>
        ))}
      </div>

      {/* البحث وفلترة الشهر */}
      <div className="flex flex-col md:flex-row items-center gap-4 justify-between">
        <Card className="p-2 border shadow-sm bg-white rounded-xl w-full md:w-96">
          <div className="relative">
            <Search className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-stone-400`} size={18} />
            <Input 
              placeholder={isRTL ? "ابحث بالاسم أو الرقم الوظيفي..." : "Search employee..."} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`h-10 ${isRTL ? 'pr-12' : 'pl-12'} border-none bg-transparent text-sm font-medium focus-visible:ring-0`}
              dir={isRTL ? "rtl" : "ltr"}
            />
          </div>
        </Card>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-stone-500">{isRTL ? "شهر المسير:" : "Payroll Month:"}</span>
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="bg-white border-2 border-stone-200 rounded-xl h-10 px-3 text-xs font-bold text-stone-700 outline-none focus:border-primary transition-colors cursor-pointer"
          >
            {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
              <option key={m} value={m}>
                {isRTL ? `شهر ${m}` : `Month ${m}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* كشوفات الموظفين */}
      <Card className="border shadow-sm bg-white rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100">
                <th className="px-6 py-3.5 text-xs font-bold text-stone-500 text-start">{isRTL ? "الموظف" : "Employee"}</th>
                <th className="px-6 py-3.5 text-xs font-bold text-stone-500 text-start">{isRTL ? "الراتب الأساسي" : "Basic Salary"}</th>
                <th className="px-6 py-3.5 text-xs font-bold text-stone-500 text-start">{isRTL ? "البدلات" : "Allowances"}</th>
                <th className="px-6 py-3.5 text-xs font-bold text-stone-500 text-start">{isRTL ? "الاستقطاعات" : "Deductions"}</th>
                <th className="px-6 py-3.5 text-xs font-bold text-stone-500 text-start">{isRTL ? "صافي الراتب" : "Net Salary"}</th>
                <th className="px-6 py-3.5 text-xs font-bold text-stone-500 text-end">{isRTL ? "الإجراءات" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-stone-400 font-bold">
                    {isRTL ? "جاري تحميل بيانات المسير..." : "Loading payroll database..."}
                  </td>
                </tr>
              ) : filteredPayroll.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-stone-400 font-bold">
                    {isRTL ? "لا توجد نتائج مطابقة لبحثك." : "No records found."}
                  </td>
                </tr>
              ) : (
                filteredPayroll.map((member) => (
                  <tr key={member.id} className="hover:bg-stone-50/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-stone-100 flex items-center justify-center font-bold text-stone-600 text-sm">
                          {(member.full_name || member.name)?.[0]}
                        </div>
                        <div>
                          <p className="font-bold text-stone-900">{member.full_name || member.name}</p>
                          <p className="text-[10px] text-stone-400 font-semibold">{getRoleDisplay(member.role).label}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-stone-800 num-en">
                      {member.basic.toLocaleString()} ر.س
                    </td>
                    <td className="px-6 py-4 text-emerald-600 font-semibold num-en">
                      +{member.allowances.toLocaleString()} ر.س
                    </td>
                    <td className="px-6 py-4 text-rose-500 font-semibold num-en">
                      {member.deductions > 0 ? (
                        <div className="flex flex-col">
                          <span>-{member.deductions.toLocaleString()} ر.س</span>
                          {member.loanDeduction > 0 && (
                            <span className="text-[10px] text-amber-600 font-bold bg-amber-50 rounded px-1.5 py-0.5 mt-0.5 w-fit">
                              {isRTL ? `منها سلفة: ${member.loanDeduction.toLocaleString()} ر.س` : `incl. loan: ${member.loanDeduction.toLocaleString()}`}
                            </span>
                          )}
                        </div>
                      ) : "0 ر.س"}
                    </td>
                    <td className="px-6 py-4 font-black text-stone-900 num-en">
                      {member.net.toLocaleString()} ر.س
                    </td>
                    <td className="px-6 py-4 text-end">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleStartEdit(member)}
                          className="inline-flex items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-700 h-9 w-9 hover:bg-stone-50 transition-colors cursor-pointer disabled:opacity-50"
                          title={isRTL ? "تعديل يدوي" : "Edit payroll manually"}
                          disabled={member.isPaid}
                        >
                          <Edit2 size={14} />
                        </button>
                        {member.existingRecord ? (
                          <div className={`inline-flex items-center gap-1.5 rounded-xl font-bold text-xs h-9 px-3.5 border ${
                            member.existingRecord.status === 'paid' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {member.existingRecord.status === 'paid' ? <CheckCircle2 size={14} /> : <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>}
                            {member.existingRecord.status === 'paid' 
                              ? (isRTL ? "مصروف" : "Paid") 
                              : (isRTL ? "بانتظار الصرف" : "Pending")}
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleApprovePayroll(member)}
                            className="inline-flex items-center justify-center rounded-xl bg-stone-900 text-white font-bold text-xs h-9 px-3.5 hover:bg-stone-800 transition-colors cursor-pointer disabled:opacity-50"
                            disabled={createSalaryMutation.isPending}
                          >
                            {createSalaryMutation.isPending ? "..." : (isRTL ? "اعتماد" : "Approve")}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* حوار التعديل اليدوي للمسير */}
      <Dialog open={editingMember !== null} onOpenChange={(open) => !open && setEditingMember(null)}>
        <DialogContent className="max-w-md rounded-3xl" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="text-lg font-serif font-black">
              {isRTL ? "تعديل تفاصيل المسير يدوياً" : "Manual Payroll Adjustment"}
            </DialogTitle>
            {editingMember && (
              <p className="text-xs text-stone-400 font-bold mt-1">
                {editingMember.full_name || editingMember.name} ( {getRoleDisplay(editingMember.role).label} )
              </p>
            )}
          </DialogHeader>

          {editingMember && (
            <form onSubmit={handleSaveEdit} className="space-y-4 mt-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-500">{isRTL ? "الراتب الأساسي (ر.س)" : "Basic Salary (SAR)"}</label>
                <Input 
                  type="number" 
                  value={editBasic} 
                  onChange={(e) => setEditBasic(e.target.value)} 
                  className="rounded-xl border-stone-200"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-500">{isRTL ? "البدلات والمستحقات (ر.س)" : "Allowances (SAR)"}</label>
                <Input 
                  type="number" 
                  value={editAllowances} 
                  onChange={(e) => setEditAllowances(e.target.value)} 
                  className="rounded-xl border-stone-200"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-500">
                  {isRTL ? "إجمالي الاستقطاعات والخصومات (ر.س)" : "Deductions (SAR)"}
                </label>
                <Input 
                  type="number" 
                  value={editDeductions} 
                  onChange={(e) => setEditDeductions(e.target.value)} 
                  className="rounded-xl border-stone-200"
                  required
                />
                {editingMember.loanDeduction > 0 && (
                  <div className="flex items-center gap-1.5 mt-1 text-[11px] text-amber-600 font-bold bg-amber-50 p-2 rounded-lg">
                    <AlertCircle size={13} />
                    <span>
                      {isRTL 
                        ? `هناك سلفة معتمدة بقيمة ${editingMember.loanDeduction.toLocaleString()} ر.س متضمنة تلقائياً.` 
                        : `An approved loan of ${editingMember.loanDeduction.toLocaleString()} SAR is included.`}
                    </span>
                  </div>
                )}
              </div>

              {/* حساب تفاعلي فوري لصافي الراتب */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 flex items-center justify-between">
                <span className="text-xs font-bold text-stone-500">{isRTL ? "صافي الراتب المتوقع:" : "Calculated Net Salary:"}</span>
                <span className="text-base font-black text-stone-900 num-en">
                  {(Number(editBasic || 0) + Number(editAllowances || 0) - Number(editDeductions || 0)).toLocaleString()} ر.س
                </span>
              </div>

              <DialogFooter className="pt-2 flex gap-2">
                <button 
                  type="button" 
                  onClick={() => setEditingMember(null)} 
                  className={`${btnOutline} rounded-xl h-10 px-4`}
                >
                  {isRTL ? "إلغاء" : "Cancel"}
                </button>
                <button 
                  type="submit" 
                  className={`${btnPrimary} h-10 px-4`}
                >
                  {isRTL ? "حفظ التعديلات" : "Save changes"}
                </button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
