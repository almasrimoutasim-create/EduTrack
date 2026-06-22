import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/dbClient";
import { useLanguage } from "@/lib/LanguageContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FileText, Plus, DollarSign, Calendar, MapPin, Briefcase, UserCircle2, ArrowUpRight, Search } from "lucide-react";
import { toast } from "sonner";

export default function StaffContracts() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const qc = useQueryClient();

  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    staff_id: "",
    job_title: "",
    contract_type: "full-time",
    salary: "",
    start_date: "",
    end_date: "",
    department: "",
  });

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ["staff-contracts"],
    queryFn: () => entities.StaffContract.list("-created_at")
  });

  const { data: staff = [] } = useQuery({
    queryKey: ["staff-members"],
    queryFn: () => entities.StaffMember.list()
  });

  const handleCreateContract = async (e) => {
    e.preventDefault();
    if (!formData.staff_id || !formData.job_title || !formData.salary) {
      toast.error(isRTL ? "الرجاء تعبئة الحقول الأساسية" : "Please fill required fields");
      return;
    }

    try {
      await entities.StaffContract.create({
        ...formData,
        salary: parseFloat(formData.salary),
        status: "active",
        created_at: new Date().toISOString()
      });
      toast.success(isRTL ? "تم إضافة العقد بنجاح" : "Contract added successfully");
      setIsAdding(false);
      setFormData({ staff_id: "", job_title: "", contract_type: "full-time", salary: "", start_date: "", end_date: "", department: "" });
      qc.invalidateQueries({ queryKey: ["staff-contracts"] });
    } catch (error) {
      toast.error(isRTL ? "حدث خطأ أثناء الإضافة" : "Error adding contract");
    }
  };

  const getStaffName = (staffId) => {
    const member = staff.find(s => s.id === staffId);
    return member ? (member.full_name || member.name) : staffId;
  };

  const filteredContracts = contracts.filter(c => {
    const name = getStaffName(c.staff_id).toLowerCase();
    const title = (c.job_title || "").toLowerCase();
    const search = searchTerm.toLowerCase();
    return name.includes(search) || title.includes(search);
  });

  const activeCount = contracts.filter(c => c.status === "active").length;
  const expiringCount = contracts.filter(c => {
    if (!c.end_date) return false;
    const end = new Date(c.end_date);
    const today = new Date();
    const diffTime = Math.abs(end.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return c.status === "active" && diffDays <= 30;
  }).length;

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
            {isRTL ? "عقود الموظفين" : "Staff Contracts"}
          </h1>
          <p className="text-stone-500 font-medium mt-1">
            {isRTL ? "إدارة العقود والرواتب والمسميات الوظيفية" : "Manage staff contracts, payroll, and job titles"}
          </p>
        </div>
        <Button 
          onClick={() => setIsAdding(true)}
          className="bg-stone-900 hover:bg-stone-800 text-white rounded-xl h-11 px-6 font-bold shadow-md flex items-center gap-2"
        >
          <Plus size={18} />
          {isRTL ? "إضافة عقد جديد" : "Add Contract"}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 rounded-[24px] border-none shadow-sm bg-gradient-to-br from-emerald-50 to-green-50">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-emerald-700/80 mb-2">{isRTL ? "العقود النشطة" : "Active Contracts"}</p>
              <h3 className="text-4xl font-black text-emerald-900 num-en">{activeCount}</h3>
            </div>
            <div className="p-3 bg-emerald-200/50 rounded-2xl">
              <Briefcase className="h-6 w-6 text-emerald-700" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6 rounded-[24px] border-none shadow-sm bg-gradient-to-br from-rose-50 to-red-50">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-rose-700/80 mb-2">{isRTL ? "عقود تنتهي قريباً (30 يوم)" : "Expiring Soon (30d)"}</p>
              <h3 className="text-4xl font-black text-rose-900 num-en">{expiringCount}</h3>
            </div>
            <div className="p-3 bg-rose-200/50 rounded-2xl">
              <Calendar className="h-6 w-6 text-rose-700" />
            </div>
          </div>
        </Card>

        <Card className="p-6 rounded-[24px] border-none shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-blue-700/80 mb-2">{isRTL ? "إجمالي رواتب العقود" : "Total Payroll (Contracts)"}</p>
              <div className="flex items-baseline gap-1 text-blue-900">
                <span className="text-2xl font-bold">$</span>
                <h3 className="text-4xl font-black num-en">
                  {contracts.filter(c => c.status === "active").reduce((sum, c) => sum + (parseFloat(c.salary) || 0), 0).toLocaleString()}
                </h3>
              </div>
            </div>
            <div className="p-3 bg-blue-200/50 rounded-2xl">
              <DollarSign className="h-6 w-6 text-blue-700" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main List */}
      <Card className="border border-stone-100 shadow-sm rounded-[32px] overflow-hidden bg-white">
        <div className="p-6 border-b border-stone-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="text-xl font-bold text-stone-800">
            {isRTL ? "دليل العقود" : "Contracts Directory"}
          </h2>
          <div className="relative w-full sm:w-72">
            <Search className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 text-stone-400`} size={16} />
            <Input 
              placeholder={isRTL ? "بحث بالاسم أو المسمى..." : "Search by name or title..."}
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
                <th className={`p-4 font-bold ${isRTL ? "text-right" : "text-left"}`}>{isRTL ? "الموظف" : "Employee"}</th>
                <th className={`p-4 font-bold ${isRTL ? "text-right" : "text-left"}`}>{isRTL ? "المسمى الوظيفي" : "Job Title"}</th>
                <th className={`p-4 font-bold ${isRTL ? "text-right" : "text-left"}`}>{isRTL ? "الراتب الأساسي" : "Basic Salary"}</th>
                <th className={`p-4 font-bold ${isRTL ? "text-right" : "text-left"}`}>{isRTL ? "تاريخ البداية والنهاية" : "Start & End Date"}</th>
                <th className={`p-4 font-bold ${isRTL ? "text-right" : "text-left"}`}>{isRTL ? "الحالة" : "Status"}</th>
                <th className={`p-4 font-bold text-center`}>{isRTL ? "إجراء" : "Action"}</th>
              </tr>
            </thead>
            <tbody>
              {filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-stone-400 font-medium">
                    {isRTL ? "لا توجد عقود تطابق البحث." : "No contracts match your search."}
                  </td>
                </tr>
              ) : (
                filteredContracts.map((contract) => (
                  <tr key={contract.id} className="border-b border-stone-50 hover:bg-stone-50/50 transition-colors">
                    <td className={`p-4 font-bold text-stone-800 flex items-center gap-3 ${isRTL ? "text-right" : "text-left"}`}>
                      <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center">
                        <UserCircle2 size={18} className="text-stone-400" />
                      </div>
                      {getStaffName(contract.staff_id)}
                    </td>
                    <td className={`p-4 ${isRTL ? "text-right" : "text-left"}`}>
                      <div className="flex flex-col">
                        <span className="font-semibold text-stone-800">{contract.job_title}</span>
                        <span className="text-xs text-stone-500">{contract.department || (isRTL ? "عام" : "General")}</span>
                      </div>
                    </td>
                    <td className={`p-4 font-black text-stone-900 num-en ${isRTL ? "text-right" : "text-left"}`}>
                      ${parseFloat(contract.salary || 0).toLocaleString()}
                    </td>
                    <td className={`p-4 ${isRTL ? "text-right" : "text-left"}`}>
                      <div className="flex flex-col text-xs font-medium text-stone-500 num-en">
                        <span>{contract.start_date || "-"} <span className="text-emerald-500">→</span></span>
                        <span>{contract.end_date || (isRTL ? "عقد مفتوح" : "Open-ended")}</span>
                      </div>
                    </td>
                    <td className={`p-4 ${isRTL ? "text-right" : "text-left"}`}>
                      {contract.status === "active" ? (
                        <Badge className="bg-emerald-100 text-emerald-800 border-none hover:bg-emerald-200">{isRTL ? "نشط" : "Active"}</Badge>
                      ) : (
                        <Badge className="bg-stone-100 text-stone-600 border-none hover:bg-stone-200">{isRTL ? "منتهي / غير نشط" : "Inactive"}</Badge>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <Button variant="ghost" size="icon" className="text-stone-400 hover:text-primary hover:bg-primary/10 rounded-xl">
                        <ArrowUpRight size={18} />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Contract Dialog */}
      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden rounded-[32px] border-none">
          <div className="p-8 bg-stone-50 border-b border-stone-100">
            <h3 className="text-2xl font-black text-stone-900 mb-1">
              {isRTL ? "إنشاء عقد موظف جديد" : "Create New Contract"}
            </h3>
            <p className="text-stone-500 font-medium">
              {isRTL ? "أدخل تفاصيل العقد، المسمى الوظيفي، والراتب." : "Enter contract details, job title, and salary."}
            </p>
          </div>
          <form onSubmit={handleCreateContract} className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-stone-700">{isRTL ? "الموظف" : "Employee"}</label>
                <Select value={formData.staff_id} onValueChange={(v) => setFormData({...formData, staff_id: v})}>
                  <SelectTrigger className="h-12 rounded-xl border-stone-200">
                    <SelectValue placeholder={isRTL ? "اختر الموظف" : "Select Staff"} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {staff.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.full_name || s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-stone-700">{isRTL ? "المسمى الوظيفي" : "Job Title"}</label>
                <Input 
                  required
                  value={formData.job_title}
                  onChange={(e) => setFormData({...formData, job_title: e.target.value})}
                  className="h-12 rounded-xl border-stone-200" 
                  placeholder={isRTL ? "مثال: مدرس أول" : "e.g. Senior Teacher"}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-stone-700">{isRTL ? "الراتب الأساسي ($)" : "Basic Salary ($)"}</label>
                <Input 
                  required
                  type="number"
                  value={formData.salary}
                  onChange={(e) => setFormData({...formData, salary: e.target.value})}
                  className="h-12 rounded-xl border-stone-200 num-en" 
                  placeholder="3000"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-stone-700">{isRTL ? "القسم" : "Department"}</label>
                <Input 
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  className="h-12 rounded-xl border-stone-200" 
                  placeholder={isRTL ? "مثال: قسم اللغات" : "e.g. Languages"}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-stone-700">{isRTL ? "تاريخ البداية" : "Start Date"}</label>
                <Input 
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  className="h-12 rounded-xl border-stone-200 num-en" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-stone-700">{isRTL ? "تاريخ النهاية" : "End Date"}</label>
                <Input 
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  className="h-12 rounded-xl border-stone-200 num-en" 
                />
              </div>
            </div>

            <div className="pt-6 border-t border-stone-100 flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsAdding(false)} className="h-12 px-6 rounded-xl font-bold">
                {isRTL ? "إلغاء" : "Cancel"}
              </Button>
              <Button type="submit" className="h-12 px-8 rounded-xl font-bold bg-stone-900 text-white hover:bg-stone-800">
                {isRTL ? "حفظ العقد" : "Save Contract"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
