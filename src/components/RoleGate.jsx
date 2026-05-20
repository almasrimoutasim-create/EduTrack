import { useState, useEffect } from "react";
import RoleLogin from "@/pages/RoleLogin";

const PORTAL_PATHS = [
  "/teacher-portal", 
  "/student-portal", 
  "/parent-portal", 
  "/bus-supervisor", 
  "/staff-portal",
  "/student-directory",
  "/staff-control",
  "/finance",
  "/store",
  "/library"
];
const PORTAL_REDIRECTS = { 
  teacher: "/teacher-portal", 
  student: "/student-portal", 
  parent: "/parent-portal",
  bus: "/bus-supervisor",
  staff: "/staff-portal",
  registrar: "/student-directory",
  hr: "/staff-control",
  accountant: "/finance",
  store: "/store",
  library: "/library"
};

export default function RoleGate({ children }) {
  const [role, setRole] = useState(null);
  const [checked, setChecked] = useState(false);
  const path = window.location.pathname;

  useEffect(() => {
    // If already on a portal page, no gate needed
    if (PORTAL_PATHS.some(p => path.startsWith(p))) {
      setChecked(true);
      return;
    }
    const stored = localStorage.getItem("portal_role");
    setRole(stored);
    setChecked(true);
  }, []);

  if (!checked) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-900">
        <div className="w-8 h-8 border-4 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
      </div>
    );
  }

  // Portal pages bypass the gate
  if (PORTAL_PATHS.some(p => path.startsWith(p))) return children;

  // No role → show login
  if (!role) {
    return (
      <RoleLogin
        onLogin={(selectedRole) => {
          if (PORTAL_REDIRECTS[selectedRole]) {
            window.location.href = PORTAL_REDIRECTS[selectedRole];
          } else {
            // admin → just re-render (base44 auth will handle it)
            setRole("admin");
          }
        }}
      />
    );
  }

  // Non-admin with stored role → redirect to their portal
  if (role !== "admin" && PORTAL_REDIRECTS[role]) {
    window.location.href = PORTAL_REDIRECTS[role];
    return null;
  }

  // Admin → show the full app
  return children;
}