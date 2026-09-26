import React, { useState, useEffect, useCallback, useRef } from "react";
import { LifeBuoy, X, Send, Loader2, ChevronDown, MessageSquare, RefreshCw, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { toast } from "sonner";

const API_BASE = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");

const CATEGORIES = [
  { value: "technical", ar: "مشكلة تقنية", en: "Technical issue" },
  { value: "account", ar: "مشكلة في الحساب", en: "Account problem" },
  { value: "billing", ar: "الفواتير والاشتراك", en: "Billing & subscription" },
  { value: "data", ar: "مشكلة في البيانات", en: "Data issue" },
  { value: "suggestion", ar: "اقتراح أو ملاحظة", en: "Suggestion" },
  { value: "other", ar: "أخرى", en: "Other" },
];

const STATUS_META = {
  new: { ar: "جديدة", en: "New", color: "bg-blue-50 text-blue-700 border-blue-200", icon: AlertCircle },
  in_progress: { ar: "قيد المعالجة", en: "In progress", color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
  resolved: { ar: "تم الحل", en: "Resolved", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
};

/** Reads the signed-in portal user from localStorage (works with or without AuthProvider). */
function readIdentity() {
  if (typeof window === "undefined") return {};
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("portal_user") || "null");
  } catch {
    user = null;
  }
  return {
    userId: localStorage.getItem("portal_user_id") || user?.id || "",
    userName: localStorage.getItem("portal_user_name") || user?.full_name || user?.name || "",
    userEmail: user?.email || localStorage.getItem("portal_user_email") || "",
    role: localStorage.getItem("portal_role") || user?.role || "user",
    schoolId: localStorage.getItem("portal_school_id") || user?.school_id || "",
    token: localStorage.getItem("portal_jwt_token") || localStorage.getItem("jwt_token") || "",
  };
}

export default function SupportWidget() {
  const { language } = useLanguage();
  const isRTL = language === "ar";

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("new"); // "new" | "mine"
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("technical");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingMine, setLoadingMine] = useState(false);
  const [myTickets, setMyTickets] = useState([]);
  const [openCount, setOpenCount] = useState(0);
  const panelRef = useRef(null);

  const labels = {
    fab: isRTL ? "الدعم الفني" : "Support",
    fabTitle: isRTL ? "الإبلاغ عن مشكلة أو التواصل مع الدعم" : "Report an issue or contact support",
    title: isRTL ? "الدعم الفني" : "Technical Support",
    subtitle: isRTL ? "أرسل شكواك وسنتابع معك" : "Send your report and we will follow up",
    tabNew: isRTL ? "تذكرة جديدة" : "New ticket",
    tabMine: isRTL ? "طلباتي" : "My requests",
    subjectLabel: isRTL ? "الموضوع" : "Subject",
    subjectPh: isRTL ? "اكتب عنواناً مختصراً للمشكلة" : "Write a short title for the issue",
    typeLabel: isRTL ? "نوع الطلب" : "Request type",
    detailsLabel: isRTL ? "تفاصيل المشكلة" : "Issue details",
    detailsPh: isRTL ? "اشرح المشكلة بالتفصيل..." : "Describe the issue in detail...",
    send: isRTL ? "إرسال التذكرة" : "Send ticket",
    sending: isRTL ? "جارٍ الإرسال..." : "Sending...",
    empty: isRTL ? "لا توجد تذاكر حتى الآن." : "No tickets yet.",
    loadErr: isRTL ? "تعذر تحميل التذاكر" : "Could not load tickets",
    required: isRTL ? "يرجى تعبئة الموضوع والتفاصيل" : "Subject and details are required",
    sent: isRTL ? "تم إرسال تذكرتك بنجاح" : "Your ticket was sent successfully",
    sendErr: isRTL ? "تعذر إرسال التذكرة" : "Could not send ticket",
    refresh: isRTL ? "تحديث" : "Refresh",
    founderReply: isRTL ? "رد الدعم" : "Support reply",
    noReply: isRTL ? "لم يتم الرد بعد" : "No reply yet",
  };

  const authHeaders = useCallback(() => {
    const { token } = readIdentity();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const loadMine = useCallback(async () => {
    setLoadingMine(true);
    try {
      const { userId, userEmail } = readIdentity();
      const qs = new URLSearchParams();
      if (userId) qs.set("user_id", userId);
      if (userEmail) qs.set("user_email", userEmail);
      if (!qs.toString()) { setMyTickets([]); return; }

      const res = await fetch(`${API_BASE}/api/support-tickets/mine?${qs.toString()}`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("bad status");
      const data = await res.json();
      const list = Array.isArray(data.tickets) ? data.tickets : [];
      setMyTickets(list);
      setOpenCount(list.filter((t) => t.status !== "resolved").length);
    } catch {
      toast.error(labels.loadErr);
    } finally {
      setLoadingMine(false);
    }
  }, [authHeaders, labels.loadErr]);

  // Keep the badge fresh so users notice a founder reply.
  useEffect(() => {
    loadMine();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error(labels.required);
      return;
    }
    setSending(true);
    try {
      const { userId, userName, userEmail, role, schoolId } = readIdentity();
      const res = await fetch(`${API_BASE}/api/support-tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          subject: subject.trim(),
          category,
          message: message.trim(),
          user_id: userId,
          user_name: userName,
          user_email: userEmail,
          user_type: role,
          school_id: schoolId,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "send failed");

      toast.success(labels.sent);
      setSubject("");
      setMessage("");
      setCategory("technical");
      setTab("mine");
      await loadMine();
    } catch (e) {
      toast.error(e.message && e.message !== "send failed" ? e.message : labels.sendErr);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Floating action button — bottom corner, mirrored for RTL */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={labels.fabTitle}
        aria-label={labels.fabTitle}
        className={`fixed bottom-6 z-[90] flex items-center gap-2 rounded-full bg-rose-600 px-5 py-3.5 text-white shadow-lg shadow-rose-600/30 transition-all hover:bg-rose-700 hover:shadow-xl hover:shadow-rose-600/40 focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-300 ${
          isRTL ? "left-6" : "right-6"
        }`}
      >
        <LifeBuoy size={20} />
        <span className="text-sm font-bold">{labels.fab}</span>
        {openCount > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-[11px] font-black text-rose-700">
            {openCount}
          </span>
        )}
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-6">
          <div
            className="absolute inset-0 bg-stone-900/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={labels.title}
            className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-rose-500 to-rose-600 px-6 py-5 text-white">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20">
                  <LifeBuoy size={22} />
                </span>
                <div>
                  <h3 className="text-lg font-black leading-tight">{labels.title}</h3>
                  <p className="text-xs text-rose-50">{labels.subtitle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={isRTL ? "إغلاق" : "Close"}
                className="rounded-xl p-2 text-white/80 transition hover:bg-white/20 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-stone-200 bg-stone-50 px-4 pt-3">
              {[
                { id: "new", label: labels.tabNew },
                { id: "mine", label: labels.tabMine },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => { setTab(t.id); if (t.id === "mine") loadMine(); }}
                  className={`relative px-4 py-2.5 text-sm font-bold transition ${
                    tab === t.id ? "text-rose-600" : "text-stone-500 hover:text-stone-700"
                  }`}
                >
                  {t.label}
                  {t.id === "mine" && openCount > 0 && (
                    <span className="ms-1.5 rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-black text-rose-700">
                      {openCount}
                    </span>
                  )}
                  {tab === t.id && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-rose-600" />}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {tab === "new" ? (
                <form id="support-ticket-form" onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="support-type" className="mb-1.5 block text-sm font-bold text-stone-700">
                      {labels.typeLabel}
                    </label>
                    <div className="relative">
                      <select
                        id="support-type"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full appearance-none rounded-2xl border border-stone-200 bg-white px-4 py-3 pe-10 text-sm font-semibold text-stone-800 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c.value} value={c.value}>{isRTL ? c.ar : c.en}</option>
                        ))}
                      </select>
                      <ChevronDown
                        size={18}
                        className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-stone-400 ${isRTL ? "left-4" : "right-4"}`}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="support-subject" className="mb-1.5 block text-sm font-bold text-stone-700">
                      {labels.subjectLabel}
                    </label>
                    <input
                      id="support-subject"
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder={labels.subjectPh}
                      maxLength={200}
                      className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                    />
                  </div>

                  <div>
                    <label htmlFor="support-message" className="mb-1.5 block text-sm font-bold text-stone-700">
                      {labels.detailsLabel}
                    </label>
                    <textarea
                      id="support-message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={labels.detailsPh}
                      rows={5}
                      maxLength={5000}
                      className="w-full resize-y rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                    />
                  </div>
                </form>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={loadMine}
                      disabled={loadingMine}
                      className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-stone-500 transition hover:bg-stone-100 hover:text-stone-700 disabled:opacity-50"
                    >
                      <RefreshCw size={13} className={loadingMine ? "animate-spin" : ""} />
                      {labels.refresh}
                    </button>
                  </div>

                  {loadingMine && myTickets.length === 0 ? (
                    <div className="flex justify-center py-10 text-stone-400">
                      <Loader2 className="animate-spin" size={26} />
                    </div>
                  ) : myTickets.length === 0 ? (
                    <div className="py-10 text-center text-sm text-stone-400">{labels.empty}</div>
                  ) : (
                    myTickets.map((t) => {
                      const meta = STATUS_META[t.status] || STATUS_META.new;
                      const Icon = meta.icon;
                      return (
                        <div key={t.id} className="rounded-2xl border border-stone-200 bg-stone-50/60 p-4">
                          <div className="mb-2 flex items-start justify-between gap-3">
                            <h4 className="flex-1 text-sm font-black leading-snug text-stone-800">{t.subject}</h4>
                            <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold ${meta.color}`}>
                              <Icon size={12} />
                              {isRTL ? meta.ar : meta.en}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap text-xs leading-relaxed text-stone-600">{t.message}</p>

                          <div className="mt-3 rounded-xl bg-white p-3 ring-1 ring-stone-200">
                            <div className="mb-1 flex items-center gap-1.5 text-[11px] font-black text-stone-500">
                              <MessageSquare size={12} />
                              {labels.founderReply}
                            </div>
                            {t.founder_reply ? (
                              <p className="whitespace-pre-wrap text-xs leading-relaxed text-stone-700">{t.founder_reply}</p>
                            ) : (
                              <p className="text-xs text-stone-400">{labels.noReply}</p>
                            )}
                          </div>

                          <p className="mt-2 text-[11px] text-stone-400">
                            {new Date(t.created_at).toLocaleString(isRTL ? "ar" : "en-US")}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {tab === "new" && (
              <div className="border-t border-stone-200 bg-stone-50 px-6 py-4">
                <button
                  type="submit"
                  form="support-ticket-form"
                  disabled={sending}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-600 px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-rose-600/25 transition hover:bg-rose-700 disabled:opacity-60"
                >
                  {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  {sending ? labels.sending : labels.send}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
