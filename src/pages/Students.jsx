import React, { useEffect, useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/dbClient";
import { useSearchParams } from "react-router-dom";
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  MoreVertical, 
  Mail, 
  Phone,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Trash2,
  Printer,
  FileText,
  Check,
  X
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/translations";
import PageHeader from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { 
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import StudentForm from "@/components/students/StudentForm.jsx";
import AdminStudentProfile from "@/components/students/AdminStudentProfile.jsx";
import { AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all border-2 border-stone-300 bg-white text-stone-800 hover:bg-stone-50 hover:border-stone-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const btnPrimary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed";

export default function Students() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedSection, setSelectedSection] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [refreshKey, setRefreshKey] = useState(0);
  const [view, setView] = useState("list"); // "list" | "add" | "edit" | "profile"
  const [dialogStudent, setDialogStudent] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (searchParams.get("add") === "true") {
      setDialogStudent(null);
      setView("add");
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("add");
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const [activeAdminTab, setActiveAdminTab] = useState("directory"); // "directory" | "requests"
  const [printDialogOpen, setPrintDialogOpen] = useState(false);

  const { data: linkRequests = [], refetch: refetchRequests } = useQuery({
    queryKey: ["parent-link-requests"],
    // @ts-ignore
    queryFn: () => entities.ParentLinkRequest.list("-created_at", 100),
    staleTime: 1000 * 60 * 5
  });

  const pendingRequestsCount = linkRequests.filter(r => r.status === "pending").length;

  const handleApproveLink = async (request) => {
    try {
      // Find target student by student_id
      // @ts-ignore
      const matchedStudents = await entities.Student.list("-created_at", { student_id: request.student_id });
      if (matchedStudents.length === 0) {
        toast.error(isRTL ? "الطالب المستهدف غير موجود في النظام." : "Target student not found in system.");
        return;
      }
      
      const student = matchedStudents[0];

      // Update Student's parent contact info and login email
      const updatePayload = {
        parent_email: request.parent_email,
        parent_name: request.parent_name
      };

      // Set default parent password if empty
      if (!student.parent_password) {
        updatePayload.parent_password = "Parent123";
      }

      await entities.Student.update(student.id, updatePayload);

      // Approve request in database
      await entities.ParentLinkRequest.update(request.id, { status: "approved" });

      // Refresh queries
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["parent-link-requests"] });
      refetchRequests();

      toast.success(isRTL ? "تمت الموافقة على ربط ولي الأمر بالطالب بنجاح!" : "Parent-student link approved successfully!");
    } catch (err) {
      console.error(err);
      toast.error(isRTL ? "فشل الموافقة على الطلب." : "Failed to approve request.");
    }
  };

  const handleRejectLink = async (requestId) => {
    try {
      await entities.ParentLinkRequest.update(requestId, { status: "rejected" });
      queryClient.invalidateQueries({ queryKey: ["parent-link-requests"] });
      refetchRequests();
      toast.info(isRTL ? "تم رفض طلب الربط." : "Link request rejected.");
    } catch (err) {
      console.error(err);
      toast.error(isRTL ? "فشل رفض الطلب." : "Failed to reject request.");
    }
  };

  const { data: students = [], isLoading, refetch } = useQuery({ 
    queryKey: ["students", refreshKey], 
    queryFn: () => entities.Student.list("-created_at", 500),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    gcTime: 1000 * 60 * 15 // Keep in garbage collection for 15 minutes
  });

  const sectionOptions = useMemo(() => {
    const sections = Array.from(new Set(students.map(s => s.section || "Unknown")));
    return sections.sort((a, b) => a.localeCompare(b));
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = (student.full_name || student.name)?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           student.id?.toString().includes(searchTerm) ||
                           student.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGrade = selectedGrade === "all" || student.grade?.toString() === selectedGrade;
      const matchesStatus = selectedStatus === "all" || student.status === selectedStatus;
      const studentSection = student.section || "Unknown";
      const matchesSection = selectedSection === "all" || studentSection === selectedSection;
      return matchesSearch && matchesGrade && matchesStatus && matchesSection;
    });
  }, [students, searchTerm, selectedGrade, selectedStatus, selectedSection]);

  const totalPages = Math.ceil(filteredStudents.length / rowsPerPage);
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredStudents.slice(start, start + rowsPerPage);
  }, [filteredStudents, currentPage, rowsPerPage]);

  const groupedStudents = useMemo(() => {
    return paginatedStudents.reduce((acc, student) => {
      const sectionLabel = student.section || t("students.section", language);
      const groupKey = `${t("students.grade", language)} ${student.grade} • ${t("students.section", language)} ${sectionLabel}`;
      if (!acc[groupKey]) acc[groupKey] = [];
      acc[groupKey].push(student);
      return acc;
    }, {});
  }, [paginatedStudents, language]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const handleRefresh = () => {
    setRefreshKey(k => k + 1);
    refetch();
  };

  const handlePrint = (gradeFilter) => {
    const targetStudents = gradeFilter === "all"
      ? students
      : students.filter(s => s.grade === gradeFilter);

    if (targetStudents.length === 0) {
      toast.error("لا يوجد طلاب في هذا الصف");
      return;
    }

    const gradeLabel = gradeFilter === "all"
      ? "جميع الصفوف"
      : `الصف ${gradeFilter}`;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>سجل الطلاب — ${gradeLabel}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 40px; direction: rtl; text-align: right; color: #1c1917; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #1c1917; padding-bottom: 16px; margin-bottom: 24px; }
            h1 { font-family: serif; font-size: 22px; margin: 0; }
            .meta { font-size: 12px; color: #78716c; margin-top: 4px; }
            .stats { display: flex; gap: 24px; margin-bottom: 24px; }
            .stat-box { background: #f5f5f4; padding: 12px 20px; border-radius: 12px; text-align: center; }
            .stat-val { font-size: 22px; font-weight: 900; color: #1c1917; }
            .stat-lbl { font-size: 11px; color: #78716c; font-weight: 600; text-transform: uppercase; }
            table { width: 100%; border-collapse: collapse; }
            th { background: #1c1917; color: #fff; padding: 10px 14px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
            td { padding: 10px 14px; font-size: 13px; font-weight: 600; border-bottom: 1px solid #f5f5f4; }
            tr:nth-child(even) td { background: #fafaf9; }
            .badge-active { background: #d1fae5; color: #065f46; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; }
            .badge-inactive { background: #f3f4f6; color: #6b7280; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; }
            .footer { margin-top: 40px; font-size: 11px; color: #a8a29e; text-align: center; border-top: 1px solid #f5f5f4; padding-top: 16px; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>سجل الطلاب — ${gradeLabel}</h1>
              <p class="meta">النظام الأكاديمي EduTrack | السنة الدراسية 2025-2026</p>
            </div>
            <div style="text-align:left">
              <p class="meta">تاريخ الإصدار: ${new Date().toLocaleDateString('ar-EG')}</p>
              <p class="meta">إجمالي الطلاب: ${targetStudents.length}</p>
            </div>
          </div>

          <div class="stats">
            <div class="stat-box">
              <div class="stat-val">${targetStudents.length}</div>
              <div class="stat-lbl">إجمالي الطلاب</div>
            </div>
            <div class="stat-box">
              <div class="stat-val">${targetStudents.filter(s => s.status === 'active' || !s.status).length}</div>
              <div class="stat-lbl">طلاب نشطون</div>
            </div>
            <div class="stat-box">
              <div class="stat-val">${[...new Set(targetStudents.map(s => s.grade).filter(Boolean))].length}</div>
              <div class="stat-lbl">صفوف</div>
            </div>
            ${gradeFilter === "all" ? `
            <div class="stat-box">
              <div class="stat-val">${[...new Set(targetStudents.map(s => s.grade).filter(Boolean))].join(' / ')}</div>
              <div class="stat-lbl">الصفوف المشمولة</div>
            </div>` : ''}
          </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>رقم الطالب</th>
                <th>الاسم الكامل</th>
                <th>الصف</th>
                <th>الفصل</th>
                <th>البريد الإلكتروني</th>
                <th>الهاتف</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              ${targetStudents.map((s, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${s.student_id || s.id || '—'}</td>
                  <td>${s.full_name || s.name || '—'}</td>
                  <td>${s.grade ? `الصف ${s.grade}` : '—'}</td>
                  <td>${s.section || '—'}</td>
                  <td>${s.email || s.user_email || '—'}</td>
                  <td>${s.phone || s.parent_phone || '—'}</td>
                  <td>
                    <span class="${s.status === 'inactive' ? 'badge-inactive' : 'badge-active'}">
                      ${s.status === 'inactive' ? 'غير نشط' : 'نشط'}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            EduTrack — نظام إدارة المدرسة © ${new Date().getFullYear()} | 
            تم إنشاء هذا التقرير تلقائياً بتاريخ ${new Date().toLocaleString('ar-EG')}
          </div>

          <script>
            window.onload = function() { window.print(); window.close(); }
          <\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
    setPrintDialogOpen(false);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedGrade("all");
    setSelectedStatus("all");
    setSelectedSection("all");
    setCurrentPage(1);
  };

  const handleAddStudent = () => {
    setDialogStudent(null);
    setView("add");
  };

  const handleViewProfile = (student) => {
    setDialogStudent(student);
    setView("profile");
  };

  const handleEditFromProfile = (student) => {
    setDialogStudent(student);
    setView("edit");
  };

  const handlePrintProfile = (student) => {
    setDialogStudent(student);
    setView("profile");
    // Trigger print after a short delay so the profile renders first
    setTimeout(() => window.print(), 600);
  };

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm(isRTL ? "هل أنت متأكد من حذف الطالب؟" : "Are you sure you want to delete this student?")) {
      return;
    }
    await entities.Student.delete(studentId);
    queryClient.invalidateQueries({ queryKey: ["students"] });
  };

  const getStatusBadge = (status) => {
    const isActive = status === 'active';
    return (
      <Badge className={`${isActive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-stone-100 text-stone-400'} border-none rounded-lg font-bold`}>
        {isRTL ? (isActive ? 'نشط' : 'غير نشط') : (isActive ? 'Active' : 'Inactive')}
      </Badge>
    );
  };

  return (
    <div className="pb-20" dir={isRTL ? "rtl" : "ltr"}>
      <AnimatePresence mode="wait">
        {view === "profile" ? (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <AdminStudentProfile
              student={dialogStudent}
              onClose={() => { setDialogStudent(null); setView("list"); }}
              onEdit={handleEditFromProfile}
            />
          </motion.div>
        ) : view === "add" || view === "edit" ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <StudentForm
              student={dialogStudent}
              onClose={() => {
                if (dialogStudent) {
                  // If we were editing a student, return to their profile
                  setView("profile");
                } else {
                  // If we were adding a new student, return to list
                  setView("list");
                }
              }}
            />
          </motion.div>
        ) : (
          <motion.div 
            key="list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <PageHeader 
              title={t("students.title", language)} 
              subtitle={t("students.subtitle", language)}
            >
              <div className="flex gap-2">
                <button 
                  onClick={handleRefresh}
                  className={`${btnOutline} h-11 px-4`}
                >
                  <RefreshCw size={16} />
                  <span className="num-en">{t("common.refresh", language) || "Refresh"}</span>
                </button>
                <button
                  onClick={() => setPrintDialogOpen(true)}
                  className={`${btnOutline} h-11 px-5`}
                >
                  <Printer size={18} />
                  <span>طباعة السجل</span>
                </button>
                <button 
                  className={`${btnPrimary} h-11 px-5`}
                  onClick={handleAddStudent}
                >
                  <Plus size={18} />
                  <span>{t("students.addStudent", language)}</span>
                </button>
              </div>
            </PageHeader>

            {/* Tab Selection */}
            <div className="flex gap-2 p-1 bg-stone-100 rounded-xl w-fit border border-stone-200/50">
              <button
                onClick={() => setActiveAdminTab("directory")}
                className={`px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeAdminTab === "directory"
                    ? "bg-white text-stone-900 shadow-sm font-extrabold"
                    : "text-stone-500 hover:text-stone-850"
                }`}
              >
                {isRTL ? "دليل الطلاب" : "Student Directory"}
              </button>
              <button
                onClick={() => setActiveAdminTab("requests")}
                className={`px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeAdminTab === "requests"
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

            {activeAdminTab === "directory" ? (
              <>
                {/* Filters Section */}
                <Card className="p-5 border shadow-sm bg-white">
              <div className="flex flex-col lg:flex-row gap-4 items-end">
                <div className="relative flex-1 w-full">
                  <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-stone-400`} size={18} />
                  <Input 
                    placeholder={t("common.search", language)} 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} bg-white border-stone-200 rounded-xl h-11`}
                    dir={isRTL ? "rtl" : "ltr"}
                  />
                </div>
                <div className="flex flex-col lg:flex-row gap-3 w-full lg:w-auto">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold text-stone-500">{t("students.grade", language)}</Label>
                    <select 
                      value={selectedGrade}
                      onChange={(e) => setSelectedGrade(e.target.value)}
                      aria-label={t("students.grade", language)}
                      className="bg-white border border-stone-200 rounded-xl h-11 px-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
                      dir={isRTL ? "rtl" : "ltr"}
                    >
                      <option value="all">{t("common.all", language) || "All Grades"}</option>
                      {["1","2","3","4","5","6","7","8","9","10","11","12"].map(g => (
                        <option key={g} value={g}>{t("students.grade", language)} <span className="num-en">{g}</span></option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold text-stone-500">{t("common.status", language)}</Label>
                    <select 
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      aria-label={t("common.status", language)}
                      className="bg-white border border-stone-200 rounded-xl h-11 px-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
                      dir={isRTL ? "rtl" : "ltr"}
                    >
                      <option value="all">{t("common.all", language) || "All Status"}</option>
                      <option value="active">{t("common.active", language)}</option>
                      <option value="inactive">{t("common.inactive", language)}</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold text-stone-500">{t("students.section", language)}</Label>
                    <select
                      value={selectedSection}
                      onChange={(e) => setSelectedSection(e.target.value)}
                      aria-label={t("students.section", language)}
                      className="bg-white border border-stone-200 rounded-xl h-11 px-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
                      dir={isRTL ? "rtl" : "ltr"}
                    >
                      <option value="all">{t("common.all", language) || "All Sections"}</option>
                      {sectionOptions.map(section => (
                        <option key={section} value={section}>{section}</option>
                      ))}
                    </select>
                  </div>
                  <button 
                    onClick={clearFilters}
                    className={`${btnOutline} h-11 px-4`}
                    title={t("common.clear", language) || "Clear"}
                  >
                    <Filter size={16} />
                    <span className="hidden sm:inline">{t("common.clear", language) || "Clear"}</span>
                  </button>
                </div>
              </div>
            </Card>

            {/* Results Summary */}
            <div className="flex justify-between items-center text-sm text-stone-600">
              <span>
                {t("common.total", language) || "Total"}: <span className="num-en font-bold">{filteredStudents.length}</span> {t("common.records", language) || "records"}
              </span>
              <select 
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-stone-200 rounded-lg px-2 py-1 text-xs font-semibold"
                dir={isRTL ? "rtl" : "ltr"}
              >
                <option value={10}><span className="num-en">10</span> {t("common.perPage", language) || "per page"}</option>
                <option value={20}><span className="num-en">20</span> {t("common.perPage", language) || "per page"}</option>
                <option value={50}><span className="num-en">50</span> {t("common.perPage", language) || "per page"}</option>
                <option value={100}><span className="num-en">100</span> {t("common.perPage", language) || "per page"}</option>
              </select>
            </div>

            {/* Students Table */}
            <Card className="border shadow-sm bg-white overflow-hidden">
              <div className="space-y-4">
                {isLoading ? (
                  <div className="w-full py-16 text-center text-stone-500">
                    <div className="flex items-center justify-center gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <span>{t("common.loading", language)}</span>
                    </div>
                  </div>
                ) : paginatedStudents.length === 0 ? (
                  <div className="py-12 text-center text-stone-400">
                    <div className="flex flex-col items-center">
                      <div className="h-16 w-16 rounded-full bg-stone-50 flex items-center justify-center mb-3">
                        <Users size={32} className="opacity-20" />
                      </div>
                      <p className="font-bold text-lg">{t("common.noRecords", language)}</p>
                      <p className="text-sm">{t("common.noRecordsHint", language) || "Try changing search criteria"}</p>
                    </div>
                  </div>
                ) : (
                  Object.entries(groupedStudents).map(([groupLabel, studentsInGroup]) => (
                    <div key={groupLabel} className="rounded-xl border border-stone-200 overflow-hidden shadow-sm">
                      <div className="bg-stone-50 px-5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <p className="text-sm font-bold text-stone-900">{groupLabel}</p>
                          <p className="text-xs text-stone-500"><span className="num-en">{studentsInGroup.length}</span> {t("common.records", language)}</p>
                        </div>
                        <div className="text-xs text-stone-500">
                          {t("students.grade", language)} <span className="num-en">{studentsInGroup[0].grade}</span> · {t("students.section", language)} {studentsInGroup[0].section || "-"}
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-b border-stone-200 bg-stone-50/50">
                              <TableHead className="w-[50px] num-en">#</TableHead>
                              <TableHead>{t("students.name", language) || "Name"}</TableHead>
                              <TableHead>{t("students.id", language) || "ID"}</TableHead>
                              <TableHead>{t("students.grade", language)}</TableHead>
                              <TableHead>{t("students.section", language)}</TableHead>
                              <TableHead>{t("common.status", language)}</TableHead>
                              <TableHead>{t("students.contact", language) || "Contact"}</TableHead>
                              <TableHead className={isRTL ? "text-left" : "text-right"}>{t("common.actions", language)}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {studentsInGroup.map((student, index) => (
                              <motion.tr
                                key={student.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.02 }}
                                className="border-b border-stone-100 hover:bg-stone-50/50 transition-colors"
                              >
                                <TableCell className="font-medium text-stone-500 num-en">
                                  {(currentPage - 1) * rowsPerPage + index + 1}
                                </TableCell>
                                <TableCell>
                                  <button
                                    onClick={() => handleViewProfile(student)}
                                    className="flex items-center gap-3 hover:opacity-70 transition-opacity group"
                                  >
                                    {student.photo_url ? (
                                      <div className="h-9 w-9 rounded-lg overflow-hidden border border-stone-200/60 shadow-sm shrink-0 group-hover:ring-2 group-hover:ring-primary/20 transition-all">
                                        <img 
                                          src={student.photo_url} 
                                          alt="" 
                                          className="h-full w-full object-cover" 
                                        />
                                      </div>
                                    ) : (
                                      <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-primary shrink-0 group-hover:ring-2 group-hover:ring-primary/20 transition-all">
                                        <Users size={16} />
                                      </div>
                                    )}
                                    <span className="font-semibold text-stone-900 group-hover:text-primary transition-colors underline-offset-2 group-hover:underline">{student.full_name || student.name}</span>
                                  </button>
                                </TableCell>
                                <TableCell className="font-mono text-stone-600 num-en">#{student.student_id}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="rounded-lg bg-stone-50 border-stone-200 num-en">
                                    {student.grade}
                                  </Badge>
                                </TableCell>
                                <TableCell>{student.section || "-"}</TableCell>
                                <TableCell>{getStatusBadge(student.status)}</TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-xs text-stone-500">
                                      <Mail size={12} className="shrink-0" />
                                      <a 
                                        href={`mailto:${student.user_email}`}
                                        className="truncate max-w-[150px] hover:text-primary hover:underline transition-colors"
                                        title={student.user_email}
                                      >
                                        {student.user_email || '-'}
                                      </a>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-stone-500">
                                      <Phone size={12} className="shrink-0" />
                                      <a 
                                        href={`tel:${student.parent_phone}`}
                                        className="num-en hover:text-primary hover:underline transition-colors"
                                        title={student.parent_phone}
                                      >
                                        {student.parent_phone || '-'}
                                      </a>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className={isRTL ? "text-left" : "text-right"}>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button className={`${btnOutline} h-9 px-3 text-xs`}>
                                        <MoreVertical size={14} />
                                        {t("common.actions", language)}
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align={isRTL ? "start" : "end"} className="rounded-xl">
                                      <DropdownMenuItem className="gap-2 text-sm" onClick={() => handleViewProfile(student)}>
                                        <FileText size={14} className="shrink-0" />
                                        <span>{isRTL ? "عرض الملف الشامل" : "View Full Profile"}</span>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem className="gap-2 text-sm" onClick={() => handlePrintProfile(student)}>
                                        <Printer size={14} className="shrink-0" />
                                        <span>{isRTL ? "طباعة وتصدير PDF" : "Print & Export PDF"}</span>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem className="text-rose-500 gap-2 text-sm" onClick={() => handleDeleteStudent(student.id)}>
                                        <Trash2 size={14} className="shrink-0" />
                                        <span>{t("common.delete", language)}</span>
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </motion.tr>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination */}
              {filteredStudents.length > 0 && (
                <div className="flex items-center justify-between p-4 border-t border-stone-200 bg-stone-50/30">
                  <div className="text-sm text-stone-650">
                    {t("common.page", language) || "Page"} <span className="num-en font-bold">{currentPage}</span> {t("common.of", language) || "of"} <span className="num-en font-bold">{totalPages}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className={`${btnOutline} h-9 px-3`}
                    >
                      {isRTL ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                      <span className="hidden sm:inline">{t("common.back", language)}</span>
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className={`${btnOutline} h-9 px-3`}
                    >
                      <span className="hidden sm:inline">{t("common.next", language) || "التالي"}</span>
                      {isRTL ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                    </button>
                  </div>
                </div>
              )}
            </Card>
          </>
        ) : (
              /* Parent Link Requests Section */
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* PRINT DIALOG */}
      <Dialog open={printDialogOpen} onOpenChange={setPrintDialogOpen}>
        <DialogContent className="max-w-sm rounded-3xl p-6" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold text-stone-900 text-right flex items-center gap-2">
              <Printer size={20} />
              طباعة سجل الطلاب
            </DialogTitle>
            <DialogDescription className="text-right text-xs text-stone-500 mt-1">
              اختر الصف الذي تريد طباعة سجله، أو اطبع جميع الطلاب دفعة واحدة.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-4">
            {/* زر طباعة الكل */}
            <button
              onClick={() => handlePrint("all")}
              className={`${btnPrimary} w-full h-12 rounded-xl`}
            >
              <FileText size={16} />
              <span>طباعة جميع الطلاب ({students.length})</span>
            </button>

            {/* فاصل */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-stone-100" />
              <span className="text-xs text-stone-400 font-semibold">أو اختر صفاً محدداً</span>
              <div className="flex-1 h-px bg-stone-100" />
            </div>

            {/* أزرار الصفوف */}
            <div className="grid grid-cols-3 gap-2">
              {[...new Set(students.map(s => s.grade).filter(Boolean))]
                .sort((a, b) => parseInt(a) - parseInt(b))
                .map(grade => {
                  const count = students.filter(s => s.grade === grade).length;
                  return (
                    <button
                      key={grade}
                      onClick={() => handlePrint(grade)}
                      className={`${btnOutline} flex-col h-16 rounded-xl gap-0.5`}
                    >
                      <span className="font-black text-sm">الصف {grade}</span>
                      <span className="text-[10px] text-stone-400 font-semibold">{count} طالب</span>
                    </button>
                  );
                })}
            </div>

            {/* زر إلغاء */}
            <button
              onClick={() => setPrintDialogOpen(false)}
              className={`${btnOutline} w-full h-11 rounded-xl mt-2`}
            >
              إلغاء
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
