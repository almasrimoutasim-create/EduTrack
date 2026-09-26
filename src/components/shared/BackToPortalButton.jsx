import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { useAuth } from "@/lib/AuthContext";
import { goToSchoolPortals } from "@/lib/portalNavigation";

const PORTAL_HOMES = {
  admin: "/", teacher: "/teacher-portal", student: "/student-portal", parent: "/parent-portal",
  bus: "/staff-portal", bus_supervisor: "/staff-portal", staff: "/staff-portal", registrar: "/staff-portal",
  hr: "/staff-portal", accountant: "/staff-portal", store: "/staff-portal", store_keeper: "/staff-portal", library: "/library",
  security: "/staff-portal", counselor: "/staff-portal", counseling: "/staff-portal", support: "/staff-portal",
};

// البوابات التي محورها هو /staff-portal (الأقسام الإدارية والمساندة)
const STAFF_PORTAL_HUB = "/staff-portal";
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
  const { user } = useAuth();
  const isRTL = language === "ar";
  const portalRole = user?.role || "admin";
  const portalHome = PORTAL_HOMES[portalRole] || "/";
  const currentPath = typeof window !== "undefined" ? window.location.pathname : "/";

  const handleBack = () => {
    const ownDashboard = DASHBOARDS[portalRole];

    // داخل لوحة تحكم القسم (وليس على المحور نفسه) => الرجوع للمحور /staff-portal.
    // مهم: بعض الأدوار لوحتها هي المحور نفسه (staff / support / security)، لذلك
    // لا بد من استثناء الحالة التي يكون فيها المسار الحالي = المحور، وإلا أعاد الزر
    // توجيه المستخدم إلى الصفحة التي هو عليها فيبدو معطلاً (لا يحدث شيء عند الضغط).
    const isInsideOwnDashboard =
      STAFF_HUB_ROLES.includes(portalRole) &&
      Boolean(ownDashboard) &&
      currentPath === ownDashboard &&
      ownDashboard !== STAFF_PORTAL_HUB;

    if (isInsideOwnDashboard) {
      window.location.href = STAFF_PORTAL_HUB;
      return;
    }

    // إذا كان في الصفحة الرئيسية للبوابة (المحور نفسه)، يرجع لصفحة بوابات المدرسة
    if (currentPath === portalHome) {
      goToSchoolPortals();
      return;
    }

    // غير ذلك: يرجع لمركز البوابة الخاص به
    window.location.href = portalHome;
  };

  return (
    <button onClick={handleBack} className={`h-9 px-4 rounded-xl bg-stone-900 text-white text-xs font-black flex items-center gap-1.5 hover:bg-black transition-colors shadow-md ${className}`}>
      <ArrowLeft size={14} className={isRTL ? "" : "rotate-180"} />
      {isRTL ? "رجوع" : "Back"}
    </button>
  );
}
