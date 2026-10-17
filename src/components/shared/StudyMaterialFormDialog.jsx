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
import {
  Upload, Loader2, CheckCircle2, Image as ImageIcon,
  BookOpen, ExternalLink, X, BookMarked, Sparkles
} from "lucide-react";
import { formatDrivePreviewUrl, isGoogleDriveUrl } from "@/utils/driveUrlHelper";
import { optimizeImageToDataUrl } from "@/utils/imageOptimizer";

const types = [
  { value: "textbook", label: "Textbook (كتاب منهج)" },
  { value: "document", label: "Document (مستند)" },
  { value: "video", label: "Video (فيديو)" },
  { value: "link", label: "Link (رابط)" },
  { value: "note", label: "Note (ملاحظة)" },
];

const grades = ["1","2","3","4","5","6","7","8","9","10","11","12"];

export default function StudyMaterialFormDialog({
  open,
  onClose,
  material,
  defaultType = "document",
  defaultGrade = ""
}) {
  const isEdit = !!material;
  const qc = useQueryClient();
  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const [saving, setSaving] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const [form, setForm] = useState({
    title: "",
    subject_name: "",
    subject_id: "",
    grade: defaultGrade || "",
    type: defaultType || "document",
    content: "",
    file_url: "",
    external_url: "",
    cover_image_url: "",
    thumbnail_url: "",
    teacher_name: "",
    author: "",
    description: "",
    is_published: true
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects-list"],
    queryFn: () => entities.Subject.list()
  });

  useEffect(() => {
    if (material) {
      setForm({
        ...material,
        cover_image_url: material.cover_image_url || material.thumbnail_url || "",
        thumbnail_url: material.thumbnail_url || material.cover_image_url || "",
        author: material.author || material.teacher_name || "",
        teacher_name: material.teacher_name || material.author || "",
      });
    } else {
      setForm({
        title: "",
        subject_name: "",
        subject_id: "",
        grade: defaultGrade || "",
        type: defaultType || "document",
        content: "",
        file_url: "",
        external_url: "",
        cover_image_url: "",
        thumbnail_url: "",
        teacher_name: "",
        author: "",
        description: "",
        is_published: true
      });
    }
  }, [material, defaultType, defaultGrade, open]);

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const isTextbook = form.type === "textbook";
  const isValid = Boolean(form.title && (isTextbook || form.subject_name) && form.grade);

  // Upload book cover image (JPG, PNG, WEBP)
  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("يرجى اختيار ملف صورة صالح (JPG أو PNG)");
      return;
    }

    setUploadingCover(true);
    try {
      // 1. Optimize cover image to a crisp, compact Data URL (WebP/JPEG ~40KB)
      // This is 100% self-contained in PostgreSQL and never vanishes on server restart/logout!
      const optimizedDataUrl = await optimizeImageToDataUrl(file, 600, 800, 0.85);

      // 2. Also send to /neon-db/upload (backed by system_uploaded_files in Neon DB)
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const rawBase64 = (optimizedDataUrl || event.target.result).split(",")[1];
          const apiBase = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || "";
          const uploadUrl = apiBase ? `${apiBase.replace(/\/$/, "")}/neon-db/upload` : "/neon-db/upload";

          const res = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileName: `cover_${Date.now()}_${file.name.replace(/\.[^/.]+$/, "")}.webp`,
              fileData: rawBase64,
            }),
          });

          let finalUrl = optimizedDataUrl || event.target.result;
          if (res.ok) {
            const data = await res.json();
            // If the optimized data URL is compact (<= 120KB), prefer it directly for zero-latency instant loading;
            // otherwise use the server /uploads/ path.
            if (optimizedDataUrl && optimizedDataUrl.length < 150000) {
              finalUrl = optimizedDataUrl;
            } else if (data.fileUrl) {
              finalUrl = data.fileUrl;
            }
          }

          setForm(f => ({
            ...f,
            cover_image_url: finalUrl,
            thumbnail_url: finalUrl
          }));
          toast.success("تم رفع وحفظ صورة غلاف الكتاب بنجاح");
        } catch (err) {
          console.error("Cover upload API error:", err);
          // Still keep optimizedDataUrl so user doesn't lose their cover
          if (optimizedDataUrl) {
            setForm(f => ({
              ...f,
              cover_image_url: optimizedDataUrl,
              thumbnail_url: optimizedDataUrl
            }));
            toast.success("تم اعتماد صورة الغلاف بنجاح");
          }
        } finally {
          setUploadingCover(false);
          if (coverInputRef.current) coverInputRef.current.value = "";
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Cover processing error:", err);
      setUploadingCover(false);
      toast.error("فشل معالجة صورة الغلاف");
    }
  };

  // Upload main book PDF or file
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
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
        toast.success("تم رفع الملف بنجاح");
      } catch (err) {
        console.error("Upload error:", err);
        toast.error("فشل رفع ملف الكتاب");
      } finally {
        setUploadingFile(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.onerror = () => {
      setUploadingFile(false);
      toast.error("فشل قراءة الملف");
    };
    reader.readAsDataURL(file);
  };

  // Handle URL changes with automatic Google Drive /preview normalization
  const handleFileUrlChange = (val) => {
    update("file_url", val);
  };

  const handleNormalizePreviewUrl = () => {
    if (!form.file_url) return;
    const formatted = formatDrivePreviewUrl(form.file_url);
    if (formatted !== form.file_url) {
      update("file_url", formatted);
      toast.success("تم ضبط الرابط لينتهي بـ /preview لوضع المعاينة المباشرة");
    } else {
      toast.info("الرابط منسق مسبقاً");
    }
  };

  const handleSave = async () => {
    if (!isValid || saving || uploadingFile || uploadingCover) return;
    setSaving(true);
    try {
      const formattedFileUrl = formatDrivePreviewUrl(form.file_url);
      const coverUrl = form.cover_image_url || form.thumbnail_url || null;

      const payload = {
        ...form,
        file_url: formattedFileUrl || form.file_url,
        external_url: form.external_url || (form.type === "link" ? formattedFileUrl : null),
        cover_image_url: coverUrl,
        thumbnail_url: coverUrl,
        author: form.author || form.teacher_name || null,
        teacher_name: form.teacher_name || form.author || null,
      };

      if (isEdit) {
        await entities.StudyMaterial.update(material.id, payload);
        toast.success(isTextbook ? "تم تحديث بيانات كتاب المنهج" : "Material updated");
      } else {
        await entities.StudyMaterial.create(payload);
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
      toast.error(err?.message || "فشل حفظ الكتاب أو المادة");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl p-6 bg-white" dir="rtl">
        <DialogHeader className="text-right pb-3 border-b border-stone-100">
          <DialogTitle className="text-xl font-black text-stone-900 flex items-center gap-2">
            <BookMarked size={22} className="text-teal-600" />
            {isEdit
              ? (isTextbook ? "تعديل كتاب المنهج الدراسي" : "تعديل المادة التعليمية")
              : (isTextbook ? "إضافة كتاب منهج دراسي جديد" : "رفع مادة تعليمية جديدة")}
          </DialogTitle>
          <p className="text-xs text-stone-500 font-medium mt-1">
            {isTextbook
              ? "أدخل بيانات كتاب المنهج، غلاف الكتاب، ورابط المعاينة المباشر (/preview) لقراءة الكتاب في المتصفح."
              : "أدخل بيانات المادة التعليمية وملفاتها المرفقة."}
          </p>
        </DialogHeader>

        <div className="space-y-4 mt-3">
          {/* 1. Title */}
          <div>
            <Label className="text-xs font-bold text-stone-700 mb-1 block">
              {isTextbook ? "عنوان كتاب المنهج *" : "عنوان المادة *"}
            </Label>
            <Input
              value={form.title}
              onChange={e => update("title", e.target.value)}
              placeholder={isTextbook ? "مثال: الرياضيات — الصف العاشر (الجزء الأول)" : "مثال: مذكرة مراجعة ليلة الامتحان"}
              className="h-10 text-sm rounded-xl border-stone-200"
            />
          </div>

          {/* 2. Grid: Subject, Grade, Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs font-bold text-stone-700 mb-1 block">
                {isTextbook ? "المادة الدراسية" : "المادة *"}
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
                    <SelectTrigger className="h-10 text-xs rounded-xl border-stone-200">
                      <SelectValue placeholder="اختر المادة" />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      <SelectItem value="none">عام / غير محدد</SelectItem>
                      {uniqueSubjectNames.map(name => (
                        <SelectItem key={name} value={name}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                );
              })()}
            </div>

            <div>
              <Label className="text-xs font-bold text-stone-700 mb-1 block">الصف الدراسي (Grade) *</Label>
              <Select value={form.grade} onValueChange={v => update("grade", v)}>
                <SelectTrigger className="h-10 text-xs rounded-xl border-stone-200">
                  <SelectValue placeholder="اختر الصف" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  {grades.map(g => (
                    <SelectItem key={g} value={g}>الصف {g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-bold text-stone-700 mb-1 block">النوع (Type)</Label>
              <Select value={form.type} onValueChange={v => update("type", v)}>
                <SelectTrigger className="h-10 text-xs rounded-xl border-stone-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  {types.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 3. Cover Image Upload (صورة غلاف الكتاب) */}
          <div className="p-4 bg-stone-50/80 border border-stone-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-black text-stone-800 flex items-center gap-1.5">
                <ImageIcon size={15} className="text-teal-600" />
                <span>صورة غلاف الكتاب (Cover Image - JPG أو PNG)</span>
              </Label>
              {uploadingCover && (
                <span className="flex items-center gap-1 text-xs text-teal-600 font-bold">
                  <Loader2 size={13} className="animate-spin" />
                  جاري رفع الغلاف...
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {/* Preview Thumbnail if available */}
              <div className="w-20 h-24 rounded-xl bg-white border border-stone-200 shadow-xs overflow-hidden shrink-0 flex items-center justify-center relative group">
                {form.cover_image_url || form.thumbnail_url ? (
                  <>
                    <img
                      src={form.cover_image_url || form.thumbnail_url}
                      alt="Cover Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        update("cover_image_url", "");
                        update("thumbnail_url", "");
                      }}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
                      title="إزالة الغلاف"
                    >
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <div className="text-center p-2 text-stone-400">
                    <BookMarked size={22} className="mx-auto mb-1 text-stone-300" />
                    <span className="text-[10px] block leading-tight font-semibold">بدون غلاف</span>
                  </div>
                )}
              </div>

              {/* Upload button & Direct URL */}
              <div className="flex-1 w-full space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    ref={coverInputRef}
                    type="file"
                    id="book-cover-image-upload"
                    className="hidden"
                    onChange={handleCoverUpload}
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                  />
                  <button
                    type="button"
                    disabled={uploadingCover}
                    onClick={() => coverInputRef.current?.click()}
                    className="h-9 px-4 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50 shadow-sm"
                  >
                    {uploadingCover ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    <span>{uploadingCover ? "جاري الرفع..." : "اختر صورة غلاف"}</span>
                  </button>

                  <div className="flex-1 min-w-0">
                    <Input
                      value={form.cover_image_url || ""}
                      onChange={e => {
                        const val = e.target.value;
                        update("cover_image_url", val);
                        update("thumbnail_url", val);
                      }}
                      placeholder="أو ضع رابط صورة الغلاف مباشرة (https://...)"
                      className="h-9 text-xs bg-white rounded-xl"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-stone-500 font-medium">
                  الصيغ المدعومة: PNG أو JPG. يُفضل استخدام صورة رأسية بنسبة 3:4 أو 4:5 لظهور الغلاف بشكل مثالي.
                </p>
              </div>
            </div>
          </div>

          {/* 4. Book Direct Link / Google Drive Preview Link */}
          {(form.type === "document" || form.type === "textbook" || form.type === "video") && (
            <div className="p-4 bg-teal-50/50 border border-teal-100 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-black text-teal-900 flex items-center gap-1.5">
                  <BookOpen size={15} className="text-teal-700" />
                  <span>رابط ملف الكتاب المباشر (وضع المعاينة /preview)</span>
                </Label>
                {uploadingFile && (
                  <span className="flex items-center gap-1 text-xs text-teal-700 font-bold">
                    <Loader2 size={13} className="animate-spin" />
                    جاري رفع الملف...
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      value={form.file_url}
                      onChange={e => handleFileUrlChange(e.target.value)}
                      placeholder="https://drive.google.com/file/d/.../preview"
                      className="h-10 text-xs bg-white rounded-xl font-mono ps-3 pe-8"
                      dir="ltr"
                    />
                    {isGoogleDriveUrl(form.file_url) && !form.file_url.includes("/preview") && (
                      <button
                        type="button"
                        onClick={handleNormalizePreviewUrl}
                        title="تحويل تلقائي إلى /preview"
                        className="absolute end-2 top-1/2 -translate-y-1/2 p-1 text-teal-600 hover:text-teal-800 cursor-pointer"
                      >
                        <Sparkles size={14} />
                      </button>
                    )}
                  </div>

                  {form.file_url && (
                    <a
                      href={formatDrivePreviewUrl(form.file_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-10 px-3 rounded-xl bg-white border border-teal-200 text-teal-700 hover:bg-teal-50 text-xs font-bold flex items-center gap-1 shrink-0"
                      title="تجربة فتح الرابط"
                    >
                      <ExternalLink size={13} />
                      <span>تجربة</span>
                    </a>
                  )}
                </div>

                {/* Helper notice about /preview */}
                <div className="flex items-start gap-2 bg-white/70 p-2.5 rounded-xl border border-teal-100 text-[11px] text-teal-800">
                  <Sparkles size={14} className="text-teal-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>ملاحظة هامة:</strong> روابط Google Drive التي تنتهي بـ <code className="bg-teal-100/70 px-1 py-0.5 rounded text-teal-900 font-bold font-mono">/preview</code> تسمح بفتح الكتاب وقراءته مباشرة داخل المتصفح بدون إجبار الطالب على تحميل الملف. سيتم تنسيق الرابط تلقائياً عند الحفظ.
                  </p>
                </div>

                {/* Local PDF upload option */}
                <div className="flex items-center gap-2 pt-1 border-t border-teal-100/70">
                  <span className="text-[11px] font-bold text-stone-500">أو يمكنك رفع ملف محلي (PDF):</span>
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
                    disabled={uploadingFile}
                    onClick={() => fileInputRef.current?.click()}
                    className="h-8 px-3 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {uploadingFile ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                    <span>{uploadingFile ? "جاري الرفع..." : "رفع PDF من الجهاز"}</span>
                  </button>
                </div>
              </div>

              {form.file_url && (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold mt-1">
                  <CheckCircle2 size={13} />
                  <span className="truncate">الرابط المعتمد: {form.file_url}</span>
                </div>
              )}
            </div>
          )}

          {/* 5. Author / Teacher */}
          <div>
            <Label className="text-xs font-bold text-stone-700 mb-1 block">
              {isTextbook ? "المؤلف / الجهة المسؤولة (وزارة التربية أو دار النشر)" : "المعلم المسؤول"}
            </Label>
            <Input
              value={form.teacher_name || form.author}
              onChange={e => {
                update("teacher_name", e.target.value);
                update("author", e.target.value);
              }}
              placeholder={isTextbook ? "وزارة التربية والتعليم / تأليف نخبة من المختصين" : "اسم المعلم"}
              className="h-10 text-sm rounded-xl border-stone-200"
            />
          </div>

          {/* 6. Description */}
          <div>
            <Label className="text-xs font-bold text-stone-700 mb-1 block">
              {isTextbook ? "نبذة عن الكتاب / الوصف" : "الوصف"}
            </Label>
            <Textarea
              value={form.description}
              onChange={e => update("description", e.target.value)}
              rows={2}
              placeholder={isTextbook ? "أدخل نبذة مختصرة عن محتوى الكتاب الدراسي والوحدات المقررة..." : "وصف المادة..."}
              className="text-sm rounded-xl border-stone-200"
            />
          </div>

          {/* 7. Published Switch */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-stone-50 border border-stone-200">
            <div>
              <p className="text-xs font-bold text-stone-800">
                {isTextbook ? "نشر الكتاب للطلاب" : "نشر المادة"}
              </p>
              <p className="text-[11px] text-stone-500">
                عند التفعيل، سيظهر الكتاب في بوابات الطلاب والمعلمين ومكتبة المنهج.
              </p>
            </div>
            <Switch checked={form.is_published} onCheckedChange={v => update("is_published", v)} />
          </div>

          {/* 8. Save Button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || uploadingFile || uploadingCover || !isValid}
            className="w-full h-12 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-teal-600/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>جاري الحفظ...</span>
              </>
            ) : isEdit ? (
              <span>حفظ التعديلات</span>
            ) : (
              <span>إضافة الكتاب إلى المنهج الدراسي</span>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
