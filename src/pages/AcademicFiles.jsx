import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { entities } from "@/api/dbClient";
import { useLanguage } from "@/lib/LanguageContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FolderArchive, Search, FileText, Upload, Filter, CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AcademicFiles() {
  const { language } = useLanguage();
  const isRTL = language === "ar";

  const [searchTerm, setSearchTerm] = useState("");

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["students-list"],
    queryFn: () => entities.Student.list()
  });

  const filteredStudents = students.filter(s => 
    (s.full_name || s.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.id || s.student_id || "").includes(searchTerm)
  );

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
            {isRTL ? "الملفات الأكاديمية" : "Academic Files"}
          </h1>
          <p className="text-stone-500 font-medium mt-1">
            {isRTL ? "مراجعة واستكمال المستندات والوثائق الخاصة بالطلاب" : "Review and complete student documents and credentials"}
          </p>
        </div>
      </div>

      <Card className="border border-stone-100 shadow-sm rounded-[32px] overflow-hidden bg-white">
        <div className="p-6 border-b border-stone-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
            <FolderArchive size={20} className="text-indigo-600" />
            {isRTL ? "سجلات الطلاب" : "Student Records"}
          </h2>
          <div className="relative w-full sm:w-96">
            <Search className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 text-stone-400`} size={16} />
            <Input 
              placeholder={isRTL ? "بحث باسم الطالب أو الهوية..." : "Search by name or ID..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`h-11 bg-stone-50 border-stone-100 rounded-xl text-sm ${isRTL ? "pr-10" : "pl-10"}`}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-stone-50/50 text-stone-500 font-semibold border-b border-stone-100">
              <tr>
                <th className={`p-4 font-bold ${isRTL ? "text-right" : "text-left"}`}>{isRTL ? "الطالب" : "Student"}</th>
                <th className={`p-4 font-bold ${isRTL ? "text-right" : "text-left"}`}>{isRTL ? "الصف / المرحلة" : "Grade"}</th>
                <th className={`p-4 font-bold ${isRTL ? "text-right" : "text-left"}`}>{isRTL ? "حالة الملفات" : "Files Status"}</th>
                <th className={`p-4 font-bold ${isRTL ? "text-right" : "text-left"}`}>{isRTL ? "المستندات" : "Documents"}</th>
                <th className={`p-4 font-bold text-center`}>{isRTL ? "إجراء" : "Action"}</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-stone-400 font-medium">
                    {isRTL ? "لا يوجد طلاب يطابقون البحث." : "No students match your search."}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, idx) => {
                  // Mock logic for status based on ID string length or index
                  const isComplete = idx % 3 !== 0; 
                  return (
                    <tr key={student.id} className="border-b border-stone-50 hover:bg-stone-50/50 transition-colors">
                      <td className={`p-4 font-bold text-stone-800 ${isRTL ? "text-right" : "text-left"}`}>
                        <div className="flex flex-col">
                          <span>{student.full_name || student.name}</span>
                          <span className="text-xs text-stone-400 num-en font-normal">{student.id}</span>
                        </div>
                      </td>
                      <td className={`p-4 text-stone-500 font-medium ${isRTL ? "text-right" : "text-left"}`}>
                        {student.grade_level || (isRTL ? "الصف الأول" : "Grade 1")}
                      </td>
                      <td className={`p-4 ${isRTL ? "text-right" : "text-left"}`}>
                        {isComplete ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border-none px-3 py-1 flex items-center gap-1 w-fit">
                            <CheckCircle2 size={14} />
                            {isRTL ? "مكتمل" : "Complete"}
                          </Badge>
                        ) : (
                          <Badge className="bg-rose-100 text-rose-800 border-none px-3 py-1 flex items-center gap-1 w-fit">
                            <AlertCircle size={14} />
                            {isRTL ? "نواقص" : "Incomplete"}
                          </Badge>
                        )}
                      </td>
                      <td className={`p-4 ${isRTL ? "text-right" : "text-left"}`}>
                        <div className="flex items-center gap-2">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isComplete ? 'bg-stone-100 text-stone-400' : 'bg-primary/10 text-primary'}`} title="Birth Certificate">
                            <FileText size={14} />
                          </div>
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isComplete ? 'bg-stone-100 text-stone-400' : 'bg-rose-50 text-rose-400'}`} title="Medical Record">
                            <FileText size={14} />
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl"
                        >
                          <Upload size={16} className="mr-2" />
                          {isRTL ? "إدارة الملفات" : "Manage Files"}
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
