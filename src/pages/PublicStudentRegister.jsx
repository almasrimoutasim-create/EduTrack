import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useLanguage } from "@/lib/LanguageContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { 
  UserPlus, 
  CheckCircle, 
  MapPin, 
  Mail, 
  Phone, 
  User, 
  Building2, 
  GraduationCap, 
  Loader2, 
  FileText, 
  Upload, 
  Eye, 
  Trash2, 
  HeartPulse, 
  Activity, 
  Pill,
  Calendar
} from "lucide-react";

const GRADE_OPTIONS = [
  { id: "level1", name: "المستوى الأول", nameEn: "Level 1" },
  { id: "level2", name: "المستوى الثاني", nameEn: "Level 2" },
  { id: "1", name: "الصف الأول", nameEn: "Grade 1" },
  { id: "2", name: "الصف الثاني", nameEn: "Grade 2" },
  { id: "3", name: "الصف الثالث", nameEn: "Grade 3" },
  { id: "4", name: "الصف الرابع", nameEn: "Grade 4" },
  { id: "5", name: "الصف الخامس", nameEn: "Grade 5" },
  { id: "6", name: "الصف السادس", nameEn: "Grade 6" },
  { id: "7", name: "الصف السابع", nameEn: "Grade 7" },
  { id: "8", name: "الصف الثامن", nameEn: "Grade 8" },
  { id: "9", name: "الصف التاسع", nameEn: "Grade 9" },
  { id: "10", name: "الصف العاشر", nameEn: "Grade 10" },
  { id: "11", name: "الصف الحادي عشر", nameEn: "Grade 11" },
  { id: "12", name: "الصف الثاني عشر", nameEn: "Grade 12" },
];

const CLASS_SECTIONS = [
  { id: "sudanese", name: "المنهج السوداني", nameEn: "Sudanese Curriculum" },
  { id: "british", name: "المنهج البريطاني", nameEn: "British Curriculum" },
];

export default function PublicStudentRegister() {
  const { slug } = useParams();
  const { language } = useLanguage();
  const isRTL = language === "ar";

  const [school, setSchool] = useState(null);
  const [schoolLoading, setSchoolLoading] = useState(true);
  const [schoolError, setSchoolError] = useState(null);

  const lastResultInputRef = useRef(null);
  const nationalIdInputRef = useRef(null);

  const [uploadingDoc, setUploadingDoc] = useState({});
  const [form, setForm] = useState({
    full_name: "",
    grade: "",
    section: "",
    date_of_birth: "",
    previous_school: "",
    last_result_document_url: "",
    national_id_document_url: "",
    parent_name: "",
    parent_phone: "",
    phone: "",
    parent_email: "",
    address: "",
    city: "",
    notes: "",
    has_chronic_conditions: false,
    chronic_conditions_details: "",
    has_surgeries: false,
    surgery_details: "",
    has_regular_medications: false,
    medication_details: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  const apiBase = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");

  useEffect(() => {
    const fetchSchool = async () => {
      try {
        const url = apiBase ? `${apiBase}/neon-db/public-school/${slug}` : `/neon-db/public-school/${slug}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.success && data.school) {
          setSchool(data.school);
        } else {
          setSchoolError(data.error || "School not found");
        }
      } catch {
        setSchoolError(isRTL ? "تعذر الاتصال بالخادم" : "Could not connect to server");
      } finally {
        setSchoolLoading(false);
      }
    };
    if (slug) fetchSchool();
  }, [slug, isRTL]);

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleDocumentUpload = (file, fieldKey) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error(isRTL ? "حجم الملف كبير جداً (الحد الأقصى 5MB)" : "File is too large (max 5MB)");
      return;
    }

    setUploadingDoc(prev => ({ ...prev, [fieldKey]: true }));

    const reader = new FileReader();
    reader.onload = async (event) => {
      const fullDataUri = event.target.result;
      let finalUrl = fullDataUri;

      try {
        const base64Data = typeof fullDataUri === "string" ? fullDataUri.split(",")[1] : null;
        if (base64Data) {
          const url = apiBase ? `${apiBase}/neon-db/upload` : "/neon-db/upload";
          const res = await fetch(url, {
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
        console.warn("Upload endpoint failed, falling back to data URI:", err);
      }

      update(fieldKey, finalUrl);
      setUploadingDoc(prev => ({ ...prev, [fieldKey]: false }));
      toast.success(isRTL ? "تم إرفاق المستند بنجاح" : "Document attached successfully");
    };

    reader.onerror = () => {
      toast.error(isRTL ? "فشل قراءة الملف" : "Failed to read file");
      setUploadingDoc(prev => ({ ...prev, [fieldKey]: false }));
    };

    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim()) {
      toast.error(isRTL ? "يرجى إدخال اسم الطالب الكامل" : "Please enter student full name");
      return;
    }
    if (!form.parent_name.trim()) {
      toast.error(isRTL ? "يرجى إدخال اسم ولي الأمر" : "Please enter parent name");
      return;
    }
    if (!form.parent_phone.trim()) {
      toast.error(isRTL ? "يرجى إدخال رقم هاتف ولي الأمر" : "Please enter parent phone");
      return;
    }
    if (!form.grade) {
      toast.error(isRTL ? "يرجى اختيار الصف الدراسي" : "Please select grade level");
      return;
    }

    setLoading(true);
    try {
      const url = apiBase ? `${apiBase}/neon-db/public-register/student/${slug}` : `/neon-db/public-register/student/${slug}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSuccess(data);
      toast.success(isRTL ? "تم التسجيل بنجاح" : "Registration successful");
    } catch (err) {
      toast.error(err.message || (isRTL ? "فشل التسجيل" : "Registration failed"));
    } finally {
      setLoading(false);
    }
  };

  if (schoolLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFCF8]" dir={isRTL ? "rtl" : "ltr"}>
        <Loader2 className="animate-spin text-emerald-600" size={36} />
      </div>
    );
  }

  if (schoolError || !school) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#FDFCF8]" dir={isRTL ? "rtl" : "ltr"}>
        <Card className="p-8 text-center rounded-[32px] border border-stone-200/80 shadow-xl bg-white max-w-md w-full">
          <div className="h-16 w-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <Building2 size={32} />
          </div>
          <h2 className="text-xl font-black text-stone-900 mb-2">{isRTL ? "المدرسة غير موجودة" : "School Not Found"}</h2>
          <p className="text-sm text-stone-500">{schoolError || (isRTL ? "هذا الرابط غير صالح" : "This link is invalid")}</p>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#FDFCF8]" dir={isRTL ? "rtl" : "ltr"}>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md">
          <Card className="p-8 text-center rounded-[32px] border border-stone-200/80 shadow-xl bg-white">
            <div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} />
            </div>
            <h2 className="text-xl font-black text-stone-900 mb-2">{isRTL ? "تم التسجيل بنجاح!" : "Registration Successful!"}</h2>
            <p className="text-sm text-stone-500 leading-relaxed mb-4">
              {isRTL ? `تم تسجيل الطالب في ${success.school_name}` : `Student registered at ${success.school_name}`}
            </p>
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mb-4 text-start text-sm space-y-1.5">
              <p className="font-bold text-emerald-900 mb-2">{isRTL ? "بيانات الدخول للبوابة:" : "Login Credentials:"}</p>
              <p className="text-stone-700 flex justify-between">
                <span>{isRTL ? "الرقم المدرسي:" : "Student ID:"}</span>
                <span className="font-mono font-bold text-stone-900">{success.student_id}</span>
              </p>
              <p className="text-stone-700 flex justify-between">
                <span>{isRTL ? "كلمة المرور:" : "Password:"}</span>
                <span className="font-mono font-bold text-stone-900">{success.portal_password}</span>
              </p>
            </div>
            <p className="text-xs text-stone-400">{isRTL ? "يرجى حفظ هذه البيانات لاستخدامها عند تسجيل الدخول" : "Please keep these credentials for logging in"}</p>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4 bg-[#FDFCF8]" dir={isRTL ? "rtl" : "ltr"}>
      <motion.div initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-2xl mx-auto">
        <Card className="p-6 md:p-8 rounded-[28px] border border-stone-200/80 shadow-xl bg-white space-y-6">
          
          {/* Header — الشعار + العناوين الثلاثة في الوسط أسفل الشعار مباشرة */}
           <div className="flex flex-col items-center justify-center text-center pb-5 border-b border-stone-100 gap-2.5">
             {school.logo_url && (
               <img src={school.logo_url} alt={school.name_ar || school.name} className="h-20 md:h-24 max-w-[220px] object-contain mx-auto" />
             )}
             <div className="inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mx-auto">
               <UserPlus size={15} />
               <span>{isRTL ? "استمارة تسجيل طالب جديد" : "New Student Registration Form"}</span>
             </div>
             <h1 className="text-2xl font-black text-stone-900 text-center w-full leading-tight">{school.name_ar || school.name}</h1>
             <p className="text-xs text-stone-500 text-center leading-relaxed">
               {isRTL ? "يرجى ملء الاستمارة التالية بدقة لتسجيل الطالب بالمدرسة" : "Please fill in the form below accurately to register the student"}
             </p>
           </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* 1. البيانات الأساسية والتعليمية */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-stone-100 text-stone-800">
                <GraduationCap className="text-primary stroke-[2]" size={18} />
                <h3 className="font-bold text-sm">{isRTL ? "البيانات الأساسية والتعليمية" : "Basic & Academic Information"}</h3>
              </div>

              {/* الاسم الكامل */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-stone-700">{isRTL ? "الاسم الكامل *" : "Full Name *"}</Label>
                <div className="relative">
                  <User size={15} className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-3.5' : 'left-3.5'} text-stone-400`} />
                  <Input 
                    value={form.full_name} 
                    onChange={e => update("full_name", e.target.value)} 
                    className={`rounded-xl border-stone-200 h-11 focus-visible:ring-primary/20 ${isRTL ? 'pr-10' : 'pl-10'}`} 
                    placeholder={isRTL ? "الإسم الرباعي للطالب" : "Student full name"} 
                    required
                  />
                </div>
              </div>

              {/* الصف الدراسي + الفصل */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-stone-700">{isRTL ? "الصف الدراسي *" : "Grade Level *"}</Label>
                  <div className="relative">
                    <GraduationCap size={15} className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-3.5' : 'left-3.5'} text-stone-400 pointer-events-none`} />
                    <select 
                      value={form.grade} 
                      onChange={e => update("grade", e.target.value)} 
                      className={`w-full ${isRTL ? 'pr-10 pl-3' : 'pl-10 pr-3'} h-11 rounded-xl border border-stone-200 text-sm font-medium focus:ring-2 focus:ring-primary/20 bg-white outline-none`}
                      required
                    >
                      <option value="">{isRTL ? "اختر الصف الدراسي..." : "Select Grade Level..."}</option>
                      {GRADE_OPTIONS.map(g => (
                        <option key={g.id} value={g.id}>
                          {isRTL ? g.name : g.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-stone-700">{isRTL ? "القسم" : "Class / Section"}</Label>
                  <div className="relative">
                    <Building2 size={15} className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-3.5' : 'left-3.5'} text-stone-400 pointer-events-none`} />
                    <select 
                      value={form.section} 
                      onChange={e => update("section", e.target.value)} 
                      className={`w-full ${isRTL ? 'pr-10 pl-3' : 'pl-10 pr-3'} h-11 rounded-xl border border-stone-200 text-sm font-medium focus:ring-2 focus:ring-primary/20 bg-white outline-none`}
                    >
                      <option value="">{isRTL ? "اختر القسم (اختياري)..." : "Select Section (optional)..."}</option>
                      {CLASS_SECTIONS.map(s => (
                        <option key={s.id} value={s.id}>
                          {isRTL ? s.name : s.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* تاريخ الميلاد + المدرسة السابقة */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-stone-700">{isRTL ? "تاريخ الميلاد" : "Date of Birth"}</Label>
                  <DatePicker 
                    value={form.date_of_birth} 
                    onChange={val => update("date_of_birth", val)} 
                    placeholder="mm/dd/yyyy"
                    className="rounded-xl border-stone-200 h-11 focus-visible:ring-primary/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-stone-700">{isRTL ? "اسم المدرسة السابقة" : "Previous School"}</Label>
                  <div className="relative">
                    <Building2 size={15} className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-3.5' : 'left-3.5'} text-stone-400`} />
                    <Input 
                      value={form.previous_school} 
                      onChange={e => update("previous_school", e.target.value)} 
                      className={`rounded-xl border-stone-200 h-11 focus-visible:ring-primary/20 ${isRTL ? 'pr-10' : 'pl-10'}`} 
                      placeholder={isRTL ? "اسم المدرسة السابقة (إن وجدت)" : "Previous school name (if applicable)"} 
                    />
                  </div>
                </div>
              </div>

              {/* وثائق ومستندات: مستند النتيجة الأخيرة ومستند الرقم الوطني */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* مستند النتيجة الأخيرة */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-stone-700">{isRTL ? "مستند النتيجة الأخيرة (صورة أو PDF)" : "Latest Result Document (Image or PDF)"}</Label>
                  <input 
                    type="file" 
                    ref={lastResultInputRef} 
                    accept="image/*,application/pdf" 
                    onChange={e => handleDocumentUpload(e.target.files?.[0], "last_result_document_url")} 
                    className="hidden" 
                  />

                  {form.last_result_document_url ? (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                          <FileText size={15} />
                        </div>
                        <p className="text-xs font-bold text-stone-800 truncate">{isRTL ? "تم إرفاق النتيجة الأخيرة" : "Result Document attached"}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <a href={form.last_result_document_url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-200/50 rounded-lg transition-colors">
                          <Eye size={15} />
                        </a>
                        <button type="button" onClick={() => update("last_result_document_url", "")} className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      onClick={() => lastResultInputRef.current?.click()}
                      className="flex items-center gap-2.5 p-3 rounded-xl border border-dashed border-stone-300 hover:border-primary/50 hover:bg-primary/5 bg-stone-50/50 cursor-pointer transition-all"
                    >
                      <div className="w-8 h-8 rounded-lg bg-white border border-stone-200 flex items-center justify-center text-stone-400 shrink-0 shadow-2xs">
                        {uploadingDoc["last_result_document_url"] ? <Loader2 size={15} className="animate-spin text-primary" /> : <Upload size={15} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-stone-700 truncate">{isRTL ? "انقر لاختيار ملف (صورة أو PDF)" : "Click to select file (Image or PDF)"}</p>
                        <p className="text-[10px] text-stone-400">{isRTL ? "صورة أو PDF (الحد الأقصى 5MB)" : "Image or PDF (Max 5MB)"}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* مستند الرقم الوطني */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-stone-700">{isRTL ? "مستند الرقم الوطني (صورة أو PDF)" : "National ID Document (Image or PDF)"}</Label>
                  <input 
                    type="file" 
                    ref={nationalIdInputRef} 
                    accept="image/*,application/pdf" 
                    onChange={e => handleDocumentUpload(e.target.files?.[0], "national_id_document_url")} 
                    className="hidden" 
                  />

                  {form.national_id_document_url ? (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                          <FileText size={15} />
                        </div>
                        <p className="text-xs font-bold text-stone-800 truncate">{isRTL ? "تم إرفاق الرقم الوطني" : "National ID attached"}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <a href={form.national_id_document_url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-200/50 rounded-lg transition-colors">
                          <Eye size={15} />
                        </a>
                        <button type="button" onClick={() => update("national_id_document_url", "")} className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      onClick={() => nationalIdInputRef.current?.click()}
                      className="flex items-center gap-2.5 p-3 rounded-xl border border-dashed border-stone-300 hover:border-primary/50 hover:bg-primary/5 bg-stone-50/50 cursor-pointer transition-all"
                    >
                      <div className="w-8 h-8 rounded-lg bg-white border border-stone-200 flex items-center justify-center text-stone-400 shrink-0 shadow-2xs">
                        {uploadingDoc["national_id_document_url"] ? <Loader2 size={15} className="animate-spin text-primary" /> : <Upload size={15} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-stone-700 truncate">{isRTL ? "انقر لاختيار ملف (صورة أو PDF)" : "Click to select file (Image or PDF)"}</p>
                        <p className="text-[10px] text-stone-400">{isRTL ? "صورة أو PDF (الحد الأقصى 5MB)" : "Image or PDF (Max 5MB)"}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 2. معلومات ولي الأمر والاتصال */}
            <div className="space-y-4 pt-3 border-t border-stone-100">
              <div className="flex items-center gap-2 pb-2 border-b border-stone-100 text-stone-800">
                <User className="text-primary stroke-[2]" size={18} />
                <h3 className="font-bold text-sm">{isRTL ? "معلومات ولي الأمر والاتصال" : "Parent Details & Contact"}</h3>
              </div>

              {/* اسم ولي الأمر + رقم هاتف ولي الأمر */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-stone-700">{isRTL ? "اسم ولي الأمر *" : "Parent Name *"}</Label>
                  <div className="relative">
                    <User size={15} className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-3.5' : 'left-3.5'} text-stone-400`} />
                    <Input 
                      value={form.parent_name} 
                      onChange={e => update("parent_name", e.target.value)} 
                      className={`rounded-xl border-stone-200 h-11 focus-visible:ring-primary/20 ${isRTL ? 'pr-10' : 'pl-10'}`} 
                      placeholder={isRTL ? "اسم ولي الأمر الثلاثي" : "Parent full name"} 
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-stone-700">{isRTL ? "رقم هاتف ولي الأمر *" : "Parent Phone *"}</Label>
                  <div className="relative">
                    <Phone size={15} className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-3.5' : 'left-3.5'} text-stone-400`} />
                    <Input 
                      value={form.parent_phone} 
                      onChange={e => update("parent_phone", e.target.value)} 
                      className={`rounded-xl border-stone-200 h-11 focus-visible:ring-primary/20 num-en ${isRTL ? 'pr-10' : 'pl-10'}`} 
placeholder="رقم الهاتف مع مفتاح الدولة" 
                       required
                    />
                  </div>
                </div>
              </div>

              {/* العنوان السكني */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-stone-700">{isRTL ? "العنوان السكني" : "Residential Address"}</Label>
                <div className="relative">
                  <MapPin size={15} className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-3.5' : 'left-3.5'} text-stone-400`} />
                  <Input 
                    value={form.address} 
                    onChange={e => update("address", e.target.value)} 
                    className={`rounded-xl border-stone-200 h-11 focus-visible:ring-primary/20 ${isRTL ? 'pr-10' : 'pl-10'}`} 
                    placeholder={isRTL ? "الشارع، المنطقة، المدينة" : "Street, Area, City"} 
                  />
                </div>
              </div>

              {/* هاتف الطالب والبريد الإلكتروني (اختياري) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-stone-700">{isRTL ? "رقم هاتف الطالب (اختياري)" : "Student Phone (optional)"}</Label>
                  <div className="relative">
                    <Phone size={15} className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-3.5' : 'left-3.5'} text-stone-400`} />
                    <Input 
                      value={form.phone} 
                      onChange={e => update("phone", e.target.value)} 
                      className={`rounded-xl border-stone-200 h-11 focus-visible:ring-primary/20 num-en ${isRTL ? 'pr-10' : 'pl-10'}`} 
                      placeholder="رقم الهاتف مع مفتاح الدولة" 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-stone-700">{isRTL ? "البريد الإلكتروني (اختياري)" : "Email (optional)"}</Label>
                  <div className="relative">
                    <Mail size={15} className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-3.5' : 'left-3.5'} text-stone-400`} />
                    <Input 
                      type="email"
                      value={form.parent_email} 
                      onChange={e => update("parent_email", e.target.value)} 
                      className={`rounded-xl border-stone-200 h-11 focus-visible:ring-primary/20 ${isRTL ? 'pr-10' : 'pl-10'}`} 
                      placeholder="parent@example.com" 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. الحالة الطبية */}
            <div className="space-y-4 pt-3 border-t border-stone-100">
              <div className="flex items-center gap-2 pb-2 border-b border-stone-100 text-stone-800">
                <HeartPulse className="text-primary stroke-[2]" size={18} />
                <h3 className="font-bold text-sm">{isRTL ? "الحالة الطبية" : "Medical Condition"}</h3>
              </div>

              {/* هل يوجد حالات مرضية متكررة؟ */}
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 border border-stone-150 h-11">
                  <Switch 
                    id="public-switch-chronic"
                    checked={form.has_chronic_conditions} 
                    onCheckedChange={v => update("has_chronic_conditions", v)} 
                    className="data-[state=checked]:bg-primary"
                  />
                  <div className="flex items-center gap-1.5">
                    <HeartPulse size={15} className="text-stone-500" />
                    <Label htmlFor="public-switch-chronic" className="text-stone-700 font-bold text-xs cursor-pointer">
                      {isRTL ? "هل يوجد حالات مرضية متكررة؟" : "Are there chronic conditions?"}
                    </Label>
                  </div>
                </div>

                {form.has_chronic_conditions && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-1.5 pt-1">
                    <Label className="text-xs font-bold text-stone-700">{isRTL ? "تفاصيل الحالات المرضية" : "Chronic Conditions Details"}</Label>
                    <div className="relative">
                      <HeartPulse size={15} className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-3.5' : 'left-3.5'} text-stone-400`} />
                      <Input 
                        value={form.chronic_conditions_details} 
                        onChange={e => update("chronic_conditions_details", e.target.value)} 
                        className={`rounded-xl border-stone-200 h-11 focus-visible:ring-primary/20 ${isRTL ? 'pr-10' : 'pl-10'}`} 
                        placeholder={isRTL ? "اذكر تفاصيل الحالة المرضية المزمنة..." : "Mention details of chronic condition..."} 
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* هل أجريت عملية جراحية؟ */}
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 border border-stone-150 h-11">
                  <Switch 
                    id="public-switch-surgeries"
                    checked={form.has_surgeries} 
                    onCheckedChange={v => update("has_surgeries", v)} 
                    className="data-[state=checked]:bg-primary"
                  />
                  <div className="flex items-center gap-1.5">
                    <Activity size={15} className="text-stone-500" />
                    <Label htmlFor="public-switch-surgeries" className="text-stone-700 font-bold text-xs cursor-pointer">
                      {isRTL ? "هل أجريت عملية جراحية؟" : "Has undergone surgery?"}
                    </Label>
                  </div>
                </div>

                {form.has_surgeries && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-1.5 pt-1">
                    <Label className="text-xs font-bold text-stone-700">{isRTL ? "تفاصيل العمليات الجراحية" : "Surgery Details"}</Label>
                    <div className="relative">
                      <Activity size={15} className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-3.5' : 'left-3.5'} text-stone-400`} />
                      <Input 
                        value={form.surgery_details} 
                        onChange={e => update("surgery_details", e.target.value)} 
                        className={`rounded-xl border-stone-200 h-11 focus-visible:ring-primary/20 ${isRTL ? 'pr-10' : 'pl-10'}`} 
                        placeholder={isRTL ? "اذكر تفاصيل العمليات الجراحية السابقة..." : "Mention details of past surgeries..."} 
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* هل يتم تناول أدوية دائمة؟ */}
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 border border-stone-150 h-11">
                  <Switch 
                    id="public-switch-meds"
                    checked={form.has_regular_medications} 
                    onCheckedChange={v => update("has_regular_medications", v)} 
                    className="data-[state=checked]:bg-primary"
                  />
                  <div className="flex items-center gap-1.5">
                    <Pill size={15} className="text-stone-500" />
                    <Label htmlFor="public-switch-meds" className="text-stone-700 font-bold text-xs cursor-pointer">
                      {isRTL ? "هل يتم تناول أدوية دائمة؟" : "Taking regular medications?"}
                    </Label>
                  </div>
                </div>

                {form.has_regular_medications && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-1.5 pt-1">
                    <Label className="text-xs font-bold text-stone-700">{isRTL ? "تفاصيل الأدوية الدائمة" : "Medication Details"}</Label>
                    <div className="relative">
                      <Pill size={15} className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-3.5' : 'left-3.5'} text-stone-400`} />
                      <Input 
                        value={form.medication_details} 
                        onChange={e => update("medication_details", e.target.value)} 
                        className={`rounded-xl border-stone-200 h-11 focus-visible:ring-primary/20 ${isRTL ? 'pr-10' : 'pl-10'}`} 
                        placeholder={isRTL ? "اذكر أسماء الأدوية ومواعيد تناولها..." : "Mention names of medications and schedules..."} 
                      />
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* زر الإرسال */}
            <div className="pt-2">
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full h-12 rounded-xl font-bold text-sm bg-primary text-white hover:bg-primary/95 transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
                <span>{isRTL ? "تسجيل الطالب" : "Register Student"}</span>
              </button>
            </div>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
