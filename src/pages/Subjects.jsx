import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { 
  BookOpen, 
  Plus, 
  MoreVertical, 
  Clock,
  Layout,
  Calculator,
  Languages,
  FlaskConical,
  Palette,
  Music,
  Eye,
  Pencil,
  Trash2
} from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/translations";
import PageHeader from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import SubjectFormDialog from "@/components/shared/SubjectFormDialog";
import { toast } from "sonner";

const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all border-2 border-stone-300 bg-white text-stone-800 hover:bg-stone-50 hover:border-stone-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const btnPrimary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed";

export default function Subjects() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);

  const { data: subjects = [], isLoading } = useQuery({ 
    queryKey: ["subjects"], 
    queryFn: () => base44.entities.Subject.list() 
  });

  const handleAdd = () => {
    setSelectedSubject(null);
    setDialogOpen(true);
  };

  const handleEdit = (subject) => {
    setSelectedSubject(subject);
    setDialogOpen(true);
  };

  const handleDelete = async (subject) => {
    try {
      await base44.entities.Subject.delete(subject.id);
      toast.success(isRTL ? "تم حذف المادة" : "Subject deleted");
    } catch (err) {
      toast.error(isRTL ? "فشل الحذف" : "Failed to delete");
    }
  };

  const getSubjectIcon = (name) => {
    const n = name?.toLowerCase();
    if (n?.includes("math") || n?.includes("رياضيات")) return Calculator;
    if (n?.includes("science") || n?.includes("علوم")) return FlaskConical;
    if (n?.includes("arabic") || n?.includes("عربي") || n?.includes("english")) return Languages;
    if (n?.includes("art") || n?.includes("فنون")) return Palette;
    if (n?.includes("music") || n?.includes("موسيقى")) return Music;
    return BookOpen;
  };

  const colors = [
    "from-blue-500 to-indigo-600",
    "from-emerald-500 to-teal-600",
    "from-amber-500 to-orange-600",
    "from-rose-500 to-pink-600",
    "from-purple-500 to-violet-600",
    "from-sky-500 to-blue-600"
  ];

  return (
    <div className="space-y-6 pb-20" dir={isRTL ? "rtl" : "ltr"}>
      <PageHeader 
        title={t("common.subjects", language)} 
        subtitle={isRTL ? "المناهج والخطط الدراسية المعتمدة" : "Approved curricula and study plans"}
      >
        <button onClick={handleAdd} className={`${btnPrimary} h-11 px-5`}>
          <Plus size={18} />
          <span>{isRTL ? "إضافة مادة" : "Add Subject"}</span>
        </button>
      </PageHeader>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-48 bg-stone-100 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject, i) => {
            const Icon = getSubjectIcon(subject.name);
            const colorClass = colors[i % colors.length];
            
            return (
              <motion.div
                key={subject.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.02 }}
                className="group"
              >
                <Card className="p-6 border shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl bg-white relative overflow-hidden h-full">
                  <div className={`absolute top-0 ${isRTL ? 'left-0' : 'right-0'} w-24 h-24 bg-gradient-to-br ${colorClass} opacity-5 group-hover:opacity-10 rounded-full -translate-y-8 translate-x-8 blur-xl transition-opacity`} />
                  
                  <div className="flex justify-between items-start mb-6">
                    <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon size={28} />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className={`${btnOutline} h-9 px-3 text-xs`}>
                          <MoreVertical size={14} />
                          {t("common.actions", language)}
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align={isRTL ? "start" : "end"} className="rounded-xl">
                        <DropdownMenuItem className="gap-2 text-sm" onClick={() => handleEdit(subject)}>
                          <Eye size={14} className="shrink-0" />
                          <span>{t("common.view", language)}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-sm" onClick={() => handleEdit(subject)}>
                          <Pencil size={14} className="shrink-0" />
                          <span>{t("common.edit", language)}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-rose-500 gap-2 text-sm" onClick={() => handleDelete(subject)}>
                          <Trash2 size={14} className="shrink-0" />
                          <span>{t("common.delete", language)}</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <h4 className="text-xl font-bold text-stone-900 mb-3 group-hover:text-primary transition-colors">
                    {subject.name}
                  </h4>

                  <div className="flex flex-wrap gap-2 mb-6">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-stone-50 rounded-lg text-xs font-semibold text-stone-500">
                      <Layout size={14} className="text-stone-400" />
                      <span className="num-en">{subject.code || 'SUB-101'}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-stone-50 rounded-lg text-xs font-semibold text-stone-500">
                      <Clock size={14} className="text-stone-400" /> <span className="num-en">6</span> {isRTL ? "ساعات / أسبوع" : "hrs/week"}
                    </div>
                  </div>

                  <div className="pt-5 border-t border-stone-100 flex items-center justify-between">
                    <div className="flex -space-x-2 rtl:space-x-reverse">
                      {[1,2,3].map(j => (
                        <div key={j} className="h-8 w-8 rounded-full border-2 border-white bg-stone-200 flex items-center justify-center text-[10px] font-bold text-stone-500 num-en">
                          {j}
                        </div>
                      ))}
                      <div className="h-8 w-8 rounded-full border-2 border-white bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary num-en">
                        +12
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-stone-400">{isRTL ? "المدرسون المرتبطون" : "Related Teachers"}</span>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {subjects.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-stone-300">
          <BookOpen size={64} className="mb-4 opacity-10" />
          <p className="font-bold text-xl">{t("common.noRecords", language)}</p>
          <button className="text-primary mt-2 font-semibold hover:underline">{isRTL ? "أضف مادتك الأولى الآن" : "Add your first subject"}</button>
        </div>
      )}
      <SubjectFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} subject={selectedSubject} />
    </div>
  );
}
