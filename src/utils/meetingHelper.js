/**
 * Ensures meeting URLs (Google Meet, Zoom, etc.) have an absolute http/https protocol.
 * If a teacher pastes "meet.google.com/abc-xyz" or "zoom.us/j/123", this prepends "https://"
 * so that anchor links <a href="..."> and window.open do not treat it as a relative app path.
 */
export function formatMeetingUrl(url) {
  if (!url) return "";
  const trimmed = String(url).trim();
  if (!trimmed) return "";
  // Already has protocol or is an internal route starting with '/'
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("/")) {
    return trimmed;
  }
  // If it's a domain-like string (contains dot and no spaces)
  if (trimmed.includes(".") && !trimmed.includes(" ")) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

/**
 * Returns platform info and badge styling for a meeting URL.
 */
export function getMeetingPlatform(url, isRTL = true) {
  if (!url) return null;
  const lower = String(url).toLowerCase();
  if (lower.includes("meet.google.com") || lower.includes("google.com/meet")) {
    return { name: "Google Meet", type: "meet", color: "bg-amber-50 text-amber-800 border-amber-200" };
  }
  if (lower.includes("zoom.us") || lower.includes("zoom.com")) {
    return { name: "Zoom", type: "zoom", color: "bg-blue-50 text-blue-700 border-blue-200" };
  }
  if (lower.includes("teams.microsoft.com")) {
    return { name: "MS Teams", type: "teams", color: "bg-indigo-50 text-indigo-700 border-indigo-200" };
  }
  return { name: isRTL ? "اجتماع مباشر" : "Live Meeting", type: "general", color: "bg-teal-50 text-teal-700 border-teal-200" };
}
