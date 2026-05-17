import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Camera, Save } from "lucide-react";
import { toast } from "sonner";

function StarRating({ value, onChange, readonly }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button" onClick={() => !readonly && onChange && onChange(n)} disabled={readonly}>
          <Star className={`h-5 w-5 ${n <= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"} ${!readonly ? "hover:text-amber-300 cursor-pointer" : ""}`} />
        </button>
      ))}
    </div>
  );
}

export default function TeacherProfileTab({ teacher, onTeacherUpdate }) {
  const qc = useQueryClient();
  const [showRateDialog, setShowRateDialog] = useState(false);
  const [rateForm, setRateForm] = useState({ rater_name: "", rater_type: "student", rating: 5, comment: "" });
  const [saving, setSaving] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [bio, setBio] = useState(teacher.bio || "");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const { data: ratings = [] } = useQuery({
    queryKey: ["teacher-ratings", teacher.id],
    queryFn: () => base44.entities.TeacherRating.filter({ teacher_id: teacher.id }, "-created_date"),
  });

  const { data: grades = [] } = useQuery({
    queryKey: ["teacher-grades-count", teacher.id],
    queryFn: () => base44.entities.StudentGrade.filter({ teacher_name: teacher.full_name }),
  });

  const { data: reports = [] } = useQuery({
    queryKey: ["teacher-reports-count", teacher.id],
    queryFn: () => base44.entities.StudentReport.filter({ teacher_id: teacher.id }),
  });

  const { data: activities = [] } = useQuery({
    queryKey: ["teacher-activity-posts"],
    queryFn: () => base44.entities.ActivityPost.filter({ author_email: teacher.email || teacher.employee_id }, "-created_date", 10),
  });

  const avgRating = ratings.length > 0
    ? (ratings.reduce((s, r) => s + (r.rating || 0), 0) / ratings.length).toFixed(1)
    : "—";

  const submitRating = async () => {
    if (!rateForm.rater_name) return;
    setSaving(true);
    await base44.entities.TeacherRating.create({ ...rateForm, teacher_id: teacher.id, teacher_name: teacher.full_name });
    qc.invalidateQueries(["teacher-ratings", teacher.id]);
    toast.success("Rating submitted!");
    setSaving(false); setShowRateDialog(false);
    setRateForm({ rater_name: "", rater_type: "student", rating: 5, comment: "" });
  };

  const saveBio = async () => {
    await base44.entities.Teacher.update(teacher.id, { bio });
    onTeacherUpdate?.({ ...teacher, bio });
    setEditingBio(false);
    toast.success("Bio updated");
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setUploadingPhoto(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.Teacher.update(teacher.id, { photo_url: file_url });
    onTeacherUpdate?.({ ...teacher, photo_url: file_url });
    setUploadingPhoto(false);
    toast.success("Photo updated");
  };

  return (
    <div className="space-y-5">
      {/* Profile Card */}
      <Card className="overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-indigo-600 to-purple-600" />
        <CardContent className="px-5 pb-5">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="relative">
              {teacher.photo_url
                ? <img src={teacher.photo_url} className="h-20 w-20 rounded-2xl border-4 border-card object-cover shadow-lg" alt="" />
                : <div className="h-20 w-20 rounded-2xl border-4 border-card bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-2xl shadow-lg">{teacher.full_name[0]}</div>}
              <label className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary flex items-center justify-center cursor-pointer shadow">
                <Camera className="h-3.5 w-3.5 text-primary-foreground" />
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
              </label>
            </div>
            <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all border-2 border-stone-200 bg-white text-stone-800 hover:bg-stone-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed h-8 px-3 gap-1.5" onClick={() => setShowRateDialog(true)}>
              <Star className="h-4 w-4 text-amber-400" /> Rate Teacher
            </button>
          </div>

          <h2 className="text-xl font-bold">{teacher.full_name}</h2>
          <p className="text-sm text-muted-foreground">{teacher.subject || "Teacher"} · {teacher.employee_id}</p>

          {teacher.email && <p className="text-xs text-muted-foreground mt-1">{teacher.email}</p>}

          <div className="flex items-center gap-2 mt-2">
            <StarRating value={Math.round(parseFloat(avgRating) || 0)} readonly />
            <span className="text-sm font-semibold">{avgRating}</span>
            <span className="text-xs text-muted-foreground">({ratings.length} ratings)</span>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4 text-center">
            <div className="bg-muted/40 rounded-xl py-3">
              <p className="text-xl font-bold text-primary">{grades.length}</p>
              <p className="text-xs text-muted-foreground">Grades Given</p>
            </div>
            <div className="bg-muted/40 rounded-xl py-3">
              <p className="text-xl font-bold text-indigo-600">{reports.length}</p>
              <p className="text-xs text-muted-foreground">Reports Sent</p>
            </div>
            <div className="bg-muted/40 rounded-xl py-3">
              <p className="text-xl font-bold text-amber-500">{ratings.length}</p>
              <p className="text-xs text-muted-foreground">Ratings</p>
            </div>
          </div>

          {/* Bio */}
          <div className="mt-4">
            {editingBio ? (
              <div className="space-y-2">
                <Textarea className="resize-none" rows={3} value={bio} onChange={e => setBio(e.target.value)} placeholder="Write a short bio..." />
                <div className="flex gap-2">
                  <button onClick={saveBio} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed h-8 px-3 gap-1.5"><Save className="h-3.5 w-3.5" />Save</button>
                  <button className="cursor-pointer text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-lg px-3 py-2 h-8" onClick={() => setEditingBio(false)}>Cancel</button>
                </div>
              </div>
            ) : (
              <div>
                {teacher.bio ? <p className="text-sm text-muted-foreground leading-relaxed">{teacher.bio}</p> : <p className="text-sm text-muted-foreground italic">No bio yet.</p>}
                <button onClick={() => setEditingBio(true)} className="text-xs text-primary mt-1 hover:underline">Edit bio</button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Ratings Section */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ratings & Reviews</p>
        {ratings.length === 0 ? (
          <Card className="p-6 text-center"><p className="text-muted-foreground text-sm">No ratings yet. Be the first to rate!</p></Card>
        ) : (
          <div className="space-y-2">
            {ratings.map(r => (
              <Card key={r.id} className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-sm">{r.rater_name}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs capitalize">{r.rater_type}</Badge>
                    <StarRating value={r.rating} readonly />
                  </div>
                </div>
                {r.comment && <p className="text-xs text-muted-foreground mt-1">{r.comment}</p>}
                <p className="text-xs text-muted-foreground mt-1">{new Date(r.created_date).toLocaleDateString()}</p>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Activity Posts */}
      {activities.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recent Activity</p>
          {activities.map(post => (
            <Card key={post.id} className="p-3">
              <p className="text-sm">{post.content}</p>
              {post.media_url && post.media_type === "image" && (
                <img src={post.media_url} className="mt-2 rounded-lg max-h-40 object-cover w-full" alt="" />
              )}
              <p className="text-xs text-muted-foreground mt-1">{new Date(post.created_date).toLocaleDateString()}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Rate Dialog */}
      <Dialog open={showRateDialog} onOpenChange={setShowRateDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rate {teacher.full_name}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Your Name *</Label><Input className="mt-1" value={rateForm.rater_name} onChange={e => setRateForm(f => ({ ...f, rater_name: e.target.value }))} /></div>
            <div>
              <Label>You Are</Label>
              <Select value={rateForm.rater_type} onValueChange={v => setRateForm(f => ({ ...f, rater_type: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="parent">Parent</SelectItem>
                  <SelectItem value="admin">Admin / School</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block">Rating</Label>
              <StarRating value={rateForm.rating} onChange={v => setRateForm(f => ({ ...f, rating: v }))} />
            </div>
            <div><Label>Comment (optional)</Label><Textarea className="mt-1 resize-none" rows={3} value={rateForm.comment} onChange={e => setRateForm(f => ({ ...f, comment: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all border-2 border-stone-200 bg-white text-stone-800 hover:bg-stone-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed h-11 px-4" onClick={() => setShowRateDialog(false)}>Cancel</button>
            <button onClick={submitRating} disabled={saving || !rateForm.rater_name} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed h-11 px-4">{saving ? "Submitting..." : "Submit Rating"}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}