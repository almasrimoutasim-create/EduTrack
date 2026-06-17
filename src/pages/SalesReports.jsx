import React from "react";
import { useQuery } from "@tanstack/react-query";
import { entities } from "@/api/dbClient";
import { useLanguage } from "@/lib/LanguageContext";
import { Card } from "@/components/ui/card";
import { TrendingUp, Banknote, CreditCard, Wallet, Package, ShoppingBag, ArrowUpRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function SalesReports() {
  const { language } = useLanguage();
  const isRTL = language === "ar";

  const { data: purchases = [], isLoading } = useQuery({
    queryKey: ["store-purchases"],
    queryFn: () => entities.Purchase.list()
  });

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  const totalRevenue = purchases.reduce((sum, p) => sum + (parseFloat(p.total_price || p.total_amount || 0)), 0);
  const totalOrders = purchases.length;
  
  // Payment methods breakdown
  const walletSales = purchases.filter(p => p.payment_method === "wallet" || p.payment_method === "card").reduce((sum, p) => sum + parseFloat(p.total_price || p.total_amount || 0), 0);
  const cardSales = purchases.filter(p => p.payment_method === "credit_card").reduce((sum, p) => sum + parseFloat(p.total_price || p.total_amount || 0), 0);
  const cashSales = purchases.filter(p => p.payment_method === "cash").reduce((sum, p) => sum + parseFloat(p.total_price || p.total_amount || 0), 0);

  // Top products
  const productSales = {};
  purchases.forEach(p => {
    if (!productSales[p.item_name]) {
      productSales[p.item_name] = { qty: 0, revenue: 0 };
    }
    productSales[p.item_name].qty += (p.quantity || 1);
    productSales[p.item_name].revenue += parseFloat(p.total_price || p.total_amount || 0);
  });

  const topProducts = Object.entries(productSales)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5);

  return (
    <div className="p-6 md:p-8 space-y-8" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight">
            {isRTL ? "تقارير المبيعات" : "Sales Reports"}
          </h1>
          <p className="text-stone-500 font-medium mt-1">
            {isRTL ? "تحليل المبيعات، الإيرادات، والمنتجات الأكثر مبيعاً" : "Analyze sales, revenue, and top-selling products"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 rounded-[24px] border border-stone-100 shadow-sm bg-stone-900 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-bold text-stone-400 mb-1">{isRTL ? "إجمالي الإيرادات" : "Total Revenue"}</p>
              <h3 className="text-4xl font-black text-emerald-400 num-en">${totalRevenue.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-stone-800 rounded-2xl text-emerald-400">
              <TrendingUp size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs font-bold text-emerald-500 bg-emerald-500/10 w-fit px-2 py-1 rounded-md">
            <ArrowUpRight size={14} />
            <span>+15.3% {isRTL ? "هذا الشهر" : "this month"}</span>
          </div>
        </Card>

        <Card className="p-6 rounded-[24px] border border-stone-100 shadow-sm bg-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-bold text-stone-400 mb-1">{isRTL ? "عدد الطلبات" : "Total Orders"}</p>
              <h3 className="text-4xl font-black text-stone-900 num-en">{totalOrders}</h3>
            </div>
            <div className="p-3 bg-stone-50 rounded-2xl text-stone-600">
              <ShoppingBag size={24} />
            </div>
          </div>
        </Card>

        <Card className="p-6 rounded-[24px] border border-stone-100 shadow-sm bg-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-bold text-stone-400 mb-1">{isRTL ? "متوسط قيمة الطلب" : "Avg Order Value"}</p>
              <h3 className="text-4xl font-black text-stone-900 num-en">
                ${totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : "0.00"}
              </h3>
            </div>
            <div className="p-3 bg-stone-50 rounded-2xl text-stone-600">
              <Banknote size={24} />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 md:p-8 rounded-[32px] border border-stone-100 shadow-sm bg-white">
          <h2 className="text-xl font-bold text-stone-800 mb-6">{isRTL ? "تحليل طرق الدفع" : "Payment Methods Analysis"}</h2>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-bold text-stone-700 flex items-center gap-2"><Wallet size={16} className="text-teal-600"/> {isRTL ? "المحفظة الإلكترونية" : "E-Wallet"}</span>
                <span className="font-bold text-stone-900 num-en">${walletSales.toLocaleString()}</span>
              </div>
              <Progress value={totalRevenue > 0 ? (walletSales / totalRevenue) * 100 : 0} className="h-2.5 bg-stone-100 [&>div]:bg-teal-500" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-bold text-stone-700 flex items-center gap-2"><CreditCard size={16} className="text-indigo-600"/> {isRTL ? "بطاقات ائتمان" : "Credit Cards"}</span>
                <span className="font-bold text-stone-900 num-en">${cardSales.toLocaleString()}</span>
              </div>
              <Progress value={totalRevenue > 0 ? (cardSales / totalRevenue) * 100 : 0} className="h-2.5 bg-stone-100 [&>div]:bg-indigo-500" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-bold text-stone-700 flex items-center gap-2"><Banknote size={16} className="text-emerald-600"/> {isRTL ? "كاش (نقدي)" : "Cash"}</span>
                <span className="font-bold text-stone-900 num-en">${cashSales.toLocaleString()}</span>
              </div>
              <Progress value={totalRevenue > 0 ? (cashSales / totalRevenue) * 100 : 0} className="h-2.5 bg-stone-100 [&>div]:bg-emerald-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6 md:p-8 rounded-[32px] border border-stone-100 shadow-sm bg-white">
          <h2 className="text-xl font-bold text-stone-800 mb-6">{isRTL ? "المنتجات الأكثر مبيعاً" : "Top Selling Products"}</h2>
          {topProducts.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-stone-400 font-bold">
              {isRTL ? "لا توجد مبيعات بعد" : "No sales yet"}
            </div>
          ) : (
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-stone-50 rounded-2xl border border-stone-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black num-en">
                      #{index + 1}
                    </div>
                    <div>
                      <p className="font-bold text-stone-900 text-sm">{product[0]}</p>
                      <p className="text-xs text-stone-500 font-semibold mt-0.5"><span className="num-en">{product[1].qty}</span> {isRTL ? "قطعة مباعة" : "units sold"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-emerald-600 num-en">${product[1].revenue.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
