import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { getToken } from '../api';

// Opens one Socket.IO connection authenticated with the same JWT the HTTP
// layer uses (backend reads it from handshake.auth.token).
export function useSocket() {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) return undefined;

    // Relative URL -> same origin (:5173), Vite proxies /socket.io to :3000.
    const socket = io({ auth: { token }, transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setConnected(false));

    return () => {
      socket.close();
      socketRef.current = null;
      setConnected(false);
    };
  }, []);

  const on = (event, handler) => socketRef.current?.on(event, handler);
  const off = (event, handler) => socketRef.current?.off(event, handler);
  const emit = (event, data) => socketRef.current?.emit(event, data);

  return { socket: socketRef, connected, on, off, emit };
}
