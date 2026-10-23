// ============================================================
// SHUFFLE MODULE - Fisher-Yates shuffle algorithm
// ============================================================

import type { Card } from '@uno/shared';

/**
 * Shuffles an array using Fisher-Yates algorithm (in-place)
 * @param deck - The deck/array to shuffle
 * @returns A new shuffled array (original is not modified)
 */
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}

/**
 * Shuffles an array in place using Fisher-Yates algorithm
 * @param deck - The deck/array to shuffle
 * @returns The same array (modified in place)
 */
export function shuffleDeckInPlace(deck: Card[]): Card[] {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  
  return deck;
}

/**
 * Seeded random number generator (for reproducible shuffles in tests)
 * Uses Mulberry32 algorithm
 */
export class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = seed;
  }

  /**
   * Returns a random number between 0 and 1
   */
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Returns a random integer between 0 and max (exclusive)
   */
  nextInt(max: number): number {
    return Math.floor(this.next() * max);
  }
}

/**
 * Shuffles deck using a seeded random generator
 * Useful for testing where deterministic shuffles are needed
 * @param deck - The deck to shuffle
 * @param seed - Random seed
 * @returns A shuffled array
 */
export function shuffleDeckSeeded(deck: Card[], seed: number): Card[] {
  const shuffled = [...deck];
  const rng = new SeededRandom(seed);

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = rng.nextInt(i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}
