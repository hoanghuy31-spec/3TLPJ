import { describe, it, expect } from 'vitest';
import type { Card, GamePlayer } from '@uno/shared';
import {
  canPlayCard,
  getPlayableCards,
  getNextPlayerIndex,
  handleSkip,
  handleReverse,
  handleDraw2,
  handleWild,
  handleWildDraw4,
  canCallUno,
  checkMissedUno,
  checkWin,
  calculateScore,
  replenishDeck,
  isPlayableColor,
  isWildCard,
  isNumberCard,
  isActionCard,
  getCardPoints,
  getHandPoints,
} from './rules.js';

describe('Game Rules Module', () => {
  const red5: Card = { id: 'r5', color: 'red', value: '5' };
  const redSkip: Card = { id: 'rskip', color: 'red', value: 'skip' };
  const blue5: Card = { id: 'b5', color: 'blue', value: '5' };
  const blue7: Card = { id: 'b7', color: 'blue', value: '7' };
  const greenReverse: Card = { id: 'grev', color: 'green', value: 'reverse' };
  const wild: Card = { id: 'w1', color: 'black', value: 'wild' };
  const wildDraw4: Card = { id: 'wd4', color: 'black', value: 'wild_draw4' };

  describe('canPlayCard', () => {
    it('should allow playing a card with the same color', () => {
      expect(canPlayCard(redSkip, red5, 'red')).toBe(true);
    });

    it('should allow playing a card with the same value but different color', () => {
      expect(canPlayCard(blue5, red5, 'red')).toBe(true);
    });

    it('should allow playing a wild card regardless of top card', () => {
      expect(canPlayCard(wild, red5, 'red')).toBe(true);
      expect(canPlayCard(wildDraw4, greenReverse, 'green')).toBe(true);
    });

    it('should disallow playing a card with neither matching color nor value', () => {
      expect(canPlayCard(blue7, red5, 'red')).toBe(false);
      expect(canPlayCard(greenReverse, red5, 'red')).toBe(false);
    });

    it('should respect the active currentColor after a wild card', () => {
      // Top card was wild, active color was chosen as 'yellow'
      const yellow2: Card = { id: 'y2', color: 'yellow', value: '2' };
      expect(canPlayCard(yellow2, wild, 'yellow')).toBe(true);
      expect(canPlayCard(blue5, wild, 'yellow')).toBe(false);
    });
  });

  describe('getPlayableCards', () => {
    it('should filter only playable cards from hand', () => {
      const hand: Card[] = [redSkip, blue5, blue7, greenReverse, wild];
      const playable = getPlayableCards(hand, red5, 'red');

      // Playable: redSkip (same color), blue5 (same value), wild (wild card)
      expect(playable.map((c) => c.id)).toEqual(['rskip', 'b5', 'w1']);
    });

    it('should return empty array if no cards can be played', () => {
      const hand: Card[] = [blue7, greenReverse];
      const playable = getPlayableCards(hand, red5, 'red');
      expect(playable).toEqual([]);
    });
  });

  describe('getNextPlayerIndex', () => {
    it('should advance clockwise correctly', () => {
      expect(getNextPlayerIndex(0, 4, 1)).toBe(1);
      expect(getNextPlayerIndex(3, 4, 1)).toBe(0);
    });

    it('should advance counter-clockwise correctly', () => {
      expect(getNextPlayerIndex(1, 4, -1)).toBe(0);
      expect(getNextPlayerIndex(0, 4, -1)).toBe(3);
    });

    it('should handle custom step amounts (e.g. skip)', () => {
      expect(getNextPlayerIndex(0, 4, 1, 2)).toBe(2);
      expect(getNextPlayerIndex(3, 4, 1, 2)).toBe(1);
      expect(getNextPlayerIndex(0, 4, -1, 2)).toBe(2);
    });
  });

  describe('Action card handlers', () => {
    it('handleSkip should advance turn by 2 positions', () => {
      expect(handleSkip(0, 4, 1)).toBe(2);
      expect(handleSkip(2, 4, 1)).toBe(0);
      expect(handleSkip(1, 4, -1)).toBe(3);
    });

    it('handleReverse should invert direction', () => {
      expect(handleReverse(4, 1)).toBe(-1);
      expect(handleReverse(4, -1)).toBe(1);
    });

    it('handleDraw2 should return 2 cards to draw', () => {
      expect(handleDraw2([], 0)).toBe(2);
    });

    it('handleWild should return chosen color and reject invalid', () => {
      expect(handleWild('blue')).toBe('blue');
      expect(handleWild('yellow')).toBe('yellow');
      expect(() => handleWild('black')).toThrow();
    });

    it('handleWildDraw4 should return 4 cards and chosen color', () => {
      const result = handleWildDraw4('green');
      expect(result.drawCount).toBe(4);
      expect(result.color).toBe('green');
      expect(() => handleWildDraw4('black')).toThrow();
    });
  });

  describe('UNO call validation', () => {
    const makePlayer = (cardCount: number, unoCalled: boolean): GamePlayer => ({
      id: 'p1',
      name: 'Player 1',
      isReady: true,
      cards: Array.from({ length: cardCount }, (_, i) => ({
        id: `c${i}`,
        color: 'red',
        value: '1',
      })),
      unoCalled,
    });

    it('canCallUno should return true for 1 or 2 cards when not called', () => {
      expect(canCallUno(makePlayer(2, false))).toBe(true);
      expect(canCallUno(makePlayer(1, false))).toBe(true);
      expect(canCallUno(makePlayer(2, true))).toBe(false);
      expect(canCallUno(makePlayer(3, false))).toBe(false);
    });

    it('checkMissedUno should catch player with 1 card who did not call UNO', () => {
      expect(checkMissedUno(makePlayer(1, false), true)).toBe(true);
      expect(checkMissedUno(makePlayer(1, true), true)).toBe(false);
      expect(checkMissedUno(makePlayer(2, false), true)).toBe(false);
    });
  });

  describe('Win condition and scoring', () => {
    it('checkWin should return true only when player has 0 cards', () => {
      const winner: GamePlayer = {
        id: 'w',
        name: 'Winner',
        isReady: true,
        cards: [],
        unoCalled: true,
      };
      const playerWithCards: GamePlayer = {
        id: 'p',
        name: 'Player',
        isReady: true,
        cards: [red5],
        unoCalled: false,
      };

      expect(checkWin(winner)).toBe(true);
      expect(checkWin(playerWithCards)).toBe(false);
    });

    it('calculateScore should give winner the sum of points of all opponents cards', () => {
      const winner: GamePlayer = { id: 'w', name: 'Winner', isReady: true, cards: [], unoCalled: true };
      const p1: GamePlayer = { id: 'p1', name: 'P1', isReady: true, cards: [red5, redSkip], unoCalled: false }; // 5 + 20 = 25
      const p2: GamePlayer = { id: 'p2', name: 'P2', isReady: true, cards: [wild], unoCalled: false }; // 50

      const scores = calculateScore(winner, [winner, p1, p2]);
      expect(scores.get('w')).toBe(75);
      expect(scores.get('p1')).toBe(0);
      expect(scores.get('p2')).toBe(0);
    });
  });

  describe('replenishDeck', () => {
    it('should keep top discard card and shuffle the rest into deck', () => {
      const deck: Card[] = [];
      const discardPile: Card[] = [red5, blue5, greenReverse, redSkip]; // 4 cards

      const result = replenishDeck(deck, discardPile);
      expect(result.newDiscardPile).toEqual([redSkip]); // top card kept
      expect(result.newDeck).toHaveLength(3);
    });

    it('should do nothing if discard pile has 1 or fewer cards', () => {
      const deck: Card[] = [red5];
      const discardPile: Card[] = [blue5];
      const result = replenishDeck(deck, discardPile);
      expect(result.newDeck).toEqual(deck);
      expect(result.newDiscardPile).toEqual(discardPile);
    });
  });

  describe('Helpers and points', () => {
    it('isPlayableColor', () => {
      expect(isPlayableColor('red')).toBe(true);
      expect(isPlayableColor('blue')).toBe(true);
      expect(isPlayableColor('green')).toBe(true);
      expect(isPlayableColor('yellow')).toBe(true);
      expect(isPlayableColor('black')).toBe(false);
    });

    it('isWildCard, isNumberCard, isActionCard', () => {
      expect(isWildCard(wild)).toBe(true);
      expect(isWildCard(red5)).toBe(false);

      expect(isNumberCard(red5)).toBe(true);
      expect(isNumberCard(redSkip)).toBe(false);

      expect(isActionCard(redSkip)).toBe(true);
      expect(isActionCard(wild)).toBe(false);
    });

    it('getCardPoints and getHandPoints', () => {
      expect(getCardPoints(red5)).toBe(5);
      expect(getCardPoints(redSkip)).toBe(20);
      expect(getCardPoints(wild)).toBe(50);
      expect(getCardPoints(wildDraw4)).toBe(50);

      expect(getHandPoints([red5, redSkip, wild])).toBe(75);
    });
  });
});
