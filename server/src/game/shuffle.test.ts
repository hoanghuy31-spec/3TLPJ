import { describe, it, expect, beforeEach } from 'vitest';
import { shuffleDeck, shuffleDeckInPlace, shuffleDeckSeeded, SeededRandom } from './shuffle.js';
import { createDeck } from './deck.js';

describe('Shuffle Module', () => {
  let deck: ReturnType<typeof createDeck>;

  beforeEach(() => {
    deck = createDeck();
  });

  describe('shuffleDeck', () => {
    it('should return a new array (not modify original)', () => {
      const original = [...deck];
      const shuffled = shuffleDeck(deck);
      
      expect(shuffled).not.toBe(deck);
      expect(deck).toEqual(original);
    });

    it('should have the same cards after shuffling', () => {
      const originalIds = deck.map((card) => card.id);
      const shuffled = shuffleDeck(deck);
      const shuffledIds = shuffled.map((card) => card.id);
      
      expect(shuffledIds.sort()).toEqual(originalIds.sort());
    });

    it('should have same length as original', () => {
      const shuffled = shuffleDeck(deck);
      expect(shuffled).toHaveLength(deck.length);
    });

    it('should shuffle cards (not maintain original order)', () => {
      // Run multiple times to catch any non-shuffling behavior
      let allSame = true;
      for (let i = 0; i < 10; i++) {
        const shuffled = shuffleDeck(deck);
        // Check if at least one card is in a different position
        if (!shuffled.every((card, idx) => card.id === deck[idx].id)) {
          allSame = false;
          break;
        }
      }
      expect(allSame).toBe(false);
    });
  });

  describe('shuffleDeckInPlace', () => {
    it('should modify the original array', () => {
      const copy = [...deck];
      shuffleDeckInPlace(deck);
      
      expect(deck).not.toEqual(copy);
    });

    it('should have same cards after shuffling in place', () => {
      const originalIds = deck.map((card) => card.id);
      shuffleDeckInPlace(deck);
      const shuffledIds = deck.map((card) => card.id);
      
      expect(shuffledIds.sort()).toEqual(originalIds.sort());
    });
  });

  describe('shuffleDeckSeeded', () => {
    it('should produce deterministic results with same seed', () => {
      const result1 = shuffleDeckSeeded(deck, 12345);
      const result2 = shuffleDeckSeeded(deck, 12345);
      
      expect(result1).toEqual(result2);
    });

    it('should produce different results with different seeds', () => {
      const result1 = shuffleDeckSeeded(deck, 12345);
      const result2 = shuffleDeckSeeded(deck, 67890);
      
      expect(result1).not.toEqual(result2);
    });

    it('should have same cards after seeded shuffle', () => {
      const originalIds = deck.map((card) => card.id);
      const shuffled = shuffleDeckSeeded(deck, 42);
      const shuffledIds = shuffled.map((card) => card.id);
      
      expect(shuffledIds.sort()).toEqual(originalIds.sort());
    });
  });

  describe('SeededRandom', () => {
    it('should produce deterministic sequence with same seed', () => {
      const rng1 = new SeededRandom(42);
      const rng2 = new SeededRandom(42);
      
      const seq1 = [rng1.next(), rng1.next(), rng1.next()];
      const seq2 = [rng2.next(), rng2.next(), rng2.next()];
      
      expect(seq1).toEqual(seq2);
    });

    it('should produce values between 0 and 1', () => {
      const rng = new SeededRandom(42);
      for (let i = 0; i < 100; i++) {
        const val = rng.next();
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(1);
      }
    });

    it('nextInt should produce values within range', () => {
      const rng = new SeededRandom(42);
      for (let i = 0; i < 100; i++) {
        const val = rng.nextInt(10);
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(10);
      }
    });
  });
});
