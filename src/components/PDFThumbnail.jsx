import { BookOpen } from "lucide-react";

export default function PDFThumbnail({ url, title }) {
  return (
    <div className="relative w-full h-40 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg overflow-hidden border border-blue-200 flex items-center justify-center">
      <div className="text-center">
        <BookOpen className="h-12 w-12 text-blue-400 mx-auto mb-2" />
        <p className="text-xs text-blue-600 font-medium line-clamp-2">{title}</p>
      </div>
    </div>
  );
}