import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";

const categories = [
  { value: "food", label: "Food" },
  { value: "drinks", label: "Drinks" },
  { value: "supplies", label: "Supplies" },
  { value: "uniform", label: "Uniform" },
  { value: "other", label: "Other" },
];

export default function StoreItemFormDialog({ open, onClose, item }) {
  const isEdit = !!item;
  const qc = useQueryClient();
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
        await base44.entities.StoreItem.update(item.id, form);
      } else {
        await base44.entities.StoreItem.create(form);
      }
      qc.invalidateQueries({ queryKey: ["store-items"] });
      onClose();
    } catch (err) {
      console.error("Failed to save item:", err);
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Product" : "Add Product"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label>Product Name *</Label>
            <Input value={form.name} onChange={e => update("name", e.target.value)} placeholder="e.g. School Uniform" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={v => update("category", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Price ($) *</Label>
              <Input type="number" step="0.01" value={form.price} onChange={e => update("price", parseFloat(e.target.value) || 0)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Stock</Label>
              <Input type="number" value={form.stock} onChange={e => update("stock", parseInt(e.target.value) || 0)} />
            </div>
            <div>
              <Label>Low Stock Alert Threshold</Label>
              <Input type="number" value={form.low_stock_threshold} onChange={e => update("low_stock_threshold", parseInt(e.target.value) || 5)} />
            </div>
          </div>
          <div>
            <Label>Image URL</Label>
            <Input value={form.image_url} onChange={e => update("image_url", e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={e => update("description", e.target.value)} rows={2} />
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
            <Switch checked={form.available} onCheckedChange={v => update("available", v)} />
            <Label>Available for Purchase</Label>
          </div>
          <button onClick={handleSave} disabled={saving || !form.name || form.price <= 0} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed w-full h-11">
            {saving ? "Saving..." : isEdit ? "Update Product" : "Add Product"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
