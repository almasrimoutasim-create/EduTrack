import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || '';

/**
 * هوك مخصص لربط اللوح الذكي باستخدام socket.io-client
 */
export function useDrawingSocket(roomId, userId) {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const onDrawEventRef = useRef(null);

  useEffect(() => {
    if (!roomId) return;

    // تهيئة الاتصال بخادم Socket.io
    socketRef.current = io(WS_URL, {
      transports: ['websocket'],
      query: { roomId, userId }
    });

    socketRef.current.on('connect', () => {
      console.log('[Drawing Socket.io] Connected');
      setIsConnected(true);
      socketRef.current.emit('join-room', roomId);
    });

    socketRef.current.on('disconnect', () => {
      console.log('[Drawing Socket.io] Disconnected');
      setIsConnected(false);
    });

    // استقبال حدث الرسم من المستخدمين الآخرين
    socketRef.current.on('draw-event', (data) => {
      if (onDrawEventRef.current) {
        onDrawEventRef.current(data);
      }
    });

    // تنظيف وإغلاق الاتصال عند تدمير المكون
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [roomId, userId]);

  // دالة لإرسال إحداثيات الرسم لباقي المتصلين (متوافقة مع الفرونت-إند)
  const sendDrawEvent = useCallback((drawData) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('draw-event', { type: 'draw', payload: drawData, roomId, userId });
    }
  }, [roomId, userId]);

  // دالة لإرسال أمر مسح السبورة
  const clearCanvas = useCallback(() => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('draw-event', { type: 'clear-canvas', roomId, userId });
    }
  }, [roomId, userId]);

  const onDrawEvent = useCallback((callback) => {
    onDrawEventRef.current = callback;
  }, []);

  return {
    isConnected,
    sendDrawEvent,
    clearCanvas,
    onDrawEvent
  };
}
