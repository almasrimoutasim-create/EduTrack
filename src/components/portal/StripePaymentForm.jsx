import React, { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { toast } from "sonner";
import { ShieldCheck, CreditCard, Loader2 } from "lucide-react";

export default function StripePaymentForm({ amount, onSuccess, onCancel, language }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [cardholderName, setCardholderName] = useState("");
  const isRTL = language === "ar";

  const cardElementOptions = {
    style: {
      base: {
        color: "#1c1917", // stone-900
        fontFamily: "Cairo, sans-serif",
        fontSmoothing: "antialiased",
        fontSize: "15px",
        "::placeholder": {
          color: "#78716c", // stone-500
        },
      },
      invalid: {
        color: "#dc2626", // red-600
        iconColor: "#dc2626",
      },
    },
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    if (!cardholderName.trim()) {
      toast.error(isRTL ? "يرجى إدخال اسم حامل البطاقة" : "Please enter cardholder name");
      return;
    }

    setProcessing(true);
    try {
      // 1. Create PaymentIntent on server
      const res = await fetch("/neon-db/payments/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, currency: "USD" }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || (isRTL ? "فشل إنشاء عملية الدفع" : "Failed to initiate payment"));
      }

      const { clientSecret } = await res.json();

      // 2. Confirm the card payment via Stripe
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: cardholderName,
          },
        },
      });

      if (result.error) {
        throw new Error(result.error.message);
      } else {
        if (result.paymentIntent.status === "succeeded") {
          toast.success(isRTL ? "تمت عملية الدفع بنجاح!" : "Payment succeeded!");
          onSuccess(result.paymentIntent);
        }
      }
    } catch (err) {
      console.error("Stripe payment error:", err);
      toast.error(err.message || (isRTL ? "حدث خطأ أثناء معالجة الدفع" : "An error occurred during payment processing"));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Cardholder name input */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
          {isRTL ? "اسم حامل البطاقة" : "Cardholder Name"}
        </label>
        <input
          type="text"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          placeholder={isRTL ? "الاسم كما هو مكتوب على البطاقة" : "John Doe"}
          disabled={processing}
          className="w-full h-11 px-3 rounded-xl border border-stone-200 bg-white text-stone-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50"
        />
      </div>

      {/* Stripe card element wrapper */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
          {isRTL ? "بيانات بطاقة الائتمان" : "Credit Card Info"}
        </label>
        <div className="w-full p-4 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-50/50 transition-colors">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      {/* Security note */}
      <div className="flex items-center gap-2 text-[11px] text-emerald-600 bg-emerald-50 rounded-lg p-2.5 border border-emerald-100">
        <ShieldCheck className="h-4 w-4 shrink-0" />
        <span>{isRTL ? "تشفير آمن بنسبة 100% متوافق مع معايير PCI-DSS" : "100% Encrypted & Secure checkout (PCI-DSS compliant)"}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={processing}
            className="flex-1 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all border-2 border-stone-200 bg-white text-stone-800 hover:bg-stone-50 h-11 px-4 cursor-pointer disabled:opacity-50"
          >
            {isRTL ? "إلغاء" : "Cancel"}
          </button>
        )}
        <button
          type="submit"
          disabled={processing || !stripe || !elements}
          className="flex-1 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-stone-900 text-white hover:bg-black h-11 px-4 cursor-pointer shadow-lg shadow-stone-200 disabled:opacity-50"
        >
          {processing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{isRTL ? "جاري المعالجة..." : "Processing..."}</span>
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4" />
              <span>{isRTL ? `ادفع $${amount.toFixed(2)}` : `Pay $${amount.toFixed(2)}`}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
