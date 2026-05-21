import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import RoleLogin from "@/pages/RoleLogin";

const PORTAL_REDIRECTS = { 
  admin: "/",
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

const isPathAllowed = (role, path) => {
  if (role === 'admin') return true;

  if (role === 'teacher') return path.startsWith('/teacher-portal');
  if (role === 'student') return path.startsWith('/student-portal') || path.startsWith('/store');
  if (role === 'parent') return path.startsWith('/parent-portal') || path.startsWith('/store');
  if (role === 'bus') return path.startsWith('/bus-supervisor');
  
  if (role === 'staff') return path.startsWith('/staff-portal');

  if (role === 'registrar') {
    return path.startsWith('/staff-portal') || 
           path.startsWith('/student-directory') || 
           path.startsWith('/attendance') || 
           path.startsWith('/attendance-summary') || 
           path.startsWith('/weekly-attendance') || 
           path.startsWith('/subjects') || 
           path.startsWith('/materials') || 
           path.startsWith('/study-rooms') || 
           path.startsWith('/room-view') || 
           path.startsWith('/activity') || 
           path.startsWith('/awards') || 
           path.startsWith('/card');
  }

  if (role === 'hr') {
    return path.startsWith('/staff-portal') || path.startsWith('/staff-control');
  }

  if (role === 'library') {
    return path.startsWith('/staff-portal') || path.startsWith('/library');
  }

  if (role === 'store') {
    return path.startsWith('/staff-portal') || path.startsWith('/store');
  }

  if (role === 'accountant') {
    return path.startsWith('/staff-portal') || path.startsWith('/finance');
  }

  return false;
};

export default function RoleGate({ children }) {
  const { user, isAuthenticated, isLoadingAuth } = useAuth();
  const [redirecting, setRedirecting] = useState(false);
  const path = window.location.pathname;

  useEffect(() => {
    if (isLoadingAuth || redirecting) return;

    if (isAuthenticated && user) {
      const userRole = user.role;
      // Validate path authorization
      if (!isPathAllowed(userRole, path)) {
        console.warn(`Unauthorized access attempt to ${path} by role: ${userRole}`);
        setRedirecting(true);
        const defaultRedirect = PORTAL_REDIRECTS[userRole] || "/";
        window.location.href = defaultRedirect;
      }
    }
  }, [isAuthenticated, user, path, isLoadingAuth, redirecting]);

  if (isLoadingAuth || redirecting) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#FDFCF8]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-400/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-semibold text-stone-600 font-sans">EduTrack | جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  // Not authenticated? Show secure portal login
  if (!isAuthenticated) {
    return <RoleLogin />;
  }

  // Authenticated & authorized? Let the children render!
  return children;
}