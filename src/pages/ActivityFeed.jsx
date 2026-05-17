import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { 
  Bell, 
  MessageCircle, 
  UserPlus, 
  FileText, 
  Award, 
  CheckCircle2, 
  Clock, 
  Filter, 
  MoreVertical,
  Plus,
  Zap,
  Star
} from "lucide-react"; // Fixed icon library name in thought, but using lucide-react
import { 
  Activity,
  TrendingUp,
  Share2,
  Bookmark
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useLanguage } from "@/lib/LanguageContext";
import PageHeader from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all border-2 border-stone-200 bg-white text-stone-800 hover:bg-stone-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const btnPrimary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all bg-stone-900 text-white hover:bg-black cursor-pointer shadow-lg shadow-stone-200 disabled:opacity-50 disabled:cursor-not-allowed";

export default function ActivityFeed() {
  const { language } = useLanguage();
  const isRTL = language === "ar";

  const { data: activities = [], isLoading } = useQuery({ 
    queryKey: ["all-activity"], 
    // @ts-ignore
    queryFn: () => base44.entities.ActivityPost.list("-created_at", {}, 50) 
  });

  const getActivityIcon = (type) => {
    switch(type) {
      case 'AWARD': return { icon: Award, color: "text-amber-500", bg: "bg-amber-50" };
      case 'ATTENDANCE': return { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" };
      case 'MESSAGE': return { icon: MessageCircle, color: "text-blue-500", bg: "bg-blue-50" };
      case 'MATERIAL': return { icon: FileText, color: "text-purple-500", bg: "bg-purple-50" };
      case 'ENROLLMENT': return { icon: UserPlus, color: "text-indigo-500", bg: "bg-indigo-50" };
      default: return { icon: Bell, color: "text-stone-500", bg: "bg-stone-50" };
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  return (
    <div className="space-y-10 pb-24" dir={isRTL ? "rtl" : "ltr"}>
      <PageHeader 
        title={isRTL ? "خلاصة الأنشطة" : "Activity Feed"} 
        subtitle={isRTL ? "تابع آخر التحديثات والفعاليات في مجتمعك التعليمي" : "Follow the latest updates and events in your learning community"}
      >
        <div className="flex gap-3">
          <button className={`${btnOutline} rounded-full h-12 px-6`}>
            <Filter size={18} />
            {isRTL ? "تصفية النوع" : "Filter Type"}
          </button>
          <button className={`${btnPrimary} rounded-full h-12 px-6`}>
            <Activity size={18} />
            {isRTL ? "الإحصائيات" : "Insights"}
          </button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main Feed */}
        <section className="lg:col-span-8 space-y-8">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-2xl font-serif font-bold text-stone-900">{isRTL ? "أحدث الأخبار" : "Latest Updates"}</h3>
            <div className="flex items-center gap-4">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{isRTL ? "مباشر" : "Live Feed"}</p>
            </div>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8 relative"
          >
            {/* Timeline Line */}
            <div className={`absolute top-0 bottom-0 ${isRTL ? 'right-10' : 'left-10'} w-px bg-stone-100 hidden md:block`} />

            {isLoading ? (
              [1,2,3,4].map(i => (
                <div key={i} className="h-48 bg-stone-50 animate-pulse rounded-[40px]" />
              ))
            ) : activities.map((activity, i) => {
              const style = getActivityIcon(activity.type);
              return (
                <motion.div
                  key={activity.id}
                  variants={{ hidden: { x: isRTL ? 20 : -20, opacity: 0 }, visible: { x: 0, opacity: 1 } }}
                  className="relative group"
                >
                  <div className="flex flex-col md:flex-row gap-8">
                    {/* Activity Icon Column */}
                    <div className={`hidden md:flex flex-col items-center z-10`}>
                      <div className={`h-20 w-20 rounded-[28px] ${style.bg} border-4 border-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-500`}>
                        <style.icon size={32} className={style.color} />
                      </div>
                    </div>

                    {/* Activity Content Card */}
                    <Card className="flex-1 p-8 border-none shadow-sm hover:shadow-2xl transition-all duration-500 rounded-[48px] bg-white group cursor-pointer overflow-hidden relative">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={`${style.bg} ${style.color} border-none rounded-lg text-[9px] font-black px-2 py-0.5 uppercase tracking-widest`}>
                              {activity.type || 'Update'}
                            </Badge>
                            <span className="text-stone-300">·</span>
                            <span className="text-xs font-bold text-stone-400 flex items-center gap-1">
                              <Clock size={12} />
                              {activity.date ? format(new Date(activity.date), "HH:mm") : "10:30 AM"}
                            </span>
                          </div>
                          <h4 className="text-xl font-serif font-black text-stone-900 group-hover:text-primary transition-colors leading-tight">
                            {activity.title || (isRTL ? "تحديث جديد في النظام" : "New System Update")}
                          </h4>
                        </div>
                        <button className={`${btnOutline} rounded-xl gap-1 text-xs h-8 px-3`}>
                          <MoreVertical size={14} />
                          {t("common.actions", language)}
                        </button>
                      </div>

                      <p className="text-stone-500 leading-relaxed mb-8 text-sm">
                        {activity.content || (isRTL ? "تمت إضافة تفاصيل جديدة لهذا النشاط في سجلات النظام. انقر لعرض التفاصيل الكاملة." : "New details have been added for this activity in system logs. Click to view full details.")}
                      </p>

                      <div className="flex items-center justify-between pt-6 border-t border-stone-50">
                        <div className="flex items-center gap-4">
                          <div className="flex -space-x-2 rtl:space-x-reverse">
                            {[1,2,3].map(i => (
                              <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-stone-100" />
                            ))}
                          </div>
                          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "مشاهدة من قبل ١٢ شخصاً" : "Viewed by 12 people"}</p>
                        </div>
                        <div className="flex gap-2">
                          <button className={`${btnOutline} rounded-full gap-1 text-xs h-8 px-3`}>
                            <Share2 size={14} />
                            {t("common.share", language)}
                          </button>
                          <button className={`${btnOutline} rounded-full gap-1 text-xs h-8 px-3 border-rose-200 hover:bg-rose-50 hover:text-rose-600`}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                            {t("common.like", language) || "إعجاب"}
                          </button>
                          <button className="h-10 w-10 rounded-full text-stone-400 hover:text-rose-500 hover:bg-rose-50 cursor-pointer flex items-center justify-center">
                            <Bookmark size={16} />
                          </button>
                        </div>
                      </div>
                    </Card>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </section>

        {/* Sidebar - Trends & Recommendations */}
        <aside className="lg:col-span-4 space-y-10">
          <Card className="p-8 border-none shadow-sm bg-stone-900 text-white rounded-[48px] relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <h4 className="font-bold text-stone-100">{isRTL ? "إحصائيات التفاعل" : "Engagement Trends"}</h4>
                <TrendingUp size={20} className="text-emerald-400" />
              </div>
              
              <div className="space-y-8">
                {[
                  { label: isRTL ? "معدل الحضور" : "Attendance Rate", value: "٩٢٪", icon: Zap, color: "text-amber-400" },
                  { label: isRTL ? "التعاون الطلابي" : "Student Collab", value: "٨٥٪", icon: Star, color: "text-blue-400" },
                  { label: isRTL ? "تسليم الواجبات" : "Homework Submit", value: "٧٨٪", icon: Award, color: "text-rose-400" },
                ].map((stat, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <stat.icon size={20} className={stat.color} />
                      <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">{stat.label}</span>
                    </div>
                    <span className="text-lg font-black">{stat.value}</span>
                  </div>
                ))}
              </div>
              
              <button className="w-full mt-10 bg-white/10 hover:bg-white/20 text-white rounded-2xl h-12 font-bold border border-white/10 transition-all cursor-pointer">
                {isRTL ? "عرض تقرير التفاعل" : "View Insights Report"}
              </button>
            </div>
          </Card>

          <Card className="p-8 border-none shadow-sm bg-white rounded-[48px]">
            <h4 className="font-bold text-stone-900 mb-8">{isRTL ? "أشخاص قد تعرفهم" : "People You May Know"}</h4>
            <div className="space-y-6">
              {[
                { name: "أ. ليلى حسن", role: "معلمة لغة عربية", icon: "LH" },
                { name: "د. سامي يوسف", role: "مدير الأكاديمية", icon: "SY" },
                { name: "م. خالد فهد", role: "مشرف تقني", icon: "KF" },
              ].map((person, i) => (
                <div key={i} className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-stone-100 flex items-center justify-center font-black text-stone-400 group-hover:bg-primary group-hover:text-white transition-all">
                      {person.icon}
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-stone-800 leading-tight group-hover:text-primary transition-colors">{person.name}</h5>
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">{person.role}</p>
                    </div>
                  </div>
                  <button className="rounded-xl cursor-pointer flex items-center justify-center text-stone-400 hover:text-primary hover:bg-primary/5 w-10 h-10">
                    <Plus size={18} />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}