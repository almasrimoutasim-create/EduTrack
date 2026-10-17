/**
 * Resize and optimize an image file to a lightweight Data URL (WebP/JPEG)
 * so it stores persistently and reliably in PostgreSQL with zero external disk dependency.
 */
export function optimizeImageToDataUrl(file, maxWidth = 600, maxHeight = 800, quality = 0.85) {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith("image/")) {
      resolve("");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result || "");
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Try WebP first for optimal compression
        try {
          const webpData = canvas.toDataURL("image/webp", quality);
          if (webpData.startsWith("data:image/webp") && webpData.length < (e.target?.result?.length || Infinity)) {
            resolve(webpData);
            return;
          }
        } catch (_) {}

        // Fallback to JPEG
        try {
          const jpegData = canvas.toDataURL("image/jpeg", quality);
          resolve(jpegData);
        } catch (_) {
          resolve(e.target?.result || "");
        }
      };
      img.onerror = () => resolve(e.target?.result || "");
      img.src = e.target?.result;
    };
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}
