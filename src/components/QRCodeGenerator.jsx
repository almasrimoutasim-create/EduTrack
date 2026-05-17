import QRCode from "qrcode.react";
import { Download } from "lucide-react";
import { useRef } from "react";

export default function QRCodeGenerator({ value, title, size = 200 }) {
  const qrRef = useRef();

  const downloadQR = () => {
    const canvas = qrRef.current.querySelector("canvas");
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title || "qrcode"}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col items-center gap-3" ref={qrRef}>
      <div className="p-4 bg-white rounded-lg border border-border shadow-sm">
        <QRCode value={value} size={size} level="H" includeMargin={true} />
      </div>
      {title && <p className="text-sm font-medium text-center">{title}</p>}
      <button 
        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all border-2 border-stone-200 bg-white text-stone-800 hover:bg-stone-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed h-8 px-3 gap-2"
        onClick={downloadQR}
      >
        <Download className="h-4 w-4" />
        Download QR
      </button>
    </div>
  );
}