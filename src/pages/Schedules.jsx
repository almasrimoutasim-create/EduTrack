import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { 
  Calendar, 
  Plus, 
  Trash2, 
  Clock, 
  BookOpen, 
  GraduationCap, 
  Layers, 
  MapPin, 
  AlertCircle 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import PageHeader from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const DAYS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAYS_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all border border-stone-200 bg-white text-stone-800 hover:bg-stone-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const btnPrimary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-stone-900 text-white hover:bg-black cursor-pointer shadow-lg shadow-stone-200 disabled:opacity-50 disabled:cursor-not-allowed";

export default function Schedules() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const qc = useQueryClient();

  const [selectedGrade, setSelectedGrade] = useState("1");
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form states
  const [dayOfWeek, setDayOfWeek] = useState("Sunday");
  const [subjectId, setSubjectId] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("09:00");
  const [room, setRoom] = useState("");
  const [section, setSection] = useState("A");

  // Fetch subjects
  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => base44.entities.Subject.list()
  });

  // Fetch all class schedules
  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ["class-schedules"],
    queryFn: () => base44.entities.ClassSchedule.list("-created_at", 1000)
  });

  // Create schedule mutation
  const createScheduleMutation = useMutation({
    mutationFn: async (newSchedule) => {
      // @ts-ignore
      return base44.entities.ClassSchedule.create(newSchedule);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["class-schedules"] });
      setDialogOpen(false);
      resetForm();
      toast.success(isRTL ? "تمت إضافة الحصة للجدول بنجاح" : "Class scheduled successfully");
    },
    onError: (err) => {
      toast.error(isRTL ? "فشل إضافة الحصة" : "Failed to schedule class");
    }
  });

  // Delete schedule mutation
  const deleteScheduleMutation = useMutation({
    mutationFn: async (id) => {
      // @ts-ignore
      return base44.entities.ClassSchedule.delete(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["class-schedules"] });
      toast.success(isRTL ? "تم حذف الحصة من الجدول" : "Class removed from schedule");
    }
  });

  const resetForm = () => {
    setDayOfWeek("Sunday");
    setSubjectId("");
    setStartTime("08:00");
    setEndTime("09:00");
    setRoom("");
    setSection("A");
  };

  const handleAddSchedule = (e) => {
    e.preventDefault();
    if (!subjectId) {
      toast.error(isRTL ? "يرجى اختيار المادة" : "Please select a subject");
      return;
    }

    const selectedSub = subjects.find(s => s.id === subjectId);
    if (!selectedSub) return;

    // Check for potential conflict in same grade, section and day/time range
    const hasConflict = schedules.some(s => 
      s.grade === selectedGrade && 
      s.section === section && 
      s.day_of_week === dayOfWeek && 
      ((startTime >= s.start_time && startTime < s.end_time) || 
       (endTime > s.start_time && endTime <= s.end_time) || 
       (startTime <= s.start_time && endTime >= s.end_time))
    );

    if (hasConflict) {
      toast.error(isRTL ? "⚠️ تنبيه: يوجد تداخل في المواعيد لهذا الصف والشعبة!" : "⚠️ Warning: Time slot conflict for this grade and section!");
      return;
    }

    // @ts-ignore
    createScheduleMutation.mutate({
      grade: selectedGrade,
      section: section,
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
      room: room,
      subject_name: selectedSub.name,
      teacher_id: selectedSub.teacher_id || "",
      teacher_name: selectedSub.teacher_name || (isRTL ? "غير محدد" : "Not assigned")
    });
  };

  const filteredSchedules = schedules.filter(s => s.grade === selectedGrade);

  // Group schedules by day
  const schedulesByDay = DAYS_EN.reduce((acc, day, index) => {
    acc[day] = filteredSchedules
      .filter(s => s.day_of_week === day)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
    return acc;
  }, {});

  return (
    <div className="space-y-8 pb-24 text-stone-900" dir={isRTL ? "rtl" : "ltr"}>
      <PageHeader 
        title={isRTL ? "إدارة الجداول الدراسية" : "Class Schedules Admin"} 
        subtitle={isRTL ? "تخطيط الحصص الأسبوعية وربطها بالصفوف والمواد والمعلمين" : "Plan weekly class schedules and link them to grades, subjects, and teachers"}
      >
        <button onClick={() => setDialogOpen(true)} className={`${btnPrimary} h-11 px-5`}>
          <Plus size={18} />
          <span>{isRTL ? "إضافة حصة للجدول" : "Schedule New Class"}</span>
        </button>
      </PageHeader>

      {/* Grade Selector */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        <span className="text-sm font-bold text-stone-500 whitespace-nowrap">{isRTL ? "تصفية حسب الصف:" : "Filter Grade:"}</span>
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"].map(grade => (
          <button
            key={grade}
            onClick={() => setSelectedGrade(grade)}
            className={`rounded-xl px-5 h-10 font-bold text-xs transition-all cursor-pointer ${selectedGrade === grade ? "bg-stone-900 text-white shadow-md shadow-stone-200" : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"}`}
          >
            {isRTL ? `الصف ${grade}` : `Grade ${grade}`}
          </button>
        ))}
      </div>

      {/* Grid of Days */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {DAYS_EN.slice(0, 5).map((day, idx) => {
          const dayName = isRTL ? DAYS_AR[idx] : day;
          const dayClasses = schedulesByDay[day] || [];

          return (
            <Card key={day} className="p-5 bg-white border-none shadow-sm rounded-3xl flex flex-col min-h-[350px]">
              <div className="border-b border-stone-100 pb-3 mb-4 flex items-center justify-between">
                <span className="font-serif font-black text-sm text-stone-900">{dayName}</span>
                <Badge className="bg-stone-100 text-stone-500 border-none font-bold text-[10px] px-2 py-0.5 rounded-lg">
                  {dayClasses.length} {isRTL ? "حصص" : "classes"}
                </Badge>
              </div>

              <div className="space-y-3 flex-1">
                {dayClasses.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-10 opacity-30">
                    <Calendar size={32} className="text-stone-400 mb-2" />
                    <p className="text-[10px] font-bold text-stone-400">{isRTL ? "لا توجد حصص" : "No classes"}</p>
                  </div>
                ) : (
                  dayClasses.map(cls => (
                    <motion.div
                      key={cls.id}
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="group p-3 border border-stone-100 bg-stone-50 hover:bg-stone-100/50 rounded-2xl relative overflow-hidden transition-all duration-300"
                    >
                      <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <button
                          onClick={() => {
                            if (confirm(isRTL ? "هل تريد حذف هذه الحصة؟" : "Delete this class schedule?")) {
                              deleteScheduleMutation.mutate(cls.id);
                            }
                          }}
                          className="text-stone-400 hover:text-rose-600 bg-white shadow-sm border border-stone-100 rounded-lg p-1.5 transition-colors cursor-pointer"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>

                      <div className="space-y-2 relative z-0">
                        <p className="font-bold text-stone-900 text-xs truncate pr-5">{cls.subject_name}</p>
                        
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-stone-400 uppercase tracking-wide">
                          <Clock size={10} />
                          <span className="num-en">{cls.start_time} - {cls.end_time}</span>
                        </div>

                        <div className="flex items-center gap-1.5 text-[9px] font-semibold text-stone-500">
                          <GraduationCap size={10} className="text-stone-400" />
                          <span className="truncate">{cls.teacher_name}</span>
                        </div>

                        <div className="flex justify-between items-center pt-1.5 border-t border-stone-200/50">
                          <Badge className="bg-stone-200 text-stone-600 border-none font-bold text-[8px] px-1.5 py-0.5 rounded">
                            {isRTL ? "شعبة" : "Sec"} {cls.section || 'A'}
                          </Badge>
                          {cls.room && (
                            <span className="text-[9px] font-bold text-stone-400 flex items-center gap-0.5">
                              <MapPin size={8} /> {cls.room}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Schedule Dialog Form */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md rounded-[32px] p-8" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader className="">
            <DialogTitle className="font-serif font-black text-xl text-stone-900 flex items-center gap-2">
              <Calendar className="text-primary h-5 w-5" />
              {isRTL ? "إضافة حصة دراسية جديدة" : "Schedule New Class"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddSchedule} className="space-y-5 pt-4">
            
            {/* Day Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-550 block">{isRTL ? "يوم الحصة" : "Day of Week"}</label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value)}
                className="w-full h-11 rounded-xl border border-stone-200 bg-white text-xs font-bold px-3 text-stone-700 outline-none cursor-pointer"
              >
                {DAYS_EN.slice(0, 5).map((day, idx) => (
                  <option key={day} value={day}>{isRTL ? DAYS_AR[idx] : day}</option>
                ))}
              </select>
            </div>

            {/* Subject Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-550 block">{isRTL ? "المادة" : "Subject"}</label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full h-11 rounded-xl border border-stone-200 bg-white text-xs font-bold px-3 text-stone-700 outline-none cursor-pointer"
              >
                <option value="">{isRTL ? "اختر مادة..." : "Select Subject..."}</option>
                {subjects.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.name} ({sub.grade ? `${isRTL ? 'صف' : 'Gr'} ${sub.grade}` : ''})</option>
                ))}
              </select>
            </div>

            {/* Section & Room */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-550 block">{isRTL ? "الشعبة" : "Section"}</label>
                <Input
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  placeholder="A, B, C..."
                  className="h-11 rounded-xl border-stone-200 text-xs font-bold"
                  dir={isRTL ? "rtl" : "ltr"}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-550 block">{isRTL ? "القاعة / الصف" : "Room"}</label>
                <Input
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder={isRTL ? "مثال: 101" : "e.g. 101"}
                  className="h-11 rounded-xl border-stone-200 text-xs font-bold"
                  dir={isRTL ? "rtl" : "ltr"}
                />
              </div>
            </div>

            {/* Time Pickers */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-550 block">{isRTL ? "وقت البدء" : "Start Time"}</label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="h-11 rounded-xl border-stone-200 text-xs font-bold num-en"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-550 block">{isRTL ? "وقت الانتهاء" : "End Time"}</label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="h-11 rounded-xl border-stone-200 text-xs font-bold num-en"
                />
              </div>
            </div>

            <DialogFooter className="pt-4 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className={`${btnOutline} px-5 h-11`}
              >
                {isRTL ? "إلغاء" : "Cancel"}
              </button>
              <button
                type="submit"
                className={`${btnPrimary} px-5 h-11 bg-teal-600 hover:bg-teal-700`}
                disabled={createScheduleMutation.isPending}
              >
                {createScheduleMutation.isPending ? (isRTL ? "جاري الإضافة..." : "Adding...") : (isRTL ? "إضافة الحصة" : "Add Class")}
              </button>
            </DialogFooter>

          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
