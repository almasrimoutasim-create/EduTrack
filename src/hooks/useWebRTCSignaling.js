import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || '';

/**
 * هوك مخصص لإدارة إشارات WebRTC (Signaling) باستخدام socket.io-client
 * تم تصميمه ليتوافق مع إدارة WebRTC الموجودة داخل VirtualClassroom.jsx
 */
export function useWebRTCSignaling(roomId, userId) {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const onSignalEventRef = useRef(null);

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
        targetUserId: targetUserId === 'all' ? null : targetUserId,
        payload
      });
    } else {
      console.warn('[WebRTC Signaling] Socket.io not connected, failed to send signal.');
    }
  }, [roomId, userId]);

  const onSignal = useCallback((callback) => {
    onSignalEventRef.current = callback;
  }, []);

  return {
    isConnected,
    sendSignal,
    onSignal
  };
}
