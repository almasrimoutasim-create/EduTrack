import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, AlertTriangle, Activity, ArrowUpRight, Shield, User } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/lib/LanguageContext";

const BLOOD_COLORS = {
  "A+": "bg-red-100 text-red-700 border-red-200",
  "A-": "bg-red-50 text-red-600 border-red-100",
  "B+": "bg-orange-100 text-orange-700 border-orange-200",
  "B-": "bg-orange-50 text-orange-600 border-orange-100",
  "AB+": "bg-purple-100 text-purple-700 border-purple-200",
  "AB-": "bg-purple-50 text-purple-600 border-purple-100",
  "O+": "bg-blue-100 text-blue-700 border-blue-200",
  "O-": "bg-blue-50 text-blue-600 border-blue-100",
};

export default function MedicalAlertsWidget({ students = [] }) {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const navigate = useNavigate();

  const medicalStats = useMemo(() => {
    const withAllergies = students.filter(s => s.allergies && s.allergies.trim() !== "");
    const withChronic = students.filter(s => s.chronic_diseases && s.chronic_diseases.trim() !== "");
    const withMedications = students.filter(s => s.current_medications && s.current_medications.trim() !== "");

    // Blood type distribution
    const bloodTypes = {};
    students.forEach(s => {
      if (s.blood_type) {
        bloodTypes[s.blood_type] = (bloodTypes[s.blood_type] || 0) + 1;
      }
    });

    return { withAllergies, withChronic, withMedications, bloodTypes };
  }, [students]);

  const { withAllergies, withChronic, withMedications, bloodTypes } = medicalStats;
  const hasAnyAlerts = withAllergies.length > 0 || withChronic.length > 0 || withMedications.length > 0;

  return (
    <Card className="p-6 border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white/70 backdrop-blur-xl overflow-hidden relative">
      {/* Background accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full translate-x-8 -translate-y-8 pointer-events-none" />

      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-rose-500/10 flex items-center justify-center">
            <Heart className="h-5 w-5 text-rose-600" />
          </div>
          <div>
            <h3 className="font-bold text-base text-stone-900">
              {isRTL ? "التنبيهات الصحية" : "Medical Alerts"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isRTL ? `${students.length} طالب مُسجَّل` : `${students.length} students enrolled`}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50"
          onClick={() => navigate("/students")}
        >
          {isRTL ? "الطلاب" : "Students"} <ArrowUpRight size={12} className="ms-1" />
        </Button>
      </div>

      {/* Summary badges */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <motion.div
          whileHover={{ scale: 1.03 }}
          className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-center"
        >
          <AlertTriangle className="h-5 w-5 text-rose-500 mx-auto mb-1" />
          <p className="text-xl font-black text-rose-700">{withAllergies.length}</p>
          <p className="text-[10px] font-semibold text-rose-500 leading-tight">
            {isRTL ? "حساسيات" : "Allergies"}
          </p>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.03 }}
          className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-center"
        >
          <Activity className="h-5 w-5 text-amber-500 mx-auto mb-1" />
          <p className="text-xl font-black text-amber-700">{withChronic.length}</p>
          <p className="text-[10px] font-semibold text-amber-500 leading-tight">
            {isRTL ? "أمراض مزمنة" : "Chronic"}
          </p>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.03 }}
          className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-center"
        >
          <Shield className="h-5 w-5 text-blue-500 mx-auto mb-1" />
          <p className="text-xl font-black text-blue-700">{withMedications.length}</p>
          <p className="text-[10px] font-semibold text-blue-500 leading-tight">
            {isRTL ? "أدوية" : "Medications"}
          </p>
        </motion.div>
      </div>

      {/* Blood type distribution */}
      {Object.keys(bloodTypes).length > 0 && (
        <div>
          <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-3">
            {isRTL ? "فصائل الدم" : "Blood Types"}
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(bloodTypes).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
              <Badge
                key={type}
                variant="outline"
                className={`text-xs font-bold px-2.5 py-1 rounded-xl border ${BLOOD_COLORS[type] || "bg-stone-100 text-stone-600 border-stone-200"}`}
              >
                {type} × {count}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Students needing attention */}
      {hasAnyAlerts && withAllergies.length > 0 && (
        <div className="mt-5 space-y-2">
          <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">
            {isRTL ? "طلاب يحتاجون انتباهاً" : "Students Needing Attention"}
          </p>
          {withAllergies.slice(0, 3).map(s => (
            <div
              key={s.id}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-50/60 border border-rose-100 hover:bg-rose-50 transition-colors"
            >
              <div className="h-7 w-7 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <User className="h-3.5 w-3.5 text-rose-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-stone-800 truncate">{s.full_name || s.name}</p>
                <p className="text-[10px] text-rose-500 truncate">{s.allergies}</p>
              </div>
            </div>
          ))}
          {withAllergies.length > 3 && (
            <p className="text-center text-xs text-muted-foreground pt-1">
              +{withAllergies.length - 3} {isRTL ? "آخرين" : "more"}
            </p>
          )}
        </div>
      )}

      {!hasAnyAlerts && students.length === 0 && (
        <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
          <Heart className="h-10 w-10 opacity-20 mb-2" />
          <p className="text-sm font-medium">{isRTL ? "لا بيانات صحية متاحة" : "No medical data available"}</p>
        </div>
      )}
    </Card>
  );
}
