import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { entities } from "@/api/dbClient";
import { useLanguage } from "@/lib/LanguageContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, ShoppingBag, CalendarDays, Wallet, CreditCard, Banknote, UserCircle2 } from "lucide-react";

export default function SalesOrders() {
  const { language } = useLanguage();
  const isRTL = language === "ar";

  const [searchTerm, setSearchTerm] = useState("");

  const { data: purchases = [], isLoading } = useQuery({
    queryKey: ["store-purchases"],
    queryFn: () => entities.Purchase.list("-created_at")
  });

  const filteredPurchases = purchases.filter(p => 
    (p.student_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.item_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.student_id || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPaymentIcon = (method) => {
    switch (method) {
      case "wallet":
      case "card":
        return <Wallet size={14} className="text-teal-600" />;
      case "credit_card":
        return <CreditCard size={14} className="text-indigo-600" />;
      case "cash":
        return <Banknote size={14} className="text-emerald-600" />;
      default:
        return <Banknote size={14} className="text-stone-400" />;
    }
  };

  const getPaymentLabel = (method) => {
    switch (method) {
      case "wallet":
      case "card":
        return isRTL ? "المحفظة" : "Wallet";
      case "credit_card":
        return isRTL ? "بطاقة ائتمان" : "Credit Card";
      case "cash":
        return isRTL ? "نقدي" : "Cash";
      default:
        return method || (isRTL ? "غير محدد" : "N/A");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight">
            {isRTL ? "الطلبات والمبيعات" : "Sales Orders"}
          </h1>
          <p className="text-stone-500 font-medium mt-1">
            {isRTL ? "سجل كافة حركات الشراء والمبيعات من المتجر ونقاط البيع" : "Log of all purchase and sales transactions from store and POS"}
          </p>
        </div>
      </div>

      <Card className="border border-stone-100 shadow-sm rounded-[32px] overflow-hidden bg-white">
        <div className="p-6 border-b border-stone-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
            <ShoppingBag size={20} className="text-primary" />
            {isRTL ? "سجل العمليات" : "Transactions Log"}
          </h2>
          <div className="relative w-full sm:w-96">
            <Search className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 text-stone-400`} size={16} />
            <Input 
              placeholder={isRTL ? "بحث باسم الطالب، المنتج، أو رقم الهوية..." : "Search by student name, product, or ID..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`h-11 bg-stone-50 border-stone-100 rounded-xl text-sm ${isRTL ? "pr-10" : "pl-10"}`}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-stone-50/50 text-stone-500 font-semibold border-b border-stone-100">
              <tr>
                <th className={`p-4 font-bold ${isRTL ? "text-right" : "text-left"}`}>{isRTL ? "التاريخ والوقت" : "Date & Time"}</th>
                <th className={`p-4 font-bold ${isRTL ? "text-right" : "text-left"}`}>{isRTL ? "العميل / الطالب" : "Customer / Student"}</th>
                <th className={`p-4 font-bold ${isRTL ? "text-right" : "text-left"}`}>{isRTL ? "المنتج" : "Product"}</th>
                <th className={`p-4 font-bold ${isRTL ? "text-right" : "text-left"}`}>{isRTL ? "الكمية" : "Qty"}</th>
                <th className={`p-4 font-bold ${isRTL ? "text-right" : "text-left"}`}>{isRTL ? "الإجمالي" : "Total"}</th>
                <th className={`p-4 font-bold ${isRTL ? "text-right" : "text-left"}`}>{isRTL ? "طريقة الدفع" : "Payment"}</th>
              </tr>
            </thead>
            <tbody>
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-stone-400 font-medium">
                    {isRTL ? "لا توجد عمليات تطابق البحث." : "No transactions match your search."}
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((purchase) => (
                  <tr key={purchase.id} className="border-b border-stone-50 hover:bg-stone-50/50 transition-colors">
                    <td className={`p-4 ${isRTL ? "text-right" : "text-left"}`}>
                      <div className="flex items-center gap-2 text-stone-600">
                        <CalendarDays size={14} className="text-stone-400" />
                        <span className="num-en font-medium">
                          {new Date(purchase.created_at || purchase.created_date || Date.now()).toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className={`p-4 ${isRTL ? "text-right" : "text-left"}`}>
                      <div className="flex items-center gap-2">
                        <UserCircle2 size={16} className="text-stone-400" />
                        <div className="flex flex-col">
                          <span className="font-bold text-stone-800">{purchase.student_name || (isRTL ? "غير مسجل" : "Walk-in")}</span>
                          <span className="text-xs text-stone-400 num-en">{purchase.student_id}</span>
                        </div>
                      </div>
                    </td>
                    <td className={`p-4 font-bold text-stone-700 ${isRTL ? "text-right" : "text-left"}`}>
                      {purchase.item_name}
                    </td>
                    <td className={`p-4 font-black text-stone-900 num-en ${isRTL ? "text-right" : "text-left"}`}>
                      x{purchase.quantity || 1}
                    </td>
                    <td className={`p-4 font-black text-primary num-en ${isRTL ? "text-right" : "text-left"}`}>
                      ${parseFloat(purchase.total_price || purchase.total_amount || 0).toFixed(2)}
                    </td>
                    <td className={`p-4 ${isRTL ? "text-right" : "text-left"}`}>
                      <Badge variant="outline" className="bg-white font-bold flex items-center gap-1.5 w-fit border-stone-200">
                        {getPaymentIcon(purchase.payment_method)}
                        {getPaymentLabel(purchase.payment_method)}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
