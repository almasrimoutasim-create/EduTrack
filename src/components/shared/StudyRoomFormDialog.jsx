import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";

const platforms = [
  { value: "zoom", label: "Zoom" },
  { value: "google_meet", label: "Google Meet" },
  { value: "microsoft_teams", label: "Microsoft Teams" },
  { value: "other", label: "Other" },
];

const statuses = [
  { value: "upcoming", label: "Upcoming" },
  { value: "live", label: "Live" },
  { value: "ended", label: "Ended" },
];

const grades = ["1","2","3","4","5","6","7","8","9","10","11","12"];

export default function StudyRoomFormDialog({ open, onClose, room }) {
  const isEdit = !!room;
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(room || {
    title: "", subject_name: "", grade: "", teacher_name: "",
    room_code: "", meeting_url: "", platform: "zoom",
    scheduled_at: "", duration_minutes: 60, description: "",
    status: "upcoming", target_grades: "", notify_students: false
  });

  useEffect(() => {
    setForm(room || {
      title: "", subject_name: "", grade: "", teacher_name: "",
      room_code: "", meeting_url: "", platform: "zoom",
      scheduled_at: "", duration_minutes: 60, description: "",
      status: "upcoming", target_grades: "", notify_students: false
    });
  }, [room]);

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const generateCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    update("room_code", code);
  };

  const handleSave = async () => {
    if (!form.title || !form.room_code) return;
    setSaving(true);
    try {
      if (isEdit) {
        await base44.entities.StudyRoom.update(room.id, form);
      } else {
        await base44.entities.StudyRoom.create(form);
      }
      qc.invalidateQueries({ queryKey: ["study-rooms"] });
      onClose();
    } catch (err) {
      console.error("Failed to save study room:", err);
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Room" : "Book New Room"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label>Room Title *</Label>
            <Input value={form.title} onChange={e => update("title", e.target.value)} placeholder="e.g. Math Review Session" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Subject</Label>
              <Input value={form.subject_name} onChange={e => update("subject_name", e.target.value)} />
            </div>
            <div>
              <Label>Grade</Label>
              <Select value={form.grade} onValueChange={v => update("grade", v)}>
                <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                <SelectContent>
                  {grades.map(g => <SelectItem key={g} value={g}>Grade {g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Teacher Name</Label>
            <Input value={form.teacher_name} onChange={e => update("teacher_name", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Room Code *</Label>
              <div className="flex gap-2">
                <Input value={form.room_code} onChange={e => update("room_code", e.target.value.toUpperCase())} placeholder="e.g. ABC123" />
                <button type="button" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all border-2 border-stone-200 bg-white text-stone-800 hover:bg-stone-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed h-8 px-3" onClick={generateCode}>Generate</button>
              </div>
            </div>
            <div>
              <Label>Platform</Label>
              <Select value={form.platform} onValueChange={v => update("platform", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {platforms.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Meeting URL</Label>
            <Input value={form.meeting_url} onChange={e => update("meeting_url", e.target.value)} placeholder="https://..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Scheduled Date & Time</Label>
              <Input type="datetime-local" value={form.scheduled_at} onChange={e => update("scheduled_at", e.target.value)} />
            </div>
            <div>
              <Label>Duration (minutes)</Label>
              <Input type="number" value={form.duration_minutes} onChange={e => update("duration_minutes", parseInt(e.target.value) || 60)} />
            </div>
          </div>
          <div>
            <Label>Target Grades (comma separated)</Label>
            <Input value={form.target_grades} onChange={e => update("target_grades", e.target.value)} placeholder="e.g. 5,6,7" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={e => update("description", e.target.value)} rows={2} />
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
            <Switch checked={form.notify_students} onCheckedChange={v => update("notify_students", v)} />
            <Label>Notify Students</Label>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={v => update("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {statuses.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <button onClick={handleSave} disabled={saving || !form.title || !form.room_code} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed w-full h-11">
            {saving ? "Saving..." : isEdit ? "Update Room" : "Book Room"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
