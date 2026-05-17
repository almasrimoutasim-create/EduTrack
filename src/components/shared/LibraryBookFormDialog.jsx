import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";

const categories = ["Science", "Math", "Language", "Literature", "History", "General", "Technology"];
const grades = ["1","2","3","4","5","6","7","8","9","10","11","12"];

export default function LibraryBookFormDialog({ open, onClose, book }) {
  const isEdit = !!book;
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(book || {
    title: "", subject_name: "", subject_code: "", grade: "1",
    description: "", file_url: "", uploaded_by: ""
  });

  useEffect(() => {
    setForm(book || {
      title: "", subject_name: "", subject_code: "", grade: "1",
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Book" : "Add New Book"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label>Book Title *</Label>
            <Input value={form.title} onChange={e => update("title", e.target.value)} placeholder="e.g. Introduction to Physics" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Subject *</Label>
              <Select value={form.subject_name} onValueChange={v => update("subject_name", v)}>
                <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Subject Code</Label>
              <Input value={form.subject_code} onChange={e => update("subject_code", e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Grade *</Label>
            <Select value={form.grade} onValueChange={v => update("grade", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {grades.map(g => <SelectItem key={g} value={g}>Grade {g}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>PDF File URL *</Label>
            <Input value={form.file_url} onChange={e => update("file_url", e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={e => update("description", e.target.value)} rows={3} />
          </div>
          <div>
            <Label>Uploaded By</Label>
            <Input value={form.uploaded_by} onChange={e => update("uploaded_by", e.target.value)} />
          </div>
          <Button onClick={handleSave} disabled={saving || !form.title || !form.subject_name || !form.grade || !form.file_url} className="w-full">
            {saving ? "Saving..." : isEdit ? "Update Book" : "Add Book"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
