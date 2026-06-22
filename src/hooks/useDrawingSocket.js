import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * هوك مخصص لربط اللوح الذكي بسيرفر WebSocket
 * يوفر اتصال فوري وسريع بين المستخدمين بدلاً من قاعدة البيانات
 */
export function useDrawingSocket(roomId, userId) {
  const wsRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const onDrawEventRef = useRef(null);

  // Reconnection variables
  const reconnectTimeoutRef = useRef(null);
  const maxRetries = 5;
  const retryCount = useRef(0);

  const connect = useCallback(() => {
    if (!roomId) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // في الإنتاج، نفس النطاق (window.location.host). في التطوير، نستخدم نفس النطاق لأن Vite يعالج الـ proxy
    const wsUrl = `${protocol}//${window.location.host}/api/classroom-ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[Drawing WebSocket] Connected');
      setIsConnected(true);
      retryCount.current = 0;
      
      // إرسال رسالة أولية لتعريف المستخدم للغرفة
      ws.send(JSON.stringify({
        type: 'join',
        roomId,
        userId
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // التحقق من نوع الحدث واستدعاء الدالة المرجعية إذا كانت متوفرة
        if (data.type === 'draw' || data.type === 'clear-canvas') {
          if (onDrawEventRef.current) {
            onDrawEventRef.current(data);
          }
        }
      } catch (err) {
        console.error('[Drawing WebSocket] Error parsing message', err);
      }
    };

    ws.onclose = () => {
      console.log('[Drawing WebSocket] Disconnected');
      setIsConnected(false);
      
      // محاولة إعادة الاتصال التلقائي
      if (retryCount.current < maxRetries) {
        reconnectTimeoutRef.current = setTimeout(() => {
          retryCount.current += 1;
          connect();
        }, 2000 * retryCount.current);
      }
    };

    ws.onerror = (err) => {
      console.error('[Drawing WebSocket] Error', err);
      ws.close();
    };
  }, [roomId, userId]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const sendDrawEvent = useCallback((drawData) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'draw',
        roomId,
        userId,
        payload: drawData
      }));
    }
  }, [roomId, userId]);

  const clearCanvas = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'clear-canvas',
        roomId,
        userId
      }));
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
