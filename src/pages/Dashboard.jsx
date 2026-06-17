import React from "react";
import { useQuery } from "@tanstack/react-query";
import { entities } from "@/api/dbClient";
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  ClipboardCheck, 
  TrendingUp, 
  Calendar as CalendarIcon,
  Award,
  Sparkles,
  ArrowUpRight
} from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/translations";
import StatCard from "@/components/shared/StatCard";
import PageHeader from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import AttendanceTrendsCard from "@/components/attendance/AttendanceTrendsCard";
import AttendanceReportCard from "@/components/attendance/AttendanceReportCard";
import DashboardCalendar from "@/components/dashboard/DashboardCalendar";
import LeaderboardWidget from "@/components/dashboard/LeaderboardWidget";

export default function Dashboard() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  
  const { data: students = [] } = useQuery({ 
    queryKey: ["students"], 
    queryFn: () => entities.Student.list("-created_at", 500),
    staleTime: 1000 * 60 * 10 // rare changes
  });
  const { data: teachers = [] } = useQuery({ 
    queryKey: ["teachers"], 
    queryFn: () => entities.Teacher.list("-created_at", 100),
    staleTime: 1000 * 60 * 10 // rare changes
  });
  const { data: attendance = [] } = useQuery({ 
    queryKey: ["attendance-recent"], 
    queryFn: () => entities.Attendance.list("-created_date", 8),
    staleTime: 1000 * 60 * 2 // frequently changes
  });
  const { data: allAttendance = [] } = useQuery({ 
    queryKey: ["attendance-trends"], 
    queryFn: () => entities.Attendance.list("-date", 200),
    staleTime: 1000 * 60 * 2 // frequently changes
  });
  const { data: materials = [] } = useQuery({ 
    queryKey: ["materials"], 
    queryFn: () => entities.StudyMaterial.list("-created_date", 100),
    staleTime: 1000 * 60 * 10 // rare changes
  });

  const activeStudents = students.filter(s => s.status === "active").length;
  const todayDate = format(new Date(), "yyyy-MM-dd");
  const todayAttendance = attendance.filter(a => a.date === todayDate).length;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-8"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader 
          title={t("dashboard.title", language)} 
          subtitle={`${t("common.welcome", language)} — ${format(new Date(), "EEEE, MMMM d, yyyy", { locale: isRTL ? arSA : undefined })}`} 
        />
        <div className="flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-full border border-primary/10">
          <Sparkles className="h-4 w-4 text-primary animate-pulse" />
          <span className="text-xs font-semibold text-primary">{t("common.today", language)}</span>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={itemVariants} className="group">
          <StatCard 
            title={t("dashboard.activeStudents", language)} 
            value={activeStudents} 
            icon={Users} 
            color="blue" 
            sub={`${students.length} ${t("dashboard.totalStudents", language)}`}
            className="border-none shadow-sm hover:shadow-xl hover:bg-blue-50/50 transition-all duration-500"
          />
        </motion.div>
        <motion.div variants={itemVariants} className="group">
          <StatCard 
            title={t("dashboard.teachers", language)} 
            value={teachers.filter(t => t.status === "active").length} 
            icon={GraduationCap} 
            color="indigo" 
            className="border-none shadow-sm hover:shadow-xl hover:bg-indigo-50/50 transition-all duration-500"
          />
        </motion.div>
        <motion.div variants={itemVariants} className="group">
          <StatCard 
            title={t("dashboard.materials", language)} 
            value={materials.length} 
            icon={BookOpen} 
            color="green" 
            className="border-none shadow-sm hover:shadow-xl hover:bg-green-50/50 transition-all duration-500"
          />
        </motion.div>
        <motion.div variants={itemVariants} className="group">
          <StatCard 
            title={t("common.awards", language)} 
            value="12" 
            icon={Award} 
            color="amber" 
            className="border-none shadow-sm hover:shadow-xl hover:bg-amber-50/50 transition-all duration-500"
          />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Reports - Taking 2/3 space */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div variants={itemVariants}>
            <AttendanceReportCard records={allAttendance} />
          </motion.div>
          <motion.div variants={itemVariants}>
            <AttendanceTrendsCard records={allAttendance} />
          </motion.div>
        </div>

        {/* Sidebar Widgets - Taking 1/3 space */}
        <div className="space-y-6">
          <motion.div variants={itemVariants}>
            <Card className="p-4 overflow-hidden relative border-none shadow-sm hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 p-2 opacity-10">
                <CalendarIcon size={60} />
              </div>
              <DashboardCalendar />
            </Card>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <LeaderboardWidget />
          </motion.div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
        {/* Recent Attendance */}
        <motion.div variants={itemVariants}>
          <Card className="p-6 border-none shadow-sm hover:shadow-lg transition-all duration-500 bg-white/50 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                  <ClipboardCheck className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-base">{t("dashboard.recentAttendance", language)}</h3>
                  <p className="text-xs text-muted-foreground">{todayAttendance} {t("dashboard.attendanceToday", language)}</p>
                </div>
              </div>
              <button className="text-blue-600 text-xs font-semibold hover:underline flex items-center gap-1">
                {t("common.view", language)} <ArrowUpRight size={12} />
              </button>
            </div>
            
            {attendance.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ClipboardCheck size={48} className="opacity-10 mb-4" />
                <p>{t("common.noRecords", language)}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {attendance.map(a => (
                  <div key={a.id} className="flex items-center justify-between p-4 rounded-2xl bg-stone-50/50 hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-stone-100">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-stone-200 flex items-center justify-center font-bold text-stone-500">
                        {a.student_name?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{a.student_name}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {a.type?.replace("_", " ")} {a.time && `· ${a.time}`}
                        </p>
                      </div>
                    </div>
                    <Badge variant={a.status === "present" ? "default" : a.status === "late" ? "secondary" : "destructive"} className="px-3 py-1 rounded-lg text-xs capitalize font-bold">
                      {isRTL ? (a.status === "present" ? "حاضر" : a.status === "late" ? "متأخر" : "غائب") : a.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        {/* Grade Distribution */}
        <motion.div variants={itemVariants}>
          <Card className="p-6 border-none shadow-sm hover:shadow-lg transition-all duration-500 bg-white/50 backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-base">{t("dashboard.gradeDistribution", language)}</h3>
                <p className="text-xs text-muted-foreground">{t("dashboard.subtitle", language)}</p>
              </div>
            </div>
            
            <div className="space-y-6">
              {["1","2","3","4","5","6","7","8","9","10","11","12"].map(grade => {
                const count = students.filter(s => s.grade === grade && s.status === "active").length;
                if (count === 0) return null;
                const pct = activeStudents > 0 ? (count / activeStudents) * 100 : 0;
                return (
                  <div key={grade} className="group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-stone-700">{t("students.grade", language)} {grade}</span>
                      <span className="text-sm font-bold text-primary">{count}</span>
                    </div>
                    <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full" 
                      />
                    </div>
                  </div>
                );
              })}
              {activeStudents === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground opacity-50">
                  <TrendingUp size={48} className="mb-4" />
                  <p>{t("common.noRecords", language)}</p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}