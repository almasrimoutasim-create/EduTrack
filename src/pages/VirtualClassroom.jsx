import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { 
  Video, VideoOff, Mic, MicOff, Hand, MessageSquare, 
  Send, Users, PhoneOff, Settings, Info, Copy, 
  ShieldAlert, ScreenShare, Sparkles, AlertCircle, FileText,
  Clock, Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function VirtualClassroom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const qc = useQueryClient();

  // Authentication and Roles Info
  const role = localStorage.getItem("portal_role") || "student";
  const userId = localStorage.getItem("portal_user_id") || "S-temp";
  const userName = localStorage.getItem("portal_user_name") || (role === "teacher" ? "أ. أحمد" : "طالب زائر");
  const isTeacher = role === "teacher";

  // Component States
  const [micActive, setMicActive] = useState(true);
  const [videoActive, setVideoActive] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [activeTab, setActiveTab] = useState("chat"); // chat | participants | notes
  const [notes, setNotes] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  
  // Real-time Database Participants & ID
  const [participants, setParticipants] = useState([]);
  const [myParticipantId, setMyParticipantId] = useState(null);

  // Validate if room ID is a valid UUID format, fallback to constant UUID for 'demo' room paths
  const isValidUUID = (val) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
  const sessionId = isValidUUID(id) ? id : "00000000-0000-0000-0000-000000000000";
  const isDemo = id === "demo";

  // Fetch actual database students
  const { data: dbStudents = [] } = useQuery({
    queryKey: ["classroom-students"],
    queryFn: () => base44.entities.Student.list("-created_at")
  });

  // Query actual active session participants in real-time
  const { data: activeParticipants = [], refetch: refetchParticipants } = useQuery({
    queryKey: ["active-session-participants", sessionId],
    queryFn: () => base44.entities.SessionParticipant.filter({ session_id: sessionId }),
    refetchInterval: 2500, // Poll every 2.5 seconds
    enabled: !isDemo
  });

  // Query database chat messages using the verified database column names
  const { data: dbMessages = [] } = useQuery({
    queryKey: ["room-messages", sessionId],
    queryFn: () => base44.entities.RoomMessage.filter({ room_id: sessionId }),
    refetchInterval: 1500, // Poll every 1.5 seconds
    enabled: !isDemo
  });

  // Fetch teacher's subjects for scheduling
  const { data: teacherSubjects = [] } = useQuery({
    queryKey: ["teacher-subjects", userId],
    queryFn: () => isTeacher 
      ? base44.entities.Subject.filter({ teacher_id: userId })
      : base44.entities.Subject.list(),
    enabled: isDemo
  });

  // Fetch all virtual sessions in database
  const { data: virtualSessions = [], refetch: refetchSessions } = useQuery({
    queryKey: ["virtual-sessions"],
    queryFn: () => base44.entities.VirtualSession.list("-created_at"),
    enabled: isDemo
  });

  // Schedule Session States
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [newSession, setNewSession] = useState({
    title: "",
    subject_id: "",
    scheduled_at: "",
    scheduled_time: ""
  });

  // DB Session Fetching
  const { data: session = null, isLoading } = useQuery({
    queryKey: ["virtual-session", sessionId],
    queryFn: async () => {
      try {
        if (!isValidUUID(id)) throw new Error("Mock fallback");
        return await base44.entities.VirtualSession.get(id);
      } catch (e) {
        // Fallback mock details if DB fetching fails
        return {
          id: id,
          title: isRTL ? "مقدمة في الجبر والكسور" : "Introduction to Algebra",
          subject_name: isRTL ? "الرياضيات" : "Mathematics",
          teacher_name: isRTL ? "أ. أحمد الغامدي" : "Mr. Ahmad Al-Ghamdi",
          room_name: `math-room-${id}`,
          status: "active"
        };
      }
    },
    enabled: !isDemo
  });

  // Map database active participants into local virtual classroom grid without duplicates
  useEffect(() => {
    if (isDemo) return;
    if (activeParticipants && activeParticipants.length > 0) {
      // Filter out participants who left or have duplicate user_id
      const activeOnly = activeParticipants.filter(p => !p.left_at);
      const uniqueActive = [];
      const seen = new Set();
      for (const p of activeOnly) {
        if (!seen.has(p.user_id)) {
          seen.add(p.user_id);
          uniqueActive.push(p);
        }
      }

      const mapped = uniqueActive.map((p) => ({
        id: p.user_id,
        name: p.user_name,
        role: p.role,
        mic: p.user_id === userId ? micActive : (p.mic_active ?? true),
        video: p.user_id === userId ? videoActive : (p.video_active ?? true),
        hand: p.user_id === userId ? handRaised : (p.hand_raised ?? false),
        avatar: p.role === "teacher" ? "👨‍🏫" : "🧑‍🎓"
      }));

      // Ensure the current user is added if not yet returned by DB
      if (!mapped.some(p => p.id === userId)) {
        mapped.push({
          id: userId,
          name: userName,
          role: role,
          mic: micActive,
          video: videoActive,
          hand: handRaised,
          avatar: isTeacher ? "👨‍🏫" : "🧑‍🎓"
        });
      }

      setParticipants(mapped);
    } else {
      // Show only current user
      setParticipants([
        {
          id: userId,
          name: userName,
          role: role,
          mic: micActive,
          video: videoActive,
          hand: handRaised,
          avatar: isTeacher ? "👨‍🏫" : "🧑‍🎓"
        }
      ]);
    }
  }, [activeParticipants, userId, userName, role, micActive, videoActive, handRaised, isDemo]);

  // DB participant registration on join with unmount cleanup
  useEffect(() => {
    if (isDemo) return;
    let active = true;
    let participantId = null;

    const registerParticipant = async () => {
      try {
        // Prevent duplicates: mark any stale active participant session for this user in this room as left
        const existing = await base44.entities.SessionParticipant.filter({
          session_id: sessionId,
          user_id: userId
        });
        const activeSessions = existing.filter(p => !p.left_at);
        for (const p of activeSessions) {
          try {
            await base44.entities.SessionParticipant.update(p.id, {
              left_at: new Date().toISOString()
            });
          } catch (e) {
            console.error("Failed to clean up stale participant session", e);
          }
        }

        const res = await base44.entities.SessionParticipant.create({
          session_id: sessionId,
          user_id: userId,
          user_name: userName,
          role: role,
          joined_at: new Date().toISOString(),
          mic_active: micActive,
          video_active: videoActive,
          hand_raised: handRaised
        });
        if (res && res.id) {
          participantId = res.id;
          if (active) {
            setMyParticipantId(res.id);
          }
        }
        refetchParticipants();
      } catch (err) {
        console.error("Failed to log attendance record", err);
      }
    };
    registerParticipant();

    return () => {
      active = false;
      if (participantId) {
        base44.entities.SessionParticipant.update(participantId, {
          left_at: new Date().toISOString()
        }).catch(err => console.error("Error setting left_at on unmount", err));
      }
    };
  }, [sessionId, userId, userName, role, isDemo]);

  const toggleMic = async () => {
    const newState = !micActive;
    setMicActive(newState);
    if (myParticipantId) {
      try {
        await base44.entities.SessionParticipant.update(myParticipantId, { mic_active: newState });
        refetchParticipants();
      } catch (err) {
        console.error("Failed to sync mic toggle", err);
      }
    }
  };

  const toggleVideo = async () => {
    const newState = !videoActive;
    setVideoActive(newState);
    if (myParticipantId) {
      try {
        await base44.entities.SessionParticipant.update(myParticipantId, { video_active: newState });
        refetchParticipants();
      } catch (err) {
        console.error("Failed to sync video toggle", err);
      }
    }
  };

  const toggleHand = async () => {
    const newState = !handRaised;
    setHandRaised(newState);
    if (myParticipantId) {
      try {
        await base44.entities.SessionParticipant.update(myParticipantId, { hand_raised: newState });
        refetchParticipants();
      } catch (err) {
        console.error("Failed to sync hand toggle", err);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;
    const textToSend = chatMessage;
    setChatMessage("");
    try {
      await base44.entities.RoomMessage.create({
        room_id: sessionId,
        sender_name: userName,
        sender_id: userId,
        content: textToSend,
        type: "text"
      });
      qc.invalidateQueries({ queryKey: ["room-messages", sessionId] });
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  const handleScheduleSession = async () => {
    if (!newSession.title || !newSession.subject_id || !newSession.scheduled_at || !newSession.scheduled_time) {
      toast.error(isRTL ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill in all required fields");
      return;
    }

    const selectedSub = teacherSubjects.find(s => s.id === newSession.subject_id);
    const roomName = `room-${Math.random().toString(36).substr(2, 9)}`;
    const scheduledDateTime = new Date(`${newSession.scheduled_at}T${newSession.scheduled_time}`).toISOString();

    try {
      await base44.entities.VirtualSession.create({
        title: newSession.title,
        teacher_id: userId,
        teacher_name: userName,
        subject_id: newSession.subject_id,
        subject_name: selectedSub ? selectedSub.name : "",
        room_name: roomName,
        scheduled_at: scheduledDateTime,
        status: "scheduled"
      });
      toast.success(isRTL ? "تم جدولة الحصة الافتراضية بنجاح!" : "Virtual session scheduled successfully!");
      setShowScheduleDialog(false);
      setNewSession({ title: "", subject_id: "", scheduled_at: "", scheduled_time: "" });
      refetchSessions();
    } catch (err) {
      console.error(err);
      toast.error(isRTL ? "فشل جدولة الحصة" : "Failed to schedule session");
    }
  };

  const handleStartSession = async (sessionItem) => {
    try {
      await base44.entities.VirtualSession.update(sessionItem.id, {
        status: "active",
        started_at: new Date().toISOString()
      });
      toast.success(isRTL ? "تم تفعيل وبدء الحصة الافتراضية المباشرة!" : "Virtual session started!");
      navigate(`/virtual-classroom/${sessionItem.id}`);
    } catch (err) {
      console.error(err);
      toast.error(isRTL ? "فشل بدء الحصة" : "Failed to start session");
    }
  };

  const handleEndClass = async () => {
    if (isTeacher) {
      if (confirm(isRTL ? "هل أنت متأكد من إنهاء الفصل الدراسي للجميع؟" : "Are you sure you want to end the session for everyone?")) {
        try {
          await base44.entities.VirtualSession.update(id, {
            status: "ended",
            ended_at: new Date().toISOString()
          });
        } catch (e) {
          console.error(e);
        }
        toast.success(isRTL ? "تم إنهاء الفصل وتوثيق سجل الحضور." : "Class ended and attendance log saved.");
        navigate("/teacher-portal");
      }
    } else {
      toast.info(isRTL ? "غادرت الفصل الدراسي." : "You left the classroom.");
      navigate("/student-portal");
    }
  };

  if (isDemo) {
    return (
      <div className="min-h-screen bg-stone-950 text-white flex flex-col font-sans" dir={isRTL ? "rtl" : "ltr"}>
        {/* Header */}
        <header className="h-16 px-6 bg-stone-900 border-b border-stone-800 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Video size={18} />
            </div>
            <div>
              <h1 className="text-sm font-extrabold">
                {isRTL ? "الفصول الافتراضية الذكية" : "Smart Virtual Classrooms"}
              </h1>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                {isRTL ? "منصة التعليم والجدولة المباشرة" : "Live Learning & Scheduling Hub"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl text-[10px] font-bold border border-white/5">
              {userName} ({isTeacher ? (isRTL ? "معلم" : "Teacher") : (isRTL ? "طالب" : "Student")})
            </span>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-y-auto">
          {isTeacher && (
            <div className="lg:col-span-5 space-y-6">
              {/* Start Instant Class */}
              <Card className="p-6 bg-stone-900/60 border border-white/5 rounded-[32px] shadow-2xl relative overflow-hidden backdrop-blur-md">
                <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl" />
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
                  {isRTL ? "بدء حصة افتراضية فورية" : "Start Instant Live Class"}
                </h3>
                <p className="text-xs text-stone-400 mb-6 leading-relaxed">
                  {isRTL 
                    ? "ابدأ فصلاً دراسياً مباشراً فورياً الآن لدعوة طلابك للانضمام والتفاعل فوراً." 
                    : "Create and launch an immediate virtual session to invite your students right away."}
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-stone-200 uppercase block mb-1.5">{isRTL ? "عنوان الحصة" : "Session Title"}</label>
                    <Input 
                      placeholder={isRTL ? "مثال: مراجعة الجبر والكسور" : "e.g. Algebra Review Session"} 
                      value={newSession.title}
                      onChange={e => setNewSession({...newSession, title: e.target.value})}
                      className="!bg-stone-850 !text-white border-white/5 text-xs rounded-xl focus:border-teal-500 placeholder:text-stone-400"
                      style={{ backgroundColor: '#1c1917', color: '#ffffff' }}
                    />
                  </div>
                  
                  <div>
                    <label className="text-[10px] font-bold text-stone-200 uppercase block mb-1.5">{isRTL ? "المادة الدراسية" : "Subject"}</label>
                    <select 
                      value={newSession.subject_id}
                      onChange={e => setNewSession({...newSession, subject_id: e.target.value})}
                      className="w-full bg-stone-850 border border-white/5 text-xs text-white rounded-xl p-2.5 focus:border-teal-500 focus:outline-none"
                      style={{ backgroundColor: '#1c1917', color: '#ffffff' }}
                    >
                      <option value="" style={{ backgroundColor: '#1c1917', color: '#ffffff' }}>{isRTL ? "اختر المادة..." : "Select Subject..."}</option>
                      {teacherSubjects.map(sub => (
                        <option key={sub.id} value={sub.id} style={{ backgroundColor: '#1c1917', color: '#ffffff' }}>{sub.name} ({sub.grade || "عام"})</option>
                      ))}
                    </select>
                  </div>

                  <button 
                    onClick={async () => {
                      if (!newSession.title || !newSession.subject_id) {
                        toast.error(isRTL ? "يرجى إدخال العنوان واختيار المادة" : "Please enter a title and select a subject");
                        return;
                      }
                      const selectedSub = teacherSubjects.find(s => s.id === newSession.subject_id);
                      const roomName = `room-${Math.random().toString(36).substr(2, 9)}`;
                      try {
                        const res = await base44.entities.VirtualSession.create({
                          title: newSession.title,
                          teacher_id: userId,
                          teacher_name: userName,
                          subject_id: newSession.subject_id,
                          subject_name: selectedSub ? selectedSub.name : "",
                          room_name: roomName,
                          scheduled_at: new Date().toISOString(),
                          started_at: new Date().toISOString(),
                          status: "active"
                        });
                        toast.success(isRTL ? "تم بدء الحصة بنجاح!" : "Session started successfully!");
                        navigate(`/virtual-classroom/${res.id}`);
                      } catch (err) {
                        console.error(err);
                        toast.error(isRTL ? "فشل بدء الحصة الفورية" : "Failed to start instant session");
                      }
                    }}
                    className="w-full h-11 bg-teal-500 hover:bg-teal-400 text-stone-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 transition-all mt-2 shadow-lg shadow-teal-500/10 cursor-pointer"
                  >
                    <Video size={16} />
                    {isRTL ? "بدء البث المباشر الآن" : "Start Live Stream Now"}
                  </button>
                </div>
              </Card>

              {/* Schedule Virtual Class */}
              <Card className="p-6 bg-stone-900/60 border border-white/5 rounded-[32px] shadow-2xl relative overflow-hidden backdrop-blur-md">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl" />
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                  {isRTL ? "جدولة حصة افتراضية" : "Schedule Virtual Class"}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-stone-200 uppercase block mb-1.5">{isRTL ? "عنوان الحصة" : "Session Title"}</label>
                    <Input 
                      placeholder={isRTL ? "مثال: مقدمة في الخوارزميات" : "e.g. Intro to Algorithms"} 
                      value={newSession.title}
                      onChange={e => setNewSession({...newSession, title: e.target.value})}
                      className="!bg-stone-850 !text-white border-white/5 text-xs rounded-xl focus:border-amber-500 placeholder:text-stone-400"
                      style={{ backgroundColor: '#1c1917', color: '#ffffff' }}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-stone-200 uppercase block mb-1.5">{isRTL ? "المادة الدراسية" : "Subject"}</label>
                    <select 
                      value={newSession.subject_id}
                      onChange={e => setNewSession({...newSession, subject_id: e.target.value})}
                      className="w-full bg-stone-850 border border-white/5 text-xs text-white rounded-xl p-2.5 focus:border-amber-500 focus:outline-none"
                      style={{ backgroundColor: '#1c1917', color: '#ffffff' }}
                    >
                      <option value="" style={{ backgroundColor: '#1c1917', color: '#ffffff' }}>{isRTL ? "اختر المادة..." : "Select Subject..."}</option>
                      {teacherSubjects.map(sub => (
                        <option key={sub.id} value={sub.id} style={{ backgroundColor: '#1c1917', color: '#ffffff' }}>{sub.name} ({sub.grade || "عام"})</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-stone-200 uppercase block mb-1.5">{isRTL ? "التاريخ" : "Date"}</label>
                      <input 
                        type="date"
                        value={newSession.scheduled_at}
                        onChange={e => setNewSession({...newSession, scheduled_at: e.target.value})}
                        className="w-full bg-stone-850 border border-white/5 text-xs text-white rounded-xl p-2.5 focus:border-amber-500 focus:outline-none"
                        style={{ backgroundColor: '#1c1917', color: '#ffffff', colorScheme: 'dark' }}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-stone-200 uppercase block mb-1.5">{isRTL ? "الوقت" : "Time"}</label>
                      <input 
                        type="time"
                        value={newSession.scheduled_time}
                        onChange={e => setNewSession({...newSession, scheduled_time: e.target.value})}
                        className="w-full bg-stone-850 border border-white/5 text-xs text-white rounded-xl p-2.5 focus:border-amber-500 focus:outline-none"
                        style={{ backgroundColor: '#1c1917', color: '#ffffff', colorScheme: 'dark' }}
                      />
                    </div>
                  </div>

                  <button 
                    onClick={handleScheduleSession}
                    className="w-full h-11 bg-stone-850 hover:bg-stone-800 text-white font-bold border border-white/10 rounded-xl text-xs flex items-center justify-center gap-2 transition-all mt-2 cursor-pointer"
                  >
                    <Calendar size={16} className="text-amber-400" />
                    {isRTL ? "جدولة الحصة وحفظها" : "Schedule & Save Class"}
                  </button>
                </div>
              </Card>
            </div>
          )}

          {/* List of Sessions */}
          <div className={isTeacher ? "lg:col-span-7 space-y-6" : "lg:col-span-12 space-y-6"}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-extrabold text-white">
                {isRTL ? "الحصص الافتراضية الحالية والقادمة" : "Current & Upcoming Virtual Classes"}
              </h2>
              <Badge className="bg-stone-800 text-stone-300 border-none rounded-full px-3 py-1 text-xs font-black">
                {virtualSessions.length} {isRTL ? "فصول" : "Sessions"}
              </Badge>
            </div>

            {virtualSessions.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center border border-dashed border-stone-850 rounded-[32px] text-stone-500 p-8 text-center bg-stone-900/10">
                <AlertCircle size={40} className="text-stone-700 mb-3" />
                <p className="text-sm font-bold">{isRTL ? "لا توجد حصص افتراضية مجدولة حالياً." : "No scheduled virtual classes found."}</p>
                <p className="text-xs text-stone-600 mt-1">{isRTL ? "قم بإنشاء حصة أو جدولتها للبدء." : "Create or schedule a session to get started."}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {virtualSessions.map((sessionItem) => {
                  const isActive = sessionItem.status === "active";
                  const isScheduled = sessionItem.status === "scheduled";
                  const isEnded = sessionItem.status === "ended";
                  
                  return (
                    <Card key={sessionItem.id} className="p-6 bg-stone-900/40 border border-white/5 rounded-[28px] hover:bg-stone-900/70 transition-all duration-300 relative group overflow-hidden">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-bold text-white group-hover:text-teal-400 transition-colors">{sessionItem.title}</h4>
                            {isActive && (
                              <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider flex items-center gap-1 animate-pulse">
                                <span className="h-1 w-1 rounded-full bg-emerald-400 inline-block" />
                                {isRTL ? "نشط الآن" : "ACTIVE NOW"}
                              </Badge>
                            )}
                            {isScheduled && (
                              <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-md text-[9px] font-black uppercase">
                                {isRTL ? "مجدول" : "SCHEDULED"}
                              </Badge>
                            )}
                            {isEnded && (
                              <Badge className="bg-stone-800 text-stone-500 border-none px-2 py-0.5 rounded-md text-[9px] font-black uppercase">
                                {isRTL ? "منتهية" : "ENDED"}
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-xs text-stone-400 font-medium">
                            {sessionItem.subject_name} • {sessionItem.teacher_name}
                          </p>
                          
                          {(isScheduled || isActive) && sessionItem.scheduled_at && (
                            <p className="text-[10px] text-stone-500 font-bold flex items-center gap-1">
                              <Clock size={10} />
                              {new Date(sessionItem.scheduled_at).toLocaleString(isRTL ? "ar-EG" : "en-US")}
                            </p>
                          )}
                        </div>

                        <div className="flex gap-2 w-full sm:w-auto shrink-0 justify-end">
                          {isActive && (
                            <button
                              onClick={() => navigate(`/virtual-classroom/${sessionItem.id}`)}
                              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/10"
                            >
                              <Video size={14} />
                              {isRTL ? "دخول البث المباشر" : "Enter Live Stream"}
                            </button>
                          )}
                          
                          {isScheduled && isTeacher && (
                            <button
                              onClick={() => handleStartSession(sessionItem)}
                              className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-stone-950 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-teal-500/10"
                            >
                              <Video size={14} />
                              {isRTL ? "بدء الحصة الآن" : "Start Session Now"}
                            </button>
                          )}

                          {isScheduled && !isTeacher && (
                            <span className="px-3 py-1.5 bg-stone-850 text-stone-500 text-xs font-bold rounded-xl border border-white/5">
                              {isRTL ? "انتظار المعلم" : "Awaiting Teacher"}
                            </span>
                          )}

                          {isEnded && (
                            <span className="px-3 py-1.5 bg-stone-950 text-stone-600 text-xs font-bold rounded-xl">
                              {isRTL ? "انتهى البث" : "Session Ended"}
                            </span>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-white flex flex-col font-sans select-none overflow-hidden" dir={isRTL ? "rtl" : "ltr"}>
      {/* HEADER SECTION */}
      <header className="h-16 px-6 bg-stone-900 border-b border-stone-800 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <Sparkles size={18} className="animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold truncate max-w-[200px] sm:max-w-md">
              {session?.title || (isRTL ? "حصة دراسية افتراضية" : "Virtual Session")}
            </h1>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
              {session?.subject_name} • {session?.teacher_name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" />
            {isRTL ? "مباشر" : "LIVE"}
          </Badge>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success(isRTL ? "تم نسخ رابط الغرفة بنجاح!" : "Room link copied!");
            }}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs font-bold transition-all"
          >
            <Copy size={12} />
            {isRTL ? "مشاركة الرابط" : "Share Link"}
          </button>
        </div>
      </header>

      {/* CORE WORKSPACE */}
      <div className="flex-1 flex flex-col md:flex-row relative min-h-0 overflow-hidden">
        {/* Main Video Stream Grid */}
        <div className="flex-1 p-6 flex flex-col justify-between relative bg-stone-900/40">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 flex-1 items-center justify-center min-h-[400px]">
            
            {/* Local Stream (Active Participant) */}
            <motion.div 
              layout
              className="relative aspect-video rounded-[24px] bg-stone-850 border border-white/5 shadow-2xl overflow-hidden group h-full max-h-[300px]"
            >
              {videoActive ? (
                <div className="w-full h-full bg-stone-800 flex items-center justify-center relative">
                  {/* Mock live camera stream indicator */}
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-teal-500/10 animate-pulse" />
                  <span className="text-6xl">{isTeacher ? "👨‍🏫" : "🧑‍🎓"}</span>
                  
                  {screenSharing && (
                    <div className="absolute inset-0 bg-stone-900/90 flex flex-col items-center justify-center p-4 text-center">
                      <ScreenShare size={40} className="text-teal-400 mb-2 animate-bounce" />
                      <p className="text-xs font-bold">{isRTL ? "تقوم بمشاركة شاشتك الآن" : "You are sharing your screen"}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-full bg-stone-900 flex flex-col items-center justify-center">
                  <div className="h-16 w-16 rounded-full bg-stone-800 flex items-center justify-center text-2xl font-bold mb-2">
                    {userName[0]}
                  </div>
                  <span className="text-xs text-stone-500 font-bold">{isRTL ? "الكاميرا مغلقة" : "Camera Off"}</span>
                </div>
              )}

              {/* Overlays */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-10">
                <span className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl text-[10px] font-bold border border-white/5 flex items-center gap-1.5">
                  {userName} {isTeacher && "⭐️"}
                </span>
                <div className="flex gap-1.5">
                  {!micActive && <Badge className="bg-rose-500 text-white p-1 rounded-lg"><MicOff size={10} /></Badge>}
                  {handRaised && <Badge className="bg-yellow-500 text-stone-950 px-2 py-0.5 rounded-lg text-[9px] font-black flex items-center gap-0.5">🙋‍♂️ {isRTL ? "رفع اليد" : "Hand"}</Badge>}
                </div>
              </div>
            </motion.div>

            {/* Other Participants */}
            {participants.filter(p => p.id !== userId).map((p) => (
              <motion.div 
                key={p.id}
                layout
                className="relative aspect-video rounded-[24px] bg-stone-850 border border-white/5 shadow-md overflow-hidden group h-full max-h-[300px]"
              >
                {p.video ? (
                  <div className="w-full h-full bg-stone-800 flex items-center justify-center relative">
                    <span className="text-6xl">{p.avatar}</span>
                  </div>
                ) : (
                  <div className="w-full h-full bg-stone-900 flex flex-col items-center justify-center">
                    <div className="h-14 w-14 rounded-full bg-stone-800 flex items-center justify-center text-xl font-bold mb-2">
                      {p.name[0]}
                    </div>
                    <span className="text-xs text-stone-500 font-bold">{isRTL ? "الكاميرا مغلقة" : "Camera Off"}</span>
                  </div>
                )}

                {/* Overlays */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-10">
                  <span className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl text-[10px] font-bold border border-white/5 flex items-center gap-1.5">
                    {p.name} {p.role === "teacher" && "⭐️"}
                  </span>
                  <div className="flex gap-1.5">
                    {!p.mic && <Badge className="bg-rose-500 text-white p-1 rounded-lg"><MicOff size={10} /></Badge>}
                    {p.hand && <Badge className="bg-yellow-500 text-stone-950 px-2 py-0.5 rounded-lg text-[9px] font-black flex items-center gap-0.5 animate-bounce">🙋‍♂️</Badge>}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* CONTROL TOOLBAR */}
          <div className="h-20 bg-stone-900/80 backdrop-blur-lg border border-white/5 rounded-3xl mt-6 px-6 flex items-center justify-between shadow-2xl relative z-10">
            <div className="flex items-center gap-2">
              <button 
                onClick={toggleMic} 
                className={`h-11 w-11 rounded-2xl flex items-center justify-center border transition-all ${
                  micActive 
                    ? "bg-stone-800 text-stone-200 border-white/5 hover:bg-stone-700" 
                    : "bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/20"
                }`}
              >
                {micActive ? <Mic size={18} /> : <MicOff size={18} />}
              </button>
              
              <button 
                onClick={toggleVideo} 
                className={`h-11 w-11 rounded-2xl flex items-center justify-center border transition-all ${
                  videoActive 
                    ? "bg-stone-800 text-stone-200 border-white/5 hover:bg-stone-700" 
                    : "bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/20"
                }`}
              >
                {videoActive ? <Video size={18} /> : <VideoOff size={18} />}
              </button>
              
              <button 
                onClick={() => setScreenSharing(!screenSharing)} 
                className={`h-11 w-11 rounded-2xl flex items-center justify-center border transition-all ${
                  screenSharing 
                    ? "bg-teal-500 text-stone-950 border-teal-400 shadow-lg shadow-teal-500/20" 
                    : "bg-stone-800 text-stone-200 border-white/5 hover:bg-stone-700"
                }`}
              >
                <ScreenShare size={18} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              {!isTeacher && (
                <button 
                  onClick={toggleHand} 
                  className={`h-11 px-4 rounded-2xl flex items-center justify-center gap-2 border transition-all ${
                    handRaised 
                      ? "bg-yellow-500 text-stone-950 border-yellow-400 shadow-lg shadow-yellow-500/20" 
                      : "bg-stone-800 text-stone-200 border-white/5 hover:bg-stone-700"
                  }`}
                >
                  <Hand size={18} />
                  <span className="hidden sm:inline text-xs font-bold">{isRTL ? "رفع اليد" : "Raise Hand"}</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={handleEndClass} 
                className="h-11 px-6 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center gap-2 transition-all font-bold text-xs"
              >
                <PhoneOff size={16} />
                <span>{isTeacher ? (isRTL ? "إنهاء الحصة للجميع" : "End for All") : (isRTL ? "مغادرة" : "Leave")}</span>
              </button>
            </div>
          </div>
        </div>

        {/* SIDEBAR TABS (CHAT / PARTICIPANTS / NOTES) */}
        <aside className="w-full md:w-96 bg-stone-900 border-t md:border-t-0 md:border-r border-stone-800 flex flex-col z-10">
          <div className="h-14 border-b border-stone-850 p-1 flex">
            {[
              { id: "chat", label: isRTL ? "الدردشة" : "Chat", icon: MessageSquare },
              { id: "participants", label: isRTL ? "الحاضرين" : "Users", icon: Users },
              { id: "notes", label: isRTL ? "الملاحظات" : "Notes", icon: FileText }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === tab.id 
                    ? "bg-stone-800 text-white" 
                    : "text-stone-400 hover:text-white"
                }`}
              >
                <tab.icon size={14} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="flex-1 flex flex-col p-4 min-h-0 relative">
            <AnimatePresence mode="wait">
              {activeTab === "chat" && (
                <motion.div 
                  key="chat"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col justify-between"
                >
                  <div className="space-y-4 flex-1 overflow-y-auto mb-4 scrollbar-hide">
                    {dbMessages.map((msg, i) => {
                      const isMe = msg.sender_name === userName;
                      const isTeacherMsg = msg.sender_id === 'teacher-id' || msg.sender_name === session?.teacher_name;
                      const timeStr = msg.created_at ? new Date(msg.created_at).toLocaleTimeString(isRTL ? "ar-EG" : "en-US", { hour: "2-digit", minute: "2-digit" }) : "";
                      return (
                        <div key={msg.id || i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold text-stone-400">{msg.sender_name}</span>
                            <span className="text-[8px] text-stone-500">{timeStr}</span>
                          </div>
                          <div className={`px-4 py-2.5 rounded-2xl text-xs max-w-[85%] ${
                            isMe 
                              ? "bg-teal-600 text-white rounded-br-none" 
                              : isTeacherMsg
                                ? "bg-amber-500/10 text-amber-300 border border-amber-500/25 rounded-bl-none"
                                : "bg-stone-800 text-stone-200 rounded-bl-none"
                          }`}>
                            {msg.content}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex gap-2 bg-stone-850 p-1.5 rounded-2xl border border-white/5 mt-auto">
                    <Input 
                      value={chatMessage}
                      onChange={e => setChatMessage(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleSendMessage()}
                      placeholder={isRTL ? "اكتب رسالة..." : "Type a message..."}
                      className="border-none bg-transparent text-xs focus-visible:ring-0 text-white"
                    />
                    <button 
                      onClick={handleSendMessage}
                      className="h-9 w-9 rounded-xl bg-teal-500 text-stone-950 flex items-center justify-center shrink-0 hover:bg-teal-400 transition-colors"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </motion.div>
              )}

              {activeTab === "participants" && (
                <motion.div 
                  key="participants"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3 overflow-y-auto flex-1 pr-1 scrollbar-hide"
                >
                  <div className="flex items-center justify-between text-stone-400 text-xs font-bold pb-2 border-b border-stone-800">
                    <span>{isRTL ? "اسم المشارك" : "Name"}</span>
                    <span>{isRTL ? "الحالة" : "Status"}</span>
                  </div>
                  {participants.map((p) => (
                    <div key={p.id} className="flex items-center justify-between bg-stone-850/50 p-3 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{p.avatar}</span>
                        <div>
                          <p className="text-xs font-bold text-white">{p.name}</p>
                          <p className="text-[9px] font-bold text-stone-500 uppercase tracking-widest">{p.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {p.hand && <span className="text-xs">🙋‍♂️</span>}
                        {p.mic ? <Mic size={14} className="text-stone-400" /> : <MicOff size={14} className="text-rose-500" />}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}

              {activeTab === "notes" && (
                <motion.div 
                  key="notes"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col flex-1 min-h-0"
                >
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Info size={12} />
                    {isRTL ? "الملاحظات المشتركة للصف الدراسي" : "Shared notes collaborative panel"}
                  </p>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder={isRTL ? "ابدأ كتابة الملاحظات المشتركة أو كود الدرس هنا..." : "Start writing lesson notes..."}
                    className="flex-1 w-full bg-stone-850/40 rounded-2xl p-4 border border-white/5 text-xs text-stone-200 focus:outline-none focus:border-stone-700 resize-none font-mono"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </aside>
      </div>
    </div>
  );
}
