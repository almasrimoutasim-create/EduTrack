import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useBranch } from "@/lib/BranchContext";
import { useLanguage } from "@/lib/LanguageContext";
import {
  Building2,
  ChevronDown,
  Layers,
  MapPin,
  Plus,
  Check,
  Building,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function BranchSelector() {
  const { branches, activeBranchId, activeBranch, setActiveBranchId, isConsolidated } = useBranch();
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-right" ref={dropdownRef} dir={isRTL ? "rtl" : "ltr"}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "inline-flex items-center gap-2 h-9 px-3 rounded-xl border transition-all duration-200 cursor-pointer text-xs font-bold shadow-xs select-none",
          isConsolidated
            ? "bg-stone-50 border-stone-200/90 text-stone-800 hover:bg-stone-100 hover:border-stone-300"
            : "bg-emerald-50/80 border-emerald-200 text-emerald-900 hover:bg-emerald-100/70"
        )}
        title={isRTL ? "تحديد الفرع النشط أو العرض الشامل" : "Select Active Branch or Consolidated View"}
      >
        {isConsolidated ? (
          <div className="w-5 h-5 rounded-lg bg-stone-200/70 text-stone-700 flex items-center justify-center shrink-0">
            <Layers className="w-3.5 h-3.5" />
          </div>
        ) : (
          <div className="w-5 h-5 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Building2 className="w-3.5 h-3.5" />
          </div>
        )}

        <div className="flex flex-col text-right leading-tight max-w-[150px] sm:max-w-[200px] truncate">
          <span className="text-[10px] text-stone-400 font-medium">
            {isRTL ? "الفرع الحالي:" : "Active Branch:"}
          </span>
          <span className="font-extrabold truncate">
            {isConsolidated
              ? isRTL
                ? "جميع الفروع (شامل)"
                : "All Branches (Consolidated)"
              : activeBranch?.name || (isRTL ? "فرع محدد" : "Selected Branch")}
          </span>
        </div>

        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-stone-400 transition-transform duration-200 shrink-0",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={cn(
            "absolute mt-2 w-72 sm:w-80 rounded-2xl bg-white border border-stone-200/80 shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150",
            isRTL ? "right-0" : "left-0"
          )}
        >
          {/* Header */}
          <div className="px-4 py-2.5 border-b border-stone-100 bg-stone-50/40 flex items-center justify-between">
            <div className="flex items-center gap-2 text-stone-800 font-black text-sm">
              <Building className="w-4 h-4 text-emerald-600" />
              <span>{isRTL ? "فروع المؤسسة التعليمية" : "School Branches"}</span>
            </div>
            <span className="text-[11px] font-medium text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
              {branches.length} {isRTL ? "فرع" : "branch"}
            </span>
          </div>

          <div className="p-2 space-y-1.5 max-h-72 overflow-y-auto">
            {/* Consolidated View Option */}
            <button
              type="button"
              onClick={() => {
                setActiveBranchId("all");
                setIsOpen(false);
              }}
              className={cn(
                "w-full flex items-center justify-between px-3 py-3 rounded-xl text-xs font-bold transition-all text-right cursor-pointer",
                isConsolidated
                  ? "bg-stone-900 text-white shadow-xs"
                  : "text-stone-600 hover:bg-stone-50"
              )}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                    isConsolidated ? "bg-white/20 text-white" : "bg-stone-100 text-stone-600"
                  )}
                >
                  <Layers className="w-4 h-4" />
                </div>
                <div className="flex flex-col text-right">
                  <span className="font-black text-xs">
                    {isRTL ? "جميع الفروع (نظرة شاملة)" : "All Branches (Consolidated)"}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] leading-tight mt-0.5",
                      isConsolidated ? "text-stone-400" : "text-stone-400"
                    )}
                  >
                    {isRTL
                      ? "عرض موحد لكافة الطلاب والمعلمين والماليات"
                      : "Combined overview of all students, teachers, and finances"}
                  </span>
                </div>
              </div>
              {isConsolidated && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
            </button>

            {/* Branches List */}
            {branches.map((branch) => {
              const isSelected = activeBranchId === branch.id;
              return (
                <button
                  key={branch.id}
                  type="button"
                  onClick={() => {
                    setActiveBranchId(branch.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-3 rounded-xl text-xs font-bold transition-all text-right cursor-pointer",
                    isSelected
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-stone-700 hover:bg-stone-50"
                  )}
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm font-black",
                        isSelected
                          ? "bg-white/25 text-white shadow-sm"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                      )}
                    >
                      {branch.name.charAt(0)}
                    </div>
                    <div className="flex flex-col text-right flex-1 min-w-0">
                      {/* Branch Name Line - clear and prominent */}
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-sm truncate">{branch.name}</span>
                        {branch.is_main && (
                          <span
                            className={cn(
                              "text-[9px] font-semibold px-1.5 py-0.5 rounded-md shrink-0 leading-tight",
                              isSelected
                                ? "bg-white/25 text-white"
                                : "bg-amber-100 text-amber-700 border border-amber-200/50"
                            )}
                          >
                            {isRTL ? "الرئيسي" : "Main"}
                          </span>
                        )}
                      </div>
                      {/* Sub-details Line - clearly separated with proper spacing */}
                      <div className="flex items-center gap-1 text-[10px] text-stone-400 mt-0.5">
                        {branch.city && (
                          <span className="flex items-center gap-0.5">
                            <MapPin className="w-2.5 h-2.5" />
                            {branch.city}
                          </span>
                        )}
                        {branch.director_name && (
                          <span className="text-stone-300">•</span>
                        )}
                        {branch.director_name && (
                          <span>{branch.director_name}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-white shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Separator */}
          <div className="h-px bg-stone-100 mx-4" />

          {/* Footer Action - visually separated as a distinct action */}
          <div className="p-2 bg-stone-50/70">
            <Link
              to="/branches"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-900 border border-emerald-200/50 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isRTL ? "إدارة الفروع وإضافة فرع جديد" : "Manage & Add Branches"}</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
