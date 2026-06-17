import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/dbClient";
import { useLanguage } from "@/lib/LanguageContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, AlertTriangle, Package, Edit2, CheckCircle2, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function StoreInventory() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const qc = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editStock, setEditStock] = useState("");

  const { data: storeItems = [], isLoading } = useQuery({
    queryKey: ["store-items"],
    queryFn: () => entities.StoreItem.list()
  });

  const handleUpdateStock = async (id) => {
    try {
      await entities.StoreItem.update(id, { 
        stock: parseInt(editStock),
        updated_at: new Date().toISOString()
      });
      toast.success(isRTL ? "تم تحديث المخزون بنجاح" : "Stock updated successfully");
      setEditingId(null);
      qc.invalidateQueries({ queryKey: ["store-items"] });
    } catch (error) {
      toast.error(isRTL ? "فشل التحديث" : "Failed to update");
    }
  };

  const filteredItems = storeItems.filter(item => 
    (item.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.category || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockItems = storeItems.filter(i => (i.stock || 0) <= 5);
  const outOfStockItems = storeItems.filter(i => (i.stock || 0) === 0);

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
            {isRTL ? "إدارة المخزون" : "Inventory Control"}
          </h1>
          <p className="text-stone-500 font-medium mt-1">
            {isRTL ? "تتبع كميات المنتجات وتحديث المخزون وتنبيهات النواقص" : "Track product quantities, update stock, and shortage alerts"}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 rounded-[24px] border-none shadow-sm bg-gradient-to-br from-indigo-50 to-blue-50">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-indigo-700/80 mb-2">{isRTL ? "إجمالي المنتجات" : "Total Products"}</p>
              <h3 className="text-4xl font-black text-indigo-900 num-en">{storeItems.length}</h3>
            </div>
            <div className="p-3 bg-indigo-200/50 rounded-2xl">
              <Package className="h-6 w-6 text-indigo-700" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6 rounded-[24px] border-none shadow-sm bg-gradient-to-br from-amber-50 to-orange-50">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-amber-700/80 mb-2">{isRTL ? "عناصر على وشك النفاذ" : "Low Stock Items"}</p>
              <h3 className="text-4xl font-black text-amber-900 num-en">{lowStockItems.length}</h3>
            </div>
            <div className="p-3 bg-amber-200/50 rounded-2xl">
              <TrendingDown className="h-6 w-6 text-amber-700" />
            </div>
          </div>
        </Card>

        <Card className="p-6 rounded-[24px] border-none shadow-sm bg-gradient-to-br from-rose-50 to-red-50">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-rose-700/80 mb-2">{isRTL ? "نفدت من المخزون" : "Out of Stock"}</p>
              <h3 className="text-4xl font-black text-rose-900 num-en">{outOfStockItems.length}</h3>
            </div>
            <div className="p-3 bg-rose-200/50 rounded-2xl">
              <AlertTriangle className="h-6 w-6 text-rose-700" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main List */}
      <Card className="border border-stone-100 shadow-sm rounded-[32px] overflow-hidden bg-white">
        <div className="p-6 border-b border-stone-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="text-xl font-bold text-stone-800">
            {isRTL ? "سجل المخزون" : "Inventory Log"}
          </h2>
          <div className="relative w-full sm:w-72">
            <Search className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 text-stone-400`} size={16} />
            <Input 
              placeholder={isRTL ? "بحث باسم المنتج أو التصنيف..." : "Search by product name or category..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`h-10 bg-stone-50 border-stone-100 rounded-xl text-sm ${isRTL ? "pr-10" : "pl-10"}`}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-stone-50/50 text-stone-500 font-semibold border-b border-stone-100">
              <tr>
                <th className={`p-4 font-bold ${isRTL ? "text-right" : "text-left"}`}>{isRTL ? "المنتج" : "Product"}</th>
                <th className={`p-4 font-bold ${isRTL ? "text-right" : "text-left"}`}>{isRTL ? "التصنيف" : "Category"}</th>
                <th className={`p-4 font-bold ${isRTL ? "text-right" : "text-left"}`}>{isRTL ? "السعر" : "Price"}</th>
                <th className={`p-4 font-bold ${isRTL ? "text-right" : "text-left"}`}>{isRTL ? "المخزون الحالي" : "Current Stock"}</th>
                <th className={`p-4 font-bold ${isRTL ? "text-right" : "text-left"}`}>{isRTL ? "الحالة" : "Status"}</th>
                <th className={`p-4 font-bold text-center`}>{isRTL ? "تحديث سريع" : "Quick Update"}</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-stone-400 font-medium">
                    {isRTL ? "لا توجد منتجات تطابق البحث." : "No products match your search."}
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="border-b border-stone-50 hover:bg-stone-50/50 transition-colors">
                    <td className={`p-4 font-bold text-stone-800 ${isRTL ? "text-right" : "text-left"}`}>
                      {item.name}
                    </td>
                    <td className={`p-4 text-stone-500 font-medium ${isRTL ? "text-right" : "text-left"}`}>
                      {item.category || "-"}
                    </td>
                    <td className={`p-4 font-black text-stone-900 num-en ${isRTL ? "text-right" : "text-left"}`}>
                      ${item.price}
                    </td>
                    <td className={`p-4 ${isRTL ? "text-right" : "text-left"}`}>
                      {editingId === item.id ? (
                        <div className="flex items-center gap-2 max-w-[120px]">
                          <Input 
                            type="number"
                            min="0"
                            value={editStock}
                            onChange={(e) => setEditStock(e.target.value)}
                            className="h-8 rounded-lg border-stone-200 num-en text-center"
                          />
                        </div>
                      ) : (
                        <span className="font-black text-lg num-en">{item.stock || 0}</span>
                      )}
                    </td>
                    <td className={`p-4 ${isRTL ? "text-right" : "text-left"}`}>
                      {(item.stock || 0) === 0 ? (
                        <Badge className="bg-rose-100 text-rose-800 border-none px-3">{isRTL ? "نفد" : "Out of Stock"}</Badge>
                      ) : (item.stock || 0) <= 5 ? (
                        <Badge className="bg-amber-100 text-amber-800 border-none px-3">{isRTL ? "كمية قليلة" : "Low Stock"}</Badge>
                      ) : (
                        <Badge className="bg-emerald-100 text-emerald-800 border-none px-3">{isRTL ? "متوفر" : "In Stock"}</Badge>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {editingId === item.id ? (
                        <div className="flex items-center justify-center gap-2">
                          <Button size="icon" variant="ghost" onClick={() => handleUpdateStock(item.id)} className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg">
                            <CheckCircle2 size={16} />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => setEditingId(null)} className="h-8 w-8 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg">
                            ✕
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => {
                            setEditingId(item.id);
                            setEditStock(item.stock || 0);
                          }} 
                          className="h-8 px-3 text-stone-500 hover:text-primary hover:bg-primary/10 rounded-lg font-bold text-xs"
                        >
                          <Edit2 size={14} className="mr-1" />
                          {isRTL ? "تعديل الكمية" : "Edit Qty"}
                        </Button>
                      )}
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
