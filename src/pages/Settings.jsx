import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { entities } from '@/api/dbClient';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';
import { Settings as SettingsIcon, Save, Image as ImageIcon, Building2, Globe, Shield, UserPlus, Key, Trash2, Upload, Users, Edit, X } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function Settings() {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const queryClient = useQueryClient();
  const { checkAppState } = useAuth();

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

  const { data: gatewayAccounts, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['gateway-accounts'],
    queryFn: () => entities.GatewayAccount.list("-created_at", 50)
  });

  const { data: systemAdmins, isLoading: isLoadingAdmins } = useQuery({
    queryKey: ['system-admins'],
    queryFn: () => entities.SystemAdmin.list("-created_at", 50)
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
      if (existingSettings?.id) {
        return await entities.SystemSetting.update(existingSettings.id, formData);
      } else {
        return await entities.SystemSetting.create(formData);
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

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error(isRTL ? 'حجم الملف يجب أن يكون أقل من 5 ميجابايت' : 'File must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target.result.split(',')[1];
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
        toast.error(isRTL ? 'فشل رفع الملف' : 'Upload failed', { id: toastId });
        console.error(err);
      }
    };
    reader.readAsDataURL(file);
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
                <p className="text-xs text-stone-500 -mt-2">{isRTL ? "ارفع شعار السايدبار واكتب كلمة مختصرة (مثلاً: المجد) — يظهر الشعار فوق والاسم تحته بتنسيق جميل" : "Upload sidebar logo and write a short name"}</p>

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
                  {isRTL ? "الحسابات المصرح لها باجتياز الشاشة الرئيسية." : "Accounts authorized to pass the main gateway screen."}
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
