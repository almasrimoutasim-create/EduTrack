import React, { useEffect, useState } from "react";

const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in ms

const FounderGuard = ({ children }) => {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const isAuthed = localStorage.getItem("founder_auth") === "true";
    const loginTime = Number(localStorage.getItem("founder_login_time") || "0");
    const expired = Date.now() - loginTime > SESSION_DURATION;

    if (!isAuthed || expired) {
      localStorage.removeItem("founder_auth");
      localStorage.removeItem("founder_email");
      localStorage.removeItem("founder_login_time");
      window.location.href = "/founder-login";
      return;
    }
    setChecking(false);
  }, []);

  if (checking) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-950">
        <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return children;
};

export default FounderGuard;
