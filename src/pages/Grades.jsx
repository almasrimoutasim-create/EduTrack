import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/dbClient";
import { 
  Award, 
  Search, 
  Filter, 
  Trash2, 
  Plus, 
  Download, 
  TrendingUp, 
  CheckCircle2, 
  Users, 
  BookOpen,
  Calendar,
  AlertCircle
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/lib/LanguageContext";
import PageHeader from "@/components/shared/PageHeader";
import { toast } from "sonner";

export default function Grades() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const qc = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [termFilter, setTermFilter] = useState("all");
  
  // Dialog state for adding a grade directly by admin
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [assessmentName, setAssessmentName] = useState("");
  const [term, setTerm] = useState("Term 1");
  const [score, setScore] = useState("");
  const [maxScore, setMaxScore] = useState(100);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Queries
  const { data: allGrades = [], isLoading } = useQuery({
    queryKey: ["admin-all-grades"],
    queryFn: () => entities.StudentGrade.list("-created_at", 100)
  });

  const { data: students = [] } = useQuery({
    queryKey: ["admin-all-students-grades"],
    queryFn: () => entities.Student.list()
  });

  // Extract unique subjects for filter
  const uniqueSubjects = React.useMemo(() => {
    const subs = allGrades.map(g => {
      // Split to get main subject name if it contains assessment name
      return g.subject_name ? g.subject_name.split(" - ")[0] : "";
    }).filter(Boolean);
    return ["all", ...new Set(subs)];
  }, [allGrades]);

  // Filtered list
  const filteredGrades = React.useMemo(() => {
    return allGrades.filter(g => {
      const matchesSearch = 
        (g.student_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (g.student_id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (g.teacher_name || "").toLowerCase().includes(searchTerm.toLowerCase());
      
      const mainSubject = g.subject_name ? g.subject_name.split(" - ")[0] : "";
      const matchesSubject = subjectFilter === "all" || mainSubject === subjectFilter;
      const matchesTerm = termFilter === "all" || g.term === termFilter;

      return matchesSearch && matchesSubject && matchesTerm;
    });
  }, [allGrades, searchTerm, subjectFilter, termFilter]);

  // Calculations
  const stats = React.useMemo(() => {
    if (filteredGrades.length === 0) return { avg: 0, passRate: 0, count: 0 };
    
    let totalPct = 0;
    let passCount = 0;
    
    filteredGrades.forEach(g => {
      const max = g.max_score || 100;
      const pct = (g.score / max) * 100;
      totalPct += pct;
      if (pct >= 50) passCount++;
    });

    const avg = Math.round(totalPct / filteredGrades.length);
    const passRate = Math.round((passCount / filteredGrades.length) * 100);
    
    return {
      avg,
      passRate,
      count: filteredGrades.length
    };
  }, [filteredGrades]);

  const handleDelete = async (id) => {
    if (!window.confirm(isRTL ? "هل أنت متأكد من حذف هذه الدرجة نهائياً؟" : "Are you sure you want to delete this grade permanently?")) {
      return;
    }
    try {
      await entities.StudentGrade.delete(id);
      toast.success(isRTL ? "تم حذف الدرجة بنجاح" : "Grade deleted successfully");
      qc.invalidateQueries({ queryKey: ["admin-all-grades"] });
    } catch (err) {
      console.error(err);
      toast.error(isRTL ? "فشل حذف الدرجة" : "Failed to delete grade");
    }
  };

  const handleAddGrade = async (e) => {
    e.preventDefault();
    if (!selectedStudentId || !subjectName || !assessmentName || !score) {
      toast.error(isRTL ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill all required fields");
      return;
    }

    const studentObj = students.find(s => s.id === selectedStudentId);
    if (!studentObj) return;

    setIsSaving(true);
    try {
      const numericScore = parseFloat(score);
      const maxScoreNum = Number(maxScore);
      const percentage = Math.round((numericScore / maxScoreNum) * 100);
      let label = `${percentage}%`;
      if (percentage >= 90) label = "A+";
      else if (percentage >= 80) label = "A";
      else if (percentage >= 70) label = "B";
      else if (percentage >= 60) label = "C";
      else if (percentage >= 50) label = "D";
      else label = "F";

      await entities.StudentGrade.create({
        student_id: studentObj.student_id || studentObj.id,
        student_name: studentObj.full_name || studentObj.name,
        subject_name: `${subjectName} - ${assessmentName}`,
        score: numericScore,
        max_score: maxScoreNum,
        grade_label: label,
        term: term,
        academic_year: "2025-2026",
        teacher_name: isRTL ? "مدير النظام" : "System Administrator",
        notes: notes
      });

      toast.success(isRTL ? "تم رصد الدرجة بنجاح!" : "Grade added successfully!");
      setAddDialogOpen(false);
      
      // Reset form
      setSelectedStudentId("");
      setSubjectName("");
      setAssessmentName("");
      setScore("");
      setNotes("");

      qc.invalidateQueries({ queryKey: ["admin-all-grades"] });
    } catch (err) {
      console.error(err);
      toast.error(isRTL ? "فشل رصد الدرجة" : "Failed to add grade");
    } finally {
      setIsSaving(false);
    }
  };

  const downloadReport = () => {
    const rows = [["Student Name", "Student ID", "Subject / Exam", "Term", "Score", "Max Score", "Percentage", "Grade", "Teacher", "Notes"]];
    filteredGrades.forEach(g => {
      const pct = Math.round((g.score / (g.max_score || 100)) * 100);
      rows.push([
        g.student_name,
        g.student_id,
        g.subject_name,
        g.term,
        g.score,
        g.max_score || 100,
        pct + "%",
        g.grade_label || "",
        g.teacher_name,
        g.notes || ""
      ]);
    });
    const csv = rows.map(r => r.map(cell => `"${(cell || "").toString().replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8,\uFEFF" + encodeURIComponent(csv);
    a.download = `student_grades_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all border-2 border-stone-200 bg-white text-stone-800 hover:bg-stone-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
  const btnPrimary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="space-y-6 pb-20" dir={isRTL ? "rtl" : "ltr"}>
      <PageHeader 
        title={isRTL ? "لوحة التحكم بالدرجات والنتائج" : "Academic Grades & Results"} 
        subtitle={isRTL ? "عرض، تعديل ورصد درجات جميع طلاب المدرسة للتقارير الدورية." : "View, manage and post student grades across all grades and semesters."}
      >
        <div className="flex gap-3">
          <button onClick={downloadReport} className={`${btnOutline} rounded-xl h-11 px-5`}>
            <Download size={18} />
            <span>{isRTL ? "تصدير التقرير" : "Export Report"}</span>
          </button>
          <button onClick={() => setAddDialogOpen(true)} className={`${btnPrimary} h-11 px-5`}>
            <Plus size={18} />
            <span>{isRTL ? "رصد درجة جديدة" : "Post New Grade"}</span>
          </button>
        </div>
      </PageHeader>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-white border border-stone-200/80 shadow-sm rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "متوسط المدرسة الأكاديمي" : "School Average GPA"}</p>
            <h4 className="text-3xl font-black text-primary mt-2 num-en">{stats.avg}%</h4>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
        </Card>

        <Card className="p-6 bg-white border border-stone-200/80 shadow-sm rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "نسبة النجاح العامة" : "General Pass Rate"}</p>
            <h4 className="text-3xl font-black text-emerald-600 mt-2 num-en">{stats.passRate}%</h4>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
        </Card>

        <Card className="p-6 bg-white border border-stone-200/80 shadow-sm rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "إجمالي الاختبارات المرصودة" : "Total Graded Assessments"}</p>
            <h4 className="text-3xl font-black text-stone-800 mt-2 num-en">{stats.count}</h4>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-stone-50 text-stone-550 flex items-center justify-center">
            <Users size={24} />
          </div>
        </Card>
      </div>

      {/* Filters and List */}
      <Card className="p-6 bg-white border border-stone-200/80 shadow-sm rounded-2xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-stone-400`} size={16} />
            <Input 
              placeholder={isRTL ? "ابحث باسم الطالب، الرقم التعريفي، أو اسم المعلم..." : "Search by student name, ID or teacher..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} bg-stone-50/50 border-stone-200 rounded-xl h-11 text-xs`}
            />
          </div>

          <div className="flex flex-col gap-1">
            <select 
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-xl h-11 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
              dir={isRTL ? "rtl" : "ltr"}
            >
              <option value="all">{isRTL ? "جميع المواد" : "All Subjects"}</option>
              {uniqueSubjects.filter(s => s !== "all").map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <select 
              value={termFilter}
              onChange={(e) => setTermFilter(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-xl h-11 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
              dir={isRTL ? "rtl" : "ltr"}
            >
              <option value="all">{isRTL ? "جميع الفصول" : "All Terms"}</option>
              <option value="Term 1">{isRTL ? "الفصل الدراسي الأول" : "Term 1"}</option>
              <option value="Term 2">{isRTL ? "الفصل الدراسي الثاني" : "Term 2"}</option>
              <option value="Term 3">{isRTL ? "الفصل الدراسي الثالث" : "Term 3"}</option>
              <option value="Final">{isRTL ? "الامتحان النهائي" : "Final"}</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="w-full py-16 text-center text-stone-500">
            <div className="flex items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900"></div>
              <span>{isRTL ? "جاري تحميل سجلات الدرجات..." : "Loading grades..."}</span>
            </div>
          </div>
        ) : filteredGrades.length === 0 ? (
          <div className="py-16 text-center text-stone-400 border border-dashed border-stone-100 rounded-3xl">
            <Award size={40} className="opacity-20 mx-auto mb-2" />
            <p className="font-bold text-base">{isRTL ? "لا توجد سجلات درجات تطابق معايير البحث" : "No grades found matching filters"}</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-stone-100">
            <Table>
              <TableHeader className="bg-stone-50/50">
                <TableRow>
                  <TableHead className="w-[60px] text-center">#</TableHead>
                  <TableHead>{isRTL ? "الطالب" : "Student"}</TableHead>
                  <TableHead>{isRTL ? "الرقم المدرسي" : "Student ID"}</TableHead>
                  <TableHead>{isRTL ? "المادة والتقييم" : "Subject & Test"}</TableHead>
                  <TableHead className="text-center">{isRTL ? "الفترة" : "Term"}</TableHead>
                  <TableHead className="text-center">{isRTL ? "الدرجة" : "Score"}</TableHead>
                  <TableHead className="text-center">{isRTL ? "التقدير" : "Grade"}</TableHead>
                  <TableHead>{isRTL ? "المعلم الراصد" : "Graded By"}</TableHead>
                  <TableHead className="text-center w-[100px]">{isRTL ? "الإجراءات" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGrades.map((g, idx) => {
                  const pct = Math.round((g.score / (g.max_score || 100)) * 100);
                  return (
                    <TableRow key={g.id} className="hover:bg-stone-50/30 transition-colors">
                      <TableCell className="text-center text-stone-400 font-mono text-xs">{idx + 1}</TableCell>
                      <TableCell className="font-bold text-stone-850 text-xs">{g.student_name}</TableCell>
                      <TableCell className="font-mono text-stone-550 text-xs">#{g.student_id}</TableCell>
                      <TableCell className="text-xs font-semibold text-stone-700">
                        {g.subject_name}
                      </TableCell>
                      <TableCell className="text-center text-xs text-stone-500">{g.term}</TableCell>
                      <TableCell className="text-center font-bold font-mono text-stone-800 text-xs num-en">
                        {g.score} / {g.max_score || 100}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={`${
                          pct >= 85 ? "bg-emerald-50 text-emerald-600" :
                          pct >= 70 ? "bg-blue-50 text-blue-600" :
                          pct >= 50 ? "bg-amber-50 text-amber-600" :
                          "bg-rose-50 text-rose-600"
                        } border-none font-black text-[10px] rounded-lg`}>
                          {g.grade_label || `${pct}%`}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-stone-600 font-semibold">{g.teacher_name}</TableCell>
                      <TableCell className="text-center">
                        <button 
                          onClick={() => handleDelete(g.id)}
                          className="h-8 w-8 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors flex items-center justify-center mx-auto cursor-pointer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Add Grade Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader className="">
            <DialogTitle className="font-serif font-black text-xl text-stone-900 flex items-center gap-2 mb-2">
              <Award className="text-primary h-5 w-5" />
              {isRTL ? "رصد درجة طالب جديدة" : "Post New Student Grade"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddGrade} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "اختر الطالب *" : "Select Student *"}</label>
              <select 
                required
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="bg-stone-50 border border-stone-200 rounded-xl h-11 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
                dir={isRTL ? "rtl" : "ltr"}
              >
                <option value="">{isRTL ? "-- اختر الطالب --" : "-- Select student --"}</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.full_name || s.name} (#{s.student_id}) - {isRTL ? "الصف" : "Grade"} {s.grade}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "المادة الدراسية *" : "Subject Name *"}</label>
              <Input 
                required
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                placeholder={isRTL ? "مثال: الرياضيات، اللغة الإنجليزية" : "e.g., Mathematics, English"}
                className="h-11 rounded-xl border-stone-200 font-semibold bg-stone-50 text-xs"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "اسم التقييم / الاختبار *" : "Test / Quiz Title *"}</label>
              <Input 
                required
                value={assessmentName}
                onChange={(e) => setAssessmentName(e.target.value)}
                placeholder={isRTL ? "مثال: اختبار قصير 1، امتحان نصفي" : "e.g., Quiz 1, Midterm"}
                className="h-11 rounded-xl border-stone-200 font-semibold bg-stone-50 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "الدرجة المرصودة *" : "Score *"}</label>
                <Input 
                  required
                  type="number"
                  min="0"
                  max={maxScore}
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  className="h-11 rounded-xl border-stone-200 font-semibold bg-stone-50 text-xs num-en"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "الدرجة العظمى *" : "Max Score *"}</label>
                <Input 
                  required
                  type="number"
                  value={maxScore}
                  onChange={(e) => setMaxScore(Number(e.target.value) || 100)}
                  className="h-11 rounded-xl border-stone-200 font-semibold bg-stone-50 text-xs num-en"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "الفترة / الفصل الدراسي *" : "Term *"}</label>
              <select 
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                className="bg-stone-50 border border-stone-200 rounded-xl h-11 px-3 text-xs font-semibold focus:outline-none"
                dir={isRTL ? "rtl" : "ltr"}
              >
                <option value="Term 1">{isRTL ? "الفصل الدراسي الأول" : "Term 1"}</option>
                <option value="Term 2">{isRTL ? "الفصل الدراسي الثاني" : "Term 2"}</option>
                <option value="Term 3">{isRTL ? "الفصل الدراسي الثالث" : "Term 3"}</option>
                <option value="Final">{isRTL ? "الامتحان النهائي" : "Final"}</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "ملاحظات وتوصيات المعلم" : "Teacher Notes"}</label>
              <Input 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={isRTL ? "ملاحظات إضافية حول الأداء..." : "Additional performance remarks..."}
                className="h-11 rounded-xl border-stone-200 font-semibold bg-stone-50 text-xs"
              />
            </div>

            <button 
              type="submit"
              disabled={isSaving}
              className={`${btnPrimary} w-full h-12 mt-2 shadow-md`}
            >
              {isSaving ? (isRTL ? "جاري رصد الدرجة..." : "Saving Grade...") : (isRTL ? "تأكيد ورصد الدرجة" : "Post Grade")}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
