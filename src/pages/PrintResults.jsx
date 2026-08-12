import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/dbClient";
import {
  Printer, Search, Eye, Users, Award, CheckCircle2,
  BookOpen, Sparkles, SlidersHorizontal, Info, Upload,
  Palette, RefreshCw, FileText, Check, Settings, Save
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useLanguage } from "@/lib/LanguageContext";
import PageHeader from "@/components/shared/PageHeader";
import { toast } from "sonner";

// ─── Color Themes ──────────────────────────────────────────────
const COLOR_THEMES = [
  { id: "green", name: "ورقي أخضر كلاسيكي", bg: "#d8edd8", border: "#14532d", accent: "#15803d", text: "#000000", stamp: "#1e3a8a" },
  { id: "white", name: "أبيض وأسود رسمي", bg: "#ffffff", border: "#000000", accent: "#000000", text: "#000000", stamp: "#1e3a8a" },
  { id: "gold", name: "ذهبي ملكي فاخر", bg: "#fefce8", border: "#b45309", accent: "#d97706", text: "#1c1917", stamp: "#1e3a8a" },
  { id: "blue", name: "أزرق كحلي أكاديمي", bg: "#f0f9ff", border: "#1e3a8a", accent: "#2563eb", text: "#0f172a", stamp: "#991b1b" }
];

// ─── Number to Arabic Words Helper ──────────────────────────────
function numToArabicWords(n) {
  if (n === null || n === undefined || isNaN(n)) return "—";
  const integerPart = Math.floor(n);
  const decimalPart = Math.round((n - integerPart) * 10) / 10;

  const ones = ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة", "عشرة", "إحدى عشر", "اثنا عشر", "ثلاثة عشر", "أربعة عشر", "خمسة عشر", "ستة عشر", "سبعة عشر", "ثمانية عشر", "تسعة عشر"];
  const tens = ["", "", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
  const hundreds = ["", "مائة", "مائتان", "ثلاثمائة", "أربعمائة", "خمسمائة", "ستمائة", "سبعمائة", "ثمانمائة", "تسعمائة"];

  let words = "";

  if (integerPart === 0) {
    words = "صفر";
  } else {
    let h = Math.floor(integerPart / 100);
    let rem = integerPart % 100;

    if (h > 0) {
      words += hundreds[h];
    }

    if (rem > 0) {
      if (words !== "") words += " و";
      if (rem < 20) {
        words += ones[rem];
      } else {
        let t = Math.floor(rem / 10);
        let o = rem % 10;
        if (o > 0) {
          words += ones[o] + " و" + tens[t];
        } else {
          words += tens[t];
        }
      }
    }
  }

  let result = words + " درجة";
  if (decimalPart >= 0.4 && decimalPart <= 0.6) {
    result += " ونصف";
  } else if (decimalPart > 0) {
    result += ` و ${Math.round(decimalPart * 10)} من عشرة`;
  }
  return result;
}

// ─── Grade Label Helper ────────────────────────────────────────
function getGradeLabelClassic(pct) {
  if (pct === null || pct === undefined || isNaN(pct)) return { label: "—", color: "#4b5563" };
  if (pct >= 90) return { label: "ممتاز", color: "#047857" };
  if (pct >= 75) return { label: "جيد جداً", color: "#0369a1" };
  if (pct >= 60) return { label: "جـيـد", color: "#ca8a04" };
  if (pct >= 50) return { label: "مقبول", color: "#ea580c" };
  return { label: "ضعــيف", color: "#dc2626" };
}

// ─── PAGE 1: MARKSHEET FRONT (الوجه الأمامي - كشف الدرجات الشامل بالجدول الأفقي المحوري على عرض الورقة A4 Landscape) ─
function CertificateMarksheetFront({ student, items, attendanceCount, schoolName, schoolLogo, theme, termLabel, principalName }) {
  const gradedItems = items.filter(i => i.has_grade && i.score !== null);
  const totalScore = gradedItems.reduce((s, i) => s + Number(i.score || 0), 0);
  const totalMax = items.reduce((s, i) => s + Number(i.max_score || 100), 0);
  const totalMin = Math.round(totalMax / 2);
  const overallPct = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
  const overallGrade = getGradeLabelClassic(gradedItems.length > 0 ? overallPct : null);
  const totalInWords = numToArabicWords(gradedItems.length > 0 ? totalScore : null);

  return (
    <div className="pro-cert-page-landscape" style={{ backgroundColor: theme.bg, color: theme.text }} dir="rtl">
      <div className="pro-marksheet-border" style={{ borderColor: theme.border }}>
        <div className="marksheet-inner-flex">

          {/* Header Bar: Right Box (Gov Info), Center (Bismillah + School Name), Left Box (Uploaded Logo) */}
          <div className="pro-header-grid">
            {/* Right Box (الركن الأيمن) */}
            <div className="header-box-side flex flex-col items-center justify-center text-center" style={{ borderColor: theme.border }}>
              <p className="font-bold text-[12px] leading-snug">جمهورية السودان</p>
              <p className="font-bold text-[12px] leading-snug">ولاية الخرطوم</p>
              <p className="font-bold text-[11px] leading-snug">وزارة التربية والتعليم</p>
              <p className="font-bold text-[10px] leading-snug">التعليم الخاص</p>
            </div>

            {/* Center Header (المنتصف) */}
            <div className="header-box-center text-center">
              <div className="bismillah-calligraphy text-sm font-bold">بسم الله الرحمن الرحيم</div>
              <h1 className="pro-school-title text-2xl font-black my-0.5" style={{ color: theme.border }}>{schoolName}</h1>
              <p className="font-bold text-xs tracking-wide">إبتدائي ومتوسط (بنين - بنات)</p>
            </div>

            {/* Left Box (الركن الأيسر بنفس القياسات للشعار) */}
            <div className="header-box-side flex items-center justify-center p-1" style={{ borderColor: theme.border }}>
              {schoolLogo ? (
                <img src={schoolLogo} alt="School Logo" className="pro-logo-img" />
              ) : (
                <div className="pro-logo-badge flex flex-col items-center justify-center text-center font-bold text-[10px]" style={{ borderColor: theme.border }}>
                  <span>شعار المدرسة</span>
                </div>
              )}
            </div>
          </div>

          {/* Student Info Bar */}
          <div className="pro-meta-bar" style={{ borderColor: theme.border }}>
            <div className="meta-left space-y-1">
              <p><span className="lbl font-bold">نتيجة الامتحان للفترة :</span> <span className="val">{termLabel}</span></p>
              <p><span className="lbl font-bold">العام الدراســـــــــــي :</span> <span className="val font-mono">2025/2026م</span></p>
              <p><span className="lbl font-bold">الاســــــــــــــــــــــم :</span> <span className="val font-bold text-sm">{student.full_name || student.name}</span></p>
            </div>
            <div className="meta-right space-y-1 text-left">
              <p><span className="lbl font-bold">الصــــــــــف :</span> <span className="val font-bold">{student.grade || "الثالث المتوسط"}</span></p>
              <p><span className="lbl font-bold">التقــديـــر :</span> <span className="val font-bold" style={{ color: overallGrade.color }}>{overallGrade.label}</span></p>
            </div>
          </div>

          {/* HORIZONTAL SUBJECTS TABLE (المواد بالأفق والصفوف بالرأس) */}
          <div className="pro-table-wrapper">
            <table className="pro-horizontal-table" style={{ borderColor: theme.border }}>
              <thead>
                <tr style={{ backgroundColor: "rgba(0,0,0,0.04)" }}>
                  <th className="th-label-side" style={{ borderColor: theme.border }}>الـمـواد</th>
                  {items.map((item, i) => (
                    <th key={i} style={{ borderColor: theme.border }}>{item.subject_name}</th>
                  ))}
                  <th className="th-total-col" style={{ borderColor: theme.border }}>الـمـجـمـوع</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="td-label-side" style={{ borderColor: theme.border }}>الـقـصــــــوى</td>
                  {items.map((item, i) => (
                    <td key={i} className="font-mono" style={{ borderColor: theme.border }}>{item.max_score || 40}</td>
                  ))}
                  <td className="font-mono font-bold td-total-col" style={{ borderColor: theme.border }}>{totalMax}</td>
                </tr>
                <tr>
                  <td className="td-label-side" style={{ borderColor: theme.border }}>الـصـغــــــرى</td>
                  {items.map((item, i) => (
                    <td key={i} className="font-mono" style={{ borderColor: theme.border }}>{Math.round((item.max_score || 40) / 2)}</td>
                  ))}
                  <td className="font-mono font-bold td-total-col" style={{ borderColor: theme.border }}>{totalMin}</td>
                </tr>
                <tr className="tr-scores-row">
                  <td className="td-label-side font-bold" style={{ borderColor: theme.border }}>درجات التلميذ</td>
                  {items.map((item, i) => {
                    const hasScore = item.has_grade && item.score !== null;
                    return (
                      <td key={i} className="font-mono font-bold" style={{ borderColor: theme.border }}>
                        {hasScore ? item.score : <span className="text-gray-400 font-normal text-[10px]">غ/م</span>}
                      </td>
                    );
                  })}
                  <td className="font-mono font-black text-sm td-total-col" style={{ borderColor: theme.border }}>
                    {gradedItems.length > 0 ? totalScore : "—"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Bottom Layout: Details & Stamp + Absence & Remarks */}
          <div className="pro-bottom-grid">

            {/* Right Details */}
            <div className="details-col space-y-1.5">
              <p className="detail-line">
                <span className="lbl font-bold">المجمـوع بالحــروف :</span>
                <span className="val font-bold">{totalInWords}</span>
              </p>
              <p className="detail-line">
                <span className="lbl font-bold">درجــة النـجــــــــاح :</span>
                <span className="val text-[11px]">أي مادة = 50% من الدرجة الكاملة (نصف الدرجة الكاملة)</span>
              </p>
              <p className="detail-line">
                <span className="lbl font-bold">إسم مدير المدرسة :</span>
                <span className="val font-bold">{principalName || "هند يوسف حماد علي"}</span>
              </p>
              <p className="detail-line">
                <span className="lbl font-bold">تاريخ إصدار النتيجة :</span>
                <span className="val font-mono">{new Date().toLocaleDateString('ar-SA')}م</span>
              </p>
              <p className="detail-line">
                <span className="lbl font-bold">تاريخ إستئناف الدراسة :</span>
                <span className="val font-mono">2026/09/01م</span>
              </p>

              {/* Blue Circular Stamp */}
              <div className="stamp-overlay-pos">
                <div className="stamp-circle" style={{ color: theme.stamp, borderColor: theme.stamp }}>
                  <span className="font-bold text-[10px]">ختم المدرسة</span>
                  <span className="text-[7px]">مصادق عليه</span>
                </div>
              </div>
            </div>

            {/* Left Box: Absence + Advisor */}
            <div className="left-col space-y-2">
              <table className="absence-mini-table" style={{ borderColor: theme.border }}>
                <thead>
                  <tr>
                    <th style={{ borderColor: theme.border }}>عدد أيام السنة</th>
                    <th style={{ borderColor: theme.border }}>عدد أيام الغياب</th>
                    <th style={{ borderColor: theme.border }}>بعذر مقبول</th>
                    <th style={{ borderColor: theme.border }}>بدون عذر</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-mono" style={{ borderColor: theme.border }}>180</td>
                    <td className="font-mono font-bold" style={{ borderColor: theme.border }}>{attendanceCount}</td>
                    <td className="font-mono" style={{ borderColor: theme.border }}>{Math.min(attendanceCount, 2)}</td>
                    <td className="font-mono" style={{ borderColor: theme.border }}>{Math.max(0, attendanceCount - 2)}</td>
                  </tr>
                </tbody>
              </table>

              <div className="advisor-remarks-box" style={{ borderColor: theme.border }}>
                <p className="font-bold text-xs">ملاحظات مرشد الصف :</p>
                <p className="text-xs mt-1 leading-relaxed">
                  {gradedItems.length > 0
                    ? (overallPct >= 85
                      ? "تلميذ منضبط وممتاز أكاديمياً وخلقياً. نتمنى له مزيداً من التقدم والاجتهاد."
                      : "أداء جيد نوصي بمواصلة الاجتهاد والمتابعة الدورية.")
                    : "جاري استكمال رصد باقي المواد."}
                </p>
                <div className="advisor-sig-row flex justify-between text-xs mt-2">
                  <span>التوقيع :</span>
                  <span className="border-b border-black w-28 text-center font-bold">مرشد الصف</span>
                </div>
              </div>
            </div>

          </div>

          {/* Footer Warning */}
          <div className="pro-footer-warning text-center font-bold text-xs pt-1">
            (أ ي   كـشـط   أ و   تـعـد يـل   يـلـغـي   هـذ ه   ا لـشـهـا د ة)
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── PAGE 2: MARKSHEET BACK (الوجه الخلفي للشهادة - غلاف المقررات والإرشادات على عرض الورقة A4 Landscape) ─
function CertificateCoverBack({ student, schoolName, theme }) {
  const phone = "0123109370 / 0116375406";

  return (
    <div className="pro-cert-page-landscape" style={{ backgroundColor: theme.bg, color: theme.text }} dir="rtl">
      <div className="pro-cover-grid">

        {/* RIGHT PANEL: GUIDANCE & SCALES (الإرشادات والتقديرات) */}
        <div className="pro-rounded-panel" style={{ borderColor: theme.border }}>
          <div className="panel-inner flex flex-col justify-between h-full">
            <ul className="pro-bullet-list space-y-1">
              <li>عود إبنك الصدق والصلاة ومكارم الأخلاق</li>
              <li>تأكد من صداقة إبنك للأخيار</li>
              <li>زيارتك للمدرسة مهمة لأنها تكمل دور المدرسة العلمية والتربوية</li>
            </ul>

            <div className="pro-ribbon-banner">
              <span className="ribbon-tail-r" style={{ borderRightColor: theme.border }} />
              <span className="ribbon-text" style={{ borderColor: theme.border }}>إبـنـنـا التـلـمـيـذ</span>
              <span className="ribbon-tail-l" style={{ borderLeftColor: theme.border }} />
            </div>

            <ul className="pro-bullet-list space-y-1">
              <li>حافظ على صلواتك ودوام على تلاوة القرآن.</li>
              <li>إجتهد في دراستك فلكل مجتهد نصيب.</li>
              <li>إحترام المعلم واجب.</li>
            </ul>

            <div className="pro-scroll-banner" style={{ borderColor: theme.border }}>
              <span>كـاد الـمـعـلـم أن يـكـون ر سـو لاً</span>
            </div>

            <div className="flex justify-center my-1">
              <div className="pro-hexagon-badge" style={{ borderColor: theme.border }}>
                <span>التقدير</span>
              </div>
            </div>

            <ul className="pro-bullet-list scale-list space-y-0.5 text-xs">
              <li>من 90% إلى 100% ممتاز.</li>
              <li>أقل من 90% إلى 75% جيد جداً.</li>
              <li>أقل من 75% إلى 60% جـيـد.</li>
              <li>أقل من 60% إلى 50% مقبول.</li>
              <li>أقل من 50% ضعــيف.</li>
            </ul>
          </div>
        </div>

        {/* LEFT PANEL: MAIN COVER TITLE PAGE (الغلاف الرئيسي للمقررات) */}
        <div className="pro-rounded-panel" style={{ borderColor: theme.border }}>
          <div className="panel-inner text-center flex flex-col justify-between h-full">
            <div>
              <div className="bismillah-calligraphy text-base font-bold">بسم الله الرحمن الرحيم</div>
              <div className="text-center mt-2 leading-snug">
                <p className="font-bold text-xs">جمهورية السودان</p>
                <p className="font-bold text-sm">ولاية الخرطوم – محلية الشهداء وسوبا</p>
                <p className="font-bold text-xs">وزارة التربية والتعليم – إدارة التعليم الخاص</p>
              </div>
            </div>

            <div className="my-3">
              <h2 className="pro-school-title text-2xl font-black" style={{ color: theme.border }}>{schoolName}</h2>
              <p className="font-bold text-sm mt-1">الإبـتـدائـيـة والـمـتـوسـطـة</p>
              <p className="font-bold text-xs mt-0.5">بـنـيـن – بـنـات</p>
            </div>

            <div className="pro-scroll-banner main-title-scroll" style={{ borderColor: theme.border }}>
              <span>نـتـيـجـة الـمـقـر ر ا ت الـدر ا سـيـة</span>
            </div>

            <div className="pro-student-cover-info text-right w-11/12 mx-auto space-y-2">
              <div className="flex items-center">
                <span className="font-bold w-24 text-sm">اسم التلميـذ/</span>
                <span className="font-bold text-base border-b-2 border-black flex-1 pb-1">{student.full_name || student.name}</span>
              </div>
              <div className="flex items-center">
                <span className="font-bold w-24 text-sm">الصــــــــــف/</span>
                <span className="font-bold text-base border-b-2 border-black flex-1 pb-1">{student.grade || "الثالث المتوسط"}</span>
              </div>
              <div className="flex items-center mt-2">
                <span className="font-bold w-24 text-xs">الإدارة:</span>
                <span className="font-mono text-xs border-b border-black flex-1 pb-1">{phone}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
//  MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function PrintResults() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const queryClient = useQueryClient();

  // ─── State ─────────────────────────────────────────
  const [gradeFilter, setGradeFilter] = useState("all");
  const [termFilter, setTermFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [previewStudent, setPreviewStudent] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // Customization Controls
  const [selectedThemeId, setSelectedThemeId] = useState("green");
  const [printScope, setPrintScope] = useState("selected"); // 'single' | 'selected' | 'all'
  const [printSide, setPrintSide] = useState("front"); // 'front' | 'both'
  const [customSchoolName, setCustomSchoolName] = useState("");
  const [customLogo, setCustomLogo] = useState("");
  const [principalName, setPrincipalName] = useState("هند يوسف حماد علي");

  // ─── Queries ───────────────────────────────────────
  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ["print-results-students"],
    queryFn: () => entities.Student.list("full_name", 1000)
  });

  const { data: allGrades = [], isLoading: loadingGrades } = useQuery({
    queryKey: ["print-results-grades"],
    queryFn: () => entities.StudentGrade.list("-created_at", 5000)
  });

  const { data: allSubjects = [], isLoading: loadingSubjects } = useQuery({
    queryKey: ["print-results-subjects"],
    queryFn: () => entities.Subject.list()
  });

  const { data: attendanceRecords = [] } = useQuery({
    queryKey: ["print-results-attendance"],
    queryFn: () => entities.Attendance.list("-date", 5000)
  });

  const { data: settingsList = [] } = useQuery({
    queryKey: ["print-results-settings"],
    queryFn: () => entities.SystemSetting.list("-created_at", 1)
  });

  const existingSettings = settingsList.length > 0 ? settingsList[0] : null;

  // Initialize Custom Controls from DB Settings
  useEffect(() => {
    if (existingSettings) {
      if (existingSettings.school_name_ar) setCustomSchoolName(existingSettings.school_name_ar);
      if (existingSettings.school_logo) setCustomLogo(existingSettings.school_logo);
      if (existingSettings.principal_name) setPrincipalName(existingSettings.principal_name);
    } else if (!customSchoolName) {
      setCustomSchoolName("مدارس الأستاذ سمير القرآنية الخاصة");
    }
  }, [existingSettings]);

  // Save Settings Mutation to Neon DB
  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      const dataToSave = {
        school_name_ar: customSchoolName,
        school_logo: customLogo,
        principal_name: principalName
      };
      if (existingSettings?.id) {
        return await entities.SystemSetting.update(existingSettings.id, dataToSave);
      } else {
        return await entities.SystemSetting.create(dataToSave);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["print-results-settings"] });
      toast.success(isRTL ? "تم حفظ إعدادات اسم المدرسة والشعار بنجاح!" : "Settings saved successfully!");
    },
    onError: (err) => {
      console.error(err);
      toast.error(isRTL ? "فشل حفظ الإعدادات" : "Failed to save settings");
    }
  });

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      toast.error(isRTL ? "حجم الصورة يجب أن يكون أقل من 4 ميجابايت" : "Image size must be less than 4MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setCustomLogo(event.target.result);
      toast.success(isRTL ? "تم تحديث الشعار بنجاح" : "Logo updated");
    };
    reader.readAsDataURL(file);
  };

  // ─── Derived Data ──────────────────────────────────
  const activeTheme = useMemo(() => {
    return COLOR_THEMES.find(t => t.id === selectedThemeId) || COLOR_THEMES[0];
  }, [selectedThemeId]);

  const uniqueGrades = useMemo(() => {
    const gs = students.map(s => s.grade).filter(Boolean);
    return [...new Set(gs)].sort();
  }, [students]);

  const termLabels = {
    "all": isRTL ? "جميع الفصول" : "All Terms",
    "Term 1": isRTL ? "الفصل الأول" : "Term 1",
    "Term 2": isRTL ? "الفصل الثاني" : "Term 2",
    "Term 3": isRTL ? "الفصل الثالث" : "Term 3",
    "Final": isRTL ? "الامتحان النهائي" : "Final",
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesGrade = gradeFilter === "all" || s.grade === gradeFilter;
      const matchesSearch = !searchTerm ||
        (s.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.student_id || "").toLowerCase().includes(searchTerm.toLowerCase());
      return matchesGrade && matchesSearch;
    });
  }, [students, gradeFilter, searchTerm]);

  // ─── Aggregate Student Subjects & Grades ──────────────────
  const getStudentCompleteSubjectsAndGrades = (student) => {
    const sid = String(student.student_id || student.id);
    const studentGradeStr = String(student.grade || "").trim();
    const cleanGradeNum = studentGradeStr.replace(/\D/g, "");

    const studentGrades = allGrades.filter(g => {
      const gSid = String(g.student_id);
      const matchStudent = gSid === sid || gSid === String(student.id);
      const matchTerm = termFilter === "all" || g.term === termFilter;
      return matchStudent && matchTerm;
    });

    const gradeSubjects = allSubjects.filter(subj => {
      if (!subj.grade) return true;
      const subjGradeStr = String(subj.grade).trim();
      const subjCleanNum = subjGradeStr.replace(/\D/g, "");
      return subjGradeStr === studentGradeStr || (cleanGradeNum && subjCleanNum === cleanGradeNum);
    });

    const resultList = [];
    const processedNames = new Set();

    gradeSubjects.forEach(subj => {
      const sName = subj.name;
      processedNames.add(sName.toLowerCase());

      const matchingGrade = studentGrades.find(g => {
        const gSubjName = (g.subject_name || "").split(" - ")[0].trim();
        return gSubjName.toLowerCase() === sName.toLowerCase();
      });

      if (matchingGrade) {
        resultList.push({
          id: matchingGrade.id,
          subject_name: sName,
          score: matchingGrade.score,
          max_score: matchingGrade.max_score || 40,
          grade_label: matchingGrade.grade_label,
          term: matchingGrade.term || (termFilter !== "all" ? termFilter : "الفصل الأول"),
          teacher_name: matchingGrade.teacher_name || subj.teacher_name || "—",
          notes: matchingGrade.notes || "",
          has_grade: true
        });
      } else {
        resultList.push({
          id: `subj-${subj.id}`,
          subject_name: sName,
          score: null,
          max_score: 40,
          grade_label: "—",
          term: termFilter !== "all" ? termFilter : "—",
          teacher_name: subj.teacher_name || "—",
          notes: "لم ترصد بعد",
          has_grade: false
        });
      }
    });

    studentGrades.forEach(g => {
      const gSubjName = (g.subject_name || "").split(" - ")[0].trim();
      if (!processedNames.has(gSubjName.toLowerCase())) {
        processedNames.add(gSubjName.toLowerCase());
        resultList.push({
          id: g.id,
          subject_name: g.subject_name,
          score: g.score,
          max_score: g.max_score || 40,
          grade_label: g.grade_label,
          term: g.term || "الفصل الأول",
          teacher_name: g.teacher_name || "—",
          notes: g.notes || "",
          has_grade: true
        });
      }
    });

    return resultList;
  };

  const getAbsenceCount = (student) => {
    const sid = String(student.student_id || student.id);
    return attendanceRecords.filter(a => {
      const aSid = String(a.student_id);
      return (aSid === sid || aSid === String(student.id)) && a.status === "absent";
    }).length;
  };

  // ─── Handlers ──────────────────────────────────────
  const toggleStudent = (studentId) => {
    setSelectedStudents(prev =>
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    );
  };

  const selectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s.id));
    }
  };

  const handlePreview = (student) => {
    setPreviewStudent(student);
    setShowPreview(true);
  };

  const handlePrint = (overrideTargetStudents = null) => {
    let studentsToPrint = [];

    if (overrideTargetStudents) {
      studentsToPrint = overrideTargetStudents;
    } else if (printScope === "single" && previewStudent) {
      studentsToPrint = [previewStudent];
    } else if (printScope === "all") {
      studentsToPrint = filteredStudents;
    } else {
      studentsToPrint = selectedStudents.length > 0
        ? students.filter(s => selectedStudents.includes(s.id))
        : previewStudent ? [previewStudent] : [];
    }

    if (studentsToPrint.length === 0) {
      toast.error(isRTL ? "يرجى اختيار طالب واحد على الأقل للطباعة" : "Please select at least one student");
      return;
    }

    const termLabel = termFilter !== "all" ? termLabels[termFilter] : (isRTL ? "الفصل الأول" : "Term 1");
    const sName = customSchoolName || "مدارس الأستاذ سمير القرآنية الخاصة";
    const sLogo = customLogo || "";
    const pName = principalName || "هند يوسف حماد علي";

    let certificatesHTML = "";
    studentsToPrint.forEach((student) => {
      const items = getStudentCompleteSubjectsAndGrades(student);
      const absences = getAbsenceCount(student);
      const gradedItems = items.filter(i => i.has_grade && i.score !== null);
      const totalScore = gradedItems.reduce((s, i) => s + Number(i.score || 0), 0);
      const totalMax = items.reduce((s, i) => s + Number(i.max_score || 100), 0);
      const totalMin = Math.round(totalMax / 2);
      const overallPct = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
      const overallGrade = getGradeLabelClassic(gradedItems.length > 0 ? overallPct : null);
      const totalInWords = numToArabicWords(gradedItems.length > 0 ? totalScore : null);

      let thSubjects = "";
      let tdMax = "";
      let tdMin = "";
      let tdScores = "";

      items.forEach(item => {
        const hasScore = item.has_grade && item.score !== null;
        thSubjects += `<th style="border-color:${activeTheme.border}">${item.subject_name}</th>`;
        tdMax += `<td class="font-mono" style="border-color:${activeTheme.border}">${item.max_score || 40}</td>`;
        tdMin += `<td class="font-mono" style="border-color:${activeTheme.border}">${Math.round((item.max_score || 40) / 2)}</td>`;
        tdScores += `<td class="font-mono font-bold" style="border-color:${activeTheme.border}">${hasScore ? item.score : '<span style="color:#9ca3af;font-size:10px">غ/م</span>'}</td>`;
      });

      // PAGE 1: MARKSHEET FRONT (كشف الدرجات الشامل بالجدول الأفقي المحوري)
      certificatesHTML += `
        <div class="pro-cert-page-landscape" style="background-color:${activeTheme.bg};color:${activeTheme.text}">
          <div class="pro-marksheet-border" style="border-color:${activeTheme.border}">
            <div class="marksheet-inner-flex">
              <div class="pro-header-grid">
                <div class="header-box-side flex flex-col items-center justify-center text-center" style="border-color:${activeTheme.border}">
                  <p class="font-bold text-[12px] leading-snug">جمهورية السودان</p>
                  <p class="font-bold text-[12px] leading-snug">ولاية الخرطوم</p>
                  <p class="font-bold text-[11px] leading-snug">وزارة التربية والتعليم</p>
                  <p class="font-bold text-[10px] leading-snug">التعليم الخاص</p>
                </div>
                <div class="header-box-center text-center">
                  <div class="bismillah-calligraphy text-sm font-bold">بسم الله الرحمن الرحيم</div>
                  <h1 class="pro-school-title text-2xl font-black my-0.5" style="color:${activeTheme.border}">${sName}</h1>
                  <p class="font-bold text-xs tracking-wide">إبتدائي ومتوسط (بنين - بنات)</p>
                </div>
                <div class="header-box-side flex items-center justify-center p-1" style="border-color:${activeTheme.border}">
                  ${sLogo ? `<img src="${sLogo}" class="pro-logo-img" />` : `<div class="pro-logo-badge" style="border-color:${activeTheme.border}"><span>شعار المدرسة</span></div>`}
                </div>
              </div>

              <div class="pro-meta-bar" style="border-color:${activeTheme.border}">
                <div class="meta-left space-y-1">
                  <p><span class="lbl font-bold">نتيجة الامتحان للفترة :</span> <span class="val">${termLabel}</span></p>
                  <p><span class="lbl font-bold">العام الدراســـــــــــي :</span> <span class="val font-mono">2025/2026م</span></p>
                  <p><span class="lbl font-bold">الاســــــــــــــــــــــم :</span> <span class="val font-bold text-sm">${student.full_name || student.name}</span></p>
                </div>
                <div class="meta-right space-y-1 text-left">
                  <p><span class="lbl font-bold">الصــــــــــف :</span> <span class="val font-bold">${student.grade || "الثالث المتوسط"}</span></p>
                  <p><span class="lbl font-bold">التقــديـــر :</span> <span class="val font-bold" style="color:${overallGrade.color}">${overallGrade.label}</span></p>
                </div>
              </div>

              <div class="pro-table-wrapper">
                <table class="pro-horizontal-table" style="border-color:${activeTheme.border}">
                  <thead><tr style="background-color:rgba(0,0,0,0.04)"><th class="th-label-side" style="border-color:${activeTheme.border}">الـمـواد</th>${thSubjects}<th class="th-total-col" style="border-color:${activeTheme.border}">الـمـجـمـوع</th></tr></thead>
                  <tbody>
                    <tr><td class="td-label-side" style="border-color:${activeTheme.border}">الـقـصــــــوى</td>${tdMax}<td class="font-mono font-bold td-total-col" style="border-color:${activeTheme.border}">${totalMax}</td></tr>
                    <tr><td class="td-label-side" style="border-color:${activeTheme.border}">الـصـغــــــرى</td>${tdMin}<td class="font-mono font-bold td-total-col" style="border-color:${activeTheme.border}">${totalMin}</td></tr>
                    <tr class="tr-scores-row"><td class="td-label-side font-bold" style="border-color:${activeTheme.border}">درجات التلميذ</td>${tdScores}<td class="font-mono font-black text-sm td-total-col" style="border-color:${activeTheme.border}">${gradedItems.length > 0 ? totalScore : '—'}</td></tr>
                  </tbody>
                </table>
              </div>

              <div class="pro-bottom-grid">
                <div class="details-col space-y-1.5">
                  <p class="detail-line"><span class="lbl font-bold">المجمـوع بالحــروف :</span> <span class="val font-bold">${totalInWords}</span></p>
                  <p class="detail-line"><span class="lbl font-bold">درجــة النـجــــــــاح :</span> <span class="val text-[11px]">أي مادة = 50% من الدرجة الكاملة (نصف الدرجة الكاملة)</span></p>
                  <p class="detail-line"><span class="lbl font-bold">إسم مدير المدرسة :</span> <span class="val font-bold">${pName}</span></p>
                  <p class="detail-line"><span class="lbl font-bold">تاريخ إصدار النتيجة :</span> <span class="val font-mono">${new Date().toLocaleDateString('ar-SA')}م</span></p>
                  <p class="detail-line"><span class="lbl font-bold">تاريخ إستئناف الدراسة :</span> <span class="val font-mono">2026/09/01م</span></p>
                  <div class="stamp-overlay-pos"><div class="stamp-circle" style="color:${activeTheme.stamp};border-color:${activeTheme.stamp}"><span class="font-bold text-[10px]">ختم المدرسة</span><span style="font-size:7px;display:block">مصادق عليه</span></div></div>
                </div>

                <div class="left-col space-y-2">
                  <table class="absence-mini-table" style="border-color:${activeTheme.border}">
                    <thead><tr><th style="border-color:${activeTheme.border}">عدد أيام السنة</th><th style="border-color:${activeTheme.border}">عدد أيام الغياب</th><th style="border-color:${activeTheme.border}">بعذر مقبول</th><th style="border-color:${activeTheme.border}">بدون عذر</th></tr></thead>
                    <tbody><tr><td class="font-mono" style="border-color:${activeTheme.border}">180</td><td class="font-mono font-bold" style="border-color:${activeTheme.border}">${absences}</td><td class="font-mono" style="border-color:${activeTheme.border}">${Math.min(absences, 2)}</td><td class="font-mono" style="border-color:${activeTheme.border}">${Math.max(0, absences - 2)}</td></tr></tbody>
                  </table>
                  <div class="advisor-remarks-box" style="border-color:${activeTheme.border}">
                    <p class="font-bold text-xs">ملاحظات مرشد الصف :</p>
                    <p class="text-xs mt-1 leading-relaxed">${gradedItems.length > 0 ? (overallPct >= 85 ? "تلميذ منضبط وممتاز أكاديمياً وخلقياً. نتمنى له مزيداً من التقدم والاجتهاد." : "أداء جيد نوصي بمواصلة الاجتهاد والمتابعة الدورية.") : "جاري استكمال رصد باقي المواد."}</p>
                    <div class="advisor-sig-row flex justify-between text-xs mt-2"><span>التوقيع :</span><span class="border-b border-black w-28 text-center font-bold">مرشد الصف</span></div>
                  </div>
                </div>
              </div>

              <div class="pro-footer-warning text-center font-bold text-xs pt-1">(أ ي   كـشـط   أ و   تـعـد يـل   يـلـغـي   هـذ ه   ا لـشـهـا د ة)</div>
            </div>
          </div>
        </div>`;

      // PAGE 2: COVER BACK (If printSide === 'both')
      if (printSide === 'both') {
        certificatesHTML += `
          <div class="pro-cert-page-landscape" style="background-color:${activeTheme.bg};color:${activeTheme.text}">
            <div class="pro-cover-grid">
              <div class="pro-rounded-panel" style="border-color:${activeTheme.border}"><div class="panel-inner flex flex-col justify-between h-full">
                <ul class="pro-bullet-list space-y-1">
                  <li>عود إبنك الصدق والصلاة ومكارم الأخلاق</li>
                  <li>تأكد من صداقة إبنك للأخيار</li>
                  <li>زيارتك للمدرسة مهمة لأنها تكمل دور المدرسة العلمية والتربوية</li>
                </ul>
                <div class="pro-ribbon-banner"><span class="ribbon-tail-r" style="border-right-color:${activeTheme.border}"></span><span class="ribbon-text" style="border-color:${activeTheme.border}">إبـنـنـا التـلـمـيـذ</span><span class="ribbon-tail-l" style="border-left-color:${activeTheme.border}"></span></div>
                <ul class="pro-bullet-list space-y-1">
                  <li>حافظ على صلواتك ودوام على تلاوة القرآن.</li>
                  <li>إجتهد في دراستك فلكل مجتهد نصيب.</li>
                  <li>إحترام المعلم واجب.</li>
                </ul>
                <div class="pro-scroll-banner" style="border-color:${activeTheme.border}"><span>كـاد الـمـعـلـم أن يـكـون ر سـو لاً</span></div>
                <div class="flex justify-center my-1"><div class="pro-hexagon-badge" style="border-color:${activeTheme.border}"><span>التقدير</span></div></div>
                <ul class="pro-bullet-list scale-list space-y-0.5 text-xs">
                  <li>من 90% إلى 100% ممتاز.</li>
                  <li>أقل من 90% إلى 75% جيد جداً.</li>
                  <li>أقل من 75% إلى 60% جـيـد.</li>
                  <li>أقل من 60% إلى 50% مقبول.</li>
                  <li>أقل من 50% ضعــيف.</li>
                </ul>
              </div></div>
              <div class="pro-rounded-panel" style="border-color:${activeTheme.border}"><div class="panel-inner text-center flex flex-col justify-between h-full">
                <div>
                  <div class="bismillah-calligraphy text-base font-bold">بسم الله الرحمن الرحيم</div>
                  <div class="text-center mt-2 leading-snug"><p class="font-bold text-xs">جمهورية السودان</p><p class="font-bold text-sm">ولاية الخرطوم – محلية الشهداء وسوبا</p><p class="font-bold text-xs">وزارة التربية والتعليم – إدارة التعليم الخاص</p></div>
                </div>
                <div class="my-3">
                  <h2 class="pro-school-title text-2xl font-black" style="color:${activeTheme.border}">${sName}</h2>
                  <p class="font-bold text-sm mt-1">الإبـتـدائـيـة والـمـتـوسـطـة</p>
                  <p class="font-bold text-xs mt-0.5">بـنـيـن – بـنـات</p>
                </div>
                <div class="pro-scroll-banner main-title-scroll" style="border-color:${activeTheme.border}"><span>نـتـيـجـة الـمـقـر ر ا ت الـدر ا سـيـة</span></div>
                <div class="pro-student-cover-info text-right w-11/12 mx-auto space-y-2">
                  <div class="flex items-center"><span class="font-bold w-24 text-sm">اسم التلميـذ/</span><span class="font-bold text-base border-b-2 border-black flex-1 pb-1">${student.full_name || student.name}</span></div>
                  <div class="flex items-center"><span class="font-bold w-24 text-sm">الصــــــــــف/</span><span class="font-bold text-base border-b-2 border-black flex-1 pb-1">${student.grade || "الثالث المتوسط"}</span></div>
                  <div class="flex items-center mt-2"><span class="font-bold w-24 text-xs">الإدارة:</span><span class="font-mono text-xs border-b border-black flex-1 pb-1">0123109370 / 0116375406</span></div>
                </div>
              </div></div>
            </div>
          </div>`;
      }
    });

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8"/>
<title>شهادات النتائج الرسمية - ${sName}</title>
<style>${PRO_CERTIFICATE_PRINT_CSS}</style>
</head>
<body>${certificatesHTML}
<script>window.onload=function(){window.print();}<\/script>
</body></html>`);
    printWindow.document.close();
  };

  const isLoading = loadingStudents || loadingGrades || loadingSubjects;
  const currentTermLabel = termFilter !== "all" ? termLabels[termFilter] : (isRTL ? "الفصل الأول" : "Term 1");

  const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all border-2 border-stone-200 bg-white text-stone-800 hover:bg-stone-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
  const btnPrimary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-emerald-700 text-white hover:bg-emerald-800 cursor-pointer shadow-lg shadow-emerald-700/20 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="space-y-6 pb-20" dir={isRTL ? "rtl" : "ltr"}>
      <PageHeader
        title={isRTL ? "مصمم ومحرك طباعة الشهادات المدرسية الرسمية" : "Official Certificate Designer & Print Engine"}
        subtitle={isRTL ? "تحكم كامل بتصميم الشهادة الأفقية، ألوان المطبوعات، الشعار، اسم المدرسة وطباعة الطالب/المجموعة/الصف" : "Customize logo, school name, colors, and print certificates by student, group or grade"}
      >
        <div className="flex gap-3 items-center">
          <button
            onClick={() => handlePrint()}
            disabled={selectedStudents.length === 0 && printScope === "selected"}
            className={`${btnPrimary} h-11 px-6`}
          >
            <Printer size={18} />
            <span>
              {printScope === "all"
                ? (isRTL ? `طباعة الصف كاملاً (${filteredStudents.length})` : `Print All Grade (${filteredStudents.length})`)
                : (isRTL ? `طباعة الطلاب المحددون (${selectedStudents.length})` : `Print Selected (${selectedStudents.length})`)
              }
            </span>
          </button>
        </div>
      </PageHeader>

      {/* ── CUSTOMIZATION TOOLBAR (أدوات تخصيص الشهادة) ── */}
      <Card className="p-6 bg-white border border-stone-200/80 shadow-sm rounded-3xl space-y-6">
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Palette size={18} />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-sm">{isRTL ? "أدوات تخصيص وتصميم الشهادة" : "Certificate Design & Customization"}</h3>
              <p className="text-xs text-stone-400">{isRTL ? "تعديل اسم المدرسة، رفع الشعار، اختيار الألوان ونطاق الطباعة" : "Customize school branding, theme palette, and print scope"}</p>
            </div>
          </div>

          <button
            onClick={() => saveSettingsMutation.mutate()}
            disabled={saveSettingsMutation.isPending}
            className={`${btnOutline} h-9 px-4 text-xs font-bold text-emerald-700 border-emerald-200 hover:bg-emerald-50`}
          >
            <Save size={14} />
            <span>{saveSettingsMutation.isPending ? (isRTL ? "جاري الحفظ..." : "Saving...") : (isRTL ? "حفظ الإعدادات كافتراضية" : "Save Defaults")}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* School Name & Principal Input */}
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "اسم المدرسة الرسمي *" : "Official School Name *"}</label>
              <Input
                value={customSchoolName}
                onChange={(e) => setCustomSchoolName(e.target.value)}
                placeholder={isRTL ? "مدارس الأستاذ سمير القرآنية الخاصة..." : "School name..."}
                className="h-10 rounded-xl border-stone-200 text-xs font-bold bg-stone-50/50"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "اسم مدير المدرسة *" : "School Principal Name *"}</label>
              <Input
                value={principalName}
                onChange={(e) => setPrincipalName(e.target.value)}
                placeholder={isRTL ? "هند يوسف حماد علي..." : "Principal Name..."}
                className="h-10 rounded-xl border-stone-200 text-xs font-bold bg-stone-50/50"
              />
            </div>
          </div>

          {/* Logo Uploader */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "شعار المدرسة بالشهادة" : "School Logo"}</label>
            <div className="flex items-center gap-4 bg-stone-50 p-3 rounded-2xl border border-stone-100">
              {customLogo ? (
                <img src={customLogo} alt="Logo" className="h-14 w-14 object-contain rounded-xl border border-stone-200 bg-white p-1" />
              ) : (
                <div className="h-14 w-14 rounded-xl border-2 border-dashed border-stone-300 bg-white flex items-center justify-center text-stone-300 font-bold text-[10px] text-center p-1">
                  بلا شعار
                </div>
              )}
              <div className="flex-1 space-y-1.5">
                <label className={`${btnOutline} h-9 px-3 text-xs w-full cursor-pointer`}>
                  <Upload size={14} />
                  <span>{isRTL ? "تغيير الشعار..." : "Upload Logo"}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                </label>
                {customLogo && (
                  <button onClick={() => setCustomLogo("")} className="text-[10px] text-rose-500 font-bold hover:underline block">
                    {isRTL ? "إزالة الشعار" : "Remove Logo"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Color Themes & Print Scope */}
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "لون ونمط الشهادة" : "Certificate Color Theme"}</label>
              <div className="grid grid-cols-2 gap-2">
                {COLOR_THEMES.map(theme => (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedThemeId(theme.id)}
                    className={`h-9 px-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${selectedThemeId === theme.id ? "border-emerald-700 bg-emerald-50 text-emerald-950 shadow-sm" : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"}`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-full border border-black/20" style={{ backgroundColor: theme.bg }} />
                      {theme.name.split(" ")[0]}
                    </span>
                    {selectedThemeId === theme.id && <Check size={14} className="text-emerald-700" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-stone-400 uppercase">{isRTL ? "نطاق الطباعة" : "Print Scope"}</label>
                <select
                  value={printScope}
                  onChange={(e) => setPrintScope(e.target.value)}
                  className="bg-stone-50 border border-stone-200 rounded-xl h-9 px-2 text-xs font-bold focus:outline-none"
                  dir={isRTL ? "rtl" : "ltr"}
                >
                  <option value="selected">{isRTL ? "الطلاب المحددون فقط" : "Selected Students"}</option>
                  <option value="all">{isRTL ? "الصف كُله (الكل)" : "Entire Class"}</option>
                  <option value="single">{isRTL ? "طالب واحد (المعاينة)" : "Single Student"}</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-stone-400 uppercase">{isRTL ? "أوجه الشهادة" : "Print Sides"}</label>
                <select
                  value={printSide}
                  onChange={(e) => setPrintSide(e.target.value)}
                  className="bg-stone-50 border border-stone-200 rounded-xl h-9 px-2 text-xs font-bold focus:outline-none"
                  dir={isRTL ? "rtl" : "ltr"}
                >
                  <option value="front">{isRTL ? "الوجه الأمامي (كشف الدرجات)" : "Front Marksheet Only"}</option>
                  <option value="both">{isRTL ? "الجهتان (الأمامي والخلفي على عرض الورقة)" : "Both Sides (Landscape A4)"}</option>
                </select>
              </div>
            </div>
          </div>

        </div>
      </Card>

      {/* Filters & Students Table */}
      <Card className="p-6 bg-white border border-stone-200/80 shadow-sm rounded-3xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-stone-400`} size={16} />
            <Input
              placeholder={isRTL ? "ابحث باسم الطالب أو الرقم المدرسي..." : "Search student..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} bg-stone-50/50 border-stone-200 rounded-xl h-11 text-xs`}
            />
          </div>

          <select
            value={gradeFilter}
            onChange={(e) => { setGradeFilter(e.target.value); setSelectedStudents([]); }}
            className="bg-stone-50 border border-stone-200 rounded-xl h-11 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
            dir={isRTL ? "rtl" : "ltr"}
          >
            <option value="all">{isRTL ? "جميع الصفوف" : "All Grades"}</option>
            {uniqueGrades.map(g => (
              <option key={g} value={g}>{isRTL ? `الصف ${g}` : `Grade ${g}`}</option>
            ))}
          </select>

          <select
            value={termFilter}
            onChange={(e) => setTermFilter(e.target.value)}
            className="bg-stone-50 border border-stone-200 rounded-xl h-11 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
            dir={isRTL ? "rtl" : "ltr"}
          >
            {Object.entries(termLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between border-t border-stone-100 pt-4">
          <div className="flex items-center gap-4">
            <button onClick={selectAll} className={`${btnOutline} h-9 px-4 text-xs`}>
              <CheckCircle2 size={14} />
              {selectedStudents.length === filteredStudents.length
                ? (isRTL ? "إلغاء تحديد الكل" : "Deselect All")
                : (isRTL ? "تحديد الكل" : "Select All")
              }
            </button>
            <span className="text-xs text-stone-400 font-bold">
              {isRTL
                ? `${filteredStudents.length} طالب في القائمة | ${selectedStudents.length} محدد للطباعة الجماعية`
                : `${filteredStudents.length} students | ${selectedStudents.length} selected`
              }
            </span>
          </div>

          {selectedStudents.length > 0 && (
            <button
              onClick={() => handlePrint()}
              className={`${btnPrimary} h-9 px-4 text-xs`}
            >
              <Printer size={14} />
              {isRTL ? `طباعة نتيجة المحددون (${selectedStudents.length})` : `Print Selected (${selectedStudents.length})`}
            </button>
          )}
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="w-full py-16 text-center text-stone-500">
            <div className="flex items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-800" />
              <span>{isRTL ? "جاري تجميع درجات ومواد الطلاب..." : "Loading marksheets..."}</span>
            </div>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-16 text-center text-stone-400 border border-dashed border-stone-100 rounded-3xl">
            <Users size={40} className="opacity-20 mx-auto mb-2" />
            <p className="font-bold text-base">{isRTL ? "لا يوجد طلاب يطابقون معايير البحث" : "No students found"}</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-stone-100">
            <table className="w-full text-sm">
              <thead className="bg-stone-50/70">
                <tr>
                  <th className="py-3 px-4 text-center w-[50px]">
                    <Checkbox
                      checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                      onCheckedChange={selectAll}
                    />
                  </th>
                  <th className="py-3 px-4 text-start text-[10px] font-black uppercase tracking-widest text-stone-400">#</th>
                  <th className="py-3 px-4 text-start text-[10px] font-black uppercase tracking-widest text-stone-400">{isRTL ? "اسم الطالب" : "Student Name"}</th>
                  <th className="py-3 px-4 text-start text-[10px] font-black uppercase tracking-widest text-stone-400">{isRTL ? "الرقم المدرسي" : "ID"}</th>
                  <th className="py-3 px-4 text-center text-[10px] font-black uppercase tracking-widest text-stone-400">{isRTL ? "الصف الدراسي" : "Grade"}</th>
                  <th className="py-3 px-4 text-center text-[10px] font-black uppercase tracking-widest text-stone-400">{isRTL ? "المواد المرصودة" : "Graded Subjects"}</th>
                  <th className="py-3 px-4 text-center text-[10px] font-black uppercase tracking-widest text-stone-400">{isRTL ? "المجموع والتقدير" : "Total & Grade"}</th>
                  <th className="py-3 px-4 text-center text-[10px] font-black uppercase tracking-widest text-stone-400 w-[140px]">{isRTL ? "معاينة وطباعة" : "Actions"}</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s, idx) => {
                  const items = getStudentCompleteSubjectsAndGrades(s);
                  const gradedItems = items.filter(i => i.has_grade && i.score !== null);
                  const isSelected = selectedStudents.includes(s.id);
                  const totalS = gradedItems.reduce((sum, g) => sum + Number(g.score || 0), 0);
                  const totalM = items.reduce((sum, g) => sum + Number(g.max_score || 100), 0);
                  const avg = totalM > 0 ? Math.round((totalS / totalM) * 100) : 0;
                  const gl = getGradeLabelClassic(gradedItems.length > 0 ? avg : null);

                  return (
                    <tr
                      key={s.id}
                      className={`border-t border-stone-50 hover:bg-stone-50/30 transition-colors ${isSelected ? "bg-emerald-50/40" : ""}`}
                    >
                      <td className="py-3 px-4 text-center">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleStudent(s.id)}
                        />
                      </td>
                      <td className="py-3 px-4 text-stone-400 font-mono text-xs">{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-stone-900 text-xs">{s.full_name || s.name}</td>
                      <td className="py-3 px-4 font-mono text-stone-500 text-xs">#{s.student_id || s.id}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge className="bg-stone-100 text-stone-700 border-none font-bold text-[10px] rounded-lg">{s.grade || "—"}</Badge>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-xs">
                        <span className="font-bold text-emerald-700">{gradedItems.length}</span> / <span className="text-stone-600">{items.length} مادة</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {gradedItems.length > 0 ? (
                          <Badge className={`border-none font-black text-[10px] rounded-lg ${
                            avg >= 85 ? "bg-emerald-50 text-emerald-700" :
                            avg >= 75 ? "bg-blue-50 text-blue-700" :
                            avg >= 50 ? "bg-amber-50 text-amber-700" :
                            "bg-rose-50 text-rose-700"
                          }`}>
                            {totalS} / {totalM} — {gl.label}
                          </Badge>
                        ) : (
                          <span className="text-stone-400 text-xs">قيد الرصد</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handlePreview(s)}
                            className="h-8 px-2.5 rounded-lg text-xs font-semibold text-emerald-800 hover:bg-emerald-50 transition-colors inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Eye size={13} />
                            {isRTL ? "معاينة" : "Preview"}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedStudents([s.id]);
                              handlePrint([s]);
                            }}
                            className="h-8 w-8 rounded-lg text-stone-600 hover:bg-stone-100 transition-colors inline-flex items-center justify-center cursor-pointer"
                            title={isRTL ? "طباعة شهادة هذا الطالب فقط" : "Print single"}
                          >
                            <Printer size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Preview Dialog (PRO LANDSCAPE) */}
      {showPreview && previewStudent && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 backdrop-blur-md overflow-y-auto py-6 no-print" onClick={() => setShowPreview(false)}>
          <div className="relative max-w-[1150px] w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md rounded-2xl p-4 mb-4 flex items-center justify-between shadow-2xl border border-stone-200">
              <div className="flex items-center gap-3">
                <Eye size={20} className="text-emerald-800" />
                <div>
                  <h3 className="font-bold text-stone-900 text-sm">
                    {isRTL ? `معاينة النتيجة الرسمية: ${previewStudent.full_name || previewStudent.name}` : `Preview: ${previewStudent.full_name || previewStudent.name}`}
                  </h3>
                  <p className="text-xs text-stone-500">
                    {isRTL ? `الصف: ${previewStudent.grade || "الثالث المتوسط"} | المدرسة: ${customSchoolName}` : `School: ${customSchoolName}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handlePrint([previewStudent]);
                  }}
                  className={`${btnPrimary} h-9 px-5 text-xs`}
                >
                  <Printer size={15} />
                  {isRTL ? "طباعة هذه الشهادة الأفقية" : "Print This"}
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  className="h-9 w-9 rounded-xl bg-stone-100 text-stone-600 hover:bg-stone-200 flex items-center justify-center cursor-pointer transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Page 1: MARKSHEET FRONT */}
            <div className="mb-6 shadow-2xl rounded-xl overflow-hidden bg-white">
              <div className="bg-stone-900 text-white px-4 py-2 text-xs font-bold text-center flex justify-between items-center">
                <span>الوجه الأمامي للشهادة المطبوعة (كشف الدرجات الشامل بالجدول الأفقي المحوري على عرض الورقة)</span>
                <span className="text-[10px] opacity-75">A4 Landscape</span>
              </div>
              <CertificateMarksheetFront
                student={previewStudent}
                items={getStudentCompleteSubjectsAndGrades(previewStudent)}
                attendanceCount={getAbsenceCount(previewStudent)}
                schoolName={customSchoolName}
                schoolLogo={customLogo}
                theme={activeTheme}
                termLabel={currentTermLabel}
                principalName={principalName}
              />
            </div>

            {/* Page 2: MARKSHEET BACK (Cover/Guidance - Dual Rounded Panels Landscape) */}
            {printSide === 'both' && (
              <div className="shadow-2xl rounded-xl overflow-hidden bg-white">
                <div className="bg-stone-900 text-white px-4 py-2 text-xs font-bold text-center flex justify-between items-center">
                  <span>الوجه الخلفي للشهادة المطبوعة (غلاف المقررات والإرشادات والسلم على عرض الورقة)</span>
                  <span className="text-[10px] opacity-75">A4 Landscape</span>
                </div>
                <CertificateCoverBack
                  student={previewStudent}
                  schoolName={customSchoolName}
                  theme={activeTheme}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
//  HIGH PRECISION A4 LANDSCAPE PRINT CSS
// ═══════════════════════════════════════════════════════════════
const PRO_CERTIFICATE_PRINT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Noto+Naskh+Arabic:wght@400;500;600;700;800&display=swap');

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: 'Noto Naskh Arabic', 'Amiri', 'Traditional Arabic', serif;
  direction: rtl;
  background: #ffffff;
  color: #000000;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}

.pro-cert-page-landscape {
  width: 297mm;
  height: 210mm;
  min-height: 210mm;
  margin: 0 auto;
  padding: 6mm;
  box-sizing: border-box;
  page-break-after: always;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* MARKSHEET BORDER */
.pro-marksheet-border {
  border: 2.5px solid #000000;
  border-radius: 14px;
  padding: 10px 14px;
  height: 100%;
  box-sizing: border-box;
}

.marksheet-inner-flex {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

/* HEADER GRID */
.pro-header-grid {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.header-box-side {
  border: 2px solid #000;
  border-radius: 10px;
  padding: 6px 10px;
  width: 170px;
  height: 72px;
  box-sizing: border-box;
  background: rgba(0,0,0,0.01);
}

.header-box-center {
  flex: 1;
  text-align: center;
  padding: 0 10px;
}

.bismillah-calligraphy {
  font-family: 'Amiri', serif;
  font-size: 15px;
  font-weight: 700;
}

.pro-school-title {
  font-family: 'Amiri', serif;
  font-size: 22px;
  font-weight: 900;
  line-height: 1.2;
}

.pro-logo-img {
  max-height: 60px;
  max-width: 140px;
  object-fit: contain;
}

.pro-logo-badge {
  width: 100%;
  height: 100%;
  border: 1.5px solid #000;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: 10px;
  font-weight: 800;
}

.pro-meta-bar {
  display: flex;
  justify-content: space-between;
  border-bottom: 1.5px solid #000;
  padding-bottom: 4px;
  margin-bottom: 6px;
}

.meta-left p, .meta-right p {
  font-size: 12.5px;
}

/* HORIZONTAL TABLE (المواد بالأفق والصفوف بالرأس) */
.pro-table-wrapper {
  margin-bottom: 6px;
}

.pro-horizontal-table {
  width: 100%;
  border-collapse: collapse;
  border: 2px solid #000;
  text-align: center;
}

.pro-horizontal-table th,
.pro-horizontal-table td {
  border: 1.5px solid #000;
  padding: 5px 3px;
  font-size: 11.5px;
}

.pro-horizontal-table th {
  font-weight: 900;
  background: rgba(0,0,0,0.03);
  font-size: 12px;
}

.th-label-side, .td-label-side {
  font-weight: 900;
  width: 115px;
  background: rgba(0,0,0,0.04);
}

.th-total-col, .td-total-col {
  width: 85px;
  background: rgba(0,0,0,0.05);
}

.tr-scores-row td {
  font-size: 13px;
}

/* BOTTOM GRID */
.pro-bottom-grid {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 2px;
}

.details-col {
  width: 55%;
  position: relative;
}

.detail-line {
  font-size: 11.5px;
  display: flex;
  align-items: center;
  margin-bottom: 3px;
}

.detail-line .lbl {
  width: 145px;
}

.detail-line .val {
  flex: 1;
}

.stamp-overlay-pos {
  position: absolute;
  left: 20px;
  bottom: 0;
}

.stamp-circle {
  width: 72px;
  height: 72px;
  border: 2px solid #1e3a8a;
  border-radius: 50%;
  color: #1e3a8a;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transform: rotate(-12deg);
  opacity: 0.85;
}

.left-col {
  width: 42%;
}

.absence-mini-table {
  width: 100%;
  border-collapse: collapse;
  border: 1.5px solid #000;
  text-align: center;
}

.absence-mini-table th,
.absence-mini-table td {
  border: 1px solid #000;
  padding: 3px;
  font-size: 10px;
}

.absence-mini-table th {
  font-weight: 700;
  background: rgba(0,0,0,0.03);
}

.advisor-remarks-box {
  border: 1.5px solid #000;
  border-radius: 8px;
  padding: 6px 8px;
  min-height: 68px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

/* COVER PANELS (الوجه الخلفي على عرض الورقة) */
.pro-cover-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10mm;
  height: 100%;
  box-sizing: border-box;
}

.pro-rounded-panel {
  border: 2.5px solid #000000;
  border-radius: 26px;
  padding: 12px 16px;
  height: 100%;
  box-sizing: border-box;
}

.pro-bullet-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.pro-bullet-list li {
  font-size: 12.5px;
  font-weight: 700;
  line-height: 1.7;
  position: relative;
  padding-right: 16px;
}

.pro-bullet-list li::before {
  content: "•";
  position: absolute;
  right: 0;
  font-size: 15px;
  font-weight: 900;
}

.pro-ribbon-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 6px 0;
}

.ribbon-text {
  border: 1.5px solid #000;
  padding: 2px 20px;
  font-size: 13px;
  font-weight: 900;
}

.ribbon-tail-r, .ribbon-tail-l {
  width: 0;
  height: 0;
  border-top: 10px solid transparent;
  border-bottom: 10px solid transparent;
}
.ribbon-tail-r { border-right: 10px solid #000; }
.ribbon-tail-l { border-left: 10px solid #000; }

.pro-scroll-banner {
  border: 1.5px solid #000;
  border-radius: 6px;
  padding: 4px 12px;
  text-align: center;
  font-size: 13px;
  font-weight: 900;
  margin: 4px 0;
}

.main-title-scroll {
  font-size: 15px;
  padding: 5px 18px;
  margin: 10px auto;
  width: 75%;
}

.pro-hexagon-badge {
  border: 1.5px solid #000;
  padding: 2px 18px;
  font-size: 12px;
  font-weight: 900;
  clip-path: polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%);
}

@media print {
  body { background: #fff; }
  .pro-cert-page-landscape {
    page-break-after: always;
    margin: 0;
    padding: 5mm;
  }
}

@page {
  size: A4 landscape;
  margin: 0;
}
`;
