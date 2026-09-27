import React from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

/**
 * Top-level error boundary.
 *
 * React has no built-in recovery for a throw during render: the nearest
 * boundary (or, if none exists, the whole root) unmounts and the user is
 * left staring at a blank white page with no clue what happened. This
 * component is the last line of defense — it turns an unrenderable tree
 * into a readable diagnostic with a way out.
 *
 * Must be a class component: `componentDidCatch` / `getDerivedStateFromError`
 * have no hook equivalent.
 */
class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    this.setState({ info });

    // Keep it in the console too — this is what a developer needs in DevTools.
    console.error("[AppErrorBoundary] Unhandled render error:", error, info);
  }

  handleReset() {
    this.setState({ error: null, info: null });
  }

  render() {
    const { error, info } = this.state;
    if (!error) return this.props.children;

    const componentStack = info?.componentStack?.trim() ?? "";

    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 px-6 py-16" dir="rtl">
        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-8 py-6 bg-red-50 border-b border-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600 shrink-0" aria-hidden="true" />
              <div>
                <h1 className="text-lg font-bold text-red-900">حدث خطأ غير متوقع في هذه الصفحة</h1>
                <p className="text-sm text-red-700 mt-0.5">An unexpected error occurred while rendering this page.</p>
              </div>
            </div>

            <div className="px-8 py-6 space-y-5">
              <p className="text-sm text-stone-600 leading-relaxed">
                بقية التطبيق لا يزال يعمل. جرّب إعادة تحميل هذا القسم، وإن استمر الخطأ فاذهب إلى الصفحة الرئيسية.
                <br />
                The rest of the app is still running. Try reloading this section, and if the error persists go back home.
              </p>

              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">رسالة الخطأ</h2>
                <pre className="bg-stone-900 text-stone-100 rounded-xl px-4 py-3 text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap break-words" dir="ltr">
                  {String(error?.message ?? error)}
                </pre>
              </div>

              {componentStack && (
                <details>
                  <summary className="cursor-pointer text-xs font-bold uppercase tracking-wider text-stone-500">
                    تفاصيل تقنية (Technical details)
                  </summary>
                  <pre className="mt-2 bg-stone-100 text-stone-700 rounded-xl px-4 py-3 text-[11px] leading-relaxed overflow-x-auto whitespace-pre-wrap break-words" dir="ltr">
                    {componentStack}
                  </pre>
                </details>
              )}

              <div className="flex flex-wrap gap-3 pt-1">
                <button
                  type="button"
                  onClick={this.handleReset}
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold bg-stone-900 text-white hover:bg-black transition-colors"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  إعادة المحاولة
                </button>
                <button
                  type="button"
                  onClick={() => window.location.assign("/")}
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold border-2 border-stone-300 bg-white text-stone-800 hover:bg-stone-50 transition-colors"
                >
                  <Home className="h-4 w-4" aria-hidden="true" />
                  الصفحة الرئيسية
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default AppErrorBoundary;
