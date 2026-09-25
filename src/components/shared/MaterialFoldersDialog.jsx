import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/lib/LanguageContext";
import {
  FolderOpen,
  Folder,
  Bookmark,
  FileText,
  FileVideo,
  Image as ImageIcon,
  StickyNote,
  Link2,
} from "lucide-react";

/** Non-subject folders offered by the dialog; `kind` maps to getPreviewKind(). */
export const MATERIAL_FOLDERS = [
  { id: "all", kind: null, icon: FolderOpen, labelAr: "جميع الملفات", labelEn: "All Files" },
  { id: "saved", kind: null, icon: Bookmark, labelAr: "المحفوظة", labelEn: "Saved" },
  { id: "pdf", kind: "pdf", icon: FileText, labelAr: "ملفات PDF", labelEn: "PDF Files" },
  { id: "video", kind: "video", icon: FileVideo, labelAr: "فيديوهات", labelEn: "Videos" },
  { id: "image", kind: "image", icon: ImageIcon, labelAr: "صور", labelEn: "Images" },
  { id: "note", kind: "note", icon: StickyNote, labelAr: "ملاحظات", labelEn: "Notes" },
  { id: "link", kind: "link", icon: Link2, labelAr: "روابط وأخرى", labelEn: "Links & Other" },
];

/**
 * Folder browser over the user's materials:
 * smart folders (saved / by type) plus one folder per subject.
 * Picking a folder delegates to the parent, which owns the filter state.
 */
export default function MaterialFoldersDialog({
  open,
  onClose,
  folders,
  subjectFolders,
  activeFolder,
  activeSubject,
  onSelectFolder,
  onSelectSubject,
}) {
  const { language } = useLanguage();
  const isRTL = language === "ar";

  const renderCard = ({ id, icon: Icon, label, count, isActive, onClick }) => (
    <button
      key={id}
      onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-xl border text-start cursor-pointer transition-all ${
        isActive
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50"
      }`}
    >
      <span
        className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
          isActive ? "bg-primary text-white" : "bg-stone-100 text-stone-500"
        }`}
      >
        <Icon size={16} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-bold text-stone-800 truncate">{label}</span>
        <span className="block text-[10px] font-semibold text-stone-400 num-en">{count}</span>
      </span>
    </button>
  );

  const sectionTitle = (label) => (
    <p className="text-[10px] font-bold uppercase tracking-wide text-stone-400 mb-2">{label}</p>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto" dir={isRTL ? "rtl" : "ltr"}>
        <DialogHeader>
          <DialogTitle>{isRTL ? "مجلداتي" : "My Folders"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          <div>
            {sectionTitle(isRTL ? "الوصول السريع" : "Quick Access")}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {folders.map((f) =>
                renderCard({
                  ...f,
                  isActive: f.id === "all"
                    ? activeFolder === "all" && activeSubject === "all"
                    : activeFolder === f.id,
                  onClick: () => onSelectFolder(f.id),
                })
              )}
            </div>
          </div>

          <div>
            {sectionTitle(isRTL ? "مجلدات المواد" : "Subject Folders")}
            {subjectFolders.length === 0 ? (
              <p className="text-xs text-stone-400 font-medium">
                {isRTL ? "لا توجد مواد بعد لإنشاء المجلدات" : "No materials yet to build folders from"}
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {subjectFolders.map((f) =>
                  renderCard({
                    ...f,
                    icon: Folder,
                    isActive: activeSubject === f.subject,
                    onClick: () => onSelectSubject(f.subject),
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
