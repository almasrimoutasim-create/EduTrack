import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";

const recordTypes = [
  { value: "salary", label: "Salary" },
  { value: "fine_payment", label: "Fine Payment" },
  { value: "bus_driver_payment", label: "Bus Driver Payment" },
  { value: "supervisor_payment", label: "Supervisor Payment" },
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" },
  { value: "refund", label: "Refund" },
];

const recipientTypes = [
  { value: "teacher", label: "Teacher" },
  { value: "bus_driver", label: "Bus Driver" },
  { value: "supervisor", label: "Supervisor" },
  { value: "student", label: "Student" },
  { value: "school", label: "School" },
];

const paymentMethods = [
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cash", label: "Cash" },
  { value: "check", label: "Check" },
  { value: "card", label: "Card" },
];

const statuses = [
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "cancelled", label: "Cancelled" },
];

export default function FinancialRecordFormDialog({ open, onClose, record }) {
  const isEdit = !!record;
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(record || {
    record_type: "salary", recipient_type: "teacher", recipient_id: "",
    recipient_name: "", amount: 0, description: "", month: "",
    payment_date: new Date().toISOString().split("T")[0],
    status: "pending", payment_method: "bank_transfer",
    reference_no: "", notes: ""
  });

  useEffect(() => {
    setForm(record || {
      record_type: "salary", recipient_type: "teacher", recipient_id: "",
      recipient_name: "", amount: 0, description: "", month: "",
      payment_date: new Date().toISOString().split("T")[0],
      status: "pending", payment_method: "bank_transfer",
      reference_no: "", notes: ""
    });
  }, [record]);

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!form.recipient_name || form.amount <= 0) return;
    setSaving(true);
    try {
      if (isEdit) {
        await base44.entities.FinancialRecord.update(record.id, form);
      } else {
        await base44.entities.FinancialRecord.create(form);
      }
      qc.invalidateQueries({ queryKey: ["finance-purchases"] });
      qc.invalidateQueries({ queryKey: ["financial-records"] });
      onClose();
    } catch (err) {
      console.error("Failed to save financial record:", err);
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Transaction" : "New Transaction"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Record Type *</Label>
              <Select value={form.record_type} onValueChange={v => update("record_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {recordTypes.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Recipient Type</Label>
              <Select value={form.recipient_type} onValueChange={v => update("recipient_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {recipientTypes.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Recipient Name *</Label>
              <Input value={form.recipient_name} onChange={e => update("recipient_name", e.target.value)} placeholder="e.g. Ahmed Hassan" />
            </div>
            <div>
              <Label>Recipient ID</Label>
              <Input value={form.recipient_id} onChange={e => update("recipient_id", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Amount ($) *</Label>
              <Input type="number" step="0.01" value={form.amount} onChange={e => update("amount", parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <Label>Month</Label>
              <Input type="month" value={form.month} onChange={e => update("month", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Payment Method</Label>
              <Select value={form.payment_method} onValueChange={v => update("payment_method", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {paymentMethods.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => update("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statuses.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Payment Date</Label>
              <Input type="date" value={form.payment_date} onChange={e => update("payment_date", e.target.value)} />
            </div>
            <div>
              <Label>Reference No.</Label>
              <Input value={form.reference_no} onChange={e => update("reference_no", e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={e => update("description", e.target.value)} rows={2} />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={e => update("notes", e.target.value)} rows={2} />
          </div>
          <button onClick={handleSave} disabled={saving || !form.recipient_name || form.amount <= 0} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed w-full h-11">
            {saving ? "Saving..." : isEdit ? "Update Transaction" : "Add Transaction"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
