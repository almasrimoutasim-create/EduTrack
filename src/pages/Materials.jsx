import React, { useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import PageHeader from "@/components/shared/PageHeader";
import AdminRecordedVideosManager from "@/components/admin/AdminRecordedVideosManager";
import AdminStudyMaterialsManager from "@/components/admin/AdminStudyMaterialsManager";
import { Video, BookOpen, BookMarked } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Route: /materials — three central libraries:
 * 1) Curriculum Textbooks (كتب المنهج) → study_materials (type="textbook")
 * 2) Digital study materials (PDF/notes/links) → study_materials
 * 3) Recorded YouTube videos → teacher_youtube_videos
 */
export default function Materials() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const [tab, setTab] = useState("textbooks");

  const tabs = [
    { id: "textbooks", label: isRTL ? "كتب المنهج الدراسي" : "Curriculum Textbooks", icon: BookMarked },
    { id: "digital", label: isRTL ? "المواد الدراسية الرقمية" : "Digital Materials", icon: BookOpen },
    { id: "videos", label: isRTL ? "الفيديوهات المسجلة" : "Recorded Videos", icon: Video },
  ];

  return (
    <div className="space-y-6 pb-20" dir={isRTL ? "rtl" : "ltr"}>
      <PageHeader
        title={isRTL ? "المواد والمناهج التعليمية" : "Learning Materials & Curricula"}
        subtitle={isRTL
          ? "مكتبة المدرسة — كتب المنهج الدراسي والمواد الرقمية والفيديوهات المسجلة، تُدار مركزياً لتظهر للمعلمين والطلاب"
          : "School library — curriculum textbooks, digital materials and recorded videos, managed centrally for teachers and students"}
      />
      <div className="flex flex-wrap gap-2 p-1 rounded-2xl bg-stone-100 border border-stone-200 w-fit">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "h-10 px-5 rounded-xl text-sm font-black flex items-center gap-2 transition-all cursor-pointer border-0",
              tab === t.id ? "bg-stone-900 text-white shadow" : "text-stone-500 hover:text-stone-900"
            )}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>
      {tab === "textbooks" && (
        <AdminStudyMaterialsManager isRTL={isRTL} mode="textbooks" />
      )}
      {tab === "digital" && (
        <AdminStudyMaterialsManager isRTL={isRTL} mode="materials" />
      )}
      {tab === "videos" && (
        <AdminRecordedVideosManager isRTL={isRTL} />
      )}
    </div>
  );
}
