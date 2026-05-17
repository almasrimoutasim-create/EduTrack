import QRCode from "qrcode.react";
import { Button } from "@/components/ui/button";
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
      <Button 
        size="sm" 
        variant="outline" 
        onClick={downloadQR}
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        Download QR
      </Button>
    </div>
  );
}