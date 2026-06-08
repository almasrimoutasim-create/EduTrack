import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { 
  FileText, 
  Search, 
  Plus, 
  File, 
  FileVideo, 
  Image as ImageIcon, 
  MoreVertical,
  Filter,
  ArrowDownToLine,
  LayoutGrid,
  List,
  FolderOpen,
  Share2,
  Bookmark,
  Clock,
  Sparkles
} from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/translations";
import PageHeader from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import StudyMaterialFormDialog from "@/components/shared/StudyMaterialFormDialog";

const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all border-2 border-stone-200 bg-white text-stone-800 hover:bg-stone-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const btnPrimary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed";

export default function Materials() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState("all");

  const { data: materials = [], isLoading } = useQuery({ 
    queryKey: ["materials"], 
    queryFn: () => base44.entities.StudyMaterial.list("-created_date", 50) 
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects-list"],
    queryFn: () => base44.entities.Subject.list()
  });

  const filteredMaterials = materials.filter(m => {
    const matchesSearch = m.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          m.subject_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubjectFilter === "all" || m.subject_name === selectedSubjectFilter;
    return matchesSearch && matchesSubject;
  });

  const handleAdd = () => {
    setSelectedMaterial(null);
    setDialogOpen(true);
  };

  const getFileIcon = (type) => {
    const t = type?.toLowerCase();
    if (t?.includes("pdf") || t?.includes("doc")) return { icon: FileText, color: "text-rose-500", bg: "bg-rose-50" };
    if (t?.includes("video") || t?.includes("mp4")) return { icon: FileVideo, color: "text-blue-500", bg: "bg-blue-50" };
    if (t?.includes("image") || t?.includes("png") || t?.includes("jpg")) return { icon: ImageIcon, color: "text-emerald-500", bg: "bg-emerald-50" };
    return { icon: File, color: "text-stone-500", bg: "bg-stone-50" };
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  return (
    <div className="space-y-6 pb-20" dir={isRTL ? "rtl" : "ltr"}>
      <PageHeader 
        title={isRTL ? "المواد الدراسية الرقمية" : "Digital Study Materials"} 
        subtitle={isRTL ? "مكتبتك السحابية لجميع المصادر والملفات التعليمية" : "Your cloud library for all educational resources and files"}
      >
        <div className="flex gap-3">
          <button className={`${btnOutline} rounded-xl h-11 px-5`}>
            <FolderOpen size={18} />
            <span>{isRTL ? "مجلداتي" : "My Folders"}</span>
          </button>
          <button onClick={handleAdd} className={`${btnPrimary} h-11 px-5`}>
            <Plus size={18} />
            <span>{isRTL ? "رفع ملف" : "Upload File"}</span>
          </button>
        </div>
      </PageHeader>

      {/* Materials Stats & Quick Access */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: isRTL ? "إجمالي الملفات" : "Total Files", value: 1240, icon: FileText, color: "text-stone-900", bg: "bg-stone-50" },
          { label: isRTL ? "فيديوهات تعليمية" : "Video Lessons", value: 85, icon: FileVideo, color: "text-blue-600", bg: "bg-blue-50" },
          { label: isRTL ? "ملفات PDF" : "PDF Resources", value: 450, icon: FileText, color: "text-rose-600", bg: "bg-rose-50" },
          { label: isRTL ? "مساحة التخزين" : "Storage Used", value: "45%", icon: Sparkles, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((stat, i) => (
          <Card key={i} className="p-5 border shadow-sm bg-white rounded-xl flex items-center gap-4 group cursor-pointer hover:shadow-md transition-all">
            <div className={`h-11 w-11 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <stat.icon size={22} />
            </div>
            <div>
              <p className="text-stone-400 text-[10px] font-semibold uppercase tracking-wide">{stat.label}</p>
              <h4 className="text-lg font-bold text-stone-900 num-en">{stat.value}</h4>
            </div>
          </Card>
        ))}
      </div>

      {/* Filter & View Controls */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Card className="p-2 border shadow-sm bg-white rounded-xl flex-1 md:w-96">
              <div className="relative">
                <Search className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-stone-400`} size={18} />
                <Input 
                  placeholder={isRTL ? "البحث في المواد..." : "Search materials..."} 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`h-10 ${isRTL ? 'pr-12' : 'pl-12'} border-none bg-transparent text-sm font-medium focus-visible:ring-0`}
                  dir={isRTL ? "rtl" : "ltr"}
                />
              </div>
            </Card>
            <select
              value={selectedSubjectFilter}
              onChange={(e) => setSelectedSubjectFilter(e.target.value)}
              className="bg-white border border-stone-200 rounded-xl h-11 px-3 text-xs font-semibold focus:outline-none cursor-pointer hover:bg-stone-50 transition-colors"
              dir={isRTL ? "rtl" : "ltr"}
            >
              <option value="all">{isRTL ? "جميع المواد" : "All Subjects"}</option>
              {[...new Set(subjects.map(s => s.name))].map(subName => (
                <option key={subName} value={subName}>{subName}</option>
              ))}
            </select>
          </div>
          
          <div className="flex bg-white p-1 rounded-xl shadow-sm border border-stone-200">
            <button 
              onClick={() => setViewMode("grid")}
              className={`h-9 w-9 rounded-lg ${viewMode === 'grid' ? 'bg-primary text-white shadow-md' : 'text-stone-400'} cursor-pointer`}
            >
              <LayoutGrid size={16} />
            </button>
            <button 
              onClick={() => setViewMode("list")}
              className={`h-9 w-9 rounded-lg ${viewMode === 'list' ? 'bg-primary text-white shadow-md' : 'text-stone-400'} cursor-pointer`}
            >
              <List size={16} />
            </button>
          </div>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-3"}
        >
          {isLoading ? (
            [1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-64 bg-stone-100 animate-pulse rounded-2xl" />)
          ) : filteredMaterials.map((material, i) => {
            const style = getFileIcon(material.type);
            return (
              <motion.div
                key={material.id}
                variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
                whileHover={viewMode === 'grid' ? { y: -4 } : {}}
                className="group"
              >
                <Card className={`border shadow-sm hover:shadow-lg transition-all duration-300 bg-white relative overflow-hidden flex ${viewMode === 'grid' ? 'flex-col p-6 rounded-2xl h-full' : 'items-center p-5 rounded-xl gap-5'}`}>
                  <div className={`${viewMode === 'grid' ? 'mb-6' : ''} relative`}>
                    <div className={`${viewMode === 'grid' ? 'h-16 w-16' : 'h-12 w-12'} rounded-xl ${style.bg} ${style.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <style.icon size={viewMode === 'grid' ? 32 : 24} />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1.5">
                      <h4 className="text-lg font-bold text-stone-900 truncate group-hover:text-primary transition-colors leading-tight">
                        {material.title}
                      </h4>
                      {viewMode === 'grid' && (
                        <button className={`${btnOutline} h-8 rounded-lg gap-1 text-xs -mt-2 -mr-2`}>
                          <MoreVertical size={14} />
                          {t("common.actions", language)}
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-5">
                      <Badge className="bg-stone-50 text-stone-400 border-none rounded-lg text-[8px] font-bold px-2 py-0.5 uppercase tracking-wide">
                        {material.subject_name || 'General'}
                      </Badge>
                      <span className="text-[10px] font-semibold text-stone-300 uppercase flex items-center gap-1">
                        <Clock size={10} /> {material.created_date ? new Date(material.created_date).toLocaleDateString(isRTL ? 'ar-AE' : 'en-US') : 'May 12'}
                      </span>
                    </div>
                  </div>

                  <div className={`${viewMode === 'grid' ? 'mt-auto pt-6 border-t border-stone-100' : ''} flex items-center justify-between gap-3`}>
                    <div className="flex gap-2">
                      <button className={`${btnOutline} rounded-lg gap-1 text-xs h-8 px-3`}>
                        <Share2 size={14} />
                        {t("common.share", language)}
                      </button>
                      <button className={`${btnOutline} rounded-lg gap-1 text-xs h-8 px-3 border-rose-200 hover:bg-rose-50 hover:text-rose-600`}>
                        <Bookmark size={14} />
                        {t("common.save", language)}
                      </button>
                    </div>
                    <button className={`flex-1 ${btnPrimary} rounded-xl h-10 px-5`}>
                      <ArrowDownToLine size={16} />
                      {isRTL ? "تحميل" : "Download"}
                    </button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </section>
      <StudyMaterialFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} material={selectedMaterial} />
    </div>
  );
}
