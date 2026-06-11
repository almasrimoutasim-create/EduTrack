import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useSearchParams } from "react-router-dom";
import { 
  Users, 
  Search, 
  Shield, 
  Mail, 
  Phone, 
  MoreVertical, 
  UserPlus, 
  Settings, 
  CheckCircle2, 
  Clock,
  Briefcase,
  UserCheck,
  ShieldAlert,
  Edit2,
  Trash2,
  XCircle,
  Coffee,
  ChevronDown
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/translations";
import PageHeader from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import StaffMemberFormDialog from "@/components/shared/StaffMemberFormDialog";
import RoleSettingsDialog from "@/components/shared/RoleSettingsDialog";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all border-2 border-stone-200 bg-white text-stone-800 hover:bg-stone-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const btnPrimary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed";

// استخراج الحروف الأولى من الاسم لعرضها كـ avatar
function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0][0].toUpperCase();
}

// ألوان الأفاتار بناءً على الاسم
const AVATAR_COLORS = [
  "bg-primary/80", "bg-emerald-500", "bg-blue-500",
  "bg-violet-500", "bg-amber-500", "bg-rose-500", "bg-teal-500"
];
function getAvatarColor(name = "") {
  let sum = 0;
  for (const c of name) sum += c.charCodeAt(0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

export default function StaffControl() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [roleSettingsOpen, setRoleSettingsOpen] = useState(false);
  const [auditLogsOpen, setAuditLogsOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  useEffect(() => {
    if (searchParams.get("add") === "true") {
      setSelectedMember(null);
      setDialogOpen(true);
      
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("add");
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const { data: staffMembers = [], isLoading } = useQuery({ 
    queryKey: ["staff-members"], 
    queryFn: () => base44.entities.StaffMember.list("-created_at", 200),
    staleTime: 1000 * 60 * 5
  });

  const { data: logs = [] } = useQuery({ 
    queryKey: ["audit-logs"], 
    queryFn: () => base44.entities.AuditLog.list("-timestamp", 100),
    staleTime: 1000 * 60 * 5
  });

  // ---- إحصائيات محسوبة من البيانات الحقيقية ----
  const totalStaff = staffMembers.length;
  const activeStaff = staffMembers.filter(m => m.status === "active" || !m.status).length;
  const onLeaveStaff = staffMembers.filter(m => m.status === "on_leave").length;

  // ---- استخراج الأدوار الفريدة للفلتر ----
  const availableRoles = useMemo(() => {
    return [...new Set(staffMembers.map(m => m.role).filter(Boolean))];
  }, [staffMembers]);

  // ---- الفلترة ----
  const filteredStaff = useMemo(() => {
    return staffMembers.filter(member => {
      const matchSearch =
        (member.full_name || member.name)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.employee_id?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchRole = roleFilter === "all" || member.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [staffMembers, searchTerm, roleFilter]);

  const handleAdd = () => {
    setSelectedMember(null);
    setDialogOpen(true);
  };

  const handleEdit = (member) => {
    setSelectedMember(member);
    setDialogOpen(true);
  };

  const handleDelete = async (member) => {
    try {
      await base44.entities.StaffMember.delete(member.id);
      queryClient.invalidateQueries({ queryKey: ["staff-members"] });
      toast.success(isRTL ? "تم حذف الموظف بنجاح" : "Staff member deleted");
    } catch (err) {
      toast.error(isRTL ? "فشل الحذف" : "Failed to delete");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.07 } }
  };

  // ---- خريطة الأدوار للعرض ----
  const getRoleDisplay = (role) => {
    const map = {
      'Admin':          { bg: 'bg-stone-900 text-white',         label: isRTL ? 'مدير نظام'      : 'Admin' },
      'HR':             { bg: 'bg-rose-100 text-rose-700',       label: isRTL ? 'موارد بشرية'    : 'HR' },
      'Accountant':     { bg: 'bg-emerald-100 text-emerald-700', label: isRTL ? 'محاسب'          : 'Accountant' },
      'Registrar':      { bg: 'bg-blue-100 text-blue-700',       label: isRTL ? 'مسجل'           : 'Registrar' },
      'bus_supervisor': { bg: 'bg-amber-100 text-amber-700',     label: isRTL ? 'مشرف حافلة'     : 'Bus Supervisor' },
      'store_keeper':   { bg: 'bg-violet-100 text-violet-700',   label: isRTL ? 'أمين مستودع'    : 'Store Keeper' },
      'security':       { bg: 'bg-cyan-100 text-cyan-700',       label: isRTL ? 'حارس أمن'       : 'Security' },
      'counselor':      { bg: 'bg-emerald-100 text-emerald-700', label: isRTL ? 'مرشد طلابي'     : 'Counselor' },
      'counseling':     { bg: 'bg-emerald-100 text-emerald-700', label: isRTL ? 'مرشد طلابي'     : 'Counselor' },
    };
    return map[role] || { bg: 'bg-stone-100 text-stone-600', label: role };
  };

  const getStatusDisplay = (status) => {
    const map = {
      'active':     { icon: CheckCircle2, color: 'text-emerald-500', dot: 'bg-emerald-500', label: isRTL ? 'نشط' : 'Active' },
      'on_leave':   { icon: Coffee,       color: 'text-amber-500',   dot: 'bg-amber-500',   label: isRTL ? 'في إجازة' : 'On Leave' },
      'suspended':  { icon: XCircle,      color: 'text-rose-500',    dot: 'bg-rose-400',    label: isRTL ? 'موقوف' : 'Suspended' },
      'terminated': { icon: XCircle,      color: 'text-stone-400',   dot: 'bg-stone-300',   label: isRTL ? 'منتهي الخدمة' : 'Terminated' },
    };
    return map[status] || map['active'];
  };

  const formatJoinDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString(isRTL ? "ar-EG" : "en-US", { year: 'numeric', month: 'short' });
    } catch { return null; }
  };

  return (
    <div className="space-y-6 pb-20" dir={isRTL ? "rtl" : "ltr"}>
      <PageHeader 
        title={isRTL ? "إدارة الكادر الإداري" : "Staff Management"} 
        subtitle={isRTL ? "إدارة الموظفين، الصلاحيات، والوصول إلى النظام" : "Manage employees, permissions, and system access"}
      >
        <div className="flex gap-3">
          <button onClick={() => setAuditLogsOpen(true)} className={`${btnOutline} rounded-xl h-11 px-5`}>
            <Clock size={18} />
            <span>{isRTL ? "سجل الأنشطة" : "Audit Logs"}</span>
          </button>
          <button onClick={() => setRoleSettingsOpen(true)} className={`${btnOutline} rounded-xl h-11 px-5`}>
            <Settings size={18} />
            <span>{isRTL ? "إعدادات الأدوار" : "Role Settings"}</span>
          </button>
          <button onClick={handleAdd} className={`${btnPrimary} h-11 px-5`}>
            <UserPlus size={18} />
            <span>{isRTL ? "إضافة موظف" : "Add Staff Member"}</span>
          </button>
        </div>
      </PageHeader>

      {/* إحصائيات حقيقية */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            label: isRTL ? "إجمالي الموظفين" : "Total Staff",
            value: totalStaff,
            icon: Users,
            color: "text-primary",
            bg: "bg-primary/5"
          },
          {
            label: isRTL ? "موظفون نشطون" : "Active Staff",
            value: activeStaff,
            icon: UserCheck,
            color: "text-emerald-600",
            bg: "bg-emerald-50"
          },
          {
            label: isRTL ? "في إجازة" : "On Leave",
            value: onLeaveStaff,
            icon: Coffee,
            color: "text-amber-600",
            bg: "bg-amber-50"
          },
        ].map((stat, i) => (
          <Card key={i} className="p-6 border shadow-sm bg-white rounded-xl flex items-center justify-between group overflow-hidden relative">
            <div className="relative z-10">
              <p className="text-stone-400 text-[10px] font-semibold uppercase tracking-wide mb-1">{stat.label}</p>
              <h4 className="text-3xl font-bold text-stone-900 num-en">
                {isLoading ? (
                  <span className="inline-block w-10 h-7 bg-stone-100 animate-pulse rounded-lg" />
                ) : stat.value}
              </h4>
            </div>
            <div className={`h-14 w-14 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color} relative z-10 group-hover:scale-110 transition-transform`}>
              <stat.icon size={28} />
            </div>
            <div className="absolute -bottom-3 -right-3 w-20 h-20 bg-stone-50 rounded-full opacity-50" />
          </Card>
        ))}
      </div>

      {/* شريط البحث والفلاتر */}
      <section className="space-y-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* بحث */}
          <Card className="p-2 border shadow-sm bg-white rounded-xl w-full md:w-96">
            <div className="relative">
              <Search className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-stone-400`} size={18} />
              <Input 
                placeholder={isRTL ? "ابحث بالاسم أو الدور أو الرقم الوظيفي..." : "Search by name, role, or ID..."} 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`h-10 ${isRTL ? 'pr-12' : 'pl-12'} border-none bg-transparent text-sm font-medium focus-visible:ring-0`}
                dir={isRTL ? "rtl" : "ltr"}
              />
            </div>
          </Card>

          {/* فلتر الدور */}
          {availableRoles.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-stone-500">{isRTL ? "الدور:" : "Role:"}</span>
              <button
                onClick={() => setRoleFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  roleFilter === "all" ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                {isRTL ? "الكل" : "All"} ({staffMembers.length})
              </button>
              {availableRoles.map(role => {
                const rd = getRoleDisplay(role);
                const count = staffMembers.filter(m => m.role === role).length;
                return (
                  <button
                    key={role}
                    onClick={() => setRoleFilter(role)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      roleFilter === role ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    {rd.label} ({count})
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* عداد النتائج */}
        {(searchTerm || roleFilter !== "all") && (
          <div className="flex items-center gap-2">
            <Badge className="bg-stone-100 text-stone-600 border-none rounded-lg text-xs font-bold">
              {filteredStaff.length} {isRTL ? "موظف" : "staff"}
            </Badge>
            <button
              onClick={() => { setSearchTerm(""); setRoleFilter("all"); }}
              className="text-xs font-bold text-rose-500 hover:text-rose-600 cursor-pointer"
            >
              {isRTL ? "مسح الفلاتر" : "Clear filters"}
            </button>
          </div>
        )}

        {/* شبكة الموظفين */}
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="h-64 bg-stone-100 animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-stone-300">
              <Users size={80} className="mb-5 opacity-5" />
              <h4 className="text-xl font-bold text-stone-400">{isRTL ? "لم يتم العثور على موظفين" : "No staff members found"}</h4>
              <p className="mt-2 text-stone-400 text-sm">{isRTL ? "جرّب تغيير الفلتر أو أضف موظفاً جديداً." : "Try changing the filter or add a new member."}</p>
            </div>
          ) : (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredStaff.map((member) => {
                const roleDisplay = getRoleDisplay(member.role);
                const statusDisplay = getStatusDisplay(member.status);
                const initials = getInitials(member.full_name || member.name);
                const avatarColor = getAvatarColor(member.full_name || member.name || "");
                const joinDate = formatJoinDate(member.created_at || member.join_date);

                return (
                  <motion.div
                    key={member.id}
                    layout
                    variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
                    whileHover={{ y: -4 }}
                    className="group"
                  >
                    <Card className="p-6 border shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl bg-white relative overflow-hidden flex flex-col h-full">
                      <div className="absolute top-0 right-0 p-5 opacity-[0.03] pointer-events-none">
                        <Shield size={80} />
                      </div>
                      
                      {/* رأس الكارت: أفاتار + أكشنز */}
                      <div className="flex items-start justify-between mb-5">
                        <div className="relative">
                          <div className={`h-16 w-16 rounded-xl ${avatarColor} flex items-center justify-center text-white font-black text-xl shadow-md select-none`}>
                            {initials}
                          </div>
                          <div className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-white ${statusDisplay.dot}`} title={statusDisplay.label} />
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className={`${btnOutline} rounded-lg gap-1 text-xs h-8 px-3`}>
                              <MoreVertical size={14} />
                              {t("common.actions", language)}
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align={isRTL ? "start" : "end"} className="w-44">
                            <DropdownMenuItem onClick={() => handleEdit(member)} className="flex items-center gap-2 cursor-pointer text-stone-700">
                              <Edit2 size={14} />
                              <span>{isRTL ? "تعديل البيانات" : "Edit"}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(member)} className="flex items-center gap-2 cursor-pointer text-stone-700">
                              <Shield size={14} />
                              <span>{isRTL ? "إدارة الصلاحيات" : "Manage Permissions"}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                if (confirm(isRTL ? "هل أنت متأكد من حذف هذا الموظف؟" : "Are you sure you want to delete this staff member?")) {
                                  handleDelete(member);
                                }
                              }} 
                              className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                            >
                              <Trash2 size={14} />
                              <span>{isRTL ? "حذف" : "Delete"}</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* اسم + دور */}
                      <div className="mb-4 flex-1">
                        <h4 className="text-base font-bold text-stone-900 group-hover:text-primary transition-colors mb-1.5 leading-tight">
                          {member.full_name || member.name || "—"}
                        </h4>
                        <div className="flex items-center gap-2 flex-wrap mb-4">
                          <Badge className={`${roleDisplay.bg} border-none rounded-lg font-bold text-[10px] px-2 py-0.5`}>
                            {roleDisplay.label}
                          </Badge>
                          {member.employee_id && (
                            <span className="text-[10px] font-mono text-stone-400 num-en">#{member.employee_id}</span>
                          )}
                        </div>
                        
                        {/* معلومات التواصل */}
                        <div className="space-y-2">
                          {member.email && (
                            <div className="flex items-center gap-2.5 text-stone-400 group-hover:text-stone-600 transition-colors">
                              <Mail size={13} className="shrink-0" />
                              <a href={`mailto:${member.email}`} className="text-xs font-semibold truncate hover:text-primary hover:underline" title={member.email}>
                                {member.email}
                              </a>
                            </div>
                          )}
                          {member.phone && (
                            <div className="flex items-center gap-2.5 text-stone-400 group-hover:text-stone-600 transition-colors">
                              <Phone size={13} className="shrink-0" />
                              <a href={`tel:${member.phone}`} className="text-xs font-semibold num-en hover:text-primary">
                                {member.phone}
                              </a>
                            </div>
                          )}
                          {joinDate && (
                            <div className="flex items-center gap-2.5 text-stone-400">
                              <Briefcase size={13} className="shrink-0" />
                              <span className="text-xs font-semibold">
                                {isRTL ? "تاريخ التعيين:" : "Joined:"} {joinDate}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* فوتر الكارت */}
                      <div className="pt-4 border-t border-stone-100 flex gap-2">
                        <button
                          onClick={() => handleEdit(member)}
                          className={`flex-1 ${btnPrimary} rounded-xl h-10 text-xs`}
                        >
                          <Edit2 size={14} />
                          {isRTL ? "تعديل الموظف" : "Edit Member"}
                        </button>
                        <button
                          onClick={() => setRoleSettingsOpen(true)}
                          className={`${btnOutline} h-10 w-10 rounded-xl border-stone-200 text-stone-400 hover:text-primary hover:bg-primary/5 transition-all`}
                          title={isRTL ? "إعدادات الأدوار" : "Role Settings"}
                        >
                          <ShieldAlert size={15} />
                        </button>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Dialogs */}
      <StaffMemberFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} member={selectedMember} />
      <RoleSettingsDialog open={roleSettingsOpen} onClose={() => setRoleSettingsOpen(false)} />

      {/* سجل الأنشطة */}
      <Dialog open={auditLogsOpen} onOpenChange={setAuditLogsOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto rounded-3xl" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="text-xl font-serif font-black flex items-center gap-2">
              <Clock className="text-primary" size={20} />
              <span>{isRTL ? "سجل الأنشطة والعمليات بالنظام" : "System Audit & Action Logs"}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="overflow-x-auto border border-stone-100 rounded-2xl">
              <table className="w-full text-start">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200">
                    <th className="px-5 py-3 text-xs font-bold text-stone-500 text-start">{isRTL ? "التاريخ والوقت" : "Time"}</th>
                    <th className="px-5 py-3 text-xs font-bold text-stone-500 text-start">{isRTL ? "الموظف" : "Staff"}</th>
                    <th className="px-5 py-3 text-xs font-bold text-stone-500 text-start">{isRTL ? "العملية" : "Action"}</th>
                    <th className="px-5 py-3 text-xs font-bold text-stone-500 text-start">{isRTL ? "الجدول/النوع" : "Entity"}</th>
                    <th className="px-5 py-3 text-xs font-bold text-stone-500 text-start">{isRTL ? "التفاصيل" : "Details"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-sm">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-stone-400 font-semibold">
                        {isRTL ? "لا توجد سجلات أنشطة مسجلة حالياً" : "No audit logs recorded yet"}
                      </td>
                    </tr>
                  ) : logs.map((log) => {
                    const isDelete = log.action?.includes("DELETE");
                    const isCreate = log.action?.includes("CREATE");
                    const isUpdate = log.action?.includes("UPDATE");
                    const badgeClass = isDelete
                      ? "bg-rose-50 text-rose-600"
                      : isCreate
                      ? "bg-emerald-50 text-emerald-600"
                      : isUpdate
                      ? "bg-blue-50 text-blue-600"
                      : "bg-stone-50 text-stone-500";
                    return (
                      <tr key={log.id} className="hover:bg-stone-50/50 transition-colors">
                        <td className="px-5 py-3.5 text-xs text-stone-400 num-en text-start">
                          {log.timestamp ? new Date(log.timestamp).toLocaleString(isRTL ? "ar-EG" : "en-US") : "—"}
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-stone-900 text-start">
                          {log.user_name || "System"}
                        </td>
                        <td className="px-5 py-3.5 text-start">
                          <Badge className={`${badgeClass} border-none rounded-lg text-[10px] font-bold px-2 py-0.5`}>
                            {log.action}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-stone-600 font-mono text-xs text-start">
                          {log.entity_type}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-stone-500 font-mono max-w-xs truncate text-start">
                          {log.details || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
