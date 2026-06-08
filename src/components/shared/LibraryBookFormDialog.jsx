import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/lib/LanguageContext";
import { FileUp, Loader2, Book } from "lucide-react";

const grades = ["1","2","3","4","5","6","7","8","9","10","11","12"];
const stages = ["ابتدائي", "متوسط", "ثانوي"];

const generateCoverFromPDF = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target.result;
        // Import pdfjs dynamically
        const pdfjsLib = await import('pdfjs-dist');
        // Set worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '4.10.38'}/build/pdf.worker.min.mjs`;
        
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);
        
        const viewport = page.getViewport({ scale: 1.0 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        await page.render({ canvasContext: context, viewport }).promise;
        
        const base64Image = canvas.toDataURL('image/png');
        resolve(base64Image);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};

export default function LibraryBookFormDialog({ open, onClose, book }) {
  const isEdit = !!book;
  const qc = useQueryClient();
  const { language } = useLanguage();
  const isRTL = language === "ar";
  
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const [form, setForm] = useState(book || {
    title: "", subject_name: "General", subject_code: "", grade: "1", stage: "",
    description: "", file_url: "", uploaded_by: "", thumbnail_url: "", subject_id: ""
  });

  // Fetch subjects from the database to link to
  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => base44.entities.Subject.list()
  });

  useEffect(() => {
    setForm(book || {
      title: "", subject_name: "General", subject_code: "", grade: "1", stage: "",
      description: "", file_url: "", uploaded_by: "", thumbnail_url: "", subject_id: ""
    });
    setUploadError("");
  }, [book]);

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubjectChange = (subjectIdVal) => {
    const selectedSub = subjects.find(s => s.id === subjectIdVal);
    if (selectedSub) {
      setForm(f => ({
        ...f,
        subject_id: selectedSub.id,
        subject_name: selectedSub.name,
        subject_code: selectedSub.code || ""
      }));
    } else {
      setForm(f => ({
        ...f,
        subject_id: "",
        subject_name: "General",
        subject_code: ""
      }));
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setUploadError(isRTL ? "يرجى اختيار ملف PDF فقط" : "Please select a PDF file only");
      return;
    }

    setUploading(true);
    setUploadError("");

    try {
      // 1. Generate Cover Thumbnail from first page of PDF in browser
      let generatedThumbnailUrl = "";
      try {
        const coverBase64 = await generateCoverFromPDF(file);
        const cleanCoverBase64 = coverBase64.replace(/^data:image\/\w+;base64,/, "");
        
        const coverRes = await fetch("/neon-db/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: `${file.name.replace(/\.pdf$/i, "")}_cover.png`,
            fileData: cleanCoverBase64
          })
        });

        if (coverRes.ok) {
          const coverData = await coverRes.json();
          generatedThumbnailUrl = coverData.fileUrl;
        }
      } catch (coverErr) {
        console.warn("Cover generation failed, proceeding with PDF upload only:", coverErr);
      }

      // 2. Upload the PDF file
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const pdfBase64 = /** @type {string} */ (event.target.result).split(",")[1];
          const uploadRes = await fetch("/neon-db/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileName: file.name,
              fileData: pdfBase64
            })
          });

          if (!uploadRes.ok) throw new Error("Upload failed");
          const uploadData = await uploadRes.json();

          setForm(f => ({
            ...f,
            file_url: uploadData.fileUrl,
            thumbnail_url: generatedThumbnailUrl || f.thumbnail_url,
            title: f.title || file.name.replace(/\.pdf$/i, "")
          }));
        } catch (err) {
          setUploadError(isRTL ? "فشل رفع الملف" : "Failed to upload file");
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setUploadError(isRTL ? "حدث خطأ أثناء معالجة الملف" : "Error processing file");
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.title || !form.file_url) return;
    setSaving(true);
    try {
      if (isEdit) {
        await base44.entities.LibraryBook.update(book.id, form);
      } else {
        await base44.entities.LibraryBook.create({
          ...form,
          status: "available"
        });
      }
      qc.invalidateQueries({ queryKey: ["library-books"] });
      onClose();
    } catch (err) {
      console.error("Failed to save book:", err);
    }
    setSaving(false);
  };

  const t = {
    titleAdd: isRTL ? "إضافة كتاب جديد" : "Add New Book",
    titleEdit: isRTL ? "تعديل بيانات الكتاب" : "Edit Book",
    bookTitle: isRTL ? "عنوان الكتاب *" : "Book Title *",
    subject: isRTL ? "المادة الدراسية" : "Subject",
    subjectCode: isRTL ? "رمز المادة" : "Subject Code",
    grade: isRTL ? "الصف" : "Grade",
    gradeItem: (g) => isRTL ? `الصف ${g}` : `Grade ${g}`,
    stage: isRTL ? "المرحلة الدراسية" : "Academic Stage",
    stagePlaceholder: isRTL ? "اختر مرحلة..." : "Select stage...",
    fileUrl: isRTL ? "ملف الكتاب (PDF) *" : "Book File (PDF) *",
    description: isRTL ? "وصف الكتاب" : "Description",
    uploadedBy: isRTL ? "تم الرفع بواسطة" : "Uploaded By",
    saving: isRTL ? "جاري الحفظ..." : "Saving...",
    save: isRTL ? "إضافة كتاب" : "Add Book",
    update: isRTL ? "تحديث الكتاب" : "Update Book"
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir={isRTL ? "rtl" : "ltr"}>
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-stone-900 font-bold">
            {isEdit ? t.titleEdit : t.titleAdd}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          
          {/* File Upload Field with Cover Generation */}
          <div>
            <Label className="text-stone-700 font-semibold mb-1.5 block">{t.fileUrl}</Label>
            
            <div className="flex items-center gap-3">
              {form.thumbnail_url ? (
                <div className="w-14 h-20 bg-stone-100 rounded-lg overflow-hidden border border-stone-200 shadow-sm relative flex-shrink-0">
                  <img src={form.thumbnail_url} alt="Cover Preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-14 h-20 bg-stone-50 rounded-lg border border-dashed border-stone-200 flex items-center justify-center text-stone-300 flex-shrink-0">
                  <Book size={24} />
                </div>
              )}
              
              <div className="flex-1">
                <div className="relative border-2 border-dashed border-stone-200 hover:border-primary/50 transition-colors rounded-xl p-4 flex flex-col items-center justify-center bg-stone-50/50 cursor-pointer">
                  <input 
                    type="file" 
                    accept="application/pdf" 
                    onChange={handleFileUpload} 
                    disabled={uploading}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  {uploading ? (
                    <div className="flex flex-col items-center gap-1 text-xs text-stone-500 font-bold">
                      <Loader2 className="animate-spin text-primary" size={20} />
                      <span>{isRTL ? "جاري استخراج الغلاف والرفع..." : "Extracting cover and uploading..."}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-xs text-stone-500 font-bold">
                      <FileUp size={20} className="text-stone-400" />
                      <span>{isRTL ? "اختر أو اسحب ملف الـ PDF هنا" : "Choose or drag PDF file here"}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {form.file_url && (
              <p className="text-[11px] font-bold text-emerald-600 mt-1.5 flex items-center gap-1">
                ✓ {isRTL ? "تم رفع الملف بنجاح:" : "File uploaded successfully:"} <span className="underline truncate max-w-xs">{form.file_url}</span>
              </p>
            )}

            {uploadError && (
              <p className="text-[11px] font-bold text-red-500 mt-1.5">
                ⚠ {uploadError}
              </p>
            )}
          </div>

          <div>
            <Label className="text-stone-700 font-semibold">{t.bookTitle}</Label>
            <Input 
              value={form.title} 
              onChange={e => update("title", e.target.value)} 
              placeholder={isRTL ? "مثال: مقدمة في الفيزياء" : "e.g. Introduction to Physics"} 
              className="mt-1 rounded-lg border-stone-200"
            />
          </div>

          {/* Subject Dropdown & Code linking */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-stone-700 font-semibold">{t.subject}</Label>
              <select 
                value={form.subject_id || ""} 
                onChange={e => handleSubjectChange(e.target.value)}
                className="w-full mt-1 h-10 rounded-lg border border-stone-200 bg-white text-xs font-semibold px-3 text-stone-700 outline-none cursor-pointer"
              >
                <option value="">{isRTL ? "اختر مادة..." : "Select Subject..."}</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code || ""})</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-stone-700 font-semibold">{t.subjectCode}</Label>
              <Input 
                value={form.subject_code} 
                onChange={e => update("subject_code", e.target.value)} 
                className="mt-1 rounded-lg border-stone-200 num-en"
                placeholder={isRTL ? "مثال: PHY-101" : "e.g. PHY-101"}
                disabled
              />
            </div>
          </div>

          {/* المرحلة والصف */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-stone-700 font-semibold">{t.stage}</Label>
              <Select value={form.stage || ""} onValueChange={v => update("stage", v)}>
                <SelectTrigger className="mt-1 rounded-lg border-stone-200"><SelectValue placeholder={t.stagePlaceholder} /></SelectTrigger>
                <SelectContent>
                  {stages.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-stone-700 font-semibold">{t.grade}</Label>
              <Select value={form.grade || "1"} onValueChange={v => update("grade", v)}>
                <SelectTrigger className="mt-1 rounded-lg border-stone-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {grades.map(g => <SelectItem key={g} value={g}>{t.gradeItem(g)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-stone-700 font-semibold">{t.description}</Label>
            <Textarea 
              value={form.description || ""} 
              onChange={e => update("description", e.target.value)} 
              rows={3} 
              className="mt-1 rounded-lg border-stone-200"
              placeholder={isRTL ? "أية تفاصيل حول محتويات الكتاب..." : "Any details about book contents..."}
            />
          </div>

          <div>
            <Label className="text-stone-700 font-semibold">{t.uploadedBy}</Label>
            <Input 
              value={form.uploaded_by || ""} 
              onChange={e => update("uploaded_by", e.target.value)} 
              className="mt-1 rounded-lg border-stone-200"
              placeholder={isRTL ? "اسم أمين المكتبة" : "Librarian's name"}
            />
          </div>

          <button 
            onClick={handleSave} 
            disabled={saving || uploading || !form.title || !form.file_url} 
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed w-full h-11"
          >
            {saving ? t.saving : isEdit ? t.update : t.save}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
