import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { entities } from "@/api/dbClient";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/translations";
import PageHeader from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Search, 
  Eye, 
  FolderOpen, 
  AlertTriangle,
  ClipboardList 
} from "lucide-react";
import CaseFormDialog from "@/components/counseling/CaseFormDialog";
import AssessmentFormDialog from "@/components/counseling/AssessmentFormDialog";
import { 
  canCreateCase, 
  riskLevelConfig, 
  statusConfig 
} from "@/lib/counselingPermissions";

const btnPrimary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed";

export default function CounselingCases() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { language } = useLanguage();
  const isRTL = language === "ar";

  const [searchTerm, setSearchTerm] = useState("");
  const [caseFormOpen, setCaseFormOpen] = useState(false);
  const [assessmentFormOpen, setAssessmentFormOpen] = useState(false);
  const [activeCaseId, setActiveCaseId] = useState(null);

  // Load students for mapping IDs to names
  const { data: students = [] } = useQuery({
    queryKey: ["students-mapping-list"],
    queryFn: () => entities.Student.list("-created_at", 500),
    staleTime: 1000 * 60 * 10
  });

  const studentMap = React.useMemo(() => {
    const map = {};
    students.forEach(s => {
      map[s.id] = s.full_name || s.name;
    });
    return map;
  }, [students]);

  const filters = user.role === "admin" ? null : { created_by: user.id };

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ["counseling-cases", user.id, user.role],
    queryFn: () => filters 
      // @ts-ignore
      ? entities.CounselingCase.filter(filters)
      // @ts-ignore
      : entities.CounselingCase.list(),
    staleTime: 1000 * 60 * 3
  });

  const filteredCases = cases.filter(c => {
    const studentName = studentMap[c.student_id] || "";
    const title = c.title || "";
    const query = searchTerm.toLowerCase();
    return studentName.toLowerCase().includes(query) || title.toLowerCase().includes(query);
  });

  const handleCreateSuccess = (newId) => {
    setActiveCaseId(newId);
    setAssessmentFormOpen(true);
  };

  const getProblemTypeLabel = (type) => {
    const types = {
      academic: "أكاديمي",
      behavioral: "سلوكي",
      social: "اجتماعي",
      psychological: "نفسي",
      mixed: "مختلط"
    };
    return types[type] || type;
  };

  return (
    <div className="space-y-6 pb-20" dir="rtl">
      <PageHeader 
        title="الإرشاد الطلابي" 
        subtitle="متابعة الحالات الإرشادية والتقييمات وخطط التدخل للطلاب"
      >
        {canCreateCase(user?.role) && (
          <button 
            onClick={() => setCaseFormOpen(true)}
            className={`${btnPrimary} h-11 px-5`}
          >
            <Plus size={18} />
            <span>إنشاء حالة جديدة</span>
          </button>
        )}
      </PageHeader>

      {/* Search Bar */}
      <Card className="p-4 border shadow-sm bg-white flex items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
          <Input 
            placeholder="ابحث باسم الطالب أو عنوان الحالة..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10 pl-4 bg-white border-stone-200 rounded-xl h-11 text-right"
            dir="rtl"
          />
        </div>
      </Card>

      {/* Cases Table */}
      <Card className="border shadow-sm bg-white overflow-hidden rounded-xl">
        {isLoading ? (
          <div className="py-16 text-center text-stone-500">
            <div className="flex items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span>جاري تحميل الحالات...</span>
            </div>
          </div>
        ) : filteredCases.length === 0 ? (
          <div className="py-16 text-center text-stone-400">
            <ClipboardList className="mx-auto h-16 w-16 opacity-10 mb-4" />
            <p className="font-bold text-lg">لا توجد حالات إرشادية مسجلة بعد</p>
            <p className="text-sm">يمكنك بدء تسجيل حالة جديدة بالنقر على زر إنشاء حالة.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200">
                  <th className="px-6 py-4 text-xs font-bold text-stone-500">الطالب</th>
                  <th className="px-6 py-4 text-xs font-bold text-stone-500">العنوان</th>
                  <th className="px-6 py-4 text-xs font-bold text-stone-500">نوع المشكلة</th>
                  <th className="px-6 py-4 text-xs font-bold text-stone-500">مستوى الخطورة</th>
                  <th className="px-6 py-4 text-xs font-bold text-stone-500">الحالة</th>
                  <th className="px-6 py-4 text-xs font-bold text-stone-500">تاريخ الإنشاء</th>
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredCases.map((c) => {
                  const risk = riskLevelConfig[c.risk_level] || riskLevelConfig.low;
                  const statusInfo = statusConfig[c.status] || statusConfig.open;

                  return (
                    <tr key={c.id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-semibold text-stone-900">
                        {studentMap[c.student_id] || "جاري التحميل..."}
                      </td>
                      <td className="px-6 py-4 text-sm text-stone-700">
                        {c.title}
                      </td>
                      <td className="px-6 py-4 text-sm text-stone-600">
                        {getProblemTypeLabel(c.problem_type)}
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={`${risk.badge} border-none rounded-lg font-bold text-xs`}>
                          {risk.label}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={`${statusInfo.badge} border-none rounded-lg font-bold text-xs`}>
                          {statusInfo.label}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-stone-500 num-en">
                        {c.created_at ? new Date(c.created_at).toLocaleDateString("ar-EG") : "—"}
                      </td>
                      <td className="px-6 py-4 text-left">
                        <button
                          onClick={() => navigate(`/counseling/${c.id}`)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border-2 border-stone-200 bg-white text-stone-800 hover:bg-stone-50 hover:border-stone-400 font-semibold text-xs cursor-pointer transition-colors"
                        >
                          <Eye size={14} />
                          <span>عرض التفاصيل</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Case form dialog */}
      <CaseFormDialog 
        open={caseFormOpen} 
        onOpenChange={setCaseFormOpen} 
        onSuccess={handleCreateSuccess}
      />

      {/* Assessment Form Dialog */}
      <AssessmentFormDialog 
        open={assessmentFormOpen} 
        onOpenChange={setAssessmentFormOpen} 
        caseId={activeCaseId}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["counseling-cases"] })}
      />
    </div>
  );
}
