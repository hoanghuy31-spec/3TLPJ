// ============================================================
// SHARED CONSTANTS - Game constants and configuration
// ============================================================

import type { CardColor, CardValue } from './types.js';

/**
 * Game configuration
 */
export const GAME_CONFIG = {
  /** Number of cards dealt to each player at game start */
  INITIAL_HAND_SIZE: 7,
  
  /** Maximum players allowed in a room */
  MAX_PLAYERS: 4,
  
  /** Minimum players required to start game */
  MIN_PLAYERS: 2,
  
  /** Room code length */
  ROOM_CODE_LENGTH: 6,
  
  /** Default port for server */
  DEFAULT_PORT: 3001,
  
  /** Default port for client dev server */
  DEFAULT_CLIENT_PORT: 5173,
} as const;

/**
 * Card colors excluding black (wild cards)
 */
export const PLAYABLE_COLORS: CardColor[] = ['red', 'blue', 'green', 'yellow'];

/**
 * Number card values
 */
export const NUMBER_VALUES: CardValue[] = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

/**
 * Action card values
 */
export const ACTION_VALUES: CardValue[] = ['skip', 'reverse', 'draw2'];

/**
 * Wild card values
 */
export const WILD_VALUES: CardValue[] = ['wild', 'wild_draw4'];

/**
 * Card point values for scoring
 */
export const CARD_POINTS: Record<CardValue, number> = {
  '0': 0, '1': 1, '2': 2, '3': 3, '4': 4,
  '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  'skip': 20,
  'reverse': 20,
  'draw2': 20,
  'wild': 50,
  'wild_draw4': 50,
} as const;

/**
 * Standard deck composition (108 cards total)
 * - Numbers 0-9 in 4 colors (1 zero, 2 of each 1-9 = 40 cards)
 * - Skip, Reverse, Draw2 in 4 colors (2 of each = 24 cards)
 * - Wild and Wild Draw4 (4 of each = 8 cards)
 */
export const STANDARD_DECK_COMPOSITION: { color: CardColor; value: CardValue; count: number }[] = [
  // Number cards: 0 appears once, 1-9 appear twice
  { color: 'red', value: '0', count: 1 },
  { color: 'red', value: '1', count: 2 },
  { color: 'red', value: '2', count: 2 },
  { color: 'red', value: '3', count: 2 },
  { color: 'red', value: '4', count: 2 },
  { color: 'red', value: '5', count: 2 },
  { color: 'red', value: '6', count: 2 },
  { color: 'red', value: '7', count: 2 },
  { color: 'red', value: '8', count: 2 },
  { color: 'red', value: '9', count: 2 },
  { color: 'blue', value: '0', count: 1 },
  { color: 'blue', value: '1', count: 2 },
  { color: 'blue', value: '2', count: 2 },
  { color: 'blue', value: '3', count: 2 },
  { color: 'blue', value: '4', count: 2 },
  { color: 'blue', value: '5', count: 2 },
  { color: 'blue', value: '6', count: 2 },
  { color: 'blue', value: '7', count: 2 },
  { color: 'blue', value: '8', count: 2 },
  { color: 'blue', value: '9', count: 2 },
  { color: 'green', value: '0', count: 1 },
  { color: 'green', value: '1', count: 2 },
  { color: 'green', value: '2', count: 2 },
  { color: 'green', value: '3', count: 2 },
  { color: 'green', value: '4', count: 2 },
  { color: 'green', value: '5', count: 2 },
  { color: 'green', value: '6', count: 2 },
  { color: 'green', value: '7', count: 2 },
  { color: 'green', value: '8', count: 2 },
  { color: 'green', value: '9', count: 2 },
  { color: 'yellow', value: '0', count: 1 },
  { color: 'yellow', value: '1', count: 2 },
  { color: 'yellow', value: '2', count: 2 },
  { color: 'yellow', value: '3', count: 2 },
  { color: 'yellow', value: '4', count: 2 },
  { color: 'yellow', value: '5', count: 2 },
  { color: 'yellow', value: '6', count: 2 },
  { color: 'yellow', value: '7', count: 2 },
  { color: 'yellow', value: '8', count: 2 },
  { color: 'yellow', value: '9', count: 2 },
  // Action cards: 2 of each per color
  { color: 'red', value: 'skip', count: 2 },
  { color: 'red', value: 'reverse', count: 2 },
  { color: 'red', value: 'draw2', count: 2 },
  { color: 'blue', value: 'skip', count: 2 },
  { color: 'blue', value: 'reverse', count: 2 },
  { color: 'blue', value: 'draw2', count: 2 },
  { color: 'green', value: 'skip', count: 2 },
  { color: 'green', value: 'reverse', count: 2 },
  { color: 'green', value: 'draw2', count: 2 },
  { color: 'yellow', value: 'skip', count: 2 },
  { color: 'yellow', value: 'reverse', count: 2 },
  { color: 'yellow', value: 'draw2', count: 2 },
  // Wild cards: 4 of each
  { color: 'black', value: 'wild', count: 4 },
  { color: 'black', value: 'wild_draw4', count: 4 },
];

/**
 * Socket.IO event names (for type safety)
 */
export const SOCKET_EVENTS = {
  // Client to Server
  ROOM_CREATE: 'room:create',
  ROOM_JOIN: 'room:join',
  ROOM_LEAVE: 'room:leave',
  ROOM_READY: 'room:ready',
  ROOM_KICK: 'room:kick',
  ROOM_BOT_ADD: 'room:bot-add',
  ROOM_SET_THEME: 'room:set-theme',
  PLAYER_UPDATE_COSMETICS: 'player:update-cosmetics',
  GAME_START: 'game:start',
  CARD_PLAY: 'card:play',
  CARD_DRAW: 'card:draw',
  UNO_CALL: 'uno:call',
  UNO_CATCH: 'uno:catch',
  PING: 'ping',
  
  // Server to Client
  ROOM_CREATED: 'room:created',
  ROOM_JOINED: 'room:joined',
  ROOM_UPDATED: 'room:updated',
  ROOM_ERROR: 'room:error',
  ROOM_PLAYER_JOINED: 'room:player-joined',
  ROOM_PLAYER_LEFT: 'room:player-left',
  GAME_STARTED: 'game:started',
  GAME_STATE_UPDATE: 'game:state-update',
  GAME_ENDED: 'game:ended',
  GAME_ERROR: 'game:error',
  TURN_CHANGED: 'turn:changed',
  CARD_PLAYED: 'card:played',
  CARD_DRAWN: 'card:drawn',
  PLAYER_UNO_CALLED: 'player:uno-called',
  PLAYER_UNO_CAUGHT: 'player:uno-caught',
  PONG: 'pong',
} as const;

/**
 * HTTP status codes used in API
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
} as const;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  ROOM_NOT_FOUND: 'Room not found',
  ROOM_FULL: 'Room is full',
  ROOM_ALREADY_STARTED: 'Game has already started',
  INVALID_PASSWORD: 'Invalid room password',
  NOT_HOST: 'Only the host can perform this action',
  NOT_YOUR_TURN: 'It is not your turn',
  INVALID_CARD: 'Cannot play this card',
  ALREADY_DRAWING: 'Already drew a card',
} as const;
