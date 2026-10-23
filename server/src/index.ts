import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { GAME_CONFIG, SOCKET_EVENTS, type Room, type Player, type ServerToClientEvents, type ClientToServerEvents } from '@uno/shared';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? false 
      : ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST'],
  },
});

const PORT = parseInt(process.env.PORT || '3001', 10);

// In-memory storage (will be replaced with proper storage later)
const rooms = new Map<string, Room>();
const playerToRoom = new Map<string, string>();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    uptime: process.uptime(),
    version: '0.1.0',
  });
});

// Generate room code
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < GAME_CONFIG.ROOM_CODE_LENGTH; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Helper to get room by code
function getRoomByCode(code: string): Room | undefined {
  for (const room of rooms.values()) {
    if (room.id === code) return room;
  }
  return undefined;
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Create room
  socket.on(SOCKET_EVENTS.ROOM_CREATE, ({ playerName }) => {
    // Leave current room if any
    const currentRoomId = playerToRoom.get(socket.id);
    if (currentRoomId) {
      const room = rooms.get(currentRoomId);
      if (room) {
        room.players = room.players.filter(p => p.id !== socket.id);
        socket.leave(currentRoomId);
        io.to(currentRoomId).emit(SOCKET_EVENTS.ROOM_UPDATED, { room });
      }
      playerToRoom.delete(socket.id);
    }

    // Generate unique room code
    let roomCode: string;
    do {
      roomCode = generateRoomCode();
    } while (rooms.has(roomCode));

    const player: Player = {
      id: socket.id,
      name: playerName,
      isReady: false,
    };

    const room: Room = {
      id: roomCode,
      hostId: socket.id,
      players: [player],
      maxPlayers: GAME_CONFIG.MAX_PLAYERS,
      status: 'waiting',
      createdAt: Date.now(),
    };

    rooms.set(roomCode, room);
    playerToRoom.set(socket.id, roomCode);
    socket.join(roomCode);

    socket.emit(SOCKET_EVENTS.ROOM_CREATED, { room });
    console.log(`Room created: ${roomCode} by ${playerName}`);
  });

  // Join room
  socket.on(SOCKET_EVENTS.ROOM_JOIN, ({ roomCode, playerName }) => {
    const code = roomCode.toUpperCase();
    const room = getRoomByCode(code);

    if (!room) {
      socket.emit(SOCKET_EVENTS.ROOM_ERROR, { message: 'Room not found' });
      return;
    }

    if (room.players.length >= room.maxPlayers) {
      socket.emit(SOCKET_EVENTS.ROOM_ERROR, { message: 'Room is full' });
      return;
    }

    if (room.status !== 'waiting') {
      socket.emit(SOCKET_EVENTS.ROOM_ERROR, { message: 'Game already started' });
      return;
    }

    // Leave current room if any
    const currentRoomId = playerToRoom.get(socket.id);
    if (currentRoomId && currentRoomId !== code) {
      const oldRoom = rooms.get(currentRoomId);
      if (oldRoom) {
        oldRoom.players = oldRoom.players.filter(p => p.id !== socket.id);
        io.to(currentRoomId).emit(SOCKET_EVENTS.ROOM_UPDATED, { room: oldRoom });
      }
      playerToRoom.delete(socket.id);
      socket.leave(currentRoomId);
    }

    const player: Player = {
      id: socket.id,
      name: playerName,
      isReady: false,
    };

    room.players.push(player);
    playerToRoom.set(socket.id, code);
    socket.join(code);

    // Notify the joining player
    socket.emit(SOCKET_EVENTS.ROOM_JOINED, { room, playerId: socket.id });
    
    // Notify others in room
    socket.to(code).emit(SOCKET_EVENTS.ROOM_PLAYER_JOINED, { player });
    socket.to(code).emit(SOCKET_EVENTS.ROOM_UPDATED, { room });
    
    console.log(`${playerName} joined room ${code}`);
  });

  // Leave room
  socket.on(SOCKET_EVENTS.ROOM_LEAVE, () => {
    handlePlayerLeave(socket);
  });

  // Toggle ready status
  socket.on(SOCKET_EVENTS.ROOM_READY, ({ ready }) => {
    const roomId = playerToRoom.get(socket.id);
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (player) {
      player.isReady = ready;
      io.to(roomId).emit(SOCKET_EVENTS.ROOM_UPDATED, { room });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    handlePlayerLeave(socket);
  });

  // Ping
  socket.on(SOCKET_EVENTS.PING, () => {
    socket.emit(SOCKET_EVENTS.PONG);
  });
});

// Helper function to handle player leaving
function handlePlayerLeave(socket: { id: string; leave: (room: string) => void }) {
  const roomId = playerToRoom.get(socket.id);
  if (!roomId) return;

  const room = rooms.get(roomId);
  if (!room) return;

  const player = room.players.find(p => p.id === socket.id);
  if (player) {
    room.players = room.players.filter(p => p.id !== socket.id);
    
    // Notify others
    io.to(roomId).emit(SOCKET_EVENTS.ROOM_PLAYER_LEFT, { playerId: socket.id });
    
    // If room is empty, delete it
    if (room.players.length === 0) {
      rooms.delete(roomId);
      console.log(`Room ${roomId} deleted (empty)`);
    } else {
      // Transfer host if host left
      if (room.hostId === socket.id) {
        room.hostId = room.players[0].id;
      }
      io.to(roomId).emit(SOCKET_EVENTS.ROOM_UPDATED, { room });
    }
  }

  playerToRoom.delete(socket.id);
  socket.leave(roomId);
  console.log(`Player ${socket.id} left room ${roomId}`);
}

// Start server
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

export { app, io };
