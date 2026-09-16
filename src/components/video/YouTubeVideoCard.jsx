import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  PlayCircle, 
  Eye, 
  EyeOff, 
  Trash2, 
  Edit3, 
  Copy, 
  Check, 
  Clock, 
  User, 
  Users, 
  Lock, 
  ShieldCheck,
  ExternalLink 
} from "lucide-react";
import { extractYouTubeId, getYouTubeThumbnail } from "./YouTubePlayerModal";

export default function YouTubeVideoCard({
  video,
  isRTL = true,
  isTeacher = false,
  onPlay,
  onEdit,
  onToggleHidden,
  onDelete,
  onCopyLink,
  copiedId
}) {
  const thumbnail = video.thumbnail_url || getYouTubeThumbnail(video.youtube_url);
  const isCopied = copiedId === video.id;

  return (
    <Card className="rounded-2xl border-stone-200/80 bg-white overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col group">
      {/* Thumbnail Area */}
      <div 
        onClick={() => onPlay(video)}
        className="relative aspect-video w-full bg-stone-900 cursor-pointer overflow-hidden"
      >
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={video.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-stone-500 bg-stone-100">
            <PlayCircle size={44} className="text-stone-400 mb-1" />
            <span className="text-[11px] font-bold">{isRTL ? "فيديو يوتيوب" : "YouTube Video"}</span>
          </div>
        )}

        {/* Play Overlay Button */}
        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/45 transition-colors flex items-center justify-center">
          <div className="h-12 w-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
            <Play size={22} className={isRTL ? "mr-0.5" : "ml-0.5"} fill="currentColor" />
          </div>
        </div>

        {/* Top Badges overlay */}
        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none">
          <span className="bg-black/75 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
            <ShieldCheck size={11} className="text-emerald-400" />
            {isRTL ? "غير مدرج" : "Unlisted"}
          </span>

          {video.is_hidden && (
            <span className="bg-amber-600/90 text-white text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
              <EyeOff size={11} /> {isRTL ? "مخفي" : "Hidden"}
            </span>
          )}
        </div>

        {/* Duration bottom-right badge if available */}
        {video.video_duration && (
          <div className="absolute bottom-2 left-2 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
            <Clock size={10} /> {video.video_duration}
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            {video.subject && (
              <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-bold px-2 py-0.5">
                {video.subject}
              </Badge>
            )}
            {video.grade && (
              <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] font-bold px-2 py-0.5">
                {isRTL ? `الصف ${video.grade}` : `Grade ${video.grade}`}
              </Badge>
            )}
            {isTeacher && (
              <Badge className="bg-stone-100 text-stone-700 border-stone-200 text-[10px] font-bold px-2 py-0.5 flex items-center gap-1">
                {video.target_student_name ? (
                  <><User size={10} /> {video.target_student_name}</>
                ) : (
                  <><Users size={10} /> {isRTL ? "كل المشتركين" : "All Subscribed"}</>
                )}
              </Badge>
            )}
          </div>

          {/* Title */}
          <h3 
            onClick={() => onPlay(video)}
            className="text-sm font-black text-stone-900 line-clamp-2 hover:text-emerald-700 cursor-pointer transition-colors"
          >
            {video.title}
          </h3>

          {/* Teacher name if student view */}
          {!isTeacher && video.teacher_name && (
            <p className="text-xs text-stone-500 font-semibold mt-1 flex items-center gap-1">
              <User size={12} className="text-indigo-600" />
              {video.teacher_name}
            </p>
          )}

          {/* Description snippet */}
          {video.description && (
            <p className="text-xs text-stone-500 mt-1.5 line-clamp-2 leading-relaxed">
              {video.description}
            </p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center gap-2">
          {/* Main Play Action Button */}
          <button
            onClick={() => onPlay(video)}
            className="flex-1 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Play size={14} fill="currentColor" />
            <span>{isRTL ? "مشاهدة الحصة" : "Watch Lesson"}</span>
          </button>

          {/* Copy link button */}
          <button
            onClick={() => onCopyLink(video)}
            title={isRTL ? "نسخ الرابط" : "Copy URL"}
            className="h-9 w-9 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            {isCopied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
          </button>

          {/* Teacher specific management buttons */}
          {isTeacher && (
            <>
              {onEdit && (
                <button
                  onClick={() => onEdit(video)}
                  title={isRTL ? "تعديل" : "Edit"}
                  className="h-9 w-9 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  <Edit3 size={14} />
                </button>
              )}

              {onToggleHidden && (
                <button
                  onClick={() => onToggleHidden(video.id, video.is_hidden)}
                  title={video.is_hidden ? (isRTL ? "إظهار للطلاب" : "Show to students") : (isRTL ? "إخفاء عن الطلاب" : "Hide from students")}
                  className={`h-9 w-9 rounded-xl border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                    video.is_hidden 
                      ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100" 
                      : "border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700"
                  }`}
                >
                  {video.is_hidden ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              )}

              {onDelete && (
                <button
                  onClick={() => onDelete(video.id)}
                  title={isRTL ? "حذف" : "Delete"}
                  className="h-9 w-9 rounded-xl border border-red-100 bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
