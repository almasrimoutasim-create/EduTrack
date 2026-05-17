import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useLanguage } from "@/lib/LanguageContext";
import { cn } from "@/lib/utils";

export default function AppLayout() {
  const { language } = useLanguage();
  const isRTL = language === "ar";

  return (
    <div className="min-h-screen bg-[#FDFCF8]" dir={isRTL ? "rtl" : "ltr"}>
      <Sidebar />
      <main className={cn(
        "min-h-screen transition-all duration-300",
        isRTL ? "lg:mr-64" : "lg:ml-64"
      )}>
        <div className="p-5 pt-16 lg:p-8 lg:pt-8 max-w-[1600px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}