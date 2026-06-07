import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { CreditCard, ShoppingBag, ArrowUpCircle } from "lucide-react";
import { format } from "date-fns";

export default function StudentBalanceTab({ student }) {
  // 1. Fetch Wallet Balance from student_wallet
  const { data: walletList = [], isLoading: loadingWallet } = useQuery({
    queryKey: ["student-wallet-tab", student.id],
    queryFn: () => base44.entities.StudentWallet.filter({ student_id: student.id }),
    enabled: !!student.id,
    staleTime: 1000 * 60 * 2,
  });

  // 2. Fetch Wallet Transactions from wallet_transactions
  const { data: transactions = [], isLoading: loadingTransactions } = useQuery({
    queryKey: ["student-wallet-transactions-tab", student.id],
    queryFn: () => base44.entities.WalletTransaction.filter({ student_id: student.id }, "-created_at"),
    enabled: !!student.id,
    staleTime: 1000 * 60 * 2,
  });

  const wallet = walletList && walletList.length > 0 ? walletList[0] : null;
  const balance = wallet ? parseFloat(wallet.balance) : 0;

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Balance Card */}
      <Card className={`p-6 border shadow-sm text-center ${balance < 5 ? "border-rose-200 bg-rose-50/50" : "border-emerald-200 bg-emerald-50/50"}`}>
        <CreditCard className={`h-8 w-8 mx-auto mb-2 ${balance < 5 ? "text-rose-600" : "text-emerald-600"}`} />
        <p className={`text-4xl font-black num-en ${balance < 5 ? "text-rose-600" : "text-emerald-600"}`}>${balance.toFixed(2)}</p>
        <p className="text-xs font-bold text-stone-500 mt-1">رصيد بطاقة المتجر الذكية</p>
        {balance < 5 && <p className="text-[10px] text-rose-600 font-bold mt-2">⚠️ الرصيد منخفض — يرجى الطلب من ولي الأمر شحن البطاقة</p>}
      </Card>

      {/* Transactions History */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 justify-start">
          <ShoppingBag className="h-3.5 w-3.5" /> سجل معاملات البطاقة والمشتريات
        </h3>
        
        {loadingTransactions ? (
          <p className="text-xs text-stone-400 p-4">جاري تحميل سجل العمليات...</p>
        ) : transactions.length === 0 ? (
          <Card className="p-8 text-center border-dashed border-2 border-stone-100 bg-stone-50/30">
            <ShoppingBag className="h-8 w-8 text-stone-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-stone-400">لم يتم تسجيل أي عمليات شراء أو شحن على البطاقة بعد.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {transactions.map(tx => {
              const isTopup = tx.type === "topup" || tx.type === "refund";
              return (
                <Card key={tx.id} className="p-3.5 border shadow-xs flex items-center justify-between hover:bg-stone-50/30 transition-colors">
                  <div>
                    <p className="text-xs font-bold text-stone-850">
                      {tx.description || (isTopup ? "شحن رصيد" : "شراء من المقصف / المتجر")}
                    </p>
                    {tx.created_at && (
                      <p className="text-[10px] text-stone-400 num-en mt-0.5">
                        {format(new Date(tx.created_at), "yyyy-MM-dd HH:mm")}
                      </p>
                    )}
                  </div>
                  <span className={`font-black text-sm num-en ${isTopup ? "text-emerald-600" : "text-rose-500"}`}>
                    {isTopup ? "+" : "-"}${parseFloat(tx.amount).toFixed(2)}
                  </span>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}