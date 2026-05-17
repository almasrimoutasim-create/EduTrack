import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertCircle, CreditCard, Wallet, Lock } from "lucide-react";
import { toast } from "sonner";

export default function ParentFinesTab({ student, privacyMode }) {
  const qc = useQueryClient();
  const [paying, setPaying] = useState(null);
  const [paymentDialog, setPaymentDialog] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("wallet");

  const { data: fines = [] } = useQuery({
    queryKey: ["parent-fines", student.id],
    queryFn: () => base44.entities.Fine.filter({ student_id: student.id }, "-created_date"),
  });

  const pending = fines.filter(f => f.status === "pending");
  const totalPending = pending.reduce((s, f) => s + (f.amount || 0), 0);

  const handlePayFine = (fine) => {
    setPaymentDialog(fine);
    setPaymentMethod("wallet");
  };

  const confirmPayment = async (fine) => {
    if (paymentMethod === "wallet") {
      if ((student.card_balance || 0) < fine.amount) {
        toast.error(`Insufficient balance. Required: $${fine.amount}, Available: $${(student.card_balance || 0).toFixed(2)}`);
        return;
      }

      setPaying(fine.id);
      await base44.entities.Fine.update(fine.id, { status: "paid" });
      await base44.entities.Student.update(student.id, { card_balance: (student.card_balance || 0) - fine.amount });
      
      // Track payment in financial records
      await base44.entities.FinancialRecord.create({
        record_type: "fine_payment",
        recipient_type: "student",
        recipient_name: student.full_name,
        recipient_id: student.id,
        amount: fine.amount,
        description: `Fine Payment: ${fine.reason}`,
        payment_date: new Date().toISOString().split('T')[0],
        status: "paid",
        payment_method: "digital_wallet"
      });

      qc.invalidateQueries(["parent-fines", student.id]);
      setPaying(null);
      setPaymentDialog(null);
      toast.success(`Fine of $${fine.amount.toFixed(2)} paid successfully from digital wallet`);
    }
  };

  if (fines.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="h-10 w-10 text-emerald-500 mx-auto mb-3">✓</div>
        <p className="font-semibold text-sm">No fines on record</p>
        <p className="text-xs text-muted-foreground">Your child has no outstanding or paid fines.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Pending Fines</p>
          <p className="text-2xl font-bold text-destructive">{pending.length}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Total Owed</p>
          <p className="text-2xl font-bold text-destructive">{privacyMode ? "••••" : `$${totalPending.toFixed(2)}`}</p>
        </Card>
      </div>

      {pending.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex gap-2">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold text-red-900">Outstanding Fines</p>
            <p className="text-red-700 text-xs mt-1">Pay securely using your child's digital wallet balance below.</p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {fines.map(fine => (
          <Card key={fine.id} className={`p-4 ${fine.status === "pending" ? "border-red-200 bg-red-50/30" : ""}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-sm">{fine.reason}</p>
                  <Badge variant={fine.status === "pending" ? "destructive" : fine.status === "paid" ? "default" : "secondary"} className="text-xs capitalize">
                    {fine.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {fine.date} {fine.issued_by && `• Issued by ${fine.issued_by}`}
                </p>
                {fine.category && (
                  <Badge variant="outline" className="text-xs capitalize">
                    {fine.category}
                  </Badge>
                )}
                {fine.notes && <p className="text-xs text-muted-foreground italic mt-2">{fine.notes}</p>}
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-bold text-destructive">${fine.amount?.toFixed(2)}</p>
                {fine.status === "pending" && (
                  <button
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed mt-2 h-8 px-3 bg-rose-500 hover:bg-rose-600"
                    onClick={() => handlePayFine(fine)}
                    disabled={paying === fine.id}
                  >
                    {paying === fine.id ? "Paying..." : "Pay Now"}
                  </button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {fines.some(f => f.status === "paid") && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payment History</p>
          {fines
            .filter(f => f.status === "paid")
            .map(fine => (
              <Card key={fine.id} className="p-3 bg-emerald-50/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">{fine.reason}</p>
                    <p className="text-xs text-muted-foreground">{fine.date}</p>
                  </div>
                  <p className="text-sm font-semibold text-emerald-600">✓ Paid ${fine.amount?.toFixed(2)}</p>
                </div>
              </Card>
            ))}
        </div>
      )}

      {/* Payment Dialog */}
      <Dialog open={!!paymentDialog} onOpenChange={(open) => !open && setPaymentDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Secure Fine Payment</DialogTitle>
          </DialogHeader>

          {paymentDialog && (
            <div className="space-y-4 py-4">
              {/* Fine Summary */}
              <div className="bg-slate-50 rounded-lg p-4 border">
                <p className="text-sm text-muted-foreground mb-1">Fine Amount Due</p>
                <p className="text-3xl font-bold text-destructive">${paymentDialog.amount?.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-2">{paymentDialog.reason}</p>
              </div>

              {/* Wallet Balance */}
              <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-emerald-700 font-semibold">Digital Wallet Balance</p>
                    <p className="text-2xl font-bold text-emerald-600">${(student.card_balance || 0).toFixed(2)}</p>
                  </div>
                  <Wallet className="h-8 w-8 text-emerald-600 opacity-50" />
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-muted-foreground">Payment Method</p>
                <div className="grid gap-2">
                  <button
                    onClick={() => setPaymentMethod("wallet")}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      paymentMethod === "wallet"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Wallet className={`h-5 w-5 ${paymentMethod === "wallet" ? "text-primary" : "text-muted-foreground"}`} />
                      <div>
                        <p className="font-medium text-sm">Digital Wallet</p>
                        <p className="text-xs text-muted-foreground">Pay from student card balance</p>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => setPaymentMethod("card")}
                    disabled
                    className="p-3 rounded-lg border-2 border-border text-left opacity-50 cursor-not-allowed"
                  >
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">Credit/Debit Card</p>
                        <p className="text-xs text-muted-foreground">Coming soon</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Security Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 flex gap-2">
                <Lock className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">All payments are encrypted and securely processed through our payment system.</p>
              </div>

              {/* Balance Check */}
              {paymentMethod === "wallet" && (student.card_balance || 0) < paymentDialog.amount && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-red-700">Insufficient Balance</p>
                    <p className="text-xs text-red-600">
                      You need ${(paymentDialog.amount - (student.card_balance || 0)).toFixed(2)} more to pay this fine.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all border-2 border-stone-200 bg-white text-stone-800 hover:bg-stone-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed h-11 px-4" onClick={() => setPaymentDialog(null)}>
              Cancel
            </button>
            <button
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed h-11 px-4 bg-rose-500 hover:bg-rose-600"
              onClick={() => confirmPayment(paymentDialog)}
              disabled={
                paying ||
                paymentMethod === "wallet" && (student.card_balance || 0) < paymentDialog?.amount
              }
            >
              {paying ? "Processing..." : `Pay $${paymentDialog?.amount?.toFixed(2)}`}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}