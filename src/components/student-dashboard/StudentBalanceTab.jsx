import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { CreditCard, ShoppingCart, ArrowUpCircle } from "lucide-react";
import { format } from "date-fns";

export default function StudentBalanceTab({ student }) {
  const { data: purchases = [], isLoading: loadingPurchases } = useQuery({
    queryKey: ["purchases", student.id],
    queryFn: () => base44.entities.Purchase.filter({ student_id: student.id }, "-date"),
    enabled: !!student.id,
  });

  const { data: topups = [], isLoading: loadingTopups } = useQuery({
    queryKey: ["topups", student.id],
    queryFn: () => base44.entities.CardTopUp.filter({ student_id: student.id }, "-created_date"),
    enabled: !!student.id,
  });

  const balance = student.card_balance || 0;

  return (
    <div className="space-y-5">
      {/* Balance Card */}
      <Card className={`p-6 border shadow-sm text-center ${balance < 5 ? "border-red-200 bg-red-50" : "border-emerald-200 bg-emerald-50"}`}>
        <CreditCard className={`h-8 w-8 mx-auto mb-2 ${balance < 5 ? "text-destructive" : "text-emerald-600"}`} />
        <p className={`text-4xl font-bold ${balance < 5 ? "text-destructive" : "text-emerald-600"}`}>${balance.toFixed(2)}</p>
        <p className="text-sm text-muted-foreground mt-1">Current Card Balance</p>
        {balance < 5 && <p className="text-xs text-destructive font-medium mt-2">⚠️ Low balance — please top up</p>}
      </Card>

      {/* Top-ups */}
      {topups.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <ArrowUpCircle className="h-3.5 w-3.5" /> Recent Top-Ups
          </h3>
          <div className="space-y-2">
            {topups.slice(0, 5).map(t => (
              <Card key={t.id} className="p-3 border shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium capitalize">{t.method} top-up</p>
                  {t.created_date && (
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(t.created_date), "MMM d, yyyy")}
                    </p>
                  )}
                </div>
                <span className="font-bold text-emerald-600">+${(t.amount || 0).toFixed(2)}</span>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Purchases */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <ShoppingCart className="h-3.5 w-3.5" /> Recent Purchases
        </h3>
        {loadingPurchases ? (
          <p className="text-sm text-muted-foreground p-4">Loading...</p>
        ) : purchases.length === 0 ? (
          <Card className="p-6 text-center border shadow-sm">
            <ShoppingCart className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No purchases yet.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {purchases.map(p => (
              <Card key={p.id} className="p-3 border shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{p.item_name}</p>
                  {p.date && <p className="text-xs text-muted-foreground">{p.date}</p>}
                  {p.quantity > 1 && <p className="text-xs text-muted-foreground">x{p.quantity}</p>}
                </div>
                <span className="font-bold text-destructive">-${(p.total_amount || 0).toFixed(2)}</span>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}