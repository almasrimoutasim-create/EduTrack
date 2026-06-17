import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/dbClient";
import { useLanguage } from "@/lib/LanguageContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Layers, Users, MapPin, Plus, Edit2, Search } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Departments() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const qc = useQueryClient();

  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    manager_id: "",
    location: "",
    description: ""
  });

  const { data: departments = [], isLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: () => entities.Department.list("-created_at")
  });

  const { data: staff = [] } = useQuery({
    queryKey: ["staff-members"],
    queryFn: () => entities.StaffMember.list()
  });

  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error(isRTL ? "اسم القسم مطلوب" : "Department name is required");
      return;
    }

    try {
      await entities.Department.create({
        ...formData,
        created_at: new Date().toISOString()
      });
      toast.success(isRTL ? "تم إنشاء القسم بنجاح" : "Department created successfully");
      setIsAdding(false);
      setFormData({ name: "", manager_id: "", location: "", description: "" });
      qc.invalidateQueries({ queryKey: ["departments"] });
    } catch (error) {
      toast.error(isRTL ? "فشل إنشاء القسم" : "Failed to create department");
    }
  };

  const getStaffName = (staffId) => {
    if (!staffId) return isRTL ? "غير محدد" : "Unassigned";
    const member = staff.find(s => s.id === staffId);
    return member ? (member.full_name || member.name) : staffId;
  };

  const getDepartmentHeadcount = (deptName) => {
    // Basic heuristic: check how many staff members have this department string in their role/description
    // In a real app, staff would have a strict department_id foreign key.
    return staff.filter(s => {
      const role = (s.role || "").toLowerCase();
      const name = (deptName || "").toLowerCase();
      return role.includes(name);
    }).length;
  };

  const filteredDepartments = departments.filter(d => 
    (d.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.description || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            {isRTL ? "الأقسام الوظيفية" : "Departments"}
          </h1>
          <p className="text-stone-500 font-medium mt-1">
            {isRTL ? "إدارة أقسام العمل، الهيكل التنظيمي، ومدراء الأقسام" : "Manage organizational departments and managers"}
          </p>
        </div>
        <Button 
          onClick={() => setIsAdding(true)}
          className="bg-stone-900 hover:bg-stone-800 text-white rounded-xl h-11 px-6 font-bold shadow-md flex items-center gap-2"
        >
          <Plus size={18} />
          {isRTL ? "إضافة قسم جديد" : "Add Department"}
        </Button>
      </div>

      <div className="relative w-full sm:w-96">
        <Search className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 text-stone-400`} size={16} />
        <Input 
          placeholder={isRTL ? "ابحث عن قسم..." : "Search departments..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`h-11 bg-white border-stone-200 rounded-xl text-sm shadow-sm ${isRTL ? "pr-10" : "pl-10"}`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDepartments.map(dept => (
          <Card key={dept.id} className="p-6 rounded-[24px] border border-stone-100 shadow-sm bg-white hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-2 h-full bg-stone-200 group-hover:bg-primary transition-colors" />
            <div className="flex justify-between items-start mb-6">
              <div className="flex gap-3 items-center">
                <div className="p-3 bg-stone-50 rounded-xl text-stone-600">
                  <Layers size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-stone-900">{dept.name}</h3>
                  <p className="text-stone-400 text-xs mt-0.5">{dept.description || (isRTL ? "بدون وصف" : "No description")}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-stone-500 font-medium">
                  <Users size={16} />
                  <span>{isRTL ? "المدير / المسؤول:" : "Manager:"}</span>
                </div>
                <span className="font-bold text-stone-800">{getStaffName(dept.manager_id)}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-stone-500 font-medium">
                  <MapPin size={16} />
                  <span>{isRTL ? "الموقع:" : "Location:"}</span>
                </div>
                <span className="font-bold text-stone-800">{dept.location || "-"}</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between">
              <div className="text-stone-500 text-xs font-bold">
                <span className="num-en text-stone-900 text-base mr-1">{getDepartmentHeadcount(dept.name)}</span> 
                {isRTL ? "موظفين" : "Employees"}
              </div>
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10 rounded-lg text-xs font-bold px-3">
                {isRTL ? "تفاصيل" : "Details"}
              </Button>
            </div>
          </Card>
        ))}

        {filteredDepartments.length === 0 && (
          <div className="col-span-full p-12 text-center border-2 border-dashed border-stone-200 rounded-[32px]">
            <Layers className="mx-auto h-12 w-12 text-stone-300 mb-4" />
            <p className="text-stone-500 font-bold text-lg">
              {isRTL ? "لا توجد أقسام مطابقة." : "No matching departments found."}
            </p>
          </div>
        )}
      </div>

      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-[32px] border-none">
          <div className="p-8 bg-stone-50 border-b border-stone-100">
            <h3 className="text-2xl font-black text-stone-900 mb-1">
              {isRTL ? "إضافة قسم جديد" : "Add New Department"}
            </h3>
            <p className="text-stone-500 font-medium">
              {isRTL ? "أدخل تفاصيل القسم التنظيمي في الهيكل الإداري." : "Enter department details for the organizational chart."}
            </p>
          </div>
          <form onSubmit={handleCreateDepartment} className="p-8 space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-bold text-stone-700">{isRTL ? "اسم القسم" : "Department Name"}</label>
              <Input 
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="h-12 rounded-xl border-stone-200" 
                placeholder={isRTL ? "مثال: قسم تقنية المعلومات" : "e.g. IT Department"}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-stone-700">{isRTL ? "مدير القسم" : "Department Manager"}</label>
              <Select value={formData.manager_id} onValueChange={(v) => setFormData({...formData, manager_id: v})}>
                <SelectTrigger className="h-12 rounded-xl border-stone-200">
                  <SelectValue placeholder={isRTL ? "اختر المدير" : "Select Manager"} />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {staff.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.full_name || s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-stone-700">{isRTL ? "الموقع / المبنى" : "Location / Building"}</label>
              <Input 
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="h-12 rounded-xl border-stone-200" 
                placeholder={isRTL ? "مثال: المبنى الرئيسي - الطابق الثاني" : "e.g. Main Building - 2nd Floor"}
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
                {isRTL ? "حفظ القسم" : "Save Department"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
