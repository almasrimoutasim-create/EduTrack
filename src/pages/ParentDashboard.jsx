import React from "react";
import { useQuery } from "@tanstack/react-query";
import { entities } from "@/api/dbClient";
import { 
  Bell, 
  BookOpen, 
  CheckCircle2, 
  ShieldCheck,
  MessageSquare,
  Award,
  ChevronRight,
  Heart,
  Plus,
  Bus,
  CreditCard
} from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import PageHeader from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all border-2 border-stone-200 bg-white text-stone-800 hover:bg-stone-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const btnPrimary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all bg-stone-900 text-white hover:bg-black cursor-pointer shadow-lg shadow-stone-200 disabled:opacity-50 disabled:cursor-not-allowed";

export default function ParentDashboard() {
  const { language } = useLanguage();
  const isRTL = language === "ar";

  const { data: children = [] } = useQuery({ 
    queryKey: ["parent-children"], 
    queryFn: () => entities.Student.list() 
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  return (
    <div className="space-y-10 pb-24" dir={isRTL ? "rtl" : "ltr"}>
      <PageHeader 
        title={isRTL ? "لوحة تحكم ولي الأمر" : "Parent Dashboard"} 
        subtitle={isRTL ? "مرحباً بك مجدداً. إليك ملخص لأداء أطفالك اليوم." : "Welcome back. Here's a summary of your children's performance today."}
      >
        <div className="flex gap-3">
          <button className={`${btnOutline} rounded-full h-12 px-6`}>
            <MessageSquare size={18} />
            {isRTL ? "تواصل مع المدرسة" : "Contact School"}
          </button>
          <button className={`${btnPrimary} rounded-full h-12 px-6`}>
            <Bell size={18} />
            {isRTL ? "الإشعارات (٣)" : "Notifications (3)"}
          </button>
        </div>
      </PageHeader>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: isRTL ? "الرسوم الدراسية" : "Fees Status", value: isRTL ? "تم السداد" : "Paid", icon: CreditCard, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: isRTL ? "الكتب المستعارة" : "Books Borrowed", value: "٢", icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50" },
          { label: isRTL ? "الحضور اليوم" : "Attendance", value: "١٠٠٪", icon: CheckCircle2, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: isRTL ? "نقاط التميز" : "Honor Points", value: "+١٥٠", icon: Award, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((stat, i) => (
          <Card key={i} className="p-6 border-none shadow-sm bg-white rounded-[32px] flex items-center gap-4 group cursor-pointer hover:shadow-md transition-all">
            <div className={`h-12 w-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest">{stat.label}</p>
              <h4 className="text-lg font-black text-stone-900">{stat.value}</h4>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main Section - Children Cards */}
        <section className="lg:col-span-8 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-serif font-bold text-stone-900">{isRTL ? "أطفالي" : "My Children"}</h3>
            <button className="text-stone-400 font-bold text-xs hover:text-stone-900 cursor-pointer">
              {isRTL ? "عرض الكل" : "View All"}
            </button>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            {children.slice(0, 2).map((child, i) => (
              <motion.div
                key={child.id}
                variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
                whileHover={{ y: -10 }}
                className="group"
              >
                <Card className="p-8 border-none shadow-sm hover:shadow-2xl transition-all duration-500 rounded-[48px] bg-white relative overflow-hidden">
                  <div className="flex items-center gap-6 mb-8">
                    <div className="h-20 w-20 rounded-3xl bg-stone-100 flex items-center justify-center font-black text-stone-400 text-2xl group-hover:bg-primary group-hover:text-white transition-all">
                      {(child.full_name || child.name)?.[0]}
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-stone-900">{child.full_name || child.name}</h4>
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">
                        {child.grade} · {child.id}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-2 text-[10px] font-black uppercase tracking-widest text-stone-400">
                        <span>{isRTL ? "التقدم الدراسي" : "Academic Progress"}</span>
                        <span className="text-stone-900"> 88٪</span>
                      </div>
                      <Progress value={88} className="h-1.5 bg-stone-50" />
                    </div>

                    <div className="flex gap-2">
                      <Badge className="bg-emerald-50 text-emerald-600 border-none rounded-lg text-[8px] font-black px-2 py-1 gap-1">
                        <Bus size={10} />
                        {isRTL ? "في الحافلة" : "On Bus"}
                      </Badge>
                      <Badge className="bg-amber-50 text-amber-600 border-none rounded-lg text-[8px] font-black px-2 py-1 gap-1">
                        <Award size={10} />
                        {isRTL ? "متفوق" : "Star Student"}
                      </Badge>
                    </div>
                  </div>

                  <button className="w-full mt-8 bg-stone-50 hover:bg-stone-100 text-stone-900 rounded-2xl h-12 font-bold transition-all border-none cursor-pointer group-hover:bg-stone-900 group-hover:text-white">
                    {isRTL ? "عرض الملف الدراسي" : "View Reports"}
                  </button>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Upcoming Events */}
          <div className="space-y-6">
            <h3 className="text-2xl font-serif font-bold text-stone-900">{isRTL ? "الفعاليات القادمة" : "Upcoming Events"}</h3>
            <div className="space-y-4">
              {[
                { title: isRTL ? "يوم الآباء والمعلمين" : "Parent-Teacher Meeting", date: "١٥ مايو", time: "٠٩:٠٠ ص", type: "Meeting" },
                { title: isRTL ? "معرض العلوم السنوي" : "Annual Science Fair", date: "١٨ مايو", time: "١٠:٣٠ ص", type: "Event" },
              ].map((event, i) => (
                <Card key={i} className="p-6 border-none shadow-sm bg-white rounded-[32px] flex items-center justify-between group hover:shadow-md transition-all">
                  <div className="flex items-center gap-6">
                    <div className="h-14 w-14 rounded-2xl bg-stone-50 flex flex-col items-center justify-center text-stone-400">
                      <span className="text-[10px] font-black uppercase">{event.date.split(' ')[1]}</span>
                      <span className="text-xl font-black text-stone-900">{event.date.split(' ')[0]}</span>
                    </div>
                    <div>
                      <h5 className="font-bold text-stone-800 leading-tight">{event.title}</h5>
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">{event.time} · {event.type}</p>
                    </div>
                  </div>
                  <button className={`${btnOutline} rounded-full gap-1 text-xs`}>
                    <ChevronRight size={14} className={isRTL ? "rotate-180" : ""} />
                    {t("common.details", language) || "تفاصيل"}
                  </button>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Sidebar - Quick Actions & Performance */}
        <aside className="lg:col-span-4 space-y-10">
          <Card className="p-8 border-none shadow-sm bg-indigo-900 text-white rounded-[48px] relative overflow-hidden">
            <div className="relative z-10">
              <h4 className="text-xl font-serif font-bold mb-8">{isRTL ? "إحصائيات الأسرة" : "Family Insights"}</h4>
              <div className="space-y-8">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">{isRTL ? "معدل الحضور التراكمي" : "Family Attendance"}</span>
                    <span className="text-lg font-black text-white"> 96٪</span>
                  </div>
                  <Progress value={96} className="h-1.5 bg-white/10" />
                </div>
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-3">
                    <ShieldCheck size={20} className="text-emerald-400" />
                    <span className="text-xs font-bold">{isRTL ? "جميع البيانات مؤمنة" : "Data Secure"}</span>
                  </div>
                  <Badge className="bg-emerald-500 text-white border-none text-[8px] font-black">SSL</Badge>
                </div>
              </div>
              <button className="w-full mt-10 bg-white text-stone-900 hover:bg-stone-100 rounded-2xl h-12 font-bold shadow-xl cursor-pointer">
                {isRTL ? "عرض التقرير السنوي" : "View Annual Report"}
              </button>
            </div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
          </Card>

          <Card className="p-8 border-none shadow-sm bg-white rounded-[48px]">
            <h4 className="font-bold text-stone-900 mb-8">{isRTL ? "تواصل سريع" : "Quick Contact"}</h4>
            <div className="space-y-6">
              {[
                { name: isRTL ? "مكتب المدير" : "Admin Office", icon: ShieldCheck },
                { name: isRTL ? "قسم الشؤون المالية" : "Finance Dept", icon: CreditCard },
                { name: isRTL ? "الممرضة المدرسية" : "School Nurse", icon: Heart },
              ].map((contact, i) => (
                <div key={i} className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-stone-50 flex items-center justify-center text-stone-400 group-hover:bg-primary group-hover:text-white transition-all">
                      <contact.icon size={20} />
                    </div>
                    <span className="text-sm font-bold text-stone-800 group-hover:text-primary transition-colors">{contact.name}</span>
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