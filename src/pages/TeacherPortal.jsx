import React, { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/dbClient";
import { 
  Users, 
  BookOpen, 
  ClipboardCheck, 
  MessageCircle, 
  Calendar, 
  TrendingUp,
  Plus,
  ChevronRight,
  Clock,
  LayoutGrid,
  CheckCircle2,
  AlertCircle,
  FileText,
  Star,
  Video,
  ExternalLink,
  Megaphone,
  Search,
  Trophy,
  Award,
  Copy,
  Send
} from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import TeacherSidebar from "@/components/layout/TeacherSidebar";
import SupportWidget from "@/components/shared/SupportWidget";
import VisualSchedule from "@/components/schedule/VisualSchedule";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import PageHeader from "@/components/shared/PageHeader";
import AssignmentsGradingTab from "@/components/teacher/AssignmentsGradingTab";
import ParentTeacherChat from "@/components/portal/ParentTeacherChat";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import AdminStudentProfile from "@/components/students/AdminStudentProfile";
import RecordedVideosManager from "@/components/teacher/RecordedVideosManager";
import SchoolVideosLibrary from "@/components/teacher/SchoolVideosLibrary";
import TeacherStudyMaterialsManager from "@/components/teacher/TeacherStudyMaterialsManager";

export function normalizeGrade(g) {
  if (g === undefined || g === null) return '';
  const str = String(g).trim().toLowerCase();
  const matchNum = str.match(/\d+/);
  if (matchNum) return matchNum[0];
  if (str.includes('اول') || str.includes('أول') || str.includes('g1') || str.includes('level1')) return '1';
  if (str.includes('ثاني') || str.includes('ثانى') || str.includes('g2') || str.includes('level2')) return '2';
  if (str.includes('ثالث') || str.includes('g3') || str.includes('level3')) return str.includes('ثانوي') ? '12' : '3';
  if (str.includes('رابع') || str.includes('g4')) return '4';
  if (str.includes('خامس') || str.includes('g5')) return '5';
  if (str.includes('سادس') || str.includes('g6')) return '6';
  if (str.includes('سابع') || str.includes('g7')) return '7';
  if (str.includes('ثامن') || str.includes('g8')) return '8';
  if (str.includes('تاسع') || str.includes('g9')) return '9';
  if (str.includes('عاشر') || str.includes('g10')) return '10';
  return str;
}

export function matchGrade(studentGrade, clsGrade) {
  if (!clsGrade || clsGrade === 'all' || clsGrade === 'الكل') return true;
  if (!studentGrade) return false;
  const sg = normalizeGrade(studentGrade);
  const cg = normalizeGrade(clsGrade);
  if (sg && cg && sg === cg) return true;
  const sStr = String(studentGrade).trim().toLowerCase();
  const cStr = String(clsGrade).trim().toLowerCase();
  return sStr === cStr || sStr.includes(cStr) || cStr.includes(sStr);
}

export function matchSection(studentSec, clsSec) {
  if (!clsSec || clsSec === 'all' || clsSec === 'عام' || clsSec === 'الكل') return true;
  if (!studentSec) return true;
  const s = String(studentSec).toLowerCase().trim();
  const c = String(clsSec).toLowerCase().trim();
  if (s === c) return true;
  if ((s.includes('brit') || s.includes('بريطان')) && (c.includes('brit') || c.includes('بريطان'))) return true;
  if ((s.includes('sudan') || s.includes('سودان')) && (c.includes('sudan') || c.includes('سودان'))) return true;
  if ((s === 'a' || s === 'أ') && (c === 'a' || c === 'أ')) return true;
  if ((s === 'b' || s === 'ب') && (c === 'b' || c === 'ب')) return true;
  return s.includes(c) || c.includes(s);
}

export function studentBelongsToClass(student, cls) {
  if (!cls) return true;
  const gradeOk = matchGrade(student.grade, cls.grade_level || cls.grade);
  if (!gradeOk) return false;
  return matchSection(student.section, cls.section);
}

const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all border-2 border-stone-300 bg-white text-stone-800 hover:bg-stone-50 hover:border-stone-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const btnPrimary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all bg-stone-900 text-white hover:bg-black cursor-pointer shadow-lg shadow-stone-200 disabled:opacity-50 disabled:cursor-not-allowed";

export default function TeacherPortal() {
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "classes";
  const view = searchParams.get("view");
  const setActiveTab = (tab) => {
    setSearchParams(prev => {
      prev.set("tab", tab);
      prev.delete("view");
      return prev;
    });
  };
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newClassGrade, setNewClassGrade] = useState("1");
  const [newClassSection, setNewClassSection] = useState("");
  const [isCreatingClass, setIsCreatingClass] = useState(false);

  // ── Live virtual class initiation (teacher as host) ──
  const [liveClass, setLiveClass] = useState(null);
  const [meetingLink, setMeetingLink] = useState("");
  const [notifying, setNotifying] = useState(false);
  const [notifiedCount, setNotifiedCount] = useState(null);

  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState(null);
  const selectedClassId = searchParams.get("classId") || "all";

  const teacherId = localStorage.getItem("portal_user_id") || "T-202";
  const portalUserStr = localStorage.getItem("portal_user");
  const portalUser = portalUserStr ? JSON.parse(portalUserStr) : null;

  // 1. Fetch subjects in this school
  const { data: allSubjects = [] } = useQuery({ 
    queryKey: ["school-subjects"], 
    queryFn: () => entities.Subject.list("-created_at", 1000) 
  });

  // 2. Fetch all students in this school
  const { data: students = [], isLoading: isLoadingStudents } = useQuery({ 
    queryKey: ["teacher-students"], 
    queryFn: () => entities.Student.list("-created_at", 1000) 
  });

  // 3. Fetch all schedules in this school
  const { data: allSchedules = [] } = useQuery({
    queryKey: ["school-schedules"],
    queryFn: () => entities.ClassSchedule.list("-created_at", 1000)
  });

  const { data: teacherTasks = [] } = useQuery({
    queryKey: ["teacher-tasks", teacherId],
    queryFn: () => entities.TeacherTask.filter({ teacher_id: teacherId })
  });

  // Filter schedules matching this specific teacher
  const teacherSchedules = React.useMemo(() => {
    if (!allSchedules || allSchedules.length === 0) return [];
    const tId = String(teacherId || "").toLowerCase();
    const pId = String(portalUser?.id || "").toLowerCase();
    const empId = String(portalUser?.employee_id || "").toLowerCase();
    const fullName = String(portalUser?.full_name || "").toLowerCase().trim();
    const name = String(portalUser?.name || "").toLowerCase().trim();

    const matched = allSchedules.filter(s => {
      const sTeacherId = String(s.teacher_id || "").toLowerCase();
      const sTeacherName = String(s.teacher_name || "").toLowerCase().trim();
      if (sTeacherId && (sTeacherId === tId || sTeacherId === pId || sTeacherId === empId)) return true;
      if (sTeacherName && fullName && (sTeacherName === fullName || sTeacherName.includes(fullName) || fullName.includes(sTeacherName))) return true;
      if (sTeacherName && name && (sTeacherName === name || sTeacherName.includes(name) || name.includes(sTeacherName))) return true;
      return false;
    });

    return matched;
  }, [allSchedules, teacherId, portalUser]);

  // Construct comprehensive classes list for teacher
  const classes = React.useMemo(() => {
    const map = new Map();

    const addClass = (item) => {
      if (!item.name || !item.grade_level) return;
      const key = `${item.name}-${item.grade_level}-${item.section || ''}`.toLowerCase().trim();
      if (!map.has(key)) {
        map.set(key, {
          id: item.id || `cls-${map.size + 1}`,
          name: item.name,
          grade: item.grade_level,
          grade_level: item.grade_level,
          section: item.section || '',
          day_of_week: item.day_of_week || '',
          time: item.time || ''
        });
      }
    };

    // 1. From teacher's actual schedules if present
    if (teacherSchedules && teacherSchedules.length > 0) {
      teacherSchedules.forEach(sched => {
        if (!sched.subject_name || !sched.grade) return;
        addClass({
          id: sched.id,
          name: sched.subject_name,
          grade_level: String(sched.grade),
          section: sched.section || '',
          day_of_week: sched.day_of_week,
          time: sched.start_time ? `${sched.start_time} - ${sched.end_time || ''}` : ''
        });
      });
    }

    // 2. From matching subjects in the school (by teacher_id, teacher_name, or subjects string)
    const teacherSubjectKeywords = [
      portalUser?.subjects,
      portalUser?.subject,
      portalUser?.specialization
    ].filter(Boolean)
     .join(" ")
     .split(/[,،;_\/\n]+/)
     .map(s => s.trim().toLowerCase())
     .filter(s => s.length >= 2);

    const tId = String(teacherId || "").toLowerCase();
    const pId = String(portalUser?.id || "").toLowerCase();
    const fullName = String(portalUser?.full_name || "").toLowerCase().trim();

    const matchingSubjects = allSubjects.filter(subj => {
      const sId = String(subj.teacher_id || "").toLowerCase();
      const sName = String(subj.teacher_name || "").toLowerCase().trim();
      const subjTitle = String(subj.name || "").toLowerCase().trim();
      
      if (sId && (sId === tId || sId === pId)) return true;
      if (sName && fullName && (sName === fullName || sName.includes(fullName) || fullName.includes(sName))) return true;
      if (teacherSubjectKeywords.some(kw => subjTitle.includes(kw) || kw.includes(subjTitle))) return true;
      return false;
    });

    const subjectsToUse = matchingSubjects.length > 0 ? matchingSubjects : (teacherSchedules.length === 0 ? allSubjects.slice(0, 6) : []);

    if (subjectsToUse.length > 0) {
      subjectsToUse.forEach(subj => {
        const gradeStudents = students.filter(s => matchGrade(s.grade, subj.grade));
        const sectionsInGrade = Array.from(new Set(gradeStudents.map(s => (s.section || '').trim()).filter(Boolean)));
        
        if (sectionsInGrade.length > 0) {
          sectionsInGrade.forEach(sec => {
            addClass({
              id: `${subj.id}-${sec}`,
              name: subj.name,
              grade_level: String(subj.grade || "1"),
              section: sec
            });
          });
        } else {
          addClass({
            id: subj.id,
            name: subj.name,
            grade_level: String(subj.grade || "1"),
            section: ""
          });
        }
      });
    }

    // 3. From teacher profile subjects keywords against existing student grades & sections
    if (map.size === 0 && teacherSubjectKeywords.length > 0) {
      const primarySubject = portalUser?.subject || teacherSubjectKeywords[0] || (isRTL ? "مادة دراسية" : "Subject");
      const gradeSecMap = new Map();
      students.forEach(s => {
        const g = String(s.grade || '1').trim();
        const sec = String(s.section || '').trim();
        const key = `${g}-${sec}`;
        if (!gradeSecMap.has(key)) {
          gradeSecMap.set(key, { grade: g, section: sec });
        }
      });
      gradeSecMap.forEach(({ grade, section }, k) => {
        addClass({
          id: `cls-teacher-${k}`,
          name: primarySubject,
          grade_level: grade,
          section: section
        });
      });
    }

    // 4. From students in school grouped by grade and section
    if (map.size === 0 && students.length > 0) {
      const gradeSecMap = new Map();
      students.forEach(s => {
        const g = String(s.grade || '1').trim();
        const sec = String(s.section || '').trim();
        const key = `${g}-${sec}`;
        if (!gradeSecMap.has(key)) {
          gradeSecMap.set(key, { grade: g, section: sec });
        }
      });
      gradeSecMap.forEach(({ grade, section }, k) => {
        addClass({
          id: `cls-stu-${k}`,
          name: portalUser?.subject || (isRTL ? "الفصل الدراسي" : "Class"),
          grade_level: grade,
          section: section
        });
      });
    }

    // 5. Fallback default
    if (map.size === 0) {
      addClass({
        id: "default-cls-1",
        name: portalUser?.subject || (isRTL ? "الفصل الأول" : "Class 1"),
        grade_level: "1",
        section: isRTL ? "عام" : "General"
      });
    }

    return Array.from(map.values());
  }, [teacherSchedules, allSubjects, students, portalUser, teacherId, isRTL]);

  // Robust student filtering
  const filteredTeacherStudents = React.useMemo(() => {
    if (!students || students.length === 0) return [];
    
    let list = students;

    // If a specific class is selected:
    if (selectedClassId && selectedClassId !== "all") {
      const selectedClass = classes.find(c => String(c.id) === String(selectedClassId));
      if (selectedClass) {
        // First attempt: match both grade and section
        const strictMatch = students.filter(s => studentBelongsToClass(s, selectedClass));
        if (strictMatch.length > 0) {
          list = strictMatch;
        } else {
          // Flexible fallback: match grade only
          const gradeMatch = students.filter(s => matchGrade(s.grade, selectedClass.grade_level || selectedClass.grade));
          list = gradeMatch.length > 0 ? gradeMatch : students;
        }
      }
    } else {
      // selectedClassId === "all" ("جميع طلابي"):
      // If teacher has classes, filter students belonging to those classes
      if (classes && classes.length > 0) {
        const myStudents = students.filter(s => {
          return classes.some(cls => matchGrade(s.grade, cls.grade_level || cls.grade));
        });
        if (myStudents.length > 0) {
          list = myStudents;
        }
      }
      // If myStudents yielded 0 (e.g. grade names mismatch), list stays all students in school!
    }

    // Apply search filter
    if (studentSearch.trim()) {
      const query = studentSearch.toLowerCase().trim();
      list = list.filter(student => {
        const name = (student.full_name || student.name || "").toLowerCase();
        const id = (student.student_id || student.id || "").toLowerCase();
        const email = (student.user_email || student.email || "").toLowerCase();
        const phone = (student.parent_phone || student.phone || "").toLowerCase();
        return name.includes(query) || id.includes(query) || email.includes(query) || phone.includes(query);
      });
    }

    return list;
  }, [students, classes, selectedClassId, studentSearch]);

  const handleAddClass = async (e) => {
    e?.preventDefault();
    if (!newClassName.trim()) {
      toast.error(isRTL ? "يرجى كتابة اسم المادة أو الفصل" : "Please enter class/subject name");
      return;
    }
    setIsCreatingClass(true);
    try {
      await entities.Subject.create({
        name: newClassName.trim(),
        grade: String(newClassGrade || "1"),
        teacher_id: teacherId,
        teacher_name: portalUser?.full_name || portalUser?.name || "المعلم",
        school_id: portalUser?.school_id || null,
        status: "active"
      });

      await entities.ClassSchedule.create({
        subject_name: newClassName.trim(),
        grade: String(newClassGrade || "1"),
        section: newClassSection.trim() || (isRTL ? "عام" : "General"),
        teacher_id: teacherId,
        teacher_name: portalUser?.full_name || portalUser?.name || "المعلم",
        school_id: portalUser?.school_id || null,
        day_of_week: "Sunday",
        start_time: "08:00",
        end_time: "09:00"
      }).catch(() => {});

      queryClient.invalidateQueries({ queryKey: ["school-subjects"] });
      queryClient.invalidateQueries({ queryKey: ["school-schedules"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-students"] });

      toast.success(isRTL ? "تمت إضافة الفصل بنجاح!" : "Class added successfully!");
      setShowAddClassModal(false);
      setNewClassName("");
      setNewClassSection("");
    } catch (err) {
      console.error("Failed to create class:", err);
      toast.error(isRTL ? "تعذر إنشاء الفصل" : "Failed to create class");
    } finally {
      setIsCreatingClass(false);
    }
  };

  // ── Start a live class: open a fresh Google Meet where the teacher is the
  //    host, then let them copy the link or save it and notify the class. ──
  const openLiveClass = (cls) => {
    setLiveClass(cls);
    setMeetingLink("https://meet.google.com/new");
    setNotifiedCount(null);
    // Teacher-created meeting → the teacher is the host (full controls).
    window.open("https://meet.google.com/new", "_blank", "noopener,noreferrer");
  };

  const copyMeetingLink = async () => {
    const link = meetingLink.trim() || "https://meet.google.com/new";
    try {
      await navigator.clipboard.writeText(link);
      toast.success(isRTL ? "تم نسخ رابط الاجتماع" : "Meeting link copied");
    } catch {
      toast.error(isRTL ? "تعذر النسخ" : "Copy failed");
    }
  };

  const notifyClassStudents = async () => {
    if (!liveClass) return;
    const link = meetingLink.trim() || "https://meet.google.com/new";
    const classStudents = (students || []).filter((s) => studentBelongsToClass(s, liveClass));
    if (classStudents.length === 0) {
      toast.error(isRTL ? "لا يوجد طلاب مسجلين في هذا الفصل" : "No students in this class");
      return;
    }
    setNotifying(true);
    try {
      const teacherName = portalUser?.full_name || portalUser?.name || (isRTL ? "المعلم" : "Teacher");

      // Save the live class (with its link) so it appears in the virtual-classrooms list.
      await entities.VirtualSession.create({
        title: `${liveClass.name} - ${isRTL ? "حصة مباشرة" : "live class"}`,
        teacher_id: teacherId,
        teacher_name: teacherName,
        subject_name: liveClass.name,
        grade: liveClass.grade_level,
        room_name: `meet-${Math.random().toString(36).slice(2, 10)}`,
        scheduled_at: new Date().toISOString(),
        started_at: new Date().toISOString(),
        status: "active",
        meet_link: link,
      }).catch((e) => console.warn("Failed to save live session:", e));

      // Notify every student in this specific class (portal notification).
      const results = await Promise.allSettled(
        classStudents.map((s) =>
          entities.PortalNotification.create({
            user_id: s.id,
            type: "class_started",
            title: isRTL ? `بدأت الحصة المباشرة: ${liveClass.name}` : `Live class started: ${liveClass.name}`,
            message: isRTL
              ? `${teacherName} بدأ حصة مباشرة في ${liveClass.name}. انضم من الرابط: ${link}`
              : `${teacherName} started a live ${liveClass.name} class. Join: ${link}`,
            link: "/virtual-classroom/demo",
            is_read: false,
          }).catch(() => null)
        )
      );
      const sent = results.filter((r) => r.status === "fulfilled" && r.value).length;
      setNotifiedCount(sent);
      toast.success(isRTL ? `تم إرسال الإشعار إلى ${sent} طالب` : `Notified ${sent} students`);
    } catch (err) {
      console.error("Failed to notify students:", err);
      toast.error(isRTL ? "تعذر إرسال الإشعارات" : "Failed to notify students");
    } finally {
      setNotifying(false);
    }
  };

  const { data: officialAnnouncements = [] } = useQuery({
    queryKey: ["official-announcements-teacher"],
    queryFn: () => entities.OfficialAnnouncement.list("-created_at")
  });

  const teacherAnnouncements = React.useMemo(() => {
    return officialAnnouncements.filter(a => a.target_audience === "teachers" || a.target_audience === "all");
  }, [officialAnnouncements]);

  const activeHighPriorityAnnouncements = React.useMemo(() => {
    return teacherAnnouncements.filter(a => a.priority === "high");
  }, [teacherAnnouncements]);

  // Third of 3 targeted files: set to none for immediate rendering
  const containerVariants = { variants: [] };

  // Dynamic calculations for stats & headers
  const todayDayEN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date().getDay()];
  const todayClassesCount = teacherSchedules.filter(s => s.day_of_week === todayDayEN).length;

  // Assignments & pending reviews
  const dynamicAssignments = React.useMemo(() => {
    try {
      const saved = localStorage.getItem("edu_assignments");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }, []);

  const dynamicSubmissions = React.useMemo(() => {
    try {
      const saved = localStorage.getItem("edu_submissions");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  }, []);

  const pendingGradingCount = React.useMemo(() => {
    let count = 0;
    Object.keys(dynamicSubmissions).forEach(asmId => {
      const subs = dynamicSubmissions[asmId] || [];
      count += subs.filter(s => s.status === "pending").length;
    });
    return count;
  }, [dynamicSubmissions]);

  const totalCompletedAssignmentsCount = React.useMemo(() => {
    let count = 0;
    Object.keys(dynamicSubmissions).forEach(asmId => {
      const subs = dynamicSubmissions[asmId] || [];
      count += subs.length;
    });
    return count;
  }, [dynamicSubmissions]);

  // Average GPA calculation from student grades in database
  const { data: allGrades = [] } = useQuery({
    queryKey: ["teacher-all-students-grades"],
    queryFn: () => entities.StudentGrade.list()
  });

  const averageGPA = React.useMemo(() => {
    if (allGrades.length === 0) return "٣.٧٥";
    const total = allGrades.reduce((sum, g) => sum + (parseFloat(g.score || g.grade_point || 0)), 0);
    const avg = total / allGrades.length;
    // Format to Arabic numerals if RTL
    const val = avg.toFixed(2);
    if (isRTL) {
      return val.replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[d]);
    }
    return val;
  }, [allGrades, isRTL]);

  // Student Performance distributions (Above Average: >= 85, Average: 50-84, Needs Review: < 50)
  const performanceStats = React.useMemo(() => {
    if (allGrades.length === 0) {
      return { aboveAverage: 70, average: 20, needsReview: 10 };
    }
    let above = 0, avg = 0, low = 0;
    allGrades.forEach(g => {
      const scorePct = parseFloat(g.score || 0);
      if (scorePct >= 85) above++;
      else if (scorePct >= 50) avg++;
      else low++;
    });
    const total = allGrades.length;
    return {
      aboveAverage: Math.round((above / total) * 100),
      average: Math.round((avg / total) * 100),
      needsReview: Math.round((low / total) * 100)
    };
  }, [allGrades]);

  // Alerts calculation
  const urgentAlertsList = React.useMemo(() => {
    const alerts = [];
    // 1. Student recurrent absences (if any student has status absent in attendance)
    // 2. Announcements of high priority
    // 3. Static default fallbacks if none
    activeHighPriorityAnnouncements.forEach(ann => {
      alerts.push({
        title: ann.title,
        time: isRTL ? "عاجل" : "Urgent",
        icon: AlertCircle,
        color: "text-rose-500",
        bg: "bg-rose-50"
      });
    });

    if (alerts.length === 0) {
      return [
        { title: isRTL ? "غياب متكرر - طالب ٤٠٥" : "Frequent Absence - Student 405", time: isRTL ? "١٠:١٥ ص" : "10:15 AM", icon: AlertCircle, color: "text-rose-500", bg: "bg-rose-50" },
        { title: isRTL ? "طلب مراجعة درجة - سارة" : "Grade Review Request - Sarah", time: isRTL ? "٠٩:٣٠ ص" : "09:30 AM", icon: MessageCircle, color: "text-blue-500", bg: "bg-blue-50" },
        { title: isRTL ? "تم تحديث خطة المنهج" : "Curriculum plan updated", time: isRTL ? "٠٨:٠٠ ص" : "08:00 AM", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" }
      ];
    }
    return alerts;
  }, [activeHighPriorityAnnouncements, isRTL]);

  return (
    <div className={`min-h-screen bg-stone-50 text-stone-900 ${isRTL ? 'font-cairo' : 'font-sans'}`} dir={isRTL ? "rtl" : "ltr"}>
      <TeacherSidebar />
      <SupportWidget />
      <main className={`transition-all duration-300 min-h-screen pt-16 lg:pt-0 ${isRTL ? "lg:mr-64" : "lg:ml-64"}`}>
        <div className="p-6 md:p-10 lg:p-12 max-w-7xl mx-auto space-y-10 pb-24">
          {view === "schedule" ? (
            <div className="space-y-6">
              <PageHeader 
                title={isRTL ? "الجدول الدراسي الأسبوعي للمعلم" : "Teacher's Weekly Schedule"} 
                subtitle={isRTL ? "عرض وتتبع جدول الحصص الأسبوعي الخاص بك" : "View and track your weekly teaching schedule"}
              >
                <button onClick={() => window.location.href = "/teacher-portal"} className={`${btnOutline} h-11 px-5 rounded-xl`}>
                  {isRTL ? "العودة للوحة التحكم" : "Back to Dashboard"}
                </button>
              </PageHeader>
              <Card className="p-6 md:p-8 bg-white border-none shadow-sm rounded-[32px]">
                <VisualSchedule classes={teacherSchedules} tasks={teacherTasks} />
              </Card>
            </div>
          ) : activeTab === "attendance" ? (
            <AttendanceTabContent 
              isRTL={isRTL} 
              classes={classes} 
              students={students} 
              portalUser={portalUser} 
            />
          ) : activeTab === "grades" ? (
            <GradesTabContent 
              isRTL={isRTL} 
              classes={classes} 
              students={students} 
              portalUser={portalUser} 
            />
          ) : activeTab === "badges" ? (
            <BadgesTabContent 
              isRTL={isRTL} 
              classes={classes} 
              students={students} 
              portalUser={portalUser} 
            />
          ) : activeTab === "messages" ? (
            <div className="space-y-6">
              <PageHeader 
                title={isRTL ? "علبة الرسائل والتواصل" : "Inbox & Communication"} 
                subtitle={isRTL ? "تواصل مباشرة مع أولياء الأمور وشارك معهم الملاحظات والملفات." : "Communicate directly with parents, share updates and files."}
              >
                <button onClick={() => setActiveTab("classes")} className={`${btnOutline} h-11 px-5 rounded-xl`}>
                  {isRTL ? "العودة للوحة التحكم" : "Back to Dashboard"}
                </button>
              </PageHeader>
              <ParentTeacherChat me={{ ...portalUser, id: teacherId, role: "teacher", full_name: portalUser?.full_name || "المعلم" }} />
            </div>
          ) : activeTab === "requests" ? (
            <div className="space-y-6">
              <PageHeader 
                title={isRTL ? "طلباتي الشخصية" : "My Personal Requests"} 
                subtitle={isRTL ? "إرسال ومتابعة طلبات الإجازات والاستئذان والسلف الخاصة بك" : "Submit and track your leaves, permissions and loan requests"}
              >
                <button onClick={() => setActiveTab("classes")} className={`${btnOutline} h-11 px-5 rounded-xl`}>
                  {isRTL ? "العودة للوحة التحكم" : "Back to Dashboard"}
                </button>
              </PageHeader>
              <TeacherRequestsView isRTL={isRTL} portalUser={portalUser} teacherId={teacherId} />
            </div>
          ) : activeTab === "notifications" ? (
            <div className="space-y-6">
              <PageHeader 
                title={isRTL ? "التعاميم والقرارات الرسمية" : "Official Announcements"} 
                subtitle={isRTL ? "جميع القرارات والتعاميم الموجهة لك من قبل الإدارة المدرسية." : "All decisions and announcements directed to you by school administration."}
              >
                <button onClick={() => setActiveTab("classes")} className={`${btnOutline} h-11 px-5 rounded-xl`}>
                  {isRTL ? "العودة للوحة التحكم" : "Back to Dashboard"}
                </button>
              </PageHeader>
              
              <div className="space-y-4 max-w-4xl mx-auto pt-4">
                {teacherAnnouncements.length === 0 ? (
                  <Card className="p-16 text-center border-dashed border-2 border-stone-200 bg-stone-50/50 text-stone-400 rounded-[40px]">
                    <Megaphone size={48} className="mb-4 opacity-20 mx-auto" />
                    <p className="font-bold text-lg">{isRTL ? "لا توجد تعاميم منشورة حالياً" : "No official announcements published yet"}</p>
                  </Card>
                ) : (
                  teacherAnnouncements.map(ann => {
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
          ) : activeTab === "videos" ? (
            <div className="space-y-8">
              <RecordedVideosManager
                isRTL={isRTL}
                teacherId={teacherId}
                students={filteredTeacherStudents}
                classes={classes}
              />
              <SchoolVideosLibrary isRTL={isRTL} teacherId={teacherId} />
            </div>
          ) : (
            <>
              <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-serif font-black text-stone-900">{isRTL ? "بوابة المعلم" : "Teacher Portal"}</h1>
            <Badge className="bg-amber-500/10 text-amber-600 border-none rounded-lg text-[10px] font-black px-2 py-1 uppercase tracking-widest">
              {isRTL ? "أكاديمي" : "Academic"}
            </Badge>
          </div>
          <p className="text-stone-400 font-medium">
            {isRTL 
              ? `أهلاً بك يا أستاذ! لديك ${
                  isRTL 
                    ? todayClassesCount.toString().replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[d]) 
                    : todayClassesCount 
                } حصص اليوم و ${
                  isRTL 
                    ? pendingGradingCount.toString().replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[d]) 
                    : pendingGradingCount 
                } واجباً بانتظار التصحيح.` 
              : `Welcome back! You have ${todayClassesCount} classes today and ${pendingGradingCount} assignments to grade.`
            }
          </p>
        </div>
        
        <div className="flex gap-3">
          <button onClick={() => setShowScheduleModal(true)} className={`${btnOutline} rounded-full h-12 px-6`}>
            <Calendar size={18} />
            {isRTL ? "الجدول الأسبوعي" : "Weekly Schedule"}
          </button>
          <button className={`${btnPrimary} rounded-full h-12 px-6 hidden sm:flex`}>
            <Plus size={18} />
            {isRTL ? "إضافة محتوى" : "Add Content"}
          </button>
          
        </div>
      </header>

      {/* High Priority Announcements */}
      {activeHighPriorityAnnouncements.length > 0 && (
        <div className="space-y-3">
          {activeHighPriorityAnnouncements.map(ann => (
            <div 
              key={ann.id} 
              className="p-5 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-[24px] shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shrink-0">
                  <AlertCircle size={20} className="text-yellow-300" />
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

      {/* Main Teacher Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Main Content Area */}
        <section className="lg:col-span-8 space-y-10">
          <Tabs value={activeTab} className="w-full" onValueChange={setActiveTab}>
            <TabsList className="bg-transparent h-14 p-1 gap-2 mb-8 flex justify-start">
              {[
                { value: "classes", label: isRTL ? "فصولي" : "My Classes", icon: LayoutGrid },
                { value: "students", label: isRTL ? "طلابي" : "My Students", icon: Users },
                { value: "grading", label: isRTL ? "التصحيح" : "Grading", icon: ClipboardCheck },
                { value: "materials", label: isRTL ? "المواد" : "Materials", icon: BookOpen }
              ].map(tab => (
                <TabsTrigger 
                  key={tab.value}
                  value={tab.value} 
                  className={`rounded-2xl px-6 h-12 gap-2 font-black text-xs transition-all data-[state=active]:bg-stone-900 data-[state=active]:text-white data-[state=inactive]:text-stone-400 data-[state=inactive]:hover:bg-stone-100`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="classes" className="m-0 space-y-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-2xl font-serif font-black text-stone-900">
                    {isRTL ? "فصولي الدراسية" : "My Classes"}
                  </h3>
                  <p className="text-stone-400 text-xs mt-1">
                    {isRTL ? `إجمالي الفصول المتاحة لك: ${classes.length} فصل` : `Total classes assigned: ${classes.length}`}
                  </p>
                </div>
                <button 
                  onClick={() => setShowAddClassModal(true)}
                  className={`${btnPrimary} h-11 px-5 rounded-2xl gap-2`}
                >
                  <Plus size={16} />
                  {isRTL ? "إضافة فصل جديد" : "Add New Class"}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {classes.map((cls, i) => {
                  const classStudentCount = students.filter(s => studentBelongsToClass(s, cls)).length ||
                                            students.filter(s => matchGrade(s.grade, cls.grade_level)).length;
                  return (
                    <motion.div
                      key={cls.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Card 
                        onClick={() => {
                          setSearchParams(prev => {
                            prev.set("tab", "students");
                            prev.set("classId", cls.id);
                            prev.delete("view");
                            return prev;
                          });
                        }}
                        className="p-8 border-none shadow-sm hover:shadow-2xl transition-all duration-500 rounded-[48px] bg-white group cursor-pointer overflow-hidden relative flex flex-col justify-between min-h-[340px]"
                      >
                        <div className={`absolute top-0 right-0 w-2 h-full ${i % 2 === 0 ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
                        
                        <div>
                          <div className="flex justify-between items-start mb-6">
                            <div className={`h-14 w-14 rounded-2xl ${i % 2 === 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                              <BookOpen size={28} />
                            </div>
                            <Badge className="bg-stone-100 text-stone-700 border-none rounded-xl text-xs font-black px-3 py-1">
                              {isRTL ? `الصف ${cls.grade_level}` : `Grade ${cls.grade_level}`}
                            </Badge>
                          </div>

                          <h4 className="text-2xl font-serif font-black text-stone-900 mb-2 group-hover:text-primary transition-colors">{cls.name}</h4>
                          <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-6">
                            {isRTL 
                              ? `الصف ${cls.grade_level} ${cls.section ? `• القسم/الفصل: ${cls.section}` : ''}` 
                              : `Grade ${cls.grade_level} ${cls.section ? `• Section: ${cls.section}` : ''}`
                            }
                          </p>

                          <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-stone-50 p-4 rounded-3xl text-center">
                              <p className="text-[10px] font-bold text-stone-400 uppercase mb-1">{isRTL ? "الطلاب" : "Students"}</p>
                              <p className="text-xl font-black text-stone-900">
                                {classStudentCount}
                              </p>
                            </div>
                            <div className="bg-stone-50 p-4 rounded-3xl text-center">
                              <p className="text-[10px] font-bold text-stone-400 uppercase mb-1">{isRTL ? "الحضور" : "Attendance"}</p>
                              <p className="text-xl font-black text-emerald-600"> 98٪</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 w-full pt-2">
                          <div className="flex gap-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSearchParams(prev => {
                                  prev.set("tab", "students");
                                  prev.set("classId", cls.id);
                                  prev.delete("view");
                                  return prev;
                                });
                              }}
                              className={`flex-1 ${btnPrimary} rounded-2xl h-12`}
                            >
                              <Users size={16} />
                              {isRTL ? "عرض طلاب الفصل" : "Manage Class Students"}
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSearchParams(prev => {
                                  prev.set("tab", "students");
                                  prev.set("classId", cls.id);
                                  prev.delete("view");
                                  return prev;
                                });
                              }}
                              className={`${btnOutline} h-12 w-12 rounded-2xl`}
                              title={isRTL ? "عرض الطلاب" : "View Students"}
                            >
                              <ChevronRight size={20} className={isRTL ? "rotate-180" : ""} />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openLiveClass(cls);
                            }}
                            className="w-full inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-xs font-black transition-all bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-600 hover:text-white hover:border-teal-600 h-11 cursor-pointer shadow-sm hover:shadow-md active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-teal-400/40"
                          >
                            <Video size={14} />
                            {isRTL ? "بدء حصة افتراضية مباشر" : "Start Live Virtual Class"}
                            <ExternalLink size={12} className="opacity-70" />
                          </button>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
                
                {/* Add New Class Shortcut */}
                <Card 
                  onClick={() => setShowAddClassModal(true)}
                  className="p-8 border-dashed border-2 border-stone-200 bg-stone-50/50 hover:bg-stone-50 flex flex-col items-center justify-center text-center rounded-[48px] hover:border-primary/40 transition-all group cursor-pointer min-h-[340px]"
                >
                  <div className="h-14 w-14 rounded-full bg-white flex items-center justify-center text-stone-400 group-hover:bg-stone-900 group-hover:text-white transition-all mb-4 shadow-sm">
                    <Plus size={28} />
                  </div>
                  <h4 className="font-bold text-stone-700 group-hover:text-stone-900 transition-colors text-lg">
                    {isRTL ? "إضافة فصل جديد" : "Add New Class"}
                  </h4>
                  <p className="text-stone-400 text-xs mt-1 max-w-xs">
                    {isRTL ? "إنشاء وتخصيص مادة أو فصل دراسي جديد لربطه بالطلاب" : "Create a new class or subject and link with students"}
                  </p>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="grading" className="m-0 space-y-6">
              <AssignmentsGradingTab 
                isRTL={isRTL} 
                subjects={classes} 
                teacherClasses={classes}
                teacherSchedules={teacherSchedules}
                teacherId={teacherId}
              />
            </TabsContent>

            <TabsContent value="students" className="m-0 space-y-6">
              <Card className="p-6 md:p-8 bg-white border-none shadow-sm rounded-[48px] space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="text-2xl font-serif font-black text-stone-900">
                      {isRTL ? "إدارة طلاب الفصل" : "Class Students Management"}
                    </h3>
                    <p className="text-stone-400 text-xs mt-1">
                      {isRTL 
                        ? `عرض قائمة طلاب فصولك الدراسية (${filteredTeacherStudents.length} طالب معروض).` 
                        : `Viewing class student list (${filteredTeacherStudents.length} students displayed).`}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    <div className="flex flex-col gap-1.5 min-w-[220px]">
                      <select id="field-teacherportal-select-9" name="select_9" aria-label="select 9" 
                        value={selectedClassId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSearchParams(prev => {
                            if (val === "all") prev.delete("classId");
                            else prev.set("classId", val);
                            return prev;
                          });
                        }}
                        className="bg-stone-50 border border-stone-200 rounded-xl h-11 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
                        dir={isRTL ? "rtl" : "ltr"}
                      >
                        <option value="all">
                          {isRTL ? `جميع طلابي (${(students || []).length})` : `All My Students (${(students || []).length})`}
                        </option>
                        {classes.map(c => {
                          const count = students.filter(s => studentBelongsToClass(s, c)).length ||
                                        students.filter(s => matchGrade(s.grade, c.grade_level)).length;
                          return (
                            <option key={c.id} value={c.id}>
                              {c.name} - {isRTL ? "الصف" : "Grade"} {c.grade_level} {c.section ? `(${c.section})` : ''} - [{count} {isRTL ? "طالب" : "students"}]
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Search box */}
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-stone-400`} size={16} />
                    <Input 
                      placeholder={isRTL ? "البحث باسم الطالب أو الرقم المدرسي أو الهاتف..." : "Search by student name, ID or phone..."}
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className={`${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} bg-stone-50/50 border-stone-200 rounded-xl h-11 text-xs`}
                      dir={isRTL ? "rtl" : "ltr"}
                    />
                  </div>
                  {studentSearch && (
                    <button 
                      onClick={() => setStudentSearch("")}
                      className={`${btnOutline} px-4 h-11 text-xs rounded-xl`}
                    >
                      {isRTL ? "إلغاء البحث" : "Clear"}
                    </button>
                  )}
                </div>

                {isLoadingStudents ? (
                  <div className="w-full py-16 text-center text-stone-500">
                    <div className="flex items-center justify-center gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900"></div>
                      <span>{isRTL ? "جاري تحميل بيانات الطلاب..." : "Loading students..."}</span>
                    </div>
                  </div>
                ) : filteredTeacherStudents.length === 0 ? (
                  <div className="py-14 text-center text-stone-400 border border-dashed border-stone-200 rounded-3xl space-y-3">
                    <Users size={48} className="opacity-20 mx-auto" />
                    <p className="font-bold text-base text-stone-600">
                      {isRTL ? "لا يوجد طلاب مسجلين في هذا الفصل" : "No students found in this class"}
                    </p>
                    <p className="text-xs text-stone-400 max-w-sm mx-auto">
                      {isRTL 
                        ? "يمكنك التبديل لخيار (جميع طلابي) لعرض كافة طلاب المدرسة المسجلين." 
                        : "You can switch to (All My Students) to see all registered school students."}
                    </p>
                    {selectedClassId !== "all" && (
                      <button 
                        onClick={() => {
                          setSearchParams(prev => {
                            prev.delete("classId");
                            return prev;
                          });
                        }}
                        className={`${btnPrimary} h-10 px-5 text-xs rounded-xl mt-2`}
                      >
                        {isRTL ? "عرض جميع طلابي" : "View All My Students"}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-3xl border border-stone-100">
                    <Table>
                      <TableHeader className="bg-stone-50/50">
                        <TableRow>
                          <TableHead className="w-[60px] text-center">#</TableHead>
                          <TableHead>{isRTL ? "الطالب" : "Student"}</TableHead>
                          <TableHead>{isRTL ? "الرقم المدرسي" : "Student ID"}</TableHead>
                          <TableHead>{isRTL ? "الصف والفصل" : "Grade & Section"}</TableHead>
                          <TableHead>{isRTL ? "التواصل" : "Contact"}</TableHead>
                          <TableHead>{isRTL ? "الحالة" : "Status"}</TableHead>
                          <TableHead className="text-center">{isRTL ? "الإجراءات" : "Actions"}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTeacherStudents.map((student, idx) => (
                          <TableRow key={student.id} className="hover:bg-stone-50/30 transition-colors">
                            <TableCell className="text-center text-stone-400 font-mono text-xs">{idx + 1}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                {student.photo_url ? (
                                  <div className="h-9 w-9 rounded-xl overflow-hidden border border-stone-200 shadow-sm shrink-0">
                                    <img src={student.photo_url} alt="" className="h-full w-full object-cover" />
                                  </div>
                                ) : (
                                  <div className="h-9 w-9 rounded-xl bg-stone-100 flex items-center justify-center text-stone-400 font-bold shrink-0">
                                    {(student.full_name || student.name)?.[0]}
                                  </div>
                                )}
                                <span className="font-bold text-stone-800 text-xs">{student.full_name || student.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-stone-550 text-xs">#{student.student_id || student.id?.slice(0, 8)}</TableCell>
                            <TableCell className="text-xs font-semibold text-stone-600">
                              {isRTL ? "الصف" : "Grade"} {student.grade} {student.section ? `• ${student.section}` : ''}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-0.5 text-[10px] text-stone-400 font-medium">
                                <p className="num-en">{student.user_email || student.email || "-"}</p>
                                <p className="num-en">{student.parent_phone || student.phone || "-"}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={`${student.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-stone-100 text-stone-400'} border-none text-[10px] rounded-lg font-bold`}>
                                {isRTL ? (student.status === 'active' ? 'نشط' : 'غير نشط') : (student.status === 'active' ? 'Active' : 'Inactive')}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <button
                                onClick={() => setSelectedStudentForProfile(student)}
                                className={`${btnOutline} h-8 px-3 text-[10px] rounded-xl`}
                              >
                                {isRTL ? "عرض الملف" : "View Profile"}
                              </button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="materials" className="m-0 space-y-6">
              <Card className="p-6 md:p-8 bg-white border-none shadow-sm rounded-[48px]">
                <TeacherStudyMaterialsManager
                  isRTL={isRTL}
                  teacherName={portalUser?.full_name || portalUser?.name || ""}
                />
              </Card>
            </TabsContent>
          </Tabs>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: isRTL ? "متوسط المعدل" : "Average GPA", value: averageGPA, icon: Star, color: "text-amber-500", bg: "bg-amber-50" },
              { 
                label: isRTL ? "الواجبات المكتملة" : "Assignments Done", 
                value: isRTL 
                  ? totalCompletedAssignmentsCount.toString().replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[d]) 
                  : totalCompletedAssignmentsCount.toString(), 
                icon: FileText, 
                color: "text-blue-500", 
                bg: "bg-blue-50" 
              },
              { 
                label: isRTL ? "ساعات التدريس" : "Teaching Hours", 
                value: isRTL 
                  ? (teacherSchedules.length * 2).toString().replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[d]) 
                  : (teacherSchedules.length * 2).toString(), 
                icon: Clock, 
                color: "text-purple-500", 
                bg: "bg-purple-50" 
              },
            ].map((stat, i) => (
              <Card key={i} className="p-6 border-none shadow-sm bg-white rounded-[32px] flex items-center gap-4">
                <div className={`h-12 w-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                  <stat.icon size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{stat.label}</p>
                  <p className="text-xl font-black text-stone-900">{stat.value}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Sidebar - Notifications & Recent Activity */}
        <aside className="lg:col-span-4 space-y-10">
          <Card className="p-8 border-none shadow-sm bg-stone-900 text-white rounded-[48px] relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <h4 className="font-bold">{isRTL ? "كارت أداء الطلاب" : "Student Performance"}</h4>
                <TrendingUp size={20} className="text-emerald-400" />
              </div>
              
              <div className="space-y-6">
                {[
                  { label: isRTL ? "فوق المتوسط" : "Above Average", value: performanceStats.aboveAverage, color: "bg-emerald-500" },
                  { label: isRTL ? "متوسط" : "Average", value: performanceStats.average, color: "bg-amber-500" },
                  { label: isRTL ? "يحتاج تحسين" : "Needs Review", value: performanceStats.needsReview, color: "bg-rose-500" },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-2 text-[10px] font-bold uppercase tracking-widest opacity-60">
                      <span>{item.label}</span>
                      <span>
                        {isRTL 
                          ? `${item.value.toString().replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[d])}٪` 
                          : `${item.value}%`
                        }
                      </span>
                    </div>
                    <Progress value={item.value} className={`h-1.5 bg-white/10 ${item.color}`} />
                  </div>
                ))}
              </div>
              
              <button className="w-full mt-10 bg-white/10 hover:bg-white/20 text-white rounded-2xl h-12 font-bold border border-white/10 transition-all cursor-pointer">
                {isRTL ? "عرض التقرير السنوي" : "View Annual Report"}
              </button>
            </div>
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-primary/20 rounded-full blur-[100px]" />
          </Card>

          <Card className="p-8 border-none shadow-sm bg-white rounded-[48px]">
            <div className="flex items-center justify-between mb-8">
              <h4 className="font-bold text-stone-900">{isRTL ? "التنبيهات العاجلة" : "Urgent Alerts"}</h4>
              <Badge className="bg-rose-500 text-white border-none rounded-full h-5 w-5 flex items-center justify-center p-0 text-[10px] font-black">
                {isRTL 
                  ? urgentAlertsList.length.toString().replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[d]) 
                  : urgentAlertsList.length.toString()
                }
              </Badge>
            </div>
            
            <div className="space-y-6">
              {urgentAlertsList.map((alert, i) => (
                <div key={i} className="flex gap-4 group cursor-pointer">
                  <div className={`h-12 w-12 rounded-2xl ${alert.bg} ${alert.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <alert.icon size={20} />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-stone-850 leading-tight group-hover:text-primary transition-colors">{alert.title}</h5>
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">{alert.time}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <button className="w-full mt-8 rounded-2xl font-bold text-stone-400 hover:text-primary hover:bg-primary/5 cursor-pointer">
              {isRTL ? "عرض جميع التنبيهات" : "View All Alerts"}
            </button>
          </Card>
        </aside>
      </div>
            </>
          )}
        </div>
      </main>

      {/* Add Class Modal Dialog */}
      <Dialog open={showAddClassModal} onOpenChange={setShowAddClassModal}>
        <DialogContent className="max-w-md rounded-[32px] p-6" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="font-serif font-black text-xl text-stone-900 mb-1 flex items-center gap-2">
              <Plus className="text-primary h-5 w-5" />
              {isRTL ? "إضافة فصل أو مادة جديدة" : "Add New Class or Subject"}
            </DialogTitle>
            <p className="text-stone-400 text-xs">
              {isRTL ? "قم بإدخال بيانات الفصل لتضمينه في جدولك وقائمة فصولك الدراسية." : "Enter class details to include in your schedule and class list."}
            </p>
          </DialogHeader>

          <form onSubmit={handleAddClass} className="space-y-4 pt-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700">
                {isRTL ? "اسم المادة / الفصل الدراسى *" : "Subject / Class Name *"}
              </label>
              <Input 
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                placeholder={isRTL ? "مثال: الرياضيات، اللغة العربية، العلوم..." : "e.g. Mathematics, Science..."}
                className="h-11 rounded-xl text-xs bg-stone-50/50 border-stone-200"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700">
                  {isRTL ? "الصف الدراسي *" : "Grade Level *"}
                </label>
                <select 
                  value={newClassGrade}
                  onChange={(e) => setNewClassGrade(e.target.value)}
                  className="w-full bg-stone-50/50 border border-stone-200 rounded-xl h-11 px-3 text-xs font-semibold focus:outline-none"
                  dir={isRTL ? "rtl" : "ltr"}
                >
                  {[
                    { val: "1", ar: "الصف الأول", en: "Grade 1" },
                    { val: "2", ar: "الصف الثاني", en: "Grade 2" },
                    { val: "3", ar: "الصف الثالث", en: "Grade 3" },
                    { val: "4", ar: "الصف الرابع", en: "Grade 4" },
                    { val: "5", ar: "الصف الخامس", en: "Grade 5" },
                    { val: "6", ar: "الصف السادس", en: "Grade 6" },
                    { val: "7", ar: "الصف السابع", en: "Grade 7" },
                    { val: "8", ar: "الصف الثامن", en: "Grade 8" },
                    { val: "9", ar: "الصف التاسع", en: "Grade 9" },
                    { val: "10", ar: "الصف العاشر", en: "Grade 10" },
                    { val: "11", ar: "الصف الحادي عشر", en: "Grade 11" },
                    { val: "12", ar: "الصف الثاني عشر (الثالث الثانوي)", en: "Grade 12" },
                    { val: "level1", ar: "مستوى أول (Level 1)", en: "Level 1" },
                    { val: "level2", ar: "مستوى ثاني (Level 2)", en: "Level 2" }
                  ].map(g => (
                    <option key={g.val} value={g.val}>{isRTL ? g.ar : g.en}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700">
                  {isRTL ? "الفصل / القسم" : "Section"}
                </label>
                <Input 
                  value={newClassSection}
                  onChange={(e) => setNewClassSection(e.target.value)}
                  placeholder={isRTL ? "مثال: المنهج البريطاني، أ، عام" : "e.g. British, A, General"}
                  className="h-11 rounded-xl text-xs bg-stone-50/50 border-stone-200"
                />
              </div>
            </div>

            <DialogFooter className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setShowAddClassModal(false)}
                className={`${btnOutline} flex-1 h-11 text-xs rounded-xl`}
              >
                {isRTL ? "إلغاء" : "Cancel"}
              </button>
              <button
                type="submit"
                disabled={isCreatingClass}
                className={`${btnPrimary} flex-1 h-11 text-xs rounded-xl`}
              >
                {isCreatingClass 
                  ? (isRTL ? "جاري الحفظ..." : "Saving...") 
                  : (isRTL ? "إضافة الفصل" : "Add Class")}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
        <DialogContent className="max-w-4xl rounded-[32px] p-6 max-h-[85vh] overflow-y-auto" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader className="">
            <DialogTitle className="font-serif font-black text-xl text-stone-900 mb-4 flex items-center gap-2">
              <Calendar className="text-primary h-5 w-5" />
              {isRTL ? "الجدول الدراسي الأسبوعي للمعلم" : "Teacher's Weekly Schedule"}
            </DialogTitle>
          </DialogHeader>
          <VisualSchedule classes={teacherSchedules} tasks={teacherTasks} />
        </DialogContent>
      </Dialog>

      {selectedStudentForProfile && (
        <Dialog open={!!selectedStudentForProfile} onOpenChange={(open) => !open && setSelectedStudentForProfile(null)}>
          <DialogContent className="max-w-6xl rounded-[32px] p-6 max-h-[90vh] overflow-y-auto" dir={isRTL ? "rtl" : "ltr"}>
            <div className="relative">
              <AdminStudentProfile
                student={selectedStudentForProfile}
                onClose={() => setSelectedStudentForProfile(null)}
                onEdit={null}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Live virtual class — host confirmation + share/notify */}
      <Dialog open={!!liveClass} onOpenChange={(open) => !open && setLiveClass(null)}>
        <DialogContent className="max-w-md rounded-[32px] p-6" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="font-serif font-black text-xl text-stone-900 flex items-center gap-2">
              <Video className="text-teal-600 h-5 w-5" />
              {isRTL ? "بدء حصة افتراضية مباشرة" : "Start Live Virtual Class"}
            </DialogTitle>
            <DialogDescription className="text-stone-400 text-xs leading-relaxed">
              {isRTL
                ? `تم فتح نافذة جديدة لإنشاء اجتماع Google Meet باسمك — ستدخل كمُنظِّم (Host) تلقائيًا، ما يمنحك كامل صلاحيات التحكم: الميكروفون، مشاركة الشاشة، وإدارة انضمام الطلاب.`
                : `A new tab opened to create a Google Meet as you — you'll join as the host automatically, with full controls: microphone, screen sharing, and participant management.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700">
                {isRTL ? "رابط الاجتماع" : "Meeting link"}
              </label>
              <div className="flex gap-2">
                <Input
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  placeholder="https://meet.google.com/..."
                  className="h-11 rounded-xl text-xs bg-stone-50/50 border-stone-200"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={copyMeetingLink}
                  className="inline-flex items-center gap-1.5 h-11 px-4 rounded-xl border-2 border-stone-200 bg-white text-stone-700 text-xs font-bold hover:bg-stone-50 cursor-pointer shrink-0"
                >
                  <Copy size={14} />
                  {isRTL ? "نسخ" : "Copy"}
                </button>
              </div>
              <p className="text-[11px] text-stone-400 leading-relaxed">
                {isRTL
                  ? "الصق رابط الاجتماع الفعلي من تبويب Google Meet المفتوح، ثم احفظه لإشعار طلاب هذا الفصل."
                  : "Paste the actual meeting link from the opened Google Meet tab, then save it to notify this class's students."}
              </p>
            </div>

            {notifiedCount !== null && (
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                <CheckCircle2 size={14} />
                {isRTL ? `تم إرسال الإشعار إلى ${notifiedCount} طالب` : `Notified ${notifiedCount} students`}
              </div>
            )}

            <DialogFooter className="flex gap-2">
              <button
                type="button"
                onClick={() => window.open("https://meet.google.com/new", "_blank", "noopener,noreferrer")}
                className="inline-flex items-center gap-1.5 h-11 px-4 rounded-xl border-2 border-stone-200 bg-white text-stone-700 text-xs font-bold hover:bg-stone-50 cursor-pointer"
              >
                <ExternalLink size={14} />
                {isRTL ? "فتح اجتماع جديد" : "Open new meeting"}
              </button>
              <button
                type="button"
                onClick={notifyClassStudents}
                disabled={notifying}
                className="inline-flex items-center gap-1.5 h-11 px-5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black cursor-pointer disabled:opacity-50"
              >
                <Send size={14} />
                {notifying ? (isRTL ? "جارٍ الإرسال..." : "Sending...") : (isRTL ? "حفظ وإشعار الطلاب" : "Save & notify students")}
              </button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}

function AttendanceTabContent({ isRTL, classes, students, portalUser }) {
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || "all");
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState({}); // student_id -> status
  const [isSaving, setIsSaving] = useState(false);

  const selectedClass = classes.find(c => String(c.id) === String(selectedClassId));

  const classStudents = React.useMemo(() => {
    if (!students || students.length === 0) return [];
    if (!selectedClass || selectedClassId === "all") return students;
    const matched = students.filter(student => studentBelongsToClass(student, selectedClass));
    if (matched.length > 0) return matched;
    const gradeMatched = students.filter(student => matchGrade(student.grade, selectedClass.grade_level || selectedClass.grade));
    return gradeMatched.length > 0 ? gradeMatched : students;
  }, [students, selectedClass, selectedClassId]);

  const handleStatusChange = (studentId, status) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSaveAttendance = async () => {
    if (classStudents.length === 0) {
      toast.error(isRTL ? "لا يوجد طلاب في هذا الفصل لتسجيل حضورهم." : "No students in this class to record attendance.");
      return;
    }

    setIsSaving(true);
    try {
      const timeStr = new Date().toLocaleTimeString(isRTL ? "ar-EG" : "en-US", { 
        hour: "2-digit", 
        minute: "2-digit" 
      });

      for (const student of classStudents) {
        const status = attendanceRecords[student.id] || "present";
        await entities.Attendance.create({
          student_id: student.id,
          student_name: student.full_name || student.name,
          student_card_id: student.student_id || student.id,
          date: attendanceDate,
          type: "manual",
          status: status,
          time: timeStr,
          recorded_by: portalUser?.full_name || "معلم الصف",
          notes: isRTL ? `تم رصد الحضور يدوياً للمادة: ${selectedClass.name}` : `Manual attendance recorded for subject: ${selectedClass.name}`
        });
      }

      toast.success(isRTL ? "تم حفظ سجل حضور الطلاب بنجاح!" : "Student attendance saved successfully!");
    } catch (err) {
      console.error(err);
      toast.error(isRTL ? "فشل حفظ كشف الحضور." : "Failed to save attendance.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title={isRTL ? "رصد حضور وغياب الطلاب" : "Student Attendance Tracking"} 
        subtitle={isRTL ? "قم باختيار المادة والصف لتسجيل حضور وغياب الطلاب لليوم." : "Select subject and class to log student attendance status for today."}
      >
        <button onClick={() => window.location.href = "/teacher-portal"} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all border-2 border-stone-300 bg-white text-stone-800 hover:bg-stone-50 hover:border-stone-400 cursor-pointer h-11 px-5">
          {isRTL ? "العودة للوحة التحكم" : "Back to Dashboard"}
        </button>
      </PageHeader>

      <Card className="p-6 md:p-8 bg-white border-none shadow-sm rounded-[40px] space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-end justify-between border-b border-stone-50 pb-6">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="flex flex-col gap-1.5 flex-1 max-w-xs">
              <label htmlFor="field-teacherportal-select-8" className="text-xs font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "الفصل الدراسي" : "Class Section"}</label>
              <select id="field-teacherportal-select-8" name="select_8" aria-label="select 8" 
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setAttendanceRecords({});
                }}
                className="bg-stone-50 border border-stone-200 rounded-xl h-11 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
                dir={isRTL ? "rtl" : "ltr"}
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} - {isRTL ? "الفصل" : "Class"} {c.section || 'أبو بكر'} ({c.grade_level})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5 max-w-xs">
              <label htmlFor="field-teacherportal-input-7" className="text-xs font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "التاريخ" : "Date"}</label>
              <input id="field-teacherportal-input-7" name="input_7" aria-label="input 7" 
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="bg-stone-50 border border-stone-200 rounded-xl h-11 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <button 
            onClick={handleSaveAttendance}
            disabled={isSaving || classStudents.length === 0}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all bg-stone-900 text-white hover:bg-black cursor-pointer shadow-lg shadow-stone-200 h-11 px-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (isRTL ? "جاري الحفظ..." : "Saving...") : (isRTL ? "حفظ كشف الحضور" : "Save Attendance")}
          </button>
        </div>

        {classStudents.length === 0 ? (
          <div className="py-12 text-center text-stone-400 border border-dashed border-stone-100 rounded-3xl">
            <Users size={40} className="opacity-20 mx-auto mb-2" />
            <p className="font-bold text-base">{isRTL ? "لا يوجد طلاب مسجلين في هذا الفصل" : "No students found in this class"}</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-stone-100">
            <Table>
              <TableHeader className="bg-stone-50/50">
                <TableRow>
                  <TableHead className="w-[60px] text-center">#</TableHead>
                  <TableHead>{isRTL ? "الطالب" : "Student"}</TableHead>
                  <TableHead>{isRTL ? "الرقم المدرسي" : "Student ID"}</TableHead>
                  <TableHead>{isRTL ? "الصف والفصل" : "Grade & Section"}</TableHead>
                  <TableHead className="text-center w-[350px]">{isRTL ? "حالة الحضور" : "Attendance Status"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classStudents.map((student, idx) => {
                  const currentStatus = attendanceRecords[student.id] || "present";
                  return (
                    <TableRow key={student.id} className="hover:bg-stone-50/30 transition-colors">
                      <TableCell className="text-center text-stone-400 font-mono text-xs">{idx + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {student.photo_url ? (
                            <div className="h-9 w-9 rounded-xl overflow-hidden border border-stone-200 shadow-sm shrink-0">
                              <img src={student.photo_url} alt="" className="h-full w-full object-cover" />
                            </div>
                          ) : (
                            <div className="h-9 w-9 rounded-xl bg-stone-100 flex items-center justify-center text-stone-400 font-bold shrink-0">
                              {(student.full_name || student.name)?.[0]}
                            </div>
                          )}
                          <span className="font-bold text-stone-850 text-xs">{student.full_name || student.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-stone-550 text-xs">#{student.student_id}</TableCell>
                      <TableCell className="text-xs font-semibold text-stone-600">
                        {isRTL ? "الصف" : "Grade"} {student.grade} - {student.section || "أبو بكر"}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="inline-flex p-1 bg-stone-100 rounded-xl gap-1">
                          {[
                            { value: "present", label: isRTL ? "حاضر" : "Present", activeClass: "bg-emerald-500 text-white shadow-sm" },
                            { value: "absent", label: isRTL ? "غائب" : "Absent", activeClass: "bg-rose-500 text-white shadow-sm" },
                            { value: "late", label: isRTL ? "متأخر" : "Late", activeClass: "bg-amber-500 text-stone-900 shadow-sm" }
                          ].map(opt => (
                            <button
                              key={opt.value}
                              onClick={() => handleStatusChange(student.id, opt.value)}
                              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                currentStatus === opt.value
                                  ? opt.activeClass
                                  : "text-stone-500 hover:text-stone-800 hover:bg-white/50"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}

function BadgesTabContent({ isRTL, classes, students, portalUser }) {
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [badgeTitle, setBadgeTitle] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [description, setDescription] = useState("");
  const [points, setPoints] = useState(50);
  const [isAwarding, setIsAwarding] = useState(false);

  // List of all students matching this teacher's classes
  const allMyStudents = React.useMemo(() => {
    return students.filter(student => {
      return classes.some(cls => {
        const studentGrade = student.grade?.toString();
        const clsGrade = cls.grade?.toString();
        const studentSection = (student.section || '').toLowerCase().trim();
        const clsSection = (cls.section || '').toLowerCase().trim();
        return studentGrade === clsGrade && (studentSection === clsSection || clsSection === 'a' || clsSection === 'all' || clsSection === '' || clsSection === 'أ');
      });
    });
  }, [students, classes]);

  const badgeTemplates = [
    { title: isRTL ? "جائزة التميز العلمي" : "Academic Excellence", points: 150, desc: isRTL ? "للحصول على الدرجة الكاملة والتميز الأكاديمي المستمر" : "For achieving full scores and continuous academic excellence" },
    { title: isRTL ? "لقب الطالب المثالي" : "Ideal Student", points: 200, desc: isRTL ? "للالتزام التام بالسلوك الحسن والمبادئ القيادية في المدرسة" : "For outstanding moral character and leadership skills at school" },
    { title: isRTL ? "المبدع المتميز" : "Creative Innovator", points: 100, desc: isRTL ? "لتقديم أفكار ومشاريع إبداعية متميزة في المادة" : "For contributing outstanding creative ideas and projects" },
    { title: isRTL ? "طالب الأسبوع" : "Student of the Week", points: 50, desc: isRTL ? "للمشاركة الفعالة والاجتهاد المميز طوال الأسبوع" : "For active participation and great diligence throughout the week" }
  ];

  const handleTemplateSelect = (tmpl) => {
    setBadgeTitle(tmpl.title);
    setPoints(tmpl.points);
    setDescription(tmpl.desc);
  };

  const handleAwardBadge = async () => {
    if (!selectedStudentId) {
      toast.error(isRTL ? "يرجى اختيار الطالب أولاً." : "Please select a student first.");
      return;
    }
    const finalTitle = badgeTitle === "custom" ? customTitle : badgeTitle;
    if (!finalTitle.trim()) {
      toast.error(isRTL ? "يرجى تحديد أو كتابة عنوان الوسام." : "Please select or enter a badge title.");
      return;
    }

    const studentObj = students.find(s => s.id === selectedStudentId);
    if (!studentObj) return;

    setIsAwarding(true);
    try {
      await entities.StudentAward.create({
        student_id: studentObj.student_id, // uses student_id string (like '0006')
        student_name: studentObj.full_name || studentObj.name,
        award_type: "medal",
        title: finalTitle,
        description: description,
        points: String(points),
        awarded_by: portalUser?.full_name || "معلم المادة",
        date: new Date().toISOString().split('T')[0]
      });

      toast.success(isRTL ? `تم منح وسام (${finalTitle}) للطالب (${studentObj.full_name}) بنجاح!` : `Badge (${finalTitle}) awarded to student (${studentObj.full_name}) successfully!`);
      
      // Clear form
      setSelectedStudentId("");
      setBadgeTitle("");
      setCustomTitle("");
      setDescription("");
      setPoints(50);
    } catch (err) {
      console.error(err);
      toast.error(isRTL ? "فشل منح الوسام للطالب." : "Failed to award badge.");
    } finally {
      setIsAwarding(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title={isRTL ? "لوحة الأوسمة وتكريم الطلاب" : "Student Honors & Badges Dashboard"} 
        subtitle={isRTL ? "تفضل بمنح الأوسمة والنقاط للطلاب المتميزين لتحفيزهم على الإبداع." : "Award badges and points to exceptional students to motivate innovation."}
      >
        <button onClick={() => window.location.href = "/teacher-portal"} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all border-2 border-stone-300 bg-white text-stone-800 hover:bg-stone-50 hover:border-stone-400 cursor-pointer h-11 px-5">
          {isRTL ? "العودة للوحة التحكم" : "Back to Dashboard"}
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Award Form */}
        <div className="lg:col-span-7">
          <Card className="p-6 md:p-8 bg-white border-none shadow-sm rounded-[40px] space-y-6">
            <h4 className="font-serif font-black text-xl text-stone-900 border-b border-stone-50 pb-4">
              {isRTL ? "استمارة منح وسام جديد" : "New Badge Award Form"}
            </h4>

            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="field-teacherportal-select-6" className="text-xs font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "اختر الطالب" : "Select Student"}</label>
                <select id="field-teacherportal-select-6" name="select_6" aria-label="select 6" 
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="bg-stone-50 border border-stone-200 rounded-xl h-11 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
                  dir={isRTL ? "rtl" : "ltr"}
                >
                  <option value="">{isRTL ? "-- اختر الطالب المكرم --" : "-- Choose student to honor --"}</option>
                  {allMyStudents.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.full_name || s.name} (#{s.student_id}) - {isRTL ? "الصف" : "Grade"} {s.grade} - {s.section || "A"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="field-teacherportal-select-5" className="text-xs font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "اختر الوسام" : "Choose Badge"}</label>
                <select id="field-teacherportal-select-5" name="select_5" aria-label="select 5" 
                  value={badgeTitle}
                  onChange={(e) => setBadgeTitle(e.target.value)}
                  className="bg-stone-50 border border-stone-200 rounded-xl h-11 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
                  dir={isRTL ? "rtl" : "ltr"}
                >
                  <option value="">{isRTL ? "-- اختر وساماً أو حدد وساماً مخصصاً --" : "-- Select badge template or create custom --"}</option>
                  {badgeTemplates.map((t, idx) => (
                    <option key={idx} value={t.title}>{t.title} (+{t.points} XP)</option>
                  ))}
                  <option value="custom">{isRTL ? "✍️ وسام مخصص جديد..." : "✍️ Custom Badge..."}</option>
                </select>
              </div>

              {badgeTitle === "custom" && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "عنوان الوسام المخصص" : "Custom Badge Title"}</label>
                  <Input 
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="h-11 rounded-xl border-stone-200 font-semibold focus-visible:ring-primary/20 bg-stone-50"
                    placeholder={isRTL ? "مثال: بطل الفيزياء المتفوق..." : "e.g., Physics Superstar..."}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "النقاط الممنوحة (XP)" : "XP Points Offered"}</label>
                  <Input 
                    type="number"
                    value={points}
                    onChange={(e) => setPoints(e.target.value)}
                    className="h-11 rounded-xl border-stone-200 font-semibold focus-visible:ring-primary/20 bg-stone-50 num-en"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="field-teacherportal-textarea-4" className="text-xs font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "الوصف وأسباب منح الوسام" : "Honors Description & Motivation"}</label>
                <textarea id="field-teacherportal-textarea-4" name="textarea_4" aria-label="textarea 4" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="p-3 rounded-xl border border-stone-200 font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 bg-stone-50 text-xs leading-relaxed"
                  placeholder={isRTL ? "اكتب أسباب منح الوسام لهذا الطالب بوضوح..." : "Describe student accomplishments that earned this honor..."}
                />
              </div>

              <button 
                onClick={handleAwardBadge}
                disabled={isAwarding}
                className="w-full inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all bg-stone-900 text-white hover:bg-black cursor-pointer shadow-lg shadow-stone-200 h-12 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trophy size={16} className="text-yellow-400" />
                <span>{isAwarding ? (isRTL ? "جاري منح التكريم..." : "Awarding...") : (isRTL ? "منح وسام التقدير" : "Award Honor Badge")}</span>
              </button>
            </div>
          </Card>
        </div>

        {/* Templates Quick Select */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-6 md:p-8 bg-white border-none shadow-sm rounded-[40px] space-y-6">
            <h4 className="font-serif font-black text-lg text-stone-900 border-b border-stone-50 pb-4">
              {isRTL ? "قوانب أوسمة سريعة" : "Quick Badge Templates"}
            </h4>

            <div className="space-y-4">
              {badgeTemplates.map((tmpl, idx) => (
                <div 
                  key={idx} 
                  onClick={() => handleTemplateSelect(tmpl)}
                  className="p-4 rounded-2xl border border-stone-100 hover:border-amber-200 hover:bg-amber-50/20 cursor-pointer transition-all flex items-start gap-4 group"
                >
                  <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-all shrink-0">
                    <Trophy size={20} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold text-stone-850">{tmpl.title}</h5>
                      <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded num-en">+{tmpl.points} XP</span>
                    </div>
                    <p className="text-[10px] text-stone-400 font-semibold leading-normal">{tmpl.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function GradesTabContent({ isRTL, classes, students, portalUser }) {
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || "all");
  const [term, setTerm] = useState("Term 1");
  const [assessmentName, setAssessmentName] = useState("");
  const [maxScore, setMaxScore] = useState(100);
  const [grades, setGrades] = useState({}); // studentId -> score
  const [notes, setNotes] = useState({}); // studentId -> note
  const [isSaving, setIsSaving] = useState(false);

  const selectedClass = classes.find(c => c.id === selectedClassId);

  const classStudents = React.useMemo(() => {
    if (!selectedClass) return [];
    return students.filter(student => {
      const studentGrade = student.grade?.toString();
      const clsGrade = selectedClass.grade?.toString();
      const studentSection = (student.section || '').toLowerCase().trim();
      const clsSection = (selectedClass.section || '').toLowerCase().trim();
      return studentGrade === clsGrade && (studentSection === clsSection || clsSection === 'a' || clsSection === 'all' || clsSection === '' || clsSection === 'أ');
    });
  }, [students, selectedClass]);

  const handleScoreChange = (studentId, val) => {
    setGrades(prev => ({ ...prev, [studentId]: val }));
  };

  const handleNoteChange = (studentId, val) => {
    setNotes(prev => ({ ...prev, [studentId]: val }));
  };

  const calculateStats = () => {
    const scores = Object.values(grades).map(Number).filter(s => !isNaN(s));
    if (scores.length === 0) return { avg: 0, passRate: 0, max: 0 };
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const passCount = scores.filter(s => (s / maxScore) * 100 >= 50).length;
    const passRate = Math.round((passCount / scores.length) * 100);
    const max = Math.max(...scores);
    return { avg, passRate, max };
  };

  const { avg, passRate, max } = calculateStats();

  const handleSaveGrades = async () => {
    if (!assessmentName.trim()) {
      toast.error(isRTL ? "يرجى إدخال اسم الاختبار أو الامتحان." : "Please enter assessment name.");
      return;
    }
    if (classStudents.length === 0) {
      toast.error(isRTL ? "لا يوجد طلاب في هذا الفصل لرصد درجاتهم." : "No students in this class to grade.");
      return;
    }

    setIsSaving(true);
    try {
      for (const student of classStudents) {
        const scoreVal = grades[student.id];
        if (scoreVal === undefined || scoreVal === "") continue;
        
        const numericScore = parseFloat(scoreVal);
        const percentage = Math.round((numericScore / maxScore) * 100);
        let label = `${percentage}%`;
        if (percentage >= 90) label = "A+";
        else if (percentage >= 80) label = "A";
        else if (percentage >= 70) label = "B";
        else if (percentage >= 60) label = "C";
        else if (percentage >= 50) label = "D";
        else label = "F";

        await entities.StudentGrade.create({
          student_id: student.student_id || student.id,
          student_name: student.full_name || student.name,
          subject_name: `${selectedClass.name} - ${assessmentName}`,
          score: numericScore,
          max_score: String(maxScore),
          grade_label: label,
          term: term,
          academic_year: "2025-2026",
          teacher_name: portalUser?.full_name || "معلم المادة",
          notes: notes[student.id] || ""
        });
      }
      toast.success(isRTL ? "تم حفظ ورصد درجات الطلاب بنجاح!" : "Grades saved successfully!");
      setGrades({});
      setNotes({});
      setAssessmentName("");
    } catch (err) {
      console.error(err);
      toast.error(isRTL ? "فشل حفظ درجات الطلاب." : "Failed to save grades.");
    } finally {
      setIsSaving(false);
    }
  };

  const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all border-2 border-stone-300 bg-white text-stone-800 hover:bg-stone-50 hover:border-stone-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
  const btnPrimary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all bg-stone-900 text-white hover:bg-black cursor-pointer shadow-lg shadow-stone-200 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="space-y-6">
      <PageHeader 
        title={isRTL ? "رصد الدرجات والنتائج" : "Student Grades & Results"} 
        subtitle={isRTL ? "قم بإدخال درجات الاختبارات والامتحانات الدورية لطلابك." : "Enter grades for quizzes, midterms, and finals."}
      >
        <button onClick={() => window.location.href = "/teacher-portal"} className={`${btnOutline} h-11 px-5 rounded-xl`}>
          {isRTL ? "العودة للوحة التحكم" : "Back to Dashboard"}
        </button>
      </PageHeader>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-white border-none shadow-sm rounded-3xl flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "متوسط درجات الفصل" : "Class Average"}</p>
            <h4 className="text-3xl font-black text-teal-600 mt-2 num-en">{avg}/{maxScore}</h4>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
        </Card>

        <Card className="p-6 bg-white border-none shadow-sm rounded-3xl flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "نسبة النجاح المقدرة" : "Pass Rate"}</p>
            <h4 className="text-3xl font-black text-emerald-600 mt-2 num-en">{passRate}%</h4>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
        </Card>

        <Card className="p-6 bg-white border-none shadow-sm rounded-3xl flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "أعلى درجة مرصودة" : "Highest Score"}</p>
            <h4 className="text-3xl font-black text-amber-500 mt-2 num-en">{max}/{maxScore}</h4>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
            <Trophy size={24} />
          </div>
        </Card>
      </div>

      <Card className="p-6 md:p-8 bg-white border-none shadow-sm rounded-[40px] space-y-6">
        {/* Config controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border-b border-stone-50 pb-6">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="field-teacherportal-select-3" className="text-xs font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "اختر الفصل" : "Class Section"}</label>
            <select id="field-teacherportal-select-3" name="select_3" aria-label="select 3" 
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setGrades({});
                setNotes({});
              }}
              className="bg-stone-50 border border-stone-200 rounded-xl h-11 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
              dir={isRTL ? "rtl" : "ltr"}
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} - {isRTL ? "الفصل" : "Class"} {c.section || 'أبو بكر'} ({c.grade_level})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="field-teacherportal-select-2" className="text-xs font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "الفترة / الفصل الدراسي" : "Term"}</label>
            <select id="field-teacherportal-select-2" name="select_2" aria-label="select 2" 
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-xl h-11 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
              dir={isRTL ? "rtl" : "ltr"}
            >
              <option value="Term 1">{isRTL ? "الفصل الدراسي الأول" : "Term 1"}</option>
              <option value="Term 2">{isRTL ? "الفصل الدراسي الثاني" : "Term 2"}</option>
              <option value="Term 3">{isRTL ? "الفصل الدراسي الثالث" : "Term 3"}</option>
              <option value="Final">{isRTL ? "الامتحان النهائي" : "Final"}</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5 md:col-span-1">
            <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "اسم الاختبار / التقييم" : "Assessment / Test Title"}</label>
            <Input 
              value={assessmentName}
              onChange={(e) => setAssessmentName(e.target.value)}
              placeholder={isRTL ? "مثال: اختبار قصير 1، امتحان نصفي" : "e.g., Quiz 1, Midterm"}
              className="h-11 rounded-xl border-stone-200 font-semibold bg-stone-50 text-xs"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "الدرجة العظمى" : "Max Score"}</label>
            <Input 
              type="number"
              value={maxScore}
              onChange={(e) => setMaxScore(Number(e.target.value) || 100)}
              className="h-11 rounded-xl border-stone-200 font-semibold bg-stone-50 text-xs num-en"
            />
          </div>
        </div>

        {classStudents.length === 0 ? (
          <div className="py-12 text-center text-stone-400 border border-dashed border-stone-100 rounded-3xl">
            <Users size={40} className="opacity-20 mx-auto mb-2" />
            <p className="font-bold text-base">{isRTL ? "لا يوجد طلاب مسجلين في هذا الفصل" : "No students found in this class"}</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="overflow-x-auto rounded-3xl border border-stone-100">
              <Table>
                <TableHeader className="bg-stone-50/50">
                  <TableRow>
                    <TableHead className="w-[60px] text-center">#</TableHead>
                    <TableHead>{isRTL ? "الطالب" : "Student"}</TableHead>
                    <TableHead>{isRTL ? "الرقم المدرسي" : "Student ID"}</TableHead>
                    <TableHead className="w-[150px]">{isRTL ? "الدرجة المرصودة" : "Score"}</TableHead>
                    <TableHead>{isRTL ? "ملاحظات المعلم / التغذية الراجعة" : "Notes / Feedback"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classStudents.map((student, idx) => (
                    <TableRow key={student.id} className="hover:bg-stone-50/30 transition-colors">
                      <TableCell className="text-center text-stone-400 font-mono text-xs">{idx + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {student.photo_url ? (
                            <div className="h-9 w-9 rounded-xl overflow-hidden border border-stone-200 shadow-sm shrink-0">
                              <img src={student.photo_url} alt="" className="h-full w-full object-cover" />
                            </div>
                          ) : (
                            <div className="h-9 w-9 rounded-xl bg-stone-100 flex items-center justify-center text-stone-400 font-bold shrink-0">
                              {(student.full_name || student.name)?.[0]}
                            </div>
                          )}
                          <span className="font-bold text-stone-850 text-xs">{student.full_name || student.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-stone-550 text-xs">#{student.student_id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Input 
                            type="number"
                            min="0"
                            max={maxScore}
                            value={grades[student.id] || ""}
                            onChange={(e) => handleScoreChange(student.id, e.target.value)}
                            placeholder="0"
                            className="w-20 h-10 rounded-lg border-stone-200 text-center font-bold num-en"
                          />
                          <span className="text-xs font-semibold text-stone-450">/ {maxScore}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input 
                          value={notes[student.id] || ""}
                          onChange={(e) => handleNoteChange(student.id, e.target.value)}
                          placeholder={isRTL ? "ملاحظات حول أداء الطالب..." : "Student performance feedback..."}
                          className="h-10 rounded-lg border-stone-200 text-xs"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end pt-4">
              <button 
                onClick={handleSaveGrades}
                disabled={isSaving || Object.keys(grades).length === 0}
                className={`${btnPrimary} h-12 px-8 shadow-md`}
              >
                {isSaving ? (isRTL ? "جاري الحفظ والرفع..." : "Saving & Posting...") : (isRTL ? "تأكيد ورصد درجات الطلاب" : "Post Student Grades")}
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function TeacherRequestsView({ isRTL, portalUser, teacherId }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);

  const myName = portalUser?.full_name || "الأستاذ أحمد";

  const [requests, setRequests] = useState(() => {
    const saved = localStorage.getItem("staff_requests");
    return saved ? JSON.parse(saved) : [];
  });

  const myRequests = useMemo(() => {
    return requests.filter(r => r.employeeName === myName);
  }, [requests, myName]);

  const [newReqType, setNewReqType] = useState("LEAVE");
  const [newReqReason, setNewReqReason] = useState("");
  const [newReqAmount, setNewReqAmount] = useState("");
  const [newReqDuration, setNewReqDuration] = useState("");

  const handleCreateRequest = (e) => {
    e.preventDefault();
    if (!newReqReason) return;

    const id = "req-" + Date.now();
    const durationText = newReqType === "LOAN" 
      ? (isRTL ? `سلفة بقيمة ${Number(newReqAmount).toLocaleString()} ر.س` : `Loan of ${Number(newReqAmount).toLocaleString()} SAR`)
      : newReqDuration;

    const newRequest = {
      id,
      employeeName: myName,
      role: "Teacher",
      type: newReqType,
      date: new Date().toISOString().split('T')[0],
      duration: durationText || (isRTL ? "يوم واحد" : "1 Day"),
      reason: newReqReason,
      loanAmount: newReqType === "LOAN" ? Number(newReqAmount || 0) : undefined,
      status: "PENDING",
      createdAt: new Date().toISOString().split('T')[0]
    };

    const updated = [newRequest, ...requests];
    setRequests(updated);
    localStorage.setItem("staff_requests", JSON.stringify(updated));
    setIsNewRequestOpen(false);
    toast.success(isRTL ? "تم إرسال طلبك للإدارة بنجاح" : "Request submitted to administration successfully");

    setNewReqReason("");
    setNewReqAmount("");
    setNewReqDuration("");
  };

  const getStatusBadge = (status) => {
    const map = {
      'PENDING': { bg: 'bg-amber-50 text-amber-700 border-amber-200/50', label: isRTL ? 'قيد الانتظار' : 'Pending' },
      'APPROVED': { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/50', label: isRTL ? 'معتمد' : 'Approved' },
      'REJECTED': { bg: 'bg-rose-50 text-rose-700 border-rose-200/50', label: isRTL ? 'مرفوض' : 'Rejected' },
    };
    const current = map[status] || map['PENDING'];
    return (
      <Badge className={`${current.bg} border rounded-lg font-bold text-xs px-2.5 py-1`}>
        {current.label}
      </Badge>
    );
  };

  const getRequestTypeDisplay = (type) => {
    const map = {
      'LEAVE': { label: isRTL ? 'طلب إجازة' : 'Leave Request', color: 'text-blue-600 bg-blue-50' },
      'PERMISSION': { label: isRTL ? 'طلب استئذان' : 'Permission', color: 'text-amber-600 bg-amber-50' },
      'PUNCH_CORRECTION': { label: isRTL ? 'تصحيح بصمة' : 'Punch Correction', color: 'text-violet-600 bg-violet-50' },
      'LOAN': { label: isRTL ? 'طلب سلفة' : 'Loan Request', color: 'text-emerald-600 bg-emerald-50' },
    };
    return map[type] || { label: type, color: 'text-stone-600 bg-stone-50' };
  };

  const filteredRequests = useMemo(() => {
    return myRequests.filter(r => {
      const matchSearch = r.reason.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = typeFilter === "all" || r.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [myRequests, searchTerm, typeFilter]);

  const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all border-2 border-stone-300 bg-white text-stone-800 hover:bg-stone-50 hover:border-stone-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
  const btnPrimary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all bg-stone-900 text-white hover:bg-black cursor-pointer shadow-lg shadow-stone-200 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4">
        <button onClick={() => setIsNewRequestOpen(true)} className={`${btnPrimary} h-11 px-5 rounded-xl`}>
          <Plus size={16} />
          <span>{isRTL ? "طلب جديد" : "New Request"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-white border-none shadow-sm rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-stone-400 text-xs font-bold uppercase">{isRTL ? "طلباتي الكلية" : "Total Requests"}</p>
            <h4 className="text-2xl font-black text-stone-900 num-en">{myRequests.length}</h4>
          </div>
        </Card>
        <Card className="p-6 bg-white border-none shadow-sm rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-stone-400 text-xs font-bold uppercase">{isRTL ? "قيد الانتظار" : "Pending"}</p>
            <h4 className="text-2xl font-black text-amber-600 num-en">{myRequests.filter(r => r.status === "PENDING").length}</h4>
          </div>
        </Card>
        <Card className="p-6 bg-white border-none shadow-sm rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-stone-400 text-xs font-bold uppercase">{isRTL ? "المعتمدة" : "Approved"}</p>
            <h4 className="text-2xl font-black text-emerald-600 num-en">{myRequests.filter(r => r.status === "APPROVED").length}</h4>
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-white border-none shadow-sm rounded-3xl space-y-4">
        <div className="relative">
          <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-stone-400`} size={16} />
          <Input 
            placeholder={isRTL ? "ابحث في طلباتك..." : "Search your requests..."} 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} bg-stone-50 border-stone-200 rounded-xl h-11 text-xs`}
            dir={isRTL ? "rtl" : "ltr"}
          />
        </div>

        <div className="space-y-3 pt-2">
          {filteredRequests.length === 0 ? (
            <div className="py-12 text-center text-stone-400 border border-dashed border-stone-100 rounded-2xl">
              {isRTL ? "لا توجد طلبات مسجلة." : "No requests found."}
            </div>
          ) : (
            filteredRequests.map((req) => {
              const display = getRequestTypeDisplay(req.type);
              return (
                <div key={req.id} className="p-4 bg-stone-50 rounded-2xl flex items-center justify-between gap-4 border border-stone-100/50">
                  <div>
                    <h5 className="font-bold text-stone-850 text-sm">{req.reason}</h5>
                    <p className="text-xs text-stone-400 mt-1 flex items-center gap-2 font-medium">
                      <span className={`px-2 py-0.5 rounded ${display.color} text-[10px] font-bold`}>{display.label}</span>
                      <span>·</span>
                      <span className="num-en">{req.date}</span>
                      <span>·</span>
                      <span>{req.duration}</span>
                    </p>
                  </div>
                  <div>
                    {getStatusBadge(req.status)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      <Dialog open={isNewRequestOpen} onOpenChange={setIsNewRequestOpen}>
        <DialogContent className="max-w-md rounded-3xl" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="text-lg font-serif font-black">{isRTL ? "تقديم طلب جديد" : "New Request"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateRequest} className="space-y-4 mt-2">
            <div className="space-y-1">
              <label htmlFor="field-teacherportal-select-1" className="text-xs font-bold text-stone-500">{isRTL ? "نوع الطلب" : "Request Type"}</label>
              <select id="field-teacherportal-select-1" name="select_1" aria-label="select 1" 
                value={newReqType} 
                onChange={(e) => setNewReqType(e.target.value)}
                className="w-full bg-white border border-stone-200 rounded-xl h-10 px-3 text-xs font-bold text-stone-700 outline-none"
              >
                <option value="LEAVE">{isRTL ? "طلب إجازة" : "Leave"}</option>
                <option value="PERMISSION">{isRTL ? "طلب استئذان" : "Permission"}</option>
                <option value="PUNCH_CORRECTION">{isRTL ? "تصحيح بصمة" : "Punch Correction"}</option>
                <option value="LOAN">{isRTL ? "طلب سلفة مالية" : "Financial Loan"}</option>
              </select>
            </div>

            {newReqType === "LOAN" ? (
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-500">{isRTL ? "مبلغ السلفة (بالريال السعودي)" : "Loan Amount (SAR)"}</label>
                <Input 
                  type="number" 
                  value={newReqAmount} 
                  onChange={(e) => setNewReqAmount(e.target.value)} 
                  placeholder="1500" 
                  className="rounded-xl border-stone-200"
                  required
                />
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-500">{isRTL ? "المدة أو التفاصيل" : "Duration / Detail"}</label>
                <Input 
                  value={newReqDuration} 
                  onChange={(e) => setNewReqDuration(e.target.value)} 
                  placeholder={isRTL ? "مثال: ٣ أيام أو ساعتان" : "e.g. 3 days or 2 hours"} 
                  className="rounded-xl border-stone-200"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-500">{isRTL ? "السبب / الملاحظات" : "Reason / Note"}</label>
              <Input 
                value={newReqReason} 
                onChange={(e) => setNewReqReason(e.target.value)} 
                placeholder={isRTL ? "أدخل تفاصيل ومبررات الطلب..." : "Describe the reason"} 
                className="rounded-xl border-stone-200"
                required
              />
            </div>

            <DialogFooter className="pt-2 flex gap-2">
              <button 
                type="button" 
                onClick={() => setIsNewRequestOpen(false)} 
                className={`${btnOutline} rounded-xl h-10 px-4`}
              >
                {isRTL ? "إلغاء" : "Cancel"}
              </button>
              <button 
                type="submit" 
                className={`${btnPrimary} h-10 px-4`}
              >
                {isRTL ? "تقديم الطلب" : "Submit"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
