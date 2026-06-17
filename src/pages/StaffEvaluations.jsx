import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/dbClient";
import { useLanguage } from "@/lib/LanguageContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Award, Star, Search, Plus, UserCircle2, TrendingUp, Filter } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

export default function StaffEvaluations() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const qc = useQueryClient();

  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    staff_id: "",
    rating: 5,
    evaluation_period: "",
    notes: "",
    reviewer_name: ""
  });

  const { data: evaluations = [], isLoading } = useQuery({
    queryKey: ["staff-evaluations"],
    queryFn: () => entities.StaffEvaluation.list("-created_at")
  });

  const { data: staff = [] } = useQuery({
    queryKey: ["staff-members"],
    queryFn: () => entities.StaffMember.list()
  });

  const handleCreateEvaluation = async (e) => {
    e.preventDefault();
    if (!formData.staff_id || !formData.evaluation_period) {
      toast.error(isRTL ? "الرجاء تعبئة الحقول الأساسية" : "Please fill required fields");
      return;
    }

    try {
      await entities.StaffEvaluation.create({
        ...formData,
        created_at: new Date().toISOString()
      });
      toast.success(isRTL ? "تم إضافة التقييم بنجاح" : "Evaluation added successfully");
      setIsAdding(false);
      setFormData({ staff_id: "", rating: 5, evaluation_period: "", notes: "", reviewer_name: "" });
      qc.invalidateQueries({ queryKey: ["staff-evaluations"] });
    } catch (error) {
      toast.error(isRTL ? "حدث خطأ أثناء الإضافة" : "Error adding evaluation");
    }
  };

  const getStaffInfo = (staffId) => {
    const member = staff.find(s => s.id === staffId);
    return member || { full_name: staffId, name: staffId };
  };

  const filteredEvals = evaluations.filter(ev => {
    const staffMember = getStaffInfo(ev.staff_id);
    const name = (staffMember.full_name || staffMember.name || "").toLowerCase();
    const period = (ev.evaluation_period || "").toLowerCase();
    const search = searchTerm.toLowerCase();
    return name.includes(search) || period.includes(search);
  });

  const calculateAverageRating = () => {
    if (evaluations.length === 0) return 0;
    const sum = evaluations.reduce((acc, ev) => acc + (parseFloat(ev.rating) || 0), 0);
    return (sum / evaluations.length).toFixed(1);
  };

  const topPerformers = [...evaluations]
    .sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating))
    .slice(0, 3);

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight">
            {isRTL ? "تقييم الأداء" : "Performance Evaluations"}
          </h1>
          <p className="text-stone-500 font-medium mt-1">
            {isRTL ? "إدارة تقييمات الموظفين ومتابعة مؤشرات الأداء" : "Manage staff evaluations and track performance metrics"}
          </p>
        </div>
        <Button 
          onClick={() => setIsAdding(true)}
          className="bg-stone-900 hover:bg-stone-800 text-white rounded-xl h-11 px-6 font-bold shadow-md flex items-center gap-2"
        >
          <Plus size={18} />
          {isRTL ? "تقييم جديد" : "New Evaluation"}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 rounded-[24px] border-none shadow-sm bg-gradient-to-br from-indigo-50 to-purple-50">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-indigo-700/80 mb-2">{isRTL ? "إجمالي التقييمات" : "Total Evaluations"}</p>
              <h3 className="text-4xl font-black text-indigo-900 num-en">{evaluations.length}</h3>
            </div>
            <div className="p-3 bg-indigo-200/50 rounded-2xl">
              <Award className="h-6 w-6 text-indigo-700" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6 rounded-[24px] border-none shadow-sm bg-gradient-to-br from-amber-50 to-yellow-50 relative overflow-hidden">
          <div className="flex justify-between items-start relative z-10">
            <div className="w-full">
              <p className="text-sm font-bold text-amber-700/80 mb-2">{isRTL ? "متوسط تقييم المدرسة" : "Average School Rating"}</p>
              <div className="flex items-end gap-2">
                <h3 className="text-4xl font-black text-amber-900 num-en">{calculateAverageRating()}</h3>
                <span className="text-amber-700 font-bold mb-1 num-en">/ 5.0</span>
              </div>
              <div className="mt-4">
                <Progress value={(calculateAverageRating() / 5) * 100} className="h-2 bg-amber-200/50 [&>div]:bg-amber-500" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 rounded-[24px] border-none shadow-sm bg-gradient-to-br from-emerald-50 to-teal-50">
          <div className="flex justify-between items-start mb-4">
            <p className="text-sm font-bold text-emerald-700/80">{isRTL ? "المتميزون مؤخراً" : "Recent Top Performers"}</p>
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="space-y-3">
            {topPerformers.length > 0 ? topPerformers.map(tp => (
              <div key={tp.id} className="flex justify-between items-center bg-white/60 p-2 rounded-xl">
                <span className="font-semibold text-emerald-900 text-sm truncate max-w-[120px]">
                  {getStaffInfo(tp.staff_id).full_name || getStaffInfo(tp.staff_id).name}
                </span>
                <div className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-lg text-xs font-bold num-en">
                  <Star size={10} className="fill-emerald-700" />
                  {tp.rating}
                </div>
              </div>
            )) : (
              <p className="text-xs text-emerald-600/70">{isRTL ? "لا توجد تقييمات كافية" : "Not enough evaluations"}</p>
            )}
          </div>
        </Card>
      </div>

      {/* Main List */}
      <Card className="border border-stone-100 shadow-sm rounded-[32px] overflow-hidden bg-white">
        <div className="p-6 border-b border-stone-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="text-xl font-bold text-stone-800">
            {isRTL ? "سجل التقييمات" : "Evaluations Log"}
          </h2>
          <div className="relative w-full sm:w-72">
            <Search className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 text-stone-400`} size={16} />
            <Input 
              placeholder={isRTL ? "بحث بالاسم أو الفترة..." : "Search by name or period..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`h-10 bg-stone-50 border-stone-100 rounded-xl text-sm ${isRTL ? "pr-10" : "pl-10"}`}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-stone-50/50 text-stone-500 font-semibold border-b border-stone-100">
              <tr>
                <th className={`p-4 font-bold ${isRTL ? "text-right" : "text-left"}`}>{isRTL ? "الموظف" : "Employee"}</th>
                <th className={`p-4 font-bold ${isRTL ? "text-right" : "text-left"}`}>{isRTL ? "التقييم" : "Rating"}</th>
                <th className={`p-4 font-bold ${isRTL ? "text-right" : "text-left"}`}>{isRTL ? "فترة التقييم" : "Period"}</th>
                <th className={`p-4 font-bold ${isRTL ? "text-right" : "text-left"}`}>{isRTL ? "المقيّم" : "Reviewer"}</th>
                <th className={`p-4 font-bold ${isRTL ? "text-right" : "text-left"}`}>{isRTL ? "ملاحظات" : "Notes"}</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvals.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-stone-400 font-medium">
                    {isRTL ? "لا توجد تقييمات مسجلة." : "No evaluations recorded."}
                  </td>
                </tr>
              ) : (
                filteredEvals.map((ev) => (
                  <tr key={ev.id} className="border-b border-stone-50 hover:bg-stone-50/50 transition-colors">
                    <td className={`p-4 font-bold text-stone-800 flex items-center gap-3 ${isRTL ? "text-right" : "text-left"}`}>
                      <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center">
                        <UserCircle2 size={18} className="text-stone-400" />
                      </div>
                      <div className="flex flex-col">
                        <span>{getStaffInfo(ev.staff_id).full_name || getStaffInfo(ev.staff_id).name}</span>
                        <span className="text-xs text-stone-400 font-normal">{getStaffInfo(ev.staff_id).role || "Staff"}</span>
                      </div>
                    </td>
                    <td className={`p-4 ${isRTL ? "text-right" : "text-left"}`}>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            size={14} 
                            className={star <= parseFloat(ev.rating) ? "fill-amber-400 text-amber-400" : "fill-stone-100 text-stone-200"} 
                          />
                        ))}
                        <span className="ml-2 font-bold num-en">{ev.rating}</span>
                      </div>
                    </td>
                    <td className={`p-4 font-medium text-stone-600 ${isRTL ? "text-right" : "text-left"}`}>
                      {ev.evaluation_period}
                    </td>
                    <td className={`p-4 text-stone-500 ${isRTL ? "text-right" : "text-left"}`}>
                      {ev.reviewer_name || "-"}
                    </td>
                    <td className={`p-4 text-stone-500 max-w-[200px] truncate ${isRTL ? "text-right" : "text-left"}`} title={ev.notes}>
                      {ev.notes || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Evaluation Dialog */}
      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden rounded-[32px] border-none">
          <div className="p-8 bg-stone-50 border-b border-stone-100">
            <h3 className="text-2xl font-black text-stone-900 mb-1">
              {isRTL ? "إضافة تقييم أداء جديد" : "Add Performance Evaluation"}
            </h3>
            <p className="text-stone-500 font-medium">
              {isRTL ? "سجل تقييمك للموظف، هذا التقييم يؤثر في السلم الوظيفي والمكافآت." : "Record your evaluation, this affects career progression and bonuses."}
            </p>
          </div>
          <form onSubmit={handleCreateEvaluation} className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-stone-700">{isRTL ? "الموظف" : "Employee"}</label>
                  <Select value={formData.staff_id} onValueChange={(v) => setFormData({...formData, staff_id: v})}>
                    <SelectTrigger className="h-12 rounded-xl border-stone-200">
                      <SelectValue placeholder={isRTL ? "اختر الموظف" : "Select Staff"} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {staff.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.full_name || s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-stone-700">{isRTL ? "التقييم (من 5)" : "Rating (out of 5)"}</label>
                  <Input 
                    required
                    type="number"
                    min="1"
                    max="5"
                    step="0.1"
                    value={formData.rating}
                    onChange={(e) => setFormData({...formData, rating: parseFloat(e.target.value)})}
                    className="h-12 rounded-xl border-stone-200 num-en" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-stone-700">{isRTL ? "فترة التقييم" : "Evaluation Period"}</label>
                  <Input 
                    required
                    value={formData.evaluation_period}
                    onChange={(e) => setFormData({...formData, evaluation_period: e.target.value})}
                    className="h-12 rounded-xl border-stone-200" 
                    placeholder={isRTL ? "مثال: الربع الأول 2026" : "e.g. Q1 2026"}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-stone-700">{isRTL ? "اسم المقيّم (المشرف)" : "Reviewer Name"}</label>
                  <Input 
                    value={formData.reviewer_name}
                    onChange={(e) => setFormData({...formData, reviewer_name: e.target.value})}
                    className="h-12 rounded-xl border-stone-200" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-stone-700">{isRTL ? "الملاحظات وتوصيات التطوير" : "Notes & Development Recommendations"}</label>
                <Textarea 
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="rounded-xl border-stone-200 min-h-[100px] resize-none" 
                  placeholder={isRTL ? "اكتب تفاصيل التقييم ونقاط القوة والضعف..." : "Write evaluation details, strengths and weaknesses..."}
                />
              </div>
            </div>

            <div className="pt-6 border-t border-stone-100 flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsAdding(false)} className="h-12 px-6 rounded-xl font-bold">
                {isRTL ? "إلغاء" : "Cancel"}
              </Button>
              <Button type="submit" className="h-12 px-8 rounded-xl font-bold bg-stone-900 text-white hover:bg-stone-800">
                {isRTL ? "حفظ التقييم" : "Save Evaluation"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
