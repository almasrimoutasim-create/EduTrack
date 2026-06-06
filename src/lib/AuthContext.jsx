import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { createAxiosClient } from '@base44/sdk/dist/utils/axios-client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null); // Contains only { id, public_settings }

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);
      
      // Check our local secure login session first
      const storedUser = localStorage.getItem('portal_user');
      const storedAuth = localStorage.getItem('portal_is_auth');
      if (storedUser && storedAuth === 'true') {
        try {
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
        } catch {
          // corrupted storage
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

      // Check app public settings
      // Use direct Base44 URL in production (Vite proxy /api only works in dev)
      const base44Base = import.meta['env'].DEV
        ? '/api/apps/public'
        : 'https://api.base44.io/apps/public';
      const appClient = createAxiosClient({
        baseURL: base44Base,
        headers: {
          'X-App-Id': appParams.appId
        },
        token: appParams.token, // Include token if available
        interceptResponses: true
      });
      
      try {
        const publicSettings = await appClient.get(`/prod/public-settings/by-id/${appParams.appId}`);
        setAppPublicSettings(publicSettings);
        setIsLoadingPublicSettings(false);
      } catch (appError) {
        console.error('App state check failed:', appError);
        
        // Handle app-level errors only if the user is not locally authenticated
        const locallyAuthenticated = localStorage.getItem('portal_is_auth') === 'true';
        if (!locallyAuthenticated) {
          if (appError.status === 403 && appError.data?.extra_data?.reason) {
            const reason = appError.data.extra_data.reason;
            if (reason === 'auth_required') {
              setAuthError({
                type: 'auth_required',
                message: 'Authentication required'
              });
            } else if (reason === 'user_not_registered') {
              setAuthError({
                type: 'user_not_registered',
                message: 'User not registered for this app'
              });
            } else {
              setAuthError({
                type: reason,
                message: appError.message
              });
            }
          } else {
            setAuthError({
              type: 'unknown',
              message: appError.message || 'Failed to load app'
            });
          }
        }
        setIsLoadingPublicSettings(false);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      const locallyAuthenticated = localStorage.getItem('portal_is_auth') === 'true';
      if (!locallyAuthenticated) {
        setAuthError({
          type: 'unknown',
          message: error.message || 'An unexpected error occurred'
        });
      }
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
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
      const apiBase = import.meta['env'].VITE_BACKEND_URL || '';
      const loginUrl = apiBase ? `${apiBase.replace(/\/$/, '')}/neon-db/auth/login` : '/neon-db/auth/login';
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, identifier, password })
      });
      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error('استجابة غير صالحة من الخادم. تأكد من تشغيل الباكند وإعداد VITE_BACKEND_URL في Vercel');
      }
      if (!response.ok) {
        throw new Error(data.error || 'Failed to login');
      }
      
      const loggedUser = data.user;
      setUser(loggedUser);
      setIsAuthenticated(true);
      
      // Persist in localStorage
      localStorage.setItem('portal_role', loggedUser.role);
      localStorage.setItem('portal_user', JSON.stringify(loggedUser));
      localStorage.setItem('portal_user_id', loggedUser.id);
      localStorage.setItem('portal_user_name', loggedUser.full_name);
      localStorage.setItem('portal_is_auth', 'true');
      
      return loggedUser;
    } catch (error) {
      setAuthError({
        type: 'login_failed',
        message: error.message || 'Login failed. Please check your credentials.'
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
