import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save, Loader2, Globe, Image as ImageIcon, ChevronDown, ChevronRight, Type, Hash, CreditCard } from "lucide-react";

const SECTIONS = [
  { key: "hero", label: "القسم الرئيسي (Hero)", icon: Globe },
  { key: "features", label: "المميزات", icon: Hash },
  { key: "school_cta", label: "دعوة المدرسة", icon: Type },
  { key: "teacher_cta", label: "دعوة المعلم المستقل", icon: Type },
  { key: "student_cta", label: "دعوة الطالب المستقل", icon: Type },
  { key: "whatsapp", label: "قسم واتساب", icon: Type },
  { key: "footer", label: "التذييل", icon: Type },
  { key: "pricing", label: "الأسعار والباقات", icon: CreditCard },
  { key: "nav", label: "القائمة العلوية", icon: Type },
];

const DEFAULT_VALUES = {
  hero_badge: ["نظام شامل لإدارة المدارس الذكية", "All-in-one Smart School Management"],
  hero_title_1: ["منصة المدارس ", "Manage your school"],
  hero_title_highlight: ["الإلكترونية", "smartly"],
  hero_title_2: [" المدرسة الإلكترونية ", "from one place"],
  hero_desc: ["منصة EduTrack تغطي النتائج والشهادات السودانية، شؤون الطلاب، الرسوم، الحضور، والمزيد — بواجهة عربية احترافية وطباعة بجودة الوزارة.", "EduTrack covers results & Sudanese certificates, students, fees, attendance and more — with Arabic UI and ministry-grade print."],
  hero_cta: ["طلب نسخة تجريبية", "Request Demo"],
  hero_trust_1: ["دعم فني مخصص", "Local support"],
  hero_trust_2: ["آمن ومشفّر", "Secure"],
  hero_slide_1_img: ["https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=800&auto=format&fit=crop", ""],
  hero_slide_1_caption: ["أثناء الدرس المباشر", "During live lesson"],
  hero_slide_2_img: ["https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800&auto=format&fit=crop", ""],
  hero_slide_2_caption: ["العمل الجماعي في الفصل", "Group work in class"],
  hero_slide_3_img: ["https://images.unsplash.com/photo-1588072432836-e10032774350?q=80&w=800&auto=format&fit=crop", ""],
  hero_slide_3_caption: ["أثناء أداء الواجب", "Doing homework"],
  hero_slide_4_img: ["https://images.unsplash.com/photo-1516534775068-ba3e7458af70?q=80&w=800&auto=format&fit=crop", ""],
  hero_slide_4_caption: ["المراجعة والتحضير", "Review & preparation"],
  features_title: ["مميزات المنصة", "Platform Features"],
  features_desc: ["كل ما تحتاجه المدرسة السودانية في مكان واحد", "Everything a Sudanese school needs in one place"],
  pricing_monthly_price: ["49,000", "49,000"],
  pricing_yearly_price: ["350,000", "350,000"],
  pricing_currency: ["ج.س", "SDG"],
  pricing_trial_badge: ["شهر مجاني", "Free Month"],
  pricing_discount_badge: ["41% OFF", "41% OFF"],
};

export default function LandingContentEditor() {
  const queryClient = useQueryClient();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openSections, setOpenSections] = useState({ hero: true });
  const [activeTab, setActiveTab] = useState("ar");

  useEffect(() => {
    fetch(`${import.meta.env.VITE_BACKEND_URL || ""}/api/landing-content`)
      .then(r => r.json())
      .then(d => { setItems(d.items || []); setLoading(false); })
      .catch(() => { setLoading(false); toast.error("فشل تحميل المحتوى"); });
  }, []);

  const getVal = (key, lang = "ar") => {
    const item = items.find(i => i.content_key === key);
    if (item) return lang === "ar" ? item.value_ar : item.value_en;
    const def = DEFAULT_VALUES[key];
    return def ? def[lang === "ar" ? 0 : 1] : "";
  };

  const setVal = (key, lang, value) => {
    setItems(prev => {
      const idx = prev.findIndex(i => i.content_key === key);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], [lang === "ar" ? "value_ar" : "value_en"]: value };
        return copy;
      }
      return [...prev, { content_key: key, value_ar: lang === "ar" ? value : "", value_en: lang === "en" ? value : "", content_type: "text" }];
    });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || ""}/api/landing-content`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("founder_token") || ""}` },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) throw new Error("Save failed");
      return res.json();
    },
    onSuccess: () => { toast.success("تم حفظ المحتوى بنجاح"); queryClient.invalidateQueries(["landing-content"]); },
    onError: () => toast.error("فشل الحفظ"),
  });

  const toggleSection = (key) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  const renderField = (key, label, type = "text") => (
    <div key={key} className="space-y-1">
      <label className="text-xs font-bold text-slate-500">{label}</label>
      {activeTab === "ar" ? (
        <input
          type={type}
          value={getVal(key, "ar")}
          onChange={e => setVal(key, "ar", e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
          dir="rtl"
        />
      ) : (
        <input
          type={type}
          value={getVal(key, "en")}
          onChange={e => setVal(key, "en", e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
          dir="ltr"
        />
      )}
    </div>
  );

  const renderImageField = (key, label) => (
    <div key={key} className="space-y-1">
      <label className="text-xs font-bold text-slate-500 flex items-center gap-1"><ImageIcon size={12}/> {label}</label>
      <input
        type="url"
        value={getVal(key, "ar")}
        onChange={e => setVal(key, "ar", e.target.value)}
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white font-mono text-xs"
        dir="ltr"
        placeholder="https://..."
      />
      {getVal(key, "ar") && (
        <img src={getVal(key, "ar")} alt="" className="h-16 rounded-lg object-cover border" onError={e => e.target.style.display = 'none'} />
      )}
    </div>
  );

  if (loading) return <div className="flex items-center gap-2 text-slate-500 p-6"><Loader2 className="animate-spin" size={18}/> جاري التحميل...</div>;

  const renderSection = (sectionKey, fields) => {
    const isOpen = openSections[sectionKey];
    const sectionDef = SECTIONS.find(s => s.key === sectionKey);
    const Icon = sectionDef?.icon || Type;
    return (
      <div key={sectionKey} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <button onClick={() => toggleSection(sectionKey)} className="w-full flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition text-right">
          <Icon size={16} className="text-blue-500 shrink-0"/>
          <span className="font-bold text-slate-800 flex-1">{sectionDef?.label}</span>
          {isOpen ? <ChevronDown size={16} className="text-slate-400"/> : <ChevronRight size={16} className="text-slate-400"/>}
        </button>
        {isOpen && <div className="px-5 pb-5 space-y-3 border-t border-slate-100">{fields}</div>}
      </div>
    );
  };

  return (
    <div className="space-y-4 max-w-3xl">
      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setActiveTab("ar")} className={`px-4 py-2 rounded-xl text-sm font-bold transition ${activeTab === "ar" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>العربية</button>
        <button onClick={() => setActiveTab("en")} className={`px-4 py-2 rounded-xl text-sm font-bold transition ${activeTab === "en" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>English</button>
      </div>

      {/* Hero */}
      {renderSection("hero", <>
        {renderField("hero_badge", "شارة القسم")}
        {renderField("hero_title_1", "جزء العنوان الأول")}
        {renderField("hero_title_highlight", "النص المميز باللون")}
        {renderField("hero_title_2", "جزء العنوان الثاني")}
        {renderField("hero_desc", "الوصف")}
        {renderField("hero_cta", "نص الزر الرئيسي")}
        {renderField("hero_trust_1", "ثقة 1")}
        {renderField("hero_trust_2", "ثقة 2")}
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(n => (
            <React.Fragment key={n}>
              {renderImageField(`hero_slide_${n}_img`, `صورة ${n}`)}
              {renderField(`hero_slide_${n}_caption`, `تعليق ${n}`)}
            </React.Fragment>
          ))}
        </div>
      </>)}

      {/* Features */}
      {renderSection("features", <>
        {renderField("features_title", "عنوان القسم")}
        {renderField("features_desc", "وصف القسم")}
        {[1,2,3,4,5,6].map(n => (
          <div key={n} className="bg-slate-50 rounded-xl p-3 space-y-2 border border-slate-100">
            <div className="text-xs font-bold text-blue-600">الميزة {n}</div>
            {renderField(`feature_${n}_title`, "العنوان")}
            {renderField(`feature_${n}_desc`, "الوصف القصير")}
            {renderField(`feature_${n}_longDesc`, "الوصف الطويل")}
            {renderField(`feature_${n}_points`, "النقاط (فاصلة|منفصلة)")}
            {renderImageField(`feature_${n}_img1`, "صورة 1")}
            {renderImageField(`feature_${n}_img2`, "صورة 2")}
          </div>
        ))}
      </>)}

      {/* School CTA */}
      {renderSection("school_cta", <>
        {renderField("school_cta_badge", "الشارة")}
        {renderField("school_cta_title", "العنوان")}
        {renderField("school_cta_desc", "الوصف")}
        {renderField("school_cta_cta", "نص الزر الرئيسي")}
        {renderField("school_cta_whatsapp", "نص زر واتساب")}
      </>)}

      {/* Teacher CTA */}
      {renderSection("teacher_cta", <>
        {renderField("teacher_cta_badge", "الشارة")}
        {renderField("teacher_cta_title", "العنوان")}
        {renderField("teacher_cta_desc", "الوصف")}
        {renderField("teacher_cta_login", "نص زر الدخول")}
        {renderField("teacher_cta_register", "نص زر التسجيل")}
        {renderField("teacher_cta_whatsapp", "نص زر واتساب")}
      </>)}

      {/* Student CTA */}
      {renderSection("student_cta", <>
        {renderField("student_cta_badge", "الشارة")}
        {renderField("student_cta_title", "العنوان")}
        {renderField("student_cta_desc", "الوصف")}
        {renderField("student_cta_login", "نص زر الدخول")}
        {renderField("student_cta_register", "نص زر التسجيل")}
        {renderField("student_cta_whatsapp", "نص زر واتساب")}
      </>)}

      {/* WhatsApp */}
      {renderSection("whatsapp", <>
        {renderField("whatsapp_title", "العنوان")}
        {renderField("whatsapp_desc", "الوصف")}
        {renderField("whatsapp_cta", "نص الزر")}
      </>)}

      {/* Footer */}
      {renderSection("footer", <>
        {renderField("footer_desc", "الوصف")}
        {renderField("footer_links_title", "عنوان الروابط")}
        {renderField("footer_link_1", "رابط 1")}
        {renderField("footer_link_2", "رابط 2")}
        {renderField("footer_link_3", "رابط 3")}
        {renderField("footer_link_4", "رابط 4")}
        {renderField("footer_contact_title", "عنوان التواصل")}
        {renderField("footer_location", "الموقع")}
        {renderField("footer_social_title", "عنوان السوشال")}
        {renderField("footer_follow_desc", "وصف المتابعة")}
        {renderField("footer_secure", "نص الأمان")}
      </>)}

      {/* Nav */}
      {renderSection("nav", <>
        {renderField("nav_features", "مميزات")}
        {renderField("nav_pricing", "الأسعار")}
        {renderField("nav_contact", "التواصل")}
        {renderField("nav_whatsapp", "واتساب")}
        {renderField("nav_cta", "نص الزر الرئيسي")}
      </>)}

      {/* Pricing */}
      {renderSection("pricing", <>
        <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 mb-2">
          <p className="text-xs text-amber-700 font-bold">هذه الأسعار تظهر في قسم "بوابة المعلم المستقل" في الصفحة الرئيسية</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500">السعر الشهري (رقم فقط)</label>
            <input
              type="text"
              value={getVal("pricing_monthly_price", activeTab === "ar" ? "ar" : "en")}
              onChange={e => setVal("pricing_monthly_price", activeTab === "ar" ? "ar" : "en", e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
              dir="ltr"
              placeholder="49,000"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500">السعر السنوي (رقم فقط)</label>
            <input
              type="text"
              value={getVal("pricing_yearly_price", activeTab === "ar" ? "ar" : "en")}
              onChange={e => setVal("pricing_yearly_price", activeTab === "ar" ? "ar" : "en", e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
              dir="ltr"
              placeholder="350,000"
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500">العملة</label>
            <input
              type="text"
              value={getVal("pricing_currency", activeTab === "ar" ? "ar" : "en")}
              onChange={e => setVal("pricing_currency", activeTab === "ar" ? "ar" : "en", e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
              dir={activeTab === "ar" ? "rtl" : "ltr"}
              placeholder="ج.س"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500">شارة التجربة المجانية</label>
            <input
              type="text"
              value={getVal("pricing_trial_badge", activeTab === "ar" ? "ar" : "en")}
              onChange={e => setVal("pricing_trial_badge", activeTab === "ar" ? "ar" : "en", e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
              dir={activeTab === "ar" ? "rtl" : "ltr"}
              placeholder="شهر مجاني"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500">شارة الخصم</label>
            <input
              type="text"
              value={getVal("pricing_discount_badge", activeTab === "ar" ? "ar" : "en")}
              onChange={e => setVal("pricing_discount_badge", activeTab === "ar" ? "ar" : "en", e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
              dir="ltr"
              placeholder="41% OFF"
            />
          </div>
        </div>
      </>)}

      {/* Save */}
      <div className="flex justify-end sticky bottom-4">
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition disabled:opacity-50"
        >
          {saveMutation.isPending ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>}
          {saveMutation.isPending ? "جاري الحفظ..." : "حفظ جميع التغييرات"}
        </button>
      </div>
    </div>
  );
}
