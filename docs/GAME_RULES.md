# Game Rules

> **Note**: These rules are for reference. Full implementation is planned for M2+.

## Overview

The game is played with a deck of 108 cards consisting of:
- Number cards 0-9 in 4 colors (Red, Blue, Green, Yellow)
- Action cards: Skip, Reverse, Draw 2
- Wild cards: Wild, Wild Draw 4

## Setup

1. Each player receives 7 cards
2. One card is placed face-up to start the discard pile
3. Remaining cards form the draw pile

## Gameplay

### Playing Cards

A card can be played if it matches:
- The color of the top discard
- The number/value of the top discard
- It is a Wild card

### Turn Order

- Players take turns clockwise (or counter-clockwise if Reverse is played)
- Each turn, a player must play a valid card or draw from the pile

### Action Cards

| Card | Effect |
|------|--------|
| Skip | Next player loses their turn |
| Reverse | Changes direction of play |
| Draw 2 | Next player draws 2 cards and loses turn |
| Wild | Player chooses next color |
| Wild Draw 4 | Player chooses color + next player draws 4 |

### Special Rules

#### UNO Call
- When a player has exactly 1 card left, they must call "UNO"
- Failure to call results in drawing 2 penalty cards
- Other players can catch missed UNO calls

#### Challenge Rule (Optional)
- A Wild Draw 4 can be challenged
- If the player had a playable non-wild card, they draw 4 instead
- Otherwise, the challenger draws 2

## Scoring (Optional)

When a player runs out of cards, others score points for remaining cards:

| Card Type | Points |
|-----------|--------|
| Number 0-9 | Face value |
| Skip, Reverse, Draw 2 | 20 |
| Wild, Wild Draw 4 | 50 |

## Win Condition

- First player to empty their hand wins the round
- Optional: First to 500 points wins the match
