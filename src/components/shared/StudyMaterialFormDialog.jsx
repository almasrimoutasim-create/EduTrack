import { useEffect, useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { entities } from "@/api/dbClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, Loader2, CheckCircle2 } from "lucide-react";

const types = [
  { value: "document", label: "Document (مستند)" },
  { value: "textbook", label: "Textbook (كتاب منهج)" },
  { value: "video", label: "Video (فيديو)" },
  { value: "link", label: "Link (رابط)" },
  { value: "note", label: "Note (ملاحظة)" },
];

const grades = ["1","2","3","4","5","6","7","8","9","10","11","12"];

export default function StudyMaterialFormDialog({ open, onClose, material, defaultType = "document", defaultGrade = "" }) {
  const isEdit = !!material;
  const qc = useQueryClient();
  const fileInputRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState(material || {
    title: "", subject_name: "", grade: defaultGrade || "", type: defaultType || "document",
    content: "", file_url: "", external_url: "",
    teacher_name: "", description: "", is_published: true
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects-list"],
    queryFn: () => entities.Subject.list()
  });

  useEffect(() => {
    if (material) {
      setForm(material);
    } else {
      setForm({
        title: "", subject_name: "", grade: defaultGrade || "", type: defaultType || "document",
        content: "", file_url: "", external_url: "",
        teacher_name: "", description: "", is_published: true
      });
    }
  }, [material, defaultType, defaultGrade, open]);

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const isTextbook = form.type === "textbook";
  const isValid = Boolean(form.title && (isTextbook || form.subject_name) && form.grade);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const fileBase64 = event.target.result.split(",")[1];
        const apiBase = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || "";
        const uploadUrl = apiBase ? `${apiBase.replace(/\/$/, "")}/neon-db/upload` : "/neon-db/upload";

        const res = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            fileData: fileBase64,
          }),
        });

        if (!res.ok) {
          throw new Error("Failed to upload file");
        }

        const data = await res.json();
        const uploadedUrl = data.fileUrl || data.url;

        setForm(f => ({
          ...f,
          file_url: uploadedUrl,
          title: f.title ? f.title : file.name.replace(/\.[^/.]+$/, ""),
        }));
        toast.success("تم رفع الملف بنجاح / File uploaded successfully");
      } catch (err) {
        console.error("Upload error:", err);
        toast.error("فشل رفع الملف / Failed to upload file");
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.onerror = () => {
      setUploading(false);
      toast.error("فشل قراءة الملف / Failed to read file");
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!isValid || uploading) return;
    setSaving(true);
    try {
      if (isEdit) {
        await entities.StudyMaterial.update(material.id, form);
        toast.success(isTextbook ? "تم تحديث كتاب المنهج" : "Material updated");
      } else {
        await entities.StudyMaterial.create(form);
        toast.success(isTextbook ? "تمت إضافة كتاب المنهج بنجاح" : "Material uploaded");
      }
      qc.invalidateQueries({ queryKey: ["materials"] });
      qc.invalidateQueries({ queryKey: ["admin-study-materials"] });
      qc.invalidateQueries({ queryKey: ["teacher-study-materials"] });
      qc.invalidateQueries({ queryKey: ["student-all-study-materials"] });
      qc.invalidateQueries({ queryKey: ["student-materials"] });
      onClose();
    } catch (err) {
      console.error("Failed to save material:", err);
      toast.error(err?.message || "Failed to save material");
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? (isTextbook ? "تعديل كتاب المنهج" : "Edit Material")
              : (isTextbook ? "إضافة كتاب منهج دراسي جديد" : "Upload New Material")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label>{isTextbook ? "عنوان الكتاب *" : "Title *"}</Label>
            <Input
              value={form.title}
              onChange={e => update("title", e.target.value)}
              placeholder={isTextbook ? "مثال: كتاب الرياضيات - الفصل الأول" : "e.g. Chapter 5 Notes"}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>
                {isTextbook ? "المادة (اختياري)" : "Subject *"}
              </Label>
              {(() => {
                const filteredSubjects = form.grade 
                  ? subjects.filter(s => String(s.grade) === String(form.grade))
                  : subjects;
                const subjectsToDisplay = filteredSubjects.length > 0 ? filteredSubjects : subjects;
                const uniqueSubjectNames = [...new Set(subjectsToDisplay.map(s => s.name))];

                return (
                  <Select
                    value={form.subject_name || "none"}
                    onValueChange={v => {
                      if (v === "none") {
                        setForm(f => ({ ...f, subject_name: "", subject_id: "" }));
                        return;
                      }
                      const subObj = subjects.find(s => s.name === v);
                      setForm(f => ({
                        ...f,
                        subject_name: v,
                        subject_id: subObj?.id || f.subject_id
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={isTextbook ? "عام / اختياري" : "Subject"} />
                    </SelectTrigger>
                    <SelectContent>
                      {isTextbook && (
                        <SelectItem value="none">عام / غير محدد</SelectItem>
                      )}
                      {uniqueSubjectNames.map(name => (
                        <SelectItem key={name} value={name}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                );
              })()}
            </div>
            <div>
              <Label>Grade *</Label>
              <Select value={form.grade} onValueChange={v => update("grade", v)}>
                <SelectTrigger><SelectValue placeholder="Grade" /></SelectTrigger>
                <SelectContent>
                  {grades.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Type</Label>
              <Select value={form.type} onValueChange={v => update("type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {types.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>{isTextbook ? "المؤلف / المعلم المسؤول" : "Teacher Name"}</Label>
            <Input
              value={form.teacher_name}
              onChange={e => update("teacher_name", e.target.value)}
              placeholder={isTextbook ? "وزارة التربية والتعليم / اسم المؤلف" : "Teacher name"}
            />
          </div>

          {(form.type === "document" || form.type === "textbook" || form.type === "video") && (
            <div className="space-y-2 p-3.5 bg-stone-50 border border-stone-200 rounded-2xl">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-stone-700">
                  {isTextbook ? "ملف كتاب المنهج (PDF أو مستند)" : "ملف المادة"}
                </Label>
                {uploading && (
                  <span className="flex items-center gap-1.5 text-xs text-teal-600 font-bold">
                    <Loader2 size={13} className="animate-spin" />
                    جاري الرفع...
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  id="study-material-file-upload"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept={form.type === "video" ? "video/*" : ".pdf,.doc,.docx,.ppt,.pptx"}
                />
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="h-9 px-4 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  <span>{uploading ? "جاري الرفع..." : "اختر ملفاً لرفعه"}</span>
                </button>
                <div className="flex-1 min-w-0">
                  <Input
                    value={form.file_url}
                    onChange={e => update("file_url", e.target.value)}
                    placeholder="أو ضع رابط الملف المباشر هنا (https://...)"
                    className="h-9 text-xs bg-white"
                  />
                </div>
              </div>

              {form.file_url && (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold mt-1">
                  <CheckCircle2 size={13} />
                  <span className="truncate">الرابط جاهز: {form.file_url}</span>
                </div>
              )}
            </div>
          )}

          {form.type === "link" && (
            <div>
              <Label>External URL</Label>
              <Input value={form.external_url} onChange={e => update("external_url", e.target.value)} placeholder="https://..." />
            </div>
          )}
          {form.type === "note" && (
            <div>
              <Label>Content</Label>
              <Textarea value={form.content} onChange={e => update("content", e.target.value)} rows={4} />
            </div>
          )}
          <div>
            <Label>{isTextbook ? "نبذة عن الكتاب / الوصف" : "Description"}</Label>
            <Textarea value={form.description} onChange={e => update("description", e.target.value)} rows={2} />
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
            <Switch checked={form.is_published} onCheckedChange={v => update("is_published", v)} />
            <Label>{isTextbook ? "منشور للطلاب" : "Published"}</Label>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || uploading || !isValid}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed w-full h-11"
          >
            {saving ? "Saving..." : isEdit ? (isTextbook ? "حفظ التعديلات" : "Update Material") : (isTextbook ? "إضافة الكتاب" : "Upload Material")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
