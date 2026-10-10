import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/dbClient";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import YouTubeVideoCard from "@/components/video/YouTubeVideoCard";
import YouTubePlayerModal, { extractYouTubeId } from "@/components/video/YouTubePlayerModal";
import { toast } from "sonner";
import {
  Video, Plus, Search, Users, GraduationCap, Link2,
  Loader2, ShieldCheck, Clapperboard
} from "lucide-react";

const TARGET_ALL = "all";
const TARGET_CLASSES = "classes";
const TARGET_STUDENT = "student";

const emptyForm = {
  title: "",
  description: "",
  youtube_url: "",
  subject: "",
  grade: "",
  target_type: TARGET_ALL,
  target_classes: [],
  target_student_id: "",
  target_student_name: "",
  is_hidden: false,
};

export default function RecordedVideosManager({ isRTL = true, teacherId, students = [], classes = [] }) {
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null); // video row being edited
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [playing, setPlaying] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["teacher-recorded-videos", teacherId],
    queryFn: () => entities.TeacherYoutubeVideo.filter({ teacher_id: teacherId }, "-created_at"),
    enabled: !!teacherId,
  });

  // Unique classes this teacher teaches, keyed exactly like the backend does:
  // "grade|section" (lower-cased), falling back to the bare grade.
  const classOptions = useMemo(() => {
    const seen = new Map();
    (classes || []).forEach(cls => {
      const grade = String(cls.grade ?? cls.grade_level ?? "").trim();
      const section = String(cls.section ?? "").trim();
      if (!grade) return;
      const key = section ? `${grade}|${section}`.toLowerCase() : grade.toLowerCase();
      if (seen.has(key)) return;
      seen.set(key, {
        key,
        label: section
          ? (isRTL ? `الصف ${grade} - شعبة ${section}` : `Grade ${grade} - Section ${section}`)
          : (isRTL ? `الصف ${grade}` : `Grade ${grade}`),
      });
    });
    return Array.from(seen.values());
  }, [classes, isRTL]);

  const studentOptions = useMemo(() => {
    const list = (students || []).filter(s => s && s.id);
    if (!form.grade) return list;
    return list.filter(s => String(s.grade ?? "") === String(form.grade));
  }, [students, form.grade]);

  const filteredVideos = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return videos;
    return videos.filter(v =>
      [v.title, v.description, v.subject, v.grade]
        .filter(Boolean)
        .some(val => String(val).toLowerCase().includes(q))
    );
  }, [videos, query]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (video) => {
    setEditing(video);
    setForm({
      title: video.title || "",
      description: video.description || "",
      youtube_url: video.youtube_url || "",
      subject: video.subject || "",
      grade: video.grade || "",
      target_type: video.target_type || TARGET_ALL,
      target_classes: Array.isArray(video.target_classes)
        ? video.target_classes
        : (typeof video.target_classes === "string" && video.target_classes.startsWith("[")
          ? safeParse(video.target_classes)
          : []),
      target_student_id: video.target_student_id || "",
      target_student_name: video.target_student_name || "",
      is_hidden: !!video.is_hidden,
    });
    setDialogOpen(true);
  };

  const save = async () => {
    const title = form.title.trim();
    const url = form.youtube_url.trim();
    if (!title) {
      toast.error(isRTL ? "الرجاء إدخال عنوان الفيديو" : "Please enter a video title");
      return;
    }
    if (!extractYouTubeId(url)) {
      toast.error(isRTL ? "رابط يوتيوب غير صالح. الصق رابط الفيديو كاملاً" : "Invalid YouTube link. Paste the full video URL");
      return;
    }

    const payload = {
      title,
      description: form.description.trim(),
      youtube_url: url,
      thumbnail_url: `https://img.youtube.com/vi/${extractYouTubeId(url)}/hqdefault.jpg`,
      subject: form.subject.trim(),
      grade: String(form.grade || "").trim(),
      is_hidden: !!form.is_hidden,
      target_type: form.target_type,
      target_classes: form.target_type === TARGET_CLASSES ? form.target_classes : [],
      target_student_id: form.target_type === TARGET_STUDENT ? (form.target_student_id || null) : null,
      target_student_name: form.target_type === TARGET_STUDENT ? (form.target_student_name || null) : null,
    };

    setSaving(true);
    try {
      if (editing) {
        await entities.TeacherYoutubeVideo.update(editing.id, payload);
        toast.success(isRTL ? "تم تحديث الفيديو" : "Video updated");
      } else {
        await entities.TeacherYoutubeVideo.create({ ...payload, teacher_id: teacherId });
        toast.success(isRTL ? "تمت إضافة الفيديو" : "Video added");
      }
      await qc.invalidateQueries(["teacher-recorded-videos", teacherId]);
      setDialogOpen(false);
      setEditing(null);
      setForm(emptyForm);
    } catch (err) {
      console.error("[recorded-videos] save failed:", err);
      toast.error(isRTL ? "تعذر حفظ الفيديو. حاول مرة أخرى" : "Could not save the video. Please try again");
    } finally {
      setSaving(false);
    }
  };

  const toggleHidden = async (id, currentlyHidden) => {
    try {
      await entities.TeacherYoutubeVideo.update(id, { is_hidden: !currentlyHidden });
      await qc.invalidateQueries(["teacher-recorded-videos", teacherId]);
      toast.success(
        currentlyHidden
          ? (isRTL ? "أصبح الفيديو مرئياً للطلاب" : "Video is now visible to students")
          : (isRTL ? "تم إخفاء الفيديو عن الطلاب" : "Video hidden from students")
      );
    } catch (err) {
      console.error("[recorded-videos] toggle failed:", err);
      toast.error(isRTL ? "تعذر تغيير حالة الإخفاء" : "Could not change visibility");
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await entities.TeacherYoutubeVideo.delete(pendingDelete.id);
      await qc.invalidateQueries(["teacher-recorded-videos", teacherId]);
      toast.success(isRTL ? "تم حذف الفيديو" : "Video deleted");
      setPendingDelete(null);
    } catch (err) {
      console.error("[recorded-videos] delete failed:", err);
      toast.error(isRTL ? "تعذر حذف الفيديو" : "Could not delete the video");
    } finally {
      setDeleting(false);
    }
  };

  const copyLink = (video) => {
    if (!video?.youtube_url) return;
    navigator.clipboard.writeText(video.youtube_url);
    setCopiedId(video.id);
    toast.success(isRTL ? "تم نسخ الرابط" : "Link copied");
    setTimeout(() => setCopiedId(null), 2200);
  };

  const visibleCount = videos.filter(v => !v.is_hidden).length;

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-stone-900 flex items-center gap-2">
            <Clapperboard size={24} className="text-emerald-600" />
            {isRTL ? "المكتبة الرقمية" : "Digital Library"}
          </h2>
          <p className="text-sm text-stone-500 font-semibold mt-1">
            {isRTL
              ? "أضف روابط يوتيوب غير مدرجة (Unlisted) وحدّد الفصول أو الطلاب المصرّح لهم بالمشاهدة."
              : "Add unlisted YouTube links and choose which classes or students are allowed to watch them."}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] font-bold px-2.5 py-1 flex items-center gap-1">
              <ShieldCheck size={12} /> {isRTL ? "غير مدرج على يوتيوب" : "Unlisted on YouTube"}
            </Badge>
            <Badge className="bg-stone-100 text-stone-700 border-stone-200 text-[11px] font-bold px-2.5 py-1">
              {isRTL ? `${videos.length} فيديو · ${visibleCount} مرئي` : `${videos.length} videos · ${visibleCount} visible`}
            </Badge>
          </div>
        </div>

        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 h-11 px-5 rounded-2xl bg-stone-900 text-white text-sm font-bold hover:bg-black transition-all shadow-lg shadow-stone-200 cursor-pointer"
        >
          <Plus size={18} />
          {isRTL ? "إضافة فيديو" : "Add video"}
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute top-1/2 -translate-y-1/2 text-stone-400 start-4" />
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={isRTL ? "ابحث في الفيديوهات..." : "Search videos..."}
          className="h-11 ps-11 rounded-2xl bg-white border-stone-200"
        />
      </div>

      {/* Grid / states */}
      {isLoading ? (
        <Card className="p-16 text-center border-dashed border-2 border-stone-200 bg-white rounded-[32px]">
          <Loader2 size={36} className="animate-spin text-emerald-600 mx-auto" />
          <p className="text-sm font-bold text-stone-500 mt-4">
            {isRTL ? "جاري تحميل الفيديوهات..." : "Loading videos..."}
          </p>
        </Card>
      ) : filteredVideos.length === 0 ? (
        <Card className="p-16 text-center border-dashed border-2 border-stone-200 bg-stone-50/50 rounded-[32px]">
          <Video size={48} className="mx-auto text-stone-300 mb-3" />
          <p className="font-black text-lg text-stone-700">
            {query
              ? (isRTL ? "لا توجد نتائج مطابقة" : "No matching videos")
              : (isRTL ? "لا توجد فيديوهات مسجلة بعد" : "No recorded videos yet")}
          </p>
          <p className="text-sm text-stone-500 mt-1">
            {query
              ? (isRTL ? "جرّب كلمة بحث أخرى" : "Try a different search term")
              : (isRTL ? "أضف أول رابط فيديو غير مدرج لطلابك" : "Add your first unlisted video link for your students")}
          </p>
          {!query && (
            <button
              onClick={openCreate}
              className="mt-5 inline-flex items-center gap-2 h-10 px-5 rounded-2xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors cursor-pointer"
            >
              <Plus size={16} /> {isRTL ? "إضافة فيديو" : "Add video"}
            </button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredVideos.map(video => (
            <YouTubeVideoCard
              key={video.id}
              video={video}
              isRTL={isRTL}
              isTeacher
              onPlay={setPlaying}
              onEdit={openEdit}
              onToggleHidden={toggleHidden}
              onDelete={() => setPendingDelete(video)}
              onCopyLink={copyLink}
              copiedId={copiedId}
            />
          ))}
        </div>
      )}

      {/* Create / edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={open => { if (!open) { setDialogOpen(false); setEditing(null); } }}>
        <DialogContent className="max-w-2xl w-[94vw] max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-0" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="text-xl font-black text-stone-900 flex items-center gap-2">
              <Video size={20} className="text-emerald-600" />
              {editing ? (isRTL ? "تعديل الفيديو" : "Edit video") : (isRTL ? "إضافة فيديو مسجل" : "Add recorded video")}
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 pb-2 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-black text-stone-700">
                {isRTL ? "العنوان *" : "Title *"}
              </Label>
              <Input
                value={form.title}
                onChange={e => upd("title", e.target.value)}
                placeholder={isRTL ? "مثال: محاضرة الجبر - الدرس الأول" : "e.g. Algebra lecture - Lesson 1"}
                className="h-11 rounded-2xl border-stone-200"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-black text-stone-700 flex items-center gap-1.5">
                <Link2 size={13} /> {isRTL ? "رابط يوتيوب (غير مدرج) *" : "YouTube link (unlisted) *"}
              </Label>
              <Input
                value={form.youtube_url}
                onChange={e => upd("youtube_url", e.target.value)}
                dir="ltr"
                placeholder="https://youtu.be/XXXXXXXXXXX"
                className="h-11 rounded-2xl border-stone-200"
              />
              {form.youtube_url && !extractYouTubeId(form.youtube_url) && (
                <p className="text-[11px] font-bold text-rose-600">
                  {isRTL ? "الرابط غير صالح — استخدم رابط فيديو يوتيوب" : "Invalid link — use a YouTube video URL"}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-black text-stone-700">
                {isRTL ? "الوصف" : "Description"}
              </Label>
              <Textarea
                value={form.description}
                onChange={e => upd("description", e.target.value)}
                rows={3}
                placeholder={isRTL ? "ملخص محتوى الحصة..." : "Lesson summary..."}
                className="rounded-2xl border-stone-200 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-black text-stone-700">
                  {isRTL ? "المادة" : "Subject"}
                </Label>
                <Input
                  value={form.subject}
                  onChange={e => upd("subject", e.target.value)}
                  placeholder={isRTL ? "مثال: رياضيات" : "e.g. Mathematics"}
                  className="h-11 rounded-2xl border-stone-200"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-black text-stone-700">
                  {isRTL ? "الصف" : "Grade"}
                </Label>
                <Input
                  value={form.grade}
                  onChange={e => upd("grade", e.target.value)}
                  placeholder={isRTL ? "مثال: 3" : "e.g. 3"}
                  className="h-11 rounded-2xl border-stone-200"
                />
              </div>
            </div>

            {/* Targeting */}
            <div className="space-y-2 rounded-2xl border border-stone-200 bg-stone-50/70 p-4">
              <Label className="text-xs font-black text-stone-700 flex items-center gap-1.5">
                <Users size={13} />
                {isRTL ? "من يحق له المشاهدة؟" : "Who can watch?"}
              </Label>

              <Select value={form.target_type} onValueChange={v => upd("target_type", v)}>
                <SelectTrigger className="h-11 rounded-2xl bg-white border-stone-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TARGET_ALL}>
                    {isRTL ? "كل الطلاب" : "All students"}
                  </SelectItem>
                  <SelectItem value={TARGET_CLASSES}>
                    {isRTL ? "فصول محددة" : "Specific classes"}
                  </SelectItem>
                  <SelectItem value={TARGET_STUDENT}>
                    {isRTL ? "طالب محدد" : "A specific student"}
                  </SelectItem>
                </SelectContent>
              </Select>

              {form.target_type === TARGET_CLASSES && (
                <div className="space-y-2 pt-1">
                  {classOptions.length === 0 ? (
                    <p className="text-[11px] font-bold text-stone-500">
                      {isRTL ? "لا توجد فصول مسجلة لك بعد." : "No classes registered for you yet."}
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {classOptions.map(opt => {
                        const checked = form.target_classes.includes(opt.key);
                        return (
                          <label
                            key={opt.key}
                            className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-bold text-stone-700 cursor-pointer hover:border-stone-300"
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={checked => {
                                setForm(f => ({
                                  ...f,
                                  target_classes: checked
                                    ? [...f.target_classes, opt.key]
                                    : f.target_classes.filter(k => k !== opt.key),
                                }));
                              }}
                            />
                            <GraduationCap size={13} className="text-stone-400 shrink-0" />
                            {opt.label}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {form.target_type === TARGET_STUDENT && (
                <div className="space-y-1.5 pt-1">
                  <Select
                    value={form.target_student_id}
                    onValueChange={value => {
                      const chosen = studentOptions.find(s => s.id === value);
                      setForm(f => ({
                        ...f,
                        target_student_id: value,
                        target_student_name: chosen ? (chosen.full_name || chosen.student_id || "") : "",
                        grade: f.grade || (chosen?.grade ? String(chosen.grade) : ""),
                      }));
                    }}
                  >
                    <SelectTrigger className="h-11 rounded-2xl bg-white border-stone-200">
                      <SelectValue placeholder={isRTL ? "اختر الطالب" : "Select a student"} />
                    </SelectTrigger>
                    <SelectContent>
                      {studentOptions.map(s => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.full_name || s.student_id || s.user_email || s.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {studentOptions.length === 0 && (
                    <p className="text-[11px] font-bold text-stone-500">
                      {isRTL ? "لا يوجد طلاب في هذا الصف." : "No students in this grade."}
                    </p>
                  )}
                </div>
              )}
            </div>

            <label className="flex items-center gap-2.5 rounded-2xl border border-stone-200 bg-white px-4 py-3 cursor-pointer">
              <Checkbox
                checked={form.is_hidden}
                onCheckedChange={v => upd("is_hidden", v === true)}
              />
              <span className="text-xs font-bold text-stone-700">
                {isRTL ? "إخفاء عن الطلاب مؤقتاً (لمشاهدة المراجعة فقط)" : "Hide from students (preview only)"}
              </span>
            </label>
          </div>

          <DialogFooter className="px-6 py-5 border-t border-stone-100 gap-2">
            <button
              onClick={() => { setDialogOpen(false); setEditing(null); }}
              className="h-11 px-5 rounded-2xl border-2 border-stone-300 bg-white text-stone-800 text-sm font-semibold hover:bg-stone-50 cursor-pointer"
            >
              {isRTL ? "إلغاء" : "Cancel"}
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="h-11 px-6 rounded-2xl bg-stone-900 text-white text-sm font-bold hover:bg-black transition-all shadow-lg shadow-stone-200 cursor-pointer disabled:opacity-60 inline-flex items-center gap-2"
            >
              {saving && <Loader2 size={15} className="animate-spin" />}
              {editing ? (isRTL ? "حفظ التعديلات" : "Save changes") : (isRTL ? "إضافة الفيديو" : "Add video")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!pendingDelete} onOpenChange={open => !open && setPendingDelete(null)}>
        <DialogContent className="max-w-md w-[92vw] rounded-3xl bg-white p-0" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="text-lg font-black text-stone-900">
              {isRTL ? "حذف الفيديو؟" : "Delete video?"}
            </DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-2">
            <p className="text-sm text-stone-600 leading-relaxed">
              {isRTL
                ? `سيتم حذف "${pendingDelete?.title || ""}" نهائياً ولن يتمكن الطلاب من مشاهدته.`
                : `"${pendingDelete?.title || ""}" will be permanently removed and students will no longer be able to watch it.`}
            </p>
          </div>
          <DialogFooter className="px-6 py-5 border-t border-stone-100 gap-2">
            <button
              onClick={() => setPendingDelete(null)}
              className="h-11 px-5 rounded-2xl border-2 border-stone-300 bg-white text-stone-800 text-sm font-semibold hover:bg-stone-50 cursor-pointer"
            >
              {isRTL ? "إلغاء" : "Cancel"}
            </button>
            <button
              onClick={confirmDelete}
              disabled={deleting}
              className="h-11 px-6 rounded-2xl bg-rose-600 text-white text-sm font-bold hover:bg-rose-700 cursor-pointer disabled:opacity-60 inline-flex items-center gap-2"
            >
              {deleting && <Loader2 size={15} className="animate-spin" />}
              {isRTL ? "حذف" : "Delete"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Player */}
      <YouTubePlayerModal
        video={playing}
        isOpen={!!playing}
        onClose={() => setPlaying(null)}
        isRTL={isRTL}
        canManage
      />
    </div>
  );
}

function safeParse(json) {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
