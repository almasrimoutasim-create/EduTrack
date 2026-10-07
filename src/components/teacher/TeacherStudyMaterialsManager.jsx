import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/dbClient";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StudyMaterialFormDialog from "@/components/shared/StudyMaterialFormDialog";
import { toast } from "sonner";
import { BookOpen, Plus, Search, Loader2, FileText, Link2, StickyNote, PlayCircle, Pencil, Trash2 } from "lucide-react";

const TYPE_AR = { document: "مستند", video: "فيديو/ملف", link: "رابط", note: "ملاحظة" };

/**
 * Teacher portal (tab=materials): school library of digital materials
 * (study_materials, scoped by school_id) + upload own materials.
 * Student visibility is automatic via /student-portal?view=materials
 * filtered by subject_name/grade.
 */
export default function TeacherStudyMaterialsManager({ isRTL = true, teacherName = "" }) {
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data: materials = [], isLoading } = useQuery({
    queryKey: ["teacher-study-materials"],
    queryFn: () => entities.StudyMaterial.list("-created_date", 500),
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return materials;
    return materials.filter(m =>
      [m.title, m.subject_name, m.grade, m.teacher_name]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(q))
    );
  }, [materials, query]);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["teacher-study-materials"] });
    qc.invalidateQueries({ queryKey: ["materials"] });
    qc.invalidateQueries({ queryKey: ["admin-study-materials"] });
    qc.invalidateQueries({ queryKey: ["student-all-study-materials"] });
  };

  const handleDelete = async (m) => {
    if (!window.confirm(isRTL ? `حذف "${m.title}"؟` : `Delete "${m.title}"?`)) return;
    try {
      await entities.StudyMaterial.delete(m.id);
      toast.success(isRTL ? "تم الحذف" : "Deleted");
      refresh();
    } catch (err) {
      console.error("[teacher-study-materials] delete failed:", err);
      toast.error(isRTL ? "تعذر الحذف" : "Could not delete");
    }
  };

  return (
    <div className="space-y-5" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-stone-900 flex items-center gap-2">
            <BookOpen size={20} className="text-teal-600" />
            {isRTL ? "المواد الدراسية الرقمية" : "Digital study materials"}
          </h3>
          <p className="text-xs text-stone-500 font-semibold mt-1">
            {isRTL ? "مكتبة المدرسة + رفع موادك (PDF/مذكرات/روابط) — حدد المادة والصف لتظهر للطلاب." : "School library + your uploads — set subject and grade."}
          </p>
          {!isLoading && (
            <Badge className="bg-stone-100 text-stone-700 border-stone-200 text-[11px] font-bold px-2.5 py-1 mt-2">
              {isRTL ? `${materials.length} مادة` : `${materials.length} items`}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <div className="relative w-full md:w-64">
            <Search size={15} className="absolute top-1/2 -translate-y-1/2 text-stone-400 start-3" />
            <Input value={query} onChange={e => setQuery(e.target.value)} placeholder={isRTL ? "ابحث..." : "Search..."} className="h-10 ps-9 rounded-2xl bg-white border-stone-200 text-sm" />
          </div>
          <button
            onClick={() => { setEditing(teacherName ? { title: "", subject_name: "", grade: "", type: "document", content: "", file_url: "", external_url: "", teacher_name: teacherName, description: "", is_published: true } : null); setDialogOpen(true); }}
            className="h-10 px-4 rounded-2xl bg-stone-900 text-white text-xs font-black flex items-center gap-1.5 hover:bg-black cursor-pointer shrink-0"
          >
            <Plus size={15} /> {isRTL ? "رفع مادة" : "Upload"}
          </button>
        </div>
      </div>

      {isLoading ? (
        <Card className="p-12 text-center border-dashed border-2 border-stone-200 bg-white rounded-[32px]">
          <Loader2 size={30} className="animate-spin text-teal-600 mx-auto" />
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2 border-stone-200 bg-stone-50/50 rounded-[32px]">
          <BookOpen size={38} className="mx-auto text-stone-300 mb-2" />
          <p className="font-black text-stone-600">{isRTL ? "لا توجد مواد بعد — ارفع أول مادة" : "No materials yet"}</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(m => (
            <Card key={m.id} className="p-4 rounded-[24px] bg-white border border-stone-100 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="h-9 w-9 rounded-xl bg-stone-100 flex items-center justify-center text-stone-500 shrink-0">
                    {m.type === "link" ? <Link2 size={16} /> : m.type === "note" ? <StickyNote size={16} /> : m.type === "video" ? <PlayCircle size={16} /> : <FileText size={16} />}
                  </span>
                  <div className="min-w-0">
                    <p className="font-black text-sm text-stone-900 truncate">{m.title}</p>
                    <p className="text-[11px] font-bold text-stone-400">{m.subject_name || "—"} · {isRTL ? "الصف" : "G"} {m.grade || "—"} · {TYPE_AR[m.type] || m.type}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setEditing(m); setDialogOpen(true); }} className="flex-1 h-9 rounded-xl border-2 border-stone-200 text-xs font-black hover:bg-stone-50 flex items-center justify-center gap-1 cursor-pointer">
                  <Pencil size={13} /> {isRTL ? "تعديل" : "Edit"}
                </button>
                <button onClick={() => handleDelete(m)} className="h-9 w-9 rounded-xl border-2 border-rose-200 text-rose-500 flex items-center justify-center hover:bg-rose-50 cursor-pointer">
                  <Trash2 size={14} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <StudyMaterialFormDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditing(null); refresh(); }}
        material={editing}
      />
    </div>
  );
}
