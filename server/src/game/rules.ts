// ============================================================
// GAME RULES MODULE - Game rules and validations
// ============================================================

import type { Card, CardColor, GamePlayer } from '@uno/shared';
import { CARD_POINTS } from '@uno/shared';
import { shuffleDeck } from './shuffle.js';

// ============================================================
// VALIDATION FUNCTIONS
// ============================================================

/**
 * Validates if a card can be played on top of another card
 * @param playedCard - The card being played
 * @param topCard - The current top card on discard pile
 * @param currentColor - The current active color (after Wild selection)
 * @returns true if the card can be played
 */
export function canPlayCard(
  playedCard: Card,
  topCard: Card,
  currentColor: CardColor
): boolean {
  // Wild card (Wild, Wild Draw 4) can always be played
  if (playedCard.color === 'black') {
    return true;
  }

  // Matches current active color
  if (playedCard.color === currentColor) {
    return true;
  }

  // Matches top card value (regardless of color)
  if (playedCard.value === topCard.value) {
    return true;
  }

  return false;
}

/**
 * Gets all playable cards from a player's hand
 * @param hand - Player's hand
 * @param topCard - Current top card
 * @param currentColor - Current active color
 * @returns Array of playable cards
 */
export function getPlayableCards(
  hand: Card[],
  topCard: Card,
  currentColor: CardColor
): Card[] {
  return hand.filter((card) => canPlayCard(card, topCard, currentColor));
}

// ============================================================
// TURN & ACTION CARD EFFECTS
// ============================================================

/**
 * Calculates the next player index taking into account direction and step
 * @param currentIndex - Current player index
 * @param playerCount - Total number of players
 * @param direction - Direction (1 for clockwise, -1 for counter-clockwise)
 * @param step - Number of steps forward (default: 1)
 * @returns Next player index
 */
export function getNextPlayerIndex(
  currentIndex: number,
  playerCount: number,
  direction: 1 | -1,
  step: number = 1
): number {
  if (playerCount <= 0) return 0;
  const delta = direction * step;
  return ((currentIndex + delta) % playerCount + playerCount) % playerCount;
}

/**
 * Handles Skip card effect: advances turn past the next player
 * @param currentPlayerIndex - Index of player who played skip
 * @param playerCount - Total number of players
 * @param direction - Current direction (1 or -1)
 * @returns Next player index (skipping 1 player)
 */
export function handleSkip(
  currentPlayerIndex: number,
  playerCount: number,
  direction: 1 | -1
): number {
  return getNextPlayerIndex(currentPlayerIndex, playerCount, direction, 2);
}

/**
 * Handles Reverse card effect
 * @param playerCount - Number of players
 * @param direction - Current direction
 * @returns New direction (inverted)
 */
export function handleReverse(
  _playerCount: number,
  direction: 1 | -1
): 1 | -1 {
  return direction === 1 ? -1 : 1;
}

/**
 * Handles Draw 2 card effect
 * @param _deck - Current deck
 * @param _currentPlayerIndex - Index of player who played Draw 2
 * @returns Number of cards to draw for next player (2)
 */
export function handleDraw2(
  _deck: Card[],
  _currentPlayerIndex: number
): number {
  return 2;
}

/**
 * Handles Wild card color selection
 * @param chosenColor - Color chosen by player
 * @returns The chosen color
 */
export function handleWild(chosenColor: CardColor): CardColor {
  if (!isPlayableColor(chosenColor)) {
    throw new Error(`Invalid color chosen: ${chosenColor}`);
  }
  return chosenColor;
}

/**
 * Handles Wild Draw 4 card
 * @param chosenColor - Color chosen by player
 * @returns Number of cards to draw (4) and chosen color
 */
export function handleWildDraw4(chosenColor: CardColor): {
  drawCount: number;
  color: CardColor;
} {
  if (!isPlayableColor(chosenColor)) {
    throw new Error(`Invalid color chosen: ${chosenColor}`);
  }
  return { drawCount: 4, color: chosenColor };
}

// ============================================================
// UNO CALL VALIDATION
// ============================================================

/**
 * Checks if UNO can be called by a player
 * @param player - The player who wants to call UNO
 * @returns true if UNO can be called (has 1 or 2 cards and not yet called)
 */
export function canCallUno(player: GamePlayer): boolean {
  return player.cards.length <= 2 && !player.unoCalled;
}

/**
 * Checks for missed UNO call (catch system)
 * @param player - The player who may have missed UNO
 * @param wasCalledByOpponent - Whether an opponent called UNO for them
 * @returns true if player should draw penalty cards
 */
export function checkMissedUno(
  player: GamePlayer,
  wasCalledByOpponent: boolean
): boolean {
  return player.cards.length === 1 && !player.unoCalled && wasCalledByOpponent;
}

// ============================================================
// WIN CONDITION & SCORING
// ============================================================

/**
 * Checks if a player has won (has no cards left)
 * @param player - The player to check
 * @returns true if player has won
 */
export function checkWin(player: GamePlayer): boolean {
  return player.cards.length === 0;
}

/**
 * Calculates score for a round
 * @param winner - The winning player
 * @param players - All players
 * @returns Map of player IDs to their scores
 */
export function calculateScore(
  winner: GamePlayer,
  players: GamePlayer[]
): Map<string, number> {
  const scores = new Map<string, number>();
  let totalScore = 0;

  for (const player of players) {
    if (player.id !== winner.id) {
      totalScore += getHandPoints(player.cards);
      scores.set(player.id, 0);
    }
  }

  scores.set(winner.id, totalScore);
  return scores;
}

/**
 * Replenishes the draw deck from discard pile when deck is low or empty
 * Keeps top card of discard pile and shuffles the rest into deck
 * @param deck - Current deck
 * @param discardPile - Current discard pile
 * @returns Updated deck and discard pile
 */
export function replenishDeck(
  deck: Card[],
  discardPile: Card[]
): { newDeck: Card[]; newDiscardPile: Card[] } {
  if (discardPile.length <= 1) {
    return { newDeck: deck, newDiscardPile: discardPile };
  }

  const topCard = discardPile[discardPile.length - 1];
  const cardsToShuffle = discardPile.slice(0, -1);
  const shuffled = shuffleDeck(cardsToShuffle);

  return {
    newDeck: [...deck, ...shuffled],
    newDiscardPile: [topCard],
  };
}

// ============================================================
// VALIDATION HELPERS
// ============================================================

/**
 * Checks if a color is a valid playable color (non-black)
 */
export function isPlayableColor(color: CardColor): boolean {
  return color === 'red' || color === 'blue' || color === 'green' || color === 'yellow';
}

/**
 * Checks if a card is a wild card
 */
export function isWildCard(card: Card): boolean {
  return card.color === 'black';
}

/**
 * Checks if a card is a number card
 */
export function isNumberCard(card: Card): boolean {
  return ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(card.value);
}

/**
 * Checks if a card is an action card (skip, reverse, draw2)
 */
export function isActionCard(card: Card): boolean {
  return ['skip', 'reverse', 'draw2'].includes(card.value);
}

/**
 * Gets the point value of a card
 */
export function getCardPoints(card: Card): number {
  return CARD_POINTS[card.value] ?? 0;
}

/**
 * Gets the total points in a player's hand
 */
export function getHandPoints(hand: Card[]): number {
  return hand.reduce((total, card) => total + getCardPoints(card), 0);
}
