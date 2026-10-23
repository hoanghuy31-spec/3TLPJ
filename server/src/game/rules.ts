// ============================================================
// GAME RULES MODULE - Game rules and validations
// ============================================================

import type { Card, CardColor, GamePlayer } from '@uno/shared';
import { CARD_POINTS } from '@uno/shared';

// ============================================================
// TODO M2: VALIDATION FUNCTIONS
// ============================================================

/**
 * TODO M2.1: Validate if a card can be played on top of another card
 * @param playedCard - The card being played
 * @param topCard - The current top card on discard pile
 * @param currentColor - The current active color (after Wild selection)
 * @returns true if the card can be played
 */
export function canPlayCard(
  _playedCard: Card,
  _topCard: Card,
  _currentColor: CardColor
): boolean {
  // TODO M2.1: Implementation needed
  // - Same color
  // - Same value
  // - Wild card (any time)
  // - Match current color (for wild cards)
  return true; // Placeholder
}

/**
 * TODO M2.2: Get all playable cards from a player's hand
 * @param hand - Player's hand
 * @param topCard - Current top card
 * @param currentColor - Current active color
 * @returns Array of playable cards
 */
export function getPlayableCards(
  _hand: Card[],
  _topCard: Card,
  _currentColor: CardColor
): Card[] {
  // TODO M2.2: Filter hand for playable cards
  return []; // Placeholder
}

// ============================================================
// TODO M2: ACTION CARD EFFECTS
// ============================================================

/**
 * TODO M2.3: Handle Skip card effect
 * @param currentPlayerIndex - Index of player who played skip
 * @param playerCount - Total number of players
 * @param direction - Current direction (1 or -1)
 * @returns Next player index (same as current, as skip means skip next player)
 */
export function handleSkip(
  currentPlayerIndex: number,
  _playerCount: number,
  _direction: 1 | -1
): number {
  // TODO M2.3: Skip the next player
  return currentPlayerIndex; // Placeholder
}

/**
 * TODO M2.4: Handle Reverse card effect
 * @param playerCount - Number of players
 * @param direction - Current direction
 * @returns New direction
 */
export function handleReverse(
  playerCount: number,
  direction: 1 | -1
): 1 | -1 {
  // TODO M2.4: Reverse direction (in 2-player, acts like Skip)
  return direction; // Placeholder
}

/**
 * TODO M2.5: Handle Draw 2 card effect
 * @param deck - Current deck
 * @param currentPlayerIndex - Index of player who played Draw 2
 * @returns Number of cards to draw for next player
 */
export function handleDraw2(
  _deck: Card[],
  _currentPlayerIndex: number
): number {
  // TODO M2.5: Next player draws 2 cards
  return 0; // Placeholder
}

/**
 * TODO M2.6: Handle Wild card
 * @param chosenColor - Color chosen by player
 * @returns The chosen color
 */
export function handleWild(chosenColor: CardColor): CardColor {
  // TODO M2.6: Return the chosen color
  return chosenColor;
}

/**
 * TODO M2.7: Handle Wild Draw 4 card
 * @param chosenColor - Color chosen by player
 * @returns Number of cards to draw and chosen color
 */
export function handleWildDraw4(chosenColor: CardColor): { drawCount: number; color: CardColor } {
  // TODO M2.7: Next player draws 4 cards
  return { drawCount: 4, color: chosenColor };
}

// ============================================================
// TODO M2: UNO CALL VALIDATION
// ============================================================

/**
 * TODO M2.8: Check if UNO can be called
 * @param player - The player who wants to call UNO
 * @returns true if UNO can be called
 */
export function canCallUno(player: GamePlayer): boolean {
  // TODO M2.8: 
  // - Player must have exactly 2 cards
  // - UNO has not been called yet
  return player.cards.length === 2 && !player.unoCalled;
}

/**
 * TODO M2.9: Check for missed UNO call (challenge system)
 * @param player - The player who may have missed UNO
 * @param wasCalledByOpponent - Whether an opponent called UNO for them
 * @returns true if player should draw penalty cards
 */
export function checkMissedUno(
  _player: GamePlayer,
  _wasCalledByOpponent: boolean
): boolean {
  // TODO M2.9:
  // - If player has 1 card and didn't call UNO, they should draw
  // - If someone caught them, apply penalty
  return false; // Placeholder
}

// ============================================================
// TODO M2: WIN CONDITION
// ============================================================

/**
 * TODO M2.10: Check if a player has won (has no cards left)
 * @param player - The player to check
 * @returns true if player has won
 */
export function checkWin(player: GamePlayer): boolean {
  // TODO M2.10: Player wins if they have no cards
  return player.cards.length === 0;
}

/**
 * TODO M2.11: Calculate score for a round
 * @param winner - The winning player
 * @param players - All players
 * @returns Map of player IDs to their scores
 */
export function calculateScore(
  _winner: GamePlayer,
  _players: GamePlayer[]
): Map<string, number> {
  // TODO M2.11:
  // - Winner gets points for all cards in other players' hands
  // - Number cards: face value
  // - Action cards: 20 points
  // - Wild cards: 50 points
  return new Map(); // Placeholder
}

// ============================================================
// VALIDATION HELPERS
// ============================================================

/**
 * Checks if a color is a valid playable color (non-black)
 */
export function isPlayableColor(color: CardColor): boolean {
  return color !== 'black';
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
