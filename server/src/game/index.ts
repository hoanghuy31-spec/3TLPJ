// ============================================================
// GAME MODULE - Main game logic exports
// ============================================================

// Deck operations
export { createDeck, createCustomDeck, getDeckSize, verifyDeck } from './deck.js';
export { shuffleDeck, shuffleDeckInPlace, shuffleDeckSeeded, SeededRandom } from './shuffle.js';
export { dealCards, createGamePlayers, drawCards, initializeRound } from './deal.js';

// Game rules (placeholders for M2)
export * from './rules.js';
