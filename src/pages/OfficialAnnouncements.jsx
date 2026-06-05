import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { 
  Megaphone, 
  Trash2, 
  AlertTriangle, 
  Users, 
  Clock, 
  Plus, 
  Check, 
  UserCheck, 
  GraduationCap, 
  ShieldAlert,
  Send,
  Loader2,
  FileText
} from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import PageHeader from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all border-2 border-stone-200 bg-white text-stone-800 hover:bg-stone-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const btnPrimary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all bg-stone-900 text-white hover:bg-black cursor-pointer shadow-lg shadow-stone-200 disabled:opacity-50 disabled:cursor-not-allowed";

export default function OfficialAnnouncements() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const qc = useQueryClient();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState("normal");
  const [targetAudience, setTargetAudience] = useState("all");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch announcements
  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ["official-announcements"],
    queryFn: () => base44.entities.OfficialAnnouncement.list("-created_at")
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error(isRTL ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await base44.entities.OfficialAnnouncement.create({
        title,
        content,
        priority,
        target_audience: targetAudience,
        created_by: "System Admin"
      });

      toast.success(isRTL ? "تم نشر التعميم الرسمي بنجاح!" : "Official announcement published successfully!");
      setTitle("");
      setContent("");
      setPriority("normal");
      setTargetAudience("all");
      qc.invalidateQueries({ queryKey: ["official-announcements"] });
    } catch (err) {
      console.error(err);
      toast.error(isRTL ? "فشل نشر التعميم" : "Failed to publish announcement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(isRTL ? "هل أنت متأكد من حذف هذا التعميم؟" : "Are you sure you want to delete this announcement?")) return;

    try {
      await base44.entities.OfficialAnnouncement.delete(id);
      toast.success(isRTL ? "تم حذف التعميم بنجاح" : "Announcement deleted successfully");
      qc.invalidateQueries({ queryKey: ["official-announcements"] });
    } catch (err) {
      console.error(err);
      toast.error(isRTL ? "فشل حذف التعميم" : "Failed to delete announcement");
    }
  };

  const getAudienceLabel = (aud) => {
    switch (aud) {
      case "teachers":
        return isRTL ? "المعلمون" : "Teachers";
      case "students":
        return isRTL ? "الطلاب" : "Students";
      case "parents":
        return isRTL ? "أولياء الأمور" : "Parents";
      default:
        return isRTL ? "الجميع" : "All Users";
    }
  };

  return (
    <div className="space-y-10 pb-24" dir={isRTL ? "rtl" : "ltr"}>
      <PageHeader 
        title={isRTL ? "التعاميم والقرارات الرسمية" : "Official Announcements"} 
        subtitle={isRTL ? "نشر وإدارة القرارات والتعاميم الموجهة للمعلمين، الطلاب وأولياء الأمور" : "Publish and manage official decisions and circulars for teachers, students, and parents"}
      />

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-8 border-none shadow-sm bg-white rounded-[40px] flex flex-col justify-between group">
          <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Megaphone size={24} />
          </div>
          <div className="mt-4">
            <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest mb-1">{isRTL ? "إجمالي التعاميم" : "Total Circulars"}</p>
            <h4 className="text-3xl font-black text-stone-900">{announcements.length}</h4>
          </div>
        </Card>

        <Card className="p-8 border-none shadow-sm bg-white rounded-[40px] flex flex-col justify-between group">
          <div className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <ShieldAlert size={24} />
          </div>
          <div className="mt-4">
            <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest mb-1">{isRTL ? "تعاميم عاجلة نشطة" : "Active Urgent Circulars"}</p>
            <h4 className="text-3xl font-black text-rose-600">{announcements.filter(a => a.priority === "high").length}</h4>
          </div>
        </Card>

        <Card className="p-8 border-none shadow-sm bg-white rounded-[40px] flex flex-col justify-between group">
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <UserCheck size={24} />
          </div>
          <div className="mt-4">
            <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest mb-1">{isRTL ? "لأولياء الأمور" : "Targeting Parents"}</p>
            <h4 className="text-3xl font-black text-emerald-600">
              {announcements.filter(a => a.target_audience === "parents" || a.target_audience === "all").length}
            </h4>
          </div>
        </Card>

        <Card className="p-8 border-none shadow-sm bg-white rounded-[40px] flex flex-col justify-between group">
          <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <GraduationCap size={24} />
          </div>
          <div className="mt-4">
            <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest mb-1">{isRTL ? "للمعلمين" : "Targeting Teachers"}</p>
            <h4 className="text-3xl font-black text-amber-600">
              {announcements.filter(a => a.target_audience === "teachers" || a.target_audience === "all").length}
            </h4>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Create Form - 5 cols */}
        <div className="lg:col-span-5">
          <Card className="p-8 border-none shadow-sm bg-white rounded-[40px] space-y-6">
            <div>
              <h3 className="text-xl font-serif font-bold text-stone-900">{isRTL ? "نشر قرار / تعميم جديد" : "Publish New Decision"}</h3>
              <p className="text-xs text-stone-400 mt-1">{isRTL ? "أدخل تفاصيل التعميم لتظهر فوراً للفئات المستهدفة في بواباتهم الرسمية." : "Enter announcement details to display instantly in target user portals."}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-stone-500 uppercase tracking-wider">{isRTL ? "عنوان القرار / التعميم" : "Title"}</Label>
                <Input 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder={isRTL ? "مثال: تعميم بشأن الإجازة المطولة القادمة" : "e.g., Circular regarding upcoming national holiday"}
                  className="h-11 rounded-xl border-stone-200 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-stone-900/10"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-stone-500 uppercase tracking-wider">{isRTL ? "نص القرار وتفاصيله" : "Content Details"}</Label>
                <textarea 
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder={isRTL ? "اكتب محتوى وتفاصيل القرار الرسمي بالتفصيل هنا..." : "Write official announcement details here..."}
                  rows={5}
                  className="w-full p-4 rounded-xl border border-stone-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900/10 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-stone-500 uppercase tracking-wider">{isRTL ? "الفئة المستهدفة" : "Target Audience"}</Label>
                  <select 
                    value={targetAudience}
                    onChange={e => setTargetAudience(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-stone-200 text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                  >
                    <option value="all">{isRTL ? "الجميع" : "All Users"}</option>
                    <option value="teachers">{isRTL ? "المعلمون" : "Teachers"}</option>
                    <option value="students">{isRTL ? "الطلاب" : "Students"}</option>
                    <option value="parents">{isRTL ? "أولياء الأمور" : "Parents"}</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-stone-500 uppercase tracking-wider">{isRTL ? "أولوية العرض" : "Priority"}</Label>
                  <select 
                    value={priority}
                    onChange={e => setPriority(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-stone-200 text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                  >
                    <option value="normal">{isRTL ? "عادية" : "Normal"}</option>
                    <option value="high">{isRTL ? "عاجلة جداً (أولوية)" : "Urgent / High"}</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className={`${btnPrimary} w-full h-12 rounded-xl mt-2`}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send size={16} />
                    <span>{isRTL ? "نشر التعميم الرسمي" : "Publish Announcement"}</span>
                  </>
                )}
              </button>
            </form>
          </Card>
        </div>

        {/* List view - 7 cols */}
        <div className="lg:col-span-7 space-y-6">
          <h3 className="text-xl font-serif font-bold text-stone-900 px-2">{isRTL ? "التعاميم النشطة حالياً" : "Active Announcements"}</h3>
          
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="p-6 bg-white animate-pulse h-32 rounded-[30px] border-none" />
              ))}
            </div>
          ) : announcements.length === 0 ? (
            <Card className="p-16 text-center border-dashed border-2 border-stone-200 bg-stone-50/50 text-stone-400 rounded-[40px]">
              <Megaphone size={48} className="mb-4 opacity-20 mx-auto" />
              <p className="font-bold text-lg">{isRTL ? "لا توجد تعاميم أو قرارات رسمية منشورة حالياً" : "No official announcements published yet"}</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {announcements.map(ann => (
                <Card key={ann.id} className="p-6 bg-white border-none shadow-sm rounded-[30px] hover:shadow-md transition-all relative overflow-hidden group">
                  {ann.priority === "high" && (
                    <div className="absolute top-0 right-0 left-0 h-1.5 bg-rose-500" />
                  )}
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-base font-bold text-stone-900">{ann.title}</h4>
                        {ann.priority === "high" && (
                          <Badge className="bg-rose-50 text-rose-600 border-none rounded-lg text-[9px] font-black px-2 py-0.5">
                            {isRTL ? "عاجل" : "Urgent"}
                          </Badge>
                        )}
                        <Badge className="bg-stone-50 text-stone-600 border-none rounded-lg text-[9px] font-black px-2 py-0.5">
                          {getAudienceLabel(ann.target_audience)}
                        </Badge>
                      </div>
                      
                      <p className="text-stone-600 text-sm whitespace-pre-line leading-relaxed">
                        {ann.content}
                      </p>

                      <div className="flex items-center gap-4 text-[10px] text-stone-400 font-bold uppercase tracking-wider pt-2">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {ann.created_at ? new Date(ann.created_at).toLocaleDateString(isRTL ? "ar-EG" : "en-US") : ""}
                        </span>
                        <span>{isRTL ? `بواسطة: ${ann.created_by}` : `By: ${ann.created_by}`}</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleDelete(ann.id)}
                      className="text-stone-300 hover:text-rose-600 h-9 w-9 rounded-xl hover:bg-rose-50 flex items-center justify-center shrink-0 transition-all cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
