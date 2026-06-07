import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  Plus, 
  ShoppingCart, 
  Package, 
  TrendingUp,
  AlertCircle,
  MoreVertical,
  Edit2,
  Trash2,
  CreditCard,
  Wallet,
  ArrowLeft
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/translations";
import PageHeader from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import StoreItemFormDialog from "@/components/shared/StoreItemFormDialog";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import StripePaymentForm from "@/components/portal/StripePaymentForm";

// @ts-ignore
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all border-2 border-stone-300 bg-white text-stone-800 hover:bg-stone-50 hover:border-stone-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const btnPrimary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed";

export default function Store() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const role = user?.role || localStorage.getItem("portal_role") || "student";

  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState("cart"); // "cart", "payment_method", "stripe"

  // Student specific logic
  const studentId = user?.id || localStorage.getItem("portal_user_id") || "S-505";
  const { data: studentProfile } = useQuery({
    queryKey: ["student-profile", studentId],
    enabled: role === "student",
    queryFn: () => base44.entities.Student.get(studentId)
  });

  // Parent specific logic
  const portalUserStr = localStorage.getItem("portal_user");
  const portalUser = portalUserStr ? JSON.parse(portalUserStr) : null;
  const parentEmail = portalUser?.email || user?.email || "abdo@gmail.com";

  const { data: children = [] } = useQuery({ 
    queryKey: ["parent-children", parentEmail], 
    enabled: role === "parent",
    queryFn: () => base44.entities.Student["filter"]({ parent_email: parentEmail }) 
  });

  const [selectedStudentId, setSelectedStudentId] = useState(null);

  React.useEffect(() => {
    if (children.length > 0 && !selectedStudentId) {
      setSelectedStudentId(children[0].id);
    }
  }, [children, selectedStudentId]);

  const activeStudent = role === "student" 
    ? studentProfile 
    : (role === "parent" ? children.find(c => c.id === selectedStudentId) : null);

  const { data: walletData } = useQuery({
    queryKey: ['student-wallet', activeStudent?.id],
    queryFn: () => base44.entities.StudentWallet.filter({ student_id: activeStudent?.id }),
    enabled: !!activeStudent?.id,
    staleTime: 1000 * 60 * 2,
  });
  const cardBalance = walletData?.[0] ? parseFloat(walletData[0].balance) : 0;
  const canManage = role === "admin" || role === "staff" || role === "store";

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
  const totalSales = purchases.reduce((sum, p) => sum + (parseFloat(p.total_price || p.total_amount || 0)), 0);

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

  const handleCheckout = async (chosenMethod = "wallet") => {
    if (cart.length === 0) return;

    if (!activeStudent && !canManage) {
      toast.error(isRTL ? "يرجى تسجيل الدخول للقيام بالشراء" : "Please login to purchase");
      return;
    }

    if (chosenMethod === "wallet" && activeStudent && cardBalance < cartTotal) {
      toast.error(
        isRTL 
          ? "رصيد بطاقتك الذكية غير كافٍ لإتمام عملية الشراء." 
          : "Insufficient smart card balance to complete checkout."
      );
      return;
    }

    try {
      // 1. If student/parent using wallet, deduct balance
      if (activeStudent && chosenMethod === "wallet") {
        await base44.entities.WalletTransaction.create({
          student_id: activeStudent.id,
          type: 'purchase',
          amount: cartTotal,
          balance_after: cardBalance - cartTotal,
          description: `مشتريات المتجر: ${cart.map(i => i.name).join(', ')}`,
          created_by: user?.id || activeStudent.id,
        });

        queryClient.invalidateQueries({ queryKey: ['student-fees-parent', activeStudent.id] });
        queryClient.invalidateQueries({ queryKey: ['student-wallet', activeStudent.id] });
        queryClient.invalidateQueries({ queryKey: ['wallet-transactions', activeStudent.id] });
        queryClient.invalidateQueries({ queryKey: ['fee-payments-parent', activeStudent.id] });
      }

      // 2. Process items (decrement stock, create purchases)
      for (const c of cart) {
        const storeItem = storeItems.find(item => item.id === c.item_id);
        if (storeItem) {
          const newStock = Math.max(0, (storeItem.stock || 0) - c.quantity);
          await base44.entities.StoreItem.update(c.item_id, { stock: newStock });
        }

        await base44.entities.Purchase.create({
          student_id: activeStudent ? (activeStudent.id || activeStudent.student_id) : "admin",
          student_name: activeStudent ? (activeStudent.full_name || activeStudent.name) : "Admin",
          item_id: c.item_id,
          item_name: c.name,
          quantity: c.quantity,
          total_price: c.price * c.quantity,
          payment_method: chosenMethod === "wallet" ? "card" : "credit_card"
        });
      }

      // 3. Create financial record (school income)
      await base44.entities.FinancialRecord.create({
        record_type: "income",
        recipient_type: activeStudent ? "student" : "school",
        recipient_name: activeStudent ? (activeStudent.full_name || activeStudent.name) : "School Store",
        recipient_id: activeStudent ? (activeStudent.id || activeStudent.student_id) : "store",
        amount: cartTotal,
        description: isRTL 
          ? `مشتريات المتجر: ${cart.map(i => `${i.name} (x${i.quantity})`).join(', ')}`
          : `Store Purchases: ${cart.map(i => `${i.name} (x${i.quantity})`).join(', ')}`,
        payment_date: new Date().toISOString().split('T')[0],
        status: "paid",
        payment_method: chosenMethod === "wallet" ? "card" : "credit_card"
      });

      // 4. Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["store-items"] });
      queryClient.invalidateQueries({ queryKey: ["store-purchases"] });
      if (activeStudent) {
        queryClient.invalidateQueries({ queryKey: ['student-fees-parent', activeStudent.id] });
        queryClient.invalidateQueries({ queryKey: ['student-wallet', activeStudent.id] });
        queryClient.invalidateQueries({ queryKey: ['wallet-transactions', activeStudent.id] });
        queryClient.invalidateQueries({ queryKey: ['fee-payments-parent', activeStudent.id] });
      }
      queryClient.invalidateQueries({ queryKey: ["financial-records"] });

      toast.success(isRTL ? "تم الشراء بنجاح!" : "Checkout successful!");
      setCart([]);
      setShowCart(false);
      setCheckoutStep("cart");
    } catch (err) {
      console.error(err);
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
          {canManage && (
            <button onClick={handleAdd} className={`${btnPrimary} h-11 px-5`}>
              <Plus size={18} />
              <span>{isRTL ? "إضافة منتج" : "Add Product"}</span>
            </button>
          )}
        </div>
      </PageHeader>

      {/* Smart Card Wallet Widget for Students and Parents */}
      {(role === "student" || role === "parent") && activeStudent && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* Visual Digital Smart Card */}
          <Card className="md:col-span-2 relative w-full overflow-hidden bg-gradient-to-br from-teal-900 via-stone-850 to-emerald-950 text-white rounded-[32px] shadow-2xl border-none p-8 flex flex-col justify-between aspect-[2.1/1] min-h-[220px]">
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/20 rounded-full blur-[80px]" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-teal-500/10 rounded-full blur-[80px]" />
            
            <div className="relative z-10 flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
                  <ShoppingBag size={20} className="text-teal-300" />
                </div>
                <div>
                  <h4 className="font-serif font-black tracking-tight text-base">Edu<span className="text-emerald-400">Wallet</span></h4>
                  <p className="text-[8px] font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "محفظة الطالب الرقمية" : "Digital Wallet"}</p>
                </div>
              </div>
              <Badge className="bg-white/10 backdrop-blur-md text-white border border-white/10 rounded-lg text-[8px] font-black px-2 py-1 tracking-wider">
                NFC SMART CARD
              </Badge>
            </div>

            <div className="relative z-10 my-4">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">{isRTL ? "الرصيد المتاح بالشريحة الذكية" : "NFC Chip Balance"}</p>
              <p className="text-4xl font-black text-emerald-400 num-en">${cardBalance.toFixed(2)}</p>
            </div>

            <div className="relative z-10 flex justify-between items-end">
              <div>
                <h5 className="text-sm font-bold">{activeStudent.full_name || activeStudent.name}</h5>
                <p className="text-stone-400 text-[9px] font-bold uppercase tracking-widest mt-1">ID: {activeStudent.id || activeStudent.student_id}</p>
              </div>
              <div className="h-12 w-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10">
                <ShoppingBag className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>

          {/* Selector & Shop Info card */}
          <Card className="p-8 border shadow-sm bg-white rounded-[32px] flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-lg text-stone-900">
                    {role === "student"
                      ? (isRTL 
                          ? `أهلاً بك يا ${activeStudent?.full_name || activeStudent?.name || localStorage.getItem("portal_user_name") || 'بطلنا'}` 
                          : `Welcome, ${activeStudent?.full_name || activeStudent?.name || localStorage.getItem("portal_user_name") || 'Hero'}`)
                      : (isRTL ? "من يتسوق الآن؟" : "Who is Shopping?")
                    }
                  </h4>
                  <p className="text-stone-400 text-xs">
                    {role === "student"
                      ? (isRTL 
                          ? "تتسوق الآن باسمك ويتم الخصم مباشرة من بطاقتك الذكية." 
                          : "You are currently shopping using your NFC Smart Card.")
                      : (isRTL ? "حدد الطالب المستفيد لإتمام الشراء باسمه." : "Select the shopping student to debit.")
                    }
                  </p>
                </div>
              </div>

              {role === "parent" && children.length > 0 && (
                <div className="space-y-1.5 mt-2">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">{isRTL ? "الابن النشط:" : "Active Child:"}</label>
                  <select
                    value={selectedStudentId || ""}
                    onChange={e => setSelectedStudentId(e.target.value)}
                    className="w-full h-11 px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/20 cursor-pointer"
                  >
                    {children.map(c => (
                      <option key={c.id} value={c.id}>{c.full_name || c.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {role === "student" && (
                <div className="p-4 bg-teal-50/50 border border-teal-100 rounded-2xl">
                  <p className="text-xs font-semibold text-teal-800 leading-relaxed">
                    {isRTL 
                      ? "أهلاً بك! يتم خصم قيمة المشتريات تلقائياً من رصيد بطاقتك الذكية عند الشراء."
                      : "Welcome! Purchases are automatically debited from your NFC Smart Card balance."}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-stone-100 mt-4 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-stone-400">
              <span>{isRTL ? "حالة البطاقة" : "Card Status"}</span>
              <span className="text-emerald-500 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                {isRTL ? "نشطة وجاهزة" : "Active & Ready"}
              </span>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Admin stats */}
      {canManage && (
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
      )}

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
                    <div className="h-48 bg-stone-50 relative overflow-hidden">
                      {item.image_url ? (
                        <img 
                          src={item.image_url} 
                          alt={item.name} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-stone-200">
                          <Package size={56} className="opacity-20" />
                        </div>
                      )}
                      <div className={`absolute top-5 ${isRTL ? 'left-5' : 'right-5'} flex items-center gap-1.5 z-10`}>
                        <Badge className="bg-white/90 backdrop-blur-md text-stone-900 border-none rounded-lg font-bold text-[10px] px-2.5 py-1 shadow-md">
                          {item.category || (isRTL ? "منتج" : "Product")}
                        </Badge>
                        {canManage && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="bg-white/90 hover:bg-white backdrop-blur-md text-stone-800 h-7 w-7 rounded-lg flex items-center justify-center shadow-md cursor-pointer transition-colors">
                                <MoreVertical size={13} />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align={isRTL ? "start" : "end"} className="w-32">
                              <DropdownMenuItem onClick={() => { setSelectedItem(item); setDialogOpen(true); }} className="flex items-center gap-2 cursor-pointer text-stone-700">
                                <Edit2 size={12} />
                                <span className="text-xs">{isRTL ? "تعديل" : "Edit"}</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => {
                                  if (confirm(isRTL ? "هل أنت متأكد من حذف هذا المنتج؟" : "Are you sure you want to delete this product?")) {
                                    handleDelete(item);
                                  }
                                }} 
                                className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                              >
                                <Trash2 size={12} />
                                <span className="text-xs">{isRTL ? "حذف" : "Delete"}</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
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
                        {item.description || (isRTL ? "مستلزمات دراسية عالية الجودة تلبي احتياجات الطلاب اليومية." : "High-quality school supplies meeting daily student needs.")}
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
            <Card className="bg-primary text-white p-5 rounded-2xl shadow-2xl shadow-primary/40 border border-white/10 backdrop-blur-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                    <ShoppingCart size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-white/60 uppercase tracking-wide">{isRTL ? "سلة التسوق" : "Cart"}</p>
                    <p className="font-bold"><span className="num-en">{cartCount}</span> {isRTL ? "منتجات" : "Items"} · <span className="num-en">${cartTotal.toFixed(2)}</span></p>
                  </div>
                </div>
                <button 
                  onClick={() => { setShowCart(false); setCheckoutStep("cart"); }} 
                  className={`${btnOutline} h-8 px-3 text-xs border-white/30 text-white hover:bg-white/10 hover:text-white`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  {t("common.close", language) || "إغلاق"}
                </button>
              </div>

              {checkoutStep === "cart" && (
                <div className="space-y-4">
                  <div className="space-y-2.5 max-h-44 overflow-y-auto pr-1">
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
                  <button 
                    onClick={() => role === "parent" ? setCheckoutStep("payment_method") : handleCheckout("wallet")} 
                    className="w-full bg-white text-stone-900 hover:bg-stone-100 rounded-xl h-11 font-bold transition-all transform hover:scale-[1.01]"
                  >
                    {isRTL ? "إتمام الشراء" : "Checkout"} — <span className="num-en">${cartTotal.toFixed(2)}</span>
                  </button>
                </div>
              )}

              {checkoutStep === "payment_method" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <button onClick={() => setCheckoutStep("cart")} className="p-1 hover:bg-white/10 rounded-lg text-white">
                      <ArrowLeft size={16} className={isRTL ? "rotate-180" : ""} />
                    </button>
                    <h5 className="font-bold text-sm">{isRTL ? "اختر طريقة الدفع" : "Select Payment Method"}</h5>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {/* Wallet Option */}
                    <button 
                      onClick={() => handleCheckout("wallet")}
                      className="flex items-center justify-between p-4 rounded-xl border border-white/20 hover:border-white/50 bg-white/5 hover:bg-white/10 transition-all text-right w-full cursor-pointer"
                    >
                      <div className="flex items-center gap-3 text-start">
                        <div className="h-9 w-9 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center">
                          <Wallet size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-sm">{isRTL ? "بطاقة الطالب الذكية (EduWallet)" : "Smart Card (EduWallet)"}</p>
                          <p className="text-[10px] text-white/60">{isRTL ? `رصيد الابن: $${cardBalance.toFixed(2)}` : `Child's Balance: $${cardBalance.toFixed(2)}`}</p>
                        </div>
                      </div>
                      <span className="text-xs font-black text-emerald-400 num-en">${cartTotal.toFixed(2)}</span>
                    </button>

                    {/* Credit Card (Stripe) Option */}
                    <button 
                      onClick={() => setCheckoutStep("stripe")}
                      className="flex items-center justify-between p-4 rounded-xl border border-white/20 hover:border-white/50 bg-white/5 hover:bg-white/10 transition-all text-right w-full cursor-pointer"
                    >
                      <div className="flex items-center gap-3 text-start">
                        <div className="h-9 w-9 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
                          <CreditCard size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-sm">{isRTL ? "بطاقة بنكية آمنة (Stripe)" : "Secure Credit Card (Stripe)"}</p>
                          <p className="text-[10px] text-white/60">{isRTL ? "ادفع مباشرة بالبطاقة الائتمانية" : "Pay securely via credit card"}</p>
                        </div>
                      </div>
                      <span className="text-xs font-black text-teal-300 num-en">${cartTotal.toFixed(2)}</span>
                    </button>
                  </div>
                </div>
              )}

              {checkoutStep === "stripe" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <button onClick={() => setCheckoutStep("payment_method")} className="p-1 hover:bg-white/10 rounded-lg text-white">
                      <ArrowLeft size={16} className={isRTL ? "rotate-180" : ""} />
                    </button>
                    <h5 className="font-bold text-sm">{isRTL ? "الدفع ببطاقة الائتمان" : "Pay with Credit Card"}</h5>
                  </div>

                  <div className="bg-white text-stone-900 p-4 rounded-xl">
                    <Elements stripe={stripePromise}>
                      <StripePaymentForm 
                        amount={cartTotal}
                        onSuccess={() => handleCheckout("credit_card")}
                        onCancel={() => setCheckoutStep("payment_method")}
                        language={language}
                      />
                    </Elements>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      <StoreItemFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} item={selectedItem} />
    </div>
  );
}
