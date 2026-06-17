import { useQuery } from "@tanstack/react-query";
import { entities } from "@/api/dbClient";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, ShoppingBag, ArrowUpCircle, Wallet, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { format } from "date-fns";

export default function StudentBalanceTab({ student }) {
  const studentId = student?.id || student;

  // 1. Fetch Wallet Balance from student_wallet
  const { data: walletArr = [], isLoading: loadingWallet } = useQuery({
    queryKey: ['student-wallet', studentId],
    queryFn: () => entities.StudentWallet.filter({ student_id: studentId }),
    enabled: !!studentId,
    staleTime: 1000 * 60 * 2,
  });

  // 2. Fetch Wallet Transactions from wallet_transactions
  const { data: transactions = [], isLoading: loadingTransactions } = useQuery({
    queryKey: ['wallet-transactions', studentId],
    queryFn: () => entities.WalletTransaction.filter({ student_id: studentId }),
    enabled: !!studentId,
    staleTime: 1000 * 60 * 2,
  });

  const balance = walletArr[0] ? parseFloat(walletArr[0].balance) : 0;

  // Sort transactions by date descending
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="space-y-8 text-right" dir="rtl">
      {/* Visual Elegant Smart Card */}
      <Card className="relative w-full overflow-hidden bg-gradient-to-br from-stone-900 via-stone-850 to-emerald-950 text-white rounded-[32px] shadow-2xl border-none p-8 flex flex-col justify-between min-h-[220px]">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/20 rounded-full blur-[80px]" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-teal-500/10 rounded-full blur-[80px]" />
        
        <div className="relative z-10 flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
              <Wallet size={20} className="text-teal-300" />
            </div>
            <div>
              <h4 className="font-serif font-black tracking-tight text-base">Edu<span className="text-emerald-400">Wallet</span></h4>
              <p className="text-[8px] font-bold text-stone-400 uppercase tracking-widest">محفظة الطالب الرقمية</p>
            </div>
          </div>
          <Badge className="bg-white/10 backdrop-blur-md text-white border border-white/10 rounded-lg text-[8px] font-black px-2 py-1 tracking-wider">
            NFC SMART CARD
          </Badge>
        </div>

        <div className="relative z-10 my-4 text-center md:text-right">
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">الرصيد المتاح بالشريحة الذكية</p>
          <p className="text-5xl font-black text-emerald-400 num-en">$${balance.toFixed(2)}</p>
        </div>

        <div className="relative z-10 flex justify-between items-end">
          <div>
            <h5 className="text-sm font-bold">{student?.full_name || student?.name || "حامل البطاقة"}</h5>
            <p className="text-stone-400 text-[9px] font-bold uppercase tracking-widest mt-1">ID: {student?.student_id || studentId}</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-bold">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>نشطة وجاهزة</span>
          </div>
        </div>
      </Card>

      {/* Transactions History */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-2 flex items-center gap-2 justify-start">
          <ShoppingBag className="h-4 w-4 text-stone-500" /> سجل حركات المحفظة والمشتريات
        </h3>
        
        {loadingTransactions ? (
          <p className="text-xs text-stone-400 p-4 text-center">جاري تحميل سجل العمليات...</p>
        ) : sortedTransactions.length === 0 ? (
          <Card className="p-12 text-center border-dashed border-2 border-stone-200 bg-stone-50/30 rounded-3xl">
            <ShoppingBag className="h-10 w-10 text-stone-300 mx-auto mb-2 opacity-40" />
            <p className="text-xs font-bold text-stone-400">لم يتم تسجيل أي عمليات شراء أو شحن على البطاقة بعد.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {sortedTransactions.map(tx => {
              const isTopup = tx.type === "topup" || tx.type === "refund";
              
              let badgeText = "مشتريات";
              let badgeStyle = "bg-rose-500/10 text-rose-600";
              let Icon = ArrowDownRight;
              let amountPrefix = "-";

              if (tx.type === "topup") {
                badgeText = "شحن رصيد";
                badgeStyle = "bg-emerald-500/10 text-emerald-600";
                Icon = ArrowUpRight;
                amountPrefix = "+";
              } else if (tx.type === "refund") {
                badgeText = "استرداد";
                badgeStyle = "bg-blue-500/10 text-blue-600";
                Icon = ArrowUpRight;
                amountPrefix = "+";
              }

              return (
                <Card key={tx.id} className="p-4 border shadow-xs hover:shadow-md transition-all duration-300 rounded-2xl bg-white flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                      isTopup ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                    }`}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-stone-850 text-xs">
                          {tx.description || (isTopup ? "شحن المحفظة الإلكترونية" : "مشتريات من متجر المدرسة")}
                        </span>
                        <Badge className={`${badgeStyle} border-none rounded-lg text-[9px] font-black px-2 py-0.5`}>
                          {badgeText}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-3 text-[10px] text-stone-400 mt-1 flex-wrap font-semibold">
                        {tx.created_at && (
                          <span className="num-en">
                            {format(new Date(tx.created_at), "yyyy-MM-dd HH:mm")}
                          </span>
                        )}
                        {tx.balance_after !== undefined && tx.balance_after !== null && (
                          <>
                            <span className="h-1 w-1 rounded-full bg-stone-200" />
                            <span>الرصيد بعد العملية: <strong className="text-stone-700 num-en">${parseFloat(tx.balance_after).toFixed(2)}</strong></span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className={`font-black text-sm num-en shrink-0 ${isTopup ? "text-emerald-650" : "text-rose-600"}`}>
                    {amountPrefix}${parseFloat(tx.amount).toFixed(2)}
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