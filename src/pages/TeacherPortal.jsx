import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
    queryFn: () => base44.entities.Subject.filter({ teacher_id: teacherId }) 
  });

  const { data: students = [], isLoading: isLoadingStudents } = useQuery({ 
    queryKey: ["teacher-students"], 
    queryFn: () => base44.entities.Student.list() 
  });

  const { data: teacherSchedules = [] } = useQuery({
    queryKey: ["teacher-schedules", teacherId],
    queryFn: () => base44.entities.ClassSchedule.filter({ teacher_id: teacherId })
  });

  const { data: teacherTasks = [] } = useQuery({
    queryKey: ["teacher-tasks", teacherId],
    queryFn: () => base44.entities.TeacherTask.filter({ teacher_id: teacherId })
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
            section: "A" // default fallback section
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
        return studentGrade === clsGrade && (studentSection === clsSection || clsSection === 'a' || clsSection === 'all' || clsSection === '' || clsSection === 'أ');
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
          return studentGrade === clsGrade && (studentSection === clsSection || clsSection === 'a' || clsSection === 'all' || clsSection === '' || clsSection === 'أ');
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
    queryFn: () => base44.entities.OfficialAnnouncement.list("-created_at")
  });

  const teacherAnnouncements = React.useMemo(() => {
    return officialAnnouncements.filter(a => a.target_audience === "teachers" || a.target_audience === "all");
  }, [officialAnnouncements]);

  const activeHighPriorityAnnouncements = React.useMemo(() => {
    return teacherAnnouncements.filter(a => a.priority === "high");
  }, [teacherAnnouncements]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  return (
    <div className={`min-h-screen bg-stone-50 text-stone-900 ${isRTL ? 'font-cairo' : 'font-sans'}`} dir={isRTL ? "rtl" : "ltr"}>
      <TeacherSidebar />
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
          <p className="text-stone-400 font-medium">{isRTL ? "أهلاً بك يا أستاذ! لديك ٣ حصص اليوم و١٢ واجباً بانتظار التصحيح." : "Welcome back! You have 3 classes today and 12 assignments to grade."}</p>
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
          <button onClick={handleLogout} className={`${btnOutline} rounded-full h-12 px-6 border-rose-100 text-rose-600 bg-rose-50 hover:bg-rose-100 hover:text-rose-700`}>
            <LogOut size={18} />
            <span className="hidden sm:inline">{isRTL ? "تسجيل الخروج" : "Log out"}</span>
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
                { value: "grades", label: isRTL ? "الدرجات" : "Grades", icon: Award },
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
                      <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-8">{isRTL ? "القسم" : "Section"} {cls.section || 'A'}</p>

                      <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-stone-50 p-4 rounded-3xl text-center">
                          <p className="text-[10px] font-bold text-stone-400 uppercase mb-1">{isRTL ? "الطلاب" : "Students"}</p>
                          <p className="text-xl font-black text-stone-900">
                            {students.filter(s => {
                              const sGrade = s.grade?.toString();
                              const cGrade = cls.grade?.toString();
                              const sSec = (s.section || '').toLowerCase().trim();
                              const cSec = (cls.section || '').toLowerCase().trim();
                              return sGrade === cGrade && (sSec === cSec || cSec === 'a' || cSec === 'all' || cSec === '' || cSec === 'أ');
                            }).length}
                          </p>
                        </div>
                        <div className="bg-stone-50 p-4 rounded-3xl text-center">
                          <p className="text-[10px] font-bold text-stone-400 uppercase mb-1">{isRTL ? "الحضور" : "Attendance"}</p>
                          <p className="text-xl font-black text-emerald-600"> 95٪</p>
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
                            {isRTL ? "إدارة الفصل" : "Manage Class"}
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
                          {isRTL ? "بدء حصة افتراضية مباشر" : "Start Live Virtual Class"}
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
                  <h4 className="font-bold text-stone-400 group-hover:text-primary transition-colors">{isRTL ? "إضافة فصل جديد" : "Add New Class"}</h4>
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
                      {isRTL ? "إدارة طلاب الفصل" : "Class Students Management"}
                    </h3>
                    <p className="text-stone-400 text-xs mt-1">
                      {isRTL ? "عرض قائمة طلاب فصولك الدراسية ومتابعة حضورهم وبياناتهم." : "View your class student list and track their attendance and details."}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    <div className="flex flex-col gap-1.5 min-w-[200px]">
                      <select 
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
                        <option value="all">{isRTL ? "جميع طلابي" : "All My Students"}</option>
                        {classes.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} - {isRTL ? "القسم" : "Section"} {c.section || 'A'} ({c.grade_level})
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
                      placeholder={isRTL ? "البحث باسم الطالب أو الرقم التعريفي..." : "Search by student name or ID..."}
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
                      <span>{isRTL ? "جاري تحميل بيانات الطلاب..." : "Loading students..."}</span>
                    </div>
                  </div>
                ) : filteredTeacherStudents.length === 0 ? (
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
                            <TableCell className="font-mono text-stone-550 text-xs">#{student.student_id}</TableCell>
                            <TableCell className="text-xs font-semibold text-stone-600">
                              {isRTL ? "الصف" : "Grade"} {student.grade} - {student.section || "A"}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-0.5 text-[10px] text-stone-400 font-medium">
                                <p className="num-en">{student.user_email || "-"}</p>
                                <p className="num-en">{student.parent_phone || "-"}</p>
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
          </Tabs>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: isRTL ? "متوسط المعدل" : "Average GPA", value: "٣.٤٥", icon: Star, color: "text-amber-500", bg: "bg-amber-50" },
              { label: isRTL ? "الواجبات المكتملة" : "Assignments Done", value: "١٢٨", icon: FileText, color: "text-blue-500", bg: "bg-blue-50" },
              { label: isRTL ? "ساعات التدريس" : "Teaching Hours", value: "٤٢", icon: Clock, color: "text-purple-500", bg: "bg-purple-50" },
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
                <h4 className="font-bold">{isRTL ? "أداء الطلاب" : "Student Performance"}</h4>
                <TrendingUp size={20} className="text-emerald-400" />
              </div>
              
              <div className="space-y-6">
                {[
                  { label: isRTL ? "فوق المتوسط" : "Above Average", value: 70, color: "bg-emerald-500" },
                  { label: isRTL ? "متوسط" : "Average", value: 20, color: "bg-amber-500" },
                  { label: isRTL ? "يحتاج تحسين" : "Needs Review", value: 10, color: "bg-rose-500" },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-2 text-[10px] font-bold uppercase tracking-widest opacity-60">
                      <span>{item.label}</span>
                      <span>{item.value}٪</span>
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
              <Badge className="bg-rose-500 text-white border-none rounded-full h-5 w-5 flex items-center justify-center p-0 text-[10px] font-black"> 3</Badge>
            </div>
            
            <div className="space-y-6">
              {[
                { title: "غياب متكرر - طالب ٤٠٥", time: "١٠:١٥ ص", icon: AlertCircle, color: "text-rose-500", bg: "bg-rose-50" },
                { title: "طلب مراجعة درجة - سارة", time: "٠٩:٣٠ ص", icon: MessageCircle, color: "text-blue-500", bg: "bg-blue-50" },
                { title: "تم تحديث خطة المنهج", time: "٠٨:٠٠ ص", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" },
              ].map((alert, i) => (
                <div key={i} className="flex gap-4 group cursor-pointer">
                  <div className={`h-12 w-12 rounded-2xl ${alert.bg} ${alert.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <alert.icon size={20} />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-stone-800 leading-tight group-hover:text-primary transition-colors">{alert.title}</h5>
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
      return studentGrade === clsGrade && (studentSection === clsSection || clsSection === 'a' || clsSection === 'all' || clsSection === '' || clsSection === 'أ');
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
        await base44.entities.Attendance.create({
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
              <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "الفصل الدراسي" : "Class Section"}</label>
              <select 
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
                    {c.name} - {isRTL ? "القسم" : "Section"} {c.section || 'A'} ({c.grade_level})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5 max-w-xs">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "التاريخ" : "Date"}</label>
              <input 
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
                        {isRTL ? "الصف" : "Grade"} {student.grade} - {student.section || "A"}
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
      await base44.entities.StudentAward.create({
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
                <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "اختر الطالب" : "Select Student"}</label>
                <select 
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
                <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "اختر الوسام" : "Choose Badge"}</label>
                <select 
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
                <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "الوصف وأسباب منح الوسام" : "Honors Description & Motivation"}</label>
                <textarea 
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

        await base44.entities.StudentGrade.create({
          student_id: student.student_id || student.id,
          student_name: student.full_name || student.name,
          subject_name: `${selectedClass.name} - ${assessmentName}`,
          score: numericScore,
          max_score: parseFloat(maxScore),
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
            <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "اختر الفصل" : "Class Section"}</label>
            <select 
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
                  {c.name} - {isRTL ? "القسم" : "Section"} {c.section || 'A'} ({c.grade_level})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "الفترة / الفصل الدراسي" : "Term"}</label>
            <select 
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