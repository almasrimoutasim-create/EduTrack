import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/dbClient";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Star } from "lucide-react";
import { toast } from "sonner";

function StarRating({ value, onChange, readonly }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button" onClick={() => !readonly && onChange?.(n)} disabled={readonly}>
          <Star className={`h-6 w-6 transition-colors ${n <= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"} ${!readonly ? "hover:text-amber-300 cursor-pointer" : ""}`} />
        </button>
      ))}
    </div>
  );
}

export default function RateTeachersTab({ me }) {
  const qc = useQueryClient();
  const [selected, setSelected] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: teachers = [] } = useQuery({
    queryKey: ["all-teachers-rate"],
    queryFn: () => entities.Teacher.list(),
  });

  const { data: myRatings = [] } = useQuery({
    queryKey: ["my-teacher-ratings", me.id],
    queryFn: () => entities.TeacherRating.filter({ rater_id: me.id }),
  });

  const { data: allRatings = [] } = useQuery({
    queryKey: ["all-teacher-ratings-summary"],
    queryFn: () => entities.TeacherRating.list(),
  });

  const alreadyRated = (teacherId) => myRatings.some(r => r.teacher_id === teacherId);

  const getAvg = (teacherId) => {
    const tr = allRatings.filter(r => r.teacher_id === teacherId);
    if (!tr.length) return null;
    return (tr.reduce((s, r) => s + (r.rating || 0), 0) / tr.length).toFixed(1);
  };

  const submit = async () => {
    if (!selected) return;
    setSaving(true);
    await entities.TeacherRating.create({
      teacher_id: selected.id,
      teacher_name: selected.full_name,
      rater_id: me.id,
      rater_name: me.full_name,
      rater_type: "student",
      rating,
      comment,
    });
    qc.invalidateQueries(["my-teacher-ratings", me.id]);
    qc.invalidateQueries(["all-teacher-ratings-summary"]);
    toast.success("Rating submitted!");
    setSelected(null); setComment(""); setRating(5);
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Tap a teacher to leave a rating and review.</p>
      <div className="space-y-2">
        {teachers.filter(t => t.status === "active").map(teacher => {
          const avg = getAvg(teacher.id);
          const rated = alreadyRated(teacher.id);
          return (
            <Card key={teacher.id} className={`transition-shadow ${!rated ? "cursor-pointer hover:shadow-md" : ""}`}
              onClick={() => !rated && setSelected(teacher)}>
              <CardContent className="p-4 flex items-center gap-3">
                {teacher.photo_url
                  ? <img src={teacher.photo_url} className="h-11 w-11 rounded-full object-cover shrink-0" alt="" />
                  : <div className="h-11 w-11 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-lg shrink-0">{teacher.full_name[0]}</div>}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{teacher.full_name}</p>
                  <p className="text-xs text-muted-foreground">{teacher.subjects || teacher.subject || "Teacher"}</p>
                  {avg && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-medium">{avg}</span>
                    </div>
                  )}
                </div>
                {rated ? (
                  <span className="text-xs font-medium text-emerald-600 shrink-0">✓ Rated</span>
                ) : (
                  <span className="text-xs text-primary font-medium shrink-0">Rate →</span>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rate {selected?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="mb-2 block">Your Rating</Label>
              <StarRating value={rating} onChange={setRating} />
            </div>
            <div>
              <Label>Comment (optional)</Label>
              <Textarea className="mt-1 resize-none" rows={3} placeholder="Share your thoughts about this teacher..."
                value={comment} onChange={e => setComment(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all border-2 border-stone-200 bg-white text-stone-800 hover:bg-stone-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed h-11 px-4" onClick={() => setSelected(null)}>Cancel</button>
            <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed h-11 px-4" onClick={submit} disabled={saving}>{saving ? "Submitting..." : "Submit Rating"}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}