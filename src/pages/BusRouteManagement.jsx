import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/dbClient";
import { 
  Bus, 
  MapPin, 
  Users, 
  User, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Check, 
  Search,
  ArrowRight,
  Route
} from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import PageHeader from "@/components/shared/PageHeader";
import { 
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all border-2 border-stone-300 bg-white text-stone-800 hover:bg-stone-50 hover:border-stone-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const btnPrimary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all bg-stone-900 text-white hover:bg-black cursor-pointer shadow-lg shadow-stone-200 disabled:opacity-50 disabled:cursor-not-allowed";

export default function BusRouteManagement() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const queryClient = useQueryClient();

  const [newRouteName, setNewRouteName] = useState("");
  const [selectedRoute, setSelectedRoute] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [assigningSupervisorId, setAssigningSupervisorId] = useState("");
  const [assigningDriverId, setAssigningDriverId] = useState("");

  // Fetch Data
  const { data: students = [], refetch: refetchStudents } = useQuery({
    queryKey: ["bus-management-students"],
    queryFn: () => entities.Student.list("-created_at", 500)
  });

  const { data: supervisors = [], refetch: refetchSupervisors } = useQuery({
    queryKey: ["bus-management-supervisors"],
    queryFn: () => entities.Supervisor.list("-created_at", 100)
  });

  const { data: staffMembers = [], refetch: refetchStaff } = useQuery({
    queryKey: ["bus-management-staff"],
    queryFn: () => entities.StaffMember.list("-created_at", { role: "bus_supervisor" }, 100)
  });

  const { data: drivers = [], refetch: refetchDrivers } = useQuery({
    queryKey: ["bus-management-drivers"],
    queryFn: () => entities.BusDriver.list("-created_at", 100)
  });

  // Extract all unique routes from students, supervisors and drivers
  const routes = useMemo(() => {
    const routeSet = new Set();
    students.forEach(s => s.bus_route && routeSet.add(s.bus_route));
    supervisors.forEach(s => s.bus_route && routeSet.add(s.bus_route));
    drivers.forEach(d => d.bus_route && routeSet.add(d.bus_route));
    
    // Add default test routes if set is empty
    if (routeSet.size === 0) {
      routeSet.add(isRTL ? "مسار الشارقة - القاسمية" : "Sharjah - Qasimia Route");
      routeSet.add(isRTL ? "مسار دبي - ديرة" : "Dubai - Deira Route");
      routeSet.add(isRTL ? "مسار عجمان - الروضة" : "Ajman - Rawda Route");
    }
    return Array.from(routeSet);
  }, [students, supervisors, drivers, isRTL]);

  // Create Route (adds to local state / route set by setting a supervisor or driver to it)
  const handleCreateRoute = () => {
    if (!newRouteName.trim()) {
      toast.error(isRTL ? "يرجى كتابة اسم المسار" : "Please enter route name");
      return;
    }
    if (routes.includes(newRouteName.trim())) {
      toast.error(isRTL ? "هذا المسار موجود بالفعل" : "This route already exists");
      return;
    }
    setSelectedRoute(newRouteName.trim());
    setNewRouteName("");
    toast.success(isRTL ? "تم إنشاء المسار! يمكنك الآن إضافة الطلاب والمشرفين له." : "Route created! You can now assign students and supervisors.");
  };

  // Assign Student to Route
  const handleAssignStudent = async (student, route) => {
    try {
      await entities.Student.update(student.id, {
        bus_registered: true,
        bus_route: route
      });
      toast.success(isRTL ? `تمت إضافة ${student.full_name || student.name} إلى المسار` : `Added ${student.full_name || student.name} to route`);
      refetchStudents();
      queryClient.invalidateQueries(["bus-students"]);
    } catch (err) {
      toast.error(isRTL ? "فشل إضافة الطالب" : "Failed to assign student");
    }
  };

  // Remove Student from Bus Route
  const handleRemoveStudent = async (student) => {
    try {
      await entities.Student.update(student.id, {
        bus_registered: false,
        bus_route: null
      });
      toast.success(isRTL ? "تم إزالة الطالب من مسار الحافلة" : "Removed student from bus route");
      refetchStudents();
      queryClient.invalidateQueries(["bus-students"]);
    } catch (err) {
      toast.error(isRTL ? "فشل إزالة الطالب" : "Failed to remove student");
    }
  };

  // Assign Supervisor to Route
  const handleAssignSupervisor = async () => {
    if (!assigningSupervisorId || !selectedRoute) return;
    try {
      const staff = staffMembers.find(s => s.id === assigningSupervisorId);
      if (!staff) return;

      const existingSup = supervisors.find(s => s.email === staff.email);
      if (existingSup) {
        await entities.Supervisor.update(existingSup.id, {
          bus_route: selectedRoute,
          status: "active"
        });
      } else {
        await entities.Supervisor.create({
          full_name: staff.full_name,
          email: staff.email,
          phone: staff.phone,
          portal_password: "Supervisor123", // Default password for new supervisors
          bus_route: selectedRoute,
          status: "active"
        });
      }
      
      toast.success(isRTL ? "تم تعيين مشرف المسار بنجاح" : "Supervisor assigned to route successfully");
      setAssigningSupervisorId("");
      refetchSupervisors();
      refetchStaff();
    } catch (err) {
      toast.error(isRTL ? "فشل تعيين المشرف" : "Failed to assign supervisor");
    }
  };

  // Remove Supervisor from Route
  const handleRemoveSupervisor = async (supId) => {
    try {
      await entities.Supervisor.update(supId, {
        bus_route: null
      });
      toast.success(isRTL ? "تم إزالة المشرف من المسار" : "Removed supervisor from route");
      refetchSupervisors();
    } catch (err) {
      toast.error(isRTL ? "فشل إزالة المشرف" : "Failed to remove supervisor");
    }
  };

  // Assign Driver to Route
  const handleAssignDriver = async () => {
    if (!assigningDriverId || !selectedRoute) return;
    try {
      await entities.BusDriver.update(assigningDriverId, {
        bus_route: selectedRoute,
        status: "active"
      });
      toast.success(isRTL ? "تم تعيين السائق للمسار بنجاح" : "Driver assigned to route successfully");
      setAssigningDriverId("");
      refetchDrivers();
    } catch (err) {
      toast.error(isRTL ? "فشل تعيين السائق" : "Failed to assign driver");
    }
  };

  // Remove Driver from Route
  const handleRemoveDriver = async (driverId) => {
    try {
      await entities.BusDriver.update(driverId, {
        bus_route: null
      });
      toast.success(isRTL ? "تم إزالة السائق من المسار" : "Removed driver from route");
      refetchDrivers();
    } catch (err) {
      toast.error(isRTL ? "فشل إزالة السائق" : "Failed to remove driver");
    }
  };

  // Filter students by search term
  const unassignedStudents = students.filter(s => {
    const matchesSearch = (s.full_name || s.name || "").toLowerCase().includes(studentSearch.toLowerCase()) || 
                          s.student_id?.toString().includes(studentSearch);
    return matchesSearch && !s.bus_route;
  });

  // List staff supervisors who are not assigned to any route in the supervisors table
  const unassignedSupervisors = useMemo(() => {
    return staffMembers.filter(staff => {
      const assignedSup = supervisors.find(s => s.email === staff.email);
      return !assignedSup || !assignedSup.bus_route;
    });
  }, [staffMembers, supervisors]);

  const activeRouteStudents = students.filter(s => s.bus_route === selectedRoute);
  const activeRouteSupervisor = supervisors.find(s => s.bus_route === selectedRoute);
  const activeRouteDriver = drivers.find(d => d.bus_route === selectedRoute);

  return (
    <div className="space-y-8 pb-24 p-6 md:p-10 lg:p-12 max-w-7xl mx-auto" dir={isRTL ? "rtl" : "ltr"}>
      <PageHeader 
        title={isRTL ? "إدارة مسارات الحافلات" : "Bus Routes Management"} 
        subtitle={isRTL ? "إنشاء وتعديل مسارات الحافلات المدرسية، وتوزيع المشرفين والسائقين والطلاب عليها." : "Create and manage school bus routes, and assign supervisors, drivers, and students."}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Routes List & Creation */}
        <div className="lg:col-span-4 space-y-6">
          {/* Create New Route Card */}
          <Card className="p-6 border-none shadow-sm bg-white rounded-[32px] space-y-4">
            <h4 className="font-serif font-black text-stone-900 text-base">{isRTL ? "إنشاء مسار جديد" : "Create New Route"}</h4>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-500">{isRTL ? "اسم المسار" : "Route Name"}</Label>
                <Input 
                  placeholder={isRTL ? "مثال: مسار دبي - الممزر..." : "e.g. Dubai - Mamzar..."} 
                  value={newRouteName}
                  onChange={(e) => setNewRouteName(e.target.value)}
                  className="rounded-xl border-stone-200 text-xs h-11"
                />
              </div>
              <button 
                onClick={handleCreateRoute}
                className={`${btnPrimary} w-full h-11 text-xs`}
              >
                <Plus size={16} />
                {isRTL ? "إنشاء مسار" : "Create Route"}
              </button>
            </div>
          </Card>

          {/* Routes List Card */}
          <Card className="p-6 border-none shadow-sm bg-white rounded-[32px] space-y-4">
            <h4 className="font-serif font-black text-stone-900 text-base">{isRTL ? "مسارات الحافلات النشطة" : "Active Bus Routes"}</h4>
            
            <div className="space-y-2">
              {routes.map((route) => {
                const studentCount = students.filter(s => s.bus_route === route).length;
                const isSelected = selectedRoute === route;
                
                return (
                  <button
                    key={route}
                    onClick={() => setSelectedRoute(route)}
                    className={`w-full p-4 rounded-2xl flex items-center justify-between text-right transition-all border ${
                      isSelected 
                        ? "bg-stone-950 text-white border-transparent shadow-lg" 
                        : "bg-stone-50/50 hover:bg-stone-100 border-stone-100 text-stone-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected ? "bg-white/10 text-white" : "bg-primary/10 text-primary"
                      }`}>
                        <Bus size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-xs leading-snug">{route}</p>
                        <p className={`text-[10px] mt-0.5 ${isSelected ? "text-stone-400" : "text-stone-400"}`}>
                          {isRTL ? `الطلاب المسجلون: ${studentCount}` : `Assigned Students: ${studentCount}`}
                        </p>
                      </div>
                    </div>
                    {isSelected && <ArrowRight size={16} className={isRTL ? "rotate-180 text-amber-500" : "text-amber-500"} />}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right Column: Route Details & Assignments */}
        <div className="lg:col-span-8 space-y-6">
          {selectedRoute ? (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Route Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 border-none shadow-sm bg-white rounded-[32px] flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "المسار المحدد" : "Selected Route"}</p>
                    <p className="text-sm font-black text-stone-900 truncate max-w-[150px]">{selectedRoute}</p>
                  </div>
                </Card>

                <Card className="p-6 border-none shadow-sm bg-white rounded-[32px] flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Users size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "إجمالي الطلاب" : "Total Students"}</p>
                    <p className="text-lg font-black text-stone-900">{activeRouteStudents.length}</p>
                  </div>
                </Card>

                <Card className="p-6 border-none shadow-sm bg-white rounded-[32px] flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{isRTL ? "حالة الطاقم" : "Staff Status"}</p>
                    <p className="text-xs font-bold text-stone-900">
                      {activeRouteSupervisor ? (isRTL ? "المشرف متوفر" : "Supervisor Assigned") : (isRTL ? "لا يوجد مشرف" : "No Supervisor")}
                    </p>
                  </div>
                </Card>
              </div>

              {/* Staff Assignments Card (Supervisor & Driver) */}
              <Card className="p-6 border-none shadow-sm bg-white rounded-[32px] space-y-6">
                <h4 className="font-serif font-black text-stone-900 text-base">{isRTL ? "طاقم عمل الحافلة للمسار" : "Route Staff Assignments"}</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Supervisor Section */}
                  <div className="space-y-4 p-5 rounded-2xl border border-stone-100 bg-stone-50/50">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs font-bold uppercase tracking-wider text-stone-500">{isRTL ? "مشرف الحافلة" : "Supervisor"}</Label>
                      {activeRouteSupervisor && (
                        <button 
                          onClick={() => handleRemoveSupervisor(activeRouteSupervisor.id)}
                          className="text-[10px] font-bold text-rose-500 hover:underline cursor-pointer"
                        >
                          {isRTL ? "إلغاء التعيين" : "Unassign"}
                        </button>
                      )}
                    </div>
                    {activeRouteSupervisor ? (
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          <User size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-stone-900">{activeRouteSupervisor.full_name}</p>
                          <p className="text-[10px] text-stone-400 font-medium">{activeRouteSupervisor.email}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <select 
                          value={assigningSupervisorId}
                          onChange={(e) => setAssigningSupervisorId(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl border border-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                        >
                          <option value="">{isRTL ? "-- اختر مشرفاً لتعيينه --" : "-- Select supervisor to assign --"}</option>
                          {unassignedSupervisors.map(s => (
                            <option key={s.id} value={s.id}>{s.full_name}</option>
                          ))}
                        </select>
                        <button 
                          onClick={handleAssignSupervisor}
                          disabled={!assigningSupervisorId}
                          className={`${btnPrimary} w-full h-9 text-xs`}
                        >
                          {isRTL ? "تعيين المشرف" : "Assign Supervisor"}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Driver Section */}
                  <div className="space-y-4 p-5 rounded-2xl border border-stone-100 bg-stone-50/50">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs font-bold uppercase tracking-wider text-stone-500">{isRTL ? "سائق الحافلة" : "Driver"}</Label>
                      {activeRouteDriver && (
                        <button 
                          onClick={() => handleRemoveDriver(activeRouteDriver.id)}
                          className="text-[10px] font-bold text-rose-500 hover:underline cursor-pointer"
                        >
                          {isRTL ? "إلغاء التعيين" : "Unassign"}
                        </button>
                      )}
                    </div>
                    {activeRouteDriver ? (
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                          <User size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-stone-900">{activeRouteDriver.full_name}</p>
                          <p className="text-[10px] text-stone-400 font-medium">{activeRouteDriver.phone}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <select 
                          value={assigningDriverId}
                          onChange={(e) => setAssigningDriverId(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl border border-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                        >
                          <option value="">{isRTL ? "-- اختر سائقاً لتعيينه --" : "-- Select driver to assign --"}</option>
                          {drivers.filter(d => !d.bus_route).map(d => (
                            <option key={d.id} value={d.id}>{d.full_name}</option>
                          ))}
                        </select>
                        <button 
                          onClick={handleAssignDriver}
                          disabled={!assigningDriverId}
                          className={`${btnPrimary} w-full h-9 text-xs`}
                        >
                          {isRTL ? "تعيين السائق" : "Assign Driver"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Student Assignments Table */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Active Route Students List */}
                <Card className="md:col-span-7 p-6 border-none shadow-sm bg-white rounded-[32px] space-y-4">
                  <h4 className="font-serif font-black text-stone-900 text-base">{isRTL ? `الطلاب المسجلون بالمسار (${activeRouteStudents.length})` : `Assigned Students (${activeRouteStudents.length})`}</h4>
                  
                  {activeRouteStudents.length === 0 ? (
                    <div className="text-center py-12 text-stone-400">
                      <p className="text-xs font-bold">{isRTL ? "لا يوجد طلاب مسجلون في هذا المسار حالياً" : "No students assigned to this route yet"}</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                      {activeRouteStudents.map(student => (
                        <div key={student.id} className="p-3 bg-stone-50 rounded-2xl flex items-center justify-between border border-stone-100">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-stone-200 flex items-center justify-center font-bold text-xs text-stone-500">
                              {(student.full_name || student.name)?.[0]}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-stone-850 leading-tight">{student.full_name || student.name}</p>
                              <p className="text-[9px] text-stone-400">الصف {student.grade} • #{student.student_id}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleRemoveStudent(student)}
                            className="h-8 w-8 rounded-xl border border-stone-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 flex items-center justify-center cursor-pointer transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                {/* Unassigned Students Search & Add */}
                <Card className="md:col-span-5 p-6 border-none shadow-sm bg-white rounded-[32px] space-y-4">
                  <h4 className="font-serif font-black text-stone-900 text-base">{isRTL ? "إضافة طلاب للمسار" : "Add Students to Route"}</h4>
                  
                  <div className="relative">
                    <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-stone-400`} size={14} />
                    <Input 
                      placeholder={isRTL ? "بحث عن طالب غير مسجل..." : "Search unassigned student..."} 
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className={`h-9 ${isRTL ? 'pr-9 pl-3' : 'pl-9 pr-3'} rounded-xl border-stone-200 bg-stone-50 text-xs`}
                    />
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {unassignedStudents.length === 0 ? (
                      <p className="text-[10px] text-center text-stone-400 py-6">{isRTL ? "لا يوجد طلاب يطابقون البحث أو جميع الطلاب مسجلون" : "No unassigned students match your search"}</p>
                    ) : (
                      unassignedStudents.slice(0, 15).map(student => (
                        <div key={student.id} className="p-2.5 rounded-xl hover:bg-stone-50 flex items-center justify-between border border-stone-100/50">
                          <div>
                            <p className="text-xs font-bold text-stone-800">{student.full_name || student.name}</p>
                            <p className="text-[9px] text-stone-400">الصف {student.grade} • #{student.student_id}</p>
                          </div>
                          <button 
                            onClick={() => handleAssignStudent(student, selectedRoute)}
                            className="h-7 px-3 bg-stone-950 text-white rounded-lg text-[10px] font-bold hover:bg-black cursor-pointer flex items-center gap-1"
                          >
                            <Plus size={10} />
                            {isRTL ? "إضافة" : "Add"}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </Card>

              </div>

            </div>
          ) : (
            <Card className="p-12 border-none shadow-sm bg-white rounded-[40px] text-center h-full flex flex-col items-center justify-center opacity-70">
              <Bus size={48} className="text-stone-300 mb-3 animate-pulse" />
              <h4 className="font-serif font-black text-stone-700 text-lg">{isRTL ? "إدارة مسارات الحافلات" : "Bus Routes Management"}</h4>
              <p className="text-xs text-stone-450 mt-1 max-w-sm">{isRTL ? "الرجاء تحديد مسار حافلة من القائمة الجانبية لعرض طاقم العمل، والطلاب المسجلين، أو إضافة طلاب ومسؤولين للمسار." : "Please select a bus route from the sidebar to manage staff, assigned students, or add new records."}</p>
            </Card>
          )}
        </div>

      </div>
    </div>
  );
}
