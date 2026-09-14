import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Megaphone, ArrowUpRight, Pin, AlertCircle, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/lib/LanguageContext";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";

const PRIORITY_STYLES = {
  urgent: {
    badge: "bg-red-100 text-red-700 border-red-200",
    icon: <AlertCircle className="h-3.5 w-3.5 text-red-500" />,
    bar: "bg-red-400",
    label_ar: "عاجل",
    label_en: "Urgent"
  },
  important: {
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    icon: <Pin className="h-3.5 w-3.5 text-amber-500" />,
    bar: "bg-amber-400",
    label_ar: "مهم",
    label_en: "Important"
  },
  general: {
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    icon: <Info className="h-3.5 w-3.5 text-blue-500" />,
    bar: "bg-blue-400",
    label_ar: "عام",
    label_en: "General"
  }
};

export default function AnnouncementsWidget({ announcements = [] }) {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const navigate = useNavigate();

  // Sort by priority (urgent first) then date
  const sorted = [...announcements].sort((a, b) => {
    const pOrder = { urgent: 0, important: 1, general: 2 };
    const pa = pOrder[a.priority] ?? 2;
    const pb = pOrder[b.priority] ?? 2;
    if (pa !== pb) return pa - pb;
    return new Date(b.created_at || b.date || 0) - new Date(a.created_at || a.date || 0);
  });

  const displayed = sorted.slice(0, 4);

  return (
    <Card className="p-6 border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white/70 backdrop-blur-xl overflow-hidden relative">
      {/* Background accent */}
      <div className="absolute top-0 left-0 w-28 h-28 bg-primary/5 rounded-full -translate-x-6 -translate-y-6 pointer-events-none" />

      <div className="flex items-center justify-between mb-5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Megaphone className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-base text-stone-900">
              {isRTL ? "التعميمات الرسمية" : "Official Announcements"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {announcements.length} {isRTL ? "تعميم" : "announcements"}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs font-bold text-primary hover:bg-primary/5"
          onClick={() => navigate("/announcements")}
        >
          {isRTL ? "عرض الكل" : "View All"} <ArrowUpRight size={12} className="ms-1" />
        </Button>
      </div>

      {displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
          <Megaphone className="h-12 w-12 opacity-15 mb-3" />
          <p className="text-sm font-medium">{isRTL ? "لا توجد تعميمات حالياً" : "No announcements yet"}</p>
        </div>
      ) : (
        <div className="space-y-3 relative z-10">
          <AnimatePresence>
            {displayed.map((ann, i) => {
              const priority = ann.priority || "general";
              const style = PRIORITY_STYLES[priority] || PRIORITY_STYLES.general;
              const dateStr = ann.created_at || ann.date;
              const formattedDate = dateStr
                ? format(new Date(dateStr), "d MMM", { locale: isRTL ? arSA : undefined })
                : "";

              return (
                <motion.div
                  key={ann.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex gap-3 p-3 rounded-2xl bg-stone-50/80 hover:bg-stone-100/80 transition-colors border border-stone-100 group cursor-pointer"
                  onClick={() => navigate("/announcements")}
                >
                  {/* Priority bar */}
                  <div className={`w-1 rounded-full shrink-0 self-stretch min-h-[40px] ${style.bar}`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold px-1.5 py-0.5 gap-1 ${style.badge}`}
                      >
                        {style.icon}
                        {isRTL ? style.label_ar : style.label_en}
                      </Badge>
                      {formattedDate && (
                        <span className="text-[10px] text-muted-foreground">{formattedDate}</span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-stone-800 truncate">{ann.title}</p>
                    {ann.content && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">{ann.content}</p>
                    )}
                    {ann.published_by && (
                      <p className="text-[10px] text-stone-400 mt-1">
                        {isRTL ? "بواسطة:" : "By:"} {ann.published_by}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </Card>
  );
}
