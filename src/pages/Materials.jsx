import React, { useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import PageHeader from "@/components/shared/PageHeader";
import AdminRecordedVideosManager from "@/components/admin/AdminRecordedVideosManager";
import AdminStudyMaterialsManager from "@/components/admin/AdminStudyMaterialsManager";
import { Video, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Route: /materials — two libraries side by side:
 * 1) Recorded (unlisted) YouTube videos → teacher_youtube_videos
 *    (flows to teacher tab=videos + student view=videos).
 * 2) Digital study materials (PDF/notes/links) → study_materials
 *    (flows to teacher tab=materials + student view=materials).
 */
export default function Materials() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const [tab, setTab] = useState("videos");

  return (
    <div className="space-y-6 pb-20" dir={isRTL ? "rtl" : "ltr"}>
      <PageHeader
        title={isRTL ? "المواد التعليمية" : "Learning Materials"}
        subtitle={isRTL ? "مكتبة المدرسة — فيديوهات مسجلة ومواد رقمية، تُنشر مرة واحدة لتظهر للمعلمين والطلاب" : "School library — videos and digital materials, published once for teachers and students"}
      />
      <div className="flex gap-2 p-1 rounded-2xl bg-stone-100 border border-stone-200 w-fit">
        {[
          { id: "videos", label: isRTL ? "الفيديوهات المسجلة" : "Recorded Videos", icon: Video },
          { id: "digital", label: isRTL ? "المواد الدراسية الرقمية" : "Digital Materials", icon: BookOpen },
        ].map(t => (
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
      {tab === "videos" ? (
        <AdminRecordedVideosManager isRTL={isRTL} />
      ) : (
        <AdminStudyMaterialsManager isRTL={isRTL} />
      )}
    </div>
  );
}
