import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/dbClient";
import { 
  FileText, 
  Search, 
  Plus, 
  File, 
  FileVideo, 
  Image as ImageIcon, 
  MoreVertical,
  ArrowDownToLine,
  LayoutGrid,
  List,
  FolderOpen,
  Share2,
  Bookmark,
  Clock,
  Eye,
  Sparkles,
  Pencil,
  Trash2,
  X
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/translations";
import { getMaterialUrl, getMaterialFileName, getPreviewKind } from "@/lib/materialFile";
import { readSavedMaterialIds, writeSavedMaterialIds } from "@/lib/savedMaterials";
import PageHeader from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import StudyMaterialFormDialog from "@/components/shared/StudyMaterialFormDialog";
import MaterialPreviewDialog from "@/components/shared/MaterialPreviewDialog";
import MaterialFoldersDialog, { MATERIAL_FOLDERS } from "@/components/shared/MaterialFoldersDialog";

const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all border-2 border-stone-200 bg-white text-stone-800 hover:bg-stone-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const btnPrimary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed";

const menuItemClass = "flex items-center gap-2 cursor-pointer text-stone-700 text-xs font-semibold";

/** Per-material actions: preview, download, share, save, edit, delete. */
function ActionsMenu({ material, language, isSaved, onPreview, onDownload, onShare, onSave, onEdit, onDelete }) {
  const isRTL = language === "ar";
  const hasFile = !!getMaterialUrl(material);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={`${btnOutline} h-8 rounded-lg gap-1 text-xs`}>
          <MoreVertical size={14} />
          {t("common.actions", language)}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={isRTL ? "start" : "end"} className="w-48" dir={isRTL ? "rtl" : "ltr"}>
        <DropdownMenuItem onClick={() => onPreview(material)} className={menuItemClass}>
          <Eye size={13} />
          <span>{t("common.preview", language)}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onDownload(material)}
          disabled={!hasFile}
          className={menuItemClass}
        >
          <ArrowDownToLine size={13} />
          <span>{isRTL ? "تحميل" : "Download"}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onShare(material)} className={menuItemClass}>
          <Share2 size={13} />
          <span>{t("common.share", language)}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSave(material)} className={menuItemClass}>
          <Bookmark size={13} className={isSaved ? "text-rose-500" : ""} />
          <span>
            {isSaved
              ? (isRTL ? "إزالة من المحفوظات" : "Remove from saved")
              : (isRTL ? "حفظ" : "Save")}
          </span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onEdit(material)} className={menuItemClass}>
          <Pencil size={13} />
          <span>{t("common.edit", language)}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onDelete(material)}
          className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer text-xs font-semibold"
        >
          <Trash2 size={13} />
          <span>{t("common.delete", language)}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function Materials() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const qc = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState("all");
  const [activeFolder, setActiveFolder] = useState("all");
  const [foldersOpen, setFoldersOpen] = useState(false);
  const [previewMaterial, setPreviewMaterial] = useState(null);
  const [savedIds, setSavedIds] = useState(() => readSavedMaterialIds());

  const { data: materials = [], isLoading } = useQuery({ 
    queryKey: ["materials"], 
    queryFn: () => entities.StudyMaterial.list("-created_date", 50) 
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects-list"],
    queryFn: () => entities.Subject.list()
  });

  // Subjects come from both the subject table and the materials themselves,
  // so the select and the folder dialog always cover the same set.
  const subjectNames = [...new Set([
    ...subjects.map(s => s.name),
    ...materials.map(m => m.subject_name),
    ...(selectedSubjectFilter !== "all" ? [selectedSubjectFilter] : []),
  ].filter(Boolean))];

  const folderMatches = (material, folderId) => {
    if (folderId === "all") return true;
    if (folderId === "saved") return savedIds.includes(String(material.id));
    const def = MATERIAL_FOLDERS.find(f => f.id === folderId);
    return def?.kind ? getPreviewKind(material) === def.kind : true;
  };

  const filteredMaterials = materials.filter(m => {
    const matchesSearch = m.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          m.subject_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubjectFilter === "all" || m.subject_name === selectedSubjectFilter;
    return matchesSearch && matchesSubject && folderMatches(m, activeFolder);
  });

  const handleAdd = () => {
    setSelectedMaterial(null);
    setDialogOpen(true);
  };

  const handlePreview = (material) => setPreviewMaterial(material);

  const handleDownload = async (material) => {
    const url = getMaterialUrl(material);
    if (!url) {
      toast.error(isRTL ? "لا يوجد ملف مرتبط بهذه المادة" : "This material has no linked file");
      return;
    }
    const fileName = getMaterialFileName(material, url);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const href = URL.createObjectURL(await response.blob());
      const anchor = document.createElement("a");
      anchor.href = href;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(href), 1000);
      toast.success(isRTL ? "بدأ تحميل الملف" : "Download started");
    } catch {
      // Cross-origin or blocked URLs: let the browser open/save it directly.
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    }
  };

  const handleShare = async (material) => {
    const url = getMaterialUrl(material) || window.location.href;
    const title = material.title || (isRTL ? "مادة دراسية" : "Study material");
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (err) {
        if (err?.name === "AbortError") return; // user closed the share sheet
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success(isRTL ? "تم نسخ الرابط" : "Link copied to clipboard");
    } catch {
      toast.error(isRTL ? "تعذّرت مشاركة هذه المادة" : "Could not share this material");
    }
  };

  const handleToggleSave = (material) => {
    const id = String(material.id);
    const wasSaved = savedIds.includes(id);
    const next = wasSaved ? savedIds.filter(x => x !== id) : [...savedIds, id];
    setSavedIds(next);
    writeSavedMaterialIds(next);
    toast.success(wasSaved
      ? (isRTL ? "تمت الإزالة من المحفوظات" : "Removed from saved")
      : (isRTL ? "تم حفظ المادة" : "Material saved"));
  };

  const handleEdit = (material) => {
    setSelectedMaterial(material);
    setDialogOpen(true);
  };

  const handleDelete = async (material) => {
    if (!confirm(isRTL ? "هل أنت متأكد من حذف هذه المادة؟" : "Are you sure you want to delete this material?")) return;
    try {
      await entities.StudyMaterial.delete(material.id);
      qc.invalidateQueries({ queryKey: ["materials"] });
      toast.success(isRTL ? "تم حذف المادة" : "Material deleted");
    } catch {
      toast.error(isRTL ? "تعذّر حذف المادة" : "Failed to delete material");
    }
  };

  // A subject filter and a type/saved folder never stack: picking one clears the other.
  const selectSubject = (value) => {
    setSelectedSubjectFilter(value);
    setActiveFolder("all");
  };

  const selectFolder = (folderId) => {
    setActiveFolder(folderId);
    setSelectedSubjectFilter("all");
    setFoldersOpen(false);
  };

  const selectSubjectFolder = (name) => {
    setSelectedSubjectFilter(name);
    setActiveFolder("all");
    setFoldersOpen(false);
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

  const dialogFolders = MATERIAL_FOLDERS.map(f => ({
    ...f,
    label: isRTL ? f.labelAr : f.labelEn,
    count: materials.filter(m => folderMatches(m, f.id)).length,
  }));

  const subjectFolders = subjectNames
    .map(name => ({
      id: `subject:${name}`,
      subject: name,
      label: name,
      count: materials.filter(m => m.subject_name === name).length,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  return (
    <div className="space-y-6 pb-20" dir={isRTL ? "rtl" : "ltr"}>
      <PageHeader 
        title={isRTL ? "المواد الدراسية الرقمية" : "Digital Study Materials"} 
        subtitle={isRTL ? "مكتبتك السحابية لجميع المصادر والملفات التعليمية" : "Your cloud library for all educational resources and files"}
      >
        <div className="flex gap-3">
          <button onClick={() => setFoldersOpen(true)} className={`${btnOutline} rounded-xl h-11 px-5`}>
            <FolderOpen size={18} />
            <span>{isRTL ? "مجلداتي" : "My Folders"}</span>
          </button>
          <button onClick={handleAdd} className={`${btnPrimary} h-11 px-5`}>
            <Plus size={18} />
            <span>{isRTL ? "رفع ملف" : "Upload File"}</span>
          </button>
        </div>
      </PageHeader>

      {/* Materials Stats & Quick Access — dynamic from StudyMaterial table */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {(() => {
          const videoCount = materials.filter(m => (m.type||m.file_type||m.mime_type||"").toLowerCase().includes("video") || (m.file_url||"").toLowerCase().endsWith(".mp4")).length;
          const pdfCount = materials.filter(m => (m.type||m.file_type||m.mime_type||"").toLowerCase().includes("pdf") || (m.file_url||"").toLowerCase().endsWith(".pdf")).length;
          const stats = [
            { label: isRTL ? "إجمالي الملفات" : "Total Files", value: materials.length, icon: FileText, color: "text-stone-900", bg: "bg-stone-50" },
            { label: isRTL ? "فيديوهات تعليمية" : "Video Lessons", value: videoCount, icon: FileVideo, color: "text-blue-600", bg: "bg-blue-50" },
            { label: isRTL ? "ملفات PDF" : "PDF Resources", value: pdfCount, icon: FileText, color: "text-rose-600", bg: "bg-rose-50" },
            { label: isRTL ? "مساحة التخزين" : "Storage Used", value: materials.length === 0 ? "0%" : `${Math.min(5 + videoCount*2 + pdfCount, 95)}%`, icon: Sparkles, color: "text-amber-600", bg: "bg-amber-50" },
          ];
          return stats.map((stat, i) => (
          <Card key={i} className="p-5 border shadow-sm bg-white rounded-xl flex items-center gap-4 group cursor-pointer hover:shadow-md transition-all">
            <div className={`h-11 w-11 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <stat.icon size={22} />
            </div>
            <div>
              <p className="text-stone-400 text-[10px] font-semibold uppercase tracking-wide">{stat.label}</p>
              <h4 className="text-lg font-bold text-stone-900 num-en">{stat.value}</h4>
            </div>
          </Card>
        ))} )()}
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
            <select id="field-materials-select-1" name="select_1" aria-label="select 1"
              value={selectedSubjectFilter}
              onChange={(e) => selectSubject(e.target.value)}
              className="bg-white border border-stone-200 rounded-xl h-11 px-3 text-xs font-semibold focus:outline-none cursor-pointer hover:bg-stone-50 transition-colors"
              dir={isRTL ? "rtl" : "ltr"}
            >
              <option value="all">{isRTL ? "جميع المواد" : "All Subjects"}</option>
              {subjectNames.map(subName => (
                <option key={subName} value={subName}>{subName}</option>
              ))}
            </select>
            {activeFolder !== "all" && (
              <button
                onClick={() => setActiveFolder("all")}
                title={isRTL ? "إلغاء المجلد" : "Clear folder"}
                className="inline-flex items-center gap-1.5 h-11 px-3 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors cursor-pointer"
              >
                {MATERIAL_FOLDERS.find(f => f.id === activeFolder)?.[isRTL ? "labelAr" : "labelEn"]}
                <X size={13} />
              </button>
            )}
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
          ) : filteredMaterials.map((material) => {
            const style = getFileIcon(material.type);
            const isSaved = savedIds.includes(String(material.id));
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
                        <div className="-mt-2 -mr-2">
                          <ActionsMenu
                            material={material}
                            language={language}
                            isSaved={isSaved}
                            onPreview={handlePreview}
                            onDownload={handleDownload}
                            onShare={handleShare}
                            onSave={handleToggleSave}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                          />
                        </div>
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

                  <div className={`${viewMode === 'grid' ? 'mt-auto pt-6 border-t border-stone-100' : ''} flex flex-wrap items-center justify-between gap-3`}>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => handlePreview(material)} className={`${btnOutline} rounded-lg gap-1 text-xs h-8 px-3`}>
                        <Eye size={14} />
                        {t("common.preview", language)}
                      </button>
                      <button
                        onClick={() => handleShare(material)}
                        title={isRTL ? "مشاركة الرابط" : "Share link"}
                        className={`${btnOutline} rounded-lg gap-1 text-xs h-8 px-3`}
                      >
                        <Share2 size={14} />
                        {t("common.share", language)}
                      </button>
                      <button
                        onClick={() => handleToggleSave(material)}
                        title={isSaved
                          ? (isRTL ? "إزالة من المحفوظات" : "Remove from saved")
                          : (isRTL ? "حفظ المادة" : "Save material")}
                        className={`${btnOutline} rounded-lg gap-1 text-xs h-8 px-3 ${
                          isSaved
                            ? "border-rose-500 bg-rose-500 text-white hover:bg-rose-600 hover:text-white"
                            : "border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                        }`}
                      >
                        <Bookmark size={14} fill={isSaved ? "currentColor" : "none"} />
                        {isSaved
                          ? (isRTL ? "محفوظة" : "Saved")
                          : t("common.save", language)}
                      </button>
                      {viewMode === 'list' && (
                        <ActionsMenu
                          material={material}
                          language={language}
                          isSaved={isSaved}
                          onPreview={handlePreview}
                          onDownload={handleDownload}
                          onShare={handleShare}
                          onSave={handleToggleSave}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                        />
                      )}
                    </div>
                    <button
                      onClick={() => handleDownload(material)}
                      disabled={!getMaterialUrl(material)}
                      title={getMaterialUrl(material) ? (isRTL ? "تحميل الملف" : "Download file") : (isRTL ? "لا يوجد ملف مرتبط" : "No linked file")}
                      className={`flex-1 ${btnPrimary} rounded-xl h-10 px-5`}
                    >
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
      <MaterialFoldersDialog
        open={foldersOpen}
        onClose={() => setFoldersOpen(false)}
        folders={dialogFolders}
        subjectFolders={subjectFolders}
        activeFolder={activeFolder}
        activeSubject={selectedSubjectFilter}
        onSelectFolder={selectFolder}
        onSelectSubject={selectSubjectFolder}
      />
      {previewMaterial && (
        <MaterialPreviewDialog
          material={previewMaterial}
          onClose={() => setPreviewMaterial(null)}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
}
