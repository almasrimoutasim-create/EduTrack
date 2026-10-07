import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/dbClient";
import YouTubeVideoCard from "@/components/video/YouTubeVideoCard";
import YouTubePlayerModal from "@/components/video/YouTubePlayerModal";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Clapperboard, Search, Loader2, Building2, CopyPlus, ShieldCheck
} from "lucide-react";

const API_BASE = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");

async function fetchSchoolVideos() {
  const token =
    localStorage.getItem("portal_jwt_token") || localStorage.getItem("portal_token");
  if (!token) {
    const err = new Error("unauthenticated");
    err.code = "unauthenticated";
    throw err;
  }
  const res = await fetch(`${API_BASE}/api/teacher/school-videos`, {
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = new Error(`request_failed_${res.status}`);
    err.code = "request_failed";
    throw err;
  }
  const data = await res.json();
  return Array.isArray(data?.videos) ? data.videos : [];
}

/**
 * Read-only school library inside the teacher portal (tab=videos).
 * Admin-published videos appear here automatically; the teacher can
 * preview them and copy any of them into their own library
 * (creates an owned row in `teacher_youtube_videos`) to republish
 * it to their own students.
 */
export default function SchoolVideosLibrary({ isRTL = true, teacherId }) {
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [playing, setPlaying] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [copyingId, setCopyingId] = useState(null);

  const { data: videos = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["teacher-school-videos", teacherId],
    queryFn: fetchSchoolVideos,
    enabled: !!teacherId,
    refetchOnWindowFocus: false,
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return videos;
    return videos.filter(v =>
      [v.title, v.description, v.subject, v.grade, v.teacher_name, v.owner_name]
        .filter(Boolean)
        .some(val => String(val).toLowerCase().includes(q))
    );
  }, [videos, query]);

  const copyLink = (video) => {
    if (!video?.youtube_url) return;
    navigator.clipboard.writeText(video.youtube_url);
    setCopiedId(video.id);
    toast.success(isRTL ? "تم نسخ الرابط" : "Link copied");
    setTimeout(() => setCopiedId(null), 2200);
  };

  const copyToMyLibrary = async (video) => {
    if (!teacherId) return;
    setCopyingId(video.id);
    try {
      await entities.TeacherYoutubeVideo.create({
        teacher_id: teacherId,
        title: video.title,
        description: video.description || "",
        youtube_url: video.youtube_url,
        thumbnail_url: video.thumbnail_url || undefined,
        subject: video.subject || "",
        grade: video.grade || "",
        target_type: video.target_type || "all",
        target_classes: Array.isArray(video.target_classes) ? video.target_classes : [],
        target_student_id: null,
        target_student_name: null,
        is_hidden: false,
      });
      await qc.invalidateQueries({ queryKey: ["teacher-recorded-videos", teacherId] });
      toast.success(isRTL ? "تم النسخ إلى مكتبتك — يمكنك الآن نشره لطلابك" : "Copied to your library");
    } catch (err) {
      console.error("[school-videos] copy failed:", err);
      toast.error(isRTL ? "تعذر النسخ إلى مكتبتك" : "Could not copy to your library");
    } finally {
      setCopyingId(null);
    }
  };

  if (!teacherId) return null;

  return (
    <div className="space-y-5 pt-2" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 border-t border-stone-100 pt-6">
        <div>
          <h3 className="text-lg font-black text-stone-900 flex items-center gap-2">
            <Building2 size={20} className="text-indigo-600" />
            {isRTL ? "فيديوهات إدارة المدرسة" : "School administration videos"}
          </h3>
          <p className="text-xs text-stone-500 font-semibold mt-1">
            {isRTL
              ? "منشورة من الإدارة لجميع المعلمين — شاهدها للتحضير أو انسخها إلى مكتبتك لنشرها لطلابك."
              : "Published by the administration — preview for lesson prep or copy into your library."}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[11px] font-bold px-2.5 py-1 flex items-center gap-1">
              <ShieldCheck size={12} /> {isRTL ? "مكتبة المدرسة" : "School library"}
            </Badge>
            {!isLoading && !isError && (
              <Badge className="bg-stone-100 text-stone-700 border-stone-200 text-[11px] font-bold px-2.5 py-1">
                {isRTL ? `${videos.length} فيديو` : `${videos.length} videos`}
              </Badge>
            )}
          </div>
        </div>
        <div className="relative w-full md:max-w-xs">
          <Search size={16} className="absolute top-1/2 -translate-y-1/2 text-stone-400 start-4" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={isRTL ? "ابحث في فيديوهات الإدارة..." : "Search school videos..."}
            className="h-10 ps-11 rounded-2xl bg-white border-stone-200 text-sm"
          />
        </div>
      </div>

      {isLoading ? (
        <Card className="p-12 text-center border-dashed border-2 border-stone-200 bg-white rounded-[32px]">
          <Loader2 size={32} className="animate-spin text-indigo-600 mx-auto" />
          <p className="text-sm font-bold text-stone-500 mt-3">
            {isRTL ? "جاري تحميل فيديوهات الإدارة..." : "Loading school videos..."}
          </p>
        </Card>
      ) : isError ? (
        <Card className="p-10 text-center border-dashed border-2 border-stone-200 bg-white rounded-[32px]">
          <p className="text-sm font-bold text-stone-500">
            {isRTL ? "تعذر تحميل فيديوهات الإدارة" : "Could not load school videos"}
          </p>
          <button
            onClick={() => refetch()}
            className="mt-4 h-9 px-4 rounded-xl bg-stone-900 text-white text-xs font-bold cursor-pointer"
          >
            {isRTL ? "إعادة المحاولة" : "Retry"}
          </button>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2 border-stone-200 bg-stone-50/50 rounded-[32px]">
          <Clapperboard size={40} className="mx-auto text-stone-300 mb-2" />
          <p className="font-black text-stone-600">
            {query
              ? (isRTL ? "لا توجد نتائج مطابقة" : "No matching videos")
              : (isRTL ? "لا توجد فيديوهات منشورة من الإدارة بعد" : "No school videos published yet")}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(video => (
            <div key={video.id} className="flex flex-col gap-2">
              <YouTubeVideoCard
                video={video}
                isRTL={isRTL}
                isTeacher={false}
                onPlay={setPlaying}
                onCopyLink={copyLink}
                copiedId={copiedId}
              />
              <button
                onClick={() => copyToMyLibrary(video)}
                disabled={copyingId === video.id}
                className="h-10 rounded-xl border-2 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-black flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
              >
                {copyingId === video.id
                  ? <Loader2 size={14} className="animate-spin" />
                  : <CopyPlus size={14} />}
                {isRTL ? "نسخ إلى مكتبتي ونشره لطلابي" : "Copy to my library"}
              </button>
            </div>
          ))}
        </div>
      )}

      <YouTubePlayerModal
        video={playing}
        isOpen={!!playing}
        onClose={() => setPlaying(null)}
        isRTL={isRTL}
        canManage={false}
      />
    </div>
  );
}
