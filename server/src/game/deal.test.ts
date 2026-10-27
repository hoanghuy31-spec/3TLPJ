import { describe, it, expect } from 'vitest';
import { createDeck } from './deck.js';
import { shuffleDeckSeeded } from './shuffle.js';
import { dealCards, createGamePlayers, drawCards, initializeRound } from './deal.js';
import { GAME_CONFIG } from '@uno/shared';

describe('Deal Module', () => {
  const players = [
    { id: 'player-1', name: 'Alice', isReady: false },
    { id: 'player-2', name: 'Bob', isReady: false },
    { id: 'player-3', name: 'Charlie', isReady: false },
    { id: 'player-4', name: 'Diana', isReady: false },
  ];

  describe('dealCards', () => {
    it('should deal 7 cards to each player by default', () => {
      const deck = shuffleDeckSeeded(createDeck(), 42);
      const { hands } = dealCards(deck, players);
      
      expect(hands.size).toBe(4);
      for (const hand of hands.values()) {
        expect(hand).toHaveLength(7);
      }
    });

    it('should deal specified number of cards', () => {
      const deck = shuffleDeckSeeded(createDeck(), 42);
      const { hands } = dealCards(deck, players, 5);
      
      for (const hand of hands.values()) {
        expect(hand).toHaveLength(5);
      }
    });

    it('should give each player unique cards', () => {
      const deck = shuffleDeckSeeded(createDeck(), 42);
      const { hands } = dealCards(deck, players);
      
      const allCardIds = new Set<string>();
      for (const hand of hands.values()) {
        for (const card of hand) {
          expect(allCardIds.has(card.id)).toBe(false);
          allCardIds.add(card.id);
        }
      }
    });

    it('should return remaining deck', () => {
      const deck = shuffleDeckSeeded(createDeck(), 42);
      const { remainingDeck } = dealCards(deck, players);
      
      // 108 total - (4 players * 7 cards) = 80 remaining
      expect(remainingDeck).toHaveLength(80);
    });

    it('should throw if not enough cards', () => {
      const shortDeck = Array(20).fill(null).map((_, i) => ({
        id: `card-${i}`,
        color: 'red' as const,
        value: '1' as const,
      }));
      
      expect(() => dealCards(shortDeck, players)).toThrow('Not enough cards in deck to deal');
    });
  });

  describe('createGamePlayers', () => {
    it('should create GamePlayer objects with hands', () => {
      const deck = shuffleDeckSeeded(createDeck(), 42);
      const { hands } = dealCards(deck, players);
      const gamePlayers = createGamePlayers(players, hands);
      
      expect(gamePlayers).toHaveLength(4);
      for (const gp of gamePlayers) {
        expect(gp.cards).toBeDefined();
        expect(gp.isReady).toBe(false);
        expect(gp.unoCalled).toBe(false);
      }
    });

    it('should map player info correctly', () => {
      const deck = shuffleDeckSeeded(createDeck(), 42);
      const { hands } = dealCards(deck, players);
      const gamePlayers = createGamePlayers(players, hands);
      
      const alice = gamePlayers.find((p) => p.name === 'Alice');
      expect(alice?.id).toBe('player-1');
      expect(alice?.cards).toHaveLength(7);
    });
  });

  describe('drawCards', () => {
    it('should draw specified number of cards', () => {
      const deck = shuffleDeckSeeded(createDeck(), 42);
      const { drawn, remaining } = drawCards(deck, 5);
      
      expect(drawn).toHaveLength(5);
      expect(remaining).toHaveLength(deck.length - 5);
    });

    it('should return first cards from deck', () => {
      const deck = shuffleDeckSeeded(createDeck(), 42);
      const { drawn } = drawCards(deck, 3);
      
      for (let i = 0; i < 3; i++) {
        expect(drawn[i].id).toBe(deck[i].id);
      }
    });

    it('should throw if drawing more than available', () => {
      const deck = shuffleDeckSeeded(createDeck(), 42);
      expect(() => drawCards(deck, 200)).toThrow('Not enough cards in deck to draw');
    });
  });

  describe('initializeRound', () => {
    it('should initialize game state for 4 players', () => {
      const deck = shuffleDeckSeeded(createDeck(), 42);
      const result = initializeRound(deck, players);
      
      expect(result.gamePlayers).toHaveLength(4);
      expect(result.deck).toBeDefined();
      expect(result.discardPile).toBeDefined();
      expect(result.firstCard).toBeDefined();
    });

    it('should deal 7 cards to each player', () => {
      const deck = shuffleDeckSeeded(createDeck(), 42);
      const result = initializeRound(deck, players);
      
      for (const player of result.gamePlayers) {
        expect(player.cards).toHaveLength(7);
      }
    });

    it('should put first card in discard pile', () => {
      const deck = shuffleDeckSeeded(createDeck(), 42);
      const result = initializeRound(deck, players);
      
      expect(result.discardPile).toHaveLength(1);
      expect(result.firstCard.id).toBe(result.discardPile[0].id);
    });

    it('should leave 79 cards in deck (108 - 28 dealt - 1 discard)', () => {
      const deck = shuffleDeckSeeded(createDeck(), 42);
      const result = initializeRound(deck, players);
      
      // 108 total - 28 dealt (4 players × 7 cards) - 1 discard = 79
      expect(result.deck).toHaveLength(79);
    });

    it('should initialize all players with isReady and unoCalled false', () => {
      const deck = shuffleDeckSeeded(createDeck(), 42);
      const result = initializeRound(deck, players);
      
      for (const player of result.gamePlayers) {
        expect(player.isReady).toBe(false);
        expect(player.unoCalled).toBe(false);
      }
    });
  });

  describe('GAME_CONFIG', () => {
    it('should have correct initial hand size', () => {
      expect(GAME_CONFIG.INITIAL_HAND_SIZE).toBe(7);
    });

    it('should have correct max players', () => {
      expect(GAME_CONFIG.MAX_PLAYERS).toBe(10);
    });

    it('should have correct min players', () => {
      expect(GAME_CONFIG.MIN_PLAYERS).toBe(2);
    });
  });
});
