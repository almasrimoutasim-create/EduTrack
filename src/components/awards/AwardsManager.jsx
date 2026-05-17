import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Trophy, Plus, Trash2, Star, Medal, Crown, Award, Zap, Heart, Flame } from "lucide-react";

const AWARD_ICONS = {
  trophy: Trophy, star: Star, medal: Medal, crown: Crown,
  award: Award, zap: Zap, heart: Heart, flame: Flame,
};
const AWARD_COLORS = {
  gold: { label: "Gold", bg: "bg-yellow-100", text: "text-yellow-700", icon: "text-yellow-500" },
  silver: { label: "Silver", bg: "bg-gray-100", text: "text-gray-600", icon: "text-gray-400" },
  bronze: { label: "Bronze", bg: "bg-orange-100", text: "text-orange-700", icon: "text-orange-500" },
  blue: { label: "Blue", bg: "bg-blue-100", text: "text-blue-700", icon: "text-blue-500" },
  green: { label: "Green", bg: "bg-green-100", text: "text-green-700", icon: "text-green-500" },
  purple: { label: "Purple", bg: "bg-purple-100", text: "text-purple-700", icon: "text-purple-500" },
  red: { label: "Red", bg: "bg-red-100", text: "text-red-700", icon: "text-red-500" },
};

export default function AwardsManager() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [form, setForm] = useState({ title: "", description: "", icon: "trophy", color: "gold", awarded_date: new Date().toISOString().split("T")[0] });

  const { data: students = [] } = useQuery({
    queryKey: ["all-students"],
    queryFn: () => base44.entities.Student.list(),
  });
  const { data: awards = [] } = useQuery({
    queryKey: ["all-awards"],
    queryFn: () => base44.entities.StudentAward.list(),
  });

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!selectedStudent || !form.title) return;
    setSaving(true);
    await base44.entities.StudentAward.create({
      ...form,
      student_id: selectedStudent.id,
      student_name: selectedStudent.full_name,
    });
    // Notify student
    await base44.entities.PortalNotification.create({
      recipient_id: selectedStudent.id,
      message: `🏆 You received a new award: "${form.title}"`,
      type: "award",
      ref_id: selectedStudent.id,
    });
    qc.invalidateQueries(["all-awards"]);
    setSaving(false); setShowAdd(false);
    setForm({ title: "", description: "", icon: "trophy", color: "gold", awarded_date: new Date().toISOString().split("T")[0] });
    setSelectedStudent(null);
  };

  const deleteAward = async (id) => {
    await base44.entities.StudentAward.delete(id);
    qc.invalidateQueries(["all-awards"]);
  };

  const IconPreview = AWARD_ICONS[form.icon] || Trophy;
  const colorStyle = AWARD_COLORS[form.color] || AWARD_COLORS.gold;

  // Group awards by student
  const byStudent = awards.reduce((acc, a) => {
    if (!acc[a.student_id]) acc[a.student_id] = { name: a.student_name, awards: [] };
    acc[a.student_id].awards.push(a);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <h2 className="font-bold text-lg">Student Awards</h2>
        </div>
        <button onClick={() => setShowAdd(true)} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed h-11 px-4 gap-1.5"><Plus className="h-4 w-4" /> Give Award</button>
      </div>

      {Object.keys(byStudent).length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Trophy className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p>No awards given yet. Recognise a student!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(byStudent).map(([sid, { name, awards: stuAwards }]) => (
            <Card key={sid}>
              <CardContent className="p-4">
                <p className="font-semibold text-sm mb-3">{name}</p>
                <div className="flex flex-wrap gap-3">
                  {stuAwards.map(a => {
                    const Icon = AWARD_ICONS[a.icon] || Trophy;
                    const c = AWARD_COLORS[a.color] || AWARD_COLORS.gold;
                    return (
                      <div key={a.id} className="relative group">
                        <div className={`flex flex-col items-center gap-1 p-3 rounded-xl border ${c.bg} w-20`}>
                          <Icon className={`h-7 w-7 ${c.icon}`} />
                          <p className="text-[10px] font-semibold text-center leading-tight">{a.title}</p>
                          {a.description && <p className="text-[9px] text-muted-foreground text-center">{a.description}</p>}
                        </div>
                        <button
                          onClick={() => deleteAward(a.id)}
                          className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Give a Student an Award</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {/* Student selector */}
            <div>
              <Label>Select Student *</Label>
              <Select onValueChange={v => setSelectedStudent(students.find(s => s.id === v))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Choose student..." /></SelectTrigger>
                <SelectContent>
                  {students.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name} (Grade {s.grade})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Award Title *</Label>
              <Input className="mt-1" placeholder="e.g. Top Student, Most Improved..." value={form.title} onChange={e => upd("title", e.target.value)} />
            </div>
            <div>
              <Label>Description</Label>
              <Input className="mt-1" placeholder="Optional note..." value={form.description} onChange={e => upd("description", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Icon</Label>
                <Select value={form.icon} onValueChange={v => upd("icon", v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(AWARD_ICONS).map(k => <SelectItem key={k} value={k}>{k.charAt(0).toUpperCase() + k.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Color</Label>
                <Select value={form.color} onValueChange={v => upd("color", v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(AWARD_COLORS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Preview */}
            <div className="flex justify-center">
              <div className={`flex flex-col items-center gap-1.5 p-4 rounded-2xl border-2 ${colorStyle.bg} w-28`}>
                <IconPreview className={`h-10 w-10 ${colorStyle.icon}`} />
                <p className="text-xs font-bold text-center">{form.title || "Preview"}</p>
              </div>
            </div>
            <div>
              <Label>Date</Label>
              <Input className="mt-1" type="date" value={form.awarded_date} onChange={e => upd("awarded_date", e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all border-2 border-stone-200 bg-white text-stone-800 hover:bg-stone-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed h-11 px-4" onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed h-11 px-4" onClick={save} disabled={saving || !form.title || !selectedStudent}>
              {saving ? "Saving..." : "Give Award 🏆"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}