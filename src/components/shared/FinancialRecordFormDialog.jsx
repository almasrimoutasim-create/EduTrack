import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker, MonthPicker } from "@/components/ui/date-picker";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/lib/LanguageContext";

export default function FinancialRecordFormDialog({ open, onClose, record, prefill, onSuccess }) {
  const isEdit = !!record;
  const qc = useQueryClient();
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const [saving, setSaving] = useState(false);

  const defaultForm = {
    record_type: "salary", recipient_type: "teacher", recipient_id: "",
    recipient_name: "", amount: 0, description: "", month: "",
    payment_date: new Date().toISOString().split("T")[0],
    status: "pending", payment_method: "bank_transfer",
    reference_no: "", notes: ""
  };

  const getInitialForm = () => {
    if (record) return record;
    if (prefill) return { ...defaultForm, ...prefill };
    return defaultForm;
  };

  const [form, setForm] = useState(getInitialForm());

  useEffect(() => {
    if (open) {
      setForm(getInitialForm());
    }
  }, [record, prefill, open]);

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!form.recipient_name || form.amount <= 0) return;
    setSaving(true);
    try {
      let res;
      // Derive the required database 'type' column (income vs expense)
      const derivedType = (form.record_type === "income" || form.record_type === "fine_payment" || form.record_type === "tuition") ? "income" : "expense";
      
      // Clean payload: send only fields that belong to the database schema
      // Strips read-only fields like _type, created_date, and id to prevent neon postgres validation failures.
      const payload = {
        record_type: form.record_type,
        recipient_type: form.recipient_type,
        recipient_id: form.recipient_id || "",
        recipient_name: form.recipient_name,
        amount: parseFloat(form.amount) || 0,
        month: form.month || "",
        payment_method: form.payment_method,
        status: form.status,
        payment_date: form.payment_date,
        reference_no: form.reference_no || "",
        description: form.description || "",
        notes: form.notes || "",
        type: derivedType
      };

      if (isEdit) {
        res = await base44.entities.FinancialRecord.update(record.id, payload);
      } else {
        res = await base44.entities.FinancialRecord.create(payload);
      }
      qc.invalidateQueries({ queryKey: ["finance-purchases"] });
      qc.invalidateQueries({ queryKey: ["financial-records"] });
      if (onSuccess) {
        await onSuccess(res || payload);
      }
      onClose();
    } catch (err) {
      console.error("Failed to save financial record:", err);
    }
    setSaving(false);
  };

  const recordTypes = [
    { value: "salary", label: isRTL ? "راتب" : "Salary" },
    { value: "fine_payment", label: isRTL ? "سداد غرامة" : "Fine Payment" },
    { value: "bus_driver_payment", label: isRTL ? "أجر سائق حافلة" : "Bus Driver Payment" },
    { value: "supervisor_payment", label: isRTL ? "أجر مشرف حافلة" : "Supervisor Payment" },
    { value: "expense", label: isRTL ? "مصاريف" : "Expense" },
    { value: "income", label: isRTL ? "إيرادات" : "Income" },
    { value: "refund", label: isRTL ? "مسترجع" : "Refund" },
    { value: "tuition", label: isRTL ? "رسوم دراسية" : "Tuition" },
  ];

  const recipientTypes = [
    { value: "teacher", label: isRTL ? "معلم" : "Teacher" },
    { value: "bus_driver", label: isRTL ? "سائق حافلة" : "Bus Driver" },
    { value: "supervisor", label: isRTL ? "مشرف" : "Supervisor" },
    { value: "student", label: isRTL ? "طالب" : "Student" },
    { value: "school", label: isRTL ? "المدرسة" : "School" },
  ];

  const paymentMethods = [
    { value: "bank_transfer", label: isRTL ? "تحويل بنكي" : "Bank Transfer" },
    { value: "cash", label: isRTL ? "نقداً" : "Cash" },
    { value: "check", label: isRTL ? "شيك" : "Check" },
    { value: "card", label: isRTL ? "بطاقة ائتمان" : "Card" },
  ];

  const statuses = [
    { value: "pending", label: isRTL ? "قيد الانتظار" : "Pending" },
    { value: "paid", label: isRTL ? "مدفوع" : "Paid" },
    { value: "cancelled", label: isRTL ? "ملغي" : "Cancelled" },
  ];

  const t = {
    titleAdd: isRTL ? "إضافة معاملة جديدة" : "New Transaction",
    titleEdit: isRTL ? "تعديل المعاملة المالية" : "Edit Transaction",
    recordType: isRTL ? "نوع المعاملة *" : "Record Type *",
    recipientType: isRTL ? "نوع المستلم" : "Recipient Type",
    recipientName: isRTL ? "اسم المستلم *" : "Recipient Name *",
    recipientId: isRTL ? "الرقم التعريفي للمستلم" : "Recipient ID",
    amount: isRTL ? "المبلغ ($) *" : "Amount ($) *",
    month: isRTL ? "الشهر" : "Month",
    paymentMethod: isRTL ? "طريقة الدفع" : "Payment Method",
    status: isRTL ? "الحالة" : "Status",
    paymentDate: isRTL ? "تاريخ الدفع" : "Payment Date",
    referenceNo: isRTL ? "رقم المرجع" : "Reference No.",
    description: isRTL ? "التفاصيل / البيان" : "Description",
    notes: isRTL ? "ملاحظات" : "Notes",
    saving: isRTL ? "جاري الحفظ..." : "Saving...",
    save: isRTL ? "إضافة معاملة" : "Add Transaction",
    update: isRTL ? "تحديث المعاملة" : "Update Transaction"
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-6" dir={isRTL ? "rtl" : "ltr"}>
        <DialogHeader className="border-b border-stone-100 pb-3">
          <DialogTitle className="font-display text-2xl font-black text-stone-900 tracking-tight">
            {isEdit ? t.titleEdit : t.titleAdd}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5 mt-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-stone-600 dark:text-stone-400 font-bold text-xs block mb-1.5">{t.recordType}</Label>
              <Select value={form.record_type} onValueChange={v => update("record_type", v)}>
                <SelectTrigger className="h-11 rounded-xl border-stone-200 bg-white dark:bg-stone-900 focus:ring-primary/20 font-semibold transition-all"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  {recordTypes.map(r => <SelectItem key={r.value} value={r.value} className="font-semibold">{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-stone-600 dark:text-stone-400 font-bold text-xs block mb-1.5">{t.recipientType}</Label>
              <Select value={form.recipient_type} onValueChange={v => update("recipient_type", v)}>
                <SelectTrigger className="h-11 rounded-xl border-stone-200 bg-white dark:bg-stone-900 focus:ring-primary/20 font-semibold transition-all"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  {recipientTypes.map(r => <SelectItem key={r.value} value={r.value} className="font-semibold">{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-stone-600 dark:text-stone-400 font-bold text-xs block mb-1.5">{t.recipientName}</Label>
              <Input 
                value={form.recipient_name} 
                onChange={e => update("recipient_name", e.target.value)} 
                placeholder={isRTL ? "مثال: أحمد حسن" : "e.g. Ahmed Hassan"} 
                className="h-11 rounded-xl border-stone-200 bg-white dark:bg-stone-900 focus-visible:ring-primary/20 font-semibold transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-stone-600 dark:text-stone-400 font-bold text-xs block mb-1.5">{t.recipientId}</Label>
              <Input 
                value={form.recipient_id || ""} 
                onChange={e => update("recipient_id", e.target.value)} 
                placeholder={isRTL ? "مثال: EMP-102" : "e.g. EMP-102"}
                className="h-11 rounded-xl border-stone-200 bg-white dark:bg-stone-900 focus-visible:ring-primary/20 num-en font-semibold transition-all"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-stone-600 dark:text-stone-400 font-bold text-xs block mb-1.5">{t.amount}</Label>
              <Input 
                type="number" 
                step="0.01" 
                value={form.amount} 
                onChange={e => update("amount", parseFloat(e.target.value) || 0)} 
                className="h-11 rounded-xl border-stone-200 bg-white dark:bg-stone-900 focus-visible:ring-primary/20 num-en font-semibold transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-stone-600 dark:text-stone-400 font-bold text-xs block mb-1.5">{t.month}</Label>
              <MonthPicker 
                value={form.month || ""} 
                onChange={val => update("month", val)} 
                className="border-stone-200"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-stone-600 dark:text-stone-400 font-bold text-xs block mb-1.5">{t.paymentMethod}</Label>
              <Select value={form.payment_method} onValueChange={v => update("payment_method", v)}>
                <SelectTrigger className="h-11 rounded-xl border-stone-200 bg-white dark:bg-stone-900 focus:ring-primary/20 font-semibold transition-all"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  {paymentMethods.map(p => <SelectItem key={p.value} value={p.value} className="font-semibold">{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-stone-600 dark:text-stone-400 font-bold text-xs block mb-1.5">{t.status}</Label>
              <Select value={form.status} onValueChange={v => update("status", v)}>
                <SelectTrigger className="h-11 rounded-xl border-stone-200 bg-white dark:bg-stone-900 focus:ring-primary/20 font-semibold transition-all"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  {statuses.map(s => <SelectItem key={s.value} value={s.value} className="font-semibold">{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-stone-600 dark:text-stone-400 font-bold text-xs block mb-1.5">{t.paymentDate}</Label>
              <DatePicker 
                value={form.payment_date} 
                onChange={val => update("payment_date", val)} 
                className="num-en border-stone-200"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-stone-600 dark:text-stone-400 font-bold text-xs block mb-1.5">{t.referenceNo}</Label>
              <Input 
                value={form.reference_no || ""} 
                onChange={e => update("reference_no", e.target.value)} 
                placeholder={isRTL ? "مثال: TXN-9823" : "e.g. TXN-9823"}
                className="h-11 rounded-xl border-stone-200 bg-white dark:bg-stone-900 focus-visible:ring-primary/20 num-en font-semibold transition-all"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-stone-600 dark:text-stone-400 font-bold text-xs block mb-1.5">{t.description}</Label>
            <Textarea 
              value={form.description || ""} 
              onChange={e => update("description", e.target.value)} 
              rows={2} 
              className="rounded-xl border-stone-200 bg-white dark:bg-stone-900 focus-visible:ring-primary/20 font-semibold p-3 transition-all"
              placeholder={isRTL ? "أية تفاصيل إضافية حول البيان..." : "Any additional transaction details..."}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-stone-600 dark:text-stone-400 font-bold text-xs block mb-1.5">{t.notes}</Label>
            <Textarea 
              value={form.notes || ""} 
              onChange={e => update("notes", e.target.value)} 
              rows={2} 
              className="rounded-xl border-stone-200 bg-white dark:bg-stone-900 focus-visible:ring-primary/20 font-semibold p-3 transition-all"
              placeholder={isRTL ? "ملاحظات سرية أو إدارية..." : "Confidential or administrative notes..."}
            />
          </div>
          <button 
            onClick={handleSave} 
            disabled={saving || !form.recipient_name || form.amount <= 0} 
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/95 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed w-full h-11 mt-2"
          >
            {saving ? t.saving : isEdit ? t.update : t.save}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
