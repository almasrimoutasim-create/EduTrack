import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useLanguage } from "@/lib/LanguageContext";
import { 
  Shield, 
  Check, 
  Users, 
  Bus, 
  ShoppingCart, 
  Lock, 
  Settings2,
  FileText,
  CreditCard,
  Eye,
  Edit,
  Trash
} from "lucide-react";

export default function RoleSettingsDialog({ open, onClose }) {
  const { language } = useLanguage();
  const isRTL = language === "ar";

  const initialRolesData = {
    registrar: {
      label: isRTL ? "المسجل" : "Registrar",
      icon: FileText,
      color: "bg-orange-500 text-white",
      permissions: {
        viewStudents: true,
        editStudents: true,
        deleteStudents: false,
        viewSchedules: true,
        editSchedules: true,
      }
    },
    bus_supervisor: {
      label: isRTL ? "مشرف حافلة" : "Bus Supervisor",
      icon: Bus,
      color: "bg-amber-500 text-stone-900",
      permissions: {
        viewRoutes: true,
        editRoutes: true,
        studentAttendance: true,
        alertParents: true,
        viewStaffRecords: false,
      }
    },
    store_keeper: {
      label: isRTL ? "أمين مستودع" : "Store Keeper",
      icon: ShoppingCart,
      color: "bg-blue-600 text-white",
      permissions: {
        manageInventory: true,
        salesReports: true,
        addProducts: true,
        discountControls: false,
        refundsApproval: false,
      }
    },
    security: {
      label: isRTL ? "حارس أمن" : "Security",
      icon: Shield,
      color: "bg-stone-800 text-white",
      permissions: {
        viewVisitorLog: true,
        addVisitorLog: true,
        gateControls: true,
        emergencyAlerts: true,
        viewGrades: false,
      }
    },
    hr: {
      label: isRTL ? "موارد بشرية" : "Human Resources",
      icon: Users,
      color: "bg-purple-600 text-white",
      permissions: {
        viewStaffList: true,
        addStaff: true,
        editStaff: true,
        deleteStaff: true,
        payrollManage: false,
      }
    },
    accountant: {
      label: isRTL ? "محاسب" : "Accountant",
      icon: CreditCard,
      color: "bg-rose-600 text-white",
      permissions: {
        viewTransactions: true,
        createInvoices: true,
        approveRefunds: true,
        auditLogs: true,
        systemSettings: false,
      }
    }
  };

  const [rolesData, setRolesData] = useState(initialRolesData);
  const [selectedRoleKey, setSelectedRoleKey] = useState("registrar");
  const [saving, setSaving] = useState(false);

  const handleTogglePermission = (permissionKey) => {
    setRolesData(prev => ({
      ...prev,
      [selectedRoleKey]: {
        ...prev[selectedRoleKey],
        permissions: {
          ...prev[selectedRoleKey].permissions,
          [permissionKey]: !prev[selectedRoleKey].permissions[permissionKey]
        }
      }
    }));
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success(isRTL ? "تم حفظ إعدادات الأدوار بنجاح!" : "Role settings saved successfully!");
      onClose();
    }, 1000);
  };

  const currentRole = rolesData[selectedRoleKey];

  const permissionLabels = {
    viewStudents: isRTL ? "عرض بيانات الطلاب" : "View Student Data",
    editStudents: isRTL ? "تعديل بيانات الطلاب" : "Edit Student Data",
    deleteStudents: isRTL ? "حذف الطلاب" : "Delete Students",
    viewSchedules: isRTL ? "عرض الجداول الدراسية" : "View Schedules",
    editSchedules: isRTL ? "تعديل الجداول الدراسية" : "Edit Schedules",
    viewRoutes: isRTL ? "عرض مسارات الحافلات" : "View Bus Routes",
    editRoutes: isRTL ? "تعديل مسارات الحافلات" : "Edit Bus Routes",
    studentAttendance: isRTL ? "تسجيل حضور الحافلة" : "Bus Attendance",
    alertParents: isRTL ? "إرسال تنبيهات لأولياء الأمور" : "Send Alerts to Parents",
    viewStaffRecords: isRTL ? "عرض سجلات الموظفين" : "View Staff Records",
    manageInventory: isRTL ? "إدارة المخزون والمستودع" : "Manage Inventory",
    salesReports: isRTL ? "عرض تقارير المبيعات" : "View Sales Reports",
    addProducts: isRTL ? "إضافة منتجات للمتجر" : "Add Products to Store",
    discountControls: isRTL ? "التحكم في الخصومات" : "Discount Controls",
    refundsApproval: isRTL ? "الموافقة على عمليات الاسترجاع" : "Approve Refunds",
    viewVisitorLog: isRTL ? "عرض سجل الزوار" : "View Visitor Log",
    addVisitorLog: isRTL ? "إضافة زائر جديد" : "Register New Visitor",
    gateControls: isRTL ? "التحكم في البوابات الإلكترونية" : "Electronic Gate Control",
    emergencyAlerts: isRTL ? "إطلاق تنبيهات الطوارئ" : "Trigger Emergency Alerts",
    viewGrades: isRTL ? "عرض درجات الطلاب" : "View Student Grades",
    viewStaffList: isRTL ? "عرض قائمة الموظفين" : "View Staff List",
    addStaff: isRTL ? "إضافة موظفين جدد" : "Add New Staff Members",
    editStaff: isRTL ? "تعديل بيانات الموظفين" : "Edit Staff Data",
    deleteStaff: isRTL ? "حذف الموظفين من النظام" : "Delete Staff Members",
    payrollManage: isRTL ? "إدارة رواتب الموظفين" : "Manage Payroll",
    viewTransactions: isRTL ? "عرض العمليات المالية" : "View Financial Transactions",
    createInvoices: isRTL ? "إنشاء الفواتير والرسوم" : "Create Invoices & Fees",
    approveRefunds: isRTL ? "اعتماد المبالغ المستردة" : "Approve Financial Refunds",
    auditLogs: isRTL ? "عرض سجل التدقيق المالي" : "View Financial Audit Logs",
    systemSettings: isRTL ? "تعديل إعدادات النظام الحساسة" : "Modify Sensitive System Settings",
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 rounded-[32px] overflow-hidden border-none bg-stone-50 shadow-2xl flex flex-col max-h-[85vh]" dir={isRTL ? "rtl" : "ltr"}>
        
        {/* Header */}
        <div className="p-8 bg-stone-900 text-white flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center text-primary backdrop-blur-md">
            <Settings2 size={24} />
          </div>
          <div>
            <DialogTitle className="text-xl font-serif font-black tracking-wide text-white">
              {isRTL ? "إعدادات صلاحيات الأدوار" : "Role Permission Settings"}
            </DialogTitle>
            <p className="text-stone-400 text-xs mt-1 font-medium">
              {isRTL ? "إدارة صلاحيات الوصول ومستويات الأمان للأقسام الإدارية والمساندة" : "Manage access permissions and security levels for departments"}
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex flex-1 overflow-hidden min-h-[400px]">
          
          {/* Sidebar - Roles Selection */}
          <div className="w-1/3 border-e border-stone-200/60 bg-stone-100/50 p-4 overflow-y-auto space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3 px-2">
              {isRTL ? "الأدوار الإدارية" : "Administrative Roles"}
            </p>
            {Object.entries(rolesData).map(([key, data]) => {
              const RoleIcon = data.icon;
              const isSelected = selectedRoleKey === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedRoleKey(key)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-2xl text-start font-serif font-bold text-sm transition-all duration-300 ${
                    isSelected 
                      ? "bg-white text-stone-950 shadow-md shadow-stone-200/50 scale-[1.02]" 
                      : "text-stone-500 hover:bg-stone-200/50 hover:text-stone-800"
                  }`}
                >
                  <div className={`h-8 w-8 rounded-xl ${data.color} flex items-center justify-center shrink-0 shadow-sm`}>
                    <RoleIcon size={16} />
                  </div>
                  <span className="truncate">{data.label}</span>
                </button>
              );
            })}
          </div>

          {/* Permissions Form Panel */}
          <div className="w-2/3 p-8 overflow-y-auto flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className={`h-10 w-10 rounded-xl ${currentRole.color} flex items-center justify-center shadow-md`}>
                  <currentRole.icon size={20} />
                </div>
                <div>
                  <h3 className="font-serif font-black text-lg text-stone-950">
                    {isRTL ? `صلاحيات الوصول لـ ${currentRole.label}` : `Permissions for ${currentRole.label}`}
                  </h3>
                  <p className="text-stone-400 text-xs font-semibold mt-0.5">
                    {isRTL ? "حدد المميزات التي يمكن للموظف إدارتها" : "Define features this role can access/manage"}
                  </p>
                </div>
              </div>

              {/* Grid of Permissions checkboxes */}
              <div className="space-y-3">
                {Object.entries(currentRole.permissions).map(([permKey, val]) => (
                  <Card 
                    key={permKey}
                    onClick={() => handleTogglePermission(permKey)}
                    className={`p-4 border border-stone-200/60 shadow-none hover:shadow-md transition-all duration-300 rounded-[20px] cursor-pointer flex items-center justify-between ${
                      val ? "bg-white border-stone-300" : "bg-stone-50/50 opacity-70"
                    }`}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-serif font-bold text-stone-900">
                        {permissionLabels[permKey] || permKey}
                      </span>
                      <span className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider">
                        {permKey}
                      </span>
                    </div>

                    <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      val 
                        ? "bg-emerald-500 border-emerald-500 text-white scale-110" 
                        : "border-stone-300 bg-white text-transparent"
                    }`}>
                      <Check size={12} strokeWidth={3} />
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Save Buttons */}
            <div className="pt-6 mt-8 border-t border-stone-200/60 flex items-center justify-end gap-3">
              <button 
                onClick={onClose}
                className="h-11 px-6 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 font-bold text-xs text-stone-600 transition-all cursor-pointer"
              >
                {isRTL ? "إلغاء" : "Cancel"}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="h-11 px-8 rounded-xl bg-primary text-white hover:bg-primary/90 font-serif font-black text-xs shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all cursor-pointer flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>{isRTL ? "جاري الحفظ..." : "Saving..."}</span>
                  </>
                ) : (
                  <span>{isRTL ? "حفظ التغييرات" : "Save Changes"}</span>
                )}
              </button>
            </div>

          </div>

        </div>

      </DialogContent>
    </Dialog>
  );
}
