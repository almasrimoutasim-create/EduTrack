import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { 
  Video, VideoOff, Mic, MicOff, Hand, MessageSquare, 
  Send, Users, PhoneOff, Settings, Info, Copy, 
  ShieldAlert, ScreenShare, Sparkles, AlertCircle, FileText,
  Clock, Calendar, Maximize2, Minimize2, ChevronLeft, ChevronRight
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
  const [pinnedParticipantId, setPinnedParticipantId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // WebRTC & HTML5 Video/Audio Media
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const localVideoRef = useRef(null);
  const pcsRef = useRef({}); // userId -> RTCPeerConnection
  const processedSignals = useRef(new Set());
  const lastPointRef = useRef(null);
  const iceQueuesRef = useRef({});
  
  // Presentation & Interactive Workspace States
  const [presentationMode, setPresentationMode] = useState("whiteboard"); // whiteboard | file | video
  const [presentationData, setPresentationData] = useState({
    slideIndex: 1,
    imageUrl: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=60",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
  });

  // Whiteboard drawing states
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState("#2dd4bf"); // teal-400
  const [lineWidth, setLineWidth] = useState(3);
  const [isEraser, setIsEraser] = useState(false);
  const [remoteVolume, setRemoteVolume] = useState(1.0);
  
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

  // Initialize local media stream once on mount
  useEffect(() => {
    if (isDemo) return;
    let stream = null;
    const initMedia = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        // Enable/disable tracks according to initial states
        stream.getVideoTracks().forEach(track => track.enabled = videoActive);
        stream.getAudioTracks().forEach(track => track.enabled = micActive);
      } catch (err) {
        console.error("Error accessing media devices:", err);
      }
    };
    initMedia();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isDemo]);

  // Update track enabled state when micActive or videoActive toggles
  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => track.enabled = micActive);
    }
  }, [micActive, localStream]);

  useEffect(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => track.enabled = videoActive);
    }
  }, [videoActive, localStream]);

  // Screen sharing track replacement
  useEffect(() => {
    if (isDemo) return;
    let screenStream = null;
    const toggleScreen = async () => {
      if (screenSharing) {
        try {
          screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = screenStream;
          }
          // Replace video track in all active peer connections
          const screenTrack = screenStream.getVideoTracks()[0];
          Object.values(pcsRef.current).forEach(pc => {
            const sender = pc.getSenders().find(s => s.track && s.track.kind === "video");
            if (sender) {
              sender.replaceTrack(screenTrack);
            }
          });

          screenTrack.onended = () => {
            setScreenSharing(false);
          };
        } catch (err) {
          console.error("Error sharing screen:", err);
          setScreenSharing(false);
        }
      } else {
        if (localVideoRef.current && localStream) {
          localVideoRef.current.srcObject = localStream;
          // Restore camera track in all active peer connections
          const cameraTrack = localStream.getVideoTracks()[0];
          Object.values(pcsRef.current).forEach(pc => {
            const sender = pc.getSenders().find(s => s.track && s.track.kind === "video");
            if (sender && cameraTrack) {
              sender.replaceTrack(cameraTrack);
            }
          });
        }
      }
    };
    toggleScreen();

    return () => {
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [screenSharing, localStream, isDemo]);

  // Helper to send a signaling message via RoomMessage entity
  const sendSignal = async (type, targetId, data) => {
    try {
      await base44.entities.RoomMessage.create({
        room_id: sessionId,
        sender_name: userName,
        sender_id: userId,
        content: `SIGNAL:${type}:${userId}:${targetId}:${JSON.stringify(data)}`,
        type: "signal"
      });
    } catch (err) {
      console.error("Failed to send signaling message", err);
    }
  };

  const getOrCreatePC = (peerId) => {
    if (pcsRef.current[peerId]) return pcsRef.current[peerId];

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" }
      ]
    });

    // Add local tracks to peer connection if available
    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }

    pc.onnegotiationneeded = async () => {
      try {
        if (pc.signalingState === "stable") {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          sendSignal("OFFER", peerId, offer);
        }
      } catch (err) {
        console.error("Error during negotiation", err);
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal("ICE", peerId, event.candidate);
      }
    };

    pc.ontrack = (event) => {
      const stream = event.streams[0] || new MediaStream([event.track]);
      setRemoteStreams(prev => ({
        ...prev,
        [peerId]: stream
      }));
    };

    pcsRef.current[peerId] = pc;
    return pc;
  };

  // Add local tracks to existing peer connections if localStream is set later
  useEffect(() => {
    if (!localStream) return;
    Object.entries(pcsRef.current).forEach(([peerId, pc]) => {
      const senders = pc.getSenders();
      localStream.getTracks().forEach(track => {
        const alreadyAdded = senders.some(s => s.track && s.track.kind === track.kind);
        if (!alreadyAdded) {
          pc.addTrack(track, localStream);
        }
      });
    });
  }, [localStream]);

  const handleIncomingSignal = async (type, peerId, data) => {
    const pc = getOrCreatePC(peerId);

    if (type === "OFFER") {
      await pc.setRemoteDescription(new RTCSessionDescription(data));
      
      // Process queued ICE candidates for this peer
      if (iceQueuesRef.current[peerId]) {
        for (const candidate of iceQueuesRef.current[peerId]) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.error("Error adding queued ice candidate", e);
          }
        }
        delete iceQueuesRef.current[peerId];
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sendSignal("ANSWER", peerId, answer);
    } else if (type === "ANSWER") {
      await pc.setRemoteDescription(new RTCSessionDescription(data));

      // Process queued ICE candidates for this peer
      if (iceQueuesRef.current[peerId]) {
        for (const candidate of iceQueuesRef.current[peerId]) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.error("Error adding queued ice candidate", e);
          }
        }
        delete iceQueuesRef.current[peerId];
      }
    } else if (type === "ICE") {
      if (pc.remoteDescription && pc.remoteDescription.type) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data));
        } catch (e) {
          console.error("Error adding ice candidate", e);
        }
      } else {
        // Queue candidate until remote description is set
        if (!iceQueuesRef.current[peerId]) {
          iceQueuesRef.current[peerId] = [];
        }
        iceQueuesRef.current[peerId].push(data);
      }
    } else if (type === "DRAW_PATH") {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx.beginPath();
        ctx.globalCompositeOperation = data.isEraser ? "destination-out" : "source-over";
        ctx.strokeStyle = data.color || "#2dd4bf";
        ctx.lineWidth = data.width || 3;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.moveTo(data.prevX * canvas.width, data.prevY * canvas.height);
        ctx.lineTo(data.currX * canvas.width, data.currY * canvas.height);
        ctx.stroke();
      }
    } else if (type === "CLEAR_CANVAS") {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    } else if (type === "PRESENTATION_MODE") {
      setPresentationMode(data.mode);
    } else if (type === "PRESENTATION_DATA") {
      setPresentationData(data);
    }
  };

  // Whiteboard drawing interactions using normalized self-contained segments
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    lastPointRef.current = { x, y };
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing || !lastPointRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const currX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const currY = ((e.clientY - rect.top) / rect.height) * canvas.height;
    const prevX = lastPointRef.current.x;
    const prevY = lastPointRef.current.y;

    // Draw locally immediately
    ctx.beginPath();
    ctx.globalCompositeOperation = isEraser ? "destination-out" : "source-over";
    ctx.strokeStyle = isEraser ? "rgba(0,0,0,1)" : drawColor;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.moveTo(prevX, prevY);
    ctx.lineTo(currX, currY);
    ctx.stroke();
    
    // Broadcast normalized coordinate segments to maintain aspect ratio on remote screens
    sendSignal("DRAW_PATH", "all", { 
      prevX: prevX / canvas.width, 
      prevY: prevY / canvas.height, 
      currX: currX / canvas.width, 
      currY: currY / canvas.height, 
      isEraser, 
      color: isEraser ? "rgba(0,0,0,1)" : drawColor, 
      width: lineWidth 
    });

    lastPointRef.current = { x: currX, y: currY };
  };

  const endDrawing = () => {
    setIsDrawing(false);
    lastPointRef.current = null;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    sendSignal("CLEAR_CANVAS", "all", {});
  };

  // Adjust canvas size on presentation tab select and handle parent resizing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        canvas.width = width || 800;
        canvas.height = height || 500;
      }
    });

    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [presentationMode]);

  // Listen for incoming WebRTC signaling messages - role agnostic and localStream state independent
  useEffect(() => {
    if (isDemo) return;

    dbMessages.forEach(msg => {
      const text = msg.content || msg.message_text || "";
      if (!text.startsWith("SIGNAL:") || processedSignals.current.has(msg.id)) return;
      processedSignals.current.add(msg.id);

      const parts = text.split(":");
      const type = parts[1];
      const sender = parts[2];
      const receiver = parts[3];
      if (sender === userId) return;
      if (receiver !== "all" && receiver !== userId) return;

      try {
        const data = JSON.parse(parts.slice(4).join(":"));
        handleIncomingSignal(type, sender, data);
      } catch (err) {
        console.error("Failed to parse incoming WebRTC signal data", err);
      }
    });
  }, [dbMessages, isDemo, userId]);

  // Trigger RTC Offer if we have the lexicographically higher user ID
  useEffect(() => {
    if (isDemo || !localStream) return;

    participants.forEach(p => {
      if (p.id === userId) return;
      if (userId > p.id) {
        const pc = getOrCreatePC(p.id);
        if (pc.signalingState === "stable") {
          pc.createOffer().then(offer => {
            pc.setLocalDescription(offer).then(() => {
              sendSignal("OFFER", p.id, offer);
            });
          });
        }
      }
    });
  }, [participants, localStream, isDemo]);

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

  const getCameraCardClass = () => {
    const count = participants.length;
    if (count > 4) {
      return "relative aspect-video w-32 lg:w-[80%] mx-auto rounded-xl bg-stone-850 border border-white/5 shadow-md overflow-hidden group shrink-0 transition-all duration-300";
    } else if (count > 2) {
      return "relative aspect-video w-40 lg:w-[90%] mx-auto rounded-2xl bg-stone-850 border border-white/5 shadow-md overflow-hidden group shrink-0 transition-all duration-300";
    } else {
      return "relative aspect-video w-48 lg:w-full rounded-2xl bg-stone-850 border border-white/5 shadow-md overflow-hidden group shrink-0 transition-all duration-300";
    }
  };

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
        
        {/* Main Presentation Area (Left / Center) */}
        <div className="flex-1 p-6 flex flex-col justify-between relative bg-stone-900/40 min-w-0">
          {/* Sidebar Toggle Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`absolute top-1/2 -translate-y-1/2 z-20 h-16 w-5 bg-stone-900 border border-stone-850 hover:bg-stone-800 text-stone-400 hover:text-white flex items-center justify-center shadow-lg transition-all rounded-l-md cursor-pointer ${
              isRTL 
                ? "left-0 rounded-r-md rounded-l-none border-l-0" 
                : "right-0 rounded-l-md rounded-r-none border-r-0"
            }`}
            title={sidebarOpen ? (isRTL ? "إخفاء الجانب" : "Hide Sidebar") : (isRTL ? "إظهار الجانب" : "Show Sidebar")}
          >
            {sidebarOpen ? (
              isRTL ? <ChevronLeft size={12} /> : <ChevronRight size={12} />
            ) : (
              isRTL ? <ChevronRight size={12} /> : <ChevronLeft size={12} />
            )}
          </button>

          {/* Header tabs for Presentation Mode */}
          {!pinnedParticipantId && (
            <div className="flex items-center justify-between mb-4 bg-stone-900/80 p-2 rounded-2xl border border-white/5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-stone-400 px-2">{isRTL ? "مساحة العرض النشطة:" : "Active Workspace:"}</span>
                {[
                  { id: "whiteboard", label: isRTL ? "اللوح الذكي" : "Whiteboard" },
                  { id: "file", label: isRTL ? "عرض ملف/صورة" : "File/Image" },
                  { id: "video", label: isRTL ? "عرض فيديو" : "Video player" }
                ].map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => {
                      setPresentationMode(mode.id);
                      setPinnedParticipantId(null); // return to presentation workspace
                      if (isTeacher) {
                        sendSignal("PRESENTATION_MODE", "all", { mode: mode.id });
                      }
                    }}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      presentationMode === mode.id && !pinnedParticipantId
                        ? "bg-teal-500 text-stone-950"
                        : "text-stone-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Presentation Content Box */}
          <div className="flex-1 bg-stone-950/80 rounded-[32px] border border-white/5 relative overflow-hidden flex items-center justify-center min-h-[350px]">
            {pinnedParticipantId ? (
              <div className="w-full h-full relative bg-stone-950 flex items-center justify-center">
                {pinnedParticipantId === userId ? (
                  videoActive && localStream ? (
                    <video
                      ref={el => {
                        if (el && localStream) {
                          if (el.srcObject !== localStream) {
                            el.srcObject = localStream;
                          }
                          el.play().catch(e => console.error("Error auto-playing pinned stream:", e));
                        }
                      }}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-stone-500 font-bold text-xs">{isRTL ? "الكاميرا مغلقة" : "Camera Off"}</div>
                  )
                ) : (
                  remoteStreams[pinnedParticipantId] && participants.find(p => p.id === pinnedParticipantId)?.video ? (
                    <video
                      ref={el => {
                        if (el && remoteStreams[pinnedParticipantId]) {
                          if (el.srcObject !== remoteStreams[pinnedParticipantId]) {
                            el.srcObject = remoteStreams[pinnedParticipantId];
                          }
                          el.volume = remoteVolume;
                          el.play().catch(e => console.error("Error playing remote pinned stream:", e));
                        }
                      }}
                      autoPlay
                      playsInline
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    pinnedParticipantId && participants.find(p => p.id === pinnedParticipantId)?.role === "teacher" && participants.find(p => p.id === pinnedParticipantId)?.video ? (
                      <div className="relative w-full h-full flex flex-col items-center justify-center bg-stone-950">
                        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-stone-950" />
                        <img 
                          src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600" 
                          alt="Teacher"
                          className="max-h-[60%] max-w-[60%] rounded-2xl border-4 border-teal-500/30 object-cover shadow-2xl z-10"
                        />
                        <div className="mt-4 text-center z-10">
                          <p className="text-sm font-bold text-stone-200">{participants.find(p => p.id === pinnedParticipantId)?.name}</p>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-bold mt-2 border border-teal-500/20">
                            <span className="h-2 w-2 rounded-full bg-teal-400 animate-ping" />
                            {isRTL ? "متصل (بث المعلم)" : "Connected (Teacher Feed)"}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-stone-500 font-bold text-xs">
                        {participants.find(p => p.id === pinnedParticipantId)?.video === false 
                          ? (isRTL ? "الكاميرا مغلقة لدى المشترك" : "Participant's Camera Off") 
                          : (isRTL ? "جاري الاتصال بالبث..." : "Connecting to Stream...")}
                      </div>
                    )
                  )
                )}
                <button
                  onClick={() => setPinnedParticipantId(null)}
                  className="absolute top-4 right-4 bg-black/70 hover:bg-black/90 text-white p-2 rounded-xl border border-white/10 z-20 flex items-center gap-1.5 text-xs font-bold transition-all"
                >
                  <Minimize2 size={14} />
                  <span>{isRTL ? "إنهاء التكبير" : "Minimize"}</span>
                </button>
              </div>
            ) : (
              <>
                {presentationMode === "whiteboard" && (
                  <div className="w-full h-full relative bg-stone-900/20">
                    <canvas
                      ref={canvasRef}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={endDrawing}
                      onMouseLeave={endDrawing}
                      className="w-full h-full cursor-crosshair"
                    />
                      <div className="absolute bottom-4 right-4 flex items-center gap-3 bg-stone-900/95 p-3 rounded-2xl border border-white/10 z-10 shadow-2xl backdrop-blur-md">
                        {/* Brush Colors */}
                        <div className="flex items-center gap-1.5">
                          {["#2dd4bf", "#f43f5e", "#3b82f6", "#eab308", "#ffffff"].map(color => (
                            <button
                              key={color}
                              disabled={isEraser}
                              onClick={() => {
                                setDrawColor(color);
                              }}
                              style={{ backgroundColor: color }}
                              className={`h-6 w-6 rounded-full border-2 transition-all ${
                                !isEraser && drawColor === color ? "border-white scale-110" : "border-transparent opacity-60 hover:opacity-100"
                              }`}
                            />
                          ))}
                        </div>

                        <div className="w-px h-6 bg-white/10" />

                        {/* Eraser Tool */}
                        <button
                          onClick={() => setIsEraser(!isEraser)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                            isEraser 
                              ? "bg-amber-500 text-stone-950 shadow-lg shadow-amber-500/25" 
                              : "bg-stone-850 hover:bg-stone-800 text-stone-300"
                          }`}
                        >
                          {isEraser ? (isRTL ? "الممحاة نشطة" : "Eraser Active") : (isRTL ? "ممحاة" : "Eraser")}
                        </button>

                        <div className="w-px h-6 bg-white/10" />

                        {/* Stroke Width Slider */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-stone-400 font-bold">{isRTL ? "السمك:" : "Size:"}</span>
                          <input
                            type="range"
                            min="1"
                            max="20"
                            value={lineWidth}
                            onChange={e => setLineWidth(parseInt(e.target.value))}
                            className="w-16 h-1 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-teal-400"
                          />
                          <span className="text-[9px] font-mono text-teal-400 w-4">{lineWidth}px</span>
                        </div>

                        <div className="w-px h-6 bg-white/10" />

                        {/* Clear Canvas */}
                        <button
                          onClick={clearCanvas}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold transition-all shadow-md shadow-rose-600/10"
                        >
                          {isRTL ? "مسح اللوح" : "Clear"}
                        </button>
                      </div>
                  </div>
                )}

                {presentationMode === "file" && (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 relative">
                    <img
                      src={presentationData.imageUrl}
                      alt="Textbook Page"
                      className="max-h-[85%] max-w-[95%] object-contain rounded-xl shadow-2xl"
                    />
                    {isTeacher && (
                      <div className="absolute bottom-4 right-4 bg-stone-900/90 p-2 rounded-xl border border-white/10 flex items-center gap-3 z-10">
                        <button
                          onClick={() => {
                            const newUrl = prompt(isRTL ? "أدخل رابط الصورة أو الملف:" : "Enter Image URL:", presentationData.imageUrl);
                            if (newUrl) {
                              const updated = { ...presentationData, imageUrl: newUrl };
                              setPresentationData(updated);
                              sendSignal("PRESENTATION_DATA", "all", updated);
                            }
                          }}
                          className="px-3 py-1.5 bg-teal-500 text-stone-950 rounded-lg text-[10px] font-black transition-all"
                        >
                          {isRTL ? "تغيير الملف" : "Change File"}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {presentationMode === "video" && (
                  <div className="w-full h-full flex items-center justify-center p-6 relative">
                    <video
                      src={presentationData.videoUrl}
                      controls
                      className="w-full max-h-[85%] rounded-xl shadow-2xl"
                    />
                    {isTeacher && (
                      <div className="absolute bottom-4 right-4 bg-stone-900/90 p-2 rounded-xl border border-white/10 flex items-center gap-3 z-10">
                        <button
                          onClick={() => {
                            const newUrl = prompt(isRTL ? "أدخل رابط الفيديو (MP4):" : "Enter Video URL (MP4):", presentationData.videoUrl);
                            if (newUrl) {
                              const updated = { ...presentationData, videoUrl: newUrl };
                              setPresentationData(updated);
                              sendSignal("PRESENTATION_DATA", "all", updated);
                            }
                          }}
                          className="px-3 py-1.5 bg-teal-500 text-stone-950 rounded-lg text-[10px] font-black transition-all"
                        >
                          {isRTL ? "تغيير الفيديو" : "Change Video"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* CONTROL TOOLBAR */}
          <div className="h-20 bg-stone-900/80 backdrop-blur-lg border border-white/5 rounded-3xl mt-6 px-6 flex items-center justify-between shadow-2xl relative z-10">
            <div className="flex items-center gap-2">
              <button 
                onClick={toggleMic} 
                className={`h-11 w-11 rounded-2xl flex items-center justify-center border transition-all ${
                  micActive 
                    ? "bg-stone-850 text-stone-200 border-white/5 hover:bg-stone-800" 
                    : "bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/20"
                }`}
              >
                {micActive ? <Mic size={18} /> : <MicOff size={18} />}
              </button>
              
              <button 
                onClick={toggleVideo} 
                className={`h-11 w-11 rounded-2xl flex items-center justify-center border transition-all ${
                  videoActive 
                    ? "bg-stone-850 text-stone-200 border-white/5 hover:bg-stone-800" 
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
                    : "bg-stone-850 text-stone-200 border-white/5 hover:bg-stone-800"
                }`}
              >
                <ScreenShare size={18} />
              </button>
            </div>

            <div className="flex items-center gap-4">
              {!isTeacher && (
                <button 
                  onClick={toggleHand} 
                  className={`h-11 px-4 rounded-2xl flex items-center justify-center gap-2 border transition-all ${
                    handRaised 
                      ? "bg-yellow-500 text-stone-950 border-yellow-400 shadow-lg shadow-yellow-500/20" 
                      : "bg-stone-850 text-stone-200 border-white/5 hover:bg-stone-800"
                  }`}
                >
                  <Hand size={18} />
                  <span className="hidden sm:inline text-xs font-bold">{isRTL ? "رفع اليد" : "Raise Hand"}</span>
                </button>
              )}

              {/* Volume Control Slider (Bug 7) */}
              <div className="flex items-center gap-2 bg-stone-850 px-3 py-2 rounded-2xl border border-white/5 h-11">
                <span className="text-xs text-stone-400">🔊</span>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.05" 
                  value={remoteVolume} 
                  onChange={e => setRemoteVolume(parseFloat(e.target.value))}
                  className="w-20 accent-teal-400 cursor-pointer h-1 bg-stone-700 rounded-lg appearance-none"
                />
                <span className="text-[10px] font-mono text-stone-400 w-8 text-right">{Math.round(remoteVolume * 100)}%</span>
              </div>
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

        {/* Participant Cameras (Google Meet style side stack) */}
        <div className="w-full lg:w-72 bg-stone-950/60 border-t lg:border-t-0 lg:border-r border-stone-850 p-4 flex flex-row lg:flex-col gap-4 overflow-y-auto shrink-0 justify-center lg:justify-start items-center lg:items-stretch min-w-0">
          
          {/* Local Stream Card */}
          <div className={getCameraCardClass()}>
            <button
              onClick={() => setPinnedParticipantId(pinnedParticipantId === userId ? null : userId)}
              className="absolute top-2 left-2 z-20 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-lg border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              title={isRTL ? "تكبير الشاشة" : "Maximize Screen"}
            >
              {pinnedParticipantId === userId ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
            </button>
            {videoActive ? (
              <div className="w-full h-full bg-stone-800 flex items-center justify-center relative">
                {localStream ? (
                  <video
                    ref={el => {
                      if (el && localStream) {
                        if (el.srcObject !== localStream) {
                          el.srcObject = localStream;
                        }
                        el.play().catch(e => console.error("Error auto-playing local video stream:", e));
                      }
                    }}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-teal-500/10 animate-pulse" />
                    <span className="text-3xl">{isTeacher ? "👨‍🏫" : "🧑‍🎓"}</span>
                  </>
                )}
                {screenSharing && (
                  <div className="absolute inset-0 bg-stone-900/90 flex flex-col items-center justify-center p-2 text-center">
                    <ScreenShare size={20} className="text-teal-400 mb-1 animate-bounce" />
                    <p className="text-[8px] font-bold">{isRTL ? "تشارك شاشتك" : "Sharing screen"}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-full bg-stone-900 flex flex-col items-center justify-center p-2">
                <div className="h-8 w-8 rounded-full bg-stone-800 flex items-center justify-center text-xs font-bold mb-1">
                  {userName[0]}
                </div>
                <span className="text-[9px] text-stone-500 font-bold">{isRTL ? "الكاميرا مغلقة" : "Camera Off"}</span>
              </div>
            )}
            <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between z-10">
              <span className="bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded-md text-[8px] font-bold border border-white/5 flex items-center gap-1">
                {userName} {isTeacher && "⭐️"}
              </span>
              <div className="flex gap-1">
                {!micActive && <Badge className="bg-rose-500 text-white p-0.5 rounded-md"><MicOff size={8} /></Badge>}
                {handRaised && <Badge className="bg-yellow-500 text-stone-950 px-1 py-0.5 rounded-md text-[8px] font-black">🙋‍♂️</Badge>}
              </div>
            </div>
          </div>

          {/* Remote Participants Cards */}
          {participants.filter(p => p.id !== userId).map((p) => (
            <div key={p.id} className={getCameraCardClass()}>
              <button
                onClick={() => setPinnedParticipantId(pinnedParticipantId === p.id ? null : p.id)}
                className="absolute top-2 left-2 z-20 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-lg border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                title={isRTL ? "تكبير الشاشة" : "Maximize Screen"}
              >
                {pinnedParticipantId === p.id ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
              </button>
              {remoteStreams[p.id] && (
                <video
                  ref={el => {
                    if (el) {
                      if (el.srcObject !== remoteStreams[p.id]) {
                        el.srcObject = remoteStreams[p.id];
                      }
                      el.volume = remoteVolume;
                      el.play().catch(() => {
                        const playOnClick = () => {
                          el.play().catch(e => console.error(e));
                          window.removeEventListener("click", playOnClick);
                        };
                        window.addEventListener("click", playOnClick);
                      });
                    }
                  }}
                  autoPlay
                  playsInline
                  className={`w-full h-full object-cover ${p.video ? "" : "hidden"}`}
                />
              )}

              {(!p.video || !remoteStreams[p.id]) && (
                <div className="absolute inset-0 bg-stone-900 flex flex-col items-center justify-center p-2">
                  {p.role === "teacher" && p.video ? (
                    <div className="relative w-full h-full flex flex-col items-center justify-center bg-stone-900">
                      <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-stone-900/90" />
                      <img 
                        src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300" 
                        alt={p.name}
                        className="w-12 h-12 rounded-full border border-teal-500/50 object-cover shadow-lg z-10"
                      />
                      <div className="mt-1 text-center z-10">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 text-[8px] font-bold mt-1 border border-teal-500/20">
                          <span className="h-1 w-1 rounded-full bg-teal-400 animate-ping" />
                          {isRTL ? "متصل" : "Live"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="h-8 w-8 rounded-full bg-stone-800 flex items-center justify-center text-xs font-bold mb-1">
                        {p.name[0]}
                      </div>
                      <span className="text-[9px] text-stone-500 font-bold">
                        {!remoteStreams[p.id] ? (isRTL ? "جاري الاتصال..." : "Connecting...") : (isRTL ? "الكاميرا مغلقة" : "Camera Off")}
                      </span>
                    </>
                  )}
                </div>
              )}
              <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between z-10">
                <span className="bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded-md text-[8px] font-bold border border-white/5 flex items-center gap-1">
                  {p.name} {p.role === "teacher" && "⭐️"}
                </span>
                <div className="flex gap-1">
                  {!p.mic && <Badge className="bg-rose-500 text-white p-0.5 rounded-md"><MicOff size={8} /></Badge>}
                  {p.hand && <Badge className="bg-yellow-500 text-stone-950 px-1 py-0.5 rounded-md text-[8px] font-black animate-bounce">🙋‍♂️</Badge>}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* SIDEBAR TABS (CHAT / PARTICIPANTS / NOTES) */}
        <aside className={`transition-all duration-300 relative ${sidebarOpen ? "w-full md:w-96" : "w-0 overflow-hidden border-none"} bg-stone-900 border-t md:border-t-0 md:border-r border-stone-850 flex flex-col z-10`}>
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
                    {dbMessages.filter(msg => {
                      const text = msg.content || msg.message_text || "";
                      const isSignal = text.startsWith("SIGNAL:") || msg.type === "signal";
                      return !isSignal;
                    }).map((msg, i) => {
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
                            {msg.content || msg.message_text}
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
