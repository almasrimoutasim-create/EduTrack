import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useLanguage } from "@/lib/LanguageContext";
import { useAuth } from "@/lib/AuthContext";
import { cn } from "@/lib/utils";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { User } from "lucide-react";

export default function AppLayout() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRTL = language === "ar";

  return (
    <div className="min-h-screen bg-[#FDFCF8]" dir={isRTL ? "rtl" : "ltr"}>
      <Sidebar />
      <main className={cn(
        "min-h-screen transition-all duration-300 flex flex-col",
        isRTL ? "lg:mr-64" : "lg:ml-64"
      )}>
        {/* الشريط العلوي الثابت (Fixed Header) */}
        <header className={cn(
          "h-16 border-b border-stone-100 bg-white/80 backdrop-blur-md fixed top-0 right-0 left-0 z-30 flex items-center justify-between px-6 transition-all duration-300 no-print",
          isRTL ? "lg:mr-64" : "lg:ml-64"
        )}>
          {/* الجانب الأيمن (RTL) / الأيسر (LTR) - معلومات المستخدم */}
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 shadow-inner">
              <User size={16} />
            </div>
            <span className="text-stone-500 text-xs font-bold hidden md:inline-block">
              {isRTL ? `مرحباً، ` : `Welcome, `}
              <span className="text-stone-900 font-extrabold">{user?.full_name || (isRTL ? 'مستخدم إديوتراك' : 'EduTrack User')}</span>
            </span>
          </div>

          {/* الجانب الأيسر (RTL) / الأيمن (LTR) - زر تبديل اللغة الثابت */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-stone-400 text-[11px] font-black uppercase tracking-wider hidden sm:inline-block">
                {isRTL ? "اللغة الحالية:" : "Active Language:"}
              </span>
              <LanguageSwitcher />
            </div>
          </div>
        </header>

        {/* محتوى الصفحة الرئيسي مع حساب مسافة الشريط العلوي */}
        <div className="p-5 pt-24 lg:p-8 lg:pt-24 max-w-[1600px] w-full mx-auto flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
}