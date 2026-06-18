import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { entities } from "@/api/dbClient";
import { 
  Bus, 
  MapPin, 
  Users, 
  User,
  ShieldCheck, 
  Navigation, 
  Phone, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Search,
  MessageSquare,
  LifeBuoy,
  Send,
  Plus,
  Trash2,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import BusSupervisorSidebar from "@/components/layout/BusSupervisorSidebar";
import { t } from "@/lib/translations";
import { toast } from "sonner";

const btnOutline = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all border-2 border-stone-300 bg-white text-stone-800 hover:bg-stone-50 hover:border-stone-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const btnPrimary = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all bg-stone-900 text-white hover:bg-black cursor-pointer shadow-lg shadow-stone-200 disabled:opacity-50 disabled:cursor-not-allowed";

// Generic Reusable Modal Component
const Modal = ({ isOpen, onClose, title, children }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          className="bg-white rounded-[32px] shadow-2xl p-6 md:p-8 max-w-lg w-full relative z-10 border border-stone-100 max-h-[90vh] overflow-y-auto"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-serif font-bold text-stone-900">{title}</h3>
            <button 
              onClick={onClose}
              className="h-10 w-10 rounded-full bg-stone-50 flex items-center justify-center text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-all cursor-pointer border border-transparent"
            >
              <XCircle size={20} />
            </button>
          </div>
          {children}
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

export default function BusSupervisorPortal() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const location = useLocation();
  
  // Read hash route from URL to manage tabs
  const activeTab = location.hash.replace("#", "") || "students";
  
  const [searchTerm, setSearchTerm] = useState("");
  const [studentFilter, setStudentFilter] = useState("all");

  // Dialog State Management
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [safetyModalOpen, setSafetyModalOpen] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [parentContactModalOpen, setParentContactModalOpen] = useState(false);
  const [selectedStudentForContact, setSelectedStudentForContact] = useState(null);

  // Form Field States
  const [emergencyType, setEmergencyType] = useState("breakdown");
  const [emergencyNotes, setEmergencyNotes] = useState("");
  const [broadcastText, setBroadcastText] = useState("");
  const [supportText, setSupportText] = useState("");
  
  // Safety Checklist
  const [safetyChecks, setSafetyChecks] = useState({
    inspection: false,
    firstAid: false,
    fireExtinguisher: false,
    seatbelts: false
  });

  // Route Checkpoints & Stop Statuses
  const [arrivedStops, setArrivedStops] = useState(["start"]);

  // Incidents Reporting States & Data
  const [newIncidentTitle, setNewIncidentTitle] = useState("");
  const [newIncidentSeverity, setNewIncidentSeverity] = useState("medium");
  const [newIncidentDetails, setNewIncidentDetails] = useState("");

  // Messaging & Chat Simulation States
  const [newMessageText, setNewMessageText] = useState("");

  const todayStr = new Date().toISOString().split("T")[0];

  // Fetch Queries
  const { data: busDrivers = [] } = useQuery({ 
    queryKey: ["bus-drivers"], 
    queryFn: () => entities.BusDriver.list("-created_at", {}, 10) 
  });

  const { data: supervisors = [] } = useQuery({ 
    queryKey: ["bus-supervisors"], 
    queryFn: () => entities.Supervisor.list("-created_at", {}, 10) 
  });

  const { data: allStudents = [] } = useQuery({ 
    queryKey: ["bus-students"], 
    queryFn: () => entities.Student.list("-created_at", {}, 200) 
  });

  const { data: todayAttendance = [], refetch: refetchAttendance } = useQuery({
    queryKey: ["today-bus-attendance", todayStr],
    queryFn: () => entities.Attendance.list("-created_at", { date: todayStr }, 500)
  });

  const { data: incidentLogs = [], refetch: refetchIncidents } = useQuery({
    queryKey: ["bus-incidents"],
    queryFn: () => entities.AuditLog.list("-created_at", { action: "BUS_INCIDENT" }, 50)
  });

  const incidents = incidentLogs.map(log => {
    let detailsObj = {};
    try { detailsObj = JSON.parse(log.details); } catch(e) {}
    return {
      id: log.id,
      title: detailsObj.title || log.entity_id,
      severity: detailsObj.severity || 'medium',
      time: new Date(log.timestamp).toLocaleTimeString(isRTL ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
      details: detailsObj.details || '',
      status: detailsObj.status || 'pending'
    };
  });

  const { data: chatMessagesRaw = [], refetch: refetchMessages } = useQuery({
    queryKey: ["bus-chat"],
    queryFn: () => entities.AuditLog.list("-created_at", { action: "BUS_CHAT" }, 100)
  });

  const messages = chatMessagesRaw.map(log => ({
    id: log.id,
    sender: log.user_name === (localStorage.getItem("portal_user_name") || "Bus Supervisor") ? "supervisor" : log.user_name,
    text: log.details,
    timestamp: log.timestamp,
    time: new Date(log.timestamp).toLocaleTimeString(isRTL ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })
  })).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const portalUserStr = localStorage.getItem("portal_user");
  const portalUser = portalUserStr ? JSON.parse(portalUserStr) : null;
  const currentSupervisor = supervisors.find(s => s.email === portalUser?.email);
  const supervisorRoute = currentSupervisor?.bus_route;

  // Filters & Counts
  const busStudents = allStudents.filter(s => 
    s.bus_registered && (!supervisorRoute || s.bus_route === supervisorRoute)
  );
  
  const getStudentStatus = (studentId) => {
    const record = todayAttendance.find(a => a.student_id === studentId);
    if (!record) return "pending";
    return record.status === "present" ? "boarded" : "absent";
  };

  const boardedCount = busStudents.filter(s => getStudentStatus(s.id) === "boarded").length;
  const absentCount = todayAttendance.filter(a => a.status === "absent").length;
  const pendingCount = busStudents.length - todayAttendance.length;

  const filteredStudents = busStudents.filter(s => {
    const matchesSearch = (s.full_name || s.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const status = getStudentStatus(s.id);
    if (studentFilter === "boarded") return matchesSearch && status === "boarded";
    if (studentFilter === "absent") return matchesSearch && status === "absent";
    if (studentFilter === "pending") return matchesSearch && status === "pending";
    return matchesSearch;
  });

  const activeDriver = busDrivers.find(d => d.status === "active") || busDrivers[0];
  const capacity = activeDriver ? 40 : 0;
  const totalOnBus = boardedCount;

  // Actions
  const handleBoarded = async (student) => {
    try {
      await entities.Attendance.create({
        student_id: student.id,
        student_name: student.full_name || student.name,
        date: todayStr,
        status: "present",
        type: "bus_in",
        notes: isRTL ? "صعد الحافلة المدرسية" : "Boarded school bus"
      });

      if (student.parent_email) {
        await entities.PortalNotification.create({
          user_id: student.parent_email,
          title: isRTL ? "تحديث صعود الحافلة" : "Bus Boarding Update",
          message: isRTL 
            ? `صعد ابنكم/ابنتكم ${student.full_name || student.name} الحافلة في تمام الساعة ${new Date().toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}`
            : `${student.full_name || student.name} has boarded the school bus at ${new Date().toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'})}`,
          type: "info",
          is_read: false
        });
      }
      toast.success(isRTL ? `تم تسجيل صعود ${student.full_name || student.name}` : `Recorded check-in for ${student.full_name || student.name}`);
      refetchAttendance();
    } catch (err) {
      console.error(err);
      toast.error(isRTL ? "فشل تسجيل الصعود" : "Failed to record check-in");
    }
  };

  const handleLeft = async (student) => {
    try {
      await entities.Attendance.create({
        student_id: student.id,
        student_name: student.full_name || student.name,
        date: todayStr,
        status: "absent",
        type: "bus_out",
        notes: isRTL ? "نزل أو لم يصعد الحافلة المدرسية" : "Left or did not board school bus"
      });

      if (student.parent_email) {
        await entities.PortalNotification.create({
          user_id: student.parent_email,
          title: isRTL ? "تحديث صعود الحافلة" : "Bus Boarding Update",
          message: isRTL 
            ? `نزل/لم يصعد ابنكم/ابنتكم ${student.full_name || student.name} الحافلة في تمام الساعة ${new Date().toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}`
            : `${student.full_name || student.name} left or did not board the school bus at ${new Date().toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'})}`,
          type: "warning",
          is_read: false
        });
      }
      toast.success(isRTL ? `تم تسجيل عدم الصعود لـ ${student.full_name || student.name}` : `Recorded departure for ${student.full_name || student.name}`);
      refetchAttendance();
    } catch (err) {
      console.error(err);
      toast.error(isRTL ? "فشل تسجيل العملية" : "Failed to record departure");
    }
  };

  const handleUndo = async (studentId) => {
    try {
      const record = todayAttendance.find(a => a.student_id === studentId);
      if (record) {
        await entities.Attendance.delete(record.id);
        toast.success(isRTL ? "تم التراجع بنجاح وإعادة الحالة" : "Successfully reset attendance status");
        refetchAttendance();
      }
    } catch (err) {
      console.error(err);
      toast.error(isRTL ? "فشل التراجع عن العملية" : "Failed to reset status");
    }
  };

  const submitEmergency = async () => {
    try {
      await entities.PortalNotification.create({
        user_id: "admin@edutrack.com",
        title: isRTL ? "حالة طوارئ حافلة!" : "BUS EMERGENCY ALERT!",
        message: isRTL 
          ? `طوارئ في الحافلة ${activeDriver?.bus_number || ''}: ${emergencyType === 'breakdown' ? 'عطل فني' : emergencyType === 'traffic' ? 'ازدحام شديد' : emergencyType === 'medical' ? 'حالة صحية طارئة' : 'حادث سير'}. تفاصيل: ${emergencyNotes}`
          : `Emergency on Bus ${activeDriver?.bus_number || ''}: ${emergencyType}. Details: ${emergencyNotes}`,
        type: "error",
        is_read: false
      });
      
      toast.success(isRTL ? "تم إرسال بلاغ الطوارئ للجهة المختصة" : "Emergency alert dispatched successfully");
      setEmergencyModalOpen(false);
      setEmergencyNotes("");
    } catch (err) {
      console.error(err);
      toast.error(isRTL ? "فشل إرسال البلاغ" : "Failed to dispatch emergency alert");
    }
  };

  const submitBroadcast = async () => {
    if (!broadcastText.trim()) return;
    try {
      const parentEmails = [...new Set(busStudents.map(s => s.parent_email).filter(Boolean))];
      
      for (const email of parentEmails) {
        await entities.PortalNotification.create({
          user_id: email,
          title: isRTL ? "تنبيه من مشرف الحافلة" : "Alert from Bus Supervisor",
          message: broadcastText,
          type: "info",
          is_read: false
        });
      }
      
      toast.success(isRTL ? `تم إرسال التعميم إلى ${parentEmails.length} من أولياء الأمور` : `Broadcasted message to ${parentEmails.length} parents`);
      setBroadcastModalOpen(false);
      setBroadcastText("");
    } catch (err) {
      console.error(err);
      toast.error(isRTL ? "فشل إرسال التعميم" : "Failed to send broadcast");
    }
  };

  const submitSafetyReport = async () => {
    try {
      await entities.AuditLog.create({
        timestamp: new Date().toISOString(),
        user_name: localStorage.getItem("portal_user_name") || "Bus Supervisor",
        action: "SAFETY_REPORT",
        entity_type: "Bus",
        entity_id: activeDriver?.bus_number || "Unknown",
        details: JSON.stringify(safetyChecks)
      });
      toast.success(isRTL ? "تم تقديم تقرير السلامة اليومي بنجاح" : "Daily safety report submitted successfully");
      setSafetyModalOpen(false);
    } catch (err) {
      toast.error(isRTL ? "فشل تقديم التقرير" : "Failed to submit report");
    }
  };

  const submitSupport = async () => {
    if (!supportText.trim()) return;
    try {
      const supervisorName = localStorage.getItem("portal_user_name") || (isRTL ? "مشرف الحافلة" : "Bus Supervisor");
      
      // 1. Create a support ticket in AuditLog database (for Admin / مدير النظام)
      await entities.AuditLog.create({
        timestamp: new Date().toISOString(),
        user_name: supervisorName,
        action: "CREATE_SUPPORT_TICKET",
        entity_type: "SupportTicket",
        entity_id: "ticket-" + Date.now(),
        details: isRTL 
          ? `طلب دعم فني من مشرف الحافلة: ${supportText}`
          : `Technical support ticket submitted by Bus Supervisor: ${supportText}`
      });

      // 2. Create a notification for Admin (for Admin Portal alerts)
      await entities.PortalNotification.create({
        user_id: "admin@edutrack.com",
        title: isRTL ? "طلب دعم فني جديد" : "New Technical Support Request",
        message: isRTL 
          ? `طلب دعم فني من ${supervisorName}: ${supportText}`
          : `Technical support requested by ${supervisorName}: ${supportText}`,
        type: "warning",
        is_read: false
      });

      // 3. Create a staff request record in localStorage (for Staff Portal / صفحة الدعم الفني)
      const savedRequests = JSON.parse(localStorage.getItem("staff_requests") || "[]");
      const newRequest = {
        id: "req-support-" + Date.now(),
        employeeName: supervisorName,
        role: isRTL ? "مشرف حافلة" : "Bus Supervisor",
        type: "SUPPORT",
        date: new Date().toISOString().split("T")[0],
        duration: isRTL ? "فوري" : "Immediate",
        reason: supportText,
        status: "PENDING",
        createdAt: new Date().toISOString().split("T")[0]
      };
      localStorage.setItem("staff_requests", JSON.stringify([newRequest, ...savedRequests]));

      // 4. Trigger storage event to notify other open tabs
      window.dispatchEvent(new Event("storage"));

      toast.success(isRTL ? "تم إرسال تذكرة الدعم الفني بنجاح" : "Technical support ticket created successfully");
      setSupportModalOpen(false);
      setSupportText("");
    } catch (err) {
      console.error(err);
      toast.error(isRTL ? "فشل إرسال طلب الدعم" : "Failed to send support ticket");
    }
  };

  const handleSendMessage = async () => {
    if (!newMessageText.trim()) return;
    try {
      await entities.AuditLog.create({
        timestamp: new Date().toISOString(),
        user_name: localStorage.getItem("portal_user_name") || "Bus Supervisor",
        action: "BUS_CHAT",
        entity_type: "Bus",
        entity_id: activeDriver?.bus_number || "Unknown",
        details: newMessageText
      });
      setNewMessageText("");
      refetchMessages();
    } catch (err) {
      toast.error(isRTL ? "فشل إرسال الرسالة" : "Failed to send message");
    }
  };

  const handleCreateIncident = async () => {
    if (!newIncidentTitle.trim()) return;
    try {
      await entities.AuditLog.create({
        timestamp: new Date().toISOString(),
        user_name: localStorage.getItem("portal_user_name") || "Bus Supervisor",
        action: "BUS_INCIDENT",
        entity_type: "Bus",
        entity_id: activeDriver?.bus_number || "Unknown",
        details: JSON.stringify({
          title: newIncidentTitle,
          severity: newIncidentSeverity,
          details: newIncidentDetails,
          status: "pending"
        })
      });
      toast.success(isRTL ? "تم تسجيل الحادث بنجاح وجاري المتابعة" : "Incident logged successfully and pending review");
      setNewIncidentTitle("");
      setNewIncidentDetails("");
      refetchIncidents();
    } catch (err) {
      toast.error(isRTL ? "فشل تسجيل الحادث" : "Failed to log incident");
    }
  };

  const handleToggleStop = (stopId) => {
    if (arrivedStops.includes(stopId)) {
      if (stopId === "start") return;
      setArrivedStops(prev => prev.filter(id => id !== stopId));
      toast.success(isRTL ? "تم إلغاء حالة الوصول للمحطة" : "Cancelled stop checkpoint");
    } else {
      setArrivedStops(prev => [...prev, stopId]);
      toast.success(isRTL ? "تم تسجيل الوصول للمحطة" : "Stop checkpoint marked as arrived");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  return (
    <div className={`min-h-screen bg-stone-50 text-stone-900 ${isRTL ? 'font-cairo' : 'font-sans'}`} dir={isRTL ? "rtl" : "ltr"}>
      <BusSupervisorSidebar />
      <main className={`transition-all duration-300 min-h-screen pt-16 lg:pt-0 ${isRTL ? "lg:mr-64" : "lg:ml-64"}`}>
        <div className="space-y-8 pb-24 p-6 md:p-10 lg:p-12 max-w-7xl mx-auto">
          
          {/* High-Visibility Header */}
          <section className="bg-stone-900 text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-6">
                <div className="h-20 w-20 rounded-3xl bg-amber-500 text-stone-900 flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <Bus size={44} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-3xl font-serif font-black">{activeDriver?.bus_number || (isRTL ? "حافلة" : "Bus")}</h2>
                    <Badge className="bg-emerald-500 text-white border-none rounded-full h-5 text-[8px] font-black uppercase">
                      {isRTL ? "في الطريق" : "En Route"}
                    </Badge>
                  </div>
                  <p className="text-stone-400 font-bold tracking-widest text-sm uppercase">
                    {supervisorRoute || activeDriver?.bus_route || (isRTL ? "مسار غير محدد" : "No route assigned")}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4 w-full md:w-auto">
                <a 
                  href="#map" 
                  className={`${btnOutline} flex-1 md:flex-none border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-2xl h-14 px-8 flex items-center justify-center`}
                >
                  <Navigation size={20} className="text-amber-500" />
                  {isRTL ? "عرض الخريطة" : "Map View"}
                </a>
                <button 
                  onClick={() => setEmergencyModalOpen(true)}
                  className="flex-1 md:flex-none bg-rose-600 hover:bg-rose-700 text-white rounded-2xl h-14 px-8 font-bold gap-2 shadow-xl shadow-rose-900/20 cursor-pointer flex items-center justify-center"
                >
                  <AlertTriangle size={20} />
                  {isRTL ? "طوارئ" : "Emergency"}
                </button>
              </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: isRTL ? "السائق" : "Driver", value: activeDriver?.full_name || (isRTL ? "غير محدد" : "N/A"), icon: User },
                { label: isRTL ? "الركاب" : "Passengers", value: `${totalOnBus}/${capacity}`, icon: Users },
                { label: isRTL ? "المشرفون" : "Supervisors", value: supervisors.filter(s => s.status === "active").length, icon: ShieldCheck },
                { label: isRTL ? "الحالة" : "Status", value: isRTL ? "نشط" : "Active", icon: CheckCircle2 },
              ].map((stat, i) => (
                <div key={i} className="flex flex-col">
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">{stat.label}</span>
                  <span className="font-bold text-white flex items-center gap-2">
                    <stat.icon size={14} className="text-amber-500" />
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Decorative Background */}
            <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
          </section>

          {/* Main Interaction Area */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Dynamic View Panel based on Active Tab */}
            <section className="lg:col-span-8 space-y-6">
              
              {activeTab === "students" && (
                <div className="space-y-6">
                  <div className="flex flex-col gap-6 bg-white p-6 rounded-[32px] border border-stone-100 shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-stone-100">
                      <div className="space-y-1">
                        <h3 className="text-2xl font-serif font-black text-stone-900">{isRTL ? "قائمة ركوب الطلاب" : "Student Boarding"}</h3>
                        <p className="text-stone-450 text-xs font-semibold">{isRTL ? "تتبع حالة صعود ونزول الطلاب من الحافلة اليوم." : "Track student boarding and departure status for today."}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Filter Tabs Container with hidden scrollbar */}
                      <div 
                        className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 max-w-full"
                        style={{
                          scrollbarWidth: 'none',
                          msOverflowStyle: 'none',
                          WebkitOverflowScrolling: 'touch'
                        }}
                      >
                        <style dangerouslySetInnerHTML={{__html: `
                          .hide-scrollbar::-webkit-scrollbar { display: none; }
                        `}} />
                        <div className="flex items-center gap-1.5 hide-scrollbar overflow-x-auto">
                          {[
                            { id: "all", label: isRTL ? "الكل" : "All", count: busStudents.length },
                            { id: "boarded", label: isRTL ? "صعدوا" : "Boarded", count: boardedCount },
                            { id: "pending", label: isRTL ? "بانتظارهم" : "Pending", count: pendingCount },
                            { id: "absent", label: isRTL ? "غياب" : "Absent", count: absentCount }
                          ].map((tab) => (
                            <button
                              key={tab.id}
                              onClick={() => setStudentFilter(tab.id)}
                              className={`rounded-2xl h-11 px-4 font-bold text-xs gap-1.5 cursor-pointer flex items-center shrink-0 border transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                                studentFilter === tab.id 
                                  ? 'bg-stone-900 text-white shadow-md border-transparent' 
                                  : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                              }`}
                            >
                              {tab.label}
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-black transition-colors ${
                                studentFilter === tab.id ? 'bg-white text-stone-900' : 'bg-stone-100 text-stone-500'
                              }`}>
                                {tab.count}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Search Bar with interactive style */}
                      <div className="relative group w-full lg:w-64 shrink-0">
                        <Search className={`absolute ${isRTL ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-stone-900 transition-colors`} size={16} />
                        <Input 
                          placeholder={isRTL ? "بحث عن طالب..." : "Search student..."} 
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className={`h-11 ${isRTL ? 'pr-11 pl-4' : 'pl-11 pr-4'} rounded-2xl border-stone-200 bg-white w-full text-xs font-semibold focus-visible:ring-2 focus-visible:ring-stone-900/10 focus-visible:border-stone-900 shadow-sm transition-all`}
                        />
                      </div>
                    </div>
                  </div>

                  <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-4"
                  >
                    {filteredStudents.length === 0 ? (
                      <div className="text-center py-12 text-stone-400 bg-white rounded-[32px] p-8 border border-stone-100 shadow-sm">
                        <Bus size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="font-bold">{isRTL ? "لا يوجد طلاب يطابقون خيارات البحث" : "No students match your filter"}</p>
                      </div>
                    ) : filteredStudents.map((student) => {
                      const status = getStudentStatus(student.id);
                      return (
                        <motion.div
                          key={student.id}
                          variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                          className="group"
                        >
                          <Card className={`p-4 border-2 transition-all duration-300 rounded-[32px] flex items-center justify-between ${
                            status === "boarded" 
                              ? "border-emerald-500/20 bg-emerald-50/10 shadow-sm" 
                              : status === "absent"
                                ? "border-rose-500/20 bg-rose-50/10 shadow-sm"
                                : "border-transparent bg-white shadow-sm hover:shadow-xl"
                          }`}>
                            <div className="flex items-center gap-4">
                              <div className="h-16 w-16 rounded-[24px] bg-stone-50 p-1 relative shrink-0">
                                <div className="h-full w-full rounded-[20px] bg-stone-100 flex items-center justify-center text-stone-400 font-black text-xl">
                                  {(student.full_name || student.name)?.[0]}
                                </div>
                                {status === "boarded" && (
                                  <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 border-4 border-white flex items-center justify-center text-white text-[8px] font-bold">✓</div>
                                )}
                                {status === "absent" && (
                                  <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-rose-500 border-4 border-white flex items-center justify-center text-white text-[8px] font-bold">✗</div>
                                )}
                              </div>
                              <div>
                                <h4 className="font-bold text-stone-900 leading-tight mb-1 flex items-center gap-2">
                                  {student.full_name || student.name}
                                  {status === "boarded" && (
                                    <Badge className="bg-emerald-500 text-white border-none rounded-full text-[9px] px-2 py-0.5">
                                      {isRTL ? "صعد" : "Boarded"}
                                    </Badge>
                                  )}
                                  {status === "absent" && (
                                    <Badge className="bg-rose-500 text-white border-none rounded-full text-[9px] px-2 py-0.5">
                                      {isRTL ? "لم يصعد" : "Absent"}
                                    </Badge>
                                  )}
                                </h4>
                                <div className="flex items-center gap-3">
                                  <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{student.id}</span>
                                  <Badge className="bg-stone-50 text-stone-500 border-none text-[8px] font-black px-2 py-0.5 rounded-md">
                                    {isRTL ? "الصف" : "Grade"} {student.grade}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => {
                                  setSelectedStudentForContact(student);
                                  setParentContactModalOpen(true);
                                }}
                                className={`${btnOutline} rounded-2xl gap-1 text-xs h-12 px-4`}
                              >
                                <Phone size={14} />
                                {t("common.call", language)}
                              </button>
                              
                              <div className="h-10 w-[1px] bg-stone-100 mx-1" />
                              
                              {status === "pending" ? (
                                <>
                                  <button 
                                    onClick={() => handleBoarded(student)}
                                    className="h-12 px-6 rounded-[20px] bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/20 gap-2 cursor-pointer flex items-center"
                                  >
                                    <CheckCircle2 size={16} />
                                    {isRTL ? "صعد" : "Boarded"}
                                  </button>
                                  <button 
                                    onClick={() => handleLeft(student)}
                                    className={`${btnOutline} h-12 w-12 rounded-[20px] border-stone-100 text-stone-300 hover:text-rose-500 hover:bg-rose-50 flex items-center justify-center`}
                                  >
                                    <XCircle size={20} />
                                  </button>
                                </>
                              ) : (
                                <button 
                                  onClick={() => handleUndo(student.id)}
                                  className="h-12 px-6 rounded-[20px] bg-stone-100 hover:bg-stone-200 text-stone-600 border border-stone-200 font-bold flex items-center justify-center cursor-pointer"
                                >
                                  {isRTL ? "تراجع" : "Undo"}
                                </button>
                              )}
                            </div>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </div>
              )}

              {/* Route checkpoints management tab */}
              {activeTab === "route" && (
                <div className="space-y-6 bg-white p-8 rounded-[40px] border border-stone-100 shadow-sm">
                  <h3 className="text-2xl font-serif font-bold text-stone-900">{isRTL ? "إدارة نقاط مسار الرحلة" : "Route Checkpoints Management"}</h3>
                  <p className="text-sm text-stone-500">{isRTL ? "حدد وحث نقاط التوقف فور وصول الحافلة إليها لمزامنة الرحلة مع الإدارة والآباء:" : "Mark stops as reached as the bus proceeds along its route to synchronize status:"}</p>
                  
                  <div className="space-y-4 mt-6">
                    {[
                      { id: "start", label: isRTL ? "بداية الرحلة (نقطة الانطلاق)" : "Departure Station (Start)", description: isRTL ? "التحرك من نقطة تجمع الحافلات" : "Leaving the main station", time: "٠٩:٤٥ ص" },
                      { id: "stop1", label: isRTL ? "محطة الحي المالي" : "Financial District Stop", description: isRTL ? "نقطة تجمع طلاب الحي التجاري والمالي" : "Pickup point for students in the financial zone", time: "١٠:٠٠ ص" },
                      { id: "stop2", label: isRTL ? "ميدان الاتحاد" : "Union Square Stop", description: isRTL ? "نقطة التجمع الرئيسية الثانية" : "Main secondary gathering stop", time: "١٠:١٥ ص" },
                      { id: "end", label: isRTL ? "وصول المدرسة (المحطة الأخيرة)" : "School Campus (Final Stop)", description: isRTL ? "إنزال الطلاب بأمان داخل المدرسة" : "Drop off students safely at school gate", time: "١٠:٣٠ ص" },
                    ].map((step, idx) => {
                      const isReached = arrivedStops.includes(step.id);
                      return (
                        <div key={step.id} className={`p-5 rounded-3xl border-2 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all duration-300 ${
                          isReached ? "border-emerald-500/20 bg-emerald-50/10" : "border-stone-100 bg-white"
                        }`}>
                          <div className="flex gap-4">
                            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${
                              isReached ? "bg-emerald-500 text-white" : "bg-stone-50 text-stone-400"
                            }`}>
                              {idx + 1}
                            </div>
                            <div>
                              <h5 className="font-bold text-stone-900 flex items-center gap-2">
                                {step.label}
                                {isReached && <Badge className="bg-emerald-500 text-white border-none rounded-full text-[8px] font-bold">✓ {isRTL ? "تم الوصول" : "Arrived"}</Badge>}
                              </h5>
                              <p className="text-xs text-stone-400 font-semibold mt-0.5">{step.description}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-stone-100">
                            <span className="text-xs text-stone-400 font-bold">{step.time}</span>
                            <button
                              onClick={() => handleToggleStop(step.id)}
                              className={`h-11 px-5 rounded-xl font-bold text-xs gap-1.5 cursor-pointer transition-all flex items-center ${
                                isReached 
                                  ? 'bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100' 
                                  : 'bg-stone-900 text-white hover:bg-black shadow-md'
                              }`}
                            >
                              {isReached ? (isRTL ? "تراجع" : "Undo") : (isRTL ? "تأكيد الوصول" : "Confirm Arrival")}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Animated Map View Tab */}
              {activeTab === "map" && (
                <div className="space-y-6">
                  <Card className="p-8 border-none bg-white shadow-sm rounded-[40px] overflow-hidden relative">
                    <h3 className="text-2xl font-serif font-bold text-stone-900 mb-6">{isRTL ? "المسار المباشر للحافلة" : "Live Bus Map Tracking"}</h3>
                    
                    <div className="relative bg-stone-950 rounded-[30px] h-96 overflow-hidden border border-stone-800 flex items-center justify-center">
                      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }} />
                      
                      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                        <path d="M 50,200 L 750,200" stroke="#334155" strokeWidth="20" strokeLinecap="round" />
                        <path d="M 400,50 L 400,350" stroke="#334155" strokeWidth="20" strokeLinecap="round" />
                        <path d="M 150,50 L 650,350" stroke="#1e293b" strokeWidth="10" strokeLinecap="round" />
                        
                        <path 
                          d="M 100,200 Q 250,120 400,200 T 700,200" 
                          fill="transparent" 
                          stroke="#f59e0b" 
                          strokeWidth="4" 
                          strokeDasharray="8,8" 
                          strokeLinecap="round"
                        />
                        
                        <circle cx="100" cy="200" r="10" fill="#10b981" stroke="#fff" strokeWidth="3" />
                        <circle cx="270" cy="155" r="10" fill={arrivedStops.includes("stop1") ? "#10b981" : "#f59e0b"} stroke="#fff" strokeWidth="3" className="animate-pulse" />
                        <circle cx="430" cy="210" r="10" fill={arrivedStops.includes("stop2") ? "#10b981" : "#64748b"} stroke="#fff" strokeWidth="3" />
                        <circle cx="700" cy="200" r="10" fill={arrivedStops.includes("end") ? "#10b981" : "#64748b"} stroke="#fff" strokeWidth="3" />
                      </svg>
                      
                      <motion.div 
                        className="absolute h-12 w-12 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/50 z-20 text-stone-900"
                        animate={{
                          x: arrivedStops.includes("end") ? 300 : arrivedStops.includes("stop2") ? 130 : arrivedStops.includes("stop1") ? -130 : -300,
                          y: arrivedStops.includes("end") ? 0 : arrivedStops.includes("stop2") ? 10 : arrivedStops.includes("stop1") ? -45 : 0
                        }}
                        transition={{ type: "spring", stiffness: 50 }}
                      >
                        <Bus size={24} />
                      </motion.div>
                      
                      <div className="absolute bottom-6 left-6 right-6 bg-stone-900/90 backdrop-blur-md border border-white/5 rounded-2xl p-4 flex justify-between items-center text-white">
                        <div>
                          <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mb-0.5">{isRTL ? "المحطة الحالية" : "Current Stop"}</p>
                          <h5 className="font-bold text-sm">
                            {arrivedStops.includes("end") 
                              ? (isRTL ? "المدرسة (نهاية الرحلة)" : "School (End of Trip)") 
                              : arrivedStops.includes("stop2") 
                                ? (isRTL ? "ميدان الاتحاد" : "Union Square") 
                                : arrivedStops.includes("stop1") 
                                  ? (isRTL ? "محطة الحي المالي" : "Financial District") 
                                  : (isRTL ? "بداية الرحلة" : "Start of Trip")}
                          </h5>
                        </div>
                        
                        <div className="flex gap-2 text-xs">
                          <Badge className="bg-amber-500 text-stone-900 border-none font-bold">
                            {isRTL ? "السرعة: ٣٥ كم/س" : "Speed: 35 km/h"}
                          </Badge>
                          <Badge className="bg-emerald-500 text-white border-none font-bold">
                            {isRTL ? "حالة الحركة: طبيعية" : "Traffic: Normal"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {/* Incidents management and report tab */}
              {activeTab === "incidents" && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                  {/* Report form */}
                  <Card className="md:col-span-5 p-6 border-none bg-white shadow-sm rounded-[32px] space-y-6">
                    <h4 className="font-bold text-stone-900">{isRTL ? "تسجيل حادث جديد" : "Log New Incident"}</h4>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest block mb-2">{isRTL ? "عنوان الحادث" : "Incident Title"}</label>
                        <Input 
                          placeholder={isRTL ? "مثال: تأخير بسبب حادث..." : "e.g. Traffic Jam..."} 
                          value={newIncidentTitle}
                          onChange={(e) => setNewIncidentTitle(e.target.value)}
                          className="h-11 rounded-xl"
                        />
                      </div>
                      
                      <div>
                        <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest block mb-2">{isRTL ? "مستوى الخطورة" : "Severity Level"}</label>
                        <select 
                          value={newIncidentSeverity}
                          onChange={(e) => setNewIncidentSeverity(e.target.value)}
                          className="w-full h-11 px-4 rounded-xl border border-stone-200 focus:outline-none focus:border-stone-900 bg-white"
                        >
                          <option value="low">{isRTL ? "منخفضة" : "Low"}</option>
                          <option value="medium">{isRTL ? "متوسطة" : "Medium"}</option>
                          <option value="critical">{isRTL ? "حرجة" : "Critical"}</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest block mb-2">{isRTL ? "تفاصيل إضافية" : "Details"}</label>
                        <textarea 
                          placeholder={isRTL ? "اكتب تفاصيل الحادث هنا..." : "Provide description..."}
                          value={newIncidentDetails}
                          onChange={(e) => setNewIncidentDetails(e.target.value)}
                          className="w-full h-24 p-3 rounded-xl border border-stone-200 focus:outline-none focus:border-stone-900 resize-none"
                        />
                      </div>
                      
                      <button 
                        onClick={handleCreateIncident}
                        className="w-full h-12 bg-stone-900 text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-black cursor-pointer shadow-md"
                      >
                        <Plus size={18} />
                        {isRTL ? "تسجيل الحادث" : "Log Incident"}
                      </button>
                    </div>
                  </Card>

                  {/* Incidents logs */}
                  <div className="md:col-span-7 space-y-4">
                    <h4 className="font-bold text-stone-900">{isRTL ? "سجل الحوادث والتقارير" : "Logged Incidents"}</h4>
                    
                    {incidents.map((inc) => (
                      <Card key={inc.id} className="p-5 border-none bg-white shadow-sm rounded-3xl space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-bold text-stone-900">{inc.title}</h5>
                            <span className="text-[10px] text-stone-400 font-bold">{inc.time}</span>
                          </div>
                          <Badge className={`${
                            inc.severity === 'critical' ? 'bg-rose-100 text-rose-600' : inc.severity === 'medium' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'
                          } border-none font-bold rounded-lg text-[9px]`}>
                            {inc.severity.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-xs text-stone-500 font-semibold">{inc.details}</p>
                        <div className="pt-2 border-t border-stone-50 flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                          <span className="text-stone-300">{isRTL ? "الحالة:" : "Status:"}</span>
                          <span className={inc.status === "resolved" ? "text-emerald-500" : "text-amber-500 animate-pulse"}>
                            {inc.status === "resolved" ? (isRTL ? "محلولة" : "Resolved") : (isRTL ? "تحت المراجعة" : "Under Review")}
                          </span>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat & Messages tab */}
              {activeTab === "messages" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    {/* Broadcast parents messages logs */}
                    <Card className="md:col-span-4 p-6 border-none bg-white shadow-sm rounded-[32px] space-y-4">
                      <h4 className="font-bold text-stone-900">{isRTL ? "أدوات التواصل" : "Broadcast Panel"}</h4>
                      <button 
                        onClick={() => setBroadcastModalOpen(true)}
                        className="w-full h-14 bg-stone-900 text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-black shadow-md cursor-pointer"
                      >
                        <MessageSquare size={18} className="text-amber-500" />
                        {isRTL ? "إرسال تعميم للكل" : "Broadcast Parents"}
                      </button>
                      <div className="border-t border-stone-100 pt-4 space-y-3">
                        <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">{isRTL ? "تاريخ التعميمات الأخيرة" : "Recent Broadcasts"}</p>
                        <div className="p-3 bg-stone-50 rounded-2xl text-xs space-y-1">
                          <p className="font-bold text-stone-700">{isRTL ? "الحافلة متأخرة 10 دقائق" : "Bus 10 mins late"}</p>
                          <span className="text-[9px] text-stone-400">اليوم، 09:30 ص</span>
                        </div>
                      </div>
                    </Card>

                    {/* Simulated live chat window */}
                    <Card className="md:col-span-8 p-6 border-none bg-white shadow-sm rounded-[32px] flex flex-col h-[400px]">
                      <div className="pb-4 border-b border-stone-100 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 font-black">✉</div>
                        <div>
                          <h4 className="font-bold text-stone-900 text-sm">{isRTL ? "الدردشة التفاعلية مع الإدارة والآباء" : "Live Chat (Admin & Parents)"}</h4>
                          <span className="text-[9px] text-emerald-500 font-bold tracking-widest uppercase">{isRTL ? "متصل الآن" : "Online"}</span>
                        </div>
                      </div>

                      {/* Chat bubble screen */}
                      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-2 scrollbar-thin">
                        {messages.map((msg) => {
                          const isSupervisor = msg.sender === "supervisor";
                          return (
                            <div key={msg.id} className={`flex ${isSupervisor ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[80%] rounded-[24px] p-4 text-xs font-semibold ${
                                isSupervisor ? 'bg-stone-900 text-white rounded-br-none' : 'bg-stone-100 text-stone-900 rounded-bl-none'
                              }`}>
                                <div className="flex justify-between items-center gap-6 mb-1 text-[9px] opacity-65 font-black uppercase">
                                  <span>{msg.sender === "supervisor" ? (isRTL ? "أنت (المشرف)" : "You (Supervisor)") : msg.sender}</span>
                                  <span>{msg.time}</span>
                                </div>
                                <p className="leading-relaxed">{msg.text}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Input send bar */}
                      <div className="pt-4 border-t border-stone-100 flex gap-2">
                        <Input 
                          placeholder={isRTL ? "اكتب رسالتك هنا..." : "Type a message..."}
                          value={newMessageText}
                          onChange={(e) => setNewMessageText(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                          className="h-12 rounded-xl flex-1"
                        />
                        <button 
                          onClick={handleSendMessage}
                          className="h-12 w-12 rounded-xl bg-stone-950 text-white flex items-center justify-center hover:bg-black transition-all cursor-pointer shrink-0"
                        >
                          <Send size={18} />
                        </button>
                      </div>
                    </Card>
                  </div>
                </div>
              )}

            </section>

            {/* Action Sidebar */}
            <aside className="lg:col-span-4 space-y-6">
              
              <Card className="p-8 border-none shadow-sm bg-white rounded-[40px]">
                <h4 className="font-bold text-stone-900 mb-6">{isRTL ? "أدوات المشرف" : "Supervisor Tools"}</h4>
                <div className="space-y-4">
                  <button 
                    onClick={() => setBroadcastModalOpen(true)}
                    className="w-full h-16 rounded-[28px] bg-stone-900 hover:bg-black text-white font-bold gap-3 text-lg cursor-pointer flex items-center justify-center transition-all shadow-lg"
                  >
                    <MessageSquare size={24} className="text-amber-500" />
                    {isRTL ? "إرسال تعميم للآباء" : "Broadcast to Parents"}
                  </button>
                  <button 
                    onClick={() => setSafetyModalOpen(true)}
                    className={`${btnOutline} w-full h-16 rounded-[28px] text-stone-600 hover:bg-stone-50 transition-all`}
                  >
                    <ShieldCheck size={24} className="text-emerald-500" />
                    {isRTL ? "تقرير السلامة" : "Safety Report"}
                  </button>
                  <button 
                    onClick={() => setSupportModalOpen(true)}
                    className={`${btnOutline} w-full h-16 rounded-[28px] text-stone-600 hover:bg-stone-50 transition-all`}
                  >
                    <LifeBuoy size={24} className="text-blue-500" />
                    {isRTL ? "دعم فني" : "Technical Support"}
                  </button>
                </div>
              </Card>

              {/* Shared Live Route Summary */}
              <Card className="p-8 border-none shadow-sm bg-gradient-to-br from-amber-50 to-orange-50 rounded-[40px] border border-amber-100/50">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center">
                    <MapPin size={20} />
                  </div>
                  <h4 className="font-black text-amber-900">{isRTL ? "خلاصة الرحلة" : "Route Summary"}</h4>
                </div>
                
                <div className="space-y-6">
                  {[
                    { id: "start", time: "٠٩:٤٥ ص", action: isRTL ? "بداية الرحلة" : "Start of Trip" },
                    { id: "stop1", time: "١٠:٠٠ ص", action: isRTL ? "محطة الحي المالي" : "Financial District Stop" },
                    { id: "stop2", time: "١٠:١٥ ص", action: isRTL ? "ميدان الاتحاد" : "Union Square Stop" },
                    { id: "end", time: "١٠:٣٠ ص", action: isRTL ? "وصول المدرسة" : "School Arrival" },
                  ].map((step, i) => {
                    const isReached = arrivedStops.includes(step.id);
                    const isCurrent = arrivedStops[arrivedStops.length - 1] === step.id;
                    const status = isReached ? "complete" : isCurrent ? "current" : "pending";
                    
                    return (
                      <div key={i} className="flex gap-4 relative">
                        {i !== 3 && <div className={`absolute top-6 ${isRTL ? 'right-2.5' : 'left-2.5'} w-0.5 h-full ${isReached ? 'bg-amber-500' : 'bg-stone-200'}`} />}
                        <div className={`h-5 w-5 rounded-full z-10 mt-1 border-4 ${
                          status === 'complete' ? 'bg-amber-500 border-amber-100' : status === 'current' ? 'bg-white border-amber-500 animate-pulse' : 'bg-white border-stone-200'
                        }`} />
                        <div>
                          <p className={`text-[10px] font-black uppercase tracking-widest ${status === 'pending' ? 'text-stone-400' : 'text-amber-600'}`}>{step.time}</p>
                          <p className={`text-sm font-bold ${status === 'pending' ? 'text-stone-400' : 'text-stone-800'}`}>{step.action}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </aside>
          </div>
        </div>
      </main>

      {/* Dialog Modals Declarations */}
      {/* 1. Emergency Alert Modal */}
      <Modal 
        isOpen={emergencyModalOpen} 
        onClose={() => setEmergencyModalOpen(false)} 
        title={isRTL ? "إعلان حالة طوارئ" : "Report Emergency"}
      >
        <div className="space-y-6">
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-3xl flex gap-3 text-rose-800 text-sm">
            <AlertTriangle className="shrink-0" size={20} />
            <p>{isRTL ? "تنبيه: سيؤدي هذا الإجراء لإرسال إشعارات فورية للإدارة وأولياء الأمور للتدخل السريع." : "Warning: This will send immediate notifications to the administration and parents."}</p>
          </div>
          <div>
            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest block mb-2">{isRTL ? "نوع الطوارئ" : "Emergency Type"}</label>
            <select 
              value={emergencyType} 
              onChange={(e) => setEmergencyType(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border border-stone-200 focus:outline-none focus:border-rose-500 bg-white text-sm"
            >
              <option value="breakdown">{isRTL ? "عطل فني في الحافلة" : "Technical Breakdown"}</option>
              <option value="traffic">{isRTL ? "ازدحام مروري شديد" : "Severe Traffic"}</option>
              <option value="medical">{isRTL ? "حالة صحية طارئة لطالب" : "Student Medical Emergency"}</option>
              <option value="accident">{isRTL ? "حادث سير للحافلة" : "Road Accident"}</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest block mb-2">{isRTL ? "ملاحظات وتفاصيل إضافية" : "Additional details"}</label>
            <textarea
              value={emergencyNotes}
              onChange={(e) => setEmergencyNotes(e.target.value)}
              placeholder={isRTL ? "اكتب تفاصيل حالة الطوارئ..." : "Write emergency details..."}
              className="w-full h-24 p-3 rounded-xl border border-stone-200 focus:outline-none focus:border-rose-500 text-sm resize-none"
            />
          </div>
          <button 
            onClick={submitEmergency}
            className="w-full h-14 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-rose-900/20 cursor-pointer"
          >
            {isRTL ? "إرسال البلاغ فوراً" : "Send Alert Immediately"}
          </button>
        </div>
      </Modal>

      {/* 2. Broadcast Parents Modal */}
      <Modal 
        isOpen={broadcastModalOpen} 
        onClose={() => setBroadcastModalOpen(false)} 
        title={isRTL ? "إرسال تعميم لأولياء الأمور" : "Broadcast to Parents"}
      >
        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest block mb-2">{isRTL ? "نص الرسالة التعميمية" : "Broadcast Message"}</label>
            <textarea
              value={broadcastText}
              onChange={(e) => setBroadcastText(e.target.value)}
              placeholder={isRTL ? "مثال: الحافلة ستتأخر 10 دقائق بسبب الازدحام..." : "Example: The bus will be 10 minutes late due to traffic..."}
              className="w-full h-32 p-3 rounded-xl border border-stone-200 focus:outline-none focus:border-stone-900 text-sm resize-none"
            />
          </div>
          <button 
            onClick={submitBroadcast}
            className="w-full h-14 bg-stone-900 hover:bg-black text-white font-bold rounded-2xl transition-all shadow-lg cursor-pointer"
          >
            {isRTL ? "إرسال التعميم للجميع" : "Send Broadcast"}
          </button>
        </div>
      </Modal>

      {/* 3. Safety Check Checklist Modal */}
      <Modal 
        isOpen={safetyModalOpen} 
        onClose={() => setSafetyModalOpen(false)} 
        title={isRTL ? "تقرير الفحص والسلامة اليومي" : "Daily Safety Checklist"}
      >
        <div className="space-y-6">
          <p className="text-xs text-stone-500 font-semibold">{isRTL ? "يرجى تأكيد سلامة البنود التالية قبل بدء مسار الحافلة:" : "Please verify the following items before starting the bus route:"}</p>
          
          <div className="space-y-2">
            {[
              { key: "inspection", label: isRTL ? "تم إجراء فحص عام للحافلة وهيكلها" : "General bus structure check completed" },
              { key: "firstAid", label: isRTL ? "صندوق الإسعافات الأولية كامل ومتاح" : "First-aid kit is complete and accessible" },
              { key: "fireExtinguisher", label: isRTL ? "طفاية الحريق صالحة وموجودة" : "Fire extinguisher is functional and in place" },
              { key: "seatbelts", label: isRTL ? "أحزمة الأمان لجميع المقاعد تعمل بشكل جيد" : "Seatbelts for all seats are functional" }
            ].map((item) => (
              <label key={item.key} className="flex items-center gap-3 cursor-pointer p-3 rounded-2xl hover:bg-stone-50 transition-all border border-stone-100/50">
                <input 
                  type="checkbox"
                  checked={safetyChecks[item.key]}
                  onChange={(e) => setSafetyChecks(prev => ({ ...prev, [item.key]: e.target.checked }))}
                  className="h-5 w-5 rounded border-stone-300 text-stone-900 focus:ring-stone-900 cursor-pointer"
                />
                <span className="text-xs font-bold text-stone-700">{item.label}</span>
              </label>
            ))}
          </div>

          <button 
            onClick={submitSafetyReport}
            className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            {isRTL ? "تقديم تقرير السلامة" : "Submit Safety Report"}
          </button>
        </div>
      </Modal>

      {/* 4. Technical Support Ticket Modal */}
      <Modal 
        isOpen={supportModalOpen} 
        onClose={() => setSupportModalOpen(false)} 
        title={isRTL ? "الاتصال بالدعم الفني" : "Technical Support"}
      >
        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest block mb-2">{isRTL ? "ما المشكلة التي تواجهها؟" : "Describe the issue"}</label>
            <textarea
              value={supportText}
              onChange={(e) => setSupportText(e.target.value)}
              placeholder={isRTL ? "اكتب استفسارك أو مشكلتك الفنية هنا..." : "Describe the technical issue here..."}
              className="w-full h-32 p-3 rounded-xl border border-stone-200 focus:outline-none focus:border-stone-900 text-sm resize-none"
            />
          </div>
          <button 
            onClick={submitSupport}
            className="w-full h-14 bg-stone-900 hover:bg-black text-white font-bold rounded-2xl transition-all shadow-lg cursor-pointer"
          >
            {isRTL ? "إرسال طلب الدعم" : "Submit Ticket"}
          </button>
        </div>
      </Modal>

      {/* 5. Parent Contact Info Modal */}
      <Modal 
        isOpen={parentContactModalOpen} 
        onClose={() => {
          setParentContactModalOpen(false);
          setSelectedStudentForContact(null);
        }} 
        title={isRTL ? "معلومات الاتصال بالولي" : "Parent Contact Info"}
      >
        {selectedStudentForContact && (
          <div className="space-y-6">
            <div className="text-center pb-4 border-b border-stone-100">
              <h4 className="text-xl font-bold text-stone-900 mb-1">{selectedStudentForContact.full_name || selectedStudentForContact.name}</h4>
              <span className="text-[9px] text-stone-400 font-bold tracking-widest uppercase">{selectedStudentForContact.id}</span>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3.5 bg-stone-50 rounded-2xl">
                <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">{isRTL ? "البريد الإلكتروني للولي" : "Parent Email"}</span>
                <span className="text-xs font-bold text-stone-800">{selectedStudentForContact.parent_email || (isRTL ? "غير مسجل" : "Not Registered")}</span>
              </div>
              <div className="flex justify-between items-center p-3.5 bg-stone-50 rounded-2xl">
                <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">{isRTL ? "هاتف الاتصال" : "Phone Number"}</span>
                <span className="text-xs font-bold text-stone-800">{selectedStudentForContact.parent_phone || (isRTL ? "غير مسجل" : "Not Registered")}</span>
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <a 
                href={`tel:${selectedStudentForContact.parent_phone || ''}`}
                className="flex-1 h-14 bg-amber-500 hover:bg-amber-600 text-stone-900 font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                <Phone size={18} />
                {isRTL ? "اتصال هاتفي" : "Dial Phone"}
              </a>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(selectedStudentForContact.parent_email || "");
                  toast.success(isRTL ? "تم نسخ البريد الإلكتروني للذاكرة" : "Email copied to clipboard");
                }}
                className="flex-1 h-14 border-2 border-stone-200 hover:bg-stone-50 font-bold rounded-2xl text-stone-700 transition-all cursor-pointer flex items-center justify-center"
              >
                {isRTL ? "نسخ البريد" : "Copy Email"}
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}