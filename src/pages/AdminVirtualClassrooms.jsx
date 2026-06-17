import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { entities } from "@/api/dbClient";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/lib/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Clock, Eye, BookOpen, GraduationCap,
  Calendar, RefreshCw, Monitor, Radio,
  AlertCircle, Activity, Shield, User,
  StopCircle, Hourglass, Layers
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function AdminVirtualClassrooms() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all"); // all | active | scheduled | ended

  // ===== DATA QUERIES =====

  // 1. Fetch all virtual sessions from DB
  const {
    data: virtualSessions = [],
    isLoading,
    refetch: refetchSessions,
    dataUpdatedAt
  } = useQuery({
    queryKey: ["admin-virtual-sessions"],
    queryFn: () => entities.VirtualSession.list("-created_at"),
    refetchInterval: 10000 // Auto-refresh every 10 seconds
  });

  // 2. Fetch all session participants from DB
  const { data: allParticipants = [], refetch: refetchParticipants } = useQuery({
    queryKey: ["admin-all-participants"],
    queryFn: () => entities.SessionParticipant.list("-joined_at"),
    refetchInterval: 8000 // Auto-refresh every 8 seconds
  });

  // 3. Fetch all subjects to map subject_id -> grade (class name)
  const { data: allSubjects = [] } = useQuery({
    queryKey: ["admin-all-subjects"],
    queryFn: () => entities.Subject.list("name"),
    staleTime: 1000 * 60 * 5 // Cache for 5 min (subjects rarely change)
  });

  // Build a lookup map: subject_id -> { name, grade }
  const subjectMap = useMemo(() => {
    const map = {};
    allSubjects.forEach(sub => {
      map[sub.id] = { name: sub.name, grade: sub.grade || null };
    });
    return map;
  }, [allSubjects]);

  // Helper: get participants for a specific session (excluding those who left)
  const getParticipantsForSession = (sessionId) =>
    allParticipants.filter(p => p.session_id === sessionId && !p.left_at);

  // Filter sessions based on selected filter tab
  const filteredSessions = virtualSessions.filter(s => {
    if (filter === "all") return true;
    return s.status === filter;
  });

  const activeSessions = virtualSessions.filter(s => s.status === "active");
  const scheduledSessions = virtualSessions.filter(s => s.status === "scheduled");
  const endedSessions = virtualSessions.filter(s => s.status === "ended");

  // Refresh all data at once
  const handleRefreshAll = () => {
    refetchSessions();
    refetchParticipants();
    toast.success(isRTL ? "تم تحديث جميع البيانات" : "All data refreshed");
  };

  // Admin enters a live session as observer
  const handleEnterSession = (sessionId) => {
    localStorage.setItem("portal_role", "admin");
    localStorage.setItem("portal_user_id", "ADMIN-OBS");
    localStorage.setItem("portal_user_name", isRTL ? "مدير النظام" : "System Admin");
    navigate(`/virtual-classroom/${sessionId}`);
    toast.info(isRTL ? "دخلت الفصل كمراقب (مدير النظام)" : "Entered as Observer (System Admin)");
  };

  // Format a date/time
  const formatDateTime = (dt) => {
    if (!dt) return "—";
    return new Date(dt).toLocaleString(isRTL ? "ar-EG" : "en-US", {
      hour: "2-digit", minute: "2-digit",
      day: "numeric", month: "short"
    });
  };

  // Calculate session duration
  const getSessionDuration = (startedAt) => {
    if (!startedAt) return null;
    const diff = Date.now() - new Date(startedAt).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return isRTL ? `${hours}س ${mins}د` : `${hours}h ${mins}m`;
    return isRTL ? `${mins} دقيقة` : `${minutes}m`;
  };

  // Resolve grade/class name from subject_id or title
  const resolveGradeName = (session) => {
    // Try to get grade from the subject mapping
    if (session.subject_id && subjectMap[session.subject_id]?.grade) {
      const grade = subjectMap[session.subject_id].grade;
      return isRTL ? `الصف ${grade}` : `Grade ${grade}`;
    }
    return isRTL ? "عام" : "General";
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };
  const itemVariants = {
    hidden: { y: 18, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.4 } }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 pb-10"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* ===== PAGE HEADER ===== */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center shadow-xl shadow-violet-500/20">
            <Monitor size={26} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-stone-900 leading-tight">
              {isRTL ? "مراقبة الفصول الافتراضية" : "Virtual Classrooms Monitor"}
            </h1>
            <p className="text-sm text-stone-500 font-medium mt-0.5">
              {isRTL ? "لوحة تحكم مدير النظام — مشاهدة ومراقبة الحصص المباشرة" : "Admin Control Panel — Watch & Monitor Live Sessions"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-stone-400 font-medium">
            {isRTL ? "آخر تحديث:" : "Last sync:"}{" "}
            {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString(isRTL ? "ar-EG" : "en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—"}
          </span>
          <button
            onClick={handleRefreshAll}
            className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-violet-500/20 transition-all duration-200 cursor-pointer"
          >
            <RefreshCw size={15} />
            {isRTL ? "تحديث" : "Refresh"}
          </button>
        </div>
      </motion.div>

      {/* ===== STATS CARDS ===== */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: isRTL ? "جارية الآن" : "Live Now",
            value: activeSessions.length,
            icon: Radio,
            gradient: "from-emerald-500 to-teal-600",
            glow: "shadow-emerald-400/20",
            badge: isRTL ? "مباشر" : "LIVE",
            badgeColor: "bg-emerald-100 text-emerald-700",
            pulse: true
          },
          {
            label: isRTL ? "مجدولة" : "Scheduled",
            value: scheduledSessions.length,
            icon: Hourglass,
            gradient: "from-amber-500 to-orange-600",
            glow: "shadow-amber-400/20",
            badge: isRTL ? "قادمة" : "Upcoming",
            badgeColor: "bg-amber-100 text-amber-700",
            pulse: false
          },
          {
            label: isRTL ? "منتهية" : "Ended",
            value: endedSessions.length,
            icon: StopCircle,
            gradient: "from-stone-400 to-stone-600",
            glow: "shadow-stone-400/20",
            badge: isRTL ? "مكتملة" : "Done",
            badgeColor: "bg-stone-100 text-stone-600",
            pulse: false
          },
          {
            label: isRTL ? "الطلاب المتصلون" : "Students Online",
            value: allParticipants.filter(p => !p.left_at && p.role !== "teacher").length,
            icon: Users,
            gradient: "from-blue-500 to-violet-600",
            glow: "shadow-blue-400/20",
            badge: isRTL ? "متصل" : "Online",
            badgeColor: "bg-blue-100 text-blue-700",
            pulse: false
          }
        ].map((stat, i) => (
          <motion.div key={i} variants={itemVariants}>
            <Card className="relative overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300 group cursor-default">
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-5 group-hover:opacity-10 transition-opacity`} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className={`h-11 w-11 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg ${stat.glow}`}>
                    <stat.icon size={20} className="text-white" />
                  </div>
                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full flex items-center gap-1.5 ${stat.badgeColor}`}>
                    {stat.pulse && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />}
                    {stat.badge}
                  </span>
                </div>
                <p className="text-3xl font-black text-stone-900">{stat.value}</p>
                <p className="text-xs text-stone-500 font-bold mt-1">{stat.label}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* ===== FILTER TABS ===== */}
      <motion.div variants={itemVariants} className="flex items-center gap-2 flex-wrap">
        {[
          { key: "all", label: isRTL ? "الكل" : "All", count: virtualSessions.length },
          { key: "active", label: isRTL ? "جارية الآن 🔴" : "Live Now 🔴", count: activeSessions.length },
          { key: "scheduled", label: isRTL ? "مجدولة" : "Scheduled", count: scheduledSessions.length },
          { key: "ended", label: isRTL ? "منتهية" : "Ended", count: endedSessions.length }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer ${
              filter === tab.key
                ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            {tab.label}
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
              filter === tab.key ? "bg-white/20 text-white" : "bg-stone-200 text-stone-500"
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </motion.div>

      {/* ===== SESSION CARDS ===== */}
      {isLoading ? (
        <motion.div variants={itemVariants} className="flex flex-col items-center justify-center py-24 text-stone-400">
          <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mb-4" />
          <p className="font-bold text-sm">{isRTL ? "جاري تحميل الحصص..." : "Loading sessions..."}</p>
        </motion.div>
      ) : filteredSessions.length === 0 ? (
        <motion.div variants={itemVariants}>
          <Card className="border-2 border-dashed border-stone-200 bg-stone-50/50 p-16 flex flex-col items-center justify-center text-center">
            <div className="h-16 w-16 rounded-3xl bg-stone-100 flex items-center justify-center mb-4">
              <AlertCircle size={28} className="text-stone-400" />
            </div>
            <p className="font-black text-stone-600 text-lg">
              {isRTL ? "لا توجد حصص في هذه الفئة" : "No sessions in this category"}
            </p>
            <p className="text-stone-400 text-sm mt-2">
              {isRTL ? "ستظهر الحصص هنا عند إنشائها من قِبل المعلمين." : "Sessions will appear here once teachers create them."}
            </p>
          </Card>
        </motion.div>
      ) : (
        <motion.div variants={containerVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <AnimatePresence>
            {filteredSessions.map((session) => {
              const isActive = session.status === "active";
              const isScheduled = session.status === "scheduled";
              const isEnded = session.status === "ended";
              const participants = getParticipantsForSession(session.id);
              const duration = isActive ? getSessionDuration(session.started_at) : null;
              const gradeName = resolveGradeName(session);

              return (
                <motion.div
                  key={session.id}
                  variants={itemVariants}
                  layout
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card className={`relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 group ${
                    isActive
                      ? "ring-2 ring-emerald-400/30 bg-gradient-to-br from-white to-emerald-50/30"
                      : isScheduled
                      ? "ring-1 ring-amber-300/20 bg-white"
                      : "bg-stone-50/60"
                  }`}>
                    {/* Active pulse strip */}
                    {isActive && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 animate-pulse" />
                    )}

                    <div className="p-6">
                      {/* Card Top Row: Title + Status + Enter Button */}
                      <div className="flex items-start justify-between gap-3 mb-5">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Session Icon */}
                          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                            isActive
                              ? "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-300/30"
                              : isScheduled
                              ? "bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-300/20"
                              : "bg-gradient-to-br from-stone-300 to-stone-400"
                          }`}>
                            {isActive ? (
                              <Radio size={22} className="text-white" />
                            ) : isScheduled ? (
                              <Calendar size={22} className="text-white" />
                            ) : (
                              <StopCircle size={22} className="text-white" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <h3 className={`font-black text-base truncate ${isEnded ? "text-stone-400" : "text-stone-900"}`}>
                              {session.title || (isRTL ? "حصة افتراضية" : "Virtual Session")}
                            </h3>
                            {/* Status badge */}
                            {isActive && (
                              <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-emerald-600 bg-emerald-100 px-2.5 py-0.5 rounded-full mt-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                                {isRTL ? "مباشر الآن" : "LIVE NOW"}
                              </span>
                            )}
                            {isScheduled && (
                              <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-amber-600 bg-amber-100 px-2.5 py-0.5 rounded-full mt-1">
                                <Clock size={9} />
                                {isRTL ? "مجدولة" : "SCHEDULED"}
                              </span>
                            )}
                            {isEnded && (
                              <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-stone-500 bg-stone-100 px-2.5 py-0.5 rounded-full mt-1">
                                {isRTL ? "منتهية" : "ENDED"}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Enter Button */}
                        {isActive && (
                          <button
                            onClick={() => handleEnterSession(session.id)}
                            className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black shadow-lg shadow-violet-500/25 transition-all duration-200 cursor-pointer group-hover:scale-105"
                          >
                            <Eye size={13} />
                            {isRTL ? "دخول ومراقبة" : "Watch Live"}
                          </button>
                        )}
                      </div>

                      {/* ===== INFO GRID: 3 columns — Teacher / Subject / Grade ===== */}
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        {/* 1. Teacher Name */}
                        <div className={`flex items-center gap-2.5 p-3 rounded-xl ${isActive ? "bg-teal-50 border border-teal-100" : "bg-stone-100/60"}`}>
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${isActive ? "bg-teal-200" : "bg-stone-200"}`}>
                            <User size={14} className={isActive ? "text-teal-700" : "text-stone-500"} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[9px] font-black uppercase tracking-wider text-stone-400">
                              {isRTL ? "المعلم" : "Teacher"}
                            </p>
                            <p className={`text-xs font-bold truncate ${isActive ? "text-teal-800" : "text-stone-600"}`}>
                              {session.teacher_name || (isRTL ? "غير محدد" : "N/A")}
                            </p>
                          </div>
                        </div>

                        {/* 2. Subject / Lesson Name */}
                        <div className={`flex items-center gap-2.5 p-3 rounded-xl ${isActive ? "bg-emerald-50 border border-emerald-100" : "bg-stone-100/60"}`}>
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${isActive ? "bg-emerald-200" : "bg-stone-200"}`}>
                            <BookOpen size={14} className={isActive ? "text-emerald-700" : "text-stone-500"} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[9px] font-black uppercase tracking-wider text-stone-400">
                              {isRTL ? "المادة / الدرس" : "Subject"}
                            </p>
                            <p className={`text-xs font-bold truncate ${isActive ? "text-emerald-800" : "text-stone-600"}`}>
                              {session.subject_name || (isRTL ? "غير محدد" : "N/A")}
                            </p>
                          </div>
                        </div>

                        {/* 3. Grade / Class Name */}
                        <div className={`flex items-center gap-2.5 p-3 rounded-xl ${isActive ? "bg-violet-50 border border-violet-100" : "bg-stone-100/60"}`}>
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${isActive ? "bg-violet-200" : "bg-stone-200"}`}>
                            <Layers size={14} className={isActive ? "text-violet-700" : "text-stone-500"} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[9px] font-black uppercase tracking-wider text-stone-400">
                              {isRTL ? "الصف الدراسي" : "Class / Grade"}
                            </p>
                            <p className={`text-xs font-bold truncate ${isActive ? "text-violet-800" : "text-stone-600"}`}>
                              {gradeName}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Row: Participants + Duration + Time */}
                      <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                        <div className="flex items-center gap-4">
                          {/* Participants count */}
                          <div className="flex items-center gap-1.5 text-xs text-stone-500">
                            <Users size={13} className={isActive ? "text-emerald-500" : "text-stone-400"} />
                            <span className={`font-bold ${isActive ? "text-emerald-600" : "text-stone-500"}`}>
                              {participants.length > 0 ? participants.length : "0"}
                            </span>
                            <span>{isRTL ? "مشارك" : "online"}</span>
                          </div>

                          {/* Duration (only for active) */}
                          {duration && (
                            <div className="flex items-center gap-1.5 text-xs">
                              <Activity size={12} className="text-emerald-400 animate-pulse" />
                              <span className="font-black text-emerald-600">{duration}</span>
                            </div>
                          )}
                        </div>

                        {/* Time info */}
                        <div className="flex items-center gap-1.5 text-[10px] text-stone-400 font-medium">
                          <Clock size={11} />
                          <span>
                            {isActive
                              ? (isRTL ? "بدأت: " : "Started: ") + formatDateTime(session.started_at)
                              : isScheduled
                              ? (isRTL ? "مجدولة: " : "At: ") + formatDateTime(session.scheduled_at)
                              : (isRTL ? "انتهت: " : "Ended: ") + formatDateTime(session.ended_at)}
                          </span>
                        </div>
                      </div>

                      {/* Participants avatars row for active sessions */}
                      {isActive && participants.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-emerald-100">
                          <p className="text-[10px] font-black text-stone-400 uppercase mb-2">
                            {isRTL ? "المتصلون الآن:" : "Currently Online:"}
                          </p>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {participants.slice(0, 10).map((p, idx) => (
                              <div
                                key={idx}
                                title={p.user_name}
                                className={`h-7 px-2 min-w-[28px] rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white shadow-sm gap-1 ${
                                  p.role === "teacher"
                                    ? "bg-teal-500 text-white"
                                    : "bg-violet-100 text-violet-700"
                                }`}
                              >
                                {p.role === "teacher" ? "👨‍🏫" : (p.user_name?.[0] || "?")}
                                {p.role === "teacher" && <span className="text-[8px] font-black">{isRTL ? "معلم" : "T"}</span>}
                              </div>
                            ))}
                            {participants.length > 10 && (
                              <div className="h-7 px-2 rounded-full bg-stone-100 text-stone-500 text-[10px] font-black flex items-center justify-center border-2 border-white">
                                +{participants.length - 10}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ===== ADMIN NOTE ===== */}
      <motion.div variants={itemVariants}>
        <Card className="border-none bg-gradient-to-r from-violet-50 to-indigo-50 shadow-none">
          <div className="p-5 flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
              <Shield size={18} className="text-violet-600" />
            </div>
            <div>
              <h4 className="font-black text-sm text-violet-900">
                {isRTL ? "صلاحية المدير — المراقبة الصامتة" : "Admin Privilege — Silent Observation"}
              </h4>
              <p className="text-xs text-violet-600 mt-1 leading-relaxed">
                {isRTL
                  ? "عند الضغط على 'دخول ومراقبة'، ستدخل الفصل كمراقب بصلاحية مدير النظام. يمكنك مشاهدة البث المباشر، الدردشة، والمشاركين دون التأثير على سير الحصة. البيانات المعروضة هنا حقيقية ومحدّثة تلقائيًا كل ١٠ ثوانٍ."
                  : "Clicking 'Watch Live' enters the session as a System Admin observer. You can view the live stream, chat, and participants without disrupting the session. All data shown here is real and auto-refreshes every 10 seconds."}
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
