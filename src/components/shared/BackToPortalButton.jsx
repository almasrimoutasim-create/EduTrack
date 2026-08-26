import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

const PORTAL_HOMES = {
  admin: "/", teacher: "/teacher-portal", student: "/student-portal", parent: "/parent-portal",
  bus: "/staff-portal", bus_supervisor: "/staff-portal", staff: "/staff-portal", registrar: "/staff-portal",
  hr: "/staff-portal", accountant: "/staff-portal", store: "/staff-portal", store_keeper: "/staff-portal", library: "/library",
  security: "/staff-portal", counselor: "/staff-portal", counseling: "/staff-portal", support: "/staff-portal",
};

// البوابات التي محورها هو /staff-portal (الأقسام الإدارية والمساندة)
const STAFF_HUB_ROLES = ["registrar", "bus", "bus_supervisor", "store", "store_keeper", "security", "hr", "accountant", "counselor", "counseling", "staff", "support"];
const DASHBOARDS = {
  registrar: "/student-directory",
  bus: "/bus-supervisor", bus_supervisor: "/bus-supervisor",
  store: "/store", store_keeper: "/store",
  security: "/staff-portal",
  hr: "/staff-control", accountant: "/finance", counselor: "/counseling", counseling: "/counseling",
  staff: "/staff-portal", support: "/staff-portal",
};

export default function BackToPortalButton({ className = "" }) {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const portalRole = (typeof window !== "undefined" ? localStorage.getItem("portal_role") : null) || "admin";
  const portalHome = PORTAL_HOMES[portalRole] || "/";
  const currentPath = typeof window !== "undefined" ? window.location.pathname : "/";

  const handleBack = () => {
    // إذا كان من بوابات الأقسام الإدارية وهو في لوحة تحكمه الخاصة، الرجوع يكون للمحور /staff-portal
    if (STAFF_HUB_ROLES.includes(portalRole) && DASHBOARDS[portalRole] && currentPath === DASHBOARDS[portalRole]) {
      window.location.href = "/staff-portal";
      return;
    }
    if (currentPath === portalHome) {
      localStorage.removeItem("portal_user");
      localStorage.removeItem("portal_is_auth");
      localStorage.removeItem("portal_jwt_token");
      localStorage.removeItem("portal_role");
      localStorage.removeItem("portal_user_id");
      localStorage.removeItem("portal_user_name");
      window.location.reload();
    } else {
      window.location.href = portalHome;
    }
  };

  return (
    <button onClick={handleBack} className={`h-9 px-4 rounded-xl bg-stone-900 text-white text-xs font-black flex items-center gap-1.5 hover:bg-black transition-colors shadow-md ${className}`}>
      <ArrowLeft size={14} className={isRTL ? "" : "rotate-180"} />
      {isRTL ? "رجوع" : "Back"}
    </button>
  );
}
