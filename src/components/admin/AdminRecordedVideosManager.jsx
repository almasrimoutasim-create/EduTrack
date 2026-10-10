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
  Loader2, ShieldCheck, Clapperboard, Building2
} from "lucide-react";

const TARGET_ALL = "all";
const TARGET_CLASSES = "classes";
const TARGET_STUDENT = "student";
const OWNER_SCHOOL = "__school__";

const emptyForm = {
  title: "",
  description: "",
  youtube_url: "",
  subject: "",
  grade: "",
  owner: OWNER_SCHOOL,
  target_type: TARGET_ALL,
  target_classes: [],
  target_student_id: "",
  target_student_name: "",
  is_hidden: false,
};

/**
 * Admin school library of recorded (unlisted) YouTube videos.
 * Rows are stored in the SAME `teacher_youtube_videos` table used by teachers:
 * - owner = school (teacher_id NULL) → visible to every teacher of the school
 *   (read-only library) and to every student of the school (via school_id scope).
 * - owner = specific teacher → appears in that teacher's own manager as well.
 */
export default function AdminRecordedVideosManager({ isRTL = true }) {
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [playing, setPlaying] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Admin/school_admin list is automatically scoped to their school by the backend.
  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["admin-recorded-videos"],
    queryFn: () => entities.TeacherYoutubeVideo.list("-created_at", 500),
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ["admin-video-teachers"],
    queryFn: () => entities.Teacher.list("-created_at", 500),
  });

  const { data: students = [] } = useQuery({
    queryKey: ["admin-video-students"],
    queryFn: () => entities.Student.list("-created_at", 500),
  });

  const classOptions = useMemo(() => {
    const seen = new Map();
    (students || []).forEach(s => {
      const grade = String(s.grade ?? s.grade_level ?? "").trim();
      const section = String(s.section ?? "").trim();
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
  }, [students, isRTL]);

  const studentOptions = useMemo(() => {
    const list = (students || []).filter(s => s && s.id);
    if (!form.grade) return list.slice(0, 200);
    return list.filter(s => String(s.grade ?? s.grade_level ?? "") === String(form.grade)).slice(0, 200);
  }, [students, form.grade]);

  const teacherNameOf = (video) => {
    if (!video?.teacher_id) return isRTL ? "إدارة المدرسة (عام)" : "School administration";
    const t = teachers.find(x => String(x.id) === String(video.teacher_id));
    return t?.full_name || video.teacher_name || video.owner_name || (isRTL ? "معلم" : "Teacher");
  };

  const filteredVideos = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return videos;
    return videos.filter(v =>
      [v.title, v.description, v.subject, v.grade, teacherNameOf(v)]
        .filter(Boolean)
        .some(val => String(val).toLowerCase().includes(q))
    );
  }, [videos, query, teachers]);

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
      owner: video.teacher_id || OWNER_SCHOOL,
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
      teacher_id: form.owner === OWNER_SCHOOL ? null : form.owner,
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
        await entities.TeacherYoutubeVideo.create(payload);
        toast.success(isRTL ? "تمت إضافة الفيديو وظهر للمعلمين والطلاب" : "Video added and visible to teachers and students");
      }
      await qc.invalidateQueries({ queryKey: ["admin-recorded-videos"] });
      setDialogOpen(false);
      setEditing(null);
      setForm(emptyForm);
    } catch (err) {
      console.error("[admin-recorded-videos] save failed:", err);
      toast.error(isRTL ? "تعذر حفظ الفيديو. حاول مرة أخرى" : "Could not save the video. Please try again");
    } finally {
      setSaving(false);
    }
  };

  const toggleHidden = async (id, currentlyHidden) => {
    try {
      await entities.TeacherYoutubeVideo.update(id, { is_hidden: !currentlyHidden });
      await qc.invalidateQueries({ queryKey: ["admin-recorded-videos"] });
      toast.success(
        currentlyHidden
          ? (isRTL ? "أصبح الفيديو مرئياً" : "Video is now visible")
          : (isRTL ? "تم إخفاء الفيديو" : "Video hidden")
      );
    } catch (err) {
      console.error("[admin-recorded-videos] toggle failed:", err);
      toast.error(isRTL ? "تعذر تغيير حالة الإخفاء" : "Could not change visibility");
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await entities.TeacherYoutubeVideo.delete(pendingDelete.id);
      await qc.invalidateQueries({ queryKey: ["admin-recorded-videos"] });
      toast.success(isRTL ? "تم حذف الفيديو" : "Video deleted");
      setPendingDelete(null);
    } catch (err) {
      console.error("[admin-recorded-videos] delete failed:", err);
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-stone-900 flex items-center gap-2">
            <Clapperboard size={24} className="text-emerald-600" />
            {isRTL ? "المكتبة الرقمية" : "Digital Library"}
          </h2>
          <p className="text-sm text-stone-500 font-semibold mt-1">
            {isRTL
              ? "مكتبة المدرسة من روابط يوتيوب غير المدرجة — تظهر تلقائياً للمعلمين (للتحضير والنشر) وللطلاب (ضمن موادهم)."
              : "School library of unlisted YouTube links — automatically visible to teachers and students."}
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

      <div className="relative max-w-md">
        <Search size={16} className="absolute top-1/2 -translate-y-1/2 text-stone-400 start-4" />
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={isRTL ? "ابحث في الفيديوهات..." : "Search videos..."}
          className="h-11 ps-11 rounded-2xl bg-white border-stone-200"
        />
      </div>

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
              : (isRTL ? "أضف أول رابط فيديو غير مدرج ليظهر للمعلمين والطلاب" : "Add the first unlisted video link")}
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
            <div key={video.id} className="relative">
              <YouTubeVideoCard
                video={{ ...video, teacher_name: teacherNameOf(video) }}
                isRTL={isRTL}
                isTeacher
                onPlay={setPlaying}
                onEdit={openEdit}
                onToggleHidden={toggleHidden}
                onDelete={() => setPendingDelete(video)}
                onCopyLink={copyLink}
                copiedId={copiedId}
              />
              {!video.teacher_id && (
                <span className="absolute top-2 start-2 mt-10 ms-2 bg-stone-900/85 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 pointer-events-none">
                  <Building2 size={11} /> {isRTL ? "عام للمدرسة" : "School-wide"}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

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

            <div className="space-y-1.5">
              <Label className="text-xs font-black text-stone-700 flex items-center gap-1.5">
                <Users size={13} />
                {isRTL ? "الناشر / المالك" : "Owner"}
              </Label>
              <Select value={String(form.owner)} onValueChange={v => upd("owner", v)}>
                <SelectTrigger className="h-11 rounded-2xl bg-white border-stone-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={OWNER_SCHOOL}>
                    {isRTL ? "عام — كل معلمي وطلاب المدرسة" : "School-wide — all teachers and students"}
                  </SelectItem>
                  {teachers.map(t => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.full_name || t.email || t.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-stone-500 font-semibold">
                {isRTL
                  ? "الفيديو العام يظهر في مكتبة كل معلم (للتحضير والنسخ) وفي صفحة فيديوهات كل طالب حسب الصف."
                  : "A school-wide video appears in every teacher library and in matching students videos page."}
              </p>
            </div>

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
                      {isRTL ? "لا توجد فصول مستنتجة من بيانات الطلاب بعد." : "No classes inferred from student data yet."}
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
                      const chosen = studentOptions.find(s => String(s.id) === String(value));
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
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.full_name || s.student_id || s.user_email || s.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <label className="flex items-center gap-2.5 rounded-2xl border border-stone-200 bg-white px-4 py-3 cursor-pointer">
              <Checkbox
                checked={form.is_hidden}
                onCheckedChange={v => upd("is_hidden", v === true)}
              />
              <span className="text-xs font-bold text-stone-700">
                {isRTL ? "إخفاء مؤقتاً عن المعلمين والطلاب" : "Hide temporarily"}
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
                ? `سيتم حذف "${pendingDelete?.title || ""}" نهائياً من مكتبة المعلمين والطلاب.`
                : `"${pendingDelete?.title || ""}" will be permanently removed.`}
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
