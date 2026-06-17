import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/dbClient";
import { useLanguage } from "@/lib/LanguageContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trophy, ArrowUp, Plus, Target, CheckCircle2, Star } from "lucide-react";
import { toast } from "sonner";

export default function CareerLadder() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const qc = useQueryClient();

  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    level: 1,
    requirements: "",
    min_years: 1
  });

  const { data: ladderSteps = [], isLoading } = useQuery({
    queryKey: ["career-ladder"],
    queryFn: () => entities.CareerLadder.list() // Usually would be sorted by level
  });

  const sortedSteps = [...ladderSteps].sort((a, b) => parseInt(a.level) - parseInt(b.level));

  const handleCreateStep = async (e) => {
    e.preventDefault();
    if (!formData.title) {
      toast.error(isRTL ? "المسمى مطلوب" : "Title is required");
      return;
    }

    try {
      await entities.CareerLadder.create({
        ...formData,
        level: parseInt(formData.level),
        min_years: parseInt(formData.min_years),
        created_at: new Date().toISOString()
      });
      toast.success(isRTL ? "تم إضافة الدرجة الوظيفية بنجاح" : "Ladder step added successfully");
      setIsAdding(false);
      setFormData({ title: "", level: 1, requirements: "", min_years: 1 });
      qc.invalidateQueries({ queryKey: ["career-ladder"] });
    } catch (error) {
      toast.error(isRTL ? "حدث خطأ" : "An error occurred");
    }
  };

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
            {isRTL ? "السلم الوظيفي" : "Career Ladder"}
          </h1>
          <p className="text-stone-500 font-medium mt-1">
            {isRTL ? "مسار التطور الوظيفي ومعايير الترقية للموظفين" : "Career progression paths and promotion criteria"}
          </p>
        </div>
        <Button 
          onClick={() => setIsAdding(true)}
          className="bg-stone-900 hover:bg-stone-800 text-white rounded-xl h-11 px-6 font-bold shadow-md flex items-center gap-2"
        >
          <Plus size={18} />
          {isRTL ? "إضافة درجة وظيفة" : "Add Career Level"}
        </Button>
      </div>

      <div className="max-w-4xl mx-auto py-8">
        {sortedSteps.length === 0 ? (
          <Card className="p-12 text-center border-2 border-dashed border-stone-200 rounded-[32px]">
            <Trophy className="mx-auto h-16 w-16 text-stone-300 mb-4" />
            <p className="text-stone-500 font-bold text-lg mb-4">
              {isRTL ? "لم يتم إعداد السلم الوظيفي بعد." : "Career ladder has not been configured yet."}
            </p>
            <Button onClick={() => setIsAdding(true)} className="rounded-xl font-bold">
              {isRTL ? "ابدأ بإضافة الدرجات" : "Start Adding Levels"}
            </Button>
          </Card>
        ) : (
          <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-1.5 before:bg-gradient-to-b before:from-stone-200 before:to-stone-100 before:rounded-full">
            {sortedSteps.map((step, index) => (
              <div key={step.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-stone-900 text-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-md relative z-10 font-bold text-sm">
                  {step.level}
                </div>
                
                <Card className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-6 rounded-[24px] border border-stone-100 shadow-sm hover:shadow-md transition-shadow bg-white relative">
                  {/* Small pointer triangle */}
                  <div className={`absolute top-4 w-4 h-4 bg-white border-stone-100 rotate-45 ${isRTL ? 'right-full translate-x-2 border-r-0 border-t-0 md:group-even:left-full md:group-even:-translate-x-2 md:group-even:border-l-0 md:group-even:border-b-0' : 'right-full translate-x-2 border-l border-b md:group-even:left-full md:group-even:-translate-x-2 md:group-even:border-r border-t-0'}`} />
                  
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-black text-xl text-stone-900">{step.title}</h3>
                      <div className="flex items-center gap-2 text-stone-500 text-xs font-semibold mt-1">
                        <Star size={14} className="text-amber-500 fill-amber-500" />
                        <span>{isRTL ? `المستوى ${step.level}` : `Level ${step.level}`}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-stone-50">
                    <div className="flex items-start gap-2">
                      <Target size={16} className="text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-stone-400 uppercase">{isRTL ? "المتطلبات الأساسية" : "Requirements"}</p>
                        <p className="text-sm font-medium text-stone-700 mt-0.5 leading-relaxed">{step.requirements || (isRTL ? "لا توجد متطلبات مسجلة." : "No requirements listed.")}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-stone-400 uppercase">{isRTL ? "الخبرة المطلوبة" : "Required Experience"}</p>
                        <p className="text-sm font-medium text-stone-700 mt-0.5">
                          <span className="font-black num-en">{step.min_years}</span> {isRTL ? "سنوات كحد أدنى" : "years minimum"}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-[32px] border-none">
          <div className="p-8 bg-stone-50 border-b border-stone-100">
            <h3 className="text-2xl font-black text-stone-900 mb-1">
              {isRTL ? "إضافة درجة في السلم الوظيفي" : "Add Career Level"}
            </h3>
          </div>
          <form onSubmit={handleCreateStep} className="p-8 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <label className="text-sm font-bold text-stone-700">{isRTL ? "المسمى الوظيفي" : "Job Title / Grade"}</label>
                <Input 
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="h-12 rounded-xl border-stone-200" 
                  placeholder={isRTL ? "مثال: معلم أول" : "e.g. Senior Teacher"}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-stone-700">{isRTL ? "رقم المستوى (1, 2, ...)" : "Level Number"}</label>
                <Input 
                  required
                  type="number"
                  min="1"
                  value={formData.level}
                  onChange={(e) => setFormData({...formData, level: e.target.value})}
                  className="h-12 rounded-xl border-stone-200 num-en" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-stone-700">{isRTL ? "سنوات الخبرة كحد أدنى" : "Min. Years"}</label>
                <Input 
                  required
                  type="number"
                  min="0"
                  value={formData.min_years}
                  onChange={(e) => setFormData({...formData, min_years: e.target.value})}
                  className="h-12 rounded-xl border-stone-200 num-en" 
                />
              </div>

              <div className="space-y-2 col-span-2">
                <label className="text-sm font-bold text-stone-700">{isRTL ? "المتطلبات وشروط الترقية" : "Promotion Requirements"}</label>
                <Input 
                  required
                  value={formData.requirements}
                  onChange={(e) => setFormData({...formData, requirements: e.target.value})}
                  className="h-12 rounded-xl border-stone-200" 
                  placeholder={isRTL ? "دورات تدريبية، تقييم امتياز، إلخ." : "Training, excellent rating, etc."}
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsAdding(false)} className="h-11 px-6 rounded-xl font-bold">
                {isRTL ? "إلغاء" : "Cancel"}
              </Button>
              <Button type="submit" className="h-11 px-8 rounded-xl font-bold bg-stone-900 text-white hover:bg-stone-800">
                {isRTL ? "حفظ السلم" : "Save Level"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
