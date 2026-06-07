import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  Edit3,
  Check,
  X
} from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import PageHeader from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import StudentFormDialog from "@/components/students/StudentFormDialog";
import { 
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all border-2 border-stone-200 bg-white text-stone-800 hover:bg-stone-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const btnPrimary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed";

export default function StudentDirectory() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const qc = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [activeTab, setActiveTab] = useState("directory"); // "directory" | "requests"

  const { data: linkRequests = [], refetch: refetchRequests } = useQuery({
    queryKey: ["parent-link-requests"],
    // @ts-ignore
    queryFn: () => base44.entities.ParentLinkRequest.list("-created_at")
  });

  const pendingRequestsCount = linkRequests.filter(r => r.status === "pending").length;

  const handleApproveLink = async (request) => {
    try {
      // @ts-ignore
      const matchedStudents = await base44.entities.Student.list("-created_at", { student_id: request.student_id });
      if (matchedStudents.length === 0) {
        toast.error(isRTL ? "الطالب المستهدف غير موجود في النظام." : "Target student not found in system.");
        return;
      }
      const student = matchedStudents[0];
      const updatePayload = {
        parent_email: request.parent_email,
        parent_name: request.parent_name
      };
      if (!student.parent_password) {
        updatePayload.parent_password = "Parent123";
      }
      await base44.entities.Student.update(student.id, updatePayload);
      await base44.entities.ParentLinkRequest.update(request.id, { status: "approved" });
      qc.invalidateQueries({ queryKey: ["student-directory-list"] });
      qc.invalidateQueries({ queryKey: ["parent-link-requests"] });
      refetchRequests();
      toast.success(isRTL ? "تمت الموافقة على ربط ولي الأمر بالطالب بنجاح!" : "Parent-student link approved successfully!");
    } catch (err) {
      console.error(err);
      toast.error(isRTL ? "فشل الموافقة على الطلب." : "Failed to approve request.");
    }
  };

  const handleRejectLink = async (requestId) => {
    try {
      await base44.entities.ParentLinkRequest.update(requestId, { status: "rejected" });
      qc.invalidateQueries({ queryKey: ["parent-link-requests"] });
      refetchRequests();
      toast.info(isRTL ? "تم رفض طلب الربط." : "Link request rejected.");
    } catch (err) {
      console.error(err);
      toast.error(isRTL ? "فشل رفض الطلب." : "Failed to reject request.");
    }
  };

  const { data: students = [], isLoading } = useQuery({ 
    queryKey: ["student-directory-list"], 
    queryFn: () => base44.entities.Student.list("-created_date", 100) 
  });

  const filteredStudents = students.filter(s =>
    (s.full_name || s.name || "")?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.student_id || "")?.includes(searchTerm) ||
    (s.grade || "")?.includes(searchTerm)
  );

  const handleAdd = () => {
    setSelectedStudent(null);
    setDialogOpen(true);
  };

  const handleEdit = (student) => {
    setSelectedStudent(student);
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(isRTL ? "هل أنت متأكد من حذف هذا الطالب نهائياً؟" : "Are you sure you want to delete this student permanently?")) return;
    try {
      await base44.entities.Student.delete(id);
      qc.invalidateQueries({ queryKey: ["student-directory-list"] });
      qc.invalidateQueries({ queryKey: ["students"] });
      toast.success(isRTL ? "تم حذف الطالب بنجاح" : "Student deleted successfully");
    } catch (err) {
      toast.error(isRTL ? "فشل حذف الطالب" : "Failed to delete student");
    }
  };

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
          <button onClick={handleAdd} className={`${btnPrimary} h-11 px-5`}>
            <UserPlus size={18} />
            <span>{isRTL ? "إضافة طالب جديد" : "Add Student"}</span>
          </button>
        </div>
      </PageHeader>

      {/* Tab Selection */}
      <div className="flex gap-2 p-1 bg-stone-100 rounded-xl w-fit border border-stone-200/50">
        <button
          onClick={() => setActiveTab("directory")}
          className={`px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === "directory"
              ? "bg-white text-stone-900 shadow-sm font-extrabold"
              : "text-stone-500 hover:text-stone-850"
          }`}
        >
          {isRTL ? "دليل الطلاب" : "Student Directory"}
        </button>
        <button
          onClick={() => setActiveTab("requests")}
          className={`px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "requests"
              ? "bg-white text-stone-900 shadow-sm font-extrabold"
              : "text-stone-500 hover:text-stone-850"
          }`}
        >
          <span>{isRTL ? "طلبات ربط أولياء الأمور" : "Parent Link Requests"}</span>
          {pendingRequestsCount > 0 && (
            <span className="h-5 min-w-[20px] px-1.5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">
              {pendingRequestsCount}
            </span>
          )}
        </button>
      </div>

      {activeTab === "directory" ? (
        <>
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
                    <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-wide text-start">{isRTL ? "اسم الطالب" : "Student Name"}</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-wide text-start">{isRTL ? "الرقم الجامعي" : "Student ID"}</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-wide text-start">{isRTL ? "الصف" : "Grade"}</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-wide text-start">{isRTL ? "حالة الملف" : "Status"}</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-wide text-end">{isRTL ? "الإجراءات" : "Actions"}</th>
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
                  ) : filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-stone-50/30 transition-colors group">
                      <td className="px-6 py-4 text-center">
                        <Checkbox className="rounded-md" />
                      </td>
                      <td className="px-6 py-4 text-start">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-stone-100 flex items-center justify-center font-bold text-stone-400 group-hover:bg-primary group-hover:text-white transition-all">
                            {(student.full_name || student.name)?.[0]}
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-stone-900 block group-hover:text-primary transition-colors">{student.full_name || student.name}</span>
                            <span className="text-[10px] font-semibold text-stone-400 uppercase">{student.parent_email || 'student@edu.ae'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-stone-600 num-en text-start">{student.student_id || student.id}</td>
                      <td className="px-6 py-4 text-start">
                        <Badge className="bg-stone-50 text-stone-600 border-none rounded-lg text-[9px] font-bold px-2 py-0.5 num-en">
                          {isRTL ? `الصف ${student.grade || '10'}` : `Grade ${student.grade || '10'}`}-{student.section || 'A'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-start">
                        <div className="flex items-center gap-2">
                          <div className={`h-1.5 w-1.5 rounded-full ${student.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <span className="text-[10px] font-bold text-stone-500 uppercase">
                            {student.status === 'active' ? (isRTL ? "نشط" : "Active") : (isRTL ? "موقف" : "Suspended")}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-end">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleEdit(student)} className={`${btnOutline} rounded-lg gap-1 text-xs h-8 px-3`}>
                            <Edit3 size={14} />
                            <span>{isRTL ? "تعديل" : "Edit"}</span>
                          </button>
                          <button onClick={() => handleDelete(student.id)} className={`${btnOutline} rounded-lg gap-1 text-xs h-8 px-3 border-rose-200 hover:bg-rose-50 hover:text-rose-600`}>
                            <Trash2 size={14} />
                            <span>{isRTL ? "حذف" : "Delete"}</span>
                          </button>
                          <button className={`${btnOutline} rounded-lg gap-1 text-xs h-8 px-3`}>
                            <MoreVertical size={14} />
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
        </>
      ) : (
        /* Parent Link Requests Tab */
        <Card className="p-8 border shadow-sm bg-white rounded-[40px] space-y-6">
          <div>
            <h3 className="font-serif text-2xl font-bold text-stone-900">{isRTL ? "طلبات ربط أولياء الأمور المعلقة" : "Parent-Student Linking Requests"}</h3>
            <p className="text-stone-400 text-xs mt-1">
              {isRTL ? "مراجعة واعتماد طلبات ربط أولياء الأمور بالطلاب يدوياً بعد التحقق من البيانات." : "Review and approve parent-student manual link requests after verification."}
            </p>
          </div>

          {linkRequests.length === 0 ? (
            <div className="py-12 text-center text-stone-400">
              <p className="font-bold text-lg">{isRTL ? "لا توجد طلبات ربط مسجلة" : "No linking requests found"}</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-stone-200 shadow-sm">
              <Table>
                <TableHeader className="bg-stone-50">
                  <TableRow>
                    <TableHead className="w-[50px] num-en">#</TableHead>
                    <TableHead>{isRTL ? "ولي الأمر" : "Parent Details"}</TableHead>
                    <TableHead>{isRTL ? "الطالب المستهدف" : "Target Student"}</TableHead>
                    <TableHead>{isRTL ? "العلاقة" : "Relationship"}</TableHead>
                    <TableHead>{isRTL ? "تاريخ الطلب" : "Submitted Date"}</TableHead>
                    <TableHead className="text-center">{isRTL ? "الحالة" : "Status"}</TableHead>
                    <TableHead className={isRTL ? "text-left" : "text-right"}>{isRTL ? "الإجراءات" : "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {linkRequests.map((req, idx) => (
                    <TableRow key={req.id || idx} className="hover:bg-stone-50/50">
                      <TableCell className="font-medium text-stone-500 num-en">{idx + 1}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-bold text-stone-900">{req.parent_name}</p>
                          <p className="text-xs text-stone-400 font-medium num-en">{req.parent_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-bold text-stone-900">{req.student_name}</p>
                          <p className="text-xs text-stone-400 font-medium num-en">ID: #{req.student_id}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-semibold text-stone-700">
                          {req.relationship === "father" ? (isRTL ? "أب" : "Father") :
                           req.relationship === "mother" ? (isRTL ? "أم" : "Mother") :
                           (isRTL ? "ولي أمر / وصي" : "Guardian")}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-stone-400 font-bold num-en">
                        {req.created_at ? new Date(req.created_at).toLocaleDateString(isRTL ? "ar-EG" : "en-US") : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={`border-none rounded-lg font-bold ${
                          req.status === "pending" ? "bg-amber-50 text-amber-600" :
                          req.status === "approved" ? "bg-emerald-50 text-emerald-600" :
                          "bg-rose-50 text-rose-600"
                        }`}>
                          {req.status === "pending" ? (isRTL ? "قيد الانتظار" : "Pending") :
                           req.status === "approved" ? (isRTL ? "مقبول" : "Approved") :
                           (isRTL ? "مرفوض" : "Rejected")}
                        </Badge>
                      </TableCell>
                      <TableCell className={isRTL ? "text-left" : "text-right"}>
                        {req.status === "pending" ? (
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleApproveLink(req)}
                              className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center shadow-inner cursor-pointer"
                              title={isRTL ? "موافقة" : "Approve"}
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={() => handleRejectLink(req.id)}
                              className="h-9 w-9 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center shadow-inner cursor-pointer"
                              title={isRTL ? "رفض" : "Reject"}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-stone-400">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      )}
      <StudentFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} student={selectedStudent} />
    </div>
  );
}
