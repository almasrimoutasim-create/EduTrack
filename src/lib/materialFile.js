const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "avif"];
const VIDEO_EXTENSIONS = ["mp4", "webm", "ogg", "ogv", "mov", "m4v"];

/** The address a material actually points at: uploaded file first, external link second. */
export function getMaterialUrl(material) {
  return (material?.file_url || material?.external_url || "").trim();
}

function getUrlExtension(url) {
  try {
    const { pathname } = new URL(url, window.location.href);
    const dotIndex = pathname.lastIndexOf(".");
    if (dotIndex === -1) return "";
    const ext = pathname.slice(dotIndex + 1).toLowerCase();
    return /^[a-z0-9]{1,5}$/.test(ext) ? ext : "";
  } catch {
    return "";
  }
}

/** Concatenated type hints stored on the row (only some schemas fill them). */
function getMaterialTypeHint(material) {
  return `${material?.type || ""} ${material?.file_type || ""} ${material?.mime_type || ""}`.toLowerCase();
}

/** Download name derived from the title plus the URL extension. */
export function getMaterialFileName(material, url) {
  const ext = getUrlExtension(url);
  const base = (material?.title || "material").replace(/[\\/:*?"<>|]+/g, "_").trim() || "material";
  if (ext && !base.toLowerCase().endsWith(`.${ext}`)) return `${base}.${ext}`;
  return base;
}

/**
 * How a material can be previewed in the browser:
 * "pdf" | "video" | "image" | "note" (text content only) |
 * "link" (open/download in a new tab) | "none" (nothing to show).
 */
export function getPreviewKind(material) {
  const url = getMaterialUrl(material);
  const typeHint = getMaterialTypeHint(material);

  if (!url) return material?.content ? "note" : "none";

  const ext = getUrlExtension(url);
  if (ext === "pdf" || typeHint.includes("pdf")) return "pdf";
  if (VIDEO_EXTENSIONS.includes(ext) || typeHint.includes("video")) return "video";
  if (IMAGE_EXTENSIONS.includes(ext) || typeHint.includes("image")) return "image";
  if (typeHint.includes("note") && material?.content) return "note";
  return "link";
}
