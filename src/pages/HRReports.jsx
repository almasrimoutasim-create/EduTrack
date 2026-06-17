import React from "react";
import { useQuery } from "@tanstack/react-query";
import { entities } from "@/api/dbClient";
import { useLanguage } from "@/lib/LanguageContext";
import { Card } from "@/components/ui/card";
import { Users, FileSpreadsheet, Briefcase, Award, TrendingUp, DollarSign } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function HRReports() {
  const { language } = useLanguage();
  const isRTL = language === "ar";

  const { data: staff = [], isLoading: loadingStaff } = useQuery({
    queryKey: ["staff-members"],
    queryFn: () => entities.StaffMember.list()
  });

  const { data: contracts = [], isLoading: loadingContracts } = useQuery({
    queryKey: ["staff-contracts"],
    queryFn: () => entities.StaffContract.list()
  });

  const { data: evals = [], isLoading: loadingEvals } = useQuery({
    queryKey: ["staff-evaluations"],
    queryFn: () => entities.StaffEvaluation.list()
  });

  const { data: departments = [], isLoading: loadingDepts } = useQuery({
    queryKey: ["departments"],
    queryFn: () => entities.Department.list()
  });

  const isLoading = loadingStaff || loadingContracts || loadingEvals || loadingDepts;

  // KPIs
  const totalStaff = staff.length;
  const activeContracts = contracts.filter(c => c.status === "active");
  const totalPayroll = activeContracts.reduce((sum, c) => sum + (parseFloat(c.salary) || 0), 0);
  
  const avgRating = evals.length > 0 
    ? evals.reduce((sum, e) => sum + (parseFloat(e.rating) || 0), 0) / evals.length 
    : 0;

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
            {isRTL ? "تقارير الموارد البشرية" : "HR Reports & Analytics"}
          </h1>
          <p className="text-stone-500 font-medium mt-1">
            {isRTL ? "نظرة شاملة على مؤشرات أداء الموظفين والتكاليف" : "Comprehensive overview of staff performance and costs"}
          </p>
        </div>
        <button className="bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl h-11 px-6 font-bold flex items-center gap-2 transition-colors">
          <FileSpreadsheet size={18} />
          {isRTL ? "تصدير التقرير" : "Export Report"}
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 rounded-[24px] border border-stone-100 shadow-sm hover:shadow-md transition-shadow bg-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-bold text-stone-400 mb-1">{isRTL ? "إجمالي القوة العاملة" : "Total Workforce"}</p>
              <h3 className="text-3xl font-black text-stone-900 num-en">{totalStaff}</h3>
            </div>
            <div className="p-3 bg-stone-50 rounded-2xl text-stone-600">
              <Users size={24} />
            </div>
          </div>
        </Card>

        <Card className="p-6 rounded-[24px] border border-stone-100 shadow-sm hover:shadow-md transition-shadow bg-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-bold text-stone-400 mb-1">{isRTL ? "إجمالي الرواتب" : "Total Payroll"}</p>
              <h3 className="text-3xl font-black text-emerald-600 num-en">${totalPayroll.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
              <DollarSign size={24} />
            </div>
          </div>
        </Card>

        <Card className="p-6 rounded-[24px] border border-stone-100 shadow-sm hover:shadow-md transition-shadow bg-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-bold text-stone-400 mb-1">{isRTL ? "متوسط تقييم الأداء" : "Avg Performance"}</p>
              <h3 className="text-3xl font-black text-amber-500 num-en">{avgRating.toFixed(1)} <span className="text-sm">/ 5.0</span></h3>
            </div>
            <div className="p-3 bg-amber-50 rounded-2xl text-amber-500">
              <Award size={24} />
            </div>
          </div>
        </Card>

        <Card className="p-6 rounded-[24px] border border-stone-100 shadow-sm hover:shadow-md transition-shadow bg-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-bold text-stone-400 mb-1">{isRTL ? "الأقسام الفعالة" : "Active Departments"}</p>
              <h3 className="text-3xl font-black text-blue-600 num-en">{departments.length}</h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
              <Briefcase size={24} />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Distribution (Mock visual using CSS) */}
        <Card className="p-6 md:p-8 rounded-[32px] border border-stone-100 shadow-sm bg-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-indigo-50 rounded-xl">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold text-stone-800">{isRTL ? "توزيع الموظفين على الأقسام" : "Staff Distribution"}</h2>
          </div>
          
          <div className="space-y-5">
            {departments.length === 0 ? (
              <p className="text-stone-400 text-sm">{isRTL ? "لا توجد بيانات للأقسام" : "No department data"}</p>
            ) : (
              departments.map(dept => {
                // Approximate staff count logic
                const count = staff.filter(s => (s.role || "").toLowerCase().includes((dept.name || "").toLowerCase())).length || 1;
                const percentage = Math.min((count / (totalStaff || 1)) * 100, 100);
                
                return (
                  <div key={dept.id} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-bold text-stone-700">{dept.name}</span>
                      <span className="font-bold text-stone-400 num-en">{count} {isRTL ? "موظف" : "Staff"}</span>
                    </div>
                    <Progress value={percentage} className="h-2.5 bg-stone-100 [&>div]:bg-indigo-500" />
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Contract Status Overview */}
        <Card className="p-6 md:p-8 rounded-[32px] border border-stone-100 shadow-sm bg-stone-900 text-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-stone-800 rounded-xl">
              <FileSpreadsheet className="h-5 w-5 text-stone-300" />
            </div>
            <h2 className="text-xl font-bold text-white">{isRTL ? "ملخص العقود والرواتب" : "Contracts & Payroll Summary"}</h2>
          </div>

          <div className="space-y-6">
            <div className="p-5 bg-stone-800/50 rounded-2xl border border-stone-700/50">
              <p className="text-stone-400 text-sm font-bold mb-1">{isRTL ? "نسبة العقود النشطة" : "Active Contracts Ratio"}</p>
              <div className="flex items-end gap-3 mb-3">
                <span className="text-4xl font-black num-en">{activeContracts.length}</span>
                <span className="text-stone-400 font-bold mb-1 num-en">/ {contracts.length || totalStaff}</span>
              </div>
              <Progress value={contracts.length > 0 ? (activeContracts.length / contracts.length) * 100 : 0} className="h-2 bg-stone-800 [&>div]:bg-emerald-400" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 bg-stone-800/50 rounded-2xl border border-stone-700/50">
                <p className="text-stone-400 text-xs font-bold mb-1">{isRTL ? "متوسط الراتب" : "Average Salary"}</p>
                <p className="text-xl font-black text-white num-en">
                  ${activeContracts.length > 0 ? (totalPayroll / activeContracts.length).toFixed(0) : 0}
                </p>
              </div>
              <div className="p-5 bg-stone-800/50 rounded-2xl border border-stone-700/50">
                <p className="text-stone-400 text-xs font-bold mb-1">{isRTL ? "بدون عقد مسجل" : "No Contract"}</p>
                <p className="text-xl font-black text-rose-400 num-en">
                  {Math.max(totalStaff - activeContracts.length, 0)}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
