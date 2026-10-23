// ============================================================
// DECK MODULE - Creates and manages the game deck
// ============================================================

import { v4 as uuidv4 } from 'uuid';
import type { Card, CardColor, CardValue } from '@uno/shared';
import { STANDARD_DECK_COMPOSITION } from '@uno/shared';

/**
 * Creates a standard 108-card deck
 * @returns Array of 108 Card objects
 */
export function createDeck(): Card[] {
  const deck: Card[] = [];

  for (const composition of STANDARD_DECK_COMPOSITION) {
    for (let i = 0; i < composition.count; i++) {
      deck.push({
        id: uuidv4(),
        color: composition.color,
        value: composition.value,
      });
    }
  }

  return deck;
}

/**
 * Creates a deck with specified composition (for testing or custom rules)
 * @param cards - Array of card specifications
 * @returns Array of Card objects
 */
export function createCustomDeck(cards: { color: CardColor; value: CardValue }[]): Card[] {
  return cards.map((card) => ({
    id: uuidv4(),
    color: card.color,
    value: card.value,
  }));
}

/**
 * Gets the number of cards in the standard deck
 * @returns 108
 */
export function getDeckSize(): number {
  return 108;
}

/**
 * Verifies deck composition matches standard UNO rules
 * @param deck - The deck to verify
 * @returns true if deck is valid
 */
export function verifyDeck(deck: Card[]): boolean {
  const expected: { color: CardColor; value: CardValue; count: number }[] = [
    // Numbers: 0 (1 each color), 1-9 (2 each color)
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
    // Actions: skip, reverse, draw2 (2 each per color)
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
    // Wild cards: wild, wild_draw4 (4 each)
    { color: 'black', value: 'wild', count: 4 },
    { color: 'black', value: 'wild_draw4', count: 4 },
  ];

  // Count actual cards
  const actualCounts = new Map<string, number>();
  for (const card of deck) {
    const key = `${card.color}:${card.value}`;
    actualCounts.set(key, (actualCounts.get(key) || 0) + 1);
  }

  // Compare with expected
  for (const exp of expected) {
    const key = `${exp.color}:${exp.value}`;
    const actual = actualCounts.get(key) || 0;
    if (actual !== exp.count) {
      return false;
    }
  }

  return deck.length === 108;
}
