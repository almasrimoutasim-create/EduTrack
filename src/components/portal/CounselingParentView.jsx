import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  statusConfig, 
  riskLevelConfig 
} from "@/lib/counselingPermissions";
import { ShieldCheck, Calendar, Activity, BookOpen } from "lucide-react";

export default function CounselingParentView({ studentId }) {
  // 1. Fetch Student Cases
  const { data: cases = [], isLoading: casesLoading } = useQuery({
    queryKey: ["parent-counseling-cases", studentId],
    queryFn: () => base44.entities.CounselingCase.filter({ student_id: studentId }),
    staleTime: 1000 * 60 * 5,
    enabled: !!studentId
  });

  // 2. Fetch all Assessments to find average scores for these cases
  const { data: assessments = [] } = useQuery({
    queryKey: ["parent-counseling-assessments", studentId],
    queryFn: () => base44.entities.CaseAssessment.list("-created_at", 200),
    staleTime: 1000 * 60 * 5,
    enabled: !!studentId
  });

  // 3. Fetch all Intervention Plans to find recommendations
  const { data: plans = [] } = useQuery({
    queryKey: ["parent-counseling-plans", studentId],
    queryFn: () => base44.entities.InterventionPlan.list("-created_at", 200),
    staleTime: 1000 * 60 * 5,
    enabled: !!studentId
  });

  const getRelativeTimeString = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1) return "اليوم";
    if (diffDays === 2) return "منذ يومين";
    if (diffDays <= 7) return `منذ ${diffDays} أيام`;
    return date.toLocaleDateString("ar-EG");
  };

  if (casesLoading) {
    return (
      <div className="py-12 text-center text-stone-500" dir="rtl">
        <div className="flex items-center justify-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span>جاري تحميل التحديثات التربوية والإرشادية...</span>
        </div>
      </div>
    );
  }

  if (cases.length === 0) {
    return (
      <div className="py-12 text-center text-stone-400 bg-stone-50/50 rounded-2xl border border-stone-100" dir="rtl">
        <ShieldCheck className="mx-auto h-12 w-12 opacity-25 text-emerald-600 mb-3" />
        <p className="font-bold text-stone-800">لا توجد ملاحظات أو حالات إرشادية نشطة</p>
        <p className="text-xs text-stone-500 mt-1">الوضع التعليمي والسلوكي للطالب متميز ومستقر.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
        <Activity className="text-primary h-5 w-5" />
        <h2 className="font-serif font-black text-xl text-stone-900">سجل الإرشاد والتمكين التربوي</h2>
      </div>

      <div className="grid gap-4">
        {cases.map((c) => {
          // Find the latest assessment for this case
          const caseAssessments = assessments.filter(a => a.case_id === c.id);
          const latestAssessment = caseAssessments.length > 0 ? caseAssessments[0] : null;
          const avgScore = latestAssessment ? parseFloat(latestAssessment.average_score) : 3.0; // Default fallback to 3.0 if no assessment
          
          // Progress percentage
          const progressPercent = Math.min(100, Math.max(0, (avgScore / 5.0) * 100));

          // Find the latest plan for this case
          const casePlans = plans.filter(p => p.case_id === c.id && p.status === "active");
          const latestPlan = casePlans.length > 0 ? casePlans[0] : null;

          const statusInfo = statusConfig[c.status] || statusConfig.open;

          return (
            <Card key={c.id} className="border border-stone-200/80 shadow-xs hover:shadow-md transition-shadow bg-white rounded-2xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between border-b border-stone-100 bg-stone-50/30 p-5">
                <div>
                  <h3 className="font-bold text-stone-900 text-base">متابعة إرشادية دورية</h3>
                  <p className="text-xs text-stone-550 mt-1 num-en">
                    آخر تحديث: {getRelativeTimeString(c.updated_at || c.created_at)}
                  </p>
                </div>
                <Badge className={`${statusInfo.badge} border-none font-bold text-xs px-2.5 py-0.5 rounded-md`}>
                  {statusInfo.label}
                </Badge>
              </CardHeader>
              
              <CardContent className="p-5 space-y-5">
                {/* Safe Progress Indicator */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-stone-500">
                    <span>مستوى التقدم والانضباط العام</span>
                    <span className="num-en">{Math.round(progressPercent)}%</span>
                  </div>
                  <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-600 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                </div>

                {/* Safe Recommendations from active Intervention Plan */}
                <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100/50 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-800">
                    <BookOpen size={14} />
                    <span>التوصيات والخطوات المقترحة لولي الأمر</span>
                  </div>
                  <p className="text-stone-700 text-sm leading-relaxed font-semibold">
                    {latestPlan ? latestPlan.goal_text : "قيد الدراسة والتقييم من قبل المختصين"}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
