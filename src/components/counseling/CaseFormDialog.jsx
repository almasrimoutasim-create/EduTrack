import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function CaseFormDialog({ open, onOpenChange, onSuccess }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [studentId, setStudentId] = useState("");
  const [title, setTitle] = useState("");
  const [problemType, setProblemType] = useState("academic");
  const [referralReason, setReferralReason] = useState("");
  const [searchFilter, setSearchFilter] = useState("");

  const { data: students = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ["students-list-counseling"],
    queryFn: () => base44.entities.Student.list("-created_at", 500),
    staleTime: 1000 * 60 * 5,
    enabled: open
  });

  // Filter students by name or student_id
  const filteredStudents = students.filter(s => 
    (s.full_name || s.name || "").toLowerCase().includes(searchFilter.toLowerCase()) ||
    (s.student_id || "").includes(searchFilter)
  );

  // Reset fields when opened
  useEffect(() => {
    if (open) {
      setStudentId("");
      setTitle("");
      setProblemType("academic");
      setReferralReason("");
      setSearchFilter("");
    }
  }, [open]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!studentId) throw new Error("Please select a student");
      if (!title.trim()) throw new Error("Please enter a title");
      if (!referralReason.trim()) throw new Error("Please enter referral reason");
      
      return base44.entities.CounselingCase.create({
        student_id: studentId,
        title,
        problem_type: problemType,
        referral_reason: referralReason,
        created_by: user.id,
        status: "open",
        risk_level: "medium"
      });
    },
    onSuccess: (newCase) => {
      toast.success("تم إنشاء الحالة بنجاح");
      queryClient.invalidateQueries({ queryKey: ["counseling-cases"] });
      onOpenChange(false);
      if (onSuccess) onSuccess(newCase.id);
    },
    onError: (err) => {
      console.error(err);
      toast.error(err.message || "فشل إنشاء الحالة");
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
            إنشاء حالة إرشادية جديدة
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-1.5 text-right">
            <Label className="text-xs font-bold text-stone-550">البحث عن طالب واختياره *</Label>
            <Input
              type="text"
              placeholder="ابحث بالاسم أو رقم الطالب..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="mb-2 h-10 rounded-xl border border-stone-200"
            />
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              required
              className="w-full h-11 px-3 border border-stone-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
            >
              <option value="">-- اختر الطالب من القائمة --</option>
              {filteredStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name || s.name} ({s.student_id || s.id})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 text-right">
            <Label className="text-xs font-bold text-stone-550">عنوان الحالة *</Label>
            <Input
              type="text"
              placeholder="مثال: تراجع الأداء الدراسي المفاجئ"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="h-11 rounded-xl border border-stone-200"
            />
          </div>

          <div className="space-y-1.5 text-right">
            <Label className="text-xs font-bold text-stone-550">نوع المشكلة *</Label>
            <select
              value={problemType}
              onChange={(e) => setProblemType(e.target.value)}
              className="w-full h-11 px-3 border border-stone-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
            >
              <option value="academic">أكاديمي</option>
              <option value="behavioral">سلوكي</option>
              <option value="social">اجتماعي</option>
              <option value="psychological">نفسي</option>
              <option value="mixed">مختلط</option>
            </select>
          </div>

          <div className="space-y-1.5 text-right">
            <Label className="text-xs font-bold text-stone-550">سبب الإحالة بالتفصيل *</Label>
            <Textarea
              value={referralReason}
              onChange={(e) => setReferralReason(e.target.value)}
              placeholder="اكتب سبب الإحالة والظواهر الملاحظة على الطالب..."
              rows={4}
              required
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
              {mutation.isPending ? "جاري الإنشاء..." : "إنشاء وبدء التقييم"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
