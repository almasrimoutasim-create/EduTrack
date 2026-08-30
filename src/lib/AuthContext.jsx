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
    const cached = localStorage.getItem('cached_school_settings');
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

  useEffect(() => {
    checkAppState();
  }, []);

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
        setIsAuthenticated(false);
        setUser(null);
      }

      setIsLoadingAuth(false);
      setAuthChecked(true);

      const gatewayPassed = localStorage.getItem('portal_gateway_passed');
      if (gatewayPassed === 'true') {
        setIsGatewayPassed(true);
      }

      // محاولة جلب الإعدادات العامة بطريقة آمنة عبر الـ Backend مباشرة إذا كان مدعوماً
      try {
        const apiBase = import.meta.env.VITE_BACKEND_URL || '';
        const res = await fetch(`${apiBase}/neon-db/public-settings`);
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
            localStorage.setItem('cached_school_settings', JSON.stringify(formatted));
            return;
          }
        }
      } catch (e) {
        // تخطي الخطأ والاعتماد على الـ Fallback
      }

      // الطريقة الاحتياطية القديمة
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
          localStorage.setItem('cached_school_settings', JSON.stringify(newSettings));
        }
      } catch (err) {
        // صامت لتجنب إزعاج الكونسول
      }
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

  const login = async (role, identifier, password) => {
    setAuthError(null);
    try {
      const apiBase = import.meta.env.VITE_BACKEND_URL || '';
      const loginUrl = apiBase
        ? `${apiBase.replace(/\/$/, '')}/neon-db/auth/login`
        : '/neon-db/auth/login';

      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, identifier, password })
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
      if (data.token) {
        localStorage.setItem('portal_jwt_token', data.token);
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

  const gatewayLogin = async (username, password) => {
    setAuthError(null);
    try {
      const apiBase = import.meta.env.VITE_BACKEND_URL || '';
      const loginUrl = apiBase
        ? `${apiBase.replace(/\/$/, '')}/neon-db/auth/gateway`
        : '/neon-db/auth/gateway';

      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
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
    setUser(null);
    setIsAuthenticated(false);
    setIsGatewayPassed(false);
    localStorage.removeItem('portal_role');
    localStorage.removeItem('portal_user');
    localStorage.removeItem('portal_user_id');
    localStorage.removeItem('portal_user_name');
    localStorage.removeItem('portal_is_auth');
    localStorage.removeItem('portal_jwt_token');
    localStorage.removeItem('portal_gateway_passed');

    if (shouldRedirect) {
      window.location.href = '/';
    }
  };

  const navigateToLogin = () => {
    window.location.href = '/';
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