import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/dbClient";
import { useAuth } from "@/lib/AuthContext";
import { useBranch } from "@/lib/BranchContext";
import { useLanguage } from "@/lib/LanguageContext";
import PageHeader from "@/components/shared/PageHeader";
import StatCard from "@/components/shared/StatCard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Building2,
  Plus,
  Copy,
  ExternalLink,
  MapPin,
  Users,
  CheckCircle2,
  ShieldCheck,
  Edit,
  Trash2,
  Globe,
  Phone,
  Mail,
  UserCheck,
  Sparkles,
  Layers,
  ArrowRight,
  Search,
} from "lucide-react";

export default function BranchManagement() {
  const { user } = useAuth();
  const { activeBranchId, setActiveBranchId } = useBranch();
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const queryClient = useQueryClient();

  const schoolId = user?.school_id || localStorage.getItem("portal_school_id");

  // Fetch branches
  const { data: branches = [], isLoading } = useQuery({
    queryKey: ["school-branches", schoolId],
    queryFn: async () => {
      const list = await entities.SchoolBranch.list("-created_at", 100);
      return Array.isArray(list) ? list : [];
    },
    staleTime: 1000 * 60,
  });

  // Fetch students & teachers to calculate counts per branch
  const { data: students = [] } = useQuery({
    queryKey: ["students-for-branches"],
    queryFn: () => entities.Student.list("-created_at", 1000),
    staleTime: 1000 * 60 * 5,
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ["teachers-for-branches"],
    queryFn: () => entities.Teacher.list("-created_at", 500),
    staleTime: 1000 * 60 * 5,
  });

  // Search filter
  const [searchTerm, setSearchTerm] = useState("");

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [branchToDelete, setBranchToDelete] = useState(null);

  // Form State
  const initialForm = {
    name: "",
    name_en: "",
    city: "",
    address: "",
    phone: "",
    email: "",
    slug: "",
    director_name: "",
    logo_url: "",
    background_image: "",
    is_main: false,
    status: "active",
    // Director account generation
    createAdmin: true,
    adminEmail: "",
    adminPassword: "",
  };
  const [formData, setFormData] = useState(initialForm);

  // Auto-generate slug helper
  const handleNameChange = (val) => {
    const clean = val
      .trim()
      .toLowerCase()
      .replace(/[\s\-_]+/g, "-")
      .replace(/[^\u0621-\u064A\w\-]+/g, "");
    setFormData((prev) => ({
      ...prev,
      name: val,
      slug: prev.slug ? prev.slug : clean,
      adminEmail: prev.adminEmail ? prev.adminEmail : `admin-${clean || "branch"}@edutrack.app`,
      adminPassword: prev.adminPassword ? prev.adminPassword : Math.random().toString(36).slice(-8) + "!2026",
    }));
  };

  const handleCityChange = (cityVal) => {
    setFormData((prev) => {
      const baseSlug = prev.slug || "";
      const citySlug = cityVal.trim().replace(/[\s\-_]+/g, "-");
      return {
        ...prev,
        city: cityVal,
        slug: baseSlug.includes(citySlug) ? baseSlug : (baseSlug ? `${baseSlug}-${citySlug}` : citySlug),
      };
    });
  };

  // Open add dialog
  const openAddDialog = () => {
    setEditingBranch(null);
    setFormData({
      ...initialForm,
      adminPassword: Math.random().toString(36).slice(-8) + "!2026",
    });
    setIsAddOpen(true);
  };

  // Open edit dialog
  const openEditDialog = (branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name || "",
      name_en: branch.name_en || "",
      city: branch.city || "",
      address: branch.address || "",
      phone: branch.phone || "",
      email: branch.email || "",
      slug: branch.slug || "",
      director_name: branch.director_name || "",
      logo_url: branch.logo_url || "",
      background_image: branch.background_image || "",
      is_main: Boolean(branch.is_main),
      status: branch.status || "active",
      createAdmin: false,
      adminEmail: "",
      adminPassword: "",
    });
    setIsAddOpen(true);
  };

  // Create or Update mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!formData.name.trim()) throw new Error("اسم الفرع مطلوب");
      if (!formData.city.trim()) throw new Error("مدينة الفرع مطلوبة");
      if (!formData.slug.trim()) throw new Error("معرّف الفرع (Slug) مطلوب");

      const payload = {
        name: formData.name.trim(),
        name_en: formData.name_en.trim() || formData.name.trim(),
        city: formData.city.trim(),
        address: formData.address.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        slug: formData.slug.trim().toLowerCase(),
        director_name: formData.director_name.trim(),
        logo_url: formData.logo_url.trim(),
        background_image: formData.background_image.trim(),
        is_main: formData.is_main,
        status: formData.status,
      };

      if (editingBranch) {
        return await entities.SchoolBranch.update(editingBranch.id, payload);
      } else {
        const createdBranch = await entities.SchoolBranch.create(payload);

        // If requested to create branch admin
        if (formData.createAdmin && formData.adminEmail && formData.adminPassword) {
          try {
            await entities.SystemAdmin.create({
              full_name: formData.director_name.trim() || `مدير ${formData.name}`,
              email: formData.adminEmail.trim().toLowerCase(),
              username: formData.adminEmail.trim().toLowerCase(),
              password: formData.adminPassword.trim(),
              portal_password: formData.adminPassword.trim(),
              role: "admin",
              school_id: schoolId,
              branch_id: createdBranch.id,
              status: "active",
            });
          } catch (admErr) {
            console.warn("Failed to create branch admin account:", admErr);
            toast.warning("تم إنشاء الفرع بنجاح، لكن تعذر إنشاء حساب المدير تلقائياً. تأكد من عدم تكرار البريد.");
          }
        }
        return createdBranch;
      }
    },
    onSuccess: () => {
      toast.success(editingBranch ? "تم تحديث بيانات الفرع بنجاح" : "تم إنشاء الفرع وبوابته المستقلة بنجاح");
      setIsAddOpen(false);
      queryClient.invalidateQueries({ queryKey: ["school-branches"] });
    },
    onError: (err) => {
      toast.error(err.message || "فشلت العملية");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return await entities.SchoolBranch.delete(id);
    },
    onSuccess: () => {
      toast.success("تم حذف الفرع بنجاح");
      setBranchToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["school-branches"] });
    },
    onError: (err) => {
      toast.error(err.message || "تعذر حذف الفرع");
    },
  });

  // Filtered branches
  const filteredBranches = branches.filter((b) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      b.name?.toLowerCase().includes(term) ||
      b.city?.toLowerCase().includes(term) ||
      b.slug?.toLowerCase().includes(term) ||
      b.director_name?.toLowerCase().includes(term)
    );
  });

  const getBranchUrl = (slug) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/gateway/${slug}`;
  };

  const copyBranchUrl = (slug) => {
    const url = getBranchUrl(slug);
    navigator.clipboard.writeText(url);
    toast.success("تم نسخ رابط بوابة الفرع إلى الحافظة", {
      description: url,
    });
  };

  return (
    <div className="space-y-6 pb-12" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-stone-200/80 pb-4">
        <PageHeader
          title={isRTL ? "إدارة الفروع المتعددة للمدرسة" : "Multi-Branch Management"}
          subtitle={
            isRTL
              ? "إنشاء الفروع، تحديد المدن، توليد روابط البوابات المستقلة، وتعيين بيانات اعتماد مدراء الفروع"
              : "Manage branches, locations, dedicated gateways, and branch administrators"
          }
        />
        <button
          onClick={openAddDialog}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition shadow-sm cursor-pointer shrink-0"
        >
          <Plus size={16} />
          <span>{isRTL ? "إضافة فرع جديد" : "Add New Branch"}</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={isRTL ? "إجمالي الفروع" : "Total Branches"}
          value={branches.length}
          icon={Building2}
          sub={isRTL ? "فرع مسجل" : "Registered"}
          className="bg-emerald-50/50 border-emerald-100"
        />
        <StatCard
          title={isRTL ? "الفروع النشطة" : "Active Branches"}
          value={branches.filter((b) => b.status === "active").length}
          icon={CheckCircle2}
          sub={isRTL ? "بوابات فعالة" : "Live Gateways"}
          className="bg-blue-50/50 border-blue-100"
        />
        <StatCard
          title={isRTL ? "إجمالي الطلاب الموزعين" : "Distributed Students"}
          value={students.filter((s) => s.branch_id).length}
          icon={Users}
          sub={`${students.length} ${isRTL ? "طالب كلي" : "total"}`}
          className="bg-amber-50/50 border-amber-100"
        />
        <StatCard
          title={isRTL ? "الفرع النشط حالياً" : "Current Active Branch"}
          value={
            activeBranchId === "all" || !activeBranchId
              ? isRTL
                ? "نظرة شاملة (الكل)"
                : "All Branches"
              : branches.find((b) => b.id === activeBranchId)?.name || "—"
          }
          icon={Layers}
          sub={isRTL ? "محدد الفروع نشط" : "Selector Active"}
          className="bg-purple-50/50 border-purple-100"
        />
      </div>

      {/* Search and Table */}
      <Card className="border border-stone-200/90 shadow-xs rounded-2xl bg-white overflow-hidden">
        <CardHeader className="p-5 border-b border-stone-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-black flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              <span>{isRTL ? "قائمة فروع المدرسة والبوابات المستقلة" : "School Branches & Gateways"}</span>
            </CardTitle>
            <CardDescription className="text-xs">
              {isRTL
                ? "لكل فرع رابط دخول خاص وهوية مستقلة مع إمكانية التبديل المباشر أو استعراض الكل"
                : "Each branch has an isolated gateway link, branding, and administrators"}
            </CardDescription>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isRTL ? "بحث باسم الفرع أو المدينة..." : "Search by name or city..."}
              className="pr-9 h-9 text-xs rounded-xl border-stone-200"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-stone-400 font-bold">
              {isRTL ? "جارٍ تحميل الفروع..." : "Loading branches..."}
            </div>
          ) : filteredBranches.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Building2 className="w-10 h-10 text-stone-300 mx-auto" />
              <p className="text-sm font-bold text-stone-600">
                {isRTL ? "لم يتم العثور على فروع" : "No branches found"}
              </p>
              <button
                onClick={openAddDialog}
                className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-black transition cursor-pointer"
              >
                {isRTL ? "إضافة أول فرع الآن" : "Add first branch"}
              </button>
            </div>
          ) : (
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/70 text-stone-500 text-xs font-black">
                  <th className="py-3 px-4">{isRTL ? "الفرع" : "Branch"}</th>
                  <th className="py-3 px-4">{isRTL ? "المدينة" : "City"}</th>
                  <th className="py-3 px-4">{isRTL ? "رابط البوابة (Gateway)" : "Gateway Link"}</th>
                  <th className="py-3 px-4">{isRTL ? "المدير والاتصال" : "Director & Contact"}</th>
                  <th className="py-3 px-4">{isRTL ? "الطلاب / المعلمون" : "Students / Teachers"}</th>
                  <th className="py-3 px-4">{isRTL ? "الحالة" : "Status"}</th>
                  <th className="py-3 px-4 text-center">{isRTL ? "الإجراءات" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs">
                {filteredBranches.map((branch) => {
                  const bStudents = students.filter((s) => s.branch_id === branch.id).length;
                  const bTeachers = teachers.filter((t) => t.branch_id === branch.id).length;
                  const isCurrentActive = activeBranchId === branch.id;
                  const gatewayUrl = getBranchUrl(branch.slug);

                  return (
                    <tr
                      key={branch.id}
                      className={`hover:bg-stone-50/80 transition-colors ${
                        isCurrentActive ? "bg-emerald-50/40" : ""
                      }`}
                    >
                      {/* Name & Main Badge */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-emerald-100/70 text-emerald-800 font-black flex items-center justify-center shrink-0 border border-emerald-200/50">
                            {branch.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-extrabold text-stone-900 flex items-center gap-1.5">
                              <span>{branch.name}</span>
                              {branch.is_main && (
                                <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px] py-0 px-1.5 font-bold">
                                  {isRTL ? "الرئيسي" : "Main"}
                                </Badge>
                              )}
                              {isCurrentActive && (
                                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] py-0 px-1.5 font-bold">
                                  {isRTL ? "النشط" : "Active"}
                                </Badge>
                              )}
                            </div>
                            <span className="text-[11px] text-stone-400 font-mono">
                              {branch.slug}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* City */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 text-stone-700 font-bold">
                          <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span>{branch.city || "—"}</span>
                        </div>
                        {branch.address && (
                          <span className="text-[11px] text-stone-400 block truncate max-w-[150px]">
                            {branch.address}
                          </span>
                        )}
                      </td>

                      {/* Gateway Link */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <code className="bg-stone-100 text-stone-800 font-mono text-[11px] px-2 py-1 rounded-md border border-stone-200 max-w-[170px] truncate" dir="ltr">
                            /gateway/{branch.slug}
                          </code>
                          <button
                            type="button"
                            onClick={() => copyBranchUrl(branch.slug)}
                            title={isRTL ? "نسخ رابط البوابة" : "Copy gateway URL"}
                            className="p-1 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition cursor-pointer"
                          >
                            <Copy size={13} />
                          </button>
                          <a
                            href={gatewayUrl}
                            target="_blank"
                            rel="noreferrer"
                            title={isRTL ? "فتح البوابة بنافذة جديدة" : "Open gateway in new tab"}
                            className="p-1 rounded-lg text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 transition"
                          >
                            <ExternalLink size={13} />
                          </a>
                        </div>
                      </td>

                      {/* Director */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-stone-800">
                          {branch.director_name || "—"}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-stone-400">
                          {branch.phone && <span>{branch.phone}</span>}
                          {branch.email && <span>{branch.email}</span>}
                        </div>
                      </td>

                      {/* Counts */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="bg-emerald-50 text-emerald-800 font-extrabold px-2 py-0.5 rounded-md border border-emerald-100 text-[11px]">
                            {bStudents} {isRTL ? "طالب" : "students"}
                          </span>
                          <span className="bg-indigo-50 text-indigo-800 font-extrabold px-2 py-0.5 rounded-md border border-indigo-100 text-[11px]">
                            {bTeachers} {isRTL ? "معلم" : "teachers"}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            branch.status === "active"
                              ? "bg-emerald-100/70 text-emerald-800"
                              : "bg-stone-100 text-stone-600"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              branch.status === "active" ? "bg-emerald-600" : "bg-stone-400"
                            }`}
                          />
                          {branch.status === "active"
                            ? isRTL
                              ? "نشط"
                              : "Active"
                            : isRTL
                            ? "معطل"
                            : "Inactive"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveBranchId(branch.id);
                              toast.success(
                                isRTL
                                  ? `تم تعيين (${branch.name}) كفرع نشط للوحة التحكم`
                                  : `Switched active branch to (${branch.name})`
                              );
                            }}
                            title={isRTL ? "التبديل كفرع نشط" : "Set as active branch"}
                            className="px-2.5 py-1 rounded-lg bg-stone-100 text-stone-800 font-bold hover:bg-stone-200 text-[11px] transition cursor-pointer"
                          >
                            {isRTL ? "تحديد" : "Select"}
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditDialog(branch)}
                            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition cursor-pointer"
                            title={isRTL ? "تعديل الفرع" : "Edit branch"}
                          >
                            <Edit size={14} />
                          </button>
                          {!branch.is_main && (
                            <button
                              type="button"
                              onClick={() => setBranchToDelete(branch)}
                              className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                              title={isRTL ? "حذف الفرع" : "Delete branch"}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Branch Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              <span>{editingBranch ? (isRTL ? "تعديل بيانات الفرع" : "Edit Branch") : (isRTL ? "إضافة فرع جديد للمدرسة" : "Add New Branch")}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              {isRTL
                ? "سيتم إنشاء كيان مستقل للفرع ورابط بوابة خاص به لتمكين أولياء الأمور والطلاب والمعلمين من الدخول عبره."
                : "Creates an isolated branch entity with its unique gateway link and optional admin credentials."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold">{isRTL ? "اسم الفرع (بالعربية) *" : "Branch Name (Arabic) *"}</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder={isRTL ? "مثال: فرع الرياض، فرع الخرطوم بحري" : "e.g. Riyadh Branch"}
                  className="mt-1 h-9 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs font-bold">{isRTL ? "اسم الفرع (بالإنجليزية)" : "Branch Name (English)"}</Label>
                <Input
                  value={formData.name_en}
                  onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                  placeholder="e.g. Riyadh Branch"
                  className="mt-1 h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold">{isRTL ? "المدينة / المحلية *" : "City / Locality *"}</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => handleCityChange(e.target.value)}
                  placeholder={isRTL ? "مثال: الخرطوم، الرياض، بورتسودان" : "e.g. Khartoum, Riyadh"}
                  className="mt-1 h-9 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs font-bold">{isRTL ? "العنوان التفصيلي" : "Detailed Address"}</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder={isRTL ? "الحي، الشارع، المعلم البارز" : "District, Street"}
                  className="mt-1 h-9 text-xs"
                />
              </div>
            </div>

            {/* Slug & Gateway Link Preview */}
            <div>
              <Label className="text-xs font-bold">{isRTL ? "معرّف الفرع ورابط البوابة (Slug) *" : "Branch Slug *"}</Label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                placeholder="school-branch-city"
                className="mt-1 h-9 font-mono text-xs"
              />
              <div className="mt-1.5 p-2 rounded-lg bg-stone-100 text-[11px] text-stone-600 flex items-center justify-between">
                <span className="font-mono text-stone-800 truncate" dir="ltr">
                  {getBranchUrl(formData.slug || "slug")}
                </span>
                <span className="text-[10px] text-emerald-700 font-bold shrink-0 mr-2">
                  {isRTL ? "رابط البوابة المباشر" : "Gateway URL"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold">{isRTL ? "اسم مدير الفرع" : "Branch Director"}</Label>
                <Input
                  value={formData.director_name}
                  onChange={(e) => setFormData({ ...formData, director_name: e.target.value })}
                  placeholder={isRTL ? "أ. محمد عبد الله" : "Mr. Director Name"}
                  className="mt-1 h-9 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs font-bold">{isRTL ? "هاتف الفرع" : "Branch Phone"}</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+249..."
                  className="mt-1 h-9 text-xs"
                />
              </div>
            </div>

            {/* Admin Credentials Generation (For new branches) */}
            {!editingBranch && (
              <div className="p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-black text-indigo-950">
                    <UserCheck className="w-4 h-4 text-indigo-600" />
                    <span>{isRTL ? "توليد بيانات اعتماد مدير الفرع" : "Generate Branch Admin Credentials"}</span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-indigo-800">
                    <input
                      type="checkbox"
                      checked={formData.createAdmin}
                      onChange={(e) => setFormData({ ...formData, createAdmin: e.target.checked })}
                      className="rounded text-indigo-600"
                    />
                    <span>{isRTL ? "إنشاء حساب المدير الآن" : "Create admin now"}</span>
                  </label>
                </div>

                {formData.createAdmin && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <Label className="text-[11px] font-bold text-stone-700">
                        {isRTL ? "البريد / اسم مستخدم المدير *" : "Admin Username/Email *"}
                      </Label>
                      <Input
                        value={formData.adminEmail}
                        onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                        placeholder="admin@branch.com"
                        className="mt-1 h-8 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] font-bold text-stone-700">
                        {isRTL ? "كلمة المرور المقترحة *" : "Password *"}
                      </Label>
                      <Input
                        value={formData.adminPassword}
                        onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                        className="mt-1 h-8 text-xs bg-white font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Custom Branding & Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold">{isRTL ? "رابط شعار خاص بالفرع (اختياري)" : "Branch Logo URL"}</Label>
                <Input
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                  placeholder="https://.../branch-logo.png"
                  className="mt-1 h-9 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs font-bold">{isRTL ? "رابط خلفية البوابة (اختياري)" : "Gateway Background URL"}</Label>
                <Input
                  value={formData.background_image}
                  onChange={(e) => setFormData({ ...formData, background_image: e.target.value })}
                  placeholder="https://.../branch-bg.jpg"
                  className="mt-1 h-9 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-2 text-xs font-bold text-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_main}
                  onChange={(e) => setFormData({ ...formData, is_main: e.target.checked })}
                  className="rounded text-emerald-600"
                />
                <span>{isRTL ? "تعيين كفرع رئيسي للمدرسة" : "Set as Main Branch"}</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-bold text-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.status === "active"}
                  onChange={(e) => setFormData({ ...formData, status: e.target.checked ? "active" : "inactive" })}
                  className="rounded text-emerald-600"
                />
                <span>{isRTL ? "الفرع نشط وبوابته متاحة" : "Active & Gateway Live"}</span>
              </label>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 transition cursor-pointer"
            >
              {isRTL ? "إلغاء" : "Cancel"}
            </button>
            <button
              type="button"
              disabled={saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition cursor-pointer disabled:opacity-50"
            >
              {saveMutation.isPending
                ? isRTL
                  ? "جارٍ الحفظ..."
                  : "Saving..."
                : isRTL
                ? "حفظ وتفعيل الفرع"
                : "Save & Activate"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(branchToDelete)} onOpenChange={() => setBranchToDelete(null)}>
        <DialogContent className="max-w-md" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="text-base font-black text-rose-600 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              <span>{isRTL ? "تأكيد حذف الفرع" : "Confirm Branch Deletion"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              {isRTL
                ? `هل أنت متأكد من حذف (${branchToDelete?.name})؟ سيتم إيقاف رابط البوابة المخصص له.`
                : `Are you sure you want to delete (${branchToDelete?.name})?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <button
              onClick={() => setBranchToDelete(null)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 transition cursor-pointer"
            >
              {isRTL ? "تراجع" : "Cancel"}
            </button>
            <button
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(branchToDelete.id)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition cursor-pointer disabled:opacity-50"
            >
              {deleteMutation.isPending
                ? isRTL
                  ? "جارٍ الحذف..."
                  : "Deleting..."
                : isRTL
                ? "نعم، حذف الفرع"
                : "Yes, Delete"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
