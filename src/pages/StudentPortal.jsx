import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { 
  Sparkles, 
  Trophy, 
  Clock, 
  Star, 
  Zap, 
  Rocket,
  ChevronLeft,
  PlayCircle,
  FileText,
  Award,
  ArrowUpRight,
  LogOut,
  ShoppingBag,
  Calendar,
  GraduationCap,
  MapPin,
  BookOpen,
  CheckCircle2,
  Megaphone,
  ClipboardCheck,
  BookMarked,
  ExternalLink,
  Download,
  ChevronDown
} from "lucide-react";
import PortalGrades from "@/components/portal/PortalGrades";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/translations";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/AuthContext";
import StudentSidebar from "@/components/layout/StudentSidebar";
import StudentIDCard from "@/components/student-dashboard/StudentIDCard";
import VisualSchedule from "@/components/schedule/VisualSchedule";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PageHeader from "@/components/shared/PageHeader";
import StudentLevelsXP from "@/components/student-dashboard/StudentLevelsXP";

const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all border-2 border-stone-300 bg-white text-stone-800 hover:bg-stone-50 hover:border-stone-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const btnPrimary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all bg-stone-900 text-white hover:bg-black cursor-pointer shadow-lg shadow-stone-200 disabled:opacity-50 disabled:cursor-not-allowed";

export default function StudentPortal() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const view = searchParams.get("view");
  const subjectIdParam = searchParams.get("subjectId");
  const [activeSubjectTab, setActiveSubjectTab] = useState("lessons"); // 'lessons' | 'assignments' | 'exams' | 'textbook'
  const [selectedBookIdx, setSelectedBookIdx] = useState(0);
  const [isSwiping, setIsSwiping] = React.useState(null); // null | "gate_in" | "gate_out"

  const handleGateSwipe = async (type) => {
    if (!student.id) return;
    setIsSwiping(type);
    try {
      const timeStr = new Date().toLocaleTimeString(isRTL ? "ar-EG" : "en-US", { 
        hour: "2-digit", 
        minute: "2-digit" 
      });

      await base44.entities.Attendance.create({
        student_id: student.id,
        student_name: student.full_name || student.name,
        student_card_id: student.student_id || student.id,
        date: new Date().toISOString().split('T')[0],
        type: type,
        status: "present",
        time: timeStr,
        recorded_by: "NFC Smart Gate Simulator",
        notes: isRTL ? "تم مسح بطاقة الطالب NFC بنجاح عند البوابة المدرسية." : "Student NFC card swiped successfully at school gate."
      });

      // Invalidate queries to refresh data in parent and student portals
      queryClient.invalidateQueries({ queryKey: ["student-attendance", student.id] });
      queryClient.invalidateQueries({ queryKey: ["student-attendance", student.student_id] });
      queryClient.invalidateQueries({ queryKey: ["student-profile", studentId] });

      toast.success(
        isRTL 
          ? `📲 تم تسجيل ${type === "gate_in" ? "الدخول" : "الخروج"} بنجاح عند البوابة المدرسية (${timeStr})!` 
          : `📲 Swipe ${type === "gate_in" ? "Entrance" : "Exit"} recorded successfully at gate (${timeStr})!`
      );
    } catch (err) {
      console.error(err);
      toast.error(isRTL ? "فشل تسجيل حضور البوابة الذكية" : "Failed to record smart gate attendance");
    } finally {
      setIsSwiping(null);
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem("portal_role");
    localStorage.removeItem("portal_user_id");
    localStorage.removeItem("portal_user_name");
    logout(false);
    window.location.href = "/";
  };

  // Mock student data
  const studentId = localStorage.getItem("portal_user_id") || "S-505";
  
  const { data: student = {} } = useQuery({ 
    queryKey: ["student-profile", studentId], 
    queryFn: () => base44.entities.Student.get(studentId) 
  });

  const { data: storePurchases = [] } = useQuery({
    queryKey: ["store-purchases", studentId],
    queryFn: () => base44.entities.Purchase.filter({ student_id: studentId })
  });

  const { data: attendanceLogs = [] } = useQuery({
    queryKey: ["student-attendance", studentId],
    queryFn: () => base44.entities.Attendance.filter({ student_id: studentId }, "-date")
  });

  const { data: allStudyMaterials = [] } = useQuery({
    queryKey: ["student-all-study-materials"],
    queryFn: () => base44.entities.StudyMaterial.list("-created_date", 200)
  });

  const { data: materials = [] } = useQuery({
    queryKey: ["student-materials"],
    queryFn: () => base44.entities.StudyMaterial.list("-created_date", 4)
  });

  const { data: studentGrades = [] } = useQuery({
    queryKey: ["student-portal-grades", student?.student_id || studentId],
    queryFn: () => base44.entities.StudentGrade.filter({ student_id: student?.student_id || studentId }),
    enabled: !!(student?.student_id || studentId)
  });

  const { data: studentSubjects = [] } = useQuery({
    queryKey: ["student-subjects", student?.grade],
    queryFn: () => base44.entities.Subject.filter({ grade: student?.grade }),
    enabled: !!student?.grade
  });

  const { data: studentAwards = [] } = useQuery({
    queryKey: ["student-awards", student?.student_id],
    queryFn: () => base44.entities.StudentAward.filter({ student_id: student?.student_id }, "-date"),
    enabled: !!student?.student_id
  });

  const { data: allLibraryBooks = [] } = useQuery({
    queryKey: ["student-library-books"],
    queryFn: () => base44.entities.LibraryBook.list("-created_at", 100)
  });

  const { data: classStudents = [] } = useQuery({
    queryKey: ["class-students", student?.grade],
    queryFn: () => base44.entities.Student.filter({ grade: student?.grade }),
    enabled: !!student?.grade
  });

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [selectedAsm, setSelectedAsm] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadAssignments = (e) => {
    const saved = localStorage.getItem("edu_assignments");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (e && e.key === "edu_assignments") {
        const oldVal = e.oldValue ? JSON.parse(e.oldValue) : [];
        if (parsed.length > oldVal.length) {
          const newAsm = parsed[0];
          if (newAsm) {
            toast.success(
              isRTL 
                ? `🔔 واجب جديد مضاف: ${newAsm.title} لمادة ${newAsm.subject}` 
                : `🔔 New Assignment Added: ${newAsm.title} for ${newAsm.subject}`,
              { duration: 6000 }
            );
          }
        }
      }
      setAssignments(parsed);
    }
  };

  useEffect(() => {
    loadAssignments();
    window.addEventListener("storage", loadAssignments);
    return () => window.removeEventListener("storage", loadAssignments);
  }, []);

  const handleStartTask = (asm) => {
    const savedSubmissions = localStorage.getItem("edu_submissions");
    const submissions = savedSubmissions ? JSON.parse(savedSubmissions) : {};
    const asmSubs = submissions[asm.id] || [];
    const studentId = localStorage.getItem("portal_user_id") || "STU-882";
    const alreadySubmitted = asmSubs.some(s => s.studentId === studentId);

    if (alreadySubmitted) {
      toast.info(isRTL ? "لقد قمت بتسليم هذا الواجب بالفعل!" : "You have already submitted this assignment!");
      return;
    }

    setSelectedAsm(asm);
    const initialAnswers = {};
    asm.questions.forEach(q => {
      initialAnswers[q.id] = q.type === "checkbox" ? [] : "";
    });
    setAnswers(initialAnswers);
    setShowFormModal(true);
  };

  const handleCheckboxChange = (qId, option, checked) => {
    setAnswers(prev => {
      const current = prev[qId] || [];
      const updated = checked 
        ? [...current, option]
        : current.filter(o => o !== option);
      return { ...prev, [qId]: updated };
    });
  };

  const handleSubmitAnswers = () => {
    setIsSubmitting(true);
    try {
      const studentName = localStorage.getItem("portal_user_name") || "أحمد علي الخطيب";
      const studentId = localStorage.getItem("portal_user_id") || "STU-882";
      
      let autoScore = 0;
      const grades = {};
      
      selectedAsm.questions.forEach(q => {
        const studentAns = answers[q.id];
        if (q.type === "mcq") {
          const isCorrect = studentAns === q.correctAnswer;
          grades[q.id] = isCorrect ? q.points : 0;
          autoScore += grades[q.id];
        } else if (q.type === "checkbox") {
          const correct = q.correctAnswer || [];
          const ans = studentAns || [];
          const isCorrect = correct.length === ans.length && correct.every(val => ans.includes(val));
          grades[q.id] = isCorrect ? q.points : 0;
          autoScore += grades[q.id];
        } else {
          grades[q.id] = null;
        }
      });

      const newSubmission = {
        id: `sub-${Date.now()}`,
        studentName,
        studentId,
        submittedAt: new Date().toISOString().replace("T", " ").substring(0, 16),
        status: selectedAsm.questions.some(q => q.type === "short" || q.type === "paragraph") ? "pending" : "graded",
        score: autoScore,
        answers,
        grades,
        feedback: ""
      };

      const savedSubmissions = localStorage.getItem("edu_submissions");
      const submissions = savedSubmissions ? JSON.parse(savedSubmissions) : {};
      const asmSubs = submissions[selectedAsm.id] || [];
      
      const filteredSubs = asmSubs.filter(s => s.studentId !== studentId);
      submissions[selectedAsm.id] = [...filteredSubs, newSubmission];
      localStorage.setItem("edu_submissions", JSON.stringify(submissions));

      const savedAssignments = localStorage.getItem("edu_assignments");
      if (savedAssignments) {
        const asms = JSON.parse(savedAssignments);
        const updatedAsms = asms.map(asm => {
          if (asm.id === selectedAsm.id) {
            const currentSubs = submissions[asm.id] || [];
            const gradedSubs = currentSubs.filter(s => s.status === "graded");
            const totalScore = gradedSubs.reduce((sum, s) => sum + s.score, 0);
            return {
              ...asm,
              submissionsCount: currentSubs.length,
              gradedCount: gradedSubs.length,
              averageScore: gradedSubs.length > 0 ? parseFloat((totalScore / gradedSubs.length).toFixed(1)) : asm.averageScore
            };
          }
          return asm;
        });
        localStorage.setItem("edu_assignments", JSON.stringify(updatedAsms));
        setAssignments(updatedAsms);
      }

      toast.success(isRTL ? "تم تسليم الواجب بنجاح!" : "Assignment submitted successfully!");
      setShowFormModal(false);
      loadAssignments();
    } catch (e) {
      console.error(e);
      toast.error(isRTL ? "حدث خطأ أثناء إرسال الواجب" : "Failed to submit assignment");
    }
    setIsSubmitting(false);
  };

  const { data: studentSchedules = [] } = useQuery({
    queryKey: ["student-schedules", student?.grade],
    queryFn: () => base44.entities.ClassSchedule.filter({ grade: student?.grade }),
    enabled: !!student?.grade,
    staleTime: 1000 * 60 * 10
  });

  const { data: studentTasks = [] } = useQuery({
    queryKey: ["student-tasks", student?.grade],
    queryFn: () => base44.entities.TeacherTask.filter({ grade: student?.grade }),
    enabled: !!student?.grade,
    staleTime: 1000 * 60 * 10
  });

  const { data: officialAnnouncements = [] } = useQuery({
    queryKey: ["official-announcements-student"],
    queryFn: () => base44.entities.OfficialAnnouncement.list("-created_at", 50),
    staleTime: 1000 * 60 * 10
  });

  const studentAnnouncements = React.useMemo(() => {
    return officialAnnouncements.filter(a => a.target_audience === "students" || a.target_audience === "all");
  }, [officialAnnouncements]);

  const activeHighPriorityAnnouncements = React.useMemo(() => {
    return studentAnnouncements.filter(a => a.priority === "high");
  }, [studentAnnouncements]);

  // Calculate dynamic XP and Level
  const baseXP = 500;
  const awardsXP = studentAwards.reduce((sum, a) => sum + (Number(a.points) || 0), 0);
  
  // Homework XP
  const savedSubmissionsForXP = localStorage.getItem("edu_submissions") ? JSON.parse(localStorage.getItem("edu_submissions")) : {};
  const studentIdForXP = student.student_id || studentId;
  let homeworkXP = 0;
  assignments.forEach(task => {
    const asmSubs = savedSubmissionsForXP[task.id] || [];
    const sub = asmSubs.find(s => s.studentId === studentIdForXP || s.studentId === student.id);
    if (sub && sub.score) {
      homeworkXP += Number(sub.score) || 0;
    }
  });

  // Attendance XP (50 XP per present day / gate_in)
  const presentDaysCount = attendanceLogs.filter(l => l.status === "present" || l.type === "gate_in").length;
  const attendanceXP = presentDaysCount * 50;

  const totalXP = baseXP + awardsXP + homeworkXP + attendanceXP;
  const studentLevel = Math.floor(totalXP / 500) + 1;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  return (
    <div className={`min-h-screen bg-stone-50 text-stone-900 ${isRTL ? 'font-cairo' : 'font-sans'}`} dir={isRTL ? "rtl" : "ltr"}>
      <StudentSidebar />
      <main className={`transition-all duration-300 min-h-screen pt-16 lg:pt-0 ${isRTL ? "lg:mr-64" : "lg:ml-64"}`}>
        <div className="p-6 md:p-10 lg:p-12 max-w-7xl mx-auto space-y-10 pb-24">
          {view === "schedule" ? (
            <div className="space-y-6">
              <PageHeader 
                title={isRTL ? "الجدول الدراسي الأسبوعي" : "Weekly Class Schedule"} 
                subtitle={isRTL ? `عرض الجدول الكامل والمواد المسجلة - الصف ${student.grade || ""}` : `View full schedule and registered subjects - Grade ${student.grade || ""}`}
              >
                <button onClick={() => window.location.href = "/student-portal"} className={`${btnOutline} h-11 px-5 rounded-xl`}>
                  {isRTL ? "العودة للوحة التحكم" : "Back to Dashboard"}
                </button>
              </PageHeader>
              <Card className="p-6 md:p-8 bg-white border-none shadow-sm rounded-[32px]">
                <VisualSchedule classes={studentSchedules} tasks={studentTasks} />
              </Card>
            </div>
          ) : view === "levels" ? (
            <div className="space-y-6">
              <PageHeader 
                title={isRTL ? "نظام المستويات ونقاط الخبرة" : "Levels & XP System"} 
                subtitle={isRTL ? "متابعة تقدمك ونقاطك التي كسبتها خلال الفصل الدراسي الحالي." : "Track your progress and XP earned during the current term."}
              />
              <StudentLevelsXP 
                student={student}
                studentAwards={studentAwards}
                assignments={assignments}
                attendanceLogs={attendanceLogs}
                classStudents={classStudents}
                isRTL={isRTL}
              />
            </div>
          ) : view === "notifications" ? (
            <div className="space-y-6">
              <PageHeader 
                title={isRTL ? "التعاميم والقرارات الرسمية" : "Official Announcements"} 
                subtitle={isRTL ? "جميع القرارات والتعاميم الموجهة لك من قبل الإدارة المدرسية." : "All decisions and announcements directed to you by school administration."}
              >
                <button onClick={() => window.location.href = "/student-portal"} className={`${btnOutline} h-11 px-5 rounded-xl`}>
                  {isRTL ? "العودة للوحة التحكم" : "Back to Dashboard"}
                </button>
              </PageHeader>
              
              <div className="space-y-4 max-w-4xl mx-auto pt-4">
                {studentAnnouncements.length === 0 ? (
                  <Card className="p-16 text-center border-dashed border-2 border-stone-200 bg-stone-50/50 text-stone-400 rounded-[40px]">
                    <Megaphone size={48} className="mb-4 opacity-20 mx-auto" />
                    <p className="font-bold text-lg">{isRTL ? "لا توجد تعاميم منشورة حالياً" : "No official announcements published yet"}</p>
                  </Card>
                ) : (
                  studentAnnouncements.map(ann => {
                    const isRead = JSON.parse(localStorage.getItem("read_announcements") || "[]").includes(ann.id);
                    return (
                      <Card key={ann.id} className="p-6 bg-white border-none shadow-sm rounded-[30px] relative overflow-hidden">
                        {ann.priority === "high" && (
                          <div className="absolute top-0 right-0 left-0 h-1.5 bg-rose-500" />
                        )}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-base font-bold text-stone-900">{ann.title}</h4>
                            {ann.priority === "high" && (
                              <Badge className="bg-rose-50 text-rose-600 border-none rounded-lg text-[9px] font-black px-2 py-0.5">
                                {isRTL ? "هام جداً" : "Urgent"}
                              </Badge>
                            )}
                          </div>
                          <p className="text-stone-600 text-sm whitespace-pre-line leading-relaxed">
                            {ann.content}
                          </p>
                          <div className="flex justify-between items-center text-[10px] text-stone-400 font-bold uppercase tracking-wider pt-2">
                            <span>{ann.created_at ? new Date(ann.created_at).toLocaleDateString(isRTL ? "ar-EG" : "en-US") : ""}</span>
                            {!isRead && (
                              <button
                                onClick={() => {
                                  const read = JSON.parse(localStorage.getItem("read_announcements") || "[]");
                                  if (!read.includes(ann.id)) {
                                    localStorage.setItem("read_announcements", JSON.stringify([...read, ann.id]));
                                    window.location.reload();
                                  }
                                }}
                                className="text-xs font-bold text-rose-500 hover:underline border-none bg-transparent cursor-pointer"
                              >
                                {isRTL ? "تحديد كمقروء" : "Mark as read"}
                              </button>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          ) : view === "materials" ? (
            <div className="space-y-6">
              {subjectIdParam ? (() => {
                const decodedName = decodeURIComponent(subjectIdParam);
                const selectedSubject = studentSubjects.find(s => s.id === subjectIdParam || s.name === decodedName);
                
                if (!selectedSubject) {
                  return (
                    <div className="text-center py-12">
                      <p className="text-stone-500 font-bold">{isRTL ? "لم يتم العثور على المادة الدراسية." : "Subject not found."}</p>
                      <button onClick={() => navigate("/student-portal?view=materials")} className={`${btnOutline} mt-4 px-4 h-10`}>
                        {isRTL ? "العودة للمواد الدراسية" : "Back to Subjects"}
                      </button>
                    </div>
                  );
                }

                // Filter data
                const subjectMaterials = allStudyMaterials.filter(m => 
                  m.subject_id === selectedSubject.id || 
                  m.subject_name?.toLowerCase() === selectedSubject.name?.toLowerCase()
                );

                const subjectTasks = studentTasks.filter(t => 
                  t.subject_id === selectedSubject.id || 
                  t.subject_name?.toLowerCase() === selectedSubject.name?.toLowerCase()
                );

                const subjectLocalStorageAsms = assignments.filter(a => 
                  a.subject?.toLowerCase() === selectedSubject.name?.toLowerCase()
                );

                const subjectGradesList = studentGrades.filter(g => 
                  g.subject_name?.toLowerCase().includes(selectedSubject.name?.toLowerCase())
                );

                const getFileIcon = (type) => {
                  const t = type?.toLowerCase();
                  if (t?.includes("pdf") || t?.includes("doc")) return { icon: FileText, color: "text-rose-500", bg: "bg-rose-50" };
                  if (t?.includes("video") || t?.includes("mp4")) return { icon: PlayCircle, color: "text-blue-500", bg: "bg-blue-50" };
                  return { icon: BookOpen, color: "text-teal-650", bg: "bg-teal-50" };
                };

                // --- Textbook: filter LibraryBooks linked to this subject ---
                const subjectBooks = allLibraryBooks.filter(b =>
                  b.subject_id === selectedSubject.id ||
                  b.subject_name?.toLowerCase() === selectedSubject.name?.toLowerCase()
                );

                return (
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <button 
                        onClick={() => navigate("/student-portal?view=materials")} 
                        className={`${btnOutline} h-10 px-4 rounded-xl flex items-center gap-1.5`}
                      >
                        <ChevronLeft size={16} className={isRTL ? "rotate-180" : ""} />
                        <span>{isRTL ? "العودة للمواد" : "Back to Subjects"}</span>
                      </button>
                      
                      <Badge className="bg-teal-50 text-teal-600 border-none font-bold text-xs px-3 py-1 rounded-xl">
                        {isRTL ? "الصف" : "Grade"} {selectedSubject.grade}
                      </Badge>
                    </div>

                    {/* Subject Card Banner */}
                    <div className="relative p-8 bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-700 text-white rounded-[32px] shadow-xl overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                          <div className="h-16 w-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 shrink-0">
                            <BookOpen size={32} className="text-white" />
                          </div>
                          <div>
                            <h2 className="text-2xl md:text-3xl font-serif font-black tracking-tight">{selectedSubject.name}</h2>
                            <p className="text-teal-100 text-xs font-semibold mt-1">
                              {isRTL ? `كود المادة: ${selectedSubject.code || "—"}` : `Subject Code: ${selectedSubject.code || "—"}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-left md:text-right">
                          <p className="text-teal-200 font-bold uppercase tracking-widest text-[9px]">{isRTL ? "معلم المادة" : "Responsible Teacher"}</p>
                          <p className="text-lg font-serif font-black mt-0.5">{selectedSubject.teacher_name || (isRTL ? "لم يتم التحديد" : "Not Assigned")}</p>
                        </div>
                      </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex border-b border-stone-200">
                      {[
                        { id: "lessons", label: isRTL ? "📚 الدروس اليومية" : "📚 Daily Lessons", count: subjectMaterials.length },
                        { id: "assignments", label: isRTL ? "📝 الواجبات" : "📝 Assignments", count: subjectTasks.length + subjectLocalStorageAsms.length },
                        { id: "exams", label: isRTL ? "🏆 الاختبارات والدرجات" : "🏆 Exams & Grades", count: subjectGradesList.length },
                        { id: "textbook", label: isRTL ? "📖 كتاب المادة" : "📖 Textbook", count: subjectBooks.length }
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveSubjectTab(tab.id)}
                          className={`py-3 px-6 text-sm font-bold border-b-2 transition-all relative ${
                            activeSubjectTab === tab.id 
                              ? "border-teal-600 text-teal-600" 
                              : "border-transparent text-stone-500 hover:text-stone-850"
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            {tab.label}
                            <Badge className={`border-none rounded-lg text-[9px] px-1.5 py-0.5 leading-none ${
                              activeSubjectTab === tab.id ? "bg-teal-100 text-teal-700" : "bg-stone-100 text-stone-500"
                            }`}>
                              {tab.count}
                            </Badge>
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Tab Content */}
                    <div className="pt-2">
                      {activeSubjectTab === "lessons" && (
                        <div className="space-y-4">
                          {subjectMaterials.length === 0 ? (
                            <Card className="p-16 text-center border-dashed border-2 border-stone-200 bg-stone-50/50 text-stone-400 rounded-[30px]">
                              <BookOpen size={40} className="mb-3 opacity-20 mx-auto" />
                              <p className="font-bold text-sm">{isRTL ? "لا توجد مواد أو دروس مرفوعة حالياً." : "No study materials or daily lessons uploaded yet."}</p>
                            </Card>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {subjectMaterials.map(mat => {
                                const style = getFileIcon(mat.type);
                                return (
                                  <Card key={mat.id} className="p-5 bg-white border-none shadow-sm rounded-2xl flex items-center justify-between hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-4 min-w-0">
                                      <div className={`h-11 w-11 rounded-xl ${style.bg} ${style.color} flex items-center justify-center shrink-0`}>
                                        <style.icon size={20} />
                                      </div>
                                      <div className="min-w-0">
                                        <h4 className="font-bold text-stone-850 text-sm truncate">{mat.title}</h4>
                                        <p className="text-[10px] text-stone-400 font-bold mt-0.5">
                                          {isRTL ? "تم الرفع بتاريخ: " : "Uploaded: "}
                                          <span className="num-en">{mat.created_date ? new Date(mat.created_date).toLocaleDateString(isRTL ? "ar-EG" : "en-US") : ""}</span>
                                        </p>
                                      </div>
                                    </div>
                                    <a 
                                      href={mat.file_url || "#"} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className={`${btnOutline} h-9 px-4 rounded-xl text-xs gap-1.5`}
                                    >
                                      {isRTL ? "عرض الملف 📥" : "View File 📥"}
                                    </a>
                                  </Card>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {activeSubjectTab === "assignments" && (
                        <div className="space-y-4">
                          {/* Live/Database Tasks */}
                          {subjectTasks.length > 0 && (
                            <div className="space-y-3">
                              <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest px-1">
                                {isRTL ? "المهام والأنشطة المقررة" : "Scheduled Tasks & Assignments"}
                              </h4>
                              {subjectTasks.map(task => (
                                <Card key={task.id} className="p-5 bg-white border-none shadow-sm rounded-2xl flex items-center justify-between hover:shadow-md transition-shadow">
                                  <div className="flex items-center gap-4">
                                    <div className="h-11 w-11 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                                      <FileText size={20} />
                                    </div>
                                    <div>
                                      <h5 className="font-bold text-stone-850 text-sm">{task.title}</h5>
                                      <p className="text-[10px] text-rose-500 font-bold mt-0.5 flex items-center gap-1">
                                        <Clock size={10} /> {isRTL ? "تاريخ التسليم:" : "Due Date:"} <span className="num-en">{task.due_date}</span>
                                      </p>
                                    </div>
                                  </div>
                                  <Badge className="bg-stone-50 border-none text-stone-500 font-bold text-[10px] px-2.5 py-1 rounded-lg">
                                    {task.points || 10} {isRTL ? "درجات" : "points"}
                                  </Badge>
                                </Card>
                              ))}
                            </div>
                          )}

                          {/* Local Storage Interactive Assignments */}
                          <div className="space-y-3">
                            <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest px-1">
                              {isRTL ? "الواجبات التفاعلية والمنزلية" : "Interactive Homework"}
                            </h4>
                            
                            {(() => {
                              const savedSubmissions = localStorage.getItem("edu_submissions") ? JSON.parse(localStorage.getItem("edu_submissions")) : {};
                              const studentIdVal = localStorage.getItem("portal_user_id") || "STU-882";
                              const totalSubjHomeworkCount = subjectLocalStorageAsms.length;
                              const completedSubjCount = subjectLocalStorageAsms.filter(task => {
                                const asmSubs = savedSubmissions[task.id] || [];
                                return asmSubs.some(s => s.studentId === studentIdVal);
                              }).length;
                              const subjProgressPct = totalSubjHomeworkCount > 0 ? Math.round((completedSubjCount / totalSubjHomeworkCount) * 100) : 0;

                              return totalSubjHomeworkCount > 0 && (
                                <Card className="p-5 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-100 rounded-2xl mb-4">
                                  <div className="flex justify-between items-center mb-2">
                                    <div>
                                      <h5 className="text-xs font-bold text-teal-800">{isRTL ? "معدل إنجاز الواجبات التفاعلية للمادة" : "Subject Homework Progress"}</h5>
                                      <p className="text-[10px] text-stone-500 mt-0.5">{isRTL ? `تم تسليم ${completedSubjCount} من أصل ${totalSubjHomeworkCount} واجب` : `Submitted ${completedSubjCount} of ${totalSubjHomeworkCount} homeworks`}</p>
                                    </div>
                                    <span className="text-sm font-black text-teal-650 num-en">{subjProgressPct}%</span>
                                  </div>
                                  <div className="h-2 bg-stone-200/60 rounded-full overflow-hidden">
                                    <div className="h-full bg-teal-600 rounded-full transition-all duration-500" style={{ width: `${subjProgressPct}%` }} />
                                  </div>
                                </Card>
                              );
                            })()}

                            {subjectLocalStorageAsms.length === 0 && subjectTasks.length === 0 ? (
                              <Card className="p-16 text-center border-dashed border-2 border-stone-200 bg-stone-50/50 text-stone-400 rounded-[30px]">
                                <FileText size={40} className="mb-3 opacity-20 mx-auto" />
                                <p className="font-bold text-sm">{isRTL ? "لا توجد واجبات للمادة حالياً." : "No homework set for this subject yet."}</p>
                              </Card>
                            ) : (
                              subjectLocalStorageAsms.map(task => {
                                const savedSubmissions = localStorage.getItem("edu_submissions");
                                const submissions = savedSubmissions ? JSON.parse(savedSubmissions) : {};
                                const asmSubs = submissions[task.id] || [];
                                const studentIdVal = localStorage.getItem("portal_user_id") || "STU-882";
                                const isDone = asmSubs.some(s => s.studentId === studentIdVal);
                                const submission = asmSubs.find(s => s.studentId === studentIdVal);

                                return (
                                  <Card key={task.id} className="p-5 bg-white border-none shadow-sm rounded-2xl flex items-center justify-between hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-4">
                                      <div className={`h-11 w-11 rounded-xl ${isDone ? "bg-emerald-50 text-emerald-600" : "bg-teal-50 text-teal-600"} flex items-center justify-center shrink-0`}>
                                        <FileText size={20} />
                                      </div>
                                      <div>
                                        <h5 className="font-bold text-stone-850 text-sm">{task.title}</h5>
                                        <p className="text-[10px] text-rose-500 font-bold mt-0.5 flex items-center gap-1">
                                          <Clock size={10} /> {isRTL ? "تاريخ التسليم:" : "Due Date:"} <span className="num-en">{task.dueDate}</span>
                                          {isDone && (
                                            <>
                                              <span className="h-1 w-1 rounded-full bg-stone-200 mx-1.5" />
                                              <span className="text-emerald-600 font-bold">
                                                {isRTL ? "تم التسليم" : "Submitted"}
                                                {submission?.status === "graded" && ` (${submission.score}/${task.points})`}
                                              </span>
                                            </>
                                          )}
                                        </p>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => handleStartTask(task)}
                                      disabled={isDone}
                                      className={`rounded-xl h-9 px-4 text-xs font-bold transition-all border-none cursor-pointer ${
                                        isDone 
                                          ? "bg-emerald-50 text-emerald-600 cursor-default"
                                          : "bg-stone-50 text-stone-900 hover:bg-stone-900 hover:text-white"
                                      }`}
                                    >
                                      {isDone ? (isRTL ? "تم إنجازه" : "Completed") : (isRTL ? "حل الواجب" : "Solve")}
                                    </button>
                                  </Card>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}

                      {activeSubjectTab === "exams" && (
                        <div className="space-y-4">
                          {subjectGradesList.length === 0 ? (
                            <Card className="p-16 text-center border-dashed border-2 border-stone-200 bg-stone-50/50 text-stone-400 rounded-[30px]">
                              <Trophy size={40} className="mb-3 opacity-20 mx-auto" />
                              <p className="font-bold text-sm">{isRTL ? "لا توجد نتائج اختبارات مرصودة بعد." : "No exam grades recorded yet."}</p>
                            </Card>
                          ) : (
                            <div className="space-y-3">
                              {subjectGradesList.map(g => {
                                const pct = Math.round((g.score / (g.max_score || 100)) * 100);
                                return (
                                  <Card key={g.id} className="p-5 bg-white border-none shadow-sm rounded-2xl">
                                    <div className="flex items-center justify-between mb-3">
                                      <div>
                                        <h5 className="font-serif font-black text-stone-850 text-sm">{g.subject_name}</h5>
                                        <p className="text-[10px] text-stone-400 font-bold mt-0.5 uppercase tracking-wide">{g.term}</p>
                                      </div>
                                      <div className="text-right">
                                        <span className="font-mono font-bold text-sm text-stone-800 num-en">{g.score} / {g.max_score || 100}</span>
                                        <Badge className={`mx-2 ${
                                          pct >= 85 ? "bg-emerald-50 text-emerald-600" :
                                          pct >= 70 ? "bg-blue-50 text-blue-600" :
                                          pct >= 50 ? "bg-amber-50 text-amber-600" :
                                          "bg-rose-50 text-rose-600"
                                        } border-none font-black text-[9px] rounded-lg`}>
                                          {g.grade_label || `${pct}%`}
                                        </Badge>
                                      </div>
                                    </div>
                                    <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                                      <div className={`h-full rounded-full transition-all ${
                                        pct >= 85 ? "bg-emerald-500" : pct >= 70 ? "bg-blue-500" : pct >= 50 ? "bg-amber-500" : "bg-rose-500"
                                      }`} style={{ width: `${pct}%` }} />
                                    </div>
                                    {g.notes && <p className="text-[10px] text-stone-500 mt-2.5 italic bg-stone-50 p-2.5 rounded-lg font-medium">{g.notes}</p>}
                                  </Card>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {activeSubjectTab === "textbook" && (
                        <div className="space-y-5">
                          {subjectBooks.length === 0 ? (
                            <Card className="p-16 text-center border-dashed border-2 border-stone-200 bg-stone-50/50 text-stone-400 rounded-[30px]">
                              <BookMarked size={48} className="mb-4 opacity-15 mx-auto" />
                              <p className="font-bold text-sm">{isRTL ? "لم يتم ربط كتاب مدرسي بهذه المادة بعد." : "No textbook linked to this subject yet."}</p>
                              <p className="text-[11px] mt-1.5 text-stone-400">{isRTL ? "يمكن للمشرف إضافة كتاب المادة من صفحة المكتبة الإلكترونية." : "The admin can link a textbook from the Library page."}</p>
                            </Card>
                          ) : (
                            <>
                              {/* Book Selector (if multiple books) */}
                              {subjectBooks.length > 1 && (
                                <div className="flex items-center gap-3 flex-wrap">
                                  <span className="text-xs font-bold text-stone-500">{isRTL ? "اختر الكتاب:" : "Select Book:"}</span>
                                  <div className="flex gap-2 flex-wrap">
                                    {subjectBooks.map((bk, bkIdx) => (
                                      <button
                                        key={bk.id}
                                        onClick={() => setSelectedBookIdx(bkIdx)}
                                        className={`h-9 px-4 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                                          selectedBookIdx === bkIdx
                                            ? "bg-teal-600 text-white border-teal-600 shadow-lg shadow-teal-600/20"
                                            : "bg-white text-stone-600 border-stone-200 hover:border-teal-300"
                                        }`}
                                      >
                                        {bk.title}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {(() => {
                                const activeBook = subjectBooks[selectedBookIdx] || subjectBooks[0];
                                if (!activeBook) return null;

                                return (
                                  <div className="space-y-5">
                                    {/* Book Info Card */}
                                    <Card className="p-5 bg-gradient-to-br from-amber-50/60 via-white to-orange-50/40 border border-amber-100/60 rounded-2xl">
                                      <div className="flex items-start gap-5">
                                        {/* Thumbnail */}
                                        <div className="w-20 h-28 rounded-xl bg-stone-100 overflow-hidden border border-stone-200 shadow-md shrink-0">
                                          {activeBook.thumbnail_url ? (
                                            <img src={activeBook.thumbnail_url} alt={activeBook.title} className="w-full h-full object-cover" />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center text-stone-300">
                                              <BookMarked size={28} />
                                            </div>
                                          )}
                                        </div>
                                        {/* Details */}
                                        <div className="flex-1 min-w-0">
                                          <h4 className="font-serif font-black text-stone-900 text-lg leading-tight">{activeBook.title}</h4>
                                          {activeBook.author && (
                                            <p className="text-xs text-stone-500 font-semibold mt-1 flex items-center gap-1">
                                              <span className="text-stone-400">{isRTL ? "المؤلف:" : "Author:"}</span> {activeBook.author}
                                            </p>
                                          )}
                                          {activeBook.description && (
                                            <p className="text-[11px] text-stone-500 mt-2 leading-relaxed line-clamp-2">{activeBook.description}</p>
                                          )}
                                          <div className="flex items-center gap-2 mt-3 flex-wrap">
                                            <Badge className="bg-amber-100 text-amber-700 border-none font-bold text-[9px] rounded-lg px-2 py-0.5">
                                              PDF
                                            </Badge>
                                            {activeBook.subject_code && (
                                              <Badge className="bg-stone-100 text-stone-600 border-none font-bold text-[9px] rounded-lg px-2 py-0.5 num-en">
                                                {activeBook.subject_code}
                                              </Badge>
                                            )}
                                            <a
                                              href={activeBook.file_url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-600 hover:text-teal-700 hover:underline transition-colors"
                                            >
                                              <ExternalLink size={10} />
                                              {isRTL ? "فتح في نافذة جديدة" : "Open in new tab"}
                                            </a>
                                          </div>
                                        </div>
                                      </div>
                                    </Card>

                                    {/* Embedded PDF Viewer */}
                                    <Card className="overflow-hidden rounded-2xl border border-stone-200 shadow-sm bg-white">
                                      <div className="bg-stone-800 px-5 py-3 flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                          <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center">
                                            <BookMarked size={16} className="text-white" />
                                          </div>
                                          <div>
                                            <p className="text-white text-xs font-bold truncate max-w-[200px] md:max-w-md">{activeBook.title}</p>
                                            <p className="text-stone-400 text-[9px] font-semibold">{isRTL ? "عارض الكتاب المدرسي المضمّن" : "Embedded Textbook Viewer"}</p>
                                          </div>
                                        </div>
                                        <a
                                          href={activeBook.file_url}
                                          download
                                          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold transition-colors cursor-pointer border-none"
                                        >
                                          <Download size={12} />
                                          {isRTL ? "تحميل" : "Download"}
                                        </a>
                                      </div>
                                      <div className="relative w-full" style={{ height: "75vh", minHeight: "500px" }}>
                                        <iframe
                                          src={activeBook.file_url}
                                          title={activeBook.title}
                                          className="absolute inset-0 w-full h-full border-none"
                                          style={{ background: "#f5f5f4" }}
                                        />
                                      </div>
                                    </Card>
                                  </div>
                                );
                              })()}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })() : (
                <>
                  {studentSubjects.length === 0 ? (
                    <Card className="p-12 text-center bg-stone-50 border border-dashed border-stone-200 rounded-3xl">
                      <BookOpen className="h-8 w-8 text-stone-300 mx-auto mb-2" />
                      <p className="text-stone-400 text-xs font-bold">{isRTL ? "لا توجد مواد مخصصة لصفك الدراسي حالياً." : "No subjects assigned for your grade currently."}</p>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {studentSubjects.map((subject, idx) => (
                        <motion.div
                          key={subject.id || idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.05 * idx }}
                          onClick={() => navigate(`/student-portal?view=materials&subjectId=${subject.id || encodeURIComponent(subject.name)}`)}
                        >
                          <Card className="p-6 bg-white border-none shadow-sm rounded-3xl hover:shadow-md transition-shadow relative overflow-hidden group cursor-pointer hover:border-teal-500 border border-transparent">
                            <div className="flex items-center gap-4">
                              <div className="h-12 w-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                                <BookOpen size={24} />
                              </div>
                              <div>
                                <h4 className="font-bold text-stone-900 text-lg leading-tight group-hover:text-teal-600 transition-colors">{subject.name}</h4>
                                <p className="text-stone-400 text-xs font-semibold mt-1">
                                  {isRTL ? `كود المادة: ${subject.code || "—"}` : `Code: ${subject.code || "—"}`}
                                </p>
                              </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-stone-50 flex justify-between items-center text-xs">
                              <div>
                                <p className="text-stone-400 font-bold uppercase tracking-wider text-[9px]">
                                  {isRTL ? "معلم المادة" : "Teacher"}
                                </p>
                                <p className="text-stone-750 font-bold mt-0.5">
                                  {subject.teacher_name || (isRTL ? "غير محدد" : "Not Assigned")}
                                </p>
                              </div>
                              <Badge className="bg-stone-50 border-none text-stone-500 font-black px-2 py-0.5 rounded-lg text-[9px] uppercase tracking-wider num-en">
                                {isRTL ? "الصف" : "Grade"} {subject.grade}
                              </Badge>
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ) : view === "badges" ? (
            <div className="space-y-6">
              <PageHeader 
                title={isRTL ? "لوحة التكريمات والأوسمة" : "Honors & Badges Board"} 
                subtitle={isRTL ? "الأوسمة والتقديرات التي حصلت عليها من المعلمين تقديراً لتميزك." : "The awards and honors awarded to you by teachers in recognition of excellence."}
              >
                <button onClick={() => window.location.href = "/student-portal"} className={`${btnOutline} h-11 px-5 rounded-xl`}>
                  {isRTL ? "العودة للوحة التحكم" : "Back to Dashboard"}
                </button>
              </PageHeader>

              {studentAwards.length === 0 ? (
                <Card className="p-16 text-center bg-stone-50 border border-dashed border-stone-200 rounded-[40px]">
                  <Trophy className="h-12 w-12 text-stone-300 mx-auto mb-3 opacity-30" />
                  <p className="font-bold text-stone-400 text-base">{isRTL ? "لا توجد أوسمة مستحقة بعد." : "No honors earned yet."}</p>
                  <p className="text-stone-400 text-xs mt-1">{isRTL ? "أظهر تميزك في الحصص والواجبات للحصول على أول وسام!" : "Show excellence in classes and homework to earn your first badge!"}</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  {studentAwards.map((award, idx) => (
                    <motion.div
                      key={award.id || idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * idx }}
                    >
                      <Card className="p-6 bg-white border-none shadow-sm rounded-[32px] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 left-0 h-1.5 bg-amber-500" />
                        <div className="flex gap-4 items-start relative z-10">
                          <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                            <Trophy size={24} />
                          </div>
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-serif font-black text-stone-900 text-base">{award.title}</h4>
                              <Badge className="bg-amber-100 text-amber-700 border-none font-bold text-[9px] px-2 py-0.5 rounded-lg">
                                +{award.points} {isRTL ? "نقطة" : "XP"}
                              </Badge>
                            </div>
                            <p className="text-stone-600 text-xs leading-relaxed font-medium">
                              {award.description}
                            </p>
                            
                            <div className="pt-2 flex justify-between items-center border-t border-stone-50 text-[10px] text-stone-400 font-bold uppercase tracking-wider">
                              <span>
                                {isRTL ? "بواسطة:" : "Awarded by:"} {award.awarded_by}
                              </span>
                              <span className="num-en">
                                {award.date ? new Date(award.date).toLocaleDateString(isRTL ? "ar-EG" : "en-US") : ""}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          ) : view === "homework" ? (
            <div className="space-y-6">
              <PageHeader 
                title={isRTL ? "الواجبات والمهام الدراسية" : "Homework & Learning Tasks"} 
                subtitle={isRTL ? "عرض وحل جميع الواجبات والاختبارات المنزلية الخاصة بك" : "View and complete all your homework and quizzes"}
              >
                <button onClick={() => window.location.href = "/student-portal"} className={`${btnOutline} h-11 px-5 rounded-xl`}>
                  {isRTL ? "العودة للوحة التحكم" : "Back to Dashboard"}
                </button>
              </PageHeader>
              
              {(() => {
                const totalHomeworkCount = assignments.length;
                const savedSubmissions = localStorage.getItem("edu_submissions") ? JSON.parse(localStorage.getItem("edu_submissions")) : {};
                const studentIdVal = localStorage.getItem("portal_user_id") || "STU-882";
                const completedCount = assignments.filter(task => {
                  const asmSubs = savedSubmissions[task.id] || [];
                  return asmSubs.some(s => s.studentId === studentIdVal);
                }).length;
                const progressPct = totalHomeworkCount > 0 ? Math.round((completedCount / totalHomeworkCount) * 100) : 0;

                return totalHomeworkCount > 0 && (
                  <Card className="p-6 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-100 rounded-3xl mb-6 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <h4 className="text-sm font-bold text-teal-950">{isRTL ? "معدل إنجاز الواجبات العام" : "General Homework Completion"}</h4>
                        <p className="text-xs text-stone-500 mt-0.5">{isRTL ? `لقد أنجزت ${completedCount} واجب من أصل ${totalHomeworkCount}` : `You completed ${completedCount} out of ${totalHomeworkCount} assignments`}</p>
                      </div>
                      <span className="text-lg font-black text-teal-650 num-en">{progressPct}%</span>
                    </div>
                    <div className="h-3 bg-stone-200/60 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-600 rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
                    </div>
                  </Card>
                );
              })()}

              <div className="grid grid-cols-1 gap-4">
                {assignments.length === 0 ? (
                  <Card className="p-8 text-center bg-stone-50 border border-dashed border-stone-200 rounded-3xl">
                    <FileText className="h-8 w-8 text-stone-300 mx-auto mb-2" />
                    <p className="text-stone-400 text-xs font-bold">{isRTL ? "لا توجد واجبات دراسية حالياً." : "No homework assigned currently."}</p>
                  </Card>
                ) : (
                  assignments.map((task, i) => {
                    const colors = {
                      "اللغة العربية": { color: "text-amber-500", bg: "bg-amber-50" },
                      "العلوم": { color: "text-emerald-500", bg: "bg-emerald-50" },
                      "الرياضيات": { color: "text-blue-500", bg: "bg-blue-50" }
                    };
                    const theme = colors[task.subject] || { color: "text-indigo-500", bg: "bg-indigo-50" };
                    
                    const savedSubmissions = localStorage.getItem("edu_submissions");
                    const submissions = savedSubmissions ? JSON.parse(savedSubmissions) : {};
                    const asmSubs = submissions[task.id] || [];
                    const studentId = localStorage.getItem("portal_user_id") || "STU-882";
                    const isDone = asmSubs.some(s => s.studentId === studentId);
                    const submission = asmSubs.find(s => s.studentId === studentId);

                    return (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * i }}
                        className="group"
                      >
                        <Card className="p-6 border-none shadow-sm hover:shadow-xl transition-all duration-500 rounded-[32px] bg-white flex items-center justify-between group cursor-pointer overflow-hidden relative">
                          <div className="flex items-center gap-6 relative z-10">
                            <div className={`h-14 w-14 rounded-2xl ${theme.bg} ${theme.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                              <FileText size={24} />
                            </div>
                            <div>
                              <h4 className="font-bold text-stone-800 group-hover:text-teal-600 transition-colors leading-tight">{task.title}</h4>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{task.subject}</span>
                                <span className="h-1 w-1 rounded-full bg-stone-200" />
                                <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest flex items-center gap-1">
                                  <Clock size={10} /> {isRTL ? "تاريخ التسليم:" : "Due Date:"} <span className="num-en">{task.dueDate}</span>
                                </span>
                                {isDone && (
                                  <>
                                    <span className="h-1 w-1 rounded-full bg-stone-200" />
                                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                                      {isRTL ? "تم التسليم" : "Submitted"}
                                      {submission?.status === "graded" && ` (${submission.score}/${task.points})`}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleStartTask(task)}
                            disabled={isDone}
                            className={`rounded-xl h-10 px-6 font-bold transition-all border-none relative z-10 cursor-pointer ${
                              isDone 
                                ? "bg-emerald-50 text-emerald-600 cursor-default"
                                : "bg-stone-50 text-stone-900 hover:bg-stone-900 hover:text-white"
                            }`}
                          >
                            {isDone ? (isRTL ? "تم تسليمه" : "Completed") : (isRTL ? "حل الواجب" : "Start Task")}
                          </button>
                        </Card>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>
          ) : view === "grades" ? (
            <div className="space-y-6">
              <PageHeader 
                title={isRTL ? "سجل الدرجات والشهادات" : "Grades & Certificates"} 
                subtitle={isRTL ? "عرض الدرجات الأكاديمية والتقارير الشهرية والفصلية" : "View academic grades, monthly and term reports"}
              >
                <button onClick={() => window.location.href = "/student-portal"} className={`${btnOutline} h-11 px-5 rounded-xl`}>
                  {isRTL ? "العودة للوحة التحكم" : "Back to Dashboard"}
                </button>
              </PageHeader>
              <Card className="p-6 md:p-8 bg-white border-none shadow-sm rounded-[32px]">
                <PortalGrades student={student} />
              </Card>
            </div>
          ) : view === "attendance" ? (
            <div className="space-y-6">
              <PageHeader 
                title={isRTL ? "سجل الحضور والغياب" : "Attendance Log"} 
                subtitle={isRTL ? "متابعة سجل الحضور اليومي، بوابات الدخول والخروج، وحضور الحصص" : "Track daily attendance, school gates swipes, and class logs"}
              >
                <button onClick={() => window.location.href = "/student-portal"} className={`${btnOutline} h-11 px-5 rounded-xl`}>
                  {isRTL ? "العودة للوحة التحكم" : "Back to Dashboard"}
                </button>
              </PageHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 bg-white border-none shadow-sm rounded-3xl text-center">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "نسبة الحضور العام" : "Attendance Rate"}</span>
                  <p className="text-3xl font-black text-emerald-600 mt-2 num-en">
                    {attendanceLogs.length > 0 
                      ? `${Math.min(100, Math.round((attendanceLogs.filter(l => l.status === "present").length / attendanceLogs.length) * 100))}%`
                      : "100%"
                    }
                  </p>
                </Card>
                <Card className="p-6 bg-white border-none shadow-sm rounded-3xl text-center">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "أيام الحضور" : "Days Present"}</span>
                  <p className="text-3xl font-black text-blue-600 mt-2 num-en">
                    {attendanceLogs.filter(l => l.status === "present").length}
                  </p>
                </Card>
                <Card className="p-6 bg-white border-none shadow-sm rounded-3xl text-center">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "أيام الغياب" : "Days Absent"}</span>
                  <p className="text-3xl font-black text-rose-500 mt-2 num-en">
                    {attendanceLogs.filter(l => l.status === "absent").length}
                  </p>
                </Card>
              </div>

              <Card className="p-6 md:p-8 bg-white border-none shadow-sm rounded-[32px] space-y-6">
                <h3 className="font-serif font-black text-stone-900 text-lg">{isRTL ? "سجل الحركات اليومية" : "Swipe & Logs Timeline"}</h3>
                
                <div className="space-y-4">
                  {attendanceLogs.length === 0 ? (
                    <div className="text-center py-12 text-stone-400">
                      <Clock size={32} className="mx-auto mb-2 opacity-25" />
                      <p className="text-xs font-bold">{isRTL ? "لا توجد حركات حضور مسجلة حالياً." : "No attendance logs recorded yet."}</p>
                    </div>
                  ) : (
                    attendanceLogs.map((log, idx) => (
                      <div key={log.id || idx} className="flex items-center justify-between p-4 bg-stone-50 border border-stone-100 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                            log.type === "gate_in" ? "bg-emerald-50 text-emerald-600" :
                            log.type === "gate_out" ? "bg-amber-50 text-amber-600" :
                            "bg-blue-50 text-blue-600"
                          }`}>
                            <ClipboardCheck size={20} />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-stone-850">
                              {log.type === "gate_in" ? (isRTL ? "دخول بوابة المدرسة" : "Gate IN") :
                               log.type === "gate_out" ? (isRTL ? "خروج من المدرسة" : "Gate OUT") :
                               log.type === "bus_in" ? (isRTL ? "صعود الحافلة" : "Bus Boarded") :
                               log.type === "bus_out" ? (isRTL ? "نزول من الحافلة" : "Bus Checked-Out") :
                               (isRTL ? "حضور أكاديمي" : "Class Attendance")}
                            </h4>
                            <p className="text-[10px] text-stone-400 font-semibold mt-0.5">{log.notes || log.recorded_by}</p>
                          </div>
                        </div>

                        <div className="text-end">
                          <p className="text-xs font-black text-stone-800 num-en">{log.date}</p>
                          <p className="text-[10px] font-bold text-stone-450 mt-0.5 num-en">{log.time}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          ) : (
            <>
              {/* High Priority Announcements */}
              {activeHighPriorityAnnouncements.length > 0 && (
                <div className="space-y-3 mb-6">
                  {activeHighPriorityAnnouncements.map(ann => (
                    <div 
                      key={ann.id} 
                      className="p-5 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-[24px] shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shrink-0">
                          <Sparkles size={20} className="text-yellow-300 animate-pulse" />
                        </div>
                        <div>
                          <h4 className="font-serif font-black tracking-tight text-base mb-0.5">{isRTL ? `قرار رسمي عاجل: ${ann.title}` : `Urgent Announcement: ${ann.title}`}</h4>
                          <p className="text-rose-100 text-xs font-medium leading-relaxed max-w-4xl">{ann.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <header className="relative py-12 px-10 bg-gradient-to-br from-teal-600 to-emerald-700 text-white rounded-[48px] shadow-2xl overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-400/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
          <div className="h-32 w-32 rounded-[40px] bg-white p-2 shadow-2xl shadow-black/20 group cursor-pointer overflow-hidden">
            <div className="h-full w-full rounded-[32px] bg-stone-100 flex items-center justify-center text-teal-600 group-hover:scale-110 transition-transform duration-500">
              <Rocket size={64} />
            </div>
          </div>
          
          <div className="flex-1 text-center md:text-right">
            <div className="flex flex-col md:flex-row items-center gap-4 mb-2 justify-center md:justify-start">
              <h2 className="text-4xl md:text-5xl font-serif font-black">{isRTL ? `أهلاً، ${student.full_name || student.name || 'بطل'}` : `Hi, ${student.full_name || student.name || 'Hero'}`}</h2>
              <Badge className="bg-yellow-400 text-teal-900 border-none font-black text-xs px-3 py-1 rounded-full flex items-center gap-1 shadow-lg shadow-yellow-400/30">
                <Star size={12} fill="currentColor" /> {isRTL ? `المستوى ${studentLevel}` : `Level ${studentLevel}`}
              </Badge>
            </div>
            <p className="text-teal-50 text-lg font-medium opacity-80 mb-8 max-w-xl">
              {isRTL ? "يوم رائع بانتظارك! لديك ٣ حصص اليوم وواجب منزلي واحد." : "An amazing day awaits you! You have 3 classes today and 1 homework."}
            </p>
            
            <div className="flex flex-wrap items-center gap-6 justify-center md:justify-start">
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10">
                <Zap size={24} className="text-yellow-400" />
                <div className="text-right">
                  <p className="text-[10px] font-bold text-teal-100 uppercase tracking-widest">{isRTL ? "نقاط الخبرة" : "XP Points"}</p>
                  <p className="text-lg font-black leading-none"> {totalXP.toLocaleString(isRTL ? 'ar-EG' : 'en-US')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10">
                <Trophy size={24} className="text-amber-300" />
                <div className="text-right">
                  <p className="text-[10px] font-bold text-teal-100 uppercase tracking-widest">{isRTL ? "الأوسمة" : "Badges"}</p>
                  <p className="text-lg font-black leading-none num-en"> {studentAwards.length}</p>
                </div>
              </div>
                <button onClick={handleLogout} className={`${btnOutline} h-[52px] px-6 border-rose-500/20 text-rose-100 bg-rose-500/10 hover:bg-rose-500/20`}>
                  <LogOut size={18} />
                  <span className="hidden sm:inline">{isRTL ? "تسجيل الخروج" : "Log out"}</span>
                </button>
            </div>
          </div>
        </div>
      </header>

      {/* Digital Wallet & Student ID side-by-side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <StudentIDCard 
            studentId={student.student_id || student.id} 
            studentName={student.full_name || student.name}
            size="lg"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card className="relative overflow-hidden bg-gradient-to-br from-teal-900 via-stone-850 to-emerald-950 text-white rounded-[32px] shadow-xl border-none p-6 flex flex-col justify-between h-full min-h-[140px] group">
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/20 rounded-full blur-[80px]" />
            
            <div className="relative z-10 flex justify-between items-start">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
                  <Star size={16} className="text-teal-300" />
                </div>
                <div>
                  <h4 className="font-serif font-black tracking-tight text-sm">Edu<span className="text-emerald-400">Wallet</span></h4>
                  <p className="text-[8px] font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "محفظة الطالب الرقمية" : "Digital Wallet"}</p>
                </div>
              </div>
              <Badge className="bg-white/10 backdrop-blur-md text-white border border-white/10 rounded-lg text-[8px] font-black px-2 py-0.5 tracking-wider">
                NFC SMART CARD
              </Badge>
            </div>

            <div className="relative z-10 my-3">
              <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-0.5">{isRTL ? "الرصيد المتاح بالشريحة" : "Smart Card Wallet Balance"}</p>
              <p className="text-3xl font-black text-emerald-400 num-en">${(parseFloat(student.card_balance || 0)).toFixed(2)}</p>
            </div>

            <div className="relative z-10 flex justify-between items-end">
              <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "البطاقة نشطة" : "Card Active"}</span>
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </Card>
        </motion.div>
      </div>

      {/* NFC Smart Card Gate Attendance Simulator (Frontend Design) */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-8"
      >
        <Card className="relative overflow-hidden bg-gradient-to-br from-stone-900 via-stone-850 to-emerald-950 text-white rounded-[40px] shadow-2xl border-none p-8">
          {/* Subtle grid background texture & radial accent glows */}
          <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '16px 16px' }} />
          <div className="absolute -top-32 -left-32 w-80 h-80 bg-teal-500/10 rounded-full blur-[100px]" />
          <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-emerald-500/15 rounded-full blur-[100px]" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left section: Simulator details */}
            <div className="lg:col-span-7 space-y-5">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Sparkles size={24} className="animate-pulse" />
                </div>
                <div>
                  <h4 className="font-serif text-2xl font-black tracking-tight">{isRTL ? "محاكي بوابات الحضور والانصراف بالبطاقة الذكية" : "NFC Smart Gate Simulator"}</h4>
                  <p className="text-stone-400 text-xs font-semibold">{isRTL ? "اضغط لمحاكاة تمرير بطاقتك الذكية عند بوابات الدخول والخروج لتسجيل حضورك الفعلي في قاعدة البيانات." : "Tap to simulate swiping your student smart card at the gates to log your status in real-time."}</p>
                </div>
              </div>

              {/* Status details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <Clock size={16} />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "آخر مسح مسجل" : "Last Activity"}</p>
                    <p className="text-xs font-bold truncate num-en">
                      {attendanceLogs.length > 0 
                        ? `${attendanceLogs[0].type === "gate_in" ? (isRTL ? "دخول" : "Gate-In") : (isRTL ? "خروج" : "Gate-Out")} • ${attendanceLogs[0].time}`
                        : (isRTL ? "لا توجد سجلات اليوم" : "No swipes today")
                      }
                    </p>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${attendanceLogs.length > 0 && attendanceLogs[0].type === "gate_in" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "الموقع الحالي المفترض" : "Current Location"}</p>
                    <p className="text-xs font-bold">
                      {attendanceLogs.length > 0 && attendanceLogs[0].type === "gate_in" 
                        ? (isRTL ? "داخل الحرم المدرسي 🏫" : "Inside Campus 🏫")
                        : (isRTL ? "خارج المدرسة 🏡" : "Outside School 🏡")
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right section: Pulsing NFC Swiping simulator panel */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 bg-white/5 border border-white/10 rounded-[32px] relative overflow-hidden">
              {/* Pulsing Scan rings when swiping */}
              {isSwiping && (
                <div className="absolute inset-0 bg-emerald-500/5 flex items-center justify-center pointer-events-none z-0">
                  <span className="absolute h-32 w-32 rounded-full border-4 border-emerald-500/20 animate-ping" />
                  <span className="absolute h-24 w-24 rounded-full border-4 border-teal-500/30 animate-pulse" />
                </div>
              )}

              <div className="relative z-10 w-full text-center space-y-5">
                {/* Visual NFC Reader device representation */}
                <div className="flex flex-col items-center">
                  <div className={`h-16 w-16 rounded-full flex items-center justify-center border transition-all duration-300 ${
                    isSwiping 
                      ? "bg-emerald-500 text-stone-950 border-emerald-400 shadow-lg shadow-emerald-500/40 scale-110" 
                      : "bg-white/10 text-emerald-300 border-white/10"
                  }`}>
                    <Sparkles className={`h-8 w-8 ${isSwiping ? "animate-spin" : "animate-pulse"}`} />
                  </div>
                  <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-2">
                    {isSwiping ? (isRTL ? "جاري قراءة بطاقة NFC..." : "Reading NFC Chip...") : (isRTL ? "جاهز للمسح الذكي" : "NFC Reader Online")}
                  </span>
                </div>

                {/* Simulation Actions */}
                <div className="grid grid-cols-2 gap-3 w-full">
                  <button
                    disabled={!!isSwiping}
                    onClick={() => handleGateSwipe("gate_in")}
                    className="h-12 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-stone-950 hover:text-stone-900 rounded-2xl font-black text-xs cursor-pointer shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 transform active:scale-95 transition-all disabled:opacity-50"
                  >
                    <span>📲</span>
                    <span>{isRTL ? "مسح دخول (IN)" : "Gate IN"}</span>
                  </button>

                  <button
                    disabled={!!isSwiping}
                    onClick={() => handleGateSwipe("gate_out")}
                    className="h-12 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold text-xs cursor-pointer flex items-center justify-center gap-2 border border-white/10 transform active:scale-95 transition-all disabled:opacity-50"
                  >
                    <span>🚶‍♂️</span>
                    <span>{isRTL ? "مسح خروج (OUT)" : "Gate OUT"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        {/* Daily Schedule - Left Side */}
        <section className="lg:col-span-8 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-serif font-bold text-stone-900">
              {isRTL ? `الجدول الدراسي اليوم (${["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"][new Date().getDay()]})` : `Today's Schedule (${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date().getDay()]})`}
            </h3>
            <button
              onClick={() => setShowScheduleModal(true)}
              className={`${btnOutline} rounded-xl px-4 h-9 text-xs`}
            >
              <Calendar size={14} />
              {isRTL ? "الجدول الأسبوعي الكامل" : "Full Weekly Schedule"}
            </button>
          </div>

          <div className="space-y-4">
            {(() => {
              const daysOfWeekEN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
              const todayDayEN = daysOfWeekEN[new Date().getDay()];
              const todaySchedules = studentSchedules.filter(s => s.day_of_week === todayDayEN)
                .sort((a, b) => a.start_time.localeCompare(b.start_time));

              if (todaySchedules.length === 0) {
                return (
                  <Card className="p-8 text-center bg-stone-50 border border-dashed border-stone-200 rounded-3xl">
                    <Calendar className="h-8 w-8 text-stone-300 mx-auto mb-2" />
                    <p className="text-stone-400 text-xs font-bold">{isRTL ? "لا توجد حصص دراسية مجدولة لليوم." : "No classes scheduled for today."}</p>
                  </Card>
                );
              }

              return todaySchedules.map((session, i) => {
                const now = new Date();
                const currentMins = now.getHours() * 60 + now.getMinutes();
                const [sh, sm] = session.start_time.split(":").map(Number);
                const [eh, em] = session.end_time.split(":").map(Number);
                const startMins = sh * 60 + sm;
                const endMins = eh * 60 + em;
                const isActive = currentMins >= startMins && currentMins <= endMins;

                return (
                  <motion.div
                    key={session.id || i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * i }}
                    className="group"
                  >
                    <Card className={`p-6 border-none shadow-sm hover:shadow-xl transition-all duration-500 rounded-[32px] flex items-center justify-between ${isActive ? 'ring-4 ring-teal-500/10' : ''}`}>
                      <div className="flex items-center gap-6">
                        <div className={`h-14 w-14 rounded-2xl ${isActive ? 'bg-teal-50 text-teal-600 shadow-lg' : 'bg-stone-50 text-stone-450'} flex flex-col items-center justify-center`}>
                          <Clock size={24} />
                        </div>
                        <div>
                          <h4 className={`text-xl font-black ${isActive ? 'text-teal-600' : 'text-stone-800'}`}>{session.subject_name}</h4>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-xs font-bold text-stone-400 flex items-center gap-1"><Clock size={12} /> <span className="num-en">{session.start_time} - {session.end_time}</span></span>
                            <span className="text-xs font-bold text-stone-400 flex items-center gap-1"><GraduationCap size={12} /> {session.teacher_name}</span>
                            {session.room && <span className="text-xs font-bold text-stone-400 flex items-center gap-1 font-serif"><MapPin size={12} /> {session.room}</span>}
                          </div>
                        </div>
                      </div>
                      
                      {isActive ? (
                        <button 
                          onClick={() => window.location.href = `/virtual-classroom/${session.id || 'live'}`}
                          className={`${btnPrimary.split(' ').filter(c => !c.includes('shadow')).join(' ')} bg-teal-600 hover:bg-teal-700 text-white rounded-2xl px-6 h-12`}
                        >
                          <PlayCircle size={18} />
                          {isRTL ? "انضم للحصة" : "Join Class"}
                        </button>
                      ) : (
                        <div className="h-12 w-12 rounded-full border-2 border-stone-100 flex items-center justify-center text-stone-200 group-hover:border-stone-200 group-hover:text-stone-300 transition-colors">
                          <ChevronLeft size={24} className={isRTL ? "" : "rotate-180"} />
                        </div>
                      )}
                    </Card>
                  </motion.div>
                );
              });
            })()}
          </div>

          {/* Quick Learning Path */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
            {(() => {
              const savedSubmissions = localStorage.getItem("edu_submissions") ? JSON.parse(localStorage.getItem("edu_submissions")) : {};
              const studentIdVal = localStorage.getItem("portal_user_id") || "STU-882";
              const unsolvedCount = assignments.filter(task => {
                const asmSubs = savedSubmissions[task.id] || [];
                return !asmSubs.some(s => s.studentId === studentIdVal);
              }).length;

              return (
                <Card 
                  onClick={() => window.location.href = "/student-portal?view=homework"}
                  className="p-8 border-none shadow-sm bg-gradient-to-br from-rose-500 to-rose-600 text-white rounded-[40px] relative overflow-hidden group cursor-pointer"
                >
                  <div className="relative z-10">
                    <div className="flex justify-between items-start">
                      <FileText className="mb-4 text-rose-200" size={32} />
                      {unsolvedCount > 0 && (
                        <Badge className="bg-white text-rose-600 border-none rounded-full px-3 py-1 font-black text-xs animate-bounce shadow-md">
                          {isRTL ? `${unsolvedCount} جديد` : `${unsolvedCount} New`}
                        </Badge>
                      )}
                    </div>
                    <h4 className="text-2xl font-serif font-bold mb-2">{isRTL ? "الواجبات المنزلية" : "Homework"}</h4>
                    <p className="text-rose-100/70 text-sm mb-6">{isRTL ? "تصفح وحل الواجبات والاختبارات المنزلية المرسلة من المعلمين." : "Browse and solve learning assignments assigned by your teachers."}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-rose-200">{isRTL ? "انقر للمتابعة" : "Click to continue"}</span>
                      <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-125 transition-transform">
                        <ArrowUpRight size={20} />
                      </div>
                    </div>
                  </div>
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
                </Card>
              );
            })()}

            <Card className="p-8 border-none shadow-sm bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-[40px] relative overflow-hidden group cursor-pointer">
              <div className="relative z-10">
                <Award className="mb-4 text-amber-200" size={32} />
                <h4 className="text-2xl font-serif font-bold mb-2">{isRTL ? "الإنجازات القادمة" : "Upcoming Badges"}</h4>
                <p className="text-amber-100/70 text-sm mb-6">{isRTL ? "أكمل ٣ دروس أخرى للحصول على وسام 'الباحث العلمي'." : "Complete 3 more lessons to get 'Scientific Researcher' badge."}</p>
                <div className="flex items-center justify-between">
                  <Progress value={75} className="h-2 w-32 bg-white/20" />
                  <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-125 transition-transform">
                    <Sparkles size={20} />
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
            </Card>
          </div>
        </section>

        {/* Sidebar - Materials & Activity */}
        <aside className="lg:col-span-4 space-y-8">
          <Card className="p-8 border-none shadow-sm bg-white rounded-[40px]">
            <div className="flex items-center justify-between mb-8">
              <h4 className="font-bold text-stone-900">{isRTL ? "المواد الدراسية" : "Study Materials"}</h4>
              <button className="text-teal-600 hover:text-teal-700 hover:bg-teal-50 font-bold px-3 rounded-xl cursor-pointer">
                {isRTL ? "عرض الكل" : "View All"}
              </button>
            </div>

            <div className="space-y-6">
              {materials.map((m, i) => (
                <div key={i} className="flex gap-4 group cursor-pointer">
                  <div className="h-12 w-12 rounded-2xl bg-stone-50 flex items-center justify-center text-stone-400 group-hover:bg-teal-50 group-hover:text-teal-600 transition-all duration-300">
                    <FileText size={24} />
                  </div>
                  <div className="flex-1">
                    <h5 className="text-sm font-bold text-stone-800 group-hover:text-teal-700 transition-colors truncate">{m.title}</h5>
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{m.subject_name}</p>
                  </div>
                  <button className={`${btnOutline} rounded-full gap-1 text-xs`}>
                    <ChevronLeft size={14} className={isRTL ? "" : "rotate-180"} />
                    {t("common.open", language) || "فتح"}
                  </button>
                </div>
              ))}
            </div>
          </Card>
          
          {/* Recent Store Purchases */}
          <Card className="p-8 border-none shadow-sm bg-white rounded-[40px]">
            <div className="flex items-center justify-between mb-8">
              <h4 className="font-bold text-stone-900 font-serif">{isRTL ? "مشتريات المتجر الأخيرة" : "Recent Purchases"}</h4>
              <span className="text-[10px] font-bold text-stone-450 uppercase tracking-wider bg-stone-50 px-2.5 py-1 rounded-lg num-en">
                {storePurchases.length} {isRTL ? "عمليات" : "Txns"}
              </span>
            </div>

            <div className="space-y-6">
              {storePurchases.length === 0 ? (
                <div className="text-center py-6 text-stone-400 text-xs font-semibold">
                  {isRTL ? "لا توجد مشتريات مؤخراً." : "No recent purchases found."}
                </div>
              ) : (
                storePurchases.slice(0, 4).map((p, i) => (
                  <div key={p.id || i} className="flex items-center justify-between gap-4 group">
                    <div className="flex gap-3 items-center">
                      <div className="h-10 w-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 group-hover:bg-teal-100 transition-colors">
                        <ShoppingBag size={18} />
                      </div>
                      <div>
                        <h5 className="text-sm font-bold text-stone-800 leading-snug truncate max-w-[120px]">{p.item_name}</h5>
                        <p className="text-[10px] font-bold text-stone-400 num-en">
                          {p.created_at ? p.created_at.split('T')[0] : "—"} · {p.quantity} {isRTL ? "قطع" : "units"}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-extrabold text-stone-900 num-en">
                      -${(parseFloat(p.total_price || p.total_amount || 0)).toFixed(2)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="p-8 border-none shadow-sm bg-stone-900 text-white rounded-[40px] relative overflow-hidden">
            <div className="relative z-10 text-center">
              <div className="h-20 w-20 rounded-full bg-white/10 mx-auto flex items-center justify-center mb-6">
                <Trophy size={40} className="text-yellow-400" />
              </div>
              <h4 className="text-xl font-serif font-bold mb-2">{isRTL ? "هل أنت جاهز للاختبار؟" : "Ready for the Quiz?"}</h4>
              <p className="text-stone-400 text-xs mb-8">{isRTL ? "اختبر معلوماتك اليوم في مادة العلوم واربح نقاط إضافية!" : "Test your knowledge today in Science and win extra points!"}</p>
              <button className="w-full bg-white text-stone-900 hover:bg-stone-100 rounded-2xl h-12 font-bold shadow-xl cursor-pointer">
                {isRTL ? "ابدأ الآن" : "Start Now"}
              </button>
            </div>
            {/* Decorative pattern */}
            <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
          </Card>
        </aside>
      </div>
            </>
          )}
        </div>
      </main>

      <Dialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
        <DialogContent className="max-w-4xl rounded-[32px] p-6 max-h-[85vh] overflow-y-auto" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader className="">
            <DialogTitle className="font-serif font-black text-xl text-stone-900 mb-4 flex items-center gap-2">
              <Calendar className="text-primary h-5 w-5" />
              {isRTL ? `الجدول الدراسي الأسبوعي - الصف ${student.grade || ""}` : `Weekly Academic Schedule - Grade ${student.grade || ""}`}
            </DialogTitle>
          </DialogHeader>
          <VisualSchedule classes={studentSchedules} tasks={studentTasks} />
        </DialogContent>
      </Dialog>

      <Dialog open={showFormModal} onOpenChange={setShowFormModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-[32px] p-6 text-right" dir={isRTL ? "rtl" : "ltr"}>
          {selectedAsm && (
            <div className="space-y-6">
              <DialogHeader className="border-b border-stone-100 pb-4">
                <div className="flex items-center gap-3 justify-start">
                  <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <DialogTitle className="font-serif font-black text-xl text-stone-900">
                      {selectedAsm.title}
                    </DialogTitle>
                    <p className="text-xs text-stone-400 mt-1">
                      {isRTL ? `المادة: ${selectedAsm.subject} · الدرجات: ${selectedAsm.points}` : `Subject: ${selectedAsm.subject} · Points: ${selectedAsm.points}`}
                    </p>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {selectedAsm.questions.map((q, idx) => (
                  <Card key={q.id} className="p-6 bg-stone-50/50 border-none rounded-2xl space-y-3">
                    <Label className="font-bold text-stone-850 text-sm flex gap-1.5 justify-start">
                      <span>{idx + 1}.</span>
                      <span>{q.text}</span>
                      <span className="text-[10px] font-bold text-teal-600">({q.points} {isRTL ? "نقاط" : "pts"})</span>
                    </Label>

                    {/* MCQ Option */}
                    {q.type === "mcq" && (
                      <div className="grid grid-cols-1 gap-2 pt-2">
                        {q.options.map((opt, oIdx) => (
                          <label key={oIdx} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-stone-100">
                            <input 
                              type="radio" 
                              name={q.id}
                              value={opt}
                              checked={answers[q.id] === opt}
                              onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                              className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-stone-300"
                            />
                            <span className="text-xs font-semibold text-stone-700">{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {/* Checkbox Option */}
                    {q.type === "checkbox" && (
                      <div className="grid grid-cols-1 gap-2 pt-2">
                        {q.options.map((opt, oIdx) => (
                          <label key={oIdx} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-stone-100">
                            <input 
                              type="checkbox"
                              checked={(answers[q.id] || []).includes(opt)}
                              onChange={e => handleCheckboxChange(q.id, opt, e.target.checked)}
                              className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-stone-300 rounded"
                            />
                            <span className="text-xs font-semibold text-stone-700">{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {/* Short Answer */}
                    {q.type === "short" && (
                      <Input 
                        value={answers[q.id] || ""}
                        onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                        className="h-10 rounded-xl border-stone-250 font-semibold focus-visible:ring-teal-200 bg-white"
                        placeholder={isRTL ? "اكتب إجابتك القصيرة هنا..." : "Enter your short answer here..."}
                      />
                    )}

                    {/* Paragraph */}
                    {q.type === "paragraph" && (
                      <Textarea 
                        value={answers[q.id] || ""}
                        onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                        rows={3}
                        className="rounded-xl border-stone-250 font-semibold focus-visible:ring-teal-200 bg-white"
                        placeholder={isRTL ? "اكتب إجابتك بالتفصيل هنا..." : "Write your essay answer in detail here..."}
                      />
                    )}
                  </Card>
                ))}
              </div>

              <button 
                onClick={handleSubmitAnswers}
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all bg-teal-600 text-white hover:bg-teal-700 h-12 cursor-pointer shadow-lg shadow-teal-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle2 size={16} />
                <span>{isRTL ? "إرسال وتسليم الواجب" : "Submit Assignment"}</span>
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}