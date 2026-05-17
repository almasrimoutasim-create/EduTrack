import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  Plus, 
  ShoppingCart, 
  Package, 
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/translations";
import PageHeader from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import StoreItemFormDialog from "@/components/shared/StoreItemFormDialog";
import { toast } from "sonner";

const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all border-2 border-stone-300 bg-white text-stone-800 hover:bg-stone-50 hover:border-stone-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const btnPrimary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed";

export default function Store() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);

  const { data: storeItems = [], isLoading } = useQuery({ 
    queryKey: ["store-items"], 
    queryFn: () => base44.entities.StoreItem.list("-created_date", 50) 
  });

  const { data: purchases = [] } = useQuery({ 
    queryKey: ["store-purchases"], 
    queryFn: () => base44.entities.Purchase.list("-created_date", 20) 
  });

  const filteredItems = storeItems.filter(item => 
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockItems = storeItems.filter(i => i.stock <= (i.low_stock_threshold || 5)).length;
  const totalSales = purchases.reduce((sum, p) => sum + (p.total_amount || 0), 0);

  const handleAdd = () => {
    setSelectedItem(null);
    setDialogOpen(true);
  };

  const handleDelete = async (item) => {
    try {
      await base44.entities.StoreItem.delete(item.id);
      toast.success(isRTL ? "تم حذف المنتج" : "Product deleted");
    } catch (err) {
      toast.error(isRTL ? "فشل الحذف" : "Failed to delete");
    }
  };

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(c => c.item_id === item.id);
      if (existing) {
        return prev.map(c => c.item_id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { item_id: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
    toast.success(isRTL ? `تمت إضافة ${item.name} للسلة` : `Added ${item.name} to cart`);
  };

  const removeFromCart = (itemId) => {
    setCart(prev => prev.filter(c => c.item_id !== itemId));
  };

  const updateCartQty = (itemId, qty) => {
    if (qty <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(prev => prev.map(c => c.item_id === itemId ? { ...c, quantity: qty } : c));
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    try {
      for (const c of cart) {
        await base44.entities.Purchase.create({
          student_id: "admin",
          student_name: "Admin",
          item_id: c.item_id,
          item_name: c.name,
          quantity: c.quantity,
          unit_price: c.price,
          total_amount: c.price * c.quantity,
          date: new Date().toISOString().split("T")[0]
        });
      }
      toast.success(isRTL ? "تم إتمام الشراء بنجاح" : "Checkout successful");
      setCart([]);
      setShowCart(false);
    } catch (err) {
      toast.error(isRTL ? "فشل إتمام الشراء" : "Checkout failed");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  return (
    <div className="space-y-6 pb-20" dir={isRTL ? "rtl" : "ltr"}>
      <PageHeader 
        title={t("common.store", language)} 
        subtitle={isRTL ? "متجر المدرسة للزي الموحد، الكتب، والمستلزمات الدراسية" : "School store for uniforms, books, and educational supplies"}
      >
        <div className="flex gap-3">
          <button onClick={() => setShowCart(!showCart)} className={`${btnOutline} h-11 px-5 relative`}>
            <ShoppingCart size={18} />
            <span>{isRTL ? "السلة" : "Cart"}</span>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white num-en">{cartCount}</span>
            )}
          </button>
          <button onClick={handleAdd} className={`${btnPrimary} h-11 px-5`}>
            <Plus size={18} />
            <span>{isRTL ? "إضافة منتج" : "Add Product"}</span>
          </button>
        </div>
      </PageHeader>

      {/* Store Highlights Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: isRTL ? "إجمالي المنتجات" : "Total Products", value: storeItems.length, icon: Package, color: "text-primary", bg: "bg-primary/10" },
          { label: isRTL ? "مبيعات الشهر" : "Monthly Sales", value: `$${totalSales.toLocaleString()}`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: isRTL ? "نواقص المخزون" : "Low Stock", value: lowStockItems, icon: AlertCircle, color: "text-rose-600", bg: "bg-rose-50" },
          { label: isRTL ? "طلبات قيد التنفيذ" : "Active Orders", value: purchases.length, icon: ShoppingBag, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((stat, i) => (
          <Card key={i} className="p-5 border shadow-sm bg-white rounded-xl group">
            <div className={`h-11 w-11 rounded-lg ${stat.bg} flex items-center justify-center ${stat.color} mb-3 group-hover:scale-110 transition-transform`}>
              <stat.icon size={22} />
            </div>
            <p className="text-stone-400 text-[10px] font-semibold uppercase tracking-wide mb-0.5">{stat.label}</p>
            <h4 className="text-xl font-bold text-stone-900 num-en">{stat.value}</h4>
          </Card>
        ))}
      </div>

      {/* Shopping Interface */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Card className="p-2 border shadow-sm bg-white rounded-xl flex-1 md:w-80">
              <div className="relative">
                <Search className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-stone-400`} size={18} />
                <Input 
                  placeholder={isRTL ? "ابحث عن منتج..." : "Search product..."} 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`h-11 ${isRTL ? 'pr-12' : 'pl-12'} border-none bg-transparent text-base font-medium focus-visible:ring-0`}
                  dir={isRTL ? "rtl" : "ltr"}
                />
              </div>
            </Card>
            <button className={`${btnOutline} h-11 w-11 p-0`}><Filter size={18} /></button>
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto pb-2 w-full md:w-auto">
            {['الكل', 'الزي المدرسي', 'الأدوات المكتبية', 'الكتب', 'أخرى'].map((cat, i) => (
              <Badge key={i} className={`cursor-pointer px-4 py-2 rounded-lg border-none font-semibold text-xs whitespace-nowrap ${i === 0 ? 'bg-primary text-white' : 'bg-white text-stone-500 hover:bg-stone-100 transition-colors'}`}>
                {isRTL ? cat : (i === 0 ? 'All' : cat)}
              </Badge>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="h-80 bg-stone-100 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  variants={{ hidden: { scale: 0.95, opacity: 0 }, visible: { scale: 1, opacity: 1 } }}
                  whileHover={{ y: -6 }}
                  className="group"
                >
                  <Card className="p-0 border shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl bg-white overflow-hidden h-full flex flex-col">
                    <div className="h-48 bg-stone-50 relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
                      <div className="absolute inset-0 flex items-center justify-center text-stone-200">
                        <Package size={56} className="opacity-20" />
                      </div>
                      <Badge className="absolute top-5 right-5 bg-white/90 backdrop-blur-md text-stone-900 border-none rounded-lg font-bold text-[10px] px-3 py-1 shadow-md">
                        {item.category || (isRTL ? "منتج" : "Product")}
                      </Badge>
                      {item.stock <= 5 && (
                        <Badge className="absolute top-5 left-5 bg-rose-500 text-white border-none rounded-lg font-bold text-[8px] px-2 py-0.5 shadow-md animate-pulse">
                          {isRTL ? "كمية محدودة" : "Low Stock"}
                        </Badge>
                      )}
                    </div>

                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-1.5">
                        <h5 className="font-bold text-stone-900 leading-tight group-hover:text-primary transition-colors">
                          {item.name}
                        </h5>
                        <span className="text-lg font-bold text-stone-900 num-en">${item.price}</span>
                      </div>
                      
                      <p className="text-xs text-stone-400 mb-5 line-clamp-2">
                        {isRTL ? "مستلزمات دراسية عالية الجودة تلبي احتياجات الطلاب اليومية." : "High-quality school supplies meeting daily student needs."}
                      </p>

                      <div className="mt-auto space-y-3">
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wide">
                          <span className="text-stone-300">{isRTL ? "المخزون" : "Stock"}</span>
                          <span className={item.stock <= 5 ? 'text-rose-500' : 'text-emerald-500'}><span className="num-en">{item.stock}</span> {isRTL ? "قطعة" : "Units"}</span>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => addToCart(item)} disabled={item.stock <= 0} className={`flex-1 ${btnPrimary.split(' ').filter(c => !c.includes('shadow')).join(' ')} h-11 disabled:opacity-50 disabled:cursor-not-allowed`}>
                            {isRTL ? "إضافة للسلة" : "Add to Cart"}
                          </button>
                          <button onClick={() => addToCart(item)} className={`${btnOutline} h-11 w-11 p-0`}>
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </section>

      {/* Cart Summary */}
      <AnimatePresence>
        {showCart && cart.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4"
          >
            <Card className="bg-primary text-white p-5 rounded-2xl shadow-2xl shadow-primary/40 border border-white/10 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                    <ShoppingCart size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-white/60 uppercase tracking-wide">{isRTL ? "سلة التسوق" : "Cart"}</p>
                    <p className="font-bold"><span className="num-en">{cartCount}</span> {isRTL ? "منتجات" : "Items"} · <span className="num-en">${cartTotal.toFixed(2)}</span></p>
                  </div>
                </div>
                <button onClick={() => setShowCart(false)} className={`${btnOutline} h-8 px-3 text-xs border-white/30 text-white hover:bg-white/10 hover:text-white`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  {t("common.close", language) || "إغلاق"}
                </button>
              </div>
              <div className="space-y-2.5 max-h-44 overflow-y-auto mb-4">
                {cart.map(c => (
                  <div key={c.item_id} className="flex items-center justify-between text-sm">
                    <span className="font-semibold truncate flex-1">{c.name}</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateCartQty(c.item_id, c.quantity - 1)} className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center text-xs hover:bg-white/20 num-en">-</button>
                      <span className="w-6 text-center font-bold num-en">{c.quantity}</span>
                      <button onClick={() => updateCartQty(c.item_id, c.quantity + 1)} className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center text-xs hover:bg-white/20 num-en">+</button>
                      <span className="w-16 text-right font-bold num-en">${(c.price * c.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={handleCheckout} className="w-full bg-white text-stone-900 hover:bg-stone-100 rounded-xl h-11 font-bold">
                {isRTL ? "إتمام الشراء" : "Checkout"} — <span className="num-en">${cartTotal.toFixed(2)}</span>
              </button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      <StoreItemFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} item={selectedItem} />
    </div>
  );
}
