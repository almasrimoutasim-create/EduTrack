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
  AlertCircle,
  Pencil
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

const getSubjectColors = (subjectName = "") => {
  const name = subjectName.toLowerCase();
  
  if (name.includes("إسلام") || name.includes("دين") || name.includes("قرآن") || name.includes("islamic")) {
    return {
      bg: "bg-emerald-50/40 hover:bg-emerald-50/70",
      border: "border-emerald-100/80 hover:border-emerald-250",
      text: "text-emerald-950",
      subtext: "text-emerald-700",
      accent: "bg-emerald-500",
      badge: "bg-emerald-100/80 text-emerald-800",
      icon: "text-emerald-600",
      glow: "hover:shadow-emerald-100/40"
    };
  }
  if (name.includes("عرب") || name.includes("arabic")) {
    return {
      bg: "bg-rose-50/40 hover:bg-rose-50/70",
      border: "border-rose-100/80 hover:border-rose-250",
      text: "text-rose-950",
      subtext: "text-rose-700",
      accent: "bg-rose-500",
      badge: "bg-rose-100/80 text-rose-800",
      icon: "text-rose-600",
      glow: "hover:shadow-rose-100/40"
    };
  }
  if (name.includes("رياضيات") || name.includes("math")) {
    return {
      bg: "bg-indigo-50/40 hover:bg-indigo-50/70",
      border: "border-indigo-100/80 hover:border-indigo-250",
      text: "text-indigo-950",
      subtext: "text-indigo-700",
      accent: "bg-indigo-500",
      badge: "bg-indigo-100/80 text-indigo-850",
      icon: "text-indigo-600",
      glow: "hover:shadow-indigo-100/40"
    };
  }
  if (name.includes("علوم") || name.includes("science") || name.includes("فيزياء") || name.includes("كيمياء") || name.includes("أحياء")) {
    return {
      bg: "bg-cyan-50/40 hover:bg-cyan-50/70",
      border: "border-cyan-100/80 hover:border-cyan-250",
      text: "text-cyan-950",
      subtext: "text-cyan-700",
      accent: "bg-cyan-500",
      badge: "bg-cyan-100/80 text-cyan-850",
      icon: "text-cyan-600",
      glow: "hover:shadow-cyan-100/40"
    };
  }
  if (name.includes("إنجليز") || name.includes("english")) {
    return {
      bg: "bg-purple-50/40 hover:bg-purple-50/70",
      border: "border-purple-100/80 hover:border-purple-250",
      text: "text-purple-950",
      subtext: "text-purple-700",
      accent: "bg-purple-500",
      badge: "bg-purple-100/80 text-purple-850",
      icon: "text-purple-600",
      glow: "hover:shadow-purple-100/40"
    };
  }
  if (name.includes("اجتماعيات") || name.includes("تاريخ") || name.includes("جغرافيا") || name.includes("history") || name.includes("social")) {
    return {
      bg: "bg-amber-50/40 hover:bg-amber-50/70",
      border: "border-amber-100/80 hover:border-amber-250",
      text: "text-amber-950",
      subtext: "text-amber-700",
      accent: "bg-amber-500",
      badge: "bg-amber-100/80 text-amber-850",
      icon: "text-amber-600",
      glow: "hover:shadow-amber-100/40"
    };
  }
  
  // Default/Fallback
  return {
    bg: "bg-stone-50 hover:bg-stone-100/50",
    border: "border-stone-200 hover:border-stone-300",
    text: "text-stone-900",
    subtext: "text-stone-500",
    accent: "bg-stone-400",
    badge: "bg-stone-100 text-stone-600",
    icon: "text-stone-450",
    glow: "hover:shadow-stone-100/40"
  };
};

const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all border border-stone-200 bg-white text-stone-800 hover:bg-stone-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const btnPrimary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-stone-900 text-white hover:bg-black cursor-pointer shadow-lg shadow-stone-200 disabled:opacity-50 disabled:cursor-not-allowed";

export default function Schedules() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const qc = useQueryClient();

  const [selectedGrade, setSelectedGrade] = useState("1");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedClassBooks, setSelectedClassBooks] = useState(null);
  const [booksDialogOpen, setBooksDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);

  // Form states
  const [dayOfWeek, setDayOfWeek] = useState("Sunday");
  const [grade, setGrade] = useState("1");
  const [subjectId, setSubjectId] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("09:00");
  const [room, setRoom] = useState("");
  const [section, setSection] = useState("أبو بكر");

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

  // Fetch library books to link to schedules
  const { data: books = [] } = useQuery({
    queryKey: ["library-books"],
    queryFn: () => base44.entities.LibraryBook.list("-created_at", 1000)
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

  // Update schedule mutation
  const updateScheduleMutation = useMutation({
    // @ts-ignore
    mutationFn: async ({ id, updatedData }) => {
      // @ts-ignore
      return base44.entities.ClassSchedule.update(id, updatedData);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["class-schedules"] });
      setDialogOpen(false);
      setEditingSchedule(null);
      resetForm();
      toast.success(isRTL ? "تم تحديث الحصة بنجاح" : "Class schedule updated successfully");
    },
    onError: (err) => {
      toast.error(isRTL ? "فشل تحديث الحصة" : "Failed to update class schedule");
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
    setGrade(selectedGrade);
    setSubjectId("");
    setStartTime("08:00");
    setEndTime("09:00");
    setRoom("");
    setSection("أبو بكر");
  };

  const handleStartEdit = (cls) => {
    setEditingSchedule(cls);
    setGrade(cls.grade || "1");
    setSection(cls.section || "أبو بكر");
    setDayOfWeek(cls.day_of_week || "Sunday");
    setStartTime(cls.start_time || "08:00");
    setEndTime(cls.end_time || "09:00");
    setRoom(cls.room || "");
    setSubjectId(cls.subject_id || "");
    setDialogOpen(true);
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
      (!editingSchedule || s.id !== editingSchedule.id) &&
      s.grade === grade && 
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

    const scheduleData = {
      grade: grade,
      section: section,
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
      room: room,
      subject_id: selectedSub.id,
      subject_name: selectedSub.name,
      teacher_id: selectedSub.teacher_id || "",
      teacher_name: selectedSub.teacher_name || (isRTL ? "غير محدد" : "Not assigned")
    };

    if (editingSchedule) {
      // @ts-ignore
      updateScheduleMutation.mutate({
        id: editingSchedule.id,
        updatedData: scheduleData
      });
    } else {
      // @ts-ignore
      createScheduleMutation.mutate(scheduleData);
    }
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
        <button onClick={() => { setEditingSchedule(null); resetForm(); setDialogOpen(true); }} className={`${btnPrimary} h-11 px-5`}>
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
                  dayClasses.map(cls => {
                    const subjectBooks = books.filter(b => 
                      (b.subject_id && b.subject_id === cls.subject_id) || 
                      (b.subject_name && b.subject_name.toLowerCase() === cls.subject_name.toLowerCase())
                    );
                    const colors = getSubjectColors(cls.subject_name);

                    return (
                      <motion.div
                        key={cls.id}
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`group p-3 border ${colors.border} ${colors.bg} rounded-2xl relative overflow-hidden transition-all duration-300 hover:shadow-md ${colors.glow} flex flex-col justify-between`}
                      >
                        <div className={`absolute top-0 right-0 left-0 h-1 ${colors.accent}`} />
                        <div className="absolute top-1.5 right-1.5 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 flex gap-1">
                          <button
                            onClick={() => handleStartEdit(cls)}
                            className="text-stone-400 hover:text-teal-650 bg-white shadow-sm border border-stone-100 rounded-md p-1 transition-colors cursor-pointer"
                          >
                            <Pencil size={10} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(isRTL ? "هل تريد حذف هذه الحصة؟" : "Delete this class schedule?")) {
                                deleteScheduleMutation.mutate(cls.id);
                              }
                            }}
                            className="text-stone-400 hover:text-rose-600 bg-white shadow-sm border border-stone-100 rounded-md p-1 transition-colors cursor-pointer"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>

                        <div className="space-y-1.5 relative z-0 mt-1">
                          <p className={`font-extrabold ${colors.text} text-xs text-center px-1.5 truncate w-full block`} title={cls.subject_name}>
                            {cls.subject_name}
                          </p>
                          
                          <div className={`flex items-center justify-center gap-1 text-[9px] font-bold ${colors.subtext} uppercase tracking-wide`}>
                            <Clock size={9} className={colors.icon} />
                            <span className="num-en">{cls.start_time} - {cls.end_time}</span>
                          </div>

                          <div className={`flex items-center justify-center gap-1 text-[9px] font-semibold ${colors.text} opacity-85`}>
                            <GraduationCap size={9} className={colors.icon} />
                            <span className="truncate max-w-[95px]">{cls.teacher_name}</span>
                          </div>

                          {subjectBooks.length > 0 && (
                            <button
                              onClick={() => {
                                setSelectedClassBooks({ subjectName: cls.subject_name, books: subjectBooks });
                                setBooksDialogOpen(true);
                              }}
                              className={`w-full flex items-center justify-center gap-1 mt-1 text-[8.5px] font-bold ${colors.subtext} ${colors.bg} hover:opacity-90 rounded-md py-0.5 px-1.5 cursor-pointer transition-colors border ${colors.border}`}
                            >
                              <BookOpen size={8.5} className={colors.icon} />
                              <span>{isRTL ? `المراجع: ${subjectBooks.length}` : `Ref: ${subjectBooks.length}`}</span>
                            </button>
                          )}

                          <div className={`flex justify-between items-center pt-1.5 border-t border-stone-200/40 flex-wrap gap-1 mt-1`}>
                            <Badge className={`${colors.badge} border-none font-bold text-[8px] px-1 py-0.5 rounded-md`}>
                              {isRTL ? `${cls.grade} - ${cls.section || 'أبو بكر'}` : `Gr ${cls.grade} - ${cls.section || 'Abu Bakr'}`}
                            </Badge>
                            {cls.room && (
                              <span className={`text-[8.5px] font-bold ${colors.subtext} flex items-center gap-0.5`}>
                                <MapPin size={8.5} className={colors.icon} /> {cls.room}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
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
              {editingSchedule 
                ? (isRTL ? "تعديل الحصة الدراسية" : "Edit Class Schedule")
                : (isRTL ? "إضافة حصة دراسية جديدة" : "Schedule New Class")
              }
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

            {/* Grade Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-550 block">{isRTL ? "الصف" : "Grade"}</label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full h-11 rounded-xl border border-stone-200 bg-white text-xs font-bold px-3 text-stone-700 outline-none cursor-pointer"
              >
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"].map(g => (
                  <option key={g} value={g}>{isRTL ? `الصف ${g}` : `Grade ${g}`}</option>
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
                <label className="text-xs font-bold text-stone-550 block">{isRTL ? "الفصل" : "Class"}</label>
                <select
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="w-full h-11 rounded-xl border border-stone-200 bg-white text-xs font-bold px-3 text-stone-700 outline-none cursor-pointer"
                >
                  <option value="أبو بكر">{isRTL ? "أبو بكر" : "Abu Bakr"}</option>
                  <option value="عمر">{isRTL ? "عمر" : "Omar"}</option>
                  <option value="عثمان">{isRTL ? "عثمان" : "Othman"}</option>
                  <option value="علي">{isRTL ? "علي" : "Ali"}</option>
                  <option value="حمزة">{isRTL ? "حمزة" : "Hamza"}</option>
                </select>
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
                disabled={createScheduleMutation.isPending || updateScheduleMutation.isPending}
              >
                {createScheduleMutation.isPending || updateScheduleMutation.isPending 
                  ? (isRTL ? "جاري الحفظ..." : "Saving...") 
                  : (editingSchedule ? (isRTL ? "تعديل الحصة" : "Update Class") : (isRTL ? "إضافة الحصة" : "Add Class"))
                }
              </button>
            </DialogFooter>

          </form>
        </DialogContent>
      </Dialog>
      {/* Reference Books Dialog */}
      <Dialog open={booksDialogOpen} onOpenChange={setBooksDialogOpen}>
        <DialogContent className="max-w-md rounded-[32px] p-6" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="font-serif font-black text-lg text-stone-900 flex items-center gap-2">
              <BookOpen className="text-teal-600 h-5 w-5" />
              <span>
                {isRTL ? `الكتب والمراجع لـ ${selectedClassBooks?.subjectName}` : `Books & References for ${selectedClassBooks?.subjectName}`}
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4 max-h-[60vh] overflow-y-auto pr-1">
            {selectedClassBooks?.books && selectedClassBooks.books.length === 0 ? (
              <p className="text-xs text-stone-400 text-center py-6">{isRTL ? "لا توجد كتب مرجعية لهذه المادة حالياً." : "No reference books for this subject yet."}</p>
            ) : (
              selectedClassBooks?.books && selectedClassBooks.books.map(book => (
                <div key={book.id} className="flex gap-3 items-start p-3 bg-stone-50 rounded-2xl border border-stone-100 hover:bg-stone-100/50 transition-colors">
                  {book.thumbnail_url ? (
                    <img src={book.thumbnail_url} alt={book.title} className="w-12 h-16 rounded-lg object-cover border border-stone-200" />
                  ) : (
                    <div className="w-12 h-16 bg-white rounded-lg border border-dashed border-stone-200 flex items-center justify-center text-stone-300">
                      <BookOpen size={20} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-bold text-stone-900 truncate">{book.title}</h5>
                    <p className="text-[10px] text-stone-400 mt-0.5">{book.author || (isRTL ? "مؤلف مجهول" : "Unknown Author")}</p>
                    <a 
                      href={book.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-[9px] font-extrabold text-teal-650 hover:underline"
                    >
                      {isRTL ? "تحميل الكتاب PDF 📥" : "Download PDF 📥"}
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>

          <DialogFooter className="pt-4">
            <button
              onClick={() => setBooksDialogOpen(false)}
              className={`${btnOutline} px-5 h-10 w-full`}
            >
              {isRTL ? "إغلاق" : "Close"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
