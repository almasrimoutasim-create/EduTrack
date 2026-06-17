import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

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
      // لا نحتاج public-settings من Base44 — المشروع يعتمد على Neon فقط
      setAppPublicSettings({ id: 'edutrack', public_settings: {} });
    } catch (error) {
      console.error('Unexpected error in checkAppState:', error);
      setAuthError({
        type: 'unknown',
        message: error.message || 'An unexpected error occurred'
      });
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
        throw new Error('استجابة غير صالحة من الخادم. تأكد من تشغيل الباكند وإعداد VITE_BACKEND_URL');
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
        message: error.message || 'فشل تسجيل الدخول. تحقق من بياناتك.'
      });
      throw error;
    }
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('portal_role');
    localStorage.removeItem('portal_user');
    localStorage.removeItem('portal_user_id');
    localStorage.removeItem('portal_user_name');
    localStorage.removeItem('portal_is_auth');
    localStorage.removeItem('portal_jwt_token');

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
      login,
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
