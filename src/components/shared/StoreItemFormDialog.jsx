import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { entities } from "@/api/dbClient";
import { useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/lib/LanguageContext";

export default function StoreItemFormDialog({ open, onClose, item }) {
  const isEdit = !!item;
  const qc = useQueryClient();
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(item || {
    name: "", category: "food", price: 0, stock: 0,
    image_url: "", available: true, description: "", low_stock_threshold: 5
  });

  useEffect(() => {
    setForm(item || {
      name: "", category: "food", price: 0, stock: 0,
      image_url: "", available: true, description: "", low_stock_threshold: 5
    });
  }, [item]);

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!form.name || form.price <= 0) return;
    setSaving(true);
    try {
      if (isEdit) {
        await entities.StoreItem.update(item.id, form);
      } else {
        await entities.StoreItem.create(form);
      }
      qc.invalidateQueries({ queryKey: ["store-items"] });
      onClose();
    } catch (err) {
      console.error("Failed to save item:", err);
    }
    setSaving(false);
  };

  const categories = [
    { value: "food", label: isRTL ? "أغذية" : "Food" },
    { value: "drinks", label: isRTL ? "مشروبات" : "Drinks" },
    { value: "supplies", label: isRTL ? "مستلزمات مدرسية" : "Supplies" },
    { value: "uniform", label: isRTL ? "زي مدرسي" : "Uniform" },
    { value: "other", label: isRTL ? "أخرى" : "Other" },
  ];

  const t = {
    titleAdd: isRTL ? "إضافة منتج جديد" : "Add Product",
    titleEdit: isRTL ? "تعديل بيانات المنتج" : "Edit Product",
    productName: isRTL ? "اسم المنتج *" : "Product Name *",
    category: isRTL ? "الفئة" : "Category",
    price: isRTL ? "السعر ($) *" : "Price ($) *",
    stock: isRTL ? "كمية المخزون" : "Stock",
    threshold: isRTL ? "حد تنبيه انخفاض المخزون" : "Low Stock Alert Threshold",
    imageUrl: isRTL ? "رابط صورة المنتج" : "Image URL",
    description: isRTL ? "وصف المنتج" : "Description",
    available: isRTL ? "متاح للشراء" : "Available for Purchase",
    saving: isRTL ? "جاري الحفظ..." : "Saving...",
    save: isRTL ? "إضافة منتج" : "Add Product",
    update: isRTL ? "تحديث المنتج" : "Update Product"
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir={isRTL ? "rtl" : "ltr"}>
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-stone-900 font-bold">
            {isEdit ? t.titleEdit : t.titleAdd}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label className="text-stone-700 font-medium">{t.productName}</Label>
            <Input 
              value={form.name} 
              onChange={e => update("name", e.target.value)} 
              placeholder={isRTL ? "مثال: الزي المدرسي" : "e.g. School Uniform"} 
              className="mt-1 rounded-lg border-stone-200"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-stone-700 font-medium">{t.category}</Label>
              <Select value={form.category} onValueChange={v => update("category", v)}>
                <SelectTrigger className="mt-1 rounded-lg border-stone-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-stone-700 font-medium">{t.price}</Label>
              <Input 
                type="number" 
                step="0.01" 
                value={form.price} 
                onChange={e => update("price", parseFloat(e.target.value) || 0)} 
                className="mt-1 rounded-lg border-stone-200 num-en"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-stone-700 font-medium">{t.stock}</Label>
              <Input 
                type="number" 
                value={form.stock} 
                onChange={e => update("stock", parseInt(e.target.value) || 0)} 
                className="mt-1 rounded-lg border-stone-200 num-en"
              />
            </div>
            <div>
              <Label className="text-stone-700 font-medium">{t.threshold}</Label>
              <Input 
                type="number" 
                value={form.low_stock_threshold} 
                onChange={e => update("low_stock_threshold", parseInt(e.target.value) || 5)} 
                className="mt-1 rounded-lg border-stone-200 num-en"
              />
            </div>
          </div>
          <div>
            <Label className="text-stone-700 font-medium">{t.imageUrl}</Label>
            <Input 
              value={form.image_url || ""} 
              onChange={e => update("image_url", e.target.value)} 
              placeholder="https://..." 
              className="mt-1 rounded-lg border-stone-200 num-en"
            />
          </div>
          <div>
            <Label className="text-stone-700 font-medium">{t.description}</Label>
            <Textarea 
              value={form.description || ""} 
              onChange={e => update("description", e.target.value)} 
              rows={2} 
              className="mt-1 rounded-lg border-stone-200"
              placeholder={isRTL ? "أية ملاحظات أو تفاصيل عن المنتج..." : "Any notes or product specifications..."}
            />
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-stone-50 border border-stone-100">
            <Switch checked={form.available} onCheckedChange={v => update("available", v)} />
            <Label className="text-stone-700 font-medium">{t.available}</Label>
          </div>
          <button 
            onClick={handleSave} 
            disabled={saving || !form.name || form.price <= 0} 
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed w-full h-11"
          >
            {saving ? t.saving : isEdit ? t.update : t.save}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
