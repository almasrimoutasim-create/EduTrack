import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function AssessmentFormDialog({ open, onOpenChange, caseId, onSuccess }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [academicScore, setAcademicScore] = useState(3);
  const [behavioralScore, setBehavioralScore] = useState(3);
  const [socialScore, setSocialScore] = useState(3);
  const [psychologicalScore, setPsychologicalScore] = useState(3);
  const [notes, setNotes] = useState("");

  const averageScore = ((academicScore + behavioralScore + socialScore + psychologicalScore) / 4.0).toFixed(2);

  // Reset fields when opened
  useEffect(() => {
    if (open) {
      setAcademicScore(3);
      setBehavioralScore(3);
      setSocialScore(3);
      setPsychologicalScore(3);
      setNotes("");
    }
  }, [open]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("User ID is missing");
      const avg = ((academicScore + behavioralScore + socialScore + psychologicalScore) / 4.0).toFixed(2);
      return base44.entities.CaseAssessment.create({
        case_id: caseId,
        academic_score: String(academicScore),
        behavioral_score: String(behavioralScore),
        social_score: String(socialScore),
        psychological_score: String(psychologicalScore),
        average_score: avg,
        notes,
        created_by: user.id
      });
    },
    onSuccess: () => {
      toast.success("تم إضافة التقييم بنجاح");
      queryClient.invalidateQueries({ queryKey: ["case-assessments"] });
      queryClient.invalidateQueries({ queryKey: ["counseling-case"] });
      queryClient.invalidateQueries({ queryKey: ["counseling-cases"] });
      if (onSuccess) onSuccess();
      onOpenChange(false);
    },
    onError: (err) => {
      console.error(err);
      toast.error("فشل إضافة التقييم");
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 text-right rounded-3xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="font-serif font-black text-xl text-stone-900 text-right">
            إضافة تقييم جديد للحالة
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 text-right">
              <Label className="text-xs font-bold text-stone-550">الأكاديمي *</Label>
              <select
                value={academicScore}
                onChange={(e) => setAcademicScore(Number(e.target.value))}
                className="w-full h-11 px-3 border border-stone-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
              >
                {[1, 2, 3, 4, 5].map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 text-right">
              <Label className="text-xs font-bold text-stone-550">السلوكي *</Label>
              <select
                value={behavioralScore}
                onChange={(e) => setBehavioralScore(Number(e.target.value))}
                className="w-full h-11 px-3 border border-stone-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
              >
                {[1, 2, 3, 4, 5].map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 text-right">
              <Label className="text-xs font-bold text-stone-550">الاجتماعي *</Label>
              <select
                value={socialScore}
                onChange={(e) => setSocialScore(Number(e.target.value))}
                className="w-full h-11 px-3 border border-stone-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
              >
                {[1, 2, 3, 4, 5].map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 text-right">
              <Label className="text-xs font-bold text-stone-550">النفسي *</Label>
              <select
                value={psychologicalScore}
                onChange={(e) => setPsychologicalScore(Number(e.target.value))}
                className="w-full h-11 px-3 border border-stone-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
              >
                {[1, 2, 3, 4, 5].map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100 flex justify-between items-center text-sm font-bold">
            <span className="text-stone-500">متوسط الدرجات:</span>
            <span className="text-primary font-black num-en">{averageScore}</span>
          </div>

          <div className="space-y-1.5 text-right">
            <Label className="text-xs font-bold text-stone-550">ملاحظات التقييم</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="اكتب تفاصيل التقييم والملاحظات هنا..."
              rows={3}
              className="rounded-xl border-stone-250 focus-visible:ring-primary/20 bg-white"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-11 rounded-xl border-2 border-stone-200 bg-white text-stone-850 text-sm font-semibold hover:bg-stone-50 transition-all cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 h-11 rounded-xl bg-stone-900 text-white text-sm font-semibold hover:bg-black transition-all cursor-pointer shadow-md disabled:opacity-50"
            >
              {mutation.isPending ? "جاري الحفظ..." : "حفظ التقييم"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
