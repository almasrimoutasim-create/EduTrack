import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/dbClient";
import { 
  ClipboardCheck, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle,
  Filter
} from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/translations";
import PageHeader from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";
import { toast } from "sonner";

const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all border-2 border-stone-200 bg-white text-stone-800 hover:bg-stone-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const btnPrimary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed";

export default function Attendance() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [searchTerm, setSearchTerm] = useState("");

  const { data: students = [] } = useQuery({ 
    queryKey: ["students"], 
    queryFn: () => entities.Student.list("-created_at", 500),
    staleTime: 1000 * 60 * 10
  });

  const { data: attendanceRecords = [], isLoading } = useQuery({
    queryKey: ["attendance", selectedDate],
    // @ts-ignore
    queryFn: () => entities.Attendance.list("-created_at", { date: selectedDate }, 100),
    staleTime: 1000 * 60 * 2
  });

  const markAttendanceMutation = useMutation({
    /** @param {{ studentId: string, studentName: string, status: string }} variables */
    mutationFn: async ({ studentId, studentName, status }) => {
      const existing = attendanceRecords.find(r => r.student_id === studentId);
      if (existing) {
        return entities.Attendance.update(existing.id, { status, time: format(new Date(), "HH:mm") });
      } else {
        return entities.Attendance.create({
          student_id: studentId,
          student_name: studentName,
          date: selectedDate,
          status,
          time: format(new Date(), "HH:mm"),
          type: "daily"
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      toast.success(isRTL ? "تم تحديث الحضور بنجاح" : "Attendance updated successfully");
    }
  });

  const filteredStudents = students.filter(s => 
    (s.full_name || s.name)?.toLowerCase().includes(searchTerm.toLowerCase()) || s.id?.includes(searchTerm)
  );

  return (
    <div className="space-y-6 pb-20" dir={isRTL ? "rtl" : "ltr"}>
      <PageHeader 
        title={t("attendance.title", language)} 
        subtitle={t("attendance.subtitle", language)}
      >
        <div className="flex items-center gap-3">
          <DatePicker 
            value={selectedDate} 
            onChange={(val) => setSelectedDate(val)}
            className="w-44 bg-white border-stone-200 rounded-xl h-11 shadow-sm"
          />
          <button className={`${btnPrimary} px-5`}>
            {t("attendance.markAttendance", language)}
          </button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Summary Sidebar */}
        <div className="space-y-4">
          <Card className="p-5 border shadow-sm bg-white overflow-hidden relative">
             <div className="absolute top-0 right-0 p-4 opacity-5">
              <ClipboardCheck size={80} />
            </div>
            <h4 className="font-bold text-stone-500 text-xs uppercase tracking-wide mb-5">{isRTL ? "ملخص اليوم" : "Today's Summary"}</h4>
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                    <CheckCircle2 size={18} />
                  </div>
                  <span className="text-sm font-semibold text-stone-700">{t("attendance.present", language)}</span>
                </div>
                <span className="text-lg font-bold text-emerald-600 num-en">
                  {attendanceRecords.filter(r => r.status === "present").length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-600">
                    <XCircle size={18} />
                  </div>
                  <span className="text-sm font-semibold text-stone-700">{t("attendance.absent", language)}</span>
                </div>
                <span className="text-lg font-bold text-rose-600 num-en">
                  {attendanceRecords.filter(r => r.status === "absent").length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
                    <Clock size={18} />
                  </div>
                  <span className="text-sm font-semibold text-stone-700">{t("attendance.late", language)}</span>
                </div>
                <span className="text-lg font-bold text-amber-600 num-en">
                  {attendanceRecords.filter(r => r.status === "late").length}
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-5 border shadow-sm bg-primary text-white rounded-xl">
            <AlertCircle className="mb-3 text-secondary" size={28} />
            <h4 className="font-bold text-lg mb-1.5">{isRTL ? "تذكير آلي" : "Auto Reminder"}</h4>
            <p className="text-white/60 text-xs leading-relaxed mb-5">{isRTL ? "سيتم إرسال إشعارات فورية لأولياء أمور الطلاب المتغيبين عند الساعة ١٠:٠٠ صباحاً." : "Instant notifications will be sent to parents of absent students at 10:00 AM."}</p>
            <button className={`w-full rounded-xl font-semibold bg-white/10 hover:bg-white/20 border-none text-white cursor-pointer h-10`}>{isRTL ? "إعدادات الإشعارات" : "Notification Settings"}</button>
          </Card>
        </div>

        {/* Main Attendance List */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="p-4 border shadow-sm bg-white flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-stone-400`} size={18} />
              <Input 
                placeholder={t("common.search", language)} 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} bg-white border-stone-200 rounded-xl h-11`}
                dir={isRTL ? "rtl" : "ltr"}
              />
            </div>
            <button className={`${btnOutline} rounded-xl h-11`}>
              <Filter size={18} />
              {isRTL ? "تصفية حسب الصف" : "Filter by Grade"}
            </button>
          </Card>

          <div className="space-y-2.5">
            {filteredStudents.map((student) => {
              const record = attendanceRecords.find(r => r.student_id === student.id);
              const currentStatus = record?.status;

              return (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="group"
                >
                  <Card className={`p-4 border shadow-sm hover:shadow-md transition-all duration-300 rounded-xl bg-white flex items-center justify-between ${currentStatus ? 'ring-2 ring-primary/5' : ''}`}>
                    <div className="flex items-center gap-4">
                      <div className="h-11 w-11 rounded-lg bg-stone-50 flex items-center justify-center font-bold text-stone-400 group-hover:bg-primary/5 group-hover:text-primary transition-all">
                        {(student.full_name || student.name)?.[0]}
                      </div>
                      <div>
                        <h5 className="font-semibold text-stone-900">{student.full_name || student.name}</h5>
                        <p className="text-xs text-stone-400">{t("students.grade", language)} <span className="num-en">{student.grade}</span> · <span className="num-en">#{student.id}</span></p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button 
                        className={`rounded-lg px-3 font-semibold border-2 border-stone-200 transition-all cursor-pointer h-8 text-sm ${currentStatus === "present" ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-white text-stone-800 hover:bg-emerald-50 hover:text-emerald-600'}`}
                        onClick={() => markAttendanceMutation.mutate({ studentId: student.id, studentName: student.full_name || student.name, status: "present" })}
                      >
                        {t("attendance.present", language)}
                      </button>
                      <button 
                        className={`rounded-lg px-3 font-semibold border-2 border-stone-200 transition-all cursor-pointer h-8 text-sm ${currentStatus === "absent" ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20' : 'bg-white text-stone-800 hover:bg-rose-50 hover:text-rose-600'}`}
                        onClick={() => markAttendanceMutation.mutate({ studentId: student.id, studentName: student.full_name || student.name, status: "absent" })}
                      >
                        {t("attendance.absent", language)}
                      </button>
                      <button 
                        className={`rounded-lg px-3 font-semibold border-2 border-stone-200 transition-all cursor-pointer h-8 text-sm ${currentStatus === "late" ? 'bg-amber-500 text-white shadow-md shadow-amber-500/10' : 'bg-white text-stone-800 hover:bg-amber-50 hover:text-amber-600'}`}
                        onClick={() => markAttendanceMutation.mutate({ studentId: student.id, studentName: student.full_name || student.name, status: "late" })}
                      >
                        {t("attendance.late", language)}
                      </button>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
