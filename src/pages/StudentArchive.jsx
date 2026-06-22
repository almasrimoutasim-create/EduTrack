import React, { useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Archive, Search, History, UserMinus, FileClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function StudentArchive() {
  const { language } = useLanguage();
  const isRTL = language === "ar";

  const [searchTerm, setSearchTerm] = useState("");

  // Mock archived data since we don't have a soft-delete/archived flag in entities yet.
  // In a real app, this would fetch from entities.Student.filter({ status: 'archived' })
  const archivedStudents = [
    { id: "S-101", name: "سالم عبد الله", reason: "نقل إلى مدرسة أخرى", date: "2025-10-12", grade: "الصف الثاني" },
    { id: "S-102", name: "فاطمة حسن", reason: "تخرج", date: "2025-06-30", grade: "الصف الثالث" },
    { id: "S-103", name: "عمر خالد", reason: "سحب ملف", date: "2025-11-05", grade: "الصف الأول" },
  ];

  const filtered = archivedStudents.filter(s => 
    s.name.includes(searchTerm) || s.id.includes(searchTerm)
  );

  return (
    <div className="p-6 md:p-8 space-y-8" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight">
            {isRTL ? "أرشيف الطلاب" : "Student Archive"}
          </h1>
          <p className="text-stone-500 font-medium mt-1">
            {isRTL ? "السجلات الأكاديمية والوثائق للطلاب المنقولين والخريجين" : "Academic records and documents for transferred and graduated students"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 rounded-[24px] border-none shadow-sm bg-gradient-to-br from-stone-50 to-stone-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-stone-500 mb-2">{isRTL ? "إجمالي الملفات المؤرشفة" : "Total Archived Files"}</p>
              <h3 className="text-4xl font-black text-stone-900 num-en">{archivedStudents.length}</h3>
            </div>
            <div className="p-3 bg-stone-200/50 rounded-2xl">
              <Archive className="h-6 w-6 text-stone-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6 rounded-[24px] border-none shadow-sm bg-gradient-to-br from-stone-50 to-stone-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-stone-500 mb-2">{isRTL ? "طلبات النقل والتخرج (هذا العام)" : "Transfers & Grads (This Year)"}</p>
              <h3 className="text-4xl font-black text-stone-900 num-en">3</h3>
            </div>
            <div className="p-3 bg-stone-200/50 rounded-2xl">
              <History className="h-6 w-6 text-stone-600" />
            </div>
          </div>
        </Card>
      </div>

      <Card className="border border-stone-100 shadow-sm rounded-[32px] overflow-hidden bg-white">
        <div className="p-6 border-b border-stone-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
            <FileClock size={20} className="text-stone-600" />
            {isRTL ? "السجلات القديمة" : "Past Records"}
          </h2>
          <div className="relative w-full sm:w-96">
            <Search className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 text-stone-400`} size={16} />
            <Input 
              placeholder={isRTL ? "ابحث بالاسم أو الهوية..." : "Search by name or ID..."}
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
                <th className={`p-4 font-bold ${isRTL ? "text-right" : "text-left"}`}>{isRTL ? "آخر صف دراسي" : "Last Grade"}</th>
                <th className={`p-4 font-bold ${isRTL ? "text-right" : "text-left"}`}>{isRTL ? "تاريخ الأرشفة" : "Archive Date"}</th>
                <th className={`p-4 font-bold ${isRTL ? "text-right" : "text-left"}`}>{isRTL ? "سبب الأرشفة" : "Reason"}</th>
                <th className={`p-4 font-bold text-center`}>{isRTL ? "إجراء" : "Action"}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-stone-400 font-medium">
                    {isRTL ? "لا توجد سجلات مؤرشفة." : "No archived records."}
                  </td>
                </tr>
              ) : (
                filtered.map((student) => (
                  <tr key={student.id} className="border-b border-stone-50 hover:bg-stone-50/50 transition-colors">
                    <td className={`p-4 font-bold text-stone-800 ${isRTL ? "text-right" : "text-left"}`}>
                      <div className="flex flex-col">
                        <span>{student.name}</span>
                        <span className="text-xs text-stone-400 num-en font-normal">{student.id}</span>
                      </div>
                    </td>
                    <td className={`p-4 text-stone-500 font-medium ${isRTL ? "text-right" : "text-left"}`}>
                      {student.grade}
                    </td>
                    <td className={`p-4 font-black text-stone-600 num-en ${isRTL ? "text-right" : "text-left"}`}>
                      {student.date}
                    </td>
                    <td className={`p-4 ${isRTL ? "text-right" : "text-left"}`}>
                      <Badge variant="outline" className="text-stone-600 bg-stone-50 border-stone-200 rounded-md font-bold">
                        {student.reason}
                      </Badge>
                    </td>
                    <td className="p-4 text-center">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="font-bold text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-xl"
                      >
                        <UserMinus size={16} className="mr-2" />
                        {isRTL ? "استعراض السجل" : "View Record"}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
