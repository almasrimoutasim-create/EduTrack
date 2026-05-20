import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { 
  Users, 
  Search, 
  Filter, 
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
  Trash2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/translations";
import PageHeader from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import StaffMemberFormDialog from "@/components/shared/StaffMemberFormDialog";
import { toast } from "sonner";

const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all border-2 border-stone-200 bg-white text-stone-800 hover:bg-stone-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const btnPrimary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed";

export default function StaffControl() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  const { data: staffMembers = [], isLoading } = useQuery({ 
    queryKey: ["staff-members"], 
    queryFn: () => base44.entities.StaffMember.list("-created_at", {}, 50) 
  });

  const filteredStaff = staffMembers.filter(member => 
    (member.full_name || member.name)?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    member.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setSelectedMember(null);
    setDialogOpen(true);
  };

  const handleDelete = async (member) => {
    try {
      await base44.entities.StaffMember.delete(member.id);
      toast.success(isRTL ? "تم حذف الموظف" : "Staff member deleted");
    } catch (err) {
      toast.error(isRTL ? "فشل الحذف" : "Failed to delete");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const getRoleBadge = (role) => {
    const roles = {
      'Admin': { bg: 'bg-stone-900 text-white', label: isRTL ? 'مدير نظام' : 'Admin' },
      'HR': { bg: 'bg-rose-100 text-rose-600', label: isRTL ? 'موارد بشرية' : 'HR' },
      'Accountant': { bg: 'bg-emerald-100 text-emerald-600', label: isRTL ? 'محاسب' : 'Accountant' },
      'Registrar': { bg: 'bg-blue-100 text-blue-600', label: isRTL ? 'مسجل' : 'Registrar' }
    };
    return roles[role] || { bg: 'bg-stone-100 text-stone-600', label: role };
  };

  return (
    <div className="space-y-6 pb-20" dir={isRTL ? "rtl" : "ltr"}>
      <PageHeader 
        title={isRTL ? "إدارة الكادر الإداري" : "Staff Management"} 
        subtitle={isRTL ? "إدارة الموظفين، الصلاحيات، والوصول إلى النظام" : "Manage employees, permissions, and system access"}
      >
        <div className="flex gap-3">
          <button className={`${btnOutline} rounded-xl h-11 px-5`}>
            <Settings size={18} />
            <span>{isRTL ? "إعدادات الأدوار" : "Role Settings"}</span>
          </button>
          <button onClick={handleAdd} className={`${btnPrimary} h-11 px-5`}>
            <UserPlus size={18} />
            <span>{isRTL ? "إضافة موظف" : "Add Staff Member"}</span>
          </button>
        </div>
      </PageHeader>

      {/* Staff Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: isRTL ? "إجمالي الموظفين" : "Total Staff", value: staffMembers.length, icon: Users, color: "text-primary", bg: "bg-primary/5" },
          { label: isRTL ? "متصلون الآن" : "Online Now", value: 8, icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: isRTL ? "بانتظار الموافقة" : "Pending Approval", value: 2, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((stat, i) => (
          <Card key={i} className="p-6 border shadow-sm bg-white rounded-xl flex items-center justify-between group overflow-hidden relative">
            <div className="relative z-10">
              <p className="text-stone-400 text-[10px] font-semibold uppercase tracking-wide mb-1">{stat.label}</p>
              <h4 className="text-3xl font-bold text-stone-900 num-en">{stat.value}</h4>
            </div>
            <div className={`h-14 w-14 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color} relative z-10 group-hover:scale-110 transition-transform`}>
              <stat.icon size={28} />
            </div>
            <div className="absolute -bottom-3 -right-3 w-20 h-20 bg-stone-50 rounded-full opacity-50" />
          </Card>
        ))}
      </div>

      {/* Staff Directory */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Card className="p-2 border shadow-sm bg-white rounded-xl flex-1 md:w-96">
              <div className="relative">
                <Search className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-stone-400`} size={18} />
                <Input 
                  placeholder={isRTL ? "ابحث عن موظف..." : "Search staff..."} 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`h-10 ${isRTL ? 'pr-12' : 'pl-12'} border-none bg-transparent text-sm font-medium focus-visible:ring-0`}
                  dir={isRTL ? "rtl" : "ltr"}
                />
              </div>
            </Card>
            <button className={`${btnOutline} h-11 w-11 rounded-xl`}><Filter size={18} /></button>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2 rtl:space-x-reverse">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-9 w-9 rounded-full border-3 border-stone-50 bg-stone-200" />
              ))}
              <div className="h-9 w-9 rounded-full border-3 border-stone-50 bg-primary text-white flex items-center justify-center text-[10px] font-bold num-en">+5</div>
            </div>
            <p className="text-xs font-semibold text-stone-400 uppercase">{isRTL ? "فريق الإدارة" : "Admin Team"}</p>
          </div>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {isLoading ? (
            [1,2,3,4,5,6].map(i => (
              <div key={i} className="h-64 bg-stone-100 animate-pulse rounded-2xl" />
            ))
          ) : filteredStaff.map((member) => (
            <motion.div
              key={member.id}
              variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
              whileHover={{ y: -4 }}
              className="group"
            >
              <Card className="p-6 border shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl bg-white relative overflow-hidden flex flex-col h-full">
                <div className="absolute top-0 right-0 p-5 opacity-5 pointer-events-none">
                  <Shield size={80} />
                </div>
                
                <div className="flex items-start justify-between mb-6">
                  <div className="h-16 w-16 rounded-xl bg-stone-50 p-1 shadow-inner relative">
                    <div className="h-full w-full rounded-lg bg-stone-100 flex items-center justify-center text-stone-400 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                      <Users size={28} />
                    </div>
                    <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-3 border-white" />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className={`${btnOutline} rounded-lg gap-1 text-xs h-8 px-3`}>
                        <MoreVertical size={14} />
                        {t("common.actions", language)}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align={isRTL ? "start" : "end"} className="w-40">
                      <DropdownMenuItem onClick={() => { setSelectedMember(member); setDialogOpen(true); }} className="flex items-center gap-2 cursor-pointer text-stone-700">
                        <Edit2 size={14} />
                        <span>{isRTL ? "تعديل" : "Edit"}</span>
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

                <div className="mb-6 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-lg font-bold text-stone-900 group-hover:text-primary transition-colors">{member.full_name || member.name}</h4>
                    <CheckCircle2 size={16} className="text-blue-500" />
                  </div>
                  <Badge className={`${getRoleBadge(member.role).bg} border-none rounded-lg font-bold text-[10px] px-2 py-0.5 mb-3`}>
                    {getRoleBadge(member.role).label}
                  </Badge>
                  
                  <div className="space-y-2.5 mt-5">
                    <div className="flex items-center gap-3 text-stone-400 group-hover:text-stone-600 transition-colors">
                      <Mail size={14} />
                      <span className="text-xs font-semibold">{member.email || 'staff@edutrack.com'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-stone-400 group-hover:text-stone-600 transition-colors">
                      <Phone size={14} />
                      <span className="text-xs font-semibold num-en">{member.phone || '+971 50 000 0000'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-stone-400 group-hover:text-stone-600 transition-colors">
                      <Briefcase size={14} />
                      <span className="text-xs font-semibold">{isRTL ? "تاريخ التعيين:" : "Joined:"} May 2023</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-stone-100 flex gap-2">
                  <button className={`flex-1 ${btnPrimary} rounded-xl h-11`}>
                    {isRTL ? "إدارة الصلاحيات" : "Permissions"}
                  </button>
                  <button className={`${btnOutline} h-11 w-11 rounded-xl border-stone-200 text-stone-400 hover:text-primary hover:bg-primary/5 transition-all`}>
                    <ShieldAlert size={16} />
                  </button>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {filteredStaff.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-stone-300">
          <Users size={80} className="mb-5 opacity-5" />
          <h4 className="text-xl font-bold text-stone-400">{isRTL ? "لم يتم العثور على موظفين" : "No staff members found"}</h4>
          <p className="mt-2 text-stone-400">{isRTL ? "حاول تغيير كلمات البحث أو إضافة موظف جديد." : "Try changing search terms or add a new member."}</p>
        </div>
      )}
      <StaffMemberFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} member={selectedMember} />
    </div>
  );
}
