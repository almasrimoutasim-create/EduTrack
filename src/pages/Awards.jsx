import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { entities } from "@/api/dbClient";
import { 
  Award, 
  Trophy, 
  Star, 
  Sparkles, 
  Medal, 
  Search, 
  Filter, 
  Plus, 
  Users,
  Zap,
  Target,
  History,
  Download,
  Share2
} from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/translations";
import PageHeader from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import AwardFormDialog from "@/components/shared/AwardFormDialog";
import { toast } from "sonner";

const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all border-2 border-stone-300 bg-white text-stone-800 hover:bg-stone-50 hover:border-stone-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const btnPrimary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed";

export default function Awards() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAward, setSelectedAward] = useState(null);

  const { data: awards = [], isLoading } = useQuery({ 
    queryKey: ["awards-list"], 
    queryFn: () => entities.StudentAward.list("-date", 20) 
  });

  // ── Dynamic stats derived strictly from DB — zero if no data ──
  const totalAwards = awards.length;
  const starStudents = new Set(awards.map(a => a.student_id || a.student_name).filter(Boolean)).size;
  const newBadges = awards.filter(a => {
    const d = a.awarded_date || a.date || a.created_at;
    if (!d) return false;
    const t = new Date(d).getTime();
    if (isNaN(t)) return false;
    return Date.now() - t < 30 * 24 * 60 * 60 * 1000;
  }).length;
  const impactPoints = awards.length * 10;
  const studentOfMonth = (() => {
    if (!awards.length) return null;
    const counts = {};
    awards.forEach(a => { const k = a.student_name || a.student_id; if (k) counts[k] = (counts[k] || 0) + 1; });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    if (!top) return null;
    const award = awards.find(a => (a.student_name || a.student_id) === top[0]);
    return { name: top[0], count: top[1], award };
  })();

  const handleAdd = () => {
    setSelectedAward(null);
    setDialogOpen(true);
  };

  const handleDelete = async (award) => {
    try {
      await entities.StudentAward.delete(award.id);
      toast.success(isRTL ? "تم حذف الجائزة" : "Award deleted");
    } catch (err) {
      toast.error(isRTL ? "فشل الحذف" : "Failed to delete");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  return (
    <div className="space-y-6 pb-20" dir={isRTL ? "rtl" : "ltr"}>
      <PageHeader 
        title={isRTL ? "لوحة التميز والجوائز" : "Awards & Excellence Hall"} 
        subtitle={isRTL ? "الاحتفاء بإنجازات طلابنا وتكريم المتميزين في مجتمعنا" : "Celebrating our students' achievements and honoring excellence"}
      >
        <div className="flex gap-3">
          <button className={`${btnOutline} h-11 px-5`}>
            <History size={18} />
            <span>{isRTL ? "سجل التكريم" : "Honor Roll"}</span>
          </button>
          <button onClick={handleAdd} className={`${btnPrimary} h-11 px-5 bg-secondary text-primary`}>
            <Plus size={18} />
            <span>{isRTL ? "منح جائزة" : "Grant Award"}</span>
          </button>
        </div>
      </PageHeader>

      {/* Honor Overview Stats — dynamic from StudentAward table, 0 if empty */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: isRTL ? "إجمالي الجوائز" : "Total Awards", value: totalAwards, icon: Trophy, color: "text-amber-500", bg: "bg-amber-50" },
          { label: isRTL ? "طلاب متميزون" : "Star Students", value: starStudents, icon: Star, color: "text-blue-500", bg: "bg-blue-50" },
          { label: isRTL ? "أوسمة جديدة" : "New Badges", value: newBadges, icon: Medal, color: "text-emerald-500", bg: "bg-emerald-50" },
          { label: isRTL ? "نقاط التحفيز" : "Impact Points", value: impactPoints, icon: Zap, color: "text-rose-500", bg: "bg-rose-50" },
        ].map((stat, i) => (
          <Card key={i} className="p-6 border shadow-sm bg-white rounded-xl flex flex-col justify-between group cursor-pointer hover:shadow-md transition-all">
            <div className={`h-12 w-12 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-stone-400 text-[10px] font-semibold uppercase tracking-wide mb-0.5">{stat.label}</p>
              <h4 className="text-2xl font-bold text-stone-900 num-en">{stat.value}</h4>
            </div>
          </Card>
        ))}
      </div>

      {/* Featured Hall of Fame Card */}
      <section>
        <Card className="p-10 bg-primary text-white rounded-2xl shadow-xl relative overflow-hidden">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <Badge className="bg-secondary text-primary border-none rounded-lg px-4 py-1.5 font-bold text-[10px] uppercase tracking-wide mb-5">
                {isRTL ? "طالب الشهر" : "Student of the Month"}
              </Badge>
              <h3 className="text-3xl font-bold mb-4 leading-tight">
                {isRTL ? "نحتفي بالتميز الأكاديمي والروح القيادية" : "Honoring Academic Excellence & Leadership"}
              </h3>
              <p className="text-white/60 text-base mb-8 max-w-lg leading-relaxed">
                {isRTL ? "يتم اختيار طالب الشهر بناءً على أدائه الأكاديمي المتميز، سلوكه الإيجابي، ومشاركته الفعالة في الأنشطة المدرسية." : "The Student of the Month is chosen based on outstanding academic performance, positive behavior, and active participation."}
              </p>
              <div className="flex gap-3">
                <button className="bg-white text-primary hover:bg-stone-100 rounded-xl h-11 px-8 font-bold shadow-lg">
                  {isRTL ? "عرض المرشحين" : "View Nominees"}
                </button>
                <button className={`${btnOutline} h-11 px-6 border-white/10 text-white hover:bg-white/10 hover:text-white`}>
                  <Target size={18} className="text-secondary" />
                  {isRTL ? "معايير الاختيار" : "Selection Criteria"}
                </button>
              </div>
            </div>
            
            <div className="relative flex justify-center">
              <div className="relative w-64 h-64">
                <div className="absolute inset-0 bg-secondary rounded-2xl rotate-6 opacity-20 blur-xl animate-pulse" />
                <div className="relative h-full w-full bg-white/5 rounded-2xl border border-white/10 overflow-hidden flex flex-col items-center justify-center p-8 text-center">
                  <div className="h-24 w-24 rounded-full bg-secondary flex items-center justify-center mb-5 shadow-xl shadow-secondary/20">
                    <Trophy size={48} className="text-primary" />
                  </div>
                  {studentOfMonth ? (
                    <>
                      <h4 className="text-xl font-bold mb-1">{studentOfMonth.name}</h4>
                      <p className="text-white/40 text-sm font-semibold">{isRTL ? `${studentOfMonth.count} جوائز · الأكثر تميزاً` : `${studentOfMonth.count} awards · Top achiever`}</p>
                    </>
                  ) : (
                    <>
                      <h4 className="text-xl font-bold mb-1">{isRTL ? "لا يوجد طالب مميز بعد" : "No featured student yet"}</h4>
                      <p className="text-white/40 text-sm font-semibold">{isRTL ? "سيظهر هنا الطالب الأكثر حصولاً على الجوائز" : "Top awarded student will appear here"}</p>
                    </>
                  )}
                </div>
              </div>
              <Sparkles className="absolute -top-8 -right-8 text-secondary" size={64} />
            </div>
          </div>
          
          <div className="absolute top-0 right-0 w-full h-full opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '28px 28px' }} />
        </Card>
      </section>

      {/* Awards Grid */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <h3 className="text-xl font-bold text-stone-900">{isRTL ? "قائمة التكريم" : "Honor List"}</h3>
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-stone-400`} size={16} />
              <Input placeholder={isRTL ? "بحث عن جائزة أو طالب..." : "Search award or student..."} className={`h-11 ${isRTL ? 'pr-10' : 'pl-10'} rounded-xl border-stone-200 bg-white shadow-sm`} dir={isRTL ? "rtl" : "ltr"} />
            </div>
            <button className={`${btnOutline} h-11 w-11 p-0`}><Filter size={18} /></button>
          </div>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {isLoading ? (
            [1,2,3,4,5,6].map(i => <div key={i} className="h-64 bg-stone-100 animate-pulse rounded-2xl" />)
          ) : awards.length === 0 ? (
            <div className="col-span-full py-16 text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center mb-4"><Trophy size={28} className="text-stone-300"/></div>
              <p className="text-stone-600 font-bold">{isRTL ? "لا توجد جوائز بعد" : "No awards yet"}</p>
              <p className="text-sm text-stone-400 mt-1">{isRTL ? "امنح أول جائزة عبر زر \"منح جائزة\" لتبدأ لوحة التميز" : "Grant the first award via \"Grant Award\" to populate the board"}</p>
            </div>
          ) : awards.slice(0,6).map((award, i) => {
            const palette = [
              { color: "text-blue-500", bg: "bg-blue-50" },
              { color: "text-purple-500", bg: "bg-purple-50" },
              { color: "text-emerald-500", bg: "bg-emerald-50" },
              { color: "text-amber-500", bg: "bg-amber-50" },
              { color: "text-rose-500", bg: "bg-rose-50" },
              { color: "text-indigo-500", bg: "bg-indigo-50" },
            ][i % 6];
            const displayDate = award.awarded_date || award.date || award.created_at;
            const dateLabel = displayDate ? new Date(displayDate).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' }) : "—";
            return (
            <motion.div
              key={i}
              variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
              whileHover={{ y: -6 }}
              className="group"
            >
              <Card className="p-6 border shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl bg-white relative overflow-hidden flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                  <div className={`h-14 w-14 rounded-xl ${palette.bg} ${palette.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Award size={28} />
                  </div>
                  <Badge className={`${palette.bg} ${palette.color} border-none rounded-lg text-[8px] font-bold px-2 py-0.5 uppercase tracking-wide`}>
                    {award.icon || award.color || "Award"}
                  </Badge>
                </div>

                <h4 className="text-xl font-bold text-stone-900 mb-1.5 group-hover:text-secondary transition-colors leading-tight">
                  {award.title || award.name || "—"}
                </h4>
                <div className="flex items-center gap-2 text-stone-400 mb-6">
                  <Users size={14} />
                  <span className="text-xs font-semibold">{award.student_name || award.student_id || "—"}</span>
                  <span className="text-stone-200">·</span>
                  <span className="text-xs font-semibold num-en">{dateLabel}</span>
                </div>

                <div className="mt-auto pt-6 border-t border-stone-100 flex gap-2">
                  <button className={`${btnOutline} h-9 px-3 text-xs`}>
                    <Share2 size={14} />
                    {t("common.share", language) || "مشاركة"}
                  </button>
                  <button className={`${btnOutline} h-9 px-3 text-xs`}>
                    <Download size={14} />
                    {t("common.download", language) || "تنزيل"}
                  </button>
                  <button className={`flex-1 ${btnPrimary.split(' ').filter(c => !c.includes('shadow')).join(' ')} h-11`}>
                    {isRTL ? "عرض الشهادة" : "View Certificate"}
                  </button>
                </div>
              </Card>
            </motion.div>
          );})}
        </motion.div>
      </section>
      <AwardFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} award={selectedAward} />
    </div>
  );
}
