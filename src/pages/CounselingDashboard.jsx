import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import PageHeader from "@/components/shared/PageHeader";
import StatCard from "@/components/shared/StatCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  FolderOpen, AlertTriangle, Eye, CheckCircle, Search, ClipboardList, Filter 
} from "lucide-react";
import { riskLevelConfig, statusConfig } from "@/lib/counselingPermissions";

export default function CounselingDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Load all students for mapping
  const { data: students = [] } = useQuery({
    queryKey: ["students-mapping-list-dashboard"],
    queryFn: () => base44.entities.Student.list("-created_at", 500),
    staleTime: 1000 * 60 * 10
  });

  const studentMap = React.useMemo(() => {
    const map = {};
    students.forEach(s => {
      map[s.id] = s.full_name || s.name;
    });
    return map;
  }, [students]);

  // Load all cases for dashboard
  const { data: cases = [], isLoading } = useQuery({
    queryKey: ["all-counseling-cases"],
    queryFn: () => base44.entities.CounselingCase.list(),
    staleTime: 1000 * 60 * 3
  });

  // Calculate Stat values
  const openCount = cases.filter(c => c.status === "open").length;
  const criticalCount = cases.filter(c => c.risk_level === "critical" && c.status !== "closed").length;
  const monitorCount = cases.filter(c => c.status === "monitoring").length;
  
  const closedCount = cases.filter(c => {
    if (c.status !== "closed" || !c.closed_at) return false;
    const closedDate = new Date(c.closed_at);
    const now = new Date();
    return closedDate.getMonth() === now.getMonth() && closedDate.getFullYear() === now.getFullYear();
  }).length;

  // Client-side filtering
  const filteredCases = cases.filter(c => {
    const studentName = studentMap[c.student_id] || "";
    const title = c.title || "";
    const query = searchTerm.toLowerCase();
    
    const matchesSearch = studentName.toLowerCase().includes(query) || title.toLowerCase().includes(query);
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    const matchesRisk = riskFilter === "all" || c.risk_level === riskFilter;
    const matchesType = typeFilter === "all" || c.problem_type === typeFilter;

    return matchesSearch && matchesStatus && matchesRisk && matchesType;
  });

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
    <div className="space-y-6 pb-20 text-right" dir="rtl">
      <PageHeader 
        title="لوحة تحكم الإرشاد الطلابي" 
        subtitle="متابعة المؤشرات والتقارير العامة لحالات الإرشاد الطلابي في المدرسة"
      />

      {/* 4 StatCards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
          title="الحالات المفتوحة"     
          value={openCount}    
          icon={FolderOpen}  
          color="blue"   
          sub="تنتظر خطط التدخل أو المراجعة"
        />
        <StatCard 
          title="الحالات الحرجة"       
          value={criticalCount} 
          icon={AlertTriangle} 
          color="red"  
          sub="تتطلب تدخلاً عاجلاً"
        />
        <StatCard 
          title="تحت المتابعة"         
          value={monitorCount}  
          icon={Eye}         
          color="gold"   
          sub="قيد الرصد والتحسن المستمر"
        />
        <StatCard 
          title="مغلقة هذا الشهر"     
          value={closedCount}   
          icon={CheckCircle} 
          color="green"  
          sub="تم حلها وإغلاق ملفاتها بنجاح"
        />
      </div>

      {/* Filters & Search */}
      <Card className="p-6 border shadow-sm bg-white rounded-2xl space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
          <Filter className="text-stone-500 h-5 w-5" />
          <h3 className="font-bold text-stone-850 text-sm">تصفية وبحث الحالات</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative w-full">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
            <Input 
              placeholder="ابحث باسم الطالب أو عنوان الحالة..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 pl-4 bg-white border-stone-200 rounded-xl h-11 text-right"
              dir="rtl"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-11 px-3 border border-stone-200 rounded-xl text-sm font-semibold focus:outline-none bg-white"
          >
            <option value="all">كل الحالات (الحالة)</option>
            <option value="open">مفتوحة</option>
            <option value="monitoring">تحت المتابعة</option>
            <option value="closed">مغلقة</option>
          </select>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="h-11 px-3 border border-stone-200 rounded-xl text-sm font-semibold focus:outline-none bg-white"
          >
            <option value="all">كل المستويات (الخطورة)</option>
            <option value="low">منخفض</option>
            <option value="medium">متوسط</option>
            <option value="high">مرتفع</option>
            <option value="critical">حرج</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-11 px-3 border border-stone-200 rounded-xl text-sm font-semibold focus:outline-none bg-white"
          >
            <option value="all">كل الأنواع (نوع المشكلة)</option>
            <option value="academic">أكاديمي</option>
            <option value="behavioral">سلوكي</option>
            <option value="social">اجتماعي</option>
            <option value="psychological">نفسي</option>
            <option value="mixed">مختلط</option>
          </select>
        </div>
      </Card>

      {/* Cases Table */}
      <Card className="border shadow-sm bg-white overflow-hidden rounded-2xl">
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
            <p className="font-bold text-lg">لا توجد حالات إرشادية مطابقة للفلاتر</p>
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
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border-2 border-stone-200 bg-white text-stone-850 hover:bg-stone-50 font-semibold text-xs cursor-pointer transition-colors"
                        >
                          <Eye size={14} />
                          <span>عرض</span>
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
    </div>
  );
}
