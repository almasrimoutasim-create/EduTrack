import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/dbClient";
import {
  Printer, Search, Eye, Users, Award, CheckCircle2,
  BookOpen, Sparkles, SlidersHorizontal, Info, Upload,
  Palette, RefreshCw, FileText, Check, Settings, Save,
  FileCheck, ShieldCheck, Download, Layout, LayoutGrid, CheckSquare,
  ChevronDown
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useLanguage } from "@/lib/LanguageContext";
import PageHeader from "@/components/shared/PageHeader";
import { toast } from "sonner";

// ─── COLOR THEMES (ثيمات ألوان الشهادات السودانية) ───────────────
const COLOR_THEMES = [
  { id: "green", name: "أخضر زمردي سوداني", bg: "#f0fdf4", border: "#14532d", accent: "#15803d", text: "#0f172a", stamp: "#1e3a8a", headerBg: "#dcfce7" },
  { id: "gold", name: "ذهبي ملكي رسمي", bg: "#fefce8", border: "#b45309", accent: "#d97706", text: "#1c1917", stamp: "#1e3a8a", headerBg: "#fef08a" },
  { id: "navy", name: "أزرق كحلي أكاديمي", bg: "#f0f9ff", border: "#1e3a8a", accent: "#2563eb", text: "#0f172a", stamp: "#991b1b", headerBg: "#e0f2fe" },
  { id: "white", name: "أبيض وأسود رسمي", bg: "#ffffff", border: "#000000", accent: "#000000", text: "#000000", stamp: "#1e3a8a", headerBg: "#f1f5f9" }
];

// ─── STANDARD SUDANESE CURRICULUM SUBJECTS (المناهج السودانية) ───
const DEFAULT_SUDAN_SUBJECTS = [
  { name: "القرآن الكريم والتجويد", max: 100, min: 50 },
  { name: "التربية الإسلامية", max: 100, min: 50 },
  { name: "اللغة العربية", max: 100, min: 50 },
  { name: "اللغة الإنجليزية", max: 100, min: 50 },
  { name: "الرياضيات", max: 100, min: 50 },
  { name: "العلوم العامة والبيئة", max: 100, min: 50 },
  { name: "الدراسات الاجتماعية", max: 100, min: 50 },
  { name: "التكنولوجيا والمهن", max: 100, min: 50 },
  { name: "الحاسوب والتقنية", max: 100, min: 50 }
];

// ─── NUMBER TO ARABIC WORDS HELPER (تفقيط الأعداد بالأحرف العربية) ─
function numToArabicWords(n) {
  if (n === null || n === undefined || isNaN(n)) return "—";
  const integerPart = Math.floor(n);
  const decimalPart = Math.round((n - integerPart) * 10) / 10;

  const ones = ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة", "عشرة", "إحدى عشر", "اثنا عشر", "ثلاثة عشر", "أربعة عشر", "خمسة عشر", "ستة عشر", "سبعة عشر", "ثمانية عشر", "تسعة عشر"];
  const tens = ["", "", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
  const hundreds = ["", "مائة", "مائتان", "ثلاثمائة", "أربعمائة", "خمسمائة", "ستمائة", "سبعمائة", "ثمانمائة", "تسعمائة"];
  const thousands = ["", "ألف", "ألفان", "ثلاثة آلاف", "أربعة آلاف", "خمسة آلاف", "ستة آلاف", "سبعة آلاف", "ثمانية آلاف", "تسعة آلاف"];

  let words = "";

  if (integerPart === 0) {
    words = "صفر";
  } else {
    let th = Math.floor(integerPart / 1000);
    let remTh = integerPart % 1000;
    let h = Math.floor(remTh / 100);
    let rem = remTh % 100;

    if (th > 0) {
      words += thousands[th] || `${th} ألف`;
    }

    if (h > 0) {
      if (words !== "") words += " و";
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
  return result + " لا غير";
}

// ─── GRADE LABEL HELPER FOR SUDAN (سلم التقديرات المعتمد بالسودان) ─
function getGradeLabelSudan(pct) {
  if (pct === null || pct === undefined || isNaN(pct)) return { label: "—", color: "#4b5563", status: "—" };
  if (pct >= 90) return { label: "ممتاز", color: "#15803d", status: "ناجح بتفوق" };
  if (pct >= 80) return { label: "جيد جداً", color: "#0369a1", status: "ناجح وينقل" };
  if (pct >= 65) return { label: "جـيـد", color: "#b45309", status: "ناجح وينقل" };
  if (pct >= 50) return { label: "مقبول", color: "#c2410c", status: "ناجح وينقل" };
  return { label: "ضعــيف", color: "#dc2626", status: "له دور ثانٍ" };
}

// ═══════════════════════════════════════════════════════════════
//  PREVIEW WRAPPER (يصغّر الشهادة داخل المتصفح ويحافظ على نسبة الورقة)
// ═══════════════════════════════════════════════════════════════
function PreviewScaledWrapper({ children, isLandscape = false }) {
  // Portrait A4 = 210 x 297 mm → نسبة 210/297 ≈ 0.707
  // Landscape A4 = 297 x 210 mm → نسبة 297/210 ≈ 1.414
  const containerRef = React.useRef(null);
  const [scale, setScale] = React.useState(1);

  React.useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      const containerW = containerRef.current.offsetWidth;
      // الشهادة العمودية 794px (210mm@96dpi) الأفقية 1123px (297mm@96dpi)
      const certW = isLandscape ? 1123 : 794;
      setScale(Math.min(1, (containerW - 8) / certW));
    };
    updateScale();
    const ro = new ResizeObserver(updateScale);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [isLandscape]);

  const certW = isLandscape ? 1123 : 794;
  const certH = isLandscape ? 794 : 1123;

  return (
    <div ref={containerRef} style={{ width: '100%', overflow: 'hidden' }}>
      <div style={{
        width: certW,
        height: certH,
        transformOrigin: 'top right',
        transform: `scale(${scale})`,
        marginBottom: `${(certH * scale) - certH}px`,
      }}>
        {children}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  1. PORTRAIT SUDANESE OFFICIAL CERTIFICATE (A4 PORTRAIT)
// ═══════════════════════════════════════════════════════════════
function SudanesePortraitCertificate({ student, items, attendanceCount, schoolName, schoolLogo, theme, termLabel, principalName, academicYear, schoolStage, govLocality, schoolPhone }) {
  const gradedItems = items.filter(i => i.has_grade && i.score !== null);
  const totalScore = gradedItems.reduce((s, i) => s + Number(i.score || 0), 0);
  const totalMax = items.reduce((s, i) => s + Number(i.max_score || 100), 0);
  const totalMin = Math.round(totalMax / 2);
  const overallPct = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
  const overallGrade = getGradeLabelSudan(gradedItems.length > 0 ? overallPct : null);
  const totalInWords = numToArabicWords(gradedItems.length > 0 ? totalScore : null);

  return (
    <div className="sudan-cert-portrait" style={{ backgroundColor: theme.bg, color: theme.text }} dir="rtl">
      {/* Outer Decorative Sudanese Double Border */}
      <div className="sudan-outer-border" style={{ borderColor: theme.border }}>
        <div className="sudan-inner-border" style={{ borderColor: theme.border }}>
          
          {/* Header Layout */}
          <div className="sudan-header-grid">
            {/* Two equal squares: Right = Government, Left = Logo */}
            {/* Right Square: Government Particulars */}
            <div className="sudan-header-side text-center overflow-hidden">
              <p className="font-bold text-[10px] leading-tight">جمهورية السودان</p>
              <p className="font-bold text-[10px] leading-tight">وزارة التربية والتعليم</p>
              <p className="font-bold text-[9px] leading-tight">{govLocality || "ولاية الخرطوم"}</p>
              <p className="font-bold text-[9px] leading-tight">إدارة التعليم غير الحكومي والخاص</p>
              <p className="font-bold text-[8px] text-stone-600 leading-tight">{schoolPhone ? `هاتف: ${schoolPhone}` : "مكتب تعليم محلية الخرطوم"}</p>
            </div>

            {/* Left Square: School Logo (fills entire square - 140x140) */}
            <div className="sudan-header-side text-center" style={{ flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '6px' }}>
              {schoolLogo ? (
                <img src={schoolLogo} alt="School Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', maxWidth: '100%', maxHeight: '100%' }} />
              ) : (
                <div className="w-full h-full border border-dashed rounded flex items-center justify-center text-[9px] font-bold text-stone-500" style={{ borderColor: theme.border }}>
                  شعار المدرسة
                </div>
              )}
            </div>

            {/* Below squares: Bismillah, Crest, School Name & Cert Badge */}
            <div className="sudan-header-center text-center">
              <div className="bismillah text-xs font-bold mb-0.5">بسم الله الرحمن الرحيم</div>
              {/* Emblem SVG / Sudanese Hawk Motif */}
              <div className="flex justify-center my-0.5">
                <svg className="w-8 h-8 opacity-85" viewBox="0 0 100 100" fill="none" stroke={theme.border} strokeWidth="3">
                  <circle cx="50" cy="50" r="45" strokeWidth="2" strokeDasharray="4 2" />
                  <polygon points="50,15 62,38 88,40 68,58 74,84 50,70 26,84 32,58 12,40 38,38" fill={theme.headerBg} stroke={theme.border} strokeWidth="2"/>
                  <text x="50" y="55" textAnchor="middle" fontSize="18" fontWeight="bold" fill={theme.border}>🇸🇩</text>
                </svg>
              </div>
              <h1 className="sudan-school-name text-xl font-black" style={{ color: theme.border }}>{schoolName}</h1>
              <p className="font-bold text-[11px] mt-0.5">{schoolStage || "المرحلة الابتدائية والمتوسطة والثانوية (بنين - بنات)"}</p>
              <div className="sudan-cert-title-badge" style={{ backgroundColor: theme.headerBg, borderColor: theme.border }}>
                <span className="font-black text-xs">كـشـف در جـا ت ا مـتـحـا ن {termLabel}</span>
              </div>
            </div>

            {/* Student Meta (below the squares) */}
            <div className="grid grid-cols-2 gap-4 text-[10px] mt-2 px-1">
              <div className="text-right"><span className="font-bold">رقم الجلوس:</span> <span className="font-mono font-bold">{student.student_id || student.id || "1024"}</span></div>
              <div className="text-left"><span className="font-bold">العام الدراسي:</span> <span className="font-mono font-bold">{academicYear || "2025 / 2026م"}</span></div>
            </div>
          </div>

          {/* Student Particulars Bar */}
          <div className="sudan-student-info-box" style={{ borderColor: theme.border, backgroundColor: theme.headerBg }}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div>
                <span className="font-bold text-stone-600">اسم التلميـذ: </span>
                <span className="font-black text-sm">{student.full_name || student.name}</span>
              </div>
              <div>
                <span className="font-bold text-stone-600">الصـف الدراسي: </span>
                <span className="font-bold">{student.grade || "الثالث المتوسط"}</span>
              </div>
              <div>
                <span className="font-bold text-stone-600">الشعبـة / الفصل: </span>
                <span className="font-bold">{student.section || "أ"}</span>
              </div>
              <div>
                <span className="font-bold text-stone-600">التقدير العام: </span>
                <span className="font-black" style={{ color: overallGrade.color }}>{overallGrade.label} ({overallPct}%)</span>
              </div>
            </div>
          </div>

          {/* Vertical Subjects Table (Sudanese Official Design) */}
          <div className="sudan-table-container">
            <table className="sudan-subjects-table" style={{ borderColor: theme.border }}>
              <thead>
                <tr style={{ backgroundColor: theme.headerBg }}>
                  <th className="w-8">#</th>
                  <th className="text-right px-2">المـــادة الدراســـية</th>
                  <th className="w-20">النهاية الكبرى</th>
                  <th className="w-20">النهاية الصغرى</th>
                  <th className="w-20">أعمال السنة (20%)</th>
                  <th className="w-24">الامتحان التحريري (80%)</th>
                  <th className="w-24">الدرجة المحصلة</th>
                  <th className="text-right px-2">تفقيط درجة المادة</th>
                  <th className="w-20">التقدير</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const hasScore = item.has_grade && item.score !== null;
                  const scoreNum = hasScore ? Number(item.score) : 0;
                  const maxNum = Number(item.max_score || 100);
                  const minNum = Math.round(maxNum / 2);
                  const coursework = hasScore ? Math.round(scoreNum * 0.2) : "—";
                  const examScore = hasScore ? Math.round(scoreNum * 0.8) : "—";
                  const itemTafqeet = hasScore ? numToArabicWords(scoreNum).replace(" لا غير", "") : "غ/م";
                  const itemGrade = hasScore ? getGradeLabelSudan((scoreNum / maxNum) * 100) : { label: "—", color: "#4b5563" };

                  return (
                    <tr key={idx} className={idx % 2 === 1 ? "bg-black/[0.02]" : ""}>
                      <td className="font-mono text-center text-xs">{idx + 1}</td>
                      <td className="font-bold text-right px-2 text-xs">{item.subject_name}</td>
                      <td className="font-mono text-center text-xs">{maxNum}</td>
                      <td className="font-mono text-center text-xs">{minNum}</td>
                      <td className="font-mono text-center text-xs text-stone-600">{coursework}</td>
                      <td className="font-mono text-center text-xs text-stone-600">{examScore}</td>
                      <td className="font-mono font-black text-center text-sm">{hasScore ? scoreNum : "—"}</td>
                      <td className="text-right px-2 text-[11px] font-bold text-stone-700">{itemTafqeet}</td>
                      <td className="font-bold text-center text-xs" style={{ color: itemGrade.color }}>{itemGrade.label}</td>
                    </tr>
                  );
                })}

                {/* Total Summary Row */}
                <tr className="sudan-total-row" style={{ backgroundColor: theme.headerBg }}>
                  <td colSpan={2} className="font-black text-right px-3 text-xs">المجموع الكلي والنتيجة العامة</td>
                  <td className="font-mono font-black text-center text-xs">{totalMax}</td>
                  <td className="font-mono font-black text-center text-xs">{totalMin}</td>
                  <td colSpan={2} className="font-bold text-center text-xs">النسبة المئوية: <span className="font-mono font-black text-sm">{overallPct}%</span></td>
                  <td className="font-mono font-black text-center text-base">{gradedItems.length > 0 ? totalScore : "—"}</td>
                  <td className="font-bold text-right px-2 text-xs" style={{ color: overallGrade.color }}>{overallGrade.status}</td>
                  <td className="font-black text-center text-xs" style={{ color: overallGrade.color }}>{overallGrade.label}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Arabic Tafqeet Box */}
          <div className="sudan-tafqeet-bar flex items-center justify-between p-2 rounded-lg my-1.5 border" style={{ borderColor: theme.border, backgroundColor: theme.headerBg }}>
            <div>
              <span className="font-bold text-xs">المجموع العام بالحروف العربية: </span>
              <span className="font-black text-sm text-emerald-950">{totalInWords}</span>
            </div>
            <div className="text-xs font-bold">
              <span>درجة النجاح العامة: </span>
              <span className="font-mono text-stone-700">50% فما فوق</span>
            </div>
          </div>

          {/* Attendance & Remarks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-1">
            {/* Attendance Mini Table */}
            <div className="space-y-1">
              <p className="font-bold text-xs">سجل الحضور والمواظبة والتلميذ:</p>
              <table className="sudan-mini-table" style={{ borderColor: theme.border }}>
                <thead>
                  <tr style={{ backgroundColor: theme.headerBg }}>
                    <th>عدد أيام السنة</th>
                    <th>أيام الغياب</th>
                    <th>بعذر مقبول</th>
                    <th>بدون عذر</th>
                    <th>المواظبة والسلوك</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-mono text-center">180</td>
                    <td className="font-mono font-bold text-center">{attendanceCount}</td>
                    <td className="font-mono text-center">{Math.min(attendanceCount, 2)}</td>
                    <td className="font-mono text-center">{Math.max(0, attendanceCount - 2)}</td>
                    <td className="font-bold text-center text-emerald-700">ممتاز</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Class Advisor & Exam Committee Remarks */}
            <div className="sudan-remarks-card border rounded-lg p-2 flex flex-col justify-between" style={{ borderColor: theme.border }}>
              <div>
                <p className="font-bold text-xs">توصيات مرشد الصف ولجنة الكنترول:</p>
                <p className="text-xs mt-1 text-stone-700 leading-snug">
                  {gradedItems.length > 0
                    ? (overallPct >= 85
                      ? "تلميذ متميز ومجتهد خلقاً وعفواً وأكاديمياً. ينصح بمواصلة الاجتهاد والتفوق."
                      : "أداء جيد نوصي بمواصلة المتابعة المنزلية الدورية لضمان الاستمرار.")
                    : "جاري استكمال رصد باقي المواد من قبل الكنترول."}
                </p>
              </div>
              <p className="text-[10px] text-stone-500 font-bold mt-1">تاريخ استئناف الدراسة للفترة القادمة: 01 / 09 / 2026م</p>
            </div>
          </div>

          {/* Tripartite Signatures & Official Stamp */}
          <div className="sudan-signatures-bar flex items-center justify-between pt-3 mt-1 border-t" style={{ borderColor: theme.border }}>
            <div className="text-center space-y-4 w-1/4">
              <p className="font-bold text-xs">مرشد الصف</p>
              <p className="font-bold text-xs border-b border-black pb-1 w-28 mx-auto">........................</p>
            </div>

            <div className="text-center space-y-4 w-1/4">
              <p className="font-bold text-xs">رئيس لجنة الامتحانات</p>
              <p className="font-bold text-xs border-b border-black pb-1 w-28 mx-auto">........................</p>
            </div>

            {/* Official Blue Circular Seal Stamp */}
            <div className="relative flex items-center justify-center w-1/4">
              <div className="stamp-circle-sudan" style={{ color: theme.stamp, borderColor: theme.stamp }}>
                <span className="font-black text-[9px]">جمهورية السودان</span>
                <span className="font-bold text-[8px] my-0.5">{schoolName.substring(0, 18)}</span>
                <span className="font-black text-[8px]">مصادق عليه رسميـاً</span>
              </div>
            </div>

            <div className="text-center space-y-4 w-1/4">
              <p className="font-bold text-xs">مدير المدرسة</p>
              <p className="font-black text-xs text-stone-900">{principalName || "هند يوسف حماد علي"}</p>
            </div>
          </div>

          {/* Security & Authenticity Warning Notice */}
          <div className="sudan-footer-notice text-center font-bold text-[10px] pt-1">
            ( تــنــبــيــه : أي   كــشــط   أ و   تــعــد يــل   أ و   شــطــب   يــلــغــي   هــذ ه   ا لــشــهــا د ة   تــمــا مــاً )
          </div>

        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
//  2. LANDSCAPE MARKSHEET FRONT (A4 LANDSCAPE)
// ═══════════════════════════════════════════════════════════════
function CertificateMarksheetFront({ student, items, attendanceCount, schoolName, schoolLogo, theme, termLabel, principalName, govLocality, academicYear, schoolStage, phone }) {
  const gradedItems = items.filter(i => i.has_grade && i.score !== null);
  const totalScore = gradedItems.reduce((s, i) => s + Number(i.score || 0), 0);
  const totalMax = items.reduce((s, i) => s + Number(i.max_score || 100), 0);
  const totalMin = Math.round(totalMax / 2);
  const overallPct = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
  const overallGrade = getGradeLabelSudan(gradedItems.length > 0 ? overallPct : null);
  const totalInWords = numToArabicWords(gradedItems.length > 0 ? totalScore : null);

  return (
    <div className="pro-cert-page-landscape" style={{ backgroundColor: theme.bg, color: theme.text }} dir="rtl">
      <div className="pro-marksheet-border" style={{ borderColor: theme.border }}>
        <div className="marksheet-inner-flex">

          <div className="pro-header-grid">
            <div className="header-box-side flex flex-col items-center justify-center text-center overflow-hidden" style={{ borderColor: theme.border }}>
              <p className="font-bold text-[10px] leading-tight">جمهورية السودان</p>
              <p className="font-bold text-[9px] leading-tight">{govLocality || "ولاية الخرطوم"}</p>
              <p className="font-bold text-[9px] leading-tight">وزارة التربية والتعليم</p>
              <p className="font-bold text-[8px] leading-tight">{schoolStage || "التعليم الخاص"}</p>
            </div>

            <div className="header-box-center text-center">
              <div className="bismillah-calligraphy text-sm font-bold">بسم الله الرحمن الرحيم</div>
              <h1 className="pro-school-title text-2xl font-black my-0.5" style={{ color: theme.border }}>{schoolName}</h1>
              <p className="font-bold text-xs tracking-wide">إبتدائي ومتوسط وثانوي (بنين - بنات)</p>
            </div>

            <div className="header-box-side flex items-center justify-center overflow-hidden" style={{ borderColor: theme.border, padding: '6px' }}>
              {schoolLogo ? (
                <img src={schoolLogo} alt="School Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', maxWidth: '100%', maxHeight: '100%' }} />
              ) : (
                <div className="w-full h-full border border-dashed rounded flex items-center justify-center text-[9px] font-bold text-stone-500" style={{ borderColor: theme.border }}>
                  شعار المدرسة
                </div>
              )}
            </div>
          </div>

          <div className="pro-meta-bar" style={{ borderColor: theme.border }}>
            <div className="meta-left space-y-1">
              <p><span className="lbl font-bold">نتيجة الامتحان للفترة :</span> <span className="val">{termLabel}</span></p>
               <p><span className="lbl font-bold">العام الدراســـــــــــي :</span> <span className="val font-mono">{academicYear || "2025/2026م"}</span></p>
              <p><span className="lbl font-bold">الاســــــــــــــــــــــم :</span> <span className="val font-bold text-sm">{student.full_name || student.name}</span></p>
            </div>
            <div className="meta-right space-y-1 text-left">
              <p><span className="lbl font-bold">الصــــــــــف :</span> <span className="val font-bold">{student.grade || "الثالث المتوسط"}</span></p>
              <p><span className="lbl font-bold">التقــديـــر :</span> <span className="val font-bold" style={{ color: overallGrade.color }}>{overallGrade.label} ({overallPct}%)</span></p>
            </div>
          </div>

          <div className="pro-table-wrapper">
            <table className="pro-horizontal-table" style={{ borderColor: theme.border }}>
              <thead>
                <tr style={{ backgroundColor: theme.headerBg }}>
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
                    <td key={i} className="font-mono" style={{ borderColor: theme.border }}>{item.max_score || 100}</td>
                  ))}
                  <td className="font-mono font-bold td-total-col" style={{ borderColor: theme.border }}>{totalMax}</td>
                </tr>
                <tr>
                  <td className="td-label-side" style={{ borderColor: theme.border }}>الـصـغــــــرى</td>
                  {items.map((item, i) => (
                    <td key={i} className="font-mono" style={{ borderColor: theme.border }}>{Math.round((item.max_score || 100) / 2)}</td>
                  ))}
                  <td className="font-mono font-bold td-total-col" style={{ borderColor: theme.border }}>{totalMin}</td>
                </tr>
                <tr className="tr-scores-row">
                  <td className="td-label-side font-bold" style={{ borderColor: theme.border }}>درجات التلميذ</td>
                  {items.map((item, i) => {
                    const hasScore = item.has_grade && item.score !== null;
                    return (
                      <td key={i} className="font-mono font-bold text-sm" style={{ borderColor: theme.border }}>
                        {hasScore ? item.score : <span className="text-gray-400 font-normal text-[10px]">غ/م</span>}
                      </td>
                    );
                  })}
                  <td className="font-mono font-black text-base td-total-col" style={{ borderColor: theme.border }}>
                    {gradedItems.length > 0 ? totalScore : "—"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="pro-bottom-grid">
            <div className="left-col space-y-2">
              <table className="absence-mini-table" style={{ borderColor: theme.border }}>
                <thead>
                  <tr style={{ backgroundColor: theme.headerBg }}>
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
                <span className="val font-bold">{principalName || ""}</span>
              </p>
              <p className="detail-line">
                <span className="lbl font-bold">تاريخ إصدار النتيجة :</span>
                <span className="val font-mono">{new Date().toLocaleDateString('ar-SA')}م</span>
              </p>

              <div className="stamp-overlay-pos">
                <div className="stamp-circle" style={{ color: theme.stamp, borderColor: theme.stamp }}>
                  <span className="font-bold text-[10px]">ختم المدرسة</span>
                  <span className="text-[7px]">مصادق عليه</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pro-footer-warning text-center font-bold text-xs pt-1">
            (أ ي   كـشـط   أ و   تـعـد يـل   يـلـغـي   هـذ ه   ا لـشـهـا د ة)
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── LANDSCAPE MARKSHEET BACK (A4 LANDSCAPE COVER) ─────────────
function CertificateCoverBack({ student, schoolName, theme, govLocality, schoolStage, phone }) {

  return (
    <div className="pro-cert-page-landscape" style={{ backgroundColor: theme.bg, color: theme.text }} dir="rtl">
      <div className="pro-cover-grid">

        {/* Right Page in print = Instructions Side (as in reference image) */}
        <div className="pro-rounded-panel" style={{ borderColor: theme.border, backgroundColor: theme.bg }}>
          <div className="panel-inner flex flex-col justify-between h-full py-6 px-4 items-center text-center">
            {/* Top 3 advices */}
            <div className="w-full space-y-1.5 text-center">
              <p className="text-[11.5px] font-bold leading-relaxed">• عود إبنك الصدق والصلاة ومكارم الأخلاق</p>
              <p className="text-[11.5px] font-bold leading-relaxed">• تأكد من صداقة إبنك للأخيار</p>
              <p className="text-[11.5px] font-bold leading-relaxed">• زيارتك للمدرسة مهمة لأنها تكمل دور المدرسة العلمية والتربوية</p>
            </div>

            <div className="pro-ribbon-banner mx-auto my-2">
              <span className="ribbon-tail-r" style={{ borderRightColor: theme.border }} />
              <span className="ribbon-text px-6 py-1 text-[12px]" style={{ borderColor: theme.border, backgroundColor: theme.headerBg }}>إبـنـنـا التـلـمـيـذ</span>
              <span className="ribbon-tail-l" style={{ borderLeftColor: theme.border }} />
            </div>

            <div className="w-full space-y-1.5 text-center">
              <p className="text-[11.5px] font-bold leading-relaxed">• حافظ على صلواتك ودوام على تلاوة القرآن.</p>
              <p className="text-[11.5px] font-bold leading-relaxed">• إجتهد في دراستك فلكل مجتهد نصيب.</p>
              <p className="text-[11.5px] font-bold leading-relaxed">• إحترام المعلم واجب.</p>
            </div>

            <div className="pro-scroll-banner w-[92%] mx-auto text-center py-1.5" style={{ borderColor: theme.border, backgroundColor: theme.headerBg, borderRadius: '4px' }}>
              <span className="text-[12px] font-black tracking-wide">كـاد الـمـعـلـم أن يـكـون ر سـو لاً</span>
            </div>

            <div className="flex justify-center w-full my-1">
              <div className="pro-hexagon-badge mx-auto px-5 py-1" style={{ borderColor: theme.border, backgroundColor: theme.headerBg }}>
                <span className="text-[11px] font-black">التقدير</span>
              </div>
            </div>

            <div className="w-full space-y-1 text-center">
              <p className="text-[11px] font-bold">• من 100% الى 90% ممتاز.</p>
              <p className="text-[11px] font-bold">• أقل من 90% الى 75% جيد جداً.</p>
              <p className="text-[11px] font-bold">• أقل من 75% الى 60% جيد.</p>
              <p className="text-[11px] font-bold">• أقل من 60% الى 50% مقبول.</p>
              <p className="text-[11px] font-bold">• أقل من 50% ضعيف.</p>
            </div>
          </div>
        </div>

        {/* Left Page in print = School Identity Side (as in reference image) */}
        <div className="pro-rounded-panel" style={{ borderColor: theme.border, backgroundColor: theme.bg }}>
          <div className="panel-inner flex flex-col h-full py-8 px-4 items-center text-center justify-between">
            <div className="w-full text-center space-y-3">
              <div className="bismillah-calligraphy text-[13px] font-bold text-center" style={{ fontFamily: "'Amiri', serif" }}>بسم الله الرحمن الرحيم</div>
              <div className="text-center leading-loose space-y-0.5 pt-2">
                <p className="font-bold text-[11px]">ولاية الخرطوم – محلية الشهداء، وسوبا</p>
                <p className="font-bold text-[11px]">وزارة التربية والتعليم – {schoolStage || "إدارة التعليم الخاص"}</p>
              </div>
            </div>

            <div className="w-full text-center space-y-1.5 py-3">
              <h2 className="pro-school-title text-[18px] font-black text-center leading-relaxed" style={{ color: theme.border, fontFamily: "'Amiri', serif", lineHeight: '1.6' }}>
                مدارس الأستاذ سمير القرآنية الخاصة<br/>الإبتدائية والمتوسطة<br/>بنين – بنات
              </h2>
            </div>

            {/* Scroll: نتيجة المقررات الدراسية - exactly as image with rolled ends */}
            <div className="relative w-[72%] mx-auto my-2">
              <div className="pro-scroll-banner main-title-scroll w-full text-center py-1.5" style={{ borderColor: theme.border, backgroundColor: theme.headerBg, borderWidth: '1.2px', borderRadius: '2px' }}>
                <span className="text-[11px] font-black tracking-[0.12em]">نتيجة المقررات الدراسية</span>
              </div>
              {/* rolled ends effect */}
              <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-[18px] bg-white border border-black rounded-r-sm" style={{ borderColor: theme.border }}></span>
              <span className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-[18px] bg-white border border-black rounded-l-sm" style={{ borderColor: theme.border }}></span>
            </div>

            <div className="w-full space-y-4 pt-4">
              <div className="flex items-end justify-center gap-2 w-[92%] mx-auto">
                <span className="font-bold text-[11px] shrink-0 pb-1">اسم التلميذ/</span>
                <span className="font-bold text-[13px] flex-1 border-b border-black pb-1 text-center leading-none" style={{ minHeight: '18px' }}>{student.full_name || student.name}</span>
              </div>
              <div className="flex items-end justify-center gap-2 w-[92%] mx-auto">
                <span className="font-bold text-[11px] shrink-0 pb-1">الصف/</span>
                <span className="font-bold text-[13px] flex-1 border-b border-black pb-1 text-center leading-none" style={{ minHeight: '18px' }}>{student.grade || "الثالث المتوسط"}</span>
              </div>
              <div className="flex items-center justify-center gap-1 w-[92%] mx-auto pt-1">
                <span className="font-bold text-[9px] shrink-0">الإدارة :</span>
                <span className="font-mono text-[10px] flex-1 text-center tracking-wide" dir="ltr">{phone ? `${phone}` : "0123109370 / 0116375406"}</span>
              </div>
            </div>

            <div className="flex-1"></div>
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
  const [certificateLayout, setCertificateLayout] = useState("landscape"); // 'portrait' | 'landscape'
  const [selectedThemeId, setSelectedThemeId] = useState("green");
  const [printSide, setPrintSide] = useState("front"); // 'front' | 'both'
  const [customSchoolName, setCustomSchoolName] = useState("");
  const [customLogo, setCustomLogo] = useState("");
  const [principalName, setPrincipalName] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [schoolStage, setSchoolStage] = useState("");
  const [schoolPhone, setSchoolPhone] = useState("");
  const [govLocality, setGovLocality] = useState("");

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
      if (existingSettings.gov_locality) setGovLocality(existingSettings.gov_locality);
      if (existingSettings.academic_year) setAcademicYear(existingSettings.academic_year);
      if (existingSettings.school_stage) setSchoolStage(existingSettings.school_stage);
      if (existingSettings.school_phone) setSchoolPhone(existingSettings.school_phone);
    }
  }, [existingSettings]);

  // Save Settings Mutation to Neon DB
  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      const dataToSave = {
        school_name_ar: customSchoolName || null,
        school_logo: customLogo || null,
        principal_name: principalName || null,
        gov_locality: govLocality || null,
        academic_year: academicYear || null,
        school_stage: schoolStage || null,
        school_phone: schoolPhone || null,
      };
      if (existingSettings?.id) {
        return await entities.SystemSetting.update(existingSettings.id, dataToSave);
      } else {
        return await entities.SystemSetting.create(dataToSave);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["print-results-settings"] });
      toast.success(isRTL ? "تم حفظ إعدادات المدرسة بنجاح!" : "Settings saved successfully!");
    },
    onError: (err) => {
      console.error("[SystemSetting save error]", err);
      const msg = err?.message || "";
      if (msg.includes("401") || msg.includes("Unauthorized")) {
        toast.error(isRTL ? "فشل الحفظ: انتهت الجلسة، سجّل دخولك مرة أخرى كمسؤول" : "Save failed: Unauthorized - please re-login as admin");
      } else if (msg.includes("principal_name") || msg.includes("column")) {
        toast.error(isRTL ? "فشل الحفظ: قاعدة البيانات تحتاج تحديث، أعد تشغيل الخادم (npm run dev)" : "Save failed: DB schema needs migration - restart server");
      } else {
        toast.error(isRTL ? `فشل حفظ الإعدادات: ${msg}` : `Failed to save: ${msg}`);
      }
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
      if (typeof event.target?.result === "string") {
        setCustomLogo(event.target.result);
        toast.success(isRTL ? "تم تحديث الشعار بنجاح" : "Logo updated");
      }
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

    // Standard subjects pool
    const poolSubjects = gradeSubjects.length > 0 ? gradeSubjects : DEFAULT_SUDAN_SUBJECTS;

    poolSubjects.forEach(subj => {
      const sName = subj.name || subj.subject_name;
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
          max_score: matchingGrade.max_score || 100,
          grade_label: matchingGrade.grade_label,
          term: matchingGrade.term || (termFilter !== "all" ? termFilter : "الفصل الأول"),
          teacher_name: matchingGrade.teacher_name || subj.teacher_name || "—",
          notes: matchingGrade.notes || "",
          has_grade: true
        });
      } else {
        resultList.push({
          id: `subj-${subj.id || sName}`,
          subject_name: sName,
          score: null,
          max_score: subj.max || 100,
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
          max_score: g.max_score || 100,
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
    if (selectedStudents.length === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedStudents([]);
      toast.info(isRTL ? "تم إلغاء تحديد جميع الطلاب" : "Deselected all students");
    } else {
      setSelectedStudents(filteredStudents.map(s => s.id));
      toast.success(isRTL ? `تم تحديد ${filteredStudents.length} طالب للطباعة` : `Selected ${filteredStudents.length} students`);
    }
  };

  const handlePreview = (student) => {
    setPreviewStudent(student);
    setShowPreview(true);
  };

  // ─── FULL PRINT ENGINE (محرك الطباعة الذكي) ────────
  const handlePrint = (overrideTargetStudents = null) => {
    let studentsToPrint = [];

    if (overrideTargetStudents && overrideTargetStudents.length > 0) {
      studentsToPrint = overrideTargetStudents;
    } else if (selectedStudents.length > 0) {
      studentsToPrint = students.filter(s => selectedStudents.includes(s.id));
    } else if (previewStudent) {
      studentsToPrint = [previewStudent];
    } else if (filteredStudents.length > 0) {
      // Auto-select filtered list if user clicks print without explicitly selecting checkboxes
      studentsToPrint = filteredStudents;
      setSelectedStudents(filteredStudents.map(s => s.id));
      toast.info(isRTL ? `تم تحديد جميع طلاب القائمة (${filteredStudents.length}) وتمريرهم للطباعة تلقائياً` : `Selected all ${filteredStudents.length} students for printing`);
    }

    if (studentsToPrint.length === 0) {
      toast.error(isRTL ? "لا يوجد طلاب متاحون للطباعة حالياً" : "No students available to print");
      return;
    }

    const termLabel = termFilter !== "all" ? termLabels[termFilter] : (isRTL ? "الفصل الأول" : "Term 1");
    const sName = customSchoolName || existingSettings?.school_name_ar || "مدارس الأستاذ سمير القرآنية الخاصة";
    const sLogo = customLogo || existingSettings?.school_logo || "";
    const pName = principalName || existingSettings?.principal_name || "هند يوسف حماد علي";

    let certificatesHTML = "";

    studentsToPrint.forEach((student) => {
      const items = getStudentCompleteSubjectsAndGrades(student);
      const absences = getAbsenceCount(student);
      const gradedItems = items.filter(i => i.has_grade && i.score !== null);
      const totalScore = gradedItems.reduce((s, i) => s + Number(i.score || 0), 0);
      const totalMax = items.reduce((s, i) => s + Number(i.max_score || 100), 0);
      const totalMin = Math.round(totalMax / 2);
      const overallPct = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
      const overallGrade = getGradeLabelSudan(gradedItems.length > 0 ? overallPct : null);
      const totalInWords = numToArabicWords(gradedItems.length > 0 ? totalScore : null);

      if (certificateLayout === "portrait") {
        // ─── PORTRAIT SUDANESE OFFICIAL CERTIFICATE ────────────────
        let rowsHtml = "";
        items.forEach((item, idx) => {
          const hasScore = item.has_grade && item.score !== null;
          const scoreNum = hasScore ? Number(item.score) : 0;
          const maxNum = Number(item.max_score || 100);
          const minNum = Math.round(maxNum / 2);
          const coursework = hasScore ? Math.round(scoreNum * 0.2) : "—";
          const examScore = hasScore ? Math.round(scoreNum * 0.8) : "—";
          const itemTafqeet = hasScore ? numToArabicWords(scoreNum).replace(" لا غير", "") : "غ/م";
          const itemGrade = hasScore ? getGradeLabelSudan((scoreNum / maxNum) * 100) : { label: "—", color: "#4b5563" };

          rowsHtml += `
            <tr class="${idx % 2 === 1 ? 'bg-black-subtle' : ''}">
              <td class="font-mono text-center">${idx + 1}</td>
              <td class="font-bold text-right px-2">${item.subject_name}</td>
              <td class="font-mono text-center">${maxNum}</td>
              <td class="font-mono text-center">${minNum}</td>
              <td class="font-mono text-center">${coursework}</td>
              <td class="font-mono text-center">${examScore}</td>
              <td class="font-mono font-black text-center text-sm">${hasScore ? scoreNum : '—'}</td>
              <td class="text-right px-2 font-bold">${itemTafqeet}</td>
              <td class="font-bold text-center" style="color:${itemGrade.color}">${itemGrade.label}</td>
            </tr>
          `;
        });

        certificatesHTML += `
          <div class="sudan-cert-portrait" style="background-color:${activeTheme.bg};color:${activeTheme.text}">
            <div class="sudan-outer-border" style="border-color:${activeTheme.border}">
              <div class="sudan-inner-border" style="border-color:${activeTheme.border}">
                
                <div class="sudan-header-grid">
                  <div class="sudan-header-side text-center" style="width:140px;height:140px;min-width:140px;min-height:140px;flex-shrink:0;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;padding:6px 5px;gap:2px;box-sizing:border-box;border:1.5px solid ${activeTheme.border};border-radius:6px;background:#fff;">
                    <p class="font-bold text-[10px]" style="line-height:1.4;margin:0;">جمهورية السودان</p>
                    <p class="font-bold text-[10px]" style="line-height:1.4;margin:0;">وزارة التربية والتعليم</p>
                    <p class="font-bold text-[9px]" style="line-height:1.4;margin:0;">${govLocality || "ولاية الخرطوم"}</p>
                    <p class="font-bold text-[9px]" style="line-height:1.4;margin:0;">إدارة التعليم الخاص</p>
                    ${schoolPhone ? `<p class="font-bold text-[8px] text-stone-600" style="line-height:1.3;margin:0;">${schoolPhone}</p>` : ``}
                  </div>

                  <div class="sudan-header-side text-center" style="width:140px;height:140px;min-width:140px;min-height:140px;flex-shrink:0;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;padding:6px;box-sizing:border-box;border:1.5px solid ${activeTheme.border};border-radius:6px;background:#fff;">
                    ${sLogo ? `<img src="${sLogo}" style="width:100%;height:100%;object-fit:contain;max-width:100%;max-height:100%;"/>` : `<div class="w-full h-full border border-dashed rounded flex items-center justify-center text-[9px] font-bold" style="border-color:${activeTheme.border}">شعار المدرسة</div>`}
                  </div>
                </div>

                <div class="sudan-header-center text-center" style="grid-column:1/-1">
                  <div class="bismillah text-xs font-bold">بسم الله الرحمن الرحيم</div>
                  <svg viewBox="0 0 100 80" width="50" height="40" style="display:inline-block;vertical-align:middle;margin:0 6px">
                    <polygon points="50,5 61,35 95,35 67,55 78,85 50,65 22,85 33,55 5,35 39,35" fill="#c8a951" stroke="#9a7d2e" stroke-width="2"/>
                    <circle cx="50" cy="46" r="14" fill="none" stroke="#9a7d2e" stroke-width="1.5"/>
                    <text x="50" y="50" text-anchor="middle" font-size="8" font-weight="bold" fill="#5c4a1e">م</text>
                  </svg>
                  <h1 class="sudan-school-name text-xl font-black" style="color:${activeTheme.border}">${sName}</h1>
                  <p class="font-bold text-[11px]">${schoolStage || "المرحلة الابتدائية والمتوسطة والثانوية (بنين - بنات)"}</p>
                  <div class="sudan-cert-title-badge" style="background-color:${activeTheme.headerBg};border-color:${activeTheme.border}">
                    <span class="font-black text-xs">كـشـف در جـا ت ا مـتـحـا ن ${termLabel}</span>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-2 mt-2 text-[10px] border-t border-stone-300 pt-1">
                  <p class="text-right"><span class="font-bold">رقم الجلوس:</span> <span class="font-mono font-bold">${student.student_id || student.id || "1024"}</span></p>
                  <p class="text-left"><span class="font-bold">العام الدراسي:</span> <span class="font-mono font-bold">${academicYear || "2025 / 2026م"}</span></p>
                </div>

                <div class="sudan-student-info-box" style="border-color:${activeTheme.border};background-color:${activeTheme.headerBg}">
                  <div class="grid grid-cols-4 gap-2 text-xs">
                    <div><span class="font-bold">اسم التلميـذ: </span><span class="font-black text-sm">${student.full_name || student.name}</span></div>
                    <div><span class="font-bold">الصـف الدراسي: </span><span class="font-bold">${student.grade || "الثالث المتوسط"}</span></div>
                    <div><span class="font-bold">الشعبـة / الفصل: </span><span class="font-bold">${student.section || "أ"}</span></div>
                    <div><span class="font-bold">التقدير العام: </span><span class="font-black" style="color:${overallGrade.color}">${overallGrade.label} (${overallPct}%)</span></div>
                  </div>
                </div>

                <div class="sudan-table-container">
                  <table class="sudan-subjects-table" style="border-color:${activeTheme.border}">
                    <thead>
                      <tr style="background-color:${activeTheme.headerBg}">
                        <th className="w-8">#</th>
                        <th class="text-right px-2">المـــادة الدراســـية</th>
                        <th class="w-20">النهاية الكبرى</th>
                        <th class="w-20">النهاية الصغرى</th>
                        <th class="w-20">أعمال السنة</th>
                        <th class="w-24">الامتحان التحريري</th>
                        <th class="w-24">الدرجة المحصلة</th>
                        <th class="text-right px-2">تفقيط درجة المادة</th>
                        <th class="w-20">التقدير</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${rowsHtml}
                      <tr class="sudan-total-row" style="background-color:${activeTheme.headerBg}">
                        <td colSpan="2" class="font-black text-right px-3 text-xs">المجموع الكلي والنتيجة العامة</td>
                        <td class="font-mono font-black text-center">${totalMax}</td>
                        <td class="font-mono font-black text-center">${totalMin}</td>
                        <td colSpan="2" class="font-bold text-center">النسبة المئوية: <span class="font-mono font-black text-sm">${overallPct}%</span></td>
                        <td class="font-mono font-black text-center text-base">${gradedItems.length > 0 ? totalScore : '—'}</td>
                        <td class="font-bold text-right px-2" style="color:${overallGrade.color}">${overallGrade.status}</td>
                        <td class="font-black text-center" style="color:${overallGrade.color}">${overallGrade.label}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div class="sudan-tafqeet-bar flex items-center justify-between p-2 rounded-lg my-1.5 border" style="border-color:${activeTheme.border};background-color:${activeTheme.headerBg}">
                  <div><span class="font-bold text-xs">المجموع العام بالحروف العربية: </span><span class="font-black text-sm">${totalInWords}</span></div>
                  <div class="text-xs font-bold"><span>درجة النجاح العامة: </span><span class="font-mono">50% فما فوق</span></div>
                </div>

                <div class="grid grid-cols-2 gap-3 my-1">
                  <div class="space-y-1">
                    <p class="font-bold text-xs">سجل الحضور والمواظبة والتلميذ:</p>
                    <table class="sudan-mini-table" style="border-color:${activeTheme.border}">
                      <thead>
                        <tr style="background-color:${activeTheme.headerBg}">
                          <th>عدد أيام السنة</th><th>أيام الغياب</th><th>بعذر مقبول</th><th>بدون عذر</th><th>المواظبة والسلوك</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td class="font-mono text-center">180</td>
                          <td class="font-mono font-bold text-center">${absences}</td>
                          <td class="font-mono text-center">${Math.min(absences, 2)}</td>
                          <td class="font-mono text-center">${Math.max(0, absences - 2)}</td>
                          <td class="font-bold text-center text-emerald-700">ممتاز</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div class="sudan-remarks-card border rounded-lg p-2 flex flex-col justify-between" style="border-color:${activeTheme.border}">
                    <div>
                      <p class="font-bold text-xs">توصيات مرشد الصف ولجنة الكنترول:</p>
                      <p class="text-xs mt-1 leading-snug">${gradedItems.length > 0 ? (overallPct >= 85 ? "تلميذ متميز ومجتهد خلقاً وأكاديمياً. ينصح بمواصلة الاجتهاد والتفوق." : "أداء جيد نوصي بمواصلة المتابعة المنزلية الدورية لضمان الاستمرار.") : "جاري استكمال رصد باقي المواد من قبل الكنترول."}</p>
                    </div>
                    <p class="text-[10px] font-bold mt-1">تاريخ استئناف الدراسة للفترة القادمة: 01 / 09 / 2026م</p>
                  </div>
                </div>

                <div class="sudan-signatures-bar flex items-center justify-between pt-3 mt-1 border-t" style="border-color:${activeTheme.border}">
                  <div class="text-center space-y-3 w-1/4"><p class="font-bold text-xs">مرشد الصف</p><p class="font-bold text-xs border-b border-black pb-1 w-28 mx-auto">........................</p></div>
                  <div class="text-center space-y-3 w-1/4"><p class="font-bold text-xs">رئيس لجنة الامتحانات</p><p class="font-bold text-xs border-b border-black pb-1 w-28 mx-auto">........................</p></div>
                  <div class="relative flex items-center justify-center w-1/4">
                    <div class="stamp-circle-sudan" style="color:${activeTheme.stamp};border-color:${activeTheme.stamp}">
                      <span class="font-black text-[9px]">جمهورية السودان</span>
                      <span class="font-bold text-[8px] my-0.5">${sName.substring(0, 18)}</span>
                      <span class="font-black text-[8px]">مصادق عليه رسمياً</span>
                    </div>
                  </div>
                  <div class="text-center space-y-3 w-1/4"><p class="font-bold text-xs">مدير المدرسة</p><p class="font-black text-xs">${pName}</p></div>
                </div>

                <div class="sudan-footer-notice text-center font-bold text-[10px] pt-1">
                  ( تــنــبــيــه : أي   كــشــط   أ و   تــعــد يــل   أ و   شــطــب   يــلــغــي   هــذ ه   ا لــشــهــا د ة   تــمــا مــاً )
                </div>

              </div>
            </div>
          </div>
        `;
      } else {
        // ─── LANDSCAPE MARKSHEET FRONT & BACK ─────────────────────
        let thSubjects = "";
        let tdMax = "";
        let tdMin = "";
        let tdScores = "";

        items.forEach(item => {
          const hasScore = item.has_grade && item.score !== null;
          thSubjects += `<th style="border-color:${activeTheme.border}">${item.subject_name}</th>`;
          tdMax += `<td class="font-mono" style="border-color:${activeTheme.border}">${item.max_score || 100}</td>`;
          tdMin += `<td class="font-mono" style="border-color:${activeTheme.border}">${Math.round((item.max_score || 100) / 2)}</td>`;
          tdScores += `<td class="font-mono font-bold text-sm" style="border-color:${activeTheme.border}">${hasScore ? item.score : '<span style="color:#9ca3af;font-size:10px">غ/م</span>'}</td>`;
        });

        certificatesHTML += `
          <div class="pro-cert-page-landscape" style="background-color:${activeTheme.bg};color:${activeTheme.text}">
            <div class="pro-marksheet-border" style="border-color:${activeTheme.border}">
              <div class="marksheet-inner-flex">
                <div class="pro-header-grid">
                  <div class="header-box-side flex flex-col items-center justify-center text-center overflow-hidden" style="border-color:${activeTheme.border};width:140px;height:140px;min-width:140px;min-height:140px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:6px 5px;gap:1px;box-sizing:border-box;overflow:hidden;">
                    <p class="font-bold text-[10px]" style="line-height:1.4;margin:0;">جمهورية السودان</p>
                    <p class="font-bold text-[9px]" style="line-height:1.4;margin:0;">${govLocality || "ولاية الخرطوم"}</p>
                    <p class="font-bold text-[9px]" style="line-height:1.4;margin:0;">وزارة التربية والتعليم</p>
                    <p class="font-bold text-[8px]" style="line-height:1.3;margin:0;">التعليم الخاص</p>
                  </div>
                  <div class="header-box-center text-center">
                    <div class="bismillah-calligraphy text-sm font-bold">بسم الله الرحمن الرحيم</div>
                    <h1 class="pro-school-title text-2xl font-black my-0.5" style="color:${activeTheme.border}">${sName}</h1>
                    <p class="font-bold text-xs tracking-wide">${schoolStage || "إبتدائي ومتوسط وثانوي (بنين - بنات)"}</p>
                  </div>
                  <div class="header-box-side flex items-center justify-center overflow-hidden" style="border-color:${activeTheme.border};width:140px;height:140px;min-width:140px;min-height:140px;padding:6px;box-sizing:border-box;overflow:hidden;">
                    ${sLogo ? `<img src="${sLogo}" style="width:100%;height:100%;object-fit:contain;max-width:100%;max-height:100%;" />` : `<div style="width:100%;height:100%;border:1.5px dashed ${activeTheme.border};border-radius:8px;display:flex;align-items:center;justify-content:center;text-align:center;font-size:9px;font-weight:800;">شعار المدرسة</div>`}
                  </div>
                </div>

                <div class="pro-meta-bar" style="border-color:${activeTheme.border}">
                  <div class="meta-left space-y-1">
                    <p><span class="lbl font-bold">نتيجة الامتحان للفترة :</span> <span class="val">${termLabel}</span></p>
                    <p><span class="lbl font-bold">العام الدراســـــــــــي :</span> <span class="val font-mono">${academicYear || "2025/2026م"}</span></p>
                    <p><span class="lbl font-bold">الاســــــــــــــــــــــم :</span> <span class="val font-bold text-sm">${student.full_name || student.name}</span></p>
                  </div>
                  <div class="meta-right space-y-1 text-left">
                    <p><span class="lbl font-bold">الصــــــــــف :</span> <span class="val font-bold">${student.grade || "الثالث المتوسط"}</span></p>
                    <p><span class="lbl font-bold">التقــديـــر :</span> <span class="val font-bold" style="color:${overallGrade.color}">${overallGrade.label} (${overallPct}%)</span></p>
                  </div>
                </div>

                <div class="pro-table-wrapper">
                  <table class="pro-horizontal-table" style="border-color:${activeTheme.border}">
                    <thead><tr style="background-color:${activeTheme.headerBg}"><th class="th-label-side" style="border-color:${activeTheme.border}">الـمـواد</th>${thSubjects}<th class="th-total-col" style="border-color:${activeTheme.border}">الـمـجـمـوع</th></tr></thead>
                    <tbody>
                      <tr><td class="td-label-side" style="border-color:${activeTheme.border}">الـقـصــــــوى</td>${tdMax}<td class="font-mono font-bold td-total-col" style="border-color:${activeTheme.border}">${totalMax}</td></tr>
                      <tr><td class="td-label-side" style="border-color:${activeTheme.border}">الـصـغــــــرى</td>${tdMin}<td class="font-mono font-bold td-total-col" style="border-color:${activeTheme.border}">${totalMin}</td></tr>
                      <tr class="tr-scores-row"><td class="td-label-side font-bold" style="border-color:${activeTheme.border}">درجات التلميذ</td>${tdScores}<td class="font-mono font-black text-base td-total-col" style="border-color:${activeTheme.border}">${gradedItems.length > 0 ? totalScore : '—'}</td></tr>
                    </tbody>
                  </table>
                </div>

                <div class="pro-bottom-grid">
                  <div class="left-col space-y-2">
                    <table class="absence-mini-table" style="border-color:${activeTheme.border}">
                      <thead><tr style="background-color:${activeTheme.headerBg}"><th style="border-color:${activeTheme.border}">عدد أيام السنة</th><th style="border-color:${activeTheme.border}">عدد أيام الغياب</th><th style="border-color:${activeTheme.border}">بعذر مقبول</th><th style="border-color:${activeTheme.border}">بدون عذر</th></tr></thead>
                      <tbody><tr><td class="font-mono" style="border-color:${activeTheme.border}">180</td><td class="font-mono font-bold" style="border-color:${activeTheme.border}">${absences}</td><td class="font-mono" style="border-color:${activeTheme.border}">${Math.min(absences, 2)}</td><td class="font-mono" style="border-color:${activeTheme.border}">${Math.max(0, absences - 2)}</td></tr></tbody>
                    </table>
                    <div class="advisor-remarks-box" style="border-color:${activeTheme.border}">
                      <p class="font-bold text-xs">ملاحظات مرشد الصف :</p>
                      <p class="text-xs mt-1 leading-relaxed">${gradedItems.length > 0 ? (overallPct >= 85 ? "تلميذ منضبط وممتاز أكاديمياً وخلقياً. نتمنى له مزيداً من التقدم والاجتهاد." : "أداء جيد نوصي بمواصلة الاجتهاد والمتابعة الدورية.") : "جاري استكمال رصد باقي المواد."}</p>
                      <div class="advisor-sig-row flex justify-between text-xs mt-2"><span>التوقيع :</span><span class="border-b border-black w-28 text-center font-bold">مرشد الصف</span></div>
                    </div>
                  </div>

                  <div class="details-col space-y-1.5">
                    <p class="detail-line"><span class="lbl font-bold">المجمـوع بالحــروف :</span> <span class="val font-bold">${totalInWords}</span></p>
                    <p class="detail-line"><span class="lbl font-bold">درجــة النـجــــــــاح :</span> <span class="val text-[11px]">أي مادة = 50% من الدرجة الكاملة (نصف الدرجة الكاملة)</span></p>
                    <p class="detail-line"><span class="lbl font-bold">إسم مدير المدرسة :</span> <span class="val font-bold">${pName}</span></p>
                    <p class="detail-line"><span class="lbl font-bold">تاريخ إصدار النتيجة :</span> <span class="val font-mono">${new Date().toLocaleDateString('ar-SA')}م</span></p>
                    <div class="stamp-overlay-pos"><div class="stamp-circle" style="color:${activeTheme.stamp};border-color:${activeTheme.stamp}"><span class="font-bold text-[10px]">ختم المدرسة</span><span style="font-size:7px;display:block">مصادق عليه</span></div></div>
                  </div>
                </div>

                <div class="pro-footer-warning text-center font-bold text-xs pt-1">(أ ي   كـشـط   أ و   تـعـد يـل   يـلـغـي   هـذ ه   ا لـشـهـا د ة)</div>
              </div>
            </div>
          </div>`;

        if (printSide === 'both') {
          certificatesHTML += `
            <div class="pro-cert-page-landscape" style="background-color:${activeTheme.bg};color:${activeTheme.text}">
              <div class="pro-cover-grid">
                <div class="pro-rounded-panel" style="border-color:${activeTheme.border};background-color:${activeTheme.bg}"><div class="panel-inner flex flex-col justify-between h-full py-6 px-4 items-center text-center">
                  <div class="w-full space-y-1.5 text-center">
                    <p class="text-[11.5px] font-bold leading-relaxed">• عود إبنك الصدق والصلاة ومكارم الأخلاق</p>
                    <p class="text-[11.5px] font-bold leading-relaxed">• تأكد من صداقة إبنك للأخيار</p>
                    <p class="text-[11.5px] font-bold leading-relaxed">• زيارتك للمدرسة مهمة لأنها تكمل دور المدرسة العلمية والتربوية</p>
                  </div>
                  <div class="pro-ribbon-banner mx-auto my-2"><span class="ribbon-tail-r" style="border-right-color:${activeTheme.border}"></span><span class="ribbon-text px-6 py-1 text-[12px]" style="border-color:${activeTheme.border};background-color:${activeTheme.headerBg}">إبـنـنـا التـلـمـيـذ</span><span class="ribbon-tail-l" style="border-left-color:${activeTheme.border}"></span></div>
                  <div class="w-full space-y-1.5 text-center">
                    <p class="text-[11.5px] font-bold leading-relaxed">• حافظ على صلواتك ودوام على تلاوة القرآن.</p>
                    <p class="text-[11.5px] font-bold leading-relaxed">• إجتهد في دراستك فلكل مجتهد نصيب.</p>
                    <p class="text-[11.5px] font-bold leading-relaxed">• إحترام المعلم واجب.</p>
                  </div>
                  <div class="pro-scroll-banner w-[92%] mx-auto text-center py-1.5" style="border-color:${activeTheme.border};background-color:${activeTheme.headerBg};border-radius:4px"><span class="text-[12px] font-black tracking-wide">كـاد الـمـعـلـم أن يـكـون ر سـو لاً</span></div>
                  <div class="flex justify-center w-full my-1"><div class="pro-hexagon-badge mx-auto px-5 py-1" style="border-color:${activeTheme.border};background-color:${activeTheme.headerBg}"><span class="text-[11px] font-black">التقدير</span></div></div>
                  <div class="w-full space-y-1 text-center">
                    <p class="text-[11px] font-bold">• من 100% الى 90% ممتاز.</p>
                    <p class="text-[11px] font-bold">• أقل من 90% الى 75% جيد جداً.</p>
                    <p class="text-[11px] font-bold">• أقل من 75% الى 60% جيد.</p>
                    <p class="text-[11px] font-bold">• أقل من 60% الى 50% مقبول.</p>
                    <p class="text-[11px] font-bold">• أقل من 50% ضعيف.</p>
                  </div>
                </div></div>
                <div class="pro-rounded-panel" style="border-color:${activeTheme.border};background-color:${activeTheme.bg}"><div class="panel-inner flex flex-col h-full py-8 px-4 items-center text-center justify-between">
                  <div class="w-full text-center space-y-3">
                    <div class="bismillah-calligraphy text-[13px] font-bold text-center" style="font-family:'Amiri', serif">بسم الله الرحمن الرحيم</div>
                    <div class="text-center leading-loose space-y-0.5 pt-2"><p class="font-bold text-[11px]">ولاية الخرطوم – محلية الشهداء، وسوبا</p><p class="font-bold text-[11px]">وزارة التربية والتعليم – إدارة التعليم الخاص</p></div>
                  </div>
                  <div class="w-full text-center space-y-1.5 py-3">
                    <h2 class="pro-school-title text-[18px] font-black text-center leading-relaxed" style="color:${activeTheme.border};font-family:'Amiri', serif;line-height:1.6">${sName}<br/>الإبتدائية والمتوسطة<br/>بنين – بنات</h2>
                  </div>
                  <div class="relative w-[72%] mx-auto my-2">
                    <div class="pro-scroll-banner main-title-scroll w-full text-center py-1.5" style="border-color:${activeTheme.border};background-color:${activeTheme.headerBg};border-width:1.2px;border-radius:2px"><span class="text-[11px] font-black tracking-[0.12em]">نتيجة المقررات الدراسية</span></div>
                    <span class="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-[18px] bg-white border border-black rounded-r-sm" style="border-color:${activeTheme.border}"></span>
                    <span class="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-[18px] bg-white border border-black rounded-l-sm" style="border-color:${activeTheme.border}"></span>
                  </div>
                  <div class="w-full space-y-4 pt-4">
                    <div class="flex items-end justify-center gap-2 w-[92%] mx-auto"><span class="font-bold text-[11px] shrink-0 pb-1">اسم التلميذ/</span><span class="font-bold text-[13px] flex-1 border-b border-black pb-1 text-center leading-none" style="min-height:18px">${student.full_name || student.name}</span></div>
                    <div class="flex items-end justify-center gap-2 w-[92%] mx-auto"><span class="font-bold text-[11px] shrink-0 pb-1">الصف/</span><span class="font-bold text-[13px] flex-1 border-b border-black pb-1 text-center leading-none" style="min-height:18px">${student.grade || "الثالث المتوسط"}</span></div>
                    <div class="flex items-center justify-center gap-1 w-[92%] mx-auto pt-1"><span class="font-bold text-[9px] shrink-0">الإدارة :</span><span class="font-mono text-[10px] flex-1 text-center tracking-wide" dir="ltr">${schoolPhone ? `${schoolPhone}` : "0123109370 / 0116375406"}</span></div>
                  </div>
                  <div class="flex-1"></div>
                </div></div>
              </div>
            </div>`;
        }
      }
    });

    const pageSizeCss = certificateLayout === "portrait"
      ? `@page { size: A4 portrait; margin: 0; }`
      : `@page { size: A4 landscape; margin: 0; }`;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8"/>
<title>شهادات النتائج المدرسية الرسمية - ${sName}</title>
<style>
${pageSizeCss}
${PRO_CERTIFICATE_PRINT_CSS}
</style>
</head>
<body>
${certificatesHTML}
 <script>
  function doPrint(){ setTimeout(function(){ window.print(); }, 300); }
  window.onload = function(){
    var imgs = document.images;
    if(!imgs || imgs.length===0){ doPrint(); return; }
    var loaded = 0;
    var total = imgs.length;
    function check(){ loaded++; if(loaded>=total) doPrint(); }
    for(var i=0;i<total;i++){
      if(imgs[i].complete) check();
      else { imgs[i].onload = check; imgs[i].onerror = check; }
    }
    setTimeout(doPrint, 1200);
  };
<\/script>
</body></html>`);
    printWindow.document.close();
  };

  const isLoading = loadingStudents || loadingGrades || loadingSubjects;
  const currentTermLabel = termFilter !== "all" ? termLabels[termFilter] : (isRTL ? "الفصل الأول" : "Term 1");

  const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all border-2 border-stone-200 bg-white text-stone-800 hover:bg-stone-50 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  const btnPrimary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-emerald-700 text-white hover:bg-emerald-800 cursor-pointer shadow-lg shadow-emerald-700/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="space-y-6 pb-20" dir={isRTL ? "rtl" : "ltr"}>
      <PageHeader
        title={isRTL ? "طباعة النتائج" : "Print Results"}
        subtitle={isRTL ? "طباعة شهادات نتائج الطلاب حسب المعايير المعتمدة بالسودان، مع إمكانية التخصيص الكامل للشعار والختم والألوان" : "Print official student certificates according to Sudanese standards with full branding control"}
      >
        <div className="flex gap-3 items-center">
          <a
            href="/grades"
            className={`${btnOutline} h-10 px-4 text-xs`}
          >
            <Award size={16} />
            <span>{isRTL ? "رصد الدرجات" : "Enter Grades"}</span>
          </a>
          <button
            onClick={() => handlePrint()}
            className={`${btnPrimary} h-11 px-6 text-sm font-bold`}
          >
            <Printer size={18} />
            <span>
              {selectedStudents.length > 0
                ? (isRTL ? `طباعة شهادات الطلاب المحددون (${selectedStudents.length})` : `Print Selected (${selectedStudents.length})`)
                : (isRTL ? `طباعة نتائج الصف كاملاً (${filteredStudents.length})` : `Print All Filtered (${filteredStudents.length})`)
              }
            </span>
          </button>
        </div>
      </PageHeader>

      {/* ── CUSTOMIZATION TOOLBAR ── */}
      <Card className="p-6 bg-white border border-stone-200/80 shadow-sm rounded-3xl space-y-6">
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Palette size={18} />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-sm">{isRTL ? "أدوات تخصيص وتصميم الشهادة السودانية" : "Sudanese Certificate Customization"}</h3>
              <p className="text-xs text-stone-400">{isRTL ? "تعديل اسم المدرسة، رفع الشعار، اختيار نمط الشهادة والوان الهوية" : "Customize school name, logo, certificate orientation and theme"}</p>
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

          {/* Certificate Layout Switcher */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "نمط ونموذج الشهادة *" : "Certificate Layout *"}</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setCertificateLayout("portrait")}
                className={`h-11 px-3 rounded-xl border text-sm font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${certificateLayout === "portrait" ? "border-emerald-700 bg-emerald-50 text-emerald-950 shadow-sm" : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"}`}
              >
                <Layout size={16} />
                <span>عمودي</span>
              </button>
              <button
                onClick={() => setCertificateLayout("landscape")}
                className={`h-11 px-3 rounded-xl border text-sm font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${certificateLayout === "landscape" ? "border-emerald-700 bg-emerald-50 text-emerald-950 shadow-sm" : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"}`}
              >
                <LayoutGrid size={16} />
                <span>أفقي</span>
              </button>
            </div>
          </div>

          {/* School Name & Principal Input */}
          <div className="space-y-4 md:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "اسم المدرسة الرسمي *" : "Official School Name *"}</label>
                <Input
                  value={customSchoolName}
                  onChange={(e) => setCustomSchoolName(e.target.value)}
                  placeholder={isRTL ? "أدخل اسم المدرسة الرسمي" : "Enter official school name"}
                  className="h-10 rounded-xl border-stone-200 text-xs font-bold bg-stone-50/50 placeholder:text-stone-400 placeholder:font-normal"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "اسم مدير المدرسة *" : "School Principal Name *"}</label>
                <Input
                  value={principalName}
                  onChange={(e) => setPrincipalName(e.target.value)}
                  placeholder={isRTL ? "أدخل اسم مدير المدرسة" : "Enter principal name"}
                  className="h-10 rounded-xl border-stone-200 text-xs font-bold bg-stone-50/50 placeholder:text-stone-400 placeholder:font-normal"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "ولاية ومحلية المدرسة" : "Government Locality"}</label>
                <Input
                  value={govLocality}
                  onChange={(e) => setGovLocality(e.target.value)}
                  placeholder={isRTL ? "أدخل الولاية والمحلية" : "Enter state and locality"}
                  className="h-10 rounded-xl border-stone-200 text-xs font-bold bg-stone-50/50 placeholder:text-stone-400 placeholder:font-normal"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "العام الدراسي *" : "Academic Year *"}</label>
                <Input
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  placeholder={isRTL ? "أدخل العام الدراسي" : "Enter academic year"}
                  className="h-10 rounded-xl border-stone-200 text-xs font-bold bg-stone-50/50 placeholder:text-stone-400 placeholder:font-normal"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "مرحلة التعليم" : "School Stage"}</label>
                <Input
                  value={schoolStage}
                  onChange={(e) => setSchoolStage(e.target.value)}
                  placeholder={isRTL ? "أدخل مرحلة التعليم" : "Enter school stage"}
                  className="h-10 rounded-xl border-stone-200 text-xs font-bold bg-stone-50/50 placeholder:text-stone-400 placeholder:font-normal"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "هاتف المدرسة" : "School Phone"}</label>
                <Input
                  value={schoolPhone}
                  onChange={(e) => setSchoolPhone(e.target.value)}
                  placeholder={isRTL ? "أدخل هاتف المدرسة" : "Enter phone number"}
                  className="h-10 rounded-xl border-stone-200 text-xs font-bold bg-stone-50/50 placeholder:text-stone-400 placeholder:font-normal"
                />
              </div>
            </div>
          </div>

          {/* Logo Uploader */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "شعار المدرسة بالشهادة" : "School Logo"}</label>
            <div className="flex items-center gap-3 bg-stone-50 p-2.5 rounded-2xl border border-stone-100">
              {customLogo ? (
                <img src={customLogo} alt="Logo" className="h-12 w-12 object-contain rounded-xl border border-stone-200 bg-white p-1" />
              ) : (
                <div className="h-12 w-12 rounded-xl border-2 border-dashed border-stone-300 bg-white flex items-center justify-center text-stone-400 font-bold text-[9px] text-center p-1">
                  بلا شعار
                </div>
              )}
              <div className="flex-1 space-y-1">
                <label className={`${btnOutline} h-8 px-2 text-[11px] w-full cursor-pointer`}>
                  <Upload size={12} />
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

        </div>

        {/* Theme & Options Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-stone-100 pt-4">
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "لون وثيم الشهادة" : "Certificate Color Theme"}</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
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

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "أوجه الطباعة" : "Print Sides"}</label>
            <select
              value={printSide}
              onChange={(e) => setPrintSide(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-xl h-9 px-3 text-xs font-bold focus:outline-none cursor-pointer"
              dir={isRTL ? "rtl" : "ltr"}
            >
              <option value="front">{isRTL ? "الوجه الأمامي فقط (شهادة النتيجة)" : "Front Certificate Only"}</option>
              <option value="both">{isRTL ? "الجهتان (الأمامي والغلاف الخلفي)" : "Both Sides (With Cover Back)"}</option>
            </select>
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
            className="bg-stone-50 border border-stone-200 rounded-xl h-11 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600/20 cursor-pointer"
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
            className="bg-stone-50 border border-stone-200 rounded-xl h-11 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600/20 cursor-pointer"
            dir={isRTL ? "rtl" : "ltr"}
          >
            {Object.entries(termLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-between border-t border-stone-100 pt-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button onClick={selectAll} className={`${btnOutline} h-9 px-4 text-xs font-bold`}>
              <CheckSquare size={14} />
              {selectedStudents.length === filteredStudents.length && filteredStudents.length > 0
                ? (isRTL ? "إلغاء تحديد الكل" : "Deselect All")
                : (isRTL ? "تحديد جميع الطلاب" : "Select All")
              }
            </button>
            <span className="text-xs text-stone-500 font-bold">
              {isRTL
                ? `${filteredStudents.length} طالب في القائمة | ${selectedStudents.length} محدد للطباعة الجماعية`
                : `${filteredStudents.length} students | ${selectedStudents.length} selected`
              }
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePrint()}
              className={`${btnPrimary} h-9 px-5 text-xs font-bold`}
            >
              <Printer size={15} />
              {selectedStudents.length > 0
                ? (isRTL ? `طباعة شهادات الطلاب المحددون (${selectedStudents.length})` : `Print Selected (${selectedStudents.length})`)
                : (isRTL ? `طباعة جميع نتائج هذا الكشف (${filteredStudents.length})` : `Print All Filtered (${filteredStudents.length})`)
              }
            </button>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="w-full py-16 text-center text-stone-500">
            <div className="flex items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-800" />
              <span>{isRTL ? "جاري تجميع درجات ومواد الطلاب وفق المنهج السوداني..." : "Loading marksheets..."}</span>
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
                  <th className="py-3 px-4 text-start text-[10px] font-black uppercase tracking-widest text-stone-400">{isRTL ? "اسم الطالب الرباعي" : "Student Name"}</th>
                  <th className="py-3 px-4 text-start text-[10px] font-black uppercase tracking-widest text-stone-400">{isRTL ? "رقم الجلوس" : "ID"}</th>
                  <th className="py-3 px-4 text-center text-[10px] font-black uppercase tracking-widest text-stone-400">{isRTL ? "الصف الدراسي" : "Grade"}</th>
                  <th className="py-3 px-4 text-center text-[10px] font-black uppercase tracking-widest text-stone-400">{isRTL ? "المواد المرصودة" : "Graded Subjects"}</th>
                  <th className="py-3 px-4 text-center text-[10px] font-black uppercase tracking-widest text-stone-400">{isRTL ? "المجموع والتقدير" : "Total & Grade"}</th>
                  <th className="py-3 px-4 text-center text-[10px] font-black uppercase tracking-widest text-stone-400 w-[150px]">{isRTL ? "معاينة وطباعة" : "Actions"}</th>
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
                  const gl = getGradeLabelSudan(gradedItems.length > 0 ? avg : null);

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
                            avg >= 85 ? "bg-emerald-100 text-emerald-800" :
                            avg >= 80 ? "bg-sky-100 text-sky-800" :
                            avg >= 65 ? "bg-amber-100 text-amber-800" :
                            avg >= 50 ? "bg-orange-100 text-orange-800" :
                            "bg-rose-100 text-rose-800"
                          }`}>
                            {totalS} / {totalM} — {gl.label} ({avg}%)
                          </Badge>
                        ) : (
                          <span className="text-stone-400 text-xs font-semibold">قيد الرصد بالكنترول</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handlePreview(s)}
                            className="h-8 px-2.5 rounded-lg text-xs font-bold text-emerald-800 hover:bg-emerald-50 transition-colors inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Eye size={13} />
                            {isRTL ? "معاينة" : "Preview"}
                          </button>
                          <button
                            onClick={() => handlePrint([s])}
                            className="h-8 px-2 rounded-lg text-xs font-bold text-stone-700 hover:bg-stone-100 transition-colors inline-flex items-center gap-1 cursor-pointer"
                            title={isRTL ? "طباعة شهادة هذا الطالب فقط" : "Print single"}
                          >
                            <Printer size={13} />
                            {isRTL ? "طباعة" : "Print"}
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

      {/* Preview Dialog - Modal بمعاينة مُصغَّرة وصحيحة */}
      {showPreview && previewStudent && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-sm overflow-y-auto py-4 no-print"
          onClick={() => setShowPreview(false)}
        >
          <div
            className="relative w-full mx-4"
            style={{ maxWidth: certificateLayout === 'portrait' ? '860px' : '1060px' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* شريط التحكم العلوي */}
            <div className="sticky top-0 z-10 bg-white rounded-2xl p-3 mb-3 flex items-center justify-between shadow-2xl border border-stone-200">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Eye size={18} className="text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-sm leading-tight">
                    {previewStudent.full_name || previewStudent.name}
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    {previewStudent.grade || '—'} · {customSchoolName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* مفتاح سريع للنمط */}
                <div className="hidden sm:flex items-center gap-1 bg-stone-100 rounded-lg p-1">
                  <button
                    onClick={() => setCertificateLayout('portrait')}
                    className={`h-7 px-2 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                      certificateLayout === 'portrait' ? 'bg-white shadow text-emerald-800' : 'text-stone-500 hover:text-stone-700'
                    }`}
                  >
                    عمودي
                  </button>
                  <button
                    onClick={() => setCertificateLayout('landscape')}
                    className={`h-7 px-2 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                      certificateLayout === 'landscape' ? 'bg-white shadow text-emerald-800' : 'text-stone-500 hover:text-stone-700'
                    }`}
                  >
                    أفقي
                  </button>
                </div>
                <button
                  onClick={() => handlePrint([previewStudent])}
                  className={`${btnPrimary} h-9 px-4 text-xs font-bold`}
                >
                  <Printer size={14} />
                  {isRTL ? 'طباعة الشهادة' : 'Print'}
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  className="h-9 w-9 rounded-xl bg-stone-100 text-stone-600 hover:bg-stone-200 flex items-center justify-center cursor-pointer transition-colors font-bold text-lg"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* تنبيه: التغييرات في الحقول تظهر فوراً في المعاينة */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 mb-3 text-xs text-amber-800 font-bold flex items-center gap-2">
              <span>💡</span>
              <span>أي تغيير في اسم المدرسة أو المدير أو لون الشهادة يظهر فوراً في المعاينة أدناه</span>
            </div>

            {/* الشهادة المُصغَّرة */}
            <div className="bg-stone-800 rounded-2xl p-3 shadow-2xl">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-white text-[11px] font-bold opacity-80">
                  {certificateLayout === 'portrait'
                    ? 'الشهادة السودانية الرسمية — A4 عمودي'
                    : 'كشف الدرجات الأفقي — A4 landscape'}
                </span>
                <span className="text-stone-400 text-[10px]">معاينة مُصغَّرة · للطباعة اضغط الزر أعلاه</span>
              </div>

              {certificateLayout === 'portrait' ? (
                <div className="bg-white rounded-xl overflow-hidden">
                  <PreviewScaledWrapper isLandscape={false}>
                    <SudanesePortraitCertificate
                      student={previewStudent}
                      items={getStudentCompleteSubjectsAndGrades(previewStudent)}
                      attendanceCount={getAbsenceCount(previewStudent)}
                      schoolName={customSchoolName || 'مدارس الأستاذ سمير القرآنية الخاصة'}
                      schoolLogo={customLogo || existingSettings?.school_logo || ""}
                      theme={activeTheme}
                      termLabel={currentTermLabel}
                      principalName={principalName || ''}
                      govLocality={govLocality}
                      academicYear={academicYear}
                      schoolStage={schoolStage}
                      schoolPhone={schoolPhone}
                    />
                  </PreviewScaledWrapper>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-white rounded-xl overflow-hidden">
                    <PreviewScaledWrapper isLandscape={true}>
                      <CertificateMarksheetFront
                        student={previewStudent}
                        items={getStudentCompleteSubjectsAndGrades(previewStudent)}
                        attendanceCount={getAbsenceCount(previewStudent)}
                        schoolName={customSchoolName || 'مدارس الأستاذ سمير القرآنية الخاصة'}
                        schoolLogo={customLogo || existingSettings?.school_logo || ""}
                        theme={activeTheme}
                        termLabel={currentTermLabel}
                        principalName={principalName || ''}
                        govLocality={govLocality}
                        academicYear={academicYear}
                        schoolStage={schoolStage}
                        phone={schoolPhone}
                      />
                    </PreviewScaledWrapper>
                  </div>
                  {printSide === 'both' && (
                    <div className="bg-white rounded-xl overflow-hidden">
                      <div className="bg-stone-700 text-white text-[11px] font-bold px-3 py-1.5 text-center">
                        الوجه الخلفي — الغلاف والإرشادات
                      </div>
                      <PreviewScaledWrapper isLandscape={true}>
                        <CertificateCoverBack
                          student={previewStudent}
                          schoolName={customSchoolName || 'مدارس الأستاذ سمير القرآنية الخاصة'}
                          theme={activeTheme}
                          govLocality={govLocality}
                          schoolStage={schoolStage}
                          phone={schoolPhone}
                        />
                      </PreviewScaledWrapper>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
//  HIGH PRECISION SUDANESE CERTIFICATE PRINT CSS
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

/* ── PORTRAIT CERTIFICATE STYLES ── */
.sudan-cert-portrait {
  width: 210mm;
  height: 297mm;
  min-height: 297mm;
  margin: 0 auto;
  padding: 6mm;
  box-sizing: border-box;
  page-break-after: always;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sudan-outer-border {
  border: 3px double #000;
  border-radius: 12px;
  padding: 4px;
  height: 100%;
}

.sudan-inner-border {
  border: 1.5px solid #000;
  border-radius: 8px;
  padding: 10px 14px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.sudan-header-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  justify-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

/* دفع المربع الأيمن لليمين والأيسر لليسار - يحاكي الصورة */
.sudan-header-grid .sudan-header-side:first-child { justify-self: end; }
.sudan-header-grid .sudan-header-side:last-child { justify-self: start; }

.sudan-header-side {
  width: 140px;
  height: 140px;
  border: 1.5px solid #000;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6px 5px;
  box-sizing: border-box;
  overflow: hidden;
  gap: 2px;
}

.sudan-header-center {
  grid-column: 1 / -1;
  text-align: center;
  padding: 4px 10px;
}

.sudan-school-name {
  font-family: 'Amiri', serif;
  line-height: 1.2;
}

.sudan-cert-title-badge {
  display: inline-block;
  border: 1.5px solid #000;
  border-radius: 20px;
  padding: 3px 18px;
  margin-top: 4px;
}

.sudan-student-info-box {
  border: 1.5px solid #000;
  border-radius: 8px;
  padding: 8px 12px;
  margin-bottom: 8px;
}

.sudan-table-container {
  margin-bottom: 6px;
  flex: 1;
}

.sudan-subjects-table {
  width: 100%;
  border-collapse: collapse;
  border: 2px solid #000;
  text-align: center;
}

.sudan-subjects-table th,
.sudan-subjects-table td {
  border: 1.5px solid #000;
  padding: 4px 2px;
  font-size: 11px;
}

.sudan-subjects-table th {
  font-weight: 800;
}

.sudan-mini-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #000;
}

.sudan-mini-table th,
.sudan-mini-table td {
  border: 1px solid #000;
  padding: 2.5px;
  font-size: 9.5px;
}

.stamp-circle-sudan {
  width: 76px;
  height: 76px;
  border: 2px solid #1e3a8a;
  border-radius: 50%;
  color: #1e3a8a;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transform: rotate(-10deg);
  text-align: center;
  padding: 2px;
}

/* ── LANDSCAPE CERTIFICATE STYLES ── */
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

.pro-header-grid {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.header-box-side {
  border: 1.5px solid #000;
  border-radius: 8px;
  padding: 6px 5px;
  width: 140px;
  height: 140px;
  min-width: 140px;
  min-height: 140px;
  box-sizing: border-box;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  gap: 1px;
  text-align: center;
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
  align-items: flex-start;
  border-bottom: 1.5px solid #000;
  padding-bottom: 4px;
  margin-bottom: 6px;
}

.meta-left p, .meta-right p {
  font-size: 12.5px;
}

.meta-right {
  transform: translateX(78px);
}

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
  font-size: 12px;
}

.th-label-side, .td-label-side {
  font-weight: 900;
  width: 115px;
}

.th-total-col, .td-total-col {
  width: 85px;
}

.tr-scores-row td {
  font-size: 13px;
}

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
  margin: 0 auto;
  text-align: center;
}

.pro-bullet-list li {
  font-size: 12.5px;
  font-weight: 700;
  line-height: 1.7;
  text-align: center;
  position: relative;
  padding: 0;
}

.pro-bullet-list li::before {
  content: "• ";
  position: static;
  display: inline;
  font-size: 13px;
  font-weight: 900;
  margin-left: 4px;
}

.panel-inner {
  width: 100%;
  align-items: center;
  text-align: center;
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

.sudan-footer-notice,
.pro-footer-warning {
  text-align: center !important;
  width: 100% !important;
  margin: 0 auto !important;
  transform: none !important;
  padding-left: 0 !important;
  padding-right: 0 !important;
  left: auto !important;
  right: auto !important;
  display: block;
}

@media print {
  body { background: #fff; }
  .sudan-cert-portrait,
  .pro-cert-page-landscape {
    page-break-after: always;
    margin: 0;
    padding: 5mm;
  }
  .sudan-header-side,
  .header-box-side {
    width: 140px !important;
    height: 140px !important;
    min-width: 140px !important;
    min-height: 140px !important;
    flex-shrink: 0 !important;
  }
}
`;
