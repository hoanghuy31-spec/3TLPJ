# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

#### shared/
- **Types**: `Card`, `Player`, `Room`, `GameState`, `GamePlayer` interfaces
- **Enums**: `CardColor`, `CardValue`, `RoomStatus`, `GameStatus`, `GameDirection`
- **Socket Types**: `ServerToClientEvents`, `ClientToServerEvents` interfaces
- **Constants**:
  - `GAME_CONFIG` - Game configuration (hand size, player limits, ports)
  - `SOCKET_EVENTS` - All Socket.IO event names
  - `CARD_POINTS` - Point values for scoring
  - `STANDARD_DECK_COMPOSITION` - 108-card deck specification

#### server/src/game/
- **`createDeck()`** - Creates a standard 108-card UNO deck
- **`createCustomDeck()`** - Creates a deck with custom composition
- **`getDeckSize()`** - Returns 108
- **`verifyDeck()`** - Validates deck composition
- **`shuffleDeck()`** - Fisher-Yates shuffle (returns new array)
- **`shuffleDeckInPlace()`** - Fisher-Yates shuffle (modifies in place)
- **`shuffleDeckSeeded()`** - Deterministic shuffle for testing
- **`SeededRandom`** - Seeded RNG class (Mulberry32)
- **`dealCards()`** - Deals cards to players
- **`createGamePlayers()`** - Creates GamePlayer objects with hands
- **`drawCards()`** - Draws specific number of cards from deck
- **`initializeRound()`** - Initializes a new round
- **`canPlayCard()`** - Placeholder for card validation
- **`getPlayableCards()`** - Placeholder for filtering playable cards

#### server/
- **Express server** with CORS and JSON parsing
- **`/health` endpoint** - Health check with status, timestamp, uptime
- **Socket.IO** integration with type-safe events
- **Room management**:
  - `room:create` - Create a new room
  - `room:join` - Join existing room
  - `room:leave` - Leave current room
  - `room:ready` - Toggle ready status
- **Auto-cleanup** on player disconnect
- **Host transfer** when host leaves

#### client/src/
- **`Home` component** - Create room / join room UI
- **`Lobby` component** - Player list, ready system, room code display
- **Socket management**:
  - `getSocket()` - Get socket instance
  - `connectSocket()` - Connect with promise
  - `disconnectSocket()` - Cleanup
  - `useSocket()` - React hook

#### Infrastructure
- **Monorepo** with npm workspaces
- **TypeScript** strict mode enabled
- **ESLint + Prettier** configuration
- **Vitest** for unit testing
- **GitHub Actions** CI/CD workflow

### Tests

- **46 unit tests** for game logic (verified passing)
  - `deck.test.ts` - 16 tests (creation, verification)
  - `shuffle.test.ts` - 12 tests (shuffle algorithms, seeded)
  - `deal.test.ts` - 18 tests (dealing, drawing, initialization)

---

## [0.1.0] - 2024-01-01

### Added
- Initial skeleton release with basic room functionality
