import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/dbClient";
import { useLanguage } from "@/lib/LanguageContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ShoppingCart, UserCircle2, Wallet, Banknote, CreditCard, Trash2, CheckCircle2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";

export default function StorePOS() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const { user } = useAuth();
  const qc = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("wallet"); // wallet, cash, card

  const { data: storeItems = [], isLoading: loadingItems } = useQuery({
    queryKey: ["store-items"],
    queryFn: () => entities.StoreItem.list()
  });

  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ["students-list"],
    queryFn: () => entities.Student.list()
  });

  const { data: walletData } = useQuery({
    queryKey: ['student-wallet', selectedStudent?.id],
    queryFn: () => entities.StudentWallet.filter({ student_id: selectedStudent?.id }),
    enabled: !!selectedStudent?.id,
  });

  const studentBalance = walletData?.[0] ? parseFloat(walletData[0].balance) : 0;

  const filteredItems = storeItems.filter(item => 
    (item.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredStudents = studentSearch ? students.filter(s => 
    (s.full_name || s.name || "").toLowerCase().includes(studentSearch.toLowerCase()) ||
    (s.id || s.student_id || "").includes(studentSearch)
  ).slice(0, 5) : [];

  const addToCart = (item) => {
    if (item.stock <= 0) {
      toast.error(isRTL ? "المنتج نفد من المخزون" : "Item out of stock");
      return;
    }
    setCart(prev => {
      const existing = prev.find(c => c.item_id === item.id);
      if (existing) {
        if (existing.quantity >= item.stock) {
          toast.error(isRTL ? "الكمية المطلوبة تتجاوز المخزون" : "Quantity exceeds stock");
          return prev;
        }
        return prev.map(c => c.item_id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { item_id: item.id, name: item.name, price: item.price, quantity: 1, stock: item.stock }];
    });
  };

  const updateQuantity = (itemId, delta) => {
    setCart(prev => prev.map(c => {
      if (c.item_id === itemId) {
        const newQty = c.quantity + delta;
        if (newQty <= 0) return c; // Handled by remove
        if (newQty > c.stock) {
          toast.error(isRTL ? "الكمية المطلوبة تتجاوز المخزون" : "Quantity exceeds stock");
          return c;
        }
        return { ...c, quantity: newQty };
      }
      return c;
    }));
  };

  const removeFromCart = (itemId) => {
    setCart(prev => prev.filter(c => c.item_id !== itemId));
  };

  const cartTotal = cart.reduce((sum, c) => sum + (c.price * c.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (paymentMethod === "wallet" && !selectedStudent) {
      toast.error(isRTL ? "يجب اختيار الطالب للدفع من المحفظة" : "Must select student to pay with wallet");
      return;
    }
    if (paymentMethod === "wallet" && studentBalance < cartTotal) {
      toast.error(isRTL ? "الرصيد غير كافٍ" : "Insufficient balance");
      return;
    }

    try {
      // 1. Process Wallet Payment if applicable
      if (paymentMethod === "wallet" && selectedStudent) {
        await entities.WalletTransaction.create({
          student_id: selectedStudent.id,
          type: 'purchase',
          amount: cartTotal,
          balance_after: studentBalance - cartTotal,
          description: `مشتريات من الكاشير: ${cart.map(i => i.name).join(', ')}`,
          created_by: user?.id || "cashier",
        });
      }

      // 2. Process Store Items (deduct stock, create purchases)
      for (const c of cart) {
        const newStock = Math.max(0, c.stock - c.quantity);
        await entities.StoreItem.update(c.item_id, { stock: newStock });

        await entities.Purchase.create({
          student_id: selectedStudent ? selectedStudent.id : "walk-in",
          student_name: selectedStudent ? (selectedStudent.full_name || selectedStudent.name) : "Walk-in Customer",
          item_id: c.item_id,
          item_name: c.name,
          quantity: c.quantity,
          total_price: c.price * c.quantity,
          payment_method: paymentMethod
        });
      }

      // 3. Register Income
      await entities.FinancialRecord.create({
        record_type: "income",
        recipient_type: selectedStudent ? "student" : "walk-in",
        recipient_name: selectedStudent ? (selectedStudent.full_name || selectedStudent.name) : "Walk-in Customer",
        recipient_id: selectedStudent ? selectedStudent.id : "walk-in",
        amount: cartTotal,
        description: `فاتورة مبيعات POS: ${cart.map(i => `${i.name} (x${i.quantity})`).join(', ')}`,
        payment_date: new Date().toISOString().split('T')[0],
        status: "paid",
        payment_method: paymentMethod
      });

      toast.success(isRTL ? "تم إصدار الفاتورة بنجاح" : "Checkout completed successfully");
      setCart([]);
      setSelectedStudent(null);
      setStudentSearch("");
      qc.invalidateQueries({ queryKey: ["store-items"] });
      qc.invalidateQueries({ queryKey: ["store-purchases"] });
      qc.invalidateQueries({ queryKey: ["financial-records"] });
      if (selectedStudent) {
        qc.invalidateQueries({ queryKey: ['student-wallet', selectedStudent.id] });
      }

    } catch (error) {
      toast.error(isRTL ? "حدث خطأ أثناء المحاسبة" : "Error during checkout");
    }
  };

  if (loadingItems || loadingStudents) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col md:flex-row gap-6 p-6" dir={isRTL ? "rtl" : "ltr"}>
      
      {/* Products Grid Section */}
      <div className="flex-1 flex flex-col min-w-0 bg-stone-50/50 rounded-[32px] overflow-hidden border border-stone-100">
        <div className="p-6 bg-white border-b border-stone-100">
          <h1 className="text-2xl font-black text-stone-900 mb-4">{isRTL ? "نقطة البيع (الكاشير)" : "POS Cashier"}</h1>
          <div className="relative">
            <Search className={`absolute ${isRTL ? "right-4" : "left-4"} top-1/2 -translate-y-1/2 text-stone-400`} size={18} />
            <Input 
              placeholder={isRTL ? "ابحث عن المنتجات بالباركود أو الاسم..." : "Search products by barcode or name..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`h-12 bg-stone-50 border-stone-100 rounded-xl text-base ${isRTL ? "pr-12" : "pl-12"} shadow-inner`}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map(item => (
              <Card 
                key={item.id} 
                className={`p-4 rounded-[24px] border border-stone-100 shadow-sm cursor-pointer hover:shadow-md transition-all flex flex-col justify-between h-40 ${item.stock <= 0 ? "opacity-50 grayscale cursor-not-allowed" : "hover:-translate-y-1 bg-white"}`}
                onClick={() => item.stock > 0 && addToCart(item)}
              >
                <div>
                  <h3 className="font-bold text-stone-800 text-sm leading-tight line-clamp-2">{item.name}</h3>
                  <p className="text-xs text-stone-400 mt-1">{item.category}</p>
                </div>
                <div className="flex justify-between items-end mt-4">
                  <span className="font-black text-lg text-primary num-en">${item.price}</span>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md num-en ${item.stock <= 5 ? "bg-rose-100 text-rose-700" : "bg-stone-100 text-stone-600"}`}>
                    {item.stock} {isRTL ? "قطعة" : "Qty"}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Cart & Checkout Section */}
      <Card className="w-full md:w-[400px] flex flex-col h-full bg-white rounded-[32px] shadow-lg border-none overflow-hidden shrink-0">
        
        {/* Customer Selection */}
        <div className="p-6 border-b border-stone-100 bg-stone-50/50">
          <h3 className="text-sm font-bold text-stone-500 mb-3 uppercase tracking-wider">{isRTL ? "العميل / الطالب" : "Customer / Student"}</h3>
          
          {selectedStudent ? (
            <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-stone-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                  <UserCircle2 size={20} />
                </div>
                <div>
                  <p className="font-bold text-sm text-stone-900">{selectedStudent.full_name || selectedStudent.name}</p>
                  <p className="text-[10px] text-stone-500 font-bold tracking-widest num-en">ID: {selectedStudent.id}</p>
                </div>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="p-2 text-stone-400 hover:text-rose-500">
                ✕
              </button>
            </div>
          ) : (
            <div className="relative">
              <UserCircle2 className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 text-stone-400`} size={16} />
              <Input 
                placeholder={isRTL ? "ابحث عن طالب (أو بيع مباشر)" : "Search student (or walk-in)"}
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className={`h-11 bg-white border-stone-200 rounded-xl text-sm ${isRTL ? "pr-10" : "pl-10"}`}
              />
              {studentSearch && filteredStudents.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-stone-100 shadow-xl rounded-xl z-10 overflow-hidden">
                  {filteredStudents.map(s => (
                    <div 
                      key={s.id} 
                      className="p-3 hover:bg-stone-50 cursor-pointer border-b border-stone-50 last:border-0 flex justify-between items-center"
                      onClick={() => { setSelectedStudent(s); setStudentSearch(""); }}
                    >
                      <span className="font-bold text-sm">{s.full_name || s.name}</span>
                      <span className="text-xs text-stone-400 num-en">{s.id}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {selectedStudent && (
            <div className="mt-3 flex justify-between items-center px-2">
              <span className="text-xs font-bold text-stone-500">{isRTL ? "رصيد المحفظة:" : "Wallet Balance:"}</span>
              <span className="text-sm font-black text-emerald-600 num-en">${studentBalance.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-stone-400 space-y-4">
              <ShoppingCart size={48} className="opacity-20" />
              <p className="font-bold">{isRTL ? "السلة فارغة" : "Cart is empty"}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map(c => (
                <div key={c.item_id} className="flex justify-between items-center group">
                  <div className="flex-1">
                    <p className="font-bold text-stone-800 text-sm">{c.name}</p>
                    <p className="font-black text-primary text-sm num-en">${c.price}</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-stone-50 rounded-lg border border-stone-100">
                      <button onClick={() => updateQuantity(c.item_id, -1)} className="w-8 h-8 flex items-center justify-center text-stone-500 hover:text-stone-900 font-bold num-en">-</button>
                      <span className="w-6 text-center font-bold text-sm num-en">{c.quantity}</span>
                      <button onClick={() => updateQuantity(c.item_id, 1)} className="w-8 h-8 flex items-center justify-center text-stone-500 hover:text-stone-900 font-bold num-en">+</button>
                    </div>
                    <button onClick={() => removeFromCart(c.item_id)} className="text-stone-300 hover:text-rose-500 p-1">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Checkout Footer */}
        <div className="p-6 bg-stone-900 text-white mt-auto">
          <div className="flex justify-between items-center mb-6">
            <span className="text-stone-400 font-bold text-sm uppercase tracking-wider">{isRTL ? "الإجمالي" : "Total"}</span>
            <span className="text-3xl font-black text-white num-en">${cartTotal.toFixed(2)}</span>
          </div>

          <div className="space-y-3 mb-6">
            <p className="text-xs font-bold text-stone-500 uppercase tracking-widest">{isRTL ? "طريقة الدفع" : "Payment Method"}</p>
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => setPaymentMethod("wallet")}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-colors ${paymentMethod === "wallet" ? "bg-teal-500/20 border-teal-500/50 text-teal-300" : "bg-white/5 border-white/10 text-stone-400 hover:bg-white/10"}`}
              >
                <Wallet size={18} />
                <span className="text-[10px] font-bold">{isRTL ? "المحفظة" : "Wallet"}</span>
              </button>
              <button 
                onClick={() => setPaymentMethod("cash")}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-colors ${paymentMethod === "cash" ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" : "bg-white/5 border-white/10 text-stone-400 hover:bg-white/10"}`}
              >
                <Banknote size={18} />
                <span className="text-[10px] font-bold">{isRTL ? "نقدي" : "Cash"}</span>
              </button>
              <button 
                onClick={() => setPaymentMethod("card")}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-colors ${paymentMethod === "card" ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300" : "bg-white/5 border-white/10 text-stone-400 hover:bg-white/10"}`}
              >
                <CreditCard size={18} />
                <span className="text-[10px] font-bold">{isRTL ? "بطاقة" : "Card"}</span>
              </button>
            </div>
          </div>

          <Button 
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full h-14 rounded-xl bg-white text-stone-900 hover:bg-stone-100 font-black text-lg flex items-center justify-center gap-2"
          >
            {isRTL ? "إصدار الفاتورة" : "Issue Receipt"}
            <ArrowRight size={18} className={isRTL ? "rotate-180" : ""} />
          </Button>
        </div>

      </Card>
    </div>
  );
}
