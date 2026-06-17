import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { entities } from "@/api/dbClient";
import { 
  GraduationCap, 
  Search, 
  Filter, 
  Plus, 
  MoreVertical, 
  Mail, 
  Phone,
  Briefcase,
  Eye,
  Pencil,
  Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/translations";
import PageHeader from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import TeacherFormDialog from "@/components/teacher/TeacherFormDialog";
import { toast } from "sonner";

const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all border-2 border-stone-300 bg-white text-stone-800 hover:bg-stone-50 hover:border-stone-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const btnPrimary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed";

export default function Teachers() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  const { data: teachers = [], isLoading } = useQuery({ 
    queryKey: ["teachers"], 
    queryFn: () => entities.Teacher.list("-created_at", 100),
    staleTime: 1000 * 60 * 10
  });

  const handleAdd = () => {
    setSelectedTeacher(null);
    setDialogOpen(true);
  };

  const handleEdit = (teacher) => {
    setSelectedTeacher(teacher);
    setDialogOpen(true);
  };

  const handleDelete = async (teacher) => {
    try {
      await entities.Teacher.delete(teacher.id);
      toast.success(isRTL ? "تم حذف المعلم" : "Teacher deleted");
    } catch (err) {
      toast.error(isRTL ? "فشل الحذف" : "Failed to delete");
    }
  };

  const filteredTeachers = teachers.filter(teacher => 
    (teacher.full_name || teacher.name)?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    teacher.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  return (
    <div className="space-y-6 pb-20" dir={isRTL ? "rtl" : "ltr"}>
      <PageHeader 
        title={t("common.teachers", language)} 
        subtitle={isRTL ? "إدارة هيئة التدريس والمشرفين الأكاديميين" : "Manage teaching staff and academic supervisors"}
      >
        <button onClick={handleAdd} className={`${btnPrimary} h-11 px-5`}>
          <Plus size={18} />
          <span>{isRTL ? "إضافة معلم" : "Add Teacher"}</span>
        </button>
      </PageHeader>

      {/* Search & Filter Bar */}
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
        <button className={`${btnOutline} h-11 px-4 w-full md:w-auto`}>
          <Filter size={18} />
          <span>{isRTL ? "تصفية حسب التخصص" : "Filter by Subject"}</span>
        </button>
      </Card>

      {/* Teachers Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-72 bg-stone-100 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredTeachers.map((teacher) => (
              <motion.div
                key={teacher.id}
                layout
                variants={{
                  hidden: { y: 20, opacity: 0 },
                  visible: { y: 0, opacity: 1 }
                }}
                whileHover={{ y: -4 }}
                className="group"
              >
                <Card className="p-6 border shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl bg-white relative overflow-hidden h-full flex flex-col">
                  <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-br from-primary/5 to-primary/10 opacity-50 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-5">
                      <div className="h-16 w-16 rounded-xl bg-white shadow-md flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                        <GraduationCap size={32} />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className={`${btnOutline} h-9 px-3 text-xs`}>
                            <MoreVertical size={14} />
                            {t("common.actions", language)}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={isRTL ? "start" : "end"} className="rounded-xl">
                          <DropdownMenuItem className="gap-2 text-sm" onClick={() => handleEdit(teacher)}>
                            <Eye size={14} className="shrink-0" />
                            <span>{t("common.view", language)}</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 text-sm" onClick={() => handleEdit(teacher)}>
                            <Pencil size={14} className="shrink-0" />
                            <span>{t("common.edit", language)}</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-rose-500 gap-2 text-sm" onClick={() => handleDelete(teacher)}>
                            <Trash2 size={14} className="shrink-0" />
                            <span>{t("common.delete", language)}</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="mb-6">
                      <h4 className="text-xl font-bold text-stone-900 mb-1 group-hover:text-primary transition-colors">
                        {teacher.full_name || teacher.name}
                      </h4>
                      <div className="flex items-center gap-2 text-primary">
                        <Briefcase size={14} />
                        <p className="text-sm font-semibold">{teacher.subject || (isRTL ? "معلم عام" : "General Teacher")}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
                        <p className="text-[10px] font-semibold text-stone-400 mb-1">{isRTL ? "الحالة" : "Status"}</p>
                        <Badge className={`${teacher.status === 'active' ? 'bg-emerald-500 text-white' : 'bg-stone-200 text-stone-500'} border-none rounded-lg text-[10px] font-bold px-2 py-0.5`}>
                          {isRTL ? (teacher.status === 'active' ? 'نشط' : 'غير نشط') : teacher.status}
                        </Badge>
                      </div>
                      <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
                        <p className="text-[10px] font-semibold text-stone-400 mb-1">{isRTL ? "الفصول" : "Classes"}</p>
                        <p className="text-sm font-bold text-stone-800 num-en">4 {isRTL ? "فصول" : "Classes"}</p>
                      </div>
                    </div>

                    <div className="space-y-3 pt-5 border-t border-stone-100 mt-auto">
                      <div className="flex items-center gap-3 text-stone-500 hover:text-stone-900 transition-colors">
                        <div className="h-8 w-8 rounded-lg bg-stone-50 flex items-center justify-center">
                          <Mail size={14} />
                        </div>
                        <span className="text-xs font-semibold truncate">{teacher.email || '—'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-stone-500 hover:text-stone-900 transition-colors">
                        <div className="h-8 w-8 rounded-lg bg-stone-50 flex items-center justify-center">
                          <Phone size={14} />
                        </div>
                        <span className="text-xs font-semibold num-en">{teacher.phone || '—'}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
      <TeacherFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} teacher={selectedTeacher} />
    </div>
  );
}
