import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const types = [
  { value: "document", label: "Document" },
  { value: "video", label: "Video" },
  { value: "link", label: "Link" },
  { value: "note", label: "Note" },
];

const grades = ["1","2","3","4","5","6","7","8","9","10","11","12"];

export default function StudyMaterialFormDialog({ open, onClose, material }) {
  const isEdit = !!material;
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(material || {
    title: "", subject_name: "", grade: "", type: "document",
    content: "", file_url: "", external_url: "",
    teacher_name: "", description: "", is_published: true
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects-list"],
    queryFn: () => base44.entities.Subject.list()
  });

  useEffect(() => {
    setForm(material || {
      title: "", subject_name: "", grade: "", type: "document",
      content: "", file_url: "", external_url: "",
      teacher_name: "", description: "", is_published: true
    });
  }, [material]);

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!form.title || !form.subject_name || !form.grade) return;
    setSaving(true);
    try {
      if (isEdit) {
        await base44.entities.StudyMaterial.update(material.id, form);
      } else {
        await base44.entities.StudyMaterial.create(form);
      }
      qc.invalidateQueries({ queryKey: ["materials"] });
      onClose();
    } catch (err) {
      console.error("Failed to save material:", err);
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Material" : "Upload New Material"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label>Title *</Label>
            <Input value={form.title} onChange={e => update("title", e.target.value)} placeholder="e.g. Chapter 5 Notes" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Subject *</Label>
              {(() => {
                const filteredSubjects = form.grade 
                  ? subjects.filter(s => s.grade === form.grade)
                  : subjects;
                const subjectsToDisplay = filteredSubjects.length > 0 ? filteredSubjects : subjects;
                const uniqueSubjectNames = [...new Set(subjectsToDisplay.map(s => s.name))];

                return (
                  <Select value={form.subject_name} onValueChange={v => {
                    const subObj = subjects.find(s => s.name === v);
                    setForm(f => ({
                      ...f,
                      subject_name: v,
                      subject_id: subObj?.id || f.subject_id
                    }));
                  }}>
                    <SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger>
                    <SelectContent>
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
            <Label>Teacher Name</Label>
            <Input value={form.teacher_name} onChange={e => update("teacher_name", e.target.value)} />
          </div>
          {(form.type === "document" || form.type === "video") && (
            <div>
              <Label>File URL</Label>
              <Input value={form.file_url} onChange={e => update("file_url", e.target.value)} placeholder="https://..." />
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
            <Label>Description</Label>
            <Textarea value={form.description} onChange={e => update("description", e.target.value)} rows={2} />
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
            <Switch checked={form.is_published} onCheckedChange={v => update("is_published", v)} />
            <Label>Published</Label>
          </div>
          <button onClick={handleSave} disabled={saving || !form.title || !form.subject_name || !form.grade} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed w-full h-11">
            {saving ? "Saving..." : isEdit ? "Update Material" : "Upload Material"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
