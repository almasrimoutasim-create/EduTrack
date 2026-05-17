import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { 
  Bus, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  AlertTriangle,
  QrCode,
  Scan,
  RefreshCw,
  Users
} from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import PageHeader from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all border-2 border-stone-200 bg-white text-stone-800 hover:bg-stone-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const btnPrimary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer shadow-lg shadow-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed";

export default function BoardingStatus() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const [activeView, setActiveView] = useState("all");

  const { data: students = [], isLoading } = useQuery({ 
    queryKey: ["boarding-students"], 
    queryFn: () => base44.entities.Student.list("-created_date", 50) 
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  return (
    <div className="space-y-10 pb-24" dir={isRTL ? "rtl" : "ltr"}>
      <PageHeader 
        title={isRTL ? "حالة الصعود والتفتيش" : "Boarding & Inspection"} 
        subtitle={isRTL ? "متابعة فورية لصعود الطلاب للحافلات وتأمين سلامتهم" : "Real-time tracking of student boarding and safety checks"}
      >
        <div className="flex gap-3">
          <button className={`${btnOutline} rounded-full h-12 px-6`}>
            <Scan size={18} />
            {isRTL ? "مسح ضوئي" : "Quick Scan"}
          </button>
          <button className={`${btnPrimary} rounded-full h-12 px-6`}>
            <RefreshCw size={18} />
            {isRTL ? "تحديث الحالة" : "Refresh Status"}
          </button>
        </div>
      </PageHeader>

      {/* Boarding Real-time Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-2 p-8 bg-stone-900 text-white rounded-[40px] shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-14 w-14 rounded-2xl bg-emerald-500 text-stone-900 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <ShieldCheck size={32} />
              </div>
              <div>
                <h4 className="text-2xl font-serif font-bold">{isRTL ? "التقرير اللحظي" : "Live Report"}</h4>
                <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">{isRTL ? "جاري التحديث..." : "Live Syncing..."}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-6">
              {[
                { label: isRTL ? "تم الصعود" : "Boarded", value: "٨٥٪", color: "text-emerald-400" },
                { label: isRTL ? "قيد الانتظار" : "Pending", value: "١٢٪", color: "text-amber-400" },
                { label: isRTL ? "غياب" : "Absent", value: "٣٪", color: "text-rose-400" },
              ].map((stat, i) => (
                <div key={i} className="text-center md:text-right">
                  <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Bus size={150} />
          </div>
        </Card>

        <Card className="p-8 border-none shadow-sm bg-white rounded-[40px] flex flex-col justify-between">
          <div className="h-14 w-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users size={28} />
          </div>
          <div>
            <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest mb-1">{isRTL ? "إجمالي الطلاب" : "Total Students"}</p>
            <h4 className="text-3xl font-black text-stone-900">{students.length}</h4>
          </div>
        </Card>

        <Card className="p-8 border-none shadow-sm bg-white rounded-[40px] flex flex-col justify-between">
          <div className="h-14 w-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock size={28} />
          </div>
          <div>
            <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest mb-1">{isRTL ? "الوقت المتبقي" : "Time Remaining"}</p>
            <h4 className="text-3xl font-black text-stone-900"> 15:٠٠</h4>
          </div>
        </Card>
      </div>

      {/* Student List View */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 w-full md:w-auto">
            {[
              { id: "all", label: isRTL ? "الكل" : "All", icon: Users },
              { id: "boarded", label: isRTL ? "صعدوا" : "Boarded", icon: CheckCircle2 },
              { id: "pending", label: isRTL ? "بانتظارهم" : "Pending", icon: Clock },
              { id: "absent", label: isRTL ? "غياب" : "Absent", icon: XCircle },
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={`rounded-2xl h-12 px-6 font-bold gap-2 cursor-pointer ${activeView === tab.id ? 'bg-stone-900 text-white shadow-xl shadow-stone-200' : 'bg-white border-2 border-stone-200 text-stone-400'}`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
          
          <div className="relative w-full md:w-64">
            <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-stone-300`} size={16} />
            <Input 
              placeholder={isRTL ? "بحث..." : "Search..."} 
              className={`h-10 ${isRTL ? 'pr-10' : 'pl-10'} rounded-xl border-stone-100 bg-white`}
            />
          </div>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {students.map((student, i) => (
            <motion.div
              key={student.id}
              variants={{ hidden: { scale: 0.9, opacity: 0 }, visible: { scale: 1, opacity: 1 } }}
              whileHover={{ y: -5 }}
              className="group"
            >
              <Card className="p-6 border-none shadow-sm hover:shadow-xl transition-all duration-500 rounded-[36px] bg-white relative overflow-hidden">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-16 w-16 rounded-[24px] bg-stone-50 p-1 relative">
                    <div className="h-full w-full rounded-[20px] bg-stone-100 flex items-center justify-center text-stone-300 font-black">
                      {(student.full_name || student.name)?.[0]}
                    </div>
                    {i % 5 === 0 ? (
                      <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 border-4 border-white" />
                    ) : (
                      <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-amber-500 border-4 border-white" />
                    )}
                  </div>
                  <div>
                    <h5 className="font-bold text-stone-900 leading-tight mb-1">{student.full_name || student.name}</h5>
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{student.id}</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span className="text-stone-300">{isRTL ? "الحافلة" : "Bus"}</span>
                    <span className="text-stone-600">BUS-402</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span className="text-stone-300">{isRTL ? "الحالة" : "Status"}</span>
                    <Badge className={`${i % 5 === 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'} border-none rounded-lg font-black text-[8px] px-2 py-0.5`}>
                      {i % 5 === 0 ? (isRTL ? "تم الصعود" : "Boarded") : (isRTL ? "قيد الانتظار" : "Pending")}
                    </Badge>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className={`flex-1 ${i % 5 === 0 ? 'bg-stone-100 text-stone-400' : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'} rounded-2xl h-11 font-bold transition-all cursor-pointer`}>
                    {isRTL ? "تأكيد" : "Confirm"}
                  </button>
                  <button className={`${btnOutline} h-11 w-11 rounded-2xl`}>
                    <AlertTriangle size={18} />
                  </button>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Floating Action for QR Scan */}
      <div className="fixed bottom-10 right-10 z-50">
        <button className="h-20 w-20 rounded-[32px] bg-stone-900 text-white shadow-2xl hover:scale-110 transition-transform active:scale-95 group cursor-pointer">
          <QrCode size={32} className="group-hover:scale-110 transition-transform" />
        </button>
      </div>
    </div>
  );
}