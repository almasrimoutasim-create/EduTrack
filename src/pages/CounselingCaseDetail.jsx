import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { 
  Calendar, User, Plus, Check, ArrowRight, Activity, TrendingUp, Clock, AlertTriangle, 
  FolderClosed, ChevronLeft, Award, UserCheck, ShieldAlert 
} from "lucide-react";
import AssessmentFormDialog from "@/components/counseling/AssessmentFormDialog";
import { 
  canAddAssessment, canAddFollowUp, canCreatePlan, canCloseCase, 
  riskLevelConfig, statusConfig, progressConfig 
} from "@/lib/counselingPermissions";

const btnPrimary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed";
const btnSecondary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all border-2 border-stone-200 bg-white text-stone-800 hover:bg-stone-50 cursor-pointer disabled:opacity-50";

export default function CounselingCaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [assessmentOpen, setAssessmentOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [followUpOpen, setFollowUpOpen] = useState(false);

  // Intervention Plan form state
  const [planGoal, setPlanGoal] = useState("");
  const [planResponsible, setPlanResponsible] = useState("");
  const [planStartDate, setPlanStartDate] = useState("");
  const [planEndDate, setPlanEndDate] = useState("");
  const [planActions, setPlanActions] = useState([]);
  const [currentAction, setCurrentAction] = useState("");

  // Follow-up form state
  const [followUpNote, setFollowUpNote] = useState("");
  const [followUpStatus, setFollowUpStatus] = useState("stable");

  // 1. Fetch Case Data
  const { data: caseData, isLoading: caseLoading } = useQuery({
    queryKey: ["counseling-case", id],
    queryFn: () => base44.entities.CounselingCase.get(id),
    staleTime: 1000 * 60 * 2
  });

  // 2. Fetch Student Data (based on student_id in caseData)
  const { data: student } = useQuery({
    queryKey: ["counseling-student", caseData?.student_id],
    queryFn: () => base44.entities.Student.get(caseData.student_id),
    staleTime: 1000 * 60 * 10,
    enabled: !!caseData?.student_id
  });

  // 3. Fetch Case Assessments
  const { data: assessments = [], isLoading: assessmentsLoading } = useQuery({
    queryKey: ["case-assessments", id],
    queryFn: () => base44.entities.CaseAssessment.filter({ case_id: id }),
    staleTime: 1000 * 60 * 2
  });

  // 4. Fetch Follow Ups
  const { data: followUps = [], isLoading: followUpsLoading } = useQuery({
    queryKey: ["case-followups", id],
    queryFn: () => base44.entities.FollowUp.filter({ case_id: id }),
    staleTime: 1000 * 60 * 2
  });

  // 5. Fetch Intervention Plans
  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ["intervention-plans", id],
    queryFn: () => base44.entities.InterventionPlan.filter({ case_id: id }),
    staleTime: 1000 * 60 * 2
  });

  // Close Case Mutation
  const closeCaseMutation = useMutation({
    mutationFn: async () => {
      return base44.entities.CounselingCase.update(id, {
        status: "closed",
        closed_at: new Date().toISOString(),
        closed_by: user.id
      });
    },
    onSuccess: () => {
      toast.success("تم إغلاق الحالة الإرشادية بنجاح");
      queryClient.invalidateQueries({ queryKey: ["counseling-case", id] });
      queryClient.invalidateQueries({ queryKey: ["counseling-cases"] });
    },
    onError: () => {
      toast.error("فشل إغلاق الحالة");
    }
  });

  // Create Intervention Plan Mutation
  const createPlanMutation = useMutation({
    mutationFn: async () => {
      if (!planGoal.trim()) throw new Error("يرجى إدخال الهدف الأساسي للخطة");
      if (!planResponsible.trim()) throw new Error("يرجى إدخال الشخص المسؤول");
      if (!planStartDate || !planEndDate) throw new Error("يرجى إدخال التواريخ");

      return base44.entities.InterventionPlan.create({
        case_id: id,
        goal_text: planGoal,
        responsible_person: planResponsible,
        start_date: planStartDate,
        end_date: planEndDate,
        actions: planActions,
        status: "active",
        created_by: user.id
      });
    },
    onSuccess: () => {
      toast.success("تم إنشاء خطة التدخل بنجاح");
      queryClient.invalidateQueries({ queryKey: ["intervention-plans", id] });
      setPlanOpen(false);
      setPlanGoal("");
      setPlanResponsible("");
      setPlanStartDate("");
      setPlanEndDate("");
      setPlanActions([]);
    },
    onError: (err) => {
      toast.error(err.message || "فشل إنشاء الخطة");
    }
  });

  // Create Follow Up Mutation
  const createFollowUpMutation = useMutation({
    mutationFn: async () => {
      if (!followUpNote.trim()) throw new Error("يرجى كتابة ملاحظة المتابعة");

      return base44.entities.FollowUp.create({
        case_id: id,
        note: followUpNote,
        progress_status: followUpStatus,
        created_by: user.id
      });
    },
    onSuccess: () => {
      toast.success("تم إضافة المتابعة بنجاح");
      queryClient.invalidateQueries({ queryKey: ["case-followups", id] });
      setFollowUpOpen(false);
      setFollowUpNote("");
      setFollowUpStatus("stable");
    },
    onError: (err) => {
      toast.error(err.message || "فشل إضافة المتابعة");
    }
  });

  // Add Action for Plan Form
  const handleAddAction = () => {
    if (currentAction.trim()) {
      setPlanActions([...planActions, currentAction.trim()]);
      setCurrentAction("");
    }
  };

  // Remove Action from Plan Form
  const handleRemoveAction = (index) => {
    setPlanActions(planActions.filter((_, i) => i !== index));
  };

  if (caseLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" dir="rtl">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        <span className="mr-3 font-semibold text-stone-600">جاري تحميل بيانات الحالة...</span>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="p-8 text-center" dir="rtl">
        <AlertTriangle className="mx-auto text-red-500 h-12 w-12 mb-4" />
        <p className="font-bold text-lg text-stone-850">الحالة غير موجودة أو تم حذفها</p>
        <button onClick={() => navigate("/counseling/cases")} className="mt-4 px-4 py-2 bg-stone-900 text-white rounded-xl">
          العودة للقائمة
        </button>
      </div>
    );
  }

  // Formatting chart data
  const chartData = [...assessments]
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map(a => ({
      date: new Date(a.created_at).toLocaleDateString("ar-EG", { month: "short", day: "numeric" }),
      "أكاديمي": a.academic_score,
      "سلوكي": a.behavioral_score,
      "اجتماعي": a.social_score,
      "نفسي": a.psychological_score,
      "المتوسط": parseFloat(a.average_score)
    }));

  const risk = riskLevelConfig[caseData.risk_level] || riskLevelConfig.low;
  const statusInfo = statusConfig[caseData.status] || statusConfig.open;

  // Latest plan
  const latestPlan = plans && plans.length > 0 ? plans[0] : null;

  return (
    <div className="space-y-6 pb-20 text-right" dir="rtl">
      {/* Page Header / Back Button */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)} 
          className="inline-flex items-center gap-1 text-sm font-semibold text-stone-500 hover:text-stone-900 transition-colors"
        >
          <ArrowRight size={16} />
          <span>العودة للحالات</span>
        </button>
      </div>

      {/* Main Stats Header */}
      <Card className="overflow-hidden border border-stone-200/80 shadow-md bg-white rounded-2xl">
        <div className="p-6 md:p-8 bg-gradient-to-l from-stone-50 to-white flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-stone-100">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-bold text-primary uppercase tracking-wide bg-primary/5 px-2.5 py-1 rounded-lg">ملف إرشادي</span>
              <Badge className={`${risk.badge} border-none font-bold text-xs px-2.5 py-0.5 rounded-md`}>
                مستوى الخطورة: {risk.label}
              </Badge>
              <Badge className={`${statusInfo.badge} border-none font-bold text-xs px-2.5 py-0.5 rounded-md`}>
                الحالة: {statusInfo.label}
              </Badge>
            </div>
            <h1 className="font-serif font-black text-2xl md:text-3xl text-stone-900 leading-tight">
              {student ? student.full_name || student.name : "جاري تحميل اسم الطالب..."}
            </h1>
            <p className="text-stone-600 font-semibold text-base">{caseData.title}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            {caseData.status !== "closed" && canCloseCase(user?.role) && (
              <button
                onClick={() => {
                  if (confirm("هل أنت متأكد من إغلاق هذا الملف الإرشادي بشكل نهائي؟")) {
                    closeCaseMutation.mutate();
                  }
                }}
                disabled={closeCaseMutation.isPending}
                className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-red-50 text-red-700 hover:bg-red-100/80 text-sm font-bold transition-all shadow-sm shadow-red-100/25 border border-red-200"
              >
                <FolderClosed size={16} />
                <span>إغلاق الحالة</span>
              </button>
            )}
          </div>
        </div>

        {/* Case Info Meta */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 bg-white">
          <div className="space-y-1">
            <span className="text-xs font-bold text-stone-400">نوع المشكلة الأساسي</span>
            <p className="text-stone-850 font-bold text-sm">
              {{
                academic: "أكاديمي (تراجع دراسي وصعوبات تعلم)",
                behavioral: "سلوكي (انضباط وتفاعل غير سوي)",
                social: "اجتماعي (مشاكل أسرية أو مع الأقران)",
                psychological: "نفسي (قلق، توتر، قلة تركيز)",
                mixed: "مختلط (أكثر من جانب في آن واحد)"
              }[caseData.problem_type] || caseData.problem_type}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-bold text-stone-400">تاريخ فتح الملف</span>
            <p className="text-stone-850 font-bold text-sm num-en">
              {new Date(caseData.created_at).toLocaleDateString("ar-EG", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-bold text-stone-400">سبب الإحالة والملاحظات</span>
            <p className="text-stone-700 text-sm leading-relaxed">{caseData.referral_reason}</p>
          </div>
        </div>
      </Card>

      {/* Tabs Section */}
      <Tabs defaultValue="assessments" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-stone-100/80 p-1 rounded-xl border border-stone-200/50">
          <TabsTrigger value="assessments" className="rounded-lg py-2.5 text-sm font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-stone-900 data-[state=active]:shadow-sm">التقييمات البيانية</TabsTrigger>
          <TabsTrigger value="plan" className="rounded-lg py-2.5 text-sm font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-stone-900 data-[state=active]:shadow-sm">خطة التدخل</TabsTrigger>
          <TabsTrigger value="followups" className="rounded-lg py-2.5 text-sm font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-stone-900 data-[state=active]:shadow-sm">سجل المتابعة</TabsTrigger>
        </TabsList>

        {/* Tab 1: Assessments */}
        <TabsContent value="assessments" className="mt-6 space-y-6">
          <Card className="border border-stone-200 shadow-sm bg-white rounded-2xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-stone-100 bg-stone-50/50 p-6">
              <div>
                <CardTitle className="font-serif font-black text-lg text-stone-900">منحنى تقييم الحالة</CardTitle>
                <p className="text-xs text-stone-500 mt-1">تطور مستويات التقييم (1 إلى 5) بمرور الوقت</p>
              </div>
              {caseData.status !== "closed" && canAddAssessment(user?.role) && (
                <button
                  onClick={() => setAssessmentOpen(true)}
                  className={`${btnPrimary} h-9 px-4 text-xs`}
                >
                  <Plus size={14} />
                  <span>إضافة تقييم جديد</span>
                </button>
              )}
            </CardHeader>
            <CardContent className="p-6">
              {chartData.length < 1 ? (
                <div className="py-12 text-center text-stone-400">
                  <Activity className="mx-auto h-12 w-12 opacity-20 mb-3" />
                  <p className="font-bold">لا توجد تقييمات مضافة للحالة بعد</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {chartData.length >= 2 && (
                    <div className="h-[280px] w-full" dir="ltr">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f3f3" />
                          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6c757d' }} />
                          <YAxis domain={[1, 5]} tick={{ fontSize: 11, fill: '#6c757d' }} />
                          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, textAlign: 'right' }} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Line type="monotone" dataKey="أكاديمي" stroke="#3b82f6" strokeWidth={1.5} dot={{ r: 3 }} />
                          <Line type="monotone" dataKey="سلوكي" stroke="#f59e0b" strokeWidth={1.5} dot={{ r: 3 }} />
                          <Line type="monotone" dataKey="اجتماعي" stroke="#10b981" strokeWidth={1.5} dot={{ r: 3 }} />
                          <Line type="monotone" dataKey="نفسي" stroke="#a855f7" strokeWidth={1.5} dot={{ r: 3 }} />
                          <Line type="monotone" dataKey="المتوسط" stroke="#1c1917" strokeWidth={3} dot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* List of Assessments */}
                  <div className="overflow-x-auto border border-stone-200/60 rounded-xl">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="bg-stone-50/80 border-b border-stone-200 text-xs font-bold text-stone-500">
                          <th className="px-5 py-3.5">تاريخ التقييم</th>
                          <th className="px-5 py-3.5">الأكاديمي</th>
                          <th className="px-5 py-3.5">السلوكي</th>
                          <th className="px-5 py-3.5">الاجتماعي</th>
                          <th className="px-5 py-3.5">النفسي</th>
                          <th className="px-5 py-3.5">المتوسط</th>
                          <th className="px-5 py-3.5">الملاحظات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 text-sm">
                        {assessments.map((ass) => (
                          <tr key={ass.id} className="hover:bg-stone-50/30 transition-colors">
                            <td className="px-5 py-3.5 text-stone-500 num-en">
                              {new Date(ass.created_at).toLocaleDateString("ar-EG")}
                            </td>
                            <td className="px-5 py-3.5 font-semibold text-blue-600">{ass.academic_score}</td>
                            <td className="px-5 py-3.5 font-semibold text-amber-600">{ass.behavioral_score}</td>
                            <td className="px-5 py-3.5 font-semibold text-emerald-600">{ass.social_score}</td>
                            <td className="px-5 py-3.5 font-semibold text-purple-600">{ass.psychological_score}</td>
                            <td className="px-5 py-3.5 font-black text-stone-900 num-en">{ass.average_score}</td>
                            <td className="px-5 py-3.5 text-stone-600 max-w-xs truncate" title={ass.notes}>
                              {ass.notes || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Intervention Plan */}
        <TabsContent value="plan" className="mt-6 space-y-6">
          <Card className="border border-stone-200 shadow-sm bg-white rounded-2xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-stone-100 bg-stone-50/50 p-6">
              <div>
                <CardTitle className="font-serif font-black text-lg text-stone-900">خطة التدخل الإرشادية</CardTitle>
                <p className="text-xs text-stone-500 mt-1">الخطوات العملية الموضوعة لمساعدة الطالب وتعديل سلوكه</p>
              </div>
              {caseData.status !== "closed" && canCreatePlan(user?.role) && (
                <button
                  onClick={() => setPlanOpen(true)}
                  className={`${btnPrimary} h-9 px-4 text-xs`}
                >
                  <Plus size={14} />
                  <span>إنشاء خطة جديدة</span>
                </button>
              )}
            </CardHeader>
            <CardContent className="p-6">
              {!latestPlan ? (
                <div className="py-16 text-center text-stone-400">
                  <UserCheck className="mx-auto h-12 w-12 opacity-20 mb-3" />
                  <p className="font-bold">لا توجد خطط تدخل مضافة حالياً</p>
                  <p className="text-xs mt-1">يمكن للمرشد أو المدير وضع خطة لمتابعة الحالة.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Latest Plan Details Card */}
                  <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200/60 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <Award className="text-primary h-5 w-5" />
                        <h3 className="font-bold text-stone-900">الهدف الأساسي للخطة النشطة</h3>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold">
                        نشطة ومستمرة
                      </Badge>
                    </div>

                    <p className="text-stone-800 text-lg font-medium pr-1">{latestPlan.goal_text}</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-stone-200/60 text-sm">
                      <div className="flex items-center gap-2 text-stone-600">
                        <User size={16} />
                        <span>الشخص المسؤول: <strong>{latestPlan.responsible_person}</strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-stone-600 num-en">
                        <Calendar size={16} />
                        <span>تاريخ البدء: <strong>{new Date(latestPlan.start_date).toLocaleDateString("ar-EG")}</strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-stone-600 num-en">
                        <Calendar size={16} />
                        <span>تاريخ الانتهاء: <strong>{new Date(latestPlan.end_date).toLocaleDateString("ar-EG")}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Checklist of Actions */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-stone-850 flex items-center gap-2">
                      <Check className="text-emerald-600 h-5 w-5" />
                      <span>الإجراءات التنفيذية والخطوات</span>
                    </h4>

                    <div className="grid gap-2 pr-1">
                      {Array.isArray(latestPlan.actions) && latestPlan.actions.length > 0 ? (
                        latestPlan.actions.map((act, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-white border border-stone-100 rounded-xl shadow-xs">
                            <span className="w-5 h-5 rounded-full bg-stone-100 flex items-center justify-center text-xs font-bold text-stone-500 mt-0.5">
                              {index + 1}
                            </span>
                            <span className="text-stone-750 text-sm font-semibold">{act}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-stone-500 italic">لا توجد خطوات محددة للخطة.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Follow-ups */}
        <TabsContent value="followups" className="mt-6 space-y-6">
          <Card className="border border-stone-200 shadow-sm bg-white rounded-2xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-stone-100 bg-stone-50/50 p-6">
              <div>
                <CardTitle className="font-serif font-black text-lg text-stone-900">سجل متابعة الحالة</CardTitle>
                <p className="text-xs text-stone-500 mt-1">الملاحظات الدورية والتقارير المستمرة حول تحسن سلوك الطالب</p>
              </div>
              {caseData.status !== "closed" && canAddFollowUp(user?.role) && (
                <button
                  onClick={() => setFollowUpOpen(true)}
                  className={`${btnPrimary} h-9 px-4 text-xs`}
                >
                  <Plus size={14} />
                  <span>إضافة ملاحظة متابعة</span>
                </button>
              )}
            </CardHeader>
            <CardContent className="p-6">
              {followUps.length < 1 ? (
                <div className="py-16 text-center text-stone-400">
                  <Clock className="mx-auto h-12 w-12 opacity-20 mb-3" />
                  <p className="font-bold">سجل المتابعة فارغ حالياً</p>
                  <p className="text-xs mt-1">أضف متابعة دورية لمعرفة وتوثيق التغيرات السلوكية.</p>
                </div>
              ) : (
                <div className="relative border-r-2 border-stone-200 pr-5 mr-3 space-y-8 py-2">
                  {followUps.map((fu) => {
                    const statusVal = progressConfig[fu.progress_status] || progressConfig.stable;

                    return (
                      <div key={fu.id} className="relative">
                        {/* Dot indicator */}
                        <span className="absolute -right-[27px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white bg-primary shadow-xs ring-4 ring-stone-100"></span>

                        <div className="bg-stone-50/50 border border-stone-200/60 rounded-2xl p-5 hover:bg-white transition-all shadow-xs space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-stone-400">
                            <div className="flex items-center gap-1.5 font-bold">
                              <span className={statusVal.color}>
                                {statusVal.icon} {statusVal.label}
                              </span>
                            </div>
                            <span className="num-en">
                              {new Date(fu.created_at).toLocaleDateString("ar-EG", { 
                                hour: "2-digit", 
                                minute: "2-digit", 
                                day: "numeric", 
                                month: "short" 
                              })}
                            </span>
                          </div>

                          <p className="text-stone-750 text-sm leading-relaxed font-medium">
                            {fu.note}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Assessment Form Dialog */}
      <AssessmentFormDialog 
        open={assessmentOpen} 
        onOpenChange={setAssessmentOpen} 
        caseId={id}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["case-assessments", id] });
          queryClient.invalidateQueries({ queryKey: ["counseling-case", id] });
        }}
      />

      {/* Intervention Plan Dialog */}
      <Dialog open={planOpen} onOpenChange={setPlanOpen}>
        <DialogContent className="max-w-lg p-6 text-right rounded-3xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-serif font-black text-xl text-stone-900 text-right">
              إنشاء خطة تدخل جديدة
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-stone-500">الهدف الأساسي للخطة *</Label>
              <Input
                type="text"
                placeholder="مثال: تحسين الانضباط السلوكي ورفع علامات المواد العلمية"
                value={planGoal}
                onChange={(e) => setPlanGoal(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-stone-500">الشخص المسؤول عن المتابعة *</Label>
              <Input
                type="text"
                placeholder="مثال: الأستاذ أحمد (معلم التربية الإسلامية) والمرشد"
                value={planResponsible}
                onChange={(e) => setPlanResponsible(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-stone-500">تاريخ البدء *</Label>
                <Input
                  type="date"
                  value={planStartDate}
                  onChange={(e) => setPlanStartDate(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-stone-500">تاريخ الانتهاء المتوقع *</Label>
                <Input
                  type="date"
                  value={planEndDate}
                  onChange={(e) => setPlanEndDate(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>
            </div>

            {/* Dynamic Action Add */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-stone-500">الإجراءات التنفيذية</Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="أدخل إجراء عملي (مثال: لقاء أسبوعي مع المرشد)..."
                  value={currentAction}
                  onChange={(e) => setCurrentAction(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddAction();
                    }
                  }}
                  className="h-11 rounded-xl flex-1"
                />
                <button
                  type="button"
                  onClick={handleAddAction}
                  className="h-11 px-4 bg-stone-900 text-white rounded-xl text-xs font-bold hover:bg-black"
                >
                  إضافة
                </button>
              </div>

              {/* Actions List */}
              <div className="space-y-1.5 max-h-[140px] overflow-y-auto pt-2">
                {planActions.map((act, index) => (
                  <div key={index} className="flex items-center justify-between p-2.5 bg-stone-50 border border-stone-200/60 rounded-lg text-sm">
                    <span className="font-semibold text-stone-700">{act}</span>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveAction(index)}
                      className="text-red-500 hover:text-red-700 text-xs font-bold"
                    >
                      حذف
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPlanOpen(false)}
                className="flex-1 h-11 rounded-xl border-2 border-stone-200 bg-white text-stone-850 text-sm font-semibold hover:bg-stone-50 transition-all cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => createPlanMutation.mutate()}
                disabled={createPlanMutation.isPending}
                className="flex-1 h-11 rounded-xl bg-stone-900 text-white text-sm font-semibold hover:bg-black transition-all cursor-pointer shadow-md disabled:opacity-50"
              >
                {createPlanMutation.isPending ? "جاري الحفظ..." : "حفظ الخطة"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Follow-up Dialog */}
      <Dialog open={followUpOpen} onOpenChange={setFollowUpOpen}>
        <DialogContent className="max-w-md p-6 text-right rounded-3xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-serif font-black text-xl text-stone-900 text-right">
              إضافة ملاحظة متابعة جديدة
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-stone-500">حالة مستوى التقدم *</Label>
              <select
                value={followUpStatus}
                onChange={(e) => setFollowUpStatus(e.target.value)}
                className="w-full h-11 px-3 border border-stone-200 rounded-xl text-sm font-semibold focus:outline-none bg-white"
              >
                <option value="improving">تحسن (إيجابي)</option>
                <option value="stable">مستقر (متوقع)</option>
                <option value="declining">تراجع (يتطلب انتباه)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-stone-500">ملاحظات المتابعة *</Label>
              <Textarea
                placeholder="اكتب التغيرات الملاحظة وتفاصيل المتابعة الحالية..."
                value={followUpNote}
                onChange={(e) => setFollowUpNote(e.target.value)}
                rows={4}
                className="rounded-xl border-stone-250 focus-visible:ring-primary/20 bg-white"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setFollowUpOpen(false)}
                className="flex-1 h-11 rounded-xl border-2 border-stone-200 bg-white text-stone-850 text-sm font-semibold hover:bg-stone-50 transition-all cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => createFollowUpMutation.mutate()}
                disabled={createFollowUpMutation.isPending}
                className="flex-1 h-11 rounded-xl bg-stone-900 text-white text-sm font-semibold hover:bg-black transition-all cursor-pointer shadow-md disabled:opacity-50"
              >
                {createFollowUpMutation.isPending ? "جاري الإضافة..." : "إضافة الملاحظة"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
