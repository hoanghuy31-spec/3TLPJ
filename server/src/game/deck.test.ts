import { describe, it, expect } from 'vitest';
import { createDeck, createCustomDeck, getDeckSize, verifyDeck } from './deck.js';

describe('Deck Module', () => {
  describe('createDeck', () => {
    it('should create a deck with 108 cards', () => {
      const deck = createDeck();
      expect(deck).toHaveLength(108);
    });

    it('should create a deck with unique card IDs', () => {
      const deck = createDeck();
      const ids = deck.map((card) => card.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(108);
    });

    it('should contain all 4 colors', () => {
      const deck = createDeck();
      const colors = new Set(deck.map((card) => card.color));
      expect(colors.has('red')).toBe(true);
      expect(colors.has('blue')).toBe(true);
      expect(colors.has('green')).toBe(true);
      expect(colors.has('yellow')).toBe(true);
      expect(colors.has('black')).toBe(true);
    });

    it('should contain number cards 0-9', () => {
      const deck = createDeck();
      const numberCards = deck.filter((card) =>
        ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(card.value)
      );
      // 0: 1 per color × 4 colors = 4 cards
      // 1-9: 2 per color × 4 colors × 9 values = 72 cards
      // Total = 4 + 72 = 76
      expect(numberCards.length).toBe(76);
    });

    it('should contain 0 card once per color', () => {
      const deck = createDeck();
      const zeros = deck.filter((card) => card.value === '0' && card.color !== 'black');
      expect(zeros).toHaveLength(4); // One for each of red, blue, green, yellow
    });

    it('should contain number cards 1-9 twice per color', () => {
      const deck = createDeck();
      const reds = deck.filter((card) => card.color === 'red');
      const redOnes = reds.filter((card) => card.value === '1');
      expect(redOnes).toHaveLength(2);
    });

    it('should contain action cards (skip, reverse, draw2)', () => {
      const deck = createDeck();
      const skips = deck.filter((card) => card.value === 'skip');
      const reverses = deck.filter((card) => card.value === 'reverse');
      const draw2s = deck.filter((card) => card.value === 'draw2');
      
      // Each should appear 2 times per color = 8 total
      expect(skips).toHaveLength(8);
      expect(reverses).toHaveLength(8);
      expect(draw2s).toHaveLength(8);
    });

    it('should contain wild cards', () => {
      const deck = createDeck();
      const wilds = deck.filter((card) => card.value === 'wild');
      const wildDraw4s = deck.filter((card) => card.value === 'wild_draw4');
      
      expect(wilds).toHaveLength(4);
      expect(wildDraw4s).toHaveLength(4);
      expect(wilds.every((card) => card.color === 'black')).toBe(true);
      expect(wildDraw4s.every((card) => card.color === 'black')).toBe(true);
    });

    it('should have all cards with valid color and value', () => {
      const deck = createDeck();
      const validColors = ['red', 'blue', 'green', 'yellow', 'black'];
      const validValues = [
        '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
        'skip', 'reverse', 'draw2', 'wild', 'wild_draw4'
      ];
      
      for (const card of deck) {
        expect(validColors).toContain(card.color);
        expect(validValues).toContain(card.value);
      }
    });
  });

  describe('createCustomDeck', () => {
    it('should create a deck with specified cards', () => {
      const cards = [
        { color: 'red' as const, value: '1' as const },
        { color: 'blue' as const, value: '5' as const },
      ];
      const deck = createCustomDeck(cards);
      
      expect(deck).toHaveLength(2);
      expect(deck[0].color).toBe('red');
      expect(deck[0].value).toBe('1');
      expect(deck[1].color).toBe('blue');
      expect(deck[1].value).toBe('5');
    });

    it('should create unique IDs for each card', () => {
      const cards = [
        { color: 'red' as const, value: '1' as const },
        { color: 'red' as const, value: '1' as const },
      ];
      const deck = createCustomDeck(cards);
      
      expect(deck[0].id).not.toBe(deck[1].id);
    });
  });

  describe('getDeckSize', () => {
    it('should return 108', () => {
      expect(getDeckSize()).toBe(108);
    });
  });

  describe('verifyDeck', () => {
    it('should return true for a valid deck', () => {
      const deck = createDeck();
      expect(verifyDeck(deck)).toBe(true);
    });

    it('should return false for a deck with wrong size', () => {
      const deck = createDeck().slice(0, 100);
      expect(verifyDeck(deck)).toBe(false);
    });

    it('should return false for a deck with duplicate cards', () => {
      const deck = createDeck();
      // Remove one card and add a duplicate
      deck.pop();
      deck.push(deck[0]);
      expect(verifyDeck(deck)).toBe(false);
    });

    it('should return false for an empty deck', () => {
      expect(verifyDeck([])).toBe(false);
    });
  });
});
