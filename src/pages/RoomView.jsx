import React, { useState } from "react";
import { 
  Layout, 
  Search, 
  Filter, 
  Plus, 
  Users, 
  DoorOpen, 
  Thermometer, 
  Lightbulb,
  AlertCircle,
  MoreVertical,
  Monitor,
  Maximize2
} from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import PageHeader from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all border-2 border-stone-200 bg-white text-stone-800 hover:bg-stone-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const btnPrimary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all bg-stone-900 text-white hover:bg-black cursor-pointer shadow-lg shadow-stone-200 disabled:opacity-50 disabled:cursor-not-allowed";

export default function RoomView() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const [selectedFloor, setSelectedFloor] = useState(1);

  // Mock Room Data
  const rooms = [
    { id: "101", name: "مختبر الحاسوب", type: "Lab", status: "occupied", students: 24, temp: "22°C", lights: "on" },
    { id: "102", name: "قاعة المحاضرات", type: "Lecture", status: "available", students: 0, temp: "21°C", lights: "off" },
    { id: "103", name: "مرسم الفنون", type: "Studio", status: "occupied", students: 12, temp: "23°C", lights: "on" },
    { id: "104", name: "المكتبة الصغرى", type: "Study", status: "cleaning", students: 0, temp: "20°C", lights: "on" },
    { id: "105", name: "مختبر الكيمياء", type: "Lab", status: "occupied", students: 18, temp: "22°C", lights: "on" },
    { id: "106", name: "غرفة الموسيقى", type: "Studio", status: "available", students: 0, temp: "21°C", lights: "off" }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const getStatusColor = (status) => {
    const statuses = {
      'occupied': 'bg-emerald-500 text-white',
      'available': 'bg-blue-500 text-white',
      'cleaning': 'bg-amber-500 text-white',
      'maintenance': 'bg-rose-500 text-white'
    };
    return statuses[status] || 'bg-stone-500 text-white';
  };

  return (
    <div className="space-y-10 pb-24" dir={isRTL ? "rtl" : "ltr"}>
      <PageHeader 
        title={isRTL ? "عرض القاعات والغرف" : "Room & Facilities View"} 
        subtitle={isRTL ? "مراقبة وإدارة جميع القاعات الدراسية والمرافق المدرسية" : "Monitor and manage all classrooms and school facilities"}
      >
        <div className="flex gap-3">
          <button className={`${btnOutline} rounded-full h-12 px-6`}>
            <Monitor size={18} />
            {isRTL ? "وضع المراقبة" : "Monitor Mode"}
          </button>
          <button className={`${btnPrimary} rounded-full h-12 px-6`}>
            <Plus size={18} />
            {isRTL ? "إضافة مرفق" : "Add Facility"}
          </button>
        </div>
      </PageHeader>

      {/* Facility Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: isRTL ? "إجمالي القاعات" : "Total Rooms", value: "٤٨", icon: Layout, color: "text-stone-600", bg: "bg-stone-100" },
          { label: isRTL ? "مشغولة الآن" : "Occupied", value: "٣٢", icon: Users, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: isRTL ? "متاحة" : "Available", value: "١٢", icon: DoorOpen, color: "text-blue-600", bg: "bg-blue-50" },
          { label: isRTL ? "تحت الصيانة" : "Maintenance", value: "٤", icon: AlertCircle, color: "text-rose-600", bg: "bg-rose-50" },
        ].map((stat, i) => (
          <Card key={i} className="p-6 border-none shadow-sm bg-white rounded-[32px] group">
            <div className={`h-12 w-12 rounded-2xl ${stat.bg} flex items-center justify-center ${stat.color} mb-4 group-hover:scale-110 transition-transform`}>
              <stat.icon size={24} />
            </div>
            <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest mb-1">{stat.label}</p>
            <h4 className="text-2xl font-black text-stone-900">{stat.value}</h4>
          </Card>
        ))}
      </div>

      {/* Floor Selection & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-[24px] shadow-sm border border-stone-100">
          {[1, 2, 3, 4].map(floor => (
            <button
              key={floor}
              onClick={() => setSelectedFloor(floor)}
              className={`h-12 w-24 rounded-2xl font-bold text-xs transition-all cursor-pointer ${selectedFloor === floor ? 'bg-stone-900 text-white shadow-lg' : 'text-stone-400 hover:bg-stone-50'}`}
            >
              {isRTL ? "الطابق" : "Floor"} {floor}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <Card className="p-2 border-none shadow-sm bg-white rounded-[24px] flex-1 md:w-80">
            <div className="relative">
              <Search className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-stone-300`} size={18} />
              <Input 
                placeholder={isRTL ? "بحث عن قاعة..." : "Search room..."} 
                className={`h-10 ${isRTL ? 'pr-12' : 'pl-12'} border-none bg-transparent text-sm font-medium focus-visible:ring-0`}
              />
            </div>
          </Card>
          <button className={`${btnOutline} h-14 w-14 rounded-2xl`}><Filter size={20} /></button>
        </div>
      </div>

      {/* Rooms Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        {rooms.map((room) => (
          <motion.div
            key={room.id}
            variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
            whileHover={{ y: -10 }}
            className="group"
          >
            <Card className="p-8 border-none shadow-sm hover:shadow-2xl transition-all duration-500 rounded-[48px] bg-white relative overflow-hidden flex flex-col h-full">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <Badge className={`${getStatusColor(room.status)} border-none rounded-lg text-[8px] font-black px-2 py-0.5 uppercase tracking-widest mb-3`}>
                    {room.status}
                  </Badge>
                  <h4 className="text-2xl font-serif font-black text-stone-900 group-hover:text-primary transition-colors">{room.name}</h4>
                  <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest">{isRTL ? "رقم القاعة:" : "Room ID:"} {room.id} · {room.type}</p>
                </div>
                <button className={`${btnOutline} rounded-xl gap-1 text-xs h-8 px-3`}>
                  <MoreVertical size={14} />
                  {t("common.actions", language)}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                  { label: isRTL ? "الطلاب" : "Students", value: room.students, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
                  { label: isRTL ? "الحرارة" : "Temp", value: room.temp, icon: Thermometer, color: "text-amber-600", bg: "bg-amber-50" },
                  { label: isRTL ? "الإضاءة" : "Lights", value: room.lights, icon: Lightbulb, color: "text-blue-600", bg: "bg-blue-50" },
                ].map((stat, i) => (
                  <div key={i} className={`${stat.bg} p-4 rounded-3xl text-center border border-white/50 shadow-sm flex flex-col items-center justify-center`}>
                    <stat.icon size={16} className={`${stat.color} mb-1`} />
                    <p className="text-xs font-black text-stone-800">{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-auto pt-8 border-t border-stone-50 flex gap-3">
                <button className={`flex-1 ${btnPrimary} rounded-2xl h-12`}>
                  {isRTL ? "إدارة القاعة" : "Manage Room"}
                </button>
                <button className={`${btnOutline} h-12 w-12 rounded-2xl`}>
                  <Maximize2 size={18} />
                </button>
              </div>

              {/* Decorative room plan icon */}
              <div className="absolute -bottom-4 -right-4 p-8 opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none">
                <Layout size={120} />
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Visual Legend */}
      <Card className="p-6 border-none shadow-sm bg-stone-50 rounded-[32px] flex items-center justify-center gap-8">
        <p className="text-xs font-black text-stone-400 uppercase tracking-widest">{isRTL ? "دليل الألوان:" : "Color Legend:"}</p>
        <div className="flex items-center gap-6">
          {[
            { label: isRTL ? "مشغول" : "Occupied", color: "bg-emerald-500" },
            { label: isRTL ? "متاح" : "Available", color: "bg-blue-500" },
            { label: isRTL ? "قيد التنظيف" : "Cleaning", color: "bg-amber-500" },
            { label: isRTL ? "صيانة" : "Maintenance", color: "bg-rose-500" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${item.color}`} />
              <span className="text-xs font-bold text-stone-600">{item.label}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}