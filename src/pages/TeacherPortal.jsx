import React, { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
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
  LogOut,
  Video,
  Megaphone,
  Bell,
  Search,
  Trophy,
  Award
} from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/lib/AuthContext";
import TeacherSidebar from "@/components/layout/TeacherSidebar";
import VisualSchedule from "@/components/schedule/VisualSchedule";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import PageHeader from "@/components/shared/PageHeader";
import AssignmentsGradingTab from "@/components/teacher/AssignmentsGradingTab";
import ParentTeacherChat from "@/components/portal/ParentTeacherChat";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import AdminStudentProfile from "@/components/students/AdminStudentProfile";

const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all border-2 border-stone-300 bg-white text-stone-800 hover:bg-stone-50 hover:border-stone-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const btnPrimary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all bg-stone-900 text-white hover:bg-black cursor-pointer shadow-lg shadow-stone-200 disabled:opacity-50 disabled:cursor-not-allowed";

export default function TeacherPortal() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const { logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "classes";
  const view = searchParams.get("view");
  const setActiveTab = (tab) => {
    setSearchParams(prev => {
      prev.set("tab", tab);
      return prev;
    });
  };
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState(null);
  const selectedClassId = searchParams.get("classId") || "all";

  const teacherId = localStorage.getItem("portal_user_id") || "T-202";
  const portalUserStr = localStorage.getItem("portal_user");
  const portalUser = portalUserStr ? JSON.parse(portalUserStr) : null;

  const handleLogout = () => {
    localStorage.removeItem("portal_role");
    localStorage.removeItem("portal_user_id");
    localStorage.removeItem("portal_user_name");
    logout(false);
    window.location.href = "/";
  };

  const { data: classesQuery = [] } = useQuery({ 
    queryKey: ["teacher-classes", teacherId], 
    queryFn: () => entities.Subject.filter({ teacher_id: teacherId }) 
  });

  const { data: students = [], isLoading: isLoadingStudents } = useQuery({ 
    queryKey: ["teacher-students"], 
    queryFn: () => entities.Student.list() 
  });

  const { data: teacherSchedules = [] } = useQuery({
    queryKey: ["teacher-schedules", teacherId],
    queryFn: () => entities.ClassSchedule.filter({ teacher_id: teacherId })
  });

  const { data: teacherTasks = [] } = useQuery({
    queryKey: ["teacher-tasks", teacherId],
    queryFn: () => entities.TeacherTask.filter({ teacher_id: teacherId })
  });

  const classes = React.useMemo(() => {
    const map = new Map();
    
    // 1. Group schedules by subject_name + grade + section to get unique classes taught by teacher
    teacherSchedules.forEach(sched => {
      if (!sched.subject_name || !sched.grade || !sched.section) return;
      const key = `${sched.subject_name}-${sched.grade}-${sched.section}`;
      if (!map.has(key)) {
        map.set(key, {
          id: sched.id, // unique identifier for the class tab filtering
          name: sched.subject_name,
          grade: sched.grade,
          grade_level: sched.grade,
          section: sched.section
        });
      }
    });

    // 2. Fallback to subjects if no schedules are configured yet
    if (map.size === 0 && classesQuery && classesQuery.length > 0) {
      classesQuery.forEach(subj => {
        const key = `${subj.name}-${subj.grade}`;
        if (!map.has(key)) {
          map.set(key, {
            id: subj.id,
            name: subj.name,
            grade: subj.grade,
            grade_level: subj.grade,
            section: "╪ث╪ذ┘ê ╪ذ┘â╪▒" // default fallback section
          });
        }
      });
    }

    return Array.from(map.values());
  }, [teacherSchedules, classesQuery]);

  const filteredTeacherStudents = React.useMemo(() => {
    if (!students || !classes) return [];
    
    // First, filter by teacher's classes to get "All My Students"
    const myStudents = students.filter(student => {
      return classes.some(cls => {
        const studentGrade = student.grade?.toString();
        const clsGrade = cls.grade_level?.toString();
        const studentSection = (student.section || '').toLowerCase().trim();
        const clsSection = (cls.section || '').toLowerCase().trim();
        return studentGrade === clsGrade && (studentSection === clsSection || clsSection === 'a' || clsSection === 'all' || clsSection === '' || clsSection === '╪ث');
      });
    });

    // Second, if a specific class is selected, filter by that class's grade & section
    let list = myStudents;
    if (selectedClassId !== "all") {
      const selectedClass = classes.find(c => c.id === selectedClassId);
      if (selectedClass) {
        list = myStudents.filter(student => {
          const studentGrade = student.grade?.toString();
          const clsGrade = selectedClass.grade_level?.toString();
          const studentSection = (student.section || '').toLowerCase().trim();
          const clsSection = (selectedClass.section || '').toLowerCase().trim();
          return studentGrade === clsGrade && (studentSection === clsSection || clsSection === 'a' || clsSection === 'all' || clsSection === '' || clsSection === '╪ث');
        });
      }
    }

    // Third, apply search term
    if (studentSearch.trim()) {
      const query = studentSearch.toLowerCase().trim();
      list = list.filter(student => {
        return (
          (student.full_name || student.name || "").toLowerCase().includes(query) ||
          (student.student_id || "").toLowerCase().includes(query)
        );
      });
    }

    return list;
  }, [students, classes, selectedClassId, studentSearch]);

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
    if (allGrades.length === 0) return "┘ث.┘د┘ح";
    const total = allGrades.reduce((sum, g) => sum + (parseFloat(g.score || g.grade_point || 0)), 0);
    const avg = total / allGrades.length;
    // Format to Arabic numerals if RTL
    const val = avg.toFixed(2);
    if (isRTL) {
      return val.replace(/\d/g, d => "┘ب┘ة┘ت┘ث┘ج┘ح┘خ┘د┘ذ┘ر"[d]);
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
        time: isRTL ? "╪╣╪د╪ش┘" : "Urgent",
        icon: AlertCircle,
        color: "text-rose-500",
        bg: "bg-rose-50"
      });
    });

    if (alerts.length === 0) {
      return [
        { title: isRTL ? "╪║┘è╪د╪ذ ┘à╪ز┘â╪▒╪▒ - ╪╖╪د┘╪ذ ┘ج┘ب┘ح" : "Frequent Absence - Student 405", time: isRTL ? "┘ة┘ب:┘ة┘ح ╪╡" : "10:15 AM", icon: AlertCircle, color: "text-rose-500", bg: "bg-rose-50" },
        { title: isRTL ? "╪╖┘╪ذ ┘à╪▒╪د╪ش╪╣╪ر ╪»╪▒╪ش╪ر - ╪│╪د╪▒╪ر" : "Grade Review Request - Sarah", time: isRTL ? "┘ب┘ر:┘ث┘ب ╪╡" : "09:30 AM", icon: MessageCircle, color: "text-blue-500", bg: "bg-blue-50" },
        { title: isRTL ? "╪ز┘à ╪ز╪ص╪»┘è╪س ╪«╪╖╪ر ╪د┘┘à┘┘ç╪ش" : "Curriculum plan updated", time: isRTL ? "┘ب┘ذ:┘ب┘ب ╪╡" : "08:00 AM", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" }
      ];
    }
    return alerts;
  }, [activeHighPriorityAnnouncements, isRTL]);

  return (
    <div className={`min-h-screen bg-stone-50 text-stone-900 ${isRTL ? 'font-cairo' : 'font-sans'}`} dir={isRTL ? "rtl" : "ltr"}>
      <TeacherSidebar />
      <main className={`transition-all duration-300 min-h-screen pt-16 lg:pt-0 ${isRTL ? "lg:mr-64" : "lg:ml-64"}`}>
        <div className="p-6 md:p-10 lg:p-12 max-w-7xl mx-auto space-y-10 pb-24">
          {view === "schedule" ? (
            <div className="space-y-6">
              <PageHeader 
                title={isRTL ? "╪د┘╪ش╪»┘ê┘ ╪د┘╪»╪▒╪د╪│┘è ╪د┘╪ث╪│╪ذ┘ê╪╣┘è ┘┘┘à╪╣┘┘à" : "Teacher's Weekly Schedule"} 
                subtitle={isRTL ? "╪╣╪▒╪╢ ┘ê╪ز╪ز╪ذ╪╣ ╪ش╪»┘ê┘ ╪د┘╪ص╪╡╪╡ ╪د┘╪ث╪│╪ذ┘ê╪╣┘è ╪د┘╪«╪د╪╡ ╪ذ┘â" : "View and track your weekly teaching schedule"}
              >
                <button onClick={() => window.location.href = "/teacher-portal"} className={`${btnOutline} h-11 px-5 rounded-xl`}>
                  {isRTL ? "╪د┘╪╣┘ê╪»╪ر ┘┘┘ê╪ص╪ر ╪د┘╪ز╪ص┘â┘à" : "Back to Dashboard"}
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
                title={isRTL ? "╪╣┘╪ذ╪ر ╪د┘╪▒╪│╪د╪خ┘ ┘ê╪د┘╪ز┘ê╪د╪╡┘" : "Inbox & Communication"} 
                subtitle={isRTL ? "╪ز┘ê╪د╪╡┘ ┘à╪ذ╪د╪┤╪▒╪ر ┘à╪╣ ╪ث┘ê┘┘è╪د╪ة ╪د┘╪ث┘à┘ê╪▒ ┘ê╪┤╪د╪▒┘â ┘à╪╣┘ç┘à ╪د┘┘à┘╪د╪ص╪╕╪د╪ز ┘ê╪د┘┘à┘┘╪د╪ز." : "Communicate directly with parents, share updates and files."}
              >
                <button onClick={() => setActiveTab("classes")} className={`${btnOutline} h-11 px-5 rounded-xl`}>
                  {isRTL ? "╪د┘╪╣┘ê╪»╪ر ┘┘┘ê╪ص╪ر ╪د┘╪ز╪ص┘â┘à" : "Back to Dashboard"}
                </button>
              </PageHeader>
              <ParentTeacherChat me={{ ...portalUser, id: teacherId, role: "teacher", full_name: portalUser?.full_name || "╪د┘┘à╪╣┘┘à" }} />
            </div>
          ) : activeTab === "requests" ? (
            <div className="space-y-6">
              <PageHeader 
                title={isRTL ? "╪╖┘╪ذ╪د╪ز┘è ╪د┘╪┤╪«╪╡┘è╪ر" : "My Personal Requests"} 
                subtitle={isRTL ? "╪ح╪▒╪│╪د┘ ┘ê┘à╪ز╪د╪ذ╪╣╪ر ╪╖┘╪ذ╪د╪ز ╪د┘╪ح╪ش╪د╪▓╪د╪ز ┘ê╪د┘╪د╪│╪ز╪خ╪░╪د┘ ┘ê╪د┘╪│┘┘ ╪د┘╪«╪د╪╡╪ر ╪ذ┘â" : "Submit and track your leaves, permissions and loan requests"}
              >
                <button onClick={() => setActiveTab("classes")} className={`${btnOutline} h-11 px-5 rounded-xl`}>
                  {isRTL ? "╪د┘╪╣┘ê╪»╪ر ┘┘┘ê╪ص╪ر ╪د┘╪ز╪ص┘â┘à" : "Back to Dashboard"}
                </button>
              </PageHeader>
              <TeacherRequestsView isRTL={isRTL} portalUser={portalUser} teacherId={teacherId} />
            </div>
          ) : activeTab === "notifications" ? (
            <div className="space-y-6">
              <PageHeader 
                title={isRTL ? "╪د┘╪ز╪╣╪د┘à┘è┘à ┘ê╪د┘┘é╪▒╪د╪▒╪د╪ز ╪د┘╪▒╪│┘à┘è╪ر" : "Official Announcements"} 
                subtitle={isRTL ? "╪ش┘à┘è╪╣ ╪د┘┘é╪▒╪د╪▒╪د╪ز ┘ê╪د┘╪ز╪╣╪د┘à┘è┘à ╪د┘┘à┘ê╪ش┘ç╪ر ┘┘â ┘à┘ ┘é╪ذ┘ ╪د┘╪ح╪»╪د╪▒╪ر ╪د┘┘à╪»╪▒╪│┘è╪ر." : "All decisions and announcements directed to you by school administration."}
              >
                <button onClick={() => setActiveTab("classes")} className={`${btnOutline} h-11 px-5 rounded-xl`}>
                  {isRTL ? "╪د┘╪╣┘ê╪»╪ر ┘┘┘ê╪ص╪ر ╪د┘╪ز╪ص┘â┘à" : "Back to Dashboard"}
                </button>
              </PageHeader>
              
              <div className="space-y-4 max-w-4xl mx-auto pt-4">
                {teacherAnnouncements.length === 0 ? (
                  <Card className="p-16 text-center border-dashed border-2 border-stone-200 bg-stone-50/50 text-stone-400 rounded-[40px]">
                    <Megaphone size={48} className="mb-4 opacity-20 mx-auto" />
                    <p className="font-bold text-lg">{isRTL ? "┘╪د ╪ز┘ê╪ش╪» ╪ز╪╣╪د┘à┘è┘à ┘à┘╪┤┘ê╪▒╪ر ╪ص╪د┘┘è╪د┘ï" : "No official announcements published yet"}</p>
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
                                {isRTL ? "┘ç╪د┘à ╪ش╪»╪د┘ï" : "Urgent"}
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
                                {isRTL ? "╪ز╪ص╪»┘è╪» ┘â┘à┘é╪▒┘ê╪ة" : "Mark as read"}
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
          ) : (
            <>
              <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-serif font-black text-stone-900">{isRTL ? "╪ذ┘ê╪د╪ذ╪ر ╪د┘┘à╪╣┘┘à" : "Teacher Portal"}</h1>
            <Badge className="bg-amber-500/10 text-amber-600 border-none rounded-lg text-[10px] font-black px-2 py-1 uppercase tracking-widest">
              {isRTL ? "╪ث┘â╪د╪»┘è┘à┘è" : "Academic"}
            </Badge>
          </div>
          <p className="text-stone-400 font-medium">
            {isRTL 
              ? `╪ث┘ç┘╪د┘ï ╪ذ┘â ┘è╪د ╪ث╪│╪ز╪د╪░! ┘╪»┘è┘â ${
                  isRTL 
                    ? todayClassesCount.toString().replace(/\d/g, d => "┘ب┘ة┘ت┘ث┘ج┘ح┘خ┘د┘ذ┘ر"[d]) 
                    : todayClassesCount 
                } ╪ص╪╡╪╡ ╪د┘┘è┘ê┘à ┘ê ${
                  isRTL 
                    ? pendingGradingCount.toString().replace(/\d/g, d => "┘ب┘ة┘ت┘ث┘ج┘ح┘خ┘د┘ذ┘ر"[d]) 
                    : pendingGradingCount 
                } ┘ê╪د╪ش╪ذ╪د┘ï ╪ذ╪د┘╪ز╪╕╪د╪▒ ╪د┘╪ز╪╡╪ص┘è╪ص.` 
              : `Welcome back! You have ${todayClassesCount} classes today and ${pendingGradingCount} assignments to grade.`
            }
          </p>
        </div>
        
        <div className="flex gap-3">
          <button onClick={() => setShowScheduleModal(true)} className={`${btnOutline} rounded-full h-12 px-6`}>
            <Calendar size={18} />
            {isRTL ? "╪د┘╪ش╪»┘ê┘ ╪د┘╪ث╪│╪ذ┘ê╪╣┘è" : "Weekly Schedule"}
          </button>
          <button className={`${btnPrimary} rounded-full h-12 px-6 hidden sm:flex`}>
            <Plus size={18} />
            {isRTL ? "╪ح╪╢╪د┘╪ر ┘à╪ص╪ز┘ê┘ë" : "Add Content"}
          </button>
          <button onClick={handleLogout} className={`${btnOutline} rounded-full h-12 px-6 border-rose-100 text-rose-600 bg-rose-50 hover:bg-rose-100 hover:text-rose-700`}>
            <LogOut size={18} />
            <span className="hidden sm:inline">{isRTL ? "╪ز╪│╪ش┘è┘ ╪د┘╪«╪▒┘ê╪ش" : "Log out"}</span>
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
                  <h4 className="font-serif font-black tracking-tight text-base mb-0.5">{isRTL ? `┘é╪▒╪د╪▒ ╪▒╪│┘à┘è ╪╣╪د╪ش┘: ${ann.title}` : `Urgent Announcement: ${ann.title}`}</h4>
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
                { value: "classes", label: isRTL ? "┘╪╡┘ê┘┘è" : "My Classes", icon: LayoutGrid },
                { value: "students", label: isRTL ? "╪╖┘╪د╪ذ┘è" : "My Students", icon: Users },
                { value: "grading", label: isRTL ? "╪د┘╪ز╪╡╪ص┘è╪ص" : "Grading", icon: ClipboardCheck },
                { value: "grades", label: isRTL ? "╪د┘╪»╪▒╪ش╪د╪ز" : "Grades", icon: Award },
                { value: "materials", label: isRTL ? "╪د┘┘à┘ê╪د╪»" : "Materials", icon: BookOpen }
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {classes.map((cls, i) => (
                  <motion.div
                    key={cls.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Card className="p-8 border-none shadow-sm hover:shadow-2xl transition-all duration-500 rounded-[48px] bg-white group cursor-pointer overflow-hidden relative">
                      <div className={`absolute top-0 right-0 w-2 h-full ${i % 2 === 0 ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
                      
                      <div className="flex justify-between items-start mb-8">
                        <div className={`h-14 w-14 rounded-2xl ${i % 2 === 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          <BookOpen size={28} />
                        </div>
                        <Badge className="bg-stone-50 text-stone-400 border-none rounded-lg text-[8px] font-black px-2 py-0.5">
                          {cls.grade_level}
                        </Badge>
                      </div>

                      <h4 className="text-2xl font-serif font-black text-stone-900 mb-2 group-hover:text-primary transition-colors">{cls.name}</h4>
                      <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-8">
                        {isRTL 
                          ? `╪د┘╪╡┘ ${cls.grade_level} - ╪د┘┘╪╡┘ ${cls.section || '╪ث╪ذ┘ê ╪ذ┘â╪▒'}` 
                          : `Grade ${cls.grade_level} - Class ${cls.section || 'Abu Bakr'}`
                        }
                      </p>

                      <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-stone-50 p-4 rounded-3xl text-center">
                          <p className="text-[10px] font-bold text-stone-400 uppercase mb-1">{isRTL ? "╪د┘╪╖┘╪د╪ذ" : "Students"}</p>
                          <p className="text-xl font-black text-stone-900">
                            {students.filter(s => {
                              const sGrade = s.grade?.toString();
                              const cGrade = cls.grade?.toString();
                              const sSec = (s.section || '').toLowerCase().trim();
                              const cSec = (cls.section || '').toLowerCase().trim();
                              return sGrade === cGrade && (sSec === cSec || cSec === 'a' || cSec === 'all' || cSec === '' || cSec === '╪ث');
                            }).length}
                          </p>
                        </div>
                        <div className="bg-stone-50 p-4 rounded-3xl text-center">
                          <p className="text-[10px] font-bold text-stone-400 uppercase mb-1">{isRTL ? "╪د┘╪ص╪╢┘ê╪▒" : "Attendance"}</p>
                          <p className="text-xl font-black text-emerald-600"> 95┘ز</p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 w-full">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              setSearchParams(prev => {
                                prev.set("tab", "students");
                                prev.set("classId", cls.id);
                                return prev;
                              });
                            }}
                            className={`flex-1 ${btnPrimary} rounded-2xl h-12`}
                          >
                            {isRTL ? "╪ح╪»╪د╪▒╪ر ╪د┘┘╪╡┘" : "Manage Class"}
                          </button>
                          <button 
                            onClick={() => {
                              setSearchParams(prev => {
                                prev.set("tab", "students");
                                prev.set("classId", cls.id);
                                return prev;
                              });
                            }}
                            className={`${btnOutline} h-12 w-12 rounded-2xl`}
                          >
                            <ChevronRight size={20} className={isRTL ? "rotate-180" : ""} />
                          </button>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/virtual-classroom/${cls.id}`;
                          }}
                          className="w-full inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-xs font-black transition-all bg-teal-650 text-teal-600 border border-teal-200 hover:bg-teal-50 h-11"
                        >
                          <Video size={14} />
                          {isRTL ? "╪ذ╪»╪ة ╪ص╪╡╪ر ╪د┘╪ز╪▒╪د╪╢┘è╪ر ┘à╪ذ╪د╪┤╪▒" : "Start Live Virtual Class"}
                        </button>
                      </div>
                    </Card>
                  </motion.div>
                ))}
                
                {/* Add New Class Shortcut */}
                <Card className="p-8 border-dashed border-2 border-stone-100 bg-stone-50/30 flex flex-col items-center justify-center text-center rounded-[48px] hover:border-primary/30 transition-all group cursor-pointer">
                  <div className="h-14 w-14 rounded-full bg-white flex items-center justify-center text-stone-300 group-hover:bg-primary group-hover:text-white transition-all mb-4 shadow-sm">
                    <Plus size={28} />
                  </div>
                  <h4 className="font-bold text-stone-400 group-hover:text-primary transition-colors">{isRTL ? "╪ح╪╢╪د┘╪ر ┘╪╡┘ ╪ش╪»┘è╪»" : "Add New Class"}</h4>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="grading" className="m-0 space-y-6">
              <AssignmentsGradingTab isRTL={isRTL} subjects={classes} />
            </TabsContent>

            <TabsContent value="students" className="m-0 space-y-6">
              <Card className="p-6 md:p-8 bg-white border-none shadow-sm rounded-[48px] space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="text-2xl font-serif font-black text-stone-900">
                      {isRTL ? "╪ح╪»╪د╪▒╪ر ╪╖┘╪د╪ذ ╪د┘┘╪╡┘" : "Class Students Management"}
                    </h3>
                    <p className="text-stone-400 text-xs mt-1">
                      {isRTL ? "╪╣╪▒╪╢ ┘é╪د╪خ┘à╪ر ╪╖┘╪د╪ذ ┘╪╡┘ê┘┘â ╪د┘╪»╪▒╪د╪│┘è╪ر ┘ê┘à╪ز╪د╪ذ╪╣╪ر ╪ص╪╢┘ê╪▒┘ç┘à ┘ê╪ذ┘è╪د┘╪د╪ز┘ç┘à." : "View your class student list and track their attendance and details."}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    <div className="flex flex-col gap-1.5 min-w-[200px]">
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
                        <option value="all">{isRTL ? "╪ش┘à┘è╪╣ ╪╖┘╪د╪ذ┘è" : "All My Students"}</option>
                        {classes.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} - {isRTL ? "╪د┘┘╪╡┘" : "Class"} {c.section || '╪ث╪ذ┘ê ╪ذ┘â╪▒'} ({c.grade_level})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Search box */}
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-stone-400`} size={16} />
                    <Input 
                      placeholder={isRTL ? "╪د┘╪ذ╪ص╪س ╪ذ╪د╪│┘à ╪د┘╪╖╪د┘╪ذ ╪ث┘ê ╪د┘╪▒┘é┘à ╪د┘╪ز╪╣╪▒┘è┘┘è..." : "Search by student name or ID..."}
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className={`${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} bg-stone-50/50 border-stone-200 rounded-xl h-11 text-xs`}
                      dir={isRTL ? "rtl" : "ltr"}
                    />
                  </div>
                </div>

                {isLoadingStudents ? (
                  <div className="w-full py-16 text-center text-stone-500">
                    <div className="flex items-center justify-center gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900"></div>
                      <span>{isRTL ? "╪ش╪د╪▒┘è ╪ز╪ص┘à┘è┘ ╪ذ┘è╪د┘╪د╪ز ╪د┘╪╖┘╪د╪ذ..." : "Loading students..."}</span>
                    </div>
                  </div>
                ) : filteredTeacherStudents.length === 0 ? (
                  <div className="py-12 text-center text-stone-400 border border-dashed border-stone-100 rounded-3xl">
                    <Users size={40} className="opacity-20 mx-auto mb-2" />
                    <p className="font-bold text-base">{isRTL ? "┘╪د ┘è┘ê╪ش╪» ╪╖┘╪د╪ذ ┘à╪│╪ش┘┘è┘ ┘┘è ┘ç╪░╪د ╪د┘┘╪╡┘" : "No students found in this class"}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-3xl border border-stone-100">
                    <Table>
                      <TableHeader className="bg-stone-50/50">
                        <TableRow>
                          <TableHead className="w-[60px] text-center">#</TableHead>
                          <TableHead>{isRTL ? "╪د┘╪╖╪د┘╪ذ" : "Student"}</TableHead>
                          <TableHead>{isRTL ? "╪د┘╪▒┘é┘à ╪د┘┘à╪»╪▒╪│┘è" : "Student ID"}</TableHead>
                          <TableHead>{isRTL ? "╪د┘╪╡┘ ┘ê╪د┘┘╪╡┘" : "Grade & Section"}</TableHead>
                          <TableHead>{isRTL ? "╪د┘╪ز┘ê╪د╪╡┘" : "Contact"}</TableHead>
                          <TableHead>{isRTL ? "╪د┘╪ص╪د┘╪ر" : "Status"}</TableHead>
                          <TableHead className="text-center">{isRTL ? "╪د┘╪ح╪ش╪▒╪د╪ة╪د╪ز" : "Actions"}</TableHead>
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
                            <TableCell className="font-mono text-stone-550 text-xs">#{student.student_id}</TableCell>
                            <TableCell className="text-xs font-semibold text-stone-600">
                              {isRTL ? "╪د┘╪╡┘" : "Grade"} {student.grade} - {student.section || "╪ث╪ذ┘ê ╪ذ┘â╪▒"}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-0.5 text-[10px] text-stone-400 font-medium">
                                <p className="num-en">{student.user_email || "-"}</p>
                                <p className="num-en">{student.parent_phone || "-"}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={`${student.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-stone-100 text-stone-400'} border-none text-[10px] rounded-lg font-bold`}>
                                {isRTL ? (student.status === 'active' ? '┘╪┤╪╖' : '╪║┘è╪▒ ┘╪┤╪╖') : (student.status === 'active' ? 'Active' : 'Inactive')}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <button
                                onClick={() => setSelectedStudentForProfile(student)}
                                className={`${btnOutline} h-8 px-3 text-[10px] rounded-xl`}
                              >
                                {isRTL ? "╪╣╪▒╪╢ ╪د┘┘à┘┘" : "View Profile"}
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
          </Tabs>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: isRTL ? "┘à╪ز┘ê╪│╪╖ ╪د┘┘à╪╣╪»┘" : "Average GPA", value: averageGPA, icon: Star, color: "text-amber-500", bg: "bg-amber-50" },
              { 
                label: isRTL ? "╪د┘┘ê╪د╪ش╪ذ╪د╪ز ╪د┘┘à┘â╪ز┘à┘╪ر" : "Assignments Done", 
                value: isRTL 
                  ? totalCompletedAssignmentsCount.toString().replace(/\d/g, d => "┘ب┘ة┘ت┘ث┘ج┘ح┘خ┘د┘ذ┘ر"[d]) 
                  : totalCompletedAssignmentsCount.toString(), 
                icon: FileText, 
                color: "text-blue-500", 
                bg: "bg-blue-50" 
              },
              { 
                label: isRTL ? "╪│╪د╪╣╪د╪ز ╪د┘╪ز╪»╪▒┘è╪│" : "Teaching Hours", 
                value: isRTL 
                  ? (teacherSchedules.length * 2).toString().replace(/\d/g, d => "┘ب┘ة┘ت┘ث┘ج┘ح┘خ┘د┘ذ┘ر"[d]) 
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
                <h4 className="font-bold">{isRTL ? "┘â╪د╪▒╪ز ╪ث╪»╪د╪ة ╪د┘╪╖┘╪د╪ذ" : "Student Performance"}</h4>
                <TrendingUp size={20} className="text-emerald-400" />
              </div>
              
              <div className="space-y-6">
                {[
                  { label: isRTL ? "┘┘ê┘é ╪د┘┘à╪ز┘ê╪│╪╖" : "Above Average", value: performanceStats.aboveAverage, color: "bg-emerald-500" },
                  { label: isRTL ? "┘à╪ز┘ê╪│╪╖" : "Average", value: performanceStats.average, color: "bg-amber-500" },
                  { label: isRTL ? "┘è╪ص╪ز╪د╪ش ╪ز╪ص╪│┘è┘" : "Needs Review", value: performanceStats.needsReview, color: "bg-rose-500" },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-2 text-[10px] font-bold uppercase tracking-widest opacity-60">
                      <span>{item.label}</span>
                      <span>
                        {isRTL 
                          ? `${item.value.toString().replace(/\d/g, d => "┘ب┘ة┘ت┘ث┘ج┘ح┘خ┘د┘ذ┘ر"[d])}┘ز` 
                          : `${item.value}%`
                        }
                      </span>
                    </div>
                    <Progress value={item.value} className={`h-1.5 bg-white/10 ${item.color}`} />
                  </div>
                ))}
              </div>
              
              <button className="w-full mt-10 bg-white/10 hover:bg-white/20 text-white rounded-2xl h-12 font-bold border border-white/10 transition-all cursor-pointer">
                {isRTL ? "╪╣╪▒╪╢ ╪د┘╪ز┘é╪▒┘è╪▒ ╪د┘╪│┘┘ê┘è" : "View Annual Report"}
              </button>
            </div>
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-primary/20 rounded-full blur-[100px]" />
          </Card>

          <Card className="p-8 border-none shadow-sm bg-white rounded-[48px]">
            <div className="flex items-center justify-between mb-8">
              <h4 className="font-bold text-stone-900">{isRTL ? "╪د┘╪ز┘╪ذ┘è┘ç╪د╪ز ╪د┘╪╣╪د╪ش┘╪ر" : "Urgent Alerts"}</h4>
              <Badge className="bg-rose-500 text-white border-none rounded-full h-5 w-5 flex items-center justify-center p-0 text-[10px] font-black">
                {isRTL 
                  ? urgentAlertsList.length.toString().replace(/\d/g, d => "┘ب┘ة┘ت┘ث┘ج┘ح┘خ┘د┘ذ┘ر"[d]) 
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
              {isRTL ? "╪╣╪▒╪╢ ╪ش┘à┘è╪╣ ╪د┘╪ز┘╪ذ┘è┘ç╪د╪ز" : "View All Alerts"}
            </button>
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
              {isRTL ? "╪د┘╪ش╪»┘ê┘ ╪د┘╪»╪▒╪د╪│┘è ╪د┘╪ث╪│╪ذ┘ê╪╣┘è ┘┘┘à╪╣┘┘à" : "Teacher's Weekly Schedule"}
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

    </div>
  );
}

function AttendanceTabContent({ isRTL, classes, students, portalUser }) {
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || "all");
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState({}); // student_id -> status
  const [isSaving, setIsSaving] = useState(false);

  const selectedClass = classes.find(c => c.id === selectedClassId);

  const classStudents = React.useMemo(() => {
    if (!selectedClass) return [];
    return students.filter(student => {
      const studentGrade = student.grade?.toString();
      const clsGrade = selectedClass.grade?.toString();
      const studentSection = (student.section || '').toLowerCase().trim();
      const clsSection = (selectedClass.section || '').toLowerCase().trim();
      return studentGrade === clsGrade && (studentSection === clsSection || clsSection === 'a' || clsSection === 'all' || clsSection === '' || clsSection === '╪ث');
    });
  }, [students, selectedClass]);

  const handleStatusChange = (studentId, status) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSaveAttendance = async () => {
    if (classStudents.length === 0) {
      toast.error(isRTL ? "┘╪د ┘è┘ê╪ش╪» ╪╖┘╪د╪ذ ┘┘è ┘ç╪░╪د ╪د┘┘╪╡┘ ┘╪ز╪│╪ش┘è┘ ╪ص╪╢┘ê╪▒┘ç┘à." : "No students in this class to record attendance.");
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
          recorded_by: portalUser?.full_name || "┘à╪╣┘┘à ╪د┘╪╡┘",
          notes: isRTL ? `╪ز┘à ╪▒╪╡╪» ╪د┘╪ص╪╢┘ê╪▒ ┘è╪»┘ê┘è╪د┘ï ┘┘┘à╪د╪»╪ر: ${selectedClass.name}` : `Manual attendance recorded for subject: ${selectedClass.name}`
        });
      }

      toast.success(isRTL ? "╪ز┘à ╪ص┘╪╕ ╪│╪ش┘ ╪ص╪╢┘ê╪▒ ╪د┘╪╖┘╪د╪ذ ╪ذ┘╪ش╪د╪ص!" : "Student attendance saved successfully!");
    } catch (err) {
      console.error(err);
      toast.error(isRTL ? "┘╪┤┘ ╪ص┘╪╕ ┘â╪┤┘ ╪د┘╪ص╪╢┘ê╪▒." : "Failed to save attendance.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title={isRTL ? "╪▒╪╡╪» ╪ص╪╢┘ê╪▒ ┘ê╪║┘è╪د╪ذ ╪د┘╪╖┘╪د╪ذ" : "Student Attendance Tracking"} 
        subtitle={isRTL ? "┘é┘à ╪ذ╪د╪«╪ز┘è╪د╪▒ ╪د┘┘à╪د╪»╪ر ┘ê╪د┘╪╡┘ ┘╪ز╪│╪ش┘è┘ ╪ص╪╢┘ê╪▒ ┘ê╪║┘è╪د╪ذ ╪د┘╪╖┘╪د╪ذ ┘┘┘è┘ê┘à." : "Select subject and class to log student attendance status for today."}
      >
        <button onClick={() => window.location.href = "/teacher-portal"} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all border-2 border-stone-300 bg-white text-stone-800 hover:bg-stone-50 hover:border-stone-400 cursor-pointer h-11 px-5">
          {isRTL ? "╪د┘╪╣┘ê╪»╪ر ┘┘┘ê╪ص╪ر ╪د┘╪ز╪ص┘â┘à" : "Back to Dashboard"}
        </button>
      </PageHeader>

      <Card className="p-6 md:p-8 bg-white border-none shadow-sm rounded-[40px] space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-end justify-between border-b border-stone-50 pb-6">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="flex flex-col gap-1.5 flex-1 max-w-xs">
              <label htmlFor="field-teacherportal-select-8" className="text-xs font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "╪د┘┘╪╡┘ ╪د┘╪»╪▒╪د╪│┘è" : "Class Section"}</label>
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
                    {c.name} - {isRTL ? "╪د┘┘╪╡┘" : "Class"} {c.section || '╪ث╪ذ┘ê ╪ذ┘â╪▒'} ({c.grade_level})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5 max-w-xs">
              <label htmlFor="field-teacherportal-input-7" className="text-xs font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "╪د┘╪ز╪د╪▒┘è╪«" : "Date"}</label>
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
            {isSaving ? (isRTL ? "╪ش╪د╪▒┘è ╪د┘╪ص┘╪╕..." : "Saving...") : (isRTL ? "╪ص┘╪╕ ┘â╪┤┘ ╪د┘╪ص╪╢┘ê╪▒" : "Save Attendance")}
          </button>
        </div>

        {classStudents.length === 0 ? (
          <div className="py-12 text-center text-stone-400 border border-dashed border-stone-100 rounded-3xl">
            <Users size={40} className="opacity-20 mx-auto mb-2" />
            <p className="font-bold text-base">{isRTL ? "┘╪د ┘è┘ê╪ش╪» ╪╖┘╪د╪ذ ┘à╪│╪ش┘┘è┘ ┘┘è ┘ç╪░╪د ╪د┘┘╪╡┘" : "No students found in this class"}</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-stone-100">
            <Table>
              <TableHeader className="bg-stone-50/50">
                <TableRow>
                  <TableHead className="w-[60px] text-center">#</TableHead>
                  <TableHead>{isRTL ? "╪د┘╪╖╪د┘╪ذ" : "Student"}</TableHead>
                  <TableHead>{isRTL ? "╪د┘╪▒┘é┘à ╪د┘┘à╪»╪▒╪│┘è" : "Student ID"}</TableHead>
                  <TableHead>{isRTL ? "╪د┘╪╡┘ ┘ê╪د┘┘╪╡┘" : "Grade & Section"}</TableHead>
                  <TableHead className="text-center w-[350px]">{isRTL ? "╪ص╪د┘╪ر ╪د┘╪ص╪╢┘ê╪▒" : "Attendance Status"}</TableHead>
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
                        {isRTL ? "╪د┘╪╡┘" : "Grade"} {student.grade} - {student.section || "╪ث╪ذ┘ê ╪ذ┘â╪▒"}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="inline-flex p-1 bg-stone-100 rounded-xl gap-1">
                          {[
                            { value: "present", label: isRTL ? "╪ص╪د╪╢╪▒" : "Present", activeClass: "bg-emerald-500 text-white shadow-sm" },
                            { value: "absent", label: isRTL ? "╪║╪د╪خ╪ذ" : "Absent", activeClass: "bg-rose-500 text-white shadow-sm" },
                            { value: "late", label: isRTL ? "┘à╪ز╪ث╪«╪▒" : "Late", activeClass: "bg-amber-500 text-stone-900 shadow-sm" }
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
        return studentGrade === clsGrade && (studentSection === clsSection || clsSection === 'a' || clsSection === 'all' || clsSection === '' || clsSection === '╪ث');
      });
    });
  }, [students, classes]);

  const badgeTemplates = [
    { title: isRTL ? "╪ش╪د╪خ╪▓╪ر ╪د┘╪ز┘à┘è╪▓ ╪د┘╪╣┘┘à┘è" : "Academic Excellence", points: 150, desc: isRTL ? "┘┘╪ص╪╡┘ê┘ ╪╣┘┘ë ╪د┘╪»╪▒╪ش╪ر ╪د┘┘â╪د┘à┘╪ر ┘ê╪د┘╪ز┘à┘è╪▓ ╪د┘╪ث┘â╪د╪»┘è┘à┘è ╪د┘┘à╪│╪ز┘à╪▒" : "For achieving full scores and continuous academic excellence" },
    { title: isRTL ? "┘┘é╪ذ ╪د┘╪╖╪د┘╪ذ ╪د┘┘à╪س╪د┘┘è" : "Ideal Student", points: 200, desc: isRTL ? "┘┘╪د┘╪ز╪▓╪د┘à ╪د┘╪ز╪د┘à ╪ذ╪د┘╪│┘┘ê┘â ╪د┘╪ص╪│┘ ┘ê╪د┘┘à╪ذ╪د╪»╪خ ╪د┘┘é┘è╪د╪»┘è╪ر ┘┘è ╪د┘┘à╪»╪▒╪│╪ر" : "For outstanding moral character and leadership skills at school" },
    { title: isRTL ? "╪د┘┘à╪ذ╪»╪╣ ╪د┘┘à╪ز┘à┘è╪▓" : "Creative Innovator", points: 100, desc: isRTL ? "┘╪ز┘é╪»┘è┘à ╪ث┘┘â╪د╪▒ ┘ê┘à╪┤╪د╪▒┘è╪╣ ╪ح╪ذ╪»╪د╪╣┘è╪ر ┘à╪ز┘à┘è╪▓╪ر ┘┘è ╪د┘┘à╪د╪»╪ر" : "For contributing outstanding creative ideas and projects" },
    { title: isRTL ? "╪╖╪د┘╪ذ ╪د┘╪ث╪│╪ذ┘ê╪╣" : "Student of the Week", points: 50, desc: isRTL ? "┘┘┘à╪┤╪د╪▒┘â╪ر ╪د┘┘╪╣╪د┘╪ر ┘ê╪د┘╪د╪ش╪ز┘ç╪د╪» ╪د┘┘à┘à┘è╪▓ ╪╖┘ê╪د┘ ╪د┘╪ث╪│╪ذ┘ê╪╣" : "For active participation and great diligence throughout the week" }
  ];

  const handleTemplateSelect = (tmpl) => {
    setBadgeTitle(tmpl.title);
    setPoints(tmpl.points);
    setDescription(tmpl.desc);
  };

  const handleAwardBadge = async () => {
    if (!selectedStudentId) {
      toast.error(isRTL ? "┘è╪▒╪ش┘ë ╪د╪«╪ز┘è╪د╪▒ ╪د┘╪╖╪د┘╪ذ ╪ث┘ê┘╪د┘ï." : "Please select a student first.");
      return;
    }
    const finalTitle = badgeTitle === "custom" ? customTitle : badgeTitle;
    if (!finalTitle.trim()) {
      toast.error(isRTL ? "┘è╪▒╪ش┘ë ╪ز╪ص╪»┘è╪» ╪ث┘ê ┘â╪ز╪د╪ذ╪ر ╪╣┘┘ê╪د┘ ╪د┘┘ê╪│╪د┘à." : "Please select or enter a badge title.");
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
        awarded_by: portalUser?.full_name || "┘à╪╣┘┘à ╪د┘┘à╪د╪»╪ر",
        date: new Date().toISOString().split('T')[0]
      });

      toast.success(isRTL ? `╪ز┘à ┘à┘╪ص ┘ê╪│╪د┘à (${finalTitle}) ┘┘╪╖╪د┘╪ذ (${studentObj.full_name}) ╪ذ┘╪ش╪د╪ص!` : `Badge (${finalTitle}) awarded to student (${studentObj.full_name}) successfully!`);
      
      // Clear form
      setSelectedStudentId("");
      setBadgeTitle("");
      setCustomTitle("");
      setDescription("");
      setPoints(50);
    } catch (err) {
      console.error(err);
      toast.error(isRTL ? "┘╪┤┘ ┘à┘╪ص ╪د┘┘ê╪│╪د┘à ┘┘╪╖╪د┘╪ذ." : "Failed to award badge.");
    } finally {
      setIsAwarding(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title={isRTL ? "┘┘ê╪ص╪ر ╪د┘╪ث┘ê╪│┘à╪ر ┘ê╪ز┘â╪▒┘è┘à ╪د┘╪╖┘╪د╪ذ" : "Student Honors & Badges Dashboard"} 
        subtitle={isRTL ? "╪ز┘╪╢┘ ╪ذ┘à┘╪ص ╪د┘╪ث┘ê╪│┘à╪ر ┘ê╪د┘┘┘é╪د╪╖ ┘┘╪╖┘╪د╪ذ ╪د┘┘à╪ز┘à┘è╪▓┘è┘ ┘╪ز╪ص┘┘è╪▓┘ç┘à ╪╣┘┘ë ╪د┘╪ح╪ذ╪»╪د╪╣." : "Award badges and points to exceptional students to motivate innovation."}
      >
        <button onClick={() => window.location.href = "/teacher-portal"} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all border-2 border-stone-300 bg-white text-stone-800 hover:bg-stone-50 hover:border-stone-400 cursor-pointer h-11 px-5">
          {isRTL ? "╪د┘╪╣┘ê╪»╪ر ┘┘┘ê╪ص╪ر ╪د┘╪ز╪ص┘â┘à" : "Back to Dashboard"}
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Award Form */}
        <div className="lg:col-span-7">
          <Card className="p-6 md:p-8 bg-white border-none shadow-sm rounded-[40px] space-y-6">
            <h4 className="font-serif font-black text-xl text-stone-900 border-b border-stone-50 pb-4">
              {isRTL ? "╪د╪│╪ز┘à╪د╪▒╪ر ┘à┘╪ص ┘ê╪│╪د┘à ╪ش╪»┘è╪»" : "New Badge Award Form"}
            </h4>

            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="field-teacherportal-select-6" className="text-xs font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "╪د╪«╪ز╪▒ ╪د┘╪╖╪د┘╪ذ" : "Select Student"}</label>
                <select id="field-teacherportal-select-6" name="select_6" aria-label="select 6" 
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="bg-stone-50 border border-stone-200 rounded-xl h-11 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
                  dir={isRTL ? "rtl" : "ltr"}
                >
                  <option value="">{isRTL ? "-- ╪د╪«╪ز╪▒ ╪د┘╪╖╪د┘╪ذ ╪د┘┘à┘â╪▒┘à --" : "-- Choose student to honor --"}</option>
                  {allMyStudents.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.full_name || s.name} (#{s.student_id}) - {isRTL ? "╪د┘╪╡┘" : "Grade"} {s.grade} - {s.section || "A"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="field-teacherportal-select-5" className="text-xs font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "╪د╪«╪ز╪▒ ╪د┘┘ê╪│╪د┘à" : "Choose Badge"}</label>
                <select id="field-teacherportal-select-5" name="select_5" aria-label="select 5" 
                  value={badgeTitle}
                  onChange={(e) => setBadgeTitle(e.target.value)}
                  className="bg-stone-50 border border-stone-200 rounded-xl h-11 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
                  dir={isRTL ? "rtl" : "ltr"}
                >
                  <option value="">{isRTL ? "-- ╪د╪«╪ز╪▒ ┘ê╪│╪د┘à╪د┘ï ╪ث┘ê ╪ص╪»╪» ┘ê╪│╪د┘à╪د┘ï ┘à╪«╪╡╪╡╪د┘ï --" : "-- Select badge template or create custom --"}</option>
                  {badgeTemplates.map((t, idx) => (
                    <option key={idx} value={t.title}>{t.title} (+{t.points} XP)</option>
                  ))}
                  <option value="custom">{isRTL ? "ظ£ي╕ ┘ê╪│╪د┘à ┘à╪«╪╡╪╡ ╪ش╪»┘è╪»..." : "ظ£ي╕ Custom Badge..."}</option>
                </select>
              </div>

              {badgeTitle === "custom" && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "╪╣┘┘ê╪د┘ ╪د┘┘ê╪│╪د┘à ╪د┘┘à╪«╪╡╪╡" : "Custom Badge Title"}</label>
                  <Input 
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="h-11 rounded-xl border-stone-200 font-semibold focus-visible:ring-primary/20 bg-stone-50"
                    placeholder={isRTL ? "┘à╪س╪د┘: ╪ذ╪╖┘ ╪د┘┘┘è╪▓┘è╪د╪ة ╪د┘┘à╪ز┘┘ê┘é..." : "e.g., Physics Superstar..."}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "╪د┘┘┘é╪د╪╖ ╪د┘┘à┘à┘┘ê╪ص╪ر (XP)" : "XP Points Offered"}</label>
                  <Input 
                    type="number"
                    value={points}
                    onChange={(e) => setPoints(e.target.value)}
                    className="h-11 rounded-xl border-stone-200 font-semibold focus-visible:ring-primary/20 bg-stone-50 num-en"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="field-teacherportal-textarea-4" className="text-xs font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "╪د┘┘ê╪╡┘ ┘ê╪ث╪│╪ذ╪د╪ذ ┘à┘╪ص ╪د┘┘ê╪│╪د┘à" : "Honors Description & Motivation"}</label>
                <textarea id="field-teacherportal-textarea-4" name="textarea_4" aria-label="textarea 4" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="p-3 rounded-xl border border-stone-200 font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 bg-stone-50 text-xs leading-relaxed"
                  placeholder={isRTL ? "╪د┘â╪ز╪ذ ╪ث╪│╪ذ╪د╪ذ ┘à┘╪ص ╪د┘┘ê╪│╪د┘à ┘┘ç╪░╪د ╪د┘╪╖╪د┘╪ذ ╪ذ┘ê╪╢┘ê╪ص..." : "Describe student accomplishments that earned this honor..."}
                />
              </div>

              <button 
                onClick={handleAwardBadge}
                disabled={isAwarding}
                className="w-full inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all bg-stone-900 text-white hover:bg-black cursor-pointer shadow-lg shadow-stone-200 h-12 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trophy size={16} className="text-yellow-400" />
                <span>{isAwarding ? (isRTL ? "╪ش╪د╪▒┘è ┘à┘╪ص ╪د┘╪ز┘â╪▒┘è┘à..." : "Awarding...") : (isRTL ? "┘à┘╪ص ┘ê╪│╪د┘à ╪د┘╪ز┘é╪»┘è╪▒" : "Award Honor Badge")}</span>
              </button>
            </div>
          </Card>
        </div>

        {/* Templates Quick Select */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-6 md:p-8 bg-white border-none shadow-sm rounded-[40px] space-y-6">
            <h4 className="font-serif font-black text-lg text-stone-900 border-b border-stone-50 pb-4">
              {isRTL ? "┘é┘ê╪د┘╪ذ ╪ث┘ê╪│┘à╪ر ╪│╪▒┘è╪╣╪ر" : "Quick Badge Templates"}
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
      return studentGrade === clsGrade && (studentSection === clsSection || clsSection === 'a' || clsSection === 'all' || clsSection === '' || clsSection === '╪ث');
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
      toast.error(isRTL ? "┘è╪▒╪ش┘ë ╪ح╪»╪«╪د┘ ╪د╪│┘à ╪د┘╪د╪«╪ز╪ذ╪د╪▒ ╪ث┘ê ╪د┘╪د┘à╪ز╪ص╪د┘." : "Please enter assessment name.");
      return;
    }
    if (classStudents.length === 0) {
      toast.error(isRTL ? "┘╪د ┘è┘ê╪ش╪» ╪╖┘╪د╪ذ ┘┘è ┘ç╪░╪د ╪د┘┘╪╡┘ ┘╪▒╪╡╪» ╪»╪▒╪ش╪د╪ز┘ç┘à." : "No students in this class to grade.");
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
          teacher_name: portalUser?.full_name || "┘à╪╣┘┘à ╪د┘┘à╪د╪»╪ر",
          notes: notes[student.id] || ""
        });
      }
      toast.success(isRTL ? "╪ز┘à ╪ص┘╪╕ ┘ê╪▒╪╡╪» ╪»╪▒╪ش╪د╪ز ╪د┘╪╖┘╪د╪ذ ╪ذ┘╪ش╪د╪ص!" : "Grades saved successfully!");
      setGrades({});
      setNotes({});
      setAssessmentName("");
    } catch (err) {
      console.error(err);
      toast.error(isRTL ? "┘╪┤┘ ╪ص┘╪╕ ╪»╪▒╪ش╪د╪ز ╪د┘╪╖┘╪د╪ذ." : "Failed to save grades.");
    } finally {
      setIsSaving(false);
    }
  };

  const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all border-2 border-stone-300 bg-white text-stone-800 hover:bg-stone-50 hover:border-stone-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
  const btnPrimary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all bg-stone-900 text-white hover:bg-black cursor-pointer shadow-lg shadow-stone-200 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="space-y-6">
      <PageHeader 
        title={isRTL ? "╪▒╪╡╪» ╪د┘╪»╪▒╪ش╪د╪ز ┘ê╪د┘┘╪ز╪د╪خ╪ش" : "Student Grades & Results"} 
        subtitle={isRTL ? "┘é┘à ╪ذ╪ح╪»╪«╪د┘ ╪»╪▒╪ش╪د╪ز ╪د┘╪د╪«╪ز╪ذ╪د╪▒╪د╪ز ┘ê╪د┘╪د┘à╪ز╪ص╪د┘╪د╪ز ╪د┘╪»┘ê╪▒┘è╪ر ┘╪╖┘╪د╪ذ┘â." : "Enter grades for quizzes, midterms, and finals."}
      >
        <button onClick={() => window.location.href = "/teacher-portal"} className={`${btnOutline} h-11 px-5 rounded-xl`}>
          {isRTL ? "╪د┘╪╣┘ê╪»╪ر ┘┘┘ê╪ص╪ر ╪د┘╪ز╪ص┘â┘à" : "Back to Dashboard"}
        </button>
      </PageHeader>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-white border-none shadow-sm rounded-3xl flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "┘à╪ز┘ê╪│╪╖ ╪»╪▒╪ش╪د╪ز ╪د┘┘╪╡┘" : "Class Average"}</p>
            <h4 className="text-3xl font-black text-teal-600 mt-2 num-en">{avg}/{maxScore}</h4>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
        </Card>

        <Card className="p-6 bg-white border-none shadow-sm rounded-3xl flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "┘╪│╪ذ╪ر ╪د┘┘╪ش╪د╪ص ╪د┘┘à┘é╪»╪▒╪ر" : "Pass Rate"}</p>
            <h4 className="text-3xl font-black text-emerald-600 mt-2 num-en">{passRate}%</h4>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
        </Card>

        <Card className="p-6 bg-white border-none shadow-sm rounded-3xl flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "╪ث╪╣┘┘ë ╪»╪▒╪ش╪ر ┘à╪▒╪╡┘ê╪»╪ر" : "Highest Score"}</p>
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
            <label htmlFor="field-teacherportal-select-3" className="text-xs font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "╪د╪«╪ز╪▒ ╪د┘┘╪╡┘" : "Class Section"}</label>
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
                  {c.name} - {isRTL ? "╪د┘┘╪╡┘" : "Class"} {c.section || '╪ث╪ذ┘ê ╪ذ┘â╪▒'} ({c.grade_level})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="field-teacherportal-select-2" className="text-xs font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "╪د┘┘╪ز╪▒╪ر / ╪د┘┘╪╡┘ ╪د┘╪»╪▒╪د╪│┘è" : "Term"}</label>
            <select id="field-teacherportal-select-2" name="select_2" aria-label="select 2" 
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-xl h-11 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
              dir={isRTL ? "rtl" : "ltr"}
            >
              <option value="Term 1">{isRTL ? "╪د┘┘╪╡┘ ╪د┘╪»╪▒╪د╪│┘è ╪د┘╪ث┘ê┘" : "Term 1"}</option>
              <option value="Term 2">{isRTL ? "╪د┘┘╪╡┘ ╪د┘╪»╪▒╪د╪│┘è ╪د┘╪س╪د┘┘è" : "Term 2"}</option>
              <option value="Term 3">{isRTL ? "╪د┘┘╪╡┘ ╪د┘╪»╪▒╪د╪│┘è ╪د┘╪س╪د┘╪س" : "Term 3"}</option>
              <option value="Final">{isRTL ? "╪د┘╪د┘à╪ز╪ص╪د┘ ╪د┘┘┘ç╪د╪خ┘è" : "Final"}</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5 md:col-span-1">
            <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "╪د╪│┘à ╪د┘╪د╪«╪ز╪ذ╪د╪▒ / ╪د┘╪ز┘é┘è┘è┘à" : "Assessment / Test Title"}</label>
            <Input 
              value={assessmentName}
              onChange={(e) => setAssessmentName(e.target.value)}
              placeholder={isRTL ? "┘à╪س╪د┘: ╪د╪«╪ز╪ذ╪د╪▒ ┘é╪╡┘è╪▒ 1╪î ╪د┘à╪ز╪ص╪د┘ ┘╪╡┘┘è" : "e.g., Quiz 1, Midterm"}
              className="h-11 rounded-xl border-stone-200 font-semibold bg-stone-50 text-xs"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "╪د┘╪»╪▒╪ش╪ر ╪د┘╪╣╪╕┘à┘ë" : "Max Score"}</label>
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
            <p className="font-bold text-base">{isRTL ? "┘╪د ┘è┘ê╪ش╪» ╪╖┘╪د╪ذ ┘à╪│╪ش┘┘è┘ ┘┘è ┘ç╪░╪د ╪د┘┘╪╡┘" : "No students found in this class"}</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="overflow-x-auto rounded-3xl border border-stone-100">
              <Table>
                <TableHeader className="bg-stone-50/50">
                  <TableRow>
                    <TableHead className="w-[60px] text-center">#</TableHead>
                    <TableHead>{isRTL ? "╪د┘╪╖╪د┘╪ذ" : "Student"}</TableHead>
                    <TableHead>{isRTL ? "╪د┘╪▒┘é┘à ╪د┘┘à╪»╪▒╪│┘è" : "Student ID"}</TableHead>
                    <TableHead className="w-[150px]">{isRTL ? "╪د┘╪»╪▒╪ش╪ر ╪د┘┘à╪▒╪╡┘ê╪»╪ر" : "Score"}</TableHead>
                    <TableHead>{isRTL ? "┘à┘╪د╪ص╪╕╪د╪ز ╪د┘┘à╪╣┘┘à / ╪د┘╪ز╪║╪░┘è╪ر ╪د┘╪▒╪د╪ش╪╣╪ر" : "Notes / Feedback"}</TableHead>
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
                          placeholder={isRTL ? "┘à┘╪د╪ص╪╕╪د╪ز ╪ص┘ê┘ ╪ث╪»╪د╪ة ╪د┘╪╖╪د┘╪ذ..." : "Student performance feedback..."}
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
                {isSaving ? (isRTL ? "╪ش╪د╪▒┘è ╪د┘╪ص┘╪╕ ┘ê╪د┘╪▒┘╪╣..." : "Saving & Posting...") : (isRTL ? "╪ز╪ث┘â┘è╪» ┘ê╪▒╪╡╪» ╪»╪▒╪ش╪د╪ز ╪د┘╪╖┘╪د╪ذ" : "Post Student Grades")}
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

  const myName = portalUser?.full_name || "╪د┘╪ث╪│╪ز╪د╪░ ╪ث╪ص┘à╪»";

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
      ? (isRTL ? `╪│┘┘╪ر ╪ذ┘é┘è┘à╪ر ${Number(newReqAmount).toLocaleString()} ╪▒.╪│` : `Loan of ${Number(newReqAmount).toLocaleString()} SAR`)
      : newReqDuration;

    const newRequest = {
      id,
      employeeName: myName,
      role: "Teacher",
      type: newReqType,
      date: new Date().toISOString().split('T')[0],
      duration: durationText || (isRTL ? "┘è┘ê┘à ┘ê╪د╪ص╪»" : "1 Day"),
      reason: newReqReason,
      loanAmount: newReqType === "LOAN" ? Number(newReqAmount || 0) : undefined,
      status: "PENDING",
      createdAt: new Date().toISOString().split('T')[0]
    };

    const updated = [newRequest, ...requests];
    setRequests(updated);
    localStorage.setItem("staff_requests", JSON.stringify(updated));
    setIsNewRequestOpen(false);
    toast.success(isRTL ? "╪ز┘à ╪ح╪▒╪│╪د┘ ╪╖┘╪ذ┘â ┘┘╪ح╪»╪د╪▒╪ر ╪ذ┘╪ش╪د╪ص" : "Request submitted to administration successfully");

    setNewReqReason("");
    setNewReqAmount("");
    setNewReqDuration("");
  };

  const getStatusBadge = (status) => {
    const map = {
      'PENDING': { bg: 'bg-amber-50 text-amber-700 border-amber-200/50', label: isRTL ? '┘é┘è╪» ╪د┘╪د┘╪ز╪╕╪د╪▒' : 'Pending' },
      'APPROVED': { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/50', label: isRTL ? '┘à╪╣╪ز┘à╪»' : 'Approved' },
      'REJECTED': { bg: 'bg-rose-50 text-rose-700 border-rose-200/50', label: isRTL ? '┘à╪▒┘┘ê╪╢' : 'Rejected' },
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
      'LEAVE': { label: isRTL ? '╪╖┘╪ذ ╪ح╪ش╪د╪▓╪ر' : 'Leave Request', color: 'text-blue-600 bg-blue-50' },
      'PERMISSION': { label: isRTL ? '╪╖┘╪ذ ╪د╪│╪ز╪خ╪░╪د┘' : 'Permission', color: 'text-amber-600 bg-amber-50' },
      'PUNCH_CORRECTION': { label: isRTL ? '╪ز╪╡╪ص┘è╪ص ╪ذ╪╡┘à╪ر' : 'Punch Correction', color: 'text-violet-600 bg-violet-50' },
      'LOAN': { label: isRTL ? '╪╖┘╪ذ ╪│┘┘╪ر' : 'Loan Request', color: 'text-emerald-600 bg-emerald-50' },
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
          <span>{isRTL ? "╪╖┘╪ذ ╪ش╪»┘è╪»" : "New Request"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-white border-none shadow-sm rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-stone-400 text-xs font-bold uppercase">{isRTL ? "╪╖┘╪ذ╪د╪ز┘è ╪د┘┘â┘┘è╪ر" : "Total Requests"}</p>
            <h4 className="text-2xl font-black text-stone-900 num-en">{myRequests.length}</h4>
          </div>
        </Card>
        <Card className="p-6 bg-white border-none shadow-sm rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-stone-400 text-xs font-bold uppercase">{isRTL ? "┘é┘è╪» ╪د┘╪د┘╪ز╪╕╪د╪▒" : "Pending"}</p>
            <h4 className="text-2xl font-black text-amber-600 num-en">{myRequests.filter(r => r.status === "PENDING").length}</h4>
          </div>
        </Card>
        <Card className="p-6 bg-white border-none shadow-sm rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-stone-400 text-xs font-bold uppercase">{isRTL ? "╪د┘┘à╪╣╪ز┘à╪»╪ر" : "Approved"}</p>
            <h4 className="text-2xl font-black text-emerald-600 num-en">{myRequests.filter(r => r.status === "APPROVED").length}</h4>
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-white border-none shadow-sm rounded-3xl space-y-4">
        <div className="relative">
          <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-stone-400`} size={16} />
          <Input 
            placeholder={isRTL ? "╪د╪ذ╪ص╪س ┘┘è ╪╖┘╪ذ╪د╪ز┘â..." : "Search your requests..."} 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} bg-stone-50 border-stone-200 rounded-xl h-11 text-xs`}
            dir={isRTL ? "rtl" : "ltr"}
          />
        </div>

        <div className="space-y-3 pt-2">
          {filteredRequests.length === 0 ? (
            <div className="py-12 text-center text-stone-400 border border-dashed border-stone-100 rounded-2xl">
              {isRTL ? "┘╪د ╪ز┘ê╪ش╪» ╪╖┘╪ذ╪د╪ز ┘à╪│╪ش┘╪ر." : "No requests found."}
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
                      <span>┬╖</span>
                      <span className="num-en">{req.date}</span>
                      <span>┬╖</span>
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
            <DialogTitle className="text-lg font-serif font-black">{isRTL ? "╪ز┘é╪»┘è┘à ╪╖┘╪ذ ╪ش╪»┘è╪»" : "New Request"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateRequest} className="space-y-4 mt-2">
            <div className="space-y-1">
              <label htmlFor="field-teacherportal-select-1" className="text-xs font-bold text-stone-500">{isRTL ? "┘┘ê╪╣ ╪د┘╪╖┘╪ذ" : "Request Type"}</label>
              <select id="field-teacherportal-select-1" name="select_1" aria-label="select 1" 
                value={newReqType} 
                onChange={(e) => setNewReqType(e.target.value)}
                className="w-full bg-white border border-stone-200 rounded-xl h-10 px-3 text-xs font-bold text-stone-700 outline-none"
              >
                <option value="LEAVE">{isRTL ? "╪╖┘╪ذ ╪ح╪ش╪د╪▓╪ر" : "Leave"}</option>
                <option value="PERMISSION">{isRTL ? "╪╖┘╪ذ ╪د╪│╪ز╪خ╪░╪د┘" : "Permission"}</option>
                <option value="PUNCH_CORRECTION">{isRTL ? "╪ز╪╡╪ص┘è╪ص ╪ذ╪╡┘à╪ر" : "Punch Correction"}</option>
                <option value="LOAN">{isRTL ? "╪╖┘╪ذ ╪│┘┘╪ر ┘à╪د┘┘è╪ر" : "Financial Loan"}</option>
              </select>
            </div>

            {newReqType === "LOAN" ? (
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-500">{isRTL ? "┘à╪ذ┘╪║ ╪د┘╪│┘┘╪ر (╪ذ╪د┘╪▒┘è╪د┘ ╪د┘╪│╪╣┘ê╪»┘è)" : "Loan Amount (SAR)"}</label>
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
                <label className="text-xs font-bold text-stone-500">{isRTL ? "╪د┘┘à╪»╪ر ╪ث┘ê ╪د┘╪ز┘╪د╪╡┘è┘" : "Duration / Detail"}</label>
                <Input 
                  value={newReqDuration} 
                  onChange={(e) => setNewReqDuration(e.target.value)} 
                  placeholder={isRTL ? "┘à╪س╪د┘: ┘ث ╪ث┘è╪د┘à ╪ث┘ê ╪│╪د╪╣╪ز╪د┘" : "e.g. 3 days or 2 hours"} 
                  className="rounded-xl border-stone-200"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-500">{isRTL ? "╪د┘╪│╪ذ╪ذ / ╪د┘┘à┘╪د╪ص╪╕╪د╪ز" : "Reason / Note"}</label>
              <Input 
                value={newReqReason} 
                onChange={(e) => setNewReqReason(e.target.value)} 
                placeholder={isRTL ? "╪ث╪»╪«┘ ╪ز┘╪د╪╡┘è┘ ┘ê┘à╪ذ╪▒╪▒╪د╪ز ╪د┘╪╖┘╪ذ..." : "Describe the reason"} 
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
                {isRTL ? "╪ح┘╪║╪د╪ة" : "Cancel"}
              </button>
              <button 
                type="submit" 
                className={`${btnPrimary} h-10 px-4`}
              >
                {isRTL ? "╪ز┘é╪»┘è┘à ╪د┘╪╖┘╪ذ" : "Submit"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
