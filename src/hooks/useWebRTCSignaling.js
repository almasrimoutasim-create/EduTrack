import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * هوك مخصص لإدارة إشارات WebRTC (Signaling)
 * يعتمد على WebSocket بدلاً من Polling في قاعدة البيانات
 */
export function useWebRTCSignaling(roomId, userId) {
  const wsRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const onSignalEventRef = useRef(null);

  const reconnectTimeoutRef = useRef(null);
  const maxRetries = 5;
  const retryCount = useRef(0);

  const connect = useCallback(() => {
    if (!roomId || !userId) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/classroom-ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[WebRTC Signaling] Connected');
      setIsConnected(true);
      retryCount.current = 0;
      
      ws.send(JSON.stringify({
        type: 'join',
        roomId,
        userId
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'signal') {
          if (onSignalEventRef.current) {
            onSignalEventRef.current(data.senderId, data.payload);
          }
        }
      } catch (err) {
        console.error('[WebRTC Signaling] Error parsing message', err);
      }
    };

    ws.onclose = () => {
      console.log('[WebRTC Signaling] Disconnected');
      setIsConnected(false);
      
      if (retryCount.current < maxRetries) {
        reconnectTimeoutRef.current = setTimeout(() => {
          retryCount.current += 1;
          connect();
        }, 2000 * retryCount.current);
      }
    };

    ws.onerror = (err) => {
      console.error('[WebRTC Signaling] Error', err);
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

  // إرسال إشارة (Offer, Answer, ICE) لشخص محدد (أو للجميع إذا targetUserId = 'all')
  const sendSignal = useCallback((targetUserId, payload) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'signal',
        roomId,
        userId,
        senderId: userId,
        targetUserId: targetUserId === 'all' ? null : targetUserId,
        payload
      }));
    } else {
      console.warn('[WebRTC Signaling] WebSocket not open, failed to send signal.');
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
