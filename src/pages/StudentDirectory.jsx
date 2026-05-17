import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  Download, 
  Calendar,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  Trash2,
  Edit3
} from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/translations";
import PageHeader from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all border-2 border-stone-200 bg-white text-stone-800 hover:bg-stone-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const btnPrimary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed";

export default function StudentDirectory() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const [searchTerm, setSearchTerm] = useState("");

  const { data: students = [], isLoading } = useQuery({ 
    queryKey: ["student-directory-list"], 
    queryFn: () => base44.entities.Student.list("-created_date", 100) 
  });

  const filteredStudents = students.filter(s =>
    (s.full_name || s.name)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.student_id?.includes(searchTerm) ||
    s.grade?.includes(searchTerm)
  );

  const exportCSV = () => {
    const headers = ["ID", "Full Name", "Student ID", "Grade", "Section", "Parent Name", "Parent Phone", "Parent Email", "Status", "Bus Route"];
    const rows = filteredStudents.map(s => [
      s.id,
      s.full_name || "",
      s.student_id || "",
      s.grade || "",
      s.section || "",
      s.parent_name || "",
      s.parent_phone || "",
      s.parent_email || "",
      s.status || "",
      s.bus_route || ""
    ]);
    const csvContent = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `students_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(isRTL ? "تم تصدير البيانات" : "CSV exported");
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  return (
    <div className="space-y-6 pb-20" dir={isRTL ? "rtl" : "ltr"}>
      <PageHeader 
        title={isRTL ? "دليل الطلاب الشامل" : "Comprehensive Student Directory"} 
        subtitle={isRTL ? "إدارة سجلات الطلاب، تتبع الفصول، والوصول السريع لبيانات التواصل" : "Manage student records, track classes, and quick access to contact data"}
      >
        <div className="flex gap-3">
          <button onClick={exportCSV} className={`${btnOutline} rounded-xl h-11 px-5`}>
            <Download size={18} />
            <span>{isRTL ? "تصدير البيانات" : "Export CSV"}</span>
          </button>
          <button className={`${btnPrimary} h-11 px-5`}>
            <UserPlus size={18} />
            <span>{isRTL ? "إضافة طالب جديد" : "Add Student"}</span>
          </button>
        </div>
      </PageHeader>

      {/* Directory Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: isRTL ? "إجمالي الطلاب" : "Total Students", value: students.length, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { label: isRTL ? "طلاب نشطون" : "Active Students", value: students.filter(s => s.status === "active").length, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: isRTL ? "مسجلون بالحافلة" : "Bus Registered", value: students.filter(s => s.bus_registered).length, icon: Calendar, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: isRTL ? "نتائج البحث" : "Search Results", value: filteredStudents.length, icon: AlertCircle, color: "text-rose-600", bg: "bg-rose-50" },
        ].map((stat, i) => (
          <Card key={i} className="p-6 border shadow-sm bg-white rounded-xl flex flex-col justify-between group cursor-pointer hover:shadow-md transition-all">
            <div className={`h-12 w-12 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-stone-400 text-[10px] font-semibold uppercase tracking-wide mb-0.5">{stat.label}</p>
              <h4 className="text-2xl font-bold text-stone-900 num-en">{stat.value}</h4>
            </div>
          </Card>
        ))}
      </div>

      {/* Advanced Filter Bar */}
      <Card className="p-4 border shadow-sm bg-white rounded-xl flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-stone-400`} size={18} />
          <Input 
            placeholder={isRTL ? "بحث بالاسم، الرقم الجامعي، أو الصف..." : "Search by name, ID, or grade..."} 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`h-11 ${isRTL ? 'pr-12' : 'pl-12'} border-none bg-stone-50 rounded-xl text-base font-medium focus-visible:ring-0`}
            dir={isRTL ? "rtl" : "ltr"}
          />
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button className={`${btnOutline} h-11 px-5 rounded-xl font-semibold flex-1 md:flex-none`}>
            <Filter size={18} />
            <span>{isRTL ? "تصفية متقدمة" : "Advanced Filter"}</span>
          </button>
          <button className={`${btnOutline} h-11 px-5 rounded-xl font-semibold flex-1 md:flex-none`}>
            <Calendar size={18} />
            <span>{isRTL ? "حسب الصف" : "By Grade"}</span>
          </button>
        </div>
      </Card>

      {/* Main Table */}
      <Card className="border shadow-sm rounded-xl bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" dir={isRTL ? "rtl" : "ltr"}>
            <thead>
              <tr className="bg-stone-50/50 border-b border-stone-100">
                <th className="px-6 py-4 text-center w-10">
                  <Checkbox className="rounded-md" />
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-wide">{isRTL ? "اسم الطالب" : "Student Name"}</th>
                <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-wide">{isRTL ? "الرقم الجامعي" : "Student ID"}</th>
                <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-wide">{isRTL ? "الصف" : "Grade"}</th>
                <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-wide">{isRTL ? "حالة الملف" : "Status"}</th>
                <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-wide">{isRTL ? "الإجراءات" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {isLoading ? (
                [1,2,3,4,5].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-5 h-14 bg-stone-50/50" />
                  </tr>
                ))
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-stone-400">
                    {isRTL ? "لا توجد نتائج" : "No results found"}
                  </td>
                </tr>
              ) : filteredStudents.map((student, i) => (
                <tr key={student.id} className="hover:bg-stone-50/30 transition-colors group">
                  <td className="px-6 py-4 text-center">
                    <Checkbox className="rounded-md" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-stone-100 flex items-center justify-center font-bold text-stone-400 group-hover:bg-primary group-hover:text-white transition-all">
                        {(student.full_name || student.name)?.[0]}
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-stone-900 block group-hover:text-primary transition-colors">{student.full_name || student.name}</span>
                        <span className="text-[10px] font-semibold text-stone-400 uppercase">{student.email || 'student@edu.ae'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-stone-600 num-en">{student.id}</td>
                  <td className="px-6 py-4">
                    <Badge className="bg-stone-50 text-stone-600 border-none rounded-lg text-[9px] font-bold px-2 py-0.5 num-en">
                      {student.grade || '10-A'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-bold text-stone-400 uppercase">{isRTL ? "مكتمل" : "Active"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-left">
                    <div className="flex items-center justify-end gap-2">
                      <button className={`${btnOutline} rounded-lg gap-1 text-xs h-8 px-3`}>
                        <Edit3 size={14} />
                        {t("common.edit", language)}
                      </button>
                      <button className={`${btnOutline} rounded-lg gap-1 text-xs h-8 px-3 border-rose-200 hover:bg-rose-50 hover:text-rose-600`}>
                        <Trash2 size={14} />
                        {t("common.delete", language)}
                      </button>
                      <button className={`${btnOutline} rounded-lg gap-1 text-xs h-8 px-3`}>
                        <MoreVertical size={14} />
                        {t("common.options", language)}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-6 border-t border-stone-100 flex items-center justify-between">
          <p className="text-xs font-semibold text-stone-400 uppercase">
            {isRTL ? `عرض ` : `Showing `}<span className="num-en font-bold">{filteredStudents.length}</span>{isRTL ? ` من أصل ` : ` of `}<span className="num-en font-bold">{students.length}</span>{isRTL ? ` طالباً` : ` students`}
          </p>
          <div className="flex gap-2">
            <button className={`${btnOutline} h-9 w-9 rounded-lg num-en`}><ChevronLeft size={18} className={isRTL ? "rotate-180" : ""} /></button>
            <button className={`${btnPrimary} h-9 w-9 rounded-lg num-en`}>1</button>
            <button className={`${btnOutline} h-9 w-9 rounded-lg num-en`}>2</button>
            <button className={`${btnOutline} h-9 w-9 rounded-lg num-en`}><ChevronRight size={18} className={isRTL ? "rotate-180" : ""} /></button>
          </div>
        </div>
      </Card>
    </div>
  );
}
