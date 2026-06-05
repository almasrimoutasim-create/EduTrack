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
  ShoppingBag,
  Clock,
  Sparkles,
  BookOpen,
  ArrowRight,
  Printer,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  FileText
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
import ParentTeacherChat from "@/components/portal/ParentTeacherChat";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// @ts-ignore
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all border-2 border-stone-300 bg-white text-stone-800 hover:bg-stone-50 hover:border-stone-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const btnPrimary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all bg-stone-900 text-white hover:bg-black cursor-pointer shadow-lg shadow-stone-200 disabled:opacity-50 disabled:cursor-not-allowed";

export default function ParentPortal() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";
  const queryStudentId = searchParams.get("student_id");
  
  const [topUpAmount, setTopUpAmount] = React.useState(0);
  const [customTopUp, setCustomTopUp] = React.useState("");

  // Manual link dialog states
  const [isLinkDialogOpen, setIsLinkDialogOpen] = React.useState(false);
  const [linkStudentId, setLinkStudentId] = React.useState("");
  const [linkStudentName, setLinkStudentName] = React.useState("");
  const [linkRelationship, setLinkRelationship] = React.useState("father");
  const [isSubmittingLink, setIsSubmittingLink] = React.useState(false);

  const [perfTab, setPerfTab] = React.useState("grades");

  // Tuition payment states
  const [isTuitionDialogOpen, setIsTuitionDialogOpen] = React.useState(false);
  const [tuitionPayAmount, setTuitionPayAmount] = React.useState(0);
  const [customTuitionPay, setCustomTuitionPay] = React.useState("");
  const [tuitionPayMethod, setTuitionPayMethod] = React.useState("stripe"); // "stripe" | "wallet"
  const [isSubmittingTuition, setIsSubmittingTuition] = React.useState(false);

  // Parse parent credentials from auth context
  const portalUserStr = localStorage.getItem("portal_user");
  const portalUser = portalUserStr ? JSON.parse(portalUserStr) : null;
  const parentEmail = portalUser?.email || "abdo@gmail.com";
  const parentName = portalUser?.full_name || "ولي الأمر";
  
  const { data: children = [], refetch: refetchChildren } = useQuery({ 
    queryKey: ["parent-children", parentEmail], 
    enabled: !!parentEmail,
    // @ts-ignore
    queryFn: () => base44.entities.Student.list("-created_at", { parent_email: parentEmail }) 
  });

  const [selectedStudentId, setSelectedStudentId] = React.useState(null);
  const [canteenPage, setCanteenPage] = React.useState(1);
  const [finesCollapsed, setFinesCollapsed] = React.useState(false);
  const [historyCollapsed, setHistoryCollapsed] = React.useState(false);
  const [purchasesCollapsed, setPurchasesCollapsed] = React.useState(false);

  React.useEffect(() => {
    if (children.length > 0 && !selectedStudentId) {
      setSelectedStudentId(children[0].id);
    }
  }, [children, selectedStudentId]);

  // Set performance student based on search query or selected child
  const perfStudentId = queryStudentId || selectedStudentId || (children[0]?.id);
  const currentStudent = children.find(c => c.id === selectedStudentId) || children[0];
  const perfStudent = children.find(c => c.id === perfStudentId) || children[0];

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
      qc.invalidateQueries({ queryKey: ["parent-children", parentEmail] });
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

  const handleLinkSubmit = async (e) => {
    e.preventDefault();
    if (!linkStudentId || !linkStudentName) return;
    setIsSubmittingLink(true);
    try {
      // Create Link Request
      await base44.entities.ParentLinkRequest.create({
        parent_email: parentEmail,
        parent_name: parentName,
        student_id: linkStudentId,
        student_name: linkStudentName,
        relationship: linkRelationship,
        status: "pending"
      });
      toast.success(isRTL ? "تم إرسال طلب ربط الطالب بنجاح وفي انتظار موافقة الإدارة." : "Student link request submitted successfully. Pending admin approval.");
      setIsLinkDialogOpen(false);
      setLinkStudentId("");
      setLinkStudentName("");
    } catch (err) {
      console.error(err);
      toast.error(isRTL ? "فشل إرسال طلب الربط" : "Failed to submit link request");
    } finally {
      setIsSubmittingLink(false);
    }
  };

  const handlePayTuitionSuccess = async () => {
    if (!currentStudent) return;
    setIsSubmittingTuition(true);
    try {
      const currentPaid = parseFloat(currentStudent.tuition_paid) || 0;
      const newPaid = currentPaid + tuitionPayAmount;
      
      // 1. Update Student's tuition_paid in database
      await base44.entities.Student.update(currentStudent.id, { tuition_paid: newPaid });

      // 2. Create FinancialRecord in database
      await base44.entities.FinancialRecord.create({
        type: "income",
        record_type: "tuition",
        recipient_type: "student",
        recipient_name: currentStudent.full_name,
        recipient_id: currentStudent.id,
        amount: tuitionPayAmount,
        description: `Tuition Installment Payment (Stripe)`,
        payment_date: new Date().toISOString().split('T')[0],
        status: "paid",
        payment_method: "credit_card"
      });

      qc.invalidateQueries({ queryKey: ["parent-children", parentEmail] });
      qc.invalidateQueries({ queryKey: ["financial-records"] });
      qc.invalidateQueries({ queryKey: ["parent-student-records", currentStudent.id] });

      toast.success(isRTL ? `تم دفع الرسوم الدراسية بقيمة $${tuitionPayAmount.toFixed(2)} بنجاح!` : `Tuition paid by $${tuitionPayAmount.toFixed(2)} successfully!`);
      setIsTuitionDialogOpen(false);
      setTuitionPayAmount(0);
      setCustomTuitionPay("");
    } catch (err) {
      console.error(err);
      toast.error(isRTL ? "فشل تسجيل دفعة الرسوم" : "Failed to record tuition payment");
    } finally {
      setIsSubmittingTuition(false);
    }
  };

  const handlePayTuitionWallet = async () => {
    if (!currentStudent) return;
    const cardBalance = parseFloat(currentStudent.card_balance) || 0;
    if (cardBalance < tuitionPayAmount) {
      toast.error(isRTL ? "عذراً، رصيد محفظة الطالب غير كافٍ لإتمام السداد." : "Insufficient student wallet balance.");
      return;
    }
    setIsSubmittingTuition(true);
    try {
      const currentPaid = parseFloat(currentStudent.tuition_paid) || 0;
      const newPaid = currentPaid + tuitionPayAmount;
      const newBalance = cardBalance - tuitionPayAmount;

      // 1. Update Student's tuition_paid and card_balance in database
      await base44.entities.Student.update(currentStudent.id, { 
        tuition_paid: newPaid,
        card_balance: newBalance 
      });

      // 2. Create FinancialRecord in database
      await base44.entities.FinancialRecord.create({
        type: "income",
        record_type: "tuition",
        recipient_type: "student",
        recipient_name: currentStudent.full_name,
        recipient_id: currentStudent.id,
        amount: tuitionPayAmount,
        description: `Tuition Payment from EduWallet`,
        payment_date: new Date().toISOString().split('T')[0],
        status: "paid",
        payment_method: "digital_wallet"
      });

      qc.invalidateQueries({ queryKey: ["parent-children", parentEmail] });
      qc.invalidateQueries({ queryKey: ["financial-records"] });
      qc.invalidateQueries({ queryKey: ["parent-student-records", currentStudent.id] });

      toast.success(isRTL ? `تم خصم $${tuitionPayAmount.toFixed(2)} من بطاقة الطالب وسداد الرسوم بنجاح!` : `Paid $${tuitionPayAmount.toFixed(2)} from smart card successfully!`);
      setIsTuitionDialogOpen(false);
      setTuitionPayAmount(0);
      setCustomTuitionPay("");
    } catch (err) {
      console.error(err);
      toast.error(isRTL ? "فشل إتمام الدفع عبر المحفظة" : "Wallet payment failed");
    } finally {
      setIsSubmittingTuition(false);
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
    queryFn: () => base44.entities.Purchase.list("-created_at", { student_id: selectedStudentId })
  });

  const { data: fines = [] } = useQuery({
    queryKey: ["parent-fines", selectedStudentId],
    enabled: !!selectedStudentId,
    // @ts-ignore
    queryFn: () => base44.entities.Fine.filter({ student_id: selectedStudentId }, "-created_date")
  });

  const { data: currentStudentRecords = [] } = useQuery({
    queryKey: ["parent-student-records", currentStudent?.id],
    enabled: !!currentStudent?.id,
    // @ts-ignore
    queryFn: async () => {
      // recipient_id can store UUID or student_id, query both to be 100% robust
      const list1 = await base44.entities.FinancialRecord.filter({ recipient_id: currentStudent.id });
      const list2 = await base44.entities.FinancialRecord.filter({ recipient_id: currentStudent.student_id });
      const merged = [...list1, ...list2];
      const unique = Array.from(new Map(merged.map(item => [item.id, item])).values());
      return unique;
    }
  });

  const dynamicTuitionPaid = currentStudentRecords
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

  // Query performance-related child data
  const { data: studentGrades = [] } = useQuery({
    queryKey: ["student-grades", perfStudentId],
    enabled: activeTab === "performance" && !!perfStudentId,
    // @ts-ignore
    queryFn: () => base44.entities.StudentGrade.list("-created_at", { student_id: perfStudentId })
  });

  const { data: attendanceLogs = [] } = useQuery({
    queryKey: ["student-attendance", perfStudentId],
    enabled: activeTab === "performance" && !!perfStudentId,
    // @ts-ignore
    queryFn: () => base44.entities.Attendance.list("-date", { student_id: perfStudentId })
  });

  const { data: studentAwards = [] } = useQuery({
    queryKey: ["student-awards", perfStudentId],
    enabled: activeTab === "performance" && !!perfStudentId,
    // @ts-ignore
    queryFn: () => base44.entities.StudentAward.list("-created_at", { student_id: perfStudentId })
  });

  const { data: officialAnnouncements = [] } = useQuery({
    queryKey: ["official-announcements-parent"],
    queryFn: () => base44.entities.OfficialAnnouncement.list("-created_at")
  });

  const parentAnnouncements = React.useMemo(() => {
    return officialAnnouncements.filter(a => a.target_audience === "parents" || a.target_audience === "all");
  }, [officialAnnouncements]);

  const { data: portalNotifications = [] } = useQuery({
    queryKey: ["portal-notifications-parent", parentEmail],
    queryFn: () => base44.entities.PortalNotification.list("-created_at", { user_id: parentEmail }),
    enabled: !!parentEmail
  });

  const [dismissedAnnouncements, setDismissedAnnouncements] = React.useState(() => {
    try {
      return JSON.parse(localStorage.getItem("dismissed_announcements") || "[]");
    } catch {
      return [];
    }
  });

  const [readAnnouncements, setReadAnnouncements] = React.useState(() => {
    try {
      return JSON.parse(localStorage.getItem("read_announcements") || "[]");
    } catch {
      return [];
    }
  });

  const handleDismissAnnouncement = (id) => {
    const next = [...dismissedAnnouncements, id];
    setDismissedAnnouncements(next);
    localStorage.setItem("dismissed_announcements", JSON.stringify(next));

    if (!readAnnouncements.includes(id)) {
      const nextRead = [...readAnnouncements, id];
      setReadAnnouncements(nextRead);
      localStorage.setItem("read_announcements", JSON.stringify(nextRead));
      qc.invalidateQueries({ queryKey: ["official-announcements-sidebar"] });
    }
  };

  const handleMarkAnnouncementAsRead = (id) => {
    if (!readAnnouncements.includes(id)) {
      const nextRead = [...readAnnouncements, id];
      setReadAnnouncements(nextRead);
      localStorage.setItem("read_announcements", JSON.stringify(nextRead));
      qc.invalidateQueries({ queryKey: ["official-announcements-sidebar"] });
    }
  };

  const unreadAnnouncementsCount = parentAnnouncements.filter(a => !readAnnouncements.includes(a.id)).length;
  const unreadPortalNotificationsCount = portalNotifications.filter(n => !n.is_read).length;
  const totalUnreadCount = unreadAnnouncementsCount + unreadPortalNotificationsCount;

  const activeHighPriorityAnnouncements = React.useMemo(() => {
    return parentAnnouncements.filter(a => a.priority === "high" && !dismissedAnnouncements.includes(a.id));
  }, [parentAnnouncements, dismissedAnnouncements]);

  const handlePrintPurchases = () => {
    const printWindow = window.open("", "_blank");
    const titleText = isRTL ? "تقرير مشتريات المقصف والمتجر" : "Canteen & Store Purchases Report";
    const studentName = currentStudent?.full_name || currentStudent?.name || "";
    
    printWindow.document.write(`
      <html>
        <head>
          <title>${titleText}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1c1917; direction: ${isRTL ? 'rtl' : 'ltr'}; text-align: ${isRTL ? 'right' : 'left'}; }
            h1 { font-family: serif; color: #1c1917; margin-bottom: 5px; }
            p { color: #78716c; font-size: 14px; margin-top: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 30px; }
            th, td { padding: 12px 15px; border-bottom: 1px solid #e7e5e4; text-align: ${isRTL ? 'right' : 'left'}; }
            th { background-color: #f5f5f4; font-size: 12px; text-transform: uppercase; color: #78716c; }
            td { font-size: 14px; font-weight: 600; }
            .price { color: #e11d48; font-weight: 800; }
            .footer { margin-top: 50px; font-size: 11px; color: #a8a29e; border-top: 1px solid #f5f5f4; padding-top: 20px; text-align: center; }
          </style>
        </head>
        <body>
          <h1>${titleText}</h1>
          <p>${isRTL ? 'اسم الطالب:' : 'Student Name:'} <strong>${studentName}</strong> | ${isRTL ? 'التاريخ:' : 'Date:'} ${new Date().toLocaleDateString()}</p>
          <table>
            <thead>
              <tr>
                <th>${isRTL ? "المنتج" : "Item"}</th>
                <th>${isRTL ? "التاريخ" : "Date"}</th>
                <th>${isRTL ? "الكمية" : "Qty"}</th>
                <th>${isRTL ? "الإجمالي" : "Total"}</th>
              </tr>
            </thead>
            <tbody>
              ${storePurchases.map(p => `
                <tr>
                  <td>${p.item_name}</td>
                  <td>${p.created_at ? p.created_at.split('T')[0] : "—"}</td>
                  <td>${p.quantity}</td>
                  <td class="price">$${parseFloat(p.total_price || p.total_amount || 0).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">EduTrack Portal © ${new Date().getFullYear()}</div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintFines = () => {
    const printWindow = window.open("", "_blank");
    const titleText = isRTL ? "تقرير الرسوم والمستحقات المفتوحة" : "Outstanding Fees & Fines Report";
    const studentName = currentStudent?.full_name || currentStudent?.name || "";
    const pendingFines = fines.filter(f => f.status === "pending");
    
    printWindow.document.write(`
      <html>
        <head>
          <title>${titleText}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1c1917; direction: ${isRTL ? 'rtl' : 'ltr'}; text-align: ${isRTL ? 'right' : 'left'}; }
            h1 { font-family: serif; color: #1c1917; margin-bottom: 5px; }
            p { color: #78716c; font-size: 14px; margin-top: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 30px; }
            th, td { padding: 12px 15px; border-bottom: 1px solid #e7e5e4; text-align: ${isRTL ? 'right' : 'left'}; }
            th { background-color: #f5f5f4; font-size: 12px; text-transform: uppercase; color: #78716c; }
            td { font-size: 14px; font-weight: 600; }
            .price { color: #dc2626; font-weight: 850; }
            .badge { display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: bold; background-color: #fee2e2; color: #991b1b; }
            .footer { margin-top: 50px; font-size: 11px; color: #a8a29e; border-top: 1px solid #f5f5f4; padding-top: 20px; text-align: center; }
          </style>
        </head>
        <body>
          <h1>${titleText}</h1>
          <p>${isRTL ? 'اسم الطالب:' : 'Student Name:'} <strong>${studentName}</strong> | ${isRTL ? 'التاريخ:' : 'Date:'} ${new Date().toLocaleDateString()}</p>
          <table>
            <thead>
              <tr>
                <th>${isRTL ? "المستحق / السبب" : "Reason"}</th>
                <th>${isRTL ? "الفئة" : "Category"}</th>
                <th>${isRTL ? "التاريخ" : "Date"}</th>
                <th>${isRTL ? "القيمة" : "Amount"}</th>
              </tr>
            </thead>
            <tbody>
              ${pendingFines.length === 0 ? `<tr><td colspan="4" style="text-align:center; color:#a8a29e; padding: 30px;">${isRTL ? "لا توجد مستحقات معلقة حالياً." : "No outstanding dues found."}</td></tr>` : 
              pendingFines.map(f => `
                <tr>
                  <td>${f.reason}</td>
                  <td>${f.category || "—"}</td>
                  <td>${f.date}</td>
                  <td class="price">$${parseFloat(f.amount || 0).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">EduTrack Portal © ${new Date().getFullYear()}</div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintHistory = () => {
    const printWindow = window.open("", "_blank");
    const titleText = isRTL ? "كشف المدفوعات والعمليات السابقة" : "Cleared Payments Ledger Report";
    const studentName = currentStudent?.full_name || currentStudent?.name || "";
    const paidFines = fines.filter(f => f.status === "paid");
    
    printWindow.document.write(`
      <html>
        <head>
          <title>${titleText}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1c1917; direction: ${isRTL ? 'rtl' : 'ltr'}; text-align: ${isRTL ? 'right' : 'left'}; }
            h1 { font-family: serif; color: #1c1917; margin-bottom: 5px; }
            p { color: #78716c; font-size: 14px; margin-top: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 30px; }
            th, td { padding: 12px 15px; border-bottom: 1px solid #e7e5e4; text-align: ${isRTL ? 'right' : 'left'}; }
            th { background-color: #f5f5f4; font-size: 12px; text-transform: uppercase; color: #78716c; }
            td { font-size: 14px; font-weight: 600; }
            .price { color: #059669; font-weight: 850; }
            .badge { display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: bold; background-color: #d1fae5; color: #065f46; }
            .footer { margin-top: 50px; font-size: 11px; color: #a8a29e; border-top: 1px solid #f5f5f4; padding-top: 20px; text-align: center; }
          </style>
        </head>
        <body>
          <h1>${titleText}</h1>
          <p>${isRTL ? 'اسم الطالب:' : 'Student Name:'} <strong>${studentName}</strong> | ${isRTL ? 'التاريخ:' : 'Date:'} ${new Date().toLocaleDateString()}</p>
          <table>
            <thead>
              <tr>
                <th>${isRTL ? "المستحق / السبب" : "Reason"}</th>
                <th>${isRTL ? "الفئة" : "Category"}</th>
                <th>${isRTL ? "التاريخ" : "Date"}</th>
                <th>${isRTL ? "القيمة المسددة" : "Amount Paid"}</th>
              </tr>
            </thead>
            <tbody>
              ${paidFines.length === 0 ? `<tr><td colspan="4" style="text-align:center; color:#a8a29e; padding: 30px;">${isRTL ? "لا يوجد سجل للمدفوعات السابقة." : "No payment history found."}</td></tr>` : 
              paidFines.map(f => `
                <tr>
                  <td>${f.reason}</td>
                  <td>${f.category || "—"}</td>
                  <td>${f.date}</td>
                  <td class="price">$${parseFloat(f.amount || 0).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">EduTrack Portal © ${new Date().getFullYear()}</div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const purchasesPerPage = 5;
  const indexOfLastPurchase = canteenPage * purchasesPerPage;
  const indexOfFirstPurchase = indexOfLastPurchase - purchasesPerPage;
  const currentPurchases = storePurchases.slice(indexOfFirstPurchase, indexOfLastPurchase);
  const totalCanteenPages = Math.ceil(storePurchases.length / purchasesPerPage) || 1;

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
              <button 
                onClick={() => setSearchParams({ tab: "messages" })}
                className={`${btnOutline} rounded-full h-12 px-6`}
              >
                <MessageCircle size={18} />
                {isRTL ? "تواصل مع المعلمين" : "Contact Teachers"}
              </button>
              <button 
                onClick={() => setSearchParams({ tab: "notifications" })}
                className={`${btnPrimary.split(' ').filter(c => !c.includes('shadow')).join(' ')} bg-rose-500 hover:bg-rose-600 text-white rounded-full h-12 px-6 shadow-lg shadow-rose-100`}
              >
                <Bell size={18} />
                {isRTL ? "الإشعارات" : "Notifications"}
                {totalUnreadCount > 0 && (
                  <span className="bg-white text-rose-500 text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center">
                    {totalUnreadCount}
                  </span>
                )}
              </button>
            </div>
          </PageHeader>

          {/* High Priority Announcements Banner */}
          {activeHighPriorityAnnouncements.length > 0 && (
            <div className="space-y-3">
              {activeHighPriorityAnnouncements.map(ann => (
                <div 
                  key={ann.id} 
                  className="p-5 bg-gradient-to-r from-rose-550 to-rose-600 text-white rounded-[24px] shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 animate-bounce"
                  style={{ animationDuration: '3s' }}
                >
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shrink-0">
                      <AlertTriangle size={20} className="text-yellow-300" />
                    </div>
                    <div>
                      <h4 className="font-serif font-black tracking-tight text-base mb-0.5">{isRTL ? `قرار رسمي عاجل: ${ann.title}` : `Urgent Announcement: ${ann.title}`}</h4>
                      <p className="text-rose-100 text-xs font-medium leading-relaxed max-w-2xl">{ann.content}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleDismissAnnouncement(ann.id)}
                      className="bg-white/10 hover:bg-white/15 text-white border border-white/20 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer"
                    >
                      {isRTL ? "إغلاق مؤقت" : "Dismiss"}
                    </button>
                    <button 
                      onClick={() => {
                        handleMarkAnnouncementAsRead(ann.id);
                        setSearchParams({ tab: "notifications" });
                      }}
                      className="bg-white text-rose-600 hover:bg-rose-50 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-md cursor-pointer"
                    >
                      {isRTL ? "عرض التفاصيل" : "View Details"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "wallet" && (
            <div className="space-y-8 animate-fadeIn">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-serif text-3xl font-bold text-stone-900">{isRTL ? "شحن المحفظة والبطاقة الرقمية" : "Wallet Top-up & Smart Card"}</h3>
                  <p className="text-stone-400 text-sm font-medium">{isRTL ? "إدارة الرصيد المتاح للبطاقة الذكية للابن وشحن الرصيد بأمان." : "Manage your child's smart card balance and top up securely."}</p>
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
                  {/* Left Column: Wallet View */}
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
                  </div>

                  {/* Right Column: Top-up Form */}
                  <div className="lg:col-span-7 space-y-8">
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

                      {/* Stripe Payment Integration */}
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
                </div>
              ) : (
                <Card className="p-12 text-center border-dashed border-2 border-stone-200 bg-stone-50/50 text-stone-400 rounded-[40px]">
                  <Wallet size={48} className="mb-4 opacity-20 mx-auto" />
                  <p className="font-bold text-lg">{isRTL ? "يرجى اختيار طالب لعرض المحفظة" : "Select a child to view wallet details"}</p>
                </Card>
              )}
            </div>
          )}

          {activeTab === "payments" && (
            <div className="space-y-8 animate-fadeIn">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-serif text-3xl font-bold text-stone-900">{isRTL ? "الرسوم والمدفوعات الدراسية" : "Tuition & Fees"}</h3>
                  <p className="text-stone-400 text-sm font-medium">{isRTL ? "سدد الأقساط الدراسية وتابع حركة الفواتير والمدفوعات المترتبة." : "Pay outstanding school tuition fees and view complete invoice ledger."}</p>
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
                <div className="space-y-10">
                  {/* Top Metrics Row */}
                  {(() => {
                    const tuitionTotal = parseFloat(currentStudent.tuition_total) || 5000;
                    const remainingTuition = Math.max(0, tuitionTotal - dynamicTuitionPaid);
                    const percentPaid = Math.round((dynamicTuitionPaid / tuitionTotal) * 100) || 0;
                    
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Metric 1: Total Tuition */}
                        <Card className="relative p-6 border-none shadow-md bg-white rounded-3xl overflow-hidden group hover:shadow-xl transition-all duration-300">
                          <div className="absolute inset-0 bg-gradient-to-tr from-stone-50 via-transparent to-stone-50/10 pointer-events-none" />
                          <div className="absolute top-0 right-0 p-6 opacity-[0.03] text-stone-900 group-hover:scale-110 transition-transform duration-500">
                            <CreditCard size={90} />
                          </div>
                          
                          <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-stone-450 uppercase tracking-wider">{isRTL ? "إجمالي الرسوم السنوية" : "Annual Tuition"}</span>
                              <div className="h-9 w-9 rounded-xl bg-stone-100/80 flex items-center justify-center text-stone-600 border border-stone-150">
                                <CreditCard size={16} />
                              </div>
                            </div>
                            <div>
                              <p className="text-3xl font-black text-stone-900 num-en leading-none">${tuitionTotal.toFixed(2)}</p>
                              <p className="text-[10px] text-stone-400 font-bold mt-1 uppercase tracking-widest">{isRTL ? "السنة الأكاديمية الحالية" : "Current Academic Year"}</p>
                            </div>
                          </div>
                        </Card>

                        {/* Metric 2: Paid Fees */}
                        <Card className="relative p-6 border-none shadow-md bg-emerald-500/5 backdrop-blur-sm rounded-3xl border border-emerald-500/10 overflow-hidden group hover:shadow-lg hover:bg-emerald-500/10 transition-all duration-300">
                          <div className="absolute -top-12 -right-12 w-28 h-28 bg-emerald-400/10 rounded-full blur-2xl" />
                          
                          <div className="relative z-10 flex items-center justify-between gap-4 h-full">
                            <div className="flex flex-col justify-between h-full space-y-4">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-emerald-700 uppercase tracking-wider">{isRTL ? "إجمالي المدفوع" : "Total Paid"}</span>
                                <Badge className="bg-emerald-100 hover:bg-emerald-100 text-emerald-700 border-none rounded-lg text-[9px] font-black px-1.5 py-0.5">
                                  {isRTL ? "مكتمل" : "Verified"}
                                </Badge>
                              </div>
                              <div>
                                <p className="text-3xl font-black text-emerald-600 num-en leading-none">${dynamicTuitionPaid.toFixed(2)}</p>
                                <p className="text-[10px] text-emerald-500/80 font-bold mt-1 uppercase tracking-widest">{isRTL ? "مدفوعات إلكترونية ومحفظة" : "Digital & Wallet payments"}</p>
                              </div>
                            </div>

                            {/* Circular Progress Gauge */}
                            <div className="relative h-16 w-16 shrink-0 flex items-center justify-center">
                              <svg className="w-full h-full transform -rotate-90">
                                <circle
                                  cx="32"
                                  cy="32"
                                  r="26"
                                  className="stroke-emerald-100/50"
                                  strokeWidth="4"
                                  fill="transparent"
                                />
                                <circle
                                  cx="32"
                                  cy="32"
                                  r="26"
                                  className="stroke-emerald-500 transition-all duration-1000 ease-out"
                                  strokeWidth="4"
                                  fill="transparent"
                                  strokeDasharray={2 * Math.PI * 26}
                                  strokeDashoffset={2 * Math.PI * 26 * (1 - percentPaid / 100)}
                                />
                              </svg>
                              <span className="absolute text-[11px] font-black text-emerald-600 num-en">{percentPaid}%</span>
                            </div>
                          </div>
                        </Card>

                        {/* Metric 3: Remaining Due */}
                        <Card className="relative p-6 border-none shadow-md bg-amber-500/5 backdrop-blur-sm rounded-3xl border border-amber-500/10 overflow-hidden group hover:shadow-lg transition-all duration-300">
                          <div className="absolute -top-12 -right-12 w-28 h-28 bg-amber-400/10 rounded-full blur-2xl" />
                          
                          <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-amber-700 uppercase tracking-wider">{isRTL ? "المتبقي المستحق" : "Remaining"}</span>
                              {remainingTuition > 0 ? (
                                <Badge className="bg-amber-100 text-amber-700 border-none rounded-lg text-[9px] font-black px-1.5 py-0.5 animate-pulse">
                                  {isRTL ? "مستحق سداد" : "Action Required"}
                                </Badge>
                              ) : (
                                <Badge className="bg-emerald-100 text-emerald-700 border-none rounded-lg text-[9px] font-black px-1.5 py-0.5">
                                  {isRTL ? "مسدد بالكامل" : "Fully Settled"}
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex items-end justify-between gap-4">
                              <div>
                                <p className={`text-3xl font-black num-en leading-none ${remainingTuition > 0 ? "text-amber-600" : "text-stone-400"}`}>
                                  ${remainingTuition.toFixed(2)}
                                </p>
                                <p className="text-[10px] text-amber-500/80 font-bold mt-1 uppercase tracking-widest">{isRTL ? "أقساط ورسوم معلقة" : "Outstanding installments"}</p>
                              </div>

                              {remainingTuition > 0 && (
                                <button
                                  onClick={() => {
                                    setTuitionPayAmount(0);
                                    setCustomTuitionPay("");
                                    setIsTuitionDialogOpen(true);
                                  }}
                                  className="h-9 px-4 rounded-xl bg-stone-900 hover:bg-black text-white hover:scale-105 text-xs font-bold shadow-md cursor-pointer transition-all flex items-center justify-center gap-1.5 select-none shrink-0"
                                >
                                  <DollarSign size={13} />
                                  <span>{isRTL ? "سدد الآن" : "Pay Now"}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </Card>
                      </div>
                    );
                  })()}

                  {/* Main Grid Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Right Column (Core Operations) - lg:col-span-8 */}
                    <div className="lg:col-span-8 space-y-6">
                      {/* Outstanding Payments Panel */}
                      <Card className="p-5 border-none shadow-sm bg-white rounded-3xl space-y-4">
                        <div 
                          className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-100 pb-3 cursor-pointer select-none group gap-3"
                          onClick={() => setFinesCollapsed(!finesCollapsed)}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                              <FileText size={15} />
                            </div>
                            <div>
                              <h4 className="font-serif text-lg font-bold text-stone-900 leading-none group-hover:text-rose-500 transition-colors">{isRTL ? "المدفوعات والرسوم المستحقة" : "Outstanding Payments & Fees"}</h4>
                              <p className="text-[10px] text-stone-400 mt-1">{isRTL ? "قائمة بجميع الغرامات والمستحقات المترتبة على الطالب وحالتها المالية." : "List of all outstanding fines and student dues."}</p>
                            </div>
                          </div>
                          
                          {/* Print & Export buttons */}
                          <div className="flex items-center gap-1.5 self-start sm:self-center">
                            <button
                              onClick={(e) => { e.stopPropagation(); handlePrintFines(); }}
                              className="px-2.5 h-8 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 flex items-center justify-center gap-1 text-[11px] font-bold transition-all cursor-pointer shadow-sm hover:border-stone-300"
                              title={isRTL ? "طباعة" : "Print"}
                            >
                              <Printer size={12} />
                              <span>{isRTL ? "طباعة" : "Print"}</span>
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handlePrintFines(); }}
                              className="px-2.5 h-8 rounded-lg bg-stone-900 hover:bg-black text-white flex items-center justify-center gap-1 text-[11px] font-bold transition-all cursor-pointer shadow-md shadow-stone-200"
                              title={isRTL ? "تصدير PDF" : "Export PDF"}
                            >
                              <Download size={12} />
                              <span>{isRTL ? "تصدير PDF" : "Export PDF"}</span>
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setFinesCollapsed(!finesCollapsed); }}
                              className="h-8 w-8 rounded-lg bg-stone-50 group-hover:bg-stone-100 text-stone-500 flex items-center justify-center border border-stone-200 transition-all select-none cursor-pointer"
                            >
                              <ChevronDown size={14} className={`transform transition-transform duration-300 ${finesCollapsed ? "" : "rotate-180"}`} />
                            </button>
                          </div>
                        </div>
                        <motion.div
                          initial={false}
                          animate={{ height: finesCollapsed ? 0 : "auto", opacity: finesCollapsed ? 0 : 1 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="pt-1">
                            <ParentFinesTab student={currentStudent} privacyMode={false} />
                          </div>
                        </motion.div>
                      </Card>

                      {/* Payment History Panel (Moved here under Outstanding) */}
                      <Card className="p-5 border-none shadow-sm bg-white rounded-3xl space-y-4">
                        <div 
                          className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-100 pb-3 cursor-pointer select-none group gap-3"
                          onClick={() => setHistoryCollapsed(!historyCollapsed)}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                              <Clock size={15} />
                            </div>
                            <div>
                              <h4 className="font-serif text-lg font-bold text-stone-900 leading-none group-hover:text-emerald-600 transition-colors">{isRTL ? "سجل السداد والمدفوعات السابقة" : "Payment Ledger & History"}</h4>
                              <p className="text-[10px] text-stone-450 mt-1">{isRTL ? "سجل بكافة المعاملات المالية المكتملة." : "Record of all completed payments."}</p>
                            </div>
                          </div>
                          
                          {/* Print & Export buttons */}
                          <div className="flex items-center gap-1.5 self-start sm:self-center">
                            <button
                              onClick={(e) => { e.stopPropagation(); handlePrintHistory(); }}
                              className="px-2.5 h-8 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 flex items-center justify-center gap-1 text-[11px] font-bold transition-all cursor-pointer shadow-sm hover:border-stone-300"
                              title={isRTL ? "طباعة" : "Print"}
                            >
                              <Printer size={12} />
                              <span>{isRTL ? "طباعة" : "Print"}</span>
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handlePrintHistory(); }}
                              className="px-2.5 h-8 rounded-lg bg-stone-900 hover:bg-black text-white flex items-center justify-center gap-1 text-[11px] font-bold transition-all cursor-pointer shadow-md shadow-stone-200"
                              title={isRTL ? "تصدير PDF" : "Export PDF"}
                            >
                              <Download size={12} />
                              <span>{isRTL ? "تصدير PDF" : "Export PDF"}</span>
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setHistoryCollapsed(!historyCollapsed); }}
                              className="h-8 w-8 rounded-lg bg-stone-50 group-hover:bg-stone-100 text-stone-500 flex items-center justify-center border border-stone-200 transition-all select-none cursor-pointer"
                            >
                              <ChevronDown size={14} className={`transform transition-transform duration-300 ${historyCollapsed ? "" : "rotate-180"}`} />
                            </button>
                          </div>
                        </div>
                        <motion.div
                          initial={false}
                          animate={{ height: historyCollapsed ? 0 : "auto", opacity: historyCollapsed ? 0 : 1 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="pt-1">
                            <FineTransactionHistory student={currentStudent} privacyMode={false} />
                          </div>
                        </motion.div>
                      </Card>

                      {/* Canteen & Store Purchases Panel */}
                      <Card className="p-5 border-none shadow-sm bg-white rounded-3xl space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-100 pb-3 gap-3">
                          <div 
                            className="flex items-center gap-2.5 cursor-pointer select-none group"
                            onClick={() => setPurchasesCollapsed(!purchasesCollapsed)}
                          >
                            <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                              <ShoppingBag size={15} />
                            </div>
                            <div>
                              <h4 className="font-serif text-lg font-bold text-stone-900 leading-none group-hover:text-indigo-500 transition-colors">{isRTL ? "مشتريات المقصف والمتجر" : "Canteen & Store Purchases"}</h4>
                              <p className="text-[10px] text-stone-400 mt-1">
                                {isRTL ? "السجل الكامل لمشتريات الطالب باستخدام البطاقة الذكية." : "Complete ledger of student purchases using the smart card."}
                              </p>
                            </div>
                          </div>
                          
                          {/* Print & Export buttons */}
                          <div className="flex items-center gap-1.5 self-start sm:self-center">
                            <button
                              onClick={handlePrintPurchases}
                              className="px-2.5 h-8 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 flex items-center justify-center gap-1 text-[11px] font-bold transition-all cursor-pointer shadow-sm hover:border-stone-300"
                              title={isRTL ? "طباعة" : "Print"}
                            >
                              <Printer size={12} />
                              <span>{isRTL ? "طباعة" : "Print"}</span>
                            </button>
                            <button
                              onClick={handlePrintPurchases}
                              className="px-2.5 h-8 rounded-lg bg-stone-900 hover:bg-black text-white flex items-center justify-center gap-1 text-[11px] font-bold transition-all cursor-pointer shadow-md shadow-stone-200"
                              title={isRTL ? "تصدير PDF" : "Export PDF"}
                            >
                              <Download size={12} />
                              <span>{isRTL ? "تصدير PDF" : "Export PDF"}</span>
                            </button>
                            
                            <button 
                              onClick={() => setPurchasesCollapsed(!purchasesCollapsed)}
                              className="h-8 w-8 rounded-lg bg-stone-50 hover:bg-stone-100 text-stone-500 flex items-center justify-center border border-stone-200 transition-colors cursor-pointer select-none"
                            >
                              <ChevronDown size={14} className={`transform transition-transform duration-300 ${purchasesCollapsed ? "" : "rotate-180"}`} />
                            </button>
                          </div>
                        </div>

                        <motion.div
                          initial={false}
                          animate={{ height: purchasesCollapsed ? 0 : "auto", opacity: purchasesCollapsed ? 0 : 1 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-3 pt-1">
                            {storePurchases.length === 0 ? (
                              <div className="text-center py-10 text-stone-400 text-xs font-semibold border-dashed border border-stone-200 rounded-2xl bg-stone-50/30">
                                {isRTL ? "لا توجد عمليات شراء مسجلة." : "No recorded purchases found."}
                              </div>
                            ) : (
                              <>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-right md:text-left">
                                    <thead>
                                      <tr className="text-[9px] font-bold text-stone-400 uppercase tracking-widest border-b border-stone-150">
                                        <th className={`pb-2 ${isRTL ? "text-right" : "text-left"}`}>{isRTL ? "المنتج" : "Item"}</th>
                                        <th className={`pb-2 ${isRTL ? "text-right" : "text-left"}`}>{isRTL ? "التاريخ" : "Date"}</th>
                                        <th className="pb-2 text-center">{isRTL ? "الكمية" : "Qty"}</th>
                                        <th className={`pb-2 ${isRTL ? "text-left" : "text-right"}`}>{isRTL ? "الإجمالي" : "Total"}</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-50">
                                      {currentPurchases.map((p, i) => (
                                        <tr key={p.id || i} className="group hover:bg-stone-50/50 transition-colors">
                                          <td className="py-2.5">
                                            <div className="flex items-center gap-2">
                                              <div className="h-7.5 w-7.5 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform shrink-0">
                                                <ShoppingBag size={13} />
                                              </div>
                                              <span className="font-bold text-xs text-stone-850">{p.item_name}</span>
                                            </div>
                                          </td>
                                          <td className="py-2.5 text-[11px] font-bold text-stone-400 num-en">
                                            {p.created_at ? p.created_at.split('T')[0] : "—"}
                                          </td>
                                          <td className="py-2.5 text-center font-bold text-[11px] text-stone-600 num-en">
                                            {p.quantity}
                                          </td>
                                          <td className={`py-2.5 font-extrabold text-xs text-rose-500 num-en ${isRTL ? "text-left" : "text-right"}`}>
                                            -${(parseFloat(p.total_price || p.total_amount || 0)).toFixed(2)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>

                                {/* Pagination Controls */}
                                {totalCanteenPages > 1 && (
                                  <div className="flex items-center justify-between border-t border-stone-100 pt-3">
                                    <span className="text-[10px] font-bold text-stone-400">
                                      {isRTL 
                                        ? `عرض ${indexOfFirstPurchase + 1}-${Math.min(indexOfLastPurchase, storePurchases.length)} من ${storePurchases.length}`
                                        : `Showing ${indexOfFirstPurchase + 1}-${Math.min(indexOfLastPurchase, storePurchases.length)} of ${storePurchases.length}`
                                      }
                                    </span>
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => setCanteenPage(p => Math.max(1, p - 1))}
                                        disabled={canteenPage === 1}
                                        className="p-1 rounded-md border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                      >
                                        {isRTL ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
                                      </button>
                                      <span className="text-[10px] font-extrabold text-stone-850 px-1.5 num-en">
                                        {canteenPage} / {totalCanteenPages}
                                      </span>
                                      <button
                                        onClick={() => setCanteenPage(p => Math.min(totalCanteenPages, p + 1))}
                                        disabled={canteenPage === totalCanteenPages}
                                        className="p-1 rounded-md border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                      >
                                        {isRTL ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </motion.div>
                      </Card>
                    </div>

                    {/* Left Column (Metadata, Quick Actions) - lg:col-span-4 */}
                    <div className="lg:col-span-4 space-y-6">
                      {/* Active Child's Mini Smart Card */}
                      <Card className="relative w-full aspect-[1.58/1] bg-gradient-to-br from-stone-900 via-stone-850 to-emerald-950 text-white rounded-3xl shadow-xl overflow-hidden group border-none">
                        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }} />
                        <div className="absolute -top-16 -right-16 w-44 h-44 bg-emerald-500/20 rounded-full blur-[50px] group-hover:scale-125 transition-transform duration-700" />
                        <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-rose-500/10 rounded-full blur-[50px]" />
                        
                        <div className="relative z-10 h-full p-6 flex flex-col justify-between">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-lg bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
                                <Wallet size={16} className="text-emerald-300" />
                              </div>
                              <div>
                                <h4 className="font-serif font-black tracking-tight text-sm">Edu<span className="text-rose-500">Wallet</span></h4>
                                <p className="text-[7px] font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "بطاقة الابن الرقمية" : "Digital Smart Card"}</p>
                              </div>
                            </div>
                            <Badge className="bg-white/10 backdrop-blur-md text-white border border-white/10 rounded-md text-[7px] font-black px-1.5 py-0.5">
                              SMART CARD
                            </Badge>
                          </div>

                          <div className="my-auto pt-2">
                            <p className="text-[8px] font-bold text-stone-400 uppercase tracking-widest mb-0.5">{isRTL ? "الرصيد المتاح" : "Card Balance"}</p>
                            <div className="flex items-baseline justify-between">
                              <p className="text-2xl font-black text-emerald-400 num-en">${parseFloat(currentStudent.card_balance || 0).toFixed(2)}</p>
                              
                              {/* Quick click to Top Up tab */}
                              <button
                                onClick={() => setSearchParams({ tab: "wallet" })}
                                className="text-[9px] font-extrabold text-white/95 hover:text-emerald-400 bg-white/10 hover:bg-white/15 px-2 py-1 rounded-lg border border-white/10 flex items-center gap-1 transition-all cursor-pointer select-none"
                              >
                                <span>{isRTL ? "شحن رصيد" : "Top Up"}</span>
                                <ArrowRight size={10} className={`transform transition-transform ${isRTL ? "rotate-180" : ""}`} />
                              </button>
                            </div>
                          </div>

                          <div className="flex justify-between items-end border-t border-white/5 pt-2">
                            <div>
                              <h5 className="text-xs font-bold leading-none">{currentStudent.full_name || currentStudent.name}</h5>
                              <p className="text-stone-400 text-[8px] font-bold tracking-widest mt-1 num-en">{currentStudent.id}</p>
                            </div>
                            <div className="h-9 w-9 bg-white/10 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/10">
                              <Wallet className="h-4.5 w-4.5 text-white" />
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </div>
                </div>
              ) : (
                <Card className="p-12 text-center border-dashed border-2 border-stone-200 bg-stone-50/50 text-stone-400 rounded-[40px]">
                  <Wallet size={48} className="mb-4 opacity-20 mx-auto" />
                  <p className="font-bold text-lg">{isRTL ? "يرجى اختيار طالب لعرض تفاصيل المدفوعات" : "Select a child to view payment details"}</p>
                </Card>
              )}
            </div>
          )}

          {activeTab === "performance" && (
            <div className="space-y-8 animate-fadeIn">
              {/* Back to children button */}
              <button
                onClick={() => setSearchParams({ tab: "overview" })}
                className={`${btnOutline} rounded-full h-10 px-4 flex items-center gap-2`}
              >
                {isRTL ? "← العودة للأبناء" : "← Back to Children"}
              </button>

              {perfStudent ? (
                <div className="space-y-8">
                  {/* Student Header Card */}
                  <Card className="p-8 border-none shadow-sm bg-white rounded-[40px] relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                      <GraduationCap size={140} />
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-center gap-6">
                        <div className="h-20 w-20 rounded-[28px] bg-rose-50 text-rose-500 flex items-center justify-center shadow-inner shrink-0">
                          <Users size={40} />
                        </div>
                        <div>
                          <h4 className="text-2xl font-serif font-black text-stone-900">{perfStudent.full_name || perfStudent.name}</h4>
                          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">
                            {isRTL ? "الصف" : "Grade"} {perfStudent.grade} · {perfStudent.id}
                          </p>
                        </div>
                      </div>
                      
                      {/* Sub-tab navigation */}
                      <div className="flex border border-stone-100 bg-stone-50 p-1.5 rounded-2xl gap-1.5 self-center">
                        {[
                          { key: "grades", label: isRTL ? "الدرجات الأكاديمية" : "Grades", icon: BookOpen },
                          { key: "attendance", label: isRTL ? "سجل الحضور" : "Attendance", icon: ClipboardCheck },
                          { key: "awards", label: isRTL ? "الأوسمة والجوائز" : "Awards", icon: Award }
                        ].map(t => (
                          <button
                            key={t.key}
                            onClick={() => setPerfTab(t.key)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              perfTab === t.key 
                                ? "bg-white text-stone-900 shadow-md"
                                : "text-stone-400 hover:text-stone-700"
                            }`}
                          >
                            <t.icon size={14} />
                            <span>{t.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </Card>

                  {/* Performance Detail Content */}
                  {perfTab === "grades" ? (
                    <Card className="p-8 border-none shadow-sm bg-white rounded-[40px] space-y-6">
                      <h4 className="font-serif text-xl font-bold text-stone-900">{isRTL ? "الدرجات الأكاديمية الفصلية" : "Semester Grades"}</h4>
                      {studentGrades.length === 0 ? (
                        <div className="text-center py-10 text-stone-400 text-sm font-semibold">
                          {isRTL ? "لا توجد درجات مسجلة حالياً." : "No grades recorded yet."}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {studentGrades.map((g, idx) => (
                            <div key={idx} className="flex justify-between items-center p-4 bg-stone-50/50 rounded-2xl border border-stone-100">
                              <div>
                                <span className="font-bold text-sm text-stone-850">{g.subject_name}</span>
                                <p className="text-[10px] text-stone-450 mt-0.5">{g.semester} · {g.exam_type}</p>
                              </div>
                              <div className="text-right">
                                <Badge className="bg-rose-500 text-white border-none rounded-lg font-black px-2 py-1 text-sm num-en">
                                  {g.score} / 100
                                </Badge>
                                <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-1">Grade: {g.grade_letter || "A"}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  ) : perfTab === "attendance" ? (
                    <Card className="p-8 border-none shadow-sm bg-white rounded-[40px] space-y-6">
                      <h4 className="font-serif text-xl font-bold text-stone-900">{isRTL ? "كشف حركة الحضور والغياب" : "Attendance Tracking"}</h4>
                      {attendanceLogs.length === 0 ? (
                        <div className="text-center py-10 text-stone-400 text-sm font-semibold">
                          {isRTL ? "لا توجد حركات حضور مسجلة اليوم." : "No attendance records found."}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {attendanceLogs.map((a, idx) => (
                            <div key={idx} className="flex justify-between items-center p-4 bg-stone-50/50 rounded-2xl border border-stone-100">
                              <div className="flex items-center gap-3">
                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                                  a.type === 'gate_in' ? 'bg-emerald-50 text-emerald-500' : 'bg-stone-100 text-stone-500'
                                }`}>
                                  <Clock size={16} />
                                </div>
                                <div>
                                  <span className="font-bold text-sm text-stone-850">
                                    {a.type === 'gate_in' ? (isRTL ? 'حركة دخول البوابات' : 'Smart Gate IN') : (isRTL ? 'حركة خروج البوابات' : 'Smart Gate OUT')}
                                  </span>
                                  <p className="text-[10px] text-stone-450 mt-0.5">{a.recorded_by || 'NFC Card Gate Reader'}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-sm font-black text-stone-900 num-en">{a.time}</span>
                                <p className="text-[10px] text-stone-400 num-en mt-0.5">{a.date}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  ) : (
                    <Card className="p-8 border-none shadow-sm bg-white rounded-[40px] space-y-6">
                      <h4 className="font-serif text-xl font-bold text-stone-900">{isRTL ? "لوحة التكريمات والأوسمة" : "Awards & Honors"}</h4>
                      {studentAwards.length === 0 ? (
                        <div className="text-center py-10 text-stone-400 text-sm font-semibold">
                          {isRTL ? "لا توجد أوسمة مستحقة بعد." : "No awards earned yet."}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {studentAwards.map((w, idx) => (
                            <div key={idx} className="p-5 bg-amber-50/20 border border-amber-100/40 rounded-3xl flex items-center gap-4">
                              <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 shadow-sm shrink-0">
                                <Award size={24} />
                              </div>
                              <div>
                                <h5 className="font-bold text-sm text-stone-800 leading-tight">{w.title}</h5>
                                <p className="text-[10px] text-stone-450 mt-1">{w.category || (isRTL ? 'تميز دراسي' : 'Academic Excellence')}</p>
                                <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-1 num-en">{w.awarded_date}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  )}
                </div>
              ) : (
                <Card className="p-12 text-center border-dashed border-2 border-stone-200 bg-stone-50/50 text-stone-400 rounded-[40px]">
                  <Users size={48} className="mb-4 opacity-20 mx-auto" />
                  <p className="font-bold text-lg">{isRTL ? "لا توجد تفاصيل لهذا الطالب" : "No student details found."}</p>
                </Card>
              )}
            </div>
          )}

          {activeTab === "messages" && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <h3 className="font-serif text-3xl font-bold text-stone-900">{isRTL ? "الرسائل والتواصل" : "Messages & Communication"}</h3>
                <p className="text-stone-400 text-sm font-medium">{isRTL ? "تواصل مباشرة مع معلمي أبنائك وأرفق الملفات التعليمية والصور." : "Communicate directly with your children's teachers and attach educational files/images."}</p>
              </div>
              <ParentTeacherChat me={{ ...portalUser, id: portalUser?.id || localStorage.getItem("portal_user_id") || "parent-default", role: "parent" }} />
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <h3 className="font-serif text-3xl font-bold text-stone-900">{isRTL ? "الإشعارات والتعاميم الرسمية" : "Notifications & Official Circulars"}</h3>
                <p className="text-stone-400 text-sm font-medium">{isRTL ? "جميع القرارات والتعاميم الموجهة لك من قبل الإدارة المدرسية." : "All decisions and announcements directed to you by school administration."}</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Announcements Feed - 8 cols */}
                <div className="lg:col-span-8 space-y-4">
                  <h4 className="font-serif text-xl font-bold text-stone-900 px-2">{isRTL ? "التعاميم والقرارات الرسمية" : "Official Decisions & Circulars"}</h4>
                  {parentAnnouncements.length === 0 ? (
                    <Card className="p-16 text-center border-dashed border-2 border-stone-200 bg-stone-50/50 text-stone-400 rounded-[40px]">
                      <Megaphone size={48} className="mb-4 opacity-20 mx-auto" />
                      <p className="font-bold text-lg">{isRTL ? "لا توجد تعاميم منشورة حالياً" : "No official announcements published yet"}</p>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {parentAnnouncements.map(ann => {
                        const isRead = readAnnouncements.includes(ann.id);
                        return (
                          <Card key={ann.id} className="p-6 bg-white border-none shadow-sm rounded-[30px] relative overflow-hidden group">
                            {ann.priority === "high" && (
                              <div className="absolute top-0 right-0 left-0 h-1.5 bg-rose-500" />
                            )}
                            <div className="flex justify-between items-start gap-4">
                              <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className={`text-base font-bold ${isRead ? "text-stone-500" : "text-stone-900 font-extrabold"}`}>{ann.title}</h4>
                                  {!isRead && (
                                    <Badge className="bg-rose-500 text-white border-none rounded-lg text-[9px] font-black px-2 py-0.5">
                                      {isRTL ? "جديد" : "New"}
                                    </Badge>
                                  )}
                                  {ann.priority === "high" && (
                                    <Badge className="bg-rose-50 text-rose-600 border-none rounded-lg text-[9px] font-black px-2 py-0.5">
                                      {isRTL ? "هام جداً" : "Urgent"}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-stone-600 text-sm whitespace-pre-line leading-relaxed">
                                  {ann.content}
                                </p>
                                <div className="flex items-center justify-between pt-2">
                                  <div className="flex items-center gap-4 text-[10px] text-stone-400 font-bold uppercase tracking-wider">
                                    <span className="flex items-center gap-1">
                                      <Clock size={12} />
                                      {ann.created_at ? new Date(ann.created_at).toLocaleDateString(isRTL ? "ar-EG" : "en-US") : ""}
                                    </span>
                                  </div>
                                  {!isRead && (
                                    <button 
                                      onClick={() => handleMarkAnnouncementAsRead(ann.id)}
                                      className="text-xs font-bold text-rose-500 hover:text-rose-600 hover:underline cursor-pointer border-none bg-transparent"
                                    >
                                      {isRTL ? "تحديد كمقروء" : "Mark as read"}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* System Notifications - 4 cols */}
                <div className="lg:col-span-4 space-y-4">
                  <h4 className="font-serif text-xl font-bold text-stone-900 px-2">{isRTL ? "التنبيهات التلقائية" : "System Notifications"}</h4>
                  {portalNotifications.length === 0 ? (
                    <Card className="p-12 text-center border-dashed border border-stone-200 bg-stone-50/50 text-stone-400 rounded-[30px]">
                      <Bell size={32} className="mb-4 opacity-20 mx-auto" />
                      <p className="font-bold text-sm">{isRTL ? "لا توجد تنبيهات جديدة" : "No new notifications"}</p>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {portalNotifications.map(n => (
                        <Card key={n.id} className="p-4 bg-white border-none shadow-sm rounded-2xl relative overflow-hidden">
                          {!n.is_read && (
                            <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-rose-500" />
                          )}
                          <h5 className="font-bold text-xs text-stone-800 pr-4">{n.title}</h5>
                          <p className="text-[11px] text-stone-555 mt-1 leading-normal">{n.message}</p>
                          <span className="text-[9px] font-bold text-stone-400 block mt-2">
                            {n.created_at ? new Date(n.created_at).toLocaleDateString(isRTL ? "ar-EG" : "en-US") : ""}
                          </span>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "overview" && (
            <>
              {/* Children Overview */}
              <section>
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-serif text-2xl font-bold text-stone-900">{isRTL ? "أبنائي" : "My Children"}</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsLinkDialogOpen(true)}
                      className={`${btnPrimary} rounded-full h-11 px-5 flex items-center gap-2`}
                    >
                      <Users size={16} />
                      <span>{isRTL ? "ربط حساب طالب جديد" : "Link New Student"}</span>
                    </button>
                    <p className="text-stone-400 text-sm font-medium self-center px-2">{children.length} {isRTL ? "طلاب مسجلون" : "Students Registered"}</p>
                  </div>
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
                      <p className="font-bold text-lg">{isRTL ? "لم يتم العثور على طلاب مرتبطين" : "No linked students found"}</p>
                      <button 
                        onClick={() => setIsLinkDialogOpen(true)}
                        className="text-rose-500 mt-2 font-bold cursor-pointer hover:underline"
                      >
                        {isRTL ? "ربط حساب طالب جديد" : "Link New Student"}
                      </button>
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
                              <button 
                                onClick={() => setSearchParams({ tab: "performance", student_id: child.id })}
                                className={`flex-1 ${btnPrimary} rounded-2xl h-12`}
                              >
                                {isRTL ? "عرض التقرير المفصل" : "View Detailed Report"}
                              </button>
                              <button 
                                onClick={() => setSearchParams({ tab: "performance", student_id: child.id })}
                                className={`${btnOutline} h-12 w-12 rounded-2xl border-stone-100 text-stone-400 hover:text-rose-500 hover:bg-rose-50 transition-all`}
                              >
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
                        <button 
                          onClick={() => {
                            setSearchParams({ tab: "payments" });
                            setTimeout(() => {
                              setTuitionPayAmount(0);
                              setCustomTuitionPay("");
                              setIsTuitionDialogOpen(true);
                            }, 150);
                          }}
                          className="bg-white text-indigo-900 hover:bg-indigo-50 rounded-2xl px-8 h-12 font-bold shadow-xl cursor-pointer"
                        >
                          {isRTL ? "ادفع الآن" : "Pay Now"}
                        </button>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">{isRTL ? "المبلغ المستحق" : "Balance Due"}</span>
                          <span className="text-xl font-black num-en">
                            ${currentStudent ? Math.max(0, (parseFloat(currentStudent.tuition_total) || 5000) - dynamicTuitionPaid).toFixed(2) : "0.00"}
                          </span>
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

      {/* Global Dialog for Manual Student Link (Mounted at root level so it never unmounts on tab switches) */}
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent className="max-w-md bg-white rounded-3xl p-8 border-none" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader className="mb-6">
            <DialogTitle className="font-serif text-2xl font-bold text-stone-900">
              {isRTL ? "ربط حساب طالب جديد" : "Link New Student"}
            </DialogTitle>
            <DialogDescription className="text-stone-400 text-xs mt-1">
              {isRTL 
                ? "قم بتقديم طلب للإدارة لربط طالب إضافي بملفك الشخصي. يتطلب ذلك مطابقة الاسم والرقم التعريفي للتحقق الأمني." 
                : "Submit a request to link an additional student to your profile. This requires exact Student ID and name matching for verification."
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleLinkSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="studentId" className="text-xs font-bold text-stone-500 uppercase tracking-widest">
                {isRTL ? "رقم الطالب التعريفي *" : "Student ID *"}
              </Label>
              <Input
                id="studentId"
                value={linkStudentId}
                onChange={e => setLinkStudentId(e.target.value)}
                placeholder={isRTL ? "مثال: 0002" : "e.g. 0002"}
                required
                className="h-12 rounded-xl border border-stone-200 focus:ring-2 focus:ring-rose-500/20 num-en"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="studentName" className="text-xs font-bold text-stone-500 uppercase tracking-widest">
                {isRTL ? "اسم الطالب بالكامل كما في كشف الدرجات *" : "Student Full Name *"}
              </Label>
              <Input
                id="studentName"
                value={linkStudentName}
                onChange={e => setLinkStudentName(e.target.value)}
                placeholder={isRTL ? "مثال: احمد معتصم علي" : "e.g. Ahmed Moutasim Ali"}
                required
                className="h-12 rounded-xl border border-stone-200 focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="relationship" className="text-xs font-bold text-stone-500 uppercase tracking-widest">
                {isRTL ? "صلة القرابة *" : "Relationship *"}
              </Label>
              <select
                id="relationship"
                value={linkRelationship}
                onChange={e => setLinkRelationship(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-stone-200 text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                dir={isRTL ? "rtl" : "ltr"}
              >
                <option value="father">{isRTL ? "أب" : "Father"}</option>
                <option value="mother">{isRTL ? "أم" : "Mother"}</option>
                <option value="guardian">{isRTL ? "ولي أمر / وصي" : "Guardian"}</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsLinkDialogOpen(false)}
                className={`${btnOutline} flex-1 h-12 rounded-xl`}
              >
                {isRTL ? "إلغاء" : "Cancel"}
              </button>
              <button
                type="submit"
                disabled={isSubmittingLink}
                className={`${btnPrimary} flex-1 h-12 rounded-xl bg-stone-900 text-white`}
              >
                {isSubmittingLink ? (isRTL ? "جاري الإرسال..." : "Submitting...") : (isRTL ? "إرسال طلب الربط" : "Send Request")}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Global Dialog for Tuition Payment (Mounted at root level so it never unmounts on tab switches) */}
      <Dialog open={isTuitionDialogOpen} onOpenChange={setIsTuitionDialogOpen}>
        <DialogContent className="max-w-md bg-white rounded-3xl p-8 border-none" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader className="mb-6">
            <DialogTitle className="font-serif text-2xl font-bold text-stone-900">
              {isRTL ? "تسديد الرسوم الدراسية للابن" : "Pay Tuition Installment"}
            </DialogTitle>
            <DialogDescription className="text-stone-400 text-xs mt-1">
              {isRTL 
                ? "سدد جزءاً من الرسوم الدراسية السنوية المستحقة لابنك بشكل آمن." 
                : "Pay towards outstanding school tuition fees securely."
              }
            </DialogDescription>
          </DialogHeader>

          {currentStudent && (
            <div className="space-y-6">
              {/* Remaining Tuition info */}
              <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl flex items-center justify-between text-sm font-semibold">
                <span className="text-stone-500">{isRTL ? "إجمالي المبلغ المتبقي المستحق:" : "Total remaining due:"}</span>
                <span className="text-amber-600 font-extrabold num-en">
                  ${Math.max(0, (parseFloat(currentStudent.tuition_total) || 5000) - dynamicTuitionPaid).toFixed(2)}
                </span>
              </div>

              {/* Preset Amounts */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-500 uppercase tracking-widest block">{isRTL ? "اختر مبلغاً للسداد" : "Select Payment Amount"}</label>
                <div className="grid grid-cols-3 gap-2">
                  {[250, 500, 1000].map(amt => {
                    const maxRemaining = Math.max(0, (parseFloat(currentStudent.tuition_total) || 5000) - dynamicTuitionPaid);
                    const disabled = amt > maxRemaining;
                    return (
                      <button
                        key={amt}
                        type="button"
                        disabled={disabled}
                        onClick={() => { setTuitionPayAmount(amt); setCustomTuitionPay(""); }}
                        className={`h-11 rounded-xl text-xs font-bold border transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                          tuitionPayAmount === amt && !customTuitionPay
                            ? "bg-stone-900 text-white border-stone-900 shadow-md"
                            : "bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100"
                        }`}
                      >
                        ${amt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Amount */}
              <div className="space-y-2">
                <Label htmlFor="customTuitionPay" className="text-xs font-bold text-stone-500 uppercase tracking-widest block">
                  {isRTL ? "أو أدخل مبلغاً مخصصاً *" : "Or Custom Amount *"}
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 h-4 w-4" />
                  <Input
                    id="customTuitionPay"
                    type="number"
                    min="1"
                    max={Math.max(0, (parseFloat(currentStudent.tuition_total) || 5000) - dynamicTuitionPaid)}
                    value={customTuitionPay}
                    onChange={e => {
                      setCustomTuitionPay(e.target.value);
                      setTuitionPayAmount(parseFloat(e.target.value) || 0);
                    }}
                    placeholder={isRTL ? "مثال: 500" : "e.g. 500"}
                    className="h-12 pl-9 pr-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-rose-500/20 num-en"
                  />
                </div>
              </div>

              {/* Choose Payment Method */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-stone-500 uppercase tracking-widest">
                  {isRTL ? "طريقة الدفع" : "Payment Method"}
                </p>
                <div className="grid gap-2">
                  {/* Secure Stripe Credit Card */}
                  <button
                    type="button"
                    onClick={() => setTuitionPayMethod("stripe")}
                    className={`p-3 rounded-xl border-2 text-right transition-all flex items-center justify-between w-full cursor-pointer ${
                      tuitionPayMethod === "stripe"
                        ? "border-indigo-600 bg-indigo-50/10"
                        : "border-stone-200 hover:border-stone-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className={`h-5 w-5 ${tuitionPayMethod === "stripe" ? "text-indigo-600" : "text-stone-400"}`} />
                      <div className="text-start">
                        <p className="font-bold text-sm text-stone-850">{isRTL ? "بطاقة ائتمان آمنة (Stripe)" : "Credit/Debit Card (Stripe)"}</p>
                        <p className="text-[10px] text-stone-450">{isRTL ? "دفع رقمي آمن بنسبة 100%" : "100% secure card transaction"}</p>
                      </div>
                    </div>
                  </button>

                  {/* NFC Smart Card (EduWallet) */}
                  <button
                    type="button"
                    onClick={() => setTuitionPayMethod("wallet")}
                    className={`p-3 rounded-xl border-2 text-right transition-all flex items-center justify-between w-full cursor-pointer ${
                      tuitionPayMethod === "wallet"
                        ? "border-teal-600 bg-teal-50/10"
                        : "border-stone-200 hover:border-stone-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Wallet className={`h-5 w-5 ${tuitionPayMethod === "wallet" ? "text-teal-650" : "text-stone-400"}`} />
                      <div className="text-start">
                        <p className="font-bold text-sm text-stone-850">{isRTL ? "رصيد محفظة الابن (EduWallet)" : "Student Wallet (EduWallet)"}</p>
                        <p className="text-[10px] text-stone-450">{isRTL ? `الرصيد المتاح: $${(parseFloat(currentStudent.card_balance) || 0).toFixed(2)}` : `Available balance: $${(parseFloat(currentStudent.card_balance) || 0).toFixed(2)}`}</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Submit Block */}
              {tuitionPayAmount > 0 ? (
                tuitionPayMethod === "stripe" ? (
                  <div className="pt-4 border-t border-stone-100">
                    <Elements stripe={stripePromise}>
                      <StripePaymentForm
                        amount={tuitionPayAmount}
                        onSuccess={handlePayTuitionSuccess}
                        onCancel={() => setIsTuitionDialogOpen(false)}
                        language={language}
                      />
                    </Elements>
                  </div>
                ) : (
                  <div className="flex gap-3 pt-4 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() => setIsTuitionDialogOpen(false)}
                      className={`${btnOutline} flex-1 h-12 rounded-xl`}
                    >
                      {isRTL ? "إلغاء" : "Cancel"}
                    </button>
                    <button
                      type="button"
                      onClick={handlePayTuitionWallet}
                      disabled={isSubmittingTuition}
                      className={`${btnPrimary} flex-1 h-12 rounded-xl bg-teal-600 hover:bg-teal-700 text-white`}
                    >
                      {isSubmittingTuition ? (isRTL ? "جاري الدفع..." : "Processing...") : (isRTL ? `ادفع $${tuitionPayAmount.toFixed(2)}` : `Pay $${tuitionPayAmount.toFixed(2)}`)}
                    </button>
                  </div>
                )
              ) : (
                <div className="p-4 bg-stone-50 border border-stone-100 rounded-2xl flex items-center justify-center gap-2 text-stone-400 text-xs font-semibold">
                  <CreditCard className="h-4 w-4" />
                  <span>{isRTL ? "يرجى تحديد أو إدخال مبلغ للسداد" : "Select or enter a payment amount to proceed"}</span>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}