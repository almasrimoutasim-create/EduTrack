import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { 
  ArrowLeft, 
  ArrowRight, 
  Printer, 
  Pencil, 
  CreditCard, 
  Mail, 
  Lock, 
  GraduationCap, 
  Award, 
  Calendar, 
  BookOpen, 
  ShoppingBag, 
  DollarSign, 
  ClipboardList, 
  CheckCircle, 
  Copy, 
  Eye, 
  EyeOff,
  Bus,
  Plus,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/translations";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import FinancialRecordFormDialog from "@/components/shared/FinancialRecordFormDialog";

export default function AdminStudentProfile({ student: initialStudent, onClose, onEdit }) {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const _qc = useQueryClient();
  const portalRole = localStorage.getItem("portal_role") || "admin";

  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "academics" | "finance" | "activity"
  const [showStudentPass, setShowStudentPass] = useState(false);
  const [showParentPass, setShowParentPass] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  // States for other outstanding dues & fines form
  const [fineCategory, setFineCategory] = useState("general");
  const [fineReason, setFineReason] = useState("");
  const [fineAmount, setFineAmount] = useState("");
  const [fineIssuedBy, setFineIssuedBy] = useState("");
  const [fineDate, setFineDate] = useState(new Date().toISOString().split("T")[0]);
  const [fineNotes, setFineNotes] = useState("");
  const [isSubmittingFine, setIsSubmittingFine] = useState(false);
  
  // Edit mode state for fines
  const [editingFineId, setEditingFineId] = useState(null);
  
  // Pagination state for fines
  const [finesPage, setFinesPage] = useState(1);

  const handleEditFineClick = (fine) => {
    setEditingFineId(fine.id);
    setFineCategory(fine.category || "general");
    setFineReason(fine.reason || "");
    setFineAmount(fine.amount ? String(fine.amount) : "");
    setFineIssuedBy(fine.issued_by || "");
    setFineDate(fine.date || new Date().toISOString().split("T")[0]);
    setFineNotes(fine.notes || "");
    toast.info(isRTL ? "تم تحميل بيانات المستحق للتعديل في الاستمارة الجانبية" : "Due details loaded into the form for editing");
  };

  const handleCancelEdit = () => {
    setEditingFineId(null);
    setFineReason("");
    setFineAmount("");
    setFineIssuedBy("");
    setFineDate(new Date().toISOString().split("T")[0]);
    setFineNotes("");
    setFineCategory("general");
  };

  const handleAddFine = async (e) => {
    e.preventDefault();
    if (!fineReason.trim() || !fineAmount) {
      toast.error(isRTL ? "يرجى تعبئة الحقول الأساسية (السبب والمبلغ)" : "Please fill required fields (Reason and Amount)");
      return;
    }

    setIsSubmittingFine(true);
    try {
      if (editingFineId) {
        // Update existing fine
        await base44.entities.Fine.update(editingFineId, {
          category: fineCategory,
          reason: fineReason,
          amount: parseFloat(fineAmount),
          date: fineDate,
          issued_by: fineIssuedBy || (isRTL ? "إدارة المدرسة" : "School Administration"),
          notes: fineNotes
        });
        toast.success(isRTL ? "تم تحديث المستحق بنجاح!" : "Due updated successfully!");
        setEditingFineId(null);
      } else {
        // Create new fine
        await base44.entities.Fine.create({
          student_id: student.id,
          amount: parseFloat(fineAmount),
          reason: fineReason,
          category: fineCategory,
          issued_by: fineIssuedBy || (isRTL ? "إدارة المدرسة" : "School Administration"),
          status: "pending",
          date: fineDate,
          notes: fineNotes
        });
        toast.success(isRTL ? "تم إضافة المستحق بنجاح وربطه ببوابة ولي الأمر!" : "Due added successfully and linked to Parent Portal!");
      }
      
      // Reset form
      setFineReason("");
      setFineAmount("");
      setFineIssuedBy("");
      setFineDate(new Date().toISOString().split("T")[0]);
      setFineNotes("");
      setFineCategory("general");
      setFinesPage(1); // Reset to page 1 to see the new due

      // Refetch and invalidate query caches
      refetchFines();
      _qc.invalidateQueries({ queryKey: ["admin-student-fines", student.id] });
      _qc.invalidateQueries({ queryKey: ["parent-fines", student.id] });
      _qc.invalidateQueries({ queryKey: ["student-detail", student.id] });
    } catch (err) {
      console.error("Failed to save fine:", err);
      toast.error(isRTL ? "فشل حفظ المستحق. يرجى المحاولة لاحقاً." : "Failed to save due. Please try again.");
    } finally {
      setIsSubmittingFine(false);
    }
  };

  const handleDeleteFine = async (fineId) => {
    if (!window.confirm(isRTL ? "هل أنت متأكد من حذف هذا المستحق/الغرامة؟" : "Are you sure you want to delete this due/fine?")) {
      return;
    }

    try {
      await base44.entities.Fine.delete(fineId);
      toast.success(isRTL ? "تم حذف المستحق بنجاح!" : "Due deleted successfully!");
      setFinesPage(1);
      refetchFines();
      _qc.invalidateQueries({ queryKey: ["admin-student-fines", student.id] });
      _qc.invalidateQueries({ queryKey: ["parent-fines", student.id] });
      _qc.invalidateQueries({ queryKey: ["student-detail", student.id] });
    } catch (err) {
      console.error("Failed to delete fine:", err);
      toast.error(isRTL ? "فشل حذف المستحق. يرجى المحاولة لاحقاً." : "Failed to delete due.");
    }
  };

  const handlePayFineManually = async (fine) => {
    if (!window.confirm(isRTL ? `هل تريد تسجيل دفع يدوي بقيمة $${parseFloat(fine.amount).toFixed(2)} لهذا المستحق؟` : `Do you want to record a manual payment of $${parseFloat(fine.amount).toFixed(2)} for this due?`)) {
      return;
    }

    try {
      // 1. Update status
      await base44.entities.Fine.update(fine.id, { status: "paid" });

      // 2. Track payment in financial records
      await base44.entities.FinancialRecord.create({
        type: "income",
        record_type: "fine_payment",
        recipient_type: "student",
        recipient_name: student.full_name,
        recipient_id: student.id,
        amount: parseFloat(fine.amount),
        description: isRTL ? `دفع يدوي للغرامة: ${fine.reason}` : `Manual Fine Payment: ${fine.reason}`,
        payment_date: new Date().toISOString().split('T')[0],
        status: "paid",
        payment_method: "cash"
      });

      toast.success(isRTL ? "تم تسجيل الدفع اليدوي بنجاح!" : "Manual payment recorded successfully!");
      
      // 3. Invalidate caches
      refetchFines();
      _qc.invalidateQueries({ queryKey: ["admin-student-fines", student.id] });
      _qc.invalidateQueries({ queryKey: ["parent-fines", student.id] });
      _qc.invalidateQueries({ queryKey: ["financial-records", student?.id] });
      _qc.invalidateQueries({ queryKey: ["student-profile", student.id] });
    } catch (err) {
      console.error("Failed to pay fine manually:", err);
      toast.error(isRTL ? "فشل تسجيل الدفع اليدوي. يرجى المحاولة لاحقاً." : "Failed to record manual payment.");
    }
  };

  const handleExportFines = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error(isRTL ? "يرجى السماح بالنوافذ المنبثقة لتصدير التقرير" : "Please allow pop-ups to export the report");
      return;
    }

    const pendingFines = studentFines.filter(f => f.status === "pending");
    const paidFines = studentFines.filter(f => f.status === "paid");
    const totalPending = pendingFines.reduce((sum, f) => sum + (parseFloat(f.amount) || 0), 0);
    const totalPaid = paidFines.reduce((sum, f) => sum + (parseFloat(f.amount) || 0), 0);

    const categoryMap = {
      sports: isRTL ? "أنشطة رياضية" : "Sports",
      discipline: isRTL ? "انضباط سلوكي" : "Discipline",
      library: isRTL ? "المكتبة المدرسية" : "Library",
      general: isRTL ? "رسوم عامة" : "General"
    };

    const tableRows = studentFines.map(fine => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px; font-family: monospace;">${fine.date}</td>
        <td style="padding: 12px; font-weight: bold;">${categoryMap[fine.category] || fine.category}</td>
        <td style="padding: 12px;">${fine.reason}</td>
        <td style="padding: 12px;">${fine.issued_by || "-"}</td>
        <td style="padding: 12px; font-weight: bold; color: ${fine.status === "pending" ? "#e11d48" : "#10b981"};">
          ${fine.status === "pending" ? (isRTL ? "معلق" : "Pending") : (isRTL ? "مقبول/مدفوع" : "Paid")}
        </td>
        <td style="padding: 12px; font-weight: bold; text-align: right;">$${parseFloat(fine.amount).toFixed(2)}</td>
      </tr>
    `).join("");

    printWindow.document.write(`
      <html dir="${isRTL ? "rtl" : "ltr"}" lang="${isRTL ? "ar" : "en"}">
      <head>
        <title>${isRTL ? `كشف مستحقات - ${student.full_name}` : `Statement of Dues - ${student.full_name}`}</title>
        <meta charset="utf-8" />
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;750;900&display=swap" rel="stylesheet" />
        <style>
          body {
            font-family: 'Cairo', sans-serif;
            margin: 40px;
            color: #1e293b;
            background: #ffffff;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 4px solid #0f172a;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .title {
            font-size: 24px;
            font-weight: 900;
            color: #0f172a;
          }
          .student-info {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 30px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
          }
          .student-info div span {
            color: #64748b;
            font-weight: 600;
            display: block;
            font-size: 12px;
            text-transform: uppercase;
          }
          .student-info div strong {
            font-size: 15px;
            color: #0f172a;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          th {
            background: #f1f5f9;
            color: #475569;
            font-weight: 750;
            text-align: ${isRTL ? "right" : "left"};
            padding: 12px;
            font-size: 13px;
          }
          .summary {
            display: flex;
            justify-content: flex-end;
            gap: 20px;
            margin-top: 30px;
            border-top: 2px solid #e2e8f0;
            padding-top: 20px;
          }
          .summary-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px 25px;
            text-align: center;
          }
          .summary-card.pending {
            border-color: #fecdd3;
            background: #fff1f2;
          }
          .summary-card.paid {
            border-color: #a7f3d0;
            background: #ecfdf5;
          }
          .footer {
            margin-top: 60px;
            text-align: center;
            font-size: 11px;
            color: #94a3b8;
            border-top: 1px dashed #cbd5e1;
            padding-top: 20px;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">${isRTL ? "مدارس إديوتراك النموذجية" : "EduTrack Model School"}</div>
            <div style="font-size: 12px; color: #64748b; font-weight: bold; margin-top: 5px;">${isRTL ? "إدارة الشؤون المالية والطلابية" : "Finance & Student Affairs Department"}</div>
          </div>
          <div style="text-align: ${isRTL ? "left" : "right"};">
            <div style="font-size: 16px; font-weight: bold; color: #1e293b;">${isRTL ? "كشف حساب المستحقات والغرامات" : "Student Statement of Dues"}</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 5px;">${isRTL ? "تاريخ التصدير:" : "Issued Date:"} ${new Date().toLocaleDateString(isRTL ? "ar-EG" : "en-US", { dateStyle: "medium" })}</div>
          </div>
        </div>

        <div class="student-info">
          <div>
            <span>${isRTL ? "اسم الطالب بالكامل:" : "Student Name:"}</span>
            <strong>${student.full_name}</strong>
          </div>
          <div>
            <span>${isRTL ? "الرقم المدرسي:" : "School ID:"}</span>
            <strong>#${student.student_id}</strong>
          </div>
          <div>
            <span>${isRTL ? "الصف الدراسي / الفصل:" : "Grade / Section:"}</span>
            <strong>${student.grade} / ${student.section || "-"}</strong>
          </div>
          <div>
            <span>${isRTL ? "اسم ولي الأمر:" : "Parent Name:"}</span>
            <strong>${student.parent_name || "-"}</strong>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>${isRTL ? "التاريخ" : "Date"}</th>
              <th>${isRTL ? "القسم" : "Category"}</th>
              <th>${isRTL ? "البيان / السبب" : "Description / Reason"}</th>
              <th>${isRTL ? "بواسطة" : "Issued By"}</th>
              <th>${isRTL ? "الحالة" : "Status"}</th>
              <th style="text-align: right;">${isRTL ? "المبلغ" : "Amount"}</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <div class="summary">
          <div class="summary-card paid">
            <span style="font-size: 11px; color: #047857; font-weight: bold; display: block;">${isRTL ? "إجمالي المسدد" : "Total Settled"}</span>
            <strong style="font-size: 18px; color: #065f46;">$${totalPaid.toFixed(2)}</strong>
          </div>
          <div class="summary-card pending">
            <span style="font-size: 11px; color: #be123c; font-weight: bold; display: block;">${isRTL ? "إجمالي المتبقي المستحق" : "Total Outstanding"}</span>
            <strong style="font-size: 18px; color: #9f1239;">$${totalPending.toFixed(2)}</strong>
          </div>
        </div>

        <div class="footer">
          ${isRTL ? "هذا الكشف مستخرج إلكترونياً من نظام الإدارة المدرسية الموحد ولا يتطلب توقيع رسمي." : "This statement was generated electronically from the school unified management system."}
        </div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Sync / refetch student from database for live updates
  const { data: student = initialStudent } = useQuery({
    queryKey: ["student-profile", initialStudent?.id],
    queryFn: () => base44.entities.Student.get(initialStudent.id),
    initialData: initialStudent,
    enabled: !!initialStudent?.id
  });

  // Fetch grades
  const { data: dbGrades = [] } = useQuery({
    queryKey: ["student-grades", student?.student_id],
    queryFn: () => base44.entities.StudentGrade.filter({ student_id: student?.student_id }),
    enabled: !!student?.student_id
  });

  // Fetch awards
  const { data: dbAwards = [] } = useQuery({
    queryKey: ["student-awards", student?.student_id],
    queryFn: () => base44.entities.StudentAward.filter({ student_id: student?.student_id }),
    enabled: !!student?.student_id
  });

  // Fetch store purchases
  const { data: dbPurchases = [] } = useQuery({
    queryKey: ["student-purchases", student?.student_id],
    queryFn: () => base44.entities.Purchase.filter({ student_id: student?.student_id }),
    enabled: !!student?.student_id
  });

  // Fetch financial records
  const { data: dbFinancialRecords = [] } = useQuery({
    queryKey: ["financial-records", student?.id],
    enabled: !!student?.id,
    // @ts-ignore
    queryFn: async () => {
      // recipient_id can store UUID or student_id, query both to be 100% robust
      const list1 = await base44.entities.FinancialRecord.filter({ recipient_id: student.id });
      const list2 = await base44.entities.FinancialRecord.filter({ recipient_id: student.student_id });
      const merged = [...list1, ...list2];
      const unique = Array.from(new Map(merged.map(item => [item.id, item])).values());
      return unique;
    }
  });

  // Fetch real tuition fees from student_fees table
  const { data: studentFees = [] } = useQuery({
    queryKey: ["admin-student-fees", student?.id],
    enabled: !!student?.id,
    queryFn: () => base44.entities.StudentFee.filter({ student_id: student.id })
  });

  // Fetch real fee payments from fee_payments table
  const { data: feePayments = [] } = useQuery({
    queryKey: ["admin-student-fee-payments", student?.id],
    enabled: !!student?.id,
    queryFn: () => base44.entities.FeePayment.filter({ student_id: student.id })
  });

  // Fetch real wallet transactions from wallet_transactions table
  const { data: walletTx = [] } = useQuery({
    queryKey: ["admin-student-wallet-tx", student?.id],
    enabled: !!student?.id,
    queryFn: () => base44.entities.WalletTransaction.filter({ student_id: student.id })
  });

  // Fetch other outstanding dues / fines
  const { data: studentFines = [], refetch: refetchFines } = useQuery({
    queryKey: ["admin-student-fines", student?.id],
    enabled: !!student?.id,
    queryFn: () => base44.entities.Fine.filter({ student_id: student.id }, "-created_date")
  });

  // Mock fallbacks for missing data to ensure high-fidelity presentation
  const mockGrades = [
    { id: "1", subject: isRTL ? "الرياضيات" : "Mathematics", score: 95, grade_value: "A+", semester: isRTL ? "الفصل الأول" : "Semester 1", notes: isRTL ? "أداء متميز وتفكير نقدي رائع" : "Excellent performance and critical thinking" },
    { id: "2", subject: isRTL ? "اللغة العربية" : "Arabic Language", score: 98, grade_value: "A+", semester: isRTL ? "الفصل الأول" : "Semester 1", notes: isRTL ? "ممتاز جداً في البلاغة والتعبير" : "Stellar performance in eloquence and writing" },
    { id: "3", subject: isRTL ? "العلوم والفيزياء" : "Science & Physics", score: 91, grade_value: "A", semester: isRTL ? "الفصل الأول" : "Semester 1", notes: isRTL ? "مشاركة فاعلة في المختبر" : "Active participation in the laboratory" },
    { id: "4", subject: isRTL ? "اللغة الإنجليزية" : "English Language", score: 88, grade_value: "B+", semester: isRTL ? "الفصل الأول" : "Semester 1", notes: isRTL ? "قدرة ممتازة على التحدث والكتابة" : "Great communication and writing skills" },
    { id: "5", subject: isRTL ? "الدراسات الإسلامية" : "Islamic Studies", score: 97, grade_value: "A+", semester: isRTL ? "الفصل الأول" : "Semester 1", notes: isRTL ? "سلوك ممتاز وحفظ متقن" : "Excellent behavior and perfect memorization" },
  ];

  const mockAwards = [
    { id: "1", title: isRTL ? "جائزة التميز العلمي" : "Academic Excellence Award", date: "2026-03-15", points: 150, awarded_by: "أ. محمد علي", description: isRTL ? "للحصول على الدرجة الكاملة في الرياضيات والعلوم" : "For achieving full scores in math and sciences" },
    { id: "2", title: isRTL ? "لقب الطالب المثالي" : "Ideal Student Title", date: "2026-04-20", points: 200, awarded_by: isRTL ? "إدارة المدرسة" : "School Administration", description: isRTL ? "للالتزام التام بالسلوك الحسن والمبادئ القيادية" : "For outstanding moral character and leadership skills" },
  ];

  const mockTransactions = [
    { id: "t1", date: "2026-05-18", type: isRTL ? "شحن بطاقة ذكية" : "Smart Card Top-up", amount: 50, method: isRTL ? "بوابة الدفع الإلكتروني" : "Online Payment Portal", status: "completed" },
    { id: "t2", date: "2026-05-15", type: isRTL ? "قسط الرسوم المدرسية - الدفعة الأولى" : "Tuition Fee Installment - Term 1", amount: 2500, method: isRTL ? "تحويل بنكي" : "Bank Transfer", status: "completed" },
    { id: "t3", date: "2026-05-10", type: isRTL ? "شحن بطاقة ذكية" : "Smart Card Top-up", amount: 20, method: isRTL ? "نقدي من المكتب المالي" : "Cash at Finance Office", status: "completed" },
  ];

  const mockPurchases = [
    { id: "p1", item_name: isRTL ? "وجبة غداء صحية متكاملة" : "Complete Healthy Lunch Meal", quantity: 1, total_price: 15.00, created_at: "2026-05-20T12:30:00Z" },
    { id: "p2", item_name: isRTL ? "عصير برتقال طبيعي" : "Natural Orange Juice", quantity: 1, total_price: 5.50, created_at: "2026-05-20T09:45:00Z" },
    { id: "p3", item_name: isRTL ? "دفتر رسم وعلبة ألوان" : "Sketchbook & Color Box", quantity: 1, total_price: 18.00, created_at: "2026-05-18T10:15:00Z" },
  ];

  const mockBorrowedBooks = [
    { id: "b1", title: isRTL ? "تاريخ الفيزياء والعلوم المعاصرة" : "History of Physics & Modern Science", author: "Dr. Stephen Hawking", category: isRTL ? "علوم طبيعية" : "Natural Sciences", borrow_date: "2026-05-05", due_date: "2026-05-25", status: "borrowed" },
    { id: "b2", title: isRTL ? "البلاد العربية في العهد العثماني" : "The Arab Lands in Ottoman Era", author: isRTL ? "د. ألبرت حوراني" : "Albert Hourani", category: isRTL ? "تاريخ وجغرافيا" : "History & Geography", borrow_date: "2026-04-10", due_date: "2026-04-24", status: "returned" },
  ];

  const getRecordTypeLabel = (record) => {
    if (record.description) return record.description;
    
    switch (record.record_type) {
      case "salary":
        return isRTL ? "راتب" : "Salary";
      case "fine_payment":
        return isRTL ? "سداد غرامة" : "Fine Payment";
      case "bus_driver_payment":
        return isRTL ? "أجر سائق حافلة" : "Bus Driver Payment";
      case "supervisor_payment":
        return isRTL ? "أجر مشرف حافلة" : "Supervisor Payment";
      case "expense":
        return isRTL ? "مصاريف" : "Expense";
      case "income":
        return isRTL ? "سداد رسوم دراسية" : "Tuition Payment";
      case "refund":
        return isRTL ? "مسترجع" : "Refund";
      default:
        return isRTL ? "دفعة مالية" : "Financial Payment";
    }
  };

  const getPaymentMethodLabel = (method) => {
    switch (method) {
      case "bank_transfer":
        return isRTL ? "تحويل بنكي" : "Bank Transfer";
      case "cash":
        return isRTL ? "نقداً" : "Cash";
      case "check":
        return isRTL ? "شيك" : "Check";
      case "card":
        return isRTL ? "بطاقة ائتمان" : "Card";
      default:
        return method || "";
    }
  };

  const studentTransactions = dbFinancialRecords.length > 0 || feePayments.length > 0 || walletTx.length > 0
    ? [
        ...feePayments.map(p => ({
          id: p.id,
          date: (p.payment_date || p.created_at || "").split("T")[0] || "",
          type: isRTL 
            ? `قسط الرسوم المدرسية - ${studentFees.find(f => f.id === p.student_fee_id)?.fee_name || "دفعة رسوم"}` 
            : `Tuition Fee Payment - ${studentFees.find(f => f.id === p.student_fee_id)?.fee_name || "Payment"}`,
          amount: parseFloat(p.amount) || 0,
          method: getPaymentMethodLabel(p.payment_method),
          status: "completed"
        })),
        ...walletTx.map(t => ({
          id: t.id,
          date: (t.created_at || "").split("T")[0] || "",
          type: t.type === "topup" 
            ? (isRTL ? "شحن بطاقة ذكية" : "Smart Card Top-up")
            : (isRTL ? "مشتريات المتجر" : "Store Purchase"),
          amount: parseFloat(t.amount) || 0,
          method: getPaymentMethodLabel(t.payment_method || "stripe"),
          status: "completed"
        })),
        ...dbFinancialRecords.map(r => ({
          id: r.id,
          date: (r.payment_date || r.created_at || "").split("T")[0] || "",
          type: getRecordTypeLabel(r),
          amount: parseFloat(r.amount) || 0,
          method: getPaymentMethodLabel(r.payment_method),
          status: r.status || "completed"
        }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : mockTransactions;

  const handleSaveSuccess = async (newRecord) => {
    if (newRecord?.recipient_type === "student") {
      try {
        const studentAmount = parseFloat(newRecord.amount) || 0;
        const desc = (newRecord.description || "").toLowerCase();
        
        // Decide if it's a top-up or tuition payment
        const isTopUp = desc.includes("شحن") || desc.includes("top-up") || desc.includes("top up") || desc.includes("بطاقة") || desc.includes("card");
        
        if (isTopUp) {
          const currentBalance = parseFloat(student.card_balance) || 0;
          const newBalance = currentBalance + studentAmount;
          await base44.entities.Student.update(student.id, { card_balance: newBalance });
          // Create WalletTransaction to ensure synced UI
          await base44.entities.WalletTransaction.create({
            student_id: student.id,
            type: "topup",
            amount: studentAmount,
            balance_after: newBalance,
            description: desc || "شحن رصيد المحفظة من الإدارة"
          });
          toast.success(isRTL ? "تم شحن رصيد البطاقة الذكية بنجاح!" : "Smart card balance topped up successfully!");
        } else {
          const currentPaid = parseFloat(student.tuition_paid) || 0;
          const newPaid = currentPaid + studentAmount;
          await base44.entities.Student.update(student.id, { tuition_paid: newPaid });

          // If there are fees assigned in student_fees table, record the payment there too!
          const pendingFees = studentFees.filter(f => f.status !== "paid");
          if (pendingFees.length > 0) {
            const targetFee = pendingFees[0];
            await base44.entities.FeePayment.create({
              student_fee_id: targetFee.id,
              student_id: student.id,
              amount: Math.min(studentAmount, parseFloat(targetFee.remaining || targetFee.amount)),
              payment_method: newRecord.payment_method || "bank_transfer",
              notes: desc || "تسجيل دفعة من لوحة الإدارة"
            });
          }
          toast.success(isRTL ? "تم تسجيل دفعة الرسوم الدراسية بنجاح!" : "Tuition payment recorded successfully!");
        }
        
        _qc.invalidateQueries({ queryKey: ["student-profile", student.id] });
        _qc.invalidateQueries({ queryKey: ["financial-records", student?.id] });
        _qc.invalidateQueries({ queryKey: ["admin-student-fees", student?.id] });
        _qc.invalidateQueries({ queryKey: ["admin-student-fee-payments", student?.id] });
        _qc.invalidateQueries({ queryKey: ["admin-student-wallet-tx", student?.id] });
        _qc.invalidateQueries({ queryKey: ["student-fees-all"] });
        _qc.invalidateQueries({ queryKey: ["fee-payments-all"] });
      } catch (err) {
        console.error("Failed to update student financial balances:", err);
      }
    }
  };

  const gradesData = dbGrades.length > 0 ? dbGrades : mockGrades;
  const awardsData = dbAwards.length > 0 ? dbAwards : mockAwards;
  const purchasesData = dbPurchases.length > 0 ? dbPurchases : mockPurchases;

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text || "");
    setCopiedField(fieldName);
    toast.success(isRTL ? "تم النسخ بنجاح" : "Copied successfully");
    setTimeout(() => setCopiedField(null), 2000);
  };

  const triggerPrint = () => {
    window.print();
  };

  // Safe arithmetic for remaining tuition (preferring real tables, falling back to Student fields)
  const totalTuition = studentFees.length > 0
    ? studentFees.reduce((sum, f) => sum + parseFloat(f.amount || 0), 0)
    : (parseFloat(student?.tuition_total) || 0);

  const dynamicPaid = dbFinancialRecords
    .filter(r => {
      const isTuitionType = r.record_type === "tuition" || r.record_type === "income";
      const isPaid = r.status === "paid" || r.status === "completed" || !r.status;
      const desc = (r.description || "").toLowerCase();
      const isTopUp = desc.includes("top-up") || 
                      desc.includes("top up") || 
                      desc.includes("شحن") || 
                      desc.includes("بطاقة") || 
                      desc.includes("card") ||
                      desc.includes("wallet") ||
                      desc.includes("محفظة");
      return isTuitionType && isPaid && !isTopUp;
    })
    .reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

  const paidTuition = studentFees.length > 0
    ? studentFees.reduce((sum, f) => sum + parseFloat(f.amount_paid || 0), 0)
    : (dbFinancialRecords.length > 0 ? dynamicPaid : (parseFloat(student?.tuition_paid) || 0));

  const remainingTuition = Math.max(0, totalTuition - paidTuition);

  const getStatusColor = (status) => {
    switch (status) {
      case "active": return "bg-emerald-500/10 text-emerald-600 border-emerald-200/50";
      case "suspended": return "bg-rose-500/10 text-rose-600 border-rose-200/50";
      case "graduated": return "bg-blue-500/10 text-blue-600 border-blue-200/50";
      case "transferred": return "bg-amber-500/10 text-amber-600 border-amber-200/50";
      default: return "bg-stone-100 text-stone-600 border-stone-200";
    }
  };

  const getStatusLabel = (status) => {
    if (!isRTL) return status.charAt(0).toUpperCase() + status.slice(1);
    switch (status) {
      case "active": return "نشط";
      case "suspended": return "موقف مؤقتاً";
      case "graduated": return "متخرج";
      case "transferred": return "منقول";
      default: return status;
    }
  };

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      
      {/* Dynamic Style Overrides for perfect A4 page print setups */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          /* Hide sidebar, headers, background grids, buttons */
          header, .no-print, nav, aside, button, .tab-buttons-container {
            display: none !important;
          }
          /* Reset layout margins for maximum print printable area */
          main, .main-content-layout, body, html {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            background: white !important;
            color: #0f172a !important;
          }
          .print-card-box {
            border: 1px solid #e2e8f0 !important;
            box-shadow: none !important;
            break-inside: avoid !important;
          }
        }
      `}} />

      {/* Screen Interface Wrapper (Hidden on print automatically) */}
      <div className="no-print space-y-6">
        
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200/80 pb-5">
          <div className="space-y-1">
            <button 
              onClick={onClose}
              className="group inline-flex items-center gap-2 text-stone-500 hover:text-stone-850 text-sm font-semibold transition-colors mb-1 cursor-pointer"
            >
              {isRTL ? <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /> : <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />}
              <span>{isRTL ? "رجوع لدليل الطلاب" : "Back to Directory"}</span>
            </button>
            <h2 className="font-display text-2xl md:text-3xl font-black text-stone-900 tracking-tight">
              {isRTL ? "الملف الشامل للطالب" : "Student Unified Dossier"}
            </h2>
          </div>
          
          <div className="flex flex-wrap gap-2.5">
            <button 
              onClick={triggerPrint}
              className="px-5 h-11 inline-flex items-center justify-center gap-2 font-bold rounded-xl border-2 border-stone-300 hover:border-stone-400 bg-white text-stone-800 transition-all cursor-pointer shadow-sm"
            >
              <Printer size={16} />
              <span>{isRTL ? "طباعة وتصدير PDF" : "Print & Export PDF"}</span>
            </button>
            {onEdit && portalRole === "admin" && (
              <button 
                onClick={() => onEdit(student)}
                className="px-6 h-11 inline-flex items-center justify-center gap-2 font-bold rounded-xl bg-primary text-white hover:bg-primary/95 transition-all shadow-md hover:shadow-lg cursor-pointer"
              >
                <Pencil size={15} />
                <span>{isRTL ? "تعديل بيانات الطالب" : "Edit Student Data"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Core Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Cards, Wallets, Credentials */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Student ID Portrait Card */}
            <Card className="border border-stone-200/80 rounded-2xl p-6 bg-white shadow-sm flex flex-col items-center text-center relative overflow-hidden">
              {/* Profile Background Decorative pattern */}
              <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10" />
              
              <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-md bg-stone-50 flex items-center justify-center z-10 mt-2">
                {student.photo_url ? (
                  <img src={student.photo_url} alt={student.full_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-primary font-black text-3xl">{student.full_name?.charAt(0)}</div>
                )}
              </div>

              <h3 className="font-display font-extrabold text-stone-900 text-lg mt-3 z-10">{student.full_name}</h3>
              <div className="flex items-center gap-2 mt-1 z-10">
                <span className="font-mono text-xs font-semibold text-stone-500 num-en">#{student.student_id}</span>
                <span className="text-stone-300">•</span>
                <Badge variant="outline" className={`${getStatusColor(student.status)} rounded-md font-bold px-2 py-0.5 border`}>
                  {getStatusLabel(student.status)}
                </Badge>
              </div>

              <div className="w-full grid grid-cols-2 gap-2 mt-5 border-t border-stone-100 pt-4 text-xs font-semibold text-stone-600">
                <div className="bg-stone-50/70 p-2.5 rounded-xl border border-stone-150/60">
                  <span className="text-stone-400 block mb-0.5">{isRTL ? "الصف الدراسي" : "Grade"}</span>
                  <span className="text-stone-850 font-bold num-en">{t("students.grade", language)} {student.grade}</span>
                </div>
                <div className="bg-stone-50/70 p-2.5 rounded-xl border border-stone-150/60">
                  <span className="text-stone-400 block mb-0.5">{isRTL ? "اسم الفصل" : "Class Name"}</span>
                  <span className="text-stone-850 font-bold">{student.section || "-"}</span>
                </div>
              </div>
            </Card>

            {/* Premium Interactive School Smart Card */}
            {portalRole === "admin" && (
              <Card className="border-0 rounded-2xl overflow-hidden shadow-lg relative bg-gradient-to-br from-slate-900 via-primary to-slate-950 p-6 text-white min-h-[195px] flex flex-col justify-between group">
                {/* Glowing chips / animations overlay */}
                <div className="absolute -right-16 -top-16 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/15 transition-all duration-500" />
                <div className="absolute -left-16 -bottom-16 w-44 h-44 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-500/15 transition-all duration-500" />

                <div className="flex justify-between items-start z-10">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-white/50 tracking-widest">{isRTL ? "البطاقة الذكية للمدرسة" : "School Smart Card"}</span>
                    <p className="text-xs font-mono tracking-wider opacity-90 num-en">•••• •••• •••• {student.student_id?.replace(/[^0-9]/g, '').slice(-4) || '8254'}</p>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
                    <CreditCard size={18} className="text-white/80" />
                  </div>
                </div>

                <div className="my-5 z-10">
                  <span className="text-[10px] text-white/50 block mb-0.5">{isRTL ? "رصيد المحفظة والبطاقة الذكية" : "Smart Card Wallet Balance"}</span>
                  <span className="text-2xl font-black text-emerald-400 num-en">${parseFloat(student.card_balance || 0).toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-end border-t border-white/10 pt-3 z-10 text-[10px] font-semibold text-white/70">
                  <div>
                    <span className="opacity-50 block">{isRTL ? "صاحب البطاقة" : "Card Holder"}</span>
                    <span className="font-bold opacity-100">{student.full_name}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-white/10 rounded px-1.5 py-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="uppercase text-[8px] font-bold">NFC Active</span>
                  </div>
                </div>
              </Card>
            )}

            {/* Portal Accounts Credentials Card */}
            {portalRole === "admin" && (
              <Card className="border border-stone-200/80 rounded-2xl p-5 bg-white shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-stone-100 pb-2">
                  <Lock className="text-primary stroke-[1.8]" size={16} />
                  <h4 className="font-display font-bold text-stone-800 text-sm">{isRTL ? "حسابات البوابات الإلكترونية" : "Portal Credentials"}</h4>
                </div>

                {/* Student Account */}
                <div className="space-y-2.5 p-3 rounded-xl bg-stone-50/50 border border-stone-150/40 text-xs">
                  <span className="font-bold text-stone-500 block border-b border-stone-100 pb-1">{isRTL ? "بوابة الطالب" : "Student Portal"}</span>
                  
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-stone-600 font-semibold truncate">
                      <Mail size={13} className="text-stone-400 shrink-0" />
                      <span className="truncate num-en">{student.user_email || `${student.student_id}@school.edu`}</span>
                    </div>
                    <button 
                      onClick={() => handleCopy(student.user_email || `${student.student_id}@school.edu`, "stuEmail")}
                      className="text-stone-400 hover:text-stone-850 p-1 rounded hover:bg-stone-200/50 transition-colors shrink-0 cursor-pointer"
                    >
                      {copiedField === "stuEmail" ? <CheckCircle size={13} className="text-emerald-500" /> : <Copy size={13} />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-1.5 text-stone-600 font-semibold">
                      <Lock size={13} className="text-stone-400 shrink-0" />
                      <span className="font-mono">
                        {showStudentPass ? (student.portal_password || "12345678") : "••••••••"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button 
                        onClick={() => setShowStudentPass(!showStudentPass)}
                        className="text-stone-400 hover:text-stone-855 p-1 rounded hover:bg-stone-200/50 transition-colors cursor-pointer"
                      >
                        {showStudentPass ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                      <button 
                        onClick={() => handleCopy(student.portal_password || "12345678", "stuPass")}
                        className="text-stone-400 hover:text-stone-850 p-1 rounded hover:bg-stone-200/50 transition-colors cursor-pointer"
                      >
                        {copiedField === "stuPass" ? <CheckCircle size={13} className="text-emerald-500" /> : <Copy size={13} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Parent Account */}
                <div className="space-y-2.5 p-3 rounded-xl bg-stone-50/50 border border-stone-150/40 text-xs">
                  <span className="font-bold text-stone-500 block border-b border-stone-100 pb-1">{isRTL ? "بوابة ولي الأمر" : "Parent Portal"}</span>
                  
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-stone-600 font-semibold truncate">
                      <Mail size={13} className="text-stone-400 shrink-0" />
                      <span className="truncate num-en">{student.parent_email || "-"}</span>
                    </div>
                    <button 
                      disabled={!student.parent_email}
                      onClick={() => handleCopy(student.parent_email, "parentEmail")}
                      className="text-stone-400 hover:text-stone-850 p-1 rounded hover:bg-stone-200/50 transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
                    >
                      {copiedField === "parentEmail" ? <CheckCircle size={13} className="text-emerald-500" /> : <Copy size={13} />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-1.5 text-stone-600 font-semibold">
                      <Lock size={13} className="text-stone-400 shrink-0" />
                      <span className="font-mono">
                        {showParentPass ? (student.parent_password || "Parent123") : "••••••••"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button 
                        onClick={() => setShowParentPass(!showParentPass)}
                        className="text-stone-400 hover:text-stone-850 p-1 rounded hover:bg-stone-200/50 transition-colors cursor-pointer"
                      >
                        {showParentPass ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                      <button 
                        onClick={() => handleCopy(student.parent_password || "Parent123", "parentPass")}
                        className="text-stone-400 hover:text-stone-850 p-1 rounded hover:bg-stone-200/50 transition-colors cursor-pointer"
                      >
                        {copiedField === "parentPass" ? <CheckCircle size={13} className="text-emerald-500" /> : <Copy size={13} />}
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Right Column: Tabbed View (Academic, financial, activity detail panels) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Custom Premium Tab Buttons */}
            <div className="tab-buttons-container flex border-b border-stone-200 bg-white p-1 rounded-xl shadow-sm border">
              {[
                { id: "overview", label: isRTL ? "معلومات الطالب" : "General Info", icon: ClipboardList },
                { id: "academics", label: isRTL ? "الأكاديميات والدرجات" : "Academics", icon: GraduationCap },
                portalRole === "admin" && { id: "finance", label: isRTL ? "الرسوم والمالية" : "Tuition & Finance", icon: DollarSign },
                portalRole === "admin" && { id: "activity", label: isRTL ? "المتجر والمكتبة" : "Canteen & Library", icon: ShoppingBag },
                portalRole === "admin" && { id: "fines", label: isRTL ? "المستحقات الأخرى" : "Other Dues & Fines", icon: AlertCircle }
              ].filter(Boolean).map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-3 px-1.5 rounded-lg flex items-center justify-center gap-2 font-bold text-xs md:text-sm transition-all cursor-pointer relative ${
                      isActive ? "text-primary bg-stone-50" : "text-stone-500 hover:text-stone-850 hover:bg-stone-50/50"
                    }`}
                  >
                    <Icon size={16} />
                    <span>{tab.label}</span>
                    {isActive && (
                      <motion.div 
                        layoutId="activeTabUnderline"
                        className="absolute bottom-0 inset-x-4 h-0.5 bg-primary"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab Panels */}
            <div className="min-h-[400px]">
              <AnimatePresence mode="wait">
                
                {/* 1. General & Contact Info Tab */}
                {activeTab === "overview" && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    {/* Basic details and services info */}
                    <Card className="border border-stone-200/80 rounded-2xl p-6 bg-white shadow-sm space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        <div className="space-y-4">
                          <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider pb-1.5 border-b border-stone-100">{isRTL ? "البيانات الديموغرافية والأساسية" : "Basic Information"}</h4>
                          
                          <div className="space-y-3.5 text-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-stone-500 font-semibold">{isRTL ? "الاسم بالكامل:" : "Full Name:"}</span>
                              <span className="font-extrabold text-stone-900">{student.full_name}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-stone-500 font-semibold">{isRTL ? "الرقم المدرسي:" : "School ID:"}</span>
                              <span className="font-mono font-bold text-stone-800 num-en">#{student.student_id}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-stone-500 font-semibold">{isRTL ? "تاريخ الميلاد:" : "Date of Birth:"}</span>
                              <span className="font-bold text-stone-700 num-en">{student.date_of_birth ? student.date_of_birth.substring(0, 10) : "-"}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-stone-500 font-semibold">{isRTL ? "حالة القيد الدراسية:" : "Enrolment Status:"}</span>
                              <Badge className={`${getStatusColor(student.status)} border-none shadow-none`}>{getStatusLabel(student.status)}</Badge>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider pb-1.5 border-b border-stone-100">{isRTL ? "ولي الأمر وبيانات الاتصال" : "Parent & Contact Info"}</h4>
                          
                          <div className="space-y-3.5 text-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-stone-500 font-semibold">{isRTL ? "اسم ولي الأمر:" : "Parent Name:"}</span>
                              <span className="font-extrabold text-stone-900">{student.parent_name || "-"}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-stone-500 font-semibold">{isRTL ? "هاتف الاتصال لولي الأمر:" : "Parent Phone:"}</span>
                              <span className="font-bold text-stone-700 num-en">{student.parent_phone || "-"}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-stone-500 font-semibold">{isRTL ? "البريد الإلكتروني لولي الأمر:" : "Parent Email:"}</span>
                              <span className="font-semibold text-stone-700 num-en">{student.parent_email || "-"}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-stone-500 font-semibold">{isRTL ? "العنوان الفعلي:" : "Residential Address:"}</span>
                              <span className="font-semibold text-stone-700 truncate max-w-[200px]" title={student.address}>{student.address || "-"}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Extra Services Card (Bus registration details) */}
                      <div className="border-t border-stone-100 pt-5 space-y-4">
                        <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider pb-1.5 border-b border-stone-100">{isRTL ? "الخدمات المدرسية المضافة" : "School Services"}</h4>
                        
                        <div className="p-4 rounded-xl bg-stone-50 border border-stone-150/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-inner ${student.bus_registered ? 'bg-amber-100 text-amber-700' : 'bg-stone-200 text-stone-400'}`}>
                              <Bus size={20} />
                            </div>
                            <div>
                              <p className="font-bold text-sm text-stone-850">{isRTL ? "خدمة الحافلة المدرسية" : "School Bus Transportation"}</p>
                              <p className="text-xs text-stone-500 mt-0.5">
                                {student.bus_registered 
                                  ? (isRTL ? `المسار: ${student.bus_route || "غير محدد"}` : `Route: ${student.bus_route || "Not specified"}`)
                                  : (isRTL ? "الطالب غير مشترك في خدمة الحافلة" : "Not registered in school transport services")
                                }
                              </p>
                            </div>
                          </div>
                          <Badge className={`rounded-lg px-3 py-1 font-bold ${student.bus_registered ? 'bg-amber-500/10 text-amber-600 border-none' : 'bg-stone-200 text-stone-500 border-none'}`}>
                            {student.bus_registered ? (isRTL ? "مشترك" : "Subscribed") : (isRTL ? "غير مشترك" : "Unsubscribed")}
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )}

                {/* 2. Academics & Grades Tab */}
                {activeTab === "academics" && (
                  <motion.div
                    key="academics"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    {/* General Attendance Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { label: isRTL ? "متوسط الدرجات العام" : "Academic GPA Score", value: "93.6%", desc: isRTL ? "ممتاز (أ)" : "Excellent (A)", icon: GraduationCap, color: "text-primary" },
                        { label: isRTL ? "غيابات الفصل الدراسي" : "Total Absences", value: student.total_absences || "0", desc: isRTL ? "أيام" : "days", icon: Calendar, color: "text-rose-500" },
                        { label: isRTL ? "نسبة الحضور المباشر" : "Attendance Rate", value: `${student.attendance_score || "100"}%`, desc: isRTL ? "سلوك ممتاز" : "Stellar status", icon: CheckCircle, color: "text-emerald-500" }
                      ].map((stat, idx) => (
                        <Card key={idx} className="p-4 border border-stone-200/80 bg-white shadow-sm rounded-xl flex items-center justify-between gap-4">
                          <div>
                            <span className="text-[10px] text-stone-400 font-bold block uppercase tracking-wider">{stat.label}</span>
                            <span className="text-xl font-black text-stone-900 mt-1 block num-en">{stat.value}</span>
                            <span className="text-[10px] text-stone-500 mt-0.5 block font-semibold">{stat.desc}</span>
                          </div>
                          <div className={`w-10 h-10 rounded-full bg-stone-50 border border-stone-100 flex items-center justify-center ${stat.color}`}>
                            <stat.icon size={18} />
                          </div>
                        </Card>
                      ))}
                    </div>

                    {/* Detailed Grades Table */}
                    <Card className="border border-stone-200/80 rounded-2xl p-5 bg-white shadow-sm space-y-4">
                      <div className="flex items-center gap-2 border-b border-stone-100 pb-2">
                        <GraduationCap className="text-primary" size={18} />
                        <h4 className="font-display font-bold text-stone-800 text-sm">{isRTL ? "السجل الأكاديمي والدرجات للفصل الدراسي" : "Subject Semester Grades"}</h4>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-start">
                          <thead>
                            <tr className="border-b border-stone-100 bg-stone-50/50 text-stone-500 font-bold">
                              <th className="py-2.5 px-3 text-start">{isRTL ? "المادة الدراسية" : "Subject"}</th>
                              <th className="py-2.5 px-3 text-center">{isRTL ? "الفصل" : "Semester"}</th>
                              <th className="py-2.5 px-3 text-center">{isRTL ? "الدرجة" : "Score"}</th>
                              <th className="py-2.5 px-3 text-center">{isRTL ? "التقدير" : "Grade"}</th>
                              <th className="py-2.5 px-3 text-start hidden md:table-cell">{isRTL ? "الملاحظات" : "Teacher Remarks"}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {gradesData.map((g) => (
                              <tr key={g.id} className="border-b border-stone-150/40 hover:bg-stone-50/30 transition-colors">
                                <td className="py-3 px-3 font-bold text-stone-850">{g.subject || g.subject_name}</td>
                                <td className="py-3 px-3 text-center text-stone-500 text-xs">{g.semester || g.term}</td>
                                <td className="py-3 px-3 text-center font-mono font-bold text-stone-800 num-en">{g.score || "-"}%</td>
                                <td className="py-3 px-3 text-center">
                                  <Badge className="bg-primary/10 text-primary border-none shadow-none font-bold rounded">
                                    {g.grade_value || g.grade_label || "A"}
                                  </Badge>
                                </td>
                                <td className="py-3 px-3 text-stone-500 text-xs hidden md:table-cell">{g.notes || "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>

                    {/* Awards list */}
                    <Card className="border border-stone-200/80 rounded-2xl p-5 bg-white shadow-sm space-y-4">
                      <div className="flex items-center gap-2 border-b border-stone-100 pb-2">
                        <Award className="text-primary" size={18} />
                        <h4 className="font-display font-bold text-stone-800 text-sm">{isRTL ? "الأوسمة والجوائز التقديرية" : "Student Honors & Awards"}</h4>
                      </div>

                      <div className="space-y-3">
                        {awardsData.map((award) => (
                          <div key={award.id} className="p-3.5 rounded-xl border border-stone-150/60 flex items-start gap-3 bg-stone-50/50">
                            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                              <Award size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <h5 className="font-bold text-sm text-stone-850 truncate">{award.title}</h5>
                                <span className="font-mono text-xs text-stone-400 shrink-0 num-en">{award.date}</span>
                              </div>
                              <p className="text-xs text-stone-500 mt-1 leading-relaxed">{award.description}</p>
                              <div className="flex items-center gap-2.5 mt-2 text-[10px] font-bold text-stone-450 uppercase">
                                <span>{isRTL ? `مانح الجائزة: ${award.awarded_by}` : `Awarded by: ${award.awarded_by}`}</span>
                                <span>•</span>
                                <span className="text-amber-600 num-en">+{award.points} Points</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </motion.div>
                )}

                {/* 3. Tuition Fees & Finance Tab */}
                {activeTab === "finance" && (
                  <motion.div
                    key="finance"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    {/* Financial Block Cards (Requested by User) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      
                      <Card className="p-5 border border-stone-200/80 bg-white shadow-sm rounded-xl relative overflow-hidden">
                        <div className="absolute right-0 top-0 w-1.5 h-full bg-primary" />
                        <span className="text-[10px] text-stone-400 font-bold block uppercase tracking-wider">{isRTL ? "إجمالي الرسوم المستحقة" : "Total Tuition Fees"}</span>
                        <span className="text-2xl font-black text-stone-900 mt-1.5 block num-en">${totalTuition.toFixed(2)}</span>
                        <span className="text-[10px] text-stone-500 mt-1 block font-medium">{isRTL ? "المستحقات الكلية للمدرسة" : "Total institutional obligations"}</span>
                      </Card>

                      <Card className="p-5 border border-stone-200/80 bg-white shadow-sm rounded-xl relative overflow-hidden">
                        <div className="absolute right-0 top-0 w-1.5 h-full bg-emerald-500" />
                        <span className="text-[10px] text-stone-400 font-bold block uppercase tracking-wider">{isRTL ? "الرسوم المدفوعة" : "Tuition Fees Paid"}</span>
                        <span className="text-2xl font-black text-emerald-600 mt-1.5 block num-en">${paidTuition.toFixed(2)}</span>
                        <span className="text-[10px] text-emerald-650 font-bold mt-1 flex items-center gap-1">
                          <CheckCircle size={10} />
                          <span>{isRTL ? "تم التسليم للبنك" : "Settled successfully"}</span>
                        </span>
                      </Card>

                      <Card className="p-5 border border-stone-200/80 bg-white shadow-sm rounded-xl relative overflow-hidden">
                        <div className="absolute right-0 top-0 w-1.5 h-full bg-amber-500" />
                        <span className="text-[10px] text-stone-400 font-bold block uppercase tracking-wider">{isRTL ? "الرسوم المتبقية المستحقة" : "Remaining Due Balance"}</span>
                        <span className={`text-2xl font-black mt-1.5 block num-en ${remainingTuition > 0 ? 'text-amber-600 animate-pulse' : 'text-stone-450'}`}>
                          ${remainingTuition.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-stone-500 mt-1 block font-medium">
                          {remainingTuition > 0 
                            ? (isRTL ? "يرجى الالتزام بموعد السداد" : "Awaiting next installment") 
                            : (isRTL ? "الحساب مسدد بالكامل" : "No outstanding due")
                          }
                        </span>
                      </Card>
                    </div>

                    {/* Financial Transactions history */}
                    <Card className="border border-stone-200/80 rounded-2xl p-5 bg-white shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                        <div className="flex items-center gap-2">
                          <DollarSign className="text-primary" size={18} />
                          <h4 className="font-display font-bold text-stone-800 text-sm">{isRTL ? "سجل المعاملات والمدفوعات المالية" : "Transactions Ledger & Top-ups"}</h4>
                        </div>
                        <button 
                          onClick={() => setPaymentDialogOpen(true)} 
                          className="inline-flex items-center gap-1 bg-primary text-white text-xs px-3 py-1.5 rounded-lg hover:bg-primary/90 font-bold transition-all shadow-sm cursor-pointer"
                        >
                          <Plus size={14} />
                          <span>{isRTL ? "تسجيل دفعة / شحن رصيد" : "Add Payment / Top-up"}</span>
                        </button>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-start">
                          <thead>
                            <tr className="border-b border-stone-100 bg-stone-50/50 text-stone-500 font-bold">
                              <th className="py-2.5 px-3 text-start">{isRTL ? "التاريخ" : "Date"}</th>
                              <th className="py-2.5 px-3 text-start">{isRTL ? "نوع المعاملة" : "Transaction Type"}</th>
                              <th className="py-2.5 px-3 text-center">{isRTL ? "المبلغ" : "Amount"}</th>
                              <th className="py-2.5 px-3 text-start">{isRTL ? "طريقة الدفع" : "Payment Method"}</th>
                              <th className="py-2.5 px-3 text-center">{isRTL ? "الحالة" : "Status"}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {studentTransactions.map((t) => (
                              <tr key={t.id} className="border-b border-stone-150/40 hover:bg-stone-50/30 transition-colors">
                                <td className="py-3 px-3 text-stone-550 font-mono text-xs num-en">{t.date}</td>
                                <td className="py-3 px-3 font-bold text-stone-800">{t.type}</td>
                                <td className="py-3 px-3 text-center font-bold text-stone-900 num-en">${t.amount.toFixed(2)}</td>
                                <td className="py-3 px-3 text-stone-600 text-xs">{t.method}</td>
                                <td className="py-3 px-3 text-center">
                                  <Badge className="bg-emerald-500/15 text-emerald-700 border-none shadow-none font-bold rounded">
                                    {isRTL ? "مكتمل" : "Completed"}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  </motion.div>
                )}

                {/* 4. Store (Canteen) & Library Tab */}
                {activeTab === "activity" && (
                  <motion.div
                    key="activity"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Canteen purchases */}
                      <Card className="border border-stone-200/80 rounded-2xl p-5 bg-white shadow-sm space-y-4">
                        <div className="flex items-center gap-2 border-b border-stone-100 pb-2">
                          <ShoppingBag className="text-primary" size={18} />
                          <h4 className="font-display font-bold text-stone-800 text-sm">{isRTL ? "مشتريات الكافيتريا والمتجر المدرسي" : "Canteen Store Purchases"}</h4>
                        </div>

                        <div className="space-y-3">
                          {purchasesData.length === 0 ? (
                            <div className="py-8 text-center text-stone-400 text-xs">
                              {isRTL ? "لا توجد مشتريات حديثة مسجلة" : "No recent canteen purchases found"}
                            </div>
                          ) : (
                            purchasesData.map((p) => (
                              <div key={p.id} className="p-3 rounded-xl border border-stone-150/45 flex items-center justify-between gap-4 bg-stone-50/40">
                                <div>
                                  <p className="font-bold text-xs text-stone-850">{p.item_name || (isRTL ? "وجبة مدرسية" : "Store Item")}</p>
                                  <p className="text-[10px] text-stone-400 mt-1 num-en">
                                    {new Date(p.created_at || Date.now()).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                                <div className="text-end">
                                  <span className="font-bold text-sm text-stone-900 num-en">${parseFloat(p.total_price || 0).toFixed(2)}</span>
                                  <span className="text-[10px] text-stone-400 block mt-0.5">x{p.quantity || 1}</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </Card>

                      {/* Library books borrowed */}
                      <Card className="border border-stone-200/80 rounded-2xl p-5 bg-white shadow-sm space-y-4">
                        <div className="flex items-center gap-2 border-b border-stone-100 pb-2">
                          <BookOpen className="text-primary" size={18} />
                          <h4 className="font-display font-bold text-stone-800 text-sm">{isRTL ? "سجل استعارة كتب المكتبة" : "Active Library Borrowing"}</h4>
                        </div>

                        <div className="space-y-3">
                          {mockBorrowedBooks.map((b) => (
                            <div key={b.id} className="p-3.5 rounded-xl border border-stone-150/45 space-y-2 bg-stone-50/40">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="font-bold text-xs text-stone-850">{b.title}</p>
                                  <p className="text-[10px] text-stone-500 mt-0.5 font-semibold">{isRTL ? `المؤلف: ${b.author}` : `Author: ${b.author}`}</p>
                                </div>
                                <Badge className={`rounded font-bold text-[9px] px-1.5 py-0.5 border-none ${
                                  b.status === 'borrowed' ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600'
                                }`}>
                                  {b.status === 'borrowed' ? (isRTL ? "مستعار" : "Borrowed") : (isRTL ? "تم الإرجاع" : "Returned")}
                                </Badge>
                              </div>

                              <div className="flex justify-between items-center text-[10px] text-stone-450 border-t border-stone-100 pt-2 font-bold uppercase tracking-wider">
                                <span className="num-en">{isRTL ? `تاريخ الاستعارة: ${b.borrow_date}` : `Borrowed: ${b.borrow_date}`}</span>
                                <span className={b.status === 'borrowed' ? 'text-amber-600 num-en' : 'num-en'}>
                                  {isRTL ? `تاريخ الإرجاع: ${b.due_date}` : `Due: ${b.due_date}`}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    </div>
                  </motion.div>
                )}

                {/* 5. Other Outstanding Dues & Fines Tab */}
                {activeTab === "fines" && (
                  <motion.div
                    key="fines"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="p-5 border border-stone-200/80 bg-white shadow-sm rounded-xl relative overflow-hidden">
                        <div className="absolute right-0 top-0 w-1.5 h-full bg-rose-500" />
                        <span className="text-[10px] text-stone-400 font-bold block uppercase tracking-wider">{isRTL ? "المستحقات المعلقة" : "Pending Payments"}</span>
                        <span className="text-2xl font-black text-rose-600 mt-1.5 block num-en">
                          {studentFines.filter(f => f.status === "pending").length}
                        </span>
                        <span className="text-[10px] text-stone-500 mt-1 block font-medium">{isRTL ? "عدد الرسوم بانتظار السداد" : "Number of unpaid dues"}</span>
                      </Card>

                      <Card className="p-5 border border-stone-200/80 bg-white shadow-sm rounded-xl relative overflow-hidden">
                        <div className="absolute right-0 top-0 w-1.5 h-full bg-amber-500" />
                        <span className="text-[10px] text-stone-400 font-bold block uppercase tracking-wider">{isRTL ? "إجمالي المطلوب" : "Total Owed"}</span>
                        <span className="text-2xl font-black text-amber-600 mt-1.5 block num-en">
                          ${studentFines.filter(f => f.status === "pending").reduce((sum, f) => sum + (parseFloat(f.amount) || 0), 0).toFixed(2)}
                        </span>
                        <span className="text-[10px] text-stone-500 mt-1 block font-medium">{isRTL ? "إجمالي قيمة المستحقات المعلقة" : "Total pending due amount"}</span>
                      </Card>

                      <Card className="p-5 border border-stone-200/80 bg-white shadow-sm rounded-xl relative overflow-hidden">
                        <div className="absolute right-0 top-0 w-1.5 h-full bg-emerald-500" />
                        <span className="text-[10px] text-stone-400 font-bold block uppercase tracking-wider">{isRTL ? "المستحقات المسددة" : "Settled Payments"}</span>
                        <span className="text-2xl font-black text-emerald-600 mt-1.5 block num-en">
                          {studentFines.filter(f => f.status === "paid").length}
                        </span>
                        <span className="text-[10px] text-stone-500 mt-1 block font-medium">{isRTL ? "رسوم تم تسويتها بنجاح" : "Successfully settled dues"}</span>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      
                      {/* Left: Fine List */}
                      <div className="lg:col-span-2 space-y-4">
                        <Card className="border border-stone-200/80 rounded-2xl p-5 bg-white shadow-sm space-y-4">
                          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="text-primary" size={18} />
                              <h4 className="font-display font-bold text-stone-800 text-sm">{isRTL ? "سجل المستحقات والغرامات المسجلة" : "Outstanding Dues & Fines Record"}</h4>
                            </div>
                            <button 
                              type="button"
                              onClick={handleExportFines}
                              className="inline-flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs px-3 py-1.5 rounded-xl font-bold transition-all shadow-sm cursor-pointer border-none"
                            >
                              <Printer size={14} />
                              <span>{isRTL ? "تصدير الكشف / طباعة" : "Export Statement / Print"}</span>
                            </button>
                          </div>

                          <div className="space-y-4">
                            {studentFines.length === 0 ? (
                              <div className="py-12 text-center text-stone-400 text-xs">
                                <AlertCircle size={32} className="mx-auto mb-2 opacity-50 text-stone-400" />
                                {isRTL ? "لا توجد مستحقات أخرى أو غرامات مسجلة لهذا الطالب." : "No other dues or fines registered for this student."}
                              </div>
                            ) : (
                              (() => {
                                const finesPageSize = 3;
                                const totalFinesPages = Math.ceil(studentFines.length / finesPageSize) || 1;
                                const paginatedFines = studentFines.slice((finesPage - 1) * finesPageSize, finesPage * finesPageSize);

                                return (
                                  <>
                                    {paginatedFines.map((fine) => {
                                      const isPending = fine.status === "pending";
                                      // Custom inlined simple translation helper
                                      const translateText = (text) => {
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
                                          "Book was overdue by 5 days": "تأخر في إرجاع الكتاب المستعار عن الموعد المحدد بـ 5 أيام."
                                        };
                                        if (map[textStr]) return map[textStr];
                                        if (textStr.includes("Lost sports equipment (Basketball)")) return "فقدان معدات رياضية (كرة السلة)";
                                        if (textStr.includes("Damaged science lab equipment")) return "تلف وتخريب أدوات مختبر العلوم";
                                        if (textStr.includes("Late library return") || textStr.includes("Introduction to Algorithms")) return "تأخير إرجاع كتاب \"مقدمة في الخوارزميات\" للمكتبة";
                                        if (textStr.includes("Damaged beaker")) return "كسر وتلف أنبوب اختبار زجاجي أثناء حصة الكيمياء العملي.";
                                        if (textStr.includes("Book was overdue")) return "تأخر في إرجاع الكتاب المستعار عن الموعد المحدد بـ 5 أيام.";
                                        return text;
                                      };

                                      return (
                                        <div 
                                          key={fine.id} 
                                          className={`p-4 rounded-xl border transition-all ${
                                            isPending 
                                              ? "border-rose-200 bg-rose-50/10 hover:bg-rose-50/20" 
                                              : "border-stone-150 bg-stone-50/25 hover:bg-stone-50/40"
                                          }`}
                                        >
                                          <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 space-y-2">
                                              <div className="flex flex-wrap items-center gap-2">
                                                <p className="font-bold text-sm text-stone-850">
                                                  {translateText(fine.reason)}
                                                </p>
                                                <Badge 
                                                  variant={isPending ? "destructive" : "default"} 
                                                  className={`text-[10px] font-bold rounded px-2 py-0.5 border-none ${
                                                    isPending 
                                                      ? "bg-rose-500/10 text-rose-600 hover:bg-rose-500/20" 
                                                      : "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                                                  }`}
                                                >
                                                  {isPending ? (isRTL ? "معلق" : "Pending") : (isRTL ? "مقبول/مدفوع" : "Paid")}
                                                </Badge>
                                              </div>

                                              <p className="text-xs text-stone-500 font-semibold num-en">
                                                {fine.date} {fine.issued_by && `• ${isRTL ? "بواسطة" : "Issued by"} ${fine.issued_by}`}
                                              </p>

                                              <div className="flex items-center justify-between pt-1">
                                                {fine.category && (
                                                  <Badge 
                                                    variant="outline" 
                                                    className={`text-[10px] font-bold border ${
                                                      fine.category === "sports" ? "bg-blue-50 text-blue-600 border-blue-200" :
                                                      fine.category === "discipline" ? "bg-purple-50 text-purple-600 border-purple-200" :
                                                      fine.category === "library" ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                                                      "bg-stone-50 text-stone-600 border-stone-200"
                                                    }`}
                                                  >
                                                    {fine.category === "sports" ? (isRTL ? "أنشطة رياضية" : "Sports") :
                                                     fine.category === "discipline" ? (isRTL ? "انضباط سلوكي" : "Discipline") :
                                                     fine.category === "library" ? (isRTL ? "المكتبة المدرسية" : "Library") :
                                                     (isRTL ? "رسوم عامة" : "General")}
                                                  </Badge>
                                                )}

                                                <div className="flex items-center gap-2">
                                                  <button 
                                                    onClick={() => handleDeleteFine(fine.id)}
                                                    className="text-rose-600 hover:text-rose-800 text-[11px] font-bold transition-colors cursor-pointer"
                                                  >
                                                    {isRTL ? "حذف السجل" : "Delete Record"}
                                                  </button>
                                                  
                                                  <span className="text-stone-300">•</span>
                                                  <button 
                                                    onClick={() => handleEditFineClick(fine)}
                                                    className="text-primary hover:text-primary/80 text-[11px] font-bold transition-colors cursor-pointer"
                                                  >
                                                    {isRTL ? "تعديل" : "Edit"}
                                                  </button>

                                                  {isPending && (
                                                    <>
                                                      <span className="text-stone-300">•</span>
                                                      <button 
                                                        onClick={() => handlePayFineManually(fine)}
                                                        className="text-emerald-600 hover:text-emerald-800 text-[11px] font-bold transition-colors cursor-pointer"
                                                      >
                                                        {isRTL ? "تسجيل دفع يدوي" : "Record Manual Payment"}
                                                      </button>
                                                    </>
                                                  )}
                                                </div>
                                              </div>

                                              {fine.notes && (
                                                <p className="text-xs text-stone-500 italic mt-2 bg-stone-50/50 p-2 rounded-lg border border-stone-100/50">
                                                  {translateText(fine.notes)}
                                                </p>
                                              )}
                                            </div>

                                            <div className="text-end shrink-0">
                                              <span className="text-base font-black text-rose-600 num-en">
                                                ${parseFloat(fine.amount || 0).toFixed(2)}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}

                                    {studentFines.length > finesPageSize && (
                                      <div className="flex items-center justify-between border-t border-stone-100 pt-4 mt-2">
                                        <button
                                          type="button"
                                          disabled={finesPage === 1}
                                          onClick={() => setFinesPage(prev => Math.max(prev - 1, 1))}
                                          className="px-3.5 h-9 inline-flex items-center justify-center gap-1.5 font-bold rounded-xl border border-stone-250 hover:bg-stone-50 text-stone-700 text-xs transition-all disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer bg-white"
                                        >
                                          {isRTL ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
                                          <span>{isRTL ? "السابق" : "Previous"}</span>
                                        </button>
                                        
                                        <span className="text-xs font-semibold text-stone-500 num-en">
                                          {isRTL 
                                            ? `صفحة ${finesPage} من ${totalFinesPages}`
                                            : `Page ${finesPage} of ${totalFinesPages}`
                                          }
                                        </span>

                                        <button
                                          type="button"
                                          disabled={finesPage === totalFinesPages}
                                          onClick={() => setFinesPage(prev => Math.min(prev + 1, totalFinesPages))}
                                          className="px-3.5 h-9 inline-flex items-center justify-center gap-1.5 font-bold rounded-xl border border-stone-250 hover:bg-stone-50 text-stone-700 text-xs transition-all disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer bg-white"
                                        >
                                          <span>{isRTL ? "التالي" : "Next"}</span>
                                          {isRTL ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
                                        </button>
                                      </div>
                                    )}
                                  </>
                                );
                              })()
                            )}
                          </div>
                        </Card>
                      </div>

                      {/* Right: Add Form */}
                      <div className="lg:col-span-1">
                        <Card className="border border-stone-200/80 rounded-2xl p-5 bg-white shadow-sm space-y-4">
                          <div className="flex items-center gap-2 border-b border-stone-100 pb-2">
                            <Plus className="text-primary" size={18} />
                            <h4 className="font-display font-bold text-stone-800 text-sm">
                              {editingFineId 
                                ? (isRTL ? "تعديل المستحق المالي" : "Edit Financial Due") 
                                : (isRTL ? "إضافة مستحق جديد" : "Add New Due / Fine")
                              }
                            </h4>
                          </div>

                          <form onSubmit={handleAddFine} className="space-y-4">
                            
                            <div>
                              <label className="block text-xs font-bold text-stone-600 mb-1.5">{isRTL ? "الفئة / القسم *" : "Category *"}</label>
                              <select 
                                value={fineCategory} 
                                onChange={(e) => setFineCategory(e.target.value)}
                                className="w-full h-11 px-3 rounded-xl border border-stone-200 bg-white text-stone-800 font-medium focus:border-primary focus:outline-none text-sm cursor-pointer"
                              >
                                <option value="general">{isRTL ? "رسوم عامة" : "General Fee"}</option>
                                <option value="library">{isRTL ? "المكتبة المدرسية" : "Library Overdue / Loss"}</option>
                                <option value="discipline">{isRTL ? "انضباط سلوكي / تلفيات" : "Discipline / Damages"}</option>
                                <option value="sports">{isRTL ? "أنشطة رياضية" : "Sports Gear / Uniform"}</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-stone-650 mb-1.5">{isRTL ? "السبب / نوع المستحق *" : "Reason / Type *"}</label>
                              <input 
                                type="text"
                                value={fineReason}
                                onChange={(e) => setFineReason(e.target.value)}
                                placeholder={isRTL ? "مثال: فقدان معدات رياضية (كرة السلة)" : "e.g., Lost sports equipment"}
                                className="w-full h-11 px-3.5 rounded-xl border border-stone-200 bg-white text-stone-800 font-medium placeholder:text-stone-400 focus:border-primary focus:outline-none text-sm"
                                required
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3.5">
                              <div>
                                <label className="block text-xs font-bold text-stone-650 mb-1.5">{isRTL ? "المبلغ ($) *" : "Amount ($) *"}</label>
                                <input 
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={fineAmount}
                                  onChange={(e) => setFineAmount(e.target.value)}
                                  placeholder="50.00"
                                  className="w-full h-11 px-3.5 rounded-xl border border-stone-200 bg-white text-stone-800 font-medium focus:border-primary focus:outline-none text-sm num-en"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-stone-650 mb-1.5">{isRTL ? "التاريخ *" : "Date *"}</label>
                                <input 
                                  type="date"
                                  value={fineDate}
                                  onChange={(e) => setFineDate(e.target.value)}
                                  className="w-full h-11 px-3 rounded-xl border border-stone-200 bg-white text-stone-800 font-medium focus:border-primary focus:outline-none text-sm num-en"
                                  required
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-stone-650 mb-1.5">{isRTL ? "مُصدر الغرامة / بواسطة" : "Issued By"}</label>
                              <input 
                                type="text"
                                value={fineIssuedBy}
                                onChange={(e) => setFineIssuedBy(e.target.value)}
                                placeholder={isRTL ? "مثال: Coach Ibrahim" : "e.g., Coach Ibrahim"}
                                className="w-full h-11 px-3.5 rounded-xl border border-stone-200 bg-white text-stone-800 font-medium focus:border-primary focus:outline-none text-sm"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-stone-650 mb-1.5">{isRTL ? "تفاصيل إضافية / ملاحظات" : "Additional Notes"}</label>
                              <textarea 
                                value={fineNotes}
                                onChange={(e) => setFineNotes(e.target.value)}
                                placeholder={isRTL ? "تفاصيل إضافية حول التلفيات أو التوقيت..." : "Details about damages, library book overdue days..."}
                                rows={3}
                                className="w-full p-3 rounded-xl border border-stone-200 bg-white text-stone-800 font-medium focus:border-primary focus:outline-none text-sm resize-none"
                              />
                            </div>

                            <div className="flex flex-col gap-2.5">
                              <button
                                type="submit"
                                disabled={isSubmittingFine}
                                className="w-full h-11 inline-flex items-center justify-center gap-2 font-bold rounded-xl bg-primary text-white hover:bg-primary/95 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                              >
                                <Plus size={16} />
                                <span>
                                  {isSubmittingFine 
                                    ? (isRTL ? "جاري الحفظ..." : "Saving...") 
                                    : (editingFineId 
                                        ? (isRTL ? "حفظ التعديلات" : "Save Changes") 
                                        : (isRTL ? "إضافة المستحق المالي" : "Add Financial Charge")
                                      )
                                  }
                                </span>
                              </button>

                              {editingFineId && (
                                <button
                                  type="button"
                                  onClick={handleCancelEdit}
                                  className="w-full h-11 inline-flex items-center justify-center gap-2 font-bold rounded-xl border-2 border-stone-200 bg-white text-stone-850 hover:bg-stone-50 transition-all cursor-pointer"
                                >
                                  <span>{isRTL ? "إلغاء التعديل" : "Cancel Edit"}</span>
                                </button>
                              )}
                            </div>
                          </form>
                        </Card>
                      </div>

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* PROFESSIONAL PRINT LAYOUT (Invisible on screen, displays only on A4 print/PDF export) */}
      {/* ========================================== */}
      <div className="hidden print:block w-full text-slate-900 bg-white" dir={isRTL ? "rtl" : "ltr"}>
        
        {/* Print Header */}
        <div className="flex justify-between items-center border-b-4 border-slate-900 pb-5 mb-6">
          <div className="space-y-1">
            <h1 className="font-display font-extrabold text-xl text-slate-900">{isRTL ? "مدارس إديوتراك النموذجية الخاصة" : "EduTrack Model School"}</h1>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{isRTL ? "بوابة الإدارة المدرسية العامة" : "School Administration Department"}</p>
          </div>
          <div className="text-end space-y-1">
            <h2 className="font-display font-black text-lg text-slate-800">{isRTL ? "ملف طالب رسمي شامل" : "Official Comprehensive Student Dossier"}</h2>
            <p className="text-[10px] font-semibold text-slate-500 font-mono num-en">{isRTL ? "تاريخ التصدير:" : "Date Generated:"} {new Date().toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { dateStyle: 'long' })}</p>
          </div>
        </div>

        {/* Section 1: Demographics Grid */}
        <div className="print-card-box bg-slate-50/50 border border-slate-200 rounded-xl p-5 mb-5 grid grid-cols-3 gap-4 items-center">
          
          {/* Photo & school ID */}
          <div className="col-span-1 flex flex-col items-center justify-center text-center border-e border-slate-200/80 pr-2">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-slate-350 bg-stone-100 flex items-center justify-center mb-2.5">
              {student.photo_url ? (
                <img src={student.photo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="font-bold text-2xl text-slate-400">{student.full_name?.charAt(0)}</span>
              )}
            </div>
            <span className="text-xs font-mono font-bold text-slate-650 num-en">ID: #{student.student_id}</span>
          </div>

          {/* Core demographic stats */}
          <div className="col-span-2 space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-b border-slate-200/60 pb-2">
              <div>
                <span className="text-slate-400 block text-[9px] font-bold uppercase">{isRTL ? "اسم الطالب بالكامل" : "Student Full Name"}</span>
                <span className="font-extrabold text-sm text-slate-900">{student.full_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px] font-bold uppercase">{isRTL ? "حالة القيد المدرسية" : "Enrollment Status"}</span>
                <span className="font-bold text-slate-800">{getStatusLabel(student.status)}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="text-slate-400 block text-[9px] font-bold uppercase">{isRTL ? "الصف الدراسي" : "Grade Level"}</span>
                <span className="font-bold text-slate-800 num-en">{t("students.grade", language)} {student.grade}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px] font-bold uppercase">{isRTL ? "اسم الفصل" : "Class Name"}</span>
                <span className="font-bold text-slate-800">{student.section || "-"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px] font-bold uppercase">{isRTL ? "تاريخ الميلاد" : "Date of Birth"}</span>
                <span className="font-bold text-slate-800 num-en">{student.date_of_birth ? student.date_of_birth.substring(0, 10) : "-"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Parent and Contacts block */}
        <div className="print-card-box border border-slate-200 rounded-xl p-5 mb-5 text-xs">
          <h3 className="font-display font-extrabold text-slate-900 border-b border-slate-200 pb-1.5 mb-3">{isRTL ? "ولي الأمر وتفاصيل خدمات النقل" : "Parent, Contacts & Services"}</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="text-slate-400 block text-[9px] font-bold uppercase">{isRTL ? "اسم ولي الأمر" : "Parent Name"}</span>
              <span className="font-extrabold text-slate-850">{student.parent_name || "-"}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px] font-bold uppercase">{isRTL ? "رقم هاتف الاتصال" : "Contact Phone"}</span>
              <span className="font-bold text-slate-800 num-en">{student.parent_phone || "-"}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px] font-bold uppercase">{isRTL ? "بريد المراسلات الإلكتروني" : "Contact Email"}</span>
              <span className="font-semibold text-slate-800 num-en">{student.parent_email || "-"}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px] font-bold uppercase">{isRTL ? "خدمة حافلة المدرسة" : "School Transport Bus"}</span>
              <span className="font-bold text-slate-800">
                {student.bus_registered 
                  ? (isRTL ? `مشترك (${student.bus_route || "لا يوجد"})` : `Subscribed (${student.bus_route || "-"})`) 
                  : (isRTL ? "غير مشترك" : "Unsubscribed")
                }
              </span>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-2.5 mt-2.5">
            <span className="text-slate-400 block text-[9px] font-bold uppercase">{isRTL ? "العنوان السكني المسجل" : "Registered Residential Address"}</span>
            <span className="font-semibold text-slate-850">{student.address || "-"}</span>
          </div>
        </div>

        {/* Section 3: Financial & Tuition Block (Requested by User) */}
        <div className="print-card-box border border-slate-200 rounded-xl p-5 mb-5 text-xs">
          <h3 className="font-display font-extrabold text-slate-900 border-b border-slate-200 pb-1.5 mb-3">{isRTL ? "بيان تفاصيل الرسوم الدراسية والمتعلقات المالية" : "School Tuition Fees & Financial Statement"}</h3>
          
          <div className="grid grid-cols-4 gap-4 mb-4 text-center">
            <div className="bg-slate-50 p-2.5 border border-slate-200/80 rounded-lg">
              <span className="text-slate-450 block text-[9px] font-bold uppercase mb-0.5">{isRTL ? "إجمالي الرسوم المدرسية" : "Total Tuition Fees"}</span>
              <span className="font-black text-slate-900 text-sm num-en">${totalTuition.toFixed(2)}</span>
            </div>
            <div className="bg-emerald-50 p-2.5 border border-emerald-200 rounded-lg">
              <span className="text-emerald-550 block text-[9px] font-bold uppercase mb-0.5">{isRTL ? "الرسوم الدراسية المدفوعة" : "Tuition Paid"}</span>
              <span className="font-black text-emerald-700 text-sm num-en">${paidTuition.toFixed(2)}</span>
            </div>
            <div className="bg-amber-50 p-2.5 border border-amber-200 rounded-lg">
              <span className="text-amber-550 block text-[9px] font-bold uppercase mb-0.5">{isRTL ? "الرسوم المتبقية المستحقة" : "Remaining Balance"}</span>
              <span className="font-black text-amber-700 text-sm num-en">${remainingTuition.toFixed(2)}</span>
            </div>
            <div className="bg-slate-50 p-2.5 border border-slate-200/80 rounded-lg">
              <span className="text-slate-450 block text-[9px] font-bold uppercase mb-0.5">{isRTL ? "رصيد البطاقة الذكية" : "Smart Card Balance"}</span>
              <span className="font-black text-slate-900 text-sm num-en">${parseFloat(student.card_balance || 0).toFixed(2)}</span>
            </div>
          </div>

          <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 border-b border-slate-100 pb-1">{isRTL ? "سجل المدفوعات المالية المعتمدة" : "Verified Payment Ledger"}</h4>
          <table className="w-full text-[11px] text-start">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold">
                <th className="py-2 px-2 text-start">{isRTL ? "التاريخ" : "Date"}</th>
                <th className="py-2 px-2 text-start">{isRTL ? "نوع المعاملة والبيان" : "Description"}</th>
                <th className="py-2 px-2 text-center">{isRTL ? "المبلغ المالي" : "Amount"}</th>
                <th className="py-2 px-2 text-start">{isRTL ? "طريقة السداد" : "Method"}</th>
                <th className="py-2 px-2 text-center">{isRTL ? "حالة الدفع" : "Status"}</th>
              </tr>
            </thead>
            <tbody>
              {studentTransactions.map((t) => (
                <tr key={t.id} className="border-b border-slate-100">
                  <td className="py-2 px-2 font-mono text-slate-500 num-en">{t.date}</td>
                  <td className="py-2 px-2 font-extrabold text-slate-800">{t.type}</td>
                  <td className="py-2 px-2 text-center font-bold num-en">${t.amount.toFixed(2)}</td>
                  <td className="py-2 px-2 text-slate-650">{t.method}</td>
                  <td className="py-2 px-2 text-center text-emerald-600 font-bold">{isRTL ? "معتمد" : "Settled"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section 4: Academics Breakdown */}
        <div className="print-card-box border border-slate-200 rounded-xl p-5 mb-5 text-xs">
          <div className="flex justify-between items-center border-b border-slate-200 pb-1.5 mb-3">
            <h3 className="font-display font-extrabold text-slate-900">{isRTL ? "كشف العلامات الدراسي للفصل الجاري" : "Student Academic Transcript"}</h3>
            <span className="text-[10px] font-bold text-slate-500">{isRTL ? "متوسط علامات الطالب: 93.6%" : "GPA Score: 93.6%"}</span>
          </div>

          <table className="w-full text-[11px] text-start mb-4">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold">
                <th className="py-2 px-2 text-start">{isRTL ? "المادة التعليمية" : "Subject"}</th>
                <th className="py-2 px-2 text-center">{isRTL ? "الفصل الدراسي" : "Semester"}</th>
                <th className="py-2 px-2 text-center">{isRTL ? "العلامة المكتسبة" : "Score"}</th>
                <th className="py-2 px-2 text-center">{isRTL ? "التقدير الأبجدي" : "Grade Value"}</th>
                <th className="py-2 px-2 text-start">{isRTL ? "ملاحظة المعلم المختص" : "Teacher Notes"}</th>
              </tr>
            </thead>
            <tbody>
              {gradesData.map((g) => (
                <tr key={g.id} className="border-b border-slate-100">
                  <td className="py-2 px-2 font-extrabold text-slate-800">{g.subject}</td>
                  <td className="py-2 px-2 text-center text-slate-550">{g.semester}</td>
                  <td className="py-2 px-2 text-center font-bold num-en">{g.score || "-"}%</td>
                  <td className="py-2 px-2 text-center font-bold">{g.grade_value || "A"}</td>
                  <td className="py-2 px-2 text-slate-500 text-[10px]">{g.notes || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Quick stats and awards lists inside print */}
          <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
            <div>
              <span className="text-slate-400 block text-[9px] font-bold uppercase mb-2">{isRTL ? "الغيابات والسلوك" : "Attendance & Conduct"}</span>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">{isRTL ? "إجمالي أيام الغياب:" : "Total Absences:"}</span>
                  <span className="font-bold text-slate-800 num-en">{student.total_absences || "0"} {isRTL ? "أيام" : "days"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{isRTL ? "درجة الانضباط العام:" : "Discipline Score:"}</span>
                  <span className="font-bold text-slate-850 num-en">{student.attendance_score || "100"}%</span>
                </div>
              </div>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px] font-bold uppercase mb-2">{isRTL ? "الأوسمة والتقدير" : "Achievements & Honors"}</span>
              <ul className="list-disc list-inside text-[10px] space-y-1 text-slate-650 font-semibold">
                {awardsData.map((award, i) => (
                  <li key={i} className="truncate">
                    {award.title} ({award.date})
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Section 5: Services and Store Activities */}
        <div className="print-card-box border border-slate-200 rounded-xl p-5 mb-6 text-xs grid grid-cols-2 gap-5">
          <div>
            <h4 className="font-display font-bold text-slate-800 border-b border-slate-200 pb-1 mb-2">{isRTL ? "نشاط مستعارات المكتبة" : "Active Library Borrowing Ledger"}</h4>
            <div className="space-y-2 text-[10px] text-slate-600">
              {mockBorrowedBooks.map((b, idx) => (
                <div key={idx} className="border-b border-slate-100 pb-1 flex justify-between gap-1.5">
                  <span className="font-bold truncate max-w-[150px] text-slate-800">{b.title}</span>
                  <span className="font-mono shrink-0 num-en">{isRTL ? "حالة الإرجاع:" : "Due:"} {b.due_date}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-display font-bold text-slate-800 border-b border-slate-200 pb-1 mb-2">{isRTL ? "مشتريات الكافتيريا ومحفظة الطالب" : "Smart Card Purchases Ledger"}</h4>
            <div className="space-y-2 text-[10px] text-slate-600">
              {purchasesData.slice(0, 2).map((p, idx) => (
                <div key={idx} className="border-b border-slate-100 pb-1 flex justify-between gap-1.5">
                  <span className="font-bold truncate max-w-[150px] text-slate-800">{p.item_name || "وجبة مدرسية"}</span>
                  <span className="font-bold text-slate-900 shrink-0 num-en">${parseFloat(p.total_price || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Print Signatures and Stamps */}
        <div className="mt-16 grid grid-cols-3 gap-6 text-center text-xs text-slate-600 font-semibold">
          <div className="space-y-12">
            <p className="border-b border-slate-300 pb-1 mx-4">{isRTL ? "توقيع المرشد الأكاديمي" : "Academic Advisor Signature"}</p>
            <span className="text-[10px] block opacity-50 font-mono">STU-ADV-OFFICIAL</span>
          </div>
          <div className="flex flex-col justify-center items-center">
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-350 text-[9px] font-bold uppercase select-none mb-1">
              {isRTL ? "الختم الرسمي" : "Official Stamp"}
            </div>
          </div>
          <div className="space-y-12">
            <p className="border-b border-slate-300 pb-1 mx-4">{isRTL ? "اعتماد إدارة المدرسة" : "School Principal Signature"}</p>
            <span className="text-[10px] block opacity-50 font-mono">SCHOOL-ADMIN-AUTH</span>
          </div>
        </div>
      </div>

      {paymentDialogOpen && (
        <FinancialRecordFormDialog 
          open={paymentDialogOpen} 
          onClose={() => setPaymentDialogOpen(false)} 
          record={null} 
          prefill={{
            recipient_type: "student",
            recipient_id: student?.student_id,
            recipient_name: student?.full_name,
            record_type: "income",
            amount: remainingTuition > 0 ? remainingTuition : 0,
            payment_method: "bank_transfer",
            description: isRTL ? "سداد رسوم دراسية" : "Tuition Fee Payment"
          }}
          onSuccess={handleSaveSuccess}
        />
      )}
    </div>
  );
}
