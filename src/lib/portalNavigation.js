// Single source of truth for "leave the current portal and land on the
// school's own portals page" (RoleLogin at /login, with the school badge).
//
// Previously every sidebar hardcoded its own destination: four of them sent
// users to a bare "/gateway", which renders the generic school-code entry
// form instead of the school's portals page. Centralising the destination
// here means no in-app exit can drift back to that dead end.

// Session teardown wipes `portal_school_slug`, and a System Admin may never
// have had one in the first place — which is exactly how the bare "/gateway"
// fallback below used to be reached. Remember the last school this browser
// reached so an exit can always rebuild a branded URL. This key is
// deliberately absent from the logout wipe list in AuthContext, so it
// outlives the session it was learned from.
const LAST_SLUG_KEY = "portal_last_school_slug";

const readSchoolSlug = () => {
  try {
    const live = (localStorage.getItem("portal_school_slug") || "").trim();
    if (live) {
      try { localStorage.setItem(LAST_SLUG_KEY, live); } catch { /* ignore */ }
      return live;
    }
    return (localStorage.getItem(LAST_SLUG_KEY) || "").trim();
  } catch {
    return "";
  }
};

// Navigate to the branded portals page, preserving the school branding.
const navigate = (slug, { replace = false } = {}) => {
  const target = slug ? `/login?school=${encodeURIComponent(slug)}` : "/login";
  if (slug) {
    // Re-apply the slug so RoleLogin can resolve the school even if the
    // caller just cleared it, and keep the durable copy in step so the next
    // exit can still find a school once this key is wiped again.
    try {
      localStorage.setItem("portal_school_slug", slug);
      localStorage.setItem(LAST_SLUG_KEY, slug);
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
 * Leave the app to a school entry point, preserving branding when we can.
 *
 * This is the ONLY function permitted to emit "/gateway", and the "/gateway"
 * branch is reachable only when no school context exists at all — in which
 * case the school-code form is the correct destination, not a dead end. When
 * a school context does exist we must never land on that generic form, so we
 * go to the school's own portals page instead.
 *
 * Use this for loose end-of-app affordances (404 "Go Home", the
 * unauthenticated lock screen) that are not tied to a specific session.
 */
export function goToSchoolEntry({ replace = false } = {}) {
  const slug = readSchoolSlug();
  if (slug) {
    navigate(slug, { replace });
    return;
  }
  if (replace) {
    window.location.replace("/gateway");
  } else {
    window.location.href = "/gateway";
  }
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
    const sessionKeys = [
      'portal_role', 'portal_user', 'portal_user_id', 'portal_user_name', 'portal_user_email',
      'portal_is_auth', 'portal_jwt_token', 'portal_gateway_passed', 'token', 'user',
      'portal_school_id', 'ind_teacher_id', 'ind_teacher_name', 'ind_teacher_email', 'ind_teacher_token', 'ind_teacher_user',
      'ind_student_id', 'ind_student_name', 'ind_student_email', 'ind_student_token', 'ind_student_user'
    ];
    sessionKeys.forEach(k => { try { localStorage.removeItem(k); } catch { /* ignore */ } });

    if (slug) {
      try {
        localStorage.setItem("portal_school_slug", slug);
        localStorage.setItem(LAST_SLUG_KEY, slug);
      } catch { /* ignore */ }
    }
  } catch {
    /* never let a storage error strand the user on the portal */
  }

  // Smoothly replace window location to the school portal / login without
  // intermediate in-place unmounting or flashing on the protected route
  const target = slug ? `/login?school=${encodeURIComponent(slug)}` : "/login";
  window.location.replace(target);
}
