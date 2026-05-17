import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Trophy, Zap, Medal } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/translations";

const RANK_STYLES = [
  { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", icon: "🥇" },
  { bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-600", icon: "🥈" },
  { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", icon: "🥉" },
];

export default function LeaderboardWidget() {
  const { language } = useLanguage();
  const isRTL = language === "ar";

  const { data: awards = [] } = useQuery({
    queryKey: ["all-awards-leaderboard"],
    queryFn: () => base44.entities.StudentAward.list(),
  });

  const { data: posts = [] } = useQuery({
    queryKey: ["all-posts-leaderboard"],
    queryFn: () => base44.entities.ActivityPost.list(),
  });

  const { data: students = [] } = useQuery({
    queryKey: ["students-leaderboard"],
    queryFn: () => base44.entities.Student.filter({ status: "active" }),
  });

  const scoreMap = {};
  const awardCountMap = {};

  awards.forEach(a => {
    if (!scoreMap[a.student_id]) { scoreMap[a.student_id] = 0; awardCountMap[a.student_id] = 0; }
    scoreMap[a.student_id] += 3;
    awardCountMap[a.student_id] += 1;
  });

  posts.forEach(p => {
    if (p.author_id && p.author_id !== "teacher") {
      if (!scoreMap[p.author_id]) scoreMap[p.author_id] = 0;
      scoreMap[p.author_id] += 1;
    }
  });

  const leaderboard = students
    .map(s => ({
      ...s,
      score: scoreMap[s.id] || 0,
      awardCount: awardCountMap[s.id] || 0,
    }))
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  return (
    <Card className="p-8 border-none bg-white/50 backdrop-blur-xl shadow-sm hover:shadow-lg transition-all duration-500">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
          <Trophy className="h-6 w-6 text-amber-600" />
        </div>
        <div>
          <h3 className="font-bold text-lg">{isRTL ? "لوحة الشرف" : "Leaderboard"}</h3>
          <p className="text-sm text-muted-foreground">{isRTL ? "بناءً على الأوسمة والنشاط" : "Based on awards & activity"}</p>
        </div>
      </div>

      {leaderboard.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
          <Trophy size={48} className="opacity-10 mb-4" />
          <p>{t("common.noRecords", language)}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((student, idx) => {
            const style = RANK_STYLES[idx] || { bg: "bg-stone-50", border: "border-transparent", text: "text-stone-500", icon: `#${idx + 1}` };
            return (
              <div key={student.id} className={`flex items-center gap-4 p-3 rounded-2xl border ${style.bg} ${style.border} hover:bg-white transition-colors group`}>
                <span className="text-xl w-8 text-center shrink-0">{style.icon}</span>
                {student.photo_url
                  ? <img src={student.photo_url} className="h-10 w-10 rounded-full object-cover shrink-0 ring-2 ring-white" alt="" />
                  : <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center font-black text-stone-400 text-sm shrink-0 shadow-sm">{student.full_name[0]}</div>}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-stone-900 truncate">{student.full_name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {student.awardCount > 0 && (
                      <span className="flex items-center gap-1 text-[11px] text-amber-600 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full">
                        <Medal className="h-3 w-3" /> {student.awardCount}
                      </span>
                    )}
                    <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest">{isRTL ? "الصف" : "Grade"} {student.grade}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 bg-white px-3 py-1.5 rounded-xl shadow-sm group-hover:scale-105 transition-transform">
                  <Zap className="h-4 w-4 text-amber-500" />
                  <span className={`text-base font-black ${style.text}`}>{student.score}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 p-4 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-center gap-4 text-xs font-semibold text-stone-500">
        <span className="flex items-center gap-1.5"><Medal className="h-3.5 w-3.5 text-amber-500" /> = 3 {isRTL ? "نقاط" : "pts"}</span>
        <span className="w-1 h-1 rounded-full bg-stone-300" />
        <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-amber-500" /> = 1 {isRTL ? "نقطة" : "pt"}</span>
      </div>
    </Card>
  );
}