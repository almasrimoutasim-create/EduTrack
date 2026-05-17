import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Camera, X } from "lucide-react";
import jsQR from "jsqr";

export default function QRCodeScanner({ onScan, isOpen, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (!isOpen || !videoRef.current) return;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }
        });
        videoRef.current.srcObject = stream;
        setScanning(true);
        scanQRCode();
      } catch (err) {
        alert("Camera access denied or not available");
      }
    };

    const scanQRCode = async () => {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      
      const scan = () => {
        if (videoRef.current?.readyState === videoRef.current?.HAVE_ENOUGH_DATA) {
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          context.drawImage(videoRef.current, 0, 0);
          
          try {
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            if (code) {
              onScan(code.data);
              stopCamera();
              onClose();
            }
          } catch (err) {
            // Continue scanning
          }
        }
        if (scanning) requestAnimationFrame(scan);
      };
      scan();
    };

    startCamera();

    return () => stopCamera();
  }, [isOpen, scanning, onScan, onClose]);

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setScanning(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Scan QR Code
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <video 
            ref={videoRef} 
            className="w-full rounded-lg bg-black"
            autoPlay
            playsInline
          />
          <canvas ref={canvasRef} className="hidden" />
          <p className="text-sm text-muted-foreground text-center">
            Point your camera at a QR code to scan
          </p>
          <button 
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all border-2 border-stone-200 bg-white text-stone-800 hover:bg-stone-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed w-full h-11 px-4 gap-2"
            onClick={() => { stopCamera(); onClose(); }} 
          >
            <X className="h-4 w-4" />
            Cancel
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}