import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/dbClient";
import {
  Video, VideoOff, Mic, MicOff, Hand, MessageSquare,
  Send, Users, PhoneOff, Info, Copy,
  ShieldAlert, ScreenShare, Sparkles, AlertCircle, FileText,
  Clock, Calendar, Maximize2, Minimize2, ChevronLeft, ChevronRight,
  StopCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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

  // ── Auth ──────────────────────────────────────────────────────────────────
  const role = localStorage.getItem("portal_role") || "student";
  const userId = localStorage.getItem("portal_user_id") || "S-temp";
  const userName = localStorage.getItem("portal_user_name") || (role === "teacher" ? "أ. أحمد" : "طالب زائر");
  const isTeacher = role === "teacher";
  const isAdmin = role === "admin";

  // ── UI State ──────────────────────────────────────────────────────────────
  const [micActive, setMicActive] = useState(true);
  const [videoActive, setVideoActive] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [notes, setNotes] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [pinnedParticipantId, setPinnedParticipantId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // Maps userId -> true when that user is sharing their screen
  const [remoteScreenSharing, setRemoteScreenSharing] = useState({});
  // Maps userId -> MediaStream for the SCREEN track received
  const [remoteScreenStreams, setRemoteScreenStreams] = useState({});

  // ── WebSockets ────────────────────────────────────────────────────────────
  const wsDrawing = useDrawingSocket(id, userId);
  const wsSignaling = useWebRTCSignaling(id, userId);

  const { data: iceConfig } = useQuery({
    queryKey: ['ice-config'],
    queryFn: () => fetch('/api/ice-config').then(r => r.json()),
    staleTime: 3600000 // 1 hour
  });

  // ── WebRTC ────────────────────────────────────────────────────────────────
  const [localStream, setLocalStream] = useState(null);
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
    queryKey: ["teacher-subjects", userId],
    queryFn: () =>
      isTeacher ? entities.Subject.filter({ teacher_id: userId }) : entities.Subject.list(),
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

  // ─────────────────────────────────────────────────────────────────────────
  //  Participants list from DB
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isDemo) return;
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
        mic: p.user_id === userId ? micActive : (p.mic_active ?? true),
        video: p.user_id === userId ? videoActive : (p.video_active ?? true),
        hand: p.user_id === userId ? handRaised : (p.hand_raised ?? false),
        avatar: p.role === "teacher" ? "👨‍🏫" : "🧑‍🎓",
      }));
      if (!mapped.some((p) => p.id === userId)) {
        mapped.push({ id: userId, name: userName, role, mic: micActive, video: videoActive, hand: handRaised, avatar: isTeacher ? "👨‍🏫" : "🧑‍🎓" });
      }
      setParticipants(mapped);
    } else {
      setParticipants([{ id: userId, name: userName, role, mic: micActive, video: videoActive, hand: handRaised, avatar: isTeacher ? "👨‍🏫" : "🧑‍🎓" }]);
    }
  }, [activeParticipants, userId, userName, role, micActive, videoActive, handRaised, isDemo]);

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

  // Sync mic / video track enabled state
  useEffect(() => { if (localStream) localStream.getAudioTracks().forEach((t) => (t.enabled = micActive)); }, [micActive, localStream]);
  useEffect(() => { if (localStream) localStream.getVideoTracks().forEach((t) => (t.enabled = videoActive)); }, [videoActive, localStream]);

  // ─────────────────────────────────────────────────────────────────────────
  //  Screen sharing — uses replaceTrack (no renegotiation needed)
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isDemo) return;
    let currentScreenStream = null;

    const toggle = async () => {
      if (screenSharing) {
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
            }
          });
          await Promise.all(replaceJobs);

          // Signal peers: pin this user's stream full-screen
          sendSignal("SCREEN_SHARE", "all", { active: true, sharerId: userId });

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
        }
        if (screenStream) {
          screenStream.getTracks().forEach((t) => t.stop());
          setScreenStream(null);
        }
        sendSignal("SCREEN_SHARE", "all", { active: false, sharerId: userId });
      }
    };

    toggle();
    return () => { if (currentScreenStream) currentScreenStream.getTracks().forEach((t) => t.stop()); };
  }, [screenSharing, isDemo]);

  // ─────────────────────────────────────────────────────────────────────────
  //  Signaling helpers
  // ─────────────────────────────────────────────────────────────────────────
  const sendSignal = async (type, targetId, data) => {
    if (!wsSignaling.isConnected) return;
    wsSignaling.sendSignal(targetId, { type, data });
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  RTCPeerConnection factory  (uses fetched TURN + STUN)
  // ─────────────────────────────────────────────────────────────────────────
  const getOrCreatePC = (peerId) => {
    if (pcsRef.current[peerId]) return pcsRef.current[peerId];

    const pc = new RTCPeerConnection({ iceServers: iceConfig?.iceServers || [] });
    pcsRef.current[peerId] = pc;

    // Add currently active tracks (camera or screen share) immediately if available
    const currentActiveStream = activeStreamRef.current;
    if (currentActiveStream) {
      currentActiveStream.getTracks().forEach((track) => pc.addTrack(track, currentActiveStream));
    }

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
      if (el) el.volume = remoteVolume;
    };

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
      setPresentationMode(data.mode);

    } else if (type === "PRESENTATION_DATA") {
      setPresentationData(data);

    } else if (type === "SCREEN_SHARE") {
      if (data.active) {
        // Auto-pin the screen sharer and show their stream as screen-share
        setPinnedParticipantId(peerId);
        setRemoteScreenSharing((prev) => ({ ...prev, [peerId]: true }));
        // The current remoteStreams[peerId] now contains the screen track
        // (via replaceTrack), so mark it as screen stream too
        setRemoteScreenStreams((prev) => ({
          ...prev,
          [peerId]: pcsRef.current[peerId]
            ? (() => {
                const receivers = pcsRef.current[peerId].getReceivers();
                const videoReceiver = receivers.find((r) => r.track?.kind === "video");
                if (videoReceiver?.track) {
                  const s = new MediaStream([videoReceiver.track]);
                  // also grab audio if available
                  const audioReceiver = receivers.find((r) => r.track?.kind === "audio");
                  if (audioReceiver?.track) s.addTrack(audioReceiver.track);
                  return s;
                }
                return prev[peerId] || null;
              })()
            : prev[peerId] || null,
        }));
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

    wsSignaling.onSignal((senderId, payload) => {
      const { type, data } = payload;
      handleIncomingSignal(type, senderId, data);
    });

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

  }, [isDemo, wsSignaling, wsDrawing]);

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
  const toggleMic = async () => {
    const val = !micActive;
    setMicActive(val);
    if (myParticipantId) entities.SessionParticipant.update(myParticipantId, { mic_active: val }).catch(() => {});
  };

  const toggleVideo = async () => {
    const val = !videoActive;
    setVideoActive(val);
    if (myParticipantId) entities.SessionParticipant.update(myParticipantId, { video_active: val }).catch(() => {});
  };

  const toggleHand = async () => {
    const val = !handRaised;
    setHandRaised(val);
    if (myParticipantId) entities.SessionParticipant.update(myParticipantId, { hand_raised: val }).catch(() => {});
  };

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

  const handleEndClass = async () => {
    if (isTeacher) {
      if (confirm(isRTL ? "هل أنت متأكد من إنهاء الفصل للجميع؟" : "End class for everyone?")) {
        try { await entities.VirtualSession.update(id, { status: "ended", ended_at: new Date().toISOString() }); } catch {}
        toast.success(isRTL ? "تم إنهاء الفصل." : "Class ended.");
        navigate("/teacher-portal");
      }
    } else if (isAdmin) {
      navigate("/admin-virtual-classrooms");
    } else {
      toast.info(isRTL ? "غادرت الفصل." : "You left the classroom.");
      navigate("/student-portal");
    }
  };

  const handleStartSession = async (sessionItem) => {
    try {
      await entities.VirtualSession.update(sessionItem.id, { status: "active", started_at: new Date().toISOString() });
      toast.success(isRTL ? "تم بدء الحصة!" : "Session started!");
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
                    <label className="text-[10px] font-bold text-stone-200 uppercase block mb-1.5">{isRTL ? "المادة الدراسية" : "Subject"}</label>
                    <select value={newSession.subject_id} onChange={(e) => setNewSession({ ...newSession, subject_id: e.target.value })} className="w-full border border-white/5 text-xs text-white rounded-xl p-2.5 focus:outline-none" style={{ backgroundColor: "#1c1917", color: "#ffffff" }}>
                      <option value="">{isRTL ? "اختر المادة..." : "Select Subject..."}</option>
                      {teacherSubjects.map((sub) => <option key={sub.id} value={sub.id} style={{ backgroundColor: "#1c1917" }}>{sub.name} ({sub.grade || "عام"})</option>)}
                    </select>
                  </div>
                  <button
                    onClick={async () => {
                      if (!newSession.title || !newSession.subject_id) { toast.error(isRTL ? "أدخل العنوان واختر المادة" : "Enter title and select subject"); return; }
                      const selectedSub = teacherSubjects.find((s) => s.id === newSession.subject_id);
                      const roomName = `room-${Math.random().toString(36).substr(2, 9)}`;
                      try {
                        const res = await entities.VirtualSession.create({ title: newSession.title, teacher_id: userId, teacher_name: userName, subject_id: newSession.subject_id, subject_name: selectedSub?.name || "", room_name: roomName, scheduled_at: new Date().toISOString(), started_at: new Date().toISOString(), status: "active" });
                        toast.success(isRTL ? "تم بدء الحصة!" : "Session started!");
                        navigate(`/virtual-classroom/${res.id}`);
                      } catch { toast.error(isRTL ? "فشل البدء" : "Failed to start"); }
                    }}
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
                    <label className="text-[10px] font-bold text-stone-200 uppercase block mb-1.5">{isRTL ? "المادة الدراسية" : "Subject"}</label>
                    <select value={newSession.subject_id} onChange={(e) => setNewSession({ ...newSession, subject_id: e.target.value })} className="w-full border border-white/5 text-xs text-white rounded-xl p-2.5 focus:outline-none" style={{ backgroundColor: "#1c1917", color: "#ffffff" }}>
                      <option value="">{isRTL ? "اختر المادة..." : "Select Subject..."}</option>
                      {teacherSubjects.map((sub) => <option key={sub.id} value={sub.id} style={{ backgroundColor: "#1c1917" }}>{sub.name} ({sub.grade || "عام"})</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-stone-200 uppercase block mb-1.5">{isRTL ? "التاريخ" : "Date"}</label>
                      <input type="date" value={newSession.scheduled_at} onChange={(e) => setNewSession({ ...newSession, scheduled_at: e.target.value })} className="w-full border border-white/5 text-xs text-white rounded-xl p-2.5 focus:outline-none" style={{ backgroundColor: "#1c1917", color: "#ffffff", colorScheme: "dark" }} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-stone-200 uppercase block mb-1.5">{isRTL ? "الوقت" : "Time"}</label>
                      <input type="time" value={newSession.scheduled_time} onChange={(e) => setNewSession({ ...newSession, scheduled_time: e.target.value })} className="w-full border border-white/5 text-xs text-white rounded-xl p-2.5 focus:outline-none" style={{ backgroundColor: "#1c1917", color: "#ffffff", colorScheme: "dark" }} />
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

  // ─────────────────────────────────────────────────────────────────────────
  //  LIVE CLASSROOM
  // ─────────────────────────────────────────────────────────────────────────


  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-sans select-none overflow-hidden" dir={isRTL ? "rtl" : "ltr"}>
      {/* ── HEADER ── */}
      <header className="h-16 px-6 bg-stone-900/60 backdrop-blur-xl border-b border-white/5 flex items-center justify-between z-10 shrink-0 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.2)]">
            <Sparkles size={20} className="animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-black text-white/90 truncate max-w-[200px] sm:max-w-md drop-shadow-sm">
              {session?.title || (isRTL ? "حصة دراسية افتراضية" : "Virtual Session")}
            </h1>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-0.5">
              {session?.subject_name} • <span className="text-stone-300">{session?.teacher_name}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-2 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping absolute opacity-75" />
            <span className="h-2 w-2 rounded-full bg-emerald-400 relative" />
            {isRTL ? "مباشر" : "LIVE"}
          </Badge>
          {isAdmin && (
            <Badge className="bg-violet-500/15 text-violet-300 border border-violet-500/30 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert size={12} />
              {isRTL ? "مراقب" : "Observer"}
            </Badge>
          )}
          <button
            onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success(isRTL ? "تم نسخ الرابط!" : "Link copied!"); }}
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-stone-800/80 hover:bg-stone-700 text-stone-200 rounded-xl text-[11px] font-black transition-all border border-white/5 shadow-sm hover:shadow-md"
          >
            <Copy size={14} />
            {isRTL ? "نسخ الرابط" : "Copy Link"}
          </button>
        </div>
      </header>

      {/* ── CORE WORKSPACE ── */}
      <div className="flex-1 flex flex-col md:flex-row relative min-h-0 overflow-hidden">

        {/* ── MAIN AREA (Presentation / Pinned Video / Screen Share) ── */}
        <div className="flex-1 p-4 md:p-6 flex flex-col justify-between relative bg-stone-900/40 min-w-0">

          {/* Sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`absolute top-1/2 -translate-y-1/2 z-20 h-16 w-5 bg-stone-900 border border-stone-850 hover:bg-stone-800 text-stone-400 hover:text-white flex items-center justify-center shadow-lg transition-all rounded-l-md cursor-pointer ${isRTL ? "left-0 rounded-r-md rounded-l-none border-l-0" : "right-0 rounded-l-md rounded-r-none border-r-0"}`}
          >
            {sidebarOpen ? (isRTL ? <ChevronLeft size={12} /> : <ChevronRight size={12} />) : (isRTL ? <ChevronRight size={12} /> : <ChevronLeft size={12} />)}
          </button>

          {/* Presentation mode tabs (hidden when pinned) */}
          {!pinnedParticipantId && (
            <div className="flex items-center justify-between mb-4 bg-stone-900/80 p-2 rounded-2xl border border-white/5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-stone-400 px-2">{isRTL ? "مساحة العرض:" : "Workspace:"}</span>
                {[
                  { id: "whiteboard", label: isRTL ? "اللوح الذكي" : "Whiteboard" },
                  { id: "file", label: isRTL ? "عرض ملف" : "File/Image" },
                  { id: "video", label: isRTL ? "فيديو" : "Video" },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => {
                      setPresentationMode(mode.id);
                      if (isTeacher) sendSignal("PRESENTATION_MODE", "all", { mode: mode.id });
                    }}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${presentationMode === mode.id ? "bg-teal-500 text-stone-950" : "text-stone-400 hover:text-white hover:bg-white/5"}`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Main content box */}
          <div className="flex-1 bg-stone-950/80 rounded-[32px] border border-white/5 relative overflow-hidden flex items-center justify-center min-h-[350px]">
            {pinnedParticipantId ? (
              /* ── Pinned / Screen share view ── */
              <div className="w-full h-full relative bg-stone-950 flex items-center justify-center">
                {pinnedParticipantId === userId ? (
                  /* Own screen share / camera */
                  videoActive && activeStream ? (
                    <video
                      ref={(el) => { if (el && activeStream && el.srcObject !== activeStream) { el.srcObject = activeStream; el.play().catch(() => {}); } }}
                      autoPlay playsInline muted
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-stone-500 font-bold text-xs">{isRTL ? "الكاميرا مغلقة" : "Camera Off"}</div>
                  )
                ) : (
                  /* Remote: always show remoteStreams (replaceTrack keeps same stream for screen share too) */
                  remoteStreams[pinnedParticipantId] ? (
                    <video
                      ref={(el) => {
                        remoteVideoRefs.current[`pinned-${pinnedParticipantId}`] = el;
                        if (el && remoteStreams[pinnedParticipantId]) {
                          if (el.srcObject !== remoteStreams[pinnedParticipantId]) {
                            el.srcObject = remoteStreams[pinnedParticipantId];
                          }
                          el.volume = remoteVolume;
                          el.play().catch(() => {});
                        }
                      }}
                      autoPlay playsInline
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    /* No stream yet — show participant avatar */
                    <div className="relative w-full h-full flex flex-col items-center justify-center bg-stone-950">
                      <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-stone-950" />
                      {(() => {
                        const pinnedP = participants.find((p) => p.id === pinnedParticipantId);
                        return (
                          <>
                            <div className={`h-24 w-24 rounded-full flex items-center justify-center text-4xl font-black text-white shadow-2xl z-10 mb-4 ${
                              pinnedP?.role === "teacher"
                                ? "bg-gradient-to-br from-teal-500 to-emerald-600"
                                : "bg-gradient-to-br from-indigo-500 to-violet-600"
                            }`}>
                              {pinnedP?.name?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                            <p className="text-sm font-bold text-stone-200 z-10">{pinnedP?.name}</p>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-bold mt-2 border border-teal-500/20 z-10">
                              <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                              {isRTL ? "جاري الاتصال..." : "Connecting..."}
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  )
                )}
                {/* Minimize button */}
                <button onClick={() => setPinnedParticipantId(null)}
                  className="absolute top-4 right-4 bg-black/70 hover:bg-black/90 text-white p-2 rounded-xl border border-white/10 z-20 flex items-center gap-1.5 text-xs font-bold transition-all">
                  <Minimize2 size={14} />
                  <span>{isRTL ? "تصغير" : "Minimize"}</span>
                </button>
                {/* Screen share badge */}
                {remoteScreenSharing[pinnedParticipantId] && (
                  <div className="absolute top-4 left-4 bg-teal-500/20 border border-teal-500/40 text-teal-300 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 z-20">
                    <ScreenShare size={14} />
                    {isRTL ? "مشاركة الشاشة" : "Screen Share"}
                  </div>
                )}
              </div>
            ) : (
              /* ── Normal presentation workspace ── */
              <>
                {presentationMode === "whiteboard" && (
                  <div className="w-full h-full relative bg-stone-900/20">
                    <canvas ref={canvasRef} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={endDrawing} onMouseLeave={endDrawing} className="w-full h-full cursor-crosshair" />
                    <div className="absolute bottom-4 right-4 flex items-center gap-3 bg-stone-900/95 p-3 rounded-2xl border border-white/10 z-10 shadow-2xl backdrop-blur-md">
                      {["#2dd4bf", "#f43f5e", "#3b82f6", "#eab308", "#ffffff"].map((color) => (
                        <button key={color} disabled={isEraser} onClick={() => setDrawColor(color)} style={{ backgroundColor: color }} className={`h-6 w-6 rounded-full border-2 transition-all ${!isEraser && drawColor === color ? "border-white scale-110" : "border-transparent opacity-60 hover:opacity-100"}`} />
                      ))}
                      <div className="w-px h-6 bg-white/10" />
                      <button onClick={() => setIsEraser(!isEraser)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${isEraser ? "bg-amber-500 text-stone-950" : "bg-stone-850 hover:bg-stone-800 text-stone-300"}`}>
                        {isEraser ? (isRTL ? "ممحاة نشطة" : "Eraser ON") : (isRTL ? "ممحاة" : "Eraser")}
                      </button>
                      <div className="w-px h-6 bg-white/10" />
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-stone-400 font-bold">{isRTL ? "السمك:" : "Size:"}</span>
                        <input type="range" min="1" max="20" value={lineWidth} onChange={(e) => setLineWidth(parseInt(e.target.value))} className="w-16 h-1 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-teal-400" />
                        <span className="text-[9px] font-mono text-teal-400 w-4">{lineWidth}px</span>
                      </div>
                      <div className="w-px h-6 bg-white/10" />
                      <button onClick={clearCanvas} className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold transition-all">{isRTL ? "مسح" : "Clear"}</button>
                    </div>
                  </div>
                )}
                {presentationMode === "file" && (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 relative">
                    <img src={presentationData.imageUrl} alt="Slide" className="max-h-[85%] max-w-[95%] object-contain rounded-xl shadow-2xl" />
                    {isTeacher && (
                      <div className="absolute bottom-4 right-4 bg-stone-900/90 p-2 rounded-xl border border-white/10 flex items-center gap-3 z-10">
                        <button onClick={() => { const u = prompt(isRTL ? "أدخل رابط الصورة:" : "Enter Image URL:", presentationData.imageUrl); if (u) { const upd = { ...presentationData, imageUrl: u }; setPresentationData(upd); sendSignal("PRESENTATION_DATA", "all", upd); } }} className="px-3 py-1.5 bg-teal-500 text-stone-950 rounded-lg text-[10px] font-black">{isRTL ? "تغيير" : "Change"}</button>
                      </div>
                    )}
                  </div>
                )}
                {presentationMode === "video" && (
                  <div className="w-full h-full flex items-center justify-center p-6 relative">
                    <video src={presentationData.videoUrl} controls className="w-full max-h-[85%] rounded-xl shadow-2xl" />
                    {isTeacher && (
                      <div className="absolute bottom-4 right-4 bg-stone-900/90 p-2 rounded-xl border border-white/10 flex items-center gap-3 z-10">
                        <button onClick={() => { const u = prompt(isRTL ? "أدخل رابط الفيديو (MP4):" : "Enter Video URL:", presentationData.videoUrl); if (u) { const upd = { ...presentationData, videoUrl: u }; setPresentationData(upd); sendSignal("PRESENTATION_DATA", "all", upd); } }} className="px-3 py-1.5 bg-teal-500 text-stone-950 rounded-lg text-[10px] font-black">{isRTL ? "تغيير" : "Change"}</button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── CONTROL TOOLBAR ── */}
          <div className="h-20 bg-stone-900/80 backdrop-blur-xl border border-white/10 rounded-3xl mt-4 px-6 flex items-center justify-between shadow-[0_8px_30px_rgb(0,0,0,0.4)] relative z-10 transition-all hover:border-white/20">
            <div className="flex items-center gap-3">
              <button onClick={toggleMic} className={`h-12 w-12 rounded-2xl flex items-center justify-center border transition-all duration-300 hover:scale-105 active:scale-95 ${micActive ? "bg-stone-800 text-stone-200 border-white/10 hover:bg-stone-700" : "bg-rose-500 text-white border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.4)]"}`}>
                {micActive ? <Mic size={20} /> : <MicOff size={20} />}
              </button>
              <button onClick={toggleVideo} className={`h-12 w-12 rounded-2xl flex items-center justify-center border transition-all duration-300 hover:scale-105 active:scale-95 ${videoActive ? "bg-stone-800 text-stone-200 border-white/10 hover:bg-stone-700" : "bg-rose-500 text-white border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.4)]"}`}>
                {videoActive ? <Video size={20} /> : <VideoOff size={20} />}
              </button>
              {/* Screen share — teachers/admins only */}
              {(isTeacher || isAdmin) && (
                <button onClick={() => setScreenSharing(!screenSharing)}
                  className={`h-12 w-12 rounded-2xl flex items-center justify-center border transition-all duration-300 hover:scale-105 active:scale-95 ${screenSharing ? "bg-teal-500 text-stone-950 border-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.4)]" : "bg-stone-800 text-stone-200 border-white/10 hover:bg-stone-700"}`}>
                  {screenSharing ? <StopCircle size={20} /> : <ScreenShare size={20} />}
                </button>
              )}
            </div>

            <div className="flex items-center gap-4">
              {!isTeacher && !isAdmin && (
                <button onClick={toggleHand}
                  className={`h-12 px-5 rounded-2xl flex items-center justify-center gap-2.5 border transition-all duration-300 hover:scale-105 active:scale-95 ${handRaised ? "bg-amber-500 text-stone-950 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)]" : "bg-stone-800 text-stone-200 border-white/10 hover:bg-stone-700"}`}>
                  <Hand size={20} className={handRaised ? "animate-bounce" : ""} />
                  <span className="hidden sm:inline text-xs font-black">{isRTL ? "رفع اليد" : "Raise Hand"}</span>
                </button>
              )}
              {/* Volume slider */}
              <div className="hidden md:flex items-center gap-3 bg-stone-800/80 px-4 py-3 rounded-2xl border border-white/5 h-12">
                <span className="text-xs text-stone-400">🔊</span>
                <input type="range" min="0" max="1" step="0.05" value={remoteVolume} onChange={(e) => setRemoteVolume(parseFloat(e.target.value))} className="w-24 accent-teal-400 cursor-pointer h-1.5 bg-stone-700 rounded-lg appearance-none" />
                <span className="text-[10px] font-mono text-stone-400 w-8 text-right font-bold">{Math.round(remoteVolume * 100)}%</span>
              </div>
            </div>

            <button onClick={handleEndClass} className="h-12 px-6 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center gap-2.5 transition-all duration-300 hover:scale-105 active:scale-95 font-black text-xs shadow-[0_0_15px_rgba(225,29,72,0.3)]">
              <PhoneOff size={18} />
              <span>{isTeacher ? (isRTL ? "إنهاء للجميع" : "End for All") : (isRTL ? "مغادرة" : "Leave")}</span>
            </button>
          </div>
        </div>

        {/* ── PARTICIPANT CAMERA STACK ── */}
        <div className="w-full lg:w-72 bg-stone-950/60 border-t lg:border-t-0 lg:border-r border-stone-850 p-4 flex flex-row lg:flex-col gap-4 overflow-y-auto shrink-0 justify-center lg:justify-start items-center lg:items-stretch min-w-0">

          {/* Local preview */}
          <div className={getCameraCardClass()}>
            <button onClick={() => setPinnedParticipantId(pinnedParticipantId === userId ? null : userId)}
              className="absolute top-2 left-2 z-20 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-lg border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {pinnedParticipantId === userId ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
            </button>
            {videoActive && localStream ? (
              <div className="w-full h-full bg-stone-800 flex items-center justify-center relative">
                <video
                  ref={(el) => {
                    localVideoRef.current = el;
                    if (el && localStream && el.srcObject !== localStream) {
                      el.srcObject = localStream;
                      el.play().catch(() => {});
                    }
                  }}
                  autoPlay playsInline muted
                  className="w-full h-full object-cover"
                />
                {screenSharing && (
                  <div className="absolute inset-0 bg-stone-900/90 flex flex-col items-center justify-center p-2 text-center">
                    <ScreenShare size={20} className="text-teal-400 mb-1 animate-bounce" />
                    <p className="text-[8px] font-bold">{isRTL ? "تشارك شاشتك" : "Sharing screen"}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-stone-900 to-stone-850 flex flex-col items-center justify-center p-2">
                {!localStream && <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-teal-500/10 animate-pulse rounded-2xl" />}
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-sm font-black text-white shadow-lg z-10 mb-1">
                  {userName?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <span className="text-[9px] text-stone-400 font-bold z-10">
                  {!localStream ? (isRTL ? "جاري تفعيل الكاميرا..." : "Starting camera...") : (isRTL ? "الكاميرا مغلقة" : "Camera Off")}
                </span>
              </div>
            )}
            <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between z-10">
              <span className="bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded-md text-[8px] font-bold border border-white/5">{userName} {isTeacher && "⭐️"}</span>
              <div className="flex gap-1">
                {!micActive && <Badge className="bg-rose-500 text-white p-0.5 rounded-md"><MicOff size={8} /></Badge>}
                {handRaised && <Badge className="bg-yellow-500 text-stone-950 px-1 py-0.5 rounded-md text-[8px] font-black">🙋‍♂️</Badge>}
              </div>
            </div>
          </div>

          {/* Remote participants */}
          {participants.filter((p) => p.id !== userId).map((p) => (
            <div key={p.id} className={getCameraCardClass()}>
              <button onClick={() => setPinnedParticipantId(pinnedParticipantId === p.id ? null : p.id)}
                className="absolute top-2 left-2 z-20 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-lg border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {pinnedParticipantId === p.id ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
              </button>

              {/* Remote camera/screen stream */}
              {remoteStreams[p.id] ? (
                <video
                  ref={(el) => {
                    remoteVideoRefs.current[p.id] = el;
                    if (el && remoteStreams[p.id]) {
                      if (el.srcObject !== remoteStreams[p.id]) {
                        el.srcObject = remoteStreams[p.id];
                      }
                      el.volume = remoteVolume;
                      el.play().catch(() => {});
                    }
                  }}
                  autoPlay playsInline
                  className={`w-full h-full object-cover transition-opacity duration-300 ${
                    p.video ? "opacity-100" : "opacity-0 absolute pointer-events-none"
                  }`}
                />
              ) : null}

              {/* Fallback when no stream or camera is off */}
              {(!remoteStreams[p.id] || !p.video) && (
                <div className="absolute inset-0 bg-gradient-to-br from-stone-900 to-stone-850 flex flex-col items-center justify-center p-2">
                  {!remoteStreams[p.id] ? (
                    // Connecting state — animated avatar
                    <>
                      <div className="relative mb-2">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-black text-white shadow-lg ${
                          p.role === "teacher"
                            ? "bg-gradient-to-br from-teal-500 to-emerald-600"
                            : "bg-gradient-to-br from-indigo-500 to-violet-600"
                        }`}>
                          {p.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-amber-400 border-2 border-stone-900 animate-pulse" />
                      </div>
                      <span className="text-[9px] text-stone-400 font-bold">{isRTL ? "جاري الاتصال..." : "Connecting..."}</span>
                    </>
                  ) : (
                    // Camera off state
                    <>
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-black text-white shadow-lg mb-1 ${
                        p.role === "teacher"
                          ? "bg-gradient-to-br from-teal-500 to-emerald-600"
                          : "bg-gradient-to-br from-indigo-500 to-violet-600"
                      }`}>
                        {p.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <span className="text-[9px] text-stone-500 font-bold">{isRTL ? "الكاميرا مغلقة" : "Camera Off"}</span>
                    </>
                  )}
                </div>
              )}

              {/* Screen share indicator on sidebar card */}
              {remoteScreenSharing[p.id] && (
                <div className="absolute top-1 right-1 z-20">
                  <span className="bg-teal-500 text-stone-950 text-[7px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                    <ScreenShare size={7} /> {isRTL ? "شاشة" : "Screen"}
                  </span>
                </div>
              )}

              <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between z-10">
                <span className="bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded-md text-[8px] font-bold border border-white/5">{p.name} {p.role === "teacher" && "⭐️"}</span>
                <div className="flex gap-1">
                  {!p.mic && <Badge className="bg-rose-500 text-white p-0.5 rounded-md"><MicOff size={8} /></Badge>}
                  {p.hand && <Badge className="bg-yellow-500 text-stone-950 px-1 py-0.5 rounded-md text-[8px] font-black animate-bounce">🙋‍♂️</Badge>}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── SIDEBAR (Chat / Participants / Notes) ── */}
        <aside className={`transition-all duration-300 relative ${sidebarOpen ? "w-full md:w-96" : "w-0 overflow-hidden border-none"} bg-stone-900/40 backdrop-blur-md border-t md:border-t-0 md:border-r md:border-l border-white/5 flex flex-col z-10`}>
          <div className="h-16 border-b border-white/5 p-2 flex gap-1">
            {[
              { id: "chat", label: isRTL ? "الدردشة" : "Chat", icon: MessageSquare },
              { id: "participants", label: isRTL ? "الحاضرين" : "Users", icon: Users },
              { id: "notes", label: isRTL ? "الملاحظات" : "Notes", icon: FileText },
            ].map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex-1 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-300 ${activeTab === tab.id ? "bg-stone-800 text-white shadow-sm" : "text-stone-400 hover:text-white hover:bg-stone-800/50"}`}>
                <tab.icon size={16} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="flex-1 flex flex-col p-4 min-h-0 relative">
            <AnimatePresence mode="wait">
              {activeTab === "chat" && (
                <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col justify-between">
                  <div className="space-y-4 flex-1 overflow-y-auto mb-4">
                    {chatMessages.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full text-stone-600 py-12">
                        <MessageSquare size={32} className="mb-2 opacity-30" />
                        <p className="text-xs font-bold">{isRTL ? "لا توجد رسائل بعد" : "No messages yet"}</p>
                      </div>
                    )}
                    {chatMessages.map((msg, i) => {
                      const isMe = msg.sender_name === userName;
                      const time = msg.created_at ? new Date(msg.created_at).toLocaleTimeString(isRTL ? "ar-EG" : "en-US", { hour: "2-digit", minute: "2-digit" }) : "";
                      return (
                        <div key={msg.id || i} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold text-stone-400">{msg.sender_name}</span>
                            <span className="text-[8px] text-stone-500">{time}</span>
                          </div>
                          <div className={`px-4 py-2.5 rounded-2xl text-[11px] font-medium max-w-[85%] leading-relaxed shadow-sm ${isMe ? "bg-teal-600/90 backdrop-blur-sm text-white rounded-br-none" : "bg-stone-800 border border-white/5 text-stone-200 rounded-bl-none"}`}>
                            {msg.content || msg.message_text}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                  <div className="flex gap-2 bg-stone-850 p-1.5 rounded-2xl border border-white/5 mt-auto shadow-inner">
                    <Input value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSendMessage()} placeholder={isRTL ? "اكتب رسالة..." : "Type a message..."} className="border-none bg-transparent text-xs focus-visible:ring-0 text-white w-full placeholder:text-stone-500" />
                    <button onClick={handleSendMessage} className="h-10 w-10 rounded-xl bg-teal-500 text-stone-950 flex items-center justify-center shrink-0 hover:bg-teal-400 transition-all hover:scale-105 active:scale-95 shadow-md"><Send size={16} /></button>
                  </div>
                </motion.div>
              )}

              {activeTab === "participants" && (
                <motion.div key="participants" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3 overflow-y-auto flex-1 pr-1">
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
                <motion.div key="notes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col flex-1 min-h-0">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Info size={12} />
                    {isRTL ? "الملاحظات المشتركة للصف الدراسي" : "Shared notes panel"}
                  </p>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={isRTL ? "ابدأ كتابة الملاحظات..." : "Start writing lesson notes..."} className="flex-1 w-full bg-stone-800/50 rounded-2xl p-4 border border-white/5 text-xs text-stone-200 focus:outline-none focus:border-stone-600 resize-none font-mono shadow-inner" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </aside>
      </div>
    </div>
  );
}
