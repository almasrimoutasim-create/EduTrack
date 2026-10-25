import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { entities, deleteVirtualClass } from "@/api/dbClient";
import {
  Video, VideoOff, Mic, MicOff, Hand, MessageSquare,
  Send, Users, PhoneOff, Info, Copy,
  ShieldAlert, ScreenShare, Sparkles, AlertCircle, FileText,
  Clock, Calendar, Maximize2, Minimize2, ChevronLeft, ChevronRight,
  StopCircle, Trash2, Pin, PinOff, Volume2, VolumeX, Settings,
  LayoutGrid, MonitorPlay, Check, Edit3, X, Radio, PenTool
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { useAuth } from "@/lib/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useDrawingSocket } from "@/hooks/useDrawingSocket";
import { useWebRTCSignaling } from "@/hooks/useWebRTCSignaling";

// ─────────────────────────────────────────────────────────────────────────────
//  ICE Server Configuration will now be fetched from the backend API
// ─────────────────────────────────────────────────────────────────────────────

export default function VirtualClassroom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const qc = useQueryClient();
  const { user } = useAuth();

  // ── Auth ──────────────────────────────────────────────────────────────────
  const fallbackId = useRef(`temp-${Math.random().toString(36).substr(2, 9)}`).current;
  const role = user?.role || "student";
  const userId = user?.id || fallbackId;
  const userName = user?.full_name || (role === "teacher" ? "أ. أحمد" : "طالب زائر");
  const isTeacher = role === "teacher";
  const isAdmin = role === "admin" || role === "school_admin";

  // ── UI State ──────────────────────────────────────────────────────────────
  const [micActive, setMicActive] = useState(true);
  const [videoActive, setVideoActive] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [notes, setNotes] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [pinnedParticipantId, setPinnedParticipantId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [micVolume, setMicVolume] = useState(0);
  const [isLocalSpeaking, setIsLocalSpeaking] = useState(false);
  const [speakingUsers, setSpeakingUsers] = useState({});
  const [callDuration, setCallDuration] = useState(0);
  const [showWhiteboardModal, setShowWhiteboardModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [layoutMode, setLayoutMode] = useState("auto"); // "auto" | "spotlight" | "grid"
  // Maps userId -> true when that user is sharing their screen
  const [remoteScreenSharing, setRemoteScreenSharing] = useState({});
  // Maps userId -> MediaStream for the SCREEN track received
  const [remoteScreenStreams, setRemoteScreenStreams] = useState({});

  // ── WebSockets ────────────────────────────────────────────────────────────
  const wsDrawing = useDrawingSocket(id, userId);
  const wsSignaling = useWebRTCSignaling(id, userId, {
    userName,
    role,
    photo: user?.photo_url || null,
    micActive,
    videoActive
  });


  const { data: iceConfig } = useQuery({
    queryKey: ['ice-config'],
    queryFn: () => fetch('/api/ice-config').then(r => r.json()),
    staleTime: 3600000 // 1 hour
  });

  // ── WebRTC ────────────────────────────────────────────────────────────────
  const [localStream, setLocalStream] = useState(null);
  const localStreamRef = useRef(null);
  const [screenStream, setScreenStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});  // camera streams
  const localVideoRef = useRef(null);
  const pcsRef = useRef({});            // peerId -> RTCPeerConnection
  const processedSignals = useRef(new Set());
  const iceQueuesRef = useRef({});      // peerId -> ICECandidate[]
  const [remoteVolume, setRemoteVolume] = useState(1.0);
  // Track refs for all remote video elements to apply volume changes
  const remoteVideoRefs = useRef({});   // peerId -> HTMLVideoElement
  const offersInitiated = useRef(new Set()); // track which peers we've offered to
  const makingOfferRef = useRef({});    // peerId -> boolean
  const ignoreOfferRef = useRef({});    // peerId -> boolean

  // ── Presentation / Whiteboard ─────────────────────────────────────────────
  const canvasRef = useRef(null);
  const lastPointRef = useRef(null);
  const messagesEndRef = useRef(null);
  const activeStreamRef = useRef(null);

  useEffect(() => {
    activeStreamRef.current = screenSharing && screenStream ? screenStream : localStream;
  }, [screenSharing, screenStream, localStream]);

  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState("#2dd4bf");
  const [lineWidth, setLineWidth] = useState(3);
  const [isEraser, setIsEraser] = useState(false);
  const [presentationMode, setPresentationMode] = useState("whiteboard");
  const [presentationData, setPresentationData] = useState({
    slideIndex: 1,
    imageUrl: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=60",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
  });

  // ── DB / Session ──────────────────────────────────────────────────────────
  const [participants, setParticipants] = useState([]);
  const [myParticipantId, setMyParticipantId] = useState(null);

  const isValidUUID = (val) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
  const sessionId = isValidUUID(id) ? id : "00000000-0000-0000-0000-000000000000";
  const isDemo = id === "demo";

  const { data: dbStudents = [] } = useQuery({
    queryKey: ["classroom-students"],
    queryFn: () => entities.Student.list("-created_at"),
  });

  const { data: dbTeachers = [] } = useQuery({
    queryKey: ["classroom-teachers"],
    queryFn: () => entities.Teacher.list("-created_at"),
  });

  // Map of userId -> profile photo (photo_url on students/teachers tables).
  // Lets the teacher's photo show to students and vice-versa inside the room.
  const photoMap = useMemo(() => {
    const map = {};
    const add = (u) => {
      if (!u?.id) return;
      const url = u.photo_url || u.avatar_url || u.profile_image || null;
      if (url) map[String(u.id)] = url;
    };
    (dbStudents || []).forEach(add);
    (dbTeachers || []).forEach(add);
    return map;
  }, [dbStudents, dbTeachers]);

  const { data: activeParticipants = [], refetch: refetchParticipants } = useQuery({
    queryKey: ["active-session-participants", sessionId],
    queryFn: () => entities.SessionParticipant.filter({ session_id: sessionId }),
    refetchInterval: 2500,
    enabled: !isDemo,
  });

  const { data: dbMessages = [] } = useQuery({
    queryKey: ["room-messages", sessionId],
    queryFn: () => entities.RoomMessage.filter({ room_id: sessionId }),
    refetchInterval: 1500,
    enabled: !isDemo,
  });

  const { data: teacherSubjects = [] } = useQuery({
    queryKey: ["teacher-subjects-all"],
    queryFn: () => entities.Subject.list("-created_at"),
    enabled: isDemo,
  });

  const { data: virtualSessions = [], refetch: refetchSessions } = useQuery({
    queryKey: ["virtual-sessions"],
    queryFn: () => entities.VirtualSession.list("-created_at"),
    enabled: isDemo,
  });

  const { data: session = null } = useQuery({
    queryKey: ["virtual-session", sessionId],
    queryFn: async () => {
      try {
        if (!isValidUUID(id)) throw new Error("Mock");
        return await entities.VirtualSession.get(id);
      } catch {
        return {
          id,
          title: isRTL ? "مقدمة في الجبر والكسور" : "Introduction to Algebra",
          subject_name: isRTL ? "الرياضيات" : "Mathematics",
          teacher_name: isRTL ? "أ. أحمد الغامدي" : "Mr. Ahmad Al-Ghamdi",
          room_name: `math-room-${id}`,
          status: "active",
        };
      }
    },
    enabled: !isDemo,
  });

  const [newSession, setNewSession] = useState({
    title: "",
    subject_id: "",
    scheduled_at: "",
    scheduled_time: "",
  });

  // Delete flow state: the session pending confirmation + the one being deleted.
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Live-class start: open Google Meet as host + copy link / notify students.
  const [liveModal, setLiveModal] = useState(null);
  const [liveLink, setLiveLink] = useState("");
  const [liveNotifying, setLiveNotifying] = useState(false);
  const [liveNotified, setLiveNotified] = useState(null);

  // A class can be deleted by the school admin/founder (any class in the
  // school) or by the teacher who owns it. Ended/old classes are the main
  // target, but the backend guard is the real authorisation.
  const canDeleteSession = (si) => {
    if (role === "founder") return true;
    if (isAdmin) return true;
    if (isTeacher) return String(si?.teacher_id || "") === String(userId);
    return false;
  };

  const handleDeleteSession = async (session) => {
    if (!session?.id) return;
    setDeletingId(session.id);
    try {
      await deleteVirtualClass(session.id);
      // Immediate UI update: drop the row from the cached list (no reload).
      qc.setQueryData(["virtual-sessions"], (old = []) =>
        (Array.isArray(old) ? old : []).filter((s) => s.id !== session.id)
      );
      setConfirmDelete(null);
      toast.success(isRTL ? "تم حذف الحصة الافتراضية بنجاح" : "Virtual class deleted successfully");
    } catch (err) {
      console.error("Failed to delete virtual class:", err);
      toast.error((isRTL ? "تعذر حذف الحصة: " : "Failed to delete class: ") + (err?.message || ""));
    } finally {
      setDeletingId(null);
    }
  };

  // ── Start a live class: create the session, open Google Meet as host, then
  //    let the teacher copy the link or save it and notify the class. ──
  const openLiveClass = async () => {
    if (!newSession.title) { toast.error(isRTL ? "أدخل عنوان الحصة" : "Enter session title"); return; }
    if (!newSession.subject_id) { toast.error(isRTL ? "اختر المادة الدراسية" : "Select a subject"); return; }
    const selectedSub = teacherSubjects.find((s) => s.id === newSession.subject_id);
    try {
      const res = await entities.VirtualSession.create({
        title: newSession.title,
        teacher_id: userId,
        teacher_name: userName,
        subject_id: newSession.subject_id,
        subject_name: selectedSub?.name || "",
        grade: selectedSub?.grade || "",
        room_name: `room-${Math.random().toString(36).substr(2, 9)}`,
        scheduled_at: new Date().toISOString(),
        started_at: new Date().toISOString(),
        status: "active",
        meet_link: "https://meet.google.com/new",
      });
      setLiveModal({ session: res, title: newSession.title, subjectName: selectedSub?.name || "", grade: selectedSub?.grade || "" });
      setLiveLink("https://meet.google.com/new");
      setLiveNotified(null);
      // Teacher-created meeting → the teacher is the host (full controls).
      window.open("https://meet.google.com/new", "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Failed to start session:", err);
      toast.error((isRTL ? "فشل بدء الحصة: " : "Failed to start session: ") + (err?.message || ""));
    }
  };

  const copyLiveLink = async () => {
    const link = liveLink.trim() || "https://meet.google.com/new";
    try {
      await navigator.clipboard.writeText(link);
      toast.success(isRTL ? "تم نسخ رابط الاجتماع" : "Meeting link copied");
    } catch {
      toast.error(isRTL ? "تعذر النسخ" : "Copy failed");
    }
  };

  const notifyLiveStudents = async () => {
    if (!liveModal?.session) return;
    const link = liveLink.trim() || "https://meet.google.com/new";
    setLiveNotifying(true);
    try {
      await entities.VirtualSession.update(liveModal.session.id, { meet_link: link }).catch(() => {});
      let sent = 0;
      if (liveModal.grade) {
        const students = await entities.Student.filter({ grade: String(liveModal.grade) }).catch(() => []);
        const results = await Promise.allSettled(
          (students || []).map((st) =>
            entities.PortalNotification.create({
              user_id: st.id,
              type: "class_started",
              title: isRTL ? `بدأت الحصة: ${liveModal.title}` : `Class started: ${liveModal.title}`,
              message: isRTL
                ? `${userName} بدأ حصة ${liveModal.subjectName || ""}. انضم من الرابط: ${link}`
                : `${userName} started a ${liveModal.subjectName || ""} class. Join: ${link}`,
              link: `/virtual-classroom/${liveModal.session.id}`,
              is_read: false,
            }).catch(() => null)
          )
        );
        sent = results.filter((r) => r.status === "fulfilled" && r.value).length;
      }
      setLiveNotified(sent);
      qc.invalidateQueries({ queryKey: ["virtual-sessions"] });
      toast.success(isRTL ? `تم حفظ الحصة وإشعار ${sent} طالب` : `Class saved, notified ${sent} students`);
    } catch (err) {
      console.error("Notify students failed:", err);
      toast.error(isRTL ? "تعذر إرسال الإشعارات" : "Failed to notify students");
    } finally {
      setLiveNotifying(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  Participants list from DB
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isDemo) return;
    const myPhoto = photoMap[String(userId)] || user?.photo_url || null;
    if (activeParticipants.length > 0) {
      const activeOnly = activeParticipants.filter((p) => !p.left_at);
      const unique = [];
      const seen = new Set();
      for (const p of activeOnly) {
        if (!seen.has(p.user_id)) { seen.add(p.user_id); unique.push(p); }
      }
      const mapped = unique.map((p) => ({
        id: p.user_id,
        name: p.user_name,
        role: p.role,
        mic: p.user_id === userId ? micActive : (p.mic_active === undefined ? true : Boolean(p.mic_active)),
        video: p.user_id === userId ? videoActive : (p.video_active === undefined ? true : Boolean(p.video_active)),
        hand: p.user_id === userId ? handRaised : (p.hand_raised === undefined ? false : Boolean(p.hand_raised)),
        avatar: p.role === "teacher" ? "👨‍🏫" : "🧑‍🎓",
        photo: p.user_id === userId ? myPhoto : (photoMap[String(p.user_id)] || null),
      }));
      if (!mapped.some((p) => p.id === userId)) {
        mapped.push({ id: userId, name: userName, role, mic: micActive, video: videoActive, hand: handRaised, avatar: isTeacher ? "👨‍🏫" : "🧑‍🎓", photo: myPhoto });
      }
      setParticipants(mapped);
    } else {
      setParticipants([{ id: userId, name: userName, role, mic: micActive, video: videoActive, hand: handRaised, avatar: isTeacher ? "👨‍🏫" : "🧑‍🎓", photo: myPhoto }]);
    }
  }, [activeParticipants, userId, userName, role, micActive, videoActive, handRaised, isDemo, photoMap, user]);

  // ─────────────────────────────────────────────────────────────────────────
  //  DB participant registration
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isDemo) return;
    let active = true;
    let participantId = null;

    const register = async () => {
      try {
        const existing = await entities.SessionParticipant.filter({ session_id: sessionId, user_id: userId });
        for (const p of existing.filter((p) => !p.left_at)) {
          await entities.SessionParticipant.update(p.id, { left_at: new Date().toISOString() }).catch(() => {});
        }
        const res = await entities.SessionParticipant.create({
          session_id: sessionId,
          user_id: userId,
          user_name: userName,
          role,
          joined_at: new Date().toISOString(),
          mic_active: micActive,
          video_active: videoActive,
          hand_raised: handRaised,
        });
        if (res?.id && active) { participantId = res.id; setMyParticipantId(res.id); }
        refetchParticipants();
      } catch (err) {
        console.error("Participant registration failed:", err);
      }
    };
    register();

    return () => {
      active = false;
      if (participantId) {
        entities.SessionParticipant.update(participantId, { left_at: new Date().toISOString() }).catch(() => {});
      }
    };
  }, [sessionId, userId, userName, role, isDemo]);

  // ─────────────────────────────────────────────────────────────────────────
  //  Local media stream
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isDemo) return;
    let stream = null;
    const init = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        stream.getVideoTracks().forEach((t) => (t.enabled = videoActive));
        stream.getAudioTracks().forEach((t) => (t.enabled = micActive));
      } catch (err) {
        console.error("Media access error:", err);
        toast.error(isRTL ? "تعذّر الوصول للكاميرا/الميكروفون. تحقق من الأذونات." : "Cannot access camera/microphone. Check permissions.");
      }
    };
    init();
    return () => { if (stream) stream.getTracks().forEach((t) => t.stop()); };
  }, [isDemo]);

  // ── Call duration timer ──
  useEffect(() => {
    if (isDemo) return;
    const timer = setInterval(() => {
      setCallDuration((c) => c + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isDemo]);

  const formatCallDuration = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) {
      return `${hrs}:${String(mins % 60).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // ── Web Audio API Visualizer for local mic volume & Active Speaker detection ──
  useEffect(() => {
    if (!localStream || !micActive) {
      setMicVolume(0);
      setIsLocalSpeaking(false);
      return;
    }

    const audioTracks = localStream.getAudioTracks();
    if (audioTracks.length === 0) return;

    let audioCtx = null;
    let analyser = null;
    let source = null;
    let rafId = null;

    try {
      const AudioCtxClass = window.AudioContext || window["webkitAudioContext"];
      if (!AudioCtxClass) return;
      audioCtx = new AudioCtxClass();
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.4;
      source = audioCtx.createMediaStreamSource(localStream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let lastSpeaking = false;

      const checkVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const vol = Math.min(100, Math.round((avg / 128) * 100));
        setMicVolume(vol);

        const speaking = vol > 12;
        if (speaking !== lastSpeaking) {
          lastSpeaking = speaking;
          setIsLocalSpeaking(speaking);
          wsSignaling.sendSpeakingState(speaking);
        }

        rafId = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (e) {
      console.warn("AudioContext visualizer error:", e);
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (audioCtx && audioCtx.state !== "closed") {
        audioCtx.close().catch(() => {});
      }
    };
  }, [localStream, micActive, wsSignaling]);

  // Sync mic / video track enabled state
  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach((t) => (t.enabled = micActive));
    }
  }, [micActive, localStream]);

  useEffect(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach((t) => (t.enabled = videoActive));
    }
  }, [videoActive, localStream]);

  const toggleMic = () => {
    const next = !micActive;
    setMicActive(next);
    if (localStream) {
      localStream.getAudioTracks().forEach((t) => (t.enabled = next));
    }
    wsSignaling.sendMediaToggle("audio", next);
  };

  const toggleVideo = () => {
    const next = !videoActive;
    setVideoActive(next);
    if (localStream) {
      localStream.getVideoTracks().forEach((t) => (t.enabled = next));
    }
    wsSignaling.sendMediaToggle("video", next);
  };

  const toggleHand = () => {
    const next = !handRaised;
    setHandRaised(next);
    wsSignaling.sendMediaToggle("hand", next);
    if (next) {
      toast.info(isRTL ? "تم رفع اليد 🙋‍♂️" : "Hand raised 🙋‍♂️");
    }
  };


  // ─────────────────────────────────────────────────────────────────────────
  //  Screen sharing — uses replaceTrack (no renegotiation needed)
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isDemo) return;
    let currentScreenStream = null;

    const toggle = async () => {
      if (screenSharing) {
        // Show the teacher's own screen in the main black frame
        setPinnedParticipantId(userId);
        try {
          currentScreenStream = await navigator.mediaDevices.getDisplayMedia({
            video: { frameRate: { ideal: 30, max: 30 }, width: { ideal: 1920 }, height: { ideal: 1080 } },
            audio: true,
          });
          setScreenStream(currentScreenStream);

          const screenVideoTrack = currentScreenStream.getVideoTracks()[0];

          // Replace the video track on every active peer connection
          // replaceTrack() works WITHOUT renegotiation — the receiver sees it instantly
          const replaceJobs = Object.values(pcsRef.current).map(async (pc) => {
            const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
            if (sender) {
              await sender.replaceTrack(screenVideoTrack);
            } else {
              pc.addTrack(screenVideoTrack, currentScreenStream);
            }
          });
          await Promise.all(replaceJobs);

          // Signal peers: pin this user's stream full-screen
          sendSignal("SCREEN_SHARE", null, { active: true, sharerId: userId });

          // When the user stops via browser's stop button
          screenVideoTrack.onended = () => setScreenSharing(false);

        } catch (err) {
          if (err.name !== "NotAllowedError") console.error("Screen share error:", err);
          setScreenSharing(false);
        }
      } else {
        // Restore camera track on every active peer connection
        if (localStream) {
          const cameraTrack = localStream.getVideoTracks()[0];
          if (cameraTrack) {
            const restoreJobs = Object.values(pcsRef.current).map(async (pc) => {
              const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
              if (sender) await sender.replaceTrack(cameraTrack);
            });
            await Promise.all(restoreJobs);
          }
        } else {
          // If there is no camera, remove the screen track completely
          Object.values(pcsRef.current).forEach((pc) => {
            const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
            if (sender) pc.removeTrack(sender);
          });
        }
        if (screenStream) {
          screenStream.getTracks().forEach((t) => t.stop());
          setScreenStream(null);
        }
        setPinnedParticipantId((prev) => (prev === userId ? null : prev));
        sendSignal("SCREEN_SHARE", null, { active: false, sharerId: userId });
      }
    };

    toggle();
    return () => { if (currentScreenStream) currentScreenStream.getTracks().forEach((t) => t.stop()); };
  }, [screenSharing, isDemo]);

  // ─────────────────────────────────────────────────────────────────────────
  //  Signaling helpers
  // ─────────────────────────────────────────────────────────────────────────
  const sendSignal = (type, targetId, data) => {
    if (!wsSignaling.isConnected) {
      console.warn('[WebRTC] Signaling not connected, cannot send:', type);
      return;
    }
    // targetId=null means broadcast to all in room
    wsSignaling.sendSignal(targetId === null ? 'all' : targetId, { type, data });
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  RTCPeerConnection factory  (uses fetched TURN + STUN)
  // ─────────────────────────────────────────────────────────────────────────
  const getOrCreatePC = (peerId) => {
    if (pcsRef.current[peerId]) return pcsRef.current[peerId];

    const pc = new RTCPeerConnection({ iceServers: iceConfig?.iceServers || [] });
    pcsRef.current[peerId] = pc;

    pc.onnegotiationneeded = async () => {
      try {
        makingOfferRef.current[peerId] = true;
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendSignal("OFFER", peerId, offer);
      } catch (err) {
        console.error("Negotiation error:", err);
      } finally {
        makingOfferRef.current[peerId] = false;
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) sendSignal("ICE", peerId, event.candidate);
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[WebRTC] ICE state with ${peerId}: ${pc.iceConnectionState}`);
    };

    // ontrack fires for every incoming track.
    pc.ontrack = (event) => {
      const stream = event.streams[0];
      if (!stream) return;
      // Always update to ensure video element gets the latest stream reference
      setRemoteStreams((prev) => ({ ...prev, [peerId]: stream }));
      // Apply current volume to newly connected remote video element
      const el = remoteVideoRefs.current[peerId];
      if (el) { el.volume = remoteVolume; el.muted = false; el.play().catch(() => {}); }
    };

    // Add currently active tracks (camera or screen share) immediately if available
    const currentActiveStream = activeStreamRef.current || localStreamRef.current;
    if (currentActiveStream) {
      currentActiveStream.getTracks().forEach((track) => pc.addTrack(track, currentActiveStream));
    }

    return pc;
  };

  // Sync volume to all remote video elements when remoteVolume changes
  useEffect(() => {
    Object.values(remoteVideoRefs.current).forEach((el) => {
      if (el) el.volume = remoteVolume;
    });
  }, [remoteVolume]);

  // Add local tracks to existing PCs when localStream is set late (async camera init)
  useEffect(() => {
    if (!localStream) return;
    Object.entries(pcsRef.current).forEach(([peerId, pc]) => {
      const senders = pc.getSenders();
      localStream.getTracks().forEach((track) => {
        if (!senders.some((s) => s.track?.kind === track.kind)) {
          pc.addTrack(track, localStream);
        }
      });
    });
  }, [localStream]);

  // ─────────────────────────────────────────────────────────────────────────
  //  Incoming signal handler
  // ─────────────────────────────────────────────────────────────────────────
  const handleIncomingSignal = async (type, peerId, data) => {
    const pc = getOrCreatePC(peerId);
    const isPolite = String(userId) < String(peerId);

    if (type === "OFFER") {
      const offerCollision = makingOfferRef.current[peerId] || pc.signalingState !== "stable";
      ignoreOfferRef.current[peerId] = !isPolite && offerCollision;
      
      if (ignoreOfferRef.current[peerId]) {
        return;
      }

      await pc.setRemoteDescription(new RTCSessionDescription(data));
      if (iceQueuesRef.current[peerId]) {
        for (const c of iceQueuesRef.current[peerId]) {
          await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
        }
        delete iceQueuesRef.current[peerId];
      }
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sendSignal("ANSWER", peerId, answer);

    } else if (type === "ANSWER") {
      await pc.setRemoteDescription(new RTCSessionDescription(data));
      if (iceQueuesRef.current[peerId]) {
        for (const c of iceQueuesRef.current[peerId]) {
          await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
        }
        delete iceQueuesRef.current[peerId];
      }

    } else if (type === "ICE") {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(data));
      } catch (err) {
        if (!ignoreOfferRef.current[peerId]) {
          if (!iceQueuesRef.current[peerId]) iceQueuesRef.current[peerId] = [];
          iceQueuesRef.current[peerId].push(data);
        }
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
      if (canvas) canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

    } else if (type === "PRESENTATION_MODE") {
      if (data?.mode) setPresentationMode(data.mode);

    } else if (type === "PRESENTATION_DATA") {
      setPresentationData(data);
      if (data?.imageUrl) setPresentationMode("file");
      else if (data?.videoUrl) setPresentationMode("video");

    } else if (type === "SCREEN_SHARE") {
      if (data.active) {
        // Auto-pin the screen sharer and show their stream as screen-share
        setPinnedParticipantId(peerId);
        setRemoteScreenSharing((prev) => ({ ...prev, [peerId]: true }));
        // Build a fresh MediaStream from the receiver's (now screen) track
        const pc = pcsRef.current[peerId];
        let screenStream = null;
        if (pc) {
          const receivers = pc.getReceivers();
          const videoReceiver = receivers.find((r) => r.track?.kind === "video");
          if (videoReceiver?.track) {
            screenStream = new MediaStream([videoReceiver.track]);
            const audioReceiver = receivers.find((r) => r.track?.kind === "audio");
            if (audioReceiver?.track) screenStream.addTrack(audioReceiver.track);
          }
        }
        if (screenStream) {
          setRemoteScreenStreams((prev) => ({ ...prev, [peerId]: screenStream }));
          // Also update remoteStreams so the main black frame displays it
          setRemoteStreams((prev) => ({ ...prev, [peerId]: screenStream }));
        } else {
          setRemoteScreenStreams((prev) => ({ ...prev, [peerId]: prev[peerId] || remoteStreams[peerId] || null }));
        }
        // Retry once after a short delay in case replaceTrack hasn't propagated yet
        setTimeout(() => {
          const pc2 = pcsRef.current[peerId];
          if (!pc2) return;
          const r2 = pc2.getReceivers().find((r) => r.track?.kind === "video");
          if (r2?.track) {
            const s2 = new MediaStream([r2.track]);
            const a2 = pc2.getReceivers().find((r) => r.track?.kind === "audio");
            if (a2?.track) s2.addTrack(a2.track);
            setRemoteScreenStreams((prev) => ({ ...prev, [peerId]: s2 }));
            setRemoteStreams((prev) => ({ ...prev, [peerId]: s2 }));
          }
        }, 1000);
      } else {
        setPinnedParticipantId((prev) => (prev === peerId ? null : prev));
        setRemoteScreenSharing((prev) => ({ ...prev, [peerId]: false }));
        setRemoteScreenStreams((prev) => {
          const next = { ...prev };
          delete next[peerId];
          return next;
        });
      }
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  Process incoming WS signals and Drawing events
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isDemo) return;

    // استقبال قائمة المشتركين المتواجدين مسبقاً في الغرفة
    wsSignaling.onRoomUsers((existingPeers) => {
      console.log("[WebRTC] Roster received:", existingPeers);
      existingPeers.forEach((p) => {
        if (p.userId && String(p.userId) !== String(userId)) {
          getOrCreatePC(p.userId);
        }
      });
    });

    // استقبال إشارة WebRTC (Offer, Answer, ICE)
    wsSignaling.onSignal((senderId, payload) => {
      const { type, data } = payload || {};
      handleIncomingSignal(type, senderId, data);
    });

    // انضمام مستخدم جديد للحصة
    wsSignaling.onUserJoined((newUserData) => {
      const newUserId = typeof newUserData === "object" ? newUserData.userId : newUserData;
      if (!newUserId || String(userId) === String(newUserId)) return;
      
      const newUserName = typeof newUserData === "object" ? newUserData.userName : "مشارك";
      toast.info(isRTL ? `انضم ${newUserName} للحصة` : `${newUserName} joined the class`);

      if (String(userId) > String(newUserId)) {
        const offerKey = `${userId}->${newUserId}`;
        if (offersInitiated.current.has(offerKey)) return;
        const pc = getOrCreatePC(newUserId);
        if (pc.signalingState !== "stable") return;
        offersInitiated.current.add(offerKey);
        pc.createOffer()
          .then((offer) => pc.setLocalDescription(offer).then(() => sendSignal("OFFER", newUserId, offer)))
          .catch((err) => {
            console.error("Manual offer failed:", err);
            offersInitiated.current.delete(offerKey);
          });
      } else {
        getOrCreatePC(newUserId);
      }
    });

    // خروج أو انقطاع اتصال مستخدم
    wsSignaling.onUserLeft((leftUserId) => {
      console.log("[WebRTC] Peer left:", leftUserId);
      if (pcsRef.current[leftUserId]) {
        try { pcsRef.current[leftUserId].close(); } catch (_) {}
        delete pcsRef.current[leftUserId];
      }
      setRemoteStreams((prev) => {
        const next = { ...prev };
        delete next[leftUserId];
        return next;
      });
      setRemoteScreenStreams((prev) => {
        const next = { ...prev };
        delete next[leftUserId];
        return next;
      });
      setRemoteScreenSharing((prev) => {
        const next = { ...prev };
        delete next[leftUserId];
        return next;
      });
      setSpeakingUsers((prev) => {
        const next = { ...prev };
        delete next[leftUserId];
        return next;
      });
      setPinnedParticipantId((prev) => (prev === leftUserId ? null : prev));
    });

    // مزامنة أجهزة الوسائط (كتم المايك، إيقاف الكاميرا، مشاركة الشاشة، رفع اليد)
    wsSignaling.onMediaToggle((data) => {
      const { userId: peerId, type, status } = data || {};
      if (!peerId || String(peerId) === String(userId)) return;

      if (type === "audio") {
        setParticipants((prev) =>
          prev.map((p) => (String(p.id) === String(peerId) ? { ...p, mic: status } : p))
        );
      } else if (type === "video") {
        setParticipants((prev) =>
          prev.map((p) => (String(p.id) === String(peerId) ? { ...p, video: status } : p))
        );
      } else if (type === "screen") {
        setRemoteScreenSharing((prev) => ({ ...prev, [peerId]: status }));
        if (status) {
          setPinnedParticipantId(peerId);
        } else {
          setPinnedParticipantId((prev) => (prev === peerId ? null : prev));
        }
      } else if (type === "hand") {
        setParticipants((prev) =>
          prev.map((p) => (String(p.id) === String(peerId) ? { ...p, hand: status } : p))
        );
        if (status) {
          const person = participants.find((p) => String(p.id) === String(peerId));
          toast.info(isRTL ? `${person?.name || "مشارك"} رفع يده 🙋‍♂️` : `${person?.name || "Participant"} raised hand 🙋‍♂️`);
        }
      }
    });

    // مزامنة حالة التحدث الحقيقي (Active Speaker)
    wsSignaling.onSpeakingState((data) => {
      const { userId: peerId, isSpeaking } = data || {};
      if (peerId && String(peerId) !== String(userId)) {
        setSpeakingUsers((prev) => ({ ...prev, [peerId]: isSpeaking }));
      }
    });

    // إنهاء الحصة من قبل المعلم لجميع الطلاب
    wsSignaling.onClassEnded((data) => {
      toast.warning(isRTL ? `قام المعلم ${data?.teacherName || ""} بإنهاء الحصة الدراسية` : `Class has been ended by the teacher`);
      setTimeout(() => {
        navigate(role === "student" ? "/student-portal" : "/teacher-portal");
      }, 1500);
    });

    // أحداث اللوح الذكي (Drawing)
    wsDrawing.onDrawEvent((data) => {
      if (data.type === 'draw') {
        const payload = data.payload;
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d");
          ctx.beginPath();
          ctx.globalCompositeOperation = payload.isEraser ? "destination-out" : "source-over";
          ctx.strokeStyle = payload.color || "#2dd4bf";
          ctx.lineWidth = payload.width || 3;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.moveTo(payload.prevX * canvas.width, payload.prevY * canvas.height);
          ctx.lineTo(payload.currX * canvas.width, payload.currY * canvas.height);
          ctx.stroke();
        }
      } else if (data.type === 'clear-canvas') {
        const canvas = canvasRef.current;
        if (canvas) canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
      }
    });

  }, [isDemo, wsSignaling, wsDrawing, userId, isRTL, navigate, role, participants]);


  // ─────────────────────────────────────────────────────────────────────────
  //  Initiate connections when participant list changes
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isDemo || !wsSignaling.isConnected) return;
    participants.forEach((p) => {
      if (p.id !== userId) {
        getOrCreatePC(p.id);
      }
    });
  }, [participants, isDemo, wsSignaling.isConnected]);

  // ─────────────────────────────────────────────────────────────────────────
  //  Whiteboard
  // ─────────────────────────────────────────────────────────────────────────
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    lastPointRef.current = {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
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
    const { x: prevX, y: prevY } = lastPointRef.current;

    ctx.beginPath();
    ctx.globalCompositeOperation = isEraser ? "destination-out" : "source-over";
    ctx.strokeStyle = isEraser ? "rgba(0,0,0,1)" : drawColor;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.moveTo(prevX, prevY);
    ctx.lineTo(currX, currY);
    ctx.stroke();

    wsDrawing.sendDrawEvent({
      prevX: prevX / canvas.width,
      prevY: prevY / canvas.height,
      currX: currX / canvas.width,
      currY: currY / canvas.height,
      isEraser,
      color: isEraser ? "rgba(0,0,0,1)" : drawColor,
      width: lineWidth,
    });

    lastPointRef.current = { x: currX, y: currY };
  };

  const endDrawing = () => { setIsDrawing(false); lastPointRef.current = null; };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    wsDrawing.clearCanvas();
  };

  // Canvas resize observer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        canvas.width = e.contentRect.width || 800;
        canvas.height = e.contentRect.height || 500;
      }
    });
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    return () => ro.disconnect();
  }, [presentationMode]);

  // ─────────────────────────────────────────────────────────────────────────
  //  Controls
  // ─────────────────────────────────────────────────────────────────────────
  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;
    const text = chatMessage;
    setChatMessage("");
    try {
      await entities.RoomMessage.create({
        room_id: sessionId,
        sender_name: userName,
        sender_id: userId,
        content: text,
        type: "text",
      });
      qc.invalidateQueries({ queryKey: ["room-messages", sessionId] });
    } catch (err) {
      console.error("Message send failed:", err);
    }
  };

  const handleEndClass = async (endForAll = false) => {
    if (isTeacher && endForAll) {
      if (confirm(isRTL ? "هل ترغب في إنهاء الحصة لجميع الطلاب وإغلاق الغرفة؟" : "End session for all students and close room?")) {
        try {
          await entities.VirtualSession.update(id, { status: "ended", ended_at: new Date().toISOString() });
        } catch {}
        wsSignaling.endClassForAll();
        toast.success(isRTL ? "تم إنهاء الحصة لجميع الطلاب." : "Session ended for all.");
        navigate("/teacher-portal");
      }
    } else if (isTeacher) {
      if (confirm(isRTL ? "هل ترغب بمغادرة الحصة فقط وإبقائها مفتوحة للطلاب؟" : "Leave session and keep it open?")) {
        navigate("/teacher-portal");
      }
    } else if (isAdmin) {
      navigate("/admin-virtual-classrooms");
    } else {
      toast.info(isRTL ? "غادرت الحصة الدراسية." : "You left the session.");
      navigate("/student-portal");
    }
  };


  const handleStartSession = async (sessionItem) => {
    try {
      await entities.VirtualSession.update(sessionItem.id, { status: "active", started_at: new Date().toISOString() });
      toast.success(isRTL ? "تم بدء الحصة!" : "Session started!");
      // Notify assigned students that the lesson has started
      try {
        const selectedSub = teacherSubjects.find((s) => s.id === sessionItem.subject_id);
        const grade = selectedSub?.grade || sessionItem.grade;
        if (grade) {
          const students = await entities.Student.filter({ grade: String(grade) }).catch(() => []);
          await Promise.allSettled(
            (students || []).map((st) =>
              entities.PortalNotification.create({
                user_id: st.id,
                type: "class_started",
                title: isRTL ? `بدأت الحصة: ${sessionItem.title}` : `Class started: ${sessionItem.title}`,
                message: isRTL
                  ? `${userName} بدأ حصة ${sessionItem.subject_name || ""}. انضم الآن!`
                  : `${userName} started a ${sessionItem.subject_name || ""} class. Join now!`,
                link: `/virtual-classroom/${sessionItem.id}`,
                is_read: false,
              }).catch(() => null)
            )
          );
        }
      } catch (notifErr) {
        console.error("Notify students failed:", notifErr);
      }
      navigate(`/virtual-classroom/${sessionItem.id}`);
    } catch { toast.error(isRTL ? "فشل بدء الحصة" : "Failed to start session"); }
  };

  const handleScheduleSession = async () => {
    if (!newSession.title || !newSession.subject_id || !newSession.scheduled_at || !newSession.scheduled_time) {
      toast.error(isRTL ? "يرجى ملء جميع الحقول" : "Please fill all fields");
      return;
    }
    const selectedSub = teacherSubjects.find((s) => s.id === newSession.subject_id);
    const roomName = `room-${Math.random().toString(36).substr(2, 9)}`;
    const scheduledDateTime = new Date(`${newSession.scheduled_at}T${newSession.scheduled_time}`).toISOString();
    try {
      await entities.VirtualSession.create({
        title: newSession.title,
        teacher_id: userId,
        teacher_name: userName,
        subject_id: newSession.subject_id,
        subject_name: selectedSub?.name || "",
        grade: selectedSub?.grade || "",
        room_name: roomName,
        scheduled_at: scheduledDateTime,
        status: "scheduled",
      });
      toast.success(isRTL ? "تم جدولة الحصة!" : "Session scheduled!");
      setNewSession({ title: "", subject_id: "", scheduled_at: "", scheduled_time: "" });
      refetchSessions();
    } catch { toast.error(isRTL ? "فشل الجدولة" : "Failed to schedule"); }
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  Camera card sizing
  // ─────────────────────────────────────────────────────────────────────────
  const getCameraCardClass = () => {
    const n = participants.length;
    if (n > 4) return "relative aspect-video w-32 lg:w-[80%] mx-auto rounded-xl bg-stone-850 border border-white/5 shadow-md overflow-hidden group shrink-0 transition-all duration-300";
    if (n > 2) return "relative aspect-video w-40 lg:w-[90%] mx-auto rounded-2xl bg-stone-850 border border-white/5 shadow-md overflow-hidden group shrink-0 transition-all duration-300";
    return "relative aspect-video w-48 lg:w-full rounded-2xl bg-stone-850 border border-white/5 shadow-md overflow-hidden group shrink-0 transition-all duration-300";
  };

  // The local active stream: screen share takes priority for the sender's own preview
  const activeStream = screenSharing && screenStream ? screenStream : localStream;

  const chatMessages = dbMessages.filter((msg) => {
    const text = msg.content || msg.message_text || "";
    return !text.startsWith("SIGNAL:") && msg.type !== "signal";
  });

  useEffect(() => {
    if (activeTab === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, activeTab]);

  // ─────────────────────────────────────────────────────────────────────────
  //  DEMO PAGE
  // ─────────────────────────────────────────────────────────────────────────
  if (isDemo) {
    return (
      <div className="min-h-screen bg-stone-950 text-white flex flex-col font-sans" dir={isRTL ? "rtl" : "ltr"}>
        <header className="h-16 px-6 bg-stone-900 border-b border-stone-800 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Video size={18} />
            </div>
            <div>
              <h1 className="text-sm font-extrabold">{isRTL ? "الفصول الافتراضية الذكية" : "Smart Virtual Classrooms"}</h1>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                {isRTL ? "منصة التعليم والجدولة المباشرة" : "Live Learning & Scheduling Hub"}
              </p>
            </div>
          </div>
          <span className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl text-[10px] font-bold border border-white/5">
            {userName} ({isTeacher ? (isRTL ? "معلم" : "Teacher") : (isRTL ? "طالب" : "Student")})
          </span>
        </header>

        <div className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-y-auto">
          {isTeacher && (
            <div className="lg:col-span-5 space-y-6">
              {/* Instant session */}
              <Card className="p-6 bg-stone-900/60 border border-white/5 rounded-[32px] shadow-2xl relative overflow-hidden backdrop-blur-md">
                <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl" />
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
                  {isRTL ? "بدء حصة افتراضية فورية" : "Start Instant Live Class"}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-stone-200 uppercase block mb-1.5">{isRTL ? "عنوان الحصة" : "Session Title"}</label>
                    <Input placeholder={isRTL ? "مثال: مراجعة الجبر" : "e.g. Algebra Review"} value={newSession.title} onChange={(e) => setNewSession({ ...newSession, title: e.target.value })} className="!bg-stone-850 !text-white border-white/5 text-xs rounded-xl" style={{ backgroundColor: "#1c1917", color: "#ffffff" }} />
                  </div>
                  <div>
                    <label htmlFor="field-virtualclassroom-instant-subject-id" className="text-[10px] font-bold text-stone-200 uppercase block mb-1.5">{isRTL ? "المادة الدراسية" : "Subject"}</label>
                    <select id="field-virtualclassroom-instant-subject-id" name="subject_id" aria-label="instant subject id" value={newSession.subject_id} onChange={(e) => setNewSession({ ...newSession, subject_id: e.target.value })} className="w-full border border-white/5 text-xs text-white rounded-xl p-2.5 focus:outline-none" style={{ backgroundColor: "#1c1917", color: "#ffffff" }}>
                      <option value="">{isRTL ? "اختر المادة..." : "Select Subject..."}</option>
                      {teacherSubjects.length === 0 && <option value="" disabled>{isRTL ? "جارٍ التحميل..." : "Loading..."}</option>}
                      {teacherSubjects.map((sub) => <option key={sub.id} value={sub.id} style={{ backgroundColor: "#1c1917" }}>{sub.name}{sub.grade ? ` (${sub.grade})` : ""}</option>)}
                    </select>
                  </div>
                  <button
                    onClick={openLiveClass}
                    className="w-full h-11 bg-teal-500 hover:bg-teal-400 text-stone-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Video size={16} />
                    {isRTL ? "بدء البث المباشر الآن" : "Start Live Now"}
                  </button>
                </div>
              </Card>

              {/* Schedule */}
              <Card className="p-6 bg-stone-900/60 border border-white/5 rounded-[32px] shadow-2xl relative overflow-hidden backdrop-blur-md">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl" />
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                  {isRTL ? "جدولة حصة افتراضية" : "Schedule Virtual Class"}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-stone-200 uppercase block mb-1.5">{isRTL ? "عنوان الحصة" : "Session Title"}</label>
                    <Input placeholder={isRTL ? "مثال: مقدمة في الخوارزميات" : "e.g. Intro to Algorithms"} value={newSession.title} onChange={(e) => setNewSession({ ...newSession, title: e.target.value })} className="!bg-stone-850 !text-white border-white/5 text-xs rounded-xl" style={{ backgroundColor: "#1c1917", color: "#ffffff" }} />
                  </div>
                  <div>
                    <label htmlFor="field-virtualclassroom-schedule-subject-id" className="text-[10px] font-bold text-stone-200 uppercase block mb-1.5">{isRTL ? "المادة الدراسية" : "Subject"}</label>
                    <select id="field-virtualclassroom-schedule-subject-id" name="subject_id" aria-label="schedule subject id" value={newSession.subject_id} onChange={(e) => setNewSession({ ...newSession, subject_id: e.target.value })} className="w-full border border-white/5 text-xs text-white rounded-xl p-2.5 focus:outline-none" style={{ backgroundColor: "#1c1917", color: "#ffffff" }}>
                      <option value="">{isRTL ? "اختر المادة..." : "Select Subject..."}</option>
                      {teacherSubjects.length === 0 && <option value="" disabled>{isRTL ? "جارٍ التحميل..." : "Loading..."}</option>}
                      {teacherSubjects.map((sub) => <option key={sub.id} value={sub.id} style={{ backgroundColor: "#1c1917" }}>{sub.name}{sub.grade ? ` (${sub.grade})` : ""}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="field-virtualclassroom-scheduled-at" className="text-[10px] font-bold text-stone-200 uppercase block mb-1.5">{isRTL ? "التاريخ" : "Date"}</label>
                      <input id="field-virtualclassroom-scheduled-at" name="scheduled_at" aria-label="scheduled at" type="date" value={newSession.scheduled_at} onChange={(e) => setNewSession({ ...newSession, scheduled_at: e.target.value })} className="w-full border border-white/5 text-xs text-white rounded-xl p-2.5 focus:outline-none" style={{ backgroundColor: "#1c1917", color: "#ffffff", colorScheme: "dark" }} />
                    </div>
                    <div>
                      <label htmlFor="field-virtualclassroom-scheduled-time" className="text-[10px] font-bold text-stone-200 uppercase block mb-1.5">{isRTL ? "الوقت" : "Time"}</label>
                      <input id="field-virtualclassroom-scheduled-time" name="scheduled_time" aria-label="scheduled time" type="time" value={newSession.scheduled_time} onChange={(e) => setNewSession({ ...newSession, scheduled_time: e.target.value })} className="w-full border border-white/5 text-xs text-white rounded-xl p-2.5 focus:outline-none" style={{ backgroundColor: "#1c1917", color: "#ffffff", colorScheme: "dark" }} />
                    </div>
                  </div>
                  <button onClick={handleScheduleSession} className="w-full h-11 bg-stone-850 hover:bg-stone-800 text-white font-bold border border-white/10 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer">
                    <Calendar size={16} className="text-amber-400" />
                    {isRTL ? "جدولة الحصة وحفظها" : "Schedule & Save Class"}
                  </button>
                </div>
              </Card>
            </div>
          )}

          {/* Session list */}
          <div className={isTeacher ? "lg:col-span-7 space-y-6" : "lg:col-span-12 space-y-6"}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-extrabold text-white">{isRTL ? "الحصص الافتراضية الحالية والقادمة" : "Current & Upcoming Virtual Classes"}</h2>
              <Badge className="bg-stone-800 text-stone-300 border-none rounded-full px-3 py-1 text-xs font-black">{virtualSessions.length} {isRTL ? "فصول" : "Sessions"}</Badge>
            </div>
            {virtualSessions.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center border border-dashed border-stone-850 rounded-[32px] text-stone-500">
                <AlertCircle size={40} className="text-stone-700 mb-3" />
                <p className="text-sm font-bold">{isRTL ? "لا توجد حصص مجدولة." : "No scheduled virtual classes."}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {virtualSessions.map((si) => {
                  const isActive = si.status === "active";
                  const isScheduled = si.status === "scheduled";
                  const isEnded = si.status === "ended";
                  return (
                    <Card key={si.id} className="p-6 bg-stone-900/40 border border-white/5 rounded-[28px] hover:bg-stone-900/70 transition-all duration-300 relative group overflow-hidden">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-bold text-white group-hover:text-teal-400 transition-colors">{si.title}</h4>
                            {isActive && <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider flex items-center gap-1 animate-pulse"><span className="h-1 w-1 rounded-full bg-emerald-400 inline-block" />{isRTL ? "نشط" : "LIVE"}</Badge>}
                            {isScheduled && <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-md text-[9px] font-black uppercase">{isRTL ? "مجدول" : "SCHEDULED"}</Badge>}
                            {isEnded && <Badge className="bg-stone-800 text-stone-500 border-none px-2 py-0.5 rounded-md text-[9px] font-black uppercase">{isRTL ? "منتهية" : "ENDED"}</Badge>}
                          </div>
                          <p className="text-xs text-stone-400">{si.subject_name} • {si.teacher_name}</p>
                          {(isScheduled || isActive) && si.scheduled_at && (
                            <p className="text-[10px] text-stone-500 font-bold flex items-center gap-1"><Clock size={10} />{new Date(si.scheduled_at).toLocaleString(isRTL ? "ar-EG" : "en-US")}</p>
                          )}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          {isActive && <button onClick={() => navigate(`/virtual-classroom/${si.id}`)} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-black rounded-xl flex items-center gap-1.5 cursor-pointer"><Video size={14} />{isRTL ? "دخول البث المباشر" : "Enter Live"}</button>}
                          {isScheduled && isTeacher && <button onClick={() => handleStartSession(si)} className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-stone-950 text-xs font-black rounded-xl flex items-center gap-1.5 cursor-pointer"><Video size={14} />{isRTL ? "بدء الآن" : "Start Now"}</button>}
                          {isScheduled && !isTeacher && <span className="px-3 py-1.5 bg-stone-850 text-stone-500 text-xs font-bold rounded-xl border border-white/5">{isRTL ? "انتظار المعلم" : "Awaiting Teacher"}</span>}
                          {isEnded && <span className="px-3 py-1.5 bg-stone-950 text-stone-600 text-xs font-bold rounded-xl">{isRTL ? "انتهى البث" : "Ended"}</span>}
                          {canDeleteSession(si) && (
                            <button
                              onClick={() => setConfirmDelete(si)}
                              disabled={deletingId === si.id}
                              title={isRTL ? "حذف الحصة" : "Delete class"}
                              className="px-3 py-2 bg-stone-900 hover:bg-rose-600 text-stone-500 hover:text-white text-xs font-black rounded-xl flex items-center gap-1.5 cursor-pointer border border-white/10 transition-all disabled:opacity-50"
                            >
                              <Trash2 size={14} />
                              {deletingId === si.id ? (isRTL ? "جارٍ الحذف…" : "Deleting…") : (isRTL ? "حذف" : "Delete")}
                            </button>
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

        {/* Delete confirmation dialog */}
        <Dialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
          <DialogContent className="max-w-md rounded-[28px] bg-stone-950 border-white/10" dir={isRTL ? "rtl" : "ltr"}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-white">
                <Trash2 size={18} className="text-rose-400" />
                {isRTL ? "تأكيد حذف الحصة الافتراضية" : "Delete virtual class"}
              </DialogTitle>
              <p className="text-stone-400 text-sm">
                {isRTL
                  ? `هل أنت متأكد من حذف حصة «${confirmDelete?.title}»؟ لا يمكن التراجع عن هذا الإجراء.`
                  : `Are you sure you want to delete "${confirmDelete?.title}"? This action cannot be undone.`}
              </p>
            </DialogHeader>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              <AlertCircle size={14} className="shrink-0" />
              <span>
                {isRTL
                  ? "ستُحذف الحصة وجميع رسائلها وسجلات حضورها نهائيًا."
                  : "This will permanently remove the class, its chat messages and attendance records."}
              </span>
            </div>
            <DialogFooter className="gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-stone-800 text-stone-200 hover:bg-stone-700 border border-white/10 cursor-pointer"
              >
                {isRTL ? "إلغاء" : "Cancel"}
              </button>
              <button
                onClick={() => handleDeleteSession(confirmDelete)}
                disabled={!!deletingId}
                className="px-4 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-500 text-white cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <Trash2 size={14} />
                {deletingId ? (isRTL ? "جارٍ الحذف…" : "Deleting…") : (isRTL ? "نعم، احذف" : "Yes, delete")}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Live class — host confirmation + copy link / notify students */}
        <Dialog open={!!liveModal} onOpenChange={(open) => !open && setLiveModal(null)}>
          <DialogContent className="max-w-md rounded-[28px] bg-stone-950 border-white/10" dir={isRTL ? "rtl" : "ltr"}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-white">
                <Video size={18} className="text-teal-400" />
                {isRTL ? "بدء حصة افتراضية مباشرة" : "Start Live Virtual Class"}
              </DialogTitle>
              <p className="text-stone-400 text-xs leading-relaxed">
                {isRTL
                  ? `تم فتح نافذة جديدة لإنشاء اجتماع Google Meet باسمك — ستدخل كمُنظِّم (Host) تلقائيًا، ما يمنحك كامل صلاحيات التحكم: الميكروفون، مشاركة الشاشة، وإدارة انضمام الطلاب.`
                  : `A new tab opened to create a Google Meet as you — you'll join as the host automatically, with full controls: microphone, screen sharing, and participant management.`}
              </p>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-200 uppercase">
                  {isRTL ? "رابط الاجتماع" : "Meeting link"}
                </label>
                <div className="flex gap-2">
                  <Input
                    value={liveLink}
                    onChange={(e) => setLiveLink(e.target.value)}
                    placeholder="https://meet.google.com/..."
                    className="!bg-stone-850 !text-white border-white/5 text-xs rounded-xl flex-1"
                    style={{ backgroundColor: "#1c1917", color: "#ffffff" }}
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={copyLiveLink}
                    className="inline-flex items-center gap-1.5 h-11 px-4 rounded-xl border border-white/10 bg-stone-850 text-stone-200 text-xs font-bold hover:bg-stone-800 cursor-pointer shrink-0"
                  >
                    <Copy size={14} />
                    {isRTL ? "نسخ" : "Copy"}
                  </button>
                </div>
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  {isRTL
                    ? "الصق رابط الاجتماع الفعلي من تبويب Google Meet المفتوح، ثم احفظه لإشعار طلاب هذا الفصل."
                    : "Paste the actual meeting link from the opened Google Meet tab, then save it to notify this class's students."}
                </p>
              </div>

              {liveNotified !== null && (
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  {isRTL ? `تم إرسال الإشعار إلى ${liveNotified} طالب` : `Notified ${liveNotified} students`}
                </div>
              )}

              <DialogFooter className="gap-2">
                <button
                  type="button"
                  onClick={() => window.open("https://meet.google.com/new", "_blank", "noopener,noreferrer")}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-stone-800 text-stone-200 hover:bg-stone-700 border border-white/10 cursor-pointer"
                >
                  {isRTL ? "فتح اجتماع جديد" : "Open new meeting"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/virtual-classroom/${liveModal?.session?.id}`)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-stone-800 text-stone-200 hover:bg-stone-700 border border-white/10 cursor-pointer"
                >
                  {isRTL ? "دخول الغرفة الداخلية" : "Enter live room"}
                </button>
                <button
                  type="button"
                  onClick={notifyLiveStudents}
                  disabled={liveNotifying}
                  className="px-4 py-2 rounded-xl text-xs font-black bg-teal-500 hover:bg-teal-400 text-stone-950 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Send size={14} />
                  {liveNotifying ? (isRTL ? "جارٍ الإرسال…" : "Sending…") : (isRTL ? "حفظ وإشعار الطلاب" : "Save & notify")}
                </button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  LIVE CLASSROOM (Google Meet Architecture & UI)
  // ─────────────────────────────────────────────────────────────────────────

  const activeRemoteSharerId = Object.keys(remoteScreenSharing).find((uid) => remoteScreenSharing[uid]);
  const spotlightId = pinnedParticipantId || (screenSharing ? userId : activeRemoteSharerId) || null;

  const allTiles = [
    {
      id: userId,
      isLocal: true,
      isMe: true,
      name: userName,
      role,
      photo: user?.photo_url || photoMap[String(userId)] || null,
      mic: micActive,
      video: videoActive,
      stream: screenSharing && screenStream ? screenStream : localStream,
      isSpeaking: isLocalSpeaking,
      isScreen: screenSharing,
      hand: handRaised
    },
    ...participants
      .filter((p) => String(p.id) !== String(userId))
      .map((p) => ({
        id: p.id,
        isLocal: false,
        isMe: false,
        name: p.name,
        role: p.role,
        photo: p.photo || photoMap[String(p.id)] || null,
        mic: p.mic !== undefined ? p.mic : true,
        video: p.video !== undefined ? p.video : true,
        stream: (remoteScreenSharing[p.id] && remoteScreenStreams[p.id]) || remoteStreams[p.id] || null,
        isSpeaking: Boolean(speakingUsers[p.id]),
        isScreen: Boolean(remoteScreenSharing[p.id]),
        hand: Boolean(p.hand)
      }))
  ];

  const getMeetGridCols = (count) => {
    if (count <= 1) return "grid-cols-1 max-w-4xl mx-auto";
    if (count === 2) return "grid-cols-1 md:grid-cols-2 max-w-6xl mx-auto";
    if (count <= 4) return "grid-cols-1 sm:grid-cols-2 max-w-6xl mx-auto";
    if (count <= 6) return "grid-cols-2 md:grid-cols-3 max-w-7xl mx-auto";
    if (count <= 9) return "grid-cols-2 sm:grid-cols-3 md:grid-cols-3 max-w-7xl mx-auto";
    return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 max-w-7xl mx-auto";
  };

  const renderVideoTile = (tile, isSpotlight = false) => {
    const isSpotlightUser = spotlightId === tile.id;

    return (
      <div
        key={tile.id}
        className={`relative bg-[#202124] rounded-2xl sm:rounded-3xl border border-white/5 overflow-hidden shadow-2xl flex items-center justify-center transition-all duration-300 group ${
          tile.isSpeaking
            ? "ring-2 ring-emerald-400 shadow-[0_0_25px_rgba(52,211,153,0.35)]"
            : "hover:border-white/20"
        } ${isSpotlight ? "w-full h-full min-h-[360px]" : "w-full aspect-video min-h-[160px]"}`}
      >
        {/* تيار الفيديو المباشر عبر WebRTC */}
        {tile.stream ? (
          <video
            ref={(el) => {
              if (tile.isLocal) {
                localVideoRef.current = el;
              } else {
                remoteVideoRefs.current[tile.id] = el;
              }
              if (el && tile.stream) {
                if (el.srcObject !== tile.stream) {
                  el.srcObject = tile.stream;
                }
                if (!tile.isLocal) {
                  el.volume = remoteVolume;
                  el.muted = false;
                }
                el.play().catch(() => {});
              }
            }}
            autoPlay
            playsInline
            muted={tile.isLocal}
            className={`w-full h-full ${
              tile.isScreen ? "object-contain bg-black" : "object-cover"
            } ${tile.isLocal && !tile.isScreen ? "scale-x-[-1]" : ""} ${
              tile.video ? "opacity-100" : "opacity-0 absolute pointer-events-none"
            }`}
          />
        ) : null}

        {/* واجهة إغلاق الكاميرا (Google Meet Avatar with Voice Waves) */}
        {(!tile.video || !tile.stream) && (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1e1e1e] to-[#121212] flex flex-col items-center justify-center p-4">
            {/* موجات صوتية نابضة عندما يتحدث المستخدم والكاميرا مغلقة */}
            {tile.isSpeaking && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="h-32 w-32 rounded-full border border-emerald-400/40 animate-ping absolute" />
                <span className="h-44 w-44 rounded-full border border-emerald-400/20 animate-pulse absolute" />
              </div>
            )}

            <div
              className={`relative z-10 rounded-full flex items-center justify-center font-black text-white shadow-2xl overflow-hidden ${
                isSpotlight ? "h-28 w-28 text-3xl" : "h-16 w-16 sm:h-20 sm:w-20 text-xl sm:text-2xl"
              } ${
                tile.role === "teacher"
                  ? "bg-gradient-to-br from-teal-500 to-emerald-600"
                  : "bg-gradient-to-br from-indigo-500 to-violet-600"
              }`}
            >
              {tile.photo ? (
                <img src={tile.photo} alt={tile.name} className="h-full w-full object-cover" />
              ) : (
                tile.name?.charAt(0)?.toUpperCase() || "?"
              )}
            </div>

            <p className="mt-3 text-xs font-bold text-stone-300 z-10 flex items-center gap-1.5">
              <span>{tile.name}</span>
              {tile.role === "teacher" && (
                <span className="text-[10px] bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded-md border border-teal-500/30">
                  {isRTL ? "معلم" : "Teacher"}
                </span>
              )}
            </p>
            <span className="text-[10px] text-stone-500 mt-1 font-mono">
              {!tile.stream ? (isRTL ? "جاري الاتصال…" : "Connecting…") : (isRTL ? "الكاميرا متوقفة" : "Camera off")}
            </span>
          </div>
        )}

        {/* شارة التعريف السفلية (اسم المشترك وحالته) */}
        <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2">
          <div className="bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold text-white border border-white/10 flex items-center gap-1.5 shadow-lg">
            <span>{tile.name}</span>
            {tile.isLocal && <span className="text-teal-400 font-normal">({isRTL ? "أنت" : "You"})</span>}
            {tile.role === "teacher" && <span className="text-amber-400 text-xs">⭐️</span>}
          </div>
        </div>

        {/* المؤشرات العلوية واليمنى (المايك، مشاركة الشاشة، رفع اليد) */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
          {tile.isScreen && (
            <Badge className="bg-teal-500 text-stone-950 font-black px-2 py-1 rounded-lg text-[10px] flex items-center gap-1 shadow-md">
              <ScreenShare size={12} />
              <span>{isRTL ? "مشاركة الشاشة" : "Sharing Screen"}</span>
            </Badge>
          )}

          {tile.hand && (
            <Badge className="bg-amber-400 text-stone-950 font-black px-2 py-1 rounded-lg text-xs animate-bounce shadow-md">
              🙋‍♂️
            </Badge>
          )}

          {!tile.mic ? (
            <div className="bg-rose-600/90 text-white p-1.5 rounded-full border border-rose-400 shadow-md">
              <MicOff size={13} />
            </div>
          ) : tile.isSpeaking ? (
            <div className="bg-emerald-500/90 text-stone-950 px-2 py-1 rounded-full flex items-center gap-0.5 shadow-md">
              <span className="h-2 w-0.5 bg-stone-950 animate-[bounce_0.6s_infinite]" />
              <span className="h-3.5 w-0.5 bg-stone-950 animate-[bounce_0.8s_infinite]" />
              <span className="h-2 w-0.5 bg-stone-950 animate-[bounce_0.5s_infinite]" />
            </div>
          ) : null}
        </div>

        {/* أزرار التثبيت والتكبير عند التمرير (Hover Controls) */}
        <div className="absolute top-3 left-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1.5">
          <button
            onClick={() => setPinnedParticipantId(isSpotlightUser ? null : tile.id)}
            title={isSpotlightUser ? (isRTL ? "إلغاء التثبيت" : "Unpin") : (isRTL ? "تثبيت في الواجهة" : "Pin")}
            className="h-8 w-8 rounded-xl bg-black/70 hover:bg-black text-white flex items-center justify-center border border-white/10 transition-all cursor-pointer"
          >
            {isSpotlightUser ? <PinOff size={14} className="text-teal-400" /> : <Pin size={14} />}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col font-sans select-none overflow-hidden" dir={isRTL ? "rtl" : "ltr"}>
      {/* ── GOOGLE MEET TOP HEADER ── */}
      <header className="h-16 px-6 bg-[#18181b]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between z-20 shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-stone-950 font-black shadow-[0_0_20px_rgba(20,184,166,0.3)]">
            <Video size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-black text-white truncate max-w-[220px] sm:max-w-md">
                {session?.title || (isRTL ? "حصة الأحياء - الثالث الثانوي" : "Biology Class - Senior High")}
              </h1>
              <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md text-[9px] font-black uppercase flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                {isRTL ? "بث مباشر" : "LIVE"}
              </Badge>
            </div>
            <p className="text-[10px] font-bold text-stone-400 tracking-wide mt-0.5 flex items-center gap-2">
              <span>{session?.subject_name || (isRTL ? "علم الأحياء" : "Biology")}</span>
              <span>•</span>
              <span className="text-stone-300">{session?.teacher_name || (isRTL ? "أ. معتصم علي فتاش" : "Mr. Moutasim Ali Fattash")}</span>
              <span>•</span>
              <span className="font-mono text-emerald-400 flex items-center gap-1">
                <Clock size={10} />
                {formatCallDuration(callDuration)}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* شارة التشفير والأمان */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-850/60 border border-white/5 text-[10px] font-bold text-stone-400">
            <Radio size={12} className="text-emerald-400" />
            <span>{isRTL ? "اتصال WebRTC فائق السرعة" : "Ultra-Low Latency WebRTC"}</span>
          </div>

          {/* تبديل وضع الشبكة / التثبيت */}
          <button
            onClick={() => {
              if (layoutMode === "grid") setLayoutMode("spotlight");
              else setLayoutMode("grid");
            }}
            title={isRTL ? "تغيير تخطيط العرض" : "Switch layout"}
            className="p-2.5 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white border border-white/10 text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <LayoutGrid size={15} />
            <span className="hidden md:inline text-xs font-bold">
              {layoutMode === "grid" ? (isRTL ? "عرض التركيز" : "Spotlight") : (isRTL ? "عرض الشبكة" : "Grid")}
            </span>
          </button>

          {/* نسخ الرابط */}
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success(isRTL ? "تم نسخ رابط الحصة بنجاح!" : "Meeting link copied!");
            }}
            className="p-2.5 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white border border-white/10 text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Copy size={15} />
            <span className="hidden sm:inline text-xs font-bold">{isRTL ? "نسخ الرابط" : "Copy Link"}</span>
          </button>
        </div>
      </header>

      {/* ── GOOGLE MEET MAIN STAGE & SIDEBAR ── */}
      <div className="flex-1 flex flex-col md:flex-row relative min-h-0 overflow-hidden bg-[#202124]">
        {/* Main Stage Area */}
        <div className="flex-1 flex flex-col relative min-w-0 p-3 sm:p-4 overflow-hidden">
          {/* Active View: Spotlight Mode or Dynamic Adaptive Grid */}
          {spotlightId ? (
            <div className="flex-1 flex flex-col lg:flex-row gap-3 min-h-0 overflow-hidden">
              {/* Primary Focused Tile (Teacher / Screen Share / Pinned) */}
              <div className="flex-1 min-h-0 min-w-0 relative flex items-center justify-center rounded-3xl overflow-hidden bg-[#18181b] border border-white/5 shadow-2xl">
                {(() => {
                  const focusedTile = allTiles.find((t) => t.id === spotlightId) || allTiles[0];
                  return renderVideoTile(focusedTile, true);
                })()}
              </div>

              {/* Side Strip of other participants */}
              {allTiles.filter((t) => t.id !== spotlightId).length > 0 && (
                <div className="w-full lg:w-72 flex flex-row lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto shrink-0 pb-2 lg:pb-0">
                  {allTiles
                    .filter((t) => t.id !== spotlightId)
                    .map((tile) => (
                      <div key={tile.id} className="w-48 sm:w-56 lg:w-full shrink-0">
                        {renderVideoTile(tile, false)}
                      </div>
                    ))}
                </div>
              )}
            </div>
          ) : (
            /* Adaptive Dynamic Grid (Google Meet Standard) */
            <div className="flex-1 min-h-0 overflow-y-auto flex items-center justify-center">
              <div className={`grid w-full gap-3 sm:gap-4 p-2 items-center justify-center ${getMeetGridCols(allTiles.length)}`}>
                {allTiles.map((tile) => renderVideoTile(tile, false))}
              </div>
            </div>
          )}

          {/* ── GOOGLE MEET FLOATING BOTTOM TOOLBAR ── */}
          <div className="h-20 shrink-0 flex items-center justify-between px-3 sm:px-6 mt-2 relative z-30">
            {/* Left: Meeting Time & Subject Info */}
            <div className="hidden md:flex items-center gap-3 text-stone-300">
              <span className="font-mono text-sm font-bold tracking-wider">
                {new Date().toLocaleTimeString(isRTL ? "ar-EG" : "en-US", { hour: "2-digit", minute: "2-digit" })}
              </span>
              <span className="text-stone-500">|</span>
              <span className="text-xs font-bold text-stone-300 truncate max-w-[220px]">
                {session?.title || (isRTL ? "حصة الأحياء - الصف الثالث الثانوي" : "Live Session")}
              </span>
            </div>

            {/* Center: Core Action Controls (Google Meet Pill Cluster) */}
            <div className="flex items-center gap-2 sm:gap-3 mx-auto md:mx-0">
              {/* Microphone Toggle with Audio Level Ring */}
              <div className="relative flex items-center justify-center">
                {micActive && micVolume > 0.05 && (
                  <span
                    className="absolute inset-0 rounded-full border-2 border-emerald-400 animate-ping pointer-events-none"
                    style={{ transform: `scale(${1 + Math.min(micVolume * 1.5, 0.8)})` }}
                  />
                )}
                <button
                  onClick={toggleMic}
                  title={micActive ? (isRTL ? "كتم الصوت (Ctrl+D)" : "Mute mic (Ctrl+D)") : (isRTL ? "تشغيل الميكروفون" : "Turn on mic")}
                  className={`h-12 w-12 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shadow-lg hover:scale-105 active:scale-95 ${
                    micActive
                      ? "bg-[#3c4043] hover:bg-[#474a4d] text-white border border-white/10"
                      : "bg-[#ea4335] hover:bg-[#d93025] text-white shadow-[0_0_20px_rgba(234,67,53,0.4)]"
                  }`}
                >
                  {micActive ? <Mic size={20} /> : <MicOff size={20} />}
                </button>
              </div>

              {/* Camera Video Toggle */}
              <button
                onClick={toggleVideo}
                title={videoActive ? (isRTL ? "إيقاف الكاميرا (Ctrl+E)" : "Turn off camera (Ctrl+E)") : (isRTL ? "تشغيل الكاميرا" : "Turn on camera")}
                className={`h-12 w-12 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shadow-lg hover:scale-105 active:scale-95 ${
                  videoActive
                    ? "bg-[#3c4043] hover:bg-[#474a4d] text-white border border-white/10"
                    : "bg-[#ea4335] hover:bg-[#d93025] text-white shadow-[0_0_20px_rgba(234,67,53,0.4)]"
                }`}
              >
                {videoActive ? <Video size={20} /> : <VideoOff size={20} />}
              </button>

              {/* Screen Share (Teachers & Admins or All) */}
              <button
                onClick={() => setScreenSharing(!screenSharing)}
                title={screenSharing ? (isRTL ? "إيقاف مشاركة الشاشة" : "Stop sharing screen") : (isRTL ? "مشاركة الشاشة الآن" : "Share entire screen")}
                className={`h-12 w-12 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shadow-lg hover:scale-105 active:scale-95 ${
                  screenSharing
                    ? "bg-[#8ab4f8] text-[#202124] shadow-[0_0_20px_rgba(138,180,248,0.4)] font-bold"
                    : "bg-[#3c4043] hover:bg-[#474a4d] text-white border border-white/10"
                }`}
              >
                {screenSharing ? <StopCircle size={20} /> : <ScreenShare size={20} />}
              </button>

              {/* Raise Hand Toggle */}
              <button
                onClick={toggleHand}
                title={handRaised ? (isRTL ? "خفض اليد" : "Lower hand") : (isRTL ? "رفع اليد للمشاركة" : "Raise hand")}
                className={`h-12 w-12 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shadow-lg hover:scale-105 active:scale-95 ${
                  handRaised
                    ? "bg-[#fbbc04] text-[#202124] shadow-[0_0_20px_rgba(251,188,4,0.4)]"
                    : "bg-[#3c4043] hover:bg-[#474a4d] text-white border border-white/10"
                }`}
              >
                <Hand size={20} className={handRaised ? "animate-bounce" : ""} />
              </button>

              {/* Interactive Whiteboard Tool */}
              <button
                onClick={() => setShowWhiteboardModal(true)}
                title={isRTL ? "اللوح الذكي التفاعلي المتزامن" : "Interactive Smart Whiteboard"}
                className="h-12 w-12 rounded-full bg-[#3c4043] hover:bg-[#474a4d] text-teal-400 hover:text-teal-300 border border-teal-500/20 flex items-center justify-center transition-all duration-200 cursor-pointer shadow-lg hover:scale-105 active:scale-95"
              >
                <PenTool size={19} />
              </button>

              {/* Red End / Leave Call Button */}
              <button
                onClick={() => handleEndClass()}
                title={isTeacher ? (isRTL ? "إنهاء الحصة" : "End session") : (isRTL ? "مغادرة الحصة" : "Leave call")}
                className="h-12 px-5 sm:px-6 rounded-full bg-[#ea4335] hover:bg-[#d93025] text-white flex items-center gap-2 font-black text-xs shadow-[0_0_25px_rgba(234,67,53,0.4)] transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95"
              >
                <PhoneOff size={18} />
                <span className="hidden sm:inline">
                  {isTeacher ? (isRTL ? "إنهاء الحصة" : "End Call") : (isRTL ? "مغادرة" : "Leave")}
                </span>
              </button>
            </div>

            {/* Right: Drawer Toggles (Info / Users / Chat) */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (sidebarOpen && activeTab === "participants") setSidebarOpen(false);
                  else {
                    setActiveTab("participants");
                    setSidebarOpen(true);
                  }
                }}
                title={isRTL ? "المشاركون في الحصة" : "People"}
                className={`h-11 w-11 rounded-full flex items-center justify-center relative transition-all duration-200 cursor-pointer ${
                  sidebarOpen && activeTab === "participants"
                    ? "bg-[#8ab4f8] text-[#202124]"
                    : "bg-[#3c4043]/80 hover:bg-[#3c4043] text-stone-300 hover:text-white"
                }`}
              >
                <Users size={18} />
                <span className="absolute -top-1 -right-1 bg-teal-500 text-stone-950 text-[10px] font-black h-4 px-1 rounded-full flex items-center justify-center">
                  {allTiles.length}
                </span>
              </button>

              <button
                onClick={() => {
                  if (sidebarOpen && activeTab === "chat") setSidebarOpen(false);
                  else {
                    setActiveTab("chat");
                    setSidebarOpen(true);
                  }
                }}
                title={isRTL ? "الدردشة مع الجميع" : "Chat with everyone"}
                className={`h-11 w-11 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
                  sidebarOpen && activeTab === "chat"
                    ? "bg-[#8ab4f8] text-[#202124]"
                    : "bg-[#3c4043]/80 hover:bg-[#3c4043] text-stone-300 hover:text-white"
                }`}
              >
                <MessageSquare size={18} />
              </button>

              <button
                onClick={() => {
                  if (sidebarOpen && activeTab === "notes") setSidebarOpen(false);
                  else {
                    setActiveTab("notes");
                    setSidebarOpen(true);
                  }
                }}
                title={isRTL ? "الملاحظات والسبورة" : "Notes"}
                className={`h-11 w-11 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
                  sidebarOpen && activeTab === "notes"
                    ? "bg-[#8ab4f8] text-[#202124]"
                    : "bg-[#3c4043]/80 hover:bg-[#3c4043] text-stone-300 hover:text-white"
                }`}
              >
                <FileText size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* ── GOOGLE MEET SLIDE-OUT DRAWER (Chat / Users / Notes) ── */}
        <aside
          className={`transition-all duration-300 ease-in-out z-40 bg-[#28292c] border-l md:border-l border-white/10 flex flex-col shadow-2xl ${
            sidebarOpen ? "w-full sm:w-88 md:w-96" : "w-0 overflow-hidden border-none pointer-events-none"
          }`}
        >
          {/* Drawer Top Header */}
          <div className="h-16 px-4 border-b border-white/10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1">
              {[
                { id: "chat", label: isRTL ? "الرسائل" : "Chat", icon: MessageSquare },
                { id: "participants", label: isRTL ? "الحاضرون" : "People", icon: Users },
                { id: "notes", label: isRTL ? "الملاحظات" : "Notes", icon: FileText },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? "bg-stone-700/80 text-white shadow-sm"
                      : "text-stone-400 hover:text-white hover:bg-stone-800"
                  }`}
                >
                  <tab.icon size={14} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setSidebarOpen(false)}
              className="h-8 w-8 rounded-full hover:bg-white/10 text-stone-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Drawer Tab Content */}
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
                  <div className="space-y-3 flex-1 overflow-y-auto mb-3 pr-1">
                    {chatMessages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-stone-500 py-12 text-center">
                        <MessageSquare size={36} className="mb-2 opacity-30 text-teal-400" />
                        <p className="text-xs font-bold text-stone-300">
                          {isRTL ? "مرحباً بك في دردشة الحصة المباشرة" : "In-call messages"}
                        </p>
                        <p className="text-[11px] text-stone-500 mt-1">
                          {isRTL ? "الرسائل ظاهرة فقط للمشاركين أثناء الحصة" : "Messages can be seen only by people in the call"}
                        </p>
                      </div>
                    ) : (
                      chatMessages.map((msg, i) => {
                        const isMe = msg.sender_name === userName;
                        const time = msg.created_at
                          ? new Date(msg.created_at).toLocaleTimeString(isRTL ? "ar-EG" : "en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "";
                        return (
                          <div key={msg.id || i} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                            <div className="flex items-center gap-1.5 mb-1 px-1">
                              <span className="text-[10px] font-bold text-stone-300">{msg.sender_name}</span>
                              <span className="text-[9px] text-stone-500 font-mono">{time}</span>
                            </div>
                            <div
                              className={`px-3.5 py-2 rounded-2xl text-xs font-medium max-w-[88%] leading-relaxed shadow-sm ${
                                isMe
                                  ? "bg-teal-600 text-white rounded-br-none"
                                  : "bg-[#3c4043] text-stone-100 rounded-bl-none"
                              }`}
                            >
                              {msg.content || msg.message_text}
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="flex items-center gap-2 bg-[#1e1f22] p-1.5 rounded-2xl border border-white/10">
                    <Input
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                      placeholder={isRTL ? "إرسال رسالة إلى الجميع…" : "Send a message to everyone…"}
                      className="border-none bg-transparent text-xs focus-visible:ring-0 text-white w-full placeholder:text-stone-500"
                    />
                    <button
                      onClick={handleSendMessage}
                      className="h-9 w-9 rounded-xl bg-teal-500 hover:bg-teal-400 text-stone-950 flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-md"
                    >
                      <Send size={15} />
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
                  className="space-y-2 overflow-y-auto flex-1 pr-1"
                >
                  <div className="flex items-center justify-between text-stone-400 text-xs font-bold pb-2 border-b border-white/10">
                    <span>{isRTL ? "المشارك" : "Participant"}</span>
                    <span>{isRTL ? "الحالة" : "Status"}</span>
                  </div>
                  {allTiles.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between bg-[#3c4043]/50 p-2.5 rounded-2xl border border-white/5 hover:border-white/10 transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs text-white overflow-hidden shrink-0 ${
                            p.role === "teacher"
                              ? "bg-gradient-to-br from-teal-500 to-emerald-600"
                              : "bg-gradient-to-br from-indigo-500 to-violet-600"
                          }`}
                        >
                          {p.photo ? (
                            <img src={p.photo} alt={p.name} className="h-full w-full object-cover" />
                          ) : (
                            p.name?.charAt(0)?.toUpperCase() || "?"
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>{p.name}</span>
                            {p.isMe && <span className="text-teal-400 font-normal text-[10px]">({isRTL ? "أنت" : "You"})</span>}
                          </p>
                          <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">
                            {p.role === "teacher" ? (isRTL ? "معلم ومقدم الحصة" : "Host / Teacher") : (isRTL ? "طالب" : "Student")}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {p.hand && <span className="text-sm animate-bounce">🙋‍♂️</span>}
                        {p.mic ? (
                          <div className="h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                            <Mic size={12} />
                          </div>
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
                            <MicOff size={12} />
                          </div>
                        )}
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
                  <p className="text-[11px] font-bold text-stone-400 mb-2 flex items-center gap-1.5">
                    <Info size={13} className="text-teal-400" />
                    <span>{isRTL ? "ملاحظات الدرس المشتركة" : "Lesson shared notes"}</span>
                  </p>
                  <textarea
                    id="field-virtualclassroom-textarea-notes"
                    name="lesson_notes"
                    aria-label="Lesson notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={isRTL ? "اكتب ملاحظات ونقاط الحصة هنا لتلخيصها للطلاب…" : "Write lesson notes here…"}
                    className="flex-1 w-full bg-[#1e1f22] rounded-2xl p-3.5 border border-white/10 text-xs text-stone-200 focus:outline-none focus:border-teal-500/50 resize-none font-sans leading-relaxed"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </aside>
      </div>

      {/* ── INTERACTIVE WHITEBOARD MODAL (Google Meet Jam Style) ── */}
      <Dialog open={showWhiteboardModal} onOpenChange={setShowWhiteboardModal}>
        <DialogContent className="max-w-5xl h-[85vh] bg-[#1e1f22] border-white/10 text-white rounded-3xl p-4 flex flex-col overflow-hidden">
          <DialogHeader className="flex flex-row items-center justify-between pb-2 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                <PenTool size={16} />
              </div>
              <DialogTitle className="text-sm font-bold text-white">
                {isRTL ? "اللوح الذكي التفاعلي المتزامن" : "Interactive Smart Whiteboard"}
              </DialogTitle>
            </div>
          </DialogHeader>

          {/* Whiteboard Canvas Stage */}
          <div className="flex-1 bg-stone-900/60 rounded-2xl border border-white/10 relative overflow-hidden flex items-center justify-center">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={endDrawing}
              onMouseLeave={endDrawing}
              className="w-full h-full cursor-crosshair"
            />

            {/* Whiteboard Floating Drawing Tools Bar */}
            <div className="absolute bottom-4 inset-x-4 mx-auto max-w-fit flex items-center gap-2.5 bg-[#28292c]/95 backdrop-blur-md p-2.5 rounded-2xl border border-white/10 shadow-2xl z-20">
              {["#2dd4bf", "#f43f5e", "#3b82f6", "#eab308", "#ffffff"].map((color) => (
                <button
                  key={color}
                  disabled={isEraser}
                  onClick={() => setDrawColor(color)}
                  style={{ backgroundColor: color }}
                  className={`h-6 w-6 rounded-full border-2 transition-all cursor-pointer ${
                    !isEraser && drawColor === color ? "border-white scale-110" : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                />
              ))}

              <div className="w-px h-5 bg-white/10" />

              <button
                onClick={() => setIsEraser(!isEraser)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isEraser ? "bg-amber-500 text-stone-950 font-black" : "bg-stone-800 text-stone-300 hover:text-white"
                }`}
              >
                {isEraser ? (isRTL ? "ممحاة نشطة" : "Eraser On") : (isRTL ? "ممحاة" : "Eraser")}
              </button>

              <div className="w-px h-5 bg-white/10" />

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-stone-400 font-bold">{isRTL ? "السمك:" : "Size:"}</span>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={lineWidth}
                  onChange={(e) => setLineWidth(parseInt(e.target.value))}
                  className="w-16 h-1 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-teal-400"
                />
                <span className="text-[10px] font-mono text-teal-400 w-5">{lineWidth}px</span>
              </div>

              <div className="w-px h-5 bg-white/10" />

              <button
                onClick={clearCanvas}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                {isRTL ? "مسح اللوح" : "Clear"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
