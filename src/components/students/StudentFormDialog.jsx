import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/lib/LanguageContext";

const grades = ["1","2","3","4","5","6","7","8","9","10","11","12"];

export default function StudentFormDialog({ open, onClose, student }) {
  const isEdit = !!student;
  const qc = useQueryClient();
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(student || {
    full_name: "", student_id: "", user_email: "", portal_password: "", parent_password: "", grade: "1", section: "A",
    date_of_birth: "", parent_name: "", parent_phone: "", parent_email: "",
    address: "", card_balance: 0, bus_registered: false, bus_route: "", status: "active"
  });

  useEffect(() => {
    setForm(student || {
      full_name: "", student_id: "", user_email: student?.user_email || "", portal_password: "", parent_password: "", grade: "1", section: "A",
      date_of_birth: "", parent_name: "", parent_phone: "", parent_email: "",
      address: "", card_balance: 0, bus_registered: false, bus_route: "", status: "active"
    });
  }, [student]);

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isEdit) {
        await base44.entities.Student.update(student.id, form);
      } else {
        await base44.entities.Student.create(form);
      }
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["student-directory-list"] });
      onClose();
    } catch (err) {
      console.error("Failed to save student:", err);
    }
    setSaving(false);
  };

  const t = {
    titleAdd: isRTL ? "إضافة طالب جديد" : "Add Student",
    titleEdit: isRTL ? "تعديل بيانات الطالب" : "Edit Student",
    fullName: isRTL ? "الاسم الكامل *" : "Full Name *",
    studentId: isRTL ? "الرقم الجامعي / الهوية *" : "Student ID *",
    grade: isRTL ? "الصف *" : "Grade *",
    gradeItem: (g) => isRTL ? `الصف ${g}` : `Grade ${g}`,
    section: isRTL ? "الشعبة" : "Section",
    dob: isRTL ? "تاريخ الميلاد" : "Date of Birth",
    parentName: isRTL ? "اسم ولي الأمر" : "Parent Name",
    parentPhone: isRTL ? "رقم هاتف ولي الأمر" : "Parent Phone",
    parentEmail: isRTL ? "البريد الإلكتروني لولي الأمر" : "Parent Email",
    address: isRTL ? "العنوان" : "Address",
    cardBalance: isRTL ? "رصيد البطاقة ($)" : "Card Balance ($)",
    status: isRTL ? "الحالة" : "Status",
    statusActive: isRTL ? "نشط" : "Active",
    statusSuspended: isRTL ? "موقوف" : "Suspended",
    statusGraduated: isRTL ? "متخرج" : "Graduated",
    statusTransferred: isRTL ? "منقول" : "Transferred",
    busRegistered: isRTL ? "مسجل في الحافلة" : "Bus Registered",
    busRoutePlaceholder: isRTL ? "مسار الحافلة" : "Bus route",
    saving: isRTL ? "جاري الحفظ..." : "Saving...",
    save: isRTL ? "حفظ البيانات" : "Save Student",
    update: isRTL ? "تحديث البيانات" : "Update Student",
    studentEmail: isRTL ? "البريد الإلكتروني للطالب" : "Student Email",
    studentPassword: isRTL ? "كلمة مرور بوابة الطالب" : "Student Portal Password",
    parentPassword: isRTL ? "كلمة مرور بوابة ولي الأمر" : "Parent Portal Password",
    passwordPlaceholder: isRTL ? "اتركه فارغاً للاحتفاظ بكلمة المرور الحالية" : "Leave blank to keep existing"
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
                className="mt-1 rounded-lg border-stone-200"
                placeholder={isRTL ? "الاسم الثلاثي أو الكامل" : "e.g. Khalid Omar"} 
              />
            </div>
            <div>
              <Label className="text-stone-700 font-medium">{t.studentId}</Label>
              <Input 
                value={form.student_id} 
                onChange={e => update("student_id", e.target.value)} 
                className="mt-1 rounded-lg border-stone-200 num-en"
                placeholder={isRTL ? "مثال: STU-2026" : "e.g. STU-2026"} 
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-stone-700 font-medium">{t.grade}</Label>
              <Select value={form.grade} onValueChange={v => update("grade", v)}>
                <SelectTrigger className="mt-1 rounded-lg border-stone-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {grades.map(g => <SelectItem key={g} value={g}>{t.gradeItem(g)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-stone-700 font-medium">{t.section}</Label>
              <Input 
                value={form.section} 
                onChange={e => update("section", e.target.value)} 
                className="mt-1 rounded-lg border-stone-200"
                placeholder="A" 
              />
            </div>
            <div>
              <Label className="text-stone-700 font-medium">{t.dob}</Label>
              <Input 
                type="date" 
                value={form.date_of_birth} 
                onChange={e => update("date_of_birth", e.target.value)} 
                className="mt-1 rounded-lg border-stone-200"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-stone-700 font-medium">{t.parentName}</Label>
              <Input 
                value={form.parent_name} 
                onChange={e => update("parent_name", e.target.value)} 
                className="mt-1 rounded-lg border-stone-200"
                placeholder={isRTL ? "اسم ولي الأمر الكامل" : "e.g. Omar Khalid"} 
              />
            </div>
            <div>
              <Label className="text-stone-700 font-medium">{t.parentPhone}</Label>
              <Input 
                value={form.parent_phone} 
                onChange={e => update("parent_phone", e.target.value)} 
                className="mt-1 rounded-lg border-stone-200 num-en"
                placeholder="+971 50 000 0000" 
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-stone-700 font-medium">{t.studentEmail}</Label>
              <Input 
                value={form.user_email || ""} 
                onChange={e => update("user_email", e.target.value)} 
                className="mt-1 rounded-lg border-stone-200 num-en"
                placeholder="student@example.com" 
              />
            </div>
            <div>
              <Label className="text-stone-700 font-medium">{t.studentPassword}</Label>
              <Input 
                type="password"
                value={form.portal_password || ""} 
                onChange={e => update("portal_password", e.target.value)} 
                className="mt-1 rounded-lg border-stone-200"
                placeholder={isEdit ? t.passwordPlaceholder : "••••••••"} 
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-stone-700 font-medium">{t.parentEmail}</Label>
              <Input 
                value={form.parent_email} 
                onChange={e => update("parent_email", e.target.value)} 
                className="mt-1 rounded-lg border-stone-200 num-en"
                placeholder="parent@example.com" 
              />
            </div>
            <div>
              <Label className="text-stone-700 font-medium">{t.parentPassword}</Label>
              <Input 
                type="password"
                value={form.parent_password || ""} 
                onChange={e => update("parent_password", e.target.value)} 
                className="mt-1 rounded-lg border-stone-200"
                placeholder={isEdit ? t.passwordPlaceholder : "••••••••"} 
              />
            </div>
          </div>
          <div>
            <Label className="text-stone-700 font-medium">{t.address}</Label>
            <Input 
              value={form.address} 
              onChange={e => update("address", e.target.value)} 
              className="mt-1 rounded-lg border-stone-200"
              placeholder={isRTL ? "مثال: دبي، شارع الشيخ زايد" : "e.g. Dubai, Sheikh Zayed Rd"} 
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-stone-700 font-medium">{t.cardBalance}</Label>
              <Input 
                type="number" 
                value={form.card_balance} 
                onChange={e => update("card_balance", parseFloat(e.target.value) || 0)} 
                className="mt-1 rounded-lg border-stone-200 num-en"
              />
            </div>
            <div>
              <Label className="text-stone-700 font-medium">{t.status}</Label>
              <Select value={form.status} onValueChange={v => update("status", v)}>
                <SelectTrigger className="mt-1 rounded-lg border-stone-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t.statusActive}</SelectItem>
                  <SelectItem value="suspended">{t.statusSuspended}</SelectItem>
                  <SelectItem value="graduated">{t.statusGraduated}</SelectItem>
                  <SelectItem value="transferred">{t.statusTransferred}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-stone-50 border border-stone-100">
            <Switch checked={form.bus_registered} onCheckedChange={v => update("bus_registered", v)} />
            <Label className="text-stone-700 font-medium">{t.busRegistered}</Label>
            {form.bus_registered && (
              <Input 
                className="ml-auto rtl:mr-auto rtl:ml-0 w-40 rounded-lg border-stone-200" 
                placeholder={t.busRoutePlaceholder} 
                value={form.bus_route} 
                onChange={e => update("bus_route", e.target.value)} 
              />
            )}
          </div>
          <button 
            onClick={handleSave} 
            disabled={saving || !form.full_name || !form.student_id} 
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed w-full h-11"
          >
            {saving ? t.saving : isEdit ? t.update : t.save}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}