import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/dbClient";
import { useLanguage } from "@/lib/LanguageContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Layers, Plus, Search, Tag, Package, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function StoreCategories() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const qc = useQueryClient();

  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    slug: ""
  });

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["store-categories"],
    queryFn: () => entities.StoreCategory.list("-created_at")
  });

  const { data: storeItems = [] } = useQuery({
    queryKey: ["store-items"],
    queryFn: () => entities.StoreItem.list()
  });

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error(isRTL ? "اسم التصنيف مطلوب" : "Category name is required");
      return;
    }

    try {
      await entities.StoreCategory.create({
        ...formData,
        slug: formData.slug || formData.name.toLowerCase().replace(/\\s+/g, '-'),
        created_at: new Date().toISOString()
      });
      toast.success(isRTL ? "تم إضافة التصنيف بنجاح" : "Category added successfully");
      setIsAdding(false);
      setFormData({ name: "", description: "", slug: "" });
      qc.invalidateQueries({ queryKey: ["store-categories"] });
    } catch (error) {
      toast.error(isRTL ? "فشل إضافة التصنيف" : "Failed to add category");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(isRTL ? "هل أنت متأكد من حذف هذا التصنيف؟" : "Are you sure you want to delete this category?")) {
      try {
        await entities.StoreCategory.delete(id);
        toast.success(isRTL ? "تم حذف التصنيف" : "Category deleted");
        qc.invalidateQueries({ queryKey: ["store-categories"] });
      } catch (error) {
        toast.error(isRTL ? "فشل الحذف" : "Failed to delete");
      }
    }
  };

  const filteredCategories = categories.filter(c => 
    (c.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.description || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryItemsCount = (catName) => {
    return storeItems.filter(item => (item.category || "").toLowerCase() === (catName || "").toLowerCase()).length;
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
            {isRTL ? "تصنيفات المتجر" : "Store Categories"}
          </h1>
          <p className="text-stone-500 font-medium mt-1">
            {isRTL ? "إدارة مجموعات المنتجات لتسهيل التصفح والبحث" : "Manage product groups for easier browsing"}
          </p>
        </div>
        <Button 
          onClick={() => setIsAdding(true)}
          className="bg-stone-900 hover:bg-stone-800 text-white rounded-xl h-11 px-6 font-bold shadow-md flex items-center gap-2"
        >
          <Plus size={18} />
          {isRTL ? "إضافة تصنيف جديد" : "Add Category"}
        </Button>
      </div>

      <div className="relative w-full sm:w-96">
        <Search className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 text-stone-400`} size={16} />
        <Input 
          placeholder={isRTL ? "ابحث عن تصنيف..." : "Search categories..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`h-11 bg-white border-stone-200 rounded-xl text-sm shadow-sm ${isRTL ? "pr-10" : "pl-10"}`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCategories.map(cat => (
          <Card key={cat.id} className="p-6 rounded-[24px] border border-stone-100 shadow-sm bg-white hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-2 h-full bg-stone-200 group-hover:bg-primary transition-colors" />
            <div className="flex justify-between items-start mb-6">
              <div className="flex gap-3 items-center">
                <div className="p-3 bg-stone-50 rounded-xl text-stone-600">
                  <Tag size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-stone-900">{cat.name}</h3>
                  <p className="text-stone-400 text-xs mt-0.5">{cat.slug || cat.name.toLowerCase()}</p>
                </div>
              </div>
              <button 
                onClick={() => handleDelete(cat.id)}
                className="text-stone-400 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <p className="text-stone-500 text-sm mb-6 h-10 line-clamp-2">
              {cat.description || (isRTL ? "لا يوجد وصف لهذا التصنيف." : "No description provided.")}
            </p>

            <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-stone-500 font-bold">
                <Package size={16} />
                <span><span className="text-stone-900 num-en">{getCategoryItemsCount(cat.name)}</span> {isRTL ? "منتجات" : "Products"}</span>
              </div>
            </div>
          </Card>
        ))}

        {filteredCategories.length === 0 && (
          <div className="col-span-full p-12 text-center border-2 border-dashed border-stone-200 rounded-[32px]">
            <Layers className="mx-auto h-12 w-12 text-stone-300 mb-4" />
            <p className="text-stone-500 font-bold text-lg">
              {isRTL ? "لا توجد تصنيفات مطابقة." : "No matching categories found."}
            </p>
          </div>
        )}
      </div>

      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-[32px] border-none">
          <div className="p-8 bg-stone-50 border-b border-stone-100">
            <h3 className="text-2xl font-black text-stone-900 mb-1">
              {isRTL ? "إضافة تصنيف" : "Add Category"}
            </h3>
          </div>
          <form onSubmit={handleCreateCategory} className="p-8 space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-bold text-stone-700">{isRTL ? "اسم التصنيف" : "Category Name"}</label>
              <Input 
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="h-12 rounded-xl border-stone-200" 
                placeholder={isRTL ? "مثال: الزي المدرسي" : "e.g. School Uniform"}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-stone-700">{isRTL ? "الاسم البرمجي (Slug)" : "Slug (Optional)"}</label>
              <Input 
                value={formData.slug}
                onChange={(e) => setFormData({...formData, slug: e.target.value})}
                className="h-12 rounded-xl border-stone-200" 
                placeholder="school-uniform"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-stone-700">{isRTL ? "الوصف" : "Description"}</label>
              <Input 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="h-12 rounded-xl border-stone-200" 
              />
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsAdding(false)} className="h-11 px-6 rounded-xl font-bold">
                {isRTL ? "إلغاء" : "Cancel"}
              </Button>
              <Button type="submit" className="h-11 px-8 rounded-xl font-bold bg-stone-900 text-white hover:bg-stone-800">
                {isRTL ? "حفظ التصنيف" : "Save Category"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
