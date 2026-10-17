import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/dbClient";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import StudyMaterialFormDialog from "@/components/shared/StudyMaterialFormDialog";
import { toast } from "sonner";
import {
  BookOpen, BookMarked, Plus, Search, Loader2, FileText, Link2,
  StickyNote, PlayCircle, Pencil, Trash2, Eye, EyeOff, ExternalLink,
  GraduationCap
} from "lucide-react";
import { formatDrivePreviewUrl } from "@/utils/driveUrlHelper";
import { resolveFileUrl } from "@/lib/materialFile";

function BookCoverImage({ coverUrl, title, subjectName, grade, isRTL }) {
  const [hasError, setHasError] = useState(false);
  const resolved = resolveFileUrl(coverUrl);

  if (resolved && !hasError) {
    return (
      <img
        src={resolved}
        alt={title}
        loading="lazy"
        onError={() => setHasError(true)}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
    );
  }

  return (
    <div className="w-full h-full bg-gradient-to-br from-teal-800 via-teal-900 to-stone-900 p-6 flex flex-col justify-between text-white relative select-none">
      <div className="absolute top-0 bottom-0 start-0 w-3 bg-white/10 border-e border-white/15" />
      <div className="ps-3 pt-2">
        <span className="text-[10px] uppercase font-black tracking-widest text-teal-300/90 block">
          {isRTL ? "كتاب مدرسي معتمد" : "Official Textbook"}
        </span>
        <p className="text-xs font-bold text-teal-100/90 mt-1 line-clamp-1">
          {subjectName || (isRTL ? "منهج دراسي" : "Curriculum")}
        </p>
      </div>

      <div className="ps-3 my-auto text-center py-4">
        <div className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mx-auto mb-3 border border-white/15 shadow-inner">
          <BookMarked size={28} className="text-teal-200" />
        </div>
        <h4 className="font-serif font-black text-sm text-white line-clamp-2 px-1 leading-snug">
          {title}
        </h4>
      </div>

      <div className="ps-3 flex items-center justify-between text-[11px] text-teal-200/80 border-t border-white/15 pt-2">
        <span>{isRTL ? "الصف" : "Grade"} {grade || "—"}</span>
        <span>{isRTL ? "وزارة التربية" : "Ministry of Edu"}</span>
      </div>
    </div>
  );
}

const TYPE_META = {
  document: { icon: FileText, labelAr: "مستند", labelEn: "Document", cls: "bg-rose-50 text-rose-700 border-rose-200" },
  textbook: { icon: BookMarked, labelAr: "كتاب منهج", labelEn: "Textbook", cls: "bg-teal-50 text-teal-700 border-teal-200" },
  video: { icon: PlayCircle, labelAr: "فيديو/ملف", labelEn: "Video", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  link: { icon: Link2, labelAr: "رابط", labelEn: "Link", cls: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  note: { icon: StickyNote, labelAr: "ملاحظة", labelEn: "Note", cls: "bg-amber-50 text-amber-700 border-amber-200" },
};

const GRADES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

export default function AdminStudyMaterialsManager({ isRTL = true, mode = "materials" }) {
  const qc = useQueryClient();
  const isTextbooks = mode === "textbooks";
  const [query, setQuery] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { data: rawMaterials = [], isLoading } = useQuery({
    queryKey: ["admin-study-materials", mode],
    queryFn: () => isTextbooks
      ? entities.StudyMaterial.list("-created_date", { type: "textbook" }, 500)
      : entities.StudyMaterial.list("-created_date", 500),
  });

  const materials = useMemo(() => {
    if (!Array.isArray(rawMaterials)) return [];
    if (isTextbooks) {
      return rawMaterials.filter(m => m.type === "textbook");
    }
    return rawMaterials.filter(m => m.type !== "textbook");
  }, [rawMaterials, isTextbooks]);

  const gradeCounts = useMemo(() => {
    const counts = {};
    for (const g of GRADES) {
      counts[g] = materials.filter(m => String(m.grade) === g).length;
    }
    return counts;
  }, [materials]);

  const filtered = useMemo(() => {
    let list = materials;
    if (selectedGrade !== "all") {
      list = list.filter(m => String(m.grade) === String(selectedGrade));
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(m =>
        [m.title, m.subject_name, m.grade, m.teacher_name, m.author, m.description]
          .filter(Boolean)
          .some(v => String(v).toLowerCase().includes(q))
      );
    }
    return list;
  }, [materials, query, selectedGrade]);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-study-materials"] });
    qc.invalidateQueries({ queryKey: ["materials"] });
    qc.invalidateQueries({ queryKey: ["student-all-study-materials"] });
    qc.invalidateQueries({ queryKey: ["student-materials"] });
    qc.invalidateQueries({ queryKey: ["teacher-study-materials"] });
  };

  const openCreate = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (m) => { setEditing(m); setDialogOpen(true); };

  const handleReadBook = (m) => {
    const rawUrl = m.file_url || m.external_url;
    if (!rawUrl) {
      toast.error(isRTL ? "لم يتم إرفاق رابط قراءة لهذا الكتاب بعد" : "No reading link attached to this book");
      return;
    }
    const previewUrl = formatDrivePreviewUrl(rawUrl);
    window.open(previewUrl, "_blank", "noopener,noreferrer");
  };

  const togglePublish = async (m) => {
    try {
      await entities.StudyMaterial.update(m.id, { is_published: !m.is_published });
      toast.success(isRTL ? (m.is_published ? "تم إلغاء النشر" : "تم النشر للطلاب") : "Updated");
      refresh();
    } catch (err) {
      console.error("[admin-study-materials] toggle failed:", err);
      toast.error(isRTL ? "تعذر تغيير حالة النشر" : "Could not update");
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await entities.StudyMaterial.delete(pendingDelete.id);
      toast.success(isRTL ? (isTextbooks ? "تم حذف كتاب المنهج" : "تم حذف المادة") : "Item deleted");
      setPendingDelete(null);
      refresh();
    } catch (err) {
      console.error("[admin-study-materials] delete failed:", err);
      toast.error(isRTL ? "تعذر حذف العنصر" : "Could not delete");
    } finally {
      setDeleting(false);
    }
  };

  const publishedCount = materials.filter(m => m.is_published !== false).length;
  const HeaderIcon = isTextbooks ? BookMarked : BookOpen;

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-stone-900 flex items-center gap-2">
            <HeaderIcon size={26} className="text-teal-600" />
            {isTextbooks
              ? (isRTL ? "كتب المنهج الدراسي" : "Curriculum Textbooks")
              : (isRTL ? "المواد الدراسية الرقمية" : "Digital Study Materials")}
          </h2>
          <p className="text-sm text-stone-500 font-semibold mt-1">
            {isTextbooks
              ? (isRTL
                ? "الكتب المدرسية المقررة والمناهج الدراسية الرسمية للطلاب — يتم ربطها بالصف والمادة للظهور في بوابة الطالب."
                : "Official prescribed textbooks and syllabus for students by grade and subject.")
              : (isRTL
                ? "ملفات PDF ومذكرات وروابط — حدد المادة والصف عند الرفع لتظهر للطلاب ضمن موادهم."
                : "PDFs, notes and links — set subject and grade so students see them.")}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <Badge className="bg-stone-100 text-stone-700 border-stone-200 text-[11px] font-bold px-2.5 py-1">
              {isTextbooks
                ? (isRTL ? `${materials.length} كتاب منهج · ${publishedCount} منشور` : `${materials.length} textbooks · ${publishedCount} published`)
                : (isRTL ? `${materials.length} مادة · ${publishedCount} منشورة` : `${materials.length} items · ${publishedCount} published`)}
            </Badge>
            {selectedGrade !== "all" && (
              <Badge className="bg-teal-50 text-teal-700 border-teal-200 text-[11px] font-bold px-2.5 py-1">
                {isRTL ? `الصف ${selectedGrade}: ${filtered.length} كتاب` : `Grade ${selectedGrade}: ${filtered.length} books`}
              </Badge>
            )}
          </div>
        </div>

        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 h-11 px-5 rounded-2xl bg-stone-900 text-white text-sm font-bold hover:bg-black transition-all shadow-lg shadow-stone-200 cursor-pointer shrink-0"
        >
          <Plus size={18} />
          {isTextbooks
            ? (selectedGrade !== "all"
              ? (isRTL ? `إضافة كتاب للصف ${selectedGrade}` : `Add Book (Grade ${selectedGrade})`)
              : (isRTL ? "إضافة كتاب منهج جديد" : "Add New Textbook"))
            : (isRTL ? "رفع مادة جديدة" : "Upload material")}
        </button>
      </div>

      {/* Search Input */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="relative max-w-md flex-1">
          <Search size={16} className="absolute top-1/2 -translate-y-1/2 text-stone-400 start-4" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={isTextbooks
              ? (isRTL ? "ابحث باسم الكتاب / المادة / الصف..." : "Search textbook / subject / grade...")
              : (isRTL ? "ابحث بالعنوان / المادة / الصف..." : "Search title / subject / grade...")}
            className="h-11 ps-11 rounded-2xl bg-white border-stone-200"
          />
        </div>
      </div>

      {/* Grades 1 to 12 filter bar */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-stone-600">
            {isRTL ? "فلترة حسب الصفوف الدراسية (Grades 1 - 12):" : "Filter by Grades (1 - 12):"}
          </p>
          {selectedGrade !== "all" && (
            <button
              onClick={() => setSelectedGrade("all")}
              className="text-xs text-teal-600 font-bold hover:underline cursor-pointer"
            >
              {isRTL ? "إعادة تعيين (عرض كل الصفوف)" : "Reset (Show all)"}
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
          <button
            onClick={() => setSelectedGrade("all")}
            className={`h-8 px-3.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
              selectedGrade === "all"
                ? "bg-stone-900 text-white shadow-sm"
                : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
            }`}
          >
            {isRTL ? "الكل" : "All"} ({materials.length})
          </button>
          {GRADES.map(g => {
            const count = gradeCounts[g] || 0;
            const isSelected = selectedGrade === g;
            return (
              <button
                key={g}
                onClick={() => setSelectedGrade(g)}
                className={`h-8 px-3 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-teal-600 text-white shadow-sm shadow-teal-600/20"
                    : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
                }`}
              >
                <span>{isRTL ? `الصف ${g}` : `G${g}`}</span>
                {count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    isSelected ? "bg-white/25 text-white" : "bg-teal-50 text-teal-700"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Section */}
      {isLoading ? (
        <Card className="p-16 text-center border-dashed border-2 border-stone-200 bg-white rounded-[32px]">
          <Loader2 size={36} className="animate-spin text-teal-600 mx-auto" />
          <p className="text-sm font-bold text-stone-500 mt-4">
            {isTextbooks
              ? (isRTL ? "جاري تحميل كتب المنهج..." : "Loading textbooks...")
              : (isRTL ? "جاري تحميل المواد..." : "Loading...")}
          </p>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="p-16 text-center border-dashed border-2 border-stone-200 bg-stone-50/50 rounded-[32px]">
          <HeaderIcon size={48} className="mx-auto text-stone-300 mb-3" />
          <p className="font-black text-lg text-stone-700">
            {query
              ? (isRTL ? "لا توجد نتائج مطابقة لبحثك" : "No matches found")
              : (selectedGrade !== "all"
                ? (isTextbooks
                  ? (isRTL ? `لا توجد كتب منهج للصف (${selectedGrade}) بعد` : `No textbooks for Grade ${selectedGrade} yet`)
                  : (isRTL ? `لا توجد مواد للصف (${selectedGrade}) بعد` : `No materials for Grade ${selectedGrade} yet`))
                : (isTextbooks
                  ? (isRTL ? "لا توجد كتب منهج دراسي بعد" : "No textbooks yet")
                  : (isRTL ? "لا توجد مواد رقمية بعد" : "No materials yet")))}
          </p>
          <button
            onClick={openCreate}
            className="mt-5 inline-flex items-center gap-2 h-10 px-5 rounded-2xl bg-teal-600 text-white text-sm font-bold hover:bg-teal-700 cursor-pointer"
          >
            <Plus size={16} />
            {isTextbooks
              ? (selectedGrade !== "all"
                ? (isRTL ? `إضافة كتاب لمنهج الصف ${selectedGrade}` : `Upload Textbook for Grade ${selectedGrade}`)
                : (isRTL ? "إضافة كتاب منهج جديد" : "Add New Textbook"))
              : (isRTL ? "رفع مادة" : "Upload")}
          </button>
        </Card>
      ) : isTextbooks ? (
        /* ================= TEXTBOOKS CARDS GRID UI ================= */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(m => {
            const coverUrl = m.cover_image_url || m.thumbnail_url;
            const hasDriveLink = Boolean(m.file_url || m.external_url);

            return (
              <div
                key={m.id}
                className="group bg-white rounded-[26px] border border-stone-200/90 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden"
              >
                {/* 1. Book Cover Image Container */}
                <div className="relative aspect-[3/4] w-full bg-stone-100 overflow-hidden border-b border-stone-100">
                  <BookCoverImage
                    coverUrl={m.cover_image_url || m.thumbnail_url}
                    title={m.title}
                    subjectName={m.subject_name}
                    grade={m.grade}
                    isRTL={isRTL}
                  />

                  {/* Floating Badges on top of cover */}
                  <div className="absolute top-3 start-3 z-10">
                    <Badge className="bg-stone-900/80 backdrop-blur-md text-white border-white/20 text-[10px] font-black px-2.5 py-1 rounded-xl shadow-xs">
                      {isRTL ? `الصف ${m.grade}` : `Grade ${m.grade}`}
                    </Badge>
                  </div>

                  <div className="absolute top-3 end-3 z-10">
                    <Badge
                      className={`${
                        m.is_published !== false
                          ? "bg-emerald-600/90 text-white border-emerald-400/30"
                          : "bg-amber-600/90 text-white border-amber-400/30"
                      } backdrop-blur-md text-[10px] font-black px-2.5 py-1 rounded-xl shadow-xs`}
                    >
                      {m.is_published !== false ? (isRTL ? "منشور" : "Published") : (isRTL ? "مسودة" : "Draft")}
                    </Badge>
                  </div>
                </div>

                {/* 2. Book Info & Negative Space */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    {/* Subject badge */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-teal-700 bg-teal-50 border border-teal-100 px-2.5 py-0.5 rounded-lg inline-block truncate">
                        {m.subject_name || (isRTL ? "عام / غير محدد" : "General")}
                      </span>
                      {(m.author || m.teacher_name) && (
                        <span className="text-[10px] font-semibold text-stone-400 truncate max-w-[120px]" title={m.author || m.teacher_name}>
                          {m.author || m.teacher_name}
                        </span>
                      )}
                    </div>

                    {/* Book Title */}
                    <h3
                      className="font-black text-stone-900 text-base leading-snug line-clamp-2 min-h-[2.5rem] group-hover:text-teal-700 transition-colors"
                      title={m.title}
                    >
                      {m.title}
                    </h3>

                    {/* Book Description / Notes */}
                    <p className="text-xs text-stone-500 leading-relaxed line-clamp-2 min-h-[2rem]">
                      {m.description || (isRTL ? "كتاب المنهج الدراسي المقرر والمطابق للخطة الدراسية المعتمدة." : "Official prescribed syllabus textbook.")}
                    </p>
                  </div>

                  {/* 3. Actions Area */}
                  <div className="space-y-2.5 pt-2 border-t border-stone-100">
                    {/* Prominent Action Button: Read Book */}
                    <button
                      onClick={() => handleReadBook(m)}
                      disabled={!hasDriveLink}
                      className={`w-full h-11 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                        hasDriveLink
                          ? "bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white shadow-teal-600/25"
                          : "bg-stone-200 text-stone-400 cursor-not-allowed shadow-none"
                      }`}
                    >
                      <BookOpen size={17} />
                      <span>{isRTL ? "قراءة الكتاب" : "Read Book"}</span>
                      <ExternalLink size={13} className="opacity-70" />
                    </button>

                    {/* Management Toolbar (Edit, Visibility, Delete) */}
                    <div className="flex items-center justify-between gap-1.5 pt-1">
                      <button
                        onClick={() => openEdit(m)}
                        className="flex-1 h-8 rounded-xl border border-stone-200 text-xs font-bold text-stone-700 hover:bg-stone-50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Pencil size={13} />
                        <span>{isRTL ? "تعديل" : "Edit"}</span>
                      </button>

                      <button
                        onClick={() => togglePublish(m)}
                        title={isRTL ? "نشر/إخفاء" : "Publish/hide"}
                        className="h-8 px-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        {m.is_published !== false ? <Eye size={14} className="text-emerald-600" /> : <EyeOff size={14} className="text-stone-400" />}
                      </button>

                      <button
                        onClick={() => setPendingDelete(m)}
                        title={isRTL ? "حذف" : "Delete"}
                        className="h-8 px-2.5 rounded-xl border border-rose-200 text-rose-500 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ================= GENERIC MATERIALS GRID UI ================= */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(m => {
            const meta = TYPE_META[m.type] || TYPE_META.document;
            const Icon = meta.icon;
            return (
              <Card key={m.id} className="p-5 rounded-[24px] bg-white border border-stone-100 shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="h-10 w-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-500 shrink-0">
                      <Icon size={18} />
                    </span>
                    <div className="min-w-0">
                      <p className="font-black text-sm text-stone-900 truncate">{m.title}</p>
                      <p className="text-[11px] font-bold text-stone-400 truncate">
                        {m.subject_name || "—"} · {isRTL ? "الصف" : "Grade"} {m.grade || "—"}
                      </p>
                    </div>
                  </div>
                  <Badge className={`${meta.cls} border text-[10px] font-bold px-2 py-0.5 shrink-0`}>
                    {isRTL ? meta.labelAr : meta.labelEn}
                  </Badge>
                </div>
                {m.description && <p className="text-xs text-stone-500 leading-relaxed line-clamp-2">{m.description}</p>}
                <div className="flex flex-wrap gap-1.5">
                  {(m.teacher_name || m.author) && (
                    <Badge className="bg-stone-50 text-stone-500 border-stone-200 text-[10px] font-bold">
                      {m.teacher_name || m.author}
                    </Badge>
                  )}
                  <Badge className={`${m.is_published !== false ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-stone-100 text-stone-500 border-stone-200"} border text-[10px] font-bold`}>
                    {m.is_published !== false ? (isRTL ? "منشورة" : "Published") : (isRTL ? "مسودة" : "Draft")}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button onClick={() => openEdit(m)} className="flex-1 h-9 rounded-xl border-2 border-stone-200 text-xs font-black text-stone-700 hover:bg-stone-50 flex items-center justify-center gap-1 cursor-pointer">
                    <Pencil size={13} /> {isRTL ? "تعديل" : "Edit"}
                  </button>
                  <button onClick={() => togglePublish(m)} title={isRTL ? "نشر/إخفاء" : "Publish/hide"} className="h-9 w-9 rounded-xl border-2 border-stone-200 flex items-center justify-center text-stone-500 hover:bg-stone-50 cursor-pointer">
                    {m.is_published !== false ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button onClick={() => setPendingDelete(m)} title={isRTL ? "حذف" : "Delete"} className="h-9 w-9 rounded-xl border-2 border-rose-200 text-rose-500 flex items-center justify-center hover:bg-rose-50 cursor-pointer">
                    <Trash2 size={14} />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit / Create Form Dialog */}
      <StudyMaterialFormDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditing(null); refresh(); }}
        material={editing}
        defaultType={isTextbooks ? "textbook" : "document"}
        defaultGrade={selectedGrade !== "all" ? selectedGrade : ""}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!pendingDelete} onOpenChange={open => !open && setPendingDelete(null)}>
        <DialogContent className="max-w-md w-[92vw] rounded-3xl bg-white p-0" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="text-lg font-black text-stone-900">
              {isTextbooks
                ? (isRTL ? "حذف كتاب المنهج؟" : "Delete textbook?")
                : (isRTL ? "حذف المادة؟" : "Delete material?")}
            </DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-2">
            <p className="text-sm text-stone-600">
              {isRTL
                ? `سيتم حذف "${pendingDelete?.title || ""}" نهائياً من المنهج الدراسي.`
                : "This will permanently delete the item."}
            </p>
          </div>
          <DialogFooter className="px-6 py-5 border-t border-stone-100 gap-2">
            <button onClick={() => setPendingDelete(null)} className="h-11 px-5 rounded-2xl border-2 border-stone-300 bg-white text-stone-800 text-sm font-semibold hover:bg-stone-50 cursor-pointer">
              {isRTL ? "إلغاء" : "Cancel"}
            </button>
            <button onClick={confirmDelete} disabled={deleting} className="h-11 px-6 rounded-2xl bg-rose-600 text-white text-sm font-bold hover:bg-rose-700 cursor-pointer disabled:opacity-60 inline-flex items-center gap-2">
              {deleting && <Loader2 size={15} className="animate-spin" />}
              {isRTL ? "حذف" : "Delete"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
