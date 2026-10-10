import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import YouTubeVideoCard from "@/components/video/YouTubeVideoCard";
import YouTubePlayerModal from "@/components/video/YouTubePlayerModal";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Clapperboard, Search, Loader2, ShieldAlert, Lock, VideoOff
} from "lucide-react";

const API_BASE = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");

async function fetchTeacherVideos() {
  const token =
    localStorage.getItem("portal_jwt_token") || localStorage.getItem("portal_token");

  if (!token) {
    const err = new Error("unauthenticated");
    err.code = "unauthenticated";
    throw err;
  }

  const res = await fetch(`${API_BASE}/api/student/teacher-videos`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401) {
    const err = new Error("unauthenticated");
    err.code = "unauthenticated";
    throw err;
  }
  if (res.status === 403) {
    let message = "";
    try {
      const data = await res.json();
      message = data?.error || "";
    } catch { /* ignore */ }
    const err = new Error(message || "forbidden");
    err.code = "forbidden";
    throw err;
  }
  if (!res.ok) {
    const err = new Error(`request_failed_${res.status}`);
    err.code = "request_failed";
    throw err;
  }

  const data = await res.json();
  return Array.isArray(data?.videos) ? data.videos : [];
}

export default function StudentRecordedVideos({ isRTL = true }) {
  const [query, setQuery] = useState("");
  const [playing, setPlaying] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const { data: videos = [], isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["student-recorded-videos"],
    queryFn: fetchTeacherVideos,
    retry: (failureCount, err) => (err?.code === "unauthenticated" ? false : failureCount < 2),
    refetchOnWindowFocus: false,
  });

  const errorCode = isError ? (error?.code || "request_failed") : null;

  const filteredVideos = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return videos;
    return videos.filter(v =>
      [v.title, v.description, v.subject, v.teacher_name, v.grade]
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

  const header = (
    <div className="space-y-1">
      <h2 className="text-2xl font-black text-stone-900 flex items-center gap-2">
        <Clapperboard size={24} className="text-emerald-600" />
        {isRTL ? "المكتبة الرقمية" : "Digital Library"}
      </h2>
      <p className="text-sm text-stone-500 font-semibold">
        {isRTL
          ? "حصص مسجلة من معلميك، متاحة داخل بوابة الطالب فقط."
          : "Lessons recorded by your teachers, available inside the student portal only."}
      </p>
      <div className="flex items-center gap-2 pt-1">
        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] font-bold px-2.5 py-1 flex items-center gap-1">
          <ShieldAlert size={12} />
          {isRTL ? "وصول مقيّد بالاشتراك والصف" : "Restricted to enrolled students"}
        </Badge>
        {!isLoading && !errorCode && (
          <Badge className="bg-stone-100 text-stone-700 border-stone-200 text-[11px] font-bold px-2.5 py-1">
            {isRTL ? `${videos.length} فيديو` : `${videos.length} videos`}
          </Badge>
        )}
      </div>
    </div>
  );

  if (errorCode === "unauthenticated") {
    return (
      <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
        {header}
        <Card className="p-14 text-center border-dashed border-2 border-stone-200 bg-white rounded-[32px]">
          <Lock size={44} className="mx-auto text-stone-300 mb-3" />
          <p className="font-black text-lg text-stone-700">
            {isRTL ? "يلزم تسجيل الدخول" : "Sign in required"}
          </p>
          <p className="text-sm text-stone-500 mt-1">
            {isRTL ? "سجّل الدخول ببوابة الطالب لمشاهدة المكتبة الرقمية." : "Sign in to the student portal to watch recorded videos."}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      {header}

      {errorCode === "forbidden" ? (
        <Card className="p-14 text-center border-dashed border-2 border-amber-300 bg-amber-50/60 rounded-[32px]">
          <Lock size={44} className="mx-auto text-amber-500 mb-3" />
          <p className="font-black text-lg text-stone-800">
            {isRTL ? "المحتوى غير متاح لك حالياً" : "This content is not available to you"}
          </p>
          <p className="text-sm text-stone-600 mt-1 max-w-md mx-auto leading-relaxed">
            {isRTL
              ? "فيديوهات حصص المعلم متاحة حصرياً للطلاب المشتركين والمفعلين معه."
              : "Lesson videos from this teacher are available exclusively to subscribed and approved students."}
          </p>
        </Card>
      ) : isLoading ? (
        <Card className="p-16 text-center border-dashed border-2 border-stone-200 bg-white rounded-[32px]">
          <Loader2 size={36} className="animate-spin text-emerald-600 mx-auto" />
          <p className="text-sm font-bold text-stone-500 mt-4">
            {isRTL ? "جاري تحميل الفيديوهات..." : "Loading videos..."}
          </p>
        </Card>
      ) : errorCode ? (
        <Card className="p-14 text-center border-dashed border-2 border-rose-300 bg-rose-50/60 rounded-[32px]">
          <VideoOff size={44} className="mx-auto text-rose-400 mb-3" />
          <p className="font-black text-lg text-stone-800">
            {isRTL ? "تعذر تحميل الفيديوهات" : "Could not load videos"}
          </p>
          <p className="text-sm text-stone-600 mt-1">
            {isRTL ? "تحقق من اتصالك بالإنترنت ثم أعد المحاولة." : "Check your connection and try again."}
          </p>
          <button
            onClick={() => refetch()}
            className="mt-5 h-10 px-5 rounded-2xl bg-stone-900 text-white text-sm font-bold hover:bg-black transition-all cursor-pointer"
          >
            {isRTL ? "إعادة المحاولة" : "Retry"}
          </button>
        </Card>
      ) : videos.length === 0 ? (
        <Card className="p-16 text-center border-dashed border-2 border-stone-200 bg-stone-50/50 rounded-[32px]">
          <Clapperboard size={48} className="mx-auto text-stone-300 mb-3" />
          <p className="font-black text-lg text-stone-700">
            {isRTL ? "لا توجد فيديوهات مسجلة حالياً" : "No recorded videos yet"}
          </p>
          <p className="text-sm text-stone-500 mt-1">
            {isRTL
              ? "ستظهر هنا الفيديوهات التي ينشرها معلموك لفصولك."
              : "Videos published by your teachers for your classes will appear here."}
          </p>
        </Card>
      ) : (
        <>
          <div className="relative max-w-md">
            <Search size={16} className="absolute top-1/2 -translate-y-1/2 text-stone-400 start-4" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={isRTL ? "ابحث في الفيديوهات..." : "Search videos..."}
              className="h-11 ps-11 rounded-2xl bg-white border-stone-200"
            />
          </div>

          {filteredVideos.length === 0 ? (
            <Card className="p-14 text-center border-dashed border-2 border-stone-200 bg-white rounded-[32px]">
              <Search size={40} className="mx-auto text-stone-300 mb-3" />
              <p className="font-black text-lg text-stone-700">
                {isRTL ? "لا توجد نتائج مطابقة" : "No matching videos"}
              </p>
              <button
                onClick={() => setQuery("")}
                className="mt-4 text-sm font-bold text-emerald-700 hover:underline cursor-pointer bg-transparent border-none"
              >
                {isRTL ? "مسح البحث" : "Clear search"}
              </button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredVideos.map(video => (
                <YouTubeVideoCard
                  key={video.id}
                  video={video}
                  isRTL={isRTL}
                  isTeacher={false}
                  onPlay={setPlaying}
                  onCopyLink={copyLink}
                  copiedId={copiedId}
                />
              ))}
            </div>
          )}

          {isFetching && !isLoading && (
            <p className="text-xs font-bold text-stone-400 text-center">
              {isRTL ? "جاري التحديث..." : "Refreshing..."}
            </p>
          )}
        </>
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
