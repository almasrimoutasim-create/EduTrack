import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { entities } from '@/api/dbClient';
import { Shield, Crown, Zap, Lock, Loader2 } from 'lucide-react';

const PLAN_ORDER = { starter: 1, professional: 2, enterprise: 3 };

const PLAN_LABELS = {
  starter: { name: 'Starter', color: 'text-slate-400', bg: 'bg-slate-100' },
  professional: { name: 'Professional', color: 'text-blue-400', bg: 'bg-blue-100' },
  enterprise: { name: 'Enterprise', color: 'text-violet-400', bg: 'bg-violet-100' },
};

const RESTRICTED_ROUTES = {
  '/finance': 'professional',
  '/library': 'professional',
  '/store': 'professional',
  '/store/inventory': 'professional',
  '/store/categories': 'professional',
  '/store/pos': 'professional',
  '/store/orders': 'professional',
  '/store/reports': 'professional',
  '/store-categories': 'professional',
  '/counseling': 'professional',
  '/counseling/cases': 'professional',
  '/counseling/:id': 'professional',
  '/print-results': 'professional',
  '/attendance-summary': 'professional',
  '/bus-routes': 'enterprise',
  '/staff-control': 'enterprise',
  '/staff/payroll': 'enterprise',
  '/staff/contracts': 'enterprise',
  '/staff/leaves': 'enterprise',
  '/staff/evaluations': 'enterprise',
  '/staff/reports': 'enterprise',
  '/staff/departments': 'enterprise',
  '/staff/career': 'enterprise',
  '/admin-virtual-classrooms': 'enterprise',
  '/admin-chats': 'enterprise',
  '/official-announcements': 'enterprise',
  '/audit-log': 'enterprise',
  '/hr-reports': 'enterprise',
};

export default function PlanAccessGuard({ children }) {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const [currentPlan, setCurrentPlan] = useState('starter');
  const [loadingPlan, setLoadingPlan] = useState(true);

  useEffect(() => {
    const checkPlan = async () => {
      if (!isAuthenticated || !user?.school_id) {
        setChecking(false);
        return;
      }
      try {
        const data = await entities.School.get(user.school_id);
        const plan = data?.plan || 'starter';
        setCurrentPlan(plan);
      } catch {
        setCurrentPlan('starter');
      } finally {
        setLoadingPlan(false);
        setChecking(false);
      }
    };
    checkPlan();
  }, [isAuthenticated, user?.school_id]);

  useEffect(() => {
    if (checking || loadingPlan) return;
    const path = location.pathname;
    const requiredTier = RESTRICTED_ROUTES[path];
    if (!requiredTier) {
      setBlocked(false);
      return;
    }
    const currentLevel = PLAN_ORDER[currentPlan] || 1;
    const requiredLevel = PLAN_ORDER[requiredTier] || 1;
    if (currentLevel < requiredLevel) {
      setBlocked(true);
    } else {
      setBlocked(false);
    }
  }, [checking, loadingPlan, currentPlan, location.pathname]);

  if (checking || loadingPlan) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" />
          <p className="text-sm text-muted-foreground">جاري التحقق من الباقة...</p>
        </div>
      </div>
    );
  }

  if (blocked) {
    const requiredTier = RESTRICTED_ROUTES[location.pathname];
    const requiredInfo = PLAN_LABELS[requiredTier] || { name: requiredTier };
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
        <div className="max-w-md w-full mx-4 bg-card rounded-2xl border border-destructive/30 p-8 text-center shadow-xl">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold mb-3">مطلوب باقة {requiredInfo.name}</h2>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            أنت حالياً على باقة <span className={`font-bold ${PLAN_LABELS[currentPlan]?.color}`}>{PLAN_LABELS[currentPlan]?.name}</span>.
            للوصول إلى هذه الميزة، يرجى الترقية إلى باقة <span className={`font-bold ${requiredInfo.color}`}>{requiredInfo.name}</span>.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate('/renew-subscription')}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition"
            >
              ترقية الباقة
            </button>
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-3 bg-muted text-muted-foreground rounded-xl font-semibold hover:bg-muted/80 transition"
            >
              رجوع
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}

export { PLAN_ORDER, PLAN_LABELS, RESTRICTED_ROUTES };
