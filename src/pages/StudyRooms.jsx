import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { entities } from "@/api/dbClient";
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  DoorOpen, 
  Clock,
  Wifi,
  Calendar
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useLanguage } from "@/lib/LanguageContext";
import PageHeader from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import StudyRoomFormDialog from "@/components/shared/StudyRoomFormDialog";
import { toast } from "sonner";

const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all border-2 border-stone-200 bg-white text-stone-800 hover:bg-stone-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const btnPrimary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed";

export default function StudyRooms() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);

  const { data: studyRooms = [], isLoading } = useQuery({ 
    queryKey: ["study-rooms"], 
    queryFn: () => entities.StudyRoom.list("-created_date", 20) 
  });

  const handleAdd = () => {
    setSelectedRoom(null);
    setDialogOpen(true);
  };

  const handleDelete = async (room) => {
    try {
      await entities.StudyRoom.delete(room.id);
      toast.success(isRTL ? "تم حذف القاعة" : "Room deleted");
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
        title={isRTL ? "قاعات المذاكرة الجماعية" : "Group Study Rooms"} 
        subtitle={isRTL ? "احجز مساحتك الخاصة للدراسة والتعاون مع زملائك" : "Book your private space for study and collaboration"}
      >
        <div className="flex gap-3">
          <button className={`${btnOutline} rounded-xl h-11 px-5`}>
            <Calendar size={18} />
            <span>{isRTL ? "حجوزاتي" : "My Bookings"}</span>
          </button>
          <button onClick={handleAdd} className={`${btnPrimary} h-11 px-5`}>
            <Plus size={18} />
            <span>{isRTL ? "حجز قاعة" : "Book Room"}</span>
          </button>
        </div>
      </PageHeader>

      {/* Capacity & Usage Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-6 bg-primary text-white rounded-xl shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10">
            <h4 className="text-lg font-bold mb-6">{isRTL ? "الإشغال الحالي" : "Current Occupancy"}</h4>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-4xl font-bold num-en">75%</span>
              <span className="text-white/50 text-xs font-semibold mb-1 uppercase">{isRTL ? "قيد الاستخدام" : "In Use"}</span>
            </div>
            <Progress value={75} className="h-2 bg-white/10 mb-6" />
            <p className="text-white/50 text-xs leading-relaxed">
              {isRTL ? "١٥ من أصل ٢٠ قاعة مشغولة حالياً. من المتوقع توفر قاعات إضافية خلال ساعة." : "15 out of 20 rooms are currently occupied. More rooms expected to be available in 1 hour."}
            </p>
          </div>
          <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
        </Card>

        {[
          { label: isRTL ? "متوسط وقت الدراسة" : "Avg Study Time", value: "45 min", icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
          { label: isRTL ? "الطلاب النشطون" : "Active Students", value: 128, icon: Users, color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map((stat, i) => (
          <Card key={i} className="p-6 border shadow-sm bg-white rounded-xl flex flex-col justify-between">
            <div className={`h-12 w-12 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-stone-400 text-[10px] font-semibold uppercase tracking-wide mb-0.5">{stat.label}</p>
              <h4 className="text-2xl font-bold text-stone-900 num-en">{stat.value}</h4>
            </div>
          </Card>
        ))}
      </div>

      {/* Room Selection Grid */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Card className="p-2 border shadow-sm bg-white rounded-xl flex-1 md:w-80">
              <div className="relative">
                <Search className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-stone-400`} size={18} />
                <Input 
                  placeholder={isRTL ? "بحث عن قاعة..." : "Search room..."} 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`h-10 ${isRTL ? 'pr-12' : 'pl-12'} border-none bg-transparent text-sm font-medium focus-visible:ring-0`}
                  dir={isRTL ? "rtl" : "ltr"}
                />
              </div>
            </Card>
            <button className={`${btnOutline} h-11 w-11 rounded-xl`}><Filter size={18} /></button>
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto pb-2 w-full md:w-auto">
            {['الكل', 'قاعات فردية', 'قاعات جماعية', 'منطقة هادئة', 'مختبرات'].map((cat, i) => (
              <Badge key={i} className={`cursor-pointer px-4 py-2 rounded-lg border-none font-semibold text-[10px] uppercase tracking-wide whitespace-nowrap ${i === 0 ? 'bg-primary text-white shadow-md' : 'bg-white text-stone-400 hover:bg-stone-50'}`}>
                {isRTL ? cat : (i === 0 ? 'All' : cat)}
              </Badge>
            ))}
          </div>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {studyRooms.map((room, i) => {
          const isAvailable = room.status === "upcoming" || room.status === "live";
          return (
            <motion.div
              key={room.id}
              variants={{ hidden: { scale: 0.95, opacity: 0 }, visible: { scale: 1, opacity: 1 } }}
              whileHover={{ y: -4 }}
              className="group"
            >
              <Card className="p-6 border shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl bg-white relative overflow-hidden flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                  <div className={`h-12 w-12 rounded-lg ${isAvailable ? 'bg-emerald-50 text-emerald-600' : 'bg-stone-100 text-stone-400'} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <DoorOpen size={24} />
                  </div>
                  <Badge className={`${room.status === 'live' ? 'bg-emerald-500' : room.status === 'upcoming' ? 'bg-blue-500' : 'bg-stone-400'} text-white border-none rounded-lg text-[8px] font-bold px-2 py-0.5 uppercase tracking-wide`}>
                    {room.status === 'live' ? (isRTL ? "مباشر" : "Live") : room.status === 'upcoming' ? (isRTL ? "قادم" : "Upcoming") : (isRTL ? "منتهي" : "Ended")}
                  </Badge>
                </div>

                <h4 className="text-lg font-bold text-stone-900 mb-1 group-hover:text-primary transition-colors leading-tight">
                  {room.title}
                </h4>
                <p className="text-stone-400 text-[10px] font-semibold uppercase tracking-wide mb-1 num-en">
                  {isRTL ? "الرمز:" : "Code:"} {room.room_code}
                </p>
                {room.subject_name && (
                  <p className="text-stone-500 text-xs font-semibold mb-1">{room.subject_name} · {room.grade ? `${isRTL ? "الصف" : "Grade"} ${room.grade}` : ""}</p>
                )}
                {room.teacher_name && (
                  <p className="text-stone-400 text-[10px] font-semibold uppercase tracking-wide mb-6">{room.teacher_name}</p>
                )}

                <div className="flex items-center gap-3 mb-6">
                  <div className="flex gap-1.5">
                    <div className="h-7 w-7 rounded-lg bg-stone-50 flex items-center justify-center text-stone-300" title="Wifi"><Wifi size={14} /></div>
                    <div className="h-7 w-7 rounded-lg bg-stone-50 flex items-center justify-center text-stone-300" title="Duration"><Clock size={14} /></div>
                  </div>
                  {room.duration_minutes && (
                    <span className="text-xs font-semibold text-stone-500 num-en">{room.duration_minutes} min</span>
                  )}
                </div>

                <div className="mt-auto space-y-3">
                  {room.scheduled_at && (
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wide">
                      <span className="text-stone-300">{isRTL ? "الموعد" : "Scheduled"}</span>
                      <span className="text-stone-600 num-en">{format(new Date(room.scheduled_at), "MMM d, h:mm a")}</span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    {room.meeting_url && (
                      <button className={`flex-1 ${btnPrimary} rounded-xl h-11`} onClick={() => window.open(room.meeting_url, '_blank', 'noopener,noreferrer')}>
                        {isRTL ? "دخول" : "Join"}
                      </button>
                    )}
                    <button className={`${btnOutline} h-11 w-11 rounded-xl`} onClick={() => { setSelectedRoom(room); setDialogOpen(true); }}>
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
        </motion.div>
      </section>
      <StudyRoomFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} room={selectedRoom} />
    </div>
  );
}
