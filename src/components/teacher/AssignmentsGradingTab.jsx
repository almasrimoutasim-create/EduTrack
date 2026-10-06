import React, { useState, useEffect, useMemo } from "react";
import { 
  FileText, Plus, Trash2, CheckCircle2, XCircle, Clock, Clock3, AlertCircle, 
  HelpCircle, Eye, ChevronRight, Save, AlignLeft, CheckSquare, 
  List, Award, Users, BookOpen, Star, RefreshCw, Check, Edit2,
  GraduationCap, Filter, School
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { entities } from "@/api/dbClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const initialAssignments = [];
const mockSubmissions = {};

const getThemeClasses = (subjectName, isPendingAmber) => {
  if (isPendingAmber) {
    return {
      bg: "bg-amber-50 hover:bg-amber-100/70",
      border: "border-amber-200",
      text: "text-amber-800",
      icon: "text-amber-600"
    };
  }

  const name = subjectName || "";
  if (name.includes("عرب") || name.includes("Arabic")) {
    return {
      bg: "bg-amber-50/50 hover:bg-amber-100/50",
      border: "border-amber-200",
      text: "text-amber-800",
      icon: "text-amber-600"
    };
  }
  if (name.includes("علوم") || name.includes("Science")) {
    return {
      bg: "bg-emerald-50/50 hover:bg-emerald-100/50",
      border: "border-emerald-200",
      text: "text-emerald-800",
      icon: "text-emerald-600"
    };
  }
  if (name.includes("رياضيات") || name.includes("Math")) {
    return {
      bg: "bg-blue-50/50 hover:bg-blue-100/50",
      border: "border-blue-200",
      text: "text-blue-800",
      icon: "text-blue-600"
    };
  }
  if (name.includes("انجليز") || name.includes("English") || name.includes("إنجليز")) {
    return {
      bg: "bg-violet-50/50 hover:bg-violet-100/50",
      border: "border-violet-200",
      text: "text-violet-800",
      icon: "text-violet-600"
    };
  }
  return {
    bg: "bg-stone-50/60 hover:bg-stone-100/60",
    border: "border-stone-250",
    text: "text-stone-800",
    icon: "text-stone-600"
  };
};

export default function AssignmentsGradingTab({ 
  isRTL = true, 
  subjects = [], 
  teacherClasses = [], 
  teacherSchedules = [], 
  teacherId = null 
}) {
  const [assignments, setAssignments] = useState(() => {
    try {
      const saved = localStorage.getItem("edu_assignments");
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) ? parsed : initialAssignments;
    } catch (e) {
      console.error("Failed to parse edu_assignments from localStorage", e);
      return initialAssignments;
    }
  });

  const [submissions, setSubmissions] = useState(() => {
    try {
      const saved = localStorage.getItem("edu_submissions");
      const parsed = saved ? JSON.parse(saved) : null;
      return parsed && typeof parsed === "object" ? parsed : mockSubmissions;
    } catch (e) {
      console.error("Failed to parse edu_submissions from localStorage", e);
      return mockSubmissions;
    }
  });

  const [editingAsmId, setEditingAsmId] = useState(null);
  const [previewAsm, setPreviewAsm] = useState(null);

  const handleDeleteAssignment = (id) => {
    if (window.confirm(isRTL ? "هل أنت متأكد من حذف هذا الواجب نهائياً؟" : "Are you sure you want to delete this assignment permanently?")) {
      setAssignments(prev => prev.filter(asm => asm.id !== id));
      setSubmissions(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
      toast.success(isRTL ? "تم حذف الواجب بنجاح" : "Assignment deleted successfully");
    }
  };

  useEffect(() => {
    if (assignments) {
      localStorage.setItem("edu_assignments", JSON.stringify(assignments));
    }
  }, [assignments]);

  useEffect(() => {
    if (submissions) {
      localStorage.setItem("edu_submissions", JSON.stringify(submissions));
    }
  }, [submissions]);

  const [view, setView] = useState("list"); // list, create, grade
  const [selectedAsm, setSelectedAsm] = useState(null);
  const [selectedSub, setSelectedSub] = useState(null);

  // New Form Creator State (Google Forms/Microsoft Forms experience)
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [formDueDate, setFormDueDate] = useState("");
  const [formQuestions, setFormQuestions] = useState(/** @type {any[]} */ ([
    { id: "fq1", type: "mcq", text: "", options: ["خيّار 1"], correctAnswer: "", points: 1 }
  ]));
  // Target class selection state
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [classSelectionError, setClassSelectionError] = useState(false);
  const [filterClassId, setFilterClassId] = useState("all");

  // Extract unique classes and sections taught by the teacher
  const availableClasses = useMemo(() => {
    const list = [];
    const seen = new Set();
    
    // 1. From teacherClasses or subjects
    const source = (teacherClasses && teacherClasses.length > 0) ? teacherClasses : (subjects || []);
    source.forEach(c => {
      const grade = c.grade || c.grade_level;
      const section = c.section || "";
      if (grade) {
        const key = `${grade}-${section}`;
        if (!seen.has(key)) {
          seen.add(key);
          const sectionLabel = section ? (isRTL ? `شعبة ${section}` : `Section ${section}`) : "";
          const gradeLabel = isRTL ? `الصف ${grade}` : `Grade ${grade}`;
          const label = sectionLabel ? `${gradeLabel} - ${sectionLabel}` : gradeLabel;
          list.push({
            id: c.id ? String(c.id) : `cls-${grade}-${section || 'all'}`,
            grade: String(grade),
            section: String(section || ""),
            label,
            subject: c.name || ""
          });
        }
      }
    });

    // 2. From teacherSchedules if any extra
    if (teacherSchedules && teacherSchedules.length > 0) {
      teacherSchedules.forEach(s => {
        const grade = s.grade;
        const section = s.section || "";
        if (grade) {
          const key = `${grade}-${section}`;
          if (!seen.has(key)) {
            seen.add(key);
            const sectionLabel = section ? (isRTL ? `شعبة ${section}` : `Section ${section}`) : "";
            const gradeLabel = isRTL ? `الصف ${grade}` : `Grade ${grade}`;
            const label = sectionLabel ? `${gradeLabel} - ${sectionLabel}` : gradeLabel;
            list.push({
              id: s.id ? String(s.id) : `cls-${grade}-${section || 'all'}`,
              grade: String(grade),
              section: String(section || ""),
              label,
              subject: s.subject_name || ""
            });
          }
        }
      });
    }

    // 3. Fallback standard classes if list is empty
    if (list.length === 0) {
      const defaults = [
        { grade: "4", section: "أ" },
        { grade: "4", section: "ب" },
        { grade: "5", section: "أ" },
        { grade: "5", section: "ب" },
        { grade: "6", section: "أ" },
        { grade: "6", section: "ب" },
      ];
      defaults.forEach(d => {
        list.push({
          id: `cls-${d.grade}-${d.section}`,
          grade: d.grade,
          section: d.section,
          label: isRTL ? `الصف ${d.grade} - شعبة (${d.section})` : `Grade ${d.grade} - Section (${d.section})`,
          subject: ""
        });
      });
    }

    return list;
  }, [teacherClasses, subjects, teacherSchedules, isRTL]);

  const filteredAssignments = useMemo(() => {
    if (filterClassId === "all") return assignments;
    return assignments.filter(asm => {
      if (Array.isArray(asm.target_classes) && asm.target_classes.length > 0) {
        return asm.target_classes.some(c => c.id === filterClassId || `${c.grade}-${c.section}` === filterClassId || c.grade === filterClassId);
      }
      if (asm.class_id && asm.class_id === filterClassId) return true;
      if (asm.grade && String(asm.grade) === filterClassId) return true;
      return true;
    });
  }, [assignments, filterClassId]);

  // Create Assignment Form Actions
  const addQuestion = () => {
    setFormQuestions(prev => [
      ...prev,
      { id: `fq-${Date.now()}-${prev.length + 1}`, type: "mcq", text: "", options: ["خيّار 1"], correctAnswer: "", points: 1 }
    ]);
  };

  const deleteQuestion = (id) => {
    setFormQuestions(prev => prev.filter(q => q.id !== id));
  };

  const updateQuestionText = (id, text) => {
    setFormQuestions(prev => prev.map(q => q.id === id ? { ...q, text } : q));
  };

  const updateQuestionType = (id, type) => {
    setFormQuestions(prev => prev.map(q => {
      if (q.id === id) {
        let defaultCorrect = /** @type {any} */ ("");
        if (type === "checkbox") defaultCorrect = [];
        return { ...q, type, correctAnswer: defaultCorrect, options: type === "mcq" || type === "checkbox" ? ["خيّار 1"] : [] };
      }
      return q;
    }));
  };

  const updateQuestionPoints = (id, points) => {
    setFormQuestions(prev => prev.map(q => q.id === id ? { ...q, points: parseFloat(points) || 0 } : q));
  };

  const addOption = (qId) => {
    setFormQuestions(prev => prev.map(q => {
      if (q.id === qId) {
        return { ...q, options: [...q.options, `خيّار ${q.options.length + 1}`] };
      }
      return q;
    }));
  };

  const updateOptionText = (qId, optIdx, val) => {
    setFormQuestions(prev => prev.map(q => {
      if (q.id === qId) {
        const newOpts = [...q.options];
        newOpts[optIdx] = val;
        return { ...q, options: newOpts };
      }
      return q;
    }));
  };

  const deleteOption = (qId, optIdx) => {
    setFormQuestions(prev => prev.map(q => {
      if (q.id === qId) {
        return { ...q, options: q.options.filter((_, idx) => idx !== optIdx) };
      }
      return q;
    }));
  };

  const handleSaveForm = () => {
    // Determine the subject to save. If formSubject is not selected, try using the first subject from subjects, or fallback to a default subject name.
    let resolvedSubject = formSubject;
    if (!resolvedSubject) {
      if (subjects && subjects.length > 0) {
        resolvedSubject = subjects[0].name;
      } else {
        resolvedSubject = isRTL ? "اللغة العربية" : "Arabic";
      }
    }

    if (!formTitle || !formDueDate) {
      toast.error(isRTL ? "يرجى ملء جميع الحقول الأساسية (العنوان وتاريخ التسليم)" : "Please fill in all basic fields (Title and Due Date)");
      return;
    }

    if (!selectedClasses || selectedClasses.length === 0) {
      setClassSelectionError(true);
      toast.error(isRTL ? "يرجى تحديد الصف / الفصل الدراسي المستهدف للواجب (حقل إلزامي)" : "Please select target class/grade (Required)");
      return;
    }

    const totalPoints = formQuestions.reduce((sum, q) => sum + (q.points || 0), 0);
    const targetClassesData = selectedClasses.map(c => ({
      id: c.id,
      grade: c.grade,
      section: c.section,
      label: c.label
    }));
    const primaryClassId = selectedClasses[0]?.id || null;
    const primaryGradeId = selectedClasses[0]?.grade || null;
    const gradeStr = selectedClasses.map(c => c.grade).filter((v, i, a) => a.indexOf(v) === i).join(", ");
    const sectionStr = selectedClasses.map(c => c.section).filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(", ");

    if (editingAsmId) {
      setAssignments(prev => {
        const safePrev = Array.isArray(prev) ? prev : [];
        return safePrev.map(asm => {
          if (asm.id === editingAsmId) {
            return {
              ...asm,
              title: formTitle,
              description: formDesc,
              subject: resolvedSubject,
              dueDate: formDueDate,
              questionsCount: formQuestions.length,
              points: totalPoints,
              questions: formQuestions,
              target_classes: targetClassesData,
              class_id: primaryClassId,
              grade_id: primaryGradeId,
              grade: gradeStr,
              section: sectionStr
            };
          }
          return asm;
        });
      });

      // Sync update with database
      try {
        entities.TeacherAssignment.update(editingAsmId, {
          title: formTitle,
          description: formDesc,
          subject: resolvedSubject,
          due_date: formDueDate ? new Date(formDueDate).toISOString() : null,
          total_points: totalPoints,
          grade: gradeStr,
          class_id: primaryClassId ? String(primaryClassId) : null,
          grade_id: primaryGradeId ? String(primaryGradeId) : null,
          section: sectionStr,
          target_classes: targetClassesData,
          questions: formQuestions
        }).catch(err => console.warn("Backend update silent fallback:", err));
      } catch (e) {
        console.warn("DB TeacherAssignment sync error:", e);
      }

      toast.success(isRTL ? "تم تحديث الواجب بنجاح!" : "Assignment updated successfully!");
      setEditingAsmId(null);
    } else {
      const newAsm = {
        id: `asm-${Date.now()}`,
        title: formTitle,
        description: formDesc,
        subject: resolvedSubject,
        dueDate: formDueDate,
        questionsCount: formQuestions.length,
        points: totalPoints,
        submissionsCount: 0,
        gradedCount: 0,
        averageScore: 0,
        questions: formQuestions,
        target_classes: targetClassesData,
        class_id: primaryClassId,
        grade_id: primaryGradeId,
        grade: gradeStr,
        section: sectionStr,
        created_at: new Date().toISOString()
      };

      setAssignments(prev => {
        const safePrev = Array.isArray(prev) ? prev : [];
        return [newAsm, ...safePrev];
      });
      setSubmissions(prev => {
        const safePrev = prev && typeof prev === "object" ? prev : {};
        return { ...safePrev, [newAsm.id]: [] };
      });

      // Sync creation with database
      try {
        entities.TeacherAssignment.create({
          teacher_id: teacherId || "00000000-0000-0000-0000-000000000000",
          title: formTitle,
          description: formDesc,
          subject: resolvedSubject,
          due_date: formDueDate ? new Date(formDueDate).toISOString() : null,
          total_points: totalPoints,
          grade: gradeStr,
          class_id: primaryClassId ? String(primaryClassId) : null,
          grade_id: primaryGradeId ? String(primaryGradeId) : null,
          section: sectionStr,
          target_classes: targetClassesData,
          questions: formQuestions,
          status: "active"
        }).catch(err => console.warn("Backend create silent fallback:", err));
      } catch (e) {
        console.warn("DB TeacherAssignment sync error:", e);
      }

      // Post an official announcement to notify students about the new assignment
      try {
        const classTargetNames = targetClassesData.map(c => c.label).join("، ");
        entities.OfficialAnnouncement.create({
          title: isRTL ? `واجب جديد (${classTargetNames}): ${newAsm.title}` : `New Assignment: ${newAsm.title}`,
          content: isRTL 
            ? `قام المعلم بنشر واجب جديد لمادة (${newAsm.subject}) لطلاب (${classTargetNames})، آخر موعد للتسليم هو ${newAsm.dueDate}.` 
            : `The teacher published a new assignment for (${newAsm.subject}) for (${classTargetNames}), due date is ${newAsm.dueDate}.`,
          priority: "high",
          target_audience: "students",
          created_at: new Date().toISOString()
        });
      } catch (err) {
        console.error("Failed to push assignment announcement:", err);
      }

      toast.success(isRTL ? "تم إنشاء ونشر الواجب بنجاح!" : "Assignment created and published successfully!");
    }
    
    // Reset Form
    setFormTitle("");
    setFormDesc("");
    setFormSubject("");
    setFormDueDate("");
    setSelectedClasses([]);
    setClassSelectionError(false);
    setFormQuestions([{ id: "fq1", type: "mcq", text: "", options: ["خيّار 1"], correctAnswer: "", points: 1 }]);
    setView("list");
  };

  // Grade Student Submission Actions
  const handleOpenGrading = (asm) => {
    setSelectedAsm(asm);
    setView("grade");
    setSelectedSub(null);
  };

  const handleSaveStudentGrade = () => {
    if (!selectedSub) return;
    
    // Calculate total score based on all question points
    let finalScore = 0;
    selectedAsm.questions.forEach(q => {
      finalScore += parseFloat(selectedSub.grades[q.id] || 0);
    });

    const updatedSub = {
      ...selectedSub,
      score: finalScore,
      status: "graded"
    };

    // Update submissions state
    setSubmissions(prev => {
      const safePrev = prev && typeof prev === "object" ? prev : {};
      const list = safePrev[selectedAsm.id] || [];
      return {
        ...safePrev,
        [selectedAsm.id]: list.map(s => s.id === selectedSub.id ? updatedSub : s)
      };
    });

    // Update assignment statistics
    setAssignments(prev => {
      const safePrev = Array.isArray(prev) ? prev : [];
      return safePrev.map(asm => {
        if (asm.id === selectedAsm.id) {
          const currentSubs = (submissions && submissions[asm.id]) ? submissions[asm.id] : [];
          const allSubs = currentSubs.map(s => s.id === selectedSub.id ? updatedSub : s);
          const gradedSubs = allSubs.filter(s => s.status === "graded");
          const totalScore = gradedSubs.reduce((sum, s) => sum + s.score, 0);
          return {
            ...asm,
            gradedCount: gradedSubs.length,
            averageScore: gradedSubs.length > 0 ? parseFloat((totalScore / gradedSubs.length).toFixed(1)) : 0
          };
        }
        return asm;
      });
    });

    toast.success(isRTL ? "تم حفظ التقييم بنجاح!" : "Evaluation saved successfully!");
    setSelectedSub(null);
  };

  const getStatusBadge = (status) => {
    if (status === "graded") {
      return <Badge className="bg-emerald-500/10 text-emerald-600 border-none rounded-lg text-xs font-bold px-2.5 py-1">{isRTL ? "تم التصحيح" : "Graded"}</Badge>;
    }
    return <Badge className="bg-amber-500/10 text-amber-600 border-none rounded-lg text-xs font-bold px-2.5 py-1">{isRTL ? "بانتظار التصحيح" : "Pending Review"}</Badge>;
  };

  return (
    <div className="space-y-8" dir={isRTL ? "rtl" : "ltr"}>
      {/* HEADER CONTROLS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-stone-100 pb-6">
        <div>
          <h2 className="text-3xl font-serif font-black text-stone-900">
            {view === "list" && (isRTL ? "إدارة الواجبات والتقييمات" : "Assignments & Grading")}
            {view === "create" && (editingAsmId ? (isRTL ? "تعديل الواجب" : "Edit Assignment") : (isRTL ? "منشئ الواجبات التفاعلي" : "Interactive Assignment Builder"))}
            {view === "grade" && (isRTL ? `تصحيح: ${selectedAsm?.title}` : `Grading: ${selectedAsm?.title}`)}
          </h2>
          <p className="text-stone-400 text-sm mt-1">
            {view === "list" && (isRTL ? "قم بإنشاء وتصحيح واجبات الطلاب بنظام شبيه بنماذج جوجل" : "Create and grade student homework like Google Forms")}
            {view === "create" && (editingAsmId ? (isRTL ? "تحديث الأسئلة والخيارات والدرجات للواجب" : "Update questions, options and points for this assignment") : (isRTL ? "صمم الأسئلة وحدد الإجابات الصحيحة ونقاط التقييم تلقائياً" : "Design questions, specify correct answers, and set grading points"))}
            {view === "grade" && (isRTL ? "قم بمراجعة إجابات الطلاب والأسئلة المقالية وإضافة الدرجات والتوجيهات" : "Review student answers, grade essay questions, and provide feedback")}
          </p>
        </div>

        <div className="flex gap-2">
          {view !== "list" && (
            <button 
              onClick={() => setView("list")} 
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all border-2 border-stone-300 bg-white text-stone-800 hover:bg-stone-50 h-11 px-5 cursor-pointer"
            >
              <ChevronRight className={`h-4 w-4 ${isRTL ? "" : "rotate-180"}`} />
              <span>{isRTL ? "رجوع" : "Back"}</span>
            </button>
          )}
          {view === "list" && (
            <button 
              onClick={() => setView("create")} 
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all bg-stone-900 text-white hover:bg-black cursor-pointer shadow-lg h-11 px-5"
            >
              <Plus size={16} />
              <span>{isRTL ? "إنشاء واجب جديد" : "Create Form"}</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. LIST VIEW */}
      {view === "list" && (
        <div className="space-y-6">
          {/* Class Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-100 shadow-sm">
            <div className="flex items-center gap-2">
              <Filter size={15} className="text-primary" />
              <span className="text-xs font-bold text-stone-700">{isRTL ? "تصفية الواجبات حسب الفصل:" : "Filter by Class:"}</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFilterClassId("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterClassId === "all"
                    ? "bg-stone-900 text-white shadow-sm"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                {isRTL ? "جميع الفصول" : "All Classes"} ({assignments.length})
              </button>

              {availableClasses.map(cls => {
                const count = assignments.filter(asm => {
                  if (Array.isArray(asm.target_classes) && asm.target_classes.length > 0) {
                    return asm.target_classes.some(c => c.id === cls.id || (c.grade === cls.grade && c.section === cls.section));
                  }
                  return asm.grade === cls.grade && (!asm.section || asm.section === cls.section);
                }).length;

                const isSelected = filterClassId === cls.id || filterClassId === `${cls.grade}-${cls.section}`;
                return (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() => setFilterClassId(isSelected ? "all" : (cls.id || `${cls.grade}-${cls.section}`))}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-primary text-white shadow-sm"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    <span>{cls.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${isSelected ? "bg-white/20 text-white" : "bg-stone-200 text-stone-600"}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {filteredAssignments.length === 0 ? (
            <Card className="p-12 text-center bg-stone-50/50 border border-dashed border-stone-200 rounded-[32px] space-y-3">
              <GraduationCap className="h-10 w-10 text-stone-300 mx-auto" />
              <p className="font-bold text-stone-600 text-sm">{isRTL ? "لا توجد واجبات مطابقة لهذا الفصل الدراسي." : "No assignments found for this class."}</p>
              {filterClassId !== "all" && (
                <button
                  type="button"
                  onClick={() => setFilterClassId("all")}
                  className="text-xs font-bold text-primary hover:underline cursor-pointer"
                >
                  {isRTL ? "عرض جميع الواجبات" : "View all assignments"}
                </button>
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filteredAssignments.map(asm => {
            const currentSubmissions = (submissions && submissions[asm.id]) || [];
            const pendingCount = currentSubmissions.filter(s => s.status === "pending").length;
            
            return (
              <Card key={asm.id} className="p-6 md:p-8 bg-white border border-stone-100 shadow-sm rounded-[32px] hover:shadow-md transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-2.5 h-full bg-primary" />
                
                {/* Top Row: Buttons (Left), Title (Middle), Badge & Date (Right) */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-stone-100 pb-4 mb-6 w-full">
                  {/* Left Side: Management Buttons */}
                  <div className="flex items-center gap-1.5 order-2 md:order-1">
                    <button 
                      onClick={() => setPreviewAsm(asm)}
                      className="inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-lg text-[10px] font-bold transition-all border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 h-8 px-2.5 cursor-pointer shadow-sm"
                    >
                      <Eye size={12} />
                      <span>{isRTL ? "عرض" : "View"}</span>
                    </button>
                    
                    <button 
                      onClick={() => {
                        setEditingAsmId(asm.id);
                        setFormTitle(asm.title);
                        setFormDesc(asm.description || "");
                        setFormSubject(asm.subject);
                        setFormDueDate(asm.dueDate);
                        setFormQuestions(asm.questions || []);
                        if (asm.target_classes && Array.isArray(asm.target_classes) && asm.target_classes.length > 0) {
                          setSelectedClasses(asm.target_classes);
                        } else if (asm.grade) {
                          const gList = String(asm.grade).split(",").map(g => g.trim());
                          const sList = asm.section ? String(asm.section).split(",").map(s => s.trim()) : [""];
                          const reconstructed = [];
                          gList.forEach(g => {
                            sList.forEach(s => {
                              reconstructed.push({
                                id: asm.class_id || `cls-${g}-${s || 'all'}`,
                                grade: g,
                                section: s,
                                label: isRTL ? `الصف ${g}${s ? ` - شعبة (${s})` : ''}` : `Grade ${g}${s ? ` - Sec (${s})` : ''}`
                              });
                            });
                          });
                          setSelectedClasses(reconstructed);
                        } else {
                          setSelectedClasses([]);
                        }
                        setClassSelectionError(false);
                        setView("create");
                      }}
                      className="inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-lg text-[10px] font-bold transition-all border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 h-8 px-2.5 cursor-pointer shadow-sm"
                    >
                      <Edit2 size={12} />
                      <span>{isRTL ? "تعديل" : "Edit"}</span>
                    </button>

                    <button 
                      onClick={() => handleDeleteAssignment(asm.id)}
                      className="inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-lg text-[10px] font-bold transition-all border border-rose-200 bg-rose-50/50 text-rose-600 hover:bg-rose-50 h-8 px-2.5 cursor-pointer shadow-sm"
                    >
                      <Trash2 size={12} />
                      <span>{isRTL ? "حذف" : "Delete"}</span>
                    </button>
                  </div>

                  {/* Middle: Assignment Title & Target Classes */}
                  <div className="flex-1 text-center order-1 md:order-2 w-full md:px-6">
                    <h3 className="text-base md:text-lg font-bold text-stone-900 group-hover:text-primary transition-colors leading-snug">
                      {asm.title}
                    </h3>
                    {((asm.target_classes && asm.target_classes.length > 0) || asm.grade) && (
                      <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2">
                        <span className="text-[11px] text-stone-400 font-bold flex items-center gap-1">
                          <GraduationCap size={13} className="text-primary" />
                          {isRTL ? "الفصول المستهدفة:" : "Classes:"}
                        </span>
                        {Array.isArray(asm.target_classes) && asm.target_classes.length > 0 ? (
                          asm.target_classes.map((tc, idx) => (
                            <span 
                              key={tc.id || idx} 
                              className="inline-flex items-center text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/70 px-2 py-0.5 rounded-lg"
                            >
                              {tc.label || (isRTL ? `الصف ${tc.grade}${tc.section ? ` (${tc.section})` : ''}` : `Grade ${tc.grade}${tc.section ? ` (${tc.section})` : ''}`)}
                            </span>
                          ))
                        ) : (
                          <span className="inline-flex items-center text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/70 px-2 py-0.5 rounded-lg">
                            {isRTL ? `الصف ${asm.grade}${asm.section ? ` (${asm.section})` : ''}` : `Grade ${asm.grade}${asm.section ? ` (${asm.section})` : ''}`}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Side: Subject Badge & Date */}
                  <div className="flex items-center gap-3 order-3">
                    <Badge className="bg-primary/5 text-primary border-none rounded-lg text-[10px] font-black px-2 py-0.5 uppercase tracking-wider">
                      {asm.subject}
                    </Badge>
                    <span className="text-stone-400 text-xs font-semibold flex items-center gap-1 whitespace-nowrap">
                      <Clock size={12} />
                      {isRTL ? "تاريخ التسليم:" : "Due Date:"} <span className="num-en">{asm.dueDate}</span>
                    </span>
                  </div>
                </div>

                {/* Bottom Row: Stats Cards & Main Grade Button */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 w-full">
                  {/* Left: Questions Count & Total Points Info */}
                  <div className="flex gap-4 text-xs text-stone-400 font-semibold w-full md:w-auto">
                    <span>{isRTL ? `الأسئلة: ${asm.questionsCount}` : `Questions: ${asm.questionsCount}`}</span>
                    <span>•</span>
                    <span>{isRTL ? `الدرجة الكلية: ${asm.points} درجات` : `Total Points: ${asm.points} pts`}</span>
                  </div>

                  {/* Center: Stats grid */}
                  <div className="grid grid-cols-3 gap-3 w-full md:w-[420px] shrink-0">
                    {/* Stat 1: Submissions */}
                    {(() => {
                      const theme = getThemeClasses(asm.subject, false);
                      return (
                        <div className={`p-3.5 rounded-2xl border ${theme.border} ${theme.bg} ${theme.text} hover:shadow-md transition-all duration-300 flex flex-col justify-between h-[105px] relative group/stat`}>
                          <div>
                            <FileText size={18} className={`${theme.icon} opacity-80`} />
                          </div>
                          <div className="flex flex-col mt-1">
                            <span className="text-xl md:text-2xl font-black leading-none tracking-tight num-en">{asm.submissionsCount}</span>
                            <span className="text-[10px] md:text-xs font-semibold whitespace-nowrap truncate mt-1">
                              {isRTL ? "التسليمات" : "Submissions"}
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Stat 2: Pending Review */}
                    {(() => {
                      const isPending = pendingCount > 0;
                      const theme = getThemeClasses(asm.subject, isPending);
                      return (
                        <div className={`p-3.5 rounded-2xl border ${theme.border} ${theme.bg} ${theme.text} hover:shadow-md transition-all duration-300 flex flex-col justify-between h-[105px] relative group/stat`}>
                          <div className="flex justify-between items-start">
                            <Clock3 size={18} className={`${theme.icon} ${isPending ? "animate-pulse" : "opacity-80"}`} />
                            {isPending && (
                              <Badge className="bg-amber-600 hover:bg-amber-600 text-[8px] font-black px-1 py-0.5 rounded text-white border-none shrink-0 scale-90 origin-top-right">
                                {isRTL ? "جديد" : "New"}
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-col mt-1">
                            <span className="text-xl md:text-2xl font-black leading-none tracking-tight num-en">{pendingCount}</span>
                            <span className="text-[10px] md:text-xs font-semibold whitespace-nowrap truncate mt-1">
                              {isRTL ? "بحاجة لمراجعة" : "To Review"}
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Stat 3: Average Score */}
                    {(() => {
                      const theme = getThemeClasses(asm.subject, false);
                      return (
                        <div className={`p-3.5 rounded-2xl border ${theme.border} ${theme.bg} ${theme.text} hover:shadow-md transition-all duration-300 flex flex-col justify-between h-[105px] relative group/stat`}>
                          <div>
                            <Award size={18} className={`${theme.icon} opacity-80`} />
                          </div>
                          <div className="flex flex-col mt-1">
                            <div className="flex items-baseline gap-0.5">
                              <span className="text-xl md:text-2xl font-black leading-none tracking-tight num-en">{asm.averageScore}</span>
                              <span className="text-[9px] font-bold opacity-60 whitespace-nowrap">
                                {isRTL ? ` من ${asm.points}` : ` / ${asm.points}`}
                              </span>
                            </div>
                            <span className="text-[10px] md:text-xs font-semibold whitespace-nowrap truncate mt-1">
                              {isRTL ? "متوسط الدرجة" : "Avg Score"}
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Right: Grade Button */}
                  <div className="flex gap-2 w-full md:w-auto shrink-0">
                    <button 
                      onClick={() => handleOpenGrading(asm)}
                      className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-xs font-black transition-all bg-stone-900 text-white hover:bg-black h-11 px-5 cursor-pointer"
                    >
                      <Award size={14} />
                      <span>{isRTL ? "تصحيح وتقييم" : "Grade"}</span>
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
          )}
        </div>
      )}

      {/* 2. FORM BUILDER VIEW (Google Forms/MS Forms experience) */}
      {view === "create" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Builder Form */}
          <div className="lg:col-span-8 space-y-6">
            {/* Form Header Info card */}
            <Card className="p-6 md:p-8 bg-white border-2 border-primary/20 rounded-[32px] shadow-sm space-y-4">
              <div className="space-y-2">
                <input id="field-assignmentsgradingtab-untitled-form-title" name="untitled_form_title" aria-label="untitled form title" 
                  type="text"
                  placeholder={isRTL ? "عنوان الواجب أو التقييم الجديد..." : "Untitled Form Title..."}
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  className="w-full text-2xl font-black text-stone-900 border-b border-dashed border-stone-200 focus:border-primary focus:outline-none pb-2 transition-all"
                />
              </div>
              <div className="space-y-2">
                <textarea id="field-assignmentsgradingtab-form-description-or-instructions" name="form_description_or_instructions" aria-label="form description or instructions" 
                  placeholder={isRTL ? "وصف الواجب أو تعليمات للطلاب..." : "Form description or instructions..."}
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  rows={2}
                  className="w-full text-sm text-stone-500 border-none focus:outline-none resize-none"
                />
              </div>

              {/* Target classes preview in header */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-100">
                <span className="text-xs font-bold text-stone-400 flex items-center gap-1.5">
                  <GraduationCap size={14} className="text-primary" />
                  {isRTL ? "الفصول المستهدفة:" : "Targeted Classes:"}
                </span>
                {selectedClasses.length === 0 ? (
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border ${
                    classSelectionError 
                      ? "text-rose-600 bg-rose-50 border-rose-200 animate-pulse" 
                      : "text-amber-700 bg-amber-50 border-amber-200"
                  }`}>
                    {isRTL ? "لم يتم تحديد صف بعد (مطلوب من لوحة الإعدادات جانباً *)" : "No class selected yet (Required in sidebar *)"}
                  </span>
                ) : (
                  selectedClasses.map(c => (
                    <Badge key={c.id || `${c.grade}-${c.section}`} className="bg-primary/10 text-primary border border-primary/20 text-[11px] font-bold px-2.5 py-0.5 rounded-lg">
                      {c.label}
                    </Badge>
                  ))
                )}
              </div>
            </Card>

            {/* Questions List */}
            <div className="space-y-5">
              {formQuestions.map((q, idx) => (
                <Card key={q.id} className="p-6 md:p-8 bg-white border-none shadow-sm rounded-[32px] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 left-0 h-1 bg-stone-100 group-hover:bg-primary transition-colors" />
                  
                  <div className="flex flex-col gap-4">
                    {/* Question Row Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-stone-50 pb-4">
                      <span className="text-stone-400 font-bold text-sm">
                        {isRTL ? `السؤال ${idx + 1}` : `Question ${idx + 1}`}
                      </span>
                      
                      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                        {/* Question Type Selection */}
                        <Select value={q.type} onValueChange={(val) => updateQuestionType(q.id, val)}>
                          <SelectTrigger className="w-40 h-9 rounded-xl border-stone-200 bg-white font-semibold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="mcq" className="font-semibold">{isRTL ? "خيارات دائرية (خيار واحد)" : "Multiple Choice"}</SelectItem>
                            <SelectItem value="checkbox" className="font-semibold">{isRTL ? "مربعات اختيار (خيارات متعددة)" : "Checkboxes"}</SelectItem>
                            <SelectItem value="short" className="font-semibold">{isRTL ? "إجابة قصيرة" : "Short Answer"}</SelectItem>
                            <SelectItem value="paragraph" className="font-semibold">{isRTL ? "فقرة مقالية" : "Paragraph"}</SelectItem>
                          </SelectContent>
                        </Select>

                        {/* Points input */}
                        <div className="flex items-center gap-1.5 border border-stone-250 rounded-xl px-2 h-9">
                          <span className="text-[10px] font-bold text-stone-400">{isRTL ? "الدرجة:" : "Pts:"}</span>
                          <input id="field-assignmentsgradingtab-points" name="points" aria-label="points" 
                            type="number"
                            value={q.points}
                            onChange={e => updateQuestionPoints(q.id, e.target.value)}
                            className="w-10 text-center font-bold text-sm bg-transparent focus:outline-none"
                            min="0"
                          />
                        </div>

                        {/* Delete Question */}
                        {formQuestions.length > 1 && (
                          <button 
                            onClick={() => deleteQuestion(q.id)}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Question text input */}
                    <div className="space-y-3">
                      <Input 
                        placeholder={isRTL ? "نص السؤال هنا..." : "Enter your question text..."}
                        value={q.text}
                        onChange={e => updateQuestionText(q.id, e.target.value)}
                        className="h-11 rounded-xl border-stone-200 font-semibold focus-visible:ring-primary/20"
                      />

                      {/* Options rendering for MCQ or Checkbox */}
                      {(q.type === "mcq" || q.type === "checkbox") && (
                        <div className="space-y-2 mt-4">
                          {q.options.map((opt, oIdx) => (
                            <div key={oIdx} className="flex items-center gap-3">
                              {q.type === "mcq" ? (
                                <div className="h-4 w-4 rounded-full border-2 border-stone-300" />
                              ) : (
                                <div className="h-4 w-4 rounded border-2 border-stone-300" />
                              )}
                              
                              <Input 
                                value={opt}
                                onChange={e => updateOptionText(q.id, oIdx, e.target.value)}
                                className="h-9 rounded-lg border-stone-200 focus-visible:ring-primary/20 flex-1 text-xs font-medium"
                              />

                              {/* Correct Answer Toggle */}
                              <button
                                onClick={() => {
                                  if (q.type === "mcq") {
                                    setFormQuestions(prev => prev.map(item => item.id === q.id ? { ...item, correctAnswer: opt } : item));
                                  } else {
                                    const currentCorrect = Array.isArray(q.correctAnswer) ? q.correctAnswer : [];
                                    const isCorrect = currentCorrect.includes(opt);
                                    const newCorrect = isCorrect 
                                      ? currentCorrect.filter(c => c !== opt)
                                      : [...currentCorrect, opt];
                                    setFormQuestions(prev => prev.map(item => item.id === q.id ? { ...item, correctAnswer: newCorrect } : item));
                                  }
                                }}
                                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                  (q.type === "mcq" && q.correctAnswer === opt) || (q.type === "checkbox" && Array.isArray(q.correctAnswer) && q.correctAnswer.includes(opt))
                                    ? "bg-emerald-50 border-emerald-500 text-emerald-600"
                                    : "border-stone-200 hover:border-emerald-300 text-stone-400 hover:text-emerald-500"
                                }`}
                                title={isRTL ? "تحديد كإجابة صحيحة" : "Mark as Correct Answer"}
                              >
                                <Check size={14} />
                              </button>

                              {q.options.length > 1 && (
                                <button 
                                  onClick={() => deleteOption(q.id, oIdx)}
                                  className="p-1.5 text-stone-400 hover:bg-stone-50 rounded-lg cursor-pointer"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          ))}
                          
                          <button 
                            onClick={() => addOption(q.id)}
                            className="inline-flex items-center gap-1 text-xs text-primary font-bold hover:underline mt-2 cursor-pointer"
                          >
                            <Plus size={12} />
                            <span>{isRTL ? "إضافة خيار جديد" : "Add Option"}</span>
                          </button>
                        </div>
                      )}

                      {/* Display message for text based questions */}
                      {q.type === "short" && (
                        <div className="space-y-2">
                          <Label className="text-stone-550 text-xs font-bold">{isRTL ? "الإجابة النموذجية (مفتاح التصحيح):" : "Model Answer (Key):"}</Label>
                          <Input 
                            value={q.correctAnswer || ""}
                            onChange={e => {
                              const val = e.target.value;
                              setFormQuestions(prev => prev.map(item => item.id === q.id ? { ...item, correctAnswer: val } : item));
                            }}
                            className="h-10 rounded-xl border-stone-200 font-semibold focus-visible:ring-primary/20 bg-white"
                            placeholder={isRTL ? "أدخل الإجابة الصحيحة التي سيتم مطابقة إجابة الطالب معها..." : "Enter the correct answer to match against..."}
                          />
                          <p className="text-[10px] text-stone-400 font-semibold">
                            {isRTL ? "* سيتم مقارنة إجابات الطلاب مع هذه الإجابة النموذجية." : "* Students answers will be compared with this model answer."}
                          </p>
                        </div>
                      )}
                      {q.type === "paragraph" && (
                        <div className="space-y-2">
                          <Label className="text-stone-550 text-xs font-bold">{isRTL ? "إرشادات التصحيح للمعلم (اختياري):" : "Grading Guidelines (Optional):"}</Label>
                          <Textarea 
                            value={q.correctAnswer || ""}
                            onChange={e => {
                              const val = e.target.value;
                              setFormQuestions(prev => prev.map(item => item.id === q.id ? { ...item, correctAnswer: val } : item));
                            }}
                            rows={2}
                            className="rounded-xl border-stone-200 font-semibold focus-visible:ring-primary/20 bg-white"
                            placeholder={isRTL ? "اكتب الكلمات الدلالية أو النقاط الهامة التي يجب توافرها في موضوع الطالب..." : "Enter keywords or critical points students should include..."}
                          />
                          <p className="text-[10px] text-stone-400 font-semibold">
                            {isRTL ? "* هذا الحقل المقالي يتطلب تصحيحاً ومراجعة يدوية من المعلم لاحقاً." : "* This essay question requires manual grading by the teacher later."}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Add question controller */}
            <button 
              onClick={addQuestion}
              className="w-full h-14 rounded-2xl border-dashed border-2 border-stone-300 hover:border-primary/50 text-stone-500 hover:text-primary transition-all flex items-center justify-center gap-2 font-bold cursor-pointer bg-white"
            >
              <Plus size={18} />
              <span>{isRTL ? "إضافة سؤال جديد" : "Add New Question"}</span>
            </button>
          </div>

          {/* Sidebar controls for Builder */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="p-6 md:p-8 bg-white border-none shadow-sm rounded-[32px] space-y-6">
              <h4 className="font-bold text-stone-900">{isRTL ? "إعدادات النشر" : "Publish Settings"}</h4>

              <div className="space-y-4 text-right">
                <div className="space-y-1.5">
                  <Label className="text-stone-600 font-bold text-xs">{isRTL ? "المادة الدراسية" : "Subject"}</Label>
                  <Select value={formSubject} onValueChange={setFormSubject}>
                    <SelectTrigger className="h-11 rounded-xl border-stone-200 bg-white font-semibold">
                      <SelectValue placeholder={isRTL ? "اختر المادة" : "Select Subject"} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {subjects && subjects.length > 0 ? (
                        subjects.map(sub => (
                          <SelectItem key={sub.id} value={sub.name} className="font-semibold">{sub.name}</SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value="اللغة العربية" className="font-semibold">{isRTL ? "اللغة العربية" : "Arabic"}</SelectItem>
                          <SelectItem value="العلوم" className="font-semibold">{isRTL ? "العلوم" : "Sciences"}</SelectItem>
                          <SelectItem value="الرياضيات" className="font-semibold">{isRTL ? "الرياضيات" : "Mathematics"}</SelectItem>
                          <SelectItem value="اللغة الإنجليزية" className="font-semibold">{isRTL ? "اللغة الإنجليزية" : "English"}</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Target Classes & Sections Selection (Mandatory) */}
                <div className={`space-y-2 p-3.5 rounded-2xl transition-all ${
                  classSelectionError 
                    ? "bg-rose-50/70 border-2 border-rose-300 ring-2 ring-rose-200/50" 
                    : "bg-stone-50/60 border border-stone-200/80"
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <GraduationCap className="h-4 w-4 text-primary" />
                      <Label className="text-stone-800 font-bold text-xs">
                        {isRTL ? "الصف / الشعبة المستهدفة" : "Target Classes / Grades"}
                      </Label>
                      <span className="text-rose-500 font-black text-xs">*</span>
                    </div>

                    {/* Quick selection actions */}
                    <div className="flex items-center gap-1.5">
                      {selectedClasses.length < availableClasses.length ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedClasses([...availableClasses]);
                            setClassSelectionError(false);
                          }}
                          className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                        >
                          {isRTL ? "تحديد الكل" : "Select All"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelectedClasses([])}
                          className="text-[10px] font-bold text-stone-400 hover:text-rose-500 hover:underline cursor-pointer"
                        >
                          {isRTL ? "إلغاء التحديد" : "Deselect"}
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-stone-500 font-medium leading-relaxed">
                    {isRTL 
                      ? "حدد الفصول والشُعب التي سيمكن لطلابها حل هذا الواجب حصرياً:" 
                      : "Select the specific classes/sections that can access this homework:"}
                  </p>

                  {/* Available classes interactive multi-select list */}
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
                    {availableClasses.map((cls) => {
                      const isSelected = selectedClasses.some(c => c.id === cls.id || (c.grade === cls.grade && c.section === cls.section));
                      return (
                        <div
                          key={cls.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedClasses(prev => prev.filter(c => !(c.id === cls.id || (c.grade === cls.grade && c.section === cls.section))));
                            } else {
                              setSelectedClasses(prev => [...prev, cls]);
                              setClassSelectionError(false);
                            }
                          }}
                          className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all select-none ${
                            isSelected 
                              ? "bg-white border-primary text-stone-900 shadow-sm ring-1 ring-primary/30" 
                              : "bg-white/80 border-stone-200 text-stone-600 hover:border-stone-300 hover:bg-white"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`h-4 w-4 rounded-md border flex items-center justify-center transition-colors ${
                              isSelected ? "bg-primary border-primary text-white" : "border-stone-300 bg-white"
                            }`}>
                              {isSelected && <Check size={11} strokeWidth={3} />}
                            </div>
                            <span>{cls.label}</span>
                          </div>

                          {cls.section && (
                            <Badge variant="outline" className={`text-[10px] font-bold py-0 px-1.5 ${isSelected ? "border-primary/40 text-primary bg-primary/5" : "text-stone-400"}`}>
                              {isRTL ? `شعبة ${cls.section}` : `Sec ${cls.section}`}
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Summary & Error feedback */}
                  <div className="pt-1 flex items-center justify-between text-[11px] font-bold">
                    <span className={selectedClasses.length > 0 ? "text-primary" : "text-stone-400"}>
                      {selectedClasses.length > 0
                        ? (isRTL ? `تم تحديد ${selectedClasses.length} من أصل ${availableClasses.length} فصول` : `Selected ${selectedClasses.length} of ${availableClasses.length} classes`)
                        : (isRTL ? "لم يتم تحديد أي صف بعد" : "No class selected yet")}
                    </span>
                  </div>

                  {classSelectionError && (
                    <div className="flex items-center gap-1 text-[11px] font-bold text-rose-600 pt-0.5 animate-pulse">
                      <AlertCircle size={12} />
                      <span>{isRTL ? "هذا الحقل إلزامي: يرجى تحديد صف دراسي واحد على الأقل" : "Required: Please select at least one class"}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-stone-600 font-bold text-xs">{isRTL ? "آخر موعد للتسليم" : "Due Date"}</Label>
                  <input id="field-assignmentsgradingtab-input-2" name="input_2" aria-label="input 2" 
                    type="date"
                    value={formDueDate}
                    onChange={e => setFormDueDate(e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded-xl h-11 px-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all text-right"
                  />
                </div>
              </div>

              <div className="border-t border-stone-100 pt-5 space-y-3">
                <div className="flex justify-between items-center text-xs font-bold text-stone-500">
                  <span>{isRTL ? "عدد الأسئلة:" : "Total Questions:"}</span>
                  <span className="text-stone-900 num-en">{formQuestions.length}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold text-stone-500">
                  <span>{isRTL ? "الدرجات الإجمالية:" : "Total Points:"}</span>
                  <span className="text-primary font-black num-en">
                    {formQuestions.reduce((sum, q) => sum + (q.points || 0), 0)} {isRTL ? "درجة" : "pts"}
                  </span>
                </div>
              </div>

              <button 
                onClick={handleSaveForm}
                className="w-full inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-stone-900 text-white hover:bg-black h-12 cursor-pointer shadow-lg"
              >
                <Save size={16} />
                <span>{editingAsmId ? (isRTL ? "حفظ التعديلات" : "Save Changes") : (isRTL ? "حفظ ونشر الواجب" : "Publish Form")}</span>
              </button>
            </Card>
          </div>
        </div>
      )}

      {/* 3. GRADING DASHBOARD VIEW */}
      {view === "grade" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Submissions List (Left column in LTR, Right in RTL) */}
          <div className="lg:col-span-4 space-y-4">
            <h4 className="font-bold text-stone-800 px-1">{isRTL ? "تسليمات الطلاب" : "Submissions"}</h4>
            
            <div className="space-y-3">
              {(!submissions || !submissions[selectedAsm.id] || submissions[selectedAsm.id].length === 0) ? (
                <div className="bg-white p-6 rounded-2xl text-center text-stone-400 font-semibold text-sm">
                  {isRTL ? "لا توجد تسليمات بعد للواجب" : "No submissions yet"}
                </div>
              ) : (
                ((submissions && submissions[selectedAsm.id]) || []).map(sub => {
                  const isSelected = selectedSub?.id === sub.id;
                  
                  return (
                    <Card 
                      key={sub.id} 
                      onClick={() => setSelectedSub(sub)}
                      className={`p-5 bg-white border-2 rounded-2xl cursor-pointer hover:border-primary/20 transition-all ${
                        isSelected ? "border-primary shadow-md" : "border-transparent"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <h5 className="font-bold text-stone-900 text-sm">{sub.studentName}</h5>
                        {getStatusBadge(sub.status)}
                      </div>
                      <div className="flex justify-between items-center text-xs text-stone-400 font-semibold pt-1">
                        <span>{sub.submittedAt}</span>
                        {sub.status === "graded" ? (
                          <span className="text-primary font-bold num-en">{sub.score} / {selectedAsm.points}</span>
                        ) : (
                          <span className="text-amber-600 font-bold">{isRTL ? "معلق" : "Pending"}</span>
                        )}
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </div>

          {/* Submission Details & Scoring Panel (Main view) */}
          <div className="lg:col-span-8">
            {!selectedSub ? (
              <Card className="h-64 flex flex-col items-center justify-center text-stone-450 border-dashed border-2 border-stone-200 bg-white rounded-[32px] text-center p-8">
                <Users size={36} className="text-stone-300 mb-3" />
                <h4 className="font-bold">{isRTL ? "الرجاء اختيار طالب لبدء التقييم" : "Select a student to start grading"}</h4>
                <p className="text-xs text-stone-400 mt-1">{isRTL ? "اضغط على تسليم الطالب من القائمة الجانبية لعرض إجاباته بالتفصيل" : "Click on any submission on the side menu to view details"}</p>
              </Card>
            ) : (
              <Card className="p-6 md:p-8 bg-white border-none shadow-sm rounded-[32px] space-y-6">
                <div className="flex justify-between items-center border-b border-stone-50 pb-5">
                  <div>
                    <h3 className="text-xl font-bold text-stone-900">{selectedSub.studentName}</h3>
                    <p className="text-xs text-stone-400 mt-1">{isRTL ? "تاريخ التسليم:" : "Submitted on:"} {selectedSub.submittedAt}</p>
                  </div>
                  
                  <div className="text-right">
                    <span className="text-xs font-bold text-stone-400 block mb-1">{isRTL ? "الدرجة الإجمالية" : "Final Score"}</span>
                    <span className="text-2xl font-black text-primary num-en">
                      {selectedAsm.questions.reduce((sum, q) => sum + (parseFloat(selectedSub.grades[q.id]) || 0), 0)} / {selectedAsm.points}
                    </span>
                  </div>
                </div>

                {/* Answers & Correct answers reviewer */}
                <div className="space-y-6">
                  {selectedAsm.questions.map((q, qIdx) => {
                    const studentAnswer = selectedSub.answers[q.id];
                    const grade = selectedSub.grades[q.id];
                    
                    return (
                      <div key={q.id} className="border-b border-stone-50 pb-5 space-y-3">
                        <div className="flex justify-between items-start gap-4">
                          <h4 className="font-bold text-stone-900 text-sm">
                            <span className="text-stone-400 ml-1">{qIdx + 1}.</span> {q.text}
                          </h4>
                          
                          {/* Point input selector */}
                          <div className="flex items-center gap-1 shrink-0">
                            <input id="field-assignmentsgradingtab-input-1" name="input_1" aria-label="input 1" 
                              type="number"
                              value={grade ?? ""}
                              onChange={e => {
                                const val = parseFloat(e.target.value) || 0;
                                setSelectedSub(prev => ({
                                  ...prev,
                                  grades: {
                                    ...prev.grades,
                                    [q.id]: val > q.points ? q.points : val
                                  }
                                }));
                              }}
                              className="w-12 h-8 text-center rounded-lg border border-stone-200 focus:outline-none font-bold text-xs"
                              max={q.points}
                              min="0"
                              step="0.5"
                            />
                            <span className="text-[10px] font-bold text-stone-450">/ {q.points}</span>
                          </div>
                        </div>

                        {/* Display options for MCQ/Checkbox */}
                        {(q.type === "mcq" || q.type === "checkbox") && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-medium">
                            {q.options.map((opt, oIdx) => {
                              const isStudentSelected = Array.isArray(studentAnswer) 
                                ? studentAnswer.includes(opt) 
                                : studentAnswer === opt;
                              const isCorrect = Array.isArray(q.correctAnswer)
                                ? q.correctAnswer.includes(opt)
                                : q.correctAnswer === opt;
                              
                              let style = "bg-stone-50 border-stone-200";
                              if (isStudentSelected && isCorrect) style = "bg-emerald-50/50 border-emerald-300 text-emerald-700";
                              else if (isStudentSelected && !isCorrect) style = "bg-rose-50/50 border-rose-300 text-rose-700";
                              else if (!isStudentSelected && isCorrect) style = "bg-emerald-50/20 border-dashed border-emerald-200 text-emerald-600";

                              return (
                                <div key={oIdx} className={`p-2.5 rounded-xl border flex items-center gap-2 ${style}`}>
                                  {isStudentSelected && isCorrect && <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />}
                                  {isStudentSelected && !isCorrect && <XCircle size={14} className="text-rose-500 shrink-0" />}
                                  {!isStudentSelected && isCorrect && <HelpCircle size={14} className="text-emerald-500 shrink-0" />}
                                  <span>{opt}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Short / Essay Answers Display */}
                        {q.type === "short" && (
                          <div className="space-y-1">
                            <div className="bg-stone-55 p-3 rounded-xl border border-stone-100 text-xs font-semibold text-stone-700 text-right">
                              {studentAnswer || (isRTL ? "[لم يكتب أي شيء]" : "[Empty Answer]")}
                            </div>
                            <div className="text-[10px] text-stone-400 font-bold flex gap-1.5 items-center justify-start">
                              <CheckCircle2 size={12} className="text-emerald-500" />
                              <span>{isRTL ? "الإجابة النموذجية:" : "Model Answer:"} <b>{q.correctAnswer}</b></span>
                            </div>
                          </div>
                        )}
                        {q.type === "paragraph" && (
                          <div className="bg-stone-50 p-4 rounded-xl border border-stone-100 text-xs font-medium text-stone-800 leading-relaxed text-right">
                            {studentAnswer || (isRTL ? "[لم يكتب أي شيء]" : "[Empty Answer]")}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Teacher Feedback & Finish Grading Button */}
                <div className="space-y-4 pt-4">
                  <div className="space-y-1.5">
                    <Label className="text-stone-600 font-bold text-xs">{isRTL ? "ملاحظات المعلم وتوجيهاته للطلب" : "Teacher Feedback & Guidance"}</Label>
                    <Textarea 
                      placeholder={isRTL ? "اكتب توجيهاتك أو الملاحظات حول الإجابة والتقدير هنا..." : "Write your feedback or guidance here..."}
                      value={selectedSub.feedback}
                      onChange={e => {
                        const val = e.target.value;
                        setSelectedSub(prev => ({ ...prev, feedback: val }));
                      }}
                      rows={3}
                      className="rounded-xl border-stone-200 focus-visible:ring-primary/20 font-semibold p-3"
                    />
                  </div>

                  <button 
                    onClick={handleSaveStudentGrade}
                    className="w-full inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-stone-900 text-white hover:bg-black h-12 cursor-pointer shadow-lg"
                  >
                    <CheckCircle2 size={16} />
                    <span>{isRTL ? "اعتماد وحفظ نتيجة التصحيح" : "Submit Grade"}</span>
                  </button>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
      {/* Dialog for viewing assignment details (عرض الواجب) */}
      <Dialog open={previewAsm !== null} onOpenChange={(open) => !open && setPreviewAsm(null)}>
        <DialogContent className="max-w-2xl rounded-3xl p-6 overflow-y-auto max-h-[80vh]" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader className="border-b border-stone-150 pb-4 mb-4">
            <DialogTitle className="font-serif font-black text-xl text-stone-900 flex items-center gap-2">
              <FileText className="text-primary h-5 w-5" />
              <span>{isRTL ? "تفاصيل وعرض الواجب" : "Assignment Details & Preview"}</span>
            </DialogTitle>
          </DialogHeader>

          {previewAsm && (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-4 items-center justify-between bg-stone-50 p-4 rounded-2xl border border-stone-100">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "عنوان الواجب" : "Title"}</p>
                  <h4 className="text-lg font-black text-stone-850">{previewAsm.title}</h4>
                  {((previewAsm.target_classes && previewAsm.target_classes.length > 0) || previewAsm.grade) && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <GraduationCap size={13} className="text-primary" />
                      <span className="text-[11px] font-bold text-stone-500">{isRTL ? "الفصول المستهدفة:" : "Classes:"}</span>
                      {Array.isArray(previewAsm.target_classes) && previewAsm.target_classes.length > 0 ? (
                        previewAsm.target_classes.map((tc, idx) => (
                          <Badge key={tc.id || idx} className="bg-amber-100 text-amber-800 border-none text-[10px] font-bold px-2 py-0.5">
                            {tc.label || `الصف ${tc.grade} (${tc.section})`}
                          </Badge>
                        ))
                      ) : (
                        <Badge className="bg-amber-100 text-amber-800 border-none text-[10px] font-bold px-2 py-0.5">
                          الصف {previewAsm.grade} {previewAsm.section ? `(${previewAsm.section})` : ''}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-4">
                  <div className="text-center bg-white px-3 py-1.5 rounded-xl border border-stone-200">
                    <p className="text-[10px] font-bold text-stone-400">{isRTL ? "الدرجة الكلية" : "Total Points"}</p>
                    <p className="text-base font-black text-primary num-en">{previewAsm.points}</p>
                  </div>
                  <div className="text-center bg-white px-3 py-1.5 rounded-xl border border-stone-200">
                    <p className="text-[10px] font-bold text-stone-400">{isRTL ? "الأسئلة" : "Questions"}</p>
                    <p className="text-base font-black text-stone-800 num-en">{previewAsm.questionsCount}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h5 className="font-bold text-stone-900 border-b border-stone-50 pb-2">{isRTL ? "الأسئلة والتقييمات:" : "Questions:"}</h5>
                {previewAsm.questions?.map((q, idx) => (
                  <div key={q.id || idx} className="p-4 bg-white border border-stone-100 rounded-2xl space-y-2">
                    <div className="flex justify-between items-start gap-4">
                      <span className="font-bold text-stone-900 text-sm">
                        {idx + 1}. {q.text}
                      </span>
                      <Badge className="bg-primary/5 text-primary border-none rounded-lg text-[10px] font-bold px-2 py-0.5 whitespace-nowrap">
                        {q.points} {isRTL ? "نقاط" : "pts"}
                      </Badge>
                    </div>

                    {(q.type === "mcq" || q.type === "checkbox") && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                        {q.options?.map((opt, oIdx) => {
                          const isCorrect = Array.isArray(q.correctAnswer)
                            ? q.correctAnswer.includes(opt)
                            : q.correctAnswer === opt;
                          return (
                            <div key={oIdx} className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                              isCorrect ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-stone-50 border-stone-100 text-stone-600"
                            }`}>
                              <div className={`h-3.5 w-3.5 rounded-full border flex items-center justify-center shrink-0 ${isCorrect ? "border-emerald-500 bg-emerald-500 text-white" : "border-stone-300"}`}>
                                {isCorrect && <Check size={10} />}
                              </div>
                              <span>{opt}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {q.type === "short" && (
                      <div className="pt-2 text-xs">
                        <span className="text-stone-400 font-bold">{isRTL ? "الإجابة النموذجية:" : "Model Answer:"} </span>
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg">{q.correctAnswer}</span>
                      </div>
                    )}

                    {q.type === "paragraph" && (
                      <div className="pt-2 text-xs text-stone-400 font-semibold italic">
                        {isRTL ? "[سؤال مقالي - يتطلب تصحيح يدوي]" : "[Essay Question - requires manual grading]"}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
