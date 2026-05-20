import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/lib/LanguageContext";

export default function StaffMemberFormDialog({ open, onClose, member }) {
  const isEdit = !!member;
  const qc = useQueryClient();
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(member || {
    full_name: "", employee_id: "", role: "bus_supervisor",
    email: "", phone: "", portal_password: "", status: "active", notes: ""
  });

  useEffect(() => {
    setForm(member || {
      full_name: "", employee_id: "", role: "bus_supervisor",
      email: "", phone: "", portal_password: "", status: "active", notes: ""
    });
  }, [member]);

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!form.full_name || !form.employee_id || !form.role) return;
    setSaving(true);
    try {
      if (isEdit) {
        await base44.entities.StaffMember.update(member.id, form);
      } else {
        await base44.entities.StaffMember.create(form);
      }
      qc.invalidateQueries({ queryKey: ["staff-members"] });
      onClose();
    } catch (err) {
      console.error("Failed to save staff member:", err);
    }
    setSaving(false);
  };

  const roles = [
    { value: "bus_supervisor", label: isRTL ? "مشرف حافلة" : "Bus Supervisor" },
    { value: "store_keeper", label: isRTL ? "أمين مستودع" : "Store Keeper" },
    { value: "security", label: isRTL ? "حارس أمن" : "Security" },
    { value: "Admin", label: isRTL ? "مدير نظام" : "Admin" },
    { value: "HR", label: isRTL ? "موارد بشرية" : "HR" },
    { value: "Accountant", label: isRTL ? "محاسب" : "Accountant" },
    { value: "Registrar", label: isRTL ? "مسجل" : "Registrar" },
  ];

  const statuses = [
    { value: "active", label: isRTL ? "نشط" : "Active" },
    { value: "on_leave", label: isRTL ? "في إجازة" : "On Leave" },
    { value: "suspended", label: isRTL ? "موقوف" : "Suspended" },
    { value: "terminated", label: isRTL ? "منتهي الخدمة" : "Terminated" },
  ];

  const t = {
    titleAdd: isRTL ? "إضافة موظف جديد" : "Add Staff Member",
    titleEdit: isRTL ? "تعديل بيانات الموظف" : "Edit Staff Member",
    fullName: isRTL ? "الاسم الكامل *" : "Full Name *",
    employeeId: isRTL ? "الرقم الوظيفي *" : "Employee ID *",
    role: isRTL ? "الدور / المسمى الوظيفي *" : "Role *",
    email: isRTL ? "البريد الإلكتروني" : "Email",
    phone: isRTL ? "رقم الهاتف" : "Phone",
    password: isRTL ? "كلمة مرور البوابة" : "Portal Password",
    passwordPlaceholder: isRTL 
      ? (isEdit ? "اتركه فارغاً للاحتفاظ بالحالي" : "تعيين كلمة مرور البوابة") 
      : (isEdit ? "Leave blank to keep current" : "Set portal password"),
    status: isRTL ? "الحالة" : "Status",
    notes: isRTL ? "ملاحظات" : "Notes",
    saving: isRTL ? "جاري الحفظ..." : "Saving...",
    save: isRTL ? "إضافة موظف" : "Add Staff Member",
    update: isRTL ? "تحديث البيانات" : "Update Staff"
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir={isRTL ? "rtl" : "ltr"}>
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-stone-900 font-bold">
            {isEdit ? t.titleEdit : t.titleAdd}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-stone-700 font-medium">{t.fullName}</Label>
              <Input 
                value={form.full_name} 
                onChange={e => update("full_name", e.target.value)} 
                placeholder={isRTL ? "مثال: عمر خالد" : "e.g. Omar Khalid"} 
                className="mt-1 rounded-lg border-stone-200"
              />
            </div>
            <div>
              <Label className="text-stone-700 font-medium">{t.employeeId}</Label>
              <Input 
                value={form.employee_id} 
                onChange={e => update("employee_id", e.target.value)} 
                placeholder={isRTL ? "مثال: STF-001" : "e.g. STF-001"} 
                className="mt-1 rounded-lg border-stone-200 num-en"
              />
            </div>
          </div>
          <div>
            <Label className="text-stone-700 font-medium">{t.role}</Label>
            <Select value={form.role} onValueChange={v => update("role", v)}>
              <SelectTrigger className="mt-1 rounded-lg border-stone-200"><SelectValue /></SelectTrigger>
              <SelectContent>
                {roles.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-stone-700 font-medium">{t.email}</Label>
              <Input 
                type="email" 
                value={form.email} 
                onChange={e => update("email", e.target.value)} 
                className="mt-1 rounded-lg border-stone-200 num-en"
                placeholder="staff@edutrack.com"
              />
            </div>
            <div>
              <Label className="text-stone-700 font-medium">{t.phone}</Label>
              <Input 
                value={form.phone} 
                onChange={e => update("phone", e.target.value)} 
                className="mt-1 rounded-lg border-stone-200 num-en"
                placeholder="+971 50 000 0000"
              />
            </div>
          </div>
          <div>
            <Label className="text-stone-700 font-medium">{t.password}</Label>
            <Input 
              type="password" 
              value={form.portal_password || ""} 
              onChange={e => update("portal_password", e.target.value)} 
              placeholder={t.passwordPlaceholder} 
              className="mt-1 rounded-lg border-stone-200 num-en"
            />
          </div>
          <div>
            <Label className="text-stone-700 font-medium">{t.status}</Label>
            <Select value={form.status} onValueChange={v => update("status", v)}>
              <SelectTrigger className="mt-1 rounded-lg border-stone-200"><SelectValue /></SelectTrigger>
              <SelectContent>
                {statuses.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-stone-700 font-medium">{t.notes}</Label>
            <Textarea 
              value={form.notes || ""} 
              onChange={e => update("notes", e.target.value)} 
              rows={2} 
              className="mt-1 rounded-lg border-stone-200"
              placeholder={isRTL ? "أية ملاحظات إضافية..." : "Any additional notes..."}
            />
          </div>
          <button 
            onClick={handleSave} 
            disabled={saving || !form.full_name || !form.employee_id || !form.role} 
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed w-full h-11"
          >
            {saving ? t.saving : isEdit ? t.update : t.save}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
