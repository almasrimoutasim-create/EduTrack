/**
 * Utility to convert Google Drive links to direct /preview links
 * so textbooks open instantly in browser view mode without forcing download.
 */
export function formatDrivePreviewUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  const url = rawUrl.trim();

  // Pattern 1: https://drive.google.com/file/d/{FILE_ID}/...
  const matchFile = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (matchFile && matchFile[1]) {
    return `https://drive.google.com/file/d/${matchFile[1]}/preview`;
  }

  // Pattern 2: https://drive.google.com/open?id={FILE_ID} or uc?id={FILE_ID}
  const matchId = url.match(/drive\.google\.com\/(?:open|uc)\?(?:.*&)?id=([a-zA-Z0-9_-]+)/i);
  if (matchId && matchId[1]) {
    return `https://drive.google.com/file/d/${matchId[1]}/preview`;
  }

  // Pattern 3: docs.google.com/document/d/{ID} or presentation or spreadsheets
  const matchDocs = url.match(/docs\.google\.com\/(document|spreadsheets|presentation)\/d\/([a-zA-Z0-9_-]+)/i);
  if (matchDocs && matchDocs[1] && matchDocs[2]) {
    return `https://docs.google.com/${matchDocs[1]}/d/${matchDocs[2]}/preview`;
  }

  return url;
}

export function isGoogleDriveUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") return false;
  return /drive\.google\.com|docs\.google\.com/i.test(rawUrl);
}
