import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, ReceiptText, Eye, Loader2 } from "lucide-react";

/**
 * Returns true when a FinancialRecord row is a parent-uploaded tuition
 * receipt that is still waiting for admin review.
 */
export function isPendingTuitionReceipt(r) {
  if (!r || r.status !== "pending") return false;
  const isTuitionType = r.record_type === "tuition" || r.record_type === "income";
  if (!isTuitionType) return false;
  const desc = (r.description || "").toLowerCase();
  const isTopUp =
    desc.includes("top-up") ||
    desc.includes("top up") ||
    desc.includes("شحن") ||
    desc.includes("بطاقة") ||
    desc.includes("card") ||
    desc.includes("wallet") ||
    desc.includes("محفظة");
  if (isTopUp) return false;
  // Receipt uploads carry one of these markers (or an attached image)
  return (
    desc.includes("receipt") ||
    desc.includes("إيصال") ||
    !!r.receipt_image ||
    !!r.receipt_filename ||
    !!r.transfer_reference
  );
}

function ReceiptPreview({ record, isRTL, onClose }) {
  const src = record.receipt_image || "";
  const isPdf = src.startsWith("data:application/pdf") || (record.receipt_filename || "").toLowerCase().endsWith(".pdf");
  return (
    <div
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div
        className="bg-white rounded-3xl p-5 max-w-2xl w-full max-h-[90vh] overflow-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-black text-stone-900">
            {isRTL ? "معاينة إيصال السداد" : "Receipt Preview"}
            <span className="block text-xs font-bold text-stone-400 mt-1 num-en">{record.receipt_filename || ""}</span>
          </h4>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-xl bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
        {src ? (
          isPdf ? (
            <iframe title="receipt" src={src} className="w-full h-[60vh] rounded-2xl border border-stone-200" />
          ) : (
            <img src={src} alt="receipt" className="w-full rounded-2xl border border-stone-200 object-contain max-h-[60vh]" />
          )
        ) : (
          <div className="py-10 text-center text-stone-400 text-sm font-bold">
            {isRTL ? "لا توجد صورة مرفقة — المرجع المذكور في الوصف فقط." : "No image attached — reference in description only."}
          </div>
        )}
        {(record.transfer_reference || record.description) && (
          <div className="mt-4 p-4 rounded-2xl bg-stone-50 border border-stone-100 text-xs text-stone-600 space-y-1">
            {record.transfer_reference && (
              <p><strong>{isRTL ? "رقم المرجع: " : "Reference: "}</strong><span className="num-en">{record.transfer_reference}</span></p>
            )}
            {record.description && <p className="leading-relaxed">{record.description}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Pending tuition receipts review list.
 * Each receipt: { ...FinancialRecord, _studentName? }
 */
export default function PendingTuitionReceipts({
  receipts = [],
  isRTL = true,
  processingId = null,
  onApprove,
  onReject,
}) {
  const [previewRecord, setPreviewRecord] = React.useState(null);

  return (
    <Card className="border-2 border-amber-200 bg-amber-50/40 shadow-sm rounded-3xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-2xl bg-amber-500/15 flex items-center justify-center text-amber-600">
            <ReceiptText size={20} />
          </div>
          <div>
            <h4 className="font-black text-stone-900">
              {isRTL ? "إيصالات السداد قيد المراجعة" : "Receipts Pending Review"}
            </h4>
            <p className="text-[11px] font-bold text-stone-400">
              {isRTL
                ? "إيصالات مرفوعة من أولياء الأمور بانتظار الاعتماد أو الرفض"
                : "Parent-uploaded receipts awaiting approval or rejection"}
            </p>
          </div>
        </div>
        <Badge className="bg-amber-500 text-white border-none rounded-xl font-black num-en">
          {receipts.length}
        </Badge>
      </div>

      {receipts.length === 0 ? (
        <div className="py-6 text-center text-stone-400 text-xs font-bold bg-white/60 rounded-2xl border border-amber-100">
          {isRTL ? "لا توجد إيصالات معلقة حالياً." : "No pending receipts."}
        </div>
      ) : (
        <div className="space-y-3">
          {receipts.map((rec) => {
            const busy = processingId === rec.id;
            return (
              <div
                key={rec.id}
                className="p-4 rounded-2xl border border-amber-100 bg-white flex flex-col md:flex-row md:items-center gap-4"
              >
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-stone-900 text-sm">
                      {rec._studentName || rec.recipient_name || (isRTL ? "طالب" : "Student")}
                    </span>
                    <Badge className="bg-amber-500/10 text-amber-700 border-none rounded-lg text-[10px] font-bold">
                      {isRTL ? "بانتظار المراجعة" : "Pending"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-stone-500 font-semibold">
                    <span>
                      {isRTL ? "المبلغ: " : "Amount: "}
                      <strong className="text-stone-900 num-en">${parseFloat(rec.amount || 0).toFixed(2)}</strong>
                    </span>
                    <span className="num-en">{(rec.payment_date || rec.created_at || "").split("T")[0]}</span>
                    {rec.transfer_reference && (
                      <span>{isRTL ? "المرجع: " : "Ref: "}<strong className="num-en">{rec.transfer_reference}</strong></span>
                    )}
                  </div>
                  {rec.description && (
                    <p className="text-[11px] text-stone-400 leading-relaxed line-clamp-2">{rec.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setPreviewRecord(rec)}
                    className="h-10 px-4 rounded-xl border-2 border-stone-200 bg-white text-stone-700 hover:bg-stone-50 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Eye size={14} />
                    {isRTL ? "معاينة" : "Preview"}
                  </button>
                  <button
                    onClick={() => onApprove?.(rec)}
                    disabled={busy}
                    className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    {isRTL ? "اعتماد" : "Approve"}
                  </button>
                  <button
                    onClick={() => onReject?.(rec)}
                    disabled={busy}
                    className="h-10 px-4 rounded-xl bg-white border-2 border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    <X size={14} />
                    {isRTL ? "رفض" : "Reject"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {previewRecord && (
        <ReceiptPreview record={previewRecord} isRTL={isRTL} onClose={() => setPreviewRecord(null)} />
      )}
    </Card>
  );
}
