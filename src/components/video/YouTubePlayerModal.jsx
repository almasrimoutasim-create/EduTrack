import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  X, 
  Maximize2, 
  Minimize2, 
  ExternalLink, 
  Copy, 
  Check, 
  Video, 
  User, 
  BookOpen, 
  Clock, 
  AlertCircle,
  Loader2,
  ShieldCheck
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Extracts a YouTube 11-character video ID from almost any YouTube URL format:
 * - https://www.youtube.com/watch?v=xxxx
 * - https://youtu.be/xxxx
 * - https://www.youtube.com/embed/xxxx
 * - https://www.youtube.com/live/xxxx
 * - https://www.youtube.com/shorts/xxxx
 * - URLs with additional query parameters (e.g. ?si=..., &t=...)
 */
export function extractYouTubeId(url) {
  if (!url || typeof url !== "string") return null;
  const cleaned = url.trim();
  const regExp = /(?:youtube(?:-nocookie)?\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|live|shorts)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = cleaned.match(regExp);
  return match ? match[1] : null;
}

export function getYouTubeThumbnail(url) {
  const vid = extractYouTubeId(url);
  return vid ? `https://img.youtube.com/vi/${vid}/hqdefault.jpg` : null;
}

export default function YouTubePlayerModal({
  video,
  isOpen,
  onClose,
  isRTL = true,
  canManage = false
}) {
  const [copied, setCopied] = useState(false);
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  const [isTheater, setIsTheater] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  useEffect(() => {
    setIsIframeLoaded(false);
    setIsTheater(false);
    setShowFullDescription(false);
  }, [video?.id, isOpen]);

  if (!video) return null;

  const videoId = extractYouTubeId(video.youtube_url);
  const embedUrl = videoId
    ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`
    : null;

  const handleCopyLink = () => {
    if (!video.youtube_url) return;
    navigator.clipboard.writeText(video.youtube_url);
    setCopied(true);
    toast.success(isRTL ? "تم نسخ الرابط" : "Link copied to clipboard");
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={`p-0 overflow-hidden border-stone-200 bg-white transition-all duration-300 rounded-3xl ${
          isTheater ? "max-w-6xl w-[96vw]" : "max-w-4xl w-[92vw]"
        }`}
        dir={isRTL ? "rtl" : "ltr"}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{video.title || (isRTL ? "مشغل الفيديو" : "Video Player")}</DialogTitle>
        </DialogHeader>

        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-stone-900 text-white">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="h-8 w-8 rounded-xl bg-red-600/90 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Video size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-black truncate">{video.title}</h3>
              {video.teacher_name && (
                <p className="text-[11px] text-stone-400 truncate flex items-center gap-1">
                  <User size={11} /> {video.teacher_name}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setIsTheater(!isTheater)}
              title={isTheater ? (isRTL ? "حجم عادي" : "Normal size") : (isRTL ? "شاشة مسرحية" : "Theater mode")}
              className="h-8 w-8 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              {isTheater ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>
            <button
              onClick={handleCopyLink}
              title={isRTL ? "نسخ الرابط" : "Copy link"}
              className="h-8 w-8 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
            </button>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Video Player Frame Container */}
        <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
          {!isIframeLoaded && embedUrl && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-950 text-stone-300 gap-3 z-10">
              <Loader2 size={36} className="animate-spin text-red-500" />
              <span className="text-xs font-semibold text-stone-400">
                {isRTL ? "جاري تحميل مشغل الحصة..." : "Loading lesson video..."}
              </span>
            </div>
          )}

          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={video.title || "YouTube video player"}
              className="w-full h-full border-0 absolute inset-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              onLoad={() => setIsIframeLoaded(true)}
            />
          ) : (
            <div className="p-8 text-center text-stone-400 space-y-3">
              <AlertCircle size={40} className="mx-auto text-amber-500" />
              <p className="text-sm font-bold text-stone-200">
                {isRTL ? "تعذر تشغيل هذا الفيديو" : "Unable to play this video"}
              </p>
              <p className="text-xs text-stone-400 max-w-sm">
                {isRTL ? "الرابط المقدم غير صالح أو تم إزالته" : "The provided URL is invalid or removed"}
              </p>
              {video.youtube_url && (
                <a
                  href={video.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-800 text-stone-200 hover:bg-stone-700 text-xs font-semibold"
                >
                  <ExternalLink size={14} /> {isRTL ? "فتح الرابط الخارجي" : "Open external link"}
                </a>
              )}
            </div>
          )}
        </div>

        {/* Video Info & Metadata Details */}
        <div className="p-5 space-y-4 max-h-[35vh] overflow-y-auto">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
            <div className="flex flex-wrap items-center gap-2">
              {video.subject && (
                <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 text-xs font-bold px-2.5 py-0.5">
                  <BookOpen size={12} className="inline mr-1 ml-1" />
                  {video.subject}
                </Badge>
              )}
              {video.grade && (
                <Badge className="bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200 text-xs font-bold px-2.5 py-0.5">
                  {isRTL ? `الصف ${video.grade}` : `Grade ${video.grade}`}
                </Badge>
              )}
              <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200 text-xs font-bold px-2.5 py-0.5 flex items-center gap-1">
                <ShieldCheck size={12} />
                {isRTL ? "حصة معتمدة (غير مدرجة)" : "Verified Unlisted"}
              </Badge>
              {video.video_duration && (
                <Badge className="bg-stone-100 text-stone-600 text-xs font-medium px-2 py-0.5 flex items-center gap-1">
                  <Clock size={11} /> {video.video_duration}
                </Badge>
              )}
            </div>

            {video.created_at && (
              <span className="text-xs text-stone-400">
                {new Date(video.created_at).toLocaleDateString(isRTL ? "ar-EG" : "en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric"
                })}
              </span>
            )}
          </div>

          {/* Description */}
          {video.description && (
            <div className="bg-stone-50 rounded-2xl p-3.5 text-xs text-stone-700 leading-relaxed">
              <h4 className="font-bold text-stone-900 mb-1 flex items-center gap-1.5">
                {isRTL ? "وصف ومحتوى الحصة:" : "Lesson Description:"}
              </h4>
              <p className={showFullDescription ? "whitespace-pre-line" : "line-clamp-3 whitespace-pre-line"}>
                {video.description}
              </p>
              {video.description.length > 180 && (
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="text-indigo-600 hover:text-indigo-700 font-bold mt-1.5 cursor-pointer block"
                >
                  {showFullDescription ? (isRTL ? "عرض أقل" : "Show less") : (isRTL ? "عرض المزيد..." : "Read more...")}
                </button>
              )}
            </div>
          )}

          {/* Unlisted security badge note */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-[11px] text-amber-800">
            <AlertCircle size={14} className="shrink-0 text-amber-600" />
            <span>
              {isRTL
                ? "هذا الفيديو غير مدرج (Unlisted) ومتاح حصرياً للطلاب المشتركين داخل بوابة المنصة."
                : "This video is unlisted and accessible exclusively to subscribed students inside the portal."}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
