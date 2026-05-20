import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/lib/LanguageContext";

const grades = ["1","2","3","4","5","6","7","8","9","10","11","12"];

export default function LibraryBookFormDialog({ open, onClose, book }) {
  const isEdit = !!book;
  const qc = useQueryClient();
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(book || {
    title: "", subject_name: "General", subject_code: "", grade: "1",
    description: "", file_url: "", uploaded_by: ""
  });

  useEffect(() => {
    setForm(book || {
      title: "", subject_name: "General", subject_code: "", grade: "1",
      description: "", file_url: "", uploaded_by: ""
    });
  }, [book]);

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!form.title || !form.subject_name || !form.grade || !form.file_url) return;
    setSaving(true);
    try {
      if (isEdit) {
        await base44.entities.LibraryBook.update(book.id, form);
      } else {
        await base44.entities.LibraryBook.create(form);
      }
      qc.invalidateQueries({ queryKey: ["library-books"] });
      onClose();
    } catch (err) {
      console.error("Failed to save book:", err);
    }
    setSaving(false);
  };

  const categories = [
    { value: "Science", label: isRTL ? "علوم" : "Science" },
    { value: "Math", label: isRTL ? "رياضيات" : "Math" },
    { value: "Language", label: isRTL ? "اللغات" : "Language" },
    { value: "Literature", label: isRTL ? "الأدب" : "Literature" },
    { value: "History", label: isRTL ? "التاريخ" : "History" },
    { value: "General", label: isRTL ? "عام" : "General" },
    { value: "Technology", label: isRTL ? "التكنولوجيا" : "Technology" }
  ];

  const t = {
    titleAdd: isRTL ? "إضافة كتاب جديد" : "Add New Book",
    titleEdit: isRTL ? "تعديل بيانات الكتاب" : "Edit Book",
    bookTitle: isRTL ? "عنوان الكتاب *" : "Book Title *",
    subject: isRTL ? "المادة الدراسية *" : "Subject *",
    subjectCode: isRTL ? "رمز المادة" : "Subject Code",
    grade: isRTL ? "الصف *" : "Grade *",
    gradeItem: (g) => isRTL ? `الصف ${g}` : `Grade ${g}`,
    fileUrl: isRTL ? "رابط ملف الـ PDF *" : "PDF File URL *",
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
          <div>
            <Label className="text-stone-700 font-medium">{t.bookTitle}</Label>
            <Input 
              value={form.title} 
              onChange={e => update("title", e.target.value)} 
              placeholder={isRTL ? "مثال: مقدمة في الفيزياء" : "e.g. Introduction to Physics"} 
              className="mt-1 rounded-lg border-stone-200"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-stone-700 font-medium">{t.subject}</Label>
              <Select value={form.subject_name} onValueChange={v => update("subject_name", v)}>
                <SelectTrigger className="mt-1 rounded-lg border-stone-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-stone-700 font-medium">{t.subjectCode}</Label>
              <Input 
                value={form.subject_code} 
                onChange={e => update("subject_code", e.target.value)} 
                className="mt-1 rounded-lg border-stone-200 num-en"
                placeholder={isRTL ? "مثال: PHY-101" : "e.g. PHY-101"}
              />
            </div>
          </div>
          <div>
            <Label className="text-stone-700 font-medium">{t.grade}</Label>
            <Select value={form.grade} onValueChange={v => update("grade", v)}>
              <SelectTrigger className="mt-1 rounded-lg border-stone-200"><SelectValue /></SelectTrigger>
              <SelectContent>
                {grades.map(g => <SelectItem key={g} value={g}>{t.gradeItem(g)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-stone-700 font-medium">{t.fileUrl}</Label>
            <Input 
              value={form.file_url} 
              onChange={e => update("file_url", e.target.value)} 
              placeholder="https://..." 
              className="mt-1 rounded-lg border-stone-200 num-en"
            />
          </div>
          <div>
            <Label className="text-stone-700 font-medium">{t.description}</Label>
            <Textarea 
              value={form.description || ""} 
              onChange={e => update("description", e.target.value)} 
              rows={3} 
              className="mt-1 rounded-lg border-stone-200"
              placeholder={isRTL ? "أية تفاصيل حول محتويات الكتاب..." : "Any details about book contents..."}
            />
          </div>
          <div>
            <Label className="text-stone-700 font-medium">{t.uploadedBy}</Label>
            <Input 
              value={form.uploaded_by || ""} 
              onChange={e => update("uploaded_by", e.target.value)} 
              className="mt-1 rounded-lg border-stone-200"
              placeholder={isRTL ? "اسم أمين المكتبة" : "Librarian's name"}
            />
          </div>
          <button 
            onClick={handleSave} 
            disabled={saving || !form.title || !form.subject_name || !form.grade || !form.file_url} 
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed w-full h-11"
          >
            {saving ? t.saving : isEdit ? t.update : t.save}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
