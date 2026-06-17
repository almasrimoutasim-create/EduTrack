import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/dbClient";
import { 
  ClipboardCheck, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle,
  Filter,
  UserCheck,
  Coffee,
  Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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

export default function StaffAttendance() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // جلب قائمة الموظفين
  const { data: staffMembers = [], isLoading: isLoadingStaff } = useQuery({ 
    queryKey: ["staff-members"], 
    queryFn: () => entities.StaffMember.list("-created_at", 200),
    staleTime: 1000 * 60 * 5
  });

  // جلب سجلات الحضور الخاصة بالموظفين
  const { data: attendanceRecords = [], isLoading: isLoadingAttendance } = useQuery({
    queryKey: ["staff-attendance", selectedDate],
    // نستخدم type: "staff" للتمييز عن الطلاب
    // @ts-ignore
    queryFn: () => entities.Attendance.list("-created_at", { date: selectedDate, type: "staff" }, 200),
    staleTime: 1000 * 60 * 2
  });

  const markAttendanceMutation = useMutation({
    /** @param {{ staffId: string, staffName: string, status: string }} variables */
    mutationFn: async ({ staffId, staffName, status }) => {
      const existing = attendanceRecords.find(r => r.student_id === staffId); // نخزن معرف الموظف في حقل student_id للسرعة والـ Schema
      if (existing) {
        return entities.Attendance.update(existing.id, { status, time: format(new Date(), "HH:mm") });
      } else {
        return entities.Attendance.create({
          student_id: staffId,
          student_name: staffName,
          date: selectedDate,
          status,
          time: format(new Date(), "HH:mm"),
          type: "staff"
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-attendance"] });
      toast.success(isRTL ? "تم تحديث حضور الموظف بنجاح" : "Staff attendance updated successfully");
    }
  });

  // استخراج الأدوار المتوفرة للفلترة
  const availableRoles = useMemo(() => {
    return [...new Set(staffMembers.map(m => m.role).filter(Boolean))];
  }, [staffMembers]);

  // فلترة الموظفين
  const filteredStaff = useMemo(() => {
    return staffMembers.filter(member => {
      const matchSearch =
        (member.full_name || member.name)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.employee_id?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchRole = roleFilter === "all" || member.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [staffMembers, searchTerm, roleFilter]);

  const getRoleDisplay = (role) => {
    const map = {
      'Admin': { label: isRTL ? 'مدير نظام' : 'Admin' },
      'HR': { label: isRTL ? 'موارد بشرية' : 'HR' },
      'Accountant': { label: isRTL ? 'محاسب' : 'Accountant' },
      'Registrar': { label: isRTL ? 'مسجل' : 'Registrar' },
      'bus_supervisor': { label: isRTL ? 'مشرف حافلة' : 'Bus Supervisor' },
      'store_keeper': { label: isRTL ? 'أمين مستودع' : 'Store Keeper' },
      'security': { label: isRTL ? 'حارس أمن' : 'Security' },
    };
    return map[role] || { label: role };
  };

  return (
    <div className="space-y-6 pb-20" dir={isRTL ? "rtl" : "ltr"}>
      <PageHeader 
        title={isRTL ? "تحضير الموظفين الكادر الإداري" : "Staff Attendance Tracking"} 
        subtitle={isRTL ? "مراقبة حضور وغياب الطاقم الإداري والتعليمي" : "Monitor presence and check-ins of administration"}
      >
        <div className="flex items-center gap-3">
          <DatePicker 
            value={selectedDate} 
            onChange={(val) => setSelectedDate(val)}
            className="w-44 bg-white border-stone-200 rounded-xl h-11 shadow-sm"
          />
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* ملخص الإحصائيات الجانبي */}
        <div className="space-y-4">
          <Card className="p-5 border shadow-sm bg-white overflow-hidden relative rounded-2xl">
             <div className="absolute top-0 right-0 p-4 opacity-5">
              <ClipboardCheck size={80} />
            </div>
            <h4 className="font-bold text-stone-500 text-xs uppercase tracking-wide mb-5">{isRTL ? "ملخص حضور الموظفين" : "Staff Summary"}</h4>
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                    <CheckCircle2 size={18} />
                  </div>
                  <span className="text-sm font-semibold text-stone-700">{isRTL ? "حاضر" : "Present"}</span>
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
                  <span className="text-sm font-semibold text-stone-700">{isRTL ? "غائب" : "Absent"}</span>
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
                  <span className="text-sm font-semibold text-stone-700">{isRTL ? "متأخر" : "Late"}</span>
                </div>
                <span className="text-lg font-bold text-amber-600 num-en">
                  {attendanceRecords.filter(r => r.status === "late").length}
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-5 border shadow-sm bg-stone-900 text-white rounded-2xl">
            <AlertCircle className="mb-3 text-amber-400" size={28} />
            <h4 className="font-bold text-lg mb-1.5">{isRTL ? "سياسة الحضور" : "Attendance Policy"}</h4>
            <p className="text-stone-400 text-xs leading-relaxed mb-5">{isRTL ? "يتم احتساب الموظف متأخراً إذا تجاوز تسجيل الحضور الساعة ٨:١٥ صباحاً." : "Employees are marked late if they check in after 8:15 AM."}</p>
            <div className="h-1 bg-stone-800 rounded-full overflow-hidden">
              <div className="h-full bg-amber-400 w-1/3" />
            </div>
          </Card>
        </div>

        {/* قائمة تحضير الموظفين */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="p-4 border shadow-sm bg-white flex flex-col md:flex-row items-center gap-4 rounded-2xl">
            <div className="relative flex-1 w-full">
              <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-stone-400`} size={18} />
              <Input 
                placeholder={isRTL ? "ابحث عن موظف بالاسم أو الرقم الوظيفي..." : "Search employee..."} 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} bg-white border-stone-200 rounded-xl h-11`}
                dir={isRTL ? "rtl" : "ltr"}
              />
            </div>
            
            {availableRoles.length > 0 && (
              <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                <button
                  onClick={() => setRoleFilter("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    roleFilter === "all" ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  {isRTL ? "الكل" : "All"}
                </button>
                {availableRoles.map(role => (
                  <button
                    key={role}
                    onClick={() => setRoleFilter(role)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      roleFilter === role ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    {getRoleDisplay(role).label}
                  </button>
                ))}
              </div>
            )}
          </Card>

          <div className="space-y-2.5">
            {isLoadingStaff || isLoadingAttendance ? (
              [1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-stone-100 animate-pulse rounded-xl" />
              ))
            ) : filteredStaff.length === 0 ? (
              <div className="p-12 text-center text-stone-400 border-2 border-dashed border-stone-100 rounded-2xl">
                {isRTL ? "لا يوجد موظفون يطابقون معايير البحث." : "No staff members matched search criteria."}
              </div>
            ) : (
              <AnimatePresence>
                {filteredStaff.map((member) => {
                  const record = attendanceRecords.find(r => r.student_id === member.id);
                  const currentStatus = record?.status;

                  return (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="group"
                    >
                      <Card className={`p-4 border shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${currentStatus ? 'ring-2 ring-primary/5' : ''}`}>
                        <div className="flex items-center gap-4">
                          <div className="h-11 w-11 rounded-lg bg-stone-100 flex items-center justify-center font-bold text-stone-600 group-hover:bg-primary/5 group-hover:text-primary transition-all">
                            {(member.full_name || member.name)?.[0]}
                          </div>
                          <div>
                            <h5 className="font-bold text-stone-900">{member.full_name || member.name}</h5>
                            <p className="text-xs text-stone-400 flex items-center gap-1.5 mt-0.5">
                              <span>{getRoleDisplay(member.role).label}</span>
                              {member.employee_id && (
                                <>
                                  <span>·</span>
                                  <span className="font-mono">#{member.employee_id}</span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <button 
                            className={`rounded-xl px-4 font-bold transition-all cursor-pointer h-9 text-xs border ${
                              currentStatus === "present" 
                                ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/20' 
                                : 'bg-white border-stone-200 text-stone-700 hover:bg-emerald-50 hover:text-emerald-600'
                            }`}
                            onClick={() => markAttendanceMutation.mutate({ staffId: member.id, staffName: member.full_name || member.name, status: "present" })}
                          >
                            {isRTL ? "حاضر" : "Present"}
                          </button>
                          <button 
                            className={`rounded-xl px-4 font-bold transition-all cursor-pointer h-9 text-xs border ${
                              currentStatus === "absent" 
                                ? 'bg-rose-600 border-rose-600 text-white shadow-md shadow-rose-600/20' 
                                : 'bg-white border-stone-200 text-stone-700 hover:bg-rose-50 hover:text-rose-600'
                            }`}
                            onClick={() => markAttendanceMutation.mutate({ staffId: member.id, staffName: member.full_name || member.name, status: "absent" })}
                          >
                            {isRTL ? "غائب" : "Absent"}
                          </button>
                          <button 
                            className={`rounded-xl px-4 font-bold transition-all cursor-pointer h-9 text-xs border ${
                              currentStatus === "late" 
                                ? 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-500/10' 
                                : 'bg-white border-stone-200 text-stone-700 hover:bg-amber-50 hover:text-amber-600'
                            }`}
                            onClick={() => markAttendanceMutation.mutate({ staffId: member.id, staffName: member.full_name || member.name, status: "late" })}
                          >
                            {isRTL ? "متأخر" : "Late"}
                          </button>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
