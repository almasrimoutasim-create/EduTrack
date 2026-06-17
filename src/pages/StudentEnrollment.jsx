import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/dbClient";
import { useLanguage } from "@/lib/LanguageContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserCheck, CheckCircle2, ChevronRight, ChevronLeft, UploadCloud, UserCircle2, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function StudentEnrollment() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const qc = useQueryClient();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    id: "",
    full_name: "",
    gender: "ذكر",
    dob: "",
    nationality: "",
    parent_email: "",
    parent_phone: "",
    grade_level: "الصف الأول",
    address: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = () => setStep(prev => Math.min(prev + 1, 4));
  const handleBack = () => setStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = async () => {
    if (!formData.full_name || !formData.id) {
      toast.error(isRTL ? "الاسم الرباعي ورقم الهوية مطلوبان" : "Full name and ID are required");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await entities.Student.create({
        ...formData,
        student_id: formData.id,
        enrollment_date: new Date().toISOString().split('T')[0],
        status: "active"
      });
      
      toast.success(isRTL ? "تم تسجيل الطالب بنجاح!" : "Student enrolled successfully!");
      setStep(4); // Success step
      qc.invalidateQueries({ queryKey: ["students-list"] });
    } catch (error) {
      toast.error(isRTL ? "فشل تسجيل الطالب" : "Failed to enroll student");
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepVariants = {
    hidden: { opacity: 0, x: isRTL ? -20 : 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: isRTL ? 20 : -20, transition: { duration: 0.3 } }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-stone-100 pb-6">
        <div className="h-12 w-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
          <UserCheck size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight">
            {isRTL ? "معالج قبول وتسجيل الطلاب" : "Student Enrollment Wizard"}
          </h1>
          <p className="text-stone-500 font-medium mt-1">
            {isRTL ? "أدخل بيانات الطالب الجديد لإنشاء ملف أكاديمي متكامل" : "Enter new student details to create an academic profile"}
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      {step < 4 && (
        <div className="flex items-center justify-between relative mb-8">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-stone-100 -translate-y-1/2 z-0" />
          <div 
            className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 z-0 transition-all duration-500" 
            style={{ width: `${((step - 1) / 2) * 100}%`, right: isRTL ? 0 : 'auto', left: isRTL ? 'auto' : 0 }} 
          />
          
          {[
            { id: 1, title: isRTL ? "البيانات الأساسية" : "Basic Info", icon: UserCircle2 },
            { id: 2, title: isRTL ? "بيانات التواصل" : "Contact Info", icon: Phone },
            { id: 3, title: isRTL ? "المستندات" : "Documents", icon: UploadCloud }
          ].map(s => (
            <div key={s.id} className="relative z-10 flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 shadow-sm ${
                step > s.id ? "bg-primary text-white" : step === s.id ? "bg-white border-2 border-primary text-primary" : "bg-white border-2 border-stone-200 text-stone-400"
              }`}>
                {step > s.id ? <CheckCircle2 size={18} /> : s.id}
              </div>
              <span className={`text-xs font-bold ${step >= s.id ? "text-stone-800" : "text-stone-400"}`}>{s.title}</span>
            </div>
          ))}
        </div>
      )}

      {/* Form Content */}
      <Card className="border border-stone-100 shadow-sm rounded-[32px] overflow-hidden bg-white">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="p-6 md:p-8 space-y-6">
              <h2 className="text-xl font-bold text-stone-800 mb-6">{isRTL ? "البيانات الأساسية للطالب" : "Student Basic Info"}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-stone-700">{isRTL ? "الاسم الرباعي" : "Full Name"}</label>
                  <Input 
                    value={formData.full_name} 
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    placeholder={isRTL ? "مثال: أحمد محمد علي حسن" : "e.g. John Doe Smith"}
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-stone-700">{isRTL ? "رقم الهوية الوطنية / الإقامة" : "National ID / Iqama"}</label>
                  <Input 
                    value={formData.id} 
                    onChange={(e) => setFormData({...formData, id: e.target.value})}
                    placeholder="100..."
                    className="h-12 rounded-xl num-en"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-stone-700">{isRTL ? "الجنسية" : "Nationality"}</label>
                  <Input 
                    value={formData.nationality} 
                    onChange={(e) => setFormData({...formData, nationality: e.target.value})}
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-stone-700">{isRTL ? "تاريخ الميلاد" : "Date of Birth"}</label>
                  <Input 
                    type="date"
                    value={formData.dob} 
                    onChange={(e) => setFormData({...formData, dob: e.target.value})}
                    className="h-12 rounded-xl num-en"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-stone-700">{isRTL ? "الجنس" : "Gender"}</label>
                  <select 
                    value={formData.gender} 
                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
                    className="w-full h-12 px-4 rounded-xl border border-stone-200 bg-white"
                  >
                    <option value="ذكر">{isRTL ? "ذكر" : "Male"}</option>
                    <option value="أنثى">{isRTL ? "أنثى" : "Female"}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-stone-700">{isRTL ? "الصف الدراسي المتقدم له" : "Target Grade Level"}</label>
                  <select 
                    value={formData.grade_level} 
                    onChange={(e) => setFormData({...formData, grade_level: e.target.value})}
                    className="w-full h-12 px-4 rounded-xl border border-stone-200 bg-white"
                  >
                    <option value="KG">KG</option>
                    <option value="الصف الأول">الصف الأول</option>
                    <option value="الصف الثاني">الصف الثاني</option>
                    <option value="الصف الثالث">الصف الثالث</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="p-6 md:p-8 space-y-6">
              <h2 className="text-xl font-bold text-stone-800 mb-6">{isRTL ? "بيانات التواصل وولي الأمر" : "Contact & Guardian Info"}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-stone-700">{isRTL ? "رقم جوال ولي الأمر" : "Guardian Phone"}</label>
                  <Input 
                    value={formData.parent_phone} 
                    onChange={(e) => setFormData({...formData, parent_phone: e.target.value})}
                    placeholder="05..."
                    className="h-12 rounded-xl num-en"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-stone-700">{isRTL ? "البريد الإلكتروني" : "Guardian Email"}</label>
                  <Input 
                    type="email"
                    value={formData.parent_email} 
                    onChange={(e) => setFormData({...formData, parent_email: e.target.value})}
                    placeholder="email@example.com"
                    className="h-12 rounded-xl num-en"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-stone-700">{isRTL ? "العنوان الوطني / مكان السكن" : "Home Address"}</label>
                  <div className="relative">
                    <MapPin className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 text-stone-400`} size={16} />
                    <Input 
                      value={formData.address} 
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      placeholder={isRTL ? "المدينة، الحي، الشارع" : "City, District, Street"}
                      className={`h-12 rounded-xl ${isRTL ? "pr-10" : "pl-10"}`}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="p-6 md:p-8 space-y-6">
              <h2 className="text-xl font-bold text-stone-800 mb-6">{isRTL ? "المرفقات الأكاديمية" : "Academic Attachments"}</h2>
              
              <div className="border-2 border-dashed border-stone-200 rounded-[24px] p-12 text-center bg-stone-50/50 hover:bg-stone-50 transition-colors cursor-pointer">
                <UploadCloud className="mx-auto h-12 w-12 text-primary mb-4" />
                <h3 className="text-lg font-bold text-stone-900 mb-1">{isRTL ? "انقر لرفع المستندات الثبوتية" : "Click to upload documents"}</h3>
                <p className="text-sm text-stone-500 mb-4">{isRTL ? "شهادة الميلاد، سجل التطعيمات، والشهادات السابقة" : "Birth certificate, vaccination record, previous certificates"}</p>
                <Button variant="outline" className="rounded-xl font-bold">{isRTL ? "اختيار الملفات" : "Choose Files"}</Button>
              </div>

              <div className="bg-amber-50 text-amber-800 p-4 rounded-xl text-sm font-semibold flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 shrink-0" size={16} />
                <p>{isRTL ? "يمكن إكمال التسجيل الآن وتأجيل رفع الملفات لقسم الأرشيف لاحقاً." : "You can complete registration now and upload files to the archive later."}</p>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="p-12 text-center space-y-6">
              <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={48} />
              </div>
              <h2 className="text-3xl font-black text-stone-900">{isRTL ? "اكتمل التسجيل بنجاح!" : "Enrollment Completed!"}</h2>
              <p className="text-stone-500 font-medium max-w-md mx-auto">
                {isRTL ? `تم إنشاء ملف الطالب "${formData.full_name}" بنجاح وإصدار رقم الهوية الأكاديمية له. يمكنك الآن التوجه لملفه الشخصي.` : `Student profile for "${formData.full_name}" has been created. You can now view their academic profile.`}
              </p>
              <div className="pt-8">
                <Button onClick={() => window.location.href = "/student-directory"} className="h-12 px-8 rounded-xl font-bold bg-stone-900 hover:bg-stone-800 text-white">
                  {isRTL ? "الانتقال لقائمة الطلاب" : "Go to Students Directory"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Actions */}
        {step < 4 && (
          <div className="p-6 border-t border-stone-100 flex justify-between bg-stone-50/50">
            <Button 
              variant="outline" 
              onClick={handleBack} 
              disabled={step === 1}
              className="h-12 px-6 rounded-xl font-bold border-stone-200 hover:bg-stone-100"
            >
              {isRTL ? "السابق" : "Back"}
            </Button>
            
            {step < 3 ? (
              <Button 
                onClick={handleNext} 
                className="h-12 px-8 rounded-xl font-bold bg-primary text-white hover:bg-primary/90 flex items-center gap-2"
              >
                {isRTL ? "التالي" : "Next"}
                <ChevronRight size={18} className={isRTL ? "rotate-180" : ""} />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting}
                className="h-12 px-8 rounded-xl font-bold bg-stone-900 text-white hover:bg-stone-800 flex items-center gap-2"
              >
                {isSubmitting ? (isRTL ? "جاري التسجيل..." : "Enrolling...") : (isRTL ? "اعتماد وتسجيل" : "Confirm Enrollment")}
              </Button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
