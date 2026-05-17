import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { 
  Plus, 
  Calendar, 
  CreditCard, 
  ShieldCheck,
  FileText,
  Clock,
  LogOut,
  Settings,
  Mail,
  Smartphone
} from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import PageHeader from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StaffSidebar from "@/components/layout/StaffSidebar";

const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all border-2 border-stone-300 bg-white text-stone-800 hover:bg-stone-50 hover:border-stone-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const btnPrimary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all bg-stone-900 text-white hover:bg-black cursor-pointer shadow-lg shadow-stone-200 disabled:opacity-50 disabled:cursor-not-allowed";

export default function StaffPortal() {
  const { language } = useLanguage();
  const isRTL = language === "ar";

  const { data: staffList = [] } = useQuery({ 
    queryKey: ["staff-portal-data"], 
    queryFn: () => base44.entities.StaffMember.list() 
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  return (
    <div className={`min-h-screen bg-stone-50 text-stone-900 ${isRTL ? 'font-cairo' : 'font-sans'}`} dir={isRTL ? "rtl" : "ltr"}>
      <StaffSidebar />
      <main className={`transition-all duration-300 min-h-screen pt-16 lg:pt-0 ${isRTL ? "lg:mr-64" : "lg:ml-64"}`}>
        <div className="p-6 md:p-10 lg:p-12 max-w-7xl mx-auto space-y-10 pb-24">
          <PageHeader 
        title={isRTL ? "بوابة الموظفين" : "Staff Portal"} 
        subtitle={isRTL ? "منصتك المتكاملة لإدارة مهامك المهنية والتواصل مع الزملاء" : "Your integrated platform for professional tasks and colleague communication"}
      >
        <div className="flex gap-3">
          <button className={`${btnOutline} rounded-full h-12 px-6`}>
            <Mail size={18} />
            {isRTL ? "البريد" : "Inbox"}
          </button>
          <button className={`${btnPrimary} rounded-full h-12 px-6`}>
            <Plus size={18} />
            {isRTL ? "طلب إجازة" : "Request Leave"}
          </button>
        </div>
      </PageHeader>

      {/* Staff Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: isRTL ? "رصيد الإجازات" : "Leave Balance", value: "١٨ يوماً", icon: Calendar, color: "text-blue-600", bg: "bg-blue-50" },
          { label: isRTL ? "ساعات العمل" : "Work Hours", value: "١٦٠/١٧٠", icon: Clock, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: isRTL ? "كشف الراتب" : "Next Payslip", value: "٢٨ مايو", icon: CreditCard, color: "text-amber-600", bg: "bg-amber-50" },
          { label: isRTL ? "الطلبات المعلقة" : "Pending Req", value: "٣", icon: FileText, color: "text-rose-600", bg: "bg-rose-50" },
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
        {/* Main Content - Feed & News */}
        <section className="lg:col-span-8 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-serif font-bold text-stone-900">{isRTL ? "أخبار المؤسسة" : "Campus News"}</h3>
            <div className="flex gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{isRTL ? "تحديثات مباشرة" : "Live Updates"}</p>
            </div>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {[
              { title: isRTL ? "تحديث نظام الأمن السيبراني" : "Cybersecurity System Update", content: isRTL ? "يرجى العلم بأنه سيتم تحديث أنظمة الدخول يوم الجمعة القادم..." : "Please note that access systems will be updated next Friday...", date: isRTL ? "منذ ساعة" : "1h ago", category: "IT" },
              { title: isRTL ? "دعوة لحضور الحفل الختامي" : "Invitation to Closing Ceremony", content: isRTL ? "نتشرف بدعوتكم لحضور الحفل الختامي للعام الدراسي الحالي..." : "We are honored to invite you to the closing ceremony...", date: isRTL ? "منذ ٤ ساعات" : "4h ago", category: "Events" },
            ].map((news, i) => (
              <motion.div
                key={i}
                variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
              >
                <Card className="p-8 border-none shadow-sm hover:shadow-xl transition-all duration-500 rounded-[40px] bg-white group cursor-pointer relative overflow-hidden">
                  <div className="flex justify-between items-start mb-4">
                    <Badge className="bg-stone-50 text-stone-400 border-none rounded-lg text-[8px] font-black px-2 py-0.5 uppercase tracking-widest group-hover:bg-primary group-hover:text-white transition-colors">
                      {news.category}
                    </Badge>
                    <span className="text-[10px] font-bold text-stone-300 uppercase tracking-widest">{news.date}</span>
                  </div>
                  <h4 className="text-xl font-black text-stone-900 mb-2 group-hover:text-primary transition-colors leading-tight">{news.title}</h4>
                  <p className="text-stone-500 text-sm leading-relaxed mb-6">{news.content}</p>
                  <div className="flex items-center justify-between pt-6 border-t border-stone-50">
                    <div className="flex -space-x-2 rtl:space-x-reverse">
                      {[1,2,3].map(i => (
                        <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-stone-100" />
                      ))}
                    </div>
                    <button className="text-stone-400 font-bold text-xs group-hover:text-stone-900 cursor-pointer hover:underline">
                      {isRTL ? "قراءة المزيد" : "Read More"}
                    </button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Sidebar - Quick Directory & Profile */}
        <aside className="lg:col-span-4 space-y-10">
          <Card className="p-8 border-none shadow-sm bg-gradient-to-br from-stone-900 to-stone-800 text-white rounded-[48px] relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-10">
                <div className="h-16 w-16 rounded-[24px] bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center font-black text-2xl">
                  {(staffList[0]?.full_name || staffList[0]?.name)?.[0] || 'M'}
                </div>
                <div>
                  <h4 className="text-xl font-black">{staffList[0]?.full_name || staffList[0]?.name || (isRTL ? "محمد علي" : "Mohamed Ali")}</h4>
                  <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest mt-1">
                    {staffList[0]?.role || (isRTL ? "مدير إداري" : "Admin Manager")}
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                {[
                  { label: isRTL ? "الإعدادات" : "Settings", icon: Settings },
                  { label: isRTL ? "تغيير المرور" : "Security", icon: ShieldCheck },
                  { label: isRTL ? "خروج" : "Logout", icon: LogOut, color: "text-rose-400" },
                ].map((item, i) => (
                  <button key={i} className={`w-full justify-start h-12 rounded-2xl gap-4 px-4 hover:bg-white/5 border-none font-bold cursor-pointer text-start flex items-center ${item.color || 'text-white'}`}>
                    <item.icon size={18} />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
          </Card>

          <Card className="p-8 border-none shadow-sm bg-white rounded-[48px]">
            <h4 className="font-bold text-stone-900 mb-8">{isRTL ? "دليل الزملاء" : "Colleague Directory"}</h4>
            <div className="space-y-6">
              {staffList.slice(0, 3).map((staff, i) => (
                <div key={i} className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-stone-50 flex items-center justify-center font-black text-stone-400 group-hover:bg-primary group-hover:text-white transition-all">
                      {(staff.full_name || staff.name)?.[0]}
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-stone-800 leading-tight group-hover:text-primary transition-colors">{staff.full_name || staff.name}</h5>
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">{staff.role}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className={`${btnOutline} rounded-xl gap-1 text-xs`}>
                      <Smartphone size={14} />
                      {t("common.call", language) || "اتصال"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-8 bg-stone-50 hover:bg-stone-100 text-stone-400 hover:text-stone-900 rounded-2xl h-12 font-bold transition-all cursor-pointer">
              {isRTL ? "البحث في الدليل" : "Search Directory"}
            </button>
          </Card>
        </aside>
        </div>
        </div>
      </main>
    </div>
  );
}