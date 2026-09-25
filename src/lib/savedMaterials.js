const STORAGE_KEY = "saved_study_materials";

/** Ids of materials the user bookmarked, as strings (localStorage is shared across sessions). */
export function readSavedMaterialIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function writeSavedMaterialIds(ids) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Storage unavailable (private mode): the in-memory state still works for this session.
  }
}
