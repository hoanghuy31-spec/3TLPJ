import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@uno/shared';

// Create socket instance
const createSocket = (): Socket<ServerToClientEvents, ClientToServerEvents> => {
  const url = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
  return io(url, {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });
};

let socket: ReturnType<typeof createSocket> | null = null;

export const getSocket = (): Socket<ServerToClientEvents, ClientToServerEvents> => {
  if (!socket) {
    socket = createSocket();
  }
  return socket;
};

export const connectSocket = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const s = getSocket();
    
    if (s.connected) {
      resolve();
      return;
    }

    s.connect();

    s.once('connect', () => {
      resolve();
    });

    s.once('connect_error', (error) => {
      reject(error);
    });
  });
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const useSocket = () => {
  const s = getSocket();

  useEffect(() => {
    return () => {
      // Cleanup on unmount if needed
    };
  }, []);

  return s;
};

// Re-export socket event types for convenience
export { SOCKET_EVENTS } from '@uno/shared';