import {
  type Card,
  type CardColor,
  type ClientToServerEvents,
  GAME_CONFIG,
  type GamePlayer,
  type Player,
  type Room,
  type ServerToClientEvents,
  SOCKET_EVENTS,
} from '@uno/shared';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fork } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

import { initializeRound } from './game/deal.js';
import { createDeck } from './game/deck.js';
import {
  canCallUno,
  canPlayCard,
  checkWin,
  getNextPlayerIndex,
  handleReverse,
  isPlayableColor,
  isWildCard,
  replenishDeck,
} from './game/rules.js';
import { shuffleDeck } from './game/shuffle.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin:
      process.env.NODE_ENV === 'production'
        ? false
        : ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST'],
  },
});

const PORT = parseInt(process.env.PORT || '3001', 10);

// In-memory storage
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
  socket.on(SOCKET_EVENTS.ROOM_CREATE, ({ playerName, avatar, cardSkin }: any) => {
    // Leave current room if any
    const currentRoomId = playerToRoom.get(socket.id);
    if (currentRoomId) {
      const room = rooms.get(currentRoomId);
      if (room) {
        room.players = room.players.filter((p) => p.id !== socket.id);
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
      avatar: avatar || '🧑',
      cardSkin: cardSkin || 'classic',
    };

    const room: Room = {
      id: roomCode,
      hostId: socket.id,
      players: [player],
      maxPlayers: GAME_CONFIG.MAX_PLAYERS,
      status: 'waiting',
      createdAt: Date.now(),
      theme: 'neon',
    };

    rooms.set(roomCode, room);
    playerToRoom.set(socket.id, roomCode);
    socket.join(roomCode);

    socket.emit(SOCKET_EVENTS.ROOM_CREATED, { room });
    console.log(`Room created: ${roomCode} by ${playerName}`);
  });

  // Join room
  socket.on(SOCKET_EVENTS.ROOM_JOIN, ({ roomCode, playerName, avatar, cardSkin }: any) => {
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
        oldRoom.players = oldRoom.players.filter((p) => p.id !== socket.id);
        io.to(currentRoomId).emit(SOCKET_EVENTS.ROOM_UPDATED, { room: oldRoom });
      }
      playerToRoom.delete(socket.id);
      socket.leave(currentRoomId);
    }

    const player: Player = {
      id: socket.id,
      name: playerName,
      isReady: false,
      avatar: avatar || '🧑',
      cardSkin: cardSkin || 'classic',
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

    const player = room.players.find((p) => p.id === socket.id);
    if (player) {
      player.isReady = ready;
      io.to(roomId).emit(SOCKET_EVENTS.ROOM_UPDATED, { room });
    }
  });

  // Add Bot to room (Host requested)
  socket.on('room:bot-add' as any, () => {
    const roomId = playerToRoom.get(socket.id);
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room || room.players.length >= room.maxPlayers) {
      socket.emit(SOCKET_EVENTS.ROOM_ERROR, { message: 'Phòng đã đủ người chơi!' });
      return;
    }

    let scriptPath = path.resolve(process.cwd(), 'client/test-bots.js');
    if (!existsSync(scriptPath)) {
      scriptPath = path.resolve(process.cwd(), '../client/test-bots.js');
    }

    fork(scriptPath, [roomId, '1'], {
      env: { ...process.env, VITE_SERVER_URL: `http://localhost:${PORT}` },
      stdio: 'inherit',
    });
    console.log(`Spawned AI Bot for room ${roomId}`);
  });

  // Set room theme (Host only)
  socket.on('room:set-theme' as any, ({ theme }: { theme: string }) => {
    const roomId = playerToRoom.get(socket.id);
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room || room.hostId !== socket.id) return;
    room.theme = theme;
    io.to(roomId).emit(SOCKET_EVENTS.ROOM_UPDATED, { room });
    console.log(`Room ${roomId} theme changed to: ${theme}`);
  });

  // Update player cosmetics
  socket.on('player:update-cosmetics' as any, ({ avatar, cardSkin }: { avatar?: string; cardSkin?: string }) => {
    const roomId = playerToRoom.get(socket.id);
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;
    const player = room.players.find((p) => p.id === socket.id);
    if (player) {
      if (avatar) player.avatar = avatar;
      if (cardSkin) player.cardSkin = cardSkin;
      io.to(roomId).emit(SOCKET_EVENTS.ROOM_UPDATED, { room });
      if (room.gameState) {
        const gamePlayer = room.gameState.players.find((p) => p.id === socket.id);
        if (gamePlayer) {
          if (avatar) gamePlayer.avatar = avatar;
          if (cardSkin) gamePlayer.cardSkin = cardSkin;
          io.to(roomId).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, { gameState: room.gameState });
        }
      }
    }
  });

  // Start game
  socket.on(SOCKET_EVENTS.GAME_START, () => {
    const roomId = playerToRoom.get(socket.id);
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    // Only host can start
    if (room.hostId !== socket.id) {
      socket.emit(SOCKET_EVENTS.ROOM_ERROR, {
        message: 'Only the host can start the game',
      });
      return;
    }

    // Check minimum players and readiness
    if (room.players.length < GAME_CONFIG.MIN_PLAYERS) {
      socket.emit(SOCKET_EVENTS.ROOM_ERROR, { message: 'Not enough players' });
      return;
    }
    const allReady = room.players.every((p) => p.isReady);
    if (!allReady) {
      socket.emit(SOCKET_EVENTS.ROOM_ERROR, { message: 'All players must be ready' });
      return;
    }

    // Shuffle & deal
    const newDeck = shuffleDeck(createDeck());
    const { gamePlayers, deck: remainingDeck, discardPile, firstCard } =
      initializeRound(newDeck, room.players);

    // Initial color should be playable (red/blue/green/yellow)
    const initialColor = isPlayableColor(firstCard.color) ? firstCard.color : 'red';

    // Update status
    room.status = 'playing';
    room.gameState = {
      roomId: room.id,
      deck: remainingDeck,
      discardPile,
      players: gamePlayers,
      currentPlayerIndex: 0,
      direction: 1,
      currentColor: initialColor,
      status: 'active',
      turnNumber: 1,
      lastPlayedCard: firstCard,
    };

    io.to(roomId).emit(SOCKET_EVENTS.GAME_STARTED, { gameState: room.gameState });
    io.to(roomId).emit(SOCKET_EVENTS.ROOM_UPDATED, { room });
    console.log(`Game started in room ${roomId}`);
  });

  // Play a card
  socket.on(SOCKET_EVENTS.CARD_PLAY, ({ cardId, chosenColor }) => {
    const roomId = playerToRoom.get(socket.id);
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room || !room.gameState || room.gameState.status !== 'active') {
      socket.emit(SOCKET_EVENTS.GAME_ERROR, { message: 'Game is not active' });
      return;
    }

    const gameState = room.gameState;
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.id !== socket.id) {
      socket.emit(SOCKET_EVENTS.GAME_ERROR, { message: 'Not your turn' });
      return;
    }

    const cardIndex = currentPlayer.cards.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) {
      socket.emit(SOCKET_EVENTS.GAME_ERROR, { message: 'Card not in your hand' });
      return;
    }

    const playedCard = currentPlayer.cards[cardIndex];
    const topCard = gameState.discardPile[gameState.discardPile.length - 1];

    if (!canPlayCard(playedCard, topCard, gameState.currentColor)) {
      socket.emit(SOCKET_EVENTS.GAME_ERROR, { message: 'Cannot play this card' });
      return;
    }

    if (isWildCard(playedCard)) {
      if (!chosenColor || !isPlayableColor(chosenColor)) {
        socket.emit(SOCKET_EVENTS.GAME_ERROR, {
          message: 'Must select a valid color for wild card',
        });
        return;
      }
    }

    // Remove played card from player hand and add to discard pile
    currentPlayer.cards.splice(cardIndex, 1);
    gameState.discardPile.push(playedCard);
    gameState.lastPlayedCard = playedCard;
    gameState.currentColor =
      isWildCard(playedCard) && chosenColor ? chosenColor : playedCard.color;

    // Reset unoCalled if player has more than 1 card
    if (currentPlayer.cards.length > 1) {
      currentPlayer.unoCalled = false;
    }

    // Check win condition
    if (checkWin(currentPlayer)) {
      gameState.status = 'ended';
      room.status = 'finished';
      io.to(roomId).emit(SOCKET_EVENTS.CARD_PLAYED, {
        playerId: socket.id,
        card: playedCard,
        gameState,
      });
      io.to(roomId).emit(SOCKET_EVENTS.GAME_ENDED, {
        winner: currentPlayer,
        gameState,
      });
      io.to(roomId).emit(SOCKET_EVENTS.ROOM_UPDATED, { room });
      console.log(`Player ${currentPlayer.name} won the game in room ${roomId}!`);
      return;
    }

    // Helper: draw cards for a target player with automatic replenishment
    const drawForPlayer = (count: number, player: GamePlayer) => {
      for (let i = 0; i < count; i++) {
        if (gameState.deck.length === 0) {
          const replenished = replenishDeck(gameState.deck, gameState.discardPile);
          gameState.deck = replenished.newDeck;
          gameState.discardPile = replenished.newDiscardPile;
        }
        if (gameState.deck.length > 0) {
          const drawn = gameState.deck.shift()!;
          player.cards.push(drawn);
        }
      }
    };

    // Apply action effects
    if (playedCard.value === 'skip') {
      // Advance by 2 positions (skip next player)
      gameState.currentPlayerIndex = getNextPlayerIndex(
        gameState.currentPlayerIndex,
        gameState.players.length,
        gameState.direction,
        2
      );
    } else if (playedCard.value === 'reverse') {
      if (gameState.players.length === 2) {
        // In 2-player UNO, reverse functions as a skip (turn goes back to current player)
        gameState.direction = handleReverse(gameState.players.length, gameState.direction);
        gameState.currentPlayerIndex = getNextPlayerIndex(
          gameState.currentPlayerIndex,
          gameState.players.length,
          gameState.direction,
          2
        );
      } else {
        gameState.direction = handleReverse(gameState.players.length, gameState.direction);
        gameState.currentPlayerIndex = getNextPlayerIndex(
          gameState.currentPlayerIndex,
          gameState.players.length,
          gameState.direction,
          1
        );
      }
    } else if (playedCard.value === 'draw2') {
      const victimIndex = getNextPlayerIndex(
        gameState.currentPlayerIndex,
        gameState.players.length,
        gameState.direction,
        1
      );
      const victim = gameState.players[victimIndex];
      drawForPlayer(2, victim);
      // Victim also loses turn
      gameState.currentPlayerIndex = getNextPlayerIndex(
        gameState.currentPlayerIndex,
        gameState.players.length,
        gameState.direction,
        2
      );
    } else if (playedCard.value === 'wild_draw4') {
      const victimIndex = getNextPlayerIndex(
        gameState.currentPlayerIndex,
        gameState.players.length,
        gameState.direction,
        1
      );
      const victim = gameState.players[victimIndex];
      drawForPlayer(4, victim);
      // Victim also loses turn
      gameState.currentPlayerIndex = getNextPlayerIndex(
        gameState.currentPlayerIndex,
        gameState.players.length,
        gameState.direction,
        2
      );
    } else {
      // Normal card or standard Wild
      gameState.currentPlayerIndex = getNextPlayerIndex(
        gameState.currentPlayerIndex,
        gameState.players.length,
        gameState.direction,
        1
      );
    }

    gameState.turnNumber++;
    const nextPlayer = gameState.players[gameState.currentPlayerIndex];

    io.to(roomId).emit(SOCKET_EVENTS.CARD_PLAYED, {
      playerId: socket.id,
      card: playedCard,
      gameState,
    });
    io.to(roomId).emit(SOCKET_EVENTS.TURN_CHANGED, {
      currentPlayerIndex: gameState.currentPlayerIndex,
      playerId: nextPlayer.id,
    });
    io.to(roomId).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, { gameState });
  });

  // Draw card
  socket.on(SOCKET_EVENTS.CARD_DRAW, () => {
    const roomId = playerToRoom.get(socket.id);
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room || !room.gameState || room.gameState.status !== 'active') {
      socket.emit(SOCKET_EVENTS.GAME_ERROR, { message: 'Game is not active' });
      return;
    }

    const gameState = room.gameState;
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.id !== socket.id) {
      socket.emit(SOCKET_EVENTS.GAME_ERROR, { message: 'Not your turn' });
      return;
    }

    if (gameState.deck.length === 0) {
      const replenished = replenishDeck(gameState.deck, gameState.discardPile);
      gameState.deck = replenished.newDeck;
      gameState.discardPile = replenished.newDiscardPile;
    }

    if (gameState.deck.length === 0) {
      socket.emit(SOCKET_EVENTS.GAME_ERROR, { message: 'No cards left to draw' });
      return;
    }

    const drawnCard = gameState.deck.shift()!;
    currentPlayer.cards.push(drawnCard);

    // After drawing, turn passes to next player
    gameState.currentPlayerIndex = getNextPlayerIndex(
      gameState.currentPlayerIndex,
      gameState.players.length,
      gameState.direction,
      1
    );
    gameState.turnNumber++;
    const nextPlayer = gameState.players[gameState.currentPlayerIndex];

    socket.emit(SOCKET_EVENTS.CARD_DRAWN, { playerId: socket.id, card: drawnCard });
    io.to(roomId).emit(SOCKET_EVENTS.TURN_CHANGED, {
      currentPlayerIndex: gameState.currentPlayerIndex,
      playerId: nextPlayer.id,
    });
    io.to(roomId).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, { gameState });
  });

  // Call UNO
  socket.on(SOCKET_EVENTS.UNO_CALL, () => {
    const roomId = playerToRoom.get(socket.id);
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room || !room.gameState || room.gameState.status !== 'active') return;

    const player = room.gameState.players.find((p) => p.id === socket.id);
    if (player) {
      if (canCallUno(player)) {
        player.unoCalled = true;
        io.to(roomId).emit(SOCKET_EVENTS.PLAYER_UNO_CALLED, {
          playerId: socket.id,
          playerName: player.name,
        });
        io.to(roomId).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, { gameState: room.gameState });
        console.log(`Player ${player.name} called UNO!`);
      } else {
        socket.emit(SOCKET_EVENTS.GAME_ERROR, {
          message: 'Chỉ có thể hô UNO khi bạn còn 1 hoặc 2 lá bài!',
        });
      }
    }
  });

  // Catch missed UNO (Bắt người khác không hô UNO)
  socket.on(SOCKET_EVENTS.UNO_CATCH, (data?: { targetPlayerId?: string }) => {
    const roomId = playerToRoom.get(socket.id);
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room || !room.gameState || room.gameState.status !== 'active') return;

    const catcher = room.gameState.players.find((p) => p.id === socket.id);
    if (!catcher) return;

    // Tìm người chơi có 1 lá mà chưa hô UNO (không phải người bắt)
    const targetPlayerId = data?.targetPlayerId;
    let victim: GamePlayer | undefined;
    if (targetPlayerId) {
      victim = room.gameState.players.find((p) => p.id === targetPlayerId && p.id !== socket.id);
    } else {
      victim = room.gameState.players.find((p) => p.id !== socket.id && p.cards.length === 1 && !p.unoCalled);
    }

    if (!victim || victim.cards.length !== 1 || victim.unoCalled) {
      socket.emit(SOCKET_EVENTS.GAME_ERROR, {
        message: 'Không có người chơi nào quên hô UNO để bắt!',
      });
      return;
    }

    // Phạt rút 2 lá bài
    const gameState = room.gameState;
    const penaltyCards = 2;
    for (let i = 0; i < penaltyCards; i++) {
      if (gameState.deck.length === 0) {
        const replenished = replenishDeck(gameState.deck, gameState.discardPile);
        gameState.deck = replenished.newDeck;
        gameState.discardPile = replenished.newDiscardPile;
      }
      if (gameState.deck.length > 0) {
        const drawn = gameState.deck.shift()!;
        victim.cards.push(drawn);
      }
    }

    victim.unoCalled = false;

    console.log(`[UNO CATCH] ${catcher.name} caught ${victim.name} for not calling UNO! Penalty: ${penaltyCards} cards.`);

    // Thông báo cho toàn phòng
    io.to(roomId).emit(SOCKET_EVENTS.PLAYER_UNO_CAUGHT, {
      catcherId: catcher.id,
      catcherName: catcher.name,
      victimId: victim.id,
      victimName: victim.name,
      penaltyCards,
    });

    io.to(roomId).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, { gameState });
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

  const player = room.players.find((p) => p.id === socket.id);
  if (player) {
    room.players = room.players.filter((p) => p.id !== socket.id);

    // Notify others
    io.to(roomId).emit(SOCKET_EVENTS.ROOM_PLAYER_LEFT, { playerId: socket.id });

    // If game was playing, update gameState
    if (room.gameState && room.status === 'playing') {
      room.gameState.players = room.gameState.players.filter((p) => p.id !== socket.id);
      if (room.gameState.players.length < 2) {
        room.gameState.status = 'ended';
        room.status = 'finished';
        io.to(roomId).emit(SOCKET_EVENTS.GAME_ERROR, {
          message: 'Game ended because too many players left',
        });
      } else {
        if (room.gameState.currentPlayerIndex >= room.gameState.players.length) {
          room.gameState.currentPlayerIndex = 0;
        }
        io.to(roomId).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, { gameState: room.gameState });
      }
    }

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
