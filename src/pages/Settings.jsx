import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { entities } from '@/api/dbClient';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';
import { Settings as SettingsIcon, Save, Image as ImageIcon, Building2, Globe, Shield, UserPlus, Key, Trash2, Upload, Users, Edit, X, Crown, Zap, Loader2, CheckCircle, AlertCircle, Calendar, CreditCard, Eye, Download, RefreshCw, FileText } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function Settings() {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const queryClient = useQueryClient();
  const { user, checkAppState } = useAuth();

  const [formData, setFormData] = useState({
    school_name_ar: '',
    school_name_en: '',
    school_logo: '',
    school_background_image: '',
    sidebar_logo: '',
    sidebar_short_name: ''
  });

  const [newGatewayUser, setNewGatewayUser] = useState({ username: '', password: '' });
  const [newAdmin, setNewAdmin] = useState({ email: '', password: '', full_name: '' });

  const [editingGateway, setEditingGateway] = useState(null);
  const [editingAdmin, setEditingAdmin] = useState(null);

  // ── اشتراك الباقات (مدير المدرسة) ──
  const schoolId = localStorage.getItem('portal_school_id') || user?.school_id || null;
  const [upgradePlan, setUpgradePlan] = useState(null);
  const [billingCycleLocal, setBillingCycleLocal] = useState('monthly');
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [licenseFile, setLicenseFile] = useState(null);
  const [licensePreview, setLicensePreview] = useState(null);
  const [senderName, setSenderName] = useState('');
  const [transferRef, setTransferRef] = useState('');
  const [bankNameLocal, setBankNameLocal] = useState('');
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [showSuccessReceipt, setShowSuccessReceipt] = useState(false);

  const PLAN_DEFS = {
    starter: { name: 'Starter', price: 49, icon: Shield, color: 'border-slate-200', bg: 'bg-slate-50', accent: 'text-slate-600', descAr: 'مدرسة صغيرة حتى 200 طالب', descEn: 'Small school up to 200 students' },
    professional: { name: 'Professional', price: 99, icon: Zap, color: 'border-blue-300', bg: 'bg-blue-50/50', accent: 'text-blue-600', popular: true, descAr: 'الأكثر طلباً — كل الميزات', descEn: 'Most popular — all features' },
    enterprise: { name: 'Enterprise', price: 199, icon: Crown, color: 'border-violet-300', bg: 'bg-violet-50/50', accent: 'text-violet-600', descAr: 'شبكة مدارس بلا حدود', descEn: 'Unlimited network' },
  };
  const calcPriceLocal = (plan, cycle) => {
    const base = PLAN_DEFS[plan]?.price || 99;
    if (cycle === 'yearly') return Math.round(base * 12 * 0.8);
    return base;
  };

  const { data: gatewayAccounts, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['gateway-accounts'],
    queryFn: () => entities.GatewayAccount.list("-created_at", 50)
  });

  const { data: systemAdmins, isLoading: isLoadingAdmins } = useQuery({
    queryKey: ['system-admins'],
    queryFn: () => entities.SystemAdmin.list("-created_at", 50)
  });

  const { data: currentSchool } = useQuery({
    queryKey: ['current-school', schoolId],
    enabled: !!schoolId,
    queryFn: async () => {
      try { return await entities.School.get(schoolId); } catch { return null; }
    }
  });
  const { data: tierFeaturesList = [] } = useQuery({
    queryKey: ['tier-features-settings'],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('portal_jwt_token') || localStorage.getItem('jwt_token') || '';
        const apiBase = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '');
        const url = apiBase ? `${apiBase}/api/tier-features` : '/api/tier-features';
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return [];
        return await res.json();
      } catch { return []; }
    }
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
        school_logo: existingSettings.school_logo || '',
        school_background_image: existingSettings.school_background_image || '',
        sidebar_logo: existingSettings.sidebar_logo || '',
        sidebar_short_name: existingSettings.sidebar_short_name || ''
      });
    }
  }, [existingSettings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Save to SystemSetting
      if (existingSettings?.id) {
        await entities.SystemSetting.update(existingSettings.id, formData);
      } else {
        await entities.SystemSetting.create(formData);
      }
      // Also update schools table branding (for Gateway page)
      const schoolId = localStorage.getItem('portal_school_id') || user?.school_id;
      if (schoolId) {
        try {
          const apiBase = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '');
          await fetch(`${apiBase}/neon-db/update-school-branding`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              school_id: schoolId,
              logo_url: formData.school_logo,
              background_image: formData.school_background_image
            })
          });
        } catch (e) {
          console.error('Failed to update school branding:', e);
        }
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      await checkAppState(); 
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

  const BRANDING_FIELDS = ['school_logo', 'school_background_image'];

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error(isRTL ? 'حجم الملف يجب أن يكون أقل من 5 ميجابايت' : 'File must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const fullDataUri = event.target.result;

      // For branding fields (logo, background): compress + store as base64 data URI in DB
      // This avoids Render's ephemeral filesystem — images persist across deploys
      if (BRANDING_FIELDS.includes(field)) {
        try {
          const toastId = toast.loading(isRTL ? 'جاري ضغط الصورة...' : 'Compressing image...');
          const compressed = await compressImage(fullDataUri, field === 'school_background_image' ? 1200 : 600);
          setFormData(prev => ({ ...prev, [field]: compressed }));
          toast.success(isRTL ? 'تم حفظ الصورة بنجاح' : 'Image saved', { id: toastId });
        } catch (err) {
          toast.error(isRTL ? 'فشل معالجة الصورة' : 'Failed to process image');
          console.error(err);
        }
        return;
      }

      // Other fields: upload to server filesystem
      const base64Data = fullDataUri.split(',')[1];
      try {
        const toastId = toast.loading(isRTL ? 'جاري رفع الملف...' : 'Uploading file...');
        const apiBase = import.meta.env.VITE_BACKEND_URL || '';
        const uploadUrl = apiBase
          ? `${apiBase.replace(/\/$/, '')}/neon-db/upload`
          : '/neon-db/upload';

        const res = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileData: base64Data
          })
        });

        const data = await res.json();
        if (data.success) {
          setFormData(prev => ({ ...prev, [field]: data.fileUrl }));
          toast.success(isRTL ? 'تم رفع الملف بنجاح' : 'File uploaded successfully', { id: toastId });
        } else {
          throw new Error(data.error);
        }
      } catch (err) {
        toast.error(isRTL ? 'فشل رفع الملف' : 'Upload failed');
        console.error(err);
      }
    };
    reader.readAsDataURL(file);
  };

  // Compress image to target max width, returns base64 data URI
  const compressImage = (dataUri, maxWidth) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;
        if (w > maxWidth) {
          h = (h * maxWidth) / w;
          w = maxWidth;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = reject;
      img.src = dataUri;
    });
  };

  // ── رفع إيصال ترقية الباقة + ترخيص المدرسة ──
  const handleReceiptSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error(isRTL ? 'الحد الأقصى 5 ميجا' : 'Max 5MB'); return; }
    setReceiptFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setReceiptPreview(ev.target.result);
    reader.readAsDataURL(file);
  };
  const handleLicenseSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error(isRTL ? 'الحد الأقصى 5 ميجا' : 'Max 5MB'); return; }
    setLicenseFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setLicensePreview(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setLicensePreview(null);
    }
  };
  const handleUploadUpgradeReceipt = async () => {
    if (!receiptFile || !upgradePlan || !currentSchool) return;
    if (!senderName.trim()) { toast.error(isRTL ? 'أدخل اسم المرسل' : 'Enter sender name'); return; }
    setUploadingReceipt(true);
    try {
      const base64 = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.onerror = reject;
        r.readAsDataURL(receiptFile);
      });
      let licenseBase64 = null;
      let licenseFilename = null;
      if (licenseFile) {
        licenseBase64 = await new Promise((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result);
          r.onerror = reject;
          r.readAsDataURL(licenseFile);
        });
        licenseFilename = licenseFile.name;
      }
      const apiBase = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '');
      const url = apiBase ? `${apiBase}/neon-db/upload-receipt` : '/neon-db/upload-receipt';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('portal_jwt_token') || localStorage.getItem('jwt_token') || ''}` },
        body: JSON.stringify({
          amount: calcPriceLocal(upgradePlan, billingCycleLocal),
          plan: upgradePlan,
          billing_cycle: billingCycleLocal,
          receipt_image: base64,
          bank_name: bankNameLocal || 'Bank',
          account_holder: 'EduTrack',
          transfer_reference: transferRef,
          sender_name: senderName,
          license_image: licenseBase64,
          license_filename: licenseFilename,
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(isRTL ? 'تم إرسال طلب الترقية — بانتظار موافقة المؤسس' : 'Upgrade request sent — pending founder approval');
      setShowSuccessReceipt(true);
      setReceiptFile(null); setReceiptPreview(null); setLicenseFile(null); setLicensePreview(null); setSenderName(''); setTransferRef(''); setBankNameLocal(''); setUpgradePlan(null);
    } catch (e) { toast.error(e.message || 'فشل الإرسال'); } finally { setUploadingReceipt(false); }
  };

  const createGatewayMutation = useMutation({
    mutationFn: async (data) => await entities.GatewayAccount.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gateway-accounts'] });
      setNewGatewayUser({ username: '', password: '' });
      toast.success(isRTL ? 'تم إضافة حساب البوابة بنجاح' : 'Gateway account added');
    },
    onError: () => toast.error(isRTL ? 'فشل إضافة الحساب' : 'Failed to add account')
  });

  const updateGatewayMutation = useMutation({
    mutationFn: async (data) => {
      const payload = { username: data.username };
      if (data.password) payload.password = data.password;
      return await entities.GatewayAccount.update(data.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gateway-accounts'] });
      setEditingGateway(null);
      toast.success(isRTL ? 'تم تعديل الحساب بنجاح' : 'Account updated');
    },
    onError: () => toast.error(isRTL ? 'فشل تعديل الحساب' : 'Update failed')
  });

  const deleteGatewayMutation = useMutation({
    mutationFn: (id) => entities.GatewayAccount.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gateway-accounts'] });
      toast.success(isRTL ? 'تم حذف الحساب' : 'Account deleted');
    }
  });

  const createAdminMutation = useMutation({
    mutationFn: async (data) => await entities.SystemAdmin.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-admins'] });
      setNewAdmin({ email: '', password: '', full_name: '' });
      toast.success(isRTL ? 'تم إضافة مدير النظام بنجاح' : 'Admin account added');
    },
    onError: () => toast.error(isRTL ? 'فشل إضافة المدير' : 'Failed to add admin')
  });

  const updateAdminMutation = useMutation({
    mutationFn: async (data) => {
      const payload = { email: data.email };
      if (data.password) payload.password = data.password;
      return await entities.SystemAdmin.update(data.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-admins'] });
      setEditingAdmin(null);
      toast.success(isRTL ? 'تم تعديل حساب المدير بنجاح' : 'Admin account updated');
    },
    onError: () => toast.error(isRTL ? 'فشل التعديل' : 'Update failed')
  });

  const deleteAdminMutation = useMutation({
    mutationFn: (id) => entities.SystemAdmin.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-admins'] });
      toast.success(isRTL ? 'تم حذف حساب المدير' : 'Admin account deleted');
    }
  });

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
                    placeholder={isRTL ? "مدارس إديوتراك النموذجية العالمية" : "EduTrack Model School"}
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
                  {isRTL ? "شعار المدرسة (Logo)" : "School Logo"}
                </label>
                <div className="flex gap-2">
                  <Input 
                    value={formData.school_logo}
                    readOnly
                    placeholder={isRTL ? "لم يتم رفع صورة" : "No image uploaded"}
                    className="h-12 bg-stone-50 border-stone-200 focus:bg-white flex-1"
                    dir="ltr"
                  />
                  <div className="relative">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'school_logo')}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                    />
                    <button type="button" className="h-12 px-4 rounded-xl bg-primary/10 text-primary font-bold flex items-center gap-2 pointer-events-none">
                      <Upload size={18} />
                      {isRTL ? "رفع صورة" : "Upload"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-stone-700 flex items-center gap-2">
                  <ImageIcon size={16} className="text-stone-400" />
                  {isRTL ? "صورة خلفية شاشة القفل (Gateway BG)" : "Gateway Background Image"}
                </label>
                <div className="flex gap-2">
                  <Input 
                    value={formData.school_background_image}
                    readOnly
                    placeholder={isRTL ? "لم يتم رفع صورة" : "No image uploaded"}
                    className="h-12 bg-stone-50 border-stone-200 focus:bg-white flex-1"
                    dir="ltr"
                  />
                  <div className="relative">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'school_background_image')}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                    />
                    <button type="button" className="h-12 px-4 rounded-xl bg-primary/10 text-primary font-bold flex items-center gap-2 pointer-events-none">
                      <Upload size={18} />
                      {isRTL ? "رفع صورة" : "Upload"}
                    </button>
                  </div>
                </div>
              </div>

              {/* ── إعدادات السايدبار المختصر ── */}
              <div className="border-t border-stone-100 pt-6 space-y-4">
                <h4 className="font-black text-stone-900 flex items-center gap-2">
                  <span className="h-6 w-6 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center text-xs">≡</span>
                  {isRTL ? "إعدادات السايدبار (الشعار + الاسم المختصر)" : "Sidebar branding"}
                </h4>
                <p className="text-xs text-stone-500 -mt-2">{isRTL ? "ارفع شعار السايدبار واكتب كلمة مختصرة (مثلاً: إيديوتراك) — يظهر الشعار فوق والاسم تحته بتنسيق جميل" : "Upload sidebar logo and write a short name"}</p>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-stone-700 flex items-center gap-2">
                    <ImageIcon size={16} className="text-violet-400" />
                    {isRTL ? "شعار السايدبار" : "Sidebar logo"}
                  </label>
                  <div className="flex gap-2">
                    <Input value={formData.sidebar_logo} readOnly placeholder={isRTL ? "لم يتم رفع شعار السايدبار" : "No sidebar logo"} className="h-12 bg-stone-50 border-stone-200 flex-1" dir="ltr" />
                    <div className="relative">
                      <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'sidebar_logo')} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" />
                      <button type="button" className="h-12 px-4 rounded-xl bg-violet-600 text-white font-bold flex items-center gap-2 pointer-events-none">
                        <Upload size={18} /> {isRTL ? "رفع" : "Upload"}
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-stone-400">{isRTL ? "إن تركته فارغاً سيُستخدم شعار المدرسة العام" : "If empty, main school logo is used"}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-stone-700">{isRTL ? "الاسم المختصر للسايدبار" : "Sidebar short name"}</label>
                  <Input value={formData.sidebar_short_name} onChange={(e) => setFormData({...formData, sidebar_short_name: e.target.value})} placeholder={isRTL ? "مثال: المجد" : "e.g. Almajd"} className="h-12 bg-stone-50 border-stone-200 focus:bg-white" maxLength={20} />
                  <p className="text-[11px] text-stone-400">{isRTL ? "كلمة واحدة مختصرة — تظهر تحت الشعار بخط جميل" : "One short word shown under logo"}</p>
                </div>
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
            
            {(() => {
              const getFullUrl = (url) => {
                if (!url) return "";
                if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
                const apiBase = import.meta.env.VITE_BACKEND_URL || '';
                return `${apiBase.replace(/\/$/, '')}${url.startsWith('/') ? '' : '/'}${url}`;
              };
              const previewUrl = getFullUrl(formData.school_logo);
              return (
            <div className="h-40 border-2 border-dashed border-stone-200 rounded-xl flex items-center justify-center bg-stone-50/50 overflow-hidden">
              {previewUrl ? (
                <img 
                  src={previewUrl} 
                  alt="School Logo" 
                  className="max-h-full max-w-full object-contain p-2"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const err = e.currentTarget.nextElementSibling;
                    if (err) err.style.display = 'block';
                    const hidden = e.currentTarget.parentElement?.querySelector('.no-logo-fallback');
                    if (hidden) hidden.style.display = 'none';
                  }}
                  onLoad={(e) => {
                    const err = e.currentTarget.nextElementSibling;
                    if (err) err.style.display = 'none';
                  }}
                />
              ) : null}
              <div className={`text-center p-4 ${previewUrl ? 'hidden no-logo-fallback' : ''}`}>
                <ImageIcon size={32} className="mx-auto text-stone-300 mb-2" />
                <p className="text-xs text-stone-500 font-medium">
                  {isRTL ? "لم يتم تحديد شعار" : "No logo set"}
                </p>
              </div>
              <div className="text-center p-4 hidden">
                <p className="text-xs text-rose-500 font-bold">
                  {isRTL ? "الرابط غير صالح أو لا يمكن تحميل الصورة" : "Invalid URL or image failed to load"}
                </p>
              </div>
            </div>
              );
            })()}

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

      {/* ── اشتراك الباقات (Subscription Plans) — مدير النظام ── */}
      <Card className="border-2 border-slate-200 rounded-[28px] p-6 md:p-8 bg-white shadow-sm mt-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600"><CreditCard size={20} /></div>
          <div className="flex-1">
            <h2 className="text-lg font-black text-slate-900">{isRTL ? 'اشتراك الباقات' : 'Subscription Plans'}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{isRTL ? 'الباقة الحالية مميزة — يمكنك طلب ترقية لأي باقة أخرى عبر رفع إيصال الدفع' : 'Current plan highlighted — request upgrade to any other plan by uploading receipt'}</p>
          </div>
          {currentSchool && <span className="text-xs font-bold bg-slate-900 text-white px-3 py-1.5 rounded-full">{isRTL ? 'الحالية: ' : 'Current: '}{(currentSchool.plan || 'starter').toUpperCase()}</span>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(PLAN_DEFS).map(([key, p]) => {
            const isCurrent = (currentSchool?.plan || 'starter') === key;
            const Icon = p.icon;
            const priceDisplay = `${p.price}`;
            return (
              <div key={key} className={`relative rounded-2xl border-2 p-5 text-center transition-all ${isCurrent ? 'border-emerald-400 bg-emerald-50/60 shadow-lg' : `border-slate-200 ${p.bg} hover:shadow-md`}`}>
                {p.popular && <span className="absolute -top-2 right-3 bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{isRTL ? 'الأكثر طلباً' : 'Popular'}</span>}
                {isCurrent && <span className="absolute -top-2 left-3 bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><CheckCircle size={10}/>{isRTL ? 'الباقة الحالية' : 'Current'}</span>}
                <Icon size={24} className={`mx-auto mb-2 ${isCurrent ? 'text-emerald-600' : p.accent}`} />
                <div className="text-base font-black text-slate-900">{p.name}</div>
                <div className="text-2xl font-extrabold text-slate-900">${priceDisplay}<span className="text-xs font-normal text-slate-500">/شهر</span></div>
                <p className="text-xs text-slate-500 mt-1">{isRTL ? p.descAr : p.descEn}</p>
                {isCurrent ? (
                  <div className="mt-4 py-2.5 rounded-xl bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center gap-1"><CheckCircle size={14}/>{isRTL ? 'مفعلة حالياً' : 'Active'}</div>
                ) : (
                  <button onClick={() => { setUpgradePlan(key); setBillingCycleLocal(currentSchool?.billing_cycle || 'monthly'); }} className={`mt-4 w-full py-2.5 rounded-xl font-bold text-sm transition ${upgradePlan===key ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 hover:bg-slate-900 hover:text-white'}`}>{isRTL ? `ترقية إلى ${p.name}` : `Upgrade to ${p.name}`}</button>
                )}
              </div>
            );
          })}
        </div>

        {/* تفاصيل الباقة المختارة + رفع الإيصال */}
        {upgradePlan && (
          <div className="mt-6 rounded-2xl border-2 border-slate-900 bg-slate-50 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-slate-900 flex items-center gap-2"><Upload size={16} className="text-blue-600"/>{isRTL ? `طلب ترقية إلى ${PLAN_DEFS[upgradePlan].name}` : `Upgrade to ${PLAN_DEFS[upgradePlan].name}`}</h3>
              <button onClick={()=>{ setUpgradePlan(null); setReceiptFile(null); setReceiptPreview(null); setLicenseFile(null); setLicensePreview(null);}} className="text-xs text-slate-500 hover:text-slate-900"><X size={16}/></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <button onClick={()=>setBillingCycleLocal('monthly')} className={`p-3 rounded-xl border-2 text-center ${billingCycleLocal==='monthly' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white'}`}>
                <div className="font-bold text-sm">{isRTL ? 'شهري' : 'Monthly'}</div><div className="text-lg font-extrabold">${PLAN_DEFS[upgradePlan].price}</div>
              </button>
              <button onClick={()=>setBillingCycleLocal('yearly')} className={`p-3 rounded-xl border-2 text-center ${billingCycleLocal==='yearly' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white'}`}>
                <div className="font-bold text-sm">{isRTL ? 'سنوي (توفير 20%)' : 'Yearly (Save 20%)'}</div><div className="text-lg font-extrabold">${calcPriceLocal(upgradePlan,'yearly')}<span className="text-xs font-normal">/سنة</span></div>
              </button>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><label className="text-xs font-bold text-slate-600">{isRTL ? 'اسم المرسل *' : 'Sender name *'}</label><Input value={senderName} onChange={e=>setSenderName(e.target.value)} placeholder={isRTL ? 'كما في الإيصال' : 'As on receipt'} className="mt-1"/></div>
                <div><label className="text-xs font-bold text-slate-600">{isRTL ? 'رقم المرجع' : 'Reference'}</label><Input value={transferRef} onChange={e=>setTransferRef(e.target.value)} placeholder="Ref #" className="mt-1"/></div>
              </div>
              <div><label className="text-xs font-bold text-slate-600">{isRTL ? 'البنك المرسل' : 'Sender bank'}</label><Input value={bankNameLocal} onChange={e=>setBankNameLocal(e.target.value)} placeholder={isRTL ? 'اسم البنك' : 'Bank name'} className="mt-1"/></div>
              <div>
                <label className="text-xs font-bold text-slate-600">{isRTL ? 'صورة الإيصال *' : 'Receipt image *'}</label>
                <label className="mt-1 flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 cursor-pointer hover:bg-slate-100">
                  {receiptPreview ? <img src={receiptPreview} alt="receipt" className="max-h-28 rounded-lg object-contain"/> : <div className="text-center"><Upload size={24} className="mx-auto text-slate-400 mb-1"/><p className="text-xs text-slate-500">{isRTL ? 'اضغط لاختيار صورة' : 'Click to select'}</p></div>}
                  <input type="file" accept="image/*" onChange={handleReceiptSelect} className="hidden" />
                </label>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600">{isRTL ? 'ترخيص المدرسة (صورة أو PDF)' : 'School License (image or PDF)'}</label>
                <label className="mt-1 flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-amber-300 rounded-xl bg-amber-50/50 cursor-pointer hover:bg-amber-50">
                  {licenseFile ? (
                    <div className="text-center p-2">
                      {licensePreview ? <img src={licensePreview} alt="license" className="max-h-20 rounded-lg object-contain mx-auto"/> : <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center mx-auto mb-1"><FileText size={18} className="text-amber-600"/></div>}
                      <p className="text-xs font-bold text-amber-700 truncate max-w-[200px]">{licenseFile.name}</p>
                      <p className="text-[10px] text-slate-400">{(licenseFile.size/1024).toFixed(0)} KB</p>
                    </div>
                  ) : (
                    <div className="text-center"><Upload size={20} className="mx-auto text-amber-400 mb-1"/><p className="text-xs text-slate-500">{isRTL ? 'ارفع ترخيص المدرسة' : 'Upload license'}</p><p className="text-[10px] text-slate-400">JPG, PNG, PDF — 5MB</p></div>
                  )}
                  <input type="file" accept="image/*,.pdf" onChange={handleLicenseSelect} className="hidden" />
                </label>
              </div>
              <div className="flex items-center justify-between bg-slate-900 text-white rounded-xl px-4 py-3">
                <span className="text-sm">{isRTL ? 'المبلغ' : 'Amount'}</span><span className="text-xl font-black">${calcPriceLocal(upgradePlan, billingCycleLocal)} <span className="text-xs font-normal opacity-60">{billingCycleLocal==='yearly' ? '/سنة' : '/شهر'}</span></span>
              </div>
              <Button onClick={handleUploadUpgradeReceipt} disabled={uploadingReceipt || !receiptFile || !senderName.trim()} className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold disabled:opacity-50">
                {uploadingReceipt ? <><Loader2 className="animate-spin" size={16}/>{isRTL ? 'جاري الإرسال...' : 'Sending...'}</> : <><Upload size={16}/>{isRTL ? 'إرسال طلب الترقية' : 'Send Upgrade Request'}</>}
              </Button>
              <p className="text-xs text-slate-400 text-center">{isRTL ? 'سيتم مراجعة الإيصال من المؤسس وتفعيل الباقة فور الموافقة' : 'Receipt will be reviewed by founder and plan activated on approval'}</p>
            </div>
          </div>
        )}

        {/* مقارنة الميزات */}
        {tierFeaturesList.length > 0 && (
          <div className="mt-6 border border-slate-200 rounded-2xl overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 font-bold text-sm text-slate-800 flex items-center gap-2"><Zap size={16} className="text-amber-500"/>{isRTL ? 'مقارنة سريعة للميزات' : 'Quick feature comparison'}</div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="bg-white border-b"><th className="text-right p-3 text-slate-500">{isRTL ? 'الميزة' : 'Feature'}</th>{Object.keys(PLAN_DEFS).map(k => <th key={k} className="text-center p-3 font-black capitalize">{k}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {[...new Set(tierFeaturesList.map(f=>f.category))].slice(0,3).map(cat => (
                    <React.Fragment key={cat}>
                      {tierFeaturesList.filter(f=>f.category===cat).slice(0,4).map(fe => (
                        <tr key={fe.feature_key}><td className="p-2.5 text-right font-bold text-slate-700">{isRTL ? fe.name_ar : fe.name_en}</td>
                          {Object.keys(PLAN_DEFS).map(tier => <td key={tier} className="text-center">{fe.tiers?.[tier] ? <span className="inline-flex w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 items-center justify-center"><CheckCircle size={12}/></span> : <span className="inline-flex w-5 h-5 rounded-full bg-slate-100 text-slate-400 items-center justify-center"><X size={10}/></span>}</td>)}
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>

      {showSuccessReceipt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={()=>setShowSuccessReceipt(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center" onClick={e=>e.stopPropagation()}>
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3"><CheckCircle size={28}/></div>
            <h3 className="font-black text-slate-900">{isRTL ? 'تم الإرسال' : 'Sent!'}</h3><p className="text-sm text-slate-500 mt-1">{isRTL ? 'تم إرسال طلب الترقية للمؤسس — سيتم تفعيل الباقة بعد الموافقة' : 'Upgrade request sent — founder will activate soon'}</p>
            <Button onClick={()=>setShowSuccessReceipt(false)} className="w-full mt-4 bg-slate-900 text-white rounded-xl">OK</Button>
          </div>
        </div>
      )}

      {/* Gateway Accounts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="space-y-6">
          <Card className="border border-stone-200/80 rounded-2xl p-6 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-stone-100 pb-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Shield size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black font-display text-stone-900">
                  {isRTL ? "حسابات شاشة القفل (Gateway)" : "Gateway Accounts"}
                </h2>
                <p className="text-sm text-stone-500 font-medium mt-0.5">
                  {isRTL ? "حساب واحد مشترك للمدرسة كلها — وزّع بياناته على المعلمين والطلاب والموظفين ليدخلوا من رابط بوابة المدرسة ثم يختاروا بوابتهم ويدخلوا بحساباتهم الشخصية." : "One shared account for the whole school — share it with teachers, students and staff to enter via the school gateway link, then pick their portal and sign in personally."}
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-end mb-6">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-bold text-stone-700">{isRTL ? "اسم المستخدم" : "Username"}</label>
                <Input 
                  value={newGatewayUser.username}
                  onChange={(e) => setNewGatewayUser({...newGatewayUser, username: e.target.value})}
                  className="bg-stone-50"
                  dir="ltr"
                />
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-sm font-bold text-stone-700">{isRTL ? "كلمة المرور" : "Password"}</label>
                <Input 
                  type="text"
                  value={newGatewayUser.password}
                  onChange={(e) => setNewGatewayUser({...newGatewayUser, password: e.target.value})}
                  className="bg-stone-50"
                  dir="ltr"
                />
              </div>
              <button 
                onClick={() => {
                  if (newGatewayUser.username && newGatewayUser.password) {
                    createGatewayMutation.mutate(newGatewayUser);
                  }
                }}
                disabled={createGatewayMutation.isPending || !newGatewayUser.username || !newGatewayUser.password}
                className="h-10 px-4 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <UserPlus size={16} />
                {isRTL ? "إضافة" : "Add"}
              </button>
            </div>

            <div className="border border-stone-100 rounded-xl overflow-hidden">
              <table className="w-full text-start">
                <thead className="bg-stone-50">
                  <tr>
                    <th className="px-4 py-3 text-xs font-bold text-stone-500">{isRTL ? "اسم المستخدم" : "Username"}</th>
                    <th className="px-4 py-3 text-xs font-bold text-stone-500">{isRTL ? "تاريخ الإضافة" : "Added On"}</th>
                    <th className="px-4 py-3 text-xs font-bold text-stone-500 w-24"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {isLoadingAccounts ? (
                    <tr><td colSpan="3" className="p-4 text-center text-sm text-stone-400">Loading...</td></tr>
                  ) : gatewayAccounts?.map(account => {
                    if (editingGateway?.id === account.id) {
                      return (
                        <tr key={account.id} className="bg-indigo-50/50">
                          <td colSpan="3" className="p-3">
                            <div className="flex items-center gap-2">
                              <Input 
                                value={editingGateway.username}
                                onChange={(e) => setEditingGateway({...editingGateway, username: e.target.value})}
                                className="h-8 text-sm"
                                placeholder="Username"
                                dir="ltr"
                              />
                              <Input 
                                type="text"
                                value={editingGateway.password}
                                onChange={(e) => setEditingGateway({...editingGateway, password: e.target.value})}
                                className="h-8 text-sm"
                                placeholder={isRTL ? "كلمة مرور جديدة" : "New password"}
                                dir="ltr"
                              />
                              <button 
                                onClick={() => updateGatewayMutation.mutate(editingGateway)}
                                className="p-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 shrink-0"
                              >
                                <Save size={16} />
                              </button>
                              <button 
                                onClick={() => setEditingGateway(null)}
                                className="p-1.5 bg-stone-200 text-stone-600 rounded hover:bg-stone-300 shrink-0"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                    
                    return (
                      <tr key={account.id} className="hover:bg-stone-50/50">
                        <td className="px-4 py-3 font-bold text-stone-900" dir="ltr">{account.username}</td>
                        <td className="px-4 py-3 text-sm text-stone-500">
                          {new Date(account.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-end whitespace-nowrap">
                          <button 
                            onClick={() => setEditingGateway({ id: account.id, username: account.username, password: '' })}
                            className="p-2 text-stone-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors mx-1"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => deleteGatewayMutation.mutate(account.id)}
                            className="p-2 text-stone-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {gatewayAccounts?.length === 0 && (
                    <tr><td colSpan="3" className="p-4 text-center text-sm text-stone-400">{isRTL ? "لا توجد حسابات" : "No accounts found"}</td></tr>
                  )}
                </tbody>
              </table>
            </div>

          </Card>
        </div>

        {/* System Admins Section */}
        <div className="space-y-6">
          <Card className="border border-stone-200/80 rounded-2xl p-6 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-stone-100 pb-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Users size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black font-display text-stone-900">
                  {isRTL ? "مدراء النظام (Admins)" : "System Admins"}
                </h2>
                <p className="text-sm text-stone-500 font-medium mt-0.5">
                  {isRTL ? "الحسابات التي تملك الصلاحية الكاملة لإدارة النظام." : "Accounts with full permissions to manage the system."}
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-end mb-6">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-bold text-stone-700">{isRTL ? "البريد الإلكتروني" : "Email"}</label>
                <Input 
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                  className="bg-stone-50"
                  dir="ltr"
                />
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-sm font-bold text-stone-700">{isRTL ? "كلمة المرور" : "Password"}</label>
                <Input 
                  type="text"
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                  className="bg-stone-50"
                  dir="ltr"
                />
              </div>
              <button 
                onClick={() => {
                  if (newAdmin.email && newAdmin.password) {
                    createAdminMutation.mutate({ ...newAdmin, full_name: 'System Admin' });
                  }
                }}
                disabled={createAdminMutation.isPending || !newAdmin.email || !newAdmin.password}
                className="h-10 px-4 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <UserPlus size={16} />
                {isRTL ? "إضافة" : "Add"}
              </button>
            </div>

            <div className="border border-stone-100 rounded-xl overflow-hidden">
              <table className="w-full text-start">
                <thead className="bg-stone-50">
                  <tr>
                    <th className="px-4 py-3 text-xs font-bold text-stone-500">{isRTL ? "البريد الإلكتروني" : "Email"}</th>
                    <th className="px-4 py-3 text-xs font-bold text-stone-500">{isRTL ? "تاريخ الإضافة" : "Added On"}</th>
                    <th className="px-4 py-3 text-xs font-bold text-stone-500 w-24"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {isLoadingAdmins ? (
                    <tr><td colSpan="3" className="p-4 text-center text-sm text-stone-400">Loading...</td></tr>
                  ) : systemAdmins?.map(admin => {
                    if (editingAdmin?.id === admin.id) {
                      return (
                        <tr key={admin.id} className="bg-blue-50/50">
                          <td colSpan="3" className="p-3">
                            <div className="flex items-center gap-2">
                              <Input 
                                value={editingAdmin.email}
                                onChange={(e) => setEditingAdmin({...editingAdmin, email: e.target.value})}
                                className="h-8 text-sm"
                                placeholder="Email"
                                dir="ltr"
                              />
                              <Input 
                                type="text"
                                value={editingAdmin.password}
                                onChange={(e) => setEditingAdmin({...editingAdmin, password: e.target.value})}
                                className="h-8 text-sm"
                                placeholder={isRTL ? "كلمة مرور جديدة" : "New password"}
                                dir="ltr"
                              />
                              <button 
                                onClick={() => updateAdminMutation.mutate(editingAdmin)}
                                className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 shrink-0"
                              >
                                <Save size={16} />
                              </button>
                              <button 
                                onClick={() => setEditingAdmin(null)}
                                className="p-1.5 bg-stone-200 text-stone-600 rounded hover:bg-stone-300 shrink-0"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                    
                    return (
                      <tr key={admin.id} className="hover:bg-stone-50/50">
                        <td className="px-4 py-3 font-bold text-stone-900" dir="ltr">{admin.email}</td>
                        <td className="px-4 py-3 text-sm text-stone-500">
                          {new Date(admin.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-end whitespace-nowrap">
                          <button 
                            onClick={() => setEditingAdmin({ id: admin.id, email: admin.email, password: '' })}
                            className="p-2 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors mx-1"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => deleteAdminMutation.mutate(admin.id)}
                            className="p-2 text-stone-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {systemAdmins?.length === 0 && (
                    <tr><td colSpan="3" className="p-4 text-center text-sm text-stone-400">{isRTL ? "لا يوجد مدراء" : "No admins found"}</td></tr>
                  )}
                </tbody>
              </table>
            </div>

          </Card>
        </div>
      </div>
    </div>
  );
}
