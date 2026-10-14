import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { entities } from "@/api/dbClient";
import { useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/lib/LanguageContext";
import { Loader2 } from "lucide-react";

const grades = ["1","2","3","4","5","6","7","8","9","10","11","12"];

/**
 * Generate a sequential student ID (الرقم المدرسي) in format STU-0001, STU-0002, etc.
 * النطاق: داخل المدرسة الحالية فقط — كل مدرسة لها تسلسلها المستقل.
 */
async function generateNextStudentId() {
  const schoolId = (() => { try { return localStorage.getItem('portal_school_id') || null; } catch { return null; } })();
  try {
    const apiBase = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '');
    const url = apiBase ? `${apiBase}/neon-db/next-student-id` : '/neon-db/next-student-id';
    const headers = {};
    try {
      const token = localStorage.getItem('portal_jwt_token') || localStorage.getItem('jwt_token') || localStorage.getItem('auth_token') || localStorage.getItem('token');
      if (token) headers['Authorization'] = `Bearer ${token}`;
    } catch { /* ignore */ }
    const res = await fetch(url, { headers });
    if (res.ok) {
      const data = await res.json();
      if (data?.student_id) return data.student_id;
    }
  } catch { /* fallback below */ }
  try {
    const students = await entities.Student.list();
    const scoped = schoolId ? students.filter(s => s.school_id != null && String(s.school_id) === String(schoolId)) : students;
    let maxNum = 0;
    scoped.forEach(s => {
      const match = String(s.student_id || '').match(/STU-(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    });
    return `STU-${String(maxNum + 1).padStart(4, '0')}`;
  } catch (e) {
    console.warn('Could not fetch students for ID generation, using fallback:', e);
    return `STU-${String(Date.now()).slice(-4)}`;
  }
}

export default function StudentFormDialog({ open, onClose, student }) {
  const isEdit = !!student;
  const qc = useQueryClient();
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const [saving, setSaving] = useState(false);
  const [isGeneratingId, setIsGeneratingId] = useState(false);
  const [form, setForm] = useState(student || {
    full_name: "", student_id: "", user_email: "", portal_password: "", parent_password: "", grade: "1", section: "أبو بكر",
    date_of_birth: "", parent_name: "", parent_phone: "", parent_email: "",
    father_occupation: "", father_workplace: "",
    mother_name: "", mother_occupation: "", mother_workplace: "", mother_phone: "",
    siblings_count: 0, siblings_classes: "", sibling_order: "", track: "",
    address: "", card_balance: 0, bus_registered: false, bus_route: "", status: "active"
  });

  // Auto-generate student_id (الرقم المدرسي) when opening dialog for new student
  useEffect(() => {
    if (student) {
      setForm({
        ...student,
        date_of_birth: student.date_of_birth ? student.date_of_birth.substring(0, 10) : "",
        portal_password: "",
        parent_password: ""
      });
      setIsGeneratingId(false);
    } else {
      setIsGeneratingId(true);
      setForm({
        full_name: "", student_id: "", user_email: "", portal_password: "", parent_password: "", grade: "1", section: "أبو بكر",
        date_of_birth: "", parent_name: "", parent_phone: "", parent_email: "",
        father_occupation: "", father_workplace: "",
        mother_name: "", mother_occupation: "", mother_workplace: "", mother_phone: "",
        siblings_count: 0, siblings_classes: "", sibling_order: "", track: "",
        address: "", card_balance: 0, bus_registered: false, bus_route: "", status: "active"
      });
      generateNextStudentId().then(id => {
        setForm(prev => ({ ...prev, student_id: id }));
        setIsGeneratingId(false);
      }).catch(() => setIsGeneratingId(false));
    }
  }, [student, open]);

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.portal_password) {
        delete payload.portal_password;
      }
      if (!payload.parent_password) {
        delete payload.parent_password;
      }
      if (payload.date_of_birth === "") {
        payload.date_of_birth = null;
      }
      // الأعمدة الصحيحة في قاعدة البيانات ترفض السلسلة الفارغة — نحوّلها إلى null/0
      if (payload.sibling_order === "" || payload.sibling_order === undefined) {
        payload.sibling_order = null;
      } else {
        const n = parseInt(payload.sibling_order, 10);
        payload.sibling_order = isNaN(n) ? null : n;
      }
      if (payload.siblings_count === "" || payload.siblings_count === undefined) {
        payload.siblings_count = 0;
      } else {
        const n = parseInt(payload.siblings_count, 10);
        payload.siblings_count = isNaN(n) ? 0 : n;
      }

      if (isEdit) {
        await entities.Student.update(student.id, payload);
      } else {
        await entities.Student.create(payload);
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
    section: isRTL ? "القسم" : "Section",
    dob: isRTL ? "تاريخ الميلاد" : "Date of Birth",
    parentName: isRTL ? "اسم ولي الأمر" : "Parent Name",
    parentPhone: isRTL ? "رقم هاتف ولي الأمر" : "Parent Phone",
    parentEmail: isRTL ? "البريد الإلكتروني لولي الأمر" : "Parent Email",
    fatherOccupation: isRTL ? "مهنة الوالد" : "Father's Occupation",
    fatherWorkplace: isRTL ? "مكان عمل الوالد" : "Father's Workplace",
    motherName: isRTL ? "اسم الوالدة" : "Mother's Name",
    motherOccupation: isRTL ? "مهنة الوالدة" : "Mother's Occupation",
    motherWorkplace: isRTL ? "مكان عمل الوالدة" : "Mother's Workplace",
    motherPhone: isRTL ? "رقم هاتف الوالدة" : "Mother's Phone",
    siblingsSection: isRTL ? "الإخوة في المدرسة" : "Siblings in School",
    siblingsCount: isRTL ? "عددهم" : "Number",
    siblingsClasses: isRTL ? "فصولهم" : "Their Classes",
    siblingOrder: isRTL ? "ترتيب الطالب بين أشقائه" : "Birth Order Among Siblings",
    track: isRTL ? "المسار" : "Track",
    trackScience: isRTL ? "مسار علمي" : "Science Track",
    trackLiterary: isRTL ? "مسار أدبي" : "Literary Track",
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
        <DialogHeader className="">
          <DialogTitle className="font-display text-xl text-stone-900 font-bold">
            {isEdit ? t.titleEdit : t.titleAdd}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4" autoComplete="off">
          {/* حقول وهمية لخداع الإكمال التلقائي للمتصفح ومنعه من تعبئة بيانات المدير */}
          <input type="text" name="fake-username-trap" autoComplete="username" tabIndex={-1} aria-hidden="true" className="hidden" />
          <input type="password" name="fake-password-trap" autoComplete="new-password" tabIndex={-1} aria-hidden="true" className="hidden" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-stone-700 font-medium">{t.fullName}</Label>
              <Input 
                value={form.full_name} 
                onChange={e => update("full_name", e.target.value)} 
                className="mt-1 rounded-lg border-stone-200"
                placeholder={isRTL ? "الاسم الرباعي للطالب" : "e.g. Khalid Omar"} 
              />
            </div>
            <div>
              <Label className="text-stone-700 font-medium">{t.studentId} {isRTL ? "(تلقائي)" : "(Auto)"}</Label>
              {isGeneratingId ? (
                <div className="mt-1 rounded-lg border border-stone-200 bg-stone-50/50 h-10 flex items-center gap-2 px-3">
                  <Loader2 className="animate-spin text-primary" size={14} />
                  <span className="text-stone-500 text-sm">{isRTL ? "جاري إنشاء الرقم المدرسي..." : "Generating School ID..."}</span>
                </div>
              ) : (
                <Input 
                  value={form.student_id} 
                  readOnly
                  className="mt-1 rounded-lg border-stone-200 bg-stone-50/50 font-mono text-primary font-bold num-en cursor-default"
                  placeholder={isRTL ? "يتم إنشاؤه تلقائياً" : "Auto-generated"}
                />
              )}
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
              <Select value={form.section || ""} onValueChange={v => update("section", v)}>
                <SelectTrigger className="mt-1 rounded-lg border-stone-200 bg-white">
                  <SelectValue placeholder={isRTL ? "اختر القسم..." : "Select Section..."} />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="المنهج السوداني" className="font-semibold">{isRTL ? "المنهج السوداني" : "Sudanese Curriculum"}</SelectItem>
                  <SelectItem value="المنهج البريطاني" className="font-semibold">{isRTL ? "المنهج البريطاني" : "British Curriculum"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-stone-700 font-medium">{t.dob}</Label>
              <DatePicker 
                value={form.date_of_birth} 
                onChange={val => update("date_of_birth", val)} 
                className="mt-1 rounded-lg border-stone-200"
              />
            </div>
          </div>
          <div>
            <Label className="text-stone-700 font-medium">{t.track}</Label>
            <Select value={form.track || ""} onValueChange={v => update("track", v)}>
              <SelectTrigger className="mt-1 rounded-lg border-stone-200 bg-white">
                <SelectValue placeholder={isRTL ? "اختر المسار..." : "Select Track..."} />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="علمي" className="font-semibold">{t.trackScience}</SelectItem>
                <SelectItem value="أدبي" className="font-semibold">{t.trackLiterary}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-stone-700 font-medium">{t.parentName}</Label>
              <Input 
                value={form.parent_name} 
                onChange={e => update("parent_name", e.target.value)} 
                className="mt-1 rounded-lg border-stone-200"
                placeholder={isRTL ? "اسم ولي الأمر الثلاثي" : "e.g. Omar Khalid"} 
              />
            </div>
            <div>
              <Label className="text-stone-700 font-medium">{t.parentPhone}</Label>
              <Input 
                value={form.parent_phone} 
                onChange={e => update("parent_phone", e.target.value)} 
                className="mt-1 rounded-lg border-stone-200 num-en"
placeholder="رقم الهاتف مع مفتاح الدولة" 
               />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-stone-700 font-medium">{t.studentEmail}</Label>
              <Input 
                type="email"
                name="new-student-email"
                autoComplete="off"
                value={form.user_email || ""} 
                onChange={e => update("user_email", e.target.value)} 
                className="mt-1 rounded-lg border-stone-200 num-en"
                placeholder={isRTL ? "أدخل البريد الإلكتروني للطالب (مثال: student@school.com)" : "Enter student email (e.g. student@school.com)"} 
              />
            </div>
            <div>
              <Label className="text-stone-700 font-medium">{t.studentPassword}</Label>
              <Input 
                type="password"
                name="new-student-portal-password"
                autoComplete="new-password"
                value={form.portal_password || ""} 
                onChange={e => update("portal_password", e.target.value)} 
                className="mt-1 rounded-lg border-stone-200"
                placeholder={isEdit ? t.passwordPlaceholder : (isRTL ? "أدخل كلمة مرور جديدة للطالب" : "Enter a new password for the student")} 
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-stone-700 font-medium">{t.parentEmail}</Label>
              <Input 
                type="email"
                name="new-parent-email"
                autoComplete="off"
                value={form.parent_email} 
                onChange={e => update("parent_email", e.target.value)} 
                className="mt-1 rounded-lg border-stone-200 num-en"
                placeholder={isRTL ? "أدخل البريد الإلكتروني لولي الأمر (مثال: parent@school.com)" : "Enter parent email (e.g. parent@school.com)"} 
              />
            </div>
            <div>
              <Label className="text-stone-700 font-medium">{t.parentPassword}</Label>
              <Input 
                type="password"
                name="new-parent-portal-password"
                autoComplete="new-password"
                value={form.parent_password || ""} 
                onChange={e => update("parent_password", e.target.value)} 
                className="mt-1 rounded-lg border-stone-200"
                placeholder={isEdit ? t.passwordPlaceholder : (isRTL ? "أدخل كلمة مرور جديدة لولي الأمر" : "Enter a new password for the parent")} 
              />
            </div>
          </div>
          <div>
            <Label className="text-stone-700 font-medium">{t.address}</Label>
            <Input 
              value={form.address} 
              onChange={e => update("address", e.target.value)} 
              className="mt-1 rounded-lg border-stone-200"
              placeholder={isRTL ? "الشارع، المنطقة، المدينة" : "e.g. Dubai, Sheikh Zayed Rd"} 
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-stone-700 font-medium">{t.fatherOccupation}</Label>
              <Input
                value={form.father_occupation || ""}
                onChange={e => update("father_occupation", e.target.value)}
                className="mt-1 rounded-lg border-stone-200"
                placeholder={isRTL ? "مثال: مهندس، طبيب..." : "e.g. Engineer..."}
              />
            </div>
            <div>
              <Label className="text-stone-700 font-medium">{t.fatherWorkplace}</Label>
              <Input
                value={form.father_workplace || ""}
                onChange={e => update("father_workplace", e.target.value)}
                className="mt-1 rounded-lg border-stone-200"
                placeholder={isRTL ? "مكان العمل" : "Workplace"}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-stone-700 font-medium">{t.motherName}</Label>
              <Input
                value={form.mother_name || ""}
                onChange={e => update("mother_name", e.target.value)}
                className="mt-1 rounded-lg border-stone-200"
                placeholder={isRTL ? "اسم الوالدة" : "Mother's name"}
              />
            </div>
            <div>
              <Label className="text-stone-700 font-medium">{t.motherPhone}</Label>
              <Input
                value={form.mother_phone || ""}
                onChange={e => update("mother_phone", e.target.value)}
                className="mt-1 rounded-lg border-stone-200 num-en"
                placeholder={isRTL ? "رقم الهاتف مع مفتاح الدولة" : "Phone with country code"}
              />
            </div>
            <div>
              <Label className="text-stone-700 font-medium">{t.motherOccupation}</Label>
              <Input
                value={form.mother_occupation || ""}
                onChange={e => update("mother_occupation", e.target.value)}
                className="mt-1 rounded-lg border-stone-200"
                placeholder={isRTL ? "مهنة الوالدة" : "Mother's occupation"}
              />
            </div>
            <div>
              <Label className="text-stone-700 font-medium">{t.motherWorkplace}</Label>
              <Input
                value={form.mother_workplace || ""}
                onChange={e => update("mother_workplace", e.target.value)}
                className="mt-1 rounded-lg border-stone-200"
                placeholder={isRTL ? "مكان العمل" : "Workplace"}
              />
            </div>
          </div>
          <div>
            <Label className="text-stone-700 font-medium">{t.siblingsSection}</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
              <Input
                type="number"
                min="0"
                value={form.siblings_count ?? 0}
                onChange={e => update("siblings_count", parseInt(e.target.value) || 0)}
                className="rounded-lg border-stone-200 num-en"
                placeholder={t.siblingsCount}
              />
              <Input
                value={form.siblings_classes || ""}
                onChange={e => update("siblings_classes", e.target.value)}
                className="rounded-lg border-stone-200"
                placeholder={t.siblingsClasses}
              />
              <Input
                type="number"
                min="1"
                value={form.sibling_order ?? ""}
                onChange={e => update("sibling_order", e.target.value === "" ? "" : parseInt(e.target.value) || "")}
                className="rounded-lg border-stone-200 num-en"
                placeholder={t.siblingOrder}
              />
            </div>
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