import { useEffect, useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { entities } from "@/api/dbClient";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/lib/LanguageContext";
import { motion } from "framer-motion";
import { getNextStudentId, formatStudentId, isValidStudentId } from "@/utils/studentIdFormatter";
import { 
  ArrowLeft, 
  ArrowRight, 
  Camera, 
  Trash2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard, 
  Bus, 
  Lock, 
  GraduationCap, 
  AlertCircle,
  Wallet,
  DollarSign,
  CheckCircle,
  HeartPulse,
  Activity,
  Pill,
  Building2,
  FileText,
  Upload,
  Eye,
  Loader2
} from "lucide-react";

const grades = ["1","2","3","4","5","6","7","8","9","10","11","12"];

// Predefined modern high-fidelity student avatar presets (using public, high-quality, lightweight SVG designs)
const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256", // Girl
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=256", // Boy
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=256", // Girl 2
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256", // Boy 2
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=256"  // Girl 3
];

export default function StudentForm({ student, onClose }) {
  const isEdit = !!student;
  const qc = useQueryClient();
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const fileInputRef = useRef(null);
  const lastResultInputRef = useRef(null);
  const nationalIdInputRef = useRef(null);
  
  const [saving, setSaving] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState({});
  const [errorMsg, setErrorMsg] = useState("");
  const [form, setForm] = useState(student || {
    full_name: "", student_id: "", user_email: "", portal_password: "", parent_password: "", grade: "1", section: "A",
    date_of_birth: "", parent_name: "", parent_phone: "", parent_email: "",
    address: "", card_balance: 0, bus_registered: false, bus_route: "", status: "active", photo_url: "",
    tuition_total: 0, tuition_paid: 0,
    has_chronic_conditions: false, chronic_conditions_details: "",
    has_surgeries: false, surgery_details: "",
    has_regular_medications: false, medication_details: "",
    previous_school: "",
    last_result_document_url: "",
    national_id_document_url: ""
  });

  // Fetch all fee structures to calculate total fees based on selected grade
  const { data: feeStructures = [] } = useQuery({
    queryKey: ['fee-structures'],
    queryFn: () => entities.FeeStructure.list(),
  });

  useEffect(() => {
    if (student) {
      setForm({
        ...student,
        has_chronic_conditions: student.has_chronic_conditions || false,
        chronic_conditions_details: student.chronic_conditions_details || "",
        has_surgeries: student.has_surgeries || false,
        surgery_details: student.surgery_details || "",
        has_regular_medications: student.has_regular_medications || false,
        medication_details: student.medication_details || "",
        previous_school: student.previous_school || "",
        last_result_document_url: student.last_result_document_url || "",
        national_id_document_url: student.national_id_document_url || "",
        date_of_birth: student.date_of_birth ? student.date_of_birth.substring(0, 10) : "",
        portal_password: "",
        parent_password: ""
      });
    } else {
      setForm({
        full_name: "", student_id: "", user_email: student?.user_email || "", portal_password: "", parent_password: "", grade: "1", section: "A",
        date_of_birth: "", parent_name: "", parent_phone: "", parent_email: "",
        address: "", card_balance: 0, bus_registered: false, bus_route: "", status: "active", photo_url: "",
        tuition_total: 0, tuition_paid: 0,
        has_chronic_conditions: false, chronic_conditions_details: "",
        has_surgeries: false, surgery_details: "",
        has_regular_medications: false, medication_details: "",
        previous_school: "",
        last_result_document_url: "",
        national_id_document_url: ""
      });
    }
    setErrorMsg("");
  }, [student]);

  // Handle auto-tuition calculation when grade changes or when adding a new student
  useEffect(() => {
    if (feeStructures.length > 0) {
      // Find fee structures for the current selected grade
      const relevantFees = feeStructures.filter(
        fs => String(fs.grade_level) === String(form.grade) || String(fs.grade_level) === "all"
      );
      const computedTotal = relevantFees.reduce((sum, fs) => sum + parseFloat(fs.amount || 0), 0);
      
      // Update form tuition_total if it changes and is not manually custom set by editing
      // (or default set for new students / when changing grade)
      setForm(f => {
        // If adding a new student, or changing grade, auto-populate the fee
        if (!isEdit || f.grade !== student?.grade) {
          return { ...f, tuition_total: computedTotal };
        }
        return f;
      });
    }
  }, [form.grade, feeStructures, isEdit, student]);

  // Auto-generate next sequential school ID (0001, 0002, ...) for new students
  const { data: allStudentsForId, isLoading: isLoadingId } = useQuery({
    queryKey: ["students-for-id-gen"],
    queryFn: () => entities.Student.list(),
    enabled: !isEdit
  });

  useEffect(() => {
    if (!isEdit && !isLoadingId && allStudentsForId && !form.student_id) {
      const nextId = getNextStudentId(allStudentsForId);
      setForm(f => ({ ...f, student_id: nextId }));
    }
  }, [isEdit, allStudentsForId, isLoadingId, form.student_id]);

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg(isRTL ? "حجم الصورة كبير جداً. الحد الأقصى هو 2 ميجابايت." : "Image is too large. Max size is 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      update("photo_url", event.target.result);
      setErrorMsg("");
    };
    reader.onerror = () => {
      setErrorMsg(isRTL ? "فشل قراءة الملف." : "Failed to read file.");
    };
    reader.readAsDataURL(file);
  };

  const handleDocumentUpload = (file, fieldKey) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg(isRTL ? "حجم الملف كبير جداً. الحد الأقصى هو 5 ميجابايت." : "File is too large. Max size is 5MB.");
      return;
    }

    setUploadingDoc(prev => ({ ...prev, [fieldKey]: true }));
    setErrorMsg("");

    const reader = new FileReader();
    reader.onload = async (event) => {
      const fullDataUri = event.target.result;
      let finalUrl = fullDataUri;

      try {
        const base64Data = typeof fullDataUri === "string" ? fullDataUri.split(",")[1] : null;
        if (base64Data) {
          const apiBase = import.meta.env.VITE_BACKEND_URL || "";
          const uploadUrl = apiBase ? `${apiBase.replace(/\/$/, "")}/neon-db/upload` : "/neon-db/upload";
          const res = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileName: file.name,
              fileData: base64Data
            })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.fileUrl) {
              finalUrl = data.fileUrl;
            }
          }
        }
      } catch (err) {
        console.warn("Upload to server endpoint failed, falling back to data URL:", err);
      }

      update(fieldKey, finalUrl);
      setUploadingDoc(prev => ({ ...prev, [fieldKey]: false }));
    };

    reader.onerror = () => {
      setErrorMsg(isRTL ? "فشل قراءة الملف." : "Failed to read file.");
      setUploadingDoc(prev => ({ ...prev, [fieldKey]: false }));
    };

    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!form.full_name || !form.student_id) {
      setErrorMsg(isRTL ? "يرجى تعبئة الحقول المطلوبة (*)." : "Please fill in all required fields (*).");
      return;
    }

    setSaving(true);
    setErrorMsg("");
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

      if (isEdit) {
        await entities.Student.update(student.id, payload);
        qc.invalidateQueries({ queryKey: ["student-profile", student.id] });
        qc.invalidateQueries({ queryKey: ["student-detail", student.id] });
      } else {
        await entities.Student.create(payload);
      }
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["student-directory-list"] });
      onClose();
    } catch (err) {
      console.error("Failed to save student:", err);
      setErrorMsg(isRTL ? "حدث خطأ أثناء حفظ البيانات. يرجى التحقق من صحة الرقم المدرسي." : "Error saving student data. Please check if the School ID is unique.");
    }
    setSaving(false);
  };

  const t = {
    titleAdd: isRTL ? "إضافة طالب جديد" : "Add New Student",
    titleEdit: isRTL ? "تعديل بيانات الطالب" : "Edit Student Details",
    backToList: isRTL ? "الرجوع للدليل" : "Back to Directory",
    fullName: isRTL ? "الاسم الكامل *" : "Full Name *",
    studentId: isRTL ? "الرقم المدرسي *" : "School Number *",
    grade: isRTL ? "الصف الدراسي *" : "Grade Level *",
    gradeItem: (g) => isRTL ? `الصف ${g}` : `Grade ${g}`,
    section: isRTL ? "الفصل" : "Class",
    dob: isRTL ? "تاريخ الميلاد" : "Date of Birth",
    parentName: isRTL ? "اسم ولي الأمر" : "Parent Name",
    parentPhone: isRTL ? "رقم هاتف ولي الأمر" : "Parent Phone",
    parentEmail: isRTL ? "البريد الإلكتروني لولي الأمر" : "Parent Email",
    address: isRTL ? "العنوان السكني" : "Residential Address",
    cardBalance: isRTL ? "رصيد البطاقة المدرسية ($)" : "School Card Balance ($)",
    status: isRTL ? "الحالة الدراسية" : "Academic Status",
    statusActive: isRTL ? "نشط" : "Active",
    statusSuspended: isRTL ? "موقوف" : "Suspended",
    statusGraduated: isRTL ? "متخرج" : "Graduated",
    statusTransferred: isRTL ? "منقول" : "Transferred",
    busRegistered: isRTL ? "الاشتراك في الحافلة المدرسية" : "School Bus Registered",
    busRoutePlaceholder: isRTL ? "رقم/مسار الحافلة" : "Bus route",
    saving: isRTL ? "جاري الحفظ والتحقق..." : "Saving & Verifying...",
    save: isRTL ? "حفظ البيانات" : "Save Student",
    update: isRTL ? "تحديث البيانات" : "Update Student",
    studentEmail: isRTL ? "البريد الإلكتروني للطالب" : "Student Email",
    studentPassword: isRTL ? "كلمة مرور بوابة الطالب" : "Student Portal Password",
    parentPassword: isRTL ? "كلمة مرور بوابة ولي الأمر" : "Parent Portal Password",
    passwordPlaceholder: isRTL ? "اتركه فارغاً للاحتفاظ بالحالية" : "Leave blank to keep existing",
    photoLabel: isRTL ? "صورة الطالب الشخصية" : "Student Profile Photo",
    photoHint: isRTL ? "انقر لتحميل صورة جديدة أو اختر رمزاً أدناه" : "Click to upload a new image or pick a preset below",
    avatarPresets: isRTL ? "الرموز الجاهزة" : "Preset Avatars",
    removePhoto: isRTL ? "حذف الصورة" : "Remove Photo",
    secBasicInfo: isRTL ? "البيانات الأساسية والتعليمية" : "Basic & Academic Information",
    secPortals: isRTL ? "حسابات البوابات الإلكترونية" : "Portal Accounts & Security",
    secParent: isRTL ? "معلومات الاتصال وولي الأمر" : "Parent Details & Services",
    secTuition: isRTL ? "الرسوم الدراسية والبيانات المالية" : "Tuition Fees & Financial Details",
    tuitionTotal: isRTL ? "إجمالي الرسوم الدراسية ($)" : "Total Tuition Fees ($)",
    tuitionPaid: isRTL ? "الرسوم الدراسية المدفوعة ($)" : "Tuition Fees Paid ($)",
    tuitionRemaining: isRTL ? "الرسوم المتبقية المستحقة ($)" : "Remaining Due Balance ($)",
    tuitionRemainingHint: isRTL ? "يُحسب تلقائياً: إجمالي الرسوم − الرسوم المدفوعة" : "Auto-computed: Total − Paid",
    secMedical: isRTL ? "الحالة الطبية" : "Medical Condition",
    chronicConditions: isRTL ? "هل يوجد حالات مرضية متكررة؟" : "Are there chronic conditions?",
    chronicConditionsDetails: isRTL ? "تفاصيل الحالات المرضية" : "Details of chronic conditions",
    chronicConditionsPlaceholder: isRTL ? "اذكر تفاصيل الحالة المرضية المزمنة..." : "Mention details of chronic conditions...",
    surgeries: isRTL ? "هل أجريت عملية جراحية؟" : "Has undergone surgery?",
    surgeriesDetails: isRTL ? "تفاصيل العمليات الجراحية" : "Surgery details",
    surgeriesPlaceholder: isRTL ? "اذكر تفاصيل العمليات الجراحية السابقة..." : "Mention details of past surgeries...",
    regularMedications: isRTL ? "هل يتم تناول أدوية دائمة؟" : "Taking regular medications?",
    medicationsDetails: isRTL ? "تفاصيل الأدوية الدائمة" : "Medication details",
    medicationsPlaceholder: isRTL ? "اذكر أسماء الأدوية ومواعيد تناولها..." : "Mention names of medications and schedules...",
    previousSchool: isRTL ? "اسم المدرسة السابقة" : "Previous School",
    previousSchoolPlaceholder: isRTL ? "اسم المدرسة السابقة (إن وجدت)" : "Previous school name (if applicable)",
    lastResultDoc: isRTL ? "مستند النتيجة الأخيرة (صورة أو PDF)" : "Latest Result Document (Image or PDF)",
    nationalIdDoc: isRTL ? "مستند الرقم الوطني (صورة أو PDF)" : "National ID Document (Image or PDF)",
    uploadDocPlaceholder: isRTL ? "انقر لاختيار ملف (صورة أو PDF)" : "Click to select a file (Image or PDF)",
    docUploaded: isRTL ? "تم إرفاق المستند بنجاح" : "Document attached successfully",
    viewDoc: isRTL ? "معاينة" : "Preview",
    removeDoc: isRTL ? "حذف" : "Remove",
    uploading: isRTL ? "جاري الرفع..." : "Uploading..."
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6 max-w-5xl mx-auto pb-16"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Top action header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200/80 pb-5">
        <div className="space-y-1">
          <button 
            onClick={onClose}
            className="group inline-flex items-center gap-2 text-stone-500 hover:text-stone-800 text-sm font-semibold transition-colors mb-1"
          >
            {isRTL ? <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /> : <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />}
            <span>{t.backToList}</span>
          </button>
          <h2 className="font-display text-2xl md:text-3xl font-black text-stone-900 tracking-tight">
            {isEdit ? t.titleEdit : t.titleAdd}
          </h2>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="px-5 h-11 inline-flex items-center justify-center font-semibold rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 transition-all cursor-pointer"
          >
            {isRTL ? "إلغاء" : "Cancel"}
          </button>
          <button 
            onClick={handleSave} 
            disabled={saving || !form.full_name || !form.student_id} 
            className="px-6 h-11 inline-flex items-center justify-center font-semibold rounded-xl bg-primary text-white hover:bg-primary/95 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {saving ? t.saving : isEdit ? t.update : t.save}
          </button>
        </div>
      </div>

      {errorMsg && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-center gap-3 text-rose-700 text-sm font-medium"
        >
          <AlertCircle size={18} className="shrink-0" />
          <span>{errorMsg}</span>
        </motion.div>
      )}

      {/* Main Grid: Left is image upload, Right is details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Avatar Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-stone-200/80 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center">
            <Label className="text-sm font-bold text-stone-800 mb-4 w-full text-start">{t.photoLabel}</Label>
            
            {/* Clickable Image Container */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative w-36 h-36 rounded-full group cursor-pointer overflow-hidden border-4 border-stone-100 shadow-md transition-all hover:scale-102 hover:border-primary/20 bg-stone-50 flex items-center justify-center"
              title={t.photoHint}
            >
              {form.photo_url ? (
                <img 
                  src={form.photo_url} 
                  alt="Student Preview" 
                  className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-stone-400 p-4">
                  <User size={48} className="stroke-[1.2] mb-1" />
                </div>
              )}
              
              {/* Hover Camera Overlay */}
              <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-semibold gap-1.5 duration-200">
                <Camera size={20} />
                <span>{isRTL ? "تحميل صورة" : "Upload"}</span>
              </div>
            </div>

            <input id="field-studentform-input-1" name="input_1" aria-label="input 1" 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />

            <p className="text-xs text-stone-500 mt-3 max-w-[200px] leading-relaxed">
              {t.photoHint}
            </p>

            {form.photo_url && (
              <button 
                onClick={() => update("photo_url", "")}
                className="mt-4 inline-flex items-center gap-1.5 text-xs text-rose-500 hover:text-rose-700 font-bold transition-colors border border-rose-100 hover:bg-rose-50/50 px-3 py-1.5 rounded-lg"
              >
                <Trash2 size={13} />
                <span>{t.removePhoto}</span>
              </button>
            )}

            {/* Default Avatar presets */}
            <div className="w-full border-t border-stone-100 mt-6 pt-5">
              <span className="text-xs font-bold text-stone-500 block text-start mb-3">{t.avatarPresets}</span>
              <div className="flex flex-wrap justify-center gap-2">
                {AVATAR_PRESETS.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => update("photo_url", url)}
                    type="button"
                    className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all hover:scale-110 active:scale-95 ${form.photo_url === url ? 'border-primary ring-2 ring-primary/20 scale-105' : 'border-transparent'}`}
                  >
                    <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick status summary card */}
          <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-stone-100">
              <span className="text-xs font-bold text-stone-500">{t.status}</span>
              <Select value={form.status} onValueChange={v => update("status", v)}>
                <SelectTrigger className="w-[120px] h-8 text-xs font-bold border-stone-200 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="active" className="text-xs font-semibold">{t.statusActive}</SelectItem>
                  <SelectItem value="suspended" className="text-xs font-semibold">{t.statusSuspended}</SelectItem>
                  <SelectItem value="graduated" className="text-xs font-semibold">{t.statusGraduated}</SelectItem>
                  <SelectItem value="transferred" className="text-xs font-semibold">{t.statusTransferred}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-stone-50/80 p-3 rounded-xl border border-stone-100">
                <span className="text-[10px] text-stone-500 block font-bold uppercase">{isRTL ? "معدل الحضور" : "Attendance"}</span>
                <span className="text-lg font-black text-emerald-600 num-en">{student?.attendance_score || "100"}%</span>
              </div>
              <div className="bg-stone-50/80 p-3 rounded-xl border border-stone-100">
                <span className="text-[10px] text-stone-500 block font-bold uppercase">{isRTL ? "إجمالي الغيابات" : "Absences"}</span>
                <span className="text-lg font-black text-rose-500 num-en">{student?.total_absences || "0"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Tabular forms */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card 1: Basic & Academic Information */}
          <div className="bg-white border border-stone-200/80 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
              <GraduationCap className="text-primary stroke-[1.8]" size={20} />
              <h3 className="font-display font-bold text-stone-800 text-base">{t.secBasicInfo}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-stone-700 font-bold text-xs">{t.fullName}</Label>
                <Input 
                  value={form.full_name} 
                  onChange={e => update("full_name", e.target.value)} 
                  className="rounded-xl border-stone-200 h-11 focus-visible:ring-primary/20"
                  placeholder={isRTL ? "الاسم الثلاثي للطالب" : "e.g. Khalid Omar"} 
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-stone-700 font-bold text-xs">{t.studentId}</Label>
                <Input 
                  value={form.student_id} 
                  onChange={e => update("student_id", e.target.value)} 
                  disabled
                  className="rounded-xl border-stone-200 h-11 focus-visible:ring-primary/20 num-en font-mono bg-stone-50/50 disabled:opacity-75"
                  placeholder={isRTL ? "يتم إنشاؤه تلقائياً" : "Auto-generated"} 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-stone-700 font-bold text-xs">{t.grade}</Label>
                <Select value={form.grade} onValueChange={v => update("grade", v)}>
                  <SelectTrigger className="rounded-xl border-stone-200 h-11 focus:ring-primary/20"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {grades.map(g => <SelectItem key={g} value={g} className="font-semibold">{t.gradeItem(g)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-stone-700 font-bold text-xs">{t.section}</Label>
                <Select value={form.section || ""} onValueChange={v => update("section", v)}>
                  <SelectTrigger className="rounded-xl border-stone-200 h-11 focus:ring-primary/20 font-semibold bg-white">
                    <SelectValue placeholder={isRTL ? "اختر الفصل..." : "Select Class..."} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="أبو بكر" className="font-semibold">{isRTL ? "أبو بكر" : "Abu Bakr"}</SelectItem>
                    <SelectItem value="عمر" className="font-semibold">{isRTL ? "عمر" : "Omar"}</SelectItem>
                    <SelectItem value="عثمان" className="font-semibold">{isRTL ? "عثمان" : "Othman"}</SelectItem>
                    <SelectItem value="علي" className="font-semibold">{isRTL ? "علي" : "Ali"}</SelectItem>
                    <SelectItem value="حمزة" className="font-semibold">{isRTL ? "حمزة" : "Hamza"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-stone-700 font-bold text-xs">{t.dob}</Label>
                <DatePicker 
                  value={form.date_of_birth || ""} 
                  onChange={val => update("date_of_birth", val)} 
                  className="rounded-xl border-stone-200 h-11 focus-visible:ring-primary/20 num-en"
                />
              </div>
            </div>

            {/* Previous school */}
            <div className="space-y-1.5">
              <Label className="text-stone-700 font-bold text-xs">{t.previousSchool}</Label>
              <div className="relative">
                <Building2 className={`absolute ${isRTL ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2 text-stone-400`} size={16} />
                <Input 
                  value={form.previous_school || ""} 
                  onChange={e => update("previous_school", e.target.value)} 
                  className={`rounded-xl border-stone-200 h-11 focus-visible:ring-primary/20 ${isRTL ? 'pr-10' : 'pl-10'}`}
                  placeholder={t.previousSchoolPlaceholder} 
                />
              </div>
            </div>

            {/* Documents upload section: Result & National ID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-stone-100">
              {/* Last Result Document */}
              <div className="space-y-1.5">
                <Label className="text-stone-700 font-bold text-xs">{t.lastResultDoc}</Label>
                <input 
                  type="file"
                  ref={lastResultInputRef}
                  accept="image/*,application/pdf"
                  onChange={e => handleDocumentUpload(e.target.files?.[0], "last_result_document_url")}
                  className="hidden"
                />

                {form.last_result_document_url ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200/80">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                        <FileText size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-stone-800 truncate">{t.docUploaded}</p>
                        <p className="text-[10px] text-stone-400 truncate font-mono">
                          {form.last_result_document_url.startsWith("data:") ? (isRTL ? "مستند مرفق (ملف مباشر)" : "Embedded file") : form.last_result_document_url.split("/").pop()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <a 
                        href={form.last_result_document_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-200/60 transition-colors"
                        title={t.viewDoc}
                      >
                        <Eye size={15} />
                      </a>
                      <button 
                        type="button" 
                        onClick={() => update("last_result_document_url", "")}
                        className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                        title={t.removeDoc}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => lastResultInputRef.current?.click()}
                    className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-stone-300 hover:border-primary/50 hover:bg-primary/5 bg-stone-50/50 cursor-pointer transition-all group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-white border border-stone-200/80 flex items-center justify-center text-stone-400 group-hover:text-primary shadow-2xs shrink-0 transition-colors">
                      {uploadingDoc["last_result_document_url"] ? (
                        <Loader2 size={16} className="animate-spin text-primary" />
                      ) : (
                        <Upload size={16} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-stone-700 truncate">
                        {uploadingDoc["last_result_document_url"] ? t.uploading : t.uploadDocPlaceholder}
                      </p>
                      <p className="text-[10px] text-stone-400">
                        {isRTL ? "صورة أو PDF (الحد الأقصى 5MB)" : "Image or PDF (Max 5MB)"}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* National ID Document */}
              <div className="space-y-1.5">
                <Label className="text-stone-700 font-bold text-xs">{t.nationalIdDoc}</Label>
                <input 
                  type="file"
                  ref={nationalIdInputRef}
                  accept="image/*,application/pdf"
                  onChange={e => handleDocumentUpload(e.target.files?.[0], "national_id_document_url")}
                  className="hidden"
                />

                {form.national_id_document_url ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200/80">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                        <FileText size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-stone-800 truncate">{t.docUploaded}</p>
                        <p className="text-[10px] text-stone-400 truncate font-mono">
                          {form.national_id_document_url.startsWith("data:") ? (isRTL ? "مستند مرفق (ملف مباشر)" : "Embedded file") : form.national_id_document_url.split("/").pop()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <a 
                        href={form.national_id_document_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-200/60 transition-colors"
                        title={t.viewDoc}
                      >
                        <Eye size={15} />
                      </a>
                      <button 
                        type="button" 
                        onClick={() => update("national_id_document_url", "")}
                        className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                        title={t.removeDoc}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => nationalIdInputRef.current?.click()}
                    className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-stone-300 hover:border-primary/50 hover:bg-primary/5 bg-stone-50/50 cursor-pointer transition-all group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-white border border-stone-200/80 flex items-center justify-center text-stone-400 group-hover:text-primary shadow-2xs shrink-0 transition-colors">
                      {uploadingDoc["national_id_document_url"] ? (
                        <Loader2 size={16} className="animate-spin text-primary" />
                      ) : (
                        <Upload size={16} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-stone-700 truncate">
                        {uploadingDoc["national_id_document_url"] ? t.uploading : t.uploadDocPlaceholder}
                      </p>
                      <p className="text-[10px] text-stone-400">
                        {isRTL ? "صورة أو PDF (الحد الأقصى 5MB)" : "Image or PDF (Max 5MB)"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Portal Accounts */}
          <div className="bg-white border border-stone-200/80 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
              <Lock className="text-primary stroke-[1.8]" size={20} />
              <h3 className="font-display font-bold text-stone-800 text-base">{t.secPortals}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Student Portal */}
              <div className="space-y-3 p-4 rounded-xl bg-stone-50/50 border border-stone-100">
                <span className="text-xs font-bold text-stone-700 block pb-1 border-b border-stone-100">{isRTL ? "بوابة الطالب الإلكترونية" : "Student Portal"}</span>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label className="text-stone-600 font-semibold text-[11px]">{t.studentEmail}</Label>
                    <div className="relative">
                      <Mail className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-stone-400`} size={14} />
                      <Input 
                        value={form.user_email || ""} 
                        onChange={e => update("user_email", e.target.value)} 
                        className={`rounded-lg border-stone-200 h-9 text-xs focus-visible:ring-primary/20 num-en ${isRTL ? 'pr-9' : 'pl-9'}`}
                        placeholder="student@school.edu" 
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-stone-600 font-semibold text-[11px]">{t.studentPassword}</Label>
                    <Input 
                      type="password"
                      value={form.portal_password || ""} 
                      onChange={e => update("portal_password", e.target.value)} 
                      className="rounded-lg border-stone-200 h-9 text-xs focus-visible:ring-primary/20"
                      placeholder={isEdit ? t.passwordPlaceholder : "••••••••"} 
                    />
                  </div>
                </div>
              </div>

              {/* Parent Portal */}
              <div className="space-y-3 p-4 rounded-xl bg-stone-50/50 border border-stone-100">
                <span className="text-xs font-bold text-stone-700 block pb-1 border-b border-stone-100">{isRTL ? "بوابة ولي الأمر الإلكترونية" : "Parent Portal"}</span>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label className="text-stone-600 font-semibold text-[11px]">{t.parentEmail}</Label>
                    <div className="relative">
                      <Mail className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-stone-400`} size={14} />
                      <Input 
                        value={form.parent_email || ""} 
                        onChange={e => update("parent_email", e.target.value)} 
                        className={`rounded-lg border-stone-200 h-9 text-xs focus-visible:ring-primary/20 num-en ${isRTL ? 'pr-9' : 'pl-9'}`}
                        placeholder="parent@example.com" 
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-stone-600 font-semibold text-[11px]">{t.parentPassword}</Label>
                    <Input 
                      type="password"
                      value={form.parent_password || ""} 
                      onChange={e => update("parent_password", e.target.value)} 
                      className="rounded-lg border-stone-200 h-9 text-xs focus-visible:ring-primary/20"
                      placeholder={isEdit ? t.passwordPlaceholder : "••••••••"} 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Contact & Parents & Extra Services */}
          <div className="bg-white border border-stone-200/80 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
              <User className="text-primary stroke-[1.8]" size={20} />
              <h3 className="font-display font-bold text-stone-800 text-base">{t.secParent}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-stone-700 font-bold text-xs">{t.parentName}</Label>
                <div className="relative">
                  <User className={`absolute ${isRTL ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2 text-stone-400`} size={16} />
                  <Input 
                    value={form.parent_name || ""} 
                    onChange={e => update("parent_name", e.target.value)} 
                    className={`rounded-xl border-stone-200 h-11 focus-visible:ring-primary/20 ${isRTL ? 'pr-10' : 'pl-10'}`}
                    placeholder={isRTL ? "اسم ولي الأمر الثلاثي" : "e.g. Omar Khalid"} 
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-stone-700 font-bold text-xs">{t.parentPhone}</Label>
                <div className="relative">
                  <Phone className={`absolute ${isRTL ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2 text-stone-400`} size={16} />
                  <Input 
                    value={form.parent_phone || ""} 
                    onChange={e => update("parent_phone", e.target.value)} 
                    className={`rounded-xl border-stone-200 h-11 focus-visible:ring-primary/20 num-en ${isRTL ? 'pr-10' : 'pl-10'}`}
placeholder="رقم الهاتف مع مفتاح الدولة" 
                   />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-stone-700 font-bold text-xs">{t.address}</Label>
              <div className="relative">
                <MapPin className={`absolute ${isRTL ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2 text-stone-400`} size={16} />
                <Input 
                  value={form.address || ""} 
                  onChange={e => update("address", e.target.value)} 
                  className={`rounded-xl border-stone-200 h-11 focus-visible:ring-primary/20 ${isRTL ? 'pr-10' : 'pl-10'}`}
                  placeholder={isRTL ? "الشارع، المنطقة، المدينة" : "e.g. Sheikh Zayed Road, Dubai"} 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-stone-700 font-bold text-xs">{t.cardBalance}</Label>
                <div className="relative">
                  <CreditCard className={`absolute ${isRTL ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2 text-stone-400`} size={16} />
                  <Input 
                    type="number" 
                    value={form.card_balance || 0} 
                    onChange={e => update("card_balance", parseFloat(e.target.value) || 0)} 
                    className={`rounded-xl border-stone-200 h-11 focus-visible:ring-primary/20 num-en ${isRTL ? 'pr-10' : 'pl-10'}`}
                  />
                </div>
              </div>

              <div className="space-y-1.5 flex flex-col justify-end">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 border border-stone-150 h-11">
                  <Switch 
                    checked={form.bus_registered || false} 
                    onCheckedChange={v => update("bus_registered", v)} 
                    className="data-[state=checked]:bg-primary"
                  />
                  <div className="flex items-center gap-1.5">
                    <Bus size={15} className="text-stone-500" />
                    <Label className="text-stone-700 font-bold text-xs cursor-pointer">{t.busRegistered}</Label>
                  </div>
                </div>
              </div>
            </div>

            {form.bus_registered && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-1.5"
              >
                <Label className="text-stone-700 font-bold text-xs">{isRTL ? "مسار الحافلة وتفاصيل التوصيل" : "Bus Route & Details"}</Label>
                <Input 
                  placeholder={t.busRoutePlaceholder} 
                  value={form.bus_route || ""} 
                  onChange={e => update("bus_route", e.target.value)} 
                  className="rounded-xl border-stone-200 h-11 focus-visible:ring-primary/20"
                />
              </motion.div>
            )}
          </div>

          {/* Card 4: Tuition Fees & Financial Card */}
          <div className="bg-white border border-stone-200/80 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
              <DollarSign className="text-primary stroke-[1.8]" size={20} />
              <h3 className="font-display font-bold text-stone-800 text-base">{t.secTuition}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-stone-700 font-bold text-xs">{t.tuitionTotal}</Label>
                <div className="relative">
                  <Wallet className={`absolute ${isRTL ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2 text-stone-400`} size={16} />
                  <Input 
                    type="number" 
                    value={form.tuition_total || 0} 
                    onChange={e => update("tuition_total", parseFloat(e.target.value) || 0)} 
                    className={`rounded-xl border-stone-200 h-11 focus-visible:ring-primary/20 num-en ${isRTL ? 'pr-10' : 'pl-10'}`}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-stone-700 font-bold text-xs">{t.tuitionPaid}</Label>
                <div className="relative">
                  <CheckCircle className={`absolute ${isRTL ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2 text-emerald-500`} size={16} />
                  <Input 
                    type="number" 
                    value={form.tuition_paid || 0} 
                    onChange={e => update("tuition_paid", parseFloat(e.target.value) || 0)} 
                    className={`rounded-xl border-stone-200 h-11 focus-visible:ring-primary/20 num-en ${isRTL ? 'pr-10' : 'pl-10'}`}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-stone-700 font-bold text-xs">{t.tuitionRemaining}</Label>
                <div className="relative">
                  <DollarSign className={`absolute ${isRTL ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2 text-amber-500`} size={16} />
                  <Input 
                    type="number" 
                    value={Math.max(0, (parseFloat(form.tuition_total) || 0) - (parseFloat(form.tuition_paid) || 0))} 
                    readOnly 
                    disabled
                    className={`rounded-xl border-stone-200 h-11 bg-amber-50/50 font-bold num-en ${isRTL ? 'pr-10' : 'pl-10'}`}
                  />
                </div>
                <p className="text-[10px] text-stone-400 font-semibold">{t.tuitionRemainingHint}</p>
              </div>
            </div>
          </div>

          {/* Card 5: Medical Condition Card */}
          <div className="bg-white border border-stone-200/80 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
              <HeartPulse className="text-primary stroke-[1.8]" size={20} />
              <h3 className="font-display font-bold text-stone-800 text-base">{t.secMedical}</h3>
            </div>

            <div className="space-y-4">
              {/* Chronic conditions toggle */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 border border-stone-150 h-11">
                  <Switch 
                    id="switch-chronic-conditions"
                    checked={form.has_chronic_conditions || false} 
                    onCheckedChange={v => update("has_chronic_conditions", v)} 
                    className="data-[state=checked]:bg-primary"
                  />
                  <div className="flex items-center gap-1.5">
                    <HeartPulse size={15} className="text-stone-500" />
                    <Label htmlFor="switch-chronic-conditions" className="text-stone-700 font-bold text-xs cursor-pointer">
                      {t.chronicConditions}
                    </Label>
                  </div>
                </div>

                {form.has_chronic_conditions && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-1.5"
                  >
                    <Label className="text-stone-700 font-bold text-xs">{t.chronicConditionsDetails}</Label>
                    <div className="relative">
                      <HeartPulse className={`absolute ${isRTL ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2 text-stone-400`} size={16} />
                      <Input 
                        placeholder={t.chronicConditionsPlaceholder} 
                        value={form.chronic_conditions_details || ""} 
                        onChange={e => update("chronic_conditions_details", e.target.value)} 
                        className={`rounded-xl border-stone-200 h-11 focus-visible:ring-primary/20 ${isRTL ? 'pr-10' : 'pl-10'}`}
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Surgeries toggle */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 border border-stone-150 h-11">
                  <Switch 
                    id="switch-surgeries"
                    checked={form.has_surgeries || false} 
                    onCheckedChange={v => update("has_surgeries", v)} 
                    className="data-[state=checked]:bg-primary"
                  />
                  <div className="flex items-center gap-1.5">
                    <Activity size={15} className="text-stone-500" />
                    <Label htmlFor="switch-surgeries" className="text-stone-700 font-bold text-xs cursor-pointer">
                      {t.surgeries}
                    </Label>
                  </div>
                </div>

                {form.has_surgeries && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-1.5"
                  >
                    <Label className="text-stone-700 font-bold text-xs">{t.surgeriesDetails}</Label>
                    <div className="relative">
                      <Activity className={`absolute ${isRTL ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2 text-stone-400`} size={16} />
                      <Input 
                        placeholder={t.surgeriesPlaceholder} 
                        value={form.surgery_details || ""} 
                        onChange={e => update("surgery_details", e.target.value)} 
                        className={`rounded-xl border-stone-200 h-11 focus-visible:ring-primary/20 ${isRTL ? 'pr-10' : 'pl-10'}`}
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Regular medications toggle */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 border border-stone-150 h-11">
                  <Switch 
                    id="switch-regular-medications"
                    checked={form.has_regular_medications || false} 
                    onCheckedChange={v => update("has_regular_medications", v)} 
                    className="data-[state=checked]:bg-primary"
                  />
                  <div className="flex items-center gap-1.5">
                    <Pill size={15} className="text-stone-500" />
                    <Label htmlFor="switch-regular-medications" className="text-stone-700 font-bold text-xs cursor-pointer">
                      {t.regularMedications}
                    </Label>
                  </div>
                </div>

                {form.has_regular_medications && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-1.5"
                  >
                    <Label className="text-stone-700 font-bold text-xs">{t.medicationsDetails}</Label>
                    <div className="relative">
                      <Pill className={`absolute ${isRTL ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2 text-stone-400`} size={16} />
                      <Input 
                        placeholder={t.medicationsPlaceholder} 
                        value={form.medication_details || ""} 
                        onChange={e => update("medication_details", e.target.value)} 
                        className={`rounded-xl border-stone-200 h-11 focus-visible:ring-primary/20 ${isRTL ? 'pr-10' : 'pl-10'}`}
                      />
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Footer Actions inside the form container */}
          <div className="flex justify-end gap-3 pt-2">
            <button 
              type="button"
              onClick={onClose}
              className="px-6 h-12 inline-flex items-center justify-center font-semibold rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 transition-all cursor-pointer"
            >
              {isRTL ? "رجوع للقائمة" : "Cancel"}
            </button>
            <button 
              type="button"
              onClick={handleSave} 
              disabled={saving || !form.full_name || !form.student_id} 
              className="px-8 h-12 inline-flex items-center justify-center font-semibold rounded-xl bg-primary text-white hover:bg-primary/95 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {saving ? t.saving : isEdit ? t.update : t.save}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
