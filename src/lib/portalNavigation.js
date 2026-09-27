// Single source of truth for "leave the current portal and land on the
// school's own portals page" (RoleLogin at /login, with the school badge).
//
// Previously every sidebar hardcoded its own destination: four of them sent
// users to a bare "/gateway", which renders the generic school-code entry
// form instead of the school's portals page. Centralising the destination
// here means no in-app exit can drift back to that dead end.

const readSchoolSlug = () => {
  try {
    return (localStorage.getItem("portal_school_slug") || "").trim();
  } catch {
    return "";
  }
};

// Navigate to the branded portals page, preserving the school branding.
const navigate = (slug, { replace = false } = {}) => {
  const target = slug ? `/login?school=${encodeURIComponent(slug)}` : "/login";
  if (slug) {
    // Re-apply the slug so RoleLogin can resolve the school even if the
    // caller just cleared it.
    try {
      localStorage.setItem("portal_school_slug", slug);
    } catch {
      /* storage unavailable - fall through to the unbranded page */
    }
  }
  // `replace` avoids leaving the portal page in history, so a back press
  // cannot return the user to the screen they just left.
  if (replace) {
    window.location.replace(target);
  } else {
    window.location.href = target;
  }
};

/**
 * Leave the current portal without signing out (e.g. a "Back to portals"
 * button). Keeps the session intact.
 *
 * Callers that have already read the slug can pass it in — the session
 * teardown wipes it — together with `{ replace: true }` to suppress the
 * back-button bounce.
 */
export function goToSchoolPortals({ slug = readSchoolSlug(), replace = false } = {}) {
  navigate(slug, { replace });
}

/**
 * Sign out, then land on the branded portals page.
 *
 * `logout()` wipes `portal_school_slug`, so the slug has to be captured
 * before the session is cleared and re-applied afterwards. Pass `false` to
 * `logout` so it does not perform its own redirect, which would otherwise
 * race this one back to /gateway.
 */
export function logoutToSchoolPortals(logout) {
  const slug = readSchoolSlug();
  try {
    logout?.(false);
  } catch {
    /* never let a storage error strand the user on the portal */
  }
  navigate(slug);
}
