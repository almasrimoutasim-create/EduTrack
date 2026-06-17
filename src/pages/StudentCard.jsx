import React from "react";
import { useQuery } from "@tanstack/react-query";
import { entities } from "@/api/dbClient";
import { useParams, useNavigate } from "react-router-dom";
import { 
  QrCode, 
  ShieldCheck, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  Award, 
  Star, 
  ArrowLeft,
  ChevronRight,
  Download,
  Share2,
  Edit2,
  GraduationCap,
  Bus,
  Heart,
  TrendingUp
} from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all border-2 border-stone-200 bg-white text-stone-800 hover:bg-stone-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const btnPrimary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all bg-stone-900 text-white hover:bg-black cursor-pointer shadow-lg shadow-stone-200 disabled:opacity-50 disabled:cursor-not-allowed";

export default function StudentCard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRTL = language === "ar";

  const { data: student = {}, isLoading } = useQuery({ 
    queryKey: ["student-detail", id], 
    queryFn: () => entities.Student.get(id || "S-101") 
  });

  return (
    <div className="space-y-12 pb-24" dir={isRTL ? "rtl" : "ltr"}>
      <header className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className={`${btnOutline} rounded-2xl h-12 w-12 shadow-sm`}
        >
          <ArrowLeft size={20} className={isRTL ? "rotate-180" : ""} />
        </button>
        <div>
          <h1 className="text-3xl font-serif font-black text-stone-900">{isRTL ? "بطاقة الطالب الرقمية" : "Digital Student Card"}</h1>
          <p className="text-stone-400 font-medium">{isRTL ? "عرض الملف الشخصي وبيانات الهوية" : "View profile and identity details"}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Side - The ID Card */}
        <section className="lg:col-span-5 space-y-8">
          <motion.div
            initial={{ rotateY: -10, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            className="perspective-1000"
          >
            <Card className="relative w-full aspect-[1.6/1] bg-stone-900 text-white rounded-[40px] shadow-2xl shadow-stone-900/40 overflow-hidden group">
              {/* Card Background Patterns */}
              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-[80px]" />
              <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px]" />
              
              <div className="relative z-10 h-full p-8 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-stone-900 shadow-lg">
                      <GraduationCap size={24} />
                    </div>
                    <div>
                      <h4 className="font-serif font-black tracking-tight text-lg">Edu<span className="text-primary">Track</span></h4>
                      <p className="text-[8px] font-bold text-stone-500 uppercase tracking-widest">{isRTL ? "أكاديمية التميز" : "Excellence Academy"}</p>
                    </div>
                  </div>
                  <Badge className="bg-white/10 backdrop-blur-md text-white border border-white/10 rounded-lg text-[8px] font-black px-2 py-1">
                    STUDENT ID
                  </Badge>
                </div>

                <div className="flex items-center gap-6">
                  <div className="h-28 w-28 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 p-1">
                    <div className="h-full w-full rounded-2xl bg-stone-800 flex items-center justify-center text-stone-600 font-black text-4xl">
                      {(student.full_name || student.name)?.[0]}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-3xl font-black mb-1">{student.full_name || student.name}</h3>
                    <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-4">{student.id}</p>
                    <div className="flex gap-4">
                      <div>
                        <p className="text-[8px] font-bold text-stone-500 uppercase tracking-widest mb-1">{isRTL ? "الصف" : "Grade"}</p>
                        <p className="text-sm font-black">{student.grade || '10-A'}</p>
                      </div>
                      <div className="h-8 w-px bg-white/10" />
                      <div>
                        <p className="text-[8px] font-bold text-stone-500 uppercase tracking-widest mb-1">{isRTL ? "فصيلة الدم" : "Blood"}</p>
                        <p className="text-sm font-black text-rose-500">O+</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-end">
                  <div className="flex gap-4">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-bold text-stone-500 uppercase tracking-widest mb-1">{isRTL ? "صالح حتى" : "Valid Thru"}</span>
                      <span className="text-xs font-bold">06/2025</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] font-bold text-stone-500 uppercase tracking-widest mb-1">{isRTL ? "حالة الحافلة" : "Bus Status"}</span>
                      <span className="text-xs font-bold text-emerald-400">{isRTL ? "نشط" : "Active"}</span>
                    </div>
                  </div>
                  <div className="h-16 w-16 bg-white rounded-2xl p-2 shadow-xl group-hover:scale-110 transition-transform duration-500">
                    <QrCode size="full" className="text-stone-900 h-full w-full" />
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          <div className="flex gap-4">
            <button className={`flex-1 ${btnPrimary} rounded-2xl h-14`}>
              <Download size={20} className="mr-2" />
              {isRTL ? "حفظ كصورة" : "Save as Image"}
            </button>
            <button className={`flex-1 ${btnOutline} rounded-2xl h-14`}>
              <Share2 size={20} className="mr-2" />
              {isRTL ? "مشاركة" : "Share"}
            </button>
          </div>
        </section>

        {/* Right Side - Detailed Profile */}
        <section className="lg:col-span-7 space-y-8">
          <Card className="p-10 border-none shadow-sm bg-white rounded-[48px] space-y-10">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-serif font-bold text-stone-900">{isRTL ? "البيانات الشخصية" : "Personal Information"}</h3>
              <button className="rounded-xl text-primary font-bold hover:bg-primary/5 cursor-pointer flex items-center gap-2 px-3 py-2">
                <Edit2 size={16} />
                {isRTL ? "تعديل البيانات" : "Edit Profile"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {[
                { label: isRTL ? "تاريخ الميلاد" : "Date of Birth", value: "١٥ يناير ٢٠٠٨", icon: Calendar },
                { label: isRTL ? "العنوان" : "Address", value: "دبي، البرشاء ٣، فيلا ١٢", icon: MapPin },
                { label: isRTL ? "رقم الهاتف" : "Phone", value: "+٩٧١ ٥٠ ١٢٣ ٤٥٦٧", icon: Phone },
                { label: isRTL ? "البريد الإلكتروني" : "Email", value: "student.name@edu.ae", icon: Mail },
                { label: isRTL ? "حافلة النقل" : "Bus ID", value: "BUS-402", icon: Bus },
                { label: isRTL ? "حالة الملف" : "File Status", value: isRTL ? "مكتمل" : "Complete", icon: ShieldCheck, color: "text-emerald-500" },
              ].map((info, i) => (
                <div key={i} className="flex gap-4">
                  <div className="h-10 w-10 rounded-xl bg-stone-50 flex items-center justify-center text-stone-400">
                    <info.icon size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">{info.label}</p>
                    <p className={`text-sm font-bold ${info.color || 'text-stone-800'}`}>{info.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-10 border-t border-stone-50">
              <h4 className="font-bold text-stone-900 mb-6">{isRTL ? "الإنجازات والأوسمة" : "Achievements & Badges"}</h4>
              <div className="flex flex-wrap gap-4">
                {[
                  { label: isRTL ? "بطل الرياضة" : "Sports Champ", color: "bg-blue-50 text-blue-600", icon: Award },
                  { label: isRTL ? "المبتكر الصغير" : "Tech Innovator", color: "bg-purple-50 text-purple-600", icon: Star },
                  { label: isRTL ? "حضور مثالي" : "Perfect Attendance", color: "bg-emerald-50 text-emerald-600", icon: ShieldCheck },
                  { label: isRTL ? "قارئ متميز" : "Top Reader", color: "bg-amber-50 text-amber-600", icon: Heart },
                ].map((badge, i) => (
                  <Badge key={i} className={`${badge.color} border-none rounded-2xl px-4 py-2 font-black text-xs gap-2 flex items-center shadow-sm`}>
                    <badge.icon size={14} />
                    {badge.label}
                  </Badge>
                ))}
              </div>
            </div>
          </Card>

          <Card className="p-8 border-none shadow-sm bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-[40px] flex items-center justify-between group cursor-pointer">
            <div className="flex items-center gap-6">
              <div className="h-16 w-16 rounded-[24px] bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center">
                <TrendingUp size={32} />
              </div>
              <div>
                <h4 className="text-xl font-serif font-bold">{isRTL ? "تتبع التقدم الدراسي" : "Track Academic Progress"}</h4>
                <p className="text-indigo-100/60 text-sm">{isRTL ? "عرض الدرجات، المعدل التراكمي، وتقارير الأداء." : "View grades, GPA, and performance reports."}</p>
              </div>
            </div>
            <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-indigo-600 transition-all">
              <ChevronRight size={24} className={isRTL ? "rotate-180" : ""} />
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}