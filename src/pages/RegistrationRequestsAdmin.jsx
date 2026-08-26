import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/dbClient";
import { useLanguage } from "@/lib/LanguageContext";
import PageHeader from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Check, X, UserPlus, Key, Eye, Clock, Search, Filter } from "lucide-react";

const ROLE_LABELS = {
  admin: "مدير مدرسة",
  teacher: "معلم",
  student: "طالب",
  staff: "موظف",
  parent: "ولي أمر",
};

export default function RegistrationRequestsAdmin() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const qc = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [approveOpen, setApproveOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [roleToAssign, setRoleToAssign] = useState("");

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["registration_requests"],
    queryFn: () => entities.RegistrationRequest.list("-created_at", 1000),
  });

  const filtered = requests.filter(r => {
    const matchStatus = filter === "all" || r.status === filter;
    const matchSearch = !search || (r.full_name || "").toLowerCase().includes(search.toLowerCase()) || (r.email || "").toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => entities.RegistrationRequest.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["registration_requests"] });
      toast.success(isRTL ? "تم التحديث" : "Updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const openApprove = (req) => {
    setSelected(req);
    setUsername(req.email?.split("@")[0] || "");
    setPassword(Math.random().toString(36).slice(2, 10));
    setRoleToAssign(req.role_requested);
    setApproveOpen(true);
  };

  const handleApprove = async () => {
    if (!username.trim() || !password.trim() || !roleToAssign) {
      toast.error(isRTL ? "أدخل اسم المستخدم وكلمة المرور واختر الدور" : "Enter username, password and role");
      return;
    }
    try {
      // 1) Create user in target table
      await createUserForRole(selected, username.trim(), password.trim(), roleToAssign);
      // 2) Mark request as approved
      await updateMutation.mutateAsync({
        id: selected.id,
        data: {
          status: "approved",
          username_generated: username.trim(),
          password_generated: password.trim(),
          role_requested: roleToAssign,
          reviewed_at: new Date().toISOString(),
        }
      });
      toast.success(isRTL ? `تمت الموافقة - اسم المستخدم: ${username}` : `Approved - username: ${username}`);
      setApproveOpen(false);
    } catch (err) {
      toast.error(err.message || (isRTL ? "فشل إنشاء الحساب" : "Failed to create account"));
    }
  };

  const createUserForRole = async (req, uname, pwd, role) => {
    const base = { full_name: req.full_name, email: req.email, phone: req.phone };
    if (role === "admin") {
      // system_admins uses email as identifier
      await entities.SystemAdmin.create({ email: req.email, password: pwd, full_name: req.full_name });
    } else if (role === "teacher") {
      await entities.Teacher.create({
        full_name: req.full_name,
        email: req.email,
        employee_id: req.id_number || uname,
        portal_password: pwd,
        phone: req.phone,
        status: "active",
      });
    } else if (role === "student") {
      await entities.Student.create({
        full_name: req.full_name,
        student_id: req.id_number || uname,
        user_email: req.email,
        portal_password: pwd,
        grade: req.grade || "1",
        phone: req.phone,
        status: "active",
      });
    } else if (role === "staff") {
      await entities.StaffMember.create({
        full_name: req.full_name,
        email: req.email,
        employee_id: req.id_number || uname,
        portal_password: pwd,
        phone: req.phone,
        role: "staff",
        status: "active",
      });
    } else if (role === "parent") {
      // parent linked via student parent fields - create a placeholder student link if needed
      // For now create a student record with parent info so parent can login
      await entities.Student.create({
        full_name: req.full_name + " (ولي أمر)",
        student_id: req.id_number || uname,
        parent_email: req.email,
        parent_password: pwd,
        parent_name: req.full_name,
        phone: req.phone,
        status: "active",
        grade: "1",
        user_email: `parent_${uname}@temp.local`,
        portal_password: "temp123",
      });
    } else {
      throw new Error(isRTL ? "دور غير معروف" : "Unknown role");
    }
  };

  const handleReject = async (req) => {
    if (!confirm(isRTL ? "هل تريد رفض هذا الطلب؟" : "Reject this request?")) return;
    await updateMutation.mutateAsync({ id: req.id, data: { status: "rejected", reviewed_at: new Date().toISOString() } });
  };

  return (
    <div className="space-y-6 pb-20" dir={isRTL ? "rtl" : "ltr"}>
      <PageHeader
        title={isRTL ? "طلبات التسجيل" : "Registration Requests"}
        subtitle={isRTL ? "مراجعة طلبات التسجيل الجديدة والموافقة عليها وإنشاء الحسابات" : "Review new registration requests and approve with credentials"}
      />

      <Card className="p-4 bg-white rounded-2xl border-none shadow-sm">
        <div className="flex flex-col md:flex-row gap-3 justify-between">
          <div className="relative flex-1">
            <Search size={16} className={`absolute top-1/2 -translate-y-1/2 text-stone-400 ${isRTL ? "right-3" : "left-3"}`} />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={isRTL ? "ابحث بالاسم أو البريد..." : "Search name or email..."} className={`${isRTL ? "pr-10" : "pl-10"} h-10 rounded-xl`} />
          </div>
          <div className="flex gap-2 items-center">
            <Filter size={16} className="text-stone-400" />
            {[
              ["all", isRTL ? "الكل" : "All"],
              ["pending", isRTL ? "قيد المراجعة" : "Pending"],
              ["approved", isRTL ? "مقبول" : "Approved"],
              ["rejected", isRTL ? "مرفوض" : "Rejected"],
            ].map(([val, label]) => (
              <button key={val} onClick={() => setFilter(val)} className={`px-3 h-9 rounded-xl text-xs font-bold border ${filter === val ? "bg-stone-900 text-white border-stone-900" : "bg-white border-stone-200 text-stone-600"}`}>{label}</button>
            ))}
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="text-center py-16 text-stone-400">{isRTL ? "جاري التحميل..." : "Loading..."}</div>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center rounded-2xl border-dashed text-stone-400">{isRTL ? "لا توجد طلبات" : "No requests"}</Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(req => (
            <Card key={req.id} className="p-5 rounded-2xl border-none shadow-sm bg-white">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-black text-stone-900">{req.full_name}</p>
                  <p className="text-xs text-stone-500">{req.email} {req.phone ? `• ${req.phone}` : ""}</p>
                  <p className="text-xs text-stone-400 mt-1">{isRTL ? `الصفة المطلوبة: ${ROLE_LABELS[req.role_requested] || req.role_requested}` : `Requested: ${req.role_requested}`} {req.grade ? `• ${req.grade}` : ""}</p>
                  {req.id_number && <p className="text-xs text-stone-400">ID: {req.id_number}</p>}
                  {req.notes && <p className="text-xs text-stone-600 mt-1 bg-stone-50 p-2 rounded-xl">{req.notes}</p>}
                </div>
                <Badge className={`${req.status === "pending" ? "bg-amber-100 text-amber-700" : req.status === "approved" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"} border-none text-[10px]`}>
                  {req.status === "pending" ? (isRTL ? "قيد المراجعة" : "Pending") : req.status === "approved" ? (isRTL ? "مقبول" : "Approved") : (isRTL ? "مرفوض" : "Rejected")}
                </Badge>
              </div>
              {req.status === "approved" && req.username_generated && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-xs mb-3">
                  <div className="flex items-center gap-1 font-bold text-emerald-800"><Key size={12} />{isRTL ? "بيانات الدخول:" : "Credentials:"}</div>
                  <div className="mt-1 font-mono text-emerald-900">{isRTL ? "المستخدم:" : "User:"} {req.username_generated} — {isRTL ? "كلمة المرور:" : "Pass:"} {req.password_generated} — {isRTL ? "الدور:" : "Role:"} {ROLE_LABELS[req.role_requested] || req.role_requested}</div>
                </div>
              )}
              <div className="flex gap-2">
                {req.status === "pending" && (
                  <>
                    <button onClick={() => openApprove(req)} className="flex-1 h-9 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1 hover:bg-emerald-700"><Check size={14} />{isRTL ? "قبول وإنشاء الحساب" : "Approve"}</button>
                    <button onClick={() => handleReject(req)} className="flex-1 h-9 rounded-xl bg-white border border-rose-200 text-rose-600 font-bold text-xs flex items-center justify-center gap-1 hover:bg-rose-50"><X size={14} />{isRTL ? "رفض" : "Reject"}</button>
                  </>
                )}
                {req.status !== "pending" && (
                  <span className="text-[11px] text-stone-400 flex items-center gap-1"><Clock size={12} />{new Date(req.created_at).toLocaleDateString(isRTL ? "ar-SA" : "en-US")}</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent className="max-w-md rounded-[24px]" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="font-black flex items-center gap-2"><UserPlus size={18} />{isRTL ? "الموافقة وإنشاء الحساب" : "Approve & Create Account"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="bg-stone-50 p-3 rounded-xl text-xs">
              <div><span className="font-bold">{isRTL ? "الاسم:" : "Name:"}</span> {selected?.full_name}</div>
              <div><span className="font-bold">{isRTL ? "البريد:" : "Email:"}</span> {selected?.email}</div>
              <div><span className="font-bold">{isRTL ? "الصفة المطلوبة:" : "Requested:"}</span> {ROLE_LABELS[selected?.role_requested] || selected?.role_requested}</div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-600">{isRTL ? "الدور الممنوح *" : "Role to assign *"}</label>
              <select value={roleToAssign} onChange={e => setRoleToAssign(e.target.value)} className="w-full h-11 rounded-xl border border-stone-200 px-3 text-sm font-bold">
                <option value="admin">{isRTL ? "مدير مدرسة" : "School Manager"}</option>
                <option value="teacher">{isRTL ? "معلم" : "Teacher"}</option>
                <option value="student">{isRTL ? "طالب" : "Student"}</option>
                <option value="staff">{isRTL ? "موظف" : "Staff"}</option>
                <option value="parent">{isRTL ? "ولي أمر" : "Parent"}</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-600">{isRTL ? "اسم المستخدم *" : "Username *"}</label>
              <Input value={username} onChange={e => setUsername(e.target.value)} placeholder={isRTL ? "مثال: ahmed.ali" : "e.g. ahmed.ali"} className="h-11 rounded-xl" dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-600">{isRTL ? "كلمة المرور *" : "Password *"}</label>
              <Input value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="h-11 rounded-xl" dir="ltr" />
              <p className="text-[11px] text-stone-400">{isRTL ? "سيتم إرسالها للمستخدم بعد الموافقة" : "Will be shared with user after approval"}</p>
            </div>
          </div>
          <DialogFooter className="gap-2 pt-4">
            <button onClick={() => setApproveOpen(false)} className="flex-1 h-11 rounded-xl border border-stone-200 font-bold text-sm">{isRTL ? "إلغاء" : "Cancel"}</button>
            <button onClick={handleApprove} className="flex-[2] h-11 rounded-xl bg-emerald-600 text-white font-black text-sm hover:bg-emerald-700 flex items-center justify-center gap-2"><Check size={16} />{isRTL ? "تأكيد الموافقة" : "Confirm Approval"}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
