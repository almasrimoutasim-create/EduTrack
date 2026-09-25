import { lazy, Suspense, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, FileQuestion } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { getMaterialUrl, getPreviewKind } from "@/lib/materialFile";

// Loaded on demand so the pdf.js bundle is not paid for on every page visit.
const PDFViewer = lazy(() => import("@/components/PDFViewer"));

/**
 * Previews one study material according to its kind:
 * PDFs use the full-screen PDFViewer, videos/images render inline,
 * notes show their text, and anything else falls back to open/download.
 */
export default function MaterialPreviewDialog({ material, onClose, onDownload }) {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const [pdfFailed, setPdfFailed] = useState(false);

  if (!material) return null;

  const url = getMaterialUrl(material);
  const kind = getPreviewKind(material);
  const title = material.title || (isRTL ? "معاينة الملف" : "File Preview");
  const subtitle = [material.subject_name, material.teacher_name].filter(Boolean).join(" • ");

  // PDFs get the dedicated full-screen viewer; it needs no dialog chrome around it.
  if (kind === "pdf" && !pdfFailed) {
    return (
      <Suspense
        fallback={
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 text-sm text-white">
            {isRTL ? "جاري تحميل عارض PDF..." : "Loading PDF viewer..."}
          </div>
        }
      >
        <PDFViewer
          file_url={url}
          title={title}
          onClose={onClose}
          onError={() => setPdfFailed(true)}
        />
      </Suspense>
    );
  }

  const showExternalFallback = kind === "link" || pdfFailed;

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        dir={isRTL ? "rtl" : "ltr"}
        className="max-w-3xl w-[92vw] max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {subtitle || (isRTL ? "معاينة المادة الدراسية" : "Study material preview")}
          </DialogDescription>
        </DialogHeader>

        {kind === "video" && (
          <video
            src={url}
            controls
            autoPlay
            playsInline
            className="w-full max-h-[60vh] rounded-xl bg-black"
          />
        )}

        {kind === "image" && (
          <img
            src={url}
            alt={title}
            className="mx-auto max-h-[60vh] rounded-xl object-contain"
          />
        )}

        {kind === "note" && (
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-5 text-sm leading-7 whitespace-pre-wrap text-stone-700">
            {material.content}
          </div>
        )}

        {kind === "none" && (
          <p className="rounded-xl border border-stone-200 bg-stone-50 p-6 text-center text-sm text-stone-500">
            {isRTL ? "لا يوجد ملف أو محتوى مرتبط بهذه المادة." : "This material has no linked file or content."}
          </p>
        )}

        {showExternalFallback && (
          <div className="space-y-4 rounded-xl border border-stone-200 bg-stone-50 p-6 text-center">
            <FileQuestion className="mx-auto h-10 w-10 text-stone-400" />
            <p className="text-sm text-stone-600">
              {pdfFailed
                ? (isRTL ? "تعذّر عرض الملف داخل الصفحة." : "The file could not be rendered in-page.")
                : (isRTL ? "هذا النوع من الملفات لا يُعاين داخل المتصفح." : "This file type can't be previewed inside the browser.")}
            </p>
            <p className="break-all text-xs text-stone-400" dir="ltr">{url}</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild variant="outline" className="gap-2">
                <a href={url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink size={16} />
                  {isRTL ? "فتح في نافذة جديدة" : "Open in new tab"}
                </a>
              </Button>
              <Button type="button" className="gap-2" onClick={() => onDownload?.(material)}>
                <Download size={16} />
                {isRTL ? "تحميل" : "Download"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
