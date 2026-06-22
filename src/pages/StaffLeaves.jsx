import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/dbClient";
import { useLanguage } from "@/lib/LanguageContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle2, XCircle, Clock, CalendarDays, FileText, Filter } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function StaffLeaves() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const qc = useQueryClient();

  const [selectedLeave, setSelectedLeave] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: leaves = [], isLoading } = useQuery({
    queryKey: ["staff-leaves"],
    queryFn: () => entities.StaffLeave.list("-created_at")
  });

  const { data: staff = [] } = useQuery({
    queryKey: ["staff-members"],
    queryFn: () => entities.StaffMember.list()
  });

  const handleStatusUpdate = async (leaveId, newStatus) => {
    try {
      await entities.StaffLeave.update(leaveId, { 
        status: newStatus,
        updated_at: new Date().toISOString()
      });
      toast.success(isRTL ? "تم تحديث حالة الطلب بنجاح" : "Leave request status updated");
      qc.invalidateQueries({ queryKey: ["staff-leaves"] });
      setSelectedLeave(null);
    } catch (error) {
      toast.error(isRTL ? "فشل تحديث الحالة" : "Failed to update status");
    }
  };

  const getStaffName = (staffId) => {
    const member = staff.find(s => s.id === staffId);
    return member ? (member.full_name || member.name) : staffId;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none px-3 py-1">{isRTL ? "تمت الموافقة" : "Approved"}</Badge>;
      case "rejected":
        return <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-200 border-none px-3 py-1">{isRTL ? "مرفوض" : "Rejected"}</Badge>;
      default:
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-none px-3 py-1">{isRTL ? "قيد الانتظار" : "Pending"}</Badge>;
    }
  };

  const filteredLeaves = leaves.filter(l => filterStatus === "all" || l.status === filterStatus);
  const pendingCount = leaves.filter(l => l.status === "pending" || !l.status).length;
  const approvedCount = leaves.filter(l => l.status === "approved").length;

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
            {isRTL ? "إدارة الإجازات والمغادرات" : "Leaves & Vacations"}
          </h1>
          <p className="text-stone-500 font-medium mt-1">
            {isRTL ? "مراجعة واعتماد طلبات الإجازات لموظفي المدرسة" : "Review and approve staff leave requests"}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 rounded-[24px] border-none shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-blue-600/80 mb-2">{isRTL ? "إجمالي الطلبات" : "Total Requests"}</p>
              <h3 className="text-4xl font-black text-blue-900 num-en">{leaves.length}</h3>
            </div>
            <div className="p-3 bg-blue-100 rounded-2xl">
              <CalendarDays className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6 rounded-[24px] border-none shadow-sm bg-gradient-to-br from-amber-50 to-orange-50 relative overflow-hidden group">
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-sm font-bold text-amber-700/80 mb-2">{isRTL ? "بانتظار الاعتماد" : "Pending Approval"}</p>
              <h3 className="text-4xl font-black text-amber-900 num-en">{pendingCount}</h3>
            </div>
            <div className="p-3 bg-amber-200/50 rounded-2xl">
              <Clock className="h-6 w-6 text-amber-700" />
            </div>
          </div>
        </Card>

        <Card className="p-6 rounded-[24px] border-none shadow-sm bg-gradient-to-br from-emerald-50 to-teal-50">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-emerald-700/80 mb-2">{isRTL ? "الطلبات المعتمدة" : "Approved Requests"}</p>
              <h3 className="text-4xl font-black text-emerald-900 num-en">{approvedCount}</h3>
            </div>
            <div className="p-3 bg-emerald-200/50 rounded-2xl">
              <CheckCircle2 className="h-6 w-6 text-emerald-700" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="border border-stone-100 shadow-sm rounded-[32px] overflow-hidden bg-white">
        <div className="p-6 border-b border-stone-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="text-xl font-bold text-stone-800">
            {isRTL ? "سجل الطلبات" : "Requests Log"}
          </h2>
          <div className="flex gap-2">
            {["all", "pending", "approved", "rejected"].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  filterStatus === status 
                    ? "bg-stone-900 text-white" 
                    : "bg-stone-50 text-stone-500 hover:bg-stone-100"
                }`}
              >
                {status === "all" ? (isRTL ? "الكل" : "All") : 
                 status === "pending" ? (isRTL ? "المعلقة" : "Pending") :
                 status === "approved" ? (isRTL ? "المقبولة" : "Approved") :
                 (isRTL ? "المرفوضة" : "Rejected")}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-stone-50/50 text-stone-500 font-semibold border-b border-stone-100">
              <tr>
                <th className={`p-4 font-bold ${isRTL ? "text-right" : "text-left"}`}>{isRTL ? "الموظف" : "Staff Member"}</th>
                <th className={`p-4 font-bold ${isRTL ? "text-right" : "text-left"}`}>{isRTL ? "نوع الإجازة" : "Leave Type"}</th>
                <th className={`p-4 font-bold ${isRTL ? "text-right" : "text-left"}`}>{isRTL ? "المدة" : "Duration"}</th>
                <th className={`p-4 font-bold ${isRTL ? "text-right" : "text-left"}`}>{isRTL ? "تاريخ الطلب" : "Applied On"}</th>
                <th className={`p-4 font-bold ${isRTL ? "text-right" : "text-left"}`}>{isRTL ? "الحالة" : "Status"}</th>
                <th className={`p-4 font-bold text-center`}>{isRTL ? "إجراء" : "Action"}</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-stone-400 font-medium">
                    {isRTL ? "لا توجد طلبات تطابق الفلتر الحالي." : "No requests match the current filter."}
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((leave) => (
                  <tr key={leave.id} className="border-b border-stone-50 hover:bg-stone-50/50 transition-colors">
                    <td className={`p-4 font-bold text-stone-800 ${isRTL ? "text-right" : "text-left"}`}>
                      {getStaffName(leave.staff_id)}
                    </td>
                    <td className={`p-4 ${isRTL ? "text-right" : "text-left"}`}>
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-stone-400" />
                        <span className="font-semibold text-stone-600">{leave.leave_type || (isRTL ? "إجازة سنوية" : "Annual Leave")}</span>
                      </div>
                    </td>
                    <td className={`p-4 ${isRTL ? "text-right" : "text-left"}`}>
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-stone-400" />
                        <span className="font-semibold text-stone-700 num-en">
                          {leave.start_date} - {leave.end_date}
                        </span>
                      </div>
                    </td>
                    <td className={`p-4 text-stone-500 font-medium num-en ${isRTL ? "text-right" : "text-left"}`}>
                      {new Date(leave.created_at || Date.now()).toLocaleDateString()}
                    </td>
                    <td className={`p-4 ${isRTL ? "text-right" : "text-left"}`}>
                      {getStatusBadge(leave.status || "pending")}
                    </td>
                    <td className="p-4 text-center">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="font-bold text-primary hover:text-primary hover:bg-primary/10 rounded-xl"
                        onClick={() => setSelectedLeave(leave)}
                      >
                        {isRTL ? "التفاصيل" : "Details"}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Details & Action Dialog */}
      <Dialog open={!!selectedLeave} onOpenChange={(open) => !open && setSelectedLeave(null)}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-[32px] border-none">
          {selectedLeave && (
            <>
              <div className="p-8 bg-stone-50 border-b border-stone-100">
                <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20 border-none px-3 py-1">
                  {isRTL ? "تفاصيل الطلب" : "Request Details"}
                </Badge>
                <h3 className="text-2xl font-black text-stone-900 mb-1">
                  {getStaffName(selectedLeave.staff_id)}
                </h3>
                <p className="text-stone-500 font-semibold flex items-center gap-2">
                  <FileText size={16} />
                  {selectedLeave.leave_type || (isRTL ? "إجازة سنوية" : "Annual Leave")}
                </p>
              </div>

              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">{isRTL ? "من تاريخ" : "From Date"}</p>
                    <p className="font-semibold text-stone-800 flex items-center gap-2">
                      <CalendarDays size={16} className="text-stone-400" />
                      <span className="num-en">{selectedLeave.start_date}</span>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">{isRTL ? "إلى تاريخ" : "To Date"}</p>
                    <p className="font-semibold text-stone-800 flex items-center gap-2">
                      <CalendarDays size={16} className="text-stone-400" />
                      <span className="num-en">{selectedLeave.end_date}</span>
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">{isRTL ? "السبب / ملاحظات" : "Reason / Notes"}</p>
                  <div className="p-4 bg-stone-50 rounded-2xl text-stone-700 text-sm leading-relaxed border border-stone-100">
                    {selectedLeave.reason || (isRTL ? "لا توجد ملاحظات إضافية." : "No additional notes provided.")}
                  </div>
                </div>

                <div className="pt-6 border-t border-stone-100 flex gap-3">
                  {(!selectedLeave.status || selectedLeave.status === "pending") ? (
                    <>
                      <Button 
                        onClick={() => handleStatusUpdate(selectedLeave.id, "approved")}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl h-12 font-bold text-base shadow-lg shadow-emerald-500/20 transition-all"
                      >
                        <CheckCircle2 className="mr-2 h-5 w-5" />
                        {isRTL ? "اعتماد الإجازة" : "Approve Leave"}
                      </Button>
                      <Button 
                        onClick={() => handleStatusUpdate(selectedLeave.id, "rejected")}
                        className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl h-12 font-bold text-base border-none"
                      >
                        <XCircle className="mr-2 h-5 w-5" />
                        {isRTL ? "رفض الطلب" : "Reject"}
                      </Button>
                    </>
                  ) : (
                    <div className="w-full text-center p-4 bg-stone-50 rounded-2xl">
                      <p className="text-sm font-bold text-stone-500 mb-2">
                        {isRTL ? "حالة الطلب الحالية" : "Current Status"}
                      </p>
                      {getStatusBadge(selectedLeave.status)}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
