// ============================================================
// SHARED TYPES - Types and interfaces shared between client and server
// ============================================================

/**
 * Card color types
 */
export type CardColor = 'red' | 'blue' | 'green' | 'yellow' | 'black';

/**
 * Card value types
 * Number cards: 0-9
 * Action cards: skip, reverse, draw2
 * Wild cards: wild, wild_draw4
 */
export type CardValue = 
  | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
  | 'skip' | 'reverse' | 'draw2'
  | 'wild' | 'wild_draw4';

/**
 * Represents a single card in the deck
 */
export interface Card {
  id: string;         // Unique card identifier
  color: CardColor;   // Card color (red, blue, green, yellow, black)
  value: CardValue;   // Card value
}

/**
 * Player information
 */
export interface Player {
  id: string;         // Socket ID or persistent ID
  name: string;       // Display name
  isReady: boolean;   // Ready status in lobby
}

/**
 * Game room state
 */
export interface Room {
  id: string;                    // Room code (e.g., "ABC123")
  hostId: string;                // Room host socket ID
  players: Player[];             // List of players
  maxPlayers: number;            // Maximum players allowed (default: 4)
  status: RoomStatus;            // Current room status
  createdAt: number;             // Timestamp when room was created
  gameState?: GameState;        // Optional active game state once a round starts
}

/**
 * Room status enum
 */
export type RoomStatus = 'waiting' | 'starting' | 'playing' | 'finished';

/**
 * Game state (full game data)
 */
export interface GameState {
  roomId: string;
  deck: Card[];                  // Remaining deck
  discardPile: Card[];           // Discard pile
  players: GamePlayer[];          // Player states with cards
  currentPlayerIndex: number;     // Index of current player
  direction: GameDirection;       // 1 for clockwise, -1 for counter-clockwise
  currentColor: CardColor;       // Current active color
  status: GameStatus;
  turnNumber: number;
  lastPlayedCard: Card | null;
}

/**
 * Player state during game
 */
export interface GamePlayer extends Player {
  cards: Card[];                 // Cards in hand
 unoCalled: boolean;             // Has called UNO
}

/**
 * Game status
 */
export type GameStatus = 'waiting' | 'active' | 'paused' | 'ended';

/**
 * Game direction
 */
export type GameDirection = 1 | -1;

// ============================================================
// SOCKET.IO EVENT TYPES
// ============================================================

/**
 * Events emitted by the server
 */
export interface ServerToClientEvents {
  // Room events
  'room:created': (data: { room: Room }) => void;
  'room:joined': (data: { room: Room; playerId: string }) => void;
  'room:updated': (data: { room: Room }) => void;
  'room:error': (data: { message: string }) => void;
  'room:player-joined': (data: { player: Player }) => void;
  'room:player-left': (data: { playerId: string }) => void;
  
  // Game events
  'game:started': (data: { gameState: GameState }) => void;
  'game:state-update': (data: { gameState: GameState }) => void;
  'game:ended': (data: { winner: Player; gameState: GameState }) => void;
  'game:error': (data: { message: string }) => void;
  
  // Turn events
  'turn:changed': (data: { currentPlayerIndex: number; playerId: string }) => void;
  
  // Card events
  'card:played': (data: { playerId: string; card: Card; gameState: GameState }) => void;
  'card:drawn': (data: { playerId: string; card: Card }) => void;
  
  // UNO call
  'player:uno-called': (data: { playerId: string }) => void;
  
  // Ping response
  'pong': () => void;
}

/**
 * Events emitted by the client
 */
export interface ClientToServerEvents {
  // Room events
  'room:create': (data: { playerName: string }) => void;
  'room:join': (data: { roomCode: string; playerName: string }) => void;
  'room:leave': () => void;
  'room:ready': (data: { ready: boolean }) => void;
  'room:kick': (data: { playerId: string }) => void;
  
  // Game events
  'game:start': () => void;
  
  // Turn events
  'turn:action': (data: { action: TurnAction }) => void;
  
  // Card events
  'card:play': (data: { cardId: string; chosenColor?: CardColor }) => void;
  'card:draw': () => void;
  
  // UNO call
  'uno:call': () => void;
  
  // Ping
  'ping': () => void;
}

/**
 * Turn actions
 */
export interface TurnAction {
  type: 'play' | 'draw' | 'pass';
  cardId?: string;
  chosenColor?: CardColor;
}

// ============================================================
// API RESPONSE TYPES
// ============================================================

/**
 * API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Health check response
 */
export interface HealthResponse {
  status: 'ok' | 'degraded';
  timestamp: number;
  uptime: number;
  version: string;
}
