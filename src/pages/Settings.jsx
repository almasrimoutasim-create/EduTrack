import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { entities } from '@/api/dbClient';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';
import { Settings as SettingsIcon, Save, Image as ImageIcon, Building2, Globe } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function Settings() {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const queryClient = useQueryClient();
  const { checkAppState } = useAuth(); // To refresh global settings after save

  const [formData, setFormData] = useState({
    school_name_ar: '',
    school_name_en: '',
    school_logo: ''
  });

  const { data: settingsList, isLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: () => entities.SystemSetting.list("-created_at", 1)
  });

  const existingSettings = settingsList && settingsList.length > 0 ? settingsList[0] : null;

  useEffect(() => {
    if (existingSettings) {
      setFormData({
        school_name_ar: existingSettings.school_name_ar || '',
        school_name_en: existingSettings.school_name_en || '',
        school_logo: existingSettings.school_logo || ''
      });
    }
  }, [existingSettings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (existingSettings?.id) {
        return await entities.SystemSetting.update(existingSettings.id, formData);
      } else {
        return await entities.SystemSetting.create(formData);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      await checkAppState(); // Update context globally
      toast.success(isRTL ? 'تم حفظ الإعدادات بنجاح!' : 'Settings saved successfully!');
    },
    onError: (err) => {
      toast.error(isRTL ? 'حدث خطأ أثناء حفظ الإعدادات.' : 'Error saving settings.');
      console.error(err);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate();
  };

  const btnPrimary = "inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-white hover:bg-primary/95 transition-all shadow-md hover:shadow-lg font-bold text-sm cursor-pointer";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="pb-20 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <PageHeader 
        title={isRTL ? "إعدادات النظام" : "System Settings"}
        subtitle={isRTL ? "إدارة اسم وشعار المدرسة والمطبوعات" : "Manage school name, logo and printout settings"}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-stone-200/80 rounded-2xl p-6 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-stone-100 pb-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <SettingsIcon size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black font-display text-stone-900">
                  {isRTL ? "إعدادات الهوية والمطبوعات" : "Identity & Print Settings"}
                </h2>
                <p className="text-sm text-stone-500 font-medium mt-0.5">
                  {isRTL ? "ستظهر هذه البيانات في ترويسة التقارير والفواتير" : "This data will appear in the header of reports and invoices"}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-stone-700 flex items-center gap-2">
                    <Building2 size={16} className="text-stone-400" />
                    {isRTL ? "اسم المدرسة (بالعربية)" : "School Name (Arabic)"}
                  </label>
                  <Input 
                    required
                    value={formData.school_name_ar}
                    onChange={(e) => setFormData({...formData, school_name_ar: e.target.value})}
                    placeholder={isRTL ? "مدارس إديوتراك النموذجية الخاصة" : "EduTrack Model School"}
                    className="h-12 bg-stone-50 border-stone-200 focus:bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-stone-700 flex items-center gap-2">
                    <Globe size={16} className="text-stone-400" />
                    {isRTL ? "اسم المدرسة (باللغة الإنجليزية)" : "School Name (English)"}
                  </label>
                  <Input 
                    required
                    value={formData.school_name_en}
                    onChange={(e) => setFormData({...formData, school_name_en: e.target.value})}
                    placeholder="EduTrack Model School"
                    className="h-12 bg-stone-50 border-stone-200 focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-stone-700 flex items-center gap-2">
                  <ImageIcon size={16} className="text-stone-400" />
                  {isRTL ? "رابط شعار المدرسة (Logo URL)" : "School Logo URL"}
                </label>
                <Input 
                  value={formData.school_logo}
                  onChange={(e) => setFormData({...formData, school_logo: e.target.value})}
                  placeholder="https://example.com/logo.png"
                  className="h-12 bg-stone-50 border-stone-200 focus:bg-white"
                  dir="ltr"
                />
                <p className="text-xs text-stone-500 font-medium mt-1">
                  {isRTL 
                    ? "أدخل رابطاً مباشراً للصورة (URL). إذا تُرك فارغاً سيظهر نص اسم المدرسة كبديل." 
                    : "Enter a direct image URL. If left empty, the school name text will be shown as fallback."}
                </p>
              </div>

              <div className="pt-4 flex justify-end">
                <button 
                  type="submit" 
                  disabled={saveMutation.isPending}
                  className={btnPrimary}
                >
                  <Save size={18} />
                  <span>{saveMutation.isPending ? (isRTL ? "جاري الحفظ..." : "Saving...") : (isRTL ? "حفظ الإعدادات" : "Save Settings")}</span>
                </button>
              </div>
            </form>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card className="border border-stone-200/80 rounded-2xl p-6 bg-white shadow-sm space-y-4">
            <h3 className="font-bold text-stone-800 border-b border-stone-100 pb-2">
              {isRTL ? "معاينة الشعار" : "Logo Preview"}
            </h3>
            
            <div className="h-40 border-2 border-dashed border-stone-200 rounded-xl flex items-center justify-center bg-stone-50/50 overflow-hidden">
              {formData.school_logo ? (
                <img 
                  src={formData.school_logo} 
                  alt="School Logo" 
                  className="max-h-full max-w-full object-contain p-2"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.nextElementSibling) {
                      /** @type {HTMLElement} */ (e.currentTarget.nextElementSibling).style.display = 'block';
                    }
                  }}
                />
              ) : (
                <div className="text-center p-4">
                  <ImageIcon size={32} className="mx-auto text-stone-300 mb-2" />
                  <p className="text-xs text-stone-500 font-medium">
                    {isRTL ? "لم يتم تحديد شعار" : "No logo set"}
                  </p>
                </div>
              )}
              <div className="text-center p-4 hidden">
                <p className="text-xs text-rose-500 font-bold">
                  {isRTL ? "الرابط غير صالح أو لا يمكن تحميل الصورة" : "Invalid URL or image failed to load"}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
              <p className="text-xs font-bold text-primary mb-1">
                {isRTL ? "ملاحظة حول الترويسة:" : "Header Note:"}
              </p>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                {isRTL 
                  ? "سيتم تطبيق هذه الإعدادات تلقائياً على كافة التقارير والفواتير والملفات الشاملة القابلة للطباعة عبر النظام." 
                  : "These settings will automatically apply to all printable reports, invoices, and comprehensive dossiers across the system."}
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
