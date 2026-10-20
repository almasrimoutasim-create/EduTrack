import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

// In production (Vercel), we must connect to the Render backend explicitly.
// VITE_API_URL should be set to the Render backend URL (e.g. https://edutrack-xxxx.onrender.com)
// VITE_WS_URL can be set to the same value or left empty for local dev (same-origin).
const WS_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_WS_URL || '';

/**
 * هوك مخصص لإدارة إشارات WebRTC (Signaling) باستخدام socket.io-client
 * يدعم استقبال إشعار انضمام مستخدم جديد للغرفة فوراً (user-joined)
 */
export function useWebRTCSignaling(roomId, userId) {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const onSignalEventRef = useRef(null);
  const onUserJoinedRef = useRef(null);

  useEffect(() => {
    if (!roomId || !userId) return;

    socketRef.current = io(WS_URL, {
      transports: ['websocket'],
      query: { roomId, userId }
    });

    socketRef.current.on('connect', () => {
      console.log('[WebRTC Signaling Socket.io] Connected');
      setIsConnected(true);
      socketRef.current.emit('join-webrtc-room', roomId);
    });

    socketRef.current.on('disconnect', () => {
      console.log('[WebRTC Signaling Socket.io] Disconnected');
      setIsConnected(false);
    });

    socketRef.current.on('signal', (data) => {
      if (onSignalEventRef.current) {
        onSignalEventRef.current(data.senderId, data.payload);
      }
    });

    // عندما ينضم مستخدم جديد للغرفة — يُطلق callback لبدء الاتصال فوراً
    socketRef.current.on('user-joined', (data) => {
      console.log('[WebRTC Signaling] User joined:', data.userId);
      if (onUserJoinedRef.current && data.userId && data.userId !== userId) {
        onUserJoinedRef.current(data.userId);
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [roomId, userId]);

  // إرسال إشارة (Offer, Answer, ICE) لشخص محدد (أو للجميع)
  const sendSignal = useCallback((targetUserId, payload) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('signal', {
        roomId,
        senderId: userId,
        // null = broadcast to all; 'all' string is also treated as broadcast
        targetUserId: (targetUserId === 'all' || targetUserId === null) ? null : targetUserId,
        payload
      });
    } else {
      console.warn('[WebRTC Signaling] Socket.io not connected, failed to send signal.');
    }
  }, [roomId, userId]);

  const onSignal = useCallback((callback) => {
    onSignalEventRef.current = callback;
  }, []);

  // تسجيل callback لحدث انضمام مستخدم جديد
  const onUserJoined = useCallback((callback) => {
    onUserJoinedRef.current = callback;
  }, []);

  return {
    isConnected,
    sendSignal,
    onSignal,
    onUserJoined
  };
}
