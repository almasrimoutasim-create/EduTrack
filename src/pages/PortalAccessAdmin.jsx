import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { entities } from "@/api/dbClient";
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Lock, 
  Key, 
  Globe, 
  Clock,
  ShieldAlert,
  UserCheck,
  Settings,
  Terminal
} from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import PageHeader from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all border-2 border-stone-200 bg-white text-stone-800 hover:bg-stone-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const btnPrimary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all bg-stone-900 text-white hover:bg-black cursor-pointer shadow-lg shadow-stone-200 disabled:opacity-50 disabled:cursor-not-allowed";

export default function PortalAccessAdmin() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const [searchTerm, setSearchTerm] = useState("");

  const { data: users = [], isLoading } = useQuery({ 
    queryKey: ["portal-users"], 
    queryFn: () => entities.StaffMember.list("-created_date", 50) 
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  return (
    <div className="space-y-10 pb-24" dir={isRTL ? "rtl" : "ltr"}>
      <PageHeader 
        title={isRTL ? "إدارة الوصول والصلاحيات" : "Access & Permissions"} 
        subtitle={isRTL ? "التحكم في مستويات الوصول للمستخدمين وتأمين بوابات النظام" : "Control user access levels and secure system portals"}
      >
        <div className="flex gap-3">
          <button className={`${btnOutline} rounded-full h-12 px-6`}>
            <ShieldAlert size={18} />
            {isRTL ? "سجل الأمان" : "Security Log"}
          </button>
          <button className={`${btnPrimary} rounded-full h-12 px-6`}>
            <Key size={18} />
            {isRTL ? "تحديث التشفير" : "Rotate Keys"}
          </button>
        </div>
      </PageHeader>

      {/* Security Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-2 p-8 bg-gradient-to-br from-indigo-900 to-indigo-800 text-white rounded-[40px] shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
                <ShieldCheck size={32} className="text-emerald-400" />
              </div>
              <div>
                <h4 className="text-2xl font-serif font-bold">{isRTL ? "حالة النظام" : "System Status"}</h4>
                <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">{isRTL ? "آمن تماماً" : "Fully Secure"}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-6">
              {[
                { label: isRTL ? "المنافذ المفتوحة" : "Open Ports", value: "٤", color: "text-blue-400" },
                { label: isRTL ? "محاولات الدخول" : "Login Hits", value: "١.٢ك", color: "text-white" },
                { label: isRTL ? "نشاط مريب" : "Threats", value: "٠", color: "text-emerald-400" },
              ].map((stat, i) => (
                <div key={i}>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute top-0 right-0 p-10 opacity-5">
            <Terminal size={150} />
          </div>
        </Card>

        {[
          { label: isRTL ? "حسابات نشطة" : "Active Users", value: "٤٢", icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: isRTL ? "بوابات مفعلة" : "Active Portals", value: "٦/٦", icon: Globe, color: "text-blue-600", bg: "bg-blue-50" },
        ].map((stat, i) => (
          <Card key={i} className="p-8 border-none shadow-sm bg-white rounded-[40px] flex flex-col justify-between group">
            <div className={`h-14 w-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center group-hover:rotate-12 transition-transform`}>
              <stat.icon size={28} />
            </div>
            <div>
              <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest mb-1">{stat.label}</p>
              <h4 className="text-3xl font-black text-stone-900">{stat.value}</h4>
            </div>
          </Card>
        ))}
      </div>

      {/* User Access Control Table */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <Card className="p-2 border-none shadow-sm bg-white rounded-[24px] flex-1 md:w-96">
              <div className="relative">
                <Search className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-stone-300`} size={18} />
                <Input 
                  placeholder={isRTL ? "بحث عن مستخدم..." : "Search user..."} 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`h-10 ${isRTL ? 'pr-12' : 'pl-12'} border-none bg-transparent text-sm font-medium focus-visible:ring-0`}
                />
              </div>
            </Card>
            <button className={`${btnOutline} h-14 px-6 rounded-2xl`}>
              <Filter size={18} />
              {isRTL ? "تصفية الأدوار" : "Role Filter"}
            </button>
          </div>
        </div>

        <Card className="border-none shadow-sm rounded-[40px] bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right" dir={isRTL ? "rtl" : "ltr"}>
              <thead>
                <tr className="bg-stone-50/50 border-b border-stone-100">
                  <th className="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-widest">{isRTL ? "المستخدم" : "User"}</th>
                  <th className="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-widest">{isRTL ? "الدور" : "Role"}</th>
                  <th className="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-widest">{isRTL ? "آخر دخول" : "Last Active"}</th>
                  <th className="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">{isRTL ? "الحالة" : "Status"}</th>
                  <th className="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">{isRTL ? "الوصول" : "Access"}</th>
                  <th className="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-widest"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {isLoading ? (
                  [1,2,3,4,5].map(i => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="px-8 py-6 h-16 bg-stone-50/50" />
                    </tr>
                  ))
                ) : users.map((user, i) => (
                  <tr key={user.id} className="hover:bg-stone-50/30 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-stone-100 flex items-center justify-center font-bold text-stone-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                          {(user.full_name || user.name)?.[0]}
                        </div>
                        <div>
                          <span className="text-sm font-bold text-stone-900 block">{user.full_name || user.name}</span>
                          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{user.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <Badge className="bg-stone-50 text-stone-600 border-none rounded-lg text-[9px] font-black px-2 py-0.5">
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 text-xs font-bold text-stone-500">
                        <Clock size={14} className="text-stone-300" />
                        {isRTL ? "منذ ٢ دقيقة" : "2m ago"}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{isRTL ? "متصل" : "Online"}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className="flex justify-center">
                        <Switch defaultChecked={i < 4} />
                      </div>
                    </td>
                    <td className="px-8 py-5 text-left">
                      <div className="flex items-center justify-end gap-2">
                        <button className={`${btnOutline} rounded-xl gap-1 text-xs h-8 px-3`}>
                          <Settings size={14} />
                          {t("common.settings", language) || "إعدادات"}
                        </button>
                        <button className={`${btnOutline} rounded-xl gap-1 text-xs h-8 px-3 border-rose-200 hover:bg-rose-50 hover:text-rose-600`}>
                          <Lock size={14} />
                          {t("common.lock", language) || "قفل"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-6 bg-stone-50/50 border-t border-stone-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-500" />
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "جميع الشهادات صالحة" : "All SSL Certificates Valid"}</p>
            </div>
            <button className="text-indigo-600 font-bold text-xs hover:bg-indigo-50 rounded-xl px-4 py-2 cursor-pointer">
              {isRTL ? "تحميل سجل الوصول الكامل" : "Download Full Access Log"}
            </button>
          </div>
        </Card>
      </section>
    </div>
  );
}