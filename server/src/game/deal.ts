// ============================================================
// DEAL MODULE - Deals cards to players
// ============================================================

import type { Card, GamePlayer, Player } from '@uno/shared';
import { GAME_CONFIG } from '@uno/shared';

/**
 * Deals cards to players from the deck
 * @param deck - The shuffled deck
 * @param players - Array of player information
 * @param cardsPerPlayer - Number of cards to deal to each player
 * @returns Object containing dealt hands and remaining deck
 */
export function dealCards(
  deck: Card[],
  players: { id: string; name: string }[],
  cardsPerPlayer: number = GAME_CONFIG.INITIAL_HAND_SIZE
): { hands: Map<string, Card[]>; remainingDeck: Card[] } {
  if (deck.length < players.length * cardsPerPlayer) {
    throw new Error('Not enough cards in deck to deal');
  }

  const hands = new Map<string, Card[]>();
  let currentIndex = 0;

  for (const player of players) {
    const hand: Card[] = [];
    for (let i = 0; i < cardsPerPlayer; i++) {
      hand.push(deck[currentIndex]);
      currentIndex++;
    }
    hands.set(player.id, hand);
  }

  const remainingDeck = deck.slice(currentIndex);

  return { hands, remainingDeck };
}

/**
 * Creates GamePlayer objects with their dealt hands
 * @param players - Array of basic player info
 * @param hands - Map of player IDs to their card hands
 * @returns Array of GamePlayer objects
 */
export function createGamePlayers(
  players: (Player | { id: string; name: string; avatar?: string; cardSkin?: string })[],
  hands: Map<string, Card[]>
): GamePlayer[] {
  return players.map((player) => ({
    id: player.id,
    name: player.name,
    isReady: false,
    cards: hands.get(player.id) || [],
    unoCalled: false,
    avatar: player.avatar,
    cardSkin: player.cardSkin,
  }));
}

/**
 * Draws a specific number of cards from the deck
 * @param deck - The remaining deck
 * @param count - Number of cards to draw
 * @returns Object containing drawn cards and remaining deck
 */
export function drawCards(
  deck: Card[],
  count: number
): { drawn: Card[]; remaining: Card[] } {
  if (count > deck.length) {
    throw new Error('Not enough cards in deck to draw');
  }

  const drawn = deck.slice(0, count);
  const remaining = deck.slice(count);

  return { drawn, remaining };
}

/**
 * Initializes a new round by dealing cards
 * @param shuffledDeck - The pre-shuffled deck
 * @param players - Array of players
 * @returns Object containing game state components
 */
export function initializeRound(
  shuffledDeck: Card[],
  players: Player[]
): {
  gamePlayers: GamePlayer[];
  deck: Card[];
  discardPile: Card[];
  firstCard: Card;
} {
  // Deal 7 cards to each player
  const { hands, remainingDeck } = dealCards(
    shuffledDeck,
    players,
    GAME_CONFIG.INITIAL_HAND_SIZE
  );

  const gamePlayers = createGamePlayers(players, hands);

  // First card goes to discard pile
  const firstCard = remainingDeck[0];
  const deckAfterDiscard = remainingDeck.slice(1);

  return {
    gamePlayers,
    deck: deckAfterDiscard,
    discardPile: [firstCard],
    firstCard,
  };
}
