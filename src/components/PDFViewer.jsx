import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Download, X, ZoomIn, ZoomOut } from 'lucide-react';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function PDFViewer({ file_url, title, onClose }) {
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [loading, setLoading] = useState(false);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setCurrentPage(1);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-card border-b p-4 flex items-center justify-between">
        <div className="flex-1">
          <h2 className="font-semibold text-lg truncate">{title}</h2>
          <p className="text-xs text-muted-foreground">Page {currentPage} of {numPages || '...'}</p>
        </div>
        <div className="flex gap-2">
          <a href={file_url} download target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline" className="gap-2">
              <Download className="h-4 w-4" /> Download
            </Button>
          </a>
          <Button size="sm" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-background border-b p-3 flex items-center justify-center gap-2">
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => setScale(Math.max(0.5, scale - 0.2))}
          className="gap-2"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-sm min-w-16 text-center">{Math.round(scale * 100)}%</span>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => setScale(Math.min(2, scale + 0.2))}
          className="gap-2"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-2" />
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <input 
          type="number" 
          value={currentPage} 
          onChange={(e) => setCurrentPage(Math.min(numPages || currentPage, Math.max(1, parseInt(e.target.value) || 1)))}
          className="w-12 px-2 py-1 border rounded text-sm text-center"
          min="1"
          max={numPages}
        />
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => setCurrentPage(Math.min(numPages || currentPage, currentPage + 1))}
          disabled={currentPage === numPages}
          className="gap-2"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 overflow-auto bg-black flex items-center justify-center p-4">
        <Document 
          file={file_url} 
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={(error) => console.error('PDF load error:', error)}
          loading={<div className="text-white">Loading PDF...</div>}
        >
          <Page 
            pageNumber={currentPage} 
            scale={scale}
            renderTextLayer
            renderAnnotationLayer
          />
        </Document>
      </div>
    </div>
  );
}