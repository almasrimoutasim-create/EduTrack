import React from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, Star, Zap, Rocket, ChevronLeft, ArrowUpRight, 
  Award, Calendar, BookOpen, ClipboardCheck, PlayCircle
} from "lucide-react";

const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all border-2 border-stone-300 bg-white text-stone-800 hover:bg-stone-50 hover:border-stone-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

export default function StudentLevelsXP({ student, studentAwards, assignments, attendanceLogs, classStudents = [], isRTL }) {
  // 1. Calculate points breakdown
  const baseXP = 500;
  const awardsXP = studentAwards.reduce((sum, a) => sum + (Number(a.points) || 0), 0);
  
  // Homework XP
  const savedSubmissions = localStorage.getItem("edu_submissions") ? JSON.parse(localStorage.getItem("edu_submissions")) : {};
  const studentIdVal = student.student_id || student.id;
  let homeworkXP = 0;
  assignments.forEach(task => {
    const asmSubs = savedSubmissions[task.id] || [];
    const sub = asmSubs.find(s => s.studentId === studentIdVal || s.studentId === student.id);
    if (sub && sub.score) {
      homeworkXP += Number(sub.score) || 0;
    }
  });

  // Attendance XP (50 XP per present day / gate_in)
  const presentDays = attendanceLogs.filter(l => l.status === "present" || l.type === "gate_in").length;
  const attendanceXP = presentDays * 50;

  const totalXP = baseXP + awardsXP + homeworkXP + attendanceXP;
  
  // Level Calculation (500 XP per level)
  const level = Math.floor(totalXP / 500) + 1;
  const xpInCurrentLevel = totalXP % 500;
  const xpNeededForNextLevel = 500 - xpInCurrentLevel;
  const progressPercent = Math.round((xpInCurrentLevel / 500) * 100);

  // Leaderboard data calculation
  const leaderboard = classStudents.map(s => {
    const isMe = s.id === student.id || s.student_id === student.student_id;
    let xp = 0;
    if (isMe) {
      xp = totalXP;
    } else {
      // Generate stable simulated XP for classmates based on ID
      let hash = 0;
      const str = s.full_name || s.name || "";
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      xp = Math.abs((hash % 1600) + 600); // 600 - 2200 XP
    }
    return {
      id: s.id,
      student_id: s.student_id,
      name: s.full_name || s.name,
      xp,
      isMe
    };
  }).sort((a, b) => b.xp - a.xp);

  // Rank Names
  const getRankName = (lvl) => {
    if (lvl === 1) return isRTL ? "مبتدئ / Novice" : "Novice";
    if (lvl === 2) return isRTL ? "مجتهد / Explorer" : "Explorer";
    if (lvl === 3) return isRTL ? "متميز / Challenger" : "Challenger";
    if (lvl === 4) return isRTL ? "خبير / Expert" : "Expert";
    return isRTL ? "أسطورة / Legend" : "Legend";
  };

  const getRankColor = (lvl) => {
    if (lvl === 1) return "from-stone-400 to-stone-500 text-white";
    if (lvl === 2) return "from-emerald-500 to-teal-500 text-white";
    if (lvl === 3) return "from-blue-500 to-indigo-600 text-white";
    if (lvl === 4) return "from-purple-500 to-fuchsia-600 text-white";
    return "from-amber-400 to-orange-550 text-amber-950";
  };

  // XP history/breakdown elements
  const xpBreakdown = [
    {
      title: isRTL ? "النقاط الترحيبية الأساسية" : "Base Welcome XP",
      value: baseXP,
      icon: Rocket,
      color: "text-blue-500 bg-blue-50"
    },
    {
      title: isRTL ? "النقاط المحتسبة للأوسمة" : "Earned Badges XP",
      value: awardsXP,
      icon: Trophy,
      color: "text-amber-500 bg-amber-50"
    },
    {
      title: isRTL ? "نقاط درجات الواجبات" : "Homework Scores XP",
      value: homeworkXP,
      icon: BookOpen,
      color: "text-purple-500 bg-purple-50"
    },
    {
      title: isRTL ? "نقاط الحضور المدرسي اليومي" : "Daily Attendance XP",
      value: attendanceXP,
      description: isRTL ? `${presentDays} أيام حضور (+50 لكل يوم)` : `${presentDays} present days (+50/day)`,
      icon: ClipboardCheck,
      color: "text-emerald-500 bg-emerald-50"
    }
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Progress Circle Card & XP Breakdown */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Level Shield & Progress */}
          <Card className="p-8 bg-gradient-to-br from-teal-900 via-stone-850 to-emerald-950 text-white rounded-[40px] shadow-xl relative overflow-hidden border-none">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
              {/* Level Badge Circle */}
              <div className="relative flex items-center justify-center h-40 w-40 shrink-0 mx-auto">
                {/* Rotating ring effect */}
                <span className="absolute inset-0 rounded-full border-4 border-dashed border-teal-500/30 animate-spin" style={{ animationDuration: '40s' }} />
                {/* Glow ring */}
                <span className="absolute inset-2 rounded-full border-4 border-emerald-400/50 animate-pulse" />
                <div className={`h-32 w-32 rounded-full bg-gradient-to-br ${getRankColor(level)} flex flex-col items-center justify-center shadow-2xl`}>
                  <Star size={36} fill="currentColor" className="text-yellow-300" />
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mt-1">{isRTL ? "المستوى" : "Level"}</p>
                  <p className="text-4xl font-black leading-none mt-0.5">{level}</p>
                </div>
              </div>

              {/* Progress text and bar */}
              <div className="flex-1 w-full space-y-4">
                <div className="text-center md:text-start">
                  <Badge className="bg-white/10 hover:bg-white/15 text-teal-300 border-none font-bold text-[10px] rounded-lg px-2.5 py-1 uppercase tracking-wider mb-2">
                    {getRankName(level)}
                  </Badge>
                  <h3 className="text-2xl font-serif font-black">{isRTL ? "معدل تقدّم نقاط الخبرة" : "XP Level Progress"}</h3>
                  <p className="text-stone-400 text-xs mt-1 font-semibold">
                    {isRTL 
                      ? `أنت بحاجة إلى ${xpNeededForNextLevel} نقطة إضافية للوصول إلى المستوى ${level + 1}`
                      : `You need ${xpNeededForNextLevel} more XP to level up to Level ${level + 1}`}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold font-mono">
                    <span className="text-teal-300">{totalXP.toLocaleString(isRTL ? 'ar-EG' : 'en-US')} XP</span>
                    <span className="text-stone-400">{((level) * 500).toLocaleString(isRTL ? 'ar-EG' : 'en-US')} XP</span>
                  </div>
                  <Progress value={progressPercent} className="h-3.5 bg-stone-850 rounded-full [&>div]:bg-gradient-to-r [&>div]:from-emerald-400 [&>div]:to-teal-500" />
                  <div className="text-right text-[10px] font-black tracking-widest uppercase text-stone-400">
                    {isRTL ? `${progressPercent}% من الترقية` : `${progressPercent}% Completed`}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* XP Breakdown Cards */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest px-1">
              {isRTL ? "تفصيل نقاط الخبرة المكتسبة" : "XP Points Breakdown"}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {xpBreakdown.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <Card key={idx} className="p-5 bg-white border-none shadow-sm rounded-3xl flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className={`h-11 w-11 rounded-xl ${item.color} flex items-center justify-center shrink-0`}>
                      <Icon size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-stone-400 leading-none">{item.title}</p>
                      <p className="text-lg font-black text-stone-900 mt-1.5 num-en">+{item.value.toLocaleString(isRTL ? 'ar-EG' : 'en-US')} XP</p>
                      {item.description && (
                        <p className="text-[9px] text-stone-400 mt-1 font-semibold">{item.description}</p>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Leaderboard Card */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-6 md:p-8 bg-white border-none shadow-sm rounded-[36px] flex flex-col h-full">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shadow-md">
                <Trophy size={20} />
              </div>
              <div>
                <h4 className="font-serif font-black text-stone-900 text-lg">{isRTL ? "لوحة صدارة الصف الدراسي" : "Classroom Leaderboard"}</h4>
                <p className="text-stone-400 text-xs font-semibold mt-0.5">{isRTL ? `ترتيب الطلاب في الصف ${student.grade || ""}` : `Student rankings in Grade ${student.grade || ""}`}</p>
              </div>
            </div>

            {/* List */}
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[450px] pr-1 scrollbar-hide">
              {leaderboard.length === 0 ? (
                <div className="text-center py-12 text-stone-400">
                  <Star size={32} className="mx-auto mb-2 opacity-20" />
                  <p className="text-xs font-bold">{isRTL ? "لا يوجد طلاب آخرين لعرضهم" : "No students found"}</p>
                </div>
              ) : (
                leaderboard.map((item, idx) => {
                  const rank = idx + 1;
                  const isTop3 = rank <= 3;
                  const rankStyles = 
                    rank === 1 ? "bg-amber-100 text-amber-700 font-black" :
                    rank === 2 ? "bg-stone-200 text-stone-700 font-bold" :
                    rank === 3 ? "bg-orange-100 text-orange-750 font-bold" :
                    "bg-stone-50 text-stone-400 font-medium";

                  return (
                    <div 
                      key={item.id} 
                      className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                        item.isMe 
                          ? "bg-teal-50 border-teal-200 shadow-sm shadow-teal-50" 
                          : "bg-stone-50/50 border-stone-100"
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Rank Circle */}
                        <div className={`h-8 w-8 rounded-xl flex items-center justify-center text-xs shrink-0 ${rankStyles}`}>
                          {isTop3 ? (rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉") : rank}
                        </div>
                        <div className="min-w-0">
                          <h5 className={`text-sm leading-tight truncate ${item.isMe ? "font-serif font-black text-teal-800" : "font-bold text-stone-850"}`}>
                            {item.name}
                            {item.isMe && (
                              <span className="mx-1.5 text-[9px] bg-teal-100 text-teal-700 border-none font-bold rounded px-1.5 py-0.5 uppercase tracking-wider">
                                {isRTL ? "أنت" : "You"}
                              </span>
                            )}
                          </h5>
                          <p className="text-[10px] text-stone-400 mt-0.5 num-en">#{item.student_id || "STU"}</p>
                        </div>
                      </div>

                      <div className="text-end">
                        <Badge className={`${item.isMe ? "bg-teal-600 text-white" : "bg-stone-100 text-stone-600"} border-none font-black text-[10px] px-2 py-0.5 rounded-lg num-en`}>
                          {item.xp.toLocaleString(isRTL ? 'ar-EG' : 'en-US')} XP
                        </Badge>
                        <p className="text-[9px] text-stone-400 mt-1 uppercase font-bold tracking-wider">
                          {isRTL ? `المستوى ${Math.floor(item.xp / 500) + 1}` : `Level ${Math.floor(item.xp / 500) + 1}`}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
