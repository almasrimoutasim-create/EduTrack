import React, { createContext, useState, useContext, useEffect } from 'react';
import { entities } from '@/api/dbClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // فرض قيم افتراضية حقيقية تضمن ظهور اسم المدرسة والشعار حتى لو فشلت قاعدة البيانات تماماً
  const [appPublicSettings, setAppPublicSettings] = useState(() => {
    const schoolKey = localStorage.getItem('portal_school_id') || 'global';
    const cached = localStorage.getItem(`cached_school_settings_${schoolKey}`);
    if (cached) {
      try { return JSON.parse(cached); } catch { /* ignore */ }
    }
    return {
      id: 'edutrack',
      public_settings: {
        school_name_ar: 'مدارس عباد الرحمن التعليمية',
        school_name_en: 'Abad Al-Rahman Educational Schools',
        school_logo: '', // وضع رابط الشعار المباشر هنا إن لم يظهر
        school_background_image: 'https://images.unsplash.com/photo-1510519138101-570d1dcb3d8e?q=80&w=2000&auto=format&fit=crop'
      }
    };
  });

  const [isGatewayPassed, setIsGatewayPassed] = useState(false);

  // Helper: جلب إعدادات المدرسة العامة مع دعم schoolId
  const fetchPublicSettings = async () => {
    try {
      const apiBase = import.meta.env.VITE_BACKEND_URL || '';
      const currentSchoolId = localStorage.getItem('portal_school_id') || user?.school_id || null;
      const params = currentSchoolId ? `?schoolId=${currentSchoolId}` : '';
      const headers = {};
      const token = localStorage.getItem('portal_jwt_token') || localStorage.getItem('portal_token');
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${apiBase}/neon-db/public-settings${params}`, { headers });
      if (res.ok) {
        const publicData = await res.json();
        if (publicData) {
          const formatted = {
            id: 'edutrack',
            public_settings: {
              school_name_ar: publicData.school_name_ar || 'مدارس عباد الرحمن التعليمية',
              school_name_en: publicData.school_name_en || 'Abad Al-Rahman Educational Schools',
              school_logo: publicData.school_logo || '',
              school_background_image: publicData.school_background_image || 'https://images.unsplash.com/photo-1510519138101-570d1dcb3d8e?q=80&w=2000&auto=format&fit=crop',
              sidebar_logo: publicData.sidebar_logo || publicData.school_logo || '',
              sidebar_short_name: publicData.sidebar_short_name || ''
            }
          };
          setAppPublicSettings(formatted);
          const schoolKey = localStorage.getItem('portal_school_id') || 'global';
          localStorage.setItem(`cached_school_settings_${schoolKey}`, JSON.stringify(formatted));
          localStorage.removeItem('cached_school_settings');
          return;
        }
      }
    } catch (e) {
      // تخطي الخطأ
    }
    // Fallback: entity client
    try {
      const settingsList = await entities.SystemSetting.list("-created_at", 1);
      if (settingsList && settingsList.length > 0) {
        const dbSettings = settingsList[0];
        const newSettings = {
          id: 'edutrack',
          public_settings: {
            school_name_ar: dbSettings.school_name_ar || 'مدارس عباد الرحمن التعليمية',
            school_name_en: dbSettings.school_name_en || 'Abad Al-Rahman Educational Schools',
            school_logo: dbSettings.school_logo || '',
            school_background_image: dbSettings.school_background_image || 'https://images.unsplash.com/photo-1510519138101-570d1dcb3d8e?q=80&w=2000&auto=format&fit=crop',
            sidebar_logo: dbSettings.sidebar_logo || dbSettings.school_logo || '',
            sidebar_short_name: dbSettings.sidebar_short_name || ''
          }
        };
        setAppPublicSettings(newSettings);
        const schoolKey2 = localStorage.getItem('portal_school_id') || 'global';
        localStorage.setItem(`cached_school_settings_${schoolKey2}`, JSON.stringify(newSettings));
        localStorage.removeItem('cached_school_settings');
      }
    } catch (err) { /* صامت */ }
  };

  useEffect(() => {
    checkAppState();
  }, []);

  // Re-fetch settings when school_id changes (e.g., after login)
  useEffect(() => {
    if (authChecked) {
      fetchPublicSettings();
    }
  }, [user?.school_id, authChecked]);

  const checkAppState = async () => {
    try {
      setAuthError(null);

      const storedUser = localStorage.getItem('portal_user');
      const storedAuth = localStorage.getItem('portal_is_auth');
      if (storedUser && storedAuth === 'true') {
        try {
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
        } catch {
          localStorage.removeItem('portal_user');
          localStorage.removeItem('portal_is_auth');
          setIsAuthenticated(false);
          setUser(null);
        }
      } else {
        // Independent portal fallback (teacher/student/staff portals store their own keys)
        const portalRole = localStorage.getItem('portal_role');
        const portalUserId = localStorage.getItem('portal_user_id');
        const portalUserName = localStorage.getItem('portal_user_name');
        if (portalRole && portalUserId) {
          setUser({ id: portalUserId, role: portalRole, full_name: portalUserName || '' });
          setIsAuthenticated(true);
          localStorage.setItem('portal_gateway_passed', 'true');
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      }

      setIsLoadingAuth(false);
      setAuthChecked(true);

      const gatewayPassed = localStorage.getItem('portal_gateway_passed');
      if (gatewayPassed === 'true') {
        setIsGatewayPassed(true);
      }

      await fetchPublicSettings();
    } catch (error) {
      console.error('Unexpected error in checkAppState:', error);
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  const checkUserAuth = async () => {
    const storedUser = localStorage.getItem('portal_user');
    const storedAuth = localStorage.getItem('portal_is_auth');
    if (storedUser && storedAuth === 'true') {
      try {
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem('portal_user');
        localStorage.removeItem('portal_is_auth');
        setIsAuthenticated(false);
        setUser(null);
      }
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
    setIsLoadingAuth(false);
    setAuthChecked(true);
  };

  const login = async (role, identifier, password, schoolId = null) => {
    setAuthError(null);
    try {
      const apiBase = import.meta.env.VITE_BACKEND_URL || '';
      const loginUrl = apiBase
        ? `${apiBase.replace(/\/$/, '')}/neon-db/auth/login`
        : '/neon-db/auth/login';

      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, identifier, password, schoolId })
      });

      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error('استجابة غير صالحة من الخادم.');
      }

      if (!response.ok) {
        throw new Error(data.error || 'فشل تسجيل الدخول');
      }

      const loggedUser = data.user;
      if (loggedUser && loggedUser.role) {
        loggedUser.role = loggedUser.role.toLowerCase();
      }

      setUser(loggedUser);
      setIsAuthenticated(true);

      localStorage.setItem('portal_role', loggedUser.role);
      localStorage.setItem('portal_user', JSON.stringify(loggedUser));
      localStorage.setItem('portal_user_id', loggedUser.id);
      localStorage.setItem('portal_user_name', loggedUser.full_name);
      localStorage.setItem('portal_is_auth', 'true');
      localStorage.setItem('portal_gateway_passed', 'true');
      if (loggedUser.school_id) {
        localStorage.setItem('portal_school_id', loggedUser.school_id);
      } else {
        localStorage.removeItem('portal_school_id');
      }
      if (data.token) {
        localStorage.setItem('portal_jwt_token', data.token);
        // عزل جلسات البوابات المستقلة عن بوابات المدارس لمنع الكتابة فوق بعضها عند الاختبار على نفس المتصفح
if (!loggedUser.school_id) {
           if (loggedUser.role === 'teacher') {
             localStorage.setItem('ind_teacher_id', loggedUser.independent_teacher_id || loggedUser.id);
             localStorage.setItem('ind_teacher_name', loggedUser.full_name);
             localStorage.setItem('ind_teacher_email', loggedUser.email || '');
             localStorage.setItem('ind_teacher_token', data.token);
             localStorage.setItem('ind_teacher_user', JSON.stringify(loggedUser));
           } else if (loggedUser.role === 'student') {
             localStorage.setItem('ind_student_id', loggedUser.independent_student_id || loggedUser.id);
             localStorage.setItem('ind_student_name', loggedUser.full_name);
             localStorage.setItem('ind_student_email', loggedUser.email || '');
             localStorage.setItem('ind_student_token', data.token);
             localStorage.setItem('ind_student_user', JSON.stringify(loggedUser));
           }
         }
      }

      return loggedUser;
    } catch (error) {
      setAuthError({
        type: 'login_failed',
        message: error.message || 'فشل تسجيل الدخول.'
      });
      throw error;
    }
  };

  const gatewayLogin = async (username, password, schoolId = null) => {
    setAuthError(null);
    try {
      const apiBase = import.meta.env.VITE_BACKEND_URL || '';
      const loginUrl = apiBase
        ? `${apiBase.replace(/\/$/, '')}/neon-db/auth/gateway`
        : '/neon-db/auth/gateway';

      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, schoolId: schoolId || undefined })
      });

      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error('استجابة غير صالحة من الخادم.');
      }

      if (!response.ok) {
        throw new Error(data.error || 'فشل تسجيل الدخول');
      }

      setIsGatewayPassed(true);
      localStorage.setItem('portal_gateway_passed', 'true');
      return true;
    } catch (error) {
      setAuthError({
        type: 'login_failed',
        message: error.message || 'فشل تسجيل الدخول للبوابة.'
      });
      throw error;
    }
  };

  const logout = (shouldRedirect = true) => {
    let slug = null;
    try {
      setUser(null);
      setIsAuthenticated(false);
      setIsGatewayPassed(false);
      const keys = ['portal_role', 'portal_user', 'portal_user_id', 'portal_user_name', 'portal_user_email',
        'portal_is_auth', 'portal_jwt_token', 'portal_gateway_passed', 'token', 'user',
        'portal_school_id', 'ind_teacher_id','ind_teacher_name','ind_teacher_email','ind_teacher_token','ind_teacher_user',
        'ind_student_id','ind_student_name','ind_student_email','ind_student_token','ind_student_user'];
      keys.forEach(k => { try { localStorage.removeItem(k); } catch { /* ignore */ } });
      try { slug = localStorage.getItem('portal_school_slug'); } catch { slug = null; }
      try { localStorage.removeItem('portal_school_slug'); } catch { /* ignore */ }
    } finally {
      // Navigation MUST always happen — even if any storage step above throws,
      // otherwise the lock screen renders on the old URL (no redirect).
      if (shouldRedirect) {
        window.location.replace(slug ? `/gateway/${slug}` : '/login');
      }
    }
  };

  const navigateToLogin = () => {
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      isGatewayPassed,
      login,
      gatewayLogin,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};