import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { 
  Bus, 
  MapPin, 
  Users, 
  User,
  ShieldCheck, 
  Navigation, 
  Phone, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Search,
  MessageSquare,
  LifeBuoy
} from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import BusSupervisorSidebar from "@/components/layout/BusSupervisorSidebar";
import { t } from "@/lib/translations";
import { toast } from "sonner";

const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all border-2 border-stone-300 bg-white text-stone-800 hover:bg-stone-50 hover:border-stone-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const _btnPrimary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all bg-stone-900 text-white hover:bg-black cursor-pointer shadow-lg shadow-stone-200 disabled:opacity-50 disabled:cursor-not-allowed";

export default function BusSupervisorPortal() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const [activeTab, setActiveTab] = useState("students");
  const [searchTerm, setSearchTerm] = useState("");

  const handleBoarded = async (student) => {
    try {
      await base44.entities.Attendance.create({
        student_id: student.id,
        student_name: student.full_name || student.name,
        date: new Date().toISOString().split("T")[0],
        status: "present",
        notes: isRTL ? "صعد الحافلة المدرسية" : "Boarded school bus"
      });

      if (student.parent_email) {
        await base44.entities.PortalNotification.create({
          user_id: student.parent_email,
          title: isRTL ? "تحديث صعود الحافلة" : "Bus Boarding Update",
          message: isRTL 
            ? `صعد ابنكم/ابنتكم ${student.full_name || student.name} الحافلة في تمام الساعة ${new Date().toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}`
            : `${student.full_name || student.name} has boarded the school bus at ${new Date().toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'})}`,
          type: "info",
          read: false
        });
      }
      toast.success(isRTL ? `تم تسجيل صعود ${student.full_name || student.name}` : `Recorded check-in for ${student.full_name || student.name}`);
    } catch (err) {
      console.error(err);
      toast.error(isRTL ? "فشل تسجيل الصعود" : "Failed to record check-in");
    }
  };

  const handleLeft = async (student) => {
    try {
      await base44.entities.Attendance.create({
        student_id: student.id,
        student_name: student.full_name || student.name,
        date: new Date().toISOString().split("T")[0],
        status: "absent",
        notes: isRTL ? "نزل أو لم يصعد الحافلة المدرسية" : "Left or did not board school bus"
      });

      if (student.parent_email) {
        await base44.entities.PortalNotification.create({
          user_id: student.parent_email,
          title: isRTL ? "تحديث صعود الحافلة" : "Bus Boarding Update",
          message: isRTL 
            ? `نزل/لم يصعد ابنكم/ابنتكم ${student.full_name || student.name} الحافلة في تمام الساعة ${new Date().toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}`
            : `${student.full_name || student.name} left or did not board the school bus at ${new Date().toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'})}`,
          type: "warning",
          read: false
        });
      }
      toast.success(isRTL ? `تم تسجيل عدم الصعود لـ ${student.full_name || student.name}` : `Recorded departure for ${student.full_name || student.name}`);
    } catch (err) {
      console.error(err);
      toast.error(isRTL ? "فشل تسجيل العملية" : "Failed to record departure");
    }
  };

  const { data: busDrivers = [] } = useQuery({ 
    queryKey: ["bus-drivers"], 
    queryFn: () => base44.entities.BusDriver.list("-created_date", 10) 
  });

  const { data: supervisors = [] } = useQuery({ 
    queryKey: ["bus-supervisors"], 
    queryFn: () => base44.entities.Supervisor.list("-created_date", 10) 
  });

  const { data: allStudents = [] } = useQuery({ 
    queryKey: ["bus-students"], 
    queryFn: () => base44.entities.Student.list("-created_date", 200) 
  });

  const busStudents = allStudents.filter(s => s.bus_registered);
  const filteredStudents = busStudents.filter(s =>
    (s.full_name || s.name)?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeDriver = busDrivers.find(d => d.status === "active") || busDrivers[0];
  const totalOnBus = busStudents.length;
  const capacity = activeDriver ? 40 : 0;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  return (
    <div className={`min-h-screen bg-stone-50 text-stone-900 ${isRTL ? 'font-cairo' : 'font-sans'}`} dir={isRTL ? "rtl" : "ltr"}>
      <BusSupervisorSidebar />
      <main className={`transition-all duration-300 min-h-screen pt-16 lg:pt-0 ${isRTL ? "lg:mr-64" : "lg:ml-64"}`}>
        <div className="space-y-8 pb-24 p-6 md:p-10 lg:p-12 max-w-7xl mx-auto">
          {/* High-Visibility Header */}
      <section className="bg-stone-900 text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 rounded-3xl bg-amber-500 text-stone-900 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Bus size={44} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-3xl font-serif font-black">{activeDriver?.bus_number || (isRTL ? "حافلة" : "Bus")}</h2>
                <Badge className="bg-emerald-500 text-white border-none rounded-full h-5 text-[8px] font-black uppercase">
                  {isRTL ? "في الطريق" : "En Route"}
                </Badge>
              </div>
              <p className="text-stone-400 font-bold tracking-widest text-sm uppercase">
                {activeDriver?.bus_route || (isRTL ? "مسار غير محدد" : "No route assigned")}
              </p>
            </div>
          </div>
          
          <div className="flex gap-4 w-full md:w-auto">
            <button className={`${btnOutline} flex-1 md:flex-none border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-2xl h-14 px-8`}>
              <Navigation size={20} className="text-amber-500" />
              {isRTL ? "عرض الخريطة" : "Map View"}
            </button>
            <button className="flex-1 md:flex-none bg-rose-600 hover:bg-rose-700 text-white rounded-2xl h-14 px-8 font-bold gap-2 shadow-xl shadow-rose-900/20 cursor-pointer">
              <AlertTriangle size={20} />
              {isRTL ? "طوارئ" : "Emergency"}
            </button>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: isRTL ? "السائق" : "Driver", value: activeDriver?.full_name || (isRTL ? "غير محدد" : "N/A"), icon: User },
            { label: isRTL ? "الركاب" : "Passengers", value: `${totalOnBus}/${capacity}`, icon: Users },
            { label: isRTL ? "المشرفون" : "Supervisors", value: supervisors.filter(s => s.status === "active").length, icon: ShieldCheck },
            { label: isRTL ? "الحالة" : "Status", value: isRTL ? "نشط" : "Active", icon: CheckCircle2 },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col">
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">{stat.label}</span>
              <span className="font-bold text-white flex items-center gap-2">
                <stat.icon size={14} className="text-amber-500" />
                {stat.value}
              </span>
            </div>
          ))}
        </div>
        
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
      </section>

      {/* Main Interaction Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Student Boarding List */}
        <section className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-serif font-bold text-stone-900">{isRTL ? "قائمة ركوب الطلاب" : "Student Boarding"}</h3>
            <div className="relative">
              <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-stone-300`} size={16} />
              <Input 
                placeholder={isRTL ? "بحث عن طالب..." : "Search student..."} 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`h-10 ${isRTL ? 'pr-10' : 'pl-10'} rounded-xl border-stone-100 bg-white w-48 lg:w-64`}
              />
            </div>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {filteredStudents.length === 0 ? (
              <div className="text-center py-12 text-stone-400">
                <Bus size={48} className="mx-auto mb-4 opacity-20" />
                <p>{isRTL ? "لا يوجد طلاب مسجلين بالحافلة" : "No students registered for bus"}</p>
              </div>
            ) : filteredStudents.map((student, i) => (
              <motion.div
                key={student.id}
                variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                className="group"
              >
                <Card className="p-4 border-none shadow-sm hover:shadow-xl transition-all duration-300 rounded-[32px] flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-[24px] bg-stone-50 p-1">
                      <div className="h-full w-full rounded-[20px] bg-stone-100 flex items-center justify-center text-stone-300 font-black text-xl">
                        {(student.full_name || student.name)?.[0]}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-stone-900 leading-tight mb-1">{student.full_name || student.name}</h4>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{student.id}</span>
                        <Badge className="bg-stone-50 text-stone-500 border-none text-[8px] font-black px-2 py-0.5 rounded-md">
                          {isRTL ? "الصف" : "Grade"} {student.grade}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                    <div className="flex items-center gap-2">
                      <button className={`${btnOutline} rounded-2xl gap-1 text-xs`}>
                        <Phone size={14} />
                        {t("common.call", language)}
                      </button>
                      <div className="h-10 w-[1px] bg-stone-100 mx-1" />
                      <button 
                        onClick={() => handleBoarded(student)}
                        className="h-14 px-8 rounded-[24px] bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/20 gap-2 cursor-pointer"
                      >
                        <CheckCircle2 size={20} />
                        {isRTL ? "صعد" : "Boarded"}
                      </button>
                      <button 
                        onClick={() => handleLeft(student)}
                        className={`${btnOutline} h-14 w-14 rounded-[24px] border-stone-100 text-stone-300 hover:text-rose-500 hover:bg-rose-50`}
                      >
                        <XCircle size={24} />
                      </button>
                    </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Action Sidebar */}
<aside className="lg:col-span-4 space-y-6">
           <Card className="p-8 border-none shadow-sm bg-white rounded-[40px]">
             <h4 className="font-bold text-stone-900 mb-6">{isRTL ? "أدوات المشرف" : "Supervisor Tools"}</h4>
              <div className="space-y-4">
                <button className="w-full h-16 rounded-[28px] bg-stone-900 text-white font-bold gap-3 text-lg cursor-pointer flex items-center justify-center">
                  <MessageSquare size={24} className="text-amber-500" />
                  {isRTL ? "إرسال تعميم للآباء" : "Broadcast to Parents"}
                </button>
                <button className={`${btnOutline} w-full h-16 rounded-[28px] text-stone-600 hover:bg-stone-50 transition-all`}>
                  <ShieldCheck size={24} className="text-emerald-500" />
                  {isRTL ? "تقرير السلامة" : "Safety Report"}
                </button>
                <button className={`${btnOutline} w-full h-16 rounded-[28px] text-stone-600 hover:bg-stone-50 transition-all`}>
                  <LifeBuoy size={24} className="text-blue-500" />
                  {isRTL ? "دعم فني" : "Technical Support"}
                </button>
              </div>
           </Card>

           <Card className="p-8 border-none shadow-sm bg-gradient-to-br from-amber-50 to-orange-50 rounded-[40px] border border-amber-100/50">
             <div className="flex items-center gap-3 mb-6">
               <div className="h-10 w-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center">
                 <MapPin size={20} />
               </div>
               <h4 className="font-black text-amber-900">{isRTL ? "خلاصة الرحلة" : "Route Summary"}</h4>
             </div>
             
             <div className="space-y-6">
               {[
                 { time: "٠٩:٤٥ ص", action: "بداية الرحلة", status: "complete" },
                 { time: "١٠:٠٠ ص", action: "محطة الحي المالي", status: "complete" },
                 { time: "١٠:١٥ ص", action: "ميدان الاتحاد", status: "current" },
                 { time: "١٠:٣٠ ص", action: "وصول المدرسة", status: "pending" },
               ].map((step, i) => (
                 <div key={i} className="flex gap-4 relative">
                   {i !== 3 && <div className={`absolute top-6 ${isRTL ? 'right-2.5' : 'left-2.5'} w-0.5 h-full ${step.status === 'complete' ? 'bg-amber-500' : 'bg-stone-200'}`} />}
                   <div className={`h-5 w-5 rounded-full z-10 mt-1 border-4 ${step.status === 'complete' ? 'bg-amber-500 border-amber-100' : step.status === 'current' ? 'bg-white border-amber-500 animate-pulse' : 'bg-white border-stone-200'}`} />
                   <div>
                     <p className={`text-[10px] font-black uppercase tracking-widest ${step.status === 'pending' ? 'text-stone-400' : 'text-amber-600'}`}>{step.time}</p>
                     <p className={`text-sm font-bold ${step.status === 'pending' ? 'text-stone-400' : 'text-stone-800'}`}>{step.action}</p>
                   </div>
                 </div>
               ))}
             </div>
           </Card>
         </aside>
       </div>
        </div>
      </main>
    </div>
  );
}